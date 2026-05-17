// =============================================
// Shift Swap/Cover Requests — Mock data store
// =============================================

import {
  mockSchedules, mockEmployees,
  type Schedule, type Employee,
} from './mock-data'

export interface ShiftSwapRequest {
  id: string
  requester_id: string
  requester_schedule_id: string
  target_user_id: string
  target_schedule_id?: string   // only for 'swap'
  type: 'swap' | 'cover'
  reason: string
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'approved'
  target_response_at?: string
  manager_approved_at?: string
  manager_id?: string
  created_at: string
}

let swapCounter = 100
const swapRequests: ShiftSwapRequest[] = []

// ─── CRUD ───

export function createSwapRequest(
  requesterId: string,
  requesterScheduleId: string,
  targetUserId: string,
  targetScheduleId: string | undefined,
  type: 'swap' | 'cover',
  reason: string,
): ShiftSwapRequest {
  const req: ShiftSwapRequest = {
    id: `swap-${swapCounter++}`,
    requester_id: requesterId,
    requester_schedule_id: requesterScheduleId,
    target_user_id: targetUserId,
    target_schedule_id: targetScheduleId,
    type,
    reason,
    status: 'pending',
    created_at: new Date().toISOString(),
  }
  swapRequests.push(req)
  return req
}

export function getMySwapRequests(userId: string): ShiftSwapRequest[] {
  return swapRequests.filter(r => r.requester_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function getSwapRequestsForMe(userId: string): ShiftSwapRequest[] {
  return swapRequests.filter(r => r.target_user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function getPendingSwapRequestsForManager(storeId: string): ShiftSwapRequest[] {
  // Get employees in this store
  const storeEmpIds = new Set(
    mockEmployees.filter(e => e.store_id === storeId).map(e => e.id)
  )
  return swapRequests.filter(r =>
    r.status === 'accepted' && storeEmpIds.has(r.requester_id)
  ).sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function respondToSwapRequest(requestId: string, accept: boolean): ShiftSwapRequest | null {
  const req = swapRequests.find(r => r.id === requestId)
  if (!req) return null
  req.status = accept ? 'accepted' : 'rejected'
  req.target_response_at = new Date().toISOString()
  return req
}

export function managerApproveSwap(requestId: string, managerId: string, approve: boolean): ShiftSwapRequest | null {
  const req = swapRequests.find(r => r.id === requestId)
  if (!req) return null

  if (approve) {
    req.status = 'approved'
    req.manager_id = managerId
    req.manager_approved_at = new Date().toISOString()

    // Apply schedule changes
    const reqSchedule = mockSchedules.find(s => s.id === req.requester_schedule_id)
    if (reqSchedule) {
      if (req.type === 'swap' && req.target_schedule_id) {
        // Swap: exchange shifts
        const targetSchedule = mockSchedules.find(s => s.id === req.target_schedule_id)
        if (targetSchedule) {
          // swap employee_ids
          const tempEmpId = reqSchedule.employee_id
          reqSchedule.employee_id = targetSchedule.employee_id
          targetSchedule.employee_id = tempEmpId
        }
      } else {
        // Cover: reassign shift to target
        reqSchedule.employee_id = req.target_user_id
      }
    }
  } else {
    req.status = 'rejected'
    req.manager_id = managerId
    req.manager_approved_at = new Date().toISOString()
  }
  return req
}

export function getSwapRequestById(id: string): ShiftSwapRequest | undefined {
  return swapRequests.find(r => r.id === id)
}

// ─── Helpers ───

export function getScheduleById(id: string): Schedule | undefined {
  return mockSchedules.find(s => s.id === id)
}

export function getEmployeeById(id: string): Employee | undefined {
  return mockEmployees.find(e => e.id === id)
}

export function getCoworkersForSwap(userId: string, storeId: string, date: string, shiftId: string): Employee[] {
  const employees = mockEmployees.filter(e =>
    e.store_id === storeId && e.id !== userId && e.status === 'active'
  )
  // Filter out those who have a schedule on the same date+shift (conflicting)
  return employees.filter(emp => {
    const existingSchedule = mockSchedules.find(s =>
      s.employee_id === emp.id && s.date === date && s.shift_id === shiftId
    )
    return !existingSchedule
  })
}

export function getMyUpcomingSchedules(userId: string): Schedule[] {
  const today = new Date()
  const twoWeeksLater = new Date(today)
  twoWeeksLater.setDate(today.getDate() + 14)
  const todayStr = today.toISOString().split('T')[0]
  const futureStr = twoWeeksLater.toISOString().split('T')[0]

  return mockSchedules.filter(s =>
    s.employee_id === userId && s.date >= todayStr && s.date <= futureStr
  ).sort((a, b) => a.date.localeCompare(b.date))
}

export function getAllSwapRequests(): ShiftSwapRequest[] {
  return [...swapRequests].sort((a, b) => b.created_at.localeCompare(a.created_at))
}
