'use client'

import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, BarChart3, CalendarDays, Clock, DollarSign, TrendingDown, TrendingUp, Lightbulb } from 'lucide-react'

import PlanVsActualChart from './PlanVsActualChart'
import WeeklyInsightsCard from './WeeklyInsightsCard'
import SavingsOpportunityCard from './SavingsOpportunityCard'
import TrendAnalysis from './TrendAnalysis'
import ActionableRecommendations from './ActionableRecommendations'
import NumberCounter from '@/components/ui/NumberCounter'
import { SkeletonCard, SkeletonChart } from '@/components/ui/SkeletonPulse'

import {
  generateMockComparison,
  calculateTrend,
  type WeeklyComparison,
} from '@/lib/analytics/retrospective-calculator'
import {
  generateInsights,
  findSavingOpportunities,
} from '@/lib/analytics/insights-generator'

interface RetrospectiveTabProps {
  storeId?: string
}

export default function RetrospectiveTab({
  storeId: _storeId,
}: RetrospectiveTabProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [chartMetric, setChartMetric] = useState<'hours' | 'cost'>('hours')

  // Generate mock data for last 4 weeks
  const comparisons = useMemo<WeeklyComparison[]>(
    () => [0, 1, 2, 3].map(i => generateMockComparison(i + weekOffset)),
    [weekOffset]
  )

  const currentWeek = comparisons[0]
  const insights = useMemo(() => generateInsights(comparisons), [comparisons])
  const savings = useMemo(() => findSavingOpportunities(comparisons), [comparisons])

  const costTrend = useMemo(
    () => calculateTrend(comparisons.slice().reverse(), 'cost'),
    [comparisons]
  )
  const efficiencyTrend = useMemo(
    () => calculateTrend(comparisons.slice().reverse(), 'efficiency'),
    [comparisons]
  )

  const handleWeekChange = (dir: 'prev' | 'next') => {
    setIsLoading(true)
    setTimeout(() => {
      setWeekOffset(prev => prev + (dir === 'prev' ? 1 : -1))
      setIsLoading(false)
    }, 400)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonChart />
        <SkeletonCard />
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <BarChart3 size={20} className="text-violet-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Phân tích hiệu quả</h2>
          <p className="text-sm text-gray-500">So sánh kế hoạch vs thực tế, tìm cơ hội cải thiện</p>
        </div>
      </div>

      {/* Week selector */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-gray-200 px-4 py-3">
        <button
          onClick={() => handleWeekChange('prev')}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full active:bg-gray-100"
        >
          <ChevronLeft size={18} />
        </button>
        <span className="text-sm font-medium text-gray-700">
          <CalendarDays size={14} className="inline mr-1 text-gray-400" /> {currentWeek.weekStart.slice(5)} — {currentWeek.weekEnd.slice(5)}
        </span>
        <button
          onClick={() => handleWeekChange('next')}
          disabled={weekOffset <= 0}
          className="p-1.5 text-gray-400 hover:text-gray-600 rounded-full active:bg-gray-100 disabled:opacity-30"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Giờ làm</div>
          <NumberCounter
            value={currentWeek.actual.totalHours}
            previousValue={currentWeek.planned.totalHours}
            format="hours"
            showDiff
            className="text-lg"
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Chi phí</div>
          <NumberCounter
            value={currentWeek.actual.totalCost}
            previousValue={currentWeek.planned.totalCost}
            format="currency"
            showDiff
            className="text-lg"
          />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-xs text-gray-500 mb-1">Hiệu quả</div>
          <NumberCounter
            value={currentWeek.variance.efficiency}
            format="percent"
            className="text-lg"
          />
        </div>
      </div>

      {/* Chart metric toggle */}
      <div className="flex justify-end">
        <div className="flex bg-gray-100 p-0.5 rounded-lg">
          {(['hours', 'cost'] as const).map(m => (
            <button
              key={m}
              onClick={() => setChartMetric(m)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                chartMetric === m
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {m === 'hours' ? <><Clock size={12} className="inline mr-0.5" /> Giờ</> : <><DollarSign size={12} className="inline mr-0.5" /> Chi phí</>}
            </button>
          ))}
        </div>
      </div>

      {/* Plan vs Actual Chart */}
      <PlanVsActualChart data={currentWeek} metric={chartMetric} />

      {/* Trends */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TrendAnalysis data={costTrend} metric="cost" label="Xu hướng chi phí (4 tuần)" />
        <TrendAnalysis data={efficiencyTrend} metric="efficiency" label="Xu hướng hiệu quả" />
      </div>

      {/* Insights */}
      {insights.length > 0 && (
        <div>
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-1.5">
            <Lightbulb size={14} className="text-amber-500" />
            Insights & Đề xuất
          </h3>
          <div className="space-y-3">
            {insights.slice(0, 5).map(insight => (
              <WeeklyInsightsCard
                key={insight.id}
                insight={insight}
                onDismiss={() => {}}
              />
            ))}
          </div>
        </div>
      )}

      {/* Savings */}
      <SavingsOpportunityCard opportunities={savings} />

      {/* Actionable Recommendations */}
      <ActionableRecommendations recommendations={savings} />
    </div>
  )
}
