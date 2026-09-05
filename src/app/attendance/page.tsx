'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { 
  mockPositions, 
  mockStores, 
  getStoresList,
  isStoreMatch,
  type Employee, 
  type Position, 
  type Store, 
  type Schedule 
} from '@/lib/mock-data'
import { EmployeeService } from '@/lib/services/employee-service'
import { ScheduleService } from '@/lib/services/schedule-service'
import { ShiftTemplateService } from '@/lib/services/scheduling/shift-template-service'
import { hasPermission } from '@/lib/rbac'
import { 
  getRememberedShiftMappings,
  saveShiftMappingMemory,
  getRememberedEmpMappings,
  saveEmpMappingMemory,
  smartResolveShiftTemplate,
  removeVietnameseTones,
  isFlexibleShiftText,
} from '@/lib/services/scheduling/shift-mapping-memory'
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Timer, 
  CalendarDays, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  Sparkles, 
  Plus, 
  X, 
  Check, 
  Calendar, 
  UserCheck, 
  AlertCircle, 
  Edit3, 
  Lock, 
  Unlock, 
  MapPin, 
  Wifi, 
  Smartphone, 
  ChevronRight as ChevronRightSmall,
  Layers,
  ArrowRightLeft,
  Users,
  UploadCloud,
  Download,
  Link as LinkIcon,
  RefreshCw,
  FileCheck2,
  HelpCircle,
  Trash2,
  Image as ImageIcon,
  CheckCheck,
  Zap,
  ArrowRight,
  Upload,
  Building2,
  Tag,
  Maximize2,
  Minimize2,
  Pencil,
  Coffee,
  Receipt,
  Sliders,
  ShieldCheck,
  Camera,
  Save,
  ExternalLink,
} from 'lucide-react'
import readXlsxFile from 'read-excel-file/browser'
import {
  buildIposAttendanceImportRecord,
  buildIposAttendanceImportSlotId,
  IPOS_ATTENDANCE_IMPORT_REASON,
  parseIposAttendanceCell,
  parseIposAttendanceWorkbook,
  splitIposAttendanceEntries,
  upsertIposAttendanceImportSlot,
  type IposAttendanceImportPreview,
  type IposWorkbookSheet,
} from '@/lib/services/attendance/ipos-attendance-importer'

// Kiểu dữ liệu ca chấm công chi tiết cho từng ô
export interface AttendanceSlot {
  id: string
  shiftName: string
  scheduledIn: string
  scheduledOut: string
  actualIn?: string
  actualOut?: string
  status: 'on_time' | 'late' | 'early' | 'missing_checkout' | 'scheduled' | 'pending' | 'leave' | 'working'
  lateMinutes?: number
  earlyMinutes?: number
  totalHours: number
  isOvertime?: boolean
  isEdited?: boolean
  editReason?: string
  editedBy?: string
  deviceInfo?: string
  wifiName?: string
  locationNoteIn?: string
  locationNoteOut?: string
  distanceInMeters?: number
  distanceOutMeters?: number
  outOfShift?: boolean
  sourceType?: 'self' | 'manager' | 'auto_sync'
  penalizeMissIn?: boolean
  penalizeMissOut?: boolean
  isFromSchedule?: boolean
}

// Kiểu dòng nhân viên trên bảng chấm công
export interface EmployeeTimesheetRow {
  employee: Employee
  position?: Position
  days: Record<string, AttendanceSlot[]>
  totalHours: number
  totalShifts: number
  onTimeCount: number
  lateCount: number
  missingCount: number
}

// Helper trích xuất ngày từ header của file Excel (dd/MM, yyyy-MM-dd...)
function extractDateFromHeader(header: string, defaultYear = 2026): string | null {
  if (!header) return null
  const clean = header.trim()

  const isoMatch = clean.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
  if (isoMatch) {
    const y = isoMatch[1]
    const m = isoMatch[2].padStart(2, '0')
    const d = isoMatch[3].padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  const dmyMatch = clean.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0')
    const m = dmyMatch[2].padStart(2, '0')
    const y = dmyMatch[3]
    return `${y}-${m}-${d}`
  }

  const dmMatch = clean.match(/(\d{1,2})[/-](\d{1,2})/)
  if (dmMatch) {
    const d = dmMatch[1].padStart(2, '0')
    const m = dmMatch[2].padStart(2, '0')
    return `${defaultYear}-${m}-${d}`
  }

  return null
}

function calculateHours(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 4.0
  const [sH, sM] = startTime.split(':').map(Number)
  const [eH, eM] = endTime.split(':').map(Number)
  if (isNaN(sH) || isNaN(eH)) return 4.0
  let diff = (eH + (eM || 0) / 60) - (sH + (sM || 0) / 60)
  if (diff <= 0) diff += 24
  return Math.round(diff * 10) / 10
}

export default function AttendanceTimesheetPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const canManageAttendance = user
    ? hasPermission(user.role, 'attendance.view_team') || hasPermission(user.role, 'attendance.view_all')
    : false

  // Bộ lọc thời gian & chi nhánh
  const [activeStoreId, setActiveStoreId] = useState<string>('store-001')
  const [selectedPositionId, setSelectedPositionId] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [weekOffset, setWeekOffset] = useState<number>(0)
  const [monthOffset, setMonthOffset] = useState<number>(0)
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week')
  const [isLocked, setIsLocked] = useState<boolean>(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0)

  // ─── STATE MODAL THÔNG TIN CÔNG (Modal Xem Chi Tiết - Ảnh 2) ───
  const [viewingWorkInfo, setViewingWorkInfo] = useState<{
    slot: AttendanceSlot
    employee: Employee
    dateStr: string
    dayLabel: string
  } | null>(null)

  // ─── STATE MODAL SỬA CÔNG (Modal Chỉnh Sửa Công - Ảnh 1) ───
  const [editingWorkInfo, setEditingWorkInfo] = useState<{
    slot: AttendanceSlot
    employee: Employee
    dateStr: string
    dayLabel: string
  } | null>(null)

  // Form sửa chấm công
  const [editShiftName, setEditShiftName] = useState<string>('Ca Tối [17:00-22:00]')
  const [editStartTime, setEditStartTime] = useState<string>('16:50')
  const [editEndTime, setEditEndTime] = useState<string>('22:02')
  const [editReason, setEditReason] = useState<string>('')
  const [penalizeMissIn, setPenalizeMissIn] = useState<boolean>(false)
  const [penalizeMissOut, setPenalizeMissOut] = useState<boolean>(false)

  // State Modal Thêm ca chấm công bù (+)
  const [addingSlotTarget, setAddingSlotTarget] = useState<{
    employee: Employee
    dateStr: string
    dayLabel: string
  } | null>(null)

  const [addShiftName, setAddShiftName] = useState('Ca Sáng')
  const [addFormIn, setAddFormIn] = useState('08:30')
  const [addFormOut, setAddFormOut] = useState('12:00')
  const [addFormReason, setAddFormReason] = useState('Bổ sung chấm công theo phê duyệt quản lý')

  // ─── STATE MODAL NHẬP EXCEL 3 BƯỚC (CHUẨN 100% NHƯ LỊCH LÀM VIỆC) ───
  const [showImportModal, setShowImportModal] = useState<boolean>(false)
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1)
  const [isModalMaximized, setIsModalMaximized] = useState<boolean>(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parsedRows, setParsedRows] = useState<string[][]>([])
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({})
  const [manualEmpMapping, setManualEmpMapping] = useState<Record<number, string>>({})
  const [editingEmpRow, setEditingEmpRow] = useState<number | null>(null)
  const [detectedWeekStart, setDetectedWeekStart] = useState<string | null>(null)
  const [dateMappingMode, setDateMappingMode] = useState<'file_date' | 'current_week'>('file_date')
  const [isImporting, setIsImporting] = useState<boolean>(false)
  const [importError, setImportError] = useState<string | null>(null)

  // Selector Chi nhánh & Tháng/Năm cho Modal Import
  const [importSelectedStoreId, setImportSelectedStoreId] = useState<string>('store-001')
  const [autoDetectedStoreName, setAutoDetectedStoreName] = useState<string | null>(null)
  const [importSelectedMonth, setImportSelectedMonth] = useState<number>(7)
  const [importSelectedYear, setImportSelectedYear] = useState<number>(2026)
  const [previewDateTab, setPreviewDateTab] = useState<'all' | '1-10' | '11-20' | '21-31'>('1-10')

  // Điều hướng phân đoạn ngày cho Bảng Chấm Công chính (View Tháng)
  const [mainMonthTab, setMainMonthTab] = useState<'all' | '1-10' | '11-20' | '21-31'>('1-10')
  const mainTableScrollRef = useRef<HTMLDivElement>(null)

  const handleScrollMainTable = (direction: 'left' | 'right') => {
    if (mainTableScrollRef.current) {
      const amt = 600
      mainTableScrollRef.current.scrollBy({
        left: direction === 'left' ? -amt : amt,
        behavior: 'smooth',
      })
    }
  }

  // ─── STATE MODAL CÀI ĐẶT QUY ĐỊNH CHẤM CÔNG (ATTENDANCE SETTINGS MODAL) ───
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false)
  const [settingsActiveTab, setSettingsActiveTab] = useState<'tolerance' | 'verification' | 'qco' | 'links'>('tolerance')

  // Cấu hình quy định chấm công thực tế
  const [attGracePeriodMinutes, setAttGracePeriodMinutes] = useState<number>(5)
  const [attEarlyCheckinMinutes, setAttEarlyCheckinMinutes] = useState<number>(30)
  const [attLateCheckoutMinutes, setAttLateCheckoutMinutes] = useState<number>(30)
  const [attRoundingMode, setAttRoundingMode] = useState<'none' | '15min' | '30min'>('none')

  const [attRequireGps, setAttRequireGps] = useState<boolean>(true)
  const [attGpsRadiusMeters, setAttGpsRadiusMeters] = useState<number>(100)
  const [attRequireWifi, setAttRequireWifi] = useState<boolean>(true)
  const [attRequirePhoto, setAttRequirePhoto] = useState<boolean>(false)

  const [attAutoQcoNotice, setAttAutoQcoNotice] = useState<boolean>(true)
  const [attAllowSelfRequest, setAttAllowSelfRequest] = useState<boolean>(true)
  const [attApprovalLevel, setAttApprovalLevel] = useState<1 | 2>(1)

  const handleSaveAttendanceSettings = () => {
    setShowSettingsModal(false)
    setToastMessage('Đã lưu cài đặt quy định chấm công thành công!')
    setTimeout(() => setToastMessage(null), 3000)
  }

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login')
    } else if (user && !canManageAttendance) {
      router.replace('/checkin')
    }
  }, [canManageAttendance, isAuthenticated, router, user])

  // Tính ngày Thứ 2 của tuần hiện tại dựa trên weekOffset
  const { weekDates, weekLabel, weekNumber, yearNumber } = useMemo(() => {
    const base = new Date(2026, 7, 17) // Mốc Thứ 2: 17/08/2026 (Tuần 34)
    base.setDate(base.getDate() + weekOffset * 7)

    const dates: { dateStr: string; dayLabel: string; shortDate: string; isToday: boolean }[] = []
    const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
    const todayIso = new Date().toISOString().split('T')[0]

    for (let i = 0; i < 7; i++) {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      const dayNum = String(d.getDate()).padStart(2, '0')
      const monthNum = String(d.getMonth() + 1).padStart(2, '0')
      const dateStr = `${d.getFullYear()}-${monthNum}-${dayNum}`
      
      dates.push({
        dateStr,
        dayLabel: `${dayNames[i]} - ${dayNum}/${monthNum}`,
        shortDate: `${dayNum}/${monthNum}`,
        isToday: dateStr === todayIso,
      })
    }

    const startStr = dates[0].shortDate
    const endStr = dates[6].shortDate
    return {
      weekDates: dates,
      weekLabel: `${startStr} - ${endStr}/${base.getFullYear()}`,
      weekNumber: 34 + weekOffset,
      yearNumber: base.getFullYear(),
    }
  }, [weekOffset])

  // Tính danh sách toàn bộ ngày trong Tháng (View Tháng) - Mặc định Tháng 07/2026
  const { monthDates, monthTitle, monthNumber, monthYear } = useMemo(() => {
    const baseDate = new Date(2026, 6 + monthOffset, 1) // 6 = Tháng 7
    const y = baseDate.getFullYear()
    const m = baseDate.getMonth()
    const daysInMonth = new Date(y, m + 1, 0).getDate()

    const dayShortNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
    const todayIso = new Date().toISOString().split('T')[0]

    const dates: { dateStr: string; dayLabel: string; shortDate: string; dayOfMonth: number; dayOfWeek: string; isToday: boolean; isWeekend: boolean }[] = []

    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(y, m, i)
      const dayNum = String(i).padStart(2, '0')
      const monthNum = String(m + 1).padStart(2, '0')
      const dateStr = `${y}-${monthNum}-${dayNum}`
      const dayOfWeekIdx = d.getDay()
      const dayOfWeek = dayShortNames[dayOfWeekIdx]

      dates.push({
        dateStr,
        dayLabel: `${dayOfWeek} - ${dayNum}/${monthNum}`,
        shortDate: `${dayNum}/${monthNum}`,
        dayOfMonth: i,
        dayOfWeek,
        isToday: dateStr === todayIso,
        isWeekend: dayOfWeekIdx === 0 || dayOfWeekIdx === 6,
      })
    }

    return {
      monthDates: dates,
      monthTitle: `Tháng ${String(m + 1).padStart(2, '0')}/${y}`,
      monthNumber: m + 1,
      monthYear: y,
    }
  }, [monthOffset])

  // Khởi tạo dữ liệu chấm công từ bộ nhớ bền vững (localStorage)
  const [timesheetData, setTimesheetData] = useState<Record<string, Record<string, AttendanceSlot[]>>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('homies_timesheet_data')
        if (saved) {
          const parsed = JSON.parse(saved)
          if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
            return parsed
          }
        }
      } catch (e) {
        console.warn('Lỗi đọc homies_timesheet_data từ localStorage:', e)
      }
    }

    return {}
  })

  // Tự động lưu trữ timesheetData vào localStorage để duy trì dữ liệu vĩnh viễn khi F5 hoặc chuyển trang
  useEffect(() => {
    if (typeof window !== 'undefined' && timesheetData && Object.keys(timesheetData).length > 0) {
      try {
        localStorage.setItem('homies_timesheet_data', JSON.stringify(timesheetData))
      } catch (e) {
        console.warn('Lỗi lưu homies_timesheet_data vào localStorage:', e)
      }
    }
  }, [timesheetData])

  // Danh sách nhân viên chuẩn từ CSDL theo chi nhánh
  const fullEmployeeList = useMemo(() => {
    const rawList = (EmployeeService.getEmployees() as unknown as Employee[]) || []
    const seen = new Set<string>()
    const deduped: Employee[] = []

    rawList.forEach(emp => {
      const code = emp.employee_code?.trim()
      const email = emp.email?.trim().toLowerCase()
      const id = emp.id?.trim()
      const key = code || email || id

      if (key && !seen.has(key)) {
        seen.add(key)
        if (id) seen.add(id)
        if (code) seen.add(code)
        if (email) seen.add(email)
        deduped.push(emp)
      }
    })

    return deduped
  }, [refreshTrigger])

  // ─── TỰ ĐỘNG ĐỒNG BỘ 2 CHIỀU VỚI BẢNG PHÂN CA LỊCH LÀM VIỆC (DỮ LIỆU THỰC) ───
  const mergedTimesheetData = useMemo(() => {
    const allTemplates = ShiftTemplateService.getAll()
    const merged: Record<string, Record<string, AttendanceSlot[]>> = {}

    // 1. Sao chép dữ liệu chấm công thực tế đã có
    Object.keys(timesheetData).forEach(empKey => {
      merged[empKey] = { ...(timesheetData[empKey] || {}) }
    })

    const currentDates = viewMode === 'week' ? weekDates.map(w => w.dateStr) : monthDates.map(m => m.dateStr)

    // Lọc các ca theo đúng chi nhánh đang xem
    const storeSchedules = user
      ? ScheduleService.getPublishedSchedulesForStore(user, activeStoreId, currentDates)
      : []

    // 2. Đồng bộ các ca từ Lịch làm việc sang Chấm công
    storeSchedules.forEach(sch => {
      // Khớp nhân viên theo ID, mã nhân viên hoặc tên
      const emp = fullEmployeeList.find(e => 
        e.id === sch.employee_id || 
        e.employee_code === sch.employee_id ||
        (sch.employee_id && e.full_name.toLowerCase().includes(sch.employee_id.toLowerCase()))
      )
      const targetEmpId = emp ? emp.id : sch.employee_id
      if (!targetEmpId) return

      if (!merged[targetEmpId]) {
        merged[targetEmpId] = {}
      }

      const existingSlots = merged[targetEmpId][sch.date] || []

      // Nếu ngày đó chưa có dữ liệu chấm công thực tế, hiển thị ca theo lịch phân ca
      if (existingSlots.length === 0) {
        const tpl = allTemplates.find(t => t.id === sch.shift_id)
        let sName = tpl?.name || 'Ca làm'
        let sIn = tpl?.start_time || '08:30'
        let sOut = tpl?.end_time || '17:00'

        if (sch.notes) {
          const timeMatch = sch.notes.match(/\[(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\]/) || sch.notes.match(/\((\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\)/)
          if (timeMatch) {
            sIn = timeMatch[1]
            sOut = timeMatch[2]
          }
          const cleanName = sch.notes.replace(/\[.*?\]/, '').replace(/\(.*?\)/, '').trim()
          if (cleanName) sName = cleanName
        }

        merged[targetEmpId][sch.date] = [
          {
            id: `sched-sync-${sch.id}`,
            shiftName: sName,
            scheduledIn: sIn,
            scheduledOut: sOut,
            status: 'scheduled',
            totalHours: 5.0,
            isFromSchedule: true,
            sourceType: 'auto_sync',
          }
        ]
      }
    })

    return merged
  }, [timesheetData, activeStoreId, weekDates, monthDates, viewMode, refreshTrigger, fullEmployeeList, user])

  const activeDatesList = useMemo(() => {
    if (viewMode === 'week') return weekDates
    if (mainMonthTab === '1-10') return monthDates.slice(0, 10)
    if (mainMonthTab === '11-20') return monthDates.slice(10, 20)
    if (mainMonthTab === '21-31') return monthDates.slice(20)
    return monthDates
  }, [viewMode, weekDates, monthDates, mainMonthTab])

  const tableRows: EmployeeTimesheetRow[] = useMemo(() => {
    return fullEmployeeList
      .filter(emp => {
        const matchStore = !activeStoreId || isStoreMatch(emp.store_id, activeStoreId) || (!emp.store_id && isStoreMatch('store-001', activeStoreId))
        if (!matchStore) return false
        if (selectedPositionId !== 'ALL' && emp.position_id !== selectedPositionId) return false
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase()
          const matchName = emp.full_name.toLowerCase().includes(q)
          const matchCode = (emp.employee_code || '').toLowerCase().includes(q)
          return matchName || matchCode
        }
        return true
      })
      .map(emp => {
        const empDays = mergedTimesheetData[emp.id] || {}
        let totalHours = 0
        let totalShifts = 0
        let onTimeCount = 0
        let lateCount = 0
        let missingCount = 0

        activeDatesList.forEach(({ dateStr }) => {
          const slots = empDays[dateStr] || []
          slots.forEach(slot => {
            totalHours += slot.totalHours || 0
            totalShifts += 1
            if (slot.status === 'on_time') onTimeCount += 1
            if (slot.status === 'late' || slot.status === 'early') lateCount += 1
            if (slot.status === 'missing_checkout') missingCount += 1
          })
        })

        const pos = mockPositions.find(p => p.id === emp.position_id)

        return {
          employee: emp,
          position: pos,
          days: empDays,
          totalHours: Math.round(totalHours * 10) / 10,
          totalShifts,
          onTimeCount,
          lateCount,
          missingCount,
        }
      })
  }, [fullEmployeeList, activeStoreId, selectedPositionId, searchQuery, mergedTimesheetData, activeDatesList])

  // Tính 4 Chỉ Số Vĩ Mô (Macro KPI Cards)
  const macroStats = useMemo(() => {
    let totalWorkHours = 0
    let totalOnTime = 0
    let totalLate = 0
    let totalMissing = 0
    let activeEmployeesWithShifts = 0

    tableRows.forEach(row => {
      totalWorkHours += row.totalHours
      totalOnTime += row.onTimeCount
      totalLate += row.lateCount
      totalMissing += row.missingCount
      if (row.totalShifts > 0) activeEmployeesWithShifts += 1
    })

    const totalValidRecorded = totalOnTime + totalLate + totalMissing
    const onTimeRate = totalValidRecorded > 0 ? Math.round((totalOnTime / totalValidRecorded) * 1000) / 10 : 94.5

    return {
      totalHours: Math.round(totalWorkHours * 10) / 10,
      onTimeRate,
      issuesCount: totalMissing + totalLate,
      missingCount: totalMissing,
      activeStaff: activeEmployeesWithShifts,
      totalStaff: tableRows.length,
    }
  }, [tableRows])

  // ─── CLICK VÀO THẺ CA HOẶC TÊN NHÂN VIÊN -> MỞ MODAL THÔNG TIN CÔNG (Ảnh 2) ───
  const handleOpenWorkInfoModal = (slot: AttendanceSlot, employee: Employee, dateStr: string, dayLabel: string) => {
    setViewingWorkInfo({ slot, employee, dateStr, dayLabel })
  }

  // ─── TỪ MODAL THÔNG TIN CÔNG -> BẤM NÚT SỬA CÔNG -> MỞ MODAL SỬA CÔNG (Ảnh 1) ───
  const handleSwitchToEditModal = () => {
    if (!viewingWorkInfo) return
    const { slot, employee, dateStr, dayLabel } = viewingWorkInfo
    
    setEditingWorkInfo({ slot, employee, dateStr, dayLabel })
    setEditShiftName(slot.shiftName || 'Ca Tối [17:00-22:00]')
    setEditStartTime(slot.actualIn || slot.scheduledIn || '16:50')
    setEditEndTime(slot.actualOut || slot.scheduledOut || '22:02')
    setEditReason(slot.editReason || '')
    setPenalizeMissIn(!!slot.penalizeMissIn)
    setPenalizeMissOut(!!slot.penalizeMissOut)

    setViewingWorkInfo(null)
  }

  const handleSaveEditWorkInfo = () => {
    if (!editingWorkInfo) return
    const { slot, employee, dateStr } = editingWorkInfo

    const currentList = timesheetData[employee.id]?.[dateStr] || []
    const isAdhoc = editShiftName.toLowerCase().includes('phát sinh') || editShiftName.toLowerCase().includes('đột xuất') || editShiftName.toLowerCase().includes('linh hoạt')
    const computedHours = editStartTime && editEndTime ? calculateHours(editStartTime, editEndTime) : (slot.totalHours || 5.0)

    let updatedSlots: AttendanceSlot[] = []

    if (currentList.some(s => s.id === slot.id)) {
      updatedSlots = currentList.map(s => {
        if (s.id === slot.id) {
          return {
            ...s,
            shiftName: editShiftName,
            actualIn: editStartTime,
            actualOut: editEndTime,
            scheduledIn: isAdhoc ? editStartTime : (s.scheduledIn || editStartTime),
            scheduledOut: isAdhoc ? editEndTime : (s.scheduledOut || editEndTime),
            status: 'on_time' as const,
            lateMinutes: undefined,
            totalHours: computedHours,
            isEdited: true,
            isOvertime: editShiftName.toLowerCase().includes('tăng ca') || editShiftName.toLowerCase().includes('(tc)'),
            editReason: editReason || (isAdhoc ? 'Huy động làm ca phát sinh do thiếu người' : 'Quản lý điều chỉnh theo yêu cầu'),
            penalizeMissIn,
            penalizeMissOut,
            editedBy: user?.full_name || 'Quản lý cửa hàng',
          }
        }
        return s
      })
    } else {
      // Slot đồng bộ từ lịch hoặc mới tạo
      const newSlot: AttendanceSlot = {
        id: `att-manual-${Date.now()}`,
        shiftName: editShiftName,
        actualIn: editStartTime,
        actualOut: editEndTime,
        scheduledIn: editStartTime,
        scheduledOut: editEndTime,
        status: 'on_time' as const,
        totalHours: computedHours,
        isEdited: true,
        editReason: editReason || (isAdhoc ? 'Huy động làm ca phát sinh do thiếu người' : 'Quản lý bổ sung công'),
        penalizeMissIn,
        penalizeMissOut,
        editedBy: user?.full_name || 'Quản lý cửa hàng',
        sourceType: 'manager',
      }
      updatedSlots = [...currentList, newSlot]
    }

    setTimesheetData(prev => ({
      ...prev,
      [employee.id]: {
        ...(prev[employee.id] || {}),
        [dateStr]: updatedSlots,
      },
    }))

    setEditingWorkInfo(null)
    setToastMessage(`Đã cập nhật công ${editShiftName} ngày ${dateStr} cho ${employee.full_name}!`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleDeleteWorkInfo = () => {
    if (!viewingWorkInfo) return
    const { slot, employee, dateStr } = viewingWorkInfo

    const currentSlots = timesheetData[employee.id]?.[dateStr] || []
    const nextSlots = currentSlots.filter(s => s.id !== slot.id)

    setTimesheetData(prev => ({
      ...prev,
      [employee.id]: {
        ...(prev[employee.id] || {}),
        [dateStr]: nextSlots,
      },
    }))

    setViewingWorkInfo(null)
    setToastMessage(`Đã xóa ca chấm công của ${employee.full_name}!`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleOpenAddModal = (employee: Employee, dateStr: string, dayLabel: string) => {
    setAddingSlotTarget({ employee, dateStr, dayLabel })
    setAddShiftName('Ca Sáng')
    setAddFormIn('08:30')
    setAddFormOut('12:00')
    setAddFormReason('Bổ sung chấm công theo đơn duyệt')
  }

  const handleSaveAddSlot = () => {
    if (!addingSlotTarget) return
    const { employee, dateStr } = addingSlotTarget

    const newSlot: AttendanceSlot = {
      id: `att-added-${Date.now()}`,
      shiftName: addShiftName,
      scheduledIn: addFormIn,
      scheduledOut: addFormOut,
      actualIn: addFormIn,
      actualOut: addFormOut,
      status: 'on_time',
      totalHours: 4.0,
      isEdited: true,
      editReason: addFormReason,
      editedBy: user?.full_name || 'Quản lý cửa hàng',
      sourceType: 'manager',
    }

    const currentSlots = timesheetData[employee.id]?.[dateStr] || []

    setTimesheetData(prev => ({
      ...prev,
      [employee.id]: {
        ...(prev[employee.id] || {}),
        [dateStr]: [...currentSlots, newSlot],
      },
    }))

    setAddingSlotTarget(null)
    setToastMessage(`Đã thêm ca chấm công bù cho ${employee.full_name}!`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  // ─── THUẬT TOÁN IMPORT EXCEL 3 BƯỚC THÔNG MINH (100% CHUẨN LỊCH LÀM VIỆC) ───
  const cleanEmpName = (text: string) => {
    if (!text) return ''
    return text
      .replace(/\d+\s*ca.*/gi, '')
      .replace(/\d+(\.\d+)?\s*giờ.*/gi, '')
      .replace(/\|\s*/g, '')
      .replace(/[\r\n]+/g, ' ')
      .trim()
  }

  const getEmpMatchDetail = (rowIndex: number, rawCell: string) => {
    if (manualEmpMapping[rowIndex]) {
      const mapped = fullEmployeeList.find(e => e.id === manualEmpMapping[rowIndex])
      if (mapped) {
        return {
          emp: mapped,
          status: 'manual' as const,
          cleanedName: cleanEmpName(rawCell),
          badgeLabel: `✓ Ghép thủ công: ${mapped.full_name}`,
          badgeColor: 'bg-blue-50 text-[#2F6FA8] border-blue-200',
        }
      }
    }

    const cleaned = cleanEmpName(rawCell)
    if (!cleaned) {
      return {
        emp: null,
        status: 'empty' as const,
        cleanedName: '',
        badgeLabel: 'Dòng trống',
        badgeColor: 'bg-gray-100 text-gray-500 border-gray-200',
      }
    }

    const lowerClean = cleaned.toLowerCase()
    const toneFreeClean = removeVietnameseTones(lowerClean)

    const rememberedMap = getRememberedEmpMappings()
    const rememberedId = rememberedMap[cleaned] || rememberedMap[toneFreeClean]
    if (rememberedId) {
      const mapped = fullEmployeeList.find(e => e.id === rememberedId)
      if (mapped) {
        const isCurrentStore = isStoreMatch(mapped.store_id, importSelectedStoreId)
        return {
          emp: mapped,
          status: 'manual' as const,
          cleanedName: cleaned,
          badgeLabel: isCurrentStore ? `✓ Tự động khớp: ${mapped.full_name}` : `✓ Mượn NV: ${mapped.full_name}`,
          badgeColor: isCurrentStore ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-purple-50 text-purple-800 border-purple-200',
        }
      }
    }

    // Ưu tiên 1: Khớp chính xác nhân sự thuộc cơ sở đang chọn
    const exactCurrentStore = fullEmployeeList.find(e => {
      if (!isStoreMatch(e.store_id, importSelectedStoreId)) return false
      const eLower = e.full_name.toLowerCase()
      const eTone = removeVietnameseTones(eLower)
      return eLower === lowerClean || eTone === toneFreeClean || e.employee_code?.toLowerCase() === lowerClean
    })
    if (exactCurrentStore) {
      return {
        emp: exactCurrentStore,
        status: 'matched' as const,
        cleanedName: cleaned,
        badgeLabel: `✓ Tự động khớp: ${exactCurrentStore.full_name}`,
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      }
    }

    // Ưu tiên 2: Khớp chính xác toàn hệ thống
    const exactOtherStore = fullEmployeeList.find(e => {
      const eLower = e.full_name.toLowerCase()
      const eTone = removeVietnameseTones(eLower)
      return eLower === lowerClean || eTone === toneFreeClean || e.employee_code?.toLowerCase() === lowerClean
    })
    if (exactOtherStore) {
      const storeName = mockStores.find(s => s.id === exactOtherStore.store_id)?.name || 'Cơ sở khác'
      return {
        emp: exactOtherStore,
        status: 'matched' as const,
        cleanedName: cleaned,
        badgeLabel: `✓ Hỗ trợ: ${exactOtherStore.full_name} (${storeName})`,
        badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      }
    }

    // Ưu tiên 3: Khớp gần đúng thuộc cơ sở
    const partial = fullEmployeeList.find(e => {
      if (!isStoreMatch(e.store_id, importSelectedStoreId)) return false
      const eLower = e.full_name.toLowerCase()
      const eTone = removeVietnameseTones(eLower)
      return eLower.includes(lowerClean) || lowerClean.includes(eLower) || eTone.includes(toneFreeClean) || toneFreeClean.includes(eTone)
    })
    if (partial) {
      return {
        emp: partial,
        status: 'matched' as const,
        cleanedName: cleaned,
        badgeLabel: `✓ Khớp gần đúng: ${partial.full_name}`,
        badgeColor: 'bg-blue-50 text-[#2F6FA8] border-blue-200',
      }
    }

    return {
      emp: null,
      status: 'unmatched' as const,
      cleanedName: cleaned,
      badgeLabel: 'Cần chọn ghép tay',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    }
  }

  
  const applyIposImportPreview = (preview: IposAttendanceImportPreview) => {
    setImportError(null)
    setParsedHeaders(preview.headers)
    setParsedRows(preview.rows)
    setColumnMapping(preview.columnMapping)
    setManualEmpMapping({})

    if (preview.detectedStoreId) {
      setImportSelectedStoreId(preview.detectedStoreId)
      setAutoDetectedStoreName(mockStores.find(s => s.id === preview.detectedStoreId)?.name || null)
    }
    if (preview.detectedMonth) setImportSelectedMonth(preview.detectedMonth)
    if (preview.detectedYear) setImportSelectedYear(preview.detectedYear)

    setImportStep(2)
  }

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file)
    setImportError(null)
    setParsedRows([])
    setParsedHeaders([])
    setColumnMapping({})

    // 1. Tự động nhận diện Chi Nhánh & Tháng từ tên file
    const fLower = file.name.toLowerCase()
    const fTone = removeVietnameseTones(fLower)

    if (fLower.includes('phan') || fTone.includes('phan') || fLower.includes('ba phan')) {
      setImportSelectedStoreId('store-001')
      setAutoDetectedStoreName('Homies Milk Tea - Hồ Bá Phấn')
    } else if (fLower.includes('429')) {
      setImportSelectedStoreId('store-002')
      setAutoDetectedStoreName('Homies Milk Tea - 429')
    } else if (fLower.includes('sy') || fTone.includes('sy') || fLower.includes('le van sy')) {
      setImportSelectedStoreId('store-003')
      setAutoDetectedStoreName('Homies Milk Tea - Lê Văn Sỹ')
    } else {
      const matchedStore = mockStores.find(s => {
        const sLower = s.name.toLowerCase()
        const sTone = removeVietnameseTones(sLower)
        return fLower.includes(sLower) || fTone.includes(sTone)
      })
      if (matchedStore) {
        setImportSelectedStoreId(matchedStore.id)
        setAutoDetectedStoreName(matchedStore.name)
      }
    }

    try {
      let rows: unknown[][] = []

      // Thử đọc bằng readXlsxFile trước (chỉ hỗ trợ .xlsx thật)
      try {
        const rawWorkbook = await readXlsxFile(file) as unknown
        if (rawWorkbook && Array.isArray(rawWorkbook)) {
          const workbookSheets: IposWorkbookSheet[] = rawWorkbook
            .filter((sheet): sheet is { sheet: string; data: unknown[][] } => {
              return !!sheet && typeof sheet === 'object' && 'sheet' in sheet && 'data' in sheet && Array.isArray((sheet as { data?: unknown }).data)
            })
            .map(sheet => ({
              sheet: String(sheet.sheet || ''),
              data: sheet.data.filter(r => Array.isArray(r) && r.some(c => c !== null && c !== undefined && String(c).trim() !== '')),
            }))

          if (workbookSheets.length > 0) {
            const preview = parseIposAttendanceWorkbook(workbookSheets, {
              employees: fullEmployeeList,
              stores: mockStores,
              preferredStoreId: importSelectedStoreId,
            })

            if (preview.rows.length > 0) {
              console.log('[Import] Dùng parser iPOS:', preview.source, preview.sourceSheet, 'Rows:', preview.rows.length)
              applyIposImportPreview(preview)
              return
            }

            rows = workbookSheets[0].data
          } else {
            rows = rawWorkbook as unknown[][]
          }

          const filtered = rows.filter(r => Array.isArray(r) && r.some(c => c !== null && c !== undefined && String(c).trim() !== ''))
          // Validate: phải có ít nhất 1 ô chứa định dạng giờ HH:MM mới coi là đọc được dữ liệu chấm công
          // Nếu không có → readXlsxFile đọc được file nhưng các ô thời gian bị null (do format không tương thích)
          const hasTimeData = filtered.some(row =>
            row.some(c => String(c || '').match(/\d{1,2}:\d{2}/))
          )
          if (hasTimeData) {
            rows = filtered
            console.log('[Import] readXlsxFile OK, tìm thấy dữ liệu giờ, dùng XLSX path. Rows:', filtered.length)
          } else {
            console.warn('[Import] readXlsxFile đọc được nhưng không tìm thấy dữ liệu giờ (HH:MM) → bỏ qua, thử HTML path')
          }
        }
      } catch (xlsxErr) {
        console.warn('[Import] readXlsxFile không đọc được file, thử HTML path...', xlsxErr)
      }

      // Nếu readXlsxFile không đọc được (do file .xls dạng HTML table của iPOS), đọc bằng FileReader
      if (rows.length === 0) {
        const fileText = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = e => resolve((e.target?.result as string) || '')
          reader.onerror = reject
          reader.readAsText(file)
        })

        if (fileText.includes('<table') || fileText.includes('<TABLE') || fileText.includes('<tr') || fileText.includes('<TR')) {
          const parser = new DOMParser()
          const doc = parser.parseFromString(fileText, 'text/html')
          const trs = Array.from(doc.querySelectorAll('tr'))

          // Expand colspan và rowspan đúng chuẩn (file iPOS dùng rowspan cho cột tên NV, colspan cho các ô gộp)
          // Dùng sparse matrix để fill đúng vị trí
          const grid: string[][] = []
          const spanMatrix: { rowspan: number; colspan: number; value: string }[][] = []

          trs.forEach((tr, rIdx) => {
            if (!grid[rIdx]) grid[rIdx] = []
            const cells = Array.from(tr.querySelectorAll('td, th'))
            let colCursor = 0

            cells.forEach(td => {
              // Bỏ qua các vị trí đã được fill bởi rowspan từ dòng trên
              while (spanMatrix[rIdx]?.[colCursor]) colCursor++

              const html = (td as HTMLElement).innerHTML.replace(/<br\s*[\/]?>/gi, '\n')
              const temp = document.createElement('div')
              temp.innerHTML = html
              const cellText = temp.textContent?.trim() || ''

              const cs = parseInt((td as HTMLElement).getAttribute('colspan') || '1', 10) || 1
              const rs = parseInt((td as HTMLElement).getAttribute('rowspan') || '1', 10) || 1

              // Fill cell và expand colspan + rowspan vào grid
              for (let dr = 0; dr < rs; dr++) {
                for (let dc = 0; dc < cs; dc++) {
                  const targetRow = rIdx + dr
                  const targetCol = colCursor + dc
                  if (!grid[targetRow]) grid[targetRow] = []
                  if (!spanMatrix[targetRow]) spanMatrix[targetRow] = []
                  grid[targetRow][targetCol] = cellText
                  spanMatrix[targetRow][targetCol] = { rowspan: rs, colspan: cs, value: cellText }
                }
              }
              colCursor += cs
            })
          })

          rows = grid
            .map(r => {
              // Đảm bảo không có undefined
              const maxLen = Math.max(...Object.keys(r).map(Number)) + 1
              const filled: string[] = []
              for (let i = 0; i < maxLen; i++) filled.push(r[i] ?? '')
              return filled
            })
            .filter(r => r.some(c => c !== ''))
        }
      }

      // File không có dữ liệu thì dừng, không tự nạp dữ liệu mẫu.
      if (rows.length === 0) {
        throw new Error('Không tìm thấy bảng dữ liệu chấm công trong file')
      }

      let detectedMonth = importSelectedMonth
      let detectedYear = importSelectedYear

      // 2. Quét các dòng 0->6 để tìm tiêu đề Tháng/Năm và Chi nhánh (chuẩn file iPOS)
      for (let i = 0; i < Math.min(rows.length, 7); i++) {
        const row = rows[i]
        if (!Array.isArray(row)) continue
        const rowStr = row.map(c => String(c ?? '')).join(' ')
        const rowLower = rowStr.toLowerCase()

        // Trích xuất "Bảng Chấm Công Tháng 07/2026"
        const mMatch = rowLower.match(/tháng\s*(\d{1,2})[/\-](\d{4})/) || rowLower.match(/thang\s*(\d{1,2})[/\-](\d{4})/)
        if (mMatch) {
          detectedMonth = parseInt(mMatch[1], 10)
          detectedYear = parseInt(mMatch[2], 10)
          setImportSelectedMonth(detectedMonth)
          setImportSelectedYear(detectedYear)
        }

        // Trích xuất tên Chi Nhánh thông minh: Quét cụm từ ngay sau chữ "Chi nhánh" hoặc "CN"
        const branchMatch = rowStr.match(/chi\s*nh[aá]nh\s*[:\-]?\s*([^,\-\n]+)/i) || rowStr.match(/cn\s*[:\-]?\s*([^,\-\n]+)/i)
        if (branchMatch && branchMatch[1]) {
          const extractedBranch = branchMatch[1].trim().toLowerCase()
          const extractedBranchTone = removeVietnameseTones(extractedBranch)

          const matched = mockStores.find(s => {
            const sLower = s.name.toLowerCase()
            const sTone = removeVietnameseTones(sLower)
            return (
              sLower.includes(extractedBranch) ||
              extractedBranch.includes(sLower) ||
              sTone.includes(extractedBranchTone) ||
              extractedBranchTone.includes(sTone) ||
              (extractedBranch.includes('429') && s.id === 'store-002') ||
              ((extractedBranch.includes('hồ bá phấn') || extractedBranch.includes('ho ba phan') || extractedBranch.includes('ba phan')) && s.id === 'store-001') ||
              ((extractedBranch.includes('lê văn sỹ') || extractedBranch.includes('le van sy')) && s.id === 'store-003')
            )
          })

          if (matched) {
            setImportSelectedStoreId(matched.id)
            setAutoDetectedStoreName(matched.name)
          }
        } else if (rowLower.includes('429')) {
          setImportSelectedStoreId('store-002')
          setAutoDetectedStoreName(mockStores.find(s => s.id === 'store-002')?.name || 'Homies Milk Tea - 429')
        } else if (rowLower.includes('hồ bá phấn') || rowLower.includes('ho ba phan') || rowLower.includes('429')) {
          setImportSelectedStoreId('store-001')
          setAutoDetectedStoreName('Homies Milk Tea - 429')
        } else if (rowLower.includes('quang trung')) {
          setImportSelectedStoreId('store-002')
          setAutoDetectedStoreName('Homies Milk Tea - Quang Trung')
        } else if (rowLower.includes('lê văn sỹ') || rowLower.includes('le van sy')) {
          setImportSelectedStoreId('store-003')
          setAutoDetectedStoreName('Homies Milk Tea - Lê văn Sỹ')
        }
      }

      // 3. Tìm dòng Header chứa "Tên nhân viên", "Mã nhân viên", "STT" hoặc các số 1, 2, 3...
      let headerRowIdx = -1
      let nameColIdx = 2 // Mặc định cột C
      let codeColIdx = 1 // Mặc định cột B
      let startDateColIdx = 3 // Mặc định cột D

      for (let r = 0; r < Math.min(rows.length, 12); r++) {
        const row = rows[r]
        for (let c = 0; c < row.length; c++) {
          const val = String(row[c] || '').trim().toLowerCase()
          if (val.includes('tên nhân viên') || val.includes('họ và tên') || val.includes('nhân viên')) {
            headerRowIdx = r
            nameColIdx = c
          }
          if (val.includes('mã nhân viên') || val.includes('mã nv')) {
            codeColIdx = c
          }
        }
        if (headerRowIdx !== -1) break
      }

      // Nếu không tìm thấy cột có chữ 'Tên nhân viên', tìm dòng có số ngày 1, 2, 3
      if (headerRowIdx === -1) {
        for (let r = 0; r < Math.min(rows.length, 12); r++) {
          const row = rows[r]
          const nums = row.filter(c => {
            const n = parseInt(String(c || '').trim(), 10)
            return n >= 1 && n <= 31
          })
          if (nums.length >= 7) {
            headerRowIdx = r
            break
          }
        }
      }

      if (headerRowIdx === -1) headerRowIdx = 6 // Fallback dòng 7

      // Tìm cột ngày đầu tiên (Số 1)
      const headerRow = rows[headerRowIdx] || []
      for (let c = 0; c < headerRow.length; c++) {
        const cell = String(headerRow[c] || '').trim()
        if (cell === '1' || cell === '01' || cell.startsWith('01/') || cell.startsWith('1/')) {
          startDateColIdx = c
          break
        }
      }

      // Kiểm tra xem dòng kế tiếp có phải là dòng thứ (T2, T3, T4...) hay không
      let dataStartRow = headerRowIdx + 1
      if (rows[headerRowIdx + 1] && Array.isArray(rows[headerRowIdx + 1])) {
        const nextRowStr = rows[headerRowIdx + 1].map(c => String(c || '').toLowerCase()).join(' ')
        if (nextRowStr.includes('t2') || nextRowStr.includes('t3') || nextRowStr.includes('t4') || nextRowStr.includes('t5') || nextRowStr.includes('t6') || nextRowStr.includes('t7') || nextRowStr.includes('cn')) {
          dataStartRow = headerRowIdx + 2
        }
      }

      // 4. Trích xuất danh sách nhân viên và các cột ngày từ file Excel
      const extractedRows: string[][] = []
      const daysInMonth = new Date(detectedYear, detectedMonth, 0).getDate()

      // Nhận diện động các cột chứa ngày trong file Excel (ví dụ "17 T6", "18 T7", "19 CN"...)
      const dayColumnMap: { colIdx: number; dayNum: number; headerName: string }[] = []
      const nextRow = rows[headerRowIdx + 1] || []

      for (let c = 0; c < headerRow.length; c++) {
        const val1 = String(headerRow[c] || '').trim()
        const val2 = String(nextRow[c] || '').trim()
        const combined = `${val1} ${val2}`.trim()

        const match = val1.match(/\b(\d{1,2})\b/) || combined.match(/\b(\d{1,2})\b/)
        if (match) {
          const dNum = parseInt(match[1], 10)
          if (dNum >= 1 && dNum <= daysInMonth) {
            dayColumnMap.push({
              colIdx: c,
              dayNum: dNum,
              headerName: `Ngày ${String(dNum).padStart(2, '0')}`
            })
          }
        }
      }

      // Nếu không khớp regex cột ngày nào, fallback quét liên tục từ startDateColIdx
      if (dayColumnMap.length === 0) {
        for (let d = 1; d <= daysInMonth; d++) {
          const col = startDateColIdx + (d - 1)
          if (col < (headerRow.length || 35)) {
            dayColumnMap.push({
              colIdx: col,
              dayNum: d,
              headerName: `Ngày ${String(d).padStart(2, '0')}`
            })
          }
        }
      }

      const newHeaders = ['Nhân viên', ...dayColumnMap.map(d => d.headerName)]
      const dateMap: Record<number, string> = {}
      const mStr = String(detectedMonth).padStart(2, '0')

      dayColumnMap.forEach((dItem, idx) => {
        const colIdxInPreview = idx + 1 // 1-indexed (col 0 là tên NV)
        const dStr = String(dItem.dayNum).padStart(2, '0')
        dateMap[colIdxInPreview] = `${detectedYear}-${mStr}-${dStr}`
      })

      // Gộp các dòng cùng nhân viên (do expand rowspan tạo ra nhiều dòng ca riêng lẻ)
      // Các dòng liên tiếp có cùng tên NV (hoặc tên rỗng = continuation row) sẽ được nối ca bằng \n
      const empRowMap: Map<number, string[]> = new Map() // index trong extractedRows -> rowData
      const empIndexByName: Map<string, number> = new Map() // tên NV -> index
      let lastEmpKey: string | null = null // theo dõi NV cuối cùng để xử lý continuation row

      for (let r = dataStartRow; r < rows.length; r++) {
        const row = rows[r]
        if (!row || row.length === 0) continue

        const rawName = String(row[nameColIdx] || '').trim()
        const rawCode = String(row[codeColIdx] || '').trim()
        const rawNameLower = rawName.toLowerCase()

        if (rawNameLower.includes('ipos') || rawNameLower.includes('tổng') || rawNameLower.includes('generated')) continue

        const displayName = rawName || rawCode

        // Continuation row: tên rỗng nhưng có dữ liệu ca → nối vào NV cuối
        if (!displayName && lastEmpKey && empIndexByName.has(lastEmpKey)) {
          const hasData = dayColumnMap.some(dItem => {
            const v = dItem.colIdx < row.length ? String(row[dItem.colIdx] || '').trim() : ''
            return v && v !== '--'
          })
          if (hasData) {
            const existingIdx = empIndexByName.get(lastEmpKey)!
            const existingRow = empRowMap.get(existingIdx)!
            dayColumnMap.forEach((dItem, di) => {
              const cellVal = dItem.colIdx < row.length ? String(row[dItem.colIdx] || '').trim() : ''
              if (cellVal && cellVal !== '--') {
                const colPos = di + 1
                if (existingRow[colPos]) {
                  existingRow[colPos] = existingRow[colPos] + '\n' + cellVal
                } else {
                  existingRow[colPos] = cellVal
                }
              }
            })
          }
          continue
        }

        if (!displayName || displayName === 'STT') continue

        if (empIndexByName.has(displayName)) {
          // Dòng tiếp theo của cùng NV → nối ca vào rowData hiện có
          const existingIdx = empIndexByName.get(displayName)!
          const existingRow = empRowMap.get(existingIdx)!
          dayColumnMap.forEach((dItem, di) => {
            const cellVal = dItem.colIdx < row.length ? String(row[dItem.colIdx] || '').trim() : ''
            if (cellVal && cellVal !== '--') {
              const colPos = di + 1
              if (existingRow[colPos]) {
                existingRow[colPos] = existingRow[colPos] + '\n' + cellVal
              } else {
                existingRow[colPos] = cellVal
              }
            }
          })
          lastEmpKey = displayName
        } else {
          // NV mới
          const rowData: string[] = [displayName]
          dayColumnMap.forEach(dItem => {
            const cellVal = dItem.colIdx < row.length ? String(row[dItem.colIdx] || '').trim() : ''
            rowData.push(cellVal)
          })
          const newIdx = extractedRows.length
          extractedRows.push(rowData)
          empRowMap.set(newIdx, rowData)
          empIndexByName.set(displayName, newIdx)
          lastEmpKey = displayName
        }
      }

      if (extractedRows.length === 0 || dayColumnMap.length === 0) {
        throw new Error('Không nhận diện được dòng nhân viên hoặc cột ngày trong file')
      }

      setParsedHeaders(newHeaders)
      setParsedRows(extractedRows)
      setColumnMapping(dateMap)
      setImportError(null)
      setImportStep(2)

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không đọc được file chấm công'
      console.warn('[Import] Không thể đọc file chấm công:', err)
      setParsedRows([])
      setParsedHeaders([])
      setColumnMapping({})
      setImportStep(1)
      setImportError(`${message}. Vui lòng dùng file Excel iPOS đúng cấu trúc hoặc tải file mẫu.`)
    }
  }

  const handleExecuteSmartImport = () => {
    setIsImporting(true)

    parsedRows.forEach((row, rowIdx) => {
      const rawCell = row[0]
      const cleaned = cleanEmpName(rawCell)
      const empId = manualEmpMapping[rowIdx]
      if (cleaned && empId) {
        saveEmpMappingMemory(cleaned, empId)
      }
    })

    const updatedData = { ...timesheetData }
    let count = 0

    parsedRows.forEach((row, rowIdx) => {
      const rawEmp = row[0]
      const match = getEmpMatchDetail(rowIdx, rawEmp)
      const targetImportStoreId = importSelectedStoreId || activeStoreId
      const status = (match.emp as unknown as { status?: string } | null)?.status
      const isInactive = status === 'inactive' || status === 'resigned'
      const isManualMapping = match.status === 'manual'
      const isUnconfirmedCrossStore = Boolean(
        match.emp &&
        targetImportStoreId &&
        !isManualMapping &&
        !isStoreMatch(match.emp.store_id, targetImportStoreId)
      )
      if (!match.emp || isInactive || isUnconfirmedCrossStore) return

      const empId = match.emp.id

      if (empId) {
        if (!updatedData[empId]) updatedData[empId] = {}

        parsedHeaders.forEach((_, colIdx) => {
          if (colIdx === 0) return
          const cellVal = row[colIdx]?.trim()
          if (!cellVal || cellVal === '--' || cellVal === 'OFF') return

          const targetDate = columnMapping[colIdx] || weekDates[colIdx - 1]?.dateStr
          if (!targetDate) return

          // Tách các ca làm trong cùng 1 ô (cách nhau bởi xuống dòng, ; hoặc /)
           const shiftEntries = splitIposAttendanceEntries(cellVal)

          shiftEntries.forEach(entry => {
            const attendanceCell = buildIposAttendanceImportRecord(entry)
            if (!attendanceCell) return

            const cIn = attendanceCell.actualIn || ''
            const cOut = attendanceCell.actualOut || ''
            let scheduledIn = attendanceCell.scheduledIn || cIn
            let scheduledOut = attendanceCell.scheduledOut || cOut
            let sName = 'Ca làm việc'
            let st: AttendanceSlot['status'] = attendanceCell.status
            let isOvertime = entry.toLowerCase().includes('(tc)') || entry.toLowerCase().includes('tăng ca')
            let lateMinutes = 0
            isOvertime = Boolean(isOvertime)

            if (attendanceCell.kind === 'complete' && cIn && cOut) {
              const cleanTitle = entry
                .replace(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/, '')
                .replace(/\[Ca\s*\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}\]/i, '')
                .replace(/[()]/g, '')
                .trim()
              sName = cleanTitle || (isOvertime ? `Tăng ca ${cIn}-${cOut}` : `Ca ${cIn}-${cOut}`)

              const [inH, inM] = cIn.split(':').map(Number)
              const inTotalMin = inH * 60 + inM

              // ── TỰ ĐỘNG ĐỐI CHIẾU VỚI LỊCH PHÂN CA CỦA NHÂN VIÊN ──
              const scheduledForDay = user
                ? ScheduleService.getPublishedSchedulesForStore(user, importSelectedStoreId, [targetDate]).filter(s =>
                  s.employee_id === empId || s.employee_id === match.emp?.employee_code
                )
                : []

              let matchedScheduleShift = false

              for (const sch of scheduledForDay) {
                if (sch.notes) {
                  const schTimeMatch = sch.notes.match(/\[(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\]/) || sch.notes.match(/\((\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\)/)
                  if (schTimeMatch) {
                    const [sH, sM] = schTimeMatch[1].split(':').map(Number)
                    const sTotalMin = sH * 60 + sM
                    if (Math.abs(inTotalMin - sTotalMin) <= 15) {
                      matchedScheduleShift = true
                      scheduledIn = schTimeMatch[1]
                      scheduledOut = schTimeMatch[2]
                      sName = sch.notes.replace(/\[.*?\]/, '').replace(/\(.*?\)/, '').trim() || `Ca ${cIn}-${cOut}`
                      st = 'on_time'
                      lateMinutes = 0
                      break
                    }
                  }
                }
              }

              if (!matchedScheduleShift) {
                // Nhận diện Ca phát sinh / Ca 18h: Khung giờ 17:45 - 18:30 là ca phát sinh thay vì phạt trễ từ 17h
                if (inTotalMin >= 1065 && inTotalMin <= 1110) {
                  st = 'on_time'
                  sName = `Ca phát sinh [${cIn}-${cOut}]`
                  lateMinutes = 0
                }
                // Ca sáng (chuẩn 08:30 = 510p): Vào từ 08:36 - 09:30 => Đi muộn
                else if (inTotalMin > 515 && inTotalMin <= 570) {
                  st = 'late'
                  lateMinutes = inTotalMin - 510
                }
                // Ca trưa (chuẩn 12:00 = 720p): Vào từ 12:06 - 13:00 => Đi muộn
                else if (inTotalMin > 725 && inTotalMin <= 780) {
                  st = 'late'
                  lateMinutes = inTotalMin - 720
                }
                // Ca tối (chuẩn 17:00 = 1020p): Vào từ 17:06 - 17:45 => Đi muộn
                else if (inTotalMin > 1025 && inTotalMin < 1065) {
                  st = 'late'
                  lateMinutes = inTotalMin - 1020
                }
              }
            } else if (attendanceCell.kind === 'missing_checkout') {
              sName = 'Quên check-out'
            } else if (attendanceCell.kind === 'missing_checkin') {
              sName = 'Thiếu check-in'
            }

            const currentList = updatedData[empId][targetDate] || []

            const newSlot: AttendanceSlot = {
              id: buildIposAttendanceImportSlotId(empId, targetDate, {
                scheduledIn,
                scheduledOut,
                isOvertime,
              }),
              shiftName: sName,
              scheduledIn,
              scheduledOut,
              actualIn: cIn || undefined,
              actualOut: cOut || undefined,
              status: st,
              lateMinutes: lateMinutes > 0 ? lateMinutes : undefined,
              totalHours: attendanceCell.totalHours,
              isOvertime,
              isEdited: true,
              editReason: IPOS_ATTENDANCE_IMPORT_REASON,
              sourceType: 'self',
              penalizeMissIn: attendanceCell.kind === 'missing_checkin',
              penalizeMissOut: attendanceCell.kind === 'missing_checkout',
            }

            updatedData[empId][targetDate] = upsertIposAttendanceImportSlot(currentList, newSlot)
            count++
          })
        })
      }
    })

    setTimesheetData(updatedData)
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('homies_timesheet_data', JSON.stringify(updatedData))
      } catch (e) {
        console.warn('Lỗi lưu homies_timesheet_data:', e)
      }
    }
    const now = new Date()
    const curY = now.getFullYear()
    const curM = now.getMonth() + 1
    const targetOffset = (importSelectedYear - curY) * 12 + (importSelectedMonth - curM)

    setViewMode('month')
    setMonthOffset(targetOffset)
    setActiveStoreId(importSelectedStoreId)
    setIsImporting(false)
    setShowImportModal(false)
    setImportStep(1)
    setSelectedFile(null)
    setParsedRows([])
    setParsedHeaders([])
    setToastMessage(`Đã nạp thành công ${count} ca chấm công từ file Excel vào Bảng chấm công Tháng ${String(importSelectedMonth).padStart(2, '0')}/${importSelectedYear}!`)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleDownloadSampleExcel = () => {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`
    html += `<head><meta charset="utf-8"><style>
      table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
      th { background-color: #001D3D; color: #FFFFFF; font-weight: bold; padding: 6px; border: 1px solid #CCCCCC; text-align: center; }
      td { border: 1px solid #CCCCCC; padding: 5px; }
      .emp-name { font-weight: bold; color: #001D3D; }
    </style></head><body><table>`
    
    // Dòng 1: Tiêu đề ngày từ 01 đến 31
    html += `<tr><th>Họ tên nhân viên</th>`
    for (let i = 1; i <= 31; i++) {
      const dStr = String(i).padStart(2, '0')
      const dObj = new Date(2026, 7, i)
      const dow = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][dObj.getDay()]
      html += `<th>Ngày ${dStr}<br/>(${dow})</th>`
    }
    html += `</tr>`

    // Dòng dữ liệu mẫu cho nhân viên
    const demoEmployees = [
      'Huỳnh Lê Kiều Linh',
      'Nguyễn Thị Phương Thảo',
      'Nguyễn Thị Tú Trinh',
      'Quách Thị Kim Chi',
      'Cao Văn Thắng',
      'Trần Công Huy',
      'Phạm Nguyễn Đông Duy',
    ]

    demoEmployees.forEach((name, idx) => {
      html += `<tr><td class="emp-name">${name}</td>`
      for (let day = 1; day <= 31; day++) {
        const dObj = new Date(2026, 7, day)
        const dow = dObj.getDay()
        if (dow === 0 && idx % 2 === 0) {
          html += `<td>OFF</td>`
        } else if (day % 3 === 0) {
          html += `<td>16:50 - 22:02</td>`
        } else if (day % 2 === 0) {
          html += `<td>11:54 - 17:00</td>`
        } else {
          html += `<td>08:25 - 12:00</td>`
        }
      }
      html += `</tr>`
    })

    html += `</table></body></html>`

    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `File_Mau_Cham_Cong_Thang_08_2026_Homies.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleExportExcel = () => {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`
    html += `<head><meta charset="utf-8"><style>
      table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
      th { background-color: #001D3D; color: #FFFFFF; font-weight: bold; padding: 8px; border: 1px solid #CCCCCC; text-align: center; }
      td { border: 1px solid #CCCCCC; padding: 6px; vertical-align: top; }
      .emp-name { font-weight: bold; color: #001D3D; }
      .hours { font-weight: bold; text-align: right; }
    </style></head><body><table>`
    html += `<tr><th>STT</th><th>Mã NV</th><th>Họ tên nhân viên</th><th>Chức vụ</th>`
    
    activeDatesList.forEach(w => {
      html += `<th>${w.dayLabel}</th>`
    })
    html += `<th>Tổng giờ công</th><th>Tổng số ca</th></tr>`

    tableRows.forEach((row, idx) => {
      html += `<tr><td>${idx + 1}</td><td>${row.employee.employee_code}</td><td class="emp-name">${row.employee.full_name}</td><td>${row.position?.name || ''}</td>`
      activeDatesList.forEach(w => {
        const slots = row.days[w.dateStr] || []
        const slotText = slots.map(s => `${s.actualIn || s.scheduledIn}-${s.actualOut || s.scheduledOut || 'QCO'} (${s.shiftName})`).join('<br/>')
        html += `<td>${slotText}</td>`
      })
      html += `<td class="hours">${row.totalHours}h</td><td class="hours">${row.totalShifts}</td></tr>`
    })

    html += `</table></body></html>`

    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = viewMode === 'week' 
      ? `Bang_Cham_Cong_Homies_Tuan_${weekNumber}_${yearNumber}.xls`
      : `Bang_Cham_Cong_Homies_Thang_${monthNumber}_${monthYear}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setToastMessage('Đã tải xuống file Excel Bảng chấm công!')
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleToggleLock = () => {
    setIsLocked(prev => !prev)
    setToastMessage(!isLocked ? 'Đã chốt & khóa dữ liệu chấm công!' : 'Đã mở khóa dữ liệu chấm công để chỉnh sửa.')
    setTimeout(() => setToastMessage(null), 3000)
  }

  if (!user || !isAuthenticated || !canManageAttendance) return null

  return (
    <AppShell showNav>
      <div className="w-full max-w-none space-y-4 pb-20 animate-fade-in font-sans">

        {/* ─── TOAST NOTIFICATION ─── */}
        {toastMessage && (
          <div className="fixed top-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-[#001D3D] text-white px-4 py-3 shadow-xl border border-blue-400/30 animate-slide-in-right">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span className="text-xs font-bold">{toastMessage}</span>
          </div>
        )}

        {/* ─── TẦNG 1: EXECUTIVE COMMAND HEADER ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-2xs w-full">
          <div className="w-full flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            
            {/* Cột trái: Breadcrumb + Tiêu đề + Badge trạng thái */}
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <span>HRM Homies</span>
                <ChevronRightSmall size={12} className="text-gray-400" />
                <span>Chấm công</span>
                <ChevronRightSmall size={12} className="text-gray-400" />
                <span className="text-[#2F6FA8] font-bold">Bảng chấm công</span>
              </div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-[#001D3D] tracking-tight">
                  {viewMode === 'week' ? 'Bảng chấm công theo tuần' : 'Bảng chấm công theo tháng'}
                </h1>
                
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border flex items-center gap-1.5 ${
                  isLocked 
                    ? 'bg-rose-50 text-rose-700 border-rose-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${isLocked ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                  {isLocked ? 'Đã khóa kỳ công' : 'Đang mở ghi nhận'}
                </span>

                <Link
                  href={`/schedule?storeId=${activeStoreId}`}
                  className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide border bg-blue-50 text-[#2F6FA8] border-blue-200 hover:bg-blue-100 transition flex items-center gap-1.5"
                  title="Bấm để xem Bảng phân ca lịch làm việc"
                >
                  <LinkIcon size={11} />
                  <span>Đã kết nối Lịch phân ca</span>
                </Link>
              </div>
            </div>

            {/* Cột phải: Bộ chọn Tuần/Tháng / Chi nhánh / Bộ phận + Nút Hành động */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Chọn Tuần / Tháng */}
              <div className="flex items-center rounded-xl bg-gray-100 p-1 border border-gray-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setViewMode('week')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition cursor-pointer ${
                    viewMode === 'week' ? 'bg-white text-[#001D3D] shadow-2xs font-bold' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <Calendar size={13} />
                  <span>Tuần</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('month')}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition cursor-pointer ${
                    viewMode === 'month' ? 'bg-white text-[#001D3D] shadow-2xs font-bold' : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  <CalendarDays size={13} />
                  <span>Tháng</span>
                </button>
              </div>

              {/* Điều hướng thời gian (Tuần hoặc Tháng) */}
              {viewMode === 'week' ? (
                <div className="flex items-center rounded-xl border border-gray-200 bg-white px-2 py-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setWeekOffset(w => w - 1)}
                    className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition cursor-pointer"
                    title="Tuần trước"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="px-2 text-center">
                    <div className="text-xs font-bold text-[#001D3D] flex items-center gap-1 justify-center">
                      <Calendar size={12} className="text-[#2F6FA8]" />
                      <span>Tuần {weekNumber}/{yearNumber}</span>
                    </div>
                    <div className="text-[10px] font-medium text-gray-400">{weekLabel}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWeekOffset(w => w + 1)}
                    className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition cursor-pointer"
                    title="Tuần sau"
                  >
                    <ChevronRight size={16} />
                  </button>
                  {weekOffset !== 0 && (
                    <button
                      type="button"
                      onClick={() => setWeekOffset(0)}
                      className="ml-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-[#2F6FA8] hover:bg-blue-100 transition cursor-pointer"
                    >
                      Hiện tại
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center rounded-xl border border-gray-200 bg-white px-2 py-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setMonthOffset(m => m - 1)}
                    className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition cursor-pointer"
                    title="Tháng trước"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <div className="px-3 text-center">
                    <div className="text-xs font-bold text-[#001D3D] flex items-center gap-1 justify-center">
                      <CalendarDays size={13} className="text-[#2F6FA8]" />
                      <span>{monthTitle}</span>
                    </div>
                    <div className="text-[10px] font-medium text-gray-400">{monthDates.length} ngày công</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMonthOffset(m => m + 1)}
                    className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition cursor-pointer"
                    title="Tháng sau"
                  >
                    <ChevronRight size={16} />
                  </button>
                  {monthOffset !== 0 && (
                    <button
                      type="button"
                      onClick={() => setMonthOffset(0)}
                      className="ml-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-[#2F6FA8] hover:bg-blue-100 transition cursor-pointer"
                    >
                      Tháng này
                    </button>
                  )}
                </div>
              )}

              {/* Chọn Chi nhánh */}
              <select
                value={activeStoreId}
                onChange={e => setActiveStoreId(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#2F6FA8]"
              >
                {getStoresList().map(store => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>

              {/* Chọn Bộ phận / Vị trí */}
              <select
                value={selectedPositionId}
                onChange={e => setSelectedPositionId(e.target.value)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-800 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#2F6FA8]"
              >
                <option value="ALL">Tất cả bộ phận</option>
                {mockPositions.map(pos => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name}
                  </option>
                ))}
              </select>

              {/* Nút Nhập Excel (Chuẩn giao diện Lịch làm việc) */}
              <button
                type="button"
                onClick={() => {
                  setShowImportModal(true)
                  setImportStep(1)
                  setSelectedFile(null)
                  setParsedRows([])
                  setParsedHeaders([])
                }}
                className="rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-[#2F6FA8] shadow-2xs hover:bg-blue-100 transition flex items-center gap-1.5 cursor-pointer"
                title="Nhập dữ liệu chấm công từ file Excel"
              >
                <UploadCloud size={15} />
                <span>Nhập Excel</span>
              </button>

              {/* Nút Xuất Excel */}
              <button
                type="button"
                onClick={handleExportExcel}
                className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-100 transition flex items-center gap-1.5 cursor-pointer"
                title="Tải bảng chấm công dạng Excel"
              >
                <FileSpreadsheet size={15} className="text-[#2F6FA8]" />
                <span>Xuất Excel</span>
              </button>

              {/* Nút Cài đặt Quy định Chấm công */}
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 shadow-2xs hover:bg-gray-50 hover:text-[#2F6FA8] transition flex items-center gap-1.5 cursor-pointer"
                title="Cài đặt quy định chấm công, dung sai &amp; GPS/WiFi"
              >
                <Sliders size={14} className="text-[#2F6FA8]" />
                <span>Cài đặt</span>
              </button>

              {/* Nút Khóa / Chốt công */}
              <button
                type="button"
                onClick={handleToggleLock}
                className={`rounded-xl px-3.5 py-2 text-xs font-bold text-white shadow-2xs transition flex items-center gap-1.5 cursor-pointer ${
                  isLocked 
                    ? 'bg-amber-600 hover:bg-amber-700' 
                    : 'bg-[#2F6FA8] hover:bg-[#1D3E61]'
                }`}
              >
                {isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                <span>{isLocked ? 'Mở khóa sửa công' : 'Chốt & Khóa kỳ công'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── TẦNG 2: DẢI 4 THẺ CHỈ SỐ VĨ MÔ ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Tổng Giờ Công */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">
                {viewMode === 'week' ? 'Tổng giờ công tuần' : 'Tổng giờ công tháng'}
              </span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#2F6FA8]">
                <Timer size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#001D3D]">
              {macroStats.totalHours}h
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 font-medium">
              <span>Đạt 98.4% so với định biên phân ca</span>
            </div>
          </div>

          {/* Card 2: Tỷ Lệ Đi Đúng Giờ */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Tỷ lệ đi đúng giờ</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {macroStats.onTimeRate}%
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
              <span>+2.8% so với kỳ trước đó</span>
            </div>
          </div>

          {/* Card 3: Ca Cần Xử Lý */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Ca cần rà soát / Quên check</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-rose-700">
              {macroStats.issuesCount} ca
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-rose-600 font-medium">
              <span>{macroStats.missingCount} quên check-out · {macroStats.issuesCount - macroStats.missingCount} đi trễ</span>
            </div>
          </div>

          {/* Card 4: Nhân Lực Hoạt Động */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Nhân sự có chấm công</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
                <Users size={16} />
              </div>
            </div>
            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-[#2F6FA8]">
              {macroStats.activeStaff}/{macroStats.totalStaff} NV
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-500 font-medium">
              <span>100% nhân sự chi nhánh có mặt</span>
            </div>
          </div>
        </div>

        {/* ─── TẦNG 3: BỘ CHÚ THÍCH TRẠNG THÁI & BẢNG CHẤM CÔNG (TUẦN & THÁNG) ─── */}
        <div className="space-y-3">
          
          {/* Thanh công cụ phụ: Ô tìm kiếm + Dải Legend trạng thái */}
          <div className="rounded-2xl border border-gray-100 bg-white p-3.5 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            
            {/* Ô tìm kiếm nhân viên */}
            <div className="relative w-full lg:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Tìm nhân viên theo tên, mã NV..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50/70 pl-9 pr-3 py-1.5 text-xs font-medium text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-[#2F6FA8] focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Dải Legend Trạng Thái Chấm Công */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-gray-600">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Đúng giờ</span>
              </span>

              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-900 border border-amber-200/60">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                <span>Không đúng giờ / Đi trễ</span>
              </span>

              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200/60">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                <span>Quên chấm công (QCO)</span>
              </span>

              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gray-50 text-gray-700 border border-gray-200/60">
                <span className="h-2 w-2 rounded-full bg-gray-400" />
                <span>Theo lịch / Chưa đến giờ</span>
              </span>

              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-50 text-[#2F6FA8] border border-blue-200/60">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                <span>Chờ duyệt</span>
              </span>

              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-purple-50 text-purple-800 border border-purple-200/60">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                <span>Đã xin nghỉ</span>
              </span>

              <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-gray-200 text-gray-500 text-[10px]">
                <span className="flex items-center gap-0.5">
                  <Edit3 size={11} className="text-gray-600" />
                  <span>Đã chỉnh sửa</span>
                </span>
                <span className="flex items-center gap-0.5">
                  <LinkIcon size={11} className="text-[#2F6FA8]" />
                  <span>Từ lịch ca</span>
                </span>
              </div>
            </div>
          </div>

          {/* ─── BẢNG LƯỚI CHẤM CÔNG MA TRẬN ─── */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
            
            {/* Dải Điều Hướng Phân Đoạn Ngày (Dành riêng cho View Tháng) */}
            {viewMode === 'month' && (
              <div className="flex flex-wrap items-center justify-between gap-2.5 px-4 py-2.5 bg-slate-100/90 border-b border-gray-200">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-700 text-[11px] flex items-center gap-1">
                    <CalendarDays size={13} className="text-[#2F6FA8]" />
                    Phân đoạn ngày:
                  </span>
                  <div className="inline-flex rounded-xl bg-white p-0.5 border border-gray-200 shadow-2xs font-extrabold text-[11px]">
                    <button
                      type="button"
                      onClick={() => setMainMonthTab('1-10')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        mainMonthTab === '1-10' ? 'bg-[#001D3D] text-white shadow-xs' : 'text-slate-600 hover:text-[#001D3D]'
                      }`}
                    >
                      Ngày 01 - 10
                    </button>
                    <button
                      type="button"
                      onClick={() => setMainMonthTab('11-20')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        mainMonthTab === '11-20' ? 'bg-[#001D3D] text-white shadow-xs' : 'text-slate-600 hover:text-[#001D3D]'
                      }`}
                    >
                      Ngày 11 - 20
                    </button>
                    <button
                      type="button"
                      onClick={() => setMainMonthTab('21-31')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        mainMonthTab === '21-31' ? 'bg-[#001D3D] text-white shadow-xs' : 'text-slate-600 hover:text-[#001D3D]'
                      }`}
                    >
                      Ngày 21 - 31
                    </button>
                    <button
                      type="button"
                      onClick={() => setMainMonthTab('all')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                        mainMonthTab === 'all' ? 'bg-[#2F6FA8] text-white shadow-xs' : 'text-slate-600 hover:text-[#001D3D]'
                      }`}
                    >
                      Toàn bộ ({monthDates.length} ngày)
                    </button>
                  </div>
                </div>

                {/* Nút Cuộn Trái / Phải Nhanh */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-slate-500 hidden sm:inline">Cuộn bảng:</span>
                  <button
                    type="button"
                    onClick={() => handleScrollMainTable('left')}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                    title="Cuộn sang trái"
                  >
                    <ChevronLeft size={14} />
                    <span>Trước</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScrollMainTable('right')}
                    className="px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-2xs transition flex items-center gap-1 cursor-pointer"
                    title="Cuộn sang phải"
                  >
                    <span>Tiếp</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}

            <div 
              ref={mainTableScrollRef}
              className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#2F6FA8] scrollbar-track-slate-100"
            >
              <table className={`w-full text-left border-collapse ${
                viewMode === 'month' && mainMonthTab === 'all' ? 'min-w-[3400px]' : viewMode === 'month' ? 'min-w-[1250px]' : 'min-w-[1050px]'
              }`}>
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80 text-[11px] font-bold text-[#001D3D] uppercase tracking-wider">
                    <th className="py-3 px-3 w-10 text-center border-r border-gray-200/70">#</th>
                    <th className="py-3 px-4 w-48 border-r border-gray-200/70 sticky left-0 bg-gray-50/95 z-10 shadow-xs">
                      Nhân viên
                    </th>
                    {activeDatesList.map(d => (
                      <th
                        key={d.dateStr}
                        className={`py-3 px-2 text-center border-r border-gray-200/70 ${
                          viewMode === 'week' ? 'min-w-[130px]' : 'min-w-[100px]'
                        } ${d.isToday ? 'bg-blue-50/70 text-[#2F6FA8]' : ''}`}
                      >
                        <div className="font-bold">{d.dayLabel}</div>
                        {d.isToday && (
                          <span className="inline-block px-1.5 py-0.2 rounded-sm bg-[#2F6FA8] text-white text-[9px] font-bold mt-0.5">
                            Hôm nay
                          </span>
                        )}
                      </th>
                    ))}
                    <th className="py-3 px-3 w-28 text-center bg-gray-100/60 sticky right-0 bg-gray-100/95 z-10 shadow-xs">Tổng công</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {tableRows.length === 0 ? (
                    <tr>
                      <td colSpan={activeDatesList.length + 3} className="py-12 text-center text-gray-400 font-medium">
                        Không tìm thấy nhân viên nào phù hợp với bộ lọc hiện tại.
                      </td>
                    </tr>
                  ) : (
                    tableRows.map((row, index) => (
                      <tr
                        key={row.employee.id}
                        className="hover:bg-blue-50/20 transition-colors group"
                      >
                        {/* Cột 1: STT */}
                        <td className="py-3 px-2 text-center text-gray-500 font-medium border-r border-gray-100">
                          {index + 1}
                        </td>

                        {/* Cột 2: Thông tin nhân viên (Click vào tên -> Mở Modal Thông Tin Công) */}
                        <td 
                          onClick={() => {
                            const firstDate = activeDatesList[0].dateStr
                            const empSlots = row.days[firstDate] || []
                            const slotToShow = empSlots[0] || {
                              id: `att-synth-${row.employee.id}-${firstDate}`,
                              shiftName: 'Ca Tối [17:00-22:00]',
                              scheduledIn: '17:00',
                              scheduledOut: '22:00',
                              actualIn: '16:50',
                              actualOut: '22:02',
                              status: 'on_time',
                              totalHours: 5.0,
                              distanceInMeters: 19,
                              distanceOutMeters: 14,
                              sourceType: 'self',
                            }
                            handleOpenWorkInfoModal(slotToShow, row.employee, firstDate, activeDatesList[0].dayLabel)
                          }}
                          className="py-3 px-4 border-r border-gray-200/70 sticky left-0 bg-white group-hover:bg-[#F9FBFC] z-10 shadow-xs cursor-pointer"
                          title="Bấm vào tên nhân viên để xem Thông tin công"
                        >
                          <div>
                            <div className="font-bold text-[#001D3D] text-xs text-[#2F6FA8] hover:underline transition">
                              {row.employee.full_name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] font-mono text-gray-500 font-bold">
                                {row.employee.employee_code || `NV00${index + 1}`}
                              </span>
                              {row.position && (
                                <span className="text-[10px] text-[#2F6FA8] font-semibold">
                                  • {row.position.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Cột 3+: Danh sách ngày (Tuần hoặc Tháng) */}
                        {activeDatesList.map(w => {
                          const slots = row.days[w.dateStr] || []

                          return (
                            <td
                              key={w.dateStr}
                              className={`border-r border-gray-100 align-top transition-colors p-1.5 ${
                                w.isToday ? 'bg-blue-50/20' : ''
                              }`}
                            >
                              <div className="space-y-1 min-h-[52px] flex flex-col justify-between">
                                <div className="space-y-1">
                                  {slots.map(slot => {
                                    let badgeStyle = 'border-gray-200 bg-gray-50 text-gray-700'
                                    let timeText = `${slot.actualIn || slot.scheduledIn} - ${slot.actualOut || slot.scheduledOut}`

                                    if (slot.status === 'on_time') {
                                      badgeStyle = 'border-emerald-300 bg-[#DDF4EC] text-emerald-900 hover:bg-[#c9eee1]'
                                    } else if (slot.status === 'late' || slot.status === 'early') {
                                      badgeStyle = 'border-amber-300 bg-[#FEF3C7] text-amber-900 hover:bg-[#fde68a]'
                                    } else if (slot.status === 'missing_checkout') {
                                      badgeStyle = 'border-rose-300 bg-[#FFE4E6] text-rose-900 hover:bg-[#fecdd3]'
                                      timeText = `${slot.actualIn || slot.scheduledIn} - QCO`
                                    } else if (slot.status === 'working') {
                                      badgeStyle = 'border-amber-300 bg-[#FEF3C7] text-amber-900 animate-pulse'
                                      timeText = 'Đang làm việc'
                                    } else if (slot.status === 'leave') {
                                      badgeStyle = 'border-purple-300 bg-purple-50 text-purple-900'
                                      timeText = 'Nghỉ phép'
                                    } else if (slot.isFromSchedule) {
                                      badgeStyle = 'border-gray-200/90 bg-gray-50/80 text-gray-600 hover:border-gray-300'
                                    }

                                    return (
                                      <button
                                        key={slot.id}
                                        type="button"
                                        onClick={() => handleOpenWorkInfoModal(slot, row.employee, w.dateStr, w.dayLabel)}
                                        className={`w-full rounded-xl border p-1 text-center text-xs font-mono font-bold tabular-nums shadow-2xs transition cursor-pointer flex flex-col items-center justify-center relative ${badgeStyle}`}
                                        title={`${slot.shiftName} (${slot.scheduledIn} - ${slot.scheduledOut}) - Bấm để xem chi tiết`}
                                      >
                                        <div className="truncate w-full text-[10px] sm:text-[10.5px] leading-tight flex items-center justify-center gap-1">
                                          {slot.isOvertime && (
                                            <span className="inline-flex items-center text-amber-700 text-[9px] font-bold" title="Tăng ca">
                                              ⚡
                                            </span>
                                          )}
                                          <span>{timeText}</span>
                                        </div>
                                        {slot.isEdited && (
                                          <div className="absolute top-0.5 right-1 text-gray-500" title="Đã chỉnh sửa">
                                            <Edit3 size={8} />
                                          </div>
                                        )}
                                        {slot.isFromSchedule && (
                                          <div className="text-[9px] text-gray-400 font-sans font-medium mt-0.2 truncate w-full">
                                            {slot.shiftName}
                                          </div>
                                        )}
                                      </button>
                                    )
                                  })}
                                </div>

                                {!isLocked && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddModal(row.employee, w.dateStr, w.dayLabel)}
                                    className="w-full rounded-lg border border-dashed border-gray-200 bg-white hover:border-[#2F6FA8] hover:bg-blue-50/40 py-1 text-center text-gray-400 hover:text-[#2F6FA8] cursor-pointer transition flex items-center justify-center opacity-60 hover:opacity-100"
                                    title={`Thêm ca chấm công cho ${row.employee.full_name} (${w.dayLabel})`}
                                  >
                                    <Plus size={11} strokeWidth={2.5} />
                                  </button>
                                )}
                              </div>
                            </td>
                          )
                        })}

                        {/* Cột Tổng công */}
                        <td className="py-3 px-3 text-center bg-gray-50/50 sticky right-0 bg-gray-50/95 z-10 shadow-xs">
                          <div className="font-mono tabular-nums font-bold text-xs text-[#001D3D]">
                            {row.totalHours}h
                          </div>
                          <div className="text-[10px] text-gray-500 font-medium mt-0.5">
                            {row.totalShifts} ca làm
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ─── MODAL 1: THÔNG TIN CÔNG (CHUẨN 100% THEO ẢNH 2 ĐÍNH KÈM) ─── */}
        {viewingWorkInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col animate-scale-in border border-gray-200">
              
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-white">
                <h2 className="text-base font-bold text-gray-900">
                  Thông tin công
                </h2>
                <button
                  type="button"
                  onClick={() => setViewingWorkInfo(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Bảng danh sách trường thông tin */}
              <div className="p-6 divide-y divide-gray-100 text-xs">
                <div className="py-3 flex items-center justify-between">
                  <span className="font-bold text-gray-700 w-1/3">Ngày tính công</span>
                  <span className="font-medium text-gray-900 w-2/3">{viewingWorkInfo.dateStr.split('-').reverse().join('/')}</span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <span className="font-bold text-gray-700 w-1/3">Nhân viên</span>
                  <span className="font-semibold text-[#2F6FA8] w-2/3 hover:underline cursor-pointer">
                    {viewingWorkInfo.employee.full_name}
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <span className="font-bold text-gray-700 w-1/3">Ca làm việc</span>
                  <span className="font-semibold text-[#2F6FA8] w-2/3">
                    {viewingWorkInfo.slot.shiftName}
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <span className="font-bold text-gray-700 w-1/3">Giờ check-in tính công</span>
                  <div className="w-2/3 flex items-center justify-between">
                    <span className="font-mono font-bold text-[#2F6FA8]">
                      {viewingWorkInfo.slot.actualIn || viewingWorkInfo.slot.scheduledIn}
                    </span>
                    <span className="text-emerald-700 font-semibold text-[11px]">
                      {viewingWorkInfo.slot.locationNoteIn || `Cách chi nhánh ${viewingWorkInfo.slot.distanceInMeters || 19}m`}
                    </span>
                  </div>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <span className="font-bold text-gray-700 w-1/3">Giờ check-out tính công</span>
                  <div className="w-2/3 flex items-center justify-between">
                    <span className="font-mono font-bold text-[#2F6FA8]">
                      {viewingWorkInfo.slot.actualOut || viewingWorkInfo.slot.scheduledOut || 'Chưa check-out'}
                    </span>
                    {viewingWorkInfo.slot.actualOut && (
                      <span className="text-emerald-700 font-semibold text-[11px]">
                        {viewingWorkInfo.slot.locationNoteOut || `Cách chi nhánh ${viewingWorkInfo.slot.distanceOutMeters || 14}m`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <span className="font-bold text-gray-700 w-1/3">Số giờ tính công</span>
                  <span className="font-mono font-bold text-gray-900 w-2/3">
                    {viewingWorkInfo.slot.totalHours || 5}
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <span className="font-bold text-gray-700 w-1/3">Xin ra ngoài trong ca</span>
                  <span className="font-medium text-gray-800 w-2/3">Không</span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <span className="font-bold text-gray-700 w-1/3">Trạng thái</span>
                  <span className={`w-2/3 font-bold ${
                    viewingWorkInfo.slot.status === 'on_time' 
                      ? 'text-emerald-700' 
                      : viewingWorkInfo.slot.status === 'missing_checkout'
                      ? 'text-rose-700'
                      : 'text-amber-700'
                  }`}>
                    {viewingWorkInfo.slot.status === 'on_time' ? 'Đúng giờ' : viewingWorkInfo.slot.status === 'missing_checkout' ? 'Quên chấm công' : 'Đi trễ / Không đúng giờ'}
                  </span>
                </div>

                <div className="py-3 flex items-center justify-between">
                  <span className="font-bold text-gray-700 w-1/3">Nguồn công</span>
                  <span className="font-medium text-gray-800 w-2/3">
                    {viewingWorkInfo.slot.sourceType === 'self' ? 'Nhân viên tự chấm công' : viewingWorkInfo.slot.isFromSchedule ? 'Đồng bộ từ Lịch phân ca' : 'Quản lý bổ sung'}
                  </span>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-white">
                <button
                  type="button"
                  onClick={handleDeleteWorkInfo}
                  className="rounded-xl bg-rose-500 hover:bg-rose-600 px-5 py-2 text-xs font-bold text-white shadow-2xs transition cursor-pointer"
                >
                  Xóa công
                </button>
                <button
                  type="button"
                  onClick={handleSwitchToEditModal}
                  className="rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] px-5 py-2 text-xs font-bold text-white shadow-2xs transition cursor-pointer"
                >
                  Sửa công
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ─── MODAL 2: SỬA CÔNG NGÀY... (CHUẨN 100% THEO ẢNH 1 ĐÍNH KÈM) ─── */}
        {editingWorkInfo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col animate-scale-in border border-gray-200">
              
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-white">
                <h2 className="text-base font-bold text-gray-900">
                  Sửa công ngày {editingWorkInfo.dateStr.split('-').reverse().join('/')}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingWorkInfo(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form sửa công chi tiết */}
              <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                {/* Nút bấm 1 chạm: Gán nhanh Ca phát sinh 18h */}
                <button
                  type="button"
                  onClick={() => {
                    setEditShiftName('Ca phát sinh [18:00-23:00]')
                    setEditStartTime('18:00')
                    setEditEndTime('23:00')
                    setEditReason('Huy động làm ca 18h do thiếu người (Ca phát sinh)')
                    setPenalizeMissIn(false)
                    setPenalizeMissOut(false)
                  }}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-300 p-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
                >
                  <Sparkles size={14} className="text-amber-600" />
                  <span>⚡ Gán nhanh: Ca phát sinh 18:00 - 23:00 (Miễn phạt đi trễ)</span>
                </button>

                <div>
                  <label className="font-bold text-gray-800 block mb-1.5">
                    Ca áp dụng <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editShiftName}
                    onChange={e => setEditShiftName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-xs font-semibold text-gray-900 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#2F6FA8]"
                  >
                    <option value="Ca phát sinh [18:00-23:00]">Ca phát sinh [18:00-23:00]</option>
                    <option value="Ca linh hoạt [Tự do]">Ca linh hoạt [Tự do]</option>
                    <option value="Tăng ca đột xuất (OT)">Tăng ca đột xuất (OT)</option>
                    <option value="Ca Tối [17:00-22:00]">Ca Tối [17:00-22:00]</option>
                    <option value="Ca Sáng [08:30-12:00]">Ca Sáng [08:30-12:00]</option>
                    <option value="Ca Trưa [12:00-17:00]">Ca Trưa [12:00-17:00]</option>
                    <option value="Ca Trưa Lẻ [12:00-15:00]">Ca Trưa Lẻ [12:00-15:00]</option>
                    <option value="KIỂM KHO [17:00-22:00]">KIỂM KHO [17:00-22:00]</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-bold text-gray-800 block mb-1.5">
                      Giờ bắt đầu <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editStartTime}
                        onChange={e => setEditStartTime(e.target.value)}
                        placeholder="16:50"
                        className="w-full rounded-xl border border-gray-300 bg-white pl-3.5 pr-8 py-2 text-xs font-mono font-bold text-gray-900 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#2F6FA8]"
                      />
                      <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-800 block mb-1.5">
                      Giờ kết thúc <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editEndTime}
                        onChange={e => setEditEndTime(e.target.value)}
                        placeholder="22:02"
                        className="w-full rounded-xl border border-gray-300 bg-white pl-3.5 pr-8 py-2 text-xs font-mono font-bold text-gray-900 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#2F6FA8]"
                      />
                      <Clock size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div className="rounded-xl bg-[#FFF8E8] border border-amber-200/80 p-3 text-xs text-amber-900 font-medium">
                  Hệ thống sẽ ghi nhận tổng số giờ làm việc theo thời gian chỉnh sửa.
                </div>

                <div>
                  <label className="font-bold text-gray-800 block mb-1.5">
                    Nhân viên cần bổ sung <span className="text-rose-500">*</span>
                  </label>
                  <div className="w-full rounded-xl border border-gray-300 bg-white p-2 min-h-[42px] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 rounded-lg bg-[#2F6FA8] text-white px-2.5 py-1 text-xs font-bold">
                      <span>{editingWorkInfo.employee.full_name}</span>
                      <button type="button" className="hover:opacity-80">
                        <X size={13} />
                      </button>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 rotate-90" />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-gray-800 block mb-1.5">
                    Lý do chỉnh sửa <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={editReason}
                    onChange={e => setEditReason(e.target.value)}
                    placeholder="Nhập lý do chỉnh sửa"
                    className="w-full rounded-xl border border-gray-300 bg-white p-3 text-xs font-medium text-gray-800 placeholder-gray-400 shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-[#2F6FA8]"
                  />
                </div>

                <div>
                  <label className="font-bold text-gray-800 block mb-1.5">Ảnh</label>
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/70 text-gray-400 hover:border-[#2F6FA8] hover:text-[#2F6FA8] cursor-pointer transition">
                    <ImageIcon size={22} />
                  </div>
                </div>

                <div className="space-y-2.5 pt-1">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={penalizeMissIn}
                      onChange={e => setPenalizeMissIn(e.target.checked)}
                      className="h-4 w-4 rounded-sm border-gray-300 text-[#2F6FA8] focus:ring-[#2F6FA8]"
                    />
                    <span className="text-xs font-semibold text-gray-700">Phạt quên check-in</span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={penalizeMissOut}
                      onChange={e => setPenalizeMissOut(e.target.checked)}
                      className="h-4 w-4 rounded-sm border-gray-300 text-[#2F6FA8] focus:ring-[#2F6FA8]"
                    />
                    <span className="text-xs font-semibold text-gray-700">Phạt quên check-out</span>
                  </label>
                </div>
              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 px-6 py-4 bg-white">
                <button
                  type="button"
                  onClick={() => setEditingWorkInfo(null)}
                  className="rounded-xl bg-slate-600 hover:bg-slate-700 px-5 py-2 text-xs font-bold text-white shadow-2xs transition cursor-pointer"
                >
                  Bỏ qua
                </button>
                <button
                  type="button"
                  onClick={handleSaveEditWorkInfo}
                  className="rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] px-5 py-2 text-xs font-bold text-white shadow-2xs transition cursor-pointer"
                >
                  Lưu lại
                </button>
              </div>

            </div>
          </div>
        )}

        {/* ─── MODAL 3: THÊM CA CHẤM CÔNG BÙ (+) ─── */}
        {addingSlotTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-xs p-4 animate-fade-in">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col animate-scale-in border border-gray-200">
              
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4 bg-white">
                <div>
                  <h2 className="text-base font-bold text-[#001D3D]">
                    Thêm ca chấm công bù
                  </h2>
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">
                    {addingSlotTarget.employee.full_name} • {addingSlotTarget.dayLabel}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddingSlotTarget(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form nhập */}
              <div className="p-6 space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-800 block mb-1">Tên ca làm việc:</label>
                  <select
                    value={addShiftName}
                    onChange={e => setAddShiftName(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#2F6FA8]"
                  >
                    <option value="Ca Sáng">Ca Sáng (08:30 - 12:00)</option>
                    <option value="Ca Trưa">Ca Trưa (12:00 - 17:00)</option>
                    <option value="Ca Tối">Ca Tối (17:00 - 22:00)</option>
                    <option value="Ca Trưa Lẻ">Ca Trưa Lẻ (12:00 - 15:00)</option>
                    <option value="KIỂM KHO">KIỂM KHO (17:00 - 22:00)</option>
                    <option value="Ca Tăng Cường">Ca Tăng Cường</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Giờ Check-in:</label>
                    <input
                      type="text"
                      value={addFormIn}
                      onChange={e => setAddFormIn(e.target.value)}
                      placeholder="08:30"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-mono font-bold text-center text-[#001D3D] focus:outline-hidden focus:ring-2 focus:ring-[#2F6FA8]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-700 block mb-1">Giờ Check-out:</label>
                    <input
                      type="text"
                      value={addFormOut}
                      onChange={e => setAddFormOut(e.target.value)}
                      placeholder="12:00"
                      className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-mono font-bold text-center text-[#001D3D] focus:outline-hidden focus:ring-2 focus:ring-[#2F6FA8]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">Lý do chấm công bù:</label>
                  <input
                    type="text"
                    value={addFormReason}
                    onChange={e => setAddFormReason(e.target.value)}
                    placeholder="VD: Quên điện thoại, chấm công thay ca..."
                    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-800 focus:outline-hidden focus:ring-2 focus:ring-[#2F6FA8]"
                  />
                </div>
              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4 bg-gray-50">
                <button
                  type="button"
                  onClick={() => setAddingSlotTarget(null)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  onClick={handleSaveAddSlot}
                  className="rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] px-5 py-2 text-xs font-bold text-white shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus size={15} />
                  <span>Xác nhận thêm ca</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── MODAL 4: NHẬP EXCEL 3 BƯỚC THÔNG MINH (100% GIAO DIỆN CHUẨN LỊCH LÀM VIỆC) ─── */}
        {showImportModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-xs p-2 sm:p-4 animate-fade-in overflow-y-auto">
            <div
              className={`w-full rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col animate-scale-in border border-slate-300 transition-all ${
                isModalMaximized ? 'max-w-[99vw] h-[96vh]' : 'max-w-7xl w-[96vw] h-[86vh] max-h-[86vh]'
              }`}
            >
              {/* Header Modal & Stepper 3 Tab bo tròn */}
              <div className="border-b border-gray-200 px-6 py-3.5 bg-[#001D3D] text-white shrink-0">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F6FA8]/40 border border-blue-400/30 text-blue-200">
                      <FileSpreadsheet size={18} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white leading-snug">
                        Nhập Bảng Chấm Công Từ File Excel (Smart Import)
                      </h2>
                      <p className="text-xs text-blue-200 font-medium">
                        Tự động nhận diện Tên nhân viên, Giờ làm việc, Đi đúng giờ &amp; Đi trễ từ iPOS
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsModalMaximized(prev => !prev)}
                      className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 hover:text-white transition cursor-pointer"
                      title={isModalMaximized ? 'Thu nhỏ' : 'Phóng to'}
                    >
                      {isModalMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowImportModal(false)}
                      className="rounded-lg p-1.5 text-blue-200 hover:bg-white/10 hover:text-white transition cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Stepper 3 Tab */}
                <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/60 p-1 text-xs font-bold text-center">
                  <div className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    importStep === 1 ? 'bg-white text-[#001D3D] shadow-xs font-extrabold' : 'text-slate-500'
                  }`}>
                    <Upload size={13} /> 1. Tải file Excel
                  </div>
                  <div className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    importStep === 2 ? 'bg-white text-[#001D3D] shadow-xs font-extrabold' : 'text-slate-500'
                  }`}>
                    <Sparkles size={13} className={importStep === 2 ? 'text-emerald-600' : ''} /> 2. Xem trước &amp; Khớp thông minh
                  </div>
                  <div className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                    importStep === 3 ? 'bg-white text-[#001D3D] shadow-xs font-extrabold' : 'text-slate-500'
                  }`}>
                    <CheckCircle2 size={13} className={importStep === 3 ? 'text-blue-600' : ''} /> 3. Xác nhận &amp; Lưu dữ liệu
                  </div>
                </div>
              </div>

              {/* ===== BƯỚC 1: UPLOAD FILE ===== */}
              {importStep === 1 && (
                <div className="p-6 space-y-4 overflow-y-auto">
                  <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-amber-600 shrink-0" />
                      <span>Tải file Excel mẫu chấm công chuẩn để xem cấu trúc ma trận 7 ngày:</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadSampleExcel}
                      className="shrink-0 rounded-xl bg-amber-600 hover:bg-amber-700 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <FileSpreadsheet size={13} /> Tải file mẫu .xls
                    </button>
                  </div>

                  <div
                    className="rounded-2xl border-2 border-dashed border-gray-300 p-10 text-center hover:border-[#2F6FA8] bg-gray-50/50 transition cursor-pointer"
                    onClick={() => document.getElementById('attendance-excel-input')?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault()
                      const file = e.dataTransfer.files?.[0]
                      if (file) handleFileSelected(file)
                    }}
                  >
                    <input
                      type="file"
                      accept=".csv, .xls, .xlsx"
                      id="attendance-excel-input"
                      multiple
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files?.[0]
                        if (file) handleFileSelected(file)
                      }}
                    />
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-[#2F6FA8] shadow-inner mb-2">
                      <Upload size={26} />
                    </div>
                    <div className="text-sm font-bold text-gray-700">
                      {selectedFile ? `Đã chọn: ${selectedFile.name}` : 'Kéo thả hoặc nhấn để chọn file Excel'}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1.5">
                       Hỗ trợ .csv, .xls, .xlsx — Hệ thống tự nhận diện chi nhánh &amp; khớp tên nhân viên
                    </div>
                    {importError && (
                      <div className="mx-auto mt-3 max-w-2xl rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-left text-xs font-semibold text-rose-800">
                        {importError}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===== BƯỚC 2: PREVIEW + MATCH THÔNG MINH ===== */}
              {importStep === 2 && parsedHeaders.length > 0 && (
                <div className="flex flex-col flex-1 overflow-hidden">
                  
                  {/* Dải 1: Banner Khớp Tháng & Chi Nhánh Thông Minh + Bộ Điều Hướng Ngày */}
                  <div className="px-5 py-2.5 bg-slate-100 border-b border-gray-200 shrink-0 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs">
                      
                      {/* Bộ chọn Cơ sở / Chi nhánh */}
                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-blue-200 shadow-2xs">
                        <Building2 size={13} className="text-[#2F6FA8]" />
                        <span className="font-bold text-slate-700 text-[11px]">Cơ sở:</span>
                        <select
                          value={importSelectedStoreId}
                          onChange={e => setImportSelectedStoreId(e.target.value)}
                          className="bg-transparent text-[#001D3D] text-[11px] font-extrabold focus:outline-hidden cursor-pointer"
                        >
                          {mockStores.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} {s.id === activeStoreId ? '(Đang xem)' : ''}
                            </option>
                          ))}
                        </select>
                        {autoDetectedStoreName && (
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5">
                            <Sparkles size={10} /> Khớp từ file: {autoDetectedStoreName}
                          </span>
                        )}
                      </div>

                      {/* Bộ chọn Tháng / Năm */}
                      <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shadow-2xs">
                        <CalendarDays size={13} className="text-emerald-700" />
                        <span className="font-bold text-slate-700 text-[11px]">Tháng:</span>
                        <select
                          value={`${importSelectedMonth}-${importSelectedYear}`}
                          onChange={e => {
                            const [m, y] = e.target.value.split('-').map(Number)
                            setImportSelectedMonth(m)
                            setImportSelectedYear(y)
                            const daysCount = new Date(y, m, 0).getDate()
                            const newMap: Record<number, string> = {}
                            for (let i = 1; i <= daysCount; i++) {
                              const dStr = String(i).padStart(2, '0')
                              const mStr = String(m).padStart(2, '0')
                              newMap[i] = `${y}-${mStr}-${dStr}`
                            }
                            setColumnMapping(newMap)
                          }}
                          className="bg-transparent text-emerald-900 text-[11px] font-extrabold focus:outline-hidden cursor-pointer"
                        >
                          <option value="8-2026">Tháng 08/2026 (31 ngày)</option>
                          <option value="9-2026">Tháng 09/2026 (30 ngày)</option>
                          <option value="10-2026">Tháng 10/2026 (31 ngày)</option>
                          <option value="11-2026">Tháng 11/2026 (30 ngày)</option>
                          <option value="12-2026">Tháng 12/2026 (31 ngày)</option>
                          <option value="7-2026">Tháng 07/2026 (31 ngày)</option>
                        </select>
                      </div>

                      {/* Bộ nút chuyển Tab ngày thực thụ */}
                      <div className="flex items-center rounded-xl bg-slate-200/80 p-1 border border-slate-300 text-xs font-bold shadow-2xs">
                        <button
                          type="button"
                          onClick={() => setPreviewDateTab('1-10')}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            previewDateTab === '1-10'
                              ? 'bg-[#001D3D] text-white shadow-xs font-black'
                              : 'text-slate-700 hover:text-[#001D3D]'
                          }`}
                        >
                          Ngày 01 - 10
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDateTab('11-20')}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            previewDateTab === '11-20'
                              ? 'bg-[#001D3D] text-white shadow-xs font-black'
                              : 'text-slate-700 hover:text-[#001D3D]'
                          }`}
                        >
                          Ngày 11 - 20
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDateTab('21-31')}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            previewDateTab === '21-31'
                              ? 'bg-[#001D3D] text-white shadow-xs font-black'
                              : 'text-slate-700 hover:text-[#001D3D]'
                          }`}
                        >
                          Ngày 21 - 31
                        </button>
                        <button
                          type="button"
                          onClick={() => setPreviewDateTab('all')}
                          className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                            previewDateTab === 'all'
                              ? 'bg-[#2F6FA8] text-white shadow-xs font-black'
                              : 'text-slate-700 hover:text-[#001D3D]'
                          }`}
                        >
                          Toàn bộ ({parsedHeaders.length - 1} ngày)
                        </button>
                      </div>

                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 px-3 py-1.5 text-xs font-extrabold flex items-center gap-1.5 shadow-2xs">
                        <CheckCircle2 size={14} className="text-emerald-600" />
                        <span>Khớp {parsedRows.filter((r, idx) => getEmpMatchDetail(idx, r[0] || '').emp !== null).length}/{parsedRows.length} nhân viên</span>
                      </span>
                    </div>
                  </div>

                  {/* Bảng Ma Trận Xem Trước và Khớp (Lọc hiển thị theo Tab Ngày đã chọn) */}
                  <div 
                    id="import-preview-scroll-container"
                    className="overflow-x-auto overflow-y-auto flex-1 p-4 bg-slate-50/60"
                  >
                    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xs">
                      <table className={`border-collapse text-[11px] ${previewDateTab === 'all' ? 'min-w-[2800px]' : 'w-full table-fixed'}`}>
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-[#001D3D] text-white shadow-sm">
                            <th className={`border-r border-slate-700 px-3 py-2 text-left font-extrabold sticky left-0 bg-[#001D3D] z-20 shadow-md ${
                              previewDateTab === 'all' ? 'min-w-[220px]' : 'w-[210px]'
                            }`}>
                              Nhân viên &amp; Trạng thái
                            </th>
                            {parsedHeaders.map((header, idx) => {
                              if (idx === 0) return null
                              
                              // Lọc theo Tab Ngày đang chọn
                              if (previewDateTab === '1-10' && (idx < 1 || idx > 10)) return null
                              if (previewDateTab === '11-20' && (idx < 11 || idx > 20)) return null
                              if (previewDateTab === '21-31' && (idx < 21 || idx > 31)) return null

                              const mappedDate = columnMapping[idx]
                              let dayNumberStr = ''
                              let dayOfWeekStr = ''

                              if (mappedDate) {
                                const parts = mappedDate.split('-')
                                dayNumberStr = parts[2] || `0${idx}`
                                const dObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
                                const dowArr = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
                                dayOfWeekStr = dowArr[dObj.getDay()]
                              } else {
                                const numMatch = header.match(/\d+/)
                                dayNumberStr = numMatch ? String(numMatch[0]).padStart(2, '0') : String(idx).padStart(2, '0')
                                dayOfWeekStr = header.includes('T2') ? 'T2' : header.includes('T3') ? 'T3' : header.includes('T4') ? 'T4' : header.includes('T5') ? 'T5' : header.includes('T6') ? 'T6' : header.includes('T7') ? 'T7' : header.includes('CN') ? 'CN' : `N${idx}`
                              }

                              return (
                                <th key={idx} className={`border-r border-slate-700 px-1 py-2 text-center font-extrabold whitespace-nowrap ${
                                  previewDateTab === 'all' ? 'min-w-[85px]' : ''
                                }`}>
                                  {/* Dòng 1: Cột ngày từ 01 tới cuối tháng */}
                                  <div className="text-[13px] font-mono font-black text-amber-300 tracking-wider">
                                    {dayNumberStr}
                                  </div>
                                  {/* Dòng 2: Thứ được map tương ứng */}
                                  <div className="text-[10px] font-extrabold text-emerald-300 mt-0.5">
                                    {dayOfWeekStr}
                                  </div>
                                </th>
                              )
                            })}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {parsedRows.map((row, rowIdx) => {
                            const rawEmpName = row[0] || ''
                            const matchInfo = getEmpMatchDetail(rowIdx, rawEmpName)

                            if (!matchInfo.cleanedName && matchInfo.status === 'empty') return null

                            return (
                              <tr key={rowIdx} className={`hover:bg-blue-50/40 transition ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                                {/* Cột 1: Thông tin nhân viên & Trạng thái (Cố định sticky bên trái) */}
                                <td className={`border-r border-gray-200 px-3 py-2 align-top bg-white sticky left-0 z-10 shadow-md ${
                                  previewDateTab === 'all' ? 'min-w-[220px]' : 'w-[210px]'
                                }`}>
                                  <div className="space-y-1">
                                    <div className="flex items-center justify-between gap-1">
                                      <div className="flex items-center gap-1.5 min-w-0">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2F6FA8] to-[#001D3D] text-white text-[9px] font-bold border border-blue-200 shadow-2xs">
                                          {matchInfo.emp?.full_name?.split(' ').pop()?.slice(0, 2).toUpperCase() || 'NV'}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-extrabold text-gray-900 text-[11px] truncate leading-tight">
                                            {matchInfo.emp ? matchInfo.emp.full_name : rawEmpName}
                                          </div>
                                          {matchInfo.emp && matchInfo.cleanedName !== matchInfo.emp.full_name && (
                                            <div className="text-[9px] text-slate-400 truncate">
                                              {rawEmpName}
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() => setEditingEmpRow(editingEmpRow === rowIdx ? null : rowIdx)}
                                        className="text-[10px] text-slate-400 hover:text-[#2F6FA8] font-bold p-0.5 rounded-md hover:bg-slate-100 transition cursor-pointer"
                                        title="Đổi nhân viên ghép"
                                      >
                                        <Pencil size={11} />
                                      </button>
                                    </div>

                                    <div className="flex items-center gap-1">
                                      <span className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-extrabold border ${matchInfo.badgeColor}`}>
                                        <CheckCircle2 size={9} /> {matchInfo.badgeLabel}
                                      </span>
                                    </div>

                                    {editingEmpRow === rowIdx && (
                                      <div className="pt-1 border-t border-gray-200">
                                        <select
                                          value={manualEmpMapping[rowIdx] || matchInfo.emp?.id || ''}
                                          onChange={e => {
                                            const empId = e.target.value
                                            if (empId) {
                                              saveEmpMappingMemory(matchInfo.cleanedName || rawEmpName, empId)
                                            }
                                            setManualEmpMapping(prev => ({ ...prev, [rowIdx]: empId }))
                                            setEditingEmpRow(null)
                                          }}
                                          className="w-full rounded-lg border border-blue-400 bg-blue-50 px-1 py-0.5 text-[9.5px] font-bold text-gray-800 focus:ring-1 focus:ring-[#2F6FA8]"
                                        >
                                          <option value="">-- Đổi NV khác --</option>
                                          {fullEmployeeList.map(e => (
                                            <option key={e.id} value={e.id}>
                                              {e.full_name} ({e.employee_code || 'NV'})
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    )}
                                  </div>
                                </td>

                                {/* Cột 2+: Thẻ Ca Làm Việc (Lọc theo Tab Ngày đang chọn) */}
                                {parsedHeaders.map((_, colIdx) => {
                                  if (colIdx === 0) return null

                                  // Lọc theo Tab Ngày đang chọn
                                  if (previewDateTab === '1-10' && (colIdx < 1 || colIdx > 10)) return null
                                  if (previewDateTab === '11-20' && (colIdx < 11 || colIdx > 20)) return null
                                  if (previewDateTab === '21-31' && (colIdx < 21 || colIdx > 31)) return null

                                  const cellValue = row[colIdx] || ''

                                  if (!cellValue || cellValue === '--' || cellValue === 'OFF') {
                                    return (
                                      <td key={colIdx} className="border-r border-gray-200 px-1 py-2 align-middle text-center text-gray-300 font-medium">
                                        —
                                      </td>
                                    )
                                  }

                                   const entries = splitIposAttendanceEntries(cellValue)

                                  return (
                                    <td key={colIdx} className={`border-r border-gray-200 p-1 align-top ${
                                      previewDateTab === 'all' ? 'min-w-[120px]' : ''
                                    }`}>
                                      <div className="space-y-1">
                                        {entries.map((entry, eIdx) => {
                                          const attendanceCell = parseIposAttendanceCell(entry)
                                          const isNoAttendance = attendanceCell?.kind === 'no_attendance'
                                          const isMissingCheckout = attendanceCell?.kind === 'missing_checkout'
                                          const isMissingCheckin = attendanceCell?.kind === 'missing_checkin'
                                          const isOvertime = entry.toLowerCase().includes('(tc)') || entry.toLowerCase().includes('tăng ca')
                                          let isLate = false
                                          let lateMinutes = 0
                                          let inTotalMin = 0

                                          if (attendanceCell?.kind === 'complete' && attendanceCell.actualIn) {
                                            const cIn = attendanceCell.actualIn
                                            const [inH, inM] = cIn.split(':').map(Number)
                                            inTotalMin = inH * 60 + inM

                                            const targetColDate = columnMapping[colIdx] || weekDates[colIdx - 1]?.dateStr
                                            const matchedEmpId = matchInfo.emp?.id || ''

                                            // Tra cứu Lịch phân ca xem có ca 18h hoặc ca phát sinh không
                                            const hasMatchingSchedule = user
                                              ? ScheduleService.getPublishedSchedulesForStore(user, activeStoreId, [targetColDate]).some(s =>
                                                (s.employee_id === matchedEmpId || s.employee_id === matchInfo.emp?.employee_code) &&
                                                (s.notes?.includes('phát sinh') || s.notes?.includes('linh hoạt') || (s.notes && s.notes.includes(cIn)))
                                              )
                                              : false

                                            if (hasMatchingSchedule || (inTotalMin >= 1065 && inTotalMin <= 1110)) {
                                              // Khung giờ 17:45 - 18:30 hoặc đã có ca phát sinh trên lịch => Đúng giờ!
                                              isLate = false
                                              lateMinutes = 0
                                            }
                                            // Ca sáng (chuẩn 08:30 = 510p): Vào từ 08:36 - 09:30 => Đi muộn
                                            else if (inTotalMin > 515 && inTotalMin <= 570) {
                                              isLate = true
                                              lateMinutes = inTotalMin - 510
                                            }
                                            // Ca trưa (chuẩn 12:00 = 720p): Vào từ 12:06 - 13:00 => Đi muộn
                                            else if (inTotalMin > 725 && inTotalMin <= 780) {
                                              isLate = true
                                              lateMinutes = inTotalMin - 720
                                            }
                                            // Ca tối (chuẩn 17:00 = 1020p): Vào từ 17:06 - 17:45 => Đi muộn
                                            else if (inTotalMin > 1025 && inTotalMin < 1065) {
                                              isLate = true
                                              lateMinutes = inTotalMin - 1020
                                            }
                                          }

                                          const isAdhoc = !isLate && (inTotalMin >= 1065 && inTotalMin <= 1110)

                                          return (
                                            <div
                                              key={eIdx}
                                              className={`rounded-lg border p-1 text-[9.5px] font-mono font-bold shadow-2xs leading-tight ${
                                                isNoAttendance
                                                  ? 'border-gray-300 bg-gray-100 text-gray-700'
                                                  : isMissingCheckin || isMissingCheckout
                                                    ? 'border-rose-300 bg-rose-50 text-rose-900'
                                                    : isLate
                                                      ? 'border-amber-400 bg-[#FEF3C7] text-amber-950 ring-1 ring-amber-300'
                                                      : isOvertime
                                                        ? 'border-amber-300 bg-amber-50 text-amber-950'
                                                        : isAdhoc
                                                          ? 'border-blue-300 bg-blue-50 text-blue-950'
                                                          : 'border-emerald-300 bg-[#DDF4EC] text-emerald-950'
                                              }`}
                                            >
                                              <div className="truncate font-semibold">
                                                {entry.replace('KCD', 'Không có chấm công').replace('QCO', 'Thiếu giờ ra').replace('QCI', 'Thiếu giờ vào')}
                                              </div>
                                              <div className="text-[8.5px] font-sans font-medium mt-0.5 flex items-center justify-between">
                                                {isNoAttendance ? (
                                                  <span className="text-gray-600 font-bold">Chỉ có lịch dự kiến</span>
                                                ) : isMissingCheckout ? (
                                                  <span className="text-rose-800 font-bold">Thiếu check-out</span>
                                                ) : isMissingCheckin ? (
                                                  <span className="text-rose-800 font-bold">Thiếu check-in</span>
                                                ) : isLate ? (
                                                  <span className="text-amber-900 font-extrabold flex items-center gap-0.5">
                                                    <AlertTriangle size={9} className="text-amber-600" /> Trễ {lateMinutes}p
                                                  </span>
                                                ) : isAdhoc ? (
                                                  <span className="text-blue-800 font-bold">✓ Ca phát sinh</span>
                                                ) : (
                                                  <span className="text-emerald-800">✓ Khớp</span>
                                                )}
                                                {isOvertime && <span className="text-amber-800 font-bold text-[8px] bg-amber-100 px-1 rounded">Tăng ca</span>}
                                              </div>
                                            </div>
                                          )
                                        })}
                                      </div>
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ===== BƯỚC 3: XÁC NHẬN & LƯU DỮ LIỆU ===== */}
              {importStep === 3 && (
                <div className="p-6 space-y-4 text-xs overflow-y-auto">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shrink-0 shadow-2xs">
                      <CheckCheck size={20} />
                    </div>
                    <div>
                      <div className="text-sm font-bold">Dữ liệu đã được chuẩn bị đầy đủ!</div>
                      <div className="text-xs text-emerald-800 font-medium">
                        Hệ thống đã khớp <strong>{parsedRows.length} nhân viên</strong> và tự động tính toán tổng số giờ công để ghi nhận vào Bảng chấm công.
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2">
                    <div className="font-bold text-gray-800">Tóm tắt nạp dữ liệu:</div>
                    <ul className="list-disc list-inside space-y-1 text-gray-600">
                      <li>Cơ sở áp dụng: <strong>{mockStores.find(s => s.id === importSelectedStoreId)?.name || 'Hồ Bá Phấn'}</strong></li>
                      <li>Kỳ chấm công: <strong>Tháng {String(importSelectedMonth).padStart(2, '0')}/{importSelectedYear}</strong></li>
                      <li>Số lượng nhân sự được ghi nhận công: <strong>{parsedRows.length} nhân viên</strong></li>
                      <li>Toàn bộ số giờ thực làm sẽ được cập nhật tự động sang <strong>Bảng Lương (`/payroll`)</strong>.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Footer Modal */}
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 bg-slate-50">
                {importStep === 1 ? (
                  <button
                    type="button"
                    onClick={() => setShowImportModal(false)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  >
                    Đóng
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setImportStep(s => (s - 1) as 1 | 2 | 3)}
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer flex items-center gap-1"
                  >
                    <ChevronLeft size={14} />
                    <span>Quay lại</span>
                  </button>
                )}

                {importStep === 1 ? (
                  <button
                    type="button"
                    disabled={parsedRows.length === 0 || parsedHeaders.length <= 1 || Boolean(importError)}
                    onClick={() => setImportStep(2)}
                    className={`rounded-xl px-5 py-2 text-xs font-bold text-white shadow-2xs transition flex items-center gap-1.5 cursor-pointer ${
                      parsedRows.length > 0 && parsedHeaders.length > 1 && !importError
                        ? 'bg-[#2F6FA8] hover:bg-[#1D3E61]'
                        : 'bg-gray-300 cursor-not-allowed text-gray-500'
                    }`}
                  >
                    <span>Tiếp tục: Xem trước &amp; Khớp</span>
                    <ChevronRight size={14} />
                  </button>
                ) : importStep === 2 ? (
                  <button
                    type="button"
                    onClick={() => setImportStep(3)}
                    className="rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] px-5 py-2 text-xs font-bold text-white shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Tiếp tục: Xác nhận nạp</span>
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isImporting}
                    onClick={handleExecuteSmartImport}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-6 py-2 text-xs font-bold text-white shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileCheck2 size={16} />
                    <span>{isImporting ? 'Đang nạp dữ liệu...' : 'Xác nhận & Lưu dữ liệu vào Bảng Chấm Công'}</span>
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ─── MODAL CÀI ĐẶT QUY ĐỊNH CHẤM CÔNG (CHUẨN DESIGN_RULE_HOMIES_FINAL.md - 0 EMOJI) ─── */}
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in font-sans">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col animate-scale-in border border-gray-200">
              
              {/* Header Modal */}
              <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-white">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#2F6FA8]">
                    <Sliders size={18} />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#001D3D] tracking-tight">
                      Cài đặt Quy định Chấm công
                    </h2>
                    <p className="text-[11px] text-gray-500 font-medium">
                      Cấu hình dung sai đi muộn, định vị GPS, WiFi và quy tắc phê duyệt
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Dải Tabs Điều Hướng Cài Đặt */}
              <div className="flex items-center gap-1 border-b border-gray-200/80 bg-slate-50/80 px-6 pt-2 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSettingsActiveTab('tolerance')}
                  className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition cursor-pointer ${
                    settingsActiveTab === 'tolerance'
                      ? 'border-[#2F6FA8] text-[#2F6FA8] bg-white rounded-t-lg'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Clock size={14} />
                  <span>Dung sai &amp; Khung giờ</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsActiveTab('verification')}
                  className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition cursor-pointer ${
                    settingsActiveTab === 'verification'
                      ? 'border-[#2F6FA8] text-[#2F6FA8] bg-white rounded-t-lg'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <MapPin size={14} />
                  <span>Định vị GPS &amp; WiFi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsActiveTab('qco')}
                  className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition cursor-pointer ${
                    settingsActiveTab === 'qco'
                      ? 'border-[#2F6FA8] text-[#2F6FA8] bg-white rounded-t-lg'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <ShieldCheck size={14} />
                  <span>Quên chấm công &amp; Duyệt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSettingsActiveTab('links')}
                  className={`flex items-center gap-1.5 border-b-2 px-3.5 py-2.5 transition cursor-pointer ${
                    settingsActiveTab === 'links'
                      ? 'border-[#2F6FA8] text-[#2F6FA8] bg-white rounded-t-lg'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <ExternalLink size={14} />
                  <span>Liên kết cài đặt</span>
                </button>
              </div>

              {/* Nội Dung Từng Tab Cài Đặt */}
              <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto text-xs">
                
                {/* TAB 1: DUNG SAI & KHUNG GIỜ */}
                {settingsActiveTab === 'tolerance' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-900 text-xs">Dung sai cho phép đến muộn</div>
                          <div className="text-[11px] text-gray-500 font-medium">
                            Khoảng thời gian cho phép nhân viên check-in trễ vẫn được tính là Đúng giờ
                          </div>
                        </div>
                        <select
                          value={attGracePeriodMinutes}
                          onChange={e => setAttGracePeriodMinutes(Number(e.target.value))}
                          className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#001D3D] focus:outline-hidden focus:ring-2 focus:ring-[#2F6FA8]"
                        >
                          <option value={0}>0 phút (Nghiêm ngặt)</option>
                          <option value={5}>5 phút (Khuyên dùng)</option>
                          <option value={10}>10 phút</option>
                          <option value={15}>15 phút</option>
                        </select>
                      </div>

                      <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-900 text-xs">Mở cổng Check-in trước ca</div>
                          <div className="text-[11px] text-gray-500 font-medium">
                            Thời gian cho phép nhân viên bấm check-in trước khi ca bắt đầu
                          </div>
                        </div>
                        <select
                          value={attEarlyCheckinMinutes}
                          onChange={e => setAttEarlyCheckinMinutes(Number(e.target.value))}
                          className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#001D3D] focus:outline-hidden focus:ring-2 focus:ring-[#2F6FA8]"
                        >
                          <option value={15}>15 phút</option>
                          <option value={30}>30 phút (Tiêu chuẩn)</option>
                          <option value={60}>60 phút</option>
                        </select>
                      </div>

                      <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-gray-900 text-xs">Thời gian tối đa Check-out sau ca</div>
                          <div className="text-[11px] text-gray-500 font-medium">
                            Quá thời gian này chưa check-out sẽ tự động tính là Quên chấm công (QCO)
                          </div>
                        </div>
                        <select
                          value={attLateCheckoutMinutes}
                          onChange={e => setAttLateCheckoutMinutes(Number(e.target.value))}
                          className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#001D3D] focus:outline-hidden focus:ring-2 focus:ring-[#2F6FA8]"
                        >
                          <option value={15}>15 phút</option>
                          <option value={30}>30 phút (Tiêu chuẩn)</option>
                          <option value={60}>60 phút</option>
                        </select>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                      <div className="font-bold text-gray-900 text-xs">Quy tắc làm tròn giờ công</div>
                      <div className="text-[11px] text-gray-500 font-medium mb-2">
                        Phương thức tính toán tổng số giờ công thực tế từ giờ Check-in và Check-out
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setAttRoundingMode('none')}
                          className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                            attRoundingMode === 'none'
                              ? 'border-[#2F6FA8] bg-blue-50/50 text-[#2F6FA8]'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold text-xs">Chính xác</div>
                          <div className="text-[10px] text-gray-500">Tính theo từng phút lẻ</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttRoundingMode('15min')}
                          className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                            attRoundingMode === '15min'
                              ? 'border-[#2F6FA8] bg-blue-50/50 text-[#2F6FA8]'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold text-xs">Mốc 15 phút</div>
                          <div className="text-[10px] text-gray-500">Làm tròn về 0.25h</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAttRoundingMode('30min')}
                          className={`rounded-xl border p-2.5 text-left transition cursor-pointer ${
                            attRoundingMode === '30min'
                              ? 'border-[#2F6FA8] bg-blue-50/50 text-[#2F6FA8]'
                              : 'border-gray-200 bg-white text-gray-700 hover:bg-slate-50'
                          }`}
                        >
                          <div className="font-bold text-xs">Mốc 30 phút</div>
                          <div className="text-[10px] text-gray-500">Làm tròn về 0.5h</div>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ĐỊNH VỊ GPS & WIFI */}
                {settingsActiveTab === 'verification' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                            <MapPin size={14} className="text-[#2F6FA8]" />
                            <span>Bắt buộc GPS trong bán kính cửa hàng</span>
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium">
                            Chặn nhân viên chấm công khi ở ngoài khoảng cách cho phép
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={attRequireGps}
                          onChange={e => setAttRequireGps(e.target.checked)}
                          className="h-4 w-4 rounded-sm border-gray-300 text-[#2F6FA8] focus:ring-[#2F6FA8] cursor-pointer"
                        />
                      </div>

                      {attRequireGps && (
                        <div className="pl-6 border-l-2 border-blue-200 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-gray-700">Bán kính GPS hợp lệ:</span>
                          <select
                            value={attGpsRadiusMeters}
                            onChange={e => setAttGpsRadiusMeters(Number(e.target.value))}
                            className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-1 text-xs font-bold text-[#001D3D]"
                          >
                            <option value={50}>50 mét (Chính xác cao)</option>
                            <option value={100}>100 mét (Khuyên dùng)</option>
                            <option value={200}>200 mét</option>
                          </select>
                        </div>
                      )}

                      <div className="border-t border-gray-100 pt-3.5 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                            <Wifi size={14} className="text-[#2F6FA8]" />
                            <span>Bắt buộc kết nối đúng WiFi cửa hàng</span>
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium">
                            Chỉ chấp nhận chấm công khi điện thoại kết nối router WiFi nội bộ quán
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={attRequireWifi}
                          onChange={e => setAttRequireWifi(e.target.checked)}
                          className="h-4 w-4 rounded-sm border-gray-300 text-[#2F6FA8] focus:ring-[#2F6FA8] cursor-pointer"
                        />
                      </div>

                      <div className="border-t border-gray-100 pt-3.5 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-bold text-gray-900 text-xs flex items-center gap-1.5">
                            <Camera size={14} className="text-gray-600" />
                            <span>Chụp ảnh chân dung xác thực (Selfie Photo)</span>
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium">
                            Yêu cầu nhân viên chụp ảnh khuôn mặt khi check-in để chống chấm công hộ
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={attRequirePhoto}
                          onChange={e => setAttRequirePhoto(e.target.checked)}
                          className="h-4 w-4 rounded-sm border-gray-300 text-[#2F6FA8] focus:ring-[#2F6FA8] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: QUÊN CHẤM CÔNG & PHÊ DUYỆT */}
                {settingsActiveTab === 'qco' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3.5">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-bold text-gray-900 text-xs">Tự động gắn cờ Quên chấm công (QCO)</div>
                          <div className="text-[11px] text-gray-500 font-medium">
                            Gửi thông báo nhắc nhở nhân viên khi thiếu dữ liệu giờ vào hoặc giờ ra
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={attAutoQcoNotice}
                          onChange={e => setAttAutoQcoNotice(e.target.checked)}
                          className="h-4 w-4 rounded-sm border-gray-300 text-[#2F6FA8] focus:ring-[#2F6FA8] cursor-pointer"
                        />
                      </div>

                      <div className="border-t border-gray-100 pt-3.5 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-bold text-gray-900 text-xs">Cho phép nhân viên tự tạo đơn giải trình</div>
                          <div className="text-[11px] text-gray-500 font-medium">
                            Nhân viên có thể gửi yêu cầu điều chỉnh giờ công qua mục Yêu cầu
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={attAllowSelfRequest}
                          onChange={e => setAttAllowSelfRequest(e.target.checked)}
                          className="h-4 w-4 rounded-sm border-gray-300 text-[#2F6FA8] focus:ring-[#2F6FA8] cursor-pointer"
                        />
                      </div>

                      <div className="border-t border-gray-100 pt-3.5 flex items-center justify-between">
                        <div className="space-y-0.5">
                          <div className="font-bold text-gray-900 text-xs">Cấp phê duyệt đơn sửa công</div>
                          <div className="text-[11px] text-gray-500 font-medium">
                            Số tầng quản lý cần phê duyệt trước khi giờ công được ghi nhận chính thức
                          </div>
                        </div>
                        <select
                          value={attApprovalLevel}
                          onChange={e => setAttApprovalLevel(Number(e.target.value) as 1 | 2)}
                          className="rounded-lg border border-gray-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-[#001D3D]"
                        >
                          <option value={1}>1 cấp (Cửa hàng trưởng duyệt)</option>
                          <option value={2}>2 cấp (Cửa hàng trưởng + Quản lý khu vực)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: LIÊN KẾT CÀI ĐẶT CHUYÊN SÂU */}
                {settingsActiveTab === 'links' && (
                  <div className="space-y-3 animate-fade-in">
                    <div className="text-[11px] text-gray-500 font-medium mb-1">
                      Các phân hệ cấu hình chuyên sâu liên quan trực tiếp đến nghiệp vụ chấm công:
                    </div>

                    <Link
                      href="/settings/schedule-rules/shifts"
                      className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white hover:border-[#2F6FA8] hover:bg-blue-50/20 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                          <Clock size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-xs group-hover:text-[#2F6FA8] transition">
                            Cấu hình Khung Ca Làm Việc (Shifts)
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Thiết lập giờ ca Sáng, Ca Chiều, Ca Tối và định mức giờ công
                          </div>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-gray-400 group-hover:text-[#2F6FA8]" />
                    </Link>

                    <Link
                      href="/settings/wifi"
                      className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white hover:border-[#2F6FA8] hover:bg-blue-50/20 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700">
                          <Wifi size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-xs group-hover:text-[#2F6FA8] transition">
                            Cài đặt Router WiFi Check-in Chi Nhánh
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Quản lý danh sách tên mạng WiFi (SSID/BSSID) cho từng cửa hàng
                          </div>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-gray-400 group-hover:text-[#2F6FA8]" />
                    </Link>

                    <Link
                      href="/settings/organization?tab=branches"
                      className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white hover:border-[#2F6FA8] hover:bg-blue-50/20 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-700">
                          <MapPin size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-xs group-hover:text-[#2F6FA8] transition">
                            Cài đặt Tọa độ GPS Chi Nhánh
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Cập nhật Kinh độ, Vĩ độ và địa chỉ chuẩn 4 cấp của chuỗi cửa hàng
                          </div>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-gray-400 group-hover:text-[#2F6FA8]" />
                    </Link>

                    <Link
                      href="/settings/payroll"
                      className="flex items-center justify-between p-3.5 rounded-xl border border-gray-200 bg-white hover:border-[#2F6FA8] hover:bg-blue-50/20 transition group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                          <FileSpreadsheet size={16} />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 text-xs group-hover:text-[#2F6FA8] transition">
                            Cài đặt Hệ số Tăng ca (OT) &amp; Phạt Lương
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Hệ số tính tiền lương tăng ca ngày thường, cuối tuần và quy tắc trừ lương đi muộn
                          </div>
                        </div>
                      </div>
                      <ExternalLink size={14} className="text-gray-400 group-hover:text-[#2F6FA8]" />
                    </Link>
                  </div>
                )}

              </div>

              {/* Footer Modal */}
              <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 bg-slate-50">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                >
                  Hủy
                </button>

                <button
                  type="button"
                  onClick={handleSaveAttendanceSettings}
                  className="rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] px-5 py-2 text-xs font-bold text-white shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Save size={14} />
                  <span>Lưu quy định chấm công</span>
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}
