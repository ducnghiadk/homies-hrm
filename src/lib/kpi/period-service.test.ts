import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { DEFAULT_KPI_POLICY } = await import('./default-policy.ts')
const { publishVersion } = await import('./configuration-service.ts')
const { createKpiPeriod, transitionPeriod, requestPeriodReopen, approvePeriodReopen } = await import('./period-service.ts')

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

describe('period-service', () => {
  it('creates a period from a published version and freezes its snapshot', () => {
    const version = createPublishedVersion()
    const period = createKpiPeriod(
      {
        org_id: 'homies',
        store_id: 'store_001',
        month: '2026-08',
        employee_ids: ['emp_01', 'emp_02'],
        opened_by: 'hr_admin_01',
        opened_at: '2026-08-02T08:00:00.000Z',
      },
      version
    )

    version.groups[0].name = 'Da doi ten sau khi mo ky'

    assert.equal(period.status, 'draft')
    assert.equal(period.snapshot.source_status, 'published')
    assert.equal(period.snapshot.groups[0].name, 'Doanh thu')
    assert.equal(period.revision, 0)
  })

  it('allows only the approved period workflow transitions', () => {
    const actor = { id: 'ceo_01', role: 'ceo' as const }
    let period = createKpiPeriod(
      {
        org_id: 'homies',
        store_id: 'store_001',
        month: '2026-08',
        employee_ids: ['emp_01'],
        opened_by: 'hr_admin_01',
        opened_at: '2026-08-02T08:00:00.000Z',
      },
      createPublishedVersion()
    )

    period = transitionPeriod(period, 'collecting', actor)
    period = transitionPeriod(period, 'leader_scoring', actor)
    period = transitionPeriod(period, 'ceo_preapproval', actor)
    period = transitionPeriod(period, 'published', actor)
    period = transitionPeriod(period, 'appeal_window', actor)
    period = transitionPeriod(period, 'locked', actor)

    assert.equal(period.status, 'locked')
    assert.equal(period.locked_at, '2026-08-02T08:00:00.000Z')
  })

  it('rejects invalid jumps and direct edits after lock', () => {
    const actor = { id: 'ceo_01', role: 'ceo' as const }
    const period = createKpiPeriod(
      {
        org_id: 'homies',
        store_id: 'store_001',
        month: '2026-08',
        employee_ids: ['emp_01'],
        opened_by: 'hr_admin_01',
        opened_at: '2026-08-02T08:00:00.000Z',
      },
      createPublishedVersion()
    )

    assert.throws(
      () => transitionPeriod(period, 'published', actor),
      /Khong the chuyen trang thai/
    )

    const locked = {
      ...period,
      status: 'locked' as const,
      locked_at: '2026-08-30T20:00:00.000Z',
      revision: 3,
    }

    assert.throws(
      () => transitionPeriod(locked, 'published', actor),
      /Ky da khoa/
    )
  })

  it('creates a reopen request and lets the ceo approve it back to leader scoring', () => {
    const ceo = { id: 'ceo_01', role: 'ceo' as const }
    const locked = {
      ...createKpiPeriod(
        {
          org_id: 'homies',
          store_id: 'store_001',
          month: '2026-08',
          employee_ids: ['emp_01'],
          opened_by: 'hr_admin_01',
          opened_at: '2026-08-02T08:00:00.000Z',
        },
        createPublishedVersion()
      ),
      status: 'locked' as const,
      locked_at: '2026-08-30T20:00:00.000Z',
      revision: 5,
    }

    const request = requestPeriodReopen(locked, { id: 'hr_admin_01', role: 'hr_admin' }, 'Can bo sung bang chung')
    const reopened = approvePeriodReopen(locked, request, ceo)

    assert.equal(request.status, 'pending')
    assert.equal(request.reason, 'Can bo sung bang chung')
    assert.equal(reopened.status, 'leader_scoring')
    assert.equal(reopened.locked_at, undefined)
    assert.equal(reopened.revision, 6)
  })
})
