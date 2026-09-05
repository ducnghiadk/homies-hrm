import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const {
  countConsecutiveQualifiedMonths,
  evaluateCareerGradeTransitionEligibility,
  evaluatePromotionEligibility,
} = await import('./development-service.ts')

describe('development-service', () => {
  it('counts only the latest uninterrupted sequence of qualified calendar months', () => {
    assert.equal(countConsecutiveQualifiedMonths([
      { month: '2026-08', qualified: true },
      { month: '2026-07', qualified: true },
      { month: '2026-06', qualified: false },
      { month: '2026-05', qualified: true },
    ]), 2)

    assert.equal(countConsecutiveQualifiedMonths([
      { month: '2026-08', qualified: true },
      { month: '2026-06', qualified: true },
    ]), 1)
  })

  it('marks PT1 to PT2 as eligible when all baseline checks pass', () => {
    const result = evaluatePromotionEligibility({
      employee: {
        id: 'emp_pt1',
        store_id: 'store_001',
        level_code: 'pt1_pc',
        position_id: 'cashier',
        employment_status: 'official',
      },
      target_level: 'pt2',
      months_in_level: 4,
      monthly_scores: [
        { month: '2026-05', total: 3.6, core_average: 3.5, valid_hours: 92 },
        { month: '2026-06', total: 3.7, core_average: 3.6, valid_hours: 88 },
        { month: '2026-07', total: 3.8, core_average: 3.7, valid_hours: 90 },
      ],
      critical_incident_dates: [],
      active_warning_dates: [],
      now: '2026-08-22T09:00:00.000Z',
    })

    assert.equal(result.status, 'eligible_for_test')
    assert.equal(result.checks.every((item: { passed: boolean }) => item.passed), true)
  })

  it('blocks promotion eligibility when unresolved appeals exist', () => {
    const result = evaluatePromotionEligibility({
      employee: {
        id: 'emp_pt1',
        store_id: 'store_001',
        level_code: 'pt1_pc',
        position_id: 'cashier',
        employment_status: 'official',
      },
      target_level: 'pt2',
      months_in_level: 4,
      monthly_scores: [
        { month: '2026-05', total: 3.6, core_average: 3.5, valid_hours: 92 },
        { month: '2026-06', total: 3.7, core_average: 3.6, valid_hours: 88 },
        { month: '2026-07', total: 3.8, core_average: 3.7, valid_hours: 90 },
      ],
      critical_incident_dates: [],
      active_warning_dates: [],
      unresolved_appeal_months: ['2026-07'],
      now: '2026-08-22T09:00:00.000Z',
    })

    assert.equal(result.status, 'not_eligible')
    assert.equal(
      result.checks.find((item: { code: string }) => item.code === 'unresolved_appeals')?.passed,
      false
    )
  })

  it('blocks PT2 to Senior when high-month requirement is not met', () => {
    const result = evaluatePromotionEligibility({
      employee: {
        id: 'emp_pt2',
        store_id: 'store_001',
        level_code: 'pt2',
        position_id: 'barista',
        employment_status: 'official',
      },
      target_level: 'senior',
      months_in_level: 7,
      monthly_scores: [
        { month: '2026-02', total: 3.9, core_average: 3.8, valid_hours: 94 },
        { month: '2026-03', total: 3.4, core_average: 3.8, valid_hours: 90 },
        { month: '2026-04', total: 3.8, core_average: 3.9, valid_hours: 91 },
        { month: '2026-05', total: 3.3, core_average: 3.8, valid_hours: 96 },
        { month: '2026-06', total: 3.9, core_average: 4, valid_hours: 89 },
        { month: '2026-07', total: 3.2, core_average: 3.7, valid_hours: 87 },
      ],
      critical_incident_dates: [],
      active_warning_dates: [],
      now: '2026-08-22T09:00:00.000Z',
    })

    assert.equal(result.status, 'not_eligible')
    assert.equal(
      result.checks.find((item: { code: string }) => item.code === 'required_high_months')?.passed,
      false
    )
  })

  it('marks Senior to Shift Leader as eligible when strict score and hour checks pass', () => {
    const result = evaluatePromotionEligibility({
      employee: {
        id: 'emp_senior',
        store_id: 'store_001',
        level_code: 'senior',
        position_id: 'senior_barista',
        employment_status: 'official',
      },
      target_level: 'shift_leader',
      months_in_level: 8,
      monthly_scores: [
        { month: '2026-02', total: 4, core_average: 4, valid_hours: 91 },
        { month: '2026-03', total: 4.1, core_average: 4.1, valid_hours: 95 },
        { month: '2026-04', total: 4.2, core_average: 4.2, valid_hours: 93 },
        { month: '2026-05', total: 4, core_average: 4, valid_hours: 88 },
        { month: '2026-06', total: 4.3, core_average: 4.2, valid_hours: 94 },
        { month: '2026-07', total: 4.1, core_average: 4, valid_hours: 90 },
      ],
      critical_incident_dates: [],
      active_warning_dates: [],
      now: '2026-08-22T09:00:00.000Z',
    })

    assert.equal(result.status, 'eligible_for_test')
    assert.equal(
      result.checks.find((item: { code: string }) => item.code === 'minimum_valid_hours')?.passed,
      true
    )
  })

  it('blocks an otherwise strong case when there is an active warning inside the lookback window', () => {
    const result = evaluatePromotionEligibility({
      employee: {
        id: 'emp_warning',
        store_id: 'store_001',
        level_code: 'pt2',
        position_id: 'barista',
        employment_status: 'official',
      },
      target_level: 'senior',
      months_in_level: 7,
      monthly_scores: [
        { month: '2026-02', total: 4, core_average: 3.9, valid_hours: 92 },
        { month: '2026-03', total: 4, core_average: 3.9, valid_hours: 90 },
        { month: '2026-04', total: 3.9, core_average: 3.8, valid_hours: 88 },
        { month: '2026-05', total: 4, core_average: 3.9, valid_hours: 91 },
        { month: '2026-06', total: 3.9, core_average: 3.8, valid_hours: 93 },
        { month: '2026-07', total: 4, core_average: 3.9, valid_hours: 95 },
      ],
      critical_incident_dates: [],
      active_warning_dates: ['2026-05-15T10:00:00.000Z'],
      now: '2026-08-22T09:00:00.000Z',
    })

    assert.equal(result.status, 'not_eligible')
    assert.equal(
      result.checks.find((item: { code: string }) => item.code === 'active_warning_window')?.passed,
      false
    )
  })

  it('evaluates C1 to C2 multiskill transition requirements', () => {
    // 1. Missing cashier certification
    const resultMissingSkill = evaluateCareerGradeTransitionEligibility({
      employee_id: 'emp_1',
      current_grade: 'c1_pc',
      target_grade: 'c2',
      tenure_months: 3,
      monthly_kpi_scores: [{ month: '2026-06', score: 85 }, { month: '2026-07', score: 88 }],
      certifications: [
        { id: '1', employee_id: 'emp_1', skill_code: 'barista', status: 'achieved', assessed_at: '2026-06-01', assessed_by: null, score: null, standard_version: 1 },
      ],
    })
    assert.equal(resultMissingSkill.status, 'not_eligible')
    assert.deepEqual(resultMissingSkill.missing_skills, ['cashier'])

    // 2. Full requirements met (tenure, KPI, both certifications)
    const resultEligible = evaluateCareerGradeTransitionEligibility({
      employee_id: 'emp_1',
      current_grade: 'c1_pc',
      target_grade: 'c2',
      tenure_months: 3,
      monthly_kpi_scores: [{ month: '2026-06', score: 85 }, { month: '2026-07', score: 88 }],
      certifications: [
        { id: '1', employee_id: 'emp_1', skill_code: 'barista', status: 'achieved', assessed_at: '2026-06-01', assessed_by: null, score: null, standard_version: 1 },
        { id: '2', employee_id: 'emp_1', skill_code: 'cashier', status: 'achieved', assessed_at: '2026-07-01', assessed_by: null, score: null, standard_version: 1 },
      ],
    })
    assert.equal(resultEligible.status, 'eligible_for_review')
    assert.equal(resultEligible.action_type, 'promotion')
    assert.deepEqual(resultEligible.missing_skills, [])
  })

  it('blocks transition when tenure is insufficient or KPI below threshold', () => {
    const resultLowKpi = evaluateCareerGradeTransitionEligibility({
      employee_id: 'emp_2',
      current_grade: 'c2',
      target_grade: 'c3',
      tenure_months: 6,
      monthly_kpi_scores: [{ month: '2026-05', score: 85 }, { month: '2026-06', score: 75 }, { month: '2026-07', score: 85 }],
      certifications: [
        { id: '1', employee_id: 'emp_2', skill_code: 'barista', status: 'achieved', assessed_at: '2026-01-01', assessed_by: null, score: null, standard_version: 1 },
        { id: '2', employee_id: 'emp_2', skill_code: 'cashier', status: 'achieved', assessed_at: '2026-01-01', assessed_by: null, score: null, standard_version: 1 },
      ],
    })
    assert.equal(resultLowKpi.status, 'not_eligible')
    assert.equal(resultLowKpi.checks.find((c) => c.code === 'kpi_consecutive_months')?.passed, false)
  })
})

