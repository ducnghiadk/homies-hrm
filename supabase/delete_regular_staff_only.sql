-- ============================================================
-- HOMIES HRM — XÓA NHÂN VIÊN THƯỜNG, GIỮ LẠI CẤP QUẢN LÝ
-- ============================================================

-- Xóa tất cả nhân viên có vai trò là 'nhan_vien' (giữ lại các Quản lý, Trưởng ca, BGĐ, HR...)
DELETE FROM nhan_vien 
WHERE vai_tro = 'nhan_vien';

-- Hoặc câu lệnh đảm bảo chỉ giữ lại các cấp quản lý:
-- DELETE FROM nhan_vien 
-- WHERE vai_tro NOT IN ('quan_ly_cua_hang', 'quan_ly_khu_vuc', 'quan_tri_hr', 'ban_giam_doc', 'truong_ca');
