import { getShiftById } from '@/lib/mock-data'

export type ShiftDisplay = {
  name: string
  timeRange: string
  startMinutes: number
}

type ShiftLike = { shift_id?: string; shift_name?: string; notes?: string }

function toMinutes(value: string): number {
  const [h, m] = value.split(':').map(Number)
  return (h || 0) * 60 + (m || 0)
}

/** Tên ca + khung giờ dễ đọc cho một ca trong lịch đã chốt. */
export function getShiftDisplay(schedule: ShiftLike): ShiftDisplay {
  const known = getShiftById(schedule.shift_id)
  if (known) {
    return {
      name: schedule.shift_name || known.name,
      timeRange: `${known.start_time} - ${known.end_time}`,
      startMinutes: toMinutes(known.start_time),
    }
  }
  const text = `${schedule.shift_name || ''} ${schedule.notes || ''}`
  const match = text.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/)
  const name = (schedule.shift_name || schedule.notes || 'Ca làm').trim()
  if (match) {
    return { name, timeRange: `${match[1]} - ${match[2]}`, startMinutes: toMinutes(match[1]) }
  }
  return { name, timeRange: 'Theo phân công', startMinutes: 9999 }
}

export function toYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getMondayOf(date: Date): Date {
  const monday = new Date(date)
  const day = monday.getDay()
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1))
  monday.setHours(0, 0, 0, 0)
  return monday
}
