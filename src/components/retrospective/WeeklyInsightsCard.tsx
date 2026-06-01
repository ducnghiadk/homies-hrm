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
    icon: <AlertTriangle size={16} className="text-warning-600" />,
    bgClass: 'bg-warning-50',
    borderClass: 'border-warning-200',
    metricBg: 'bg-warning-100 text-warning-700',
  },
  saving: {
    icon: <TrendingUp size={16} className="text-success-600" />,
    bgClass: 'bg-success-50',
    borderClass: 'border-success-200',
    metricBg: 'bg-success-100 text-success-700',
  },
  improvement: {
    icon: <Lightbulb size={16} className="text-primary-600" />,
    bgClass: 'bg-primary-50',
    borderClass: 'border-primary-200',
    metricBg: 'bg-primary-100 text-primary-700',
  },
  praise: {
    icon: <PartyPopper size={16} className="text-primary-600" />,
    bgClass: 'bg-primary-50',
    borderClass: 'border-primary-200',
    metricBg: 'bg-primary-100 text-primary-700',
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
