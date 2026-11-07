'use client'

import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingDown,
  Save,
  Send,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Lock,
  Unlock,
  Calculator,
  Upload,
  HeartHandshake,
  AlertTriangle,
} from 'lucide-react'
import { bscAdapter } from '@/lib/adapters/bsc-adapter'
import { calculateStoreBSC } from '@/lib/bsc-engine'
import type { BSCRevenueTarget } from '@/lib/bsc-types'
import { useAuthStore } from '@/store/auth-store'
import BSCMonthlyImportModal from './BSCMonthlyImportModal'

interface BSCMonthlyInputFormProps {
  storeId: string
  period: string
  isManager: boolean
  isCEO: boolean
  onSuccess: () => void
}

// Helper formatting function with thousand dots
const formatNumberStr = (val: number) => new Intl.NumberFormat('vi-VN').format(val)
const parseNumberStr = (str: string) => {
  const cleaned = str.replace(/\D/g, '')
  return cleaned ? parseInt(cleaned, 10) : 0
}

export default function BSCMonthlyInputForm({
  storeId,
  period,
  isManager,
  isCEO,
  onSuccess,
}: BSCMonthlyInputFormProps) {
  const { user } = useAuthStore()
  const [targetData, setTargetData] = useState<BSCRevenueTarget | null>(null)
  const [minHoursThreshold, setMinHoursThreshold] = useState(110)
  const [profitThresholdDaily, setProfitThresholdDaily] = useState(6500000)
  const [targetMode, setTargetMode] = useState<'auto_3_6_months' | 'manual'>('auto_3_6_months')
  const [avg36MonthsDaily, setAvg36MonthsDaily] = useState(0)
  const [manualTargetDaily, setManualTargetDaily] = useState(0)
  const [actualRevenueMonthly, setActualRevenueMonthly] = useState(0)
  const [cogsBudget, setCogsBudget] = useState(0)
  const [cogsActual, setCogsActual] = useState(0)
  const [operationErrorPoints, setOperationErrorPoints] = useState(0)
  const [hasCriticalOpError, setHasCriticalOpError] = useState(false)
  const [opErrorsCount, setOpErrorsCount] = useState(0)
  const [hasNoQr, setHasNoQr] = useState(false)
  const [customerQrScore, setCustomerQrScore] = useState(0)
  const [customerQrCount, setCustomerQrCount] = useState(0)
  const [customerReviewScore, setCustomerReviewScore] = useState(0)
  const [customerComplaintCount, setCustomerComplaintCount] = useState(0)
  const [hasAttpForeignBody, setHasAttpForeignBody] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    let isMounted = true
    async function loadTarget() {
      const [targets, opErrors] = await Promise.all([
        bscAdapter.getRevenueTargets(storeId, period),
        bscAdapter.getOperationErrors(storeId, period),
      ])
      const totalLogOpPoints = opErrors.reduce((sum, e) => sum + (e.points || 0), 0)
      const hasCriticalInLog = opErrors.some(e => Boolean(e.is_critical || e.locks_personal_bonus))
      const found = targets.find(t => t.store_id === storeId && t.period === period)
      if (isMounted) {
        setOpErrorsCount(opErrors.length)
        if (found) {
          const targetRec = found as unknown as Record<string, unknown>
          const rawTargetRev = Number(targetRec.target_revenue || 0)
          const rawActualRev = Number(targetRec.actual_revenue || 0)
          const rawBudgetCogs = Number(targetRec.budgeted_cogs || 0)
          const rawActualCogs = Number(targetRec.actual_cogs || 0)
          setTargetData(found)
          setMinHoursThreshold(found.min_hours_threshold || 110)
          setProfitThresholdDaily(found.profit_threshold_daily || 6500000)
          setTargetMode(found.target_mode || 'auto_3_6_months')
          setAvg36MonthsDaily(found.avg_3_6_months_daily || 0)
          setManualTargetDaily(found.manual_target_daily || found.target_daily || (rawTargetRev ? Math.round(rawTargetRev / 31) : 0))
          setActualRevenueMonthly(found.actual_revenue_monthly || rawActualRev || 0)
          setCogsBudget(found.cogs_budget || rawBudgetCogs || 0)
          setCogsActual(found.cogs_actual || rawActualCogs || 0)
          setOperationErrorPoints(found.operation_error_points !== undefined ? found.operation_error_points : totalLogOpPoints)
          setHasCriticalOpError(found.has_critical_op_error !== undefined ? found.has_critical_op_error : hasCriticalInLog)
          setHasNoQr(found.has_no_qr || false)
          setCustomerQrScore(found.customer_qr_score ?? 0)
          setCustomerQrCount(found.customer_qr_count ?? 0)
          setCustomerReviewScore(found.customer_review_score ?? 0)
          setCustomerComplaintCount(found.customer_complaint_count ?? 0)
          setHasAttpForeignBody(found.has_attp_foreign_body || false)
        } else {
          // Default initial for new periods
          setTargetData(null)
          setMinHoursThreshold(110)
          setProfitThresholdDaily(6500000)
          setTargetMode('auto_3_6_months')
          setAvg36MonthsDaily(0)
          setManualTargetDaily(0)
          setActualRevenueMonthly(0)
          setCogsBudget(0)
          setCogsActual(0)
          setOperationErrorPoints(totalLogOpPoints)
          setHasCriticalOpError(hasCriticalInLog)
          setHasNoQr(false)
          setCustomerQrScore(0)
          setCustomerQrCount(0)
          setCustomerReviewScore(0)
          setCustomerComplaintCount(0)
          setHasAttpForeignBody(false)
        }
      }
    }
    loadTarget()
    return () => { isMounted = false }
  }, [storeId, period])

  const isApproved = targetData?.approval_status === 'approved_published'
  const isPendingCEO = targetData?.approval_status === 'pending_ceo'
  // Form chỉ khóa khi CEO đã phê duyệt và công bố bảng thưởng chính thức (approved_published).
  // Quản lý và CEO luôn có thể nhập, điều chỉnh số liệu và gửi duyệt khi ở bản nháp hoặc đang chờ duyệt.
  const isInputDisabled = isApproved && !isCEO

  const handleUnlockCEO = async () => {
    await bscAdapter.saveRevenueTarget(storeId, period, {
      approval_status: 'draft',
      approved_by: undefined,
      approved_at: undefined,
    })
    setTargetData(prev => prev ? { ...prev, approval_status: 'draft' } : null)
    setToastMessage('Đã mở khóa quyết toán! CEO và Quản Lý có thể điều chỉnh lại số liệu.')
    onSuccess()
    setTimeout(() => setToastMessage(''), 3000)
  }

  // Dynamic Live Calculations (Tự tính realtime theo 2 option Target)
  const daysInMonth = targetData?.days_in_month || 31
  const actualDaily = Math.round(actualRevenueMonthly / daysInMonth)
  const calculatedAutoTargetDaily = Math.max(profitThresholdDaily, Math.round(avg36MonthsDaily * 1.15))
  const targetDaily = targetMode === 'manual' ? (manualTargetDaily || calculatedAutoTargetDaily) : calculatedAutoTargetDaily
  const targetMonthly = targetDaily * daysInMonth
  const targetPct = targetDaily > 0 ? ((actualDaily / targetDaily) * 100).toFixed(1) : '0'
  const isUnlocked = actualDaily >= profitThresholdDaily
  const wastePct = cogsBudget > 0 ? (((cogsActual - cogsBudget) / cogsBudget) * 100).toFixed(1) : '0'

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault()

    const payload: Partial<BSCRevenueTarget> = {
      profit_threshold_daily: profitThresholdDaily,
      target_mode: targetMode,
      avg_3_6_months_daily: avg36MonthsDaily,
      manual_target_daily: manualTargetDaily,
      target_daily: targetDaily,
      target_monthly: targetMonthly,
      actual_revenue_monthly: actualRevenueMonthly,
      actual_revenue_daily: actualDaily,
      cogs_budget: cogsBudget,
      cogs_actual: cogsActual,
      operation_error_points: operationErrorPoints,
      has_critical_op_error: hasCriticalOpError,
      has_no_qr: hasNoQr,
      customer_qr_score: customerQrScore,
      customer_qr_count: customerQrCount,
      customer_review_score: customerReviewScore,
      customer_complaint_count: customerComplaintCount,
      has_attp_foreign_body: hasAttpForeignBody,
      min_hours_threshold: minHoursThreshold,
      approval_status: targetData?.approval_status || 'draft',
    }

    await bscAdapter.saveRevenueTarget(storeId, period, payload)
    setTargetData(prev => prev ? { ...prev, ...payload } : null)

    setToastMessage(isCEO ? 'CEO đã lưu cập nhật số liệu quyết toán tháng!' : 'Đã lưu bản nháp quyết toán tháng thành công!')
    onSuccess()
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleSubmitCEO = async () => {
    const submitter = user?.full_name || 'Quản lý Huỳnh Lê Kiều Linh'
    const payload: Partial<BSCRevenueTarget> = {
      profit_threshold_daily: profitThresholdDaily,
      target_mode: targetMode,
      avg_3_6_months_daily: avg36MonthsDaily,
      manual_target_daily: manualTargetDaily,
      target_daily: targetDaily,
      target_monthly: targetMonthly,
      actual_revenue_monthly: actualRevenueMonthly,
      actual_revenue_daily: actualDaily,
      cogs_budget: cogsBudget,
      cogs_actual: cogsActual,
      operation_error_points: operationErrorPoints,
      has_critical_op_error: hasCriticalOpError,
      has_no_qr: hasNoQr,
      customer_qr_score: customerQrScore,
      customer_qr_count: customerQrCount,
      customer_review_score: customerReviewScore,
      customer_complaint_count: customerComplaintCount,
      has_attp_foreign_body: hasAttpForeignBody,
      min_hours_threshold: minHoursThreshold,
      approval_status: 'pending_ceo',
      submitted_by: submitter,
      submitted_at: new Date().toISOString(),
    }

    await bscAdapter.saveRevenueTarget(storeId, period, payload)
    setTargetData(prev => prev ? { ...prev, ...payload } : null)
    setToastMessage(`Quản lý ${submitter} đã duyệt & gửi bản quyết toán BSC lên CEO thành công!`)
    onSuccess()
    setTimeout(() => setToastMessage(''), 4000)
  }

  const handleApproveCEO = async () => {
    const res = await bscAdapter.approveBSC(storeId, period, 'approve', 'CEO Nguyễn Đức Nghĩa')
    if (res.success) {
      setTargetData(prev => prev ? { ...prev, approval_status: 'approved_published', approved_by: 'CEO Nguyễn Đức Nghĩa', approved_at: new Date().toISOString() } : null)
      setToastMessage(res.message || 'CEO đã duyệt & công bố bảng thưởng BSC toàn cửa hàng!')
      onSuccess()
      setTimeout(() => setToastMessage(''), 4000)
    }
  }

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

  const currentFormTarget: BSCRevenueTarget = {
    ...(targetData || {
      store_id: storeId,
      store_name: (storeId === 'store-001' ? 'Homies Hồ Bá Phấn' : 'Homies Chi Nhánh 429'),
      period,
      days_in_month: daysInMonth,
    }),
    profit_threshold_daily: profitThresholdDaily,
    target_mode: targetMode,
    avg_3_6_months_daily: avg36MonthsDaily,
    manual_target_daily: manualTargetDaily,
    target_daily: targetDaily,
    target_monthly: targetMonthly,
    actual_revenue_monthly: actualRevenueMonthly,
    actual_revenue_daily: actualDaily,
    is_unlocked: isUnlocked,
    cogs_budget: cogsBudget,
    cogs_actual: cogsActual,
    operation_error_points: operationErrorPoints,
    has_critical_op_error: hasCriticalOpError,
    has_no_qr: hasNoQr,
    customer_qr_score: customerQrScore,
    customer_qr_count: customerQrCount,
    customer_review_score: customerReviewScore,
    customer_complaint_count: customerComplaintCount,
    has_attp_foreign_body: hasAttpForeignBody,
    min_hours_threshold: minHoursThreshold,
  }

  const customRawMetrics = [
    {
      store_id: storeId,
      period,
      waste_percentage: Number(wastePct),
      operation_error_points: operationErrorPoints,
      customer_qr_score: hasNoQr ? 0 : customerQrScore,
      customer_qr_count: hasNoQr ? 0 : customerQrCount,
      customer_review_score: customerReviewScore,
      customer_complaint_count: customerComplaintCount,
    },
  ]

  const previewResult = calculateStoreBSC(storeId, period, [currentFormTarget], customRawMetrics)
  const revScore = previewResult.criteria_scores.find(c => c.key === 'revenue')
  const opScore = previewResult.criteria_scores.find(c => c.key === 'operation')
  const wasteScore = previewResult.criteria_scores.find(c => c.key === 'waste')
  const customerScore = previewResult.criteria_scores.find(c => c.key === 'customer')

  return (
    <div className="space-y-2.5 animate-fade-in w-full text-xs font-['Inter']">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── SLIM TOP TOOLBAR (Thay thế cho Banner to cồng kềnh) ─── */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-white border border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-900 border border-amber-200 flex items-center justify-center flex-shrink-0 font-bold">
            <Calculator size={14} />
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold text-[#001D3D]">Form Nhập Tính BSC Tháng</h3>
            <span className="text-[11px] text-gray-500 font-semibold font-mono">({period})</span>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 hidden sm:inline-flex items-center gap-1">
              ⚡ Tự động hóa iPOS &amp; IVT
            </span>
            {isApproved && (
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                <Lock size={10} /> Đã Duyệt &amp; Công Bố
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
            title="Nạp file Excel/CSV hoặc nhập nhanh"
          >
            <Upload size={12} className="text-[#2F6FA8]" />
            <span>Nạp Excel / Nhập Nhanh</span>
          </button>

          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md hidden md:inline-flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Ô vàng: Nhập tay
          </span>

          {isApproved && isCEO && (
            <button
              type="button"
              onClick={handleUnlockCEO}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition flex items-center gap-1 cursor-pointer"
            >
              <Unlock size={12} /> Mở Khóa
            </button>
          )}
        </div>
      </div>

      <form onSubmit={handleSaveDraft}>
        {/* ─── BỐ CỤC CHÍNH 2 CỘT (7 CỘT TRÁI - 5 CỘT PHẢI): VỪA KHÍT 1 MÀN HÌNH ─── */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-2.5 items-start">
          {/* CỘT TRÁI (7 cols): LƯỚI 2x2 CỦA 4 TRỤ CỘT BSC */}
          <div className="xl:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* TRỤ 1: DOANH THU (40% BSC) */}
            <div className="p-3 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <DollarSign size={14} className="text-[#2F6FA8]" />
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#001D3D]">
                    1. Doanh Thu Thực Tế
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                  40% (Tối đa 2.0đ)
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[11px] font-bold text-gray-800">Doanh Thu Thuần Tháng (đ):</label>
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded">NHẬP TAY</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={isInputDisabled}
                      value={formatNumberStr(actualRevenueMonthly)}
                      onChange={e => setActualRevenueMonthly(parseNumberStr(e.target.value))}
                      className="w-full pl-2.5 pr-8 py-1 h-8 rounded-lg border border-amber-300 bg-amber-50/40 text-xs font-black text-gray-900 outline-none focus:border-[#2F6FA8] focus:bg-white font-mono tabular-nums"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">đ</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium mt-0.5 flex justify-between">
                    <span>TB: <strong className="text-gray-900 font-mono">{formatVnd(actualDaily)}/ngày</strong></span>
                    <span>(Sau trừ hủy/giảm)</span>
                  </div>
                </div>

                <div className="pt-0.5">
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[11px] font-semibold text-gray-700">Mốc Hòa Vốn (Ngày):</label>
                    <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1 py-0.2 rounded">⚙️ SETTING</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={isInputDisabled || !isCEO}
                      value={formatNumberStr(profitThresholdDaily)}
                      onChange={e => setProfitThresholdDaily(parseNumberStr(e.target.value))}
                      className="w-full pl-2.5 pr-8 py-1 h-7.5 rounded-lg border border-gray-300 bg-gray-50/80 text-[11px] font-bold text-gray-900 outline-none focus:border-[#2F6FA8] font-mono tabular-nums"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">đ</span>
                  </div>
                </div>

                {/* Target Mode Toggle & Input */}
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-200/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-gray-700">Cách Đặt Target:</span>
                    <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-gray-200">
                      <button
                        type="button"
                        onClick={() => setTargetMode('auto_3_6_months')}
                        disabled={isInputDisabled || !isCEO}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                          targetMode === 'auto_3_6_months' ? 'bg-[#2F6FA8] text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        TB 3-6th (x115%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setTargetMode('manual')}
                        disabled={isInputDisabled || !isCEO}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition cursor-pointer ${
                          targetMode === 'manual' ? 'bg-[#2F6FA8] text-white' : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        Tự đặt
                      </button>
                    </div>
                  </div>

                  {targetMode === 'auto_3_6_months' ? (
                    <div>
                      <div className="flex justify-between items-center text-[10px] mb-0.5">
                        <span className="text-gray-600 font-medium">Doanh thu TB 3-6 tháng (đ):</span>
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1 rounded">NHẬP TAY</span>
                      </div>
                      <input
                        type="text"
                        disabled={isInputDisabled || !isCEO}
                        value={formatNumberStr(avg36MonthsDaily)}
                        onChange={e => setAvg36MonthsDaily(parseNumberStr(e.target.value))}
                        className="w-full px-2 py-0.5 h-7 rounded border border-amber-300 bg-amber-50/40 text-[11px] font-bold text-gray-900 font-mono tabular-nums"
                      />
                      <div className="text-[10px] text-gray-600 font-medium mt-0.5">
                        Target tính: <strong className="text-gray-900 font-mono">{formatVnd(targetDaily)}/ngày</strong>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between items-center text-[10px] mb-0.5">
                        <span className="text-gray-600 font-medium">Target tự đặt (ngày):</span>
                        <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1 rounded">NHẬP TAY</span>
                      </div>
                      <input
                        type="text"
                        disabled={isInputDisabled || !isCEO}
                        value={formatNumberStr(manualTargetDaily)}
                        onChange={e => setManualTargetDaily(parseNumberStr(e.target.value))}
                        className="w-full px-2 py-0.5 h-7 rounded border border-amber-300 bg-amber-50/40 text-[11px] font-bold text-gray-900 font-mono tabular-nums"
                      />
                    </div>
                  )}
                </div>

                {/* Realtime Revenue Footer */}
                <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200/70 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-900">
                    Đạt {targetPct}% Target:
                  </span>
                  <span className="text-xs font-bold text-[#2F6FA8] font-mono">
                    {revScore?.converted_score ?? 0}/5.0đ
                    <span className="text-[10px] text-blue-700 ml-1">
                      (+{(revScore?.weighted_score ?? 0).toFixed(2)}đ)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* TRỤ 2: HAO HỤT COGS (20% BSC) */}
            <div className="p-3 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <TrendingDown size={14} className="text-emerald-600" />
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#001D3D]">
                    2. Hao Hụt COGS
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                  20% (Tối đa 1.0đ)
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[11px] font-bold text-gray-800">COGS Định Mức (đ):</label>
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded">NHẬP TAY</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={isInputDisabled}
                      value={formatNumberStr(cogsBudget)}
                      onChange={e => setCogsBudget(parseNumberStr(e.target.value))}
                      className="w-full pl-2.5 pr-8 py-1 h-8 rounded-lg border border-amber-300 bg-amber-50/40 text-xs font-black text-gray-900 outline-none focus:border-[#2F6FA8] font-mono tabular-nums"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">đ</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[11px] font-bold text-gray-800">COGS Thực Tế (đ):</label>
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded">NHẬP TAY</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      disabled={isInputDisabled}
                      value={formatNumberStr(cogsActual)}
                      onChange={e => setCogsActual(parseNumberStr(e.target.value))}
                      className="w-full pl-2.5 pr-8 py-1 h-8 rounded-lg border border-amber-300 bg-amber-50/40 text-xs font-black text-gray-900 outline-none focus:border-[#2F6FA8] font-mono tabular-nums"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">đ</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-gray-50 border border-gray-200/70 text-[10px] text-gray-500 font-medium space-y-0.5">
                  <div className="flex justify-between font-bold text-gray-700">
                    <span>Thang Điểm Chuẩn COGS:</span>
                  </div>
                  <div>≤2% (5đ) | ≤3% (4đ) | ≤4% (3đ) | ≤5% (2đ) | &gt;5% (1đ)</div>
                </div>

                {/* Realtime COGS Footer */}
                <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-200/70 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-950">
                    Hao hụt: <strong className="font-mono">{wastePct}%</strong>
                  </span>
                  <span className="text-xs font-bold text-emerald-800 font-mono">
                    {wasteScore?.converted_score ?? 5}/5.0đ
                    <span className="text-[10px] text-emerald-600 ml-1">
                      (+{(wasteScore?.weighted_score ?? 1.0).toFixed(2)}đ)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* TRỤ 3: LỖI VẬN HÀNH SOP (25% BSC) */}
            <div className="p-3 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-600" />
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#001D3D]">
                    3. Lỗi Vận Hành SOP
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded">
                  25% (Tối đa 1.25đ)
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="flex justify-between items-center mb-0.5">
                    <label className="text-[11px] font-bold text-gray-800">Tổng Điểm Lỗi Vận Hành (Điểm):</label>
                    <span className="text-[9px] font-bold text-amber-800 bg-amber-100 px-1 py-0.2 rounded">TỰ TÍNH / SỬA</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      disabled={isInputDisabled}
                      value={operationErrorPoints}
                      onChange={e => setOperationErrorPoints(Number(e.target.value))}
                      className="w-full pl-2.5 pr-12 py-1 h-8 rounded-lg border border-amber-300 bg-amber-50/40 text-xs font-black text-gray-900 outline-none focus:border-[#2F6FA8] font-mono tabular-nums"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">điểm</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                    Tự tính từ: <strong className="text-gray-900 font-mono">{opErrorsCount} sự cố nhật ký</strong>
                  </div>
                </div>

                {/* Khóa An Toàn: Lỗi Nghiêm Trọng */}
                <div className="p-2 rounded-lg bg-rose-50/60 border border-rose-200/80 flex items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-800 text-[11px]">
                    <input
                      type="checkbox"
                      disabled={isInputDisabled}
                      checked={hasCriticalOpError}
                      onChange={e => setHasCriticalOpError(e.target.checked)}
                      className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>Lỗi đặc biệt nghiêm trọng (Khóa 0đ)</span>
                  </label>
                  {hasCriticalOpError && (
                    <span className="text-[9px] bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded font-bold">KHÓA 0đ</span>
                  )}
                </div>

                <div className="p-2 rounded-lg bg-gray-50 border border-gray-200/70 text-[10px] text-gray-500 font-medium space-y-0.5">
                  <div className="flex justify-between font-bold text-gray-700">
                    <span>Thang Điểm Lỗi Vận Hành:</span>
                  </div>
                  <div>≤4đ (5đ) | ≤8đ (4đ) | ≤12đ (3đ) | ≤15đ (2đ) | &gt;15đ (1đ)</div>
                </div>

                {/* Realtime Operation Footer */}
                <div className="p-2 rounded-lg bg-amber-50/70 border border-amber-200/70 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-950">
                    {operationErrorPoints}đ lỗi:
                  </span>
                  <span className="text-xs font-bold text-amber-900 font-mono">
                    {opScore?.converted_score ?? 5}/5.0đ
                    <span className="text-[10px] text-amber-700 ml-1">
                      (+{(opScore?.weighted_score ?? 1.25).toFixed(2)}đ)
                    </span>
                  </span>
                </div>
              </div>
            </div>

            {/* TRỤ 4: KHÁCH HÀNG & DỊCH VỤ (15% BSC) */}
            <div className="p-3 rounded-xl border border-gray-200/80 bg-white shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                <div className="flex items-center gap-1.5">
                  <HeartHandshake size={14} className="text-[#2F6FA8]" />
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#001D3D]">
                    4. Khách Hàng &amp; Dịch Vụ
                  </h4>
                </div>
                <span className="text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-1.5 py-0.2 rounded">
                  15% (Tối đa 0.75đ)
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {/* Tùy chọn: Không làm khảo sát QR */}
                <div className={`p-1.5 px-2 rounded-lg border transition-all ${
                  hasNoQr ? 'bg-blue-50/80 border-blue-200 text-blue-950' : 'bg-gray-50/70 border-gray-200 text-gray-800'
                }`}>
                  <label className="flex items-center justify-between cursor-pointer gap-1.5">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        disabled={isInputDisabled}
                        checked={hasNoQr}
                        onChange={e => setHasNoQr(e.target.checked)}
                        className="rounded border-gray-300 text-[#2F6FA8] focus:ring-[#2F6FA8] h-3.5 w-3.5 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold">Tháng này không làm QR</span>
                    </div>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                      hasNoQr ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {hasNoQr ? '100% CSKH' : '50% QR - 50% CSKH'}
                    </span>
                  </label>
                </div>

                {/* 2 Cột con mini: QR & CSKH */}
                <div className="grid grid-cols-2 gap-2">
                  {/* QR Box */}
                  <div className={`p-2 rounded-lg border space-y-1.5 ${
                    hasNoQr ? 'bg-gray-50/60 border-dashed border-gray-300 opacity-60' : 'bg-amber-50/40 border-amber-200/70'
                  }`}>
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-700">
                      <span>QR Feedback</span>
                      <span className="text-[9px] text-amber-800">{hasNoQr ? 'TẮT' : '50%'}</span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      disabled={isInputDisabled || hasNoQr}
                      value={hasNoQr ? 0 : customerQrScore}
                      onChange={e => setCustomerQrScore(Number(e.target.value))}
                      placeholder="Điểm (0-100)"
                      className="w-full px-2 py-0.5 h-7 rounded border border-gray-300 bg-white text-[11px] font-bold text-gray-900 font-mono tabular-nums disabled:bg-gray-100"
                    />
                    <input
                      type="number"
                      min={0}
                      disabled={isInputDisabled || hasNoQr}
                      value={hasNoQr ? 0 : customerQrCount}
                      onChange={e => setCustomerQrCount(Number(e.target.value))}
                      placeholder="Số mẫu (≥30)"
                      className="w-full px-2 py-0.5 h-7 rounded border border-gray-300 bg-white text-[11px] font-bold text-gray-900 font-mono tabular-nums disabled:bg-gray-100"
                    />
                  </div>

                  {/* CSKH Box */}
                  <div className={`p-2 rounded-lg border space-y-1.5 ${
                    hasNoQr ? 'bg-emerald-50/50 border-emerald-300' : 'bg-amber-50/40 border-amber-200/70'
                  }`}>
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-700">
                      <span>Đánh Giá CSKH</span>
                      <span className={`text-[9px] ${hasNoQr ? 'text-emerald-700 font-black' : 'text-amber-800'}`}>
                        {hasNoQr ? '100%' : '50%'}
                      </span>
                    </div>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      disabled={isInputDisabled}
                      value={customerReviewScore}
                      onChange={e => setCustomerReviewScore(Number(e.target.value))}
                      placeholder="Điểm (0-100)"
                      className="w-full px-2 py-0.5 h-7 rounded border border-amber-300 bg-white text-[11px] font-bold text-gray-900 font-mono tabular-nums"
                    />
                    <input
                      type="number"
                      min={0}
                      disabled={isInputDisabled}
                      value={customerComplaintCount}
                      onChange={e => setCustomerComplaintCount(Number(e.target.value))}
                      placeholder="Số khiếu nại"
                      className="w-full px-2 py-0.5 h-7 rounded border border-amber-300 bg-white text-[11px] font-bold text-gray-900 font-mono tabular-nums"
                    />
                  </div>
                </div>

                {/* Checkbox Dị Vật ATTP */}
                <div className="p-1.5 px-2 rounded-lg bg-rose-50/60 border border-rose-200/80 flex items-center justify-between gap-1.5">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-800 text-[10px]">
                    <input
                      type="checkbox"
                      disabled={isInputDisabled}
                      checked={hasAttpForeignBody}
                      onChange={e => setHasAttpForeignBody(e.target.checked)}
                      className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span>Có dị vật / Vi phạm ATTP (Ép 1đ)</span>
                  </label>
                  {hasAttpForeignBody && (
                    <span className="text-[9px] bg-rose-100 text-rose-700 px-1 py-0.2 rounded font-bold">ÉP 1Đ</span>
                  )}
                </div>

                {/* Realtime Customer Footer */}
                <div className="p-2 rounded-lg bg-blue-50/70 border border-blue-200/70 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-900 truncate">
                    {hasNoQr ? '100% CSKH' : 'QR + CSKH'}:
                  </span>
                  <span className="text-xs font-bold text-[#2F6FA8] font-mono">
                    {customerScore?.converted_score ?? 5}/5.0đ
                    <span className="text-[10px] text-blue-700 ml-1">
                      (+{(customerScore?.weighted_score ?? 0.75).toFixed(2)}đ)
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI (5 cols): BẢNG TỔNG HỢP KẾT QUẢ BSC REALTIME & NÚT THAO TÁC */}
          <div className="xl:col-span-5 space-y-2.5">
            {/* THẺ 1: TỔNG HỢP KPI REALTIME (SANG TRỌNG) */}
            <div className="p-3.5 rounded-2xl bg-[#001D3D] text-white shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Kết Quả BSC Realtime
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-md bg-white/10 text-white font-mono text-[10px] font-bold">
                  {previewResult.coefficient_label}
                </span>
              </div>

              {/* Điểm tổng số to */}
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider block">
                    Tổng Điểm BSC Cửa Hàng:
                  </span>
                  <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">
                    {previewResult.total_bsc_score}{' '}
                    <span className="text-xs font-normal text-gray-300">/ 5.0đ</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-semibold text-gray-300 uppercase tracking-wider block">
                    Hệ Số Thưởng:
                  </span>
                  <div className="text-lg font-black text-emerald-400 font-mono">
                    {Math.round(previewResult.bsc_coefficient * 100)}% Quỹ Nền
                  </div>
                </div>
              </div>

              {/* 3 Chỉ số tài chính */}
              <div className="grid grid-cols-3 gap-2 pt-1 border-t border-white/10 text-[11px]">
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 space-y-0.5">
                  <span className="text-[9px] text-gray-300 block">Quỹ Nền (1%):</span>
                  <div className="font-bold font-mono text-white text-xs truncate">
                    {formatVnd(previewResult.base_bonus_pool)}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 space-y-0.5">
                  <span className="text-[9px] text-emerald-300 block">Quỹ Thưởng Thật:</span>
                  <div className="font-black font-mono text-emerald-300 text-xs truncate">
                    {formatVnd(previewResult.store_bonus_pool)}
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-400/30 space-y-0.5">
                  <span className="text-[9px] text-amber-300 block">Tiền Giữ Lại:</span>
                  <div className="font-bold font-mono text-amber-300 text-xs truncate">
                    {formatVnd(previewResult.base_bonus_pool - previewResult.store_bonus_pool)}
                  </div>
                </div>
              </div>
            </div>

            {/* THẺ 2: TỶ TRỌNG ĐÓNG GÓP 4 TRỤ CỘT (MINI PROGRESS BARS) */}
            <div className="p-3 rounded-2xl bg-white border border-gray-200/80 shadow-2xs space-y-2">
              <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                <span className="text-[11px] font-bold text-gray-800 uppercase tracking-wider">
                  Đóng Góp 4 TrỤ Cột
                </span>
                <span className="text-[10px] text-gray-500 font-mono font-semibold">Tối đa 5.0đ</span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                {/* 1. Doanh thu */}
                <div className="space-y-0.5">
                  <div className="flex justify-between font-semibold text-gray-700">
                    <span>1. Doanh Thu (40%)</span>
                    <span className="font-mono font-bold text-[#2F6FA8]">
                      {(revScore?.weighted_score ?? 0).toFixed(2)} / 2.00đ
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-[#2F6FA8] h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, ((revScore?.weighted_score ?? 0) / 2.0) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 2. Hao hụt */}
                <div className="space-y-0.5">
                  <div className="flex justify-between font-semibold text-gray-700">
                    <span>2. Hao Hụt COGS (20%)</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {(wasteScore?.weighted_score ?? 0).toFixed(2)} / 1.00đ
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, ((wasteScore?.weighted_score ?? 0) / 1.0) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 3. Vận hành */}
                <div className="space-y-0.5">
                  <div className="flex justify-between font-semibold text-gray-700">
                    <span>3. Lỗi Vận Hành (25%)</span>
                    <span className="font-mono font-bold text-amber-600">
                      {(opScore?.weighted_score ?? 0).toFixed(2)} / 1.25đ
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-amber-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, ((opScore?.weighted_score ?? 0) / 1.25) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* 4. Khách hàng */}
                <div className="space-y-0.5">
                  <div className="flex justify-between font-semibold text-gray-700">
                    <span>4. Khách Hàng (15%)</span>
                    <span className="font-mono font-bold text-blue-600">
                      {(customerScore?.weighted_score ?? 0).toFixed(2)} / 0.75đ
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, ((customerScore?.weighted_score ?? 0) / 0.75) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* THẺ 3: ĐIỀU KIỆN NHÂN SỰ & THAO TÁC PHÊ DUYỆT */}
            <div className="p-3 rounded-2xl bg-white border border-gray-200/80 shadow-2xs space-y-2.5">
              {/* Mốc giờ xét thưởng */}
              <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50 border border-gray-200/70">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-[#2F6FA8]" />
                  <span className="text-[11px] font-bold text-gray-800">Mốc giờ xét thưởng BSC:</span>
                </div>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    disabled={isInputDisabled || !isCEO}
                    value={minHoursThreshold}
                    onChange={e => setMinHoursThreshold(Number(e.target.value))}
                    className="w-16 px-1.5 py-0.5 h-7 rounded border border-gray-300 bg-white text-xs font-bold text-gray-900 font-mono text-center outline-none focus:border-[#2F6FA8]"
                  />
                  <span className="text-[10px] text-gray-500 font-semibold">h/tháng</span>
                </div>
              </div>

              {/* Trạng thái gửi duyệt */}
              {targetData?.approval_status === 'pending_ceo' && (
                <div className="flex items-center gap-2 p-2 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Đã gửi duyệt: Đang chờ CEO phê duyệt</span>
                </div>
              )}

              {/* Action Buttons: Đầy đủ nút bấm ngay tầm mắt */}
              <div className="flex flex-col gap-2 pt-0.5">
                {/* Save Draft */}
                {(!isApproved || isCEO) && (
                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Save size={14} />
                    <span>{isCEO ? 'CEO Lưu Thay Đổi Số Liệu' : 'Lưu Bản Nháp Tính BSC'}</span>
                  </button>
                )}

                {/* Submit CEO */}
                {isManager && !isApproved && (
                  <button
                    type="button"
                    onClick={handleSubmitCEO}
                    className="w-full py-2 px-3 rounded-xl bg-[#2F6FA8] hover:bg-[#255885] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <Send size={14} />
                    <span>{isPendingCEO ? 'Cập Nhật & Gửi Lại CEO' : 'Quản Lý Duyệt & Gửi CEO Phê Duyệt'}</span>
                  </button>
                )}

                {/* CEO Approve */}
                {isCEO && (
                  <button
                    type="button"
                    onClick={handleApproveCEO}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <ShieldCheck size={14} />
                    <span>{isApproved ? 'CEO Cập Nhật & Công Bố Lại' : 'CEO Duyệt & Công Bố Thưởng'}</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* Modal Nạp File Quyết Toán Tháng */}
      <BSCMonthlyImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        storeId={storeId}
        storeName={targetData?.store_name || 'Homies Cửa Hàng'}
        period={period}
        onSuccess={onSuccess}
      />
    </div>
  )
}
