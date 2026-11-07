import { getMondayOfDate, formatDateString } from '@/lib/mock-data-registration-weeks'
import { addSchedule, mockEmployees, mockPositions, isStoreMatch, mockSchedules } from '@/lib/mock-data'
import { savePreferences } from '@/lib/mock-data-preferences'

export interface PendingShiftRegistration {
  id: string
  employee_id: string
  store_id: string
  week_start_date: string // YYYY-MM-DD (Thứ 2)
  date: string            // YYYY-MM-DD
  shift_id: string        // shift-001, shift-002, shift-003
  position_id: string     // pos-001 (Pha chế), pos-002 (Thu ngân), ...
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
  notes?: string
}

export interface CoverageRateResult {
  totalEmployees: number
  submittedCount: number
  ratePercent: number
  submittedEmployees: Array<{ id: string; name: string; code: string; phone?: string }>
  missingEmployees: Array<{ id: string; name: string; code: string; phone?: string }>
}

export interface HeatmapCell {
  date: string
  dateLabel: string
  dayOfWeek: string // T2, T3, ... CN
  shiftId: string
  shiftName: string
  timeRange: string
  registrations: PendingShiftRegistration[]
  registeredEmployees: Array<{ id: string; name: string; code: string; positionName: string }>
  count: number
  status: 'FULL' | 'RISK' | 'EMPTY' // FULL (>= 2), RISK (1), EMPTY (0)
}

let memoryRegistrations: PendingShiftRegistration[] = []
let isInitialized = false

function seedDefaultRegistrations(): PendingShiftRegistration[] {
  const today = new Date()
  const thisMon = getMondayOfDate(today)
  const nextMon = new Date(thisMon)
  nextMon.setDate(thisMon.getDate() + 7)

  const weeks = Array.from(new Set(['2026-10-05', formatDateString(thisMon), formatDateString(nextMon)]))
  const seeded: PendingShiftRegistration[] = []

  // Store 429 (store-002) employees
  const p429Employees = [
    { id: 'f747f06f-9e95-406e-a5b5-0f6571dbfaa4', storeId: 'store-002', posId: 'pos-001' }, // Đông Duy
    { id: '2f3acef5-118f-490b-8530-d86aa164b90a', storeId: 'store-002', posId: 'pos-001' }, // Minh Lộc
    { id: 'd8b8ecd5-1e74-415b-a739-2fa6bbd81284', storeId: 'store-002', posId: 'pos-002' }, // Thanh Thiện
  ]

  // Store HBP (store-001) employees
  const pHbpEmployees = [
    { id: 'emp-bh9852', storeId: 'store-001', posId: 'pos-002' }, // Huỳnh Lê Kiều Linh (Thu ngân / Quản lý)
    { id: 'emp-nv0031', storeId: 'store-001', posId: 'pos-001' }, // Cao Văn Thắng (Pha chế)
    { id: 'emp-nv0033', storeId: 'store-001', posId: 'pos-001' }, // Nguyễn Hoài Ân (Pha chế)
    { id: 'emp-nv0027', storeId: 'store-001', posId: 'pos-002' }, // Trần Công Huy (Quản lý / Thu ngân)
    { id: 'e0000000-0000-0000-0000-000000000014', storeId: 'store-001', posId: 'pos-002' }, // Thu Phương
  ]

  const allStaff = [...p429Employees, ...pHbpEmployees]

  weeks.forEach(weekStr => {
    const mondayDate = new Date(`${weekStr}T00:00:00`)
    // 7 days from Monday to Sunday
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const curDate = new Date(mondayDate)
      curDate.setDate(mondayDate.getDate() + dayOffset)
      const dateStr = formatDateString(curDate)

      allStaff.forEach(staff => {
        // Riêng Quản lý Huỳnh Lê Kiều Linh: đăng ký ca lẻ 12:00 - 15:00 vào các ngày trong tuần
        if (staff.id === 'emp-bh9852') {
          // Thứ 3 (1), Thứ 5 (3), Thứ 6 (4), Thứ 7 (5): Ca Trưa Lẻ 12:00 - 15:00
          if ([1, 3, 4, 5].includes(dayOffset)) {
            seeded.push({
              id: `reg-seed-${weekStr}-${staff.id}-${dateStr}-shift-002`,
              employee_id: staff.id,
              store_id: staff.storeId,
              week_start_date: weekStr,
              date: dateStr,
              shift_id: 'shift-002',
              position_id: staff.posId,
              status: 'PENDING',
              created_at: new Date().toISOString(),
              notes: 'Ca Trưa Lẻ [12:00 - 15:00] (Ca lẻ)',
            })
          }
          // Thứ 2 (0), Thứ 4 (2): Ca Sáng
          if ([0, 2].includes(dayOffset)) {
            seeded.push({
              id: `reg-seed-${weekStr}-${staff.id}-${dateStr}-shift-001`,
              employee_id: staff.id,
              store_id: staff.storeId,
              week_start_date: weekStr,
              date: dateStr,
              shift_id: 'shift-001',
              position_id: staff.posId,
              status: 'PENDING',
              created_at: new Date().toISOString(),
              notes: 'Ca Sáng [08:30 - 12:00]',
            })
          }
          // Chủ Nhật (6): Ca Tối
          if (dayOffset === 6) {
            seeded.push({
              id: `reg-seed-${weekStr}-${staff.id}-${dateStr}-shift-003`,
              employee_id: staff.id,
              store_id: staff.storeId,
              week_start_date: weekStr,
              date: dateStr,
              shift_id: 'shift-003',
              position_id: staff.posId,
              status: 'PENDING',
              created_at: new Date().toISOString(),
              notes: 'Ca Tối [17:00 - 22:00]',
            })
          }
          return
        }

        // Mô phỏng nhân sự khác: Một số ca nhân viên đăng ký rảnh
        const shifts = ['shift-001', 'shift-002', 'shift-003']
        shifts.forEach((shiftId, sIdx) => {
          const isTuesdayNight = dayOffset === 1 && shiftId === 'shift-003'
          const isWednesdayMorning = dayOffset === 2 && shiftId === 'shift-001'

          if (isTuesdayNight) return // Lủng ca (0 người)
          if (isWednesdayMorning && staff.id !== p429Employees[0].id) return // Nguy cơ (1 người)

          // Ngẫu nhiên đăng ký
          const shouldRegister = (dayOffset + sIdx) % 2 === 0 || dayOffset >= 5
          if (shouldRegister) {
            seeded.push({
              id: `reg-seed-${weekStr}-${staff.id}-${dateStr}-${shiftId}`,
              employee_id: staff.id,
              store_id: staff.storeId,
              week_start_date: weekStr,
              date: dateStr,
              shift_id: shiftId,
              position_id: staff.posId,
              status: 'PENDING',
              created_at: new Date().toISOString(),
              notes: 'Rảnh ca này theo nguyện vọng',
            })
          }
        })
      })
    }
  })

  return seeded
}

function initStorage() {
  if (isInitialized) return
  isInitialized = true

  // Khởi tạo hạt giống mặc định ban đầu
  memoryRegistrations = seedDefaultRegistrations()

  // Đồng bộ từ Database máy chủ
  if (typeof window !== 'undefined') {
    fetch('/api/shifts/register?status=all')
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          const serverRegs: PendingShiftRegistration[] = json.data.map((r: Record<string, unknown>) => ({
            id: String(r.id || `reg-${Date.now()}`),
            employee_id: String(r.employee_id || ''),
            store_id: String(r.store_id || 'store-001'),
            week_start_date: String(r.week_start_date || ''),
            date: String(r.date || ''),
            shift_id: String(r.shift_id || 'shift-001'),
            position_id: String(r.position_id || 'pos-001'),
            status: (String(r.status || 'PENDING').toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED'),
            created_at: String(r.created_at || new Date().toISOString()),
            notes: r.notes ? String(r.notes) : undefined,
          }))
          if (serverRegs.length > 0) {
            memoryRegistrations = serverRegs
          }
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
   * Quản lý đồng bộ ca đăng ký từ Database máy chủ (/api/shifts/register)
   */
  static async syncRegistrationsFromServer(storeId?: string, weekStartDate?: string): Promise<PendingShiftRegistration[]> {
    if (typeof window === 'undefined') return []
    try {
      const params = new URLSearchParams()
      if (storeId) params.append('store_id', storeId)
      if (weekStartDate) params.append('week', weekStartDate)
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
          const serverIds = new Set(serverItems.map(s => s.id))
          memoryRegistrations = [
            ...memoryRegistrations.filter(r => !serverIds.has(r.id)),
            ...serverItems,
          ]
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

    pendingList.forEach(reg => {
      const emp = mockEmployees.find(e => e.id === reg.employee_id)
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
    return { approvedCount, skippedCount }
  }

  /**
   * Hủy/Từ chối một ca đăng ký
   */
  static rejectRegistration(id: string): boolean {
    initStorage()
    const target = memoryRegistrations.find(r => r.id === id)
    if (!target) return false
    target.status = 'REJECTED'
    persistStorage()
    return true
  }

  /**
   * Thống kê độ phủ ca (Staffing Coverage Rate)
   * Tỷ lệ nhân viên đã nộp lịch rảnh cho tuần tới
   */
  static getCoverageRate(storeId: string, weekStartDate: string): CoverageRateResult {
    initStorage()

    // Lọc nhân sự chi nhánh (bao gồm nhân sự hỗ trợ / floating staff)
    const storeStaff = mockEmployees.filter(emp => {
      if (emp.status !== 'active') return false
      return (
        isStoreMatch(emp.store_id, storeId) ||
        emp.allowed_store_ids?.some(id => isStoreMatch(id, storeId)) ||
        emp.secondary_store_ids?.some(id => isStoreMatch(id, storeId))
      )
    })

    const weekRegistrations = memoryRegistrations.filter(
      r => isStoreMatch(r.store_id, storeId) && r.week_start_date === weekStartDate && r.status !== 'REJECTED'
    )

    const submittedIds = new Set(weekRegistrations.map(r => r.employee_id))

    const submittedEmployees: Array<{ id: string; name: string; code: string; phone?: string }> = []
    const missingEmployees: Array<{ id: string; name: string; code: string; phone?: string }> = []

    storeStaff.forEach(emp => {
      const info = {
        id: emp.id,
        name: emp.full_name,
        code: emp.employee_code,
        phone: emp.phone,
      }
      if (submittedIds.has(emp.id)) {
        submittedEmployees.push(info)
      } else {
        missingEmployees.push(info)
      }
    })

    const totalEmployees = storeStaff.length
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
            r.shift_id === shift.id &&
            r.status !== 'REJECTED'
        )

        const registeredEmployees = regs.map(reg => {
          const emp = mockEmployees.find(e => e.id === reg.employee_id)
          const pos = mockPositions.find(p => p.id === (reg.position_id || emp?.position_id))
          return {
            id: reg.employee_id,
            name: emp?.full_name || 'Nhân viên',
            code: emp?.employee_code || '',
            positionName: pos?.name || 'Nhân viên F&B',
          }
        })

        const count = regs.length
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
          status,
        })
      })
    }

    return cells
  }
}
