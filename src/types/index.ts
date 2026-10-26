// TypeScript definitions for OmniWealth Tracker v2

export type CurrencyMode = 'IDR' | 'USD';

export type AccountType = 'BANK' | 'E-WALLET' | 'RDN' | 'CRYPTO_WALLET';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  accountNumber?: string;
  balance: number;
  color?: string;
  icon?: string;
  updatedAt?: string;
  autoCommitVerifiedEmail?: boolean;
}

export type LiabilityType = 'CREDIT_CARD' | 'PAYLATER' | 'LOAN' | 'OTHER';

export interface Liability {
  id: string;
  name: string; // e.g. "BCA Everyday Card", "Shopee PayLater", "KPR Mandiri"
  type: LiabilityType;
  institution: string; // "BCA", "Shopee", "Mandiri", "Kredivo", etc.
  outstandingAmount: number; // Saldo tagihan berjalan (IDR)
  creditLimit?: number; // Total limit kredit (untuk CC / PayLater)
  dueDate?: number; // Tanggal jatuh tempo bulanan (1-31)
  billingCycleDate?: number; // Tanggal cetak tagihan (1-31)
  minimumPayment?: number; // Pembayaran minimum
  monthlyInstallment?: number; // Angsuran tetap per bulan
  tenorRemainingMonths?: number; // Sisa tenor (bulan)
  interestRatePercent?: number; // Bunga %
  accountNumber?: string; // 4 digit terakhir kartu atau no kontrak
  color?: string;
  icon?: string;
  notes?: string;
  updatedAt?: string;
}

export interface LiabilityPaymentResult {
  success: boolean;
  message: string;
  liabilityId: string;
  paidAmount: number;
  newOutstandingAmount: number;
  fromAccountId: string;
  newAccountBalance: number;
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
  walletId?: string; // Optional reference to connected Web3 wallet
  chain?: string;
}

export type CryptoNetworkType = 'EVM' | 'SOLANA' | 'BITCOIN';

export interface CryptoWalletToken {
  chain: string;
  symbol: string;
  name: string;
  balance: number;
  priceIdr: number;
  valueIdr: number;
  contractAddress?: string;
  coingeckoId: string;
}

export interface CryptoWallet {
  id: string;
  name: string;
  address: string;
  networkType: CryptoNetworkType;
  chains: string[];
  balanceIdr: number;
  tokens: CryptoWalletToken[];
  lastSyncedAt: string;
  isAutoSync: boolean;
  createdAt: string;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionSource = 'MANUAL' | 'AI_MUTATION' | 'ANDROID_AUTO' | 'BROKER_SOA' | 'RDN_PIPELINE';

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
  transactionHash?: string;
  isInternalTransfer?: boolean;
}

export * from './rdn-pipeline';

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
  sourceApp?: string;
  destinationHint?: string;
  sourceHint?: string;
  isTransferCandidate?: boolean;
}

export interface MonitoredBankApp {
  id: string;
  name: string;
  type: 'BANK' | 'E_WALLET';
  packageName: string;
  icon: string;
  color: string;
  sampleNotification: string;
}

export interface AutoSyncNotificationConfig {
  enabled: boolean;
  autoCommit: boolean;
  monitoredApps: string[];
  clipboardDetection: boolean;
  internalTransferMatching?: boolean;
}

export interface InternalTransferMatchPlan {
  isMatched: boolean;
  matchType: 'DIRECT_SINGLE' | 'TWO_LEGGED_PAIR' | 'FEE_ADJUSTED';
  sourceAccount: Account;
  destinationAccount: Account;
  transferAmount: number;
  feeAmount?: number;
  matchedTransactionId?: string;
  consolidatedTransaction: Transaction;
  notes?: string;
}

export interface CapturedNotificationLog {
  id: string;
  sourceApp: string;
  rawText: string;
  parsedResult: BankMutationResult;
  timestamp: string;
  status: 'COMMITTED' | 'PENDING' | 'DUPLICATE' | 'FAILED' | 'RECONCILED_TRANSFER';
  matchPlan?: InternalTransferMatchPlan;
}

// Pilar 3: Bank Statement PDF & Reconciliation
export interface BankStatementMutation {
  id: string;
  date: string;
  rawDate: string;
  description: string;
  type: TransactionType;
  amount: number;
  balance?: number;
  category: string;
  isInternalTransfer?: boolean;
  destinationAccountHint?: string;
  status: 'NEW' | 'DUPLICATE_SKIPPED' | 'RECONCILED';
}

export interface BankStatementParseResult {
  bankName: string;
  accountNumber: string;
  accountHolder?: string;
  periodStart?: string;
  periodEnd?: string;
  currency: string;
  openingBalance: number;
  closingBalance: number;
  totalInflow: number;
  totalOutflow: number;
  calculatedClosingBalance: number;
  discrepancy: number;
  status: 'VERIFIED' | 'NEEDS_REVIEW';
  mutations: BankStatementMutation[];
  rawText?: string;
}

export interface BankStatementCommitResult {
  accountId: string;
  accountName: string;
  totalImported: number;
  totalDuplicatesSkipped: number;
  newBalance: number;
  verified: boolean;
  summary: string;
}
