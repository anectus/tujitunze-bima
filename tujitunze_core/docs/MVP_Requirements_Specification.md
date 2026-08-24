# Tujitunze — MVP Requirements Specification

**Product name:** Tujitunze
**Document:** Functional & Non-Functional Requirements — MVP
**Version:** 1.0
**Date:** 20 August 2026

---

## 1. Purpose

This document sets out the functional and non-functional requirements for
the Tujitunze MVP: a member registers, links an account, and can then track
every contribution and transaction in their own health savings wallet. It
is the reference for what is being built and how it should behave.

## 2. Scope

Tujitunze's MVP centres on the member journey — registration, account
setup, and full visibility into a personal health savings wallet — together
with the platform operations needed to keep that wallet trustworthy:
contribution rules, transaction processing, reconciliation, and audit
logging.

## 3. Product Overview

Tujitunze is a digital health-savings and contribution platform for
Tanzania. A member registers, links a mobile money account and, optionally,
a bank account, and contributions are collected from their linked-account
transactions according to configurable rules and credited to a personal
health savings wallet, which the member can view, top up, withdraw from,
and transfer between wallets at any time.

## 4. Users of the System

| User | Description |
|---|---|
| **Member** | A registered individual using Tujitunze to manage their own health savings wallet. |
| **Platform Operations** (internal) | Maintains contribution rules, processes linked-account transactions, and reviews reconciliation and audit records. |

## 5. Functional Requirements

### 5.1 Registration & Account Setup

- **FR-1** — A new user can register as a member by providing full name,
  NIDA number, phone number, and a password.
- **FR-2** — The system verifies that the NIDA number and phone number are
  not already registered before creating an account.
- **FR-3** — Passwords are stored securely using industry-standard hashing,
  never in plain text.
- **FR-4** — During onboarding, a member selects their region and links a
  mobile money account as their primary contribution source.
- **FR-5** — Linking a bank account, during onboarding or later, is
  optional.
- **FR-6** — A registered member can log in with their phone number/email
  and password and receive a secure session.
- **FR-7** — A member can log out, and sessions expire automatically after
  a period of inactivity.

### 5.2 Profile & Account Management

- **FR-8** — A member can view their own profile: name, NIDA number, phone
  number(s), linked bank account (if any), and membership date.
- **FR-9** — A member can update their personal details and contact
  information.
- **FR-10** — A member can add additional phone numbers to their account.
- **FR-11** — A member can add, update, or remove a linked bank account at
  any time.
- **FR-12** — A member can change their password.

### 5.3 Health Savings Wallet

- **FR-13** — A member can view their current wallet balance at any time.
- **FR-14** — A member can top up their wallet.
- **FR-15** — A member can view a complete, itemised history of all wallet
  transactions — contributions, top-ups, withdrawals, and transfers — each
  showing the balance before and after.
- **FR-16** — A member can withdraw funds from their wallet.
- **FR-17** — A member can transfer funds from their wallet to another
  member's wallet.

### 5.4 Contributions from Linked Accounts

- **FR-18** — Contributions are automatically calculated and credited to a
  member's wallet from their linked bank or telecom transactions, using
  configurable contribution rules (a fixed amount or a percentage of the
  transaction, with an optional minimum and maximum).
- **FR-19** — The same linked-account transaction is never processed into a
  duplicate contribution.
- **FR-20** — A member can view their telecom bundle, airtime, and payment
  history related to their contributions.

### 5.5 Notifications

- **FR-21** — A member receives a notification when their wallet is topped
  up, when a contribution is received, when a new phone number or bank
  account is linked, and when their password is changed.
- **FR-22** — A member can view and manage their notifications.

### 5.6 Reports & Identification

- **FR-23** — A member can view a personal report/statement summarising
  their own wallet activity.
- **FR-24** — A member has a personal QR code that can be used to verify
  their identity.

### 5.7 Platform Operations

- **FR-25** — Contribution rules (fixed or percentage-based, with
  source-type and amount limits) are configured and maintained centrally.
- **FR-26** — Every contribution and wallet-affecting action is recorded in
  an audit trail, capturing what happened, when, and for which member.
- **FR-27** — Linked-account transactions and the contributions generated
  from them can be reconciled to identify and resolve mismatches.

## 6. Non-Functional Requirements

- **Security & privacy** — NIDA numbers, phone numbers, and financial data
  are treated as sensitive. Every access to a member's data is authorised
  and scoped to that member. All input is validated on the server.
  Passwords are hashed with a strong algorithm. No secrets or credentials
  are stored in source code.
- **Data integrity** — Every wallet and contribution update happens as a
  single, all-or-nothing operation, so a failure never leaves a partial or
  inconsistent balance. Financial amounts are stored as precise decimal
  values, never floating-point numbers.
- **Reliability** — The contribution engine processes each linked-account
  transaction exactly once, even if it is received more than once.
- **Auditability** — Every sensitive action is logged at the moment it
  happens, so the audit trail always matches what actually occurred.
- **Performance** — A member's wallet balance and transaction history load
  in under half a second under normal conditions.
- **Availability** — The platform remains available and consistent even if
  a secondary process, such as logging, temporarily fails.
- **Usability** — A new member can register, view their wallet, and see
  their first contribution without needing help from support staff.
- **Transport security & abuse protection** — All communication with the
  platform is encrypted (HTTPS). Login and registration are protected
  against automated abuse through rate limiting.
- **Accounting model** — Wallet balances reflect Tujitunze's internal
  ledger of recorded contributions, top-ups, withdrawals, and transfers.

## 7. Data Foundations

The platform is built around the following core records:

- **Member accounts** — identity, contact, and credential information.
- **Contribution rules** — fixed or percentage-based rules that determine
  how much is contributed from a given transaction.
- **Linked-account transactions** — bank and telecom transactions recorded
  against a member's linked accounts.
- **Contributions** — the amount collected from a linked-account
  transaction and credited to a member's wallet.
- **Health wallets** — one wallet per member, holding the current balance.
- **Wallet transactions** — the full, itemised ledger behind every balance
  change.
- **Reconciliation records** — the match status between a linked-account
  transaction and the contribution it produced.
- **Audit trail** — an append-only record of every sensitive action taken
  on a member's contributions and wallet.

## 8. Assumptions

- Currency is Tanzanian Shillings (TZS).
- A member holds exactly one health savings wallet.
- Linked-account transaction data (bank or telecom) is received and
  processed to generate contributions.

## 9. Acceptance Criteria

The MVP is ready when the following hold true end-to-end:

1. A new member can register, log in, and view their own profile.
2. A linked-account transaction results in a correctly calculated
   contribution added to the member's wallet, even if it is received more
   than once.
3. The wallet balance and transaction history accurately reflect every
   contribution, top-up, withdrawal, and transfer.
4. A member can only ever see their own wallet, profile, and transaction
   history.
5. Every sensitive action is captured in the audit trail.

## 10. Glossary

- **Member** — a registered individual using Tujitunze.
- **Linked-account transaction** — a bank or telecom transaction recorded
  against a member's linked account, which may trigger a contribution.
- **Contribution** — the amount Tujitunze collects from a linked-account
  transaction and credits to a member's wallet, per an active contribution
  rule.
- **Health wallet** — a member's personal balance within Tujitunze.
- **Reconciliation** — comparing linked-account transactions against the
  contributions derived from them to catch mismatches.
