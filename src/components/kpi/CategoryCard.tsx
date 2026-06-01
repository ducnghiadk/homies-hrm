'use client'

import type { KPICategory } from '@/lib/kpi-types'

interface Props {
  category: KPICategory
  onEdit: (cat: KPICategory) => void
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
}

const typeBadge = {
  auto: { label: 'Tự động', bg: '#dbeafe', color: '#1d4ed8' },
  manual: { label: 'Thủ công', bg: '#FFF8E8', color: '#b45309' },
  deduction: { label: 'Trừ điểm', bg: '#fee2e2', color: '#b91c1c' },
}

export default function CategoryCard({ category, onEdit, onDelete, onToggle }: Props) {
  const badge = typeBadge[category.type]

  return (
    <div className="card p-3 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: `${category.color}15` }}
      >
        {category.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold truncate">{category.name}</span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          Trọng số: <span className="font-bold" style={{ color: category.color }}>{category.weight}%</span>
          {' · '}
          Đánh giá: {category.evaluators.join(', ')}
        </div>
      </div>

      {/* Active toggle */}
      <button
        onClick={() => onToggle(category.id, !category.is_active)}
        className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${
          category.is_active ? 'bg-success-500' : 'bg-gray-300'
        }`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          category.is_active ? 'translate-x-4' : 'translate-x-0.5'
        }`} />
      </button>

      {/* Actions */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(category)}
          className="text-xs px-2 py-1 rounded-lg text-primary-600 hover:bg-primary-50 transition-colors"
        >
          Sửa
        </button>
        <button
          onClick={() => onDelete(category.id)}
          className="text-xs px-2 py-1 rounded-lg text-error-500 hover:bg-error-50 transition-colors"
        >
          Xóa
        </button>
      </div>
    </div>
  )
}
