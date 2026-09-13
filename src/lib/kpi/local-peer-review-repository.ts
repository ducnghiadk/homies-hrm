import type {
  KpiActor,
  KpiEmployeePeerResultDto,
  KpiEvaluationIntegrityFlag,
  KpiManagerPeerProgressDto,
  KpiMonthlyReview,
  KpiPeerAggregate,
  KpiPeerAssignment,
  KpiPeerResponse,
  KpiRankedPeerCandidate,
  PeerResponseDraftInput,
} from './index.ts'
import {
  aggregatePeerResponses,
  getDefaultPeerReviewPolicy,
  submitPeerResponse,
  toEmployeePeerAggregateDto,
  toManagerPeerProgressDto,
} from './index.ts'
import type {
  KpiPeerManagerQueueDto,
  KpiPeerReviewRepository,
  KpiPeerReviewerTaskDto,
} from './peer-review-repository.ts'
import {
  approveMonthlyReview as approveMonthlyReviewDomain,
  returnMonthlyReviewForChanges as returnMonthlyReviewForChangesDomain,
} from './monthly-review-service.ts'
import { resolveIntegrityFlag as resolveIntegrityFlagDomain } from './evaluation-integrity-service.ts'
import { detectEvaluationIntegrityFlags } from './evaluation-integrity-service.ts'

export const KPI_PEER_REVIEW_DEMO_STORAGE_KEY = 'homies_kpi_peer_review_demo_v1'
export const KPI_PEER_REVIEW_DEMO_ONLY = true

export interface LocalPeerReviewDatabase {
  monthly_reviews: KpiMonthlyReview[]
  assignments: KpiPeerAssignment[]
  responses: KpiPeerResponse[]
  aggregates: KpiPeerAggregate[]
  integrity_flags: KpiEvaluationIntegrityFlag[]
  candidates_by_review: Record<string, KpiRankedPeerCandidate[]>
  audit_logs: Array<{
    id: string
    actor_id: string
    actor_role: string
    action: string
    target_id: string
    reason: string
    created_at: string
  }>
  employee_names: Record<string, { name: string; position_name: string }>
}

export function createEmptyLocalPeerReviewDatabase(): LocalPeerReviewDatabase {
  return {
    monthly_reviews: [],
    assignments: [],
    responses: [],
    aggregates: [],
    integrity_flags: [],
    candidates_by_review: {},
    audit_logs: [],
    employee_names: {},
  }
}

function normalizeDemoStoreId(storeId?: string): string | undefined {
  return storeId?.replace(/^store[_-]/, 'store-')
}

export function createLocalPeerReviewRepository(options?: {
  storage?: Storage
  storageKey?: string
  initialData?: LocalPeerReviewDatabase
}): KpiPeerReviewRepository {
  const storage =
    options?.storage ??
    (typeof window !== 'undefined' ? window.localStorage : undefined)
  const storageKey = options?.storageKey ?? KPI_PEER_REVIEW_DEMO_STORAGE_KEY

  let memoryDb: LocalPeerReviewDatabase =
    options?.initialData ?? createEmptyLocalPeerReviewDatabase()

  function loadDb(): LocalPeerReviewDatabase {
    if (!storage) return memoryDb
    try {
      const raw = storage.getItem(storageKey)
      if (!raw) return memoryDb
      return JSON.parse(raw) as LocalPeerReviewDatabase
    } catch {
      return memoryDb
    }
  }

  function saveDb(db: LocalPeerReviewDatabase) {
    memoryDb = db
    if (storage) {
      try {
        storage.setItem(storageKey, JSON.stringify(db))
      } catch {
        // Safe fallback
      }
    }
  }

  const policy = getDefaultPeerReviewPolicy()

  return {
    async listReviewerTasks(actor: KpiActor): Promise<KpiPeerReviewerTaskDto[]> {
      const db = loadDb()
      const myAssignments = db.assignments.filter(
        (a) => a.reviewer_id === actor.id && (a.status === 'assigned' || a.status === 'submitted')
      )

      return myAssignments.map((assignment) => {
        const review = db.monthly_reviews.find(
          (r) => r.id === assignment.monthly_review_id
        )
        const subjectMeta = db.employee_names[review?.employee_id || ''] || {
          name: review?.employee_id || 'Nhân viên',
          position_name: 'Nhân viên',
        }

        return {
          assignment_id: assignment.id,
          monthly_review_id: assignment.monthly_review_id,
          subject: {
            id: review?.employee_id || '',
            name: subjectMeta.name,
            position_name: subjectMeta.position_name,
          },
          month: review?.period_id.replace('period-', '') || '',
          shared_shift_count: assignment.shared_shift_count,
          deadline_at: assignment.deadline_at || '',
          status: assignment.status as 'assigned' | 'submitted',
        }
      })
    },

    async listManagerQueue(actor: KpiActor): Promise<KpiPeerManagerQueueDto[]> {
      const db = loadDb()

      if (!['shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo'].includes(actor.role)) {
        throw new Error('Bạn không có quyền xem hàng đợi quản lý đánh giá.')
      }

      // Quản lý xem các monthly review trong cửa hàng hoặc phạm vi quản lý
      const relevantReviews = db.monthly_reviews.filter((r) => {
        if (actor.role === 'store_manager' || actor.role === 'shift_leader') {
          return normalizeDemoStoreId(r.store_id) === normalizeDemoStoreId(actor.store_id)
        }
        return true
      })

      return relevantReviews.map((review) => {
        const subjectMeta = db.employee_names[review.employee_id] || {
          name: review.employee_id,
          position_name: 'Nhân viên',
        }

        const reviewAssignments = db.assignments.filter(
          (a) => a.monthly_review_id === review.id
        )
        const reviewResponses = db.responses.filter(
          (resp) => resp.monthly_review_id === review.id
        )
        const candidates = db.candidates_by_review[review.id] || []
        const flagCount = db.integrity_flags.filter(
          (f) => f.monthly_review_id === review.id && f.status === 'open'
        ).length

        const progress: KpiManagerPeerProgressDto = toManagerPeerProgressDto({
          assignments: reviewAssignments,
          responses: reviewResponses,
          policy,
        })

        const selectedReviewerIds = reviewAssignments
          .filter((a) => a.status === 'assigned' || a.status === 'submitted')
          .map((a) => a.reviewer_id)

        return {
          monthly_review_id: review.id,
          review: { ...review, blocker_codes: [...review.blocker_codes] },
          subject: {
            id: review.employee_id,
            name: subjectMeta.name,
            position_name: subjectMeta.position_name,
          },
          candidates,
          selected_reviewer_ids: selectedReviewerIds,
          progress,
          integrity_flag_count: flagCount,
        }
      })
    },

    async submitResponse(
      actor: KpiActor,
      assignmentId: string,
      draft: PeerResponseDraftInput
    ): Promise<void> {
      const db = loadDb()
      const assignment = db.assignments.find((a) => a.id === assignmentId)
      if (!assignment) {
        throw new Error('Không tìm thấy phiếu phân công đánh giá.')
      }

      if (assignment.reviewer_id !== actor.id) {
        throw new Error('Bạn không có quyền gửi phiếu đánh giá của người khác.')
      }

      const { assignment: updatedAssignment, response } = submitPeerResponse({
        assignment,
        reviewer_id: actor.id,
        draft,
        policy,
        submitted_at: new Date().toISOString(),
      })

      const nextAssignments = db.assignments.map((a) =>
        a.id === assignmentId ? updatedAssignment : a
      )
      const nextResponses = [
        ...db.responses.filter((r) => r.assignment_id !== assignmentId),
        response,
      ]

      // Tự động tính aggregate mới
      const currentReviewResponses = nextResponses.filter(
        (r) => r.monthly_review_id === assignment.monthly_review_id
      )
      const newAggregate = aggregatePeerResponses({
        monthly_review_id: assignment.monthly_review_id,
        responses: currentReviewResponses,
        policy,
      })

      const nextAggregates = [
        ...db.aggregates.filter(
          (ag) => ag.monthly_review_id !== assignment.monthly_review_id
        ),
        newAggregate,
      ]

      const review = db.monthly_reviews.find((item) => item.id === assignment.monthly_review_id)
      const reviewIdsInPeriod = new Set(db.monthly_reviews
        .filter((item) => item.period_id === review?.period_id)
        .map((item) => item.id))
      const detectedFlags = detectEvaluationIntegrityFlags({
        monthly_review_id: assignment.monthly_review_id,
        subject_id: review?.employee_id ?? '',
        current_assignments: nextAssignments.filter((item) => item.monthly_review_id === assignment.monthly_review_id),
        current_responses: currentReviewResponses,
        all_period_assignments: nextAssignments.filter((item) => reviewIdsInPeriod.has(item.monthly_review_id)),
        subject_id_by_review: Object.fromEntries(db.monthly_reviews.map((item) => [item.id, item.employee_id])),
        historical_assignments: nextAssignments.filter((item) => !reviewIdsInPeriod.has(item.monthly_review_id)),
        month_by_review: Object.fromEntries(db.monthly_reviews.map((item) => [item.id, extractMonth(item.period_id)])),
        peer_total_score: newAggregate.total_score,
      })
      const nextFlags = [...db.integrity_flags]
      for (const flag of detectedFlags) {
        if (!nextFlags.some((item) => item.id === flag.id)) nextFlags.push(flag)
      }

      saveDb({
        ...db,
        assignments: nextAssignments,
        responses: nextResponses,
        aggregates: nextAggregates,
        integrity_flags: nextFlags,
      })
    },

    async selectReviewers(
      actor: KpiActor,
      monthlyReviewId: string,
      reviewerIds: string[],
      reason?: string
    ): Promise<void> {
      const db = loadDb()
      const review = db.monthly_reviews.find((r) => r.id === monthlyReviewId)
      if (!review) {
        throw new Error('Không tìm thấy đánh giá tháng.')
      }

      if (actor.role !== 'store_manager') {
        throw new Error('Chỉ Quản lý cửa hàng mới được chọn đồng nghiệp đánh giá.')
      }

      if (normalizeDemoStoreId(review.store_id) !== normalizeDemoStoreId(actor.store_id)) {
        throw new Error('Bạn không có quyền phân công đánh giá cho cửa hàng khác.')
      }

      if (reviewerIds.length !== policy.required_reviewer_count) {
        throw new Error(`Cần chọn đúng ${policy.required_reviewer_count} người đồng nghiệp.`)
      }

      if (new Set(reviewerIds).size !== reviewerIds.length) {
        throw new Error('Hai người đánh giá phải là hai nhân viên khác nhau.')
      }

      const candidates = db.candidates_by_review[monthlyReviewId] || []
      if (reviewerIds.some((reviewerId) => !candidates.some((item) => item.employee_id === reviewerId))) {
        throw new Error('Người được chọn không nằm trong danh sách ứng viên đủ điều kiện.')
      }

      const now = new Date().toISOString()
      const deadline = new Date(Date.now() + policy.reviewer_deadline_hours * 3600 * 1000).toISOString()

      const newAssignments: KpiPeerAssignment[] = reviewerIds.map((reviewerId) => {
        const candidate = candidates.find((item) => item.employee_id === reviewerId)!
        return {
          id: `peer_assignment_${monthlyReviewId}_${reviewerId}`,
          monthly_review_id: monthlyReviewId,
          reviewer_id: reviewerId,
          rank: candidate.rank,
          shared_shift_count: candidate.shared_shifts,
          total_shift_count: candidate.total_shifts,
          selected_by: 'manager',
          selected_by_actor_id: actor.id,
          selection_reason: reason,
          status: 'assigned',
          assigned_at: now,
          deadline_at: deadline,
        }
      })

      const nextAssignments = [
        ...db.assignments.filter((a) => a.monthly_review_id !== monthlyReviewId),
        ...newAssignments,
      ]

      const nextReviews = db.monthly_reviews.map((r) =>
        r.id === monthlyReviewId ? { ...r, status: 'collecting' as const, updated_at: now } : r
      )

      saveDb({
        ...db,
        monthly_reviews: nextReviews,
        assignments: nextAssignments,
      })
    },

    async approveMonthlyReview(
      actor: KpiActor,
      monthlyReviewId: string,
      approvedAt = new Date().toISOString()
    ): Promise<KpiMonthlyReview> {
      const db = loadDb()
      const review = db.monthly_reviews.find((item) => item.id === monthlyReviewId)
      if (!review) {
        throw new Error('Không tìm thấy đánh giá tháng.')
      }

      const approved = approveMonthlyReviewDomain({ review, actor, at: approvedAt })
      saveDb({
        ...db,
        monthly_reviews: db.monthly_reviews.map((item) =>
          item.id === monthlyReviewId ? approved : item
        ),
        audit_logs: [
          ...db.audit_logs,
          {
            id: `audit_approve_${monthlyReviewId}_${approvedAt}`,
            actor_id: actor.id,
            actor_role: actor.role,
            action: 'APPROVE_MONTHLY_REVIEW',
            target_id: monthlyReviewId,
            reason: 'Duyệt và công bố đánh giá tháng',
            created_at: approvedAt,
          },
        ],
      })

      return approved
    },

    async returnMonthlyReview(
      actor: KpiActor,
      monthlyReviewId: string,
      reason: string,
      returnedAt = new Date().toISOString()
    ): Promise<KpiMonthlyReview> {
      const db = loadDb()
      const review = db.monthly_reviews.find((item) => item.id === monthlyReviewId)
      if (!review) {
        throw new Error('Không tìm thấy đánh giá tháng.')
      }

      const returned = returnMonthlyReviewForChangesDomain({
        review,
        actor,
        reason,
        at: returnedAt,
      })
      saveDb({
        ...db,
        monthly_reviews: db.monthly_reviews.map((item) =>
          item.id === monthlyReviewId ? returned : item
        ),
        audit_logs: [
          ...db.audit_logs,
          {
            id: `audit_return_${monthlyReviewId}_${returnedAt}`,
            actor_id: actor.id,
            actor_role: actor.role,
            action: 'RETURN_MONTHLY_REVIEW',
            target_id: monthlyReviewId,
            reason: reason.trim(),
            created_at: returnedAt,
          },
        ],
      })

      return returned
    },

    async getEmployeeAggregate(
      actor: KpiActor,
      monthlyReviewId: string
    ): Promise<KpiEmployeePeerResultDto> {
      const db = loadDb()
      const review = db.monthly_reviews.find((r) => r.id === monthlyReviewId)
      if (!review) {
        throw new Error('Không tìm thấy đánh giá tháng.')
      }

      // Nhân viên chỉ xem được đánh giá của chính mình
      if (actor.role === 'employee' && review.employee_id !== actor.id) {
        throw new Error('Bạn không có quyền xem kết quả đánh giá của người khác.')
      }

      const aggregate = db.aggregates.find(
        (ag) => ag.monthly_review_id === monthlyReviewId
      )

      return toEmployeePeerAggregateDto(aggregate || null)
    },

    async revealReviewerIdentity(
      actor: KpiActor,
      assignmentId: string,
      reason: string
    ): Promise<{ reviewer_id: string }> {
      const db = loadDb()

      if (!['hr_admin', 'ceo'].includes(actor.role)) {
        throw new Error('Chỉ HR Admin hoặc Ban Giám Đốc mới có quyền xem danh tính người đánh giá.')
      }

      if (!reason || reason.trim().length === 0) {
        throw new Error('Vui lòng nhập lý do giải mật danh tính người đánh giá.')
      }

      const assignment = db.assignments.find((a) => a.id === assignmentId)
      if (!assignment) {
        throw new Error('Không tìm thấy phiếu phân công.')
      }

      const auditEvent = {
        id: `audit_${Date.now()}`,
        actor_id: actor.id,
        actor_role: actor.role,
        action: 'REVEAL_PEER_REVIEWER_IDENTITY',
        target_id: assignmentId,
        reason: reason.trim(),
        created_at: new Date().toISOString(),
      }

      saveDb({
        ...db,
        audit_logs: [...db.audit_logs, auditEvent],
      })

      return { reviewer_id: assignment.reviewer_id }
    },

    async listIntegrityFlags(actor: KpiActor): Promise<KpiEvaluationIntegrityFlag[]> {
      if (!['hr_admin', 'ceo'].includes(actor.role)) {
        throw new Error('Chỉ HR Admin hoặc Ban Giám Đốc mới có quyền xem cờ liêm chính.')
      }
      return loadDb().integrity_flags.map((flag) => ({ ...flag, evidence_refs: [...flag.evidence_refs] }))
    },

    async resolveIntegrityFlag(actor, flagId, decision, reason): Promise<KpiEvaluationIntegrityFlag> {
      const db = loadDb()
      const flag = db.integrity_flags.find((item) => item.id === flagId)
      if (!flag) throw new Error('Không tìm thấy cờ liêm chính.')

      const resolved = resolveIntegrityFlagDomain({ flag, actor, decision, reason })
      const at = new Date().toISOString()
      saveDb({
        ...db,
        integrity_flags: db.integrity_flags.map((item) => item.id === flagId ? resolved : item),
        audit_logs: [...db.audit_logs, {
          id: `audit_integrity_${flagId}_${at}`,
          actor_id: actor.id,
          actor_role: actor.role,
          action: 'RESOLVE_KPI_INTEGRITY_FLAG',
          target_id: flagId,
          reason: reason.trim(),
          created_at: at,
        }],
      })
      return resolved
    },
  }
}

function extractMonth(value: string): string {
  return value.match(/\d{4}-\d{2}/)?.[0] ?? ''
}
