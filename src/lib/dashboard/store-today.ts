// Gom dữ liệu thật của một chi nhánh trong ngày thành danh sách "Việc của quán hôm nay".
// Hàm thuần, không gọi mạng: trang quản lý tự tải dữ liệu rồi truyền vào.

export type TodaySchedule = {
  id: string
  employee_id: string
  employee_name?: string
  shift_id?: string
  shift_name?: string
  notes?: string
}

export type TodayAttendance = {
  employee_id: string
  shift_id?: string
  check_in_time?: string
  check_out_time?: string
  late_minutes?: number
  is_late?: boolean
  off_schedule?: boolean
}

export type PendingRequest = { id: string; type?: string }

export type ShiftTiming = { name: string; timeRange: string; startMinutes: number }

export type RosterStatus = 'checked_in' | 'checked_out' | 'late' | 'not_yet' | 'absent'

export type RosterEntry = {
  scheduleId: string
  employeeId: string
  employeeName: string
  shiftName: string
  timeRange: string
  startMinutes: number
  status: RosterStatus
  lateMinutes: number
}

export type StoreTask = {
  id: string
  level: 'urgent' | 'todo' | 'ok'
  title: string
  detail: string
  href: string
  cta: string
}

export type StoreTodayInput = {
  nowMinutes: number
  isWeekPublished: boolean
  isNextWeekPublished: boolean
  /** Thứ trong tuần của hôm nay: 0 = Chủ nhật ... 6 = Thứ 7 */
  weekday: number
  schedules: TodaySchedule[]
  attendance: TodayAttendance[]
  pendingRequests: PendingRequest[]
  getTiming: (s: TodaySchedule) => ShiftTiming
  /** Số phút sau giờ vào ca mà chưa chấm công thì coi là vắng. */
  absentAfterMinutes?: number
}

export type StoreToday = {
  roster: RosterEntry[]
  tasks: StoreTask[]
  counts: { scheduled: number; checkedIn: number; late: number; absent: number; offSchedule: number }
}

function findAttendance(s: TodaySchedule, list: TodayAttendance[], used: Set<TodayAttendance>) {
  const sameEmployee = list.filter((a) => a.employee_id === s.employee_id && !used.has(a))
  const exact = sameEmployee.find((a) => a.shift_id && s.shift_id && a.shift_id === s.shift_id)
  return exact || sameEmployee.find((a) => !a.shift_id || !s.shift_id) || null
}

export function buildStoreToday(input: StoreTodayInput): StoreToday {
  const absentAfter = input.absentAfterMinutes ?? 30
  const used = new Set<TodayAttendance>()

  const roster: RosterEntry[] = input.schedules
    .map((s) => {
      const timing = input.getTiming(s)
      const att = findAttendance(s, input.attendance, used)
      if (att) used.add(att)
      const lateMinutes = att ? Math.max(0, att.late_minutes || 0) : 0
      let status: RosterStatus
      if (att?.check_out_time) status = 'checked_out'
      else if (att?.check_in_time) status = lateMinutes > 0 || att.is_late ? 'late' : 'checked_in'
      else if (timing.startMinutes < 9999 && input.nowMinutes > timing.startMinutes + absentAfter) status = 'absent'
      else status = 'not_yet'
      return {
        scheduleId: s.id,
        employeeId: s.employee_id,
        employeeName: s.employee_name || 'Nhân viên',
        shiftName: timing.name,
        timeRange: timing.timeRange,
        startMinutes: timing.startMinutes,
        status,
        lateMinutes,
      }
    })
    .sort((a, b) => a.startMinutes - b.startMinutes || a.employeeName.localeCompare(b.employeeName, 'vi'))

  const offSchedule = input.attendance.filter((a) => !used.has(a) && (a.off_schedule || a.check_in_time)).length
  const counts = {
    scheduled: roster.length,
    checkedIn: roster.filter((r) => r.status === 'checked_in' || r.status === 'late' || r.status === 'checked_out').length,
    late: roster.filter((r) => r.status === 'late').length,
    absent: roster.filter((r) => r.status === 'absent').length,
    offSchedule,
  }

  const tasks: StoreTask[] = []
  if (counts.absent > 0) {
    tasks.push({
      id: 'absent',
      level: 'urgent',
      title: `${counts.absent} người chưa vào ca`,
      detail: 'Đã quá giờ vào ca nhưng chưa chấm công. Gọi hỏi hoặc tìm người làm thay.',
      href: '/attendance',
      cta: 'Xem chấm công',
    })
  }
  if (!input.isWeekPublished) {
    tasks.push({
      id: 'week-unpublished',
      level: 'urgent',
      title: 'Lịch tuần này chưa chốt',
      detail: 'Nhân viên chưa thấy lịch làm. Vào xếp lịch và bấm Chốt lịch.',
      href: '/schedule',
      cta: 'Xếp lịch',
    })
  }
  if (input.pendingRequests.length > 0) {
    tasks.push({
      id: 'requests',
      level: 'todo',
      title: `${input.pendingRequests.length} đơn đang chờ duyệt`,
      detail: 'Đơn nghỉ, đổi ca, sửa công của nhân viên.',
      href: '/requests',
      cta: 'Duyệt đơn',
    })
  }
  if (counts.offSchedule > 0) {
    tasks.push({
      id: 'off-schedule',
      level: 'todo',
      title: `${counts.offSchedule} lượt chấm công ngoài lịch`,
      detail: 'Có người chấm công nhưng không có ca trong lịch đã chốt. Kiểm tra và xác nhận.',
      href: '/attendance',
      cta: 'Kiểm tra',
    })
  }
  // Từ Thứ 5 đến Chủ nhật mới nhắc chốt lịch tuần sau
  const lateInWeek = input.weekday === 0 || input.weekday >= 4
  if (lateInWeek && !input.isNextWeekPublished) {
    tasks.push({
      id: 'next-week',
      level: 'todo',
      title: 'Lịch tuần sau chưa chốt',
      detail: 'Xem lịch rảnh nhân viên đã nộp và xếp lịch tuần sau.',
      href: '/schedule',
      cta: 'Xếp lịch tuần sau',
    })
  }
  if (tasks.length === 0) {
    tasks.push({
      id: 'all-good',
      level: 'ok',
      title: 'Không có việc gấp',
      detail: 'Mọi người đã vào ca đúng lịch, không có đơn chờ duyệt.',
      href: '/attendance',
      cta: 'Xem chấm công',
    })
  }

  return { roster, tasks, counts }
}
