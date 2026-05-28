'use client'

import { useMemo, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { calculatePayrollBatch } from '@/lib/payroll-engine'
import { getActivePayrollPolicy } from '@/lib/services/payroll-policy-service'
import { FileText, ChevronDown, ChevronUp, Download, Utensils } from 'lucide-react'

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'
const PAYROLL_PERIOD = { start: '2026-02-01', end: '2026-02-28' }

export default function SalarySlipPage() {
  const slips = useMemo(() => calculatePayrollBatch(PAYROLL_PERIOD.start, PAYROLL_PERIOD.end).map((result) => ({
    id: `slip-${result.employee_id}-${result.period}`,
    employee_id: result.employee_id,
    employee_name: result.employee_name,
    position: result.position,
    store: result.store,
    period: result.period.split('-').reverse().join('/'),
    work_days: result.work_days,
    standard_days: result.standard_days,
    base_salary: result.base_earned,
    allowances: [
      ...result.allowances,
      ...(result.fnb_fnb_share > 0 ? [{ name: 'F&B: Tip/service charge', amount: result.fnb_fnb_share }] : []),
    ],
    overtime_hours: result.overtime_hours,
    overtime_amount: result.overtime_amount,
    bonus: result.total_bonuses,
    total_earnings: result.total_earnings,
    late_deduction: result.late_deduction,
    advance_deduction: result.advance_deduction,
    bhxh: result.bhxh,
    bhyt: result.bhyt,
    bhtn: result.bhtn,
    tax: result.tax,
    other_deduction: result.absent_deduction + result.total_other_deductions,
    total_deductions: result.total_deductions + result.total_insurance + result.tax,
    net_salary: result.net_salary,
    fnb_breakdown: result.fnb_allocation_breakdown,
  })), [])
  const [expanded, setExpanded] = useState<string | null>(() => slips[0]?.id ?? null)
  const [activePolicy] = useState(() => getActivePayrollPolicy())

  return (
    <AppShell title="Phiếu lương">
      <div className="space-y-4">
        <div className="card" style={{ background: 'linear-gradient(135deg, #17362f, #0f766e)', color: '#fff' }}>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-2"><Utensils size={18} /></div>
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-[#f8d36b]">Policy lương đang áp dụng</div>
              <div className="text-sm font-bold">Phiên bản {activePolicy.version} · Cơm ca {activePolicy.fnb.mealAllowancePerShift.toLocaleString('vi-VN')} đ/ca · Service charge {Math.round(activePolicy.fnb.serviceChargePoolRate * 100)}% · Tip team {Math.round(activePolicy.fnb.tipPoolRate * 100)}%</div>
            </div>
          </div>
        </div>
        {slips.map((slip, idx) => {
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
                    {slip.fnb_breakdown?.length > 0 && (
                      <div className="mt-2 space-y-1 rounded-lg border border-emerald-100 bg-emerald-50 p-2">
                        <div className="text-[10px] font-bold uppercase text-emerald-700">F&B theo store/ca</div>
                        {slip.fnb_breakdown.map((item) => (
                          <div key={`${item.store_id}-${item.shift_id}`} className="rounded-md bg-white/80 p-1.5">
                            <div className="flex justify-between gap-2 text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>
                              <span>{item.store_name} · {item.shift_name}</span>
                              <span>+{fmt(item.employee_share)}</span>
                            </div>
                            <div className="mt-0.5 text-[9px]" style={{ color: 'var(--text-muted)' }}>
                              Pool {fmt(item.tip_pool)} · Doanh thu ca {fmt(item.shift_revenue)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    <div className="flex justify-between text-xs font-bold pt-1" style={{ borderTop: '1px dashed var(--gray-200)' }}>
                      <span style={{ color: 'var(--text-primary)' }}>Tổng thu nhập</span>
                      <span className="text-emerald-500">{fmt(slip.total_earnings)}</span>
                    </div>
                  </div>

                  {/* Deductions */}
                  <div>
                    <div className="text-xs font-bold mb-1.5 text-error-500">📉 Khấu trừ</div>
                    {[
                      ...(slip.late_deduction > 0 ? [{ l: 'Đi muộn', v: slip.late_deduction }] : []),
                      ...(slip.advance_deduction > 0 ? [{ l: 'Tạm ứng', v: slip.advance_deduction }] : []),
                      { l: `BHXH (${activePolicy.rates.bhxhEmployee * 100}%)`, v: slip.bhxh },
                      { l: `BHYT (${activePolicy.rates.bhytEmployee * 100}%)`, v: slip.bhyt },
                      { l: `BHTN (${activePolicy.rates.bhtnEmployee * 100}%)`, v: slip.bhtn },
                      ...(slip.tax > 0 ? [{ l: 'Thuế TNCN', v: slip.tax }] : []),
                    ].map(r => (
                      <div key={r.l} className="flex justify-between text-xs py-0.5">
                        <span style={{ color: 'var(--text-secondary)' }}>{r.l}</span>
                        <span className="text-error-500">-{fmt(r.v)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-xs font-bold pt-1" style={{ borderTop: '1px dashed var(--gray-200)' }}>
                      <span style={{ color: 'var(--text-primary)' }}>Tổng khấu trừ</span>
                      <span className="text-error-500">-{fmt(slip.total_deductions)}</span>
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
