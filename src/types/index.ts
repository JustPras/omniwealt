// TypeScript definitions for OmniWealth Tracker v2

export type AccountType = 'BANK' | 'E-WALLET' | 'RDN';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  accountNumber?: string;
  balance: number;
  color?: string;
  icon?: string;
  updatedAt?: string;
}

export interface StockAsset {
  id: string;
  ticker: string; // e.g. BBCA.JK
  name: string;
  lots: number; // 1 lot = 100 shares
  avgBuyPrice: number;
  currentPrice: number;
  change24h: number; // percentage, e.g. 0.015 for +1.5%
  currency: 'IDR';
  rdnAccountId?: string;
  updatedAt?: string;
}

export interface CryptoAsset {
  id: string;
  coingeckoId: string; // e.g. bitcoin
  symbol: string; // BTC
  name: string;
  holdings: number;
  avgBuyPriceIdr: number;
  currentPriceIdr: number;
  change24h: number; // percentage
  updatedAt?: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionSource = 'MANUAL' | 'AI_MUTATION' | 'ANDROID_AUTO' | 'BROKER_SOA';

export interface Transaction {
  id: string;
  accountId: string;
  accountName?: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  rawNotificationText?: string;
  source: TransactionSource;
  destinationAccountId?: string;
  destinationAccountName?: string;
  transactionDate: string; // ISO string
}

export interface BrokerTradeItem {
  action: 'BUY' | 'SELL' | 'DIVIDEND';
  ticker: string;
  lots: number;
  price: number;
  fee: number;
  netAmount: number;
}

export interface BrokerHoldingItem {
  ticker: string;
  name: string;
  lots: number;
  shares: number;
  avgBuyPrice: number;
  currentPrice: number;
  buyingValue: number;
  marketValue: number;
  unrealizedPnLRp: number;
  unrealizedPnLPct: number;
}

export interface BrokerExtractionResult {
  brokerName: string;
  documentType?: 'STATEMENT_OF_ACCOUNT' | 'TRADE_CONFIRMATION';
  tradeDate: string;
  period?: string;
  clientName?: string;
  sid?: string;
  rdnBank?: string;
  rdnAccountNumber?: string;
  rdnCashBalance?: number;
  totalPortfolioValue?: number;
  totalBuyingValue?: number;
  totalUnrealizedPnL?: number;
  holdings?: BrokerHoldingItem[];
  trades: BrokerTradeItem[];
  rawText?: string;
  summaryNote?: string;
}

export interface BankMutationResult {
  type: TransactionType;
  amount: number;
  bankName: string;
  category: string;
  description: string;
  merchantOrSender?: string;
}
