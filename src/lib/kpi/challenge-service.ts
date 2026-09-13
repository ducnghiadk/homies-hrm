import { DEFAULT_KPI_POLICY } from './default-policy.ts'
import type { KpiLevelCode } from './types.ts'

export type ChallengeStatus =
  | 'approved'
  | 'active'
  | 'passed'
  | 'extended_once'
  | 'failed'
  | 'stopped_for_serious_incident'

export type ChallengeCheckpoint = 'week_2' | 'week_4' | 'final'

export interface ChallengeCheckIn {
  checkpoint: ChallengeCheckpoint
  actor_id: string
  note: string
  recorded_at: string
}

export interface KpiChallenge {
  id: string
  development_case_id: string
  employee_id: string
  current_level: KpiLevelCode
  target_level: KpiLevelCode
  duration_label: string
  required_checkpoints: ChallengeCheckpoint[]
  status: ChallengeStatus
  approved_by: string
  approved_at: string
  check_ins: ChallengeCheckIn[]
  extension_count: number
  extension_reason?: string
  final_decision_note?: string
  return_to_level?: KpiLevelCode
  stop_incident_id?: string
}

export function createChallenge(input: {
  development_case_id: string
  employee_id: string
  current_level: KpiLevelCode
  target_level: KpiLevelCode
  approved_by: string
  approved_at: string
}): KpiChallenge {
  const path = getPromotionPath(input.current_level, input.target_level)
  const duration = path?.challenge_duration_months ?? '1'

  return {
    id: `challenge_${input.development_case_id}`,
    development_case_id: input.development_case_id,
    employee_id: input.employee_id,
    current_level: input.current_level,
    target_level: input.target_level,
    duration_label: duration,
    required_checkpoints: duration === '1' ? ['week_2', 'final'] : ['week_2', 'week_4', 'final'],
    status: 'active',
    approved_by: input.approved_by,
    approved_at: input.approved_at,
    check_ins: [],
    extension_count: 0,
  }
}

export function recordChallengeCheckIn(
  challenge: KpiChallenge,
  input: {
    checkpoint: ChallengeCheckpoint
    actor_id: string
    note: string
    recorded_at: string
  }
): KpiChallenge {
  if (!['active', 'extended_once'].includes(challenge.status)) {
    throw new Error('Chi duoc ghi check-in khi challenge dang dien ra')
  }

  const existing = challenge.check_ins.find((item) => item.checkpoint === input.checkpoint)

  return {
    ...challenge,
    check_ins: existing
      ? challenge.check_ins.map((item) => (item.checkpoint === input.checkpoint ? input : item))
      : [...challenge.check_ins, input],
  }
}

export function extendChallenge(
  challenge: KpiChallenge,
  input: {
    actor_id: string
    reason: string
    recorded_at: string
  }
): KpiChallenge {
  if (challenge.extension_count >= 1) {
    throw new Error('Chi duoc gia han toi da mot lan')
  }

  return {
    ...challenge,
    status: 'extended_once',
    extension_count: challenge.extension_count + 1,
    extension_reason: `${input.recorded_at} • ${input.actor_id} • ${input.reason}`,
  }
}

export function stopChallengeForSeriousIncident(
  challenge: KpiChallenge,
  input: {
    actor_id: string
    incident_id: string
    note: string
    recorded_at: string
  }
): KpiChallenge {
  return {
    ...challenge,
    status: 'stopped_for_serious_incident',
    stop_incident_id: input.incident_id,
    final_decision_note: `${input.recorded_at} • ${input.actor_id} • ${input.note}`,
  }
}

export function finalizeChallenge(
  challenge: KpiChallenge,
  input: {
    actor_id: string
    result: 'passed' | 'failed'
    note: string
    recorded_at: string
  }
): KpiChallenge {
  const completedCheckpoints = new Set(challenge.check_ins.map((item) => item.checkpoint))
  const missingCheckpoint = challenge.required_checkpoints.some((checkpoint) => !completedCheckpoints.has(checkpoint))

  if (missingCheckpoint) {
    throw new Error('Phai hoan tat du cac moc challenge truoc khi chot')
  }

  return {
    ...challenge,
    status: input.result,
    final_decision_note: input.note,
    return_to_level: input.result === 'failed' ? challenge.current_level : undefined,
  }
}

function getPromotionPath(currentLevel: KpiLevelCode, targetLevel: KpiLevelCode) {
  return DEFAULT_KPI_POLICY.promotion_paths.find((item) => (
    item.from === currentLevel && item.to === targetLevel
  ))
}
