import { DEFAULT_KPI_POLICY } from './default-policy.ts'
import type { KpiActor, KpiAppeal, KpiEvaluation, KpiIncident } from './types.ts'

export function isEvaluationUsableForPromotion(input: {
  evaluation_status: KpiEvaluation['status']
  appeal_status?: KpiAppeal['status']
}): boolean {
  if (input.evaluation_status !== 'published') {
    return false
  }
  if (input.appeal_status === 'submitted' || input.appeal_status === 'reviewing') {
    return false
  }
  return true
}

export interface CreateKpiAppealInput {
  employee_id: string
  evaluation_id: string
  reason: string
  evidence_refs: string[]
  criterion_ids: string[]
  submitted_at: string
  published_at: string
  requester_id: string
}

export interface KpiAppealDecision {
  result: 'approved' | 'partially_approved' | 'rejected'
  note: string
  score_changes: Array<{ criterion_id: string; old_score: number; new_score: number }>
}

export interface CreateIncidentAppealInput {
  employee_id: string
  incident_id: string
  reason: string
  evidence_refs: string[]
  submitted_at: string
  confirmed_at: string
  requester_id: string
}

export interface IncidentAppealPolicy {
  manager_accountability_allowed_codes: string[]
}

export interface IncidentAppealDecisionInput {
  result: 'keep' | 'reclassify' | 'adjust_impact' | 'cancel'
  note: string
  reclassified_primary_code?: string
  suggested_score?: number
  promotion_block_months?: number
  manager_accountability?: {
    proposed: boolean
    same_shift: boolean
    reason?: string
    evidence_refs: string[]
  }
}

export interface IncidentAppealDecisionResult {
  appeal: KpiAppeal
  incident: KpiIncident
  impact_override?: {
    suggested_score?: number
    promotion_block_months: number
    manager_accountability_proposed: boolean
  }
  audit_note: string
}

export function getMonthlyAppealDeadline(publishedAt: string): string {
  const published = new Date(publishedAt).getTime()
  const deadline = published + DEFAULT_KPI_POLICY.monthly_appeal_hours * 60 * 60 * 1000

  return new Date(deadline).toISOString()
}

export function canSubmitMonthlyAppeal(now: string, publishedAt: string): boolean {
  const nowMs = new Date(now).getTime()
  const publishedMs = new Date(publishedAt).getTime()
  if (!Number.isFinite(nowMs) || !Number.isFinite(publishedMs)) return false

  return nowMs <= publishedMs + DEFAULT_KPI_POLICY.monthly_appeal_hours * 60 * 60 * 1000
}

export function getIncidentAppealDeadline(confirmedAt: string): string {
  const confirmed = new Date(confirmedAt).getTime()
  const deadline = confirmed + DEFAULT_KPI_POLICY.monthly_appeal_hours * 60 * 60 * 1000

  return new Date(deadline).toISOString()
}

export function canSubmitIncidentAppeal(now: string, confirmedAt: string): boolean {
  return new Date(now).getTime() <= new Date(getIncidentAppealDeadline(confirmedAt)).getTime()
}

export function createMonthlyAppeal(input: CreateKpiAppealInput): KpiAppeal {
  if (input.requester_id !== input.employee_id) {
    throw new Error('Chi chu ho so moi duoc gui khiếu nai')
  }

  if (!input.reason.trim()) {
    throw new Error('Can ghi ro ly do khiếu nai')
  }

  if (input.evidence_refs.length === 0 && input.criterion_ids.length === 0) {
    throw new Error('Can it nhat 1 reference de doi chieu')
  }

  if (!canSubmitMonthlyAppeal(input.submitted_at, input.published_at)) {
    throw new Error('Da qua han khiếu nai KPI 48 gio')
  }

  return {
    id: globalThis.crypto.randomUUID(),
    type: 'monthly_kpi',
    employee_id: input.employee_id,
    reference_id: input.evaluation_id,
    reason: input.reason.trim(),
    evidence_refs: Array.from(new Set([...input.evidence_refs, ...input.criterion_ids.map((id) => `criterion:${id}`)])),
    status: 'submitted',
    submitted_at: input.submitted_at,
    deadline_at: getMonthlyAppealDeadline(input.published_at),
  }
}

export function createIncidentAppeal(input: CreateIncidentAppealInput): KpiAppeal {
  if (input.requester_id !== input.employee_id) {
    throw new Error('Chi nhan su lien quan moi duoc gui khiáº¿u nai su co')
  }

  if (!input.reason.trim()) {
    throw new Error('Can ghi ro ly do khiáº¿u nai su co')
  }

  if (input.evidence_refs.length === 0) {
    throw new Error('Can co bang chung khi khiáº¿u nai su co')
  }

  if (!canSubmitIncidentAppeal(input.submitted_at, input.confirmed_at)) {
    throw new Error('Da qua han khiáº¿u nai su co 48 gio')
  }

  return {
    id: globalThis.crypto.randomUUID(),
    type: 'incident',
    employee_id: input.employee_id,
    reference_id: input.incident_id,
    reason: input.reason.trim(),
    evidence_refs: Array.from(new Set(input.evidence_refs.map((item) => item.trim()).filter(Boolean))),
    status: 'submitted',
    submitted_at: input.submitted_at,
    deadline_at: getIncidentAppealDeadline(input.confirmed_at),
  }
}

export function decideAppeal(appeal: KpiAppeal, decision: KpiAppealDecision, ceo: KpiActor): KpiAppeal {
  if (ceo.role !== 'ceo') {
    throw new Error('Chi CEO moi duoc quyet dinh khiếu nai KPI')
  }

  if (!decision.note.trim()) {
    throw new Error('Can ghi chu ket luan cua CEO')
  }

  return {
    ...appeal,
    status: decision.result,
  }
}

export function decideIncidentAppeal(
  incident: KpiIncident,
  appeal: KpiAppeal,
  decision: IncidentAppealDecisionInput,
  ceo: KpiActor,
  policy: IncidentAppealPolicy
): IncidentAppealDecisionResult {
  if (ceo.role !== 'ceo') {
    throw new Error('Chi CEO moi duoc quyet dinh khiáº¿u nai su co')
  }

  if (appeal.type !== 'incident') {
    throw new Error('Khong phai ho so khiáº¿u nai su co')
  }

  if (!decision.note.trim()) {
    throw new Error('Can ghi chu ket luan cua CEO')
  }

  const nextIncident = structuredClone(incident)
  let impactOverride: IncidentAppealDecisionResult['impact_override']

  if (decision.result === 'reclassify') {
    if (!decision.reclassified_primary_code?.trim()) {
      throw new Error('Can chon lai loi goc khi doi phan loai')
    }

    const currentPrimaryIndex = nextIncident.violations.findIndex((violation) => violation.primary)
    if (currentPrimaryIndex === -1) {
      throw new Error('Ho so su co phai co 1 loi goc')
    }

    nextIncident.violations[currentPrimaryIndex] = {
      ...nextIncident.violations[currentPrimaryIndex],
      code: decision.reclassified_primary_code.trim(),
      reason: `${nextIncident.violations[currentPrimaryIndex].reason}. CEO doi phan loai: ${decision.note.trim()}`,
    }
    nextIncident.status = 'finalized'
  }

  if (decision.result === 'adjust_impact') {
    impactOverride = {
      suggested_score: decision.suggested_score,
      promotion_block_months: decision.promotion_block_months ?? 0,
      manager_accountability_proposed: validateManagerAccountability(decision, incident, policy),
    }
    nextIncident.status = 'finalized'
  }

  if (decision.result === 'cancel') {
    nextIncident.status = 'cancelled'
    impactOverride = {
      suggested_score: undefined,
      promotion_block_months: 0,
      manager_accountability_proposed: false,
    }
  }

  if (decision.result === 'keep') {
    nextIncident.status = 'finalized'
    validateManagerAccountability(decision, incident, policy)
  }

  return {
    appeal: {
      ...appeal,
      status: mapIncidentDecisionToAppealStatus(decision.result),
    },
    incident: nextIncident,
    impact_override: impactOverride,
    audit_note: decision.note.trim(),
  }
}

function validateManagerAccountability(
  decision: IncidentAppealDecisionInput,
  incident: KpiIncident,
  policy: IncidentAppealPolicy
) {
  const managerAccountability = decision.manager_accountability
  if (!managerAccountability?.proposed) {
    return false
  }

  const hasAllowedCode = incident.violations.some((violation) => (
    policy.manager_accountability_allowed_codes.includes(violation.code)
  ))

  if (!hasAllowedCode) {
    throw new Error('Incident nay khong duoc phep de xuat lien doi leader')
  }

  if (!managerAccountability.same_shift) {
    throw new Error('Chi duoc lien doi leader neu dung ca phu trach')
  }

  if (!managerAccountability.reason?.trim()) {
    throw new Error('Can ghi ro ly do lien doi leader')
  }

  if (managerAccountability.evidence_refs.map((item) => item.trim()).filter(Boolean).length === 0) {
    throw new Error('Can co bang chung rieng khi lien doi leader')
  }

  return true
}

function mapIncidentDecisionToAppealStatus(result: IncidentAppealDecisionInput['result']): KpiAppeal['status'] {
  if (result === 'keep') return 'rejected'
  if (result === 'cancel') return 'approved'
  return 'partially_approved'
}
