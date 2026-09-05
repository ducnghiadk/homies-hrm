import assert from 'node:assert/strict'
import test from 'node:test'
import type { KpiActor } from './types.ts'
import {
  addSecondaryViolation,
  calculateIncidentImpact,
  confirmAttendanceIncident,
  createIncident,
  proposeAttendanceIncident,
} from './incident-service.ts'

const LEADER: KpiActor = {
  id: 'leader_01',
  role: 'shift_leader',
  store_id: 'store_001',
}

test('creates an incident with exactly one primary violation', () => {
  const incident = createIncident({
    store_id: 'store_001',
    employee_id: 'emp_pt1',
    occurred_at: '2026-08-20T09:00:00.000Z',
    source: 'operation',
    primary_violation_code: 'wrong_topping',
    description: 'Lam sai topping 2 ly trong cung 1 ca',
    evidence_refs: ['cam_001', 'photo_001'],
  }, LEADER)

  assert.equal(incident.violations.length, 1)
  assert.equal(incident.violations[0].primary, true)
  assert.equal(incident.violations[0].code, 'wrong_topping')
})

test('rejects duplicate punishment when the secondary violation is only a consequence', () => {
  const incident = createIncident({
    store_id: 'store_001',
    employee_id: 'emp_pt1',
    occurred_at: '2026-08-20T09:00:00.000Z',
    source: 'customer',
    primary_violation_code: 'wrong_topping',
    description: 'Sai topping dan den khach phan nan',
    evidence_refs: ['cam_002'],
  }, LEADER)

  assert.throws(() => addSecondaryViolation(incident, {
    code: 'customer_complaint',
    independent_behavior: false,
    reason: 'Phan nan nay chi la hau qua cua sai topping',
    evidence_refs: ['voice_001'],
  }), /Khong duoc tach loi phu/)
})

test('requires separate reason and evidence for a true secondary violation', () => {
  const incident = createIncident({
    store_id: 'store_001',
    employee_id: 'emp_pt2',
    occurred_at: '2026-08-20T10:00:00.000Z',
    source: 'operation',
    primary_violation_code: 'wrong_topping',
    description: 'Sai topping va co thai do cai nhau voi dong doi',
    evidence_refs: ['cam_003'],
  }, LEADER)

  const updated = addSecondaryViolation(incident, {
    code: 'customer_complaint',
    independent_behavior: true,
    reason: 'Sau loi goc, nhan vien tiep tuc tranh cai va xu ly khach sai quy trinh',
    evidence_refs: ['cam_004'],
  })

  assert.equal(updated.violations.length, 2)
  assert.equal(updated.violations[1].primary, false)
  assert.equal(updated.violations[1].independent_behavior, true)
  assert.deepEqual(updated.violations[1].evidence_refs, ['cam_004'])
})

test('proposes and confirms an attendance incident', () => {
  const proposed = proposeAttendanceIncident({
    store_id: 'store_001',
    employee_id: 'emp_pt2',
    occurred_at: '2026-08-21T01:15:00.000Z',
    attendance_reference_id: 'attendance_001',
    minutes_late: 17,
  })

  assert.equal(proposed.status, 'proposed')
  assert.equal(proposed.violations[0].code, 'attendance_late')

  const confirmed = confirmAttendanceIncident(proposed, LEADER, 'Da doi chieu camera va so cong')
  assert.equal(confirmed.status, 'confirmed')
  assert.match(confirmed.description, /Leader xac nhan/)
})

test('calculates KPI impact and manager accountability from the policy', () => {
  const incident = addSecondaryViolation(createIncident({
    store_id: 'store_001',
    employee_id: 'emp_senior',
    occurred_at: '2026-08-20T11:00:00.000Z',
    source: 'operation',
    primary_violation_code: 'cash_shortage',
    description: 'Thieu tien ket ca va khong ban giao dung',
    evidence_refs: ['cash_001'],
  }, LEADER), {
    code: 'attendance_no_show',
    independent_behavior: true,
    reason: 'Cung ngay co ca bo khong bao truoc',
    evidence_refs: ['attendance_002'],
  })

  const impact = calculateIncidentImpact(incident, {
    criterion_mappings: {
      cash_shortage: 'discipline_execution',
    },
    manager_accountability_allowed_codes: ['cash_shortage'],
  })

  assert.equal(impact.criterion_id, 'discipline_execution')
  assert.equal(impact.suggested_score, 1)
  assert.equal(impact.promotion_block_months, 3)
  assert.equal(impact.manager_accountability_proposed, true)
})
