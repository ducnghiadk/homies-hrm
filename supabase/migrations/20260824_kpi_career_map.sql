-- Homies HRM - KPI Career Map Drag-and-Drop Schema Migration
-- Created at: 2026-08-24
-- Target: Supabase Postgres

CREATE TABLE IF NOT EXISTS public.kpi_career_map_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(32) NOT NULL DEFAULT 'draft' CHECK (
    status IN ('draft', 'pending_approval', 'published', 'returned', 'superseded')
  ),
  scope VARCHAR(16) NOT NULL DEFAULT 'chain' CHECK (scope = 'chain'),
  effective_from DATE,
  created_by UUID REFERENCES public.nhan_vien(id) ON DELETE SET NULL,
  approved_by UUID REFERENCES public.nhan_vien(id) ON DELETE SET NULL,
  returned_reason TEXT,
  based_on_version_id UUID REFERENCES public.kpi_career_map_versions(id) ON DELETE SET NULL,
  master_position_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb,
  transition_presets JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kpi_career_map_status ON public.kpi_career_map_versions(status);
CREATE INDEX IF NOT EXISTS idx_kpi_career_map_effective ON public.kpi_career_map_versions(effective_from);

CREATE TABLE IF NOT EXISTS public.kpi_career_map_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_map_version_id UUID NOT NULL REFERENCES public.kpi_career_map_versions(id) ON DELETE CASCADE,
  position_id VARCHAR(64) NOT NULL,
  position_name_snapshot VARCHAR(128) NOT NULL,
  position_level_snapshot INTEGER NOT NULL CHECK (position_level_snapshot > 0),
  job_family VARCHAR(64) NOT NULL,
  x NUMERIC NOT NULL DEFAULT 0,
  y NUMERIC NOT NULL DEFAULT 0,
  criteria_profile_id VARCHAR(64),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_career_map_node_pos UNIQUE (career_map_version_id, position_id)
);

CREATE INDEX IF NOT EXISTS idx_kpi_career_map_nodes_map ON public.kpi_career_map_nodes(career_map_version_id);

CREATE TABLE IF NOT EXISTS public.kpi_career_map_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_map_version_id UUID NOT NULL REFERENCES public.kpi_career_map_versions(id) ON DELETE CASCADE,
  source_node_id UUID NOT NULL REFERENCES public.kpi_career_map_nodes(id) ON DELETE CASCADE,
  target_node_id UUID NOT NULL REFERENCES public.kpi_career_map_nodes(id) ON DELETE CASCADE,
  preset_key VARCHAR(64) NOT NULL CHECK (
    preset_key IN ('same_profession_level_up', 'to_senior_employee', 'to_shift_leader', 'to_store_manager')
  ),
  preset_version INTEGER NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_edge_distinct_nodes CHECK (source_node_id <> target_node_id),
  CONSTRAINT uq_career_map_edge UNIQUE (career_map_version_id, source_node_id, target_node_id)
);

CREATE INDEX IF NOT EXISTS idx_kpi_career_map_edges_map ON public.kpi_career_map_edges(career_map_version_id);

CREATE TABLE IF NOT EXISTS public.kpi_position_criteria_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_ids TEXT[] NOT NULL DEFAULT '{}',
  job_family VARCHAR(64),
  version INTEGER NOT NULL DEFAULT 1,
  effective_from DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.kpi_position_criteria_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.kpi_position_criteria_profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  source VARCHAR(32) NOT NULL DEFAULT 'homies_recommended' CHECK (
    source IN ('homies_recommended', 'fnb_common', 'similar_position', 'custom')
  ),
  evidence_source VARCHAR(32) NOT NULL CHECK (
    evidence_source IN ('pos', 'checklist', 'shift_log', 'manager_rating', 'peer_review', 'other')
  ),
  direction VARCHAR(32) NOT NULL CHECK (
    direction IN ('higher_is_better', 'lower_is_better', 'rubric')
  ),
  unit VARCHAR(32),
  pass_target VARCHAR(64),
  suggested_weight INTEGER NOT NULL DEFAULT 20,
  weight INTEGER NOT NULL DEFAULT 20,
  locked BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  importance VARCHAR(16) DEFAULT 'medium' CHECK (importance IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kpi_criteria_items_profile ON public.kpi_position_criteria_items(profile_id);

CREATE TABLE IF NOT EXISTS public.kpi_career_employee_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_map_version_id UUID NOT NULL REFERENCES public.kpi_career_map_versions(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES public.nhan_vien(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES public.cua_hang(id) ON DELETE CASCADE,
  position_id VARCHAR(64) NOT NULL,
  node_id UUID REFERENCES public.kpi_career_map_nodes(id) ON DELETE SET NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'unresolved')),
  unresolved_reason VARCHAR(32) CHECK (
    unresolved_reason IN ('position_not_in_map', 'missing_level', 'inactive_position', 'conflicting_positions')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_career_map_employee UNIQUE (career_map_version_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_kpi_placements_map ON public.kpi_career_employee_placements(career_map_version_id);
CREATE INDEX IF NOT EXISTS idx_kpi_placements_emp ON public.kpi_career_employee_placements(employee_id);

CREATE TABLE IF NOT EXISTS public.kpi_career_map_approval_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  career_map_version_id UUID NOT NULL REFERENCES public.kpi_career_map_versions(id) ON DELETE CASCADE,
  action VARCHAR(16) NOT NULL CHECK (action IN ('submit', 'return', 'publish')),
  actor_id UUID NOT NULL REFERENCES public.nhan_vien(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kpi_approval_logs_map ON public.kpi_career_map_approval_logs(career_map_version_id);

-- Trigger: Ensure career map edges only connect level n to level n + 1 and belong to the same map version
CREATE OR REPLACE FUNCTION public.check_career_map_edge_level()
RETURNS TRIGGER AS $$
DECLARE
  v_source_level INTEGER;
  v_target_level INTEGER;
  v_source_map_id UUID;
  v_target_map_id UUID;
BEGIN
  SELECT position_level_snapshot, career_map_version_id INTO v_source_level, v_source_map_id
  FROM public.kpi_career_map_nodes
  WHERE id = NEW.source_node_id;

  SELECT position_level_snapshot, career_map_version_id INTO v_target_level, v_target_map_id
  FROM public.kpi_career_map_nodes
  WHERE id = NEW.target_node_id;

  IF v_source_level IS NULL OR v_target_level IS NULL THEN
    RAISE EXCEPTION 'Source or target node does not exist in career map.';
  END IF;

  IF v_source_map_id <> NEW.career_map_version_id OR v_target_map_id <> NEW.career_map_version_id THEN
    RAISE EXCEPTION 'Cross-map edges are prohibited: source and target nodes must belong to career map version %.', NEW.career_map_version_id;
  END IF;

  IF v_target_level <> v_source_level + 1 THEN
    RAISE EXCEPTION 'Invalid career map edge: target level (%) must be exactly source level (%) + 1.', v_target_level, v_source_level;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_check_career_map_edge_level ON public.kpi_career_map_edges;
CREATE TRIGGER trg_check_career_map_edge_level
  BEFORE INSERT OR UPDATE ON public.kpi_career_map_edges
  FOR EACH ROW
  EXECUTE FUNCTION public.check_career_map_edge_level();
