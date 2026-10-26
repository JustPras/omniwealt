import test from 'node:test';
import assert from 'node:assert';
import { BankStatementParserService } from '../../src/services/bank-statement-parser-service';
import { BankStatementReconciliationService } from '../../src/services/bank-statement-reconciliation-service';
import { Account, Transaction } from '../../src/types';

test('1. Robust Number Parsing (Indonesian & International formats)', () => {
  const p = BankStatementParserService;

  assert.strictEqual(p.parseNumber('10.500.000,00'), 10500000, 'Format Indo dengan desimal koma');
  assert.strictEqual(p.parseNumber('10,500,000.00'), 10500000, 'Format Inter dengan desimal titik');
  assert.strictEqual(p.parseNumber('Rp 48.500'), 48500, 'Prefix Rp');
  assert.strictEqual(p.parseNumber('12,500'), 12500, 'Ribuan koma');
  assert.strictEqual(p.parseNumber('15.200'), 15200, 'Ribuan titik');
});

test('2. Parsing e-Statement BCA Tahapan & Rekonsiliasi Matematis Seimbang', () => {
  const rawText = `
REKENING TAHAPAN BCA
NO. REKENING : 1234567890
PERIODE : SEPTEMBER 2026
SALDO AWAL : 10,500,000.00
02/09 TRSF E-BANKING CR 500,000.00 11,000,000.00
05/09 QRIS KOPI KENANGAN DB 48,500.00 10,951,500.00
12/09 BI-FAST DARI JAGO CR 1,000,000.00 11,951,500.00
30/09 BIAYA ADM DB 15,000.00 11,936,500.00
30/09 BUNGA TABUNGAN CR 2,500.00 11,939,000.00
SALDO AKHIR : 11,939,000.00
  `.trim();

  const result = BankStatementParserService.parseBankStatement(rawText);

  assert.strictEqual(result.bankName, 'BCA Tahapan');
  assert.strictEqual(result.accountNumber, '1234567890');
  assert.strictEqual(result.openingBalance, 10500000);
  assert.strictEqual(result.closingBalance, 11939000);
  assert.strictEqual(result.mutations.length, 5, 'Harus mengekstrak 5 mutasi');

  // Mathematical check
  assert.strictEqual(result.totalInflow, 500000 + 1000000 + 2500); // 1.502.500
  assert.strictEqual(result.totalOutflow, 48500 + 15000); // 63.500
  assert.strictEqual(result.calculatedClosingBalance, 11939000);
  assert.strictEqual(result.discrepancy, 0, 'Selisih saldo harus Rp 0');
  assert.strictEqual(result.status, 'VERIFIED', 'Status harus VERIFIED');
});

test('3. Parsing e-Statement Bank Jago Multi-Pocket & Rekonsiliasi', () => {
  const rawText = `
Laporan Rekening Bank Jago
Nomor Kantong : 504012345678
Kantong : Kantong Utama
Periode : 1 Sep 2026 - 30 Sep 2026
Saldo Awal : Rp 2.500.000
02 Sep Uang Masuk dari BCA BI-FAST Rp 1.000.000 Rp 3.500.000
08 Sep Pembayaran QRIS F&B Rp 62.000 Rp 3.438.000
25 Sep Bunga Kantong Rp 15.200 Rp 3.453.200
28 Sep Top up RDN Stockbit Rp 1.000.000 Rp 2.453.200
Saldo Akhir : Rp 2.453.200
  `.trim();

  const result = BankStatementParserService.parseBankStatement(rawText);

  assert.strictEqual(result.bankName, 'Bank Jago (Kantong Utama)');
  assert.strictEqual(result.accountNumber, '504012345678');
  assert.strictEqual(result.openingBalance, 2500000);
  assert.strictEqual(result.closingBalance, 2453200);
  assert.strictEqual(result.mutations.length, 4);

  // Check categories
  const fnb = result.mutations.find((m) => m.description.includes('QRIS F&B'));
  assert.ok(fnb);
  assert.strictEqual(fnb?.category, 'Food & Beverage');

  const bunga = result.mutations.find((m) => m.description.includes('Bunga'));
  assert.ok(bunga);
  assert.strictEqual(bunga?.type, 'INCOME');
  assert.strictEqual(bunga?.category, 'Interest & Dividends');

  assert.strictEqual(result.status, 'VERIFIED');
});

test('4. Deteksi Selisih Matematis pada Statement yang Rusak/Dimanipulasi (NEEDS_REVIEW)', () => {
  const corruptedText = `
REKENING TAHAPAN BCA
NO. REKENING : 1234567890
SALDO AWAL : 10,000,000.00
02/09 TRSF MASUK CR 500,000.00 10,500,000.00
05/09 PENGELUARAN DB 100,000.00 10,400,000.00
SALDO AKHIR : 15,000,000.00
  `.trim();

  const result = BankStatementParserService.parseBankStatement(corruptedText);

  // Calculated = 10.000.000 + 500.000 - 100.000 = 10.400.000
  // Reported = 15.000.000 -> Discrepancy = -4.600.000
  assert.strictEqual(result.calculatedClosingBalance, 10400000);
  assert.strictEqual(result.closingBalance, 15000000);
  assert.strictEqual(result.discrepancy, -4600000);
  assert.strictEqual(result.status, 'NEEDS_REVIEW', 'Statement selisih harus berstatus NEEDS_REVIEW');
});

test('5. Deduplikasi Cerdas terhadap Notifikasi Pilar 1 di Buku Kas', () => {
  const mockBcaAccount: Account = {
    id: 'acc-bca-test',
    name: 'BCA Tahapan',
    type: 'BANK',
    accountNumber: '1234567890',
    balance: 10500000,
    color: '#00529C',
    icon: 'landmark',
    updatedAt: new Date().toISOString(),
  };

  // Ledger already contains QRIS Kopi Kenangan caught earlier by Pilar 1 MacroDroid
  const existingLedger: Transaction[] = [
    {
      id: 'tx-notif-kenangan',
      accountId: 'acc-bca-test',
      accountName: 'BCA Tahapan',
      type: 'EXPENSE',
      amount: 48500,
      category: 'Food & Beverage',
      description: 'QRIS Kopi Kenangan Senopati',
      source: 'ANDROID_AUTO',
      transactionDate: '2026-09-05T08:30:00.000Z',
    },
  ];

  const statementText = `
REKENING TAHAPAN BCA
NO. REKENING : 1234567890
SALDO AWAL : 10,500,000.00
02/09 TRSF MASUK CR 500,000.00 11,000,000.00
05/09 QRIS KOPI KENANGAN DB 48,500.00 10,951,500.00
30/09 BIAYA ADM DB 15,000.00 10,936,500.00
SALDO AKHIR : 10,936,500.00
  `.trim();

  const parsed = BankStatementParserService.parseBankStatement(statementText);
  const { reconciledMutations, newCount, duplicateCount } =
    BankStatementReconciliationService.reconcileWithLedger(
      parsed.mutations,
      mockBcaAccount,
      existingLedger
    );

  assert.strictEqual(newCount, 2, 'Harus ada 2 mutasi baru (Transfer Masuk dan Biaya Adm)');
  assert.strictEqual(duplicateCount, 1, 'QRIS Kopi Kenangan harus terdeteksi sebagai duplikat');

  const kenanganMut = reconciledMutations.find((m) => m.amount === 48500);
  assert.strictEqual(kenanganMut?.status, 'DUPLICATE_SKIPPED', 'Harus bertanda DUPLICATE_SKIPPED');

  const admMut = reconciledMutations.find((m) => m.amount === 15000);
  assert.strictEqual(admMut?.status, 'NEW', 'Biaya adm harus bertanda NEW');
});
