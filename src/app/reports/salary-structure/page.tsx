'use client'

import AppShell from '@/components/layout/AppShell'
import { mockSalaryStructure } from '@/lib/mock-data-reports'
import { Download } from 'lucide-react'

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'
const componentColors: Record<string, string> = {
  'Lương cơ bản': '#3b82f6', 'Phụ cấp': '#10b981', 'Thưởng': '#f59e0b',
  'OT': '#8b5cf6', 'BHXH (NV)': '#ef4444', 'Thuế TNCN': '#f97316', 'Khấu trừ khác': '#6b7280',
}

export default function SalaryStructurePage() {
  const d = mockSalaryStructure
  const totalCost = d.by_component.reduce((s, c) => s + Math.abs(c.amount), 0)

  return (
    <AppShell title="Cơ cấu lương">
      <div className="space-y-4">
        <div className="card animate-fade-in" style={{ background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', color: '#fff' }}>
          <div className="text-xs opacity-80">Tháng {d.period}</div>
          <div className="text-2xl font-bold mt-1">{fmt(totalCost)}</div>
          <div className="text-xs opacity-80 mt-1">Tổng chi phí nhân sự</div>
        </div>

        <div className="card animate-slide-up">
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>📊 Cơ cấu</h3>
          {d.by_component.map(b => {
            const color = componentColors[b.component] || '#6b7280'
            return (
              <div key={b.component} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text-secondary)' }}>{b.component}</span>
                  <span className="font-bold" style={{ color }}>{fmt(b.amount)} ({b.percent}%)</span>
                </div>
                <div className="w-full h-3 rounded-full" style={{ background: 'var(--gray-100)' }}>
                  <div className="h-3 rounded-full" style={{ width: `${Math.abs(b.percent)}%`, background: color }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>💼 Theo vị trí</h3>
          {d.by_position.map(p => (
            <div key={p.position} className="flex items-center justify-between py-2" style={{ borderBottom: '1px solid var(--gray-50)' }}>
              <div>
                <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{p.position}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.count} NV</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold" style={{ color: 'var(--primary)' }}>{fmt(p.avg_salary)}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>TB/tháng</div>
              </div>
            </div>
          ))}
        </div>

        <button className="btn btn-primary w-full text-sm gap-2 animate-fade-in"><Download size={16} /> Xuất báo cáo</button>
      </div>
    </AppShell>
  )
}
