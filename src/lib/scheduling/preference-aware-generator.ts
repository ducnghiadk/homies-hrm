// =============================================
// Preference-Aware Smart Schedule Generator
// =============================================
// Nâng cấp thuật toán để tích hợp ShiftPreferences và trafficPattern

import { format, addDays } from 'date-fns'
import type {
  ScheduleShift,
  StaffAttribute,
  ScheduleJob,
  ScheduleResult,
  ScheduleStats,
  Warning,
  CostBreakdown,
  HourlyTrafficPattern,
  SchedulingConstraint,
} from '../mock-data-smart-schedule'
import {
  getAllPreferencesForWeek,
  type ShiftPreference,
} from '../mock-data-preferences'
import {
  getPositionCompatibilityWeight,
  isSchedulePositionCompatible,
} from './position-compatibility'

export interface PreferenceAwareJob extends ScheduleJob {
  respectPreferences?: boolean
}

type ShiftSlot = 'morning' | 'afternoon' | 'evening'

type SlotConfig = {
  slot: ShiftSlot
  start: string
  end: string
  planningHours: number[]
}

type SlotDemandPlan = {
  slot: ShiftSlot
  date: string
  dayIdx: number
  target: number
  demandHours: number
  assigned: number
  suggestedPosition: StaffAttribute['position']
}

type CandidateAssessment = {
  staff: StaffAttribute
  score: number
  isPreferred: boolean
  isViolation: boolean
  reason: string
}

interface PreferenceMatch {
  employeeId: string
  date: string
  slot: ShiftSlot
  isPreferred: boolean
  isAccepted: boolean
  isViolation: boolean
}

const SLOT_CONFIGS: SlotConfig[] = [
  { slot: 'morning', start: '07:00', end: '15:00', planningHours: [7, 8, 9, 10, 11, 12, 13] },
  { slot: 'afternoon', start: '14:30', end: '22:30', planningHours: [14, 15, 16] },
  { slot: 'evening', start: '17:00', end: '22:00', planningHours: [17, 18, 19, 20, 21, 22] },
]

const SLOT_PRIORITY: Record<ShiftSlot, number> = {
  morning: 2,
  afternoon: 1,
  evening: 3,
}

const DEFAULT_SHIFT_TARGET = {
  morning: 2,
  afternoon: 2,
  evening: 2,
} satisfies Record<ShiftSlot, number>

const MIN_REST_HOURS = 10

function getShiftSlot(startTime: string): ShiftSlot {
  const hour = parseInt(startTime.split(':')[0], 10)
  if (hour < 14) return 'morning'
  if (hour < 20) return 'afternoon'
  return 'evening'
}

function getSlotConfig(slot: ShiftSlot): SlotConfig {
  const config = SLOT_CONFIGS.find(item => item.slot === slot)
  if (!config) {
    throw new Error(`Unsupported shift slot: ${slot}`)
  }
  return config
}

function calculateHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  let total = (eh + em / 60) - (sh + sm / 60)
  if (total < 0) total += 24
  return total
}

function parseTimeToMinutes(value: string): number {
  const [hour, minute] = value.split(':').map(Number)
  return (hour * 60) + minute
}

function getShiftBreakMinutes(staff: StaffAttribute, slot: ShiftSlot): number {
  const config = getSlotConfig(slot)
  const rawHours = calculateHours(config.start, config.end)
  if (rawHours <= 5.5) return 0
  return staff.type === 'fulltime' ? 60 : 30
}

function getNetShiftHours(staff: StaffAttribute, slot: ShiftSlot): number {
  const config = getSlotConfig(slot)
  return calculateHours(config.start, config.end) - (getShiftBreakMinutes(staff, slot) / 60)
}

function normalizeTrafficDay(dayOfWeek: number): number {
  return (dayOfWeek + 6) % 7
}

function isEmployeeUnavailable(staff: StaffAttribute, date: string): boolean {
  return Boolean(staff.unavailableDates?.includes('ALL') || staff.unavailableDates?.includes(date))
}

function countAssignedDays(employeeShifts: ScheduleShift[]): number {
  return new Set(employeeShifts.map(shift => shift.date)).size
}

function countWeekendAssignments(employeeShifts: ScheduleShift[]): number {
  return employeeShifts.filter(shift => {
    const day = new Date(shift.date).getDay()
    return day === 0 || day === 6
  }).length
}

function countSlotAssignments(employeeShifts: ScheduleShift[], slot: ShiftSlot): number {
  return employeeShifts.filter(shift => getShiftSlot(shift.startTime) === slot).length
}

function getStaffSlotPreferenceScore(
  staff: StaffAttribute,
  slot: ShiftSlot,
): { score: number; reason?: string } {
  if (!staff.preferredShifts || staff.preferredShifts === 'any') {
    return { score: 2 }
  }

  if (staff.preferredShifts === slot) {
    return { score: 10, reason: 'Khớp khung giờ quen thuộc của nhân viên' }
  }

  return { score: -8, reason: 'Lệch khung giờ ưu tiên nên chỉ dùng khi cần cân bằng lịch' }
}

function summarizeAssignmentReasons(reasons: string[]): string {
  const uniqueReasons = Array.from(new Set(reasons.filter(Boolean)))
  return uniqueReasons.slice(0, 3).join(' • ')
}

function getMaxWeeklyHours(staff: StaffAttribute, constraints: SchedulingConstraint[]): number {
  const overtimeConstraint = constraints.find(
    constraint => constraint.type === 'max_overtime' && constraint.isActive
  )
  if (!overtimeConstraint?.value) {
    return staff.maxHoursPerWeek
  }
  return Math.min(staff.maxHoursPerWeek, overtimeConstraint.value)
}

function createDemandPlans(
  weekStart: Date,
  trafficPattern: HourlyTrafficPattern[] | undefined,
  availableStaff: StaffAttribute[],
): SlotDemandPlan[] {
  const effectivePattern = trafficPattern?.length ? trafficPattern : []
  const rawAverageShiftHours = SLOT_CONFIGS.reduce(
    (total, config) => total + calculateHours(config.start, config.end),
    0
  ) / SLOT_CONFIGS.length

  return Array.from({ length: 7 }, (_, dayIdx) => {
    const date = format(addDays(weekStart, dayIdx), 'yyyy-MM-dd')
    const availableCount = availableStaff.filter(staff => !isEmployeeUnavailable(staff, date)).length
    const slotDemand = SLOT_CONFIGS.map(config => {
      const demandHours = effectivePattern
        .filter(point => normalizeTrafficDay(point.dayOfWeek) === dayIdx)
        .filter(point => config.planningHours.includes(point.hour))
        .reduce((total, point) => total + point.staffNeeded, 0)

      return { slot: config.slot, demandHours }
    })

    const totalDemandHours = slotDemand.reduce((total, item) => total + item.demandHours, 0)
    const totalShiftTarget = totalDemandHours > 0
      ? Math.min(availableCount, Math.max(1, Math.ceil(totalDemandHours / rawAverageShiftHours)))
      : Math.min(availableCount, 3)

    const distributedTargets = distributeTargets(slotDemand, totalShiftTarget)

    return SLOT_CONFIGS.map(config => ({
      slot: config.slot,
      date,
      dayIdx,
      target: distributedTargets[config.slot],
      demandHours: slotDemand.find(item => item.slot === config.slot)?.demandHours || 0,
      assigned: 0,
      suggestedPosition: getSuggestedPosition(availableStaff, date, config.slot),
    }))
  }).flat()
}

function getSuggestedPosition(
  availableStaff: StaffAttribute[],
  date: string,
  slot: ShiftSlot,
): StaffAttribute['position'] {
  const eligible = availableStaff.filter(staff => {
    if (staff.position === 'store_manager') return false
    if (isEmployeeUnavailable(staff, date)) return false
    if (staff.type === 'parttime' && slot === 'morning') return false
    return true
  })

  if (eligible.length === 0) {
    return slot === 'morning' ? 'barista' : slot === 'afternoon' ? 'cashier' : 'support'
  }

  const counts = eligible.reduce<Record<StaffAttribute['position'], number>>((acc, staff) => {
    acc[staff.position] = (acc[staff.position] || 0) + 1
    return acc
  }, { barista: 0, cashier: 0, support: 0, store_manager: 0 })

  const preferredOrder: StaffAttribute['position'][] = slot === 'morning'
    ? ['barista', 'cashier', 'support']
    : slot === 'afternoon'
      ? ['cashier', 'barista', 'support']
      : ['support', 'barista', 'cashier']

  preferredOrder.sort((left, right) => counts[right] - counts[left])
  return preferredOrder[0]
}

function distributeTargets(
  slotDemand: Array<{ slot: ShiftSlot; demandHours: number }>,
  totalTarget: number,
): Record<ShiftSlot, number> {
  const result: Record<ShiftSlot, number> = { morning: 0, afternoon: 0, evening: 0 }
  if (totalTarget <= 0) {
    return result
  }

  const positiveSlots = slotDemand
    .filter(item => item.demandHours > 0)
    .sort((a, b) => b.demandHours - a.demandHours || SLOT_PRIORITY[b.slot] - SLOT_PRIORITY[a.slot])

  if (positiveSlots.length === 0) {
    const fallbackSlots = Object.entries(DEFAULT_SHIFT_TARGET)
      .sort((a, b) => b[1] - a[1])
      .map(([slot]) => slot as ShiftSlot)

    for (let index = 0; index < Math.min(totalTarget, fallbackSlots.length); index += 1) {
      result[fallbackSlots[index]] += 1
    }

    let remaining = totalTarget - Math.min(totalTarget, fallbackSlots.length)
    let cursor = 0
    while (remaining > 0) {
      const slot = fallbackSlots[cursor % fallbackSlots.length]
      result[slot] += 1
      remaining -= 1
      cursor += 1
    }
    return result
  }

  const guaranteed = Math.min(totalTarget, positiveSlots.length)
  for (let index = 0; index < guaranteed; index += 1) {
    result[positiveSlots[index].slot] += 1
  }

  const remaining = totalTarget - guaranteed
  if (remaining <= 0) {
    return result
  }

  const totalDemand = positiveSlots.reduce((total, item) => total + item.demandHours, 0)
  const weighted = positiveSlots.map(item => {
    const raw = totalDemand > 0 ? (item.demandHours / totalDemand) * remaining : 0
    return {
      slot: item.slot,
      base: Math.floor(raw),
      remainder: raw - Math.floor(raw),
    }
  })

  weighted.forEach(item => {
    result[item.slot] += item.base
  })

  let left = remaining - weighted.reduce((total, item) => total + item.base, 0)
  weighted
    .sort((a, b) => b.remainder - a.remainder || SLOT_PRIORITY[b.slot] - SLOT_PRIORITY[a.slot])
    .forEach(item => {
      if (left <= 0) return
      result[item.slot] += 1
      left -= 1
    })

  return result
}

function getPreferenceAssessment(
  preference: ShiftPreference | undefined,
  slot: ShiftSlot,
): { scoreAdjustment: number; isPreferred: boolean; isViolation: boolean } {
  if (!preference) {
    return { scoreAdjustment: 12, isPreferred: false, isViolation: false }
  }

  if (preference.not_available) {
    return { scoreAdjustment: -120, isPreferred: false, isViolation: true }
  }

  const availability = {
    morning: preference.morning_available,
    afternoon: preference.afternoon_available,
    evening: preference.evening_available,
  }

  if (availability[slot]) {
    return { scoreAdjustment: 40, isPreferred: true, isViolation: false }
  }

  const anyAvailable = availability.morning || availability.afternoon || availability.evening
  return {
    scoreAdjustment: anyAvailable ? -18 : -30,
    isPreferred: false,
    isViolation: false,
  }
}

function createsConsecutiveOverflow(
  existingShifts: ScheduleShift[],
  date: string,
  maxConsecutiveDays: number,
): boolean {
  if (maxConsecutiveDays <= 0) return false

  const scheduledDates = new Set(existingShifts.map(shift => shift.date))
  scheduledDates.add(date)

  let streak = 1

  for (let offset = 1; offset <= maxConsecutiveDays + 1; offset += 1) {
    const previousDate = format(addDays(new Date(date), -offset), 'yyyy-MM-dd')
    if (scheduledDates.has(previousDate)) {
      streak += 1
    } else {
      break
    }
  }

  for (let offset = 1; offset <= maxConsecutiveDays + 1; offset += 1) {
    const nextDate = format(addDays(new Date(date), offset), 'yyyy-MM-dd')
    if (scheduledDates.has(nextDate)) {
      streak += 1
    } else {
      break
    }
  }

  return streak > maxConsecutiveDays
}

function hasClopeningConflict(
  existingShifts: ScheduleShift[],
  date: string,
  slot: ShiftSlot,
  customMinRest?: number,
): boolean {
  const config = getSlotConfig(slot)
  const startMinutes = parseTimeToMinutes(config.start)
  const previousDate = format(addDays(new Date(date), -1), 'yyyy-MM-dd')
  const previousShift = existingShifts.find(shift => shift.date === previousDate)

  if (previousShift) {
    const restHours = (startMinutes + ((24 * 60) - parseTimeToMinutes(previousShift.endTime))) / 60
    const limit = customMinRest ?? MIN_REST_HOURS
    if (restHours < limit) {
      return true
    }
  }

  return false
}

function assessCandidate(
  staff: StaffAttribute,
  plan: SlotDemandPlan,
  prefMap: Map<string, ShiftPreference>,
  shiftsByEmployee: Map<string, ScheduleShift[]>,
  hoursByEmployee: Map<string, number>,
  constraints: SchedulingConstraint[],
  respectPreferences: boolean,
): CandidateAssessment | null {
  if (isEmployeeUnavailable(staff, plan.date)) {
    return null
  }

  const positionCompatibility = getPositionCompatibilityWeight(staff.position, plan.suggestedPosition)
  if (positionCompatibility === 0) {
    return null
  }

  const employeeShifts = shiftsByEmployee.get(staff.employeeId) || []
  const reasons: string[] = []
  if (employeeShifts.some(shift => shift.date === plan.date)) {
    return null
  }

  const maxHours = getMaxWeeklyHours(staff, constraints)
  const projectedHours = (hoursByEmployee.get(staff.employeeId) || 0) + getNetShiftHours(staff, plan.slot)
  if (projectedHours > maxHours + 0.01) {
    return null
  }

  const noClopening = constraints.some(
    constraint => constraint.type === 'no_clopening' && constraint.isActive
  )
  if (noClopening && hasClopeningConflict(employeeShifts, plan.date, plan.slot)) {
    return null
  }

  // Hard constraint: enforce absolute minimum rest of 8 hours to prevent severe labor law violations
  if (hasClopeningConflict(employeeShifts, plan.date, plan.slot, 8)) {
    return null
  }

  const consecutiveConstraint = constraints.find(
    constraint => constraint.type === 'max_consecutive_days' && constraint.isActive
  )
  if (
    consecutiveConstraint?.value &&
    createsConsecutiveOverflow(employeeShifts, plan.date, consecutiveConstraint.value)
  ) {
    return null
  }

  // Hard constraint: enforce absolute labor law max of 6 consecutive days
  if (createsConsecutiveOverflow(employeeShifts, plan.date, 6)) {
    return null
  }

  const preference = prefMap.get(`${staff.employeeId}-${plan.date}`)
  const preferenceAssessment = getPreferenceAssessment(preference, plan.slot)
  if (respectPreferences && preference?.not_available && !preferenceAssessment.isViolation) {
    return null
  }

  let score = 60
  score += preferenceAssessment.scoreAdjustment
  if (preferenceAssessment.isPreferred) {
    reasons.push('Khớp nguyện vọng ca đã đăng ký')
  } else if (preferenceAssessment.isViolation) {
    reasons.push('Buộc phải cân nhắc ca lệch preference vì thiếu người')
  }

  const currentHours = hoursByEmployee.get(staff.employeeId) || 0
  const remainingHours = Math.max(0, maxHours - currentHours)
  score += remainingHours / Math.max(1, maxHours) * 18
  score -= currentHours * 0.35
  if (remainingHours > maxHours * 0.45) {
    reasons.push('Đang còn nhiều giờ trống trong tuần')
  }

  const assignedDays = countAssignedDays(employeeShifts)
  score += Math.max(0, 5 - assignedDays) * 3
  score -= assignedDays * 1.5
  if (assignedDays <= 2) {
    reasons.push('Giúp cân bằng số ngày làm giữa các nhân viên')
  }

  const slotAssignments = countSlotAssignments(employeeShifts, plan.slot)
  score -= slotAssignments * 2.5
  if (slotAssignments === 0) {
    reasons.push('Tăng độ xoay vòng giữa các loại ca')
  }

  if (plan.dayIdx >= 5) {
    const weekendAssignments = countWeekendAssignments(employeeShifts)
    score -= weekendAssignments * 3
    if (weekendAssignments === 0) {
      reasons.push('Cân bằng tải cuối tuần cho đội ngũ')
    }
  }

  const slotPreference = getStaffSlotPreferenceScore(staff, plan.slot)
  score += slotPreference.score
  if (slotPreference.reason) {
    reasons.push(slotPreference.reason)
  }

  // Position match boost: high preference to assign employees to their correct position first
  if (staff.position === plan.suggestedPosition) {
    score += 35
    reasons.push('Đúng chuyên môn chính của ca làm')
  } else if (isSchedulePositionCompatible(staff.position, plan.suggestedPosition)) {
    score += 16
    reasons.push('Có thể cover vị trí gần kề khi cần')
  }

  // Store manager fallback penalty: avoid using store manager as a fallback slot cover
  if (staff.position === 'store_manager') {
    if (plan.suggestedPosition !== 'store_manager') {
      score -= 40
      reasons.push('Chỉ dùng quản lý như phương án dự phòng cuối')
    }
  }

  if (staff.type === 'parttime') {
    score += plan.slot === 'evening' ? 12 : plan.slot === 'afternoon' ? 8 : -4
  } else {
    score += plan.slot === 'morning' ? 9 : 4
  }

  if (staff.position === 'store_manager') {
    score += plan.slot === 'morning' ? 6 : -4
  }

  score += plan.demandHours * 0.25

  return {
    staff,
    score,
    isPreferred: preferenceAssessment.isPreferred,
    isViolation: preferenceAssessment.isViolation,
    reason: summarizeAssignmentReasons(reasons) || 'Được chọn vì có độ phù hợp cao nhất cho ca này',
  }
}

function chooseBestCandidate(
  plan: SlotDemandPlan,
  availableStaff: StaffAttribute[],
  prefMap: Map<string, ShiftPreference>,
  shiftsByEmployee: Map<string, ScheduleShift[]>,
  hoursByEmployee: Map<string, number>,
  constraints: SchedulingConstraint[],
  respectPreferences: boolean,
): CandidateAssessment | null {
  const candidates = availableStaff
    .map(staff => assessCandidate(
      staff,
      plan,
      prefMap,
      shiftsByEmployee,
      hoursByEmployee,
      constraints,
      respectPreferences,
    ))
    .filter((candidate): candidate is CandidateAssessment => Boolean(candidate))

  if (candidates.length === 0) {
    return null
  }

  candidates.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score

    const leftHours = hoursByEmployee.get(left.staff.employeeId) || 0
    const rightHours = hoursByEmployee.get(right.staff.employeeId) || 0
    if (leftHours !== rightHours) return leftHours - rightHours

    return left.staff.name.localeCompare(right.staff.name, 'vi')
  })

  const preferredSafeCandidate = candidates.find(candidate => !candidate.isViolation)
  return preferredSafeCandidate || candidates[0]
}

function analyzePreferenceMatches(
  shifts: ScheduleShift[],
  prefMap: Map<string, ShiftPreference>,
): PreferenceMatch[] {
  return shifts.map(shift => {
    const key = `${shift.employeeId}-${shift.date}`
    const pref = prefMap.get(key)
    const slot = getShiftSlot(shift.startTime)

    if (!pref) {
      return {
        employeeId: shift.employeeId,
        date: shift.date,
        slot,
        isPreferred: false,
        isAccepted: true,
        isViolation: false,
      }
    }

    if (pref.not_available) {
      return {
        employeeId: shift.employeeId,
        date: shift.date,
        slot,
        isPreferred: false,
        isAccepted: false,
        isViolation: true,
      }
    }

    const availability = {
      morning: pref.morning_available,
      afternoon: pref.afternoon_available,
      evening: pref.evening_available,
    }

    return {
      employeeId: shift.employeeId,
      date: shift.date,
      slot,
      isPreferred: availability[slot],
      isAccepted: !availability.morning && !availability.afternoon && !availability.evening,
      isViolation: false,
    }
  })
}

function checkConstraints(
  shifts: ScheduleShift[],
  staffList: StaffAttribute[],
  constraints: SchedulingConstraint[],
): Warning[] {
  const warnings: Warning[] = []

  const maxOvertime = constraints.find(
    constraint => constraint.type === 'max_overtime' && constraint.isActive
  )

  if (maxOvertime) {
    const hoursByEmployee = new Map<string, number>()
    shifts.forEach(shift => {
      const hours = calculateHours(shift.startTime, shift.endTime) - (shift.breakMinutes / 60)
      hoursByEmployee.set(
        shift.employeeId,
        (hoursByEmployee.get(shift.employeeId) || 0) + hours,
      )
    })

    hoursByEmployee.forEach((hours, employeeId) => {
      const staff = staffList.find(item => item.employeeId === employeeId)
      const threshold = staff ? getMaxWeeklyHours(staff, constraints) : maxOvertime.value || 48
      if (hours > threshold) {
        warnings.push({
          id: `ot-${employeeId}`,
          type: 'overtime',
          severity: 'warning',
          message: `${staff?.name || employeeId}: ${hours.toFixed(1)}h/tuần (vượt max ${threshold}h)`,
          suggestion: 'Giảm bớt 1 ca hoặc chuyển cho nhân viên khác',
        })
      }
    })
  }

  const maxConsecutive = constraints.find(
    constraint => constraint.type === 'max_consecutive_days' && constraint.isActive
  )

  if (maxConsecutive?.value) {
    const maxConsecutiveDays = maxConsecutive.value
    const shiftsByEmployee = shifts.reduce<Record<string, ScheduleShift[]>>((grouped, shift) => {
      grouped[shift.employeeId] = grouped[shift.employeeId] || []
      grouped[shift.employeeId].push(shift)
      return grouped
    }, {})

    Object.entries(shiftsByEmployee).forEach(([employeeId, employeeShifts]) => {
      const sortedDates = Array.from(new Set(employeeShifts.map(shift => shift.date))).sort()
      let streak = 1

      for (let index = 1; index < sortedDates.length; index += 1) {
        const previous = new Date(sortedDates[index - 1])
        const current = new Date(sortedDates[index])
        const diffInDays = (current.getTime() - previous.getTime()) / (1000 * 60 * 60 * 24)

        if (diffInDays === 1) {
          streak += 1
          if (streak > maxConsecutiveDays) {
            const staff = staffList.find(item => item.employeeId === employeeId)
            warnings.push({
              id: `consec-${employeeId}`,
              type: 'compliance',
              severity: 'warning',
              message: `${staff?.name || employeeId}: Làm ${streak} ngày liên tục (max ${maxConsecutiveDays})`,
              suggestion: 'Bố trí ít nhất 1 ngày nghỉ trong tuần',
            })
            break
          }
        } else {
          streak = 1
        }
      }
    })
  }

  return warnings
}

function calculateCost(
  shifts: ScheduleShift[],
  staffList: StaffAttribute[],
): CostBreakdown {
  const byEmployee: CostBreakdown['byEmployee'] = []
  const byPosition: Record<string, number> = {}
  let totalCost = 0
  let totalHours = 0

  const shiftsByEmployee = shifts.reduce<Record<string, ScheduleShift[]>>((grouped, shift) => {
    grouped[shift.employeeId] = grouped[shift.employeeId] || []
    grouped[shift.employeeId].push(shift)
    return grouped
  }, {})

  Object.entries(shiftsByEmployee).forEach(([employeeId, employeeShifts]) => {
    const staff = staffList.find(item => item.employeeId === employeeId)
    if (!staff) return

    let employeeHours = 0
    let employeeCost = 0

    employeeShifts.forEach(shift => {
      const hours = calculateHours(shift.startTime, shift.endTime) - (shift.breakMinutes / 60)
      const cost = hours * staff.hourlyRate
      employeeHours += hours
      employeeCost += cost
      byPosition[shift.position] = (byPosition[shift.position] || 0) + cost
    })

    totalHours += employeeHours
    totalCost += employeeCost

    byEmployee.push({
      employeeId,
      name: staff.name,
      hours: employeeHours,
      cost: employeeCost,
      isOvertime: employeeHours > getMaxWeeklyHours(staff, []),
    })
  })

  return { byEmployee, byPosition, totalCost, totalHours }
}

export function generatePreferenceAwareSchedule(job: PreferenceAwareJob): ScheduleResult {
  const {
    weekStart,
    availableStaff,
    constraints,
    trafficPattern,
    respectPreferences = true,
  } = job

  const shifts: ScheduleShift[] = []
  const warnings: Warning[] = []
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const preferences = respectPreferences ? getAllPreferencesForWeek(weekStartStr) : []
  const prefMap = new Map<string, ShiftPreference>()
  preferences.forEach(preference => {
    prefMap.set(`${preference.user_id}-${preference.date}`, preference)
  })

  const demandPlans = createDemandPlans(weekStart, trafficPattern, availableStaff)
  const hoursByEmployee = new Map<string, number>()
  const shiftsByEmployee = new Map<string, ScheduleShift[]>()
  let shiftCounter = 0

  for (let dayIdx = 0; dayIdx < 7; dayIdx += 1) {
    const date = format(addDays(weekStart, dayIdx), 'yyyy-MM-dd')
    const dayPlans = demandPlans
      .filter(plan => plan.date === date && plan.target > 0)
      .sort((left, right) => right.target - left.target || SLOT_PRIORITY[right.slot] - SLOT_PRIORITY[left.slot])

    dayPlans.forEach(plan => {
      for (let count = 0; count < plan.target; count += 1) {
        const selected = chooseBestCandidate(
          plan,
          availableStaff,
          prefMap,
          shiftsByEmployee,
          hoursByEmployee,
          constraints,
          respectPreferences,
        )

        if (!selected) {
          continue
        }

        const config = getSlotConfig(plan.slot)
        shiftCounter += 1

        const shift: ScheduleShift = {
          id: `sched-${weekStartStr}-${dayIdx}-${plan.slot}-${shiftCounter}`,
          employeeId: selected.staff.employeeId,
          employeeName: selected.staff.name,
          date,
          startTime: config.start,
          endTime: config.end,
          position: selected.staff.position,
          isOvertime: false,
          breakMinutes: getShiftBreakMinutes(selected.staff, plan.slot),
          assignmentReason: selected.reason,
        }

        shifts.push(shift)
        plan.assigned += 1
        hoursByEmployee.set(
          selected.staff.employeeId,
          (hoursByEmployee.get(selected.staff.employeeId) || 0) + getNetShiftHours(selected.staff, plan.slot),
        )
        shiftsByEmployee.set(
          selected.staff.employeeId,
          [...(shiftsByEmployee.get(selected.staff.employeeId) || []), shift],
        )
      }
    })
  }

  const understaffedPlans = demandPlans.filter(plan => plan.assigned < plan.target)
  understaffedPlans.forEach(plan => {
    warnings.push({
      id: `under-${plan.date}-${plan.slot}`,
      type: 'understaffed',
      severity: plan.target - plan.assigned >= 2 ? 'error' : 'warning',
      message: `Thiếu ${plan.target - plan.assigned} nhân sự cho ca ${plan.slot} ngày ${plan.date}`,
      suggestion: 'Bổ sung ca thủ công hoặc mở ca trống cho nhân viên đăng ký thêm',
      affectedShifts: [
        `understaffed:${plan.date}:${plan.slot}:${plan.suggestedPosition}:${plan.target - plan.assigned}`,
      ],
    })
  })

  const prefMatches = analyzePreferenceMatches(shifts, prefMap)
  const violationMatches = prefMatches.filter(match => match.isViolation)
  if (violationMatches.length > 0) {
    warnings.push({
      id: 'pref-violations',
      type: 'compliance',
      severity: 'error',
      message: `${violationMatches.length} ca được xếp vào ngày nhân viên đăng ký nghỉ`,
      suggestion: 'Đổi ca cho nhân viên khác hoặc chuyển sang open shift',
      affectedShifts: violationMatches.map(match => `${match.employeeId}-${match.date}-${match.slot}`),
    })
  }

  const constraintWarnings = checkConstraints(shifts, availableStaff, constraints)
  warnings.push(...constraintWarnings)

  const costBreakdown = calculateCost(shifts, availableStaff)
  const totalTargets = demandPlans.reduce((total, plan) => total + plan.target, 0)
  const coveragePercent = totalTargets > 0
    ? Math.round((shifts.length / totalTargets) * 100)
    : 100

  const stats: ScheduleStats = {
    totalShifts: shifts.length,
    totalHours: costBreakdown.totalHours,
    totalCost: costBreakdown.totalCost,
    budgetVariance: 0,
    coveragePercent,
    ftHours: costBreakdown.byEmployee
      .filter(entry => availableStaff.find(staff => staff.employeeId === entry.employeeId)?.type === 'fulltime')
      .reduce((total, entry) => total + entry.hours, 0),
    ptHours: costBreakdown.byEmployee
      .filter(entry => availableStaff.find(staff => staff.employeeId === entry.employeeId)?.type === 'parttime')
      .reduce((total, entry) => total + entry.hours, 0),
  }

  const matchRate = prefMatches.length > 0
    ? (prefMatches.filter(match => match.isPreferred || match.isAccepted).length / prefMatches.length) * 100
    : 100

  if (matchRate < 60 && prefMatches.length > 0) {
    warnings.push({
      id: 'pref-low-match',
      type: 'compliance',
      severity: 'warning',
      message: `Chỉ ${matchRate.toFixed(0)}% ca phù hợp với đăng ký nhân viên`,
      suggestion: 'Ưu tiên điều chỉnh các ca không phù hợp trước khi xuất bản',
    })
  }

  return {
    id: `sched-${weekStartStr}`,
    status: 'draft',
    weekStart: weekStartStr,
    weekEnd: format(addDays(weekStart, 6), 'yyyy-MM-dd'),
    shifts,
    stats,
    warnings,
    costBreakdown,
    generatedAt: new Date().toISOString(),
  }
}

export function getPreferenceMatchStats(
  shifts: ScheduleShift[],
  weekStart: Date,
): {
  matchRate: number
  preferredCount: number
  acceptedCount: number
  notPreferredCount: number
  violationCount: number
} {
  const weekStartStr = format(weekStart, 'yyyy-MM-dd')
  const prefMap = new Map<string, ShiftPreference>()

  getAllPreferencesForWeek(weekStartStr).forEach(preference => {
    prefMap.set(`${preference.user_id}-${preference.date}`, preference)
  })

  const matches = analyzePreferenceMatches(shifts, prefMap)

  return {
    matchRate: matches.length > 0
      ? (matches.filter(match => match.isPreferred || match.isAccepted).length / matches.length) * 100
      : 100,
    preferredCount: matches.filter(match => match.isPreferred).length,
    acceptedCount: matches.filter(match => match.isAccepted).length,
    notPreferredCount: matches.filter(
      match => !match.isPreferred && !match.isAccepted && !match.isViolation
    ).length,
    violationCount: matches.filter(match => match.isViolation).length,
  }
}
