// =============================================
// HRM Trà Sữa 🧋 — Violation Service
// Phase 3F-2: CRUD + Appeal flow
// =============================================

import type { ViolationRecord, EvaluatorRole } from './kpi-types'
import { mockViolationRecords, mockViolationTypes, mockKPISettings } from './mock-data-kpi'

// ══════════════════════════════════════
// LOG VIOLATION
// ══════════════════════════════════════

export function logViolation(data: {
  employee_id: string
  store_id: string
  violation_type_id: string
  logged_by: string
  logged_by_role: EvaluatorRole
  log_mode: 'realtime' | 'end_of_month'
  occurred_at: string
  description: string
  evidence_url?: string
}): ViolationRecord {
  const vType = mockViolationTypes.find(v => v.id === data.violation_type_id)
  const now = new Date().toISOString()
  const period = now.slice(0, 7) // '2026-02'

  const record: ViolationRecord = {
    id: `vr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    org_id: 'org-001',
    store_id: data.store_id,
    employee_id: data.employee_id,
    violation_type_id: data.violation_type_id,
    logged_by: data.logged_by,
    logged_by_role: data.logged_by_role,
    log_mode: data.log_mode,
    occurred_at: data.occurred_at,
    logged_at: now,
    description: data.description,
    evidence_url: data.evidence_url,
    penalty_points: vType?.penalty_points ?? 0,
    status: 'pending',
    period,
  }
  mockViolationRecords.push(record)
  return record
}

// ══════════════════════════════════════
// EMPLOYEE ACTIONS
// ══════════════════════════════════════

export function acknowledgeViolation(
  violationId: string,
  employeeResponse?: string,
): ViolationRecord | null {
  const rec = mockViolationRecords.find(v => v.id === violationId)
  if (!rec || rec.status !== 'pending') return null
  rec.status = 'acknowledged'
  rec.employee_response = employeeResponse
  rec.acknowledged_at = new Date().toISOString()
  return rec
}

export function appealViolation(
  violationId: string,
  appealReason: string,
): ViolationRecord | null {
  const rec = mockViolationRecords.find(v => v.id === violationId)
  if (!rec) return null
  if (!canAppeal(rec)) return null
  rec.status = 'appealed'
  rec.appeal_reason = appealReason
  rec.appeal_at = new Date().toISOString()
  return rec
}

// ══════════════════════════════════════
// MANAGER / ADMIN ACTIONS
// ══════════════════════════════════════

export function reviewAppeal(
  violationId: string,
  decision: 'approved' | 'rejected',
  reviewNote: string,
  reviewedBy: string,
): ViolationRecord | null {
  const rec = mockViolationRecords.find(v => v.id === violationId)
  if (!rec || rec.status !== 'appealed') return null
  const now = new Date().toISOString()
  rec.status = decision === 'approved' ? 'appeal_approved' : 'appeal_rejected'
  rec.appeal_decision = reviewNote
  rec.appeal_reviewed_by = reviewedBy
  rec.appeal_reviewed_at = now
  rec.finalized_at = now
  return rec
}

export function updateViolation(
  violationId: string,
  data: Partial<ViolationRecord>,
): ViolationRecord | null {
  const idx = mockViolationRecords.findIndex(v => v.id === violationId)
  if (idx === -1) return null
  mockViolationRecords[idx] = { ...mockViolationRecords[idx], ...data }
  return mockViolationRecords[idx]
}

export function deleteViolation(violationId: string): boolean {
  const idx = mockViolationRecords.findIndex(v => v.id === violationId)
  if (idx === -1) return false
  mockViolationRecords.splice(idx, 1)
  return true
}

// ══════════════════════════════════════
// QUERIES
// ══════════════════════════════════════

export function getViolationById(id: string): ViolationRecord | undefined {
  return mockViolationRecords.find(v => v.id === id)
}

/** Check if appeal is within the 48-hour window from logged_at */
export function canAppeal(violation: ViolationRecord): boolean {
  // Can appeal if pending or acknowledged, and within 48h
  if (!['pending', 'acknowledged'].includes(violation.status)) return false
  const deadline = getAppealDeadline(violation)
  return new Date() < deadline
}

export function getAppealDeadline(violation: ViolationRecord): Date {
  const base = new Date(violation.logged_at)
  const hours = mockKPISettings.appeal_window_hours ?? 48
  base.setHours(base.getHours() + hours)
  return base
}

// ══════════════════════════════════════
// NOTIFICATION HELPERS (UI-only stubs)
// ══════════════════════════════════════

export function createViolationNotification(
  violation: ViolationRecord,
  type: 'new' | 'appeal_result',
): { title: string; body: string; to: string } {
  const vType = mockViolationTypes.find(v => v.id === violation.violation_type_id)
  if (type === 'new') {
    return {
      title: '⚠️ Ghi nhận lỗi mới',
      body: `Bạn bị ghi nhận lỗi: ${vType?.name ?? 'Không xác định'} (-${violation.penalty_points} điểm)`,
      to: violation.employee_id,
    }
  }
  const approved = violation.status === 'appeal_approved'
  return {
    title: approved ? '✅ Khiếu nại được chấp nhận' : '❌ Khiếu nại bị từ chối',
    body: approved
      ? `Khiếu nại lỗi "${vType?.name}" được chấp nhận. Điểm đã được hoàn lại.`
      : `Khiếu nại lỗi "${vType?.name}" bị từ chối. ${violation.appeal_decision ?? ''}`,
    to: violation.employee_id,
  }
}
