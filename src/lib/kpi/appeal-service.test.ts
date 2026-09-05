import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const {
  getMonthlyAppealDeadline,
  canSubmitMonthlyAppeal,
  createMonthlyAppeal,
  createIncidentAppeal,
  decideAppeal,
  decideIncidentAppeal,
  isEvaluationUsableForPromotion,
} = await import('./appeal-service.ts')

describe('appeal-service', () => {
  it('determines if evaluation is usable for promotion based on appeal state', () => {
    assert.equal(isEvaluationUsableForPromotion({ evaluation_status: 'published', appeal_status: 'submitted' }), false)
    assert.equal(isEvaluationUsableForPromotion({ evaluation_status: 'published', appeal_status: 'reviewing' }), false)
    assert.equal(isEvaluationUsableForPromotion({ evaluation_status: 'published', appeal_status: 'rejected' }), true)
    assert.equal(isEvaluationUsableForPromotion({ evaluation_status: 'published', appeal_status: 'approved' }), true)
    assert.equal(isEvaluationUsableForPromotion({ evaluation_status: 'published', appeal_status: undefined }), true)
    assert.equal(isEvaluationUsableForPromotion({ evaluation_status: 'draft', appeal_status: undefined }), false)
  })
  it('accepts monthly appeals before 48 hours and blocks them after the deadline', () => {
    const publishedAt = '2026-08-20T10:00:00.000Z'

    assert.equal(getMonthlyAppealDeadline(publishedAt), '2026-08-22T10:00:00.000Z')
    assert.equal(canSubmitMonthlyAppeal('2026-08-22T09:59:00.000Z', publishedAt), true)
    assert.equal(canSubmitMonthlyAppeal('2026-08-22T10:01:00.000Z', publishedAt), false)
  })

  it('only lets the owner submit and requires reason plus criterion or data reference', () => {
    assert.throws(
      () =>
        createMonthlyAppeal({
          employee_id: 'emp_01',
          evaluation_id: 'eval_emp_01_period_2026_08',
          reason: '',
          evidence_refs: [],
          criterion_ids: [],
          submitted_at: '2026-08-21T08:00:00.000Z',
          published_at: '2026-08-20T10:00:00.000Z',
          requester_id: 'emp_01',
        }),
      /Can ghi ro ly do khiếu nai/
    )

    assert.throws(
      () =>
        createMonthlyAppeal({
          employee_id: 'emp_01',
          evaluation_id: 'eval_emp_01_period_2026_08',
          reason: 'Diem ky luat chua dung vi ca do da co giai trinh',
          evidence_refs: [],
          criterion_ids: [],
          submitted_at: '2026-08-21T08:00:00.000Z',
          published_at: '2026-08-20T10:00:00.000Z',
          requester_id: 'emp_01',
        }),
      /Can it nhat 1 reference/
    )

    assert.throws(
      () =>
        createMonthlyAppeal({
          employee_id: 'emp_01',
          evaluation_id: 'eval_emp_01_period_2026_08',
          reason: 'Toi khong dong y voi cach tru diem ky luat',
          evidence_refs: ['attendance_fix_ticket'],
          criterion_ids: ['discipline_execution'],
          submitted_at: '2026-08-21T08:00:00.000Z',
          published_at: '2026-08-20T10:00:00.000Z',
          requester_id: 'emp_02',
        }),
      /Chi chu ho so moi duoc gui khiếu nai/
    )
  })

  it('creates a valid monthly KPI appeal inside the appeal window', () => {
    const appeal = createMonthlyAppeal({
      employee_id: 'emp_01',
      evaluation_id: 'eval_emp_01_period_2026_08',
      reason: 'Can doi chieu lai nguon POS va muc tru diem ky luat',
      evidence_refs: ['pos_shift_sheet_2026_08_20'],
      criterion_ids: ['revenue_output'],
      submitted_at: '2026-08-21T08:00:00.000Z',
      published_at: '2026-08-20T10:00:00.000Z',
      requester_id: 'emp_01',
    })

    assert.equal(appeal.type, 'monthly_kpi')
    assert.match(appeal.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    assert.equal(appeal.reference_id, 'eval_emp_01_period_2026_08')
    assert.equal(appeal.status, 'submitted')
    assert.equal(appeal.deadline_at, '2026-08-22T10:00:00.000Z')
  })

  it('rejects invalid publication timestamps instead of opening an unlimited appeal window', () => {
    assert.equal(canSubmitMonthlyAppeal('2026-08-22T09:00:00.000Z', ''), false)
    assert.equal(canSubmitMonthlyAppeal('not-a-date', '2026-08-20T10:00:00.000Z'), false)
  })

  it('lets the CEO decide an appeal', () => {
    const appeal = createMonthlyAppeal({
      employee_id: 'emp_01',
      evaluation_id: 'eval_emp_01_period_2026_08',
      reason: 'Can doi chieu lai diem doanh thu',
      evidence_refs: ['pos_sheet'],
      criterion_ids: ['revenue_output'],
      submitted_at: '2026-08-21T08:00:00.000Z',
      published_at: '2026-08-20T10:00:00.000Z',
      requester_id: 'emp_01',
    })

    const decided = decideAppeal(
      appeal,
      {
        result: 'partially_approved',
        note: 'Dong y sua 1 tieu chi',
        score_changes: [{ criterion_id: 'revenue_output', old_score: 3, new_score: 4 }],
      },
      { id: 'ceo_01', role: 'ceo' }
    )

    assert.equal(decided.status, 'partially_approved')
  })

  it('creates an incident appeal inside the 48-hour window and blocks it after the deadline', () => {
    const confirmedAt = '2026-08-20T10:00:00.000Z'

    const appeal = createIncidentAppeal({
      employee_id: 'emp_01',
      incident_id: 'incident_emp_01_202608201000',
      reason: 'Can doi chieu lai camera va bang giao ca',
      evidence_refs: ['camera_ca_1', 'handover_note'],
      submitted_at: '2026-08-22T09:30:00.000Z',
      confirmed_at: confirmedAt,
      requester_id: 'emp_01',
    })

    assert.equal(appeal.type, 'incident')
    assert.equal(appeal.deadline_at, '2026-08-22T10:00:00.000Z')

    assert.throws(
      () =>
        createIncidentAppeal({
          employee_id: 'emp_01',
          incident_id: 'incident_emp_01_202608201000',
          reason: 'Gui muon qua han',
          evidence_refs: ['camera_ca_1'],
          submitted_at: '2026-08-22T10:01:00.000Z',
          confirmed_at: confirmedAt,
          requester_id: 'emp_01',
        }),
      /Da qua han khiáº¿u nai su co 48 gio/
    )
  })

  it('lets the CEO cancel an incident impact and keeps the appeal audit', () => {
    const appeal = createIncidentAppeal({
      employee_id: 'emp_01',
      incident_id: 'incident_emp_01_202608201000',
      reason: 'Su co do leader nhap nham ca',
      evidence_refs: ['camera_ca_1'],
      submitted_at: '2026-08-21T08:00:00.000Z',
      confirmed_at: '2026-08-20T10:00:00.000Z',
      requester_id: 'emp_01',
    })

    const result = decideIncidentAppeal(
      {
        id: 'incident_emp_01_202608201000',
        store_id: 'store_001',
        employee_id: 'emp_01',
        occurred_at: '2026-08-20T09:00:00.000Z',
        source: 'operation',
        status: 'appealed',
        violations: [
          {
            code: 'cash_shortage',
            primary: true,
            independent_behavior: true,
            reason: 'Loi goc',
            evidence_refs: ['camera_ca_1'],
          },
        ],
        description: 'Ket ca thieu tien',
        evidence_refs: ['camera_ca_1'],
      },
      appeal,
      {
        result: 'cancel',
        note: 'Doi chieu lai thay nhap nham nguoi',
      },
      { id: 'ceo_01', role: 'ceo' },
      { manager_accountability_allowed_codes: ['cash_shortage'] }
    )

    assert.equal(result.appeal.status, 'approved')
    assert.equal(result.incident.status, 'cancelled')
    assert.equal(result.impact_override?.promotion_block_months, 0)
  })

  it('blocks leader accountability if the code is not allowed or evidence is missing', () => {
    const appeal = createIncidentAppeal({
      employee_id: 'emp_01',
      incident_id: 'incident_emp_01_202608201000',
      reason: 'Can giam muc phat',
      evidence_refs: ['camera_ca_1'],
      submitted_at: '2026-08-21T08:00:00.000Z',
      confirmed_at: '2026-08-20T10:00:00.000Z',
      requester_id: 'emp_01',
    })

    assert.throws(
      () =>
        decideIncidentAppeal(
          {
            id: 'incident_emp_01_202608201000',
            store_id: 'store_001',
            employee_id: 'emp_01',
            occurred_at: '2026-08-20T09:00:00.000Z',
            source: 'operation',
            status: 'appealed',
            violations: [
              {
                code: 'wrong_topping',
                primary: true,
                independent_behavior: true,
                reason: 'Loi goc',
                evidence_refs: ['camera_ca_1'],
              },
            ],
            description: 'Sai topping',
            evidence_refs: ['camera_ca_1'],
          },
          appeal,
          {
            result: 'adjust_impact',
            note: 'Giu incident nhung doi muc tac dong',
            suggested_score: 3,
            promotion_block_months: 1,
            manager_accountability: {
              proposed: true,
              same_shift: true,
              reason: 'Leader can chia se trach nhiem',
              evidence_refs: [],
            },
          },
          { id: 'ceo_01', role: 'ceo' },
          { manager_accountability_allowed_codes: ['cash_shortage'] }
        ),
      /Incident nay khong duoc phep de xuat lien doi leader/
    )
  })
})
