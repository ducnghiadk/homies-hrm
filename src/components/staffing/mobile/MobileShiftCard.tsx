'use client'

import { useState } from 'react'
import { Pencil, Trash2, ChevronDown, Clock, User, ClipboardList, AlertTriangle, Star, DollarSign, Handshake, Shirt } from 'lucide-react'
import { useSwipeActions } from '@/hooks/useSwipeActions'
import type { ScheduleShift } from '@/lib/mock-data-smart-schedule'

const positionLabels: Record<string, { label: string; Icon: React.ComponentType<{size?: number; className?: string}>; color: string }> = {
  barista: { label: 'Pha chế', Icon: Shirt, color: 'text-amber-600 bg-amber-50' },
  cashier: { label: 'Thu ngân', Icon: DollarSign, color: 'text-green-600 bg-green-50' },
  support: { label: 'Hỗ trợ', Icon: Handshake, color: 'text-blue-600 bg-blue-50' },
  store_manager: { label: 'Quản lý', Icon: Star, color: 'text-purple-600 bg-purple-50' },
}

function calcHours(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return ((eh * 60 + em) - (sh * 60 + sm)) / 60
}

interface MobileShiftCardProps {
  shift: ScheduleShift
  onEdit: () => void
  onDelete: () => void
}

export default function MobileShiftCard({
  shift,
  onEdit,
  onDelete,
}: MobileShiftCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const { state, handlers, reset } = useSwipeActions({
    onSwipeLeft: onDelete,
    threshold: 80,
    deleteThreshold: 200,
  })

  const pos = positionLabels[shift.position] || positionLabels.support
  const hours = calcHours(shift.startTime, shift.endTime)

  // Mini timeline bar (7h-23h range = 16 hours)
  const timelineStart = 7
  const timelineSpan = 16
  const [sh] = shift.startTime.split(':').map(Number)
  const [eh] = shift.endTime.split(':').map(Number)
  const barLeft = ((sh - timelineStart) / timelineSpan) * 100
  const barWidth = ((eh - sh) / timelineSpan) * 100

  return (
    <div className="relative overflow-hidden rounded-xl">
      {/* Swipe action buttons (behind card) */}
      <div className="absolute inset-y-0 right-0 flex">
        <button
          onClick={(e) => { e.stopPropagation(); reset(); onEdit() }}
          className="w-16 flex items-center justify-center bg-blue-500 text-white"
        >
          <div className="flex flex-col items-center gap-0.5">
            <Pencil size={16} />
            <span className="text-xs">Sửa</span>
          </div>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); reset(); onDelete() }}
          className="w-16 flex items-center justify-center bg-red-500 text-white"
        >
          <div className="flex flex-col items-center gap-0.5">
            <Trash2 size={16} />
            <span className="text-xs">Xóa</span>
          </div>
        </button>
      </div>

      {/* Card (slides over actions) */}
      <div
        {...handlers}
        className="
          relative bg-white border border-gray-200 rounded-xl
          transition-transform duration-200 ease-out
          active:bg-gray-50
          touch-pan-y
        "
        style={{
          transform: `translateX(${state.offsetX}px)`,
          transition: state.isSwiping ? 'none' : undefined,
        }}
        onClick={() => setIsExpanded(prev => !prev)}
      >
        <div className="p-3.5">
          {/* Top row: Name + Time badge */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                <User size={16} className="text-gray-500" />
              </div>
              <div>
                <div className="font-bold text-gray-800 text-sm">{shift.employeeName}</div>
                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${pos.color}`}>
                  <pos.Icon size={12} className="inline" /> {pos.label} • {shift.isOvertime ? 'Part-time' : 'Full-time'}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-sm font-bold text-gray-800">{shift.startTime}</div>
              <div className="text-xs text-gray-400">↓</div>
              <div className="text-sm font-bold text-gray-800">{shift.endTime}</div>
              <div className="text-xs text-gray-400">({hours}h)</div>
            </div>
          </div>

          {/* Mini timeline bar */}
          <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="absolute top-0 bottom-0 bg-primary/70 rounded-full"
              style={{ left: `${Math.max(0, barLeft)}%`, width: `${barWidth}%` }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-gray-300 mt-0.5 px-0.5">
            <span>7h</span><span>15h</span><span>23h</span>
          </div>

          {/* Expand indicator */}
          <div className="flex justify-center mt-1">
            <ChevronDown
              size={14}
              className={`text-gray-300 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
            />
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="border-t border-gray-100 px-3.5 py-3 animate-in slide-in-from-top-2 duration-200">
            <div className="text-xs text-gray-400 font-medium mb-2 flex items-center gap-1">
              <ClipboardList size={12} />
              Chi tiết
            </div>
            <div className="space-y-1.5 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Clock size={12} className="text-gray-400" />
                Nghỉ giữa ca: {shift.breakMinutes} phút
              </div>
              {shift.isOvertime && (
                <div className="flex items-center gap-2 text-orange-600">
                  <AlertTriangle size={12} /> Ca tăng ca
                </div>
              )}
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit() }}
              className="mt-3 w-full py-2.5 text-xs font-bold text-primary bg-primary/5 rounded-xl hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <Pencil size={12} /> Sửa ca này
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
