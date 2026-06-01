'use client'

import { Banknote, ArrowRight } from 'lucide-react'
import NumberCounter from '@/components/ui/NumberCounter'
import type { SavingOpportunity } from '@/lib/analytics/insights-generator'

interface SavingsOpportunityCardProps {
  opportunities: SavingOpportunity[]
  onApply?: () => void
}

const difficultyBadge = {
  easy: { label: 'Dễ', class: 'bg-success-100 text-success-700' },
  medium: { label: 'Vừa', class: 'bg-warning-100 text-warning-700' },
  hard: { label: 'Khó', class: 'bg-error-100 text-error-700' },
}

export default function SavingsOpportunityCard({
  opportunities,
  onApply,
}: SavingsOpportunityCardProps) {
  const totalMonthly = opportunities.reduce((s, o) => s + o.monthlySaving, 0)

  if (opportunities.length === 0) return null

  return (
    <div className="bg-gradient-to-br from-success-50 to-success-100 rounded-2xl border border-success-200 p-5">
      <div className="flex items-center gap-2 mb-3">
        <Banknote size={18} className="text-success-600" />
        <h3 className="font-bold text-sm text-gray-800">Cơ hội tiết kiệm</h3>
      </div>

      {/* Highlight number */}
      <div className="text-center py-3 mb-4 bg-white/70 rounded-xl">
        <div className="text-xs text-gray-500 mb-1">Tiết kiệm đến</div>
        <div className="text-2xl font-bold text-success-600">
          <NumberCounter value={totalMonthly} format="currency" />
        </div>
        <div className="text-xs text-gray-400">mỗi tháng</div>
      </div>

      {/* Opportunities list */}
      <div className="space-y-2 mb-4">
        {opportunities.map(op => {
          const badge = difficultyBadge[op.difficulty]
          return (
            <div
              key={op.id}
              className="flex items-center justify-between py-2 px-3 bg-white/60 rounded-lg text-xs"
            >
              <span className="text-gray-600 flex-1">{op.description}</span>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${badge.class}`}>
                  {badge.label}
                </span>
                <span className="font-bold text-success-600">
                  {(op.monthlySaving / 1000).toFixed(0)}k
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Apply CTA */}
      {onApply && (
        <button
          onClick={onApply}
          className="w-full py-2.5 bg-success-600 text-white text-xs font-bold rounded-xl hover:bg-success-700 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
        >
          Áp dụng vào lịch tuần sau <ArrowRight size={14} />
        </button>
      )}
    </div>
  )
}
