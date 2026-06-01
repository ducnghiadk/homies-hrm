'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import AppShell from '@/components/layout/AppShell'
import {
  Calendar, Users, Cpu, CheckCircle2, UserCheck, AlertCircle
} from 'lucide-react'
import {
  RegistrationWeek,
  ShiftQuota,
  getRegistrationWeeks,
  getShiftQuotas,
  updateRegistrationStatus,
  autoAssignFromPreferences,
  formatDateString,
} from '@/lib/mock-data-registration-weeks'
import { 
  mockEmployees, mockShifts,
  getShiftById, getSchedulesByStoreWeek, getStoreById, replaceSchedulesForStoreWeek, Schedule
} from '@/lib/mock-data'
import { getAllPreferencesForWeek, getShiftPreferenceAvailability, ShiftPreference } from '@/lib/mock-data-preferences'
import { ShiftTemplateService } from '@/lib/services/shift-template-service'
import { getInitials } from '@/lib/utils'
import { checkScheduleWarnings, scanWeekWarnings } from '@/lib/mock-data-schedule-rules'
import { toast } from 'sonner'
import { notifySchedulePublished } from '@/lib/notifications/schedule-notifications'

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật']
let manualScheduleCounter = 0

function createManualScheduleId() {
  manualScheduleCounter += 1
  return `sch-manual-${manualScheduleCounter}`
}

function AdminReviewContent() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [selectedWeekId, setSelectedWeekId] = useState<string>('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  // Modals / Dropdowns
  const [editingCell, setEditingCell] = useState<{ empId: string; date: string } | null>(null)

  // Auth check
  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  useEffect(() => {
    if (!isAuthenticated || !user || user.role === 'employee') return
    const nextSearch = searchParams.toString()
    router.replace(nextSearch ? `/schedules?${nextSearch}` : '/schedules')
  }, [isAuthenticated, router, searchParams, user])

  const storeId = user?.store_id || 'store-001'
  const weeks = useMemo<RegistrationWeek[]>(() => {
    void refreshTrigger
    return user ? getRegistrationWeeks(storeId) : []
  }, [user, storeId, refreshTrigger])
  const requestedWeekStart = searchParams.get('weekStart')
  const defaultSelectedWeekId = useMemo(() => {
    if (requestedWeekStart) {
      const exactWeek = weeks.find(w => w.week_start_date === requestedWeekStart)
      if (exactWeek) return exactWeek.id
    }
    const reviewing = weeks.find(w => w.status === 'reviewing' || w.status === 'open')
    return reviewing?.id || weeks[0]?.id || ''
  }, [requestedWeekStart, weeks])
  const effectiveWeekId = selectedWeekId || defaultSelectedWeekId

  // Get active week data
  const activeWeek = useMemo(() => {
    return weeks.find(w => w.id === effectiveWeekId)
  }, [weeks, effectiveWeekId])

  // Get date strings for the selected week
  const weekDates = useMemo(() => {
    if (!activeWeek) return []
    const dates: string[] = []
    const monday = new Date(activeWeek.week_start_date)
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      dates.push(formatDateString(d))
    }
    return dates
  }, [activeWeek])

  const quotas = useMemo<ShiftQuota[]>(
    () => (activeWeek ? getShiftQuotas(activeWeek.id) : []),
    [activeWeek]
  )
  const preferences = useMemo<ShiftPreference[]>(
    () => (activeWeek ? getAllPreferencesForWeek(activeWeek.week_start_date) : []),
    [activeWeek]
  )
  const shiftTemplates = useMemo(
    () => (activeWeek ? ShiftTemplateService.getActiveForStore(activeWeek.store_id) : []),
    [activeWeek]
  )
  const sourceSchedules = useMemo<Schedule[]>(() => {
    void refreshTrigger
    return activeWeek
      ? getSchedulesByStoreWeek(activeWeek.store_id, weekDates)
      : []
  }, [activeWeek, weekDates, refreshTrigger])
  const localSchedules = sourceSchedules

  // Filter store employees
  const storeEmployees = useMemo(() => {
    if (!user) return []
    return mockEmployees.filter(
      emp => emp.store_id === storeId && emp.role === 'employee'
    )
  }, [user, storeId])

  if (!user || user.role === 'employee') {
    return (
      <AppShell title="Duyệt đăng ký ca">
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <AlertCircle size={48} className="text-error-500 mb-4" />
          <p className="font-bold text-lg">Không có quyền truy cập</p>
          <p className="text-sm">Trang này dành riêng cho Admin và Cửa hàng trưởng.</p>
        </div>
      </AppShell>
    )
  }

  // Quick Auto Assign Handler
  const handleAutoAssign = () => {
    if (!activeWeek) return
    const confirmAssign = confirm(
      'Hệ thống sẽ tự động phân ca dựa trên nguyện vọng rảnh và định mức ca tối đa đã cấu hình. Tiếp tục?'
    )
    if (!confirmAssign) return

    const result = autoAssignFromPreferences(activeWeek.id)
    toast.success('Đã chạy xếp ca tự động', {
      description: result.message
    })
    
    // Refresh states
    setRefreshTrigger(prev => prev + 1)
  }

  // Manual Assign Shifts
  const handleManualAssign = (empId: string, date: string, shiftId: string | null) => {
    if (!activeWeek) return

    const updatedSchedules = localSchedules.filter(
      s => !(s.employee_id === empId && s.date === date)
    )

    if (shiftId) {
      const warnings = checkScheduleWarnings(empId, shiftId, date, activeWeek.store_id, updatedSchedules)
      const blockingWarnings = warnings.filter(w => w.warning_level === 'block')

      if (blockingWarnings.length > 0) {
        toast.error(`Không thể xếp ca vì có ${blockingWarnings.length} vi phạm chặn`, {
          description: blockingWarnings
            .slice(0, 3)
            .map(w => `• ${w.message}`)
            .join('\n'),
        })
        return
      }

      if (
        warnings.length > 0 &&
        !confirm(
          `Có ${warnings.length} cảnh báo cho ca này:\n- ${warnings
            .slice(0, 3)
            .map(w => w.message)
            .join('\n- ')}\n\nVẫn tiếp tục xếp ca?`
        )
      ) {
        return
      }

      const newSchedule: Schedule = {
        id: createManualScheduleId(),
        org_id: activeWeek.org_id,
        store_id: activeWeek.store_id,
        employee_id: empId,
        shift_id: shiftId,
        date,
        notes: 'Phân bổ thủ công từ Bảng duyệt ca'
      }
      
      updatedSchedules.push(newSchedule)
    }

    replaceSchedulesForStoreWeek(activeWeek.store_id, weekDates, updatedSchedules)
    setRefreshTrigger(prev => prev + 1)
    setEditingCell(null)
  }

  // Publish Weekly Schedule
  const handlePublish = () => {
    if (!activeWeek) return

    const weekWarnings = scanWeekWarnings(activeWeek.store_id, weekDates, localSchedules)
    const blockingWarnings = weekWarnings.filter(w => w.warning_level === 'block')

    if (blockingWarnings.length > 0) {
      toast.error(`Chưa thể xuất bản vì còn ${blockingWarnings.length} vi phạm chặn`, {
        description: blockingWarnings
          .slice(0, 5)
          .map(w => `• ${w.message}`)
          .join('\n'),
      })
      return
    }

    if (
      weekWarnings.length > 0 &&
      !confirm(
        `Tuần này còn ${weekWarnings.length} cảnh báo chưa xử lý.\n\nBạn vẫn muốn xuất bản lịch chính thức?`
      )
    ) {
      return
    }
    
    const confirmPub = confirm(
      'Xác nhận Xuất Bản lịch làm việc chính thức cho tuần này? Hệ thống sẽ gửi thông báo đến điện thoại của toàn bộ nhân viên.'
    )
    if (!confirmPub) return

    updateRegistrationStatus(activeWeek.id, 'published')

    notifySchedulePublished({
      userIds: storeEmployees.map(emp => emp.id),
      weekStart: weekDates[0] || activeWeek.week_start_date,
      weekEnd: weekDates[6] || activeWeek.week_start_date,
      storeId: activeWeek.store_id,
      storeName: getStoreById(activeWeek.store_id)?.name || 'cửa hàng của bạn',
      publishedByName: user.full_name,
    })

    setRefreshTrigger(prev => prev + 1)

    toast.success('Đã xuất bản lịch làm việc tuần', {
      description: 'Thông báo đã được gửi tới toàn bộ nhân viên của cửa hàng.',
    })
  }

  // Matrix calculation helpers
  const getCellData = (empId: string, date: string) => {
    const pref = preferences.find(p => p.user_id === empId && p.date === date)
    const currentAssignments = localSchedules.filter(s => s.employee_id === empId && s.date === date)
    
    return { pref, assignments: currentAssignments }
  }

  // Staffing summary calculator
  const getStaffingStats = (date: string, shiftId: string) => {
    const assignedCount = localSchedules.filter(s => s.date === date && s.shift_id === shiftId).length
    const quota = quotas.find(q => q.date === date && q.shift_id === shiftId) || { min_staff: 1, max_staff: 2 }
    
    let statusColor = 'text-error-500'
    let progressBg = 'bg-error-500'
    let text = 'Thiếu'

    if (assignedCount >= quota.min_staff && assignedCount <= quota.max_staff) {
      statusColor = 'text-emerald-600'
      progressBg = 'bg-emerald-500'
      text = 'Đủ'
    } else if (assignedCount > quota.max_staff) {
      statusColor = 'text-primary-600'
      progressBg = 'bg-primary-500'
      text = 'Thừa'
    } else if (assignedCount > 0 && assignedCount < quota.min_staff) {
      statusColor = 'text-warning-500'
      progressBg = 'bg-warning-500'
      text = 'Cần thêm'
    }

    return { assignedCount, min: quota.min_staff, max: quota.max_staff, statusColor, progressBg, text }
  }

  return (
    <AppShell showNav>
      <div className="space-y-5 animate-fade-in pb-24">
        
        {/* ─── Header ─── */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Duyệt & Sắp xếp ca rảnh</h1>
            <p className="text-xs text-gray-400 mt-0.5">Đối soát nguyện vọng, xếp lịch nháp tự động và xuất bản lịch làm</p>
          </div>
          
          {/* Week Selector Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">Đợt xếp:</span>
            <select
              value={effectiveWeekId}
              onChange={(e) => setSelectedWeekId(e.target.value)}
              className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold focus:ring-1 focus:ring-primary-500 focus:outline-none"
            >
              <option value="" disabled>-- Chọn tuần --</option>
              {weeks.map(w => (
                <option key={w.id} value={w.id}>Tuần {w.week_start_date} ({w.status.toUpperCase()})</option>
              ))}
            </select>
          </div>
        </div>

        {/* ─── Segment Navigation Bar ─── */}
        <div className="flex bg-gray-100 p-1 rounded-2xl gap-1 w-full border border-gray-200/50">
          <button
            onClick={() => router.push('/schedule/manage')}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-gray-500 hover:text-gray-700"
          >
            Quản lý phân ca
          </button>
          <button
            onClick={() => router.push('/schedule/admin/registration')}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-gray-500 hover:text-gray-700"
          >
            Cấu hình mở ca
          </button>
          <button
            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all bg-white text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
          >
            Duyệt ca & Sắp xếp
          </button>
        </div>

        {/* ─── Active Week Info Board ─── */}
        {activeWeek ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[var(--shadow-card)] flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="font-extrabold text-sm text-gray-800">Trạng thái đợt xếp ca:</span>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full capitalize ${
                  activeWeek.status === 'published' 
                    ? 'bg-primary-50 text-primary-600 border border-primary-200' 
                    : activeWeek.status === 'reviewing' 
                    ? 'bg-warning-50 text-warning-600 border border-warning-200' 
                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                }`}>
                  {activeWeek.status === 'open' ? 'Đang nhận ĐK ca' : activeWeek.status === 'reviewing' ? 'Đang sắp xếp lịch' : 'Đã xuất bản lịch'}
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Nhân viên đã gửi nguyện vọng rảnh của họ. Bạn có thể sử dụng Trí Tuệ Nhân Tạo Xếp Lịch hoặc gán thủ công.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {activeWeek.status !== 'published' && (
                <>
                  <button
                    onClick={handleAutoAssign}
                    className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(139,92,246,0.2)] flex items-center gap-1.5 active:scale-95"
                  >
                    <Cpu size={14} /> Xếp ca tự động
                  </button>
                  <button
                    onClick={handlePublish}
                    className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-[0_4px_12px_rgba(59,130,246,0.2)] flex items-center gap-1.5 active:scale-95"
                  >
                    <CheckCircle2 size={14} /> Xuất bản lịch
                  </button>
                </>
              )}
              {activeWeek.status === 'published' && (
                <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 p-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <UserCheck size={14} /> Lịch đã hoàn thành & gửi đi.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-[var(--shadow-card)]">
            <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="font-bold text-gray-700 text-sm">Chưa chọn tuần xếp lịch hoặc không tìm thấy cấu hình</p>
            <p className="text-xs text-gray-400 mt-1">Vui lòng tạo kỳ đăng ký ca mới bên tab &quot;Cấu hình mở ca&quot;.</p>
          </div>
        )}

        {/* ─── Matrix Board Grid ─── */}
        {activeWeek && weekDates.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-3xl shadow-[var(--shadow-card)] overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <span className="text-xs font-extrabold text-gray-700 flex items-center gap-1.5">
                <Users size={15} className="text-primary-500" /> Bảng so khớp & Duyệt phân ca
              </span>
              <span className="text-[10px] text-gray-400 font-bold">Bấm vào ô ca để sửa nhanh lịch làm</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[850px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/20">
                    <th className="p-3 text-[10px] font-extrabold text-gray-500 tracking-wider w-[180px]">NHÂN VIÊN</th>
                    {DAY_LABELS.map((day, idx) => (
                      <th key={idx} className="p-3 text-[10px] font-extrabold text-gray-500 tracking-wider text-center">
                        <span className="block">{day}</span>
                        <span className="block text-[8px] text-gray-400 font-semibold mt-0.5">{weekDates[idx].split('-').slice(1).reverse().join('/')}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {storeEmployees.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50/30">
                      {/* Employee details info */}
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-extrabold text-xs">
                            {getInitials(emp.full_name)}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800 line-clamp-1">{emp.full_name}</p>
                            <p className="text-[9px] text-gray-400 font-bold mt-0.5">Pha chế</p>
                          </div>
                        </div>
                      </td>

                      {/* Day cells matching preference vs assignment */}
                      {weekDates.map((date) => {
                        const { pref, assignments } = getCellData(emp.id, date)
                        const isEditing = editingCell?.empId === emp.id && editingCell?.date === date

                        return (
                          <td key={date} className="p-2 text-center relative">
                            {isEditing ? (
                              /* Quick manual assign popup overlay dropdown */
                              <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-white border border-gray-200 rounded-xl p-1.5 shadow-xl flex flex-col gap-1 w-28 text-left animate-scale-up">
                                {shiftTemplates.map(template => (
                                  <button
                                    key={template.id}
                                    onClick={() => handleManualAssign(emp.id, date, template.id)}
                                    className="text-[10px] font-bold p-1 hover:bg-gray-50 rounded flex items-center justify-between"
                                    style={{ color: template.color }}
                                  >
                                    {template.name}
                                  </button>
                                ))}
                                <hr className="my-0.5 border-gray-100" />
                                <button
                                  onClick={() => handleManualAssign(emp.id, date, null)}
                                  className="text-[10px] font-bold p-1 hover:bg-error-50 rounded text-error-500"
                                >
                                  Nghỉ/Gỡ ca
                                </button>
                                <button
                                  onClick={() => setEditingCell(null)}
                                  className="text-[9px] text-gray-400 p-0.5 text-center mt-0.5 font-bold hover:text-gray-600"
                                >
                                  Hủy
                                </button>
                              </div>
                            ) : (
                              <div 
                                onClick={() => activeWeek.status !== 'published' && setEditingCell({ empId: emp.id, date })}
                                className={`min-h-[58px] p-1.5 rounded-2xl flex flex-col items-center justify-center border transition-all ${
                                  assignments.length > 0 
                                    ? 'border-primary-100 bg-primary-50/10' 
                                    : 'border-dashed border-gray-100 hover:border-gray-300'
                                } ${activeWeek.status !== 'published' ? 'cursor-pointer hover:shadow-sm' : 'cursor-default'}`}
                              >
                                {/* Preferences indicator in background */}
                                <div className="flex gap-0.5 mb-1.5 opacity-60">
                                  {pref?.not_available && <span className="text-[8px] bg-error-100 text-error-700 px-1 py-0.5 rounded font-extrabold">????</span>}
                                  {!pref?.not_available && pref && shiftTemplates
                                    .filter(template => getShiftPreferenceAvailability(pref, template.id))
                                    .slice(0, 3)
                                    .map(template => (
                                      <span
                                        key={template.id}
                                        className="text-[8px] px-1 py-0.5 rounded font-extrabold text-white"
                                        style={{ backgroundColor: template.color }}
                                      >
                                        {template.name.slice(0, 1).toUpperCase()}
                                      </span>
                                    ))}
                                  {!pref && <span className="text-[7px] text-gray-300 font-bold">Ch??a ??K</span>}
                                </div>

                                {/* Actual assigned badges */}
                                {assignments.map(s => {
                                  const shift = getShiftById(s.shift_id)
                                  if (!shift) return null
                                  return (
                                    <span 
                                      key={s.id}
                                      className="text-[9px] font-extrabold text-white px-2 py-0.5 rounded-lg shadow-sm line-clamp-1 w-full text-center"
                                      style={{ backgroundColor: shift.color }}
                                    >
                                      {shift.name.replace('Ca ', '')}
                                    </span>
                                  )
                                })}
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>

                {/* ─── Matrix Footer: Gap Analysis vs Staff Quota ─── */}
                <tfoot>
                  <tr className="bg-gray-50/50 border-t border-gray-100">
                    <td className="p-3 font-extrabold text-[10px] text-gray-600 align-middle">
                      <span>BIỂU ĐỒ ĐỊNH MỨC</span>
                      <span className="block text-[8px] text-gray-400 font-bold mt-0.5">Thực tế / Chỉ tiêu</span>
                    </td>
                    {weekDates.map((date) => (
                      <td key={date} className="p-2.5">
                        <div className="space-y-1.5 text-left bg-white p-2 border border-gray-100 rounded-xl shadow-[0_1px_4px_rgba(0,0,0,0.02)]">
                          {mockShifts.map(shift => {
                            const { assignedCount, max, statusColor, progressBg } = getStaffingStats(date, shift.id)
                            const fillPercent = Math.min(100, (assignedCount / max) * 100)
                            return (
                              <div key={shift.id} className="text-[9px] font-semibold">
                                <div className="flex justify-between items-center text-gray-500 mb-0.5">
                                  <span className="font-bold">{shift.name.replace('Ca ', '')}</span>
                                  <span className={`font-extrabold ${statusColor}`}>{assignedCount}/{max}</span>
                                </div>
                                {/* Small progress bar */}
                                <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                                  <div className={`${progressBg} h-full transition-all`} style={{ width: `${fillPercent}%` }} />
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}

export default function AdminReviewPage() {
  return (
    <Suspense fallback={null}>
      <AdminReviewContent />
    </Suspense>
  )
}
