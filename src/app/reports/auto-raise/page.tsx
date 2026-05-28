'use client'

import AppShell from '@/components/layout/AppShell'
import { mockAutoRaiseCandidates } from '@/lib/mock-data-reports'
import { TrendingUp, Star, CheckCircle } from 'lucide-react'

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'

export default function AutoRaisePage() {
  const eligible = mockAutoRaiseCandidates.filter(c => c.eligible)
  const totalCost = eligible.reduce((s, c) => s + c.suggested_raise, 0)

  return (
    <AppShell title="Đề xuất tăng lương">
      <div className="space-y-4">
        <div className="card animate-fade-in" style={{ background: 'linear-gradient(135deg, #F6C85F, #d97706)', color: '#fff' }}>
          <div className="flex items-center gap-2">
            <TrendingUp size={20} />
            <div>
              <div className="text-xs opacity-80">Kỳ review Q1/2026</div>
              <div className="text-lg font-bold">{eligible.length} ứng viên đủ điều kiện</div>
            </div>
          </div>
          <div className="text-xs opacity-80 mt-2">Chi phí dự kiến: {fmt(totalCost)}/tháng</div>
        </div>

        <div className="space-y-2 animate-slide-up">
          {mockAutoRaiseCandidates.map(c => (
            <div key={c.employee_id} className="card" style={{ opacity: c.eligible ? 1 : 0.6 }}>
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{c.employee_name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{c.position} • {c.tenure_months} tháng</div>
                </div>
                <div className="flex items-center gap-1">
                  <Star size={12} className="text-warning-500" />
                  <span className="text-sm font-bold text-warning-500">{c.avg_kpi.toFixed(1)}</span>
                </div>
              </div>
              <div className="flex gap-2 text-xs">
                <div className="flex-1 p-2 rounded-lg text-center" style={{ background: 'var(--gray-50)' }}>
                  <div style={{ color: 'var(--text-muted)' }}>Hiện tại</div>
                  <div className="font-bold" style={{ color: 'var(--text-primary)' }}>{fmt(c.current_salary)}</div>
                </div>
                <div className="flex-1 p-2 rounded-lg text-center" style={{ background: c.eligible ? '#1E9E5710' : '#D9381E10' }}>
                  <div style={{ color: c.eligible ? '#1E9E57' : '#D9381E' }}>{c.eligible ? 'Đề xuất' : 'Chưa đủ'}</div>
                  <div className="font-bold" style={{ color: c.eligible ? '#1E9E57' : '#D9381E' }}>{fmt(c.suggested_salary)}</div>
                </div>
                {c.eligible && (
                  <div className="flex-1 p-2 rounded-lg text-center" style={{ background: '#F6C85F10' }}>
                    <div className="text-warning-500">Tăng</div>
                    <div className="font-bold text-warning-500">{fmt(c.suggested_raise)}</div>
                  </div>
                )}
              </div>
              <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>💬 {c.reason}</div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary w-full text-sm gap-2 animate-fade-in"><CheckCircle size={16} /> Duyệt đề xuất</button>
      </div>
    </AppShell>
  )
}
