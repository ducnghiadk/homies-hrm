import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { DEFAULT_KPI_POLICY } from './default-policy.ts'
import { createEmptyKpiDatabase } from './repository.ts'
import type { KpiDatabase, KpiPeriod, KpiSetSnapshot } from './types.ts'

const { buildKpiReportSnapshot } = await import('./report-service.ts')

function createSnapshot(): KpiSetSnapshot {
  return {
    id: 'set_2026_08_v1',
    set_id: 'set_main',
    version: 1,
    name: 'KPI Homies thang 08/2026',
    source_status: 'published',
    level_codes: DEFAULT_KPI_POLICY.levels,
    store_ids: 'all',
    effective_from: '2026-07-01',
    effective_to: '2026-08-31',
    score_scale: DEFAULT_KPI_POLICY.score_scale,
    groups: structuredClone(DEFAULT_KPI_POLICY.groups),
    created_by: 'hr_admin_01',
    created_at: '2026-07-01T08:00:00.000Z',
    published_by: 'ceo_01',
    published_at: '2026-07-01T09:00:00.000Z',
  }
}

function createPeriod(id: string, storeId: string, month: string, employeeIds: string[]): KpiPeriod {
  return {
    id,
    org_id: 'homies',
    store_id: storeId,
    month,
    status: 'published',
    snapshot: createSnapshot(),
    employee_ids: employeeIds,
    opened_by: 'hr_admin_01',
    opened_at: `${month}-01T08:00:00.000Z`,
    published_at: `${month}-28T09:00:00.000Z`,
    revision: 0,
  }
}

function createEvaluation(
  id: string,
  period: KpiPeriod,
  employee: {
    id: string
    store_id: string
    level_code: 'pt1_pc' | 'pt2' | 'senior'
    position_id: string
  },
  scores: {
    revenue: number
    customer_service: number
    operations: number
    discipline: number
  },
  total: number,
  grade: string
) {
  return {
    id,
    period_id: period.id,
    employee: {
      ...employee,
      employment_status: 'official' as const,
    },
    snapshot: period.snapshot,
    scores: [
      {
        criterion_id: 'revenue_output',
        suggested_score: scores.revenue,
        final_score: scores.revenue,
        source_refs: ['source_revenue'],
        evidence_refs: [],
      },
      {
        criterion_id: 'customer_feedback',
        suggested_score: scores.customer_service,
        final_score: scores.customer_service,
        source_refs: ['source_customer'],
        evidence_refs: [],
      },
      {
        criterion_id: 'operations_accuracy',
        suggested_score: scores.operations,
        final_score: scores.operations,
        source_refs: ['source_ops'],
        evidence_refs: [],
      },
      {
        criterion_id: 'discipline_execution',
        suggested_score: scores.discipline,
        final_score: scores.discipline,
        source_refs: ['source_discipline'],
        evidence_refs: [],
      },
    ],
    total_score: total,
    grade_code: grade,
    status: 'published' as const,
    revision: 0,
  }
}

function buildDatabase(): KpiDatabase {
  const db = createEmptyKpiDatabase()

  const julyStore1 = createPeriod('period_2026_07_store_001', 'store_001', '2026-07', ['emp_a', 'emp_b'])
  const augustStore1 = createPeriod('period_2026_08_store_001', 'store_001', '2026-08', ['emp_a', 'emp_b'])
  const augustStore2 = createPeriod('period_2026_08_store_002', 'store_002', '2026-08', ['emp_c'])

  db.revision = 3
  db.periods = [julyStore1, augustStore1, augustStore2]
  db.evaluations = [
    createEvaluation('eval_emp_a_2026_07', julyStore1, {
      id: 'emp_a',
      store_id: 'store_001',
      level_code: 'pt2',
      position_id: 'barista',
    }, {
      revenue: 4,
      customer_service: 4,
      operations: 4,
      discipline: 4,
    }, 4, 'good'),
    createEvaluation('eval_emp_b_2026_07', julyStore1, {
      id: 'emp_b',
      store_id: 'store_001',
      level_code: 'pt1_pc',
      position_id: 'cashier',
    }, {
      revenue: 3,
      customer_service: 3,
      operations: 3,
      discipline: 2,
    }, 2.75, 'warning'),
    createEvaluation('eval_emp_a_2026_08', augustStore1, {
      id: 'emp_a',
      store_id: 'store_001',
      level_code: 'pt2',
      position_id: 'barista',
    }, {
      revenue: 5,
      customer_service: 5,
      operations: 4,
      discipline: 5,
    }, 4.75, 'excellent'),
    createEvaluation('eval_emp_b_2026_08', augustStore1, {
      id: 'emp_b',
      store_id: 'store_001',
      level_code: 'pt1_pc',
      position_id: 'cashier',
    }, {
      revenue: 2,
      customer_service: 2,
      operations: 2,
      discipline: 1,
    }, 1.75, 'critical'),
    createEvaluation('eval_emp_c_2026_08', augustStore2, {
      id: 'emp_c',
      store_id: 'store_002',
      level_code: 'senior',
      position_id: 'senior_barista',
    }, {
      revenue: 4,
      customer_service: 4,
      operations: 5,
      discipline: 4,
    }, 4.25, 'good'),
  ]
  db.incidents = [
    {
      id: 'incident_emp_b_1',
      store_id: 'store_001',
      employee_id: 'emp_b',
      period_id: augustStore1.id,
      occurred_at: '2026-08-18T07:00:00.000Z',
      source: 'operation',
      status: 'finalized',
      violations: [
        {
          code: 'wrong_topping',
          primary: true,
          independent_behavior: true,
          reason: 'Sai topping',
          evidence_refs: ['proof_1'],
        },
      ],
      description: 'Sai topping lan 1',
      evidence_refs: ['proof_1'],
    },
    {
      id: 'incident_emp_b_2',
      store_id: 'store_001',
      employee_id: 'emp_b',
      period_id: augustStore1.id,
      occurred_at: '2026-08-21T10:00:00.000Z',
      source: 'operation',
      status: 'acknowledged',
      violations: [
        {
          code: 'wrong_topping',
          primary: true,
          independent_behavior: true,
          reason: 'Sai topping lap lai',
          evidence_refs: ['proof_2'],
        },
      ],
      description: 'Sai topping lan 2',
      evidence_refs: ['proof_2'],
    },
    {
      id: 'incident_emp_c_1',
      store_id: 'store_002',
      employee_id: 'emp_c',
      period_id: augustStore2.id,
      occurred_at: '2026-08-20T08:00:00.000Z',
      source: 'customer',
      status: 'finalized',
      violations: [
        {
          code: 'customer_complaint',
          primary: true,
          independent_behavior: true,
          reason: 'Khach phan hoi',
          evidence_refs: ['proof_3'],
        },
      ],
      description: 'Khach phan hoi 1 lan',
      evidence_refs: ['proof_3'],
    },
  ]
  db.appeals = [
    {
      id: 'appeal_open_near_due',
      type: 'monthly_kpi',
      employee_id: 'emp_a',
      reference_id: 'eval_emp_a_2026_08',
      reason: 'Xin xem lai 1 tieu chi',
      evidence_refs: ['chat_1'],
      status: 'reviewing',
      submitted_at: '2026-08-29T08:00:00.000Z',
      deadline_at: '2026-08-30T18:00:00.000Z',
    },
    {
      id: 'appeal_open_overdue',
      type: 'incident',
      employee_id: 'emp_b',
      reference_id: 'incident_emp_b_1',
      reason: 'Xin giam muc anh huong',
      evidence_refs: ['chat_2'],
      status: 'submitted',
      submitted_at: '2026-08-25T08:00:00.000Z',
      deadline_at: '2026-08-28T18:00:00.000Z',
    },
    {
      id: 'appeal_resolved',
      type: 'monthly_kpi',
      employee_id: 'emp_c',
      reference_id: 'eval_emp_c_2026_08',
      reason: 'Da duoc xu ly',
      evidence_refs: ['chat_3'],
      status: 'approved',
      submitted_at: '2026-08-20T08:00:00.000Z',
      deadline_at: '2026-08-22T18:00:00.000Z',
    },
  ]
  db.development_cases = [
    {
      id: 'dev_emp_a',
      employee_id: 'emp_a',
      current_level: 'pt2',
      target_level: 'senior',
      status: 'testing',
    },
    {
      id: 'dev_emp_b',
      employee_id: 'emp_b',
      current_level: 'pt1_pc',
      target_level: 'pt2',
      status: 'leader_proposed',
    },
    {
      id: 'dev_emp_c',
      employee_id: 'emp_c',
      current_level: 'senior',
      target_level: 'shift_leader',
      status: 'challenge',
    },
  ]

  return db
}

describe('report-service', () => {
  it('builds a scoped report DTO with macro cards, trend, risks, SLA, recurrence, pipeline, and leaderboard', () => {
    const report = buildKpiReportSnapshot(buildDatabase(), {
      actor: { id: 'hr_admin_01', role: 'hr_admin' },
      month: '2026-08',
      now: '2026-08-30T09:00:00.000Z',
    })

    assert.equal(report.month, '2026-08')
    assert.equal(report.scope.store_ids.length, 2)
    assert.equal(report.macro_cards.length, 4)
    assert.equal(report.macro_cards[0].id, 'average_score')
    assert.equal(report.macro_cards[0].value, '3.58/5')
    assert.equal(report.trend.months.length, 2)
    assert.deepEqual(report.trend.months.map((item: { month: string }) => item.month), ['2026-07', '2026-08'])
    assert.equal(report.trend.stores[0].store_id, 'store_001')
    assert.equal(report.trend.stores[0].risk_count, 1)
    assert.equal(report.trend.groups.find((item: { tag: string }) => item.tag === 'discipline')?.average_score, 3.33)
    assert.equal(report.risk_list.length, 1)
    assert.equal(report.risk_list[0].employee_id, 'emp_b')
    assert.equal(report.risk_list[0].incident_count, 2)
    assert.deepEqual(report.appeal_sla, {
      open_count: 2,
      near_deadline_count: 1,
      overdue_count: 1,
      resolved_count: 1,
    })
    assert.equal(report.incident_recurrence.length, 1)
    assert.equal(report.incident_recurrence[0].employee_id, 'emp_b')
    assert.equal(report.incident_recurrence[0].repeat_count, 2)
    assert.equal(report.promotion_pipeline.total_open, 3)
    assert.equal(report.promotion_pipeline.status_counts.find((item: { status: string }) => item.status === 'testing')?.count, 1)
    assert.equal(report.leaderboard[0].employee_id, 'emp_a')
    assert.equal(report.leaderboard[0].delta_from_previous, 0.75)
    assert.ok(report.insights.some((item: { tone: string }) => item.tone === 'warning'))
  })

  it('limits store manager view to their own store before building the DTO', () => {
    const report = buildKpiReportSnapshot(buildDatabase(), {
      actor: { id: 'manager_001', role: 'store_manager', store_id: 'store_001' },
      month: '2026-08',
      now: '2026-08-30T09:00:00.000Z',
    })

    assert.deepEqual(report.scope.store_ids, ['store_001'])
    assert.equal(report.scope.employee_ids.includes('emp_c'), false)
    assert.equal(report.macro_cards[0].value, '3.25/5')
    assert.equal(report.leaderboard.length, 2)
    assert.equal(report.leaderboard[0].employee_id, 'emp_a')
    assert.equal(report.promotion_pipeline.total_open, 2)
  })
})
