export type DashboardWarning = {
  type: string
  date?: string
  shift_id?: string
  employee_id?: string
}

export type DashboardDemand = {
  id: string
  date: string
  shift_template_id: string
  position_id: string
  missing_count: number
}

export type CompactWarningItem = {
  tone: 'hard' | 'soft'
  text: string
}

export type SummaryCard = {
  title: string
  value: string
  hint: string
}

export type HeaderMetric = {
  label: string
  value: string
}

export type HeaderWarningPill = {
  label: string
  value: string
  tone: 'orange' | 'rose' | 'emerald'
}

function formatShortDate(value?: string) {
  if (!value) return '--/--'
  const [, month = '--', day = '--'] = value.split('-')
  return `${day}/${month}`
}

export function buildCompactWarningItems(input: {
  hardWarnings: DashboardWarning[]
  demands: DashboardDemand[]
  getShiftName: (shiftId: string) => string
  getEmployeeName: (employeeId: string) => string
  getPositionName: (positionId: string) => string
  limit?: number
}): CompactWarningItem[] {
  const hard = input.hardWarnings.map(warning => {
    const date = formatShortDate(warning.date)

    switch (warning.type) {
      case 'duplicate_shift':
        return { tone: 'hard' as const, text: `${input.getEmployeeName(warning.employee_id || '')} · ${date} · trùng 2 ca` }
      case 'missing_reason':
        return { tone: 'hard' as const, text: `${input.getShiftName(warning.shift_id || '')} · ${date} · thiếu lý do đổi lịch` }
      case 'invalid_employee':
        return { tone: 'hard' as const, text: `${input.getEmployeeName(warning.employee_id || '')} · nhân sự không hợp lệ` }
      case 'over_max_headcount':
        return { tone: 'hard' as const, text: `${input.getShiftName(warning.shift_id || '')} · ${date} · vượt số người` }
      case 'under_min_required_role':
        return { tone: 'hard' as const, text: `${input.getShiftName(warning.shift_id || '')} · ${date} · chưa đạt tối thiểu` }
      default:
        return { tone: 'hard' as const, text: `${input.getShiftName(warning.shift_id || '')} · ${date} · cần kiểm tra` }
    }
  })

  const soft = input.demands
    .filter(demand => demand.missing_count > 0)
    .sort((left, right) => right.missing_count - left.missing_count)
    .map(demand => ({
      tone: 'soft' as const,
      text: `${input.getShiftName(demand.shift_template_id)} · ${formatShortDate(demand.date)} · thiếu ${demand.missing_count} · ${input.getPositionName(demand.position_id)}`,
    }))

  return [...hard, ...soft]
    .filter((item, index, items) => items.findIndex(entry => entry.text === item.text) === index)
    .slice(0, input.limit ?? 5)
}

export function buildWeeklySummaryCards(input: {
  incompleteSlots: number
  emptySlots: number
  requiresPublishedReason: boolean
}): SummaryCard[] {
  return [
    {
      title: 'Cần xử lý ngay',
      value: input.incompleteSlots > 0 ? `${input.incompleteSlots} ô thiếu người` : 'Không còn ô thiếu người',
      hint: input.emptySlots > 0 ? `${input.emptySlots} ô còn trống` : 'Board đã kín người',
    },
    {
      title: 'Sau khi chốt',
      value: input.requiresPublishedReason ? 'Mọi thay đổi cần lý do' : 'Hệ thống sẽ gửi thông báo',
      hint: input.requiresPublishedReason ? 'Lưu lại lịch sử điều chỉnh' : 'Nhân sự nhận lịch chính thức',
    },
  ]
}

export function buildHeaderMetrics(input: {
  scheduledEmployees: number
  totalDemand: number
  totalAssigned: number
  emptySlots: number
  hardWarningCount: number
  softWarningCount: number
}): {
  primary: HeaderMetric[]
  warning: HeaderWarningPill
} {
  const warningCount = input.hardWarningCount + input.softWarningCount
  const warning = input.emptySlots > 0
    ? { label: 'Còn trống', value: String(input.emptySlots), tone: 'orange' as const }
    : warningCount > 0
      ? { label: 'Cảnh báo', value: String(warningCount), tone: 'rose' as const }
      : { label: 'Ổn định', value: 'OK', tone: 'emerald' as const }

  return {
    primary: [
      { label: 'Nhân sự đã xếp', value: String(input.scheduledEmployees) },
      { label: 'Nhu cầu', value: String(input.totalDemand) },
      { label: 'Đã gán', value: String(input.totalAssigned) },
    ],
    warning,
  }
}
