import { test } from 'node:test';
import assert from 'node:assert/strict';
import pako from 'pako';
import { PDFExtractorService } from '../../src/services/pdf-extractor';
import { RuleBasedParser } from '../../src/services/rdn-pipeline/parsers/rule-based-parser';

test('1. Ekstraksi In-Memory PDF Binary Streams dengan Kompresi FlateDecode', () => {
  // Simulate PDF stream containing Stockbit Statement of Account table
  const rawStreamContent = `
BT /F1 10.00 Tf ET
BT 10 800 Td (PT. STOCKBIT SEKURITAS DIGITAL) Tj ET
BT 10 780 Td (Statement of Account) Tj ET
BT 10 760 Td (Beginning Balance 0 0 0 0) Tj ET
BT 10 740 Td (Stocks Special Notes Margin Quantity Buying Close Buying Value Market Value) Tj ET
BT 10 720 Td (ARCI Archi Indonesia Tbk. 200 1,425.00 1,230 285,000 246,000) Tj ET
BT 10 700 Td (BBRI Bank Rakyat Tbk. 100 3,800.00 3,140 380,000 314,000) Tj ET
BT 10 680 Td (GOTO GoTo Gojek Tokopedia Tbk. N 200 50.00 32 10,000 6,400) Tj ET
  `;

  const compressedStream = pako.deflate(Buffer.from(rawStreamContent, 'latin1'));
  const header = Buffer.from('%PDF-1.4\n1 0 obj\n<< /Length ' + compressedStream.length + ' /Filter /FlateDecode >>\nstream\n', 'latin1');
  const footer = Buffer.from('\nendstream\nendobj\nxref\ntrailer\n%%EOF', 'latin1');

  const fullPdfBuffer = Buffer.concat([header, compressedStream, footer]);
  const extractedText = PDFExtractorService.extractTextFromBuffer(new Uint8Array(fullPdfBuffer));

  assert.ok(extractedText.includes('STOCKBIT'), 'Teks harus memuat kata kunci STOCKBIT');
  assert.ok(extractedText.includes('ARCI'), 'Teks harus memuat ticker ARCI');
  assert.ok(extractedText.includes('BBRI'), 'Teks harus memuat ticker BBRI');
  assert.ok(extractedText.includes('GOTO'), 'Teks harus memuat ticker GOTO');

  // Parse with RuleBasedParser
  const parsed = RuleBasedParser.parseBankMutation(extractedText, 'STOCKBIT');
  assert.equal(parsed.rows.length, 3, 'Harus mengekstrak 3 baris saham portofolio asli');

  const arci = parsed.rows.find((r) => r.ticker === 'ARCI.JK');
  assert.ok(arci, 'ARCI.JK harus ditemukan');
  assert.equal(arci.lot, 2, 'ARCI harus 2 lot (200 shares)');
  assert.equal(arci.price, 1425, 'Harga beli ARCI harus 1425');
  assert.equal(arci.netAmount, 285000, 'Total nilai beli ARCI harus Rp 285.000');

  const bbri = parsed.rows.find((r) => r.ticker === 'BBRI.JK');
  assert.ok(bbri, 'BBRI.JK harus ditemukan');
  assert.equal(bbri.lot, 1, 'BBRI harus 1 lot (100 shares)');
  assert.equal(bbri.price, 3800, 'Harga beli BBRI harus 3800');
});
