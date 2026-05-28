'use client'

import type { KPIInsight } from '@/lib/kpi-report-service'
import Link from 'next/link'

interface InsightsFeedProps {
  insights: KPIInsight[]
  maxItems?: number
}

export default function InsightsFeed({ insights, maxItems = 6 }: InsightsFeedProps) {
  if (!insights.length) return null

  const prioColor = { high: '#D9381E', medium: '#F6C85F', low: '#6b7280' }
  const prioLabel = { high: 'QUAN TRỌNG', medium: 'LƯU Ý', low: 'THÔNG TIN' }

  return (
    <div className="space-y-2 animate-fade-in">
      <h3 className="text-xs font-bold flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}>
        💡 Insights cho bạn
      </h3>

      {insights.slice(0, maxItems).map((insight, idx) => (
        <div key={insight.id}
          className="card p-3 space-y-1.5 animate-slide-up"
          style={{ animationDelay: `${idx * 60}ms` }}
        >
          <div className="flex items-start gap-2">
            <span className="text-base shrink-0">{insight.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black uppercase"
                  style={{ background: `${prioColor[insight.priority]}15`, color: prioColor[insight.priority] }}>
                  {prioLabel[insight.priority]}
                </span>
              </div>
              <p className="text-xs font-bold mb-0.5">{insight.title}</p>
              <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                {insight.description}
              </p>
            </div>
          </div>

          {insight.action && (
            <Link href={insight.action.href}
              className="block text-[11px] font-bold no-underline text-right"
              style={{ color: 'var(--primary)' }}>
              {insight.action.label} →
            </Link>
          )}
        </div>
      ))}
    </div>
  )
}
