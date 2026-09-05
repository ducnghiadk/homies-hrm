'use client'

import React, { useState } from 'react'
import type { KpiRankedPeerCandidate } from '@/lib/kpi'
import {
  AlertCircle,
  Award,
  Check,
  Clock,
  UserCheck,
} from 'lucide-react'

export interface KPIReviewerSelectionPanelProps {
  subjectName: string
  subjectPosition: string
  candidates: KpiRankedPeerCandidate[]
  selectedReviewerIds: string[]
  employeeNames: Record<string, { name: string; position_name: string }>
  onSaveSelection(reviewerIds: string[], reason?: string): Promise<void>
  disabled?: boolean
}

export function KPIReviewerSelectionPanel({
  subjectName,
  subjectPosition,
  candidates,
  selectedReviewerIds: initialSelected,
  employeeNames,
  onSaveSelection,
  disabled = false,
}: KPIReviewerSelectionPanelProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected)
  const [reason, setReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleToggle = (id: string) => {
    if (disabled) return
    setErrorMessage(null)

    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id))
    } else {
      if (selectedIds.length >= 2) {
        setErrorMessage('Bạn chỉ có thể chọn đúng 2 đồng nghiệp.')
        return
      }
      setSelectedIds([...selectedIds, id])
    }
  }

  const isLowRankSelected = selectedIds.some((id) => {
    const cand = candidates.find((c) => c.employee_id === id)
    return cand && cand.rank > 2
  })

  const handleSave = async () => {
    if (selectedIds.length !== 2) {
      setErrorMessage('Vui lòng chọn đúng 2 đồng nghiệp để hoàn tất phân công.')
      return
    }

    if (isLowRankSelected && !reason.trim()) {
      setErrorMessage('Vui lòng nhập lý do khi chọn đồng nghiệp không nằm trong Top 2 gợi ý.')
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage(null)
      await onSaveSelection(selectedIds, reason.trim() || undefined)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi lưu phân công.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-5">
      {/* HEADER */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2F6FA8]/10 text-[#2F6FA8]">
            <UserCheck size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#001D3D] flex items-center gap-2">
              <span>Chọn 2 đồng nghiệp đánh giá cho: {subjectName}</span>
              <span className="rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-[#2F6FA8]">
                {subjectPosition}
              </span>
            </h3>
            <p className="text-xs text-gray-500">
              Quản lý ca / Cửa hàng trưởng duyệt 2 bạn làm việc chung để gửi phiếu đánh giá ẩn danh.
            </p>
          </div>
        </div>

        {/* COUNTDOWN 24H */}
        <div className="inline-flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-900 font-medium">
          <Clock size={14} className="text-amber-700 shrink-0" />
          <span>Hạn chọn: 24h (Tự động gán nếu hết hạn)</span>
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle size={15} className="shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* DANH SÁCH ỨNG VIÊN */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-gray-700">
            Danh sách nhân viên đủ điều kiện (Đã lọc vi phạm & ca làm):
          </span>
          <span className="font-mono font-bold text-[#2F6FA8]">
            Đã chọn {selectedIds.length} / 2 người
          </span>
        </div>

        {candidates.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-500">
            Không có đủ ứng viên có từ 5 ca làm chung trở lên trong tháng này.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {candidates.map((candidate) => {
              const isSelected = selectedIds.includes(candidate.employee_id)
              const meta = employeeNames[candidate.employee_id] || {
                name: candidate.employee_id,
                position_name: 'Nhân viên',
              }
              const isTop = candidate.rank <= 2

              return (
                <div
                  key={candidate.employee_id}
                  onClick={() => handleToggle(candidate.employee_id)}
                  className={`flex items-start justify-between rounded-xl border p-3.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#2F6FA8] bg-[#2F6FA8]/5 ring-2 ring-[#2F6FA8]/15'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#001D3D]">
                        {meta.name}
                      </h4>
                      {isTop && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-800">
                          <Award size={10} /> Top {candidate.rank}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-gray-500">
                      {meta.position_name}
                    </p>

                    <div className="flex items-center gap-2 pt-1 text-[11px] text-gray-600">
                      <span className="font-mono font-bold text-[#2F6FA8]">
                        {candidate.shared_shifts} ca chung
                      </span>
                      <span>•</span>
                      <span>Tổng {candidate.total_shifts} ca</span>
                    </div>
                  </div>

                  <div className="flex items-center">
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded-md border transition-colors ${
                        isSelected
                          ? 'border-[#2F6FA8] bg-[#2F6FA8] text-white'
                          : 'border-gray-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check size={13} strokeWidth={3} />}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* LÝ DO KHI CHỌN NGOÀI TOP 2 */}
      {isLowRankSelected && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 space-y-2">
          <label className="block text-xs font-bold text-amber-900">
            Lý do chọn nhân viên ngoài Top 2 gợi ý:
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Đã có quan sát thực tế trong tuần cao điểm khai trương..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-lg border border-amber-300 bg-white p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-[#2F6FA8] focus:outline-hidden"
          />
        </div>
      )}

      {/* NÚT LƯU PHÂN CÔNG */}
      <div className="flex items-center justify-end pt-2 border-t border-gray-100">
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || isSaving || selectedIds.length !== 2 || (isLowRankSelected && !reason.trim())}
          className="flex min-h-[38px] items-center gap-2 rounded-xl bg-[#2F6FA8] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1D3E61] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <UserCheck size={14} />
          <span>{isSaving ? 'Đang lưu...' : 'Xác Nhận Phân Công 2 Người'}</span>
        </button>
      </div>
    </div>
  )
}
