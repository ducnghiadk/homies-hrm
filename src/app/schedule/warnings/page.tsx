'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { getShiftById, getSchedulesByStoreWeek } from '@/lib/mock-data'
import {
  scanWeekWarnings, scheduleRules, acknowledgeWarning,
  getScheduleWarningTypeLabel, getScheduleWarningKey, syntheticWarningLabels,
  type WarningLevel, type ScheduleWarningType, type ScheduleWarning,
} from '@/lib/mock-data-schedule-rules'
import { format, addDays, parseISO, startOfWeek } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ChevronLeft, AlertTriangle, ShieldAlert, Info,
  CheckCircle2, Eye, XCircle,
} from 'lucide-react'

const LEVEL_CONFIG: Record<WarningLevel, { label: string; color: string; bg: string; icon: typeof AlertTriangle }> = {
  block: { label: 'Chặn', color: 'text-error-600', bg: 'bg-error-50 border-error-200', icon: ShieldAlert },
  warning: { label: 'Cảnh báo', color: 'text-warning-600', bg: 'bg-warning-50 border-warning-200', icon: AlertTriangle },
  info: { label: 'Thông tin', color: 'text-primary-600', bg: 'bg-primary-50 border-primary-200', icon: Info },
}

function ScheduleWarningsContent() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isHydrated, setIsHydrated] = useState(false)
  const [levelFilter, setLevelFilter] = useState<WarningLevel | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<ScheduleWarningType | 'all'>('all')
  const [ackModalWarning, setAckModalWarning] = useState<ScheduleWarning | null>(null)
  const [ackReason, setAckReason] = useState('')
  const [, setRefreshTrigger] = useState(0)

  const handleViewShift = (shiftId?: string, dateStr?: string) => {
    if (shiftId && dateStr) {
      router.push(`/schedule/manage?date=${dateStr}&shift=${shiftId}`)
    }
  }

  const handleAcknowledgeClick = (w: ScheduleWarning) => {
    setAckModalWarning(w)
    setAckReason('')
  }

  useEffect(() => {
    const t = setTimeout(() => setIsHydrated(true), 0)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (isHydrated && !isAuthenticated) router.push('/login')
  }, [isHydrated, isAuthenticated, router])

  if (!isHydrated || !user) return null

  if (user.role === 'employee') {
    return (
      <AppShell title="Cảnh báo">
        <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>
          Không có quyền
        </div>
      </AppShell>
    )
  }

  const storeId = user.store_id
  const requestedWeekStart = searchParams.get('weekStart')
  const baseDate = requestedWeekStart ? parseISO(requestedWeekStart) : new Date()
  const monday = startOfWeek(baseDate, { weekStartsOn: 1 })
  const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'))
  const storeSchedules = getSchedulesByStoreWeek(storeId, weekDates)
  const allWarnings = scanWeekWarnings(storeId, weekDates, storeSchedules)

  const filtered = allWarnings.filter(w => {
    if (levelFilter !== 'all' && w.warning_level !== levelFilter) return false
    if (typeFilter !== 'all' && w.warning_type !== typeFilter) return false
    return true
  })

  const blockCount = allWarnings.filter(w => w.warning_level === 'block').length
  const warnCount = allWarnings.filter(w => w.warning_level === 'warning').length
  const infoCount = allWarnings.filter(w => w.warning_level === 'info').length
  const inactiveCount = allWarnings.filter(w => w.warning_type === 'employee_inactive').length
  const wrongStoreCount = allWarnings.filter(w => w.warning_type === 'wrong_store_assignment').length
  const emptyWeekCount = allWarnings.filter(w => w.warning_type === 'empty_week').length
  const missingReasonCount = allWarnings.filter(w => w.warning_type === 'missing_change_reason').length

  return (
    <AppShell showNav>
      <div className="space-y-4 animate-fade-in font-['Inter'] pb-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-dark-700">Cảnh báo xếp ca</h1>
            <p className="text-xs text-gray-400">Tuần {format(monday, 'dd/MM')} – {format(addDays(monday, 6), 'dd/MM')}</p>
          </div>
        </div>

        {/* Summary pills */}
        <div className="flex gap-2">
          <button onClick={() => setLevelFilter(levelFilter === 'block' ? 'all' : 'block')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${levelFilter === 'block' ? 'bg-error-500 text-white border-error-500' : 'bg-error-50 text-error-600 border-error-200'}`}>
            <ShieldAlert size={12} /> {blockCount} Chặn
          </button>
          <button onClick={() => setLevelFilter(levelFilter === 'warning' ? 'all' : 'warning')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${levelFilter === 'warning' ? 'bg-warning-500 text-white border-warning-500' : 'bg-warning-50 text-warning-600 border-warning-200'}`}>
            <AlertTriangle size={12} /> {warnCount} Cảnh báo
          </button>
          <button onClick={() => setLevelFilter(levelFilter === 'info' ? 'all' : 'info')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${levelFilter === 'info' ? 'bg-primary-500 text-white border-primary-500' : 'bg-primary-50 text-primary-600 border-primary-200'}`}>
            <Info size={12} /> {infoCount} Thông tin
          </button>
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <button onClick={() => setTypeFilter('all')}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${typeFilter === 'all' ? 'bg-dark-700 text-white border-dark-700' : 'bg-vanilla-50 text-gray-500 border-gray-200'}`}>
            Tất cả
          </button>
          {scheduleRules.filter(r => r.is_active).map(rule => (
            <button key={rule.rule_key} onClick={() => setTypeFilter(typeFilter === rule.rule_key ? 'all' : rule.rule_key)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${typeFilter === rule.rule_key ? 'bg-dark-700 text-white border-dark-700' : 'bg-vanilla-50 text-gray-500 border-gray-200'}`}>
              {rule.label}
            </button>
          ))}
          {Object.entries(syntheticWarningLabels).map(([key, label]) => (
            <button key={key} onClick={() => setTypeFilter(typeFilter === key ? 'all' : key as ScheduleWarningType)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${typeFilter === key ? 'bg-dark-700 text-white border-dark-700' : 'bg-vanilla-50 text-gray-500 border-gray-200'}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Chua active</p>
            <p className="mt-1 text-lg font-black text-dark-700">{inactiveCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Sai chi nhanh</p>
            <p className="mt-1 text-lg font-black text-dark-700">{wrongStoreCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Tuan rong</p>
            <p className="mt-1 text-lg font-black text-dark-700">{emptyWeekCount}</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Thieu ly do sua</p>
            <p className="mt-1 text-lg font-black text-dark-700">{missingReasonCount}</p>
          </div>
        </div>

        {/* Warning list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-success-50 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-success-400" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Không có cảnh báo</p>
            <p className="text-xs text-gray-300">Lịch tuần này đạt chuẩn</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map(w => {
              const cfg = LEVEL_CONFIG[w.warning_level]
              const Icon = cfg.icon
              const shift = w.shift_id ? getShiftById(w.shift_id) : null
              const warningLabel = getScheduleWarningTypeLabel(w.warning_type)

              return (
                <div key={w.id} className={`rounded-2xl border p-3.5 space-y-2 ${cfg.bg}`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${w.warning_level === 'block' ? 'bg-error-100' : w.warning_level === 'warning' ? 'bg-warning-100' : 'bg-primary-100'}`}>
                      <Icon size={16} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${w.warning_level === 'block' ? 'bg-error-200 text-error-700' : w.warning_level === 'warning' ? 'bg-warning-200 text-warning-700' : 'bg-primary-200 text-primary-700'}`}>{cfg.label}</span>
                        <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-white/70 text-gray-600 border border-gray-200">{warningLabel}</span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(w.date), 'EEEE dd/MM', { locale: vi })}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-dark-700 mt-1">{w.message}</p>
                      <p className="mt-1 text-[11px] text-gray-500">
                        Doi tuong: {w.employee_name}
                      </p>
                      {shift && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {shift.name} ({shift.start_time} - {shift.end_time})
                        </p>
                      )}
                    </div>
                  </div>

                  {w.is_acknowledged ? (
                    <div className="mt-2 p-2.5 bg-success-50/70 border border-success-100 rounded-xl space-y-1">
                      <div className="flex justify-between text-[10px] text-success-700 font-bold">
                        <span>Đã bỏ qua bởi: {w.acknowledged_by}</span>
                        <span>{w.acknowledged_at ? format(new Date(w.acknowledged_at), 'dd/MM HH:mm') : ''}</span>
                      </div>
                      {w.reason && (
                        <p className="text-[11px] text-success-600 font-medium italic">
                          Lý do: &ldquo;{w.reason}&rdquo;
                        </p>
                      )}
                    </div>
                  ) : (
                    w.warning_level !== 'info' && (
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={() => handleViewShift(w.shift_id, w.date)}
                          className="flex-1 py-2 rounded-xl bg-white/60 text-gray-500 hover:text-gray-700 text-xs font-medium flex items-center justify-center gap-1 active:scale-[0.97] transition-all">
                          <Eye size={12} /> Xem ca
                        </button>
                        <button
                          onClick={() => handleAcknowledgeClick(w)}
                          className="flex-1 py-2 rounded-xl bg-white/60 text-gray-500 hover:text-gray-700 text-xs font-medium flex items-center justify-center gap-1 active:scale-[0.97] transition-all">
                          <XCircle size={12} /> Bỏ qua
                        </button>
                        <button
                          onClick={() => router.push(`/schedule/admin/review?weekStart=${weekDates[0]}`)}
                          className="flex-1 py-2 rounded-xl bg-white/60 text-gray-500 hover:text-gray-700 text-xs font-medium flex items-center justify-center gap-1 active:scale-[0.97] transition-all">
                          <Eye size={12} /> Về tuần này
                        </button>
                      </div>
                    )
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Acknowledge Dialog Modal */}
      {ackModalWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 border border-gray-100 shadow-xl space-y-4 animate-scale-up">
            <div className="space-y-1.5">
              <h3 className="text-sm font-bold text-dark-700">Xác nhận bỏ qua cảnh báo</h3>
              <p className="text-xs text-gray-400">Vui lòng cung cấp lý do khách quan để lưu vào nhật ký kiểm duyệt.</p>
            </div>
            
            <div className="p-3 bg-warning-50 border border-warning-100 rounded-2xl text-[11px] text-warning-700 font-medium">
              {ackModalWarning.message}
            </div>

            <textarea
              value={ackReason}
              onChange={(e) => setAckReason(e.target.value)}
              placeholder="Nhập lý do (ví dụ: Nhân sự đã đồng ý OT, cửa hàng thiếu người nghiêm trọng...)"
              rows={3}
              className="w-full text-xs p-3 border border-gray-100 rounded-2xl focus:outline-none focus:ring-1 focus:ring-amber-500/30 focus:border-warning-500 bg-vanilla-50/50 resize-none font-medium placeholder:text-gray-300"
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setAckModalWarning(null)
                  setAckReason('')
                }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-vanilla-50 active:scale-[0.98] transition-all">
                Hủy
              </button>
                <button
                  disabled={!ackReason.trim()}
                  onClick={() => {
                  const key = getScheduleWarningKey(ackModalWarning)
                  acknowledgeWarning(key, user.id, user.full_name, ackReason.trim())
                  setAckModalWarning(null)
                  setAckReason('')
                  setRefreshTrigger(prev => prev + 1)
                }}
                className="flex-1 py-2.5 rounded-xl bg-dark-700 hover:bg-dark-800 disabled:opacity-50 text-white text-xs font-semibold active:scale-[0.98] transition-all">
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

export default function ScheduleWarningsPage() {
  return (
    <Suspense fallback={null}>
      <ScheduleWarningsContent />
    </Suspense>
  )
}
