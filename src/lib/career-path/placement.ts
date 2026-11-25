// Bậc hiện tại và vị trí chính của từng nhân viên (lưu trên máy chủ).
// Mỗi lần đổi bậc/vị trí đều ghi thêm 1 dòng lịch sử, không sửa/xóa dòng cũ.

import { isCareerGradeCode, isCareerPositionCode, type CareerGradeCode, type CareerPositionCode } from './settings.ts'

export type EntryAssessmentStatus = 'pending' | 'confirmed'
export type CareerHistoryKind = 'initial' | 'correction' | 'promotion'

export interface CareerPlacement {
  employee_id: string
  primary_position: CareerPositionCode
  grade_code: CareerGradeCode
  /** Ngày bắt đầu tính bậc hiện tại (YYYY-MM-DD). */
  effective_date: string
  /** Số giờ đã làm trước khi dùng hệ thống, HR nhập tay để cộng dồn. */
  carried_hours: number
  /** Xếp bậc ban đầu cần được xác nhận lại bằng bài đánh giá đầu vào. */
  entry_assessment: EntryAssessmentStatus
  note: string
  updated_at: string
  updated_by: string
}

export interface CareerGradeHistoryEntry {
  id: string
  employee_id: string
  kind: CareerHistoryKind
  from_grade: CareerGradeCode | null
  to_grade: CareerGradeCode
  from_position: CareerPositionCode | null
  to_position: CareerPositionCode
  effective_date: string
  reason: string
  decided_by: string
  decided_by_name: string
  created_at: string
}

export interface PlacementInput {
  employee_id: string
  primary_position: unknown
  grade_code: unknown
  effective_date: unknown
  carried_hours?: unknown
  entry_assessment?: unknown
  note?: unknown
  reason?: unknown
}

export interface PlacementActor {
  id: string
  name: string
}

export type PlacementResult =
  | {
      ok: true
      placements: CareerPlacement[]
      history: CareerGradeHistoryEntry[]
      placement: CareerPlacement
      entry: CareerGradeHistoryEntry | null
    }
  | { ok: false; errors: string[] }

export const MIN_REASON_LENGTH = 5

function isValidYmd(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

/**
 * HR xếp bậc / sửa bậc cho một nhân viên.
 * - Lần đầu: ghi lịch sử loại "initial", không bắt buộc lý do.
 * - Đổi bậc hoặc vị trí sau đó: bắt buộc lý do, ghi loại "correction".
 * - Chỉ đổi ghi chú / giờ cộng dồn / trạng thái đánh giá: cập nhật, không ghi lịch sử bậc.
 * Hàm thuần: không đụng tới dữ liệu gốc, trả về mảng mới.
 */
export function applyPlacement(
  placements: CareerPlacement[],
  history: CareerGradeHistoryEntry[],
  input: PlacementInput,
  actor: PlacementActor,
  now: Date = new Date(),
  makeId: () => string = () => `cgh-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`
): PlacementResult {
  const errors: string[] = []
  const employeeId = typeof input.employee_id === 'string' ? input.employee_id.trim() : ''
  if (!employeeId) errors.push('Chưa chọn nhân viên.')
  if (!isCareerPositionCode(input.primary_position)) errors.push('Vị trí chính phải là Thu ngân hoặc Pha chế.')
  if (!isCareerGradeCode(input.grade_code)) errors.push('Bậc không hợp lệ.')
  if (!isValidYmd(input.effective_date)) errors.push('Ngày hiệu lực không hợp lệ (định dạng YYYY-MM-DD).')

  const carriedRaw = input.carried_hours ?? 0
  const carried = typeof carriedRaw === 'number' ? carriedRaw : Number(carriedRaw)
  if (!Number.isFinite(carried) || carried < 0) errors.push('Số giờ đã làm trước đó phải là số không âm.')

  const entryAssessment = input.entry_assessment ?? 'pending'
  if (entryAssessment !== 'pending' && entryAssessment !== 'confirmed') errors.push('Trạng thái đánh giá đầu vào không hợp lệ.')

  if (errors.length > 0) return { ok: false, errors }

  const position = input.primary_position as CareerPositionCode
  const grade = input.grade_code as CareerGradeCode
  const effectiveDate = input.effective_date as string
  const reason = typeof input.reason === 'string' ? input.reason.trim() : ''
  const note = typeof input.note === 'string' ? input.note.trim() : ''
  const existing = placements.find((p) => p.employee_id === employeeId)
  const gradeOrPositionChanged = !existing || existing.grade_code !== grade || existing.primary_position !== position

  if (existing && gradeOrPositionChanged && reason.length < MIN_REASON_LENGTH) {
    return { ok: false, errors: [`Đổi bậc hoặc vị trí chính cần ghi lý do (ít nhất ${MIN_REASON_LENGTH} ký tự).`] }
  }

  const nowIso = now.toISOString()
  const placement: CareerPlacement = {
    employee_id: employeeId,
    primary_position: position,
    grade_code: grade,
    effective_date: gradeOrPositionChanged ? effectiveDate : existing!.effective_date,
    carried_hours: Math.round(carried * 100) / 100,
    entry_assessment: entryAssessment as EntryAssessmentStatus,
    note,
    updated_at: nowIso,
    updated_by: actor.id,
  }

  let entry: CareerGradeHistoryEntry | null = null
  if (gradeOrPositionChanged) {
    entry = {
      id: makeId(),
      employee_id: employeeId,
      kind: existing ? 'correction' : 'initial',
      from_grade: existing?.grade_code ?? null,
      to_grade: grade,
      from_position: existing?.primary_position ?? null,
      to_position: position,
      effective_date: effectiveDate,
      reason: reason || (existing ? '' : 'Xếp bậc ban đầu theo năng lực thực tế'),
      decided_by: actor.id,
      decided_by_name: actor.name,
      created_at: nowIso,
    }
  }

  return {
    ok: true,
    placements: existing
      ? placements.map((p) => (p.employee_id === employeeId ? placement : p))
      : [...placements, placement],
    history: entry ? [...history, entry] : history,
    placement,
    entry,
  }
}
