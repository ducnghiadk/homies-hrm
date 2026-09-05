import { masterPositions, settingsPayroll } from '@/lib/mock-data-settings'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { isRealDbMode } from '@/lib/adapters/repository-config'
import {
  type PayrollPolicyMeta,
  type PolicyFieldDef,
  POLICY_REGISTRY,
  validatePolicy,
  migratePolicy,
  getPolicyValueByPath,
  setPolicyValueByPath,
} from '@/lib/payroll/policy-registry'

export type { PayrollPolicyMeta, PolicyFieldDef }
export { POLICY_REGISTRY, validatePolicy, migratePolicy, getPolicyValueByPath, setPolicyValueByPath }

export type PayrollPolicyStatus = 'draft' | 'pending_ceo' | 'active'

export type PayrollSalaryGrade = {
  id: string
  name: string
  level: number
  band: string
  base_salary: number
  minSalary: number
  maxSalary: number
  probation: number
  kpiPool: number
  status: string
}

export type PayrollAllowanceRule = {
  name: string
  type: string
  amount: number
  taxable: string
  appliesTo: string
}

export type PayrollFnbPolicy = {
  mealAllowancePerShift: number
  openingShiftAllowance: number
  closingShiftAllowance: number
  splitShiftAllowance: number
  peakHourBonus: number
  nightShiftAllowance: number
  trainingShiftAllowance: number
  serviceChargePoolRate: number
  tipPoolRate: number
  holidayPeakBonusRate: number
  tetPeakBonusRate: number
  cashShortageAutoDeductionLimit: number
  requireCashShortageApproval: boolean
  requireInventoryBreakageApproval: boolean
}

export type PayrollPolicy = {
  meta: PayrollPolicyMeta
  version: string
  status: PayrollPolicyStatus
  updatedBy: string
  updatedAt: string
  standardDaysPerMonth?: number
  standardHoursPerDay?: number
  work?: {
    standardDaysPerMonth?: number
    standardHoursPerDay?: number
  }
  partTimeOvertimeEnabled?: boolean
  partTimeOvertimeThresholdHours?: number
  partTimeOvertimeMultiplier?: number
  grades: PayrollSalaryGrade[]
  allowances: PayrollAllowanceRule[]
  fnb: PayrollFnbPolicy
  rates: {
    probation: number
    bhxhEmployee: number
    bhytEmployee: number
    bhtnEmployee: number
    taxBracket1: number
    otWeekday: number
    otNight: number
    otHoliday: number
  }
  legal: {
    personalDeduction: number
    dependentDeduction: number
    minRegionSalary: number
    maxInsuranceSalary: number
  }
}

export type PayrollPolicyHistoryEntry = {
  id: string
  version: string
  status: PayrollPolicyStatus
  updatedBy: string
  updatedAt: string
  note: string
  snapshot: PayrollPolicy
}

export type PayrollPolicyDiff = {
  group: string
  label: string
  before: string
  after: string
  trend: 'up' | 'down' | 'neutral'
}

export const PAYROLL_POLICY_STORAGE_KEY = 'homies-payroll-policy-v1'
export const PAYROLL_POLICY_HISTORY_KEY = 'homies-payroll-policy-history-v1'
export const PAYROLL_POLICY_CACHE_KEY_PREFIX = 'homies-payroll-policy-cache-v2'
export const MIN_REGION_1_SALARY = 4680000
export const INSURANCE_MAX_BASE = 29800000

export function getPayrollPolicyCacheKey(organizationId: string = 'a0000000-0000-0000-0000-000000000001'): string {
  return `${PAYROLL_POLICY_CACHE_KEY_PREFIX}::${organizationId}`
}

const defaultFnbPolicy: PayrollFnbPolicy = {
  mealAllowancePerShift: 30000,
  openingShiftAllowance: 20000,
  closingShiftAllowance: 40000,
  splitShiftAllowance: 25000,
  peakHourBonus: 15000,
  nightShiftAllowance: 50000,
  trainingShiftAllowance: 25000,
  serviceChargePoolRate: 0.03,
  tipPoolRate: 0.7,
  holidayPeakBonusRate: 0.5,
  tetPeakBonusRate: 1,
  cashShortageAutoDeductionLimit: 200000,
  requireCashShortageApproval: true,
  requireInventoryBreakageApproval: true,
}

export function buildDefaultPayrollPolicy(): PayrollPolicy {
  const grades = masterPositions.map((position, index) => ({
    ...position,
    band: index < 3 ? 'Cửa hàng' : 'Quản lý ca',
    minSalary: Math.round(position.base_salary * 0.9),
    maxSalary: Math.round(position.base_salary * 1.28),
    probation: Math.round(position.base_salary * settingsPayroll.salary_coefficients.probation_rate),
    kpiPool: index < 3 ? 600000 : 1500000,
    status: position.base_salary >= MIN_REGION_1_SALARY ? 'Đạt sàn vùng I' : 'Cần kiểm tra',
  }))

  return {
    meta: {
      schemaVersion: 1,
      policyVersion: 1,
      effectiveFrom: '2026-01-01',
      updatedAt: '22/05/2026 09:10',
      updatedBy: 'System preset',
      note: 'Khởi tạo cấu hình mặc định',
    },
    version: 'VN-2026.01',
    status: 'active',
    updatedBy: 'System preset',
    updatedAt: '22/05/2026 09:10',
    standardDaysPerMonth: 26,
    standardHoursPerDay: 8,
    work: {
      standardDaysPerMonth: 26,
      standardHoursPerDay: 8,
    },
    partTimeOvertimeEnabled: false,
    partTimeOvertimeThresholdHours: 8,
    partTimeOvertimeMultiplier: 1.5,
    grades,
    allowances: [
      { name: 'Phụ cấp cơm ca', type: 'Theo ca', amount: 650000, taxable: 'Theo chính sách nội bộ', appliesTo: 'Nhân viên full-time' },
      { name: 'Phụ cấp điện thoại', type: 'Cố định', amount: 250000, taxable: 'Tính PIT nếu vượt định mức', appliesTo: 'Trưởng ca, quản lý' },
      { name: 'Phụ cấp trách nhiệm', type: 'Theo vai trò', amount: 1200000, taxable: 'Tính PIT', appliesTo: 'Trưởng ca trở lên' },
      { name: 'Thưởng chuyên cần', type: 'Điều kiện', amount: 500000, taxable: 'Tính PIT', appliesTo: 'Không đi trễ, không vắng' },
    ],
    legal: {
      personalDeduction: 11000000,
      dependentDeduction: 4400000,
      maxInsuranceSalary: 29800000,
      minRegionSalary: 20000,
    },
    fnb: defaultFnbPolicy,
    rates: {
      probation: settingsPayroll.salary_coefficients.probation_rate,
      bhxhEmployee: settingsPayroll.salary_coefficients.bhxh_employee,
      bhytEmployee: settingsPayroll.salary_coefficients.bhyt_employee,
      bhtnEmployee: settingsPayroll.salary_coefficients.bhtn_employee,
      taxBracket1: settingsPayroll.salary_coefficients.tax_bracket_1,
      otWeekday: settingsPayroll.standard_work_days.ot_coefficient,
      otNight: settingsPayroll.standard_work_days.night_coefficient,
      otHoliday: settingsPayroll.standard_work_days.holiday_coefficient,
    },
  }
}

let inMemoryActivePolicy: PayrollPolicy | null = null

export function setInMemoryActivePolicy(policy: PayrollPolicy | null): void {
  inMemoryActivePolicy = policy
}

export function clearLegacyLocalStoragePolicy(): void {
  if (typeof window === 'undefined') return
  try {
    if (window.localStorage.getItem(PAYROLL_POLICY_STORAGE_KEY)) {
      window.localStorage.removeItem(PAYROLL_POLICY_STORAGE_KEY)
      console.info('[PayrollPolicy] Đã chủ động xoá key localStorage cũ:', PAYROLL_POLICY_STORAGE_KEY)
    }
  } catch (err) {
    console.warn('[PayrollPolicy] Không thể xoá key cũ:', err)
  }
}

export function getStoredPayrollPolicy(organizationId: string = 'a0000000-0000-0000-0000-000000000001'): PayrollPolicy {
  clearLegacyLocalStoragePolicy()
  if (inMemoryActivePolicy) return inMemoryActivePolicy

  const fallback = buildDefaultPayrollPolicy()
  if (typeof window === 'undefined') return fallback

  const cacheKey = getPayrollPolicyCacheKey(organizationId)
  const stored = window.localStorage.getItem(cacheKey)
  if (!stored) return fallback

  try {
    const envelope = JSON.parse(stored)
    const payload = envelope?.payload || envelope
    return migratePolicy(payload)
  } catch {
    window.localStorage.removeItem(cacheKey)
    return fallback
  }
}

export function saveStoredPayrollPolicy(policy: PayrollPolicy, organizationId: string = 'a0000000-0000-0000-0000-000000000001') {
  clearLegacyLocalStoragePolicy()
  const migrated = migratePolicy(policy)
  inMemoryActivePolicy = migrated
  if (typeof window === 'undefined') return
  try {
    const cacheKey = getPayrollPolicyCacheKey(organizationId)
    const envelope = {
      meta: migrated.meta,
      payload: migrated,
    }
    window.localStorage.setItem(cacheKey, JSON.stringify(envelope))
  } catch (err) {
    console.warn('[PayrollPolicy] Không thể lưu cache localStorage:', err)
  }
}

export async function fetchRemotePayrollPolicy(
  organizationId: string = 'a0000000-0000-0000-0000-000000000001'
): Promise<PayrollPolicy | null> {
  clearLegacyLocalStoragePolicy()
  if (!isSupabaseConfigured || !isRealDbMode()) return null
  try {
    // 1. Đọc key homies-payroll-policy-v1
    let { data, error } = await supabase
      .from('cau_hinh_to_chuc')
      .select('gia_tri, ngay_cap_nhat')
      .eq('khoa', PAYROLL_POLICY_STORAGE_KEY)
      .eq('to_chuc_id', organizationId)
      .maybeSingle()

    // Fallback key chinh_sach_luong nếu chưa có key v1
    if (!data && !error) {
      const fallbackRes = await supabase
        .from('cau_hinh_to_chuc')
        .select('gia_tri, ngay_cap_nhat')
        .eq('khoa', 'chinh_sach_luong')
        .eq('to_chuc_id', organizationId)
        .maybeSingle()
      if (fallbackRes.data) {
        data = fallbackRes.data
      }
    }

    if (error || !data || !data.gia_tri) {
      console.warn('[PayrollPolicy] Fetch remote policy failed or empty:', error?.message)
      return null
    }

    const rawParsed = JSON.parse(data.gia_tri)
    const dbPolicy = migratePolicy(rawParsed)
    if (data.ngay_cap_nhat && (!dbPolicy.meta.updatedAt || dbPolicy.meta.updatedAt === '22/05/2026 09:10')) {
      dbPolicy.meta.updatedAt = data.ngay_cap_nhat
    }

    // 2. So sánh với cache: nếu meta.policyVersion hoặc meta.updatedAt khác thì ghi đè cache
    if (typeof window !== 'undefined') {
      const cacheKey = getPayrollPolicyCacheKey(organizationId)
      const cachedRaw = window.localStorage.getItem(cacheKey)
      let needsCacheUpdate = true
      if (cachedRaw) {
        try {
          const cachedEnvelope = JSON.parse(cachedRaw)
          if (
            cachedEnvelope?.meta?.policyVersion === dbPolicy.meta.policyVersion &&
            cachedEnvelope?.meta?.updatedAt === dbPolicy.meta.updatedAt
          ) {
            needsCacheUpdate = false
          }
        } catch {
          needsCacheUpdate = true
        }
      }
      if (needsCacheUpdate) {
        saveStoredPayrollPolicy(dbPolicy, organizationId)
      }
    }

    inMemoryActivePolicy = dbPolicy
    return dbPolicy
  } catch (err) {
    console.error('[PayrollPolicy] Fetch remote policy exception:', err)
    return null
  }
}

export async function syncRemotePayrollPolicy(
  policy: PayrollPolicy,
  organizationId: string = 'a0000000-0000-0000-0000-000000000001'
): Promise<boolean> {
  clearLegacyLocalStoragePolicy()
  if (!isSupabaseConfigured || !isRealDbMode()) return true
  try {
    const migrated = migratePolicy(policy)
    const { error } = await supabase.from('cau_hinh_to_chuc').upsert({
      to_chuc_id: organizationId,
      khoa: PAYROLL_POLICY_STORAGE_KEY,
      gia_tri: JSON.stringify(migrated),
      ngay_cap_nhat: new Date().toISOString()
    }, {
      onConflict: 'to_chuc_id, khoa'
    })
    
    if (error) {
      console.error('[PayrollPolicy] Sync remote policy failed:', error.message)
      return false
    }
    saveStoredPayrollPolicy(migrated, organizationId)
    return true
  } catch (err) {
    console.error('[PayrollPolicy] Sync remote policy exception:', err)
    return false
  }
}

export async function resolvePolicyForPeriod(
  periodStart: string,
  organizationId: string = 'a0000000-0000-0000-0000-000000000001'
): Promise<PayrollPolicy> {
  clearLegacyLocalStoragePolicy()

  if (isSupabaseConfigured && isRealDbMode()) {
    try {
      const { data, error } = await supabase
        .from('cau_hinh_to_chuc')
        .select('gia_tri')
        .eq('khoa', PAYROLL_POLICY_HISTORY_KEY)
        .eq('to_chuc_id', organizationId)
        .maybeSingle()

      if (!error && data?.gia_tri) {
        const history = JSON.parse(data.gia_tri) as Array<{ meta: PayrollPolicyMeta; payload: any }>
        if (Array.isArray(history) && history.length > 0) {
          const eligible = history
            .filter(entry => entry.meta?.effectiveFrom && entry.meta.effectiveFrom <= periodStart)
            .sort((a, b) => (b.meta.effectiveFrom > a.meta.effectiveFrom ? 1 : -1))

          if (eligible.length > 0) {
            return migratePolicy(eligible[0].payload)
          }
        }
      }
    } catch (err) {
      console.warn('[PayrollPolicy] Đọc lịch sử policy từ DB thất bại:', err)
    }
  }

  console.warn(
    `[PayrollPolicy] Không tìm thấy phiên bản chính sách cho kỳ ${periodStart}, sử dụng chính sách đang hoạt động.`
  )

  const remote = await fetchRemotePayrollPolicy(organizationId)
  if (remote) return remote

  return getActivePayrollPolicy(organizationId)
}

export async function appendPayrollPolicy(
  nextPolicy: PayrollPolicy,
  note: string,
  author: string = 'Admin',
  effectiveFrom?: string,
  organizationId: string = 'a0000000-0000-0000-0000-000000000001'
): Promise<{ success: boolean; policy?: PayrollPolicy; error?: string }> {
  clearLegacyLocalStoragePolicy()
  if (!isSupabaseConfigured || !isRealDbMode()) {
    return { success: false, error: 'Chưa cấu hình Supabase hoặc không ở chế độ Real DB' }
  }

  try {
    const currentActive = (await fetchRemotePayrollPolicy(organizationId)) || buildDefaultPayrollPolicy()

    let history: Array<{ meta: PayrollPolicyMeta; payload: PayrollPolicy }> = []
    const historyRes = await supabase
      .from('cau_hinh_to_chuc')
      .select('gia_tri')
      .eq('khoa', PAYROLL_POLICY_HISTORY_KEY)
      .eq('to_chuc_id', organizationId)
      .maybeSingle()

    if (!historyRes.error && historyRes.data?.gia_tri) {
      try {
        const parsed = JSON.parse(historyRes.data.gia_tri)
        if (Array.isArray(parsed)) history = parsed
      } catch {
        history = []
      }
    }

    // Đẩy bản cũ vào đầu history (mới nhất trước)
    history.unshift({
      meta: currentActive.meta,
      payload: currentActive,
    })

    const newPolicyVersion = (currentActive.meta?.policyVersion || 1) + 1
    const nowIso = new Date().toISOString()
    const newMeta: PayrollPolicyMeta = {
      schemaVersion: 1,
      policyVersion: newPolicyVersion,
      effectiveFrom: effectiveFrom || nextPolicy.meta?.effectiveFrom || nowIso.slice(0, 10),
      updatedAt: nowIso,
      updatedBy: author,
      note: note || 'Cập nhật cấu hình lương mới',
    }

    const newPolicy = migratePolicy({
      ...nextPolicy,
      meta: newMeta,
      updatedAt: nowIso,
      updatedBy: author,
    })

    const saveActiveRes = await supabase.from('cau_hinh_to_chuc').upsert(
      {
        to_chuc_id: organizationId,
        khoa: PAYROLL_POLICY_STORAGE_KEY,
        gia_tri: JSON.stringify(newPolicy),
        ngay_cap_nhat: nowIso,
      },
      { onConflict: 'to_chuc_id, khoa' }
    )

    if (saveActiveRes.error) {
      return { success: false, error: `Ghi policy thất bại: ${saveActiveRes.error.message}` }
    }

    const saveHistoryRes = await supabase.from('cau_hinh_to_chuc').upsert(
      {
        to_chuc_id: organizationId,
        khoa: PAYROLL_POLICY_HISTORY_KEY,
        gia_tri: JSON.stringify(history),
        ngay_cap_nhat: nowIso,
      },
      { onConflict: 'to_chuc_id, khoa' }
    )

    if (saveHistoryRes.error) {
      console.warn('[PayrollPolicy] Ghi history thất bại:', saveHistoryRes.error.message)
    }

    saveStoredPayrollPolicy(newPolicy, organizationId)
    return { success: true, policy: newPolicy }
  } catch (err: any) {
    console.error('[PayrollPolicy] appendPayrollPolicy exception:', err)
    return { success: false, error: err.message || 'Lỗi ngoại lệ khi lưu cấu hình' }
  }
}

export function getStoredPayrollPolicyHistory(): PayrollPolicyHistoryEntry[] {
  const policy = getStoredPayrollPolicy()
  if (typeof window === 'undefined') {
    return [createHistoryEntry(policy, 'Khởi tạo cấu hình mặc định')]
  }

  const stored = window.localStorage.getItem(PAYROLL_POLICY_HISTORY_KEY)
  if (!stored) {
    const seed = [createHistoryEntry(policy, 'Khởi tạo cấu hình hiện tại')]
    saveStoredPayrollPolicyHistory(seed)
    return seed
  }

  try {
    const history = JSON.parse(stored) as PayrollPolicyHistoryEntry[]
    return history.length ? history.map((item) => ({ ...item, snapshot: normalizePayrollPolicy(item.snapshot) })) : [createHistoryEntry(policy, 'Khởi tạo cấu hình hiện tại')]
  } catch {
    window.localStorage.removeItem(PAYROLL_POLICY_HISTORY_KEY)
    return [createHistoryEntry(policy, 'Khởi tạo cấu hình hiện tại')]
  }
}

export function recordPayrollPolicyChange(policy: PayrollPolicy, note: string): PayrollPolicyHistoryEntry[] {
  saveStoredPayrollPolicy(policy)

  const history = getStoredPayrollPolicyHistory()
  const entry = createHistoryEntry(policy, note)
  const nextHistory = [
    entry,
    ...history.filter((item) => item.id !== entry.id),
  ].slice(0, 20)

  saveStoredPayrollPolicyHistory(nextHistory)
  return nextHistory
}

export function rollbackPayrollPolicy(version: string, actor: string = 'CEO'): PayrollPolicy | null {
  const target = getStoredPayrollPolicyHistory().find((item) => item.version === version)
  if (!target) return null

  const rollbackPolicy: PayrollPolicy = {
    ...target.snapshot,
    status: 'active',
    updatedBy: actor,
    updatedAt: new Date().toLocaleString('vi-VN'),
  }

  recordPayrollPolicyChange(rollbackPolicy, `Khôi phục cấu hình từ ${version}`)
  return rollbackPolicy
}

export function getActivePayrollPolicy(organizationId: string = 'a0000000-0000-0000-0000-000000000001'): PayrollPolicy {
  clearLegacyLocalStoragePolicy()
  if (inMemoryActivePolicy) {
    return inMemoryActivePolicy
  }

  const stored = getStoredPayrollPolicy(organizationId)
  if (stored.status === 'active') return stored

  const activeHistory = getStoredPayrollPolicyHistory().find((item) => item.snapshot.status === 'active')
  return activeHistory?.snapshot ?? buildDefaultPayrollPolicy()
}

export function comparePayrollPolicies(base: PayrollPolicy, next: PayrollPolicy): PayrollPolicyDiff[] {
  const diffs: PayrollPolicyDiff[] = []

  addMoneyDiff(diffs, 'Bảo hiểm & thuế', 'Tỷ lệ thử việc', base.rates.probation, next.rates.probation, true)
  addMoneyDiff(diffs, 'Bảo hiểm & thuế', 'BHXH nhân viên', base.rates.bhxhEmployee, next.rates.bhxhEmployee, true)
  addMoneyDiff(diffs, 'Bảo hiểm & thuế', 'BHYT nhân viên', base.rates.bhytEmployee, next.rates.bhytEmployee, true)
  addMoneyDiff(diffs, 'Bảo hiểm & thuế', 'BHTN nhân viên', base.rates.bhtnEmployee, next.rates.bhtnEmployee, true)
  addMoneyDiff(diffs, 'OT', 'OT ngày thường', base.rates.otWeekday, next.rates.otWeekday, true)
  addMoneyDiff(diffs, 'OT', 'OT ban đêm', base.rates.otNight, next.rates.otNight, true)
  addMoneyDiff(diffs, 'OT', 'OT ngày lễ', base.rates.otHoliday, next.rates.otHoliday, true)

  for (const grade of next.grades) {
    const oldGrade = base.grades.find((item) => item.id === grade.id)
    if (!oldGrade) continue
    addMoneyDiff(diffs, 'Bậc lương', grade.name, oldGrade.base_salary, grade.base_salary)
    addMoneyDiff(diffs, 'KPI', `${grade.name} KPI`, oldGrade.kpiPool, grade.kpiPool)
  }

  for (const allowance of next.allowances) {
    const oldAllowance = base.allowances.find((item) => item.name === allowance.name)
    if (!oldAllowance) continue
    addMoneyDiff(diffs, 'Phụ cấp', allowance.name, oldAllowance.amount, allowance.amount)
  }

  addMoneyDiff(diffs, 'F&B', 'Cơm ca/shift', base.fnb.mealAllowancePerShift, next.fnb.mealAllowancePerShift)
  addMoneyDiff(diffs, 'F&B', 'Ca mở cửa', base.fnb.openingShiftAllowance, next.fnb.openingShiftAllowance)
  addMoneyDiff(diffs, 'F&B', 'Ca đóng cửa', base.fnb.closingShiftAllowance, next.fnb.closingShiftAllowance)
  addMoneyDiff(diffs, 'F&B', 'Ca gãy', base.fnb.splitShiftAllowance, next.fnb.splitShiftAllowance)
  addMoneyDiff(diffs, 'F&B', 'Giờ cao điểm', base.fnb.peakHourBonus, next.fnb.peakHourBonus)
  addMoneyDiff(diffs, 'F&B', 'Ca đêm', base.fnb.nightShiftAllowance, next.fnb.nightShiftAllowance)
  addMoneyDiff(diffs, 'F&B', 'Training shift', base.fnb.trainingShiftAllowance, next.fnb.trainingShiftAllowance)
  addMoneyDiff(diffs, 'F&B', 'Service charge pool', base.fnb.serviceChargePoolRate, next.fnb.serviceChargePoolRate, true)
  addMoneyDiff(diffs, 'F&B', 'Tip pool cho team', base.fnb.tipPoolRate, next.fnb.tipPoolRate, true)
  addMoneyDiff(diffs, 'F&B', 'Lễ cao điểm', base.fnb.holidayPeakBonusRate, next.fnb.holidayPeakBonusRate, true)
  addMoneyDiff(diffs, 'F&B', 'Tết cao điểm', base.fnb.tetPeakBonusRate, next.fnb.tetPeakBonusRate, true)
  addMoneyDiff(diffs, 'F&B', 'Trần lệch tiền tự khấu trừ', base.fnb.cashShortageAutoDeductionLimit, next.fnb.cashShortageAutoDeductionLimit)
  addBoolDiff(diffs, 'F&B', 'Duyệt lệch tiền', base.fnb.requireCashShortageApproval, next.fnb.requireCashShortageApproval)
  addBoolDiff(diffs, 'F&B', 'Duyệt hủy/hỏng nguyên liệu', base.fnb.requireInventoryBreakageApproval, next.fnb.requireInventoryBreakageApproval)

  return diffs
}

export async function loadPayrollPolicyFromDb(
  organizationId: string = 'a0000000-0000-0000-0000-000000000001'
): Promise<PayrollPolicy | null> {
  return fetchRemotePayrollPolicy(organizationId)
}

export async function savePayrollPolicyToDb(
  policy: PayrollPolicy,
  organizationId: string = 'a0000000-0000-0000-0000-000000000001'
): Promise<boolean> {
  return syncRemotePayrollPolicy(policy, organizationId)
}

function saveStoredPayrollPolicyHistory(history: PayrollPolicyHistoryEntry[]) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(PAYROLL_POLICY_HISTORY_KEY, JSON.stringify(history))
}

function createHistoryEntry(policy: PayrollPolicy, note: string): PayrollPolicyHistoryEntry {
  return {
    id: `${policy.version}-${policy.status}-${policy.updatedAt}`,
    version: policy.version,
    status: policy.status,
    updatedBy: policy.updatedBy,
    updatedAt: policy.updatedAt,
    note,
    snapshot: policy,
  }
}

function normalizePayrollPolicy(policy: Partial<PayrollPolicy>): PayrollPolicy {
  return migratePolicy(policy)
}

function addMoneyDiff(
  diffs: PayrollPolicyDiff[],
  group: string,
  label: string,
  before: number,
  after: number,
  isPercent = false,
) {
  if (before === after) return

  diffs.push({
    group,
    label,
    before: isPercent ? formatPercent(before) : formatMoney(before),
    after: isPercent ? formatPercent(after) : formatMoney(after),
    trend: after > before ? 'up' : 'down',
  })
}

function addBoolDiff(
  diffs: PayrollPolicyDiff[],
  group: string,
  label: string,
  before: boolean,
  after: boolean,
) {
  if (before === after) return

  diffs.push({
    group,
    label,
    before: before ? 'Bật' : 'Tắt',
    after: after ? 'Bật' : 'Tắt',
    trend: 'neutral',
  })
}

function formatMoney(value: number) {
  return `${value.toLocaleString('vi-VN')} đ`
}

function formatPercent(value: number) {
  return `${Math.round(value * 1000) / 10}%`
}
