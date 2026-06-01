// =============================================
// HRM Trà Sữa 🧋 — Replacement Request Model
// Manages shift replacement flow for leave requests
// =============================================

export type ReplacementStatus = 'pending' | 'accepted' | 'rejected'

export interface ReplacementRequest {
  id: string
  leave_request_id: string
  original_employee_id: string
  original_employee_name: string
  replacement_employee_id: string
  replacement_employee_name: string
  shift_date: string
  shift_period: 'morning' | 'afternoon' | 'evening'
  shift_name: string          // 'Ca Sáng', 'Ca Chiều', 'Ca Tối'
  shift_time: string          // '08:00 - 14:00'
  store_id: string
  store_name: string
  position: string
  status: ReplacementStatus
  requested_at: string
  responded_at?: string
  rejection_reason?: string
}

// ─── In-memory store ───

let idCounter = 1
const replacementRequests: ReplacementRequest[] = []

// ─── CRUD ───

export function createReplacementRequest(
  data: Omit<ReplacementRequest, 'id' | 'status' | 'requested_at' | 'responded_at' | 'rejection_reason'>,
): ReplacementRequest {
  const request: ReplacementRequest = {
    ...data,
    id: `repl-${String(idCounter++).padStart(3, '0')}`,
    status: 'pending',
    requested_at: new Date().toISOString(),
  }
  replacementRequests.push(request)
  return request
}

export function getReplacementsByLeaveRequest(leaveRequestId: string): ReplacementRequest[] {
  return replacementRequests.filter(r => r.leave_request_id === leaveRequestId)
}

export function getPendingReplacementsForEmployee(employeeId: string): ReplacementRequest[] {
  return replacementRequests.filter(
    r => r.replacement_employee_id === employeeId && r.status === 'pending'
  )
}

export function getReplacementById(id: string): ReplacementRequest | undefined {
  return replacementRequests.find(r => r.id === id)
}

export function acceptReplacement(id: string): ReplacementRequest | undefined {
  const request = replacementRequests.find(r => r.id === id)
  if (request && request.status === 'pending') {
    request.status = 'accepted'
    request.responded_at = new Date().toISOString()
  }
  return request
}

export function rejectReplacement(id: string, reason?: string): ReplacementRequest | undefined {
  const request = replacementRequests.find(r => r.id === id)
  if (request && request.status === 'pending') {
    request.status = 'rejected'
    request.responded_at = new Date().toISOString()
    request.rejection_reason = reason
  }
  return request
}

export function areAllReplacementsAccepted(leaveRequestId: string): boolean {
  const requests = getReplacementsByLeaveRequest(leaveRequestId)
  if (requests.length === 0) return false
  return requests.every(r => r.status === 'accepted')
}

export function hasAnyRejection(leaveRequestId: string): boolean {
  const requests = getReplacementsByLeaveRequest(leaveRequestId)
  return requests.some(r => r.status === 'rejected')
}

// ─── Stats ───

export function getReplacementStats() {
  return {
    total: replacementRequests.length,
    pending: replacementRequests.filter(r => r.status === 'pending').length,
    accepted: replacementRequests.filter(r => r.status === 'accepted').length,
    rejected: replacementRequests.filter(r => r.status === 'rejected').length,
  }
}

// ─── Export for testing ───

export function getAllReplacements(): ReplacementRequest[] {
  return [...replacementRequests]
}
