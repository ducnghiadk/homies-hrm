type AssignmentModalSubtitleInput = {
  startTime?: string
  endTime?: string
  positionLabel?: string
  filledCount: number
  requiredCount: number
}

type AssignmentWarningLike = {
  type?: string
  message?: string
}

const SHIFT_CAPACITY_WARNING = 'Ca nay dang setup chua hop ly: nhu cau tung vi tri lon hon suc chua ca.'

export function buildAssignmentModalSubtitle({
  startTime,
  endTime,
  positionLabel,
  filledCount,
  requiredCount,
}: AssignmentModalSubtitleInput) {
  const parts = [`${startTime || ''} - ${endTime || ''}`.trim()]

  if (positionLabel) parts.push(positionLabel)

  parts.push(`Da xep ${filledCount}/${requiredCount} nguoi`)

  return parts.join(' - ')
}

export function buildAssignmentHeadcountLimitLabel(maxHeadcount?: number | null) {
  if (!maxHeadcount || maxHeadcount <= 0) return undefined
  return `Suc chua ca ${maxHeadcount} nguoi`
}

export function buildShiftDemandCapacityWarning(requiredCount: number, maxHeadcount?: number | null) {
  if (!maxHeadcount || maxHeadcount <= 0) return undefined
  if (requiredCount <= maxHeadcount) return undefined
  return SHIFT_CAPACITY_WARNING
}

export function buildAssignmentFailureMessage(
  warnings: AssignmentWarningLike[],
  fallback = 'Khong xep duoc nhan su vao ca. Hay kiem tra dieu kien va thu lai.',
) {
  const overMaxWarning = warnings.find(warning => warning.type === 'over_max_headcount')
  if (overMaxWarning) {
    return SHIFT_CAPACITY_WARNING
  }

  const firstWarning = warnings.find(warning => warning.message?.trim())
  if (firstWarning?.message) return firstWarning.message

  return fallback
}
