import test from 'node:test';
import assert from 'node:assert';
import { ReconciliationService } from '../../src/services/rdn-pipeline/reconciliation-service';
import { StandardizedRDNRecord } from '../../src/types/rdn-pipeline';

test('1. Rekonsiliasi Matematis - Statement Seimbang (VERIFIED)', () => {
  const records: StandardizedRDNRecord[] = [
    {
      id: 'rec-1',
      transaction_date: '2026-10-01',
      category: 'TOPUP',
      ticker: null,
      lot: null,
      execution_price: null,
      gross_amount: 5000000,
      broker_fee: 0,
      tax_amount: 0,
      net_amount: 5000000,
      running_balance: 6000000,
      raw_description: 'Setoran Dana RDN',
      transaction_hash: 'hash-1',
    },
    {
      id: 'rec-2',
      transaction_date: '2026-10-02',
      category: 'BUY',
      ticker: 'BBRI.JK',
      lot: 10,
      execution_price: 4750,
      gross_amount: 4750000,
      broker_fee: 7125,
      tax_amount: 0,
      net_amount: 4757125,
      running_balance: 1242875,
      raw_description: 'BUY 10 BBRI',
      transaction_hash: 'hash-2',
    },
  ];

  const openingBalance = 1000000;
  // Opening: 1,000,000 + Topup: 5,000,000 - Buy: 4,757,125 = 1,242,875
  const statementClosing = 1242875;

  const result = ReconciliationService.reconcileBalances(records, openingBalance, statementClosing);

  assert.strictEqual(result.is_balanced, true);
  assert.strictEqual(result.status, 'VERIFIED');
  assert.strictEqual(result.discrepancy_amount, 0);
  assert.strictEqual(result.calculated_closing, 1242875);
});

test('2. Rekonsiliasi Matematis - Statement Selisih (NEEDS_REVIEW)', () => {
  const records: StandardizedRDNRecord[] = [
    {
      id: 'rec-1',
      transaction_date: '2026-10-01',
      category: 'TOPUP',
      ticker: null,
      lot: null,
      execution_price: null,
      gross_amount: 2000000,
      broker_fee: 0,
      tax_amount: 0,
      net_amount: 2000000,
      running_balance: 2000000,
      raw_description: 'Setoran Dana RDN',
      transaction_hash: 'hash-1',
    },
  ];

  const openingBalance = 0;
  // Calculated: 0 + 2,000,000 = 2,000,000. But statement says 2,500,000 (missing 500k entry)
  const statementClosing = 2500000;

  const result = ReconciliationService.reconcileBalances(records, openingBalance, statementClosing);

  assert.strictEqual(result.is_balanced, false);
  assert.strictEqual(result.status, 'NEEDS_REVIEW');
  assert.strictEqual(result.discrepancy_amount, 500000);
  assert.strictEqual(result.calculated_closing, 2000000);
  assert.strictEqual(result.statement_closing, 2500000);
});
