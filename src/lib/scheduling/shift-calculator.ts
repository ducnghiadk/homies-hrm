import type { ScheduleShift, StaffAttribute, HourlyTrafficPattern, CostBreakdown } from '@/lib/mock-data-smart-schedule'

// --- Types ---

export interface HourlyStaffing {
  hour: number         // 7-23
  count: number        // Current staff count
  required: number     // From traffic pattern
  status: 'ok' | 'under' | 'over'
}

export interface DragContext {
  shiftId: string
  originalStart: number
  originalEnd: number
  originalEmployeeId: string
  dragType: 'move' | 'resize-end' | 'swap-employee'
  currentHour: number
  currentEmployeeId: string
  isValid: boolean
  invalidReason?: string
}

// --- Functions ---

/** Parse "HH:mm" → hour number */
export function parseHour(time: string): number {
  return parseInt(time.split(':')[0], 10)
}

/** Hour number → "HH:00" */
export function formatHour(hour: number): string {
  return `${hour.toString().padStart(2, '0')}:00`
}

/** Calculate hours between two "HH:mm" strings */
export function calculateShiftHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh + em / 60) - (sh + sm / 60)
}

/** Get staffing levels per hour for a specific date */
export function getStaffingByHour(
  shifts: ScheduleShift[],
  date: string,
  trafficPattern: HourlyTrafficPattern[],
  dayOfWeek: number
): HourlyStaffing[] {
  const dayShifts = shifts.filter(s => s.date === date)

  return Array.from({ length: 16 }, (_, i) => {
    const hour = 7 + i
    // Count staff working during this hour
    const count = dayShifts.filter(s => {
      const start = parseHour(s.startTime)
      const end = parseHour(s.endTime)
      return start <= hour && end > hour
    }).length

    const required = trafficPattern.find(
      p => p.dayOfWeek === dayOfWeek && p.hour === hour
    )?.staffNeeded || 2

    return {
      hour,
      count,
      required,
      status: count >= required ? (count > required + 1 ? 'over' : 'ok') : 'under',
    }
  })
}

/** Get total weekly hours for an employee */
export function getWeeklyHours(shifts: ScheduleShift[], employeeId: string): number {
  return shifts
    .filter(s => s.employeeId === employeeId)
    .reduce((total, s) => {
      const hours = calculateShiftHours(s.startTime, s.endTime) - (s.breakMinutes / 60)
      return total + hours
    }, 0)
}

/** Recalculate cost breakdown after edits */
export function recalculateCost(shifts: ScheduleShift[], staffList: StaffAttribute[]): CostBreakdown {
  const byEmployee: CostBreakdown['byEmployee'] = []
  const byPosition: Record<string, number> = {}
  let totalCost = 0
  let totalHours = 0

  const shiftsByEmp = shifts.reduce((acc, s) => {
    if (!acc[s.employeeId]) acc[s.employeeId] = []
    acc[s.employeeId].push(s)
    return acc
  }, {} as Record<string, ScheduleShift[]>)

  Object.entries(shiftsByEmp).forEach(([empId, empShifts]) => {
    const staff = staffList.find(s => s.employeeId === empId)
    if (!staff) return

    let empHours = 0
    let empCost = 0

    empShifts.forEach(s => {
      const h = calculateShiftHours(s.startTime, s.endTime) - (s.breakMinutes / 60)
      const cost = h * staff.hourlyRate
      empHours += h
      empCost += cost
      byPosition[s.position] = (byPosition[s.position] || 0) + cost
    })

    totalHours += empHours
    totalCost += empCost
    byEmployee.push({
      employeeId: empId,
      name: staff.name,
      hours: empHours,
      cost: empCost,
      isOvertime: empHours > staff.maxHoursPerWeek,
    })
  })

  return { byEmployee, byPosition, totalCost, totalHours }
}

/** Check if a drop position is valid */
export function isDropValid(
  shifts: ScheduleShift[],
  shiftId: string,
  targetEmployeeId: string,
  targetStartHour: number,
  targetEndHour: number,
  staffList: StaffAttribute[],
  date: string
): { valid: boolean; reason?: string } {
  // 1. Bounds check
  if (targetStartHour < 7 || targetEndHour > 23) {
    return { valid: false, reason: 'Ngoài giờ hoạt động (7h-23h)' }
  }

  // 2. Minimum 1 hour
  if (targetEndHour - targetStartHour < 1) {
    return { valid: false, reason: 'Ca tối thiểu 1 giờ' }
  }

  // 3. Check overlap with existing shifts of target employee
  const targetShifts = shifts.filter(
    s => s.employeeId === targetEmployeeId && s.date === date && s.id !== shiftId
  )
  for (const existing of targetShifts) {
    const existStart = parseHour(existing.startTime)
    const existEnd = parseHour(existing.endTime)
    if (targetStartHour < existEnd && targetEndHour > existStart) {
      return { valid: false, reason: `Trùng ca với ${existing.employeeName}` }
    }
  }

  // 4. Check employee availability
  const staff = staffList.find(s => s.employeeId === targetEmployeeId)
  if (!staff) return { valid: false, reason: 'Nhân viên không tồn tại' }
  if (staff.unavailableDates?.includes(date)) {
    return { valid: false, reason: `${staff.name} đã đăng ký nghỉ ngày này` }
  }

  return { valid: true }
}

/** Convert mouse X coordinate to hour (snap-to-grid) */
export function mouseXToHour(clientX: number, gridRect: DOMRect): number {
  const hourWidth = gridRect.width / 16 // 16 hours: 7h-23h
  const rawHour = 7 + (clientX - gridRect.left) / hourWidth
  return Math.max(7, Math.min(23, Math.round(rawHour)))
}
