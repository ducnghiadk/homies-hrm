import { assertRegistrationWeekOpen } from './mock-data-registration-weeks'

export interface ShiftRegistration {
  id: string
  registration_week_id: string
  employee_id: string
  store_id: string
  week_start_date: string
  date: string
  shift_id: string
  status: 'draft' | 'submitted' | 'withdrawn'
  note?: string
  submitted_at?: string
  created_at: string
  updated_at: string
}

const STORAGE_KEY = 'homies_shift_registrations'

let registrations: ShiftRegistration[] = []
let initialized = false

function initShiftRegistrations() {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      registrations = JSON.parse(saved)
      initialized = true
      return
    }
  }

  if (initialized) {
    return
  }

  registrations = []
  initialized = true
}

function persistRegistrations() {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(registrations))
  }
}

function removeExistingEmployeeRegistrations(employeeId: string, weekStartDate: string) {
  registrations = registrations.filter(
    (row) => !(row.employee_id === employeeId && row.week_start_date === weekStartDate)
  )
}

export function clearShiftRegistrations() {
  registrations = []
  initialized = false

  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEY)
  }
}

export function getShiftRegistrationsForWeek(storeId: string, weekStartDate: string): ShiftRegistration[] {
  initShiftRegistrations()
  return registrations.filter(
    (row) => row.store_id === storeId && row.week_start_date === weekStartDate
  )
}

export function getEmployeeShiftRegistrationsForWeek(employeeId: string, weekStartDate: string): ShiftRegistration[] {
  initShiftRegistrations()
  return registrations
    .filter((row) => row.employee_id === employeeId && row.week_start_date === weekStartDate)
    .sort((left, right) => left.date.localeCompare(right.date))
}

export function getSubmittedShiftRegistrationsForWeek(storeId: string, weekStartDate: string): ShiftRegistration[] {
  initShiftRegistrations()
  return registrations
    .filter(
      (row) => row.store_id === storeId && row.week_start_date === weekStartDate && row.status === 'submitted'
    )
    .sort((left, right) => left.date.localeCompare(right.date))
}

export function saveShiftRegistrations(
  employeeId: string,
  storeId: string,
  weekStartDate: string,
  rows: Array<{ date: string; shift_id: string }>,
  status: 'draft' | 'submitted',
  note?: string,
): ShiftRegistration[] {
  initShiftRegistrations()

  const week = assertRegistrationWeekOpen(storeId, weekStartDate)
  const seenDates = new Set<string>()

  rows.forEach((row) => {
    if (seenDates.has(row.date)) {
      throw new Error('Only one shift registration per employee per day is allowed.')
    }
    seenDates.add(row.date)
  })

  removeExistingEmployeeRegistrations(employeeId, weekStartDate)

  const now = new Date().toISOString()
  const saved = rows.map((row, index) => ({
    id: `shift-reg-${employeeId}-${row.date}-${index}`,
    registration_week_id: week.id,
    employee_id: employeeId,
    store_id: storeId,
    week_start_date: weekStartDate,
    date: row.date,
    shift_id: row.shift_id,
    status,
    note,
    submitted_at: status === 'submitted' ? now : undefined,
    created_at: now,
    updated_at: now,
  }))

  registrations.push(...saved)
  persistRegistrations()

  return saved
}
