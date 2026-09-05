import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { createChallenge, recordChallengeCheckIn, extendChallenge, finalizeChallenge, stopChallengeForSeriousIncident } = await import('./challenge-service.ts')

describe('challenge-service', () => {
  it('creates challenge timelines with 1, 2, and 2-3 month durations by route', () => {
    const oneMonth = createChallenge({
      development_case_id: 'dev_pt1_to_pt2',
      employee_id: 'emp_pt1',
      current_level: 'pt1_pc',
      target_level: 'pt2',
      approved_by: 'ceo_01',
      approved_at: '2026-08-22T09:00:00.000Z',
    })
    const twoMonths = createChallenge({
      development_case_id: 'dev_pt2_to_senior',
      employee_id: 'emp_pt2',
      current_level: 'pt2',
      target_level: 'senior',
      approved_by: 'ceo_01',
      approved_at: '2026-08-22T09:00:00.000Z',
    })
    const range = createChallenge({
      development_case_id: 'dev_senior_to_leader',
      employee_id: 'emp_senior',
      current_level: 'senior',
      target_level: 'shift_leader',
      approved_by: 'ceo_01',
      approved_at: '2026-08-22T09:00:00.000Z',
    })

    assert.equal(oneMonth.duration_label, '1')
    assert.equal(twoMonths.duration_label, '2')
    assert.equal(range.duration_label, '2-3')
    assert.deepEqual(oneMonth.required_checkpoints, ['week_2', 'final'])
    assert.deepEqual(twoMonths.required_checkpoints, ['week_2', 'week_4', 'final'])
    assert.deepEqual(range.required_checkpoints, ['week_2', 'week_4', 'final'])
  })

  it('records check-ins and lets the challenge pass after all required checkpoints are completed', () => {
    let challenge = createChallenge({
      development_case_id: 'dev_pass',
      employee_id: 'emp_pt2',
      current_level: 'pt2',
      target_level: 'senior',
      approved_by: 'ceo_01',
      approved_at: '2026-08-22T09:00:00.000Z',
    })

    challenge = recordChallengeCheckIn(challenge, {
      checkpoint: 'week_2',
      actor_id: 'manager_01',
      note: 'Dat muc tieu tuan 2',
      recorded_at: '2026-09-05T09:00:00.000Z',
    })
    challenge = recordChallengeCheckIn(challenge, {
      checkpoint: 'week_4',
      actor_id: 'manager_01',
      note: 'Dat muc tieu tuan 4',
      recorded_at: '2026-09-19T09:00:00.000Z',
    })
    challenge = recordChallengeCheckIn(challenge, {
      checkpoint: 'final',
      actor_id: 'ceo_01',
      note: 'Dat muc tieu cuoi ky',
      recorded_at: '2026-10-22T09:00:00.000Z',
    })

    const finalized = finalizeChallenge(challenge, {
      actor_id: 'ceo_01',
      result: 'passed',
      note: 'Cho bo nhiem',
      recorded_at: '2026-10-22T10:00:00.000Z',
    })

    assert.equal(finalized.status, 'passed')
    assert.equal(finalized.final_decision_note, 'Cho bo nhiem')
  })

  it('allows only one extension and marks the challenge as extended_once', () => {
    const challenge = createChallenge({
      development_case_id: 'dev_extend',
      employee_id: 'emp_senior',
      current_level: 'senior',
      target_level: 'shift_leader',
      approved_by: 'ceo_01',
      approved_at: '2026-08-22T09:00:00.000Z',
    })

    const extended = extendChallenge(challenge, {
      actor_id: 'ceo_01',
      reason: 'Can them 2 tuan kem cap',
      recorded_at: '2026-10-22T09:00:00.000Z',
    })

    assert.equal(extended.status, 'extended_once')
    assert.equal(extended.extension_count, 1)

    assert.throws(
      () =>
        extendChallenge(extended, {
          actor_id: 'ceo_01',
          reason: 'Xin them lan nua',
          recorded_at: '2026-10-25T09:00:00.000Z',
        }),
      /Chi duoc gia han toi da mot lan/
    )
  })

  it('stops immediately for serious incidents and keeps the incident reference', () => {
    const challenge = createChallenge({
      development_case_id: 'dev_incident_stop',
      employee_id: 'emp_senior',
      current_level: 'senior',
      target_level: 'shift_leader',
      approved_by: 'ceo_01',
      approved_at: '2026-08-22T09:00:00.000Z',
    })

    const stopped = stopChallengeForSeriousIncident(challenge, {
      actor_id: 'ceo_01',
      incident_id: 'incident_critical_01',
      note: 'Dung challenge vi su co nghiem trong',
      recorded_at: '2026-09-02T09:00:00.000Z',
    })

    assert.equal(stopped.status, 'stopped_for_serious_incident')
    assert.equal(stopped.stop_incident_id, 'incident_critical_01')
  })

  it('fails the challenge and returns the employee to the old level when final review is not passed', () => {
    let challenge = createChallenge({
      development_case_id: 'dev_fail_back',
      employee_id: 'emp_pt2',
      current_level: 'pt2',
      target_level: 'senior',
      approved_by: 'ceo_01',
      approved_at: '2026-08-22T09:00:00.000Z',
    })

    challenge = recordChallengeCheckIn(challenge, {
      checkpoint: 'week_2',
      actor_id: 'manager_01',
      note: 'Con loi lap lai',
      recorded_at: '2026-09-05T09:00:00.000Z',
    })
    challenge = recordChallengeCheckIn(challenge, {
      checkpoint: 'week_4',
      actor_id: 'manager_01',
      note: 'Tien bo cham',
      recorded_at: '2026-09-19T09:00:00.000Z',
    })
    challenge = recordChallengeCheckIn(challenge, {
      checkpoint: 'final',
      actor_id: 'ceo_01',
      note: 'Khong dat ky vong',
      recorded_at: '2026-10-22T09:00:00.000Z',
    })

    const failed = finalizeChallenge(challenge, {
      actor_id: 'ceo_01',
      result: 'failed',
      note: 'Quay ve cap cu',
      recorded_at: '2026-10-22T10:00:00.000Z',
    })

    assert.equal(failed.status, 'failed')
    assert.equal(failed.return_to_level, 'pt2')
  })
})
