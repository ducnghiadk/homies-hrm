import type { KpiPeerReviewPolicy } from './types'

export type KpiPeerPolicyIssueCode =
  | 'PEER_WEIGHT_CAP'
  | 'REVIEWER_COUNT'
  | 'SHIFT_THRESHOLD'
  | 'DEADLINE'
  | 'COMMENT_LENGTH'

export interface KpiPeerPolicyIssue {
  code: KpiPeerPolicyIssueCode
  message: string
}

export function getDefaultPeerReviewPolicy(): KpiPeerReviewPolicy {
  return {
    enabled: true,
    weight_percent: 10,
    max_weight_percent: 15,
    min_total_shifts: 8,
    min_shared_shifts: 5,
    manager_selection_hours: 24,
    reviewer_deadline_hours: 48,
    required_reviewer_count: 2,
    standby_enabled: true,
    exclude_probation: true,
    exclude_suspended: true,
    extreme_comment_min_length: 20,
    missing_sample_fallback: 'primary_reviewer',
  }
}

export function validatePeerReviewPolicy(
  policy: KpiPeerReviewPolicy
): KpiPeerPolicyIssue[] {
  const issues: KpiPeerPolicyIssue[] = []

  if (
    policy.weight_percent < 0 ||
    policy.weight_percent > policy.max_weight_percent ||
    policy.max_weight_percent > 15
  ) {
    issues.push({
      code: 'PEER_WEIGHT_CAP',
      message: 'Trọng số góp ý đồng nghiệp không được vượt quá 15%.',
    })
  }

  if (policy.required_reviewer_count !== 2) {
    issues.push({
      code: 'REVIEWER_COUNT',
      message: 'Số đồng nghiệp đánh giá bắt buộc phải đúng 2 người để bảo đảm tính ẩn danh.',
    })
  }

  if (policy.min_total_shifts < 0 || policy.min_shared_shifts < 0) {
    issues.push({
      code: 'SHIFT_THRESHOLD',
      message: 'Số ca làm việc tối thiểu và ca làm chung không được là số âm.',
    })
  }

  if (
    policy.manager_selection_hours <= 0 ||
    policy.reviewer_deadline_hours <= 0
  ) {
    issues.push({
      code: 'DEADLINE',
      message: 'Thời hạn quản lý chọn người và thời hạn nộp phiếu phải lớn hơn 0 giờ.',
    })
  }

  if (policy.extreme_comment_min_length < 20) {
    issues.push({
      code: 'COMMENT_LENGTH',
      message: 'Độ dài tối thiểu cho nhận xét điểm cực trị (1 hoặc 5 điểm) phải từ 20 ký tự trở lên.',
    })
  }

  return issues
}
