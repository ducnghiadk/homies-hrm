-- ============================================================
-- HOMIES MILK TEA 🧋 — SEED DATA NHÂN VIÊN TỪ EXCEL
-- Supabase / PostgreSQL
-- ============================================================

-- 1. Tạo tổ chức mặc định nếu chưa có
INSERT INTO to_chuc (id, ten, ma_so_thue)
VALUES ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Trà Sữa Phô Mai Tươi HOMIES', '0317000000')
ON CONFLICT (id) DO NOTHING;

-- 2. Tạo danh sách cửa hàng / chi nhánh nếu chưa có
INSERT INTO cua_hang (id, to_chuc_id, ten, ma_cua_hang)
VALUES 
  ('c0111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Homies HBP (Tăng Nhơn Phú / Phước Long)', 'HBP'),
  ('c0222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Homies 429', '429')
ON CONFLICT (ma_cua_hang) DO NOTHING;

-- 3. Tạo danh sách chức vụ
INSERT INTO chuc_vu (id, to_chuc_id, ten, ma_chuc_vu, cap_bac)
VALUES 
  ('v0111111-1111-1111-1111-111111111111', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Quản lý điểm bán hàng', 'QLCH', 3),
  ('v0222222-2222-2222-2222-222222222222', 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Nhân viên', 'NV', 1)
ON CONFLICT DO NOTHING;

-- 4. Chèn danh sách Nhân viên từ Excel
INSERT INTO nhan_vien (
  to_chuc_id,
  cua_hang_id,
  chuc_vu_id,
  ma_nhan_vien,
  ho_ten,
  ngay_sinh,
  gioi_tinh,
  email,
  so_dien_thoai,
  ngay_bat_dau_lam,
  loai_hop_dong,
  muc_luong_co_ban,
  ten_ngan_hang,
  so_tai_khoan,
  dia_chi,
  noi_o_hien_tai,
  so_cccd,
  ngay_cap_cccd,
  trang_thai,
  vai_tro
)
VALUES
  -- 1. Huỳnh Lê Kiều Linh (HBP)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0111111-1111-1111-1111-111111111111', 'v0111111-1111-1111-1111-111111111111',
   'NV0001', 'Huỳnh Lê Kiều Linh', '2004-10-06', 'nu', 'huynhlekieulinh6@gmail.com', '0779554540',
   '2023-08-28', 'toan_thoi_gian', 25000, 'Techcombank', '19039551279019',
   'Hành Minh, Xã Nghĩa Hành, Tỉnh Quảng Ngãi', '244/40A Dương Đình Hội, Phường Tăng Nhơn Phú, Thành phố Hồ Chí Minh',
   NULL, NULL, 'hoat_dong', 'quan_ly_cua_hang'),

  -- 2. Nguyễn Thị Phương Thảo (HBP)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0111111-1111-1111-1111-111111111111', 'v0222222-2222-2222-2222-222222222222',
   'NV0008', 'Nguyễn Thị Phương Thảo', '2004-03-04', 'nu', 'nguyenphuongthao4324@gmail.com', '0349439071',
   '2025-06-19', 'ban_thoi_gian', 28000, 'BIDV', '6360416027',
   'Dương Đình Hội, Phường Tăng Nhơn Phú B, Quận 9, Thành phố Hồ Chí Minh', 'Dương Đình Hội, Phường Tăng Nhơn Phú B, Quận 9, Thành phố Hồ Chí Minh',
   '066304000746', NULL, 'hoat_dong', 'nhan_vien'),

  -- 3. Nguyễn Thị Tú Trinh (HBP)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0111111-1111-1111-1111-111111111111', 'v0222222-2222-2222-2222-222222222222',
   'NV0013', 'Nguyễn Thị Tú Trinh', '2005-04-05', 'nu', 'ngthtutrinh.0504@gmail.com', '0379356852',
   '2025-08-21', 'ban_thoi_gian', 20000, 'Techcombank', '19072325135011',
   '81 đường 18, Phường Phước Long, Thành phố Hồ Chí Minh', '39/2F1 Hồ Bá Phấn, Phường Phước Long, Thành phố Hồ Chí Minh',
   '051305005143', '2022-08-07', 'hoat_dong', 'nhan_vien'),

  -- 4. Nguyễn Thị Kiều Ý (429)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0222222-2222-2222-2222-222222222222', 'v0111111-1111-1111-1111-111111111111',
   'NV0016', 'Nguyễn Thị Kiều Ý', '2007-01-04', 'nu', 'kieuy4052007@gmail.com', '0378418288',
   '2025-10-05', 'ban_thoi_gian', 20000, 'VietinBank', '100885217092',
   NULL, 'd1/10 đường 385, Phường Tăng Nhơn Phú, Thành phố Hồ Chí Minh',
   '060307004198', NULL, 'hoat_dong', 'quan_ly_cua_hang'),

  -- 5. Nguyễn Thanh Thiên (429)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0222222-2222-2222-2222-222222222222', 'v0222222-2222-2222-2222-222222222222',
   'NV0017', 'Nguyễn Thanh Thiên', '2007-04-28', 'nam', 'nguyenthanhthien2804@gmail.com', '0775943568',
   '2025-10-21', 'ban_thoi_gian', 20000, 'Vietcombank', '1058792562',
   'Xã Ngô Mây, Tỉnh Gia Lai', '7/52 đường 385, Phường Tăng Nhơn Phú, Thành phố Hồ Chí Minh',
   '052307001524', NULL, 'hoat_dong', 'nhan_vien'),

  -- 6. Lô Minh Lộc (429)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0222222-2222-2222-2222-222222222222', 'v0222222-2222-2222-2222-222222222222',
   'NV0020', 'Lô Minh Lộc', '2007-01-02', 'nam', 'llocm8203@gmail.com', '0945576422',
   '2025-11-30', 'ban_thoi_gian', 20000, 'Vietcombank', '1057741731',
   NULL, 'Hẻm 441, Đường Lê Văn Việt, Phường Tăng Nhơn Phú, Thành phố Hồ Chí Minh',
   '091207000620', NULL, 'hoat_dong', 'nhan_vien'),

  -- 7. Trần Công Huy (HBP)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0111111-1111-1111-1111-111111111111', 'v0111111-1111-1111-1111-111111111111',
   'NV0027', 'Trần Công Huy', '1999-02-21', 'nam', 'jinn.wooo.02@gmail.com', '0332151527',
   '2026-04-05', 'toan_thoi_gian', 6600000, 'Vietcombank', '0332151527',
   NULL, '21/2A đường 388, Phường Phước Long, Thành phố Hồ Chí Minh',
   '092099005705', NULL, 'hoat_dong', 'quan_ly_cua_hang'),

  -- 8. Phạm Nguyễn Đông Duy (429)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0222222-2222-2222-2222-222222222222', 'v0222222-2222-2222-2222-222222222222',
   'NV0028', 'Phạm Nguyễn Đông Duy', '2005-12-21', 'nam', 'phamnguyendongduy2020@gmail.com', '0943748525',
   '2026-04-25', 'toan_thoi_gian', 6600000, 'Vietcombank', '1017546757',
   'Số nhà 81, Phường Tân Phú, Quận 9, Thành phố Hồ Chí Minh', '160 Cầu Xây, Phường Tăng Nhơn Phú, Thành phố Hồ Chí Minh',
   '094205001474', '2021-04-07', 'hoat_dong', 'nhan_vien'),

  -- 9. Quách Thị Kim Chi (HBP)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0111111-1111-1111-1111-111111111111', 'v0222222-2222-2222-2222-222222222222',
   'NV0030', 'Quách Thị Kim Chi', '2007-05-09', 'nu', 'quachchi0909@gmail.com', '0327431568',
   '2026-06-22', 'ban_thoi_gian', 20000, 'VietinBank', '0327431568',
   'Cao Dương, Xã Thanh Oai, Thành phố Hà Nội', '22/3 Thủy Lợi, Phường Phước Long, Thành phố Hồ Chí Minh',
   '001307003656', '2021-12-27', 'hoat_dong', 'nhan_vien'),

  -- 10. Cao Văn Thắng (HBP)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0111111-1111-1111-1111-111111111111', 'v0222222-2222-2222-2222-222222222222',
   'NV0031', 'Cao Văn Thắng', '2008-03-08', 'nam', 'vanthangdzai808@gmail.com', '0336675716',
   '2026-06-29', 'ban_thoi_gian', 20000, 'MBBank', '0377184436',
   '16/1A Hồ Bá Phấn, Phường Phước Long, Thành phố Hồ Chí Minh', '16/1A Hồ Bá Phấn, Phường Phước Long, Thành phố Hồ Chí Minh',
   '077208010151', '2022-08-03', 'hoat_dong', 'nhan_vien'),

  -- 11. Nguyễn Hoài Ân (HBP)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0111111-1111-1111-1111-111111111111', 'v0222222-2222-2222-2222-222222222222',
   'NV0033', 'Nguyễn Hoài Ân', '2007-05-21', 'nu', 'hie.agg21@gmail.com', '0364136210',
   '2026-07-11', 'thu_viec', 20000, 'Vietcombank', '1041142505',
   NULL, '361/7L, ấp Phú Lợi, xã Tân Xuân, tỉnh Vĩnh Long',
   '083307001015', '2022-11-30', 'thu_viec', 'nhan_vien'),

  -- 12. Nguyễn Thị Thu (HBP)
  ('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c0111111-1111-1111-1111-111111111111', 'v0222222-2222-2222-2222-222222222222',
   'NV0034', 'Nguyễn Thị Thu', '2005-10-23', 'nu', 'ntthu.workl@gmail.com', '0963593319',
   '2026-08-05', 'ban_thoi_gian', 20000, 'TPBank', '00004606043',
   'Số 75, đường 379, phường Tăng Nhơn Phú A, TP Thủ Đức, TP.HCM', 'Số 75, đường 379, phường Tăng Nhơn Phú A, TP Thủ Đức, TP.HCM',
   NULL, NULL, 'hoat_dong', 'nhan_vien')

ON CONFLICT (ma_nhan_vien) 
DO UPDATE SET
  cua_hang_id = EXCLUDED.cua_hang_id,
  chuc_vu_id = EXCLUDED.chuc_vu_id,
  ho_ten = EXCLUDED.ho_ten,
  ngay_sinh = EXCLUDED.ngay_sinh,
  gioi_tinh = EXCLUDED.gioi_tinh,
  email = EXCLUDED.email,
  so_dien_thoai = EXCLUDED.so_dien_thoai,
  ngay_bat_dau_lam = EXCLUDED.ngay_bat_dau_lam,
  loai_hop_dong = EXCLUDED.loai_hop_dong,
  muc_luong_co_ban = EXCLUDED.muc_luong_co_ban,
  ten_ngan_hang = EXCLUDED.ten_ngan_hang,
  so_tai_khoan = EXCLUDED.so_tai_khoan,
  dia_chi = EXCLUDED.dia_chi,
  noi_o_hien_tai = EXCLUDED.noi_o_hien_tai,
  so_cccd = EXCLUDED.so_cccd,
  ngay_cap_cccd = EXCLUDED.ngay_cap_cccd,
  trang_thai = EXCLUDED.trang_thai,
  vai_tro = EXCLUDED.vai_tro,
  ngay_cap_nhat = NOW();
