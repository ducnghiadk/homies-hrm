-- ============================================================
-- Homies Milk Tea HRM — Schema v5 Runtime Persistence (Vercel + Supabase)
-- Hướng dẫn: Mở Supabase Dashboard -> SQL Editor -> Dán toàn bộ file này -> Bấm Run
-- ============================================================

CREATE TABLE IF NOT EXISTS public.homies_runtime_store (
  collection_key TEXT PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.homies_runtime_store IS
  'Kho lưu trữ bền vững toàn bộ dữ liệu vận hành Homies HRM cho triển khai Vercel Serverless.';

-- Bật Row Level Security (RLS) để chặn truy cập công khai từ trình duyệt bên ngoài.
-- Máy chủ Next.js sử dụng khóa bí mật SUPABASE_SERVICE_ROLE_KEY sẽ tự động có toàn quyền đọc/ghi an toàn.
ALTER TABLE public.homies_runtime_store ENABLE ROW LEVEL SECURITY;

-- Chỉ mục thời gian cập nhật phục vụ kiểm toán đồng bộ
CREATE INDEX IF NOT EXISTS idx_homies_runtime_store_updated_at
  ON public.homies_runtime_store (updated_at DESC);

