import test from 'node:test';
import assert from 'node:assert';

// --- Lightweight AsyncStorage mock for Node unit tests (no native module) ---
// Intercept require('@react-native-async-storage/async-storage') so the real native
// module (which references `window`) never loads under Node. Must run BEFORE the
// StorageService import below.
const mockStore = new Map<string, string>();
const AsyncStorageMock = {
  getItem: async (key: string) => mockStore.get(key) ?? null,
  setItem: async (key: string, value: string) => {
    mockStore.set(key, value);
  },
  removeItem: async (key: string) => {
    mockStore.delete(key);
  },
};

const Module = require('node:module');
const originalLoad = Module._load;
Module._load = function (this: any, request: string, ...args: any[]) {
  if (request === '@react-native-async-storage/async-storage') {
    return AsyncStorageMock;
  }
  return originalLoad.apply(this, [request, ...args]);
};

import { encryptPayload, decryptPayload, hmacSha256 } from '../../src/utils/crypto';
import { StorageService } from '../../src/services/storage-service';

test('1. HMAC-SHA256 Menghasilkan Hash yang Konsisten dan Sesuai Spesifikasi', () => {
  const key = 'secret_key';
  const msg = 'Saldo rekening BCA Rp 25.000.000';
  const h1 = hmacSha256(key, msg);
  const h2 = hmacSha256(key, msg);
  const h3 = hmacSha256('other_key', msg);

  assert.strictEqual(h1, h2, 'HMAC untuk key dan msg yang sama harus identik');
  assert.notStrictEqual(h1, h3, 'HMAC untuk key berbeda harus menghasilkan digest berbeda');
  assert.strictEqual(h1.length, 64, 'HMAC-SHA256 hex digest harus 64 karakter');
});

test('2. Enkripsi dan Dekripsi Payload Finansial Berjalan 100% Akurat (Roundtrip)', () => {
  const masterKey = 'omni_enc_test_key_1234567890abcdef1234567890abcdef';
  const secretFinancialJson = JSON.stringify({
    accounts: [
      { id: 'acc-1', name: 'BCA Prioritas', balance: 150000000 },
      { id: 'acc-2', name: 'Bank Jago Kantong Rahasia', balance: 45000000 },
    ],
    note: 'Rekening operasional dengan Unicode: Rp 1.500.000,50 & 💰💎',
  });

  const encrypted = encryptPayload(secretFinancialJson, masterKey);
  assert.ok(encrypted.startsWith('enc:v1:'), 'Format harus diawali enc:v1:');
  assert.strictEqual(encrypted.split(':').length, 5, 'Format harus memiliki 5 bagian terpisah colon');
  assert.ok(!encrypted.includes('Prioritas'), 'Teks plaintext nama bank tidak boleh bocor');
  assert.ok(!encrypted.includes('150000000'), 'Nominal saldo tidak boleh bocor di ciphertext');

  const decrypted = decryptPayload(encrypted, masterKey);
  assert.strictEqual(decrypted, secretFinancialJson, 'Hasil dekripsi harus identik dengan plaintext');
});

test('3. Enkripsi Menghasilkan Ciphertext Berbeda untuk Input Identik (IV Random Unik)', () => {
  const masterKey = 'omni_enc_test_key_random_iv';
  const data = 'Data Saldo Identik';
  const enc1 = encryptPayload(data, masterKey);
  const enc2 = encryptPayload(data, masterKey);

  assert.notStrictEqual(enc1, enc2, 'Dua enkripsi dari data yang sama harus berbeda (IV unik per call)');
  assert.strictEqual(decryptPayload(enc1, masterKey), data);
  assert.strictEqual(decryptPayload(enc2, masterKey), data);
});

test('4. Deteksi Tampering: Modifikasi Bit Ciphertext atau MAC Ditolak dengan Exception', () => {
  const masterKey = 'omni_enc_tamper_test';
  const data = 'Data Rahasia';
  const encrypted = encryptPayload(data, masterKey);

  const parts = encrypted.split(':');
  // Modifikasi karakter terakhir ciphertext
  const tamperedCipher = parts[3].slice(0, -1) + (parts[3].slice(-1) === 'a' ? 'b' : 'a');
  const tamperedPayload = `enc:v1:${parts[2]}:${tamperedCipher}:${parts[4]}`;

  assert.throws(
    () => decryptPayload(tamperedPayload, masterKey),
    /MAC verification failed/,
    'Payload yang di-tamper harus melempar error MAC failure'
  );

  // Kunci salah juga harus ditolak
  assert.throws(
    () => decryptPayload(encrypted, 'wrong_key'),
    /MAC verification failed/,
    'Dekripsi dengan kunci yang salah harus ditolak'
  );
});

test('5. Backward Compatibility: Plaintext Warisan (Legacy) Didekripsi Transparan Tanpa Crash', () => {
  const legacyPlaintext = JSON.stringify([{ id: 'legacy-acc', balance: 5000 }]);
  const result = decryptPayload(legacyPlaintext, 'any_key');
  assert.strictEqual(result, legacyPlaintext, 'Legacy plaintext tanpa enc:v1: harus dikembalikan apa adanya');
});

test('6. StorageService Mengenkripsi Data Akun Finansial di AsyncStorage', async () => {
  const accounts = [
    {
      id: 'acc-test-enc',
      name: 'Rekening BCA Rahasia',
      type: 'BANK' as const,
      accountNumber: '1234567890',
      balance: 77000000,
      color: '#00529C',
      icon: 'landmark',
    },
  ];

  await StorageService.saveAccounts(accounts);

  // Ambil langsung dari AsyncStorage mentah (seolah-olah attacker/malware mengekstrak file lokal)
  const rawOnDisk = await AsyncStorageMock.getItem('@omniwealth_accounts_v3');
  assert.ok(rawOnDisk, 'Data harus tersimpan di storage');
  const rawEncrypted: string = rawOnDisk as string;
  assert.ok(rawEncrypted.startsWith('enc:v1:'), 'Data mentah di disk harus diawali enc:v1: (terenkripsi)');
  assert.ok(!rawEncrypted.includes('Rekening BCA Rahasia'), 'Nama akun tidak boleh terlihat di disk mentah');
  assert.ok(!rawEncrypted.includes('77000000'), 'Nominal saldo tidak boleh terlihat di disk mentah');

  // Baca melalui StorageService resmi (menggunakan master key yang sah)
  const loaded = await StorageService.getAccounts();
  const matched = loaded.find((a) => a.id === 'acc-test-enc');
  assert.ok(matched, 'Akun harus berhasil dimuat kembali');
  const matchedAccount = matched!;
  assert.strictEqual(matchedAccount.name, 'Rekening BCA Rahasia');
  assert.strictEqual(matchedAccount.balance, 77000000);
});
