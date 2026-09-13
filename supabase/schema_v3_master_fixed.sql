-- ============================================================
-- HOMIES MILK TEA 🧋 — MASTER DATABASE SCHEMA v3.0 (IDEMPOTENT / CHẠY KHÔNG LỖI)
-- Supabase / PostgreSQL
-- Kiến trúc: 28 Bảng chuẩn hóa kèm Phân quyền RLS đầy đủ
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================
-- 0. SAFE ENUMS CREATION (DO BLOCK ENDS BEFORE TABLES)
-- ==============================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trang_thai_cua_hang') THEN
        CREATE TYPE trang_thai_cua_hang AS ENUM ('hoat_dong', 'ngung_hoat_dong', 'dong_cua');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gioi_tinh') THEN
        CREATE TYPE gioi_tinh AS ENUM ('nam', 'nu', 'khac');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loai_hop_dong') THEN
        CREATE TYPE loai_hop_dong AS ENUM ('toan_thoi_gian', 'ban_thoi_gian', 'thuc_tap', 'thu_viec');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trang_thai_nhan_vien') THEN
        CREATE TYPE trang_thai_nhan_vien AS ENUM ('hoat_dong', 'ngung_hoat_dong', 'thu_viec', 'da_nghi_viec');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vai_tro_nhan_vien') THEN
        CREATE TYPE vai_tro_nhan_vien AS ENUM ('nhan_vien', 'truong_ca', 'quan_ly_cua_hang', 'quan_ly_khu_vuc', 'quan_tri_hr', 'ban_giam_doc');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trang_thai_ca_lam') THEN
        CREATE TYPE trang_thai_ca_lam AS ENUM ('da_xep', 'xac_nhan', 'hoan_thanh', 'vang_mat', 'da_huy');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'phuong_thuc_cham_cong') THEN
        CREATE TYPE phuong_thuc_cham_cong AS ENUM ('gps', 'wifi', 'thu_cong', 'qr');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trang_thai_cham_cong') THEN
        CREATE TYPE trang_thai_cham_cong AS ENUM ('dung_gio', 'di_muon', 've_som', 'vang_mat', 'cho_duyet');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loai_don_tu') THEN
        CREATE TYPE loai_don_tu AS ENUM ('xin_nghi', 'doi_ca', 'tang_ca');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trang_thai_don_tu') THEN
        CREATE TYPE trang_thai_don_tu AS ENUM ('cho_duyet', 'da_duyet', 'tu_chuoi', 'da_huy');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'nhom_kpi') THEN
        CREATE TYPE nhom_kpi AS ENUM ('tai_chinh', 'khach_hang', 'quy_trinh', 'hoc_tap');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loai_phieu_danh_gia') THEN
        CREATE TYPE loai_phieu_danh_gia AS ENUM ('tu_danh_gia', 'quan_ly', 'dong_nghiep');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trang_thai_danh_gia') THEN
        CREATE TYPE trang_thai_danh_gia AS ENUM ('cho_danh_gia', 'hoan_thanh');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loai_huy_hieu') THEN
        CREATE TYPE loai_huy_hieu AS ENUM ('chuyen_can', 'doanh_so', 'phuc_vu', 'dao_tao', 'dong_doi');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loai_giao_dich_diem') THEN
        CREATE TYPE loai_giao_dich_diem AS ENUM ('tich_diem', 'su_dung');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trang_thai_doi_thuong') THEN
        CREATE TYPE trang_thai_doi_thuong AS ENUM ('cho_duyet', 'da_duyet', 'tu_chuoi', 'da_tra_thuong');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'loai_khen_ngoi') THEN
        CREATE TYPE loai_khen_ngoi AS ENUM ('cam_on', 'lam_tot', 'dong_doi', 'sao_tao', 'nhiet_tinh');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trang_thai_ky_luong') THEN
        CREATE TYPE trang_thai_ky_luong AS ENUM ('nhap', 'da_xac_nhan', 'da_thanhtoan');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'trang_thai_hop_dong') THEN
        CREATE TYPE trang_thai_hop_dong AS ENUM ('nhap', 'cho_nhan_vien_ky', 'nhan_vien_da_ky', 'cho_hr_ky', 'hieu_luc', 'tu_chuoi', 'het_han', 'da_huy', 'thay_the');
    END IF;
END $$;

-- ==============================
-- 1. TO CHUC
-- ==============================
CREATE TABLE IF NOT EXISTS to_chuc (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ten             TEXT NOT NULL,
    logo_url        TEXT,
    dia_chi         TEXT,
    so_dien_thoai   TEXT,
    email           TEXT,
    ma_so_thue      TEXT,
    cau_hinh        JSONB DEFAULT '{}',
    ngay_tao        TIMESTAMPTZ DEFAULT NOW(),
    ngay_cap_nhat   TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 2. CUA HANG
-- ==============================
CREATE TABLE IF NOT EXISTS cua_hang (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_chuc_id      UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    ten             TEXT NOT NULL,
    ma_cua_hang     TEXT UNIQUE,
    dia_chi         TEXT,
    so_dien_thoai   TEXT,
    vi_do           DECIMAL(10, 7),
    kinh_do          DECIMAL(10, 7),
    ban_kinh_met    INTEGER DEFAULT 100,
    quan_ly_id      UUID,
    trang_thai      trang_thai_cua_hang DEFAULT 'hoat_dong',
    ngay_tao        TIMESTAMPTZ DEFAULT NOW(),
    ngay_cap_nhat   TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 3. CHUC VU
-- ==============================
CREATE TABLE IF NOT EXISTS chuc_vu (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_chuc_id      UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    ten             TEXT NOT NULL,
    ma_chuc_vu      TEXT,
    cap_bac         INTEGER DEFAULT 1 CHECK (cap_bac BETWEEN 1 AND 10),
    luong_co_ban    DECIMAL(15, 2) DEFAULT 0,
    quyen_han       JSONB DEFAULT '{}',
    ngay_tao        TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 4. NHAN VIEN
-- ==============================
CREATE TABLE IF NOT EXISTS nhan_vien (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id             UUID UNIQUE,
    to_chuc_id          UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    cua_hang_id         UUID REFERENCES cua_hang(id) ON DELETE SET NULL,
    chuc_vu_id          UUID REFERENCES chuc_vu(id) ON DELETE SET NULL,
    ma_nhan_vien        TEXT UNIQUE,
    email               TEXT UNIQUE,
    so_dien_thoai       TEXT,
    mat_khau_hash       TEXT,
    ho_ten              TEXT NOT NULL,
    anh_dai_dien        TEXT,
    ngay_sinh           DATE,
    gioi_tinh           gioi_tinh,
    so_cccd             TEXT,
    dia_chi             TEXT,
    ten_ngan_hang       TEXT,
    so_tai_khoan        TEXT,
    chu_tai_khoan_ngan_hang TEXT,
    noi_o_hien_tai      TEXT,
    ngay_cap_cccd       DATE,
    anh_cccd_truoc      TEXT,
    anh_cccd_sau        TEXT,
    ma_so_thue          TEXT,
    muc_luong_co_ban    DECIMAL(15, 2) DEFAULT 0,
    muc_luong_kpi       DECIMAL(15, 2) DEFAULT 0,
    tham_gia_bao_hiem   BOOLEAN DEFAULT FALSE,
    so_nguoi_phu_thuoc  INTEGER DEFAULT 0,
    dan_toc             TEXT DEFAULT 'Kinh',
    ton_giao            TEXT DEFAULT 'Không',
    cau_hinh_truong_bat_buoc JSONB DEFAULT '{}',
    ngay_bat_dau_lam    DATE DEFAULT CURRENT_DATE,
    loai_hop_dong       loai_hop_dong DEFAULT 'toan_thoi_gian',
    trang_thai          trang_thai_nhan_vien DEFAULT 'hoat_dong',
    vai_tro             vai_tro_nhan_vien DEFAULT 'nhan_vien',
    tong_diem           INTEGER DEFAULT 0,
    hang_thanh_vien     TEXT DEFAULT 'dong',
    ngay_tao            TIMESTAMPTZ DEFAULT NOW(),
    ngay_cap_nhat       TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 4b. LICH SU CONG TAC
-- ==============================
CREATE TABLE IF NOT EXISTS lich_su_cong_tac (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nhan_vien_id    UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    chuc_vu_id      UUID REFERENCES chuc_vu(id) ON DELETE SET NULL,
    cua_hang_id     UUID REFERENCES cua_hang(id) ON DELETE SET NULL,
    ngay_bat_dau    DATE NOT NULL DEFAULT CURRENT_DATE,
    ngay_ket_thuc   DATE,
    ghi_chu         TEXT,
    ngay_tao        TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 5. CAU HINH TO CHUC
-- ==============================
CREATE TABLE IF NOT EXISTS cau_hinh_to_chuc (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_chuc_id      UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    khoa            VARCHAR(50) NOT NULL,
    gia_tri         TEXT NOT NULL,
    ngay_cap_nhat   TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_cau_hinh_to_chuc_khoa UNIQUE(to_chuc_id, khoa)
);

-- ==============================
-- 6. CA LAM
-- ==============================
CREATE TABLE IF NOT EXISTS ca_lam (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_chuc_id      UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    ten             TEXT NOT NULL,
    ma_ca           TEXT,
    gio_bat_dau     TIME NOT NULL,
    gio_ket_thuc    TIME NOT NULL,
    phut_nghi       INTEGER DEFAULT 30,
    qua_dem         BOOLEAN DEFAULT FALSE,
    dang_hoat_dong  BOOLEAN DEFAULT TRUE,
    mau_hien_thi    TEXT DEFAULT '#001D3D',
    ngay_tao        TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 7. LICH PHAN CA
-- ==============================
CREATE TABLE IF NOT EXISTS lich_phan_ca (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nhan_vien_id    UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    cua_hang_id     UUID NOT NULL REFERENCES cua_hang(id) ON DELETE CASCADE,
    ca_lam_id       UUID NOT NULL REFERENCES ca_lam(id) ON DELETE RESTRICT,
    ngay            DATE NOT NULL,
    trang_thai      trang_thai_ca_lam DEFAULT 'da_xep',
    ghi_chu         TEXT,
    nguoi_tao_id    UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    ngay_tao        TIMESTAMPTZ DEFAULT NOW(),
    ngay_cap_nhat   TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_lich_phan_ca UNIQUE (nhan_vien_id, ngay, ca_lam_id)
);

-- ==============================
-- 8. CHAM CONG
-- ==============================
CREATE TABLE IF NOT EXISTS cham_cong (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nhan_vien_id            UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    cua_hang_id             UUID NOT NULL REFERENCES cua_hang(id) ON DELETE CASCADE,
    lich_phan_ca_id         UUID REFERENCES lich_phan_ca(id) ON DELETE SET NULL,
    ngay                    DATE NOT NULL,
    thoi_gian_check_in      TIMESTAMPTZ,
    vi_do_check_in          DECIMAL(10, 7),
    kinh_do_check_in         DECIMAL(10, 7),
    anh_check_in_url        TEXT,
    phuong_thuc_check_in    phuong_thuc_cham_cong DEFAULT 'gps',
    thoi_gian_check_out     TIMESTAMPTZ,
    vi_do_check_out         DECIMAL(10, 7),
    kinh_do_check_out        DECIMAL(10, 7),
    anh_check_out_url       TEXT,
    so_gio_thuc_te          DECIMAL(5, 2) DEFAULT 0,
    so_gio_tang_ca          DECIMAL(5, 2) DEFAULT 0,
    trang_thai              trang_thai_cham_cong DEFAULT 'cho_duyet',
    phut_di_muon            INTEGER DEFAULT 0,
    phut_ve_som             INTEGER DEFAULT 0,
    ghi_chu                 TEXT,
    nguoi_duyet_id          UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    thoi_gian_duyet         TIMESTAMPTZ,
    ngay_tao                TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 9. DON TU
-- ==============================
CREATE TABLE IF NOT EXISTS don_tu (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nhan_vien_id            UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    cua_hang_id             UUID NOT NULL REFERENCES cua_hang(id) ON DELETE CASCADE,
    loai_don                loai_don_tu NOT NULL,
    trang_thai              trang_thai_don_tu DEFAULT 'cho_duyet',
    ngay_bat_dau            DATE,
    ngay_ket_thuc           DATE,
    lich_phan_ca_goc_id     UUID REFERENCES lich_phan_ca(id) ON DELETE SET NULL,
    nhan_vien_nhan_doi_ca_id UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    lich_phan_ca_doi_id     UUID REFERENCES lich_phan_ca(id) ON DELETE SET NULL,
    ly_do                   TEXT,
    nguoi_duyet_id          UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    thoi_gian_duyet         TIMESTAMPTZ,
    ghi_chu_duyet           TEXT,
    ngay_tao                TIMESTAMPTZ DEFAULT NOW(),
    ngay_cap_nhat           TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 10. MAU KPI
-- ==============================
CREATE TABLE IF NOT EXISTS mau_kpi (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_chuc_id      UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    chuc_vu_id      UUID REFERENCES chuc_vu(id) ON DELETE SET NULL,
    ten             TEXT NOT NULL,
    mo_ta           TEXT,
    dang_hoat_dong  BOOLEAN DEFAULT TRUE,
    ngay_tao        TIMESTAMPTZ DEFAULT NOW(),
    ngay_cap_nhat   TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 11. CHI SO KPI
-- ==============================
CREATE TABLE IF NOT EXISTS chi_so_kpi (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mau_kpi_id          UUID NOT NULL REFERENCES mau_kpi(id) ON DELETE CASCADE,
    ten                 TEXT NOT NULL,
    ma_chi_so           TEXT,
    nhom                nhom_kpi DEFAULT 'quy_trinh',
    don_vi_tinh         TEXT DEFAULT '%',
    gia_tri_muc_tieu    DECIMAL(15, 2),
    trong_so            DECIMAL(5, 2) DEFAULT 0,
    dang_hoat_dong      BOOLEAN DEFAULT TRUE,
    ngay_tao            TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 12. DIEM KPI
-- ==============================
CREATE TABLE IF NOT EXISTS diem_kpi (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nhan_vien_id        UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    chi_so_kpi_id       UUID NOT NULL REFERENCES chi_so_kpi(id) ON DELETE RESTRICT,
    thang               INTEGER NOT NULL CHECK (thang BETWEEN 1 AND 12),
    nam                 INTEGER NOT NULL,
    gia_tri_thuc_te     DECIMAL(15, 2),
    diem_so             DECIMAL(5, 2),
    nguoi_nhap_id       UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    ghi_chu             TEXT,
    ngay_tao            TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_diem_kpi UNIQUE (nhan_vien_id, chi_so_kpi_id, thang, nam)
);

-- ==============================
-- 13. DOT DANH GIA
-- ==============================
CREATE TABLE IF NOT EXISTS dot_danh_gia (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_chuc_id      UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    ten             TEXT NOT NULL,
    ngay_bat_dau    DATE NOT NULL,
    ngay_ket_thuc   DATE NOT NULL,
    trang_thai      TEXT DEFAULT 'nhap',
    ngay_tao        TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 14. PHAN CONG DANH GIA
-- ==============================
CREATE TABLE IF NOT EXISTS phan_cong_danh_gia (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dot_danh_gia_id         UUID NOT NULL REFERENCES dot_danh_gia(id) ON DELETE CASCADE,
    nhan_vien_duoc_danh_gia_id UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    nguoi_danh_gia_id       UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    loai_phieu              loai_phieu_danh_gia DEFAULT 'dong_nghiep',
    diem_chi_tiet           JSONB DEFAULT '{}',
    nhat_xet                TEXT,
    trang_thai              trang_thai_danh_gia DEFAULT 'cho_danh_gia',
    thoi_gian_hoan_thanh    TIMESTAMPTZ,
    ngay_tao                TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uq_phan_cong_danh_gia UNIQUE (dot_danh_gia_id, nhan_vien_duoc_danh_gia_id, nguoi_danh_gia_id, loai_phieu)
);

-- ==============================
-- 15. CAP BAC SU NGHIEP
-- ==============================
CREATE TABLE IF NOT EXISTS cap_bac_su_nghiep (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_chuc_id          UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    cap_bac             INTEGER NOT NULL,
    ten                 VARCHAR(50) NOT NULL,
    so_thang_toan_thieu INTEGER DEFAULT 0,
    kpi_toan_thieu      DECIMAL(5,2) DEFAULT 0,
    khung_luong         VARCHAR(50),
    CONSTRAINT uq_cap_bac_su_nghiep UNIQUE(to_chuc_id, cap_bac)
);

-- ==============================
-- 16. TIEN TRINH SU NGHIEP
-- ==============================
CREATE TABLE IF NOT EXISTS tien_trinh_su_nghiep (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nhan_vien_id            UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    cap_bac_hien_tai        INTEGER NOT NULL,
    cap_bac_muc_tieu        INTEGER NOT NULL,
    phan_tram_hoan_thanh    DECIMAL(5,2) DEFAULT 0,
    du_lieu_tien_trinh      JSONB DEFAULT '{}',
    lan_tinh_cuoi           TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tien_trinh_su_nghiep_nhan_vien UNIQUE(nhan_vien_id)
);

-- ==============================
-- 17. HUY HIEU
-- ==============================
CREATE TABLE IF NOT EXISTS huy_hieu (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_chuc_id      UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    ten             VARCHAR(50) NOT NULL,
    emoji           VARCHAR(10),
    mo_ta           TEXT,
    loai            loai_huy_hieu DEFAULT 'chuyen_can',
    diem_yeu_cau    INTEGER DEFAULT 0,
    ngay_tao        TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 18. HUY HIEU NHAN VIEN
-- ==============================
CREATE TABLE IF NOT EXISTS huy_hieu_nhan_vien (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nhan_vien_id    UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    huy_hieu_id     UUID NOT NULL REFERENCES huy_hieu(id) ON DELETE CASCADE,
    ngay_dat        TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_nhan_vien_huy_hieu UNIQUE(nhan_vien_id, huy_hieu_id)
);

-- ==============================
-- 19. GIAO DICH DIEM
-- ==============================
CREATE TABLE IF NOT EXISTS giao_dich_diem (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nhan_vien_id    UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    so_diem         INTEGER NOT NULL,
    loai            loai_giao_dich_diem NOT NULL,
    ly_do           TEXT NOT NULL,
    nguon           VARCHAR(30),
    ngay            DATE DEFAULT CURRENT_DATE,
    ngay_tao        TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 20. DANH MUC PHAN THUONG
-- ==============================
CREATE TABLE IF NOT EXISTS danh_muc_phan_thuong (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_chuc_id      UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    ten             VARCHAR(100) NOT NULL,
    emoji           VARCHAR(10),
    diem_doi        INTEGER NOT NULL,
    so_luong_ton    INTEGER DEFAULT 0,
    dang_hoat_dong  BOOLEAN DEFAULT TRUE,
    ngay_tao        TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 21. DOI PHAN THUONG
-- ==============================
CREATE TABLE IF NOT EXISTS doi_phan_thuong (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nhan_vien_id            UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    phan_thuong_id          UUID NOT NULL REFERENCES danh_muc_phan_thuong(id) ON DELETE CASCADE,
    diem_da_dung            INTEGER NOT NULL,
    trang_thai              trang_thai_doi_thuong DEFAULT 'cho_duyet',
    ngay_tao                TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 22. TIN NHAN CHAT
-- ==============================
CREATE TABLE IF NOT EXISTS tin_nhan_chat (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_chuc_id      UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    cua_hang_id     UUID REFERENCES cua_hang(id) ON DELETE CASCADE,
    nguoi_gui_id    UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    noi_dung        TEXT NOT NULL,
    ngay_tao        TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 23. KHEN NGOI
-- ==============================
CREATE TABLE IF NOT EXISTS khen_ngoi (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nguoi_gui_id    UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    nguoi_nhan_id   UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    loai            loai_khen_ngoi DEFAULT 'cam_on',
    loi_nhan        TEXT NOT NULL,
    so_diem_tang    INTEGER DEFAULT 5,
    ngay_tao        TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 24. KY LUONG
-- ==============================
CREATE TABLE IF NOT EXISTS ky_luong (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_chuc_id          UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    thang               INTEGER NOT NULL CHECK (thang BETWEEN 1 AND 12),
    nam                 INTEGER NOT NULL,
    trang_thai          trang_thai_ky_luong DEFAULT 'nhap',
    tong_luong_gross    DECIMAL(15, 2) DEFAULT 0,
    tong_luong_net      DECIMAL(15, 2) DEFAULT 0,
    nguoi_xac_nhan_id   UUID REFERENCES nhan_vien(id) ON DELETE SET NULL,
    ngay_thanh_toan     TIMESTAMPTZ,
    ngay_tao            TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_ky_luong UNIQUE(to_chuc_id, nam, thang)
);

-- ==============================
-- 25. PHIEU LUONG
-- ==============================
CREATE TABLE IF NOT EXISTS phieu_luong (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ky_luong_id             UUID NOT NULL REFERENCES ky_luong(id) ON DELETE RESTRICT,
    nhan_vien_id            UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    bo_phan                 TEXT,
    level                   TEXT,
    loai_nhan_vien          TEXT,
    luong_co_ban            DECIMAL(15, 2) DEFAULT 0,
    so_ca                   INTEGER DEFAULT 0,
    tong_so_gio             DECIMAL(6, 2) DEFAULT 0,
    so_gio_thuong           DECIMAL(6, 2) DEFAULT 0,
    so_gio_tang_ca          DECIMAL(5, 2) DEFAULT 0,
    tong_so_cong            DECIMAL(5, 2) DEFAULT 0,
    so_cong_thuong          DECIMAL(5, 2) DEFAULT 0,
    so_cong_tang_ca         DECIMAL(5, 2) DEFAULT 0,
    tien_tang_ca            DECIMAL(15, 2) DEFAULT 0,
    luong_theo_gio          DECIMAL(15, 2) DEFAULT 0,
    tong_phu_cap            DECIMAL(15, 2) DEFAULT 0,
    tong_phieu_cong         DECIMAL(15, 2) DEFAULT 0,
    tong_phat               DECIMAL(15, 2) DEFAULT 0,
    tong_phieu_tru          DECIMAL(15, 2) DEFAULT 0,
    luong_kpi               DECIMAL(15, 2) DEFAULT 0,
    tien_cong_doan          DECIMAL(15, 2) DEFAULT 0,
    tong_luong              DECIMAL(15, 2) DEFAULT 0,
    hoan_giu_luong          DECIMAL(15, 2) DEFAULT 0,
    giu_luong               DECIMAL(15, 2) DEFAULT 0,
    ung_luong               DECIMAL(15, 2) DEFAULT 0,
    luong_thuc_nhan         DECIMAL(15, 2) DEFAULT 0,
    lam_tron                DECIMAL(15, 2) DEFAULT 0,
    trang_thai              VARCHAR(50) DEFAULT 'chua_gui_phieu_luong',
    ghi_chu                 TEXT,
    ngay_tao                TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_phieu_luong_nhan_vien UNIQUE(ky_luong_id, nhan_vien_id)
);

-- ==============================
-- 26. MAU HOP DONG
-- ==============================
CREATE TABLE IF NOT EXISTS mau_hop_dong (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    to_chuc_id      UUID NOT NULL REFERENCES to_chuc(id) ON DELETE CASCADE,
    ten             TEXT NOT NULL,
    mo_ta           TEXT DEFAULT '',
    loai_hop_dong   loai_hop_dong DEFAULT 'toan_thoi_gian',
    cac_khoi_noi_dung JSONB DEFAULT '[]',
    dang_hoat_dong  BOOLEAN DEFAULT TRUE,
    ngay_tao        TIMESTAMPTZ DEFAULT NOW(),
    ngay_cap_nhat   TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================
-- 27. HOP DONG NHAN VIEN
-- ==============================
CREATE TABLE IF NOT EXISTS hop_dong_nhan_vien (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mau_hop_dong_id     UUID NOT NULL REFERENCES mau_hop_dong(id) ON DELETE RESTRICT,
    nhan_vien_id        UUID NOT NULL REFERENCES nhan_vien(id) ON DELETE CASCADE,
    cua_hang_id         UUID REFERENCES cua_hang(id) ON DELETE SET NULL,
    chuc_vu_id          UUID REFERENCES chuc_vu(id) ON DELETE SET NULL,
    trang_thai          trang_thai_hop_dong DEFAULT 'nhap',
    ngay_bat_dau        DATE NOT NULL,
    ngay_ket_thuc       DATE,
    noi_dung_da_tao     TEXT DEFAULT '',
    chu_ky_so           JSONB DEFAULT '[]',
    nhat_ky_thao_tac    JSONB DEFAULT '[]',
    ngay_tao            TIMESTAMPTZ DEFAULT NOW(),
    ngay_cap_nhat       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 28. BỔ SUNG CỘT AN TOÀN CHO BẢNG ĐÃ TỒN TẠI (MIGRATION)
-- ============================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nhan_vien' AND column_name = 'auth_id') THEN
        ALTER TABLE nhan_vien ADD COLUMN auth_id UUID UNIQUE;
    END IF;
END $$;

-- ============================================================
-- 29. TRIGGER TỰ ĐỘNG CẬP NHẬT `ngay_cap_nhat`
-- ============================================================
CREATE OR REPLACE FUNCTION fn_cap_nhat_thoi_gian()
RETURNS TRIGGER AS $$
BEGIN
    NEW.ngay_cap_nhat = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
    t TEXT;
    tables TEXT[] := ARRAY[
        'to_chuc', 'cua_hang', 'nhan_vien', 'cau_hinh_to_chuc',
        'lich_phan_ca', 'don_tu', 'mau_kpi', 'mau_hop_dong', 'hop_dong_nhan_vien'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP TRIGGER IF EXISTS trg_cap_nhat_%I ON public.%I;', t, t);
        EXECUTE format(
            'CREATE TRIGGER trg_cap_nhat_%I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION fn_cap_nhat_thoi_gian();',
            t, t
        );
    END LOOP;
END $$;

-- ============================================================
-- 30. BỘ CHỈ MỤC TỐI ƯU HIỆU NĂNG (PERFORMANCE INDEXES)
-- ============================================================

-- Cửa hàng & Chức vụ
CREATE INDEX IF NOT EXISTS idx_cua_hang_to_chuc ON cua_hang(to_chuc_id);
CREATE INDEX IF NOT EXISTS idx_chuc_vu_to_chuc ON chuc_vu(to_chuc_id);

-- Nhân viên
CREATE INDEX IF NOT EXISTS idx_nhan_vien_to_chuc ON nhan_vien(to_chuc_id);
CREATE INDEX IF NOT EXISTS idx_nhan_vien_cua_hang ON nhan_vien(cua_hang_id);
CREATE INDEX IF NOT EXISTS idx_nhan_vien_trang_thai ON nhan_vien(trang_thai);
CREATE INDEX IF NOT EXISTS idx_nhan_vien_vai_tro ON nhan_vien(vai_tro);
CREATE INDEX IF NOT EXISTS idx_nhan_vien_auth_id ON nhan_vien(auth_id);
CREATE INDEX IF NOT EXISTS idx_lich_su_cong_tac_nhan_vien ON lich_su_cong_tac(nhan_vien_id);

-- Ca làm & Lịch phân ca
CREATE INDEX IF NOT EXISTS idx_ca_lam_to_chuc ON ca_lam(to_chuc_id);
CREATE INDEX IF NOT EXISTS idx_lich_phan_ca_nhan_vien_ngay ON lich_phan_ca(nhan_vien_id, ngay);
CREATE INDEX IF NOT EXISTS idx_lich_phan_ca_cua_hang_ngay ON lich_phan_ca(cua_hang_id, ngay);
CREATE INDEX IF NOT EXISTS idx_lich_phan_ca_trang_thai ON lich_phan_ca(trang_thai);

-- Chấm công (Tải cao)
CREATE INDEX IF NOT EXISTS idx_cham_cong_nhan_vien_ngay ON cham_cong(nhan_vien_id, ngay);
CREATE INDEX IF NOT EXISTS idx_cham_cong_cua_hang_ngay ON cham_cong(cua_hang_id, ngay);
CREATE INDEX IF NOT EXISTS idx_cham_cong_trang_thai ON cham_cong(trang_thai);
CREATE INDEX IF NOT EXISTS idx_cham_cong_lich_phan_ca ON cham_cong(lich_phan_ca_id);

-- Đơn từ
CREATE INDEX IF NOT EXISTS idx_don_tu_nhan_vien ON don_tu(nhan_vien_id);
CREATE INDEX IF NOT EXISTS idx_don_tu_cua_hang ON don_tu(cua_hang_id);
CREATE INDEX IF NOT EXISTS idx_don_tu_trang_thai ON don_tu(trang_thai);

-- KPI & Đánh giá
CREATE INDEX IF NOT EXISTS idx_mau_kpi_to_chuc ON mau_kpi(to_chuc_id);
CREATE INDEX IF NOT EXISTS idx_chi_so_kpi_mau ON chi_so_kpi(mau_kpi_id);
CREATE INDEX IF NOT EXISTS idx_diem_kpi_nhan_vien_ky ON diem_kpi(nhan_vien_id, nam, thang);
CREATE INDEX IF NOT EXISTS idx_dot_danh_gia_to_chuc ON dot_danh_gia(to_chuc_id);
CREATE INDEX IF NOT EXISTS idx_phan_cong_danh_gia_dot ON phan_cong_danh_gia(dot_danh_gia_id);
CREATE INDEX IF NOT EXISTS idx_phan_cong_danh_gia_nv ON phan_cong_danh_gia(nhan_vien_duoc_danh_gia_id);
CREATE INDEX IF NOT EXISTS idx_phan_cong_danh_gia_nguoi_dg ON phan_cong_danh_gia(nguoi_danh_gia_id);

-- Sự nghiệp & Gamification
CREATE INDEX IF NOT EXISTS idx_cap_bac_su_nghiep_to_chuc ON cap_bac_su_nghiep(to_chuc_id);
CREATE INDEX IF NOT EXISTS idx_huy_hieu_to_chuc ON huy_hieu(to_chuc_id);
CREATE INDEX IF NOT EXISTS idx_huy_hieu_nhan_vien_nv ON huy_hieu_nhan_vien(nhan_vien_id);
CREATE INDEX IF NOT EXISTS idx_giao_dich_diem_nv_ngay ON giao_dich_diem(nhan_vien_id, ngay);
CREATE INDEX IF NOT EXISTS idx_danh_muc_phan_thuong_to_chuc ON danh_muc_phan_thuong(to_chuc_id);
CREATE INDEX IF NOT EXISTS idx_doi_phan_thuong_nv ON doi_phan_thuong(nhan_vien_id);
CREATE INDEX IF NOT EXISTS idx_tin_nhan_chat_cua_hang_ngay ON tin_nhan_chat(cua_hang_id, ngay_tao);
CREATE INDEX IF NOT EXISTS idx_khen_ngoi_nguoi_nhan ON khen_ngoi(nguoi_nhan_id);
CREATE INDEX IF NOT EXISTS idx_khen_ngoi_nguoi_gui ON khen_ngoi(nguoi_gui_id);

-- Lương & Hợp đồng
CREATE INDEX IF NOT EXISTS idx_ky_luong_to_chuc ON ky_luong(to_chuc_id, nam, thang);
CREATE INDEX IF NOT EXISTS idx_phieu_luong_ky_luong ON phieu_luong(ky_luong_id);
CREATE INDEX IF NOT EXISTS idx_phieu_luong_nhan_vien ON phieu_luong(nhan_vien_id);
CREATE INDEX IF NOT EXISTS idx_mau_hop_dong_to_chuc ON mau_hop_dong(to_chuc_id);
CREATE INDEX IF NOT EXISTS idx_hop_dong_nhan_vien_nv ON hop_dong_nhan_vien(nhan_vien_id);
CREATE INDEX IF NOT EXISTS idx_hop_dong_nhan_vien_trang_thai ON hop_dong_nhan_vien(trang_thai);

-- ============================================================
-- ✅ IDEMPOTENT MASTER SCHEMA v3.0 OPTIMIZED COMPLETE
-- ============================================================

