Tujitunze Core — Functional & Non-functional Requirements (summary)

Core purpose
- Collect small health contributions from bank/telecom source transactions and credit member health wallets.

Priority Functional Areas
- Authentication & RBAC (MUST)
- Source transactions ingestion (BANK/TELECOM) (MUST)
- Contribution rules engine (MUST)
- Contribution transactions (MUST)
- Wallet ledger + wallet transactions (MUST)
- Reconciliation (MUST)
- Notifications, audit logs, reporting (SHOULD)

NFR highlights
- Security (PII/financial/health), audit logging, transactional integrity, rate-limiting, observability.

See README and database/migrations/001_tujitunze_core_mvp.sql for schema and migration details.