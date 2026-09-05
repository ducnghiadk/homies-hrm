'use client'

import React from 'react'
import type { ViolationType } from '@/lib/kpi-types'
import { Edit3, Trash2 } from 'lucide-react'

interface Props {
  violation: ViolationType
  onEdit: (v: ViolationType) => void
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
}

const severityConfig = {
  minor:    { label: 'Nhẹ (-5đ)',         class: 'bg-blue-50 text-[#2F6FA8] border-blue-200' },
  medium:   { label: 'Trung bình (-10đ)',  class: 'bg-amber-50 text-amber-800 border-amber-200' },
  major:    { label: 'Nặng (-20đ)',        class: 'bg-orange-50 text-orange-800 border-orange-200' },
  critical: { label: 'Nghiêm trọng (-50đ)', class: 'bg-rose-50 text-rose-700 border-rose-200' },
}

export default function ViolationRow({ violation, onEdit, onDelete, onToggle }: Props) {
  const sev = severityConfig[violation.severity] || severityConfig.minor

  return (
    <div className="flex items-center justify-between gap-3 py-3 px-4 hover:bg-blue-50/20 transition-all">
      <div className="w-12 text-center shrink-0">
        <span className="text-xs font-mono font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200">
          {violation.code}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-gray-900">{violation.name}</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${sev.class}`}>
            {sev.label}
          </span>
        </div>
        <div className="text-[11px] text-gray-500 mt-1 truncate font-medium">
          {violation.description}
        </div>
      </div>

      <div className="text-center shrink-0 px-2">
        <span className="text-xs font-bold font-mono tabular-nums text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-100">
          -{violation.penalty_points} đ
        </span>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => onToggle(violation.id, !violation.is_active)}
          className={`w-9 h-5 rounded-full transition-colors relative inline-block cursor-pointer ${
            violation.is_active ? 'bg-emerald-600' : 'bg-gray-300'
          }`}
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
              violation.is_active ? 'translate-x-4' : 'translate-x-0.5'
            }`}
          />
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(violation)}
            className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#2F6FA8] hover:text-white text-gray-700 font-bold text-[11px] transition flex items-center gap-1"
          >
            <Edit3 size={11} />
            <span>Sửa</span>
          </button>
          <button
            onClick={() => onDelete(violation.id)}
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
