-- ============================================================
-- HOMIES MILK TEA 🧋 — MASTER SEED: NHÂN SỰ, CHI NHÁNH, BSC, LỊCH CA & CHẤM CÔNG
-- Dữ liệu mẫu chuẩn hóa 100% tương thích với Web App và Supabase Schema v3
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. CẬP NHẬT THÔNG TIN CHI NHÁNH & TỔ CHỨC
-- ============================================================
INSERT INTO to_chuc (id, ten, dia_chi, so_dien_thoai, email, ma_so_thue, cau_hinh) VALUES
(
    'a0000000-0000-0000-0000-000000000001',
    'Trà Sữa Phô Mai Tươi HOMIES',
    '123 Hồ Bá Phấn, Phước Long A, TP. Thủ Đức, TP.HCM',
    '0909 123 456',
    'contact@homiesmilktea.vn',
    '0317654321',
    '{"working_hours_per_month": 208, "overtime_rate": 1.5, "late_penalty_per_minute": 5000, "currency": "VND"}'
)
ON CONFLICT (id) DO UPDATE SET
    ten = EXCLUDED.ten,
    dia_chi = EXCLUDED.dia_chi,
    so_dien_thoai = EXCLUDED.so_dien_thoai;

-- 2 Chi nhánh chuẩn của chuỗi (Hồ Bá Phấn & Chi Nhánh 429)
-- Tự động xóa chi nhánh Lê Văn Sỹ nếu đang có trên Supabase
DELETE FROM cua_hang WHERE id = 'c0000000-0000-0000-0000-000000000003' OR ma_cua_hang = 'ST-003' OR ten ILIKE '%Lê Văn Sỹ%';

INSERT INTO cua_hang (id, to_chuc_id, ten, ma_cua_hang, dia_chi, so_dien_thoai, vi_do, kinh_do, ban_kinh_met, trang_thai) VALUES
('c0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Homies Milk Tea - Hồ Bá Phấn', 'ST-001', '123 Hồ Bá Phấn, Phước Long A, Thủ Đức', '028 3821 1111', 10.8236000, 106.7724000, 150, 'hoat_dong'::trang_thai_cua_hang),
('c0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Homies Milk Tea - Chi Nhánh 429', 'ST-002', '429 Lê Văn Sỹ, Phường 12, Quận 3, TP.HCM', '028 3822 2222', 10.7845000, 106.6679000, 150, 'hoat_dong'::trang_thai_cua_hang)
ON CONFLICT (id) DO UPDATE SET
    ten = EXCLUDED.ten,
    dia_chi = EXCLUDED.dia_chi,
    ban_kinh_met = 150;

-- ============================================================
-- 2. CA LÀM VIỆC CHUẨN
-- ============================================================
INSERT INTO ca_lam (id, to_chuc_id, ten, ma_ca, gio_bat_dau, gio_ket_thuc, phut_nghi, qua_dem, mau_hien_thi) VALUES
('d0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Ca Sáng (Mở quầy & Bán)',  'CA_SANG',  '06:30', '14:30', 30, FALSE, '#001D3D'),
('d0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Ca Chiều (Bán & Đóng quầy)', 'CA_CHIEU', '14:30', '22:30', 30, FALSE, '#2F6FA8'),
('d0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Ca Gãy / Parttime Cao Điểm', 'CA_GAY',   '11:00', '16:00', 15, FALSE, '#F6C85F'),
('d0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Ca Tối (Overnight Prep)',    'CA_TOI',   '18:00', '23:30', 15, FALSE, '#E57373')
ON CONFLICT (id) DO UPDATE SET
    ten = EXCLUDED.ten,
    gio_bat_dau = EXCLUDED.gio_bat_dau,
    gio_ket_thuc = EXCLUDED.gio_ket_thuc;

-- ============================================================
-- 3. QUY TẮC XẾP CA (SCHEDULE RULES)
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
-- 4. BSC: TIÊU CHÍ, BẬC THƯỞNG, MỤC TIÊU DOANH THU & LỖI MẪU
-- ============================================================

-- 4.1. Tiêu chí BSC
INSERT INTO bsc_cau_hinh_tieu_chi (key, name, weight, weight_percent_label, description, how_to_excel, icon, color) VALUES
('revenue', 'Doanh thu cửa hàng', 0.35, '35%', 'Doanh thu so với mục tiêu tháng.', 'Làm đơn nhanh, tư vấn upsell topping, giữ chân khách hàng.', 'TrendingUp', '#2F6FA8'),
('operation', 'Chất lượng vận hành', 0.30, '30%', 'Không sai đơn, không thiếu món, quầy kệ đạt chuẩn 5S.', 'Kiểm tra kỹ tem đơn trước khi giao app, bàn giao ca đầy đủ.', 'Settings', '#D97706'),
('waste', 'Kỷ luật & Học tập', 0.20, '20%', 'Đi làm đúng giờ, không vi phạm quy chế chuỗi, hoàn thành test sản phẩm.', 'Check-in đúng giờ qua GPS, tham gia đào tạo đầy đủ.', 'Package', '#1E9E57'),
('customer', 'Trải nghiệm khách hàng', 0.15, '15%', 'Đánh giá QR quầy và phản ánh trên các app Grab/ShopeeFood.', 'Thái độ thân thiện, chào hỏi tươi cười, đóng gói chắc chắn.', 'Users', '#2F6FA8')
ON CONFLICT (key) DO UPDATE SET weight = EXCLUDED.weight, weight_percent_label = EXCLUDED.weight_percent_label;

-- 4.2. Bậc thưởng BSC
INSERT INTO bsc_bac_thuong (id, min_score, max_score, bonus_percent, label, badge_color, sort_order) VALUES
('tier-1', 4.80, 5.00, 120, 'Vượt Trội (Thưởng 120% BSC)', 'bg-emerald-100 text-emerald-900 border-emerald-300', 1),
('tier-2', 4.00, 4.79, 100, 'Đạt Chuẩn (Thưởng 100% BSC)', 'bg-blue-100 text-blue-900 border-blue-300', 2),
('tier-3', 3.00, 3.99, 70,  'Mức Khá (Thưởng 70% BSC)',    'bg-amber-100 text-amber-900 border-amber-300', 3),
('tier-4', 2.00, 2.99, 40,  'Trung Bình (Thưởng 40% BSC)', 'bg-orange-100 text-orange-900 border-orange-300', 4),
('tier-5', 0.00, 1.99, 0,   'Không Đạt (0% Thưởng)',       'bg-rose-100 text-rose-900 border-rose-300', 5)
ON CONFLICT (id) DO NOTHING;

-- 4.3. Mục tiêu doanh thu BSC (Kỳ hiện tại)
INSERT INTO bsc_muc_tieu_doanh_thu (
    cua_hang_id, ten_cua_hang, ky_luong_id, moc_hoa_von_ngay, doanh_thu_trung_binh_ngay,
    target_ngay, target_thang, so_ngay_trong_thang, doanh_thu_thuc_te_thang, doanh_thu_thuc_te_ngay,
    mo_thuong, cogs_dinh_muc, cogs_thuc_te, vi_pham_attp, moc_gio_toi_thieu,
    trang_thai_duyet, nguoi_duyet, ngay_duyet
) VALUES
(
    'c0000000-0000-0000-0000-000000000001', 'Homies Milk Tea - Hồ Bá Phấn', '2026-08',
    6500000, 7200000, 8500000, 263500000, 31, 271200000, 8750000,
    true, 88000000, 89500000, false, 110,
    'approved_published', 'CEO Nguyễn Đức Nghĩa', NOW()
),
(
    'c0000000-0000-0000-0000-000000000002', 'Homies Milk Tea - Chi Nhánh 429', '2026-08',
    6500000, 7000000, 8000000, 248000000, 31, 252000000, 8130000,
    true, 82000000, 83100000, false, 110,
    'approved_published', 'CEO Nguyễn Đức Nghĩa', NOW()
)
ON CONFLICT (cua_hang_id, ky_luong_id) DO UPDATE SET
    target_thang = EXCLUDED.target_thang,
    doanh_thu_thuc_te_thang = EXCLUDED.doanh_thu_thuc_te_thang;

-- 4.4. Lỗi vận hành mẫu (Audit & Kiểm soát chất lượng)
INSERT INTO bsc_loi_van_hanh (
    id, event_id, store_id, period, shift_name, group_key, group_name,
    sub_error_id, sub_error_name, points, occurred_at, source_type,
    evidence_type, evidence_note, verifier_name, approval_status, affects_op_score
) VALUES
(
    'op-err-001', 'EVT-202608-01', 'c0000000-0000-0000-0000-000000000001', '2026-08',
    'Ca Sáng', 'dong_goi', 'Đóng gói & Giao đơn',
    'sub-op-04b', 'Không dán băng keo nắp ly rò rỉ đơn GrabFood', 1,
    NOW() - INTERVAL '2 days', 'internal', 'photo', 'Hình ảnh chụp từ tài xế phản ánh',
    'Trưởng ca Lan', 'approved_published', true
),
(
    'op-err-002', 'EVT-202608-02', 'c0000000-0000-0000-0000-000000000001', '2026-08',
    'Ca Chiều', 'lam_don', 'Pha chế & Công thức',
    'sub-op-02', 'Pha nhầm 50% đường thành 100% đường phải làm lại', 2,
    NOW() - INTERVAL '4 days', 'internal', 'note', 'Khách đổi trả tại quầy',
    'Trưởng ca Lan', 'approved_published', true
)
ON CONFLICT (id) DO NOTHING;

-- 4.5. Lỗi cá nhân mẫu (Trừ điểm chuyên cần / tác phong)
INSERT INTO bsc_loi_ca_nhan (
    id, employee_id, employee_name, role, store_id, period, work_hours, error_record
) VALUES
(
    'pers-err-001', 'e0000000-0000-0000-0000-000000000005', 'Võ Thanh Bình', 'employee',
    'c0000000-0000-0000-0000-000000000001', '2026-08', 135.5,
    '{"points_deducted": 1, "reason": "Đi trễ 8 phút ngày 15/08", "category": "gio_lam_cham_cong"}'::jsonb
),
(
    'pers-err-002', 'e0000000-0000-0000-0000-000000000006', 'Nguyễn Thị Mai', 'employee',
    'c0000000-0000-0000-0000-000000000001', '2026-08', 128.0,
    '{"points_deducted": 0, "reason": "Tác phong chuẩn, chuyên cần 100%", "category": "khen_thuong"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. LỊCH PHÂN CA (LỊCH TUẦN NÀY & TUẦN TỚI)
-- ============================================================
DO $$
DECLARE
    d DATE;
    day_offset INT;
BEGIN
    FOR day_offset IN -3..10 LOOP
        d := CURRENT_DATE + day_offset;

        -- 1. Võ Thanh Bình (Ca Sáng tại HBP)
        INSERT INTO lich_phan_ca (nhan_vien_id, cua_hang_id, ca_lam_id, ngay, trang_thai)
        VALUES ('e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', d, 'da_xep'::trang_thai_ca_lam)
        ON CONFLICT (nhan_vien_id, ngay, ca_lam_id) DO NOTHING;

        -- 2. Nguyễn Thị Mai (Ca Chiều tại HBP)
        INSERT INTO lich_phan_ca (nhan_vien_id, cua_hang_id, ca_lam_id, ngay, trang_thai)
        VALUES ('e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', d, 'da_xep'::trang_thai_ca_lam)
        ON CONFLICT (nhan_vien_id, ngay, ca_lam_id) DO NOTHING;

        -- 3. Trần Thị Lan (Quản lý HBP - Ca Sáng)
        IF day_offset % 2 = 0 THEN
            INSERT INTO lich_phan_ca (nhan_vien_id, cua_hang_id, ca_lam_id, ngay, trang_thai)
            VALUES ('e0000000-0000-0000-0000-000000000002', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', d, 'xac_nhan'::trang_thai_ca_lam)
            ON CONFLICT (nhan_vien_id, ngay, ca_lam_id) DO NOTHING;
        END IF;
    END LOOP;
END $$;

-- ============================================================
-- 6. CHẤM CÔNG GPS THỰC TẾ (14 NGÀY QUA)
-- ============================================================
DO $$
DECLARE
    d DATE;
    day_idx INT;
    cin TIMESTAMPTZ;
    cout TIMESTAMPTZ;
BEGIN
    FOR day_idx IN 1..14 LOOP
        d := CURRENT_DATE - day_idx;
        
        -- Chấm công Võ Thanh Bình (Ca Sáng: 06:30 - 14:30)
        cin := (d + TIME '06:28')::TIMESTAMPTZ;
        cout := (d + TIME '14:35')::TIMESTAMPTZ;
        
        INSERT INTO cham_cong (
            nhan_vien_id, cua_hang_id, ngay,
            thoi_gian_check_in, thoi_gian_check_out,
            vi_do_check_in, kinh_do_check_in, phuong_thuc_check_in,
            so_gio_thuc_te, so_gio_tang_ca, trang_thai, phut_di_muon
        ) VALUES (
            'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001', d,
            cin, cout,
            10.823610, 106.772415, 'gps'::phuong_thuc_cham_cong,
            8.0, 0.0, 'dung_gio'::trang_thai_cham_cong, 0
        ) ON CONFLICT DO NOTHING;

        -- Chấm công Nguyễn Thị Mai (Ca Chiều: 14:30 - 22:30)
        cin := (d + TIME '14:38')::TIMESTAMPTZ; -- Trễ 8p
        cout := (d + TIME '22:30')::TIMESTAMPTZ;
        
        INSERT INTO cham_cong (
            nhan_vien_id, cua_hang_id, ngay,
            thoi_gian_check_in, thoi_gian_check_out,
            vi_do_check_in, kinh_do_check_in, phuong_thuc_check_in,
            so_gio_thuc_te, so_gio_tang_ca, trang_thai, phut_di_muon
        ) VALUES (
            'e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001', d,
            cin, cout,
            10.823620, 106.772420, 'gps'::phuong_thuc_cham_cong,
            7.87, 0.0, 'di_muon'::trang_thai_cham_cong, 8
        ) ON CONFLICT DO NOTHING;
    END LOOP;
END $$;

-- ============================================================
-- 7. ĐƠN TỪ (XIN NGHỈ PHÉP & ĐỔI CA)
-- ============================================================
INSERT INTO don_tu (
    nhan_vien_id, cua_hang_id, loai_don, ngay_bat_dau, ngay_ket_thuc,
    ly_do, trang_thai, nguoi_duyet_id, thoi_gian_duyet
) VALUES
(
    'e0000000-0000-0000-0000-000000000005', 'c0000000-0000-0000-0000-000000000001',
    'xin_nghi'::loai_don_tu, CURRENT_DATE + 2, CURRENT_DATE + 3,
    'Em xin nghỉ phép về quê giải quyết việc gia đình',
    'da_duyet'::trang_thai_don_tu, 'e0000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day'
),
(
    'e0000000-0000-0000-0000-000000000006', 'c0000000-0000-0000-0000-000000000001',
    'doi_ca'::loai_don_tu, CURRENT_DATE + 4, CURRENT_DATE + 4,
    'Em xin đổi ca chiều sang ca sáng vì bận lịch thi học kỳ',
    'cho_duyet'::trang_thai_don_tu, NULL, NULL
)
ON CONFLICT DO NOTHING;

-- ============================================================
-- ✅ SEED OPERATION & BSC DATA COMPLETE
-- ============================================================
