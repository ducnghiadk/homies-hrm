'use client'

import type { LeaderboardEntry } from '@/lib/kpi-report-service'
import GradeBadge from '@/components/kpi/GradeBadge'

interface AnimatedPodiumProps {
  top3: LeaderboardEntry[]
}

export default function AnimatedPodium({ top3 }: AnimatedPodiumProps) {
  if (top3.length < 3) return null

  const [first, second, third] = top3
  const medal = ['🥇', '🥈', '🥉']
  const heights = [100, 76, 60]
  const bgGrad = [
    'linear-gradient(135deg, #fbbf24, #f59e0b)',
    'linear-gradient(135deg, #9ca3af, #6b7280)',
    'linear-gradient(135deg, #cd7f32, #b8860b)',
  ]

  // Reorder: 2nd, 1st, 3rd for visual podium
  const order = [second, first, third]
  const orderIdx = [1, 0, 2]

  return (
    <div className="flex items-end justify-center gap-2 py-4 animate-fade-in">
      {order.map((entry, i) => {
        const realIdx = orderIdx[i]
        return (
          <div key={entry.employee_id}
            className="flex flex-col items-center animate-slide-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* Avatar */}
            <div className="relative mb-1">
              <div className="rounded-full flex items-center justify-center text-white font-bold"
                style={{
                  width: realIdx === 0 ? 52 : 42,
                  height: realIdx === 0 ? 52 : 42,
                  fontSize: realIdx === 0 ? 16 : 14,
                  background: bgGrad[realIdx],
                  boxShadow: realIdx === 0 ? '0 4px 14px rgba(245,158,11,0.4)' : undefined,
                }}>
                {entry.name.split(' ').slice(-1)[0].charAt(0)}
              </div>
              <span className="absolute -top-2 -right-2 text-lg">{medal[realIdx]}</span>
            </div>

            {/* Name */}
            <span className="text-[10px] font-bold text-center mb-0.5" style={{ maxWidth: 72 }}>
              {entry.name.split(' ').slice(-2).join(' ')}
            </span>

            {/* Score */}
            <span className="text-sm font-black mb-1" style={{
              color: entry.score >= 85 ? '#10b981' : '#3b82f6',
            }}>{entry.score}</span>

            <GradeBadge gradeCode={entry.grade_code} size="sm" showIcon={false} />

            {/* Podium bar */}
            <div className="mt-2 rounded-t-xl flex items-end justify-center"
              style={{
                width: realIdx === 0 ? 80 : 68,
                height: heights[realIdx],
                background: bgGrad[realIdx],
                opacity: 0.2,
              }}>
              <span className="text-lg font-black mb-2" style={{ opacity: 3 }}>
                {realIdx + 1}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
