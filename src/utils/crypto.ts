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
