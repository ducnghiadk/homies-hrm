import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildLegacyPositionMapping,
  deletePositionWithGuard,
  getEmployeesUsingPosition,
  getPositionPresentation,
  linkPositionsToDepartments,
} from './master-data-adapter.ts'

describe('master data position deletion', () => {
  it('blocks deletion when employees still use the position', async () => {
    let deleteCalls = 0
    const result = await deletePositionWithGuard('position-1', {
      async countEmployeesByPosition() { return 3 },
      async deletePosition() { deleteCalls += 1 },
    })

    assert.deepEqual(result, { deleted: false, employee_count: 3 })
    assert.equal(deleteCalls, 0)
  })

  it('deletes the database row when the position is unused', async () => {
    const deletedIds: string[] = []
    const result = await deletePositionWithGuard('position-2', {
      async countEmployeesByPosition() { return 0 },
      async deletePosition(id) { deletedIds.push(id) },
    })

    assert.deepEqual(result, { deleted: true, employee_count: 0 })
    assert.deepEqual(deletedIds, ['position-2'])
  })

  it('surfaces database deletion errors instead of reporting success', async () => {
    await assert.rejects(
      () => deletePositionWithGuard('position-3', {
        async countEmployeesByPosition() { return 0 },
        async deletePosition() { throw new Error('RLS denied') },
      }),
      /RLS denied/
    )
  })

  it('finds employees using a duplicated position as default or assignable title', () => {
    const employees = [
      { id: 'emp-1', full_name: 'An', position_id: 'pos-001', secondary_position_ids: [] },
      { id: 'emp-2', full_name: 'Binh', position_id: 'pos_store_employee', secondary_position_ids: ['pos-001'] },
      { id: 'emp-3', full_name: 'Chi', position_id: 'pos_store_employee', secondary_position_ids: ['pos_shift_leader'] },
    ]

    const users = getEmployeesUsingPosition(employees, 'POS-001')

    assert.deepEqual(users.map(employee => employee.id), ['emp-1', 'emp-2'])
  })
})

describe('master data career presentation', () => {
  it('maps store roles to the Homies career path', () => {
    assert.deepEqual(getPositionPresentation({
      id: 'pos_store_employee', name: 'Nhân viên cửa hàng', department_id: 'dept-001', level: 1, base_salary: 5500000, pay_type: 'hourly',
    }), {
      group: 'store_operations', badge: 'Lộ trình năng lực', career_path: ['c1_pc', 'c1_tn', 'c2', 'c3'], legacy: false, canonical_position_id: 'pos_store_employee',
    })
    assert.deepEqual(getPositionPresentation({
      id: 'pos_shift_leader', name: 'Trưởng ca', department_id: 'dept-004', level: 2, base_salary: 8000000, pay_type: 'hourly',
    }).career_path, ['c4'])
    assert.deepEqual(getPositionPresentation({
      id: 'pos_store_manager', name: 'Quản lý cửa hàng', department_id: 'dept-004', level: 3, base_salary: 12000000, pay_type: 'monthly',
    }).career_path, ['c5'])
  })

  it('marks legacy titles for safe preview without mutating data', () => {
    const positions = [
      { id: 'legacy-pc', name: 'Pha chế', department_id: 'dept-001', level: 1, base_salary: 5000000, pay_type: 'hourly' as const },
      { id: 'legacy-l10', name: 'L10', department_id: 'dept-001', level: 10, base_salary: 9000000, pay_type: 'monthly' as const },
    ]
    const preview = buildLegacyPositionMapping(positions, [{ position_id: 'legacy-pc' }])
    assert.equal(preview.length, 2)
    assert.equal(preview[0].status, 'needs_confirmation')
    assert.equal(preview[0].target_position_id, 'pos_store_employee')
    assert.equal(preview[1].status, 'unused')
    assert.equal(positions.length, 2)
  })
})

describe('master data position-department linkage', () => {
  it('repairs legacy position codes into real department ids without mutating input', () => {
    const positions = [
      { id: 'POS-001', name: 'Pha chế', department_id: 'POS-001', level: 1, base_salary: 5000000, pay_type: 'hourly' as const },
      { id: 'POS-005', name: 'Ban giám đốc', department_id: 'POS-005', level: 5, base_salary: 25000000, pay_type: 'monthly' as const },
    ]
    const departments = [
      { id: 'dept-002', code: 'DEPT-002', name: 'Vận hành cửa hàng', store_id: 'all', head_count: 0 },
      { id: 'dept-004', code: 'DEPT-004', name: 'Khối quản lý', store_id: 'all', head_count: 0 },
    ]

    const linked = linkPositionsToDepartments(positions, departments)
    assert.deepEqual(linked.map(position => position.department_id), ['dept-002', 'dept-004'])
    assert.deepEqual(positions.map(position => position.department_id), ['POS-001', 'POS-005'])
  })

  it('links all 9 Homies standard positions into the 2 operational and management divisions', () => {
    const positions = [
      { id: 'pos-004', name: 'Trưởng ca', department_id: '', level: 2, base_salary: 7000000, pay_type: 'hourly' as const },
      { id: 'pos-002', name: 'Thu ngân', department_id: '', level: 1, base_salary: 5000000, pay_type: 'hourly' as const },
      { id: 'pos-001', name: 'Pha chế', department_id: '', level: 1, base_salary: 5500000, pay_type: 'hourly' as const },
      { id: 'pos-007', name: 'Nhân viên', department_id: '', level: 1, base_salary: 5000000, pay_type: 'hourly' as const },
      { id: 'pos-005', name: 'Ban giám đốc', department_id: '', level: 10, base_salary: 25000000, pay_type: 'monthly' as const },
      { id: 'pos-008', name: 'Chủ thương hiệu', department_id: '', level: 10, base_salary: 25000000, pay_type: 'monthly' as const },
      { id: 'pos-010', name: 'Quản lý vùng', department_id: '', level: 4, base_salary: 18000000, pay_type: 'monthly' as const },
      { id: 'pos-009', name: 'Quản trị HR', department_id: '', level: 4, base_salary: 15000000, pay_type: 'monthly' as const },
      { id: 'pos-006', name: 'Quản lý điểm bán hàng', department_id: '', level: 3, base_salary: 12000000, pay_type: 'monthly' as const },
    ]
    const departments = [
      { id: 'dept-002', code: 'DEPT-002', name: 'Vận Hành Cửa Hàng', store_id: 'all', head_count: 0 },
      { id: 'dept-004', code: 'DEPT-004', name: 'Khối Quản lý', store_id: 'all', head_count: 0 },
    ]

    const linked = linkPositionsToDepartments(positions, departments)

    // Store operations division
    const opsPositions = linked.filter(p => p.department_id === 'dept-002')
    assert.deepEqual(opsPositions.map(p => p.name), ['Trưởng ca', 'Thu ngân', 'Pha chế', 'Nhân viên'])

    // Management division
    const mgmtPositions = linked.filter(p => p.department_id === 'dept-004')
    assert.deepEqual(mgmtPositions.map(p => p.name), [
      'Ban giám đốc',
      'Chủ thương hiệu',
      'Quản lý vùng',
      'Quản trị HR',
      'Quản lý điểm bán hàng',
    ])
  })
})
