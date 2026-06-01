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
  allowed_position_ids?: string[]
  min_headcount?: number
  max_headcount?: number
  created_at: string
  updated_at: string
}

const STORAGE_KEY = 'homies_shift_templates'

function inferDefaultAllowedPositions(shift: Shift): string[] {
  if (shift.id === 'shift-001') return ['pos-001', 'pos-002', 'pos-003']
  if (shift.id === 'shift-002') return ['pos-001', 'pos-002', 'pos-003']
  return ['pos-001', 'pos-003']
}

function inferDefaultCode(shift: Shift): string {
  if (shift.id === 'shift-001') return 'MORNING'
  if (shift.id === 'shift-002') return 'AFTERNOON'
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
    allowed_position_ids: inferDefaultAllowedPositions(shift),
    min_headcount: 1,
    max_headcount: shift.id === 'shift-003' ? 2 : 4,
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
      const parsed = JSON.parse(raw) as ShiftTemplate[]
      if (!Array.isArray(parsed) || parsed.length === 0) {
        const seeded = seedTemplates()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded))
        return seeded
      }
      return parsed
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
