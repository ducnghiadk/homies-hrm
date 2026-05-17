'use client'

import type { ViolationType } from '@/lib/kpi-types'
import { mockViolationTypes } from '@/lib/mock-data-kpi'

interface Props {
  onSelect: (vType: ViolationType) => void
  selected?: string
}

const sevOrder = ['minor', 'medium', 'major', 'critical'] as const
const sevLabels: Record<string, { label: string; color: string; bg: string }> = {
  minor:    { label: '🟢 Nhẹ (5 điểm)',           color: '#1d4ed8', bg: '#dbeafe' },
  medium:   { label: '🟡 Trung bình (10-15 điểm)', color: '#b45309', bg: '#fef3c7' },
  major:    { label: '🟠 Nặng (20 điểm)',          color: '#c2410c', bg: '#fed7aa' },
  critical: { label: '🔴 Nghiêm trọng (30-50 điểm)', color: '#b91c1c', bg: '#fee2e2' },
}

export default function ViolationTypeSelector({ onSelect, selected }: Props) {
  const activeTypes = mockViolationTypes.filter(v => v.is_active)

  return (
    <div className="space-y-3">
      {sevOrder.map(sev => {
        const types = activeTypes.filter(v => v.severity === sev)
        if (types.length === 0) return null
        const cfg = sevLabels[sev]
        return (
          <div key={sev}>
            <div className="text-xs font-bold mb-1.5 px-1" style={{ color: cfg.color }}>
              {cfg.label}
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {types.map(vt => (
                <button
                  key={vt.id}
                  onClick={() => onSelect(vt)}
                  className="p-2 rounded-xl text-left transition-all text-xs"
                  style={{
                    background: selected === vt.id ? cfg.bg : 'var(--gray-50)',
                    border: selected === vt.id ? `2px solid ${cfg.color}` : '2px solid transparent',
                  }}
                >
                  <div className="font-bold truncate" style={{ color: selected === vt.id ? cfg.color : 'var(--text-primary)' }}>
                    {vt.code}: {vt.name}
                  </div>
                  <div className="text-red-600 font-black mt-0.5">-{vt.penalty_points} điểm</div>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
