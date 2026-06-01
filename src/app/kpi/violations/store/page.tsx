'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { getViolationsByStore, getViolationSummary, mockViolationTypes } from '@/lib/mock-data-kpi'
import { mockEmployees } from '@/lib/mock-data'
import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function StoreViolationsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [period, setPeriod] = useState('2026-02')

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  if (!user || user.role === 'employee') return null

  const storeId = user.store_id || 'store-001'
  const storeViolations = getViolationsByStore(storeId, period)

  // Get unique employees from violations
  const employeeIds = [...new Set(storeViolations.map(v => v.employee_id))]
  const employeeSummaries = employeeIds.map(empId => {
    const emp = mockEmployees.find(e => e.id === empId)
    const summary = getViolationSummary(empId, period)
    return { emp, summary }
  }).sort((a, b) => b.summary.total_penalty_points - a.summary.total_penalty_points)

  // Aggregate stats
  const totalViolations = storeViolations.length
  const totalPenalty = storeViolations.reduce((sum, v) => sum + v.penalty_points, 0)
  const avgPenalty = employeeIds.length ? Math.round(totalPenalty / employeeIds.length) : 0
  const worstEmployee = employeeSummaries[0]

  // Most common violation
  const violationCounts: Record<string, number> = {}
  storeViolations.forEach(v => {
    violationCounts[v.violation_type_id] = (violationCounts[v.violation_type_id] || 0) + 1
  })
  const mostCommonId = Object.entries(violationCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  const mostCommon = mockViolationTypes.find(v => v.id === mostCommonId)

  // Severity breakdown
  const sevCounts = { minor: 0, medium: 0, major: 0, critical: 0 }
  storeViolations.forEach(v => {
    const vt = mockViolationTypes.find(t => t.id === v.violation_type_id)
    if (vt) sevCounts[vt.severity]++
  })

  const periods = ['2026-02', '2026-01', '2025-12']

  return (
    <AppShell title="📊 Tổng hợp lỗi cửa hàng" backHref="/kpi/violations">
      <div className="space-y-4">
        <Link href="/kpi/violations" className="inline-flex items-center gap-1 text-sm no-underline" style={{ color: 'var(--primary)' }}>
          <ChevronLeft size={16} /> Quay lại
        </Link>

        {/* Period selector */}
        <select value={period} onChange={e => setPeriod(e.target.value)}
          className="w-full px-3 py-2 rounded-xl text-sm font-semibold outline-none"
          style={{ border: '1px solid var(--gray-200)' }}>
          {periods.map(p => (
            <option key={p} value={p}>Tháng {p.slice(5)}/{p.slice(0, 4)}</option>
          ))}
        </select>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Tổng lỗi', value: totalViolations, icon: '⚠️', color: '#D9381E' },
            { label: 'Điểm trừ TB', value: avgPenalty, icon: '📉', color: '#F6C85F' },
            { label: 'NV nhiều lỗi', value: worstEmployee?.emp?.full_name?.split(' ').pop() || '—', icon: '👤', color: '#7c3aed' },
            { label: 'Lỗi phổ biến', value: mostCommon?.code || '—', icon: '🔄', color: '#2F6FA8' },
          ].map((card, i) => (
            <div key={i} className="card p-3 text-center">
              <div className="text-xl mb-1">{card.icon}</div>
              <div className="text-lg font-black" style={{ color: card.color }}>
                {card.value}
              </div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{card.label}</div>
            </div>
          ))}
        </div>

        {/* Severity chart (horizontal bars) */}
        <div className="card p-3">
          <h4 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>📊 Phân bổ theo mức độ</h4>
          <div className="space-y-2">
            {[
              { key: 'minor', label: 'Nhẹ', color: '#2F6FA8' },
              { key: 'medium', label: 'Trung bình', color: '#F6C85F' },
              { key: 'major', label: 'Nặng', color: '#f97316' },
              { key: 'critical', label: 'Nghiêm trọng', color: '#D9381E' },
            ].map(s => {
              const count = sevCounts[s.key as keyof typeof sevCounts]
              const pct = totalViolations ? (count / totalViolations) * 100 : 0
              return (
                <div key={s.key} className="flex items-center gap-2">
                  <span className="text-xs w-20 text-right font-semibold" style={{ color: s.color }}>
                    {s.label}
                  </span>
                  <div className="flex-1 h-4 rounded-full overflow-hidden" style={{ background: 'var(--gray-100)' }}>
                    <div className="h-full rounded-full transition-all flex items-center px-1.5"
                      style={{ width: `${Math.max(pct, count > 0 ? 15 : 0)}%`, background: s.color }}>
                      {count > 0 && <span className="text-[10px] font-bold text-white">{count}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Employee table */}
        <div className="card overflow-hidden">
          <div className="px-3 py-2 text-xs font-bold" style={{ background: 'var(--gray-50)', color: 'var(--text-secondary)' }}>
            👥 Nhân viên ({employeeSummaries.length})
          </div>
          {employeeSummaries.length === 0 ? (
            <div className="text-center py-6 text-xs" style={{ color: 'var(--text-muted)' }}>
              🎉 Không có lỗi nào
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--gray-100)' }}>
              {employeeSummaries.map(({ emp, summary }) => (
                <div key={summary.employee_id} className="flex items-center gap-2 px-3 py-2.5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold"
                    style={{ background: 'var(--gray-200)' }}>
                    {emp?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold truncate">{emp?.full_name || summary.employee_id}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                      {summary.total_violations} lỗi
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-black" style={{
                      color: summary.violation_score >= 80 ? '#1E9E57' : summary.violation_score >= 60 ? '#F6C85F' : '#D9381E',
                    }}>
                      {summary.violation_score}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>điểm</div>
                  </div>
                  <div className="text-xs font-bold text-error-600 flex-shrink-0">-{summary.total_penalty_points}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Export button (UI only) */}
        <button className="w-full py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2"
          style={{ border: '2px dashed var(--gray-300)', color: 'var(--text-muted)' }}
          onClick={() => toast.info('📥 Tính năng xuất Excel đang phát triển')}>
          📥 Xuất báo cáo Excel
        </button>
      </div>
    </AppShell>
  )
}
