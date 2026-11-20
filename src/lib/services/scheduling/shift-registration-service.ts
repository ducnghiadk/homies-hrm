import { getMondayOfDate, formatDateString } from '@/lib/mock-data-registration-weeks'
import { addSchedule, mockEmployees, mockPositions, isStoreMatch, mockSchedules, type Employee } from '@/lib/mock-data'
import { savePreferences } from '@/lib/mock-data-preferences'

export function standardizeShiftId(startTime: string, shiftName?: string): string {
  const cleanTime = (startTime || '').trim()
  const cleanName = (shiftName || '').toLowerCase()

  if (cleanName.includes('sáng') || cleanName.includes('morning')) return 'shift-001'
  if (cleanName.includes('trưa') || cleanName.includes('chiều') || cleanName.includes('afternoon')) return 'shift-002'
  if (cleanName.includes('tối') || cleanName.includes('đêm') || cleanName.includes('evening') || cleanName.includes('bếp')) return 'shift-003'

  if (cleanTime < '12:00') return 'shift-001'
  if (cleanTime >= '12:00' && cleanTime < '17:00') return 'shift-002'
  return 'shift-003'
}

export interface PendingShiftRegistration {
  id: string
  employee_id: string
  employee_code?: string
  employee_name?: string
  store_id: string
  week_start_date: string // YYYY-MM-DD (Thứ 2)
  date: string            // YYYY-MM-DD
  shift_id: string        // shift-001, shift-002, shift-003
  shift_name?: string
  position_id: string     // pos-001 (Pha chế), pos-002 (Thu ngân), ...
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
  notes?: string
}

export interface CoverageRateResult {
  totalEmployees: number
  submittedCount: number
  ratePercent: number
  submittedEmployees: Array<{ id: string; name: string; code: string; phone?: string; shiftCount?: number }>
  missingEmployees: Array<{ id: string; name: string; code: string; phone?: string; role?: string; positionName?: string }>
}

export interface HeatmapEmployeeItem {
  id: string
  registrationId: string
  name: string
  code: string
  positionName: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  notes?: string
}

export interface HeatmapCell {
  date: string
  dateLabel: string
  dayOfWeek: string // T2, T3, ... CN
  shiftId: string
  shiftName: string
  timeRange: string
  registrations: PendingShiftRegistration[]
  registeredEmployees: HeatmapEmployeeItem[]
  count: number
  approvedCount: number
  pendingCount: number
  status: 'FULL' | 'RISK' | 'EMPTY' // FULL (>= 2), RISK (1), EMPTY (0)
}

export interface StaffDayShift {
  id: string
  shiftId: string
  shiftName: string
  timeRange?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  notes?: string
}

export interface StaffRegistrationSummary {
  id: string
  name: string
  code: string
  role: string
  positionName: string
  phone: string
  hasSubmitted: boolean
  registeredCount: number
  approvedCount: number
  pendingCount: number
  totalHours: number
  days: Record<string, StaffDayShift[]>
}

let memoryRegistrations: PendingShiftRegistration[] = []
let serverActiveEmployees: Employee[] | null = null
let isInitialized = false

function getEffectiveEmployees(): Employee[] {
  return serverActiveEmployees && serverActiveEmployees.length > 0
    ? serverActiveEmployees
    : mockEmployees
}

function extractRegCode(reg: PendingShiftRegistration): string {
  if (reg.employee_code && reg.employee_code.trim() !== '-') {
    return reg.employee_code.trim().toUpperCase()
  }
  if (reg.employee_id?.startsWith('emp-')) {
    return reg.employee_id.replace('emp-', '').toUpperCase()
  }
  return ''
}

function isEmployeeMatch(emp: Employee, reg: PendingShiftRegistration): boolean {
  if (reg.employee_id && emp.id === reg.employee_id) return true
  const empCode = (emp.employee_code || '').trim().toUpperCase()
  const regCode = extractRegCode(reg)
  if (empCode && empCode !== '-' && regCode && empCode === regCode) return true
  const empName = (emp.full_name || '').trim().toLowerCase()
  const regName = (reg.employee_name || '').trim().toLowerCase()
  if (empName && regName && empName === regName) return true
  return false
}

function seedDefaultRegistrations(): PendingShiftRegistration[] {
  return []
}

function initStorage() {
  if (isInitialized) return
  isInitialized = true
  memoryRegistrations = []

  // Đồng bộ từ Database máy chủ
  if (typeof window !== 'undefined') {
    fetch('/api/shifts/register?status=all')
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (json?.success && Array.isArray(json.data)) {
          const serverRegs: PendingShiftRegistration[] = json.data.map((r: Record<string, unknown>) => ({
            id: String(r.id || `reg-${Date.now()}`),
            employee_id: String(r.employee_id || ''),
            employee_code: r.employee_code ? String(r.employee_code) : undefined,
            employee_name: r.employee_name ? String(r.employee_name) : undefined,
            store_id: String(r.store_id || 'store-001'),
            week_start_date: String(r.week_start_date || ''),
            date: String(r.date || ''),
            shift_id: String(r.shift_id || 'shift-001'),
            shift_name: r.shift_name ? String(r.shift_name) : undefined,
            position_id: String(r.position_id || 'pos-001'),
            status: (String(r.status || 'PENDING').toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED'),
            created_at: String(r.created_at || new Date().toISOString()),
            notes: r.notes ? String(r.notes) : undefined,
          }))
          memoryRegistrations = serverRegs
        }
      })
      .catch(err => {
        console.warn('[ShiftRegistrationService] Không thể tải ca đăng ký từ /api/shifts/register:', err)
      })
  }
}

function persistStorage() {
  if (typeof window !== 'undefined') {
    fetch('/api/shifts/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(memoryRegistrations),
    }).catch(err => {
      console.warn('[ShiftRegistrationService] Lỗi đồng bộ ca đăng ký lên máy chủ (/api/shifts/register):', err)
    })
  }
}

export class ShiftRegistrationService {
  /**
   * Lấy danh sách đăng ký ca chờ duyệt theo chi nhánh và tuần
   */
  static getRegistrations(storeId?: string, weekStartDate?: string): PendingShiftRegistration[] {
    initStorage()
    return memoryRegistrations.filter(r => {
      if (storeId && !isStoreMatch(r.store_id, storeId)) return false
      if (weekStartDate && r.week_start_date !== weekStartDate) return false
      return true
    })
  }

  /**
   * Đếm số ca đang chờ duyệt (PENDING)
   */
  static getPendingCount(storeId?: string, weekStartDate?: string): number {
    return this.getRegistrations(storeId, weekStartDate).filter(r => r.status === 'PENDING').length
  }

  /**
   * Nhân viên gửi đăng ký ca tuần
   */
  static submitRegistrations(
    employeeId: string,
    storeId: string,
    weekStartDate: string,
    items: {
      date: string
      shiftId: string
      positionId: string
      notes?: string
    }[]
  ): PendingShiftRegistration[] {
    initStorage()

    // Xóa các đăng ký PENDING cũ của nhân viên trong tuần này để ghi đè lượt mới
    memoryRegistrations = memoryRegistrations.filter(
      r => !(r.employee_id === employeeId && r.week_start_date === weekStartDate && r.status === 'PENDING')
    )

    const now = new Date().toISOString()
    const newItems: PendingShiftRegistration[] = items.map((item, idx) => ({
      id: `reg-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      employee_id: employeeId,
      store_id: storeId,
      week_start_date: weekStartDate,
      date: item.date,
      shift_id: item.shiftId,
      position_id: item.positionId,
      status: 'PENDING',
      created_at: now,
      notes: item.notes,
    }))

    memoryRegistrations.push(...newItems)
    persistStorage()

    // Truyền ca đăng ký lên Database máy chủ trung tâm
    if (typeof window !== 'undefined') {
      fetch('/api/shifts/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: employeeId,
          store_id: storeId,
          week_start_date: weekStartDate,
          items,
        }),
      }).catch(err => {
        console.warn('[ShiftRegistrationService] Background server registration sync error:', err)
      })
    }

    // Đồng bộ sang preferences để gợi ý ca trên bảng xếp ca (ManagerSchedulingBoard) nhận diện được
    try {
      const dates = Array.from(new Set(items.map(i => i.date)))
      const days = dates.map(d => {
        const dayItems = items.filter(i => i.date === d)
        const hasMorning = dayItems.some(i => i.shiftId === 'shift-001')
        const hasAfternoon = dayItems.some(i => i.shiftId === 'shift-002')
        const hasEvening = dayItems.some(i => i.shiftId === 'shift-003')
        return {
          date: d,
          morning: hasMorning,
          afternoon: hasAfternoon,
          evening: hasEvening,
          notAvailable: !hasMorning && !hasAfternoon && !hasEvening,
          shiftPreferences: {
            'shift-001': hasMorning,
            'shift-002': hasAfternoon,
            'shift-003': hasEvening,
          }
        }
      })
      savePreferences(employeeId, weekStartDate, days, 'Đăng ký ca qua app di động', 'submitted')
    } catch {
      // Ignore preference sync errors
    }

    return newItems
  }

  /**
   * Nhân viên gửi đăng ký ca tuần và đợi máy chủ phản hồi (Async)
   */
  static async submitRegistrationsAsync(
    employeeId: string,
    storeId: string,
    weekStartDate: string,
    items: {
      date: string
      shiftId: string
      positionId: string
      notes?: string
    }[]
  ): Promise<PendingShiftRegistration[]> {
    const localResult = this.submitRegistrations(employeeId, storeId, weekStartDate, items)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/shifts/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: employeeId,
            store_id: storeId,
            week_start_date: weekStartDate,
            items,
          }),
        })
        if (res.ok) {
          const json = await res.json()
          if (json.success) {
            console.log(`[ShiftRegistrationService] Đã lưu thành công ${items.length} ca đăng ký lên Database máy chủ.`)
          }
        }
      } catch (err) {
        console.warn('[ShiftRegistrationService] Server registration sync error:', err)
      }
    }
    return localResult
  }

  /**
   * Đồng bộ danh sách nhân sự thật đang active từ máy chủ (/api/employees?status=active)
   */
  static async syncEmployeesFromServer(): Promise<Employee[]> {
    if (typeof window === 'undefined') return getEffectiveEmployees()
    try {
      const res = await fetch('/api/employees?status=active', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          const seenIds = new Set<string>()
          const seenCodes = new Set<string>()
          const seenNames = new Set<string>()
          const mapped: Employee[] = []

          for (const raw of json.data as Array<Record<string, unknown>>) {
            const id = String(raw.id || '').trim()
            const fullName = String(raw.full_name || '').trim()
            const code = String(raw.employee_code || '').trim()
            const codeUpper = code && code !== '-' ? code.toUpperCase() : ''
            const nameLower = fullName.toLowerCase()

            if (!id || !fullName) continue
            if (seenIds.has(id)) continue
            if (codeUpper && seenCodes.has(codeUpper)) continue
            if (nameLower && seenNames.has(nameLower)) continue

            seenIds.add(id)
            if (codeUpper) seenCodes.add(codeUpper)
            if (nameLower) seenNames.add(nameLower)

            mapped.push({
              id,
              org_id: String(raw.org_id || 'org-001'),
              store_id: String(raw.store_id || 'store-001'),
              allowed_store_ids: Array.isArray(raw.allowed_store_ids) ? (raw.allowed_store_ids as string[]) : undefined,
              secondary_store_ids: Array.isArray(raw.secondary_store_ids) ? (raw.secondary_store_ids as string[]) : undefined,
              position_id: String(raw.position_id || 'pos-001'),
              secondary_position_ids: Array.isArray(raw.secondary_position_ids) ? (raw.secondary_position_ids as string[]) : undefined,
              employee_code: code || '',
              full_name: fullName,
              phone: String(raw.phone || ''),
              email: String(raw.email || ''),
              avatar_url: raw.avatar_url ? String(raw.avatar_url) : undefined,
              date_of_birth: String(raw.date_of_birth || ''),
              gender: raw.gender === 'male' ? 'male' : 'female',
              address: String(raw.address || ''),
              role: (raw.role as Employee['role']) || 'employee',
              status: 'active',
              account_status: (raw.account_status as Employee['account_status']) || 'dang_hoat_dong',
              hire_date: String(raw.hire_date || '2026-10-01'),
              total_points: Number(raw.total_points || 0),
              gamification_level: (raw.gamification_level as Employee['gamification_level']) || 'bronze',
              base_salary: raw.base_salary !== undefined ? Number(raw.base_salary) : undefined,
              hourly_rate: raw.hourly_rate !== undefined ? Number(raw.hourly_rate) : undefined,
            })
          }

          if (mapped.length > 0) {
            serverActiveEmployees = mapped
            return mapped
          }
        }
      }
    } catch (err) {
      console.warn('[ShiftRegistrationService] syncEmployeesFromServer failed:', err)
    }
    return getEffectiveEmployees()
  }

  /**
   * Quản lý đồng bộ ca đăng ký từ Database máy chủ (/api/shifts/register)
   */
  static async syncRegistrationsFromServer(storeId?: string, weekStartDate?: string): Promise<PendingShiftRegistration[]> {
    if (typeof window === 'undefined') return []
    try {
      const params = new URLSearchParams()
      if (storeId) params.append('store_id', storeId)
      if (weekStartDate) params.append('week', weekStartDate)
      params.append('status', 'all')
      const res = await fetch(`/api/shifts/register?${params.toString()}`)
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          initStorage()
          const serverItems: PendingShiftRegistration[] = json.data.map((d: Record<string, unknown>) => ({
            id: String(d.id || ''),
            employee_id: String(d.employee_id || ''),
            employee_name: String(d.employee_name || ''),
            store_id: String(d.store_id || ''),
            week_start_date: String(d.week_start_date || ''),
            date: String(d.date || ''),
            shift_id: String(d.shift_id || ''),
            shift_name: String(d.shift_name || ''),
            position_id: String(d.position_id || ''),
            status: (String(d.status || 'PENDING').toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED'),
            created_at: String(d.created_at || new Date().toISOString()),
            notes: String(d.notes || ''),
          }))
          if (storeId && weekStartDate) {
            memoryRegistrations = [
              ...memoryRegistrations.filter(
                r => !(isStoreMatch(r.store_id, storeId) && r.week_start_date === weekStartDate)
              ),
              ...serverItems,
            ]
          } else {
            const serverIds = new Set(serverItems.map(s => s.id))
            memoryRegistrations = [
              ...memoryRegistrations.filter(r => !serverIds.has(r.id)),
              ...serverItems,
            ]
          }
          persistStorage()
          return serverItems
        }
      }
    } catch (err) {
      console.warn('[ShiftRegistrationService] syncRegistrationsFromServer failed:', err)
    }
    return []
  }

  /**
   * Quản lý bấm 1-chạm: Chấp thuận toàn bộ đăng ký hợp lệ cho tuần
   */
  static approveAllPendingForWeek(
    storeId: string,
    weekStartDate: string
  ): { approvedCount: number; skippedCount: number } {
    initStorage()
    const pendingList = memoryRegistrations.filter(
      r => isStoreMatch(r.store_id, storeId) && r.week_start_date === weekStartDate && r.status === 'PENDING'
    )

    let approvedCount = 0
    let skippedCount = 0

    const effectiveEmployees = getEffectiveEmployees()

    pendingList.forEach(reg => {
      const emp = effectiveEmployees.find(e => isEmployeeMatch(e, reg))
      if (!emp) {
        skippedCount++
        return
      }

      // Kiểm tra xem nhân sự có được phép làm tại store này không
      const canWorkHere =
        isStoreMatch(emp.store_id, storeId) ||
        emp.allowed_store_ids?.some(id => isStoreMatch(id, storeId)) ||
        emp.secondary_store_ids?.some(id => isStoreMatch(id, storeId))

      if (!canWorkHere) {
        skippedCount++
        return
      }

      // Kiểm tra trùng ca cùng khung giờ
      const alreadyHasShift = mockSchedules.find(
        s => s.employee_id === reg.employee_id && s.date === reg.date && s.shift_id === reg.shift_id
      )

      if (!alreadyHasShift) {
        addSchedule(
          storeId,
          reg.employee_id,
          reg.shift_id,
          reg.date,
          reg.notes || 'Đăng ký ca tuần (Tự động duyệt)',
          'draft',
          reg.position_id
        )
      } else if (reg.notes && (!alreadyHasShift.notes || alreadyHasShift.notes !== reg.notes)) {
        alreadyHasShift.notes = reg.notes
        if (reg.position_id) alreadyHasShift.assigned_position_id = reg.position_id
      }

      reg.status = 'APPROVED'
      approvedCount++
    })

    persistStorage()

    if (typeof window !== 'undefined' && approvedCount > 0) {
      fetch('/api/shifts/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          week_start_date: weekStartDate,
          action: 'approve',
          approver_name: 'Quản lý cửa hàng',
        }),
      }).catch(err => console.warn('[ShiftRegistrationService] approveAllPendingForWeek error:', err))
    }

    return { approvedCount, skippedCount }
  }

  /**
   * Quản lý duyệt 1 ca cụ thể
   */
  static approveRegistration(id: string, approverName = 'Quản lý'): boolean {
    initStorage()
    const target = memoryRegistrations.find(r => r.id === id)
    if (!target) return false

    target.status = 'APPROVED'

    // Bổ sung vào mockSchedules nếu chưa có
    const emp = getEffectiveEmployees().find(e => isEmployeeMatch(e, target))
    const already = mockSchedules.find(
      s => s.employee_id === target.employee_id && s.date === target.date && s.shift_id === target.shift_id
    )
    if (!already) {
      addSchedule(
        target.store_id,
        target.employee_id,
        target.shift_id,
        target.date,
        target.notes || 'Đăng ký ca (Đã duyệt)',
        'draft',
        target.position_id || emp?.position_id
      )
    }

    if (typeof window !== 'undefined') {
      fetch('/api/shifts/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_ids: [id],
          action: 'approve',
          approver_name: approverName,
        }),
      }).catch(err => {
        console.warn('[ShiftRegistrationService] approve error:', err)
      })
    }
    return true
  }

  /**
   * Quản lý từ chối 1 ca cụ thể
   */
  static rejectRegistration(id: string): boolean {
    initStorage()
    const target = memoryRegistrations.find(r => r.id === id)
    if (!target) return false

    target.status = 'REJECTED'

    if (typeof window !== 'undefined') {
      fetch('/api/shifts/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_ids: [id],
          action: 'reject',
        }),
      }).catch(err => {
        console.warn('[ShiftRegistrationService] reject error:', err)
      })
    }
    return true
  }

  /**
   * Quản lý duyệt nhanh toàn bộ ca PENDING trong 1 ô (Ngày + Khung ca)
   */
  static approveCell(storeId: string, date: string, shiftId: string, approverName = 'Quản lý'): { approvedCount: number } {
    initStorage()
    const cellRegs = memoryRegistrations.filter(
      r =>
        isStoreMatch(r.store_id, storeId) &&
        r.date === date &&
        (r.shift_id === shiftId || standardizeShiftId(r.shift_id, r.shift_name) === shiftId) &&
        r.status === 'PENDING'
    )

    let approvedCount = 0
    const idsToApprove: string[] = []
    const effectiveEmployees = getEffectiveEmployees()

    cellRegs.forEach(reg => {
      reg.status = 'APPROVED'
      idsToApprove.push(reg.id)
      approvedCount++

      const emp = effectiveEmployees.find(e => isEmployeeMatch(e, reg))
      const already = mockSchedules.find(
        s => s.employee_id === reg.employee_id && s.date === reg.date && s.shift_id === reg.shift_id
      )
      if (!already) {
        addSchedule(
          storeId,
          reg.employee_id,
          reg.shift_id,
          reg.date,
          reg.notes || 'Duyệt theo ô ca',
          'draft',
          reg.position_id || emp?.position_id
        )
      }
    })

    if (idsToApprove.length > 0 && typeof window !== 'undefined') {
      fetch('/api/shifts/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_ids: idsToApprove,
          action: 'approve',
          approver_name: approverName,
        }),
      }).catch(err => console.warn('[ShiftRegistrationService] approveCell error:', err))
    }

    return { approvedCount }
  }

  /**
   * Quản lý từ chối toàn bộ ca PENDING trong 1 ô (Ngày + Khung ca)
   */
  static rejectCell(storeId: string, date: string, shiftId: string): { rejectedCount: number } {
    initStorage()
    const cellRegs = memoryRegistrations.filter(
      r =>
        isStoreMatch(r.store_id, storeId) &&
        r.date === date &&
        (r.shift_id === shiftId || standardizeShiftId(r.shift_id, r.shift_name) === shiftId) &&
        r.status === 'PENDING'
    )

    let rejectedCount = 0
    const idsToReject: string[] = []

    cellRegs.forEach(reg => {
      reg.status = 'REJECTED'
      idsToReject.push(reg.id)
      rejectedCount++
    })

    if (idsToReject.length > 0 && typeof window !== 'undefined') {
      fetch('/api/shifts/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          registration_ids: idsToReject,
          action: 'reject',
        }),
      }).catch(err => console.warn('[ShiftRegistrationService] rejectCell error:', err))
    }

    return { rejectedCount }
  }

  /**
   * Thống kê độ phủ ca (Staffing Coverage Rate)
   * Tỷ lệ nhân viên đã nộp lịch rảnh cho tuần tới (Loại CEO)
   */
  static getCoverageRate(storeId: string, weekStartDate: string): CoverageRateResult {
    initStorage()

    const weekRegistrations = memoryRegistrations.filter(
      r => isStoreMatch(r.store_id, storeId) && r.week_start_date === weekStartDate && r.status !== 'REJECTED'
    )

    // Tập hợp ID, mã NV và họ tên của các nhân sự đã nộp lịch rảnh
    const submittedIds = new Set<string>()
    const submittedCodes = new Set<string>()
    const submittedNames = new Set<string>()

    weekRegistrations.forEach(r => {
      if (r.employee_id) submittedIds.add(r.employee_id)
      const empCode = r.employee_code || (r.employee_id?.startsWith('emp-') ? r.employee_id.replace('emp-', '').toUpperCase() : '')
      if (empCode) submittedCodes.add(empCode)
      const empName = r.employee_name
      if (empName) submittedNames.add(empName.toLowerCase().trim())
    })

    const effectiveEmployees = getEffectiveEmployees()

    // Lọc nhân sự chi nhánh đang active (chỉ tính nhân sự chính thức của cửa hàng này, LOẠI CEO)
    const storeStaff = effectiveEmployees.filter(emp => {
      if (emp.status !== 'active') return false
      if (emp.role === 'ceo') return false
      // Nhân sự trực thuộc cửa hàng này
      if (isStoreMatch(emp.store_id, storeId)) return true
      // Hoặc nhân sự từ chi nhánh khác đã nộp đăng ký hỗ trợ tại chi nhánh này
      if (
        submittedIds.has(emp.id) ||
        (emp.employee_code && emp.employee_code !== '-' && submittedCodes.has(emp.employee_code.toUpperCase())) ||
        submittedNames.has(emp.full_name.toLowerCase().trim())
      ) {
        return true
      }
      return false
    })

    const submittedEmployees: Array<{ id: string; name: string; code: string; phone?: string; shiftCount?: number }> = []
    const missingEmployees: Array<{ id: string; name: string; code: string; phone?: string; role?: string; positionName?: string }> = []

    storeStaff.forEach(emp => {
      const empRegs = weekRegistrations.filter(r => isEmployeeMatch(emp, r))
      const isSubmitted = empRegs.length > 0 || submittedIds.has(emp.id)
      const pos = mockPositions.find(p => p.id === emp.position_id)

      if (isSubmitted) {
        submittedEmployees.push({
          id: emp.id,
          name: emp.full_name,
          code: emp.employee_code,
          phone: emp.phone,
          shiftCount: empRegs.length,
        })
      } else {
        missingEmployees.push({
          id: emp.id,
          name: emp.full_name,
          code: emp.employee_code,
          phone: emp.phone,
          role: emp.role === 'store_manager' ? 'Quản lý' : emp.role === 'shift_leader' ? 'Trưởng ca' : 'Nhân viên',
          positionName: pos?.name || 'Nhân viên F&B',
        })
      }
    })

    // Bổ sung nhân sự đã đăng ký nhưng chưa nằm trong danh sách chi nhánh hiện tại
    weekRegistrations.forEach(r => {
      const rName = r.employee_name
      const rCode = extractRegCode(r)
      const alreadyIncluded = submittedEmployees.some(
        e => e.id === r.employee_id || (rCode && e.code.toUpperCase() === rCode) || (rName && e.name.toLowerCase().trim() === rName.toLowerCase().trim())
      )
      if (!alreadyIncluded && rName) {
        const empRegs = weekRegistrations.filter(
          reg => reg.employee_id === r.employee_id || (rName && reg.employee_name?.toLowerCase().trim() === rName.toLowerCase().trim())
        )
        submittedEmployees.push({
          id: r.employee_id,
          name: rName,
          code: rCode || '',
          phone: '',
          shiftCount: empRegs.length,
        })
      }
    })

    submittedEmployees.sort((a, b) => (b.shiftCount || 0) - (a.shiftCount || 0))

    const totalEmployees = submittedEmployees.length + missingEmployees.length
    const submittedCount = submittedEmployees.length
    const ratePercent = totalEmployees > 0 ? Math.round((submittedCount / totalEmployees) * 100) : 0

    return {
      totalEmployees,
      submittedCount,
      ratePercent,
      submittedEmployees,
      missingEmployees,
    }
  }

  /**
   * Tính toán ma trận nhiệt thời gian rảnh (Availability Heatmap) 7 ngày x 3 ca
   */
  static getHeatmapData(storeId: string, weekStartDate: string): HeatmapCell[] {
    initStorage()

    const standardShifts = [
      { id: 'shift-001', name: 'Ca Sáng', time: '08:30 - 12:00' },
      { id: 'shift-002', name: 'Ca Trưa', time: '12:00 - 17:00' },
      { id: 'shift-003', name: 'Ca Tối', time: '17:00 - 22:00' },
    ]

    const dayLabels = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
    const mondayDate = new Date(`${weekStartDate}T00:00:00`)
    const cells: HeatmapCell[] = []

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const curDate = new Date(mondayDate)
      curDate.setDate(mondayDate.getDate() + dayOffset)
      const dateStr = formatDateString(curDate)
      const dateFormatted = `${curDate.getDate()}/${curDate.getMonth() + 1}`

      standardShifts.forEach(shift => {
        const regs = memoryRegistrations.filter(
          r =>
            isStoreMatch(r.store_id, storeId) &&
            r.date === dateStr &&
            (r.shift_id === shift.id || standardizeShiftId(r.shift_id, r.shift_name) === shift.id) &&
            r.status !== 'REJECTED'
        )

        const effectiveEmployees = getEffectiveEmployees()
        const registeredEmployees: HeatmapEmployeeItem[] = regs.map(reg => {
          const regCode = extractRegCode(reg)
          const regName = reg.employee_name || ''
          const emp = effectiveEmployees.find(e => isEmployeeMatch(e, reg))
          const pos = mockPositions.find(p => p.id === (reg.position_id || emp?.position_id))
          return {
            id: reg.employee_id,
            registrationId: reg.id,
            name: regName || emp?.full_name || 'Nhân viên',
            code: regCode || emp?.employee_code || '',
            positionName: pos?.name || 'Nhân viên F&B',
            status: reg.status,
            notes: reg.notes,
          }
        })

        const count = regs.length
        const approvedCount = regs.filter(r => r.status === 'APPROVED').length
        const pendingCount = regs.filter(r => r.status === 'PENDING').length
        const status: 'FULL' | 'RISK' | 'EMPTY' = count >= 2 ? 'FULL' : count === 1 ? 'RISK' : 'EMPTY'

        cells.push({
          date: dateStr,
          dateLabel: `${dayLabels[dayOffset]} (${dateFormatted})`,
          dayOfWeek: dayLabels[dayOffset],
          shiftId: shift.id,
          shiftName: shift.name,
          timeRange: shift.time,
          registrations: regs,
          registeredEmployees,
          count,
          approvedCount,
          pendingCount,
          status,
        })
      })
    }

    return cells
  }

  /**
   * Bóc tách tổng hợp theo nhân viên (Tab 2: Theo Nhân Viên)
   */
  static getStaffOverview(storeId: string, weekStartDate: string): StaffRegistrationSummary[] {
    initStorage()

    const weekRegistrations = memoryRegistrations.filter(
      r => isStoreMatch(r.store_id, storeId) && r.week_start_date === weekStartDate && r.status !== 'REJECTED'
    )

    const effectiveEmployees = getEffectiveEmployees()

    // Nhân sự cửa hàng (không bao gồm CEO)
    const storeStaff = effectiveEmployees.filter(emp => {
      if (emp.status !== 'active') return false
      if (emp.role === 'ceo') return false
      return isStoreMatch(emp.store_id, storeId)
    })

    const extraStaffFromRegs: Employee[] = []
    const matchedSoFar = () => [...storeStaff, ...extraStaffFromRegs]

    weekRegistrations.forEach(r => {
      if (!matchedSoFar().some(e => isEmployeeMatch(e, r))) {
        const foundEmp = effectiveEmployees.find(e => isEmployeeMatch(e, r))
        if (foundEmp && foundEmp.status === 'active' && foundEmp.role !== 'ceo') {
          extraStaffFromRegs.push(foundEmp)
        } else if (!foundEmp && r.employee_name) {
          extraStaffFromRegs.push({
            id: r.employee_id,
            org_id: 'org-001',
            store_id: storeId,
            position_id: r.position_id || 'pos-001',
            employee_code: r.employee_code || '',
            full_name: r.employee_name,
            phone: '',
            email: '',
            date_of_birth: '',
            gender: 'female',
            address: '',
            role: 'employee',
            status: 'active',
            hire_date: '2026-10-01',
            total_points: 0,
            gamification_level: 'bronze',
          })
        }
      }
    })

    const allStaff = [...storeStaff, ...extraStaffFromRegs]

    return allStaff
      .map(emp => {
        const empRegs = weekRegistrations.filter(r => isEmployeeMatch(emp, r))

        const hasSubmitted = empRegs.length > 0
        const registeredCount = empRegs.length
        const approvedCount = empRegs.filter(r => r.status === 'APPROVED').length
        const pendingCount = empRegs.filter(r => r.status === 'PENDING').length

        // Ước tính giờ công chuẩn Homies F&B: Ca Sáng 3.5h (08:30-12:00), Ca Trưa 5h, Ca Tối 5h
        const totalHours = empRegs.reduce((acc, r) => {
          if (r.shift_id === 'shift-001') return acc + 3.5
          if (r.shift_id === 'shift-002') return acc + 5.0
          if (r.shift_id === 'shift-003') return acc + 5.0
          return acc + 4.0
        }, 0)

        const days: Record<string, StaffDayShift[]> = {}
        empRegs.forEach(r => {
          if (!days[r.date]) days[r.date] = []
          days[r.date].push({
            id: r.id,
            shiftId: r.shift_id,
            shiftName:
              r.shift_name ||
              (r.shift_id === 'shift-001' ? 'Ca Sáng' : r.shift_id === 'shift-002' ? 'Ca Trưa' : 'Ca Tối'),
            status: r.status,
            notes: r.notes,
          })
        })

        const pos = mockPositions.find(p => p.id === emp.position_id)

        return {
          id: emp.id,
          name: emp.full_name,
          code: emp.employee_code,
          role: emp.role === 'store_manager' ? 'Quản lý' : emp.role === 'shift_leader' ? 'Trưởng ca' : 'Nhân viên',
          positionName: pos?.name || 'Nhân viên F&B',
          phone: emp.phone,
          hasSubmitted,
          registeredCount,
          approvedCount,
          pendingCount,
          totalHours,
          days,
        }
      })
      .sort((a, b) => b.registeredCount - a.registeredCount)
  }
}
