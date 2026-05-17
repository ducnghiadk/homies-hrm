'use client'

import { AlertTriangle, TrendingUp, Lightbulb, PartyPopper, ChevronRight, X } from 'lucide-react'
import type { Insight } from '@/lib/analytics/insights-generator'

interface WeeklyInsightsCardProps {
  insight: Insight
  onAction?: () => void
  onDismiss?: () => void
}

const typeConfig: Record<Insight['type'], {
  icon: React.ReactNode
  bgClass: string
  borderClass: string
  metricBg: string
}> = {
  warning: {
    icon: <AlertTriangle size={16} className="text-amber-600" />,
    bgClass: 'bg-amber-50',
    borderClass: 'border-amber-200',
    metricBg: 'bg-amber-100 text-amber-700',
  },
  saving: {
    icon: <TrendingUp size={16} className="text-green-600" />,
    bgClass: 'bg-green-50',
    borderClass: 'border-green-200',
    metricBg: 'bg-green-100 text-green-700',
  },
  improvement: {
    icon: <Lightbulb size={16} className="text-blue-600" />,
    bgClass: 'bg-blue-50',
    borderClass: 'border-blue-200',
    metricBg: 'bg-blue-100 text-blue-700',
  },
  praise: {
    icon: <PartyPopper size={16} className="text-purple-600" />,
    bgClass: 'bg-purple-50',
    borderClass: 'border-purple-200',
    metricBg: 'bg-purple-100 text-purple-700',
  },
}

export default function WeeklyInsightsCard({
  insight,
  onAction,
  onDismiss,
}: WeeklyInsightsCardProps) {
  const cfg = typeConfig[insight.type]

  return (
    <div className={`rounded-xl border p-4 ${cfg.bgClass} ${cfg.borderClass} transition-all hover:shadow-sm`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {cfg.icon}
          <span className="font-bold text-sm text-gray-800">{insight.title}</span>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            aria-label="Bỏ qua"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-start gap-3">
        {/* Metric badge */}
        <div className={`shrink-0 px-3 py-2 rounded-lg text-center ${cfg.metricBg}`}>
          <div className="text-lg font-bold">{insight.metric.value}</div>
          <div className="text-xs font-medium">{insight.metric.unit}</div>
          {insight.metric.comparison && (
            <div className="text-[9px] mt-0.5 opacity-75">{insight.metric.comparison}</div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 leading-relaxed flex-1">
          {insight.description}
        </p>
      </div>

      {/* Action */}
      {insight.action && (
        <div className="flex justify-end mt-3">
          <button
            onClick={onAction}
            className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {insight.action.label} <ChevronRight size={12} />
          </button>
        </div>
      )}
    </div>
  )
}
