'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { format, startOfWeek } from 'date-fns'
import AppShell from '@/components/layout/AppShell'
import { mockStaffingForecast, mockStaffingAlerts, mockLaborOptimization, formatVND } from '@/lib/mock-data-p5'
import { mockStores } from '@/lib/mock-data'
import { AlertTriangle, TrendingDown, TrendingUp, Zap, Check, Lightbulb, CalendarDays, MapPin, DollarSign } from 'lucide-react'

function getWeekStartFromDate(date: string): string {
  const parsed = new Date(`${date}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) {
    return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd')
  }
  return format(startOfWeek(parsed, { weekStartsOn: 1 }), 'yyyy-MM-dd')
}

function resolveStoreId(storeLabel: string, fallbackStoreId: string): string {
  const normalized = storeLabel.toLowerCase()
  const store = mockStores.find(candidate =>
    normalized === candidate.name.toLowerCase() ||
    normalized.includes(candidate.name.replace('Homies Milk Tea - ', '').toLowerCase())
  )
  return store?.id || fallbackStoreId
}

export default function StaffingPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<'forecast'|'alerts'|'optimize'>('forecast')

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const currentStoreId = user.store_id || 'store-001'

  const openManageContext = (date: string, storeId = currentStoreId, focusDate?: string) => {
    const weekStart = getWeekStartFromDate(date)
    const params = new URLSearchParams({
      weekStart,
      storeId,
    })

    if (focusDate || date) {
      params.set('focusDate', focusDate || date)
    }

    router.push(`/schedule/manage?${params.toString()}`)
  }

  const openWarningsContext = (date: string) => {
    router.push(`/schedule/warnings?weekStart=${getWeekStartFromDate(date)}`)
  }

  const openScheduleWizard = () => {
    router.push('/settings/staffing?tab=schedule')
  }

  const openOpenShiftContext = (date: string, storeLabel: string) => {
    const storeId = resolveStoreId(storeLabel, currentStoreId)
    const params = new URLSearchParams({
      weekStart: getWeekStartFromDate(date),
      storeId,
      focusDate: date,
    })
    router.push(`/schedule/manage?${params.toString()}`)
  }

  const handleOptimizationApply = (action: string) => {
    if (action.includes('Thuê thêm')) {
      openScheduleWizard()
      return
    }

    if (action.includes('Chuyển') || action.includes('Giảm') || action.includes('Cắt OT')) {
      openManageContext(new Date().toISOString().split('T')[0], currentStoreId)
      return
    }

    openScheduleWizard()
  }

  return (
    <AppShell title="Smart Staffing">
      <div className="space-y-4">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 animate-fade-in">
          <div className="card p-3 text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--error)' }}>{mockStaffingAlerts.filter(a => a.type === 'under').length}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Thiếu người</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--warning)' }}>{mockStaffingAlerts.filter(a => a.type === 'over').length}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Dư người</div>
          </div>
          <div className="card p-3 text-center">
            <div className="text-lg font-bold" style={{ color: 'var(--success)' }}>{mockLaborOptimization.savings > 0 ? formatVND(mockLaborOptimization.savings) : '0'}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Có thể tiết kiệm</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 animate-fade-in">
          {[
            { k: 'forecast' as const, l: 'Dự báo' },
            { k: 'alerts' as const, l: 'Cảnh báo', badge: mockStaffingAlerts.filter(a => a.severity === 'high').length },
            { k: 'optimize' as const, l: 'Tối ưu' },
          ].map(({ k, l, badge }) => (
            <button key={k} className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all relative"
              style={{ background: tab === k ? 'var(--primary)' : 'var(--gray-100)', color: tab === k ? 'white' : 'var(--text-secondary)' }}
              onClick={() => setTab(k)}>
              {l}
              {badge && badge > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center" style={{ background: 'var(--error)', color: 'white' }}>{badge}</span>}
            </button>
          ))}
        </div>

        {/* FORECAST */}
        {tab === 'forecast' && (
          <div className="space-y-2 animate-slide-up">
            <h3 className="text-sm font-bold flex items-center gap-1.5"><CalendarDays size={14} className="text-gray-400" /> Dự báo tuần tới (17-23/02)</h3>
            {mockStaffingForecast.map(f => (
              <div key={f.date} className="card p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <div>
                    <span className="text-sm font-semibold">{f.day}</span>
                    <span className="text-xs ml-1.5" style={{ color: 'var(--text-muted)' }}>{f.date.split('-').slice(1).join('/')}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {f.gap < 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5" style={{ background: 'var(--error-light)', color: 'var(--error)' }}>
                        <TrendingDown size={10} /> Thiếu {Math.abs(f.gap)}
                      </span>
                    ) : f.gap > 0 ? (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5" style={{ background: 'var(--warning-light)', color: 'var(--warning)' }}>
                        <TrendingUp size={10} /> Dư {f.gap}
                      </span>
                    ) : (
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5" style={{ background: 'var(--success-light)', color: 'var(--success)' }}><Check size={10} /> Đủ</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span style={{ color: 'var(--text-muted)' }}>Cần: <b>{f.demand}</b></span>
                  <span style={{ color: 'var(--text-muted)' }}>Đã xếp: <b>{f.scheduled}</b></span>
                  {f.reason && <span className="flex-1 text-right flex items-center justify-end gap-0.5" style={{ color: 'var(--text-secondary)' }}><Lightbulb size={10} /> {f.reason}</span>}
                </div>
                {/* Visual bar */}
                <div className="flex gap-0.5 mt-2">
                  {Array.from({ length: f.demand }, (_, i) => (
                    <div key={i} className="flex-1 h-2 rounded-full" style={{ background: i < f.scheduled ? 'var(--success)' : 'var(--error)' }} />
                  ))}
                </div>
                {f.gap !== 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => openManageContext(f.date, currentStoreId)}
                      className="rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-primary/90"
                    >
                      Mở phân ca
                    </button>
                    <button
                      onClick={() => openWarningsContext(f.date)}
                      className="rounded-xl border border-warning-200 bg-warning-50 px-3 py-2 text-[11px] font-bold text-warning-700 transition-colors hover:bg-warning-100"
                    >
                      Xem cảnh báo
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ALERTS */}
        {tab === 'alerts' && (
          <div className="space-y-2 animate-slide-up">
            {mockStaffingAlerts.map(alert => (
              <div key={alert.id} className="card p-3 flex items-start gap-3" style={{
                borderLeft: `3px solid ${alert.severity === 'high' ? 'var(--error)' : alert.severity === 'medium' ? 'var(--warning)' : 'var(--accent)'}`,
              }}>
                <AlertTriangle size={18} style={{ color: alert.severity === 'high' ? 'var(--error)' : alert.severity === 'medium' ? 'var(--warning)' : 'var(--accent)', marginTop: 2 }} />
                <div className="flex-1">
                  <div className="text-sm font-semibold">{alert.message}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    <MapPin size={10} className="inline" /> {alert.store} · <CalendarDays size={10} className="inline" /> {alert.date}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {alert.type === 'under' && (
                      <>
                        <button
                          onClick={() => openManageContext(alert.date, resolveStoreId(alert.store, currentStoreId), alert.date)}
                          className="rounded-xl bg-primary px-3 py-2 text-[11px] font-bold text-white transition-colors hover:bg-primary/90"
                        >
                          Xếp ca ngay
                        </button>
                        <button
                          onClick={() => openOpenShiftContext(alert.date, alert.store)}
                          className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                        >
                          Xử lý thiếu người
                        </button>
                      </>
                    )}
                    {alert.type === 'over' && (
                      <button
                        onClick={() => openManageContext(alert.date, resolveStoreId(alert.store, currentStoreId), alert.date)}
                        className="rounded-xl border border-warning-200 bg-warning-50 px-3 py-2 text-[11px] font-bold text-warning-700 transition-colors hover:bg-warning-100"
                      >
                        Rà soát lịch
                      </button>
                    )}
                    {alert.type === 'event' && (
                      <button
                        onClick={openScheduleWizard}
                        className="rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-[11px] font-bold text-primary-700 transition-colors hover:bg-primary-100"
                      >
                        Mở Smart Schedule
                      </button>
                    )}
                  </div>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-bold" style={{
                  background: alert.severity === 'high' ? 'var(--error-light)' : alert.severity === 'medium' ? 'var(--warning-light)' : 'var(--gray-100)',
                  color: alert.severity === 'high' ? 'var(--error)' : alert.severity === 'medium' ? 'var(--warning)' : 'var(--text-muted)',
                }}>
                  {alert.severity === 'high' ? 'Cao' : alert.severity === 'medium' ? 'TB' : 'Thấp'}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* OPTIMIZE */}
        {tab === 'optimize' && (
          <div className="space-y-3 animate-slide-up">
            <div className="card-elevated p-4 text-center" style={{ background: 'linear-gradient(135deg, #48C07910, #2F6FA810)' }}>
              <Zap size={24} className="mx-auto mb-1" style={{ color: 'var(--success)' }} />
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Tiết kiệm khả thi</div>
              <div className="text-2xl font-black" style={{ color: 'var(--success)' }}>{formatVND(mockLaborOptimization.savings)}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                {formatVND(mockLaborOptimization.current_cost)} → {formatVND(mockLaborOptimization.optimized_cost)}
              </div>
            </div>

            <h3 className="text-sm font-bold flex items-center gap-1.5"><Lightbulb size={14} className="text-warning-500" /> Đề xuất tối ưu</h3>
            {mockLaborOptimization.suggestions.map((s, i) => (
              <div key={i} className="card p-3 flex items-start gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{
                  background: s.save > 0 ? 'var(--success-light)' : s.save < 0 ? 'var(--warning-light)' : 'var(--gray-100)',
                  color: s.save > 0 ? 'var(--success)' : s.save < 0 ? 'var(--warning)' : 'var(--text-muted)',
                }}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-sm">{s.action}</div>
                  <div className="flex gap-3 mt-1 text-xs">
                    <span style={{ color: s.save > 0 ? 'var(--success)' : s.save < 0 ? 'var(--error)' : 'var(--text-muted)' }}>
                      {s.save > 0 ? <><DollarSign size={10} className="inline" /> -{formatVND(s.save)}</> : s.save < 0 ? `+${formatVND(Math.abs(s.save))}` : '↔️ 0'}
                    </span>
                    <span style={{ color: 'var(--text-muted)' }}>Rủi ro: {s.risk}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleOptimizationApply(s.action)}
                  className="rounded-full px-3 py-2 text-[11px] font-bold"
                  style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}
                >
                  <Check size={14} className="inline mr-1" /> Mở xử lý
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
