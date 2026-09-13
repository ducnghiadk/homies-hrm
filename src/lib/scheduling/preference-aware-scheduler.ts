// =============================================
// Preference-Aware Scheduler Service
// =============================================
// Tích hợp ShiftPreferences vào Smart Schedule Generator

import { format, addDays, startOfWeek } from 'date-fns'
import type { 
  ScheduleShift, StaffAttribute, ScheduleResult,
  Warning
} from '../mock-data-smart-schedule'
import { 
  getAllPreferencesForWeek,
  type ShiftPreference 
} from '../mock-data-preferences'

// ─── Types ───────────────────────────────────

export interface PreferenceMatch {
  employeeId: string
  date: string
  shiftSlot: 'morning' | 'afternoon' | 'evening'
  preference: 'preferred' | 'accepted' | 'not_preferred' | 'unavailable'
  reason?: string
}

export interface PreferenceStats {
  totalShifts: number
  preferredCount: number
  acceptedCount: number
  notPreferredCount: number
  unavailableCount: number
  matchRate: number // percentage
}

export interface PreferenceAwareResult extends ScheduleResult {
  preferenceStats: PreferenceStats
  preferenceMatches: PreferenceMatch[]
}

// ─── Shift Slot Definitions ──────────────────

const SHIFT_SLOTS = {
  morning: { start: 7, end: 14, label: 'Sáng' },
  afternoon: { start: 14, end: 20, label: 'Chiều' },
  evening: { start: 20, end: 24, label: 'Tối' },
} as const

// ─── Helper Functions ────────────────────────

/** Determine which slot a shift falls into based on start time */
function getShiftSlot(shift: ScheduleShift): 'morning' | 'afternoon' | 'evening' {
  const startHour = parseInt(shift.startTime.split(':')[0])
  if (startHour < 14) return 'morning'
  if (startHour < 20) return 'afternoon'
  return 'evening'
}

/** Map shift to preference slot */
function mapShiftToPreferenceSlot(shift: ScheduleShift): 'morning' | 'afternoon' | 'evening' {
  return getShiftSlot(shift)
}

/** Get week start date string for preference lookup */
export function getWeekStartStr(date: Date): string {
  const monday = startOfWeek(date, { weekStartsOn: 1 })
  return format(monday, 'yyyy-MM-dd')
}

// ─── Core Functions ──────────────────────────

/**
 * Get all submitted preferences for the target week
 */
export function getWeekPreferences(weekStart: Date): Map<string, ShiftPreference> {
  const weekStartStr = getWeekStartStr(weekStart)
  const prefs = getAllPreferencesForWeek(weekStartStr)
  
  // Create a map for quick lookup: `${employeeId}-${date}` → preference
  const prefMap = new Map<string, ShiftPreference>()
  prefs.forEach(p => {
    const key = `${p.user_id}-${p.date}`
    prefMap.set(key, p)
  })
  
  return prefMap
}

/**
 * Check preference match for a single shift
 */
export function checkPreferenceMatch(
  shift: ScheduleShift,
  prefMap: Map<string, ShiftPreference>
): PreferenceMatch {
  const key = `${shift.employeeId}-${shift.date}`
  const pref = prefMap.get(key)
  
  const slot = mapShiftToPreferenceSlot(shift)
  
  if (!pref) {
    // No preference submitted - assume accepted
    return {
      employeeId: shift.employeeId,
      date: shift.date,
      shiftSlot: slot,
      preference: 'accepted',
      reason: 'Không có đăng ký mong muốn'
    }
  }
  
  if (pref.not_available) {
    return {
      employeeId: shift.employeeId,
      date: shift.date,
      shiftSlot: slot,
      preference: 'unavailable',
      reason: pref.reason || 'Đã đăng ký nghỉ'
    }
  }
  
  // Check if shift slot matches preference
  const slotAvailable = {
    morning: pref.morning_available,
    afternoon: pref.afternoon_available,
    evening: pref.evening_available,
  }
  
  if (slotAvailable[slot]) {
    return {
      employeeId: shift.employeeId,
      date: shift.date,
      shiftSlot: slot,
      preference: 'preferred',
      reason: `Ca ${SHIFT_SLOTS[slot].label} phù hợp với mong muốn`
    }
  }
  
  // Check if any slot is available (fallback)
  const anyAvailable = slotAvailable.morning || slotAvailable.afternoon || slotAvailable.evening
  if (!anyAvailable) {
    return {
      employeeId: shift.employeeId,
      date: shift.date,
      shiftSlot: slot,
      preference: 'unavailable',
      reason: 'Đăng ký không có ca nào phù hợp'
    }
  }
  
  return {
    employeeId: shift.employeeId,
    date: shift.date,
    shiftSlot: slot,
    preference: 'not_preferred',
    reason: `Đăng ký ca ${SHIFT_SLOTS[slot].label} nhưng chỉ rảnh ca khác`
  }
}

/**
 * Calculate preference statistics for a schedule
 */
export function calculatePreferenceStats(
  shifts: ScheduleShift[],
  prefMap: Map<string, ShiftPreference>
): { stats: PreferenceStats; matches: PreferenceMatch[] } {
  const matches = shifts.map(shift => checkPreferenceMatch(shift, prefMap))
  
  const stats: PreferenceStats = {
    totalShifts: matches.length,
    preferredCount: matches.filter(m => m.preference === 'preferred').length,
    acceptedCount: matches.filter(m => m.preference === 'accepted').length,
    notPreferredCount: matches.filter(m => m.preference === 'not_preferred').length,
    unavailableCount: matches.filter(m => m.preference === 'unavailable').length,
    matchRate: 0,
  }
  
  // Calculate match rate (preferred + accepted) / total
  const matchedCount = stats.preferredCount + stats.acceptedCount
  stats.matchRate = stats.totalShifts > 0 
    ? Math.round((matchedCount / stats.totalShifts) * 100) 
    : 0
  
  return { stats, matches }
}

/**
 * Generate preference violations warnings
 */
export function generatePreferenceWarnings(
  matches: PreferenceMatch[]
): Warning[] {
  const warnings: Warning[] = []
  
  // Group by employee
  const byEmployee = new Map<string, PreferenceMatch[]>()
  matches.forEach(m => {
    const existing = byEmployee.get(m.employeeId) || []
    existing.push(m)
    byEmployee.set(m.employeeId, existing)
  })
  
  byEmployee.forEach((empMatches, empId) => {
    // Check for unavailable violations
    const unavailable = empMatches.filter(m => m.preference === 'unavailable')
    if (unavailable.length > 0) {
      warnings.push({
        id: `pref-unavail-${empId}`,
        type: 'compliance',
        severity: 'error',
        message: `${empMatches[0].employeeId}: Xếp ${unavailable.length} ca vào ngày đã đăng ký nghỉ`,
        suggestion: 'Đổi ca cho nhân viên khác hoặc xác nhận với nhân viên',
        affectedShifts: unavailable.map(m => `${empId}-${m.date}-${m.shiftSlot}`),
      })
    }
    
    // Check for not preferred violations
    const notPreferred = empMatches.filter(m => m.preference === 'not_preferred')
    if (notPreferred.length > 0) {
      warnings.push({
        id: `pref-notpref-${empId}`,
        type: 'compliance',
        severity: 'warning',
        message: `${empMatches[0].employeeId}: ${notPreferred.length} ca không phù hợp mong muốn`,
        suggestion: 'Ưu tiên đổi sang ca phù hợp hoặc giải thích với nhân viên',
        affectedShifts: notPreferred.map(m => `${empId}-${m.date}-${m.shiftSlot}`),
      })
    }
  })
  
  return warnings
}

/**
 * Get employees who haven't submitted preferences for this week
 */
export function getMissingPreferenceEmployees(
  staffList: StaffAttribute[],
  weekStart: Date,
  _existingShifts: ScheduleShift[]
): StaffAttribute[] {
  void _existingShifts
  const prefMap = getWeekPreferences(weekStart)
  const weekDates = Array.from({ length: 7 }, (_, i) => 
    format(addDays(weekStart, i), 'yyyy-MM-dd')
  )
  
  const missing: StaffAttribute[] = []
  
  staffList.forEach(staff => {
    let hasAnyPref = false
    for (const date of weekDates) {
      const key = `${staff.employeeId}-${date}`
      if (prefMap.has(key)) {
        hasAnyPref = true
        break
      }
    }
    if (!hasAnyPref) {
      missing.push(staff)
    }
  })
  
  return missing
}

/**
 * Suggest best shift slots based on employee preferences
 */
export function suggestBestSlots(
  employeeId: string,
  dates: string[],
  prefMap: Map<string, ShiftPreference>
): Map<string, 'morning' | 'afternoon' | 'evening' | 'none'> {
  const suggestions = new Map<string, 'morning' | 'afternoon' | 'evening' | 'none'>()
  
  dates.forEach(date => {
    const key = `${employeeId}-${date}`
    const pref = prefMap.get(key)
    
    if (!pref || pref.not_available) {
      suggestions.set(date, 'none')
      return
    }
    
    // Priority: morning > afternoon > evening
    if (pref.morning_available) {
      suggestions.set(date, 'morning')
    } else if (pref.afternoon_available) {
      suggestions.set(date, 'afternoon')
    } else if (pref.evening_available) {
      suggestions.set(date, 'evening')
    } else {
      suggestions.set(date, 'none')
    }
  })
  
  return suggestions
}

/**
 * Create a preference-aware schedule from existing schedule
 * This wraps an existing ScheduleResult with preference analysis
 */
export function analyzeSchedulePreferences(
  result: ScheduleResult,
  weekStart: Date
): PreferenceAwareResult {
  const prefMap = getWeekPreferences(weekStart)
  const { stats, matches } = calculatePreferenceStats(result.shifts, prefMap)
  const prefWarnings = generatePreferenceWarnings(matches)
  
  // Merge with existing warnings
  const allWarnings = [...result.warnings, ...prefWarnings]
  
  return {
    ...result,
    preferenceStats: stats,
    preferenceMatches: matches,
    warnings: allWarnings,
  }
}
