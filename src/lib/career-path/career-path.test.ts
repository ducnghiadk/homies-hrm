import test from 'node:test'
import assert from 'node:assert/strict'
import {
  getDefaultCareerPathSettings,
  normalizeCareerPathSettings,
  validateCareerPathSettings,
} from './settings.ts'
import { applyPlaybookV7Suggestion } from './settings-suggestion.ts'
import { applyPlacement, type CareerGradeHistoryEntry, type CareerPlacement } from './placement.ts'

const suggested = () => ({ ...applyPlaybookV7Suggestion(getDefaultCareerPathSettings()), configured: true })
const actor = { id: 'emp-hr', name: 'HR' }
const now = new Date('2026-11-25T03:00:00.000Z')
let n = 0
const makeId = () => `h-${++n}`

test('mặc định để trống mọi con số và chưa cài đặt', () => {
  const s = getDefaultCareerPathSettings()
  assert.deepEqual(validateCareerPathSettings(s), [])
  assert.equal(s.configured, false)
  assert.deepEqual(s.grades.map((g) => g.min_hours), [0, 0, 0, 0, 0])
  assert.deepEqual(s.grades.map((g) => g.hourly_step_vnd), [0, 0, 0, 0, 0])
  assert.equal(s.common_pass_level, 0)
  assert.equal(s.approval.respond_within_working_days, 0)
  assert.equal(s.rules.reason_min_chars, 0)
  assert.ok(s.skills.length > 0, 'danh mục kỹ năng (chữ) vẫn có sẵn')
})

test('nút gợi ý điền đúng số Playbook V7 và hợp lệ', () => {
  const s = suggested()
  assert.deepEqual(validateCareerPathSettings(s), [])
  assert.deepEqual(s.grades.map((g) => g.code), ['T0', 'G1', 'G2', 'G3', 'G4'])
  assert.deepEqual(s.grades.map((g) => g.min_hours), [0, 120, 240, 480, 720])
  assert.deepEqual(s.grades.map((g) => g.hourly_step_vnd), [0, 0, 1500, 2000, 1500])
  assert.equal(s.ft_pay_method, 'fixed_monthly')
  assert.equal(s.approval.require_different_approver, true)
})

test('chặn số giờ bậc sau thấp hơn bậc trước và mức kỹ năng ngoài 0-3', () => {
  const s = suggested()
  s.grades[3].min_hours = 100
  s.grades[2].requirement.main_min_level = 5
  const errors = validateCareerPathSettings(s)
  assert.ok(errors.some((e) => e.includes('G3') && e.includes('số giờ')))
  assert.ok(errors.some((e) => e.includes('G2') && e.includes('0 đến 3')))
})

test('chặn khi một vị trí không còn kỹ năng chính', () => {
  const s = getDefaultCareerPathSettings()
  s.skills = s.skills.map((sk) => (sk.position === 'cashier' && sk.group === 'core' ? { ...sk, active: false } : sk))
  assert.ok(validateCareerPathSettings(s).some((e) => e.includes('Thu ngân')))
})

test('dữ liệu cũ thiếu trường vẫn đọc được', () => {
  const s = normalizeCareerPathSettings({ version: 3, grades: [{ code: 'G2', min_hours: 300 } as never] })
  assert.equal(s.version, 3)
  assert.equal(s.grades.find((g) => g.code === 'G2')!.min_hours, 300)
  assert.equal(s.grades.find((g) => g.code === 'G2')!.hourly_step_vnd, 0)
  assert.equal(s.grades.length, 5)
  assert.equal(s.configured, false)
  assert.equal(normalizeCareerPathSettings({ updated_at: '2026-11-25T00:00:00Z' }).configured, true, 'cài đặt đã lưu trước đây coi như đã cài đặt')
  assert.equal(s.rules.months_from, 'hire_date')
})

test('xếp bậc lần đầu ghi lịch sử "initial" không cần lý do', () => {
  const r = applyPlacement([], [], { employee_id: 'e1', primary_position: 'barista', grade_code: 'G2', effective_date: '2026-11-01', carried_hours: 300 }, actor, now, makeId)
  assert.equal(r.ok, true)
  if (!r.ok) return
  assert.equal(r.placements.length, 1)
  assert.equal(r.placement.entry_assessment, 'pending')
  assert.equal(r.entry?.kind, 'initial')
  assert.equal(r.entry?.from_grade, null)
})

test('đổi bậc sau đó bắt buộc lý do và giữ lịch sử cũ', () => {
  const first = applyPlacement([], [], { employee_id: 'e1', primary_position: 'barista', grade_code: 'G1', effective_date: '2026-11-01' }, actor, now, makeId)
  assert.ok(first.ok)
  if (!first.ok) return
  const noReason = applyPlacement(first.placements, first.history, { employee_id: 'e1', primary_position: 'barista', grade_code: 'G2', effective_date: '2026-11-20' }, actor, now, makeId)
  assert.equal(noReason.ok, false)
  const ok = applyPlacement(first.placements, first.history, { employee_id: 'e1', primary_position: 'barista', grade_code: 'G2', effective_date: '2026-11-20', reason: 'Xếp sai lúc đầu' }, actor, now, makeId)
  assert.ok(ok.ok)
  if (!ok.ok) return
  assert.equal(ok.history.length, 2)
  assert.equal(ok.entry?.kind, 'correction')
  assert.equal(ok.entry?.from_grade, 'G1')
  assert.equal(ok.placement.effective_date, '2026-11-20')
})

test('chỉ sửa ghi chú không tạo lịch sử và giữ ngày hiệu lực', () => {
  const placements: CareerPlacement[] = [{ employee_id: 'e1', primary_position: 'cashier', grade_code: 'G1', effective_date: '2026-10-01', carried_hours: 0, entry_assessment: 'pending', note: '', updated_at: '', updated_by: '' }]
  const history: CareerGradeHistoryEntry[] = []
  const r = applyPlacement(placements, history, { employee_id: 'e1', primary_position: 'cashier', grade_code: 'G1', effective_date: '2026-11-25', note: 'Đã test', entry_assessment: 'confirmed' }, actor, now, makeId)
  assert.ok(r.ok)
  if (!r.ok) return
  assert.equal(r.entry, null)
  assert.equal(r.history.length, 0)
  assert.equal(r.placement.effective_date, '2026-10-01')
  assert.equal(r.placement.entry_assessment, 'confirmed')
})

test('từ chối dữ liệu sai', () => {
  const r = applyPlacement([], [], { employee_id: '', primary_position: 'kitchen', grade_code: 'C2', effective_date: '2026-02-31', carried_hours: -1 }, actor, now, makeId)
  assert.equal(r.ok, false)
  if (r.ok) return
  assert.equal(r.errors.length, 5)
})
