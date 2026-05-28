'use client'

import type { ViolationType } from '@/lib/kpi-types'

interface Props {
  violation: ViolationType
  onEdit: (v: ViolationType) => void
  onDelete: (id: string) => void
  onToggle: (id: string, active: boolean) => void
}

const severityConfig = {
  minor:    { label: 'Nhẹ',         bg: '#dbeafe', color: '#1d4ed8' },
  medium:   { label: 'Trung bình',  bg: '#FFF8E8', color: '#b45309' },
  major:    { label: 'Nặng',        bg: '#fed7aa', color: '#c2410c' },
  critical: { label: 'Nghiêm trọng', bg: '#fee2e2', color: '#b91c1c' },
}

export default function ViolationRow({ violation, onEdit, onDelete, onToggle }: Props) {
  const sev = severityConfig[violation.severity]

  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors">
      <div className="w-12 text-center flex-shrink-0">
        <span className="text-xs font-mono font-bold text-gray-600">{violation.code}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">{violation.name}</span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{ background: sev.bg, color: sev.color }}
          >
            {sev.label}
          </span>
        </div>
        <div className="text-xs text-gray-400 mt-0.5 truncate">{violation.description}</div>
      </div>

      <div className="text-right flex-shrink-0">
        <div className="text-sm font-bold text-error-600">-{violation.penalty_points}</div>
        <div className="text-[10px] text-gray-400">điểm</div>
      </div>

      <button
        onClick={() => onToggle(violation.id, !violation.is_active)}
        className={`w-9 h-5 rounded-full transition-colors flex-shrink-0 relative ${
          violation.is_active ? 'bg-success-500' : 'bg-gray-300'
        }`}
      >
        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
          violation.is_active ? 'translate-x-4' : 'translate-x-0.5'
        }`} />
      </button>

      <div className="flex gap-1 flex-shrink-0">
        <button onClick={() => onEdit(violation)} className="text-xs px-2 py-1 rounded-lg text-primary-600 hover:bg-primary-50">Sửa</button>
        <button onClick={() => onDelete(violation.id)} className="text-xs px-2 py-1 rounded-lg text-error-500 hover:bg-error-50">Xóa</button>
      </div>
    </div>
  )
}
