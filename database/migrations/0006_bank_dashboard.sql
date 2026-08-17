-- ============================================================
-- Migration 0006
-- Backs the real (non-placeholder) parts of the Bank Dashboard.
-- Mirrors migration 0005's telecom pattern for the shared pieces
-- (contact info, API/webhook credentials, reconciliation, API
-- access logs) and adds the genuinely new territory this dashboard
-- introduces: HSIMS's own operational accounts at the partner bank
-- (Settlement / Health Fund / Reserve) and settlements paid out to
-- Telecom/Hospital partners. Both are ledger/bookkeeping only, same
-- "not a live payment gateway" caveat as health_wallets — see
-- CLAUDE.md Known Security Gap #8. Safe to re-run.
--
-- Same webhook_secret plaintext-at-rest caveat as migration 0005
-- (Known Security Gap #12) applies here too.
-- ============================================================

BEGIN;

ALTER TABLE banks ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE banks ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100);

ALTER TABLE banks ADD COLUMN IF NOT EXISTS api_key_hash TEXT;
ALTER TABLE banks ADD COLUMN IF NOT EXISTS api_key_preview VARCHAR(8);
ALTER TABLE banks ADD COLUMN IF NOT EXISTS api_key_generated_at TIMESTAMP;

ALTER TABLE banks ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE banks ADD COLUMN IF NOT EXISTS webhook_secret TEXT;
ALTER TABLE banks ADD COLUMN IF NOT EXISTS webhook_secret_generated_at TIMESTAMP;

-- ============================================================
-- FUND ACCOUNTS (Linked Accounts / Fund Account sections)
-- ============================================================
-- HSIMS's own operational accounts at this bank — not a member's
-- personal account (that's member_bank_accounts). One row per
-- (bank_id, account_type), lazily created on first access, same
-- pattern as health_wallets.getOrCreateWallet.

CREATE TABLE IF NOT EXISTS bank_fund_accounts (
    fund_account_id SERIAL PRIMARY KEY,

    bank_id INT NOT NULL
        REFERENCES banks(bank_id)
        ON DELETE CASCADE,

    account_type VARCHAR(30) NOT NULL
        CHECK (account_type IN ('Settlement', 'Health Fund', 'Reserve')),

    account_number VARCHAR(50),

    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    reserved_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    status VARCHAR(30) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(bank_id, account_type)
);

CREATE TABLE IF NOT EXISTS bank_fund_transfers (
    transfer_id SERIAL PRIMARY KEY,

    fund_account_id INT NOT NULL
        REFERENCES bank_fund_accounts(fund_account_id)
        ON DELETE CASCADE,

    transfer_type VARCHAR(30) NOT NULL
        CHECK (transfer_type IN ('Deposit', 'Withdrawal', 'Settlement In', 'Settlement Out')),

    amount DECIMAL(15,2) NOT NULL,
    balance_after DECIMAL(15,2) NOT NULL,

    reference VARCHAR(100),
    description TEXT,

    initiated_by INT
        REFERENCES users(user_id),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- SETTLEMENTS
-- ============================================================
-- A payout from this bank's Settlement fund account to a Telecom or
-- Hospital partner. counterparty_name is always stored (works
-- whichever type); the typed FK is filled in for whichever
-- counterparty_type applies, left null for the other.

CREATE TABLE IF NOT EXISTS settlements (
    settlement_id SERIAL PRIMARY KEY,

    bank_id INT NOT NULL
        REFERENCES banks(bank_id)
        ON DELETE CASCADE,

    counterparty_type VARCHAR(20) NOT NULL
        CHECK (counterparty_type IN ('Telecom', 'Hospital')),

    counterparty_name VARCHAR(150) NOT NULL,
    telecom_operator_id INT
        REFERENCES telecom_operators(operator_id),
    hospital_id INT
        REFERENCES hospitals(hospital_id),

    amount DECIMAL(15,2) NOT NULL,
    settlement_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (settlement_status IN ('Pending', 'Completed')),

    settlement_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    initiated_by INT
        REFERENCES users(user_id),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- RECONCILIATION — mirrors telecom_reconciliation_runs/_records,
-- matched against bank_transactions instead of telecom_contributions.
-- ============================================================

CREATE TABLE IF NOT EXISTS bank_reconciliation_runs (
    run_id SERIAL PRIMARY KEY,

    bank_id INT NOT NULL
        REFERENCES banks(bank_id)
        ON DELETE CASCADE,

    initiated_by INT
        REFERENCES users(user_id),

    total_uploaded INT NOT NULL DEFAULT 0,
    matched_count INT NOT NULL DEFAULT 0,
    unmatched_count INT NOT NULL DEFAULT 0,

    run_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS bank_reconciliation_records (
    record_id SERIAL PRIMARY KEY,

    run_id INT NOT NULL
        REFERENCES bank_reconciliation_runs(run_id)
        ON DELETE CASCADE,

    external_reference VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    record_date TIMESTAMP,

    matched_bank_transaction_id INT
        REFERENCES bank_transactions(bank_transaction_id),

    match_status VARCHAR(20) NOT NULL DEFAULT 'Unmatched',

    discrepancy_notes TEXT
);

-- ============================================================
-- API ACCESS LOGS — mirrors api_access_logs (telecom), scoped to bank.
-- ============================================================

CREATE TABLE IF NOT EXISTS bank_api_access_logs (
    log_id SERIAL PRIMARY KEY,

    bank_id INT NOT NULL
        REFERENCES banks(bank_id)
        ON DELETE CASCADE,

    actor_id INT
        REFERENCES users(user_id),

    event_type VARCHAR(50) NOT NULL,
    endpoint TEXT,
    response_status INT,
    success BOOLEAN NOT NULL,
    message TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
