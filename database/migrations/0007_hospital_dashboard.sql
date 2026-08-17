-- ============================================================
-- Migration 0007
-- Backs the real (non-placeholder) parts of the Hospital Dashboard.
-- Unlike Telecom/Bank, the spec has no "API Integration" section for
-- Hospital, so there's no api_key/webhook column pair added here —
-- Security Settings stays a placeholder like the others' does.
--
-- Genuinely new territory: treatments (a clinical visit record — no
-- table existed for this at all) and hospital_payments (what HSIMS
-- owes the hospital for an approved claim — same ledger/bookkeeping-
-- only caveat as health_wallets and Bank's settlements, see CLAUDE.md
-- Known Security Gap #8).
-- ============================================================

BEGIN;

ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS contact_email VARCHAR(100);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS facility_type VARCHAR(50);
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS bed_capacity INT;
ALTER TABLE hospitals ADD COLUMN IF NOT EXISTS services_offered TEXT;

-- ============================================================
-- TREATMENTS (Treatment section)
-- ============================================================

CREATE TABLE IF NOT EXISTS treatments (
    treatment_id SERIAL PRIMARY KEY,

    hospital_id INT NOT NULL
        REFERENCES hospitals(hospital_id)
        ON DELETE CASCADE,

    member_id INT NOT NULL
        REFERENCES users(user_id),

    verification_id INT
        REFERENCES healthcare_verifications(verification_id),

    visit_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    services_provided TEXT NOT NULL,
    procedures TEXT,
    prescription TEXT,

    treatment_status VARCHAR(20) NOT NULL DEFAULT 'Active'
        CHECK (treatment_status IN ('Active', 'Completed')),

    created_by INT
        REFERENCES users(user_id),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- healthcare_claims already exists (see tujitunze.sql #21) — link a
-- claim back to the treatment it billed for. Nullable since a claim
-- can still be filed without going through this new Treatment flow
-- first (matches the loose FK style already used on
-- member_insurance_id in that same table).
ALTER TABLE healthcare_claims ADD COLUMN IF NOT EXISTS treatment_id INT
    REFERENCES treatments(treatment_id);

-- ============================================================
-- HOSPITAL PAYMENTS (Payments section)
-- ============================================================
-- What HSIMS owes this hospital for an approved claim. Read-only for
-- Hospital by design — a hospital approving its own payment would be
-- a conflict of interest; a Pending row is created automatically when
-- a claim's status moves to Approved (see HospitalService.
-- updateClaimStatus). Ledger/bookkeeping only, same as
-- bank_fund_accounts — nothing here moves real money.

CREATE TABLE IF NOT EXISTS hospital_payments (
    payment_id SERIAL PRIMARY KEY,

    hospital_id INT NOT NULL
        REFERENCES hospitals(hospital_id)
        ON DELETE CASCADE,

    claim_id INT NOT NULL
        REFERENCES healthcare_claims(claim_id),

    amount DECIMAL(15,2) NOT NULL,

    payment_status VARCHAR(20) NOT NULL DEFAULT 'Pending'
        CHECK (payment_status IN ('Pending', 'Approved', 'Completed')),

    payment_date TIMESTAMP,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
