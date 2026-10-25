-- ============================================================
-- OMNIWEALTH DATABASE SCHEMA (Supabase / PostgreSQL)
-- True Native Android & iOS FinTech Edition
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ACCOUNTS (Bank, E-Wallet, RDN)
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('BANK', 'E-WALLET', 'RDN')),
    account_number VARCHAR(50),
    balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
    color VARCHAR(50) DEFAULT '#3B82F6',
    icon VARCHAR(50) DEFAULT 'landmark',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. STOCKS (Indonesian Stocks / IDX)
CREATE TABLE IF NOT EXISTS stocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    ticker VARCHAR(20) NOT NULL, -- e.g. BBCA.JK
    name VARCHAR(150) NOT NULL,
    lots NUMERIC(12, 2) NOT NULL DEFAULT 0, -- 1 lot = 100 shares
    avg_buy_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
    current_price NUMERIC(18, 2) NOT NULL DEFAULT 0,
    change_24h NUMERIC(8, 4) DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'IDR',
    rdn_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CRYPTO ASSETS
CREATE TABLE IF NOT EXISTS cryptos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    coingecko_id VARCHAR(50) NOT NULL, -- e.g. bitcoin, ethereum, solana
    symbol VARCHAR(20) NOT NULL, -- e.g. BTC, ETH, SOL
    name VARCHAR(100) NOT NULL,
    holdings NUMERIC(24, 8) NOT NULL DEFAULT 0,
    avg_buy_price_idr NUMERIC(18, 2) NOT NULL DEFAULT 0,
    current_price_idr NUMERIC(18, 2) NOT NULL DEFAULT 0,
    change_24h NUMERIC(8, 4) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TRANSACTIONS & MUTATIONS
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('INCOME', 'EXPENSE', 'TRANSFER')),
    amount NUMERIC(18, 2) NOT NULL,
    category VARCHAR(50) DEFAULT 'General',
    description TEXT,
    raw_notification_text TEXT,
    source VARCHAR(50) DEFAULT 'MANUAL', -- 'MANUAL', 'AI_MUTATION', 'ANDROID_AUTO', 'BROKER_SOA'
    destination_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. BROKER TRADE LOGS & CONFIRMATIONS
CREATE TABLE IF NOT EXISTS broker_trade_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    broker_name VARCHAR(100) NOT NULL, -- Stockbit, Ajaib, IPOT, etc.
    trade_date DATE NOT NULL,
    action VARCHAR(10) NOT NULL CHECK (action IN ('BUY', 'SELL', 'DIVIDEND')),
    ticker VARCHAR(20) NOT NULL,
    lots NUMERIC(12, 2) NOT NULL DEFAULT 0,
    price NUMERIC(18, 2) NOT NULL DEFAULT 0,
    fee NUMERIC(18, 2) DEFAULT 0,
    net_amount NUMERIC(18, 2) NOT NULL,
    rdn_account_id UUID REFERENCES accounts(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. RDN STAGING BATCHES (Stage 5)
CREATE TABLE IF NOT EXISTS rdn_staging_batches (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    institution VARCHAR(50) NOT NULL,
    statement_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_checksum VARCHAR(64) NOT NULL,
    source VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    opening_balance NUMERIC(18, 2) DEFAULT 0,
    total_credit NUMERIC(18, 2) DEFAULT 0,
    total_debit NUMERIC(18, 2) DEFAULT 0,
    closing_balance NUMERIC(18, 2) DEFAULT 0,
    discrepancy_amount NUMERIC(18, 2) DEFAULT 0,
    total_items INT DEFAULT 0,
    new_items_count INT DEFAULT 0,
    duplicate_skipped_count INT DEFAULT 0,
    internal_transfers_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. RDN STAGING ITEMS (Stage 5)
CREATE TABLE IF NOT EXISTS rdn_staging_items (
    id VARCHAR(100) PRIMARY KEY,
    batch_id VARCHAR(100) REFERENCES rdn_staging_batches(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    settlement_date DATE,
    category VARCHAR(50) NOT NULL,
    ticker VARCHAR(20),
    lot NUMERIC(12, 2),
    execution_price NUMERIC(18, 2),
    gross_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    broker_fee NUMERIC(18, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    net_amount NUMERIC(18, 2) NOT NULL DEFAULT 0,
    running_balance NUMERIC(18, 2),
    raw_description TEXT,
    transaction_hash VARCHAR(64) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'READY',
    matched_transfer_account_name VARCHAR(100),
    matched_transfer_tx_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    validation_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. RDN IMPORT AUDIT LOGS (Stage 6)
CREATE TABLE IF NOT EXISTS rdn_import_logs (
    id VARCHAR(100) PRIMARY KEY,
    batch_id VARCHAR(100),
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    file_checksum VARCHAR(64) NOT NULL,
    source VARCHAR(50) NOT NULL,
    institution VARCHAR(50) NOT NULL,
    total_records INT NOT NULL,
    success_count INT NOT NULL,
    skipped_count INT NOT NULL,
    discrepancy_amount NUMERIC(18, 2) DEFAULT 0,
    committed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_accounts_type ON accounts(type);
CREATE INDEX IF NOT EXISTS idx_stocks_ticker ON stocks(ticker);
CREATE INDEX IF NOT EXISTS idx_cryptos_symbol ON cryptos(symbol);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash);
CREATE INDEX IF NOT EXISTS idx_staging_batch_id ON rdn_staging_items(batch_id);
