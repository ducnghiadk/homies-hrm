'use client'

import React, { useState } from 'react'
import {
  PEER_QUESTION_CODES,
  PEER_QUESTION_LABELS,
  getDefaultPeerReviewPolicy,
  validatePeerResponseDraft,
  type KpiPeerAnswer,
  type KpiPeerAssignment,
  type KpiPeerReviewerTaskDto,
  type PeerResponseDraftInput,
} from '@/lib/kpi'

type KpiPeerQuestionCode = KpiPeerAnswer['question_code']
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Info,
  Send,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react'

export interface KPIPeerReviewFormProps {
  task: KpiPeerReviewerTaskDto
  onSubmit(draft: PeerResponseDraftInput): Promise<void>
  onCancel(): void
}

const SCORE_LABELS: Record<number, { title: string; desc: string }> = {
  1: { title: '1 - Chưa đạt', desc: 'Thường xuyên vi phạm quy chuẩn, cần nhắc nhở liên tục' },
  2: { title: '2 - Cần cải thiện', desc: 'Còn sót quy trình hoặc chậm tiến độ khi đông khách' },
  3: { title: '3 - Đạt yêu cầu', desc: 'Làm đúng chuẩn, hoàn thành đầy đủ nhiệm vụ trong ca' },
  4: { title: '4 - Tốt', desc: 'Thành thạo, chủ động hỗ trợ đồng nghiệp khi cần' },
  5: { title: '5 - Xuất sắc', desc: 'Gương mẫu, xử lý tình huống linh hoạt và truyền năng lượng' },
}

const SITUATION_OPTIONS = [
  { value: 'peak_hours', label: 'Giờ cao điểm đông khách' },
  { value: 'shift_handover', label: 'Lúc giao nhận ca & kiểm kho' },
  { value: 'incident_handling', label: 'Xử lý sự cố khách hàng / thiết bị' },
  { value: 'daily_routine', label: 'Vận hành và dọn quầy thường ngày' },
]

export function KPIPeerReviewForm({
  task,
  onSubmit,
  onCancel,
}: KPIPeerReviewFormProps) {
  const [answers, setAnswers] = useState<Partial<Record<KpiPeerQuestionCode, Partial<KpiPeerAnswer>>>>({})
  const [strengthNote, setStrengthNote] = useState('')
  const [improvementNote, setImprovementNote] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const answeredCount = Object.keys(answers).filter((code) => {
    const a = answers[code as KpiPeerQuestionCode]
    return typeof a?.score === 'number'
  }).length

  const handleScoreSelect = (code: KpiPeerQuestionCode, score: 1 | 2 | 3 | 4 | 5) => {
    setAnswers((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        question_code: code,
        score,
      },
    }))
  }

  const handleEvidenceUpdate = (
    code: KpiPeerQuestionCode,
    field: 'observed_date' | 'situation_code' | 'evidence_note',
    value: string
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [code]: {
        ...prev[code],
        [field]: value,
      },
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    const formattedAnswers: KpiPeerAnswer[] = PEER_QUESTION_CODES.map((code) => {
      const a = answers[code]
      return {
        question_code: code,
        score: (a?.score || 3) as 1 | 2 | 3 | 4 | 5,
        observed_date: a?.observed_date,
        situation_code: a?.situation_code,
        evidence_note: a?.evidence_note,
      }
    })

    const draft: PeerResponseDraftInput = {
      answers: formattedAnswers,
      strength_note: strengthNote,
      improvement_note: improvementNote,
      direct_observation_confirmed: confirmed,
    }

    const mockAssignment: KpiPeerAssignment = {
      id: task.assignment_id,
      monthly_review_id: task.monthly_review_id,
      reviewer_id: 'current_actor',
      rank: 1,
      shared_shift_count: task.shared_shift_count,
      total_shift_count: 20,
      selected_by: 'manager',
      status: 'assigned',
      assigned_at: new Date().toISOString(),
      deadline_at: task.deadline_at,
    }

    const issues = validatePeerResponseDraft(
      { assignment: mockAssignment, draft },
      getDefaultPeerReviewPolicy()
    )

    if (issues.length > 0) {
      const firstIssue = issues[0]
      setErrorMessage(firstIssue.message || 'Vui lòng kiểm tra lại thông tin.')
      return
    }

    try {
      setIsSubmitting(true)
      await onSubmit(draft)
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Lỗi gửi phiếu đánh giá.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* HEADER CARD */}
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
              <Sparkles size={22} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                Phiếu góp ý ẩn danh
              </span>
              <h3 className="text-base font-bold text-[#001D3D] mt-0.5">
                Góp ý cho đồng nghiệp: {task.subject.name}
              </h3>
              <p className="text-xs text-gray-500">
                {task.subject.position_name} · Làm chung {task.shared_shift_count} ca trong tháng {task.month}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* TIẾN ĐỘ TRẢ LỜI */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
          <span className="text-gray-500 font-medium">Tiến độ hoàn thành:</span>
          <span className="font-mono font-bold text-[#2F6FA8]">
            {answeredCount} / 5 câu hỏi
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-[#2F6FA8] transition-all duration-300"
            style={{ width: `${(answeredCount / 5) * 100}%` }}
          />
        </div>
      </div>

      {/* BANNER ẨN DANH */}
      <div className="rounded-2xl border border-purple-100 bg-purple-50/50 p-4 text-xs text-purple-900 flex items-start gap-3">
        <ShieldCheck size={18} className="text-purple-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Bảo vệ ẩn danh 100%:</p>
          <p className="text-[11px] text-purple-800 leading-relaxed">
            Đồng nghiệp và Quản lý sẽ chỉ nhìn thấy <strong>điểm trung bình gộp</strong> và <strong>nhận xét tổng hợp</strong>. Danh tính của bạn được hệ thống giữ kín tuyệt đối.
          </p>
        </div>
      </div>

      {/* LỖI SUBMIT NẾU CÓ */}
      {errorMessage && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 flex items-start gap-2.5">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Chưa thể gửi phiếu:</p>
            <p className="text-[11px] mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* 5 CÂU HỎI ĐÁNH GIÁ */}
      <div className="space-y-4">
        {PEER_QUESTION_CODES.map((code, index) => {
          const currentAnswer = answers[code]
          const currentScore = currentAnswer?.score
          const isExtremeScore = currentScore === 1 || currentScore === 2 || currentScore === 5

          return (
            <div
              key={code}
              className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2F6FA8]/10 text-[11px] font-bold text-[#2F6FA8]">
                      {index + 1}
                    </span>
                    <h4 className="text-sm font-bold text-[#001D3D]">
                      {PEER_QUESTION_LABELS[code]}
                    </h4>
                  </div>
                  <p className="text-xs text-gray-500 pl-7">
                    Quan sát thái độ và chất lượng thực tế trong các ca làm việc chung.
                  </p>
                </div>

                {typeof currentScore === 'number' && (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
                    {currentScore} Điểm
                  </span>
                )}
              </div>

              {/* 5 NÚT CHỌN ĐIỂM */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-5 pl-7">
                {[1, 2, 3, 4, 5].map((score) => {
                  const isSelected = currentScore === score
                  const scoreInfo = SCORE_LABELS[score]

                  return (
                    <button
                      key={score}
                      type="button"
                      onClick={() => handleScoreSelect(code, score as 1 | 2 | 3 | 4 | 5)}
                      className={`flex flex-col justify-between rounded-xl border p-3 text-left transition-all cursor-pointer min-h-[70px] ${
                        isSelected
                          ? 'border-[#2F6FA8] bg-[#2F6FA8]/5 ring-2 ring-[#2F6FA8]/20'
                          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/70'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-mono text-xs font-bold ${isSelected ? 'text-[#2F6FA8]' : 'text-gray-700'}`}>
                          {score} Sao
                        </span>
                        {isSelected && <CheckCircle2 size={13} className="text-[#2F6FA8]" />}
                      </div>
                      <p className="text-[10px] text-gray-500 line-clamp-2 mt-1">
                        {scoreInfo.title.split(' - ')[1]}
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* KHUNG BẰNG CHỨNG NẾU ĐIỂM CỰC TRỊ (1, 2 HOẶC 5) */}
              {isExtremeScore && (
                <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 space-y-3 ml-7">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                    <Info size={14} className="text-amber-700" />
                    <span>
                      {currentScore === 5
                        ? 'Điểm xuất sắc (5 điểm) — Vui lòng ghi lại tình huống thực tế:'
                        : 'Điểm cần cải thiện (1 - 2 điểm) — Vui lòng mô tả cụ thể sự việc:'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {/* NGÀY QUAN SÁT */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Ngày làm việc quan sát được
                      </label>
                      <input
                        type="date"
                        value={currentAnswer?.observed_date || ''}
                        onChange={(e) => handleEvidenceUpdate(code, 'observed_date', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-[#2F6FA8] focus:outline-hidden"
                      />
                    </div>

                    {/* BỐI CẢNH */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        Bối cảnh tình huống
                      </label>
                      <select
                        value={currentAnswer?.situation_code || ''}
                        onChange={(e) => handleEvidenceUpdate(code, 'situation_code', e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-800 focus:border-[#2F6FA8] focus:outline-hidden"
                      >
                        <option value="">-- Chọn bối cảnh --</option>
                        {SITUATION_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* GHI CHÚ BẰNG CHỨNG (TỐI THIỂU 20 KÝ TỰ) */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-gray-600 mb-1">
                      <span className="font-bold">Mô tả sự việc chi tiết (Tối thiểu 20 ký tự):</span>
                      <span className={`font-mono ${(currentAnswer?.evidence_note?.length || 0) >= 20 ? 'text-emerald-700 font-bold' : 'text-amber-700'}`}>
                        {currentAnswer?.evidence_note?.length || 0} / 20 ký tự
                      </span>
                    </div>
                    <textarea
                      rows={2}
                      placeholder="Mô tả cụ thể hành vi hỗ trợ đồng đội hoặc điểm cần khắc phục trong ca..."
                      value={currentAnswer?.evidence_note || ''}
                      onChange={(e) => handleEvidenceUpdate(code, 'evidence_note', e.target.value)}
                      className="w-full rounded-lg border border-gray-200 bg-white p-2.5 text-xs text-gray-800 placeholder-gray-400 focus:border-[#2F6FA8] focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* HAI KHUNG NHẬN XÉT ĐIỂM MẠNH & CẢI THIỆN */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-2">
          <label className="text-xs font-bold text-[#001D3D] flex items-center gap-1.5">
            <Sparkles size={14} className="text-emerald-600" />
            <span>Điểm mạnh nổi bật của bạn ấy</span>
          </label>
          <textarea
            rows={3}
            required
            placeholder="Ví dụ: Rất chủ động dọn quầy, hỗ trợ đồng đội nhanh khi quán đông..."
            value={strengthNote}
            onChange={(e) => setStrengthNote(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-800 placeholder-gray-400 focus:border-[#2F6FA8] focus:outline-hidden"
          />
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-2">
          <label className="text-xs font-bold text-[#001D3D] flex items-center gap-1.5">
            <HelpCircle size={14} className="text-amber-600" />
            <span>Điểm bạn ấy có thể làm tốt hơn nữa</span>
          </label>
          <textarea
            rows={3}
            required
            placeholder="Ví dụ: Cần bàn giao số lượng nguyên liệu tồn kỹ hơn khi đổi ca..."
            value={improvementNote}
            onChange={(e) => setImprovementNote(e.target.value)}
            className="w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-800 placeholder-gray-400 focus:border-[#2F6FA8] focus:outline-hidden"
          />
        </div>
      </div>

      {/* CHECKBOX XÁC NHẬN */}
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-xs">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="h-4 w-4 rounded accent-[#2F6FA8] mt-0.5"
          />
          <span className="text-xs text-gray-700 font-medium">
            Tôi xác nhận các nhận xét trên hoàn toàn trung thực, công tâm và dựa trên quan sát thực tế trong các ca làm việc chung cùng bạn ấy tại cửa hàng.
          </span>
        </label>
      </div>

      {/* FOOTER ACTIONS (STICKY) */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white/95 p-3.5 shadow-lg backdrop-blur-sm">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex min-h-[40px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 cursor-pointer"
        >
          <span>Hủy Bỏ</span>
        </button>

        <button
          type="submit"
          disabled={isSubmitting || answeredCount < 5 || !confirmed || !strengthNote.trim() || !improvementNote.trim()}
          className="flex min-h-[40px] items-center gap-2 rounded-xl bg-[#2F6FA8] px-6 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#1D3E61] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Send size={14} />
          <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Phiếu Góp Ý'}</span>
        </button>
      </div>
    </form>
  )
}
