-- Migration: Add Flexible Pricing and Bargaining System
-- Created: 2025-08-08
-- Description: Implements flexible pricing with bargaining capabilities and simplifies consignment system

-- ============================================
-- 1. UPDATE USERS TABLE FOR DISCOUNT PERMISSIONS
-- ============================================

ALTER TABLE users ADD COLUMN max_discount_allowed DECIMAL(5,2) DEFAULT 5.0;
ALTER TABLE users ADD COLUMN can_sell_below_min BOOLEAN DEFAULT false;

-- Set default permissions for existing users based on role
UPDATE users SET max_discount_allowed = 20.0, can_sell_below_min = true WHERE role = 'ADMIN';
UPDATE users SET max_discount_allowed = 15.0, can_sell_below_min = true WHERE role = 'MANAGER';
UPDATE users SET max_discount_allowed = 10.0, can_sell_below_min = false WHERE role = 'CASHIER';
UPDATE users SET max_discount_allowed = 0.0, can_sell_below_min = false WHERE role = 'VIEWER';

-- ============================================
-- 2. UPDATE PRODUCTS TABLE FOR FLEXIBLE PRICING
-- ============================================

-- Add new flexible pricing columns
ALTER TABLE products ADD COLUMN base_price_rwf DECIMAL(10,2);
ALTER TABLE products ADD COLUMN min_price_rwf DECIMAL(10,2);
ALTER TABLE products ADD COLUMN max_discount_percent DECIMAL(5,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN wholesale_price_rwf DECIMAL(10,2);

-- Add multi-currency support
ALTER TABLE products ADD COLUMN base_price_usd DECIMAL(10,2);
ALTER TABLE products ADD COLUMN min_price_usd DECIMAL(10,2);
ALTER TABLE products ADD COLUMN wholesale_price_usd DECIMAL(10,2);

ALTER TABLE products ADD COLUMN base_price_eur DECIMAL(10,2);
ALTER TABLE products ADD COLUMN min_price_eur DECIMAL(10,2);
ALTER TABLE products ADD COLUMN wholesale_price_eur DECIMAL(10,2);

-- Migrate existing price_rwf to base_price_rwf
UPDATE products SET base_price_rwf = price_rwf WHERE price_rwf IS NOT NULL;

-- Set reasonable minimum prices (80% of base price)
UPDATE products SET min_price_rwf = base_price_rwf * 0.8 WHERE base_price_rwf IS NOT NULL;

-- Set wholesale prices (70% of base price for consignment)
UPDATE products SET wholesale_price_rwf = base_price_rwf * 0.7 WHERE base_price_rwf IS NOT NULL;

-- Set default max discount (20% for most products)
UPDATE products SET max_discount_percent = 20.0;

-- Handle USD and EUR if they exist
UPDATE products SET base_price_usd = price_usd WHERE price_usd IS NOT NULL;
UPDATE products SET min_price_usd = price_usd * 0.8 WHERE price_usd IS NOT NULL;
UPDATE products SET wholesale_price_usd = price_usd * 0.7 WHERE price_usd IS NOT NULL;

UPDATE products SET base_price_eur = price_eur WHERE price_eur IS NOT NULL;
UPDATE products SET min_price_eur = price_eur * 0.8 WHERE price_eur IS NOT NULL;
UPDATE products SET wholesale_price_eur = price_eur * 0.7 WHERE price_eur IS NOT NULL;

-- Make base_price_rwf and min_price_rwf required after migration
ALTER TABLE products ALTER COLUMN base_price_rwf SET NOT NULL;
ALTER TABLE products ALTER COLUMN min_price_rwf SET NOT NULL;

-- ============================================
-- 3. UPDATE SALE_ITEMS TABLE FOR NEGOTIATED PRICING
-- ============================================

-- Add new pricing columns
ALTER TABLE sale_items ADD COLUMN base_price DECIMAL(10,2);
ALTER TABLE sale_items ADD COLUMN negotiated_price DECIMAL(10,2);
ALTER TABLE sale_items ADD COLUMN discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN discount_percentage DECIMAL(5,2) DEFAULT 0;
ALTER TABLE sale_items ADD COLUMN discount_reason VARCHAR DEFAULT 'none';

-- Add approval tracking
ALTER TABLE sale_items ADD COLUMN approved_by UUID;
ALTER TABLE sale_items ADD COLUMN approval_notes TEXT;

-- Create foreign key constraint for approved_by
ALTER TABLE sale_items ADD CONSTRAINT fk_sale_items_approved_by 
    FOREIGN KEY (approved_by) REFERENCES users(id);

-- Migrate existing data
-- Set base_price and negotiated_price from existing unit_price
UPDATE sale_items SET 
    base_price = unit_price,
    negotiated_price = unit_price,
    discount_amount = discount,
    discount_percentage = CASE 
        WHEN unit_price > 0 THEN (discount / unit_price) * 100 
        ELSE 0 
    END
WHERE unit_price IS NOT NULL;

-- Update total_price to use negotiated_price
UPDATE sale_items SET total_price = negotiated_price * quantity WHERE negotiated_price IS NOT NULL;

-- ============================================
-- 4. CREATE DISCOUNT_APPROVALS TABLE
-- ============================================

CREATE TYPE approval_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'EXPIRED');

CREATE TABLE discount_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Request details
    requested_by_id UUID NOT NULL REFERENCES users(id),
    
    -- Sale information
    sale_id UUID,
    product_id UUID NOT NULL,
    product_name VARCHAR NOT NULL,
    product_sku VARCHAR NOT NULL,
    
    -- Pricing details
    base_price DECIMAL(10,2) NOT NULL,
    requested_price DECIMAL(10,2) NOT NULL,
    minimum_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL,
    
    -- Request context
    reason TEXT NOT NULL,
    customer_context TEXT,
    business_case TEXT,
    
    -- Approval workflow
    status approval_status DEFAULT 'PENDING',
    approved_by UUID,
    approval_notes TEXT,
    approved_at TIMESTAMP,
    
    -- Metadata
    currency currency DEFAULT 'RWF',
    quantity INTEGER DEFAULT 1,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraints
ALTER TABLE discount_approvals ADD CONSTRAINT fk_discount_approvals_approved_by 
    FOREIGN KEY (approved_by) REFERENCES users(id);

-- Create indexes
CREATE INDEX idx_discount_approvals_status ON discount_approvals(status);
CREATE INDEX idx_discount_approvals_requested_by ON discount_approvals(requested_by_id);
CREATE INDEX idx_discount_approvals_approved_by ON discount_approvals(approved_by);
CREATE INDEX idx_discount_approvals_created_at ON discount_approvals(created_at);

-- ============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ============================================

-- Product pricing indexes
CREATE INDEX idx_products_base_price_rwf ON products(base_price_rwf);
CREATE INDEX idx_products_min_price_rwf ON products(min_price_rwf);

-- Sale items pricing indexes
CREATE INDEX idx_sale_items_base_price ON sale_items(base_price);
CREATE INDEX idx_sale_items_negotiated_price ON sale_items(negotiated_price);
CREATE INDEX idx_sale_items_discount_amount ON sale_items(discount_amount);
CREATE INDEX idx_sale_items_approved_by ON sale_items(approved_by);

-- ============================================
-- 6. UPDATE EXISTING SALES DATA
-- ============================================

-- Update sale totals to reflect any changes in item totals
UPDATE sales 
SET subtotal = (
    SELECT COALESCE(SUM(total_price), 0) 
    FROM sale_items 
    WHERE sale_items.sale_id = sales.id
),
total_amount = (
    SELECT COALESCE(SUM(total_price), 0) 
    FROM sale_items 
    WHERE sale_items.sale_id = sales.id
) + tax_amount - discount_amount;

-- ============================================
-- 7. CREATE VIEWS FOR REPORTING
-- ============================================

-- View for discount analysis
CREATE VIEW discount_analytics AS
SELECT 
    si.id,
    si.sale_id,
    s.receipt_number,
    s.created_at as sale_date,
    si.product_id,
    si.product_name,
    si.product_sku,
    si.base_price,
    si.negotiated_price,
    si.discount_amount,
    si.discount_percentage,
    si.discount_reason,
    si.quantity,
    si.total_price,
    u.first_name || ' ' || u.last_name as cashier_name,
    CASE WHEN si.approved_by IS NOT NULL THEN 
        approver.first_name || ' ' || approver.last_name 
        ELSE NULL 
    END as approved_by_name,
    s.currency
FROM sale_items si
JOIN sales s ON si.sale_id = s.id
JOIN users u ON s.cashier_id = u.id
LEFT JOIN users approver ON si.approved_by = approver.id
WHERE si.discount_amount > 0;

-- View for staff discount performance
CREATE VIEW staff_discount_performance AS
SELECT 
    u.id as staff_id,
    u.first_name || ' ' || u.last_name as staff_name,
    u.max_discount_allowed,
    u.can_sell_below_min,
    COUNT(si.id) as total_sales,
    COUNT(CASE WHEN si.discount_amount > 0 THEN 1 END) as discounted_sales,
    AVG(si.discount_percentage) as avg_discount_percent,
    SUM(si.discount_amount) as total_discount_given,
    COUNT(CASE WHEN si.approved_by IS NOT NULL THEN 1 END) as below_min_sales
FROM users u
LEFT JOIN sales s ON u.id = s.cashier_id
LEFT JOIN sale_items si ON s.id = si.sale_id
WHERE u.role IN ('CASHIER', 'MANAGER', 'ADMIN')
GROUP BY u.id, u.first_name, u.last_name, u.max_discount_allowed, u.can_sell_below_min;

-- ============================================
-- 8. CREATE TRIGGERS FOR AUTOMATIC CALCULATIONS
-- ============================================

-- Function to update discount calculations
CREATE OR REPLACE FUNCTION update_discount_calculations()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate discount amount and percentage
    NEW.discount_amount = NEW.base_price - NEW.negotiated_price;
    
    -- Calculate discount percentage
    IF NEW.base_price > 0 THEN
        NEW.discount_percentage = (NEW.discount_amount / NEW.base_price) * 100;
    ELSE
        NEW.discount_percentage = 0;
    END IF;
    
    -- Update total price
    NEW.total_price = NEW.negotiated_price * NEW.quantity;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_discount_calculations
    BEFORE INSERT OR UPDATE ON sale_items
    FOR EACH ROW
    EXECUTE FUNCTION update_discount_calculations();

-- ============================================
-- 9. SEED SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample discount approval requests
INSERT INTO discount_approvals (
    requested_by_id, 
    product_id, 
    product_name, 
    product_sku,
    base_price, 
    requested_price, 
    minimum_price, 
    discount_amount, 
    discount_percent, 
    reason,
    customer_context
) 
SELECT 
    u.id,
    p.id,
    p.name,
    p.sku,
    p.base_price_rwf,
    p.min_price_rwf * 0.9,
    p.min_price_rwf,
    p.base_price_rwf - (p.min_price_rwf * 0.9),
    ((p.base_price_rwf - (p.min_price_rwf * 0.9)) / p.base_price_rwf) * 100,
    'Customer loyalty - long-term client',
    'Regular customer who buys in bulk monthly'
FROM users u, products p
WHERE u.role = 'CASHIER' 
AND p.base_price_rwf IS NOT NULL
LIMIT 3;

COMMIT;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
