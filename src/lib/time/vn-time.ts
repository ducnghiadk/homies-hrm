// ============================================================================
// Giờ Việt Nam (UTC+7) — dùng chung cho máy chủ (Vercel chạy UTC) và trình duyệt.
// Việt Nam không đổi giờ mùa hè nên cộng cố định 7 tiếng là chính xác.
// ============================================================================

const VN_OFFSET_MINUTES = 7 * 60

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Thời điểm hiện tại (hoặc `date`) theo giờ Việt Nam. */
export function getVnClock(date: Date = new Date()): {
  /** Ngày theo giờ VN, dạng YYYY-MM-DD */
  date: string
  /** Giờ phút theo giờ VN, dạng HH:mm */
  time: string
  /** Số phút tính từ 00:00 giờ VN */
  minutesOfDay: number
  /** Chuỗi ISO có múi giờ +07:00 để lưu và hiển thị */
  iso: string
} {
  const shifted = new Date(date.getTime() + VN_OFFSET_MINUTES * 60_000)
  const y = shifted.getUTCFullYear()
  const m = pad(shifted.getUTCMonth() + 1)
  const d = pad(shifted.getUTCDate())
  const hh = shifted.getUTCHours()
  const mm = shifted.getUTCMinutes()
  const ss = pad(shifted.getUTCSeconds())
  return {
    date: `${y}-${m}-${d}`,
    time: `${pad(hh)}:${pad(mm)}`,
    minutesOfDay: hh * 60 + mm,
    iso: `${y}-${m}-${d}T${pad(hh)}:${pad(mm)}:${ss}+07:00`,
  }
}

/** Ngày hôm nay theo giờ Việt Nam, dạng YYYY-MM-DD. */
export function getVnDateString(date: Date = new Date()): string {
  return getVnClock(date).date
}

/** "08:30" hoặc "08:30:00" → số phút trong ngày; trả về null nếu không đọc được. */
export function parseHhmmToMinutes(value: string | null | undefined): number | null {
  if (!value) return null
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim())
  if (!match) return null
  const h = Number(match[1])
  const m = Number(match[2])
  if (h > 23 || m > 59) return null
  return h * 60 + m
}
