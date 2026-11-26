// Gửi nhắc việc (chuông thông báo) khi đề xuất nâng bậc quá hạn phản hồi, và báo lên cấp trên.
// Gọi từ lịch chạy hằng ngày (/api/career-path/reminders) và khi có người mở thông báo.
import type { ServerDatabaseSchema } from '@/lib/server/db'
import { normalizeCareerPathSettings } from '@/lib/career-path/settings'
import { canApproveGrade } from '@/lib/career-path/promotion'
import { markReminded, planCareerReminders } from '@/lib/career-path/reminders'
import { careerApproverIds, pushCareerNotices, type CareerNotice } from '@/lib/server/career-notify'
import { getVnClock } from '@/lib/time/vn-time'

/** Trả về số thông báo đã tạo. Có thay đổi thì caller cần lưu db. */
export function runCareerReminders(db: ServerDatabaseSchema, now: Date = new Date()): number {
  const settings = normalizeCareerPathSettings(db.career_settings)
  if (!settings.configured || !settings.reminders.enabled) return 0
  const clock = getVnClock(now)
  const proposals = db.career_promotions || []
  const actions = planCareerReminders(proposals, {
    config: settings.reminders,
    respondWithinDays: settings.approval.respond_within_working_days,
    nonWorkingWeekdays: settings.rules.non_working_weekdays,
    today: clock.date,
    hour: Math.floor(clock.minutesOfDay / 60),
  })
  if (actions.length === 0) return 0
  const notices: CareerNotice[] = []
  const byId = new Map(actions.map((a) => [a.proposal_id, a]))
  db.career_promotions = proposals.map((p) => {
    const a = byId.get(p.id)
    if (!a) return p
    const employee = db.employees.find((e) => e.id === p.employee_id)
    const name = employee?.full_name || 'Nhân viên'
    const storeId = employee?.store_id || p.store_id
    const meta = { proposal_id: p.id, link: '/career-path/review' }
    if (a.remind) {
      for (const id of careerApproverIds(db, (role) => canApproveGrade(settings, role, p.to_grade), storeId, p.proposed_by)) {
        notices.push({
          title: 'Nhắc việc: đề xuất nâng bậc quá hạn',
          message: `Đề xuất cho ${name} lên ${p.to_grade} đã quá hạn phản hồi ${a.overdue_days} ngày làm việc. Vào "Đề xuất & duyệt nâng bậc" để xử lý.`,
          target_user_id: id,
          metadata: meta,
        })
      }
    }
    if (a.escalate) {
      const roles = settings.reminders.escalate_roles.map((r) => r.toLowerCase())
      const targets = db.employees.filter((e) => {
        if (e.status === 'resigned' || e.status === 'inactive') return false
        if (!roles.includes(String(e.role).toLowerCase())) return false
        if (e.role === 'store_manager') return e.store_id === storeId || (e.secondary_store_ids || []).includes(storeId)
        return true
      })
      for (const t of targets) {
        notices.push({
          title: 'Báo lên: đề xuất nâng bậc chưa được xử lý',
          message: `Đề xuất cho ${name} lên ${p.to_grade} (do ${p.proposed_by_name} gửi) đã quá hạn ${a.overdue_days} ngày làm việc mà chưa ai duyệt.`,
          target_user_id: t.id,
          metadata: meta,
        })
      }
    }
    return markReminded(p, a, clock.date)
  })
  pushCareerNotices(db, notices, now)
  return notices.length
}
