// =============================================
// Open Shifts — Mock data store
// =============================================

import {
  mockSchedules, mockEmployees, mockShifts, mockPositions,
  getShiftById, getStoreById, getPositionById,
  addSchedule,
} from './mock-data'

export interface OpenShift {
  id: string
  store_id: string
  shift_id: string
  date: string
  position_id: string
  slots_needed: number
  slots_filled: number
  note: string
  auto_approve: boolean
  status: 'open' | 'filled' | 'cancelled'
  created_by: string
  created_at: string
}

export interface OpenShiftClaim {
  id: string
  open_shift_id: string
  user_id: string
  status: 'pending' | 'approved' | 'rejected'
  claimed_at: string
  approved_by?: string
  approved_at?: string
}

let openShiftCounter = 100
let claimCounter = 100
const openShifts: OpenShift[] = []
const claims: OpenShiftClaim[] = []

// ─── Seed sample data ───
function seedOpenShifts() {
  if (openShifts.length > 0) return

  const today = new Date()
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() + i + 1)
    return d.toISOString().split('T')[0]
  })

  // A few open shifts for store-001
  const seeds: Omit<OpenShift, 'id' | 'created_at'>[] = [
    { store_id: 'store-001', shift_id: 'shift-001', date: dates[0], position_id: 'pos-001', slots_needed: 2, slots_filled: 0, note: 'Thiếu người ca sáng', auto_approve: false, status: 'open', created_by: 'emp-003' },
    { store_id: 'store-001', shift_id: 'shift-002', date: dates[1], position_id: 'pos-002', slots_needed: 1, slots_filled: 0, note: '', auto_approve: true, status: 'open', created_by: 'emp-003' },
    { store_id: 'store-001', shift_id: 'shift-003', date: dates[2], position_id: 'pos-001', slots_needed: 1, slots_filled: 0, note: 'Cần gấp', auto_approve: false, status: 'open', created_by: 'emp-003' },
    { store_id: 'store-001', shift_id: 'shift-001', date: dates[4], position_id: 'pos-003', slots_needed: 3, slots_filled: 1, note: 'Ngày đông khách', auto_approve: true, status: 'open', created_by: 'emp-003' },
  ]

  seeds.forEach(s => {
    openShifts.push({
      ...s,
      id: `os-${openShiftCounter++}`,
      created_at: new Date(Date.now() - Math.random() * 86400000).toISOString(),
    })
  })
}
seedOpenShifts()

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
  }
  openShifts.push(os)
  return os
}

export function getOpenShiftsByStore(storeId: string): OpenShift[] {
  return openShifts.filter(os => os.store_id === storeId && os.status === 'open')
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function getOpenShiftsByStoreWeek(storeId: string, weekDates: string[]): OpenShift[] {
  const dateSet = new Set(weekDates)
  return openShifts.filter(os => os.store_id === storeId && dateSet.has(os.date) && os.status !== 'cancelled')
}

export function getAvailableOpenShiftsForEmployee(userId: string): OpenShift[] {
  const emp = mockEmployees.find(e => e.id === userId)
  if (!emp) return []

  const todayStr = new Date().toISOString().split('T')[0]

  return openShifts.filter(os => {
    if (os.status !== 'open') return false
    if (os.date < todayStr) return false
    if (os.store_id !== emp.store_id) return false

    // Check position match
    if (os.position_id !== emp.position_id) return false

    // Check no conflicting schedule
    const hasConflict = mockSchedules.some(s =>
      s.employee_id === userId && s.date === os.date && s.shift_id === os.shift_id
    )
    if (hasConflict) return false

    // Check hasn't already claimed (pending or approved)
    const alreadyClaimed = claims.some(c =>
      c.open_shift_id === os.id && c.user_id === userId && c.status !== 'rejected'
    )
    if (alreadyClaimed) return false

    return true
  }).sort((a, b) => a.date.localeCompare(b.date))
}

export function getOpenShiftById(id: string): OpenShift | undefined {
  return openShifts.find(os => os.id === id)
}

export function cancelOpenShift(id: string): OpenShift | null {
  const os = openShifts.find(o => o.id === id)
  if (!os) return null
  os.status = 'cancelled'
  // Reject all pending claims
  claims.filter(c => c.open_shift_id === id && c.status === 'pending')
    .forEach(c => { c.status = 'rejected' })
  return os
}

// ─── Claims ───

export function claimOpenShift(openShiftId: string, userId: string): OpenShiftClaim | null {
  const os = openShifts.find(o => o.id === openShiftId)
  if (!os || os.status !== 'open') return null

  // Already claimed?
  const existing = claims.find(c =>
    c.open_shift_id === openShiftId && c.user_id === userId && c.status !== 'rejected'
  )
  if (existing) return null

  const claim: OpenShiftClaim = {
    id: `claim-${claimCounter++}`,
    open_shift_id: openShiftId,
    user_id: userId,
    status: 'pending',
    claimed_at: new Date().toISOString(),
  }

  // Auto-approve?
  if (os.auto_approve) {
    claim.status = 'approved'
    claim.approved_at = new Date().toISOString()
    claim.approved_by = 'system'
    os.slots_filled++
    if (os.slots_filled >= os.slots_needed) os.status = 'filled'

    // Create schedule
    addSchedule(os.store_id, userId, os.shift_id, os.date, `Ca trống #${os.id}`)
  }

  claims.push(claim)
  return claim
}

export function getClaimsForOpenShift(openShiftId: string): OpenShiftClaim[] {
  return claims.filter(c => c.open_shift_id === openShiftId)
    .sort((a, b) => a.claimed_at.localeCompare(b.claimed_at))
}

export function getPendingClaimsForStore(storeId: string): { claim: OpenShiftClaim; shift: OpenShift }[] {
  const storeShiftIds = new Set(openShifts.filter(os => os.store_id === storeId).map(os => os.id))
  return claims
    .filter(c => c.status === 'pending' && storeShiftIds.has(c.open_shift_id))
    .map(c => ({ claim: c, shift: openShifts.find(os => os.id === c.open_shift_id)! }))
    .filter(x => x.shift)
    .sort((a, b) => a.claim.claimed_at.localeCompare(b.claim.claimed_at))
}

export function approveOrRejectClaim(
  claimId: string,
  approve: boolean,
  managerId: string,
): OpenShiftClaim | null {
  const claim = claims.find(c => c.id === claimId)
  if (!claim) return null

  claim.status = approve ? 'approved' : 'rejected'
  claim.approved_by = managerId
  claim.approved_at = new Date().toISOString()

  if (approve) {
    const os = openShifts.find(o => o.id === claim.open_shift_id)
    if (os) {
      os.slots_filled++
      if (os.slots_filled >= os.slots_needed) os.status = 'filled'

      // Create schedule
      addSchedule(os.store_id, claim.user_id, os.shift_id, os.date, `Ca trống #${os.id}`)
    }
  }

  return claim
}

export function getMyOpenShiftClaims(userId: string): { claim: OpenShiftClaim; shift: OpenShift }[] {
  return claims
    .filter(c => c.user_id === userId)
    .map(c => ({ claim: c, shift: openShifts.find(os => os.id === c.open_shift_id)! }))
    .filter(x => x.shift)
    .sort((a, b) => b.claim.claimed_at.localeCompare(a.claim.claimed_at))
}

// Re-export helpers
export { getShiftById, getStoreById, getPositionById, mockShifts, mockPositions }
