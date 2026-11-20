export type StorageStatusCode =
  | 'connected'
  | 'unconfigured'
  | 'table_missing'
  | 'auth_error'
  | 'unreachable'

export interface StorageStatusInfo {
  provider: 'supabase_cloud' | 'local_file'
  status: StorageStatusCode
  ready_for_vercel: boolean
  using_service_role: boolean
  supabase_host: string | null
  reason: string
  last_checked_at: string | null
  last_synced_at: string | null
}

export const PERSISTED_KEYS = [
  'stores',
  'employees',
  'shifts',
  'attendance',
  'payroll_summaries',
  'salary_slips',
  'contracts',
  'invitations',
  'bsc_targets',
  'bsc_logs',
  'bsc_settings',
  'sessions',
  'shift_templates',
  'incidents',
  'notifications',
  'ipos_integration',
] as const

const TABLE_NAME = 'homies_runtime_store'
const TIMEOUT_MS = 3000
const COOLDOWN_MS = 60_000

let lastFailureAt = 0
let lastSyncedSnapshot = new Map<string, string>()

let currentStatus: StorageStatusInfo = {
  provider: 'local_file',
  status: 'unconfigured',
  ready_for_vercel: false,
  using_service_role: false,
  supabase_host: null,
  reason: 'Chưa kiểm tra kết nối Supabase Đám Mây.',
  last_checked_at: null,
  last_synced_at: null,
}

interface SupabaseServerConfig {
  configured: boolean
  disabledByFlag: boolean
  url: string
  host: string | null
  key: string
  usingServiceRole: boolean
}

function getSupabaseServerConfig(): SupabaseServerConfig {
  const disabledByFlag = process.env.NEXT_PUBLIC_USE_REAL_SUPABASE === 'false'
  const rawUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').trim().replace(/\/+$/, '')
  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  const anonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim()
  const key = serviceRoleKey || anonKey
  const usingServiceRole = Boolean(serviceRoleKey)

  let host: string | null = null
  if (rawUrl) {
    try {
      host = new URL(rawUrl).hostname
    } catch {
      host = null
    }
  }

  const configured =
    !disabledByFlag &&
    Boolean(rawUrl) &&
    rawUrl.startsWith('https://') &&
    !rawUrl.includes('placeholder.supabase.co') &&
    Boolean(key) &&
    key !== 'placeholder-key'

  return {
    configured,
    disabledByFlag,
    url: rawUrl,
    host,
    key,
    usingServiceRole,
  }
}

function isInCooldown(): boolean {
  return lastFailureAt > 0 && Date.now() - lastFailureAt < COOLDOWN_MS
}

function markUnconfigured(cfg: SupabaseServerConfig): void {
  currentStatus = {
    provider: 'local_file',
    status: 'unconfigured',
    ready_for_vercel: false,
    using_service_role: cfg.usingServiceRole,
    supabase_host: cfg.host,
    reason: cfg.disabledByFlag
      ? 'Đã tắt cờ kết nối Supabase trong cấu hình môi trường.'
      : 'Chưa cấu hình URL và khóa Supabase hợp lệ trong biến môi trường.',
    last_checked_at: new Date().toISOString(),
    last_synced_at: currentStatus.last_synced_at,
  }
}

function markConnected(cfg: SupabaseServerConfig, updatedSyncTime: boolean): void {
  lastFailureAt = 0
  const nowIso = new Date().toISOString()
  currentStatus = {
    provider: 'supabase_cloud',
    status: 'connected',
    ready_for_vercel: true,
    using_service_role: cfg.usingServiceRole,
    supabase_host: cfg.host,
    reason: cfg.usingServiceRole
      ? 'Đã kết nối Supabase Đám Mây (Bảo mật Service Role — Sẵn sàng Deploy Vercel).'
      : 'Đã kết nối Supabase Đám Mây (Khuyên bổ sung SUPABASE_SERVICE_ROLE_KEY để tăng bảo mật RLS).',
    last_checked_at: nowIso,
    last_synced_at: updatedSyncTime ? nowIso : currentStatus.last_synced_at,
  }
}

function markFailure(
  cfg: SupabaseServerConfig,
  code: Exclude<StorageStatusCode, 'connected' | 'unconfigured'>,
  reason: string
): void {
  lastFailureAt = Date.now()
  currentStatus = {
    provider: 'local_file',
    status: code,
    ready_for_vercel: false,
    using_service_role: cfg.usingServiceRole,
    supabase_host: cfg.host,
    reason,
    last_checked_at: new Date().toISOString(),
    last_synced_at: currentStatus.last_synced_at,
  }
}

function classifyHttpFailure(
  cfg: SupabaseServerConfig,
  httpStatus: number,
  bodyText: string
): void {
  const lower = bodyText.toLowerCase()
  if (
    httpStatus === 404 ||
    lower.includes('pgrst205') ||
    lower.includes('42p01') ||
    lower.includes('does not exist')
  ) {
    markFailure(
      cfg,
      'table_missing',
      'Đã nối tới Supabase nhưng chưa tạo bảng homies_runtime_store. Hãy chạy file supabase/schema_v5_runtime_persistence.sql trong SQL Editor.'
    )
    return
  }

  if (
    httpStatus === 401 ||
    httpStatus === 403 ||
    lower.includes('42501') ||
    lower.includes('row-level security')
  ) {
    markFailure(
      cfg,
      'auth_error',
      'Supabase từ chối quyền truy cập. Hãy thêm khóa SUPABASE_SERVICE_ROLE_KEY vào biến môi trường (Vercel / .env.local).'
    )
    return
  }

  markFailure(
    cfg,
    'unreachable',
    `Không kết nối được tới máy chủ Supabase (${cfg.host || 'chưa rõ'}) [HTTP ${httpStatus}].`
  )
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    })
  } finally {
    clearTimeout(timer)
  }
}

function buildHeaders(key: string, extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
    ...extra,
  }
}

export async function loadCollectionsFromSupabase(options?: {
  forceCheck?: boolean
}): Promise<{ ok: boolean; empty?: boolean; collections?: Record<string, unknown> }> {
  const cfg = getSupabaseServerConfig()
  if (!cfg.configured) {
    markUnconfigured(cfg)
    return { ok: false }
  }

  if (!options?.forceCheck && isInCooldown()) {
    return { ok: false }
  }

  try {
    const endpoint = `${cfg.url}/rest/v1/${TABLE_NAME}?select=collection_key,payload`
    const res = await fetchWithTimeout(endpoint, {
      method: 'GET',
      headers: buildHeaders(cfg.key),
    })

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '')
      classifyHttpFailure(cfg, res.status, bodyText)
      return { ok: false }
    }

    const rows = (await res.json()) as Array<{ collection_key?: string; payload?: unknown }>
    if (!Array.isArray(rows) || rows.length === 0) {
      markConnected(cfg, false)
      return { ok: true, empty: true, collections: {} }
    }

    const collections: Record<string, unknown> = {}
    const nextSnapshot = new Map<string, string>()

    for (const row of rows) {
      if (row && typeof row.collection_key === 'string' && row.payload !== undefined) {
        collections[row.collection_key] = row.payload
        nextSnapshot.set(row.collection_key, JSON.stringify(row.payload))
      }
    }

    lastSyncedSnapshot = nextSnapshot
    markConnected(cfg, true)
    return { ok: true, empty: false, collections }
  } catch {
    markFailure(
      cfg,
      'unreachable',
      `Không kết nối được tới máy chủ Supabase (${cfg.host || 'chưa rõ'}) — dự án cũ có thể đã tạm ngưng/xóa. Cần cập nhật URL dự án Supabase mới.`
    )
    return { ok: false }
  }
}

export async function saveCollectionsToSupabase(
  dbObj: Record<string, unknown>,
  options?: { forceAll?: boolean }
): Promise<boolean> {
  const cfg = getSupabaseServerConfig()
  if (!cfg.configured) {
    markUnconfigured(cfg)
    return false
  }

  if (!options?.forceAll && isInCooldown()) {
    return false
  }

  const nowIso = new Date().toISOString()
  const rowsToUpsert: Array<{ collection_key: string; payload: unknown; updated_at: string }> = []
  const stagedSerialized = new Map<string, string>()

  for (const key of PERSISTED_KEYS) {
    const val = dbObj[key]
    if (val === undefined) continue
    const serialized = JSON.stringify(val)
    if (options?.forceAll || lastSyncedSnapshot.get(key) !== serialized) {
      rowsToUpsert.push({
        collection_key: key,
        payload: val,
        updated_at: nowIso,
      })
      stagedSerialized.set(key, serialized)
    }
  }

  if (rowsToUpsert.length === 0) {
    return currentStatus.status === 'connected'
  }

  try {
    const endpoint = `${cfg.url}/rest/v1/${TABLE_NAME}?on_conflict=collection_key`
    const res = await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: buildHeaders(cfg.key, {
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify(rowsToUpsert),
    })

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '')
      classifyHttpFailure(cfg, res.status, bodyText)
      return false
    }

    for (const [k, serialized] of stagedSerialized.entries()) {
      lastSyncedSnapshot.set(k, serialized)
    }
    markConnected(cfg, true)
    return true
  } catch {
    markFailure(
      cfg,
      'unreachable',
      `Không kết nối được tới máy chủ Supabase (${cfg.host || 'chưa rõ'}) — dự án cũ có thể đã tạm ngưng/xóa. Cần cập nhật URL dự án Supabase mới.`
    )
    return false
  }
}

export async function getStorageStatus(options?: {
  forceCheck?: boolean
}): Promise<StorageStatusInfo> {
  const cfg = getSupabaseServerConfig()
  if (!cfg.configured) {
    markUnconfigured(cfg)
    return { ...currentStatus }
  }

  const neverChecked = currentStatus.last_checked_at === null
  const shouldProbe = Boolean(options?.forceCheck) || (neverChecked && !isInCooldown())

  if (shouldProbe) {
    try {
      const endpoint = `${cfg.url}/rest/v1/${TABLE_NAME}?select=collection_key&limit=1`
      const res = await fetchWithTimeout(endpoint, {
        method: 'GET',
        headers: buildHeaders(cfg.key),
      })

      if (!res.ok) {
        const bodyText = await res.text().catch(() => '')
        classifyHttpFailure(cfg, res.status, bodyText)
      } else {
        markConnected(cfg, false)
      }
    } catch {
      markFailure(
        cfg,
        'unreachable',
        `Không kết nối được tới máy chủ Supabase (${cfg.host || 'chưa rõ'}) — dự án cũ có thể đã tạm ngưng/xóa. Cần cập nhật URL dự án Supabase mới.`
      )
    }
  }

  return { ...currentStatus }
}

export function resetSupabaseStoreStateForTests(): void {
  lastFailureAt = 0
  lastSyncedSnapshot = new Map<string, string>()
  currentStatus = {
    provider: 'local_file',
    status: 'unconfigured',
    ready_for_vercel: false,
    using_service_role: false,
    supabase_host: null,
    reason: 'Chưa kiểm tra kết nối Supabase Đám Mây.',
    last_checked_at: null,
    last_synced_at: null,
  }
}

