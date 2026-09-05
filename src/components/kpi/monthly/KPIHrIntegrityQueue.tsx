'use client'

import React, { useState } from 'react'
import type { KpiEvaluationIntegrityFlag } from '@/lib/kpi'
import {
  AlertTriangle,
  Eye,
  Lock,
  ShieldAlert,
  ShieldCheck,
  X,
} from 'lucide-react'

export interface KPIHrIntegrityQueueProps {
  flags: KpiEvaluationIntegrityFlag[]
  onResolveFlag(flagId: string, status: 'dismissed' | 'confirmed', reason: string): Promise<void>
  onRevealIdentity(assignmentId: string, reason: string): Promise<{ reviewer_id: string }>
}

const FLAG_LABELS: Record<string, { title: string; desc: string }> = {
  RECIPROCAL_PAIR: {
    title: 'Cặp đôi chấm chéo nhau (Reciprocal)',
    desc: 'Hai nhân viên cùng chấm cho nhau trong cùng một kỳ đánh giá.',
  },
  REPEATED_PAIR: {
    title: 'Cặp đôi lặp lại liên tiếp (Repeated)',
    desc: 'Người này đã từng chấm cho đối tượng ở kỳ tháng trước.',
  },
  IDENTICAL_RESPONSES: {
    title: 'Phiếu chấm giống nhau hoàn toàn',
    desc: 'Các điểm số và câu trả lời trùng khớp bất thường giữa 2 người chấm.',
  },
  EXTREME_WITH_WEAK_EVIDENCE: {
    title: 'Điểm cực trị nhưng bằng chứng sơ sài',
    desc: 'Chấm 1 sao hoặc 5 sao nhưng ghi chú quá ngắn hoặc thiếu bối cảnh cụ thể.',
  },
  SOURCE_DIVERGENCE: {
    title: 'Điểm đồng nghiệp lệch lớn với người chấm chính',
    desc: 'Chênh lệch từ 2.0 điểm trở lên giữa điểm đồng nghiệp và điểm của Quản lý.',
  },
  MANAGER_OVERRIDE_PATTERN: {
    title: 'Quản lý thay đổi điểm gợi ý hàng loạt',
    desc: 'Quản lý sửa điểm gợi ý từ hệ thống trên 70% số tiêu chí.',
  },
  REVIEWER_BIAS_PATTERN: {
    title: 'Người chấm có xu hướng thiên vị / khắt khe',
    desc: 'Người chấm luôn cho điểm toàn 1 hoặc toàn 5 bất thường cho nhiều người.',
  },
}

export function KPIHrIntegrityQueue({
  flags,
  onResolveFlag,
  onRevealIdentity,
}: KPIHrIntegrityQueueProps) {
  const [selectedFlag, setSelectedFlag] = useState<KpiEvaluationIntegrityFlag | null>(null)
  const [resolutionReason, setResolutionReason] = useState('')
  const [revealAssignmentId, setRevealAssignmentId] = useState<string | null>(null)
  const [revealReason, setRevealReason] = useState('')
  const [revealedResult, setRevealedResult] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const openFlags = flags.filter((f) => f.status === 'open')

  const handleResolve = async (status: 'dismissed' | 'confirmed') => {
    if (!selectedFlag) return
    if (!resolutionReason.trim()) {
      setErrorMessage('Vui lòng nhập lý do xử lý cờ bất thường.')
      return
    }

    try {
      setIsProcessing(true)
      setErrorMessage(null)
      await onResolveFlag(selectedFlag.id, status, resolutionReason.trim())
      setSelectedFlag(null)
      setResolutionReason('')
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi xử lý cờ.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReveal = async () => {
    if (!revealAssignmentId) return
    if (!revealReason.trim()) {
      setErrorMessage('Vui lòng nhập lý do giải mật danh tính người đánh giá.')
      return
    }

    try {
      setIsProcessing(true)
      setErrorMessage(null)
      const res = await onRevealIdentity(revealAssignmentId, revealReason.trim())
      setRevealedResult(res.reviewer_id)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi giải mật danh tính.')
    } finally {
      setIsProcessing(false)
    }
  }

  if (openFlags.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-xs">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
          <ShieldCheck size={24} />
        </div>
        <h3 className="mt-3 text-sm font-bold text-[#001D3D]">
          Không có cờ bất thường nào đang mở
        </h3>
        <p className="mt-1 text-xs text-gray-500 max-w-sm mx-auto">
          Dữ liệu đánh giá đồng nghiệp và điểm số tháng này bảo đảm tính liêm chính, không phát hiện dấu hiệu bất thường.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-[#001D3D] uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert size={14} className="text-rose-600" />
          <span>Hàng đợi kiểm soát liêm chính & bất thường ({openFlags.length})</span>
        </h3>
        <span className="text-[11px] text-gray-500 font-medium">
          Dành riêng cho HR Admin & Ban Giám Đốc
        </span>
      </div>

      {errorMessage && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800 flex items-center gap-2">
          <AlertTriangle size={15} className="shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* DANH SÁCH CỜ */}
      <div className="grid grid-cols-1 gap-3">
        {openFlags.map((flag) => {
          const info = FLAG_LABELS[flag.code] || {
            title: flag.code,
            desc: 'Dấu hiệu bất thường trong dữ liệu đánh giá.',
          }
          const revealableAssignmentId = flag.evidence_refs
            .find((reference) => reference.startsWith('assignment:'))
            ?.slice('assignment:'.length)

          return (
            <div
              key={flag.id}
              className="rounded-2xl border border-rose-100 bg-white p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        flag.severity === 'blocking'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {flag.severity === 'blocking' ? 'Chặn công bố' : 'Cảnh báo'}
                    </span>
                    <h4 className="text-sm font-bold text-[#001D3D]">
                      {info.title}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-600 pl-1">
                    {info.desc}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {revealableAssignmentId && (
                    <button
                      type="button"
                      onClick={() => {
                        setRevealAssignmentId(revealableAssignmentId)
                        setRevealedResult(null)
                        setRevealReason('')
                      }}
                      className="flex min-h-[32px] items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>Giải Mật Danh Tính</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFlag(flag)
                      setResolutionReason('')
                    }}
                    className="flex min-h-[32px] items-center gap-1 rounded-lg bg-[#2F6FA8] px-3.5 py-1 text-[11px] font-bold text-white hover:bg-[#1D3E61] cursor-pointer"
                  >
                    <span>Xử Lý Cờ</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* MODAL XỬ LÝ CỜ */}
      {selectedFlag && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#001D3D]">
                Xử lý cờ bất thường: {selectedFlag.code}
              </h4>
              <button
                type="button"
                onClick={() => setSelectedFlag(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Lý do xử lý (Bắt buộc cho nhật ký kiểm toán):
              </label>
              <textarea
                rows={3}
                placeholder="Nhập ghi chú chi tiết kết luận sau khi rà soát..."
                value={resolutionReason}
                onChange={(e) => setResolutionReason(e.target.value)}
                className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#2F6FA8] focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => handleResolve('dismissed')}
                disabled={isProcessing || !resolutionReason.trim()}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Bỏ Qua (Hợp Lệ)
              </button>
              <button
                type="button"
                onClick={() => handleResolve('confirmed')}
                disabled={isProcessing || !resolutionReason.trim()}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700 cursor-pointer"
              >
                Xác Nhận Vi Phạm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL GIẢI MẬT DANH TÍNH */}
      {revealAssignmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-[#001D3D] flex items-center gap-1.5">
                <Lock size={15} className="text-amber-600" />
                <span>Giải Mật Danh Tính Người Đánh Giá</span>
              </h4>
              <button
                type="button"
                onClick={() => setRevealAssignmentId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Thao tác này được ghi nhận vĩnh viễn vào nhật ký kiểm toán (Audit Trail) để bảo đảm quyền riêng tư của nhân viên.
            </p>

            {revealedResult ? (
              <div className="rounded-xl bg-purple-50 p-4 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase text-purple-700">Mã Nhân Viên Đánh Giá</span>
                <p className="font-mono text-base font-bold text-purple-950">{revealedResult}</p>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Lý do giải mật bắt buộc:
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: Điều tra theo đơn khiếu nại kỷ luật ngày 24/08..."
                  value={revealReason}
                  onChange={(e) => setRevealReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-2.5 text-xs text-gray-800 focus:border-[#2F6FA8] focus:outline-hidden"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRevealAssignmentId(null)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
              >
                Đóng
              </button>
              {!revealedResult && (
                <button
                  type="button"
                  onClick={handleReveal}
                  disabled={isProcessing || !revealReason.trim()}
                  className="rounded-xl bg-[#2F6FA8] px-5 py-2 text-xs font-bold text-white hover:bg-[#1D3E61] disabled:opacity-40 cursor-pointer"
                >
                  {isProcessing ? 'Đang kiểm tra...' : 'Xác Nhận Giải Mật'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
