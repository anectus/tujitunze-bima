-- ============================================================
-- Migration 0004
-- Link Hospital/Bank/Telecom/Insurance staff accounts to the
-- specific hospital/bank/operator/provider they work for, so a
-- role-scoped dashboard can query "my own tenant's data" instead
-- of either everything or nothing. All four columns are nullable
-- (only staff of that role have one set) and there's still no UI
-- to assign them — see CLAUDE.md's Known Security Gaps.
-- Safe to re-run.
-- ============================================================

BEGIN;

ALTER TABLE users ADD COLUMN IF NOT EXISTS hospital_id INT
    REFERENCES hospitals(hospital_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS bank_id INT
    REFERENCES banks(bank_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS telecom_operator_id INT
    REFERENCES telecom_operators(operator_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS insurance_provider_id INT
    REFERENCES insurance_providers(provider_id);

COMMIT;
