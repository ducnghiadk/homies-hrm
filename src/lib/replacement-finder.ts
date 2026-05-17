// =============================================
// HRM Trà Sữa 🧋 — Replacement Finder
// Find available replacements for leave requests
// =============================================

import {
  mockEmployees, mockSchedules, mockShifts, mockPositions,
  getShiftById,
  type Employee, type Schedule, type Shift,
} from './mock-data'
import {
  getPreferenceForDate,
  getAllPreferencesForWeek,
  type ShiftPreference,
} from './mock-data-preferences'
import {
  mockShiftGrid, getEmployeeSchedule,
  type ShiftCell, type EmployeeScheduleEntry,
} from './mock-data-scheduling'

// ─── Types ───

export type ShiftPeriod = 'morning' | 'afternoon' | 'evening'

export interface AvailabilityResult {
  available: boolean
  source: 'registered' | 'default' | 'unavailable'
  reason?: string
}

export interface ReplacementCandidate {
  id: string
  name: string
  position: string
  positionId: string
  storeId: string
  isRegisteredAvailable: boolean
  sameStore: boolean
  samePosition: boolean
  alreadyScheduled: boolean
  scheduledShift?: string
  priority: 'high' | 'medium' | 'low'
  priorityScore: number
}

export interface AffectedShift {
  scheduleId: string
  date: string
  shiftId: string
  shiftName: string
  shiftPeriod: ShiftPeriod
  startTime: string
  endTime: string
  position: string
  positionId: string
  storeId: string
  storeName: string
}

// ─── Helper: Map shift-id to period ───

function shiftIdToPeriod(shiftId: string): ShiftPeriod {
  const shift = getShiftById(shiftId)
  if (!shift) return 'morning'
  const hour = parseInt(shift.start_time.split(':')[0], 10)
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

function periodToShiftId(period: ShiftPeriod): string {
  switch (period) {
    case 'morning': return 'shift-001'
    case 'afternoon': return 'shift-002'
    case 'evening': return 'shift-003'
  }
}

function getStoreName(storeId: string): string {
  const storeNames: Record<string, string> = {
    'store-001': 'Boba House Q.1',
    'store-002': 'Boba House Thủ Đức',
    'store-003': 'Boba House Q.3',
  }
  return storeNames[storeId] || storeId
}

function getPositionName(positionId: string): string {
  const pos = mockPositions.find(p => p.id === positionId)
  return pos?.name || positionId
}

function getWeekStart(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Monday
  const monday = new Date(d)
  monday.setDate(diff)
  return monday.toISOString().split('T')[0]
}

// ─── Function 1: isEmployeeAvailableForShift ───

export function isEmployeeAvailableForShift(
  employeeId: string,
  date: string,
  period: ShiftPeriod,
): AvailabilityResult {
  // Check preferences first
  const pref = getPreferenceForDate(employeeId, date)

  if (pref) {
    if (pref.not_available) {
      return { available: false, source: 'unavailable', reason: pref.reason || 'Đã đăng ký không thể làm' }
    }

    const isAvailable =
      (period === 'morning' && pref.morning_available) ||
      (period === 'afternoon' && pref.afternoon_available) ||
      (period === 'evening' && pref.evening_available)

    return {
      available: isAvailable,
      source: 'registered',
      reason: isAvailable ? undefined : `Không đăng ký ca ${period === 'morning' ? 'sáng' : period === 'afternoon' ? 'chiều' : 'tối'}`,
    }
  }

  // No registration → default available
  return { available: true, source: 'default' }
}

// ─── Function 2: findAvailableReplacements ───

export function findAvailableReplacements(
  date: string,
  period: ShiftPeriod,
  storeId: string,
  positionId: string,
  excludeEmployeeId: string,
): ReplacementCandidate[] {
  // Get all staff-level employees (not managers)
  const candidates = mockEmployees.filter(emp =>
    emp.id !== excludeEmployeeId &&
    emp.status === 'active' &&
    emp.position_id !== 'pos-005' && // Skip Quản lý
    emp.position_id !== 'pos-004'    // Skip Phó quản lý
  )

  const shiftId = periodToShiftId(period)

  const results: ReplacementCandidate[] = candidates.map(emp => {
    // Check availability from preferences
    const availability = isEmployeeAvailableForShift(emp.id, date, period)

    // Check if already scheduled that day+shift
    const existingSchedule = mockSchedules.find(
      s => s.employee_id === emp.id && s.date === date && s.shift_id === shiftId
    )

    // Also check the scheduling module's data
    const empSchedule = getEmployeeSchedule(emp.id)
    const alreadyInShift = empSchedule.some(
      entry => entry.date === date && shiftIdToPeriod(entry.shift_id) === period
    )

    const isScheduled = !!existingSchedule || alreadyInShift

    const sameStore = emp.store_id === storeId
    const samePosition = emp.position_id === positionId
    const isRegistered = availability.source === 'registered' && availability.available

    // Calculate priority score
    // Higher = better candidate
    let score = 0
    if (isRegistered) score += 50       // Registered as available (highest weight)
    if (sameStore) score += 30          // Same store
    if (samePosition) score += 20       // Same position
    if (availability.available) score += 10  // Generally available
    if (isScheduled) score -= 100       // Already working (strong penalty)

    let priority: 'high' | 'medium' | 'low' = 'low'
    if (score >= 80) priority = 'high'
    else if (score >= 30) priority = 'medium'

    return {
      id: emp.id,
      name: emp.full_name,
      position: getPositionName(emp.position_id),
      positionId: emp.position_id,
      storeId: emp.store_id,
      isRegisteredAvailable: isRegistered,
      sameStore,
      samePosition,
      alreadyScheduled: isScheduled,
      scheduledShift: existingSchedule
        ? getShiftById(existingSchedule.shift_id)?.name
        : alreadyInShift ? empSchedule.find(e => e.date === date)?.shift_name : undefined,
      priority,
      priorityScore: score,
    }
  })

  // Sort by score descending, filter out already-scheduled
  return results
    .filter(r => !r.alreadyScheduled)
    .sort((a, b) => b.priorityScore - a.priorityScore)
}

// ─── Function 3: getAffectedShifts ───

export function getAffectedShifts(
  employeeId: string,
  startDate: string,
  endDate: string,
): AffectedShift[] {
  const employee = mockEmployees.find(e => e.id === employeeId)
  if (!employee) return []

  const start = new Date(startDate)
  const end = new Date(endDate)
  const results: AffectedShift[] = []

  // Check main schedule data (mock-data.ts)
  mockSchedules.forEach(schedule => {
    const scheduleDate = new Date(schedule.date)
    if (
      schedule.employee_id === employeeId &&
      scheduleDate >= start &&
      scheduleDate <= end
    ) {
      const shift = getShiftById(schedule.shift_id)
      if (shift) {
        results.push({
          scheduleId: schedule.id,
          date: schedule.date,
          shiftId: schedule.shift_id,
          shiftName: shift.name,
          shiftPeriod: shiftIdToPeriod(schedule.shift_id),
          startTime: shift.start_time,
          endTime: shift.end_time,
          position: getPositionName(employee.position_id),
          positionId: employee.position_id,
          storeId: schedule.store_id,
          storeName: getStoreName(schedule.store_id),
        })
      }
    }
  })

  // Also check scheduling module data (mock-data-scheduling.ts)
  const empSchedule = getEmployeeSchedule(employeeId)
  empSchedule.forEach(entry => {
    const entryDate = new Date(entry.date)
    if (entryDate >= start && entryDate <= end) {
      // Avoid duplicates (same date + same period)
      const period = shiftIdToPeriod(entry.shift_id)
      const exists = results.some(r => r.date === entry.date && r.shiftPeriod === period)
      if (!exists) {
        results.push({
          scheduleId: `sch-${entry.date}-${employeeId}`,
          date: entry.date,
          shiftId: entry.shift_id,
          shiftName: entry.shift_name,
          shiftPeriod: period,
          startTime: entry.start_time,
          endTime: entry.end_time,
          position: getPositionName(employee.position_id),
          positionId: employee.position_id,
          storeId: employee.store_id,
          storeName: getStoreName(employee.store_id),
        })
      }
    }
  })

  // Sort by date then time
  results.sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date)
    if (dateCmp !== 0) return dateCmp
    return a.startTime.localeCompare(b.startTime)
  })

  return results
}
