'use client'

import React, { useState } from 'react'
import { X, Shield, Settings, CheckCircle2 } from 'lucide-react'

interface BSCAddErrorGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (newGroup: {
    key: string
    kind: 'operation' | 'personal'
    name: string
    points: number
    examples: string[]
    detection_mode: 'auto_attendance' | 'manual_manager' | 'qa_audit'
    is_critical: boolean
  }) => void
}

export default function BSCAddErrorGroupModal({
  isOpen,
  onClose,
  onSave,
}: BSCAddErrorGroupModalProps) {
  const [kind, setKind] = useState<'operation' | 'personal'>('operation')
  const [name, setName] = useState('')
  const [points, setPoints] = useState(1)
  const [examplesText, setExamplesText] = useState('')
  const [detectionMode, setDetectionMode] = useState<'auto_attendance' | 'manual_manager' | 'qa_audit'>('manual_manager')
  const [isCritical, setIsCritical] = useState(false)

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) {
      alert('Vui lòng nhập tên nhóm lỗi mới!')
      return
    }

    const examples = examplesText
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean)

    if (examples.length === 0) {
      examples.push('Vi phạm quy trình vận hành ca')
    }

    const key = `custom_${kind}_${Date.now()}`

    onSave({
      key,
      kind,
      name: name.trim(),
      points: Number(points) || 1,
      examples,
      detection_mode: detectionMode,
      is_critical: isCritical,
    })

    // Reset form
    setName('')
    setPoints(1)
    setExamplesText('')
    setIsCritical(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in text-xs">
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-100 text-rose-700">
              <Shield size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Tạo Nhóm Lỗi &amp; Kỷ Luật Mới (Apple SaaS)</h2>
              <p className="text-xs text-gray-600 font-medium">Bổ sung nhóm lỗi mới vào hệ thống cài đặt chuẩn Homies</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-200/80 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {/* 1. Phân loại lỗi */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-800">1. Phân Loại Nhóm Lỗi (*)</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setKind('operation')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition ${
                  kind === 'operation'
                    ? 'border-primary bg-primary/5 text-primary font-bold shadow-2xs'
                    : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}
              >
                <Settings size={18} />
                <div>
                  <span className="block font-bold">Lỗi Vận Hành Ca</span>
                  <span className="text-[10px] text-gray-500 font-normal">Trừ điểm BSC Cửa Hàng</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setKind('personal')}
                className={`p-3 rounded-2xl border text-left flex items-center gap-2 transition ${
                  kind === 'personal'
                    ? 'border-rose-600 bg-rose-50 text-rose-900 font-bold shadow-2xs'
                    : 'border-gray-200 bg-gray-50 text-gray-700'
                }`}
              >
                <Shield size={18} />
                <div>
                  <span className="block font-bold">Lỗi Cá Nhân</span>
                  <span className="text-[10px] text-gray-500 font-normal">Trừ % Thưởng Nhân Viên</span>
                </div>
              </button>
            </div>
          </div>

          {/* 2. Tên nhóm lỗi & Điểm phạt */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="font-bold text-gray-800">2. Tên Nhóm Lỗi Mới (*)</label>
              <input
                type="text"
                required
                placeholder="VD: Không dọn rửa vòi sục sữa cuối ca"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-bold text-gray-900 outline-none focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-gray-800">3. Điểm Phạt (*)</label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={10}
                  required
                  value={points}
                  onChange={e => setPoints(Number(e.target.value))}
                  className="w-full pl-3.5 pr-10 py-2 rounded-xl border border-amber-300 bg-amber-50 font-black text-amber-950 text-sm outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-amber-800 text-xs">điểm</span>
              </div>
            </div>
          </div>

          {/* 4. Ví dụ vi phạm thực tế */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-800">4. Ví Dụ Vi Phạm Thực Tế (Mỗi dòng 1 ví dụ)</label>
            <textarea
              rows={2}
              placeholder="VD: Vòi sục sữa dính bọt mảng bám&#10;Không ngâm ca đong sau khi pha trà sữa"
              value={examplesText}
              onChange={e => setExamplesText(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-gray-200 font-medium text-gray-800 outline-none focus:border-primary"
            />
          </div>

          {/* 5. Cơ chế phát hiện lỗi */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-800">5. Cơ Chế Phát Hiện Lỗi (Nguồn Dữ Liệu)</label>
            <select
              value={detectionMode}
              onChange={e => setDetectionMode(e.target.value as 'auto_attendance' | 'manual_manager' | 'qa_audit')}
              className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-bold text-gray-800 outline-none"
            >
              <option value="manual_manager">Trưởng Ca / Quản Lý Nhấp Ghi Tay 1-Click (Quầy Bar, SOP, Attitude)</option>
              <option value="auto_attendance">Tự Động Quét 100% Từ Máy Chấm Công (Đi trễ, Quên check-in/out)</option>
              <option value="qa_audit">QA Audit / Chuyên Viên Chuỗi Chấm Điểm Đột Xuất</option>
            </select>
          </div>

          {/* 6. Mức độ vi phạm & quy tắc khóa */}
          <div className="p-3.5 rounded-2xl border border-rose-200 bg-rose-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-bold text-rose-950 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCritical}
                  onChange={e => setIsCritical(e.target.checked)}
                  className="w-4 h-4 text-rose-600 rounded cursor-pointer"
                />
                <span>6. Đây Là Lỗi Đặc Biệt Nghiêm Trọng (Kích Hoạt Khóa 0đ)</span>
              </label>
              {isCritical && (
                <span className="text-[10px] bg-rose-600 text-white font-black px-2 py-0.5 rounded-md">
                  KHÓA 0đ TỰ ĐỘNG
                </span>
              )}
            </div>
            <p className="text-[11px] text-rose-900 font-medium">
              Nếu tích chọn, khi phát sinh lỗi này hệ thống sẽ tự động ép 0đ Vận Hành Ca hoặc 0đ Tiền Thưởng Cá Nhân ngay lập tức.
            </p>
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-gray-100 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl border border-gray-200 text-gray-700 font-bold hover:bg-gray-100 transition"
            >
              Hủy Bỏ
            </button>

            <button
              type="submit"
              className="px-6 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition flex items-center gap-2 shadow-2xs"
            >
              <CheckCircle2 size={16} /> Lưu Nhóm Lỗi Mới
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
