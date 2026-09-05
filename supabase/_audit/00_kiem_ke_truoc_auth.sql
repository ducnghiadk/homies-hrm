-- Muc dich: Kiem ke database that truoc khi trien khai Supabase Auth email va mat khau.
-- Ngay: 2026-08-28
-- Canh bao: Script chi doc, khong thay doi schema hay du lieu.
--
-- CACH CHAY AN TOAN KHI CHUA BIET DATABASE CO NHUNG BANG NAO:
-- 1. Chay rieng A1, A2, A3, A5 va A6 truoc. Cac truy van nay an toan khi bang chua ton tai.
-- 2. A4 chi chay khi A3 bao auth.users ton tai.
-- 3. B1-B6 va D1-D3 chi chay khi public.nhan_vien va cac cot lien quan ton tai.
-- 4. C1, C4 va E1 chi can public.nhan_vien cung cac cot lien quan.
-- 5. C2-C3 chi chay khi ca public.nhan_vien va auth.users ton tai.
-- 6. D4 chi chay khi ca public.nhan_vien va public.to_chuc ton tai.
-- 7. D5 chi chay khi ca public.nhan_vien va public.cua_hang ton tai.
-- 8. Moi truy van duoc danh so de co the boi den va chay rieng trong Supabase SQL Editor.

-- ============================================================================
-- PHAN A - DATABASE THAT CO GI
-- ============================================================================

-- A1. Liet ke toan bo bang trong schema public kem so dong uoc luong.
SELECT
    'A1 - Bang public va so dong uoc luong' AS nhan,
    c.relname AS ten_bang,
    GREATEST(c.reltuples, 0)::BIGINT AS so_dong_uoc_luong
FROM pg_catalog.pg_class AS c
JOIN pg_catalog.pg_namespace AS n
    ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind IN ('r', 'p')
ORDER BY c.relname;

-- A2. Kiem tra cac bang nghiep vu quan trong co ton tai hay khong.
SELECT
    'A2 - Ton tai bang nghiep vu' AS nhan,
    danh_sach.ten_bang,
    to_regclass(format('%I.%I', 'public', danh_sach.ten_bang)) IS NOT NULL AS ton_tai,
    to_regclass(format('%I.%I', 'public', danh_sach.ten_bang))::TEXT AS ten_day_du
FROM (
    VALUES
        ('nhan_vien'),
        ('employees'),
        ('users'),
        ('to_chuc'),
        ('cua_hang'),
        ('chuc_vu'),
        ('nhan_vien_cua_hang'),
        ('nhan_vien_ho_so_nhay_cam')
) AS danh_sach(ten_bang)
ORDER BY danh_sach.ten_bang;

-- A3. Kiem tra rieng bang auth.users co ton tai hay khong.
SELECT
    'A3 - Ton tai auth.users' AS nhan,
    to_regclass('auth.users') IS NOT NULL AS ton_tai,
    to_regclass('auth.users')::TEXT AS ten_day_du;

-- A4. Dem chinh xac so dong auth.users. Chi chay khi A3 tra ve ton_tai = true.
SELECT
    'A4 - Tong so tai khoan trong auth.users' AS nhan,
    COUNT(*) AS so_luong
FROM auth.users;

-- A5. Liet ke cot thuc te cua public.nhan_vien; neu bang khong co thi tra ve 0 dong.
SELECT
    'A5 - Cot thuc te cua public.nhan_vien' AS nhan,
    c.ordinal_position AS thu_tu,
    c.column_name AS ten_cot,
    c.data_type AS kieu_du_lieu,
    c.udt_name AS kieu_noi_bo,
    c.is_nullable AS cho_phep_null,
    c.column_default AS gia_tri_mac_dinh
FROM information_schema.columns AS c
WHERE c.table_schema = 'public'
  AND c.table_name = 'nhan_vien'
ORDER BY c.ordinal_position;

-- A6. Kiem tra nhanh cac cot B-E can dung; neu bang khong co thi tat ca tra ve false.
SELECT
    'A6 - Cot can cho kiem ke B-E' AS nhan,
    danh_sach.ten_cot,
    EXISTS (
        SELECT 1
        FROM information_schema.columns AS c
        WHERE c.table_schema = 'public'
          AND c.table_name = 'nhan_vien'
          AND c.column_name = danh_sach.ten_cot
    ) AS ton_tai
FROM (
    VALUES
        ('id'),
        ('auth_id'),
        ('trang_thai'),
        ('email'),
        ('ma_nhan_vien'),
        ('so_dien_thoai'),
        ('to_chuc_id'),
        ('cua_hang_id'),
        ('so_cccd'),
        ('so_tai_khoan'),
        ('ma_so_thue'),
        ('muc_luong_co_ban')
) AS danh_sach(ten_cot)
ORDER BY danh_sach.ten_cot;

-- ============================================================================
-- PHAN B - CHAT LUONG DU LIEU EMAIL
-- Chi chay tung truy van khi A2 xac nhan public.nhan_vien ton tai va A6 co cot can dung.
-- ============================================================================

-- B1. Tong so nhan vien va phan theo trang_thai.
SELECT
    'B1 - Tong nhan vien theo trang_thai' AS nhan,
    'TAT_CA' AS trang_thai,
    COUNT(*) AS so_luong,
    0 AS thu_tu_hien_thi
FROM public.nhan_vien
UNION ALL
SELECT
    'B1 - Tong nhan vien theo trang_thai' AS nhan,
    COALESCE(nv.trang_thai::TEXT, 'NULL') AS trang_thai,
    COUNT(*) AS so_luong,
    1 AS thu_tu_hien_thi
FROM public.nhan_vien AS nv
GROUP BY nv.trang_thai
ORDER BY thu_tu_hien_thi, trang_thai;

-- B2. So nhan vien co email NULL hoac rong sau khi bo khoang trang hai dau.
SELECT
    'B2 - Nhan vien khong co email' AS nhan,
    COUNT(*) AS so_luong
FROM public.nhan_vien AS nv
WHERE NULLIF(BTRIM(nv.email::TEXT), '') IS NULL;

-- B3. Danh sach email trung khop chinh xac sau khi bo khoang trang hai dau.
SELECT
    'B3 - Email trung chinh xac' AS nhan,
    BTRIM(nv.email::TEXT) AS email,
    COUNT(*) AS so_lan_xuat_hien
FROM public.nhan_vien AS nv
WHERE NULLIF(BTRIM(nv.email::TEXT), '') IS NOT NULL
GROUP BY BTRIM(nv.email::TEXT)
HAVING COUNT(*) > 1
ORDER BY so_lan_xuat_hien DESC, email;

-- B4. Email sai dinh dang co ban: khong co ky tu @ hoac co khoang trang.
SELECT
    'B4 - Email sai dinh dang co ban' AS nhan,
    nv.id::TEXT AS nhan_vien_id,
    nv.email::TEXT AS email,
    CASE
        WHEN nv.email::TEXT NOT LIKE '%@%' THEN 'khong_co_ky_tu_at'
        WHEN nv.email::TEXT ~ '[[:space:]]' THEN 'co_khoang_trang'
        ELSE 'khac'
    END AS ly_do
FROM public.nhan_vien AS nv
WHERE NULLIF(BTRIM(nv.email::TEXT), '') IS NOT NULL
  AND (
      nv.email::TEXT NOT LIKE '%@%'
      OR nv.email::TEXT ~ '[[:space:]]'
  )
ORDER BY nv.email::TEXT;

-- B5. Email chi khac nhau do hoa/thuong; email_chuan duoc dua ve chu thuong.
SELECT
    'B5 - Email khac nhau chi do hoa thuong' AS nhan,
    LOWER(BTRIM(nv.email::TEXT)) AS email_chuan,
    STRING_AGG(
        DISTINCT BTRIM(nv.email::TEXT),
        ' | '
        ORDER BY BTRIM(nv.email::TEXT)
    ) AS cac_bien_the,
    COUNT(*) AS so_lan_xuat_hien
FROM public.nhan_vien AS nv
WHERE NULLIF(BTRIM(nv.email::TEXT), '') IS NOT NULL
GROUP BY LOWER(BTRIM(nv.email::TEXT))
HAVING COUNT(DISTINCT BTRIM(nv.email::TEXT)) > 1
ORDER BY so_lan_xuat_hien DESC, email_chuan;

-- B6. CON SO CHAN: nhan vien dang hoat dong nhung khong co email.
SELECT
    'B6 - CON SO CHAN: dang hoat dong khong co email' AS nhan,
    COUNT(*) AS so_luong
FROM public.nhan_vien AS nv
WHERE nv.trang_thai::TEXT = 'hoat_dong'
  AND NULLIF(BTRIM(nv.email::TEXT), '') IS NULL;

-- ============================================================================
-- PHAN C - SAN SANG CHO BACKFILL auth_id
-- ============================================================================

-- C1. So nhan vien da co auth_id.
SELECT
    'C1 - Nhan vien da co auth_id' AS nhan,
    COUNT(*) AS so_luong
FROM public.nhan_vien AS nv
WHERE nv.auth_id IS NOT NULL;

-- C2. auth_id mo coi: co trong nhan_vien nhung khong co trong auth.users.
-- Chi chay khi A2 va A3 xac nhan ca hai bang ton tai.
SELECT
    'C2 - auth_id mo coi trong nhan_vien' AS nhan,
    COUNT(*) AS so_luong
FROM public.nhan_vien AS nv
WHERE nv.auth_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM auth.users AS au
      WHERE au.id::TEXT = nv.auth_id::TEXT
  );

-- C3. Tai khoan auth.users chua duoc lien ket voi nhan_vien nao bang auth_id.
-- Chi chay khi A2 va A3 xac nhan ca hai bang ton tai.
SELECT
    'C3 - auth.users chua khop nhan_vien' AS nhan,
    COUNT(*) AS so_luong
FROM auth.users AS au
WHERE NOT EXISTS (
    SELECT 1
    FROM public.nhan_vien AS nv
    WHERE nv.auth_id::TEXT = au.id::TEXT
);

-- C4. Danh sach auth_id bi trung; 0 dong nghia la khong co trung.
SELECT
    'C4 - auth_id bi trung' AS nhan,
    nv.auth_id::TEXT AS auth_id,
    COUNT(*) AS so_lan_xuat_hien
FROM public.nhan_vien AS nv
WHERE nv.auth_id IS NOT NULL
GROUP BY nv.auth_id
HAVING COUNT(*) > 1
ORDER BY so_lan_xuat_hien DESC, auth_id;

-- ============================================================================
-- PHAN D - CAC TRUONG DINH DANH KHAC
-- ============================================================================

-- D1. Thong ke NULL, rong va trung cua ma_nhan_vien.
SELECT
    'D1 - Chat luong ma_nhan_vien' AS nhan,
    COUNT(*) FILTER (WHERE nv.ma_nhan_vien IS NULL) AS so_null,
    COUNT(*) FILTER (
        WHERE nv.ma_nhan_vien IS NOT NULL
          AND BTRIM(nv.ma_nhan_vien::TEXT) = ''
    ) AS so_rong,
    (
        SELECT COUNT(*)
        FROM (
            SELECT BTRIM(nv2.ma_nhan_vien::TEXT)
            FROM public.nhan_vien AS nv2
            WHERE NULLIF(BTRIM(nv2.ma_nhan_vien::TEXT), '') IS NOT NULL
            GROUP BY BTRIM(nv2.ma_nhan_vien::TEXT)
            HAVING COUNT(*) > 1
        ) AS nhom_trung
    ) AS so_ma_bi_trung,
    (
        SELECT COALESCE(SUM(nhom_trung.so_lan), 0)
        FROM (
            SELECT COUNT(*)::BIGINT AS so_lan
            FROM public.nhan_vien AS nv3
            WHERE NULLIF(BTRIM(nv3.ma_nhan_vien::TEXT), '') IS NOT NULL
            GROUP BY BTRIM(nv3.ma_nhan_vien::TEXT)
            HAVING COUNT(*) > 1
        ) AS nhom_trung
    ) AS so_ban_ghi_nam_trong_nhom_trung
FROM public.nhan_vien AS nv;

-- D2. Thong ke NULL, rong va trung cua so_dien_thoai.
SELECT
    'D2 - Chat luong so_dien_thoai' AS nhan,
    COUNT(*) FILTER (WHERE nv.so_dien_thoai IS NULL) AS so_null,
    COUNT(*) FILTER (
        WHERE nv.so_dien_thoai IS NOT NULL
          AND BTRIM(nv.so_dien_thoai::TEXT) = ''
    ) AS so_rong,
    (
        SELECT COUNT(*)
        FROM (
            SELECT BTRIM(nv2.so_dien_thoai::TEXT)
            FROM public.nhan_vien AS nv2
            WHERE NULLIF(BTRIM(nv2.so_dien_thoai::TEXT), '') IS NOT NULL
            GROUP BY BTRIM(nv2.so_dien_thoai::TEXT)
            HAVING COUNT(*) > 1
        ) AS nhom_trung
    ) AS so_so_dien_thoai_bi_trung,
    (
        SELECT COALESCE(SUM(nhom_trung.so_lan), 0)
        FROM (
            SELECT COUNT(*)::BIGINT AS so_lan
            FROM public.nhan_vien AS nv3
            WHERE NULLIF(BTRIM(nv3.so_dien_thoai::TEXT), '') IS NOT NULL
            GROUP BY BTRIM(nv3.so_dien_thoai::TEXT)
            HAVING COUNT(*) > 1
        ) AS nhom_trung
    ) AS so_ban_ghi_nam_trong_nhom_trung
FROM public.nhan_vien AS nv;

-- D3. Cac mau dinh dang dien thoai dang ton tai; chu so duoc che bang ky tu #.
SELECT
    'D3 - Mau dinh dang so_dien_thoai' AS nhan,
    REGEXP_REPLACE(BTRIM(nv.so_dien_thoai::TEXT), '[0-9]', '#', 'g') AS mau_dinh_dang,
    COUNT(*) AS so_luong
FROM public.nhan_vien AS nv
WHERE NULLIF(BTRIM(nv.so_dien_thoai::TEXT), '') IS NOT NULL
GROUP BY REGEXP_REPLACE(BTRIM(nv.so_dien_thoai::TEXT), '[0-9]', '#', 'g')
ORDER BY so_luong DESC, mau_dinh_dang;

-- D4. Nhan vien co to_chuc_id khong ton tai trong public.to_chuc.
-- Chi chay khi A2 xac nhan ca hai bang ton tai.
SELECT
    'D4 - to_chuc_id mo coi' AS nhan,
    COUNT(*) AS so_luong
FROM public.nhan_vien AS nv
WHERE nv.to_chuc_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM public.to_chuc AS tc
      WHERE tc.id::TEXT = nv.to_chuc_id::TEXT
  );

-- D5. Nhan vien co cua_hang_id khong ton tai trong public.cua_hang.
-- Chi chay khi A2 xac nhan ca hai bang ton tai.
SELECT
    'D5 - cua_hang_id mo coi' AS nhan,
    COUNT(*) AS so_luong
FROM public.nhan_vien AS nv
WHERE nv.cua_hang_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM public.cua_hang AS ch
      WHERE ch.id::TEXT = nv.cua_hang_id::TEXT
  );

-- ============================================================================
-- PHAN E - DU LIEU NHAY CAM CAN DI CHUYEN SAU NAY
-- Chi dem, khong tra ve gia tri CCCD, tai khoan ngan hang, ma so thue hay luong.
-- ============================================================================

-- E1. Dem so ban ghi dang co du lieu nhay cam trong public.nhan_vien.
SELECT
    'E1 - So ban ghi co du lieu nhay cam' AS nhan,
    COUNT(*) FILTER (
        WHERE NULLIF(BTRIM(nv.so_cccd::TEXT), '') IS NOT NULL
    ) AS co_so_cccd,
    COUNT(*) FILTER (
        WHERE NULLIF(BTRIM(nv.so_tai_khoan::TEXT), '') IS NOT NULL
    ) AS co_so_tai_khoan,
    COUNT(*) FILTER (
        WHERE NULLIF(BTRIM(nv.ma_so_thue::TEXT), '') IS NOT NULL
    ) AS co_ma_so_thue,
    COUNT(*) FILTER (
        WHERE COALESCE(nv.muc_luong_co_ban, 0) <> 0
    ) AS co_muc_luong_co_ban_khac_0
FROM public.nhan_vien AS nv;
