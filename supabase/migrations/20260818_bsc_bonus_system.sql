-- ============================================================
-- HOMIES MILK TEA 🧋 — BSC BONUS SYSTEM MIGRATION SCHEMA
-- Database: Supabase / PostgreSQL
-- Version: v1.0.0
-- Created: 2026-08-18
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS bsc_muc_tieu_doanh_thu (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cua_hang_id TEXT NOT NULL DEFAULT 'store-001',
    ten_cua_hang TEXT NOT NULL DEFAULT 'Homies Hồ Bá Phấn',
    ky_luong_id TEXT NOT NULL,
    moc_hoa_von_ngay BIGINT NOT NULL DEFAULT 6500000,
    doanh_thu_trung_binh_ngay BIGINT NOT NULL DEFAULT 7000000,
    target_ngay BIGINT NOT NULL DEFAULT 8000000,
    target_thang BIGINT NOT NULL DEFAULT 248000000,
    so_ngay_trong_thang INTEGER NOT NULL DEFAULT 31,
    doanh_thu_thuc_te_thang BIGINT NOT NULL DEFAULT 255440000,
    doanh_thu_thuc_te_ngay BIGINT NOT NULL DEFAULT 8240000,
    mo_thuong BOOLEAN NOT NULL DEFAULT true,
    cogs_dinh_muc BIGINT NOT NULL DEFAULT 85000000,
    cogs_thuc_te BIGINT NOT NULL DEFAULT 87125000,
    vi_pham_attp BOOLEAN NOT NULL DEFAULT false,
    moc_gio_toi_thieu INTEGER NOT NULL DEFAULT 110,
    trang_thai_duyet TEXT NOT NULL DEFAULT 'draft',
    nguoi_duyet TEXT,
    ngay_duyet TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_bsc_target_store_period UNIQUE (cua_hang_id, ky_luong_id)
);

CREATE TABLE IF NOT EXISTS bsc_loi_van_hanh (
    id TEXT PRIMARY KEY,
    event_id TEXT UNIQUE,
    store_id TEXT NOT NULL DEFAULT 'store-001',
    period TEXT NOT NULL,
    shift_name TEXT,
    group_key TEXT NOT NULL,
    group_name TEXT NOT NULL,
    sub_error_id TEXT,
    sub_error_name TEXT,
    example TEXT,
    points INTEGER NOT NULL DEFAULT 1,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    source_type TEXT DEFAULT 'internal',
    order_code TEXT,
    evidence_type TEXT DEFAULT 'note',
    evidence_note TEXT,
    verifier_name TEXT,
    scope_reason TEXT,
    approval_status TEXT NOT NULL DEFAULT 'proposed_manager',
    affects_op_score BOOLEAN NOT NULL DEFAULT true,
    affects_customer_score BOOLEAN DEFAULT false,
    affects_personal_multiplier BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bsc_loi_ca_nhan (
    id TEXT PRIMARY KEY,
    employee_id TEXT NOT NULL,
    employee_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    store_id TEXT NOT NULL DEFAULT 'store-001',
    period TEXT NOT NULL,
    work_hours NUMERIC(6, 2) NOT NULL DEFAULT 120,
    error_record JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bsc_cau_hinh_tieu_chi (
    key TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    weight NUMERIC(4, 2) NOT NULL,
    weight_percent_label TEXT NOT NULL,
    description TEXT,
    how_to_excel TEXT,
    icon TEXT DEFAULT 'TrendingUp',
    color TEXT DEFAULT '#2F6FA8',
    is_active BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bsc_bac_thuong (
    id TEXT PRIMARY KEY,
    min_score NUMERIC(3, 2) NOT NULL,
    max_score NUMERIC(3, 2) NOT NULL,
    bonus_percent INTEGER NOT NULL,
    label TEXT NOT NULL,
    badge_color TEXT DEFAULT 'bg-blue-100 text-blue-900 border-blue-300',
    sort_order INTEGER DEFAULT 1
);

INSERT INTO bsc_cau_hinh_tieu_chi (key, name, weight, weight_percent_label, description, how_to_excel, icon, color)
VALUES
    ('revenue', 'Doanh thu', 0.35, '35%', 'Doanh thu so với target tháng.', 'Làm đơn đúng, nhanh, hỗ trợ bán hàng, giữ trải nghiệm để khách quay lại.', 'TrendingUp', '#2F6FA8'),
    ('operation', 'Vận hành', 0.30, '30%', 'Tổng điểm lỗi sai đơn, thiếu đồ, đóng gói, checklist, bàn giao trong tháng.', 'Kiểm đơn trước khi giao, quầy sạch gọn, báo lỗi rõ.', 'Settings', '#D97706'),
    ('waste', 'Học tập & Kỷ luật', 0.20, '20%', 'Đúng giờ, check-in chuẩn, hoàn thành bài test & quy chuẩn chuỗi.', 'Đi làm đúng giờ, tuân thủ kỷ luật ca, hoàn thành đào tạo.', 'Package', '#1E9E57'),
    ('customer', 'Khách hàng', 0.15, '15%', 'Tổng điểm khảo sát QR (50%) + phản ánh nền tảng có nội dung (50%).', 'Thái độ tốt, đóng gói chắc, xử lý phản ánh lịch sự.', 'Users', '#2F6FA8')
ON CONFLICT (key) DO UPDATE SET weight = EXCLUDED.weight, weight_percent_label = EXCLUDED.weight_percent_label;

INSERT INTO bsc_bac_thuong (id, min_score, max_score, bonus_percent, label, badge_color, sort_order)
VALUES
    ('tier-1', 4.80, 5.00, 120, 'Vượt Trội (Thưởng 120%)', 'bg-emerald-100 text-emerald-900 border-emerald-300', 1),
    ('tier-2', 4.00, 4.79, 100, 'Đạt Chuẩn (Thưởng 100%)', 'bg-blue-100 text-blue-900 border-blue-300', 2),
    ('tier-3', 3.00, 3.99, 70, 'Mức Khá (Thưởng 70%)', 'bg-amber-100 text-amber-900 border-amber-300', 3),
    ('tier-4', 2.00, 2.99, 40, 'Mức Trung Bình (Thưởng 40%)', 'bg-orange-100 text-orange-900 border-orange-300', 4),
    ('tier-5', 0.00, 1.99, 0, 'Không Đạt (Thưởng 0%)', 'bg-rose-100 text-rose-900 border-rose-300', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO bsc_muc_tieu_doanh_thu (
    cua_hang_id, ten_cua_hang, ky_luong_id, moc_hoa_von_ngay, doanh_thu_trung_binh_ngay,
    target_ngay, target_thang, so_ngay_trong_thang, doanh_thu_thuc_te_thang, doanh_thu_thuc_te_ngay,
    mo_thuong, cogs_dinh_muc, cogs_thuc_te, vi_pham_attp, moc_gio_toi_thieu,
    trang_thai_duyet, nguoi_duyet, ngay_duyet
) VALUES
(
    'store-001', 'Homies Hồ Bá Phấn', '2026-07', 6500000, 7000000,
    8000000, 248000000, 31, 255440000, 8240000,
    true, 85000000, 87125000, false, 110,
    'approved_published', 'CEO Nguyễn Đức Nghĩa', NOW()
),
(
    'store-001', 'Homies Hồ Bá Phấn', '2026-06', 6500000, 6900000,
    8000000, 240000000, 30, 249600000, 8320000,
    true, 80000000, 81600000, false, 110,
    'approved_published', 'CEO Nguyễn Đức Nghĩa', NOW() - INTERVAL '1 month'
),
(
    'store-002', 'Homies Chi Nhánh 429', '2026-07', 6500000, 7000000,
    7500000, 232500000, 31, 241800000, 7800000,
    true, 80000000, 82000000, false, 110,
    'approved_published', 'CEO Nguyễn Đức Nghĩa', NOW()
)
ON CONFLICT (cua_hang_id, ky_luong_id) DO UPDATE SET
    moc_gio_toi_thieu = 110,
    doanh_thu_thuc_te_thang = EXCLUDED.doanh_thu_thuc_te_thang,
    doanh_thu_thuc_te_ngay = EXCLUDED.doanh_thu_thuc_te_ngay;
