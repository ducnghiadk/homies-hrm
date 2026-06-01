// ==========================================================
// Shift Registration Weeks & Shift Quotas — Mock Data Store
// ==========================================================

import { mockShifts, mockEmployees, mockSchedules, initSchedules, saveSchedulesToStorage } from './mock-data'
import { getAllPreferencesForWeek, getShiftPreferenceAvailability, type ShiftPreference } from './mock-data-preferences'

export interface RegistrationWeek {
  id: string
  org_id: string
  store_id: string
  week_start_date: string // Monday's date in yyyy-MM-dd format
  status: 'closed' | 'open' | 'reviewing' | 'published'
  registration_open_date: string // yyyy-MM-dd
  registration_deadline: string // yyyy-MM-ddTHH:mm
  created_by: string // employee_id
  published_at?: string
  created_at: string
  updated_at: string
}

export interface ShiftQuota {
  id: string
  registration_week_id: string
  shift_id: string
  date: string // yyyy-MM-dd
  min_staff: number
  max_staff: number
  notes?: string
}

// ─── Helpers to generate real dynamic dates ───
export function getMondayOfDate(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1) // adjust when day is sunday
  return new Date(date.setDate(diff))
}

export function formatDateString(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ─── In-memory Storage with LocalStorage persistence helper ───
let registrationWeeks: RegistrationWeek[] = []
let shiftQuotas: ShiftQuota[] = []
let initialized = false

function initData() {
  if (initialized) return
  
  // Check client-side storage
  if (typeof window !== 'undefined') {
    const savedWeeks = localStorage.getItem('homies_registration_weeks')
    const savedQuotas = localStorage.getItem('homies_shift_quotas')
    if (savedWeeks && savedQuotas) {
      registrationWeeks = JSON.parse(savedWeeks)
      shiftQuotas = JSON.parse(savedQuotas)
      initialized = true
      return
    }
  }

  // Seed default data if not in localStorage
  const today = new Date()
  const thisMonday = getMondayOfDate(today)
  const nextMonday = new Date(thisMonday)
  nextMonday.setDate(thisMonday.getDate() + 7)

  const thisMondayStr = formatDateString(thisMonday)
  const nextMondayStr = formatDateString(nextMonday)

  // Seed 1: This current week (published)
  const week1Id = 'reg-week-this-week'
  const open1 = new Date(thisMonday)
  open1.setDate(thisMonday.getDate() - 7)
  const deadline1 = new Date(thisMonday)
  deadline1.setDate(thisMonday.getDate() - 2)

  registrationWeeks.push({
    id: week1Id,
    org_id: 'org-001',
    store_id: 'store-001',
    week_start_date: thisMondayStr,
    status: 'published',
    registration_open_date: formatDateString(open1),
    registration_deadline: formatDateString(deadline1) + 'T23:59',
    created_by: 'emp-002', // Store Manager Lan
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  // Seed 2: Next week (open for registration)
  const week2Id = 'reg-week-next-week'
  const open2 = new Date(thisMonday)
  open2.setDate(thisMonday.getDate() - 3)
  const deadline2 = new Date(thisMonday)
  deadline2.setDate(thisMonday.getDate() + 4) // Friday of this week

  registrationWeeks.push({
    id: week2Id,
    org_id: 'org-001',
    store_id: 'store-001',
    week_start_date: nextMondayStr,
    status: 'open',
    registration_open_date: formatDateString(open2),
    registration_deadline: formatDateString(deadline2) + 'T23:59',
    created_by: 'emp-002',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  })

  // Seed quotas for Next Week (Store-001 requires 1 to 2 people per shift)
  mockShifts.forEach(shift => {
    for (let i = 0; i < 7; i++) {
      const quotaDate = new Date(nextMonday)
      quotaDate.setDate(nextMonday.getDate() + i)
      shiftQuotas.push({
        id: `quota-${week2Id}-${shift.id}-${i}`,
        registration_week_id: week2Id,
        shift_id: shift.id,
        date: formatDateString(quotaDate),
        min_staff: 1,
        max_staff: 2,
        notes: i >= 5 ? 'Cuối tuần đông khách' : ''
      })
    }
  })

  saveToStorage()
  initialized = true
}

function saveToStorage() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('homies_registration_weeks', JSON.stringify(registrationWeeks))
    localStorage.setItem('homies_shift_quotas', JSON.stringify(shiftQuotas))
  }
}

// ─── Service API Functions ───

export function getRegistrationWeeks(storeId: string): RegistrationWeek[] {
  initData()
  return registrationWeeks.filter(w => w.store_id === storeId)
}

export function getRegistrationWeekById(id: string): RegistrationWeek | undefined {
  initData()
  return registrationWeeks.find(w => w.id === id)
}

export function getRegistrationWeekByWeek(storeId: string, weekStartDate: string): RegistrationWeek | undefined {
  initData()
  return registrationWeeks.find(w => w.store_id === storeId && w.week_start_date === weekStartDate)
}

export function createOrUpdateRegistrationWeek(
  data: Omit<RegistrationWeek, 'id' | 'created_at' | 'updated_at'> & { id?: string }
): RegistrationWeek {
  initData()
  const now = new Date().toISOString()
  
  if (data.id) {
    const idx = registrationWeeks.findIndex(w => w.id === data.id)
    if (idx !== -1) {
      registrationWeeks[idx] = {
        ...registrationWeeks[idx],
        ...data,
        updated_at: now
      } as RegistrationWeek
      saveToStorage()
      return registrationWeeks[idx]
    }
  }

  // Create new
  const newWeek: RegistrationWeek = {
    id: data.id || `reg-week-${Date.now()}`,
    org_id: data.org_id || 'org-001',
    store_id: data.store_id,
    week_start_date: data.week_start_date,
    status: data.status || 'closed',
    registration_open_date: data.registration_open_date,
    registration_deadline: data.registration_deadline,
    created_by: data.created_by,
    created_at: now,
    updated_at: now
  }
  registrationWeeks.push(newWeek)

  // Seed default quotas for this new week (1-2 people per shift per day)
  mockShifts.forEach(shift => {
    const monday = new Date(data.week_start_date)
    for (let i = 0; i < 7; i++) {
      const quotaDate = new Date(monday)
      quotaDate.setDate(monday.getDate() + i)
      shiftQuotas.push({
        id: `quota-${newWeek.id}-${shift.id}-${i}`,
        registration_week_id: newWeek.id,
        shift_id: shift.id,
        date: formatDateString(quotaDate),
        min_staff: 1,
        max_staff: 2,
        notes: ''
      })
    }
  })

  saveToStorage()
  return newWeek
}

export function getShiftQuotas(weekId: string): ShiftQuota[] {
  initData()
  return shiftQuotas.filter(q => q.registration_week_id === weekId)
}

export function saveShiftQuotas(weekId: string, updatedQuotas: Omit<ShiftQuota, 'id'>[]): ShiftQuota[] {
  initData()
  
  // Remove existing quotas for this week
  shiftQuotas = shiftQuotas.filter(q => q.registration_week_id !== weekId)
  
  // Insert new ones
  const nowQuotas = updatedQuotas.map((q, idx) => ({
    id: `quota-${weekId}-${q.shift_id}-${idx}`,
    ...q
  }))
  shiftQuotas.push(...nowQuotas)
  
  saveToStorage()
  return nowQuotas
}

export function updateRegistrationStatus(
  weekId: string, 
  status: RegistrationWeek['status']
): RegistrationWeek {
  initData()
  const idx = registrationWeeks.findIndex(w => w.id === weekId)
  if (idx === -1) {
    throw new Error('Registration week not found')
  }

  const now = new Date().toISOString()
  registrationWeeks[idx].status = status
  registrationWeeks[idx].updated_at = now
  
  if (status === 'published') {
    registrationWeeks[idx].published_at = now
  }
  
  saveToStorage()
  return registrationWeeks[idx]
}

// ─── Auto Assign Matching Algorithm ───
export function autoAssignFromPreferences(weekId: string): { 
  success: boolean
  assignmentsCount: number
  message: string
} {
  initData()
  initSchedules()
  const week = getRegistrationWeekById(weekId)
  if (!week) {
    return { success: false, assignmentsCount: 0, message: 'Không tìm thấy tuần đăng ký.' }
  }

  const quotas = getShiftQuotas(weekId)
  const weekStart = week.week_start_date

  // Get all store employees
  const storeEmployees = mockEmployees.filter(emp => emp.store_id === week.store_id)
  
  // Get all submitted preferences for this week
  const allPrefs = getAllPreferencesForWeek(weekStart)
  const prefMap = new Map<string, ShiftPreference>() // key: employeeId_date
  allPrefs.forEach(p => {
    prefMap.set(`${p.user_id}_${p.date}`, p)
  })

  // Clear existing schedules for this store and week to prevent duplicates
  // In real life this would delete draft schedule rows. Let's simulate:
  const weekDates: string[] = []
  const monday = new Date(weekStart)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    weekDates.push(formatDateString(d))
  }

  // Filter out any existing mockSchedules for this store & week
  for (let i = mockSchedules.length - 1; i >= 0; i--) {
    const sch = mockSchedules[i]
    if (sch.store_id === week.store_id && weekDates.includes(sch.date)) {
      mockSchedules.splice(i, 1)
    }
  }

  let assignedCount = 0

  // Loop through each day and each shift to fulfill quota
  weekDates.forEach(date => {
    const dailyQuotas = quotas.filter(q => q.date === date)
    
    dailyQuotas.forEach(quota => {
      const shiftId = quota.shift_id

      // Find employees who:
      // 1. Belong to this store
      // 2. Are available on this date for this shift
      // 3. Haven't been assigned to another shift on this day yet
      const availableEmployees = storeEmployees.filter(emp => {
        const key = `${emp.id}_${date}`
        const pref = prefMap.get(key)
        if (!pref) return false
        
        // Check if employee is available for this shift type
        const isAvail = getShiftPreferenceAvailability(pref, shiftId)
        
        // Verify not already scheduled on this day
        const alreadyScheduled = mockSchedules.some(s => s.employee_id === emp.id && s.date === date)
        
        return isAvail && !alreadyScheduled
      })

      // Assign up to max_staff
      const targetCount = quota.max_staff
      const toAssign = availableEmployees.slice(0, targetCount)

      toAssign.forEach(emp => {
        mockSchedules.push({
          id: `sch-auto-${Date.now()}-${assignedCount}`,
          org_id: week.org_id,
          store_id: week.store_id,
          employee_id: emp.id,
          shift_id: shiftId,
          date,
          notes: 'Phân ca tự động từ Đăng ký ca'
        })
        assignedCount++
      })
    })
  })

  saveSchedulesToStorage()

  return {
    success: true,
    assignmentsCount: assignedCount,
    message: `Đã tự động sắp xếp thành công ${assignedCount} ca làm việc dựa trên đăng ký nguyện vọng của nhân viên.`
  }
}
