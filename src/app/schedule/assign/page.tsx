'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import AssignScheduleGrid from '@/components/scheduling/AssignScheduleGrid'
import { mockStores, mockRequests } from '@/lib/mock-data'
import { cancelOpenShift } from '@/lib/mock-data-open-shifts'
import { storeAdapter, employeeAdapter } from '@/lib/adapters'
import { ScheduleService } from '@/lib/services/schedule-service'
import { EmployeeService } from '@/lib/services/employee-service'
import { getAllPreferencesForWeek } from '@/lib/mock-data-preferences'
import { checkScheduleWarnings, type ScheduleWarning } from '@/lib/mock-data-schedule-rules'
import { getWeeklyStaffingSummary } from '@/lib/mock-data-staffing'
import { calculateWeeklyCost } from '@/lib/mock-data-labor-cost'
import { format } from 'date-fns'
import { Copy, Zap, Eye, EyeOff } from 'lucide-react'

function getWeekDates(weekOffset: number): string[] {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7) + weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return format(d, 'yyyy-MM-dd')
  })
}

function formatWeekRange(dates: string[]): string {
  if (dates.length < 7) return ''
  const s = new Date(dates[0])
  const e = new Date(dates[6])
  return `${format(s, 'dd/MM')} — ${format(e, 'dd/MM/yyyy')}`
}

export default function ScheduleAssignPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [editCell, setEditCell] = useState<{ empId: string; date: string } | null>(null)
  const [editShift, setEditShift] = useState('')
  const [editNote, setEditNote] = useState('')
  const [showQuickAssign, setShowQuickAssign] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [showPrefs, setShowPrefs] = useState(false)
  const [pendingWarnings, setPendingWarnings] = useState<ScheduleWarning[]>([])
  const [showWarningPopup, setShowWarningPopup] = useState(false)
  const [viewMode, setViewMode] = useState<'staff' | 'cost' | 'both'>('both')
  const [showStaffingDetail, setShowStaffingDetail] = useState<string | null>(null)

  const [showCreateOS, setShowCreateOS] = useState<{ date: string } | null>(null)
  const [osShift, setOsShift] = useState('shift-001')
  const [osPosition, setOsPosition] = useState('pos-001')
  const [osSlots, setOsSlots] = useState(1)
  const [osNote, setOsNote] = useState('')
  const [osAutoApprove, setOsAutoApprove] = useState(false)

  const [qaEmployees, setQaEmployees] = useState<string[]>([])
  const [qaShift, setQaShift] = useState('shift-001')
  const [qaPattern, setQaPattern] = useState<'all' | 'even' | 'odd' | 'mwf' | 'tts'>('all')

  const [storeList, setStoreList] = useState(mockStores)

  useEffect(() => {
    storeAdapter.getStores().then(res => setStoreList(res))
    employeeAdapter.getAllEmployees().then(res => {
      if (res && res.length) {
        EmployeeService.syncEmployeesFromAdapter(res)
        setRefreshKey(k => k + 1)
      }
    })
  }, [])

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])

  const isAdmin = user?.role === 'hr_admin' || user?.role === 'ceo'
  const stores = useMemo(
    () => isAdmin ? storeList.filter(s => s.is_active) : user ? storeList.filter(s => s.id === user.store_id) : [],
    [isAdmin, user, storeList],
  )

  const effectiveStoreId = selectedStoreId || stores[0]?.id || ''

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const prevWeekDates = useMemo(() => getWeekDates(weekOffset - 1), [weekOffset])

  const employees = useMemo(
    () => {
      if (!effectiveStoreId || !user) return []
      const list = EmployeeService.getEmployees(user)
      return list.filter(e => e.store_id === effectiveStoreId && (e.role === 'employee' || e.role === 'shift_leader'))
    },
    [effectiveStoreId, user],
  )

  const schedules = useMemo(
    () => effectiveStoreId && user ? ScheduleService.getStoreSchedules(user, effectiveStoreId, weekDates) : [],
    [effectiveStoreId, weekDates, refreshKey, user],
  )

  const leaveRequests = useMemo(
    () => mockRequests.filter(r =>
      r.status === 'approved' && r.type === 'time_off' &&
      r.start_date && weekDates.some(d => d >= r.start_date! && d <= (r.end_date || r.start_date!))
    ),
    [weekDates],
  )

  const weekStartDate = weekDates[0]
  const allPrefs = useMemo(
    () => showPrefs ? getAllPreferencesForWeek(weekStartDate) : [],
    [weekStartDate, showPrefs],
  )

  const isOnLeave = useCallback((empId: string, date: string): boolean => {
    return leaveRequests.some(r =>
      r.employee_id === empId && r.start_date &&
      date >= r.start_date && date <= (r.end_date || r.start_date)
    )
  }, [leaveRequests])

  const empsForStaffing = useMemo(() => employees.map(e => ({ id: e.id, position_id: e.position_id })), [employees])

  const staffingSummary = useMemo(
    () => effectiveStoreId ? getWeeklyStaffingSummary(effectiveStoreId, weekDates, schedules, empsForStaffing) : null,
    [effectiveStoreId, weekDates, schedules, refreshKey, empsForStaffing],
  )

  const costSummary = useMemo(
    () => effectiveStoreId ? calculateWeeklyCost(effectiveStoreId, weekDates, schedules) : null,
    [effectiveStoreId, weekDates, schedules, refreshKey],
  )

  if (!user || user.role === 'employee') return null

  const handleCellClick = (empId: string, date: string) => {
    const existing = schedules.find(s => s.employee_id === empId && s.date === date)
    setEditCell({ empId, date })
    setEditShift(existing?.shift_id ?? '')
    setEditNote(existing?.notes ?? '')
  }

  const handleSave = () => {
    if (!editCell || !selectedStoreId) return
    if (editShift) {
      const warns = checkScheduleWarnings(editCell.empId, editShift, editCell.date, selectedStoreId, schedules)
      if (warns.length > 0) {
        setPendingWarnings(warns)
        setShowWarningPopup(true)
        return
      }
      ScheduleService.assignSchedule(user, selectedStoreId, editCell.empId, editShift, editCell.date, editNote || undefined)
    } else {
      ScheduleService.deleteSchedule(user, selectedStoreId, editCell.empId, editCell.date)
    }
    setEditCell(null)
    setRefreshKey(k => k + 1)
    showToast('Đã lưu thay đổi')
  }

  const handleCopyWeek = () => {
    if (!selectedStoreId) return
    const count = ScheduleService.copyPreviousWeek(user, selectedStoreId, prevWeekDates, weekDates)
    setRefreshKey(k => k + 1)
    showToast(`Đã copy ${count} lịch từ tuần trước`)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleCancelOpenShift = (openShiftId: string) => {
    if (!window.confirm('Hủy ca trống này?')) return
    cancelOpenShift(openShiftId)
    setRefreshKey(k => k + 1)
    showToast('Đã hủy ca trống trên board')
  }

  return (
    <AppShell showNav>
      <div className="space-y-4 animate-fade-in font-['Inter'] pb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-dark-700">Xếp lịch làm việc</h1>
            <p className="text-xs text-gray-400 mt-0.5">Quản lý ca cho nhân viên</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowPrefs(p => !p)} className="h-9 px-3 rounded-xl text-xs font-medium bg-primary-50 text-gray-600 hover:bg-gray-200">
              {showPrefs ? <EyeOff size={14} /> : <Eye size={14} />} Preference
            </button>
            <button onClick={handleCopyWeek} className="h-9 px-3 rounded-xl bg-primary-50 text-gray-600 text-xs font-medium hover:bg-gray-200">
              <Copy size={14} /> Copy tuần
            </button>
            <button onClick={() => setShowQuickAssign(true)} className="h-9 px-3 rounded-xl bg-primary-600 text-white text-xs font-bold hover:bg-primary-700">
              <Zap size={14} /> Xếp nhanh
            </button>
          </div>
        </div>

        <AssignScheduleGrid
          selectedStoreId={effectiveStoreId}
          weekDates={weekDates}
          employees={employees}
          schedules={schedules}
          viewMode={viewMode}
          staffingSummary={staffingSummary}
          costSummary={costSummary}
          showPrefs={showPrefs}
          allPrefs={allPrefs}
          handleCellClick={handleCellClick}
          setShowCreateOS={setShowCreateOS}
          setOsShift={setOsShift}
          setOsPosition={setOsPosition}
          setOsSlots={setOsSlots}
          setOsNote={setOsNote}
          setOsAutoApprove={setOsAutoApprove}
          handleCancelOpenShift={handleCancelOpenShift}
          setShowStaffingDetail={setShowStaffingDetail}
          showStaffingDetail={showStaffingDetail}
        />
      </div>
    </AppShell>
  )
}
