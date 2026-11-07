import { getPositionById, mockShifts, type Shift } from '@/lib/mock-data'

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

const STORAGE_KEY = 'homies_shift_templates'

function inferDefaultAllowedPositions(shift: Shift): string[] {
  if (shift.id === 'shift-004') return ['pos-001', 'pos-002', 'pos-004', 'pos-bep']
  return ['pos-001', 'pos-002', 'pos-bep']
}

function inferDefaultCode(shift: Shift): string {
  if (shift.id === 'shift-005') return 'NIGHT_CLEAN'
  if (shift.id === 'shift-004') return 'PEAK_NOON'
  if (shift.id === 'shift-001') return 'MORNING'
  if (shift.id === 'shift-002') return 'NOON'
  return 'EVENING'
}

function seedTemplates(): ShiftTemplate[] {
  const now = new Date().toISOString()
  return mockShifts.map(shift => ({
    id: shift.id,
    base_shift_id: shift.id,
    name: shift.name,
    code: inferDefaultCode(shift),
    start_time: shift.start_time,
    end_time: shift.end_time,
    color: shift.color,
    store_scope: 'global',
    is_active: true,
    is_flexible: shift.id === 'shift-004' || shift.name.toLowerCase().includes('linh hoạt') || shift.name.toLowerCase().includes('phát sinh'),
    allowed_position_ids: inferDefaultAllowedPositions(shift),
    min_headcount: shift.id === 'shift-004' ? 0 : 1,
    max_headcount: shift.id === 'shift-004' ? 5 : 4,
    created_at: now,
    updated_at: now,
  }))
}

export class ShiftTemplateService {
  private static read(): ShiftTemplate[] {
    if (typeof window === 'undefined') return seedTemplates()
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        const seeded = seedTemplates()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
        return seeded
      }
      let parsed = JSON.parse(raw) as ShiftTemplate[]
      if (!Array.isArray(parsed) || parsed.length === 0) {
        const seeded = seedTemplates()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
        return seeded
      }

      // Tự động chuẩn hóa 3 ca chuẩn Homies nếu cache cũ còn lưu giờ cũ hoặc ID từ Supabase cũ
      const seeded = seedTemplates()
      parsed = parsed.map(item => {
        const cleanName = (item.name || '').toLowerCase()
        const isOldMorning = cleanName.includes('mở quầy') || cleanName.includes('06:30') || item.id === 'd0000000-0000-0000-0000-000000000001'
        const isOldEvening = cleanName.includes('đóng quầy') || cleanName.includes('22:30') || item.id === 'd0000000-0000-0000-0000-000000000002' || item.id === 'd0000000-0000-0000-0000-000000000004'
        const isOldNoon = cleanName.includes('parttime cao điểm') || cleanName.includes('ca gãy') || item.id === 'd0000000-0000-0000-0000-000000000003'

        const standard = seeded.find(s => s.id === item.id)
        const baseAllowed = standard ? standard.allowed_position_ids : item.allowed_position_ids
        const cleanAllowed = (baseAllowed || []).filter(id => id !== 'pos-003')

        if (isOldMorning) {
          const std = seeded.find(s => s.id === 'shift-001')!
          return { ...item, id: 'shift-001', base_shift_id: 'shift-001', name: std.name, code: std.code, start_time: std.start_time, end_time: std.end_time, color: std.color, allowed_position_ids: cleanAllowed }
        }
        if (isOldEvening) {
          const std = seeded.find(s => s.id === 'shift-003')!
          return { ...item, id: 'shift-003', base_shift_id: 'shift-003', name: std.name, code: std.code, start_time: std.start_time, end_time: std.end_time, color: std.color, allowed_position_ids: cleanAllowed }
        }
        if (isOldNoon) {
          const std = seeded.find(s => s.id === 'shift-002')!
          return { ...item, id: 'shift-002', base_shift_id: 'shift-002', name: std.name, code: std.code, start_time: std.start_time, end_time: std.end_time, color: std.color, allowed_position_ids: cleanAllowed }
        }

        if (standard && (standard.id === 'shift-001' || standard.id === 'shift-002' || standard.id === 'shift-003')) {
          return {
            ...item,
            name: standard.name,
            code: standard.code,
            start_time: standard.start_time,
            end_time: standard.end_time,
            color: standard.color,
            allowed_position_ids: cleanAllowed,
          }
        }
        return {
          ...item,
          allowed_position_ids: cleanAllowed,
        }
      })

      // Bổ sung ca mặc định nếu chưa có
      seeded.forEach(st => {
        if (!parsed.some(p => p.id === st.id || p.code === st.code)) {
          parsed.push(st)
        }
      })

      // Lọc bỏ các bản ghi bị lặp (Duplicate) theo code hoặc tên + khung giờ
      const uniqueTemplates: ShiftTemplate[] = []
      const seenKeys = new Set<string>()

      parsed.forEach(item => {
        const cleanName = item.name.toLowerCase().trim()
        const keyByCode = item.code && item.code !== 'SHIFT' ? `code_${item.code}` : ''
        const keyByNameTime = `nt_${cleanName}_${item.start_time}_${item.end_time}`
        const keyById = `id_${item.id}`

        if (seenKeys.has(keyById) || (keyByCode && seenKeys.has(keyByCode)) || seenKeys.has(keyByNameTime)) {
          return
        }

        seenKeys.add(keyById)
        if (keyByCode) seenKeys.add(keyByCode)
        seenKeys.add(keyByNameTime)
        uniqueTemplates.push(item)
      })

      if (uniqueTemplates.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueTemplates))
      }

      return uniqueTemplates
    } catch {
      return seedTemplates()
    }
  }

  private static write(data: ShiftTemplate[]) {
    if (typeof window === 'undefined') return
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  static getAll(): ShiftTemplate[] {
    return this.read().sort((left, right) => left.start_time.localeCompare(right.start_time))
  }

  static getById(id: string): ShiftTemplate | null {
    return this.read().find(template => template.id === id) || null
  }

  static getActiveForStore(storeId: string): ShiftTemplate[] {
    return this.read().filter(template =>
      template.is_active &&
      (template.store_scope === 'global' || template.store_id === storeId)
    )
  }

  static getAllForStore(storeId: string): ShiftTemplate[] {
    return this.read().filter(template =>
      template.store_scope === 'global' || template.store_id === storeId
    )
  }

  static async syncFromServer(): Promise<ShiftTemplate[]> {
    if (typeof window === 'undefined') return this.getAll()
    try {
      const res = await fetch('/api/shifts')
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.shift_templates) && json.shift_templates.length > 0) {
          const mapped: ShiftTemplate[] = json.shift_templates.map((t: Record<string, unknown>) => ({
            id: String(t.id || ''),
            base_shift_id: String(t.id || ''),
            name: String(t.name || ''),
            code: String(t.code || (t.id === 'shift-001' ? 'MORNING' : t.id === 'shift-002' ? 'NOON' : t.id === 'shift-003' ? 'EVENING' : t.id === 'shift-004' ? 'PEAK_NOON' : t.id === 'shift-005' ? 'NIGHT_CLEAN' : 'FLEX')),
            start_time: String(t.start || t.start_time || '08:30'),
            end_time: String(t.end || t.end_time || '12:00'),
            color: String(t.color || (t.id === 'shift-001' ? '#D97706' : t.id === 'shift-002' ? '#059669' : t.id === 'shift-003' ? '#DC2626' : t.id === 'shift-004' ? '#8B5CF6' : '#4B5563')),
            store_scope: (t.store_scope as ShiftTemplateScope) || 'global',
            store_id: typeof t.store_id === 'string' ? t.store_id : undefined,
            is_active: t.is_active !== false,
            is_flexible: Boolean(t.is_flexible || t.id === 'shift-004'),
            allowed_position_ids: Array.isArray(t.allowed_position_ids) ? t.allowed_position_ids : ['pos-001', 'pos-002', 'pos-003', 'pos-bep'],
            min_headcount: Number(t.min_headcount ?? 1),
            max_headcount: Number(t.max_headcount ?? 3),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }))
          this.write(mapped)
          return mapped
        }
      }
    } catch (err) {
      console.warn('[ShiftTemplateService] syncFromServer fallback:', err)
    }
    return this.getAll()
  }

  static upsert(input: Omit<ShiftTemplate, 'created_at' | 'updated_at'> & Partial<Pick<ShiftTemplate, 'created_at' | 'updated_at'>>) {
    const db = this.read()
    const now = new Date().toISOString()
    const index = db.findIndex(template => template.id === input.id)
    const normalized: ShiftTemplate = {
      ...input,
      allowed_position_ids: input.allowed_position_ids?.filter(Boolean) || [],
      created_at: input.created_at || now,
      updated_at: now,
    }

    if (index === -1) {
      db.push(normalized)
    } else {
      db[index] = {
        ...db[index],
        ...normalized,
        created_at: db[index].created_at,
        updated_at: now,
      }
    }

    this.write(db)

    // Sync to Server DB via /api/shifts
    if (typeof window !== 'undefined') {
      try {
        fetch('/api/shifts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'template',
            shift_template: {
              id: normalized.id,
              name: normalized.name,
              code: normalized.code,
              start: normalized.start_time,
              end: normalized.end_time,
              color: normalized.color,
              store_scope: normalized.store_scope,
              store_id: normalized.store_id,
              is_active: normalized.is_active,
              is_flexible: normalized.is_flexible,
              allowed_position_ids: normalized.allowed_position_ids,
              min_headcount: normalized.min_headcount,
              max_headcount: normalized.max_headcount,
            },
          }),
        }).catch(err => console.warn('[ShiftTemplateService] Server DB sync error:', err))
      } catch (err) {
        console.warn('[ShiftTemplateService] API sync error:', err)
      }
    }

    return normalized
  }

  static createForStore(storeId: string, data: {
    name: string
    code: string
    start_time: string
    end_time: string
    color: string
    store_scope: ShiftTemplateScope
    allowed_position_ids?: string[]
    min_headcount?: number
    max_headcount?: number
  }) {
    const id = `shift-template-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    return this.upsert({
      id,
      base_shift_id: id,
      name: data.name,
      code: data.code,
      start_time: data.start_time,
      end_time: data.end_time,
      color: data.color,
      store_scope: data.store_scope,
      store_id: data.store_scope === 'store_specific' ? storeId : undefined,
      is_active: true,
      allowed_position_ids: data.allowed_position_ids || [],
      min_headcount: data.min_headcount,
      max_headcount: data.max_headcount,
    })
  }

  static toggleActive(id: string): ShiftTemplate | null {
    const existing = this.getById(id)
    if (!existing) return null
    return this.upsert({
      ...existing,
      is_active: !existing.is_active,
    })
  }

  static getPositionLabels(template: ShiftTemplate): string[] {
    return (template.allowed_position_ids || [])
      .map(positionId => getPositionById(positionId)?.name || positionId)
  }
}
