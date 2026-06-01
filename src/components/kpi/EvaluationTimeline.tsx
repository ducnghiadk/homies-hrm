'use client'

import { getEvaluationTimeline } from '@/lib/mock-data-kpi'
import type { EvaluationTimeline as TimelinePhase } from '@/lib/kpi-types'

interface Props {
  currentDay?: number
  period?: string // '2026-02'
  editable?: boolean
  onUpdate?: (phases: TimelinePhase[]) => void
}

const PHASE_CONFIG: Record<string, { icon: string; color: string }> = {
  data_collection:  { icon: '📊', color: '#6366f1' },
  self_evaluation:  { icon: '📝', color: '#2F6FA8' },
  review:           { icon: '✅', color: '#F6C85F' },
  publish:          { icon: '📢', color: '#1E9E57' },
  appeal:           { icon: '⚖️', color: '#D9381E' },
}

function getCurrentPeriodStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getPhaseStatus(phase: TimelinePhase, day: number, isCurrentPeriod: boolean): 'done' | 'active' | 'upcoming' {
  if (!isCurrentPeriod) return 'done' // historical period → all completed
  if (day > phase.end_day) return 'done'
  if (day >= phase.start_day && day <= phase.end_day) return 'active'
  return 'upcoming'
}

export default function EvaluationTimeline({ currentDay, period, editable, onUpdate }: Props) {
  const actualPeriod = period ?? getCurrentPeriodStr()
  const isCurrentPeriod = actualPeriod === getCurrentPeriodStr()
  const today = currentDay ?? (isCurrentPeriod ? new Date().getDate() : 0)
  const phases = getEvaluationTimeline()

  const activePhase = isCurrentPeriod ? phases.find(p => today >= p.start_day && today <= p.end_day) : undefined
  const periodMonth = actualPeriod.slice(5)
  const periodYear = actualPeriod.slice(0, 4)

  return (
    <div className="card p-4 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          📅 Lịch đánh giá tháng {periodMonth}/{periodYear}
        </h3>
        {activePhase && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
            Ngày {today}
          </span>
        )}
      </div>

      {/* Progress track */}
      <div className="flex items-center gap-0.5 px-1">
        {phases.map((phase, i) => {
          const status = getPhaseStatus(phase, today, isCurrentPeriod)
          const cfg = PHASE_CONFIG[phase.phase] ?? { icon: '⚪', color: '#9ca3af' }
          const widthPct = ((phase.end_day - phase.start_day + 1) / 30) * 100
          return (
            <div key={phase.id} className="relative" style={{ width: `${widthPct}%` }}>
              <div className="h-1.5 rounded-full" style={{
                background: status === 'done' ? cfg.color : status === 'active' ? cfg.color : 'var(--gray-200)',
                opacity: status === 'upcoming' ? 0.4 : 1,
              }} />
              {i === 0 && <span className="absolute -top-0.5 left-0 text-[8px]" style={{ color: 'var(--text-muted)' }}>{phase.start_day}</span>}
              <span className="absolute -top-0.5 right-0 text-[8px]" style={{ color: 'var(--text-muted)' }}>{phase.end_day}</span>
            </div>
          )
        })}
      </div>

      {/* Phase list */}
      <div className="space-y-1.5 mt-1">
        {phases.map(phase => {
          const status = getPhaseStatus(phase, today, isCurrentPeriod)
          const cfg = PHASE_CONFIG[phase.phase] ?? { icon: '⚪', color: '#9ca3af' }
          const daysLeft = status === 'active' ? phase.end_day - today : 0

          if (editable && onUpdate) {
            return (
              <div key={phase.id} className="flex items-center gap-2 text-xs">
                <span>{cfg.icon}</span>
                <span className="flex-1 font-semibold" style={{ color: 'var(--text-primary)' }}>{phase.name}</span>
                <input type="number" min={1} max={31} value={phase.start_day}
                  onChange={e => {
                    const newPhases = phases.map(p => p.id === phase.id ? { ...p, start_day: +e.target.value } : p)
                    onUpdate(newPhases)
                  }}
                  className="w-10 px-1 py-0.5 rounded text-center text-xs outline-none"
                  style={{ border: '1px solid var(--gray-200)' }} />
                <span style={{ color: 'var(--text-muted)' }}>–</span>
                <input type="number" min={1} max={31} value={phase.end_day}
                  onChange={e => {
                    const newPhases = phases.map(p => p.id === phase.id ? { ...p, end_day: +e.target.value } : p)
                    onUpdate(newPhases)
                  }}
                  className="w-10 px-1 py-0.5 rounded text-center text-xs outline-none"
                  style={{ border: '1px solid var(--gray-200)' }} />
              </div>
            )
          }

          return (
            <div key={phase.id} className="flex items-center gap-2 text-xs">
              <span className="text-xs">
                {status === 'done' ? '✅' : status === 'active' ? '🔵' : '⚪'}
              </span>
              <span className="flex-1 font-semibold" style={{
                color: status === 'active' ? cfg.color : status === 'done' ? 'var(--text-muted)' : 'var(--text-secondary)',
              }}>
                {cfg.icon} {phase.name}
              </span>
              <span className="text-[10px] font-mono" style={{ color: 'var(--text-muted)' }}>
                {phase.start_day}–{phase.end_day}
              </span>
              <span className="text-[10px] font-semibold" style={{
                color: status === 'done' ? '#1E9E57' : status === 'active' ? cfg.color : 'var(--text-muted)',
              }}>
                {status === 'done' ? 'Xong' : status === 'active' ? `Còn ${daysLeft} ngày` : 'Sắp tới'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Smart tip */}
      {activePhase && (
        <div className="text-[11px] px-3 py-2 rounded-lg" style={{ background: '#eff6ff', color: '#1e40af' }}>
          💡 {activePhase.phase === 'self_evaluation'
            ? `Hoàn thành tự đánh giá trước ${activePhase.end_day}/${periodMonth}`
            : activePhase.phase === 'review'
            ? `Hoàn thành review trước ${activePhase.end_day}/${periodMonth}`
            : `${activePhase.name} đang diễn ra`
          }
        </div>
      )}
    </div>
  )
}
