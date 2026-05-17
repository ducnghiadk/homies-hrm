'use client'

import AppShell from '@/components/layout/AppShell'
import { mockLateRecords } from '@/lib/mock-data-attendance'
import { Clock, AlertTriangle } from 'lucide-react'

export default function LateReportPage() {
  const totalCount = mockLateRecords.length
  const totalMinutes = mockLateRecords.reduce((s, r) => s + r.diff_minutes, 0)

  // Group by employee
  const byEmployee = mockLateRecords.reduce((acc, r) => {
    if (!acc[r.employee_name]) acc[r.employee_name] = { count: 0, total_minutes: 0 }
    acc[r.employee_name].count++
    acc[r.employee_name].total_minutes += r.diff_minutes
    return acc
  }, {} as Record<string, { count: number; total_minutes: number }>)

  const ranked = Object.entries(byEmployee).sort((a, b) => b[1].count - a[1].count)

  return (
    <AppShell title="Báo cáo đi muộn">
      <div className="space-y-4">
        <div className="card animate-fade-in" style={{ background: 'linear-gradient(135deg, #f59e0b, #f97316)', color: '#fff' }}>
          <div className="text-xs opacity-80">Tháng 02/2026</div>
          <div className="text-2xl font-bold mt-1">{totalCount} lần muộn</div>
          <div className="text-xs opacity-80 mt-1">{totalMinutes} phút tổng • {ranked.length} NV</div>
        </div>

        <div className="space-y-2 animate-slide-up">
          {ranked.map(([name, data]) => {
            const color = data.count >= 5 ? '#ef4444' : data.count >= 3 ? '#f59e0b' : '#10b981'
            const avg = Math.round(data.total_minutes / data.count)
            return (
              <div key={name} className="card flex items-center gap-3">
                <div className="text-center" style={{ minWidth: '40px' }}>
                  <div className="text-lg font-bold" style={{ color }}>{data.count}</div>
                  <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>lần</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Tổng {data.total_minutes}p • TB {avg}p/lần
                  </div>
                  <div className="w-full h-1.5 rounded-full mt-1.5" style={{ background: 'var(--gray-100)' }}>
                    <div className="h-1.5 rounded-full" style={{ width: `${Math.min(data.count * 20, 100)}%`, background: color }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>📋 Chi tiết</h3>
          {mockLateRecords.map((r, i) => (
            <div key={i} className="flex items-center gap-2 text-xs p-2 rounded mb-1" style={{ background: 'var(--gray-50)' }}>
              <Clock size={12} style={{ color: r.type === 'late_in' ? '#f59e0b' : '#8b5cf6' }} />
              <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{r.employee_name}</span>
              <span style={{ color: 'var(--text-muted)' }}>{r.date} • {r.shift_name}</span>
              <span className="ml-auto font-bold text-red-500">+{r.diff_minutes}p</span>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
