'use client'

import AppShell from '@/components/layout/AppShell'
import { mockPayrollByStore, mockPayrollHistory } from '@/lib/mock-data-payroll'
import { Lock } from 'lucide-react'

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'

export default function PayrollCompanyPage() {
  const total = mockPayrollByStore.reduce((s, p) => s + p.total_net, 0)
  const totalBase = mockPayrollByStore.reduce((s, p) => s + p.total_base, 0)
  const totalIns = mockPayrollByStore.reduce((s, p) => s + p.total_insurance, 0)
  const totalTax = mockPayrollByStore.reduce((s, p) => s + p.total_tax, 0)
  const totalEmp = mockPayrollByStore.reduce((s, p) => s + p.employee_count, 0)

  return (
    <AppShell title="Tổng hợp lương công ty">
      <div className="space-y-4">
        {/* Total Card */}
        <div className="card animate-fade-in" style={{ background: 'linear-gradient(135deg, #6366f1, #001D3D)', color: '#fff' }}>
          <div className="text-xs opacity-80">Tổng chi phí nhân sự tháng 02/2026</div>
          <div className="text-3xl font-bold mt-1">{fmt(total)}</div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div><div className="text-xs opacity-70">NV</div><div className="text-sm font-bold">{totalEmp}</div></div>
            <div><div className="text-xs opacity-70">Store</div><div className="text-sm font-bold">{mockPayrollByStore.length}</div></div>
            <div><div className="text-xs opacity-70">Avg/NV</div><div className="text-sm font-bold">{fmt(Math.round(total / totalEmp))}</div></div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="card animate-slide-up">
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>📊 Cơ cấu chi phí</h3>
          {[
            { label: 'Lương cơ bản', value: totalBase, pct: Math.round(totalBase / total * 100), color: 'var(--primary)' },
            { label: 'Phụ cấp & Thưởng', value: mockPayrollByStore.reduce((s, p) => s + p.total_allowance + p.total_bonus, 0), pct: 15, color: '#1E9E57' },
            { label: 'Bảo hiểm (công ty)', value: totalIns, pct: Math.round(totalIns / total * 100), color: '#F6C85F' },
            { label: 'Thuế TNCN', value: totalTax, pct: Math.round(totalTax / total * 100), color: '#D9381E' },
          ].map(row => (
            <div key={row.label} className="mb-3">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                <span className="font-medium" style={{ color: row.color }}>{fmt(row.value)} ({row.pct}%)</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ background: 'var(--gray-100)' }}>
                <div className="h-2 rounded-full" style={{ width: `${row.pct}%`, background: row.color }} />
              </div>
            </div>
          ))}
        </div>

        {/* History */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>📅 Lịch sử bảng lương</h3>
          <div className="space-y-2">
            {mockPayrollHistory.map(h => (
              <div key={h.period} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--gray-50)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#6366f120' }}>
                  <Lock size={14} style={{ color: '#6366f1' }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Tháng {h.period}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{h.employee_count} NV • Khóa {h.locked_at}</div>
                </div>
                <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{fmt(h.total_net)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
