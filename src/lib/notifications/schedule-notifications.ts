import { format } from 'date-fns'
import { createBulkNotificationsDeduped, createNotificationDeduped } from './notification-center'

export interface SchedulePublishedEvent {
  userIds: string[]
  weekStart: string
  weekEnd: string
  storeId: string
  storeName: string
  publishedByName: string
}

function getWeekStart(value: string): string {
  const base = new Date(`${value}T00:00:00`)
  if (Number.isNaN(base.getTime())) return value
  const monday = new Date(base)
  const day = monday.getDay()
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  return monday.toISOString().split('T')[0]
}

export function notifySchedulePublished(event: SchedulePublishedEvent): void {
  if (event.userIds.length === 0) return

  const weekStartDate = new Date(event.weekStart)
  const weekEndDate = new Date(event.weekEnd)

  createBulkNotificationsDeduped(
    event.userIds,
    'schedule_published',
    '📅 Lịch tuần mới đã được xuất bản',
    `${event.publishedByName} đã xuất bản lịch làm việc cho tuần ${format(weekStartDate, 'dd/MM')} - ${format(weekEndDate, 'dd/MM')} tại ${event.storeName}.`,
    {
      week_start: event.weekStart,
      week_end: event.weekEnd,
      store_id: event.storeId,
      action_url: `/schedules?weekStart=${event.weekStart}&selectedDate=${event.weekStart}&storeId=${event.storeId}`,
    }
  )
}

export interface ScheduleChangedAfterPublishEvent {
  userId: string
  scheduleId: string
  date: string
  shiftName: string
  startTime: string
  endTime: string
  reason: string
  storeId: string
}

export function notifyScheduleChangedAfterPublish(event: ScheduleChangedAfterPublishEvent): void {
  createNotificationDeduped(
    event.userId,
    'schedule_changed_after_publish',
    '📝 Lịch làm vừa được cập nhật',
    `Ca ${event.shiftName} ngày ${event.date} đã được điều chỉnh. Lý do: ${event.reason}`,
    {
      schedule_id: event.scheduleId,
      store_id: event.storeId,
      action_url: `/schedules?weekStart=${getWeekStart(event.date)}&selectedDate=${event.date}&storeId=${event.storeId}`,
    }
  )
}
