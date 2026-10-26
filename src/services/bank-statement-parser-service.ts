import {
  BankStatementParseResult,
  BankStatementMutation,
  TransactionType,
} from '../types';

export class BankStatementParserServiceImpl {
  /**
   * Robust number parser supporting both Indonesian (10.500.000,00) and International (10,500,000.00)
   */
  parseNumber(str: string | undefined): number {
    if (!str) return 0;
    const clean = str.replace(/[^\d.,]/g, '').trim();
    if (!clean) return 0;

    // Both , and . present
    if (clean.includes(',') && clean.includes('.')) {
      if (clean.lastIndexOf(',') > clean.lastIndexOf('.')) {
        // Indonesian: 1.000.000,50
        return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
      } else {
        // International: 1,000,000.50
        return parseFloat(clean.replace(/,/g, ''));
      }
    }

    // Only comma
    if (clean.includes(',')) {
      const parts = clean.split(',');
      if (parts[parts.length - 1].length === 2) {
        // Decimal cents: 5000,00
        return parseFloat(clean.replace(',', '.'));
      }
      return parseFloat(clean.replace(/,/g, ''));
    }

    // Only period
    if (clean.includes('.')) {
      const parts = clean.split('.');
      if (parts[parts.length - 1].length === 2) {
        // Decimal cents: 5000.00
        return parseFloat(clean);
      }
      return parseFloat(clean.replace(/\./g, ''));
    }

    return parseFloat(clean) || 0;
  }

  /**
   * Smart category classifier for bank statement descriptions
   */
  categorize(desc: string, type: TransactionType): string {
    const lower = desc.toLowerCase();

    if (type === 'INCOME') {
      if (lower.includes('gaji') || lower.includes('salary') || lower.includes('payroll')) {
        return 'Salary & Freelance';
      }
      if (lower.includes('bunga') || lower.includes('interest') || lower.includes('bagi hasil')) {
        return 'Interest & Dividends';
      }
      if (lower.includes('cashback') || lower.includes('reward')) {
        return 'Cashback & Rewards';
      }
      if (lower.includes('dividen') || lower.includes('dividend')) {
        return 'Interest & Dividends';
      }
      return 'Income';
    }

    if (type === 'TRANSFER') {
      if (lower.includes('rdn') || lower.includes('stockbit') || lower.includes('ajaib')) {
        return 'Investment Top-Up';
      }
      return 'Internal Transfer';
    }

    // EXPENSE
    if (lower.includes('biaya adm') || lower.includes('adm bulanan') || lower.includes('pajak bunga') || lower.includes('fee')) {
      return 'Bank Admin & Fees';
    }
    if (lower.includes('kopi') || lower.includes('coffee') || lower.includes('resto') || lower.includes('cafe') || lower.includes('makan') || lower.includes('gofood') || lower.includes('shopeefood') || lower.includes('f&b')) {
      return 'Food & Beverage';
    }
    if (lower.includes('grab') || lower.includes('gojek') || lower.includes('goride') || lower.includes('gocar') || lower.includes('bensin') || lower.includes('pertamina') || lower.includes('toll') || lower.includes('tol') || lower.includes('m-tix')) {
      return 'Transport';
    }
    if (lower.includes('alfamart') || lower.includes('indomaret') || lower.includes('supermarket') || lower.includes('hypermart') || lower.includes('market')) {
      return 'Groceries';
    }
    if (lower.includes('pln') || lower.includes('listrik') || lower.includes('pdam') || lower.includes('pulsa') || lower.includes('paket data') || lower.includes('telkom') || lower.includes('indihome')) {
      return 'Bills & Utilities';
    }

    return 'Shopping';
  }

  /**
   * Parse full bank e-Statement text (BCA, Mandiri, BRI, Bank Jago, etc.)
   */
  parseBankStatement(rawText: string): BankStatementParseResult {
    const text = rawText.trim();
    const lower = text.toLowerCase();

    // 1. Detect Bank Institution from Title Lines (First 3 lines) or earliest occurrence
    const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const titleLines = rawLines.slice(0, 3).join(' ').toLowerCase();

    let bankName = 'BCA Tahapan';
    if (titleLines.includes('jago') || titleLines.includes('kantong')) {
      if (text.toLowerCase().includes('nabung')) {
        bankName = 'Bank Jago (Kantong Nabung)';
      } else {
        bankName = 'Bank Jago (Kantong Utama)';
      }
    } else if (titleLines.includes('mandiri') || titleLines.includes('livin')) {
      bankName = "Mandiri Livin'";
    } else if (titleLines.includes('bca') || titleLines.includes('tahapan')) {
      bankName = 'BCA Tahapan';
    } else if (titleLines.includes('brimo') || titleLines.includes('bri') || titleLines.includes('bank rakyat indonesia')) {
      bankName = 'BRImo';
    } else if (titleLines.includes('bni')) {
      bankName = 'BNI Mobile';
    } else {
      // Fallback: check which bank keyword appears earliest in the document
      const bcaIdx = lower.indexOf('bca');
      const jagoIdx = lower.indexOf('jago');
      const mandiriIdx = lower.indexOf('mandiri');
      const briIdx = lower.indexOf('bri');

      const indices = [
        { name: 'BCA Tahapan', idx: bcaIdx },
        { name: 'Bank Jago (Kantong Utama)', idx: jagoIdx },
        { name: "Mandiri Livin'", idx: mandiriIdx },
        { name: 'BRImo', idx: briIdx },
      ]
        .filter((x) => x.idx !== -1)
        .sort((a, b) => a.idx - b.idx);

      if (indices.length > 0) {
        bankName = indices[0].name;
      }
    }

    // 2. Extract Account Number
    let accountNumber = 'Aktif';
    const accMatch =
      text.match(/(?:no\.?\s*rekening|nomor\s*kantong|account\s*no|rekening)\s*[:\s]+([0-9]{8,16})/i) ||
      text.match(/\b([0-9]{10,13})\b/);
    if (accMatch) {
      accountNumber = accMatch[1].trim();
    }

    // 3. Extract Account Holder Name
    let accountHolder: string | undefined;
    const nameMatch = text.match(/(?:nama\s*nasabah|nama|account\s*holder|kantong)\s*[:\s]+([^\n\r]+)/i);
    if (nameMatch) {
      accountHolder = nameMatch[1].replace(/(?:no\.?\s*rekening|nomor|periode|saldo).*/i, '').trim();
    }

    // 4. Extract Period
    let periodStart: string | undefined;
    let periodEnd: string | undefined;
    const periodMatch = text.match(/(?:periode|period)\s*[:\s]+([^\n\r]+)/i);
    if (periodMatch) {
      const pStr = periodMatch[1].trim();
      const split = pStr.split(/\s*-\s*|\s*s\/d\s*/i);
      if (split.length >= 2) {
        periodStart = split[0].trim();
        periodEnd = split[1].trim();
      } else {
        periodStart = pStr;
      }
    }

    // 5. Extract Opening and Closing Balances
    let openingBalance = 0;
    let closingBalance = 0;

    const openMatch = text.match(/saldo\s*awal\s*[:\s]+(?:rp\.?\s*)?([0-9.,]+)/i);
    if (openMatch) {
      openingBalance = this.parseNumber(openMatch[1]);
    }

    const closeMatch = text.match(/saldo\s*akhir\s*[:\s]+(?:rp\.?\s*)?([0-9.,]+)/i);
    if (closeMatch) {
      closingBalance = this.parseNumber(closeMatch[1]);
    }

    // 6. Parse Mutation Rows
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const mutations: BankStatementMutation[] = [];
    let runningBalance = openingBalance;
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Format A: Standard BCA (Tgl Keterangan DB/CR Amount Saldo)
      // E.g. "02/09 TRSF E-BANKING CR 500,000.00 11,000,000.00"
      // E.g. "05/09 QRIS KOPI KENANGAN DB 48,500.00 10,951,500.00"
      const bcaMatch = line.match(/^(\d{2}\/\d{2}(?:\/\d{4})?)\s+(.+?)\s+(CR|DB|D|K)\s+([0-9.,]+)(?:\s+([0-9.,]+))?$/i);
      if (bcaMatch) {
        const rawDate = bcaMatch[1];
        const desc = bcaMatch[2].trim();
        const indicator = bcaMatch[3].toUpperCase();
        const amt = this.parseNumber(bcaMatch[4]);
        const bal = bcaMatch[5] ? this.parseNumber(bcaMatch[5]) : undefined;

        const isCredit = indicator === 'CR' || indicator === 'K';
        let type: TransactionType = isCredit ? 'INCOME' : 'EXPENSE';
        const lowerDesc = desc.toLowerCase();
        if (lowerDesc.includes('rdn') || lowerDesc.includes('top up') || lowerDesc.includes('ke jago') || lowerDesc.includes('ke gopay') || lowerDesc.includes('ke mandiri')) {
          type = 'TRANSFER';
        }

        const category = this.categorize(desc, type);
        mutations.push({
          id: `stmt-${Date.now()}-${mutations.length + 1}`,
          date: this.normalizeDate(rawDate, currentYear),
          rawDate,
          description: desc,
          type,
          amount: amt,
          balance: bal,
          category,
          isInternalTransfer: type === 'TRANSFER',
          status: 'NEW',
        });
        continue;
      }

      // Format B: Mandiri Livin (Tgl Keterangan Amount D/K Saldo)
      // E.g. "04/09 TRF BI-FAST KE REK BCA 500,000.00 D 6,500,000.00"
      // E.g. "10/09 GAJI PT KARYA DIGITAL 4,000,000.00 K 10,500,000.00"
      const mandiriMatch = line.match(/^(\d{2}\/\d{2}(?:\/\d{4})?)\s+(.+?)\s+([0-9.,]+)\s+(D|K|CR|DB)(?:\s+([0-9.,]+))?$/i);
      if (mandiriMatch) {
        const rawDate = mandiriMatch[1];
        const desc = mandiriMatch[2].trim();
        const amt = this.parseNumber(mandiriMatch[3]);
        const indicator = mandiriMatch[4].toUpperCase();
        const bal = mandiriMatch[5] ? this.parseNumber(mandiriMatch[5]) : undefined;

        const isCredit = indicator === 'K' || indicator === 'CR';
        let type: TransactionType = isCredit ? 'INCOME' : 'EXPENSE';
        const lowerDesc = desc.toLowerCase();
        if (lowerDesc.includes('rdn') || lowerDesc.includes('top up') || lowerDesc.includes('ke bca') || lowerDesc.includes('ke jago') || lowerDesc.includes('ke gopay')) {
          type = 'TRANSFER';
        }

        const category = this.categorize(desc, type);
        mutations.push({
          id: `stmt-${Date.now()}-${mutations.length + 1}`,
          date: this.normalizeDate(rawDate, currentYear),
          rawDate,
          description: desc,
          type,
          amount: amt,
          balance: bal,
          category,
          isInternalTransfer: type === 'TRANSFER',
          status: 'NEW',
        });
        continue;
      }

      // Format C: Bank Jago (DD Mon Keterangan Rp Amount Rp Saldo)
      // E.g. "02 Sep Uang Masuk dari BCA BI-FAST Rp 1.000.000 Rp 3.500.000"
      // E.g. "08 Sep Pembayaran QRIS F&B Rp 62.000 Rp 3.438.000"
      // E.g. "25 Sep Bunga Kantong Rp 15.200 Rp 3.453.200"
      const jagoMatch = line.match(/^(\d{1,2}\s+[A-Za-z]{3}(?:\s+\d{4})?)\s+(.+?)\s+(?:Rp\.?\s*)?([0-9.,]+)(?:\s+(?:Rp\.?\s*)?([0-9.,]+))?$/i);
      if (jagoMatch) {
        const rawDate = jagoMatch[1];
        const desc = jagoMatch[2].trim();
        const amt = this.parseNumber(jagoMatch[3]);
        const bal = jagoMatch[4] ? this.parseNumber(jagoMatch[4]) : undefined;

        const lowerDesc = desc.toLowerCase();
        let type: TransactionType = 'EXPENSE';
        if (lowerDesc.includes('masuk') || lowerDesc.includes('bunga') || lowerDesc.includes('cashback') || lowerDesc.includes('terima')) {
          type = 'INCOME';
        } else if (lowerDesc.includes('top up rdn') || lowerDesc.includes('pindah kantong') || lowerDesc.includes('transfer ke')) {
          type = 'TRANSFER';
        }

        const category = this.categorize(desc, type);
        mutations.push({
          id: `stmt-${Date.now()}-${mutations.length + 1}`,
          date: this.normalizeDate(rawDate, currentYear),
          rawDate,
          description: desc,
          type,
          amount: amt,
          balance: bal,
          category,
          isInternalTransfer: type === 'TRANSFER',
          status: 'NEW',
        });
        continue;
      }

      // Format D: Generic Tabular Line with DB/CR keyword
      // E.g. "2026-09-15 TRANSFER KE BCA 500,000 DB"
      const genericMatch = line.match(/^(\d{4}-\d{2}-\d{2}|\d{2}[-/]\d{2}[-/]\d{2,4})\s+(.+?)\s+([0-9.,]+)\s*(CR|DB|D|K)?$/i);
      if (genericMatch && genericMatch[3]) {
        const rawDate = genericMatch[1];
        const desc = genericMatch[2].trim();
        const amt = this.parseNumber(genericMatch[3]);
        const ind = (genericMatch[4] || '').toUpperCase();

        let type: TransactionType = 'EXPENSE';
        if (ind === 'CR' || ind === 'K' || desc.toLowerCase().includes('masuk') || desc.toLowerCase().includes('bunga') || desc.toLowerCase().includes('gaji')) {
          type = 'INCOME';
        } else if (desc.toLowerCase().includes('rdn') || desc.toLowerCase().includes('top up')) {
          type = 'TRANSFER';
        }

        mutations.push({
          id: `stmt-${Date.now()}-${mutations.length + 1}`,
          date: this.normalizeDate(rawDate, currentYear),
          rawDate,
          description: desc,
          type,
          amount: amt,
          category: this.categorize(desc, type),
          isInternalTransfer: type === 'TRANSFER',
          status: 'NEW',
        });
      }
    }

    // 7. Calculate Mathematical Inflows, Outflows, and Reconciliation
    let totalInflow = 0;
    let totalOutflow = 0;

    for (const m of mutations) {
      if (m.type === 'INCOME') {
        totalInflow += m.amount;
      } else {
        totalOutflow += m.amount;
      }
    }

    // If opening balance was not explicitly found in header, deduce it from first mutation balance
    if (openingBalance === 0 && mutations.length > 0) {
      const first = mutations[0];
      if (first.balance !== undefined) {
        if (first.type === 'INCOME') {
          openingBalance = first.balance - first.amount;
        } else {
          openingBalance = first.balance + first.amount;
        }
      }
    }

    // If closing balance was not explicitly found, use the last mutation balance
    if (closingBalance === 0 && mutations.length > 0) {
      const last = mutations[mutations.length - 1];
      if (last.balance !== undefined) {
        closingBalance = last.balance;
      } else {
        closingBalance = openingBalance + totalInflow - totalOutflow;
      }
    }

    const calculatedClosingBalance = openingBalance + totalInflow - totalOutflow;
    const discrepancy = calculatedClosingBalance - closingBalance;
    const isVerified = Math.abs(discrepancy) < 1;

    return {
      bankName,
      accountNumber,
      accountHolder,
      periodStart,
      periodEnd,
      currency: 'IDR',
      openingBalance,
      closingBalance,
      totalInflow,
      totalOutflow,
      calculatedClosingBalance,
      discrepancy,
      status: isVerified ? 'VERIFIED' : 'NEEDS_REVIEW',
      mutations,
      rawText: text,
    };
  }

  /**
   * Helper to normalize date strings to ISO YYYY-MM-DD
   */
  private normalizeDate(rawDate: string, defaultYear: number): string {
    // 1. "02/09" or "02/09/2026"
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      const year = parts[2] ? (parts[2].length === 2 ? `20${parts[2]}` : parts[2]) : defaultYear;
      return `${year}-${month}-${day}`;
    }

    // 2. "2026-09-15"
    if (rawDate.includes('-') && rawDate.length === 10) {
      return rawDate;
    }

    // 3. "02 Sep" or "02 Sep 2026"
    const monthNames: Record<string, string> = {
      jan: '01', feb: '02', mar: '03', apr: '04', mei: '05', may: '05',
      jun: '06', jul: '07', agu: '08', aug: '08', sep: '09', okt: '10',
      oct: '10', nov: '11', des: '12', dec: '12',
    };

    const words = rawDate.trim().split(/\s+/);
    if (words.length >= 2) {
      const day = words[0].padStart(2, '0');
      const monKey = words[1].toLowerCase().substring(0, 3);
      const month = monthNames[monKey] || '01';
      const year = words[2] ? words[2] : defaultYear;
      return `${year}-${month}-${day}`;
    }

    return `${defaultYear}-01-01`;
  }
}

export const BankStatementParserService = new BankStatementParserServiceImpl();
