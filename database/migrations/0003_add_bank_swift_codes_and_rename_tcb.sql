-- ============================================================
-- Migration 0003
-- Populate banks.swift_code, rename "TPB Bank" -> "Tanzania
-- Commercial Bank".
-- ============================================================
-- Cross-checked 2026-08-13 against theswiftcodes.com and Wise's
-- Tanzania SWIFT code registry. "TPB Bank" is renamed because it
-- merged with TIB and rebranded to Tanzania Commercial Bank (TCB) in
-- 2020/2021 — it kept its legacy TAPBTZTZ SWIFT code from its
-- Tanzania Postal Bank days. Safe to re-run.
-- ============================================================

BEGIN;

UPDATE banks SET bank_name = 'Tanzania Commercial Bank', bank_code = 'TCB'
    WHERE bank_code = 'TPB';

UPDATE banks SET swift_code = v.swift_code
FROM (VALUES
    ('CRDB', 'CORUTZTZ'),
    ('NMB', 'NMIBTZTZ'),
    ('NBC', 'NLCBTZTX'),
    ('ABSA', 'BARCTZTZ'),
    ('STANBIC', 'SBICTZTX'),
    ('SCB', 'SCBLTZTX'),
    ('EXIM', 'EXTNTZTZ'),
    ('NCBA', 'CBAFTZTZ'),
    ('TCB', 'TAPBTZTZ'),
    ('KCB', 'KCBLTZTZ')
) AS v(bank_code, swift_code)
WHERE banks.bank_code = v.bank_code;

COMMIT;
