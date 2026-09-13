// ============================================
// HRM Trà Sữa 🧋 — Adapter Configuration
// Switch between Mock Data & Real Supabase DB
// ============================================

export interface RepositoryConfig {
  useRealSupabase: boolean;
  enableLocalStorageFallback: boolean;
  debugLogs: boolean;
}

export const repositoryConfig: RepositoryConfig = {
  // Bật true khi chuyển sang dùng Supabase DB thật (Schema v3 master)
  useRealSupabase: process.env.NEXT_PUBLIC_USE_REAL_SUPABASE !== 'false',
  enableLocalStorageFallback: true,
  debugLogs: process.env.NODE_ENV === 'development',
};

export const isRealDbMode = (): boolean => repositoryConfig.useRealSupabase;
