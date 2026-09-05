'use client'

import React from 'react'
import type { KPICriteria } from '@/lib/kpi-types'
import { Edit3, Trash2, Zap, Star, Percent, Hash, CheckSquare } from 'lucide-react'

interface Props {
  criteria: KPICriteria
  onEdit: (cri: KPICriteria) => void
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
}

const inputBadge: Record<string, { label: string; class: string }> = {
  star: { label: 'Thang điểm Sao (1-5)', class: 'bg-amber-50 text-amber-800 border-amber-200' },
  percent: { label: 'Tỷ lệ Phần trăm (%)', class: 'bg-blue-50 text-[#2F6FA8] border-blue-200' },
  number: { label: 'Số lượng thực tế', class: 'bg-purple-50 text-purple-700 border-purple-200' },
  boolean: { label: 'Đạt / Không đạt', class: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
}

export default function CriteriaRow({ criteria, onEdit, onDelete, onToggle }: Props) {
  const badgeInfo = inputBadge[criteria.input_type] || { label: criteria.input_type, class: 'bg-gray-50 text-gray-700 border-gray-200' }

  return (
    <div className="flex items-center justify-between gap-3 py-3 px-4 hover:bg-blue-50/20 transition-all">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-900">{criteria.name}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badgeInfo.class}`}>
            {badgeInfo.label}
          </span>
          {criteria.auto_source && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100/80 text-[#2F6FA8]">
              Tự động từ dữ liệu ca
            </span>
          )}
        </div>
        <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-2 flex-wrap font-medium">
          <span>Mục tiêu: <b className="font-mono text-gray-800">{criteria.target_operator} {criteria.target_value}{criteria.input_type === 'percent' ? '%' : ''}</b></span>
          {criteria.description && <span>• {criteria.description}</span>}
          {criteria.rating_guide && <span className="text-gray-400">({criteria.rating_guide})</span>}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onToggle(criteria.id, !criteria.is_active)}
          className={`w-9 h-5 rounded-full transition-colors relative inline-block cursor-pointer ${
            criteria.is_active ? 'bg-emerald-600' : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
              criteria.is_active ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(criteria)}
            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#2F6FA8] hover:text-white text-gray-700 font-bold text-[11px] transition flex items-center gap-1"
          >
            <Edit3 size={11} />
            <span>Sửa</span>
          </button>
          <button
            onClick={() => onDelete(criteria.id)}
            className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-700 font-bold text-[11px] border border-rose-100 transition flex items-center gap-1"
          >
            <Trash2 size={11} />
            <span>Xóa</span>
          </button>
        </div>
      </div>
    </div>
  )
}
