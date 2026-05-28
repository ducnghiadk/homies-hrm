'use client'

import { useState } from 'react'
import type { ReplacementRequest } from '@/lib/replacement-request'
import { acceptReplacement, rejectReplacement } from '@/lib/replacement-request'
import {
  Clock, MapPin, User, MessageCircle, Check, X, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReplacementRequestCardProps {
  request: ReplacementRequest
  onStatusChange?: (id: string, status: 'accepted' | 'rejected') => void
}

export function ReplacementRequestCard({ request, onStatusChange }: ReplacementRequestCardProps) {
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [localStatus, setLocalStatus] = useState(request.status)

  const d = new Date(request.shift_date)
  const dayNames = ['Chủ nhật','Thứ 2','Thứ 3','Thứ 4','Thứ 5','Thứ 6','Thứ 7']
  const dayLabel = `${dayNames[d.getDay()]}, ${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`

  const shiftPeriodLabel = {
    morning: 'Ca Sáng',
    afternoon: 'Ca Chiều',
    evening: 'Ca Tối',
  }[request.shift_period]

  const shiftPeriodIcon = {
    morning: '☀️',
    afternoon: '🌅',
    evening: '🌙',
  }[request.shift_period]

  const handleAccept = () => {
    acceptReplacement(request.id)
    setLocalStatus('accepted')
    onStatusChange?.(request.id, 'accepted')
  }

  const handleReject = () => {
    rejectReplacement(request.id, rejectReason || undefined)
    setLocalStatus('rejected')
    setShowRejectForm(false)
    onStatusChange?.(request.id, 'rejected')
  }

  if (localStatus !== 'pending') {
    return (
      <div className={cn(
        'rounded-2xl border p-4',
        localStatus === 'accepted'
          ? 'bg-emerald-50/60 border-emerald-200'
          : 'bg-error-50/60 border-error-200',
      )}>
        <div className="flex items-center gap-2">
          {localStatus === 'accepted' ? (
            <>
              <Check size={16} className="text-emerald-500" />
              <span className="text-sm font-bold text-emerald-700">Đã đồng ý thay ca</span>
            </>
          ) : (
            <>
              <X size={16} className="text-error-500" />
              <span className="text-sm font-bold text-error-700">Đã từ chối</span>
            </>
          )}
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {shiftPeriodIcon} {shiftPeriodLabel} — {dayLabel}
        </div>
        {localStatus === 'rejected' && rejectReason && (
          <div className="mt-1 text-xs text-gray-400 italic">Lý do: {rejectReason}</div>
        )}
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-warning-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-warning-50 px-4 py-3 flex items-center gap-2">
        <AlertTriangle size={16} className="text-warning-500" />
        <span className="text-sm font-bold text-warning-700">Yêu cầu thay ca</span>
      </div>

      {/* Body */}
      <div className="p-4 space-y-3">
        {/* Requester info */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
            <User size={16} className="text-primary-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {request.original_employee_name || 'Đồng nghiệp'}
            </p>
            <p className="text-xs text-gray-400">muốn bạn thay ca:</p>
          </div>
        </div>

        {/* Shift details */}
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-primary-500" />
            <span className="text-sm font-bold text-gray-700">
              {shiftPeriodIcon} {shiftPeriodLabel} ({request.shift_time})
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">📅</span>
            <span className="text-xs font-medium text-gray-600">{dayLabel}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <MapPin size={12} className="text-gray-400" />
            <span className="text-xs text-gray-500">{request.store_name}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">👔 Vị trí: {request.position}</span>
          </div>
        </div>

        {/* Reject reason form */}
        {showRejectForm && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-xs text-gray-500 font-medium flex items-center gap-1">
              <MessageCircle size={12} />
              Lý do từ chối (không bắt buộc):
            </label>
            <textarea
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="VD: Em có lịch học..."
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs bg-gray-50 resize-none placeholder-gray-300 focus:ring-2 focus:ring-red-200 focus:border-error-300"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowRejectForm(false)}
                className="flex-1 py-2 rounded-xl text-xs font-medium text-gray-500 bg-gray-100"
              >
                Hủy
              </button>
              <button
                onClick={handleReject}
                className="flex-1 py-2 rounded-xl text-xs font-semibold text-white bg-error-500 active:scale-[0.97] transition-transform"
              >
                Xác nhận từ chối
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {!showRejectForm && (
        <div className="px-4 pb-4 flex gap-2">
          <button
            onClick={() => setShowRejectForm(true)}
            className="flex-1 py-3 rounded-xl text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors active:scale-[0.97]"
          >
            Từ chối
          </button>
          <button
            onClick={handleAccept}
            className="flex-[2] py-3 rounded-xl text-sm font-bold text-white bg-primary-500 hover:bg-primary-600 transition-colors shadow-sm flex items-center justify-center gap-2 active:scale-[0.97]"
          >
            <Check size={16} />
            Đồng ý thay
          </button>
        </div>
      )}
    </div>
  )
}
