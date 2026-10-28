-- ============================================================
-- OMNIWEALTH SECURITY HARDENING: ROW LEVEL SECURITY (RLS)
-- Prevents unauthenticated data exfiltration via anon key
-- ============================================================

-- 1. Enable RLS on all sensitive financial tables
ALTER TABLE IF EXISTS accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS stocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cryptos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS broker_trade_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rdn_staging_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rdn_staging_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS rdn_import_logs ENABLE ROW LEVEL SECURITY;

-- 2. ACCOUNTS POLICY (Only owner can read/write their accounts)
CREATE POLICY "Users can manage their own accounts"
    ON accounts
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 3. STOCKS POLICY
CREATE POLICY "Users can manage their own stocks"
    ON stocks
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 4. CRYPTOS POLICY
CREATE POLICY "Users can manage their own cryptos"
    ON cryptos
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 5. TRANSACTIONS POLICY
CREATE POLICY "Users can manage their own transactions"
    ON transactions
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 6. BROKER TRADE LOGS POLICY
CREATE POLICY "Users can manage their own trade logs"
    ON broker_trade_logs
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 7. RDN STAGING BATCHES & ITEMS POLICIES
CREATE POLICY "Users can manage their own staging batches"
    ON rdn_staging_batches
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own staging items"
    ON rdn_staging_items
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM rdn_staging_batches
            WHERE rdn_staging_batches.id = rdn_staging_items.batch_id
            AND rdn_staging_batches.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own import logs"
    ON rdn_import_logs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM accounts
            WHERE accounts.id = rdn_import_logs.account_id
            AND accounts.user_id = auth.uid()
        )
    );
