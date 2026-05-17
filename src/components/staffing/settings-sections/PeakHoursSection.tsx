'use client'

import { useState } from 'react'
import { Clock, Pencil } from 'lucide-react'

interface PeakHour {
  label: string
  startHour: number
  endHour: number
  extraStaff: number
}

const DEFAULT_PEAKS: PeakHour[] = [
  { label: 'Trưa', startHour: 11, endHour: 14, extraStaff: 1 },
  { label: 'Tối', startHour: 17, endHour: 21, extraStaff: 2 },
]

// ── View Mode ──
export function PeakHoursSectionView({ onEdit }: { onEdit: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:border-primary/30 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Clock size={20} className="text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 flex items-center gap-1.5">
              <Clock size={16} className="text-orange-600" />
              Giờ cao điểm
            </h3>
            <p className="text-xs text-gray-500">Điều chỉnh nhân sự theo khung giờ</p>
          </div>
        </div>
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors"
        >
          <Pencil size={12} /> Sửa
        </button>
      </div>

      {/* Mini bar chart */}
      <div className="flex items-end gap-1 h-12 mb-3">
        {Array.from({ length: 16 }, (_, i) => {
          const hour = 7 + i
          const isPeak = DEFAULT_PEAKS.some(p => hour >= p.startHour && hour < p.endHour)
          return (
            <div
              key={hour}
              className={`flex-1 rounded-t transition-all ${isPeak ? 'bg-orange-400' : 'bg-gray-200'}`}
              style={{ height: isPeak ? '100%' : '30%' }}
              title={`${hour}h${isPeak ? ' (cao điểm)' : ''}`}
            />
          )
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-400 mb-3">
        <span>7h</span><span>12h</span><span>17h</span><span>22h</span>
      </div>

      {/* Summary */}
      <div className="space-y-1.5 text-sm text-gray-600">
        {DEFAULT_PEAKS.map(p => (
          <div key={p.label} className="flex justify-between">
            <span>{p.label} ({p.startHour}h-{p.endHour}h):</span>
            <span className="font-bold text-orange-600">+{p.extraStaff} người</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Edit Mode (inside EditDrawer) ──
export function PeakHoursSectionEdit({ onSave }: { onSave?: () => void }) {
  const [peaks, setPeaks] = useState<PeakHour[]>(DEFAULT_PEAKS)

  const updatePeak = (idx: number, field: keyof PeakHour, value: number) => {
    setPeaks(prev => prev.map((p, i) =>
      i === idx ? { ...p, [field]: value } : p
    ))
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Thiết lập khung giờ cao điểm và số nhân viên cần thêm.
      </p>

      {peaks.map((peak, idx) => (
        <div key={idx} className="p-4 rounded-xl border border-gray-200 space-y-3">
          <div className="font-medium text-gray-700 text-sm">{peak.label}</div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Bắt đầu</label>
              <select
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                value={peak.startHour}
                onChange={e => updatePeak(idx, 'startHour', Number(e.target.value))}
              >
                {Array.from({ length: 16 }, (_, i) => i + 7).map(h => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Kết thúc</label>
              <select
                className="w-full p-2 border border-gray-200 rounded-lg text-sm"
                value={peak.endHour}
                onChange={e => updatePeak(idx, 'endHour', Number(e.target.value))}
              >
                {Array.from({ length: 16 }, (_, i) => i + 7).map(h => (
                  <option key={h} value={h}>{h}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Thêm</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={5}
                  className="w-16 p-2 border border-gray-200 rounded-lg text-sm text-center"
                  value={peak.extraStaff}
                  onChange={e => updatePeak(idx, 'extraStaff', Number(e.target.value))}
                />
                <span className="text-xs text-gray-500">người</span>
              </div>
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={() => setPeaks(prev => [...prev, { label: `Khung ${prev.length + 1}`, startHour: 12, endHour: 14, extraStaff: 1 }])}
        className="w-full py-2.5 border-2 border-dashed border-gray-200 text-gray-500 text-sm font-medium rounded-xl hover:border-primary/40 hover:text-primary transition-colors"
      >
        + Thêm khung giờ
      </button>
    </div>
  )
}
