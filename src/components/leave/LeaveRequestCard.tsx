'use client'

import { useState } from 'react'
import { LEAVE_TYPE_MAP, STATUS_CONFIG } from '@/lib/mock-data-leave'
import type { LeaveRequest } from '@/lib/mock-data-leave'
import { Avatar, Badge } from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  ChevronDown, AlertTriangle, FileText, CalendarDays,
  MessageCircle, Trash2, Check, X,
} from 'lucide-react'

interface LeaveRequestCardProps {
  request: LeaveRequest
  viewMode?: 'employee' | 'manager' | 'readonly'
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  onCancel?: (id: string) => void
  onRequestInfo?: (id: string) => void
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]
  return `${weekday} ${day}/${month}/${year}`
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ngày trước`
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

const BADGE_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'default',
  pending: 'warning',
  approved: 'success',
  rejected: 'error',
  cancelled: 'default',
}

export default function LeaveRequestCard({
  request: r,
  viewMode = 'employee',
  onApprove,
  onReject,
  onCancel,
  onRequestInfo,
}: LeaveRequestCardProps) {
  const [expanded, setExpanded] = useState(false)
  const typeInfo = LEAVE_TYPE_MAP[r.leave_type]
  const statusInfo = STATUS_CONFIG[r.status]

  const isCancelled = r.status === 'cancelled'
  const isProcessed = r.status === 'approved' || r.status === 'rejected'

  return (
    <div
      className={cn(
        'bg-white rounded-2xl overflow-hidden transition-all duration-200',
        'shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)]',
        isCancelled && 'opacity-60',
        r.hasScheduleConflict && 'ring-2 ring-amber-300',
      )}
      role="article"
      aria-label={`Đơn nghỉ ${typeInfo.name} của ${r.employee_name}, trạng thái ${statusInfo.label}`}
    >
      {/* Header — clickable to expand */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(ex => !ex)}
      >
        <div className="flex items-start gap-3">
          {/* Avatar — manager view only */}
          {viewMode === 'manager' && (
            <Avatar name={r.employee_name} size="md" />
          )}

          {/* Type icon — employee view */}
          {viewMode !== 'manager' && (
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: typeInfo.colorHex + '15' }}>
              {typeInfo.icon}
            </div>
          )}

          {/* Info */}
          <div className="flex-1 min-w-0">
            {viewMode === 'manager' && (
              <p className="text-sm font-semibold text-gray-900 truncate">
                {r.employee_name}
                <span className="text-xs text-gray-400 font-normal ml-1.5">· {r.employee_position}</span>
              </p>
            )}
            <p className={cn(
              'font-semibold text-gray-900',
              viewMode === 'manager' ? 'text-xs text-gray-600 font-medium' : 'text-sm',
            )}>
              {typeInfo.name}
              {r.isHalfDay && (
                <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-warning-50 text-warning-600 font-medium">
                  Nửa ngày ({r.halfDayPeriod === 'morning' ? 'Sáng' : 'Chiều'})
                </span>
              )}
            </p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <CalendarDays size={12} className="text-gray-400" />
                {r.start_date === r.end_date
                  ? formatDate(r.start_date)
                  : `${formatDate(r.start_date)} → ${formatDate(r.end_date)}`}
              </span>
              <span className="font-numeric text-gray-400">
                {r.days} {r.days === 0.5 ? 'nửa ngày' : 'ngày'}
              </span>
            </div>
          </div>

          {/* Status badge + chevron */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge variant={BADGE_VARIANT[r.status]}>
              {statusInfo.label}
            </Badge>
            <ChevronDown className={cn(
              'w-4 h-4 text-gray-400 transition-transform duration-200',
              expanded && 'rotate-180',
            )} />
          </div>
        </div>

        {/* Conflict warning — always visible */}
        {r.hasScheduleConflict && r.conflictingShifts && r.conflictingShifts.length > 0 && (
          <div className="mt-3 p-2.5 bg-warning-50 rounded-xl flex items-start gap-2">
            <AlertTriangle size={14} className="text-warning-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-warning-700">
              Ảnh hưởng {r.conflictingShifts.length} ca làm
            </p>
          </div>
        )}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 animate-fade-in">
          {/* Reason */}
          {r.reason && (
            <div className="mt-3">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1">
                <MessageCircle size={12} /> Lý do
              </div>
              <p className={cn('text-sm text-gray-700', isCancelled && 'line-through')}>
                {r.reason}
              </p>
            </div>
          )}

          {/* Document */}
          {r.document_url && (
            <div className="mt-2 flex items-center gap-1 text-xs text-primary-500 font-medium">
              <FileText size={12} /> Có giấy tờ đính kèm
            </div>
          )}

          {/* Conflict details */}
          {r.hasScheduleConflict && r.conflictingShifts && r.conflictingShifts.length > 0 && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-warning-50/50 border border-warning-100 space-y-1">
              {r.conflictingShifts.map((s, i) => (
                <div key={i} className="text-xs text-warning-600">
                  • {formatDate(s.date).split(' ').slice(0, 2).join(' ')}: {s.time} ({s.position})
                </div>
              ))}
              <div className="text-xs text-gray-400 mt-1 italic">
                Quản lý sẽ cần sắp xếp người thay
              </div>
            </div>
          )}

          {/* Approval / Rejection info */}
          {r.status === 'approved' && r.approver_name && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-emerald-50 border border-emerald-100">
              <div className="text-xs text-emerald-700 font-medium">
                <Check size={12} className="inline text-emerald-500" /> Duyệt bởi: {r.approver_name}
                {r.approved_at && <span className="text-emerald-500"> • {timeAgo(r.approved_at)}</span>}
              </div>
              {r.approver_comment && (
                <div className="text-xs text-emerald-600 mt-0.5">{r.approver_comment}</div>
              )}
            </div>
          )}

          {r.status === 'rejected' && (
            <div className="mt-3 px-3 py-2 rounded-xl bg-error-50 border border-error-100">
              <div className="text-xs text-error-700 font-medium">
                ✗ Từ chối{r.approver_name && `: ${r.approver_name}`}
                {r.rejected_at && <span className="text-error-400"> • {timeAgo(r.rejected_at)}</span>}
              </div>
              {r.approver_comment && (
                <div className="text-xs text-error-600 mt-0.5">{r.approver_comment}</div>
              )}
            </div>
          )}

          {/* Actions — pill buttons matching dashboard style */}
          {!isProcessed && !isCancelled && (
            <div className="mt-4 flex gap-2">
              {viewMode === 'manager' && r.status === 'pending' && (
                <>
                  {onRequestInfo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onRequestInfo(r.id) }}
                      className="h-10 px-4 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium
                        flex items-center gap-2
                        hover:bg-gray-200 active:scale-[0.98] transition-all"
                    >
                      <MessageCircle size={14} /> Hỏi thêm
                    </button>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); onApprove?.(r.id) }}
                    className="flex-1 h-10 px-4 rounded-xl bg-emerald-500 text-white text-sm font-semibold
                      flex items-center justify-center gap-2
                      hover:bg-emerald-600 active:scale-[0.98] transition-all shadow-sm"
                  >
                    <Check size={16} /> Duyệt
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onReject?.(r.id) }}
                    className="flex-1 h-10 px-4 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold
                      flex items-center justify-center gap-2
                      hover:bg-error-50 hover:text-error-600 active:scale-[0.98] transition-all"
                  >
                    <X size={16} /> Từ chối
                  </button>
                </>
              )}

              {viewMode === 'employee' && r.status === 'pending' && (
                <button
                  onClick={(e) => { e.stopPropagation(); onCancel?.(r.id) }}
                  className="flex-1 h-10 px-4 rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold
                    flex items-center justify-center gap-2
                    hover:bg-error-50 hover:text-error-600 active:scale-[0.98] transition-all"
                >
                  <Trash2 size={14} /> Hủy đơn
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Footer — timestamp */}
      <div className="px-4 py-2 border-t border-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">{timeAgo(r.created_at)}</span>
        <span className="text-xs text-gray-300">{r.id}</span>
      </div>
    </div>
  )
}
