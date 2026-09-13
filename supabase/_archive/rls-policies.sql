-- ============================================
-- HRM Trà Sữa 🧋 — Row Level Security Policies
-- Apply AFTER schema.sql
-- ============================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE shift_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper function: get current employee
-- ============================================
CREATE OR REPLACE FUNCTION get_current_employee_id()
RETURNS UUID AS $$
  SELECT id FROM employees WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM employees WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_current_role()
RETURNS TEXT AS $$
  SELECT role FROM employees WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_current_store_id()
RETURNS UUID AS $$
  SELECT store_id FROM employees WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- ============================================
-- ORGANIZATIONS — same org only
-- ============================================
CREATE POLICY "org_select" ON organizations FOR SELECT USING (
  id = get_current_org_id()
);

-- ============================================
-- STORES — same org, managers see own store
-- ============================================
CREATE POLICY "stores_select" ON stores FOR SELECT USING (
  org_id = get_current_org_id()
);
CREATE POLICY "stores_manage" ON stores FOR ALL USING (
  org_id = get_current_org_id() AND get_current_role() = 'ceo'
);

-- ============================================
-- POSITIONS — same org
-- ============================================
CREATE POLICY "positions_select" ON positions FOR SELECT USING (
  org_id = get_current_org_id()
);
CREATE POLICY "positions_manage" ON positions FOR ALL USING (
  org_id = get_current_org_id() AND get_current_role() = 'ceo'
);

-- ============================================
-- EMPLOYEES
-- - Employee: see self
-- - Manager: see employees in own store
-- - CEO: see all in org
-- ============================================
CREATE POLICY "employees_select_self" ON employees FOR SELECT USING (
  id = get_current_employee_id()
);
CREATE POLICY "employees_select_manager" ON employees FOR SELECT USING (
  org_id = get_current_org_id()
  AND get_current_role() IN ('manager', 'ceo')
  AND (get_current_role() = 'ceo' OR store_id = get_current_store_id())
);
CREATE POLICY "employees_insert" ON employees FOR INSERT WITH CHECK (
  org_id = get_current_org_id() AND get_current_role() IN ('manager', 'ceo')
);
CREATE POLICY "employees_update_self" ON employees FOR UPDATE USING (
  id = get_current_employee_id()
);
CREATE POLICY "employees_update_manager" ON employees FOR UPDATE USING (
  org_id = get_current_org_id() AND get_current_role() IN ('manager', 'ceo')
);

-- ============================================
-- SHIFTS — same org
-- ============================================
CREATE POLICY "shifts_select" ON shifts FOR SELECT USING (
  org_id = get_current_org_id()
);
CREATE POLICY "shifts_manage" ON shifts FOR ALL USING (
  org_id = get_current_org_id() AND get_current_role() IN ('manager', 'ceo')
);

-- ============================================
-- SCHEDULES
-- - Employee: own schedules
-- - Manager: store schedules
-- - CEO: org schedules
-- ============================================
CREATE POLICY "schedules_select_self" ON schedules FOR SELECT USING (
  employee_id = get_current_employee_id()
);
CREATE POLICY "schedules_select_manager" ON schedules FOR SELECT USING (
  org_id = get_current_org_id() AND get_current_role() IN ('manager', 'ceo')
);
CREATE POLICY "schedules_manage" ON schedules FOR ALL USING (
  org_id = get_current_org_id() AND get_current_role() IN ('manager', 'ceo')
);

-- ============================================
-- ATTENDANCES
-- - Employee: own records
-- - Manager: store records
-- - CEO: org records  
-- ============================================
CREATE POLICY "att_select_self" ON attendances FOR SELECT USING (
  employee_id = get_current_employee_id()
);
CREATE POLICY "att_select_manager" ON attendances FOR SELECT USING (
  org_id = get_current_org_id() AND get_current_role() IN ('manager', 'ceo')
);
CREATE POLICY "att_insert_self" ON attendances FOR INSERT WITH CHECK (
  employee_id = get_current_employee_id()
);
CREATE POLICY "att_update_self" ON attendances FOR UPDATE USING (
  employee_id = get_current_employee_id()
);

-- ============================================
-- SHIFT_REQUESTS
-- - Employee: own requests
-- - Manager: store requests  
-- - CEO: org requests
-- ============================================
CREATE POLICY "req_select_self" ON shift_requests FOR SELECT USING (
  employee_id = get_current_employee_id()
);
CREATE POLICY "req_select_manager" ON shift_requests FOR SELECT USING (
  org_id = get_current_org_id() AND get_current_role() IN ('manager', 'ceo')
);
CREATE POLICY "req_insert_self" ON shift_requests FOR INSERT WITH CHECK (
  employee_id = get_current_employee_id()
);
CREATE POLICY "req_approve" ON shift_requests FOR UPDATE USING (
  org_id = get_current_org_id() AND get_current_role() IN ('manager', 'ceo')
);

-- ============================================
-- NOTIFICATIONS — own only
-- ============================================
CREATE POLICY "notif_select" ON notifications FOR SELECT USING (
  employee_id = get_current_employee_id()
);
CREATE POLICY "notif_update" ON notifications FOR UPDATE USING (
  employee_id = get_current_employee_id()
);
CREATE POLICY "notif_insert" ON notifications FOR INSERT WITH CHECK (
  org_id = get_current_org_id() AND get_current_role() IN ('manager', 'ceo')
);
