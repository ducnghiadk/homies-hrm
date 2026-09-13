import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { createTestSession, scoreTestSection, finalizeTest, scheduleRetest } = await import('./test-service.ts')

describe('test-service', () => {
  it('passes PT1/PT2 test when total is at least 80 and every section meets the floor', () => {
    let session = createTestSession({
      development_case_id: 'dev_pt1_to_pt2',
      employee_id: 'emp_pt1',
      current_level: 'pt1_pc',
      target_level: 'pt2',
      created_by: 'leader_01',
      created_at: '2026-08-22T09:00:00.000Z',
    })

    session = scoreTestSection(session, {
      section_id: 'product_knowledge',
      score: 82,
      actor_id: 'leader_01',
      evidence_refs: ['rubric_01'],
    })
    session = scoreTestSection(session, {
      section_id: 'operations_execution',
      score: 80,
      actor_id: 'leader_01',
      evidence_refs: ['rubric_02'],
    })
    session = scoreTestSection(session, {
      section_id: 'service_attitude',
      score: 84,
      actor_id: 'leader_01',
      evidence_refs: ['rubric_03'],
    })

    const finalized = finalizeTest(session, {
      actor_id: 'manager_01',
      finalized_at: '2026-08-22T10:00:00.000Z',
    })

    assert.equal(finalized.outcome, 'passed')
    assert.equal(finalized.total_score, 82)
  })

  it('fails PT2/Senior test when one section is below the section floor even if total is 80 or more', () => {
    let session = createTestSession({
      development_case_id: 'dev_pt2_to_senior',
      employee_id: 'emp_pt2',
      current_level: 'pt2',
      target_level: 'senior',
      created_by: 'manager_01',
      created_at: '2026-08-22T09:00:00.000Z',
    })

    session = scoreTestSection(session, {
      section_id: 'product_knowledge',
      score: 92,
      actor_id: 'manager_01',
      evidence_refs: ['rubric_11'],
    })
    session = scoreTestSection(session, {
      section_id: 'operations_execution',
      score: 68,
      actor_id: 'manager_01',
      evidence_refs: ['rubric_12'],
    })
    session = scoreTestSection(session, {
      section_id: 'service_attitude',
      score: 82,
      actor_id: 'manager_01',
      evidence_refs: ['rubric_13'],
    })

    const finalized = finalizeTest(session, {
      actor_id: 'hr_admin_01',
      finalized_at: '2026-08-22T10:00:00.000Z',
    })

    assert.equal(finalized.outcome, 'failed_section_floor')
    assert.equal(finalized.total_score, 80.67)
  })

  it('requires 85 total for Senior/Shift Leader tests', () => {
    let session = createTestSession({
      development_case_id: 'dev_senior_to_leader',
      employee_id: 'emp_senior',
      current_level: 'senior',
      target_level: 'shift_leader',
      created_by: 'area_manager_01',
      created_at: '2026-08-22T09:00:00.000Z',
    })

    session = scoreTestSection(session, {
      section_id: 'leadership_judgement',
      score: 84,
      actor_id: 'area_manager_01',
      evidence_refs: ['rubric_21'],
    })
    session = scoreTestSection(session, {
      section_id: 'operations_control',
      score: 86,
      actor_id: 'area_manager_01',
      evidence_refs: ['rubric_22'],
    })
    session = scoreTestSection(session, {
      section_id: 'coaching_readiness',
      score: 84,
      actor_id: 'area_manager_01',
      evidence_refs: ['rubric_23'],
    })

    const finalized = finalizeTest(session, {
      actor_id: 'ceo_01',
      finalized_at: '2026-08-22T10:00:00.000Z',
    })

    assert.equal(finalized.outcome, 'failed_total')
    assert.equal(finalized.total_score, 84.67)
  })

  it('schedules only one retest and uses 2 weeks for small gaps but 4 weeks for larger gaps', () => {
    let smallGap = createTestSession({
      development_case_id: 'dev_retest_small',
      employee_id: 'emp_pt2',
      current_level: 'pt2',
      target_level: 'senior',
      created_by: 'manager_01',
      created_at: '2026-08-22T09:00:00.000Z',
    })

    smallGap = scoreTestSection(smallGap, {
      section_id: 'product_knowledge',
      score: 80,
      actor_id: 'manager_01',
      evidence_refs: ['small_01'],
    })
    smallGap = scoreTestSection(smallGap, {
      section_id: 'operations_execution',
      score: 78,
      actor_id: 'manager_01',
      evidence_refs: ['small_02'],
    })
    smallGap = scoreTestSection(smallGap, {
      section_id: 'service_attitude',
      score: 79,
      actor_id: 'manager_01',
      evidence_refs: ['small_03'],
    })

    const finalizedSmallGap = finalizeTest(smallGap, {
      actor_id: 'manager_01',
      finalized_at: '2026-08-22T10:00:00.000Z',
    })
    const retestIn2Weeks = scheduleRetest(finalizedSmallGap, {
      actor_id: 'hr_admin_01',
      scheduled_at: '2026-08-22T11:00:00.000Z',
    })

    assert.equal(retestIn2Weeks.retest_attempts, 1)
    assert.equal(retestIn2Weeks.retest_scheduled_for, '2026-09-05T11:00:00.000Z')

    assert.throws(
      () =>
        scheduleRetest(retestIn2Weeks, {
          actor_id: 'hr_admin_01',
          scheduled_at: '2026-08-23T11:00:00.000Z',
        }),
      /Chi duoc test lai toi da mot lan/
    )

    let largeGap = createTestSession({
      development_case_id: 'dev_retest_large',
      employee_id: 'emp_senior',
      current_level: 'senior',
      target_level: 'shift_leader',
      created_by: 'area_manager_01',
      created_at: '2026-08-22T09:00:00.000Z',
    })

    largeGap = scoreTestSection(largeGap, {
      section_id: 'leadership_judgement',
      score: 70,
      actor_id: 'area_manager_01',
      evidence_refs: ['large_01'],
    })
    largeGap = scoreTestSection(largeGap, {
      section_id: 'operations_control',
      score: 72,
      actor_id: 'area_manager_01',
      evidence_refs: ['large_02'],
    })
    largeGap = scoreTestSection(largeGap, {
      section_id: 'coaching_readiness',
      score: 74,
      actor_id: 'area_manager_01',
      evidence_refs: ['large_03'],
    })

    const finalizedLargeGap = finalizeTest(largeGap, {
      actor_id: 'ceo_01',
      finalized_at: '2026-08-22T10:00:00.000Z',
    })
    const retestIn4Weeks = scheduleRetest(finalizedLargeGap, {
      actor_id: 'hr_admin_01',
      scheduled_at: '2026-08-22T11:00:00.000Z',
    })

    assert.equal(retestIn4Weeks.retest_scheduled_for, '2026-09-19T11:00:00.000Z')
  })
})
