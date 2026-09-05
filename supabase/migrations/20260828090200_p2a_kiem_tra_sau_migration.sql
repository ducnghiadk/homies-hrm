SELECT
    'so_nhan_vien_hoat_dong_ky_vong_16' AS kiem_tra,
    COUNT(*) AS gia_tri
FROM public.nhan_vien
WHERE trang_thai = 'hoat_dong';

SELECT
    'fk_auth_id_da_ton_tai' AS kiem_tra,
    EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_nhan_vien_auth_id_auth_users'
          AND conrelid = 'public.nhan_vien'::regclass
          AND contype = 'f'
    ) AS gia_tri;

SELECT
    'check_trang_thai_da_ton_tai' AS kiem_tra,
    EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_nhan_vien_trang_thai_p2a'
          AND conrelid = 'public.nhan_vien'::regclass
          AND contype = 'c'
    ) AS gia_tri;

SELECT
    'unique_to_chuc_id_ma_nhan_vien_da_ton_tai' AS kiem_tra,
    EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_nhan_vien_to_chuc_ma_nhan_vien'
          AND conrelid = 'public.nhan_vien'::regclass
          AND contype = 'u'
    ) AS gia_tri;

SELECT
    'cot_chuc_vu_ngay_cap_nhat_da_ton_tai' AS kiem_tra,
    EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'chuc_vu'
          AND column_name = 'ngay_cap_nhat'
    ) AS gia_tri;

SELECT
    'so_dong_trang_thai_ngoai_3_gia_tri_hop_le' AS kiem_tra,
    COUNT(*) AS gia_tri
FROM public.nhan_vien
WHERE trang_thai::text NOT IN ('hoat_dong', 'tam_nghi', 'da_nghi_viec');
