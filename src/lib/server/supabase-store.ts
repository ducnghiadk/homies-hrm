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
  'official_schedules',
  'schedule_weeks',
  'schedule_change_logs',
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
const PROBE_TIMEOUT_MS = 5000
const DATA_TIMEOUT_MS = 20_000
const MAX_BATCH_BYTES = 150_000
const COOLDOWN_MS = 60_000

let lastFailureAt = 0
let lastSyncedSnapshot = new Map<string, string>()
let remoteUpdatedAt = new Map<string, string>()

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

function formatNetworkFailureReason(err: unknown, host: string | null): string {
  const safeHost = host || 'chưa rõ'
  if (err instanceof Error && err.name === 'AbortError') {
    return `Máy chủ Supabase (${safeHost}) phản hồi chậm quá thời gian chờ. Hệ thống tạm dùng file nội bộ và sẽ tự thử lại.`
  }
  return `Không kết nối được tới máy chủ Supabase (${safeHost}) — kiểm tra lại mạng hoặc trạng thái dự án Supabase.`
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = DATA_TIMEOUT_MS
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
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

type SupabaseRuntimeRow = {
  collection_key?: string
  payload?: unknown
  updated_at?: string
}

function recordLoadedRows(rows: SupabaseRuntimeRow[], resetMaps: boolean): Record<string, unknown> {
  if (resetMaps) {
    lastSyncedSnapshot = new Map<string, string>()
    remoteUpdatedAt = new Map<string, string>()
  }
  const collections: Record<string, unknown> = {}
  for (const row of rows) {
    if (row && typeof row.collection_key === 'string' && row.payload !== undefined) {
      collections[row.collection_key] = row.payload
      lastSyncedSnapshot.set(row.collection_key, JSON.stringify(row.payload))
      if (typeof row.updated_at === 'string' && row.updated_at) {
        remoteUpdatedAt.set(row.collection_key, row.updated_at)
      }
    }
  }
  return collections
}

export async function loadCollectionsFromSupabase(options?: {
  forceCheck?: boolean
  hasLocalCache?: boolean
}): Promise<{
  ok: boolean
  empty?: boolean
  unchanged?: boolean
  partial?: boolean
  collections?: Record<string, unknown>
}> {
  const cfg = getSupabaseServerConfig()
  if (!cfg.configured) {
    markUnconfigured(cfg)
    return { ok: false }
  }

  if (!options?.forceCheck && isInCooldown()) {
    return { ok: false }
  }

  try {
    // 1. Kiểm tra siêu nhẹ (metadata <1KB) nếu container đã có sẵn bộ nhớ đệm
    if (options?.hasLocalCache && remoteUpdatedAt.size > 0) {
      const metaEndpoint = `${cfg.url}/rest/v1/${TABLE_NAME}?select=collection_key,updated_at`
      const metaRes = await fetchWithTimeout(
        metaEndpoint,
        {
          method: 'GET',
          headers: buildHeaders(cfg.key),
        },
        PROBE_TIMEOUT_MS
      )

      if (!metaRes.ok) {
        const bodyText = await metaRes.text().catch(() => '')
        classifyHttpFailure(cfg, metaRes.status, bodyText)
        return { ok: false }
      }

      const metaRows = (await metaRes.json()) as Array<{ collection_key?: string; updated_at?: string }>
      if (!Array.isArray(metaRows) || metaRows.length === 0) {
        markConnected(cfg, false)
        return { ok: true, empty: true, collections: {} }
      }

      const changedKeys: string[] = []
      for (const row of metaRows) {
        if (row && typeof row.collection_key === 'string') {
          const prevUpdatedAt = remoteUpdatedAt.get(row.collection_key)
          if (!prevUpdatedAt || prevUpdatedAt !== row.updated_at) {
            changedKeys.push(row.collection_key)
          }
        }
      }

      if (changedKeys.length === 0) {
        markConnected(cfg, false)
        return { ok: true, unchanged: true }
      }

      const filterList = changedKeys.map((k) => encodeURIComponent(k)).join(',')
      const deltaEndpoint = `${cfg.url}/rest/v1/${TABLE_NAME}?collection_key=in.(${filterList})&select=collection_key,payload,updated_at`
      const deltaRes = await fetchWithTimeout(
        deltaEndpoint,
        {
          method: 'GET',
          headers: buildHeaders(cfg.key),
        },
        DATA_TIMEOUT_MS
      )

      if (!deltaRes.ok) {
        const bodyText = await deltaRes.text().catch(() => '')
        classifyHttpFailure(cfg, deltaRes.status, bodyText)
        return { ok: false }
      }

      const deltaRows = (await deltaRes.json()) as SupabaseRuntimeRow[]
      const collections = recordLoadedRows(Array.isArray(deltaRows) ? deltaRows : [], false)
      markConnected(cfg, true)
      return { ok: true, empty: false, partial: true, collections }
    }

    // 2. Nạp toàn bộ lần đầu (Cold start)
    const endpoint = `${cfg.url}/rest/v1/${TABLE_NAME}?select=collection_key,payload,updated_at`
    const res = await fetchWithTimeout(
      endpoint,
      {
        method: 'GET',
        headers: buildHeaders(cfg.key),
      },
      DATA_TIMEOUT_MS
    )

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '')
      classifyHttpFailure(cfg, res.status, bodyText)
      return { ok: false }
    }

    const rows = (await res.json()) as SupabaseRuntimeRow[]
    if (!Array.isArray(rows) || rows.length === 0) {
      markConnected(cfg, false)
      return { ok: true, empty: true, collections: {} }
    }

    const collections = recordLoadedRows(rows, true)
    markConnected(cfg, true)
    return { ok: true, empty: false, partial: false, collections }
  } catch (err) {
    markFailure(cfg, 'unreachable', formatNetworkFailureReason(err, cfg.host))
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
  const stagedItems: Array<{
    key: string
    serialized: string
    row: { collection_key: string; payload: unknown; updated_at: string }
    bytes: number
  }> = []

  for (const key of PERSISTED_KEYS) {
    const val = dbObj[key]
    if (val === undefined) continue
    const serialized = JSON.stringify(val)
    if (options?.forceAll || lastSyncedSnapshot.get(key) !== serialized) {
      stagedItems.push({
        key,
        serialized,
        row: {
          collection_key: key,
          payload: val,
          updated_at: nowIso,
        },
        bytes: serialized.length + key.length + 64,
      })
    }
  }

  if (stagedItems.length === 0) {
    return currentStatus.status === 'connected'
  }

  const batches: Array<typeof stagedItems> = []
  let currentBatch: typeof stagedItems = []
  let currentBytes = 0

  for (const item of stagedItems) {
    if (currentBatch.length > 0 && currentBytes + item.bytes > MAX_BATCH_BYTES) {
      batches.push(currentBatch)
      currentBatch = [item]
      currentBytes = item.bytes
    } else {
      currentBatch.push(item)
      currentBytes += item.bytes
    }
  }
  if (currentBatch.length > 0) {
    batches.push(currentBatch)
  }

  try {
    const endpoint = `${cfg.url}/rest/v1/${TABLE_NAME}?on_conflict=collection_key&select=collection_key,updated_at`
    for (const batch of batches) {
      const res = await fetchWithTimeout(
        endpoint,
        {
          method: 'POST',
          headers: buildHeaders(cfg.key, {
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=representation',
          }),
          body: JSON.stringify(batch.map((b) => b.row)),
        },
        DATA_TIMEOUT_MS
      )

      if (!res.ok) {
        const bodyText = await res.text().catch(() => '')
        classifyHttpFailure(cfg, res.status, bodyText)
        return false
      }

      const returnedRows = (await res.json().catch(() => [])) as Array<{
        collection_key?: string
        updated_at?: string
      }>
      const returnedTimes = new Map<string, string>()
      if (Array.isArray(returnedRows)) {
        for (const r of returnedRows) {
          if (r && typeof r.collection_key === 'string' && typeof r.updated_at === 'string') {
            returnedTimes.set(r.collection_key, r.updated_at)
          }
        }
      }

      for (const item of batch) {
        lastSyncedSnapshot.set(item.key, item.serialized)
        remoteUpdatedAt.set(item.key, returnedTimes.get(item.key) || nowIso)
      }
    }

    markConnected(cfg, true)
    return true
  } catch (err) {
    markFailure(cfg, 'unreachable', formatNetworkFailureReason(err, cfg.host))
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
      const res = await fetchWithTimeout(
        endpoint,
        {
          method: 'GET',
          headers: buildHeaders(cfg.key),
        },
        PROBE_TIMEOUT_MS
      )

      if (!res.ok) {
        const bodyText = await res.text().catch(() => '')
        classifyHttpFailure(cfg, res.status, bodyText)
      } else {
        markConnected(cfg, false)
      }
    } catch (err) {
      markFailure(cfg, 'unreachable', formatNetworkFailureReason(err, cfg.host))
    }
  }

  return { ...currentStatus }
}

export function resetSupabaseStoreStateForTests(): void {
  lastFailureAt = 0
  lastSyncedSnapshot = new Map<string, string>()
  remoteUpdatedAt = new Map<string, string>()
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

