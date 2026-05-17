'use client'

import type { LevelConfig, KPIOptionType } from '@/lib/kpi-types'

interface Props {
  config: LevelConfig
  onEdit: (lv: LevelConfig) => void
}

const optionLabel: Record<KPIOptionType, string> = {
  A: 'Option A', B: 'Option B', C: 'Option C',
}
const optionColor: Record<KPIOptionType, string> = {
  A: '#3b82f6', B: '#8b5cf6', C: '#f59e0b',
}

export default function LevelRow({ config, onEdit }: Props) {
  return (
    <div className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
        style={{ background: `${optionColor[config.option_type]}15`, color: optionColor[config.option_type] }}
      >
        {config.level}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{config.name}</span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: `${optionColor[config.option_type]}15`, color: optionColor[config.option_type] }}
          >
            {optionLabel[config.option_type]}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          KPI ≥ {config.required_kpi_average} · {config.min_months_to_promote} tháng để thăng tiến
          {config.promotion_requires_ceo_approval && ' · Cần CEO duyệt'}
        </div>
      </div>

      <button
        onClick={() => onEdit(config)}
        className="text-xs px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50 flex-shrink-0"
      >
        Sửa
      </button>
    </div>
  )
}
