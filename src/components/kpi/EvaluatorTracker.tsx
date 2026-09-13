'use client'

import type { EvaluatorRole } from '@/lib/kpi-types'
import { toast } from 'sonner'

interface Evaluator {
  id: string
  name: string
  avatar?: string
  role: EvaluatorRole
  required: boolean
  submitted: boolean
  submittedAt?: string
  score?: number
}

interface Props {
  evaluators: Evaluator[]
  employeeName?: string
  deadline?: string
  onRemind?: (evaluatorId: string) => void
  onRemindAll?: () => void
}

const ROLE_ICONS: Record<string, string> = {
  mentor: '👨‍🏫', senior: '👷', leader: '👔', manager: '📋', ceo: '👑', self: '🙋', peer: '👥',
}

export default function EvaluatorTracker({ evaluators, employeeName, deadline, onRemind, onRemindAll }: Props) {
  const submitted = evaluators.filter(e => e.submitted).length
  const total = evaluators.length
  const pct = total > 0 ? Math.round((submitted / total) * 100) : 0
  const avgScore = evaluators.filter(e => e.submitted && e.score != null).reduce((sum, e) => sum + (e.score ?? 0), 0) / (submitted || 1)

  const handleRemind = (evaluator: Evaluator) => {
    if (onRemind) onRemind(evaluator.id)
    else toast.success(`📩 Đã nhắc nhở ${evaluator.name}`)
  }

  return (
    <div className="card p-4 space-y-3 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          👥 Tiến độ đánh giá{employeeName ? ` — ${employeeName}` : ''}
        </h3>
        {deadline && (
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: '#FFF8E8', color: '#92400e' }}>
            ⏳ {deadline}
          </span>
        )}
      </div>

      {/* Evaluator list */}
      <div className="space-y-2">
        {evaluators.map(ev => (
          <div key={ev.id} className="flex items-center gap-3 p-2.5 rounded-xl" style={{
            background: ev.submitted ? '#f0fdf4' : 'var(--gray-50)',
            border: `1px solid ${ev.submitted ? '#bbf7d0' : 'var(--gray-100)'}`,
          }}>
            <span className="text-lg">{ROLE_ICONS[ev.role] ?? '👤'}</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                {ev.role.charAt(0).toUpperCase() + ev.role.slice(1)}
                {ev.required && <span className="text-[9px] ml-1" style={{ color: '#D9381E' }}>(bắt buộc)</span>}
              </div>
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>{ev.name}</div>
              {ev.submitted ? (
                <div className="text-[10px] font-semibold" style={{ color: '#16a34a' }}>
                  ✅ Đã đánh giá • {ev.score} điểm
                  {ev.submittedAt && ` • ${new Date(ev.submittedAt).toLocaleDateString('vi')}`}
                </div>
              ) : (
                <div className="text-[10px] font-semibold" style={{ color: '#F6C85F' }}>⏳ Chưa đánh giá</div>
              )}
            </div>
            {!ev.submitted && (
              <button onClick={() => handleRemind(ev)}
                className="text-[10px] px-2 py-1 rounded-lg font-bold transition-all"
                style={{ background: 'var(--primary)', color: '#fff' }}>
                Nhắc
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-semibold">
          <span style={{ color: 'var(--text-secondary)' }}>Tiến độ: {submitted}/{total} ({pct}%)</span>
          {submitted > 0 && <span style={{ color: 'var(--primary)' }}>TB: {Math.round(avgScore)} điểm</span>}
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${pct}%`,
            background: pct >= 100 ? '#1E9E57' : pct >= 50 ? '#2F6FA8' : '#F6C85F',
          }} />
        </div>
      </div>

      {/* Remind all */}
      {submitted < total && (
        <button onClick={() => onRemindAll ? onRemindAll() : toast.success('📩 Đã nhắc nhở tất cả')}
          className="w-full py-2 rounded-xl text-xs font-bold transition-all"
          style={{ border: '1px solid var(--gray-200)', color: 'var(--text-secondary)' }}>
          📩 Nhắc nhở tất cả ({total - submitted} người)
        </button>
      )}
    </div>
  )
}
