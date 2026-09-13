'use client'

import { useState } from 'react'
import type {
  OnboardingSelfReviewAnswers,
  OnboardingSelfReviewCoachingTag,
  OnboardingSelfReviewConfidenceTag,
  OnboardingSelfReviewEntry,
  OnboardingSelfReviewFearTag,
} from '@/lib/career-path-types'

const CONFIDENCE_OPTIONS: Array<{ value: OnboardingSelfReviewConfidenceTag; label: string }> = [
  { value: 'quy_trinh', label: 'Quy trình' },
  { value: 'thao_tac', label: 'Thao tác' },
  { value: 'giao_tiep_khach', label: 'Giao tiếp khách' },
  { value: 'toc_do', label: 'Tốc độ' },
  { value: 've_sinh', label: 'Vệ sinh' },
  { value: 'phoi_hop_ca', label: 'Phối hợp ca' },
]

const COACHING_OPTIONS: Array<{ value: OnboardingSelfReviewCoachingTag; label: string }> = [
  { value: 'quy_trinh', label: 'Quy trình' },
  { value: 'thao_tac', label: 'Thao tác' },
  { value: 'giao_tiep_khach', label: 'Giao tiếp khách' },
  { value: 'toc_do', label: 'Tốc độ' },
  { value: 've_sinh', label: 'Vệ sinh' },
  { value: 'phoi_hop_ca', label: 'Phối hợp ca' },
]

const FEAR_OPTIONS: Array<{ value: OnboardingSelfReviewFearTag; label: string }> = [
  { value: 'nham_order', label: 'Nhầm order' },
  { value: 'cham_nhip', label: 'Chậm nhịp' },
  { value: 'sai_cong_thuc', label: 'Sai công thức' },
  { value: 'quen_quy_trinh', label: 'Quên quy trình' },
  { value: 'giao_tiep_khach', label: 'Giao tiếp khách' },
  { value: 'xu_ly_loi', label: 'Xử lý lỗi' },
]

type OnboardingSelfReviewCardProps = {
  stageLabel: string
  history: OnboardingSelfReviewEntry[]
  onSubmit: (answers: OnboardingSelfReviewAnswers) => void
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

function getTagLabel(
  value: OnboardingSelfReviewConfidenceTag | OnboardingSelfReviewCoachingTag | OnboardingSelfReviewFearTag,
) {
  return [...CONFIDENCE_OPTIONS, ...FEAR_OPTIONS].find((item) => item.value === value)?.label || value
}

export function OnboardingSelfReviewCard({
  stageLabel,
  history,
  onSubmit,
}: OnboardingSelfReviewCardProps) {
  const [confidenceTag, setConfidenceTag] = useState<OnboardingSelfReviewConfidenceTag | null>(null)
  const [confidenceNote, setConfidenceNote] = useState('')
  const [coachingTag, setCoachingTag] = useState<OnboardingSelfReviewCoachingTag | null>(null)
  const [coachingNote, setCoachingNote] = useState('')
  const [fearTag, setFearTag] = useState<OnboardingSelfReviewFearTag | null>(null)
  const [fearNote, setFearNote] = useState('')

  const canSubmit = Boolean(confidenceTag && coachingTag && fearTag)

  const handleSubmit = () => {
    if (!confidenceTag || !coachingTag || !fearTag) return

    onSubmit({
      confidence_tag: confidenceTag,
      confidence_note: confidenceNote,
      coaching_tag: coachingTag,
      coaching_note: coachingNote,
      fear_tag: fearTag,
      fear_note: fearNote,
    })

    setConfidenceTag(null)
    setConfidenceNote('')
    setCoachingTag(null)
    setCoachingNote('')
    setFearTag(null)
    setFearNote('')
  }

  return (
    <section className="animate-slide-up rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#2F6FA8]">Tự đánh giá chặng này</div>
      <h3 className="mt-1 text-lg font-bold text-[#001D3D]">{stageLabel}</h3>
      <p className="mt-2 text-sm text-[#4B5563]">
        Tự nhìn lại để buddy và quản lý kèm đúng điểm. Không dùng để chặn qua chặng.
      </p>

      <div className="mt-4 space-y-4">
        <QuestionBlock
          title="Hôm nay em tự tin nhất mục nào?"
          options={CONFIDENCE_OPTIONS}
          selected={confidenceTag}
          note={confidenceNote}
          onSelect={(value) => setConfidenceTag(value as OnboardingSelfReviewConfidenceTag)}
          onNoteChange={setConfidenceNote}
          notePlaceholder="Ví dụ: Em nhớ quy trình mở ca nhưng vẫn cần nhắc khi đông khách."
        />

        <QuestionBlock
          title="Mục nào em vẫn cần người kèm sát?"
          options={COACHING_OPTIONS}
          selected={coachingTag}
          note={coachingNote}
          onSelect={(value) => setCoachingTag(value as OnboardingSelfReviewCoachingTag)}
          onNoteChange={setCoachingNote}
          notePlaceholder="Ví dụ: Em còn chậm ở đoạn xác nhận order."
        />

        <QuestionBlock
          title="Nếu ngày mai đứng ca thật, em sợ nhất điều gì?"
          options={FEAR_OPTIONS}
          selected={fearTag}
          note={fearNote}
          onSelect={(value) => setFearTag(value as OnboardingSelfReviewFearTag)}
          onNoteChange={setFearNote}
          notePlaceholder="Ví dụ: Em sợ nhầm order khi khách đổi topping nhiều lần."
        />
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="mt-5 inline-flex rounded-full px-4 py-2 text-sm font-semibold transition"
        style={{
          background: canSubmit ? '#001D3D' : '#CBD5E1',
          color: '#FFFFFF',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
        }}
      >
        Lưu lần tự đánh giá mới
      </button>

      <div className="mt-5 rounded-[20px] border border-[#E5E7EB] bg-[#F8FAFC] p-4">
        <div className="text-sm font-bold text-[#001D3D]">Lịch sử tự đánh giá</div>
        {history.length === 0 ? (
          <div className="mt-3 rounded-[18px] bg-white p-3 text-sm text-[#64748B]">
            Bạn chưa tự đánh giá chặng này.
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {history.map((entry) => (
              <div key={entry.id} className="rounded-[18px] border border-[#E5E7EB] bg-white p-3">
                <div className="text-xs font-semibold text-[#2F6FA8]">{formatTimestamp(entry.submitted_at)}</div>
                <div className="mt-2 space-y-2 text-sm text-[#334155]">
                  <HistoryLine
                    label="Tự tin nhất"
                    tag={getTagLabel(entry.answers.confidence_tag)}
                    note={entry.answers.confidence_note}
                  />
                  <HistoryLine
                    label="Cần kèm sát"
                    tag={getTagLabel(entry.answers.coaching_tag)}
                    note={entry.answers.coaching_note}
                  />
                  <HistoryLine
                    label="Sợ nhất"
                    tag={getTagLabel(entry.answers.fear_tag)}
                    note={entry.answers.fear_note}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function QuestionBlock({
  title,
  options,
  selected,
  note,
  onSelect,
  onNoteChange,
  notePlaceholder,
}: {
  title: string
  options: Array<{ value: string; label: string }>
  selected: string | null
  note: string
  onSelect: (value: string) => void
  onNoteChange: (value: string) => void
  notePlaceholder: string
}) {
  return (
    <div className="rounded-[20px] border border-[#E5E7EB] p-4">
      <div className="text-sm font-semibold text-[#001D3D]">{title}</div>
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((option) => {
          const isActive = selected === option.value

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelect(option.value)}
              className="rounded-full px-3 py-2 text-sm font-medium transition"
              style={{
                background: isActive ? '#001D3D' : '#EFF6FF',
                color: isActive ? '#FFFFFF' : '#2F6FA8',
                border: `1px solid ${isActive ? '#001D3D' : '#BFDBFE'}`,
              }}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      <textarea
        value={note}
        onChange={(event) => onNoteChange(event.target.value)}
        placeholder={notePlaceholder}
        rows={3}
        maxLength={280}
        className="mt-3 w-full rounded-[16px] border border-[#CBD5E1] px-3 py-2 text-sm text-[#0F172A] outline-none transition focus:border-[#2F6FA8]"
      />
    </div>
  )
}

function HistoryLine({ label, tag, note }: { label: string; tag: string; note: string }) {
  return (
    <div>
      <span className="font-semibold text-[#001D3D]">{label}:</span> {tag}
      {note ? <div className="mt-1 text-[#64748B]">{note}</div> : null}
    </div>
  )
}
