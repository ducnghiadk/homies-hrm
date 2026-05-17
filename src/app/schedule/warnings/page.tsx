'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { getShiftById } from '@/lib/mock-data'
import {
  scanWeekWarnings, scheduleRules,
  type WarningLevel, type RuleKey,
} from '@/lib/mock-data-schedule-rules'
import { format, addDays, startOfWeek } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ChevronLeft, AlertTriangle, ShieldAlert, Info,
  CheckCircle2, Eye, XCircle,
} from 'lucide-react'

const LEVEL_CONFIG: Record<WarningLevel, { label: string; color: string; bg: string; icon: typeof AlertTriangle }> = {
  block: { label: 'Chặn', color: 'text-red-600', bg: 'bg-red-50 border-red-200', icon: ShieldAlert },
  warning: { label: 'Cảnh báo', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', icon: AlertTriangle },
  info: { label: 'Thông tin', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', icon: Info },
}

export default function ScheduleWarningsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [isHydrated, setIsHydrated] = useState(false)
  const [levelFilter, setLevelFilter] = useState<WarningLevel | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<RuleKey | 'all'>('all')

  useEffect(() => { setIsHydrated(true) }, [])

  useEffect(() => {
    if (isHydrated && !isAuthenticated) router.push('/login')
  }, [isHydrated, isAuthenticated, router])

  if (!isHydrated || !user) return null

  const storeId = user.store_id
  const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
  const weekDates = Array.from({ length: 7 }, (_, i) => format(addDays(monday, i), 'yyyy-MM-dd'))
  const allWarnings = scanWeekWarnings(storeId, weekDates)

  const filtered = allWarnings.filter(w => {
    if (levelFilter !== 'all' && w.warning_level !== levelFilter) return false
    if (typeFilter !== 'all' && w.warning_type !== typeFilter) return false
    return true
  })

  const blockCount = allWarnings.filter(w => w.warning_level === 'block').length
  const warnCount = allWarnings.filter(w => w.warning_level === 'warning').length
  const infoCount = allWarnings.filter(w => w.warning_level === 'info').length

  return (
    <AppShell showNav>
      <div className="space-y-4 animate-fade-in font-['Inter'] pb-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${levelFilter === 'block' ? 'bg-red-500 text-white border-red-500' : 'bg-red-50 text-red-600 border-red-200'}`}>
            <ShieldAlert size={12} /> {blockCount} Chặn
          </button>
          <button onClick={() => setLevelFilter(levelFilter === 'warning' ? 'all' : 'warning')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${levelFilter === 'warning' ? 'bg-amber-500 text-white border-amber-500' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>
            <AlertTriangle size={12} /> {warnCount} Cảnh báo
          </button>
          <button onClick={() => setLevelFilter(levelFilter === 'info' ? 'all' : 'info')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${levelFilter === 'info' ? 'bg-blue-500 text-white border-blue-500' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>
            <Info size={12} /> {infoCount} Thông tin
          </button>
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          <button onClick={() => setTypeFilter('all')}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${typeFilter === 'all' ? 'bg-dark-700 text-white border-dark-700' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
            Tất cả
          </button>
          {scheduleRules.filter(r => r.is_active).map(rule => (
            <button key={rule.rule_key} onClick={() => setTypeFilter(typeFilter === rule.rule_key ? 'all' : rule.rule_key)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-bold border transition-colors ${typeFilter === rule.rule_key ? 'bg-dark-700 text-white border-dark-700' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
              {rule.label}
            </button>
          ))}
        </div>

        {/* Warning list */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-green-400" />
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

              return (
                <div key={w.id} className={`rounded-2xl border p-3.5 space-y-2 ${cfg.bg}`}>
                  <div className="flex items-start gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${w.warning_level === 'block' ? 'bg-red-100' : w.warning_level === 'warning' ? 'bg-amber-100' : 'bg-blue-100'}`}>
                      <Icon size={16} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${w.warning_level === 'block' ? 'bg-red-200 text-red-700' : w.warning_level === 'warning' ? 'bg-amber-200 text-amber-700' : 'bg-blue-200 text-blue-700'}`}>{cfg.label}</span>
                        <span className="text-xs text-gray-400">
                          {format(new Date(w.date), 'EEEE dd/MM', { locale: vi })}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-dark-700 mt-1">{w.message}</p>
                      {shift && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {shift.name} ({shift.start_time} - {shift.end_time})
                        </p>
                      )}
                    </div>
                  </div>

                  {!w.is_acknowledged && w.warning_level !== 'info' && (
                    <div className="flex gap-2 pt-1">
                      <button className="flex-1 py-2 rounded-xl bg-white/60 text-gray-500 text-xs font-medium flex items-center justify-center gap-1 active:scale-[0.97] transition-transform">
                        <Eye size={12} /> Xem ca
                      </button>
                      <button className="flex-1 py-2 rounded-xl bg-white/60 text-gray-500 text-xs font-medium flex items-center justify-center gap-1 active:scale-[0.97] transition-transform">
                        <XCircle size={12} /> Bỏ qua
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
