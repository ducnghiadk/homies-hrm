'use client'

import React from 'react'
import type { PromotionReview } from '@/lib/kpi-types'
import { mockLevelConfigs } from '@/lib/mock-data-kpi'
import { CheckCircle2, XCircle, AlertTriangle, ArrowRight, Sparkles, ShieldAlert, Award } from 'lucide-react'

interface Props {
  review: PromotionReview
  employeeName?: string
  onApprove?: () => void
  onReject?: () => void
}

const LEVEL_LABELS: Record<string, string> = {
  L0: 'Thử việc (L0)',
  L1: 'Nhân viên mới (L1)',
  L2: 'NV Chính thức (L2)',
  L3: 'Trưởng ca (L3)',
  L4: 'Quản lý cửa hàng (L4)',
  L5: 'Quản lý khu vực (L5)',
}

export default function PromotionEligibilityCard({
  review,
  employeeName,
  onApprove,
  onReject,
}: Props) {
  const cfg = mockLevelConfigs.find(c => c.level === review.current_level)
  const requiredMonths = cfg?.min_months_to_promote ?? 6
  const monthsMet = review.evaluations.length

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden flex flex-col">
      {/* Header */}
      <div className={`p-4 border-b ${
        review.eligible
          ? 'bg-linear-to-r from-emerald-50/70 via-teal-50/30 to-white border-emerald-100'
          : 'bg-linear-to-r from-rose-50/70 via-red-50/30 to-white border-rose-100'
      }`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#2F6FA8] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {(employeeName || review.employee_id).charAt(0)}
            </div>
            <div>
              <div className="text-sm font-bold text-[#001D3D]">{employeeName || review.employee_id}</div>
              <div className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                <span>{LEVEL_LABELS[review.current_level] || review.current_level}</span>
                <ArrowRight size={12} className="text-[#2F6FA8]" />
                <span className="font-bold text-[#2F6FA8]">{LEVEL_LABELS[review.target_level] || review.target_level}</span>
              </div>
            </div>
          </div>

          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
            review.eligible
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-rose-50 text-rose-700 border-rose-200'
          }`}>
            {review.eligible ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
            <span>{review.eligible ? 'Đủ Điều Kiện' : 'Chưa Đạt Chuẩn'}</span>
          </span>
        </div>
      </div>

      {/* Stats KPI */}
      <div className="p-4 grid grid-cols-2 gap-3 bg-gray-50/40 border-b border-gray-100">
        <div className="p-3 rounded-xl bg-white border border-gray-100 text-center">
          <div className="text-lg font-bold font-mono tabular-nums text-[#2F6FA8]">
            {review.average_score.toFixed(1)} đ
          </div>
          <div className="text-[11px] text-gray-500 font-medium mt-0.5">KPI Trung Bình ({monthsMet}T)</div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-gray-100 text-center">
          <div className="text-lg font-bold font-mono tabular-nums text-amber-600">
            {review.lowest_score.toFixed(1)} đ
          </div>
          <div className="text-[11px] text-gray-500 font-medium mt-0.5">Tháng Thấp Nhất</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="p-4 space-y-1.5 border-b border-gray-100">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-gray-600">Duy trì liên tục:</span>
          <span className="font-mono font-bold text-gray-900">{monthsMet}/{requiredMonths} tháng</span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
          <div
            className="h-full rounded-full bg-[#2F6FA8] transition-all"
            style={{ width: `${Math.min((monthsMet / requiredMonths) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Eligibility reasons */}
      <div className="p-4 space-y-1.5 flex-1">
        <div className="text-xs font-bold text-gray-800 mb-2">Tiêu chí xét duyệt:</div>
        {review.eligibility_reasons.map((r, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
            {review.eligible ? (
              <CheckCircle2 size={14} className="text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle size={14} className="text-rose-600 shrink-0 mt-0.5" />
            )}
            <span>{r}</span>
          </div>
        ))}

        {review.violation_count > 0 && (
          <div className="mt-3 p-2.5 rounded-xl text-xs bg-rose-50 text-rose-800 border border-rose-100 flex items-center gap-2">
            <ShieldAlert size={15} className="text-rose-600 shrink-0" />
            <span>Ghi nhận {review.violation_count} lỗi kỷ luật ({review.critical_violations} lỗi nghiêm trọng)</span>
          </div>
        )}
      </div>

      {/* Actions */}
      {review.status === 'pending' && onApprove && onReject ? (
        <div className="p-4 pt-0 flex gap-2">
          <button
            onClick={onReject}
            className="flex-1 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition"
          >
            Từ Chối
          </button>
          <button
            onClick={onApprove}
            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs"
          >
            Phê Duyệt Thăng Cấp
          </button>
        </div>
      ) : (
        <div className="p-4 pt-0 text-center">
          <span className="text-xs font-bold text-gray-500">
            Trạng thái: {review.status === 'approved' ? 'Đã phê duyệt' : 'Đã từ chối'}
          </span>
        </div>
      )}
    </div>
  )
}
