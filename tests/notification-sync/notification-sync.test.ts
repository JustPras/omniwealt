import test from 'node:test';
import assert from 'node:assert';
import { AIParserService } from '../../src/services/ai-parser';
import { NotificationSyncService } from '../../src/services/notification-sync-service';

test('1. Ekstraksi Notifikasi Transaksi QRIS BCA Tahapan', () => {
  const text = 'Transaksi QRIS Rp 48.500 di Kopi Kenangan Senopati berhasil dari rekening BCA Tahapan';
  const result = AIParserService.deterministicBankParse(text);

  assert.strictEqual(result.type, 'EXPENSE', 'Tipe harus EXPENSE');
  assert.strictEqual(result.amount, 48500, 'Nominal harus Rp 48.500');
  assert.strictEqual(result.bankName, 'BCA Tahapan', 'Bank harus BCA Tahapan');
  assert.strictEqual(result.category, 'Food & Beverage', 'Kategori harus Food & Beverage');
  assert.strictEqual(result.merchantOrSender, 'Kopi Kenangan Senopati', 'Merchant harus Kopi Kenangan Senopati');
});

test('2. Ekstraksi Notifikasi Transfer Masuk BI-FAST Mandiri Livin (Gaji)', () => {
  const text = 'Transfer masuk BI-FAST Rp 2.500.000 dari PT Karya Digital ke Mandiri Livin';
  const result = AIParserService.deterministicBankParse(text);

  assert.strictEqual(result.type, 'INCOME', 'Tipe harus INCOME');
  assert.strictEqual(result.amount, 2500000, 'Nominal harus Rp 2.500.000');
  assert.strictEqual(result.bankName, "Mandiri Livin'", "Bank harus Mandiri Livin'");
  assert.strictEqual(result.category, 'Salary & Freelance', 'Kategori harus Salary & Freelance');
  assert.strictEqual(result.merchantOrSender, 'PT Karya Digital', 'Pengirim harus PT Karya Digital');
});

test('3. Ekstraksi Notifikasi QRIS BRImo (Groceries Alfamart)', () => {
  const text = 'Transaksi QRIS Rp 35.000 di Alfamart berhasil dari rekening BRImo';
  const result = AIParserService.deterministicBankParse(text);

  assert.strictEqual(result.type, 'EXPENSE', 'Tipe harus EXPENSE');
  assert.strictEqual(result.amount, 35000, 'Nominal harus Rp 35.000');
  assert.strictEqual(result.bankName, 'BRImo', 'Bank harus BRImo');
  assert.strictEqual(result.category, 'Groceries', 'Kategori harus Groceries');
  assert.strictEqual(result.merchantOrSender, 'Alfamart', 'Merchant harus Alfamart');
});

test('4. Ekstraksi Notifikasi E-Wallet GoPay Food & OVO', () => {
  const gopayText = 'Pembayaran GoFood Rp 54.000 dengan GoPay berhasil di Mie Gacoan';
  const gopayRes = AIParserService.deterministicBankParse(gopayText);

  assert.strictEqual(gopayRes.type, 'EXPENSE');
  assert.strictEqual(gopayRes.amount, 54000);
  assert.strictEqual(gopayRes.bankName, 'GoPay Utama');
  assert.strictEqual(gopayRes.category, 'Food & Beverage');

  const ovoText = 'Transaksi OVO Cash Rp 32.000 di Fore Coffee berhasil';
  const ovoRes = AIParserService.deterministicBankParse(ovoText);

  assert.strictEqual(ovoRes.type, 'EXPENSE');
  assert.strictEqual(ovoRes.amount, 32000);
  assert.strictEqual(ovoRes.bankName, 'OVO');
  assert.strictEqual(ovoRes.category, 'Food & Beverage');
});

test('5. Ekstraksi Notifikasi Top Up RDN Saham (Transfer Internal)', () => {
  const text = 'Top up RDN Stockbit BCA sebesar Rp 1.000.000 dari BCA Tahapan berhasil';
  const result = AIParserService.deterministicBankParse(text);

  assert.strictEqual(result.type, 'TRANSFER', 'Harus terdeteksi sebagai TRANSFER');
  assert.strictEqual(result.amount, 1000000, 'Nominal harus 1.000.000');
  assert.strictEqual(result.category, 'Investment Top-Up', 'Kategori harus Investment Top-Up');
});

test('6. Template Deep Link MacroDroid Generator', () => {
  const deepLink = NotificationSyncService.getDeepLinkUrl(
    'Transaksi QRIS Rp 48.500 di Kopi Kenangan',
    'com.bca'
  );

  assert.ok(deepLink.startsWith('omniwealth://notification?'), 'URL harus menggunakan scheme omniwealth://notification');
  assert.ok(deepLink.includes('text='), 'Harus mengandung parameter text');
  assert.ok(deepLink.includes('app='), 'Harus mengandung parameter app');

  const guide = NotificationSyncService.getMacroDroidGuide();
  assert.ok(guide.steps.length >= 4, 'Panduan harus memiliki minimal 4 langkah');
  assert.ok(guide.deepLinkTemplate.includes('omniwealth://notification'), 'Template harus valid');
});

test('7. Ekstraksi Notifikasi Bank Jago (Uang Keluar Kantong Utama & F&B)', () => {
  const text = 'Pemberitahuan: Uang keluar Rp 62.000 untuk F&B via Kantong Utama';
  const result = AIParserService.deterministicBankParse(text, 'com.jago.digitalbanking');

  assert.strictEqual(result.type, 'EXPENSE', 'Tipe harus EXPENSE');
  assert.strictEqual(result.amount, 62000, 'Nominal harus Rp 62.000');
  assert.strictEqual(result.bankName, 'Bank Jago (Kantong Utama)', 'Bank harus Bank Jago (Kantong Utama)');
  assert.strictEqual(result.category, 'Food & Beverage', 'Kategori harus Food & Beverage');
  assert.strictEqual(result.merchantOrSender, 'F&B', 'Merchant/Tujuan harus F&B');
});

test('8. Ekstraksi Notifikasi Bunga Kantong Nabung Bank Jago', () => {
  const text = 'Pemberitahuan: Bunga kantong Rp 15.200 telah ditambahkan ke Kantong Nabung Bank Jago';
  const result = AIParserService.deterministicBankParse(text);

  assert.strictEqual(result.type, 'INCOME', 'Bunga kantong harus INCOME');
  assert.strictEqual(result.amount, 15200, 'Nominal bunga harus Rp 15.200');
  assert.strictEqual(result.bankName, 'Bank Jago (Kantong Nabung)', 'Harus mendeteksi Kantong Nabung Jago');
  assert.strictEqual(result.category, 'Interest & Dividends', 'Kategori harus Interest & Dividends');
});

test('9. Ekstraksi Notifikasi Top Up RDN Stockbit Jago (Transfer)', () => {
  const text = 'Top up saldo RDN Rp 1.000.000 dari Kantong Utama ke RDN Stockbit Jago berhasil';
  const result = AIParserService.deterministicBankParse(text);

  assert.strictEqual(result.type, 'TRANSFER', 'Top up RDN harus TRANSFER');
  assert.strictEqual(result.amount, 1000000, 'Nominal harus Rp 1.000.000');
  assert.strictEqual(result.bankName, 'RDN Stockbit Jago', 'Bank harus RDN Stockbit Jago');
  assert.strictEqual(result.category, 'Investment Top-Up', 'Kategori harus Investment Top-Up');
});

test('10. Validasi Keamanan Deep Link Secret Token & Proteksi Unauthorized Injection', () => {
  const config = {
    enabled: true,
    autoCommit: true,
    monitoredApps: ['bca'],
    clipboardDetection: false,
    syncSecretToken: 'omni_sec_test123',
  };

  // Skenario A: Valid Handshake Token
  const validUrl = { token: 'omni_sec_test123', text: 'M-Transfer BERHASIL Rp 50.000', app: 'bca' };
  const resValid = NotificationSyncService.validateDeepLink(validUrl, config);
  assert.strictEqual(resValid.isValid, true, 'Valid token harus diterima');

  // Skenario B: Token Salah (Attacker / Rogue App)
  const invalidUrl = { token: 'fake_token', text: 'M-Transfer BERHASIL Rp 100.000.000', app: 'bca' };
  const resInvalid = NotificationSyncService.validateDeepLink(invalidUrl, config);
  assert.strictEqual(resInvalid.isValid, false, 'Invalid token harus ditolak');
  assert.ok(resInvalid.reason?.includes('Kunci rahasia'), 'Alasan penolakan harus jelas');

  // Skenario C: Token Tidak Disertakan (Unauthenticated Caller)
  const missingTokenUrl = { text: 'M-Transfer BERHASIL Rp 100.000.000', app: 'bca' };
  const resMissing = NotificationSyncService.validateDeepLink(missingTokenUrl, config);
  assert.strictEqual(resMissing.isValid, false, 'Missing token harus ditolak');

  // Skenario D: Fitur Dinonaktifkan oleh Pengguna
  const disabledConfig = { ...config, enabled: false };
  const resDisabled = NotificationSyncService.validateDeepLink(validUrl, disabledConfig);
  assert.strictEqual(resDisabled.isValid, false, 'Ketika fitur dimatikan, semua deep link harus ditolak');
});
