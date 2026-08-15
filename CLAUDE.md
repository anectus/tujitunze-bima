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
handler. As of 2026-08-14, **every role has at least one real, guarded
backend endpoint**: `Member` (`members.controller.ts`), `Admin`
(`backend/src/modules/admin/` — members and hospital-directory management,
plus `GET /admin/dashboard`), and now `Hospital`/`Bank`/`Telecom`/
`Insurance`/`Super-admin`, each with its own module
(`backend/src/modules/{hospital,bank,telecom,insurance,super-admin}/`)
exposing a single `GET /<role>/dashboard` summary endpoint following the
same `JwtAuthGuard` + `RolesGuard` + `@Roles(...)` pattern `admin`
established. Beyond that one endpoint per role, these five are still a
thin slice — no CRUD for patients/claims/billing/accounts/etc. yet; add
those to the same module as the need comes up, not as new modules per
resource.

Hospital/Bank/Telecom/Insurance dashboards are tenant-scoped: `users` has
nullable `hospital_id`/`bank_id`/`telecom_operator_id`/
`insurance_provider_id` columns (`database/migrations/
0004_add_staff_tenant_links.sql`) linking a staff account to the specific
hospital/bank/operator/provider it belongs to, and each service throws
`ForbiddenException` if that link is unset rather than returning
empty/global data.

As of 2026-08-14, Super-admin can now create staff accounts for any role
through a real endpoint instead of hand-written SQL: `POST /super-admin/
administrators` (`backend/src/modules/super-admin/super-admin.service.ts`
`createAdministrator`, DTO in `dto/create-administrator.dto.ts`) validates
NIDA/email uniqueness the same way `members.service.ts`'s `register()`
does, hashes the password at the same bcrypt cost (12 rounds), rejects a
tenant id that doesn't match what the chosen role requires (Hospital/Bank/
Telecom/Insurance need one, Admin/Super-admin must not have one), and
audit-logs the creation (`staff_account.create`) inside the same
transaction as the write. `GET /super-admin/administrators` lists every
non-Member account with its role and tenant name; `GET /super-admin/
tenants` feeds the create form's tenant dropdown. Frontend at
`(super-admin)/super-admin/administrators/page.tsx`. `Member` accounts
still only ever come from `/members/register` — this endpoint deliberately
excludes that role. Covered by
`backend/test/super-admin-administrators.e2e-spec.ts`, including the full
create → log in → reach the new account's own scoped dashboard loop.

As of 2026-08-15, Super-admin can also manage the roles/permissions catalog
itself, closing the gap the table below used to call out: `GET
/super-admin/roles` lists every role with its permissions and live
`user_count`; `POST /super-admin/roles` creates a role (starts with no
permissions); `PUT /super-admin/roles/:id/permissions` replaces a role's
permission set wholesale (not incremental — send the full desired list);
`PATCH /super-admin/roles/:id` renames/redescribes a role; `DELETE
/super-admin/roles/:id` removes one. `GET /super-admin/permissions` lists
the permission catalog for the assignment UI. All five live in
`super-admin-roles.service.ts`/`super-admin-roles.controller.ts` and share
the same `JwtAuthGuard` + `RolesGuard` + `@Roles('Super-admin')` guard as
`administrators`. Rename/delete both reject the seven seeded role names
(`Member`/`Admin`/`Hospital`/`Bank`/`Telecom`/`Insurance`/`Super-admin` —
see `CORE_ROLE_NAMES` in the service) with `403`, since those strings are
load-bearing in every `@Roles(...)` decorator and frontend route group;
delete additionally rejects with `409` if the role still has any
`member_roles` rows (reassign first). Every write is audit-logged
(`role.create`/`role.update`/`role.permissions_update`/`role.delete`)
inside the same transaction. Frontend at
`(super-admin)/super-admin/roles/page.tsx` — core roles render read-only
(name/description as text, no delete button); custom roles get editable
fields and a delete button, purely a UX mirror of the backend's guard, not
a substitute for it. Covered by
`backend/test/super-admin-roles.e2e-spec.ts`.

Each role's frontend route group (`app/(admin)`, `(hospital)`, `(bank)`,
`(telecom)`, `(super-admin)`, `(insurance)`, `(member)`) does have a
client-side gate now: `components/auth/ProtectedRoute.tsx` (using
`lib/hooks/useAuth.ts` / `lib/utils/permissions.ts`) wraps each
`layout.tsx`, decodes the JWT out of `localStorage`, and redirects to
`/login` (no/expired token) or `/access-denied` (wrong role). **This is
UX/defense-in-depth only, not a security boundary** — the token is decoded
client-side, not verified, so it's trivially bypassable by editing
`localStorage`. The backend guard above is what actually protects the
data, same as the existing rule that the frontend not showing a button is
never sufficient on its own.

Every staff route group now also shares one sidebar shell
(`components/dashboard/DashboardLayout.tsx` + `components/common/
Sidebar.tsx`, mounted in each group's `layout.tsx`) so a role's nav is
consistent across every page in that group, not just its dashboard. A
group's `NAV_ITEMS` list only real pages — most of these route groups
still have no `page.tsx` beyond `dashboard/`, so don't copy a nav entry
from this table's route-group column without first checking the page
exists, or it'll 404.

Route groups don't add a URL prefix in Next.js — `(admin)/dashboard` and
`(member)/dashboard` would both resolve to `/dashboard` and collide, which
is why each role's dashboard lives at `/<role>/dashboard`
(`app/(admin)/admin/dashboard`, `app/(hospital)/hospital/dashboard`, …)
except `Member`, which already owned the bare `/dashboard`. The other
folders each route group was originally scaffolded with (e.g. `(admin)/
claims`, `(admin)/settings`) are still bare, unprefixed segments — the
same collision is latent there too (two role groups both adding, say, a
`reports/page.tsx` will collide at `/reports`) and will need the same
`/<role>/...` prefix treatment whenever those get built out, not just
`dashboard`.

| Role | Who | Route group | What they're for |
|---|---|---|---|
| `Member` | A registered citizen/patient | `(member)` — dashboard, wallet, telecom, insurance, hospitals, reports, profile, notifications, settings, qr, onboarding | Their own health savings/wallet, linking phone/bank accounts, viewing their own claims and insurance, nothing belonging to another member |
| `Admin` | Internal Tujitunze staff | `(admin)` — members, users, claims, transactions, hospitals, banks, telecom, reports, audit-logs, settings; dashboard at `/admin/dashboard` | Operational oversight across members: user/claim/transaction management, reviewing audit logs — not the same as `Super-admin` (system-level config) |
| `Hospital` | Staff at a partner hospital | `(hospital)` — dashboard at `/hospital/dashboard` (only real page so far); patients, claims, billing, appointments, staff, reports, settings folders still empty | Their own hospital's patients/claims/billing/staff only — a hospital must never see another hospital's claims (enforced today via `users.hospital_id` scoping in `hospital.service.ts`, and tested in `backend/test/role-dashboards.e2e-spec.ts`) |
| `Insurance` | Staff at an insurance provider | `(insurance)` — dashboard at `/insurance/dashboard` (only page; route group didn't exist before 2026-08-14) | Managing their own plans and reviewing claims routed to them |
| `Bank` | Staff at a partner bank / bank integration | `(bank)` — dashboard at `/bank/dashboard` (only real page so far); accounts, customers, transactions, transfers, reconciliation, reports, settings folders still empty | Their own bank's linked accounts/transactions — same cross-tenant boundary concern as Hospital |
| `Telecom` | Staff at a partner telecom operator | `(telecom)` — dashboard at `/telecom/dashboard` (only real page so far); customers, transactions, payments, reconciliation, reports, settings folders still empty | Their own operator's contribution/levy data only |
| `Super-admin` | Platform owner/operator | `(super-admin)` — dashboard at `/super-admin/dashboard`, staff provisioning at `/super-admin/administrators`, roles/permissions catalog at `/super-admin/roles`; integrations, system, audit-logs, settings folders still empty | System-wide configuration, managing other Admins, integrations — role is seeded (`role_id 7`); can create a staff account (any role) via `/super-admin/administrators` and manage the roles/permissions catalog via `/super-admin/roles` (create/rename/delete a role, assign its permissions) — the seven core role names can't be renamed or deleted |

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
- Security headers (e.g. `helmet`) are required before any non-local
  deployment — currently absent, tracked as a gap. Rate limiting on
  `/auth/login`, `/members/register`, and other write endpoints is now in
  place (`@nestjs/throttler`, see Known Security Gaps), but its in-memory
  storage needs revisiting before a horizontally-scaled deployment.
- HTTPS only outside local dev.

### 6. Maintenance
- `audit_logs` should capture writes to sensitive tables (claims, wallets,
  bank accounts, insurance policies) — check the table is actually being
  written to, not just present in the schema.
- Revisit this file's "known gaps" as they're closed, so it stays a live
  checklist instead of stale advice.

## Known Security Gaps (updated 2026-08-15)

Resolved since the original baseline: global `ValidationPipe`/DTOs are now
wired in `main.ts`; login issues a real JWT (`auth.service.ts`); guards
(`JwtAuthGuard`, `RolesGuard`) now protect role-scoped routes;
`backend/.env.example` lists required variables; `audit_logs` is now a
real entity/service (`backend/src/modules/audit-logs/`), written to
atomically inside the same DB transaction as the write it's logging
(`phone_number.add`, `bank_account.add`, `member.password_change`,
`member.status_change`), with an Admin-only `GET /admin/audit-logs` to
read it back; `Hospital`/`Bank`/`Telecom`/`Insurance`/`Super-admin` now
each have a real guarded `GET /<role>/dashboard` endpoint instead of an
empty module stub; the `Super-admin` role row (previously believed
unseeded) was confirmed already present in the live database — no seed
migration was actually needed; Super-admin can now provision a staff
account for any role via `POST /super-admin/administrators` instead of a
hand-written SQL `INSERT`; Super-admin can now create/rename/delete
roles and edit their permission sets via `/super-admin/roles` instead of
hand-written SQL against `roles`/`role_permissions` (see the Roles section
above), with e2e coverage for the core-role-name protection; and
`@nestjs/throttler` (added 2026-08-15) now rate-limits `/auth/login`,
`/members/register`, `/members/phone-numbers`, `/super-admin/
administrators`, and `/super-admin/roles*` (`ThrottlerModule.forRoot` in
`app.module.ts` sets a generous global default, `@Throttle(...)` on each
of those handlers/controllers sets the tighter per-route limit), proven
by `backend/test/rate-limiting.e2e-spec.ts` actually hitting each limit
and asserting the `429`, not just checking the decorator is present.

Still open, flagged so they aren't silently reintroduced or forgotten:

1. `@nestjs/throttler`'s in-memory storage is per-process — fine for this
   single-instance app, but won't share rate-limit state across multiple
   backend instances behind a load balancer. Revisit with a shared store
   (e.g. Redis) before any horizontally-scaled deployment. Limits are also
   currently fixed in code, not configurable per-environment via env vars.
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
6. `audit_logs` coverage is partial — only the four write paths listed
   above are instrumented. `POST /members/register` (account creation),
   `PATCH /members/me` (profile updates), and any future
   Hospital/Bank/Telecom/Insurance writes are not yet logged. Extend each
   new sensitive write with `AuditLogsService.record(manager, …)` inside
   its transaction as those land, rather than adding it as an afterthought.
7. `AuditLogsService.list()` has no pagination or filtering — it returns
   the latest 200 rows flat. Fine for local testing; needs pagination
   (and probably filtering by member/action/date) before this is usable
   at real volume.
8. `POST /members/wallet/topup` (`backend/src/modules/wallets/`) credits
   the wallet ledger directly — it does **not** capture a real mobile
   money or bank debit. There is no live payment gateway integrated
   (`telecom-contributions`/`bank-transactions` modules are still empty
   stubs), so a top-up today is trusted, unauthenticated-by-a-third-party
   ledger math, not a real funds movement. Treat this as the wallet's
   internal accounting layer, not a payment feature, until a real
   mobile-money/bank integration sits in front of it.
9. `POST /super-admin/administrators` (added 2026-08-14) can *create* a
   staff account for any role and set its tenant link, but there's still
   no way to edit, deactivate, delete, or reassign one after creation —
   unlike roles (#10 below), administrators have no edit/delete path yet.
   A Hospital/Bank/Telecom/Insurance login with no tenant link set still
   gets a `403 Forbidden` from its dashboard rather than someone else's
   data or a silent empty result — that part of the design hasn't changed,
   only how the link gets set in the first place.
10. `PUT /super-admin/roles/:id/permissions` replaces a role's entire
    permission set on every call rather than diffing — a stale client
    payload silently drops permissions another admin just added
    concurrently (last write wins, no optimistic-locking/version check).
    Deleting a role cascades its `role_permissions` rows at the DB level
    (`ON DELETE CASCADE`) but is blocked at the service layer whenever
    `member_roles` still references it, so no user is ever silently left
    with a dangling role.
11. None of the e2e spec files under `backend/test/` apply the global
    `ValidationPipe` that `main.ts` wires up for the real app — they only
    call `createNestApplication()` + `app.init()`, so class-validator
    never runs and a request with a missing/malformed body reaches the
    service layer unchecked instead of getting a `400`. This was only
    caught by accident while writing `rate-limiting.e2e-spec.ts` (an empty
    `POST /super-admin/roles` body 500'd in-process instead of the `400`
    the real running server correctly returns). That one spec now sets up
    its own `useGlobalPipes(...)` to match `main.ts`; the other four spec
    files still don't, so a DTO validation bug could pass their e2e suite
    while still being broken in production. Worth fixing once, in a
    shared test bootstrap helper, rather than copy-pasting the pipe setup
    into every spec file as it's noticed.
