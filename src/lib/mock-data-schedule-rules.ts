// =============================================
// Schedule Rules & Smart Warnings Engine
// =============================================

import {
  mockSchedules, mockShifts, mockEmployees, mockPositions,
  getShiftById,
  type Schedule, type Shift, type Employee,
} from './mock-data'

// ─── Types ───

export type WarningLevel = 'info' | 'warning' | 'block'
export type RuleKey = 'min_rest_hours' | 'max_weekly_hours_warn' | 'max_weekly_hours_block' | 'max_daily_hours' | 'max_consecutive_days' | 'max_shifts_per_day' | 'clopening' | 'night_shift_restriction'

export interface ScheduleRule {
  id: string
  rule_key: RuleKey
  label: string
  description: string
  warning_value: number
  block_value: number
  warning_level: WarningLevel
  is_active: boolean
}

export interface ScheduleRuleOverride {
  id: string
  rule_key: RuleKey
  position_id: string | null
  season_id: string | null
  override_warning: number
  override_block: number
}

export interface ScheduleSeason {
  id: string
  name: string
  start_date: string
  end_date: string
  is_active: boolean
}

export interface ScheduleWarning {
  id: string
  employee_id: string
  employee_name: string
  warning_type: RuleKey
  warning_level: WarningLevel
  message: string
  date: string
  shift_id?: string
  is_acknowledged: boolean
  acknowledged_by?: string
  acknowledged_at?: string
}

// ─── Default Rules ───


export const scheduleRules: ScheduleRule[] = [
  { id: 'rule-001', rule_key: 'clopening', label: 'Clopening (Đóng–Mở)', description: 'NV làm ca tối rồi ca sáng hôm sau, nghỉ không đủ giờ', warning_value: 8, block_value: 6, warning_level: 'warning', is_active: true },
  { id: 'rule-002', rule_key: 'max_weekly_hours_warn', label: 'Overtime tuần (cảnh báo)', description: 'Tổng giờ/tuần vượt ngưỡng cảnh báo', warning_value: 40, block_value: 40, warning_level: 'warning', is_active: true },
  { id: 'rule-003', rule_key: 'max_weekly_hours_block', label: 'Overtime tuần (chặn)', description: 'Tổng giờ/tuần vượt ngưỡng tối đa', warning_value: 48, block_value: 48, warning_level: 'block', is_active: true },
  { id: 'rule-004', rule_key: 'max_daily_hours', label: 'Overtime ngày', description: 'Tổng giờ/ngày vượt ngưỡng', warning_value: 10, block_value: 12, warning_level: 'warning', is_active: true },
  { id: 'rule-005', rule_key: 'max_consecutive_days', label: 'Ngày làm liên tục', description: 'Làm quá nhiều ngày liên tiếp không nghỉ', warning_value: 5, block_value: 6, warning_level: 'warning', is_active: true },
  { id: 'rule-006', rule_key: 'max_shifts_per_day', label: 'Ca liên tiếp trong ngày', description: 'Chỉ làm max số ca 1 ngày', warning_value: 2, block_value: 3, warning_level: 'info', is_active: false },
  { id: 'rule-007', rule_key: 'night_shift_restriction', label: 'Ca đêm cho NV đặc biệt', description: 'NV dưới 18 tuổi không được làm ca đêm', warning_value: 0, block_value: 0, warning_level: 'block', is_active: true },
]

export const ruleOverrides: ScheduleRuleOverride[] = [
  { id: 'ov-001', rule_key: 'max_weekly_hours_warn', position_id: 'pos-004', season_id: null, override_warning: 48, override_block: 48 },
  { id: 'ov-002', rule_key: 'max_weekly_hours_block', position_id: 'pos-005', season_id: null, override_warning: 56, override_block: 56 },
  { id: 'ov-003', rule_key: 'max_consecutive_days', position_id: 'pos-005', season_id: null, override_warning: 7, override_block: 7 },
]

export const scheduleSeasons: ScheduleSeason[] = [
  { id: 'season-001', name: 'Tết 2026', start_date: '2026-01-25', end_date: '2026-02-10', is_active: true },
  { id: 'season-002', name: 'Hè 2026', start_date: '2026-06-01', end_date: '2026-08-31', is_active: true },
]

const warnings: ScheduleWarning[] = []
let warningCounter = 100

// ─── Helpers ───

function getShiftHours(shift: Shift): number {
  if (shift.hours) return shift.hours
  const [sh, sm] = shift.start_time.split(':').map(Number)
  const [eh, em] = shift.end_time.split(':').map(Number)
  let h = eh - sh + (em - sm) / 60
  if (h < 0) h += 24
  return h
}

function parseTime(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function getEffectiveValue(ruleKey: RuleKey, positionId: string | null, field: 'warning' | 'block'): number {
  const rule = scheduleRules.find(r => r.rule_key === ruleKey)
  if (!rule) return 0
  // Check position override
  if (positionId) {
    const ov = ruleOverrides.find(o => o.rule_key === ruleKey && o.position_id === positionId)
    if (ov) return field === 'warning' ? ov.override_warning : ov.override_block
  }
  return field === 'warning' ? rule.warning_value : rule.block_value
}

function isRuleActive(ruleKey: RuleKey): boolean {
  return scheduleRules.find(r => r.rule_key === ruleKey)?.is_active ?? false
}

function getRuleLevel(ruleKey: RuleKey): WarningLevel {
  return scheduleRules.find(r => r.rule_key === ruleKey)?.warning_level ?? 'info'
}

// ─── Warning Engine ───

export function checkScheduleWarnings(
  employeeId: string,
  shiftId: string,
  date: string,
  storeId: string,
  allSchedules?: Schedule[],
): ScheduleWarning[] {
  const result: ScheduleWarning[] = []
  const emp = mockEmployees.find(e => e.id === employeeId)
  if (!emp) return result
  const shift = getShiftById(shiftId)
  if (!shift) return result

  const schedules = allSchedules || mockSchedules
  const posId = emp.position_id

  // 1. CLOPENING
  if (isRuleActive('clopening')) {
    const minRest = getEffectiveValue('clopening', posId, 'warning')
    // Check previous day: did they have a late shift?
    const prevDate = addDays(date, -1)
    const prevSchedules = schedules.filter(s => s.employee_id === employeeId && s.date === prevDate)
    for (const ps of prevSchedules) {
      const prevShift = getShiftById(ps.shift_id)
      if (prevShift) {
        const prevEnd = parseTime(prevShift.end_time)
        const curStart = parseTime(shift.start_time)
        const restMinutes = curStart + (24 * 60 - prevEnd)
        const restHours = restMinutes / 60
        if (restHours < minRest) {
          result.push(createWarningObj(emp, 'clopening', getRuleLevel('clopening'), date, shiftId,
            `${emp.full_name} chỉ nghỉ ${restHours.toFixed(1)} tiếng giữa 2 ca (tối thiểu ${minRest}h)`))
        }
      }
    }

    // Check next day: would someone have a clopening?
    const nextDate = addDays(date, 1)
    const nextSchedules = schedules.filter(s => s.employee_id === employeeId && s.date === nextDate)
    for (const ns of nextSchedules) {
      const nextShift = getShiftById(ns.shift_id)
      if (nextShift) {
        const curEnd = parseTime(shift.end_time)
        const nextStart = parseTime(nextShift.start_time)
        const restMinutes = nextStart + (24 * 60 - curEnd)
        const restHours = restMinutes / 60
        if (restHours < minRest) {
          result.push(createWarningObj(emp, 'clopening', getRuleLevel('clopening'), date, shiftId,
            `${emp.full_name} nghỉ ${restHours.toFixed(1)}h rồi ca sáng hôm sau (tối thiểu ${minRest}h)`))
        }
      }
    }
  }

  // 2. OVERTIME WEEK (warn + block)
  if (isRuleActive('max_weekly_hours_warn') || isRuleActive('max_weekly_hours_block')) {
    const weekDates = getWeekDatesFromDate(date)
    let totalHours = getShiftHours(shift) // the new shift being added
    weekDates.forEach(wd => {
      schedules.filter(s => s.employee_id === employeeId && s.date === wd)
        .forEach(s => {
          const sh = getShiftById(s.shift_id)
          if (sh) totalHours += getShiftHours(sh)
        })
    })

    const warnThreshold = getEffectiveValue('max_weekly_hours_warn', posId, 'warning')
    const blockThreshold = getEffectiveValue('max_weekly_hours_block', posId, 'warning')

    if (isRuleActive('max_weekly_hours_block') && totalHours > blockThreshold) {
      result.push(createWarningObj(emp, 'max_weekly_hours_block', 'block', date, shiftId,
        `${emp.full_name} sẽ có ${totalHours.toFixed(0)}h/tuần (tối đa ${blockThreshold}h)`))
    } else if (isRuleActive('max_weekly_hours_warn') && totalHours > warnThreshold) {
      result.push(createWarningObj(emp, 'max_weekly_hours_warn', 'warning', date, shiftId,
        `${emp.full_name} sẽ có ${totalHours.toFixed(0)}h/tuần (ngưỡng ${warnThreshold}h)`))
    }
  }

  // 3. OVERTIME DAY
  if (isRuleActive('max_daily_hours')) {
    const daySchedules = schedules.filter(s => s.employee_id === employeeId && s.date === date)
    let dayHours = getShiftHours(shift)
    daySchedules.forEach(s => {
      const sh = getShiftById(s.shift_id)
      if (sh) dayHours += getShiftHours(sh)
    })
    const maxDaily = getEffectiveValue('max_daily_hours', posId, 'warning')
    const blockDaily = getEffectiveValue('max_daily_hours', posId, 'block')
    if (dayHours > blockDaily) {
      result.push(createWarningObj(emp, 'max_daily_hours', 'block', date, shiftId,
        `${emp.full_name} sẽ làm ${dayHours.toFixed(0)}h ngày này (tối đa ${blockDaily}h)`))
    } else if (dayHours > maxDaily) {
      result.push(createWarningObj(emp, 'max_daily_hours', 'warning', date, shiftId,
        `${emp.full_name} sẽ làm ${dayHours.toFixed(0)}h ngày này (ngưỡng ${maxDaily}h)`))
    }
  }

  // 4. CONSECUTIVE DAYS
  if (isRuleActive('max_consecutive_days')) {
    let streak = 1
    // Check backwards
    for (let i = 1; i <= 14; i++) {
      const prev = addDays(date, -i)
      if (schedules.some(s => s.employee_id === employeeId && s.date === prev)) {
        streak++
      } else break
    }
    // Check forwards
    for (let i = 1; i <= 14; i++) {
      const next = addDays(date, i)
      if (schedules.some(s => s.employee_id === employeeId && s.date === next)) {
        streak++
      } else break
    }
    const maxConsec = getEffectiveValue('max_consecutive_days', posId, 'warning')
    const blockConsec = getEffectiveValue('max_consecutive_days', posId, 'block')
    if (streak > blockConsec) {
      result.push(createWarningObj(emp, 'max_consecutive_days', 'block', date, shiftId,
        `${emp.full_name} sẽ làm ${streak} ngày liên tục (tối đa ${blockConsec})`))
    } else if (streak > maxConsec) {
      result.push(createWarningObj(emp, 'max_consecutive_days', 'warning', date, shiftId,
        `${emp.full_name} sẽ làm ${streak} ngày liên tục (ngưỡng ${maxConsec})`))
    }
  }

  // 5. MAX SHIFTS PER DAY
  if (isRuleActive('max_shifts_per_day')) {
    const dayCount = schedules.filter(s => s.employee_id === employeeId && s.date === date).length + 1
    const max = getEffectiveValue('max_shifts_per_day', posId, 'warning')
    if (dayCount > max) {
      result.push(createWarningObj(emp, 'max_shifts_per_day', getRuleLevel('max_shifts_per_day'), date, shiftId,
        `${emp.full_name} đã có ${dayCount - 1} ca ngày này, thêm sẽ thành ${dayCount} ca`))
    }
  }

  // 6. NIGHT SHIFT RESTRICTION
  if (isRuleActive('night_shift_restriction')) {
    const endTime = parseTime(shift.end_time)
    const startTime = parseTime(shift.start_time)
    const isNightShift = endTime >= 22 * 60 || startTime >= 22 * 60 || endTime <= 6 * 60

    if (isNightShift) {
      // Check age
      const dob = new Date(emp.date_of_birth)
      const today = new Date()
      const age = today.getFullYear() - dob.getFullYear()
      if (age < 18) {
        result.push(createWarningObj(emp, 'night_shift_restriction', 'block', date, shiftId,
          `${emp.full_name} chưa đủ 18 tuổi (${age} tuổi), không được làm ca đêm`))
      }
    }
  }

  return result
}

function createWarningObj(emp: Employee, type: RuleKey, level: WarningLevel, date: string, shiftId: string, message: string): ScheduleWarning {
  return {
    id: `warn-${warningCounter++}`,
    employee_id: emp.id,
    employee_name: emp.full_name,
    warning_type: type,
    warning_level: level,
    message,
    date,
    shift_id: shiftId,
    is_acknowledged: false,
  }
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function getWeekDatesFromDate(dateStr: string): string[] {
  const d = new Date(dateStr)
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((day + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday)
    dd.setDate(monday.getDate() + i)
    return dd.toISOString().split('T')[0]
  })
}

// ─── Scan all warnings for a store+week ───

export function scanWeekWarnings(storeId: string, weekDates: string[]): ScheduleWarning[] {
  const allWarnings: ScheduleWarning[] = []
  const storeSchedules = mockSchedules.filter(s => s.store_id === storeId)
  const empsInStore = mockEmployees.filter(e => e.store_id === storeId)

  for (const emp of empsInStore) {
    for (const date of weekDates) {
      const daySchedules = storeSchedules.filter(s => s.employee_id === emp.id && s.date === date)
      for (const sch of daySchedules) {
        const warns = checkScheduleWarnings(emp.id, sch.shift_id, date, storeId, storeSchedules)
        // Deduplicate by message
        warns.forEach(w => {
          if (!allWarnings.some(aw => aw.message === w.message)) {
            allWarnings.push(w)
          }
        })
      }
    }
  }

  return allWarnings.sort((a, b) => {
    const levelOrder: Record<WarningLevel, number> = { block: 0, warning: 1, info: 2 }
    return (levelOrder[a.warning_level] - levelOrder[b.warning_level]) || a.date.localeCompare(b.date)
  })
}

// ─── Get employee weekly hours ───

export function getEmployeeWeeklyHours(employeeId: string, weekDates: string[]): number {
  let total = 0
  weekDates.forEach(date => {
    mockSchedules
      .filter(s => s.employee_id === employeeId && s.date === date)
      .forEach(s => {
        const sh = getShiftById(s.shift_id)
        if (sh) total += getShiftHours(sh)
      })
  })
  return total
}

// ─── CRUD for rules ───

export function updateRule(ruleKey: RuleKey, updates: Partial<Pick<ScheduleRule, 'warning_value' | 'block_value' | 'warning_level' | 'is_active'>>): void {
  const rule = scheduleRules.find(r => r.rule_key === ruleKey)
  if (!rule) return
  if (updates.warning_value !== undefined) rule.warning_value = updates.warning_value
  if (updates.block_value !== undefined) rule.block_value = updates.block_value
  if (updates.warning_level !== undefined) rule.warning_level = updates.warning_level
  if (updates.is_active !== undefined) rule.is_active = updates.is_active
}

export function addOverride(ruleKey: RuleKey, positionId: string, warnVal: number, blockVal: number): void {
  ruleOverrides.push({
    id: `ov-${Date.now()}`,
    rule_key: ruleKey,
    position_id: positionId,
    season_id: null,
    override_warning: warnVal,
    override_block: blockVal,
  })
}

export function removeOverride(id: string): void {
  const idx = ruleOverrides.findIndex(o => o.id === id)
  if (idx !== -1) ruleOverrides.splice(idx, 1)
}

export function addSeason(name: string, startDate: string, endDate: string): void {
  scheduleSeasons.push({
    id: `season-${Date.now()}`,
    name,
    start_date: startDate,
    end_date: endDate,
    is_active: true,
  })
}

export function removeSeason(id: string): void {
  const idx = scheduleSeasons.findIndex(s => s.id === id)
  if (idx !== -1) scheduleSeasons.splice(idx, 1)
}

export function acknowledgeWarning(warningId: string, userId: string): void {
  const w = warnings.find(w => w.id === warningId)
  if (w) {
    w.is_acknowledged = true
    w.acknowledged_by = userId
    w.acknowledged_at = new Date().toISOString()
  }
}

// Re-export helpers
export { getShiftHours, mockShifts, mockPositions, mockEmployees }
