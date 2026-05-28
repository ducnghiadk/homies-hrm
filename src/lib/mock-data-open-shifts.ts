// =============================================
// Open Shifts — Mock data store
// =============================================

import {
  mockSchedules, mockEmployees, mockShifts, mockPositions,
  getShiftById, getStoreById, getPositionById,
  addSchedule,
  saveSchedulesToStorage,
} from './mock-data'
import type { Warning } from './mock-data-smart-schedule'
import { isEmployeeCompatibleWithPositionId } from './scheduling/position-compatibility'

export interface OpenShiftEvent {
  event: 'created' | 'claim_submitted' | 'claim_approved' | 'claim_rejected' | 'auto_approved' | 'cancelled' | 'filled'
  timestamp: string
  by_id: string
  by_name: string
  note?: string
}

export interface OpenShift {
  id: string
  store_id: string
  shift_id: string
  date: string
  position_id: string
  source_schedule_id?: string
  slots_needed: number
  slots_filled: number
  note: string
  auto_approve: boolean
  status: 'open' | 'filled' | 'cancelled'
  created_by: string
  created_at: string
  events?: OpenShiftEvent[]
}

export interface OpenShiftClaim {
  id: string
  open_shift_id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  claimed_at: string
  approved_by?: string
  approved_at?: string
  events?: OpenShiftEvent[]
}

export type OpenShiftStateMeta = {
  label: string
  detail: string
  tone: string
}

export type OpenShiftClaimStateMeta = {
  label: string
  detail: string
  tone: string
}

type UnderstaffedWarningPayload = {
  date: string
  slot: 'morning' | 'afternoon' | 'evening'
  positionId: string
  slotsNeeded: number
}

let openShiftCounter = 100
let claimCounter = 100

export function getOpenShiftStateMeta(openShift: OpenShift): OpenShiftStateMeta {
  if (openShift.status === 'filled') {
    return {
      label: 'Đã đủ người',
      detail: 'Ca trống này đã đủ người nhận nên không nhận thêm claim mới.',
      tone: 'bg-emerald-50 text-emerald-700',
    }
  }

  if (openShift.status === 'cancelled') {
    return {
      label: 'Đã hủy',
      detail: 'Ca trống này đã được hủy và không còn hiệu lực.',
      tone: 'bg-slate-100 text-slate-700',
    }
  }

  return {
    label: 'Đang mở',
    detail: openShift.auto_approve
      ? 'Ca trống đang mở và có thể tự duyệt nếu bạn phù hợp.'
      : 'Ca trống đang mở và sẽ chờ quản lý duyệt claim.',
    tone: 'bg-amber-50 text-amber-700',
  }
}

export function getOpenShiftClaimStateMeta(claim: OpenShiftClaim): OpenShiftClaimStateMeta {
  if (claim.status === 'approved') {
    return {
      label: 'Đã duyệt',
      detail: 'Claim này đã được duyệt và ca đã gán cho bạn.',
      tone: 'bg-emerald-50 text-emerald-700',
    }
  }

  if (claim.status === 'rejected') {
    return {
      label: 'Bị từ chối',
      detail: 'Claim này không được duyệt hoặc đã bị loại khi ca đủ người.',
      tone: 'bg-rose-50 text-rose-700',
    }
  }

  return {
    label: 'Chờ duyệt',
    detail: 'Claim đã gửi và đang chờ quản lý xử lý.',
    tone: 'bg-amber-50 text-amber-700',
  }
}

export function getPersistedOpenShifts(): OpenShift[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem('homies_open_shifts')
    if (data) return JSON.parse(data)
  } catch {}
  return []
}

export function saveOpenShifts(shifts: OpenShift[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('homies_open_shifts', JSON.stringify(shifts))
  } catch {}
}

export function getPersistedClaims(): OpenShiftClaim[] {
  if (typeof window === 'undefined') return []
  try {
    const data = localStorage.getItem('homies_open_shift_claims')
    if (data) {
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        return parsed.map(claim => ({
          ...claim,
          events: Array.isArray(claim.events) ? claim.events : [],
        }))
      }
    }
  } catch {}
  return []
}

export function saveClaims(list: OpenShiftClaim[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('homies_open_shift_claims', JSON.stringify(list))
  } catch {}
}

export function getInitialOpenShifts(): OpenShift[] {
  const persisted = getPersistedOpenShifts()
  if (persisted.length > 0) return persisted

  const today = new Date()
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i + 1)
    return d.toISOString().split('T')[0]
  })

  const seeds: Omit<OpenShift, 'id' | 'created_at'>[] = [
    { store_id: 'store-001', shift_id: 'shift-001', date: dates[0], position_id: 'pos-001', slots_needed: 2, slots_filled: 0, note: 'Thiếu người ca sáng', auto_approve: false, status: 'open', created_by: 'emp-003' },
    { store_id: 'store-001', shift_id: 'shift-002', date: dates[1], position_id: 'pos-002', slots_needed: 1, slots_filled: 0, note: '', auto_approve: true, status: 'open', created_by: 'emp-003' },
    { store_id: 'store-001', shift_id: 'shift-003', date: dates[2], position_id: 'pos-001', slots_needed: 1, slots_filled: 0, note: 'Cần gấp', auto_approve: false, status: 'open', created_by: 'emp-003' },
    { store_id: 'store-001', shift_id: 'shift-001', date: dates[4], position_id: 'pos-003', slots_needed: 3, slots_filled: 1, note: 'Ngày đông khách', auto_approve: true, status: 'open', created_by: 'emp-003' },
  ]

  let counter = 100
  const seeded = seeds.map(s => {
    const creator = mockEmployees.find(e => e.id === s.created_by)
    const creatorName = creator ? creator.full_name : 'Quản lý'
    const id = `os-${counter++}`
    const createdAt = new Date(Date.now() - Math.random() * 86400000).toISOString()
    
    return {
      ...s,
      id,
      created_at: createdAt,
      events: [
        {
          event: 'created' as const,
          timestamp: createdAt,
          by_id: s.created_by,
          by_name: creatorName,
          note: `Đã mở ca trống: Ca ${mockShifts.find(x => x.id === s.shift_id)?.name || s.shift_id} - ${s.note || 'Không có ghi chú'}`
        }
      ]
    }
  })
  
  saveOpenShifts(seeded)
  return seeded
}

export function getInitialClaims(): OpenShiftClaim[] {
  const persisted = getPersistedClaims()
  if (persisted.length > 0) return persisted
  return []
}

function pushClaimEvent(
  claim: OpenShiftClaim,
  event: OpenShiftEvent['event'],
  byId: string,
  byName: string,
  note: string,
  timestamp = new Date().toISOString(),
) {
  if (!claim.events) claim.events = []
  claim.events.push({
    event,
    timestamp,
    by_id: byId,
    by_name: byName,
    note,
  })
}

// ─── CRUD ───

export function createOpenShift(
  storeId: string,
  shiftId: string,
  date: string,
  positionId: string,
  slotsNeeded: number,
  note: string,
  autoApprove: boolean,
  createdBy: string,
): OpenShift {
  const creator = mockEmployees.find(e => e.id === createdBy)
  const creatorName = creator ? creator.full_name : 'Quản lý'
  
  const os: OpenShift = {
    id: `os-${openShiftCounter++}`,
    store_id: storeId,
    shift_id: shiftId,
    date,
    position_id: positionId,
    slots_needed: slotsNeeded,
    slots_filled: 0,
    note,
    auto_approve: autoApprove,
    status: 'open',
    created_by: createdBy,
    created_at: new Date().toISOString(),
    events: [
      {
        event: 'created',
        timestamp: new Date().toISOString(),
        by_id: createdBy,
        by_name: creatorName,
        note: `Đã tạo ca trống: Ca ${mockShifts.find(x => x.id === shiftId)?.name || shiftId} - ${note || 'Không có ghi chú'}`
      }
    ]
  }
  const current = getInitialOpenShifts()
  current.push(os)
  saveOpenShifts(current)
  return os
}

export function releasePublishedShift(sourceScheduleId: string, releasedBy: string, note: string): OpenShift | null {
  const schedule = mockSchedules.find(item => item.id === sourceScheduleId)
  const employee = mockEmployees.find(item => item.id === releasedBy)
  if (!schedule || !employee) return null
  if (schedule.employee_id !== releasedBy) return null

  const existing = getInitialOpenShifts().find(openShift =>
    openShift.source_schedule_id === sourceScheduleId &&
    openShift.status === 'open'
  )
  if (existing) return existing

  const created = createOpenShift(
    schedule.store_id,
    schedule.shift_id,
    schedule.date,
    employee.position_id,
    1,
    note || `Nhân viên ${employee.full_name} cần nhả ca`,
    false,
    releasedBy
  )

  created.source_schedule_id = sourceScheduleId
  created.note = note || `Nhân viên ${employee.full_name} cần nhả ca`
  const current = getInitialOpenShifts()
  const target = current.find(openShift => openShift.id === created.id)
  if (target) {
    target.source_schedule_id = sourceScheduleId
    target.note = created.note
    saveOpenShifts(current)
  }

  return target || created
}

function getShiftIdForSlot(slot: UnderstaffedWarningPayload['slot']): string {
  if (slot === 'morning') return 'shift-001'
  if (slot === 'afternoon') return 'shift-002'
  return 'shift-003'
}

function getPositionIdForKey(positionKey: string): string | null {
  if (positionKey === 'barista') return 'pos-001'
  if (positionKey === 'cashier') return 'pos-002'
  if (positionKey === 'support') return 'pos-003'
  if (positionKey === 'store_manager') return 'pos-005'
  return null
}

function parseUnderstaffedWarningTag(tag: string): UnderstaffedWarningPayload | null {
  const [prefix, date, slot, positionKey, missingCount] = tag.split(':')
  if (prefix !== 'understaffed' || !date || !slot || !positionKey || !missingCount) {
    return null
  }

  const positionId = getPositionIdForKey(positionKey)
  const slotsNeeded = Number(missingCount)
  if (!positionId || Number.isNaN(slotsNeeded) || slotsNeeded <= 0) {
    return null
  }

  if (slot !== 'morning' && slot !== 'afternoon' && slot !== 'evening') {
    return null
  }

  return {
    date,
    slot,
    positionId,
    slotsNeeded,
  }
}

export function createOpenShiftsFromWarnings(
  storeId: string,
  warnings: Warning[],
  createdBy: string,
  autoApprove = false,
): OpenShift[] {
  const createdOrUpdated: OpenShift[] = []
  const current = getInitialOpenShifts()

  warnings
    .filter(warning => warning.type === 'understaffed')
    .forEach(warning => {
      warning.affectedShifts?.forEach(tag => {
        const payload = parseUnderstaffedWarningTag(tag)
        if (!payload) return

        const shiftId = getShiftIdForSlot(payload.slot)
        const existing = current.find(openShift =>
          openShift.store_id === storeId &&
          openShift.shift_id === shiftId &&
          openShift.date === payload.date &&
          openShift.position_id === payload.positionId &&
          openShift.status === 'open'
        )

        if (existing) {
          existing.slots_needed = Math.max(existing.slots_needed, payload.slotsNeeded)
          if (!existing.note.includes('Smart Schedule')) {
            existing.note = existing.note
              ? `${existing.note} | Smart Schedule`
              : 'Tự động tạo từ Smart Schedule'
          }
          if (!existing.events) existing.events = []
          existing.events.push({
            event: 'created',
            timestamp: new Date().toISOString(),
            by_id: createdBy,
            by_name: mockEmployees.find(e => e.id === createdBy)?.full_name || 'Hệ thống',
            note: `Cập nhật số slot cần thiết thành ${existing.slots_needed} từ Smart Schedule`
          })
          createdOrUpdated.push(existing)
          return
        }

        const creator = mockEmployees.find(e => e.id === createdBy)
        const creatorName = creator ? creator.full_name : 'Quản lý'
        const newOs: OpenShift = {
          id: `os-${openShiftCounter++}`,
          store_id: storeId,
          shift_id: shiftId,
          date: payload.date,
          position_id: payload.positionId,
          slots_needed: payload.slotsNeeded,
          slots_filled: 0,
          note: 'Tự động tạo từ Smart Schedule',
          auto_approve: autoApprove,
          status: 'open',
          created_by: createdBy,
          created_at: new Date().toISOString(),
          events: [
            {
              event: 'created',
              timestamp: new Date().toISOString(),
              by_id: createdBy,
              by_name: creatorName,
              note: `Tự động tạo ca trống từ Smart Schedule: Ca ${mockShifts.find(x => x.id === shiftId)?.name || shiftId}`
            }
          ]
        }
        current.push(newOs)
        createdOrUpdated.push(newOs)
      })
    })

  saveOpenShifts(current)
  return Array.from(new Map(createdOrUpdated.map(openShift => [openShift.id, openShift])).values())
}

export function getOpenShiftsByStore(storeId: string): OpenShift[] {
  const current = getInitialOpenShifts()
  return current.filter(os => os.store_id === storeId && os.status === 'open')
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function getOpenShiftsByStoreWeek(storeId: string, weekDates: string[]): OpenShift[] {
  const current = getInitialOpenShifts()
  const dateSet = new Set(weekDates)
  return current
    .filter(os => os.store_id === storeId && dateSet.has(os.date))
    .sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date)
      if (a.shift_id !== b.shift_id) return a.shift_id.localeCompare(b.shift_id)
      return a.created_at.localeCompare(b.created_at)
    })
}

export function getAvailableOpenShiftsForEmployee(userId: string): OpenShift[] {
  const emp = mockEmployees.find(e => e.id === userId)
  if (!emp) return []
  if (!['active', 'probation'].includes(emp.status)) return []

  const todayStr = new Date().toISOString().split('T')[0]
  const currentShifts = getInitialOpenShifts()
  const currentClaims = getInitialClaims()

  return currentShifts.filter(os => {
    if (os.status !== 'open') return false
    if (os.date < todayStr) return false
    if (os.store_id !== emp.store_id) return false
    if (!isEmployeeCompatibleWithPositionId(emp.position_id, os.position_id)) return false

    const hasConflict = mockSchedules.some(s =>
      s.employee_id === userId &&
      s.date === os.date &&
      s.id !== os.source_schedule_id
    )
    if (hasConflict) return false

    const alreadyClaimed = currentClaims.some(c =>
      c.open_shift_id === os.id && c.user_id === userId && c.status !== 'rejected'
    )
    if (alreadyClaimed) return false

    return true
  }).sort((a, b) => a.date.localeCompare(b.date))
}

export function getOpenShiftById(id: string): OpenShift | undefined {
  const current = getInitialOpenShifts()
  return current.find(os => os.id === id)
}

export function cancelOpenShift(id: string): OpenShift | null {
  const currentShifts = getInitialOpenShifts()
  const currentClaims = getInitialClaims()
  const os = currentShifts.find(o => o.id === id)
  if (!os) return null
  os.status = 'cancelled'
  
  if (!os.events) os.events = []
  os.events.push({
    event: 'cancelled',
    timestamp: new Date().toISOString(),
    by_id: os.created_by,
    by_name: mockEmployees.find(e => e.id === os.created_by)?.full_name || 'Quản lý',
    note: 'Hủy ca trống'
  })

  // Reject all pending claims
  currentClaims.filter(c => c.open_shift_id === id && c.status === 'pending')
    .forEach(c => {
      c.status = 'rejected'
      c.approved_at = new Date().toISOString()
      c.approved_by = os.created_by
      pushClaimEvent(
        c,
        'claim_rejected',
        os.created_by,
        mockEmployees.find(e => e.id === os.created_by)?.full_name || 'Quản lý',
        'Đăng ký bị từ chối vì ca trống đã bị hủy',
        c.approved_at,
      )
      os.events?.push({
        event: 'claim_rejected',
        timestamp: new Date().toISOString(),
        by_id: 'system',
        by_name: 'Hệ thống',
        note: `Từ chối đăng ký nhận ca của ${mockEmployees.find(e => e.id === c.user_id)?.full_name || 'Nhân viên'} (do ca trống bị hủy)`
      })
    })
    
  saveOpenShifts(currentShifts)
  saveClaims(currentClaims)
  return os
}

// ─── Claims ───

export function claimOpenShift(openShiftId: string, userId: string): OpenShiftClaim | null {
  const currentShifts = getInitialOpenShifts()
  const currentClaims = getInitialClaims()
  const os = currentShifts.find(o => o.id === openShiftId)
  if (!os || os.status !== 'open') return null
  const claimUser = mockEmployees.find(e => e.id === userId)
  if (!claimUser) return null
  if (!['active', 'probation'].includes(claimUser.status)) return null
  if (claimUser.store_id !== os.store_id) return null
  if (!isEmployeeCompatibleWithPositionId(claimUser.position_id, os.position_id)) return null

  const hasConflict = mockSchedules.some(schedule =>
    schedule.employee_id === userId &&
    schedule.date === os.date &&
    schedule.id !== os.source_schedule_id
  )
  if (hasConflict) return null

  // Already claimed?
  const existing = currentClaims.find(c =>
    c.open_shift_id === openShiftId && c.user_id === userId && c.status !== 'rejected'
  )
  if (existing) return null

  const claimUserName = claimUser ? claimUser.full_name : 'Nhân viên'

  const claim: OpenShiftClaim = {
    id: `claim-${claimCounter++}`,
    open_shift_id: openShiftId,
    user_id: userId,
    status: 'pending',
    claimed_at: new Date().toISOString(),
    events: [],
  }

  pushClaimEvent(
    claim,
    'claim_submitted',
    userId,
    claimUserName,
    `${claimUserName} đăng ký nhận ca trống`,
    claim.claimed_at,
  )

  if (!os.events) os.events = []
  os.events.push({
    event: 'claim_submitted',
    timestamp: new Date().toISOString(),
    by_id: userId,
    by_name: claimUserName,
    note: `${claimUserName} đăng ký nhận ca trống`
  })

  // Auto-approve?
  if (os.auto_approve) {
    claim.status = 'approved'
    claim.approved_at = new Date().toISOString()
    claim.approved_by = 'system'
    pushClaimEvent(
      claim,
      'auto_approved',
      'system',
      'Hệ thống',
      `Tự động duyệt đăng ký nhận ca của ${claimUserName}`,
      claim.approved_at,
    )
    
    os.slots_filled++
    
    os.events.push({
      event: 'auto_approved',
      timestamp: new Date().toISOString(),
      by_id: 'system',
      by_name: 'Hệ thống',
      note: `Tự động duyệt đăng ký nhận ca của ${claimUserName}`
    })

    if (os.slots_filled >= os.slots_needed) {
      os.status = 'filled'
      os.events.push({
        event: 'filled',
        timestamp: new Date().toISOString(),
        by_id: 'system',
        by_name: 'Hệ thống',
        note: `Ca trống đã đủ người (${os.slots_filled}/${os.slots_needed})`
      })
    }

    if (os.source_schedule_id) {
      const sourceSchedule = mockSchedules.find(schedule => schedule.id === os.source_schedule_id)
      if (sourceSchedule) {
        sourceSchedule.employee_id = userId
        sourceSchedule.modified_after_publish = true
        sourceSchedule.change_reason = `Nhận ca trống từ ${claimUserName}`
        sourceSchedule.updated_by = userId
        sourceSchedule.updated_at = new Date().toISOString()
        saveSchedulesToStorage()
      }
    } else {
      const createdSchedule = addSchedule(os.store_id, userId, os.shift_id, os.date, `Ca trống #${os.id}`)
      createdSchedule.modified_after_publish = true
      createdSchedule.change_reason = `Nhận ca trống tự duyệt`
      createdSchedule.updated_by = userId
      createdSchedule.updated_at = new Date().toISOString()
      saveSchedulesToStorage()
    }
  }

  currentClaims.push(claim)
  saveOpenShifts(currentShifts)
  saveClaims(currentClaims)
  return claim
}

export function getClaimsForOpenShift(openShiftId: string): OpenShiftClaim[] {
  const currentClaims = getInitialClaims()
  return currentClaims.filter(c => c.open_shift_id === openShiftId)
    .sort((a, b) => a.claimed_at.localeCompare(b.claimed_at))
}

export function getPendingClaimsForStore(storeId: string): { claim: OpenShiftClaim; shift: OpenShift }[] {
  const currentShifts = getInitialOpenShifts()
  const currentClaims = getInitialClaims()
  const storeShiftIds = new Set(currentShifts.filter(os => os.store_id === storeId).map(os => os.id))
  return currentClaims
    .filter(c => c.status === 'pending' && storeShiftIds.has(c.open_shift_id))
    .map(c => ({ claim: c, shift: currentShifts.find(os => os.id === c.open_shift_id)! }))
    .filter(x => x.shift)
    .sort((a, b) => a.claim.claimed_at.localeCompare(b.claim.claimed_at))
}

export function approveOrRejectClaim(
  claimId: string,
  approve: boolean,
  managerId: string,
): OpenShiftClaim | null {
  const currentShifts = getInitialOpenShifts()
  const currentClaims = getInitialClaims()
  const claim = currentClaims.find(c => c.id === claimId)
  if (!claim || claim.status !== 'pending') return null

  const os = currentShifts.find(o => o.id === claim.open_shift_id)
  if (!os) return null

  if (approve && (os.status !== 'open' || os.slots_filled >= os.slots_needed)) {
    return null
  }

  const manager = mockEmployees.find(e => e.id === managerId)
  const managerName = manager ? manager.full_name : 'Quản lý'
  const targetUser = mockEmployees.find(e => e.id === claim.user_id)
  const targetUserName = targetUser ? targetUser.full_name : 'Nhân viên'

  if (approve) {
    if (!targetUser) return null
    if (!['active', 'probation'].includes(targetUser.status)) return null
    if (targetUser.store_id !== os.store_id) return null
    if (!isEmployeeCompatibleWithPositionId(targetUser.position_id, os.position_id)) return null

    const hasConflict = mockSchedules.some(schedule =>
      schedule.employee_id === targetUser.id &&
      schedule.date === os.date &&
      schedule.id !== os.source_schedule_id
    )
    if (hasConflict) return null
  }

  claim.status = approve ? 'approved' : 'rejected'
  claim.approved_by = managerId
  claim.approved_at = new Date().toISOString()
  pushClaimEvent(
    claim,
    approve ? 'claim_approved' : 'claim_rejected',
    managerId,
    managerName,
    approve
      ? `${managerName} duyệt đăng ký nhận ca của ${targetUserName}`
      : `${managerName} từ chối đăng ký nhận ca của ${targetUserName}`,
    claim.approved_at,
  )

  if (!os.events) os.events = []
  os.events.push({
    event: approve ? 'claim_approved' : 'claim_rejected',
    timestamp: new Date().toISOString(),
    by_id: managerId,
    by_name: managerName,
    note: approve
      ? `${managerName} duyệt đăng ký nhận ca của ${targetUserName}`
      : `${managerName} từ chối đăng ký nhận ca của ${targetUserName}`
  })

  if (approve) {
    os.slots_filled++
    if (os.slots_filled >= os.slots_needed) {
      os.status = 'filled'
      os.events.push({
        event: 'filled',
        timestamp: new Date().toISOString(),
        by_id: managerId,
        by_name: managerName,
        note: `Ca trống đã đủ người (${os.slots_filled}/${os.slots_needed})`
      })
      
      // Auto reject all other pending claims for this open shift
      currentClaims
        .filter(c => c.open_shift_id === os.id && c.status === 'pending')
        .forEach(c => {
          c.status = 'rejected'
          c.approved_by = managerId
          c.approved_at = new Date().toISOString()
          pushClaimEvent(
            c,
            'claim_rejected',
            managerId,
            managerName,
            'Đăng ký bị từ chối tự động vì ca trống đã đủ người',
            c.approved_at,
          )
          
          const otherUser = mockEmployees.find(e => e.id === c.user_id)?.full_name || 'Nhân viên'
          os.events?.push({
            event: 'claim_rejected',
            timestamp: new Date().toISOString(),
            by_id: managerId,
            by_name: managerName,
            note: `Tự động từ chối đăng ký của ${otherUser} (do ca trống đã đủ người)`
          })
        })
    }

    if (os.source_schedule_id) {
      const sourceSchedule = mockSchedules.find(schedule => schedule.id === os.source_schedule_id)
      if (sourceSchedule) {
        sourceSchedule.employee_id = claim.user_id
        sourceSchedule.modified_after_publish = true
        sourceSchedule.change_reason = `Manager duyệt chuyển ca trống cho ${targetUserName}`
        sourceSchedule.updated_by = managerId
        sourceSchedule.updated_at = new Date().toISOString()
        saveSchedulesToStorage()
      }
    } else {
      const createdSchedule = addSchedule(os.store_id, claim.user_id, os.shift_id, os.date, `Ca trống #${os.id}`)
      createdSchedule.modified_after_publish = true
      createdSchedule.change_reason = `Manager duyệt nhận ca trống cho ${targetUserName}`
      createdSchedule.updated_by = managerId
      createdSchedule.updated_at = new Date().toISOString()
      saveSchedulesToStorage()
    }
  }

  saveOpenShifts(currentShifts)
  saveClaims(currentClaims)
  return claim
}

export function getMyOpenShiftClaims(userId: string): { claim: OpenShiftClaim; shift: OpenShift }[] {
  const currentShifts = getInitialOpenShifts()
  const currentClaims = getInitialClaims()
  return currentClaims
    .filter(c => c.user_id === userId)
    .map(c => ({ claim: c, shift: currentShifts.find(os => os.id === c.open_shift_id)! }))
    .filter(x => x.shift)
    .sort((a, b) => b.claim.claimed_at.localeCompare(a.claim.claimed_at))
}

// Re-export helpers
export { getShiftById, getStoreById, getPositionById, mockShifts, mockPositions }
