import test from 'node:test'
import assert from 'node:assert/strict'
import { getDefaultCareerPathSettings, normalizeCareerPathSettings } from './settings.ts'
import { applyPlaybookV7Suggestion } from './settings-suggestion.ts'
import type { CareerGradeHistoryEntry, CareerPlacement } from './placement.ts'
import { buildPaySegments, computeCareerPay, cumulativeHourlyBonus } from './pay.ts'

const settings = { ...applyPlaybookV7Suggestion(getDefaultCareerPathSettings()), configured: true }
const placement: CareerPlacement = {
  employee_id: 'e1', primary_position: 'cashier', grade_code: 'G3', effective_date: '2026-11-16',
  carried_hours: 0, entry_assessment: 'confirmed', note: '', updated_at: '', updated_by: '',
}
const h = (to: CareerGradeHistoryEntry['to_grade'], date: string, at: string): CareerGradeHistoryEntry => ({
  id: `${to}-${date}`, employee_id: 'e1', kind: 'promotion', from_grade: null, to_grade: to, from_position: null,
  to_position: 'cashier', effective_date: date, reason: '', decided_by: '', decided_by_name: '', created_at: at,
})

test('mức cộng/giờ cộng dồn theo bậc và liên kết bảng lương mặc định tắt', () => {
  assert.equal(cumulativeHourlyBonus(settings, 'G1'), 0)
  assert.equal(cumulativeHourlyBonus(settings, 'G2'), 1500)
  assert.equal(cumulativeHourlyBonus(settings, 'G4'), 5000)
  assert.equal(normalizeCareerPathSettings({ version: 2 } as never).payroll_link_enabled, false)
})

test('nâng bậc giữa kỳ chia thành 2 đoạn và tính giờ theo ngày làm', () => {
  const history = [h('G2', '2026-09-01', '1'), h('G3', '2026-11-16', '2')]
  const segs = buildPaySegments(settings, placement, history, '2026-11-01', '2026-11-30')
  assert.deepEqual(segs.map((s) => [s.grade, s.from, s.to]), [['G2', '2026-11-01', '2026-11-15'], ['G3', '2026-11-16', '2026-11-30']])
  const plan = { employee_id: 'e1', ft_pay_method: 'fixed_monthly' as const, segments: segs }
  const pt = computeCareerPay(plan, { isPartTime: true, periodStart: '2026-11-01', periodEnd: '2026-11-30', workedHours: [{ date: '2026-11-10', hours: 10 }, { date: '2026-11-20', hours: 4 }] })
  assert.deepEqual(pt.map((l) => l.amount), [15000, 14000])
  const ft = computeCareerPay(plan, { isPartTime: false, periodStart: '2026-11-01', periodEnd: '2026-11-30', workedHours: [] })
  assert.deepEqual(ft.map((l) => l.amount), [157500, 367500])
})

test('chưa được xếp bậc trước kỳ thì không cộng; G1 không cộng', () => {
  const segs = buildPaySegments(settings, { ...placement, grade_code: 'G1', effective_date: '2026-12-05' }, [], '2026-11-01', '2026-11-30')
  assert.equal(segs.length, 0)
  const g1 = buildPaySegments(settings, { ...placement, grade_code: 'G1', effective_date: '2026-10-01' }, [], '2026-11-01', '2026-11-30')
  const lines = computeCareerPay({ employee_id: 'e1', ft_pay_method: 'hourly_x_hours', segments: g1 }, { isPartTime: false, periodStart: '2026-11-01', periodEnd: '2026-11-30', workedHours: [{ date: '2026-11-02', hours: 8 }] })
  assert.equal(lines.length, 0)
})

test('Full-time tính trọn kỳ theo bậc cuối kỳ và tiền cộng không tính thuế theo Cài đặt', () => {
  const history = [h('G2', '2026-09-01', '1'), h('G3', '2026-11-16', '2')]
  const segs = buildPaySegments(settings, placement, history, '2026-11-01', '2026-11-30')
  const plan = { employee_id: 'e1', ft_pay_method: 'fixed_monthly' as const, ft_mid_month: 'grade_at_period_end' as const, taxable: false, segments: segs }
  const ft = computeCareerPay(plan, { isPartTime: false, periodStart: '2026-11-01', periodEnd: '2026-11-30', workedHours: [] })
  assert.deepEqual(ft.map((l) => l.amount), [735000])
  assert.equal(ft[0].tax_exempt, true)
})
