import type {
  KpiPeerAssignment,
  KpiPeerReviewPolicy,
} from './types'

export interface KpiPeerCandidateFact {
  employee_id: string
  role: 'employee' | 'shift_leader' | 'store_manager'
  status: 'active' | 'inactive'
  probation: boolean
  suspended: boolean
  serious_incident_open: boolean
  total_shifts: number
  shared_shifts: number
  reviewed_subject_last_month: boolean
  reciprocal_in_period: boolean
}

export interface KpiRankedPeerCandidate {
  employee_id: string
  rank: number
  total_shifts: number
  shared_shifts: number
  reason_label: string
}

function addHoursToIso(isoString: string, hours: number): string {
  const date = new Date(isoString)
  date.setTime(date.getTime() + hours * 60 * 60 * 1000)
  return date.toISOString()
}

export function rankPeerCandidates(input: {
  subject_id: string
  primary_reviewer_id?: string
  facts: KpiPeerCandidateFact[]
  policy: KpiPeerReviewPolicy
}): KpiRankedPeerCandidate[] {
  const { subject_id, primary_reviewer_id, facts, policy } = input

  const eligibleFacts = facts.filter((fact) => {
    if (fact.employee_id === subject_id) return false
    if (primary_reviewer_id && fact.employee_id === primary_reviewer_id) return false
    if (fact.status !== 'active') return false
    if (fact.role !== 'employee') return false
    if (policy.exclude_probation && fact.probation) return false
    if (policy.exclude_suspended && fact.suspended) return false
    if (fact.serious_incident_open) return false
    if (fact.reciprocal_in_period) return false
    if (fact.total_shifts < policy.min_total_shifts) return false
    if (fact.shared_shifts < policy.min_shared_shifts) return false
    return true
  })

  // Sắp xếp thứ tự ổn định:
  // 1. Số ca làm chung nhiều hơn xếp trước (đảm bảo quan sát trực tiếp tốt)
  // 2. Cùng ca làm chung: ưu tiên người tháng trước chưa đánh giá subject
  // 3. Tổng ca làm việc nhiều hơn xếp trước
  // 4. Mã nhân viên so sánh alphabet để đảm bảo kết quả ổn định
  const sorted = [...eligibleFacts].sort((a, b) => {
    if (b.shared_shifts !== a.shared_shifts) {
      return b.shared_shifts - a.shared_shifts
    }
    if (a.reviewed_subject_last_month !== b.reviewed_subject_last_month) {
      return a.reviewed_subject_last_month ? 1 : -1
    }
    if (b.total_shifts !== a.total_shifts) {
      return b.total_shifts - a.total_shifts
    }
    return a.employee_id.localeCompare(b.employee_id)
  })

  return sorted.map((fact, index) => ({
    employee_id: fact.employee_id,
    rank: index + 1,
    total_shifts: fact.total_shifts,
    shared_shifts: fact.shared_shifts,
    reason_label: `Làm chung ${fact.shared_shifts} ca · Tổng ${fact.total_shifts} ca`,
  }))
}

export function selectPeerReviewers(input: {
  monthly_review_id: string
  candidates: KpiRankedPeerCandidate[]
  reviewer_ids: string[]
  actor_id: string
  selected_at: string
  policy: KpiPeerReviewPolicy
}): KpiPeerAssignment[] {
  const {
    monthly_review_id,
    candidates,
    reviewer_ids,
    actor_id,
    selected_at,
    policy,
  } = input

  if (reviewer_ids.length !== policy.required_reviewer_count) {
    throw new Error(
      `Phải chọn đúng ${policy.required_reviewer_count} người đồng nghiệp đánh giá.`
    )
  }

  const deadline = addHoursToIso(selected_at, policy.reviewer_deadline_hours)

  return reviewer_ids.map((reviewer_id) => {
    const candidate = candidates.find((c) => c.employee_id === reviewer_id)
    return {
      id: `peer_assignment_${monthly_review_id}_${reviewer_id}`,
      monthly_review_id,
      reviewer_id,
      rank: candidate ? candidate.rank : 99,
      shared_shift_count: candidate ? candidate.shared_shifts : 0,
      total_shift_count: candidate ? candidate.total_shifts : 0,
      selected_by: 'manager' as const,
      selected_by_actor_id: actor_id,
      status: 'assigned' as const,
      assigned_at: selected_at,
      deadline_at: deadline,
    }
  })
}

export function autoSelectPeerReviewers(input: {
  monthly_review_id: string
  candidates: KpiRankedPeerCandidate[]
  selected_at: string
  policy: KpiPeerReviewPolicy
}): KpiPeerAssignment[] {
  const { monthly_review_id, candidates, selected_at, policy } = input

  const topCandidates = candidates.slice(0, policy.required_reviewer_count)
  const deadline = addHoursToIso(selected_at, policy.reviewer_deadline_hours)

  return topCandidates.map((candidate) => ({
    id: `peer_assignment_${monthly_review_id}_${candidate.employee_id}`,
    monthly_review_id,
    reviewer_id: candidate.employee_id,
    rank: candidate.rank,
    shared_shift_count: candidate.shared_shifts,
    total_shift_count: candidate.total_shifts,
    selected_by: 'system' as const,
    status: 'assigned' as const,
    assigned_at: selected_at,
    deadline_at: deadline,
  }))
}

export function activateReplacementReviewer(input: {
  expired_assignment: KpiPeerAssignment
  existing_assignments: KpiPeerAssignment[]
  candidates: KpiRankedPeerCandidate[]
  activated_at: string
  policy: KpiPeerReviewPolicy
}): { expired: KpiPeerAssignment; replacement?: KpiPeerAssignment } {
  const {
    expired_assignment,
    existing_assignments,
    candidates,
    activated_at,
    policy,
  } = input

  const expired: KpiPeerAssignment = {
    ...expired_assignment,
    status: 'expired',
  }

  const assignedReviewerIds = new Set(
    existing_assignments.map((a) => a.reviewer_id)
  )

  const nextCandidate = candidates.find(
    (c) => !assignedReviewerIds.has(c.employee_id)
  )

  if (!nextCandidate) {
    return { expired }
  }

  const deadline = addHoursToIso(activated_at, policy.reviewer_deadline_hours)

  const replacement: KpiPeerAssignment = {
    id: `peer_assignment_${expired_assignment.monthly_review_id}_${nextCandidate.employee_id}`,
    monthly_review_id: expired_assignment.monthly_review_id,
    reviewer_id: nextCandidate.employee_id,
    rank: nextCandidate.rank,
    shared_shift_count: nextCandidate.shared_shifts,
    total_shift_count: nextCandidate.total_shifts,
    selected_by: 'system',
    status: 'assigned',
    assigned_at: activated_at,
    deadline_at: deadline,
    replacement_for_assignment_id: expired_assignment.id,
  }

  return { expired, replacement }
}
