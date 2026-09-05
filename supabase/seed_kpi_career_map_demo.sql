-- Homies HRM - KPI Career Map Seed Demo
-- Created at: 2026-08-24
-- Target: Supabase Postgres (Idempotent Demo Data)

DO $$
DECLARE
  v_map_id UUID := '00000000-0000-0000-0000-000000000001';
  v_node_b1 UUID := '00000000-0000-0000-0001-000000000001';
  v_node_b2 UUID := '00000000-0000-0000-0001-000000000002';
  v_node_c1 UUID := '00000000-0000-0000-0001-000000000003';
  v_node_c2 UUID := '00000000-0000-0000-0001-000000000004';
  v_node_s1 UUID := '00000000-0000-0000-0001-000000000005';
  v_node_s2 UUID := '00000000-0000-0000-0001-000000000006';
  v_node_k1 UUID := '00000000-0000-0000-0001-000000000007';
  v_node_k2 UUID := '00000000-0000-0000-0001-000000000008';
  v_node_sl UUID := '00000000-0000-0000-0001-000000000009';
  v_node_sm UUID := '00000000-0000-0000-0001-000000000010';
BEGIN
  -- 1. Insert or update published career map
  INSERT INTO public.kpi_career_map_versions (
    id, version, status, scope, effective_from, master_position_snapshot, created_at, updated_at
  ) VALUES (
    v_map_id,
    1,
    'published',
    'chain',
    '2026-08-01',
    '[
      {"id": "pos_b1", "name": "Pha chế C1", "level": 1, "job_family": "barista"},
      {"id": "pos_b2", "name": "Pha chế C2", "level": 2, "job_family": "barista"},
      {"id": "pos_c1", "name": "Thu ngân C1", "level": 1, "job_family": "cashier"},
      {"id": "pos_c2", "name": "Thu ngân C2", "level": 2, "job_family": "cashier"},
      {"id": "pos_s1", "name": "Phục vụ C1", "level": 1, "job_family": "service"},
      {"id": "pos_s2", "name": "Phục vụ C2", "level": 2, "job_family": "service"},
      {"id": "pos_k1", "name": "Bếp C1", "level": 1, "job_family": "kitchen"},
      {"id": "pos_k2", "name": "Bếp C2", "level": 2, "job_family": "kitchen"},
      {"id": "pos_sl", "name": "Trưởng ca", "level": 3, "job_family": "management"},
      {"id": "pos_sm", "name": "Quản lý cửa hàng", "level": 4, "job_family": "management"}
    ]'::jsonb,
    '2026-08-01T08:00:00.000Z',
    '2026-08-01T09:00:00.000Z'
  )
  ON CONFLICT (id) DO UPDATE SET
    status = 'published',
    effective_from = '2026-08-01',
    updated_at = now();

  -- 2. Nodes
  INSERT INTO public.kpi_career_map_nodes (id, career_map_version_id, position_id, position_name_snapshot, position_level_snapshot, job_family, x, y, active)
  VALUES
    (v_node_b1, v_map_id, 'pos_b1', 'Pha chế C1', 1, 'barista', 50, 50, true),
    (v_node_b2, v_map_id, 'pos_b2', 'Pha chế C2', 2, 'barista', 260, 50, true),
    (v_node_c1, v_map_id, 'pos_c1', 'Thu ngân C1', 1, 'cashier', 50, 150, true),
    (v_node_c2, v_map_id, 'pos_c2', 'Thu ngân C2', 2, 'cashier', 260, 150, true),
    (v_node_s1, v_map_id, 'pos_s1', 'Phục vụ C1', 1, 'service', 50, 250, true),
    (v_node_s2, v_map_id, 'pos_s2', 'Phục vụ C2', 2, 'service', 260, 250, true),
    (v_node_k1, v_map_id, 'pos_k1', 'Bếp C1', 1, 'kitchen', 50, 350, true),
    (v_node_k2, v_map_id, 'pos_k2', 'Bếp C2', 2, 'kitchen', 260, 350, true),
    (v_node_sl, v_map_id, 'pos_sl', 'Trưởng ca', 3, 'management', 480, 200, true),
    (v_node_sm, v_map_id, 'pos_sm', 'Quản lý cửa hàng', 4, 'management', 700, 200, true)
  ON CONFLICT (career_map_version_id, position_id) DO UPDATE SET
    position_name_snapshot = EXCLUDED.position_name_snapshot,
    position_level_snapshot = EXCLUDED.position_level_snapshot,
    job_family = EXCLUDED.job_family,
    x = EXCLUDED.x,
    y = EXCLUDED.y;

  -- 3. Edges
  INSERT INTO public.kpi_career_map_edges (career_map_version_id, source_node_id, target_node_id, preset_key, preset_version, active)
  VALUES
    (v_map_id, v_node_b1, v_node_b2, 'same_profession_level_up', 1, true),
    (v_map_id, v_node_b2, v_node_sl, 'to_shift_leader', 1, true),
    (v_map_id, v_node_c1, v_node_c2, 'same_profession_level_up', 1, true),
    (v_map_id, v_node_c2, v_node_sl, 'to_shift_leader', 1, true),
    (v_map_id, v_node_s1, v_node_s2, 'same_profession_level_up', 1, true),
    (v_map_id, v_node_s2, v_node_sl, 'to_shift_leader', 1, true),
    (v_map_id, v_node_k1, v_node_k2, 'same_profession_level_up', 1, true),
    (v_map_id, v_node_k2, v_node_sl, 'to_shift_leader', 1, true),
    (v_map_id, v_node_sl, v_node_sm, 'to_store_manager', 1, true)
  ON CONFLICT (career_map_version_id, source_node_id, target_node_id) DO NOTHING;

END $$;
