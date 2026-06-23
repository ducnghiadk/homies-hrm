import {
  getAllStores,
  getStoreById,
  saveStoresToStorage,
  type Store,
} from '@/lib/mock-data'
import {
  masterApprovalWorkflows,
  masterDepartments,
  masterEmployeeLevels,
  masterLeaveTypes,
  masterPositions,
  masterShifts,
} from '@/lib/mock-data-settings'
import type { AuthUser } from '@/store/auth-store'

export type MasterDataEntityKey =
  | 'stores'
  | 'departments'
  | 'positions'
  | 'shifts'
  | 'leaveTypes'
  | 'levels'
  | 'workflows'

export type DepartmentRecord = {
  id: string
  store_id: string
  name: string
  head_count: number
}

export type PositionRecord = {
  id: string
  name: string
  level: number
  base_salary: number
}

export type ShiftRecord = {
  id: string
  name: string
  start_time: string
  end_time: string
  break_minutes: number
  color: string
  is_active: boolean
}

export type LeaveTypeRecord = {
  id: string
  name: string
  code: string
  default_days: number
  is_paid: boolean
  require_doc: boolean
}

export type EmployeeLevelRecord = {
  id: string
  level: number
  name: string
  min_months: number
  salary_range: string
}

export type ApprovalWorkflowRecord = {
  id: string
  name: string
  steps: string[]
  auto_approve_days: number
  max_days_auto: number
}

export type MasterDataState = {
  stores: Store[]
  departments: DepartmentRecord[]
  positions: PositionRecord[]
  shifts: ShiftRecord[]
  leaveTypes: LeaveTypeRecord[]
  levels: EmployeeLevelRecord[]
  workflows: ApprovalWorkflowRecord[]
}

type MasterDataCreateMap = {
  stores: Omit<Store, 'id' | 'org_id'> & Partial<Pick<Store, 'org_id'>>
  departments: Omit<DepartmentRecord, 'id'>
  positions: Omit<PositionRecord, 'id'>
  shifts: Omit<ShiftRecord, 'id'>
  leaveTypes: Omit<LeaveTypeRecord, 'id'>
  levels: Omit<EmployeeLevelRecord, 'id'>
  workflows: Omit<ApprovalWorkflowRecord, 'id'>
}

type MasterDataUpdateMap = {
  [K in keyof MasterDataCreateMap]: Partial<MasterDataCreateMap[K]>
}

type PersistedMasterData = Record<string, Omit<MasterDataState, 'stores'>>

const STORAGE_KEY = 'hrm-settings-master-data-v1'
const DEFAULT_ORG_ID = 'org-001'

function readStorage(): PersistedMasterData {
  if (typeof window === 'undefined') return {}

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) return {}

  try {
    const parsed = JSON.parse(raw) as PersistedMasterData
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function writeStorage(data: PersistedMasterData) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function createId(prefix: string) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function seedState(orgId: string): MasterDataState {
  const seededStores = getAllStores().filter((store) => store.org_id === orgId)

  return {
    stores: seededStores.length > 0 ? seededStores : getAllStores(),
    departments: masterDepartments.map((item) => ({ ...item })),
    positions: masterPositions.map((item) => ({ ...item })),
    shifts: masterShifts.map((item) => ({ ...item })),
    leaveTypes: masterLeaveTypes.map((item) => ({ ...item })),
    levels: masterEmployeeLevels.map((item) => ({ id: `level-${item.level}`, ...item })),
    workflows: masterApprovalWorkflows.map((item) => ({ ...item })),
  }
}

export function resolveMasterDataOrgId(user?: Partial<AuthUser> | null) {
  const userWithOrg = user as Partial<AuthUser> & { org_id?: string }
  if (userWithOrg?.org_id) return userWithOrg.org_id

  if (user?.store_id) {
    const store = getStoreById(user.store_id)
    if (store?.org_id) return store.org_id
  }

  return DEFAULT_ORG_ID
}

export class MasterDataRepository {
  static getState(orgId: string): MasterDataState {
    const fallback = seedState(orgId)
    const persisted = readStorage()[orgId]

    return {
      stores: getAllStores().filter((store) => store.org_id === orgId).length > 0
        ? getAllStores().filter((store) => store.org_id === orgId)
        : fallback.stores,
      departments: persisted?.departments ?? fallback.departments,
      positions: persisted?.positions ?? fallback.positions,
      shifts: persisted?.shifts ?? fallback.shifts,
      leaveTypes: persisted?.leaveTypes ?? fallback.leaveTypes,
      levels: persisted?.levels ?? fallback.levels,
      workflows: persisted?.workflows ?? fallback.workflows,
    }
  }

  static saveState(orgId: string, state: MasterDataState) {
    const all = readStorage()
    all[orgId] = {
      departments: state.departments,
      positions: state.positions,
      shifts: state.shifts,
      leaveTypes: state.leaveTypes,
      levels: state.levels,
      workflows: state.workflows,
    }
    writeStorage(all)
    saveStoresToStorage(state.stores)
  }

  static createItem<K extends MasterDataEntityKey>(orgId: string, key: K, payload: MasterDataCreateMap[K]) {
    const state = this.getState(orgId)

    const created = (() => {
      switch (key) {
        case 'stores':
          return { id: createId('store'), org_id: orgId, ...payload } as MasterDataState[K][number]
        case 'departments':
          return { id: createId('dept'), ...payload } as MasterDataState[K][number]
        case 'positions':
          return { id: createId('pos'), ...payload } as MasterDataState[K][number]
        case 'shifts':
          return { id: createId('shift'), ...payload } as MasterDataState[K][number]
        case 'leaveTypes':
          return { id: createId('leave'), ...payload } as MasterDataState[K][number]
        case 'levels':
          return { id: createId('level'), ...payload } as MasterDataState[K][number]
        case 'workflows':
          return { id: createId('workflow'), ...payload } as MasterDataState[K][number]
      }
    })()

    state[key] = [...state[key], created] as MasterDataState[K]
    this.saveState(orgId, state)
    return created
  }

  static updateItem<K extends MasterDataEntityKey>(orgId: string, key: K, id: string, payload: MasterDataUpdateMap[K]) {
    const state = this.getState(orgId)
    let updatedItem: MasterDataState[K][number] | null = null

    state[key] = state[key].map((item) => {
      if (item.id !== id) return item
      updatedItem = { ...item, ...payload } as MasterDataState[K][number]
      return updatedItem
    }) as MasterDataState[K]

    this.saveState(orgId, state)
    return updatedItem
  }

  static deleteItem<K extends MasterDataEntityKey>(orgId: string, key: K, id: string) {
    const state = this.getState(orgId)
    const before = state[key].length
    state[key] = state[key].filter((item) => item.id !== id) as MasterDataState[K]
    this.saveState(orgId, state)
    return state[key].length < before
  }
}
