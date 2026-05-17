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
