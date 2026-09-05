// ============================================
// HRM Trà Sữa 🧋 — Leave Data Adapter
// Unified Repository for Leave & Time-Off Requests (Table don_tu)
// ============================================

import { isRealDbMode } from './repository-config'
import { supabase, isSupabaseConfigured } from '../supabase'
import type { LeaveRequest, LeaveStatus, LeaveType } from '@/lib/mock-data-leave'
import { LEAVE_TYPE_MAP } from '@/lib/mock-data-leave'
import { EmployeeService } from '../services/employee-service'
import { getStoreById, getPositionById } from '@/lib/mock-data'
import type { AuthUser } from '@/store/auth-store'

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

const EMP_ID_TO_UUID: Record<string, string> = {
  'emp-001': 'e0000000-0000-0000-0000-000000000001',
  'emp-002': 'e0000000-0000-0000-0000-000000000002',
  'emp-003': 'e0000000-0000-0000-0000-000000000003',
  'emp-004': 'e0000000-0000-0000-0000-000000000004',
  'emp-005': 'e0000000-0000-0000-0000-000000000005',
  'emp-006': 'e0000000-0000-0000-0000-000000000006',
  'emp-007': 'e0000000-0000-0000-0000-000000000007',
  'emp-008': 'e0000000-0000-0000-0000-000000000008',
  'emp-009': 'e0000000-0000-0000-0000-000000000009',
  'emp-010': 'e0000000-0000-0000-0000-000000000010',
  'emp-011': 'e0000000-0000-0000-0000-000000000011',
  'emp-012': 'e0000000-0000-0000-0000-000000000012',
  'emp-013': 'e0000000-0000-0000-0000-000000000013',
  'emp-014': 'e0000000-0000-0000-0000-000000000014',
  'emp-015': 'e0000000-0000-0000-0000-000000000015',
  'emp-016': 'e0000000-0000-0000-0000-000000000016',
}

const UUID_TO_EMP_ID: Record<string, string> = {
  'e0000000-0000-0000-0000-000000000001': 'emp-001',
  'e0000000-0000-0000-0000-000000000002': 'emp-002',
  'e0000000-0000-0000-0000-000000000003': 'emp-003',
  'e0000000-0000-0000-0000-000000000004': 'emp-004',
  'e0000000-0000-0000-0000-000000000005': 'emp-005',
  'e0000000-0000-0000-0000-000000000006': 'emp-006',
  'e0000000-0000-0000-0000-000000000007': 'emp-007',
  'e0000000-0000-0000-0000-000000000008': 'emp-008',
  'e0000000-0000-0000-0000-000000000009': 'emp-009',
  'e0000000-0000-0000-0000-000000000010': 'emp-010',
  'e0000000-0000-0000-0000-000000000011': 'emp-011',
  'e0000000-0000-0000-0000-000000000012': 'emp-012',
  'e0000000-0000-0000-0000-000000000013': 'emp-013',
  'e0000000-0000-0000-0000-000000000014': 'emp-014',
  'e0000000-0000-0000-0000-000000000015': 'emp-015',
  'e0000000-0000-0000-0000-000000000016': 'emp-016',
}

const LEAVE_EXTRA_META_KEY = 'HOMIES_LEAVE_EXTRA_METADATA_V1'
const LOCAL_LEAVE_BACKUP_KEY = 'homies_leave_requests'

export interface LeaveExtraMeta {
  leave_type?: LeaveType
  isHalfDay?: boolean
  halfDayPeriod?: 'morning' | 'afternoon'
  document_url?: string
  days?: number
}

function getStoredLeaveMetadata(): Record<string, LeaveExtraMeta> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(LEAVE_EXTRA_META_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStoredLeaveMetadata(map: Record<string, LeaveExtraMeta>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(LEAVE_EXTRA_META_KEY, JSON.stringify(map))
  } catch {}
}

export function getLeaveExtraMeta(key?: string): LeaveExtraMeta {
  if (!key) return {}
  const map = getStoredLeaveMetadata()
  return map[key] || {}
}

export function setLeaveExtraMeta(keys: (string | undefined)[], meta: Partial<LeaveExtraMeta>) {
  const map = getStoredLeaveMetadata()
  const validKeys = keys.filter((k): k is string => Boolean(k && k.trim()))
  if (validKeys.length === 0) return

  const existing = validKeys.reduce<LeaveExtraMeta>((acc, k) => ({ ...acc, ...(map[k] || {}) }), {})
  const merged: LeaveExtraMeta = {
    ...existing,
    ...meta,
  }

  validKeys.forEach(k => {
    map[k] = merged
  })

  saveStoredLeaveMetadata(map)
}

export function normalizeLeaveType(rawType?: unknown): LeaveType {
  if (!rawType) return 'unpaid'
  const normalized = String(rawType).trim().toLowerCase().replace(/[\s-]+/g, '_')

  switch (normalized) {
    case 'annual':
    case 'phep_nam':
    case 'annual_leave':
    case 'nghi_phep_nam':
    case 'nghi_phep':
      return 'annual'
    case 'sick':
    case 'nghi_om':
    case 'om':
    case 'sick_leave':
    case 'benh':
      return 'sick'
    case 'unpaid':
    case 'khong_luong':
    case 'unpaid_leave':
    case 'nghi_khong_luong':
      return 'unpaid'
    case 'wedding':
    case 'nghi_cuoi':
    case 'cuoi':
    case 'ket_hon':
    case 'wedding_leave':
      return 'wedding'
    case 'bereavement':
    case 'nghi_tang':
    case 'tang':
    case 'dam_tang':
    case 'bereavement_leave':
      return 'bereavement'
    case 'maternity':
    case 'thai_san':
    case 'nghi_thai_san':
    case 'maternity_leave':
      return 'maternity'
    case 'personal':
    case 'viec_rieng':
    case 'personal_leave':
      return 'personal'
    default:
      console.warn(`[LeaveAdapter] Không nhận diện được loại nghỉ: "${String(rawType)}", tự động chuyển về "unpaid" để bảo vệ quỹ lương.`)
      return 'unpaid'
  }
}

export function normalizeLeaveStatus(rawStatus?: unknown): LeaveStatus {
  if (!rawStatus) return 'pending'
  const normalized = String(rawStatus).trim().toLowerCase().replace(/[\s-]+/g, '_')

  switch (normalized) {
    case 'approved':
    case 'da_duyet':
    case 'duyet':
      return 'approved'
    case 'rejected':
    case 'tu_choi':
    case 'tu_chuoi':
    case 'khong_duyet':
      return 'rejected'
    case 'cancelled':
    case 'canceled':
    case 'da_huy':
    case 'huy':
      return 'cancelled'
    case 'draft':
    case 'nhap':
      return 'draft'
    case 'pending':
    case 'cho_duyet':
    case 'cho':
      return 'pending'
    default:
      console.warn(`[LeaveAdapter] Không nhận diện được trạng thái đơn nghỉ: "${String(rawStatus)}", tự động chuyển về "pending".`)
      return 'pending'
  }
}

const mapStatusToDb = (status: LeaveStatus): string => {
  switch (status) {
    case 'approved': return 'da_duyet'
    case 'rejected': return 'tu_chuoi'
    case 'cancelled': return 'da_huy'
    case 'draft':
    case 'pending':
    default: return 'cho_duyet'
  }
}

const mapStatusFromDb = (dbStatus?: string): LeaveStatus => {
  return normalizeLeaveStatus(dbStatus)
}

const resolveEmployeeId = (empId?: string): string => {
  if (!empId) return EMP_ID_TO_UUID['emp-001']
  return EMP_ID_TO_UUID[empId] || empId
}

const resolveStoreId = (storeId?: string): string => {
  if (!storeId) return STORE_ID_MAP['store-001']
  return STORE_ID_MAP[storeId] || storeId
}

const computeDays = (startDate: string, endDate: string, isHalfDay?: boolean): number => {
  if (isHalfDay) return 0.5
  try {
    const s = new Date(startDate).getTime()
    const e = new Date(endDate).getTime()
    const diff = Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1
    return diff > 0 ? diff : 1
  } catch {
    return 1
  }
}

const mapRowToLeaveRequest = (row: Record<string, unknown>): LeaveRequest => {
  const id = String(row.id || '')
  const rawEmpId = String(row.nhan_vien_id || '')
  const empId = UUID_TO_EMP_ID[rawEmpId] || rawEmpId
  const rawStoreId = String(row.cua_hang_id || '')
  const storeId = REVERSE_STORE_MAP[rawStoreId] || rawStoreId || 'store-001'

  const employee = typeof window !== 'undefined'
    ? (EmployeeService.getEmployeeById(empId) || EmployeeService.getEmployeeById(rawEmpId))
    : null

  const empName = employee?.full_name || 'Nhân sự'
  const position = employee ? (getPositionById(employee.position_id)?.name || 'Nhân viên') : 'Nhân viên'

  const meta = getLeaveExtraMeta(id)
  const rawLeaveType = meta.leave_type || (row.loai_phep as string) || (row.loai_nghi as string) || (row.leave_type as string)
  const leaveType: LeaveType = normalizeLeaveType(rawLeaveType)
  const startDate = String(row.ngay_bat_dau || new Date().toISOString().slice(0, 10))
  const endDate = String(row.ngay_ket_thuc || startDate)
  const isHalfDay = meta.isHalfDay ?? false
  const days = meta.days ?? computeDays(startDate, endDate, isHalfDay)

  const rawApproverId = row.nguoi_duyet_id ? String(row.nguoi_duyet_id) : undefined
  const approverId = rawApproverId ? (UUID_TO_EMP_ID[rawApproverId] || rawApproverId) : undefined
  const approver = approverId && typeof window !== 'undefined'
    ? (EmployeeService.getEmployeeById(approverId) || EmployeeService.getEmployeeById(rawApproverId!))
    : null

  const status = normalizeLeaveStatus(row.trang_thai)

  return {
    id,
    employee_id: empId,
    employee_name: empName,
    employee_position: position,
    store_id: storeId,
    leave_type: leaveType,
    leave_type_label: LEAVE_TYPE_MAP[leaveType]?.name || 'Không lương',
    status,
    start_date: startDate,
    end_date: endDate,
    days,
    isHalfDay,
    halfDayPeriod: meta.halfDayPeriod,
    reason: String(row.ly_do || ''),
    document_url: meta.document_url,
    created_at: String(row.ngay_tao || new Date().toISOString()),
    updated_at: String(row.ngay_cap_nhat || new Date().toISOString()),
    approver_id: approverId,
    approver_name: approver?.full_name,
    approved_at: status === 'approved' && row.thoi_gian_duyet ? String(row.thoi_gian_duyet) : undefined,
    rejected_at: status === 'rejected' && row.thoi_gian_duyet ? String(row.thoi_gian_duyet) : undefined,
    approver_comment: row.ghi_chu_duyet ? String(row.ghi_chu_duyet) : undefined,
    hasScheduleConflict: false,
  }
}

export interface LeaveAdapter {
  getAllLeaveRequests: (currentUser?: AuthUser) => Promise<LeaveRequest[]>
  getLeaveRequestsByEmployee: (employeeId: string) => Promise<LeaveRequest[]>
  createLeaveRequest: (req: Partial<LeaveRequest>, currentUser?: AuthUser) => Promise<LeaveRequest>
  updateLeaveRequestStatus: (
    id: string,
    status: LeaveStatus,
    approver?: AuthUser,
    comment?: string
  ) => Promise<LeaveRequest | null>
  deleteLeaveRequest: (id: string) => Promise<boolean>
}

export const leaveAdapter: LeaveAdapter = {
  async getAllLeaveRequests(currentUser?: AuthUser): Promise<LeaveRequest[]> {
    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        let query = supabase
          .from('don_tu')
          .select('*')
          .eq('loai_don', 'xin_nghi')
          .order('ngay_tao', { ascending: false })

        if (currentUser && currentUser.role === 'store_manager' && currentUser.store_id) {
          const storeUuid = STORE_ID_MAP[currentUser.store_id] || currentUser.store_id
          query = query.eq('cua_hang_id', storeUuid)
        } else if (currentUser && currentUser.role === 'employee') {
          const empUuid = EMP_ID_TO_UUID[currentUser.id] || currentUser.id
          query = query.eq('nhan_vien_id', empUuid)
        }

        const { data, error } = await query

        if (!error && data && data.length > 0) {
          const mapped = data.map(row => mapRowToLeaveRequest(row))
          if (typeof window !== 'undefined') {
            localStorage.setItem(LOCAL_LEAVE_BACKUP_KEY, JSON.stringify(mapped))
          }
          return mapped
        }
      } catch (err) {
        console.warn('[LeaveAdapter] Supabase query fallback:', err)
      }
    }

    // Fallback to local storage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_LEAVE_BACKUP_KEY)
        if (raw) {
          const parsed = JSON.parse(raw) as LeaveRequest[]
          if (Array.isArray(parsed)) return parsed
        }
      } catch {}
    }

    return []
  },

  async getLeaveRequestsByEmployee(employeeId: string): Promise<LeaveRequest[]> {
    const list = await this.getAllLeaveRequests()
    const resolved = UUID_TO_EMP_ID[employeeId] || employeeId
    return list.filter(r => r.employee_id === resolved || r.employee_id === employeeId)
  },

  async createLeaveRequest(req: Partial<LeaveRequest>, currentUser?: AuthUser): Promise<LeaveRequest> {
    const now = new Date().toISOString()
    const id = req.id || `leave-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const empId = req.employee_id || currentUser?.id || 'emp-001'
    const storeId = req.store_id || currentUser?.store_id || 'store-001'
    const leaveType = normalizeLeaveType(req.leave_type)
    const startDate = req.start_date || now.slice(0, 10)
    const endDate = req.end_date || startDate
    const isHalfDay = req.isHalfDay ?? false
    const days = req.days ?? computeDays(startDate, endDate, isHalfDay)

    const empName = req.employee_name || currentUser?.full_name || 'Nhân sự'
    const position = req.employee_position || 'Nhân viên'

    const fullReq: LeaveRequest = {
      id,
      employee_id: empId,
      employee_name: empName,
      employee_position: position,
      store_id: storeId,
      leave_type: leaveType,
      leave_type_label: LEAVE_TYPE_MAP[leaveType]?.name || 'Không lương',
      status: 'pending',
      start_date: startDate,
      end_date: endDate,
      days,
      isHalfDay,
      halfDayPeriod: req.halfDayPeriod,
      reason: req.reason || '',
      document_url: req.document_url,
      created_at: now,
      updated_at: now,
      hasScheduleConflict: false,
    }

    // 1. Save extended metadata
    setLeaveExtraMeta([fullReq.id], {
      leave_type: fullReq.leave_type,
      isHalfDay: fullReq.isHalfDay,
      halfDayPeriod: fullReq.halfDayPeriod,
      document_url: fullReq.document_url,
      days: fullReq.days,
    })

    // 2. Save local backup
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_LEAVE_BACKUP_KEY)
        const list: LeaveRequest[] = raw ? JSON.parse(raw) : []
        list.unshift(fullReq)
        localStorage.setItem(LOCAL_LEAVE_BACKUP_KEY, JSON.stringify(list))
      } catch {}
    }

    // 3. Sync to Supabase table don_tu
    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        const dbPayload = {
          nhan_vien_id: resolveEmployeeId(empId),
          cua_hang_id: resolveStoreId(storeId),
          loai_don: 'xin_nghi',
          trang_thai: 'cho_duyet',
          ngay_bat_dau: startDate,
          ngay_ket_thuc: endDate,
          ly_do: fullReq.reason,
          ngay_tao: now,
          ngay_cap_nhat: now,
        }

        const { data, error } = await supabase
          .from('don_tu')
          .insert([dbPayload])
          .select()
          .single()

        if (!error && data) {
          const synced = mapRowToLeaveRequest(data)
          setLeaveExtraMeta([synced.id], {
            leave_type: fullReq.leave_type,
            isHalfDay: fullReq.isHalfDay,
            halfDayPeriod: fullReq.halfDayPeriod,
            document_url: fullReq.document_url,
            days: fullReq.days,
          })
          return synced
        }
      } catch (err) {
        console.warn('[LeaveAdapter] Supabase create error:', err)
      }
    }

    return fullReq
  },

  async updateLeaveRequestStatus(
    id: string,
    status: LeaveStatus,
    approver?: AuthUser,
    comment?: string
  ): Promise<LeaveRequest | null> {
    const now = new Date().toISOString()
    const normStatus = normalizeLeaveStatus(status)
    const dbStatus = mapStatusToDb(normStatus)

    // 1. Update in local backup
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_LEAVE_BACKUP_KEY)
        if (raw) {
          const list: LeaveRequest[] = JSON.parse(raw)
          const idx = list.findIndex(r => r.id === id)
          if (idx >= 0) {
            list[idx].status = normStatus
            list[idx].updated_at = now
            if (approver) {
              list[idx].approver_id = approver.id
              list[idx].approver_name = approver.full_name
            }
            if (comment) {
              list[idx].approver_comment = comment
            }
            if (normStatus === 'approved') list[idx].approved_at = now
            if (normStatus === 'rejected') list[idx].rejected_at = now
            localStorage.setItem(LOCAL_LEAVE_BACKUP_KEY, JSON.stringify(list))
          }
        }
      } catch {}
    }

    // 2. Update in Supabase
    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        const payload: Record<string, unknown> = {
          trang_thai: dbStatus,
          ngay_cap_nhat: now,
        }
        if (approver?.id) {
          payload.nguoi_duyet_id = resolveEmployeeId(approver.id)
        }
        if (status === 'approved' || status === 'rejected') {
          payload.thoi_gian_duyet = now
        }
        if (comment) {
          payload.ghi_chu_duyet = comment
        }

        const { data, error } = await supabase
          .from('don_tu')
          .update(payload)
          .eq('id', id)
          .select()
          .single()

        if (!error && data) {
          return mapRowToLeaveRequest(data)
        }
      } catch (err) {
        console.warn('[LeaveAdapter] Supabase status update error:', err)
      }
    }

    return null
  },

  async deleteLeaveRequest(id: string): Promise<boolean> {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_LEAVE_BACKUP_KEY)
        if (raw) {
          const list: LeaveRequest[] = JSON.parse(raw)
          const filtered = list.filter(r => r.id !== id)
          localStorage.setItem(LOCAL_LEAVE_BACKUP_KEY, JSON.stringify(filtered))
        }
      } catch {}
    }

    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        await supabase.from('don_tu').delete().eq('id', id)
      } catch (err) {
        console.warn('[LeaveAdapter] Supabase delete error:', err)
      }
    }

    return true
  }
}
