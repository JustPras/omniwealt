import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, StockAsset, CryptoAsset, Transaction, CryptoWallet } from '../types';
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

export interface CachedMarketQuote {
  price: number;
  change24h: number;
  updatedAt: string;
}

export interface MarketCacheData {
  lastUpdated: string;
  stocks: Record<string, CachedMarketQuote>;
  cryptos: Record<string, CachedMarketQuote>;
}

const STORAGE_KEYS = {
  ACCOUNTS: '@omniwealth_accounts_v3',
  STOCKS: '@omniwealth_stocks_v3',
  CRYPTOS: '@omniwealth_cryptos_v3',
  TRANSACTIONS: '@omniwealth_transactions_v3',
  PRIVACY: '@omniwealth_privacy_v3',
  MARKET_CACHE: '@omniwealth_market_cache_v3',
  CRYPTO_WALLETS: '@omniwealth_crypto_wallets_v3',
};

const DEFAULT_MARKET_CACHE: MarketCacheData = {
  lastUpdated: new Date().toISOString(),
  stocks: {},
  cryptos: {},
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

  async getCryptoWallets(): Promise<CryptoWallet[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CRYPTO_WALLETS);
      if (data) {
        return JSON.parse(data);
      }
      return [];
    } catch {
      return [];
    }
  },

  async saveCryptoWallets(wallets: CryptoWallet[]): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CRYPTO_WALLETS, JSON.stringify(wallets));
    } catch (e) {
      console.warn('Failed to save crypto wallets to storage:', e);
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

  // -------------------------------------------------------------
  // Offline Market Cache Management
  // -------------------------------------------------------------

  /**
   * Get all cached stock & crypto market data for offline usage
   */
  async getMarketCache(): Promise<MarketCacheData> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.MARKET_CACHE);
      if (data) {
        return JSON.parse(data);
      }
      return DEFAULT_MARKET_CACHE;
    } catch {
      return DEFAULT_MARKET_CACHE;
    }
  },

  /**
   * Save complete market cache to storage
   */
  async saveMarketCache(cache: MarketCacheData): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.MARKET_CACHE, JSON.stringify(cache));
    } catch (e) {
      console.warn('Failed to save market cache:', e);
    }
  },

  /**
   * Retrieve cached price for a single stock ticker
   */
  async getCachedStockPrice(ticker: string): Promise<CachedMarketQuote | null> {
    try {
      const cache = await this.getMarketCache();
      const cleanTicker = ticker.toUpperCase().endsWith('.JK') ? ticker.toUpperCase() : `${ticker.toUpperCase()}.JK`;
      return cache.stocks[cleanTicker] || null;
    } catch {
      return null;
    }
  },

  /**
   * Retrieve cached price for a single crypto id
   */
  async getCachedCryptoPrice(id: string): Promise<CachedMarketQuote | null> {
    try {
      const cache = await this.getMarketCache();
      return cache.cryptos[id.toLowerCase()] || null;
    } catch {
      return null;
    }
  },

  /**
   * Update market cache with fresh quotes: overwrites old prices and updates timestamp.
   * Cleans out stale records so offline access is fast and up-to-date.
   */
  async updateMarketQuotes(
    newStocks: Record<string, { price: number; change24h: number }>,
    newCryptos: Record<string, { priceIdr: number; change24h: number }>
  ): Promise<MarketCacheData> {
    try {
      const currentCache = await this.getMarketCache();
      const now = new Date().toISOString();

      const updatedStocks = { ...currentCache.stocks };
      for (const [rawTicker, quote] of Object.entries(newStocks)) {
        const cleanTicker = rawTicker.toUpperCase().endsWith('.JK')
          ? rawTicker.toUpperCase()
          : `${rawTicker.toUpperCase()}.JK`;
        updatedStocks[cleanTicker] = {
          price: quote.price,
          change24h: quote.change24h,
          updatedAt: now,
        };
      }

      const updatedCryptos = { ...currentCache.cryptos };
      for (const [id, quote] of Object.entries(newCryptos)) {
        updatedCryptos[id.toLowerCase()] = {
          price: quote.priceIdr,
          change24h: quote.change24h,
          updatedAt: now,
        };
      }

      const updatedCache: MarketCacheData = {
        lastUpdated: now,
        stocks: updatedStocks,
        cryptos: updatedCryptos,
      };

      await this.saveMarketCache(updatedCache);
      return updatedCache;
    } catch (e) {
      console.warn('Failed to update market quotes cache:', e);
      return DEFAULT_MARKET_CACHE;
    }
  },

  /**
   * Prune/clean market cache: deletes cached entries for assets that the user
   * has removed from their portfolio, ensuring obsolete market data is purged.
   */
  async pruneMarketCache(activeTickers: string[], activeCryptoIds: string[]): Promise<void> {
    try {
      const currentCache = await this.getMarketCache();
      const activeCleanTickers = new Set(
        activeTickers.map((t) => (t.toUpperCase().endsWith('.JK') ? t.toUpperCase() : `${t.toUpperCase()}.JK`))
      );
      const activeCleanCryptoIds = new Set(activeCryptoIds.map((c) => c.toLowerCase()));

      const prunedStocks: Record<string, CachedMarketQuote> = {};
      for (const [ticker, quote] of Object.entries(currentCache.stocks)) {
        if (activeCleanTickers.has(ticker)) {
          prunedStocks[ticker] = quote;
        }
      }

      const prunedCryptos: Record<string, CachedMarketQuote> = {};
      for (const [id, quote] of Object.entries(currentCache.cryptos)) {
        if (activeCleanCryptoIds.has(id)) {
          prunedCryptos[id] = quote;
        }
      }

      const prunedCache: MarketCacheData = {
        lastUpdated: currentCache.lastUpdated,
        stocks: prunedStocks,
        cryptos: prunedCryptos,
      };

      await this.saveMarketCache(prunedCache);
    } catch (e) {
      console.warn('Failed to prune market cache:', e);
    }
  },

  /**
   * Completely clear market cache
   */
  async clearMarketCache(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.MARKET_CACHE);
    } catch (e) {
      console.warn('Failed to clear market cache:', e);
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
      await AsyncStorage.setItem(STORAGE_KEYS.CRYPTO_WALLETS, JSON.stringify([]));
      await AsyncStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      await this.clearMarketCache();
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
