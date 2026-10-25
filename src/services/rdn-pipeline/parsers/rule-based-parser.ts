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

    const closeMatch = text.match(/(?:saldo akhir|closing balance|ending balance|saldo kas akhir|cash balance)[\s:]*([0-9]{1,3}(?:[,.][0-9]{3})*(?:\.[0-9]+)?|[0-9]+)/i);
    if (closeMatch && closeMatch[1]) {
      closingBalance = RuleBasedParser.cleanNumber(closeMatch[1]);
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

      // Check for stock ticker in description (e.g. "BUY 10 BBRI @ 4750" or "SETTLEMENT BBRI")
      const tickerMatch = desc.match(/\b([A-Z]{4}(?:-[A-Z0-9]+)?)\b/);
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

    // Pattern 1: BUY/BELI or SELL/JUAL with lots and ticker and price
    // E.g.: "Beli 10 lot BBRI @ 4.750" or "BBRI BUY 10 lot 4750"
    const regex1 = /(beli|buy|jual|sell)\s+([0-9]+(?:\.[0-9]+)?)\s*(?:lot)?\s+([A-Za-z0-9\-]+(?:\.JK)?)\s*@?\s*(?:rp)?\s*([0-9]{1,3}(?:[,.][0-9]{3})+|[0-9]+)/gi;
    let m1;
    while ((m1 = regex1.exec(text)) !== null) {
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
    }

    // Pattern 2: Table format (e.g. Stockbit Trade Confirmation table)
    // Ticker Action Lots Price Value Fee Net
    if (rows.length === 0) {
      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        const tableMatch = line.match(/\b([A-Z]{4}(?:-[A-Z0-9]+)?)(?:\.JK)?\b\s+(BUY|SELL|B|S|BELI|JUAL)\s+([0-9,.]+)\s+([0-9,.]+)/i);
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
      return parseFloat(clean.replace(/,/g, ''));
    }
    if (clean.includes('.')) {
      return parseFloat(clean.replace(/\./g, ''));
    }
    if (clean.includes(',')) {
      return parseFloat(clean.replace(/,/g, ''));
    }
    return parseFloat(clean) || 0;
  }
}
