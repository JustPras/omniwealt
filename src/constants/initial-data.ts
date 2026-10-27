import { Account, StockAsset, CryptoAsset, Transaction, Liability } from '../types';

/**
 * Clean Slate: New users start with 0 data (empty state).
 */
export const INITIAL_ACCOUNTS: Account[] = [];
export const INITIAL_STOCKS: StockAsset[] = [];
export const INITIAL_CRYPTOS: CryptoAsset[] = [];
export const INITIAL_TRANSACTIONS: Transaction[] = [];
export const INITIAL_LIABILITIES: Liability[] = [];

/**
 * Demo Datasets for testing, developer preview, and 1-click simulation.
 */
export const DEMO_ACCOUNTS: Account[] = [
  {
    id: 'acc-bca-01',
    name: 'BCA Tahapan',
    type: 'BANK',
    accountNumber: '8220194821',
    balance: 18500000,
    color: '#3B82F6',
    icon: 'landmark',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc-mandiri-02',
    name: "Mandiri Livin'",
    type: 'BANK',
    accountNumber: '1370019283711',
    balance: 6250000,
    color: '#0284C7',
    icon: 'credit-card',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc-rdn-03',
    name: 'RDN Stockbit BCA',
    type: 'RDN',
    accountNumber: '0081298410',
    balance: 4800000,
    color: '#10B981',
    icon: 'trending-up',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'acc-gopay-04',
    name: 'GoPay Utama',
    type: 'E-WALLET',
    accountNumber: '0812-0000-0001',
    balance: 850000,
    color: '#06B6D4',
    icon: 'smartphone',
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_STOCKS: StockAsset[] = [
  {
    id: 'stock-bbca',
    ticker: 'BBCA.JK',
    name: 'Bank Central Asia Tbk.',
    lots: 15, // 1,500 shares
    avgBuyPrice: 9150,
    currentPrice: 9950,
    change24h: 0.0179, // +1.79%
    currency: 'IDR',
    rdnAccountId: 'acc-rdn-03',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stock-bmri',
    ticker: 'BMRI.JK',
    name: 'Bank Mandiri (Persero) Tbk.',
    lots: 25, // 2,500 shares
    avgBuyPrice: 6050,
    currentPrice: 6725,
    change24h: 0.0151, // +1.51%
    currency: 'IDR',
    rdnAccountId: 'acc-rdn-03',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'stock-tlkm',
    ticker: 'TLKM.JK',
    name: 'Telkom Indonesia Tbk.',
    lots: 30, // 3,000 shares
    avgBuyPrice: 3120,
    currentPrice: 3040,
    change24h: -0.0065, // -0.65%
    currency: 'IDR',
    rdnAccountId: 'acc-rdn-03',
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_CRYPTOS: CryptoAsset[] = [
  {
    id: 'crypto-btc',
    coingeckoId: 'bitcoin',
    symbol: 'BTC',
    name: 'Bitcoin',
    holdings: 0.035,
    avgBuyPriceIdr: 960000000,
    currentPriceIdr: 1045000000,
    change24h: 0.0245,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'crypto-sol',
    coingeckoId: 'solana',
    symbol: 'SOL',
    name: 'Solana',
    holdings: 15.0,
    avgBuyPriceIdr: 2350000,
    currentPriceIdr: 2840000,
    change24h: 0.052,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'crypto-eth',
    coingeckoId: 'ethereum',
    symbol: 'ETH',
    name: 'Ethereum',
    holdings: 0.4,
    avgBuyPriceIdr: 42000000,
    currentPriceIdr: 44800000,
    change24h: 0.011,
    updatedAt: new Date().toISOString(),
  },
];

export const DEMO_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-01',
    accountId: 'acc-bca-01',
    accountName: 'BCA Tahapan',
    type: 'EXPENSE',
    amount: 48500,
    category: 'Food & Beverage',
    description: 'Kopi Kenangan Senopati (QRIS)',
    source: 'AI_MUTATION',
    transactionDate: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'tx-02',
    accountId: 'acc-mandiri-02',
    accountName: "Mandiri Livin'",
    type: 'INCOME',
    amount: 2500000,
    category: 'Salary & Freelance',
    description: 'Transfer masuk BI-FAST dari PT Karya Digital',
    source: 'AI_MUTATION',
    transactionDate: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
  {
    id: 'tx-03',
    accountId: 'acc-bca-01',
    accountName: 'BCA Tahapan',
    type: 'TRANSFER',
    amount: 1000000,
    category: 'Investment Top-Up',
    description: 'Top up RDN Stockbit BCA',
    destinationAccountId: 'acc-rdn-03',
    destinationAccountName: 'RDN Stockbit BCA',
    source: 'MANUAL',
    transactionDate: new Date(Date.now() - 3600000 * 48).toISOString(),
  },
];

export const DEMO_LIABILITIES: Liability[] = [
  {
    id: 'liab-bca-cc',
    name: 'BCA Everyday Card',
    type: 'CREDIT_CARD',
    institution: 'BCA',
    outstandingAmount: 3450000,
    creditLimit: 20000000,
    dueDate: 20, // Tgl 20 tiap bulan
    billingCycleDate: 5,
    minimumPayment: 345000,
    accountNumber: '4821',
    color: '#3B82F6',
    icon: 'CreditCard',
    notes: 'Tagihan belanja bulanan & operasional',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'liab-shopee-paylater',
    name: 'Shopee PayLater',
    type: 'PAYLATER',
    institution: 'Shopee',
    outstandingAmount: 850000,
    creditLimit: 5000000,
    dueDate: 5, // Tgl 5 tiap bulan
    billingCycleDate: 25,
    minimumPayment: 850000,
    color: '#EE4D2D',
    icon: 'Smartphone',
    notes: 'Cicilan perlengkapan kerja & elektronik',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'liab-mandiri-loan',
    name: 'Mandiri Cicilan Gadget',
    type: 'LOAN',
    institution: 'Mandiri',
    outstandingAmount: 7200000,
    monthlyInstallment: 1200000,
    tenorRemainingMonths: 6,
    dueDate: 15, // Tgl 15 tiap bulan
    color: '#0284C7',
    icon: 'Landmark',
    notes: 'Cicilan flat laptop 0% (sisa 6 bulan)',
    updatedAt: new Date().toISOString(),
  },
];
