'use client'

import type { KPICriteria } from '@/lib/kpi-types'

interface Props {
  criteria: KPICriteria
  open: boolean
  onClose: () => void
}

const DEFAULT_STAR_GUIDE: Record<number, { label: string; desc: string }> = {
  1: { label: 'Rất kém',    desc: 'Không đạt yêu cầu cơ bản, cần cải thiện ngay' },
  2: { label: 'Kém',        desc: 'Dưới mức trung bình, cần hỗ trợ và giám sát' },
  3: { label: 'Trung bình', desc: 'Đạt yêu cầu cơ bản, hoàn thành nhiệm vụ' },
  4: { label: 'Tốt',        desc: 'Vượt mong đợi, chủ động và hiệu quả' },
  5: { label: 'Xuất sắc',   desc: 'Thể hiện xuất sắc, là tấm gương cho team' },
}

export default function RatingGuideSheet({ criteria, open, onClose }: Props) {
  if (!open) return null

  const maxStars = criteria.max_value || 5
  const guide = criteria.rating_guide
  const stars = Array.from({ length: maxStars }, (_, i) => i + 1)

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg rounded-t-2xl p-4 pb-8 max-h-[80vh] overflow-y-auto animate-slide-up"
        style={{ background: 'var(--bg-primary)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background: 'var(--gray-300)' }} />

        <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
          📖 Hướng dẫn chấm điểm
        </h3>
        <p className="text-xs mb-3" style={{ color: 'var(--text-secondary)' }}>{criteria.name}</p>
        {criteria.description && (
          <p className="text-[11px] mb-4 px-3 py-2 rounded-lg" style={{ background: 'var(--gray-50)', color: 'var(--text-muted)' }}>
            {criteria.description}
          </p>
        )}

        {criteria.input_type === 'star' ? (
          <div className="space-y-3">
            {stars.map(star => {
              const defaultG = DEFAULT_STAR_GUIDE[star]
              return (
                <div key={star} className="flex gap-3 items-start">
                  <div className="flex gap-0.5 flex-shrink-0 mt-0.5">
                    {Array.from({ length: star }, (_, j) => (
                      <span key={j} className="text-xs">⭐</span>
                    ))}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {defaultG?.label ?? `${star} điểm`}
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {guide ?? defaultG?.desc ?? ''}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : criteria.input_type === 'percent' ? (
          <div className="space-y-2 text-xs">
            <div><span className="font-bold" style={{ color: '#1E9E57' }}>90-100%:</span> Xuất sắc</div>
            <div><span className="font-bold" style={{ color: '#2F6FA8' }}>80-89%:</span> Tốt</div>
            <div><span className="font-bold" style={{ color: '#F6C85F' }}>70-79%:</span> Trung bình</div>
            <div><span className="font-bold" style={{ color: '#D9381E' }}>&lt;70%:</span> Cần cải thiện</div>
          </div>
        ) : (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Nhập giá trị từ 0 đến {criteria.max_value}. Mục tiêu: {criteria.target_operator} {criteria.target_value}.
          </p>
        )}

        <button onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl text-sm font-bold text-white"
          style={{ background: 'var(--primary)' }}>
          Đã hiểu
        </button>
      </div>
    </div>
  )
}
