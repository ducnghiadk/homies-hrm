'use client'

import { useEffect, useState } from 'react'
import GradeBadge from '@/components/kpi/GradeBadge'
import TrendIndicator from '@/components/kpi/TrendIndicator'
import type { KPIGradeCode } from '@/lib/kpi-types'

interface KPIScoreRingProps {
  score: number
  gradeCode: KPIGradeCode
  label?: string
  change?: number
  subtitle?: string
  size?: 'sm' | 'md' | 'lg'
  animate?: boolean
}

export default function KPIScoreRing({
  score, gradeCode, label, change, subtitle, size = 'md', animate = true,
}: KPIScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(animate ? 0 : score)

  useEffect(() => {
    if (!animate) return
    let frame = 0
    const target = score
    const duration = 800 // ms
    const start = performance.now()
    function tick(now: number) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplayScore(Math.round(eased * target))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [score, animate])

  const dim = size === 'sm' ? 80 : size === 'md' ? 120 : 160
  const stroke = size === 'sm' ? 6 : size === 'md' ? 8 : 10
  const r = (dim - stroke) / 2
  const circumference = 2 * Math.PI * r
  const pct = displayScore / 100
  const offset = circumference * (1 - pct)

  const scoreColor = score >= 85 ? '#1E9E57' : score >= 70 ? '#2F6FA8' : score >= 60 ? '#F6C85F' : '#D9381E'
  const fontSize = size === 'sm' ? 'text-xl' : size === 'md' ? 'text-3xl' : 'text-5xl'

  return (
    <div className="flex flex-col items-center gap-1 animate-fade-in">
      {label && <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</span>}

      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="transform -rotate-90">
          {/* BG circle */}
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none"
            stroke="var(--gray-100)" strokeWidth={stroke} />
          {/* Score arc */}
          <circle cx={dim / 2} cy={dim / 2} r={r} fill="none"
            stroke={scoreColor} strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: animate ? undefined : 'stroke-dashoffset 0.5s ease' }} />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${fontSize} font-black`} style={{ color: scoreColor }}>
            {displayScore}
          </span>
          {size !== 'sm' && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>/100</span>}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <GradeBadge gradeCode={gradeCode} size={size === 'lg' ? 'md' : 'sm'} />
        {change !== undefined && change !== 0 && <TrendIndicator value={change} />}
      </div>

      {subtitle && (
        <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>{subtitle}</span>
      )}
    </div>
  )
}
