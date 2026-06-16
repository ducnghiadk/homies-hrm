import type { AssignmentBoardData, AssignmentRecommendation } from '@/lib/services/schedule-service'

export type WeekOverviewTone = 'empty' | 'warning' | 'critical' | 'full'

export type WeekOverviewCard = {
  date: string
  dayLabel: string
  registeredCount: number
  requiredCount: number
  shortageCount: number
  tone: WeekOverviewTone
  statusLabel: string
  summaryLabel: string
}

export type ScheduleRowTemplate = {
  id: string
  name: string
  start_time: string
  end_time: string
}

export type ScheduleCellViewModel = {
  date: string
  shiftTemplateId: string
  slotIds: string[]
  filledCount: number
  requiredCount: number
  shortageCount: number
  tone: WeekOverviewTone
  primaryLabel: string
  headline: string
  source: 'assigned' | 'registered' | 'empty'
  secondaryCount: number
  statusLabel: string
  actionLabel: string
  isSetup: boolean
}

export type ScheduleRowViewModel = {
  templateId: string
  templateName: string
  timeRange: string
  cells: ScheduleCellViewModel[]
}

export type RecommendationSection = {
  id: 'registered' | 'review' | 'backup'
  title: string
  description: string
  items: AssignmentRecommendation[]
}

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

function getDayLabel(value: string) {
  const date = parseDateKey(value)
  return DAY_LABELS[(date.getDay() + 6) % 7]
}

function getTone(requiredCount: number, filledCount: number): WeekOverviewTone {
  if (requiredCount <= 0) return 'empty'
  const shortage = Math.max(requiredCount - filledCount, 0)
  if (shortage === 0) return 'full'
  if (filledCount === 0 || shortage >= 2) return 'critical'
  return 'warning'
}

function getStatusLabel(tone: WeekOverviewTone, shortageCount: number) {
  if (tone === 'empty') return 'Chua setup'
  if (tone === 'full') return 'Du nguoi'
  return `Thieu ${shortageCount} ca`
}

function buildEmployeeNameMap(board: AssignmentBoardData) {
  return new Map(board.employees.map(item => [item.employee.id, item.employee.full_name]))
}

function getHeadline(primaryLabel: string, secondaryCount: number) {
  return secondaryCount > 0 ? `${primaryLabel} +${secondaryCount}` : primaryLabel
}

export function buildWeekOverviewCards(board: AssignmentBoardData, weekDates: string[]): WeekOverviewCard[] {
  return weekDates.map(date => {
    const daySlots = board.demands.filter(slot => slot.date === date)
    const requiredCount = daySlots.reduce((sum, slot) => sum + slot.required_count, 0)
    const filledCount = daySlots.reduce((sum, slot) => sum + slot.filled_count, 0)
    const registeredIds = new Set(daySlots.flatMap(slot => [...slot.preferred_employee_ids, ...slot.available_employee_ids]))
    const shortageCount = Math.max(requiredCount - filledCount, 0)
    const tone = getTone(requiredCount, filledCount)

    return {
      date,
      dayLabel: getDayLabel(date),
      registeredCount: registeredIds.size,
      requiredCount,
      shortageCount,
      tone,
      statusLabel: getStatusLabel(tone, shortageCount),
      summaryLabel: `${registeredIds.size}/${requiredCount} da dang ky`,
    }
  })
}

export function buildScheduleRows(input: {
  board: AssignmentBoardData
  weekDates: string[]
  templates: ScheduleRowTemplate[]
}): ScheduleRowViewModel[] {
  const employeeNameMap = buildEmployeeNameMap(input.board)

  return input.templates.map(template => ({
    templateId: template.id,
    templateName: template.name,
    timeRange: `${template.start_time} - ${template.end_time}`,
    cells: input.weekDates.map(date => {
      const slots = input.board.demands
        .filter(slot => slot.date === date && slot.shift_template_id === template.id)
        .sort((left, right) => {
          if (right.missing_count !== left.missing_count) return right.missing_count - left.missing_count
          return right.required_count - left.required_count
        })

      const requiredCount = slots.reduce((sum, slot) => sum + slot.required_count, 0)
      const filledCount = slots.reduce((sum, slot) => sum + slot.filled_count, 0)
      const shortageCount = Math.max(requiredCount - filledCount, 0)
      const assignedIds = slots.flatMap(slot => slot.assigned_employee_ids)
      const registeredIds = slots.flatMap(slot => [...slot.preferred_employee_ids, ...slot.available_employee_ids])
      const headlineIds = assignedIds.length > 0 ? assignedIds : registeredIds
      const primaryId = headlineIds[0]
      const tone = getTone(requiredCount, filledCount)
      const primaryLabel = primaryId ? (employeeNameMap.get(primaryId) || primaryId) : 'Chua co nguoi'
      const secondaryCount = Math.max(headlineIds.length - 1, 0)

      return {
        date,
        shiftTemplateId: template.id,
        slotIds: slots.map(slot => slot.id),
        filledCount,
        requiredCount,
        shortageCount,
        tone,
        primaryLabel,
        headline: primaryId ? getHeadline(primaryLabel, secondaryCount) : 'Chua co nguoi',
        source: assignedIds.length > 0 ? 'assigned' : (registeredIds.length > 0 ? 'registered' : 'empty'),
        secondaryCount,
        statusLabel: tone === 'full' ? 'Da du' : (requiredCount <= 0 ? 'Chua setup' : `Con thieu ${shortageCount}`),
        actionLabel: primaryId ? 'Mo xep nguoi' : 'Bam de xep nguoi',
        isSetup: slots.length > 0,
      }
    }),
  }))
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

export function filterRecommendationsBySearch(recommendations: AssignmentRecommendation[], query: string) {
  const normalizedQuery = normalizeSearchText(query)
  if (!normalizedQuery) return recommendations

  return recommendations.filter(item => {
    const haystack = normalizeSearchText([
      item.employee_name,
      item.position_name,
      item.label,
      item.reason,
      item.same_day_shift_name || '',
    ].join(' '))

    return haystack.includes(normalizedQuery)
  })
}

export function buildRecommendationSections(recommendations: AssignmentRecommendation[]): RecommendationSection[] {
  const sections: RecommendationSection[] = [
    {
      id: 'registered',
      title: 'Da dang ky phu hop',
      description: 'Uu tien gan nhung nguoi da chu dong dang ky ca nay.',
      items: recommendations.filter(item => (item.preference === 'preferred' || item.preference === 'available') && !item.has_same_day_assignment),
    },
    {
      id: 'review',
      title: 'Can xem lai',
      description: 'Nhung truong hop da dang ky nhung con xung dot nhe hoac can xac nhan them.',
      items: recommendations.filter(item => (item.preference === 'preferred' || item.preference === 'available') && item.has_same_day_assignment),
    },
    {
      id: 'backup',
      title: 'Co the bo sung',
      description: 'Nguon tang cuong khi nhom da dang ky chua du lap ca.',
      items: recommendations.filter(item => item.preference === 'unknown' || item.preference === 'unavailable'),
    },
  ]

  return sections.filter(section => section.items.length > 0)
}
