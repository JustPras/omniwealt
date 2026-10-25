import test from 'node:test';
import assert from 'node:assert';
import { LedgerCommitService } from '../../src/services/rdn-pipeline/ledger-commit-service';
import { StandardizedRDNRecord } from '../../src/types/rdn-pipeline';
import { StockAsset } from '../../src/types/index';

test('1. Rekalibrasi Bobot Average Buy Price saat BUY Saham', () => {
  // Initial portfolio: 10 lot BBRI (1,000 shares) @ Rp 4,000
  const initialStocks: StockAsset[] = [
    {
      id: 'stock-bbri',
      ticker: 'BBRI.JK',
      name: 'Bank Rakyat Indonesia',
      lots: 10,
      avgBuyPrice: 4000,
      currentPrice: 4800,
      change24h: 0.01,
      currency: 'IDR',
      rdnAccountId: 'acc-rdn-1',
    },
  ];

  // Buy transaction: 10 lot (1,000 shares) @ Rp 5,000 + fee 7,500 = Rp 5,007,500
  const buyRecord: StandardizedRDNRecord = {
    id: 'rec-1',
    transaction_date: '2026-10-18',
    category: 'BUY',
    ticker: 'BBRI.JK',
    lot: 10,
    execution_price: 5000,
    gross_amount: 5000000,
    broker_fee: 7500,
    tax_amount: 0,
    net_amount: 5007500,
    running_balance: 4992500,
    raw_description: 'BUY 10 BBRI @ 5000',
    transaction_hash: 'hash-buy-bbri',
  };

  const updatedStocks = LedgerCommitService.recalibrateStockHoldings(
    initialStocks,
    buyRecord,
    'acc-rdn-1'
  );

  const bbri = updatedStocks.find((s) => s.ticker === 'BBRI.JK');
  assert.ok(bbri, 'BBRI harus ada di portofolio');

  // Expected shares: 1,000 + 1,000 = 2,000 (20 lot)
  assert.strictEqual(bbri!.lots, 20, 'Lots harus menjadi 20');

  // Expected Avg Price: (1,000 * 4,000 + 5,007,500) / 2,000 = (4,000,000 + 5,007,500) / 2,000 = 9,007,500 / 2,000 = 4,503.75 -> 4,504
  assert.strictEqual(bbri!.avgBuyPrice, 4504, 'Weighted Average Buy Price harus akurat terhitung Rp 4.504');
});

test('2. Penjualan Saham (SELL) Mengurangi Lot dan Menjaga Avg Buy Price Tetap', () => {
  // Initial: 20 lot BBRI @ Rp 4,504
  const initialStocks: StockAsset[] = [
    {
      id: 'stock-bbri',
      ticker: 'BBRI.JK',
      name: 'Bank Rakyat Indonesia',
      lots: 20,
      avgBuyPrice: 4504,
      currentPrice: 4800,
      change24h: 0.01,
      currency: 'IDR',
      rdnAccountId: 'acc-rdn-1',
    },
  ];

  // Sell 5 lot @ Rp 4,800
  const sellRecord: StandardizedRDNRecord = {
    id: 'rec-sell',
    transaction_date: '2026-10-19',
    category: 'SELL',
    ticker: 'BBRI.JK',
    lot: 5,
    execution_price: 4800,
    gross_amount: 2400000,
    broker_fee: 6000,
    tax_amount: 0,
    net_amount: 2394000,
    running_balance: 7394000,
    raw_description: 'SELL 5 BBRI @ 4800',
    transaction_hash: 'hash-sell-bbri',
  };

  const updatedStocks = LedgerCommitService.recalibrateStockHoldings(
    initialStocks,
    sellRecord,
    'acc-rdn-1'
  );

  const bbri = updatedStocks.find((s) => s.ticker === 'BBRI.JK');
  assert.ok(bbri, 'BBRI harus ada di portofolio');
  assert.strictEqual(bbri!.lots, 15, 'Lots harus berkurang dari 20 menjadi 15');
  assert.strictEqual(bbri!.avgBuyPrice, 4504, 'Harga modal rata-rata tidak berubah saat penjualan');
});
