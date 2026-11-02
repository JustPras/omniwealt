// Secure Storage Service: wraps expo-secure-store for native platforms (iOS Keychain / Android KeyStore)
// Falls back to in-memory/AsyncStorage on web or during node unit tests where native modules are unavailable.

import { secureRandomHex } from '../utils/crypto';

type SecureStoreModule = typeof import('expo-secure-store');

const inMemoryFallback: Map<string, string> = new Map();

// Lazy-load the native module so Node/jest tests (no RT) don't crash on static import.
let nativeSecureStore: SecureStoreModule | null = null;
let nativeChecked = false;

function getSecureStore(): SecureStoreModule | null {
  if (nativeChecked) return nativeSecureStore;
  nativeChecked = true;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    nativeSecureStore = require('expo-secure-store') as SecureStoreModule;
  } catch {
    nativeSecureStore = null;
  }
  return nativeSecureStore;
}

export const SecureStorageService = {
  /** Master encryption key for app-local financial data (Keychain/Keystore). Never persisted in AsyncStorage. */
  async getOrCreateMasterKey(): Promise<string> {
    const KEY = 'omniwealth_master_encryption_key_v1';
    let key = await this.getItem(KEY);
    if (key) return key;

    // Generate 32 random bytes hex => 64 hex chars via CSPRNG
    key = `omni_enc_${secureRandomHex(32)}`;
    await this.setItem(KEY, key);
    return key;
  },

  /**
   * Save a sensitive string (token, secret, auth key) to hardware-backed secure storage
   */
  async setItem(key: string, value: string): Promise<void> {
    const mod = getSecureStore();
    try {
      if (!mod || typeof mod.setItemAsync !== 'function') {
        inMemoryFallback.set(key, value);
        return;
      }
      await mod.setItemAsync(key, value, {
        keychainAccessible: (mod as any).AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
      });
    } catch (e) {
      // Fallback in case of hardware keystore failure (e.g. unauthenticated simulator)
      inMemoryFallback.set(key, value);
    }
  },

  /**
   * Retrieve a sensitive string from hardware-backed secure storage
   */
  async getItem(key: string): Promise<string | null> {
    const mod = getSecureStore();
    try {
      if (!mod || typeof mod.getItemAsync !== 'function') {
        return inMemoryFallback.get(key) || null;
      }
      const val = await mod.getItemAsync(key);
      if (val !== null) return val;
      return inMemoryFallback.get(key) || null;
    } catch {
      return inMemoryFallback.get(key) || null;
    }
  },

  /**
   * Remove an item from secure storage
   */
  async deleteItem(key: string): Promise<void> {
    const mod = getSecureStore();
    try {
      if (!mod || typeof mod.deleteItemAsync !== 'function') {
        inMemoryFallback.delete(key);
        return;
      }
      await mod.deleteItemAsync(key);
      inMemoryFallback.delete(key);
    } catch {
      inMemoryFallback.delete(key);
    }
  },
};
