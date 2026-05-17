'use client'

import type { PromotionReview } from '@/lib/kpi-types'
import { mockLevelConfigs } from '@/lib/mock-data-kpi'

interface Props {
  review: PromotionReview
  employeeName?: string
  onApprove?: () => void
  onReject?: () => void
}

const LEVEL_LABELS: Record<string, string> = {
  L0: 'Thử việc', L1: 'Nhân viên', L2: 'Senior',
  L3: 'Trưởng ca', L4: 'Quản lý', L5: 'Khu vực',
}

export default function PromotionEligibilityCard({
  review, employeeName, onApprove, onReject,
}: Props) {
  const cfg = mockLevelConfigs.find(c => c.level === review.current_level)
  const requiredMonths = cfg?.min_months_to_promote ?? 6
  const monthsMet = review.evaluations.length

  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="p-3" style={{ background: review.eligible ? '#f0fdf4' : '#fef2f2' }}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
            style={{ background: 'var(--gray-200)' }}>
            {(employeeName || review.employee_id).charAt(0)}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold">{employeeName || review.employee_id}</div>
            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {LEVEL_LABELS[review.current_level]} → {LEVEL_LABELS[review.target_level]}
            </div>
          </div>
          <span className="text-xs px-2 py-0.5 rounded-full font-bold text-white"
            style={{ background: review.eligible ? '#10b981' : '#ef4444' }}>
            {review.eligible ? '✅ Đủ ĐK' : '❌ Chưa đủ'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="p-3 grid grid-cols-2 gap-2">
        <div className="text-center p-2 rounded-lg" style={{ background: 'var(--gray-50)' }}>
          <div className="text-lg font-black" style={{ color: '#3b82f6' }}>{review.average_score}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>KPI trung bình</div>
        </div>
        <div className="text-center p-2 rounded-lg" style={{ background: 'var(--gray-50)' }}>
          <div className="text-lg font-black" style={{ color: '#f59e0b' }}>{review.lowest_score}</div>
          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>KPI thấp nhất</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] font-semibold" style={{ color: 'var(--text-secondary)' }}>
            Tiến trình: {monthsMet}/{requiredMonths} tháng
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${Math.min((monthsMet / requiredMonths) * 100, 100)}%`,
            background: '#3b82f6',
          }} />
        </div>
      </div>

      {/* Eligibility reasons */}
      <div className="px-3 pb-3 space-y-1">
        {review.eligibility_reasons.map((r, i) => (
          <div key={i} className="flex items-start gap-1.5 text-[10px]">
            <span>{review.eligible ? '✅' : '❌'}</span>
            <span style={{ color: 'var(--text-secondary)' }}>{r}</span>
          </div>
        ))}
      </div>

      {/* Violations */}
      {review.violation_count > 0 && (
        <div className="mx-3 mb-3 p-2 rounded-lg text-[10px]" style={{
          background: review.critical_violations > 0 ? '#fee2e2' : '#fef3c7',
          color: review.critical_violations > 0 ? '#991b1b' : '#92400e',
        }}>
          ⚠️ {review.violation_count} lỗi ({review.critical_violations} nghiêm trọng)
        </div>
      )}

      {/* Decision status or actions */}
      {review.status === 'pending' && onApprove && onReject ? (
        <div className="flex gap-2 px-3 pb-3">
          <button onClick={onReject}
            className="flex-1 py-2 rounded-xl text-xs font-bold"
            style={{ background: '#fee2e2', color: '#991b1b' }}>
            ❌ Từ chối
          </button>
          <button onClick={onApprove}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-white"
            style={{ background: '#10b981' }}>
            ✅ Phê duyệt
          </button>
        </div>
      ) : review.status !== 'pending' && (
        <div className="mx-3 mb-3 p-2 rounded-lg text-xs text-center" style={{
          background: review.status === 'approved' ? '#dcfce7' : '#fee2e2',
          color: review.status === 'approved' ? '#166534' : '#991b1b',
        }}>
          {review.status === 'approved' ? '✅ Đã phê duyệt thăng tiến' : '❌ Đã từ chối'}
          {review.decision_note && <span> — {review.decision_note}</span>}
        </div>
      )}
    </div>
  )
}
