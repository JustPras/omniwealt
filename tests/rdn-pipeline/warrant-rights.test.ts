import { test } from 'node:test';
import assert from 'node:assert/strict';
import pako from 'pako';
import { PDFExtractorService } from '../../src/services/pdf-extractor';
import { RuleBasedParser } from '../../src/services/rdn-pipeline/parsers/rule-based-parser';
import { RDNNormalizer } from '../../src/services/rdn-pipeline/normalizer';
import { LedgerCommitService } from '../../src/services/rdn-pipeline/ledger-commit-service';
import { StandardizedRDNRecord } from '../../src/types/rdn-pipeline';
import { StockAsset } from '../../src/types';

test('1. Normalisasi Ticker Saham, Warrant (-W, -W2), dan Right Issue (-R)', () => {
  // Test regular stocks
  assert.equal(RDNNormalizer.normalizeTicker('BBCA'), 'BBCA.JK');
  assert.equal(RDNNormalizer.normalizeTicker('ARCI.JK'), 'ARCI.JK');

  // Test Warrant (-W, -W2, -WA)
  assert.equal(RDNNormalizer.normalizeTicker('GOTO-W'), 'GOTO-W.JK');
  assert.equal(RDNNormalizer.normalizeTicker('HUMI-W2'), 'HUMI-W2.JK');
  assert.equal(RDNNormalizer.normalizeTicker('pjhb-w'), 'PJHB-W.JK');
  assert.equal(RDNNormalizer.normalizeTicker('GOTO-W.JK'), 'GOTO-W.JK');

  // Test Right Issue (-R, -R2)
  assert.equal(RDNNormalizer.normalizeTicker('BBRI-R'), 'BBRI-R.JK');
  assert.equal(RDNNormalizer.normalizeTicker('bbri-r.jk'), 'BBRI-R.JK');

  // Test edge cases with parenthesis or alternative delimiters (e.g. GOTO/W or (GOTO-W))
  assert.equal(RDNNormalizer.normalizeTicker('(GOTO-W)'), 'GOTO-W.JK');
  assert.equal(RDNNormalizer.normalizeTicker('GOTO/W'), 'GOTO-W.JK');
  assert.equal(RDNNormalizer.normalizeTicker('BBRI - R'), 'BBRI-R.JK');

  // Test empty/cash values
  assert.equal(RDNNormalizer.normalizeTicker('NONE'), null);
  assert.equal(RDNNormalizer.normalizeTicker('CASH'), null);
  assert.equal(RDNNormalizer.normalizeTicker('-'), null);
  assert.equal(RDNNormalizer.normalizeTicker(undefined), null);
});

test('2. Ekstraksi PDF Statement of Account dengan Saham, Warrant (-W), dan Right Issue (-R)', () => {
  // Simulate PDF stream containing Stockbit Statement of Account holding table with regular stocks, warrants, and rights
  const rawStreamContent = `
BT /F1 10.00 Tf ET
BT 10 800 Td (PT. STOCKBIT SEKURITAS DIGITAL) Tj ET
BT 10 780 Td (Statement of Account) Tj ET
BT 10 760 Td (Beginning Balance 0 0 0 0) Tj ET
BT 10 740 Td (Stocks Special Notes Margin Quantity Buying Close Buying Value Market Value) Tj ET
BT 10 720 Td (ARCI Archi Indonesia Tbk. 200 1,425.00 1,230 285,000 246,000) Tj ET
BT 10 700 Td (GOTO-W GoTo Gojek Tokopedia Warrant 10,000 12.00 15 120,000 150,000) Tj ET
BT 10 680 Td (BBRI-R Bank Rakyat Indonesia Right 500 150.00 180 75,000 90,000) Tj ET
BT 10 660 Td (HUMI-W2 Humpuss Maritim Internasional W2 2,000 5.00 6 10,000 12,000) Tj ET
  `;

  const compressedStream = pako.deflate(Buffer.from(rawStreamContent, 'latin1'));
  const header = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Length ' + compressedStream.length + ' /Filter /FlateDecode >>\nstream\n', 'latin1');
  const footer = Buffer.from('\nendstream\nendobj\nxref\ntrailer\n%%EOF', 'latin1');

  const fullPdfBuffer = Buffer.concat([header, compressedStream, footer]);
  const extractedText = PDFExtractorService.extractTextFromBuffer(new Uint8Array(fullPdfBuffer));

  assert.ok(extractedText.includes('GOTO-W'), 'Teks harus memuat ticker GOTO-W');
  assert.ok(extractedText.includes('BBRI-R'), 'Teks harus memuat ticker BBRI-R');
  assert.ok(extractedText.includes('HUMI-W2'), 'Teks harus memuat ticker HUMI-W2');

  const parsed = RuleBasedParser.parseBankMutation(extractedText, 'STOCKBIT');
  assert.equal(parsed.rows.length, 4, 'Harus mengekstrak 4 instrumen (1 saham + 2 warrant + 1 right issue)');

  const gotow = parsed.rows.find((r) => r.ticker === 'GOTO-W.JK');
  assert.ok(gotow, 'GOTO-W.JK harus terdeteksi');
  assert.equal(gotow.lot, 100, 'GOTO-W harus 100 lot (10.000 lembar)');
  assert.equal(gotow.price, 12, 'Harga beli GOTO-W harus 12');
  assert.equal(gotow.netAmount, 120000, 'Nilai beli GOTO-W harus Rp 120.000');
  assert.ok(gotow.description.includes('Portofolio Warrant'), 'Deskripsi harus mengenali tipe Warrant');

  const bbriR = parsed.rows.find((r) => r.ticker === 'BBRI-R.JK');
  assert.ok(bbriR, 'BBRI-R.JK harus terdeteksi');
  assert.equal(bbriR.lot, 5, 'BBRI-R harus 5 lot (500 lembar)');
  assert.equal(bbriR.price, 150, 'Harga beli BBRI-R harus 150');
  assert.equal(bbriR.netAmount, 75000, 'Nilai beli BBRI-R harus Rp 75.000');
  assert.ok(bbriR.description.includes('Portofolio Right Issue'), 'Deskripsi harus mengenali tipe Right Issue');

  const humiW = parsed.rows.find((r) => r.ticker === 'HUMI-W2.JK');
  assert.ok(humiW, 'HUMI-W2.JK harus terdeteksi');
  assert.equal(humiW.lot, 20, 'HUMI-W2 harus 20 lot (2.000 lembar)');
  assert.equal(humiW.price, 5, 'Harga beli HUMI-W2 harus 5');
});

test('3. Ekstraksi Trade Confirmation Broker untuk Warrant & Right Issue', () => {
  const tradeConfText = `
PT. STOCKBIT SEKURITAS DIGITAL
TRADE CONFIRMATION
Trade Date: 2026-10-25

Beli 50 lot GOTO-W @ 12
Jual 20 lot BBRI-R @ 150
HUMI-W2 BUY 100 5
  `;

  const result = RuleBasedParser.parseTradeConfirmation(tradeConfText, 'STOCKBIT');
  assert.equal(result.rows.length, 3, 'Harus mengekstrak 3 transaksi trade confirmation');

  const buyWarrant = result.rows[0];
  assert.equal(buyWarrant.action, 'BUY');
  assert.equal(buyWarrant.ticker, 'GOTO-W');
  assert.equal(buyWarrant.lot, 50);
  assert.equal(buyWarrant.price, 12);

  const sellRight = result.rows[1];
  assert.equal(sellRight.action, 'SELL');
  assert.equal(sellRight.ticker, 'BBRI-R');
  assert.equal(sellRight.lot, 20);
  assert.equal(sellRight.price, 150);

  const tableTrade = result.rows[2];
  assert.equal(tableTrade.action, 'BUY');
  assert.equal(tableTrade.ticker, 'HUMI-W2');
  assert.equal(tableTrade.lot, 1, '100 lembar (shares) harus dikonversi menjadi 1 lot');
  assert.equal(tableTrade.price, 5);
});

test('4. Atomic Commit & Recalculate Portfolio Holdings untuk Warrant dan Right Issue', () => {
  const existingHoldings: StockAsset[] = [];

  const recordWarrant: StandardizedRDNRecord = {
    id: 'rec-1',
    transaction_date: '2026-10-25',
    category: 'BUY',
    ticker: 'GOTO-W.JK',
    lot: 50,
    execution_price: 12,
    gross_amount: 60000,
    broker_fee: 90,
    tax_amount: 0,
    net_amount: 60090,
    running_balance: 1000000,
    raw_description: 'BUY 50 lot GOTO-W @ 12',
    transaction_hash: 'hash-warrant-1',
  };

  const recordRight: StandardizedRDNRecord = {
    id: 'rec-2',
    transaction_date: '2026-10-25',
    category: 'BUY',
    ticker: 'BBRI-R.JK',
    lot: 10,
    execution_price: 150,
    gross_amount: 150000,
    broker_fee: 225,
    tax_amount: 0,
    net_amount: 150225,
    running_balance: 849775,
    raw_description: 'BUY 10 lot BBRI-R @ 150',
    transaction_hash: 'hash-right-1',
  };

  // Commit GOTO-W
  let updated = LedgerCommitService.recalibrateStockHoldings(existingHoldings, recordWarrant, 'rdn-1');
  assert.equal(updated.length, 1);
  assert.equal(updated[0].ticker, 'GOTO-W.JK');
  assert.equal(updated[0].name, 'GOTO-W Warrant', 'Nama harus terformat sebagai GOTO-W Warrant');
  assert.equal(updated[0].lots, 50);
  assert.equal(updated[0].avgBuyPrice, 12);

  // Commit BBRI-R
  updated = LedgerCommitService.recalibrateStockHoldings(updated, recordRight, 'rdn-1');
  assert.equal(updated.length, 2);
  assert.equal(updated[1].ticker, 'BBRI-R.JK');
  assert.equal(updated[1].name, 'BBRI-R Right Issue', 'Nama harus terformat sebagai BBRI-R Right Issue');
  assert.equal(updated[1].lots, 10);
  assert.equal(updated[1].avgBuyPrice, 150);
});
