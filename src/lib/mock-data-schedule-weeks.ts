import { getRegistrationWeekByWeek, getWeekDateRange, updateRegistrationStatusByWeekStart } from './mock-data-registration-weeks'
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

export interface ScheduleEditLog {
  id: string
  schedule_week_id: string
  assignment_id?: string
  employee_id: string
  date: string
  action: 'create' | 'update' | 'remove' | 'approve_from_registration'
  source: 'registration_review' | 'published_schedule_edit'
  before_state: ScheduleAssignment | null
  after_state: ScheduleAssignment | null
  changed_by: string
  changed_at: string
  reason?: string
}

export interface ScheduleApprovalLog {
  id: string
  schedule_week_id: string
  registration_week_id: string
  approved_by: string
  approved_at: string
  draft_change_count: number
  approved_assignment_count: number
  notes?: string
  snapshot: {
    totalRegistrations: number
    copiedFromRegistrations: number
    manualChanges: number
    skippedRegistrations: number
    finalPublishedAssignments: number
  }
}

export interface ScheduleChangeLog {
  id: string
  assignment_id: string
  action: 'create' | 'update' | 'cancel' | 'delete'
  before_state: ScheduleAssignment | null
  after_state: ScheduleAssignment | null
  changed_by: string
  changed_at: string
  reason: string
}

const WEEKS_KEY = 'homies_schedule_weeks'
const ASSIGNMENTS_KEY = 'homies_schedule_assignments'
const EDIT_LOGS_KEY = 'homies_schedule_edit_logs'
const APPROVAL_LOGS_KEY = 'homies_schedule_approval_logs'
const CHANGE_LOGS_KEY = 'homies_schedule_change_logs'

let scheduleWeeks: ScheduleWeek[] = []
let assignments: ScheduleAssignment[] = []
let editLogs: ScheduleEditLog[] = []
let approvalLogs: ScheduleApprovalLog[] = []
let changeLogs: ScheduleChangeLog[] = []
let initialized = false

function initScheduleWeekStore() {
  if (typeof window !== 'undefined') {
    const savedWeeks = localStorage.getItem(WEEKS_KEY)
    const savedAssignments = localStorage.getItem(ASSIGNMENTS_KEY)
    const savedEditLogs = localStorage.getItem(EDIT_LOGS_KEY)
    const savedApprovalLogs = localStorage.getItem(APPROVAL_LOGS_KEY)
    const savedChangeLogs = localStorage.getItem(CHANGE_LOGS_KEY)
    if (savedWeeks && savedAssignments) {
      scheduleWeeks = JSON.parse(savedWeeks)
      assignments = JSON.parse(savedAssignments)
      editLogs = savedEditLogs ? JSON.parse(savedEditLogs) : []
      approvalLogs = savedApprovalLogs ? JSON.parse(savedApprovalLogs) : []
      changeLogs = savedChangeLogs ? JSON.parse(savedChangeLogs) : []
      initialized = true
      return
    }
  }

  if (initialized) {
    return
  }

  scheduleWeeks = []
  assignments = []
  editLogs = []
  approvalLogs = []
  changeLogs = []
  initialized = true
}

function persistScheduleWeeks() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(WEEKS_KEY, JSON.stringify(scheduleWeeks))
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments))
    localStorage.setItem(EDIT_LOGS_KEY, JSON.stringify(editLogs))
    localStorage.setItem(APPROVAL_LOGS_KEY, JSON.stringify(approvalLogs))
    localStorage.setItem(CHANGE_LOGS_KEY, JSON.stringify(changeLogs))
  }
}

function buildAssignmentId(employeeId: string, date: string) {
  return `sched-assignment-${employeeId}-${date}`
}

export function clearScheduleWeekStore() {
  scheduleWeeks = []
  assignments = []
  editLogs = []
  approvalLogs = []
  changeLogs = []
  initialized = false

  if (typeof window !== 'undefined') {
    localStorage.removeItem(WEEKS_KEY)
    localStorage.removeItem(ASSIGNMENTS_KEY)
    localStorage.removeItem(EDIT_LOGS_KEY)
    localStorage.removeItem(APPROVAL_LOGS_KEY)
    localStorage.removeItem(CHANGE_LOGS_KEY)
  }
}

function buildEditLogId(scheduleWeekId: string) {
  return `schedule-edit-${scheduleWeekId}-${editLogs.length + 1}`
}

function buildApprovalLogId(scheduleWeekId: string) {
  return `schedule-approval-${scheduleWeekId}-${approvalLogs.length + 1}`
}

function appendEditLog(input: Omit<ScheduleEditLog, 'id' | 'changed_at'>) {
  editLogs.unshift({
    ...input,
    id: buildEditLogId(input.schedule_week_id),
    changed_at: new Date().toISOString(),
  })
}

function getScheduleWeekForStoreWeek(storeId: string, weekStart: string) {
  return scheduleWeeks.find((row) => row.store_id === storeId && row.week_start === weekStart)
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
  const scheduleWeek = getScheduleWeekForStoreWeek(storeId, weekStart)
  if (!scheduleWeek) {
    return []
  }

  return assignments.filter(
    (row) => row.schedule_week_id === scheduleWeek.id && row.status === 'draft'
  )
}

export function getScheduleEditLogsForWeek(storeId: string, weekStart: string): ScheduleEditLog[] {
  initScheduleWeekStore()
  const scheduleWeek = getScheduleWeekForStoreWeek(storeId, weekStart)
  if (!scheduleWeek) {
    return []
  }

  return editLogs.filter((row) => row.schedule_week_id === scheduleWeek.id)
}

export function getScheduleApprovalLogsForWeek(storeId: string, weekStart: string): ScheduleApprovalLog[] {
  initScheduleWeekStore()
  const scheduleWeek = getScheduleWeekForStoreWeek(storeId, weekStart)
  if (!scheduleWeek) {
    return []
  }

  return approvalLogs.filter((row) => row.schedule_week_id === scheduleWeek.id)
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
  const beforeState = existingIndex >= 0 ? assignments[existingIndex] : null

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

  appendEditLog({
    schedule_week_id: input.schedule_week_id,
    assignment_id: nextAssignment.id,
    employee_id: nextAssignment.employee_id,
    date: nextAssignment.date,
    action: beforeState ? 'update' : 'create',
    source: 'registration_review',
    before_state: beforeState,
    after_state: nextAssignment,
    changed_by: input.actor_id,
  })

  persistScheduleWeeks()
  return nextAssignment
}

export function removeDraftAssignment(storeId: string, weekStart: string, employeeId: string, date: string, actorId?: string) {
  initScheduleWeekStore()
  const scheduleWeek = getScheduleWeekForStoreWeek(storeId, weekStart)
  if (!scheduleWeek) {
    return
  }

  const existingAssignment = assignments.find(
    (row) => row.schedule_week_id === scheduleWeek.id && row.employee_id === employeeId && row.date === date && row.status === 'draft'
  )

  if (!existingAssignment) {
    return
  }

  assignments = assignments.filter(
    (row) => !(row.schedule_week_id === scheduleWeek.id && row.employee_id === employeeId && row.date === date && row.status === 'draft')
  )

  appendEditLog({
    schedule_week_id: scheduleWeek.id,
    assignment_id: existingAssignment.id,
    employee_id: existingAssignment.employee_id,
    date: existingAssignment.date,
    action: 'remove',
    source: 'registration_review',
    before_state: existingAssignment,
    after_state: null,
    changed_by: actorId || existingAssignment.updated_by,
  })

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

  const createdIds = new Set(created.map((assignment) => assignment.id))
  editLogs = editLogs.map((row) =>
    row.schedule_week_id === scheduleWeek.id && row.action === 'create' && row.assignment_id && createdIds.has(row.assignment_id)
      ? { ...row, action: 'approve_from_registration' }
      : row
  )

  persistScheduleWeeks()

  return {
    created: created.length,
    scheduleWeek,
  }
}

export function publishScheduleWeek(storeId: string, weekStart: string, actorId: string): ScheduleWeek {
  initScheduleWeekStore()
  const scheduleWeek = ensureDraftScheduleWeek(storeId, weekStart, actorId)
  const now = new Date().toISOString()
  const registrations = getSubmittedShiftRegistrationsForWeek(storeId, weekStart)
  const draftAssignments = assignments.filter(
    (row) => row.schedule_week_id === scheduleWeek.id && row.status === 'draft'
  )
  const copiedFromRegistrations = draftAssignments.filter(
    (row) => row.source_registration_id && registrations.some((registration) => registration.id === row.source_registration_id && registration.shift_id === row.shift_id)
  ).length
  const skippedRegistrations = registrations.filter(
    (registration) => !draftAssignments.some((assignment) => assignment.source_registration_id === registration.id && assignment.shift_id === registration.shift_id)
  ).length
  const manualChanges = Math.max(draftAssignments.length - copiedFromRegistrations, 0)

  scheduleWeeks = scheduleWeeks.map((row) =>
    row.id === scheduleWeek.id
      ? {
          ...row,
          status: 'published',
          published_at: now,
          published_by: actorId,
          updated_at: now,
        }
      : row
  )

  assignments = assignments.map((row) =>
    row.schedule_week_id === scheduleWeek.id && row.status === 'draft'
      ? { ...row, status: 'published', updated_at: now, updated_by: actorId }
      : row
  )

  const publishedAssignments = assignments.filter(
    (row) => row.schedule_week_id === scheduleWeek.id && row.status === 'published'
  )

  approvalLogs.unshift({
    id: buildApprovalLogId(scheduleWeek.id),
    schedule_week_id: scheduleWeek.id,
    registration_week_id: scheduleWeek.registration_week_id,
    approved_by: actorId,
    approved_at: now,
    draft_change_count: editLogs.filter((row) => row.schedule_week_id === scheduleWeek.id).length,
    approved_assignment_count: publishedAssignments.length,
    snapshot: {
      totalRegistrations: registrations.length,
      copiedFromRegistrations,
      manualChanges,
      skippedRegistrations,
      finalPublishedAssignments: publishedAssignments.length,
    },
  })

  updateRegistrationStatusByWeekStart(storeId, weekStart, 'published')
  persistScheduleWeeks()

  return scheduleWeeks.find((row) => row.id === scheduleWeek.id)!
}

export function getPublishedAssignmentsForEmployee(employeeId: string, weekStart: string): ScheduleAssignment[] {
  initScheduleWeekStore()
  return assignments
    .filter(
      (row) => row.employee_id === employeeId && row.status === 'published' && row.date >= weekStart && row.date <= getWeekDateRange(weekStart).week_end_date
    )
    .sort((left, right) => left.date.localeCompare(right.date))
}

export function updatePublishedAssignment(input: {
  assignmentId: string
  nextShiftId: string | null
  actorId: string
  changeReason: string
}) {
  initScheduleWeekStore()

  if (!input.changeReason.trim()) {
    throw new Error('Change reason is required after publish.')
  }

  const assignmentIndex = assignments.findIndex((row) => row.id === input.assignmentId)
  if (assignmentIndex < 0) {
    throw new Error('Published assignment not found.')
  }

  const current = assignments[assignmentIndex]
  if (current.status !== 'published') {
    throw new Error('Only published assignments can be updated here.')
  }

  const now = new Date().toISOString()
  const nextAssignment: ScheduleAssignment = {
    ...current,
    shift_id: input.nextShiftId || current.shift_id,
    status: input.nextShiftId ? 'published' : 'cancelled',
    modified_after_publish: true,
    change_reason: input.changeReason,
    updated_by: input.actorId,
    updated_at: now,
  }

  assignments[assignmentIndex] = nextAssignment
  changeLogs.push({
    id: `schedule-change-${current.id}-${changeLogs.length + 1}`,
    assignment_id: current.id,
    action: input.nextShiftId ? 'update' : 'cancel',
    before_state: current,
    after_state: nextAssignment,
    changed_by: input.actorId,
    changed_at: now,
    reason: input.changeReason,
  })
  persistScheduleWeeks()

  return nextAssignment
}

export function getReviewSummary(storeId: string, weekStart: string) {
  const registrations = getSubmittedShiftRegistrationsForWeek(storeId, weekStart)
  const draftAssignments = getDraftAssignmentsForWeek(storeId, weekStart)
  const assignmentKey = new Set(
    draftAssignments.map((row) => `${row.employee_id}:${row.date}:${row.shift_id}`)
  )

  return {
    totalRegistrations: registrations.length,
    draftAssignments: draftAssignments.length,
    skippedRegistrations: registrations.filter(
      (row) => !assignmentKey.has(`${row.employee_id}:${row.date}:${row.shift_id}`)
    ).length,
    unassignedEmployees: 0,
  }
}
