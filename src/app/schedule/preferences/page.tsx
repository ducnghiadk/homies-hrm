'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  savePreferences, getPreferencesForWeek,
} from '@/lib/mock-data-preferences'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ChevronLeft, Check, Send, Save, Sun, Sunset, Moon, X as XIcon,
} from 'lucide-react'

// ─── Next-week date helpers ───
function getNextWeekDates(): string[] {
  const now = new Date()
  const nextMonday = new Date(now)
  nextMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(nextMonday)
    d.setDate(nextMonday.getDate() + i)
    return format(d, 'yyyy-MM-dd')
  })
}

interface DayPref {
  date: string
  morning: boolean
  afternoon: boolean
  evening: boolean
  notAvailable: boolean
  reason: string
}

export default function ShiftPreferencesPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [toast, setToast] = useState<string | null>(null)

  const weekDates = useMemo(() => getNextWeekDates(), [])
  const weekStart = weekDates[0]

  // Initialize preferences
  const [days, setDays] = useState<DayPref[]>(() =>
    weekDates.map(date => ({
      date,
      morning: true,
      afternoon: true,
      evening: true,
      notAvailable: false,
      reason: '',
    }))
  )
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'none' | 'draft' | 'submitted'>('none')

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])

  // Load existing preferences
  useEffect(() => {
    if (!user) return
    const existing = getPreferencesForWeek(user.id, weekStart)
    if (existing.length > 0) {
      setDays(weekDates.map(date => {
        const pref = existing.find(p => p.date === date)
        return pref ? {
          date,
          morning: pref.morning_available,
          afternoon: pref.afternoon_available,
          evening: pref.evening_available,
          notAvailable: pref.not_available,
          reason: pref.reason || '',
        } : { date, morning: true, afternoon: true, evening: true, notAvailable: false, reason: '' }
      }))
      setNote(existing[0].note || '')
      setStatus(existing[0].status)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  if (!user) return null

  const updateDay = (idx: number, field: keyof DayPref, value: boolean | string) => {
    setDays(prev => {
      const next = [...prev]
      const day = { ...next[idx] }

      if (field === 'notAvailable' && value === true) {
        day.morning = false
        day.afternoon = false
        day.evening = false
        day.notAvailable = true
      } else if ((field === 'morning' || field === 'afternoon' || field === 'evening') && value === true) {
        day[field] = true
        day.notAvailable = false
      } else {
        (day as Record<string, boolean | string>)[field] = value
      }

      next[idx] = day
      return next
    })
  }

  const handleSave = (submitStatus: 'draft' | 'submitted') => {
    savePreferences(
      user.id,
      weekStart,
      days.map(d => ({
        date: d.date,
        morning: d.morning,
        afternoon: d.afternoon,
        evening: d.evening,
        notAvailable: d.notAvailable,
        reason: d.reason || undefined,
      })),
      note,
      submitStatus,
    )
    setStatus(submitStatus)
    showToast(submitStatus === 'submitted' ? 'Đã gửi đăng ký thành công!' : 'Đã lưu nháp')
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const weekRange = (() => {
    const s = new Date(weekDates[0])
    const e = new Date(weekDates[6])
    return `${format(s, 'dd/MM')} — ${format(e, 'dd/MM/yyyy')}`
  })()

  const shifts = [
    { key: 'morning' as const, label: 'Ca sáng', icon: Sun, color: '#3B82F6', time: '08:00–14:00' },
    { key: 'afternoon' as const, label: 'Ca chiều', icon: Sunset, color: '#F59E0B', time: '14:00–20:00' },
    { key: 'evening' as const, label: 'Ca tối', icon: Moon, color: '#8B5CF6', time: '20:00–02:00' },
  ]

  return (
    <AppShell showNav>
      <div className="space-y-5 animate-fade-in font-['Inter'] pb-6">
        {/* ─── Header ─── */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-dark-700">Đăng ký ca mong muốn</h1>
            <p className="text-xs text-gray-400 mt-0.5">Tuần {weekRange}</p>
          </div>
        </div>

        {/* ─── Status badge ─── */}
        {status !== 'none' && (
          <div className={`px-4 py-2.5 rounded-xl text-xs font-bold text-center ${
            status === 'submitted'
              ? 'bg-green-50 text-green-600 border border-green-200'
              : 'bg-amber-50 text-amber-600 border border-amber-200'
          }`}>
            {status === 'submitted' ? '✅ Đã gửi — Chờ xếp lịch' : '📝 Nháp — Chưa gửi'}
          </div>
        )}

        {/* ─── Day Cards ─── */}
        <div className="space-y-3">
          {days.map((day, idx) => {
            const d = new Date(day.date)

            return (
              <div key={day.date} className={`bg-white rounded-2xl border p-4 transition-all ${
                day.notAvailable ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
              }`}>
                {/* Day header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-dark-700 capitalize">
                      {format(d, 'EEEE', { locale: vi })}
                    </p>
                    <p className="text-xs text-gray-400">{format(d, 'dd/MM/yyyy')}</p>
                  </div>
                  {day.notAvailable && (
                    <span className="text-xs font-bold text-red-500 bg-red-100 px-2 py-1 rounded-lg">Không thể làm</span>
                  )}
                </div>

                {/* Shift toggles */}
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {shifts.map(shift => {
                    const isOn = day[shift.key]
                    const Icon = shift.icon
                    return (
                      <button
                        key={shift.key}
                        onClick={() => updateDay(idx, shift.key, !isOn)}
                        disabled={status === 'submitted'}
                        className={`relative p-3 rounded-xl text-center transition-all ${
                          isOn
                            ? 'shadow-sm'
                            : 'bg-gray-50 opacity-50'
                        } ${status === 'submitted' ? 'cursor-default' : ''}`}
                        style={isOn ? { backgroundColor: `${shift.color}12`, color: shift.color } : undefined}
                      >
                        <Icon size={18} className="mx-auto mb-1" style={isOn ? { color: shift.color } : { color: '#9CA3AF' }} />
                        <p className="text-xs font-bold">{shift.label}</p>
                        <p className="text-[8px] opacity-60">{shift.time}</p>
                        {isOn && (
                          <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: shift.color }}>
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                {/* Not available toggle */}
                <button
                  onClick={() => updateDay(idx, 'notAvailable', !day.notAvailable)}
                  disabled={status === 'submitted'}
                  className={`w-full p-2.5 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                    day.notAvailable
                      ? 'bg-red-100 text-red-600 border border-red-200'
                      : 'bg-gray-50 text-gray-400 hover:text-gray-500'
                  } ${status === 'submitted' ? 'cursor-default' : ''}`}
                >
                  <XIcon size={14} />
                  Không thể làm
                </button>

                {/* Reason input (when not available) */}
                {day.notAvailable && (
                  <input
                    type="text"
                    value={day.reason}
                    onChange={e => updateDay(idx, 'reason', e.target.value)}
                    disabled={status === 'submitted'}
                    placeholder="Lý do (tùy chọn)..."
                    className="w-full mt-2 bg-white border border-red-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-red-300 placeholder:text-gray-300"
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* ─── General Note ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-500 font-medium mb-2">Ghi chú cho quản lý</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            disabled={status === 'submitted'}
            placeholder="VD: Em muốn làm ca sáng nhiều hơn, tuần này em bận chiều T4..."
            rows={3}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300 resize-none"
          />
        </div>

        {/* ─── Actions ─── */}
        {status !== 'submitted' ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleSave('draft')}
              className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            >
              <Save size={16} /> Lưu nháp
            </button>
            <button
              onClick={() => handleSave('submitted')}
              className="flex-1 py-3 rounded-xl bg-primary-600 text-white text-sm font-bold shadow-md flex items-center justify-center gap-2 active:scale-[0.97] transition-transform"
            >
              <Send size={16} /> Gửi đăng ký
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setStatus('draft'); showToast('Đã mở lại để chỉnh sửa') }}
            className="w-full py-3 rounded-xl bg-amber-100 text-amber-700 text-sm font-medium flex items-center justify-center gap-2"
          >
            Chỉnh sửa lại
          </button>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-dark-700 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}
    </AppShell>
  )
}
