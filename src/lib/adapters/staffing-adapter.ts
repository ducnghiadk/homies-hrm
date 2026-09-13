// ============================================
// HRM Trà Sữa 🧋 — Staffing Data Adapter
// Real DB + LocalStorage Sync Adapter for Staffing Workspace & Schedules
// ============================================

import { isRealDbMode } from './repository-config'
import { supabase } from '../supabase'
import type { ScheduleResult } from '@/lib/mock-data-smart-schedule'
import type { AdminSettings } from '@/lib/staffing/types'

const LOCAL_KEY_SCHEDULE = 'homies_latest_published_schedule'
const LOCAL_KEY_SETTINGS = 'homies_staffing_admin_settings'

const DEFAULT_ADMIN_SETTINGS: AdminSettings = {
  productivity: 25,
  appOrderTimeBuffer: 30,
  defaultSalaryFT: 7000000,
  defaultSalaryPT: 25000,
  bhxhRatio: 30,
  costWarningThreshold: 20,
}

export const staffingAdapter = {
  /**
   * Load the latest published smart schedule for workspace
   */
  async getLatestPublishedSchedule(): Promise<ScheduleResult | null> {
    if (isRealDbMode()) {
      try {
        if (supabase) {
          const { data, error } = await supabase
            .from('lich_lam_viec')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

          if (!error && data && data.ghi_chu) {
            try {
              const parsed = JSON.parse(data.ghi_chu)
              if (parsed && parsed.shifts) return parsed as ScheduleResult
            } catch (e) {
              console.warn('Failed to parse schedule JSON from database', e)
            }
          }
        }
      } catch (err) {
        console.warn('Supabase fetch published schedule error, falling back to LocalStorage:', err)
      }
    }

    // LocalStorage fallback
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_KEY_SCHEDULE)
      if (saved) {
        try {
          return JSON.parse(saved) as ScheduleResult
        } catch (e) {
          console.error('Failed to parse schedule from localStorage', e)
        }
      }
    }

    return null
  },

  /**
   * Save published schedule to Supabase Cloud & LocalStorage sync
   */
  async savePublishedSchedule(schedule: ScheduleResult): Promise<void> {
    // 1. LocalStorage update immediately
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_KEY_SCHEDULE, JSON.stringify(schedule))
    }

    // 2. Real DB sync
    if (isRealDbMode()) {
      try {
        if (supabase) {
          await supabase.from('lich_lam_viec').insert({
            id: `sch-${Date.now()}`,
            cua_hang_id: 'store-001',
            tuan_thu: 1,
            nam: new Date().getFullYear(),
            trang_thai: 'da_xuat_ban',
            ghi_chu: JSON.stringify(schedule),
            created_at: new Date().toISOString(),
          })
        }
      } catch (err) {
        console.warn('Supabase save published schedule error:', err)
      }
    }
  },

  /**
   * Load Admin Staffing Settings
   */
  async getAdminSettings(): Promise<AdminSettings> {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(LOCAL_KEY_SETTINGS)
      if (saved) {
        try {
          return { ...DEFAULT_ADMIN_SETTINGS, ...JSON.parse(saved) }
        } catch (e) {
          console.warn('Parse staffing admin settings error:', e)
        }
      }
    }
    return DEFAULT_ADMIN_SETTINGS
  },

  /**
   * Save Admin Staffing Settings
   */
  async saveAdminSettings(settings: AdminSettings): Promise<void> {
    if (typeof window !== 'undefined') {
      localStorage.setItem(LOCAL_KEY_SETTINGS, JSON.stringify(settings))
    }
  },
}
