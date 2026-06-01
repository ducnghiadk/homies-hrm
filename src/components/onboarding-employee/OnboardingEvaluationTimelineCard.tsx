'use client'

import { useState } from 'react'
import type {
  OnboardingStageEvaluationTimelineEntry,
  OnboardingStageEvaluationTimelineView,
} from '@/lib/career-path-types'

function formatTimestamp(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('vi-VN')
}

const toneStyles: Record<OnboardingStageEvaluationTimelineEntry['status_tone'], { background: string; color: string }> = {
  neutral: {
    background: '#EFF6FF',
    color: '#2F6FA8',
  },
  good: {
    background: '#DCFCE7',
    color: '#166534',
  },
  warning: {
    background: '#FEF3C7',
    color: '#92400E',
  },
}

function TimelineEntryCard({ entry }: { entry: OnboardingStageEvaluationTimelineEntry }) {
  const tone = toneStyles[entry.status_tone]

  return (
    <div className="rounded-[18px] border border-[#E5E7EB] bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="text-xs font-semibold text-[#2F6FA8]">{formatTimestamp(entry.occurred_at)}</div>
        <span
          className="rounded-full px-3 py-1 text-[11px] font-semibold"
          style={{ background: tone.background, color: tone.color }}
        >
          {entry.entry_type === 'self_review' ? 'Tu danh gia' : entry.entry_type === 'mini_quiz' ? 'Mini test' : 'Gate'}
        </span>
      </div>
      <div className="mt-2 text-sm font-bold text-[#001D3D]">{entry.headline}</div>
      <div className="mt-2 space-y-1 text-sm text-[#475569]">
        {entry.summary_lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  )
}

export function OnboardingEvaluationTimelineCard({
  stageLabel,
  timelineView,
}: {
  stageLabel: string
  timelineView: OnboardingStageEvaluationTimelineView
}) {
  const [expanded, setExpanded] = useState(false)
  const previewEntries = expanded ? timelineView.entries : timelineView.entries.slice(0, 3)

  return (
    <section className="animate-slide-up rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#2F6FA8]">Timeline danh gia chang nay</div>
      <h3 className="mt-1 text-lg font-bold text-[#001D3D]">{stageLabel}</h3>
      <p className="mt-2 text-sm text-[#4B5563]">
        Gom mini test, tu danh gia, va gate trong chang nay de de nhin lai tien trinh.
      </p>

      {timelineView.entries.length === 0 ? (
        <div className="mt-4 rounded-[18px] border border-[#E5E7EB] bg-[#F8FAFC] p-4 text-sm text-[#64748B]">
          Chua co du lieu danh gia trong chang nay.
        </div>
      ) : (
        <>
          <div className="mt-4 space-y-3">
            {previewEntries.map((entry) => (
              <TimelineEntryCard key={entry.id} entry={entry} />
            ))}
          </div>

          {timelineView.entries.length > 3 ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              className="mt-4 inline-flex rounded-full bg-[#001D3D] px-4 py-2 text-sm font-semibold text-white"
            >
              {expanded ? 'Thu lich su chang nay' : 'Xem lich su chang nay'}
            </button>
          ) : null}
        </>
      )}
    </section>
  )
}
