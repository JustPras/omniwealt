import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  Account,
  StockAsset,
  CryptoAsset,
  Transaction,
  BrokerExtractionResult,
  BankMutationResult,
  RDNStagingBatch,
  StandardizedRDNRecord,
  IngestionPayload,
} from '../types';
import { StorageService } from '../services/storage-service';
import { MarketService } from '../services/market-service';
import { AIParserService } from '../services/ai-parser';
import {
  IngestionService,
  LedgerCommitService,
  RDNStagingService,
  CommitResult,
} from '../services/rdn-pipeline';
import { triggerHaptic } from '../utils/haptics';
import { formatIDR } from '../utils/format';

interface WealthContextType {
  // Data State
  accounts: Account[];
  stocks: StockAsset[];
  cryptos: CryptoAsset[];
  transactions: Transaction[];
  privacyMode: boolean;
  isHydrated: boolean;
  isRefreshing: boolean;
  lastUpdated: Date;

  // RDN Pipeline Staging & Jobs
  stagingBatches: RDNStagingBatch[];
  activeStagingBatch: RDNStagingBatch | null;
  setActiveStagingBatch: (batch: RDNStagingBatch | null) => void;
  processRDNIngestion: (payload: IngestionPayload) => Promise<RDNStagingBatch>;
  commitRDNStagingBatch: (batchId: string) => Promise<CommitResult>;
  updateRDNStagingItem: (batchId: string, itemId: string, updates: Partial<StandardizedRDNRecord>) => Promise<void>;
  discardRDNStagingBatch: (batchId: string) => Promise<void>;
  toggleAccountAutoCommit: (accountId: string) => Promise<void>;

  // Computed Financial Metrics
  totalCash: number;
  totalStocks: number;
  totalCryptos: number;
  totalNetWorth: number;
  totalInvestments: number;
  totalInvestmentCost: number;
  totalUnrealizedPnL: number;
  totalUnrealizedPnLPercent: number;
  dailyChangeRp: number;
  dailyChangePercent: number;

  // Actions
  togglePrivacy: () => void;
  refreshMarketPrices: (isSilent?: boolean) => Promise<void>;
  addAccount: (account: Omit<Account, 'id'>) => Promise<void>;
  updateAccountBalance: (id: string, delta: number, description: string, type: 'INCOME' | 'EXPENSE') => Promise<void>;
  applyMutationText: (text: string) => Promise<BankMutationResult>;
  confirmBrokerTrades: (result: BrokerExtractionResult, targetRdnId?: string) => Promise<{ success: boolean; message: string }>;
  saveStock: (stock: Omit<StockAsset, 'id'>, id?: string) => Promise<void>;
  deleteStock: (id: string) => Promise<void>;
  saveCrypto: (crypto: Omit<CryptoAsset, 'id'>, id?: string) => Promise<void>;
  deleteCrypto: (id: string) => Promise<void>;
  resetToInitialSeed: () => Promise<void>;
  clearAllData: () => Promise<void>;
  loadDemoData: () => Promise<void>;
}

const WealthContext = createContext<WealthContextType | null>(null);

export const WealthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [stocks, setStocks] = useState<StockAsset[]>([]);
  const [cryptos, setCryptos] = useState<CryptoAsset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stagingBatches, setStagingBatches] = useState<RDNStagingBatch[]>([]);
  const [activeStagingBatch, setActiveStagingBatch] = useState<RDNStagingBatch | null>(null);
  const [privacyMode, setPrivacyMode] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 1. Initial Hydration from Storage
  useEffect(() => {
    let isMounted = true;
    const hydrate = async () => {
      try {
        const [storedAcc, storedStocks, storedCryptos, storedTx, storedPrivacy, storedMarket, storedBatches] = await Promise.all([
          StorageService.getAccounts(),
          StorageService.getStocks(),
          StorageService.getCryptos(),
          StorageService.getTransactions(),
          StorageService.getPrivacyMode(),
          StorageService.getMarketCache(),
          RDNStagingService.getBatches(),
        ]);

        if (isMounted) {
          setAccounts(storedAcc);
          setStocks(storedStocks);
          setCryptos(storedCryptos);
          setTransactions(storedTx);
          setPrivacyMode(storedPrivacy);
          setStagingBatches(storedBatches);
          if (storedBatches.length > 0) {
            setActiveStagingBatch(storedBatches[0]);
          }
          if (storedMarket?.lastUpdated) {
            setLastUpdated(new Date(storedMarket.lastUpdated));
          }
          setIsHydrated(true);
        }
      } catch (e) {
        console.warn('Hydration error:', e);
        if (isMounted) setIsHydrated(true);
      }
    };
    hydrate();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Computed Values
  const totalCash = accounts.reduce((acc, a) => acc + (Number(a.balance) || 0), 0);

  const totalStocks = stocks.reduce((acc, s) => {
    const shares = (Number(s.lots) || 0) * 100;
    return acc + shares * (Number(s.currentPrice) || 0);
  }, 0);

  const totalStockCost = stocks.reduce((acc, s) => {
    const shares = (Number(s.lots) || 0) * 100;
    return acc + shares * (Number(s.avgBuyPrice) || 0);
  }, 0);

  const totalCryptos = cryptos.reduce((acc, c) => {
    return acc + (Number(c.holdings) || 0) * (Number(c.currentPriceIdr) || 0);
  }, 0);

  const totalCryptoCost = cryptos.reduce((acc, c) => {
    return acc + (Number(c.holdings) || 0) * (Number(c.avgBuyPriceIdr) || 0);
  }, 0);

  const totalNetWorth = totalCash + totalStocks + totalCryptos;
  const totalInvestments = totalStocks + totalCryptos;
  const totalInvestmentCost = totalStockCost + totalCryptoCost;
  const totalUnrealizedPnL = totalInvestments - totalInvestmentCost;
  const totalUnrealizedPnLPercent = totalInvestmentCost > 0 ? totalUnrealizedPnL / totalInvestmentCost : 0;

  // Daily portfolio movement estimation
  const dailyStockChangeRp = stocks.reduce((acc, s) => {
    const val = (Number(s.lots) || 0) * 100 * (Number(s.currentPrice) || 0);
    return acc + val * (Number(s.change24h) || 0);
  }, 0);

  const dailyCryptoChangeRp = cryptos.reduce((acc, c) => {
    const val = (Number(c.holdings) || 0) * (Number(c.currentPriceIdr) || 0);
    return acc + val * (Number(c.change24h) || 0);
  }, 0);

  const dailyChangeRp = dailyStockChangeRp + dailyCryptoChangeRp;
  const dailyChangePercent = totalInvestments > 0 ? dailyChangeRp / totalInvestments : 0.0125;

  // 3. Market Price Refresh (manual or automatic background silent refresh)
  const refreshMarketPrices = useCallback(async (isSilent: boolean = false) => {
    if (!isSilent) {
      setIsRefreshing(true);
      triggerHaptic('light');
    }

    try {
      const stockTickers = stocks.map((s) => s.ticker);
      const stockFallbackPrices: Record<string, number> = {};
      stocks.forEach((s) => {
        stockFallbackPrices[s.ticker] = s.currentPrice || s.avgBuyPrice;
      });
      const cryptoIds = cryptos.map((c) => c.coingeckoId);

      if (stockTickers.length === 0 && cryptoIds.length === 0) {
        if (!isSilent) setIsRefreshing(false);
        return;
      }

      const [stockQuotes, cryptoQuotes] = await Promise.all([
        MarketService.fetchAllStocks(stockTickers, stockFallbackPrices),
        MarketService.fetchCryptoPrices(cryptoIds),
      ]);

      // Save fresh market quotes to offline storage and prune deleted/stale records
      await StorageService.updateMarketQuotes(stockQuotes, cryptoQuotes);
      await StorageService.pruneMarketCache(stockTickers, cryptoIds);

      // Update stocks with fresh market data
      setStocks((prev) => {
        const updated = prev.map((s) => {
          const q = stockQuotes[s.ticker];
          if (q) {
            return {
              ...s,
              currentPrice: q.price,
              change24h: q.change24h,
              updatedAt: new Date().toISOString(),
            };
          }
          return s;
        });
        StorageService.saveStocks(updated);
        return updated;
      });

      // Update cryptos with fresh market data
      setCryptos((prev) => {
        const updated = prev.map((c) => {
          const q = cryptoQuotes[c.coingeckoId];
          if (q) {
            return {
              ...c,
              currentPriceIdr: q.priceIdr,
              change24h: q.change24h,
              updatedAt: new Date().toISOString(),
            };
          }
          return c;
        });
        StorageService.saveCryptos(updated);
        return updated;
      });

      setLastUpdated(new Date());
      if (!isSilent) triggerHaptic('success');
    } catch (e) {
      console.warn('Market refresh failed:', e);
      if (!isSilent) triggerHaptic('warning');
    } finally {
      if (!isSilent) setIsRefreshing(false);
    }
  }, [stocks, cryptos]);

  // Automatic periodic background refresh for market prices (every 60 seconds)
  useEffect(() => {
    if (!isHydrated) return;
    if (stocks.length === 0 && cryptos.length === 0) return;

    // Initial background sync shortly after hydration
    const initialSyncTimer = setTimeout(() => {
      refreshMarketPrices(true);
    }, 2000);

    const autoRefreshInterval = setInterval(() => {
      refreshMarketPrices(true);
    }, 60000);

    return () => {
      clearTimeout(initialSyncTimer);
      clearInterval(autoRefreshInterval);
    };
  }, [isHydrated, stocks.length, cryptos.length, refreshMarketPrices]);

  // 4. Privacy Toggle
  const togglePrivacy = useCallback(() => {
    triggerHaptic('selection');
    setPrivacyMode((prev) => {
      const next = !prev;
      StorageService.savePrivacyMode(next);
      return next;
    });
  }, []);

  // 5. Account Management
  const addAccount = useCallback(async (newAcc: Omit<Account, 'id'>) => {
    triggerHaptic('medium');
    const account: Account = {
      ...newAcc,
      id: `acc-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    setAccounts((prev) => {
      const updated = [account, ...prev];
      StorageService.saveAccounts(updated);
      return updated;
    });
  }, []);

  const updateAccountBalance = useCallback(
    async (id: string, delta: number, description: string, type: 'INCOME' | 'EXPENSE') => {
      triggerHaptic('medium');
      let targetAccName = '';

      setAccounts((prev) => {
        const updated = prev.map((a) => {
          if (a.id === id) {
            targetAccName = a.name;
            const newBal = Math.max(0, (Number(a.balance) || 0) + delta);
            return { ...a, balance: newBal, updatedAt: new Date().toISOString() };
          }
          return a;
        });
        StorageService.saveAccounts(updated);
        return updated;
      });

      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        accountId: id,
        accountName: targetAccName,
        type,
        amount: Math.abs(delta),
        category: type === 'INCOME' ? 'Income' : 'Expense',
        description,
        source: 'MANUAL',
        transactionDate: new Date().toISOString(),
      };

      setTransactions((prev) => {
        const updated = [tx, ...prev];
        StorageService.saveTransactions(updated);
        return updated;
      });
    },
    []
  );

  // 6. Bank Mutation Processing
  const applyMutationText = useCallback(
    async (text: string): Promise<BankMutationResult> => {
      const parsed = await AIParserService.parseBankMutation(text);

      // Find matched account or create one
      let matchedAccount =
        accounts.find((a) => a.name.toLowerCase().includes(parsed.bankName.toLowerCase())) ||
        accounts.find((a) => a.type === 'BANK') ||
        accounts[0];

      if (!matchedAccount) {
        matchedAccount = {
          id: `acc-${Date.now()}`,
          name: parsed.bankName || 'Rekening Utama',
          type: 'BANK',
          accountNumber: 'Aktif',
          balance: parsed.type === 'INCOME' ? parsed.amount : 0,
          color: '#38BDF8',
          icon: 'landmark',
          updatedAt: new Date().toISOString(),
        };
        setAccounts((prev) => {
          const updated = [matchedAccount, ...prev];
          StorageService.saveAccounts(updated);
          return updated;
        });
      }

      let delta = 0;
      if (parsed.type === 'EXPENSE') delta = -parsed.amount;
      else if (parsed.type === 'INCOME') delta = parsed.amount;
      else if (parsed.type === 'TRANSFER') {
        // Transfer to RDN or another account
        delta = -parsed.amount;
        const rdnAccount = accounts.find((a) => a.type === 'RDN');
        if (rdnAccount) {
          setAccounts((prev) => {
            const updated = prev.map((a) => {
              if (a.id === rdnAccount.id) {
                return { ...a, balance: a.balance + parsed.amount };
              }
              return a;
            });
            StorageService.saveAccounts(updated);
            return updated;
          });
        }
      }

      // Apply to matched account
      setAccounts((prev) => {
        const updated = prev.map((a) => {
          if (a.id === matchedAccount.id) {
            return { ...a, balance: Math.max(0, a.balance + delta) };
          }
          return a;
        });
        StorageService.saveAccounts(updated);
        return updated;
      });

      // Add Transaction
      const newTx: Transaction = {
        id: `tx-ai-${Date.now()}`,
        accountId: matchedAccount.id,
        accountName: matchedAccount.name,
        type: parsed.type,
        amount: parsed.amount,
        category: parsed.category,
        description: parsed.description,
        rawNotificationText: text,
        source: 'AI_MUTATION',
        transactionDate: new Date().toISOString(),
      };

      setTransactions((prev) => {
        const updated = [newTx, ...prev];
        StorageService.saveTransactions(updated);
        return updated;
      });

      triggerHaptic('success');
      return parsed;
    },
    [accounts]
  );

  // 7. Broker Trade Confirmation Engine (Auto-Update Lots, Avg Buy Price & RDN)
  const confirmBrokerTrades = useCallback(
    async (
      result: BrokerExtractionResult,
      targetRdnId?: string
    ): Promise<{ success: boolean; message: string }> => {
      triggerHaptic('medium');

      // Resolve RDN account or prepare fallback
      let rdnAcc =
        accounts.find((a) => a.id === targetRdnId) ||
        accounts.find((a) => a.accountNumber === result.rdnAccountNumber) ||
        accounts.find((a) => a.type === 'RDN') ||
        accounts[0];

      if (!rdnAcc) {
        rdnAcc = {
          id: `acc-rdn-${Date.now()}`,
          name: `RDN ${result.brokerName ? result.brokerName.replace('PT. ', '') : 'Sekuritas'}`,
          type: 'RDN',
          accountNumber: result.rdnAccountNumber || '1000000000',
          balance: result.rdnCashBalance || 0,
          color: '#10B981',
          icon: 'trending-up',
          updatedAt: new Date().toISOString(),
        };
      }

      // Special Handler for Statement of Account (Holdings Snapshot)
      if (result.documentType === 'STATEMENT_OF_ACCOUNT' && result.holdings && result.holdings.length > 0) {
        const targetRdn =
          accounts.find((a) => a.accountNumber === result.rdnAccountNumber) ||
          accounts.find((a) => a.type === 'RDN') ||
          rdnAcc;

        // 1. Sync Stock Holdings
        setStocks((prevStocks) => {
          let updatedStocks = [...prevStocks];

          for (const item of result.holdings!) {
            const existingIdx = updatedStocks.findIndex(
              (s) => s.ticker.toUpperCase() === item.ticker.toUpperCase()
            );

            if (existingIdx >= 0) {
              updatedStocks[existingIdx] = {
                ...updatedStocks[existingIdx],
                lots: item.lots,
                avgBuyPrice: item.avgBuyPrice,
                currentPrice: item.currentPrice,
                name: item.name || updatedStocks[existingIdx].name,
                updatedAt: new Date().toISOString(),
              };
            } else {
              updatedStocks.push({
                id: `stock-soa-${Date.now()}-${item.ticker}`,
                ticker: item.ticker,
                name: item.name,
                lots: item.lots,
                avgBuyPrice: item.avgBuyPrice,
                currentPrice: item.currentPrice,
                change24h: item.unrealizedPnLPct || 0,
                currency: 'IDR',
                rdnAccountId: targetRdn?.id,
                updatedAt: new Date().toISOString(),
              });
            }
          }

          StorageService.saveStocks(updatedStocks);
          return updatedStocks;
        });

        // 2. Sync RDN Account Balance
        const newRdnBalance = result.rdnCashBalance !== undefined ? result.rdnCashBalance : 0;
        setAccounts((prevAccs) => {
          let updatedAccs = [...prevAccs];
          const rdnIdx = updatedAccs.findIndex(
            (a) => a.id === targetRdn?.id || a.type === 'RDN' || a.accountNumber === result.rdnAccountNumber
          );

          if (rdnIdx >= 0) {
            updatedAccs[rdnIdx] = {
              ...updatedAccs[rdnIdx],
              name: `RDN ${result.rdnBank ? result.rdnBank.replace('Bank ', '') : 'Sekuritas'}`,
              accountNumber: result.rdnAccountNumber || updatedAccs[rdnIdx].accountNumber || '1000000000',
              balance: newRdnBalance,
              updatedAt: new Date().toISOString(),
            };
          } else {
            updatedAccs.push({
              id: `acc-rdn-${Date.now()}`,
              name: `RDN ${result.rdnBank || 'Sekuritas'}`,
              type: 'RDN',
              accountNumber: result.rdnAccountNumber || '1000000000',
              balance: newRdnBalance,
              color: '#10B981',
              updatedAt: new Date().toISOString(),
            });
          }

          StorageService.saveAccounts(updatedAccs);
          return updatedAccs;
        });

        // 3. Record Sync Transaction
        const syncTx: Transaction = {
          id: `tx-soa-${Date.now()}`,
          accountId: targetRdn?.id || 'rdn-sync',
          accountName: `RDN Stockbit ${result.rdnBank || 'Jago'}`,
          type: 'TRANSFER',
          amount: newRdnBalance,
          category: 'Broker Statement Sync',
          description: `Sinkronisasi SoA Stockbit (${result.holdings.length} Saham • Saldo RDN ${formatIDR(newRdnBalance)})`,
          source: 'BROKER_SOA',
          transactionDate: new Date().toISOString(),
        };

        setTransactions((prev) => {
          const next = [syncTx, ...prev];
          StorageService.saveTransactions(next);
          return next;
        });

        return {
          success: true,
          message: `Berhasil menyinkronkan ${result.holdings.length} saham dari Statement Stockbit & saldo RDN ${formatIDR(newRdnBalance)}!`,
        };
      }

      let rdnBalanceDelta = 0;
      const createdTxList: Transaction[] = [];

      setStocks((prevStocks) => {
        let currentStocks = [...prevStocks];

        for (const trade of result.trades) {
          if (trade.action === 'DIVIDEND') {
            // Cash dividend directly adds to RDN
            rdnBalanceDelta += trade.netAmount;
            createdTxList.push({
              id: `tx-div-${Date.now()}-${Math.random()}`,
              accountId: rdnAcc.id,
              accountName: rdnAcc.name,
              type: 'INCOME',
              amount: trade.netAmount,
              category: 'Stock Dividend',
              description: `Dividen Tunai Masuk RDN (${result.brokerName})`,
              source: 'BROKER_SOA',
              transactionDate: new Date().toISOString(),
            });
            continue;
          }

          const existingIndex = currentStocks.findIndex(
            (s) => s.ticker.toUpperCase() === trade.ticker.toUpperCase()
          );

          if (trade.action === 'BUY') {
            // Deduct Net Buy Amount from RDN
            rdnBalanceDelta -= trade.netAmount;

            const buyShares = trade.lots * 100;

            if (existingIndex >= 0) {
              const old = currentStocks[existingIndex];
              const oldShares = old.lots * 100;
              const newTotalShares = oldShares + buyShares;
              // Mathematical Portfolio Formula for Weighted Average Price:
              // New Avg = ((Old Shares * Old Avg) + Net Buy Amount) / New Total Shares
              const newAvg =
                newTotalShares > 0
                  ? (oldShares * old.avgBuyPrice + trade.netAmount) / newTotalShares
                  : old.avgBuyPrice;

              currentStocks[existingIndex] = {
                ...old,
                lots: newTotalShares / 100,
                avgBuyPrice: Math.round(newAvg),
                updatedAt: new Date().toISOString(),
              };
            } else {
              // Add new stock
              currentStocks.push({
                id: `stock-${Date.now()}-${trade.ticker}`,
                ticker: trade.ticker,
                name: `${trade.ticker.replace('.JK', '')} Assets`,
                lots: trade.lots,
                avgBuyPrice: Math.round(trade.netAmount / buyShares),
                currentPrice: trade.price,
                change24h: 0.01,
                currency: 'IDR',
                rdnAccountId: rdnAcc.id,
                updatedAt: new Date().toISOString(),
              });
            }

            createdTxList.push({
              id: `tx-trade-${Date.now()}-${Math.random()}`,
              accountId: rdnAcc.id,
              accountName: rdnAcc.name,
              type: 'EXPENSE',
              amount: trade.netAmount,
              category: 'Stock Investment',
              description: `BUY ${trade.lots} Lot ${trade.ticker} @ Rp ${trade.price}`,
              source: 'BROKER_SOA',
              transactionDate: new Date().toISOString(),
            });
          } else if (trade.action === 'SELL') {
            // Add Net Sell Amount to RDN
            rdnBalanceDelta += trade.netAmount;

            if (existingIndex >= 0) {
              const old = currentStocks[existingIndex];
              const newLots = Math.max(0, old.lots - trade.lots);
              // In SELL, Avg Buy Price does NOT change
              currentStocks[existingIndex] = {
                ...old,
                lots: newLots,
                updatedAt: new Date().toISOString(),
              };
            }

            createdTxList.push({
              id: `tx-trade-${Date.now()}-${Math.random()}`,
              accountId: rdnAcc.id,
              accountName: rdnAcc.name,
              type: 'INCOME',
              amount: trade.netAmount,
              category: 'Stock Realization',
              description: `SELL ${trade.lots} Lot ${trade.ticker} @ Rp ${trade.price}`,
              source: 'BROKER_SOA',
              transactionDate: new Date().toISOString(),
            });
          }
        }

        StorageService.saveStocks(currentStocks);
        return currentStocks;
      });

      // Update RDN Account Balance (merging if newly auto-created)
      setAccounts((prevAccs) => {
        const exists = prevAccs.some((a) => a.id === rdnAcc.id);
        let updated: Account[];
        if (exists) {
          updated = prevAccs.map((a) => {
            if (a.id === rdnAcc.id) {
              return {
                ...a,
                balance: Math.max(0, a.balance + rdnBalanceDelta),
                updatedAt: new Date().toISOString(),
              };
            }
            return a;
          });
        } else {
          updated = [
            {
              ...rdnAcc,
              balance: Math.max(0, rdnAcc.balance + rdnBalanceDelta),
              updatedAt: new Date().toISOString(),
            },
            ...prevAccs,
          ];
        }
        StorageService.saveAccounts(updated);
        return updated;
      });

      // Append trade transactions
      if (createdTxList.length > 0) {
        setTransactions((prevTx) => {
          const updated = [...createdTxList, ...prevTx];
          StorageService.saveTransactions(updated);
          return updated;
        });
      }

      triggerHaptic('success');
      return {
        success: true,
        message: `Berhasil mengupdate portofolio dari ${result.brokerName}: ${result.trades.length} aksi tercatat.`,
      };
    },
    [accounts]
  );

  // 8. Stock CRUD with automatic real-time market price fetching
  const saveStock = useCallback(async (stockData: Omit<StockAsset, 'id'>, id?: string) => {
    triggerHaptic('medium');

    // Auto-fetch real-time market price for this stock
    let freshPrice = stockData.currentPrice;
    let freshChange = stockData.change24h || 0;

    try {
      const quote = await MarketService.fetchStockPrice(stockData.ticker, stockData.currentPrice || stockData.avgBuyPrice);
      if (quote && typeof quote.price === 'number' && quote.price > 0) {
        freshPrice = quote.price;
        freshChange = quote.change24h;
        await StorageService.updateMarketQuotes({ [quote.ticker]: quote }, {});
      }
    } catch (e) {
      console.warn('Auto fetch stock price failed, using fallback/cached:', e);
    }

    const payload: Omit<StockAsset, 'id'> = {
      ...stockData,
      currentPrice: freshPrice,
      change24h: freshChange,
    };

    setStocks((prev) => {
      let updated: StockAsset[];
      if (id) {
        updated = prev.map((s) => (s.id === id ? { ...payload, id, updatedAt: new Date().toISOString() } : s));
      } else {
        const newStock: StockAsset = {
          ...payload,
          id: `stock-${Date.now()}`,
          updatedAt: new Date().toISOString(),
        };
        updated = [newStock, ...prev];
      }
      StorageService.saveStocks(updated);
      return updated;
    });
  }, []);

  const deleteStock = useCallback(async (id: string) => {
    triggerHaptic('medium');
    setStocks((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      StorageService.saveStocks(updated);
      StorageService.pruneMarketCache(
        updated.map((s) => s.ticker),
        cryptos.map((c) => c.coingeckoId)
      );
      return updated;
    });
  }, [cryptos]);

  // 9. Crypto CRUD with automatic real-time market price fetching
  const saveCrypto = useCallback(async (cryptoData: Omit<CryptoAsset, 'id'>, id?: string) => {
    triggerHaptic('medium');

    // Auto-fetch real-time market price for this crypto
    let freshPriceIdr = cryptoData.currentPriceIdr;
    let freshChange = cryptoData.change24h || 0;

    try {
      const quotes = await MarketService.fetchCryptoPrices([cryptoData.coingeckoId]);
      const quote = quotes[cryptoData.coingeckoId];
      if (quote && typeof quote.priceIdr === 'number' && quote.priceIdr > 0) {
        freshPriceIdr = quote.priceIdr;
        freshChange = quote.change24h;
        await StorageService.updateMarketQuotes({}, { [cryptoData.coingeckoId]: quote });
      }
    } catch (e) {
      console.warn('Auto fetch crypto price failed, using fallback/cached:', e);
    }

    const payload: Omit<CryptoAsset, 'id'> = {
      ...cryptoData,
      currentPriceIdr: freshPriceIdr,
      change24h: freshChange,
    };

    setCryptos((prev) => {
      let updated: CryptoAsset[];
      if (id) {
        updated = prev.map((c) => (c.id === id ? { ...payload, id, updatedAt: new Date().toISOString() } : c));
      } else {
        const newCrypto: CryptoAsset = {
          ...payload,
          id: `crypto-${Date.now()}`,
          updatedAt: new Date().toISOString(),
        };
        updated = [newCrypto, ...prev];
      }
      StorageService.saveCryptos(updated);
      return updated;
    });
  }, []);

  const deleteCrypto = useCallback(async (id: string) => {
    triggerHaptic('medium');
    setCryptos((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      StorageService.saveCryptos(updated);
      StorageService.pruneMarketCache(
        stocks.map((s) => s.ticker),
        updated.map((c) => c.coingeckoId)
      );
      return updated;
    });
  }, [stocks]);

  // 9b. RDN Asynchronous Pipeline Actions
  const processRDNIngestion = useCallback(
    async (payload: IngestionPayload): Promise<RDNStagingBatch> => {
      triggerHaptic('light');
      const batch = await IngestionService.processIngestion({
        payload,
        userAccounts: accounts,
        stocks,
        transactions,
        onBatchReady: (b) => {
          setStagingBatches((prev) => [b, ...prev.filter((item) => item.id !== b.id)]);
          setActiveStagingBatch(b);
        },
        onStateUpdate: ({ accounts: accs, stocks: stk, transactions: txs }) => {
          setAccounts(accs);
          setStocks(stk);
          setTransactions(txs);
        },
      });
      return batch;
    },
    [accounts, stocks, transactions]
  );

  const commitRDNStagingBatch = useCallback(
    async (batchId: string): Promise<CommitResult> => {
      triggerHaptic('medium');
      const batch = stagingBatches.find((b) => b.id === batchId) || activeStagingBatch;
      if (!batch) {
        throw new Error('Batch staging tidak ditemukan.');
      }
      const result = await LedgerCommitService.commitBatch(
        batch,
        accounts,
        stocks,
        transactions,
        ({ accounts: accs, stocks: stk, transactions: txs }) => {
          setAccounts(accs);
          setStocks(stk);
          setTransactions(txs);
        }
      );
      setStagingBatches((prev) => prev.filter((b) => b.id !== batchId));
      setActiveStagingBatch(null);
      triggerHaptic('success');
      return result;
    },
    [stagingBatches, activeStagingBatch, accounts, stocks, transactions]
  );

  const updateRDNStagingItem = useCallback(
    async (batchId: string, itemId: string, updates: Partial<StandardizedRDNRecord>) => {
      const updatedBatch = await RDNStagingService.updateStagingItem(batchId, itemId, updates);
      if (updatedBatch) {
        setStagingBatches((prev) => prev.map((b) => (b.id === batchId ? updatedBatch : b)));
        if (activeStagingBatch?.id === batchId) {
          setActiveStagingBatch(updatedBatch);
        }
      }
    },
    [activeStagingBatch]
  );

  const discardRDNStagingBatch = useCallback(
    async (batchId: string) => {
      await RDNStagingService.deleteBatch(batchId);
      setStagingBatches((prev) => prev.filter((b) => b.id !== batchId));
      if (activeStagingBatch?.id === batchId) {
        setActiveStagingBatch(null);
      }
    },
    [activeStagingBatch]
  );

  const toggleAccountAutoCommit = useCallback(
    async (accountId: string) => {
      setAccounts((prev) => {
        const updated = prev.map((a) => {
          if (a.id === accountId) {
            return {
              ...a,
              autoCommitVerifiedEmail: !a.autoCommitVerifiedEmail,
              updatedAt: new Date().toISOString(),
            };
          }
          return a;
        });
        StorageService.saveAccounts(updated);
        return updated;
      });
    },
    []
  );

  // 10. Reset Data
  const resetToInitialSeed = useCallback(async () => {
    triggerHaptic('heavy');
    await StorageService.resetToSeed();
    setAccounts([]);
    setStocks([]);
    setCryptos([]);
    setTransactions([]);
  }, []);

  const clearAllData = useCallback(async () => {
    triggerHaptic('heavy');
    await StorageService.clearAllData();
    setAccounts([]);
    setStocks([]);
    setCryptos([]);
    setTransactions([]);
  }, []);

  const loadDemoData = useCallback(async () => {
    triggerHaptic('medium');
    await StorageService.loadDemoData();
    const [storedAcc, storedStocks, storedCryptos, storedTx] = await Promise.all([
      StorageService.getAccounts(),
      StorageService.getStocks(),
      StorageService.getCryptos(),
      StorageService.getTransactions(),
    ]);
    setAccounts(storedAcc);
    setStocks(storedStocks);
    setCryptos(storedCryptos);
    setTransactions(storedTx);
  }, []);

  return (
    <WealthContext.Provider
      value={{
        accounts,
        stocks,
        cryptos,
        transactions,
        privacyMode,
        isHydrated,
        isRefreshing,
        lastUpdated,
        totalCash,
        totalStocks,
        totalCryptos,
        totalNetWorth,
        totalInvestments,
        totalInvestmentCost,
        totalUnrealizedPnL,
        totalUnrealizedPnLPercent,
        dailyChangeRp,
        dailyChangePercent,
        stagingBatches,
        activeStagingBatch,
        setActiveStagingBatch,
        processRDNIngestion,
        commitRDNStagingBatch,
        updateRDNStagingItem,
        discardRDNStagingBatch,
        toggleAccountAutoCommit,
        togglePrivacy,
        refreshMarketPrices,
        addAccount,
        updateAccountBalance,
        applyMutationText,
        confirmBrokerTrades,
        saveStock,
        deleteStock,
        saveCrypto,
        deleteCrypto,
        resetToInitialSeed,
        clearAllData,
        loadDemoData,
      }}
    >
      {children}
    </WealthContext.Provider>
  );
};

export const useWealth = (): WealthContextType => {
  const context = useContext(WealthContext);
  if (!context) {
    throw new Error('useWealth must be used within a WealthProvider');
  }
  return context;
};
