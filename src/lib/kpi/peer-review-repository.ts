import type {
  KpiActor,
  KpiEmployeePeerResultDto,
  KpiManagerPeerProgressDto,
  KpiMonthlyReview,
  KpiEvaluationIntegrityFlag,
  KpiRankedPeerCandidate,
  PeerResponseDraftInput,
} from './index.ts'

export interface KpiPeerReviewerTaskDto {
  assignment_id: string
  monthly_review_id: string
  subject: {
    id: string
    name: string
    position_name: string
  }
  month: string
  shared_shift_count: number
  deadline_at: string
  status: 'assigned' | 'submitted'
}

export interface KpiPeerManagerQueueDto {
  monthly_review_id: string
  review: KpiMonthlyReview
  subject: {
    id: string
    name: string
    position_name: string
  }
  candidates: KpiRankedPeerCandidate[]
  selected_reviewer_ids: string[]
  progress: KpiManagerPeerProgressDto
  integrity_flag_count: number
}

export interface KpiPeerReviewRepository {
  listReviewerTasks(actor: KpiActor): Promise<KpiPeerReviewerTaskDto[]>
  listManagerQueue(actor: KpiActor): Promise<KpiPeerManagerQueueDto[]>
  submitResponse(
    actor: KpiActor,
    assignmentId: string,
    draft: PeerResponseDraftInput
  ): Promise<void>
  selectReviewers(
    actor: KpiActor,
    monthlyReviewId: string,
    reviewerIds: string[],
    reason?: string
  ): Promise<void>
  approveMonthlyReview(
    actor: KpiActor,
    monthlyReviewId: string,
    approvedAt?: string
  ): Promise<KpiMonthlyReview>
  returnMonthlyReview(
    actor: KpiActor,
    monthlyReviewId: string,
    reason: string,
    returnedAt?: string
  ): Promise<KpiMonthlyReview>
  getEmployeeAggregate(
    actor: KpiActor,
    monthlyReviewId: string
  ): Promise<KpiEmployeePeerResultDto>
  revealReviewerIdentity(
    actor: KpiActor,
    assignmentId: string,
    reason: string
  ): Promise<{ reviewer_id: string }>
  listIntegrityFlags(actor: KpiActor): Promise<KpiEvaluationIntegrityFlag[]>
  resolveIntegrityFlag(
    actor: KpiActor,
    flagId: string,
    decision: 'dismissed' | 'confirmed',
    reason: string
  ): Promise<KpiEvaluationIntegrityFlag>
}
