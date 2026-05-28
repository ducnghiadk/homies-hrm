'use client'

import { format, parseISO } from 'date-fns'
import {
  AlertTriangle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  Eye,
  Pencil,
  Plus,
  Users,
  Wrench,
} from 'lucide-react'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import type { ScheduleResult } from '@/lib/mock-data-smart-schedule'

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
  draft: { label: 'Ban nhap', className: 'bg-amber-100 text-amber-700' },
  published: { label: 'Da xuat ban', className: 'bg-emerald-100 text-emerald-700' },
  active: { label: 'Dang ap dung', className: 'bg-primary-100 text-primary-700' },
  completed: { label: 'Da qua', className: 'bg-gray-100 text-gray-500' },
  conflict: { label: 'Can xu ly', className: 'bg-red-100 text-red-700' },
}

const mockHistory: ScheduleWeek[] = [
  { id: 'w1', weekLabel: 'Tuan 10/02 - 16/02/2026', dateRange: '10/02 - 16/02', status: 'completed', staffCount: 5, shiftCount: 34, totalCost: 40_500_000 },
  { id: 'w2', weekLabel: 'Tuan 03/02 - 09/02/2026', dateRange: '03/02 - 09/02', status: 'completed', staffCount: 5, shiftCount: 35, totalCost: 41_300_000 },
  { id: 'w3', weekLabel: 'Tuan 27/01 - 02/02/2026', dateRange: '27/01 - 02/02', status: 'completed', staffCount: 4, shiftCount: 32, totalCost: 38_200_000 },
]

interface ScheduleOverviewTabProps {
  onCreateSchedule: () => void
  onViewSchedule?: (weekId: string) => void
  latestSchedule?: ScheduleResult
}

function formatCost(cost: number) {
  return `${(cost / 1_000_000).toFixed(1)} tr`
}

function ScheduleCard({
  schedule,
  onView,
  onAction,
}: {
  schedule: ScheduleWeek
  onView?: () => void
  onAction?: () => void
}) {
  const config = statusConfig[schedule.status]

  return (
    <div className={`rounded-2xl border bg-white p-5 transition-all duration-200 hover:shadow-md ${
      schedule.status === 'conflict'
        ? 'border-red-200 hover:border-red-300'
        : schedule.status === 'active'
          ? 'border-primary-200 hover:border-primary-300'
          : 'border-gray-200 hover:border-primary/30'
    }`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-800">
            <CalendarDays size={16} className="text-gray-400" />
            {schedule.weekLabel}
          </div>
          <p className="mt-1 text-xs text-gray-500">{schedule.dateRange}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${config.className}`}>
          {config.label}
        </span>
      </div>

      {schedule.conflictNote ? (
        <div className="mb-3 rounded-xl border border-red-100 bg-red-50 p-3 text-xs font-medium text-red-600">
          <AlertTriangle size={14} className="mr-1 inline" />
          {schedule.conflictNote}
        </div>
      ) : null}

      <div className="grid gap-2 text-xs text-gray-500 sm:grid-cols-3">
        <span className="flex items-center gap-1"><Users size={12} /> {schedule.staffCount} nhan su</span>
        <span className="flex items-center gap-1"><Clock size={12} /> {schedule.shiftCount} ca</span>
        <span className="flex items-center gap-1"><Banknote size={12} /> {formatCost(schedule.totalCost)}</span>
      </div>

      <div className="mt-4 flex gap-2">
        {onView ? (
          <button
            onClick={onView}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
          >
            <Eye size={12} />
            Xem chi tiet
            <ChevronRight size={12} />
          </button>
        ) : null}

        {onAction && schedule.status === 'draft' ? (
          <button
            onClick={onAction}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-100"
          >
            <Pencil size={12} />
            Tiep tuc sua
          </button>
        ) : null}

        {onAction && schedule.status === 'conflict' ? (
          <button
            onClick={onAction}
            className="flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
          >
            <Wrench size={12} />
            Sua ngay
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default function ScheduleOverviewTab({
  onCreateSchedule,
  latestSchedule,
}: ScheduleOverviewTabProps) {
  const currentSchedule: ScheduleWeek = {
    id: 'current',
    weekLabel: 'Tuan 17/02 - 23/02/2026',
    dateRange: '17/02 - 23/02',
    status: 'active',
    staffCount: 5,
    shiftCount: 35,
    totalCost: 41_300_000,
  }

  const nextWeekSchedule: ScheduleWeek | null = latestSchedule ? {
    id: latestSchedule.id,
    weekLabel: `Tuan ${format(parseISO(latestSchedule.weekStart), 'dd/MM')} - ${format(parseISO(latestSchedule.weekEnd), 'dd/MM/yyyy')}`,
    dateRange: `${format(parseISO(latestSchedule.weekStart), 'dd/MM')} - ${format(parseISO(latestSchedule.weekEnd), 'dd/MM')}`,
    status: latestSchedule.warnings.some((warning) => warning.severity === 'error') ? 'conflict' : latestSchedule.status,
    staffCount: new Set(latestSchedule.shifts.map((shift) => shift.employeeId)).size,
    shiftCount: latestSchedule.shifts.length,
    totalCost: latestSchedule.stats.totalCost,
    conflictNote: latestSchedule.warnings.some((warning) => warning.severity === 'error')
      ? `${latestSchedule.warnings.filter((warning) => warning.severity === 'error').length} loi can xu ly truoc khi ap dung`
      : undefined,
  } : null

  const operationsBoard = [
    {
      title: 'Tuan dang ap dung',
      value: currentSchedule.weekLabel,
      note: `${currentSchedule.shiftCount} ca · ${formatCost(currentSchedule.totalCost)}`,
      tone: 'good',
    },
    {
      title: 'Tuan tiep theo',
      value: nextWeekSchedule ? statusConfig[nextWeekSchedule.status].label : 'Chua co lich',
      note: nextWeekSchedule ? `${nextWeekSchedule.staffCount} nhan su da duoc xep` : 'Nen tao lich moi hoac sao chep tuan truoc',
      tone: nextWeekSchedule?.status === 'conflict' ? 'warn' : 'neutral',
    },
    {
      title: 'Hang muc can xu ly',
      value: nextWeekSchedule?.conflictNote || 'Khong co loi lon',
      note: 'Day la khu de manager biet ngay co the chot hay chua.',
      tone: nextWeekSchedule?.conflictNote ? 'warn' : 'good',
    },
  ] as const

  const actionQueue = nextWeekSchedule?.status === 'conflict'
    ? [
        'Ra soat canh bao loi truoc khi xuat ban',
        'Kiem tra khung gio dang thieu nguoi',
        'Xac nhan chi phi luong co nam trong nguong',
      ]
    : [
        'Tao lich tuan moi cho chi nhanh',
        'Sao chep lich tuan truoc neu mo hinh van hanh on dinh',
        'Sau khi xep xong, doi chieu canh bao roi moi chot ap dung',
      ]

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-5 duration-300">
      <section className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-600">
              <CalendarDays size={22} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-gray-900">Lich tuan va canh bao van hanh</h2>
              <p className="mt-1 text-sm text-gray-500">
                Khu nay giup manager biet lich nao dang ap dung, lich nao dang cho chot,
                va can xu ly gi truoc khi dua vao van hanh that.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {operationsBoard.map((item) => (
              <div
                key={item.title}
                className={`rounded-2xl border p-4 ${
                  item.tone === 'warn'
                    ? 'border-amber-200 bg-amber-50'
                    : item.tone === 'good'
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">{item.title}</div>
                <div className="mt-2 text-base font-bold text-gray-900">{item.value}</div>
                <p className="mt-1 text-xs text-gray-600">{item.note}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-400">Action queue</p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">Viecs can lam ngay</h3>
            </div>
            <button
              onClick={onCreateSchedule}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary/90"
            >
              <Plus size={14} />
              Tao lich tu dong
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {actionQueue.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-gray-100 bg-gray-50 p-3">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-primary-600 shadow-sm">
                  {index + 1}
                </div>
                <p className="text-sm text-gray-600">{item}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-2xl border border-primary-100 bg-primary-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary-700">
              <CheckCircle2 size={16} />
              Tieu chuan de chot lich
            </div>
            <p className="mt-2 text-sm text-primary-700/90">
              Manager nen chi chot lich khi khong con loi nang, chi phi nam trong nguong,
              va cac khung gio cao diem da co nguoi phu trach ro rang.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">Lich hien tai</h3>
          <ScheduleCard schedule={currentSchedule} onView={() => {}} onAction={() => {}} />
        </div>

        <div>
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-400">Tuan tiep theo</h3>
          {nextWeekSchedule ? (
            <ScheduleCard schedule={nextWeekSchedule} onView={() => {}} onAction={onCreateSchedule} />
          ) : (
            <div className="rounded-2xl border-2 border-dashed border-gray-200 bg-white p-6 text-center transition-colors hover:border-primary/40">
              <div className="text-sm font-medium text-gray-500">
                <CalendarDays size={14} className="mr-1 inline text-gray-400" />
                Tuan 24/02 - 02/03/2026
              </div>
              <p className="mb-4 mt-1 text-xs text-gray-400">Chua co lich cho tuan nay</p>

              <button
                onClick={onCreateSchedule}
                className="mx-auto flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition-all duration-200 hover:bg-primary/90 hover:shadow-lg active:scale-[0.98]"
              >
                <Plus size={16} />
                Tao lich tu dong
              </button>

              <div className="mt-3 flex items-center justify-center gap-4 text-xs text-gray-400">
                <button className="flex items-center gap-1 transition-colors hover:text-primary">
                  <Copy size={12} />
                  Sao chep tuan truoc
                </button>
                <span>•</span>
                <button className="transition-colors hover:text-primary">
                  Tao thu cong
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <CollapsibleSection title="Lich cac tuan truoc" badge={`${mockHistory.length}`} defaultOpen={false}>
        <div className="space-y-3 pt-1">
          {mockHistory.map((week) => (
            <div
              key={week.id}
              className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm transition-colors hover:bg-gray-100/70"
            >
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-700">{week.dateRange}</span>
                <span className="text-xs text-gray-400">
                  {week.staffCount} nhan su • {week.shiftCount} ca • {formatCost(week.totalCost)}
                </span>
              </div>
              <button className="text-xs font-medium text-primary transition-colors hover:underline">
                Xem
              </button>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  )
}
