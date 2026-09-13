UPDATE public.nhan_vien
SET trang_thai = 'da_nghi_viec'
WHERE ma_nhan_vien LIKE 'KPI-%'
  AND trang_thai IS DISTINCT FROM 'da_nghi_viec';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_nhan_vien_auth_id_auth_users'
          AND conrelid = 'public.nhan_vien'::regclass
    ) THEN
        ALTER TABLE public.nhan_vien
        ADD CONSTRAINT fk_nhan_vien_auth_id_auth_users
        FOREIGN KEY (auth_id)
        REFERENCES auth.users(id)
        ON DELETE SET NULL;
    END IF;
END $$;

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT conname
        FROM pg_constraint
        WHERE conrelid = 'public.nhan_vien'::regclass
          AND contype = 'u'
          AND conkey = ARRAY[
              (
                  SELECT attnum
                  FROM pg_attribute
                  WHERE attrelid = 'public.nhan_vien'::regclass
                    AND attname = 'ma_nhan_vien'
                    AND NOT attisdropped
              )
          ]::smallint[]
    LOOP
        EXECUTE format('ALTER TABLE public.nhan_vien DROP CONSTRAINT IF EXISTS %I', r.conname);
    END LOOP;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'uq_nhan_vien_to_chuc_ma_nhan_vien'
          AND conrelid = 'public.nhan_vien'::regclass
    ) THEN
        ALTER TABLE public.nhan_vien
        ADD CONSTRAINT uq_nhan_vien_to_chuc_ma_nhan_vien
        UNIQUE (to_chuc_id, ma_nhan_vien);
    END IF;
END $$;

-- Giữ nguyên UNIQUE(email) toàn cục vì auth.users.email là duy nhất toàn cục trong 1 project.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'ck_nhan_vien_trang_thai_p2a'
          AND conrelid = 'public.nhan_vien'::regclass
    ) THEN
        ALTER TABLE public.nhan_vien
        ADD CONSTRAINT ck_nhan_vien_trang_thai_p2a
        CHECK (trang_thai IN ('hoat_dong', 'tam_nghi', 'da_nghi_viec'));
    END IF;
END $$;

ALTER TABLE public.chuc_vu
ADD COLUMN IF NOT EXISTS ngay_cap_nhat TIMESTAMPTZ NOT NULL DEFAULT now();
