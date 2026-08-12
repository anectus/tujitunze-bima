# Tujitunze / HSIMS — Project Instructions

Health Savings and Insurance Management System for Tanzania. Handles national ID
(NIDA) numbers, health records, and financial transactions (wallet, bank,
telecom contributions) — treat all member data as sensitive by default.

Stack: Next.js (App Router) frontend, NestJS + TypeORM + PostgreSQL backend.

## Roles

Source of truth: the `roles` table seed data in `database/schema/tujitunze.sql`
and the route groups under `frontend/app/(*)`. Backend enforcement is
`@Roles('RoleName')` + `RolesGuard` (`backend/src/modules/auth/guards/roles.guard.ts`)
on top of `JwtAuthGuard` — a request must pass both to reach a role-scoped
handler. As of 2026-08-12, **`Member` is the only role with real backend
endpoints, and the only one actually enforced by `RolesGuard`**
(`members.controller.ts`). Every other role below has no backend
controller at all yet (`backend/src/modules/{admin,hospital,bank,telecom,
insurance}` etc. are empty `@Module({})` stubs, not imported into
`AppModule`) — there's nothing to guard on the backend until those modules
get real endpoints, at which point they should copy the same
`JwtAuthGuard` + `RolesGuard` + `@Roles(...)` pattern.

Each role's frontend route group (`app/(admin)`, `(hospital)`, `(bank)`,
`(telecom)`, `(super-admin)`, `(member)`) does have a client-side gate now:
`components/auth/ProtectedRoute.tsx` (using `lib/hooks/useAuth.ts` /
`lib/utils/permissions.ts`) wraps each `layout.tsx`, decodes the JWT out of
`localStorage`, and redirects to `/login` (no/expired token) or
`/access-denied` (wrong role). **This is UX/defense-in-depth only, not a
security boundary** — the token is decoded client-side, not verified, so
it's trivially bypassable by editing `localStorage`. It's an acceptable gap
only because there's no real data behind these routes yet; once a module
has real endpoints, the backend guard above is what actually protects the
data, same as the existing rule that the frontend not showing a button is
never sufficient on its own.

| Role | Who | Route group | What they're for |
|---|---|---|---|
| `Member` | A registered citizen/patient | `(member)` — dashboard, wallet, telecom, insurance, hospitals, reports, profile, notifications, settings, qr, onboarding | Their own health savings/wallet, linking phone/bank accounts, viewing their own claims and insurance, nothing belonging to another member |
| `Admin` | Internal Tujitunze staff | `(admin)` — members, users, claims, transactions, hospitals, banks, telecom, reports, audit-logs, settings | Operational oversight across members: user/claim/transaction management, reviewing audit logs — not the same as `Super-admin` (system-level config) |
| `Hospital` | Staff at a partner hospital | `(hospital)` — patients, claims, billing, appointments, staff, reports, settings | Their own hospital's patients/claims/billing/staff only — a hospital must never see another hospital's claims (the exact boundary a test should assert) |
| `Insurance` | Staff at an insurance provider | *(no dedicated route group yet — gap; `(member)/insurance` is the member's own view, not a provider portal)* | Managing their own plans and reviewing claims routed to them |
| `Bank` | Staff at a partner bank / bank integration | `(bank)` — accounts, customers, transactions, transfers, reconciliation, reports, settings | Their own bank's linked accounts/transactions — same cross-tenant boundary concern as Hospital |
| `Telecom` | Staff at a partner telecom operator | `(telecom)` — customers, transactions, payments, reconciliation, reports, dashboard, settings | Their own operator's contribution/levy data only |
| `Super-admin` | Platform owner/operator | `(super-admin)` — administrators, roles, permissions, integrations, system, audit-logs, settings | System-wide configuration, managing other Admins, integrations — **not seeded in the `roles` table today** (only 6 rows exist: Member/Admin/Hospital/Insurance/Bank/Telecom); add a migration/seed row before any `@Roles('Super-admin')` guard is written, or logins for this role will always fail the `RolesGuard` check |

Two open items this table surfaces: (1) `Super-admin` has a route group but
no `roles` row — a `Super-admin` account can never pass `RolesGuard` until
one is seeded; (2) `Insurance` has a `roles` row but no route group — a
provider-facing portal hasn't been scaffolded yet.

## Secure Software Development Life Cycle (SSDLC)

Every change to this project — frontend or backend, big or small — goes
through these phases. Skipping a phase is a decision to flag to the user, not
a default.

### 1. Requirements & Planning
- State the security requirement alongside the functional one before building
  (e.g. "who is allowed to call this endpoint", not just "what does it do").
- Classify the data a feature touches: **PII** (name, NIDA, address, DOB),
  **financial** (wallet/bank/telecom transactions), **health** (claims,
  verifications, insurance), or **public**. PII/financial/health data always
  needs an authz check and an audit trail.

### 2. Design
- Threat-model new features before writing code: who can call this, what do
  they have access to today vs after this change, what's the worst input an
  attacker could send. A few sentences is enough for small features.
- Default to least privilege: a role (Member/Admin/Hospital/Insurance/Bank/
  Telecom/Super-admin) gets only what its own workflows require — check
  `database/schema/tujitunze.sql` roles table and route groups under
  `frontend/app/(*)` for the current role boundaries.
- Secrets, keys, and tokens are never designed to live in source, only in env
  vars / a secrets manager.

### 3. Implementation
- Backend: use NestJS DTOs + `class-validator` + a global `ValidationPipe` for
  every endpoint that accepts input — do not rely on manual `if` checks alone
  (current `members.service.ts` / `auth.service.ts` predate this rule and are
  a known gap, not a pattern to copy).
- All DB access goes through TypeORM's query builder / repository API or
  parameterized raw queries (`$1`, `$2`, …) — never string-concatenated SQL.
- Every authenticated endpoint is guarded (NestJS Guards), never left to
  "the frontend won't show the button."
- Never commit `.env`; `.env.example` documents required keys with no real
  values.
- No hardcoded default credentials (e.g. `password: process.env.DB_PASSWORD
  || 'postgres'` in `database.config.ts` is a known gap — insecure fallback
  defaults should fail closed, not fall back to a guessable value).
- `TypeOrmModule` `synchronize: true` is dev-only. Production/shared
  environments must use migrations — flag before this ships anywhere beyond a
  local machine.

### 4. Verification
- Before treating a security-sensitive change as done, run it past the
  `security-review` skill (or `/code-review` for correctness/quality) rather
  than self-certifying.
- New auth/authz logic gets a test that proves the boundary holds (a
  non-member can't hit a member-only route, a hospital can't see another
  hospital's claims, etc.), not just a happy-path test.
- Run `npm audit` (or equivalent) when dependencies change; don't add a
  package without checking it's maintained.

### 5. Deployment
- CORS allowlist stays explicit (see `backend/src/main.ts`) — never wildcard
  origins once real user data is involved.
- Security headers (e.g. `helmet`) and rate limiting on public endpoints
  (`/auth/login`, `/members/register`) are required before any non-local
  deployment — currently absent, tracked as a gap.
- HTTPS only outside local dev.

### 6. Maintenance
- `audit_logs` should capture writes to sensitive tables (claims, wallets,
  bank accounts, insurance policies) — check the table is actually being
  written to, not just present in the schema.
- Revisit this file's "known gaps" as they're closed, so it stays a live
  checklist instead of stale advice.

## Known Security Gaps (updated 2026-08-12)

Resolved since the original baseline: global `ValidationPipe`/DTOs are now
wired in `main.ts`; login issues a real JWT (`auth.service.ts`); guards
(`JwtAuthGuard`, `RolesGuard`) now protect role-scoped routes; and
`backend/.env.example` lists required variables.

Still open, flagged so they aren't silently reintroduced or forgotten:

1. No rate limiting on `/auth/login`, `/members/register`, or (newly added)
   `/members/phone-numbers` — brute force / registration / linking-spam
   risk.
2. No `helmet`/security headers configured in `main.ts`.
3. `database.config.ts` falls back to a default DB password if
   `DB_PASSWORD` is unset.
4. `synchronize: true` in TypeORM config (fine for local dev, unsafe beyond
   it).
5. The frontend persists the JWT access token in `localStorage`
   (`components/auth/LoginForm.tsx`) — no `AuthProvider`/httpOnly-cookie
   infra exists yet (`providers/AuthProvider.tsx`, `lib/store/authStore.ts`
   are still empty stubs), so the token is exposed to XSS. Move to an
   httpOnly cookie once real session infra is built, before any non-local
   deployment.
6. Writes to `phone_numbers` (including the new
   `POST /members/phone-numbers`) aren't recorded in `audit_logs` —
   `audit-logs.module.ts` is still an empty stub with no entity/service.
   Financial/telecom-linking writes should get an audit trail before this
   ships beyond a local machine.
