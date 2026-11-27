import type { KpiDatabase } from './repository.ts'
import { createEmptyKpiDatabase } from './repository.ts'

/**
 * Quy tắc ai được xem / ghi phần nào của dữ liệu KPI khi dữ liệu nằm trên máy chủ.
 * Hàm thuần (không đọc máy chủ) để dễ kiểm thử.
 *
 * - CEO / HR: xem và sửa toàn bộ.
 * - Quản lý vùng: xem toàn chuỗi; sửa phần vận hành (phiếu KPI, sự cố, khiếu nại...).
 * - Quản lý cửa hàng / trưởng ca: chỉ xem và sửa phần vận hành của chi nhánh mình.
 * - Nhân viên: chỉ xem dữ liệu của chính mình; chỉ được gửi khiếu nại mới của chính mình.
 * - Cài đặt KPI (bộ tiêu chí, kỳ KPI, lộ trình...) chỉ CEO / HR được sửa.
 * - Nhật ký chỉ được ghi thêm, không ai sửa/xóa được qua đường này.
 */

export type KpiViewerScope = 'admin' | 'chain_operator' | 'store_operator' | 'self'

export interface KpiViewer {
  userId: string
  role: string
  /** Các chi nhánh người dùng thuộc về (dạng store-001). */
  storeIds: string[]
  /** Tra chi nhánh của một nhân viên theo hồ sơ máy chủ. */
  employeeStoreOf?: (employeeId: string) => string | undefined
}

type Collection = Exclude<keyof KpiDatabase, 'schema_version' | 'revision'>

/** Cấu hình dùng chung: ai đăng nhập cũng xem được, chỉ CEO/HR sửa. */
const CONFIG_COLLECTIONS: Collection[] = [
  'store_groups',
  'sets',
  'periods',
  'career_maps',
  'position_criteria_profiles',
  'career_map_approval_logs',
  'career_grades',
  'operational_skills',
]

/** Dữ liệu theo từng nhân viên. */
const PERSONAL_COLLECTIONS: Collection[] = [
  'evaluations',
  'incidents',
  'appeals',
  'development_cases',
  'employee_skill_certifications',
  'career_employee_placements',
  'employee_career_placements',
]

/** Phần vận hành quản lý được sửa (trong phạm vi chi nhánh của mình). */
const OPERATOR_WRITABLE: Collection[] = [
  'evaluations',
  'incidents',
  'appeals',
  'development_cases',
  'employee_skill_certifications',
]

const MAX_AUDIT_APPEND = 500

export function normalizeKpiStoreId(storeId?: string | null): string | undefined {
  if (!storeId) return undefined
  return String(storeId).replace(/^store[_-]/i, 'store-')
}

export function resolveKpiViewerScope(role: string): KpiViewerScope {
  const r = (role || '').toLowerCase()
  if (r === 'ceo' || r === 'hr_admin') return 'admin'
  if (r === 'area_manager') return 'chain_operator'
  if (r === 'store_manager' || r === 'shift_leader') return 'store_operator'
  return 'self'
}

type Row = Record<string, unknown>

function rowEmployeeId(row: Row): string | undefined {
  if (typeof row.employee_id === 'string') return row.employee_id
  const employee = row.employee as Row | undefined
  if (employee && typeof employee.id === 'string') return employee.id
  return undefined
}

function buildStoreLookup(db: KpiDatabase, viewer: KpiViewer) {
  const fromEvaluations = new Map<string, string>()
  for (const evaluation of db.evaluations) {
    if (evaluation?.employee?.id && evaluation.employee.store_id) {
      fromEvaluations.set(evaluation.employee.id, evaluation.employee.store_id)
    }
  }
  return (row: Row): string | undefined => {
    if (typeof row.store_id === 'string') return normalizeKpiStoreId(row.store_id)
    const employee = row.employee as Row | undefined
    if (employee && typeof employee.store_id === 'string') return normalizeKpiStoreId(employee.store_id)
    const employeeId = rowEmployeeId(row)
    if (!employeeId) return undefined
    return normalizeKpiStoreId(viewer.employeeStoreOf?.(employeeId) ?? fromEvaluations.get(employeeId))
  }
}

function makeInScope(db: KpiDatabase, viewer: KpiViewer) {
  const scope = resolveKpiViewerScope(viewer.role)
  const storeOf = buildStoreLookup(db, viewer)
  const myStores = new Set(viewer.storeIds.map((id) => normalizeKpiStoreId(id)).filter(Boolean) as string[])

  return (row: Row): boolean => {
    if (scope === 'admin' || scope === 'chain_operator') return true
    if (rowEmployeeId(row) === viewer.userId) return true
    if (scope === 'self') return false
    const storeId = storeOf(row)
    return Boolean(storeId && myStores.has(storeId))
  }
}

/** Bản dữ liệu KPI mà người dùng này được phép nhìn thấy. */
export function filterKpiDatabaseForViewer(db: KpiDatabase, viewer: KpiViewer): KpiDatabase {
  const scope = resolveKpiViewerScope(viewer.role)
  if (scope === 'admin') return db
  const inScope = makeInScope(db, viewer)
  const next: KpiDatabase = { ...db }
  for (const key of PERSONAL_COLLECTIONS) {
    ;(next[key] as unknown as Row[]) = (db[key] as unknown as Row[]).filter(inScope)
  }
  next.audit_logs = []
  return next
}

export class KpiWriteForbiddenError extends Error {}

/**
 * Ghép bản người dùng gửi lên vào bản trên máy chủ theo quyền.
 * Phần người dùng không được nhìn/sửa luôn giữ nguyên như trên máy chủ.
 */
export function mergeKpiDatabaseWrite(server: KpiDatabase, incoming: Partial<KpiDatabase>, viewer: KpiViewer): KpiDatabase {
  const scope = resolveKpiViewerScope(viewer.role)
  const base = normalizeKpiDatabase(server)
  const client = normalizeKpiDatabase(incoming)
  const next: KpiDatabase = { ...base, revision: base.revision + 1 }

  // Nhật ký: chỉ ghi thêm bản ghi mới.
  const knownAuditIds = new Set(base.audit_logs.map((log) => log.id))
  const appended = client.audit_logs
    .filter((log) => log && typeof log.id === 'string' && !knownAuditIds.has(log.id))
    .slice(0, MAX_AUDIT_APPEND)
    .map((log) => (scope === 'admin' ? log : { ...log, actor_id: viewer.userId }))
  next.audit_logs = [...base.audit_logs, ...appended]

  if (scope === 'admin') {
    for (const key of [...CONFIG_COLLECTIONS, ...PERSONAL_COLLECTIONS]) {
      ;(next[key] as unknown) = client[key]
    }
    return next
  }

  // Cài đặt KPI: chỉ CEO/HR được sửa.
  for (const key of CONFIG_COLLECTIONS) {
    if (JSON.stringify(client[key]) !== JSON.stringify(base[key])) {
      throw new KpiWriteForbiddenError('Chỉ CEO hoặc HR được sửa cài đặt KPI (bộ tiêu chí, kỳ KPI, lộ trình).')
    }
  }

  const inScope = makeInScope(base, viewer)

  if (scope === 'self') {
    // Nhân viên chỉ được gửi khiếu nại mới của chính mình.
    const knownAppealIds = new Set(base.appeals.map((item) => item.id))
    const newAppeals = client.appeals
      .filter((item) => item && !knownAppealIds.has(item.id) && item.employee_id === viewer.userId)
      .map((item) => ({ ...item, status: 'submitted' as const }))
    next.appeals = [...newAppeals, ...base.appeals]
    return next
  }

  for (const key of PERSONAL_COLLECTIONS) {
    if (!OPERATOR_WRITABLE.includes(key)) continue
    const keepOutside = (base[key] as unknown as Row[]).filter((row) => !inScope(row))
    const takeInside = (client[key] as unknown as Row[]).filter((row) => row && inScope(row))
    ;(next[key] as unknown as Row[]) = [...takeInside, ...keepOutside]
  }
  return next
}

export function normalizeKpiDatabase(input: Partial<KpiDatabase> | null | undefined): KpiDatabase {
  const seed = createEmptyKpiDatabase()
  const source = (input && typeof input === 'object' ? input : {}) as Partial<KpiDatabase>
  const next: KpiDatabase = { ...seed, revision: typeof source.revision === 'number' ? source.revision : 0 }
  for (const key of Object.keys(seed) as Array<keyof KpiDatabase>) {
    if (key === 'schema_version' || key === 'revision') continue
    const value = source[key]
    ;(next[key] as unknown) = Array.isArray(value) ? value : seed[key]
  }
  return next
}

export function isKpiDatabaseEmpty(db: KpiDatabase): boolean {
  return (Object.keys(db) as Array<keyof KpiDatabase>).every((key) => {
    if (key === 'schema_version' || key === 'revision') return true
    return Array.isArray(db[key]) && (db[key] as unknown[]).length === 0
  })
}
