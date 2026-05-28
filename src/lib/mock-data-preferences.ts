// =============================================
// Shift Preferences — Mock data store
// =============================================

export type ShiftPreferenceLevel = 'preferred' | 'available' | 'unavailable'

export interface ShiftPreference {
  id: string
  user_id: string
  week_start_date: string   // yyyy-MM-dd of Monday
  date: string              // yyyy-MM-dd
  morning_available: boolean
  afternoon_available: boolean
  evening_available: boolean
  not_available: boolean
  shift_preferences?: Record<string, boolean>
  shift_preference_levels?: Record<string, ShiftPreferenceLevel>
  reason?: string
  note?: string
  status: 'draft' | 'submitted'
  submitted_at?: string
  created_at: string
}

const LEGACY_SHIFT_FIELD_MAP = {
  'shift-001': 'morning_available',
  'shift-002': 'afternoon_available',
  'shift-003': 'evening_available',
} as const

type LegacyShiftField = typeof LEGACY_SHIFT_FIELD_MAP[keyof typeof LEGACY_SHIFT_FIELD_MAP]

let prefCounter = 100

// ─── Seed data: week 2026-02-23 → 2026-03-01 ───
const SEED_WEEK = '2026-02-23'

function sp(
  id: string, userId: string, date: string,
  m: boolean, a: boolean, e: boolean,
  na: boolean = false, reason?: string,
): ShiftPreference {
  return {
    id, user_id: userId, week_start_date: SEED_WEEK, date,
    morning_available: m, afternoon_available: a, evening_available: e,
    shift_preferences: {
      'shift-001': m,
      'shift-002': a,
      'shift-003': e,
    },
    not_available: na, reason, note: '', status: 'submitted' as const,
    submitted_at: '2026-02-20T10:00:00', created_at: '2026-02-20T10:00:00',
  }
}

const preferences: ShiftPreference[] = [
  // ── emp-005: Pha chế, Store-001 — rảnh T2,T4,T6 ca sáng; T3,T5 cả ngày ──
  sp('seed-001','emp-005','2026-02-23', true, false, false),        // CN: sáng only
  sp('seed-002','emp-005','2026-02-24', true, false, false),        // T2: sáng
  sp('seed-003','emp-005','2026-02-25', true, true, true),          // T3: cả ngày
  sp('seed-004','emp-005','2026-02-26', true, false, false),        // T4: sáng
  sp('seed-005','emp-005','2026-02-27', true, true, true),          // T5: cả ngày
  sp('seed-006','emp-005','2026-02-28', true, false, false),        // T6: sáng
  sp('seed-007','emp-005','2026-03-01', false, false, false, true, 'Đi đám cưới'), // T7: off

  // ── emp-006: Thu ngân, Store-001 — rảnh T3,T5 cả ngày; T7 ca sáng ──
  sp('seed-008','emp-006','2026-02-23', false, true, true),         // CN: chiều+tối
  sp('seed-009','emp-006','2026-02-24', false, false, true),        // T2: tối only
  sp('seed-010','emp-006','2026-02-25', true, true, true),          // T3: cả ngày
  sp('seed-011','emp-006','2026-02-26', false, true, false),        // T4: chiều
  sp('seed-012','emp-006','2026-02-27', true, true, true),          // T5: cả ngày
  sp('seed-013','emp-006','2026-02-28', false, false, false, true, 'Có lịch học'), // T6: off
  sp('seed-014','emp-006','2026-03-01', true, false, false),        // T7: sáng

  // ── emp-007: Phục vụ, Store-001 — rảnh cuối tuần cả ngày; T2-T6 ca chiều ──
  sp('seed-015','emp-007','2026-02-23', true, true, true),          // CN: cả ngày
  sp('seed-016','emp-007','2026-02-24', false, true, false),        // T2: chiều
  sp('seed-017','emp-007','2026-02-25', false, true, false),        // T3: chiều
  sp('seed-018','emp-007','2026-02-26', false, true, false),        // T4: chiều
  sp('seed-019','emp-007','2026-02-27', false, true, false),        // T5: chiều
  sp('seed-020','emp-007','2026-02-28', false, true, false),        // T6: chiều
  sp('seed-021','emp-007','2026-03-01', true, true, true),          // T7: cả ngày

  // ── emp-008: Pha chế, Store-002 — rảnh T2-T6 ca sáng+chiều ──
  sp('seed-022','emp-008','2026-02-23', false, false, false, true, 'Chủ nhật nghỉ'),
  sp('seed-023','emp-008','2026-02-24', true, true, false),         // T2: sáng+chiều
  sp('seed-024','emp-008','2026-02-25', true, true, false),         // T3
  sp('seed-025','emp-008','2026-02-26', true, true, false),         // T4
  sp('seed-026','emp-008','2026-02-27', true, true, false),         // T5
  sp('seed-027','emp-008','2026-02-28', true, true, false),         // T6
  sp('seed-028','emp-008','2026-03-01', true, false, false),        // T7: sáng only

  // ── emp-009: Pha chế, Store-002 — rảnh chiều+tối hầu hết ──
  sp('seed-029','emp-009','2026-02-23', false, true, true),         // CN
  sp('seed-030','emp-009','2026-02-24', false, true, true),         // T2
  sp('seed-031','emp-009','2026-02-25', false, false, true),        // T3: tối only
  sp('seed-032','emp-009','2026-02-26', false, true, true),         // T4
  sp('seed-033','emp-009','2026-02-27', false, false, false, true, 'Thi cuối kỳ'), // T5: off
  sp('seed-034','emp-009','2026-02-28', false, true, true),         // T6
  sp('seed-035','emp-009','2026-03-01', true, true, true),          // T7: cả ngày

  // ── emp-010: Thu ngân, Store-002 — rảnh sáng T2,T4,T6 ──
  sp('seed-036','emp-010','2026-02-23', true, true, false),         // CN
  sp('seed-037','emp-010','2026-02-24', true, false, false),        // T2: sáng
  sp('seed-038','emp-010','2026-02-25', false, true, false),        // T3: chiều
  sp('seed-039','emp-010','2026-02-26', true, false, false),        // T4: sáng
  sp('seed-040','emp-010','2026-02-27', false, true, false),        // T5: chiều
  sp('seed-041','emp-010','2026-02-28', true, false, false),        // T6: sáng
  sp('seed-042','emp-010','2026-03-01', false, false, false, true, 'Nghỉ bù'), // T7: off

  // ── emp-012: Pha chế, Store-003 — cả tuần sáng+chiều ──
  sp('seed-043','emp-012','2026-02-23', true, true, false),         // CN
  sp('seed-044','emp-012','2026-02-24', true, true, false),         // T2
  sp('seed-045','emp-012','2026-02-25', true, true, false),         // T3
  sp('seed-046','emp-012','2026-02-26', true, true, false),         // T4
  sp('seed-047','emp-012','2026-02-27', true, true, false),         // T5
  sp('seed-048','emp-012','2026-02-28', true, true, false),         // T6
  sp('seed-049','emp-012','2026-03-01', true, true, false),         // T7

  // ── emp-013: Thu ngân, Store-003 — rảnh T2,T3,T4 cả ngày; T5-T7 off ──
  sp('seed-050','emp-013','2026-02-23', false, false, false, true, 'Nghỉ CN'),
  sp('seed-051','emp-013','2026-02-24', true, true, true),          // T2: cả ngày
  sp('seed-052','emp-013','2026-02-25', true, true, true),          // T3: cả ngày
  sp('seed-053','emp-013','2026-02-26', true, true, true),          // T4: cả ngày
  sp('seed-054','emp-013','2026-02-27', false, false, false, true, 'Đi Đà Lạt'),
  sp('seed-055','emp-013','2026-02-28', false, false, false, true, 'Đi Đà Lạt'),
  sp('seed-056','emp-013','2026-03-01', false, false, false, true, 'Đi Đà Lạt'),
]

// ─── CRUD ───

export function getPreferencesForWeek(userId: string, weekStart: string): ShiftPreference[] {
  return preferences.filter(p => p.user_id === userId && p.week_start_date === weekStart)
}

export function getPreferenceForDate(userId: string, date: string): ShiftPreference | undefined {
  return preferences.find(p => p.user_id === userId && p.date === date)
}

export function getAllPreferencesForWeek(weekStart: string): ShiftPreference[] {
  return preferences.filter(p => p.week_start_date === weekStart && p.status === 'submitted')
}

function buildLegacyShiftPreferences(input: {
  morning: boolean
  afternoon: boolean
  evening: boolean
}): Record<string, boolean> {
  return {
    'shift-001': input.morning,
    'shift-002': input.afternoon,
    'shift-003': input.evening,
  }
}

function buildLegacyShiftPreferenceLevels(input: {
  morning: boolean
  afternoon: boolean
  evening: boolean
}): Record<string, ShiftPreferenceLevel> {
  return {
    'shift-001': input.morning ? 'preferred' : 'unavailable',
    'shift-002': input.afternoon ? 'preferred' : 'unavailable',
    'shift-003': input.evening ? 'preferred' : 'unavailable',
  }
}

function getLegacyFieldForShiftTemplate(shiftTemplateId: string): LegacyShiftField | null {
  return LEGACY_SHIFT_FIELD_MAP[shiftTemplateId as keyof typeof LEGACY_SHIFT_FIELD_MAP] || null
}

export function getShiftPreferenceAvailability(preference: ShiftPreference, shiftTemplateId: string): boolean {
  if (preference.not_available) return false
  const level = preference.shift_preference_levels?.[shiftTemplateId]
  if (level) return level !== 'unavailable'
  if (typeof preference.shift_preferences?.[shiftTemplateId] === 'boolean') {
    return preference.shift_preferences[shiftTemplateId]
  }

  const legacyField = getLegacyFieldForShiftTemplate(shiftTemplateId)
  return legacyField ? preference[legacyField] : false
}

export function getShiftPreferenceLevel(preference: ShiftPreference, shiftTemplateId: string): ShiftPreferenceLevel {
  if (preference.not_available) return 'unavailable'
  const level = preference.shift_preference_levels?.[shiftTemplateId]
  if (level) return level
  return getShiftPreferenceAvailability(preference, shiftTemplateId) ? 'preferred' : 'unavailable'
}

import { mockEmployees } from './mock-data'

type StoredRegistrationWeek = {
  store_id: string
  week_start_date: string
  status: string
  registration_deadline: string
}

export function savePreferences(
  userId: string,
  weekStart: string,
  days: {
    date: string
    morning: boolean
    afternoon: boolean
    evening: boolean
    notAvailable: boolean
    shiftPreferences?: Record<string, boolean>
    shiftPreferenceLevels?: Record<string, ShiftPreferenceLevel>
    reason?: string
  }[],
  note: string,
  status: 'draft' | 'submitted',
): ShiftPreference[] {
  // Security & Validation checks
  if (typeof window !== 'undefined') {
    const savedWeeks = localStorage.getItem('homies_registration_weeks')
    if (savedWeeks) {
      const weeks = JSON.parse(savedWeeks) as StoredRegistrationWeek[]
      const emp = mockEmployees.find(e => e.id === userId)
      if (emp) {
        const week = weeks.find(w => w.store_id === emp.store_id && w.week_start_date === weekStart)
        if (week) {
          const now = new Date()
          const deadline = new Date(week.registration_deadline)
          if (week.status !== 'open') {
            throw new Error(`Đợt đăng ký ca rảnh đã khóa (Trạng thái đợt xếp ca hiện tại: ${week.status})`)
          }
          if (now > deadline) {
            throw new Error('Không thể đăng ký ca do đã quá hạn chót đăng ký!')
          }
        }
      }
    }
  }

  // Remove existing preferences for this user+week
  const toRemove = preferences
    .map((p, i) => (p.user_id === userId && p.week_start_date === weekStart ? i : -1))
    .filter(i => i >= 0)
    .reverse()
  toRemove.forEach(i => preferences.splice(i, 1))

  const now = new Date().toISOString()
  const result: ShiftPreference[] = []

  days.forEach(day => {
    const record: ShiftPreference = {
      id: `pref-${prefCounter++}`,
      user_id: userId,
      week_start_date: weekStart,
      date: day.date,
      morning_available: day.morning,
      afternoon_available: day.afternoon,
      evening_available: day.evening,
      shift_preferences: day.shiftPreferences || buildLegacyShiftPreferences(day),
      shift_preference_levels: day.shiftPreferenceLevels || buildLegacyShiftPreferenceLevels(day),
      not_available: day.notAvailable,
      reason: day.reason,
      note,
      status,
      submitted_at: status === 'submitted' ? now : undefined,
      created_at: now,
    }
    preferences.push(record)
    result.push(record)
  })

  return result
}

export function getPreferenceStatus(userId: string, weekStart: string): 'none' | 'draft' | 'submitted' {
  const prefs = getPreferencesForWeek(userId, weekStart)
  if (prefs.length === 0) return 'none'
  return prefs[0].status
}
