import { ScheduleService, type ShiftDemand } from '../src/lib/services/schedule-service'
import type { AuthUser } from '../src/store/auth-store'

type StorageMap = Map<string, string>

function createStorage() {
  const data: StorageMap = new Map()
  return {
    getItem(key: string) {
      return data.has(key) ? data.get(key)! : null
    },
    setItem(key: string, value: string) {
      data.set(key, value)
    },
    removeItem(key: string) {
      data.delete(key)
    },
    clear() {
      data.clear()
    },
  }
}

const localStorageMock = createStorage()
const sessionStorageMock = createStorage()

Object.defineProperty(globalThis, 'window', {
  value: { localStorage: localStorageMock, sessionStorage: sessionStorageMock },
  configurable: true,
})
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
})
Object.defineProperty(globalThis, 'sessionStorage', {
  value: sessionStorageMock,
  configurable: true,
})

const user: AuthUser = {
  id: 'emp-002',
  full_name: 'Manager Test',
  email: 'manager@test.local',
  role: 'store_manager',
  store_id: 'store-001',
  position_id: 'pos-005',
  phone: '0900000000',
  employee_code: 'MGR-001',
  status: 'active',
  account_status: 'dang_hoat_dong',
  total_points: 0,
  gamification_level: 'L1',
  hire_date: '2026-01-01',
}

const weekStart = '2026-06-01'
const storeId = 'store-001'
const date = '2026-06-02'
const shiftTemplateId = 'shift-001'

const demands: ShiftDemand[] = [
  {
    id: 'draft-1',
    registration_week_id: '',
    store_id: storeId,
    week_start: weekStart,
    date,
    shift_template_id: shiftTemplateId,
    position_id: 'pos-001',
    required_count: 2,
    min_count: 1,
    notes: 'Thu ngan buoi sang',
  },
  {
    id: 'draft-2',
    registration_week_id: '',
    store_id: storeId,
    week_start: weekStart,
    date,
    shift_template_id: shiftTemplateId,
    position_id: 'pos-002',
    required_count: 4,
    min_count: 2,
    notes: 'Pha che gio cao diem',
  },
]

ScheduleService.saveShiftDemand(user, storeId, weekStart, demands)

const saved = ScheduleService.getShiftDemand(storeId, weekStart).filter(item =>
  item.date === date &&
  item.shift_template_id === shiftTemplateId &&
  (item.position_id === 'pos-001' || item.position_id === 'pos-002')
)

const byPosition = new Map(saved.map(item => [item.position_id, item]))
const cashier = byPosition.get('pos-001')
const barista = byPosition.get('pos-002')

if (!cashier || !barista) {
  throw new Error(`Missing saved demand by position: ${JSON.stringify(saved, null, 2)}`)
}

if (cashier.required_count !== 2 || cashier.min_count !== 1) {
  throw new Error(`Cashier demand mismatch: ${JSON.stringify(cashier, null, 2)}`)
}

if (barista.required_count !== 4 || barista.min_count !== 2) {
  throw new Error(`Barista demand mismatch: ${JSON.stringify(barista, null, 2)}`)
}

if (cashier.notes !== 'Thu ngan buoi sang' || barista.notes !== 'Pha che gio cao diem') {
  throw new Error(`Demand notes mismatch: ${JSON.stringify(saved, null, 2)}`)
}

console.log('verify-schedule-demand-position: ok')
