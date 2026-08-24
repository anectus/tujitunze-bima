-- 002_core_identity_operations.sql
-- Tujitunze Core identity, linked accounts, operations, and integrity additions.
-- Run after 001_tujitunze_core_mvp.sql.
--
-- This migration fills the data-foundation gaps identified in the MVP
-- requirements: member registration/profile data, linked bank/mobile accounts,
-- RBAC, sessions/password reset, notifications, audit logs, and reconciliation
-- batches. Financial records are linked with foreign keys and duplicate source
-- transactions are rejected at the database boundary.

BEGIN;

-- ---------------------------------------------------------------------------
-- Reference data and member identity
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS roles (
  role_id BIGSERIAL PRIMARY KEY,
  role_name VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO roles (role_name, description)
VALUES
  ('Member', 'Registered Tujitunze health-savings member'),
  ('Platform Operations', 'Maintains rules, processes transactions, and reviews reconciliation'),
  ('Admin', 'Internal operational administrator'),
  ('Hospital', 'Partner hospital staff'),
  ('Insurance', 'Partner insurance provider staff'),
  ('Bank', 'Partner bank staff'),
  ('Telecom', 'Partner telecom operator staff'),
  ('Super-admin', 'System owner and configuration administrator')
ON CONFLICT (role_name) DO NOTHING;

CREATE TABLE IF NOT EXISTS permissions (
  permission_id BIGSERIAL PRIMARY KEY,
  permission_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE CASCADE,
  permission_id BIGINT NOT NULL REFERENCES permissions(permission_id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

INSERT INTO permissions (permission_name, description)
VALUES
  ('profile.read', 'Read the authenticated member profile'),
  ('profile.manage', 'Update the authenticated member profile and linked accounts'),
  ('wallet.read', 'Read wallet balance and wallet transactions'),
  ('wallet.transact', 'Create wallet-affecting transactions'),
  ('transactions.read', 'Read linked bank and telecom transactions'),
  ('contributions.process', 'Calculate and apply contributions'),
  ('rules.manage', 'Create and maintain contribution rules'),
  ('reconciliation.manage', 'Process and resolve reconciliation records'),
  ('audit.read', 'Read audit records')
ON CONFLICT (permission_name) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_name IN (
  'profile.read',
  'profile.manage',
  'wallet.read',
  'wallet.transact',
  'transactions.read'
)
WHERE r.role_name = 'Member'
ON CONFLICT DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_name IN (
  'transactions.read',
  'contributions.process',
  'rules.manage',
  'reconciliation.manage',
  'audit.read'
)
WHERE r.role_name IN ('Platform Operations', 'Admin', 'Super-admin')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS regions (
  region_id BIGSERIAL PRIMARY KEY,
  region_name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS districts (
  district_id BIGSERIAL PRIMARY KEY,
  region_id BIGINT NOT NULL REFERENCES regions(region_id) ON DELETE RESTRICT,
  district_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (region_id, district_name)
);

CREATE TABLE IF NOT EXISTS users (
  user_id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  second_name VARCHAR(50),
  surname VARCHAR(50) NOT NULL,
  nida_number VARCHAR(23) NOT NULL UNIQUE,
  email VARCHAR(150) UNIQUE,
  password_hash TEXT NOT NULL,
  member_status VARCHAR(30) NOT NULL DEFAULT 'PENDING'
    CHECK (member_status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE')),
  region_id BIGINT REFERENCES regions(region_id) ON DELETE RESTRICT,
  district_id BIGINT REFERENCES districts(district_id) ON DELETE RESTRICT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (email IS NULL OR length(trim(email)) > 0)
);

CREATE TABLE IF NOT EXISTS member_roles (
  member_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  role_id BIGINT NOT NULL REFERENCES roles(role_id) ON DELETE RESTRICT,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (member_id, role_id)
);

-- ---------------------------------------------------------------------------
-- Linked bank and telecom accounts
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS banks (
  bank_id BIGSERIAL PRIMARY KEY,
  bank_name VARCHAR(150) NOT NULL UNIQUE,
  bank_code VARCHAR(30) UNIQUE,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS telecom_operators (
  operator_id BIGSERIAL PRIMARY KEY,
  operator_name VARCHAR(150) NOT NULL UNIQUE,
  operator_code VARCHAR(30) UNIQUE,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS phone_numbers (
  phone_id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  operator_id BIGINT REFERENCES telecom_operators(operator_id) ON DELETE RESTRICT,
  phone_number VARCHAR(30) NOT NULL UNIQUE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_primary_phone_per_member
  ON phone_numbers(member_id)
  WHERE is_primary AND status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS member_mobile_money_accounts (
  mobile_money_account_id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  phone_id BIGINT NOT NULL REFERENCES phone_numbers(phone_id) ON DELETE RESTRICT,
  operator_id BIGINT NOT NULL REFERENCES telecom_operators(operator_id) ON DELETE RESTRICT,
  account_reference VARCHAR(150),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (member_id, phone_id),
  UNIQUE (operator_id, account_reference)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_primary_mobile_money_per_member
  ON member_mobile_money_accounts(member_id)
  WHERE is_primary AND status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS member_bank_accounts (
  member_bank_account_id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  bank_id BIGINT NOT NULL REFERENCES banks(bank_id) ON DELETE RESTRICT,
  account_number VARCHAR(100) NOT NULL,
  account_name VARCHAR(150),
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bank_id, account_number)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_primary_bank_account_per_member
  ON member_bank_accounts(member_id)
  WHERE is_primary AND status = 'ACTIVE';

-- ---------------------------------------------------------------------------
-- Session, password recovery, notifications, and audit trail
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sessions (
  session_id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_member_active
  ON sessions(member_id, expires_at)
  WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS password_resets (
  password_reset_id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_resets_member_active
  ON password_resets(member_id, expires_at)
  WHERE used_at IS NULL;

CREATE TABLE IF NOT EXISTS notifications (
  notification_id BIGSERIAL PRIMARY KEY,
  member_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_member_unread
  ON notifications(member_id, created_at DESC)
  WHERE is_read = FALSE;

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id BIGSERIAL PRIMARY KEY,
  member_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  actor_type VARCHAR(30) NOT NULL
    CHECK (actor_type IN ('MEMBER', 'OPERATIONS', 'SYSTEM')),
  actor_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  affected_table VARCHAR(100),
  affected_record_id BIGINT,
  old_value JSONB,
  new_value JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_member_created
  ON audit_logs(member_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created
  ON audit_logs(action, created_at DESC);

-- ---------------------------------------------------------------------------
-- Strengthen the tables created by migration 001
-- ---------------------------------------------------------------------------

ALTER TABLE contribution_rules
  ADD COLUMN IF NOT EXISTS minimum_transaction_amount NUMERIC(15,2),
  ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS effective_to TIMESTAMPTZ;

ALTER TABLE bank_transactions
  ADD COLUMN IF NOT EXISTS member_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS bank_id BIGINT REFERENCES banks(bank_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS external_transaction_id VARCHAR(150),
  ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'TZS',
  ADD COLUMN IF NOT EXISTS transaction_status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE telecom_transactions
  ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'TZS',
  ADD COLUMN IF NOT EXISTS transaction_status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
  ADD COLUMN IF NOT EXISTS transaction_type VARCHAR(50) NOT NULL DEFAULT 'PAYMENT',
  ADD COLUMN IF NOT EXISTS description TEXT;

ALTER TABLE contribution_transactions
  ADD COLUMN IF NOT EXISTS contribution_rate NUMERIC(8,5),
  ADD COLUMN IF NOT EXISTS contribution_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS contribution_status VARCHAR(30) NOT NULL DEFAULT 'COMPLETED',
  ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'TZS';

ALTER TABLE reconciliation_records
  ADD COLUMN IF NOT EXISTS reconciliation_run_id BIGINT,
  ADD COLUMN IF NOT EXISTS resolved_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

-- Add constraints through catalog checks so the migration can be safely
-- applied by deployment tooling that retries failed migration steps.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'health_wallet_member_fk'
  ) THEN
    ALTER TABLE health_wallets
      ADD CONSTRAINT health_wallet_member_fk
      FOREIGN KEY (member_id) REFERENCES users(user_id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contribution_member_fk'
  ) THEN
    ALTER TABLE contribution_transactions
      ADD CONSTRAINT contribution_member_fk
      FOREIGN KEY (member_id) REFERENCES users(user_id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contribution_telecom_source_fk'
  ) THEN
    ALTER TABLE contribution_transactions
      ADD CONSTRAINT contribution_telecom_source_fk
      FOREIGN KEY (telecom_transaction_id)
      REFERENCES telecom_transactions(telecom_transaction_id)
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contribution_bank_source_fk'
  ) THEN
    ALTER TABLE contribution_transactions
      ADD CONSTRAINT contribution_bank_source_fk
      FOREIGN KEY (bank_transaction_id)
      REFERENCES bank_transactions(bank_transaction_id)
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_transaction_member_fk'
  ) THEN
    ALTER TABLE wallet_transactions
      ADD CONSTRAINT wallet_transaction_member_fk
      FOREIGN KEY (member_id) REFERENCES users(user_id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_transaction_contribution_fk'
  ) THEN
    ALTER TABLE wallet_transactions
      ADD CONSTRAINT wallet_transaction_contribution_fk
      FOREIGN KEY (contribution_id)
      REFERENCES contribution_transactions(contribution_id)
      ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'bank_transaction_member_account_fk'
  ) THEN
    ALTER TABLE bank_transactions
      ADD CONSTRAINT bank_transaction_member_account_fk
      FOREIGN KEY (member_bank_account_id)
      REFERENCES member_bank_accounts(member_bank_account_id)
      ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'telecom_transaction_member_fk'
  ) THEN
    ALTER TABLE telecom_transactions
      ADD CONSTRAINT telecom_transaction_member_fk
      FOREIGN KEY (member_id) REFERENCES users(user_id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'telecom_transaction_phone_fk'
  ) THEN
    ALTER TABLE telecom_transactions
      ADD CONSTRAINT telecom_transaction_phone_fk
      FOREIGN KEY (phone_id) REFERENCES phone_numbers(phone_id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'telecom_transaction_operator_fk'
  ) THEN
    ALTER TABLE telecom_transactions
      ADD CONSTRAINT telecom_transaction_operator_fk
      FOREIGN KEY (operator_id)
      REFERENCES telecom_operators(operator_id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- A source transaction can produce at most one contribution, independently
-- of the caller-provided external reference.
CREATE UNIQUE INDEX IF NOT EXISTS uq_contribution_telecom_source
  ON contribution_transactions(telecom_transaction_id)
  WHERE telecom_transaction_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_contribution_bank_source
  ON contribution_transactions(bank_transaction_id)
  WHERE bank_transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bank_transactions_member_date
  ON bank_transactions(member_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_telecom_transactions_member_date
  ON telecom_transactions(member_id, transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_contributions_member_date
  ON contribution_transactions(member_id, contribution_date DESC);

CREATE INDEX IF NOT EXISTS idx_reconciliation_source_status
  ON reconciliation_records(source_type, reconciliation_status);

-- Reconciliation is processed in batches so operations can trace a provider
-- file/webhook to all of the records it produced.
CREATE TABLE IF NOT EXISTS reconciliation_runs (
  reconciliation_run_id BIGSERIAL PRIMARY KEY,
  source_type VARCHAR(30) NOT NULL CHECK (source_type IN ('BANK', 'TELECOM')),
  source_name VARCHAR(150),
  source_batch_reference VARCHAR(150) NOT NULL,
  run_status VARCHAR(30) NOT NULL DEFAULT 'PROCESSING'
    CHECK (run_status IN ('PROCESSING', 'COMPLETED', 'FAILED', 'RESOLVED')),
  total_records INTEGER NOT NULL DEFAULT 0 CHECK (total_records >= 0),
  matched_records INTEGER NOT NULL DEFAULT 0 CHECK (matched_records >= 0),
  mismatched_records INTEGER NOT NULL DEFAULT 0 CHECK (mismatched_records >= 0),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  initiated_by BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
  UNIQUE (source_type, source_batch_reference)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reconciliation_record_run_fk'
  ) THEN
    ALTER TABLE reconciliation_records
      ADD CONSTRAINT reconciliation_record_run_fk
      FOREIGN KEY (reconciliation_run_id)
      REFERENCES reconciliation_runs(reconciliation_run_id)
      ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reconciliation_runs_source_status
  ON reconciliation_runs(source_type, run_status, started_at DESC);

COMMIT;
