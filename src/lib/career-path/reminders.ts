// Quyết định đề xuất nâng bậc nào cần nhắc / báo lên cấp trên hôm nay. Hàm thuần, có test.
import type { CareerReminderConfig } from './settings.ts'
import { workingDaysSince, type PromotionProposal } from './promotion.ts'

export interface ReminderAction {
  proposal_id: string
  remind: boolean
  escalate: boolean
  /** Số ngày làm việc đã quá hạn. */
  overdue_days: number
}

export function planCareerReminders(
  proposals: PromotionProposal[],
  opts: { config: CareerReminderConfig; respondWithinDays: number; nonWorkingWeekdays: number[]; today: string; hour: number },
): ReminderAction[] {
  const { config, respondWithinDays, today } = opts
  if (!config.enabled || !(respondWithinDays > 0)) return []
  if (config.send_hour !== null && opts.hour < config.send_hour) return []
  const out: ReminderAction[] = []
  for (const p of proposals) {
    if (p.status !== 'pending') continue
    const waiting = workingDaysSince(p.proposed_at, today, opts.nonWorkingWeekdays)
    const overdue = waiting - respondWithinDays
    if (overdue <= 0) continue
    const st = p.reminder || { count: 0, last_on: '', escalated_on: '' }
    // Mỗi đề xuất tối đa 1 lần nhắc mỗi ngày.
    let remind = st.last_on !== today
    if (remind && config.max_times > 0 && st.count >= config.max_times) remind = false
    if (remind && st.count > 0) {
      if (config.repeat_every_days <= 0) remind = false
      else if (workingDaysSince(st.last_on, today, opts.nonWorkingWeekdays) < config.repeat_every_days) remind = false
    }
    const escalate = config.escalate_after_days > 0 && overdue >= config.escalate_after_days && !st.escalated_on && config.escalate_roles.length > 0
    if (remind || escalate) out.push({ proposal_id: p.id, remind, escalate, overdue_days: overdue })
  }
  return out
}

/** Ghi lại dấu vết nhắc vào đề xuất (trả bản mới, không sửa bản cũ). */
export function markReminded(p: PromotionProposal, action: ReminderAction, today: string): PromotionProposal {
  const st = p.reminder || { count: 0, last_on: '', escalated_on: '' }
  return {
    ...p,
    reminder: {
      count: action.remind ? st.count + 1 : st.count,
      last_on: action.remind ? today : st.last_on,
      escalated_on: action.escalate ? today : st.escalated_on,
    },
  }
}
