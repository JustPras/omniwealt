import { RawParsedRow } from '../normalizer';
import { RDNInstitution, RDNStatementType } from '../../../types/rdn-pipeline';

export interface RuleBasedParseResult {
  institution: RDNInstitution;
  statementType: RDNStatementType;
  openingBalance?: number;
  closingBalance?: number;
  rows: RawParsedRow[];
}

export class RuleBasedParser {
  /**
   * Parse Bank RDN Cash Mutation (T+2 Settlement Ledger)
   */
  static parseBankMutation(text: string, institution: RDNInstitution): RuleBasedParseResult {
    const lines = text.split(/\r?\n/);
    const rows: RawParsedRow[] = [];
    let openingBalance: number | undefined;
    let closingBalance: number | undefined;

    // 1. Detect Opening & Closing Balance
    const openMatch = text.match(/(?:saldo awal|opening balance|beginning balance|saldo kas awal)[\s:]*([0-9]{1,3}(?:[,.][0-9]{3})*(?:\.[0-9]+)?|[0-9]+)/i);
    if (openMatch && openMatch[1]) {
      openingBalance = RuleBasedParser.cleanNumber(openMatch[1]);
    }

    const closeMatch = text.match(/(?:saldo akhir|closing balance|ending balance|saldo kas akhir|cash balance|t\s*o\s*t\s*a\s*l)[\s:]*([0-9]{1,3}(?:[,.][0-9]{3})*(?:\.[0-9]+)?|[0-9]+)/i);
    if (closeMatch && closeMatch[1]) {
      closingBalance = RuleBasedParser.cleanNumber(closeMatch[1]);
    } else if (openingBalance !== undefined) {
      closingBalance = openingBalance;
    }

    // 2. Line by line parsing for mutations: Date, Description, Debit/Credit, Running Balance
    // Common pattern: DD/MM/YYYY | Description | Amount | CR/DB or separate columns | Balance
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Check if line starts with date (DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD)
      const dateMatch = line.match(/^([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}|[0-9]{4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,2})/);
      if (!dateMatch) continue;

      const dateStr = dateMatch[1];
      const rest = line.substring(dateStr.length).trim();

      // Extract numbers in line
      const numbers = rest.match(/(?:[0-9]{1,3}(?:[,.][0-9]{3})+(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/g);
      if (!numbers || numbers.length === 0) continue;

      const isCredit = /(cr|kredit|setoran|masuk|top up|topup)/i.test(rest);
      const isDebit = /(db|debit|tarik|keluar|fee|beli)/i.test(rest);

      const parsedAmounts = numbers.map(RuleBasedParser.cleanNumber).filter((n) => n > 0);
      if (parsedAmounts.length === 0) continue;

      let amount = parsedAmounts[0];
      let balance: number | null = parsedAmounts.length > 1 ? parsedAmounts[parsedAmounts.length - 1] : null;

      // Extract description
      let desc = rest.replace(/(?:[0-9]{1,3}(?:[,.][0-9]{3})+(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/g, '').trim();
      desc = desc.replace(/\s+/g, ' ');

      // Check for stock ticker in description (e.g. "BUY 10 BBRI @ 4750" or "SETTLEMENT GOTO-W")
      const tickerMatch = desc.match(/\b([A-Z]{4}(?:-[A-Z0-9]{1,3})?)\b/);
      const ticker = tickerMatch ? tickerMatch[1] : null;

      let categoryHint: string = isCredit ? 'TOPUP' : 'WITHDRAWAL';
      if (/dividen/i.test(desc)) categoryHint = 'DIVIDEND';
      else if (/bunga/i.test(desc)) categoryHint = 'INTEREST';
      else if (/pajak|admin|meterai/i.test(desc)) categoryHint = 'ADMIN_TAX';
      else if (/beli/i.test(desc)) categoryHint = 'BUY';
      else if (/jual/i.test(desc)) categoryHint = 'SELL';

      rows.push({
        date: dateStr,
        categoryHint,
        ticker,
        netAmount: amount,
        grossAmount: amount,
        balance,
        description: desc || `Mutasi Kas RDN ${institution}`,
      });
    }

    // 3. If no cash mutations found, check for Stock Portfolio Holdings Table
    // Format: [TICKER] [Company Name ...] [Quantity (shares)] [Buying Price] [Close Price] [Buying Value] [Market Value]
    if (rows.length === 0) {
      let docDate = new Date().toISOString().split('T')[0];
      const periodMatch = text.match(/(?:date|periode)[\s:]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})\s*(?:-|s\/d|to)\s*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4})/i);
      if (periodMatch && periodMatch[2]) {
        const parts = periodMatch[2].split(/[\/\-\.]/);
        if (parts.length === 3) {
          const d = parts[0].padStart(2, '0');
          const m = parts[1].padStart(2, '0');
          const y = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          docDate = `${y}-${m}-${d}`;
        }
      }

      // Matches standard stocks (BBRI, ARCI) and derivative instruments like Warrants (GOTO-W, HUMI-W2) or Right Issues (BBRI-R)
      const stockHoldingRegex = /\b([A-Z]{4}(?:-[A-Z0-9]{1,3})?)\s+([A-Za-z0-9.,\s&'\-]+?)\s+([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s+([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s+([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s+([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s+([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)/g;

      let sm: RegExpExecArray | null;
      while ((sm = stockHoldingRegex.exec(text)) !== null) {
        const ticker = sm[1];
        const company = sm[2].trim();
        const shares = RuleBasedParser.cleanNumber(sm[3]);
        const buyPrice = RuleBasedParser.cleanNumber(sm[4]);
        const buyValue = RuleBasedParser.cleanNumber(sm[6]);
        const lots = shares >= 100 ? shares / 100 : shares;

        const isWarrant = /-W[0-9A-Z]*$/i.test(ticker);
        const isRight = /-R[0-9A-Z]*$/i.test(ticker);
        const typeDesc = isWarrant ? 'Warrant' : isRight ? 'Right Issue' : 'Saham';

        rows.push({
          date: docDate,
          categoryHint: 'BUY',
          ticker: ticker.endsWith('.JK') ? ticker : `${ticker}.JK`,
          lot: lots,
          price: buyPrice,
          grossAmount: buyValue,
          netAmount: buyValue,
          description: `Portofolio ${typeDesc}: ${ticker} (${company}) ${lots} lot @ Rp ${buyPrice.toLocaleString('id-ID')}`,
        });
      }
    }

    return {
      institution,
      statementType: 'BANK_RDN_MUTATION',
      openingBalance,
      closingBalance,
      rows,
    };
  }

  /**
   * Parse Broker Trade Confirmation (T+0 Trade Slips & Fee Breakdown)
   */
  static parseTradeConfirmation(text: string, institution: RDNInstitution): RuleBasedParseResult {
    const rows: RawParsedRow[] = [];
    const lines = text.split(/\r?\n/);

    // Extract trade date
    let docDate = new Date().toISOString().split('T')[0];
    const docDateMatch = text.match(/(?:trade date|tanggal transaksi|tgl trs)[\s:]*([0-9]{1,2}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{2,4}|[0-9]{4}[\/\-\.][0-9]{1,2}[\/\-\.][0-9]{1,2})/i);
    if (docDateMatch) {
      docDate = docDateMatch[1];
    }

    // Process line-by-line supporting narrative trade slips and table rows
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Pattern 1: BUY/BELI or SELL/JUAL with lots and ticker and price
      // E.g.: "Beli 50 lot GOTO-W @ 12" or "SELL 10 BBRI @ 4750"
      const m1 = line.match(/(beli|buy|jual|sell)\s+([0-9]+(?:\.[0-9]+)?)\s*(?:lot)?\s+([A-Za-z0-9\-]+(?:\.JK)?)\s*@?\s*(?:rp)?\s*([0-9]{1,3}(?:[,.][0-9]{3})+|[0-9]+(?:\.[0-9]+)?)/i);
      if (m1) {
        const action = m1[1].toLowerCase().startsWith('b') ? 'BUY' : 'SELL';
        const lot = parseFloat(m1[2]);
        let ticker = m1[3].toUpperCase();
        const price = RuleBasedParser.cleanNumber(m1[4]);
        const gross = lot * 100 * price;
        const feeRate = action === 'BUY' ? 0.0015 : 0.0025;
        const fee = Math.round(gross * feeRate);
        const net = action === 'BUY' ? gross + fee : gross - fee;

        rows.push({
          date: docDate,
          action,
          ticker,
          lot,
          price,
          grossAmount: gross,
          fee,
          tax: 0,
          netAmount: net,
          description: `${action} ${lot} Lot ${ticker} @ Rp ${price.toLocaleString('id-ID')}`,
        });
        continue;
      }

      // Pattern 2: Table format (e.g. Stockbit Trade Confirmation table)
      // Ticker Action Lots Price Value Fee Net (e.g. "HUMI-W2 BUY 100 5")
      const tableMatch = line.match(/\b([A-Z]{4}(?:-[A-Z0-9]{1,3})?)(?:\.JK)?\b\s+(BUY|SELL|B|S|BELI|JUAL)\s+([0-9,.]+)\s+([0-9,.]+)/i);
      if (tableMatch) {
        const ticker = tableMatch[1].toUpperCase();
        const rawAction = tableMatch[2].toUpperCase();
        const action = rawAction.startsWith('B') ? 'BUY' : 'SELL';
        let num1 = RuleBasedParser.cleanNumber(tableMatch[3]);
        let num2 = RuleBasedParser.cleanNumber(tableMatch[4]);

        let lot = num1 >= 100 && num1 % 100 === 0 ? num1 / 100 : num1;
        let price = num2;
        if (num1 > 100 && num2 <= 1000 && num1 % 100 !== 0) {
          price = num1;
          lot = num2;
        }

        const gross = lot * 100 * price;
        const feeRate = action === 'BUY' ? 0.0015 : 0.0025;
        const fee = Math.round(gross * feeRate);
        const net = action === 'BUY' ? gross + fee : gross - fee;

        rows.push({
          date: docDate,
          action,
          ticker,
          lot,
          price,
          grossAmount: gross,
          fee,
          tax: 0,
          netAmount: net,
          description: `${action} ${lot} Lot ${ticker} @ Rp ${price.toLocaleString('id-ID')}`,
        });
      }
    }

    return {
      institution,
      statementType: 'BROKER_TRADE_CONFIRMATION',
      rows,
    };
  }

  static cleanNumber(str: string): number {
    const clean = str.trim();
    if (clean.includes(',') && clean.includes('.')) {
      if (clean.indexOf(',') < clean.indexOf('.')) {
        return parseFloat(clean.replace(/,/g, ''));
      } else {
        return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
      }
    }
    if (clean.includes('.')) {
      const dotParts = clean.split('.');
      if (dotParts.length === 2 && dotParts[1].length !== 3) {
        return parseFloat(clean);
      }
      return parseFloat(clean.replace(/\./g, ''));
    }
    if (clean.includes(',')) {
      const commaParts = clean.split(',');
      if (commaParts.length === 2 && commaParts[1].length !== 3) {
        return parseFloat(clean.replace(',', '.'));
      }
      return parseFloat(clean.replace(/,/g, ''));
    }
    return parseFloat(clean) || 0;
  }
}
