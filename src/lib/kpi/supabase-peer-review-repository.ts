import type {
  KpiActor,
  KpiEmployeePeerResultDto,
  KpiEvaluationIntegrityFlag,
  KpiMonthlyReview,
  PeerResponseDraftInput,
} from './index.ts'
import type {
  KpiPeerManagerQueueDto,
  KpiPeerReviewRepository,
  KpiPeerReviewerTaskDto,
} from './peer-review-repository.ts'

export interface SupabaseClientLike {
  from(table: string): {
    select(columns?: string): unknown
    insert(values: unknown): unknown
    update(values: unknown): unknown
  }
  rpc(fn: string, args?: Record<string, unknown>): Promise<{ data: unknown; error: { message: string } | null }>
}

export function createSupabasePeerReviewRepository(
  client: SupabaseClientLike
): KpiPeerReviewRepository {
  return {
    async listReviewerTasks(): Promise<KpiPeerReviewerTaskDto[]> {
      const { data, error } = await client.rpc('get_my_peer_reviewer_tasks')
      if (error) {
        throw new Error(`Lỗi tải danh sách nhiệm vụ đánh giá: ${error.message}`)
      }
      return (data || []) as KpiPeerReviewerTaskDto[]
    },

    async listManagerQueue(): Promise<KpiPeerManagerQueueDto[]> {
      const { data, error } = await client.rpc('get_store_peer_manager_queue')
      if (error) {
        throw new Error(`Lỗi tải hàng đợi đánh giá cửa hàng: ${error.message}`)
      }
      return (data || []) as KpiPeerManagerQueueDto[]
    },

    async submitResponse(
      _actor: KpiActor,
      assignmentId: string,
      draft: PeerResponseDraftInput
    ): Promise<void> {
      const { error } = await client.rpc('submit_peer_response', {
        p_assignment_id: assignmentId,
        p_answers: draft.answers,
        p_strength_note: draft.strength_note,
        p_improvement_note: draft.improvement_note,
        p_direct_observation_confirmed: draft.direct_observation_confirmed,
      })
      if (error) {
        throw new Error(`Lỗi gửi phiếu đánh giá: ${error.message}`)
      }
    },

    async selectReviewers(
      _actor: KpiActor,
      monthlyReviewId: string,
      reviewerIds: string[],
      reason?: string
    ): Promise<void> {
      const { error } = await client.rpc('manager_select_peer_reviewers', {
        p_monthly_review_id: monthlyReviewId,
        p_reviewer_ids: reviewerIds,
        p_selection_reason: reason,
      })
      if (error) {
        throw new Error(`Lỗi lưu danh sách đồng nghiệp: ${error.message}`)
      }
    },

    async approveMonthlyReview(
      _actor: KpiActor,
      monthlyReviewId: string,
      approvedAt?: string
    ): Promise<KpiMonthlyReview> {
      const { data, error } = await client.rpc('approve_monthly_review', {
        p_monthly_review_id: monthlyReviewId,
        p_approved_at: approvedAt,
      })
      if (error) {
        throw new Error(`Lỗi duyệt đánh giá tháng: ${error.message}`)
      }
      return data as KpiMonthlyReview
    },

    async returnMonthlyReview(
      _actor: KpiActor,
      monthlyReviewId: string,
      reason: string,
      returnedAt?: string
    ): Promise<KpiMonthlyReview> {
      const { data, error } = await client.rpc('return_monthly_review', {
        p_monthly_review_id: monthlyReviewId,
        p_reason: reason,
        p_returned_at: returnedAt,
      })
      if (error) {
        throw new Error(`Lỗi trả lại đánh giá tháng: ${error.message}`)
      }
      return data as KpiMonthlyReview
    },

    async getEmployeeAggregate(
      _actor: KpiActor,
      monthlyReviewId: string
    ): Promise<KpiEmployeePeerResultDto> {
      const { data, error } = await client.rpc('get_employee_peer_aggregate', {
        p_monthly_review_id: monthlyReviewId,
      })
      if (error) {
        throw new Error(`Lỗi tải điểm tổng hợp: ${error.message}`)
      }
      return (data || {
        enough_anonymous_sample: false,
        unavailable_reason: 'insufficient_anonymous_sample',
      }) as KpiEmployeePeerResultDto
    },

    async revealReviewerIdentity(
      _actor: KpiActor,
      assignmentId: string,
      reason: string
    ): Promise<{ reviewer_id: string }> {
      const { data, error } = await client.rpc('reveal_peer_reviewer_identity', {
        p_assignment_id: assignmentId,
        p_reason: reason,
      })
      if (error) {
        throw new Error(`Lỗi giải mật danh tính: ${error.message}`)
      }
      const res = data as { reviewer_id?: string } | null
      return { reviewer_id: res?.reviewer_id || '' }
    },

    async listIntegrityFlags(): Promise<KpiEvaluationIntegrityFlag[]> {
      const { data, error } = await client.rpc('get_kpi_integrity_flags')
      if (error) throw new Error(`Lỗi tải cờ liêm chính: ${error.message}`)
      return (data || []) as KpiEvaluationIntegrityFlag[]
    },

    async resolveIntegrityFlag(
      _actor: KpiActor,
      flagId: string,
      decision: 'dismissed' | 'confirmed',
      reason: string
    ): Promise<KpiEvaluationIntegrityFlag> {
      const { data, error } = await client.rpc('resolve_kpi_integrity_flag', {
        p_flag_id: flagId,
        p_decision: decision,
        p_reason: reason,
      })
      if (error) throw new Error(`Lỗi xử lý cờ liêm chính: ${error.message}`)
      return data as KpiEvaluationIntegrityFlag
    },
  }
}
