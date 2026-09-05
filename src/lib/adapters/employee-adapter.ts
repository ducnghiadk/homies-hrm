// ============================================
// HRM Trà Sữa 🧋 — Employee Data Adapter
// Unified Data Repository for Employees (Schema v3 Master)
// ============================================

import { isRealDbMode } from './repository-config'
import { EmployeeService, getDepartmentName } from '../services/employee-service'
import type { AuthUser } from '@/store/auth-store'
import { supabase, isSupabaseConfigured } from '../supabase'

const ORG_DEFAULT_ID = 'a0000000-0000-0000-0000-000000000001'

const STORE_ID_MAP: Record<string, string> = {
  'store-001': 'c0000000-0000-0000-0000-000000000001',
  'store-002': 'c0000000-0000-0000-0000-000000000002',
  'store-003': 'c0000000-0000-0000-0000-000000000003',
}

const REVERSE_STORE_MAP: Record<string, string> = {
  'c0000000-0000-0000-0000-000000000001': 'store-001',
  'c0000000-0000-0000-0000-000000000002': 'store-002',
  'c0000000-0000-0000-0000-000000000003': 'store-003',
}

const POSITION_ID_MAP: Record<string, string> = {
  'pos-001': 'b0000000-0000-0000-0000-000000000001',
  'pos-002': 'b0000000-0000-0000-0000-000000000002',
  'pos-003': 'b0000000-0000-0000-0000-000000000003',
  'pos-004': 'b0000000-0000-0000-0000-000000000004',
  'pos-005': 'b0000000-0000-0000-0000-000000000005',
  'pos-006': 'b0000000-0000-0000-0000-000000000006',
  'pos-007': 'b0000000-0000-0000-0000-000000000007',
  'pos-008': 'b0000000-0000-0000-0000-000000000008',
  'pos-009': 'b0000000-0000-0000-0000-000000000009',
  'pos-010': 'b0000000-0000-0000-0000-000000000010',
  'pos-011': 'b0000000-0000-0000-0000-000000000011',
}

const STORE_LABEL_MAP: Record<string, string> = {
  'store-001': 'Hồ Bá Phấn',
  'store-002': 'Chi Nhánh 429',
  'store-003': 'Lê Văn Sỹ',
}

const POSITION_LABEL_MAP: Record<string, string> = {
  'pos-001': 'Pha chế',
  'pos-002': 'Thu ngân',
  'pos-003': 'Phục vụ',
  'pos-004': 'Trưởng ca',
  'pos-005': 'Ban giám đốc',
  'pos-006': 'Quản lý điểm bán hàng',
  'pos-007': 'Nhân viên',
  'pos-008': 'Chủ thương hiệu',
  'pos-009': 'Quản trị HR',
  'pos-010': 'Quản lý vùng',
  'pos-011': 'Quản lý bộ phận',
}

// These legacy local ids are kept for old mock data, but they do not exist in the real DB.
const KNOWN_MISSING_DB_STORE_IDS = new Set([
  STORE_ID_MAP['store-003'],
])

// These legacy local ids are kept for old mock data, but they do not exist in the real DB.
const KNOWN_MISSING_DB_POSITION_IDS = new Set([
  POSITION_ID_MAP['pos-003'],
  POSITION_ID_MAP['pos-011'],
])

const REVERSE_POSITION_MAP: Record<string, string> = {
  'b0000000-0000-0000-0000-000000000001': 'pos-001',
  'b0000000-0000-0000-0000-000000000002': 'pos-002',
  'b0000000-0000-0000-0000-000000000003': 'pos-003',
  'b0000000-0000-0000-0000-000000000004': 'pos-004',
  'b0000000-0000-0000-0000-000000000005': 'pos-005',
  'b0000000-0000-0000-0000-000000000006': 'pos-006',
  'b0000000-0000-0000-0000-000000000007': 'pos-007',
  'b0000000-0000-0000-0000-000000000008': 'pos-008',
  'b0000000-0000-0000-0000-000000000009': 'pos-009',
  'b0000000-0000-0000-0000-000000000010': 'pos-010',
  'b0000000-0000-0000-0000-000000000011': 'pos-011',
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// ----------------------------------------------------
// Persistent Metadata Store for Extended Properties
// ----------------------------------------------------
const EXTRA_META_STORAGE_KEY = 'HOMIES_EMPLOYEE_EXTRA_METADATA_V1'

export interface EmployeeExtraMeta {
  secondary_position_ids?: string[]
  secondary_store_ids?: string[]
  department_name?: string
}

export type PayrollEmployeeDbRow = {
  id: string
  ma_nhan_vien: string
  ho_ten: string
  chuc_vu_id: string
  cua_hang_id: string
  muc_luong_co_ban: number
  trang_thai: string
  vai_tro: string
  loai_hop_dong: string
  tham_gia_bao_hiem: boolean | null
  so_nguoi_phu_thuoc: number | null
  chuc_vu_luong_co_ban: number
  chuc_vu_ten: string
  cua_hang_ten: string
}

export type PayrollEmployeeReadResult = {
  employees: PayrollEmployeeDbRow[]
  coLoi: boolean
  loi?: string
}

function getStoredExtraMetadata(): Record<string, EmployeeExtraMeta> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(EXTRA_META_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStoredExtraMetadata(map: Record<string, EmployeeExtraMeta>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(EXTRA_META_STORAGE_KEY, JSON.stringify(map))
  } catch {}
}

export function getEmployeeExtraMeta(empKey?: string): EmployeeExtraMeta {
  if (!empKey) return {}
  const map = getStoredExtraMetadata()
  return map[empKey] || map[empKey.toLowerCase()] || {}
}

export function setEmployeeExtraMeta(empKeys: (string | undefined)[], meta: Partial<EmployeeExtraMeta>) {
  const map = getStoredExtraMetadata()
  const validKeys = empKeys.filter((k): k is string => Boolean(k && k.trim()))
  if (validKeys.length === 0) return

  const existing = validKeys.reduce<EmployeeExtraMeta>((acc, k) => ({ ...acc, ...(map[k] || {}) }), {})
  const merged: EmployeeExtraMeta = {
    ...existing,
    ...meta,
  }

  validKeys.forEach(k => {
    map[k] = merged
    map[k.toLowerCase()] = merged
  })

  saveStoredExtraMetadata(map)
}

const mapRoleToDb = (role?: string): string => {
  switch (role) {
    case 'ceo': return 'ban_giam_doc'
    case 'hr_admin': return 'quan_tri_hr'
    case 'area_manager': return 'quan_ly_khu_vuc'
    case 'store_manager': return 'quan_ly_cua_hang'
    case 'shift_leader': return 'truong_ca'
    default: return 'nhan_vien'
  }
}

const mapRoleFromDb = (dbRole?: string): AuthUser['role'] => {
  switch (dbRole) {
    case 'ban_giam_doc': return 'ceo'
    case 'quan_tri_hr': return 'hr_admin'
    case 'quan_ly_khu_vuc': return 'area_manager'
    case 'quan_ly_cua_hang': return 'store_manager'
    case 'truong_ca': return 'shift_leader'
    default: return 'employee'
  }
}

const mapStatusToDb = (status?: string): string => {
  switch (status) {
    case 'active': return 'hoat_dong'
    case 'probation': return 'thu_viec'
    case 'inactive': return 'ngung_hoat_dong'
    case 'resigned': return 'da_nghi_viec'
    default: return 'hoat_dong'
  }
}

const mapStatusFromDb = (dbStatus?: string): AuthUser['status'] => {
  switch (dbStatus) {
    case 'hoat_dong': return 'active'
    case 'thu_viec': return 'probation'
    case 'ngung_hoat_dong': return 'inactive'
    case 'da_nghi_viec': return 'resigned'
    default: return 'active'
  }
}

const mapGenderToDb = (gender?: string): string | null => {
  if (!gender) return null
  if (['nam', 'male'].includes(gender.toLowerCase())) return 'nam'
  if (['nu', 'female', 'nữ'].includes(gender.toLowerCase())) return 'nu'
  return 'khac'
}

const mapGenderFromDb = (dbGender?: string): AuthUser['gender'] => {
  if (!dbGender) return undefined
  if (dbGender === 'nam' || dbGender === 'male') return 'male'
  if (dbGender === 'nu' || dbGender === 'female') return 'female'
  return 'other'
}

const mapContractTypeToDb = (type?: string): string => {
  switch (type) {
    case 'full_time':
    case 'fulltime':
    case 'toan_thoi_gian': return 'toan_thoi_gian'
    case 'part_time':
    case 'parttime':
    case 'ban_thoi_gian':
    case 'seasonal': return 'ban_thoi_gian'
    case 'intern':
    case 'thuc_tap': return 'thuc_tap'
    case 'probation':
    case 'thu_viec': return 'thu_viec'
    default:
      console.warn(`[EmployeeAdapter] Không nhận ra loại nhân viên "${type || 'chưa khai'}", ghi tạm thành toàn thời gian.`)
      return 'toan_thoi_gian'
  }
}

const mapRowToAuthUser = (row: Record<string, unknown>): AuthUser => {
  const rawStoreId = String(row.cua_hang_id || '')
  const storeId = REVERSE_STORE_MAP[rawStoreId] || rawStoreId || 'store-001'

  const rawPosId = String(row.chuc_vu_id || '')
  const positionId = REVERSE_POSITION_MAP[rawPosId] || rawPosId || 'pos-007'

  const empCode = String(row.ma_nhan_vien || '')
  const email = String(row.email || '')
  const rowId = String(row.id || '')

  // 1. Check persistent extra metadata store
  const meta = getEmployeeExtraMeta(rowId).secondary_position_ids
    ? getEmployeeExtraMeta(rowId)
    : getEmployeeExtraMeta(empCode).secondary_position_ids
      ? getEmployeeExtraMeta(empCode)
      : getEmployeeExtraMeta(email)

  // 2. Check local EmployeeService
  const existingLocal = typeof window !== 'undefined'
    ? (EmployeeService.getEmployeeById(rowId) ||
       EmployeeService.getEmployeeById(empCode) ||
       EmployeeService.getEmployees().find(e => e.employee_code === empCode || (email && e.email === email) || e.id === rowId))
    : null

  let secondary_position_ids: string[] = []
  let secondary_store_ids: string[] = []

  if (Array.isArray(meta.secondary_position_ids) && meta.secondary_position_ids.length > 0) {
    secondary_position_ids = meta.secondary_position_ids
  } else if (Array.isArray(existingLocal?.secondary_position_ids) && existingLocal.secondary_position_ids.length > 0) {
    secondary_position_ids = existingLocal.secondary_position_ids
  }

  if (Array.isArray(meta.secondary_store_ids) && meta.secondary_store_ids.length > 0) {
    secondary_store_ids = meta.secondary_store_ids
  } else if (Array.isArray(existingLocal?.secondary_store_ids) && existingLocal.secondary_store_ids.length > 0) {
    secondary_store_ids = existingLocal.secondary_store_ids
  }

  const role = mapRoleFromDb(String(row.vai_tro || ''))
  const department_name = meta.department_name || existingLocal?.department_name || getDepartmentName(positionId, role)

  return {
    id: rowId,
    employee_code: empCode,
    full_name: String(row.ho_ten || ''),
    phone: String(row.so_dien_thoai || ''),
    email: email,
    role: role,
    store_id: storeId,
    secondary_store_ids,
    position_id: positionId,
    secondary_position_ids,
    department_name,
    status: mapStatusFromDb(String(row.trang_thai || '')),
    account_status: row.trang_thai === 'da_nghi_viec' ? 'bi_khoa' : 'dang_hoat_dong',
    hire_date: String(row.ngay_bat_dau_lam || row.ngay_vaocong || ''),
    date_of_birth: row.ngay_sinh ? String(row.ngay_sinh) : undefined,
    gender: mapGenderFromDb(String(row.gioi_tinh || '')),
    address: row.dia_chi ? String(row.dia_chi) : undefined,
    bank_name: row.ten_ngan_hang ? String(row.ten_ngan_hang) : undefined,
    bank_account_no: row.so_tai_khoan ? String(row.so_tai_khoan) : undefined,
    bank_account_holder: row.chu_tai_khoan_ngan_hang ? String(row.chu_tai_khoan_ngan_hang) : undefined,
    official_salary: row.muc_luong_co_ban ? Number(row.muc_luong_co_ban) : undefined,
    cccd: row.so_cccd ? String(row.so_cccd) : undefined,
    total_points: Number(row.tong_diem || 0),
    gamification_level: String(row.hang_thanh_vien || 'bronze') as AuthUser['gamification_level'],
    employee_type: String(row.loai_hop_dong || 'fulltime') as AuthUser['employee_type'],
  } as AuthUser
}

function readRelationObject(value: unknown): Record<string, unknown> {
  if (Array.isArray(value)) return (value[0] as Record<string, unknown>) || {}
  return (value as Record<string, unknown>) || {}
}

function mapPayrollEmployeeRow(row: Record<string, unknown>): PayrollEmployeeDbRow {
  const position = readRelationObject(row.chuc_vu)
  const store = readRelationObject(row.cua_hang)

  return {
    id: String(row.id || ''),
    ma_nhan_vien: String(row.ma_nhan_vien || ''),
    ho_ten: String(row.ho_ten || ''),
    chuc_vu_id: String(row.chuc_vu_id || ''),
    cua_hang_id: String(row.cua_hang_id || ''),
    muc_luong_co_ban: Number(row.muc_luong_co_ban || 0),
    trang_thai: String(row.trang_thai || ''),
    vai_tro: String(row.vai_tro || ''),
    loai_hop_dong: String(row.loai_hop_dong || 'toan_thoi_gian'),
    tham_gia_bao_hiem: row.tham_gia_bao_hiem !== false,
    so_nguoi_phu_thuoc: Number(row.so_nguoi_phu_thuoc) || 0,
    chuc_vu_luong_co_ban: Number(position.luong_co_ban || 0),
    chuc_vu_ten: String(position.ten || ''),
    cua_hang_ten: String(store.ten || ''),
  }
}

const mapAuthUserToDbPayload = (emp: Partial<AuthUser>) => {
  const storeId = STORE_ID_MAP[emp.store_id || ''] || emp.store_id || STORE_ID_MAP['store-001']
  const positionId = POSITION_ID_MAP[emp.position_id || ''] || emp.position_id || POSITION_ID_MAP['pos-007']
  const payload: Record<string, unknown> = {
    to_chuc_id: ORG_DEFAULT_ID,
    cua_hang_id: storeId,
    chuc_vu_id: positionId,
    ma_nhan_vien: emp.employee_code || `BH-${Date.now().toString().slice(-4)}`,
    ho_ten: emp.full_name || 'Nhân sự mới',
    vai_tro: mapRoleToDb(emp.role),
    trang_thai: mapStatusToDb(emp.status),
    ngay_bat_dau_lam: emp.hire_date || new Date().toISOString().slice(0, 10),
  }

  if (emp.phone) payload.so_dien_thoai = emp.phone
  if (emp.email) payload.email = emp.email
  if (emp.date_of_birth) payload.ngay_sinh = emp.date_of_birth
  if (emp.gender) payload.gioi_tinh = mapGenderToDb(emp.gender)
  if (emp.address) payload.dia_chi = emp.address
  if (emp.current_address) payload.noi_o_hien_tai = emp.current_address
  if (emp.bank_name) payload.ten_ngan_hang = emp.bank_name
  if (emp.bank_account_no) payload.so_tai_khoan = emp.bank_account_no
  if (emp.bank_account_holder) payload.chu_tai_khoan_ngan_hang = emp.bank_account_holder
  if (emp.cccd) payload.so_cccd = emp.cccd
  if (emp.cccd_issue_date) payload.ngay_cap_cccd = emp.cccd_issue_date
  if (emp.tax_code) payload.ma_so_thue = emp.tax_code
  if (emp.avatar_url) payload.anh_dai_dien = emp.avatar_url
  if (emp.official_salary !== undefined) payload.muc_luong_co_ban = emp.official_salary
  if (emp.kpi_salary !== undefined) payload.muc_luong_kpi = emp.kpi_salary
  if (emp.employee_type) payload.loai_hop_dong = mapContractTypeToDb(emp.employee_type)
  if (emp.total_points !== undefined) payload.tong_diem = emp.total_points
  if (emp.gamification_level) payload.hang_thanh_vien = emp.gamification_level

  return payload
}

function getEmployeeImportLabel(emp: Partial<AuthUser>) {
  return emp.full_name || emp.employee_code || emp.email || 'Nhân sự chưa đặt tên'
}

function getStoreImportLabel(emp: Partial<AuthUser>) {
  return STORE_LABEL_MAP[emp.store_id || ''] || emp.store_id || 'chưa rõ chi nhánh'
}

function getPositionImportLabel(emp: Partial<AuthUser>) {
  return POSITION_LABEL_MAP[emp.position_id || ''] || emp.position_id || 'chưa rõ chức vụ'
}

function buildEmployeeImportDbError(emp: Partial<AuthUser>, message?: string) {
  const employeeName = getEmployeeImportLabel(emp)
  const technicalMessage = message || ''
  const storeLabel = getStoreImportLabel(emp)
  const positionLabel = getPositionImportLabel(emp)

  if (technicalMessage.includes('cua_hang_id')) {
    return `Không lưu được nhân viên "${employeeName}": chi nhánh "${storeLabel}" chưa có trong cơ sở dữ liệu. Cần tạo chi nhánh trước khi nhập.`
  }

  if (technicalMessage.includes('chuc_vu_id')) {
    return `Không lưu được nhân viên "${employeeName}": chức vụ "${positionLabel}" chưa có trong cơ sở dữ liệu. Cần tạo chức vụ trước khi nhập.`
  }

  return `Không lưu được nhân viên "${employeeName}" vào cơ sở dữ liệu: ${technicalMessage || 'lỗi không xác định khi nhập nhân sự.'}`
}

function assertKnownEmployeeRelations(emp: Partial<AuthUser>, payload: ReturnType<typeof mapAuthUserToDbPayload>) {
  if (KNOWN_MISSING_DB_STORE_IDS.has(String(payload.cua_hang_id))) {
    throw new Error(buildEmployeeImportDbError(emp, 'cua_hang_id không tồn tại'))
  }

  if (KNOWN_MISSING_DB_POSITION_IDS.has(String(payload.chuc_vu_id))) {
    throw new Error(buildEmployeeImportDbError(emp, 'chuc_vu_id không tồn tại'))
  }
}

export interface EmployeeAdapter {
  getAllEmployees: (currentUser?: AuthUser) => Promise<AuthUser[]>
  getEmployeeById: (id: string, currentUser?: AuthUser) => Promise<AuthUser | null>
  getPayrollEmployees: () => Promise<PayrollEmployeeReadResult>
  getPayrollEmployeesByIds: (ids: string[]) => Promise<PayrollEmployeeReadResult>
  createEmployee: (emp: Partial<AuthUser>, currentUser?: AuthUser, source?: 'manual' | 'import' | 'invitation') => Promise<AuthUser>
  batchCreateEmployees: (employees: Partial<AuthUser>[], currentUser?: AuthUser) => Promise<{ inserted: number; failed: number }>
  updateEmployee: (id: string, emp: Partial<AuthUser>, currentUser?: AuthUser, reason?: string) => Promise<AuthUser | null>
  deleteEmployee: (id: string, currentUser?: AuthUser) => Promise<boolean>
}

export const employeeAdapter: EmployeeAdapter = {
  async getAllEmployees(currentUser?: AuthUser): Promise<AuthUser[]> {
    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        const { data, error } = await supabase
          .from('nhan_vien')
          .select('*')
          .order('ngay_tao', { ascending: false })

        if (!error && data && data.length > 0) {
          const mapped = data.map((row) => mapRowToAuthUser(row))
          return mapped
        }
      } catch (err) {
        console.warn('[EmployeeAdapter] Supabase query fallback to LocalStorage:', err)
      }
    }

    if (currentUser) {
      return EmployeeService.getEmployees(currentUser)
    }
    return EmployeeService.getEmployees()
  },

  async getEmployeeById(id: string, currentUser?: AuthUser): Promise<AuthUser | null> {
    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        const query = supabase.from('nhan_vien').select('*')
        const { data, error } = UUID_PATTERN.test(id)
          ? await query.eq('id', id).maybeSingle()
          : await query.eq('ma_nhan_vien', id).maybeSingle()

        if (!error && data) {
          return mapRowToAuthUser(data)
        }
      } catch (err) {
        console.warn('[EmployeeAdapter] getEmployeeById fallback:', err)
      }
    }

    return EmployeeService.getEmployeeById(id, currentUser) || null
  },

  async getPayrollEmployees(): Promise<PayrollEmployeeReadResult> {
    if (!isSupabaseConfigured || !isRealDbMode()) return { employees: [], coLoi: false }

    try {
      const { data, error } = await supabase
        .from('nhan_vien')
        .select([
          'id',
          'ma_nhan_vien',
          'ho_ten',
          'chuc_vu_id',
          'cua_hang_id',
          'muc_luong_co_ban',
          'trang_thai',
          'vai_tro',
          'loai_hop_dong',
          'tham_gia_bao_hiem',
          'so_nguoi_phu_thuoc',
          'chuc_vu:chuc_vu_id ( ten, luong_co_ban )',
          'cua_hang:cua_hang_id ( ten )',
        ].join(', '))
        .in('trang_thai', ['hoat_dong', 'thu_viec'])
        .order('ma_nhan_vien', { ascending: true })

      if (error) {
        console.error('[EmployeeAdapter] Error fetching payroll employees:', error)
        return { employees: [], coLoi: true, loi: error.message || 'LOI_DOC_NHAN_VIEN_PAYROLL' }
      }

      return { employees: ((data || []) as unknown as Record<string, unknown>[]).map(row => mapPayrollEmployeeRow(row)), coLoi: false }
    } catch (error) {
      console.error('[EmployeeAdapter] Error fetching payroll employees:', error)
      return { employees: [], coLoi: true, loi: error instanceof Error ? error.message : 'LOI_DOC_NHAN_VIEN_PAYROLL' }
    }
  },

  async getPayrollEmployeesByIds(ids: string[]): Promise<PayrollEmployeeReadResult> {
    if (!isSupabaseConfigured || !isRealDbMode() || ids.length === 0) return { employees: [], coLoi: false }

    try {
      const { data, error } = await supabase
        .from('nhan_vien')
        .select([
          'id',
          'ma_nhan_vien',
          'ho_ten',
          'chuc_vu_id',
          'cua_hang_id',
          'muc_luong_co_ban',
          'trang_thai',
          'vai_tro',
          'loai_hop_dong',
          'tham_gia_bao_hiem',
          'so_nguoi_phu_thuoc',
          'chuc_vu:chuc_vu_id ( ten, luong_co_ban )',
          'cua_hang:cua_hang_id ( ten )',
        ].join(', '))
        .in('id', ids)
        .order('ma_nhan_vien', { ascending: true })

      if (error) {
        console.error('[EmployeeAdapter] Error fetching payroll employees by ids:', error)
        return { employees: [], coLoi: true, loi: error.message || 'LOI_DOC_NHAN_VIEN_PAYROLL_THEO_ID' }
      }

      return { employees: ((data || []) as unknown as Record<string, unknown>[]).map(row => mapPayrollEmployeeRow(row)), coLoi: false }
    } catch (error) {
      console.error('[EmployeeAdapter] Error fetching payroll employees by ids:', error)
      return { employees: [], coLoi: true, loi: error instanceof Error ? error.message : 'LOI_DOC_NHAN_VIEN_PAYROLL_THEO_ID' }
    }
  },

  async createEmployee(empData: Partial<AuthUser>, currentUser?: AuthUser, source: 'manual' | 'import' | 'invitation' = 'manual'): Promise<AuthUser> {
    // 1. Create in local state first for fast response and fallback
    const localEmployee = EmployeeService.createEmployee(empData, currentUser, source)

    // Save extra metadata
    setEmployeeExtraMeta([localEmployee.id, localEmployee.employee_code, localEmployee.email], {
      secondary_position_ids: empData.secondary_position_ids,
      secondary_store_ids: empData.secondary_store_ids,
      department_name: empData.department_name,
    })

    // 2. Sync to Supabase
    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        const payload = mapAuthUserToDbPayload({
          ...empData,
          employee_code: localEmployee.employee_code,
        })

        const { data, error } = await supabase
          .from('nhan_vien')
          .insert([payload])
          .select()
          .single()

        if (!error && data) {
          const synced = mapRowToAuthUser(data)
          // Update ID in local DB and meta to match Supabase UUID
          EmployeeService.updateEmployee(localEmployee.id, { id: synced.id }, currentUser)
          setEmployeeExtraMeta([synced.id], {
            secondary_position_ids: empData.secondary_position_ids,
            secondary_store_ids: empData.secondary_store_ids,
            department_name: empData.department_name,
          })
          return synced
        } else if (error) {
          console.warn('[EmployeeAdapter] Supabase create error (using local):', error)
        }
      } catch (err) {
        console.warn('[EmployeeAdapter] Exception creating employee in Supabase:', err)
      }
    }

    return localEmployee
  },

  async batchCreateEmployees(employees: Partial<AuthUser>[], currentUser?: AuthUser): Promise<{ inserted: number; failed: number }> {
    let inserted = 0
    const failed = 0

    // Save/update each to local store and extra metadata
    const localEmployees = employees.map(emp => {
      const existing = EmployeeService.getEmployees().find(e => 
        (emp.email && e.email && e.email.toLowerCase() === emp.email.toLowerCase()) ||
        (emp.phone && e.phone && e.phone === emp.phone) ||
        (emp.employee_code && e.employee_code && e.employee_code === emp.employee_code)
      )
      if (existing) {
        setEmployeeExtraMeta([existing.id, existing.employee_code, existing.email], {
          secondary_position_ids: emp.secondary_position_ids,
          secondary_store_ids: emp.secondary_store_ids,
          department_name: emp.department_name,
        })
        return EmployeeService.updateEmployee(existing.id, emp, currentUser, 'Cập nhật từ Import Excel') || existing
      }
      const created = EmployeeService.createEmployee(emp, currentUser, 'import')
      setEmployeeExtraMeta([created.id, created.employee_code, created.email], {
        secondary_position_ids: emp.secondary_position_ids,
        secondary_store_ids: emp.secondary_store_ids,
        department_name: emp.department_name,
      })
      return created
    })
    inserted = localEmployees.length

    // Batch upsert into Supabase
    if (isSupabaseConfigured && isRealDbMode() && localEmployees.length > 0) {
      try {
        for (const [index, localEmp] of localEmployees.entries()) {
          const importInput = employees[index]
          const dbInput = {
            ...importInput,
            employee_code: importInput?.employee_code || localEmp.employee_code,
            full_name: importInput?.full_name || localEmp.full_name,
            store_id: importInput?.store_id || localEmp.store_id,
            position_id: importInput?.position_id || localEmp.position_id,
            role: importInput?.role || localEmp.role,
            status: importInput?.status || localEmp.status,
            hire_date: importInput?.hire_date || localEmp.hire_date,
          }
          const payload = mapAuthUserToDbPayload(dbInput)
          assertKnownEmployeeRelations(dbInput, payload)
          if (payload.email) {
            const { error } = await supabase.from('nhan_vien').upsert(payload, { onConflict: 'email' })
            if (error) {
              throw new Error(buildEmployeeImportDbError(dbInput, `${error.message} ${error.details || ''}`.trim()))
            }
          } else if (importInput?.employee_code) {
            const { error } = await supabase.from('nhan_vien').upsert(payload, { onConflict: 'ma_nhan_vien' })
            if (error) {
              throw new Error(buildEmployeeImportDbError(dbInput, `${error.message} ${error.details || ''}`.trim()))
            }
          } else {
            const { error } = await supabase.from('nhan_vien').insert(payload)
            if (error) {
              throw new Error(buildEmployeeImportDbError(dbInput, `${error.message} ${error.details || ''}`.trim()))
            }
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Không lưu được danh sách nhân sự vào cơ sở dữ liệu.'
        console.warn('[EmployeeAdapter] Batch upsert exception in Supabase:', message)
        throw new Error(message)
      }
    }

    return { inserted, failed }
  },

  async updateEmployee(id: string, empData: Partial<AuthUser>, currentUser?: AuthUser, reason?: string): Promise<AuthUser | null> {
    // 1. Save extended metadata persistently
    const empCode = empData.employee_code || ''
    const email = empData.email || ''
    setEmployeeExtraMeta([id, empCode, email], {
      secondary_position_ids: empData.secondary_position_ids,
      secondary_store_ids: empData.secondary_store_ids,
      department_name: empData.department_name,
    })

    // 2. Update in local store
    const localUpdated = EmployeeService.updateEmployee(id, empData, currentUser, reason)
    if (localUpdated) {
      setEmployeeExtraMeta([localUpdated.id, localUpdated.employee_code, localUpdated.email], {
        secondary_position_ids: empData.secondary_position_ids ?? localUpdated.secondary_position_ids,
        secondary_store_ids: empData.secondary_store_ids ?? localUpdated.secondary_store_ids,
        department_name: empData.department_name ?? localUpdated.department_name,
      })
    }

    // 3. Update in Supabase (Clean payload with only valid schema columns)
    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        const payload: Record<string, unknown> = {}
        if (empData.full_name) payload.ho_ten = empData.full_name
        if (empData.phone) payload.so_dien_thoai = empData.phone
        if (empData.email) payload.email = empData.email
        if (empData.role) payload.vai_tro = mapRoleToDb(empData.role)
        if (empData.status) payload.trang_thai = mapStatusToDb(empData.status)
        if (empData.store_id) payload.cua_hang_id = STORE_ID_MAP[empData.store_id] || empData.store_id
        if (empData.position_id) payload.chuc_vu_id = POSITION_ID_MAP[empData.position_id] || empData.position_id
        if (empData.official_salary !== undefined) payload.muc_luong_co_ban = empData.official_salary
        if (empData.date_of_birth) payload.ngay_sinh = empData.date_of_birth
         if (empData.hire_date) payload.ngay_bat_dau_lam = empData.hire_date
         if (empData.address) payload.dia_chi = empData.address
         if (empData.bank_name !== undefined) payload.ten_ngan_hang = empData.bank_name || null
         if (empData.bank_account_no !== undefined) payload.so_tai_khoan = empData.bank_account_no || null
         if (empData.bank_account_holder !== undefined) payload.chu_tai_khoan_ngan_hang = empData.bank_account_holder || null
         if (empData.cccd) payload.so_cccd = empData.cccd
        if (empData.dependents_count !== undefined) payload.so_nguoi_phu_thuoc = Number(empData.dependents_count) || 0
        if (empData.has_insurance !== undefined) payload.tham_gia_bao_hiem = Boolean(empData.has_insurance)
        if (empData.employee_type !== undefined) payload.loai_hop_dong = mapContractTypeToDb(empData.employee_type)
        if (empData.tax_code !== undefined) payload.ma_so_thue = empData.tax_code || null
        if (empData.kpi_salary !== undefined) payload.muc_luong_kpi = Number(empData.kpi_salary) || 0
        if (empData.gender !== undefined) payload.gioi_tinh = mapGenderToDb(empData.gender)
        payload.ngay_cap_nhat = new Date().toISOString()

        const updateQuery = supabase.from('nhan_vien').update(payload)
        const { error } = UUID_PATTERN.test(id)
          ? await updateQuery.eq('id', id)
          : await updateQuery.eq('ma_nhan_vien', id)

        if (error) {
          const errorMessage = error.message || error.details || 'Lỗi đồng bộ cơ sở dữ liệu'
          console.error(`[EmployeeAdapter] Supabase update failed for employee "${id}":`, errorMessage)
          if (localUpdated) {
            localUpdated._dbSyncError = errorMessage
          }
        }
      } catch (err) {
        const exceptionMessage = err instanceof Error ? err.message : 'Ngoại lệ khi đồng bộ cơ sở dữ liệu'
        console.error(`[EmployeeAdapter] Supabase update exception for employee "${id}":`, err)
        if (localUpdated) {
          localUpdated._dbSyncError = exceptionMessage
        }
      }
    }

    return localUpdated
  },

  async deleteEmployee(id: string, currentUser?: AuthUser): Promise<boolean> {
    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        const deleteQuery = supabase.from('nhan_vien').delete()
        const { error } = UUID_PATTERN.test(id)
          ? await deleteQuery.eq('id', id)
          : await deleteQuery.eq('ma_nhan_vien', id)

        if (error) {
          console.error(`[EmployeeAdapter] Supabase delete failed for employee "${id}":`, error.message || error.details || error)
        }
      } catch (err) {
        console.error(`[EmployeeAdapter] Supabase delete exception for employee "${id}":`, err)
      }
    }
    return true
  }
}
