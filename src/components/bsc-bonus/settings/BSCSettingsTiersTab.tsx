'use client'

import React from 'react'
import { Trophy } from 'lucide-react'
import { bscBonusTiersCatalog, updateBSCBonusTier } from '@/lib/mock-data-bsc'

interface BSCSettingsTiersTabProps {
  isCEOOrHR: boolean
  onNotify: (msg: string) => void
}

export default function BSCSettingsTiersTab({
  isCEOOrHR,
  onNotify,
}: BSCSettingsTiersTabProps) {
  return (
    <div className="card p-5 sm:p-6 rounded-2xl border border-gray-100 bg-white shadow-xs space-y-5 animate-fade-in text-sm">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3.5 flex-wrap gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-amber-100/80 text-amber-900 flex items-center justify-center flex-shrink-0 border border-amber-200">
            <Trophy size={20} className="text-amber-700" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#001D3D]">
              Bảng Mức Thưởng Theo Điểm Đạt Được (120% / 100% / 70% / 40% / 0%)
            </h3>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Cấu hình tỷ lệ % tiền thưởng của Quỹ Nền dựa trên tổng điểm BSC cửa hàng đạt được</p>
          </div>
        </div>
        <span className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
          5 Tầng Thưởng
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {bscBonusTiersCatalog.map((tier, idx) => (
          <div key={tier.id} className="p-4 sm:p-5 rounded-2xl border border-gray-200/80 bg-gray-50/70 space-y-3 shadow-2xs">
            <div className="flex justify-between items-center font-bold">
              <span className="text-[#001D3D] text-xs font-extrabold">Tầng {idx + 1}</span>
              <span className={`px-2.5 py-0.5 rounded text-xs font-black border font-mono ${tier.badge_color}`}>
                {tier.bonus_percent}% QUỸ
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700">Tên tầng thưởng</label>
              <input
                type="text"
                disabled={!isCEOOrHR}
                value={tier.label}
                onChange={e => {
                  updateBSCBonusTier(tier.id, { label: e.target.value })
                  onNotify('Đã cập nhật tên tầng thưởng!')
                }}
                className="w-full px-2.5 py-1.5 min-h-[38px] rounded-xl border border-gray-200 bg-white font-bold text-gray-900 text-xs outline-none focus:border-[#2F6FA8]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-gray-600 font-semibold">Điểm từ</label>
                <input
                  type="number"
                  step={0.1}
                  disabled={!isCEOOrHR}
                  value={tier.min_score}
                  onChange={e => {
                    updateBSCBonusTier(tier.id, { min_score: Number(e.target.value) })
                    onNotify('Đã cập nhật khung điểm thưởng!')
                  }}
                  className="w-full px-2 py-1.5 min-h-[38px] text-center rounded-xl border border-gray-200 bg-white font-black text-gray-900 text-xs outline-none focus:border-[#2F6FA8] font-mono tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-gray-600 font-semibold">Đến điểm</label>
                <input
                  type="number"
                  step={0.1}
                  disabled={!isCEOOrHR}
                  value={tier.max_score}
                  onChange={e => {
                    updateBSCBonusTier(tier.id, { max_score: Number(e.target.value) })
                    onNotify('Đã cập nhật khung điểm thưởng!')
                  }}
                  className="w-full px-2 py-1.5 min-h-[38px] text-center rounded-xl border border-gray-200 bg-white font-black text-gray-900 text-xs outline-none focus:border-[#2F6FA8] font-mono tabular-nums"
                />
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t border-gray-200/60">
              <label className="text-xs font-bold text-emerald-800">% Hưởng Quỹ Thưởng</label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={200}
                  disabled={!isCEOOrHR}
                  value={tier.bonus_percent}
                  onChange={e => {
                    updateBSCBonusTier(tier.id, { bonus_percent: Number(e.target.value) })
                    onNotify('Đã cập nhật % tiền thưởng!')
                  }}
                  className="w-full pl-2.5 pr-6 py-1.5 min-h-[38px] rounded-xl border border-emerald-300 bg-emerald-50/50 font-black text-emerald-900 text-xs outline-none font-mono tabular-nums"
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 font-bold text-emerald-700 text-xs">%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
