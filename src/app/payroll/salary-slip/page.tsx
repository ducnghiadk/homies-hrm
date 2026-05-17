'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockSalarySlips } from '@/lib/mock-data-payroll'
import { FileText, ChevronDown, ChevronUp, Download } from 'lucide-react'

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'

export default function SalarySlipPage() {
  const [expanded, setExpanded] = useState<string | null>(mockSalarySlips[0]?.id)

  return (
    <AppShell title="Phiếu lương">
      <div className="space-y-4">
        {mockSalarySlips.map((slip, idx) => {
          const isOpen = expanded === slip.id
          return (
            <div key={slip.id} className="card animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
              <button className="w-full text-left" onClick={() => setExpanded(isOpen ? null : slip.id)}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-50)' }}>
                    <FileText size={18} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{slip.employee_name}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{slip.position} • {slip.store} • T.{slip.period}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: 'var(--primary)' }}>{fmt(slip.net_salary)}</div>
                    {isOpen ? <ChevronUp size={14} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="mt-4 pt-4 space-y-3" style={{ borderTop: '1px solid var(--gray-100)' }}>
                  {/* Work Info */}
                  <div className="flex justify-between text-xs p-2 rounded-lg" style={{ background: 'var(--gray-50)' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Ngày công</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{slip.work_days}/{slip.standard_days}</span>
                  </div>

                  {/* Earnings */}
                  <div>
                    <div className="text-xs font-bold mb-1.5 text-emerald-500">📈 Thu nhập</div>
                    {[
                      { l: 'Lương cơ bản', v: slip.base_salary },
                      ...slip.allowances.map(a => ({ l: a.name, v: a.amount })),
                      ...(slip.overtime_amount > 0 ? [{ l: `OT (${slip.overtime_hours}h)`, v: slip.overtime_amount }] : []),
                      ...(slip.bonus > 0 ? [{ l: 'Thưởng', v: slip.bonus }] : []),
                    ].map(r => (
                      <div key={r.l} className="flex justify-between text-xs py-0.5">
                        <span style={{ color: 'var(--text-secondary)' }}>{r.l}</span>
                        <span className="text-emerald-500">+{fmt(r.v)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-bold pt-1" style={{ borderTop: '1px dashed var(--gray-200)' }}>
                      <span style={{ color: 'var(--text-primary)' }}>Tổng thu nhập</span>
                      <span className="text-emerald-500">{fmt(slip.total_earnings)}</span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div>
                    <div className="text-xs font-bold mb-1.5 text-red-500">📉 Khấu trừ</div>
                    {[
                      ...(slip.late_deduction > 0 ? [{ l: 'Đi muộn', v: slip.late_deduction }] : []),
                      ...(slip.advance_deduction > 0 ? [{ l: 'Tạm ứng', v: slip.advance_deduction }] : []),
                      { l: 'BHXH (8%)', v: slip.bhxh },
                      { l: 'BHYT (1.5%)', v: slip.bhyt },
                      { l: 'BHTN (1%)', v: slip.bhtn },
                      ...(slip.tax > 0 ? [{ l: 'Thuế TNCN', v: slip.tax }] : []),
                    ].map(r => (
                      <div key={r.l} className="flex justify-between text-xs py-0.5">
                        <span style={{ color: 'var(--text-secondary)' }}>{r.l}</span>
                        <span className="text-red-500">-{fmt(r.v)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-bold pt-1" style={{ borderTop: '1px dashed var(--gray-200)' }}>
                      <span style={{ color: 'var(--text-primary)' }}>Tổng khấu trừ</span>
                      <span className="text-red-500">-{fmt(slip.total_deductions)}</span>
                    </div>
                  </div>

                  {/* Net */}
                  <div className="p-3 rounded-xl text-center" style={{ background: 'var(--primary-50)' }}>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Thực nhận</div>
                    <div className="text-xl font-bold" style={{ color: 'var(--primary)' }}>{fmt(slip.net_salary)}</div>
                  </div>

                  <button className="btn w-full text-xs gap-1" style={{ background: 'var(--gray-100)', color: 'var(--text-primary)' }}>
                    <Download size={14} /> Tải phiếu lương PDF
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
