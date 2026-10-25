// Real-Time Market Data Service for IDX Stocks & CoinGecko Crypto with Offline Local Caching
import { StorageService } from './storage-service';

export interface StockQuote {
  ticker: string;
  price: number;
  change24h: number;
  regularMarketTime?: number;
}

export interface CryptoQuote {
  id: string;
  priceIdr: number;
  change24h: number;
}

// Fallback base values for IDX stocks if neither online nor cached data exists
const DEFAULT_IDX_PRICES: Record<string, { price: number; change24h: number }> = {
  'BBCA.JK': { price: 9950, change24h: 0.0179 },
  'BMRI.JK': { price: 6725, change24h: 0.0151 },
  'TLKM.JK': { price: 3040, change24h: -0.0065 },
  'BBRI.JK': { price: 4820, change24h: 0.0084 },
  'GOTO.JK': { price: 69, change24h: 0.0294 },
};

// Fallback base values for Cryptos in IDR if neither online nor cached data exists
const DEFAULT_CRYPTO_PRICES: Record<string, { priceIdr: number; change24h: number }> = {
  bitcoin: { priceIdr: 1045000000, change24h: 0.0245 },
  ethereum: { priceIdr: 44800000, change24h: 0.011 },
  solana: { priceIdr: 2840000, change24h: 0.052 },
};

export const MarketService = {
  /**
   * Fetch live stock quote for Indonesian IDX (.JK).
   * If online, returns real-time Yahoo Finance quote.
   * If offline or network error, prioritizes the latest cached market data from storage.
   * Supports common shares and derivative instruments (Warrants like GOTO-W, Rights like BBRI-R).
   */
  async fetchStockPrice(ticker: string, fallbackPrice?: number): Promise<StockQuote> {
    const cleanTicker = ticker.toUpperCase().endsWith('.JK') ? ticker.toUpperCase() : `${ticker.toUpperCase()}.JK`;

    try {
      // Direct Yahoo Finance v8 chart query
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanTicker}?interval=1d&range=1d`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (OmniWealth Mobile Native App)',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        const meta = json?.chart?.result?.[0]?.meta;
        if (meta && typeof meta.regularMarketPrice === 'number' && meta.regularMarketPrice > 0) {
          const current = meta.regularMarketPrice;
          const prevClose = meta.previousClose || meta.chartPreviousClose || current;
          const change = prevClose > 0 ? (current - prevClose) / prevClose : 0;
          return {
            ticker: cleanTicker,
            price: current,
            change24h: change,
            regularMarketTime: meta.regularMarketTime,
          };
        }
      }
    } catch {
      // Network, CORS or rate-limit: degrade to offline cached price
    }

    // 1. Offline Priority: Check local market cache for the latest updated price
    const cached = await StorageService.getCachedStockPrice(cleanTicker);
    if (cached && typeof cached.price === 'number' && cached.price > 0) {
      return {
        ticker: cleanTicker,
        price: cached.price,
        change24h: cached.change24h,
      };
    }

    // 2. Specific Fallback: If fallbackPrice is provided (e.g. from buy price / portfolio), use it
    if (typeof fallbackPrice === 'number' && fallbackPrice > 0) {
      return {
        ticker: cleanTicker,
        price: fallbackPrice,
        change24h: 0,
      };
    }

    // 3. Fallback to default dictionary if no cache exists
    const isWarrantOrRight = /-([WR][0-9A-Z]*)\.JK$/i.test(cleanTicker);
    const defaultPrice = isWarrantOrRight ? 50 : 5000;
    const fallback = DEFAULT_IDX_PRICES[cleanTicker] || { price: defaultPrice, change24h: 0.01 };
    return {
      ticker: cleanTicker,
      price: fallback.price,
      change24h: fallback.change24h,
    };
  },

  /**
   * Batch fetch stock prices for all active stocks
   */
  async fetchAllStocks(tickers: string[], fallbackPrices?: Record<string, number>): Promise<Record<string, StockQuote>> {
    const results: Record<string, StockQuote> = {};
    await Promise.all(
      tickers.map(async (t) => {
        results[t] = await MarketService.fetchStockPrice(t, fallbackPrices?.[t]);
      })
    );
    return results;
  },

  /**
   * Fetch live crypto prices in IDR from CoinGecko.
   * If online, returns real-time IDR quotes.
   * If offline or rate-limited, prioritizes the latest cached market data from storage.
   */
  async fetchCryptoPrices(ids: string[] = ['bitcoin', 'ethereum', 'solana']): Promise<Record<string, CryptoQuote>> {
    const results: Record<string, CryptoQuote> = {};
    const joinedIds = ids.join(',');

    try {
      const url = `https://api.coingecko.com/api/v3/simple/price?ids=${joinedIds}&vs_currencies=idr&include_24hr_change=true`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500);

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        for (const id of ids) {
          if (json[id]?.idr) {
            results[id] = {
              id,
              priceIdr: json[id].idr,
              change24h: (json[id].idr_24h_change || 0) / 100,
            };
          }
        }
        if (Object.keys(results).length === ids.length) {
          return results;
        }
      }
    } catch {
      // CoinGecko public rate limit or network issue: fall back to offline cache
    }

    // Offline Priority: For any un-fetched cryptos, check local cached market data
    for (const id of ids) {
      if (!results[id]) {
        const cached = await StorageService.getCachedCryptoPrice(id);
        if (cached && typeof cached.price === 'number' && cached.price > 0) {
          results[id] = {
            id,
            priceIdr: cached.price,
            change24h: cached.change24h,
          };
        } else {
          const def = DEFAULT_CRYPTO_PRICES[id] || { priceIdr: 1000000, change24h: 0.02 };
          results[id] = {
            id,
            priceIdr: def.priceIdr,
            change24h: def.change24h,
          };
        }
      }
    }

    return results;
  },
};
