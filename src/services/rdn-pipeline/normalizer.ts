import { StandardizedRDNRecord, RDNCategory } from '../../types/rdn-pipeline';
import { Decimal } from '../../utils/decimal';
import { generateTransactionHash } from '../../utils/crypto';

export interface RawParsedRow {
  date: string;
  settlementDate?: string;
  categoryHint?: string;
  action?: 'BUY' | 'SELL' | 'DIVIDEND' | 'TOPUP' | 'WITHDRAWAL' | 'FEE' | 'TAX' | 'INTEREST';
  ticker?: string | null;
  lot?: number | null;
  price?: number | null;
  grossAmount?: number | null;
  fee?: number | null;
  tax?: number | null;
  netAmount?: number | null;
  balance?: number | null;
  description: string;
}

export class RDNNormalizer {
  /**
   * Determine strict RDNCategory enum from raw hints and descriptions
   */
  static categorize(row: RawParsedRow): RDNCategory {
    const desc = (row.description || '').toLowerCase();
    const hint = (row.categoryHint || row.action || '').toUpperCase();

    if (hint === 'DIVIDEND' || desc.includes('dividen') || desc.includes('dividend')) {
      return 'DIVIDEND';
    }
    if (hint === 'COUPON' || desc.includes('kupon') || desc.includes('coupon')) {
      return 'COUPON';
    }
    if (hint === 'INTEREST' || desc.includes('bunga') || desc.includes('interest')) {
      return 'INTEREST';
    }
    if (
      hint === 'FEE' ||
      hint === 'TAX' ||
      desc.includes('pajak') ||
      desc.includes('admin') ||
      desc.includes('biaya materai') ||
      desc.includes('pembulatan')
    ) {
      return 'ADMIN_TAX';
    }
    if (hint === 'BUY' || desc.includes('beli') || desc.includes('buy ') || desc.includes('pembelian')) {
      return 'BUY';
    }
    if (hint === 'SELL' || desc.includes('jual') || desc.includes('sell ') || desc.includes('penjualan')) {
      return 'SELL';
    }
    if (
      hint === 'TOPUP' ||
      desc.includes('setoran') ||
      desc.includes('transfer masuk') ||
      desc.includes('top up') ||
      desc.includes('topup') ||
      desc.includes('cr ') ||
      desc.includes('credit')
    ) {
      return 'TOPUP';
    }
    if (
      hint === 'WITHDRAWAL' ||
      desc.includes('penarikan') ||
      desc.includes('transfer keluar') ||
      desc.includes('tarik dana') ||
      desc.includes('db ') ||
      desc.includes('debit')
    ) {
      return 'WITHDRAWAL';
    }

    return 'TOPUP';
  }

  /**
   * Standardize ISO date format (YYYY-MM-DD)
   */
  static normalizeDate(rawDate?: string): string {
    if (!rawDate) return new Date().toISOString().split('T')[0];
    const clean = rawDate.trim();

    // Check DD/MM/YYYY or DD-MM-YYYY
    const dmy = clean.match(/^([0-9]{1,2})[\/\-\.]([0-9]{1,2})[\/\-\.]([0-9]{4})/);
    if (dmy) {
      const d = dmy[1].padStart(2, '0');
      const m = dmy[2].padStart(2, '0');
      const y = dmy[3];
      return `${y}-${m}-${d}`;
    }

    // Check YYYY-MM-DD
    const ymd = clean.match(/^([0-9]{4})[\/\-\.]([0-9]{1,2})[\/\-\.]([0-9]{1,2})/);
    if (ymd) {
      const y = ymd[1];
      const m = ymd[2].padStart(2, '0');
      const d = ymd[3].padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    // Try parsing through standard Date
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0];
    }

    return new Date().toISOString().split('T')[0];
  }

  /**
   * Clean and normalize Indonesian stock ticker (e.g. BBRI -> BBRI.JK, GOTO-W -> GOTO-W.JK, BBRI-R -> BBRI-R.JK)
   */
  static normalizeTicker(rawTicker?: string | null): string | null {
    if (!rawTicker) return null;
    let clean = rawTicker.trim().toUpperCase();
    if (clean === 'NONE' || clean === 'CASH' || clean === '-') return null;
    // Strip surrounding brackets, quotes, or parentheses e.g. (GOTO-W)
    clean = clean.replace(/^[(\["']+|[)\]"']+$/g, '');
    // Standardize warrant and right issue hyphens (e.g., GOTO/W or GOTO - W -> GOTO-W)
    clean = clean.replace(/\s*[\/\-]\s*([WR][0-9A-Z]*)/i, '-$1');
    if (!clean.endsWith('.JK')) {
      clean += '.JK';
    }
    return clean;
  }

  /**
   * Map raw extracted row into strict StandardizedRDNRecord with High-Precision Decimal calculations
   */
  static normalizeRecord(row: RawParsedRow, accountId: string, index: number): StandardizedRDNRecord {
    const category = RDNNormalizer.categorize(row);
    const txDate = RDNNormalizer.normalizeDate(row.date);
    const settlementDate = row.settlementDate ? RDNNormalizer.normalizeDate(row.settlementDate) : undefined;
    const ticker = RDNNormalizer.normalizeTicker(row.ticker);

    const lotDecimal = row.lot ? new Decimal(row.lot) : null;
    const priceDecimal = row.price ? new Decimal(row.price) : null;

    let gross = new Decimal(row.grossAmount || 0);
    const fee = new Decimal(row.fee || 0);
    const tax = new Decimal(row.tax || 0);
    let net = new Decimal(row.netAmount || 0);

    // If gross is not provided but lot and price exist
    if (gross.isZero() && lotDecimal && priceDecimal) {
      gross = lotDecimal.times(100).times(priceDecimal);
    }

    // Calculate net amount if net is zero
    if (net.isZero()) {
      if (category === 'BUY') {
        net = gross.plus(fee).plus(tax);
      } else if (category === 'SELL') {
        net = gross.minus(fee).minus(tax);
      } else {
        net = gross;
      }
    }

    const runningBalance = row.balance !== undefined && row.balance !== null ? new Decimal(row.balance).toNumber() : null;

    const hash = generateTransactionHash({
      accountId,
      transactionDate: txDate,
      category,
      netAmount: net.toNumber(),
      runningBalance,
      ticker,
    });

    return {
      id: `rdn-rec-${Date.now()}-${index}-${hash.slice(0, 8)}`,
      transaction_date: txDate,
      settlement_date: settlementDate,
      category,
      ticker,
      lot: lotDecimal ? lotDecimal.toNumber() : null,
      execution_price: priceDecimal ? priceDecimal.toNumber() : null,
      gross_amount: gross.toNumber(),
      broker_fee: fee.toNumber(),
      tax_amount: tax.toNumber(),
      net_amount: net.toNumber(),
      running_balance: runningBalance,
      raw_description: row.description.trim(),
      transaction_hash: hash,
    };
  }
}
