'use client'

import { useState } from 'react'

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
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg rounded-t-2xl p-4 pb-8 animate-slide-up"
        style={{ background: 'var(--bg-primary)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background: 'var(--gray-300)' }} />
        <h3 className="text-sm font-bold mb-1">🔔 Khiếu nại lỗi</h3>
        <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
          Lỗi: <strong>{violationName}</strong>
        </p>

        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Nhập lý do khiếu nại (tối thiểu 20 ký tự)..."
          rows={4}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none"
          style={{ border: '1px solid var(--gray-200)' }}
        />
        <div className="flex items-center justify-between mt-1 mb-3">
          <span className="text-[10px]" style={{ color: valid ? '#10b981' : '#ef4444' }}>
            {reason.length}/20 ký tự tối thiểu
          </span>
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            ⏳ Hạn khiếu nại: 48h từ khi log
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}
          >
            Hủy
          </button>
          <button
            onClick={() => { if (valid) { onSubmit(reason.trim()); setReason('') } }}
            disabled={!valid}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity"
            style={{ background: '#7c3aed', opacity: valid ? 1 : 0.5 }}
          >
            Gửi khiếu nại
          </button>
        </div>
      </div>
    </div>
  )
}
