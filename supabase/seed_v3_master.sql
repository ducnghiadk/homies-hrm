-- ============================================================
-- HOMIES MILK TEA 🧋 — MASTER SEED DATA v3.0 (100% TIẾNG VIỆT KHÔNG DẤU)
-- Chạy SAU KHI nạp schema_v3_master_fixed.sql
-- ============================================================

-- ==============================
-- 1. TO CHUC
-- ==============================
INSERT INTO to_chuc (id, ten, dia_chi, so_dien_thoai, email, ma_so_thue, cau_hinh) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'Trà Sữa Homies',
    '123 Đường Ba Tháng Hai, Quận 10, TP.HCM',
    '0909 123 456',
    'contact@homiesmilktea.vn',
    '0317654321',
    '{"working_hours_per_month": 208, "overtime_rate": 1.5, "late_penalty_per_minute": 5000, "currency": "VND"}'
)
ON CONFLICT (id) DO NOTHING;

-- ==============================
-- 2. CHUC VU (5)
-- ==============================
INSERT INTO chuc_vu (id, to_chuc_id, ten, ma_chuc_vu, cap_bac, luong_co_ban) VALUES
('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Pha chế (Barista)',    'POS-001', 1,  5500000),
('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Thu ngân (Cashier)',    'POS-002', 1,  5000000),
('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Trưởng ca',             'POS-003', 3,  7000000),
('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Quản lý cửa hàng',      'POS-004', 5,  12000000),
('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Ban giám đốc',          'POS-005', 10, 25000000)
ON CONFLICT (id) DO NOTHING;

-- ==============================
-- 3. CUA HANG (3 Chi nhánh)
-- ==============================
INSERT INTO cua_hang (id, to_chuc_id, ten, ma_cua_hang, dia_chi, so_dien_thoai, vi_do, kinh_do, ban_kinh_met, trang_thai) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Homies Milk Tea - Quận 1', 'ST-001', '123 Nguyễn Huệ, Quận 1, TP.HCM',    '028 3821 1111', 10.7736000, 106.7024000, 100, 'hoat_dong'::trang_thai_cua_hang),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Homies Milk Tea - Quận 3', 'ST-002', '456 Lê Văn Sỹ, Quận 3, TP.HCM',      '028 3822 2222', 10.7845000, 106.6679000, 100, 'hoat_dong'::trang_thai_cua_hang),
('c0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Homies Milk Tea - Quận 7', 'ST-003', '789 Nguyễn Thị Thập, Quận 7, TP.HCM', '028 3823 3333', 10.7340000, 106.7220000, 120, 'hoat_dong'::trang_thai_cua_hang)
ON CONFLICT (id) DO NOTHING;

-- ==============================
-- 4. CA LAM (3 Ca mẫu)
-- ==============================
INSERT INTO ca_lam (id, to_chuc_id, ten, ma_ca, gio_bat_dau, gio_ket_thuc, phut_nghi, qua_dem, mau_hien_thi) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Ca Sáng',  'SHIFT_AM',    '07:00', '14:00', 30, FALSE, '#001D3D'),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Ca Chiều', 'SHIFT_PM',    '14:00', '21:00', 30, FALSE, '#2F6FA8'),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Ca Tối',   'SHIFT_NIGHT', '21:00', '02:00', 15, TRUE,  '#F6C85F')
ON CONFLICT (id) DO NOTHING;

-- ==============================
-- 5. NHAN VIEN
-- ==============================
DO $$
DECLARE
    pwd TEXT := '$2a$10$X7XkGk0NqPh5IYaOz7NFC.fP7KPLsIbHjElvCHQk3I5fVzjgL/hSe';
BEGIN

-- 1. CEO Nguyễn Minh Tuấn
INSERT INTO nhan_vien (id, to_chuc_id, cua_hang_id, chuc_vu_id, ma_nhan_vien, email, so_dien_thoai, mat_khau_hash, ho_ten, ngay_sinh, gioi_tinh, dia_chi, ngay_bat_dau_lam, loai_hop_dong, trang_thai, vai_tro, tong_diem, hang_thanh_vien) VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'BH-001', 'tuan@bobahouse.vn', '0901234567', pwd, 'Nguyễn Minh Tuấn', '1988-10-12', 'nam'::gioi_tinh, '10 Lê Lợi, Q.1', '2023-01-01', 'toan_thoi_gian'::loai_hop_dong, 'hoat_dong'::trang_thai_nhan_vien, 'ban_giam_doc'::vai_tro_nhan_vien, 5200, 'bach_kim')
ON CONFLICT (id) DO NOTHING;

-- 2. HR Admin Hoàng Thị Yến
INSERT INTO nhan_vien (id, to_chuc_id, cua_hang_id, chuc_vu_id, ma_nhan_vien, email, so_dien_thoai, mat_khau_hash, ho_ten, ngay_sinh, gioi_tinh, dia_chi, ngay_bat_dau_lam, loai_hop_dong, trang_thai, vai_tro, tong_diem, hang_thanh_vien) VALUES
('e0000000-0000-0000-0000-000000000016', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000005', 'BH-016', 'yen@bobahouse.vn', '0956677889', pwd, 'Hoàng Thị Yến', '1992-05-18', 'nu'::gioi_tinh, '20 Hàm Nghi, Q.1', '2023-02-01', 'toan_thoi_gian'::loai_hop_dong, 'hoat_dong'::trang_thai_nhan_vien, 'quan_tri_hr'::vai_tro_nhan_vien, 4100, 'bach_kim')
ON CONFLICT (id) DO NOTHING;

-- 3. Quản lý cửa hàng Trần Thị Lan
INSERT INTO nhan_vien (id, to_chuc_id, cua_hang_id, chuc_vu_id, ma_nhan_vien, email, so_dien_thoai, mat_khau_hash, ho_ten, ngay_sinh, gioi_tinh, dia_chi, ngay_bat_dau_lam, loai_hop_dong, trang_thai, vai_tro, tong_diem, hang_thanh_vien) VALUES
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', 'BH-002', 'lan@bobahouse.vn', '0912345678', pwd, 'Trần Thị Lan', '1994-08-25', 'nu'::gioi_tinh, '30 Lý Tự Trọng, Q.1', '2023-03-15', 'toan_thoi_gian'::loai_hop_dong, 'hoat_dong'::trang_thai_nhan_vien, 'quan_ly_cua_hang'::vai_tro_nhan_vien, 3800, 'vang')
ON CONFLICT (id) DO NOTHING;

-- 4. Nhân viên pha chế Võ Thanh Bình
INSERT INTO nhan_vien (id, to_chuc_id, cua_hang_id, chuc_vu_id, ma_nhan_vien, email, so_dien_thoai, mat_khau_hash, ho_ten, ngay_sinh, gioi_tinh, dia_chi, ngay_bat_dau_lam, loai_hop_dong, trang_thai, vai_tro, tong_diem, hang_thanh_vien) VALUES
('e0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'BH-005', 'binh@bobahouse.vn', '0945678901', pwd, 'Võ Thanh Bình', '2001-04-05', 'nam'::gioi_tinh, '45 Bùi Viện, Q.1', '2024-06-01', 'ban_thoi_gian'::loai_hop_dong, 'hoat_dong'::trang_thai_nhan_vien, 'nhan_vien'::vai_tro_nhan_vien, 1500, 'bac')
ON CONFLICT (id) DO NOTHING;

-- 5. Nhân viên thu ngân Nguyễn Thị Mai
INSERT INTO nhan_vien (id, to_chuc_id, cua_hang_id, chuc_vu_id, ma_nhan_vien, email, so_dien_thoai, mat_khau_hash, ho_ten, ngay_sinh, gioi_tinh, dia_chi, ngay_bat_dau_lam, loai_hop_dong, trang_thai, vai_tro, tong_diem, hang_thanh_vien) VALUES
('e0000000-0000-0000-0000-000000000006', 'a0000000-0000-0000-0000-000000000001', 'c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002', 'BH-006', 'mai@bobahouse.vn', '0956789012', pwd, 'Nguyễn Thị Mai', '2002-12-14', 'nu'::gioi_tinh, '88 Trần Hưng Đạo, Q.1', '2024-07-15', 'toan_thoi_gian'::loai_hop_dong, 'hoat_dong'::trang_thai_nhan_vien, 'nhan_vien'::vai_tro_nhan_vien, 980, 'dong')
ON CONFLICT (id) DO NOTHING;

-- Cập nhật Quản lý cửa hàng
UPDATE cua_hang SET quan_ly_id = 'e0000000-0000-0000-0000-000000000002' WHERE id = 'c0000000-0000-0000-0000-000000000001';

END $$;

-- ==============================
-- 6. LICH PHAN CA (Tuần này)
-- ==============================
DO $$
DECLARE
    d DATE;
    day_offset INT;
BEGIN
    FOR day_offset IN 0..5 LOOP
        d := date_trunc('week', CURRENT_DATE)::DATE + day_offset;

        -- Võ Thanh Bình (Ca Sáng)
        INSERT INTO lich_phan_ca (nhan_vien_id, cua_hang_id, ca_lam_id, ngay, trang_thai, nguoi_tao_id) VALUES
        ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', d, 'da_xep'::trang_thai_ca_lam, 'e0000000-0000-0000-0000-000000000002')
        ON CONFLICT DO NOTHING;

        -- Nguyễn Thị Mai (Ca Chiều)
        INSERT INTO lich_phan_ca (nhan_vien_id, cua_hang_id, ca_lam_id, ngay, trang_thai, nguoi_tao_id) VALUES
        ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', d, 'da_xep'::trang_thai_ca_lam, 'e0000000-0000-0000-0000-000000000002')
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- ==============================
-- 7. CHAM CONG (14 Ngày qua)
-- ==============================
DO $$
DECLARE
    d DATE;
    day_idx INT;
    rand_val FLOAT;
    checkin_dt TIMESTAMPTZ;
    checkout_dt TIMESTAMPTZ;
    late_mins INT;
    hrs DECIMAL;
BEGIN
    FOR day_idx IN 1..14 LOOP
        d := CURRENT_DATE - day_idx;
        IF EXTRACT(DOW FROM d) = 0 THEN CONTINUE; END IF;

        rand_val := random();
        IF rand_val < 0.10 THEN
            INSERT INTO cham_cong (nhan_vien_id, cua_hang_id, ngay, trang_thai, phut_di_muon)
            VALUES ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', d, 'vang_mat'::trang_thai_cham_cong, 0)
            ON CONFLICT DO NOTHING;
        ELSE
            late_mins := CASE WHEN rand_val < 0.25 THEN 5 + floor(random() * 15)::INT ELSE 0 END;
            checkin_dt := (d + TIME '07:00')::TIMESTAMPTZ + (late_mins || ' minutes')::INTERVAL;
            checkout_dt := (d + TIME '14:00')::TIMESTAMPTZ;
            hrs := EXTRACT(EPOCH FROM (checkout_dt - checkin_dt)) / 3600.0;
            
            INSERT INTO cham_cong (nhan_vien_id, cua_hang_id, ngay, thoi_gian_check_in, thoi_gian_check_out, vi_do_check_in, kinh_do_check_in, phuong_thuc_check_in, so_gio_thuc_te, trang_thai, phut_di_muon)
            VALUES ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', d, checkin_dt, checkout_dt, 10.773612, 106.702431, 'gps'::phuong_thuc_cham_cong, ROUND(hrs::NUMERIC, 2), (CASE WHEN late_mins > 0 THEN 'di_muon' ELSE 'dung_gio' END)::trang_thai_cham_cong, late_mins)
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- ==============================
-- 8. DON TU
-- ==============================
INSERT INTO don_tu (nhan_vien_id, cua_hang_id, loai_don, ngay_bat_dau, ngay_ket_thuc, ly_do, trang_thai, nguoi_duyet_id, thoi_gian_duyet) VALUES
('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'xin_nghi'::loai_don_tu, CURRENT_DATE + 3, CURRENT_DATE + 4, 'Em xin phép nghỉ phép giải quyết việc gia đình ạ', 'da_duyet'::trang_thai_don_tu, 'e0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day'),
('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'xin_nghi'::loai_don_tu, CURRENT_DATE - 5, CURRENT_DATE - 5, 'Em bị sốt xuất huyết xin nghỉ điều trị', 'da_duyet'::trang_thai_don_tu, 'e0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '6 days')
ON CONFLICT DO NOTHING;

-- ==============================
-- 9. MAU KPI & CHI SO KPI
-- ==============================
INSERT INTO mau_kpi (id, to_chuc_id, chuc_vu_id, ten, mo_ta) VALUES
('f0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'KPI Barista Q3/2026', 'Mẫu KPI Barista pha chế chuẩn')
ON CONFLICT (id) DO NOTHING;

INSERT INTO chi_so_kpi (mau_kpi_id, ten, ma_chi_so, nhom, don_vi_tinh, gia_tri_muc_tieu, trong_so) VALUES
('f0000000-0000-0000-0000-000000000001', 'Doanh thu ca',        'REV_001',  'tai_chinh'::nhom_kpi,  'VND',  5000000, 30.00),
('f0000000-0000-0000-0000-000000000001', 'Tốc độ pha chế',     'SPD_001',  'quy_trinh'::nhom_kpi,  'phút', 3,       20.00),
('f0000000-0000-0000-0000-000000000001', 'Đánh giá khách hàng', 'SAT_001',  'khach_hang'::nhom_kpi, 'sao',  4.5,     25.00),
('f0000000-0000-0000-0000-000000000001', 'Đi làm đúng giờ',     'ATT_001',  'quy_trinh'::nhom_kpi,  '%',    95,      25.00)
ON CONFLICT DO NOTHING;

-- ==============================
-- 10. KY LUONG & PHIEU LUONG
-- ==============================
INSERT INTO ky_luong (id, to_chuc_id, thang, nam, trang_thai, tong_luong_gross, tong_luong_net, nguoi_xac_nhan_id, ngay_thanh_toan) VALUES
('f0000000-0000-0000-0000-000000000099', 'a0000000-0000-0000-0000-000000000001', 1, 2026, 'da_thanhtoan'::trang_thai_ky_luong, 22310000, 22182500, 'e0000000-0000-0000-0000-000000000001', NOW() - INTERVAL '15 days')
ON CONFLICT (id) DO NOTHING;

INSERT INTO phieu_luong (ky_luong_id, nhan_vien_id, luong_co_ban, ngay_cong_chuan, ngay_cong_thuc_te, so_gio_tang_ca, tien_tang_ca, thuong_kpi, luong_thuc_nhat) VALUES
('f0000000-0000-0000-0000-000000000099', 'e0000000-0000-0000-0000-000000000002', 12000000, 26, 26, 0,   0,      1500000, 11490000),
('f0000000-0000-0000-0000-000000000099', 'e0000000-0000-0000-0000-000000000005', 5500000,  26, 24, 8.5, 382500, 500000,  5805000),
('f0000000-0000-0000-0000-000000000099', 'e0000000-0000-0000-0000-000000000006', 5000000,  26, 25, 3.0, 112500, 300000,  4887500)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ✅ MASTER SEED DATA v3.0 COMPLETE (100% IDEMPOTENT WITH ON CONFLICT DO NOTHING)
-- ============================================================
