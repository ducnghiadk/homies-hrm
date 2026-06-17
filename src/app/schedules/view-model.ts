import { getPositionById } from '@/lib/mock-data'
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

export type ScheduleCellPreviewAssignment = {
  employeeId: string
  employeeName: string
  positionLabel?: string
  source: 'assigned' | 'registered'
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
  previewNames: string[]
  previewAssignments: ScheduleCellPreviewAssignment[]
  source: 'assigned' | 'registered' | 'empty'
  secondaryCount: number
  statusLabel: string
  actionLabel: string
  isSetup: boolean
  primaryPositionLabel?: string
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
  if (tone === 'full') return 'Da du'
  return `Thieu ${shortageCount} ca`
}

function repairPositionLabel(value: string) {
  if (value.startsWith('Thu ng') && value.endsWith('n')) return 'Thu ngan'
  return value
}

function getDisplayPositionName(positionId: string) {
  return repairPositionLabel(getPositionById(positionId)?.name || positionId)
}

function buildEmployeeNameMap(board: AssignmentBoardData) {
  return new Map(board.employees.map(item => [item.employee.id, item.employee.full_name]))
}

function buildEmployeePositionMap(board: AssignmentBoardData) {
  return new Map(
    board.employees.map(item => [
      item.employee.id,
      getDisplayPositionName(item.employee.position_id || ''),
    ]),
  )
}

function mergeUniqueIds(...groups: string[][]) {
  return Array.from(new Set(groups.flat().filter(Boolean)))
}

function getHeadline(primaryLabel: string, secondaryCount: number) {
  return secondaryCount > 0 ? `${primaryLabel} +${secondaryCount}` : primaryLabel
}

function getPreviewNames(ids: string[], employeeNameMap: Map<string, string>) {
  return ids
    .map(id => employeeNameMap.get(id) || id)
    .filter((value, index, items) => items.indexOf(value) === index)
}

function findEmployeeSlot(
  slots: AssignmentBoardData['demands'],
  employeeId: string | undefined,
) {
  if (!employeeId) return slots[0]

  return (
    slots.find(slot => slot.assigned_employee_ids.includes(employeeId)) ||
    slots.find(
      slot =>
        slot.preferred_employee_ids.includes(employeeId) ||
        slot.available_employee_ids.includes(employeeId),
    ) ||
    slots[0]
  )
}

function buildPreviewAssignments(
  slots: AssignmentBoardData['demands'],
  assignedIds: string[],
  registeredIds: string[],
  employeeNameMap: Map<string, string>,
  employeePositionMap: Map<string, string>,
): ScheduleCellPreviewAssignment[] {
  const seen = new Set<string>()
  const orderedItems = [
    ...assignedIds.map(id => ({ id, source: 'assigned' as const })),
    ...registeredIds.map(id => ({ id, source: 'registered' as const })),
  ]

  return orderedItems.flatMap(item => {
    if (!item.id || seen.has(item.id)) return []
    seen.add(item.id)
    const slot = findEmployeeSlot(slots, item.id)

    return [{
      employeeId: item.id,
      employeeName: employeeNameMap.get(item.id) || item.id,
      positionLabel: slot
        ? getDisplayPositionName(slot.position_id || employeePositionMap.get(item.id) || '')
        : employeePositionMap.get(item.id),
      source: item.source,
    }]
  })
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
  const employeePositionMap = buildEmployeePositionMap(input.board)

  return input.templates.map(template => ({
    templateId: template.id,
    templateName: template.name,
    timeRange: `${template.start_time} - ${template.end_time}`,
    cells: input.weekDates.map(date => {
      const slots = input.board.demands
        .filter(slot => slot.date === date && slot.shift_template_id === template.id)
        .sort((left, right) => {
          if (right.missing_count !== left.missing_count) return right.missing_count - left.missing_count
          if (right.required_count !== left.required_count) return right.required_count - left.required_count
          return getDisplayPositionName(left.position_id).localeCompare(getDisplayPositionName(right.position_id))
        })

      const requiredCount = slots.reduce((sum, slot) => sum + slot.required_count, 0)
      const filledCount = slots.reduce((sum, slot) => sum + slot.filled_count, 0)
      const shortageCount = Math.max(requiredCount - filledCount, 0)
      const assignedIds = mergeUniqueIds(...slots.map(slot => slot.assigned_employee_ids))
      const registeredIds = mergeUniqueIds(...slots.map(slot => [...slot.preferred_employee_ids, ...slot.available_employee_ids]))
      const headlineIds = assignedIds.length > 0 ? mergeUniqueIds(assignedIds, registeredIds) : registeredIds
      const previewAssignments = buildPreviewAssignments(
        slots,
        assignedIds,
        registeredIds,
        employeeNameMap,
        employeePositionMap,
      )
      const previewNames = getPreviewNames(headlineIds, employeeNameMap)
      const primaryAssignment = previewAssignments[0]
      const primaryLabel = primaryAssignment?.employeeName || previewNames[0] || 'Chua co nguoi'
      const tone = getTone(requiredCount, filledCount)
      const secondaryCount = Math.max(previewAssignments.length - 1, 0)
      const primaryPositionLabel = primaryAssignment?.positionLabel

      return {
        date,
        shiftTemplateId: template.id,
        slotIds: slots.map(slot => slot.id),
        filledCount,
        requiredCount,
        shortageCount,
        tone,
        primaryLabel,
        headline: previewNames.length > 0 ? getHeadline(primaryLabel, secondaryCount) : 'Chua co nguoi',
        previewNames,
        previewAssignments,
        source: assignedIds.length > 0 ? 'assigned' : (registeredIds.length > 0 ? 'registered' : 'empty'),
        secondaryCount,
        statusLabel: tone === 'full' ? 'Da du' : (requiredCount <= 0 ? 'Chua setup' : `Con thieu ${shortageCount}`),
        actionLabel: previewNames.length > 0 ? 'Mo xep nguoi' : 'Bam de xep nguoi',
        isSetup: slots.length > 0,
        primaryPositionLabel,
      }
    }),
  }))
}

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ä‘/g, 'd')
    .replace(/Ä/g, 'D')
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

function buildCompactReason(item: AssignmentRecommendation) {
  if (item.is_assigned) return 'Dang giu ca nay'
  if (item.has_same_day_assignment) return `Can kiem tra ${item.same_day_shift_name?.toLowerCase() || 'ca cung ngay'}`
  if (item.preference === 'preferred' || item.preference === 'available') return 'Da dang ky truoc'
  return 'Co the bo sung neu can'
}

function buildCompactLabel(item: AssignmentRecommendation) {
  if (item.is_assigned) return 'Dang giu ca'
  if (item.has_same_day_assignment) return 'Can can nhac'
  if (item.preference === 'preferred') return 'Uu tien'
  if (item.preference === 'available') return 'San sang'
  return 'Bo sung'
}

export function buildRecommendationSections(recommendations: AssignmentRecommendation[]): RecommendationSection[] {
  const prioritized = recommendations
    .filter(item => item.preference === 'preferred' || item.preference === 'available')
    .map(item => ({
      ...item,
      label: buildCompactLabel(item),
      reason: buildCompactReason(item),
    }))

  const backup = recommendations
    .filter(item => item.preference === 'unknown' || item.preference === 'unavailable')
    .map(item => ({
      ...item,
      label: buildCompactLabel(item),
      reason: buildCompactReason(item),
    }))

  const sections: RecommendationSection[] = [
    {
      id: 'registered',
      title: 'Da dang ky va phu hop',
      description: 'Uu tien nguoi da dang ky truoc.',
      items: prioritized,
    },
    {
      id: 'backup',
      title: 'Co the bo sung',
      description: 'Nguon tang cuong neu nhom uu tien chua du.',
      items: backup,
    },
  ]

  return sections.filter(section => section.items.length > 0)
}
