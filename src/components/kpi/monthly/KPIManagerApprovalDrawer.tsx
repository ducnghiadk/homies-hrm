'use client'

import React, { useState } from 'react'
import type { KpiEvaluation, KpiMonthlyReview } from '@/lib/kpi'
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from 'lucide-react'

export interface KPIManagerApprovalDrawerProps {
  isOpen: boolean
  review: KpiMonthlyReview | null
  evaluation: KpiEvaluation | null
  subjectName: string
  subjectPosition: string
  onClose(): void
  onApprove(reviewId: string): Promise<void>
  onReturn(reviewId: string, reason: string): Promise<void>
}

export function KPIManagerApprovalDrawer({
  isOpen,
  review,
  evaluation,
  subjectName,
  subjectPosition,
  onClose,
  onApprove,
  onReturn,
}: KPIManagerApprovalDrawerProps) {
  const [returnReason, setReturnReason] = useState('')
  const [showReturnInput, setShowReturnInput] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen || !review) return null

  const handleApprove = async () => {
    try {
      setIsProcessing(true)
      setErrorMessage(null)
      await onApprove(review.id)
      onClose()
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi phê duyệt kết quả.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReturn = async () => {
    if (!returnReason.trim()) {
      setErrorMessage('Vui lòng nhập lý do yêu cầu rà soát lại.')
      return
    }

    try {
      setIsProcessing(true)
      setErrorMessage(null)
      await onReturn(review.id, returnReason.trim())
      onClose()
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi trả về.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs">
      <div className="flex h-full w-full max-w-xl flex-col bg-[#FFF8E8] shadow-2xl overflow-y-auto">
        {/* HEADER */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200/80 bg-white px-5 py-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F6FA8]/10 text-[#2F6FA8]">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#001D3D]">
                Duyệt Đánh Giá Tháng: {subjectName}
              </h3>
              <p className="text-xs text-gray-500">
                {subjectPosition} · Tháng {review.period_id.replace('period-', '')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4 flex-1">
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TỔNG QUAN ĐIỂM SỐ */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Tổng Điểm Đạt Được
              </span>
              <div className="flex items-baseline gap-2 mt-0.5">
                <span className="font-mono text-2xl font-bold text-[#001D3D]">
                  {evaluation?.total_score ? evaluation.total_score.toFixed(1) : '—'}
                </span>
                <span className="text-xs text-gray-500">/ 5.0 Điểm</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Xếp Loại Dự Kiến
              </span>
              <div className="mt-0.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  <Award size={13} />
                  {evaluation?.grade_code === 'good' ? 'Tốt (Đạt chỉ tiêu)' : evaluation?.grade_code === 'excellent' ? 'Xuất Sắc' : 'Đạt'}
                </span>
              </div>
            </div>
          </div>

          {/* ĐIỂM ĐỒNG NGHIỆP ẨN DANH NẾU CÓ */}
          {evaluation?.peer_summary && (
            <div className="rounded-2xl border border-purple-100 bg-white p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#001D3D] flex items-center gap-1.5">
                  <Users size={14} className="text-purple-700" />
                  <span>Điểm Đồng Nghiệp Cùng Ca ({evaluation.peer_summary.applied_weight_percent}%)</span>
                </h4>
                <span className="font-mono text-xs font-bold text-purple-700">
                  {evaluation.peer_summary.total_score ? evaluation.peer_summary.total_score.toFixed(1) : '—'} / 5.0
                </span>
              </div>

              {evaluation.peer_summary.strength_summary && (
                <div className="text-[11px] text-gray-600 bg-purple-50/50 p-2.5 rounded-xl space-y-0.5">
                  <span className="font-bold text-purple-900">Điểm mạnh gộp:</span>
                  <p>{evaluation.peer_summary.strength_summary}</p>
                </div>
              )}

              {evaluation.peer_summary.improvement_summary && (
                <div className="text-[11px] text-gray-600 bg-amber-50/50 p-2.5 rounded-xl space-y-0.5">
                  <span className="font-bold text-amber-900">Góp ý cải thiện gộp:</span>
                  <p>{evaluation.peer_summary.improvement_summary}</p>
                </div>
              )}
            </div>
          )}

          {/* NHẬN XÉT CỦA TRƯỞNG CA */}
          {evaluation?.monthly_feedback && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs space-y-2">
              <h4 className="text-xs font-bold text-[#001D3D] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#2F6FA8]" />
                <span>Nhận xét của Trưởng ca / Người chấm chính</span>
              </h4>
              <div className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl space-y-1.5 leading-relaxed">
                <div>
                  <strong className="text-emerald-800">Điểm mạnh: </strong>
                  <span>{evaluation.monthly_feedback.strength || 'Chưa ghi nhận.'}</span>
                </div>
                <div>
                  <strong className="text-amber-800">Góp ý cải thiện: </strong>
                  <span>{evaluation.monthly_feedback.improvement || 'Chưa ghi nhận.'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Ô NHẬP LÝ DO NẾU BẤM TRẢ LẠI */}
          {showReturnInput && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 space-y-2">
              <label className="block text-xs font-bold text-amber-900">
                Lý do yêu cầu Trưởng ca chấm lại hoặc bổ sung bằng chứng:
              </label>
              <textarea
                rows={3}
                placeholder="Nhập yêu cầu cụ thể..."
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                className="w-full rounded-xl border border-amber-300 bg-white p-2.5 text-xs text-gray-800 focus:border-[#2F6FA8] focus:outline-hidden"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowReturnInput(false)}
                  className="rounded-lg px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleReturn}
                  disabled={isProcessing || !returnReason.trim()}
                  className="rounded-lg bg-amber-700 px-4 py-1 text-xs font-bold text-white hover:bg-amber-800 disabled:opacity-40 cursor-pointer"
                >
                  Xác Nhận Trả Lại
                </button>
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-gray-200 bg-white p-4 shadow-lg">
          <button
            type="button"
            onClick={() => setShowReturnInput(true)}
            disabled={isProcessing}
            className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-800 hover:bg-amber-100 cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Yêu Cầu Rà Soát Lại</span>
          </button>

          <button
            type="button"
            onClick={handleApprove}
            disabled={isProcessing}
            className="flex min-h-[40px] items-center gap-2 rounded-xl bg-[#2F6FA8] px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1D3E61] disabled:opacity-40 cursor-pointer"
          >
            <CheckCircle2 size={15} />
            <span>{isProcessing ? 'Đang duyệt...' : 'Phê Duyệt Đánh Giá'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
