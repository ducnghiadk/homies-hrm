'use client'

import AppShell from '@/components/layout/AppShell'
import { mockPayrollByStore } from '@/lib/mock-data-payroll'
import { DollarSign, Users, CheckCircle, Clock, Lock, ChevronRight } from 'lucide-react'
import Link from 'next/link'

const statusConfig = {
  draft: { label: 'Nháp', color: '#9ca3af', icon: Clock },
  reviewing: { label: 'Đang duyệt', color: '#f59e0b', icon: Clock },
  approved: { label: 'Đã duyệt', color: '#10b981', icon: CheckCircle },
  locked: { label: 'Đã khóa', color: '#6366f1', icon: Lock },
}

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'

export default function PayrollByStorePage() {
  const total_net = mockPayrollByStore.reduce((s, p) => s + p.total_net, 0)
  const total_emp = mockPayrollByStore.reduce((s, p) => s + p.employee_count, 0)

  return (
    <AppShell title="Bảng lương theo cửa hàng">
      <div className="space-y-4">
        {/* Summary */}
        <div className="card animate-fade-in" style={{ background: 'linear-gradient(135deg, var(--primary), #6366f1)', color: '#fff' }}>
          <div className="text-xs opacity-80">Tổng quỹ lương tháng 02/2026</div>
          <div className="text-2xl font-bold mt-1">{fmt(total_net)}</div>
          <div className="flex gap-4 mt-2 text-xs opacity-80">
            <span><Users size={12} className="inline mr-1" />{total_emp} nhân viên</span>
            <span>{mockPayrollByStore.length} cửa hàng</span>
          </div>
        </div>

        {/* Store Cards */}
        {mockPayrollByStore.map((store, idx) => {
          const stat = statusConfig[store.status]
          const Icon = stat.icon
          return (
            <div key={store.store_id} className="card animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{store.store_name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{store.employee_count} nhân viên</div>
                </div>
                <span className="text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1"
                  style={{ background: stat.color + '20', color: stat.color }}>
                  <Icon size={10} /> {stat.label}
                </span>
              </div>

              <div className="space-y-1.5">
                {[
                  { label: 'Lương cơ bản', value: store.total_base, color: 'var(--text-primary)' },
                  { label: '+ Phụ cấp', value: store.total_allowance, color: '#3b82f6' },
                  { label: '+ Thưởng', value: store.total_bonus, color: '#10b981' },
                  { label: '- Khấu trừ', value: -store.total_deduction, color: '#ef4444' },
                  { label: '- Bảo hiểm', value: -store.total_insurance, color: '#f59e0b' },
                  { label: '- Thuế TNCN', value: -store.total_tax, color: '#f97316' },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-xs">
                    <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                    <span className="font-medium" style={{ color: row.color }}>{fmt(Math.abs(row.value))}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-bold pt-2" style={{ borderTop: '1px solid var(--gray-100)' }}>
                  <span style={{ color: 'var(--text-primary)' }}>Thực nhận</span>
                  <span style={{ color: 'var(--primary)' }}>{fmt(store.total_net)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
