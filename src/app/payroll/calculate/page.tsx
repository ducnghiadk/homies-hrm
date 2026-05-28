'use client'

import { useState, useMemo } from 'react'
import AppShell from '@/components/layout/AppShell'
import {
  calculatePayrollBatch,
  type PayrollResult,
} from '@/lib/payroll-engine'
import { comparePayrollPolicies, getActivePayrollPolicy, getStoredPayrollPolicy } from '@/lib/services/payroll-policy-service'
import {
  Calculator, Play, CheckCircle, AlertTriangle,
  ChevronDown, ChevronUp, Users, DollarSign, Clock, ShieldCheck,
} from 'lucide-react'

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'

export default function PayrollCalculationPage() {
  const [period] = useState({ start: '2026-02-01', end: '2026-02-28' })
  const [isRunning, setIsRunning] = useState(false)
  const [results, setResults] = useState<PayrollResult[] | null>(null)
  const [currentStep, setCurrentStep] = useState(-1)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [activePolicy] = useState(() => getActivePayrollPolicy())
  const [storedPolicy] = useState(() => getStoredPayrollPolicy())
  const hasPendingPolicy = storedPolicy.status !== 'active'
  const policyStatusText = storedPolicy.status === 'pending_ceo' ? 'Chờ CEO duyệt' : storedPolicy.status === 'draft' ? 'Bản nháp' : 'Đang áp dụng'
  const policyDiffs = comparePayrollPolicies(activePolicy, storedPolicy)

  const steps = [
    { label: 'Tải dữ liệu chấm công', detail: 'Lấy attendance records cho kỳ lương' },
    { label: 'Tính ngày công', detail: 'Work days, leave, absent, late count' },
    { label: 'Tính lương cơ bản', detail: 'Base × (effective_days / 26)' },
    { label: 'Tính OT', detail: `Giờ OT × hourly_rate × ${activePolicy.rates.otWeekday}x` },
    { label: 'Tính phụ cấp & thưởng', detail: 'Allowances + approved bonuses' },
    { label: 'Phân bổ tip/service charge', detail: 'Doanh thu store -> ca -> điểm đóng góp nhân viên' },
    { label: 'Tính khấu trừ', detail: 'Late penalty + absent + advance' },
    { label: 'Tính BHXH/BHYT/BHTN', detail: `${activePolicy.rates.bhxhEmployee * 100}% + ${activePolicy.rates.bhytEmployee * 100}% + ${activePolicy.rates.bhtnEmployee * 100}% trên lương cơ bản` },
    { label: 'Tính thuế TNCN', detail: 'Biểu thuế lũy tiến 7 bậc' },
    { label: 'Tổng hợp phiếu lương', detail: 'Generate payslip cho từng NV' },
  ]

  const runCalc = async () => {
    setIsRunning(true)
    setCurrentStep(0)

    for (let i = 0; i < steps.length; i++) {
      setCurrentStep(i)
      await new Promise(r => setTimeout(r, 400))
    }

    // Real calculation
    const payrollResults = calculatePayrollBatch(period.start, period.end)
    setResults(payrollResults)
    setCurrentStep(steps.length)
    setIsRunning(false)
  }

  // Summary aggregation
  const summary = useMemo(() => {
    if (!results) return null
    const totalNet = results.reduce((s, r) => s + r.net_salary, 0)
    const totalGross = results.reduce((s, r) => s + r.gross_salary, 0)
    const totalInsurance = results.reduce((s, r) => s + r.total_insurance, 0)
    const totalTax = results.reduce((s, r) => s + r.tax, 0)
    const totalFnbShare = results.reduce((s, r) => s + r.fnb_fnb_share, 0)
    return { totalNet, totalGross, totalInsurance, totalTax, totalFnbShare, count: results.length }
  }, [results])

  return (
    <AppShell title="Tính lương">
      <div className="space-y-4">
        {/* Period Header */}
        <div className="card animate-fade-in" style={{ background: 'linear-gradient(135deg, #F6C85F, #f97316)', color: '#fff' }}>
          <div className="flex items-center gap-2">
            <Calculator size={20} />
            <div>
              <div className="text-xs opacity-80">Kỳ lương</div>
              <div className="text-lg font-bold">Tháng 02/2026</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="text-xs opacity-80">Từ ngày</div>
              <div className="text-sm font-bold">{period.start.slice(8)}/02</div>
            </div>
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="text-xs opacity-80">Đến ngày</div>
              <div className="text-sm font-bold">{period.end.slice(8)}/02</div>
            </div>
            <div className="rounded-lg p-2" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="text-xs opacity-80">Ngày chuẩn</div>
              <div className="text-sm font-bold">26</div>
            </div>
          </div>
        </div>

        <div className="card animate-slide-up" style={{ background: hasPendingPolicy ? '#FFF7D7' : '#E8F3EE', border: hasPendingPolicy ? '1px solid #F6C85F55' : '1px solid #1E9E5730' }}>
          <div className="flex items-start gap-3">
            {hasPendingPolicy ? <AlertTriangle size={18} className="text-warning-500 mt-0.5" /> : <ShieldCheck size={18} className="text-emerald-600 mt-0.5" />}
            <div className="flex-1">
              <div className="text-xs font-bold uppercase" style={{ color: hasPendingPolicy ? '#92400E' : '#166534' }}>
                Policy lương dùng để tính: {activePolicy.version}
              </div>
              <p className="mt-1 text-xs leading-5" style={{ color: 'var(--text-secondary)' }}>
                Bảng lương này chỉ đọc cấu hình đã được CEO áp dụng. Trạng thái cấu hình hiện tại: <strong>{policyStatusText}</strong>
                {hasPendingPolicy ? ` (${storedPolicy.version}) - chưa đưa vào tính lương để tránh đổi lương ngoài duyệt.` : ` - cập nhật bởi ${activePolicy.updatedBy} lúc ${activePolicy.updatedAt}.`}
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-4">
                <MiniPolicy label="Cơm ca" value={`${activePolicy.fnb.mealAllowancePerShift.toLocaleString('vi-VN')}đ/ca`} />
                <MiniPolicy label="Ca đóng cửa" value={`${activePolicy.fnb.closingShiftAllowance.toLocaleString('vi-VN')}đ`} />
                <MiniPolicy label="Service charge" value={`${Math.round(activePolicy.fnb.serviceChargePoolRate * 100)}%`} />
                <MiniPolicy label="Tip chia team" value={`${Math.round(activePolicy.fnb.tipPoolRate * 100)}%`} />
              </div>
              {hasPendingPolicy && policyDiffs.length > 0 && (
                <div className="mt-3 rounded-xl bg-white/70 p-3 text-xs text-amber-900">
                  Có {policyDiffs.length} thay đổi đang chờ duyệt. Ví dụ: {policyDiffs.slice(0, 3).map((diff) => `${diff.label}: ${diff.before} -> ${diff.after}`).join(' · ')}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Steps Progress */}
        <div className="card animate-slide-up">
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>🔧 Quy trình tính lương</h3>
          <div className="space-y-1.5">
            {steps.map((step, i) => {
              const isDone = currentStep > i
              const isCurrent = currentStep === i
              return (
                <div key={i} className="flex items-start gap-2 p-1.5 rounded-lg transition-all"
                  style={{
                    background: isDone ? '#1E9E5708' : isCurrent ? 'var(--primary-50)' : 'var(--gray-50)',
                    ...(isCurrent ? { boxShadow: '0 0 0 1px var(--primary-200)' } : {}),
                  }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{
                      background: isDone ? '#1E9E5720' : isCurrent ? 'var(--primary-100)' : 'var(--gray-100)',
                      color: isDone ? '#1E9E57' : isCurrent ? 'var(--primary)' : 'var(--text-muted)',
                    }}>
                    {isDone ? <CheckCircle size={11} /> : isCurrent && isRunning
                      ? <span className="animate-spin text-xs">⏳</span>
                      : <span className="text-[10px] font-bold">{i + 1}</span>}
                  </div>
                  <div>
                    <div className="text-xs font-medium" style={{ color: isDone ? '#1E9E57' : 'var(--text-primary)' }}>{step.label}</div>
                    <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{step.detail}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Action Button */}
        {!results ? (
          <button onClick={runCalc} disabled={isRunning}
            className="btn btn-primary w-full text-sm gap-2 animate-fade-in">
            {isRunning ? (
              <><span className="animate-spin">⏳</span> Đang tính...</>
            ) : (
              <><Play size={16} /> Bắt đầu tính lương</>
            )}
          </button>
        ) : null}

        {/* Summary Cards */}
        {summary && (
          <div className="space-y-3 animate-fade-in">
            <div className="card" style={{ background: '#1E9E5710', border: '1px solid #1E9E5730' }}>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={18} className="text-emerald-500" />
                <span className="text-sm font-bold text-emerald-600">Tính lương hoàn tất!</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <Users size={10} /> Nhân viên
                  </div>
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{summary.count} người</div>
                </div>
                <div>
                  <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                    <DollarSign size={10} /> Tổng lương NET
                  </div>
                  <div className="text-sm font-bold text-emerald-600">{fmt(summary.totalNet)}</div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Tổng GROSS</div>
                  <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{fmt(summary.totalGross)}</div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>BHXH + Thuế</div>
                  <div className="text-xs font-medium text-error-500">{fmt(summary.totalInsurance + summary.totalTax)}</div>
                </div>
                <div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>F&B chia team</div>
                  <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{fmt(summary.totalFnbShare)}</div>
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="card">
              <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                📋 Chi tiết lương từng NV
              </h3>
              <div className="space-y-2">
                {results?.map(r => {
                  const isOpen = expandedRow === r.employee_id
                  return (
                    <div key={r.employee_id} className="rounded-lg overflow-hidden"
                      style={{ border: '1px solid var(--gray-200)' }}>
                      {/* Row header */}
                      <button
                        className="w-full flex items-center justify-between p-2.5 text-left"
                        style={{ background: isOpen ? 'var(--gray-50)' : 'transparent' }}
                        onClick={() => setExpandedRow(isOpen ? null : r.employee_id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                            {r.employee_name}
                          </div>
                          <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            {r.position} • {r.work_days}d/{r.standard_days}d
                            {r.late_count > 0 && <span className="text-warning-500"> • {r.late_count} trễ</span>}
                            {r.leave_days_paid > 0 && <span className="text-primary-500"> • {r.leave_days_paid} phép</span>}
                            {r.absent_days > 0 && <span className="text-error-500"> • {r.absent_days} vắng</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right">
                            <div className="text-xs font-bold text-emerald-600">{fmt(r.net_salary)}</div>
                            <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>NET</div>
                          </div>
                          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </button>

                      {/* Expanded detail */}
                      {isOpen && (
                        <div className="p-2.5 pt-0 space-y-2" style={{ background: 'var(--gray-50)' }}>
                          {/* Attendance */}
                          <div className="text-[10px] font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                            <Clock size={10} className="inline mr-1" />Chấm công
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-center">
                            <div className="rounded p-1" style={{ background: 'var(--bg-main)' }}>
                              <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{r.work_days}</div>
                              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Đi làm</div>
                            </div>
                            <div className="rounded p-1" style={{ background: 'var(--bg-main)' }}>
                              <div className="text-xs font-bold text-primary-500">{r.leave_days_paid}</div>
                              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Phép</div>
                            </div>
                            <div className="rounded p-1" style={{ background: 'var(--bg-main)' }}>
                              <div className="text-xs font-bold text-warning-500">{r.late_count}</div>
                              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Trễ</div>
                            </div>
                            <div className="rounded p-1" style={{ background: 'var(--bg-main)' }}>
                              <div className="text-xs font-bold text-error-500">{r.absent_days}</div>
                              <div className="text-[9px]" style={{ color: 'var(--text-muted)' }}>Vắng</div>
                            </div>
                          </div>

                          {/* Earnings */}
                          <div className="text-[10px] font-bold uppercase mt-2" style={{ color: 'var(--text-muted)' }}>💰 Thu nhập</div>
                          <div className="space-y-0.5 text-xs">
                            <Row label="Lương CB" value={fmt(r.base_earned)} sub={`${fmt(r.base_salary)} × ${r.work_days + r.leave_days_paid}/${r.standard_days}`} />
                            {r.overtime_hours > 0 && <Row label="OT" value={fmt(r.overtime_amount)} sub={`${r.overtime_hours}h × ${activePolicy.rates.otWeekday}x`} color="#F6C85F" />}
                            {r.total_allowances > 0 && <Row label="Phụ cấp" value={fmt(r.total_allowances)} />}
                            {r.total_bonuses > 0 && <Row label="Thưởng" value={fmt(r.total_bonuses)} color="#1E9E57" />}
                            {r.fnb_fnb_share > 0 && <Row label="F&B tip/service charge" value={fmt(r.fnb_fnb_share)} sub={`${r.fnb_allocation_breakdown.length} store/ca · ${r.fnb_allocation_points.toFixed(1)} điểm`} color="#0f766e" />}
                            <Row label="Tổng thu nhập" value={fmt(r.total_earnings)} bold />
                          </div>

                          {r.fnb_allocation_breakdown.length > 0 && (
                            <div className="rounded-lg p-2" style={{ background: '#0f766e10', border: '1px solid #0f766e22' }}>
                              <div className="text-[10px] font-bold uppercase" style={{ color: '#0f766e' }}>F&B pool theo store/ca</div>
                              <div className="mt-1 space-y-1">
                                {r.fnb_allocation_breakdown.map((item) => (
                                  <div key={`${item.store_id}-${item.shift_id}`} className="rounded-md bg-white/70 p-1.5">
                                    <div className="flex justify-between gap-2 text-[10px] font-bold" style={{ color: 'var(--text-primary)' }}>
                                      <span>{item.store_name} · {item.shift_name}</span>
                                      <span>+{fmt(item.employee_share)}</span>
                                    </div>
                                    <div className="mt-0.5 text-[9px]" style={{ color: 'var(--text-muted)' }}>
                                      Doanh thu ca {fmt(item.shift_revenue)} · Pool chia {fmt(item.tip_pool)} · Điểm {item.employee_points.toFixed(1)}/{item.shift_points.toFixed(1)}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Deductions */}
                          <div className="text-[10px] font-bold uppercase mt-2" style={{ color: 'var(--text-muted)' }}>📉 Khấu trừ</div>
                          <div className="space-y-0.5 text-xs">
                            {r.late_deduction > 0 && <Row label={`Trễ (${r.late_count}×50k)`} value={`-${fmt(r.late_deduction)}`} color="#D9381E" />}
                            {r.absent_deduction > 0 && <Row label="Vắng không phép" value={`-${fmt(r.absent_deduction)}`} color="#D9381E" />}
                            {r.advance_deduction > 0 && <Row label="Ứng lương" value={`-${fmt(r.advance_deduction)}`} color="#D9381E" />}
                            {r.other_deductions.map((d, i) => (
                              <Row key={i} label={d.name} value={`-${fmt(d.amount)}`} color="#D9381E" />
                            ))}
                            <Row label={`BHXH (${activePolicy.rates.bhxhEmployee * 100}%)`} value={`-${fmt(r.bhxh)}`} color="#D9381E" />
                            <Row label={`BHYT (${activePolicy.rates.bhytEmployee * 100}%)`} value={`-${fmt(r.bhyt)}`} color="#D9381E" />
                            <Row label={`BHTN (${activePolicy.rates.bhtnEmployee * 100}%)`} value={`-${fmt(r.bhtn)}`} color="#D9381E" />
                            {r.tax > 0 && <Row label="Thuế TNCN" value={`-${fmt(r.tax)}`} color="#D9381E" />}
                          </div>

                          {/* Net */}
                          <div className="rounded-lg p-2 mt-2" style={{ background: '#1E9E5710', border: '1px solid #1E9E5730' }}>
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>THỰC LĨNH</span>
                              <span className="text-sm font-bold text-emerald-600">{fmt(r.net_salary)}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Warnings */}
        {!results && (
          <div className="card animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={14} className="text-warning-500" />
              <span className="text-xs font-bold text-warning-500">Lưu ý trước khi tính</span>
            </div>
            <ul className="text-xs space-y-1" style={{ color: 'var(--text-secondary)' }}>
              <li>• Kiểm tra chấm công đã khóa chưa</li>
              <li>• Duyệt hết phiếu thưởng/khấu trừ pending</li>
              <li>• Xác nhận phụ cấp + tạm ứng</li>
            </ul>
          </div>
        )}
      </div>
    </AppShell>
  )
}

// ── Reusable row component ──
function Row({ label, value, sub, bold, color }: {
  label: string, value: string, sub?: string, bold?: boolean, color?: string
}) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <div>
        <span className={bold ? 'font-bold' : ''} style={{ color: 'var(--text-secondary)' }}>{label}</span>
        {sub && <span className="text-[10px] ml-1" style={{ color: 'var(--text-muted)' }}>({sub})</span>}
      </div>
      <span className={bold ? 'font-bold' : 'font-medium'} style={{ color: color || (bold ? 'var(--text-primary)' : 'var(--text-secondary)') }}>
        {value}
      </span>
    </div>
  )
}

function MiniPolicy({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#17362f] px-3 py-2 text-white">
      <div className="text-[10px] uppercase tracking-[0.16em] text-[#f8d36b]">{label}</div>
      <div className="mt-1 text-sm font-bold">{value}</div>
    </div>
  )
}
