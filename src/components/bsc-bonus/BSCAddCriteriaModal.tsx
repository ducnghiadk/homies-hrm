'use client'

import React, { useState } from 'react'
import {
  X,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Target,
  Layers,
  Info,
  Sliders,
} from 'lucide-react'
import type { BSCCriteriaInfo, BSCSubCriteriaInfo } from '@/lib/bsc-types'

interface BSCAddCriteriaModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newCriteria: BSCCriteriaInfo) => void
}

// Helper for unique key generation
let modalKeyCounter = 0
function generateModalKey(prefix: string = 'key'): string {
  modalKeyCounter += 1
  return `${prefix}_${modalKeyCounter}`
}

export default function BSCAddCriteriaModal({
  isOpen,
  onClose,
  onSave,
}: BSCAddCriteriaModalProps) {
  const [name, setName] = useState('')
  const [weightPct, setWeightPct] = useState(15)
  const [description, setDescription] = useState('')
  const [perspectiveKey, setPerspectiveKey] = useState<'financial' | 'customer' | 'internal' | 'learning'>('internal')
  const [direction, setDirection] = useState<'higher_better' | 'lower_better'>('higher_better')
  const [unitLabel, setUnitLabel] = useState('Điểm')

  // Mốc 1-5đ cho tiêu chí đơn
  const [singleScores, setSingleScores] = useState({
    score_5: 90,
    score_4: 80,
    score_3: 70,
    score_2: 60,
    score_1: 50,
  })

  // Sub-criteria toggle & list
  const [hasSubCriteria, setHasSubCriteria] = useState(false)
  const [subCriteriaList, setSubCriteriaList] = useState<BSCSubCriteriaInfo[]>([
    {
      key: 'sub_1',
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
      key: 'sub_2',
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
  ])

  if (!isOpen) return null

  // Tính tổng % các tiêu chí con
  const totalSubWeightPct = subCriteriaList.reduce((sum, sub) => sum + Number(sub.weight_pct || 0), 0)
  const isSubWeightValid = !hasSubCriteria || totalSubWeightPct === 100

  const handleAddSubCriterion = () => {
    const newSub: BSCSubCriteriaInfo = {
      key: generateModalKey('sub_item'),
      name: `Tiêu chí phụ ${subCriteriaList.length + 1}`,
      weight_pct: 0,
      unit_label: unitLabel || 'Điểm',
      direction,
      input_type: 'number',
      score_5: 90,
      score_4: 80,
      score_3: 70,
      score_2: 60,
      score_1: 50,
    }
    setSubCriteriaList([...subCriteriaList, newSub])
  }

  const handleDeleteSubCriterion = (key: string) => {
    if (subCriteriaList.length <= 1) {
      alert('Tối thiểu phải giữ lại 1 tiêu chí con!')
      return
    }
    setSubCriteriaList(subCriteriaList.filter(s => s.key !== key))
  }

  const handleUpdateSubCriterion = (key: string, field: keyof BSCSubCriteriaInfo, value: string | number) => {
    setSubCriteriaList(prev =>
      prev.map(item => (item.key === key ? { ...item, [field]: value } : item))
    )
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('Vui lòng nhập tên tiêu chí!')
      return
    }

    if (hasSubCriteria && !isSubWeightValid) {
      alert(`Tổng % trọng số các tiêu chí con hiện tại là ${totalSubWeightPct}%. Tổng trọng số các tiêu chí con bắt buộc phải bằng đúng 100%!`)
      return
    }

    const key = generateModalKey('custom_cat')
    const weightNum = Number(weightPct) / 100

    const newCat: BSCCriteriaInfo = {
      key,
      name: name.trim(),
      weight: weightNum,
      weight_percent_label: `${weightPct}%`,
      description: description.trim() || 'Tiêu chí BSC chuẩn định mức',
      how_to_excel: 'Thực hiện theo đúng quy trình chuẩn',
      icon: perspectiveKey === 'financial' ? 'TrendingUp' : perspectiveKey === 'customer' ? 'Users' : perspectiveKey === 'internal' ? 'Settings' : 'Sparkles',
      color: perspectiveKey === 'financial' ? '#2F6FA8' : perspectiveKey === 'customer' ? '#059669' : perspectiveKey === 'internal' ? '#D97706' : '#7C3AED',
      direction,
      unit_label: unitLabel.trim() || 'Điểm',
      input_type: 'number',
      perspective_key: perspectiveKey,
      score_5: !hasSubCriteria ? Number(singleScores.score_5) : undefined,
      score_4: !hasSubCriteria ? Number(singleScores.score_4) : undefined,
      score_3: !hasSubCriteria ? Number(singleScores.score_3) : undefined,
      score_2: !hasSubCriteria ? Number(singleScores.score_2) : undefined,
      score_1: !hasSubCriteria ? Number(singleScores.score_1) : undefined,
      sub_criteria: hasSubCriteria ? subCriteriaList : undefined,
    }

    onSave(newCat)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in font-['Inter']">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center border border-blue-100">
              <Target size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#001D3D]">Thêm Tiêu Chí BSC Đa Năng</h2>
              <p className="text-xs text-gray-500 font-medium">Thiết lập tiêu chí, tỷ trọng % BSC và cài đặt mốc điểm 1-5 chuẩn xác</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200/80 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* HÀNG 1: TÊN TIÊU CHÍ & TRỌNG SỐ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-bold text-gray-800 text-xs">
                Tên Tiêu Chí Mẹ <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="VD: Kiểm Tra Tay Nghề & Kỷ Luật Nhân Sự"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-900 text-xs outline-none focus:border-[#2F6FA8] bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-800 text-xs">
                Trọng Số BSC (%) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={100}
                  required
                  value={weightPct}
                  onChange={e => setWeightPct(Number(e.target.value))}
                  className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-[#2F6FA8]/40 bg-blue-50/20 font-black text-[#2F6FA8] text-sm outline-none font-mono tabular-nums"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-[#2F6FA8] text-xs">%</span>
              </div>
            </div>
          </div>

          {/* HÀNG 2: KHÍA CẠNH CHIẾN LƯỢC & CHIỀU HƯỚNG ĐÁNH GIÁ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="font-bold text-gray-800 text-xs">Khía Cạnh BSC</label>
              <select
                value={perspectiveKey}
                onChange={e => setPerspectiveKey(e.target.value as 'financial' | 'customer' | 'internal' | 'learning')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-800 outline-none focus:border-[#2F6FA8] bg-white cursor-pointer"
              >
                <option value="financial">1. Tài Chính (Financial)</option>
                <option value="customer">2. Khách Hàng (Customer)</option>
                <option value="internal">3. Quy Trình Vận Hành (Operations)</option>
                <option value="learning">4. Đào Tạo &amp; Nhân Sự (People)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-800 text-xs">Chiều Hướng Đánh Giá</label>
              <select
                value={direction}
                onChange={e => setDirection(e.target.value as 'higher_better' | 'lower_better')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-semibold text-gray-800 outline-none focus:border-[#2F6FA8] bg-white cursor-pointer"
              >
                <option value="higher_better">Càng CAO càng TỐT (Doanh thu, Điểm...)</option>
                <option value="lower_better">Càng THẤP càng TỐT (Hao hụt, Lỗi...)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-800 text-xs">Đơn Vị Đo Lường</label>
              <input
                type="text"
                value={unitLabel}
                onChange={e => setUnitLabel(e.target.value)}
                placeholder="VD: Điểm, %, Lỗi, Lần..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 font-bold text-gray-900 text-xs outline-none focus:border-[#2F6FA8] bg-white"
              />
            </div>
          </div>

          {/* HÀNG 3: GHI CHÚ MÔ TẢ */}
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 focus-within:border-[#2F6FA8] focus-within:bg-white transition">
            <Info size={13} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Ghi chú mô tả ngắn mục tiêu tiêu chí này..."
              className="w-full bg-transparent text-gray-600 outline-none text-[11px] placeholder:text-gray-400 placeholder:italic font-medium"
            />
          </div>

          {/* ══════════════════════════════════════════════════════════════
              HÀNG 4: CHỌN CẤU TRÚC TIÊU CHÍ (ĐƠN VS GHÉP TIÊU CHÍ CON)
          ══════════════════════════════════════════════════════════════ */}
          <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/30 space-y-3">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setHasSubCriteria(!hasSubCriteria)}>
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-[#2F6FA8]" />
                <div>
                  <h4 className="font-bold text-[#001D3D] text-xs">Phân rã thành các Tiêu chí con cấu thành</h4>
                  <p className="text-[11px] text-gray-500 font-medium">Bật khi tiêu chí này được ghép từ 2 hoặc nhiều nhánh tiêu chí con độc lập</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={hasSubCriteria}
                onChange={e => setHasSubCriteria(e.target.checked)}
                className="w-4 h-4 text-[#2F6FA8] rounded cursor-pointer"
              />
            </div>

            {/* TRƯỜNG HỢP A: TIÊU CHÍ ĐƠN (CÀI ĐẶT MỐC ĐIỂM 1-5 TRỰC TIẾP) */}
            {!hasSubCriteria && (
              <div className="p-3 rounded-xl bg-white border border-gray-200 space-y-2 pt-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-[#001D3D] flex items-center gap-1.5">
                    <Sliders size={13} className="text-[#2F6FA8]" />
                    Cài đặt mốc số liệu đạt điểm (Thang 1 đến 5 điểm):
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">Đơn vị: {unitLabel || 'Điểm'}</span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {[5, 4, 3, 2, 1].map(score => {
                    const field = `score_${score}` as keyof typeof singleScores
                    return (
                      <div key={score} className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 space-y-1">
                        <span className="text-xs font-black text-[#2F6FA8] block">{score} điểm</span>
                        <input
                          type="number"
                          step={0.1}
                          value={singleScores[field]}
                          onChange={e => setSingleScores({ ...singleScores, [field]: Number(e.target.value) })}
                          className="w-full px-1 py-1 text-center font-bold font-mono rounded border border-gray-200 bg-white text-gray-900 text-xs outline-none focus:border-[#2F6FA8]"
                        />
                        <span className="text-[9px] text-gray-500 block font-mono">
                          {direction === 'higher_better' ? `≥ ${singleScores[field]}` : `≤ ${singleScores[field]}`}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* TRƯỜNG HỢP B: TIÊU CHÍ GHÉP (CÓ CÁC NHÁNH CON) */}
            {hasSubCriteria && (
              <div className="space-y-3 pt-3 border-t border-blue-200/70">
                <div className="flex justify-between items-center text-xs">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full font-mono border ${
                      isSubWeightValid
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
                    }`}
                  >
                    {!isSubWeightValid && <AlertTriangle size={12} className="inline mr-1" />}
                    Tổng Trọng Số Nội Bộ: {totalSubWeightPct}% {isSubWeightValid ? '(Đủ 100% ✓)' : '(Bắt buộc = 100%)'}
                  </span>

                  <button
                    type="button"
                    onClick={handleAddSubCriterion}
                    className="px-3 py-1 rounded-lg bg-[#2F6FA8] text-white text-xs font-bold hover:bg-[#1D3E61] transition flex items-center gap-1 shadow-2xs cursor-pointer"
                  >
                    <Plus size={13} /> Thêm Tiêu Chí Con
                  </button>
                </div>

                {/* Sub-Criteria List */}
                <div className="space-y-3">
                  {subCriteriaList.map((sub, idx) => {
                    const subBscPct = ((Number(weightPct) * Number(sub.weight_pct || 0)) / 100).toFixed(1)

                    return (
                      <div
                        key={sub.key || idx}
                        className="p-3 rounded-xl bg-white border border-gray-200 space-y-2 shadow-2xs text-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            required
                            value={sub.name}
                            onChange={e => handleUpdateSubCriterion(sub.key, 'name', e.target.value)}
                            placeholder="Tên tiêu chí con..."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-900 outline-none focus:border-[#2F6FA8]"
                          />

                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <div className="relative w-20">
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={sub.weight_pct}
                                onChange={e => handleUpdateSubCriterion(sub.key, 'weight_pct', Number(e.target.value))}
                                className="w-full pl-2 pr-5 py-1.5 rounded-lg border border-gray-300 font-bold font-mono text-[#2F6FA8] text-xs text-center outline-none"
                              />
                              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px] font-bold">%</span>
                            </div>

                            <span className="font-mono font-bold text-[#2F6FA8] text-[10px] whitespace-nowrap bg-blue-50 px-2 py-1 rounded-md border border-blue-200">
                              ={subBscPct}% BSC
                            </span>

                            <button
                              type="button"
                              onClick={() => handleDeleteSubCriterion(sub.key)}
                              className="p-1 text-gray-400 hover:text-rose-600 rounded transition cursor-pointer"
                              title="Xóa tiêu chí con này"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Mốc 1-5đ cho từng tiêu chí con */}
                        <div className="grid grid-cols-5 gap-1.5 text-center pt-1.5 border-t border-gray-100">
                          {[5, 4, 3, 2, 1].map(score => {
                            const field = `score_${score}` as keyof typeof sub
                            return (
                              <div key={score} className="p-1 rounded bg-gray-50 border border-gray-200">
                                <span className="text-[10px] font-bold text-[#2F6FA8] block">{score}đ</span>
                                <input
                                  type="number"
                                  step={0.1}
                                  value={sub[field] as number}
                                  onChange={e => handleUpdateSubCriterion(sub.key, field, Number(e.target.value))}
                                  className="w-full px-0.5 py-0.5 text-center font-mono font-bold rounded border border-gray-200 bg-white text-gray-900 text-[10px] outline-none"
                                />
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition text-xs cursor-pointer"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#2F6FA8] text-white font-bold hover:bg-[#1D3E61] transition flex items-center gap-2 text-xs shadow-2xs cursor-pointer"
            >
              <CheckCircle2 size={16} /> Tạo Tiêu Chí BSC Mới
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
