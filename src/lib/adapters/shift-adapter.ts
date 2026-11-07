// ============================================
// HRM Trà Sữa 🧋 — Shift Data Adapter
// Unified Shift Repository for Supabase & Local Cache
// ============================================

import { isRealDbMode } from './repository-config'
import { supabase, isSupabaseConfigured } from '../supabase'

const ORG_DEFAULT_ID = 'a0000000-0000-0000-0000-000000000001'

export type ShiftTemplateScope = 'global' | 'store_specific'

export interface ShiftTemplate {
  id: string
  base_shift_id: string
  name: string
  code: string
  start_time: string
  end_time: string
  color: string
  store_scope: ShiftTemplateScope
  store_id?: string
  is_active: boolean
  is_flexible?: boolean
  allowed_position_ids?: string[]
  min_headcount?: number
  max_headcount?: number
  created_at: string
  updated_at: string
}

// ----------------------------------------------------
// Persistent Metadata Store for Extended Properties
// (allowed_position_ids, headcount limits, scope)
// ----------------------------------------------------
const SHIFT_EXTRA_META_KEY = 'HOMIES_SHIFT_EXTRA_METADATA_V1'
const LOCAL_SHIFTS_BACKUP_KEY = 'homies_shift_templates'

export interface ShiftExtraMeta {
  allowed_position_ids?: string[]
  min_headcount?: number
  max_headcount?: number
  store_scope?: ShiftTemplateScope
  store_id?: string
  is_flexible?: boolean
}

function getStoredShiftMetadata(): Record<string, ShiftExtraMeta> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(SHIFT_EXTRA_META_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveStoredShiftMetadata(map: Record<string, ShiftExtraMeta>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(SHIFT_EXTRA_META_KEY, JSON.stringify(map))
  } catch {}
}

export function getShiftExtraMeta(key?: string): ShiftExtraMeta {
  if (!key) return {}
  const map = getStoredShiftMetadata()
  return map[key] || {}
}

export function setShiftExtraMeta(keys: (string | undefined)[], meta: Partial<ShiftExtraMeta>) {
  const map = getStoredShiftMetadata()
  const validKeys = keys.filter((k): k is string => Boolean(k && k.trim()))
  if (validKeys.length === 0) return

  const existing = validKeys.reduce<ShiftExtraMeta>((acc, k) => ({ ...acc, ...(map[k] || {}) }), {})
  const merged: ShiftExtraMeta = {
    ...existing,
    ...meta,
  }

  validKeys.forEach(k => {
    map[k] = merged
  })

  saveStoredShiftMetadata(map)
}

// ----------------------------------------------------
// ----------------------------------------------------
// 5 Khung ca chuẩn Homies F&B thực tế và ca linh hoạt
// ----------------------------------------------------
export const DEFAULT_HOMIES_SHIFTS: ShiftTemplate[] = [
  {
    id: 'shift-001',
    base_shift_id: 'shift-001',
    name: 'Ca Sáng',
    code: 'MORNING',
    start_time: '08:30',
    end_time: '12:00',
    color: '#D97706',
    store_scope: 'global',
    is_active: true,
    is_flexible: false,
    allowed_position_ids: ['pos-001', 'pos-002', 'pos-bep'],
    min_headcount: 1,
    max_headcount: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'shift-002',
    base_shift_id: 'shift-002',
    name: 'Ca Trưa',
    code: 'NOON',
    start_time: '12:00',
    end_time: '17:00',
    color: '#059669',
    store_scope: 'global',
    is_active: true,
    is_flexible: false,
    allowed_position_ids: ['pos-001', 'pos-002', 'pos-bep'],
    min_headcount: 1,
    max_headcount: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'shift-003',
    base_shift_id: 'shift-003',
    name: 'Ca Tối',
    code: 'EVENING',
    start_time: '17:00',
    end_time: '22:00',
    color: '#DC2626',
    store_scope: 'global',
    is_active: true,
    is_flexible: false,
    allowed_position_ids: ['pos-001', 'pos-002', 'pos-003', 'pos-bep'],
    min_headcount: 1,
    max_headcount: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'shift-004',
    base_shift_id: 'shift-004',
    name: 'Ca Cao Điểm Trưa (11:30 - 14:30)',
    code: 'PEAK_NOON',
    start_time: '11:30',
    end_time: '14:30',
    color: '#8B5CF6',
    store_scope: 'global',
    is_active: true,
    is_flexible: true,
    allowed_position_ids: ['pos-001', 'pos-002', 'pos-003', 'pos-bep'],
    min_headcount: 1,
    max_headcount: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'shift-005',
    base_shift_id: 'shift-005',
    name: 'Ca Dọn Quầy (22:00 - 01:30)',
    code: 'NIGHT_CLEAN',
    start_time: '22:00',
    end_time: '01:30',
    color: '#4B5563',
    store_scope: 'global',
    is_active: true,
    is_flexible: false,
    allowed_position_ids: ['pos-001', 'pos-002', 'pos-003', 'pos-bep'],
    min_headcount: 1,
    max_headcount: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

const formatTimeForDb = (timeStr?: string): string => {
  if (!timeStr) return '08:00:00'
  const clean = timeStr.trim()
  if (clean.length === 5) return `${clean}:00`
  if (clean.length === 8) return clean
  return `${clean.padStart(5, '0')}:00`
}

const formatTimeFromDb = (timeStr?: string): string => {
  if (!timeStr) return '08:00'
  return String(timeStr).slice(0, 5)
}

const mapRowToShiftTemplate = (row: Record<string, unknown>): ShiftTemplate => {
  const rowId = String(row.id || '')
  const maCa = String(row.ma_ca || '')
  const ten = String(row.ten || '')

  const meta = getShiftExtraMeta(rowId).allowed_position_ids
    ? getShiftExtraMeta(rowId)
    : getShiftExtraMeta(maCa).allowed_position_ids
      ? getShiftExtraMeta(maCa)
      : getShiftExtraMeta(ten)

  const isFlex = meta.is_flexible ?? (maCa === 'FLEX' || ten.toLowerCase().includes('linh hoạt') || ten.toLowerCase().includes('phát sinh'))
  const allowed_position_ids = meta.allowed_position_ids && meta.allowed_position_ids.length > 0
    ? meta.allowed_position_ids
    : ['pos-001', 'pos-002']

  return {
    id: rowId,
    base_shift_id: maCa === 'MORNING' ? 'shift-001' : (maCa === 'AFTERNOON' || maCa === 'NOON') ? 'shift-002' : maCa === 'EVENING' ? 'shift-003' : 'shift-004',
    name: ten,
    code: maCa || 'SHIFT',
    start_time: formatTimeFromDb(String(row.gio_bat_dau || '')),
    end_time: formatTimeFromDb(String(row.gio_ket_thuc || '')),
    color: String(row.mau_hien_thi || '#2F6FA8'),
    store_scope: meta.store_scope || 'global',
    store_id: meta.store_id,
    is_active: row.dang_hoat_dong !== false,
    is_flexible: isFlex,
    allowed_position_ids,
    min_headcount: meta.min_headcount ?? 1,
    max_headcount: meta.max_headcount ?? 2,
    created_at: String(row.ngay_tao || new Date().toISOString()),
    updated_at: new Date().toISOString(),
  }
}

export interface ShiftAdapter {
  getShiftTemplates: () => Promise<ShiftTemplate[]>
  getShiftTemplateById: (id: string) => Promise<ShiftTemplate | null>
  upsertShiftTemplate: (template: Partial<ShiftTemplate> & { name: string }) => Promise<ShiftTemplate>
  deleteShiftTemplate: (id: string) => Promise<boolean>
  seedDefaultShiftsToSupabase: () => Promise<void>
}

export const shiftAdapter: ShiftAdapter = {
  async getShiftTemplates(): Promise<ShiftTemplate[]> {
    // 1. Ưu tiên đọc trực tiếp từ Database máy chủ (/api/shifts)
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/shifts')
        if (res.ok) {
          const json = await res.json()
          if (json?.success && Array.isArray(json.shift_templates) && json.shift_templates.length > 0) {
            const mapped: ShiftTemplate[] = json.shift_templates.map((t: Record<string, unknown>) => ({
              id: String(t.id || ''),
              base_shift_id: String(t.id || ''),
              name: String(t.name || ''),
              code: String(
                t.id === 'shift-001' ? 'MORNING' :
                t.id === 'shift-002' ? 'NOON' :
                t.id === 'shift-003' ? 'EVENING' :
                t.id === 'shift-004' ? 'PEAK_NOON' :
                t.id === 'shift-005' ? 'NIGHT_CLEAN' : 'FLEX'
              ),
              start_time: String(t.start || '08:30'),
              end_time: String(t.end || '12:00'),
              color: t.id === 'shift-001' ? '#D97706' :
                     t.id === 'shift-002' ? '#059669' :
                     t.id === 'shift-003' ? '#DC2626' :
                     t.id === 'shift-004' ? '#8B5CF6' :
                     t.id === 'shift-005' ? '#4B5563' : '#2563EB',
              store_scope: 'global',
              is_active: true,
              is_flexible: t.id === 'shift-004',
              allowed_position_ids: ['pos-001', 'pos-002', 'pos-003', 'pos-bep'],
              min_headcount: 1,
              max_headcount: 3,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }))
            return mapped
          }
        }
      } catch (err) {
        console.warn('[ShiftAdapter] API /api/shifts fetch fallback:', err)
      }
    }

    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        const { data, error } = await supabase
          .from('ca_lam')
          .select('*')
          .order('gio_bat_dau', { ascending: true })

        if (!error && data && data.length > 0) {
          const mapped = data.map(row => mapRowToShiftTemplate(row))
          return mapped
        }
      } catch (err) {
        console.warn('[ShiftAdapter] Supabase query fallback:', err)
      }
    }

    return DEFAULT_HOMIES_SHIFTS
  },

  async getShiftTemplateById(id: string): Promise<ShiftTemplate | null> {
    const list = await this.getShiftTemplates()
    return list.find(s => s.id === id || s.base_shift_id === id || s.code === id) || null
  },

  async upsertShiftTemplate(template: Partial<ShiftTemplate> & { name: string }): Promise<ShiftTemplate> {
    const now = new Date().toISOString()
    const templateId = template.id || `d0000000-0000-0000-0000-${Date.now().toString().slice(-12).padStart(12, '0')}`
    const code = template.code || (template.name.toLowerCase().includes('sáng') ? 'MORNING' : template.name.toLowerCase().includes('chiều') ? 'AFTERNOON' : template.name.toLowerCase().includes('đêm') ? 'EVENING' : 'FLEX')

    const fullTemplate: ShiftTemplate = {
      id: templateId,
      base_shift_id: template.base_shift_id || templateId,
      name: template.name,
      code: code,
      start_time: template.start_time || '08:30',
      end_time: template.end_time || '12:00',
      color: template.color || '#2F6FA8',
      store_scope: template.store_scope || 'global',
      store_id: template.store_id,
      is_active: template.is_active ?? true,
      is_flexible: template.is_flexible ?? (code === 'FLEX'),
      allowed_position_ids: template.allowed_position_ids || ['pos-001', 'pos-002'],
      min_headcount: template.min_headcount ?? 1,
      max_headcount: template.max_headcount ?? 2,
      created_at: template.created_at || now,
      updated_at: now,
    }

    // 1. Save extended metadata
    setShiftExtraMeta([fullTemplate.id, fullTemplate.code, fullTemplate.name], {
      allowed_position_ids: fullTemplate.allowed_position_ids,
      min_headcount: fullTemplate.min_headcount,
      max_headcount: fullTemplate.max_headcount,
      store_scope: fullTemplate.store_scope,
      store_id: fullTemplate.store_id,
      is_flexible: fullTemplate.is_flexible,
    })

    // 2. Update local backup
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_SHIFTS_BACKUP_KEY)
        const list: ShiftTemplate[] = raw ? JSON.parse(raw) : []
        const idx = list.findIndex(s => s.id === fullTemplate.id || s.code === fullTemplate.code)
        if (idx >= 0) {
          list[idx] = fullTemplate
        } else {
          list.push(fullTemplate)
        }
        localStorage.setItem(LOCAL_SHIFTS_BACKUP_KEY, JSON.stringify(list))
      } catch {}
    }

    // 2. Sync to Server DB via /api/shifts
    if (typeof window !== 'undefined') {
      try {
        fetch('/api/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'template',
            shift_template: {
              id: fullTemplate.id,
              name: fullTemplate.name,
              start: fullTemplate.start_time,
              end: fullTemplate.end_time,
              hours: 5.5,
            },
          }),
        }).catch(err => console.warn('[ShiftAdapter] API sync error:', err))
      } catch (err) {
        console.warn('[ShiftAdapter] Server DB API error:', err)
      }
    }

    // 3. Sync to Supabase
    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        const dbPayload = {
          to_chuc_id: ORG_DEFAULT_ID,
          ten: fullTemplate.name,
          ma_ca: fullTemplate.code,
          gio_bat_dau: formatTimeForDb(fullTemplate.start_time),
          gio_ket_thuc: formatTimeForDb(fullTemplate.end_time),
          phut_nghi: 0,
          qua_dem: fullTemplate.end_time < fullTemplate.start_time,
          dang_hoat_dong: fullTemplate.is_active,
          mau_hien_thi: fullTemplate.color,
        }

        // Check if shift already exists by id or ma_ca
        const { data: existing } = await supabase
          .from('ca_lam')
          .select('id')
          .or(`id.eq.${fullTemplate.id},ma_ca.eq.${fullTemplate.code}`)
          .maybeSingle()

        if (existing?.id) {
          await supabase
            .from('ca_lam')
            .update(dbPayload)
            .eq('id', existing.id)
        } else {
          await supabase
            .from('ca_lam')
            .insert([{ ...dbPayload, id: fullTemplate.id }])
        }
      } catch (err) {
        console.warn('[ShiftAdapter] Supabase upsert error:', err)
      }
    }

    return fullTemplate
  },

  async deleteShiftTemplate(id: string): Promise<boolean> {
    // 1. Remove from local cache
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(LOCAL_SHIFTS_BACKUP_KEY)
        if (raw) {
          const list: ShiftTemplate[] = JSON.parse(raw)
          const filtered = list.filter(s => s.id !== id && s.code !== id)
          localStorage.setItem(LOCAL_SHIFTS_BACKUP_KEY, JSON.stringify(filtered))
        }
      } catch {}
    }

    // 2. Remove from Server DB
    if (typeof window !== 'undefined') {
      try {
        fetch('/api/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ delete_template_id: id }),
        }).catch(err => console.warn('[ShiftAdapter] Server delete fallback:', err))
      } catch (err) {
        console.warn('[ShiftAdapter] API delete error:', err)
      }
    }

    // 3. Remove from Supabase
    if (isSupabaseConfigured && isRealDbMode()) {
      try {
        const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        const isUuid = UUID_PATTERN.test(id)
        
        await supabase
          .from('ca_lam')
          .delete()
          .or(isUuid ? `id.eq.${id},ma_ca.eq.${id}` : `ma_ca.eq.${id}`)
      } catch (err) {
        console.warn('[ShiftAdapter] Supabase delete warning:', err)
      }
    }

    return true
  },

  async seedDefaultShiftsToSupabase(): Promise<void> {
    if (!isSupabaseConfigured || !isRealDbMode()) return
    try {
      for (const shift of DEFAULT_HOMIES_SHIFTS) {
        await this.upsertShiftTemplate(shift)
      }
    } catch (err) {
      console.warn('[ShiftAdapter] Seed error:', err)
    }
  }
}
