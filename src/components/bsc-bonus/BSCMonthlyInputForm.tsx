'use client'

import React, { useState, useEffect } from 'react'
import {
  DollarSign,
  Package,
  Save,
  Send,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Lock,
  Unlock,
  Calculator,
  Calendar,
} from 'lucide-react'
import { bscAdapter } from '@/lib/adapters/bsc-adapter'
import { calculateStoreBSC } from '@/lib/bsc-engine'
import type { BSCRevenueTarget } from '@/lib/bsc-types'

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
  const [targetData, setTargetData] = useState<BSCRevenueTarget | null>(null)
  const [minHoursThreshold, setMinHoursThreshold] = useState(110)
  const [profitThresholdDaily, setProfitThresholdDaily] = useState(6500000)
  const [targetMode, setTargetMode] = useState<'auto_3_6_months' | 'manual'>('auto_3_6_months')
  const [avg36MonthsDaily, setAvg36MonthsDaily] = useState(7000000)
  const [manualTargetDaily, setManualTargetDaily] = useState(8050000)
  const [actualRevenueMonthly, setActualRevenueMonthly] = useState(0)
  const [cogsBudget, setCogsBudget] = useState(0)
  const [cogsActual, setCogsActual] = useState(0)
  const [customerQrScore, setCustomerQrScore] = useState(0)
  const [hasAttpForeignBody, setHasAttpForeignBody] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    let isMounted = true
    async function loadTarget() {
      const targets = await bscAdapter.getRevenueTargets(storeId, period)
      const found = targets.find(t => t.store_id === storeId && t.period === period)
      if (isMounted) {
        if (found) {
          setTargetData(found)
          setMinHoursThreshold(found.min_hours_threshold || 110)
          setProfitThresholdDaily(found.profit_threshold_daily || 6500000)
          setTargetMode(found.target_mode || 'auto_3_6_months')
          setAvg36MonthsDaily(found.avg_3_6_months_daily || 7000000)
          setManualTargetDaily(found.manual_target_daily || found.target_daily || 8050000)
          setActualRevenueMonthly(found.actual_revenue_monthly || 0)
          setCogsBudget(found.cogs_budget || 0)
          setCogsActual(found.cogs_actual || 0)
          setHasAttpForeignBody(found.has_attp_foreign_body || false)
        } else {
          // Default initial for new periods
          setTargetData(null)
          setMinHoursThreshold(110)
          setProfitThresholdDaily(6500000)
          setTargetMode('auto_3_6_months')
          setAvg36MonthsDaily(7000000)
          setManualTargetDaily(8050000)
          setActualRevenueMonthly(0)
          setCogsBudget(0)
          setCogsActual(0)
          setHasAttpForeignBody(false)
        }
      }
    }
    loadTarget()
    return () => { isMounted = false }
  }, [storeId, period])

  const isApproved = targetData?.approval_status === 'approved_published'
  // CEO always has permission to edit even when published
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
    await bscAdapter.saveRevenueTarget(storeId, period, {
      approval_status: 'pending_ceo',
    })
    setTargetData(prev => prev ? { ...prev, approval_status: 'pending_ceo' } : null)
    setToastMessage('Đã gửi bản quyết toán BSC lên CEO duyệt!')
    onSuccess()
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleApproveCEO = async () => {
    const nowStr = new Date().toLocaleDateString('vi-VN')
    await bscAdapter.saveRevenueTarget(storeId, period, {
      approval_status: 'approved_published',
      approved_by: 'CEO Homies',
      approved_at: nowStr,
    })
    setTargetData(prev => prev ? { ...prev, approval_status: 'approved_published', approved_by: 'CEO Homies', approved_at: nowStr } : null)
    setToastMessage('CEO đã duyệt & công bố bảng thưởng BSC toàn cửa hàng!')
    onSuccess()
    setTimeout(() => setToastMessage(''), 3000)
  }

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

  const previewTargetsSource = targetData ? [targetData] : undefined
  const previewResult = calculateStoreBSC(storeId, period, previewTargetsSource)

  return (
    <div className="space-y-6 animate-fade-in w-full">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2.5 shadow-xs">
          <CheckCircle2 size={18} className="text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ─── UNIFIED COMPACT HEADER CARD (Gom gọn 3 thẻ thành 1 thẻ duy nhất) ─── */}
      <div className="card p-4 sm:p-5 rounded-2xl border border-gray-200/80 bg-white shadow-2xs space-y-3 font-['Inter']">
        {/* Hàng 1: Tiêu đề + Huy hiệu + Nút thao tác */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100/90 text-amber-900 border border-amber-200 flex items-center justify-center flex-shrink-0">
              <Calculator size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[#001D3D]">
                  Form Quyết Toán BSC Tháng — Chi Nhánh Homies
                </h3>
                {isApproved && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <Lock size={12} /> Đã Duyệt &amp; Công Bố
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Nhập các chỉ số tại các ô viền vàng → Động cơ BSC tự động phân tích &amp; tính toán số liệu kết quả.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Vùng Nhập Liệu Màu Vàng
            </span>

            {isApproved && isCEO && (
              <button
                type="button"
                onClick={handleUnlockCEO}
                className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Unlock size={14} /> Mở Khóa Chỉnh Sửa
              </button>
            )}
          </div>
        </div>

        {/* Hàng 2: Thanh phụ tích hợp Thời hạn hiệu lực & Trạng thái duyệt */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-gray-100 text-xs bg-gray-50/70 p-2.5 rounded-xl">
          <div className="flex items-center gap-2 text-blue-900 font-medium flex-wrap">
            <Calendar size={14} className="text-[#2F6FA8]" />
            <span>Mục Tiêu &amp; Mốc Hòa Vốn:</span>
            <span className="font-bold font-mono text-[#001D3D]">
              {targetData?.valid_from || '2026-07'} ➔ {targetData?.valid_to || '2026-12'}
            </span>
            <span className="text-[10px] text-blue-700 bg-white px-2 py-0.2 rounded border border-blue-200 font-semibold">
              Đồng bộ từ Cài đặt BSC
            </span>
          </div>

          {isApproved ? (
            <span className="text-[11px] text-gray-600">
              Duyệt bởi: <strong className="text-gray-900">{targetData?.approved_by || 'CEO'}</strong> ({targetData?.approved_at})
            </span>
          ) : (
            <span className="text-[11px] text-amber-700 font-medium">
              Trạng thái: Đang soạn thảo bản nháp
            </span>
          )}
        </div>
      </div>

      <form onSubmit={handleSaveDraft} className="space-y-6">
        {/* GRID 2 CỘT INPUTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-[#2F6FA8]" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">
                  1. Quyết Toán Doanh Thu Tháng
                </h4>
              </div>
              <span className="text-xs font-semibold text-gray-400 font-mono">Kỳ xét: {period}</span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Ô 1: Doanh Thu Thuần Tháng */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-gray-800 flex items-center gap-1">
                    <span>Doanh Thu Thuần Tháng (đ)</span>
                  </label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                    NHẬP TAY
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isInputDisabled}
                    value={formatNumberStr(actualRevenueMonthly)}
                    onChange={e => setActualRevenueMonthly(parseNumberStr(e.target.value))}
                    className="w-full pl-3.5 pr-12 py-2.5 min-h-[44px] rounded-xl border border-amber-300 bg-amber-50/40 text-sm font-black text-gray-900 outline-none focus:border-[#2F6FA8] focus:bg-white focus:ring-2 focus:ring-amber-200 transition disabled:opacity-60 disabled:bg-gray-100 font-mono tabular-nums"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">đ</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-500 font-semibold px-1">
                  <span>Trung bình ngày: <strong className="text-gray-900 font-mono tabular-nums">{formatVnd(actualDaily)}/ngày</strong></span>
                  <span>(Sau khi trừ hủy/giảm giá)</span>
                </div>
              </div>

              {/* Ô 2: Mốc Lợi Nhuận Hòa Vốn (Từ Setting) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-gray-800">Mốc Doanh Thu Lợi Nhuận Hòa Vốn (Ngày)</label>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    ⚙️ TỪ CÀI ĐẶT BSC
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isInputDisabled || !isCEO}
                    value={formatNumberStr(profitThresholdDaily)}
                    onChange={e => setProfitThresholdDaily(parseNumberStr(e.target.value))}
                    className="w-full pl-3.5 pr-12 py-2 min-h-[44px] rounded-xl border border-gray-300 bg-gray-50/80 text-xs font-bold text-gray-900 outline-none focus:border-[#2F6FA8] focus:bg-white transition disabled:opacity-80 font-mono tabular-nums"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">đ</span>
                </div>
                <div className="flex justify-between text-[10px] text-gray-500 px-1">
                  <span>Mốc mở quỹ thưởng 1% (Mặc định 6.5tr/ngày cấu hình trong Setting)</span>
                  {isCEO && <span className="text-[#2F6FA8] font-bold">CEO có quyền sửa</span>}
                </div>
              </div>

              {/* Ô 3: 2 TÙY CHỌN XÁC ĐỊNH TARGET DOANH THU */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-gray-900 text-xs">Phương Thức Xác Định Target Doanh Thu</label>
                  <span className="text-[10px] font-bold text-[#2F6FA8] bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md">
                    2 TÙY CHỌN
                  </span>
                </div>

                {/* 2 Nút Toggle Tùy Chọn */}
                <div className="grid grid-cols-2 gap-1.5 p-1 bg-white rounded-xl border border-gray-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setTargetMode('auto_3_6_months')}
                    disabled={isInputDisabled}
                    className={`py-2 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      targetMode === 'auto_3_6_months'
                        ? 'bg-[#2F6FA8] text-white shadow-xs'
                        : 'text-gray-600 hover:text-[#001D3D] hover:bg-gray-50'
                    }`}
                  >
                    <span>🎯 Theo TB 3-6 tháng (x115%)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetMode('manual')}
                    disabled={isInputDisabled}
                    className={`py-2 px-2 rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      targetMode === 'manual'
                        ? 'bg-[#2F6FA8] text-white shadow-xs'
                        : 'text-gray-600 hover:text-[#001D3D] hover:bg-gray-50'
                    }`}
                  >
                    <span>✍️ Tự đặt Target</span>
                  </button>
                </div>

                {/* Tùy chọn 1: Theo 3 - 6 tháng gần nhất x115% */}
                {targetMode === 'auto_3_6_months' && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-800 text-xs">Doanh Thu TB 3-6 Tháng Gần Nhất (Ngày)</span>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">
                        NHẬP TAY
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        disabled={isInputDisabled}
                        value={formatNumberStr(avg36MonthsDaily)}
                        onChange={e => setAvg36MonthsDaily(parseNumberStr(e.target.value))}
                        className="w-full pl-3.5 pr-12 py-2 min-h-[44px] rounded-xl border border-amber-300 bg-white text-xs font-bold text-gray-900 outline-none focus:border-[#2F6FA8] font-mono tabular-nums"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">đ</span>
                    </div>
                    <span className="text-[10px] text-gray-500 block px-1">
                      Hệ thống tự động tính Target: {formatVnd(avg36MonthsDaily)} × 115% = <strong className="text-[#2F6FA8] font-mono">{formatVnd(calculatedAutoTargetDaily)}/ngày</strong>
                    </span>
                  </div>
                )}

                {/* Tùy chọn 2: Tự đặt con số Target thủ công */}
                {targetMode === 'manual' && (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-purple-900 text-xs">Target Doanh Thu Ngày Tự Đặt (đ/ngày)</span>
                      <span className="text-[10px] font-bold text-purple-800 bg-purple-100 border border-purple-200 px-1.5 py-0.5 rounded">
                        TỰ ĐẶT THỦ CÔNG
                      </span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        disabled={isInputDisabled}
                        value={formatNumberStr(manualTargetDaily)}
                        onChange={e => setManualTargetDaily(parseNumberStr(e.target.value))}
                        className="w-full pl-3.5 pr-12 py-2 min-h-[44px] rounded-xl border border-purple-300 bg-white text-xs font-black text-purple-950 outline-none focus:border-purple-600 font-mono tabular-nums"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">đ</span>
                    </div>
                    <span className="text-[10px] text-purple-700 block px-1 font-semibold">
                      Quy đổi tương đương tháng: <strong className="font-mono">{formatVnd(manualTargetDaily * daysInMonth)}</strong> / tháng ({daysInMonth} ngày)
                    </span>
                  </div>
                )}
              </div>

              {/* TỰ TÍNH: Target Doanh Thu & Trạng Thái Mở */}
              <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-blue-900">Target Doanh Thu Tính BSC Áp Dụng:</span>
                  <span className="text-sm font-black text-[#2F6FA8] font-mono tabular-nums">{formatVnd(targetDaily)}/ngày</span>
                </div>
                <div className="flex justify-between items-center text-[11px] font-semibold border-t border-blue-200/60 pt-1.5">
                  <span className="text-blue-800">Tỷ lệ đạt target: <strong className="text-gray-900 font-mono tabular-nums">{targetPct}%</strong></span>
                  <span className="text-blue-800">
                    Mở thưởng: <strong className={isUnlocked ? 'text-emerald-700' : 'text-rose-600'}>{isUnlocked ? 'ĐÃ ĐẠT (MỞ QUỸ)' : 'CHƯA ĐẠT'}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CỘT 2: HAO HỤT COGS & KHÁCH HÀNG */}
          <div className="card p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">
                  2. Hao Hụt Định Mức &amp; Khách Hàng
                </h4>
              </div>
              <span className="text-xs font-semibold text-gray-400">Định mức vs Thực tế</span>
            </div>

            <div className="space-y-4 text-xs">
              {/* Ô 4: COGS Định Mức */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-gray-800">Chi Phí Nguyên Liệu Định Mức (đ)</label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                    NHẬP TAY
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isInputDisabled}
                    value={formatNumberStr(cogsBudget)}
                    onChange={e => setCogsBudget(parseNumberStr(e.target.value))}
                    className="w-full pl-3.5 pr-12 py-2 min-h-[44px] rounded-xl border border-amber-300 bg-amber-50/40 text-xs font-bold text-gray-900 outline-none focus:border-[#2F6FA8] focus:bg-white transition disabled:opacity-60 disabled:bg-gray-100 font-mono tabular-nums"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">đ</span>
                </div>
                <span className="text-[10px] text-gray-400 px-1">Tổng chi phí nguyên liệu lý thuyết theo định lượng món</span>
              </div>

              {/* Ô 5: COGS Thực Tế */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-gray-800">Chi Phí Nguyên Liệu Thực Tế Xuất Kho (đ)</label>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                    NHẬP TAY
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isInputDisabled}
                    value={formatNumberStr(cogsActual)}
                    onChange={e => setCogsActual(parseNumberStr(e.target.value))}
                    className="w-full pl-3.5 pr-12 py-2 min-h-[44px] rounded-xl border border-amber-300 bg-amber-50/40 text-xs font-bold text-gray-900 outline-none focus:border-[#2F6FA8] focus:bg-white transition disabled:opacity-60 disabled:bg-gray-100 font-mono tabular-nums"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">đ</span>
                </div>
                <div className="flex justify-between text-[11px] text-gray-600 font-semibold px-1">
                  <span>Tỷ lệ hao hụt tự tính:</span>
                  <strong className="text-emerald-700 font-black font-mono tabular-nums">{wastePct}%</strong>
                </div>
              </div>

              {/* Ô 6: Điểm QR & Toggle ATTP */}
              <div className="space-y-3 p-3.5 rounded-2xl bg-amber-50/40 border border-amber-200/80">
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-gray-800">Điểm Khảo Sát QR Khách Hàng (0 - 100đ)</label>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-md">
                      NHẬP TAY
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    disabled={isInputDisabled}
                    value={customerQrScore}
                    onChange={e => setCustomerQrScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2 min-h-[44px] rounded-xl border border-amber-300 bg-white font-bold text-gray-900 outline-none focus:border-[#2F6FA8] disabled:opacity-60 disabled:bg-gray-100 font-mono tabular-nums"
                  />
                </div>

                {/* Toggle ATTP */}
                <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer font-bold text-rose-700 min-h-[40px]">
                    <input
                      type="checkbox"
                      disabled={isInputDisabled}
                      checked={hasAttpForeignBody}
                      onChange={e => setHasAttpForeignBody(e.target.checked)}
                      className="rounded border-gray-300 text-rose-600 focus:ring-rose-500 h-4 w-4 cursor-pointer"
                    />
                    <span>Có dị vật / Vi phạm ATTP nặng</span>
                  </label>
                  {hasAttpForeignBody && (
                    <span className="text-[10px] bg-rose-100 text-rose-700 px-2.5 py-1 rounded-lg font-black border border-rose-200">
                      ÉP 1 ĐIỂM TIÊU CHÍ KHÁCH HÀNG
                    </span>
                  )}
                </div>
              </div>

              {/* Ô 7: Mốc giờ tối thiểu (Từ Setting) */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="font-bold text-gray-800">Mốc Giờ Tối Thiểu Nhận BSC (Giờ/tháng)</label>
                  <span className="text-[10px] font-bold text-blue-800 bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    ⚙️ TỪ CÀI ĐẶT BSC
                  </span>
                </div>
                <input
                  type="number"
                  disabled={isInputDisabled || !isCEO}
                  value={minHoursThreshold}
                  onChange={e => setMinHoursThreshold(Number(e.target.value))}
                  className="w-full px-3.5 py-2 min-h-[44px] rounded-xl border border-gray-300 bg-gray-50/80 text-xs font-bold text-gray-900 outline-none focus:border-[#2F6FA8] disabled:opacity-80 font-mono tabular-nums"
                />
                <div className="flex justify-between text-[10px] text-gray-500 px-1">
                  <span>Mặc định 110h/tháng (Cấu hình trong Cài Đặt Hệ Thống BSC)</span>
                  {isCEO && <span className="text-[#2F6FA8] font-bold">CEO có quyền sửa</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card p-5 sm:p-6 rounded-2xl border border-blue-100 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3.5">
            <div className="flex items-center gap-2.5">
              <Sparkles size={20} className="text-[#2F6FA8]" />
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#001D3D]">
                  Kết Quả BSC Tự Động Tính Toán &amp; Quỹ Thưởng Realtime
                </h4>
                <p className="text-xs text-gray-500 font-medium mt-0.5">Tự động cập nhật tức thì theo các số liệu màu vàng ở trên</p>
              </div>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl bg-[#001D3D] text-white text-xs font-black shadow-2xs font-mono">
              Hệ số BSC: {previewResult.coefficient_label}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tổng điểm BSC Cửa Hàng</span>
              <div className="text-2xl font-black text-[#2F6FA8] font-mono tabular-nums">{previewResult.total_bsc_score} <span className="text-xs font-normal text-gray-400">/ 5.0đ</span></div>
              <span className="text-[10px] text-gray-400 font-semibold block">Trọng số 4 tiêu chí</span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50/80 border border-gray-200/80 space-y-1">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Quỹ Thưởng Nền (1%)</span>
              <div className="text-base font-black text-gray-900 font-mono tabular-nums">{formatVnd(previewResult.base_bonus_pool)}</div>
              <span className="text-[10px] text-gray-400 font-semibold block">1% × Doanh thu thuần</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 space-y-1">
              <span className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider">Quỹ Thưởng Cửa Hàng Thật</span>
              <div className="text-base font-black text-emerald-700 font-mono tabular-nums">{formatVnd(previewResult.store_bonus_pool)}</div>
              <span className="text-[10px] text-emerald-600 font-semibold block">Quỹ Nền × Hệ số BSC</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/70 space-y-1">
              <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Phần Tiền Giữ Lại</span>
              <div className="text-base font-black text-amber-800 font-mono tabular-nums">
                {formatVnd(calculateStoreBSC(storeId, period).base_bonus_pool - calculateStoreBSC(storeId, period).store_bonus_pool)}
              </div>
              <span className="text-[10px] text-amber-700 font-semibold block">Do giảm hệ số / điểm trừ</span>
            </div>
          </div>
        </div>

        {/* ACTION BUTTONS FOR MANAGER & CEO */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          {/* Manager / CEO Save Draft */}
          {(!isApproved || isCEO) && (
            <button
              type="submit"
              className="px-5 py-2.5 min-h-[44px] rounded-xl border border-gray-300 bg-white text-gray-800 text-xs font-bold hover:bg-gray-50 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Save size={16} />
              <span>{isCEO ? 'CEO Lưu Thay Đổi Số Liệu' : 'Lưu Bản Nháp Quyết Toán'}</span>
            </button>
          )}

          {/* Manager Submit CEO */}
          {isManager && targetData?.approval_status !== 'pending_ceo' && !isApproved && (
            <button
              type="button"
              onClick={handleSubmitCEO}
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-[#2F6FA8] text-white text-xs font-bold hover:bg-[#255885] transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Send size={16} />
              <span>Gửi CEO Duyệt Quỹ Thưởng</span>
            </button>
          )}

          {/* CEO Approve & Publish */}
          {isCEO && (
            <button
              type="button"
              onClick={handleApproveCEO}
              className="px-5 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <ShieldCheck size={16} />
              <span>{isApproved ? 'CEO Cập Nhật & Công Bố Lại' : 'CEO Duyệt & Công Bố Thưởng'}</span>
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
