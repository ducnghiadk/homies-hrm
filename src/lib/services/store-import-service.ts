import type { Store } from '@/lib/mock-data'
import type { EmployeeExcelRow } from '@/lib/services/employee-excel-service'
import { MasterDataClientService } from '@/lib/services/master-data-client-service'
import type { MasterDataState } from '@/lib/services/master-data-repository'

const BRANCH_HEADER = 'Chi nhánh'
const CODE_STOP_WORDS = new Set(['CHI', 'NHANH', 'CUA', 'HANG', 'TRA', 'SUA', 'PHO', 'MAI', 'TUOI', 'FRESH', 'MILK', 'TEA'])

type StoreCreatePayload = Omit<Store, 'id' | 'org_id'> & Partial<Pick<Store, 'org_id'>>
type StoreUpdatePayload = Partial<StoreCreatePayload>

export type StoreImportCreate = {
  payload: StoreCreatePayload
}

export type StoreImportUpdate = {
  id: string
  payload: StoreUpdatePayload
  previousName: string
}

export type StoreImportPlan = {
  sourceNames: string[]
  toCreate: StoreImportCreate[]
  toUpdate: StoreImportUpdate[]
  toDeactivate: StoreImportUpdate[]
}

type StoreWriter = {
  createItem: typeof MasterDataClientService.createItem
  updateItem: typeof MasterDataClientService.updateItem
}

function trimValue(value: unknown) {
  return String(value ?? '').trim()
}

export function normalizeStoreImportName(value: unknown) {
  return trimValue(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

function dedupeBranchNames(rows: Partial<EmployeeExcelRow>[]) {
  const seen = new Set<string>()
  const names: string[] = []

  for (const row of rows) {
    const branchName = trimValue(row[BRANCH_HEADER as keyof EmployeeExcelRow])
    const normalized = normalizeStoreImportName(branchName)
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    names.push(branchName)
  }

  return names
}

function extractLeadingCodeCandidate(branchName: string) {
  const raw = trimValue(branchName)
  const prefix = raw.split('-')[0]?.trim() || ''
  const normalized = prefix
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()

  if (/^[A-Z0-9]{2,10}$/.test(normalized)) return normalized
  return ''
}

function buildAcronymCandidate(branchName: string) {
  const normalized = trimValue(branchName)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toUpperCase()

  const words = normalized
    .split(/[^A-Z0-9]+/)
    .map((word) => word.trim())
    .filter(Boolean)
    .filter((word) => !CODE_STOP_WORDS.has(word))

  const letters = words.map((word) => word[0]).filter(Boolean).join('').slice(0, 6)
  if (letters.length >= 2) return letters

  const fallback = normalized.replace(/[^A-Z0-9]/g, '').slice(0, 6)
  return fallback || 'CN'
}

function nextAvailableCode(candidate: string, usedCodes: Set<string>) {
  const base = candidate || 'CN'
  if (!usedCodes.has(base)) {
    usedCodes.add(base)
    return base
  }

  let index = 2
  while (true) {
    const next = `${base}-${String(index).padStart(2, '0')}`
    if (!usedCodes.has(next)) {
      usedCodes.add(next)
      return next
    }
    index += 1
  }
}

function generateBranchCode(branchName: string, usedCodes: Set<string>) {
  const candidate = extractLeadingCodeCandidate(branchName) || buildAcronymCandidate(branchName)
  return nextAvailableCode(candidate, usedCodes)
}

export function ensureStoreCode({
  requestedCode,
  storeName,
  existingStores,
  currentStoreId,
}: {
  requestedCode?: string
  storeName: string
  existingStores: Store[]
  currentStoreId?: string
}) {
  const manualCode = trimValue(requestedCode).toUpperCase()
  if (manualCode) return manualCode

  const usedCodes = new Set(
    existingStores
      .filter((store) => store.id !== currentStoreId)
      .map((store) => trimValue(store.code))
      .filter(Boolean)
      .map((code) => code.toUpperCase()),
  )

  return generateBranchCode(storeName, usedCodes)
}

function buildStoreCreatePayload(branchName: string, code: string): StoreCreatePayload {
  return {
    name: trimValue(branchName),
    code,
    address: '',
    phone: '',
    latitude: 0,
    longitude: 0,
    checkin_radius_meters: 100,
    is_active: true,
  }
}

export function buildStoreImportPlan(rows: Partial<EmployeeExcelRow>[], existingStores: Store[]): StoreImportPlan {
  const sourceNames = dedupeBranchNames(rows)
  const existingByNormalizedName = new Map(existingStores.map((store) => [normalizeStoreImportName(store.name), store]))
  const matchedStoreIds = new Set<string>()
  const usedCodes = new Set(existingStores.map((store) => trimValue(store.code)).filter(Boolean).map((code) => code.toUpperCase()))
  const toCreate: StoreImportCreate[] = []
  const toUpdate: StoreImportUpdate[] = []

  for (const sourceName of sourceNames) {
    const normalized = normalizeStoreImportName(sourceName)
    const matched = existingByNormalizedName.get(normalized)

    if (matched) {
      matchedStoreIds.add(matched.id)
      const code = trimValue(matched.code) || generateBranchCode(sourceName, usedCodes)
      if (code) usedCodes.add(code.toUpperCase())
      toUpdate.push({
        id: matched.id,
        previousName: matched.name,
        payload: {
          name: trimValue(sourceName),
          code,
          is_active: true,
        },
      })
      continue
    }

    const code = generateBranchCode(sourceName, usedCodes)
    toCreate.push({ payload: buildStoreCreatePayload(sourceName, code) })
  }

  const toDeactivate = sourceNames.length === 0
    ? []
    : existingStores
        .filter((store) => !matchedStoreIds.has(store.id) && store.is_active)
        .map((store) => ({
          id: store.id,
          previousName: store.name,
          payload: { is_active: false },
        }))

  return {
    sourceNames,
    toCreate,
    toUpdate,
    toDeactivate,
  }
}

export async function applyStoreImportPlan(
  orgId: string,
  plan: StoreImportPlan,
  writer: StoreWriter = MasterDataClientService,
): Promise<MasterDataState> {
  let state = await MasterDataClientService.getState(orgId)

  for (const item of plan.toUpdate) {
    state = await writer.updateItem(orgId, 'stores', item.id, item.payload)
  }

  for (const item of plan.toCreate) {
    state = await writer.createItem(orgId, 'stores', item.payload)
  }

  for (const item of plan.toDeactivate) {
    state = await writer.updateItem(orgId, 'stores', item.id, item.payload)
  }

  return state
}
