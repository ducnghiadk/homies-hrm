import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { KpiEvaluation, KpiPeriod } from './types'

const { DEFAULT_KPI_POLICY } = await import('./default-policy.ts')
const { publishVersion } = await import('./configuration-service.ts')
const {
  createEvaluationFromPeriod,
  applySuggestedScores,
  updateLeaderScore,
  applyPeerAggregateToEvaluation,
  validateEvaluationSubmission,
  submitEvaluation,
  autosaveEvaluation,
  getEvaluationScoreSummary,
} = await import('./evaluation-service.ts')

function createPublishedVersion() {
  return publishVersion(
    {
      id: 'kpi_set_2026_08_v1',
      set_id: 'kpi_set_main',
      version: 1,
      name: 'KPI thang 08/2026',
      status: 'draft',
      level_codes: DEFAULT_KPI_POLICY.levels,
      store_ids: ['store_001'],
      effective_from: '2026-08-01',
      effective_to: '2026-08-31',
      score_scale: DEFAULT_KPI_POLICY.score_scale,
      groups: structuredClone(DEFAULT_KPI_POLICY.groups),
      created_by: 'hr_admin_01',
      created_at: '2026-08-01T08:00:00.000Z',
    },
    'ceo_01',
    '2026-08-01T09:00:00.000Z'
  )
}

function createPeriod(): KpiPeriod {
  const version = createPublishedVersion()

  return {
    id: 'period_store_001_2026-08',
    org_id: 'homies',
    store_id: 'store_001',
    month: '2026-08',
    status: 'leader_scoring',
    snapshot: structuredClone({
      ...version,
      source_status: 'published' as const,
    }),
    employee_ids: ['emp_01'],
    opened_by: 'hr_admin_01',
    opened_at: '2026-08-02T08:00:00.000Z',
    revision: 0,
  }
}

function createEmployee() {
  return {
    id: 'emp_01',
    store_id: 'store_001',
    level_code: 'pt1_pc' as const,
    position_id: 'cashier',
    employment_status: 'official' as const,
  }
}

function createUpsellEvaluation(storeId: string, withTargetProfiles: boolean): KpiEvaluation {
  return {
    id: `eval_upsell_${storeId}`,
    period_id: `period_${storeId}_2026-09`,
    employee: {
      id: 'emp_upsell',
      store_id: storeId,
      level_code: 'pt1_pc',
      position_id: 'cashier',
      employment_status: 'official',
    },
    snapshot: {
      id: 'kpi_set_2026_09_v1',
      set_id: 'kpi_set_main',
      version: 1,
      name: 'KPI thang 09/2026',
      source_status: 'published',
      level_codes: ['pt1_pc'],
      store_ids: ['store-001', 'store-002'],
      effective_from: '2026-09-01',
      effective_to: '2026-09-30',
      score_scale: [1, 2, 3, 4, 5],
      store_group_snapshots: withTargetProfiles
        ? [
            { id: 'group-a', name: 'Store group A', store_ids: ['store-001'] },
            { id: 'group-b', name: 'Store group B', store_ids: ['store-002'] },
          ]
        : undefined,
      target_profiles: withTargetProfiles
        ? [
            {
              scope: 'store_group',
              store_group_id: 'group-a',
              targets: [
                {
                  criterion_id: 'crit_upsell',
                  target: 10,
                  score_bands: [
                    { min: 0, max: 9, score: 1 },
                    { min: 10, max: null, score: 5 },
                  ],
                },
              ],
            },
            {
              scope: 'store_group',
              store_group_id: 'group-b',
              targets: [
                {
                  criterion_id: 'crit_upsell',
                  target: 15,
                  score_bands: [
                    { min: 0, max: 9, score: 1 },
                    { min: 10, max: 12, score: 3 },
                    { min: 13, max: null, score: 5 },
                  ],
                },
              ],
            },
          ]
        : undefined,
      groups: [
        {
          id: 'sales',
          name: 'Sales',
          tag: 'revenue',
          weight: 100,
          promotion_core: true,
          sort_order: 1,
          criteria: [
            {
              id: 'crit_upsell',
              group_id: 'sales',
              name: 'Upsell rate',
              description: 'Ty le upsell',
              scoring_mode: 'automatic',
              weight: 100,
              unit: 'percent',
              direction: 'higher',
              source_key: 'pos.upsell_rate',
              score_bands: [
                { min: 0, max: 9, score: 1 },
                { min: 10, max: null, score: 5 },
              ],
              adjustment_reason_required: false,
              sort_order: 1,
              active: true,
            },
          ],
        },
      ],
      created_by: 'hr_admin_01',
      created_at: '2026-09-01T08:00:00.000Z',
      published_by: 'ceo_01',
      published_at: '2026-09-01T09:00:00.000Z',
    },
    scores: [
      {
        criterion_id: 'crit_upsell',
        source_refs: [],
        evidence_refs: [],
      },
    ],
    status: 'draft',
    revision: 0,
  }
}

describe('evaluation-service', () => {
  it('creates an evaluation from the KPI snapshot', () => {
    const evaluation = createEvaluationFromPeriod(createPeriod(), createEmployee())

    assert.equal(evaluation.period_id, 'period_store_001_2026-08')
    assert.equal(evaluation.employee.id, 'emp_01')
    assert.equal(evaluation.scores.length, 4)
    assert.ok(evaluation.scores.every((score: { source_refs: string[] }) => Array.isArray(score.source_refs)))
    assert.equal(evaluation.revision, 0)
  })

  it('applies suggested scores from ready and confirmed sources only', () => {
    const evaluation = createEvaluationFromPeriod(createPeriod(), createEmployee())
    const hydrated = applySuggestedScores(evaluation, [
      {
        key: 'pos.revenue_shift_index',
        status: 'confirmed',
        value: 95,
        source_label: 'POS nhap tay',
        captured_at: '2026-08-30T22:00:00.000Z',
        evidence_refs: ['pos_aug_2026'],
      },
      {
        key: 'service.customer_experience_index',
        status: 'missing',
        source_label: 'Trải nghiệm khách hàng',
        captured_at: '2026-08-30T22:00:00.000Z',
        evidence_refs: [],
      },
    ])

    const revenue = hydrated.scores.find((score: { criterion_id: string }) => score.criterion_id === 'revenue_output')
    const customer = hydrated.scores.find((score: { criterion_id: string }) => score.criterion_id === 'customer_feedback')

    assert.equal(revenue?.suggested_score, 5)
    assert.deepEqual(revenue?.source_refs, ['pos.revenue_shift_index'])
    assert.equal(customer?.suggested_score, undefined)
  })

  it('keeps incident-driven scores as suggestions so the leader still confirms the final score', () => {
    const evaluation = createEvaluationFromPeriod(createPeriod(), createEmployee())
    const hydrated = applySuggestedScores(evaluation, [
      {
        key: 'discipline.execution_index',
        status: 'ready',
        value: 84,
        source_label: 'Ky luat va vi pham • Incident',
        captured_at: '2026-08-30T22:00:00.000Z',
        evidence_refs: ['incident:incident_001'],
      },
    ])

    const discipline = hydrated.scores.find((score: { criterion_id: string }) => score.criterion_id === 'discipline_execution')

    assert.equal(discipline?.suggested_score, 2)
    assert.equal(discipline?.final_score, undefined)
    assert.deepEqual(discipline?.source_refs, ['discipline.execution_index'])
  })

  it('applies store group target profile bands when suggesting scores', () => {
    const result = applySuggestedScores(createUpsellEvaluation('store-002', true), [
      {
        key: 'pos.upsell_rate',
        status: 'ready',
        value: 12,
        captured_at: '2026-09-15',
        source_label: 'POS',
        evidence_refs: [],
      },
    ])

    const upsell = result.scores.find((item) => item.criterion_id === 'crit_upsell')

    assert.equal(upsell?.suggested_score, 3)
    assert.deepEqual(upsell?.source_refs, ['pos.upsell_rate'])
  })

  it('falls back to criterion bands for legacy snapshots without target profiles', () => {
    const result = applySuggestedScores(createUpsellEvaluation('store-002', false), [
      {
        key: 'pos.upsell_rate',
        status: 'ready',
        value: 12,
        captured_at: '2026-09-15',
        source_label: 'POS',
        evidence_refs: [],
      },
    ])

    const upsell = result.scores.find((item) => item.criterion_id === 'crit_upsell')

    assert.equal(upsell?.suggested_score, 5)
    assert.deepEqual(upsell?.source_refs, ['pos.upsell_rate'])
  })

  it('requires a reason when leader changes the suggested score', () => {
    const evaluation = applySuggestedScores(
      createEvaluationFromPeriod(createPeriod(), createEmployee()),
      [
        {
          key: 'pos.revenue_shift_index',
          status: 'ready',
          value: 95,
          source_label: 'POS nhap tay',
          captured_at: '2026-08-30T22:00:00.000Z',
          evidence_refs: ['pos_aug_2026'],
        },
      ]
    )

    const updated = updateLeaderScore(evaluation, {
      criterion_id: 'revenue_output',
      score: 4,
      evidence_refs: [],
    })

    const issues = validateEvaluationSubmission(updated)
    assert.deepEqual(
      issues.map((issue: { code: string; criterion_id: string }) => `${issue.code}:${issue.criterion_id}`),
      [
        'MISSING_REASON:revenue_output',
        'MISSING_SOURCE:customer_feedback',
        'MISSING_SOURCE:operations_accuracy',
        'MISSING_SOURCE:discipline_execution',
      ]
    )
  })

  it('requires evidence when the final score falls below the configured threshold', () => {
    let evaluation = createEvaluationFromPeriod(createPeriod(), createEmployee())

    evaluation = updateLeaderScore(evaluation, {
      criterion_id: 'discipline_execution',
      score: 3,
      evidence_refs: [],
    })

    const issues = validateEvaluationSubmission(evaluation)
    assert.ok(issues.some((issue: { code: string; criterion_id: string }) => issue.code === 'MISSING_EVIDENCE' && issue.criterion_id === 'discipline_execution'))
  })

  it('autosaves with revision checking and blocks submit when criteria are still missing', () => {
    let evaluation = createEvaluationFromPeriod(createPeriod(), createEmployee())

    evaluation = updateLeaderScore(evaluation, {
      criterion_id: 'revenue_output',
      score: 4,
      adjustment_reason: 'Leader can doi nguon POS',
      evidence_refs: ['manual_pos_note'],
    })

    const autosaved = autosaveEvaluation(evaluation, 1)
    assert.equal(autosaved.revision, 1)

    assert.throws(
      () => autosaveEvaluation(autosaved, 0),
      /Du lieu da duoc nguoi khac cap nhat/
    )

    assert.throws(
      () => submitEvaluation(autosaved, { id: 'leader_01', role: 'shift_leader', store_id: 'store_001' }),
      /Phieu KPI chua du dieu kien gui/
    )
  })

  it('applies peer aggregate to evaluation and falls back when sample is insufficient', () => {
    const evaluation = createEvaluationFromPeriod(createPeriod(), createEmployee())

    // 1. Đủ mẫu ẩn danh (2 phiếu)
    const validAggregate = {
      monthly_review_id: 'review-1',
      valid_response_count: 2,
      enough_anonymous_sample: true,
      question_scores: [],
      total_score: 4.5,
      strength_summary: 'Hỗ trợ tốt',
      improvement_summary: 'Bàn giao cẩn thận hơn',
      configured_weight_percent: 10,
      applied_peer_weight_percent: 10,
      fallback_primary_weight_percent: 0,
    }

    const withPeer = applyPeerAggregateToEvaluation(evaluation, validAggregate)
    assert.equal(withPeer.peer_summary?.enough_anonymous_sample, true)
    assert.equal(withPeer.peer_summary?.applied_weight_percent, 10)
    assert.equal(withPeer.peer_summary?.fallback_primary_weight_percent, 0)
    assert.equal(withPeer.peer_summary?.total_score, 4.5)

    // 2. Không đủ mẫu (1 phiếu)
    const invalidAggregate = {
      monthly_review_id: 'review-1',
      valid_response_count: 1,
      enough_anonymous_sample: false,
      question_scores: [],
      configured_weight_percent: 10,
      applied_peer_weight_percent: 0,
      fallback_primary_weight_percent: 10,
    }

    const withFallback = applyPeerAggregateToEvaluation(evaluation, invalidAggregate)
    assert.equal(withFallback.peer_summary?.enough_anonymous_sample, false)
    assert.equal(withFallback.peer_summary?.applied_weight_percent, 0)
    assert.equal(withFallback.peer_summary?.fallback_primary_weight_percent, 10)
  })

  // ── getEvaluationScoreSummary regression tests ──

  it('getEvaluationScoreSummary does NOT take scores[0] — aggregates all active criteria', () => {

    const evaluation: KpiEvaluation = {
      id: 'eval_summary_1',
      period_id: 'period_1',
      employee: { id: 'emp_01', store_id: 'store_001', level_code: 'pt1_pc', position_id: 'cashier', employment_status: 'official' },
      snapshot: {
        id: 'snap_1', set_id: 'set_1', version: 1, name: 'Test', source_status: 'published',
        level_codes: ['pt1_pc'], store_ids: ['store_001'], effective_from: '2026-08-01',
        score_scale: [1, 2, 3, 4, 5], created_by: 'hr', created_at: '2026-08-01T00:00:00Z',
        groups: [{
          id: 'g1', name: 'Group', tag: 'revenue', weight: 100, promotion_core: false, sort_order: 1,
          criteria: [
            { id: 'c1', group_id: 'g1', name: 'Crit1', description: '', scoring_mode: 'leader', weight: 50, score_bands: [], adjustment_reason_required: false, sort_order: 1, active: true },
            { id: 'c2', group_id: 'g1', name: 'Crit2', description: '', scoring_mode: 'leader', weight: 50, score_bands: [], adjustment_reason_required: false, sort_order: 2, active: true },
          ],
        }],
      },
      scores: [
        { criterion_id: 'c1', suggested_score: 1, source_refs: [], evidence_refs: [] },
        { criterion_id: 'c2', suggested_score: 5, source_refs: [], evidence_refs: [] },
      ],
      status: 'draft',
      revision: 0,
    }

    const summary = getEvaluationScoreSummary(evaluation)
    assert.equal(summary.suggested_total, 3)
    assert.notEqual(summary.suggested_total, evaluation.scores[0].suggested_score)
  })

  it('getEvaluationScoreSummary computes resolved_total for submitted evaluations with final_score ?? suggested_score fallback', () => {

    const evaluation: KpiEvaluation = {
      id: 'eval_summary_2',
      period_id: 'period_1',
      employee: { id: 'emp_01', store_id: 'store_001', level_code: 'pt1_pc', position_id: 'cashier', employment_status: 'official' },
      snapshot: {
        id: 'snap_1', set_id: 'set_1', version: 1, name: 'Test', source_status: 'published',
        level_codes: ['pt1_pc'], store_ids: ['store_001'], effective_from: '2026-08-01',
        score_scale: [1, 2, 3, 4, 5], created_by: 'hr', created_at: '2026-08-01T00:00:00Z',
        groups: [{
          id: 'g1', name: 'Group', tag: 'revenue', weight: 100, promotion_core: false, sort_order: 1,
          criteria: [
            { id: 'c1', group_id: 'g1', name: 'Crit1', description: '', scoring_mode: 'combined', weight: 50, score_bands: [], adjustment_reason_required: false, sort_order: 1, active: true },
            { id: 'c2', group_id: 'g1', name: 'Crit2', description: '', scoring_mode: 'combined', weight: 50, score_bands: [], adjustment_reason_required: false, sort_order: 2, active: true },
          ],
        }],
      },
      scores: [
        { criterion_id: 'c1', suggested_score: 2, final_score: 4, source_refs: [], evidence_refs: [] },
        { criterion_id: 'c2', suggested_score: 4, source_refs: [], evidence_refs: [] },
      ],
      status: 'submitted',
      revision: 0,
    }

    const summary = getEvaluationScoreSummary(evaluation)
    // c1: final_score=4, c2: fallback to suggested_score=4 → (4*50 + 4*50)/100 = 4
    assert.equal(summary.resolved_total, 4)
  })

  it('getEvaluationScoreSummary hides resolved_total for draft evaluations even when total_score is persisted', () => {
    const evaluation: KpiEvaluation = {
      id: 'eval_summary_draft',
      period_id: 'period_1',
      employee: { id: 'emp_01', store_id: 'store_001', level_code: 'pt1_pc', position_id: 'cashier', employment_status: 'official' },
      snapshot: {
        id: 'snap_1', set_id: 'set_1', version: 1, name: 'Test', source_status: 'published',
        level_codes: ['pt1_pc'], store_ids: ['store_001'], effective_from: '2026-08-01',
        score_scale: [1, 2, 3, 4, 5], created_by: 'hr', created_at: '2026-08-01T00:00:00Z',
        groups: [{
          id: 'g1', name: 'Group', tag: 'revenue', weight: 100, promotion_core: false, sort_order: 1,
          criteria: [
            { id: 'c1', group_id: 'g1', name: 'Crit1', description: '', scoring_mode: 'leader', weight: 100, score_bands: [], adjustment_reason_required: false, sort_order: 1, active: true },
          ],
        }],
      },
      scores: [
        { criterion_id: 'c1', suggested_score: 4, final_score: 5, source_refs: [], evidence_refs: [] },
      ],
      total_score: 4.8,
      status: 'draft',
      revision: 0,
    }

    const summary = getEvaluationScoreSummary(evaluation)
    assert.equal(summary.suggested_total, 4)
    assert.equal(summary.resolved_total, undefined)
  })

  it('getEvaluationScoreSummary hides resolved_total for returned evaluations', () => {
    const evaluation: KpiEvaluation = {
      id: 'eval_summary_returned',
      period_id: 'period_1',
      employee: { id: 'emp_01', store_id: 'store_001', level_code: 'pt1_pc', position_id: 'cashier', employment_status: 'official' },
      snapshot: {
        id: 'snap_1', set_id: 'set_1', version: 1, name: 'Test', source_status: 'published',
        level_codes: ['pt1_pc'], store_ids: ['store_001'], effective_from: '2026-08-01',
        score_scale: [1, 2, 3, 4, 5], created_by: 'hr', created_at: '2026-08-01T00:00:00Z',
        groups: [{
          id: 'g1', name: 'Group', tag: 'revenue', weight: 100, promotion_core: false, sort_order: 1,
          criteria: [
            { id: 'c1', group_id: 'g1', name: 'Crit1', description: '', scoring_mode: 'leader', weight: 100, score_bands: [], adjustment_reason_required: false, sort_order: 1, active: true },
          ],
        }],
      },
      scores: [
        { criterion_id: 'c1', suggested_score: 3, final_score: 4, source_refs: [], evidence_refs: [] },
      ],
      status: 'returned',
      revision: 2,
    }

    const summary = getEvaluationScoreSummary(evaluation)
    assert.equal(summary.suggested_total, 3)
    assert.equal(summary.resolved_total, undefined)
  })

  it('getEvaluationScoreSummary returns undefined for suggested_total when any criterion lacks suggested_score', () => {

    const evaluation: KpiEvaluation = {
      id: 'eval_summary_3',
      period_id: 'period_1',
      employee: { id: 'emp_01', store_id: 'store_001', level_code: 'pt1_pc', position_id: 'cashier', employment_status: 'official' },
      snapshot: {
        id: 'snap_1', set_id: 'set_1', version: 1, name: 'Test', source_status: 'published',
        level_codes: ['pt1_pc'], store_ids: ['store_001'], effective_from: '2026-08-01',
        score_scale: [1, 2, 3, 4, 5], created_by: 'hr', created_at: '2026-08-01T00:00:00Z',
        groups: [{
          id: 'g1', name: 'Group', tag: 'revenue', weight: 100, promotion_core: false, sort_order: 1,
          criteria: [
            { id: 'c1', group_id: 'g1', name: 'Crit1', description: '', scoring_mode: 'leader', weight: 50, score_bands: [], adjustment_reason_required: false, sort_order: 1, active: true },
            { id: 'c2', group_id: 'g1', name: 'Crit2', description: '', scoring_mode: 'leader', weight: 50, score_bands: [], adjustment_reason_required: false, sort_order: 2, active: true },
          ],
        }],
      },
      scores: [
        { criterion_id: 'c1', suggested_score: 4, source_refs: [], evidence_refs: [] },
        { criterion_id: 'c2', source_refs: [], evidence_refs: [] },
      ],
      status: 'draft',
      revision: 0,
    }

    const summary = getEvaluationScoreSummary(evaluation)
    assert.equal(summary.suggested_total, undefined)
  })

  it('getEvaluationScoreSummary preserves pre-computed total_score as resolved_total', () => {

    const evaluation: KpiEvaluation = {
      id: 'eval_summary_4',
      period_id: 'period_1',
      employee: { id: 'emp_01', store_id: 'store_001', level_code: 'pt1_pc', position_id: 'cashier', employment_status: 'official' },
      snapshot: {
        id: 'snap_1', set_id: 'set_1', version: 1, name: 'Test', source_status: 'published',
        level_codes: ['pt1_pc'], store_ids: ['store_001'], effective_from: '2026-08-01',
        score_scale: [1, 2, 3, 4, 5], created_by: 'hr', created_at: '2026-08-01T00:00:00Z',
        groups: [{
          id: 'g1', name: 'Group', tag: 'revenue', weight: 100, promotion_core: false, sort_order: 1,
          criteria: [
            { id: 'c1', group_id: 'g1', name: 'Crit1', description: '', scoring_mode: 'leader', weight: 100, score_bands: [], adjustment_reason_required: false, sort_order: 1, active: true },
          ],
        }],
      },
      scores: [
        { criterion_id: 'c1', suggested_score: 2, final_score: 3, source_refs: [], evidence_refs: [] },
      ],
      total_score: 4.2,
      status: 'published',
      revision: 1,
    }

    const summary = getEvaluationScoreSummary(evaluation)
    assert.equal(summary.resolved_total, 4.2)
  })
})
