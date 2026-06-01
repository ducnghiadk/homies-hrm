'use client'

import { useAuthStore } from '@/store/auth-store'
import { getCurrentPeriod } from '@/lib/mock-data-kpi'
import { mockEvaluations } from '@/lib/mock-data-kpi'

interface SmartGreetingProps {
  storeId?: string
  urgentCount?: number
}

export default function SmartGreeting({ storeId, urgentCount }: SmartGreetingProps) {
  const { user } = useAuthStore()
  if (!user) return null

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'
  const firstName = user.full_name.split(' ').slice(-1)[0]
  const period = getCurrentPeriod()
  const month = period.slice(5)
  const year = period.slice(0, 4)

  // Eval progress
  const sid = storeId || user.store_id
  const allEvals = mockEvaluations.filter(e => e.store_id === sid && e.period === period)
  const submitted = allEvals.filter(e => e.status !== 'draft').length
  const total = allEvals.length || 1
  const pct = Math.round((submitted / total) * 100)

  // Deadline (always 28th)
  const now = new Date()
  const deadline = new Date(parseInt(year), parseInt(month) - 1, 28)
  const daysLeft = Math.max(0, Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

  return (
    <div className="animate-fade-in">
      <h1 className="text-lg font-bold mb-0.5">{greeting}, {firstName}! 👋</h1>
      <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>
        KPI tháng {month}/{year}
      </p>

      {/* Period status */}
      {daysLeft > 0 && daysLeft <= 10 && (
        <div className="card p-2.5 mb-3 flex items-center gap-2" style={{ background: '#fffbeb' }}>
          <span className="text-sm">⏰</span>
          <div className="flex-1">
            <span className="text-[11px] font-bold" style={{ color: '#92400e' }}>
              Còn {daysLeft} ngày deadline đánh giá
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 h-1.5 rounded-full" style={{ background: '#fde68a' }}>
                <div className="h-full rounded-full transition-all" style={{
                  width: `${pct}%`,
                  background: pct >= 80 ? '#1E9E57' : '#F6C85F',
                }} />
              </div>
              <span className="text-[10px] font-semibold" style={{ color: '#92400e' }}>
                {submitted}/{total}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Urgent items badge */}
      {urgentCount !== undefined && urgentCount > 0 && (
        <div className="card p-2.5 flex items-center gap-2" style={{ background: '#fef2f2' }}>
          <span className="text-sm">🔔</span>
          <span className="text-[11px] font-bold" style={{ color: '#991b1b' }}>
            {urgentCount} việc cần làm ngay
          </span>
        </div>
      )}
    </div>
  )
}
