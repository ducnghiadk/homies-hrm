import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  buildCareerGradeMigrationPreview,
  migrateLegacyEmployeeGrade,
  migrateLegacyEmployeesBatch,
} from './career-grade-migration-service.ts'

describe('career grade migration service', () => {
  it('maps legacy barista to C1-PC and cashier to C1-TN', () => {
    const pc = migrateLegacyEmployeeGrade({
      id: 'emp_1',
      name: 'Nguyen Van A',
      chuyen_mon: 'pha_che',
    })
    assert.equal(pc.grade_code, 'c1_pc')
    assert.deepEqual(pc.inferred_skills, ['barista'])

    const tn = migrateLegacyEmployeeGrade({
      id: 'emp_2',
      name: 'Tran Thi B',
      chuyen_mon: 'thu_ngan',
    })
    assert.equal(tn.grade_code, 'c1_tn')
    assert.deepEqual(tn.inferred_skills, ['cashier'])
  })

  it('maps explicit multiskill evidence to C2 but does not trust a level label alone', () => {
    const dual = migrateLegacyEmployeeGrade({
      id: 'emp_3',
      name: 'Le Van C',
      chuyen_mon: 'ca_hai',
    })
    assert.equal(dual.grade_code, 'c2')
    assert.deepEqual(dual.inferred_skills, ['barista', 'cashier'])

    const lvl2 = migrateLegacyEmployeeGrade({
      id: 'emp_4',
      name: 'Pham Thi D',
      chuyen_mon: 'pha_che',
      level: 2,
    })
    assert.equal(lvl2.grade_code, null)
    assert.equal(lvl2.suggested_grade_code, 'c2')
    assert.equal(lvl2.status, 'needs_confirmation')
  })

  it('suggests management grades from legacy titles but requires confirmation', () => {
    const leader = migrateLegacyEmployeeGrade({
      id: 'emp_5',
      name: 'Hoang Van E',
      chuc_vu: 'Trưởng ca',
    })
    assert.equal(leader.grade_code, null)
    assert.equal(leader.suggested_grade_code, 'c4')
    assert.equal(leader.status, 'needs_confirmation')
    assert.equal(leader.position_id, 'pos_shift_leader')

    const manager = migrateLegacyEmployeeGrade({
      id: 'emp_6',
      name: 'Vo Thi F',
      chuc_vu: 'Quản lý cửa hàng',
    })
    assert.equal(manager.grade_code, null)
    assert.equal(manager.suggested_grade_code, 'c5')
    assert.equal(manager.status, 'needs_confirmation')
    assert.equal(manager.position_id, 'pos_store_manager')
  })

  it('processes batch of legacy employees correctly', () => {
    const batch = migrateLegacyEmployeesBatch([
      { id: '1', name: 'A', chuyen_mon: 'pha_che' },
      { id: '2', name: 'B', chuc_vu: 'Trưởng ca' },
    ])
    assert.equal(batch['1'].grade_code, 'c1_pc')
    assert.equal(batch['2'].suggested_grade_code, 'c4')
    assert.equal(batch['2'].status, 'needs_confirmation')
  })

  it('keeps employees without skill evidence unresolved for HR confirmation', () => {
    const result = migrateLegacyEmployeeGrade({ id: 'emp_unknown', name: 'Chua ro tram' })

    assert.equal(result.grade_code, null)
    assert.equal(result.status, 'needs_confirmation')
    assert.deepEqual(result.inferred_skills, [])
  })

  it('requires HR confirmation when a legacy title only suggests a C1 branch', () => {
    const input = {
      employees: [{ id: 'emp_legacy', name: 'Nhan vien cu', chuc_vu: 'Thu ngân' }],
      certifications: [],
      decisions: [],
    }
    const preview = buildCareerGradeMigrationPreview(input)

    assert.equal(preview.items[0].status, 'needs_confirmation')
    assert.equal(preview.items[0].suggested_grade_code, 'c1_tn')
    assert.equal(preview.summary.ready_to_apply, 0)
    assert.equal(preview.checksum, buildCareerGradeMigrationPreview(input).checksum)
  })
})
