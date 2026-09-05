-- ============================================================
-- HOMIES HRM — XÓA SẠCH DANH SÁCH NHÂN VIÊN ĐỂ IMPORT MỚI
-- Chạy câu lệnh này trên Supabase SQL Editor
-- ============================================================

-- Xóa dữ liệu bảng nhân viên và các bảng liên quan (lịch sử công tác, phiếu lương...)
TRUNCATE TABLE nhan_vien CASCADE;
