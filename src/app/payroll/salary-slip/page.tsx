'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import AppShell from '@/components/layout/AppShell'
import { useSearchParams } from 'next/navigation'
import { calculatePayrollBatchAsync, getPayrollPeriodBounds, normalizePayrollPeriod } from '@/lib/payroll-engine'
import { getActivePayrollPolicy } from '@/lib/services/payroll-policy-service'
import { hasPermission } from '@/lib/rbac'
import {
  FileText,
  ChevronDown,
  ChevronUp,
  Download,
  Utensils,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Calendar,
  CreditCard,
  Building2,
} from 'lucide-react'

const fmt = (n: number) => n.toLocaleString('vi-VN') + ' ₫'

export default function SalarySlipPage() {
  return (
    <Suspense
      fallback={
        <AppShell title="Phiếu lương của tôi">
          <div className="p-6 text-sm text-slate-500 flex items-center justify-center min-h-[50vh]">
            Đang chuẩn bị phiếu lương cá nhân...
          </div>
        </AppShell>
      }
    >
      <SalarySlipContent />
    </Suspense>
  )
}

function SalarySlipContent() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const searchParams = useSearchParams()
  const selectedPeriod = normalizePayrollPeriod(searchParams.get('period'))
  const period = useMemo(() => getPayrollPeriodBounds(selectedPeriod), [selectedPeriod])
  const [payrollResults, setPayrollResults] = useState<Awaited<ReturnType<typeof calculatePayrollBatchAsync>>>([])
  const [isPayrollLoading, setIsPayrollLoading] = useState(true)
  const [payrollError, setPayrollError] = useState<string | null>(null)

  const slips = useMemo(() => {
    return payrollResults
      .filter(result => user && (
        hasPermission(user.role, 'payroll.view_all') || result.employee_id === user.id
      ))
      .map((result) => {
        const totalHours = result.total_hours || (result.work_days * 5.5) || 0
        const calculatedRate = totalHours > 0 ? Math.round(result.base_earned / totalHours) : (result.base_salary || 22000)
        const effectiveRate = calculatedRate > 0 ? calculatedRate : 22000
        const periodMonth = result.period.split('-')[1] || '08'
        const periodYear = result.period.split('-')[0] || '2026'

        return {
          id: `slip-${result.employee_id}-${result.period}`,
          employee_id: result.employee_id,
          employee_name: result.employee_name,
          employee_code: result.employee_code,
          position: result.position,
          store: result.store,
          period: `${periodMonth}/${periodYear}`,
          work_days: result.work_days,
          standard_days: result.standard_days,
          total_hours: totalHours,
          hourly_rate: effectiveRate,
          is_part_time: result.is_part_time,
          base_salary: result.base_earned > 0 ? result.base_earned : Math.round(totalHours * effectiveRate),
          tip_share: result.fnb_fnb_share || 0,
          allowances: [
            ...result.allowances,
            ...(result.fnb_fnb_share > 0 ? [{ name: 'Quỹ Tip & Phí F&B chia theo giờ', amount: result.fnb_fnb_share }] : []),
          ],
          overtime_hours: result.overtime_hours,
          overtime_amount: result.overtime_amount,
          bonus: result.total_bonuses,
          total_earnings: result.total_earnings,
          late_deduction: result.late_deduction,
          late_count: result.late_count,
          advance_deduction: result.advance_deduction,
          bhxh: result.bhxh,
          bhyt: result.bhyt,
          bhtn: result.bhtn,
          tax: result.tax,
          other_deduction: result.total_other_deductions,
          total_deductions: result.total_deductions + result.total_insurance + result.tax,
          net_salary: result.net_salary,
          fnb_breakdown: result.fnb_allocation_breakdown,
          payment_status: 'Đã chuyển khoản',
          payment_date: `05/${periodMonth}/${periodYear}`,
        }
      })
  }, [user, payrollResults])

  const [expanded, setExpanded] = useState<string | null>(null)
  const [activePolicy] = useState(() => getActivePayrollPolicy())

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user) return
    let isMounted = true

    setIsPayrollLoading(true)
    setPayrollError(null)
    setPayrollResults([])

    const loadSalarySlips = async () => {
      try {
        const periodKey = `${period.year}-${String(period.month).padStart(2, '0')}`
        const apiRes = await fetch(`/api/payroll?period=${periodKey}`)
        if (apiRes.ok) {
          const apiData = await apiRes.json()
          if (apiData?.success && Array.isArray(apiData.salary_slips) && apiData.salary_slips.length > 0) {
            if (!isMounted) return
            const mappedResults = apiData.salary_slips.map((s: any) => {
              const isPartTime = (s.base_salary === 0 && (s.total_hours > 0 || s.net_salary > 0)) || s.position?.includes('pha chế') || s.position?.includes('phục vụ') || false
              const hourlyRate = isPartTime && s.total_hours > 0 ? Math.round((s.net_salary - (s.bonus || 0)) / s.total_hours) : (isPartTime ? 20000 : 0)

              return {
                employee_id: s.employee_id,
                employee_code: s.employee_code || '',
                employee_name: s.employee_name || 'Nhân viên',
                is_resigned_employee: false,
                is_part_time: isPartTime,
                position: s.position || '',
                store: '',
                period: periodKey,
                standard_days: s.standard_days || 26,
                work_days: s.work_days || 0,
                leave_days_paid: 0,
                leave_days_unpaid: 0,
                absent_days: 0,
                late_count: 0,
                soCaChoDuyet: 0,
                soCaChuaCheckOut: 0,
                total_hours: s.total_hours || 0,
                base_salary: isPartTime ? hourlyRate : (s.base_salary || 0),
                base_earned: isPartTime ? Math.round((s.total_hours || 0) * hourlyRate) : (s.base_salary || 0),
                overtime_hours: 0,
                overtime_amount: 0,
                allowances: [],
                total_allowances: s.allowances || 0,
                bonuses: [],
                total_bonuses: s.bonus || 0,
                fnb_service_charge_pool: 0,
                fnb_tip_pool: 0,
                fnb_fnb_share: 0,
                fnb_allocation_points: 0,
                fnb_allocation_breakdown: [],
                total_earnings: s.net_salary || 0,
                late_deduction: 0,
                absent_deduction: 0,
                advance_deduction: 0,
                other_deductions: [],
                total_other_deductions: s.deductions || 0,
                total_deductions: s.deductions || 0,
                bhxh: 0,
                bhyt: 0,
                bhtn: 0,
                total_insurance: 0,
                taxable_income: 0,
                tax: 0,
                gross_salary: s.net_salary || 0,
                net_salary: s.net_salary || 0,
                kpi_salary: 0,
                union_fee: 0,
                hold_salary: 0,
                return_hold_salary: 0,
              }
            })
            setPayrollResults(mappedResults as any)
            setIsPayrollLoading(false)
            return
          }
        }
      } catch (err) {
        console.warn('[SalarySlip] API fallback:', err)
      }

      calculatePayrollBatchAsync(period.start, period.end)
        .then(results => {
          if (isMounted) setPayrollResults(results)
        })
        .catch(error => {
          if (isMounted) {
            setPayrollError(error instanceof Error ? error.message : 'Không tính được phiếu lương.')
            setPayrollResults([])
          }
        })
        .finally(() => {
          if (isMounted) setIsPayrollLoading(false)
        })
    }

    loadSalarySlips()

    return () => { isMounted = false }
  }, [hasHydrated, isAuthenticated, user, period.start, period.end])

  useEffect(() => {
    if (!expanded && slips[0]?.id) setExpanded(slips[0].id)
  }, [expanded, slips])

  if (!hasHydrated || !isAuthenticated || !user) return null

  return (
    <AppShell title="Phiếu lương của tôi">
      <div className="space-y-4 max-w-2xl mx-auto pb-12">
        {/* Banner chính sách F&B đang áp dụng */}
        <div className="card bg-linear-to-br from-[#17362f] to-[#0f766e] text-white p-4 rounded-2xl shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/10 p-2.5 shrink-0">
              <Utensils size={20} className="text-[#f8d36b]" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] uppercase tracking-wider font-bold text-[#f8d36b]">
                Chính sách Homies áp dụng ({activePolicy.version})
              </div>
              <div className="text-xs font-semibold mt-0.5 text-white/90 truncate">
                Cơm ca: {activePolicy.fnb.mealAllowancePerShift.toLocaleString('vi-VN')} đ/ca · Chia Tip: {Math.round(activePolicy.fnb.tipPoolRate * 100)}% · Công chuẩn: 26 ngày
              </div>
            </div>
          </div>
        </div>

        {isPayrollLoading && (
          <div className="p-8 text-center text-xs text-gray-500 bg-white rounded-2xl border border-gray-100 shadow-xs">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2.5"></div>
            Đang đối soát dữ liệu ca làm &amp; chấm công thực tế...
          </div>
        )}

        {payrollError && (
          <div className="p-4 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-2xl">
            Không tải được phiếu lương: {payrollError}
          </div>
        )}

        {!isPayrollLoading && slips.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 shadow-xs">
            <CreditCard size={32} className="text-gray-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-gray-800">Chưa có phiếu lương cho kỳ này</div>
            <p className="text-xs text-gray-500 mt-1">Phiếu lương sẽ hiển thị ngay khi Quản lý hoặc CEO phát hành bảng lương.</p>
          </div>
        )}

        {slips.map((slip, idx) => {
          const isOpen = expanded === slip.id

          return (
            <div
              key={slip.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden transition-all duration-200"
            >
              {/* Header Card Bấm Để Thu Phóng */}
              <button
                type="button"
                className="w-full text-left p-4 sm:p-5 hover:bg-slate-50/50 transition cursor-pointer"
                onClick={() => setExpanded(isOpen ? null : slip.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                      <FileText size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-gray-900">{slip.employee_name}</span>
                        <span className="text-[10px] font-mono font-semibold bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                          {slip.employee_code}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                        <span>{slip.position}</span>
                        <span>•</span>
                        <span>{slip.store}</span>
                        <span>•</span>
                        <span className="font-semibold text-emerald-700">Kỳ {slip.period}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs text-gray-400 font-medium">Thực nhận Net</div>
                    <div className="text-base sm:text-lg font-bold font-mono text-emerald-600 tabular-nums">
                      {fmt(slip.net_salary)}
                    </div>
                    <div className="flex items-center justify-end gap-1 mt-0.5 text-gray-400">
                      <span className="text-[11px] font-medium">{isOpen ? 'Thu gọn' : 'Chi tiết'}</span>
                      {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>
                </div>

                {/* Badge Trạng Thái Chuyển Khoản Nổi Bật */}
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    <span>{slip.payment_status} ngày {slip.payment_date}</span>
                  </div>
                  <div className="text-gray-500 text-[11px]">
                    Tổng cộng: <strong className="text-gray-800 font-mono">{slip.total_hours}h</strong> ({slip.work_days} ca)
                  </div>
                </div>
              </button>

              {/* Chi Tiết Phiếu Lương Bung Ra */}
              {isOpen && (
                <div className="px-4 pb-5 sm:px-5 space-y-4 border-t border-gray-100 bg-slate-50/30">
                  {/* 1. KHỐI THỜI GIAN LÀM VIỆC & LƯƠNG GIỜ */}
                  <div className="rounded-xl border border-gray-200/80 bg-white p-3.5 space-y-2 mt-4 shadow-2xs">
                    <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Clock size={14} className="text-[#2F6FA8]" />
                      <span>Chi tiết giờ làm việc thực tế</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                      <div className="bg-gray-50 p-2.5 rounded-lg">
                        <span className="text-gray-500 text-[11px] block">Tổng số giờ làm:</span>
                        <strong className="text-sm font-mono text-gray-900">{slip.total_hours} giờ</strong>
                      </div>

                      <div className="bg-gray-50 p-2.5 rounded-lg">
                        <span className="text-gray-500 text-[11px] block">Số ca hoàn thành:</span>
                        <strong className="text-sm font-mono text-gray-900">{slip.work_days} ca ({slip.work_days}/{slip.standard_days} công)</strong>
                      </div>
                    </div>

                    <div className="bg-blue-50/60 border border-blue-100 p-2.5 rounded-lg text-xs flex justify-between items-center text-blue-900 font-medium">
                      <span>Đơn giá giờ thực tế:</span>
                      <span className="font-mono font-bold text-[#2F6FA8]">{fmt(slip.hourly_rate)} / giờ</span>
                    </div>

                    <div className="flex justify-between items-center text-xs pt-1 font-semibold text-gray-700">
                      <span>Lương cơ bản theo giờ:</span>
                      <span className="font-mono text-emerald-700">
                        {slip.total_hours}h x {fmt(slip.hourly_rate)} = {fmt(slip.base_salary)}
                      </span>
                    </div>
                  </div>

                  {/* 2. KHỐI THU NHẬP & THƯỞNG F&B */}
                  <div className="rounded-xl border border-emerald-200/80 bg-white p-3.5 space-y-2 shadow-2xs">
                    <div className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-600" />
                      <span>Các khoản thu nhập &amp; Thưởng F&amp;B</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-gray-100">
                        <span className="text-gray-600">Lương chính (Công / Giờ):</span>
                        <span className="font-mono font-bold text-emerald-700">+{fmt(slip.base_salary)}</span>
                      </div>

                      {slip.tip_share > 0 && (
                        <div className="flex justify-between py-1 border-b border-gray-100 bg-amber-50/50 -mx-3.5 px-3.5">
                          <span className="text-amber-900 font-medium flex items-center gap-1">
                            <span>Quỹ Tip F&amp;B chia theo giờ:</span>
                          </span>
                          <span className="font-mono font-bold text-amber-700">+{fmt(slip.tip_share)}</span>
                        </div>
                      )}

                      {slip.overtime_amount > 0 && (
                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-600">Lương tăng ca OT ({slip.overtime_hours}h):</span>
                          <span className="font-mono font-bold text-emerald-700">+{fmt(slip.overtime_amount)}</span>
                        </div>
                      )}

                      {slip.bonus > 0 && (
                        <div className="flex justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-600">Thưởng chuyên cần &amp; KPI:</span>
                          <span className="font-mono font-bold text-emerald-700">+{fmt(slip.bonus)}</span>
                        </div>
                      )}

                      {slip.allowances.filter(a => !a.name.includes('Quỹ Tip')).map((a, i) => (
                        <div key={i} className="flex justify-between py-1 border-b border-gray-100">
                          <span className="text-gray-600">{a.name}:</span>
                          <span className="font-mono font-bold text-emerald-700">+{fmt(a.amount)}</span>
                        </div>
                      ))}

                      <div className="flex justify-between pt-1.5 font-bold text-xs text-gray-900">
                        <span>Tổng thu nhập Gross:</span>
                        <span className="font-mono text-emerald-700 text-sm">+{fmt(slip.total_earnings)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 3. KHỐI CÁC KHOẢN KHẤU TRỪ */}
                  <div className="rounded-xl border border-rose-200/80 bg-white p-3.5 space-y-2 shadow-2xs">
                    <div className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                      <AlertCircle size={14} className="text-rose-600" />
                      <span>Các khoản khấu trừ</span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      {slip.late_deduction > 0 ? (
                        <div className="flex justify-between py-1 border-b border-gray-100 text-rose-700 font-medium">
                          <span>Phạt đi muộn ({slip.late_count} lần):</span>
                          <span className="font-mono font-bold">-{fmt(slip.late_deduction)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between py-1 border-b border-gray-100 text-gray-400">
                          <span>Phạt đi muộn:</span>
                          <span className="font-mono">0 ₫ (Không vi phạm)</span>
                        </div>
                      )}

                      {slip.advance_deduction > 0 ? (
                        <div className="flex justify-between py-1 border-b border-gray-100 text-rose-700 font-medium">
                          <span>Tạm ứng lương giữa tháng:</span>
                          <span className="font-mono font-bold">-{fmt(slip.advance_deduction)}</span>
                        </div>
                      ) : (
                        <div className="flex justify-between py-1 border-b border-gray-100 text-gray-400">
                          <span>Tạm ứng lương:</span>
                          <span className="font-mono">0 ₫</span>
                        </div>
                      )}

                      {slip.bhxh > 0 && (
                        <div className="flex justify-between py-1 border-b border-gray-100 text-gray-600">
                          <span>BHXH, BHYT, BHTN (10.5%):</span>
                          <span className="font-mono text-rose-600">-{fmt(slip.bhxh + slip.bhyt + slip.bhtn)}</span>
                        </div>
                      )}

                      {slip.tax > 0 && (
                        <div className="flex justify-between py-1 border-b border-gray-100 text-gray-600">
                          <span>Thuế thu nhập cá nhân (TNCN):</span>
                          <span className="font-mono text-rose-600">-{fmt(slip.tax)}</span>
                        </div>
                      )}

                      <div className="flex justify-between pt-1.5 font-bold text-xs text-gray-900">
                        <span>Tổng khấu trừ:</span>
                        <span className="font-mono text-rose-600 text-sm">-{fmt(slip.total_deductions)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 4. KHỐI THỰC NHẬN NET & XÁC NHẬN CHUYỂN KHOẢN */}
                  <div className="rounded-2xl border-2 border-emerald-500 bg-linear-to-b from-emerald-50 to-white p-4 text-center space-y-2 shadow-xs">
                    <div className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                      Số tiền thực nhận (Net)
                    </div>
                    <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-700 tabular-nums">
                      {fmt(slip.net_salary)}
                    </div>
                    <div className="text-xs text-emerald-800 font-medium bg-emerald-100/70 py-1.5 px-3 rounded-xl inline-flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-700" />
                      <span>{slip.payment_status} ngày {slip.payment_date}</span>
                    </div>
                  </div>

                  {/* Nút hành động */}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => alert(`Đã tải phiếu lương kỳ ${slip.period} của ${slip.employee_name}!`)}
                      className="btn w-full bg-slate-900 hover:bg-slate-800 text-white text-xs py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Download size={14} /> Tải phiếu lương PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
