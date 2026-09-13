'use client'

import React, { useState } from 'react'
import {
  X,
  MessageSquare,
  Clock,
  Send,
} from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason: string) => void
  violationName: string
}

export default function AppealDialog({ isOpen, onClose, onSubmit, violationName }: Props) {
  const [reason, setReason] = useState('')

  if (!isOpen) return null

  const valid = reason.trim().length >= 20

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-gray-100 space-y-4 font-['Inter'] z-10 animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#001D3D]">
                Gửi Khiếu Nại Biên Bản Vi Phạm
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Ban Quản lý &amp; CEO sẽ tiếp nhận và xử lý trong 48 giờ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Thông tin biên bản lỗi */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1 text-xs">
          <span className="text-gray-500 font-medium">Biên bản vi phạm đang khiếu nại:</span>
          <div className="font-bold text-[#001D3D] text-sm">{violationName || 'Biên bản sự cố ca làm việc'}</div>
        </div>

        {/* Nhập lý do khiếu nại */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-800 block">
            Nội dung giải trình chi tiết <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Mô tả cụ thể bối cảnh sự việc, lý do khách quan hoặc căn cứ chứng minh sự cố không do lỗi chủ quan... (tối thiểu 20 ký tự)"
            rows={4}
            className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none resize-none border border-gray-200 focus:border-[#2F6FA8] focus:ring-2 focus:ring-[#2F6FA8]/10 text-gray-800 transition leading-relaxed"
          />
          <div className="flex items-center justify-between text-[11px]">
            <span className={valid ? 'text-emerald-600 font-bold' : 'text-gray-500'}>
              {reason.trim().length}/20 ký tự tối thiểu
            </span>
            <span className="text-gray-500 flex items-center gap-1 font-medium">
              <Clock size={12} className="text-amber-600" />
              Hạn gửi: Trong vòng 48h từ khi ghi nhận
            </span>
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={() => {
              if (valid) {
                onSubmit(reason.trim())
                setReason('')
              }
            }}
            disabled={!valid}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition cursor-pointer ${
              valid ? 'bg-[#2F6FA8] hover:bg-[#1D3E61] shadow-2xs' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <Send size={14} />
            <span>Gửi Khiếu Nại Ngay</span>
          </button>
        </div>
      </div>
    </div>
  )
}
