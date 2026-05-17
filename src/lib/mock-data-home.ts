// ============================================
// Mock data for Home Page dashboards
// ============================================

import {
  mockEmployees,
  mockSchedules,
  mockAttendances,
  mockStores,
  getShiftById,
  type Schedule,
  type Attendance,
} from './mock-data'
import { getPendingLeaveRequests } from './mock-data-leave'

// ============================================
// KPI Scores
// ============================================
export type KPIScore = {
  employee_id: string
  month: string // '2026-02'
  score: number // 0–100
  grade: 'A' | 'B' | 'C' | 'D'
}

// KPI grade helper (used by inline data)
function getGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  return 'D'
}
void getGrade // suppress unused warning

const currentMonth = new Date().toISOString().slice(0, 7)

export const mockKPIScores: KPIScore[] = [
  { employee_id: 'emp-005', month: currentMonth, score: 88, grade: 'B' },
  { employee_id: 'emp-006', month: currentMonth, score: 72, grade: 'C' },
  { employee_id: 'emp-007', month: currentMonth, score: 45, grade: 'D' },
  { employee_id: 'emp-008', month: currentMonth, score: 95, grade: 'A' },
  { employee_id: 'emp-009', month: currentMonth, score: 81, grade: 'B' },
  { employee_id: 'emp-010', month: currentMonth, score: 67, grade: 'C' },
  { employee_id: 'emp-011', month: currentMonth, score: 58, grade: 'D' },
  { employee_id: 'emp-012', month: currentMonth, score: 92, grade: 'A' },
  { employee_id: 'emp-013', month: currentMonth, score: 77, grade: 'B' },
  { employee_id: 'emp-014', month: currentMonth, score: 63, grade: 'C' },
  { employee_id: 'emp-015', month: currentMonth, score: 85, grade: 'B' },
  { employee_id: 'emp-004', month: currentMonth, score: 90, grade: 'A' },
]

export function getEmployeeKPI(employeeId: string): KPIScore | undefined {
  return mockKPIScores.find(k => k.employee_id === employeeId && k.month === currentMonth)
}

// ============================================
// Dashboard Helpers
// ============================================
const todayStr = () => new Date().toISOString().split('T')[0]

/** Get 7 week dates (Mon → Sun) for current week */
export function getCurrentWeekDates(): string[] {
  const now = new Date()
  const day = now.getDay() // 0=Sun, 1=Mon
  const monday = new Date(now)
  monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

/** Get today's schedule for one employee */
export function getTodaySchedule(employeeId: string): Schedule | undefined {
  return mockSchedules.find(s => s.employee_id === employeeId && s.date === todayStr())
}

/** Get this week's schedules for one employee */
export function getWeekSchedules(employeeId: string): { date: string; schedule?: Schedule }[] {
  const weekDates = getCurrentWeekDates()
  return weekDates.map(date => ({
    date,
    schedule: mockSchedules.find(s => s.employee_id === employeeId && s.date === date),
  }))
}

/** Get today's attendance for one employee */
export function getTodayAtt(employeeId: string): Attendance | undefined {
  return mockAttendances.find(a => a.employee_id === employeeId && a.date === todayStr())
}

/** Check-in status for an employee */
export type CheckinStatus = 'not_checked_in' | 'checked_in' | 'checked_out'

export function getCheckinStatus(employeeId: string): CheckinStatus {
  const att = getTodayAtt(employeeId)
  if (!att || !att.check_in_time) return 'not_checked_in'
  if (att.check_out_time) return 'checked_out'
  return 'checked_in'
}

/** Get all employees scheduled today at a given store, with their attendance */
export function getStoreTodayCrewList(storeId: string) {
  const today = todayStr()
  const schedules = mockSchedules.filter(s => s.store_id === storeId && s.date === today)
  return schedules.map(sch => {
    const emp = mockEmployees.find(e => e.id === sch.employee_id)
    const att = mockAttendances.find(a => a.employee_id === sch.employee_id && a.date === today)
    const shift = getShiftById(sch.shift_id)
    let status: 'not_arrived' | 'checked_in' | 'checked_out' = 'not_arrived'
    if (att?.check_out_time) status = 'checked_out'
    else if (att?.check_in_time) status = 'checked_in'

    return {
      employee: emp!,
      shift,
      attendance: att,
      status,
      checkinTime: att?.check_in_time,
    }
  })
}

/** Get store attendance summary for today */
export function getStoreAttendanceSummary(storeId: string) {
  const crew = getStoreTodayCrewList(storeId)
  const total = crew.length
  const checkedIn = crew.filter(c => c.status === 'checked_in' || c.status === 'checked_out').length
  const notArrived = crew.filter(c => c.status === 'not_arrived').length
  const late = crew.filter(c => c.attendance?.status === 'late').length
  return { total, checkedIn, notArrived, late }
}

/** Get all stores attendance summary (for admin dashboard) */
export function getAllStoresAttendanceSummary() {
  return mockStores.filter(s => s.is_active).map(store => ({
    store,
    ...getStoreAttendanceSummary(store.id),
  }))
}

/** Count global stats for admin dashboard */
export function getAdminStats() {
  const today = todayStr()
  const activeEmployees = mockEmployees.filter(e => e.status === 'active').length
  const activeStores = mockStores.filter(s => s.is_active).length
  const todayAttendances = mockAttendances.filter(a => a.date === today)
  const currentlyWorking = todayAttendances.filter(a => a.check_in_time && !a.check_out_time).length
  const pendingLeaves = getPendingLeaveRequests().length

  return { activeEmployees, activeStores, currentlyWorking, pendingLeaves }
}

/** Get top 5 pending leave requests (for admin) */
export function getRecentPendingLeaves() {
  return getPendingLeaveRequests().slice(0, 5)
}

/** Get pending leave count for a store */
export function getStorePendingLeaveCount(storeId: string): number {
  const storeEmpIds = mockEmployees.filter(e => e.store_id === storeId).map(e => e.id)
  return getPendingLeaveRequests().filter(r => storeEmpIds.includes(r.employee_id)).length
}

/** Vietnamese day labels */
export const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
