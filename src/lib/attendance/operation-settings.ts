// ============================================================================
// Cài đặt vận hành chấm công & đăng ký lịch rảnh (dùng chung máy chủ + trình duyệt).
// File thuần TypeScript, không đụng fs/db để kiểm thử được bằng node --test.
// ============================================================================

export const ROUNDING_OPTIONS = [0, 5, 10, 15, 30] as const

export interface AvailabilityDeadlineSettings {
  /** Bật hạn chót nộp lịch rảnh. Mặc định 22:00 Thứ 6 trước tuần làm (giống màn hình đăng ký cũ). */
  enabled: boolean
  /** Hạn chót trước ngày Thứ 2 của tuần đăng ký bao nhiêu ngày (1 = Chủ nhật, 3 = Thứ 6 ...). */
  days_before_week_start: number
  /** Giờ hạn chót theo giờ Việt Nam, dạng HH:mm. */
  time: string
}

export interface AttendanceTimeSettings {
  /** Đến sau giờ vào ca quá số phút này mới tính là đi trễ. */
  late_grace_minutes: number
  /** Tính giờ công cho thời gian đến sớm trước giờ vào ca. */
  count_early_arrival: boolean
  /** Tính giờ công cho thời gian ở lại sau giờ kết thúc ca. */
  count_late_stay: boolean
  /** Khi tính ở lại muộn: chỉ tính tối đa bấy nhiêu phút sau giờ kết thúc ca. */
  late_stay_max_minutes: number
  /** Làm tròn xuống giờ công theo bội số phút (0 = không làm tròn). */
  rounding_minutes: number
  /** Cho phép chấm công khi không có ca trong lịch đã chốt (bản ghi bị đánh dấu "ngoài lịch"). */
  allow_off_schedule_checkin: boolean
}

export interface OperationSettings {
  availability_deadline: AvailabilityDeadlineSettings
  attendance: AttendanceTimeSettings
  updated_at?: string
  updated_by?: string
}

export const DEFAULT_OPERATION_SETTINGS: OperationSettings = {
  availability_deadline: {
    enabled: true,
    days_before_week_start: 3,
    time: '22:00',
  },
  attendance: {
    late_grace_minutes: 15,
    count_early_arrival: false,
    count_late_stay: false,
    late_stay_max_minutes: 60,
    rounding_minutes: 0,
    allow_off_schedule_checkin: true,
  },
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = Math.round(Number(value))
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

function normalizeHhmm(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!m) return fallback
  const h = Number(m[1])
  const mi = Number(m[2])
  if (h > 23 || mi > 59) return fallback
  return `${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`
}

export function normalizeOperationSettings(raw: unknown): OperationSettings {
  const src = (raw && typeof raw === 'object' ? raw : {}) as Partial<OperationSettings>
  const d = DEFAULT_OPERATION_SETTINGS
  const av = (src.availability_deadline || {}) as Partial<AvailabilityDeadlineSettings>
  const at = (src.attendance || {}) as Partial<AttendanceTimeSettings>
  const rounding = Number(at.rounding_minutes)
  return {
    availability_deadline: {
      enabled: typeof av.enabled === 'boolean' ? av.enabled : d.availability_deadline.enabled,
      days_before_week_start: clampInt(av.days_before_week_start, 1, 7, d.availability_deadline.days_before_week_start),
      time: normalizeHhmm(av.time, d.availability_deadline.time),
    },
    attendance: {
      late_grace_minutes: clampInt(at.late_grace_minutes, 0, 120, d.attendance.late_grace_minutes),
      count_early_arrival: typeof at.count_early_arrival === 'boolean' ? at.count_early_arrival : d.attendance.count_early_arrival,
      count_late_stay: typeof at.count_late_stay === 'boolean' ? at.count_late_stay : d.attendance.count_late_stay,
      late_stay_max_minutes: clampInt(at.late_stay_max_minutes, 0, 360, d.attendance.late_stay_max_minutes),
      rounding_minutes: (ROUNDING_OPTIONS as readonly number[]).includes(rounding) ? rounding : d.attendance.rounding_minutes,
      allow_off_schedule_checkin:
        typeof at.allow_off_schedule_checkin === 'boolean' ? at.allow_off_schedule_checkin : d.attendance.allow_off_schedule_checkin,
    },
    updated_at: typeof src.updated_at === 'string' ? src.updated_at : undefined,
    updated_by: typeof src.updated_by === 'string' ? src.updated_by : undefined,
  }
}

// ---------------------------------------------------------------------------
// Hạn chót nộp lịch rảnh
// ---------------------------------------------------------------------------

function addDaysYmd(ymd: string, days: number): string {
  const [y, m, d] = ymd.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d + days))
  return dt.toISOString().slice(0, 10)
}

/** Thời điểm hạn chót (giờ VN) cho tuần bắt đầu từ `weekStart` (YYYY-MM-DD, Thứ 2). */
export function getAvailabilityDeadline(
  weekStart: string,
  settings: AvailabilityDeadlineSettings
): { date: string; time: string; epochMs: number } {
  const date = addDaysYmd(weekStart, -settings.days_before_week_start)
  const epochMs = Date.parse(`${date}T${settings.time}:00+07:00`)
  return { date, time: settings.time, epochMs }
}

export function isAvailabilityDeadlinePassed(
  weekStart: string,
  settings: AvailabilityDeadlineSettings,
  now: Date = new Date()
): boolean {
  if (!settings.enabled || !/^\d{4}-\d{2}-\d{2}$/.test(weekStart)) return false
  return now.getTime() > getAvailabilityDeadline(weekStart, settings).epochMs
}

// ---------------------------------------------------------------------------
// Giờ công & đi trễ (tất cả tính bằng phút trong ngày theo giờ VN)
// ---------------------------------------------------------------------------

export interface PaidTimeInput {
  checkInMin: number
  checkOutMin: number
  /** Giờ vào ca theo lịch; bỏ trống nếu không có ca. */
  shiftStartMin?: number | null
  /** Giờ kết thúc ca theo lịch (có thể > 1440 nếu ca qua đêm). */
  shiftEndMin?: number | null
}

/** Số phút công được tính sau khi áp quy tắc đến sớm / ở lại muộn / làm tròn. */
export function computePaidMinutes(input: PaidTimeInput, settings: AttendanceTimeSettings): number {
  const checkIn = input.checkInMin
  let checkOut = input.checkOutMin
  if (checkOut < checkIn) checkOut += 1440

  let start = checkIn
  let end = checkOut
  const hasShift = input.shiftStartMin != null && input.shiftEndMin != null
  if (hasShift) {
    const shiftStart = input.shiftStartMin as number
    let shiftEnd = input.shiftEndMin as number
    if (shiftEnd <= shiftStart) shiftEnd += 1440
    if (!settings.count_early_arrival) start = Math.max(checkIn, shiftStart)
    const lateStayCap = settings.count_late_stay ? shiftEnd + settings.late_stay_max_minutes : shiftEnd
    end = Math.min(checkOut, lateStayCap)
  }

  let minutes = Math.max(0, end - start)
  if (settings.rounding_minutes > 0) {
    minutes = Math.floor(minutes / settings.rounding_minutes) * settings.rounding_minutes
  }
  return minutes
}

export function minutesToHours(minutes: number): number {
  return Math.round((minutes / 60) * 100) / 100
}

/** Số phút đến sau giờ vào ca (0 nếu đến đúng giờ / sớm). */
export function computeLateMinutes(checkInMin: number, shiftStartMin: number): number {
  return Math.max(0, checkInMin - shiftStartMin)
}

export function isLateBeyondGrace(lateMinutes: number, settings: AttendanceTimeSettings): boolean {
  return lateMinutes > settings.late_grace_minutes
}

// ---------------------------------------------------------------------------
// Chọn ca để đối soát khi chấm công
// ---------------------------------------------------------------------------

export interface ShiftCandidate {
  shift_id: string
  startMin: number
  endMin: number
  source: 'official' | 'availability'
}

/**
 * Chọn ca phù hợp nhất với thời điểm chấm công:
 * ưu tiên ca đã chốt; bỏ các ca đã chấm xong; ưu tiên ca đang diễn ra (cho phép vào sớm 2 tiếng),
 * nếu không có thì lấy ca có giờ bắt đầu gần nhất.
 */
export function pickShiftForTime(
  candidates: ShiftCandidate[],
  nowMin: number,
  completedShiftIds: string[] = []
): ShiftCandidate | null {
  const official = candidates.filter((c) => c.source === 'official')
  const pool = (official.length > 0 ? official : candidates).filter((c) => !completedShiftIds.includes(c.shift_id))
  if (pool.length === 0) return null
  const EARLY_WINDOW = 120
  const active = pool.filter((c) => nowMin >= c.startMin - EARLY_WINDOW && nowMin <= c.endMin)
  const list = active.length > 0 ? active : pool
  return [...list].sort((a, b) => Math.abs(a.startMin - nowMin) - Math.abs(b.startMin - nowMin))[0]
}
