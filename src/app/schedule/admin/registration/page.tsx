'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import AppShell from '@/components/layout/AppShell'
import { 
  Calendar, Clock, Save, Plus, ArrowRight, ShieldAlert,
  CheckCircle2, Edit2, Users
} from 'lucide-react'
import {
  RegistrationWeek,
  ShiftQuota,
  getRegistrationWeeks,
  createOrUpdateRegistrationWeek,
  getShiftQuotas,
  saveShiftQuotas,
  updateRegistrationStatus,
  formatDateString,
  getMondayOfDate
} from '@/lib/mock-data-registration-weeks'
import { mockShifts } from '@/lib/mock-data'
import { toast } from 'sonner'

const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật']

function buildDefaultQuotaMap() {
  const initialQuotas: Record<string, { min: number; max: number }> = {}

  mockShifts.forEach(shift => {
    for (let i = 0; i < 7; i++) {
      initialQuotas[`${shift.id}_${i}`] = { min: 1, max: 2 }
    }
  })

  return initialQuotas
}

export default function AdminRegistrationPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  // State
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list')
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Create/Edit form states
  const [editingWeek, setEditingWeek] = useState<RegistrationWeek | null>(null)
  const [targetMonday, setTargetMonday] = useState('')
  const [openDate, setOpenDate] = useState('')
  const [deadlineDate, setDeadlineDate] = useState('')
  const [deadlineTime, setDeadlineTime] = useState('23:59')
  const [quotas, setQuotas] = useState<Record<string, { min: number; max: number }>>({})

  // Authentication & Authorization check
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
      return
    }
  }, [isAuthenticated, router])

  const storeId = user?.store_id || 'store-001'
  const weeks = useMemo(() => {
    void refreshKey
    return user ? getRegistrationWeeks(storeId) : []
  }, [user, storeId, refreshKey])

  const prepareCreateForm = () => {
    const today = new Date()
    const nextMon = getMondayOfDate(today)
    nextMon.setDate(nextMon.getDate() + 7)

    setEditingWeek(null)
    setTargetMonday(formatDateString(nextMon))
    setOpenDate(formatDateString(today))

    const thisFri = getMondayOfDate(today)
    thisFri.setDate(thisFri.getDate() + 4)
    setDeadlineDate(formatDateString(thisFri))
    setDeadlineTime('23:59')
    setQuotas(buildDefaultQuotaMap())
    setActiveTab('create')
  }

  // Handle edit mode loading
  const startEdit = (week: RegistrationWeek) => {
    setEditingWeek(week)
    setTargetMonday(week.week_start_date)
    setOpenDate(week.registration_open_date)
    
    const [dlDate, dlTime] = week.registration_deadline.split('T')
    setDeadlineDate(dlDate)
    setDeadlineTime(dlTime || '23:59')

    // Fetch existing quotas
    const existingQuotas = getShiftQuotas(week.id)
    const initialQuotas = buildDefaultQuotaMap()

    // Populate existing
    existingQuotas.forEach(q => {
      const qDate = new Date(q.date)
      const mon = new Date(week.week_start_date)
      const dayIndex = Math.round((qDate.getTime() - mon.getTime()) / (1000 * 60 * 60 * 24))
      if (dayIndex >= 0 && dayIndex < 7) {
        initialQuotas[`${q.shift_id}_${dayIndex}`] = { min: q.min_staff, max: q.max_staff }
      }
    })

    setQuotas(initialQuotas)
    setActiveTab('create')
  }

  if (!user || user.role === 'employee') {
    return (
      <AppShell title="Cấu hình đăng ký ca">
        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
          <ShieldAlert size={48} className="text-error-500 mb-4" />
          <p className="font-bold text-lg">Không có quyền truy cập</p>
          <p className="text-sm">Trang này dành riêng cho Admin và Cửa hàng trưởng.</p>
        </div>
      </AppShell>
    )
  }

  // Quota handlers
  const handleQuotaChange = (shiftId: string, dayIndex: number, field: 'min' | 'max', val: number) => {
    const key = `${shiftId}_${dayIndex}`
    setQuotas(prev => {
      const current = prev[key] || { min: 1, max: 2 }
      const newVal = Math.max(0, val)
      
      // Ensure min <= max
      let nextMin = current.min
      let nextMax = current.max
      
      if (field === 'min') {
        nextMin = newVal
        if (nextMin > nextMax) nextMax = nextMin
      } else {
        nextMax = newVal
        if (nextMax < nextMin) nextMin = nextMax
      }

      return {
        ...prev,
        [key]: { min: nextMin, max: nextMax }
      }
    })
  }

  // Form submit handler
  const handleSave = (status: RegistrationWeek['status']) => {
    if (!targetMonday) {
      toast.error('Vui lòng chọn tuần xếp lịch')
      return
    }

    try {
      const savedWeek = createOrUpdateRegistrationWeek({
        id: editingWeek?.id,
        org_id: 'org-001',
        store_id: storeId,
        week_start_date: targetMonday,
        status,
        registration_open_date: openDate,
        registration_deadline: `${deadlineDate}T${deadlineTime}`,
        created_by: user.id
      })

      // Convert quota matrix back to array
      const quotaArray: Omit<ShiftQuota, 'id'>[] = []
      const mon = new Date(targetMonday)
      
      mockShifts.forEach(shift => {
        for (let i = 0; i < 7; i++) {
          const quotaDate = new Date(mon)
          quotaDate.setDate(mon.getDate() + i)
          const key = `${shift.id}_${i}`
          const qVal = quotas[key] || { min: 1, max: 2 }
          quotaArray.push({
            registration_week_id: savedWeek.id,
            shift_id: shift.id,
            date: formatDateString(quotaDate),
            min_staff: qVal.min,
            max_staff: qVal.max,
            notes: ''
          })
        }
      })

      saveShiftQuotas(savedWeek.id, quotaArray)
      toast.success(
        status === 'open' ? 'Đã mở cổng đăng ký ca thành công' : 'Đã lưu nháp cấu hình thành công',
        {
          description:
            status === 'open'
              ? `Nhân viên đã có thể bắt đầu đăng ký nguyện vọng cho tuần ${targetMonday}.`
              : `Cấu hình tuần ${targetMonday} đã được lưu ở trạng thái nháp.`,
        }
      )
      
      // Reset & go back
      setEditingWeek(null)
      setActiveTab('list')
      setRefreshKey(key => key + 1)
    } catch (e: unknown) {
      const errorMessage = e instanceof Error ? e.message : 'Không thể lưu cấu hình đăng ký ca.'
      toast.error('Lưu cấu hình thất bại', {
        description: errorMessage,
      })
    }
  }

  const getStatusBadge = (status: RegistrationWeek['status']) => {
    switch (status) {
      case 'closed':
        return <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-bold border border-gray-200">Nháp (Đóng)</span>
      case 'open':
        return <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-bold border border-emerald-100 animate-pulse">Đang đăng ký</span>
      case 'reviewing':
        return <span className="bg-warning-50 text-warning-600 px-2.5 py-1 rounded-full text-xs font-bold border border-warning-100">Đang sắp xếp ca</span>
      case 'published':
        return <span className="bg-primary-50 text-primary-600 px-2.5 py-1 rounded-full text-xs font-bold border border-primary-100">Đã xuất bản lịch</span>
    }
  }

  return (
    <AppShell showNav>
      <div className="space-y-5 animate-fade-in pb-20">
        
        {/* ─── Header ─── */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-800 tracking-tight">Kỳ đăng ký ca hàng tuần</h1>
            <p className="text-xs text-gray-400 mt-0.5">Mở đợt đăng ký nguyện vọng và cấu hình chỉ tiêu cho nhân viên</p>
          </div>
          {activeTab === 'list' && (
            <button
              onClick={prepareCreateForm}
              className="bg-primary-600 text-white flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold hover:bg-primary-700 transition-all shadow-[0_4px_12px_rgba(59,130,246,0.2)] hover:translate-y-[-1px]"
            >
              <Plus size={16} /> Tạo kỳ đăng ký mới
            </button>
          )}
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
            onClick={() => { setActiveTab('list') }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'list' 
                ? 'bg-white text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.06)]' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Cấu hình mở ca
          </button>
          <button
            onClick={() => router.push('/schedule/admin/review')}
            className="flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all text-gray-500 hover:text-gray-700"
          >
            Duyệt ca & Sắp xếp
          </button>
        </div>

        {/* ─── LIST TAB ─── */}
        {activeTab === 'list' && (
          <div className="space-y-4">
            {weeks.length === 0 ? (
              <div className="bg-white rounded-3xl p-10 text-center border border-gray-100 shadow-[var(--shadow-card)] flex flex-col items-center">
                <Calendar size={48} className="text-gray-300 mb-3" />
                <p className="font-bold text-gray-700 text-sm">Chưa cấu hình đợt đăng ký nào</p>
                <p className="text-xs text-gray-400 mt-1">Bấm nút &quot;Tạo kỳ đăng ký mới&quot; ở góc trên bên phải để bắt đầu.</p>
              </div>
            ) : (
              weeks.map(week => (
                <div 
                  key={week.id}
                  className="bg-white border border-gray-100 rounded-3xl p-5 shadow-[var(--shadow-card)] hover:shadow-md transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-base text-gray-800">Tuần làm việc: {week.week_start_date}</span>
                      {getStatusBadge(week.status)}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-gray-400" />
                        <span>Mở từ: {week.registration_open_date}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock size={14} className="text-error-400" />
                        <span className="font-semibold text-error-600">Hạn chót: {week.registration_deadline.replace('T', ' ')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    {week.status === 'closed' && (
                      <button
                        onClick={() => {
                          updateRegistrationStatus(week.id, 'open')
                          setRefreshKey(key => key + 1)
                        }}
                        className="bg-emerald-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-emerald-700 transition-colors flex-1 md:flex-none"
                      >
                        Mở cổng ĐK
                      </button>
                    )}
                    {week.status === 'open' && (
                      <button
                        onClick={() => {
                          updateRegistrationStatus(week.id, 'reviewing')
                          setRefreshKey(key => key + 1)
                        }}
                        className="bg-warning-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-warning-700 transition-colors flex-1 md:flex-none"
                      >
                        Đóng cổng & Review
                      </button>
                    )}
                    {week.status === 'reviewing' && (
                      <button
                        onClick={() => router.push('/schedule/admin/review')}
                        className="bg-primary-600 text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-primary-700 transition-colors flex-1 md:flex-none flex items-center justify-center gap-1"
                      >
                        Xếp lịch & Duyệt <ArrowRight size={14} />
                      </button>
                    )}
                    <button
                      onClick={() => startEdit(week)}
                      className="bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5 flex-1 md:flex-none"
                    >
                      <Edit2 size={13} /> Chỉnh sửa
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ─── CREATE/EDIT FORM TAB ─── */}
        {activeTab === 'create' && (
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-[var(--shadow-card)] space-y-6">
            <div className="flex justify-between items-center pb-4 border-b border-gray-100">
              <h2 className="font-extrabold text-base text-gray-800">
                {editingWeek ? 'Cập nhật đợt đăng ký' : 'Tạo đợt đăng ký ca mới'}
              </h2>
              <button 
                onClick={() => { setEditingWeek(null); setActiveTab('list') }}
                className="text-xs text-gray-400 hover:text-gray-600 font-bold"
              >
                Hủy bỏ
              </button>
            </div>

            {/* Basic setup fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block">Tuần xếp lịch (Chọn ngày T2):</label>
                <input 
                  type="date"
                  value={targetMonday}
                  onChange={(e) => setTargetMonday(e.target.value)}
                  className="w-full text-xs font-semibold p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block">Ngày mở cổng đăng ký:</label>
                <input 
                  type="date"
                  value={openDate}
                  onChange={(e) => setOpenDate(e.target.value)}
                  className="w-full text-xs font-semibold p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-600 block">Hạn đăng ký (Deadline):</label>
                <div className="flex gap-2">
                  <input 
                    type="date"
                    value={deadlineDate}
                    onChange={(e) => setDeadlineDate(e.target.value)}
                    className="flex-1 text-xs font-semibold p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                  <input 
                    type="time"
                    value={deadlineTime}
                    onChange={(e) => setDeadlineTime(e.target.value)}
                    className="w-24 text-xs font-semibold p-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Quota inputs */}
            <div className="space-y-3 pt-3">
              <div>
                <h3 className="text-sm font-extrabold text-gray-800 flex items-center gap-1.5">
                  <Users size={16} className="text-primary-500" /> Cấu hình định mức ca làm việc (Shift Quota)
                </h3>
                <p className="text-[11px] text-gray-400 mt-0.5">Đặt số lượng tối thiểu và tối đa nhân viên cần thiết cho mỗi ca trong tuần.</p>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                <table className="w-full text-left border-collapse min-w-[700px]">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-3 text-[10px] font-extrabold text-gray-500 tracking-wider">CA LÀM</th>
                      {DAY_LABELS.map((day, idx) => (
                        <th key={idx} className="p-3 text-[10px] font-extrabold text-gray-500 tracking-wider text-center">{day}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {mockShifts.map(shift => (
                      <tr key={shift.id} className="hover:bg-gray-50/50">
                        <td className="p-3 font-bold text-xs text-gray-700 min-w-[120px]">
                          <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: shift.color }} />
                          {shift.name}
                        </td>
                        {DAY_LABELS.map((_, dayIdx) => {
                          const key = `${shift.id}_${dayIdx}`
                          const q = quotas[key] || { min: 1, max: 2 }
                          return (
                            <td key={dayIdx} className="p-2">
                              <div className="flex flex-col items-center gap-1.5 bg-gray-50/50 p-2 rounded-xl border border-gray-100">
                                {/* Min staff */}
                                <div className="flex items-center justify-between w-full text-[10px] text-gray-400 gap-1">
                                  <span>Min</span>
                                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
                                    <button 
                                      type="button"
                                      onClick={() => handleQuotaChange(shift.id, dayIdx, 'min', q.min - 1)}
                                      className="w-4 h-4 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-100 rounded"
                                    >-</button>
                                    <span className="font-extrabold text-gray-800 w-3 text-center">{q.min}</span>
                                    <button 
                                      type="button"
                                      onClick={() => handleQuotaChange(shift.id, dayIdx, 'min', q.min + 1)}
                                      className="w-4 h-4 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-100 rounded"
                                    >+</button>
                                  </div>
                                </div>
                                
                                {/* Max staff */}
                                <div className="flex items-center justify-between w-full text-[10px] text-gray-400 gap-1">
                                  <span>Max</span>
                                  <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-0.5">
                                    <button 
                                      type="button"
                                      onClick={() => handleQuotaChange(shift.id, dayIdx, 'max', q.max - 1)}
                                      className="w-4 h-4 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-100 rounded"
                                    >-</button>
                                    <span className="font-extrabold text-gray-800 w-3 text-center">{q.max}</span>
                                    <button 
                                      type="button"
                                      onClick={() => handleQuotaChange(shift.id, dayIdx, 'max', q.max + 1)}
                                      className="w-4 h-4 flex items-center justify-center font-bold text-gray-500 hover:bg-gray-100 rounded"
                                    >+</button>
                                  </div>
                                </div>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Actions Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => handleSave('closed')}
                className="bg-gray-100 hover:bg-gray-250 border border-gray-200 text-gray-700 text-xs font-bold px-4 py-3 rounded-xl transition-all flex items-center gap-1.5 hover:scale-[1.01]"
              >
                <Save size={16} /> Lưu bản nháp
              </button>
              
              <button
                type="button"
                onClick={() => handleSave('open')}
                className="bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-1.5 shadow-[0_4px_12px_rgba(59,130,246,0.2)] hover:scale-[1.01]"
              >
                <CheckCircle2 size={16} /> Mở đăng ký ca ngay
              </button>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
