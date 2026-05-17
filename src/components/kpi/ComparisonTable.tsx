'use client'

import type { PeriodComparison } from '@/lib/kpi-report-service'
import TrendIndicator from '@/components/kpi/TrendIndicator'

interface ComparisonTableProps {
  data: PeriodComparison[]
  period1Label: string
  period2Label: string
  insight?: string
}

export default function ComparisonTable({ data, period1Label, period2Label, insight }: ComparisonTableProps) {
  if (!data.length) return null

  return (
    <div className="card p-3 space-y-3 animate-fade-in">
      <h4 className="text-xs font-bold flex items-center gap-1">
        ⚖️ So sánh {period1Label} vs {period2Label}
      </h4>

      <div className="overflow-hidden rounded-xl" style={{ border: '1px solid var(--gray-100)' }}>
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ background: 'var(--gray-50)' }}>
              <th className="text-left px-3 py-2 font-bold">Chỉ số</th>
              <th className="text-center px-2 py-2 font-bold">{period1Label}</th>
              <th className="text-center px-2 py-2 font-bold">{period2Label}</th>
              <th className="text-center px-2 py-2 font-bold">Thay đổi</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={row.metric} style={{ borderTop: i > 0 ? '1px solid var(--gray-50)' : undefined }}>
                <td className="px-3 py-2 font-semibold">{row.metric}</td>
                <td className="text-center px-2 py-2">{row.period1}{row.metric.includes('%') ? '%' : ''}</td>
                <td className="text-center px-2 py-2 font-bold">{row.period2}{row.metric.includes('%') ? '%' : ''}</td>
                <td className="text-center px-2 py-2">
                  <div className="flex items-center justify-center gap-1">
                    <TrendIndicator value={row.change} />
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[8px]"
                      style={{ background: row.positive ? '#dcfce7' : '#fef2f2' }}>
                      {row.positive ? '🟢' : '🔴'}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {insight && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg" style={{ background: '#eff6ff' }}>
          <span className="text-sm shrink-0">💡</span>
          <p className="text-[10px]" style={{ color: '#1e40af' }}>{insight}</p>
        </div>
      )}
    </div>
  )
}
