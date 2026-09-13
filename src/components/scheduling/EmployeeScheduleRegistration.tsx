'use client'

import { useMemo, useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { ScheduleService, type ShiftRegistrationPreference } from '@/lib/services/schedule-service'
import { ShiftTemplateService } from '@/lib/services/shift-template-service'
import { getStoreById } from '@/lib/mock-data'
import { useAuthStore } from '@/store/auth-store'

type PreferenceFormState = Record<string, ShiftRegistrationPreference>

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

function parseDateKey(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function plusDays(base: string, amount: number) {
  const date = parseDateKey(base)
  date.setDate(date.getDate() + amount)
  return formatDateKey(date)
}

function getWeekStart(date = new Date()) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0, 0)
  const day = monday.getDay()
  monday.setDate(monday.getDate() - (day === 0 ? 6 : day - 1))
  return formatDateKey(monday)
}

function getWeekDates(weekStart: string) {
  return Array.from({ length: 7 }, (_, index) => plusDays(weekStart, index))
}

function formatShortDate(value: string) {
  const date = parseDateKey(value)
  return `${DAY_LABELS[(date.getDay() + 6) % 7]} ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

interface Props {
  weekStartQuery?: string | null
}

export default function EmployeeScheduleRegistration({ weekStartQuery }: Props) {
  const { user } = useAuthStore()
  const weekStart = useMemo(() => weekStartQuery || plusDays(getWeekStart(), 7), [weekStartQuery])
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const [refreshKey, setRefreshKey] = useState(0)
  const [message, setMessage] = useState<string | null>(null)

  const week = useMemo(() => {
    void refreshKey
    return user ? ScheduleService.getOrCreateScheduleWeek(user.store_id, weekStart, user) : null
  }, [refreshKey, user, weekStart])

  const templates = useMemo(() => (user ? ShiftTemplateService.getActiveForStore(user.store_id) : []), [user])
  const existingRegistrations = useMemo(() => {
    void refreshKey
    return user ? ScheduleService.getRegistrationsForWeek(user.store_id, weekStart).filter(item => item.employee_id === user.id) : []
  }, [refreshKey, user, weekStart])

  const initialForm = useMemo(() => {
    const nextState: PreferenceFormState = {}
    weekDates.forEach(date => {
      templates.forEach(template => {
        const existing = existingRegistrations.find(item => item.date === date && item.shift_template_id === template.id)
        nextState[`${date}__${template.id}`] = existing?.preference || 'available'
      })
    })
    return nextState
  }, [existingRegistrations, templates, weekDates])

  const [form, setForm] = useState<PreferenceFormState>({})
  const currentForm = Object.keys(form).length > 0 ? form : initialForm

  if (!user || !week) return null

  const locked = week.cycle_status !== 'registration_open' || (week.registration_deadline ? new Date(week.registration_deadline) < new Date() : false)

  const handleSave = (submit: boolean) => {
    const entries = Object.entries(currentForm).map(([key, preference]) => {
      const [date, shift_template_id] = key.split('__')
      return { date, shift_template_id, preference }
    })

    const saved = ScheduleService.saveEmployeeRegistration({
      currentUser: user,
      employeeId: user.id,
      weekStart,
      entries,
      submit,
    })

    if (saved.length === 0) {
      setMessage('Không thể lưu đăng ký. Có thể đã qua hạn hoặc đợt đăng ký đã đóng.')
      return
    }

    setRefreshKey(prev => prev + 1)
    setMessage(submit ? 'Đã gửi đăng ký ca thành công.' : 'Đã lưu nháp đăng ký ca.')
  }

  return (
    <AppShell showNav>
      <div className="animate-fade-in space-y-5 pb-20">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-800">Đăng ký lịch làm tuần tới</h1>
          <p className="mt-1 text-xs text-gray-400">
            Chi nhánh {getStoreById(user.store_id)?.name || user.store_id} · Tuần {week.week_start} - {week.week_end}
          </p>
        </div>

        <div className={`rounded-2xl border px-4 py-3 text-sm ${locked ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {locked
            ? `Đợt đăng ký đã khóa${week.registration_deadline ? ` (hạn: ${week.registration_deadline.replace('T', ' ')})` : ''}.`
            : `Đợt đăng ký đang mở${week.registration_deadline ? ` đến ${week.registration_deadline.replace('T', ' ')}` : ''}.`}
        </div>

        {message && (
          <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
            {message}
          </div>
        )}

        <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-vanilla-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Ca</th>
                {weekDates.map(date => (
                  <th key={date} className="px-3 py-3 text-center text-xs font-bold uppercase text-gray-500">
                    {formatShortDate(date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map(template => (
                <tr key={template.id} className="border-t border-gray-100">
                  <td className="px-4 py-4">
                    <div className="font-bold text-gray-800">{template.name}</div>
                    <div className="text-xs text-gray-400">{template.start_time} - {template.end_time}</div>
                  </td>
                  {weekDates.map(date => {
                    const key = `${date}__${template.id}`
                    return (
                      <td key={key} className="px-2 py-3">
                        <select
                          value={currentForm[key] || 'available'}
                          disabled={locked}
                          onChange={event => setForm(prev => ({ ...prev, [key]: event.target.value as ShiftRegistrationPreference }))}
                          className="w-full rounded-xl border border-gray-200 bg-vanilla-50 px-2 py-2 text-xs font-semibold text-gray-700 outline-none"
                        >
                          <option value="preferred">Ưu tiên</option>
                          <option value="available">Có thể làm</option>
                          <option value="unavailable">Không thể làm</option>
                        </select>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!locked && (
          <div className="flex gap-3">
            <button
              onClick={() => handleSave(false)}
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-vanilla-50"
            >
              Lưu nháp
            </button>
            <button
              onClick={() => handleSave(true)}
              className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white hover:opacity-90"
            >
              Gửi đăng ký
            </button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
