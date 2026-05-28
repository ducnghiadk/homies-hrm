// ============================================
// HRM Trà Sữa 🧋 — Staffing Requirements Engine
// ============================================

import {
  mockPositions, mockStores, mockShifts,
  type Schedule,
} from './mock-data'

// ─── Types ───

export type StaffingRequirement = {
  id: string
  store_id: string
  shift_id: string
  position_id: string
  required_count: number
  min_count: number
  max_count: number
  is_mandatory: boolean // vị trí bắt buộc
}

export type PeakHour = {
  id: string
  store_id: string | null // null = tất cả
  name: string
  start_time: string // "11:30"
  end_time: string   // "13:30"
  days_of_week: number[] // 0=Sun,1=Mon...6=Sat
  position_id: string
  additional_count: number
  is_active: boolean
}

export type StaffingSeason = {
  id: string
  name: string
  start_date: string
  end_date: string
  multiplier: number // 1.5 = ×1.5 staff
}

export type StaffingSettings = {
  enabled: boolean
  mandatory_position_id: string // "pos-004" = Shift Leader
  shortage_warning_level: 'info' | 'warning' | 'block'
  surplus_warning_level: 'info' | 'warning' | 'off'
  allow_assign_when_short: boolean
}

export type StaffingWarning = {
  type: 'shortage' | 'surplus' | 'missing_mandatory' | 'peak_hour'
  level: 'info' | 'warning' | 'block'
  date: string
  shift_id: string
  shift_name: string
  position_name: string
  message: string
  required: number
  assigned: number
}

// ─── Default Settings ───

export const staffingSettings: StaffingSettings = {
  enabled: true,
  mandatory_position_id: 'pos-004', // Phó quản lý as shift leader
  shortage_warning_level: 'warning',
  surplus_warning_level: 'info',
  allow_assign_when_short: true,
}// Barista, Cashier
let reqId = 0
function rid() { return `sr-${String(++reqId).padStart(3, '0')}` }

function generateReqs(storeId: string, scale: number): StaffingRequirement[] {
  // scale 1.0 = full store, 0.75 = medium, 0.6 = small
  const shifts = mockShifts
  const reqs: StaffingRequirement[] = []

  shifts.forEach(shift => {
    const isMorning = shift.name.includes('Sáng')
    const isAfternoon = shift.name.includes('Chiều')

    // Barista count by shift
    const baristaBase = isAfternoon ? 3 : isMorning ? 2 : 1
    const barista = Math.max(1, Math.round(baristaBase * scale))
    reqs.push({
      id: rid(), store_id: storeId, shift_id: shift.id,
      position_id: 'pos-001', // Barista
      required_count: barista, min_count: Math.max(1, barista - 1), max_count: barista + 1,
      is_mandatory: false,
    })

    // Cashier
    const cashierBase = isAfternoon ? 2 : 1
    const cashier = Math.max(1, Math.round(cashierBase * scale))
    reqs.push({
      id: rid(), store_id: storeId, shift_id: shift.id,
      position_id: 'pos-002', // Cashier
      required_count: cashier, min_count: 1, max_count: cashier + 1,
      is_mandatory: false,
    })

    // Shift Leader (Phó QL) — mandatory
    reqs.push({
      id: rid(), store_id: storeId, shift_id: shift.id,
      position_id: 'pos-004', // Phó quản lý
      required_count: 1, min_count: 1, max_count: 1,
      is_mandatory: true,
    })
  })

  return reqs
}

export const staffingRequirements: StaffingRequirement[] = [
  ...generateReqs('store-001', 1.0),
  ...generateReqs('store-002', 0.75),
  ...generateReqs('store-003', 0.85),
]

// ─── Peak Hours ───

export const peakHours: PeakHour[] = [
  {
    id: 'ph-001', store_id: null,
    name: 'Cao điểm trưa', start_time: '11:30', end_time: '13:30',
    days_of_week: [1, 2, 3, 4, 5, 6, 0], // all
    position_id: 'pos-001', additional_count: 1, is_active: true,
  },
  {
    id: 'ph-002', store_id: null,
    name: 'Cao điểm tối', start_time: '17:00', end_time: '20:00',
    days_of_week: [1, 2, 3, 4, 5, 6, 0],
    position_id: 'pos-001', additional_count: 2, is_active: true,
  },
  {
    id: 'ph-003', store_id: null,
    name: 'Cuối tuần', start_time: '08:00', end_time: '23:00',
    days_of_week: [0, 6], // Sun, Sat
    position_id: 'pos-001', additional_count: 1, is_active: true,
  },
]

// ─── Seasons ───

export const staffingSeasons: StaffingSeason[] = [
  { id: 'ssn-001', name: 'Tết 2026', start_date: '2026-01-25', end_date: '2026-02-10', multiplier: 1.5 },
  { id: 'ssn-002', name: 'Hè 2026', start_date: '2026-06-01', end_date: '2026-08-31', multiplier: 1.2 },
  { id: 'ssn-003', name: 'Noel 2026', start_date: '2026-12-20', end_date: '2026-12-26', multiplier: 1.3 },
]

// ─── Core Functions ───

/** Get required staff for a store+shift (with seasonal multiplier) */
export function getRequiredStaff(
  storeId: string,
  shiftId: string,
  date?: string,
): { position_id: string; position_name: string; required: number; is_mandatory: boolean }[] {
  const reqs = staffingRequirements.filter(r => r.store_id === storeId && r.shift_id === shiftId)

  // Check season
  let seasonMultiplier = 1
  if (date) {
    const season = staffingSeasons.find(s => date >= s.start_date && date <= s.end_date)
    if (season) seasonMultiplier = season.multiplier
  }

  return reqs.map(r => {
    const pos = mockPositions.find(p => p.id === r.position_id)
    return {
      position_id: r.position_id,
      position_name: pos?.name || r.position_id,
      required: Math.ceil(r.required_count * seasonMultiplier),
      is_mandatory: r.is_mandatory,
    }
  })
}

/** Count assigned employees per position for a store+date+shift */
export function getAssignedStaff(
  storeId: string,
  date: string,
  shiftId: string,
  schedules: Schedule[],
  employees: { id: string; position_id: string }[],
): { position_id: string; position_name: string; count: number }[] {
  const matchingSchedules = schedules.filter(
    s => s.store_id === storeId && s.date === date && s.shift_id === shiftId
  )

  // Group by position
  const countMap: Record<string, number> = {}
  matchingSchedules.forEach(sch => {
    const emp = employees.find(e => e.id === sch.employee_id)
    if (emp) {
      countMap[emp.position_id] = (countMap[emp.position_id] || 0) + 1
    }
  })

  return Object.entries(countMap).map(([posId, count]) => {
    const pos = mockPositions.find(p => p.id === posId)
    return { position_id: posId, position_name: pos?.name || posId, count }
  })
}

/** Full day summary: required vs assigned per shift */
export type DayStaffingSummary = {
  date: string
  shifts: {
    shift_id: string
    shift_name: string
    positions: {
      position_id: string
      position_name: string
      required: number
      assigned: number
      diff: number // negative = shortage, positive = surplus
      is_mandatory: boolean
    }[]
    totalRequired: number
    totalAssigned: number
  }[]
  totalRequired: number
  totalAssigned: number
}

export function getDailyStaffingSummary(
  storeId: string,
  date: string,
  schedules: Schedule[],
  employees: { id: string; position_id: string }[],
): DayStaffingSummary {
  const shifts = mockShifts
  let totalReq = 0
  let totalAsg = 0

  const shiftSummaries = shifts.map(shift => {
    const required = getRequiredStaff(storeId, shift.id, date)
    const assigned = getAssignedStaff(storeId, date, shift.id, schedules, employees)

    let shiftReq = 0
    let shiftAsg = 0

    const positions = required.map(req => {
      const asg = assigned.find(a => a.position_id === req.position_id)
      const assignedCount = asg?.count || 0
      shiftReq += req.required
      shiftAsg += assignedCount
      return {
        position_id: req.position_id,
        position_name: req.position_name,
        required: req.required,
        assigned: assignedCount,
        diff: assignedCount - req.required,
        is_mandatory: req.is_mandatory,
      }
    })

    // Add positions assigned but not in requirements
    assigned.forEach(a => {
      if (!required.find(r => r.position_id === a.position_id)) {
        shiftAsg += a.count
        positions.push({
          position_id: a.position_id,
          position_name: a.position_name,
          required: 0,
          assigned: a.count,
          diff: a.count,
          is_mandatory: false,
        })
      }
    })

    totalReq += shiftReq
    totalAsg += shiftAsg

    return {
      shift_id: shift.id,
      shift_name: shift.name,
      positions,
      totalRequired: shiftReq,
      totalAssigned: shiftAsg,
    }
  })

  return {
    date,
    shifts: shiftSummaries,
    totalRequired: totalReq,
    totalAssigned: totalAsg,
  }
}

/** Week summary: total required vs assigned across all days */
export function getWeeklyStaffingSummary(
  storeId: string,
  weekDates: string[],
  schedules: Schedule[],
  employees: { id: string; position_id: string }[],
): { totalRequired: number; totalAssigned: number; shortage: number; daily: DayStaffingSummary[] } {
  const daily = weekDates.map(d => getDailyStaffingSummary(storeId, d, schedules, employees))
  const totalRequired = daily.reduce((s, d) => s + d.totalRequired, 0)
  const totalAssigned = daily.reduce((s, d) => s + d.totalAssigned, 0)
  return {
    totalRequired,
    totalAssigned,
    shortage: Math.max(0, totalRequired - totalAssigned),
    daily,
  }
}

/** Generate staffing warnings */
export function checkStaffingWarnings(
  storeId: string,
  weekDates: string[],
  schedules: Schedule[],
  employees: { id: string; position_id: string }[],
): StaffingWarning[] {
  if (!staffingSettings.enabled) return []

  const warnings: StaffingWarning[] = []
  const summary = getWeeklyStaffingSummary(storeId, weekDates, schedules, employees)

  summary.daily.forEach(day => {
    day.shifts.forEach(shift => {
      shift.positions.forEach(pos => {
        if (pos.diff < 0) {
          // SHORTAGE
          const isMandatory = pos.is_mandatory && pos.assigned === 0
          warnings.push({
            type: isMandatory ? 'missing_mandatory' : 'shortage',
            level: isMandatory ? 'block' : staffingSettings.shortage_warning_level,
            date: day.date,
            shift_id: shift.shift_id,
            shift_name: shift.shift_name,
            position_name: pos.position_name,
            message: isMandatory
              ? `${shift.shift_name} ngày ${day.date.slice(5)} không có ${pos.position_name}`
              : `${shift.shift_name} ngày ${day.date.slice(5)} thiếu ${Math.abs(pos.diff)} ${pos.position_name}`,
            required: pos.required,
            assigned: pos.assigned,
          })
        } else if (pos.diff > 1 && staffingSettings.surplus_warning_level !== 'off') {
          // SURPLUS (>1 extra)
          warnings.push({
            type: 'surplus',
            level: staffingSettings.surplus_warning_level as 'info' | 'warning',
            date: day.date,
            shift_id: shift.shift_id,
            shift_name: shift.shift_name,
            position_name: pos.position_name,
            message: `${shift.shift_name} ngày ${day.date.slice(5)} thừa ${pos.diff} ${pos.position_name} (có ${pos.assigned}, cần ${pos.required})`,
            required: pos.required,
            assigned: pos.assigned,
          })
        }
      })
    })
  })

  return warnings
}

// ─── CRUD ───

export function updateRequirement(storeId: string, shiftId: string, positionId: string, count: number) {
  const req = staffingRequirements.find(
    r => r.store_id === storeId && r.shift_id === shiftId && r.position_id === positionId
  )
  if (req) {
    req.required_count = count
    req.min_count = Math.max(1, count - 1)
    req.max_count = count + 1
  }
}

export function addPeakHour(ph: Omit<PeakHour, 'id'>) {
  peakHours.push({ ...ph, id: `ph-${String(peakHours.length + 1).padStart(3, '0')}` })
}

export function removePeakHour(id: string) {
  const idx = peakHours.findIndex(p => p.id === id)
  if (idx >= 0) peakHours.splice(idx, 1)
}

export function addStaffingSeason(s: Omit<StaffingSeason, 'id'>) {
  staffingSeasons.push({ ...s, id: `ssn-${String(staffingSeasons.length + 1).padStart(3, '0')}` })
}

export function removeStaffingSeason(id: string) {
  const idx = staffingSeasons.findIndex(s => s.id === id)
  if (idx >= 0) staffingSeasons.splice(idx, 1)
}

export function copyStaffingToAllStores(sourceStoreId: string) {
  const sourceReqs = staffingRequirements.filter(r => r.store_id === sourceStoreId)
  const targetStores = mockStores.filter(s => s.id !== sourceStoreId && s.is_active)

  targetStores.forEach(store => {
    sourceReqs.forEach(src => {
      const existing = staffingRequirements.find(
        r => r.store_id === store.id && r.shift_id === src.shift_id && r.position_id === src.position_id
      )
      if (existing) {
        existing.required_count = src.required_count
        existing.min_count = src.min_count
        existing.max_count = src.max_count
        existing.is_mandatory = src.is_mandatory
      } else {
        staffingRequirements.push({ ...src, id: rid(), store_id: store.id })
      }
    })
  })
}
