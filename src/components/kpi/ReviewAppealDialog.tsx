'use client'

import { useState } from 'react'
import type { ViolationRecord } from '@/lib/kpi-types'
import { mockViolationTypes } from '@/lib/mock-data-kpi'

interface Props {
  isOpen: boolean
  onClose: () => void
  violation: ViolationRecord | null
  onDecision: (id: string, decision: 'approved' | 'rejected', note: string) => void
}

export default function ReviewAppealDialog({ isOpen, onClose, violation, onDecision }: Props) {
  const [note, setNote] = useState('')
  if (!isOpen || !violation) return null

  const vType = mockViolationTypes.find(v => v.id === violation.violation_type_id)
  const valid = note.trim().length >= 5

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/40" />
      <div
        className="relative w-full max-w-lg rounded-t-2xl p-4 pb-8 max-h-[85vh] overflow-y-auto animate-slide-up"
        style={{ background: 'var(--bg-primary)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-3" style={{ background: 'var(--gray-300)' }} />
        <h3 className="text-sm font-bold mb-3">⚖️ Xét khiếu nại</h3>

        {/* Violation details */}
        <div className="space-y-2 mb-3 p-3 rounded-xl" style={{ background: 'var(--gray-50)' }}>
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold">{vType?.code}: {vType?.name}</span>
            <span className="text-sm font-black text-red-600">-{violation.penalty_points} điểm</span>
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            <strong>Mô tả:</strong> {violation.description}
          </div>
          {violation.evidence_url && (
            <div className="text-xs" style={{ color: 'var(--primary)' }}>📎 Có bằng chứng</div>
          )}
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            📅 Xảy ra: {new Date(violation.occurred_at).toLocaleDateString('vi-VN')}
            {' · '}Log: {new Date(violation.logged_at).toLocaleDateString('vi-VN')}
          </div>
        </div>

        {/* Appeal reason */}
        <div className="p-3 rounded-xl mb-3" style={{ background: '#ede9fe' }}>
          <div className="text-xs font-bold mb-1" style={{ color: '#6d28d9' }}>📝 Lý do khiếu nại</div>
          <div className="text-xs" style={{ color: 'var(--text-primary)' }}>{violation.appeal_reason}</div>
          <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>
            ⏰ Khiếu nại lúc: {violation.appeal_at ? new Date(violation.appeal_at).toLocaleString('vi-VN') : '—'}
          </div>
        </div>

        {/* Decision note */}
        <label className="text-xs font-bold block mb-1" style={{ color: 'var(--text-secondary)' }}>Ghi chú quyết định</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Nhập lý do quyết định..."
          rows={3}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none resize-none mb-3"
          style={{ border: '1px solid var(--gray-200)' }}
        />

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => { if (valid) { onDecision(violation.id, 'approved', note.trim()); setNote('') } }}
            disabled={!valid}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity"
            style={{ background: '#10b981', opacity: valid ? 1 : 0.5 }}
          >
            ✅ Chấp nhận (hoàn điểm)
          </button>
          <button
            onClick={() => { if (valid) { onDecision(violation.id, 'rejected', note.trim()); setNote('') } }}
            disabled={!valid}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-opacity"
            style={{ background: '#ef4444', opacity: valid ? 1 : 0.5 }}
          >
            ❌ Từ chối
          </button>
        </div>
        <button onClick={onClose} className="w-full mt-2 py-2 rounded-xl text-xs font-semibold"
          style={{ color: 'var(--text-muted)' }}>
          Đóng
        </button>
      </div>
    </div>
  )
}
