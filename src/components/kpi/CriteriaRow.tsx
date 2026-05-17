'use client'

import type { KPICriteria } from '@/lib/kpi-types'

interface Props {
  criteria: KPICriteria
  onEdit: (cri: KPICriteria) => void
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
}

const inputLabel: Record<string, string> = {
  star: '⭐ Sao', percent: '📊 %', number: '🔢 Số', boolean: '✅ Có/Không',
}

export default function CriteriaRow({ criteria, onEdit, onDelete, onToggle }: Props) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold">{criteria.name}</span>
          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {inputLabel[criteria.input_type] || criteria.input_type}
          </span>
          {criteria.auto_source && (
            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600">
              Auto
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          Mục tiêu: {criteria.target_operator} {criteria.target_value}{criteria.input_type === 'percent' ? '%' : ''}
          {criteria.description && ` · ${criteria.description}`}
        </div>
      </div>

      <button
        onClick={() => onToggle(criteria.id, !criteria.is_active)}
        className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${
          criteria.is_active ? 'bg-green-500' : 'bg-gray-300'
        }`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          criteria.is_active ? 'translate-x-4' : 'translate-x-0.5'
        }`} />
      </button>

      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => onEdit(criteria)} className="text-xs px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50">Sửa</button>
        <button onClick={() => onDelete(criteria.id)} className="text-xs px-2 py-1 rounded-lg text-red-500 hover:bg-red-50">Xóa</button>
      </div>
    </div>
  )
}
