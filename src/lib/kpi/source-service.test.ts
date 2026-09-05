import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { KpiPeriod } from './types'

const { DEFAULT_KPI_POLICY } = await import('./default-policy.ts')
const { publishVersion } = await import('./configuration-service.ts')
const { createKpiSourceService, confirmManualPosSource } = await import('./source-service.ts')

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
    status: 'draft',
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

describe('source-service', () => {
  it('collects attendance hours, marks manual POS as proposed, and leaves missing data as missing', () => {
    const service = createKpiSourceService({
      attendance_hours: {
        emp_01: {
          value: 92,
          captured_at: '2026-08-30T21:00:00.000Z',
          evidence_refs: ['attendance_aug_2026_emp_01'],
        },
      },
      source_records: [
        {
          employee_id: 'emp_01',
          key: 'pos.revenue_shift_index',
          status: 'proposed',
          value: 88,
          source_label: 'POS nhap tay',
          captured_at: '2026-08-30T22:00:00.000Z',
          captured_by: 'leader_01',
          evidence_refs: ['pos_sheet_aug_2026'],
        },
      ],
    })

    const result = service.collectEmployeeSources('emp_01', createPeriod(), createPeriod().snapshot)

    const attendance = result.find((item: { key: string }) => item.key === 'attendance.worked_hours')
    const posRevenue = result.find((item: { key: string }) => item.key === 'pos.revenue_shift_index')
    const customerService = result.find((item: { key: string }) => item.key === 'service.customer_experience_index')

    assert.equal(attendance?.status, 'ready')
    assert.equal(attendance?.value, 92)
    assert.equal(posRevenue?.status, 'proposed')
    assert.equal(posRevenue?.captured_by, 'leader_01')
    assert.equal(customerService?.status, 'missing')
    assert.equal(customerService?.value, undefined)
  })

  it('confirms a manual POS source after leader input', () => {
    const confirmed = confirmManualPosSource(
      {
        key: 'pos.revenue_shift_index',
        status: 'proposed',
        value: 90,
        source_label: 'POS nhap tay',
        captured_at: '2026-08-30T22:00:00.000Z',
        captured_by: 'leader_01',
        evidence_refs: ['pos_sheet_aug_2026'],
      },
      {
        actor_id: 'admin_01',
        confirmed_at: '2026-08-31T07:00:00.000Z',
        evidence_refs: ['confirm_note_01'],
      }
    )

    assert.equal(confirmed.status, 'confirmed')
    assert.equal(confirmed.captured_by, 'leader_01')
    assert.deepEqual(confirmed.evidence_refs, ['pos_sheet_aug_2026', 'confirm_note_01'])
  })

  it('rejects confirming a source that is not waiting for confirmation', () => {
    assert.throws(
      () =>
        confirmManualPosSource(
          {
            key: 'pos.revenue_shift_index',
            status: 'ready',
            value: 90,
            source_label: 'POS nhap tay',
            captured_at: '2026-08-30T22:00:00.000Z',
            evidence_refs: [],
          },
          {
            actor_id: 'admin_01',
            confirmed_at: '2026-08-31T07:00:00.000Z',
            evidence_refs: [],
          }
        ),
      /Chi duoc xac nhan nguon dang cho/
    )
  })

  it('only turns finalized incident records into source data and ignores proposed or appealed incidents', () => {
    const service = createKpiSourceService({
      incidents: [
        {
          id: 'incident_final',
          store_id: 'store_001',
          employee_id: 'emp_01',
          period_id: 'period_store_001_2026-08',
          occurred_at: '2026-08-10T09:00:00.000Z',
          source: 'operation',
          status: 'finalized',
          violations: [
            {
              code: 'cash_shortage',
              primary: true,
              independent_behavior: true,
              reason: 'Loi goc',
              evidence_refs: ['cash_cam'],
            },
          ],
          description: 'Thieu tien ket ca',
          evidence_refs: ['cash_cam'],
        },
        {
          id: 'incident_proposed',
          store_id: 'store_001',
          employee_id: 'emp_01',
          period_id: 'period_store_001_2026-08',
          occurred_at: '2026-08-11T09:00:00.000Z',
          source: 'operation',
          status: 'proposed',
          violations: [
            {
              code: 'wrong_topping',
              primary: true,
              independent_behavior: true,
              reason: 'Loi goc',
              evidence_refs: ['cam_1'],
            },
          ],
          description: 'Sai topping',
          evidence_refs: ['cam_1'],
        },
        {
          id: 'incident_appealed',
          store_id: 'store_001',
          employee_id: 'emp_01',
          period_id: 'period_store_001_2026-08',
          occurred_at: '2026-08-12T09:00:00.000Z',
          source: 'operation',
          status: 'appealed',
          violations: [
            {
              code: 'customer_complaint',
              primary: true,
              independent_behavior: true,
              reason: 'Loi goc',
              evidence_refs: ['voice_1'],
            },
          ],
          description: 'Khieu nai dang mo',
          evidence_refs: ['voice_1'],
        },
      ],
      incident_policy: {
        criterion_mappings: {
          cash_shortage: 'discipline_execution',
          wrong_topping: 'operations_accuracy',
          customer_complaint: 'customer_feedback',
        },
        manager_accountability_allowed_codes: ['cash_shortage'],
      },
    })

    const result = service.collectEmployeeSources('emp_01', createPeriod(), createPeriod().snapshot)
    const discipline = result.find((item: { key: string }) => item.key === 'discipline.execution_index')
    const operations = result.find((item: { key: string }) => item.key === 'operations.compliance_index')
    const customer = result.find((item: { key: string }) => item.key === 'service.customer_experience_index')

    assert.equal(discipline?.status, 'ready')
    assert.match(discipline?.source_label ?? '', /Incident/)
    assert.equal(operations?.status, 'missing')
    assert.equal(customer?.status, 'missing')
  })
})
