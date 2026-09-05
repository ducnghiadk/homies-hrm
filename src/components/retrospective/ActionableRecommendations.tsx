'use client'

import { Plus, ArrowRight, Sparkles, Target } from 'lucide-react'
import type { SavingOpportunity } from '@/lib/analytics/insights-generator'

interface ActionableRecommendationsProps {
  recommendations: SavingOpportunity[]
  onApplyAll?: () => void
  onApplyOne?: (id: string) => void
}

export default function ActionableRecommendations({
  recommendations,
  onApplyAll,
  onApplyOne,
}: ActionableRecommendationsProps) {
  const totalSaving = recommendations.reduce((s, r) => s + r.monthlySaving, 0)

  if (recommendations.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-5 text-center">
        <Sparkles size={24} className="text-gray-300 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Không có đề xuất nào tuần này</p>
        <p className="text-xs text-gray-400">Lịch xếp ca đã tối ưu!</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="text-sm font-bold text-gray-800 mb-4">
        <Target size={14} className="inline mr-1 text-primary" /> Đề xuất cho tuần tới
      </h3>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-400 uppercase tracking-wide">
              <th className="text-left py-2 pr-2">#</th>
              <th className="text-left py-2 pr-2">Đề xuất</th>
              <th className="text-right py-2 pr-2">Tiết kiệm</th>
              <th className="text-right py-2 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recommendations.map((rec, i) => (
              <tr key={rec.id} className="hover:bg-vanilla-50/50">
                <td className="py-2.5 pr-2 text-gray-400 text-xs">{i + 1}</td>
                <td className="py-2.5 pr-2 text-gray-700">{rec.description}</td>
                <td className="py-2.5 pr-2 text-right font-bold text-success-600 whitespace-nowrap">
                  {(rec.monthlySaving / 1000).toFixed(0)}k
                </td>
                <td className="py-2.5 text-right">
                  <button
                    onClick={() => onApplyOne?.(rec.id)}
                    className="w-7 h-7 flex items-center justify-center bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors"
                    title="Áp dụng"
                  >
                    <Plus size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Total + Apply all */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-500">
          Tổng tiết kiệm: <strong className="text-success-600">
            {(totalSaving / 1000).toFixed(0)}k/tuần
          </strong>
        </span>
        {onApplyAll && (
          <button
            onClick={onApplyAll}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            Áp dụng tất cả <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  )
}
