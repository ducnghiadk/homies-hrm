'use client'

import { CalendarDays, Plus, Copy, ChevronRight, Clock, Users, Banknote, Eye, Pencil, Wrench, AlertTriangle } from 'lucide-react'
import CollapsibleSection from '@/components/ui/CollapsibleSection'

type ScheduleStatus = 'draft' | 'published' | 'active' | 'completed' | 'conflict'

interface ScheduleWeek {
  id: string
  weekLabel: string
  dateRange: string
  status: ScheduleStatus
  staffCount: number
  shiftCount: number
  totalCost: number
  conflictNote?: string
}

const statusConfig: Record<ScheduleStatus, { label: string; className: string }> = {
  draft: { label: 'Nháp', className: 'bg-amber-100 text-amber-700' },
  published: { label: 'Đã xuất bản', className: 'bg-green-100 text-green-700' },
  active: { label: 'Đang áp dụng', className: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Đã qua', className: 'bg-gray-100 text-gray-500' },
  conflict: { label: 'Có vấn đề', className: 'bg-red-100 text-red-700' },
}

// ── Mock data ──
const mockHistory: ScheduleWeek[] = [
  { id: 'w1', weekLabel: 'Tuần 10/02 - 16/02/2026', dateRange: '10/02 - 16/02', status: 'completed', staffCount: 5, shiftCount: 34, totalCost: 40_500_000 },
  { id: 'w2', weekLabel: 'Tuần 03/02 - 09/02/2026', dateRange: '03/02 - 09/02', status: 'completed', staffCount: 5, shiftCount: 35, totalCost: 41_300_000 },
  { id: 'w3', weekLabel: 'Tuần 27/01 - 02/02/2026', dateRange: '27/01 - 02/02', status: 'completed', staffCount: 4, shiftCount: 32, totalCost: 38_200_000 },
  { id: 'w4', weekLabel: 'Tuần 20/01 - 26/01/2026', dateRange: '20/01 - 26/01', status: 'completed', staffCount: 5, shiftCount: 33, totalCost: 39_800_000 },
]

interface ScheduleOverviewTabProps {
  onCreateSchedule: () => void
  onViewSchedule?: (weekId: string) => void
}

function formatCost(cost: number) {
  return (cost / 1_000_000).toFixed(1) + ' triệu'
}

function ScheduleCard({ schedule, onView, onAction }: {
  schedule: ScheduleWeek
  onView?: () => void
  onAction?: () => void
}) {
  const cfg = statusConfig[schedule.status]

  return (
    <div className={`bg-white rounded-2xl border p-5 transition-all duration-200 hover:shadow-md ${
      schedule.status === 'conflict'
        ? 'border-red-200 hover:border-red-300'
        : schedule.status === 'active'
          ? 'border-blue-200 hover:border-blue-300'
          : 'border-gray-200 hover:border-primary/30'
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-gray-400" />
          <span className="font-bold text-gray-800 text-sm">{schedule.weekLabel}</span>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.className}`}>
          {cfg.label}
        </span>
      </div>

      {schedule.status === 'conflict' && schedule.conflictNote && (
        <div className="mb-3 p-2 bg-red-50 rounded-lg text-xs text-red-600 font-medium">
          <AlertTriangle size={14} className="text-red-500 inline mr-1" />
          {schedule.conflictNote}
        </div>
      )}

      <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
        <span className="flex items-center gap-1"><Users size={12} /> {schedule.staffCount} NV</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {schedule.shiftCount} ca</span>
        <span className="flex items-center gap-1"><Banknote size={12} /> {formatCost(schedule.totalCost)}</span>
      </div>

      <div className="flex gap-2">
        {onView && (
          <button
            onClick={onView}
            className="flex-1 py-2 text-xs font-medium text-primary hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Eye size={12} /> Xem chi tiết <ChevronRight size={12} />
          </button>
        )}
        {onAction && schedule.status === 'draft' && (
          <button
            onClick={onAction}
            className="flex-1 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Pencil size={12} /> Tiếp tục sửa
          </button>
        )}
        {onAction && schedule.status === 'conflict' && (
          <button
            onClick={onAction}
            className="flex-1 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center gap-1"
          >
            <Wrench size={12} /> Sửa ngay
          </button>
        )}
      </div>
    </div>
  )
}

export default function ScheduleOverviewTab({
  onCreateSchedule,
}: ScheduleOverviewTabProps) {
  // Mock current schedule
  const currentSchedule: ScheduleWeek = {
    id: 'current',
    weekLabel: 'Tuần 17/02 - 23/02/2026',
    dateRange: '17/02 - 23/02',
    status: 'active',
    staffCount: 5,
    shiftCount: 35,
    totalCost: 41_300_000,
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <CalendarDays size={20} className="text-indigo-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">Lịch làm việc</h2>
          <p className="text-sm text-gray-500">Tạo và quản lý lịch làm việc hàng tuần</p>
        </div>
      </div>

      {/* Current schedule */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Lịch hiện tại</h3>
        <ScheduleCard schedule={currentSchedule} onView={() => {}} onAction={() => {}} />
      </div>

      {/* Next week — Create new */}
      <div>
        <h3 className="text-sm font-medium text-gray-400 mb-2 uppercase tracking-wide">Tuần tiếp theo</h3>
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center hover:border-primary/40 transition-colors">
          <div className="text-sm font-medium text-gray-500 mb-1">
            <CalendarDays size={14} className="text-gray-400 inline mr-1" />
            Tuần 24/02 - 02/03/2026
          </div>
          <p className="text-xs text-gray-400 mb-4">Chưa có lịch cho tuần này</p>

          <button
            onClick={onCreateSchedule}
            className="
              px-6 py-3 rounded-xl font-bold text-sm
              bg-primary text-white shadow-md
              hover:bg-primary/90 hover:shadow-lg
              active:scale-[0.98]
              transition-all duration-200
              flex items-center gap-2 mx-auto
            "
          >
            <Plus size={16} /> Tạo lịch tự động
          </button>

          <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
            <button className="hover:text-primary transition-colors flex items-center gap-1">
              <Copy size={12} /> Sao chép từ tuần trước
            </button>
            <span>•</span>
            <button className="hover:text-primary transition-colors">
              Tạo thủ công
            </button>
          </div>
        </div>
      </div>

      {/* History */}
      <CollapsibleSection
        title="Lịch các tuần trước"
        badge={`${mockHistory.length}`}
        defaultOpen={false}
      >
        <div className="space-y-3 pt-1">
          {mockHistory.map(week => (
            <div
              key={week.id}
              className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm hover:bg-gray-100/70 transition-colors"
            >
              <div className="flex items-center gap-4">
                <span className="text-gray-700 font-medium">{week.dateRange}</span>
                <span className="text-xs text-gray-400">
                  {week.staffCount} NV • {week.shiftCount} ca • {formatCost(week.totalCost)}
                </span>
              </div>
              <button className="text-xs text-primary font-medium hover:underline transition-colors">
                Xem
              </button>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  )
}
