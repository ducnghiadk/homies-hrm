import type { ScheduleShift, StaffAttribute, HourlyTrafficPattern, SchedulingConstraint } from '@/lib/mock-data-smart-schedule'
import { parseHour, getStaffingByHour, getWeeklyHours } from './shift-calculator'

// --- Types ---

export interface ValidationResult {
  isValid: boolean
  errors: ValidationItem[]
  warnings: ValidationItem[]
  passed: ValidationItem[]
}

export interface ValidationItem {
  id: string
  type: 'understaffed' | 'overtime' | 'clopening' | 'unavailable' | 'pt_hours'
  severity: 'error' | 'warning' | 'success'
  message: string
  suggestion?: string
  affectedShiftIds: string[]
  affectedHours?: number[]
  affectedEmployeeId?: string
  autoFix?: () => ScheduleShift[]
}

// --- Main Validator ---

export function validateSchedule(
  shifts: ScheduleShift[],
  staffList: StaffAttribute[],
  trafficPattern: HourlyTrafficPattern[],
  constraints: SchedulingConstraint[]
): ValidationResult {
  const errors: ValidationItem[] = []
  const warnings: ValidationItem[] = []
  const passed: ValidationItem[] = []

  // Get all unique dates
  const dates = [...new Set(shifts.map(s => s.date))].sort()

  // Rule 1: Staffing per hour
  checkStaffingLevels(shifts, dates, trafficPattern, staffList, errors, warnings, passed)

  // Rule 2: Overtime limits
  checkOvertimeLimits(shifts, staffList, constraints, errors, warnings, passed)

  // Rule 3: Clopening
  if (constraints.find(c => c.type === 'no_clopening' && c.isActive)) {
    checkClopening(shifts, staffList, errors, passed)
  }

  // Rule 4: Unavailable dates
  checkUnavailableDates(shifts, staffList, errors, passed)

  // Rule 5: Part-time hour limits
  checkPartTimeHours(shifts, staffList, errors, warnings, passed)

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    passed,
  }
}

// --- Rule Implementations ---

function checkStaffingLevels(
  shifts: ScheduleShift[],
  dates: string[],
  trafficPattern: HourlyTrafficPattern[],
  staffList: StaffAttribute[],
  errors: ValidationItem[],
  _warnings: ValidationItem[],
  passed: ValidationItem[]
) {
  let hasUnderstaffed = false

  for (const date of dates) {
    const d = new Date(date)
    const dayOfWeek = d.getDay()
    const staffing = getStaffingByHour(shifts, date, trafficPattern, dayOfWeek)

    const underHours = staffing.filter(h => h.status === 'under')
    if (underHours.length > 0) {
      hasUnderstaffed = true
      for (const uh of underHours) {
        const shiftsDuringHour = shifts.filter(s => {
          if (s.date !== date) return false
          return parseHour(s.startTime) <= uh.hour && parseHour(s.endTime) > uh.hour
        })

        // Find PT staff not working this hour to suggest
        const workingIds = shiftsDuringHour.map(s => s.employeeId)
        const availablePT = staffList.filter(
          s => s.type === 'parttime' && !workingIds.includes(s.employeeId) &&
               !s.unavailableDates?.includes(date)
        )

        const autoFix = availablePT.length > 0 ? () => {
          const pt = availablePT[0]
          // Find existing shift for this PT on this day, extend it, or create new
          const existingShift = shifts.find(s => s.employeeId === pt.employeeId && s.date === date)
          const newShifts = [...shifts]
          if (existingShift) {
            // Extend to cover this hour
            const idx = newShifts.findIndex(s => s.id === existingShift.id)
            const start = Math.min(parseHour(existingShift.startTime), uh.hour)
            const end = Math.max(parseHour(existingShift.endTime), uh.hour + 1)
            newShifts[idx] = {
              ...existingShift,
              startTime: `${start.toString().padStart(2, '0')}:00`,
              endTime: `${end.toString().padStart(2, '0')}:00`,
            }
          } else {
            // Create new 2-hour shift
            newShifts.push({
              id: `sh-fix-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              employeeId: pt.employeeId,
              employeeName: pt.name,
              date,
              startTime: `${uh.hour.toString().padStart(2, '0')}:00`,
              endTime: `${Math.min(uh.hour + 2, 23).toString().padStart(2, '0')}:00`,
              position: pt.position,
              isOvertime: false,
              breakMinutes: 0,
            })
          }
          return newShifts
        } : undefined

        errors.push({
          id: `understaffed-${date}-${uh.hour}`,
          type: 'understaffed',
          severity: 'error',
          message: `${uh.hour}h-${uh.hour + 1}h: Chỉ có ${uh.count} người, cần ${uh.required} (thiếu ${uh.required - uh.count})`,
          suggestion: availablePT.length > 0
            ? `Cho ${availablePT[0].name} bắt đầu từ ${uh.hour}h`
            : 'Cần thêm nhân viên cho khung giờ này',
          affectedShiftIds: shiftsDuringHour.map(s => s.id),
          affectedHours: [uh.hour],
          autoFix,
        })
      }
    }
  }

  if (!hasUnderstaffed) {
    passed.push({
      id: 'staffing-ok',
      type: 'understaffed',
      severity: 'success',
      message: 'Mỗi khung giờ đều đủ nhân sự',
      affectedShiftIds: [],
    })
  }
}

function checkOvertimeLimits(
  shifts: ScheduleShift[],
  staffList: StaffAttribute[],
  constraints: SchedulingConstraint[],
  errors: ValidationItem[],
  warnings: ValidationItem[],
  passed: ValidationItem[]
) {
  const maxOT = constraints.find(c => c.type === 'max_overtime' && c.isActive)
  const maxHours = maxOT?.value || 48
  let hasIssue = false

  for (const staff of staffList) {
    const hours = getWeeklyHours(shifts, staff.employeeId)
    const employeeShifts = shifts.filter(s => s.employeeId === staff.employeeId)

    if (hours > maxHours) {
      hasIssue = true
      // Auto-fix: find lowest-traffic day and remove that shift
      const autoFix = () => {
        const empShifts = shifts.filter(s => s.employeeId === staff.employeeId)
        if (empShifts.length === 0) return shifts
        // Remove last shift
        const toRemove = empShifts[empShifts.length - 1]
        return shifts.filter(s => s.id !== toRemove.id)
      }

      errors.push({
        id: `ot-error-${staff.employeeId}`,
        type: 'overtime',
        severity: 'error',
        message: `${staff.name}: ${hours.toFixed(1)} giờ/tuần, vượt giới hạn ${maxHours} giờ`,
        suggestion: 'Bỏ bớt 1 ca hoặc chuyển cho nhân viên khác',
        affectedShiftIds: employeeShifts.map(s => s.id),
        affectedEmployeeId: staff.employeeId,
        autoFix,
      })
    } else if (hours > 40 && hours <= maxHours) {
      hasIssue = true
      warnings.push({
        id: `ot-warn-${staff.employeeId}`,
        type: 'overtime',
        severity: 'warning',
        message: `${staff.name}: ${hours.toFixed(1)} giờ/tuần, có ${(hours - 40).toFixed(1)} giờ OT`,
        suggestion: 'Giảm bớt nếu muốn tiết kiệm chi phí OT',
        affectedShiftIds: employeeShifts.map(s => s.id),
        affectedEmployeeId: staff.employeeId,
      })
    }
  }

  if (!hasIssue) {
    passed.push({
      id: 'ot-ok',
      type: 'overtime',
      severity: 'success',
      message: 'Không có nhân viên vượt giờ làm',
      affectedShiftIds: [],
    })
  }
}

function checkClopening(
  shifts: ScheduleShift[],
  staffList: StaffAttribute[],
  errors: ValidationItem[],
  passed: ValidationItem[]
) {
  let hasClopening = false

  const shiftsByEmp = shifts.reduce((acc, s) => {
    if (!acc[s.employeeId]) acc[s.employeeId] = []
    acc[s.employeeId].push(s)
    return acc
  }, {} as Record<string, ScheduleShift[]>)

  Object.entries(shiftsByEmp).forEach(([empId, empShifts]) => {
    empShifts.sort((a, b) =>
      new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime()
    )

    for (let i = 0; i < empShifts.length - 1; i++) {
      const current = empShifts[i]
      const next = empShifts[i + 1]

      // Check if next day
      const currentDate = new Date(current.date)
      const nextDate = new Date(next.date)
      const diffDays = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)

      if (diffDays === 1) {
        const endHour = parseHour(current.endTime)
        const startHour = parseHour(next.startTime)

        if (endHour >= 22 && startHour <= 8) {
          hasClopening = true
          const staff = staffList.find(s => s.employeeId === empId)

          // Auto-fix: find someone else to swap with
          const autoFix = () => {
            // Find another employee who works morning next day and evening today
            const swapCandidates = staffList.filter(s =>
              s.employeeId !== empId &&
              !s.unavailableDates?.includes(next.date)
            )
            if (swapCandidates.length === 0) return shifts

            const candidate = swapCandidates[0]
            return shifts.map(s => {
              if (s.id === next.id) {
                return { ...s, employeeId: candidate.employeeId, employeeName: candidate.name }
              }
              return s
            })
          }

          errors.push({
            id: `clopening-${empId}-${current.date}`,
            type: 'clopening',
            severity: 'error',
            message: `${staff?.name || empId}: Ca ${current.endTime} hôm nay + ca ${next.startTime} ngày mai = Clopening`,
            suggestion: 'Đổi ca sáng ngày mai cho nhân viên khác',
            affectedShiftIds: [current.id, next.id],
            affectedEmployeeId: empId,
            autoFix,
          })
        }
      }
    }
  })

  if (!hasClopening) {
    passed.push({
      id: 'clopening-ok',
      type: 'clopening',
      severity: 'success',
      message: 'Không có clopening (đóng cửa → mở cửa)',
      affectedShiftIds: [],
    })
  }
}

function checkUnavailableDates(
  shifts: ScheduleShift[],
  staffList: StaffAttribute[],
  errors: ValidationItem[],
  passed: ValidationItem[]
) {
  let hasIssue = false

  for (const shift of shifts) {
    const staff = staffList.find(s => s.employeeId === shift.employeeId)
    if (staff?.unavailableDates?.includes(shift.date)) {
      hasIssue = true
      errors.push({
        id: `unavail-${shift.id}`,
        type: 'unavailable',
        severity: 'error',
        message: `${staff.name} đã đăng ký nghỉ ngày ${shift.date}`,
        suggestion: 'Chuyển ca cho nhân viên khác',
        affectedShiftIds: [shift.id],
        affectedEmployeeId: shift.employeeId,
      })
    }
  }

  if (!hasIssue) {
    passed.push({
      id: 'unavail-ok',
      type: 'unavailable',
      severity: 'success',
      message: 'Không xếp ca cho ngày nghỉ phép',
      affectedShiftIds: [],
    })
  }
}

function checkPartTimeHours(
  shifts: ScheduleShift[],
  staffList: StaffAttribute[],
  errors: ValidationItem[],
  _warnings: ValidationItem[],
  passed: ValidationItem[]
) {
  let hasIssue = false

  const ptStaff = staffList.filter(s => s.type === 'parttime')
  for (const staff of ptStaff) {
    const hours = getWeeklyHours(shifts, staff.employeeId)
    if (hours > staff.maxHoursPerWeek) {
      hasIssue = true
      const empShifts = shifts.filter(s => s.employeeId === staff.employeeId)

      // Auto-fix: shorten last shift
      const autoFix = () => {
        const sorted = [...empShifts].sort(
          (a, b) => new Date(`${b.date}T${b.startTime}`).getTime() - new Date(`${a.date}T${a.startTime}`).getTime()
        )
        const excessHours = hours - staff.maxHoursPerWeek
        const lastShift = sorted[0]
        const currentEnd = parseHour(lastShift.endTime)
        const newEnd = Math.max(parseHour(lastShift.startTime) + 1, currentEnd - Math.ceil(excessHours))

        return shifts.map(s => {
          if (s.id === lastShift.id) {
            return { ...s, endTime: `${newEnd.toString().padStart(2, '0')}:00` }
          }
          return s
        })
      }

      errors.push({
        id: `pt-hours-${staff.employeeId}`,
        type: 'pt_hours',
        severity: 'error',
        message: `${staff.name} (Part-time): ${hours.toFixed(1)} giờ/tuần, vượt giới hạn ${staff.maxHoursPerWeek} giờ`,
        suggestion: `Cắt giảm ${(hours - staff.maxHoursPerWeek).toFixed(1)} giờ`,
        affectedShiftIds: empShifts.map(s => s.id),
        affectedEmployeeId: staff.employeeId,
        autoFix,
      })
    }
  }

  if (!hasIssue) {
    passed.push({
      id: 'pt-hours-ok',
      type: 'pt_hours',
      severity: 'success',
      message: 'Part-time không vượt giờ cho phép',
      affectedShiftIds: [],
    })
  }
}
