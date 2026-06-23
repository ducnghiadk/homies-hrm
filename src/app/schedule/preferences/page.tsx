'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CheckCircle, ChevronLeft, Clock, Lock, Save, Send } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useAuthStore } from '@/store/auth-store'
import {
  getRegistrationWeekByWeek,
  type RegistrationWeek,
} from '@/lib/mock-data-registration-weeks'
import {
  getEmployeeShiftRegistrationsForWeek,
  saveShiftRegistrations,
} from '@/lib/mock-data-shift-registrations'
import { ShiftTemplateService, type ShiftTemplate } from '@/lib/services/shift-template-service'

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

type DayRegistration = {
  date: string
  selectedShiftId: string | null
}

function buildInitialDays(weekDates: string[]): DayRegistration[] {
  return weekDates.map((date) => ({ date, selectedShiftId: null }))
}

function ShiftPreferencesPageContent() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [toast, setToast] = useState<string | null>(null)
  const [regWeek, setRegWeek] = useState<RegistrationWeek | null>(null)
  const [timeLeft, setTimeLeft] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [note, setNote] = useState('')
  const [status, setStatus] = useState<'none' | 'draft' | 'submitted'>('none')
  const [days, setDays] = useState<DayRegistration[]>([])

  const requestedWeekStart = searchParams.get('weekStart')
  const weekDates = useMemo(() => getWeekDates(requestedWeekStart), [requestedWeekStart])
  const weekStart = weekDates[0]
  const shiftTemplates = useMemo(
    () => (user ? ShiftTemplateService.getActiveForStore(user.store_id) : []),
    [user],
  )

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    }
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!user) return

    const weekData = getRegistrationWeekByWeek(user.store_id, weekStart)
    setRegWeek(weekData ?? null)

    if (!weekData) {
      setIsLocked(true)
      return
    }

    const now = new Date()
    const deadline = new Date(weekData.registration_deadline)
    setIsLocked(weekData.status !== 'open' || now > deadline)
  }, [user, weekStart])

  useEffect(() => {
    if (!regWeek || regWeek.status !== 'open') return

    const calculateTimeLeft = () => {
      const diff = new Date(regWeek.registration_deadline).getTime() - Date.now()
      if (diff <= 0) {
        setTimeLeft('Da het han dang ky')
        setIsLocked(true)
        return true
      }

      const daysCount = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hoursCount = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutesCount = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const secondsCount = Math.floor((diff % (1000 * 60)) / 1000)

      let nextValue = ''
      if (daysCount > 0) nextValue += `${daysCount} ngay `
      nextValue += `${hoursCount}g ${minutesCount}p ${secondsCount}s`
      setTimeLeft(nextValue)
      return false
    }

    if (calculateTimeLeft()) return
    const timer = setInterval(calculateTimeLeft, 1000)
    return () => clearInterval(timer)
  }, [regWeek])

  useEffect(() => {
    if (!user) return

    const existing = getEmployeeShiftRegistrationsForWeek(user.id, weekStart)
    const rowsByDate = new Map(existing.map((row) => [row.date, row]))

    setDays(
      weekDates.map((date) => ({
        date,
        selectedShiftId: rowsByDate.get(date)?.shift_id ?? null,
      }))
    )
    setNote(existing[0]?.note ?? '')
    setStatus(existing[0]?.status ?? 'none')
  }, [user, weekDates, weekStart])

  if (!user) return null

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(null), 3000)
  }

  const updateSelectedShift = (dayIndex: number, shiftId: string | null) => {
    if (isLocked || status === 'submitted') return
    setDays((prev) => prev.map((day, index) => (
      index === dayIndex ? { ...day, selectedShiftId: shiftId } : day
    )))
  }

  const handleSave = (submitStatus: 'draft' | 'submitted') => {
    if (isLocked) {
      showToast('Dot dang ky da khoa, khong the gui!')
      return
    }

    try {
      saveShiftRegistrations(
        user.id,
        user.store_id,
        weekStart,
        days
          .filter((day) => day.selectedShiftId)
          .map((day) => ({ date: day.date, shift_id: day.selectedShiftId! })),
        submitStatus,
        note,
      )
      setStatus(submitStatus)
      showToast(submitStatus === 'submitted' ? 'Da gui dang ky ca mong muon!' : 'Da luu nhap dang ky ca')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Khong the luu dang ky ca')
    }
  }

  const weekRange = `${format(new Date(weekDates[0]), 'dd/MM')} - ${format(new Date(weekDates[6]), 'dd/MM/yyyy')}`

  return (
    <AppShell showNav>
      <div className="space-y-5 animate-fade-in pb-24">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 transition-colors hover:bg-gray-200">
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-dark-700">Dang ky ca mong muon</h1>
            <p className="mt-0.5 text-xs text-gray-400">Tuan lam viec: {weekRange}</p>
          </div>
        </div>

        {!regWeek ? (
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs font-semibold text-gray-600">
            <Lock size={16} className="text-gray-400" />
            <span>Admin chua mo cong dang ky ca cho tuan nay.</span>
          </div>
        ) : regWeek.status === 'closed' ? (
          <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-4 text-xs font-semibold text-gray-500">
            <Lock size={16} />
            <span>Dot dang ky ca cho tuan nay dang o trang thai nhap.</span>
          </div>
        ) : regWeek.status === 'reviewing' || regWeek.status === 'published' ? (
          <div className="flex items-center gap-2 rounded-2xl border border-primary-200 bg-primary-50 p-4 text-xs font-bold text-primary-700">
            <Lock size={16} className="text-primary-500" />
            <span>Quan ly dang duyet hoac da publish lich. Cong dang ky da dong.</span>
          </div>
        ) : isLocked ? (
          <div className="flex items-center gap-2 rounded-2xl border border-error-200 bg-error-50 p-4 text-xs font-bold text-error-700">
            <Lock size={16} className="text-error-500" />
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

        {status !== 'none' ? (
          <div className={`rounded-xl px-4 py-2.5 text-center text-xs font-bold ${
            status === 'submitted'
              ? 'border border-success-200 bg-success-50 text-success-600'
              : 'border border-warning-200 bg-warning-50 text-warning-600'
          }`}>
            {status === 'submitted' ? 'Da gui dang ky - Dang cho quan ly duyet lich' : 'Dang luu nhap dang ky ca'}
          </div>
        ) : null}

        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-gray-800">Moi ngay chon toi da 1 ca mong muon</p>
              <p className="mt-1 text-xs text-gray-400">
                Quan ly se duyet va co the dieu chinh truoc khi publish lich chinh thuc. Dang ky nay la de xuat mem, khong phai lich cuoi cung.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {shiftTemplates.map((template) => (
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
            const dateValue = new Date(`${day.date}T00:00:00`)
            const selectedTemplate = shiftTemplates.find((template) => template.id === day.selectedShiftId)

            return (
              <div key={day.date} className={`rounded-2xl border p-4 transition-all ${day.selectedShiftId ? 'border-primary-200 bg-primary-50/20' : 'border-gray-100 bg-white'} ${isLocked ? 'opacity-85' : ''}`}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold capitalize text-dark-700">{format(dateValue, 'EEEE', { locale: vi })}</p>
                    <p className="text-xs font-medium text-gray-400">{format(dateValue, 'dd/MM/yyyy')}</p>
                  </div>
                  <span className={`inline-flex rounded-lg border px-2 py-0.5 text-[10px] font-extrabold ${selectedTemplate ? 'border-primary-200 bg-primary-100 text-primary-700' : 'border-gray-200 bg-gray-50 text-gray-400'}`}>
                    {selectedTemplate ? `Da chon: ${selectedTemplate.name}` : 'Chua chon ca'}
                  </span>
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {shiftTemplates.map((template: ShiftTemplate) => {
                    const isSelected = day.selectedShiftId === template.id
                    return (
                      <button
                        key={template.id}
                        onClick={() => updateSelectedShift(idx, isSelected ? null : template.id)}
                        disabled={isLocked || status === 'submitted'}
                        className={`rounded-xl border p-3 text-left transition-all ${(isLocked || status === 'submitted') ? 'cursor-not-allowed' : ''} ${isSelected ? 'border-primary-300 bg-primary-50 shadow-sm' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 h-9 w-2 rounded-full" style={{ backgroundColor: template.color }} />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold text-gray-800" style={{ color: template.color }}>{template.name}</p>
                            <p className="text-[11px] font-semibold text-gray-500">{template.start_time} - {template.end_time}</p>
                            <p className="mt-1 text-[10px] text-gray-400">{ShiftTemplateService.getPositionLabels(template).join(', ') || 'Khong khoa vi tri'}</p>
                          </div>
                        </div>
                        {isSelected ? (
                          <span className="mt-3 inline-flex rounded-full bg-primary-600 px-2 py-0.5 text-[10px] font-bold text-white">Da chon</span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() => updateSelectedShift(idx, null)}
                  disabled={isLocked || status === 'submitted' || !day.selectedShiftId}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl p-2.5 text-xs font-bold transition-all ${day.selectedShiftId ? 'border border-gray-200 bg-gray-50 text-gray-600 hover:bg-gray-100' : 'bg-gray-50 text-gray-300'} ${(isLocked || status === 'submitted') ? 'cursor-not-allowed' : ''}`}
                >
                  Bo chon ca ngay nay
                </button>
              </div>
            )
          })}
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-4">
          <p className="mb-2 text-xs font-bold text-gray-550">Ghi chu gui quan ly</p>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={isLocked || status === 'submitted'}
            placeholder="Vi du: Em uu tien ca mo cua, hoac can tranh toi thu 4..."
            rows={3}
            className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-semibold placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
        </div>

        {isLocked ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-gray-100 p-4 text-xs font-bold text-gray-400">
            <Lock size={16} />
            <span>Form dang ky da khoa.</span>
          </div>
        ) : status !== 'submitted' ? (
          <div className="flex gap-2">
            <button
              onClick={() => handleSave('draft')}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 py-3 text-sm font-bold text-gray-600 transition-all hover:bg-gray-200 active:scale-[0.97]"
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
            Chinh sua lai dang ky
          </button>
        )}
      </div>

      {toast ? (
        <div className="fixed bottom-24 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-1.5 rounded-2xl border border-gray-700 bg-dark-700 px-6 py-3 text-xs font-bold text-white shadow-2xl animate-fade-in">
          <CheckCircle size={16} className="text-emerald-400" />
          {toast}
        </div>
      ) : null}
    </AppShell>
  )
}

export default function ShiftPreferencesPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-primary" />
          <p className="text-sm font-medium text-gray-500">Dang tai cau hinh dang ky ca...</p>
        </div>
      </div>
    }>
      <ShiftPreferencesPageContent />
    </Suspense>
  )
}
