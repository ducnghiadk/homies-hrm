import type { StaffAttribute } from '../mock-data-smart-schedule'

export type SchedulePosition = StaffAttribute['position']

const POSITION_ID_MAP: Record<string, SchedulePosition> = {
  'pos-001': 'barista',
  'pos-002': 'cashier',
  'pos-003': 'support',
  'pos-005': 'store_manager',
}

const POSITION_COMPATIBILITY = {
  barista: ['barista', 'cashier'],
  cashier: ['cashier', 'support', 'barista'],
  support: ['support', 'cashier'],
  store_manager: ['store_manager', 'barista', 'cashier', 'support'],
} satisfies Record<SchedulePosition, SchedulePosition[]>

export function positionIdToSchedulePosition(positionId: string): SchedulePosition | null {
  return POSITION_ID_MAP[positionId] ?? null
}

export function schedulePositionToPositionId(position: SchedulePosition): string | null {
  const entry = Object.entries(POSITION_ID_MAP).find(([, value]) => value === position)
  return entry?.[0] ?? null
}

export function getCompatibleSchedulePositions(position: SchedulePosition): SchedulePosition[] {
  return POSITION_COMPATIBILITY[position]
}

export function isSchedulePositionCompatible(
  employeePosition: SchedulePosition,
  requiredPosition: SchedulePosition,
): boolean {
  return getCompatibleSchedulePositions(employeePosition).includes(requiredPosition)
}

export function isEmployeeCompatibleWithPositionId(
  employeePositionId: string,
  requiredPositionId: string,
): boolean {
  const employeePosition = positionIdToSchedulePosition(employeePositionId)
  const requiredPosition = positionIdToSchedulePosition(requiredPositionId)

  if (!employeePosition || !requiredPosition) {
    return employeePositionId === requiredPositionId
  }

  return isSchedulePositionCompatible(employeePosition, requiredPosition)
}

export function getPositionCompatibilityWeight(
  employeePosition: SchedulePosition,
  requiredPosition: SchedulePosition,
): number {
  if (employeePosition === requiredPosition) return 1
  return isSchedulePositionCompatible(employeePosition, requiredPosition) ? 0.55 : 0
}
