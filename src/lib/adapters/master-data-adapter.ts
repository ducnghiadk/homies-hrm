// ============================================
// HRM Trà Sữa 🧋 — Master Data Adapter
// Level 2: Supabase DB + LocalStorage Sync Adapter
// ============================================

import { supabase, isSupabaseConfigured } from '../supabase.ts'
import { isRealDbMode } from './repository-config.ts'
import { masterLeaveTypes } from '../mock-data-settings.ts'
import type { AuthUser } from '../../store/auth-store.ts'

export type DepartmentItem = {
  id: string
  code: string
  name: string
  store_id: string
  manager_id?: string
  head_count: number
  description?: string
}

export type PositionItem = {
  id: string
  db_id?: string
  code?: string
  name: string
  department_id: string
  level: number
  base_salary: number
  pay_type: 'monthly' | 'hourly'
}

export type PositionPresentationGroup = 'store_operations' | 'management'

export interface PositionPresentation {
  group: PositionPresentationGroup
  badge: 'Lộ trình năng lực' | 'Khối quản lý'
  career_path: string[]
  legacy: boolean
  canonical_position_id?: string
}

export interface LegacyPositionMapping {
  source_position_id: string
  source_name: string
  target_position_id: string
  target_name: string
  employee_count: number
  status: 'auto_convertible' | 'needs_confirmation' | 'unused'
}

const normalizePositionId = (value: string): string => /^pos-\d+$/i.test(value) ? value.toLowerCase() : value

export type EmployeePositionAssignment = Pick<AuthUser, 'position_id'> & {
  secondary_position_ids?: string[]
}

export function linkPositionsToDepartments(
  positions: PositionItem[],
  departments: DepartmentItem[]
): PositionItem[] {
  if (!departments || departments.length === 0) return positions

  const normalizedDepartments = departments.map(department => ({
    department,
    name: normalizePositionName(department.name),
    code: (department.code || '').toLowerCase(),
  }))

  const management = normalizedDepartments.find(item =>
    item.name.includes('quan ly') ||
    item.name.includes('management') ||
    item.name.includes('giam doc') ||
    item.code.includes('dept-004') ||
    item.code.includes('ql')
  )?.department || departments[0]

  const operations = normalizedDepartments.find(item =>
    item.name.includes('van hanh') ||
    item.name.includes('store') ||
    item.name.includes('cua hang') ||
    item.name.includes('pha che') ||
    item.code.includes('dept-002') ||
    item.code.includes('vh')
  )?.department || normalizedDepartments.find(item => item.department.id !== management?.id)?.department || departments[0]

  return positions.map(position => {
    const canonicalPosition = { ...position, id: normalizePositionId(position.id) }
    const directMatch = departments.find(d => d.id === position.department_id || d.code.toLowerCase() === (position.department_id || '').toLowerCase())
    if (directMatch) {
      return { ...canonicalPosition, department_id: directMatch.id }
    }

    const presentation = getPositionPresentation(canonicalPosition)
    const targetDept = presentation.group === 'management' ? management : operations
    return { ...canonicalPosition, department_id: targetDept ? targetDept.id : position.department_id }
  })
}

const normalizePositionName = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/đ/g, 'd')
  .toLowerCase()
  .trim()

export function getPositionPresentation(position: PositionItem): PositionPresentation {
  const normalized = normalizePositionName(position.name)
  if (normalized.includes('ban giam doc') || normalized.includes('ceo') || normalized.includes('giam doc') || normalized.includes('nhan su') || normalized.includes('hr admin') || normalized.includes('chu thuong hieu') || normalized.includes('quan ly vung') || normalized.includes('quan tri')) {
    return { group: 'management', badge: 'Khối quản lý', career_path: [], legacy: false }
  }
  if (normalized.includes('quan ly cua hang') || normalized.includes('store manager') || position.id === 'pos-005' || position.id === 'pos_store_manager') {
    return { group: 'store_operations', badge: 'Lộ trình năng lực', career_path: ['c5'], legacy: false, canonical_position_id: 'pos_store_manager' }
  }
  if (normalized.includes('quan ly diem ban') || position.id === 'pos-006') {
    return { group: 'management', badge: 'Khối quản lý', career_path: [], legacy: false, canonical_position_id: 'pos_store_manager' }
  }
  if (normalized.includes('truong ca') || normalized.includes('shift leader') || position.id === 'pos-004' || position.id === 'pos_shift_leader') {
    return { group: 'store_operations', badge: 'Lộ trình năng lực', career_path: ['c4'], legacy: false, canonical_position_id: 'pos_shift_leader' }
  }
  if (normalized.includes('nhan vien') || normalized.includes('pha che') || normalized.includes('thu ngan') || normalized.includes('phuc vu') || position.id === 'pos-001' || position.id === 'pos-002' || position.id === 'pos-003' || position.id === 'pos-007' || position.id === 'pos_store_employee') {
    const legacy = normalized.includes('pha che') || normalized.includes('thu ngan') || /^l\d+$/.test(normalized)
    return { group: 'store_operations', badge: 'Lộ trình năng lực', career_path: ['c1_pc', 'c1_tn', 'c2', 'c3'], legacy, canonical_position_id: 'pos_store_employee' }
  }
  return { group: 'management', badge: 'Khối quản lý', career_path: [], legacy: /^l\d+$/.test(normalized), canonical_position_id: undefined }
}

export function buildLegacyPositionMapping(
  positions: PositionItem[],
  employees: EmployeePositionAssignment[]
): LegacyPositionMapping[] {
  return positions
    .filter((position) => getPositionPresentation(position).legacy)
    .map((position) => {
      const normalized = normalizePositionName(position.name)
      const isSkillTitle = normalized.includes('pha che') || normalized.includes('thu ngan')
      const employeeCount = getEmployeesUsingPosition(employees, position.id).length
      return {
        source_position_id: position.id,
        source_name: position.name,
        target_position_id: 'pos_store_employee',
        target_name: 'Nhân viên cửa hàng',
        employee_count: employeeCount,
        status: employeeCount === 0 ? 'unused' : isSkillTitle ? 'needs_confirmation' : 'needs_confirmation',
      }
    })
}

export function getEmployeesUsingPosition<T extends EmployeePositionAssignment>(
  employees: T[],
  positionId: string
): T[] {
  const targetId = normalizePositionId(positionId)
  return employees.filter(employee => {
    const primaryPositionId = normalizePositionId(employee.position_id || '')
    const secondaryPositionIds = (employee.secondary_position_ids || []).map(normalizePositionId)
    return primaryPositionId === targetId || secondaryPositionIds.includes(targetId)
  })
}

export type DeletePositionResult = {
  deleted: boolean
  employee_count: number
}

export interface PositionDeletionGateway {
  countEmployeesByPosition(positionId: string): Promise<number>
  deletePosition(positionId: string): Promise<void>
}

export async function deletePositionWithGuard(
  positionId: string,
  gateway: PositionDeletionGateway
): Promise<DeletePositionResult> {
  const employeeCount = await gateway.countEmployeesByPosition(positionId)
  if (employeeCount > 0) {
    return { deleted: false, employee_count: employeeCount }
  }

  await gateway.deletePosition(positionId)
  return { deleted: true, employee_count: 0 }
}

export type LeaveTypeItem = {
  id: string
  name: string
  code: string
  default_days: number
  is_paid: boolean
  require_doc: boolean
}

export type WorkflowStep = {
  level: number
  approver_roles: string[]
}

export type WorkflowItem = {
  id: string
  request_type: string
  name?: string
  submitter_role: string
  levels_count: number
  steps: WorkflowStep[]
  notify_roles?: string[]
  exclude_employee_ids?: string[]
  require_advance_notice?: boolean
  require_photo_attachment?: boolean
  auto_approve_days?: number
}

const STORAGE_KEYS = {
  DEPARTMENTS: 'homies_master_departments_v2',
  POSITIONS: 'homies_master_positions_v2',
  LEAVE_TYPES: 'homies_master_leave_types_v2',
  WORKFLOWS: 'homies_master_workflows_v2',
}

const initialDepartments: DepartmentItem[] = [
  { id: 'dept-002', code: 'DEPT-002', name: 'Vận Hành Cửa Hàng', store_id: 'all', manager_id: 'emp-001', head_count: 0, description: 'Phòng ban vận hành cửa hàng, ca trực, pha chế, thu ngân và phục vụ khách hàng.' },
  { id: 'dept-004', code: 'DEPT-004', name: 'Khối Quản lý', store_id: 'all', manager_id: 'emp-001', head_count: 2, description: 'Điều hành hệ thống, xếp lịch làm việc, quản trị nhân sự và kiểm soát chi phí cửa hàng.' },
]

const initialPositions: PositionItem[] = [
  { id: 'pos-001', name: 'Nhân viên cửa hàng', department_id: 'dept-002', level: 1, base_salary: 5500000, pay_type: 'hourly' },
  { id: 'pos-004', name: 'Trưởng ca', department_id: 'dept-002', level: 2, base_salary: 8000000, pay_type: 'hourly' },
  { id: 'pos-005', name: 'Quản lý cửa hàng', department_id: 'dept-004', level: 3, base_salary: 12000000, pay_type: 'monthly' },
]

export class MasterDataAdapter {
  // ─── DEPARTMENTS ───
  static async getDepartments(): Promise<DepartmentItem[]> {
    if (typeof window === 'undefined') return initialDepartments

    // LocalStorage Check
    const localData = localStorage.getItem(STORAGE_KEYS.DEPARTMENTS)
    let departments = localData ? (JSON.parse(localData) as DepartmentItem[]) : initialDepartments

    // Supabase DB Sync if configured
    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        const { data, error } = await supabase.from('cau_hinh_to_chuc').select('*').eq('khoa', 'phong_ban')
        if (!error && data && data.length > 0) {
          const dbDepts = JSON.parse(data[0].gia_tri) as DepartmentItem[]
          departments = dbDepts
          localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(departments))
        }
      } catch (err) {
        console.warn('Supabase DB fetch fallback to LocalStorage:', err)
      }
    }

    return departments
  }

  static async saveDepartments(items: DepartmentItem[]): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.DEPARTMENTS, JSON.stringify(items))
    }

    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        await supabase.from('cau_hinh_to_chuc').upsert({
          to_chuc_id: 'a0000000-0000-0000-0000-000000000001',
          khoa: 'phong_ban',
          gia_tri: JSON.stringify(items),
          ngay_cap_nhat: new Date().toISOString(),
        })
      } catch (err) {
        console.error('Failed to sync departments to Supabase:', err)
      }
    }
  }

  // ─── POSITIONS ───
  static async getPositions(): Promise<PositionItem[]> {
    if (typeof window === 'undefined') return initialPositions

    const localData = localStorage.getItem(STORAGE_KEYS.POSITIONS)
    let positions = localData ? (JSON.parse(localData) as PositionItem[]) : initialPositions

    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        const { data, error } = await supabase.from('chuc_vu').select('*').order('cap_bac', { ascending: false })
        if (!error && data && data.length > 0) {
          positions = data.map(row => ({
            id: normalizePositionId(String(row.ma_chuc_vu || row.id || '')),
            db_id: String(row.id || ''),
            code: String(row.ma_chuc_vu || ''),
            name: String(row.ten || ''),
            department_id: String(row.phong_ban_id || row.department_id || ''),
            level: Number(row.cap_bac || 1),
            base_salary: Number(row.luong_co_ban || 5000000),
            pay_type: (Number(row.cap_bac) || 1) >= 3 ? 'monthly' : 'hourly',
          }))
          localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(positions))
        }
      } catch (err) {
        console.warn('Supabase DB chuc_vu fetch fallback:', err)
      }
    }

    return positions
  }

  static async savePositions(items: PositionItem[]): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.POSITIONS, JSON.stringify(items))
    }

    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        // Upsert positions to chuc_vu table
        for (const item of items) {
          const code = (item.code || (/^pos-\d+$/i.test(item.id) ? item.id.toUpperCase() : '')).trim()
          if (!item.db_id && !/^POS-\d{1,3}$/.test(code)) {
            console.warn('Skip syncing position without db_id or code:', item.name)
            continue
          }

          const payload: Record<string, unknown> = {
            to_chuc_id: 'a0000000-0000-0000-0000-000000000001',
            ten: item.name,
            cap_bac: item.level,
            luong_co_ban: item.base_salary,
          }
          if (item.db_id) payload.id = item.db_id
          if (code) payload.ma_chuc_vu = code

          await supabase.from('chuc_vu').upsert(payload)
        }
      } catch (err) {
        console.error('Failed to sync positions to chuc_vu:', err)
      }
    }
  }

  static async deletePosition(positionId: string): Promise<DeletePositionResult> {
    if (!isSupabaseConfigured || !isRealDbMode()) {
      return { deleted: true, employee_count: 0 }
    }

    const cachedPositions = typeof window !== 'undefined'
      ? (JSON.parse(localStorage.getItem(STORAGE_KEYS.POSITIONS) || '[]') as PositionItem[])
      : []
    const cachedPosition = cachedPositions.find(item => item.id === positionId || item.db_id === positionId || item.code === positionId)
    const dbPositionId = cachedPosition?.db_id || positionId
    if (!cachedPosition?.db_id && /^pos-\d+$/i.test(positionId)) {
      console.warn('Skip deleting position without db_id:', cachedPosition?.name || positionId)
      return { deleted: true, employee_count: 0 }
    }

    return deletePositionWithGuard(dbPositionId, {
      async countEmployeesByPosition(id) {
        const { count, error } = await supabase
          .from('nhan_vien')
          .select('id', { count: 'exact', head: true })
          .eq('chuc_vu_id', id)

        if (error) {
          throw new Error(`Không thể kiểm tra nhân viên đang dùng chức danh: ${error.message}`)
        }
        return count ?? 0
      },
      async deletePosition(id) {
        const { error } = await supabase.from('chuc_vu').delete().eq('id', id)
        if (error) {
          throw new Error(`Không thể xóa chức danh trên Supabase: ${error.message}`)
        }
      },
    })
  }

  // ─── LEAVE TYPES ───
  static async getLeaveTypes(): Promise<LeaveTypeItem[]> {
    if (typeof window === 'undefined') return masterLeaveTypes

    const localData = localStorage.getItem(STORAGE_KEYS.LEAVE_TYPES)
    return localData ? (JSON.parse(localData) as LeaveTypeItem[]) : masterLeaveTypes
  }

  static async saveLeaveTypes(items: LeaveTypeItem[]): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LEAVE_TYPES, JSON.stringify(items))
    }
  }

  // ─── WORKFLOWS ───
  static getInitialWorkflows(): WorkflowItem[] {
    return [
      {
        id: 'wf-001',
        request_type: 'Xin nghỉ ngày',
        name: 'Xin nghỉ ngày',
        submitter_role: 'Tất cả chức vụ',
        levels_count: 1,
        steps: [
          {
            level: 1,
            approver_roles: ['Quản lý bộ phận', 'Quản lý điểm bán hàng', 'Quản lý nhân sự - Ngưng hoạt động', 'Chủ thương hiệu'],
          },
        ],
        notify_roles: [],
        exclude_employee_ids: [],
        require_advance_notice: true,
        require_photo_attachment: false,
      },
      {
        id: 'wf-002',
        request_type: 'Duyệt chấm công',
        name: 'Duyệt chấm công',
        submitter_role: 'Tất cả chức vụ',
        levels_count: 1,
        steps: [
          {
            level: 1,
            approver_roles: ['Quản lý điểm bán hàng', 'Quản lý nhân sự'],
          },
        ],
        notify_roles: [],
        exclude_employee_ids: [],
      },
      {
        id: 'wf-003',
        request_type: 'Đổi thiết bị chấm công',
        name: 'Đổi thiết bị chấm công',
        submitter_role: 'Tất cả chức vụ',
        levels_count: 1,
        steps: [
          {
            level: 1,
            approver_roles: ['Quản lý điểm bán hàng', 'Quản lý nhân sự'],
          },
        ],
        notify_roles: [],
        exclude_employee_ids: [],
      },
      {
        id: 'wf-004',
        request_type: 'Cập nhật hồ sơ',
        name: 'Cập nhật hồ sơ',
        submitter_role: 'Tất cả chức vụ',
        levels_count: 1,
        steps: [
          {
            level: 1,
            approver_roles: ['Quản lý nhân sự', 'Chủ thương hiệu'],
          },
        ],
        notify_roles: [],
        exclude_employee_ids: [],
      },
      {
        id: 'wf-005',
        request_type: 'Xin ra ngoài trong ca',
        name: 'Xin ra ngoài trong ca',
        submitter_role: 'Tất cả chức vụ',
        levels_count: 1,
        steps: [
          {
            level: 1,
            approver_roles: ['Trưởng ca', 'Quản lý điểm bán hàng'],
          },
        ],
        notify_roles: [],
        exclude_employee_ids: [],
      },
      {
        id: 'wf-006',
        request_type: 'Xoay ca',
        name: 'Xoay ca',
        submitter_role: 'Tất cả chức vụ',
        levels_count: 1,
        steps: [
          {
            level: 1,
            approver_roles: ['Trưởng ca', 'Quản lý điểm bán hàng'],
          },
        ],
        notify_roles: [],
        exclude_employee_ids: [],
      },
      {
        id: 'wf-007',
        request_type: 'Ủy quyền cấu hình WiFi',
        name: 'Ủy quyền cấu hình WiFi',
        submitter_role: 'Tất cả chức vụ',
        levels_count: 1,
        steps: [
          {
            level: 1,
            approver_roles: ['Chủ thương hiệu', 'Quản lý vùng'],
          },
        ],
        notify_roles: ['Quản lý nhân sự - Ngưng hoạt động', 'Chủ thương hiệu'],
        exclude_employee_ids: [],
      },
      {
        id: 'wf-008',
        request_type: 'Xin nghỉ ca',
        name: 'Xin nghỉ ca',
        submitter_role: 'Tất cả chức vụ',
        levels_count: 1,
        steps: [
          {
            level: 1,
            approver_roles: ['Trưởng ca', 'Quản lý điểm bán hàng'],
          },
        ],
        notify_roles: [],
        exclude_employee_ids: [],
      },
      {
        id: 'wf-009',
        request_type: 'Nhờ làm thay',
        name: 'Nhờ làm thay',
        submitter_role: 'Tất cả chức vụ',
        levels_count: 2,
        steps: [
          {
            level: 1,
            approver_roles: ['Nhân viên nhận ca làm thay'],
          },
          {
            level: 2,
            approver_roles: ['Quản lý điểm bán hàng', 'Quản lý bộ phận'],
          },
        ],
        notify_roles: [],
        exclude_employee_ids: [],
      },
      {
        id: 'wf-010',
        request_type: 'Đổi ca',
        name: 'Đổi ca',
        submitter_role: 'Tất cả chức vụ',
        levels_count: 2,
        steps: [
          {
            level: 1,
            approver_roles: ['Nhân viên cùng đổi ca'],
          },
          {
            level: 2,
            approver_roles: ['Quản lý điểm bán hàng', 'Quản lý bộ phận'],
          },
        ],
        notify_roles: [],
        exclude_employee_ids: [],
      },
      {
        id: 'wf-011',
        request_type: 'Thay đổi lương, loại nhân viên',
        name: 'Thay đổi lương, loại nhân viên',
        submitter_role: 'Tất cả chức vụ',
        levels_count: 1,
        steps: [
          {
            level: 1,
            approver_roles: ['Quản lý nhân sự', 'Chủ thương hiệu'],
          },
        ],
        notify_roles: [],
        exclude_employee_ids: [],
      },
      {
        id: 'wf-012',
        request_type: 'Thay đổi chức vụ',
        name: 'Thay đổi chức vụ',
        submitter_role: 'Tất cả chức vụ',
        levels_count: 1,
        steps: [
          {
            level: 1,
            approver_roles: ['Quản lý nhân sự', 'Chủ thương hiệu'],
          },
        ],
        notify_roles: [],
        exclude_employee_ids: [],
      },
      {
        id: 'wf-013',
        request_type: 'Ứng lương',
        name: 'Ứng lương',
        submitter_role: 'Tất cả chức vụ',
        levels_count: 1,
        steps: [
          {
            level: 1,
            approver_roles: ['Quản lý điểm bán hàng', 'Kế toán / HR Admin'],
          },
        ],
        notify_roles: [],
        exclude_employee_ids: [],
      },
      {
        id: 'wf-014',
        request_type: 'Xin đi muộn',
        name: 'Xin đi muộn',
        submitter_role: 'Tất cả chức vụ',
        levels_count: 1,
        steps: [
          {
            level: 1,
            approver_roles: ['Trưởng ca', 'Quản lý điểm bán hàng'],
          },
        ],
        notify_roles: [],
        exclude_employee_ids: [],
      },
      {
        id: 'wf-015',
        request_type: 'Xin về sớm',
        name: 'Xin về sớm',
        submitter_role: 'Tất cả chức vụ',
        levels_count: 1,
        steps: [
          {
            level: 1,
            approver_roles: ['Trưởng ca', 'Quản lý điểm bán hàng'],
          },
        ],
        notify_roles: [],
        exclude_employee_ids: [],
      },
    ]
  }

  static async getWorkflows(): Promise<WorkflowItem[]> {
    const initialWfs = MasterDataAdapter.getInitialWorkflows()

    if (typeof window === 'undefined') return initialWfs

    const localData = localStorage.getItem(STORAGE_KEYS.WORKFLOWS)
    if (!localData) return initialWfs

    try {
      const parsed = JSON.parse(localData) as WorkflowItem[]
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].request_type) {
        return parsed
      }
    } catch {
      // fallback to initialWfs
    }
    return initialWfs
  }

  static async saveWorkflows(items: WorkflowItem[]): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(items))
    }
  }
}
