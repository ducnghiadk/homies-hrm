'use client'

import React, { useState } from 'react'
import {
  Target,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  QrCode,
  Layers,
  Info,
  PlusCircle,
  X,
} from 'lucide-react'
import type { BSCCriteriaInfo, BSCSubCriteriaInfo } from '@/lib/bsc-types'
import { bscSafetySettings, updateBSCSafetySettings } from '@/lib/mock-data-bsc'

interface BSCSettingsCriteriaTabProps {
  criteriaList: BSCCriteriaInfo[]
  totalWeightPct: number
  isWeightValid: boolean
  isCEOOrHR: boolean
  onAddCriteria: () => void
  onDeleteCriteria: (key: string) => void
  onUpdateCriteriaField: (
    key: string,
    field: keyof BSCCriteriaInfo,
    value: string | number | BSCSubCriteriaInfo[] | undefined
  ) => void
  onSaveCriteriaConfig: () => void
}

// Helper to generate unique sub-criteria keys
let subCounter = 0
function generateSubKey(prefix: string = 'sub'): string {
  subCounter += 1
  return `${prefix}_${subCounter}`
}

export default function BSCSettingsCriteriaTab({
  criteriaList,
  totalWeightPct,
  isWeightValid,
  isCEOOrHR,
  onAddCriteria,
  onDeleteCriteria,
  onUpdateCriteriaField,
  onSaveCriteriaConfig,
}: BSCSettingsCriteriaTabProps) {
  // Local state for Customer sub-criteria internal weights
  const [qrWeight, setQrWeight] = useState<number>(bscSafetySettings.customer_qr_weight_pct ?? 50)
  const [reviewWeight, setReviewWeight] = useState<number>(bscSafetySettings.customer_review_weight_pct ?? 50)

  // Default initial sub-criteria for Customer
  const defaultCustomerSubs: BSCSubCriteriaInfo[] = [
    {
      key: 'qr_feedback',
      name: '1. QR Feedback bàn',
      weight_pct: qrWeight,
      unit_label: 'Điểm',
      direction: 'higher_better',
      input_type: 'number',
      score_5: 90,
      score_4: 80,
      score_3: 70,
      score_2: 60,
      score_1: 50,
      description: 'Quét mã QR tại bàn cho đánh giá',
    },
    {
      key: 'direct_review',
      name: '2. Đánh giá CSKH',
      weight_pct: reviewWeight,
      unit_label: 'Điểm',
      direction: 'higher_better',
      input_type: 'number',
      score_5: 90,
      score_4: 80,
      score_3: 70,
      score_2: 60,
      score_1: 50,
      description: 'Đánh giá phản ánh trực tiếp từ khách hàng',
    },
  ]

  // Handle adding sub-criteria to any criteria card
  const handleEnableSubCriteria = (cat: BSCCriteriaInfo) => {
    const isCustomer =
      cat.key === 'customer' ||
      cat.name.toLowerCase().includes('khách') ||
      cat.key.toLowerCase().includes('customer')

    const initialSubs: BSCSubCriteriaInfo[] = isCustomer
      ? defaultCustomerSubs
      : [
          {
            key: generateSubKey('sub_item'),
            name: 'Tiêu chí phụ 1',
            weight_pct: 50,
            unit_label: 'Điểm',
            direction: 'higher_better',
            input_type: 'number',
            score_5: 90,
            score_4: 80,
            score_3: 70,
            score_2: 60,
            score_1: 50,
          },
          {
            key: generateSubKey('sub_item'),
            name: 'Tiêu chí phụ 2',
            weight_pct: 50,
            unit_label: 'Điểm',
            direction: 'higher_better',
            input_type: 'number',
            score_5: 90,
            score_4: 80,
            score_3: 70,
            score_2: 60,
            score_1: 50,
          },
        ]
    onUpdateCriteriaField(cat.key, 'sub_criteria', initialSubs)
  }

  const handleAddSubCriterion = (cat: BSCCriteriaInfo) => {
    const currentSubs = cat.sub_criteria || (
      cat.key === 'customer' || cat.name.toLowerCase().includes('khách')
        ? defaultCustomerSubs
        : []
    )
    const newSub: BSCSubCriteriaInfo = {
      key: generateSubKey('sub_item'),
      name: `Tiêu chí phụ ${currentSubs.length + 1}`,
      weight_pct: 0,
      unit_label: 'Điểm',
      direction: 'higher_better',
      input_type: 'number',
      score_5: 90,
      score_4: 80,
      score_3: 70,
      score_2: 60,
      score_1: 50,
    }
    onUpdateCriteriaField(cat.key, 'sub_criteria', [...currentSubs, newSub])
  }

  const handleUpdateSubCriterion = (
    cat: BSCCriteriaInfo,
    subKey: string,
    field: keyof BSCSubCriteriaInfo,
    val: string | number
  ) => {
    const currentSubs = cat.sub_criteria || (
      cat.key === 'customer' || cat.name.toLowerCase().includes('khách')
        ? defaultCustomerSubs
        : []
    )
    const updated = currentSubs.map(s => {
      if (s.key === subKey) {
        return { ...s, [field]: val }
      }
      return s
    })

    // If updating customer weights, keep safetySettings in sync
    if (field === 'weight_pct') {
      const qrSub = updated.find(s => s.key === 'qr_feedback')
      const revSub = updated.find(s => s.key === 'direct_review')
      if (qrSub && revSub) {
        const qrVal = Number(qrSub.weight_pct || 0)
        const revVal = Number(revSub.weight_pct || 0)
        setQrWeight(qrVal)
        setReviewWeight(revVal)
        updateBSCSafetySettings({
          customer_qr_weight_pct: qrVal,
          customer_review_weight_pct: revVal,
        })
      }
    }

    onUpdateCriteriaField(cat.key, 'sub_criteria', updated)
  }

  const handleDeleteSubCriterion = (cat: BSCCriteriaInfo, subKey: string) => {
    const currentSubs = cat.sub_criteria || (
      cat.key === 'customer' || cat.name.toLowerCase().includes('khách')
        ? defaultCustomerSubs
        : []
    )
    const updated = currentSubs.filter(s => s.key !== subKey)
    onUpdateCriteriaField(
      cat.key,
      'sub_criteria',
      updated.length > 0 ? updated : undefined
    )
  }

  return (
    <div className="card p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-5 animate-fade-in text-sm font-['Inter']">
      {/* ─── HEADER BAR ─── */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center flex-shrink-0 border border-blue-100">
            <Target size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#001D3D]">
              Cấu Hình Danh Sách Tiêu Chí &amp; Trọng Số (%) BSC
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">
              Tùy chỉnh tên tiêu chí, % trọng số và phân rã tiêu chí con (Tổng trọng số bắt buộc = 100%)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`text-xs font-black px-3.5 py-1.5 rounded-full flex items-center gap-1.5 border font-mono ${
              isWeightValid
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
            }`}
          >
            {!isWeightValid && <AlertTriangle size={16} />}
            <span>Tổng Trọng Số: {totalWeightPct}% {isWeightValid ? '(Hợp Lệ 100%)' : '(Bắt buộc = 100%)'}</span>
          </span>

          {isCEOOrHR && (
            <button
              type="button"
              onClick={onAddCriteria}
              className="px-4 py-2.5 min-h-[44px] rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus size={16} /> Thêm Tiêu Chí
            </button>
          )}
        </div>
      </div>

      {/* ─── GRID TIÊU CHÍ ĐỐI XỨNG HÀI HÒA (2 CỘT ĐỀU NHAU) ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {criteriaList.map((cat, idx) => {
          const isCustomer =
            cat.key === 'customer' ||
            cat.name.toLowerCase().includes('khách') ||
            cat.key.toLowerCase().includes('customer')

          const catWeightPct = Math.round(cat.weight * 100)

          // Get active sub-criteria list
          const activeSubs = cat.sub_criteria || (isCustomer ? defaultCustomerSubs : undefined)
          const hasSubs = activeSubs && activeSubs.length > 0
          const totalSubPct = (activeSubs || []).reduce(
            (sum, s) => sum + Number(s.weight_pct || 0),
            0
          )
          const isSubValid = totalSubPct === 100

          return (
            <div
              key={cat.key}
              className="p-5 rounded-2xl border border-gray-200/90 bg-gray-50/70 hover:border-[#2F6FA8]/40 transition shadow-2xs flex flex-col justify-between relative space-y-3"
            >
              {isCEOOrHR && (
                <button
                  type="button"
                  onClick={() => onDeleteCriteria(cat.key)}
                  className="absolute right-4 top-4 p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer z-10"
                  title="Xóa tiêu chí này"
                >
                  <Trash2 size={18} />
                </button>
              )}

              <div className="space-y-3">
                {/* HÀNG 1: TÊN TIÊU CHÍ & TRỌNG SỐ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pr-8">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="font-bold text-gray-800 text-xs">
                      Tên tiêu chí ({idx + 1})
                    </label>
                    <input
                      type="text"
                      disabled={!isCEOOrHR}
                      value={cat.name}
                      onChange={e => onUpdateCriteriaField(cat.key, 'name', e.target.value)}
                      className="w-full px-3.5 py-2 min-h-[40px] rounded-xl border border-gray-200 bg-white font-bold text-gray-900 outline-none focus:border-[#2F6FA8] text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-gray-800 text-xs">Trọng số (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        disabled={!isCEOOrHR}
                        value={catWeightPct}
                        onChange={e => onUpdateCriteriaField(cat.key, 'weight', e.target.value)}
                        className="w-full pl-3 pr-8 py-2 min-h-[40px] rounded-xl border border-[#2F6FA8]/30 bg-[#2F6FA8]/5 font-black text-[#2F6FA8] text-sm outline-none focus:border-[#2F6FA8] font-mono tabular-nums"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-[#2F6FA8] text-xs">%</span>
                    </div>
                  </div>
                </div>

                {/* HÀNG 2: GHI CHÚ MÔ TẢ PHỤ TRỢ (NHẸ NHÀNG, KHÔNG LẤN ÁT) */}
                <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-white/80 px-3 py-2 rounded-xl border border-gray-200/70 focus-within:border-[#2F6FA8] focus-within:bg-white transition">
                  <Info size={13} className="text-gray-400 flex-shrink-0" />
                  <input
                    type="text"
                    disabled={!isCEOOrHR}
                    value={cat.description}
                    onChange={e => onUpdateCriteriaField(cat.key, 'description', e.target.value)}
                    placeholder="Ghi chú mô tả ngắn cho tiêu chí..."
                    className="w-full bg-transparent text-gray-600 outline-none text-[11px] placeholder:text-gray-400 placeholder:italic font-medium"
                  />
                </div>

                {/* ─── TIÊU CHÍ CON CẤU THÀNH (100% CHO PHÉP EDIT TÊN, %, THÊM, XÓA) ─── */}
                {hasSubs && (
                  <div className="p-3 rounded-xl bg-white border border-blue-200/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-[#001D3D] flex items-center gap-1.5 text-[11px]">
                        {isCustomer ? <QrCode size={13} className="text-[#2F6FA8]" /> : <Layers size={13} className="text-[#2F6FA8]" />}
                        Tiêu chí con cấu thành:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                            isSubValid
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                          }`}
                        >
                          Tổng: {totalSubPct}% {isSubValid ? '✓' : '(≠ 100%)'}
                        </span>
                        {isCEOOrHR && !isCustomer && (
                          <button
                            type="button"
                            onClick={() => onUpdateCriteriaField(cat.key, 'sub_criteria', undefined)}
                            className="p-0.5 text-gray-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Tắt tiêu chí con, quay về tiêu chí đơn"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      {activeSubs.map((sub, sIdx) => {
                        const subBscPct = ((catWeightPct * Number(sub.weight_pct || 0)) / 100).toFixed(1)

                        return (
                          <div
                            key={sub.key || sIdx}
                            className="p-2 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-between gap-2 text-xs"
                          >
                            {/* Ô nhập tên tiêu chí con (100% Editable) */}
                            <input
                              type="text"
                              disabled={!isCEOOrHR}
                              value={sub.name}
                              onChange={e =>
                                handleUpdateSubCriterion(cat, sub.key, 'name', e.target.value)
                              }
                              placeholder="Tên tiêu chí con..."
                              className="w-full bg-white px-2 py-1 rounded border border-gray-200 font-medium text-gray-800 text-[11px] outline-none focus:border-[#2F6FA8]"
                            />

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {/* Ô nhập % trọng số nội bộ (100% Editable) */}
                              <div className="relative w-16">
                                <input
                                  type="number"
                                  min={0}
                                  max={100}
                                  disabled={!isCEOOrHR}
                                  value={sub.weight_pct}
                                  onChange={e =>
                                    handleUpdateSubCriterion(
                                      cat,
                                      sub.key,
                                      'weight_pct',
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-full pl-1.5 pr-4 py-1 rounded border border-gray-300 bg-white text-[11px] font-bold font-mono text-[#2F6FA8] outline-none text-center"
                                />
                                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-gray-400 text-[9px] font-bold">
                                  %
                                </span>
                              </div>

                              <span className="font-mono font-bold text-[#2F6FA8] text-[10px] whitespace-nowrap bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                ={subBscPct}% BSC
                              </span>

                              {isCEOOrHR && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubCriterion(cat, sub.key)}
                                  className="text-gray-400 hover:text-rose-600 p-0.5 transition cursor-pointer"
                                  title="Xóa tiêu chí con này"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {isCEOOrHR && (
                      <button
                        type="button"
                        onClick={() => handleAddSubCriterion(cat)}
                        className="w-full py-1.5 rounded-lg border border-dashed border-[#2F6FA8]/40 hover:border-[#2F6FA8] bg-white text-[#2F6FA8] text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                      >
                        <Plus size={12} /> Thêm tiêu chí con
                      </button>
                    )}
                  </div>
                )}

                {/* ─── NÚT BẬT TIÊU CHÍ CON NẾU CHƯA BẬT ─── */}
                {!hasSubs && isCEOOrHR && (
                  <button
                    type="button"
                    onClick={() => handleEnableSubCriteria(cat)}
                    className="w-full py-2 rounded-xl border border-dashed border-gray-300 hover:border-[#2F6FA8] hover:bg-blue-50/40 text-gray-500 hover:text-[#2F6FA8] text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <PlusCircle size={13} />
                    <span>+ Phân chia tiêu chí con cấu thành</span>
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* ─── FOOTER LƯU CẤU HÌNH ─── */}
      {isCEOOrHR && (
        <div className="flex justify-end pt-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onSaveCriteriaConfig}
            className="px-6 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-2 shadow-2xs cursor-pointer"
          >
            <Save size={16} /> Lưu Cấu Hình Tiêu Chí &amp; Trọng Số %
          </button>
        </div>
      )}
    </div>
  )
}
