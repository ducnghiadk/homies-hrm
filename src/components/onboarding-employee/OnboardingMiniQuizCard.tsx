'use client'

import { useState } from 'react'
import type { OnboardingMiniQuizView } from '@/lib/career-path-types'

type OnboardingMiniQuizCardProps = {
  stageLabel: string
  quizView: OnboardingMiniQuizView
  onSubmit: (answers: Record<string, string>) => void
}

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

export function OnboardingMiniQuizCard({
  stageLabel,
  quizView,
  onSubmit,
}: OnboardingMiniQuizCardProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(quizView.template.questions.map((question) => [question.id, ''])),
  )

  const questionMap = new Map(quizView.template.questions.map((question) => [question.id, question.prompt]))
  const canSubmit = quizView.template.questions.every((question) => Boolean(answers[question.id]))

  const handleSubmit = () => {
    if (!canSubmit) return
    onSubmit(answers)
  }

  return (
    <section className="animate-slide-up rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#2F6FA8]">Mini test chặng này</div>
      <h3 className="mt-1 text-lg font-bold text-[#001D3D]">{quizView.template.title}</h3>
      <p className="mt-2 text-sm text-[#4B5563]">
        Làm ngay trong chặng {stageLabel}. Cho làm lại nhiều lần, giữ lịch sử, không chặn gate.
      </p>

      <div className="mt-3 inline-flex rounded-full bg-[#EFF6FF] px-3 py-2 text-sm font-semibold text-[#2F6FA8]">
        {quizView.status_label}
        {quizView.latest ? ` • ${quizView.latest.score}%` : ''}
      </div>

      <div className="mt-4 space-y-4">
        {quizView.template.questions.map((question, index) => (
          <div key={question.id} className="rounded-[20px] border border-[#E5E7EB] p-4">
            <div className="text-sm font-semibold text-[#001D3D]">
              Câu {index + 1}. {question.prompt}
            </div>
            <div className="mt-3 space-y-2">
              {question.options.map((option) => {
                const checked = answers[question.id] === option.id

                return (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.id }))}
                    className="flex w-full items-start gap-3 rounded-[16px] border px-3 py-3 text-left text-sm transition"
                    style={{
                      borderColor: checked ? '#001D3D' : '#CBD5E1',
                      background: checked ? '#EFF6FF' : '#FFFFFF',
                      color: '#0F172A',
                    }}
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px] font-bold">
                      {option.id.toUpperCase()}
                    </span>
                    <span>{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
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
        Nộp mini test mới
      </button>

      <div className="mt-5 rounded-[20px] border border-[#E5E7EB] bg-[#F8FAFC] p-4">
        <div className="text-sm font-bold text-[#001D3D]">Kết quả mới nhất</div>
        {!quizView.latest ? (
          <div className="mt-3 rounded-[18px] bg-white p-3 text-sm text-[#64748B]">
            Bạn chưa làm mini test chặng này.
          </div>
        ) : (
          <div className="mt-3 rounded-[18px] border border-[#E5E7EB] bg-white p-3">
            <div className="text-xs font-semibold text-[#2F6FA8]">{formatTimestamp(quizView.latest.submitted_at)}</div>
            <div className="mt-2 text-sm font-semibold text-[#001D3D]">
              Điểm tổng: {quizView.latest.score}% • {quizView.status_label}
            </div>
            <div className="mt-2 text-sm text-[#475569]">
              {quizView.latest_wrong_question_ids.length === 0
                ? 'Không có câu sai trong lần mới nhất.'
                : `Cần ôn lại: ${quizView.latest_wrong_question_ids.map((id) => questionMap.get(id) ?? id).join(' | ')}`}
            </div>
          </div>
        )}

        {quizView.history.length > 1 ? (
          <div className="mt-4">
            <div className="text-sm font-bold text-[#001D3D]">Lịch sử gần nhất</div>
            <div className="mt-3 space-y-3">
              {quizView.history.slice(1, 4).map((attempt) => (
                <div key={attempt.id} className="rounded-[18px] border border-[#E5E7EB] bg-white p-3">
                  <div className="text-xs font-semibold text-[#2F6FA8]">{formatTimestamp(attempt.submitted_at)}</div>
                  <div className="mt-2 text-sm text-[#334155]">{`\u0110i\u1ec3m: ${attempt.score}%`}</div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
