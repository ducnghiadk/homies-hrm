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
  { label: 'Trua', startHour: 11, endHour: 14, extraStaff: 1 },
  { label: 'Toi', startHour: 17, endHour: 21, extraStaff: 2 },
]

export function PeakHoursSectionView({ onEdit }: { onEdit: () => void }) {
  const totalExtraStaff = DEFAULT_PEAKS.reduce((sum, peak) => sum + peak.extraStaff, 0)

  return (
    <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-primary/30 hover:shadow-md">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <Clock size={20} />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Gio cao diem</h3>
            <p className="text-xs text-gray-500">Khu nay cho biet luc nao can cong them nguoi de tranh vo ca.</p>
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

      <div className="mb-3 flex items-end gap-1">
        {Array.from({ length: 16 }, (_, index) => {
          const hour = 7 + index
          const peak = DEFAULT_PEAKS.find((item) => hour >= item.startHour && hour < item.endHour)

          return (
            <div key={hour} className="flex-1">
              <div
                className={`rounded-t transition-all ${peak ? 'bg-amber-400' : 'bg-gray-200'}`}
                style={{ height: peak ? `${40 + peak.extraStaff * 24}px` : '24px' }}
                title={`${hour}h`}
              />
            </div>
          )
        })}
      </div>
      <div className="mb-4 flex justify-between text-xs text-gray-400">
        <span>7h</span>
        <span>12h</span>
        <span>17h</span>
        <span>22h</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {DEFAULT_PEAKS.map((peak) => (
          <div key={peak.label} className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <div className="text-sm font-semibold text-gray-800">{peak.label}</div>
            <p className="mt-1 text-xs text-amber-700">{peak.startHour}h - {peak.endHour}h · +{peak.extraStaff} nguoi</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-gray-100 bg-vanilla-50 p-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">Tac dong nhin nhanh</div>
        <p className="mt-2 text-sm text-gray-600">
          Hien tai tong cong them {totalExtraStaff} luot nguoi cho cac khung dong khach.
          Neu don app tang manh sau 19h, nen uu tien cong vao khung toi truoc khi tang deu ca ngay.
        </p>
      </div>
    </div>
  )
}

export function PeakHoursSectionEdit() {
  const [peakHours, setPeakHours] = useState<PeakHour[]>(DEFAULT_PEAKS)

  const updatePeakHour = (index: number, field: keyof PeakHour, value: string | number) => {
    setPeakHours((prev) => prev.map((item, currentIndex) => (
      currentIndex === index ? { ...item, [field]: value } : item
    )))
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Dung muc nay de cong them nguoi cho khung dong khach. Nen nhap theo thuc te van hanh:
        trua dong tai quay, toi dong don app, cuoi tuan dong ca hai.
      </p>

      {peakHours.map((peakHour, index) => (
        <div key={`${peakHour.label}-${index}`} className="space-y-3 rounded-xl border border-gray-200 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs text-gray-500">Ten khung gio</label>
              <input
                type="text"
                className="w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={peakHour.label}
                onChange={(event) => updatePeakHour(index, 'label', event.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Bat dau</label>
              <input
                type="number"
                min={0}
                max={23}
                className="w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={peakHour.startHour}
                onChange={(event) => updatePeakHour(index, 'startHour', Number(event.target.value))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-gray-500">Ket thuc</label>
              <input
                type="number"
                min={0}
                max={23}
                className="w-full rounded-lg border border-gray-200 p-2 text-sm"
                value={peakHour.endHour}
                onChange={(event) => updatePeakHour(index, 'endHour', Number(event.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs text-gray-500">Cong them nhan su</label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={0}
                max={5}
                className="flex-1"
                value={peakHour.extraStaff}
                onChange={(event) => updatePeakHour(index, 'extraStaff', Number(event.target.value))}
              />
              <span className="min-w-[80px] text-right text-sm font-bold text-amber-600">
                +{peakHour.extraStaff} nguoi
              </span>
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setPeakHours((prev) => [...prev, { label: '', startHour: 0, endHour: 0, extraStaff: 0 }])}
        className="w-full rounded-xl border-2 border-dashed border-gray-200 py-2.5 text-sm font-medium text-gray-500 transition-colors hover:border-primary/40 hover:text-primary"
      >
        + Them khung gio cao diem
      </button>
    </div>
  )
}
