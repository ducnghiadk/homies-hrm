'use client'

import { useState } from 'react'
import { CalendarDays, Pencil, Flower2 } from 'lucide-react'

interface Season {
  name: string
  emoji: string
  months: string
  adjustment: number // percentage, e.g. 20 = +20%
}

const DEFAULT_SEASONS: Season[] = [
  { name: 'Mùa hè', emoji: '☀️', months: 'T6-T8', adjustment: 20 },
  { name: 'Tết', emoji: '🧧', months: 'T1', adjustment: 50 },
  { name: 'Bình thường', emoji: '🍃', months: 'T2-T5, T9-T12', adjustment: 0 },
]

// ── View Mode ──
export function SeasonalSectionView({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <CalendarDays size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
              <Flower2 size={16} className="text-pink-500" />
              Điều chỉnh theo mùa
            </h3>
            <p className="text-xs text-gray-500">Tăng/giảm nhân sự theo mùa vụ</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          <Pencil size={12} /> Sửa
        </button>
      </div>

      <div className="space-y-2">
        {DEFAULT_SEASONS.map(season => (
          <div
            key={season.name}
            className={`flex items-center justify-between p-3 rounded-xl text-sm ${
              season.adjustment > 0
                ? 'bg-orange-50 border border-orange-100'
                : 'bg-gray-50 border border-gray-100'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{season.emoji}</span>
              <div>
                <span className="font-medium text-gray-700">{season.name}</span>
                <span className="text-xs text-gray-400 ml-2">({season.months})</span>
              </div>
            </div>
            <span className={`font-bold text-sm ${
              season.adjustment > 0 ? 'text-orange-600' : 'text-gray-500'
            }`}>
              {season.adjustment > 0 ? `+${season.adjustment}%` : 'Không đổi'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Edit Mode ──
export function SeasonalSectionEdit() {
  const [seasons, setSeasons] = useState<Season[]>(DEFAULT_SEASONS)

  const updateSeason = (idx: number, field: keyof Season, value: string | number) => {
    setSeasons(prev => prev.map((s, i) =>
      i === idx ? { ...s, [field]: value } : s
    ))
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Điều chỉnh nhân sự theo mùa vụ. Ví dụ: tăng 20% vào mùa hè.
      </p>

      {seasons.map((season, idx) => (
        <div key={idx} className="p-4 rounded-xl border border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tên mùa</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                value={season.name}
                onChange={e => updateSeason(idx, 'name', e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Tháng</label>
              <input
                type="text"
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                value={season.months}
                onChange={e => updateSeason(idx, 'months', e.target.value)}
                placeholder="T6-T8"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Điều chỉnh nhân sự (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={-50}
                max={100}
                className="flex-1"
                value={season.adjustment}
                onChange={e => updateSeason(idx, 'adjustment', Number(e.target.value))}
              />
              <span className={`text-sm font-bold min-w-[50px] text-right ${
                season.adjustment > 0 ? 'text-orange-600' : season.adjustment < 0 ? 'text-blue-600' : 'text-gray-500'
              }`}>
                {season.adjustment > 0 ? '+' : ''}{season.adjustment}%
              </span>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={() => setSeasons(prev => [...prev, { name: '', emoji: '📅', months: '', adjustment: 0 }])}
        className="w-full py-2.5 border-2 border-dashed border-gray-200 text-gray-500 text-sm font-medium rounded-xl hover:border-primary/40 hover:text-primary transition-colors"
      >
        + Thêm mùa
      </button>
    </div>
  )
}
