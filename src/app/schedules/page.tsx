'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { ScheduleService, type AssignmentRecommendation, type ShiftDemand, type ShiftRegistrationPreference } from '@/lib/services/schedule-service'
import { ShiftTemplateService } from '@/lib/services/shift-template-service'
import { getPositionById, getStoreById, mockStores } from '@/lib/mock-data'
import { useAuthStore } from '@/store/auth-store'
import { ChevronLeft, ChevronRight, Copy, History, RefreshCcw, Save, Send, Settings2, TriangleAlert, Users } from 'lucide-react'
import { buildRecommendationSections, buildScheduleRows, buildWeekOverviewCards, filterRecommendationsBySearch } from '@/app/schedules/view-model'
import { DAY_LABELS, getWeekDates, getWeekStart, parseDateKey, plusDays, resolveSchedulesQuery } from '@/app/schedules/schedules-query'
import { WeeklyRhythmRail } from '@/app/schedules/_components/WeeklyRhythmRail'
import { WeeklyBoardGrid } from '@/app/schedules/_components/WeeklyBoardGrid'
import { AssignmentModal } from '@/app/schedules/_components/AssignmentModal'

type PreferenceFormState = Record<string, ShiftRegistrationPreference>
type DemandFormState = Record<string, number>
type CoverageTone = 'empty' | 'critical' | 'warning' | 'full'
type PendingPublishedChange = {
  action: 'assign' | 'remove'
  employeeId: string
  employeeName: string
  date: string
}

function formatShortDate(value: string) {
  const date = parseDateKey(value)
  return `${DAY_LABELS[(date.getDay() + 6) % 7]} ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatCalendarDate(value: string) {
  const date = parseDateKey(value)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

function getDayLabel(value: string) {
  const date = parseDateKey(value)
  return DAY_LABELS[(date.getDay() + 6) % 7]
}

function isWeekendDate(value: string) {
  const day = parseDateKey(value).getDay()
  return day === 0 || day === 6
}

function getCoverageTone(requiredCount: number, filledCount: number): CoverageTone {
  if (requiredCount <= 0) return 'empty'
  const shortage = Math.max(requiredCount - filledCount, 0)
  if (shortage === 0) return 'full'
  if (filledCount === 0 || shortage >= 2) return 'critical'
  return 'warning'
}

function getCoverageSummaryLabel(requiredCount: number, filledCount: number) {
  if (requiredCount <= 0) return 'Chưa setup'
  const shortage = Math.max(requiredCount - filledCount, 0)
  return shortage === 0 ? 'Đủ người' : `Thiếu ${shortage}`
}

function getCoverageCellClass(tone: CoverageTone, selected: boolean) {
  const toneClass = tone === 'full'
    ? 'border-t-4 border-t-emerald-200 bg-emerald-50/25'
    : tone === 'warning'
      ? 'border-t-4 border-t-amber-200 bg-amber-50/25'
      : tone === 'critical'
        ? 'border-t-4 border-t-rose-200 bg-rose-50/30'
        : 'border-t-4 border-t-gray-100 bg-white'

  return `min-h-[138px] border-b border-r px-3 py-3 text-left align-top transition-colors last:border-r-0 ${toneClass} ${
    selected ? 'ring-2 ring-inset ring-primary-300' : 'hover:bg-gray-50'
  }`
}

function getCoveragePillClass(tone: CoverageTone) {
  if (tone === 'full') return 'bg-emerald-100 text-emerald-700'
  if (tone === 'warning') return 'bg-amber-100 text-amber-700'
  if (tone === 'critical') return 'bg-rose-100 text-rose-700'
  return 'bg-gray-100 text-gray-600'
}

function getCoverageDotClass(tone: CoverageTone) {
  if (tone === 'full') return 'bg-emerald-500'
  if (tone === 'warning') return 'bg-amber-500'
  if (tone === 'critical') return 'bg-rose-500'
  return 'bg-gray-300'
}

function getSlotBadgeClass(tone: CoverageTone, selected: boolean) {
  if (selected) return 'border-primary-200 bg-primary-50 text-primary-700 shadow-sm'
  if (tone === 'full') return 'border-emerald-100 bg-white text-emerald-800 hover:border-emerald-200'
  if (tone === 'warning') return 'border-amber-100 bg-white text-amber-800 hover:border-amber-200'
  if (tone === 'critical') return 'border-rose-100 bg-white text-rose-800 hover:border-rose-200'
  return 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
}

function getPreferenceLabel(preference: ShiftRegistrationPreference) {
  if (preference === 'preferred') return 'Ưu tiên'
  if (preference === 'available') return 'Có thể làm'
  return 'Không thể làm'
}

function getRecommendationCardClass(recommendation: AssignmentRecommendation) {
  if (recommendation.is_assigned) return 'border-emerald-200 bg-emerald-50/70'
  if (recommendation.has_same_day_assignment) return 'border-amber-200 bg-amber-50/60'
  if (recommendation.preference === 'preferred') return 'border-primary-200 bg-primary-50/70'
  if (recommendation.preference === 'available') return 'border-blue-200 bg-blue-50/70'
  return 'border-gray-200 bg-gray-50'
}

function getRecommendationBadgeClass(recommendation: AssignmentRecommendation) {
  if (recommendation.is_assigned) return 'bg-emerald-100 text-emerald-700'
  if (recommendation.has_same_day_assignment) return 'bg-amber-100 text-amber-700'
  if (recommendation.preference === 'preferred') return 'bg-primary-100 text-primary-700'
  if (recommendation.preference === 'available') return 'bg-blue-100 text-blue-700'
  if (recommendation.preference === 'unavailable') return 'bg-rose-100 text-rose-700'
  return 'bg-gray-100 text-gray-600'
}

function EmployeeScheduleRegistration({ query }: { query: ReturnType<typeof resolveSchedulesQuery> }) {
  const { user } = useAuthStore()
  const weekStart = useMemo(() => query.weekStart || plusDays(getWeekStart(), 7), [query.weekStart])
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
            <thead className="bg-gray-50">
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
                          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-2 py-2 text-xs font-semibold text-gray-700 outline-none"
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
              className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50"
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

function ManagerSchedulingBoard({ query }: { query: ReturnType<typeof resolveSchedulesQuery> }) {
  const { user } = useAuthStore()
  const router = useRouter()
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [showDemandEditor, setShowDemandEditor] = useState(false)
  const [pendingPublishedChange, setPendingPublishedChange] = useState<PendingPublishedChange | null>(null)
  const [publishedChangeReason, setPublishedChangeReason] = useState('')
  const [recommendationSearch, setRecommendationSearch] = useState('')

  const stores = useMemo(() => {
    if (!user) return []
    if (['ceo', 'hr_admin'].includes(user.role)) return mockStores.filter(store => store.is_active)
    return mockStores.filter(store => store.id === user.store_id)
  }, [user])

  const anchorWeekStart = useMemo(() => query.weekStart || plusDays(getWeekStart(), 7), [query.weekStart])
  const activeWeekStart = useMemo(() => plusDays(anchorWeekStart, weekOffset * 7), [anchorWeekStart, weekOffset])
  const weekDates = useMemo(() => getWeekDates(activeWeekStart), [activeWeekStart])
  const activeStoreId = selectedStoreId || query.storeId || stores[0]?.id || user?.store_id || ''

  const board = useMemo(() => {
    void refreshKey
    return user && activeStoreId ? ScheduleService.getAssignmentBoardData(user, activeStoreId, activeWeekStart) : null
  }, [activeStoreId, activeWeekStart, refreshKey, user])
  const weekStateMeta = board ? ScheduleService.getWeekStateMeta(board.week) : null

  const templates = useMemo(() => (activeStoreId ? ShiftTemplateService.getActiveForStore(activeStoreId) : []), [activeStoreId])
  const positions = useMemo(() => {
    const ids = Array.from(new Set(templates.flatMap(template => template.allowed_position_ids || [])))
    return ids.map(id => getPositionById(id)).filter(Boolean)
  }, [templates])

  const boardDemands = useMemo(() => board?.demands || [], [board])

  const demandForm = useMemo(() => {
    const nextState: DemandFormState = {}
    weekDates.forEach(date => {
      templates.forEach(template => {
        const allowedPositionIds = template.allowed_position_ids?.length ? template.allowed_position_ids : positions.map(position => position!.id)
        allowedPositionIds.forEach(positionId => {
          const slot = boardDemands.find(item =>
            item.date === date &&
            item.shift_template_id === template.id &&
            item.position_id === positionId
          )
          nextState[`${date}__${template.id}__${positionId}`] = slot?.required_count ?? template.min_headcount ?? 1
        })
      })
    })
    return nextState
  }, [boardDemands, positions, templates, weekDates])

  const [draftDemand, setDraftDemand] = useState<DemandFormState>({})

  useEffect(() => {
    setDraftDemand(demandForm)
  }, [demandForm])

  useEffect(() => {
    setSelectedSlot(null)
    setRecommendationSearch('')
  }, [activeStoreId, activeWeekStart])

  useEffect(() => {
    setRecommendationSearch('')
  }, [selectedSlot])

  useEffect(() => {
    if (!selectedSlot || !board) return
    if (!board.demands.some(slot => slot.id === selectedSlot)) {
      setSelectedSlot(null)
    }
  }, [board, selectedSlot])

  if (!user || !board) return null

  const validate = ScheduleService.validateWeekForPublish(user, activeStoreId, activeWeekStart)
  const selectedSlotData = selectedSlot ? (board.demands.find(slot => slot.id === selectedSlot) || null) : null
  const slotRecommendations = selectedSlotData ? ScheduleService.getSlotRecommendations(board, selectedSlotData) : []
  const filteredRecommendations = filterRecommendationsBySearch(slotRecommendations, recommendationSearch)
  const recommendationSections = buildRecommendationSections(filteredRecommendations)
  const overviewCards = buildWeekOverviewCards(board, weekDates)
  const scheduleRows = buildScheduleRows({
    board,
    weekDates,
    templates: templates.map(template => ({
      id: template.id,
      name: template.name,
      start_time: template.start_time,
      end_time: template.end_time,
    })),
  })
  const selectedStore = getStoreById(activeStoreId)
  const selectedSlotKey = selectedSlotData ? `${selectedSlotData.date}__${selectedSlotData.shift_template_id}` : null
  const selectedSlotTitle = selectedSlotData ? `${ShiftTemplateService.getById(selectedSlotData.shift_template_id)?.name || selectedSlotData.shift_template_id} ${getPositionById(selectedSlotData.position_id)?.name || selectedSlotData.position_id}` : ''
  const selectedSlotSubtitle = selectedSlotData ? `${formatShortDate(selectedSlotData.date)} ? ${ShiftTemplateService.getById(selectedSlotData.shift_template_id)?.start_time || ''} - ${ShiftTemplateService.getById(selectedSlotData.shift_template_id)?.end_time || ''} ? Da xep ${selectedSlotData.filled_count}/${selectedSlotData.required_count}` : ''
  const selectedSlotFilledLabel = selectedSlotData ? `${selectedSlotData.filled_count}/${selectedSlotData.required_count} nguoi` : undefined
  const selectedSlotRegisteredLabel = selectedSlotData ? `${selectedSlotData.preferred_employee_ids.length + selectedSlotData.available_employee_ids.length} nguoi` : undefined
  const selectedSlotPositionLabel = selectedSlotData ? (getPositionById(selectedSlotData.position_id)?.name || selectedSlotData.position_id) : undefined
  const totalDemand = board.demands.reduce((sum, slot) => sum + slot.required_count, 0)
  const totalAssigned = board.demands.reduce((sum, slot) => sum + slot.filled_count, 0)
  const scheduledEmployees = new Set(board.assignments.map(item => item.employee_id)).size
  const emptySlots = board.demands.filter(slot => slot.filled_count === 0).length
  const incompleteSlots = board.demands.filter(slot => slot.filled_count < slot.required_count).length
  const totalWarnings = validate.hardWarnings.length + validate.softWarnings.length
  const selectedSlotShortage = selectedSlotData ? Math.max(selectedSlotData.required_count - selectedSlotData.filled_count, 0) : 0
  const weekLabel = `${formatShortDate(weekDates[0])} - ${formatShortDate(weekDates[6])}`
  const requiresPublishedReason = board.week.status === 'published' || board.week.cycle_status === 'published'

  const saveDemandState = (nextForm: DemandFormState, messageText: string) => {
    const nextDemands: ShiftDemand[] = Object.entries(nextForm).map(([key, requiredCount]) => {
      const [date, shiftTemplateId, positionId] = key.split('__')
      const template = templates.find(item => item.id === shiftTemplateId)
      const existing = boardDemands.find(item =>
        item.date === date &&
        item.shift_template_id === shiftTemplateId &&
        item.position_id === positionId
      )
      return {
        id: existing?.id || `draft-${date}-${shiftTemplateId}-${positionId}`,
        registration_week_id: existing?.registration_week_id || board.week.registration_week_id || '',
        store_id: activeStoreId,
        week_start: activeWeekStart,
        date,
        shift_template_id: shiftTemplateId,
        position_id: positionId,
        required_count: requiredCount,
        min_count: Math.min(requiredCount, template?.min_headcount || 1),
        notes: existing?.notes,
      }
    })

    ScheduleService.saveShiftDemand(user, activeStoreId, activeWeekStart, nextDemands)
    setRefreshKey(value => value + 1)
    setMessage(messageText)
  }

  const handleAssign = (employeeId: string, changeReason?: string) => {
    if (!selectedSlotData) return
    const result = ScheduleService.assignEmployeeToSlot({
      currentUser: user,
      storeId: activeStoreId,
      weekStart: activeWeekStart,
      employeeId,
      date: selectedSlotData.date,
      shiftTemplateId: selectedSlotData.shift_template_id,
      changeReason,
    })
    if (!result.schedule) {
      setMessage('Không thể xếp ca. Hãy kiểm tra điều kiện nhân sự, trùng lịch hoặc vị trí không phù hợp.')
      return
    }
    setRefreshKey(prev => prev + 1)
    if (result.warnings.length > 0) {
      const warningSummary = result.warnings.map(warning => warning.message).slice(0, 2).join(' · ')
      setMessage(`Đã xếp ca, nhưng cần xem lại: ${warningSummary}`)
      return
    }
    setMessage('Đã xếp ca thành công.')
  }

  const handleRemove = (employeeId: string, date: string, changeReason?: string) => {
    const success = ScheduleService.removeAssignment(user, activeStoreId, employeeId, date, changeReason)
    if (!success) {
      setMessage('Không thể gỡ phân công này.')
      return
    }
    setRefreshKey(prev => prev + 1)
    setMessage('Đã gỡ phân công.')
  }

  const openPublishedChangeModal = (change: PendingPublishedChange) => {
    setPendingPublishedChange(change)
    setPublishedChangeReason('')
  }

  const submitPublishedChange = () => {
    if (!pendingPublishedChange || !publishedChangeReason.trim()) {
      setMessage('Cần nhập lý do thay đổi khi sửa lịch sau khi đã chốt.')
      return
    }

    if (pendingPublishedChange.action === 'assign') {
      handleAssign(pendingPublishedChange.employeeId, publishedChangeReason.trim())
    } else {
      handleRemove(pendingPublishedChange.employeeId, pendingPublishedChange.date, publishedChangeReason.trim())
    }

    setPendingPublishedChange(null)
    setPublishedChangeReason('')
  }

  const handleModalAssign = (employeeId: string) => {
    if (requiresPublishedReason && selectedSlotData) {
      const recommendation = slotRecommendations.find(item => item.employee_id === employeeId)
      openPublishedChangeModal({
        action: 'assign',
        employeeId,
        employeeName: recommendation?.employee_name || employeeId,
        date: selectedSlotData.date,
      })
      return
    }

    handleAssign(employeeId)
  }

  const handleModalRemove = (employeeId: string) => {
    if (requiresPublishedReason && selectedSlotData) {
      const recommendation = slotRecommendations.find(item => item.employee_id === employeeId)
      openPublishedChangeModal({
        action: 'remove',
        employeeId,
        employeeName: recommendation?.employee_name || employeeId,
        date: selectedSlotData.date,
      })
      return
    }

    if (selectedSlotData) {
      handleRemove(employeeId, selectedSlotData.date)
    }
  }
  const handleSaveDraftWeek = () => {
    const success = ScheduleService.saveDraftWeek(user, activeStoreId, weekDates)
    setMessage(success ? 'Đã lưu bản nháp tuần xếp lịch.' : 'Không thể lưu bản nháp tuần này.')
  }

  const handlePublish = () => {
    if (validate.hardWarnings.length > 0) {
      setMessage(`Không thể chốt lịch. Còn ${validate.hardWarnings.length} lỗi chặn.`)
      return
    }

    const allowSoft = validate.softWarnings.length > 0
      ? window.confirm(`Còn ${validate.softWarnings.length} cảnh báo cần xem lại. Vẫn chốt lịch?`)
      : true
    if (!allowSoft) return

    const success = ScheduleService.publishWeek(user, activeStoreId, weekDates, {
      allowSoftWarnings: true,
    })
    if (!success) {
      setMessage('Chốt lịch thất bại. Vui lòng kiểm tra lại dữ liệu.')
      return
    }
    setRefreshKey(prev => prev + 1)
    setMessage('Đã chốt lịch và gửi thông báo tới nhân sự.')
  }

  const applyTemplateDemand = (mode: 'weekday' | 'weekend') => {
    const nextForm = { ...draftDemand }
    weekDates.forEach(date => {
      const isWeekend = isWeekendDate(date)
      if ((mode === 'weekday' && isWeekend) || (mode === 'weekend' && !isWeekend)) return

      templates.forEach(template => {
        const base = mode === 'weekday'
          ? Math.max(template.min_headcount || 1, 1)
          : Math.max(template.min_headcount || 1, Math.min((template.max_headcount || 2), (template.min_headcount || 1) + 1))
        ;(template.allowed_position_ids || []).forEach(positionId => {
          nextForm[`${date}__${template.id}__${positionId}`] = base
        })
      })
    })
    setDraftDemand(nextForm)
    setMessage(mode === 'weekday' ? 'Đã áp dụng mẫu ngày thường.' : 'Đã áp dụng mẫu cuối tuần.')
  }

  const copyFromPreviousWeek = () => {
    const previousWeekDates = getWeekDates(plusDays(activeWeekStart, -7))
    const previousBoard = ScheduleService.getAssignmentBoardData(user, activeStoreId, previousWeekDates[0])
    const nextForm = { ...draftDemand }

    previousBoard.demands.forEach(slot => {
      const targetDate = plusDays(slot.date, 7)
      const key = `${targetDate}__${slot.shift_template_id}__${slot.position_id}`
      if (key in nextForm) nextForm[key] = slot.required_count
    })

    setDraftDemand(nextForm)
    setMessage('Đã copy nhu cầu từ tuần trước.')
  }

  const resetDemand = () => {
    const nextForm: DemandFormState = {}
    weekDates.forEach(date => {
      templates.forEach(template => {
        ;(template.allowed_position_ids || []).forEach(positionId => {
          nextForm[`${date}__${template.id}__${positionId}`] = template.min_headcount || 1
        })
      })
    })
    setDraftDemand(nextForm)
    setMessage('Đã reset nhu cầu về mặc định.')
  }

  return (
    <AppShell showNav>
      <div className="animate-fade-in space-y-5 pb-20">
        <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-gray-800">Bảng xếp lịch tuần</h1>
              <p className="mt-1 text-xs text-gray-400">Flow chuẩn: cấu hình ca, thiết lập nhu cầu tuần, rồi quay lại board để gán người.</p>
            </div>

            <div className="flex flex-col gap-3 xl:items-end">
              <div className="flex flex-wrap items-center gap-2">
                {(user.role === 'ceo' || user.role === 'hr_admin') && (
                  <select
                    value={activeStoreId}
                    onChange={event => setSelectedStoreId(event.target.value)}
                    className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    {stores.map(store => (
                      <option key={store.id} value={store.id}>{store.name}</option>
                    ))}
                  </select>
                )}

                <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-gray-50 px-2 py-1">
                  <button onClick={() => setWeekOffset(value => value - 1)} className="rounded-lg p-2 text-gray-500 hover:bg-white">
                    <ChevronLeft size={16} />
                  </button>
                  <div className="min-w-[132px] text-center text-sm font-bold text-gray-700">{weekLabel}</div>
                  <button onClick={() => setWeekOffset(value => value + 1)} className="rounded-lg p-2 text-gray-500 hover:bg-white">
                    <ChevronRight size={16} />
                  </button>
                </div>

                <button
                  onClick={() => setShowDemandEditor(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm font-bold text-primary-700 hover:bg-primary-100"
                >
                  <Settings2 size={14} /> Thiết lập nhu cầu tuần
                </button>
                <button
                  onClick={() => router.push(`/schedule/history?storeId=${activeStoreId}&weekStart=${activeWeekStart}`)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100"
                >
                  <History size={14} /> Lịch sử đổi lịch
                </button>
                <button
                  onClick={handleSaveDraftWeek}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                >
                  <Save size={14} /> Lưu bản nháp
                </button>
                <button
                  onClick={handlePublish}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-700"
                >
                  <Send size={14} /> Chốt lịch
                </button>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-semibold text-gray-600">{selectedStore?.name || activeStoreId}</span>
                {weekStateMeta && (
                  <span className={`rounded-full px-2.5 py-1 font-semibold ${weekStateMeta.tone}`}>
                    {weekStateMeta.label}
                  </span>
                )}
                {board?.week.published_at && (
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 font-semibold text-sky-700">
                    Đã chốt {board.week.published_at.slice(0, 16).replace('T', ' ')}
                  </span>
                )}
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">Nhân sự đã xếp {scheduledEmployees}</span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">Nhu cầu {totalDemand}</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">Đã gán {totalAssigned}</span>
                <span className="rounded-full bg-orange-50 px-2.5 py-1 font-semibold text-orange-700">Ô trống {emptySlots}</span>
                <span className="rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700">Cảnh báo chặn {validate.hardWarnings.length}</span>
                <span className="rounded-full bg-yellow-50 px-2.5 py-1 font-semibold text-yellow-700">Cần xem lại {validate.softWarnings.length}</span>
              </div>
              {weekStateMeta && (
                <p className="text-xs text-gray-500">{weekStateMeta.description}</p>
              )}
            </div>
          </div>
        </div>

        {message && (
          <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">
            {message}
          </div>
        )}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Nhân sự trong tuần</div>
            <div className="mt-2 text-2xl font-bold text-gray-800">{scheduledEmployees}</div>
            <p className="mt-1 text-xs text-gray-500">Số người đang có ít nhất 1 ca trong tuần này.</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Ô trống chưa xếp</div>
            <div className="mt-2 text-2xl font-bold text-gray-800">{emptySlots}</div>
            <p className="mt-1 text-xs text-gray-500">Slot chưa có ai nhận, cần ưu tiên xử lý trước khi chốt lịch.</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Slot còn thiếu người</div>
            <div className="mt-2 text-2xl font-bold text-gray-800">{incompleteSlots}</div>
            <p className="mt-1 text-xs text-gray-500">Đã có người nhưng chưa đủ nhu cầu của slot.</p>
          </div>
          <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Tổng cảnh báo</div>
            <div className="mt-2 text-2xl font-bold text-gray-800">{totalWarnings}</div>
            <p className="mt-1 text-xs text-gray-500">Gồm lỗi chặn chốt lịch và cảnh báo cần quản lý rà soát.</p>
          </div>
        </div>

        <div className="space-y-4">
        <WeeklyRhythmRail
          days={overviewCards}
          selectedDate={selectedSlotData?.date || null}
          onSelectDate={date => {
            const firstSlot = board.demands.find(slot => slot.date === date)
            setSelectedSlot(firstSlot?.id || null)
          }}
        />
          {selectedSlotData ? (
            <div className="mb-4 rounded-[22px] border border-[#e7d7c6] bg-[#fffaf4] px-4 py-3 text-sm text-[#6f6258]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-[#28445f]">Dang xem:</span>
                <span>{ShiftTemplateService.getById(selectedSlotData.shift_template_id)?.name || selectedSlotData.shift_template_id}</span>
                <span>?</span>
                <span>{formatShortDate(selectedSlotData.date)}</span>
                <span>?</span>
                <span>{selectedSlotPositionLabel}</span>
                <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${selectedSlotShortage > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                  {selectedSlotShortage > 0 ? `Thieu ${selectedSlotShortage}` : 'Da du nguoi'}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedSlot(null)}
                  className="ml-auto rounded-full border border-[#eadbc9] px-3 py-1 text-xs font-semibold text-slate-600 transition hover:bg-white"
                >
                  Dong xem nhanh
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-4 rounded-[22px] border border-dashed border-[#e7d7c6] bg-[#fffaf4] px-4 py-3 text-sm text-[#7c6e63]">
              Chua chon o nao. Hay bam vao ca dang thieu hoac ca da co dang ky de mo popup xep nguoi.
            </div>
          )}

          <WeeklyBoardGrid
            dates={weekDates}
            daySummaries={overviewCards}
            rows={scheduleRows}
            selectedSlotKey={selectedSlotKey}
            onSelectCell={payload => setSelectedSlot(payload.slotId || null)}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[28px] border border-[#efe2d3] bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <TriangleAlert size={16} className="text-amber-600" />
                <div>
                  <h2 className="text-sm font-semibold text-[#28445f]">Cần chú ý trước khi chốt lịch</h2>
                  <p className="text-xs text-[#7c6e63]">Lỗi chặn phải sửa trước. Cảnh báo mềm giúp rà lại cân bằng ca và xung đột nhẹ.</p>
                </div>
              </div>
              <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full bg-rose-100 px-2.5 py-1 font-semibold text-rose-700">Chặn chốt lịch: {validate.hardWarnings.length}</span>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">Cần xem lại: {validate.softWarnings.length}</span>
              </div>
              <div className="space-y-2">
                {[...validate.hardWarnings, ...validate.softWarnings].slice(0, 6).map((warning, index) => {
                  const isHardWarning = index < validate.hardWarnings.length
                  return (
                    <div
                      key={`${warning.type}-${warning.date}-${index}`}
                      className={`rounded-[20px] border px-3 py-3 text-sm ${isHardWarning ? 'border-rose-200 bg-rose-50/80 text-rose-700' : 'border-amber-200 bg-amber-50/80 text-amber-700'}`}
                    >
                      <div className="mb-1 text-xs font-bold uppercase tracking-[0.16em]">{isHardWarning ? 'Cần sửa ngay' : 'Nên rà soát'}</div>
                      <div>{warning.message}</div>
                    </div>
                  )
                })}
                {validate.hardWarnings.length + validate.softWarnings.length === 0 && (
                  <div className="rounded-[20px] border border-emerald-200 bg-emerald-50/80 px-3 py-3 text-sm text-emerald-700">Tuần này chưa có cảnh báo đáng chú ý.</div>
                )}
              </div>
            </div>

            <div className="rounded-[28px] border border-[#efe2d3] bg-[linear-gradient(180deg,rgba(255,250,244,0.98),rgba(255,255,255,0.98))] p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <Users size={16} className="text-[#23425f]" />
                <div>
                  <h2 className="text-sm font-semibold text-[#28445f]">Tóm tắt vận hành tuần</h2>
                  <p className="text-xs text-[#7c6e63]">Gợi ý nhanh để biết nên xử lý tuần này theo hướng nào trước.</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-[#6f6258]">
                <div className="rounded-[20px] border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
                  <div className="font-semibold text-[#28445f]">{incompleteSlots > 0 ? 'Ưu tiên lấp các ô đang thiếu người' : 'Các ca đã được phủ khá tốt'}</div>
                  <div className="mt-1 text-xs leading-5">{incompleteSlots > 0 ? `Hiện còn ${incompleteSlots} ô thiếu người và ${emptySlots} ô chưa có ai. Hãy mở từng ô đỏ hoặc vàng để gán nhanh.` : 'Bạn có thể chuyển sang rà cảnh báo, kiểm tra thay đổi sau chốt và gửi lịch cho đội ngũ.'}</div>
                </div>
                <div className="rounded-[20px] border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
                  <div className="font-semibold text-[#28445f]">Đăng ký của nhân viên đang hỗ trợ tốt?</div>
                  <div className="mt-1 text-xs leading-5">{totalAssigned}/{totalDemand} lượt phân công đang lấp nhu cầu của tuần, với {scheduledEmployees} người đã có ca.</div>
                </div>
                <div className="rounded-[20px] border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
                  <div className="font-semibold text-[#28445f]">Sau khi chốt lịch</div>
                  <div className="mt-1 text-xs leading-5">{requiresPublishedReason ? 'Mọi thay đổi sau khi chốt sẽ yêu cầu nhập lý do để lưu lịch sử điều chỉnh.' : 'Khi chốt lịch xong, hệ thống sẽ gửi thông báo cho nhân sự.'}</div>
                </div>
              </div>
            </div>
          </div>
        <AssignmentModal
          open={Boolean(selectedSlotData)}
          slotTitle={selectedSlotTitle}
          slotSubtitle={selectedSlotSubtitle}
          shortageLabel={selectedSlotShortage > 0 ? `Con thieu ${selectedSlotShortage}` : 'Da du nguoi'}
          search={recommendationSearch}
          onSearchChange={setRecommendationSearch}
          sections={recommendationSections}
          requiresPublishedReason={requiresPublishedReason}
          onAssign={handleModalAssign}
          onRemove={handleModalRemove}
          onClose={() => setSelectedSlot(null)}
          positionLabel={selectedSlotPositionLabel}
          filledCountLabel={selectedSlotFilledLabel}
          registeredCountLabel={selectedSlotRegisteredLabel}
        />

        {showDemandEditor && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
            <div className="h-full w-full max-w-3xl overflow-y-auto bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Thiết lập nhu cầu tuần</h2>
                  <p className="mt-1 text-xs text-gray-400">{selectedStore?.name || activeStoreId} · Tuần {board.week.week_start} - {board.week.week_end}</p>
                </div>
                <button onClick={() => setShowDemandEditor(false)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
                  Đóng
                </button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={copyFromPreviousWeek} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
                  <Copy size={13} /> Copy từ tuần trước
                </button>
                <button onClick={() => applyTemplateDemand('weekday')} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
                  Áp dụng mẫu ngày thường
                </button>
                <button onClick={() => applyTemplateDemand('weekend')} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
                  Áp dụng mẫu cuối tuần
                </button>
                <button onClick={resetDemand} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">
                  <RefreshCcw size={13} /> Reset mặc định
                </button>
              </div>

              <div className="mt-5 grid gap-4">
                {weekDates.map(date => (
                  <div key={date} className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-3 text-sm font-bold text-gray-800">{formatShortDate(date)}</div>
                    <div className="space-y-3">
                      {templates.map(template => (
                        <div key={`${date}-${template.id}`} className="rounded-2xl border border-white bg-white p-3">
                          <div className="mb-3">
                            <div className="font-bold text-gray-800">{template.name}</div>
                            <div className="text-xs text-gray-400">{template.start_time} - {template.end_time}</div>
                          </div>
                          <div className="grid gap-2 md:grid-cols-3">
                            {(template.allowed_position_ids || []).map(positionId => {
                              const key = `${date}__${template.id}__${positionId}`
                              return (
                                <label key={key} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                  <div className="mb-1 text-xs text-gray-500">{getPositionById(positionId)?.name || positionId}</div>
                                  <input
                                    type="number"
                                    min={0}
                                    value={draftDemand[key] ?? 0}
                                    onChange={event => setDraftDemand(prev => ({ ...prev, [key]: Number(event.target.value) }))}
                                    className="w-full bg-transparent font-bold outline-none"
                                  />
                                </label>
                              )
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 mt-5 flex justify-end gap-2 border-t border-gray-100 bg-white pt-4">
                <button onClick={() => setShowDemandEditor(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
                  Hủy
                </button>
                <button
                  onClick={() => {
                    saveDemandState(draftDemand, 'Đã lưu nhu cầu tuần.')
                    setShowDemandEditor(false)
                  }}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                >
                  Lưu nhu cầu tuần
                </button>
              </div>
            </div>
          </div>
        )}

        {pendingPublishedChange && selectedSlotData && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 p-4 sm:items-center">
            <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
              <div>
                <h3 className="text-base font-bold text-gray-800">Nhập lý do thay đổi</h3>
                <p className="mt-1 text-xs text-gray-500">
                  {pendingPublishedChange.action === 'assign' ? 'Gán' : 'Gỡ'} ca
                  {' '}
                  {ShiftTemplateService.getById(selectedSlotData.shift_template_id)?.name || selectedSlotData.shift_template_id}
                  {' '}
                  cho {pendingPublishedChange.employeeName} ngày {formatCalendarDate(pendingPublishedChange.date)}.
                </p>
              </div>
              <textarea
                value={publishedChangeReason}
                onChange={event => setPublishedChangeReason(event.target.value)}
                rows={4}
                placeholder="Ví dụ: bổ sung giờ cao điểm, nhân viên xin đổi ca, điều chỉnh do vận hành..."
                className="mt-4 w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-gray-700 outline-none"
              />
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setPendingPublishedChange(null)
                    setPublishedChangeReason('')
                  }}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  onClick={submitPublishedChange}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90"
                >
                  Lưu thay đổi
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function SchedulesPageContent() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const query = useMemo(() => resolveSchedulesQuery(searchParams), [searchParams])

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  useEffect(() => {
    const currentSearch = searchParams.toString()
    if (currentSearch === query.canonicalSearch) return
    const nextUrl = query.canonicalSearch ? `/schedules?${query.canonicalSearch}` : '/schedules'
    router.replace(nextUrl)
  }, [query.canonicalSearch, router, searchParams])

  if (!user) return null

  if (user.role === 'employee') {
    return <EmployeeScheduleRegistration query={query} />
  }

  return <ManagerSchedulingBoard query={query} />
}

export default function SchedulesPage() {
  return (
    <Suspense fallback={null}>
      <SchedulesPageContent />
    </Suspense>
  )
}










