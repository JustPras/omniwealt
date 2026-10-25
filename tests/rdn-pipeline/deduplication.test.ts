import test from 'node:test';
import assert from 'node:assert';
import { generateTransactionHash } from '../../src/utils/crypto';
import { ReconciliationService } from '../../src/services/rdn-pipeline/reconciliation-service';
import { StandardizedRDNRecord } from '../../src/types/rdn-pipeline';
import { Account, Transaction } from '../../src/types/index';

test('1. SHA-256 Hash Deterministik & Anti-Duplikat', () => {
  const hash1 = generateTransactionHash({
    accountId: 'acc-rdn-1',
    transactionDate: '2026-10-15',
    category: 'BUY',
    netAmount: 9800000,
    runningBalance: 15000000,
    ticker: 'BBCA.JK',
  });

  const hash2 = generateTransactionHash({
    accountId: 'acc-rdn-1',
    transactionDate: '2026-10-15',
    category: 'BUY',
    netAmount: 9800000,
    runningBalance: 15000000,
    ticker: 'BBCA.JK',
  });

  const hashDifferentAmount = generateTransactionHash({
    accountId: 'acc-rdn-1',
    transactionDate: '2026-10-15',
    category: 'BUY',
    netAmount: 9850000,
    runningBalance: 15000000,
    ticker: 'BBCA.JK',
  });

  assert.strictEqual(hash1, hash2, 'Hash harus identik untuk parameter yang sama');
  assert.notStrictEqual(hash1, hashDifferentAmount, 'Hash harus berbeda jika nominal berubah');
});

test('2. Deteksi DUPLICATE_SKIPPED pada Baris yang Pernah Tercatat di Ledger', () => {
  const hashExisting = 'test-hash-existing-123';
  const existingHashes = new Set<string>([hashExisting]);

  const records: StandardizedRDNRecord[] = [
    {
      id: 'rec-duplicate',
      transaction_date: '2026-10-10',
      category: 'TOPUP',
      ticker: null,
      lot: null,
      execution_price: null,
      gross_amount: 1000000,
      broker_fee: 0,
      tax_amount: 0,
      net_amount: 1000000,
      running_balance: 1000000,
      raw_description: 'Top Up RDN',
      transaction_hash: hashExisting,
    },
    {
      id: 'rec-new',
      transaction_date: '2026-10-11',
      category: 'BUY',
      ticker: 'TLKM.JK',
      lot: 5,
      execution_price: 3000,
      gross_amount: 1500000,
      broker_fee: 2250,
      tax_amount: 0,
      net_amount: 1502250,
      running_balance: 500000,
      raw_description: 'BUY TLKM',
      transaction_hash: 'test-hash-new-456',
    },
  ];

  const result = ReconciliationService.evaluateRecords({
    records,
    batchId: 'batch-test',
    existingTransactions: [],
    existingHashes,
    userAccounts: [],
  });

  assert.strictEqual(result.duplicateCount, 1);
  assert.strictEqual(result.newItemsCount, 1);
  assert.strictEqual(result.items[0].status, 'DUPLICATE_SKIPPED');
  assert.strictEqual(result.items[1].status, 'READY');
});

test('3. Deteksi INTERNAL_TRANSFER Otomatis dari Bank ke RDN', () => {
  const userAccounts: Account[] = [
    { id: 'acc-bca', name: 'BCA Tahapan', type: 'BANK', balance: 10000000 },
    { id: 'acc-rdn', name: 'RDN Stockbit', type: 'RDN', balance: 5000000 },
  ];

  const existingTransactions: Transaction[] = [
    {
      id: 'tx-bank-out',
      accountId: 'acc-bca',
      accountName: 'BCA Tahapan',
      type: 'EXPENSE',
      amount: 2500000,
      category: 'Transfer',
      description: 'Transfer ke RDN',
      source: 'MANUAL',
      transactionDate: '2026-10-12T08:30:00.000Z',
    },
  ];

  const records: StandardizedRDNRecord[] = [
    {
      id: 'rec-rdn-topup',
      transaction_date: '2026-10-12',
      category: 'TOPUP',
      ticker: null,
      lot: null,
      execution_price: null,
      gross_amount: 2500000,
      broker_fee: 0,
      tax_amount: 0,
      net_amount: 2500000,
      running_balance: 7500000,
      raw_description: 'Dana Masuk RDN',
      transaction_hash: 'unique-hash-topup-789',
    },
  ];

  const result = ReconciliationService.evaluateRecords({
    records,
    batchId: 'batch-test-2',
    existingTransactions,
    existingHashes: new Set(),
    userAccounts,
  });

  assert.strictEqual(result.internalTransferCount, 1);
  assert.strictEqual(result.items[0].status, 'INTERNAL_TRANSFER');
  assert.strictEqual(result.items[0].matched_transfer_account_name, 'BCA Tahapan');
  assert.strictEqual(result.items[0].matched_transfer_tx_id, 'tx-bank-out');
});
