-- ============================================================
-- HOMIES MILK TEA 🧋 — SCHEMA MIGRATION v4.0
-- Bảng Quy tắc phân ca & Cảnh báo (quy_tac_xep_ca & ngoai_le_quy_tac)
-- Chạy trên Supabase / PostgreSQL (Idempotent / Chạy lại không bị lỗi)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. BẢNG QUY TẮC XẾP CA (quy_tac_xep_ca)
-- ============================================================
CREATE TABLE IF NOT EXISTS quy_tac_xep_ca (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_key        VARCHAR(50) NOT NULL UNIQUE,
    label           TEXT NOT NULL,
    description     TEXT,
    warning_value   DECIMAL(10, 2) DEFAULT 0,
    block_value     DECIMAL(10, 2) DEFAULT 0,
    warning_level   VARCHAR(20) DEFAULT 'warning',
    is_active       BOOLEAN DEFAULT TRUE,
    ngay_tao        TIMESTAMPTZ DEFAULT NOW(),
    ngay_cap_nhat   TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE quy_tac_xep_ca ENABLE ROW LEVEL SECURITY;

-- Policy RLS: authenticated users can read; schedule admins can modify.
DROP POLICY IF EXISTS "policy_quy_tac_xep_ca_select" ON quy_tac_xep_ca;
CREATE POLICY "policy_quy_tac_xep_ca_select" ON quy_tac_xep_ca
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "policy_quy_tac_xep_ca_all" ON quy_tac_xep_ca;
CREATE POLICY "policy_quy_tac_xep_ca_all" ON quy_tac_xep_ca
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.nhan_vien AS nv
        WHERE nv.auth_id = auth.uid()
          AND nv.vai_tro::TEXT IN ('quan_ly_cua_hang', 'quan_ly_khu_vuc', 'quan_tri_hr', 'ban_giam_doc')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.nhan_vien AS nv
        WHERE nv.auth_id = auth.uid()
          AND nv.vai_tro::TEXT IN ('quan_ly_cua_hang', 'quan_ly_khu_vuc', 'quan_tri_hr', 'ban_giam_doc')
      )
    );

-- ============================================================
-- 2. BẢNG NGOẠI LỆ QUY TẮC THEO VỊ TRÍ (ngoai_le_quy_tac)
-- ============================================================
CREATE TABLE IF NOT EXISTS ngoai_le_quy_tac (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_key            VARCHAR(50) NOT NULL,
    position_id         VARCHAR(50),
    season_id           VARCHAR(50),
    override_warning    DECIMAL(10, 2) DEFAULT 0,
    override_block      DECIMAL(10, 2) DEFAULT 0,
    ngay_tao            TIMESTAMPTZ DEFAULT NOW(),
    ngay_cap_nhat       TIMESTAMPTZ DEFAULT NOW()
);

-- Bật RLS
ALTER TABLE ngoai_le_quy_tac ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "policy_ngoai_le_quy_tac_select" ON ngoai_le_quy_tac;
CREATE POLICY "policy_ngoai_le_quy_tac_select" ON ngoai_le_quy_tac
    FOR SELECT TO authenticated
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "policy_ngoai_le_quy_tac_all" ON ngoai_le_quy_tac;
CREATE POLICY "policy_ngoai_le_quy_tac_all" ON ngoai_le_quy_tac
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1
        FROM public.nhan_vien AS nv
        WHERE nv.auth_id = auth.uid()
          AND nv.vai_tro::TEXT IN ('quan_ly_cua_hang', 'quan_ly_khu_vuc', 'quan_tri_hr', 'ban_giam_doc')
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM public.nhan_vien AS nv
        WHERE nv.auth_id = auth.uid()
          AND nv.vai_tro::TEXT IN ('quan_ly_cua_hang', 'quan_ly_khu_vuc', 'quan_tri_hr', 'ban_giam_doc')
      )
    );

REVOKE ALL ON TABLE quy_tac_xep_ca, ngoai_le_quy_tac FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE quy_tac_xep_ca, ngoai_le_quy_tac TO authenticated;

-- ============================================================
-- 3. SEED DỮ LIỆU MẶC ĐỊNH CHO BẢNG QUY TẮC
-- ============================================================
INSERT INTO quy_tac_xep_ca (rule_key, label, description, warning_value, block_value, warning_level, is_active)
VALUES
  ('clopening', 'Clopening (Đóng–Mở)', 'NV làm ca tối rồi ca sáng hôm sau, nghỉ không đủ giờ', 8, 6, 'warning', true),
  ('max_weekly_hours_warn', 'Overtime tuần (cảnh báo)', 'Tổng giờ/tuần vượt ngưỡng cảnh báo', 40, 40, 'warning', true),
  ('max_weekly_hours_block', 'Overtime tuần (chặn)', 'Tổng giờ/tuần vượt ngưỡng tối đa', 48, 48, 'block', true),
  ('max_daily_hours', 'Overtime ngày', 'Tổng giờ/ngày vượt ngưỡng', 10, 12, 'warning', true),
  ('max_consecutive_days', 'Ngày làm liên tục', 'Làm quá nhiều ngày liên tiếp không nghỉ', 5, 6, 'warning', true),
  ('max_shifts_per_day', 'Ca liên tiếp trong ngày', 'Chỉ làm max số ca 1 ngày', 2, 3, 'info', false),
  ('night_shift_restriction', 'Ca đêm cho NV đặc biệt', 'NV dưới 18 tuổi không được làm ca đêm', 0, 0, 'block', true)
ON CONFLICT (rule_key) DO UPDATE SET
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  warning_value = EXCLUDED.warning_value,
  block_value = EXCLUDED.block_value,
  warning_level = EXCLUDED.warning_level,
  is_active = EXCLUDED.is_active;

-- ============================================================
-- ✅ MIGRATION v4.0 COMPLETE
-- ============================================================
