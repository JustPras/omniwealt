import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, StockAsset, CryptoAsset, Transaction } from '../types';
import {
  INITIAL_ACCOUNTS,
  INITIAL_STOCKS,
  INITIAL_CRYPTOS,
  INITIAL_TRANSACTIONS,
  DEMO_ACCOUNTS,
  DEMO_STOCKS,
  DEMO_CRYPTOS,
  DEMO_TRANSACTIONS,
} from '../constants/initial-data';

const STORAGE_KEYS = {
  ACCOUNTS: '@omniwealth_accounts_v3',
  STOCKS: '@omniwealth_stocks_v3',
  CRYPTOS: '@omniwealth_cryptos_v3',
  TRANSACTIONS: '@omniwealth_transactions_v3',
  PRIVACY: '@omniwealth_privacy_v3',
};

export const StorageService = {
  async getAccounts(): Promise<Account[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ACCOUNTS);
      if (data) {
        return JSON.parse(data);
      }
      // First run for new user: 0 data
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(INITIAL_ACCOUNTS));
      return INITIAL_ACCOUNTS;
    } catch {
      return INITIAL_ACCOUNTS;
    }
  },

  async saveAccounts(accounts: Account[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Failed to save accounts to storage:', e);
    }
  },

  async getStocks(): Promise<StockAsset[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STOCKS);
      if (data) {
        return JSON.parse(data);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.STOCKS, JSON.stringify(INITIAL_STOCKS));
      return INITIAL_STOCKS;
    } catch {
      return INITIAL_STOCKS;
    }
  },

  async saveStocks(stocks: StockAsset[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.STOCKS, JSON.stringify(stocks));
    } catch (e) {
      console.warn('Failed to save stocks to storage:', e);
    }
  },

  async getCryptos(): Promise<CryptoAsset[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CRYPTOS);
      if (data) {
        return JSON.parse(data);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.CRYPTOS, JSON.stringify(INITIAL_CRYPTOS));
      return INITIAL_CRYPTOS;
    } catch {
      return INITIAL_CRYPTOS;
    }
  },

  async saveCryptos(cryptos: CryptoAsset[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CRYPTOS, JSON.stringify(cryptos));
    } catch (e) {
      console.warn('Failed to save cryptos to storage:', e);
    }
  },

  async getTransactions(): Promise<Transaction[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (data) {
        return JSON.parse(data);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.warn('Failed to save transactions to storage:', e);
    }
  },

  async getPrivacyMode(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PRIVACY);
      return data ? JSON.parse(data) : false;
    } catch {
      return false;
    }
  },

  async savePrivacyMode(enabled: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY, JSON.stringify(enabled));
    } catch (e) {
      console.warn('Failed to save privacy mode:', e);
    }
  },

  /**
   * Reset all storage to 0 data (clean slate for new user)
   */
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.STOCKS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.CRYPTOS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    } catch (e) {
      console.warn('Failed to clear data:', e);
    }
  },

  /**
   * Reset to initial seed (0 data)
   */
  async resetToSeed(): Promise<void> {
    return this.clearAllData();
  },

  /**
   * Populate sample demo data for testing & simulation
   */
  async loadDemoData(): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(DEMO_ACCOUNTS));
      await AsyncStorage.setItem(STORAGE_KEYS.STOCKS, JSON.stringify(DEMO_STOCKS));
      await AsyncStorage.setItem(STORAGE_KEYS.CRYPTOS, JSON.stringify(DEMO_CRYPTOS));
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(DEMO_TRANSACTIONS));
    } catch (e) {
      console.warn('Failed to load demo data:', e);
    }
  },
};
