// Đánh giá kỹ năng nhân viên theo Playbook V7 (lưu trên máy chủ).
// Mỗi lần đánh giá ghi thêm 1 phiếu, không sửa/xóa phiếu cũ.
// Mức hiện tại của 1 kỹ năng = mức ở phiếu gần nhất có chấm kỹ năng đó.

import type { CareerPathSettings, CareerPositionCode, CareerSkillConfig, CareerSkillGroup } from './settings.ts'

export const SKILL_LEVELS = [0, 1, 2, 3] as const

export interface SkillAssessmentEntry {
  id: string
  employee_id: string
  /** Mã kỹ năng -> mức 0-3. Chỉ chứa các kỹ năng được chấm trong lần này. */
  scores: Record<string, number>
  note: string
  assessed_by: string
  assessed_by_name: string
  assessed_at: string
}

export interface AssessmentInput {
  employee_id: unknown
  scores: unknown
  note?: unknown
}

export interface AssessmentActor {
  id: string
  name: string
}

export type AssessmentResult =
  | { ok: true; entries: SkillAssessmentEntry[]; entry: SkillAssessmentEntry }
  | { ok: false; errors: string[] }

export interface CurrentSkillLevel {
  level: number
  assessed_at: string
  assessed_by_name: string
}

/** Nhóm kỹ năng áp dụng cho 1 nhân viên, tính theo vị trí chính. */
export type ApplicableBucket = 'main' | 'support' | 'second' | 'common' | 'advanced'

export const otherPosition = (p: CareerPositionCode): CareerPositionCode => (p === 'cashier' ? 'barista' : 'cashier')

/** Xếp 1 kỹ năng vào nhóm áp dụng với nhân viên có vị trí chính `primary`; null = không áp dụng. */
export function bucketOf(skill: CareerSkillConfig, primary: CareerPositionCode): ApplicableBucket | null {
  const map: Record<CareerSkillGroup, ApplicableBucket | null> = {
    core: skill.position === primary ? 'main' : skill.position === otherPosition(primary) ? 'second' : null,
    // Kỹ năng hỗ trợ gắn với vị trí được hỗ trợ: Thu ngân học kỹ năng hỗ trợ Pha chế và ngược lại.
    support: skill.position === otherPosition(primary) ? 'support' : null,
    common: 'common',
    advanced: 'advanced',
  }
  return map[skill.group]
}

export function applicableSkills(settings: CareerPathSettings, primary: CareerPositionCode) {
  return settings.skills
    .filter((sk) => sk.active)
    .map((skill) => ({ skill, bucket: bucketOf(skill, primary) }))
    .filter((x): x is { skill: CareerSkillConfig; bucket: ApplicableBucket } => x.bucket !== null)
}

export function currentSkillLevels(entries: SkillAssessmentEntry[], employeeId: string): Record<string, CurrentSkillLevel> {
  const result: Record<string, CurrentSkillLevel> = {}
  const mine = entries.filter((e) => e.employee_id === employeeId).sort((a, b) => a.assessed_at.localeCompare(b.assessed_at))
  for (const entry of mine) {
    for (const [code, level] of Object.entries(entry.scores)) {
      result[code] = { level, assessed_at: entry.assessed_at, assessed_by_name: entry.assessed_by_name }
    }
  }
  return result
}

/**
 * Ghi 1 phiếu đánh giá kỹ năng. Hàm thuần: trả về mảng mới.
 * Chỉ nhận kỹ năng đang dùng và áp dụng cho vị trí chính của nhân viên, mức 0-3.
 */
export function applyAssessment(
  entries: SkillAssessmentEntry[],
  input: AssessmentInput,
  settings: CareerPathSettings,
  primary: CareerPositionCode,
  actor: AssessmentActor,
  now: Date = new Date(),
  makeId: () => string = () => `csa-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`
): AssessmentResult {
  const errors: string[] = []
  const employeeId = typeof input.employee_id === 'string' ? input.employee_id.trim() : ''
  if (!employeeId) errors.push('Chưa chọn nhân viên.')
  if (employeeId && employeeId === actor.id) errors.push('Không được tự đánh giá kỹ năng của chính mình.')

  const allowed = new Map(applicableSkills(settings, primary).map(({ skill }) => [skill.code, skill]))
  const scores: Record<string, number> = {}
  if (!input.scores || typeof input.scores !== 'object' || Array.isArray(input.scores)) {
    errors.push('Thiếu điểm kỹ năng.')
  } else {
    for (const [code, raw] of Object.entries(input.scores as Record<string, unknown>)) {
      if (raw === null || raw === undefined || raw === '') continue
      const level = typeof raw === 'number' ? raw : Number(raw)
      if (!allowed.has(code)) {
        errors.push(`Kỹ năng ${code} không thuộc danh mục áp dụng cho nhân viên này.`)
      } else if (!Number.isInteger(level) || level < 0 || level > 3) {
        errors.push(`Kỹ năng ${code}: mức phải là số nguyên từ 0 đến 3.`)
      } else {
        scores[code] = level
      }
    }
    if (Object.keys(scores).length === 0 && errors.length === 0) errors.push('Chưa chấm kỹ năng nào.')
  }
  if (errors.length > 0) return { ok: false, errors }

  const entry: SkillAssessmentEntry = {
    id: makeId(),
    employee_id: employeeId,
    scores,
    note: typeof input.note === 'string' ? input.note.trim().slice(0, 1000) : '',
    assessed_by: actor.id,
    assessed_by_name: actor.name,
    assessed_at: now.toISOString(),
  }
  return { ok: true, entries: [...entries, entry], entry }
}
