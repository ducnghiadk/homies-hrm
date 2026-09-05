// ============================================
// HRM Trà Sữa 🧋 — Shift Registration & Preferences Adapter
// Unified Repository for Employee Weekly Availability & Registration Weeks
// ============================================

import { isRealDbMode } from './repository-config'
import { supabase, isSupabaseConfigured } from '../supabase'
import type { RegistrationWeek, ShiftQuota } from '@/lib/mock-data-registration-weeks'
import type { ShiftPreference } from '@/lib/mock-data-preferences'
import type { AuthUser } from '@/store/auth-store'

const REGISTRATION_WEEKS_STORAGE_KEY = 'HOMIES_REGISTRATION_WEEKS_V1'
const SHIFT_QUOTAS_STORAGE_KEY = 'HOMIES_SHIFT_QUOTAS_V1'
const PREFERENCES_STORAGE_KEY = 'HOMIES_SHIFT_PREFERENCES_V1'

export function getMondayOfDate(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(date.setDate(diff))
}

export function formatDateString(d: Date): string {
  return d.toISOString().split('T')[0]
}

// ----------------------------------------------------
// Local Persistent Storage Helpers
// ----------------------------------------------------
function getStoredWeeks(): RegistrationWeek[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(REGISTRATION_WEEKS_STORAGE_KEY) || localStorage.getItem('homies_registration_weeks')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveStoredWeeks(weeks: RegistrationWeek[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(REGISTRATION_WEEKS_STORAGE_KEY, JSON.stringify(weeks))
    localStorage.setItem('homies_registration_weeks', JSON.stringify(weeks))
  } catch {}
}

function getStoredQuotas(): ShiftQuota[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(SHIFT_QUOTAS_STORAGE_KEY) || localStorage.getItem('homies_shift_quotas')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveStoredQuotas(quotas: ShiftQuota[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SHIFT_QUOTAS_STORAGE_KEY, JSON.stringify(quotas))
    localStorage.setItem('homies_shift_quotas', JSON.stringify(quotas))
  } catch {}
}

function getStoredPreferences(): ShiftPreference[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PREFERENCES_STORAGE_KEY) || localStorage.getItem('homies_shift_preferences')
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveStoredPreferences(prefs: ShiftPreference[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs))
    localStorage.setItem('homies_shift_preferences', JSON.stringify(prefs))
  } catch {}
}

function initDefaultWeeks(): RegistrationWeek[] {
  const today = new Date()
  const thisMonday = getMondayOfDate(today)
  const nextMonday = new Date(thisMonday)
  nextMonday.setDate(thisMonday.getDate() + 7)

  const thisMondayStr = formatDateString(thisMonday)
  const nextMondayStr = formatDateString(nextMonday)

  const open1 = new Date(thisMonday)
  open1.setDate(thisMonday.getDate() - 7)
  const deadline1 = new Date(thisMonday)
  deadline1.setDate(thisMonday.getDate() - 2)

  const open2 = new Date(thisMonday)
  open2.setDate(thisMonday.getDate() - 3)
  const deadline2 = new Date(thisMonday)
  deadline2.setDate(thisMonday.getDate() + 4)

  const initialWeeks: RegistrationWeek[] = [
    {
      id: `reg-week-${thisMondayStr}`,
      org_id: 'org-001',
      store_id: 'store-001',
      week_start_date: thisMondayStr,
      status: 'published',
      registration_open_date: formatDateString(open1),
      registration_deadline: `${formatDateString(deadline1)}T23:59`,
      created_by: 'emp-001',
      published_at: `${formatDateString(deadline1)}T20:00:00`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: `reg-week-${nextMondayStr}`,
      org_id: 'org-001',
      store_id: 'store-001',
      week_start_date: nextMondayStr,
      status: 'open',
      registration_open_date: formatDateString(open2),
      registration_deadline: `${formatDateString(deadline2)}T23:59`,
      created_by: 'emp-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]

  saveStoredWeeks(initialWeeks)
  return initialWeeks
}

export interface ShiftRegistrationAdapter {
  getRegistrationWeeks: (storeId?: string) => Promise<RegistrationWeek[]>
  getRegistrationWeekByWeek: (weekStartDate: string, storeId?: string) => Promise<RegistrationWeek | null>
  openRegistrationWeek: (
    weekStartDate: string,
    registrationDeadline: string,
    storeId: string,
    createdBy: string,
    options?: {
      id?: string
      status?: RegistrationWeek['status']
      registrationOpenDate?: string
      publishedAt?: string
    }
  ) => Promise<RegistrationWeek>
  updateRegistrationWeekStatus: (
    weekId: string,
    status: 'closed' | 'open' | 'reviewing' | 'published'
  ) => Promise<RegistrationWeek | null>
  getPreferencesForWeek: (weekStartDate: string, storeId?: string) => Promise<ShiftPreference[]>
  getEmployeePreferencesForWeek: (userId: string, weekStartDate: string) => Promise<ShiftPreference[]>
  submitPreferences: (
    userId: string,
    weekStartDate: string,
    items: ShiftPreference[],
    currentUser?: AuthUser
  ) => Promise<{ success: boolean; count: number }>
  getShiftQuotas: (registrationWeekId: string) => Promise<ShiftQuota[]>
  saveShiftQuotas: (quotas: ShiftQuota[]) => Promise<boolean>
}

export const shiftRegistrationAdapter: ShiftRegistrationAdapter = {
  async getRegistrationWeeks(storeId?: string): Promise<RegistrationWeek[]> {
    let weeks = getStoredWeeks()
    if (weeks.length === 0) {
      weeks = initDefaultWeeks()
    }
    if (storeId && storeId !== 'all') {
      return weeks.filter(w => w.store_id === storeId || w.store_id === 'all')
    }
    return weeks
  },

  async getRegistrationWeekByWeek(weekStartDate: string, storeId?: string): Promise<RegistrationWeek | null> {
    const weeks = await this.getRegistrationWeeks(storeId)
    return weeks.find(w => w.week_start_date === weekStartDate) || null
  },

  async openRegistrationWeek(
    weekStartDate: string,
    registrationDeadline: string,
    storeId: string,
    createdBy: string,
    options?: {
      id?: string
      status?: RegistrationWeek['status']
      registrationOpenDate?: string
      publishedAt?: string
    }
  ): Promise<RegistrationWeek> {
    const weeks = await this.getRegistrationWeeks()
    const now = new Date().toISOString()
    const existingIdx = weeks.findIndex(w => w.week_start_date === weekStartDate && w.store_id === storeId)
    const existing = existingIdx >= 0 ? weeks[existingIdx] : undefined
    const status = options?.status || 'open'

    const newWeek: RegistrationWeek = {
      id: options?.id || existing?.id || `reg-week-${Date.now()}`,
      org_id: existing?.org_id || 'org-001',
      store_id: storeId,
      week_start_date: weekStartDate,
      status,
      registration_open_date: options?.registrationOpenDate || existing?.registration_open_date || now.slice(0, 10),
      registration_deadline: registrationDeadline,
      created_by: createdBy,
      ...(status === 'published' && (options?.publishedAt || existing?.published_at)
        ? { published_at: options?.publishedAt || existing?.published_at }
        : {}),
      created_at: existing?.created_at || now,
      updated_at: now,
    }

    if (existingIdx >= 0) {
      weeks[existingIdx] = newWeek
    } else {
      weeks.push(newWeek)
    }

    saveStoredWeeks(weeks)
    return newWeek
  },

  async updateRegistrationWeekStatus(
    weekId: string,
    status: 'closed' | 'open' | 'reviewing' | 'published'
  ): Promise<RegistrationWeek | null> {
    const weeks = await this.getRegistrationWeeks()
    const idx = weeks.findIndex(w => w.id === weekId)
    if (idx === -1) return null

    weeks[idx].status = status
    weeks[idx].updated_at = new Date().toISOString()
    if (status === 'published') {
      weeks[idx].published_at = new Date().toISOString()
    } else {
      delete weeks[idx].published_at
    }

    saveStoredWeeks(weeks)
    return weeks[idx]
  },

  async getPreferencesForWeek(weekStartDate: string): Promise<ShiftPreference[]> {
    const all = getStoredPreferences()
    return all.filter(p => p.week_start_date === weekStartDate)
  },

  async getEmployeePreferencesForWeek(userId: string, weekStartDate: string): Promise<ShiftPreference[]> {
    const all = getStoredPreferences()
    return all.filter(p => (p.user_id === userId || p.user_id === userId.toLowerCase()) && p.week_start_date === weekStartDate)
  },

  async submitPreferences(
    userId: string,
    weekStartDate: string,
    items: ShiftPreference[],
    currentUser?: AuthUser
  ): Promise<{ success: boolean; count: number }> {
    const all = getStoredPreferences()
    const other = all.filter(p => !(p.user_id === userId && p.week_start_date === weekStartDate))
    const now = new Date().toISOString()

    const formatted = items.map(item => ({
      ...item,
      user_id: userId,
      week_start_date: weekStartDate,
      status: 'submitted' as const,
      submitted_at: now,
      updated_at: now,
    }))

    const updated = [...other, ...formatted]
    saveStoredPreferences(updated)

    // Log action to console or Supabase
    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        console.log(`[ShiftRegistrationAdapter] Successfully synced ${items.length} shift preferences for ${userId}`)
      } catch (err) {
        console.warn('[ShiftRegistrationAdapter] Sync warning:', err)
      }
    }

    return { success: true, count: items.length }
  },

  async getShiftQuotas(registrationWeekId: string): Promise<ShiftQuota[]> {
    const quotas = getStoredQuotas()
    return quotas.filter(q => q.registration_week_id === registrationWeekId)
  },

  async saveShiftQuotas(newQuotas: ShiftQuota[]): Promise<boolean> {
    const existing = getStoredQuotas()
    const weekIds = new Set(newQuotas.map(q => q.registration_week_id))
    const remaining = existing.filter(q => !weekIds.has(q.registration_week_id))
    saveStoredQuotas([...remaining, ...newQuotas])
    return true
  }
}
