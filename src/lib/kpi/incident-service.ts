import type { KpiActor, KpiIncident } from './types.ts'

export interface CreateIncidentInput {
  store_id: string
  employee_id: string
  occurred_at: string
  source: KpiIncident['source']
  primary_violation_code: string
  description: string
  evidence_refs: string[]
}

export interface SecondaryViolationInput {
  code: string
  independent_behavior: boolean
  reason: string
  evidence_refs: string[]
}

export interface AttendanceIncidentInput {
  store_id: string
  employee_id: string
  occurred_at: string
  attendance_reference_id: string
  minutes_late: number
}

export interface KpiIncidentPolicy {
  criterion_mappings: Record<string, string>
  manager_accountability_allowed_codes: string[]
}

export interface KpiIncidentImpact {
  criterion_id?: string
  suggested_score?: number
  promotion_block_months: number
  manager_accountability_proposed: boolean
}

const SEVERITY_RULES: Record<string, { suggested_score?: number; promotion_block_months: number }> = {
  attendance_late: { suggested_score: 3, promotion_block_months: 0 },
  attendance_no_show: { suggested_score: 1, promotion_block_months: 3 },
  wrong_topping: { suggested_score: 2, promotion_block_months: 1 },
  hygiene_breach: { suggested_score: 1, promotion_block_months: 3 },
  cash_shortage: { suggested_score: 2, promotion_block_months: 2 },
  customer_complaint: { suggested_score: 3, promotion_block_months: 0 },
}

export function createIncident(input: CreateIncidentInput, actor: KpiActor): KpiIncident {
  assertCanLogIncident(actor)
  assertRequiredText(input.primary_violation_code, 'Can chon loi goc')
  assertRequiredText(input.description, 'Can mo ta ro su co')
  assertEvidence(input.evidence_refs, 'Can co it nhat 1 bang chung cho ho so su co')

  return {
    id: `incident_${input.employee_id}_${toCompactTime(input.occurred_at)}`,
    store_id: input.store_id,
    employee_id: input.employee_id,
    occurred_at: input.occurred_at,
    source: input.source,
    status: 'confirmed',
    violations: [
      {
        code: input.primary_violation_code,
        primary: true,
        independent_behavior: true,
        reason: 'Loi goc',
        evidence_refs: uniqueRefs(input.evidence_refs),
      },
    ],
    description: input.description.trim(),
    evidence_refs: uniqueRefs(input.evidence_refs),
  }
}

export function addSecondaryViolation(incident: KpiIncident, input: SecondaryViolationInput): KpiIncident {
  assertRequiredText(input.code, 'Can chon loi phu')
  assertRequiredText(input.reason, 'Can ghi ro ly do tach loi phu')
  assertEvidence(input.evidence_refs, 'Loi phu phai co bang chung rieng')

  if (!input.independent_behavior) {
    throw new Error('Khong duoc tach loi phu neu day chi la hau qua cua loi goc')
  }

  if (incident.violations.some((violation) => violation.code === input.code)) {
    throw new Error('Ho so nay da co ma loi nay, khong duoc phat trung')
  }

  return {
    ...incident,
    violations: [
      ...incident.violations,
      {
        code: input.code,
        primary: false,
        independent_behavior: true,
        reason: input.reason.trim(),
        evidence_refs: uniqueRefs(input.evidence_refs),
      },
    ],
    evidence_refs: uniqueRefs([...incident.evidence_refs, ...input.evidence_refs]),
  }
}

export function proposeAttendanceIncident(input: AttendanceIncidentInput): KpiIncident {
  if (input.minutes_late <= 0) {
    throw new Error('So phut di tre phai lon hon 0')
  }

  return {
    id: `incident_attendance_${input.employee_id}_${toCompactTime(input.occurred_at)}`,
    store_id: input.store_id,
    employee_id: input.employee_id,
    occurred_at: input.occurred_at,
    source: 'attendance',
    status: 'proposed',
    violations: [
      {
        code: 'attendance_late',
        primary: true,
        independent_behavior: true,
        reason: `Tre ${input.minutes_late} phut tu he thong cham cong`,
        evidence_refs: [input.attendance_reference_id],
      },
    ],
    description: `Cham cong ghi nhan di tre ${input.minutes_late} phut`,
    evidence_refs: [input.attendance_reference_id],
  }
}

export function confirmAttendanceIncident(incident: KpiIncident, leader: KpiActor, note: string): KpiIncident {
  assertCanLogIncident(leader)
  assertRequiredText(note, 'Leader can ghi chu khi xac nhan su co attendance')

  if (incident.status !== 'proposed') {
    throw new Error('Chi incident de xuat moi duoc xac nhan')
  }

  return {
    ...incident,
    status: 'confirmed',
    description: `${incident.description}. Leader xac nhan: ${note.trim()}`,
  }
}

export function calculateIncidentImpact(incident: KpiIncident, policy: KpiIncidentPolicy): KpiIncidentImpact {
  const primary = incident.violations.find((violation) => violation.primary)

  if (!primary) {
    throw new Error('Ho so su co phai co 1 loi goc')
  }

  const relatedViolations = incident.violations.filter((violation) => violation.primary || violation.independent_behavior)
  const rules = relatedViolations.map((violation) => SEVERITY_RULES[violation.code] ?? { promotion_block_months: 0 })
  const mappedCriterion = policy.criterion_mappings[primary.code]
  const suggestedScore = rules.reduce<number | undefined>((lowest, rule) => {
    if (rule.suggested_score === undefined) return lowest
    if (lowest === undefined) return rule.suggested_score
    return Math.min(lowest, rule.suggested_score)
  }, undefined)

  return {
    criterion_id: mappedCriterion,
    suggested_score: suggestedScore,
    promotion_block_months: Math.max(...rules.map((rule) => rule.promotion_block_months), 0),
    manager_accountability_proposed: relatedViolations.some((violation) => (
      policy.manager_accountability_allowed_codes.includes(violation.code)
    )),
  }
}

function assertCanLogIncident(actor: KpiActor) {
  if (!['shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo'].includes(actor.role)) {
    throw new Error('Vai tro hien tai khong duoc tao ho so su co')
  }
}

function assertRequiredText(value: string, message: string) {
  if (!value.trim()) {
    throw new Error(message)
  }
}

function assertEvidence(evidenceRefs: string[], message: string) {
  if (uniqueRefs(evidenceRefs).length === 0) {
    throw new Error(message)
  }
}

function uniqueRefs(items: string[]) {
  return Array.from(new Set(items.map((item) => item.trim()).filter(Boolean)))
}

function toCompactTime(value: string) {
  return value.replace(/[^0-9]/g, '').slice(0, 12)
}
