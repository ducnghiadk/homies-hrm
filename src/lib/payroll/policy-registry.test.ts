import test from 'node:test'
import assert from 'node:assert/strict'
import {
  POLICY_REGISTRY,
  validatePolicy,
  migratePolicy,
  getPolicyValueByPath,
  setPolicyValueByPath,
} from './policy-registry'

test('POLICY_REGISTRY defines required core fields with valid constraints', () => {
  const paths = POLICY_REGISTRY.map(f => f.path)
  assert.ok(paths.includes('work.standardDaysPerMonth'))
  assert.ok(paths.includes('work.standardHoursPerDay'))
  assert.ok(paths.includes('legal.personalDeduction'))
  assert.ok(paths.includes('legal.dependentDeduction'))
  assert.ok(paths.includes('legal.minRegionSalary'))
  assert.ok(paths.includes('legal.maxInsuranceSalary'))
  assert.ok(paths.includes('rates.bhxhEmployee'))
  assert.ok(paths.includes('rates.bhytEmployee'))
  assert.ok(paths.includes('rates.bhtnEmployee'))
  assert.ok(paths.includes('rates.probation'))
  assert.ok(paths.includes('rates.otWeekday'))
  assert.ok(paths.includes('rates.otNight'))
  assert.ok(paths.includes('rates.otHoliday'))
})

test('getPolicyValueByPath and setPolicyValueByPath work for nested and root work properties', () => {
  const policy: any = { standardDaysPerMonth: 26, legal: { personalDeduction: 11000000 } }
  assert.equal(getPolicyValueByPath(policy, 'work.standardDaysPerMonth'), 26)
  assert.equal(getPolicyValueByPath(policy, 'legal.personalDeduction'), 11000000)

  setPolicyValueByPath(policy, 'work.standardDaysPerMonth', 24)
  assert.equal(policy.standardDaysPerMonth, 24)
  assert.equal(policy.work?.standardDaysPerMonth, 24)
})

test('validatePolicy passes on a fully valid policy', () => {
  const rawLegacy = {
    version: 'VN-2026.01',
    status: 'active',
    standardDaysPerMonth: 26,
    standardHoursPerDay: 8,
    legal: {
      personalDeduction: 11000000,
      dependentDeduction: 4400000,
      minRegionSalary: 20000,
      maxInsuranceSalary: 29800000,
    },
    rates: {
      probation: 0.85,
      bhxhEmployee: 0.08,
      bhytEmployee: 0.015,
      bhtnEmployee: 0.01,
      taxBracket1: 0.05,
      otWeekday: 1.5,
      otNight: 1.3,
      otHoliday: 3.0,
    },
  }
  const policy = migratePolicy(rawLegacy)
  const validation = validatePolicy(policy)
  assert.equal(validation.isValid, true)
  assert.equal(validation.errors.length, 0)
})

test('validatePolicy catches invalid or out-of-range values', () => {
  const invalidPolicy = {
    standardDaysPerMonth: 15, // min is 20
    standardHoursPerDay: 'invalid', // should be number
    legal: {
      personalDeduction: -1000, // min is 0
    },
  }
  const validation = validatePolicy(invalidPolicy)
  assert.equal(validation.isValid, false)
  assert.ok(validation.errors.some(e => e.path === 'work.standardDaysPerMonth'))
  assert.ok(validation.errors.some(e => e.path === 'work.standardHoursPerDay'))
  assert.ok(validation.errors.some(e => e.path === 'legal.personalDeduction'))
})

test('migratePolicy produces mandatory meta and preserves all money numbers without change', () => {
  // Mock legacy JSON exactly as found in database / old storage
  const legacyJson = {
    version: 'VN-Mẫu-Mô',
    status: 'active',
    updatedBy: 'CEO',
    updatedAt: '08:34:52 5/9/2026',
    standardDaysPerMonth: 26,
    standardHoursPerDay: 8,
    grades: [
      { id: 'pos-001', name: 'Pha chế', level: 1, base_salary: 5800000 },
      { id: 'pos-004', name: 'Trưởng ca', level: 2, base_salary: 8000000 },
    ],
    allowances: [
      { name: 'Phụ cấp cơm ca', type: 'Theo ca', amount: 650000 },
      { name: 'Phụ cấp trách nhiệm', type: 'Theo vai trò', amount: 1200000 },
    ],
    fnb: {
      mealAllowancePerShift: 30000,
      trainingShiftAllowance: 25000,
    },
    rates: {
      probation: 0.85,
      bhxhEmployee: 0.08,
      bhytEmployee: 0.015,
      bhtnEmployee: 0.01,
      taxBracket1: 0.05,
      otWeekday: 1.5,
      otNight: 1.3,
      otHoliday: 3.0,
    },
  }

  const migrated = migratePolicy(legacyJson)

  // 1. Mandatory meta block exists
  assert.ok(migrated.meta, 'Khối meta phải tồn tại')
  assert.equal(typeof migrated.meta.schemaVersion, 'number')
  assert.equal(typeof migrated.meta.policyVersion, 'number')
  assert.equal(migrated.meta.schemaVersion, 1)
  assert.equal(migrated.meta.policyVersion, 1)
  assert.equal(migrated.meta.effectiveFrom, '2026-01-01')
  assert.equal(migrated.meta.updatedBy, 'CEO')
  assert.equal(migrated.meta.updatedAt, '08:34:52 5/9/2026')

  // 2. All money and policy values are preserved 100% identically
  assert.equal(migrated.standardDaysPerMonth, 26)
  assert.equal(migrated.work?.standardDaysPerMonth, 26)
  assert.equal(migrated.standardHoursPerDay, 8)
  assert.equal(migrated.grades[0].base_salary, 5800000)
  assert.equal(migrated.grades[1].base_salary, 8000000)
  assert.equal(migrated.allowances[0].amount, 650000)
  assert.equal(migrated.allowances[1].amount, 1200000)
  assert.equal(migrated.fnb.mealAllowancePerShift, 30000)
  assert.equal(migrated.fnb.trainingShiftAllowance, 25000)
  assert.equal(migrated.rates.bhxhEmployee, 0.08)
  assert.equal(migrated.rates.bhytEmployee, 0.015)
  assert.equal(migrated.rates.bhtnEmployee, 0.01)
  assert.equal(migrated.rates.otWeekday, 1.5)
  assert.equal(migrated.rates.otHoliday, 3.0)

  // 3. Missing registry fields are populated with default values
  assert.equal(migrated.legal.personalDeduction, 11000000)
  assert.equal(migrated.legal.dependentDeduction, 4400000)
  assert.equal(migrated.legal.minRegionSalary, 20000)
  assert.equal(migrated.legal.maxInsuranceSalary, 29800000)
})

test('resolvePolicyForPeriod simulation picks the latest immutable version whose effectiveFrom <= periodStart', () => {
  const history = [
    {
      meta: { schemaVersion: 1, policyVersion: 3, effectiveFrom: '2026-04-01', updatedAt: '', updatedBy: null, note: null },
      payload: { standardDaysPerMonth: 24 },
    },
    {
      meta: { schemaVersion: 1, policyVersion: 2, effectiveFrom: '2026-02-01', updatedAt: '', updatedBy: null, note: null },
      payload: { standardDaysPerMonth: 26 },
    },
    {
      meta: { schemaVersion: 1, policyVersion: 1, effectiveFrom: '2026-01-01', updatedAt: '', updatedBy: null, note: null },
      payload: { standardDaysPerMonth: 25 },
    },
  ]

  const resolve = (periodStart: string) => {
    const eligible = history
      .filter(entry => entry.meta.effectiveFrom <= periodStart)
      .sort((a, b) => (b.meta.effectiveFrom > a.meta.effectiveFrom ? 1 : -1))
    return eligible[0]?.payload
  }

  assert.equal(resolve('2026-01-15')?.standardDaysPerMonth, 25)
  assert.equal(resolve('2026-02-01')?.standardDaysPerMonth, 26)
  assert.equal(resolve('2026-02-28')?.standardDaysPerMonth, 26)
  assert.equal(resolve('2026-03-15')?.standardDaysPerMonth, 26)
  assert.equal(resolve('2026-04-01')?.standardDaysPerMonth, 24)
  assert.equal(resolve('2026-05-01')?.standardDaysPerMonth, 24)
})
