import { getRegistrationWeekByWeek, getWeekDateRange } from './mock-data-registration-weeks'
import { getSubmittedShiftRegistrationsForWeek } from './mock-data-shift-registrations'

export interface ScheduleWeek {
  id: string
  registration_week_id: string
  store_id: string
  week_start: string
  week_end: string
  status: 'draft' | 'published'
  published_at?: string
  published_by?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ScheduleAssignment {
  id: string
  schedule_week_id: string
  employee_id: string
  store_id: string
  date: string
  shift_id: string
  status: 'draft' | 'published' | 'cancelled'
  source_registration_id?: string
  modified_after_publish: boolean
  change_reason?: string
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

const WEEKS_KEY = 'homies_schedule_weeks'
const ASSIGNMENTS_KEY = 'homies_schedule_assignments'

let scheduleWeeks: ScheduleWeek[] = []
let assignments: ScheduleAssignment[] = []
let initialized = false

function initScheduleWeekStore() {
  if (typeof window !== 'undefined') {
    const savedWeeks = localStorage.getItem(WEEKS_KEY)
    const savedAssignments = localStorage.getItem(ASSIGNMENTS_KEY)
    if (savedWeeks && savedAssignments) {
      scheduleWeeks = JSON.parse(savedWeeks)
      assignments = JSON.parse(savedAssignments)
      initialized = true
      return
    }
  }

  if (initialized) {
    return
  }

  scheduleWeeks = []
  assignments = []
  initialized = true
}

function persistScheduleWeeks() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(WEEKS_KEY, JSON.stringify(scheduleWeeks))
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments))
  }
}

function buildAssignmentId(employeeId: string, date: string) {
  return `sched-assignment-${employeeId}-${date}`
}

export function clearScheduleWeekStore() {
  scheduleWeeks = []
  assignments = []
  initialized = false

  if (typeof window !== 'undefined') {
    localStorage.removeItem(WEEKS_KEY)
    localStorage.removeItem(ASSIGNMENTS_KEY)
  }
}

export function ensureDraftScheduleWeek(storeId: string, weekStart: string, actorId: string): ScheduleWeek {
  initScheduleWeekStore()
  const existing = scheduleWeeks.find((row) => row.store_id === storeId && row.week_start === weekStart)
  if (existing) {
    return existing
  }

  const registrationWeek = getRegistrationWeekByWeek(storeId, weekStart)
  if (!registrationWeek) {
    throw new Error('Registration week not found.')
  }

  const now = new Date().toISOString()
  const scheduleWeek: ScheduleWeek = {
    id: `schedule-week-${storeId}-${weekStart}`,
    registration_week_id: registrationWeek.id,
    store_id: storeId,
    week_start: weekStart,
    week_end: registrationWeek.week_end_date || getWeekDateRange(weekStart).week_end_date,
    status: 'draft',
    created_at: now,
    updated_at: now,
    published_by: actorId,
  }

  scheduleWeeks.push(scheduleWeek)
  persistScheduleWeeks()
  return scheduleWeek
}

export function getDraftAssignmentsForWeek(storeId: string, weekStart: string): ScheduleAssignment[] {
  initScheduleWeekStore()
  const scheduleWeek = scheduleWeeks.find((row) => row.store_id === storeId && row.week_start === weekStart)
  if (!scheduleWeek) {
    return []
  }

  return assignments.filter(
    (row) => row.schedule_week_id === scheduleWeek.id && row.status === 'draft'
  )
}

export function upsertDraftAssignment(input: {
  schedule_week_id: string
  employee_id: string
  store_id: string
  date: string
  shift_id: string
  source_registration_id?: string
  actor_id: string
}): ScheduleAssignment {
  initScheduleWeekStore()
  const now = new Date().toISOString()
  const existingIndex = assignments.findIndex(
    (row) => row.schedule_week_id === input.schedule_week_id && row.employee_id === input.employee_id && row.date === input.date
  )

  const nextAssignment: ScheduleAssignment = {
    id: buildAssignmentId(input.employee_id, input.date),
    schedule_week_id: input.schedule_week_id,
    employee_id: input.employee_id,
    store_id: input.store_id,
    date: input.date,
    shift_id: input.shift_id,
    status: 'draft',
    source_registration_id: input.source_registration_id,
    modified_after_publish: false,
    created_by: input.actor_id,
    updated_by: input.actor_id,
    created_at: existingIndex >= 0 ? assignments[existingIndex].created_at : now,
    updated_at: now,
  }

  if (existingIndex >= 0) {
    assignments[existingIndex] = nextAssignment
  } else {
    assignments.push(nextAssignment)
  }

  persistScheduleWeeks()
  return nextAssignment
}

export function removeDraftAssignment(storeId: string, weekStart: string, employeeId: string, date: string) {
  initScheduleWeekStore()
  const scheduleWeek = scheduleWeeks.find((row) => row.store_id === storeId && row.week_start === weekStart)
  if (!scheduleWeek) {
    return
  }

  assignments = assignments.filter(
    (row) => !(row.schedule_week_id === scheduleWeek.id && row.employee_id === employeeId && row.date === date && row.status === 'draft')
  )
  persistScheduleWeeks()
}

export function bulkApproveRegistrationsToDraft(storeId: string, weekStart: string, actorId: string) {
  initScheduleWeekStore()
  const registrations = getSubmittedShiftRegistrationsForWeek(storeId, weekStart)
  const scheduleWeek = ensureDraftScheduleWeek(storeId, weekStart, actorId)

  const created = registrations.map((registration) =>
    upsertDraftAssignment({
      schedule_week_id: scheduleWeek.id,
      employee_id: registration.employee_id,
      store_id: storeId,
      date: registration.date,
      shift_id: registration.shift_id,
      source_registration_id: registration.id,
      actor_id: actorId,
    })
  )

  return {
    created: created.length,
    scheduleWeek,
  }
}
