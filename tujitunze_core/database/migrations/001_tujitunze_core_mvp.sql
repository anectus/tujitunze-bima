-- 001_tujitunze_core_mvp.sql
-- Migration for Tujitunze Core (MVP)
-- Creates core tables for source transactions, contributions, wallet ledger, rules, and reconciliation.
-- Idempotent: uses IF NOT EXISTS where possible.

BEGIN;

-- Contribution rules (configurable rules)
CREATE TABLE IF NOT EXISTS contribution_rules (
  rule_id BIGSERIAL PRIMARY KEY,
  rule_name VARCHAR(100) UNIQUE NOT NULL,
  source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('TELECOM','BANK','ALL')),
  calculation_type VARCHAR(30) NOT NULL CHECK (calculation_type IN ('FIXED','PERCENTAGE')),
  fixed_amount NUMERIC(15,2),
  percentage_rate NUMERIC(8,5),
  minimum_transaction_amount NUMERIC(15,2),
  maximum_contribution_amount NUMERIC(15,2),
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_to TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((calculation_type = 'FIXED' AND fixed_amount IS NOT NULL) OR (calculation_type = 'PERCENTAGE' AND percentage_rate IS NOT NULL))
);

-- Bank source transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
  bank_transaction_id BIGSERIAL PRIMARY KEY,
  member_bank_account_id INT,
  transaction_reference VARCHAR(150) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  transaction_amount NUMERIC(15,2) NOT NULL CHECK (transaction_amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'TZS',
  transaction_status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
  transaction_date TIMESTAMPTZ NOT NULL,
  description TEXT,
  external_transaction_id VARCHAR(150),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(transaction_reference),
  UNIQUE(member_bank_account_id, external_transaction_id)
);

-- Telecom source transactions
CREATE TABLE IF NOT EXISTS telecom_transactions (
  telecom_transaction_id BIGSERIAL PRIMARY KEY,
  member_id INT,
  phone_id INT,
  operator_id INT,
  external_transaction_id VARCHAR(150) NOT NULL,
  transaction_type VARCHAR(50) NOT NULL,
  transaction_amount NUMERIC(15,2) NOT NULL CHECK (transaction_amount >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'TZS',
  transaction_status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
  transaction_date TIMESTAMPTZ NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(operator_id, external_transaction_id)
);

-- Contribution transactions: what TUJITUNZE actually collected
CREATE TABLE IF NOT EXISTS contribution_transactions (
  contribution_id BIGSERIAL PRIMARY KEY,
  member_id INT NOT NULL,
  source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('TELECOM','BANK')),
  telecom_transaction_id BIGINT,
  bank_transaction_id BIGINT,
  source_transaction_amount NUMERIC(15,2) NOT NULL CHECK (source_transaction_amount >= 0),
  contribution_amount NUMERIC(15,2) NOT NULL CHECK (contribution_amount > 0),
  contribution_rule VARCHAR(100) NOT NULL,
  contribution_rate NUMERIC(8,5),
  currency CHAR(3) NOT NULL DEFAULT 'TZS',
  contribution_status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
  external_reference VARCHAR(150),
  contribution_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((source_type = 'TELECOM' AND telecom_transaction_id IS NOT NULL AND bank_transaction_id IS NULL) OR (source_type = 'BANK' AND bank_transaction_id IS NOT NULL AND telecom_transaction_id IS NULL)),
  UNIQUE(source_type, external_reference)
);

-- Health wallets
CREATE TABLE IF NOT EXISTS health_wallets (
  wallet_id BIGSERIAL PRIMARY KEY,
  member_id INT UNIQUE NOT NULL,
  wallet_number VARCHAR(50) UNIQUE NOT NULL,
  current_balance NUMERIC(15,2) NOT NULL DEFAULT 0.00 CHECK (current_balance >= 0),
  currency CHAR(3) NOT NULL DEFAULT 'TZS',
  wallet_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Wallet ledger (immutable transactions referencing contributions)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  wallet_transaction_id BIGSERIAL PRIMARY KEY,
  wallet_id BIGINT NOT NULL,
  member_id INT NOT NULL,
  contribution_id BIGINT,
  transaction_type VARCHAR(30) NOT NULL CHECK (transaction_type IN ('CONTRIBUTION','WITHDRAWAL','TRANSFER_IN','TRANSFER_OUT','REVERSAL','ADJUSTMENT')),
  amount NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  balance_before NUMERIC(15,2) NOT NULL,
  balance_after NUMERIC(15,2) NOT NULL,
  transaction_reference VARCHAR(150) UNIQUE NOT NULL,
  description TEXT,
  transaction_status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
  transaction_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  FOREIGN KEY (wallet_id) REFERENCES health_wallets(wallet_id) ON DELETE RESTRICT
);

-- Reconciliation records
CREATE TABLE IF NOT EXISTS reconciliation_records (
  reconciliation_id BIGSERIAL PRIMARY KEY,
  source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('BANK','TELECOM')),
  source_transaction_reference VARCHAR(150) NOT NULL,
  contribution_id BIGINT,
  source_amount NUMERIC(15,2) NOT NULL,
  expected_contribution NUMERIC(15,2),
  actual_contribution NUMERIC(15,2),
  reconciliation_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (reconciliation_status IN ('PENDING','MATCHED','MISMATCHED','RESOLVED')),
  reconciliation_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(source_type, source_transaction_reference)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_contrib_member ON contribution_transactions(member_id);
CREATE INDEX IF NOT EXISTS idx_wallet_member ON health_wallets(member_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_wallet ON wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_recon_status ON reconciliation_records(reconciliation_status);

COMMIT;

-- ROLLBACK NOTES:
-- This migration is additive. To revert in a non-destructive way, export data and drop created tables manually after verification.
-- Example manual rollback (run only when safe):
-- DROP TABLE IF EXISTS reconciliation_records, wallet_transactions, health_wallets, contribution_transactions, telecom_transactions, bank_transactions, contribution_rules;
