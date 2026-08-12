-- ============================================================
-- TUJITUNZE / HSIMS
-- HEALTH SAVINGS AND INSURANCE MANAGEMENT SYSTEM
-- ============================================================
-- Database: tujitunze
-- Authentication table: users
-- Database: PostgreSQL
-- ============================================================


-- ============================================================
-- 1. USERS
-- ============================================================
-- Main registration and authentication table.
-- This matches the current NestJS User entity
-- (backend/src/members/entities/user.entity.ts).

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,

    first_name VARCHAR(50) NOT NULL,
    second_name VARCHAR(50),
    surname VARCHAR(50) NOT NULL,

    email VARCHAR(100) UNIQUE,
    nida_number VARCHAR(20) UNIQUE NOT NULL,

    gender VARCHAR(20),
    date_of_birth DATE,

    address TEXT,
    region VARCHAR(100),
    district VARCHAR(1
    
    00),

    password_hash TEXT NOT NULL,

    member_status VARCHAR(20) NOT NULL DEFAULT 'Pending',

    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. ROLES
-- ============================================================

CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,

    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. MEMBER ROLES
-- ============================================================

CREATE TABLE member_roles (
    member_role_id SERIAL PRIMARY KEY,

    member_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    role_id INT NOT NULL
        REFERENCES roles(role_id)
        ON DELETE CASCADE,

    assigned_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(member_id, role_id)
);


-- ============================================================
-- 3b. PERMISSIONS
-- ============================================================
-- Coarse, resource-scoped permission catalog (one permission per
-- feature area, not per CRUD verb). Granted to roles via
-- role_permissions below and carried in the JWT alongside role
-- names so guards can check either.

CREATE TABLE permissions (
    permission_id SERIAL PRIMARY KEY,

    permission_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 3c. ROLE PERMISSIONS
-- ============================================================

CREATE TABLE role_permissions (
    role_permission_id SERIAL PRIMARY KEY,

    role_id INT NOT NULL
        REFERENCES roles(role_id)
        ON DELETE CASCADE,

    permission_id INT NOT NULL
        REFERENCES permissions(permission_id)
        ON DELETE CASCADE,

    assigned_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(role_id, permission_id)
);


-- ============================================================
-- 4. TELECOM OPERATORS
-- ============================================================

CREATE TABLE telecom_operators (
    operator_id SERIAL PRIMARY KEY,

    operator_name VARCHAR(100) UNIQUE NOT NULL,

    country_code VARCHAR(10) NOT NULL DEFAULT '255',

    api_endpoint TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 5. TELECOM OPERATOR PREFIXES
-- ============================================================

CREATE TABLE telecom_operator_prefixes (
    prefix_id SERIAL PRIMARY KEY,

    operator_id INT NOT NULL
        REFERENCES telecom_operators(operator_id)
        ON DELETE CASCADE,

    prefix VARCHAR(10) NOT NULL,

    country_code VARCHAR(10) NOT NULL DEFAULT '255',

    prefix_type VARCHAR(50),

    status VARCHAR(20) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(operator_id, prefix)
);


-- ============================================================
-- 6. PHONE NUMBERS
-- ============================================================
-- A user's mobile phone numbers. Registration creates the
-- primary phone here; additional phones can be added later.
-- This matches the current NestJS PhoneNumber entity
-- (backend/src/members/entities/phone-number.entity.ts).

CREATE TABLE phone_numbers (
    phone_id SERIAL PRIMARY KEY,

    user_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    operator_id INT NOT NULL
        REFERENCES telecom_operators(operator_id),

    phone_number VARCHAR(20) UNIQUE NOT NULL,

    account_number VARCHAR(50),

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    phone_status VARCHAR(20) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 7. BANKS
-- ============================================================

CREATE TABLE banks (
    bank_id SERIAL PRIMARY KEY,

    bank_name VARCHAR(150) UNIQUE NOT NULL,

    bank_code VARCHAR(50) UNIQUE,

    swift_code VARCHAR(50),

    country_code VARCHAR(10) NOT NULL DEFAULT '255',

    api_endpoint TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 8. BANK BRANCHES
-- ============================================================

CREATE TABLE bank_branches (
    branch_id SERIAL PRIMARY KEY,

    bank_id INT NOT NULL
        REFERENCES banks(bank_id)
        ON DELETE CASCADE,

    branch_code VARCHAR(50) NOT NULL,

    branch_name VARCHAR(150) NOT NULL,

    region VARCHAR(100),

    district VARCHAR(100),

    location TEXT,

    contact_phone VARCHAR(20),

    status VARCHAR(20) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(bank_id, branch_code)
);


-- ============================================================
-- 9. BANK ACCOUNT PREFIXES
-- ============================================================

CREATE TABLE bank_account_prefixes (
    prefix_id SERIAL PRIMARY KEY,

    bank_id INT NOT NULL
        REFERENCES banks(bank_id)
        ON DELETE CASCADE,

    prefix VARCHAR(30) NOT NULL,

    prefix_length INT NOT NULL,

    prefix_type VARCHAR(50),

    description TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(bank_id, prefix)
);


-- ============================================================
-- 10. MEMBER BANK ACCOUNTS
-- ============================================================
-- This is where a registered member links/selects a bank account.

CREATE TABLE member_bank_accounts (
    member_bank_account_id SERIAL PRIMARY KEY,

    member_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    bank_id INT NOT NULL
        REFERENCES banks(bank_id),

    branch_id INT
        REFERENCES bank_branches(branch_id),

    account_number VARCHAR(50) UNIQUE NOT NULL,

    account_holder_name VARCHAR(150) NOT NULL,

    account_type VARCHAR(50),

    account_status VARCHAR(30) NOT NULL DEFAULT 'Pending',

    verification_status VARCHAR(30) NOT NULL DEFAULT 'Pending',

    is_primary BOOLEAN NOT NULL DEFAULT FALSE,

    linked_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    verified_date TIMESTAMP
);


-- ============================================================
-- 11. BANK TRANSACTIONS
-- ============================================================

CREATE TABLE bank_transactions (
    bank_transaction_id SERIAL PRIMARY KEY,

    member_bank_account_id INT NOT NULL
        REFERENCES member_bank_accounts(member_bank_account_id)
        ON DELETE CASCADE,

    transaction_reference VARCHAR(100) UNIQUE NOT NULL,

    transaction_type VARCHAR(50) NOT NULL,

    amount DECIMAL(15,2) NOT NULL,

    transaction_status VARCHAR(30) NOT NULL DEFAULT 'Completed',

    transaction_date TIMESTAMP NOT NULL,

    description TEXT,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 12. HEALTH WALLETS
-- ============================================================
-- Each member gets one health wallet.

CREATE TABLE health_wallets (
    wallet_id SERIAL PRIMARY KEY,

    member_id INT UNIQUE NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    wallet_number VARCHAR(50) UNIQUE NOT NULL,

    balance DECIMAL(15,2) NOT NULL DEFAULT 0.00,

    wallet_status VARCHAR(30) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 13. TELECOM CONTRIBUTIONS
-- ============================================================
-- Example:
-- Member purchases airtime.
-- TSh 50 is allocated to Tujitunze.

CREATE TABLE telecom_contributions (
    contribution_id SERIAL PRIMARY KEY,

    member_id INT NOT NULL
        REFERENCES users(user_id),

    phone_id INT
        REFERENCES phone_numbers(phone_id),

    operator_id INT NOT NULL
        REFERENCES telecom_operators(operator_id),

    contribution_amount DECIMAL(15,2) NOT NULL,

    contribution_source VARCHAR(50) NOT NULL,

    reference_number VARCHAR(100) UNIQUE,

    processing_status VARCHAR(30) NOT NULL DEFAULT 'Pending',

    contribution_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 14. WALLET TRANSACTIONS
-- ============================================================

CREATE TABLE wallet_transactions (
    wallet_transaction_id SERIAL PRIMARY KEY,

    wallet_id INT NOT NULL
        REFERENCES health_wallets(wallet_id),

    contribution_id INT
        REFERENCES telecom_contributions(contribution_id),

    bank_transaction_id INT
        REFERENCES bank_transactions(bank_transaction_id),

    transaction_type VARCHAR(50) NOT NULL,

    amount DECIMAL(15,2) NOT NULL,

    transaction_reference VARCHAR(100) UNIQUE,

    remarks TEXT,

    transaction_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 15. INSURANCE PROVIDERS
-- ============================================================

CREATE TABLE insurance_providers (
    provider_id SERIAL PRIMARY KEY,

    provider_name VARCHAR(150) UNIQUE NOT NULL,

    license_number VARCHAR(100) UNIQUE,

    contact_phone VARCHAR(20),

    contact_email VARCHAR(100),

    address TEXT,

    status VARCHAR(30) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 16. INSURANCE PLANS
-- ============================================================

CREATE TABLE insurance_plans (
    plan_id SERIAL PRIMARY KEY,

    provider_id INT NOT NULL
        REFERENCES insurance_providers(provider_id),

    plan_name VARCHAR(150) NOT NULL,

    plan_code VARCHAR(50) UNIQUE,

    description TEXT,

    premium_amount DECIMAL(15,2),

    coverage_amount DECIMAL(15,2),

    duration_months INT,

    status VARCHAR(30) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 17. MEMBER INSURANCE
-- ============================================================

CREATE TABLE member_insurance (
    member_insurance_id SERIAL PRIMARY KEY,

    member_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    plan_id INT NOT NULL
        REFERENCES insurance_plans(plan_id),

    policy_number VARCHAR(100) UNIQUE NOT NULL,

    start_date DATE NOT NULL,

    end_date DATE,

    policy_status VARCHAR(30) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 18. DEPENDENTS
-- ============================================================

CREATE TABLE dependents (
    dependent_id SERIAL PRIMARY KEY,

    member_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    first_name VARCHAR(50) NOT NULL,

    middle_name VARCHAR(50),

    surname VARCHAR(50) NOT NULL,

    relationship VARCHAR(50) NOT NULL,

    date_of_birth DATE,

    gender VARCHAR(20),

    nida_number VARCHAR(50),

    status VARCHAR(30) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 19. HOSPITALS
-- ============================================================

CREATE TABLE hospitals (
    hospital_id SERIAL PRIMARY KEY,

    hospital_name VARCHAR(150) NOT NULL,

    hospital_code VARCHAR(50) UNIQUE,

    location TEXT,

    region VARCHAR(100),

    district VARCHAR(100),

    contact_phone VARCHAR(20),

    license_number VARCHAR(100) UNIQUE,

    status VARCHAR(30) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 20. HEALTHCARE VERIFICATIONS
-- ============================================================

CREATE TABLE healthcare_verifications (
    verification_id SERIAL PRIMARY KEY,

    hospital_id INT NOT NULL
        REFERENCES hospitals(hospital_id),

    member_id INT NOT NULL
        REFERENCES users(user_id),

    verification_method VARCHAR(50) NOT NULL,

    verification_result VARCHAR(50) NOT NULL,

    member_status VARCHAR(30),

    verified_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    remarks TEXT
);


-- ============================================================
-- 21. HEALTHCARE CLAIMS
-- ============================================================

CREATE TABLE healthcare_claims (
    claim_id SERIAL PRIMARY KEY,

    member_id INT NOT NULL
        REFERENCES users(user_id),

    hospital_id INT NOT NULL
        REFERENCES hospitals(hospital_id),

    member_insurance_id INT
        REFERENCES member_insurance(member_insurance_id),

    claim_number VARCHAR(100) UNIQUE NOT NULL,

    claim_amount DECIMAL(15,2) NOT NULL,

    approved_amount DECIMAL(15,2),

    claim_status VARCHAR(30) NOT NULL DEFAULT 'Pending',

    claim_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    processed_date TIMESTAMP,

    remarks TEXT
);


-- ============================================================
-- 22. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,

    member_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    notification_type VARCHAR(50),

    title VARCHAR(150) NOT NULL,

    message TEXT NOT NULL,

    delivery_method VARCHAR(50),

    delivery_status VARCHAR(30),

    sent_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    read_status BOOLEAN NOT NULL DEFAULT FALSE
);


-- ============================================================
-- 23. SESSIONS
-- ============================================================

CREATE TABLE sessions (
    session_id SERIAL PRIMARY KEY,

    member_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    ip_address INET,

    device VARCHAR(150),

    browser VARCHAR(150),

    login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    logout_time TIMESTAMP,

    session_status VARCHAR(30) NOT NULL DEFAULT 'Active'
);


-- ============================================================
-- 24. AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
    audit_id SERIAL PRIMARY KEY,

    member_id INT
        REFERENCES users(user_id),

    action_type VARCHAR(100) NOT NULL,

    affected_table VARCHAR(100),

    affected_record_id INT,

    old_value JSONB,

    new_value JSONB,

    ip_address INET,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 25. PASSWORD RESETS
-- ============================================================

CREATE TABLE password_resets (
    reset_id SERIAL PRIMARY KEY,

    member_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    reset_token TEXT NOT NULL,

    expiry_date TIMESTAMP NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 26. VERIFICATION TOKENS
-- ============================================================

CREATE TABLE verification_tokens (
    verification_token_id SERIAL PRIMARY KEY,

    member_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    token TEXT NOT NULL,

    token_type VARCHAR(50) NOT NULL,

    expiry_date TIMESTAMP NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'Active',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 27. SYSTEM SETTINGS
-- ============================================================

CREATE TABLE system_settings (
    setting_id SERIAL PRIMARY KEY,

    setting_name VARCHAR(100) UNIQUE NOT NULL,

    setting_value TEXT,

    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 28. PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX idx_users_nida
ON users(nida_number);

CREATE INDEX idx_users_email
ON users(email);

CREATE INDEX idx_phone_numbers_user
ON phone_numbers(user_id);

CREATE INDEX idx_phone_numbers_operator
ON phone_numbers(operator_id);

CREATE INDEX idx_telecom_prefix
ON telecom_operator_prefixes(prefix);

CREATE INDEX idx_member_bank_accounts_member
ON member_bank_accounts(member_id);

CREATE INDEX idx_member_bank_accounts_bank
ON member_bank_accounts(bank_id);

CREATE INDEX idx_bank_transactions_account
ON bank_transactions(member_bank_account_id);

CREATE INDEX idx_bank_transactions_date
ON bank_transactions(transaction_date);

CREATE INDEX idx_wallet_transactions_wallet
ON wallet_transactions(wallet_id);

CREATE INDEX idx_wallet_transactions_date
ON wallet_transactions(transaction_date);

CREATE INDEX idx_telecom_contributions_member
ON telecom_contributions(member_id);

CREATE INDEX idx_telecom_contributions_phone
ON telecom_contributions(phone_id);

CREATE INDEX idx_telecom_contributions_date
ON telecom_contributions(contribution_date);

CREATE INDEX idx_healthcare_verifications_member
ON healthcare_verifications(member_id);

CREATE INDEX idx_healthcare_claims_member
ON healthcare_claims(member_id);

CREATE INDEX idx_notifications_member
ON notifications(member_id);

CREATE INDEX idx_audit_logs_member
ON audit_logs(member_id);

CREATE INDEX idx_audit_logs_date
ON audit_logs(created_at);

CREATE INDEX idx_role_permissions_role
ON role_permissions(role_id);


-- ============================================================
-- 29. INITIAL ROLES
-- ============================================================

INSERT INTO roles (role_name, description)
VALUES
    ('Member', 'Normal Tujitunze member'),
    ('Admin', 'System administrator'),
    ('Hospital', 'Authorized healthcare provider'),
    ('Insurance', 'Insurance provider user'),
    ('Bank', 'Authorized bank integration user'),
    ('Telecom', 'Authorized telecom operator user'),
    ('Super-admin', 'Platform owner/operator: system-wide configuration, managing other Admins, integrations');


-- ============================================================
-- 29b. INITIAL PERMISSIONS
-- ============================================================
-- One permission per feature area from each role's route group
-- (see CLAUDE.md roles table). Kept resource-scoped rather than
-- per-verb so the catalog stays small; split a permission into
-- finer verbs only when a real access-control need shows up.

INSERT INTO permissions (permission_name, description)
VALUES
    -- Member (own data only — enforced by ownership checks in the
    -- service layer, not by these permissions)
    ('profile:manage', 'View and edit own profile'),
    ('wallet:manage', 'Manage own health savings wallet'),
    ('member-telecom:manage', 'Link/manage own telecom contribution accounts'),
    ('member-insurance:view', 'View own insurance policies and claims'),
    ('member-hospitals:view', 'Browse partner hospitals'),
    ('notifications:manage', 'View and manage own notifications'),
    ('qr:view', 'View own QR identity code'),
    ('onboarding:manage', 'Complete own onboarding flow'),

    -- Admin
    ('members:manage', 'Manage member accounts platform-wide'),
    ('claims:manage', 'Manage healthcare claims platform-wide'),
    ('transactions:manage', 'Manage wallet/bank/telecom transactions platform-wide'),
    ('partner-hospitals:manage', 'Manage partner hospital records'),
    ('partner-banks:manage', 'Manage partner bank records'),
    ('partner-telecoms:manage', 'Manage partner telecom operator records'),

    -- Hospital (own hospital only — enforced by tenant scoping in
    -- the service layer)
    ('patients:manage', 'Manage own hospital patient records'),
    ('billing:manage', 'Manage own hospital billing'),
    ('appointments:manage', 'Manage own hospital appointments'),
    ('hospital-staff:manage', 'Manage own hospital staff accounts'),

    -- Insurance
    ('plans:manage', 'Manage own insurance plans'),
    ('claims:review', 'Review claims routed to own insurance provider'),

    -- Bank (own bank only)
    ('accounts:manage', 'Manage own bank linked accounts'),
    ('customers:manage', 'Manage own tenant customer records (bank/telecom)'),
    ('transfers:manage', 'Manage own bank transfers'),
    ('reconciliation:manage', 'Run reconciliation for own tenant (bank/telecom)'),

    -- Telecom (own operator only)
    ('payments:manage', 'Manage own telecom operator contribution payments'),
    ('telecom-dashboard:view', 'View own telecom operator dashboard'),

    -- Cross-role
    ('reports:view', 'View reports scoped to own role/tenant'),
    ('settings:manage', 'Manage settings scoped to own role/tenant'),
    ('audit-logs:view', 'View audit log entries'),

    -- Super-admin
    ('administrators:manage', 'Assign/revoke roles for internal staff accounts'),
    ('roles:manage', 'View roles and their permissions'),
    ('permissions:manage', 'Assign/revoke permissions on roles'),
    ('integrations:manage', 'Manage third-party integrations'),
    ('system:manage', 'Manage system-wide configuration');


-- ============================================================
-- 29c. INITIAL ROLE PERMISSIONS
-- ============================================================

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM (VALUES
    ('Member', 'profile:manage'),
    ('Member', 'wallet:manage'),
    ('Member', 'member-telecom:manage'),
    ('Member', 'member-insurance:view'),
    ('Member', 'member-hospitals:view'),
    ('Member', 'reports:view'),
    ('Member', 'notifications:manage'),
    ('Member', 'settings:manage'),
    ('Member', 'qr:view'),
    ('Member', 'onboarding:manage'),

    ('Admin', 'members:manage'),
    ('Admin', 'claims:manage'),
    ('Admin', 'transactions:manage'),
    ('Admin', 'partner-hospitals:manage'),
    ('Admin', 'partner-banks:manage'),
    ('Admin', 'partner-telecoms:manage'),
    ('Admin', 'reports:view'),
    ('Admin', 'audit-logs:view'),
    ('Admin', 'settings:manage'),

    ('Hospital', 'patients:manage'),
    ('Hospital', 'claims:manage'),
    ('Hospital', 'billing:manage'),
    ('Hospital', 'appointments:manage'),
    ('Hospital', 'hospital-staff:manage'),
    ('Hospital', 'reports:view'),
    ('Hospital', 'settings:manage'),

    ('Insurance', 'plans:manage'),
    ('Insurance', 'claims:review'),
    ('Insurance', 'reports:view'),
    ('Insurance', 'settings:manage'),

    ('Bank', 'accounts:manage'),
    ('Bank', 'customers:manage'),
    ('Bank', 'transactions:manage'),
    ('Bank', 'transfers:manage'),
    ('Bank', 'reconciliation:manage'),
    ('Bank', 'reports:view'),
    ('Bank', 'settings:manage'),

    ('Telecom', 'customers:manage'),
    ('Telecom', 'transactions:manage'),
    ('Telecom', 'payments:manage'),
    ('Telecom', 'reconciliation:manage'),
    ('Telecom', 'reports:view'),
    ('Telecom', 'telecom-dashboard:view'),
    ('Telecom', 'settings:manage'),

    ('Super-admin', 'administrators:manage'),
    ('Super-admin', 'roles:manage'),
    ('Super-admin', 'permissions:manage'),
    ('Super-admin', 'integrations:manage'),
    ('Super-admin', 'system:manage'),
    ('Super-admin', 'audit-logs:view'),
    ('Super-admin', 'settings:manage')
) AS seed(role_name, permission_name)
JOIN roles r ON r.role_name = seed.role_name
JOIN permissions p ON p.permission_name = seed.permission_name;


-- ============================================================
-- 30. INITIAL TELECOM OPERATORS
-- ============================================================

INSERT INTO telecom_operators
    (operator_name, country_code)
VALUES
    ('Vodacom', '255'),
    ('Airtel', '255'),
    ('Tigo', '255'),
    ('Halotel', '255'),
    ('TTCL', '255');


-- ============================================================
-- 30b. INITIAL TELECOM OPERATOR PREFIXES
-- ============================================================
-- Maps Tanzanian mobile number prefixes to operators, used by
-- registration to attribute a new phone number to its operator.
-- Prefixes below are a best-effort reference set and should be
-- verified/updated against the current TCRA numbering plan.

INSERT INTO telecom_operator_prefixes
    (operator_id, prefix, country_code, prefix_type)
VALUES
    ((SELECT operator_id FROM telecom_operators WHERE operator_name = 'Vodacom'), '074', '255', 'Mobile'),
    ((SELECT operator_id FROM telecom_operators WHERE operator_name = 'Vodacom'), '075', '255', 'Mobile'),
    ((SELECT operator_id FROM telecom_operators WHERE operator_name = 'Vodacom'), '076', '255', 'Mobile'),
    ((SELECT operator_id FROM telecom_operators WHERE operator_name = 'Tigo'), '071', '255', 'Mobile'),
    ((SELECT operator_id FROM telecom_operators WHERE operator_name = 'Tigo'), '065', '255', 'Mobile'),
    ((SELECT operator_id FROM telecom_operators WHERE operator_name = 'Tigo'), '067', '255', 'Mobile'),
    ((SELECT operator_id FROM telecom_operators WHERE operator_name = 'Airtel'), '078', '255', 'Mobile'),
    ((SELECT operator_id FROM telecom_operators WHERE operator_name = 'Airtel'), '068', '255', 'Mobile'),
    ((SELECT operator_id FROM telecom_operators WHERE operator_name = 'Airtel'), '069', '255', 'Mobile'),
    ((SELECT operator_id FROM telecom_operators WHERE operator_name = 'Halotel'), '061', '255', 'Mobile'),
    ((SELECT operator_id FROM telecom_operators WHERE operator_name = 'Halotel'), '062', '255', 'Mobile'),
    ((SELECT operator_id FROM telecom_operators WHERE operator_name = 'TTCL'), '073', '255', 'Mobile');


-- ============================================================
-- 31. INITIAL BANKS
-- ============================================================
-- These are initial records. They can be expanded later.

INSERT INTO banks
    (bank_name, bank_code, country_code)
VALUES
    ('CRDB Bank', 'CRDB', '255'),
    ('NMB Bank', 'NMB', '255'),
    ('NBC Bank', 'NBC', '255'),
    ('Absa Bank Tanzania', 'ABSA', '255'),
    ('Stanbic Bank Tanzania', 'STANBIC', '255'),
    ('Standard Chartered Bank Tanzania', 'SCB', '255'),
    ('Exim Bank Tanzania', 'EXIM', '255'),
    ('NCBA Bank Tanzania', 'NCBA', '255'),
    ('TPB Bank', 'TPB', '255'),
    ('KCB Bank Tanzania', 'KCB', '255');


-- ============================================================
-- 32. INITIAL SYSTEM SETTINGS
-- ============================================================

INSERT INTO system_settings
    (setting_name, setting_value)
VALUES
    ('system_name', 'Tujitunze'),
    ('system_description', 'Health Savings and Insurance Management System'),
    ('health_contribution_amount', '50.00'),
    ('default_currency', 'TZS');


-- ============================================================
-- END OF TUJITUNZE / HSIMS DATABASE SCHEMA
-- ============================================================
