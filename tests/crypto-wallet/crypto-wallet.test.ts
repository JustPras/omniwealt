import test from 'node:test';
import assert from 'node:assert';
import { CryptoWalletService } from '../../src/services/crypto-wallet-service';

test('1. Validasi Alamat Publik Multi-Chain (EVM, Solana, Bitcoin)', () => {
  // EVM Addresses
  assert.strictEqual(
    CryptoWalletService.isValidAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'EVM'),
    true,
    'Alamat EVM Vitalik valid'
  );
  assert.strictEqual(
    CryptoWalletService.isValidAddress('0x0000000000000000000000000000000000000000', 'EVM'),
    true,
    'Alamat EVM burn address valid'
  );
  assert.strictEqual(
    CryptoWalletService.isValidAddress('0x12345', 'EVM'),
    false,
    'Alamat EVM terlalu pendek harus invalid'
  );
  assert.strictEqual(
    CryptoWalletService.isValidAddress('d8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'EVM'),
    false,
    'Alamat EVM tanpa 0x harus invalid'
  );

  // Solana Addresses
  assert.strictEqual(
    CryptoWalletService.isValidAddress('vines1vzrYbzLMRdu58sy5XTSEPbEK9aZXgHG7xXt21', 'SOLANA'),
    true,
    'Alamat Solana valid'
  );
  assert.strictEqual(
    CryptoWalletService.isValidAddress('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', 'SOLANA'),
    true,
    'Alamat Binance Solana hot wallet valid'
  );
  assert.strictEqual(
    CryptoWalletService.isValidAddress('0x1234567890abcdef', 'SOLANA'),
    false,
    'Alamat EVM tidak boleh valid sebagai Solana'
  );

  // Bitcoin Addresses
  assert.strictEqual(
    CryptoWalletService.isValidAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'BITCOIN'),
    true,
    'Alamat Bitcoin Genesis (Legacy 1...) valid'
  );
  assert.strictEqual(
    CryptoWalletService.isValidAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', 'BITCOIN'),
    true,
    'Alamat Bitcoin SegWit (3...) valid'
  );
  assert.strictEqual(
    CryptoWalletService.isValidAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 'BITCOIN'),
    true,
    'Alamat Bitcoin Native SegWit Bech32 (bc1...) valid'
  );
  assert.strictEqual(
    CryptoWalletService.isValidAddress('invalid_btc_address', 'BITCOIN'),
    false,
    'Alamat Bitcoin acak harus invalid'
  );
});

test('2. Deteksi Otomatis Blockchain Network (Auto-Detect Network)', () => {
  assert.strictEqual(
    CryptoWalletService.detectNetworkType('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'),
    'EVM',
    'Harus mendeteksi EVM untuk format 0x'
  );
  assert.strictEqual(
    CryptoWalletService.detectNetworkType('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq'),
    'BITCOIN',
    'Harus mendeteksi BITCOIN untuk format bc1'
  );
  assert.strictEqual(
    CryptoWalletService.detectNetworkType('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'),
    'BITCOIN',
    'Harus mendeteksi BITCOIN untuk format 1...'
  );
  assert.strictEqual(
    CryptoWalletService.detectNetworkType('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM'),
    'SOLANA',
    'Harus mendeteksi SOLANA untuk format base58'
  );
  assert.strictEqual(
    CryptoWalletService.detectNetworkType('not-a-crypto-address'),
    null,
    'Harus return null untuk teks tidak valid'
  );
});

test('3. Format & Pemendekan Alamat Dompet (Truncate Address)', () => {
  const evm = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
  const truncatedEvm = CryptoWalletService.truncateAddress(evm, 6, 4);
  assert.strictEqual(truncatedEvm, '0xd8dA...6045');

  const btc = 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq';
  const truncatedBtc = CryptoWalletService.truncateAddress(btc, 6, 4);
  assert.strictEqual(truncatedBtc, 'bc1qar...5mdq');

  // String pendek tidak dipotong
  assert.strictEqual(CryptoWalletService.truncateAddress('0x123', 6, 4), '0x123');
});
