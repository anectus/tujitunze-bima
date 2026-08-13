-- ============================================================
-- Migration 0001
-- Add NIDA/phone format constraints, rename Tigo -> Yas Money,
-- tighten insurance_plans amount precision.
-- ============================================================
-- Brings a database already created from an earlier copy of
-- database/schema/tujitunze.sql in line with the current version.
-- Safe to re-run (constraints are dropped/re-added, the operator
-- rename is a no-op once applied).
--
-- NOTE: the CHECK constraints below will fail to apply if any
-- existing row already violates the format (e.g. a nida_number or
-- phone_number stored without the expected shape). Clean up any
-- such rows before running this against a database with real data.
-- ============================================================

BEGIN;

-- 1. NIDA number format: 8-5-5-2 digit groups, e.g. 20030707-35805-00002-26
--    (matches RegisterDto.nidaNumber in backend/src/members/dto/register.dto.ts)
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_users_nida_number_format;
ALTER TABLE users ADD CONSTRAINT chk_users_nida_number_format
    CHECK (nida_number ~ '^[0-9]{8}-[0-9]{5}-[0-9]{5}-[0-9]{2}$');

-- 2. Phone number format: local format 0[67]XXXXXXXX, matching what
--    MembersService.normalizeTanzanianPhone actually stores (it strips
--    any 255/+255 prefix before insert, so 255XXXXXXXXX never lands here).
ALTER TABLE phone_numbers DROP CONSTRAINT IF EXISTS chk_phone_numbers_format;
ALTER TABLE phone_numbers ADD CONSTRAINT chk_phone_numbers_format
    CHECK (phone_number ~ '^0[67][0-9]{8}$');

-- 3. Tigo Tanzania rebranded to Yas Money. telecom_operator_prefixes
--    references telecom_operators by operator_id, so no downstream
--    rows need updating beyond this rename.
UPDATE telecom_operators SET operator_name = 'Yas Money' WHERE operator_name = 'Tigo';

-- 4. Tighten insurance plan amount precision.
--    NOTE: this lowers the max storable value from
--    99,999,999,999,999.99 to 99,999,999.99 — confirm no existing
--    premium_amount/coverage_amount rows exceed that before running
--    this against a database with real data.
ALTER TABLE insurance_plans ALTER COLUMN premium_amount TYPE DECIMAL(10,2);
ALTER TABLE insurance_plans ALTER COLUMN coverage_amount TYPE DECIMAL(10,2);

COMMIT;
