-- =============================================
-- VEVURN POS SYSTEM - COMPLETE DATABASE SCHEMA
-- Production-Ready Enhanced Architecture
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- 1. AUTHENTICATION & STAFF MANAGEMENT
-- =============================================

CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clerk_user_id VARCHAR UNIQUE NOT NULL,
    employee_id VARCHAR UNIQUE NOT NULL,
    
    -- Personal Information
    first_name VARCHAR NOT NULL,
    last_name VARCHAR NOT NULL,
    email VARCHAR UNIQUE NOT NULL,
    phone VARCHAR,
    profile_image_url VARCHAR,
    
    -- Role & Permissions
    role VARCHAR NOT NULL CHECK (role IN ('cashier', 'supervisor', 'manager', 'admin')),
    permissions JSONB DEFAULT '[]'::jsonb,
    
    -- Employment Details
    hire_date DATE NOT NULL,
    salary DECIMAL(10,2),
    commission_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Authentication & Security
    mfa_enabled BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP,
    login_count INTEGER DEFAULT 0,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    password_changed_at TIMESTAMP,
    
    -- Status & Tracking
    is_active BOOLEAN DEFAULT true,
    shift_start_time TIME,
    shift_end_time TIME,
    current_session_id VARCHAR,
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES staff(id),
    updated_by UUID REFERENCES staff(id),
    version INTEGER DEFAULT 1
);

-- Indexes for staff
CREATE INDEX idx_staff_clerk_id ON staff(clerk_user_id);
CREATE INDEX idx_staff_employee_id ON staff(employee_id);
CREATE INDEX idx_staff_role ON staff(role);
CREATE INDEX idx_staff_active ON staff(is_active);
CREATE INDEX idx_staff_session ON staff(current_session_id);

-- Staff permissions table
CREATE TABLE staff_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
    resource VARCHAR NOT NULL,
    actions JSONB NOT NULL,
    conditions JSONB,
    granted_by UUID REFERENCES staff(id),
    granted_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    
    UNIQUE(staff_id, resource)
);

CREATE INDEX idx_staff_perms_staff ON staff_permissions(staff_id);
CREATE INDEX idx_staff_perms_resource ON staff_permissions(resource);

-- =============================================
-- 2. SUPPLIERS MANAGEMENT
-- =============================================

CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    contact_person VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    address TEXT,
    
    -- Business Details
    tax_id VARCHAR,
    payment_terms INTEGER DEFAULT 30, -- Days
    discount_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES staff(id),
    updated_by UUID REFERENCES staff(id)
);

CREATE INDEX idx_suppliers_name ON suppliers(name);
CREATE INDEX idx_suppliers_active ON suppliers(is_active);

-- =============================================
-- 3. ENHANCED PRODUCTS WITH INVENTORY
-- =============================================

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE GENERATED ALWAYS AS (LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]+', '-', 'g'))) STORED,
    description TEXT,
    category VARCHAR NOT NULL,
    subcategory VARCHAR,
    brand VARCHAR,
    model VARCHAR,
    
    -- Identification
    sku VARCHAR UNIQUE,
    barcode VARCHAR,
    internal_code VARCHAR UNIQUE,
    
    -- Pricing (Multi-Currency)
    cost_price_rwf DECIMAL(10,2) CHECK (cost_price_rwf >= 0),
    selling_price_rwf DECIMAL(10,2) CHECK (selling_price_rwf >= 0),
    wholesale_price_rwf DECIMAL(10,2) CHECK (wholesale_price_rwf >= 0),
    cost_price_usd DECIMAL(10,2) CHECK (cost_price_usd >= 0),
    selling_price_usd DECIMAL(10,2) CHECK (selling_price_usd >= 0),
    wholesale_price_usd DECIMAL(10,2) CHECK (wholesale_price_usd >= 0),
    cost_price_eur DECIMAL(10,2) CHECK (cost_price_eur >= 0),
    selling_price_eur DECIMAL(10,2) CHECK (selling_price_eur >= 0),
    wholesale_price_eur DECIMAL(10,2) CHECK (wholesale_price_eur >= 0),
    
    -- Mobile Accessories Specific
    variations JSONB DEFAULT '{}'::jsonb,
    specifications JSONB DEFAULT '{}'::jsonb,
    compatibility JSONB DEFAULT '{}'::jsonb,
    
    -- Media
    images TEXT[] DEFAULT '{}',
    primary_image VARCHAR,
    videos TEXT[] DEFAULT '{}',
    
    -- Inventory Management
    stock_quantity INTEGER DEFAULT 0 CHECK (stock_quantity >= 0),
    reserved_quantity INTEGER DEFAULT 0 CHECK (reserved_quantity >= 0),
    available_quantity INTEGER GENERATED ALWAYS AS (stock_quantity - reserved_quantity) STORED,
    low_stock_threshold INTEGER DEFAULT 5 CHECK (low_stock_threshold >= 0),
    reorder_point INTEGER DEFAULT 10 CHECK (reorder_point >= 0),
    max_stock_level INTEGER,
    
    -- Supplier Information
    supplier_id UUID REFERENCES suppliers(id),
    supplier_sku VARCHAR,
    lead_time_days INTEGER DEFAULT 7,
    
    -- Product Lifecycle
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_trackable BOOLEAN DEFAULT true,
    
    -- SEO & Marketing
    meta_title VARCHAR,
    meta_description TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Audit Fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES staff(id),
    updated_by UUID REFERENCES staff(id),
    version INTEGER DEFAULT 1,
    
    -- Constraints
    CONSTRAINT positive_prices CHECK (
        (cost_price_rwf IS NULL OR cost_price_rwf >= 0) AND
        (selling_price_rwf IS NULL OR selling_price_rwf >= 0) AND
        (wholesale_price_rwf IS NULL OR wholesale_price_rwf >= 0)
    ),
    CONSTRAINT stock_consistency CHECK (reserved_quantity <= stock_quantity)
);

-- Product indexes
CREATE INDEX idx_products_category ON products(category, is_active);
CREATE INDEX idx_products_stock ON products(stock_quantity);
CREATE INDEX idx_products_low_stock ON products(low_stock_threshold, stock_quantity);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_supplier ON products(supplier_id);
CREATE INDEX idx_products_featured ON products(is_featured, is_active);

-- Full-text search index
CREATE INDEX idx_products_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(category, '') || ' ' || COALESCE(brand, '') || ' ' || COALESCE(model, '')));

-- =============================================
-- 4. CUSTOMERS MANAGEMENT
-- =============================================

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Personal Information
    name VARCHAR NOT NULL,
    phone VARCHAR,
    email VARCHAR,
    address TEXT,
    
    -- Business Information
    company_name VARCHAR,
    tax_id VARCHAR,
    
    -- Preferences
    preferred_currency VARCHAR DEFAULT 'RWF' CHECK (preferred_currency IN ('RWF', 'USD', 'EUR')),
    
    -- Customer Type
    customer_type VARCHAR DEFAULT 'retail' CHECK (customer_type IN ('retail', 'wholesale', 'corporate')),
    credit_limit DECIMAL(12,2) DEFAULT 0,
    
    -- Photos and Documentation
    photos TEXT[] DEFAULT '{}',
    documents JSONB DEFAULT '{}'::jsonb,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Statistics (computed fields)
    total_purchases DECIMAL(12,2) DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    last_purchase_date TIMESTAMP,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID REFERENCES staff(id)
);

-- Customer indexes
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_customers_name ON customers USING gin(name gin_trgm_ops);

-- =============================================
-- 5. ENHANCED SALES SYSTEM
-- =============================================

CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic Information
    customer_id UUID REFERENCES customers(id),
    staff_id UUID NOT NULL REFERENCES staff(id),
    
    -- Payment Information
    payment_method VARCHAR NOT NULL CHECK (payment_method IN ('cash', 'bank', 'momo')),
    currency VARCHAR DEFAULT 'RWF' CHECK (currency IN ('RWF', 'USD', 'EUR')),
    
    -- MTN MoMo Integration Fields
    momo_external_id VARCHAR UNIQUE,
    momo_transaction_id VARCHAR,
    momo_request_id VARCHAR,
    momo_payer_phone VARCHAR,
    momo_payer_message TEXT,
    momo_payee_note TEXT,
    momo_callback_data JSONB,
    
    -- Financial Fields
    subtotal DECIMAL(12,2) NOT NULL CHECK (subtotal >= 0),
    tax_amount DECIMAL(12,2) DEFAULT 0 CHECK (tax_amount >= 0),
    discount_amount DECIMAL(12,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_amount DECIMAL(12,2) NOT NULL CHECK (total_amount >= 0),
    cost_amount DECIMAL(12,2) NOT NULL CHECK (cost_amount >= 0),
    profit DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - cost_amount) STORED,
    exchange_rate DECIMAL(10,4),
    
    -- Status and Tracking
    status VARCHAR DEFAULT 'completed' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
    payment_status VARCHAR DEFAULT 'completed' CHECK (payment_status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    
    -- Receipt Information
    receipt_number VARCHAR UNIQUE NOT NULL,
    receipt_pdf_url VARCHAR,
    
    -- Transaction Metadata
    transaction_hash VARCHAR,
    processed_by_system VARCHAR DEFAULT 'pos',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    cancelled_at TIMESTAMP,
    
    -- Audit Fields
    created_by UUID NOT NULL REFERENCES staff(id),
    updated_by UUID REFERENCES staff(id),
    version INTEGER DEFAULT 1,
    
    -- Additional Information
    notes TEXT,
    tags TEXT[],
    
    -- Constraints
    CONSTRAINT valid_amounts CHECK (
        subtotal >= 0 AND 
        total_amount >= 0 AND 
        cost_amount >= 0 AND
        total_amount = (subtotal + tax_amount - discount_amount)
    ),
    CONSTRAINT completed_sale_requirements CHECK (
        (status = 'completed' AND completed_at IS NOT NULL) OR 
        (status != 'completed')
    )
);

-- Sales indexes
CREATE INDEX idx_sales_created_desc ON sales(created_at DESC);
CREATE INDEX idx_sales_staff_date ON sales(staff_id, DATE(created_at));
CREATE INDEX idx_sales_customer_date ON sales(customer_id, created_at DESC);
CREATE INDEX idx_sales_payment_status ON sales(payment_status, created_at DESC);
CREATE INDEX idx_sales_momo_external ON sales(momo_external_id);
CREATE INDEX idx_sales_receipt ON sales(receipt_number);
CREATE INDEX idx_sales_status ON sales(status);
CREATE INDEX idx_sales_amount_date ON sales(total_amount, created_at DESC);

-- Sale items table
CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Item Details at Time of Sale
    product_name VARCHAR NOT NULL,
    product_sku VARCHAR,
    category VARCHAR NOT NULL,
    
    -- Pricing
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_cost DECIMAL(10,2) NOT NULL CHECK (unit_cost >= 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    discount_amount DECIMAL(10,2) DEFAULT 0 CHECK (discount_amount >= 0),
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    total_price DECIMAL(10,2) GENERATED ALWAYS AS ((quantity * unit_price) - discount_amount) STORED,
    profit DECIMAL(10,2) GENERATED ALWAYS AS (total_price - total_cost) STORED,
    
    -- Product Variations at Time of Sale
    variations JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE INDEX idx_sale_items_category_date ON sale_items(category, created_at DESC);

-- =============================================
-- 6. INVENTORY MANAGEMENT
-- =============================================

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    
    -- Movement Details
    movement_type VARCHAR NOT NULL CHECK (movement_type IN (
        'sale', 'return', 'purchase', 'adjustment', 'transfer', 
        'damaged', 'expired', 'reservation', 'release'
    )),
    quantity INTEGER NOT NULL,
    
    -- Stock Levels
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    
    -- Reference Information
    reference_type VARCHAR,
    reference_id UUID,
    
    -- Context
    reason TEXT,
    notes TEXT,
    location VARCHAR DEFAULT 'main_store',
    
    -- Staff & Audit
    staff_id UUID NOT NULL REFERENCES staff(id),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Verification
    verified_by UUID REFERENCES staff(id),
    verified_at TIMESTAMP,
    
    -- Constraints
    CONSTRAINT movement_calculation CHECK (new_quantity = previous_quantity + quantity)
);

CREATE INDEX idx_inventory_product_date ON inventory_movements(product_id, created_at DESC);
CREATE INDEX idx_inventory_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_reference ON inventory_movements(reference_type, reference_id);
CREATE INDEX idx_inventory_staff ON inventory_movements(staff_id, created_at DESC);

-- Stock alerts
CREATE TABLE stock_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id),
    
    alert_type VARCHAR NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock')),
    current_stock INTEGER NOT NULL,
    threshold_value INTEGER NOT NULL,
    
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
    
    created_at TIMESTAMP DEFAULT NOW(),
    acknowledged_at TIMESTAMP,
    acknowledged_by UUID REFERENCES staff(id),
    resolved_at TIMESTAMP
);

CREATE INDEX idx_stock_alerts_product ON stock_alerts(product_id);
CREATE INDEX idx_stock_alerts_status ON stock_alerts(status, created_at DESC);
CREATE INDEX idx_stock_alerts_type ON stock_alerts(alert_type);

-- =============================================
-- 7. LOAN MANAGEMENT
-- =============================================

CREATE TABLE loans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    staff_id UUID NOT NULL REFERENCES staff(id),
    
    -- Loan Details
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR DEFAULT 'RWF' CHECK (currency IN ('RWF', 'USD', 'EUR')),
    interest_rate DECIMAL(5,4) DEFAULT 0,
    
    -- Payment Information
    amount_paid DECIMAL(12,2) DEFAULT 0 CHECK (amount_paid >= 0),
    balance DECIMAL(12,2) GENERATED ALWAYS AS (amount - amount_paid) STORED,
    
    -- Dates
    loan_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    -- Status
    status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'paid', 'overdue', 'written_off')),
    
    -- Documentation
    photos TEXT[] DEFAULT '{}',
    collateral_description TEXT,
    notes TEXT,
    
    -- Audit
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES staff(id)
);

CREATE INDEX idx_loans_customer ON loans(customer_id);
CREATE INDEX idx_loans_status ON loans(status);
CREATE INDEX idx_loans_due_date ON loans(due_date);
CREATE INDEX idx_loans_overdue ON loans(due_date) WHERE status = 'active' AND due_date < CURRENT_DATE;

-- Loan payments
CREATE TABLE loan_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    loan_id UUID NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
    
    amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
    payment_date DATE NOT NULL,
    payment_method VARCHAR NOT NULL CHECK (payment_method IN ('cash', 'bank', 'momo')),
    
    notes TEXT,
    
    -- Staff
    received_by UUID NOT NULL REFERENCES staff(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_loan_payments_loan ON loan_payments(loan_id);
CREATE INDEX idx_loan_payments_date ON loan_payments(payment_date DESC);

-- =============================================
-- 8. AUDIT AND SECURITY
-- =============================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Who & When
    user_id UUID REFERENCES staff(id),
    user_email VARCHAR,
    session_id VARCHAR,
    
    -- What & Where
    action VARCHAR NOT NULL,
    table_name VARCHAR NOT NULL,
    record_id UUID,
    
    -- Data Changes
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR,
    endpoint VARCHAR,
    
    -- Business Context
    business_context JSONB,
    risk_level VARCHAR DEFAULT 'low' CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW()
);

-- Partition audit_logs by month for better performance
CREATE INDEX idx_audit_user_date ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_table_action ON audit_logs(table_name, action);
CREATE INDEX idx_audit_record_id ON audit_logs(record_id);
CREATE INDEX idx_audit_risk ON audit_logs(risk_level, created_at DESC);
CREATE INDEX idx_audit_session ON audit_logs(session_id);
CREATE INDEX idx_audit_ip ON audit_logs(ip_address);

-- Authentication events
CREATE TABLE auth_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id UUID REFERENCES staff(id),
    clerk_user_id VARCHAR,
    
    event_type VARCHAR NOT NULL CHECK (event_type IN (
        'login_success', 'login_failed', 'logout', 'password_change',
        'mfa_enabled', 'mfa_disabled', 'account_locked', 'session_expired'
    )),
    
    ip_address INET,
    user_agent TEXT,
    device_info JSONB,
    location_info JSONB,
    
    success BOOLEAN,
    failure_reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_auth_events_staff_date ON auth_events(staff_id, created_at DESC);
CREATE INDEX idx_auth_events_type ON auth_events(event_type);
CREATE INDEX idx_auth_events_ip ON auth_events(ip_address);
CREATE INDEX idx_auth_events_success ON auth_events(success, created_at DESC);

-- Security events
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event Details
    event_type VARCHAR NOT NULL CHECK (event_type IN (
        'failed_login', 'account_locked', 'suspicious_activity', 
        'rate_limit_exceeded', 'unauthorized_access_attempt',
        'data_breach_attempt', 'privilege_escalation_attempt'
    )),
    severity VARCHAR NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    
    -- User Context
    staff_id UUID REFERENCES staff(id),
    ip_address INET NOT NULL,
    user_agent TEXT,
    session_id VARCHAR,
    
    -- Request Context
    endpoint VARCHAR,
    method VARCHAR,
    payload_hash VARCHAR,
    
    -- Detection Details
    detection_method VARCHAR,
    confidence_score DECIMAL(3,2),
    
    -- Response Taken
    action_taken VARCHAR,
    auto_resolved BOOLEAN DEFAULT false,
    
    -- Investigation
    investigated_by UUID REFERENCES staff(id),
    investigation_notes TEXT,
    false_positive BOOLEAN,
    
    created_at TIMESTAMP DEFAULT NOW(),
    resolved_at TIMESTAMP
);

CREATE INDEX idx_security_events_type_date ON security_events(event_type, created_at DESC);
CREATE INDEX idx_security_events_severity ON security_events(severity, created_at DESC);
CREATE INDEX idx_security_events_ip ON security_events(ip_address, created_at DESC);
CREATE INDEX idx_security_events_staff ON security_events(staff_id, created_at DESC);

-- =============================================
-- 9. RATE LIMITING & PERFORMANCE
-- =============================================

CREATE TABLE rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identity
    identifier_type VARCHAR NOT NULL CHECK (identifier_type IN ('ip', 'user', 'api_key', 'phone')),
    identifier_value VARCHAR NOT NULL,
    
    -- Limit Configuration
    resource VARCHAR NOT NULL,
    limit_type VARCHAR NOT NULL CHECK (limit_type IN ('requests_per_minute', 'requests_per_hour', 'requests_per_day')),
    max_requests INTEGER NOT NULL,
    window_seconds INTEGER NOT NULL,
    
    -- Current Usage
    current_count INTEGER DEFAULT 0,
    window_start TIMESTAMP DEFAULT NOW(),
    
    -- Status
    blocked_until TIMESTAMP,
    violation_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraint for rate limiting
    UNIQUE(identifier_type, identifier_value, resource)
);

CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier_type, identifier_value);
CREATE INDEX idx_rate_limits_resource ON rate_limits(resource);
CREATE INDEX idx_rate_limits_blocked ON rate_limits(blocked_until);

-- Performance metrics
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Metric Details
    metric_type VARCHAR NOT NULL,
    operation VARCHAR NOT NULL,
    
    -- Performance Data
    duration_ms INTEGER NOT NULL CHECK (duration_ms >= 0),
    memory_usage_mb DECIMAL(10,2),
    cpu_usage_percent DECIMAL(5,2),
    
    -- Request Context
    endpoint VARCHAR,
    method VARCHAR,
    status_code INTEGER,
    user_id UUID REFERENCES staff(id),
    session_id VARCHAR,
    
    -- Business Context
    metadata JSONB DEFAULT '{}'::jsonb,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_metrics_type_date ON performance_metrics(metric_type, created_at DESC);
CREATE INDEX idx_metrics_operation ON performance_metrics(operation, created_at DESC);
CREATE INDEX idx_metrics_duration ON performance_metrics(duration_ms DESC);
CREATE INDEX idx_metrics_endpoint ON performance_metrics(endpoint, created_at DESC);

-- Error logs
CREATE TABLE error_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Error Details
    error_type VARCHAR NOT NULL,
    error_message TEXT NOT NULL,
    error_stack TEXT,
    error_code VARCHAR,
    
    -- Context
    component VARCHAR,
    operation VARCHAR,
    endpoint VARCHAR,
    
    -- User & Session
    user_id UUID REFERENCES staff(id),
    session_id VARCHAR,
    request_id VARCHAR,
    
    -- Environment
    ip_address INET,
    user_agent TEXT,
    
    -- Severity & Status
    severity VARCHAR DEFAULT 'error' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    status VARCHAR DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'resolved', 'ignored')),
    
    -- Resolution
    resolved_by UUID REFERENCES staff(id),
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_error_logs_severity_date ON error_logs(severity, created_at DESC);
CREATE INDEX idx_error_logs_type ON error_logs(error_type);
CREATE INDEX idx_error_logs_component ON error_logs(component, created_at DESC);
CREATE INDEX idx_error_logs_status ON error_logs(status);

-- =============================================
-- 10. BUSINESS METRICS & MONITORING
-- =============================================

CREATE TABLE business_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time Period
    metric_date DATE NOT NULL,
    metric_hour INTEGER,
    
    -- Sales Metrics
    total_sales_rwf DECIMAL(15,2) DEFAULT 0,
    total_sales_usd DECIMAL(15,2) DEFAULT 0,
    total_sales_eur DECIMAL(15,2) DEFAULT 0,
    total_transactions INTEGER DEFAULT 0,
    average_transaction_value DECIMAL(10,2),
    
    -- Payment Methods
    cash_sales DECIMAL(12,2) DEFAULT 0,
    bank_sales DECIMAL(12,2) DEFAULT 0,
    momo_sales DECIMAL(12,2) DEFAULT 0,
    cash_transactions INTEGER DEFAULT 0,
    bank_transactions INTEGER DEFAULT 0,
    momo_transactions INTEGER DEFAULT 0,
    
    -- Profit Metrics
    total_profit DECIMAL(12,2) DEFAULT 0,
    profit_margin DECIMAL(5,4) DEFAULT 0,
    
    -- Product Metrics
    products_sold INTEGER DEFAULT 0,
    unique_products_sold INTEGER DEFAULT 0,
    top_selling_category VARCHAR,
    
    -- Staff Performance
    staff_id UUID REFERENCES staff(id),
    staff_sales DECIMAL(12,2) DEFAULT 0,
    staff_transactions INTEGER DEFAULT 0,
    
    -- Customer Metrics
    new_customers INTEGER DEFAULT 0,
    returning_customers INTEGER DEFAULT 0,
    
    -- System Metrics
    api_calls INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Unique constraints
    UNIQUE(metric_date, metric_hour, staff_id)
);

CREATE INDEX idx_business_metrics_date ON business_metrics(metric_date DESC);
CREATE INDEX idx_business_metrics_staff_date ON business_metrics(staff_id, metric_date DESC);
CREATE INDEX idx_business_metrics_hourly ON business_metrics(metric_date, metric_hour);

-- =============================================
-- 11. MOMO TRANSACTIONS
-- =============================================

CREATE TABLE momo_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID REFERENCES sales(id),
    
    -- Transaction Details
    external_id VARCHAR UNIQUE NOT NULL,
    request_id VARCHAR,
    transaction_id VARCHAR,
    
    -- Amount & Currency
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR DEFAULT 'RWF',
    
    -- Payer Information
    payer_phone VARCHAR NOT NULL,
    payer_message TEXT,
    payee_note TEXT,
    
    -- Status & Tracking
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'successful', 'failed', 'cancelled')),
    failure_reason TEXT,
    
    -- API Response
    api_response JSONB,
    callback_data JSONB,
    
    -- Timing
    requested_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Retry Logic
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    next_retry_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_momo_external_id ON momo_transactions(external_id);
CREATE INDEX idx_momo_sale_id ON momo_transactions(sale_id);
CREATE INDEX idx_momo_status ON momo_transactions(status);
CREATE INDEX idx_momo_phone ON momo_transactions(payer_phone);
CREATE INDEX idx_momo_retry ON momo_transactions(next_retry_at) WHERE status = 'pending' AND retry_count < max_retries;

-- =============================================
-- 12. WEBSOCKET SESSIONS
-- =============================================

CREATE TABLE websocket_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Connection Details
    connection_id VARCHAR UNIQUE NOT NULL,
    socket_id VARCHAR UNIQUE NOT NULL,
    
    -- User Information
    staff_id UUID REFERENCES staff(id),
    user_type VARCHAR DEFAULT 'staff' CHECK (user_type IN ('staff', 'manager', 'system')),
    
    -- Connection Context
    ip_address INET,
    user_agent TEXT,
    origin VARCHAR,
    
    -- Subscription Channels
    subscribed_channels JSONB DEFAULT '[]'::jsonb,
    
    -- Status
    status VARCHAR DEFAULT 'connected' CHECK (status IN ('connected', 'disconnected', 'error')),
    
    -- Timing
    connected_at TIMESTAMP DEFAULT NOW(),
    last_activity_at TIMESTAMP DEFAULT NOW(),
    disconnected_at TIMESTAMP,
    
    -- Stats
    messages_sent INTEGER DEFAULT 0,
    messages_received INTEGER DEFAULT 0
);

CREATE INDEX idx_websocket_sessions_staff ON websocket_sessions(staff_id);
CREATE INDEX idx_websocket_sessions_status ON websocket_sessions(status);
CREATE INDEX idx_websocket_sessions_connection ON websocket_sessions(connection_id);
CREATE INDEX idx_websocket_sessions_activity ON websocket_sessions(last_activity_at DESC);

-- WebSocket message logs
CREATE TABLE websocket_message_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    session_id UUID REFERENCES websocket_sessions(id),
    
    -- Message Details
    message_type VARCHAR NOT NULL,
    direction VARCHAR NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    
    -- Content
    payload JSONB NOT NULL,
    message_size_bytes INTEGER,
    
    -- Processing
    processed_at TIMESTAMP DEFAULT NOW(),
    processing_time_ms INTEGER,
    
    -- Status
    delivery_status VARCHAR DEFAULT 'sent' CHECK (delivery_status IN ('sent', 'delivered', 'failed', 'timeout')),
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_websocket_logs_session_date ON websocket_message_logs(session_id, created_at DESC);
CREATE INDEX idx_websocket_logs_type ON websocket_message_logs(message_type);
CREATE INDEX idx_websocket_logs_status ON websocket_message_logs(delivery_status);

-- =============================================
-- 13. BACKUP & RECOVERY
-- =============================================

CREATE TABLE backup_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Backup Details
    backup_type VARCHAR NOT NULL CHECK (backup_type IN ('daily', 'weekly', 'monthly', 'manual', 'pre_migration')),
    backup_scope VARCHAR NOT NULL CHECK (backup_scope IN ('full', 'incremental', 'differential')),
    
    -- File Information
    backup_filename VARCHAR NOT NULL,
    backup_path VARCHAR NOT NULL,
    file_size_bytes BIGINT,
    compression_ratio DECIMAL(5,2),
    
    -- Storage Location
    storage_provider VARCHAR NOT NULL,
    storage_url VARCHAR,
    storage_region VARCHAR,
    
    -- Backup Content
    tables_included TEXT[] NOT NULL,
    records_count JSONB,
    
    -- Status & Timing
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    duration_seconds INTEGER,
    
    -- Verification
    checksum VARCHAR,
    verified_at TIMESTAMP,
    verification_status VARCHAR CHECK (verification_status IN ('pending', 'passed', 'failed')),
    
    -- Error Information
    error_message TEXT,
    error_details JSONB,
    
    -- Retention
    retention_days INTEGER DEFAULT 30,
    expires_at TIMESTAMP GENERATED ALWAYS AS (completed_at + INTERVAL '1 day' * retention_days) STORED,
    
    -- Audit
    triggered_by UUID REFERENCES staff(id),
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_backup_jobs_type_date ON backup_jobs(backup_type, created_at DESC);
CREATE INDEX idx_backup_jobs_status ON backup_jobs(status);
CREATE INDEX idx_backup_jobs_expires ON backup_jobs(expires_at);
CREATE INDEX idx_backup_jobs_verification ON backup_jobs(verification_status);

-- Recovery test logs
CREATE TABLE recovery_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_job_id UUID NOT NULL REFERENCES backup_jobs(id),
    
    -- Test Details
    test_type VARCHAR NOT NULL CHECK (test_type IN ('scheduled', 'manual', 'incident_response')),
    test_environment VARCHAR NOT NULL,
    
    -- Test Results
    status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'passed', 'failed')),
    recovery_time_seconds INTEGER,
    data_integrity_check BOOLEAN,
    functionality_tests_passed INTEGER DEFAULT 0,
    functionality_tests_failed INTEGER DEFAULT 0,
    
    -- Issues Found
    issues_found JSONB DEFAULT '[]'::jsonb,
    resolution_notes TEXT,
    
    -- Timing
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    
    -- Audit
    performed_by UUID NOT NULL REFERENCES staff(id)
);

CREATE INDEX idx_recovery_tests_backup ON recovery_tests(backup_job_id);
CREATE INDEX idx_recovery_tests_status_date ON recovery_tests(status, created_at DESC);

-- =============================================
-- 14. TRIGGERS FOR DATA INTEGRITY
-- =============================================

-- Function to automatically update inventory on sales
CREATE OR REPLACE FUNCTION update_inventory_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    -- Update product stock quantities
    UPDATE products 
    SET 
        stock_quantity = stock_quantity - (
            SELECT SUM(si.quantity)
            FROM sale_items si 
            WHERE si.sale_id = NEW.id AND si.product_id = products.id
        ),
        updated_at = NOW(),
        version = version + 1
    WHERE id IN (
        SELECT DISTINCT product_id 
        FROM sale_items 
        WHERE sale_id = NEW.id
    );
    
    -- Check for negative stock and raise error
    IF EXISTS (
        SELECT 1 FROM products 
        WHERE stock_quantity < 0 
        AND id IN (
            SELECT DISTINCT product_id 
            FROM sale_items 
            WHERE sale_id = NEW.id
        )
    ) THEN
        RAISE EXCEPTION 'Insufficient stock for sale %', NEW.id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inventory_on_sale
    AFTER INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_on_sale();

-- Audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    current_user_id UUID;
BEGIN
    -- Get current user from session variable
    BEGIN
        current_user_id := current_setting('app.current_user_id')::UUID;
    EXCEPTION WHEN OTHERS THEN
        current_user_id := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs (
            action, table_name, record_id, new_values, 
            user_id, created_at
        ) VALUES (
            'CREATE', TG_TABLE_NAME, NEW.id, to_jsonb(NEW),
            COALESCE(NEW.created_by, current_user_id),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs (
            action, table_name, record_id, old_values, new_values,
            changed_fields, user_id, created_at
        ) VALUES (
            'UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW),
            (SELECT array_agg(key) FROM jsonb_each(to_jsonb(NEW)) 
             WHERE to_jsonb(NEW) ->> key IS DISTINCT FROM to_jsonb(OLD) ->> key),
            COALESCE(NEW.updated_by, current_user_id),
            NOW()
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs (
            action, table_name, record_id, old_values,
            user_id, created_at
        ) VALUES (
            'DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD),
            current_user_id,
            NOW()
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to all relevant tables
CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_sales AFTER INSERT OR UPDATE OR DELETE ON sales
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_customers AFTER INSERT OR UPDATE OR DELETE ON customers
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_staff AFTER INSERT OR UPDATE OR DELETE ON staff
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Sale validation trigger
CREATE OR REPLACE FUNCTION validate_sale_totals()
RETURNS TRIGGER AS $$
DECLARE
    calculated_subtotal DECIMAL(12,2);
    calculated_total DECIMAL(12,2);
BEGIN
    -- Skip validation for new sales without items yet
    IF TG_OP = 'INSERT' THEN
        RETURN NEW;
    END IF;
    
    -- Calculate subtotal from items
    SELECT COALESCE(SUM(quantity * unit_price - COALESCE(discount_amount, 0)), 0)
    INTO calculated_subtotal
    FROM sale_items
    WHERE sale_id = NEW.id;
    
    -- Only validate if we have items
    IF calculated_subtotal > 0 THEN
        -- Calculate total with tax and discount
        calculated_total := calculated_subtotal + COALESCE(NEW.tax_amount, 0) - COALESCE(NEW.discount_amount, 0);
        
        -- Validate amounts
        IF ABS(NEW.subtotal - calculated_subtotal) > 0.01 THEN
            RAISE EXCEPTION 'Sale % subtotal mismatch: expected %, got %', 
                NEW.id, calculated_subtotal, NEW.subtotal;
        END IF;
        
        IF ABS(NEW.total_amount - calculated_total) > 0.01 THEN
            RAISE EXCEPTION 'Sale % total mismatch: expected %, got %', 
                NEW.id, calculated_total, NEW.total_amount;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_sale_totals_trigger
    BEFORE UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION validate_sale_totals();

-- Stock alert trigger
CREATE OR REPLACE FUNCTION check_stock_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for low stock
    IF NEW.stock_quantity <= NEW.low_stock_threshold AND 
       (OLD IS NULL OR OLD.stock_quantity > OLD.low_stock_threshold) THEN
        
        INSERT INTO stock_alerts (product_id, alert_type, current_stock, threshold_value)
        VALUES (
            NEW.id, 
            CASE WHEN NEW.stock_quantity = 0 THEN 'out_of_stock' ELSE 'low_stock' END,
            NEW.stock_quantity, 
            NEW.low_stock_threshold
        );
    END IF;
    
    -- Resolve alerts if stock is replenished
    IF NEW.stock_quantity > NEW.low_stock_threshold AND 
       OLD IS NOT NULL AND OLD.stock_quantity <= OLD.low_stock_threshold THEN
        
        UPDATE stock_alerts 
        SET status = 'resolved', resolved_at = NOW()
        WHERE product_id = NEW.id AND status = 'active';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_stock_alerts_trigger
    AFTER INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION check_stock_alerts();

-- =============================================
-- 15. UTILITY FUNCTIONS
-- =============================================

-- Data consistency check function
CREATE OR REPLACE FUNCTION check_data_consistency()
RETURNS TABLE(
    check_name text,
    status text,
    details text,
    affected_records bigint
) AS $$
BEGIN
    -- Check for orphaned sale items
    RETURN QUERY
    SELECT 
        'orphaned_sale_items'::text,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Sale items without corresponding sales'::text,
        COUNT(*)
    FROM sale_items si
    LEFT JOIN sales s ON si.sale_id = s.id
    WHERE s.id IS NULL;
    
    -- Check for negative stock quantities
    RETURN QUERY
    SELECT 
        'negative_stock'::text,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Products with negative stock quantities'::text,
        COUNT(*)
    FROM products
    WHERE stock_quantity < 0;
    
    -- Check for sales total inconsistencies
    RETURN QUERY
    SELECT 
        'sales_total_mismatch'::text,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::text,
        'Sales with incorrect total calculations'::text,
        COUNT(*)
    FROM sales s
    WHERE ABS(
        s.total_amount - (s.subtotal + COALESCE(s.tax_amount, 0) - COALESCE(s.discount_amount, 0))
    ) > 0.01;
    
    -- Check for duplicate receipts
    RETURN QUERY
    SELECT 
        'duplicate_receipts'::text,
        CASE WHEN COUNT(*) = COUNT(DISTINCT receipt_number) THEN 'PASS' ELSE 'FAIL' END::text,
        'Duplicate receipt numbers found'::text,
        COUNT(*) - COUNT(DISTINCT receipt_number)
    FROM sales
    WHERE receipt_number IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
    temp_count INTEGER;
BEGIN
    -- Delete old WebSocket sessions
    DELETE FROM websocket_sessions 
    WHERE disconnected_at IS NOT NULL 
    AND disconnected_at < NOW() - INTERVAL '24 hours';
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete expired rate limits
    DELETE FROM rate_limits 
    WHERE blocked_until IS NOT NULL 
    AND blocked_until < NOW();
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete old WebSocket message logs (keep 7 days)
    DELETE FROM websocket_message_logs 
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    -- Delete old performance metrics (keep 30 days)
    DELETE FROM performance_metrics 
    WHERE created_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS temp_count = ROW_COUNT;
    deleted_count := deleted_count + temp_count;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Backup validation function
CREATE OR REPLACE FUNCTION validate_backup_integrity(backup_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    table_count INTEGER;
    backup_table_count INTEGER;
    is_valid BOOLEAN := true;
BEGIN
    -- Count tables in current database
    SELECT COUNT(*)
    INTO table_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_type = 'BASE TABLE';
    
    -- Get backup metadata
    SELECT array_length(tables_included, 1)
    INTO backup_table_count
    FROM backup_jobs
    WHERE id = backup_id;
    
    -- Basic validation
    IF backup_table_count != table_count THEN
        is_valid := false;
    END IF;
    
    -- Update backup job with validation result
    UPDATE backup_jobs
    SET 
        verification_status = CASE WHEN is_valid THEN 'passed' ELSE 'failed' END,
        verified_at = NOW()
    WHERE id = backup_id;
    
    RETURN is_valid;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 16. INITIAL DATA SETUP
-- =============================================

-- Create default admin user (placeholder - will be created via application)
INSERT INTO staff (
    clerk_user_id, employee_id, first_name, last_name, email, role, 
    hire_date, is_active
) VALUES (
    'system', 'ADMIN001', 'System', 'Administrator', 
    'admin@vevurn.com', 'admin', CURRENT_DATE, true
) ON CONFLICT DO NOTHING;

-- Create default product categories
INSERT INTO products (name, category, sku, cost_price_rwf, selling_price_rwf, stock_quantity, is_active, created_by)
SELECT 
    'Sample Phone Case', 'Cases', 'CASE001', 5000, 8000, 50, true,
    (SELECT id FROM staff WHERE email = 'admin@vevurn.com' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'CASE001');

-- =============================================
-- 17. VIEWS FOR REPORTING
-- =============================================

-- Sales summary view
CREATE OR REPLACE VIEW sales_summary AS
SELECT 
    DATE(s.created_at) as sale_date,
    s.payment_method,
    s.currency,
    COUNT(*) as transaction_count,
    SUM(s.total_amount) as total_sales,
    SUM(s.profit) as total_profit,
    AVG(s.total_amount) as avg_transaction_value,
    MIN(s.total_amount) as min_sale,
    MAX(s.total_amount) as max_sale
FROM sales s
WHERE s.status = 'completed'
GROUP BY DATE(s.created_at), s.payment_method, s.currency
ORDER BY sale_date DESC;

-- Product performance view
CREATE OR REPLACE VIEW product_performance AS
SELECT 
    p.id,
    p.name,
    p.category,
    p.sku,
    p.stock_quantity,
    p.selling_price_rwf,
    COALESCE(sales_data.total_sold, 0) as total_sold,
    COALESCE(sales_data.total_revenue, 0) as total_revenue,
    COALESCE(sales_data.total_profit, 0) as total_profit
FROM products p
LEFT JOIN (
    SELECT 
        si.product_id,
        SUM(si.quantity) as total_sold,
        SUM(si.total_price) as total_revenue,
        SUM(si.profit) as total_profit
    FROM sale_items si
    JOIN sales s ON si.sale_id = s.id
    WHERE s.status = 'completed'
    GROUP BY si.product_id
) sales_data ON p.id = sales_data.product_id
WHERE p.is_active = true
ORDER BY COALESCE(sales_data.total_sold, 0) DESC;

-- Staff performance view
CREATE OR REPLACE VIEW staff_performance AS
SELECT 
    st.id,
    st.first_name,
    st.last_name,
    st.role,
    COUNT(s.id) as total_sales,
    COALESCE(SUM(s.total_amount), 0) as total_revenue,
    COALESCE(SUM(s.profit), 0) as total_profit,
    COALESCE(AVG(s.total_amount), 0) as avg_sale_value
FROM staff st
LEFT JOIN sales s ON st.id = s.staff_id AND s.status = 'completed'
WHERE st.is_active = true
GROUP BY st.id, st.first_name, st.last_name, st.role
ORDER BY total_revenue DESC;

-- Low stock products view
CREATE OR REPLACE VIEW low_stock_products AS
SELECT 
    p.id,
    p.name,
    p.sku,
    p.category,
    p.stock_quantity,
    p.low_stock_threshold,
    p.selling_price_rwf,
    s.name as supplier_name
FROM products p
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.is_active = true 
AND p.stock_quantity <= p.low_stock_threshold
ORDER BY p.stock_quantity ASC;

-- =============================================
-- 18. INDEXES FOR PERFORMANCE
-- =============================================

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_staff_date_status 
ON sales(staff_id, DATE(created_at), status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sale_items_product_date 
ON sale_items(product_id, DATE(created_at));

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_category_active_stock 
ON products(category, is_active, stock_quantity);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_logs_table_date_action 
ON audit_logs(table_name, DATE(created_at), action);

-- Partial indexes for common filtered queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_pending_momo 
ON sales(created_at DESC) 
WHERE payment_method = 'momo' AND payment_status = 'pending';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_products_low_stock_active 
ON products(stock_quantity, low_stock_threshold) 
WHERE is_active = true AND stock_quantity <= low_stock_threshold;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_staff_active_role 
ON staff(role, last_login_at DESC) 
WHERE is_active = true;

-- =============================================
-- SCHEMA CREATION COMPLETE
-- =============================================

-- Add comments for documentation
COMMENT ON DATABASE current_database() IS 'Vevurn POS System - Production Database';
COMMENT ON TABLE products IS 'Mobile accessories and products inventory';
COMMENT ON TABLE sales IS 'Sales transactions with multi-currency and MoMo support';
COMMENT ON TABLE customers IS 'Customer information and purchase history';
COMMENT ON TABLE staff IS 'Staff management with role-based access control';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all data changes';
COMMENT ON TABLE inventory_movements IS 'Real-time inventory tracking and movements';

-- Performance optimization
ANALYZE;
