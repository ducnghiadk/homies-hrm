-- Migration: 20260825_kpi_multiskill_career_grade.sql
-- Goal: Schema grade/skill/certification cho mô hình Nhân viên Đa Năng Homies

-- 1. Bảng danh mục kỹ năng vận hành (Operational Skills)
CREATE TABLE IF NOT EXISTS public.kpi_operational_skills (
  code VARCHAR(32) PRIMARY KEY,
  label VARCHAR(128) NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Bảng danh mục cấp bậc năng lực đa năng (Career Grades C1-C5)
CREATE TABLE IF NOT EXISTS public.kpi_career_grades (
  code VARCHAR(16) PRIMARY KEY,
  rank INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 5),
  label VARCHAR(128) NOT NULL,
  position_key VARCHAR(32) NOT NULL,
  required_skill_codes TEXT[] NOT NULL DEFAULT '{}',
  management BOOLEAN NOT NULL DEFAULT FALSE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Bảng chứng nhận kỹ năng nhân viên (Employee Skill Certifications)
CREATE TABLE IF NOT EXISTS public.kpi_employee_skill_certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.nhan_vien(id) ON DELETE RESTRICT,
  skill_code VARCHAR(32) NOT NULL REFERENCES public.kpi_operational_skills(code) ON DELETE RESTRICT,
  status VARCHAR(16) NOT NULL CHECK (status IN ('not_started','learning','achieved','expired')),
  assessed_at DATE,
  assessed_by UUID REFERENCES public.nhan_vien(id) ON DELETE SET NULL,
  score NUMERIC,
  evidence_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
  standard_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (employee_id, skill_code, standard_version)
);

-- 4. Bổ sung các cột grade vào kpi_career_map_nodes
ALTER TABLE public.kpi_career_map_nodes
  ADD COLUMN IF NOT EXISTS grade_code VARCHAR(16) REFERENCES public.kpi_career_grades(code) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS grade_name_snapshot VARCHAR(128);

-- Cập nhật unique constraint cho nodes cho phép cùng position_id nếu khác grade_code
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kpi_career_map_nodes_version_pos_key'
  ) THEN
    ALTER TABLE public.kpi_career_map_nodes DROP CONSTRAINT kpi_career_map_nodes_version_pos_key;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kpi_career_map_nodes_version_pos_grade_key'
  ) THEN
    ALTER TABLE public.kpi_career_map_nodes
      ADD CONSTRAINT kpi_career_map_nodes_version_pos_grade_key UNIQUE (career_map_version_id, position_id, grade_code);
  END IF;
END $$;

-- 5. Bổ sung grade_codes vào kpi_position_criteria_profiles
ALTER TABLE public.kpi_position_criteria_profiles
  ADD COLUMN IF NOT EXISTS grade_codes TEXT[] NOT NULL DEFAULT '{}';

-- 6. Bổ sung grade_code và khoảng hiệu lực vào kpi_career_employee_placements
ALTER TABLE public.kpi_career_employee_placements
  ADD COLUMN IF NOT EXISTS grade_code VARCHAR(16) REFERENCES public.kpi_career_grades(code) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS effective_from DATE,
  ADD COLUMN IF NOT EXISTS effective_to DATE,
  ADD COLUMN IF NOT EXISTS decision_id UUID;

-- Placement phải lưu được các trạng thái fail-closed do domain phát sinh.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kpi_career_employee_placements_unresolved_reason_check'
  ) THEN
    ALTER TABLE public.kpi_career_employee_placements
      DROP CONSTRAINT kpi_career_employee_placements_unresolved_reason_check;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'kpi_career_placements_unresolved_reason_check'
  ) THEN
    ALTER TABLE public.kpi_career_employee_placements
      ADD CONSTRAINT kpi_career_placements_unresolved_reason_check CHECK (
        unresolved_reason IS NULL OR unresolved_reason IN (
          'position_not_in_map',
          'missing_level',
          'inactive_position',
          'conflicting_positions',
          'missing_grade_code',
          'missing_skill_certification',
          'missing_grade_decision',
          'grade_not_in_map'
        )
      );
  END IF;
END $$;

-- 7. Seed dữ liệu mặc định ban đầu cho kỹ năng và cấp bậc Homies
INSERT INTO public.kpi_operational_skills (code, label, active)
VALUES
  ('barista', 'Pha chế', true),
  ('cashier', 'Thu ngân', true)
ON CONFLICT (code) DO UPDATE
SET label = EXCLUDED.label, active = EXCLUDED.active;

INSERT INTO public.kpi_career_grades (code, rank, label, position_key, required_skill_codes, management, active)
VALUES
  ('c1_pc', 1, 'C1 - Pha chế', 'store_employee', ARRAY['barista'], false, true),
  ('c1_tn', 1, 'C1 - Thu ngân', 'store_employee', ARRAY['cashier'], false, true),
  ('c2', 2, 'C2 - Nhân viên đa năng', 'store_employee', ARRAY['barista', 'cashier'], false, true),
  ('c3', 3, 'C3 - Senior', 'store_employee', ARRAY['barista', 'cashier'], false, true),
  ('c4', 4, 'C4 - Trưởng ca', 'shift_leader', ARRAY['barista', 'cashier'], true, true),
  ('c5', 5, 'C5 - Quản lý cửa hàng', 'store_manager', ARRAY['barista', 'cashier'], true, true)
ON CONFLICT (code) DO UPDATE
SET
  rank = EXCLUDED.rank,
  label = EXCLUDED.label,
  position_key = EXCLUDED.position_key,
  required_skill_codes = EXCLUDED.required_skill_codes,
  management = EXCLUDED.management,
  active = EXCLUDED.active;
