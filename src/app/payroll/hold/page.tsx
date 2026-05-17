'use client'

import AppShell from '@/components/layout/AppShell'
import { mockSalaryHolds } from '@/lib/mock-data-payroll'
import { Pause, Plus, CheckCircle } from 'lucide-react'

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'

export default function PayrollHoldPage() {
  return (
    <AppShell title="Giữ lương">
      <div className="space-y-4">
        <button className="btn btn-primary w-full text-sm gap-2 animate-fade-in"><Plus size={16} /> Tạo phiếu giữ lương</button>

        <div className="space-y-2 animate-slide-up">
          {mockSalaryHolds.map(h => (
            <div key={h.id} className="card flex items-start gap-3" style={{ borderLeft: `4px solid ${h.status === 'holding' ? '#f59e0b' : '#10b981'}` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: h.status === 'holding' ? '#f59e0b20' : '#10b98120' }}>
                {h.status === 'holding' ? <Pause size={18} className="text-amber-500" /> : <CheckCircle size={18} className="text-emerald-500" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{h.employee_name}</span>
                  <span className="text-sm font-bold" style={{ color: h.status === 'holding' ? '#f59e0b' : '#10b981' }}>{fmt(h.hold_amount)}</span>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Giữ {h.hold_percent}%</div>
                <div className="flex gap-2 mt-1">
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: h.status === 'holding' ? '#f59e0b20' : '#10b98120', color: h.status === 'holding' ? '#f59e0b' : '#10b981' }}>
                    {h.status === 'holding' ? '⏸ Đang giữ' : '✅ Đã trả'}
                  </span>
                  <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{h.start_date} → {h.release_date}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
