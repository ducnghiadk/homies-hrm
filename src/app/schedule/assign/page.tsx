'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  mockShifts, mockStores, mockRequests,
  getShiftById, getStoreById, getPositionById,
  getScheduleByEmployeeDate,
  type Schedule,
} from '@/lib/mock-data'
import { ScheduleService } from '@/lib/services/schedule-service'
import { EmployeeService } from '@/lib/services/employee-service'
import { getAllPreferencesForWeek, getShiftPreferenceAvailability, type ShiftPreference } from '@/lib/mock-data-preferences'
import { ShiftTemplateService } from '@/lib/services/shift-template-service'
import { getPendingSwapRequestsForManager } from '@/lib/mock-data-swap'
import {
  getOpenShiftsByStoreWeek, createOpenShift, getPendingClaimsForStore,
  cancelOpenShift, getOpenShiftStateMeta,
} from '@/lib/mock-data-open-shifts'
import { notifyOpenShiftCreated } from '@/lib/notifications/open-shift-notifications'
import {
  checkScheduleWarnings, scanWeekWarnings, getEmployeeWeeklyHours,
  type ScheduleWarning,
} from '@/lib/mock-data-schedule-rules'
import {
  getWeeklyStaffingSummary,
} from '@/lib/mock-data-staffing'
import {
  calculateWeeklyCost, getHourlyRate,
  laborCostSettings, fmt,
} from '@/lib/mock-data-labor-cost'
import { format, addDays } from 'date-fns'
import { vi } from 'date-fns/locale'
import {
  ChevronLeft, ChevronRight, Copy, Zap, X,
  AlertTriangle, Eye, EyeOff, ArrowRightLeft, Briefcase, Users,
  ShieldAlert,
} from 'lucide-react'

// ─── Week date helpers ───
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
  const [showStaffingDetail, setShowStaffingDetail] = useState<string | null>(null) // date

  // Open shift creation modal state
  const [showCreateOS, setShowCreateOS] = useState<{ date: string } | null>(null)
  const [osShift, setOsShift] = useState('shift-001')
  const [osPosition, setOsPosition] = useState('pos-001')
  const [osSlots, setOsSlots] = useState(1)
  const [osNote, setOsNote] = useState('')
  const [osAutoApprove, setOsAutoApprove] = useState(false)

  // Quick assign state
  const [qaEmployees, setQaEmployees] = useState<string[]>([])
  const [qaShift, setQaShift] = useState('shift-001')
  const [qaPattern, setQaPattern] = useState<'all' | 'even' | 'odd' | 'mwf' | 'tts'>('all')

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])

  const isAdmin = user?.role === 'hr_admin' || user?.role === 'ceo'
  // Store manager or shift leader can also manage
  const stores = useMemo(
    () => isAdmin ? mockStores.filter(s => s.is_active) : user ? [getStoreById(user.store_id)].filter(Boolean) : [],
    [isAdmin, user],
  )

  useEffect(() => {
    if (stores.length > 0 && !selectedStoreId) setSelectedStoreId(stores[0]!.id)
  }, [stores, selectedStoreId])

  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])
  const prevWeekDates = useMemo(() => getWeekDates(weekOffset - 1), [weekOffset])

  // Employees for selected store (non-manager roles)
  const employees = useMemo(
    () => {
      if (!selectedStoreId || !user) return []
      const list = EmployeeService.getEmployees(user)
      return list.filter(e => e.store_id === selectedStoreId && (e.role === 'employee' || e.role === 'shift_leader'))
    },
    [selectedStoreId, user],
  )

  // Current week schedules — use refreshKey to force re-read
  const schedules = useMemo(
    () => selectedStoreId && user ? ScheduleService.getStoreSchedules(user, selectedStoreId, weekDates) : [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedStoreId, weekDates, refreshKey, user],
  )

  // Approved leave requests for this week
  const leaveRequests = useMemo(
    () => mockRequests.filter(r =>
      r.status === 'approved' && r.type === 'time_off' &&
      r.start_date && weekDates.some(d => d >= r.start_date! && d <= (r.end_date || r.start_date!))
    ),
    [weekDates],
  )

  // Employee preferences for current week
  const weekStartDate = weekDates[0]
  const allPrefs = useMemo(
    () => showPrefs ? getAllPreferencesForWeek(weekStartDate) : [],
    [weekStartDate, showPrefs],
  )

  const getPref = useCallback((empId: string, date: string): ShiftPreference | undefined => {
    return allPrefs.find(p => p.user_id === empId && p.date === date)
  }, [allPrefs])

  const getPrefDots = useCallback((pref: ShiftPreference, storeId: string) => {
    if (pref.not_available) return []
    return ShiftTemplateService.getActiveForStore(storeId)
      .filter(template => getShiftPreferenceAvailability(pref, template.id))
      .slice(0, 3)
      .map(template => ({ color: template.color, title: `${template.name} ?` }))
  }, [])

  const getScheduleCell = useCallback((empId: string, date: string): Schedule | undefined => {
    return schedules.find(s => s.employee_id === empId && s.date === date)
  }, [schedules])

  const isOnLeave = useCallback((empId: string, date: string): boolean => {
    return leaveRequests.some(r =>
      r.employee_id === empId && r.start_date &&
      date >= r.start_date && date <= (r.end_date || r.start_date)
    )
  }, [leaveRequests])

  // ─── Staffing + Cost (must be before early return) ───
  const empsForStaffing = useMemo(() => employees.map(e => ({ id: e.id, position_id: e.position_id })), [employees])

  const staffingSummary = useMemo(
    () => selectedStoreId ? getWeeklyStaffingSummary(selectedStoreId, weekDates, schedules, empsForStaffing) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedStoreId, weekDates, refreshKey, empsForStaffing],
  )

  const costSummary = useMemo(
    () => selectedStoreId ? calculateWeeklyCost(selectedStoreId, weekDates, schedules) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedStoreId, weekDates, refreshKey],
  )

  if (!user) return null

  if (user.role === 'employee') {
    return (
      <AppShell title="Phân ca">
        <div className="py-20 text-center" style={{ color: 'var(--text-muted)' }}>
          Không có quyền
        </div>
      </AppShell>
    )
  }

  // ─── Validation ───
  const validateAssignment = (empId: string, date: string, shiftId: string): string | null => {
    if (isOnLeave(empId, date)) return 'Ngày này NV đang nghỉ phép'

    // Check consecutive night → morning
    if (shiftId === 'shift-001') { // Ca sáng
      const prevDate = format(addDays(new Date(date), -1), 'yyyy-MM-dd')
      const prevSchedule = getScheduleByEmployeeDate(empId, prevDate, selectedStoreId)
      if (prevSchedule?.shift_id === 'shift-003') return 'Chưa đủ 8 tiếng nghỉ (Ca tối → Ca sáng)'
    }

    return null
  }

  // ─── Handlers ───
  const handleCellClick = (empId: string, date: string) => {
    const existing = getScheduleCell(empId, date)
    setEditCell({ empId, date })
    setEditShift(existing?.shift_id ?? '')
    setEditNote(existing?.notes ?? '')
  }

  const handleSave = () => {
    if (!editCell || !selectedStoreId) return

    if (editShift) {
      const oldWarning = validateAssignment(editCell.empId, editCell.date, editShift)
      if (oldWarning && !confirm(`⚠️ ${oldWarning}\n\nVẫn muốn tiếp tục?`)) return

      // Smart warnings check
      const warns = checkScheduleWarnings(editCell.empId, editShift, editCell.date, selectedStoreId, schedules)
      const blocked = warns.filter(w => w.warning_level === 'block')
      if (blocked.length > 0) {
        setPendingWarnings(warns)
        setShowWarningPopup(true)
        return // Block — cannot proceed
      }
      if (warns.length > 0) {
        setPendingWarnings(warns)
        setShowWarningPopup(true)
        return // Show popup to confirm
      }

      ScheduleService.assignSchedule(user!, selectedStoreId, editCell.empId, editShift, editCell.date, editNote || undefined)
    } else {
      ScheduleService.deleteSchedule(user!, selectedStoreId, editCell.empId, editCell.date)
    }
    setEditCell(null)
    setRefreshKey(k => k + 1)
    showToast('Đã lưu thay đổi')
  }

  const handleForceAssign = () => {
    if (!editCell || !selectedStoreId || !editShift) return
    ScheduleService.assignSchedule(user!, selectedStoreId, editCell.empId, editShift, editCell.date, editNote || undefined)
    setShowWarningPopup(false)
    setPendingWarnings([])
    setEditCell(null)
    setRefreshKey(k => k + 1)
    showToast('Đã xếp ca (bỏ qua cảnh báo)')
  }

  const handleCopyWeek = () => {
    if (!selectedStoreId) return
    const count = ScheduleService.copyPreviousWeek(user!, selectedStoreId, prevWeekDates, weekDates)
    setRefreshKey(k => k + 1)
    showToast(`Đã copy ${count} lịch từ tuần trước`)
  }

  const handleQuickAssign = () => {
    if (!selectedStoreId || qaEmployees.length === 0) return
    let count = 0
    weekDates.forEach((date) => {
      const dayOfWeek = new Date(date).getDay()
      if (dayOfWeek === 0 || dayOfWeek === 6) return // Skip weekends

      // Pattern check
      const dayNum = new Date(date).getDate()
      if (qaPattern === 'even' && dayNum % 2 !== 0) return
      if (qaPattern === 'odd' && dayNum % 2 === 0) return
      if (qaPattern === 'mwf' && ![1, 3, 5].includes(dayOfWeek)) return
      if (qaPattern === 'tts' && ![2, 4, 6].includes(dayOfWeek)) return

      qaEmployees.forEach(empId => {
        const exists = getScheduleByEmployeeDate(empId, date, selectedStoreId)
        if (!exists) {
          ScheduleService.assignSchedule(user!, selectedStoreId, empId, qaShift, date)
          count++
        }
      })
    })
    setShowQuickAssign(false)
    setQaEmployees([])
    setRefreshKey(k => k + 1)
    showToast(`Đã xếp ${count} ca nhanh`)
  }

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleCancelOpenShift = (openShiftId: string) => {
    if (!window.confirm('Huy ca trong nay?')) return
    const cancelled = cancelOpenShift(openShiftId)
    if (!cancelled) {
      showToast('Khong the huy ca trong')
      return
    }
    setRefreshKey(k => k + 1)
    showToast('Da huy ca trong tren board')
  }

  // ─── Stats ───
  const totalAssigned = schedules.length
  const totalHours = schedules.reduce((acc, s) => {
    const shift = getShiftById(s.shift_id)
    if (!shift) return acc
    const [sh, sm] = shift.start_time.split(':').map(Number)
    const [eh, em] = shift.end_time.split(':').map(Number)
    return acc + (eh + em / 60) - (sh + sm / 60)
  }, 0)
  const unassigned = employees.filter(e =>
    !weekDates.some(d => getScheduleCell(e.id, d))
  ).length

  // Per-day per-shift summary
  const daySummary = weekDates.map(date => {
    const counts: Record<string, number> = {}
    mockShifts.forEach(s => { counts[s.id] = 0 })
    schedules.filter(s => s.date === date).forEach(s => {
      counts[s.shift_id] = (counts[s.shift_id] || 0) + 1
    })
    return counts
  })


  const costPctColor = (pct: number) => pct > 100 ? '#D9381E' : pct > 80 ? '#F6C85F' : '#1E9E57'
  const staffColor = (req: number, asg: number) => {
    if (req === 0) return '#1E9E57'
    const diff = req - asg
    if (diff <= 0) return '#1E9E57'
    if (diff <= 2) return '#F6C85F'
    return '#D9381E'
  }

  return (
    <AppShell showNav>
      <div className="space-y-4 animate-fade-in font-['Inter'] pb-6">
        {/* ─── Header ─── */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-dark-700">Xếp lịch làm việc</h1>
            <p className="text-xs text-gray-400 mt-0.5">Quản lý ca cho nhân viên</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPrefs(p => !p)}
              className={`h-9 px-3 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                showPrefs ? 'bg-success-100 text-success-700 border border-success-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title="Hiện/ẩn đăng ký ca NV"
            >
              {showPrefs ? <EyeOff size={14} /> : <Eye size={14} />} Preference
            </button>
            <button
              onClick={() => { if (confirm(`Copy lịch tuần trước sang tuần này?`)) handleCopyWeek() }}
              className="h-9 px-3 rounded-xl bg-gray-100 text-gray-600 text-xs font-medium flex items-center gap-1.5 hover:bg-gray-200 transition-colors"
            >
              <Copy size={14} /> Copy tuần
            </button>
            <button
              onClick={() => setShowQuickAssign(true)}
              className="h-9 px-3 rounded-xl bg-primary-600 text-white text-xs font-bold flex items-center gap-1.5 hover:bg-primary-700 transition-colors"
            >
              <Zap size={14} /> Xếp nhanh
            </button>
          </div>
        </div>

        {/* ─── Store selector (admin) ─── */}
        {stores.length > 1 && (
          <select
            value={selectedStoreId}
            onChange={e => { setSelectedStoreId(e.target.value); setRefreshKey(k => k + 1) }}
            className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {stores.map(s => s && <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        )}

        {/* ─── Swap requests badge ─── */}
        {(() => {
          const pendingSwaps = getPendingSwapRequestsForManager(selectedStoreId)
          if (pendingSwaps.length === 0) return null
          return (
            <button onClick={() => router.push('/schedule/swap/list')}
              className="w-full p-3 rounded-2xl bg-warning-50 border border-warning-200 flex items-center gap-3 hover:bg-warning-100 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-warning-100 flex items-center justify-center">
                <ArrowRightLeft size={16} className="text-warning-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold text-warning-800">{pendingSwaps.length} yêu cầu đổi ca chờ duyệt</p>
                <p className="text-xs text-warning-500">Nhấn để xem chi tiết</p>
              </div>
              <ChevronRight size={16} className="text-warning-400" />
            </button>
          )
        })()}

        {/* ─── Open shift claims badge ─── */}
        {(() => {
          const pendingClaims = getPendingClaimsForStore(selectedStoreId)
          if (pendingClaims.length === 0) return null
          return (
            <button onClick={() => router.push('/schedule/open-shifts/claims')}
              className="w-full p-3 rounded-2xl bg-primary-50 border border-primary-200 flex items-center gap-3 hover:bg-primary-100 transition-colors">
              <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center">
                <Users size={16} className="text-primary-600" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold text-primary-800">{pendingClaims.length} yêu cầu nhận ca trống chờ duyệt</p>
                <p className="text-xs text-primary-400">Nhấn để xem chi tiết</p>
              </div>
              <ChevronRight size={16} className="text-primary-400" />
            </button>
          )
        })()}

        {/* ─── Schedule Warnings Badge ─── */}
        {(() => {
          const weekWarns = scanWeekWarnings(selectedStoreId, weekDates, schedules)
          if (weekWarns.length === 0) return null
          const blockCnt = weekWarns.filter(w => w.warning_level === 'block').length
          return (
            <button onClick={() => router.push(`/schedule/warnings?weekStart=${weekDates[0]}`)}
              className={`w-full p-3 rounded-2xl border flex items-center gap-3 hover:opacity-90 transition-colors ${
                blockCnt > 0 ? 'bg-error-50 border-error-200' : 'bg-warning-50 border-warning-200'
              }`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${blockCnt > 0 ? 'bg-error-100' : 'bg-warning-100'}`}>
                {blockCnt > 0 ? <ShieldAlert size={16} className="text-error-600" /> : <AlertTriangle size={16} className="text-warning-600" />}
              </div>
              <div className="flex-1 text-left">
                <p className={`text-xs font-bold ${blockCnt > 0 ? 'text-error-800' : 'text-warning-800'}`}>
                  {weekWarns.length} cảnh báo xếp ca {blockCnt > 0 ? `(${blockCnt} chặn)` : ''}
                </p>
                <p className={`text-xs ${blockCnt > 0 ? 'text-error-500' : 'text-warning-500'}`}>Nhấn để xem chi tiết</p>
              </div>
              <ChevronRight size={16} className={blockCnt > 0 ? 'text-error-400' : 'text-warning-400'} />
            </button>
          )
        })()}

        {/* ─── Staffing + Cost Dashboard ─── */}
        {(viewMode === 'staff' || viewMode === 'both') && staffingSummary && (
          <div className="p-3 rounded-2xl border flex items-center gap-3" style={{
            background: staffingSummary.shortage > 0 ? '#FFF8E8' : '#d1fae5',
            borderColor: staffingSummary.shortage > 0 ? '#fde68a' : '#a7f3d0',
          }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{
              background: staffingSummary.shortage > 0 ? '#fde68a' : '#a7f3d0',
            }}>👥</div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: staffColor(staffingSummary.totalRequired, staffingSummary.totalAssigned) }}>
                  {staffingSummary.totalAssigned}/{staffingSummary.totalRequired} người
                </span>
                {staffingSummary.shortage > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: '#FFF8E8', color: '#92400e' }}>
                    Thiếu {staffingSummary.shortage}
                  </span>
                )}
              </div>
              {staffingSummary.shortage > 0 && (
                <p className="text-xs mt-0.5" style={{ color: '#92400e' }}>
                  {staffingSummary.daily.filter(d => d.totalAssigned < d.totalRequired).slice(0, 2).map(d => {
                    const dt = new Date(d.date + 'T00:00:00')
                    return `${['CN','T2','T3','T4','T5','T6','T7'][dt.getDay()]} thiếu ${d.totalRequired - d.totalAssigned}`
                  }).join(', ')}
                </p>
              )}
            </div>
          </div>
        )}

        {(viewMode === 'cost' || viewMode === 'both') && costSummary && laborCostSettings.show_cost_on_schedule && (
          <div className="p-3 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm" style={{
                background: costPctColor(costSummary.percent) + '20',
              }}>💰</div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold" style={{ color: costPctColor(costSummary.percent) }}>
                    {fmt(costSummary.totalCost)} / {fmt(costSummary.budget)}
                  </span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{
                    background: costPctColor(costSummary.percent) + '20',
                    color: costPctColor(costSummary.percent),
                  }}>{costSummary.percent}%</span>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {costSummary.remaining >= 0 ? `Còn ${fmt(costSummary.remaining)}` : `Vượt ${fmt(Math.abs(costSummary.remaining))}`}
                  {' · '}{costSummary.totalHours}h giờ công
                </p>
              </div>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: 'var(--gray-100)' }}>
              <div className="h-2 rounded-full transition-all duration-500" style={{
                width: `${Math.min(costSummary.percent, 100)}%`,
                background: costPctColor(costSummary.percent),
              }} />
            </div>
          </div>
        )}

        {/* View mode toggle */}
        <div className="flex gap-1 p-0.5 rounded-xl" style={{ background: 'var(--gray-100)' }}>
          {[
            { key: 'staff' as const, label: '👥 Nhân sự' },
            { key: 'cost' as const, label: '💰 Chi phí' },
            { key: 'both' as const, label: '📊 Cả hai' },
          ].map(v => (
            <button key={v.key}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: viewMode === v.key ? '#fff' : 'transparent',
                color: viewMode === v.key ? 'var(--primary)' : 'var(--text-muted)',
                boxShadow: viewMode === v.key ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
              onClick={() => setViewMode(v.key)}>
              {v.label}
            </button>
          ))}
        </div>

        {/* ─── Week Navigation ─── */}
        <div className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl p-2 shadow-sm">
          <button onClick={() => setWeekOffset(w => w - 1)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100">
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <span className="font-bold text-sm text-dark-700">{formatWeekRange(weekDates)}</span>
          <button onClick={() => setWeekOffset(w => w + 1)} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100">
            <ChevronRight size={20} className="text-gray-500" />
          </button>
        </div>

        {/* ─── Schedule Grid ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Scrollable container */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-xs">
              {/* Day headers */}
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-2 pl-3 w-[140px] text-gray-500 font-bold sticky left-0 bg-gray-50 z-10">Nhân viên</th>
                  {weekDates.map((date) => {
                    const d = new Date(date)
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6
                    const isToday = date === format(new Date(), 'yyyy-MM-dd')
                    const dayStaff = staffingSummary?.daily.find(ds => ds.date === date)
                    const dayCost = costSummary?.daily.find(dc => dc.date === date)
                    return (
                      <th key={date} className={`text-center p-2 w-[80px] ${isToday ? 'bg-primary-50 text-primary-700' : isWeekend ? 'text-gray-400' : 'text-gray-600'} font-bold`}>
                        <div>{['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][d.getDay()]}</div>
                        <div className="text-xs font-normal">{format(d, 'dd/MM')}</div>
                        {viewMode !== 'cost' && dayStaff && (
                          <div className="text-[9px] font-bold mt-0.5 cursor-pointer" style={{ color: staffColor(dayStaff.totalRequired, dayStaff.totalAssigned) }}
                            onClick={() => setShowStaffingDetail(showStaffingDetail === date ? null : date)}>
                            {dayStaff.totalAssigned}/{dayStaff.totalRequired}
                          </div>
                        )}
                        {viewMode !== 'staff' && dayCost && laborCostSettings.show_cost_on_schedule && (
                          <div className="text-[8px] font-medium mt-0.5" style={{ color: 'var(--text-muted)' }}>
                            {fmt(dayCost.totalCost)}
                          </div>
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {employees.map(emp => {
                  const pos = getPositionById(emp.position_id)
                  return (
                    <tr key={emp.id} className="border-t border-gray-50 hover:bg-gray-50/50">
                      {/* Employee name */}
                      <td className="p-2 pl-3 sticky left-0 bg-white z-10">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-xs font-bold shrink-0">
                            {emp.full_name.split(' ').pop()?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-dark-700 truncate text-xs">{emp.full_name.split(' ').slice(-2).join(' ')}</p>
                            {(() => {
                              const hrs = getEmployeeWeeklyHours(emp.id, weekDates, schedules)
                              const hrsColor = hrs > 48 ? 'text-error-500' : hrs > 40 ? 'text-warning-500' : 'text-gray-400'
                              const rate = laborCostSettings.show_hourly_rate ? getHourlyRate(emp.id) : 0
                              return (
                                <p className={`text-[9px] ${hrsColor}`}>
                                  {pos?.name} • {hrs}h
                                  {rate > 0 && <span className="text-gray-300 ml-1">({(rate/1000).toFixed(0)}k/h)</span>}
                                </p>
                              )
                            })()}
                          </div>
                        </div>
                      </td>

                      {/* Day cells */}
                      {weekDates.map(date => {
                        const schedule = getScheduleCell(emp.id, date)
                        const shift = schedule ? getShiftById(schedule.shift_id) : null
                        const leave = isOnLeave(emp.id, date)
                        const d = new Date(date)
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6

                        return (
                          <td key={date} className="p-1 text-center">
                            <button
                              onClick={() => handleCellClick(emp.id, date)}
                              className={`w-full py-2 px-1 rounded-lg text-xs font-bold transition-all ${
                                leave
                                  ? 'bg-error-50 text-error-500 border border-error-200'
                                  : shift
                                  ? 'border border-transparent hover:shadow-sm'
                                  : 'bg-gray-50 text-gray-300 hover:bg-gray-100 hover:text-gray-400 border border-dashed border-gray-200'
                              }`}
                              style={shift ? { backgroundColor: `${shift.color}15`, color: shift.color, borderColor: `${shift.color}30` } : undefined}
                            >
                              {leave ? 'NP' : shift ? shift.name.replace('Ca ', '') : isWeekend ? '—' : '+'}
                            </button>
                            {/* Preference indicator */}
                            {showPrefs && !leave && (() => {
                              const pref = getPref(emp.id, date)
                              if (!pref) return null
                              if (pref.not_available) return (
                                <div className="flex justify-center mt-0.5" title={`Không thể làm${pref.reason ? ': ' + pref.reason : ''}`}>
                                  <div className="w-1.5 h-1.5 rounded-full bg-error-400" />
                                </div>
                              )
                              const dots = getPrefDots(pref, selectedStoreId)
                              if (dots.length === 0) return null
                              return (
                                <div className="flex justify-center gap-0.5 mt-0.5">
                                  {dots.map((d, di) => (
                                    <div key={di} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} title={d.title} />
                                  ))}
                                </div>
                              )
                            })()}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                {/* ─── Open Shifts Row ─── */}
                {(() => {
                  const weekOS = getOpenShiftsByStoreWeek(selectedStoreId, weekDates)
                  if (weekOS.length === 0) return null
                  return (
                    <tr className="border-t-2 border-warning-200 bg-warning-50/50">
                      <td className="p-2 pl-3 text-xs font-bold text-warning-700 sticky left-0 bg-warning-50 z-10 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Briefcase size={12} className="text-warning-500" />
                          Ca trống
                        </div>
                      </td>
                      {weekDates.map(date => {
                        const dayOS = weekOS.filter(os => os.date === date)
                        if (dayOS.length === 0) return (
                          <td key={date} className="p-1">
                            <button onClick={() => { setShowCreateOS({ date }); setOsShift('shift-001'); setOsPosition('pos-001'); setOsSlots(1); setOsNote(''); setOsAutoApprove(false) }}
                              className="w-full py-2 px-1 rounded-lg text-xs text-warning-300 hover:bg-warning-100 hover:text-warning-500 border border-dashed border-warning-200 transition-all">
                              +
                            </button>
                          </td>
                        )
                        return (
                          <td key={date} className="p-1">
                            <div className="space-y-1">
                              {dayOS.map(os => {
                                const shift = getShiftById(os.shift_id)
                                const remaining = os.slots_needed - os.slots_filled
                                const stateMeta = getOpenShiftStateMeta(os)
                                const openShiftTone = os.status === 'filled'
                                  ? 'bg-success-50 text-success-600 border-success-200'
                                  : os.status === 'cancelled'
                                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                                    : 'bg-warning-100 text-warning-700 border-warning-300 hover:bg-warning-200'
                                return (
                                  <div key={os.id}
                                    className={`py-1.5 px-1 rounded-lg text-[9px] font-bold text-center border transition-all ${openShiftTone} ${
                                      os.status === 'open' ? 'cursor-pointer' : 'cursor-default'
                                    }`}
                                    onClick={() => {
                                      if (os.status === 'open') {
                                        setShowCreateOS({ date })
                                        setOsShift(os.shift_id)
                                        setOsPosition(os.position_id)
                                        setOsSlots(os.slots_needed)
                                        setOsNote(os.note)
                                        setOsAutoApprove(os.auto_approve)
                                      }
                                    }}
                                    title={os.note ? `${os.note} | ${stateMeta.detail}` : stateMeta.detail}>
                                    <div className="flex items-start justify-between gap-1">
                                      <div className="min-w-0 text-left">
                                        <div style={{ color: shift?.color }}>{shift?.name?.replace('Ca ', '') || '?'}</div>
                                        <div className="text-[8px] font-medium leading-tight">{stateMeta.label}</div>
                                      </div>
                                      {os.status === 'open' && (
                                        <button
                                          type="button"
                                          onClick={event => {
                                            event.stopPropagation()
                                            handleCancelOpenShift(os.id)
                                          }}
                                          className="rounded-md border border-error-200 bg-white/80 px-1.5 py-0.5 text-[8px] font-bold text-error-600 hover:bg-error-50"
                                          title="Huy ca trong"
                                        >
                                          Huy
                                        </button>
                                      )}
                                    </div>
                                    <div className="mt-1">
                                      {os.status === 'filled'
                                        ? 'Du nguoi'
                                        : os.status === 'cancelled'
                                          ? 'Da huy'
                                          : `${remaining}/${os.slots_needed}`}
                                    </div>
                                  </div>
                                )
                              })}
                              <button onClick={() => { setShowCreateOS({ date }); setOsShift('shift-001'); setOsPosition('pos-001'); setOsSlots(1); setOsNote(''); setOsAutoApprove(false) }}
                                className="w-full py-0.5 text-[9px] text-warning-300 hover:text-warning-500 transition-colors">+</button>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })()}

                {/* Summary row */}
                <tr className="border-t-2 border-gray-200 bg-gray-50">
                  <td className="p-2 pl-3 text-xs font-bold text-gray-500 sticky left-0 bg-gray-50 z-10">Tổng</td>
                  {weekDates.map((date, i) => (
                    <td key={date} className="p-2 text-center">
                      <div className="space-y-0.5">
                        {mockShifts.map(s => (
                          <div key={s.id} className="text-[9px] flex items-center justify-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                            <span className="text-gray-500">{daySummary[i]?.[s.id] || 0}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Week Stats ─── */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-primary-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-primary-700">{totalAssigned}</p>
            <p className="text-xs text-gray-500">Ca đã xếp</p>
          </div>
          <div className="bg-warning-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-warning-700">{Math.round(totalHours)}</p>
            <p className="text-xs text-gray-500">Giờ công</p>
          </div>
          <div className="bg-error-50 rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-error-500">{unassigned}</p>
            <p className="text-xs text-gray-500">Chưa có ca</p>
          </div>
        </div>
      </div>

      {/* ─── Edit Cell Bottom Sheet ─── */}
      {editCell && (
        <>
          <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm z-50" onClick={() => setEditCell(null)} />
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-[32px] p-6 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-slide-up max-w-[500px] mx-auto">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />

            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-xs text-gray-400">
                  {(() => { const d = new Date(editCell.date); return format(d, 'EEEE, dd/MM', { locale: vi }) })()}
                </p>
                <h2 className="text-lg font-bold text-dark-700">
                  {employees.find(e => e.id === editCell.empId)?.full_name}
                </h2>
              </div>
              <button onClick={() => setEditCell(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {/* Validation warnings */}
            {editShift && (() => {
              const warning = validateAssignment(editCell.empId, editCell.date, editShift)
              return warning ? (
                <div className="bg-warning-50 border border-warning-200 rounded-xl p-3 mb-4 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-warning-500 shrink-0" />
                  <p className="text-xs text-warning-700">{warning}</p>
                </div>
              ) : null
            })()}

            {/* Shift selection */}
            <div className="space-y-2 mb-4">
              <p className="text-xs text-gray-500 font-medium">Chọn ca</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setEditShift('')}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    !editShift ? 'bg-gray-200 text-dark-700 ring-2 ring-gray-400' : 'bg-gray-50 text-gray-400'
                  }`}
                >
                  Không làm
                </button>
                {mockShifts.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setEditShift(s.id)}
                    className={`p-3 rounded-xl text-sm font-bold transition-all ${
                      editShift === s.id ? 'ring-2 shadow-md' : 'opacity-70'
                    }`}
                    style={editShift === s.id
                      ? { backgroundColor: `${s.color}20`, color: s.color, boxShadow: `0 2px 8px ${s.color}30` }
                      : { backgroundColor: `${s.color}10`, color: s.color }
                    }
                  >
                    {s.name}
                    <span className="block text-xs font-normal mt-0.5">{s.start_time}–{s.end_time}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="mb-5">
              <p className="text-xs text-gray-500 font-medium mb-1">Ghi chú</p>
              <input
                type="text"
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                placeholder="Tùy chọn..."
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 placeholder:text-gray-300"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => setEditCell(null)} className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-500 text-sm font-medium">Hủy</button>
              <button onClick={handleSave} className="flex-1 py-3 rounded-xl bg-primary-600 text-white text-sm font-bold shadow-md active:scale-[0.97] transition-transform">Lưu</button>
            </div>
          </div>
        </>
      )}

      {/* ─── Quick Assign Modal ─── */}
      {showQuickAssign && (
        <>
          <div className="fixed inset-0 bg-dark-900/40 backdrop-blur-sm z-50" onClick={() => setShowQuickAssign(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-[60] bg-white rounded-t-[32px] p-6 pb-10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] animate-slide-up max-w-[500px] mx-auto max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />

            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-dark-700 flex items-center gap-2"><Zap size={20} className="text-primary-600" /> Xếp ca nhanh</h2>
              <button onClick={() => setShowQuickAssign(false)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <X size={16} />
              </button>
            </div>

            {/* Employee multi-select */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 font-medium mb-2">Chọn nhân viên</p>
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                {employees.map(emp => (
                  <label key={emp.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={qaEmployees.includes(emp.id)}
                      onChange={e => {
                        if (e.target.checked) setQaEmployees(prev => [...prev, emp.id])
                        else setQaEmployees(prev => prev.filter(id => id !== emp.id))
                      }}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-sm text-dark-700">{emp.full_name}</span>
                  </label>
                ))}
              </div>
              <button onClick={() => setQaEmployees(employees.map(e => e.id))} className="text-xs text-primary-600 font-medium mt-1">Chọn tất cả</button>
            </div>

            {/* Shift */}
            <div className="mb-4">
              <p className="text-xs text-gray-500 font-medium mb-2">Chọn ca</p>
              <div className="grid grid-cols-3 gap-2">
                {mockShifts.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setQaShift(s.id)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all ${qaShift === s.id ? 'ring-2 shadow-md' : 'opacity-60'}`}
                    style={{ backgroundColor: `${s.color}15`, color: s.color }}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Pattern */}
            <div className="mb-5">
              <p className="text-xs text-gray-500 font-medium mb-2">Kiểu lặp</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'all', label: 'Tất cả ngày (T2–T6)' },
                  { value: 'even', label: 'Ngày chẵn' },
                  { value: 'odd', label: 'Ngày lẻ' },
                  { value: 'mwf', label: 'T2, T4, T6' },
                  { value: 'tts', label: 'T3, T5, T7' },
                ] .map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setQaPattern(opt.value as typeof qaPattern)}
                    className={`p-2.5 rounded-xl text-xs font-medium transition-all ${
                      qaPattern === opt.value ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300' : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleQuickAssign}
              disabled={qaEmployees.length === 0}
              className="w-full py-3 rounded-xl bg-primary-600 text-white text-sm font-bold shadow-md disabled:bg-gray-200 disabled:text-gray-400 active:scale-[0.97] transition-transform"
            >
              Áp dụng ({qaEmployees.length} nhân viên)
            </button>
          </div>
        </>
      )}

      {/* ─── Create Open Shift Modal ─── */}
      {showCreateOS && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 animate-fade-in"
          onClick={() => setShowCreateOS(null)}>
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-4 animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-dark-700">Đăng ca trống</h3>
              <span className="text-xs text-gray-400">{format(new Date(showCreateOS.date), 'dd/MM/yyyy')}</span>
            </div>

            <div className="space-y-3">
              {/* Shift select */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Ca làm</label>
                <div className="flex gap-2">
                  {mockShifts.map(s => (
                    <button key={s.id} onClick={() => setOsShift(s.id)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border ${
                        osShift === s.id ? 'ring-2 ring-offset-1' : 'border-gray-200'
                      }`}
                      style={osShift === s.id ? { backgroundColor: `${s.color}15`, color: s.color, borderColor: s.color, ['--tw-ring-color' as string]: s.color } : undefined}>
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Position */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Vị trí cần</label>
                <select value={osPosition} onChange={e => setOsPosition(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm">
                  {[{ id: 'pos-001', name: 'Pha chế' }, { id: 'pos-002', name: 'Thu ngân' }, { id: 'pos-003', name: 'Phục vụ' }].map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {/* Slots */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Số người cần</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setOsSlots(n)}
                      className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                        osSlots === n ? 'bg-primary-600 text-white shadow-sm' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}>{n}</button>
                  ))}
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="text-xs font-medium text-gray-500 block mb-1">Ghi chú (tùy chọn)</label>
                <input type="text" value={osNote} onChange={e => setOsNote(e.target.value)}
                  placeholder="VD: Thiếu người ca sáng..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm" />
              </div>

              {/* Auto approve */}
              <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={osAutoApprove} onChange={e => setOsAutoApprove(e.target.checked)}
                  className="w-4 h-4 rounded text-primary-600" />
                <div>
                  <p className="text-xs font-bold text-dark-700">Tự động duyệt</p>
                  <p className="text-xs text-gray-400">Ai nhận trước được trước, không cần duyệt thủ công</p>
                </div>
              </label>
            </div>

            <button
              onClick={() => {
                if (!user) return
                const created = createOpenShift(selectedStoreId, osShift, showCreateOS.date, osPosition, osSlots, osNote, osAutoApprove, user.id)
                const shift = getShiftById(osShift)
                const store = getStoreById(selectedStoreId)
                const position = getPositionById(osPosition)
                notifyOpenShiftCreated({
                  openShiftId: created.id,
                  storeId: selectedStoreId,
                  storeName: store?.name || '',
                  shiftId: osShift,
                  shiftName: shift?.name || 'Ca làm',
                  startTime: shift?.start_time || '',
                  endTime: shift?.end_time || '',
                  date: showCreateOS.date,
                  positionId: osPosition,
                  positionName: position?.name || '',
                  createdByName: user.full_name,
                })
                setShowCreateOS(null)
                setRefreshKey(k => k + 1)
                setToast('\u2705 \u0110\u00e3 \u0111\u0103ng ca tr\u1ed1ng')
                setTimeout(() => setToast(null), 2000)
              }}
              className="w-full py-3 rounded-xl bg-warning-500 text-white text-sm font-bold shadow-md active:scale-[0.97] transition-transform flex items-center justify-center gap-2">
              <Briefcase size={16} /> Đăng ca trống
            </button>
          </div>
        </div>
      )}

      {/* ─── Warning Popup ─── */}
      {showWarningPopup && pendingWarnings.length > 0 && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-end justify-center animate-fade-in" onClick={() => { setShowWarningPopup(false); setPendingWarnings([]) }}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-5 space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                pendingWarnings.some(w => w.warning_level === 'block') ? 'bg-error-100' : 'bg-warning-100'
              }`}>
                {pendingWarnings.some(w => w.warning_level === 'block')
                  ? <ShieldAlert size={20} className="text-error-600" />
                  : <AlertTriangle size={20} className="text-warning-600" />
                }
              </div>
              <div>
                <h3 className="text-base font-bold text-dark-700">Cảnh báo xếp ca</h3>
                <p className="text-xs text-gray-400">{pendingWarnings.length} vấn đề phát hiện</p>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {pendingWarnings.map((w, i) => (
                <div key={i} className={`rounded-xl p-3 border ${
                  w.warning_level === 'block' ? 'bg-error-50 border-error-200' :
                  w.warning_level === 'warning' ? 'bg-warning-50 border-warning-200' : 'bg-primary-50 border-primary-200'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                      w.warning_level === 'block' ? 'bg-error-200 text-error-700' :
                      w.warning_level === 'warning' ? 'bg-warning-200 text-warning-700' : 'bg-primary-200 text-primary-700'
                    }`}>
                      {w.warning_level === 'block' ? 'CHẶN' : w.warning_level === 'warning' ? 'CẢNH BÁO' : 'THÔNG TIN'}
                    </span>
                  </div>
                  <p className="text-xs text-dark-700">{w.message}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button onClick={() => { setShowWarningPopup(false); setPendingWarnings([]) }}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium active:scale-[0.97] transition-transform">
                Hủy
              </button>
              {!pendingWarnings.some(w => w.warning_level === 'block') && (
                <button onClick={handleForceAssign}
                  className="flex-1 py-3 rounded-xl bg-warning-500 text-white text-sm font-bold shadow-sm active:scale-[0.97] transition-transform flex items-center justify-center gap-2">
                  <AlertTriangle size={14} /> Vẫn xếp ca
                </button>
              )}
              {pendingWarnings.some(w => w.warning_level === 'block') && (
                <div className="flex-1 py-3 rounded-xl bg-error-100 text-error-500 text-sm font-bold text-center flex items-center justify-center gap-2">
                  <ShieldAlert size={14} /> Không thể xếp
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-dark-700 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}
    </AppShell>
  )
}
