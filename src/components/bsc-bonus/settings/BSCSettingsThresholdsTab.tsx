'use client'

import React, { useState } from 'react'
import {
  FileSpreadsheet,
  QrCode,
  Building2,
  TrendingUp,
  PackageX,
  AlertCircle,
  Sparkles,
  Info,
  Calculator,
  ArrowRight,
  Settings,
} from 'lucide-react'
import {
  bscCriteriaThresholdsCatalog,
  updateBSCCriteriaThreshold,
  mockBSCRevenueTargets,
  bscCriteriaCatalog,
} from '@/lib/mock-data-bsc'
import type { BSCCriteriaInfo, BSCSubCriteriaInfo } from '@/lib/bsc-types'

interface BSCSettingsThresholdsTabProps {
  criteriaList?: BSCCriteriaInfo[]
  onUpdateCriteriaField?: (
    key: string,
    field: keyof BSCCriteriaInfo,
    value: string | number | BSCSubCriteriaInfo[] | undefined
  ) => void
  isCEOOrHR: boolean
  onNotify: (msg: string) => void
  onNavigateToTab?: (tab: string) => void
}

export default function BSCSettingsThresholdsTab({
  criteriaList = bscCriteriaCatalog,
  onUpdateCriteriaField,
  isCEOOrHR,
  onNotify,
  onNavigateToTab,
}: BSCSettingsThresholdsTabProps) {
  // Store target selector for live conversion preview
  const [selectedStoreId, setSelectedStoreId] = useState<string>(mockBSCRevenueTargets[0]?.store_id || 'store-001')

  // Interactive Simulator state for each criteria
  const [simValues, setSimValues] = useState<Record<string, number>>({
    'revenue_raw': 102,
    'waste_raw': 2.8,
    'operation_raw': 6,
    'customer_qr_feedback': 86,
    'customer_direct_review': 92,
  })

  const handleSimChange = (key: string, val: number) => {
    setSimValues(prev => ({ ...prev, [key]: val }))
  }

  const selectedTarget = mockBSCRevenueTargets.find(t => t.store_id === selectedStoreId) || mockBSCRevenueTargets[0]
  const targetMonthly = selectedTarget?.target_monthly || 240000000
  const cogsBudget = selectedTarget?.cogs_budget || 72000000 // 30% of target

  const formatVND = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1).replace('.0', '')} tr`
    }
    if (num >= 1000) {
      return `${Math.round(num / 1000)}k`
    }
    return `${num}đ`
  }

  // Generic score evaluator
  const evalScore = (
    val: number,
    s5: number = 90,
    s4: number = 80,
    s3: number = 70,
    s2: number = 60,
    direction: 'higher_better' | 'lower_better' = 'higher_better'
  ): number => {
    if (direction === 'higher_better') {
      if (val >= s5) return 5
      if (val >= s4) return 4
      if (val >= s3) return 3
      if (val >= s2) return 2
      return 1
    } else {
      if (val <= s5) return 5
      if (val <= s4) return 4
      if (val <= s3) return 3
      if (val <= s2) return 2
      return 1
    }
  }

  const handleUpdateSingleThreshold = (
    catKey: string,
    field: 'score_5' | 'score_4' | 'score_3' | 'score_2' | 'score_1',
    val: number
  ) => {
    updateBSCCriteriaThreshold(catKey, { [field]: val })
    if (onUpdateCriteriaField) {
      onUpdateCriteriaField(catKey, field, val)
    }
    onNotify('Đã cập nhật mốc quy đổi điểm!')
  }

  const handleUpdateSubThreshold = (
    cat: BSCCriteriaInfo,
    subKey: string,
    field: 'score_5' | 'score_4' | 'score_3' | 'score_2' | 'score_1',
    val: number
  ) => {
    const currentSubs = cat.sub_criteria || []
    const updated = currentSubs.map(s => (s.key === subKey ? { ...s, [field]: val } : s))
    if (onUpdateCriteriaField) {
      onUpdateCriteriaField(cat.key, 'sub_criteria', updated)
    }
    updateBSCCriteriaThreshold(`customer_${subKey}`, { [field]: val })
    onNotify('Đã cập nhật mốc tiêu chí con!')
  }

  return (
    <div className="space-y-6 animate-fade-in text-sm font-['Inter']">
      {/* ─── CARD CHÍNH: BẢNG MỐC QUY ĐỔI ĐIỂM ─── */}
      <div className="card p-5 sm:p-6 rounded-3xl border border-gray-200/80 bg-white shadow-xs space-y-5">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-wrap gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center flex-shrink-0 border border-blue-100">
              <FileSpreadsheet size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#001D3D]">
                Bảng Mốc Số Liệu Quy Đổi Điểm (1 đến 5 Điểm)
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-0.5">
                Khung quy định mốc số liệu đạt được của từng tiêu chí &amp; tiêu chí con — Tự động chấm điểm 1-5 và tính thưởng BSC
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 bg-gray-50 p-1.5 rounded-xl border border-gray-200">
              <Building2 size={15} className="text-[#2F6FA8] ml-1.5" />
              <span className="text-xs font-bold text-gray-700">Xem trước quy đổi theo:</span>
              <select
                value={selectedStoreId}
                onChange={e => setSelectedStoreId(e.target.value)}
                className="bg-white px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-bold text-[#001D3D] outline-none cursor-pointer"
              >
                {mockBSCRevenueTargets.map(t => (
                  <option key={t.store_id} value={t.store_id}>
                    {t.store_name} (Target: {formatVND(t.target_monthly)}/tháng)
                  </option>
                ))}
              </select>
            </div>

            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('store_targets')}
                className="px-3 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-[#2F6FA8] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="Chuyển sang Tab 2 để cài đặt hoặc chỉnh sửa Target doanh thu chi nhánh"
              >
                <Settings size={14} />
                <span>Cài Target Chi Nhánh ↗</span>
              </button>
            )}
          </div>
        </div>

        {/* Dải Thông Điệp Nguồn Dữ Liệu Tự Động */}
        <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-950 leading-relaxed font-medium">
          <Info size={16} className="text-[#2F6FA8] shrink-0 mt-0.5" />
          <div>
            <strong>Nguồn số liệu quy đổi:</strong> Các mốc tiền VNĐ hiển thị bên dưới (ví dụ: <span className="font-mono font-bold text-[#001D3D]">{formatVND(targetMonthly * 1.1)}</span>, <span className="font-mono font-bold text-[#001D3D]">{formatVND(cogsBudget * 0.02)}</span>...) được tự động tính toán dựa trên Target Doanh Thu &amp; Mốc Hòa Vốn bạn đã thiết lập ở <strong>Tab 2 (Doanh Thu Chi Nhánh)</strong> cho <strong>{selectedTarget.store_name}</strong>.
          </div>
        </div>

        {/* ─── GRID TIÊU CHÍ DYNAMIC (TỰ ĐỘNG THEO DANH SÁCH TIÊU CHÍ) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {criteriaList.map((cat, idx) => {
            const catWeightPct = Math.round(cat.weight * 100)
            const hasSubs = cat.sub_criteria && cat.sub_criteria.length > 0
            const dir = cat.direction || (cat.key === 'waste' || cat.key === 'operation' ? 'lower_better' : 'higher_better')
            const unit = cat.unit_label || (cat.key === 'revenue' ? '% Target' : cat.key === 'waste' ? '% Hao hụt' : cat.key === 'operation' ? 'Điểm lỗi' : 'Điểm')

            // Fallback threshold values from catalog or cat
            const catalogRule = bscCriteriaThresholdsCatalog.find(r => r.criteria_key === cat.key)
            const s5 = cat.score_5 ?? catalogRule?.score_5 ?? (dir === 'higher_better' ? 90 : 4)
            const s4 = cat.score_4 ?? catalogRule?.score_4 ?? (dir === 'higher_better' ? 80 : 8)
            const s3 = cat.score_3 ?? catalogRule?.score_3 ?? (dir === 'higher_better' ? 70 : 12)
            const s2 = cat.score_2 ?? catalogRule?.score_2 ?? (dir === 'higher_better' ? 60 : 15)
            const s1 = cat.score_1 ?? catalogRule?.score_1 ?? (dir === 'higher_better' ? 50 : 20)

            const iconComponent =
              cat.key === 'revenue' ? <TrendingUp size={18} className="text-[#2F6FA8]" /> :
              cat.key === 'waste' ? <PackageX size={18} className="text-amber-700" /> :
              cat.key === 'operation' ? <AlertCircle size={18} className="text-purple-700" /> :
              cat.key === 'customer' ? <QrCode size={18} className="text-emerald-700" /> :
              <Settings size={18} className="text-indigo-600" />

            const cardBorderColor =
              cat.key === 'revenue' ? 'border-blue-200/80 bg-blue-50/20' :
              cat.key === 'waste' ? 'border-amber-200/80 bg-amber-50/20' :
              cat.key === 'operation' ? 'border-purple-200/80 bg-purple-50/20' :
              'border-emerald-200/80 bg-emerald-50/20'

            const badgeBg =
              cat.key === 'revenue' ? 'bg-[#2F6FA8]' :
              cat.key === 'waste' ? 'bg-amber-600' :
              cat.key === 'operation' ? 'bg-purple-600' :
              'bg-emerald-600'

            return (
              <div
                key={cat.key || idx}
                className={`p-5 rounded-2xl border ${cardBorderColor} space-y-3.5 flex flex-col justify-between shadow-2xs`}
              >
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {iconComponent}
                      <span className="text-[#001D3D] text-base font-black">
                        {idx + 1}. {cat.name}
                      </span>
                    </div>
                    <span className={`text-xs font-black px-2.5 py-0.5 rounded-full ${badgeBg} text-white font-mono`}>
                      {catWeightPct}% BSC
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-500">
                    <span>
                      {dir === 'higher_better' ? 'Càng CAO càng TỐT' : 'Càng THẤP càng TỐT'} — {cat.description || 'Tiêu chí đánh giá'}
                    </span>
                    <span className="font-semibold text-gray-700 font-mono">
                      {cat.key === 'revenue' ? `Target: ${formatVND(targetMonthly)}/th` : cat.key === 'waste' ? `COGS: ${formatVND(cogsBudget)}/th` : `Đơn vị: ${unit}`}
                    </span>
                  </div>
                </div>

                {/* ══════════════════════════════════════════════
                    TRƯỜNG HỢP 1: TIÊU CHÍ ĐƠN (SINGLE CRITERION)
                ══════════════════════════════════════════════ */}
                {!hasSubs && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                        <span className="text-[11px] text-[#001D3D] flex items-center gap-1 font-bold">
                          <Sparkles size={13} className="text-[#2F6FA8]" />
                          Mốc Điểm Mẹ (1 đến 5 Điểm):
                        </span>
                        <span className="text-[10px] text-gray-400 font-normal">
                          {cat.key === 'revenue' || cat.key === 'waste' ? 'Quy đổi ra Tiền VNĐ thực tế' : 'Mức đạt được tương ứng'}
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 text-center">
                        {[5, 4, 3, 2, 1].map(score => {
                          const field = `score_${score}` as 'score_5' | 'score_4' | 'score_3' | 'score_2' | 'score_1'
                          const val = score === 5 ? s5 : score === 4 ? s4 : score === 3 ? s3 : score === 2 ? s2 : s1
                          const bscContribution = ((score * catWeightPct) / 100).toFixed(2)

                          // Real world conversion calculation
                          let realLabel = ''
                          let dailyLabel = ''
                          if (cat.key === 'revenue') {
                            const realAmt = (targetMonthly * Number(val)) / 100
                            realLabel = `≥ ${formatVND(realAmt)}`
                            dailyLabel = `~${formatVND(realAmt / 30)}/ngày`
                          } else if (cat.key === 'waste') {
                            const realAmt = (cogsBudget * Number(val)) / 100
                            realLabel = `≤ ${formatVND(realAmt)}`
                            dailyLabel = `~${formatVND(realAmt / 30)}/ngày`
                          } else if (cat.key === 'operation') {
                            realLabel = `≤ ${val} lỗi`
                            dailyLabel = score === 5 ? 'Xuất sắc' : score === 4 ? 'Tốt' : score === 3 ? 'Đạt' : score === 2 ? 'Cảnh báo' : 'Kém'
                          }

                          return (
                            <div key={score} className="space-y-1 p-2 rounded-xl bg-white border border-gray-200 shadow-2xs">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-black text-[#2F6FA8]">{score}đ</span>
                                <span className="text-[9px] font-bold text-gray-400 font-mono">+{bscContribution} BSC</span>
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  step={0.1}
                                  disabled={!isCEOOrHR}
                                  value={val}
                                  onChange={e => handleUpdateSingleThreshold(cat.key, field, Number(e.target.value))}
                                  className="w-full px-1 py-1 text-center font-bold rounded-lg border border-gray-200 bg-gray-50 text-gray-900 text-xs outline-none focus:border-[#2F6FA8] font-mono tabular-nums"
                                />
                              </div>
                              {realLabel && (
                                <div className="pt-0.5 border-t border-gray-100">
                                  <span className="text-[10px] font-bold text-emerald-800 block leading-tight font-mono">
                                    {realLabel}
                                  </span>
                                  <span className="text-[9px] text-gray-600 block leading-tight">
                                    {dailyLabel}
                                  </span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-white/80 px-2.5 py-1.5 rounded-lg border border-gray-200">
                      <Info size={13} className="text-gray-400 flex-shrink-0" />
                      <span>Tiêu chí đơn: Đạt mốc nào ăn trọn điểm đó ➔ Nhân thẳng vào {catWeightPct}% BSC.</span>
                    </div>
                  </>
                )}

                {/* ══════════════════════════════════════════════════════
                    TRƯỜNG HỢP 2: TIÊU CHÍ GHÉP (COMPOSITE / SUB-CRITERIA)
                ══════════════════════════════════════════════════════ */}
                {hasSubs && (
                  <>
                    {/* 1. HÀNG THANG ĐIỂM MẸ (1.0 ĐẾN 5.0 ĐIỂM) */}
                    <div className="p-2.5 rounded-xl bg-white border border-emerald-200 space-y-1.5 shadow-2xs">
                      <div className="flex justify-between items-center text-xs font-bold text-gray-700">
                        <span className="text-[11px] text-[#001D3D] flex items-center gap-1 font-bold">
                          <Sparkles size={13} className="text-emerald-600" />
                          Thang Điểm Mẹ Tổng Hợp (1.0 đến 5.0 Điểm):
                        </span>
                        <span className="text-[10px] text-emerald-700 font-medium">Ghép từ {cat.sub_criteria!.length} tiêu chí con</span>
                      </div>

                      <div className="grid grid-cols-5 gap-1.5 text-center">
                        {[5, 4, 3, 2, 1].map(score => {
                          const bscContribution = ((score * catWeightPct) / 100).toFixed(2)

                          return (
                            <div key={score} className="p-1 rounded-lg bg-emerald-50/60 border border-emerald-200/80">
                              <div className="flex justify-between items-center">
                                <span className="text-[11px] font-black text-emerald-800">{score}.0đ</span>
                                <span className="text-[8px] font-bold text-gray-400 font-mono">+{bscContribution}</span>
                              </div>
                              <div className="font-mono font-bold text-[10px] text-[#001D3D] py-0.5">
                                +{bscContribution}đ BSC
                              </div>
                              <span className="text-[8px] text-emerald-800 block font-medium">
                                {score === 5 ? 'Xuất sắc' : score === 4 ? 'Tốt' : score === 3 ? 'Đạt chuẩn' : score === 2 ? 'Cảnh báo' : 'Kém'}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* 2. BẢNG CÀI ĐẶT MỐC ĐIỂM TỪNG TIÊU CHÍ CON */}
                    <div className="p-2.5 rounded-xl bg-white border border-gray-200 space-y-2 shadow-2xs">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[11px] font-bold text-[#001D3D]">
                          Cài Đặt Mốc Số Liệu Đạt Điểm Cho Các Tiêu Chí Con:
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">Mốc 5đ - 4đ - 3đ - 2đ - 1đ</span>
                      </div>

                      {cat.sub_criteria!.map((sub, sIdx) => {
                        const subRule = bscCriteriaThresholdsCatalog.find(r => r.criteria_key === `customer_${sub.key}`)
                        const subS5 = sub.score_5 ?? subRule?.score_5 ?? 90
                        const subS4 = sub.score_4 ?? subRule?.score_4 ?? 80
                        const subS3 = sub.score_3 ?? subRule?.score_3 ?? 70
                        const subS2 = sub.score_2 ?? subRule?.score_2 ?? 60
                        const subS1 = sub.score_1 ?? subRule?.score_1 ?? 50

                        return (
                          <div key={sub.key || sIdx} className="flex items-center gap-2 text-xs">
                            <span className="text-[10px] font-bold text-[#2F6FA8] w-32 truncate flex-shrink-0" title={sub.name}>
                              {sIdx + 1}. {sub.name} ({sub.weight_pct}%):
                            </span>
                            <div className="grid grid-cols-5 gap-1 flex-1 text-center">
                              {[5, 4, 3, 2, 1].map(score => {
                                const field = `score_${score}` as 'score_5' | 'score_4' | 'score_3' | 'score_2' | 'score_1'
                                const val = score === 5 ? subS5 : score === 4 ? subS4 : score === 3 ? subS3 : score === 2 ? subS2 : subS1

                                return (
                                  <div key={score} className="relative">
                                    <input
                                      type="number"
                                      disabled={!isCEOOrHR}
                                      value={val}
                                      onChange={e => handleUpdateSubThreshold(cat, sub.key, field, Number(e.target.value))}
                                      className="w-full px-0.5 py-0.5 text-center font-bold rounded border border-gray-200 bg-gray-50 text-gray-900 text-[10px] outline-none font-mono"
                                      title={`${score} điểm con: ≥ ${val}`}
                                    />
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* 3. TRÌNH MÔ PHỎNG TÍNH ĐIỂM TRỰC TIẾP (DYNAMIC SIMULATOR) */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                          <Calculator size={13} className="text-emerald-700" />
                          Mô phỏng thử tính điểm tháng này:
                        </span>
                        <span className="text-[10px] text-emerald-800 font-medium">Gõ thử số điểm thực tế</span>
                      </div>

                      <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                        {cat.sub_criteria!.map((sub, sIdx) => {
                          const simKey = `${cat.key}_${sub.key}`
                          const simVal = simValues[simKey] ?? (sIdx === 0 ? 86 : 92)
                          const subRule = bscCriteriaThresholdsCatalog.find(r => r.criteria_key === `customer_${sub.key}`)
                          const s5Val = sub.score_5 ?? subRule?.score_5 ?? 90
                          const s4Val = sub.score_4 ?? subRule?.score_4 ?? 80
                          const s3Val = sub.score_3 ?? subRule?.score_3 ?? 70
                          const s2Val = sub.score_2 ?? subRule?.score_2 ?? 60
                          const converted = evalScore(simVal, s5Val, s4Val, s3Val, s2Val, sub.direction)

                          return (
                            <div key={sub.key || sIdx} className="flex items-center gap-1.5">
                              <span className="text-[10px] text-gray-600 truncate max-w-[80px]" title={sub.name}>{sub.name}:</span>
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={simVal}
                                onChange={e => handleSimChange(simKey, Number(e.target.value))}
                                className="w-12 px-1 py-0.5 rounded border border-emerald-300 bg-white font-bold text-center text-xs text-[#2F6FA8]"
                              />
                              <span className="text-[10px] font-bold text-[#2F6FA8]">➔ {converted}đ</span>
                            </div>
                          )
                        })}

                        {/* Total simulated score */}
                        {(() => {
                          let totalSimParent = 0
                          cat.sub_criteria!.forEach((sub, sIdx) => {
                            const simKey = `${cat.key}_${sub.key}`
                            const simVal = simValues[simKey] ?? (sIdx === 0 ? 86 : 92)
                            const subRule = bscCriteriaThresholdsCatalog.find(r => r.criteria_key === `customer_${sub.key}`)
                            const s5Val = sub.score_5 ?? subRule?.score_5 ?? 90
                            const s4Val = sub.score_4 ?? subRule?.score_4 ?? 80
                            const s3Val = sub.score_3 ?? subRule?.score_3 ?? 70
                            const s2Val = sub.score_2 ?? subRule?.score_2 ?? 60
                            const converted = evalScore(simVal, s5Val, s4Val, s3Val, s2Val, sub.direction)
                            totalSimParent += (converted * Number(sub.weight_pct || 0)) / 100
                          })
                          const finalParent = Number(totalSimParent.toFixed(2))
                          const finalBsc = Number(((finalParent * catWeightPct) / 100).toFixed(3))

                          return (
                            <div className="flex items-center gap-1 font-mono font-bold text-[11px] text-emerald-900 bg-white px-2 py-0.5 rounded-lg border border-emerald-200 shadow-2xs">
                              <ArrowRight size={12} className="text-emerald-600" />
                              <span>Điểm Mẹ: <strong>{finalParent}đ</strong> (+<strong>{finalBsc}đ BSC</strong>)</span>
                            </div>
                          )
                        })()}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
