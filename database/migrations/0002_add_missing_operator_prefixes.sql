-- ============================================================
-- Migration 0002
-- Add missing telecom operator prefixes: Vodacom 079, Yas Money 077.
-- ============================================================
-- Cross-checked 2026-08-13 against the current TCRA numbering plan.
-- The original seed in database/schema/tujitunze.sql was missing
-- these two active prefixes, meaning a member registering with a
-- 079 or 077 number would fail operator lookup at registration.
-- Safe to re-run: ON CONFLICT DO NOTHING guards the unique
-- (operator_id, prefix) constraint.
-- ============================================================

BEGIN;

INSERT INTO telecom_operator_prefixes
    (operator_id, prefix, country_code, prefix_type)
VALUES
    ((SELECT operator_id FROM telecom_operators WHERE operator_name = 'Vodacom'), '079', '255', 'Mobile'),
    ((SELECT operator_id FROM telecom_operators WHERE operator_name = 'Yas Money'), '077', '255', 'Mobile')
ON CONFLICT (operator_id, prefix) DO NOTHING;

COMMIT;
