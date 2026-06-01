// =============================================
// HRM Trà Sữa 🧋 — KPI Settings Service
// Phase 3F: CRUD operations for KPI admin
// =============================================

import type {
  KPICategory, KPICriteria, ViolationType, KPIGrade,
  LevelConfig, KPISettings, KPIOptionType,
} from './kpi-types'
import {
  mockKPICategories, mockKPICriteria, mockViolationTypes,
  mockKPIGrades, mockLevelConfigs, mockKPISettings,
} from './mock-data-kpi'

// ══════════════════════════════════════
// CATEGORIES
// ══════════════════════════════════════

export function updateCategory(id: string, data: Partial<KPICategory>): KPICategory | null {
  const idx = mockKPICategories.findIndex(c => c.id === id)
  if (idx === -1) return null
  mockKPICategories[idx] = { ...mockKPICategories[idx], ...data }
  return mockKPICategories[idx]
}

export function createCategory(data: Omit<KPICategory, 'id'>): KPICategory {
  const newCat: KPICategory = {
    ...data,
    id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  }
  mockKPICategories.push(newCat)
  return newCat
}

export function deleteCategory(id: string): boolean {
  const idx = mockKPICategories.findIndex(c => c.id === id)
  if (idx === -1) return false
  mockKPICategories.splice(idx, 1)
  // Also remove associated criteria
  const toRemove = mockKPICriteria
    .map((c, i) => c.category_id === id ? i : -1)
    .filter(i => i !== -1)
    .reverse()
  toRemove.forEach(i => mockKPICriteria.splice(i, 1))
  return true
}

// ══════════════════════════════════════
// CRITERIA
// ══════════════════════════════════════

export function updateCriteria(id: string, data: Partial<KPICriteria>): KPICriteria | null {
  const idx = mockKPICriteria.findIndex(c => c.id === id)
  if (idx === -1) return null
  mockKPICriteria[idx] = { ...mockKPICriteria[idx], ...data }
  return mockKPICriteria[idx]
}

export function createCriteria(data: Omit<KPICriteria, 'id'>): KPICriteria {
  const newCri: KPICriteria = {
    ...data,
    id: `cri-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  }
  mockKPICriteria.push(newCri)
  return newCri
}

export function deleteCriteria(id: string): boolean {
  const idx = mockKPICriteria.findIndex(c => c.id === id)
  if (idx === -1) return false
  mockKPICriteria.splice(idx, 1)
  return true
}

// ══════════════════════════════════════
// VIOLATION TYPES
// ══════════════════════════════════════

export function updateViolationType(id: string, data: Partial<ViolationType>): ViolationType | null {
  const idx = mockViolationTypes.findIndex(v => v.id === id)
  if (idx === -1) return null
  mockViolationTypes[idx] = { ...mockViolationTypes[idx], ...data }
  return mockViolationTypes[idx]
}

export function createViolationType(data: Omit<ViolationType, 'id'>): ViolationType {
  const newVio: ViolationType = {
    ...data,
    id: `vio-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  }
  mockViolationTypes.push(newVio)
  return newVio
}

export function deleteViolationType(id: string): boolean {
  const idx = mockViolationTypes.findIndex(v => v.id === id)
  if (idx === -1) return false
  mockViolationTypes.splice(idx, 1)
  return true
}

// ══════════════════════════════════════
// GRADES (update only — no create/delete)
// ══════════════════════════════════════

export function updateGrade(id: string, data: Partial<KPIGrade>): KPIGrade | null {
  const idx = mockKPIGrades.findIndex(g => g.id === id)
  if (idx === -1) return null
  mockKPIGrades[idx] = { ...mockKPIGrades[idx], ...data }
  return mockKPIGrades[idx]
}

// ══════════════════════════════════════
// LEVEL CONFIGS (update only)
// ══════════════════════════════════════

export function updateLevelConfig(id: string, data: Partial<LevelConfig>): LevelConfig | null {
  const idx = mockLevelConfigs.findIndex(l => l.id === id)
  if (idx === -1) return null
  mockLevelConfigs[idx] = { ...mockLevelConfigs[idx], ...data }
  return mockLevelConfigs[idx]
}

// ══════════════════════════════════════
// KPI SETTINGS (update only)
// ══════════════════════════════════════

export function updateKPISettings(data: Partial<KPISettings>): KPISettings {
  Object.assign(mockKPISettings, data, { updated_at: new Date().toISOString() })
  return { ...mockKPISettings }
}

// ══════════════════════════════════════
// VALIDATION
// ══════════════════════════════════════

export function validateCategoryWeights(option: KPIOptionType): {
  valid: boolean
  total: number
  categories: { id: string; name: string; weight: number }[]
} {
  const cats = mockKPICategories.filter(
    c => c.option_type === option && c.is_active,
  )
  const total = cats.reduce((sum, c) => sum + c.weight, 0)
  return {
    valid: total === 100,
    total,
    categories: cats.map(c => ({ id: c.id, name: c.name, weight: c.weight })),
  }
}
