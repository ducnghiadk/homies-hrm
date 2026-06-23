'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { ScheduleService, type ShiftDemand, type ShiftRegistrationPreference } from '@/lib/services/schedule-service'
import { ShiftTemplateService } from '@/lib/services/shift-template-service'
import { getPositionById, getStoreById, mockStores } from '@/lib/mock-data'
import { useAuthStore } from '@/store/auth-store'
import { buildRecommendationSections, buildScheduleRows, buildWeekOverviewCards, filterRecommendationsBySearch } from '@/app/schedules/view-model'
import { DAY_LABELS, getWeekDates, getWeekStart, parseDateKey, plusDays, resolveSchedulesQuery } from '@/app/schedules/schedules-query'
import { ScheduleToolbar } from '@/app/schedules/_components/ScheduleToolbar'
import { WeeklyBoardGrid } from '@/app/schedules/_components/WeeklyBoardGrid'
import { AssignmentModal } from '@/app/schedules/_components/AssignmentModal'
import { buildAssignmentFailureMessage, buildAssignmentHeadcountLimitLabel, buildAssignmentModalSubtitle, buildShiftDemandCapacityWarning } from '@/app/schedules/assignment-modal-copy'
import { buildHeaderMetrics } from '@/app/schedules/dashboard-summary'

type PreferenceFormState = Record<string, ShiftRegistrationPreference>
type DemandFormState = Record<string, number>
type DemandCapacityFormState = Record<string, number>
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

function isWeekendDate(value: string) {
  const day = parseDateKey(value).getDay()
  return day === 0 || day === 6
}

function repairPositionLabel(value: string) {
  if (value.startsWith('Thu ng') && value.endsWith('n')) return 'Thu ngan'
  return value
}

function getDisplayPositionName(positionId: string) {
  return repairPositionLabel(getPositionById(positionId)?.name || positionId)
}

function formatFilledCountLabel(filledCount: number, requiredCount: number) {
  return `${filledCount}/${requiredCount} nguoi`
}

function formatRegisteredCountLabel(registeredCount: number) {
  return `${registeredCount} nguoi`
}

function getShortageLabel(requiredCount: number, filledCount: number) {
  const shortage = Math.max(requiredCount - filledCount, 0)
  return shortage > 0 ? `Con thieu ${shortage}` : 'Da du nguoi'
}

function EmployeeScheduleRegistration({ query }: { query: ReturnType<typeof resolveSchedulesQuery> }) {
  const { user } = useAuthStore()
  const weekStart = useMemo(() => query.weekStart || plusDays(getWeekStart(), 7), [query.weekStart])
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])
  const [refreshKey, setRefreshKey] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [popupMessage, setPopupMessage] = useState<string | null>(null)

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
      setMessage('Khong the luu dang ky. Co the da qua han hoac dot dang ky da dong.')
      return
    }

    setRefreshKey(prev => prev + 1)
    setMessage(submit ? 'Da gui dang ky ca thanh cong.' : 'Da luu nhap dang ky ca.')
  }

  return (
    <AppShell showNav>
      <div className="animate-fade-in space-y-5 pb-20">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-800">Dang ky lich lam tuan toi</h1>
          <p className="mt-1 text-xs text-gray-400">Chi nhanh {getStoreById(user.store_id)?.name || user.store_id} - Tuan {week.week_start} - {week.week_end}</p>
        </div>

        <div className={`rounded-2xl border px-4 py-3 text-sm ${locked ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
          {locked
            ? `Dot dang ky da khoa${week.registration_deadline ? ` (han: ${week.registration_deadline.replace('T', ' ')})` : ''}.`
            : `Dot dang ky dang mo${week.registration_deadline ? ` den ${week.registration_deadline.replace('T', ' ')}` : ''}.`}
        </div>

        {message && <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">{message}</div>}

        <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-white shadow-sm">
          <table className="w-full min-w-[860px] text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-500">Ca</th>
                {weekDates.map(date => <th key={date} className="px-3 py-3 text-center text-xs font-bold uppercase text-gray-500">{formatShortDate(date)}</th>)}
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
                          <option value="preferred">Uu tien</option>
                          <option value="available">Co the lam</option>
                          <option value="unavailable">Khong the lam</option>
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
            <button onClick={() => handleSave(false)} className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50">Luu nhap</button>
            <button onClick={() => handleSave(true)} className="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-white hover:opacity-90">Gui dang ky</button>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function ManagerSchedulingBoard({ query }: { query: ReturnType<typeof resolveSchedulesQuery> }) {
  const { user } = useAuthStore()
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [popupMessage, setPopupMessage] = useState<string | null>(null)
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
  const boardDemands = useMemo(() => board?.demands || [], [board])

  const demandForm = useMemo(() => {
    const nextState: DemandFormState = {}
    weekDates.forEach(date => {
      templates.forEach(template => {
        const allowedPositionIds = template.allowed_position_ids?.length ? template.allowed_position_ids : []
        allowedPositionIds.forEach(positionId => {
          const slot = boardDemands.find(item => item.date === date && item.shift_template_id === template.id && item.position_id === positionId)
          nextState[`${date}__${template.id}__${positionId}`] = slot?.required_count ?? template.min_headcount ?? 1
        })
      })
    })
    return nextState
  }, [boardDemands, templates, weekDates])

  const capacityForm = useMemo(() => {
    const nextState: DemandCapacityFormState = {}
    templates.forEach(template => {
      nextState[template.id] = template.max_headcount ?? 0
    })
    return nextState
  }, [templates])

  const [draftDemand, setDraftDemand] = useState<DemandFormState>({})
  const [draftCapacity, setDraftCapacity] = useState<DemandCapacityFormState>({})

  useEffect(() => { setDraftDemand(demandForm) }, [demandForm])
  useEffect(() => { setDraftCapacity(capacityForm) }, [capacityForm])
  useEffect(() => { setSelectedSlot(null); setRecommendationSearch(''); setPopupMessage(null) }, [activeStoreId, activeWeekStart])
  useEffect(() => { setRecommendationSearch(''); setPopupMessage(null) }, [selectedSlot])
  useEffect(() => {
    if (!selectedSlot || !board) return
    if (!board.demands.some(slot => slot.id === selectedSlot)) setSelectedSlot(null)
  }, [board, selectedSlot])

  if (!user || !board) return null

  const validate = ScheduleService.validateWeekForPublish(user, activeStoreId, activeWeekStart)
  const selectedSlotData = selectedSlot ? (board.demands.find(slot => slot.id === selectedSlot) || null) : null
  const selectedSlotGroup = selectedSlotData ? board.demands
    .filter(slot => slot.date === selectedSlotData.date && slot.shift_template_id === selectedSlotData.shift_template_id)
    .sort((left, right) => {
      if (right.missing_count !== left.missing_count) return right.missing_count - left.missing_count
      if (right.required_count !== left.required_count) return right.required_count - left.required_count
      return getDisplayPositionName(left.position_id).localeCompare(getDisplayPositionName(right.position_id))
    }) : []
  const selectedShiftTemplate = selectedSlotData ? ShiftTemplateService.getById(selectedSlotData.shift_template_id) : null
  const slotRecommendations = selectedSlotData ? ScheduleService.getSlotRecommendations(board, selectedSlotData) : []
  const filteredRecommendations = filterRecommendationsBySearch(slotRecommendations, recommendationSearch)
  const recommendationSections = buildRecommendationSections(filteredRecommendations)
  const overviewCards = buildWeekOverviewCards(board, weekDates)
  const scheduleRows = buildScheduleRows({
    board,
    weekDates,
    templates: templates.map(template => ({ id: template.id, name: template.name, start_time: template.start_time, end_time: template.end_time })),
  })

  const selectedStore = getStoreById(activeStoreId)
  const selectedSlotKey = selectedSlotData ? `${selectedSlotData.date}__${selectedSlotData.shift_template_id}` : null
  const selectedSlotGroupFilledCount = selectedSlotGroup.reduce((sum, slot) => sum + slot.filled_count, 0)
  const selectedSlotGroupRequiredCount = selectedSlotGroup.reduce((sum, slot) => sum + slot.required_count, 0)
  const selectedSlotTitle = selectedSlotData ? `${selectedShiftTemplate?.name || selectedSlotData.shift_template_id} - ${formatShortDate(selectedSlotData.date)}` : ''
  const selectedSlotSubtitle = selectedSlotData ? buildAssignmentModalSubtitle({
    startTime: selectedShiftTemplate?.start_time,
    endTime: selectedShiftTemplate?.end_time,
    positionLabel: getDisplayPositionName(selectedSlotData.position_id),
    filledCount: selectedSlotData.filled_count,
    requiredCount: selectedSlotData.required_count,
  }) : ''
  const selectedSlotFilledLabel = selectedSlotData ? formatFilledCountLabel(selectedSlotData.filled_count, selectedSlotData.required_count) : undefined
  const selectedSlotHeadcountLimitLabel = buildAssignmentHeadcountLimitLabel(selectedShiftTemplate?.max_headcount)
  const selectedSlotCapacityWarning = buildShiftDemandCapacityWarning(selectedSlotGroupRequiredCount, selectedShiftTemplate?.max_headcount)
  const selectedSlotWarningMessage = popupMessage || selectedSlotCapacityWarning || null

  const totalDemand = board.demands.reduce((sum, slot) => sum + slot.required_count, 0)
  const totalAssigned = board.demands.reduce((sum, slot) => sum + slot.filled_count, 0)
  const scheduledEmployees = new Set(board.assignments.map(item => item.employee_id)).size
  const emptySlots = board.demands.filter(slot => slot.filled_count === 0).length
  const weekLabel = `${formatShortDate(weekDates[0])} - ${formatShortDate(weekDates[6])}`
  const requiresPublishedReason = board.week.status === 'published' || board.week.cycle_status === 'published'
  const headerMetrics = buildHeaderMetrics({
    scheduledEmployees,
    totalDemand,
    totalAssigned,
    emptySlots,
    hardWarningCount: validate.hardWarnings.length,
    softWarningCount: validate.softWarnings.length,
  })

  const saveDemandState = (nextForm: DemandFormState, nextCapacity: DemandCapacityFormState, messageText: string) => {
    const nextDemands: ShiftDemand[] = Object.entries(nextForm).map(([key, requiredCount]) => {
      const [date, shiftTemplateId, positionId] = key.split('__')
      const template = templates.find(item => item.id === shiftTemplateId)
      const existing = boardDemands.find(item => item.date === date && item.shift_template_id === shiftTemplateId && item.position_id === positionId)
      return {
        id: existing?.id || `draft-${date}-${shiftTemplateId}-${positionId}` ,
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

    templates.forEach(template => {
      ShiftTemplateService.upsert({
        ...template,
        max_headcount: Math.max(Number(nextCapacity[template.id] ?? template.max_headcount ?? 0), 0),
      })
    })

    ScheduleService.saveShiftDemand(user, activeStoreId, activeWeekStart, nextDemands)
    setRefreshKey(value => value + 1)
    setMessage(messageText)
  }

  const openPublishedChangeModal = (payload: PendingPublishedChange) => {
    setPendingPublishedChange(payload)
    setPublishedChangeReason('')
  }

  const handleAssign = (employeeId: string, changeReason?: string) => {
    if (!selectedSlotData) return
    const result = ScheduleService.assignEmployeeToSlot({ currentUser: user, storeId: activeStoreId, weekStart: activeWeekStart, employeeId, date: selectedSlotData.date, shiftTemplateId: selectedSlotData.shift_template_id, changeReason })
    if (!result.schedule) {
      setPopupMessage(buildAssignmentFailureMessage(result.warnings))
      return
    }
    setRefreshKey(prev => prev + 1)
    if (result.warnings.length > 0) {
      const warningSummary = result.warnings.map(warning => warning.message).slice(0, 2).join(' | ')
      setPopupMessage(`Da gan nhan su vao ca, nhung can xem lai: ${warningSummary}`)
      return
    }
    setPopupMessage(null)
    setMessage('Da gan nhan su vao ca thanh cong.')
  }

  const handleRemove = (employeeId: string, date: string, changeReason?: string) => {
    const success = ScheduleService.removeAssignment(user, activeStoreId, employeeId, date, changeReason)
    if (!success) {
      setMessage('Khong go duoc nhan su khoi ca. Hay thu lai.')
      return
    }
    setRefreshKey(prev => prev + 1)
    setMessage('Da go nhan su khoi ca.')
  }

  const submitPublishedChange = () => {
    if (!pendingPublishedChange) return
    if (!publishedChangeReason.trim()) {
      setMessage('Can nhap ly do thay doi truoc khi luu lich da chot.')
      return
    }
    if (pendingPublishedChange.action === 'assign') handleAssign(pendingPublishedChange.employeeId, publishedChangeReason.trim())
    else handleRemove(pendingPublishedChange.employeeId, pendingPublishedChange.date, publishedChangeReason.trim())
    setPendingPublishedChange(null)
    setPublishedChangeReason('')
  }

  const handleModalAssign = (employeeId: string) => {
    if (requiresPublishedReason && selectedSlotData) {
      const recommendation = slotRecommendations.find(item => item.employee_id === employeeId)
      openPublishedChangeModal({ action: 'assign', employeeId, employeeName: recommendation?.employee_name || employeeId, date: selectedSlotData.date })
      return
    }
    handleAssign(employeeId)
  }

  const handleModalRemove = (employeeId: string) => {
    if (requiresPublishedReason && selectedSlotData) {
      const recommendation = slotRecommendations.find(item => item.employee_id === employeeId)
      openPublishedChangeModal({ action: 'remove', employeeId, employeeName: recommendation?.employee_name || employeeId, date: selectedSlotData.date })
      return
    }
    if (selectedSlotData) handleRemove(employeeId, selectedSlotData.date)
  }

  const handleSaveDraftWeek = () => {
    const success = ScheduleService.saveDraftWeek(user, activeStoreId, weekDates)
    setMessage(success ? 'Da luu ban nhap tuan.' : 'Khong luu duoc ban nhap tuan.')
  }

  const handlePublish = () => {
    if (validate.hardWarnings.length > 0) {
      setMessage('Can xu ly canh bao chan truoc khi chot lich.')
      return
    }
    if (validate.softWarnings.length > 0) {
      setMessage('Can xem lai canh bao mem truoc khi chot lich.')
      return
    }
    const success = ScheduleService.publishWeek(user, activeStoreId, weekDates)
    setMessage(success ? 'Da chot lich thanh cong.' : 'Khong chot duoc lich.')
    if (success) setRefreshKey(prev => prev + 1)
  }

  const applyTemplateDemand = (mode: 'weekday' | 'weekend') => {
    setDraftDemand(prev => {
      const next = { ...prev }
      weekDates.forEach(date => {
        templates.forEach(template => {
          ;(template.allowed_position_ids || []).forEach(positionId => {
            const key = `${date}__${template.id}__${positionId}`
            const isWeekend = isWeekendDate(date)
            const shouldApply = mode === 'weekday' ? !isWeekend : isWeekend
            if (!shouldApply) return
            const base = template.min_headcount ?? 1
            next[key] = mode === 'weekend' ? base + 1 : base
          })
        })
      })
      return next
    })
    setMessage(mode === 'weekday' ? 'Da ap dung mau nhu cau ngay thuong.' : 'Da ap dung mau nhu cau cuoi tuan.')
  }

  const copyFromPreviousWeek = () => {
    const previousWeekDates = getWeekDates(plusDays(activeWeekStart, -7))
    const copied = ScheduleService.copyPreviousWeek(user, activeStoreId, previousWeekDates, weekDates)
    if (copied <= 0) {
      setMessage('Khong copy duoc nhu cau tu tuan truoc.')
      return
    }
    setRefreshKey(prev => prev + 1)
    setMessage('Da copy nhu cau tu tuan truoc.')
  }

  const resetDemand = () => {
    setDraftDemand(demandForm)
    setDraftCapacity(capacityForm)
    setMessage('Da reset cau hinh ve mac dinh.')
  }

  return (
    <AppShell showNav>
      <div className="animate-fade-in space-y-5 pb-20">
        <ScheduleToolbar
          stores={stores.map(store => ({ id: store.id, name: store.name }))}
          activeStoreId={activeStoreId}
          activeWeekLabel={weekLabel}
          onStoreChange={setSelectedStoreId}
          onPreviousWeek={() => setWeekOffset(prev => prev - 1)}
          onNextWeek={() => setWeekOffset(prev => prev + 1)}
          onOpenDemandEditor={() => setShowDemandEditor(true)}
          onCopyPreviousWeek={copyFromPreviousWeek}
          onSaveDraft={handleSaveDraftWeek}
          onPublish={handlePublish}
          canSelectStore={stores.length > 1}
          selectedStoreName={selectedStore?.name || activeStoreId}
          primaryMetrics={headerMetrics.primary}
          warningPill={headerMetrics.warning}
        />

        {message && <div className="rounded-2xl border border-primary-200 bg-primary-50 px-4 py-3 text-sm text-primary-700">{message}</div>}

        <WeeklyBoardGrid
          dates={weekDates}
          daySummaries={overviewCards}
          rows={scheduleRows}
          selectedSlotKey={selectedSlotKey}
          onSelectCell={payload => setSelectedSlot(payload.slotId || null)}
        />

        <AssignmentModal
          open={Boolean(selectedSlotData)}
          slotTitle={selectedSlotTitle}
          slotSubtitle={selectedSlotSubtitle}
          shortageLabel={selectedSlotData ? getShortageLabel(selectedSlotData.required_count, selectedSlotData.filled_count) : ''}
          search={recommendationSearch}
          onSearchChange={setRecommendationSearch}
          sections={recommendationSections}
          requiresPublishedReason={requiresPublishedReason}
          onAssign={handleModalAssign}
          onRemove={handleModalRemove}
          onClose={() => setSelectedSlot(null)}
          filledCountLabel={selectedSlotFilledLabel}
          headcountLimitLabel={selectedSlotHeadcountLimitLabel}
          warningMessage={selectedSlotWarningMessage}
          warningTitle={selectedSlotWarningMessage ? 'Can xem lai cau hinh ca' : null}
          positionOptions={selectedSlotGroup.map(slot => ({
            id: slot.id,
            label: getDisplayPositionName(slot.position_id),
            filledCountLabel: formatFilledCountLabel(slot.filled_count, slot.required_count),
            shortageLabel: getShortageLabel(slot.required_count, slot.filled_count),
          }))}
          activePositionId={selectedSlot}
          onPositionChange={slotId => setSelectedSlot(slotId)}
        />

        {showDemandEditor && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
            <div className="h-full w-full max-w-3xl overflow-y-auto bg-white p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800">Cau hinh nhan su theo ca</h2>
                  <p className="mt-1 text-xs text-gray-400">{selectedStore?.name || activeStoreId} - Tuan {board.week.week_start} - {board.week.week_end}</p>
                </div>
                <button onClick={() => setShowDemandEditor(false)} className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Dong</button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={copyFromPreviousWeek} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Lay tuan truoc</button>
                <button onClick={() => applyTemplateDemand('weekday')} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Ap dung ngay thuong</button>
                <button onClick={() => applyTemplateDemand('weekend')} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Ap dung cuoi tuan</button>
                <button onClick={resetDemand} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50">Tra ve mac dinh</button>
              </div>

              <div className="mt-5 grid gap-4">
                {weekDates.map(date => (
                  <div key={date} className="rounded-3xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-3 text-sm font-bold text-gray-800">{formatShortDate(date)}</div>
                    <div className="space-y-3">
                      {templates.map(template => {
                        const templateTotalDemand = (template.allowed_position_ids || []).reduce((sum, positionId) => {
                          const key = `${date}__${template.id}__${positionId}`
                          return sum + Number(draftDemand[key] ?? 0)
                        }, 0)
                        const templateCapacity = Math.max(Number(draftCapacity[template.id] ?? template.max_headcount ?? 0), 0)
                        const templateCapacityWarning = buildShiftDemandCapacityWarning(templateTotalDemand, templateCapacity)

                        return (
                        <div key={`${date}-${template.id}`} className="rounded-2xl border border-white bg-white p-3">
                          <div className="mb-3">
                            <div className="font-bold text-gray-800">{template.name}</div>
                            <div className="text-xs text-gray-400">{template.start_time} - {template.end_time}</div>
                            <div className="mt-3 grid gap-2 md:grid-cols-[minmax(180px,220px)_1fr]">
                              <label className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                <div className="mb-1 text-xs text-gray-500">Suc chua ca</div>
                                <input type="number" min={0} value={templateCapacity} onChange={event => setDraftCapacity(prev => ({ ...prev, [template.id]: Number(event.target.value) }))} className="w-full bg-transparent font-bold outline-none" />
                              </label>
                              <div className="rounded-xl border border-[#eadbc9] bg-[#fffaf4] px-3 py-2 text-sm text-[#6f6258]">
                                <div className="text-xs text-[#8e8072]">Tong nhan su can</div>
                                <div className="mt-1 text-base font-bold text-[#28445f]">{templateTotalDemand}/{templateCapacity} nguoi</div>
                              </div>
                            </div>
                            {templateCapacityWarning ? <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">{templateCapacityWarning}</div> : null}
                          </div>
                          <div className="grid gap-2 md:grid-cols-3">
                            {(template.allowed_position_ids || []).map(positionId => {
                              const key = `${date}__${template.id}__${positionId}`
                              return (
                                <label key={key} className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                  <div className="mb-1 text-xs text-gray-500">{getDisplayPositionName(positionId)}</div>
                                  <input type="number" min={0} value={draftDemand[key] ?? 0} onChange={event => setDraftDemand(prev => ({ ...prev, [key]: Number(event.target.value) }))} className="w-full bg-transparent font-bold outline-none" />
                                </label>
                              )
                            })}
                          </div>
                        </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 mt-5 flex justify-end gap-2 border-t border-gray-100 bg-white pt-4">
                <button onClick={() => setShowDemandEditor(false)} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Huy</button>
                <button onClick={() => { saveDemandState(draftDemand, draftCapacity, 'Da luu cau hinh nhan su.'); setShowDemandEditor(false) }} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90">Luu cau hinh</button>
              </div>
            </div>
          </div>
        )}

        {pendingPublishedChange && selectedSlotData && (
          <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/30 p-4 sm:items-center">
            <div className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl">
              <h3 className="text-base font-bold text-gray-800">Nhap ly do thay doi</h3>
              <p className="mt-1 text-xs text-gray-500">{pendingPublishedChange.action === 'assign' ? 'Gan' : 'Go'} ca {selectedShiftTemplate?.name || selectedSlotData.shift_template_id} cho {pendingPublishedChange.employeeName} ngay {formatCalendarDate(pendingPublishedChange.date)}.</p>
              <textarea value={publishedChangeReason} onChange={event => setPublishedChangeReason(event.target.value)} rows={4} placeholder="Vi du: bo sung gio cao diem, nhan vien xin doi ca..." className="mt-4 w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-gray-700 outline-none" />
              <div className="mt-4 flex justify-end gap-2">
                <button onClick={() => { setPendingPublishedChange(null); setPublishedChangeReason('') }} className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Huy</button>
                <button onClick={submitPublishedChange} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90">Luu thay doi</button>
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

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])

  useEffect(() => {
    const currentSearch = searchParams.toString()
    if (currentSearch === query.canonicalSearch) return
    const nextUrl = query.canonicalSearch ? `/schedules?${query.canonicalSearch}` : '/schedules'
    router.replace(nextUrl)
  }, [query.canonicalSearch, router, searchParams])

  if (!user) return null
  if (user.role === 'employee') return <EmployeeScheduleRegistration query={query} />
  return <ManagerSchedulingBoard query={query} />
}

export default function SchedulesPage() {
  return <Suspense fallback={null}><SchedulesPageContent /></Suspense>
}
