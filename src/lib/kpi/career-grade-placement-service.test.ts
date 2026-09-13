import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildHomiesCareerMapSeed } from './seed.ts'
import {
  buildEmployeeCareerPlacementsFromMap,
  evaluateSkillReadiness,
  placeEmployeeToGrade,
} from './career-grade-placement-service.ts'
import type { EmployeeSkillCertification } from './career-grade-types.ts'

describe('career grade placement service', () => {
  const { map } = buildHomiesCareerMapSeed()

  it('places an employee directly to a specific grade node', () => {
    const placement = placeEmployeeToGrade({
      employee_id: 'emp_01',
      position_id: 'pos_store_employee',
      grade_code: 'c1_pc',
      map,
      effective_from: '2026-08-01',
      certifications: [{
        id: 'cert_1',
        employee_id: 'emp_01',
        skill_code: 'barista',
        status: 'achieved',
        assessed_at: '2026-07-01',
        assessed_by: 'lead_1',
        score: 90,
        standard_version: 1,
      }],
    })

    assert.equal(placement.status, 'placed')
    assert.equal(placement.grade_code, 'c1_pc')
    assert.equal(placement.node_id, 'node_c1_pc')
    assert.equal(placement.unresolved_reason, null)
  })

  it('fails closed when grade evidence is missing', () => {
    const missingSkill = placeEmployeeToGrade({
      employee_id: 'emp_01',
      position_id: 'pos_store_employee',
      grade_code: 'c2',
      map,
      certifications: [],
      decision_id: 'decision_c2',
    })
    assert.equal(missingSkill.status, 'unresolved')
    assert.equal(missingSkill.unresolved_reason, 'missing_skill_certification')

    const missingDecision = placeEmployeeToGrade({
      employee_id: 'emp_01',
      position_id: 'pos_store_employee',
      grade_code: 'c2',
      map,
      certifications: [
        {
          id: 'cert_barista', employee_id: 'emp_01', skill_code: 'barista', status: 'achieved',
          assessed_at: '2026-07-01', assessed_by: 'lead_1', score: 90, standard_version: 1,
        },
        {
          id: 'cert_cashier', employee_id: 'emp_01', skill_code: 'cashier', status: 'achieved',
          assessed_at: '2026-07-01', assessed_by: 'lead_1', score: 90, standard_version: 1,
        },
      ],
    })
    assert.equal(missingDecision.status, 'unresolved')
    assert.equal(missingDecision.unresolved_reason, 'missing_grade_decision')
  })

  it('marks placement unresolved if position/grade node is not in the map', () => {
    const placement = placeEmployeeToGrade({
      employee_id: 'emp_01',
      position_id: 'pos_unknown',
      grade_code: 'c1_pc',
      map,
    })

    assert.equal(placement.status, 'unresolved')
    assert.equal(placement.node_id, null)
    assert.ok(placement.unresolved_reason)
  })

  it('requires explicit grade for shared store employee position and resolves single-node positions', () => {
    const placements = buildEmployeeCareerPlacementsFromMap({
      map,
      employees: [
        // Store employee without grade -> unresolved missing_grade_code
        { id: 'emp_no_grade', position_id: 'pos_store_employee' },
        // Store employee with explicit grade C2 -> placed
        { id: 'emp_c2', position_id: 'pos_store_employee', explicit_grade_code: 'c2' },
        // Shift leader without explicit grade -> auto placed to unique C4 node
        { id: 'emp_leader', position_id: 'pos_shift_leader' },
        // Store manager without explicit grade -> auto placed to unique C5 node
        { id: 'emp_manager', position_id: 'pos_store_manager' },
      ],
      effective_from: '2026-08-01',
    })

    assert.equal(placements[0].status, 'unresolved')
    assert.equal(placements[0].unresolved_reason, 'missing_grade_code')

    assert.equal(placements[1].status, 'unresolved')
    assert.equal(placements[1].unresolved_reason, 'missing_skill_certification')
    assert.equal(placements[2].status, 'unresolved')
    assert.equal(placements[2].unresolved_reason, 'missing_grade_code')
    assert.equal(placements[3].status, 'unresolved')
    assert.equal(placements[3].unresolved_reason, 'missing_grade_code')
  })

  it('evaluates skill readiness correctly for grade requirements', () => {
    const certs: EmployeeSkillCertification[] = [
      {
        id: 'cert_1',
        employee_id: 'emp_01',
        skill_code: 'barista',
        status: 'achieved',
        assessed_at: '2026-07-01',
        assessed_by: 'lead_1',
        score: 90,
        standard_version: 1,
      },
    ]

    // C1-PC requires barista -> ready
    const c1pc = evaluateSkillReadiness({ grade_code: 'c1_pc', certifications: certs })
    assert.equal(c1pc.ready, true)
    assert.deepEqual(c1pc.missing_skill_codes, [])

    // C1-TN requires cashier -> not ready
    const c1tn = evaluateSkillReadiness({ grade_code: 'c1_tn', certifications: certs })
    assert.equal(c1tn.ready, false)
    assert.deepEqual(c1tn.missing_skill_codes, ['cashier'])

    // C2 requires barista + cashier -> missing cashier
    const c2 = evaluateSkillReadiness({ grade_code: 'c2', certifications: certs })
    assert.equal(c2.ready, false)
    assert.deepEqual(c2.missing_skill_codes, ['cashier'])
    assert.deepEqual(c2.achieved_skill_codes, ['barista'])
  })
})
