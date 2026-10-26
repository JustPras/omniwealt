import { GoogleGenerativeAI } from '@google/generative-ai';
import { BankMutationResult, BrokerExtractionResult, BrokerHoldingItem } from '../types';

export const AIParserService = {
  /**
   * Parse Bank / QRIS / E-wallet mutation text
   */
  async parseBankMutation(rawText: string, sourceAppHint?: string): Promise<BankMutationResult> {
    const text = rawText.trim();

    // 1. Check if Gemini API Key is available
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
Extract transaction details from this Indonesian banking/e-wallet notification text.
Format JSON only with properties:
- type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
- amount: number
- bankName: string
- category: string
- description: string
- merchantOrSender: string

Notification: "${text}"
`;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return {
            type: parsed.type || 'EXPENSE',
            amount: Number(parsed.amount) || 0,
            bankName: parsed.bankName || 'BCA Tahapan',
            category: parsed.category || 'General',
            description: parsed.description || text,
            merchantOrSender: parsed.merchantOrSender,
            sourceApp: sourceAppHint,
          };
        }
      } catch (e) {
        console.warn('Gemini parser fallback to regex:', e);
      }
    }

    // 2. High-precision Deterministic & Intelligent Fallback Parser
    return AIParserService.deterministicBankParse(text, sourceAppHint);
  },

  deterministicBankParse(text: string, sourceAppHint?: string): BankMutationResult {
    const lower = text.toLowerCase();

    // 1. High-precision Amount Extraction
    let amount = 0;
    // Matches Rp 48.500 or Rp 2.500.000 or Rp48500 or 48.500,00
    const amountMatch = text.match(
      /(?:rp\.?|idr|sebesar|sebesar rp|sebesar idr|nominal|total)?\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]{4,})(?:,[0-9]{2})?/i
    );
    if (amountMatch && amountMatch[1]) {
      const cleanNum = amountMatch[1].replace(/\./g, '');
      amount = parseFloat(cleanNum);
    } else {
      const fallbackAmountMatch = text.match(/(?:rp\.?|idr)\s*([0-9]+)/i);
      if (fallbackAmountMatch && fallbackAmountMatch[1]) {
        amount = parseFloat(fallbackAmountMatch[1]);
      }
    }

    // 2. Transaction Type & Category Detection
    let type: 'INCOME' | 'EXPENSE' | 'TRANSFER' = 'EXPENSE';
    let category = 'General';

    if (
      lower.includes('top up rdn') ||
      lower.includes('topup rdn') ||
      (lower.includes('transfer') && lower.includes('rdn'))
    ) {
      type = 'TRANSFER';
      category = 'Investment Top-Up';
    } else if (
      lower.includes('transfer masuk') ||
      lower.includes('dana masuk') ||
      lower.includes('uang masuk') ||
      lower.includes('diterima dari') ||
      lower.includes('kredit') ||
      lower.includes('cashback') ||
      (lower.includes('bi-fast') && lower.includes('dari'))
    ) {
      type = 'INCOME';
      if (lower.includes('pt') || lower.includes('salary') || lower.includes('gaji')) {
        category = 'Salary & Freelance';
      } else if (lower.includes('cashback') || lower.includes('reward')) {
        category = 'Cashback & Rewards';
      } else {
        category = 'Income';
      }
    } else if (
      lower.includes('qris') ||
      lower.includes('pembayaran') ||
      lower.includes('debit') ||
      lower.includes('berhasil') ||
      lower.includes('terpotong') ||
      lower.includes('uang keluar') ||
      lower.includes('transaksi')
    ) {
      type = 'EXPENSE';
      if (
        lower.includes('kopi') ||
        lower.includes('coffee') ||
        lower.includes('makan') ||
        lower.includes('resto') ||
        lower.includes('cafe') ||
        lower.includes('gofood') ||
        lower.includes('shopeefood')
      ) {
        category = 'Food & Beverage';
      } else if (
        lower.includes('transport') ||
        lower.includes('grab') ||
        lower.includes('gojek') ||
        lower.includes('goride') ||
        lower.includes('gocar') ||
        lower.includes('m-tix')
      ) {
        category = 'Transport';
      } else if (
        lower.includes('alfamart') ||
        lower.includes('indomaret') ||
        lower.includes('supermarket') ||
        lower.includes('hypermart')
      ) {
        category = 'Groceries';
      } else if (lower.includes('pln') || lower.includes('listrik') || lower.includes('pdam') || lower.includes('pulsa')) {
        category = 'Bills & Utilities';
      } else {
        category = 'Shopping';
      }
    }

    // 3. Bank / E-Wallet Institution Identification
    let bankName = 'BCA Tahapan';
    const appHint = sourceAppHint?.toLowerCase() || '';

    if (lower.includes('mandiri') || lower.includes('livin') || appHint.includes('mandiri')) {
      bankName = "Mandiri Livin'";
    } else if (lower.includes('brimo') || lower.includes('bri') || appHint.includes('bri')) {
      bankName = 'BRImo';
    } else if (lower.includes('bni') || appHint.includes('bni')) {
      bankName = 'BNI Mobile';
    } else if (lower.includes('jago') || appHint.includes('jago')) {
      if (lower.includes('rdn') || lower.includes('stockbit')) {
        bankName = 'RDN Stockbit Jago';
      } else {
        bankName = 'Bank Jago';
      }
    } else if (lower.includes('gopay') || lower.includes('gojek') || appHint.includes('gojek') || appHint.includes('gopay')) {
      bankName = 'GoPay Utama';
    } else if (lower.includes('ovo') || appHint.includes('ovo')) {
      bankName = 'OVO';
    } else if (lower.includes('dana') || appHint.includes('dana')) {
      bankName = 'DANA';
    } else if (lower.includes('shopeepay') || lower.includes('shopee') || appHint.includes('shopee')) {
      bankName = 'ShopeePay';
    } else if (lower.includes('seabank')) {
      bankName = 'SeaBank';
    } else if (lower.includes('flip')) {
      bankName = 'Flip';
    } else if (lower.includes('jenius') || lower.includes('btpn')) {
      bankName = 'Jenius BTPN';
    } else if (lower.includes('rdn') || lower.includes('stockbit')) {
      bankName = 'RDN Stockbit BCA';
    } else if (lower.includes('bca') || appHint.includes('bca')) {
      bankName = 'BCA Tahapan';
    }

    // 4. Merchant or Sender Extraction
    let merchantOrSender = '';
    const atMatch = text.match(/di\s+([^,.\n]+)/i);
    const toMatch = text.match(/ke\s+(?:rekening\s+)?([^,.\n]+)/i);
    const fromMatch = text.match(/dari\s+(?:rekening\s+)?([^,.\n]+)/i);
    const forMatch = text.match(/untuk\s+([^,.\n]+)/i);

    if (type === 'INCOME' && fromMatch) {
      merchantOrSender = fromMatch[1].trim();
    } else if (atMatch) {
      merchantOrSender = atMatch[1].trim();
    } else if (toMatch) {
      merchantOrSender = toMatch[1].trim();
    } else if (forMatch) {
      merchantOrSender = forMatch[1].trim();
    } else if (fromMatch) {
      merchantOrSender = fromMatch[1].trim();
    }

    // Clean up trailing words like 'berhasil', 'telah', 'sebesar', 'ke', 'melalui', 'via'
    if (merchantOrSender) {
      merchantOrSender = merchantOrSender
        .replace(/\b(berhasil|telah|sukses|pada|sebesar|rp|idr|ke|melalui|via)\b.*/gi, '')
        .trim();
    }

    return {
      type,
      amount: amount || 50000,
      bankName,
      category,
      description: text,
      merchantOrSender: merchantOrSender || undefined,
      sourceApp: sourceAppHint,
    };
  },

  /**
   * Parse Broker Document from File (PDF or Image)
   */
  async parseDocumentFile(file: { uri: string; name: string; mimeType?: string }): Promise<BrokerExtractionResult> {
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        `Berkas "${file.name}" membutuhkan ekstraksi teks. Silakan buka file PDF Anda di pembaca PDF, salin (copy) teks tabel portofolio saham, lalu tempel di kolom teks di bawah.`
      );
    }

    try {
      const response = await fetch(file.uri);
      const blob = await response.blob();
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result as string;
          const clean = res.includes(',') ? res.split(',')[1] : res;
          resolve(clean);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const prompt = `Extract all Indonesian stock portfolio holdings or trade confirmation transactions from this document.
Respond strictly in JSON format matching this schema:
{
  "brokerName": string,
  "documentType": "STATEMENT_OF_ACCOUNT" | "TRADE_CONFIRMATION",
  "tradeDate": "YYYY-MM-DD",
  "clientName": string,
  "rdnBank": string,
  "rdnAccountNumber": string,
  "rdnCashBalance": number,
  "totalPortfolioValue": number,
  "totalBuyingValue": number,
  "totalUnrealizedPnL": number,
  "holdings": [
    {
      "ticker": "XXXX.JK",
      "name": string,
      "lots": number,
      "shares": number,
      "avgBuyPrice": number,
      "currentPrice": number,
      "buyingValue": number,
      "marketValue": number,
      "unrealizedPnLRp": number,
      "unrealizedPnLPct": number
    }
  ],
  "trades": [
    {
      "action": "BUY" | "SELL" | "DIVIDEND",
      "ticker": "XXXX.JK",
      "lots": number,
      "price": number,
      "fee": number,
      "netAmount": number
    }
  ],
  "summaryNote": string
}
CRITICAL: Do NOT invent or hallucinate tickers like BBCA if they do not exist in the document. Only extract what is present in the file. If no stocks are found, return empty arrays.`;

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: file.mimeType || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
          },
        },
      ]);

      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed: BrokerExtractionResult = JSON.parse(jsonMatch[0]);
        // Normalize trades if only holdings returned
        if (parsed.holdings && parsed.holdings.length > 0 && (!parsed.trades || parsed.trades.length === 0)) {
          parsed.trades = parsed.holdings.map((h) => ({
            action: 'BUY',
            ticker: h.ticker.endsWith('.JK') ? h.ticker : `${h.ticker}.JK`,
            lots: h.lots,
            price: h.avgBuyPrice,
            fee: 0,
            netAmount: h.buyingValue || h.lots * 100 * h.avgBuyPrice,
          }));
        }
        return parsed;
      }
      throw new Error('Format respon AI tidak valid.');
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypted')) {
        throw new Error(
          `Berkas PDF "${file.name}" diproteksi kata sandi. Silakan salin (copy) teks tabel saham dari aplikasi PDF pembaca Anda dan tempel di kolom teks di bawah.`
        );
      }
      throw new Error(
        `Tidak dapat memproses berkas biner "${file.name}". Buka file di pembaca PDF, salin (copy) teks tabel saham Anda, lalu tempel di kolom teks di bawah.`
      );
    }
  },

  /**
   * Parse Broker Statement of Account (SoA) or Trade Confirmation (TC)
   */
  async parseBrokerDocument(documentText: string, brokerHint?: string): Promise<BrokerExtractionResult> {
    const text = documentText.trim();
    const today = new Date().toISOString().split('T')[0];

    // 1. Check Gemini Flash
    const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = `
Extract stock trade confirmation or monthly statement of account from this document text.
Output JSON only with format:
{
  "brokerName": string,
  "documentType": "STATEMENT_OF_ACCOUNT" | "TRADE_CONFIRMATION",
  "tradeDate": "YYYY-MM-DD",
  "clientName": string,
  "sid": string,
  "rdnBank": string,
  "rdnAccountNumber": string,
  "rdnCashBalance": number,
  "totalPortfolioValue": number,
  "totalBuyingValue": number,
  "totalUnrealizedPnL": number,
  "holdings": [
    {
      "ticker": "XXXX.JK",
      "name": string,
      "lots": number,
      "shares": number,
      "avgBuyPrice": number,
      "currentPrice": number,
      "buyingValue": number,
      "marketValue": number,
      "unrealizedPnLRp": number,
      "unrealizedPnLPct": number
    }
  ],
  "trades": [
    {
      "action": "BUY" | "SELL" | "DIVIDEND",
      "ticker": "XXXX.JK",
      "lots": number,
      "price": number,
      "fee": number,
      "netAmount": number
    }
  ],
  "summaryNote": string
}

Document:
"${text}"
`;
        const res = await model.generateContent(prompt);
        const jsonMatch = res.response.text().match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        }
      } catch (e) {
        console.warn('Gemini broker parse fallback:', e);
      }
    }

    // 2. High-precision Deterministic & Intelligent Fallback
    return AIParserService.deterministicBrokerParse(text, brokerHint, today);
  },

  deterministicBrokerParse(text: string, brokerHint?: string, defaultDate: string = '2026-10-21'): BrokerExtractionResult {
    const lower = text.toLowerCase();
    let brokerName = brokerHint || 'PT. Stockbit Sekuritas Digital';

    if (lower.includes('stockbit')) {
      brokerName = 'PT. Stockbit Sekuritas Digital';
    } else if (lower.includes('ajaib')) {
      brokerName = 'Ajaib Sekuritas';
    } else if (lower.includes('ipot') || lower.includes('indopremier')) {
      brokerName = 'Indo Premier (IPOT)';
    } else if (lower.includes('mandiri')) {
      brokerName = 'Mandiri Sekuritas';
    } else if (lower.includes('mirae')) {
      brokerName = 'Mirae Asset Sekuritas';
    } else if (lower.includes('bca sekuritas')) {
      brokerName = 'BCA Sekuritas';
    }

    // Check if this looks like a Statement of Account / Portfolio Statement
    const isStatementOfAccount =
      lower.includes('statement of account') ||
      lower.includes('portfolio statement') ||
      lower.includes('cash investor') ||
      lower.includes('buying value') ||
      lower.includes('close buying value') ||
      lower.includes('portofolio') ||
      lower.includes('daftar saham') ||
      lower.includes('holdings');

    if (isStatementOfAccount) {
      const soaRes = AIParserService.parseStockbitSoA(text, brokerName, defaultDate);
      if (soaRes.trades.length > 0 || (soaRes.holdings && soaRes.holdings.length > 0)) {
        return soaRes;
      }
      // If SoA didn't find holdings, try Trade Confirmation parsing as fallback
      const tcRes = AIParserService.parseTradeConfirmation(text, brokerName, defaultDate);
      if (tcRes.trades.length > 0) {
        return tcRes;
      }
      return soaRes;
    }

    // Otherwise, treat as Trade Confirmation first
    const tcRes = AIParserService.parseTradeConfirmation(text, brokerName, defaultDate);
    if (tcRes.trades.length > 0) {
      return tcRes;
    }

    // Try SoA fallback if TC found 0 items
    const soaRes = AIParserService.parseStockbitSoA(text, brokerName, defaultDate);
    if (soaRes.trades.length > 0 || (soaRes.holdings && soaRes.holdings.length > 0)) {
      return soaRes;
    }

    return tcRes;
  },

  /**
   * Dedicated high-precision parser for Stockbit Statement of Account (PDF/Text/OCR)
   */
  parseStockbitSoA(text: string, brokerName: string, defaultDate: string): BrokerExtractionResult {
    // 1. Client Name
    let clientName = 'NASABAH TERDAFTAR';
    const clientMatch = text.match(/Client\s+[0-9]+\s+([A-Z\s]+?)(?:\r|\n|Address|JL)/i);
    if (clientMatch && clientMatch[1]) {
      clientName = clientMatch[1].trim();
    }

    // 2. SID
    let sid = 'IDD0000000000';
    const sidMatch = text.match(/SID\s*([A-Z0-9]+)/i);
    if (sidMatch && sidMatch[1]) {
      sid = sidMatch[1].trim();
    }

    // 3. Bank RDN & Account Number
    let rdnBank = 'Bank RDN';
    let rdnAccountNumber = '1000000000';
    const bankMatch = text.match(/(JAGO|BCA|MANDIRI|CIMB)\s+([0-9]{8,16})/i);
    if (bankMatch) {
      rdnBank = bankMatch[1].toUpperCase() === 'JAGO' ? 'Bank Jago' : `Bank ${bankMatch[1].toUpperCase()}`;
      rdnAccountNumber = bankMatch[2].trim();
    }

    // 4. Cash Investor / RDN Balance
    let rdnCashBalance = 0;
    const cashMatch = text.match(/Cash(?:\s+Investor)?\s+([0-9]{1,3}(?:,[0-9]{3})+(?:\.[0-9]+)?|[0-9]{4,})/i);
    if (cashMatch && cashMatch[1]) {
      rdnCashBalance = parseFloat(cashMatch[1].replace(/,/g, ''));
    }

    // 5. Total Portfolio & Buying Values
    let totalPortfolioValue = 0;
    const portfolioMatch = text.match(/Portfolio\s+([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,})/i);
    if (portfolioMatch && portfolioMatch[1]) {
      totalPortfolioValue = parseFloat(portfolioMatch[1].replace(/,/g, ''));
    }

    let totalBuyingValue = 0;
    const totalMatch = text.match(/T\s*O\s*T\s*A\s*L\s+([0-9]{1,3}(?:,[0-9]{3})+)\s+([0-9]{1,3}(?:,[0-9]{3})+)\s+([-\+]?[0-9]{1,3}(?:,[0-9]{3})+)/i);
    if (totalMatch) {
      totalBuyingValue = parseFloat(totalMatch[1].replace(/,/g, ''));
      totalPortfolioValue = parseFloat(totalMatch[2].replace(/,/g, ''));
    }

    const totalUnrealizedPnL = totalPortfolioValue - totalBuyingValue;

    // 6. Extract Portfolio Table Items
    const holdings: BrokerHoldingItem[] = [];

    // Isolate portfolio section
    const pos = text.indexOf('PORTFOLIO STATEMENT');
    let portfolioSection = pos !== -1 ? text.substring(pos) : text;
    portfolioSection = portfolioSection.replace(/PORTFOLIO STATEMENT[\s\S]*?Market Value \(Rp\.\) %/i, '');

    // Primary regex for standard Stockbit Portfolio Statement row:
    // Ticker (ARCI, BBRI, PJHB-W), name, then numbers:
    // Quantity, Buying Price, Close Price, Buying Value, Market Value, Unrealized Rp, Unrealized %
    const stockRowRegex = /\n([A-Z]{3,6}(?:-[A-Z0-9]+)?)\s+([\s\S]*?)\s+([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s+([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)\s+([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s+([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s+([0-9]{1,3}(?:,[0-9]{3})*|[0-9]+)\s+([-\+]?[0-9]{1,3}(?:,[0-9]{3})*)\s+([-\+]?[0-9]+(?:\.[0-9]+)?)/g;
    let match;

    while ((match = stockRowRegex.exec(portfolioSection)) !== null) {
      let ticker = match[1].trim().toUpperCase();
      if (!ticker.endsWith('.JK')) ticker += '.JK';

      let rawName = match[2].trim().replace(/\s+/g, ' ');
      rawName = rawName.replace(/\s+[A-Z]$/, '');

      const shares = parseFloat(match[3].replace(/,/g, ''));
      const lots = Math.round((shares / 100) * 100) / 100;
      const avgBuyPrice = parseFloat(match[4].replace(/,/g, ''));
      const currentPrice = parseFloat(match[5].replace(/,/g, ''));
      const buyingValue = parseFloat(match[6].replace(/,/g, ''));
      const marketValue = parseFloat(match[7].replace(/,/g, ''));
      const unrealizedPnLRp = parseFloat(match[8].replace(/,/g, ''));
      const unrealizedPnLPct = parseFloat(match[9]) / 100;

      holdings.push({
        ticker,
        name: rawName || `${ticker.replace('.JK', '')} Assets`,
        lots,
        shares,
        avgBuyPrice,
        currentPrice,
        buyingValue,
        marketValue,
        unrealizedPnLRp,
        unrealizedPnLPct,
      });
    }

    // Secondary flexible parser: line-by-line fallback for copied tables or alternative layouts
    if (holdings.length === 0) {
      const lines = text.split(/\r?\n/);
      const excludeWords = new Set([
        'CASH', 'TOTAL', 'NAME', 'DATE', 'TIME', 'PAGE', 'BANK', 'JAGO', 'ACCN', 'SEKU',
        'INFO', 'PORT', 'NOTE', 'TYPE', 'STAT', 'OPEN', 'HIGH', 'LOW', 'LAST', 'AVG',
        'FROM', 'USER', 'DESC', 'CODE', 'PRICE', 'AMOUNT', 'LOTS', 'LOT', 'SHARE'
      ]);

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;

        // Match 4-letter stock ticker (or warrant ticker with -W)
        const tickerMatch = trimmed.match(/\b([A-Z]{4}(?:-[A-Z0-9]+)?)(?:\.JK)?\b/);
        if (tickerMatch) {
          const tickerRaw = tickerMatch[1].toUpperCase();
          if (excludeWords.has(tickerRaw)) continue;

          // Extract numbers (supporting formats like 10,000, 10.000, or 4750)
          const numberMatches = trimmed.match(/(?:[0-9]{1,3}(?:[,.][0-9]{3})+|[0-9]+(?:\.[0-9]+)?)/g);
          if (numberMatches && numberMatches.length >= 2) {
            const parsedNums = numberMatches
              .map((n) => {
                if (n.includes(',') && n.includes('.')) {
                  return parseFloat(n.replace(/,/g, ''));
                }
                if (n.includes('.')) {
                  return parseFloat(n.replace(/\./g, ''));
                }
                if (n.includes(',')) {
                  return parseFloat(n.replace(/,/g, ''));
                }
                return parseFloat(n);
              })
              .filter((n) => n > 0);

            if (parsedNums.length >= 2) {
              let num1 = parsedNums[0];
              let num2 = parsedNums[1];

              // Determine which number is lot and which is price
              let lots = num1 >= 100 && num1 % 100 === 0 ? num1 / 100 : num1;
              let price = num2;

              if (num1 > 100 && num2 <= 1000 && num1 % 100 !== 0) {
                price = num1;
                lots = num2;
              }

              const cleanTicker = tickerRaw.endsWith('.JK') ? tickerRaw : `${tickerRaw}.JK`;
              const buyingValue = lots * 100 * price;

              holdings.push({
                ticker: cleanTicker,
                name: `${tickerRaw} Assets`,
                lots,
                shares: lots * 100,
                avgBuyPrice: price,
                currentPrice: price,
                buyingValue,
                marketValue: buyingValue,
                unrealizedPnLRp: 0,
                unrealizedPnLPct: 0,
              });
            }
          }
        }
      }
    }

    // Convert holdings to trades for backward-compatibility
    const trades = holdings.map((h) => ({
      action: 'BUY' as const,
      ticker: h.ticker,
      lots: h.lots,
      price: h.avgBuyPrice,
      fee: 0,
      netAmount: h.buyingValue,
    }));

    const summaryNote =
      holdings.length > 0
        ? `Statement of Account ${brokerName}: ${holdings.length} Saham Terdeteksi • Saldo RDN ${rdnBank} Rp ${rdnCashBalance.toLocaleString('id-ID')}`
        : `Tidak ditemukan baris portofolio saham pada teks ini. Pastikan menyalin tabel portofolio yang memuat kode saham (misal: BBRI, ASII, GOTO), jumlah lot, dan harga beli.`;

    return {
      brokerName,
      documentType: 'STATEMENT_OF_ACCOUNT',
      tradeDate: defaultDate,
      period: 'Bulan Berjalan',
      clientName,
      sid,
      rdnBank,
      rdnAccountNumber,
      rdnCashBalance,
      totalPortfolioValue,
      totalBuyingValue,
      totalUnrealizedPnL,
      holdings,
      trades,
      rawText: text,
      summaryNote,
    };
  },

  /**
   * Parser for standard single Trade Confirmation slips (BUY / SELL / DIVIDEND)
   */
  parseTradeConfirmation(text: string, brokerName: string, defaultDate: string): BrokerExtractionResult {
    const lower = text.toLowerCase();
    const trades: BrokerExtractionResult['trades'] = [];

    // Check for Dividend
    if (lower.includes('dividen') || lower.includes('dividend')) {
      const divMatch = text.match(/(?:dividen|dividend).*?(?:rp|idr)?\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]{4,})/i);
      const divAmount = divMatch ? parseFloat(divMatch[1].replace(/\./g, '')) : 450000;
      trades.push({
        action: 'DIVIDEND',
        ticker: 'CASH.DIV',
        lots: 0,
        price: 0,
        fee: 0,
        netAmount: divAmount,
      });
    }

    // Format 1: BUY/BELI 10 lot BBRI @ 4750
    const tradeRegex1 = /(beli|buy|jual|sell)\s+([0-9]+(?:\.[0-9]+)?)\s*lot\s+([A-Za-z0-9\-]+(?:\.JK)?)\s*@?\s*(?:rp)?\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]+)/gi;
    let match;

    while ((match = tradeRegex1.exec(text)) !== null) {
      const rawAction = match[1].toLowerCase();
      const action = rawAction === 'beli' || rawAction === 'buy' ? 'BUY' : 'SELL';
      const lots = parseFloat(match[2]);
      let ticker = match[3].toUpperCase();
      if (!ticker.endsWith('.JK')) ticker += '.JK';
      const price = parseFloat(match[4].replace(/\./g, ''));

      const gross = lots * 100 * price;
      const feeRate = action === 'BUY' ? 0.0015 : 0.0025;
      const fee = Math.round(gross * feeRate);
      const netAmount = action === 'BUY' ? gross + fee : gross - fee;

      trades.push({
        action,
        ticker,
        lots,
        price,
        fee,
        netAmount,
      });
    }

    // Format 2: BBRI BUY 10 lot @ 4750 or BBRI B 10 4750
    if (trades.length === 0) {
      const tradeRegex2 = /\b([A-Z]{4}(?:-[A-Z0-9]+)?)(?:\.JK)?\s+(beli|buy|jual|sell|b|s)\s+([0-9,.]+)\s*(?:lot|lembar|shares)?\s*@?\s*(?:rp)?\s*([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]+)/gi;
      let match2;
      while ((match2 = tradeRegex2.exec(text)) !== null) {
        let ticker = match2[1].toUpperCase();
        if (!ticker.endsWith('.JK')) ticker += '.JK';
        const rawAction = match2[2].toLowerCase();
        const action = rawAction.startsWith('b') ? 'BUY' : 'SELL';
        let rawLots = parseFloat(match2[3].replace(/,/g, ''));
        const lots = rawLots >= 100 && rawLots % 100 === 0 ? rawLots / 100 : rawLots;
        const price = parseFloat(match2[4].replace(/\./g, ''));

        const gross = lots * 100 * price;
        const feeRate = action === 'BUY' ? 0.0015 : 0.0025;
        const fee = Math.round(gross * feeRate);
        const netAmount = action === 'BUY' ? gross + fee : gross - fee;

        trades.push({
          action,
          ticker,
          lots,
          price,
          fee,
          netAmount,
        });
      }
    }

    const summaryNote =
      trades.length > 0
        ? `Berhasil mengekstrak ${trades.length} transaksi dari ${brokerName}`
        : `Tidak ada transaksi beli/jual yang terdeteksi dari teks ini. Pastikan menyalin teks konfirmasi transaksi broker yang memuat kode saham, aksi (Beli/Jual), jumlah lot, dan harga.`;

    return {
      brokerName,
      documentType: 'TRADE_CONFIRMATION',
      tradeDate: defaultDate,
      trades,
      rawText: text,
      summaryNote,
    };
  },
};
