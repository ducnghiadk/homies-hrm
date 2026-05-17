'use client'

import AppShell from '@/components/layout/AppShell'
import { mockDeductions } from '@/lib/mock-data-payroll'
import { MinusCircle } from 'lucide-react'

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'
const typeColors = { penalty: '#ef4444', repayment: '#f59e0b', compensation: '#f97316' }

export default function DeductionSlipPage() {
  return (
    <AppShell title="Phiếu khấu trừ">
      <div className="space-y-4">
        <div className="card animate-fade-in" style={{ background: '#ef444410', border: '1px solid #ef444430' }}>
          <div className="text-xs text-red-500">Tổng khấu trừ tháng này</div>
          <div className="text-2xl font-bold text-red-500">
            -{fmt(mockDeductions.reduce((s, d) => s + d.amount, 0))}
          </div>
        </div>

        <div className="space-y-2 animate-slide-up">
          {mockDeductions.map(d => {
            const color = typeColors[d.type]
            return (
              <div key={d.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '20' }}>
                  <MinusCircle size={18} style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{d.employee_name}</span>
                    <span className="text-sm font-bold" style={{ color }}>-{fmt(d.amount)}</span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{d.reason}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: color + '20', color }}>{d.type_label}</span>
                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>T.{d.month}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: d.status === 'approved' ? '#10b98120' : '#f59e0b20', color: d.status === 'approved' ? '#10b981' : '#f59e0b' }}>
                      {d.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}
                    </span>
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
