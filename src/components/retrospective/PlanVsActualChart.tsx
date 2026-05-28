'use client'

import type { WeeklyComparison } from '@/lib/analytics/retrospective-calculator'
import { TrendingUp } from 'lucide-react'

interface PlanVsActualChartProps {
  data: WeeklyComparison
  metric: 'hours' | 'cost'
}

const dayLabels = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function formatVal(val: number, metric: 'hours' | 'cost'): string {
  if (metric === 'cost') return `${(val / 1000).toFixed(0)}k`
  return `${val.toFixed(0)}h`
}

export default function PlanVsActualChart({
  data,
  metric,
}: PlanVsActualChartProps) {
  const plannedValues = data.planned.byDay.map(d =>
    metric === 'hours' ? d.plannedHours : d.plannedCost
  )
  const actualValues = data.actual.byDay.map(d =>
    metric === 'hours' ? d.actualHours : d.actualCost
  )

  const maxVal = Math.max(...plannedValues, ...actualValues, 1)

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-1.5">
          <TrendingUp size={14} className="text-primary-600" />
          So sánh {metric === 'hours' ? 'Giờ làm' : 'Chi phí'} theo ngày
        </h3>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-primary/70 rounded-sm" /> Kế hoạch
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-warning-400 rounded-sm" /> Thực tế
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="flex items-end gap-1.5 h-40">
        {dayLabels.map((day, i) => {
          const planned = plannedValues[i] || 0
          const actual = actualValues[i] || 0
          const pHeight = (planned / maxVal) * 100
          const aHeight = (actual / maxVal) * 100
          const isOver = actual > planned

          return (
            <div key={day} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full flex items-end justify-center gap-0.5 h-32">
                {/* Planned bar */}
                <div
                  className="w-[40%] bg-primary/60 rounded-t transition-all duration-500"
                  style={{ height: `${pHeight}%`, minHeight: planned > 0 ? 4 : 0 }}
                  title={`KH: ${formatVal(planned, metric)}`}
                />
                {/* Actual bar */}
                <div
                  className={`w-[40%] rounded-t transition-all duration-500 ${
                    isOver ? 'bg-error-400' : 'bg-warning-400'
                  }`}
                  style={{ height: `${aHeight}%`, minHeight: actual > 0 ? 4 : 0 }}
                  title={`TT: ${formatVal(actual, metric)}`}
                />
              </div>
              <span className="text-xs text-gray-400">{day}</span>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <span>
          KH: <strong className="text-gray-700">{formatVal(
            metric === 'hours' ? data.planned.totalHours : data.planned.totalCost,
            metric
          )}</strong>
        </span>
        <span>
          TT: <strong className="text-gray-700">{formatVal(
            metric === 'hours' ? data.actual.totalHours : data.actual.totalCost,
            metric
          )}</strong>
        </span>
        <span className={`font-bold ${
          (metric === 'hours' ? data.variance.hours : data.variance.cost) > 0
            ? 'text-error-500' : 'text-success-500'
        }`}>
          {(metric === 'hours' ? data.variance.hours : data.variance.cost) > 0 ? '+' : ''}
          {formatVal(
            metric === 'hours' ? data.variance.hours : data.variance.cost,
            metric
          )}
        </span>
      </div>
    </div>
  )
}
