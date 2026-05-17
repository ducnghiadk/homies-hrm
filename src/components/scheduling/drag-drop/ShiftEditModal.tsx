'use client'

import { useState } from 'react'
import { X, Trash2, Save, Pencil, Clock, Coffee, Shirt, FileText } from 'lucide-react'
import type { ScheduleShift } from '@/lib/mock-data-smart-schedule'

interface ShiftEditModalProps {
  shift: ScheduleShift
  onSave: (updated: ScheduleShift) => void
  onDelete: (shiftId: string) => void
  onClose: () => void
}

const HOUR_OPTIONS = Array.from({ length: 17 }, (_, i) => {
  const h = 7 + i
  return `${h.toString().padStart(2, '0')}:00`
})

const POSITION_OPTIONS = [
  { value: 'barista', label: 'Pha chế' },
  { value: 'cashier', label: 'Thu ngân' },
  { value: 'support', label: 'Hỗ trợ' },
  { value: 'store_manager', label: 'Quản lý' },
]

export default function ShiftEditModal({ shift, onSave, onDelete, onClose }: ShiftEditModalProps) {
  const [startTime, setStartTime] = useState(shift.startTime)
  const [endTime, setEndTime] = useState(shift.endTime)
  const [breakMinutes, setBreakMinutes] = useState(shift.breakMinutes)
  const [position, setPosition] = useState(shift.position)
  const [note, setNote] = useState('')

  const handleSave = () => {
    onSave({
      ...shift,
      startTime,
      endTime,
      breakMinutes,
      position: position as ScheduleShift['position'],
    })
  }

  const isValid = startTime < endTime

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Pencil size={16} className="text-primary" /> Sửa ca làm việc
          </h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Employee name */}
        <div className="px-4 pt-3 pb-1">
          <div className="text-sm font-semibold text-primary">{shift.employeeName}</div>
          <div className="text-xs text-gray-500">Ngày: {shift.date}</div>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Start Time */}
          <div>
            <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
              <Clock size={12} /> Giờ bắt đầu
            </label>
            <select
              value={startTime}
              onChange={e => setStartTime(e.target.value)}
              className="w-full mt-1 p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {HOUR_OPTIONS.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
          </div>

          {/* End Time */}
          <div>
            <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
              <Clock size={12} /> Giờ kết thúc
            </label>
            <select
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="w-full mt-1 p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {HOUR_OPTIONS.map(h => (
                <option key={h} value={h}>{h}</option>
              ))}
            </select>
            {!isValid && (
              <p className="text-xs text-red-500 mt-1">Giờ kết thúc phải sau giờ bắt đầu</p>
            )}
          </div>

          {/* Break */}
          <div>
            <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
              <Coffee size={12} /> Nghỉ giữa ca
            </label>
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                min={0} max={120} step={15}
                value={breakMinutes}
                onChange={e => setBreakMinutes(Number(e.target.value))}
                className="w-20 p-2.5 border rounded-xl text-sm text-center focus:ring-2 focus:ring-primary/30 focus:border-primary"
              />
              <span className="text-sm text-gray-500">phút</span>
            </div>
          </div>

          {/* Position */}
          <div>
            <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5">
              <Shirt size={12} /> Vị trí
            </label>
            <select
              value={position}
              onChange={e => setPosition(e.target.value as ScheduleShift['position'])}
              className="w-full mt-1 p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
            >
              {POSITION_OPTIONS.map(p => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-medium text-gray-600 flex items-center gap-1.5"><FileText size={12} /> Ghi chú</label>
            <input
              type="text"
              placeholder="Ghi chú (tùy chọn)"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full mt-1 p-2.5 border rounded-xl text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t flex justify-between items-center">
          <button
            onClick={() => { if (confirm('Xóa ca này?')) onDelete(shift.id) }}
            className="flex items-center gap-1.5 px-3 py-2 text-red-600 text-sm font-medium rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 size={16} /> Xóa ca này
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={!isValid}
              className="flex items-center gap-1.5 px-5 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
            >
              <Save size={16} /> Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
