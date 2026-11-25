import test from 'node:test'
import assert from 'node:assert/strict'
import { validateWeekForPublish, type PublishItem } from './publish-validator.ts'

const it = (employee_id: string, date: string, startMin: number, endMin: number, shift_id = `s-${startMin}`): PublishItem => ({
  employee_id, employee_name: employee_id, date, shift_id, startMin, endMin,
})

test('chặn nhân viên đã nghỉ và ca trùng giờ', () => {
  const issues = validateWeekForPublish(
    [it('a', '2026-11-30', 510, 720), it('a', '2026-11-30', 690, 1020), it('b', '2026-11-30', 510, 720)],
    { inactiveEmployeeIds: ['b'] }
  )
  assert.ok(issues.some((i) => i.code === 'overlap' && i.level === 'block' && i.employee_id === 'a'))
  assert.ok(issues.some((i) => i.code === 'inactive_employee' && i.employee_id === 'b'))
})

test('ca gãy không trùng giờ thì hợp lệ', () => {
  const issues = validateWeekForPublish([it('a', '2026-11-30', 510, 720), it('a', '2026-11-30', 1020, 1320)])
  assert.equal(issues.length, 0)
})

test('trùng giờ với ca ở chi nhánh khác', () => {
  const issues = validateWeekForPublish([it('a', '2026-11-30', 510, 720)], { otherItems: [it('a', '2026-11-30', 600, 900, 'x')] })
  assert.equal(issues[0]?.code, 'overlap')
})

test('quy tắc giờ/tuần và đóng-mở quán', () => {
  const rules = [
    { rule_key: 'max_weekly_hours_block', warning_value: 48, block_value: 10, warning_level: 'block', is_active: true },
    { rule_key: 'clopening', warning_value: 11, block_value: 6, warning_level: 'warning', is_active: true },
  ]
  const issues = validateWeekForPublish([it('a', '2026-11-30', 1020, 1320), it('a', '2026-12-01', 510, 1020)], { rules })
  assert.ok(issues.some((i) => i.code === 'max_weekly_hours' && i.level === 'block'))
  assert.ok(issues.some((i) => i.code === 'clopening' && i.level === 'warning'))
})
