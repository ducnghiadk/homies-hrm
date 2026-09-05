'use client'

import React from 'react'
import type { LevelConfig, KPIOptionType } from '@/lib/kpi-types'
import { Edit3, CheckCircle2 } from 'lucide-react'

interface Props {
  config: LevelConfig
  onEdit: (lv: LevelConfig) => void
}

const optionLabel: Record<KPIOptionType, string> = {
  A: 'Option A (L0-L1)',
  B: 'Option B (L2-L3)',
  C: 'Option C (L4-L5)',
}

export default function LevelRow({ config, onEdit }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 px-4 hover:bg-blue-50/20 transition-all">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-mono font-bold shrink-0 bg-blue-50 text-[#2F6FA8] border border-blue-200">
          {config.level}
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-900">{config.name}</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 border border-gray-200">
              {optionLabel[config.option_type]}
            </span>
            {config.promotion_requires_ceo_approval && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Cần CEO phê duyệt
              </span>
            )}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 font-medium flex items-center gap-2 flex-wrap">
            <span>Yêu cầu thăng cấp:</span>
            <span>KPI trung bình <b className="font-mono text-gray-800">≥ {config.required_kpi_average} đ</b></span>
            <span>•</span>
            <span>Duy trì tối thiểu <b className="font-mono text-gray-800">{config.min_months_to_promote} tháng</b></span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onEdit(config)}
        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#2F6FA8] hover:text-white text-gray-700 font-bold text-[11px] transition flex items-center gap-1 shrink-0"
      >
        <Edit3 size={11} />
        <span>Sửa</span>
      </button>
    </div>
  )
}
