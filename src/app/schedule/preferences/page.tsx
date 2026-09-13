'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  getPreferencesForWeek,
  getShiftPreferenceAvailability,
  savePreferences,
  type ShiftPreferenceLevel,
} from '@/lib/mock-data-preferences'
import {
  getRegistrationWeekByWeek,
  RegistrationWeek
} from '@/lib/mock-data-registration-weeks'
import { ShiftTemplateService, type ShiftTemplate } from '@/lib/services/shift-template-service'
import { shiftRegistrationAdapter } from '@/lib/adapters'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ChevronLeft, Check, Send, Save, X as XIcon,
  AlertTriangle, Clock, Lock, CheckCircle
} from 'lucide-react'

function getWeekDates(weekStartOverride?: string | null): string[] {
  const targetMonday = weekStartOverride ? new Date(`${weekStartOverride}T00:00:00`) : null
  const nextMonday = targetMonday && !Number.isNaN(targetMonday.getTime())
    ? targetMonday
    : (() => {
        const now = new Date()
        const computed = new Date(now)
        computed.setDate(now.getDate() - ((now.getDay() + 6) % 7) + 7)
        return computed
      })()

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(nextMonday)
    d.setDate(nextMonday.getDate() + i)
    return format(d, 'yyyy-MM-dd')
  })
}

type DayPref = {
  date: string
  notAvailable: boolean
  reason: string
  shiftPreferences: Record<string, ShiftPreferenceLevel>
}

const LEGACY_SHIFT_IDS = {
  morning: 'shift-001',
  afternoon: 'shift-002',
  evening: 'shift-003',
} as const

function buildInitialDay(date: string, shiftTemplates: ShiftTemplate[]): DayPref {
  return {
    date,
    notAvailable: false,
    reason: '',
    shiftPreferences: Object.fromEntries(shiftTemplates.map(template => [template.id, 'available'])),
  }
}

function buildLegacyPreferenceFlags(shiftPreferences: Record<string, ShiftPreferenceLevel>) {
  return {
    morning: shiftPreferences[LEGACY_SHIFT_IDS.morning] !== 'unavailable',
    afternoon: shiftPreferences[LEGACY_SHIFT_IDS.afternoon] !== 'unavailable',
    evening: shiftPreferences[LEGACY_SHIFT_IDS.evening] !== 'unavailable',
  }
}

function buildPreferenceLevels(shiftPreferences: Record<string, ShiftPreferenceLevel>): Record<string, ShiftPreferenceLevel> {
  return { ...shiftPreferences }
}

function buildAvailabilityMap(shiftPreferences: Record<string, ShiftPreferenceLevel>): Record<string, boolean> {
  return Object.fromEntries(
    Object.entries(shiftPreferences).map(([templateId, level]) => [templateId, level !== 'unavailable'])
  )
}

function getNextPreferenceLevel(level: ShiftPreferenceLevel): ShiftPreferenceLevel {
  if (level === 'preferred') return 'available'
  if (level === 'available') return 'unavailable'
  return 'preferred'
}

function getPreferenceBadge(level: ShiftPreferenceLevel, color: string) {
  if (level === 'preferred') {
    return {
      label: 'Uu tien',
      cardClass: 'shadow-sm ring-1',
      style: { backgroundColor: `${color}14`, color, boxShadow: `inset 0 0 0 1px ${color}33` },
      pillStyle: { backgroundColor: color, color: '#FFFFFF' },
    }
  }

  if (level === 'available') {
    return {
      label: 'Co the lam',
      cardClass: 'shadow-sm',
      style: { backgroundColor: `${color}0D`, boxShadow: `inset 0 0 0 1px ${color}22` },
      pillStyle: { backgroundColor: `${color}18`, color },
    }
  }

  return {
    label: 'Khong phu hop',
    cardClass: '',
    style: {},
    pillStyle: { backgroundColor: '#F3F4F6', color: '#6B7280' },
  }
}

function ShiftPreferencesPageContent() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [toast, setToast] = useState<string | null>(null)
  const [regWeek, setRegWeek] = useState<RegistrationWeek | null>(null)
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [isLocked, setIsLocked] = useState<boolean>(false)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'none' | 'draft' | 'submitted'>('none')
  const [days, setDays] = useState<DayPref[]>([])

  const requestedWeekStart = searchParams.get('weekStart')
  const weekDates = useMemo(() => getWeekDates(requestedWeekStart), [requestedWeekStart])
  const weekStart = weekDates[0]

  const shiftTemplates = useMemo(
    () => (user ? ShiftTemplateService.getActiveForStore(user.store_id) : []),
    [user],
  )

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!user) return
    const weekData = getRegistrationWeekByWeek(user.store_id, weekStart)
    const timer = setTimeout(() => {
      if (weekData) {
        setRegWeek(weekData)

        const now = new Date()
        const deadline = new Date(weekData.registration_deadline)
        setIsLocked(weekData.status !== 'open' || now > deadline)
        return
      }

      setRegWeek(null)
      setIsLocked(true)
    }, 0)

    return () => clearTimeout(timer)
  }, [user, weekStart])

  useEffect(() => {
    if (!regWeek || regWeek.status !== 'open') return

    const calculateTimeLeft = () => {
      const now = new Date().getTime()
      const deadline = new Date(regWeek.registration_deadline).getTime()
      const diff = deadline - now

      if (diff <= 0) {
        setTimeLeft('Da het han dang ky')
        setIsLocked(true)
        return true
      }

      const daysCount = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hoursCount = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutesCount = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const secondsCount = Math.floor((diff % (1000 * 60)) / 1000)

      let timeString = ''
      if (daysCount > 0) timeString += `${daysCount} ngay `
      timeString += `${hoursCount}g ${minutesCount}p ${secondsCount}s`
      setTimeLeft(timeString)
      return false
    }

    const isExpired = calculateTimeLeft()
    if (isExpired) return

    const timer = setInterval(() => {
      calculateTimeLeft()
    }, 1000)

    return () => clearInterval(timer)
  }, [regWeek])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (shiftTemplates.length === 0) {
        setDays(weekDates.map(date => ({
          date,
          notAvailable: false,
          reason: '',
          shiftPreferences: {},
        })))
        return
      }

      const existingByDate = user ? getPreferencesForWeek(user.id, weekStart) : []
      setDays(weekDates.map(date => {
        const pref = existingByDate.find(item => item.date === date)
        const base = buildInitialDay(date, shiftTemplates)

        if (!pref) return base

        return {
          date,
          notAvailable: pref.not_available,
          reason: pref.reason || '',
          shiftPreferences: Object.fromEntries(
            shiftTemplates.map(template => [
              template.id,
              pref.shift_preference_levels?.[template.id]
                || (getShiftPreferenceAvailability(pref, template.id) ? 'preferred' : 'unavailable'),
            ])
          ),
        }
      }))

      if (existingByDate.length > 0) {
        setNote(existingByDate[0].note || '')
        setStatus(existingByDate[0].status)
      } else {
        setNote('')
        setStatus('none')
      }
    }, 0)

    return () => clearTimeout(timer)
  }, [shiftTemplates, user, weekDates, weekStart])

  if (!user) return null

  const updateShiftPreference = (dayIndex: number, shiftTemplateId: string) => {
    if (isLocked || status === 'submitted') return

    setDays(prev => prev.map((day, index) => {
      if (index !== dayIndex) return day
      const currentLevel = day.shiftPreferences[shiftTemplateId] || 'available'
      return {
        ...day,
        notAvailable: false,
        shiftPreferences: {
          ...day.shiftPreferences,
          [shiftTemplateId]: getNextPreferenceLevel(currentLevel),
        },
      }
    }))
  }

  const updateDayAvailability = (dayIndex: number, nextValue: boolean) => {
    if (isLocked || status === 'submitted') return

    setDays(prev => prev.map((day, index) => {
      if (index !== dayIndex) return day
      return nextValue
        ? {
            ...day,
            notAvailable: true,
            shiftPreferences: Object.fromEntries(
              Object.keys(day.shiftPreferences).map(templateId => [templateId, 'unavailable'])
            ),
          }
        : buildInitialDay(day.date, shiftTemplates)
    }))
  }

  const updateReason = (dayIndex: number, value: string) => {
    if (isLocked || status === 'submitted') return

    setDays(prev => prev.map((day, index) => (
      index === dayIndex ? { ...day, reason: value } : day
    )))
  }

  const handleSave = async (submitStatus: 'draft' | 'submitted') => {
    if (isLocked) {
      showToast('Đợt đăng ký ca đang khóa, không thể gửi!')
      return
    }

    const payload = days.map(day => {
      const legacy = buildLegacyPreferenceFlags(day.shiftPreferences)
      return {
        date: day.date,
        morning: legacy.morning,
        afternoon: legacy.afternoon,
        evening: legacy.evening,
        notAvailable: day.notAvailable,
        shiftPreferences: buildAvailabilityMap(day.shiftPreferences),
        shiftPreferenceLevels: buildPreferenceLevels(day.shiftPreferences),
        reason: day.reason || undefined,
      }
    })

    savePreferences(user.id, weekStart, payload, note, submitStatus)

    if (submitStatus === 'submitted') {
      const prefItems = payload.map((p, idx) => ({
        id: `pref-${user.id}-${p.date}-${idx}`,
        user_id: user.id,
        week_start_date: weekStart,
        date: p.date,
        morning_available: p.morning,
        afternoon_available: p.afternoon,
        evening_available: p.evening,
        not_available: p.notAvailable,
        shift_preferences: p.shiftPreferences,
        shift_preference_levels: p.shiftPreferenceLevels,
        reason: p.reason,
        note,
        status: 'submitted' as const,
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      }))
      await shiftRegistrationAdapter.submitPreferences(user.id, weekStart, prefItems, user)
    }

    setStatus(submitStatus)
    showToast(submitStatus === 'submitted' ? 'Đã gửi đăng ký ca thành công lên CSDL!' : 'Đã lưu nháp nguyện vọng')
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const weekRange = (() => {
    const s = new Date(weekDates[0])
    const e = new Date(weekDates[6])
    return `${format(s, 'dd/MM')} - ${format(e, 'dd/MM/yyyy')}`
  })()

  return (
    <AppShell showNav>
      <div className="space-y-5 animate-fade-in font-['Inter'] pb-24">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 transition-colors hover:bg-gray-200">
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-dark-700">Dang ky ca mong muon</h1>
            <p className="mt-0.5 text-xs text-gray-400">Tuan lam viec: {weekRange}</p>
          </div>
        </div>

        {!regWeek ? (
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-vanilla-50 p-4 text-xs font-semibold text-gray-600">
            <Lock size={16} className="text-gray-400" />
            <span>Admin chua mo cong dang ky ca cho tuan ke tiep.</span>
          </div>
        ) : regWeek.status === 'closed' ? (
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-vanilla-50 p-4 text-xs font-semibold text-gray-500">
            <Lock size={16} />
            <span>Dot dang ky ca cho tuan nay dang o trang thai nhap (dong).</span>
          </div>
        ) : regWeek.status === 'reviewing' || regWeek.status === 'published' ? (
          <div className="flex items-center gap-2 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-xs font-bold text-primary-700">
            <Lock size={16} className="text-primary-500" />
            <span>Lich dang trong giai doan sap xep/da duyet. Cong dang ky da dong.</span>
          </div>
        ) : isLocked ? (
          <div className="flex items-center gap-2 rounded-2xl border border-error-200 bg-error-50 p-4 text-xs font-bold text-error-700">
            <AlertTriangle size={16} className="text-error-500" />
            <span>Cong dang ky da dong do qua han chot ({regWeek.registration_deadline.replace('T', ' ')}).</span>
          </div>
        ) : (
          <div className="flex items-center justify-between rounded-3xl border border-emerald-200 bg-gradient-to-r from-success-50 to-success-100 p-4 text-xs font-bold text-emerald-800 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock size={16} className="animate-pulse text-emerald-600" />
              <span>Thoi gian dang ky con lai:</span>
            </div>
            <span className="rounded-xl border border-emerald-100 bg-white px-3 py-1 text-sm font-extrabold tracking-tight text-emerald-600 shadow-[0_2px_6px_rgba(16,185,129,0.1)]">
              {timeLeft}
            </span>
          </div>
        )}

        {status !== 'none' && (
          <div className={`rounded-xl px-4 py-2.5 text-center text-xs font-bold ${
            status === 'submitted'
              ? 'border border-success-200 bg-success-50 text-success-600'
              : 'border border-warning-200 bg-warning-50 text-warning-600'
          }`}>
            {status === 'submitted' ? 'Da gui nguyen vong - Dang cho duyet xep lich' : 'Ban nhap nguyen vong - Chua gui'}
          </div>
        )}

        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
            <p className="text-sm font-bold text-gray-800">Danh sach ca duoc mo cho chi nhanh</p>
              <p className="mt-1 text-xs text-gray-400">Chon tung ca theo 3 muc: uu tien, co the lam, hoac khong phu hop.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {shiftTemplates.map(template => (
                <div
                  key={template.id}
                  className="rounded-xl border px-3 py-2 text-xs font-semibold"
                  style={{ borderColor: `${template.color}33`, backgroundColor: `${template.color}12`, color: template.color }}
                >
                  <div className="font-bold">{template.name}</div>
                  <div className="text-[10px] opacity-75">{template.start_time} - {template.end_time}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {days.map((day, idx) => {
            const d = new Date(day.date)
            const preferredCount = Object.values(day.shiftPreferences).filter(level => level === 'preferred').length
            const availableCount = Object.values(day.shiftPreferences).filter(level => level === 'available').length

            return (
              <div
                key={day.date}
                className={`rounded-2xl border p-4 transition-all ${
                  day.notAvailable ? 'border-error-250 bg-error-50/20' : 'border-gray-100 bg-white'
                } ${isLocked ? 'opacity-85' : ''}`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold capitalize text-dark-700">
                      {format(d, 'EEEE', { locale: vi })}
                    </p>
                    <p className="text-xs font-medium text-gray-400">{format(d, 'dd/MM/yyyy')}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-extrabold ${
                      day.notAvailable
                        ? 'border-error-200 bg-error-50 text-error-600'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-600'
                    }`}>
                      {day.notAvailable ? 'Khong the lam' : `${preferredCount} uu tien · ${availableCount} co the lam`}
                    </span>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {shiftTemplates.map(template => {
                    const level = day.shiftPreferences[template.id] || 'available'
                    const badge = getPreferenceBadge(level, template.color)
                    return (
                      <button
                        key={template.id}
                        onClick={() => updateShiftPreference(idx, template.id)}
                        disabled={isLocked || status === 'submitted'}
                        className={`relative rounded-xl p-3 text-left transition-all ${
                          level === 'unavailable' ? 'bg-vanilla-50 opacity-75' : badge.cardClass
                        } ${(isLocked || status === 'submitted') ? 'cursor-not-allowed' : ''}`}
                        style={level !== 'unavailable' ? badge.style : undefined}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 h-9 w-2 rounded-full" style={{ backgroundColor: level === 'unavailable' ? '#D1D5DB' : template.color }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-800" style={level !== 'unavailable' ? { color: template.color } : undefined}>
                              {template.name}
                            </p>
                            <p className="text-[11px] font-semibold text-gray-500">
                              {template.start_time} - {template.end_time}
                            </p>
                            <p className="mt-1 text-[10px] text-gray-400">
                              {ShiftTemplateService.getPositionLabels(template).join(', ') || 'Khong khoa vi tri'}
                            </p>
                            <span
                              className="mt-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold"
                              style={badge.pillStyle}
                            >
                              {badge.label}
                            </span>
                          </div>
                        </div>
                        {level !== 'unavailable' && (
                          <div className="absolute right-2 top-2 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-extrabold animate-scale-up" style={badge.pillStyle}>
                            {level === 'preferred' ? <Check size={11} className="text-white" /> : 'OK'}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => updateDayAvailability(idx, !day.notAvailable)}
                  disabled={isLocked || status === 'submitted'}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold transition-all ${
                    day.notAvailable
                      ? 'border border-error-200 bg-error-100 text-error-650'
                      : 'bg-vanilla-50 text-gray-400 hover:text-gray-500'
                  } ${(isLocked || status === 'submitted') ? 'cursor-not-allowed' : ''}`}
                >
                  <XIcon size={14} />
                  Khong the lam viec ngay nay
                </button>

                {day.notAvailable && (
                  <input
                    type="text"
                    value={day.reason}
                    onChange={e => updateReason(idx, e.target.value)}
                    disabled={isLocked || status === 'submitted'}
                    placeholder="Ly do nghi (tuy chon)..."
                    className="mt-2 w-full rounded-xl border border-error-200 bg-white px-3 py-2 text-xs font-semibold placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-red-400"
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="mb-3 flex flex-wrap gap-2 text-[11px] font-semibold">
            <span className="rounded-full bg-emerald-600 px-2.5 py-1 text-white">Uu tien</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-700">Co the lam</span>
            <span className="rounded-full bg-primary-50 px-2.5 py-1 text-gray-600">Khong phu hop</span>
          </div>
          <p className="mb-2 text-xs font-bold text-gray-550">Ghi chu gui quan ly</p>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            disabled={isLocked || status === 'submitted'}
            placeholder="Vi du: Em muon dang ky lam nhieu ca mo cua, hoac tranh khung gio toi thu 4..."
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-200 bg-vanilla-50 px-3 py-2.5 text-xs font-semibold placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {isLocked ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-primary-50 p-4 text-xs font-bold text-gray-400">
            <Lock size={16} />
            <span>Form dang ky da khoa (het han hoac chua mo).</span>
          </div>
        ) : status !== 'submitted' ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleSave('draft')}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-50 py-3 text-sm font-bold text-gray-600 transition-all hover:bg-gray-200 active:scale-[0.97]"
            >
              <Save size={16} /> Luu nhap
            </button>
            <button
              onClick={() => handleSave('submitted')}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary-600 py-3 text-sm font-extrabold text-white shadow-[0_4px_12px_rgba(59,130,246,0.2)] transition-all hover:bg-primary-700 active:scale-[0.97]"
            >
              <Send size={16} /> Gui dang ky
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setStatus('draft'); showToast('Da mo lai de chinh sua') }}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-warning-200 bg-warning-50 py-3 text-sm font-bold text-warning-700 transition-colors hover:bg-warning-100"
          >
            Chinh sua lai nguyen vong
          </button>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-1.5 rounded-2xl border border-gray-700 bg-dark-700 px-6 py-3 text-xs font-bold text-white shadow-2xl animate-fade-in">
          <CheckCircle size={16} className="text-emerald-400" />
          {toast}
        </div>
      )}
    </AppShell>
  )
}

export default function ShiftPreferencesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-vanilla-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
          <p className="text-sm font-medium text-gray-500">Dang tai cau hinh dang ky ca...</p>
        </div>
      </div>
    }>
      <ShiftPreferencesPageContent />
    </Suspense>
  )
}
