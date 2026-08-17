-- ============================================================
-- Migration 0005
-- Backs the real (non-placeholder) parts of the Telecom Dashboard:
-- operator contact info + API/webhook credentials, a contribution
-- rules catalog (seeded with the documented default levy rates),
-- reconciliation runs/records, and an API access log. Safe to
-- re-run.
--
-- Security note on webhook_secret: unlike api_key_hash (bcrypt,
-- one-way — HSIMS only ever verifies an incoming key), the webhook
-- secret is stored as retrievable ciphertext-free plaintext because
-- HSIMS is the one that would sign outgoing webhook deliveries with
-- it, which needs the raw value, not a hash. That's a real known
-- gap (see CLAUDE.md Known Security Gaps) — this should move to an
-- encrypted-at-rest / secrets-manager design before any non-local
-- deployment, same caveat as DB_PASSWORD's insecure fallback.
-- ============================================================

BEGIN;

ALTER TABLE telecom_operators ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(20);
ALTER TABLE telecom_operators ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100);

ALTER TABLE telecom_operators ADD COLUMN IF NOT EXISTS api_key_hash TEXT;
ALTER TABLE telecom_operators ADD COLUMN IF NOT EXISTS api_key_preview VARCHAR(8);
ALTER TABLE telecom_operators ADD COLUMN IF NOT EXISTS api_key_generated_at TIMESTAMP;

ALTER TABLE telecom_operators ADD COLUMN IF NOT EXISTS webhook_url TEXT;
ALTER TABLE telecom_operators ADD COLUMN IF NOT EXISTS webhook_secret TEXT;
ALTER TABLE telecom_operators ADD COLUMN IF NOT EXISTS webhook_secret_generated_at TIMESTAMP;

-- ============================================================
-- CONTRIBUTION RULES
-- ============================================================
-- Read-only for Telecom in this pass (view active rules + history).
-- Nothing edits this table yet — no role has a write endpoint —
-- that's a deliberate follow-up decision (Admin vs Super-admin
-- ownership), not an oversight.

CREATE TABLE IF NOT EXISTS contribution_rules (
    rule_id SERIAL PRIMARY KEY,

    rule_type VARCHAR(50) NOT NULL,

    rate_percent DECIMAL(6,4) NOT NULL,

    minimum_amount DECIMAL(10,2) NOT NULL DEFAULT 1.00,

    effective_date DATE NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO contribution_rules (rule_type, rate_percent, minimum_amount, effective_date, is_active)
SELECT * FROM (VALUES
    ('Airtime', 0.5000, 1.00, CURRENT_DATE, TRUE),
    ('Data Bundle', 0.3000, 1.00, CURRENT_DATE, TRUE),
    ('Mobile Money Transfer', 0.5000, 1.00, CURRENT_DATE, TRUE),
    ('Bank Transfer', 0.4000, 1.00, CURRENT_DATE, TRUE)
) AS seed(rule_type, rate_percent, minimum_amount, effective_date, is_active)
WHERE NOT EXISTS (SELECT 1 FROM contribution_rules);

-- ============================================================
-- RECONCILIATION
-- ============================================================
-- A Telecom operator's own record of a contribution batch (from
-- their side) can be uploaded and matched against HSIMS's
-- telecom_contributions by reference number — real matching logic,
-- just no live external feed to pull from automatically yet.

CREATE TABLE IF NOT EXISTS telecom_reconciliation_runs (
    run_id SERIAL PRIMARY KEY,

    operator_id INT NOT NULL
        REFERENCES telecom_operators(operator_id)
        ON DELETE CASCADE,

    initiated_by INT
        REFERENCES users(user_id),

    total_uploaded INT NOT NULL DEFAULT 0,
    matched_count INT NOT NULL DEFAULT 0,
    unmatched_count INT NOT NULL DEFAULT 0,

    run_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS telecom_reconciliation_records (
    record_id SERIAL PRIMARY KEY,

    run_id INT NOT NULL
        REFERENCES telecom_reconciliation_runs(run_id)
        ON DELETE CASCADE,

    external_reference VARCHAR(100) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    record_date TIMESTAMP,

    matched_contribution_id INT
        REFERENCES telecom_contributions(contribution_id),

    match_status VARCHAR(20) NOT NULL DEFAULT 'Unmatched'
);

-- ============================================================
-- API ACCESS LOGS
-- ============================================================
-- Connection tests today; a real place for inbound-webhook-receipt
-- logging to write into once that endpoint exists.

CREATE TABLE IF NOT EXISTS api_access_logs (
    log_id SERIAL PRIMARY KEY,

    operator_id INT NOT NULL
        REFERENCES telecom_operators(operator_id)
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
