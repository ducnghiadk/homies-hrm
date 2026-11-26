// Tính tiến độ lộ trình thăng tiến (kỹ năng, tháng, giờ, điều kiện bậc kế tiếp) từ CSDL máy chủ.
import type { ServerDatabaseSchema } from '@/lib/server/db'
import type { AuthenticatedUser } from '@/lib/server/auth-helper'
import { canAccessStore, isChainWideRole, hasRequiredRole, MANAGER_ROLES } from '@/lib/server/auth-helper'
import type { CareerPathSettings } from '@/lib/career-path/settings'
import type { CareerPlacement } from '@/lib/career-path/placement'
import { currentSkillLevels } from '@/lib/career-path/assessment'
import { evaluateNextGrade, fullMonthsBetween, sumWorkedHours, type CareerProgressSummary } from '@/lib/career-path/eligibility'

export function buildCareerSummary(db: ServerDatabaseSchema, settings: CareerPathSettings, placement: CareerPlacement, today: string): CareerProgressSummary {
  const entries = db.career_skill_assessments || []
  const employee = db.employees.find((e) => e.id === placement.employee_id)
  const levels = currentSkillLevels(entries, placement.employee_id)
  const mine = entries.filter((e) => e.employee_id === placement.employee_id)
  // Ngày xếp bậc đầu tiên: bản ghi lịch sử sớm nhất, nếu không có thì ngày hiệu lực hiện tại.
  const firstPlacement = (db.career_grade_history || [])
    .filter((h) => h.employee_id === placement.employee_id && h.effective_date)
    .reduce((min, h) => (h.effective_date < min ? h.effective_date : min), placement.effective_date)
  const rules = settings.rules
  const monthsStart = rules.months_from === 'first_placement' ? firstPlacement : employee?.hire_date || firstPlacement
  const months = fullMonthsBetween(monthsStart, today)
  const hoursFrom = rules.hours_from === 'since_first_placement' ? firstPlacement : undefined
  const worked = sumWorkedHours(db.attendance || [], placement.employee_id, hoursFrom)
  const hours = Math.round((placement.carried_hours + worked) * 100) / 100
  return {
    employee_id: placement.employee_id,
    levels,
    assessments_count: mine.length,
    last_assessed_at: mine.reduce((max, e) => (e.assessed_at > max ? e.assessed_at : max), ''),
    months,
    hours,
    eligibility: evaluateNextGrade(settings, { grade: placement.grade_code, position: placement.primary_position, levels, months, hours }),
  }
}

/** Ai được xem lộ trình của nhân viên nào: bản thân, toàn chuỗi, hoặc quản lý đúng chi nhánh. */
export function careerViewScope(db: ServerDatabaseSchema, user: AuthenticatedUser) {
  const employeeById = new Map(db.employees.map((e) => [e.id, e]))
  return (employeeId: string) => {
    if (employeeId === user.userId) return true
    if (isChainWideRole(user.role)) return true
    if (hasRequiredRole(user.role, MANAGER_ROLES)) {
      const emp = employeeById.get(employeeId)
      return Boolean(emp && canAccessStore(user, emp.store_id))
    }
    return false
  }
}
