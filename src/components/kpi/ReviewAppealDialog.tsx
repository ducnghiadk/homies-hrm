'use client'

import React, { useState } from 'react'
import type { ViolationRecord } from '@/lib/kpi-types'
import { mockViolationTypes } from '@/lib/mock-data-kpi'
import { mockEmployees } from '@/lib/mock-data'
import {
  X,
  Scale,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Eye,
} from 'lucide-react'

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
  const emp = mockEmployees.find(e => e.id === violation.employee_id)
  const empName = emp?.full_name || violation.employee_id
  const empRole = emp?.role === 'store_manager' ? 'Quản lý' : emp?.role === 'shift_leader' ? 'Trưởng ca' : 'Nhân viên'
  const valid = note.trim().length >= 5

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Container */}
      <div
        className="relative w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto space-y-4 font-['Inter'] z-10 animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2F6FA8] flex items-center justify-center border border-blue-100">
              <Scale size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#001D3D]">
                Xét Duyệt Khiếu Nại Biên Bản
              </h3>
              <p className="text-xs text-gray-500 font-medium">
                Đánh giá giải trình và đưa ra phán quyết kỷ luật
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

        {/* Thông tin biên bản sự cố */}
        <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#001D3D] text-sm">{empName}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white border border-gray-200 text-gray-700">
                {empRole}
              </span>
            </div>
            <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-lg border border-rose-200">
              -{violation.penalty_points} điểm
            </span>
          </div>

          <div className="text-gray-700 space-y-1">
            <div>
              <span className="font-bold text-gray-900">Loại vi phạm:</span> {vType?.code ? `[${vType.code}] ` : ''}{vType?.name || 'Sự cố vận hành'}
            </div>
            <div>
              <span className="font-bold text-gray-900">Mô tả vi phạm:</span> {violation.description}
            </div>
            <div className="text-[11px] text-gray-500 flex items-center gap-3 pt-1">
              <span>Xảy ra: {new Date(violation.occurred_at || violation.logged_at).toLocaleDateString('vi-VN')}</span>
              <span>Ghi nhận: {new Date(violation.logged_at).toLocaleDateString('vi-VN')}</span>
              {violation.evidence_url && (
                <span className="text-[#2F6FA8] font-bold flex items-center gap-1">
                  <Eye size={12} /> Có bằng chứng
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Khung giải trình của nhân sự */}
        <div className="p-3.5 rounded-xl bg-[#F4F8FC] border border-blue-100 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 font-bold text-[#2F6FA8]">
              <MessageSquare size={14} />
              <span>Giải trình của nhân sự:</span>
            </div>
            <span className="text-[10px] text-gray-500">
              {violation.appeal_at ? new Date(violation.appeal_at).toLocaleString('vi-VN') : '—'}
            </span>
          </div>
          <p className="text-gray-800 leading-relaxed font-normal bg-white/80 p-2.5 rounded-lg border border-blue-100/60">
            &ldquo;{violation.appeal_reason}&rdquo;
          </p>
        </div>

        {/* Ô nhập ghi chú / Kết luận của Quản lý */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-gray-800 block">
            Căn cứ &amp; Kết luận xét duyệt <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Ghi rõ lý do chấp nhận (được hoàn điểm) hoặc lý do từ chối (giữ nguyên phạt)... (tối thiểu 5 ký tự)"
            rows={3}
            className="w-full px-3 py-2 rounded-xl text-xs outline-none resize-none border border-gray-200 focus:border-[#2F6FA8] focus:ring-2 focus:ring-[#2F6FA8]/10 text-gray-800 transition"
          />
          <div className="flex justify-between items-center text-[11px] text-gray-500">
            <span>{note.trim().length}/5 ký tự tối thiểu</span>
            {!valid && <span className="text-amber-600">Vui lòng nhập lý do kết luận để phê duyệt</span>}
          </div>
        </div>

        {/* Nút hành động */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold transition cursor-pointer order-last sm:order-first"
          >
            Hủy Bỏ
          </button>

          <div className="flex-1 flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (valid) {
                  onDecision(violation.id, 'rejected', note.trim())
                  setNote('')
                }
              }}
              disabled={!valid}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition cursor-pointer ${
                valid ? 'bg-rose-600 hover:bg-rose-700 shadow-2xs' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <XCircle size={15} />
              <span>Bác Bỏ (Giữ Phạt)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (valid) {
                  onDecision(violation.id, 'approved', note.trim())
                  setNote('')
                }
              }}
              disabled={!valid}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition cursor-pointer ${
                valid ? 'bg-emerald-600 hover:bg-emerald-700 shadow-2xs' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 size={15} />
              <span>Chấp Nhận (Hoàn Điểm)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
