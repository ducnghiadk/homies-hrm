-- ============================================================
-- HOMIES MILK TEA 🧋 — MASTER SEED DATA v3.0 (CLEAN HOMIES STANDARD)
-- Chạy trên Supabase SQL Editor sau khi chạy schema_v3_master_fixed.sql và rls_v3_policies.sql
-- ============================================================

-- 1. TO CHUC
INSERT INTO to_chuc (id, ten, dia_chi, so_dien_thoai, email, ma_so_thue, cau_hinh) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'Trà Sữa Phô Mai Tươi HOMIES',
    '123 Đường Ba Tháng Hai, Quận 10, TP.HCM',
    '0909 123 456',
    'contact@homiesmilktea.vn',
    '0317654321',
    '{"working_hours_per_month": 208, "overtime_rate": 1.5, "late_penalty_per_minute": 5000, "currency": "VND"}'
)
ON CONFLICT (id) DO UPDATE SET
    ten = EXCLUDED.ten,
    dia_chi = EXCLUDED.dia_chi,
    so_dien_thoai = EXCLUDED.so_dien_thoai,
    email = EXCLUDED.email;

-- 2. CUA HANG (3 Chi nhánh Homies)
INSERT INTO cua_hang (id, to_chuc_id, ten, ma_cua_hang, dia_chi, so_dien_thoai, vi_do, kinh_do, ban_kinh_met, trang_thai) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Homies Milk Tea - Hồ Bá Phấn', 'ST-001', 'Hồ Bá Phấn, Phước Long A, TP. Thủ Đức, TP.HCM', '028 3821 1111', 10.7736000, 106.7024000, 150, 'hoat_dong'::trang_thai_cua_hang),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Homies Milk Tea - Đường 429',   'ST-002', '429 Đường 429, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM', '028 3822 2222', 10.7845000, 106.6679000, 150, 'hoat_dong'::trang_thai_cua_hang),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Homies Milk Tea - Lê Văn Sỹ',   'ST-003', 'Lê Văn Sỹ, Phường 14, Quận 3, TP.HCM', '028 3823 3333', 10.7340000, 106.7220000, 150, 'hoat_dong'::trang_thai_cua_hang)
ON CONFLICT (id) DO UPDATE SET
    ten = EXCLUDED.ten,
    ma_cua_hang = EXCLUDED.ma_cua_hang,
    dia_chi = EXCLUDED.dia_chi;

-- 3. CHUC VU (Danh mục chức vụ chuẩn Homies)
INSERT INTO chuc_vu (id, to_chuc_id, ten, ma_chuc_vu, cap_bac, luong_co_ban) VALUES
('b0000000-0000-0000-0000-000000000008', 'a0000000-0000-0000-0000-000000000001', 'Chủ thương hiệu',         'POS-008', 10, 30000000),
('b0000000-0000-0000-0000-000000000009', 'a0000000-0000-0000-0000-000000000001', 'Quản lý nhân sự',         'POS-009', 6,  18000000),
('b0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'Quản lý điểm bán hàng',   'POS-006', 3,  12000000),
('b0000000-0000-0000-0000-000000000010', 'a0000000-0000-0000-0000-000000000001', 'Quản lý vùng',           'POS-010', 4,  15000000),
('b0000000-0000-0000-0000-000000000007', 'a0000000-0000-0000-0000-000000000001', 'Nhân viên',               'POS-007', 1,  5500000),
('b0000000-0000-0000-0000-000000000011', 'a0000000-0000-0000-0000-000000000001', 'Quản lý bộ phận',        'POS-011', 3,  12000000),
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Pha chế (Barista)',      'POS-001', 1,  5500000),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Thu ngân (Cashier)',      'POS-002', 1,  5000000),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Phục vụ (Server)',        'POS-003', 1,  5000000),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Trưởng ca',               'POS-004', 2,  7500000)
ON CONFLICT (id) DO UPDATE SET
    ten = EXCLUDED.ten,
    ma_chuc_vu = EXCLUDED.ma_chuc_vu,
    cap_bac = EXCLUDED.cap_bac,
    luong_co_ban = EXCLUDED.luong_co_ban;

-- 4. NHAN VIEN QUAN TRI
INSERT INTO nhan_vien (id, to_chuc_id, cua_hang_id, chuc_vu_id, ma_nhan_vien, email, so_dien_thoai, ho_ten, ngay_sinh, gioi_tinh, dia_chi, ngay_bat_dau_lam, loai_hop_dong, trang_thai, vai_tro, tong_diem, hang_thanh_vien) VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000008', 'BH-001', 'tuan@bobahouse.vn', '0901234567', 'Nguyễn Đức Nghĩa', '1988-10-12', 'nam'::gioi_tinh, 'Hồ Bá Phấn, TP. Thủ Đức', '2023-01-01', 'toan_thoi_gian'::loai_hop_dong, 'hoat_dong'::trang_thai_nhan_vien, 'ban_giam_doc'::vai_tro_nhan_vien, 5200, 'bach_kim'),
('e0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000009', 'BH-016', 'yen@bobahouse.vn',  '0956677889', 'Hoàng Thị Yến',   '1992-05-18', 'nu'::gioi_tinh,  'Hồ Bá Phấn, TP. Thủ Đức', '2023-02-01', 'toan_thoi_gian'::loai_hop_dong, 'hoat_dong'::trang_thai_nhan_vien, 'quan_tri_hr'::vai_tro_nhan_vien, 4100, 'bach_kim'),
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', 'BH-002', 'lan@bobahouse.vn',  '0912345678', 'Trần Thị Lan',    '1994-08-25', 'nu'::gioi_tinh,  'Hồ Bá Phấn, TP. Thủ Đức', '2023-03-15', 'toan_thoi_gian'::loai_hop_dong, 'hoat_dong'::trang_thai_nhan_vien, 'quan_ly_cua_hang'::vai_tro_nhan_vien, 3800, 'vang')
ON CONFLICT (id) DO UPDATE SET
    ho_ten = EXCLUDED.ho_ten,
    email = EXCLUDED.email,
    so_dien_thoai = EXCLUDED.so_dien_thoai,
    chuc_vu_id = EXCLUDED.chuc_vu_id,
    cua_hang_id = EXCLUDED.cua_hang_id,
    vai_tro = EXCLUDED.vai_tro;
