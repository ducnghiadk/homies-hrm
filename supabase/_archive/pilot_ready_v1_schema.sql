-- ============================================================
-- HOMIES MILK TEA 🧋 — DATABASE SCHEMA PILOT READY v1.0
-- Supabase / PostgreSQL
-- Date: 2026-05-19
-- ============================================================

-- ==============================
-- 0. EXTENSIONS & ENUMS
-- ==============================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE store_status AS ENUM ('active', 'inactive', 'closed');
CREATE TYPE user_gender AS ENUM ('male', 'female', 'other');
CREATE TYPE contract_type AS ENUM ('fulltime', 'parttime', 'intern', 'probation');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'resigned');
CREATE TYPE user_role AS ENUM ('employee', 'shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo');
CREATE TYPE schedule_status AS ENUM ('scheduled', 'confirmed', 'completed', 'absent', 'cancelled');
CREATE TYPE checkin_method AS ENUM ('gps', 'wifi', 'manual', 'qr');
CREATE TYPE attendance_status AS ENUM ('on_time', 'late', 'early_leave', 'absent', 'pending');
CREATE TYPE leave_type AS ENUM ('annual', 'sick', 'personal', 'maternity', 'unpaid');
CREATE TYPE leave_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- ==============================
-- 1. ORGANIZATIONS
-- ==============================
CREATE TABLE organizations (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    logo_url    TEXT,
    address     TEXT,
    phone       TEXT,
    email       TEXT,
    tax_code    TEXT,
    settings    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE organizations IS 'Thông tin công ty/chuỗi trà sữa Homies';

-- ==============================
-- 2. STORES
-- ==============================
CREATE TABLE stores (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    code            TEXT UNIQUE,
    address         TEXT,
    phone           TEXT,
    latitude        DECIMAL(10, 7),
    longitude       DECIMAL(10, 7),
    radius_meters   INTEGER DEFAULT 100,
    manager_id      UUID, -- FK added after users table exists
    status          store_status DEFAULT 'active',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE stores IS 'Thông tin cửa hàng trong chuỗi Homies';
CREATE INDEX idx_stores_org ON stores(organization_id);

-- ==============================
-- 3. POSITIONS
-- ==============================
CREATE TABLE positions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    code            TEXT,
    level           INTEGER DEFAULT 1 CHECK (level BETWEEN 1 AND 10),
    base_salary     DECIMAL(15, 2) DEFAULT 0,
    permissions     JSONB DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE positions IS 'Chức danh công việc của nhân viên';
CREATE INDEX idx_positions_org ON positions(organization_id);

-- ==============================
-- 4. USERS (Mô hình cốt lõi - không đổi sang profiles)
-- ==============================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    store_id        UUID REFERENCES stores(id) ON DELETE SET NULL,
    position_id     UUID REFERENCES positions(id) ON DELETE SET NULL,
    employee_code   TEXT UNIQUE,
    email           TEXT UNIQUE,
    phone           TEXT,
    password_hash   TEXT,
    full_name       TEXT NOT NULL,
    avatar_url      TEXT,
    date_of_birth   DATE,
    gender          user_gender,
    id_number       TEXT,
    address         TEXT,
    bank_name       TEXT,
    bank_account    TEXT,
    start_date      DATE,
    contract_type   contract_type DEFAULT 'fulltime',
    status          user_status DEFAULT 'active',
    role            user_role DEFAULT 'employee',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Nhân viên và quản lý trong hệ thống';
CREATE INDEX idx_users_org_store_status ON users(organization_id, store_id, status);
CREATE INDEX idx_users_role ON users(role);

-- Add foreign key constraint for manager_id in stores table
ALTER TABLE stores ADD CONSTRAINT fk_stores_manager FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- ==============================
-- 5. SHIFTS
-- ==============================
CREATE TABLE shifts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    code            TEXT,
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    break_minutes   INTEGER DEFAULT 30,
    is_overnight    BOOLEAN DEFAULT FALSE,
    color           TEXT DEFAULT '#001D3D',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE shifts IS 'Định nghĩa ca làm việc của hệ thống';
CREATE INDEX idx_shifts_org ON shifts(organization_id);

-- ==============================
-- 6. SCHEDULES
-- ==============================
CREATE TABLE schedules (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id    UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    shift_id    UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    status      schedule_status DEFAULT 'scheduled',
    notes       TEXT,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_schedule_user_date_shift UNIQUE (user_id, date, shift_id)
);

COMMENT ON TABLE schedules IS 'Lịch làm việc phân công cho nhân sự';
CREATE INDEX idx_schedules_user_date ON schedules(user_id, date);
CREATE INDEX idx_schedules_store_date ON schedules(store_id, date);

-- ==============================
-- 7. ATTENDANCE (Chấm công thực tế)
-- ==============================
CREATE TABLE attendance (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    store_id                UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    schedule_id             UUID REFERENCES schedules(id) ON DELETE SET NULL,
    date                    DATE NOT NULL,
    check_in_time           TIMESTAMPTZ,
    check_in_latitude       DECIMAL(10, 7),
    check_in_longitude      DECIMAL(10, 7),
    check_in_photo_url      TEXT,
    check_in_method         checkin_method DEFAULT 'gps',
    check_out_time          TIMESTAMPTZ,
    check_out_latitude      DECIMAL(10, 7),
    check_out_longitude     DECIMAL(10, 7),
    check_out_photo_url     TEXT,
    actual_hours            DECIMAL(5, 2) DEFAULT 0,
    overtime_hours          DECIMAL(5, 2) DEFAULT 0,
    status                  attendance_status DEFAULT 'pending',
    late_minutes            INTEGER DEFAULT 0,
    early_leave_minutes     INTEGER DEFAULT 0,
    notes                   TEXT,
    approved_by             UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at             TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE attendance IS 'Chấm công thực tế (GPS, WiFi, QR, Manual)';
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_attendance_store_date ON attendance(store_id, date);

-- ==============================
-- 8. LEAVE REQUESTS
-- ==============================
CREATE TABLE leave_requests (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    leave_type      leave_type NOT NULL,
    start_date      DATE NOT NULL,
    end_date        DATE NOT NULL,
    total_days      DECIMAL(4, 1) NOT NULL,
    reason          TEXT,
    status          leave_status DEFAULT 'pending',
    approved_by     UUID REFERENCES users(id) ON DELETE SET NULL,
    approved_at     TIMESTAMPTZ,
    rejection_reason TEXT,
    attachments     JSONB DEFAULT '[]',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE leave_requests IS 'Đơn xin nghỉ phép của nhân sự';
CREATE INDEX idx_leave_user ON leave_requests(user_id, status);

-- ==============================
-- 9. PAYROLL (Vùng khóa an toàn, giữ nguyên không mở rộng)
-- ==============================
CREATE TABLE payroll (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_month            INTEGER NOT NULL CHECK (period_month BETWEEN 1 AND 12),
    period_year             INTEGER NOT NULL,
    base_salary             DECIMAL(15, 2) DEFAULT 0,
    working_days            DECIMAL(4, 1) DEFAULT 0,
    actual_days             DECIMAL(4, 1) DEFAULT 0,
    overtime_hours          DECIMAL(5, 2) DEFAULT 0,
    overtime_pay            DECIMAL(15, 2) DEFAULT 0,
    night_shift_pay         DECIMAL(15, 2) DEFAULT 0,
    kpi_bonus               DECIMAL(15, 2) DEFAULT 0,
    other_bonus             DECIMAL(15, 2) DEFAULT 0,
    deductions              DECIMAL(15, 2) DEFAULT 0,
    social_insurance        DECIMAL(15, 2) DEFAULT 0,
    health_insurance        DECIMAL(15, 2) DEFAULT 0,
    unemployment_insurance  DECIMAL(15, 2) DEFAULT 0,
    personal_income_tax     DECIMAL(15, 2) DEFAULT 0,
    net_salary              DECIMAL(15, 2) DEFAULT 0,
    status                  TEXT DEFAULT 'draft',
    calculated_at           TIMESTAMPTZ,
    approved_by             UUID REFERENCES users(id) ON DELETE SET NULL,
    paid_at                 TIMESTAMPTZ,
    notes                   TEXT,
    created_at              TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_payroll UNIQUE (user_id, period_month, period_year)
);

COMMENT ON TABLE payroll IS 'Bảng lương tháng của nhân viên (Khóa an toàn)';

-- ==============================
-- 10. UPDATED_AT TRIGGER
-- ==============================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_stores_updated BEFORE UPDATE ON stores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_schedules_updated BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_leave_requests_updated BEFORE UPDATE ON leave_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

-- Helpers for policies
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
    SELECT role FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_store_id()
RETURNS UUID AS $$
    SELECT store_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
    SELECT organization_id FROM users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- RLS: Organizations
CREATE POLICY "org_read" ON organizations FOR SELECT USING (id = get_user_org_id());

-- RLS: Stores
CREATE POLICY "stores_read" ON stores FOR SELECT USING (organization_id = get_user_org_id());
CREATE POLICY "stores_manage" ON stores FOR ALL USING (organization_id = get_user_org_id() AND get_user_role() IN ('hr_admin', 'ceo'));

-- RLS: Positions
CREATE POLICY "positions_read" ON positions FOR SELECT USING (organization_id = get_user_org_id());

-- RLS: Users
CREATE POLICY "users_self" ON users FOR SELECT USING (id = auth.uid());
CREATE POLICY "users_store_manager" ON users FOR SELECT USING (store_id = get_user_store_id() AND get_user_role() IN ('store_manager', 'shift_leader'));
CREATE POLICY "users_admin" ON users FOR SELECT USING (organization_id = get_user_org_id() AND get_user_role() IN ('hr_admin', 'ceo', 'area_manager'));
CREATE POLICY "users_admin_manage" ON users FOR ALL USING (organization_id = get_user_org_id() AND get_user_role() IN ('hr_admin', 'ceo'));

-- RLS: Shifts
CREATE POLICY "shifts_read" ON shifts FOR SELECT USING (organization_id = get_user_org_id());

-- RLS: Schedules
CREATE POLICY "schedules_self" ON schedules FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "schedules_store" ON schedules FOR SELECT USING (store_id = get_user_store_id() AND get_user_role() IN ('store_manager', 'shift_leader'));
CREATE POLICY "schedules_admin" ON schedules FOR ALL USING (get_user_role() IN ('hr_admin', 'ceo', 'area_manager'));

-- RLS: Attendance
CREATE POLICY "attendance_self" ON attendance FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "attendance_self_insert" ON attendance FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "attendance_store" ON attendance FOR SELECT USING (store_id = get_user_store_id() AND get_user_role() IN ('store_manager', 'shift_leader'));
CREATE POLICY "attendance_admin" ON attendance FOR ALL USING (get_user_role() IN ('hr_admin', 'ceo', 'area_manager'));

-- RLS: Leave Requests
CREATE POLICY "leave_self" ON leave_requests FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "leave_self_insert" ON leave_requests FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "leave_admin" ON leave_requests FOR ALL USING (get_user_role() IN ('hr_admin', 'ceo', 'store_manager'));

-- RLS: Payroll
CREATE POLICY "payroll_self" ON payroll FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "payroll_admin" ON payroll FOR ALL USING (get_user_role() IN ('hr_admin', 'ceo'));
