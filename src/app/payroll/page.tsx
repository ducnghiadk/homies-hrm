'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { getEmployeeById, getPositionById } from '@/lib/mock-data'
import { mockPayrollPeriods, mockPayslips, formatVND } from '@/lib/mock-data-p4'
import { getInitials } from '@/lib/utils'
import { DollarSign, TrendingUp, ChevronDown, ChevronUp, FileText } from 'lucide-react'

export default function PayrollPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState('2026-02')
  const [expandedSlip, setExpandedSlip] = useState<string|null>(null)
  const [tab, setTab] = useState<'overview'|'payslips'|'my'>('overview')

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const isManager = user.role !== 'employee'
  const period = mockPayrollPeriods.find(p => p.period === selectedPeriod)
  const slips = mockPayslips.filter(p => p.period === selectedPeriod)
  const mySlip = slips.find(s => s.employee_id === user.id)

  return (
    <AppShell title="Bảng lương 💰">
      <div className="space-y-4">
        {/* Period Selector */}
        <div className="flex items-center gap-2 animate-fade-in">
          <select className="input text-sm flex-1" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
            {mockPayrollPeriods.map(p => (
              <option key={p.id} value={p.period}>Tháng {p.period.split('-')[1]}/{p.period.split('-')[0]}</option>
            ))}
          </select>
          {period && (
            <span className="text-xs px-2 py-1 rounded-full font-bold" style={{
              background: period.status === 'paid' ? 'var(--success-light)' : period.status === 'confirmed' ? 'var(--warning-light)' : 'var(--gray-100)',
              color: period.status === 'paid' ? 'var(--success)' : period.status === 'confirmed' ? 'var(--warning)' : 'var(--text-muted)',
            }}>
              {period.status === 'paid' ? '✅ Đã trả' : period.status === 'confirmed' ? '📋 Đã duyệt' : '📝 Nháp'}
            </span>
          )}
        </div>

        {/* Tabs */}
        {isManager && (
          <div className="flex gap-1.5 animate-fade-in">
            {[
              { k: 'overview' as const, l: '📊 Tổng quan' },
              { k: 'payslips' as const, l: '📋 Phiếu lương' },
              { k: 'my' as const, l: '💰 Của tôi' },
            ].map(({ k, l }) => (
              <button key={k} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: tab === k ? 'var(--primary)' : 'var(--gray-100)',
                  color: tab === k ? 'white' : 'var(--text-secondary)',
                }} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
        )}

        {/* OVERVIEW (Manager) */}
        {(tab === 'overview' && isManager) && period && (
          <div className="space-y-3 animate-slide-up">
            <div className="grid grid-cols-2 gap-3">
              <div className="card-elevated p-4 text-center">
                <DollarSign size={20} className="mx-auto mb-1" style={{ color: 'var(--success)' }} />
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Tổng chi</div>
                <div className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{formatVND(period.total_gross)}</div>
              </div>
              <div className="card-elevated p-4 text-center">
                <TrendingUp size={20} className="mx-auto mb-1" style={{ color: 'var(--primary)' }} />
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Thực nhận</div>
                <div className="text-lg font-black" style={{ color: 'var(--primary)' }}>{formatVND(period.total_net)}</div>
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold">💵 Phân bổ chi phí</h3>
              </div>
              {(() => {
                const totalBase = slips.reduce((s, p) => s + p.base, 0)
                const totalOT = slips.reduce((s, p) => s + p.ot_amount, 0)
                const totalBonus = slips.reduce((s, p) => s + p.bonus, 0)
                const totalAllow = slips.reduce((s, p) => s + p.allowance, 0)
                const total = totalBase + totalOT + totalBonus + totalAllow
                const items = [
                  { label: 'Lương cơ bản', val: totalBase, color: '#2F6FA8' },
                  { label: 'Tăng ca', val: totalOT, color: '#F6C85F' },
                  { label: 'Thưởng', val: totalBonus, color: '#48C079' },
                  { label: 'Phụ cấp', val: totalAllow, color: '#001D3D' },
                ]
                return (
                  <>
                    <div className="flex rounded-full overflow-hidden h-3 mb-3">
                      {items.map((it, i) => (
                        <div key={i} style={{ width: `${(it.val / total) * 100}%`, background: it.color }} />
                      ))}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {items.map((it, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: it.color }} />
                          <span style={{ color: 'var(--text-secondary)' }}>{it.label}</span>
                          <span className="font-bold ml-auto">{formatVND(it.val)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
              <div className="card p-3 text-center">
                <div className="text-lg font-bold">{period.employee_count}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Nhân viên</div>
              </div>
              <div className="card p-3 text-center">
                <div className="text-lg font-bold">{slips.reduce((s, p) => s + p.ot_hours, 0)}h</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Tổng OT</div>
              </div>
              <div className="card p-3 text-center">
                <div className="text-lg font-bold">{formatVND(Math.round(period.total_net / period.employee_count))}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>TB/người</div>
              </div>
            </div>
          </div>
        )}

        {/* PAYSLIPS LIST (Manager) */}
        {(tab === 'payslips' && isManager) && (
          <div className="space-y-2 animate-slide-up">
            {slips.map(slip => {
              const emp = getEmployeeById(slip.employee_id)
              const expanded = expandedSlip === slip.employee_id
              return (
                <div key={slip.employee_id} className="card overflow-hidden">
                  <button className="w-full p-3 flex items-center gap-3 text-left" onClick={() => setExpandedSlip(expanded ? null : slip.employee_id)}>
                    <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{emp ? getInitials(emp.full_name) : '?'}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{emp?.full_name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{emp ? getPositionById(emp.position_id)?.name : ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: 'var(--success)' }}>{formatVND(slip.net)}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>thực nhận</div>
                    </div>
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expanded && <PayslipDetail slip={slip} />}
                </div>
              )
            })}
          </div>
        )}

        {/* MY PAYSLIP */}
        {(tab === 'my' || !isManager) && mySlip && (
          <div className="animate-slide-up">
            <div className="card-elevated p-5 text-center mb-4" style={{ background: 'linear-gradient(135deg, #48C07910, #2F6FA810)' }}>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Thực nhận tháng {selectedPeriod.split('-')[1]}</div>
              <div className="text-3xl font-black mt-1" style={{ color: 'var(--success)' }}>{formatVND(mySlip.net)}</div>
            </div>
            <div className="card"><PayslipDetail slip={mySlip} /></div>
          </div>
        )}

        {(tab === 'my' || !isManager) && !mySlip && (
          <div className="card p-8 text-center animate-slide-up">
            <FileText size={32} className="mx-auto mb-2" style={{ color: 'var(--gray-300)' }} />
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Chưa có phiếu lương cho kỳ này</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function PayslipDetail({ slip }: { slip: typeof mockPayslips[0] }) {
  return (
    <div className="px-3 pb-3 space-y-1.5 border-t" style={{ borderColor: 'var(--gray-100)' }}>
      <div className="pt-2" />
      {[
        { label: 'Lương cơ bản', val: slip.base, color: '' },
        { label: `Tăng ca (${slip.ot_hours}h)`, val: slip.ot_amount, color: 'var(--primary)' },
        { label: 'Thưởng', val: slip.bonus, color: 'var(--success)' },
        { label: 'Phụ cấp', val: slip.allowance, color: '' },
        { label: 'Phạt', val: slip.penalty, color: 'var(--error)' },
        { label: 'BHXH', val: slip.insurance, color: '' },
        { label: 'Thuế TNCN', val: slip.tax, color: '' },
      ].filter(r => r.val !== 0).map((row, i) => (
        <div key={i} className="flex justify-between text-xs py-1">
          <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
          <span className="font-medium" style={{ color: row.val < 0 ? 'var(--error)' : row.color || 'var(--text-primary)' }}>
            {row.val > 0 ? '+' : ''}{formatVND(row.val)}
          </span>
        </div>
      ))}
      <div className="flex justify-between text-sm font-bold pt-2 border-t" style={{ borderColor: 'var(--gray-200)' }}>
        <span>Thực nhận</span>
        <span style={{ color: 'var(--success)' }}>{formatVND(slip.net)}</span>
      </div>
    </div>
  )
}
