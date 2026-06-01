// =============================================
// Shift Swap/Cover Requests — Mock data store
// =============================================

import {
  mockSchedules, mockEmployees,
  type Schedule, type Employee,
  saveSchedulesToStorage,
} from './mock-data'
import { ShiftTemplateService } from '@/lib/services/shift-template-service'

export interface SwapEvent {
  event: 'created' | 'target_accepted' | 'target_rejected' | 'requester_cancelled' | 'manager_approved' | 'manager_rejected'
  timestamp: string
  by_id: string
  by_name: string
  note?: string
}

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
  cancelled_at?: string
  cancelled_by?: string
  created_at: string
  events?: SwapEvent[]
}

export type SwapRequestStateMeta = {
  label: string
  detail: string
  tone: string
}

let swapCounter = 100

export function getSwapRequestStateMeta(request: ShiftSwapRequest): SwapRequestStateMeta {
  if (request.status === 'pending') {
    return {
      label: 'Chờ đồng nghiệp',
      detail: 'Yêu cầu đã gửi và đang chờ người được chọn phản hồi.',
      tone: 'bg-amber-50 text-amber-700',
    }
  }

  if (request.status === 'accepted') {
    return {
      label: 'Chờ quản lý',
      detail: 'Đồng nghiệp đã đồng ý, còn chờ quản lý duyệt để cập nhật lịch.',
      tone: 'bg-sky-50 text-sky-700',
    }
  }

  if (request.status === 'approved') {
    return {
      label: 'Đã duyệt',
      detail: 'Yêu cầu đã duyệt và lịch làm việc đã được cập nhật.',
      tone: 'bg-emerald-50 text-emerald-700',
    }
  }

  if (request.status === 'cancelled') {
    return {
      label: 'Đã hủy',
      detail: 'Người tạo yêu cầu đã chủ động hủy trước khi hoàn tất.',
      tone: 'bg-slate-100 text-slate-700',
    }
  }

  return {
    label: 'Bị từ chối',
    detail: request.manager_id
      ? 'Yêu cầu đã bị từ chối ở bước quản lý duyệt.'
      : 'Yêu cầu đã bị đồng nghiệp từ chối.',
    tone: 'bg-rose-50 text-rose-700',
  }
}

export function getPersistedSwapRequests(): ShiftSwapRequest[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem('homies_swap_requests')
    if (data) return JSON.parse(data)
  } catch {}
  return []
}

export function saveSwapRequests(requests: ShiftSwapRequest[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('homies_swap_requests', JSON.stringify(requests))
  } catch {}
}

export function getInitialSwapRequests(): ShiftSwapRequest[] {
  const persisted = getPersistedSwapRequests()
  if (persisted.length > 0) return persisted
  
  const seeded: ShiftSwapRequest[] = [
    {
      id: 'swap-seed-1',
      requester_id: 'emp-001',
      requester_schedule_id: 'sch-001',
      target_user_id: 'emp-002',
      target_schedule_id: 'sch-002',
      type: 'swap',
      reason: 'Có việc gia đình đột xuất',
      status: 'pending',
      created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      events: [
        {
          event: 'created',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          by_id: 'emp-001',
          by_name: 'Nguyễn Văn A',
          note: 'Tạo yêu cầu đổi ca: "Có việc gia đình đột xuất"'
        }
      ]
    },
    {
      id: 'swap-seed-2',
      requester_id: 'emp-002',
      requester_schedule_id: 'sch-003',
      target_user_id: 'emp-003',
      type: 'cover',
      reason: 'Đi khám bệnh',
      status: 'accepted',
      created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      target_response_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      events: [
        {
          event: 'created',
          timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
          by_id: 'emp-002',
          by_name: 'Trần Thị B',
          note: 'Tạo yêu cầu gánh ca: "Đi khám bệnh"'
        },
        {
          event: 'target_accepted',
          timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
          by_id: 'emp-003',
          by_name: 'Lê Văn C',
          note: 'Đồng ý gánh ca giúp Trần Thị B'
        }
      ]
    }
  ]
  saveSwapRequests(seeded)
  return seeded
}

// ─── CRUD ───

export function createSwapRequest(
  requesterId: string,
  requesterScheduleId: string,
  targetUserId: string,
  targetScheduleId: string | undefined,
  type: 'swap' | 'cover',
  reason: string,
): ShiftSwapRequest {
  const reqUser = mockEmployees.find(e => e.id === requesterId)
  const targetUser = mockEmployees.find(e => e.id === targetUserId)
  const requesterSchedule = mockSchedules.find(schedule => schedule.id === requesterScheduleId)
  const targetSchedule = targetScheduleId
    ? mockSchedules.find(schedule => schedule.id === targetScheduleId)
    : null
  if (!reqUser || !targetUser || !requesterSchedule) {
    throw new Error('Dữ liệu yêu cầu đổi ca không hợp lệ.')
  }
  if (!['active', 'probation'].includes(reqUser.status) || !['active', 'probation'].includes(targetUser.status)) {
    throw new Error('Chỉ nhân sự đang hoạt động hoặc thử việc mới được đổi ca.')
  }
  if (reqUser.store_id !== targetUser.store_id || reqUser.store_id !== requesterSchedule.store_id) {
    throw new Error('Chỉ hỗ trợ đổi ca trong cùng cửa hàng.')
  }
  if (requesterSchedule.employee_id !== requesterId) {
    throw new Error('Bạn chỉ có thể tạo yêu cầu cho ca của chính mình.')
  }
  if (type === 'swap') {
    if (!targetSchedule) {
      throw new Error('Đổi ca 1-1 cần có ca đích của đồng nghiệp.')
    }
    if (targetSchedule.employee_id !== targetUserId) {
      throw new Error('Ca đích không thuộc đồng nghiệp đã chọn.')
    }
  }

  const reqUserName = reqUser ? reqUser.full_name : 'Requester'

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
    events: [
      {
        event: 'created',
        timestamp: new Date().toISOString(),
        by_id: requesterId,
        by_name: reqUserName,
        note: `Tạo yêu cầu ${type === 'swap' ? 'đổi ca' : 'gánh ca'}: "${reason}"`
      }
    ]
  }
  
  const current = getInitialSwapRequests()
  current.push(req)
  saveSwapRequests(current)
  return req
}

export function getMySwapRequests(userId: string): ShiftSwapRequest[] {
  const current = getInitialSwapRequests()
  return current.filter(r => r.requester_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function getSwapRequestsForMe(userId: string): ShiftSwapRequest[] {
  const current = getInitialSwapRequests()
  return current.filter(r => r.target_user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function getPendingSwapRequestsForManager(storeId: string): ShiftSwapRequest[] {
  const storeEmpIds = new Set(
    mockEmployees.filter(e => e.store_id === storeId).map(e => e.id)
  )
  const current = getInitialSwapRequests()
  return current.filter(r =>
    r.status === 'accepted' && storeEmpIds.has(r.requester_id)
  ).sort((a, b) => b.created_at.localeCompare(a.created_at))
}

export function respondToSwapRequest(requestId: string, accept: boolean): ShiftSwapRequest | null {
  const current = getInitialSwapRequests()
  const req = current.find(r => r.id === requestId)
  if (!req || req.status !== 'pending') return null
  
  req.status = accept ? 'accepted' : 'rejected'
  req.target_response_at = new Date().toISOString()
  
  const targetUser = mockEmployees.find(e => e.id === req.target_user_id)
  const targetUserName = targetUser ? targetUser.full_name : 'Đối tác'
  const reqUser = mockEmployees.find(e => e.id === req.requester_id)
  const reqUserName = reqUser ? reqUser.full_name : 'Đồng nghiệp'

  if (!req.events) req.events = []
  req.events.push({
    event: accept ? 'target_accepted' : 'target_rejected',
    timestamp: new Date().toISOString(),
    by_id: req.target_user_id,
    by_name: targetUserName,
    note: accept ? `Đồng ý yêu cầu của ${reqUserName}` : `Từ chối yêu cầu của ${reqUserName}`
  })
  
  saveSwapRequests(current)
  return req
}

export function managerApproveSwap(requestId: string, managerId: string, approve: boolean): ShiftSwapRequest | null {
  const current = getInitialSwapRequests()
  const req = current.find(r => r.id === requestId)
  if (!req || req.status !== 'accepted') return null

  const mgrUser = mockEmployees.find(e => e.id === managerId)
  const mgrName = mgrUser ? mgrUser.full_name : 'Manager'
  const reqUser = mockEmployees.find(e => e.id === req.requester_id)
  const targetUser = mockEmployees.find(e => e.id === req.target_user_id)
  const reqSchedule = mockSchedules.find(s => s.id === req.requester_schedule_id)
  const targetSchedule = req.target_schedule_id
    ? mockSchedules.find(s => s.id === req.target_schedule_id)
    : null

  if (approve) {
    if (!reqUser || !targetUser || !reqSchedule) return null
    if (!['active', 'probation'].includes(reqUser.status) || !['active', 'probation'].includes(targetUser.status)) {
      return null
    }
    if (reqUser.store_id !== targetUser.store_id || reqUser.store_id !== reqSchedule.store_id) return null

    const requesterShiftTemplate = ShiftTemplateService.getById(reqSchedule.shift_id)
    if (
      requesterShiftTemplate?.allowed_position_ids?.length &&
      !requesterShiftTemplate.allowed_position_ids.includes(targetUser.position_id)
    ) {
      return null
    }

    if (req.type === 'swap') {
      if (!targetSchedule) return null
      if (targetSchedule.employee_id !== targetUser.id) return null
      if (targetSchedule.store_id !== reqSchedule.store_id) return null

      const targetShiftTemplate = ShiftTemplateService.getById(targetSchedule.shift_id)
      if (
        targetShiftTemplate?.allowed_position_ids?.length &&
        !targetShiftTemplate.allowed_position_ids.includes(reqUser.position_id)
      ) {
        return null
      }

      const requesterConflict = mockSchedules.some(schedule =>
        schedule.employee_id === reqUser.id &&
        schedule.date === targetSchedule.date &&
        schedule.id !== reqSchedule.id &&
        schedule.id !== targetSchedule.id
      )
      if (requesterConflict) return null

      const targetConflict = mockSchedules.some(schedule =>
        schedule.employee_id === targetUser.id &&
        schedule.date === reqSchedule.date &&
        schedule.id !== reqSchedule.id &&
        schedule.id !== targetSchedule.id
      )
      if (targetConflict) return null
    } else {
      const coverConflict = mockSchedules.some(schedule =>
        schedule.employee_id === targetUser.id &&
        schedule.date === reqSchedule.date &&
        schedule.id !== reqSchedule.id
      )
      if (coverConflict) return null
    }
  }

  if (approve) {
    req.status = 'approved'
    req.manager_id = managerId
    req.manager_approved_at = new Date().toISOString()

    if (!req.events) req.events = []
    req.events.push({
      event: 'manager_approved',
      timestamp: new Date().toISOString(),
      by_id: managerId,
      by_name: mgrName,
      note: 'Duyệt yêu cầu đổi/gánh ca và cập nhật lịch làm việc chính thức'
    })

    // Apply schedule changes
    if (reqSchedule) {
      if (req.type === 'swap' && req.target_schedule_id) {
        if (targetSchedule) {
          const tempEmpId = reqSchedule.employee_id
          reqSchedule.employee_id = targetSchedule.employee_id
          targetSchedule.employee_id = tempEmpId
          reqSchedule.modified_after_publish = true
          reqSchedule.change_reason = `Manager duyệt đổi ca với ${targetUser?.full_name || req.target_user_id}`
          reqSchedule.updated_by = managerId
          reqSchedule.updated_at = new Date().toISOString()
          targetSchedule.modified_after_publish = true
          targetSchedule.change_reason = `Manager duyệt đổi ca với ${reqUser?.full_name || req.requester_id}`
          targetSchedule.updated_by = managerId
          targetSchedule.updated_at = new Date().toISOString()
        }
      } else {
        reqSchedule.employee_id = req.target_user_id
        reqSchedule.modified_after_publish = true
        reqSchedule.change_reason = `Manager duyệt nhờ thay ca cho ${targetUser?.full_name || req.target_user_id}`
        reqSchedule.updated_by = managerId
        reqSchedule.updated_at = new Date().toISOString()
      }
      saveSchedulesToStorage()
    }
  } else {
    req.status = 'rejected'
    req.manager_id = managerId
    req.manager_approved_at = new Date().toISOString()

    if (!req.events) req.events = []
    req.events.push({
      event: 'manager_rejected',
      timestamp: new Date().toISOString(),
      by_id: managerId,
      by_name: mgrName,
      note: 'Từ chối duyệt yêu cầu đổi/gánh ca'
    })
  }
  
  saveSwapRequests(current)
  return req
}

export function cancelSwapRequest(requestId: string, requesterId: string): ShiftSwapRequest | null {
  const current = getInitialSwapRequests()
  const req = current.find(r => r.id === requestId)
  if (!req || req.requester_id !== requesterId) return null
  if (req.status !== 'pending' && req.status !== 'accepted') return null

  req.status = 'cancelled'
  req.cancelled_by = requesterId
  req.cancelled_at = new Date().toISOString()
  
  const reqUser = mockEmployees.find(e => e.id === requesterId)
  const reqUserName = reqUser ? reqUser.full_name : 'Requester'

  if (!req.events) req.events = []
  req.events.push({
    event: 'requester_cancelled',
    timestamp: new Date().toISOString(),
    by_id: requesterId,
    by_name: reqUserName,
    note: 'Hủy yêu cầu đổi/gánh ca'
  })

  saveSwapRequests(current)
  return req
}

export function getSwapRequestById(id: string): ShiftSwapRequest | undefined {
  const current = getInitialSwapRequests()
  return current.find(r => r.id === id)
}

// ─── Helpers ───

export function getScheduleById(id: string): Schedule | undefined {
  return mockSchedules.find(s => s.id === id)
}

export function getEmployeeById(id: string): Employee | undefined {
  return mockEmployees.find(e => e.id === id)
}

export function getCoworkersForSwap(userId: string, storeId: string, date: string, shiftId: string): Employee[] {
  const template = ShiftTemplateService.getById(shiftId)
  const employees = mockEmployees.filter(e =>
    e.store_id === storeId && e.id !== userId && e.status === 'active'
  )
  // Filter out those who have a schedule on the same date+shift (conflicting)
  return employees.filter(emp => {
    if (template?.allowed_position_ids?.length && !template.allowed_position_ids.includes(emp.position_id)) {
      return false
    }
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
  const current = getInitialSwapRequests()
  return current.sort((a, b) => b.created_at.localeCompare(a.created_at))
}
