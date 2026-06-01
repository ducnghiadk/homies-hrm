'use client'

import { useState } from 'react'
import { CalendarDays, Flower2, Pencil } from 'lucide-react'

interface Season {
  name: string
  emoji: string
  months: string
  adjustment: number
}

const DEFAULT_SEASONS: Season[] = [
  { name: 'Mua he', emoji: '☀️', months: 'T6-T8', adjustment: 20 },
  { name: 'Tet', emoji: '🧧', months: 'T1', adjustment: 50 },
  { name: 'Binh thuong', emoji: '🍃', months: 'T2-T5, T9-T12', adjustment: 0 },
]

export function SeasonalSectionView({ onEdit }: { onEdit: () => void }) {
  const highestSeason = DEFAULT_SEASONS.reduce((best, season) => season.adjustment > best.adjustment ? season : best, DEFAULT_SEASONS[0])

  return (
    <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CalendarDays size={20} />
          </div>
          <div>
            <h3 className="flex items-center gap-1.5 font-bold text-gray-800">
              <Flower2 size={16} className="text-pink-500" />
              Dieu chinh theo mua
            </h3>
            <p className="text-xs text-gray-500">Dung de phong truoc cac dot tang giam doanh thu lon trong nam.</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/5"
        >
          <Pencil size={12} />
          Sua
        </button>
      </div>

      <div className="space-y-2">
        {DEFAULT_SEASONS.map((season) => (
          <div
            key={season.name}
            className={`flex items-center justify-between rounded-xl border p-3 text-sm ${
              season.adjustment > 0
                ? 'border-amber-100 bg-amber-50'
                : season.adjustment < 0
                  ? 'border-primary-100 bg-primary-50'
                  : 'border-gray-100 bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{season.emoji}</span>
              <div>
                <span className="font-medium text-gray-700">{season.name}</span>
                <span className="ml-2 text-xs text-gray-400">({season.months})</span>
              </div>
            </div>
            <span className="text-sm font-bold text-gray-700">
              {season.adjustment > 0 ? `+${season.adjustment}%` : `${season.adjustment}%`}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Mua can phong nhieu nhat</div>
        <p className="mt-2 text-sm text-gray-600">
          Hien tai <span className="font-semibold text-gray-800">{highestSeason.name}</span> dang co he so cao nhat
          la <span className="font-semibold text-amber-700">+{highestSeason.adjustment}%</span>. Nen dung muc nay
          de tranh thieu nguoi vao cac dot cao diem thuong nien.
        </p>
      </div>
    </div>
  )
}

export function SeasonalSectionEdit() {
  const [seasons, setSeasons] = useState<Season[]>(DEFAULT_SEASONS)

  const updateSeason = (index: number, field: keyof Season, value: string | number) => {
    setSeasons((prev) => prev.map((season, currentIndex) => (
      currentIndex === index ? { ...season, [field]: value } : season
    )))
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Dieu chinh nhan su theo mua vu. Neu co dot doanh thu tang dot bien, co the tang he so truoc de
        khi xep lich he thong da tinh du bo sung nguoi.
      </p>

      {seasons.map((season, index) => (
        <div key={`${season.name}-${index}`} className="space-y-3 rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Ten mua</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={season.name}
                onChange={(event) => updateSeason(index, 'name', event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Thang</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={season.months}
                onChange={(event) => updateSeason(index, 'months', event.target.value)}
                placeholder="T6-T8"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">Dieu chinh nhan su (%)</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={-50}
                max={100}
                className="flex-1"
                value={season.adjustment}
                onChange={(event) => updateSeason(index, 'adjustment', Number(event.target.value))}
              />
              <span className={`min-w-[56px] text-right text-sm font-bold ${
                season.adjustment > 0 ? 'text-amber-600' : season.adjustment < 0 ? 'text-primary-600' : 'text-gray-500'
              }`}>
                {season.adjustment > 0 ? '+' : ''}{season.adjustment}%
              </span>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={() => setSeasons((prev) => [...prev, { name: '', emoji: '📌', months: '', adjustment: 0 }])}
        className="w-full rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:border-primary/40 hover:text-primary"
      >
        + Them mua
      </button>
    </div>
  )
}
