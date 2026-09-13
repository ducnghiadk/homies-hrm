-- ============================================================
-- HOMIES MILK TEA - KPI SAAS CORE SCHEMA
-- Database: Supabase / PostgreSQL
-- Created: 2026-08-21
-- Scope: KPI configuration, periods, evaluation, incidents,
-- development pipeline, salary decisions, and audit trail
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. KPI SETS
CREATE TABLE IF NOT EXISTS kpi_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_kpi_sets_org_code UNIQUE (org_id, code)
);

-- 2. KPI SET VERSIONS
CREATE TABLE IF NOT EXISTS kpi_set_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    set_id UUID NOT NULL REFERENCES kpi_sets(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    version_no INTEGER NOT NULL CHECK (version_no >= 1),
    name TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
    level_codes TEXT[] NOT NULL,
    store_scope_all BOOLEAN NOT NULL DEFAULT FALSE,
    store_ids UUID[] NOT NULL DEFAULT '{}',
    effective_from DATE NOT NULL,
    effective_to DATE,
    score_scale SMALLINT[] NOT NULL DEFAULT ARRAY[1, 2, 3, 4, 5],
    groups JSONB NOT NULL DEFAULT '[]'::jsonb,
    grades JSONB NOT NULL DEFAULT '[]'::jsonb,
    promotion_paths JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_status TEXT,
    created_by UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_by UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_kpi_set_versions_set_version UNIQUE (set_id, version_no),
    CONSTRAINT chk_kpi_set_versions_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- 3. KPI PERIODS
CREATE TABLE IF NOT EXISTS kpi_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES cua_hang(id) ON DELETE CASCADE,
    set_version_id UUID NOT NULL REFERENCES kpi_set_versions(id) ON DELETE RESTRICT,
    month_key TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'collecting', 'leader_scoring', 'ceo_preapproval', 'published', 'appeal_window', 'locked')),
    snapshot JSONB NOT NULL,
    opened_by UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_kpi_periods_org_store_month UNIQUE (org_id, store_id, month_key)
);

-- 4. KPI PERIOD EMPLOYEES
CREATE TABLE IF NOT EXISTS kpi_period_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id UUID NOT NULL REFERENCES kpi_periods(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES cua_hang(id) ON DELETE CASCADE,
    level_code TEXT NOT NULL CHECK (level_code IN ('pt1_tn', 'pt1_pc', 'pt2', 'senior', 'shift_leader')),
    position_id UUID REFERENCES chuc_vu(id) ON DELETE SET NULL,
    employment_status TEXT NOT NULL CHECK (employment_status IN ('probation', 'official')),
    included_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_kpi_period_employee UNIQUE (period_id, employee_id)
);

-- 5. KPI EVALUATIONS
CREATE TABLE IF NOT EXISTS kpi_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id UUID NOT NULL REFERENCES kpi_periods(id) ON DELETE CASCADE,
    period_employee_id UUID NOT NULL REFERENCES kpi_period_employees(id) ON DELETE CASCADE,
    snapshot JSONB NOT NULL,
    total_score NUMERIC(4, 2) CHECK (total_score BETWEEN 1 AND 5),
    grade_code TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'submitted', 'returned', 'preapproved', 'published', 'locked')),
    revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
    submitted_at TIMESTAMPTZ,
    published_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_kpi_evaluation_period_employee UNIQUE (period_id, period_employee_id)
);

-- 6. KPI CRITERION SCORES
CREATE TABLE IF NOT EXISTS kpi_criterion_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID NOT NULL REFERENCES kpi_evaluations(id) ON DELETE CASCADE,
    criterion_id TEXT NOT NULL,
    group_id TEXT,
    suggested_score NUMERIC(4, 2) CHECK (suggested_score IS NULL OR suggested_score BETWEEN 1 AND 5),
    final_score NUMERIC(4, 2) CHECK (final_score IS NULL OR final_score BETWEEN 1 AND 5),
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
    adjustment_reason TEXT,
    evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_kpi_criterion_score UNIQUE (evaluation_id, criterion_id)
);

-- 7. KPI SOURCE DATA
CREATE TABLE IF NOT EXISTS kpi_source_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id UUID REFERENCES kpi_periods(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES nhan_vien(id) ON DELETE CASCADE,
    criterion_id TEXT,
    source_key TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('automatic', 'manual', 'combined')),
    status TEXT NOT NULL CHECK (status IN ('missing', 'proposed', 'confirmed', 'ready', 'ignored')),
    value_numeric NUMERIC(12, 2),
    value_text TEXT,
    value_json JSONB DEFAULT '{}'::jsonb,
    source_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
    confirmed_by UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_kpi_source_period_employee_key UNIQUE (period_id, employee_id, source_key)
);

-- 8. KPI INCIDENTS
CREATE TABLE IF NOT EXISTS kpi_incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES cua_hang(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    period_id UUID REFERENCES kpi_periods(id) ON DELETE SET NULL,
    occurred_at TIMESTAMPTZ NOT NULL,
    source TEXT NOT NULL CHECK (source IN ('attendance', 'food_app', 'customer', 'operation', 'other')),
    status TEXT NOT NULL CHECK (status IN ('proposed', 'confirmed', 'acknowledged', 'appealed', 'finalized', 'cancelled')),
    description TEXT NOT NULL,
    evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
    leader_accountability JSONB DEFAULT '{}'::jsonb,
    impact_summary JSONB DEFAULT '{}'::jsonb,
    created_by UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. KPI INCIDENT VIOLATIONS
CREATE TABLE IF NOT EXISTS kpi_incident_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES kpi_incidents(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    primary_violation BOOLEAN NOT NULL DEFAULT FALSE,
    independent_behavior BOOLEAN NOT NULL DEFAULT FALSE,
    reason TEXT NOT NULL,
    evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. KPI APPEALS
CREATE TABLE IF NOT EXISTS kpi_appeals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('monthly_kpi', 'incident', 'people_decision')),
    reference_id UUID NOT NULL,
    reason TEXT NOT NULL,
    evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('submitted', 'reviewing', 'approved', 'partially_approved', 'rejected')),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deadline_at TIMESTAMPTZ NOT NULL,
    reviewed_by UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    decision_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. KPI DEVELOPMENT CASES
CREATE TABLE IF NOT EXISTS kpi_development_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES cua_hang(id) ON DELETE CASCADE,
    current_level TEXT NOT NULL CHECK (current_level IN ('pt1_tn', 'pt1_pc', 'pt2', 'senior', 'shift_leader')),
    target_level TEXT NOT NULL CHECK (target_level IN ('pt1_tn', 'pt1_pc', 'pt2', 'senior', 'shift_leader')),
    status TEXT NOT NULL CHECK (status IN ('detected', 'leader_proposed', 'testing', 'challenge', 'approved', 'deferred', 'rejected')),
    detected_from_period_id UUID REFERENCES kpi_periods(id) ON DELETE SET NULL,
    eligibility_result JSONB DEFAULT '{}'::jsonb,
    leader_note TEXT,
    ceo_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. KPI TEST SESSIONS
CREATE TABLE IF NOT EXISTS kpi_test_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    development_case_id UUID NOT NULL REFERENCES kpi_development_cases(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    current_level TEXT NOT NULL CHECK (current_level IN ('pt1_tn', 'pt1_pc', 'pt2', 'senior', 'shift_leader')),
    target_level TEXT NOT NULL CHECK (target_level IN ('pt1_tn', 'pt1_pc', 'pt2', 'senior', 'shift_leader')),
    rubric JSONB NOT NULL DEFAULT '[]'::jsonb,
    passing_total NUMERIC(5, 2) NOT NULL,
    section_floor NUMERIC(5, 2) NOT NULL,
    total_score NUMERIC(5, 2),
    outcome TEXT CHECK (outcome IS NULL OR outcome IN ('passed', 'failed_section_floor', 'failed_total')),
    retest_attempts INTEGER NOT NULL DEFAULT 0 CHECK (retest_attempts BETWEEN 0 AND 1),
    retest_scheduled_for TIMESTAMPTZ,
    finalized_by UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    finalized_at TIMESTAMPTZ,
    created_by UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_kpi_test_sessions_case UNIQUE (development_case_id)
);

-- 13. KPI CHALLENGES
CREATE TABLE IF NOT EXISTS kpi_challenges (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    development_case_id UUID NOT NULL REFERENCES kpi_development_cases(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    current_level TEXT NOT NULL CHECK (current_level IN ('pt1_tn', 'pt1_pc', 'pt2', 'senior', 'shift_leader')),
    target_level TEXT NOT NULL CHECK (target_level IN ('pt1_tn', 'pt1_pc', 'pt2', 'senior', 'shift_leader')),
    duration_label TEXT NOT NULL CHECK (duration_label IN ('1', '2', '2-3')),
    required_checkpoints JSONB NOT NULL DEFAULT '[]'::jsonb,
    check_ins JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL CHECK (status IN ('approved', 'active', 'passed', 'extended_once', 'failed', 'stopped_for_serious_incident')),
    extension_count INTEGER NOT NULL DEFAULT 0 CHECK (extension_count BETWEEN 0 AND 1),
    extension_reason TEXT,
    final_decision_note TEXT,
    return_to_level TEXT CHECK (return_to_level IS NULL OR return_to_level IN ('pt1_tn', 'pt1_pc', 'pt2', 'senior', 'shift_leader')),
    stop_incident_id UUID REFERENCES kpi_incidents(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_kpi_challenges_case UNIQUE (development_case_id)
);

-- 14. KPI SALARY BANDS
CREATE TABLE IF NOT EXISTS kpi_salary_bands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    level_code TEXT NOT NULL CHECK (level_code IN ('pt1_tn', 'pt1_pc', 'pt2', 'senior', 'shift_leader')),
    min_hourly_rate NUMERIC(12, 2) NOT NULL CHECK (min_hourly_rate >= 0),
    max_hourly_rate NUMERIC(12, 2) NOT NULL CHECK (max_hourly_rate >= min_hourly_rate),
    promotion_increase_min NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (promotion_increase_min >= 0),
    promotion_increase_max NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (promotion_increase_max >= promotion_increase_min),
    in_level_increase_min NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (in_level_increase_min >= 0),
    in_level_increase_max NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (in_level_increase_max >= in_level_increase_min),
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')),
    effective_from DATE NOT NULL,
    effective_to DATE,
    created_by UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_by UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    published_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_kpi_salary_bands_org_level_from UNIQUE (org_id, level_code, effective_from),
    CONSTRAINT chk_kpi_salary_bands_dates CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

-- 15. KPI SALARY DECISIONS
CREATE TABLE IF NOT EXISTS kpi_salary_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    development_case_id UUID NOT NULL REFERENCES kpi_development_cases(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    salary_band_id UUID REFERENCES kpi_salary_bands(id) ON DELETE SET NULL,
    decided_rate NUMERIC(12, 2) NOT NULL CHECK (decided_rate >= 0),
    suggested_range_min NUMERIC(12, 2),
    suggested_range_max NUMERIC(12, 2),
    effective_from DATE NOT NULL,
    reason TEXT NOT NULL,
    exception_payload JSONB DEFAULT '{}'::jsonb,
    decided_by UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE RESTRICT,
    decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_kpi_salary_decision_case UNIQUE (development_case_id)
);

-- 16. KPI AUDIT LOGS
CREATE TABLE IF NOT EXISTS kpi_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES to_chuc(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    actor_id UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kpi_set_versions_status_dates
    ON kpi_set_versions (status, effective_from, effective_to);

CREATE INDEX IF NOT EXISTS idx_kpi_periods_store_status_month
    ON kpi_periods (store_id, status, month_key);

CREATE INDEX IF NOT EXISTS idx_kpi_period_employees_employee
    ON kpi_period_employees (employee_id, period_id);

CREATE INDEX IF NOT EXISTS idx_kpi_evaluations_period_status
    ON kpi_evaluations (period_id, status);

CREATE INDEX IF NOT EXISTS idx_kpi_criterion_scores_evaluation
    ON kpi_criterion_scores (evaluation_id);

CREATE INDEX IF NOT EXISTS idx_kpi_source_data_period_employee_status
    ON kpi_source_data (period_id, employee_id, status);

CREATE INDEX IF NOT EXISTS idx_kpi_incidents_employee_status_occurred
    ON kpi_incidents (employee_id, status, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_kpi_incident_violations_incident
    ON kpi_incident_violations (incident_id);

CREATE INDEX IF NOT EXISTS idx_kpi_appeals_employee_status
    ON kpi_appeals (employee_id, status, type);

CREATE INDEX IF NOT EXISTS idx_kpi_development_cases_employee_status
    ON kpi_development_cases (employee_id, status);

CREATE INDEX IF NOT EXISTS idx_kpi_test_sessions_employee_outcome
    ON kpi_test_sessions (employee_id, outcome);

CREATE INDEX IF NOT EXISTS idx_kpi_challenges_employee_status
    ON kpi_challenges (employee_id, status);

CREATE INDEX IF NOT EXISTS idx_kpi_salary_bands_org_level_status
    ON kpi_salary_bands (org_id, level_code, status, effective_from DESC);

CREATE INDEX IF NOT EXISTS idx_kpi_salary_decisions_employee_effective
    ON kpi_salary_decisions (employee_id, effective_from DESC);

CREATE INDEX IF NOT EXISTS idx_kpi_audit_logs_entity
    ON kpi_audit_logs (entity_type, entity_id, created_at DESC);
