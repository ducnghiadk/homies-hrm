-- Homies HRM - KPI Monthly Peer Review Schema Migration
-- Created at: 2026-08-23
-- Target: Supabase Postgres

CREATE TABLE IF NOT EXISTS public.kpi_monthly_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_id UUID NOT NULL REFERENCES public.kpi_periods(id) ON DELETE CASCADE,
  evaluation_id UUID NOT NULL REFERENCES public.kpi_evaluations(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.nhan_vien(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.cua_hang(id) ON DELETE CASCADE,
  position_id UUID REFERENCES public.chuc_vu(id) ON DELETE SET NULL,
  subject_role VARCHAR(32) NOT NULL CHECK (subject_role IN ('employee', 'shift_leader')),
  primary_reviewer_id UUID NOT NULL REFERENCES public.nhan_vien(id) ON DELETE RESTRICT,
  primary_reviewer_role VARCHAR(32) NOT NULL CHECK (primary_reviewer_role IN ('shift_leader', 'store_manager')),
  status VARCHAR(32) NOT NULL DEFAULT 'assignment_pending' CHECK (
    status IN (
      'assignment_pending',
      'collecting',
      'primary_review_pending',
      'manager_approval_pending',
      'published',
      'appeal_open',
      'locked'
    )
  ),
  assignment_deadline_at TIMESTAMPTZ,
  peer_deadline_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  appeal_deadline_at TIMESTAMPTZ,
  missing_peer_sample BOOLEAN NOT NULL DEFAULT FALSE,
  blocker_codes TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_kpi_monthly_review_period_emp UNIQUE (period_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_kpi_monthly_reviews_store_status ON public.kpi_monthly_reviews(store_id, status);
CREATE INDEX IF NOT EXISTS idx_kpi_monthly_reviews_emp_period ON public.kpi_monthly_reviews(employee_id, period_id);

CREATE TABLE IF NOT EXISTS public.kpi_peer_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_review_id UUID NOT NULL REFERENCES public.kpi_monthly_reviews(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.nhan_vien(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL DEFAULT 1,
  shared_shift_count INTEGER NOT NULL DEFAULT 0,
  total_shift_count INTEGER NOT NULL DEFAULT 0,
  selected_by VARCHAR(16) NOT NULL CHECK (selected_by IN ('system', 'manager')),
  selected_by_actor_id UUID REFERENCES public.nhan_vien(id) ON DELETE SET NULL,
  selection_reason TEXT,
  status VARCHAR(16) NOT NULL DEFAULT 'assigned' CHECK (
    status IN ('candidate', 'assigned', 'submitted', 'expired', 'replaced')
  ),
  assigned_at TIMESTAMPTZ,
  deadline_at TIMESTAMPTZ,
  replacement_for_assignment_id UUID REFERENCES public.kpi_peer_assignments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_kpi_peer_assignment_review_reviewer UNIQUE (monthly_review_id, reviewer_id)
);

CREATE INDEX IF NOT EXISTS idx_kpi_peer_assignments_reviewer_status ON public.kpi_peer_assignments(reviewer_id, status, deadline_at);

CREATE TABLE IF NOT EXISTS public.kpi_peer_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL UNIQUE REFERENCES public.kpi_peer_assignments(id) ON DELETE CASCADE,
  monthly_review_id UUID NOT NULL REFERENCES public.kpi_monthly_reviews(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.nhan_vien(id) ON DELETE CASCADE,
  strength_note TEXT NOT NULL,
  improvement_note TEXT NOT NULL,
  direct_observation_confirmed BOOLEAN NOT NULL DEFAULT TRUE,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kpi_peer_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES public.kpi_peer_responses(id) ON DELETE CASCADE,
  question_code VARCHAR(32) NOT NULL CHECK (
    question_code IN (
      'peak_teamwork',
      'proactive_support',
      'shift_handover',
      'hygiene_process',
      'team_communication'
    )
  ),
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  observed_date DATE,
  situation_code VARCHAR(64),
  evidence_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_kpi_peer_answers_response_q UNIQUE (response_id, question_code)
);

CREATE TABLE IF NOT EXISTS public.kpi_peer_aggregates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_review_id UUID NOT NULL UNIQUE REFERENCES public.kpi_monthly_reviews(id) ON DELETE CASCADE,
  valid_response_count INTEGER NOT NULL DEFAULT 0,
  enough_anonymous_sample BOOLEAN NOT NULL DEFAULT FALSE,
  question_scores JSONB NOT NULL DEFAULT '[]',
  total_score NUMERIC(4, 2),
  strength_summary TEXT,
  improvement_summary TEXT,
  configured_weight_percent INTEGER NOT NULL DEFAULT 10,
  applied_peer_weight_percent INTEGER NOT NULL DEFAULT 10,
  fallback_primary_weight_percent INTEGER NOT NULL DEFAULT 0,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kpi_evaluation_integrity_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_review_id UUID NOT NULL REFERENCES public.kpi_monthly_reviews(id) ON DELETE CASCADE,
  code VARCHAR(64) NOT NULL CHECK (
    code IN (
      'RECIPROCAL_PAIR',
      'REPEATED_PAIR',
      'IDENTICAL_RESPONSES',
      'EXTREME_WITH_WEAK_EVIDENCE',
      'SOURCE_DIVERGENCE',
      'MANAGER_OVERRIDE_PATTERN',
      'REVIEWER_BIAS_PATTERN'
    )
  ),
  severity VARCHAR(16) NOT NULL CHECK (severity IN ('info', 'warning', 'blocking')),
  evidence_refs TEXT[] NOT NULL DEFAULT '{}',
  status VARCHAR(16) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'dismissed', 'confirmed')),
  resolved_by UUID REFERENCES public.nhan_vien(id) ON DELETE SET NULL,
  resolution_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.kpi_evaluation_notification_events (
  id VARCHAR(128) PRIMARY KEY,
  monthly_review_id UUID NOT NULL REFERENCES public.kpi_monthly_reviews(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.nhan_vien(id) ON DELETE CASCADE,
  type VARCHAR(64) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
