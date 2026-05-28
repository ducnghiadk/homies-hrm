import { format } from 'date-fns'
import { createNotificationDeduped } from './notification-center'

export interface PreferenceReminderEvent {
  userIds: string[]
  weekStart: string
  weekEnd: string
}

export function notifyMissingPreferences(event: PreferenceReminderEvent): {
  sent: number
  skipped: number
} {
  let sent = 0
  let skipped = 0

  event.userIds.forEach(userId => {
    const { created } = createNotificationDeduped(
      userId,
      'preference_reminder',
      '🗓️ Nhắc đăng ký ca mong muốn',
      `Bạn chưa đăng ký nguyện vọng làm việc cho tuần ${format(new Date(event.weekStart), 'dd/MM')} - ${format(new Date(event.weekEnd), 'dd/MM')}. Vui lòng cập nhật sớm để quản lý xếp lịch chính xác hơn.`,
      {
        week_start: event.weekStart,
        week_end: event.weekEnd,
        action_url: `/schedules?weekStart=${event.weekStart}`,
      }
    )

    if (created) {
      sent += 1
    } else {
      skipped += 1
    }
  })

  return { sent, skipped }
}
