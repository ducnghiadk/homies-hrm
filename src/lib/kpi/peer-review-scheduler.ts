import type { KpiDatabase } from './repository.ts'
import type { LocalPeerReviewDatabase } from './local-peer-review-repository.ts'
import type {
  KpiMonthlyReview,
  KpiPeerReviewPolicy,
  KpiPeriod,
} from './types'
import { createMonthlyReview } from './monthly-review-service.ts'
import {
  autoSelectPeerReviewers,
  rankPeerCandidates,
  type KpiPeerCandidateFact,
} from './peer-assignment-service.ts'
import { getDefaultPeerReviewPolicy } from './peer-review-policy-service.ts'

// Tự tạo và tự đẩy tiến độ đánh giá đồng nghiệp hằng tháng (chạy trên máy chủ).
// - Kỳ KPI chuyển sang "đang thu thập" (collecting): mỗi người trong kỳ có một hồ sơ đánh giá tháng,
//   kèm danh sách người có thể chấm họ, xếp theo số ca làm chung lấy từ chấm công thật của tháng đó.
// - Quá hạn quản lý chọn người: hệ thống tự chọn 2 người đứng đầu danh sách.
// - Đủ phiếu hoặc quá hạn nộp phiếu: chuyển sang bước người chấm chính; thiếu phiếu thì đánh dấu
//   "thiếu mẫu" để điểm đồng nghiệp không được tính (người chấm chính gánh phần trọng số).
// Mọi con số (số ca tối thiểu, hạn chọn, hạn nộp...) lấy từ Cài đặt của phiên bản KPI trong kỳ.

export interface PeerSchedulerEmployee {
  id: string
  name: string
  role: string
  store_id: string
  secondary_store_ids?: string[]
  status: 'active' | 'inactive' | 'probation' | 'resigned'
  position_id?: string
  position_name?: string
}

export interface PeerSchedulerShift {
  employee_id: string
  store_id: string
  date: string
  shift_id?: string
  start_ms: number
  end_ms: number
}

export interface PeerSchedulerResult {
  peer: LocalPeerReviewDatabase
  changed: boolean
  created: number
}

const OPEN_PERIOD_STATUSES: KpiPeriod['status'][] = ['collecting']
const ACTIVE_PERIOD_STATUSES: KpiPeriod['status'][] = ['collecting', 'leader_scoring', 'ceo_preapproval']

export function normalizeStoreKey(storeId?: string): string {
  return (storeId || '').replace(/^store[_-]/, 'store-')
}

function addHours(iso: string, hours: number): string {
  return new Date(new Date(iso).getTime() + hours * 3_600_000).toISOString()
}

function isEnabledPolicy(policy?: KpiPeerReviewPolicy): policy is KpiPeerReviewPolicy {
  return Boolean(policy && policy.enabled)
}

function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number)
  if (!y || !m) return ''
  const d = new Date(Date.UTC(y, m - 2, 1))
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function belongsToStore(employee: PeerSchedulerEmployee, storeKey: string): boolean {
  if (normalizeStoreKey(employee.store_id) === storeKey) return true
  return (employee.secondary_store_ids || []).some((id) => normalizeStoreKey(id) === storeKey)
}

function isWorking(employee: PeerSchedulerEmployee): boolean {
  return employee.status === 'active' || employee.status === 'probation'
}

function shiftsOverlap(a: PeerSchedulerShift, b: PeerSchedulerShift): boolean {
  if (a.date !== b.date) return false
  if (normalizeStoreKey(a.store_id) !== normalizeStoreKey(b.store_id)) return false
  if (a.shift_id && b.shift_id && a.shift_id === b.shift_id) return true
  return a.start_ms < b.end_ms && b.start_ms < a.end_ms
}

function countSharedShifts(subjectShifts: PeerSchedulerShift[], peerShifts: PeerSchedulerShift[]): number {
  let count = 0
  for (const mine of subjectShifts) {
    if (peerShifts.some((theirs) => shiftsOverlap(mine, theirs))) count += 1
  }
  return count
}

function monthOfPeriod(period: KpiPeriod): string {
  return period.month || ''
}

export function syncMonthlyPeerReviews(input: {
  kpi: KpiDatabase
  peer: LocalPeerReviewDatabase
  employees: PeerSchedulerEmployee[]
  shifts: PeerSchedulerShift[]
  now: string
}): PeerSchedulerResult {
  const { kpi, employees, shifts, now } = input
  const peer: LocalPeerReviewDatabase = {
    ...input.peer,
    monthly_reviews: [...input.peer.monthly_reviews],
    assignments: [...input.peer.assignments],
    candidates_by_review: { ...input.peer.candidates_by_review },
    audit_logs: [...input.peer.audit_logs],
    employee_names: { ...input.peer.employee_names },
  }
  let changed = false
  let created = 0

  const employeeById = new Map(employees.map((e) => [e.id, e]))
  const reviewById = new Map(peer.monthly_reviews.map((r) => [r.id, r]))
  const periodById = new Map(kpi.periods.map((p) => [p.id, p]))

  const log = (action: string, targetId: string, reason: string) => {
    peer.audit_logs.push({
      id: `audit_peer_${action.toLowerCase()}_${targetId}_${Date.parse(now) || 0}`,
      actor_id: 'system',
      actor_role: 'system',
      action,
      target_id: targetId,
      reason,
      created_at: now,
    })
  }

  // 1. Tạo hồ sơ đánh giá tháng cho kỳ đang thu thập.
  for (const period of kpi.periods) {
    if (!OPEN_PERIOD_STATUSES.includes(period.status)) continue
    const month = monthOfPeriod(period)
    const storeKey = normalizeStoreKey(period.store_id)
    const policy = period.snapshot?.peer_review_policy
    const peerEnabled = isEnabledPolicy(policy)
    const monthShifts = shifts.filter((s) => s.date.startsWith(month))
    const shiftsByEmployee = new Map<string, PeerSchedulerShift[]>()
    for (const s of monthShifts) {
      const list = shiftsByEmployee.get(s.employee_id) || []
      list.push(s)
      shiftsByEmployee.set(s.employee_id, list)
    }
    const storeShiftsOf = (id: string) =>
      (shiftsByEmployee.get(id) || []).filter((s) => normalizeStoreKey(s.store_id) === storeKey)

    const storeStaff = employees.filter((e) => isWorking(e) && belongsToStore(e, storeKey))
    const managers = storeStaff.filter((e) => e.role === 'store_manager')
    const leaders = storeStaff.filter((e) => e.role === 'shift_leader')

    for (const employeeId of period.employee_ids) {
      if (peer.monthly_reviews.some((r) => r.period_id === period.id && r.employee_id === employeeId)) continue
      const subject = employeeById.get(employeeId)
      if (!subject || !isWorking(subject)) continue
      if (subject.role !== 'employee' && subject.role !== 'shift_leader') continue

      const subjectRole = subject.role === 'shift_leader' ? 'shift_leader' : 'employee'
      const subjectShifts = storeShiftsOf(subject.id)

      // Người chấm chính: nhân viên → trưởng ca làm chung nhiều nhất (không có thì quản lý cửa hàng);
      // trưởng ca → quản lý cửa hàng.
      let primary: PeerSchedulerEmployee | undefined
      if (subjectRole === 'employee') {
        primary = [...leaders]
          .filter((l) => l.id !== subject.id)
          .sort((a, b) =>
            countSharedShifts(subjectShifts, storeShiftsOf(b.id)) - countSharedShifts(subjectShifts, storeShiftsOf(a.id))
            || a.id.localeCompare(b.id))[0]
      }
      if (!primary) primary = [...managers].sort((a, b) => a.id.localeCompare(b.id))[0]
      if (!primary) continue

      const evaluation = kpi.evaluations.find((e) => e.period_id === period.id && e.employee.id === subject.id)
      const effectivePolicy = peerEnabled ? policy : { ...getDefaultPeerReviewPolicy(), enabled: false }
      const review: KpiMonthlyReview = createMonthlyReview({
        period_id: period.id,
        evaluation_id: evaluation?.id ?? `eval_${subject.id}_${period.id}`,
        employee: {
          id: subject.id,
          store_id: period.store_id,
          level_code: evaluation?.employee.level_code ?? 'pt1_pc',
          position_id: evaluation?.employee.position_id ?? subject.position_id ?? '',
          employment_status: subject.status === 'probation' ? 'probation' : 'official',
        },
        subject_role: subjectRole,
        primary_reviewer_id: primary.id,
        peer_policy: effectivePolicy,
        opened_at: now,
      })
      review.primary_reviewer_role = primary.role === 'shift_leader' ? 'shift_leader' : 'store_manager'

      if (review.status === 'assignment_pending' && peerEnabled) {
        const lastMonth = previousMonth(month)
        const facts: KpiPeerCandidateFact[] = storeStaff
          .filter((e) => e.id !== subject.id)
          .map((candidate) => {
            const candidateShifts = shiftsByEmployee.get(candidate.id) || []
            const reviewedLastMonth = peer.assignments.some((a) => {
              if (a.reviewer_id !== candidate.id) return false
              const r = reviewById.get(a.monthly_review_id)
              const p = r ? periodById.get(r.period_id) : undefined
              return Boolean(r && r.employee_id === subject.id && p && p.month === lastMonth)
            })
            const reciprocal = peer.assignments.some((a) => {
              if (a.reviewer_id !== subject.id) return false
              const r = reviewById.get(a.monthly_review_id)
              return Boolean(r && r.employee_id === candidate.id && r.period_id === period.id)
            })
            return {
              employee_id: candidate.id,
              role: candidate.role === 'employee' || candidate.role === 'shift_leader' || candidate.role === 'store_manager'
                ? candidate.role
                : 'store_manager',
              status: 'active' as const,
              probation: candidate.status === 'probation',
              suspended: false,
              serious_incident_open: false,
              total_shifts: candidateShifts.length,
              shared_shifts: countSharedShifts(subjectShifts, candidateShifts.filter((s) => normalizeStoreKey(s.store_id) === storeKey)),
              reviewed_subject_last_month: reviewedLastMonth,
              reciprocal_in_period: reciprocal,
            }
          })
        const ranked = rankPeerCandidates({
          subject_id: subject.id,
          primary_reviewer_id: primary.id,
          facts,
          policy,
        })
        peer.candidates_by_review[review.id] = ranked
        if (ranked.length < policy.required_reviewer_count) {
          review.status = 'primary_review_pending'
          review.missing_peer_sample = true
          review.assignment_deadline_at = undefined
        }
      }

      peer.monthly_reviews.push(review)
      reviewById.set(review.id, review)
      peer.employee_names[subject.id] = {
        name: subject.name || subject.id,
        position_name: subject.position_name || (subjectRole === 'shift_leader' ? 'Trưởng ca' : 'Nhân viên'),
      }
      log('AUTO_CREATE_MONTHLY_REVIEW', review.id, review.missing_peer_sample
        ? 'Tạo hồ sơ đánh giá tháng; không đủ đồng nghiệp làm chung nên điểm đồng nghiệp không được tính'
        : 'Tạo hồ sơ đánh giá tháng khi kỳ KPI chuyển sang thu thập')
      created += 1
      changed = true
    }
  }

  // 2. Đẩy tiến độ theo hạn.
  const nowMs = Date.parse(now)
  peer.monthly_reviews = peer.monthly_reviews.map((review) => {
    const period = periodById.get(review.period_id)
    if (!period || !ACTIVE_PERIOD_STATUSES.includes(period.status)) return review
    const policy = period.snapshot?.peer_review_policy
    if (!isEnabledPolicy(policy)) return review
    const required = policy.required_reviewer_count

    if (review.status === 'assignment_pending') {
      if (!review.assignment_deadline_at || Date.parse(review.assignment_deadline_at) > nowMs) return review
      const candidates = peer.candidates_by_review[review.id] || []
      changed = true
      if (candidates.length >= required) {
        const picked = autoSelectPeerReviewers({ monthly_review_id: review.id, candidates, selected_at: now, policy })
        peer.assignments = [...peer.assignments.filter((a) => a.monthly_review_id !== review.id), ...picked]
        log('AUTO_SELECT_PEER_REVIEWERS', review.id, 'Quá hạn quản lý chọn người, hệ thống tự chọn theo số ca làm chung')
        return { ...review, status: 'collecting', peer_deadline_at: addHours(now, policy.reviewer_deadline_hours), updated_at: now }
      }
      log('PEER_SAMPLE_MISSING', review.id, 'Không đủ người đủ điều kiện chấm, điểm đồng nghiệp không được tính')
      return { ...review, status: 'primary_review_pending', missing_peer_sample: true, updated_at: now }
    }

    if (review.status === 'collecting') {
      const mine = peer.assignments.filter((a) => a.monthly_review_id === review.id)
      const submitted = mine.filter((a) => a.status === 'submitted').length
      if (submitted >= required) {
        changed = true
        return { ...review, status: 'primary_review_pending', missing_peer_sample: false, updated_at: now }
      }
      const deadlines = mine.filter((a) => a.status === 'assigned').map((a) => Date.parse(a.deadline_at || '')).filter(Number.isFinite)
      const deadlineMs = review.peer_deadline_at ? Date.parse(review.peer_deadline_at) : Math.max(...deadlines, -Infinity)
      if (!Number.isFinite(deadlineMs) || deadlineMs > nowMs) return review
      changed = true
      peer.assignments = peer.assignments.map((a) =>
        a.monthly_review_id === review.id && a.status === 'assigned' ? { ...a, status: 'expired' } : a)
      log('PEER_COLLECTION_CLOSED', review.id, submitted >= required
        ? 'Đã đủ phiếu đồng nghiệp'
        : `Hết hạn nộp phiếu, mới có ${submitted}/${required} phiếu nên điểm đồng nghiệp không được tính`)
      return { ...review, status: 'primary_review_pending', missing_peer_sample: submitted < required, updated_at: now }
    }

    return review
  })

  return { peer, changed, created }
}

/** Đổi bản ghi chấm công trên máy chủ sang ca làm việc dùng để đếm ca làm chung. */
export function toSchedulerShift(record: {
  employee_id?: string
  store_id?: string
  date?: string
  shift_id?: string
  check_in_time?: string
  check_out_time?: string
}): PeerSchedulerShift | null {
  if (!record.employee_id || !record.date || !record.check_in_time) return null
  const parse = (value?: string): number => {
    if (!value) return NaN
    if (/^\d{1,2}:\d{2}/.test(value)) {
      const [h, m] = value.split(':')
      return Date.parse(`${record.date}T${h.padStart(2, '0')}:${m.slice(0, 2)}:00+07:00`)
    }
    return Date.parse(value)
  }
  const start = parse(record.check_in_time)
  if (!Number.isFinite(start)) return null
  let end = parse(record.check_out_time)
  if (!Number.isFinite(end) || end <= start) end = start + 60_000
  return {
    employee_id: record.employee_id,
    store_id: record.store_id || '',
    date: record.date,
    shift_id: record.shift_id,
    start_ms: start,
    end_ms: end,
  }
}
