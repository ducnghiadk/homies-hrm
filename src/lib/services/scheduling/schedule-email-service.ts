export type ScheduleEmailType =
  | 'schedule_published'
  | 'schedule_changed_after_publish'
  | 'swap_status_changed'
  | 'open_shift_assigned'

export type ScheduleEmailStatus = 'sent' | 'failed'

export interface ScheduleEmailLog {
  id: string
  type: ScheduleEmailType
  to: string
  subject: string
  body_preview: string
  related_week?: string
  related_schedule_id?: string
  status: ScheduleEmailStatus
  error?: string
  sent_at: string
}

const STORAGE_KEY = 'homies_schedule_email_logs'

function readLogs(): ScheduleEmailLog[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as ScheduleEmailLog[]
  } catch {
    return []
  }
}

function writeLogs(logs: ScheduleEmailLog[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs))
}

export class ScheduleEmailService {
  static getLogs(): ScheduleEmailLog[] {
    return readLogs()
  }

  static sendEmail(input: {
    type: ScheduleEmailType
    to: string
    subject: string
    body_preview: string
    related_week?: string
    related_schedule_id?: string
  }): ScheduleEmailLog {
    const logs = readLogs()
    const sentAt = new Date().toISOString()
    const hasValidTarget = Boolean(input.to && input.to.includes('@'))
    const record: ScheduleEmailLog = {
      id: `schedule-email-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: input.type,
      to: input.to,
      subject: input.subject,
      body_preview: input.body_preview,
      related_week: input.related_week,
      related_schedule_id: input.related_schedule_id,
      status: hasValidTarget ? 'sent' : 'failed',
      error: hasValidTarget ? undefined : 'Thiếu email hợp lệ để gửi mock email.',
      sent_at: sentAt,
    }
    logs.unshift(record)
    writeLogs(logs)
    return record
  }
}
