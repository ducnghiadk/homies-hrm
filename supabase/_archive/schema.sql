-- ============================================
-- HRM Trà Sữa 🧋 — Database Schema Phase 1
-- Version: Genesis v1
-- Date: 2026-02-15
-- ============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. ORGANIZATIONS (Tổ chức)
-- ============================================
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    subscription_plan VARCHAR(50) DEFAULT 'free',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. STORES (Cửa hàng)
-- ============================================
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    checkin_radius_meters INT DEFAULT 100,
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stores_org ON stores(org_id);

-- ============================================
-- 3. POSITIONS (Vị trí)
-- ============================================
CREATE TABLE positions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    level INT DEFAULT 0, -- 0=Thử việc, 1=NV, 2=Senior, 3=Phó QL, 4=QL
    base_salary DECIMAL(12, 0) DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_positions_org ON positions(org_id);

-- ============================================
-- 4. EMPLOYEES (Nhân viên)
-- ============================================
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_user_id UUID UNIQUE, -- Link to Supabase Auth
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID REFERENCES stores(id) ON DELETE SET NULL,
    position_id UUID REFERENCES positions(id) ON DELETE SET NULL,
    employee_code VARCHAR(20) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    avatar_url TEXT,
    date_of_birth DATE,
    gender VARCHAR(10), -- male, female, other
    address TEXT,
    role VARCHAR(20) DEFAULT 'employee', -- ceo, manager, employee
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, probation
    hire_date DATE DEFAULT CURRENT_DATE,
    total_points INT DEFAULT 0,
    gamification_level VARCHAR(20) DEFAULT 'bronze', -- bronze, silver, gold, platinum
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_employees_org ON employees(org_id);
CREATE INDEX idx_employees_store ON employees(store_id);
CREATE INDEX idx_employees_auth ON employees(auth_user_id);
CREATE INDEX idx_employees_role ON employees(role);

-- ============================================
-- 5. SHIFTS (Ca làm)
-- ============================================
CREATE TABLE shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    color VARCHAR(7) DEFAULT '#FF6B35', -- hex color
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shifts_org ON shifts(org_id);

-- ============================================
-- 6. SCHEDULES (Lịch làm)
-- ============================================
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date, shift_id)
);

CREATE INDEX idx_schedules_employee_date ON schedules(employee_id, date);
CREATE INDEX idx_schedules_store_date ON schedules(store_id, date);
CREATE INDEX idx_schedules_org ON schedules(org_id);

-- ============================================
-- 7. ATTENDANCES (Chấm công)
-- ============================================
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    shift_id UUID REFERENCES shifts(id),
    schedule_id UUID REFERENCES schedules(id),
    date DATE NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    check_in_lat DECIMAL(10, 8),
    check_in_lng DECIMAL(11, 8),
    check_out_lat DECIMAL(10, 8),
    check_out_lng DECIMAL(11, 8),
    check_in_photo_url TEXT,
    check_out_photo_url TEXT,
    check_in_distance_meters DECIMAL(8, 2),
    status VARCHAR(20) DEFAULT 'on_time', -- on_time, late, early, absent
    late_minutes INT DEFAULT 0,
    total_hours DECIMAL(5, 2) DEFAULT 0,
    overtime_hours DECIMAL(5, 2) DEFAULT 0,
    is_offline_checkin BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attendances_employee_date ON attendances(employee_id, date);
CREATE INDEX idx_attendances_store_date ON attendances(store_id, date);
CREATE INDEX idx_attendances_org ON attendances(org_id);
CREATE INDEX idx_attendances_status ON attendances(status);

-- ============================================
-- 8. SHIFT REQUESTS (Yêu cầu đổi ca / nghỉ phép)
-- ============================================
CREATE TABLE shift_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL, -- swap, time_off
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    -- For swap requests
    from_schedule_id UUID REFERENCES schedules(id),
    to_employee_id UUID REFERENCES employees(id),
    to_schedule_id UUID REFERENCES schedules(id),
    -- For time-off requests
    start_date DATE,
    end_date DATE,
    reason TEXT,
    -- Review
    reviewed_by UUID REFERENCES employees(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_shift_requests_employee ON shift_requests(employee_id);
CREATE INDEX idx_shift_requests_status ON shift_requests(status);
CREATE INDEX idx_shift_requests_org ON shift_requests(org_id);

-- ============================================
-- 9. NOTIFICATIONS (Thông báo - cơ bản)
-- ============================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    type VARCHAR(50), -- checkin, request, announcement, reward
    reference_type VARCHAR(50), -- attendance, shift_request, etc.
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_employee ON notifications(employee_id, is_read);
CREATE INDEX idx_notifications_org ON notifications(org_id);

-- ============================================
-- Updated_at trigger function
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendances_updated_at BEFORE UPDATE ON attendances FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shift_requests_updated_at BEFORE UPDATE ON shift_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
