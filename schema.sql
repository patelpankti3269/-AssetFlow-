CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ENUMS
-- ==========================================
CREATE TYPE asset_status_enum AS ENUM ('Available', 'Allocated', 'Reserved', 'Under Maintenance', 'Lost', 'Retired', 'Disposed');
CREATE TYPE transfer_status_enum AS ENUM ('Pending', 'Approved', 'Rejected');
CREATE TYPE booking_status_enum AS ENUM ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Completed');
CREATE TYPE maintenance_priority_enum AS ENUM ('Low', 'Medium', 'High', 'Critical');
CREATE TYPE maintenance_status_enum AS ENUM ('Pending', 'Approved', 'Rejected', 'Technician Assigned', 'In Progress', 'Resolved');
CREATE TYPE verification_status_enum AS ENUM ('Verified', 'Missing', 'Damaged');
CREATE TYPE notification_type_enum AS ENUM ('Asset Assigned', 'Maintenance Update', 'Booking Reminder', 'Transfer Approval', 'Overdue Return', 'Audit Alert');

-- ==========================================
-- 1. USER MANAGEMENT & AUTHENTICATION
-- ==========================================
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    employee_id UUID, -- Foreign Key added later to avoid circular dependency
    role_id INTEGER REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. ORGANIZATION MANAGEMENT
-- ==========================================
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    parent_department_id UUID REFERENCES departments(id),
    department_head_id UUID, -- Foreign Key added later
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department_id UUID REFERENCES departments(id),
    designation VARCHAR(100),
    joining_date DATE,
    status VARCHAR(20) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Resolving Circular Dependencies
ALTER TABLE users ADD CONSTRAINT fk_user_employee FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL;
ALTER TABLE departments ADD CONSTRAINT fk_dept_head FOREIGN KEY (department_head_id) REFERENCES employees(id) ON DELETE SET NULL;

-- ==========================================
-- 3. ASSET MANAGEMENT
-- ==========================================
CREATE TABLE asset_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_tag VARCHAR(50) UNIQUE NOT NULL, -- e.g., AF-0001
    name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES asset_categories(id),
    serial_number VARCHAR(100),
    description TEXT,
    purchase_date DATE,
    purchase_cost DECIMAL(12, 2),
    warranty_expiry DATE,
    condition VARCHAR(50),
    location VARCHAR(255),
    image_url TEXT,
    document_url TEXT,
    status asset_status_enum DEFAULT 'Available',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE asset_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    action_type VARCHAR(100) NOT NULL,
    previous_status asset_status_enum,
    new_status asset_status_enum,
    performed_by UUID REFERENCES users(id),
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 4. ASSET ALLOCATION MODULE
-- ==========================================
CREATE TABLE asset_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id),
    employee_id UUID REFERENCES employees(id),
    department_id UUID REFERENCES departments(id),
    allocated_by UUID REFERENCES users(id),
    allocation_date DATE NOT NULL,
    expected_return_date DATE,
    actual_return_date DATE,
    status VARCHAR(50) DEFAULT 'Active', -- Active, Returned
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    -- Prevent simultaneous active allocations
    EXCLUDE USING GIST (asset_id WITH =) WHERE (status = 'Active')
);

CREATE TABLE transfer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id),
    requested_by UUID REFERENCES users(id),
    from_employee UUID REFERENCES employees(id),
    to_employee UUID REFERENCES employees(id),
    reason TEXT,
    approval_status transfer_status_enum DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 5. RESOURCE BOOKING MODULE
-- ==========================================
CREATE TABLE resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
    resource_name VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    capacity INTEGER,
    location VARCHAR(255),
    is_bookable BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resource_id UUID REFERENCES resources(id),
    booked_by UUID REFERENCES users(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    purpose TEXT,
    status booking_status_enum DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    -- PostgreSQL extension 'btree_gist' needed for preventing overlapping times
    -- EXCLUDE USING GIST (resource_id WITH =, tsrange(start_time, end_time) WITH &&) WHERE (status IN ('Approved', 'Pending'))
);

-- ==========================================
-- 6. MAINTENANCE MANAGEMENT
-- ==========================================
CREATE TABLE maintenance_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID REFERENCES assets(id),
    requested_by UUID REFERENCES users(id),
    issue_description TEXT NOT NULL,
    priority maintenance_priority_enum DEFAULT 'Medium',
    image_url TEXT,
    requested_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status maintenance_status_enum DEFAULT 'Pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE maintenance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    maintenance_request_id UUID REFERENCES maintenance_requests(id) ON DELETE CASCADE,
    technician UUID REFERENCES users(id),
    repair_cost DECIMAL(12, 2),
    start_date DATE,
    completion_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 7. AUDIT MANAGEMENT
-- ==========================================
CREATE TABLE audit_cycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    department_id UUID REFERENCES departments(id),
    start_date DATE,
    end_date DATE,
    assigned_auditor UUID REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'Planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES audit_cycles(id) ON DELETE CASCADE,
    asset_id UUID REFERENCES assets(id),
    verification_status verification_status_enum,
    remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 8. NOTIFICATION SYSTEM
-- ==========================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type_enum NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 9. ACTIVITY LOGGING
-- ==========================================
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    entity_id UUID,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- INDEXES FOR SEARCH OPTIMIZATION
-- ==========================================
CREATE INDEX idx_assets_asset_tag ON assets(asset_tag);
CREATE INDEX idx_assets_serial_number ON assets(serial_number);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_departments_name ON departments(name);

-- ==========================================
-- ANALYTICS VIEWS
-- ==========================================
-- 1. Total assets count
CREATE VIEW vw_total_assets AS
SELECT count(*) as total_assets FROM assets;

-- 2. Available assets
CREATE VIEW vw_available_assets AS
SELECT count(*) as available_assets FROM assets WHERE status = 'Available';

-- 3. Assets under maintenance
CREATE VIEW vw_maintenance_assets AS
SELECT count(*) as maintenance_assets FROM assets WHERE status = 'Under Maintenance';

-- 4. Department wise asset allocation
CREATE VIEW vw_department_asset_allocation AS
SELECT d.name as department_name, count(aa.asset_id) as allocated_assets
FROM departments d
LEFT JOIN asset_allocations aa ON d.id = aa.department_id AND aa.status = 'Active'
GROUP BY d.name;

-- 5. Asset utilization percentage
CREATE VIEW vw_asset_utilization AS
SELECT 
    ROUND((COUNT(CASE WHEN status IN ('Allocated', 'Reserved') THEN 1 END) * 100.0 / NULLIF(COUNT(*), 0)), 2) as utilization_percentage
FROM assets;

-- 6. Maintenance frequency
CREATE VIEW vw_maintenance_frequency AS
SELECT a.asset_tag, a.name, count(mr.id) as maintenance_count
FROM assets a
LEFT JOIN maintenance_requests mr ON a.id = mr.asset_id
GROUP BY a.asset_tag, a.name;

-- 7. Most used assets (by allocation count)
CREATE VIEW vw_most_used_assets AS
SELECT a.asset_tag, a.name, count(aa.id) as allocation_count
FROM assets a
JOIN asset_allocations aa ON a.id = aa.asset_id
GROUP BY a.asset_tag, a.name
ORDER BY allocation_count DESC;

-- 8. Idle assets
CREATE VIEW vw_idle_assets AS
SELECT a.id, a.asset_tag, a.name, a.status
FROM assets a
LEFT JOIN asset_allocations aa ON a.id = aa.asset_id AND aa.status = 'Active'
WHERE aa.id IS NULL AND a.status = 'Available';

-- ==========================================
-- SAMPLE SEED DATA
-- ==========================================
INSERT INTO roles (name, description) VALUES
('Admin', 'System Administrator'),
('Asset Manager', 'Manages company inventory'),
('Department Head', 'Manages department resources'),
('Employee', 'Standard user');

INSERT INTO departments (name, code, description) VALUES
('Engineering', 'ENG', 'Software Development Team'),
('Human Resources', 'HR', 'HR and Operations');

INSERT INTO asset_categories (name, category_type) VALUES
('Laptops', 'IT Hardware'),
('Meeting Rooms', 'Facility');
