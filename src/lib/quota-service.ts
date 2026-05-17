// =============================================
// HRM Trà Sữa 🧋 — Quota Service
// Auto-deduct quota on leave request lifecycle
// =============================================

import {
  mockLeaveQuotas,
  type LeaveType, type QuotaDetail,
} from './mock-data-leave'

// ─── Hàm 1: Tính quota tự động ───

export function computeQuotaRemaining(total: number, used: number, pending: number): number {
  if (total === 0) return 999 // unlimited (unpaid leave)
  return Math.max(total - used - pending, 0)
}

// ─── Hàm 6: Lấy quota (computed) ───

export function getEmployeeQuota(
  employeeId: string,
  leaveType: LeaveType,
): QuotaDetail | undefined {
  const record = mockLeaveQuotas.find(q => q.employee_id === employeeId)
  if (!record) return undefined

  const q = record.quotas[leaveType]
  if (!q) return undefined

  // Return with live-computed remaining
  return {
    ...q,
    remaining: computeQuotaRemaining(q.total, q.used, q.pending),
  }
}

// ─── Hàm 2: Tăng pending khi gửi đơn ───

export function addPendingQuota(
  employeeId: string,
  leaveType: LeaveType,
  days: number,
): { success: boolean; error?: string; quota?: QuotaDetail } {
  const record = mockLeaveQuotas.find(q => q.employee_id === employeeId)
  if (!record) return { success: false, error: `Không tìm thấy quota cho ${employeeId}` }

  const q = record.quotas[leaveType]
  if (!q) return { success: false, error: `Không tìm thấy quota loại ${leaveType}` }

  // Check if enough remaining
  const currentRemaining = computeQuotaRemaining(q.total, q.used, q.pending)
  if (q.total > 0 && days > currentRemaining) {
    return {
      success: false,
      error: `Không đủ ngày phép: còn ${currentRemaining}, xin ${days}`,
    }
  }

  // Update
  q.pending += days
  q.remaining = computeQuotaRemaining(q.total, q.used, q.pending)

  return { success: true, quota: { ...q } }
}

// ─── Hàm 3: Trừ quota khi duyệt ───

export function approveQuotaDeduct(
  employeeId: string,
  leaveType: LeaveType,
  days: number,
): { success: boolean; error?: string; quota?: QuotaDetail } {
  const record = mockLeaveQuotas.find(q => q.employee_id === employeeId)
  if (!record) return { success: false, error: `Không tìm thấy quota cho ${employeeId}` }

  const q = record.quotas[leaveType]
  if (!q) return { success: false, error: `Không tìm thấy quota loại ${leaveType}` }

  // Deduct
  q.used += days
  q.pending = Math.max(q.pending - days, 0)
  q.remaining = computeQuotaRemaining(q.total, q.used, q.pending)

  return { success: true, quota: { ...q } }
}

// ─── Hàm 4: Hoàn pending khi từ chối ───

export function rejectQuotaRestore(
  employeeId: string,
  leaveType: LeaveType,
  days: number,
): { success: boolean; error?: string; quota?: QuotaDetail } {
  const record = mockLeaveQuotas.find(q => q.employee_id === employeeId)
  if (!record) return { success: false, error: `Không tìm thấy quota cho ${employeeId}` }

  const q = record.quotas[leaveType]
  if (!q) return { success: false, error: `Không tìm thấy quota loại ${leaveType}` }

  // Restore pending
  q.pending = Math.max(q.pending - days, 0)
  q.remaining = computeQuotaRemaining(q.total, q.used, q.pending)

  return { success: true, quota: { ...q } }
}

// ─── Hàm 5: Hoàn quota khi hủy ───

export function cancelQuotaRestore(
  employeeId: string,
  leaveType: LeaveType,
  days: number,
  previousStatus: 'pending' | 'approved',
): { success: boolean; error?: string; quota?: QuotaDetail } {
  const record = mockLeaveQuotas.find(q => q.employee_id === employeeId)
  if (!record) return { success: false, error: `Không tìm thấy quota cho ${employeeId}` }

  const q = record.quotas[leaveType]
  if (!q) return { success: false, error: `Không tìm thấy quota loại ${leaveType}` }

  if (previousStatus === 'pending') {
    // Was pending → restore pending
    q.pending = Math.max(q.pending - days, 0)
  } else {
    // Was approved → restore used
    q.used = Math.max(q.used - days, 0)
  }
  q.remaining = computeQuotaRemaining(q.total, q.used, q.pending)

  return { success: true, quota: { ...q } }
}
