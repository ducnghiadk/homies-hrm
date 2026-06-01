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
    background: 'rgba(47, 111, 168, 0.10)',
    color: '#2F6FA8',
  },
  good: {
    background: 'rgba(30, 158, 87, 0.12)',
    color: '#1E9E57',
  },
  warning: {
    background: 'rgba(246, 200, 95, 0.22)',
    color: '#8A5A00',
  },
}

function EntryCard({ entry }: { entry: OnboardingStageEvaluationTimelineEntry }) {
  const tone = toneStyles[entry.status_tone]

  return (
    <div
      style={{
        borderRadius: 16,
        padding: 12,
        background: '#FFFFFF',
        border: '1px solid rgba(0, 29, 61, 0.08)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#2F6FA8' }}>{formatTimestamp(entry.occurred_at)}</div>
        <span
          style={{
            borderRadius: 999,
            padding: '4px 10px',
            fontSize: 10,
            fontWeight: 800,
            background: tone.background,
            color: tone.color,
          }}
        >
          {entry.entry_type === 'self_review' ? 'Tu danh gia' : entry.entry_type === 'mini_quiz' ? 'Mini test' : 'Gate'}
        </span>
      </div>
      <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, color: '#001D3D' }}>{entry.headline}</div>
      <div style={{ marginTop: 8, fontSize: 13, color: '#334155', lineHeight: 1.5 }}>
        {entry.summary_lines.map((line) => (
          <div key={line}>{line}</div>
        ))}
      </div>
    </div>
  )
}

export function OnboardingEvaluationTimelineSummary({
  timelineView,
}: {
  timelineView: OnboardingStageEvaluationTimelineView | null
}) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div
      style={{
        borderRadius: 18,
        padding: 12,
        background: '#F8FAFC',
        border: '1px solid rgba(0, 29, 61, 0.08)',
        marginBottom: 18,
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 800, color: '#7A6B53', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        Timeline danh gia chang hien tai
      </div>
      <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>
        Gom mini test, tu danh gia, va gate theo thu tu moi nhat de doc nhanh.
      </div>

      {!timelineView || timelineView.entries.length === 0 ? (
        <div
          style={{
            marginTop: 12,
            borderRadius: 16,
            padding: 12,
            background: '#FFFFFF',
            fontSize: 13,
            color: '#64748B',
          }}
        >
          Chua co du lieu danh gia trong chang nay.
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
            {(expanded ? timelineView.entries : timelineView.entries.slice(0, 3)).map((entry) => (
              <EntryCard key={entry.id} entry={entry} />
            ))}
          </div>
          {timelineView.entries.length > 3 ? (
            <button
              type="button"
              onClick={() => setExpanded((current) => !current)}
              style={{
                marginTop: 12,
                borderRadius: 999,
                padding: '8px 12px',
                background: '#001D3D',
                color: '#FFFFFF',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {expanded ? 'Thu lich su trong chang' : 'Xem lich su trong chang'}
            </button>
          ) : null}
        </>
      )}
    </div>
  )
}
