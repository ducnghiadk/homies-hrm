'use client'

import AppShell from '@/components/layout/AppShell'
import { mockHROverview } from '@/lib/mock-data-reports'
import { Users, UserPlus, UserMinus, TrendingUp } from 'lucide-react'

export default function HROverviewPage() {
  const d = mockHROverview

  return (
    <AppShell title="Tổng quan nhân sự">
      <div className="space-y-4">
        {/* Headcount */}
        <div className="grid grid-cols-2 gap-2 animate-fade-in">
          {[
            { label: 'Tổng NV', value: d.total_employees, icon: Users, color: 'var(--primary)' },
            { label: 'Đang làm', value: d.active, icon: Users, color: '#10b981' },
            { label: 'Mới T2', value: `+${d.new_this_month}`, icon: UserPlus, color: '#3b82f6' },
            { label: 'Nghỉ việc', value: d.resigned_this_month, icon: UserMinus, color: '#ef4444' },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="card flex items-center gap-3 p-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: s.color + '15' }}>
                  <Icon size={18} style={{ color: s.color as string }} />
                </div>
                <div>
                  <div className="text-lg font-bold" style={{ color: s.color as string }}>{s.value}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Gender + Tenure */}
        <div className="card animate-slide-up">
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>👥 Cơ cấu</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Giới tính</div>
              <div className="flex gap-1 h-4 rounded-full overflow-hidden">
                <div style={{ width: `${d.gender_ratio.male / d.total_employees * 100}%`, background: '#3b82f6' }} />
                <div style={{ width: `${d.gender_ratio.female / d.total_employees * 100}%`, background: '#ec4899' }} />
              </div>
              <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                <span>♂ {d.gender_ratio.male}</span><span>♀ {d.gender_ratio.female}</span>
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Thâm niên TB</div>
              <div className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>{d.avg_tenure_months}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>tháng</div>
            </div>
          </div>
        </div>

        {/* By Store */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>🏪 Theo cửa hàng</h3>
          {d.by_store.map(s => (
            <div key={s.store} className="mb-2">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>{s.store.replace('Boba House ', '')}</span>
                <span className="font-bold" style={{ color: 'var(--primary)' }}>{s.count}</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: 'var(--gray-100)' }}>
                <div className="h-2 rounded-full" style={{ width: `${s.count / d.total_employees * 100}%`, background: 'var(--primary)' }} />
              </div>
            </div>
          ))}
        </div>

        {/* By Position */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>💼 Theo vị trí</h3>
          <div className="flex flex-wrap gap-2">
            {d.by_position.map(p => (
              <div key={p.position} className="px-3 py-2 rounded-xl text-center" style={{ background: 'var(--gray-50)', minWidth: '80px' }}>
                <div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{p.count}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.position}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Trend */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>📈 Xu hướng 6 tháng</h3>
          <div className="flex items-end gap-1 h-24">
            {d.monthly_trend.map(m => (
              <div key={m.month} className="flex-1 flex flex-col items-center">
                <div className="w-full rounded-t-md transition-all" style={{
                  height: `${(m.headcount / Math.max(...d.monthly_trend.map(t => t.headcount))) * 80}px`,
                  background: 'var(--primary)',
                  opacity: 0.7 + (m.headcount / 20),
                }} />
                <div className="text-[8px] mt-1" style={{ color: 'var(--text-muted)' }}>{m.month.split('/')[0]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
