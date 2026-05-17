'use client'

import { Star, Info } from 'lucide-react'
import { useState } from 'react'
import RatingGuideSheet from './RatingGuideSheet'
import type { KPICriteria } from '@/lib/kpi-types'

interface Props {
  label: string
  description?: string
  type: 'star' | 'percent' | 'number'
  value: number
  maxValue: number
  readOnly?: boolean
  onChange?: (value: number) => void
  source?: 'auto' | 'self' | 'manager' | 'mentor' | 'peer'
  criteriaData?: KPICriteria
}

export default function CriteriaInput({
  label, description, type, value, maxValue, readOnly, onChange, source, criteriaData,
}: Props) {
  const pct = maxValue > 0 ? Math.round((value / maxValue) * 100) : 0
  const [showGuide, setShowGuide] = useState(false)

  return (
    <>
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold">{label}</span>
            {criteriaData && (
              <button type="button" onClick={() => setShowGuide(true)} className="text-gray-400 hover:text-blue-500 transition-colors">
                <Info size={12} />
              </button>
            )}
          </div>
          {description && <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{description}</div>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {type === 'star' ? (
            <div className="flex gap-0.5">
              {Array.from({ length: maxValue }, (_, i) => (
                <button key={i} type="button" disabled={readOnly}
                  className="transition-all"
                  onClick={() => onChange?.(i + 1)}>
                  <Star size={18} fill={i < value ? '#f59e0b' : 'none'}
                    color={i < value ? '#f59e0b' : '#d1d5db'}
                    className={readOnly ? '' : 'hover:scale-110 cursor-pointer'} />
                </button>
              ))}
            </div>
          ) : type === 'percent' ? (
            <div className="flex items-center gap-1">
              {readOnly ? (
                <span className="text-sm font-bold" style={{
                  color: value >= 90 ? '#10b981' : value >= 70 ? '#f59e0b' : '#ef4444',
                }}>{value}%</span>
              ) : (
                <input type="number" min={0} max={100} value={value}
                  onChange={e => onChange?.(Number(e.target.value))}
                  className="w-14 px-1.5 py-1 rounded-lg text-xs text-center font-bold outline-none"
                  style={{ border: '1px solid var(--gray-200)' }} />
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1">
              {readOnly ? (
                <span className="text-sm font-bold">{value}/{maxValue}</span>
              ) : (
                <input type="number" min={0} max={maxValue} value={value}
                  onChange={e => onChange?.(Number(e.target.value))}
                  className="w-14 px-1.5 py-1 rounded-lg text-xs text-center font-bold outline-none"
                  style={{ border: '1px solid var(--gray-200)' }} />
              )}
            </div>
          )}

          {source === 'auto' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: '#dbeafe', color: '#1d4ed8' }}>Auto</span>
          )}
        </div>

        {/* Mini progress bar */}
        <div className="w-8 h-1.5 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'var(--gray-100)' }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${Math.min(pct, 100)}%`,
            background: pct >= 80 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#ef4444',
          }} />
        </div>
      </div>

      {/* Rating Guide Sheet */}
      {criteriaData && (
        <RatingGuideSheet criteria={criteriaData} open={showGuide} onClose={() => setShowGuide(false)} />
      )}
    </>
  )
}

