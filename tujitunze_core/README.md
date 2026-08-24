# Tujitunze Core (MVP)

Digital Health Savings & Contribution Management Platform — a focused core that collects contributions from bank/telecom source transactions, records contribution transactions, and maintains a wallet ledger and reconciliation pipeline. This repo is a scaffold for a clean MVP separate from the original HSIMS repo.

Structure:
- backend/: NestJS backend (modules: auth, users, wallets, transactions, contributions, reconciliation, audit)
- frontend/: Next.js frontend (member/admin dashboards)
- database/migrations/: SQL migrations (run in numeric order)
- docs/: requirements, ERD and runbook

Database setup:

1. Create a PostgreSQL database named `tujitunze_core`.
2. Run `database/migrations/001_tujitunze_core_mvp.sql`.
3. Run `database/migrations/002_core_identity_operations.sql`.
4. Configure `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, and `DB_NAME` in the backend environment.

Migration `002` adds the member/account foundation required by the
requirements specification, including linked bank/mobile-money accounts,
roles, sessions, password resets, notifications, audit logs, and
reconciliation batches. It also adds foreign keys, indexes, and unique
source-transaction constraints needed for exactly-once contribution
processing.

Docker development setup:

```bash
cp .env.example .env
# Edit .env and replace POSTGRES_PASSWORD before starting the stack.
docker compose up --build
```

PostgreSQL is exposed on `localhost:${POSTGRES_PORT}` (default `5433`) and
the API is exposed on `http://localhost:${BACKEND_PORT}` (default `3000`).
The migrations are mounted into PostgreSQL's initialization directory and run
automatically the first time the named database volume is created.

To recreate the core database from scratch:

```bash
docker compose down -v
docker compose up --build
```