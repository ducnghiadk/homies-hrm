'use client'

import { useState } from 'react'

interface SmartFiltersProps {
  onFilter: (filter: { quick?: string; grade?: string; minScore?: number; maxScore?: number }) => void
  activeQuick?: string
}

const QUICK_FILTERS = [
  { key: 'attention', label: 'Cần hỗ trợ', icon: '⚠️' },
  { key: 'top', label: 'Top performers', icon: '🏆' },
  { key: 'violations', label: 'Có lỗi', icon: '🚨' },
  { key: 'promo', label: 'Đủ ĐK thăng tiến', icon: '🎯' },
]

export default function SmartFilters({ onFilter, activeQuick }: SmartFiltersProps) {
  const [active, setActive] = useState(activeQuick || '')
  const [showCustom, setShowCustom] = useState(false)
  const [grade, setGrade] = useState('')
  const [minScore, setMinScore] = useState('')
  const [maxScore, setMaxScore] = useState('')

  const handleQuick = (key: string) => {
    const next = active === key ? '' : key
    setActive(next)
    onFilter({ quick: next || undefined })
  }

  const handleCustom = () => {
    onFilter({
      grade: grade || undefined,
      minScore: minScore ? parseInt(minScore) : undefined,
      maxScore: maxScore ? parseInt(maxScore) : undefined,
    })
  }

  return (
    <div className="space-y-2 animate-fade-in">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>🔍 Bộ lọc</h4>
        <button onClick={() => setShowCustom(!showCustom)}
          className="text-[10px] font-bold" style={{ color: 'var(--primary)' }}>
          {showCustom ? 'Ẩn' : 'Tùy chỉnh'}
        </button>
      </div>

      {/* Quick filters */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {QUICK_FILTERS.map(f => (
          <button key={f.key}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all"
            style={{
              background: active === f.key ? 'var(--primary)' : 'var(--gray-50)',
              color: active === f.key ? 'white' : 'var(--text-secondary)',
            }}
            onClick={() => handleQuick(f.key)}>
            {f.icon} {f.label}
          </button>
        ))}
      </div>

      {/* Custom filters */}
      {showCustom && (
        <div className="card p-3 space-y-2 animate-slide-up">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Xếp loại</label>
              <select value={grade} onChange={e => setGrade(e.target.value)}
                className="w-full mt-0.5 px-2 py-1.5 rounded-lg text-xs border"
                style={{ borderColor: 'var(--gray-200)' }}>
                <option value="">Tất cả</option>
                <option value="excellent">Xuất sắc</option>
                <option value="good">Tốt</option>
                <option value="fair">Khá</option>
                <option value="average">Trung bình</option>
                <option value="poor">Yếu</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Từ</label>
              <input type="number" value={minScore} onChange={e => setMinScore(e.target.value)}
                placeholder="0" className="w-16 mt-0.5 px-2 py-1.5 rounded-lg text-xs border"
                style={{ borderColor: 'var(--gray-200)' }} />
            </div>
            <div>
              <label className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>Đến</label>
              <input type="number" value={maxScore} onChange={e => setMaxScore(e.target.value)}
                placeholder="100" className="w-16 mt-0.5 px-2 py-1.5 rounded-lg text-xs border"
                style={{ borderColor: 'var(--gray-200)' }} />
            </div>
          </div>
          <button onClick={handleCustom}
            className="w-full text-[10px] font-bold py-1.5 rounded-lg text-white"
            style={{ background: 'var(--primary)' }}>
            Áp dụng
          </button>
        </div>
      )}
    </div>
  )
}
