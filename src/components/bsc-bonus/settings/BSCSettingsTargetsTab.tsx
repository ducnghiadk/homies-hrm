'use client'

import React, { useState } from 'react'
import {
  Building2,
  Save,
  Rocket,
  Sparkles,
} from 'lucide-react'
import { bscAdapter } from '@/lib/adapters/bsc-adapter'

interface BSCSettingsTargetsTabProps {
  selectedStoreId: string
  setSelectedStoreId: (id: string) => void
  selectedPeriod: string
  setSelectedPeriod: (period: string) => void
  profitThresholdDaily: number
  setProfitThresholdDaily: (val: number) => void
  targetMode?: 'auto_3_6_months' | 'manual'
  setTargetMode?: (mode: 'auto_3_6_months' | 'manual') => void
  avg36MonthsDaily: number
  setAvg36MonthsDaily: (val: number) => void
  manualTargetDaily?: number
  setManualTargetDaily?: (val: number) => void
  minHoursThreshold: number
  setMinHoursThreshold: (val: number) => void
  isCEOOrHR: boolean
  onNotify: (msg: string) => void
}

interface MonthlyTargetRoadmapRow {
  period: string
  label: string
  phase_badge: string
  phase_color: string
  profit_threshold_daily: number
  target_daily: number
  leniency_pct: number
}

export default function BSCSettingsTargetsTab({
  selectedStoreId,
  setSelectedStoreId,
  selectedPeriod,
  profitThresholdDaily,
  setProfitThresholdDaily,
  targetMode = 'auto_3_6_months',
  setTargetMode,
  avg36MonthsDaily,
  setAvg36MonthsDaily,
  manualTargetDaily = 8050000,
  setManualTargetDaily,
  minHoursThreshold,
  setMinHoursThreshold,
  isCEOOrHR,
  onNotify,
}: BSCSettingsTargetsTabProps) {
  const [periodScope, setPeriodScope] = useState<'range_months' | 'single_month' | 'progressive_roadmap'>('progressive_roadmap')

  // Bảng Lộ Trình Tinh Gọn (Lean)
  const [monthlyRoadmap, setMonthlyRoadmap] = useState<MonthlyTargetRoadmapRow[]>([
    {
      period: '2026-07',
      label: 'T07/2026',
      phase_badge: 'GĐ 1: Làm Quen',
      phase_color: 'bg-amber-50 text-amber-900 border-amber-200',
      profit_threshold_daily: 6000000,
      target_daily: 7000000,
      leniency_pct: 50,
    },
    {
      period: '2026-08',
      label: 'T08/2026',
      phase_badge: 'GĐ 2: Tăng Tốc',
      phase_color: 'bg-blue-50 text-[#2F6FA8] border-blue-200',
      profit_threshold_daily: 6500000,
      target_daily: 7500000,
      leniency_pct: 20,
    },
    {
      period: '2026-09',
      label: 'T09/2026',
      phase_badge: 'GĐ 3: Chuẩn Hóa',
      phase_color: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      profit_threshold_daily: 6500000,
      target_daily: 8000000,
      leniency_pct: 0,
    },
    {
      period: '2026-10',
      label: 'T10/2026',
      phase_badge: 'GĐ 4: Duy Trì',
      phase_color: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      profit_threshold_daily: 6500000,
      target_daily: 8200000,
      leniency_pct: 0,
    },
    {
      period: '2026-11',
      label: 'T11/2026',
      phase_badge: 'GĐ 5: Bứt Phá',
      phase_color: 'bg-purple-50 text-purple-800 border-purple-200',
      profit_threshold_daily: 6500000,
      target_daily: 8500000,
      leniency_pct: 0,
    },
    {
      period: '2026-12',
      label: 'T12/2026',
      phase_badge: 'GĐ 6: Mùa Lễ Hội',
      phase_color: 'bg-rose-50 text-rose-800 border-rose-200',
      profit_threshold_daily: 6500000,
      target_daily: 9000000,
      leniency_pct: 0,
    },
  ])

  const formatVnd = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

  const formatShortVnd = (amount: number) => {
    if (amount >= 1000000) return `${(amount / 1000000).toFixed(1).replace('.0', '')} tr`
    return `${amount} đ`
  }

  const calculatedAutoTargetDaily = Math.max(profitThresholdDaily, Math.round(avg36MonthsDaily * 1.15))
  const currentTargetDaily = targetMode === 'manual' ? (manualTargetDaily || calculatedAutoTargetDaily) : calculatedAutoTargetDaily

  const handleUpdateRoadmapRow = <K extends keyof MonthlyTargetRoadmapRow>(
    period: string,
    field: K,
    value: MonthlyTargetRoadmapRow[K]
  ) => {
    setMonthlyRoadmap(prev =>
      prev.map(row => (row.period === period ? { ...row, [field]: value } : row))
    )
  }

  const applyPresetGentle = () => {
    setMonthlyRoadmap(prev =>
      prev.map((r, i) => ({
        ...r,
        profit_threshold_daily: i === 0 ? 6000000 : 6500000,
        target_daily: 7000000 + i * 400000,
        leniency_pct: i === 0 ? 50 : i === 1 ? 20 : 0,
      }))
    )
    onNotify('Đã áp dụng mẫu Khởi Động Nhẹ Nhàng (Hòa vốn 6.0tr ➔ 6.5tr)!')
  }

  const applyPresetAggressive = () => {
    setMonthlyRoadmap(prev =>
      prev.map((r, i) => ({
        ...r,
        profit_threshold_daily: 6500000,
        target_daily: 7500000 + i * 500000,
        leniency_pct: i === 0 ? 30 : 0,
      }))
    )
    onNotify('Đã áp dụng mẫu Tăng Trưởng Nhanh (Target 7.5tr ➔ 10.0tr)!')
  }

  const handleSaveStoreConfig = async (e: React.FormEvent) => {
    e.preventDefault()

    if (periodScope === 'progressive_roadmap') {
      for (const item of monthlyRoadmap) {
        await bscAdapter.saveRevenueTarget(selectedStoreId, item.period, {
          profit_threshold_daily: item.profit_threshold_daily,
          target_mode: 'manual',
          manual_target_daily: item.target_daily,
          target_daily: item.target_daily,
          target_monthly: item.target_daily * 31,
          min_hours_threshold: Number(minHoursThreshold),
          target_period_scope: 'single_month',
          valid_from: item.period,
          valid_to: item.period,
        })
      }
      onNotify(`Đã lưu Lộ Trình 6 Tháng cho ${selectedStoreId === 'store-001' ? 'Homies Hồ Bá Phấn' : 'Homies Chi Nhánh 429'}!`)
      return
    }

    await bscAdapter.saveRevenueTarget(selectedStoreId, selectedPeriod, {
      profit_threshold_daily: Number(profitThresholdDaily),
      target_mode: targetMode,
      avg_3_6_months_daily: Number(avg36MonthsDaily),
      manual_target_daily: Number(manualTargetDaily),
      target_daily: currentTargetDaily,
      target_monthly: currentTargetDaily * 31,
      min_hours_threshold: Number(minHoursThreshold),
      valid_from: selectedPeriod,
      valid_to: selectedPeriod,
      target_period_scope: periodScope,
    })

    onNotify(`Đã lưu cấu hình mục tiêu BSC!`)
  }

  const totalRoadmapRevenue = monthlyRoadmap.reduce((sum, r) => sum + r.target_daily * 31, 0)
  const totalRoadmapPool = Math.round(totalRoadmapRevenue * 0.01)

  return (
    <div className="space-y-4 animate-fade-in text-xs font-['Inter']">
      <form onSubmit={handleSaveStoreConfig} className="p-4 sm:p-5 rounded-2xl border border-gray-200/90 bg-white shadow-xs space-y-4">
        {/* Header Bar Gọn Gàng (Lean Toolbar) */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 border border-emerald-200">
              <Building2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#001D3D] flex items-center gap-2">
                <span>Cấu Hình Mốc Doanh Thu &amp; Lộ Trình Chi Nhánh</span>
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">Thiết lập mốc hòa vốn và target doanh thu trực tiếp cho cơ sở</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedStoreId}
              onChange={e => setSelectedStoreId(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-800 text-xs outline-none focus:border-[#2F6FA8]"
            >
              <option value="store-001">Homies Hồ Bá Phấn</option>
              <option value="store-002">Homies Chi Nhánh 429</option>
            </select>

            <select
              value={periodScope}
              onChange={e => setPeriodScope(e.target.value as 'range_months' | 'single_month' | 'progressive_roadmap')}
              className="px-2.5 py-1.5 rounded-xl border border-[#2F6FA8]/40 bg-blue-50/50 font-bold text-[#2F6FA8] text-xs outline-none focus:border-[#2F6FA8]"
            >
              <option value="progressive_roadmap">🚀 Lộ Trình 6 Tháng (T07 ➔ T12)</option>
              <option value="range_months">Cố định 1 mốc cả kỳ</option>
              <option value="single_month">Chỉ riêng tháng hiện tại ({selectedPeriod})</option>
            </select>

            {periodScope === 'progressive_roadmap' && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={applyPresetGentle}
                  className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100 transition cursor-pointer flex items-center gap-1"
                  title="Hạ hòa vốn 6.0tr tháng đầu, giảm 50% điểm phạt"
                >
                  <Sparkles size={11} className="text-amber-600" />
                  <span>Mẫu Khởi Động Nhẹ</span>
                </button>
                <button
                  type="button"
                  onClick={applyPresetAggressive}
                  className="px-2 py-1.5 text-[11px] font-bold rounded-lg bg-blue-50 border border-blue-200 text-[#2F6FA8] hover:bg-blue-100 transition cursor-pointer flex items-center gap-1"
                >
                  <Rocket size={11} />
                  <span>Mẫu Tăng Trưởng</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* BẢNG LỘ TRÌNH LEAN — SIÊU GỌN, KHÔNG CUỘN CHUỘT          */}
        {/* ══════════════════════════════════════════════════════════ */}
        {periodScope === 'progressive_roadmap' ? (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200 text-[11px]">
                    <th className="py-2.5 px-3">Tháng &amp; Giai Đoạn</th>
                    <th className="py-2.5 px-3">Mốc Hòa Vốn (đ/ngày)</th>
                    <th className="py-2.5 px-3">Target Doanh Thu (đ/ngày)</th>
                    <th className="py-2.5 px-3">Target Cả Tháng</th>
                    <th className="py-2.5 px-3">Chính Sách Nới Lỏng Lỗi</th>
                    <th className="py-2.5 px-3 text-right">Quỹ Thưởng 1%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {monthlyRoadmap.map(row => {
                    const monthlyTarget = row.target_daily * 31
                    const monthlyBonusPool = Math.round(monthlyTarget * 0.01)

                    return (
                      <tr key={row.period} className="hover:bg-blue-50/20 transition">
                        {/* Tháng & Giai đoạn */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#001D3D] font-mono">{row.label}</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${row.phase_color}`}>
                              {row.phase_badge}
                            </span>
                          </div>
                        </td>

                        {/* Mốc hòa vốn */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              step={100000}
                              value={row.profit_threshold_daily}
                              onChange={e => handleUpdateRoadmapRow(row.period, 'profit_threshold_daily', Number(e.target.value))}
                              className="w-28 py-1 px-2 rounded-lg border border-amber-200 bg-amber-50/40 font-mono font-bold text-amber-950 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                            />
                            <span className="text-[10px] text-gray-400 font-mono">
                              (~{formatShortVnd(row.profit_threshold_daily * 31)})
                            </span>
                          </div>
                        </td>

                        {/* Target Doanh Thu Ngày */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <input
                            type="number"
                            step={100000}
                            value={row.target_daily}
                            onChange={e => handleUpdateRoadmapRow(row.period, 'target_daily', Number(e.target.value))}
                            className="w-28 py-1 px-2 rounded-lg border border-blue-200 bg-blue-50/40 font-mono font-bold text-[#2F6FA8] text-xs focus:bg-white focus:border-[#2F6FA8] focus:outline-none"
                          />
                        </td>

                        {/* Target Cả Tháng */}
                        <td className="py-2 px-3 whitespace-nowrap font-mono font-bold text-gray-800">
                          {formatShortVnd(monthlyTarget)}
                        </td>

                        {/* Chính sách nới lỏng lỗi (Gọn gàng, loại bỏ <15p khó hiểu) */}
                        <td className="py-2 px-3 whitespace-nowrap">
                          <select
                            value={row.leniency_pct}
                            onChange={e => handleUpdateRoadmapRow(row.period, 'leniency_pct', Number(e.target.value))}
                            className="py-1 px-2 rounded-lg border border-gray-200 bg-white text-xs font-bold text-gray-800 outline-none"
                          >
                            <option value={50}>🟢 Giảm 50% điểm phạt (Làm quen)</option>
                            <option value={20}>🟡 Giảm 20% điểm phạt (Tăng tốc)</option>
                            <option value={0}>🔵 Chuẩn 100% (Không giảm)</option>
                          </select>
                        </td>

                        {/* Quỹ thưởng 1% */}
                        <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                          {formatVnd(monthlyBonusPool)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Dải Tổng Kết Tinh Gọn (Lean Strip) */}
            <div className="py-2.5 px-4 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between flex-wrap gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-700">Tổng kết 6 tháng:</span>
                <span className="text-gray-500">Mục tiêu tăng trưởng từng nấc, không gây ngợp đội ngũ.</span>
              </div>

              <div className="flex items-center gap-5 font-mono">
                <span className="text-gray-600">
                  Tổng Doanh Thu: <strong className="text-[#001D3D]">{formatVnd(totalRoadmapRevenue)}</strong>
                </span>
                <span className="text-gray-600">
                  Tổng Quỹ Thưởng: <strong className="text-emerald-700 font-bold">{formatVnd(totalRoadmapPool)}</strong>
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* CHẾ ĐỘ 1 MỐC CỐ ĐỊNH */
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-amber-900">
                  <span>Mốc Hòa Vốn (Ngày)</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100">Tối thiểu mở quỹ</span>
                </div>
                <input
                  type="text"
                  disabled={!isCEOOrHR}
                  value={profitThresholdDaily ? profitThresholdDaily.toLocaleString('vi-VN') : ''}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '')
                    setProfitThresholdDaily(Number(raw) || 0)
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-amber-300 bg-white font-bold text-amber-950 font-mono text-sm outline-none"
                />
                <div className="text-[11px] text-amber-900 flex justify-between font-medium">
                  <span>Cả tháng:</span>
                  <strong className="font-mono">{formatVnd(profitThresholdDaily * 31)}</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-blue-900">
                  <span>Target Doanh Thu (Ngày)</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setTargetMode && setTargetMode('auto_3_6_months')}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${targetMode === 'auto_3_6_months' ? 'bg-[#2F6FA8] text-white' : 'text-gray-500'}`}
                    >
                      TB 3T
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetMode && setTargetMode('manual')}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${targetMode === 'manual' ? 'bg-[#2F6FA8] text-white' : 'text-gray-500'}`}
                    >
                      Tự đặt
                    </button>
                  </div>
                </div>

                {targetMode === 'auto_3_6_months' ? (
                  <input
                    type="text"
                    disabled={!isCEOOrHR}
                    value={avg36MonthsDaily ? avg36MonthsDaily.toLocaleString('vi-VN') : ''}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '')
                      setAvg36MonthsDaily(Number(raw) || 0)
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-blue-300 bg-white font-bold text-blue-950 font-mono text-sm outline-none"
                  />
                ) : (
                  <input
                    type="text"
                    disabled={!isCEOOrHR}
                    value={manualTargetDaily ? manualTargetDaily.toLocaleString('vi-VN') : ''}
                    onChange={e => {
                      const raw = e.target.value.replace(/\D/g, '')
                      if (setManualTargetDaily) setManualTargetDaily(Number(raw) || 0)
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-purple-300 bg-white font-bold text-purple-950 font-mono text-sm outline-none"
                  />
                )}

                <div className="text-[11px] text-blue-900 flex justify-between font-medium">
                  <span>Target áp dụng:</span>
                  <strong className="font-mono">{formatVnd(currentTargetDaily)}/ngày</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-indigo-900">
                  <span>Mốc Giờ Làm Tối Thiểu</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-100">Điều kiện</span>
                </div>
                <input
                  type="number"
                  disabled={!isCEOOrHR}
                  value={minHoursThreshold}
                  onChange={e => setMinHoursThreshold(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-indigo-300 bg-white font-bold text-indigo-950 font-mono text-sm outline-none"
                />
                <div className="text-[11px] text-indigo-900 font-medium">Dưới mốc này không tính thưởng BSC</div>
              </div>
            </div>
          </div>
        )}

        {/* Nút Submit Lưu */}
        {isCEOOrHR && (
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-wrap gap-2">
            <span className="text-[11px] text-gray-500">
              {periodScope === 'progressive_roadmap'
                ? 'Lưu riêng từng mức Target cho từng tháng của chi nhánh đang chọn'
                : 'Lưu mức Target cố định'}
            </span>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Save size={14} />
              <span>
                {periodScope === 'progressive_roadmap'
                  ? 'Lưu Lộ Trình Doanh Thu 6 Tháng'
                  : 'Lưu Cấu Hình Mốc Doanh Thu'}
              </span>
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
