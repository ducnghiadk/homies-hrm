'use client'

import React from 'react'
import type { KPIGrade } from '@/lib/kpi-types'
import { Award, Edit3, Sparkles } from 'lucide-react'

interface Props {
  grade: KPIGrade
  onEdit: (g: KPIGrade) => void
}

export default function GradeRow({ grade, onEdit }: Props) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 px-4 hover:bg-blue-50/20 transition-all">
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border"
          style={{
            backgroundColor: `${grade.color || '#2F6FA8'}15`,
            borderColor: `${grade.color || '#2F6FA8'}30`,
            color: grade.color || '#2F6FA8',
          }}
        >
          <Award size={16} />
        </div>

        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900">{grade.name}</span>
            <span className="text-[11px] text-gray-400 font-medium">({grade.name_en})</span>
            {grade.promotion_eligible && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Sparkles size={10} />
                Đủ ĐK xét thăng tiến
              </span>
            )}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5 font-medium flex items-center gap-2">
            <span>Khoảng điểm quy định:</span>
            <span className="font-mono font-bold tabular-nums" style={{ color: grade.color }}>
              {grade.min_score} – {grade.max_score} điểm
            </span>
          </div>
        </div>
      </div>

      <button
        onClick={() => onEdit(grade)}
        className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#2F6FA8] hover:text-white text-gray-700 font-bold text-[11px] transition flex items-center gap-1 shrink-0"
      >
        <Edit3 size={11} />
        <span>Sửa</span>
      </button>
    </div>
  )
}
