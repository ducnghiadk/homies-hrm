'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockBonuses } from '@/lib/mock-data-payroll'
import { Gift, Plus } from 'lucide-react'

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'
const statusMap = { pending: { l: 'Chờ duyệt', c: '#F6C85F' }, approved: { l: 'Đã duyệt', c: '#1E9E57' }, rejected: { l: 'Từ chối', c: '#D9381E' } }

export default function BonusSlipPage() {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? mockBonuses : mockBonuses.filter(b => b.status === filter)

  return (
    <AppShell title="Phiếu thưởng">
      <div className="space-y-4">
        <div className="flex items-center justify-between animate-fade-in">
          <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            💰 Tổng: {fmt(mockBonuses.filter(b => b.status === 'approved').reduce((s, b) => s + b.amount, 0))}
          </div>
          <button className="btn btn-primary text-xs gap-1 px-3 py-2"><Plus size={14} /> Tạo phiếu</button>
        </div>

        <div className="flex gap-2 animate-fade-in">
          {['all', 'pending', 'approved'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: filter === f ? 'var(--primary)' : 'var(--gray-100)', color: filter === f ? '#fff' : 'var(--text-secondary)' }}>
              {f === 'all' ? 'Tất cả' : statusMap[f as keyof typeof statusMap].l}
            </button>
          ))}
        </div>

        <div className="space-y-2 animate-slide-up">
          {filtered.map(b => {
            const s = statusMap[b.status]
            return (
              <div key={b.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#1E9E5720' }}>
                  <Gift size={18} className="text-emerald-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{b.employee_name}</span>
                    <span className="text-sm font-bold text-emerald-500">+{fmt(b.amount)}</span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{b.reason}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: s.c + '20', color: s.c }}>{s.l}</span>
                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Tháng {b.month}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
