import { test } from 'node:test'
import assert from 'node:assert/strict'
import { computeCareerKpiStats, monthsBefore } from './kpi.ts'
import { evaluateNextGrade } from './eligibility.ts'
import { getDefaultCareerPathSettings } from './settings.ts'

test('monthsBefore lùi đúng tháng, kẹp ngày cuối tháng', () => {
  assert.equal(monthsBefore('2026-11-26', 3), '2026-08-26')
  assert.equal(monthsBefore('2026-03-31', 1), '2026-02-28')
  assert.equal(monthsBefore('2026-01-15', 2), '2025-11-15')
  assert.equal(monthsBefore('2026-01-15', 0), '')
})

test('đếm đi trễ, quên tan ca, vắng ca, lỗi cá nhân trong khoảng xét', () => {
  const stats = computeCareerKpiStats(
    {
      attendance: [
        { employee_id: 'e1', date: '2026-11-02', is_late: true, late_minutes: 10, status: 'late' },
        { employee_id: 'e1', date: '2026-11-03', status: 'missing_checkout', late_minutes: 0 },
        { employee_id: 'e1', date: '2026-06-01', is_late: true, late_minutes: 30 }, // ngoài khoảng
        { employee_id: 'e1', date: '2026-11-26', is_late: true, late_minutes: 5 }, // hôm nay: chưa tính
        { employee_id: 'e2', date: '2026-11-02', is_late: true, late_minutes: 99 },
      ],
      schedules: [
        { employee_id: 'e1', date: '2026-11-02', status: 'published' },
        { employee_id: 'e1', date: '2026-11-05', status: 'published' }, // vắng
        { employee_id: 'e1', date: '2026-11-06', status: 'published' }, // nghỉ phép đã duyệt
        { employee_id: 'e1', date: '2026-11-07', status: 'draft' },
      ],
      errors: [
        { employee_id: 'e1', log_type: 'personal', points: 2, occurred_at: '2026-11-04T10:00:00', approval_status: 'approved_ceo' },
        { employee_id: 'e1', log_type: 'personal', points: 3, occurred_at: '2026-11-04', approval_status: 'confirmed', locks_personal_bonus: true },
        { employee_id: 'e1', log_type: 'personal', points: 9, occurred_at: '2026-11-04', approval_status: 'pending_ceo' },
        { employee_id: 'e1', log_type: 'operation', points: 9, occurred_at: '2026-11-04', approval_status: 'approved_ceo' },
      ],
      requests: [{ employee_id: 'e1', type: 'leave', status: 'APPROVED', date: '2026-11-06' }],
    },
    'e1',
    { today: '2026-11-26', lookbackMonths: 3 },
  )
  assert.equal(stats.late_count, 1)
  assert.equal(stats.late_minutes, 10)
  assert.equal(stats.missing_checkout_count, 1)
  assert.equal(stats.no_show_count, 1)
  assert.equal(stats.error_points, 5)
  assert.equal(stats.serious_error_count, 1)
})

test('evaluateNextGrade thêm điều kiện KPI khi đã cài số tháng và giới hạn', () => {
  const s = getDefaultCareerPathSettings()
  s.configured = true
  s.kpi.lookback_months = 3
  const g1 = s.grades.find((g) => g.code === 'G1')!
  g1.kpi.max_late_count = 2
  g1.kpi.block_serious_error = true
  const kpi = { from: '', to: '', late_count: 3, late_minutes: 0, no_show_count: 0, missing_checkout_count: 0, error_points: 0, serious_error_count: 0 }
  const r = evaluateNextGrade(s, { grade: 'T0', position: 'cashier', levels: {}, months: 0, hours: 0, kpi })
  assert.deepEqual(r.checks.map((c) => [c.key, c.ok]), [['kpi_late', false], ['kpi_serious', true]])
  assert.equal(r.ready, false)

  s.kpi.lookback_months = 0
  const off = evaluateNextGrade(s, { grade: 'T0', position: 'cashier', levels: {}, months: 0, hours: 0, kpi })
  assert.equal(off.checks.length, 0)
})
