'use client'

import type { KPIGrade } from '@/lib/kpi-types'

interface Props {
  grade: KPIGrade
  onEdit: (g: KPIGrade) => void
}

export default function GradeRow({ grade, onEdit }: Props) {
  return (
    <div className="flex items-center gap-3 py-3 px-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="text-2xl flex-shrink-0">{grade.icon}</div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold">{grade.name}</span>
          <span className="text-xs text-gray-400">({grade.name_en})</span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          <span className="font-semibold" style={{ color: grade.color }}>
            {grade.min_score} – {grade.max_score} điểm
          </span>
          {grade.promotion_eligible && (
            <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-700">
              Đủ ĐK thăng tiến
            </span>
          )}
        </div>
      </div>

      <div
        className="w-8 h-3 rounded-full flex-shrink-0"
        style={{ background: grade.color }}
      />

      <button
        onClick={() => onEdit(grade)}
        className="text-xs px-2 py-1 rounded-lg text-blue-600 hover:bg-blue-50 flex-shrink-0"
      >
        Sửa
      </button>
    </div>
  )
}
