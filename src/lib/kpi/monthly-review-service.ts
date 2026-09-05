import type {
  KpiActor,
  KpiEmployeeRef,
  KpiEvaluation,
  KpiEvaluationIntegrityFlag,
  KpiMonthlyReview,
  KpiPeerReviewPolicy,
} from './types'

export interface MonthlyReviewBlockerInput {
  primary_submitted: boolean
  important_source_unconfirmed?: boolean
  extreme_score_evidence_missing?: boolean
  serious_incident_open?: boolean
  appeal_open?: boolean
  integrity_flags_blocking?: boolean
  returned_changes_pending?: boolean
}

export type KpiMonthlyReviewBlockerCode =
  | 'PRIMARY_REVIEW_MISSING'
  | 'IMPORTANT_SOURCE_UNCONFIRMED'
  | 'EXTREME_SCORE_EVIDENCE_MISSING'
  | 'SERIOUS_INCIDENT_OPEN'
  | 'APPEAL_OPEN'
  | 'INTEGRITY_REVIEW_REQUIRED'
  | 'RETURNED_CHANGES_PENDING'

export function isManagerApprovalActionAvailable(review: KpiMonthlyReview): boolean {
  return review.status === 'manager_approval_pending'
}

function addHoursToIso(isoString: string, hours: number): string {
  const date = new Date(isoString)
  date.setTime(date.getTime() + hours * 60 * 60 * 1000)
  return date.toISOString()
}

function normalizeStoreScope(storeId?: string): string | undefined {
  return storeId?.replace(/^store[_-]/, 'store-')
}

function assertStoreManagerScope(review: KpiMonthlyReview, actor: KpiActor): void {
  if (actor.role !== 'store_manager') {
    throw new Error('Chỉ Quản lý cửa hàng mới được duyệt đánh giá tháng.')
  }

  if (normalizeStoreScope(review.store_id) !== normalizeStoreScope(actor.store_id)) {
    throw new Error('Bạn không có quyền duyệt đánh giá của cửa hàng khác.')
  }
}

export function createMonthlyReview(input: {
  period_id: string
  evaluation_id: string
  employee: KpiEmployeeRef
  subject_role: 'employee' | 'shift_leader'
  primary_reviewer_id: string
  peer_policy: KpiPeerReviewPolicy
  opened_at: string
}): KpiMonthlyReview {
  const {
    period_id,
    evaluation_id,
    employee,
    subject_role,
    primary_reviewer_id,
    peer_policy,
    opened_at,
  } = input

  const isEmployee = subject_role === 'employee'
  const primaryReviewerRole = isEmployee ? 'shift_leader' : 'store_manager'

  const peerEnabled = isEmployee && peer_policy.enabled

  const status = peerEnabled ? 'assignment_pending' : 'primary_review_pending'

  const assignmentDeadline = peerEnabled
    ? addHoursToIso(opened_at, peer_policy.manager_selection_hours)
    : undefined

  return {
    id: `mr_${period_id}_${employee.id}`,
    period_id,
    evaluation_id,
    employee_id: employee.id,
    store_id: employee.store_id,
    position_id: employee.position_id,
    subject_role,
    primary_reviewer_id,
    primary_reviewer_role: primaryReviewerRole,
    status,
    assignment_deadline_at: assignmentDeadline,
    missing_peer_sample: false,
    blocker_codes: [],
    created_at: opened_at,
    updated_at: opened_at,
  }
}

export function getPublicationBlockers(
  input: MonthlyReviewBlockerInput
): KpiMonthlyReviewBlockerCode[] {
  const blockers: KpiMonthlyReviewBlockerCode[] = []

  if (!input.primary_submitted) {
    blockers.push('PRIMARY_REVIEW_MISSING')
  }

  if (input.important_source_unconfirmed) {
    blockers.push('IMPORTANT_SOURCE_UNCONFIRMED')
  }

  if (input.extreme_score_evidence_missing) {
    blockers.push('EXTREME_SCORE_EVIDENCE_MISSING')
  }

  if (input.serious_incident_open) {
    blockers.push('SERIOUS_INCIDENT_OPEN')
  }

  if (input.appeal_open) {
    blockers.push('APPEAL_OPEN')
  }

  if (input.integrity_flags_blocking) {
    blockers.push('INTEGRITY_REVIEW_REQUIRED')
  }

  if (input.returned_changes_pending) {
    blockers.push('RETURNED_CHANGES_PENDING')
  }

  return blockers
}

export function advanceMonthlyReview(input: {
  review: KpiMonthlyReview
  assignment_count: number
  submitted_peer_count: number
  peer_collection_closed?: boolean
  primary_submitted: boolean
  manager_approved: boolean
  integrity_flags: KpiEvaluationIntegrityFlag[]
  serious_incident_open: boolean
  appeal_open: boolean
  at: string
}): KpiMonthlyReview {
  const {
    review,
    assignment_count,
    submitted_peer_count,
    peer_collection_closed = false,
    primary_submitted,
    manager_approved,
    integrity_flags,
    serious_incident_open,
    appeal_open,
    at,
  } = input

  let nextStatus = review.status
  let missingPeerSample = review.missing_peer_sample

  // 1. assignment_pending -> collecting khi đã gán reviewer
  if (review.status === 'assignment_pending' && assignment_count >= 2) {
    nextStatus = 'collecting'
  }

  if (review.status === 'assignment_pending' && peer_collection_closed && assignment_count < 2) {
    nextStatus = 'primary_review_pending'
    missingPeerSample = true
  }

  // 2. collecting -> primary_review_pending khi đủ phiếu hoặc quản lý xác nhận fallback
  if (review.status === 'collecting' && submitted_peer_count >= 2) {
    nextStatus = 'primary_review_pending'
    missingPeerSample = false
  }
  if (review.status === 'collecting' && peer_collection_closed && submitted_peer_count < 2) {
    nextStatus = 'primary_review_pending'
    missingPeerSample = true
  }

  // 3. Frontline chờ manager duyệt; Shift Leader do Store Manager chấm nên không tự duyệt lần hai.
  if (
    (review.status === 'primary_review_pending' || nextStatus === 'primary_review_pending') &&
    primary_submitted
  ) {
    nextStatus = review.subject_role === 'shift_leader'
      ? 'primary_review_pending'
      : 'manager_approval_pending'
  }

  // 4. published -> appeal_open
  if (review.status === 'published' && appeal_open) {
    nextStatus = 'appeal_open'
  }

  const hasBlockingIntegrity = integrity_flags.some(
    (f) => f.severity === 'blocking' && f.status === 'open'
  )

  const blockerCodes = getPublicationBlockers({
    primary_submitted,
    serious_incident_open,
    appeal_open,
    integrity_flags_blocking: hasBlockingIntegrity,
    returned_changes_pending:
      review.blocker_codes.includes('RETURNED_CHANGES_PENDING') && !primary_submitted,
  })

  if (
    review.subject_role === 'shift_leader' &&
    nextStatus === 'primary_review_pending' &&
    primary_submitted &&
    blockerCodes.length === 0
  ) {
    nextStatus = 'published'
  }

  if (
    (review.status === 'manager_approval_pending' || nextStatus === 'manager_approval_pending') &&
    manager_approved &&
    blockerCodes.length === 0
  ) {
    nextStatus = 'published'
  }

  return {
    ...review,
    status: nextStatus,
    missing_peer_sample: missingPeerSample,
    blocker_codes: blockerCodes,
    published_at: nextStatus === 'published' ? review.published_at ?? at : review.published_at,
    appeal_deadline_at: nextStatus === 'published'
      ? review.appeal_deadline_at ?? addHoursToIso(at, 48)
      : review.appeal_deadline_at,
    updated_at: at,
  }
}

export function approveMonthlyReview(input: {
  review: KpiMonthlyReview
  actor: KpiActor
  at: string
}): KpiMonthlyReview {
  const { review, actor, at } = input

  assertStoreManagerScope(review, actor)

  if (review.status !== 'manager_approval_pending') {
    throw new Error('Hồ sơ chưa ở trạng thái chờ Quản lý cửa hàng duyệt.')
  }

  if (review.blocker_codes.length > 0) {
    throw new Error(`Hồ sơ còn lỗi chặn: ${review.blocker_codes.join(', ')}.`)
  }

  const appealDeadline = addHoursToIso(at, 48)

  return {
    ...review,
    status: 'published',
    published_at: at,
    appeal_deadline_at: appealDeadline,
    updated_at: at,
  }
}

export function returnMonthlyReviewForChanges(input: {
  review: KpiMonthlyReview
  actor: KpiActor
  reason: string
  at: string
}): KpiMonthlyReview {
  const { review, actor, reason, at } = input

  assertStoreManagerScope(review, actor)

  if (review.status !== 'manager_approval_pending') {
    throw new Error('Chỉ hồ sơ đang chờ duyệt mới có thể trả lại để bổ sung.')
  }

  if (!reason.trim()) {
    throw new Error('Vui lòng nhập lý do trả lại hồ sơ.')
  }

  return {
    ...review,
    status: 'primary_review_pending',
    blocker_codes: ['RETURNED_CHANGES_PENDING'],
    published_at: undefined,
    appeal_deadline_at: undefined,
    updated_at: at,
  }
}

export function publishMonthlyReview(input: {
  review: KpiMonthlyReview
  evaluation: KpiEvaluation
  at: string
}): { review: KpiMonthlyReview; evaluation: KpiEvaluation } {
  const { review, evaluation, at } = input

  if (review.status !== 'manager_approval_pending') {
    throw new Error('Hồ sơ chưa ở trạng thái chờ công bố.')
  }

  if (review.blocker_codes.length > 0) {
    throw new Error(`Hồ sơ còn lỗi chặn: ${review.blocker_codes.join(', ')}.`)
  }

  const appealDeadline = addHoursToIso(at, 48)

  const updatedReview: KpiMonthlyReview = {
    ...review,
    status: 'published',
    published_at: at,
    appeal_deadline_at: appealDeadline,
    updated_at: at,
  }

  const updatedEvaluation: KpiEvaluation = {
    ...evaluation,
    status: 'published',
  }

  return {
    review: updatedReview,
    evaluation: updatedEvaluation,
  }
}
