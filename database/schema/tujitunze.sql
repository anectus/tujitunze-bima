-- ============================================================
-- TUJITUNZE / HSIMS
-- HEALTH SAVINGS AND INSURANCE MANAGEMENT SYSTEM
-- PostgreSQL DATABASE SCHEMA
-- ============================================================

-- ============================================================
-- 1. USERS
-- ============================================================

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    second_name VARCHAR(50),
    surname VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    nida_number VARCHAR(20) UNIQUE NOT NULL,
    gender VARCHAR(20),
    date_of_birth DATE,
    address TEXT,
    region VARCHAR(100),
    district VARCHAR(100),
    password_hash TEXT NOT NULL,
    member_status VARCHAR(20) DEFAULT 'Pending',
    email_verified BOOLEAN DEFAULT FALSE,
    phone_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 2. ROLES
-- ============================================================

CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 3. USER ROLES
-- ============================================================

CREATE TABLE user_roles (
    user_role_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    role_id INT NOT NULL
        REFERENCES roles(role_id)
        ON DELETE CASCADE,
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, role_id)
);


-- ============================================================
-- 4. TELECOM OPERATORS
-- ============================================================

CREATE TABLE telecom_operators (
    operator_id SERIAL PRIMARY KEY,
    operator_name VARCHAR(100) UNIQUE NOT NULL,
    country_code VARCHAR(10) DEFAULT '255',
    api_endpoint TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 5. TELECOM OPERATOR CODES
-- Example:
-- Vodacom = VODA
-- Airtel  = AIRT
-- Tigo    = TIGO
-- ============================================================

CREATE TABLE telecom_operator_codes (
    operator_code_id SERIAL PRIMARY KEY,
    operator_id INT NOT NULL
        REFERENCES telecom_operators(operator_id)
        ON DELETE CASCADE,
    operator_code VARCHAR(50) NOT NULL,
    code_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(operator_id, operator_code)
);


-- ============================================================
-- 6. TELECOM OPERATOR PREFIXES
-- Example Vodacom:
-- 071, 074, 075, 076
-- ============================================================

CREATE TABLE telecom_operator_prefixes (
    prefix_id SERIAL PRIMARY KEY,
    operator_id INT NOT NULL
        REFERENCES telecom_operators(operator_id)
        ON DELETE CASCADE,
    prefix VARCHAR(10) NOT NULL,
    country_code VARCHAR(10) DEFAULT '255',
    prefix_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(operator_id, prefix)
);


-- ============================================================
-- 7. TELECOM OPERATOR CONTACTS
-- ============================================================

CREATE TABLE telecom_operator_contacts (
    contact_id SERIAL PRIMARY KEY,
    operator_id INT NOT NULL
        REFERENCES telecom_operators(operator_id)
        ON DELETE CASCADE,
    contact_type VARCHAR(30) NOT NULL,
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(operator_id, contact_type, contact_phone)
);


-- ============================================================
-- 8. PHONE NUMBERS
-- ============================================================

CREATE TABLE phone_numbers (
    phone_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    operator_id INT NOT NULL
        REFERENCES telecom_operators(operator_id),
    phone_number VARCHAR(20) UNIQUE NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    phone_status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 9. HEALTH WALLET
-- ============================================================

CREATE TABLE health_wallet (
    wallet_id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    wallet_number VARCHAR(50) UNIQUE NOT NULL,
    balance DECIMAL(15,2) DEFAULT 0.00,
    wallet_status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 10. BANKS
-- ============================================================

CREATE TABLE banks (
    bank_id SERIAL PRIMARY KEY,
    bank_name VARCHAR(100) UNIQUE NOT NULL,
    api_endpoint TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 11. BANK CODES
-- ============================================================

CREATE TABLE bank_codes (
    bank_code_id SERIAL PRIMARY KEY,
    bank_id INT NOT NULL
        REFERENCES banks(bank_id)
        ON DELETE CASCADE,
    bank_code VARCHAR(50) NOT NULL,
    code_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bank_id, bank_code)
);


-- ============================================================
-- 12. BANK ACCOUNT PREFIXES
-- ============================================================

CREATE TABLE bank_account_prefixes (
    prefix_id SERIAL PRIMARY KEY,
    bank_id INT NOT NULL
        REFERENCES banks(bank_id)
        ON DELETE CASCADE,
    prefix VARCHAR(20) NOT NULL,
    prefix_length INT NOT NULL,
    prefix_type VARCHAR(50),
    description TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bank_id, prefix)
);


-- ============================================================
-- 13. BANK CONTACTS
-- ============================================================

CREATE TABLE bank_contacts (
    contact_id SERIAL PRIMARY KEY,
    bank_id INT NOT NULL
        REFERENCES banks(bank_id)
        ON DELETE CASCADE,
    contact_type VARCHAR(30) NOT NULL,
    contact_name VARCHAR(100),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bank_id, contact_type, contact_phone)
);


-- ============================================================
-- 14. BANK BRANCHES
-- ============================================================

CREATE TABLE bank_branches (
    branch_id SERIAL PRIMARY KEY,
    bank_id INT NOT NULL
        REFERENCES banks(bank_id)
        ON DELETE CASCADE,
    branch_code VARCHAR(20) NOT NULL,
    branch_name VARCHAR(150) NOT NULL,
    region VARCHAR(100),
    district VARCHAR(100),
    location TEXT,
    contact_phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(bank_id, branch_code)
);


-- ============================================================
-- 15. BANK ACCOUNTS
-- ============================================================

CREATE TABLE bank_accounts (
    account_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    bank_id INT NOT NULL
        REFERENCES banks(bank_id),
    branch_id INT
        REFERENCES bank_branches(branch_id),
    account_number VARCHAR(50) UNIQUE NOT NULL,
    account_holder_name VARCHAR(150) NOT NULL,
    account_type VARCHAR(50),
    account_status VARCHAR(20) DEFAULT 'Active',
    linked_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 16. BANK TRANSACTIONS
-- ============================================================

CREATE TABLE bank_transactions (
    bank_transaction_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL
        REFERENCES bank_accounts(account_id)
        ON DELETE CASCADE,
    transaction_reference VARCHAR(100) UNIQUE NOT NULL,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_status VARCHAR(20) DEFAULT 'Completed',
    transaction_date TIMESTAMP NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 17. TELECOM CONTRIBUTIONS
-- ============================================================

CREATE TABLE telecom_contributions (
    contribution_id SERIAL PRIMARY KEY,
    operator_id INT NOT NULL
        REFERENCES telecom_operators(operator_id),
    phone_id INT NOT NULL
        REFERENCES phone_numbers(phone_id),
    contribution_amount DECIMAL(15,2) NOT NULL,
    contribution_source VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100) UNIQUE,
    processing_status VARCHAR(20) DEFAULT 'Pending',
    contribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 18. WALLET TRANSACTIONS
-- ============================================================

CREATE TABLE wallet_transactions (
    wallet_transaction_id SERIAL PRIMARY KEY,
    wallet_id INT NOT NULL
        REFERENCES health_wallet(wallet_id),
    contribution_id INT
        REFERENCES telecom_contributions(contribution_id),
    bank_transaction_id INT
        REFERENCES bank_transactions(bank_transaction_id),
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    transaction_reference VARCHAR(100) UNIQUE,
    remarks TEXT,
    transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 20. HEALTHCARE VERIFICATIONS
-- ============================================================

CREATE TABLE healthcare_verifications (
    verification_id SERIAL PRIMARY KEY,
    hospital_id INT NOT NULL
        REFERENCES hospitals(hospital_id),
    user_id INT NOT NULL
        REFERENCES users(user_id),
    verification_method VARCHAR(50) NOT NULL,
    verification_result VARCHAR(50) NOT NULL,
    member_status VARCHAR(20),
    verified_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT
);


-- ============================================================
-- 21. INSURANCE PROVIDERS
-- ============================================================

CREATE TABLE insurance_providers (
    provider_id SERIAL PRIMARY KEY,
    provider_name VARCHAR(150) UNIQUE NOT NULL,
    license_number VARCHAR(100) UNIQUE,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(100),
    address TEXT,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 22. INSURANCE PLANS
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
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 23. USER INSURANCE
-- ============================================================

CREATE TABLE user_insurance (
    user_insurance_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    plan_id INT NOT NULL
        REFERENCES insurance_plans(plan_id),
    policy_number VARCHAR(100) UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    policy_status VARCHAR(30) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 24. DEPENDENTS
-- ============================================================

CREATE TABLE dependents (
    dependent_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    first_name VARCHAR(50) NOT NULL,
    second_name VARCHAR(50),
    surname VARCHAR(50) NOT NULL,
    relationship VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    nida_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 25. HEALTHCARE CLAIMS
-- ============================================================

CREATE TABLE healthcare_claims (
    claim_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL
        REFERENCES users(user_id),
    hospital_id INT NOT NULL
        REFERENCES hospitals(hospital_id),
    user_insurance_id INT
        REFERENCES user_insurance(user_insurance_id),
    claim_number VARCHAR(100) UNIQUE NOT NULL,
    claim_amount DECIMAL(15,2) NOT NULL,
    approved_amount DECIMAL(15,2),
    claim_status VARCHAR(30) DEFAULT 'Pending',
    claim_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_date TIMESTAMP,
    remarks TEXT
);


-- ============================================================
-- 26. NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    notification_type VARCHAR(50),
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    delivery_method VARCHAR(50),
    delivery_status VARCHAR(20),
    sent_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_status BOOLEAN DEFAULT FALSE
);


-- ============================================================
-- 27. SESSIONS
-- ============================================================

CREATE TABLE sessions (
    session_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    ip_address INET,
    device VARCHAR(100),
    browser VARCHAR(100),
    login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    logout_time TIMESTAMP,
    session_status VARCHAR(20) DEFAULT 'Active'
);


-- ============================================================
-- 28. AUDIT LOGS
-- ============================================================

CREATE TABLE audit_logs (
    audit_id SERIAL PRIMARY KEY,
    user_id INT
        REFERENCES users(user_id),
    action_type VARCHAR(100) NOT NULL,
    affected_table VARCHAR(100),
    affected_record_id INT,
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 29. PASSWORD RESETS
-- ============================================================

CREATE TABLE password_resets (
    reset_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    reset_token TEXT NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 30. VERIFICATION TOKENS
-- ============================================================

CREATE TABLE verification_tokens (
    verification_token_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL
        REFERENCES users(user_id)
        ON DELETE CASCADE,
    token TEXT NOT NULL,
    token_type VARCHAR(50) NOT NULL,
    expiry_date TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 31. SYSTEM SETTINGS
-- ============================================================

CREATE TABLE system_settings (
    setting_id SERIAL PRIMARY KEY,
    setting_name VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ============================================================
-- 32. PERFORMANCE INDEXES
-- ============================================================

CREATE INDEX idx_users_nida
ON users(nida_number);

CREATE INDEX idx_users_email
ON users(email);

CREATE INDEX idx_phone_numbers_number
ON phone_numbers(phone_number);

CREATE INDEX idx_phone_numbers_user
ON phone_numbers(user_id);

CREATE INDEX idx_phone_numbers_operator
ON phone_numbers(operator_id);

CREATE INDEX idx_telecom_prefix
ON telecom_operator_prefixes(prefix);

CREATE INDEX idx_bank_accounts_user
ON bank_accounts(user_id);

CREATE INDEX idx_bank_accounts_bank
ON bank_accounts(bank_id);

CREATE INDEX idx_bank_transactions_account
ON bank_transactions(account_id);

CREATE INDEX idx_bank_transactions_date
ON bank_transactions(transaction_date);

CREATE INDEX idx_wallet_transactions_wallet
ON wallet_transactions(wallet_id);

CREATE INDEX idx_wallet_transactions_date
ON wallet_transactions(transaction_date);

CREATE INDEX idx_contributions_phone
ON telecom_contributions(phone_id);

CREATE INDEX idx_contributions_date
ON telecom_contributions(contribution_date);

CREATE INDEX idx_verifications_user
ON healthcare_verifications(user_id);

CREATE INDEX idx_claims_user
ON healthcare_claims(user_id);

CREATE INDEX idx_notifications_user
ON notifications(user_id);

CREATE INDEX idx_audit_logs_user
ON audit_logs(user_id);

CREATE INDEX idx_audit_logs_date
ON audit_logs(created_at);


-- ============================================================
-- 33. INITIAL ROLES
-- ============================================================

INSERT INTO roles (role_name, description)
VALUES
    ('Member', 'Normal HSIMS member'),
    ('Admin', 'System administrator'),
    ('Hospital', 'Authorized healthcare provider'),
    ('Insurance', 'Insurance provider user'),
    ('Bank', 'Authorized bank integration user'),
    ('Telecom', 'Authorized telecom operator user');


-- ============================================================
-- 34. INITIAL TELECOM OPERATORS
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
-- 35. INITIAL TELECOM CODES
-- ============================================================

INSERT INTO telecom_operator_codes
    (operator_id, operator_code, code_type)
SELECT operator_id, 'VODA', 'Internal Code'
FROM telecom_operators
WHERE operator_name = 'Vodacom';

INSERT INTO telecom_operator_codes
    (operator_id, operator_code, code_type)
SELECT operator_id, 'AIRT', 'Internal Code'
FROM telecom_operators
WHERE operator_name = 'Airtel';

INSERT INTO telecom_operator_codes
    (operator_id, operator_code, code_type)
SELECT operator_id, 'TIGO', 'Internal Code'
FROM telecom_operators
WHERE operator_name = 'Tigo';


-- ============================================================
-- 36. INITIAL VODACOM PREFIXES
-- ============================================================

INSERT INTO telecom_operator_prefixes
    (operator_id, prefix, country_code, prefix_type)
SELECT operator_id, '071', '255', 'Mobile Prefix'
FROM telecom_operators
WHERE operator_name = 'Vodacom';

INSERT INTO telecom_operator_prefixes
    (operator_id, prefix, country_code, prefix_type)
SELECT operator_id, '074', '255', 'Mobile Prefix'
FROM telecom_operators
WHERE operator_name = 'Vodacom';

INSERT INTO telecom_operator_prefixes
    (operator_id, prefix, country_code, prefix_type)
SELECT operator_id, '075', '255', 'Mobile Prefix'
FROM telecom_operators
WHERE operator_name = 'Vodacom';

INSERT INTO telecom_operator_prefixes
    (operator_id, prefix, country_code, prefix_type)
SELECT operator_id, '076', '255', 'Mobile Prefix'
FROM telecom_operators
WHERE operator_name = 'Vodacom';


-- ============================================================
-- END OF HSIMS DATABASE SCHEMA
-- ============================================================
