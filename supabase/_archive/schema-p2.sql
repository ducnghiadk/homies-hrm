-- ============================================
-- HRM Trà Sữa — Phase 2: Performance Schema
-- Modules: KPI, Rewards, Evaluations, Career
-- ============================================

-- ========== KPI ==========

-- KPI Templates (per position)
CREATE TABLE kpi_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  position_id UUID REFERENCES positions(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KPI Metrics (belong to template)
CREATE TABLE kpi_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES kpi_templates(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('auto', 'manual')),
  category VARCHAR(20) NOT NULL CHECK (category IN ('financial', 'customer', 'process', 'learning')),
  weight DECIMAL(5,2) NOT NULL CHECK (weight > 0 AND weight <= 100),
  unit VARCHAR(20) NOT NULL,
  target DECIMAL(10,2) NOT NULL,
  sort_order INT DEFAULT 0
);

-- KPI Assignments (per employee per period)
CREATE TABLE kpi_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  template_id UUID NOT NULL REFERENCES kpi_templates(id),
  period VARCHAR(7) NOT NULL, -- '2026-02'
  period_type VARCHAR(10) NOT NULL CHECK (period_type IN ('weekly', 'monthly', 'quarterly')),
  total_score DECIMAL(5,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id, template_id, period)
);

-- KPI Results (per metric per assignment)
CREATE TABLE kpi_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES kpi_assignments(id) ON DELETE CASCADE,
  metric_id UUID NOT NULL REFERENCES kpi_metrics(id),
  target DECIMAL(10,2) NOT NULL,
  actual DECIMAL(10,2),
  score DECIMAL(5,2) DEFAULT 0,
  note TEXT,
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(assignment_id, metric_id)
);

-- ========== REWARDS & PENALTIES ==========

CREATE TABLE reward_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  condition_expr TEXT NOT NULL,  -- 'late_count >= 3'
  action VARCHAR(10) NOT NULL CHECK (action IN ('bonus', 'penalty')),
  amount INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  type VARCHAR(10) NOT NULL CHECK (type IN ('bonus', 'penalty')),
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  category VARCHAR(30),  -- 'performance', 'attendance', 'sales'...
  rule_id UUID REFERENCES reward_rules(id),  -- null = manual
  created_by UUID REFERENCES employees(id),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========== 360° EVALUATION ==========

CREATE TABLE eval_cycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  name VARCHAR(100) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE eval_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES eval_cycles(id) ON DELETE CASCADE,
  position_id UUID REFERENCES positions(id),
  form_type VARCHAR(10) NOT NULL CHECK (form_type IN ('self', 'manager', 'peer')),
  questions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE eval_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES eval_cycles(id),
  employee_id UUID NOT NULL REFERENCES employees(id),  -- who is being evaluated
  evaluator_id UUID NOT NULL REFERENCES employees(id), -- who evaluates
  form_type VARCHAR(10) NOT NULL CHECK (form_type IN ('self', 'manager', 'peer')),
  scores JSONB,  -- { work_quality: 4, teamwork: 5, ... }
  comments TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  completed_at TIMESTAMPTZ,
  UNIQUE(cycle_id, employee_id, evaluator_id, form_type)
);

CREATE TABLE eval_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id UUID NOT NULL REFERENCES eval_cycles(id),
  employee_id UUID NOT NULL REFERENCES employees(id),
  self_scores JSONB,
  manager_scores JSONB,
  peer_scores JSONB,
  final_score DECIMAL(3,1),
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(cycle_id, employee_id)
);

-- ========== CAREER PATH ==========

CREATE TABLE career_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id),
  level INT NOT NULL,
  name VARCHAR(50) NOT NULL,
  min_months INT DEFAULT 0,
  min_kpi DECIMAL(5,2) DEFAULT 0,
  min_eval DECIMAL(3,1) DEFAULT 0,
  required_courses INT DEFAULT 0,
  salary_range VARCHAR(30),
  UNIQUE(org_id, level)
);

CREATE TABLE career_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  current_level INT NOT NULL,
  target_level INT NOT NULL,
  overall_percent DECIMAL(5,2) DEFAULT 0,
  progress_data JSONB NOT NULL DEFAULT '{}',
  suggestion TEXT,
  last_calculated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(employee_id)
);

-- ========== INDEXES ==========

CREATE INDEX idx_kpi_assignments_emp ON kpi_assignments(employee_id);
CREATE INDEX idx_kpi_assignments_period ON kpi_assignments(period);
CREATE INDEX idx_rewards_emp ON rewards(employee_id);
CREATE INDEX idx_rewards_date ON rewards(date);
CREATE INDEX idx_eval_assignments_cycle ON eval_assignments(cycle_id);
CREATE INDEX idx_eval_results_emp ON eval_results(employee_id);
CREATE INDEX idx_career_progress_emp ON career_progress(employee_id);
