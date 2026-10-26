import test from 'node:test';
import assert from 'node:assert';
import { InternalTransferService } from '../../src/services/internal-transfer-service';
import { AIParserService } from '../../src/services/ai-parser';
import { Account, Transaction } from '../../src/types';

// Mock active user accounts
const mockAccounts: Account[] = [
  {
    id: 'acc-bca',
    name: 'BCA Tahapan',
    type: 'BANK',
    accountNumber: '1234567890',
    balance: 10000000,
    color: '#00529C',
    icon: 'landmark',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc-jago-utama',
    name: 'Bank Jago (Kantong Utama)',
    type: 'BANK',
    accountNumber: '504012345678',
    balance: 2500000,
    color: '#8B5CF6',
    icon: 'smartphone',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc-jago-nabung',
    name: 'Bank Jago (Kantong Nabung)',
    type: 'BANK',
    accountNumber: '504099998888',
    balance: 15000000,
    color: '#8B5CF6',
    icon: 'smartphone',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc-mandiri',
    name: "Mandiri Livin'",
    type: 'BANK',
    accountNumber: '1370001234567',
    balance: 5000000,
    color: '#003366',
    icon: 'landmark',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc-gopay',
    name: 'GoPay Utama',
    type: 'E-WALLET',
    accountNumber: '08123456789',
    balance: 350000,
    color: '#00AED6',
    icon: 'wallet',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc-rdn',
    name: 'RDN Stockbit BCA',
    type: 'RDN',
    accountNumber: '9900112233',
    balance: 1000000,
    color: '#10B981',
    icon: 'trending-up',
    updatedAt: new Date().toISOString(),
  },
];

test('1. Direct Single-Notification Internal Transfer (BCA ➔ GoPay)', () => {
  const text = 'Top up GoPay Rp 150.000 dari BCA Tahapan berhasil';
  const parsed = AIParserService.deterministicBankParse(text, 'com.bca');
  const plan = InternalTransferService.checkDirectSingleTransfer(parsed, text, mockAccounts);

  assert.ok(plan !== null, 'Plan transfer internal tidak boleh null');
  assert.strictEqual(plan.isMatched, true, 'Harus terdeteksi sebagai match');
  assert.strictEqual(plan.sourceAccount.name, 'BCA Tahapan', 'Sumber dana harus BCA Tahapan');
  assert.strictEqual(plan.destinationAccount.name, 'GoPay Utama', 'Tujuan dana harus GoPay Utama');
  assert.strictEqual(plan.transferAmount, 150000, 'Nominal transfer harus Rp 150.000');
  assert.strictEqual(plan.consolidatedTransaction.type, 'TRANSFER', 'Tipe transaksi harus TRANSFER');
  assert.strictEqual(plan.consolidatedTransaction.isInternalTransfer, true, 'Harus bertanda isInternalTransfer');
});

test('2. Direct Single-Notification Internal Transfer (Jago Kantong Utama ➔ Nabung)', () => {
  const text = 'Pindah kantong Rp 200.000 dari Kantong Utama ke Kantong Nabung Bank Jago berhasil';
  const parsed = AIParserService.deterministicBankParse(text, 'com.jago.digitalbanking');
  const plan = InternalTransferService.checkDirectSingleTransfer(parsed, text, mockAccounts);

  assert.ok(plan !== null, 'Plan pindah kantong tidak boleh null');
  assert.strictEqual(plan.isMatched, true);
  assert.strictEqual(plan.sourceAccount.name, 'Bank Jago (Kantong Utama)');
  assert.strictEqual(plan.destinationAccount.name, 'Bank Jago (Kantong Nabung)');
  assert.strictEqual(plan.transferAmount, 200000);
});

test('3. Asynchronous Two-Legged Match (BCA Outflow Leg 1 + Jago Inflow Leg 2)', () => {
  // Leg 1: Outflow previously recorded 25 seconds ago
  const leg1Tx: Transaction = {
    id: 'tx-bca-outflow-1',
    accountId: 'acc-bca',
    accountName: 'BCA Tahapan',
    type: 'EXPENSE',
    amount: 500000,
    category: 'Transfer',
    description: 'Transfer keluar Rp 500.000 ke Bank Jago dari rekening BCA Tahapan',
    rawNotificationText: 'Transfer keluar Rp 500.000 ke Bank Jago dari rekening BCA Tahapan',
    source: 'ANDROID_AUTO',
    transactionDate: new Date(Date.now() - 25000).toISOString(),
  };

  // Leg 2: Inflow notification arriving now on Bank Jago
  const leg2Text = 'Pemberitahuan: Uang masuk Rp 500.000 via BI-FAST dari BCA ke Kantong Utama Bank Jago';
  const leg2Parsed = AIParserService.deterministicBankParse(leg2Text, 'com.jago.digitalbanking');
  const jagoAccount = mockAccounts.find((a) => a.id === 'acc-jago-utama')!;

  const plan = InternalTransferService.findTwoLeggedMatch(
    leg2Parsed,
    leg2Text,
    jagoAccount,
    [leg1Tx],
    mockAccounts
  );

  assert.ok(plan !== null, 'Two-legged match plan tidak boleh null');
  assert.strictEqual(plan.isMatched, true);
  assert.strictEqual(plan.matchType, 'TWO_LEGGED_PAIR');
  assert.strictEqual(plan.sourceAccount.name, 'BCA Tahapan');
  assert.strictEqual(plan.destinationAccount.name, 'Bank Jago (Kantong Utama)');
  assert.strictEqual(plan.transferAmount, 500000);
  assert.strictEqual(plan.matchedTransactionId, 'tx-bca-outflow-1', 'Harus menggabungkan Leg 1 sebelumnya');
});

test('4. Two-Legged Transfer dengan BI-FAST Admin Fee (Delta Rp 2.500)', () => {
  // Leg 1: Outflow with BI-FAST fee Rp 2.500 (Total Rp 502.500)
  const leg1Tx: Transaction = {
    id: 'tx-bca-bifast-fee',
    accountId: 'acc-bca',
    accountName: 'BCA Tahapan',
    type: 'EXPENSE',
    amount: 502500,
    category: 'Transfer',
    description: 'Transfer BI-FAST keluar Rp 502.500 ke Mandiri Livin dari BCA Tahapan',
    rawNotificationText: 'Transfer BI-FAST keluar Rp 502.500 ke Mandiri Livin dari BCA Tahapan',
    source: 'ANDROID_AUTO',
    transactionDate: new Date(Date.now() - 15000).toISOString(),
  };

  // Leg 2: Inflow net Rp 500.000 on Mandiri Livin
  const leg2Text = 'Transfer masuk BI-FAST Rp 500.000 dari BCA ke Mandiri Livin';
  const leg2Parsed = AIParserService.deterministicBankParse(leg2Text, 'id.co.mandiri.livin');
  const mandiriAccount = mockAccounts.find((a) => a.id === 'acc-mandiri')!;

  const plan = InternalTransferService.findTwoLeggedMatch(
    leg2Parsed,
    leg2Text,
    mandiriAccount,
    [leg1Tx],
    mockAccounts
  );

  assert.ok(plan !== null, 'Harus mendeteksi match dengan selisih biaya admin');
  assert.strictEqual(plan.isMatched, true);
  assert.strictEqual(plan.matchType, 'FEE_ADJUSTED');
  assert.strictEqual(plan.transferAmount, 500000, 'Nominal pokok transfer harus Rp 500.000');
  assert.strictEqual(plan.feeAmount, 2500, 'Biaya admin harus terdeteksi Rp 2.500');
});

test('5. Pencegahan Double Crediting (Check Already Reconciled Leg)', () => {
  // Existing consolidated transaction
  const existingTransfer: Transaction = {
    id: 'tx-transfer-already-done',
    accountId: 'acc-bca',
    accountName: 'BCA Tahapan',
    destinationAccountId: 'acc-gopay',
    destinationAccountName: 'GoPay Utama',
    type: 'TRANSFER',
    amount: 150000,
    category: 'Internal Transfer',
    description: 'Transfer BCA Tahapan ➔ GoPay Utama',
    source: 'ANDROID_AUTO',
    transactionDate: new Date(Date.now() - 10000).toISOString(),
    isInternalTransfer: true,
  };

  // Companion notification arriving on GoPay 10 seconds later
  const companionText = 'Top up GoPay Rp 150.000 via BCA OneKlik berhasil';
  const companionParsed = AIParserService.deterministicBankParse(companionText, 'com.gojek.app');
  const gopayAccount = mockAccounts.find((a) => a.id === 'acc-gopay')!;

  const isAlreadyReconciled = InternalTransferService.checkAlreadyReconciled(
    companionParsed,
    gopayAccount,
    [existingTransfer]
  );

  assert.strictEqual(
    isAlreadyReconciled,
    true,
    'Notifikasi pendamping kedua harus diabaikan agar saldo GoPay tidak ter-credit dua kali'
  );
});

test('6. Transaksi Eksternal Nyata Tidak Boleh Salah Terdeteksi (Zero False Positive)', () => {
  // Transaksi pengeluaran belanja di Alfamart
  const alfamartTx: Transaction = {
    id: 'tx-alfamart',
    accountId: 'acc-bca',
    accountName: 'BCA Tahapan',
    type: 'EXPENSE',
    amount: 45000,
    category: 'Groceries',
    description: 'Debit Rp 45.000 di Alfamart Senopati',
    source: 'ANDROID_AUTO',
    transactionDate: new Date(Date.now() - 60000).toISOString(),
  };

  // Notifikasi masuk gaji dari PT Karya Digital Rp 5.000.000
  const salaryText = 'Transfer masuk BI-FAST Rp 5.000.000 dari PT Karya Digital ke Mandiri Livin';
  const salaryParsed = AIParserService.deterministicBankParse(salaryText, 'id.co.mandiri.livin');
  const mandiriAccount = mockAccounts.find((a) => a.id === 'acc-mandiri')!;

  const plan = InternalTransferService.findTwoLeggedMatch(
    salaryParsed,
    salaryText,
    mandiriAccount,
    [alfamartTx],
    mockAccounts
  );

  assert.strictEqual(plan, null, 'Gaji dan belanja tidak boleh salah dipasangkan sebagai internal transfer');
});
