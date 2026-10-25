-- ============================================================
-- OMNIWEALTH RDN STATEMENT PIPELINE MIGRATION
-- Staging Area, Guardrails, Idempotency, and Audit Logs
-- ============================================================

-- 1. Extend accounts with auto-commit flag for email webhooks
ALTER TABLE accounts 
ADD COLUMN IF NOT EXISTS auto_commit_verified_email BOOLEAN DEFAULT FALSE;

-- 2. Extend transactions with idempotency hash and internal transfer indicator
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(64),
ADD COLUMN IF NOT EXISTS is_internal_transfer BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_transactions_hash ON transactions(transaction_hash);

-- 3. Staging Batches Table
CREATE TABLE IF NOT EXISTS rdn_staging_batches (
    id VARCHAR(100) PRIMARY KEY,
    user_id UUID,
    account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
    institution VARCHAR(50) NOT NULL,
    statement_type VARCHAR(50) NOT NULL, -- 'BANK_RDN_MUTATION' | 'BROKER_TRADE_CONFIRMATION'
    file_name VARCHAR(255) NOT NULL,
    file_checksum VARCHAR(64) NOT NULL,
    source VARCHAR(50) NOT NULL, -- 'MANUAL_UPLOAD' | 'EMAIL_WEBHOOK'
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'VERIFIED', 'NEEDS_REVIEW', 'COMMITTED', 'FAILED'
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

-- 4. Staging Items Table
CREATE TABLE IF NOT EXISTS rdn_staging_items (
    id VARCHAR(100) PRIMARY KEY,
    batch_id VARCHAR(100) REFERENCES rdn_staging_batches(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    settlement_date DATE,
    category VARCHAR(50) NOT NULL, -- 'TOPUP', 'WITHDRAWAL', 'BUY', 'SELL', 'DIVIDEND', 'COUPON', 'INTEREST', 'ADMIN_TAX'
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
    status VARCHAR(50) NOT NULL DEFAULT 'READY', -- 'READY', 'DUPLICATE_SKIPPED', 'INTERNAL_TRANSFER', 'REVIEW_REQUIRED', 'COMMITTED'
    matched_transfer_account_name VARCHAR(100),
    matched_transfer_tx_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
    validation_error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staging_batch_id ON rdn_staging_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_staging_tx_hash ON rdn_staging_items(transaction_hash);

-- 5. RDN Import Logs Table (Audit & Compliance)
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

CREATE INDEX IF NOT EXISTS idx_import_logs_account ON rdn_import_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_import_logs_checksum ON rdn_import_logs(file_checksum);
