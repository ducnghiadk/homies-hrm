import type { KpiDatabase, KpiRepository } from './repository.ts'
import { createEmptyKpiDatabase, KPI_REPOSITORY_STORAGE_KEY } from './repository.ts'

interface StorageLike {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

interface LocalKpiRepositoryOptions {
  storage?: StorageLike
  onWarn?: (message: string, error?: unknown) => void
}

const memoryStore = new Map<string, string>()

function createMemoryStorage(): StorageLike {
  return {
    getItem(key) {
      return memoryStore.has(key) ? memoryStore.get(key)! : null
    },
    setItem(key, value) {
      memoryStore.set(key, value)
    },
    removeItem(key) {
      memoryStore.delete(key)
    },
  }
}

export function createLocalKpiRepository(options: LocalKpiRepositoryOptions = {}): KpiRepository {
  const storage = options.storage ?? resolveDefaultStorage()
  const onWarn = options.onWarn ?? ((message: string, error?: unknown) => console.warn(message, error))

  return {
    async load() {
      const raw = storage.getItem(KPI_REPOSITORY_STORAGE_KEY)

      if (!raw) {
        return createEmptyKpiDatabase()
      }

      try {
        return normalizeDatabase(JSON.parse(raw) as Partial<KpiDatabase>)
      } catch (error) {
        onWarn('Failed to parse KPI repository. Falling back to an empty seed.', error)
        const clean = createEmptyKpiDatabase()
        storage.setItem(KPI_REPOSITORY_STORAGE_KEY, JSON.stringify(clean))
        return clean
      }
    },

    async save(next, expectedRevision) {
      const current = await this.load()

      if (current.revision !== expectedRevision) {
        throw new Error('Du lieu da duoc nguoi khac cap nhat. Vui long tai lai va thu lai.')
      }

      const normalized = normalizeDatabase(next)
      storage.setItem(KPI_REPOSITORY_STORAGE_KEY, JSON.stringify(normalized))
      return normalized
    },

    async reset(seed) {
      const normalized = normalizeDatabase(seed)
      storage.setItem(KPI_REPOSITORY_STORAGE_KEY, JSON.stringify(normalized))
    },
  }
}

function resolveDefaultStorage(): StorageLike {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage
  }

  return createMemoryStorage()
}

function normalizeDatabase(input: Partial<KpiDatabase>): KpiDatabase {
  const seed = createEmptyKpiDatabase()

  return {
    schema_version: 1,
    revision: typeof input.revision === 'number' ? input.revision : seed.revision,
    store_groups: Array.isArray(input.store_groups) ? input.store_groups : seed.store_groups,
    sets: Array.isArray(input.sets) ? input.sets : seed.sets,
    periods: Array.isArray(input.periods) ? input.periods : seed.periods,
    evaluations: Array.isArray(input.evaluations) ? input.evaluations : seed.evaluations,
    incidents: Array.isArray(input.incidents) ? input.incidents : seed.incidents,
    appeals: Array.isArray(input.appeals) ? input.appeals : seed.appeals,
    development_cases: Array.isArray(input.development_cases) ? input.development_cases : seed.development_cases,
    audit_logs: Array.isArray(input.audit_logs) ? input.audit_logs : seed.audit_logs,
    career_maps: Array.isArray(input.career_maps) ? input.career_maps : seed.career_maps,
    position_criteria_profiles: Array.isArray(input.position_criteria_profiles)
      ? input.position_criteria_profiles
      : seed.position_criteria_profiles,
    career_employee_placements: Array.isArray(input.career_employee_placements)
      ? input.career_employee_placements
      : seed.career_employee_placements,
    career_map_approval_logs: Array.isArray(input.career_map_approval_logs)
      ? input.career_map_approval_logs
      : seed.career_map_approval_logs,
    career_grades: Array.isArray(input.career_grades)
      ? input.career_grades
      : seed.career_grades,
    operational_skills: Array.isArray(input.operational_skills)
      ? input.operational_skills
      : seed.operational_skills,
    employee_skill_certifications: Array.isArray(input.employee_skill_certifications)
      ? input.employee_skill_certifications
      : seed.employee_skill_certifications,
    employee_career_placements: Array.isArray(input.employee_career_placements)
      ? input.employee_career_placements
      : seed.employee_career_placements,
  }
}

