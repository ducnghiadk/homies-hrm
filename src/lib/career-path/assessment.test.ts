import test from 'node:test'
import assert from 'node:assert/strict'
import { getDefaultCareerPathSettings, normalizeCareerPathSettings, validateCareerPathSettings } from './settings.ts'
import { applyPlaybookV7Suggestion } from './settings-suggestion.ts'
import { applicableSkills, applyAssessment, currentSkillLevels } from './assessment.ts'
import { evaluateNextGrade, fullMonthsBetween, sumWorkedHours } from './eligibility.ts'

const settings = { ...applyPlaybookV7Suggestion(getDefaultCareerPathSettings()), configured: true }
const actor = { id: 'emp-sm', name: 'Quản lý' }
let n = 0
const makeId = () => `a-${++n}`

test('mức đạt tiêu chuẩn chung để trống mặc định và bắt buộc chọn khi có bậc yêu cầu', () => {
  assert.equal(normalizeCareerPathSettings({ version: 3 } as never).common_pass_level, 0)
  assert.ok(validateCareerPathSettings({ ...settings, common_pass_level: 0 }).some((e) => e.includes('SOP / ATTP')))
  assert.deepEqual(validateCareerPathSettings(getDefaultCareerPathSettings()), [])
})

test('kỹ năng áp dụng theo vị trí chính Thu ngân', () => {
  const list = applicableSkills(settings, 'cashier')
  const by = (b: string) => list.filter((x) => x.bucket === b).map((x) => x.skill.code)
  assert.equal(by('main').length, 10)
  assert.ok(by('main').every((c) => c.startsWith('CS')))
  assert.deepEqual(by('support'), ['SB01', 'SB02', 'SB03'])
  assert.ok(by('second').every((c) => c.startsWith('BR')))
  assert.deepEqual(by('common'), ['AT01', 'AT02'])
})

test('ghi phiếu đánh giá và lấy mức hiện tại theo phiếu mới nhất', () => {
  const r1 = applyAssessment([], { employee_id: 'emp-1', scores: { CS01: 1, AT01: 2 } }, settings, 'cashier', actor, new Date('2026-11-01T00:00:00Z'), makeId)
  assert.ok(r1.ok)
  if (!r1.ok) return
  const r2 = applyAssessment(r1.entries, { employee_id: 'emp-1', scores: { CS01: 3, CS02: '' }, note: ' tiến bộ ' }, settings, 'cashier', actor, new Date('2026-11-20T00:00:00Z'), makeId)
  assert.ok(r2.ok)
  if (!r2.ok) return
  assert.equal(r2.entry.note, 'tiến bộ')
  assert.deepEqual(r2.entry.scores, { CS01: 3 })
  const levels = currentSkillLevels(r2.entries, 'emp-1')
  assert.equal(levels.CS01.level, 3)
  assert.equal(levels.AT01.level, 2)
  assert.equal(levels.CS02, undefined)
})

test('chặn tự đánh giá, kỹ năng sai vị trí và mức ngoài 0-3', () => {
  const self = applyAssessment([], { employee_id: 'emp-sm', scores: { CS01: 1 } }, settings, 'cashier', actor)
  assert.ok(!self.ok && self.errors.some((e) => e.includes('chính mình')))
  const wrong = applyAssessment([], { employee_id: 'emp-1', scores: { SC01: 1 } }, settings, 'cashier', actor)
  assert.ok(!wrong.ok && wrong.errors[0].includes('SC01'))
  const bad = applyAssessment([], { employee_id: 'emp-1', scores: { CS01: 4 } }, settings, 'cashier', actor)
  assert.ok(!bad.ok)
  const empty = applyAssessment([], { employee_id: 'emp-1', scores: {} }, settings, 'cashier', actor)
  assert.ok(!empty.ok && empty.errors[0].includes('Chưa chấm'))
})

test('tính tháng tròn và tổng giờ công', () => {
  assert.equal(fullMonthsBetween('2026-09-15', '2026-11-14'), 1)
  assert.equal(fullMonthsBetween('2026-09-15', '2026-11-15'), 2)
  assert.equal(fullMonthsBetween('', '2026-11-15'), 0)
  assert.equal(sumWorkedHours([{ employee_id: 'e', total_hours: 4.5 }, { employee_id: 'e' }, { employee_id: 'x', total_hours: 9 }], 'e'), 4.5)
})

test('xét lên G2: đủ tháng/giờ nhưng thiếu kỹ năng thì chưa sẵn sàng', () => {
  const levels: Record<string, { level: number; assessed_at: string; assessed_by_name: string }> = {}
  const mk = (level: number) => ({ level, assessed_at: '', assessed_by_name: '' })
  for (const { skill } of applicableSkills(settings, 'cashier')) levels[skill.code] = mk(3)
  const full = evaluateNextGrade(settings, { grade: 'G1', position: 'cashier', levels, months: 2, hours: 240 })
  assert.equal(full.next, 'G2')
  assert.ok(full.ready)
  levels.SB01 = mk(1)
  const missing = evaluateNextGrade(settings, { grade: 'G1', position: 'cashier', levels, months: 2, hours: 239 })
  assert.ok(!missing.ready)
  assert.deepEqual(missing.checks.filter((c) => !c.ok).map((c) => c.key).sort(), ['hours', 'support'])
  assert.equal(evaluateNextGrade(settings, { grade: 'G4', position: 'cashier', levels, months: 9, hours: 999 }).next, null)
})

test('chưa cài đặt lộ trình thì không xét bậc; mốc bằng 0 là không xét tiêu chí đó', () => {
  const blank = getDefaultCareerPathSettings()
  const r = evaluateNextGrade(blank, { grade: 'G1', position: 'cashier', levels: {}, months: 9, hours: 999 })
  assert.ok(!r.ready)
  assert.deepEqual(r.checks.map((c) => c.key), ['setup'])
  const noHours = { ...settings, grades: settings.grades.map((g) => (g.code === 'G2' ? { ...g, min_hours: 0 } : g)) }
  const r2 = evaluateNextGrade(noHours, { grade: 'G1', position: 'cashier', levels: {}, months: 2, hours: 0 })
  assert.ok(!r2.checks.some((c) => c.key === 'hours'))
})

test('đếm giờ chỉ từ ngày xếp bậc đầu khi chọn', () => {
  const logs = [{ employee_id: 'e1', total_hours: 5, date: '2026-10-01' }, { employee_id: 'e1', total_hours: 3, date: '2026-11-02' }]
  assert.equal(sumWorkedHours(logs, 'e1'), 8)
  assert.equal(sumWorkedHours(logs, 'e1', '2026-11-01'), 3)
})
