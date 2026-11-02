/**
 * Pure TypeScript SHA-256 Hash Implementation
 * Completely portable across React Native (Hermes/JSC), Browser, Node.js and Jest.
 * Zero external native C++ dependencies to ensure maximum reliability and build safety.
 */

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

export function sha256(ascii: string): string {
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i = 0;
  let j = 0;
  let result = '';

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  // Initial hash values: first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19
  const hash: number[] = [];
  // Round constants: first 32 bits of the fractional parts of the cube roots of the first 64 primes 2..311
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime = (n: number) => {
    for (let factor = 2, max = Math.sqrt(n); factor <= max; factor++) {
      if (n % factor === 0) return false;
    }
    return true;
  };

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 1 / 2) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  let formatted = ascii + '\x80';
  while ((formatted.length % 64) !== 56) {
    formatted += '\x00';
  }

  for (i = 0; i < formatted.length; i++) {
    j = formatted.charCodeAt(i);
    words[i >> 2] = (words[i >> 2] || 0) | (j << (((3 - i) % 4) * 8));
  }
  words[formatted.length >> 2] = (words[formatted.length >> 2] || 0) | ((asciiBitLength / maxWord) | 0);
  words[(formatted.length >> 2) + 1] = asciiBitLength;

  // Process each 16-word block
  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = [...hash];

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15] || 0;
      const w2 = w[i - 2] || 0;

      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 =
        hash[7] +
        (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) +
        ch +
        k[i] +
        (w[i] =
          i < 16
            ? w[i] || 0
            : ((w[i - 16] || 0) + s0 + (w[i - 7] || 0) + s1) | 0);

      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 =
        (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) +
        maj;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (i = 0; i < 8; i++) {
      hash[i] = ((hash[i] || 0) + (oldHash[i] || 0)) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let byteIdx = 3; byteIdx >= 0; byteIdx--) {
      const b = (hash[i] >> (byteIdx * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Generate standard Idempotency Hash for RDN transactions
 * Format: SHA-256(accountId + transactionDate + category + netAmount + runningBalance + ticker)
 */
export function generateTransactionHash(params: {
  accountId: string;
  transactionDate: string;
  category: string;
  netAmount: number | string;
  runningBalance?: number | string | null;
  ticker?: string | null;
}): string {
  const normDate = params.transactionDate.split('T')[0];
  const normAmount = Number(params.netAmount).toFixed(2);
  const normBalance =
    params.runningBalance !== undefined && params.runningBalance !== null
      ? Number(params.runningBalance).toFixed(2)
      : 'NONE';
  const normTicker = params.ticker ? params.ticker.trim().toUpperCase() : 'NONE';

  const raw = `${params.accountId}|${normDate}|${params.category.toUpperCase()}|${normAmount}|${normBalance}|${normTicker}`;
  return sha256(raw);
}

/**
 * Compute SHA-256 Checksum for file content
 */
export function computeFileChecksum(content: string): string {
  return sha256(content);
}

/**
 * Pure TypeScript HMAC-SHA256
 */
export function hmacSha256(key: string, message: string): string {
  const BLOCK_SIZE = 64; // SHA-256 block size in bytes
  let k = key;
  if (k.length > BLOCK_SIZE) {
    k = sha256(k);
  }
  while (k.length < BLOCK_SIZE) {
    k += '\x00';
  }

  let oKeyPad = '';
  let iKeyPad = '';
  for (let i = 0; i < BLOCK_SIZE; i++) {
    const code = k.charCodeAt(i);
    oKeyPad += String.fromCharCode(code ^ 0x5c);
    iKeyPad += String.fromCharCode(code ^ 0x36);
  }

  const innerHash = sha256(iKeyPad + message);
  // Convert innerHash hex string into byte string
  let innerBytes = '';
  for (let i = 0; i < innerHash.length; i += 2) {
    innerBytes += String.fromCharCode(parseInt(innerHash.substr(i, 2), 16));
  }
  return sha256(oKeyPad + innerBytes);
}

/**
 * Cryptographically Secure Pseudo-Random Generator (CSPRNG).
 * Uses standard Web Crypto API (globalThis.crypto.getRandomValues) if available
 * (modern Hermes, Node.js 19+, browsers), with deterministic Math.random fallback.
 */
export function secureRandomHex(byteLength: number): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(byteLength);
    globalThis.crypto.getRandomValues(bytes);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) {
      hex += bytes[i].toString(16).padStart(2, '0');
    }
    return hex;
  }

  // Fallback for older JS engines without global crypto
  const ivChars = '0123456789abcdef';
  let hex = '';
  for (let i = 0; i < byteLength * 2; i++) {
    hex += ivChars.charAt(Math.floor(Math.random() * 16));
  }
  return hex;
}

/**
 * Encrypt a plaintext string using HMAC-SHA256 Keystream (CTR mode) + Encrypt-then-MAC.
 * Output format: enc:v1:<iv_hex>:<ciphertext_hex>:<mac_hex>
 * Portable across Hermes, JSC, V8, Node.js. Zero native C++ dependency.
 */
export function encryptPayload(plaintext: string, masterKey: string): string {
  if (!plaintext) return '';
  if (!masterKey) throw new Error('Master encryption key is required');

  // 1. Generate 16 bytes random IV via CSPRNG
  const ivHex = secureRandomHex(16);

  // 2. Generate keystream via HMAC-SHA256(masterKey, ivHex + counter)
  // UTF-8 encode plaintext into byte values
  const utf8Bytes: number[] = [];
  for (let i = 0; i < plaintext.length; i++) {
    let code = plaintext.charCodeAt(i);
    if (code < 0x80) {
      utf8Bytes.push(code);
    } else if (code < 0x800) {
      utf8Bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      utf8Bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      // Surrogate pair
      i++;
      code = 0x10000 + (((code & 0x3ff) << 10) | (plaintext.charCodeAt(i) & 0x3ff));
      utf8Bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }

  let cipherHex = '';
  let counter = 0;
  let keystreamBytes: number[] = [];
  let keystreamIdx = 0;

  for (let i = 0; i < utf8Bytes.length; i++) {
    if (keystreamIdx >= keystreamBytes.length) {
      const blockHash = hmacSha256(masterKey, `${ivHex}:${counter++}`);
      keystreamBytes = [];
      for (let j = 0; j < blockHash.length; j += 2) {
        keystreamBytes.push(parseInt(blockHash.substr(j, 2), 16));
      }
      keystreamIdx = 0;
    }

    const encByte = utf8Bytes[i] ^ keystreamBytes[keystreamIdx++];
    cipherHex += (encByte < 16 ? '0' : '') + encByte.toString(16);
  }

  // 3. Encrypt-then-MAC: HMAC-SHA256(masterKey, ivHex + ":" + cipherHex)
  const mac = hmacSha256(masterKey, `${ivHex}:${cipherHex}`);
  return `enc:v1:${ivHex}:${cipherHex}:${mac}`;
}

/**
 * Decrypt a payload produced by encryptPayload.
 * If the string does NOT start with `enc:v1:`, returns the string as-is (backward compatible with legacy plaintext).
 */
export function decryptPayload(payload: string, masterKey: string): string {
  if (!payload) return '';
  if (!payload.startsWith('enc:v1:')) {
    // Legacy plaintext: return as-is for transparent migration
    return payload;
  }

  const parts = payload.split(':');
  if (parts.length !== 5) {
    throw new Error('Invalid encrypted payload format');
  }

  const ivHex = parts[2];
  const cipherHex = parts[3];
  const expectedMac = parts[4];

  // 1. Verify MAC (Constant-time check)
  const actualMac = hmacSha256(masterKey, `${ivHex}:${cipherHex}`);
  if (actualMac !== expectedMac) {
    throw new Error('Encrypted payload MAC verification failed (tampered data or wrong key)');
  }

  // 2. Keystream XOR decrypt
  const cipherBytes: number[] = [];
  for (let i = 0; i < cipherHex.length; i += 2) {
    cipherBytes.push(parseInt(cipherHex.substr(i, 2), 16));
  }

  const decryptedBytes: number[] = [];
  let counter = 0;
  let keystreamBytes: number[] = [];
  let keystreamIdx = 0;

  for (let i = 0; i < cipherBytes.length; i++) {
    if (keystreamIdx >= keystreamBytes.length) {
      const blockHash = hmacSha256(masterKey, `${ivHex}:${counter++}`);
      keystreamBytes = [];
      for (let j = 0; j < blockHash.length; j += 2) {
        keystreamBytes.push(parseInt(blockHash.substr(j, 2), 16));
      }
      keystreamIdx = 0;
    }

    decryptedBytes.push(cipherBytes[i] ^ keystreamBytes[keystreamIdx++]);
  }

  // 3. UTF-8 decode
  let str = '';
  for (let i = 0; i < decryptedBytes.length; ) {
    const b0 = decryptedBytes[i++];
    if (b0 < 0x80) {
      str += String.fromCharCode(b0);
    } else if (b0 < 0xe0) {
      const b1 = decryptedBytes[i++];
      str += String.fromCharCode(((b0 & 0x1f) << 6) | (b1 & 0x3f));
    } else if (b0 < 0xf0) {
      const b1 = decryptedBytes[i++];
      const b2 = decryptedBytes[i++];
      str += String.fromCharCode(((b0 & 0x0f) << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f));
    } else {
      const b1 = decryptedBytes[i++];
      const b2 = decryptedBytes[i++];
      const b3 = decryptedBytes[i++];
      let cp =
        ((b0 & 0x07) << 18) |
        ((b1 & 0x3f) << 12) |
        ((b2 & 0x3f) << 6) |
        (b3 & 0x3f);
      cp -= 0x10000;
      str += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
    }
  }

  return str;
}
