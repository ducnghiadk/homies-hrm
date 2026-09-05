'use client'

import React, { useState, useEffect } from 'react'
import { Settings, Save, CheckCircle2, Sliders, Shield, DollarSign, Lock } from 'lucide-react'
import {
  bscOperationErrorGroups,
  bscPersonalErrorGroups,
} from '@/lib/mock-data-bsc'
import { bscAdapter } from '@/lib/adapters/bsc-adapter'

interface BSCSettingsTabProps {
  storeId: string
  period: string
  onSettingsUpdated: () => void
}

export default function BSCSettingsTab({ storeId, period, onSettingsUpdated }: BSCSettingsTabProps) {
  const [profitThresholdDaily, setProfitThresholdDaily] = useState(6500000)
  const [targetDaily, setTargetDaily] = useState(8000000)
  const [actualDaily, setActualDaily] = useState(8240000)
  const [savedMessage, setSavedMessage] = useState(false)

  useEffect(() => {
    let isMounted = true
    async function loadCurrent() {
      const targets = await bscAdapter.getRevenueTargets(storeId, period)
      const found = targets.find(t => t.store_id === storeId && t.period === period)
      if (isMounted && found) {
        setProfitThresholdDaily(found.profit_threshold_daily || 6500000)
        setTargetDaily(found.target_daily || 8000000)
        setActualDaily(found.actual_revenue_daily || 8240000)
      }
    }
    loadCurrent()
    return () => { isMounted = false }
  }, [storeId, period])

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()

    await bscAdapter.saveRevenueTarget(storeId, period, {
      profit_threshold_daily: Number(profitThresholdDaily),
      target_daily: Number(targetDaily),
      actual_revenue_daily: Number(actualDaily),
    })

    setSavedMessage(true)
    onSettingsUpdated()
    setTimeout(() => setSavedMessage(false), 3000)
  }



  return (
    <div className="space-y-5 animate-fade-in">
      {/* Save Toast Notification */}
      {savedMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-fade-in shadow-2xs">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>Đã cập nhật mốc doanh thu & cài đặt BSC thành công! Hệ thống đã tính lại kết quả thưởng.</span>
        </div>
      )}

      {/* Target & Revenue Form */}
      <form onSubmit={handleSaveSettings} className="card p-5 rounded-2xl border border-gray-200/80 shadow-2xs bg-white space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Sliders size={18} className="text-primary" />
            <h3 className="text-sm font-bold text-gray-900">
              Cài Đặt Mốc Lợi Nhuận & Doanh Thu Mục Tiêu
            </h3>
          </div>
          <span className="text-xs text-gray-500 font-semibold">Kỳ xét: Tháng {period.slice(5)}/{period.slice(0, 4)}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Mốc Lợi Nhuận (Hòa Vốn) */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 flex items-center gap-1">
              <DollarSign size={13} className="text-emerald-600" />
              Mốc Doanh Thu Lợi Nhuận (Ngày)
            </label>
            <input
              type="number"
              step={100000}
              value={profitThresholdDaily}
              onChange={e => setProfitThresholdDaily(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 outline-none focus:border-primary focus:bg-white transition"
            />
            <span className="text-[10px] text-gray-400 font-medium">Bắt buộc ≥ mốc này để mở quỹ thưởng 1%</span>
          </div>

          {/* Doanh thu Target Ngày */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 flex items-center gap-1">
              <DollarSign size={13} className="text-primary" />
              Doanh Thu Mục Tiêu / Target (Ngày)
            </label>
            <input
              type="number"
              step={100000}
              value={targetDaily}
              onChange={e => setTargetDaily(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 outline-none focus:border-primary focus:bg-white transition"
            />
            <span className="text-[10px] text-gray-400 font-medium">Mốc tính điểm tiêu chí Doanh thu (100% target)</span>
          </div>

          {/* Doanh thu Thực tế Ngày (Simulated) */}
          <div className="space-y-1">
            <label className="font-bold text-gray-700 flex items-center gap-1">
              <DollarSign size={13} className="text-blue-600" />
              Doanh Thu Thực Tế TB (Ngày)
            </label>
            <input
              type="number"
              step={100000}
              value={actualDaily}
              onChange={e => setActualDaily(Number(e.target.value))}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 bg-gray-50 font-bold text-gray-900 outline-none focus:border-primary focus:bg-white transition"
            />
            <span className="text-[10px] text-gray-400 font-medium">Cập nhật thực tế để xem tự động chấm điểm</span>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2 border-t border-gray-100">
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-[#1D3E61] transition flex items-center gap-1.5 shadow-2xs"
          >
            <Save size={15} /> Lưu Cấu Hình Mốc Doanh Thu
          </button>
        </div>
      </form>

      {/* Rules & Error Penalties Reference Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Danh mục Lỗi Vận Hành Cửa Hàng */}
        <div className="card p-4 rounded-2xl border border-gray-200/80 shadow-2xs bg-white space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Settings size={18} className="text-primary" />
              <h4 className="text-xs font-bold text-gray-900">
                Quy Định Điểm Phạt Lỗi Vận Hành Cửa Hàng (10 Nhóm)
              </h4>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Lock size={12} className="inline mr-1" /> TỰ ĐỘNG KHÓA ĐIỂM
            </span>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs" style={{ scrollbarWidth: 'thin' }}>
            {bscOperationErrorGroups.map((grp) => (
              <div key={grp.key} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3">
                <div className="space-y-0.5 flex-1">
                  <div className="font-bold text-gray-800">{grp.name}</div>
                  <p className="text-[11px] text-gray-500">{grp.examples[0]}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[11px] text-gray-500 font-semibold">Trừ:</span>
                  <input
                    type="number"
                    min={1}
                    max={5}
                    value={grp.points}
                    onChange={e => {
                      grp.points = Number(e.target.value)
                      onSettingsUpdated()
                    }}
                    className="w-12 px-1.5 py-1 text-center font-black rounded-lg border border-amber-300 bg-amber-50 text-amber-900 outline-none"
                  />
                  <span className="text-[11px] text-gray-500 font-semibold">đ/lỗi</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Danh mục Lỗi Cá Nhân */}
        <div className="card p-4 rounded-2xl border border-gray-200/80 shadow-2xs bg-white space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-primary" />
              <h4 className="text-xs font-bold text-gray-900">
                Quy Định Điểm Phạt Lỗi Cá Nhân (9 Nhóm)
              </h4>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              <Lock size={12} className="inline mr-1" /> TỰ ĐỘNG KHÓA ĐIỂM
            </span>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1 text-xs" style={{ scrollbarWidth: 'thin' }}>
            {bscPersonalErrorGroups.map((grp) => (
              <div key={grp.key} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3">
                <div className="space-y-0.5 flex-1">
                  <div className="font-bold text-gray-800 flex items-center gap-1.5">
                    <span>{grp.name}</span>
                    {grp.is_serious && (
                      <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded">
                        KHÓA 0
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500">{grp.examples[0]}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[11px] text-gray-500 font-semibold">Phạt:</span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={grp.points}
                    onChange={e => {
                      grp.points = Number(e.target.value)
                      onSettingsUpdated()
                    }}
                    className="w-12 px-1.5 py-1 text-center font-black rounded-lg border border-rose-300 bg-rose-50 text-rose-900 outline-none"
                  />
                  <span className="text-[11px] text-gray-500 font-semibold">điểm</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
