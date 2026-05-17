// =============================================
// HRM Trà Sữa 🧋 — Understaffing Alert Service
// Phase 3E: Real-time staffing gap detection
// =============================================

import {
  checkStaffingWarnings,
  getRequiredStaff,
  getAssignedStaff,
  type StaffingWarning,
} from './mock-data-staffing'
import {
  mockSchedules, mockEmployees, mockStores, mockShifts,
  mockNotifications, getShiftById,
  type Schedule,
} from './mock-data'
import { format, addDays, startOfWeek } from 'date-fns'

// ══════════════════════════════════════
// TYPES
// ══════════════════════════════════════

export interface UnderstaffingAlert {
  id: string
  store_id: string
  store_name: string
  date: string
  shift_id: string
  shift_name: string
  position_id: string
  position_name: string
  required: number
  assigned: number
  shortage: number
  level: 'critical' | 'warning' | 'info'
  message: string
  created_at: string
}

export interface StaffingStatus {
  hasAlerts: boolean
  criticalCount: number
  warningCount: number
  alerts: UnderstaffingAlert[]
}

export interface LeaveStaffingImpact {
  willCauseUnderstaffing: boolean
  affectedDays: {
    date: string
    shift_name: string
    currentStaff: number
    afterLeave: number
    required: number
    status: 'ok' | 'warning' | 'critical'
  }[]
  recommendation: string
}

export interface AllStoresStaffingStatus {
  totalAlerts: number
  criticalCount: number
  byStore: { storeId: string; storeName: string; alertCount: number; criticalCount: number }[]
  topAlerts: UnderstaffingAlert[]
}

// ══════════════════════════════════════
// HELPERS
// ══════════════════════════════════════

let alertCounter = 0

function warningToAlert(
  w: StaffingWarning,
  storeId: string,
  storeName: string,
): UnderstaffingAlert {
  const level: UnderstaffingAlert['level'] =
    w.type === 'missing_mandatory' ? 'critical' :
    w.level === 'block' ? 'critical' :
    w.level === 'warning' ? 'warning' : 'info'

  return {
    id: `usa-${++alertCounter}`,
    store_id: storeId,
    store_name: storeName,
    date: w.date,
    shift_id: w.shift_id,
    shift_name: w.shift_name,
    position_id: '',
    position_name: w.position_name,
    required: w.required,
    assigned: w.assigned,
    shortage: Math.max(0, w.required - w.assigned),
    level,
    message: w.message,
    created_at: new Date().toISOString(),
  }
}

function getStoreName(storeId: string): string {
  return mockStores.find(s => s.id === storeId)?.name ?? storeId
}

function getWeekDates(weekStartDate?: string): string[] {
  const start = weekStartDate
    ? new Date(weekStartDate)
    : startOfWeek(new Date(), { weekStartsOn: 1 })
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(start, i), 'yyyy-MM-dd'),
  )
}

// ══════════════════════════════════════
// 1. CHECK SINGLE DAY
// ══════════════════════════════════════

export function checkDayUnderstaffing(
  storeId: string,
  date: string,
): UnderstaffingAlert[] {
  const storeName = getStoreName(storeId)
  const alerts: UnderstaffingAlert[] = []

  for (const shift of mockShifts) {
    const required = getRequiredStaff(storeId, shift.id, date)
    const assigned = getAssignedStaff(storeId, date, shift.id, mockSchedules, mockEmployees)

    for (const req of required) {
      const asg = assigned.find(a => a.position_id === req.position_id)
      const count = asg?.count ?? 0
      const diff = count - req.required

      if (diff < 0) {
        const isMandatory = req.is_mandatory && count === 0
        alerts.push({
          id: `usa-${++alertCounter}`,
          store_id: storeId,
          store_name: storeName,
          date,
          shift_id: shift.id,
          shift_name: shift.name,
          position_id: req.position_id,
          position_name: req.position_name,
          required: req.required,
          assigned: count,
          shortage: Math.abs(diff),
          level: isMandatory ? 'critical' : diff <= -2 ? 'warning' : 'info',
          message: isMandatory
            ? `${shift.name} không có ${req.position_name}`
            : `${shift.name} thiếu ${Math.abs(diff)} ${req.position_name}`,
          created_at: new Date().toISOString(),
        })
      }
    }
  }

  // Sort: critical → warning → info
  const order = { critical: 0, warning: 1, info: 2 }
  return alerts.sort((a, b) => order[a.level] - order[b.level])
}

// ══════════════════════════════════════
// 2. CHECK WEEK (for Dashboard)
// ══════════════════════════════════════

export function checkWeekUnderstaffing(
  storeId: string,
  weekStartDate?: string,
): StaffingStatus {
  const storeName = getStoreName(storeId)
  const weekDates = getWeekDates(weekStartDate)

  // Use existing checkStaffingWarnings (only shortage/missing_mandatory)
  const warnings = checkStaffingWarnings(storeId, weekDates, mockSchedules, mockEmployees)
    .filter(w => w.type === 'shortage' || w.type === 'missing_mandatory')

  const alerts = warnings.map(w => warningToAlert(w, storeId, storeName))

  return {
    hasAlerts: alerts.length > 0,
    criticalCount: alerts.filter(a => a.level === 'critical').length,
    warningCount: alerts.filter(a => a.level === 'warning').length,
    alerts,
  }
}

// ══════════════════════════════════════
// 3. CHECK ALL STORES (Admin/HR view)
// ══════════════════════════════════════

export function checkAllStoresUnderstaffing(): AllStoresStaffingStatus {
  const activeStores = mockStores.filter(s => s.is_active)
  let totalAlerts = 0
  let criticalCount = 0
  const byStore: AllStoresStaffingStatus['byStore'] = []
  let allAlerts: UnderstaffingAlert[] = []

  for (const store of activeStores) {
    const status = checkWeekUnderstaffing(store.id)
    totalAlerts += status.alerts.length
    criticalCount += status.criticalCount
    byStore.push({
      storeId: store.id,
      storeName: store.name,
      alertCount: status.alerts.length,
      criticalCount: status.criticalCount,
    })
    allAlerts = allAlerts.concat(status.alerts)
  }

  // Top 5 critical first
  const order = { critical: 0, warning: 1, info: 2 }
  const topAlerts = allAlerts
    .sort((a, b) => order[a.level] - order[b.level])
    .slice(0, 5)

  return { totalAlerts, criticalCount, byStore, topAlerts }
}

// ══════════════════════════════════════
// 4. CHECK LEAVE IMPACT ON STAFFING
// ══════════════════════════════════════

export function checkLeaveImpactOnStaffing(
  employeeId: string,
  startDate: string,
  endDate: string,
): LeaveStaffingImpact {
  const emp = mockEmployees.find(e => e.id === employeeId)
  if (!emp) {
    return { willCauseUnderstaffing: false, affectedDays: [], recommendation: 'Có thể duyệt' }
  }

  const storeId = emp.store_id
  const affectedDays: LeaveStaffingImpact['affectedDays'] = []

  // Iterate each date in leave range
  let current = new Date(startDate)
  const end = new Date(endDate)

  while (current <= end) {
    const dateStr = format(current, 'yyyy-MM-dd')
    const dayOfWeek = current.getDay()

    // Skip weekends
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      // Find which shift the employee is scheduled for this day
      const empSchedules = mockSchedules.filter(
        (s: Schedule) => s.employee_id === employeeId && s.date === dateStr,
      )

      for (const sch of empSchedules) {
        const shift = getShiftById(sch.shift_id)
        if (!shift) continue

        // Get current staffing for this position
        const required = getRequiredStaff(storeId, sch.shift_id, dateStr)
        const assigned = getAssignedStaff(storeId, dateStr, sch.shift_id, mockSchedules, mockEmployees)

        // Find matching position requirement
        const posReq = required.find(r => r.position_id === emp.position_id)
        const posAsg = assigned.find(a => a.position_id === emp.position_id)

        if (posReq) {
          const currentCount = posAsg?.count ?? 0
          const afterLeave = currentCount - 1

          let status: 'ok' | 'warning' | 'critical' = 'ok'
          if (afterLeave < posReq.required) {
            status = posReq.is_mandatory && afterLeave === 0 ? 'critical' : 'warning'
          }

          affectedDays.push({
            date: dateStr,
            shift_name: shift.name,
            currentStaff: currentCount,
            afterLeave,
            required: posReq.required,
            status,
          })
        }
      }
    }

    current = addDays(current, 1)
  }

  const willCauseUnderstaffing = affectedDays.some(d => d.status !== 'ok')
  const criticalDays = affectedDays.filter(d => d.status === 'critical').length
  const warningDays = affectedDays.filter(d => d.status === 'warning').length

  let recommendation = 'Có thể duyệt ✅'
  if (criticalDays > 0) {
    recommendation = `Không nên duyệt ⛔ — ${criticalDays} ngày thiếu nghiêm trọng`
  } else if (warningDays > 0) {
    recommendation = `Cần tìm người thay ⚠️ — ${warningDays} ngày sẽ thiếu người`
  }

  return { willCauseUnderstaffing, affectedDays, recommendation }
}

// ══════════════════════════════════════
// 5. CREATE STAFFING NOTIFICATION
// ══════════════════════════════════════

export function createStaffingNotification(
  alert: UnderstaffingAlert,
  recipientId: string,
): void {
  const notification = {
    id: `notif-staff-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    employee_id: recipientId,
    title: alert.level === 'critical'
      ? '⚠️ Thiếu người nghiêm trọng'
      : '⚡ Cảnh báo thiếu người',
    body: `${alert.store_name}: ${alert.shift_name} ngày ${alert.date.slice(5)} — ${alert.message}`,
    type: 'staffing',
    is_read: false,
    created_at: new Date().toISOString(),
  }
  mockNotifications.push(notification)
}

// ══════════════════════════════════════
// 6. UNREAD STAFFING ALERT COUNT (badge)
// ══════════════════════════════════════

export function getUnreadStaffingAlertCount(managerId: string): number {
  return mockNotifications.filter(
    n => n.employee_id === managerId && n.type === 'staffing' && !n.is_read,
  ).length
}
