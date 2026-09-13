-- ============================================
-- HRM Trà Sữa — Phase 4: Operations Schema
-- Payroll, Inventory, Reports, Settings
-- ============================================

-- ========== PAYROLL ==========

CREATE TABLE payroll_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  period VARCHAR(7) NOT NULL, -- '2026-02'
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'confirmed', 'paid')),
  total_gross BIGINT DEFAULT 0,
  total_net BIGINT DEFAULT 0,
  employee_count INT DEFAULT 0,
  confirmed_by UUID REFERENCES employees(id),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, period)
);

CREATE TABLE payslips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES payroll_periods(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  base_salary BIGINT NOT NULL,
  ot_hours DECIMAL(5,1) DEFAULT 0,
  ot_amount BIGINT DEFAULT 0,
  bonus BIGINT DEFAULT 0,
  penalty BIGINT DEFAULT 0,
  allowance BIGINT DEFAULT 0,
  insurance BIGINT DEFAULT 0,
  tax BIGINT DEFAULT 0,
  gross BIGINT NOT NULL,
  net BIGINT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period_id, employee_id)
);

-- ========== INVENTORY ==========

CREATE TABLE ingredients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  store_id UUID REFERENCES stores(id),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(20) NOT NULL CHECK (category IN ('tea', 'milk', 'topping', 'syrup', 'cup', 'other')),
  unit VARCHAR(20) NOT NULL,
  stock DECIMAL(10,2) DEFAULT 0,
  min_stock DECIMAL(10,2) DEFAULT 0,
  price BIGINT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE stock_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id UUID NOT NULL REFERENCES ingredients(id),
  type VARCHAR(5) NOT NULL CHECK (type IN ('in', 'out')),
  quantity DECIMAL(10,2) NOT NULL,
  note TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== REPORTS (Materialized Views) ==========

CREATE TABLE daily_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  date DATE NOT NULL,
  revenue BIGINT DEFAULT 0,
  orders INT DEFAULT 0,
  avg_ticket BIGINT DEFAULT 0,
  UNIQUE(store_id, date)
);

-- ========== SETTINGS ==========

CREATE TABLE org_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  key VARCHAR(50) NOT NULL,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, key)
);

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  role VARCHAR(20) NOT NULL,
  permission VARCHAR(50) NOT NULL,
  UNIQUE(org_id, role, permission)
);

-- ========== INDEXES ==========

CREATE INDEX idx_payslips_period ON payslips(period_id);
CREATE INDEX idx_payslips_emp ON payslips(employee_id);
CREATE INDEX idx_ingredients_store ON ingredients(store_id);
CREATE INDEX idx_ingredients_category ON ingredients(category);
CREATE INDEX idx_stock_tx_ingredient ON stock_transactions(ingredient_id);
CREATE INDEX idx_daily_revenue_date ON daily_revenue(date);
CREATE INDEX idx_org_settings_key ON org_settings(org_id, key);

-- ========== CONTRACTS ==========
-- Dung text id de giu duoc luong mock hien tai trong luc chuyen dan sang backend that.

CREATE TABLE contract_templates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  employment_type VARCHAR(20) NOT NULL,
  position_ids JSONB NOT NULL DEFAULT '[]',
  store_scope VARCHAR(30) NOT NULL DEFAULT 'all',
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'archived')),
  version TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  blocks JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE employee_contracts (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL REFERENCES contract_templates(id),
  employee_id TEXT NOT NULL,
  store_id TEXT NOT NULL,
  position_id TEXT NOT NULL,
  status VARCHAR(30) NOT NULL CHECK (status IN ('draft', 'pending_employee_sign', 'signed_by_employee', 'pending_hr_sign', 'active', 'rejected', 'expired', 'void', 'superseded')),
  version TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  sent_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,
  custom_fields JSONB NOT NULL DEFAULT '{}',
  rendered_content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contract_signatures (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES employee_contracts(id) ON DELETE CASCADE,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('employee', 'hr')),
  signed_at TIMESTAMPTZ NOT NULL,
  method VARCHAR(20) NOT NULL CHECK (method IN ('app_confirm', 'otp_mock')),
  evidence TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contract_audit_logs (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES employee_contracts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  actor_name TEXT NOT NULL,
  at TIMESTAMPTZ NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE contract_snapshots (
  id TEXT PRIMARY KEY,
  contract_id TEXT NOT NULL REFERENCES employee_contracts(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  note TEXT NOT NULL,
  content TEXT NOT NULL
);

CREATE INDEX idx_contract_templates_status ON contract_templates(status);
CREATE INDEX idx_employee_contracts_employee ON employee_contracts(employee_id);
CREATE INDEX idx_employee_contracts_store_status ON employee_contracts(store_id, status);
CREATE INDEX idx_contract_signatures_contract ON contract_signatures(contract_id, signed_at);
CREATE INDEX idx_contract_audit_logs_contract ON contract_audit_logs(contract_id, at);
CREATE INDEX idx_contract_snapshots_contract ON contract_snapshots(contract_id, created_at);
