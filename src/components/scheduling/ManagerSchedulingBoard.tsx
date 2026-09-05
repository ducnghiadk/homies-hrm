'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { ScheduleService, type ShiftDemand, type ScheduleValidationWarning } from '@/lib/services/schedule-service'
import { ShiftTemplateService } from '@/lib/services/shift-template-service'
import { EmployeeService } from '@/lib/services/employees/employee-service'
import { employeeAdapter } from '@/lib/adapters'
import { addSchedule, getPositionById, getShiftById, getStoreById, mockPositions, mockStores, getStoresList, isStoreMatch } from '@/lib/mock-data'
import {
  extractDateFromHeader,
  getMappedImportPreviewDates,
  mergeScheduleImportWorkbooks,
  isNonWorkingScheduleCell,
  type ScheduleImportDuplicate,
  type ScheduleImportFileSummary,
  type ScheduleImportWorkbook,
} from '@/lib/services/scheduling/schedule-import-batch'
import {
  getRememberedShiftMappings,
  saveShiftMappingMemory,
  saveBatchShiftMappingMemory,
  getRememberedEmpMappings,
  saveEmpMappingMemory,
  smartResolveShiftTemplate,
  smartResolvePosition,
  removeVietnameseTones,
  isFlexibleAssignment,
  isFlexibleShiftText,
} from '@/lib/services/scheduling/shift-mapping-memory'
import { useAuthStore, type AuthUser } from '@/store/auth-store'
import readXlsxFile, { readSheet } from 'read-excel-file/browser'
import {
  ChevronLeft,
  ChevronRight,
  X,
  Sparkles,
  Search,
  Plus,
  Zap,
  Clock,
  UserCheck,
  Trash2,
  Settings,
  Tag,
  Calendar,
  Coffee,
  Receipt,
  Check,
  Sun,
  Moon,
  GripVertical,
  Move,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  AlertCircle,
  Pencil,
  FileSpreadsheet,
  Upload,
  Maximize2,
  Minimize2,
  Users,
  LayoutGrid,
  ShieldAlert,
  AlertTriangle,
  ShieldCheck,
  Info,
} from 'lucide-react'

type ScheduleImportEmployee = {
  id: string
  full_name: string
  employee_code?: string
  store_id?: string
  status?: string
  position_id?: string
}

type ScheduleImportEmployeeMatch = {
  emp: ScheduleImportEmployee | null
  status: 'manual' | 'empty' | 'summary' | 'matched' | 'other_store' | 'inactive' | 'not_found'
  cleanedName: string
  badgeLabel: string
  badgeColor: string
  reasonText: string
  otherStoreName?: string
  suggestedEmp?: ScheduleImportEmployee | null
}

function getShiftDurationLabel(start: string, end: string): string {
  if (!start || !end) return ''
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  if (isNaN(sh) || isNaN(sm) || isNaN(eh) || isNaN(em)) return ''
  let diff = (eh * 60 + em) - (sh * 60 + sm)
  if (diff < 0) diff += 24 * 60
  const hours = (diff / 60).toFixed(1)
  return `${hours.endsWith('.0') ? hours.slice(0, -2) : hours} tiếng`
}

function resolveShiftTemplateForText(shiftText: string, templates: Array<{ id: string; name: string; start_time?: string; end_time?: string; is_flexible?: boolean; code?: string }>): string {
  return smartResolveShiftTemplate(shiftText, templates)
}

function detectStoreFromExcelText(headers: string[], fileName: string, stores: Array<{ id: string; name: string }>): string | null {
  const fullText = (fileName + ' ' + headers.join(' ')).toLowerCase()
  const cleanFullText = removeVietnameseTones(fullText)

  for (const store of stores) {
    const storeNameLower = store.name.toLowerCase()
    const cleanStoreName = removeVietnameseTones(storeNameLower)

    if (fullText.includes(storeNameLower) || cleanFullText.includes(cleanStoreName)) {
      return store.id
    }
    if (cleanStoreName.includes('ho ba phan') && (cleanFullText.includes('ho ba phan') || cleanFullText.includes('hbp'))) return store.id
    if (cleanStoreName.includes('su van hanh') && (cleanFullText.includes('su van hanh') || cleanFullText.includes('svh'))) return store.id
    if (storeNameLower.includes('429') && cleanFullText.includes('429')) return store.id
  }
  return null
}

type DemandFormState = Record<string, number>

type PendingPublishedChange = {
  action: 'assign' | 'remove'
  employeeId: string
  employeeName: string
  date: string
  shiftTemplateId: string
  positionId: string
}

type SlotModalTarget = {
  date: string
  shiftTemplateId: string
  positionId: string
  templateName: string
  positionName: string
  startTime: string
  endTime: string
}

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const FULL_DAY_LABELS = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

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
  return `${DAY_LABELS[(date.getDay() + 6) % 7]} - ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatCalendarDate(value: string) {
  const date = parseDateKey(value)
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`
}

function formatDayFullDate(dateKey: string) {
  const date = parseDateKey(dateKey)
  const dayName = FULL_DAY_LABELS[date.getDay()]
  return `${dayName} - ${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}`
}

function getDayLabel(value: string) {
  const date = parseDateKey(value)
  return DAY_LABELS[(date.getDay() + 6) % 7]
}

function getWeekNumber(weekStartDateKey: string) {
  const date = parseDateKey(weekStartDateKey)
  const firstJan = new Date(date.getFullYear(), 0, 1)
  const numberOfDays = Math.floor((date.getTime() - firstJan.getTime()) / (24 * 60 * 60 * 1000))
  return Math.ceil((date.getDay() + 1 + numberOfDays) / 7)
}

function getShiftStyle(shiftText: string) {
  const lower = shiftText.toLowerCase()
  if (lower.includes('sáng') || lower.includes('08:') || lower.includes('09:') || lower.includes('10:')) {
    return {
      bg: 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:border-emerald-500 shadow-2xs',
      icon: '',
      badgeBg: 'bg-emerald-200/70 text-emerald-950',
    }
  }
  if (lower.includes('trưa') || lower.includes('chiều') || lower.includes('12:') || lower.includes('13:') || lower.includes('14:') || lower.includes('15:')) {
    return {
      bg: 'bg-amber-50 text-amber-950 border-amber-300 hover:border-amber-500 shadow-2xs',
      icon: '',
      badgeBg: 'bg-amber-200/70 text-amber-950',
    }
  }
  if (lower.includes('tối') || lower.includes('đêm') || lower.includes('17:') || lower.includes('18:') || lower.includes('19:') || lower.includes('20:') || lower.includes('21:') || lower.includes('22:')) {
    return {
      bg: 'bg-indigo-50 text-indigo-950 border-indigo-300 hover:border-indigo-500 shadow-2xs',
      icon: '',
      badgeBg: 'bg-indigo-200/70 text-indigo-950',
    }
  }
  return {
    bg: 'bg-purple-50 text-purple-950 border-purple-300 hover:border-purple-500 shadow-2xs',
    icon: '',
    badgeBg: 'bg-purple-200/70 text-purple-950',
  }
}

interface Props {
  weekStartQuery?: string | null
  storeIdQuery?: string | null
}

export default function ManagerSchedulingBoard({ weekStartQuery, storeIdQuery }: Props) {
  const { user } = useAuthStore()
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedPositionFilter, setSelectedPositionFilter] = useState<string>('ALL')
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<'info' | 'warning' | 'error'>('info')

  // Modal xếp lịch cho Ca (Pop-up iPOS Style)
  const [activeSlotModal, setActiveSlotModal] = useState<SlotModalTarget | null>(null)
  const [modalSearchTerm, setModalSearchTerm] = useState('')

  // Modal chỉnh nhu cầu tuần
  const [showDemandEditor, setShowDemandEditor] = useState(false)

  // Sửa sau khi chốt
  const [pendingPublishedChange, setPendingPublishedChange] = useState<PendingPublishedChange | null>(null)
  const [publishedChangeReason, setPublishedChangeReason] = useState('')

  // Modal Nhập Excel & Dữ liệu thật (Hỗ trợ nạp cùng lúc nhiều file)
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [clearExistingOnImport, setClearExistingOnImport] = useState(true)
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1)
  const [parsedRows, setParsedRows] = useState<string[][]>([])
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({})
  const [batchDuplicates, setBatchDuplicates] = useState<ScheduleImportDuplicate[]>([])
  const [batchFileSummaries, setBatchFileSummaries] = useState<ScheduleImportFileSummary[]>([])
  const [manualEmpMapping, setManualEmpMapping] = useState<Record<number, string>>({})
  const [customShiftMapping, setCustomShiftMapping] = useState<Record<string, { templateId: string; positionId?: string }>>({})
  const [ignoredShiftTexts, setIgnoredShiftTexts] = useState<Set<string>>(new Set())
  const [importSelectedStoreId, setImportSelectedStoreId] = useState<string>('')
  const [autoDetectedStoreId, setAutoDetectedStoreId] = useState<string | null>(null)

  // Modal Cài đặt ca làm việc trực tiếp
  const [showShiftSettingsModal, setShowShiftSettingsModal] = useState(false)
  const [shiftSettingsList, setShiftSettingsList] = useState<ReturnType<typeof ShiftTemplateService.getAll>>([])

  // Trạng thái Drag & Drop Kéo - Thả Ca làm việc
  const [draggedAssignment, setDraggedAssignment] = useState<{
    employeeId: string
    employeeName: string
    fromDate: string
    fromShiftId: string
    fromPositionId: string
    notes?: string
  } | null>(null)
  const [dropTargetKey, setDropTargetKey] = useState<string | null>(null)

  // Trạng thái Modal Dời Ca Làm Nhanh (Click nút dời ca)
  const [moveModalData, setMoveModalData] = useState<{
    employeeId: string
    employeeName: string
    fromDate: string
    fromShiftId: string
    fromPositionId: string
    notes?: string
  } | null>(null)
  const [targetMoveDate, setTargetMoveDate] = useState<string>('')
  const [targetMoveShiftId, setTargetMoveShiftId] = useState<string>('')
  const [targetMovePosId, setTargetMovePosId] = useState<string>('')

  // Tự động phát hiện tuần từ file Excel
  const [detectedWeekStart, setDetectedWeekStart] = useState<string | null>(null)
  const [dateMappingMode, setDateMappingMode] = useState<'file_date' | 'current_week'>('file_date')

  // Trạng thái phóng to cửa sổ modal & Chế độ xem (Theo Nhân viên vs Theo Mẫu Ca Recheck)
  const [isModalMaximized, setIsModalMaximized] = useState(false)
  const [previewViewMode, setPreviewViewMode] = useState<'by_employee' | 'by_shift'>('by_employee')

  // Trạng thái mở rộng cấu hình chi tiết (Accordion) để giao diện gọn gàng
  const [showShiftConfig, setShowShiftConfig] = useState(false)
  const [showDateConfig, setShowDateConfig] = useState(false)
  const [editingEmpRow, setEditingEmpRow] = useState<number | null>(null)

  // Modal Thêm ca phát sinh
  const [flexShiftModalDate, setFlexShiftModalDate] = useState<string | null>(null)
  const [flexShiftForm, setFlexShiftForm] = useState({
    name: '',
    startTime: '11:30',
    endTime: '14:30',
    employeeId: '',
    positionId: '',
    isOvertime: false,
    calculationType: 'shift_hours' as 'shift_hours' | 'actual_hours',
  })

  // Modal Chi tiết kiểm tra & Cảnh báo lịch làm việc
  const [validationModalData, setValidationModalData] = useState<{
    hardWarnings: ScheduleValidationWarning[]
    softWarnings: ScheduleValidationWarning[]
    totalAssignments: number
    canPublish: boolean
  } | null>(null)
  const [validationFilterTab, setValidationFilterTab] = useState<'all' | 'block' | 'warning'>('all')

  useEffect(() => {
    let isMounted = true
    employeeAdapter.getAllEmployees().then(res => {
      if (isMounted && res && res.length) {
        EmployeeService.syncEmployeesFromAdapter(res)
        setRefreshKey(k => k + 1)
      }
    })
    return () => { isMounted = false }
  }, [])

  const stores = useMemo(() => {
    const list = getStoresList()
    if (!user) return list.filter(store => store.is_active)
    if (['ceo', 'hr_admin'].includes(user.role)) return list.filter(store => store.is_active)
    return list.filter(store => store.id === user.store_id)
  }, [user])

  const anchorWeekStart = useMemo(() => weekStartQuery || plusDays(getWeekStart(), 7), [weekStartQuery])
  const activeWeekStart = useMemo(() => plusDays(anchorWeekStart, weekOffset * 7), [anchorWeekStart, weekOffset])
  const weekDates = useMemo(() => getWeekDates(activeWeekStart), [activeWeekStart])
  const activeStoreId = selectedStoreId || storeIdQuery || stores[0]?.id || user?.store_id || ''

  useEffect(() => {
    if (activeStoreId && !importSelectedStoreId) {
      setImportSelectedStoreId(activeStoreId)
    }
  }, [activeStoreId, importSelectedStoreId])

  const board = useMemo(() => {
    void refreshKey
    return user && activeStoreId ? ScheduleService.getAssignmentBoardData(user, activeStoreId, activeWeekStart) : null
  }, [activeStoreId, activeWeekStart, refreshKey, user])
  const weekStateMeta = board ? ScheduleService.getWeekStateMeta(board.week) : null

  // Lọc chỉ lấy các ca cố định (Sáng, Chiều, Đêm), tách Ca phát sinh ra làm phần động riêng & Khử trùng lặp
  const templates = useMemo(() => {
    if (!activeStoreId) return []
    const list = ShiftTemplateService.getActiveForStore(activeStoreId).filter(
      t => t.id !== 'shift-004' && !t.code?.includes('FLEX') && !t.name.toLowerCase().includes('phát sinh')
    )
    const unique: typeof list = []
    const seen = new Set<string>()
    list.forEach(t => {
      const key = `${t.name.toLowerCase().trim()}_${t.start_time}_${t.end_time}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(t)
      }
    })
    return unique
  }, [activeStoreId])

  const regularTemplateIds = useMemo(() => new Set(templates.map(t => t.id)), [templates])

  const allTemplates = useMemo(() => {
    if (!activeStoreId) return []
    const list = ShiftTemplateService.getActiveForStore(activeStoreId)
    const unique: typeof list = []
    const seen = new Set<string>()
    list.forEach(t => {
      const key = `${t.name.toLowerCase().trim()}_${t.start_time}_${t.end_time}`
      if (!seen.has(key)) {
        seen.add(key)
        unique.push(t)
      }
    })
    return unique
  }, [activeStoreId])

  const positions = useMemo(() => {
    const ids = Array.from(new Set(templates.flatMap(template => template.allowed_position_ids || [])))
    return ids.map(id => getPositionById(id)).filter(Boolean)
  }, [templates])

  const uniqueExcelShifts = useMemo(() => {
    const set = new Set<string>()
    parsedRows.forEach(row => {
      parsedHeaders.forEach((_, colIdx) => {
        if (colIdx === 0) return
        const cellVal = row[colIdx]?.trim()
        if (!cellVal || isNonWorkingScheduleCell(cellVal)) return
        const entries = cellVal.split(/[\n;/]|<br\s*\/?>/i).map(s => s.trim()).filter(Boolean)
        entries.forEach(entry => {
          if (entry && !ignoredShiftTexts.has(entry) && !isNonWorkingScheduleCell(entry)) set.add(entry)
        })
      })
    })
    return Array.from(set)
  }, [parsedRows, parsedHeaders, ignoredShiftTexts])

  const cleanName = (text: string) => {
    if (!text) return ''
    return text
      .replace(/\d+\s*ca.*/gi, '')
      .replace(/\d+(\.\d+)?\s*giờ.*/gi, '')
      .replace(/\|\s*/g, '')
      .replace(/[\r\n]+/g, ' ')
      .trim()
  }

  // Phân tích chi tiết mức độ khớp nhân viên và lý do không khớp thông minh (Apple SaaS Standard)
  const getEmpMatchDetail = (rowIndex: number, rawCell: string): ScheduleImportEmployeeMatch => {
    // 1. Kiểm tra nếu có gán thủ công
    if (manualEmpMapping[rowIndex]) {
      const allEmps: ScheduleImportEmployee[] = EmployeeService.getEmployees(user ?? undefined)
      const mapped = board?.employees.find(e => e.employee.id === manualEmpMapping[rowIndex])?.employee
        || allEmps.find(e => e.id === manualEmpMapping[rowIndex])
      if (mapped) {
        return {
          emp: mapped,
          status: 'manual' as const,
          cleanedName: cleanName(rawCell),
          badgeLabel: `✓ Ghép thủ công: ${mapped.full_name}`,
          badgeColor: 'bg-blue-50 text-[#2F6FA8] border-blue-200',
          reasonText: 'Được ghép thủ công bởi quản lý',
        }
      }
    }

    const cleaned = cleanName(rawCell)
    if (!cleaned) {
      return {
        emp: null,
        status: 'empty' as const,
        cleanedName: '',
        badgeLabel: 'Dòng trống',
        badgeColor: 'bg-gray-100 text-gray-500 border-gray-200',
        reasonText: 'Không có dữ liệu tên nhân viên',
      }
    }

    const lowerClean = cleaned.toLowerCase()
    const toneFreeClean = removeVietnameseTones(lowerClean)

    // 1.2. Kiểm tra bộ nhớ tự học từ các lần ghép trước (Smart Memory)
    const rememberedEmpMap = getRememberedEmpMappings()
    const rememberedEmpId = rememberedEmpMap[cleaned] || rememberedEmpMap[toneFreeClean]
    if (rememberedEmpId) {
      const allEmps: ScheduleImportEmployee[] = EmployeeService.getEmployees(user ?? undefined)
      const mapped = board?.employees.find(e => e.employee.id === rememberedEmpId)?.employee
        || allEmps.find(e => e.id === rememberedEmpId)
      if (mapped) {
        return {
          emp: mapped,
          status: 'manual' as const,
          cleanedName: cleaned,
          badgeLabel: `⚡ Đã nhớ: ${mapped.full_name}`,
          badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
          reasonText: 'Tự động ghép từ bộ nhớ bạn đã từng chỉnh sửa trước đây',
        }
      }
    }

    // 2. Kiểm tra dòng tiêu đề / thống kê
    const summaryKeywords = ['tổng', 'tong ca', 'tong gio', 'tổng số ca', 'tổng ca', 'tổng giờ', 'ghi chú', 'thống kê', 'stt', 'họ và tên', 'họ tên']
    if (summaryKeywords.some(k => lowerClean === k || lowerClean.startsWith(k + ':') || lowerClean.startsWith(k + ' '))) {
      return {
        emp: null,
        status: 'summary' as const,
        cleanedName: cleaned,
        badgeLabel: '📋 Dòng tổng kết / tiêu đề (Sẽ bỏ qua)',
        badgeColor: 'bg-gray-100 text-gray-600 border-gray-300',
        reasonText: 'Dòng thống kê hoặc tiêu đề, hệ thống sẽ tự động bỏ qua khi lưu ca.',
      }
    }

    // Lấy danh sách nhân viên thuộc cơ sở đang chọn áp dụng nhập ca
    const allCompanyEmployees: ScheduleImportEmployee[] = EmployeeService.getEmployees(user ?? undefined)
    const storeEmployees = allCompanyEmployees.filter(e => {
      return isStoreMatch(e.store_id, importSelectedStoreId) || (!e.store_id && isStoreMatch('store-001', importSelectedStoreId))
    })
    const effectiveStoreEmps = importSelectedStoreId
      ? storeEmployees
      : (board?.employees.map(e => e.employee) || allCompanyEmployees)

    // 3. Khớp thông minh đa tầng (Level 1: Chính xác -> Level 2: Không dấu -> Level 3: Tên rút gọn -> Level 4: Viết tắt)
    // Level 1: Khớp chính xác 100%
    let matchedEmp = effectiveStoreEmps.find(e => e.full_name.toLowerCase().trim() === lowerClean)
    let matchType: 'exact' | 'tone_free' | 'substring' | 'initials' = 'exact'

    // Level 2: Khớp 95% không dấu
    if (!matchedEmp) {
      matchedEmp = effectiveStoreEmps.find(e => removeVietnameseTones(e.full_name) === toneFreeClean)
      matchType = 'tone_free'
    }

    // Level 3: Khớp 85% Substring & Tên + Họ
    if (!matchedEmp) {
      const inputWords = toneFreeClean.split(/\s+/).filter(w => w.length > 0)
      const inputLastName = inputWords[inputWords.length - 1] || ''

      matchedEmp = effectiveStoreEmps.find(e => {
        const sysToneFree = removeVietnameseTones(e.full_name)
        if (sysToneFree.includes(toneFreeClean) || toneFreeClean.includes(sysToneFree)) return true
        const sysWords = sysToneFree.split(/\s+/).filter(w => w.length > 0)
        const sysLastName = sysWords[sysWords.length - 1] || ''
        if (sysLastName && inputLastName && sysLastName === inputLastName) {
          if (sysWords.some(w => inputWords.includes(w))) return true
        }
        return false
      })
      matchType = 'substring'
    }

    // Level 4: Khớp 80% Tên viết tắt (ví dụ: "HLKL" -> "Huỳnh Lê Kiều Linh")
    if (!matchedEmp) {
      matchedEmp = effectiveStoreEmps.find(e => {
        const sysWords = removeVietnameseTones(e.full_name).split(/\s+/).filter(w => w.length > 0)
        const initials = sysWords.map(w => w[0]).join('')
        return initials === toneFreeClean || toneFreeClean.includes(initials)
      })
      matchType = 'initials'
    }

    if (matchedEmp) {
      const targetStoreObj = mockStores.find(s => s.id === importSelectedStoreId) || stores.find(s => s.id === importSelectedStoreId)
      const labels = {
        exact: '✓ Tự động khớp (100%)',
        tone_free: '✓ Khớp 95% (Không dấu)',
        substring: '✓ Khớp 85% (Tên rút gọn)',
        initials: '✓ Khớp 80% (Tên viết tắt)',
      }
      return {
        emp: matchedEmp,
        status: 'matched' as const,
        cleanedName: cleaned,
        badgeLabel: labels[matchType],
        badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-300',
        reasonText: `Tự động khớp nhân sự trực thuộc ${targetStoreObj?.name || 'cơ sở'}`,
      }
    }

    // 4. Tìm trong toàn bộ nhân viên công ty (Trường hợp mượn ca / làm chéo chi nhánh)
    const matchedInCompany = allCompanyEmployees.find((e: { id: string; full_name: string; store_id?: string; status?: string }) => {
      const sysToneFree = removeVietnameseTones(e.full_name)
      return sysToneFree.includes(toneFreeClean) || toneFreeClean.includes(sysToneFree)
    })

    if (matchedInCompany) {
      const empStore = mockStores.find(s => isStoreMatch(s.id, matchedInCompany.store_id))
      const storeName = empStore?.name || 'Chi nhánh khác'

      if (matchedInCompany.status === 'resigned' || matchedInCompany.status === 'inactive') {
        return {
          emp: matchedInCompany,
          status: 'inactive' as const,
          cleanedName: cleaned,
          badgeLabel: `🚫 Đã nghỉ việc / ngưng hoạt động`,
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-300',
          reasonText: `Nhân viên ${matchedInCompany.full_name} (${storeName}) hiện đang ở trạng thái ngừng hoạt động.`,
        }
      }

      return {
        emp: matchedInCompany,
        status: 'other_store' as const,
        cleanedName: cleaned,
        badgeLabel: `📍 Thuộc ${storeName}`,
        badgeColor: 'bg-purple-50 text-purple-800 border-purple-300',
        reasonText: `Nhân viên thuộc ${storeName}. Bạn có thể chọn để xếp ca mượn nhân sự / làm việc chéo chi nhánh.`,
        otherStoreName: storeName,
      }
    }

    // 5. Gợi ý gần nhất
    let bestMatch: (typeof allCompanyEmployees)[number] | null = null
    let maxOverlap = 0
    allCompanyEmployees.forEach((e) => {
      const sysToneFree = removeVietnameseTones(e.full_name)
      const words = sysToneFree.split(/\s+/)
      const inWords = toneFreeClean.split(/\s+/)
      const overlap = words.filter((w: string) => inWords.includes(w)).length
      if (overlap > maxOverlap) {
        maxOverlap = overlap
        bestMatch = e
      }
    })

    return {
      emp: null,
      status: 'not_found' as const,
      cleanedName: cleaned,
      badgeLabel: `⚠️ Cần ghép tay`,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-300',
      reasonText: `Không tìm thấy nhân viên "${cleaned}" trong cơ sở này.`,
      suggestedEmp: maxOverlap > 0 ? bestMatch : null,
    }
  }

  const getEmpForRow = (rowIndex: number, rawCell: string) => {
    const detail = getEmpMatchDetail(rowIndex, rawCell)
    return { emp: detail.emp, status: detail.status, cleanedName: detail.cleanedName }
  }

  // Danh sách phân rã tất cả các ca trong file Excel để hiển thị chế độ view "Theo Mẫu Ca (Recheck)"
  const previewShiftsList = useMemo(() => {
    const list: Array<{
      emp: ScheduleImportEmployee
      rowIdx: number
      rawEmpName: string
      date: string
      shiftId: string
      shiftName: string
      shiftTime: string
      positionId: string
      positionName: string
      rawEntry: string
    }> = []

    parsedRows.forEach((row, rowIdx) => {
      const matchInfo = getEmpMatchDetail(rowIdx, row[0] || '')
      const emp = matchInfo.emp
      if (!emp) return

      Object.entries(columnMapping).forEach(([colIdxStr, date]) => {
        const colIdx = Number(colIdxStr)
        const cellValue = row[colIdx]?.trim()
        if (!cellValue || !date) return

        const shiftEntries = cellValue
          .split(/[\n;/]|<br\s*\/?>/i)
          .map(s => s.trim())
          .filter(Boolean)

        shiftEntries.forEach(shiftEntry => {
          if (ignoredShiftTexts.has(shiftEntry) || isNonWorkingScheduleCell(shiftEntry)) return

          const userMapping = customShiftMapping[shiftEntry]
          const shiftId = userMapping?.templateId || smartResolveShiftTemplate(shiftEntry, allTemplates)
          const assignedPosId = userMapping?.positionId !== undefined ? userMapping.positionId : smartResolvePosition(shiftEntry, mockPositions)

          const tpl = allTemplates.find(t => t.id === shiftId)
          const pos = mockPositions.find(p => p.id === assignedPosId)

          list.push({
            emp,
            rowIdx,
            rawEmpName: row[0] || '',
            date,
            shiftId,
            shiftName: tpl?.name || 'Ca linh hoạt',
            shiftTime: tpl ? `${tpl.start_time} - ${tpl.end_time}` : 'Giờ Excel',
            positionId: assignedPosId,
            positionName: pos?.name || 'Pha chế',
            rawEntry: shiftEntry,
          })
        })
      })
    })

    return list
  }, [parsedRows, columnMapping, manualEmpMapping, customShiftMapping, ignoredShiftTexts, importSelectedStoreId, allTemplates])

  const importPreviewDates = useMemo(
    () => getMappedImportPreviewDates(columnMapping, weekDates, dateMappingMode),
    [columnMapping, weekDates, dateMappingMode]
  )

  const parseCSVText = (text: string): string[][] => {
    return text
      .split(/\r?\n/)
      .filter(line => line.trim().length > 0)
      .map(line => {
        const cells: string[] = []
        let cur = ''
        let inQuote = false
        for (let i = 0; i < line.length; i++) {
          const ch = line[i]
          if (ch === '"') {
            inQuote = !inQuote
          } else if (ch === ',' && !inQuote) {
            cells.push(cur.trim())
            cur = ''
          } else {
            cur += ch
          }
        }
        cells.push(cur.trim())
        return cells
      })
  }

  const parseFileToRows = async (file: File): Promise<string[][]> => {
    try {
      const rawData = await readSheet(file)
      if (rawData && rawData.length > 0) {
        const rows = rawData
          .map(row =>
            (row || []).map(cell => {
              if (cell === null || cell === undefined) return ''
              if (cell instanceof Date) {
                const year = cell.getFullYear()
                const month = String(cell.getMonth() + 1).padStart(2, '0')
                const day = String(cell.getDate()).padStart(2, '0')
                return `${day}/${month}/${year}`
              }
              return String(cell).trim()
            })
          )
          .filter(r => r.some(c => c.length > 0))

        if (rows.length >= 2) return rows
      }
    } catch (err) {
      console.warn('[ExcelImport] readSheet fail, fallback to text parser:', err)
    }

    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => {
        const text = (e.target?.result as string) || ''
        if (text.includes('<table') || text.includes('<tr')) {
          try {
            const parser = new DOMParser()
            const doc = parser.parseFromString(text, 'text/html')
            const trs = Array.from(doc.querySelectorAll('tr'))
            const rows: string[][] = []
            trs.forEach(tr => {
              const cells: string[] = []
              const tds = Array.from(tr.querySelectorAll('th, td'))
              tds.forEach(td => {
                const textContent = (td.innerHTML || '')
                  .replace(/<br\s*\/?>/gi, ' / ')
                  .replace(/<[^>]+>/g, '')
                  .trim()
                cells.push(textContent)
              })
              if (cells.some(c => c.length > 0)) rows.push(cells)
            })
            if (rows.length >= 2) return resolve(rows)
          } catch (err) {
            console.warn('[ExcelImport] DOMParser fail:', err)
          }
        }
        resolve(parseCSVText(text))
      }
      reader.onerror = () => resolve([])
      reader.readAsText(file, 'utf-8')
    })
  }

  const parseFileToWorkbooks = async (file: File): Promise<ScheduleImportWorkbook[]> => {
    const workbooks: ScheduleImportWorkbook[] = []
    try {
      const sheets = await readXlsxFile(file)
      if (sheets && Array.isArray(sheets) && sheets.length > 0) {
        sheets.forEach((sheetObj, sIdx) => {
          const rawData = sheetObj.data || []
          const rows = rawData
            .map(row =>
              (row || []).map(cell => {
                if (cell === null || cell === undefined) return ''
                if (cell instanceof Date) {
                  const year = cell.getFullYear()
                  const month = String(cell.getMonth() + 1).padStart(2, '0')
                  const day = String(cell.getDate()).padStart(2, '0')
                  return `${day}/${month}/${year}`
                }
                return String(cell).trim()
              })
            )
            .filter(r => r.some(c => c.length > 0))

          if (rows.length >= 2) {
            workbooks.push({
              fileName: `${file.name}${sheets.length > 1 ? ` [${sheetObj.sheet || `Sheet ${sIdx + 1}`}]` : ''}`,
              rows,
            })
          }
        })
        if (workbooks.length > 0) return workbooks
      }
    } catch (err) {
      console.warn('[ExcelImport] readXlsxFile all sheets fail, falling back:', err)
    }

    const fallbackRows = await parseFileToRows(file)
    if (fallbackRows.length >= 2) {
      workbooks.push({
        fileName: file.name,
        rows: fallbackRows,
      })
    }
    return workbooks
  }

  const handleFileSelected = async (file: File) => {
    setSelectedFile(file)
    setSelectedFiles([file])
    setBatchDuplicates([])
    setBatchFileSummaries([])

    const workbooks = await parseFileToWorkbooks(file)
    if (workbooks.length === 0) {
      setMessage('File không đúng định dạng hoặc không đọc được dữ liệu. Vui lòng thử lại với file Excel mẫu!')
      return
    }

    const merged = mergeScheduleImportWorkbooks(workbooks, {
      weekDates,
      extractDateFromHeader,
    })

    if (merged.rows.length === 0) {
      setMessage('Không tìm thấy dữ liệu nhân viên hoặc ca làm hợp lệ trong file Excel.')
      return
    }

    setParsedHeaders(merged.headers)
    setParsedRows(merged.rows)
    setColumnMapping(merged.columnMapping)
    setBatchDuplicates(merged.duplicates)
    setBatchFileSummaries(merged.fileSummaries)

    // Tự động nhận diện chi nhánh từ tên file & header
    const detectedStoreId = detectStoreFromExcelText(merged.headers, file.name, stores)
    if (detectedStoreId) {
      setAutoDetectedStoreId(detectedStoreId)
      setImportSelectedStoreId(detectedStoreId)
    } else {
      setAutoDetectedStoreId(null)
      setImportSelectedStoreId(activeStoreId)
    }

    const firstDateKey = Object.values(merged.columnMapping)[0]
    if (firstDateKey) {
      const parsed = parseDateKey(firstDateKey)
      const day = parsed.getDay()
      const diff = day === 0 ? -6 : 1 - day
      parsed.setDate(parsed.getDate() + diff)
      setDetectedWeekStart(formatDateKey(parsed))
      setDateMappingMode('file_date')
    } else {
      setDetectedWeekStart(null)
      setDateMappingMode('current_week')
    }

    // Tự động khởi tạo mapping mẫu ca và vị trí thông minh
    const initialShiftMap: Record<string, { templateId: string; positionId?: string }> = {}
    const rawShiftsSet = new Set<string>()

    merged.rows.forEach(row => {
      merged.headers.forEach((_, colIdx) => {
        if (colIdx === 0) return
        const cellVal = row[colIdx]?.trim()
        if (!cellVal || isNonWorkingScheduleCell(cellVal)) return
        const entries = cellVal.split(/[\n;/]|<br\s*\/?>/i).map(s => s.trim()).filter(Boolean)
        entries.forEach(entry => {
          if (entry) rawShiftsSet.add(entry)
        })
      })
    })

    const rememberedShiftMap = getRememberedShiftMappings()
    rawShiftsSet.forEach(shiftText => {
      const defaultTplId = smartResolveShiftTemplate(shiftText, allTemplates, rememberedShiftMap)
      const resolvedPosId = smartResolvePosition(shiftText, mockPositions, rememberedShiftMap)

      initialShiftMap[shiftText] = {
        templateId: defaultTplId,
        positionId: resolvedPosId,
      }
    })

    setCustomShiftMapping(initialShiftMap)
    setManualEmpMapping({})
    setImportStep(2)
  }

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return
    if (files.length === 1) {
      await handleFileSelected(files[0])
      return
    }

    setSelectedFiles(files)
    setSelectedFile(files[0])

    const allWorkbooksArrays = await Promise.all(files.map(file => parseFileToWorkbooks(file)))
    const validWorkbooks = allWorkbooksArrays.flat()

    if (validWorkbooks.length === 0) {
      setMessage('Không đọc được dữ liệu từ các file Excel đã chọn.')
      return
    }

    const merged = mergeScheduleImportWorkbooks(validWorkbooks, {
      weekDates,
      extractDateFromHeader,
    })

    setParsedHeaders(merged.headers)
    setParsedRows(merged.rows)
    setColumnMapping(merged.columnMapping)
    setBatchDuplicates(merged.duplicates)
    setBatchFileSummaries(merged.fileSummaries)

    const firstDateKey = Object.values(merged.columnMapping)[0]
    if (firstDateKey) {
      const parsed = parseDateKey(firstDateKey)
      const day = parsed.getDay()
      const diff = day === 0 ? -6 : 1 - day
      parsed.setDate(parsed.getDate() + diff)
      setDetectedWeekStart(formatDateKey(parsed))
      setDateMappingMode('file_date')
    } else {
      setDetectedWeekStart(null)
      setDateMappingMode('current_week')
    }

    const detectedStoreId = detectStoreFromExcelText(
      merged.headers,
      files.map(file => file.name).join(' '),
      stores
    )
    if (detectedStoreId) {
      setAutoDetectedStoreId(detectedStoreId)
      setImportSelectedStoreId(detectedStoreId)
    } else {
      setAutoDetectedStoreId(null)
      setImportSelectedStoreId(activeStoreId)
    }

    const initialShiftMap: Record<string, { templateId: string; positionId?: string }> = {}
    const rawShiftsSet = new Set<string>()
    merged.rows.forEach(row => {
      merged.headers.forEach((_, colIdx) => {
        if (colIdx === 0) return
        const cellVal = row[colIdx]?.trim()
        if (!cellVal || isNonWorkingScheduleCell(cellVal)) return
        cellVal.split(/[\n;/]|<br\s*\/?>/i).map(s => s.trim()).filter(Boolean).forEach(entry => rawShiftsSet.add(entry))
      })
    })

    const rememberedShiftMap = getRememberedShiftMappings()
    rawShiftsSet.forEach(shiftText => {
      initialShiftMap[shiftText] = {
        templateId: smartResolveShiftTemplate(shiftText, allTemplates, rememberedShiftMap),
        positionId: smartResolvePosition(shiftText, mockPositions, rememberedShiftMap),
      }
    })

    setCustomShiftMapping(initialShiftMap)
    setManualEmpMapping({})
    setImportStep(2)
  }

  const handleBatchAssignUnspecifiedPositions = (targetPosId: string) => {
    setCustomShiftMapping(prev => {
      const updated = { ...prev }
      const rememberedShiftMap = getRememberedShiftMappings()
      uniqueExcelShifts.forEach(shiftText => {
        const defaultTplId = smartResolveShiftTemplate(shiftText, allTemplates, rememberedShiftMap)

        updated[shiftText] = {
          templateId: updated[shiftText]?.templateId || defaultTplId,
          positionId: targetPosId,
        }
      })
      saveBatchShiftMappingMemory(updated)
      return updated
    })
  }

  const handleToggleDateMappingMode = (mode: 'file_date' | 'current_week') => {
    setDateMappingMode(mode)
    const newMap: Record<number, string> = {}

    if (mode === 'file_date' && detectedWeekStart) {
      parsedHeaders.forEach((header, idx) => {
        if (idx === 0) return
        const dateStr = extractDateFromHeader(header)
        newMap[idx] = dateStr || plusDays(detectedWeekStart, idx - 1)
      })
    } else {
      parsedHeaders.forEach((_, idx) => {
        if (idx === 0) return
        const dateIdx = idx - 1
        if (dateIdx < weekDates.length) {
          newMap[idx] = weekDates[dateIdx] || ''
        }
      })
    }
    setColumnMapping(newMap)
  }

  const handleClearWeekSchedules = () => {
    if (!activeStoreId || !user) return
    const currentStoreObj = stores.find(s => s.id === activeStoreId)
    const confirmed = confirm(
      `Bạn có chắc chắn muốn xóa toàn bộ ca làm việc trong tuần (${formatShortDate(weekDates[0])} - ${formatShortDate(weekDates[6])}) của ${currentStoreObj?.name || 'cửa hàng'} không?\n\nHành động này sẽ làm sạch toàn bộ bảng để bạn có thể nhập dữ liệu thật hoặc xếp lại từ đầu.`
    )
    if (!confirmed) return

    ScheduleService.clearWeekSchedules(user, activeStoreId, weekDates)
    setRefreshKey(prev => prev + 1)
    setMessage('Đã xóa sạch toàn bộ ca làm việc trong tuần!')
  }

  const handleConfirmImport = async () => {
    const effectiveStoreId = activeStoreId || selectedStoreId || stores[0]?.id || 'store-001'
    const effectiveUser = user || ({ id: 'u-001', full_name: 'Quản lý cửa hàng', role: 'manager', store_id: effectiveStoreId } as unknown as AuthUser)

    if (parsedRows.length === 0) {
      setMessage('Không tìm thấy dữ liệu file Excel để nhập!')
      return
    }

    // Tự động lưu toàn bộ các quy tắc mapping ca đã tinh chỉnh vào bộ nhớ thông minh (Smart Memory)
    saveBatchShiftMappingMemory(customShiftMapping)

    // Trường hợp nạp hàng loạt nhiều file cùng lúc (Batch Multi-File Import)
    if (selectedFiles.length > 1 && parsedRows.length === 0) {
      let totalBatchShifts = 0
      for (const file of selectedFiles) {
        const fileRows = await parseFileToRows(file)
        if (fileRows.length < 2) continue
        const fileHeaders = fileRows[0] || []
        const bodyRows = fileRows.slice(1)

        // Nhận diện ngày từ header của file
        const fileDates: Record<number, string> = {}
        let firstFileDate: string | null = null
        fileHeaders.forEach((h, idx) => {
          if (idx === 0) return
          const d = extractDateFromHeader(h)
          if (d) {
            fileDates[idx] = d
            if (!firstFileDate) firstFileDate = d
          }
        })

        let fileMonday: string | null = null
        if (firstFileDate) {
          const parsed = parseDateKey(firstFileDate)
          const day = parsed.getDay()
          const diff = day === 0 ? -6 : 1 - day
          parsed.setDate(parsed.getDate() + diff)
          fileMonday = formatDateKey(parsed)
        }

        const fileMap: Record<number, string> = {}
        fileHeaders.forEach((_, idx) => {
          if (idx === 0) return
          if (fileDates[idx]) fileMap[idx] = fileDates[idx]
          else if (fileMonday) fileMap[idx] = plusDays(fileMonday, idx - 1)
        })

        const fileShifts: Array<{
          employee_id: string
          shift_id: string
          date: string
          notes?: string
          assigned_position_id?: string
        }> = []

        bodyRows.forEach((row, rowIdx) => {
          const matchInfo = getEmpMatchDetail(rowIdx, row[0] || '')
          const emp = matchInfo.emp
          if (
            !emp ||
            matchInfo.status === 'other_store' ||
            emp.status === 'inactive' ||
            emp.status === 'resigned'
          ) return

          Object.entries(fileMap).forEach(([colIdxStr, date]) => {
            const colIdx = Number(colIdxStr)
            const cellValue = row[colIdx]?.trim()
            if (!cellValue || !date) return

            const shiftEntries = cellValue
              .split(/[\n;/]|<br\s*\/?>/i)
              .map(s => s.trim())
              .filter(Boolean)

            shiftEntries.forEach(shiftEntry => {
              if (ignoredShiftTexts.has(shiftEntry) || isNonWorkingScheduleCell(shiftEntry)) return
              const userMapping = customShiftMapping[shiftEntry]
              const shiftId = userMapping?.templateId || smartResolveShiftTemplate(shiftEntry, allTemplates)
              const assignedPosId = userMapping?.positionId !== undefined ? userMapping.positionId : smartResolvePosition(shiftEntry, mockPositions)

              fileShifts.push({
                employee_id: emp.id,
                shift_id: shiftId,
                date,
                notes: shiftEntry,
                assigned_position_id: assignedPosId,
              })
            })
          })
        })

        if (fileShifts.length > 0) {
          const targetWeek = fileMonday ? getWeekDates(fileMonday) : weekDates
          const targetStoreId = importSelectedStoreId || effectiveStoreId
          const importResult = await ScheduleService.importShifts(effectiveUser, targetStoreId, fileShifts, {
            clearExisting: clearExistingOnImport,
            weekDates: targetWeek,
            status: 'draft',
          })
          totalBatchShifts += importResult.count
        }
      }

      setRefreshKey(prev => prev + 1)
      setShowImportModal(false)
      setSelectedFile(null)
      setSelectedFiles([])
      setParsedRows([])
      setParsedHeaders([])
      setColumnMapping({})
      setBatchDuplicates([])
      setBatchFileSummaries([])
      setManualEmpMapping({})
      setCustomShiftMapping({})
      setImportStep(1)
      setMessage(`Đã nạp thành công toàn bộ ${selectedFiles.length} file Excel lịch làm việc (${totalBatchShifts} ca)!`)
      return
    }

    const shiftsToImport: Array<{
      employee_id: string
      shift_id: string
      date: string
      notes?: string
      assigned_position_id?: string
    }> = []

    parsedRows.forEach((row, rowIdx) => {
      const matchInfo = getEmpMatchDetail(rowIdx, row[0] || '')
      const emp = matchInfo.emp
      if (
        !emp ||
        matchInfo.status === 'other_store' ||
        emp.status === 'inactive' ||
        emp.status === 'resigned'
      ) return

      Object.entries(columnMapping).forEach(([colIdxStr, date]) => {
        const colIdx = Number(colIdxStr)
        const cellValue = row[colIdx]?.trim()
        if (!cellValue || !date) return

        const shiftEntries = cellValue
          .split(/[\n;/]|<br\s*\/?>/i)
          .map(s => s.trim())
          .filter(Boolean)

        shiftEntries.forEach(shiftEntry => {
          if (ignoredShiftTexts.has(shiftEntry) || isNonWorkingScheduleCell(shiftEntry)) return

          const userMapping = customShiftMapping[shiftEntry]
          const shiftId = userMapping?.templateId || smartResolveShiftTemplate(shiftEntry, allTemplates)
          const assignedPosId = userMapping?.positionId !== undefined ? userMapping.positionId : smartResolvePosition(shiftEntry, mockPositions)

          shiftsToImport.push({
            employee_id: emp.id,
            shift_id: shiftId,
            date,
            notes: shiftEntry,
            assigned_position_id: assignedPosId,
          })
        })
      })
    })

    const isBatchImport = selectedFiles.length > 1
    if (isBatchImport && clearExistingOnImport) {
      const clearedWeeks = new Set<string>()
      shiftsToImport.forEach(shift => {
        const weekStart = getWeekStart(parseDateKey(shift.date))
        if (clearedWeeks.has(weekStart)) return
        clearedWeeks.add(weekStart)
        ScheduleService.clearWeekSchedules(effectiveUser, importSelectedStoreId || effectiveStoreId, getWeekDates(weekStart))
      })
    }

    const sampleDate = shiftsToImport[0]?.date || Object.values(columnMapping)[0] || detectedWeekStart
    const importedMonStr = sampleDate ? getWeekStart(parseDateKey(sampleDate)) : detectedWeekStart

    const targetWeek = importedMonStr
      ? getWeekDates(importedMonStr)
      : weekDates

    const targetStoreId = importSelectedStoreId || effectiveStoreId

    const importResult = await ScheduleService.importShifts(effectiveUser, targetStoreId, shiftsToImport, {
      clearExisting: isBatchImport ? false : clearExistingOnImport,
      weekDates: targetWeek,
      status: 'draft',
    })
    const addedCount = importResult.count

    // Tự động chuyển bảng xếp lịch sang đúng cơ sở & tuần vừa nhập
    if (importSelectedStoreId) {
      setSelectedStoreId(importSelectedStoreId)
    }

    if (importedMonStr) {
      const targetMon = parseDateKey(importedMonStr)
      const anchorMon = parseDateKey(anchorWeekStart)
      const diffWeeks = Math.round((targetMon.getTime() - anchorMon.getTime()) / (7 * 86400000))
      setWeekOffset(diffWeeks)
    }

    setRefreshKey(prev => prev + 1)
    setShowImportModal(false)
    setSelectedFile(null)
    setSelectedFiles([])
    setParsedRows([])
    setParsedHeaders([])
    setColumnMapping({})
    setManualEmpMapping({})
    setCustomShiftMapping({})
    setImportStep(1)

    const notice = importedMonStr
      ? ` và tự động chuyển giao diện đến đúng tuần vừa nhập (${formatShortDate(importedMonStr)} - ${formatShortDate(plusDays(importedMonStr, 6))})`
      : ''
    const batchNotice = isBatchImport
      ? ` (${batchFileSummaries.length} file, bỏ qua ${batchDuplicates.length} ca trùng)`
      : ''
    setMessage(`Đã nhập thành công ${addedCount} ca làm việc từ file Excel${batchNotice}${notice}!`)
  }

  const handleMoveShift = (
    employeeId: string,
    fromDate: string,
    fromShiftId: string,
    targetDate: string,
    targetShiftId: string,
    targetPositionId?: string,
    notes?: string
  ) => {
    if (!activeStoreId || !user) return

    ScheduleService.removeAssignment(user, activeStoreId, employeeId, fromDate)
    addSchedule(
      activeStoreId,
      employeeId,
      targetShiftId,
      targetDate,
      notes,
      isPublished ? 'published' : 'draft',
      targetPositionId
    )

    setRefreshKey(k => k + 1)
    const emp = board?.employees.find(e => e.employee.id === employeeId)?.employee
    const empName = emp?.full_name || employeeId
    const targetTpl = allTemplates.find(t => t.id === targetShiftId)
    const targetPos = getPositionById(targetPositionId || '')

    setMessage(`Đã dời ca làm của ${empName} sang ${targetTpl?.name || 'ca mới'}${targetPos ? ` (${targetPos.name})` : ''} (${formatCalendarDate(targetDate)}) thành công!`)
  }

  const handleDownloadSampleExcel = () => {
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`
    html += `<head><meta charset="utf-8"><style>
      table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
      th { background-color: #001D3D; color: #FFFFFF; font-weight: bold; padding: 8px; border: 1px solid #CCCCCC; text-align: center; }
      td { border: 1px solid #CCCCCC; padding: 6px; vertical-align: top; }
      .emp-name { font-weight: bold; }
    </style></head><body><table>`
    html += `<tr><th>Họ tên nhân viên</th><th>Thứ 2 - 10/08/2026</th><th>Thứ 3 - 11/08/2026</th><th>Thứ 4 - 12/08/2026</th><th>Thứ 5 - 13/08/2026</th><th>Thứ 6 - 14/08/2026</th><th>Thứ 7 - 15/08/2026</th><th>Chủ Nhật - 16/08/2026</th></tr>`
    html += `<tr><td class="emp-name">Huỳnh Lê Kiều Linh</td><td>Ca Tối [17:00-22:00]</td><td>Ca Sáng [08:30-12:00]<br/>Ca Trưa Lẻ [12:00-15:00]</td><td></td><td>Ca Sáng Thu Ngân [08:30-12:00]<br/>Ca Trưa [12:00-17:00]</td><td>Ca Trưa Lẻ [12:00-15:00]<br/>Ca Tối [17:00-22:00]</td><td>KIỂM KHO GIỮA T8 [17:00-22:00]</td><td>Ca Tối [17:00-22:00]</td></tr>`
    html += `<tr><td class="emp-stats">8 ca | 33 giờ</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`
    html += `<tr><td class="emp-name">Nguyễn Thị Phương Thảo</td><td>Ca Sáng Thu Ngân [08:30-12:00]<br/>Ca Trưa Thu Ngân [12:00-17:00]</td><td>Ca Trưa Thu Ngân [12:00-17:00]<br/>Ca Tối Thu Ngân [17:00-22:00]</td><td>Ca Tối Thu Ngân [17:00-22:00]<br/>Ca Trưa Thu Ngân [12:00-17:00]</td><td>Ca Trưa Thu Ngân [12:00-17:00]<br/>Ca Tối Thu Ngân [17:00-22:00]</td><td>Ca Sáng Thu Ngân [08:30-12:00]<br/>Ca Trưa Thu Ngân [12:00-17:00]<br/>Ca Tối Thu Ngân [17:00-22:00]</td><td>Ca Tối Thu Ngân [17:00-22:00]<br/>Ca Trưa Thu Ngân [12:00-17:00]</td><td>Ca Tối Thu Ngân [17:00-22:00]</td></tr>`
    html += `<tr><td class="emp-stats">13 ca | 62 giờ</td><td></td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`
    html += `</table></body></html>`

    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `File_Mau_Phan_Ca_Homies.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const handleAddFlexShift = () => {
    if (!flexShiftModalDate || !activeStoreId) return
    if (!flexShiftForm.employeeId) {
      setMessage('Vui lòng chọn nhân viên cho ca phát sinh!')
      return
    }

    const shiftName = flexShiftForm.name.trim() || 'Ca phát sinh'
    const posObj = getPositionById(flexShiftForm.positionId)
    const posLabel = posObj ? ` [${posObj.name}]` : ''
    const timeNote = `${shiftName}${posLabel} (${flexShiftForm.startTime}-${flexShiftForm.endTime})${flexShiftForm.isOvertime ? ' [Tăng ca]' : ''}`
    const flexShiftId = `shift-flex-${Date.now()}`

    addSchedule(
      activeStoreId,
      flexShiftForm.employeeId,
      flexShiftId,
      flexShiftModalDate,
      timeNote,
      'published',
      flexShiftForm.positionId || undefined
    )

    setMessage(`Đã thêm ${timeNote} thành công!`)
    setRefreshKey(prev => prev + 1)
    setFlexShiftModalDate(null)
  }

  const boardDemands = useMemo(() => board?.demands || [], [board])

  // Danh sách các hàng được phân nhóm theo Ca làm (Mẫu ca -> Danh sách Vị trí)
  const groupedShiftRows = useMemo(() => {
    return templates.map(tpl => {
      const basePosIds = tpl.allowed_position_ids?.length ? tpl.allowed_position_ids : ['pos-001', 'pos-002']
      const allowedPosIds = Array.from(new Set([...basePosIds, 'pos-001', 'pos-002']))
      const positionObjs = allowedPosIds
        .map(id => getPositionById(id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
        .filter(p => selectedPositionFilter === 'ALL' || p.id === selectedPositionFilter)

      return {
        template: tpl,
        positions: positionObjs,
      }
    }).filter(group => group.positions.length > 0)
  }, [templates, selectedPositionFilter])

  const demandForm = useMemo(() => {
    const nextState: DemandFormState = {}
    weekDates.forEach(date => {
      templates.forEach(template => {
        const allowedPosIds = template.allowed_position_ids?.length
          ? template.allowed_position_ids
          : positions.map(position => position!.id)
        allowedPosIds.forEach(positionId => {
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

  // Thông tin slot đang mở Modal xếp lịch (kèm fallback virtual slot nếu chưa có nhu cầu lưu trước)
  const activeModalSlotData = useMemo(() => {
    if (!activeSlotModal || !board) return null
    const found = board.demands.find(
      slot =>
        slot.date === activeSlotModal.date &&
        slot.shift_template_id === activeSlotModal.shiftTemplateId &&
        slot.position_id === activeSlotModal.positionId
    )
    if (found) return found

    // Fallback: Ô dữ liệu ảo để modal xếp lịch luôn tải được gợi ý nhân sự
    const template = templates.find(t => t.id === activeSlotModal.shiftTemplateId)
    const assigned = board.assignments.filter(
      a =>
        a.date === activeSlotModal.date &&
        a.shift_id === activeSlotModal.shiftTemplateId &&
        (a.assigned_position_id || board.employees.find(e => e.employee.id === a.employee_id)?.employee.position_id) === activeSlotModal.positionId
    )
    return {
      id: `virtual-${activeSlotModal.date}-${activeSlotModal.shiftTemplateId}-${activeSlotModal.positionId}`,
      registration_week_id: board.week.registration_week_id || '',
      store_id: activeStoreId,
      week_start: activeWeekStart,
      date: activeSlotModal.date,
      shift_template_id: activeSlotModal.shiftTemplateId,
      position_id: activeSlotModal.positionId,
      required_count: template?.min_headcount || 1,
      min_count: template?.min_headcount || 1,
      assigned_employee_ids: assigned.map(a => a.employee_id),
      preferred_employee_ids: [],
      available_employee_ids: [],
      unavailable_employee_ids: [],
      filled_count: assigned.length,
      missing_count: Math.max((template?.min_headcount || 1) - assigned.length, 0),
    }
  }, [activeSlotModal, board, templates, activeStoreId, activeWeekStart])

  const activeModalRecommendations = useMemo(() => {
    if (!activeModalSlotData || !board) return []
    return ScheduleService.getSlotRecommendations(board, activeModalSlotData).filter(rec => {
      if (!modalSearchTerm.trim()) return true
      const term = modalSearchTerm.toLowerCase()
      return (
        rec.employee_name.toLowerCase().includes(term) ||
        rec.position_name.toLowerCase().includes(term) ||
        rec.employee_id.toLowerCase().includes(term)
      )
    })
  }, [activeModalSlotData, board, modalSearchTerm])

  if (!user || !board) return null

  const validate = ScheduleService.validateWeekForPublish(user, activeStoreId, activeWeekStart)
  const selectedStore = getStoreById(activeStoreId)
  const totalDemand = board.demands.reduce((sum, slot) => sum + slot.required_count, 0)
  const totalAssigned = board.demands.reduce((sum, slot) => sum + slot.filled_count, 0)
  const isPublished = board.week.status === 'published' || board.week.cycle_status === 'published'
  const weekNum = getWeekNumber(activeWeekStart)
  const yearNum = parseDateKey(activeWeekStart).getFullYear()

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

  const handleAssign = async (employeeId: string, targetSlot: SlotModalTarget, changeReason?: string) => {
    const result = await ScheduleService.assignEmployeeToSlot({
      currentUser: user,
      storeId: activeStoreId,
      weekStart: activeWeekStart,
      employeeId,
      date: targetSlot.date,
      shiftTemplateId: targetSlot.shiftTemplateId,
      assignedPositionId: targetSlot.positionId,
      changeReason,
    })
    if (!result.schedule) {
      const overMaxWarn = result.warnings.find(w => w.type === 'over_max_headcount')
      const msg = overMaxWarn
        ? overMaxWarn.message
        : 'Không thể xếp ca. Ca này đã đạt số người tối đa cho phép hoặc nhân sự bị trùng ca.'
      setMessageTone('error')
      setMessage(msg)
      return
    }
    setRefreshKey(prev => prev + 1)
    if (result.trangThai === 'that_bai') {
      setMessageTone('error')
      setMessage(`Không thể ghi ca vào hệ thống. ${result.lyDo?.slice(0, 3).join(' · ') || 'Vui lòng kiểm tra lại dữ liệu.'}`)
      return
    }
    if (result.trangThai === 'chi_luu_may') {
      setMessageTone('warning')
      setMessage('Đã lưu tạm trên máy, CHƯA vào hệ thống. Ca này sẽ mất khi đổi máy.')
      return
    }
    if (result.warnings.length > 0) {
      const warningSummary = result.warnings.map(warning => warning.message).slice(0, 2).join(' · ')
      setMessageTone('info')
      setMessage(`Đã xếp ca: ${warningSummary}`)
      return
    }
    setMessageTone('info')
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

  const submitPublishedChange = () => {
    if (!pendingPublishedChange || !publishedChangeReason.trim()) {
      setMessage('Cần nhập lý do thay đổi khi sửa lịch đã chốt.')
      return
    }

    if (pendingPublishedChange.action === 'assign') {
      handleAssign(
        pendingPublishedChange.employeeId,
        {
          date: pendingPublishedChange.date,
          shiftTemplateId: pendingPublishedChange.shiftTemplateId,
          positionId: pendingPublishedChange.positionId,
          templateName: '',
          positionName: '',
          startTime: '',
          endTime: '',
        },
        publishedChangeReason.trim()
      )
    } else {
      handleRemove(pendingPublishedChange.employeeId, pendingPublishedChange.date, publishedChangeReason.trim())
    }

    setPendingPublishedChange(null)
    setPublishedChangeReason('')
  }

  const handleSaveDraftWeek = () => {
    const success = ScheduleService.saveDraftWeek(user, activeStoreId, weekDates)
    setMessage(success ? 'Đã lưu bản nháp tuần xếp lịch.' : 'Không thể lưu bản nháp tuần này.')
  }

  const handlePublish = () => {
    const validate = user && activeStoreId
      ? ScheduleService.validateWeekForPublish(user, activeStoreId, activeWeekStart)
      : { canPublish: true, hardWarnings: [], softWarnings: [] }

    const totalAssignmentsCount = board?.assignments?.length || 0

    // Mở Modal chi tiết kiểm tra để hiển thị tường tận mọi cảnh báo & lỗi cho người dùng
    setValidationModalData({
      hardWarnings: validate.hardWarnings,
      softWarnings: validate.softWarnings,
      totalAssignments: totalAssignmentsCount,
      canPublish: validate.canPublish,
    })
    setValidationFilterTab(validate.hardWarnings.length > 0 ? 'block' : 'all')
  }

  const handleConfirmPublishFinal = () => {
    const success = ScheduleService.publishWeek(user, activeStoreId, weekDates, {
      allowSoftWarnings: true,
    })
    if (!success) {
      setMessage('Chốt lịch thất bại. Vui lòng kiểm tra lại dữ liệu.')
      return
    }
    setValidationModalData(null)
    setRefreshKey(prev => prev + 1)
    setMessage('🎉 Đã chốt & phát hành lịch làm việc tuần thành công! Hệ thống đã gửi thông báo đến toàn bộ nhân sự.')
  }

  const openAssignModal = (
    date: string,
    tpl: typeof templates[0],
    pos: typeof positions[0],
    targetEmployeeId?: string
  ) => {
    if (!pos) return

    const demandSlot = boardDemands.find(
      d => d.date === date && d.shift_template_id === tpl.id && d.position_id === pos.id
    )
    const reqCount = demandSlot?.required_count ?? tpl.min_headcount ?? 1
    const targetQuota = Math.min(reqCount, tpl.max_headcount || 999)

    const assignedInCell = (board?.assignments || []).filter(
      s => s.date === date && s.shift_id === tpl.id
    )

    // Nếu không phải thao tác click vào tên để đổi người và ca đã đủ -> Chặn mở modal
    if (!targetEmployeeId && assignedInCell.length >= targetQuota) {
      setMessage(`⛔ Vị trí ${pos.name} trong ca ${tpl.name} đã đủ số lượng người (${assignedInCell.length}/${targetQuota}). Bấm vào tên nhân viên để ĐỔI NGUỜI.`)
      return
    }

    setActiveSlotModal({
      date,
      shiftTemplateId: tpl.id,
      positionId: pos.id,
      templateName: tpl.name,
      positionName: pos.name,
      startTime: tpl.start_time,
      endTime: tpl.end_time,
    })
    setModalSearchTerm('')
  }

  // Toggle "Chọn tất cả" trong modal
  const handleToggleSelectAll = () => {
    if (!activeSlotModal || !activeModalSlotData) return
    const allAssigned = activeModalRecommendations.every(r => r.is_assigned)

    if (allAssigned) {
      // Gỡ tất cả
      activeModalRecommendations.forEach(r => {
        if (r.is_assigned) {
          if (isPublished) {
            handleRemove(r.employee_id, activeSlotModal.date, 'Thay đổi ca xuất bản (hàng loạt)')
          } else {
            handleRemove(r.employee_id, activeSlotModal.date)
          }
        }
      })
    } else {
      // Gán tất cả chưa gán
      activeModalRecommendations.forEach(r => {
        if (!r.is_assigned) {
          if (isPublished) {
            handleAssign(r.employee_id, activeSlotModal, 'Phân công ca xuất bản (hàng loạt)')
          } else {
            handleAssign(r.employee_id, activeSlotModal)
          }
        }
      })
    }
  }

  return (
    <AppShell showNav>
      <div className="animate-fade-in space-y-4 pb-20">
        {/* Header Bar SaaS iPOS Style */}
        <div className="rounded-2xl border border-gray-200 bg-white p-3.5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Title & Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-gray-900 mr-1">Lịch làm việc theo tuần</h1>

              {/* Chế độ xem: Theo ca / Theo nhân viên */}
              <div className="flex items-center rounded-xl bg-gray-100 p-0.5 border border-gray-200 text-xs font-bold mr-1">
                <span className="rounded-lg bg-white px-2.5 py-1 text-gray-900 shadow-2xs">
                  Theo ca
                </span>
                <Link
                  href={`/schedule/by-employee?weekStart=${activeWeekStart}&storeId=${activeStoreId}`}
                  className="rounded-lg px-2.5 py-1 text-gray-500 hover:text-gray-900 transition"
                >
                  Theo nhân viên
                </Link>
              </div>

              {/* Chi nhánh dropdown */}
              {(user.role === 'ceo' || user.role === 'hr_admin') && (
                <select
                  value={activeStoreId}
                  onChange={e => setSelectedStoreId(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs hover:bg-gray-50 transition"
                >
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              )}

              {/* Chọn tuần */}
              <div className="flex items-center gap-1 rounded-xl border border-gray-300 bg-white px-2 py-1 shadow-2xs">
                <button
                  onClick={() => setWeekOffset(v => v - 1)}
                  className="rounded-lg p-1 text-gray-600 hover:bg-gray-100 transition"
                  title="Tuần trước"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="min-w-[170px] text-center text-xs font-bold text-gray-800">
                  Tuần {weekNum} năm {yearNum} ({formatCalendarDate(weekDates[0])} - {formatCalendarDate(weekDates[6])})
                </div>
                <button
                  onClick={() => setWeekOffset(v => v + 1)}
                  className="rounded-lg p-1 text-gray-600 hover:bg-gray-100 transition"
                  title="Tuần sau"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Bộ phận / Vị trí filter */}
              <select
                value={selectedPositionFilter}
                onChange={e => setSelectedPositionFilter(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs hover:bg-gray-50 transition"
              >
                <option value="ALL">Tất cả bộ phận</option>
                {positions.map(pos => (
                  <option key={pos?.id} value={pos?.id}>{pos?.name}</option>
                ))}
              </select>
            </div>

            {/* Top Toolbar Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setShiftSettingsList(ShiftTemplateService.getAll())
                  setShowShiftSettingsModal(true)
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#2F6FA8] hover:bg-blue-100 transition shadow-2xs cursor-pointer"
              >
                <Settings size={14} />
                Cài đặt ca làm
              </button>
              <button
                onClick={() => setShowDemandEditor(true)}
                className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-2xs"
              >
                Nhu cầu tuần
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center rounded-xl border border-emerald-600 bg-[#1E9E57] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition cursor-pointer"
              >
                Nhập Excel
              </button>
              <button
                onClick={handleClearWeekSchedules}
                className="inline-flex items-center rounded-xl border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 shadow-2xs hover:bg-red-100 transition cursor-pointer"
                title="Xóa toàn bộ ca trong tuần này để làm sạch bảng"
              >
                Làm sạch tuần
              </button>
              <button
                onClick={() => window.location.href = `/schedule/by-employee?weekStart=${activeWeekStart}&storeId=${activeStoreId}`}
                className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#2F6FA8] hover:bg-blue-100 transition shadow-2xs"
              >
                Xem theo nhân viên
              </button>
              <button
                onClick={handleSaveDraftWeek}
                className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-2xs"
              >
                Bản nháp
              </button>
              <button
                onClick={handlePublish}
                className="inline-flex items-center rounded-xl bg-[#2F6FA8] px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#1D3E61] transition"
              >
                Chốt & Phát hành
              </button>
            </div>
          </div>

          {/* Subbar: Thống kê trạng thái */}
          <div className="mt-2.5 flex items-center justify-between border-t border-gray-100 pt-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-500">Cửa hàng:</span>
              <span className="font-bold text-gray-800">{selectedStore?.name}</span>
              {weekStateMeta && (
                <span className={`ml-2 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${weekStateMeta.tone}`}>
                  {weekStateMeta.label}
                </span>
              )}
            </div>
            <div className="text-xs font-bold text-gray-700">
              Đã xếp: <span className="text-[#2F6FA8] font-extrabold">{totalAssigned}</span> / <span className="text-gray-900">{totalDemand}</span> ca
            </div>
          </div>
        </div>

        {/* Thông báo hệ thống */}
        {message && (
          <div className={`flex items-center justify-between rounded-xl border px-4 py-2 text-xs shadow-2xs ${
            messageTone === 'error'
              ? 'border-red-200 bg-red-50 text-red-900'
              : messageTone === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-blue-200 bg-blue-50 text-blue-900'
          }`}>
            <div className="flex items-center gap-2">
              <Sparkles size={14} className={`shrink-0 ${messageTone === 'error' ? 'text-red-600' : messageTone === 'warning' ? 'text-amber-600' : 'text-[#2F6FA8]'}`} />
              <span>{message}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePublish}
                className="inline-flex items-center gap-1 rounded-lg bg-[#2F6FA8] px-2.5 py-1 text-[11px] font-bold text-white hover:bg-[#1D3E61] transition cursor-pointer shadow-2xs"
              >
                <ShieldCheck size={12} />
                Xem chi tiết kiểm tra
              </button>
              <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer p-1">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Bảng Lịch làm việc SaaS iPOS Style (Hàng: Ca x Vị trí, Cột: 7 Ngày) */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1100px]">
              {/* Header Cột: Ca/Ngày & Các ngày trong tuần */}
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-bold text-gray-700">
                  <th className="w-56 p-3 text-left bg-gray-100/80 border-r border-gray-200">Ca / Vị trí</th>
                  {weekDates.map(date => (
                    <th key={date} className="p-3 text-center border-r border-gray-200 last:border-r-0 min-w-[140px]">
                      <div className="text-xs font-bold text-gray-800 uppercase">{formatShortDate(date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body Bảng: Phân nhóm theo Ca làm chuẩn Homies Theme (Shift Header Row + Position Rows) */}
              <tbody className="divide-y divide-gray-200 text-xs">
                {groupedShiftRows.map(({ template, positions: groupPositions }) => {
                  const tName = template.name.toLowerCase()
                  const isMorning = tName.includes('sáng') || template.code?.includes('AM')
                  const isAfternoon = tName.includes('chiều') || template.code?.includes('PM')
                  const isFlex = tName.includes('phát sinh') || tName.includes('linh hoạt') || template.code?.includes('FLEX')

                  const headerBgClass = isFlex
                    ? 'bg-blue-50/90 text-[#2F6FA8] border-2 border-dashed border-[#2F6FA8]/40'
                    : isMorning
                    ? 'bg-amber-100/90 text-amber-950 border-amber-300'
                    : isAfternoon
                    ? 'bg-[#DDF4EC] text-[#064E3B] border-[#1E9E57]/30'
                    : 'bg-[#001D3D] text-white border-[#001D3D]'

                  const timeBadgeClass = isFlex
                    ? 'bg-[#2F6FA8]/15 text-[#2F6FA8] border-[#2F6FA8]/30 font-bold'
                    : isMorning
                    ? 'bg-amber-200/80 text-amber-900 border-amber-300'
                    : isAfternoon
                    ? 'bg-[#1E9E57]/15 text-[#064E3B] border-[#1E9E57]/30'
                    : 'bg-white/15 text-blue-100 border-white/20'

                  const subTextClass = isFlex
                    ? 'text-[#2F6FA8] font-bold'
                    : isMorning
                    ? 'text-amber-800'
                    : isAfternoon
                    ? 'text-[#064E3B]/80'
                    : 'text-blue-200'

                  const subLabel = isFlex
                    ? 'Ca linh hoạt / Giờ cao điểm'
                    : 'Khung giờ cố định'

                  return (
                    <Fragment key={template.id}>
                      {/* Dòng Tiêu đề Ca làm (Chuẩn Mục 11.2 DESIGN_RULE_HOMIES_FINAL.md) */}
                      <tr className={`font-bold border-t-2 ${headerBgClass}`}>
                        <td colSpan={8} className="px-4 py-2.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="h-3 w-3 rounded-full shadow-2xs" style={{ backgroundColor: template.color || (isFlex ? '#8B5CF6' : isMorning ? '#F59E0B' : isAfternoon ? '#1E9E57' : '#2F6FA8') }} />
                              <span className="text-sm font-extrabold uppercase tracking-wide">{template.name}</span>
                              <span className={`rounded-lg px-2.5 py-0.5 text-xs font-semibold border ${timeBadgeClass}`}>
                                {template.start_time} - {template.end_time}
                              </span>
                            </div>
                            <span className={`text-xs font-medium hidden sm:inline ${subTextClass}`}>{subLabel}</span>
                          </div>
                        </td>
                      </tr>

                    {/* Các dòng Vị trí chuyên môn thuộc Ca làm này */}
                    {groupPositions.map(position => {
                      const rowKey = `${template.id}__${position.id}`
                      const isCashier = position.name.toLowerCase().includes('thu ngân')
                      const isBarista = position.name.toLowerCase().includes('pha chế')
                      const isService = position.name.toLowerCase().includes('phục vụ')

                      return (
                        <tr key={rowKey} className="hover:bg-[#2F6FA8]/5 transition">
                          {/* Cột Vị trí chuyên môn với Badge màu chuẩn palette Homies */}
                          <td className="p-3 align-top bg-gray-50/50 border-r border-gray-200">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block rounded-xl border px-3 py-1.5 text-xs font-extrabold shadow-2xs ${
                                  isCashier
                                    ? 'border-blue-200 bg-blue-50 text-[#2F6FA8]'
                                    : isBarista
                                    ? 'border-[#1E9E57]/30 bg-[#DDF4EC] text-[#1E9E57]'
                                    : isService
                                    ? 'border-[#F6C85F]/50 bg-[#FFF8E8] text-[#B45309]'
                                    : 'border-emerald-200 bg-emerald-100 text-emerald-950'
                                }`}
                              >
                                {position.name}
                              </span>
                            </div>
                          </td>

                          {/* 7 Ô ngày trong tuần */}
                          {weekDates.map(date => {
                            // Tìm các assignment thuộc ca và vị trí này trong ngày
                            const assignedInCell = board.assignments.filter(a => {
                              if (a.date !== date) return false
                              if (isFlexibleAssignment(a, regularTemplateIds, templates)) return false

                              // 1. Khớp Mẫu ca (theo ID, theo khung giờ hoặc theo từ khóa tên ca Sáng/Gãy/Trưa/Chiều/Tối/Đêm)
                              let shiftMatched = false
                              if (a.shift_id === template.id) {
                                shiftMatched = true
                              } else {
                                const notesLower = (a.notes || '').toLowerCase()
                                const notesClean = removeVietnameseTones(notesLower)
                                const tplNameLower = template.name.toLowerCase()
                                const tplClean = removeVietnameseTones(tplNameLower)

                                if (tplClean.includes('sang') && (notesClean.includes('sang') || notesClean.includes('08:30') || notesClean.includes('08:00') || notesClean.includes('09:00') || notesClean.includes('10:00') || notesClean.includes('06:30') || a.shift_id === 'shift-001')) {
                                  shiftMatched = true
                                } else if ((tplClean.includes('gay') || tplClean.includes('parttime') || tplClean.includes('trua')) && (notesClean.includes('gay') || notesClean.includes('trua') || notesClean.includes('11:00') || notesClean.includes('12:00') || notesClean.includes('13:00') || notesClean.includes('14:00') || notesClean.includes('15:00') || notesClean.includes('16:00'))) {
                                  shiftMatched = true
                                } else if ((tplClean.includes('chieu') || tplClean.includes('toi') || tplClean.includes('dem') || tplClean.includes('dong quay')) && (notesClean.includes('chieu') || notesClean.includes('toi') || notesClean.includes('dem') || notesClean.includes('kiem kho') || notesClean.includes('14:30') || notesClean.includes('17:00') || notesClean.includes('18:00') || notesClean.includes('19:00') || notesClean.includes('20:00') || notesClean.includes('21:00') || notesClean.includes('22:00') || a.shift_id === 'shift-002' || a.shift_id === 'shift-003')) {
                                  shiftMatched = true
                                }
                              }

                              if (!shiftMatched) return false

                              // 2. Khớp Vị trí chuyên môn (Pha chế, Thu ngân, Phục vụ hoặc điều chuyển)
                              const empPosId = board.employees.find(e => e.employee.id === a.employee_id)?.employee.position_id
                              let effectivePosId = a.assigned_position_id || empPosId
                              
                              const notesLower = (a.notes || '').toLowerCase()
                              const notesClean = removeVietnameseTones(notesLower)
                              if (notesClean.includes('thu ngan') || notesClean.includes('cashier')) {
                                effectivePosId = 'pos-002'
                              } else if (notesClean.includes('pha che') || notesClean.includes('barista')) {
                                effectivePosId = 'pos-001'
                              } else if (notesClean.includes('phuc vu') || notesClean.includes('server')) {
                                effectivePosId = 'pos-003'
                              }

                              if (effectivePosId === position.id) return true

                              // Nếu vị trí của nhân sự không nằm trong các hàng hiện có (vd Quản lý), hiển thị ở hàng vị trí đầu tiên để không bị mất ca
                              const isPosInGroup = groupPositions.some(p => p.id === effectivePosId)
                              if (!isPosInGroup && groupPositions[0]?.id === position.id) return true

                              return false
                            })

                            const cellKey = `${date}__${template.id}__${position.id}`
                            const isDropTarget = dropTargetKey === cellKey
                            const isDragActive = Boolean(draggedAssignment)

                            return (
                              <td
                                key={`${rowKey}-${date}`}
                                onDragOver={e => {
                                  e.preventDefault()
                                  if (draggedAssignment) {
                                    setDropTargetKey(cellKey)
                                  }
                                }}
                                onDragLeave={() => {
                                  if (dropTargetKey === cellKey) setDropTargetKey(null)
                                }}
                                onDrop={e => {
                                  e.preventDefault()
                                  if (draggedAssignment) {
                                    handleMoveShift(
                                      draggedAssignment.employeeId,
                                      draggedAssignment.fromDate,
                                      draggedAssignment.fromShiftId,
                                      date,
                                      template.id,
                                      position.id,
                                      draggedAssignment.notes
                                    )
                                    setDraggedAssignment(null)
                                    setDropTargetKey(null)
                                  }
                                }}
                                className={`p-2 align-top border-r border-gray-200 last:border-r-0 transition-all ${
                                  isDropTarget
                                    ? 'bg-emerald-100/90 border-2 border-dashed border-emerald-600 shadow-inner scale-[1.01]'
                                    : isDragActive
                                    ? 'bg-emerald-50/30 border border-dashed border-emerald-300/80 hover:bg-emerald-100/50'
                                    : 'hover:bg-[#2F6FA8]/5'
                                }`}
                              >
                                <div className="space-y-1.5 min-h-[70px]">
                                  {/* Thẻ nhân viên đã gán (Kéo - thả trực quan hoặc Dời ca nhanh) */}
                                  {assignedInCell.map(asg => {
                                    const emp = board.employees.find(e => e.employee.id === asg.employee_id)?.employee
                                    const empName = emp?.full_name || asg.employee_id
                                    const isSecondaryRole = asg.assigned_position_id && emp && asg.assigned_position_id !== emp.position_id

                                    return (
                                      <div
                                        key={`${asg.id}-${asg.employee_id}-${asg.shift_id}-${date}`}
                                        draggable
                                        onDragStart={e => {
                                          e.dataTransfer.setData('text/plain', asg.employee_id)
                                          setDraggedAssignment({
                                            employeeId: asg.employee_id,
                                            employeeName: empName,
                                            fromDate: date,
                                            fromShiftId: template.id,
                                            fromPositionId: position.id,
                                            notes: asg.notes,
                                          })
                                        }}
                                        onDragEnd={() => {
                                          setDraggedAssignment(null)
                                          setDropTargetKey(null)
                                        }}
                                        onClick={() => openAssignModal(date, template, position, asg.employee_id)}
                                        className={`group relative rounded-xl border border-[#1E9E57]/40 bg-[#DDF4EC] hover:bg-[#c9eee1] px-3 py-2 text-center text-xs font-bold text-[#1E9E57] shadow-2xs transition cursor-grab active:cursor-grabbing hover:scale-[1.02] ${
                                          draggedAssignment?.employeeId === asg.employee_id && draggedAssignment?.fromDate === date && draggedAssignment?.fromShiftId === template.id
                                            ? 'opacity-40 scale-95 border-dashed border-emerald-600'
                                            : ''
                                        }`}
                                        title="Giữ chuột kéo & thả sang ca khác hoặc bấm nút dời ca"
                                      >
                                        <div className="flex items-center justify-between gap-1">
                                          <GripVertical size={11} className="text-[#1E9E57]/50 group-hover:text-[#1E9E57] shrink-0" />
                                          <span className="block truncate text-xs flex-1">{empName}</span>
                                        </div>
                                        {isSecondaryRole && (
                                          <span className="block text-[9px] font-semibold text-[#001D3D]/60 mt-0.5">
                                            (Kiêm nhiệm)
                                          </span>
                                        )}

                                        {/* Thanh nút thao tác nhanh (Dời ca + Gỡ ca) */}
                                        <div className="absolute right-1 top-1 hidden group-hover:flex items-center gap-1 z-10">
                                          <button
                                            type="button"
                                            onClick={e => {
                                              e.stopPropagation()
                                              setMoveModalData({
                                                employeeId: asg.employee_id,
                                                employeeName: empName,
                                                fromDate: date,
                                                fromShiftId: template.id,
                                                fromPositionId: position.id,
                                                notes: asg.notes,
                                              })
                                              setTargetMoveDate(date)
                                              setTargetMoveShiftId(template.id)
                                              setTargetMovePosId(position.id)
                                            }}
                                            className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2F6FA8] text-white hover:bg-[#1D3E61] transition"
                                            title="Dời ca sang ngày/ca khác"
                                          >
                                            <ArrowRightLeft size={9} />
                                          </button>
                                          <button
                                            type="button"
                                            onClick={e => {
                                              e.stopPropagation()
                                              if (isPublished) {
                                                setPendingPublishedChange({
                                                  action: 'remove',
                                                  employeeId: asg.employee_id,
                                                  employeeName: empName,
                                                  date,
                                                  shiftTemplateId: template.id,
                                                  positionId: position.id,
                                                })
                                              } else {
                                                handleRemove(asg.employee_id, date)
                                              }
                                            }}
                                            className="flex h-4 w-4 items-center justify-center rounded-full bg-[#D9381E] text-white hover:bg-red-700 transition"
                                            title="Gỡ nhân sự"
                                          >
                                            <X size={9} />
                                          </button>
                                        </div>
                                      </div>
                                    )
                                  })}

                                  {/* Phương án C: Nút (+) mỏng đơn giản bên dưới (Ẩn nút khi đã đạt số người nhu cầu) */}
                                  {(() => {
                                    const demandSlot = boardDemands.find(
                                      d => d.date === date && d.shift_template_id === template.id && d.position_id === position.id
                                    )
                                    const reqCount = demandSlot?.required_count ?? template.min_headcount ?? 1
                                    const maxHeadcount = template.max_headcount || 999
                                    const targetQuota = Math.min(reqCount, maxHeadcount)

                                    // Ẩn hoàn toàn nút (+) khi số người đã gán đạt hoặc vượt nhu cầu
                                    if (assignedInCell.length >= targetQuota) return null

                                    return (
                                      <div
                                        onClick={() => openAssignModal(date, template, position)}
                                        className="w-full rounded-xl border border-dashed border-gray-300 bg-white/80 opacity-65 hover:opacity-100 hover:border-[#2F6FA8] hover:bg-[#2F6FA8]/5 py-1.5 text-center text-gray-400 hover:text-[#2F6FA8] cursor-pointer transition flex items-center justify-center shadow-2xs"
                                        title={`Thêm nhân sự (${assignedInCell.length}/${targetQuota})`}
                                      >
                                        <Plus size={15} strokeWidth={2.2} />
                                      </div>
                                    )
                                  })()}
                                </div>
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                  </Fragment>
                )
              })}

                {/* Dòng Tiêu đề Ca phát sinh (Linh hoạt / Tăng cường) */}
                <tr className="bg-blue-50/80 font-bold border-t-2 border-dashed border-[#2F6FA8]/40">
                  <td colSpan={8} className="px-4 py-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full bg-[#2F6FA8] shadow-2xs" />
                        <span className="text-sm font-extrabold uppercase tracking-wide text-[#2F6FA8]">Ca phát sinh (Linh hoạt)</span>
                      </div>
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2F6FA8] hidden sm:inline">
                        <Zap size={14} /> Bấm (+) ở các ô ngày để thêm ca đột xuất
                      </span>
                    </div>
                  </td>
                </tr>

                {/* Hàng chứa các ô (+) Thêm ca phát sinh cho từng ngày */}
                <tr className="hover:bg-blue-50/20 transition">
                  <td className="p-3 align-top bg-gray-50/50 border-r border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-extrabold text-[#2F6FA8] shadow-2xs">
                        <Zap size={13} /> Ca đột xuất / OT
                      </span>
                    </div>
                  </td>

                  {weekDates.map(date => {
                    // Lọc các ca phát sinh đã gán trong ngày này
                    const flexAssignments = board?.assignments.filter(
                      a => a.date === date && isFlexibleAssignment(a, regularTemplateIds, templates)
                    ) || []

                    const allCompanyEmps: Array<{ id: string; full_name: string }> = EmployeeService.getEmployees(user ?? undefined)

                    return (
                      <td
                        key={`flex-col-${date}`}
                        className="p-2 align-top border-r border-gray-200 last:border-r-0 hover:bg-[#2F6FA8]/5 transition"
                      >
                        <div className="space-y-1.5 min-h-[70px]">
                          {/* Các thẻ Ca phát sinh đã thêm */}
                          {flexAssignments.map(asg => {
                            const emp = allCompanyEmps.find(e => e.id === asg.employee_id)
                              || board?.employees.find(e => e.employee.id === asg.employee_id)?.employee
                            const empName = emp?.full_name || asg.employee_id

                            return (
                              <div
                                key={asg.id}
                                className="group relative rounded-xl border border-blue-300 bg-blue-50 hover:bg-blue-100 px-3 py-2 text-center text-xs font-bold text-[#2F6FA8] shadow-2xs transition"
                              >
                                <div className="text-[10px] text-blue-800 font-extrabold leading-tight mb-0.5 truncate">{asg.notes || 'Ca phát sinh'}</div>
                                <span className="block truncate text-xs text-blue-950 font-bold">{empName}</span>

                                <button
                                  onClick={e => {
                                    e.stopPropagation()
                                    handleRemove(asg.employee_id, date)
                                  }}
                                  className="absolute right-1 top-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-[#D9381E] text-white hover:bg-red-700 transition"
                                  title="Gỡ ca phát sinh"
                                >
                                  <X size={10} />
                                </button>
                              </div>
                            )
                          })}

                          {/* Nút (+) mở Popup Modal Thêm ca phát sinh đúng theo mẫu người dùng gửi */}
                          <div
                            onClick={() => {
                              setFlexShiftForm({
                                name: '',
                                startTime: '11:30',
                                endTime: '14:30',
                                employeeId: '',
                                positionId: '',
                                isOvertime: false,
                                calculationType: 'shift_hours',
                              })
                              setFlexShiftModalDate(date)
                            }}
                            className="w-full rounded-xl border-2 border-dashed border-blue-300 bg-white hover:border-[#2F6FA8] hover:bg-blue-50/50 py-2.5 text-center text-blue-500 hover:text-[#2F6FA8] cursor-pointer transition flex items-center justify-center font-bold"
                            title="Thêm ca phát sinh cho ngày này"
                          >
                            <Plus size={16} strokeWidth={2.5} />
                          </div>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* POPUP MODAL XẾP LỊCH CHO CA (ĐÚNG THEO MẪU ẢNH USER GỬI) */}
      {activeSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-in border border-gray-200">
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b border-gray-200 p-4 bg-gray-50">
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-snug">
                  Xếp lịch cho {activeSlotModal.templateName} {activeSlotModal.positionName} [{activeSlotModal.startTime} - {activeSlotModal.endTime}]
                </h2>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">
                  {formatDayFullDate(activeSlotModal.date)}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Ô tìm kiếm nhân viên */}
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm nhân viên..."
                    value={modalSearchTerm}
                    onChange={e => setModalSearchTerm(e.target.value)}
                    className="w-48 rounded-xl border border-gray-300 bg-white pl-8 pr-3 py-1 text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-purple-600 shadow-2xs"
                  />
                </div>

                <button
                  onClick={() => setActiveSlotModal(null)}
                  className="rounded-lg p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Thông báo chặn khi ca đã đạt Max Headcount */}
            {(() => {
              const template = templates.find(t => t.id === activeSlotModal.shiftTemplateId)
              const maxCount = template?.max_headcount || 999
              const currentAssignedCount = activeModalRecommendations.filter(r => r.is_assigned).length
              const isFull = currentAssignedCount >= maxCount

              return (
                <>
                  {isFull && (
                    <div className="flex items-center gap-2 bg-red-50 border-b border-red-100 px-5 py-2 text-xs font-bold text-red-700">
                      <span>⛔ Ca này đã đạt số lượng tối đa cho phép ({currentAssignedCount}/{maxCount} người). Hệ thống chặn không cho xếp thêm.</span>
                    </div>
                  )}

                  {/* Toolbar "Chọn tất cả" */}
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-2.5 bg-white">
                    <label className="flex items-center gap-3 cursor-pointer text-xs font-bold text-gray-700 select-none">
                      <input
                        type="checkbox"
                        checked={activeModalRecommendations.length > 0 && activeModalRecommendations.every(r => r.is_assigned)}
                        onChange={handleToggleSelectAll}
                        disabled={isFull && !activeModalRecommendations.every(r => r.is_assigned)}
                        className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer disabled:opacity-50"
                      />
                      <span>Chọn tất cả</span>
                    </label>

                    <span className="text-xs font-semibold text-gray-500">
                      Đã chọn: <strong className={isFull ? 'text-red-600' : 'text-gray-900'}>{currentAssignedCount}</strong> / {maxCount} người tối đa
                    </span>
                  </div>
                </>
              )
            })()}

            {/* Danh sách ứng viên xếp lịch */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 p-2">
              {activeModalRecommendations.length > 0 ? (
                activeModalRecommendations.map(rec => {
                  const empObj = board.employees.find(e => e.employee.id === rec.employee_id)?.employee

                  return (
                    <div
                      key={rec.employee_id}
                      onClick={() => {
                        const isFull = activeModalSlotData ? activeModalSlotData.missing_count === 0 : false
                        if (rec.is_assigned) {
                          if (isPublished) {
                            setPendingPublishedChange({
                              action: 'remove',
                              employeeId: rec.employee_id,
                              employeeName: rec.employee_name,
                              date: activeSlotModal.date,
                              shiftTemplateId: activeSlotModal.shiftTemplateId,
                              positionId: activeSlotModal.positionId,
                            })
                          } else {
                            handleRemove(rec.employee_id, activeSlotModal.date)
                          }
                        } else {
                          // Tự động gỡ người cũ nếu ca đã đầy để hoán đổi người mới
                          if (isFull) {
                            const currentlyAssigned = activeModalRecommendations.filter(r => r.is_assigned)
                            currentlyAssigned.forEach(oldRec => {
                              handleRemove(oldRec.employee_id, activeSlotModal.date)
                            })
                          }

                          if (isPublished) {
                            setPendingPublishedChange({
                              action: 'assign',
                              employeeId: rec.employee_id,
                              employeeName: rec.employee_name,
                              date: activeSlotModal.date,
                              shiftTemplateId: activeSlotModal.shiftTemplateId,
                              positionId: activeSlotModal.positionId,
                            })
                          } else {
                            handleAssign(rec.employee_id, activeSlotModal)
                          }
                        }
                      }}
                      className={`flex items-center justify-between gap-3 p-3 rounded-xl cursor-pointer transition ${
                        rec.is_assigned ? 'bg-purple-50/50 hover:bg-purple-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Checkbox & Thông tin nhân viên */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={rec.is_assigned}
                          readOnly
                          className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer shrink-0 pointer-events-none"
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Mã & Tên nhân viên (Chữ to rõ ràng) */}
                            <span className="text-sm font-bold text-gray-900 truncate">
                              {empObj?.employee_code || 'NV'} - {rec.employee_name}
                            </span>

                            {/* Dropdown Vị trí */}
                            <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-bold text-sky-700">
                              {activeSlotModal.positionName} ▾
                            </span>
                          </div>

                          {/* Chi tiết email, phòng ban, hình thức */}
                          <div className="mt-1 text-[11px] text-gray-400 font-medium truncate flex items-center gap-1.5">
                            <span>{empObj?.email || 'nhanvien@homies.com'}</span>
                            <span>|</span>
                            <span>{selectedStore?.name || 'HBP - Trà sữa phô mai tươi HOMIES'}</span>
                            <span>|</span>
                            <span>Nhân viên</span>
                            <span>|</span>
                            <span>{empObj?.status === 'probation' ? 'Thử việc' : 'Bán thời gian'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Badge Trạng thái bên phải */}
                      <div className="shrink-0">
                        {rec.is_assigned ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                            Đã gán
                          </span>
                        ) : (() => {
                          const template = templates.find(t => t.id === activeSlotModal.shiftTemplateId)
                          const maxCount = template?.max_headcount || 999
                          const currentAssignedCount = activeModalRecommendations.filter(r => r.is_assigned).length
                          if (currentAssignedCount >= maxCount) {
                            return (
                              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                                Đã đầy ({currentAssignedCount}/{maxCount})
                              </span>
                            )
                          }
                          return rec.preference === 'preferred' ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800">
                              Ưu tiên
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                              Sẵn sàng
                            </span>
                          )
                        })()}
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-8 text-center text-xs text-gray-400">Không tìm thấy nhân viên nào phù hợp.</div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="border-t border-gray-200 p-3 bg-gray-50 flex justify-end">
              <button
                onClick={() => setActiveSlotModal(null)}
                className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-700 transition"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Thiết lập nhu cầu tuần */}
      {showDemandEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-5xl rounded-3xl bg-white p-6 shadow-2xl max-h-[90vh] flex flex-col animate-scale-in border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Thiết lập nhu cầu ca tuần</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Điều chỉnh số lượng nhân sự cần cho từng ca & vị trí trong tuần (Đã đồng bộ chuẩn theo Cài đặt ca)
                </p>
              </div>
              <button onClick={() => setShowDemandEditor(false)} className="rounded-xl p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-5 space-y-5 pr-1">
              {templates.map(template => {
                const allowedPosIds = template.allowed_position_ids?.length
                  ? template.allowed_position_ids
                  : positions.map(p => p!.id)
                const allowedPositions = positions.filter(p => p && allowedPosIds.includes(p.id))

                return (
                  <div key={template.id} className="rounded-2xl border border-gray-200 p-4 bg-gray-50/50 shadow-2xs">
                    <div className="flex items-center justify-between font-bold text-sm text-gray-800 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: template.color }} />
                        <span>{template.name} ({template.start_time} - {template.end_time})</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                        {allowedPositions.length} vị trí cho phép
                      </span>
                    </div>

                    <div className="grid grid-cols-7 gap-3">
                      {weekDates.map(date => (
                        <div key={date} className="rounded-xl border border-gray-200 bg-white p-2.5 text-center shadow-2xs">
                          <div className="text-[11px] font-bold text-gray-700 mb-2 border-b border-gray-100 pb-1">
                            {formatCalendarDate(date)} ({getDayLabel(date)})
                          </div>
                          {allowedPositions.map(pos => {
                            const key = `${date}__${template.id}__${pos?.id}`
                            return (
                              <div key={pos?.id} className="mt-2 flex items-center justify-between gap-1 text-xs">
                                <span className="font-semibold text-gray-700 text-[11px] truncate" title={pos?.name}>
                                  {pos?.name}:
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  max={10}
                                  value={draftDemand[key] ?? 1}
                                  onChange={e => {
                                    const val = Math.max(0, parseInt(e.target.value) || 0)
                                    setDraftDemand(prev => ({ ...prev, [key]: val }))
                                  }}
                                  className="w-11 rounded-lg border border-gray-300 text-center py-1 text-xs font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-purple-500 bg-gray-50/50"
                                />
                              </div>
                            )
                          })}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-gray-100 pt-3">
              <button
                onClick={() => setShowDemandEditor(false)}
                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  saveDemandState(draftDemand, 'Đã cập nhật nhu cầu ca tuần.')
                  setShowDemandEditor(false)
                }}
                className="rounded-xl bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-700"
              >
                Lưu cấu hình nhu cầu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nhập lý do thay đổi khi Lịch đã Chốt */}
      {pendingPublishedChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl animate-scale-in space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="text-sm font-bold text-gray-800">Xác nhận thay đổi lịch đã chốt</h3>
              <button onClick={() => setPendingPublishedChange(null)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Lịch tuần này đã được xuất bản. Vui lòng nhập lý do {pendingPublishedChange.action === 'assign' ? 'gán' : 'gỡ'}{' '}
              nhân sự <strong className="text-gray-800">{pendingPublishedChange.employeeName}</strong>.
            </p>

            <textarea
              rows={3}
              value={publishedChangeReason}
              onChange={e => setPublishedChangeReason(e.target.value)}
              placeholder="Nhập lý do thay đổi..."
              className="w-full rounded-xl border border-gray-200 p-3 text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:ring-1 focus:ring-purple-600"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPendingPublishedChange(null)}
                className="rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Hủy
              </button>
              <button
                onClick={submitPublishedChange}
                disabled={!publishedChangeReason.trim()}
                className="rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-bold text-white disabled:opacity-50 hover:bg-purple-700"
              >
                Xác nhận thay đổi
              </button>
            </div>
          </div>
        </div>
      )}
      {/* POPUP MODAL THÊM CA PHÁT SINH (CHUẨN DESIGN RULE HOMIES FINAL) */}
      {flexShiftModalDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white shadow-2xl overflow-hidden flex flex-col animate-scale-in border border-gray-100">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-[#FFF8E8]/70">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2F6FA8]/10 text-[#2F6FA8] font-bold">
                  <Zap size={20} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-[#001D3D] tracking-tight">
                    Thêm ca phát sinh (Linh hoạt)
                  </h2>
                  <p className="text-xs font-semibold text-[#2F6FA8]">
                    Áp dụng cho ngày: {formatDayFullDate(flexShiftModalDate)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setFlexShiftModalDate(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-[#FFF8E8] hover:text-[#001D3D] transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Form */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Tên ca phát sinh */}
              <div>
                <label className="block text-xs font-bold text-[#001D3D] mb-1.5">
                  Tên ca làm <span className="text-gray-400 font-normal">(tùy chọn)</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Ca phát sinh trưa, Tăng cường giờ cao điểm, Ca sự kiện..."
                  value={flexShiftForm.name}
                  onChange={e => setFlexShiftForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-[#001D3D] placeholder-gray-400 focus:outline-hidden focus:border-[#2F6FA8] focus:ring-2 focus:ring-[#2F6FA8]/15"
                />
              </div>

              {/* Khung giờ bắt đầu & kết thúc */}
              <div className="rounded-2xl border border-[#2F6FA8]/20 bg-[#FFF8E8]/50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#001D3D] flex items-center gap-1.5">
                    <Clock size={15} className="text-[#2F6FA8]" /> Khung giờ làm việc
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#DDF4EC] px-2.5 py-0.5 text-xs font-bold text-[#1E9E57] border border-[#1E9E57]/30">
                    <Clock size={12} /> Thời lượng: {getShiftDurationLabel(flexShiftForm.startTime, flexShiftForm.endTime) || 'Chưa chọn'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Giờ bắt đầu</label>
                    <input
                      type="time"
                      value={flexShiftForm.startTime}
                      onChange={e => setFlexShiftForm(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#001D3D] focus:outline-hidden focus:border-[#2F6FA8] focus:ring-2 focus:ring-[#2F6FA8]/15"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-1">Giờ kết thúc</label>
                    <input
                      type="time"
                      value={flexShiftForm.endTime}
                      onChange={e => setFlexShiftForm(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-[#001D3D] focus:outline-hidden focus:border-[#2F6FA8] focus:ring-2 focus:ring-[#2F6FA8]/15"
                    />
                  </div>
                </div>
              </div>

              {/* Chọn nhân viên */}
              <div>
                <label className="block text-xs font-bold text-[#001D3D] mb-1.5 flex items-center justify-between">
                  <span>Nhân viên đảm nhận <span className="text-[#D9381E]">*</span></span>
                  <span className="text-[11px] text-gray-400 font-normal">Được gán trực tiếp vào ca này</span>
                </label>
                <select
                  value={flexShiftForm.employeeId}
                  onChange={e => {
                    const empId = e.target.value
                    const empObj = board?.employees.find(emp => emp.employee.id === empId)?.employee
                    setFlexShiftForm(prev => ({
                      ...prev,
                      employeeId: empId,
                      positionId: prev.positionId || empObj?.position_id || '',
                    }))
                  }}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-[#001D3D] focus:outline-hidden focus:border-[#2F6FA8] focus:ring-2 focus:ring-[#2F6FA8]/15 cursor-pointer"
                >
                  <option value="">-- Chọn nhân viên trong danh sách --</option>
                  {board?.employees.map(emp => {
                    const primaryPos = getPositionById(emp.employee.position_id)?.name || 'Nhân viên'
                    const secPositions = (emp.employee.secondary_position_ids || [])
                      .map(id => getPositionById(id)?.name)
                      .filter(Boolean)
                    const secLabel = secPositions.length > 0 ? ` • Kiêm: ${secPositions.join(', ')}` : ''

                    return (
                      <option key={emp.employee.id} value={emp.employee.id}>
                        {emp.employee.employee_code || 'NV'} • {emp.employee.full_name} ({primaryPos}{secLabel})
                      </option>
                    )
                  })}
                </select>
              </div>

              {/* Vị trí đảm nhận trong ca */}
              <div>
                <label className="block text-xs font-bold text-[#001D3D] mb-1.5 flex items-center justify-between">
                  <span>Vị trí đảm nhận trong ca</span>
                  <span className="text-[11px] text-gray-400 font-normal">Pha chế, Thu ngân, v.v.</span>
                </label>
                <select
                  value={flexShiftForm.positionId}
                  onChange={e => setFlexShiftForm(prev => ({ ...prev, positionId: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-[#001D3D] focus:outline-hidden focus:border-[#2F6FA8] focus:ring-2 focus:ring-[#2F6FA8]/15 cursor-pointer"
                >
                  <option value="">-- Mặc định theo chức vụ chính --</option>
                  {positions.filter((pos): pos is NonNullable<typeof pos> => Boolean(pos)).map(pos => (
                    <option key={pos.id} value={pos.id}>
                      {pos.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tăng ca (Công tắc Toggle) */}
              <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-[#FFF8E8]/40 p-3.5">
                <div>
                  <div className="text-xs font-bold text-[#001D3D]">Tính là ca Tăng ca (OT)</div>
                  <div className="text-[11px] text-gray-500">Đánh dấu ca này là làm thêm giờ ngoài định mức</div>
                </div>
                <button
                  type="button"
                  onClick={() => setFlexShiftForm(prev => ({ ...prev, isOvertime: !prev.isOvertime }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    flexShiftForm.isOvertime ? 'bg-[#2F6FA8]' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      flexShiftForm.isOvertime ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Cách tính giờ làm việc */}
              <div>
                <label className="block text-xs font-bold text-[#001D3D] mb-1.5">Cách tính công & giờ làm</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setFlexShiftForm(prev => ({ ...prev, calculationType: 'shift_hours' }))}
                    className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                      flexShiftForm.calculationType === 'shift_hours'
                        ? 'border-2 border-[#2F6FA8] bg-[#E6F0FA] text-[#001D3D] shadow-2xs'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-[#FFF8E8]/50'
                    }`}
                  >
                    <div className="text-xs font-bold">Theo khung giờ ca</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Tính đúng số giờ của ca quy định</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFlexShiftForm(prev => ({ ...prev, calculationType: 'actual_hours' }))}
                    className={`rounded-xl border p-3 text-left transition cursor-pointer ${
                      flexShiftForm.calculationType === 'actual_hours'
                        ? 'border-2 border-[#2F6FA8] bg-[#E6F0FA] text-[#001D3D] shadow-2xs'
                        : 'border border-gray-200 bg-white text-gray-700 hover:bg-[#FFF8E8]/50'
                    }`}
                  >
                    <div className="text-xs font-bold">Theo giờ thực tế</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">Dựa trên chấm công check-in/out</div>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Nút bấm */}
            <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 bg-[#FFF8E8]/40">
              <button
                type="button"
                onClick={() => setFlexShiftModalDate(null)}
                className="h-10 rounded-xl border border-gray-200 bg-white px-5 text-xs font-bold text-gray-700 hover:bg-[#FFF8E8] transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleAddFlexShift}
                className="h-10 rounded-xl bg-[#2F6FA8] hover:bg-[#1D3E61] px-6 text-xs font-bold text-white transition shadow-sm cursor-pointer inline-flex items-center gap-2"
              >
                <Plus size={16} />
                <span>Thêm ca phát sinh</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL NHẬP LỊCH TỪ EXCEL (3 BƯỚC) — DỮ LIỆU THẬT & ĐỒNG BỘ */}
      {/* ============================================================ */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-2 sm:p-4 backdrop-blur-xs">
          <div className={`flex flex-col bg-white shadow-2xl overflow-hidden border border-slate-200 transition-all duration-200 ${isModalMaximized ? 'w-full h-full max-w-none max-h-none rounded-none' : 'w-[96vw] max-w-[1650px] max-h-[94vh] rounded-3xl'}`}>
            
            {/* Header Modal - Apple SaaS Deep Navy Header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-3.5 bg-[#001D3D] text-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#2F6FA8]/30 border border-[#2F6FA8]/40 text-blue-300 shadow-inner">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-base tracking-tight">
                      Nhập lịch phân ca từ Excel
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[11px] font-bold text-blue-200 border border-blue-400/30">
                      <Building2 size={11} /> {stores.find(s => s.id === importSelectedStoreId)?.name || 'Cơ sở'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 flex items-center gap-2 mt-0.5">
                    <span>Áp dụng cho Tuần: {formatShortDate(weekDates[0])} - {formatShortDate(weekDates[6])}</span>
                    {selectedFile && <span className="text-slate-400">• File: {selectedFile.name}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Nút phóng to / thu nhỏ cửa sổ */}
                <button
                  type="button"
                  onClick={() => setIsModalMaximized(prev => !prev)}
                  className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                  title={isModalMaximized ? "Thu nhỏ cửa sổ" : "Mở rộng toàn màn hình"}
                >
                  {isModalMaximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setSelectedFile(null)
                    setParsedRows([])
                    setParsedHeaders([])
                    setColumnMapping({})
                    setBatchDuplicates([])
                    setBatchFileSummaries([])
                    setImportStep(1)
                  }}
                  className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Stepper Chỉ báo tiến trình - Apple Segmented Style */}
            <div className="p-2 bg-slate-100/80 border-b border-gray-200 shrink-0">
              <div className="grid grid-cols-3 gap-1 rounded-2xl bg-slate-200/60 p-1 text-xs font-bold text-center">
                <div className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${importStep === 1 ? 'bg-white text-[#001D3D] shadow-xs font-extrabold' : 'text-slate-500'}`}>
                  <Upload size={13} /> 1. Tải file Excel
                </div>
                <div className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${importStep === 2 ? 'bg-white text-[#001D3D] shadow-xs font-extrabold' : 'text-slate-500'}`}>
                  <Sparkles size={13} className={importStep === 2 ? 'text-emerald-600' : ''} /> 2. Xem trước & Khớp thông minh
                </div>
                <div className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${importStep === 3 ? 'bg-white text-[#001D3D] shadow-xs font-extrabold' : 'text-slate-500'}`}>
                  <CheckCircle2 size={13} className={importStep === 3 ? 'text-blue-600' : ''} /> 3. Xác nhận & Lưu dữ liệu
                </div>
              </div>
            </div>

            {/* ===== BƯỚC 1: TẢI FILE ===== */}
            {importStep === 1 && (
              <div className="p-6 space-y-4 overflow-y-auto">
                <div className="flex items-center justify-between rounded-2xl bg-amber-50 p-4 border border-amber-200 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-600 shrink-0" />
                    <span>Tải file Excel mẫu phân ca chuẩn để xem cấu trúc định dạng chuẩn:</span>
                  </div>
                  <button
                    onClick={handleDownloadSampleExcel}
                    className="shrink-0 rounded-xl bg-amber-600 hover:bg-amber-700 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <FileSpreadsheet size={13} /> Tải file mẫu (.xls)
                  </button>
                </div>

                <div className="rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-[#2F6FA8] transition bg-gray-50/50">
                  <input
                    type="file"
                    id="excel-file-input-mgr"
                    accept=".xlsx, .xls, .csv"
                    multiple
                    className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files || [])
                      if (files.length > 0) handleFilesSelected(files)
                    }}
                  />
                  <label htmlFor="excel-file-input-mgr" className="cursor-pointer block space-y-2">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-[#2F6FA8] shadow-inner">
                      <Upload size={26} />
                    </div>
                    <div className="text-sm font-bold text-gray-800">
                      {selectedFiles.length > 1
                        ? `Đã chọn ${selectedFiles.length} file Excel (Hệ thống sẽ nạp hàng loạt tất cả các tuần)`
                        : selectedFile
                          ? selectedFile.name
                          : 'Nhấn để chọn 1 hoặc nhiều file Excel cùng lúc (.xlsx, .xls, .csv)'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {selectedFiles.length > 1 ? (
                        <div className="flex flex-wrap items-center justify-center gap-1 mt-1">
                          {selectedFiles.map((f, i) => (
                            <span key={i} className="px-2 py-0.5 rounded-md bg-blue-50 text-[#2F6FA8] font-bold text-[10px] border border-blue-200">
                              {f.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        'Giữ phím Ctrl hoặc Shift để chọn cùng lúc nhiều file Excel các tuần khác nhau'
                      )}
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* ===== BƯỚC 2: XEM TRƯỚC VÀ MATCH CỘT / CA (TỐI ƯU GỌN GÀNG, DỄ NHÌN) ===== */}
            {importStep === 2 && (
              <div className="flex flex-col flex-1 min-h-0 overflow-hidden" style={{ minHeight: '620px', maxHeight: isModalMaximized ? '88vh' : '84vh' }}>
                
                {/* Dải 1: Banner Tuần Thông Minh (Gọn gàng) */}
                {detectedWeekStart && (
                  <div className="px-5 py-2 bg-emerald-50 border-b border-emerald-200 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-emerald-950 font-bold">
                      <Calendar size={15} className="text-emerald-700" />
                      <span>{dateMappingMode === 'file_date' && importPreviewDates.length > 7 ? 'Khoảng ngày trong Excel:' : 'Tuần trong Excel:'}</span>
                      <span className="bg-white px-2 py-0.5 rounded-lg border border-emerald-300 font-extrabold text-emerald-900 shadow-2xs">
                        {dateMappingMode === 'file_date' && importPreviewDates.length > 0
                          ? `${formatCalendarDate(importPreviewDates[0])} — ${formatCalendarDate(importPreviewDates[importPreviewDates.length - 1])}`
                          : `${formatCalendarDate(detectedWeekStart)} — ${formatCalendarDate(plusDays(detectedWeekStart, 6))}`}
                      </span>
                      <span className="text-[11px] text-emerald-700 font-medium hidden md:inline">
                        ({dateMappingMode === 'file_date' ? 'Lưu theo ngày trong file & chuyển tuần sau khi nhập' : 'Ghép theo Thứ vào tuần đang xem'})
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleToggleDateMappingMode('file_date')}
                        className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${dateMappingMode === 'file_date' ? 'bg-[#1E9E57] text-white shadow-2xs' : 'bg-white text-gray-700 hover:bg-gray-100 border border-emerald-200'}`}
                      >
                        ✓ Ngày thực tế ({formatCalendarDate(detectedWeekStart)})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleDateMappingMode('current_week')}
                        className={`px-3 py-1 rounded-lg text-xs font-extrabold transition cursor-pointer ${dateMappingMode === 'current_week' ? 'bg-[#2F6FA8] text-white shadow-2xs' : 'bg-white text-gray-700 hover:bg-gray-100 border border-emerald-200'}`}
                      >
                        Ghép tuần đang xem
                      </button>
                    </div>
                  </div>
                )}

                {/* Dải 2: Thanh Tóm Tắt, Selector Chi Nhánh, View Switcher & Controls Bar */}
                <div className="px-5 py-2.5 bg-white border-b border-gray-200 shrink-0 flex flex-wrap items-center justify-between gap-3">
                  {/* Selector Chi nhánh & Thống kê thông minh */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Chọn Chi Nhánh Áp Dụng */}
                    <div className="flex items-center gap-1.5 bg-blue-50/80 px-2.5 py-1 rounded-xl border border-blue-200">
                      <Building2 size={13} className="text-[#2F6FA8]" />
                      <span className="font-bold text-slate-700 text-[11px]">Cơ sở:</span>
                      <select
                        value={importSelectedStoreId}
                        onChange={e => setImportSelectedStoreId(e.target.value)}
                        className="bg-white text-[#001D3D] text-[11px] font-extrabold px-2 py-0.5 rounded-lg border border-blue-300 focus:outline-none focus:ring-1 focus:ring-[#2F6FA8] cursor-pointer"
                      >
                        {stores.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} {s.id === activeStoreId ? '(Đang xem)' : ''}
                          </option>
                        ))}
                      </select>
                      {autoDetectedStoreId && autoDetectedStoreId === importSelectedStoreId && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-1.5 py-0.5">
                          <Sparkles size={10} /> Khớp từ file
                        </span>
                      )}
                    </div>

                    {/* Thống kê nhân viên khớp */}
                    <span className="rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 px-2.5 py-1 text-[11px] font-extrabold flex items-center gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-600" />
                      <span>Tự động khớp {parsedRows.filter((r, idx) => getEmpForRow(idx, r[0] || '').emp !== null).length}/{parsedRows.length} nhân viên</span>
                    </span>

                    {/* Nút tùy chỉnh Mẫu Ca */}
                    <button
                      type="button"
                      onClick={() => setShowShiftConfig(prev => !prev)}
                      className={`rounded-xl px-2.5 py-1 text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${showShiftConfig ? 'bg-emerald-700 text-white border-emerald-800' : 'bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <Tag size={12} />
                      <span>{uniqueExcelShifts.length} Mẫu ca</span>
                      <span className="text-[9px]">{showShiftConfig ? '▲' : '▼'}</span>
                    </button>

                    {/* Nút tùy chỉnh Cột Ngày */}
                    <button
                      type="button"
                      onClick={() => setShowDateConfig(prev => !prev)}
                      className={`rounded-xl px-2.5 py-1 text-[11px] font-bold border transition flex items-center gap-1.5 cursor-pointer ${showDateConfig ? 'bg-[#2F6FA8] text-white border-blue-800' : 'bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100'}`}
                    >
                      <Calendar size={12} />
                      <span>{Object.keys(columnMapping).length}/{parsedHeaders.length - 1} Ngày</span>
                      <span className="text-[9px]">{showDateConfig ? '▲' : '▼'}</span>
                    </button>
                  </div>

                  {/* CỤM NÚT CHUYỂN CHẾ ĐỘ VIEW (Theo Nhân viên vs Theo Mẫu Ca Recheck) */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setPreviewViewMode('by_employee')}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${previewViewMode === 'by_employee' ? 'bg-[#001D3D] text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        <Users size={13} />
                        <span>Theo Nhân viên</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewViewMode('by_shift')}
                        className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${previewViewMode === 'by_shift' ? 'bg-[#2F6FA8] text-white shadow-xs font-extrabold' : 'text-slate-600 hover:text-slate-900'}`}
                      >
                        <Clock size={13} />
                        <span>Xếp theo Ca (Recheck)</span>
                      </button>
                    </div>

                    {/* Thanh Gán nhanh vị trí cho các ca chung */}
                    <div className="hidden lg:flex items-center gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => handleBatchAssignUnspecifiedPositions('pos-001')}
                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10.5px] transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        title="Gán tất cả ca thành vị trí Pha chế"
                      >
                        <Coffee size={11} /> Pha chế
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBatchAssignUnspecifiedPositions('pos-002')}
                        className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10.5px] transition cursor-pointer shadow-2xs inline-flex items-center gap-1"
                        title="Gán tất cả ca thành vị trí Thu ngân"
                      >
                        <Receipt size={11} /> Thu ngân
                      </button>
                    </div>
                  </div>
                </div>

                {/* Accordion 1: Tùy chỉnh Mẫu Ca (Mở ra khi bấm nút) */}
                {showShiftConfig && uniqueExcelShifts.length > 0 && (
                  <div className="px-5 py-3 border-b border-emerald-200 bg-emerald-50/70 shrink-0 max-h-[160px] overflow-y-auto">
                    <div className="text-xs font-bold text-gray-800 mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <Tag size={13} className="text-emerald-700" />
                        Tùy chỉnh Ghép Mẫu Ca & Vị Trí Công Việc:
                      </span>
                      <span className="text-[11px] text-emerald-800 font-semibold">Tự động nhận diện hoặc đổi trực tiếp bên dưới</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {uniqueExcelShifts.map((shiftText, idx) => {
                        const timeMatch = shiftText.match(/\[(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\]/)
                        const excelTimeStr = timeMatch ? `${timeMatch[1]}-${timeMatch[2]}` : ''

                        const defaultTplId = smartResolveShiftTemplate(shiftText, allTemplates)
                        const currentTplId = customShiftMapping[shiftText]?.templateId || defaultTplId
                        const currentPosId = customShiftMapping[shiftText]?.positionId !== undefined
                          ? customShiftMapping[shiftText]?.positionId
                          : smartResolvePosition(shiftText, mockPositions)

                        return (
                          <div key={idx} className="rounded-xl border border-emerald-200 bg-white p-2.5 text-xs shadow-2xs space-y-1.5">
                            <div className="font-extrabold text-gray-900 truncate text-[11px]" title={shiftText}>
                              {shiftText}
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-500 font-bold w-12 shrink-0">Mẫu ca:</span>
                              <select
                                value={currentTplId}
                                onChange={e => {
                                  const newTplId = e.target.value
                                  const posId = customShiftMapping[shiftText]?.positionId !== undefined
                                    ? customShiftMapping[shiftText]?.positionId
                                    : smartResolvePosition(shiftText, mockPositions)
                                  saveShiftMappingMemory(shiftText, newTplId, posId)
                                  setCustomShiftMapping(prev => ({
                                    ...prev,
                                    [shiftText]: {
                                      ...prev[shiftText],
                                      templateId: newTplId,
                                    },
                                  }))
                                }}
                                className="w-full rounded-lg border border-emerald-300 bg-emerald-50 px-1.5 py-1 text-[10px] font-bold text-emerald-900 focus:outline-none cursor-pointer"
                              >
                                {allTemplates.map(tpl => (
                                  <option key={tpl.id} value={tpl.id}>
                                    {tpl.name} ({excelTimeStr || `${tpl.start_time}-${tpl.end_time}`})
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-gray-500 font-bold w-12 shrink-0">Vị trí:</span>
                              <select
                                value={currentPosId || ''}
                                onChange={e => {
                                  const newPosId = e.target.value
                                  const tplId = customShiftMapping[shiftText]?.templateId || defaultTplId
                                  saveShiftMappingMemory(shiftText, tplId, newPosId)
                                  setCustomShiftMapping(prev => ({
                                    ...prev,
                                    [shiftText]: {
                                      templateId: tplId,
                                      positionId: newPosId,
                                    },
                                  }))
                                }}
                                className="w-full rounded-lg border border-blue-300 bg-blue-50 px-1.5 py-1 text-[10px] font-bold text-[#2F6FA8] focus:outline-none cursor-pointer"
                              >
                                <option value="">-- Theo chức danh hồ sơ nhân viên --</option>
                                {mockPositions.map(pos => (
                                  <option key={pos.id} value={pos.id}>
                                    {pos.name}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Accordion 2: Tùy chỉnh Cột Ngày (Mở ra khi bấm nút) */}
                {showDateConfig && (
                  <div className="px-5 py-3 border-b border-blue-200 bg-blue-50/70 shrink-0 max-h-[140px] overflow-y-auto">
                    <div className="text-xs font-bold text-gray-800 mb-2 flex items-center justify-between">
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar size={13} className="text-[#2F6FA8]" />
                        Tùy chỉnh Ghép Cột Ngày Excel sang Bảng Lịch:
                      </span>
                      <span className="text-[11px] text-gray-500">
                        {dateMappingMode === 'file_date' ? 'Đang ghép theo ngày thực tế' : 'Đang ghép theo Thứ'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {parsedHeaders.map((header, idx) => {
                        if (idx === 0) return null
                        return (
                          <div key={idx} className="rounded-xl border border-blue-300 bg-white p-2 text-xs">
                            <div className="font-bold text-gray-800 truncate text-[11px] mb-1" title={header}>
                              {header || `Cột ${idx}`}
                            </div>
                            <select
                              value={columnMapping[idx] || ''}
                              onChange={e => {
                                const newMap = { ...columnMapping }
                                if (e.target.value) newMap[idx] = e.target.value
                                else delete newMap[idx]
                                setColumnMapping(newMap)
                              }}
                              className="w-full rounded-lg border border-blue-300 px-1.5 py-1 text-[11px] font-bold text-[#2F6FA8]"
                            >
                              <option value="">-- Chọn ngày --</option>
                              {(dateMappingMode === 'file_date' && importPreviewDates.length > 0 ? importPreviewDates : weekDates).map(date => (
                                <option key={date} value={date}>
                                  Ghép vào: {formatShortDate(date)}
                                </option>
                              ))}
                            </select>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* ============================================================ */}
                {/* VIEW 1: BẢNG THEO NHÂN VIÊN (CURRENT MATRIX TABLE) */}
                {/* ============================================================ */}
                {previewViewMode === 'by_employee' && (
                  <div className="overflow-auto flex-1 p-4 pb-6 bg-slate-50/60">
                    <div className="w-max min-w-full rounded-2xl border border-gray-200 bg-white shadow-xs">
                      <table className="w-full border-collapse text-[11px]" style={{ minWidth: `${260 + Math.max(parsedHeaders.length - 1, 7) * 140}px` }}>
                        <thead className="sticky top-0 z-10">
                          <tr className="bg-[#001D3D] text-white shadow-sm">
                            <th className="border-r border-slate-700 px-3.5 py-2.5 text-left font-extrabold min-w-[260px]">
                              Nhân viên & Trạng thái Khớp
                            </th>
                            {parsedHeaders.map((header, idx) => {
                              if (idx === 0) return null
                              const mappedDate = columnMapping[idx]
                              return (
                                <th key={idx} className="border-r border-slate-700 px-3 py-2 text-center font-extrabold whitespace-nowrap min-w-[140px]">
                                  <div className="text-[11.5px] tracking-wide">{header || `Cột ${idx + 1}`}</div>
                                  {mappedDate && (
                                    <div className="text-[10px] font-extrabold text-emerald-300 mt-0.5">
                                      ✓ {formatShortDate(mappedDate)}
                                    </div>
                                  )}
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
                                {/* Cột 1: Thông tin nhân viên & Badge Trạng thái Khớp (Apple SaaS Standard) */}
                                <td className="border-r border-gray-200 px-3.5 py-2.5 align-top min-w-[260px] bg-white">
                                  {matchInfo.status === 'matched' || matchInfo.status === 'manual' ? (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between gap-1.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2F6FA8] to-[#001D3D] text-white text-[10px] font-bold border border-blue-200 shadow-2xs">
                                            {matchInfo.emp?.full_name?.split(' ').pop()?.slice(0, 2).toUpperCase() || 'NV'}
                                          </div>
                                          <div className="min-w-0">
                                            <div className="font-extrabold text-gray-900 text-xs truncate">
                                              {matchInfo.emp?.full_name}
                                            </div>
                                            {matchInfo.cleanedName !== matchInfo.emp?.full_name && (
                                              <div className="text-[10px] text-slate-400 truncate">
                                                File: {rawEmpName}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => setEditingEmpRow(editingEmpRow === rowIdx ? null : rowIdx)}
                                          className="text-[11px] text-slate-400 hover:text-[#2F6FA8] font-bold p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                          title="Đổi nhân viên ghép"
                                        >
                                          <Pencil size={12} />
                                        </button>
                                      </div>

                                      <div className="flex items-center gap-1">
                                        <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9.5px] font-extrabold border ${matchInfo.badgeColor}`}>
                                          <CheckCircle2 size={10} /> {matchInfo.badgeLabel}
                                        </span>
                                      </div>

                                      {editingEmpRow === rowIdx && (
                                        <div className="pt-1.5 border-t border-gray-200">
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
                                            className="w-full rounded-lg border border-blue-400 bg-blue-50 px-1.5 py-1 text-[10px] font-bold text-gray-800 focus:ring-1 focus:ring-[#2F6FA8]"
                                          >
                                            <option value="">-- Đổi nhân viên khác --</option>
                                            <optgroup label={`Cơ sở: ${stores.find(s => s.id === importSelectedStoreId)?.name || 'Hiện tại'}`}>
                                              {board?.employees.map(e => (
                                                <option key={e.employee.id} value={e.employee.id}>
                                                  {e.employee.full_name} ({e.employee.employee_code || 'NV'})
                                                </option>
                                              ))}
                                            </optgroup>
                                            <optgroup label="Toàn chuỗi Homies (Mượn ca)">
                                              {EmployeeService.getEmployees(user ?? undefined)
                                                .filter((e: { id: string; full_name: string; store_id?: string }) => !board?.employees.some(be => be.employee.id === e.id))
                                                .map((e: { id: string; full_name: string; store_id?: string }) => (
                                                  <option key={e.id} value={e.id}>
                                                    {e.full_name} ({mockStores.find(s => s.id === e.store_id)?.name || 'Cơ sở khác'})
                                                  </option>
                                                ))}
                                            </optgroup>
                                          </select>
                                        </div>
                                      )}
                                    </div>
                                  ) : matchInfo.status === 'other_store' ? (
                                    <div className="space-y-1">
                                      <div className="font-extrabold text-gray-900 text-xs truncate">
                                        {matchInfo.cleanedName || rawEmpName}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="rounded-md bg-purple-50 text-purple-800 text-[9.5px] font-extrabold px-1.5 py-0.5 border border-purple-200 flex items-center gap-1">
                                          <Building2 size={10} /> {matchInfo.otherStoreName}
                                        </span>
                                      </div>
                                      {matchInfo.emp && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const matchedEmp = matchInfo.emp
                                            if (!matchedEmp) return
                                            saveEmpMappingMemory(matchInfo.cleanedName || rawEmpName, matchedEmp.id)
                                            setManualEmpMapping(prev => ({ ...prev, [rowIdx]: matchedEmp.id }))
                                          }}
                                          className="inline-flex items-center gap-1 rounded-md bg-purple-600 hover:bg-purple-700 text-white px-2 py-0.5 text-[10px] font-extrabold transition cursor-pointer shadow-2xs"
                                        >
                                          <Zap size={10} /> Ghép ca mượn ({matchInfo.emp.full_name})
                                        </button>
                                      )}
                                    </div>
                                  ) : matchInfo.status === 'summary' ? (
                                    <div className="text-[11px] text-gray-400 italic font-medium">
                                      Dòng tổng kết / tiêu đề (Tự động bỏ qua)
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      <div className="font-extrabold text-gray-900 text-xs truncate">
                                        {matchInfo.cleanedName || rawEmpName}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="rounded-md bg-amber-50 text-amber-800 text-[9.5px] font-extrabold px-1.5 py-0.5 border border-amber-200 flex items-center gap-1">
                                          <AlertCircle size={10} /> Cần ghép tay
                                        </span>
                                      </div>
                                      {matchInfo.suggestedEmp && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const suggestedEmp = matchInfo.suggestedEmp
                                            if (!suggestedEmp) return
                                            saveEmpMappingMemory(matchInfo.cleanedName || rawEmpName, suggestedEmp.id)
                                            setManualEmpMapping(prev => ({ ...prev, [rowIdx]: suggestedEmp.id }))
                                          }}
                                          className="inline-flex items-center gap-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white px-2 py-0.5 text-[10px] font-extrabold transition cursor-pointer shadow-2xs"
                                        >
                                          <Sparkles size={10} /> Gợi ý: {matchInfo.suggestedEmp.full_name}
                                        </button>
                                      )}
                                      <div className="pt-1">
                                        <select
                                          value={manualEmpMapping[rowIdx] || ''}
                                          onChange={e => {
                                            const empId = e.target.value
                                            if (empId) {
                                              saveEmpMappingMemory(matchInfo.cleanedName || rawEmpName, empId)
                                            }
                                            setManualEmpMapping(prev => ({ ...prev, [rowIdx]: empId }))
                                          }}
                                          className="w-full rounded-lg border border-gray-300 bg-white px-1.5 py-1 text-[10px] font-bold text-gray-800 focus:ring-1 focus:ring-[#2F6FA8]"
                                        >
                                          <option value="">-- Chọn nhân viên ghép --</option>
                                          {board?.employees.map(e => (
                                            <option key={e.employee.id} value={e.employee.id}>
                                              {e.employee.full_name}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* Cột 2->8: Thẻ Ca Làm Việc */}
                                {parsedHeaders.map((_, colIdx) => {
                                  if (colIdx === 0) return null
                                  const cellValue = row[colIdx] || ''

                                  if (!cellValue || cellValue === '--') {
                                    return (
                                      <td key={colIdx} className="border-r border-gray-200 px-2 py-2 align-middle text-center text-gray-300 font-medium">
                                        —
                                      </td>
                                    )
                                  }

                                  const entries = cellValue.split(/[\n;/]|<br\s*\/?>/i).map(s => s.trim()).filter(Boolean)

                                  return (
                                    <td key={colIdx} className="border-r border-gray-200 p-1.5 align-top min-w-[140px]">
                                      <div className="space-y-1">
                                        {entries.map((entry, entryIdx) => {
                                          const timeMatch = entry.match(/\[(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\]/)
                                          const entryWithoutTime = entry.replace(/\[.*?\]/, '').trim()

                                          const matchedPos = mockPositions.find(p => entryWithoutTime.toLowerCase().includes(p.name.toLowerCase()))
                                          const cleanShiftTitle = matchedPos
                                            ? entryWithoutTime.replace(new RegExp(matchedPos.name, 'gi'), '').trim() || 'Ca làm'
                                            : entryWithoutTime || 'Ca làm'

                                          const customPosId = customShiftMapping[entry]?.positionId
                                          const posName = customPosId 
                                            ? mockPositions.find(p => p.id === customPosId)?.name 
                                            : (matchedPos ? matchedPos.name : 'Pha chế')

                                          const style = getShiftStyle(entry)

                                          return (
                                            <div
                                              key={entryIdx}
                                              className={`rounded-xl p-2 text-[10.5px] border transition shadow-2xs ${style.bg}`}
                                            >
                                              <div className="flex items-center justify-between gap-1 font-extrabold leading-tight">
                                                <span className="truncate">{cleanShiftTitle}</span>
                                                {posName && (
                                                  <span className={`shrink-0 rounded-md px-1.5 py-0.2 text-[8.5px] font-extrabold border border-black/10 ${style.badgeBg}`}>
                                                    {posName}
                                                  </span>
                                                )}
                                              </div>
                                              {timeMatch && (
                                                <div className="text-[9px] font-extrabold opacity-75 mt-1 text-slate-700 flex items-center gap-1">
                                                  <Clock size={10} className="text-slate-500 shrink-0 inline" /> {timeMatch[1]} - {timeMatch[2]}
                                                </div>
                                              )}
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
            )}

            {/* ============================================================ */}
            {/* VIEW 2: XẾP THEO CA RECHECK (VIEW THEO KHUNG CA & NGÀY) */}
            {/* ============================================================ */}
            {previewViewMode === 'by_shift' && (
              <div className="overflow-auto flex-1 p-4 pb-6 bg-amber-50/40">
                <div className="grid w-max grid-flow-col grid-rows-1 auto-cols-[minmax(320px,360px)] gap-4">
                  {importPreviewDates.map(date => {
                    const dateShifts = previewShiftsList.filter(s => s.date === date)
                    const regularTemplates = allTemplates.filter(
                      t => t.id !== 'shift-004' && !t.is_flexible && !t.code?.includes('FLEX') && !removeVietnameseTones(t.name).includes('linh hoat') && !removeVietnameseTones(t.name).includes('phat sinh')
                    )
                    const groupedByTemplate = regularTemplates.map(tpl => {
                      const matching = dateShifts.filter(s => s.shiftId === tpl.id)
                      return { tpl, matching }
                    })
                    const flexShifts = dateShifts.filter(s => s.shiftId === 'shift-004' || !regularTemplates.some(t => t.id === s.shiftId))

                    return (
                      <div key={date} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs space-y-3 flex flex-col">
                        {/* Card Header: Thứ & Ngày */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#001D3D] text-white text-xs font-black">
                              {formatShortDate(date).split('-')[0].trim()}
                            </div>
                            <div>
                              <div className="font-extrabold text-xs text-[#001D3D]">
                                {formatShortDate(date)}
                              </div>
                              <div className="text-[10px] text-slate-500 font-semibold">
                                Tổng: {dateShifts.length} lượt phân ca
                              </div>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${dateShifts.length > 0 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                            {dateShifts.length > 0 ? `✓ ${dateShifts.length} Ca` : 'Nghỉ'}
                          </span>
                        </div>

                        {/* Cụm Các Khung Ca Trong Ngày */}
                        <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                          {groupedByTemplate.map(({ tpl, matching }) => (
                            <div key={tpl.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-2.5 text-xs space-y-2">
                              {/* Tiêu đề ca & giờ */}
                              <div className="flex items-center justify-between">
                                <div className="font-extrabold text-slate-800 text-[11.5px] flex items-center gap-1.5">
                                  <Clock size={12} className="text-[#2F6FA8]" />
                                  <span>{tpl.name}</span>
                                  <span className="text-[10px] font-medium text-slate-500">({tpl.start_time} - {tpl.end_time})</span>
                                </div>
                                <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold border ${matching.length > 0 ? 'bg-emerald-100 text-emerald-800 border-emerald-300' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                  {matching.length} NV
                                </span>
                              </div>

                              {/* Danh sách nhân viên trong ca */}
                              {matching.length > 0 ? (
                                <div className="space-y-1.5 pt-0.5">
                                  {matching.map((item, itemIdx) => (
                                    <div key={itemIdx} className="flex items-center justify-between rounded-lg bg-white p-1.5 border border-slate-200 shadow-2xs">
                                      <div className="flex items-center gap-2 min-w-0">
                                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2F6FA8] to-[#001D3D] text-white text-[9px] font-bold">
                                          {item.emp?.full_name?.split(' ').pop()?.slice(0, 2).toUpperCase() || 'NV'}
                                        </div>
                                        <div className="min-w-0">
                                          <div className="font-bold text-gray-900 text-[11px] truncate">
                                            {item.emp?.full_name}
                                          </div>
                                          <div className="text-[9.5px] text-slate-400 truncate">
                                            {item.rawEntry}
                                          </div>
                                        </div>
                                      </div>

                                      <span className="shrink-0 rounded-md bg-blue-50 text-[#2F6FA8] border border-blue-200 px-1.5 py-0.2 text-[9.5px] font-extrabold">
                                        {item.positionName}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-[10.5px] text-slate-400 italic py-1 text-center bg-white/60 rounded-lg border border-dashed border-slate-200">
                                  Chưa có nhân sự trong ca này
                                </div>
                              )}
                            </div>
                          ))}

                          {/* Ca phát sinh / linh hoạt nếu có */}
                          {flexShifts.length > 0 && (
                            <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-2.5 text-xs space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="font-extrabold text-purple-900 text-[11.5px] flex items-center gap-1.5">
                                  <Zap size={12} className="text-purple-600" />
                                  <span>Ca Linh Hoạt / Phát Sinh</span>
                                </div>
                                <span className="px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-800 text-[10px] font-bold border border-purple-300">
                                  {flexShifts.length} NV
                                </span>
                              </div>
                              <div className="space-y-1.5 pt-0.5">
                                {flexShifts.map((item, itemIdx) => (
                                  <div key={itemIdx} className="flex items-center justify-between rounded-lg bg-white p-1.5 border border-purple-200 shadow-2xs">
                                    <div className="flex items-center gap-2 min-w-0">
                                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-600 text-white text-[9px] font-bold">
                                        {item.emp?.full_name?.split(' ').pop()?.slice(0, 2).toUpperCase() || 'NV'}
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-bold text-gray-900 text-[11px] truncate">
                                          {item.emp?.full_name}
                                        </div>
                                        <div className="text-[9.5px] text-purple-700 truncate font-medium">
                                          {item.rawEntry}
                                        </div>
                                      </div>
                                    </div>
                                    <span className="shrink-0 rounded-md bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.2 text-[9.5px] font-extrabold">
                                      {item.positionName}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

            {/* ===== BƯỚC 3: XÁC NHẬN ===== */}
            {importStep === 3 && (
              <div className="p-6 space-y-4 overflow-y-auto">
                {selectedFiles.length > 1 ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50/80 p-5 text-xs text-blue-950 space-y-3">
                    <div className="font-extrabold text-sm text-[#001D3D] flex items-center justify-between">
                      <span>Danh sách {selectedFiles.length} file Excel sẽ được nạp đồng thời:</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#2F6FA8] text-white text-[11px] font-bold">
                        Nạp hàng loạt ({selectedFiles.length} tuần)
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {selectedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white border border-blue-100 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet size={15} className="text-[#2F6FA8]" />
                            <span className="font-bold text-gray-800 text-[11.5px]">{file.name}</span>
                          </div>
                          <span className="text-[10.5px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Sẵn sàng nạp
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[11px] text-blue-800 font-medium">
                      Hệ thống sẽ tự động quét từng file và đưa lịch ca vào đúng tuần tương ứng của từng file.
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-5 text-xs text-emerald-950 space-y-2">
                    <div className="font-extrabold text-sm text-emerald-950">Tóm tắt nội dung sẽ nhập:</div>
                    <div>File: <span className="font-bold">{selectedFile?.name}</span></div>
                    <div>Tổng số dòng dữ liệu: <span className="font-bold">{parsedRows.length} dòng</span></div>
                    <div>Số cột ngày đã khớp: <span className="font-bold">{Object.keys(columnMapping).length} cột</span> / {parsedHeaders.length - 1} cột</div>
                    <div>Nhân viên tìm thấy trong hệ thống: <span className="font-bold">
                      {parsedRows.filter(row => row[0] && board?.employees.find(e =>
                        e.employee.full_name.toLowerCase().includes((row[0] || '').toLowerCase()) ||
                        (row[0] || '').toLowerCase().includes(e.employee.full_name.toLowerCase())
                      )).length} / {parsedRows.length} dòng
                    </span></div>
                  </div>
                )}

                {/* Tùy chọn làm sạch lịch cũ trước khi nhập */}
                <label className="flex items-start gap-2.5 rounded-2xl border border-emerald-300 bg-white p-4 cursor-pointer select-none shadow-2xs hover:bg-emerald-50/30 transition">
                  <input
                    type="checkbox"
                    checked={clearExistingOnImport}
                    onChange={e => setClearExistingOnImport(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1E9E57] focus:ring-[#1E9E57]"
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-900">
                      Xóa sạch các ca cũ trong các tuần được nạp trước khi nhập dữ liệu mới
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                      (Khuyến nghị: Giúp loại bỏ dữ liệu mẫu hoặc ca cũ, đảm bảo bảng chỉ chứa 100% dữ liệu thực từ file Excel)
                    </div>
                  </div>
                </label>

                <p className="text-xs text-gray-500">
                  Hệ thống sẽ tự động khớp tên ca làm việc trong file với các mẫu ca hiện có của cửa hàng và đồng bộ trực tiếp vào CSDL.
                </p>
              </div>
            )}

            {/* Footer Modal */}
            <div className="flex items-center justify-between border-t border-gray-200 px-6 py-4 bg-gray-50 shrink-0">
              <div>
                {importStep > 1 && (
                  <button
                    onClick={() => setImportStep(prev => (prev > 1 ? (prev - 1) as 1 | 2 | 3 : 1))}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                  >
                    Quay lại
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setSelectedFile(null)
                    setSelectedFiles([])
                    setParsedRows([])
                    setParsedHeaders([])
                    setColumnMapping({})
                    setImportStep(1)
                  }}
                  className="rounded-xl bg-slate-400 px-4 py-2 text-xs font-bold text-white hover:bg-slate-500 transition cursor-pointer"
                >
                  Hủy bỏ
                </button>
                {importStep === 1 && (
                  <button
                    onClick={() => (selectedFile || selectedFiles.length > 0) && setImportStep(2)}
                    disabled={!selectedFile && selectedFiles.length === 0}
                    className="rounded-xl bg-[#2F6FA8] px-5 py-2 text-xs font-bold text-white hover:bg-[#1D3E61] transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Xem trước dữ liệu
                  </button>
                )}
                {importStep === 2 && (
                  <button
                    onClick={() => setImportStep(3)}
                    disabled={Object.keys(columnMapping).length === 0}
                    className="rounded-xl bg-[#2F6FA8] px-5 py-2 text-xs font-bold text-white hover:bg-[#1D3E61] transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Tiếp theo
                  </button>
                )}
                {importStep === 3 && (
                  <button
                    onClick={handleConfirmImport}
                    className="rounded-xl bg-[#1E9E57] px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs cursor-pointer"
                  >
                    {selectedFiles.length > 1
                      ? `Xác nhận nạp tất cả ${selectedFiles.length} file Excel`
                      : 'Xác nhận nhập lịch'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bật Lên Cài Đặt Ca Làm Việc Trực Tiếp (Sạch sẽ, 0 Emoji, Chuẩn SaaS) */}
      {showShiftSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[85vh]">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-[#001D3D] text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F6FA8] text-white shadow-2xs">
                  <Settings size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Cài Đặt Khung Ca Làm Việc</h3>
                  <p className="text-xs text-blue-200 mt-0.5">Danh sách các khung ca chuẩn áp dụng phân ca cửa hàng</p>
                </div>
              </div>
              <button
                onClick={() => setShowShiftSettingsModal(false)}
                className="rounded-xl p-1.5 text-blue-200 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content List */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {shiftSettingsList.map(st => {
                  return (
                    <div
                      key={st.id}
                      className={`rounded-2xl border p-4 transition space-y-2.5 ${st.is_active ? 'border-gray-200 bg-white hover:border-[#2F6FA8]/40 shadow-2xs' : 'border-gray-200 bg-gray-50 opacity-60'}`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full" style={{ backgroundColor: st.color || '#2F6FA8' }} />
                          <span className="font-extrabold text-sm text-[#001D3D]">{st.name}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            ShiftTemplateService.toggleActive(st.id)
                            setShiftSettingsList(ShiftTemplateService.getAll())
                            setRefreshKey(k => k + 1)
                          }}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-extrabold border transition cursor-pointer ${st.is_active ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-gray-200 text-gray-700 border-gray-300'}`}
                        >
                          {st.is_active ? 'Kích hoạt' : 'Tắt'}
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 font-mono font-bold">
                        <span>Giờ hoạt động:</span>
                        <span className="text-[#001D3D]">{st.start_time} - {st.end_time}</span>
                      </div>

                      <div className="text-xs text-gray-500 flex items-center justify-between">
                        <span>Vị trí gán:</span>
                        <span className="font-semibold text-gray-800">
                          {ShiftTemplateService.getPositionLabels(st).join(', ') || 'Tất cả vị trí'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer Modal */}
            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 shrink-0 flex items-center justify-between gap-3">
              <Link
                href="/settings/schedule-rules/shifts"
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#2F6FA8] hover:underline"
              >
                Quản lý chi tiết trong Cài đặt chung →
              </Link>
              <button
                type="button"
                onClick={() => setShowShiftSettingsModal(false)}
                className="rounded-xl bg-[#2F6FA8] px-5 py-2 text-xs font-bold text-white hover:bg-[#1D3E61] transition shadow-2xs cursor-pointer"
              >
                Đóng cửa sổ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pop-up Modal Dời Ca Làm Nhanh */}
      {moveModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden flex flex-col">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-[#001D3D] text-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2F6FA8] text-white shadow-2xs">
                  <ArrowRightLeft size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight">Dời Ca Làm Việc</h3>
                  <p className="text-xs text-blue-200 mt-0.5">Nhân sự: <span className="font-bold text-white">{moveModalData.employeeName}</span></p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMoveModalData(null)}
                className="rounded-xl p-1.5 text-blue-200 hover:bg-white/10 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 text-xs font-bold text-gray-700">
              <div>
                <label className="block text-gray-600 mb-1">Dời đến ngày:</label>
                <select
                  value={targetMoveDate}
                  onChange={e => setTargetMoveDate(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-800 shadow-2xs focus:ring-2 focus:ring-[#2F6FA8] focus:outline-hidden"
                >
                  {weekDates.map(d => (
                    <option key={d} value={d}>
                      {formatDayFullDate(d)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Ca làm mới:</label>
                <select
                  value={targetMoveShiftId}
                  onChange={e => setTargetMoveShiftId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-800 shadow-2xs focus:ring-2 focus:ring-[#2F6FA8] focus:outline-hidden"
                >
                  {allTemplates.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} [{t.start_time} - {t.end_time}]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-600 mb-1">Vị trí chuyên môn:</label>
                <select
                  value={targetMovePosId}
                  onChange={e => setTargetMovePosId(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-800 shadow-2xs focus:ring-2 focus:ring-[#2F6FA8] focus:outline-hidden"
                >
                  {positions.map(p => (
                    <option key={p?.id} value={p?.id}>
                      {p?.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setMoveModalData(null)}
                className="rounded-xl bg-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-300 transition cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  handleMoveShift(
                    moveModalData.employeeId,
                    moveModalData.fromDate,
                    moveModalData.fromShiftId,
                    targetMoveDate,
                    targetMoveShiftId,
                    targetMovePosId,
                    moveModalData.notes
                  )
                  setMoveModalData(null)
                }}
                className="rounded-xl bg-[#2F6FA8] px-5 py-2 text-xs font-bold text-white hover:bg-[#1D3E61] transition shadow-2xs cursor-pointer"
              >
                Xác nhận dời ca
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Kiểm tra & Cảnh báo Lịch làm việc */}
      {validationModalData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-3xl border border-gray-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
            {/* Header Modal */}
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-[#F6C85F]" />
                  <h3 className="font-bold text-base">Kiểm tra tính hợp lệ Lịch làm việc</h3>
                </div>
                <p className="text-xs text-gray-300 mt-0.5">
                  Tuần {weekNum} năm {yearNum} ({formatCalendarDate(weekDates[0])} — {formatCalendarDate(weekDates[6])}) · {selectedStore?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setValidationModalData(null)}
                className="rounded-full p-1.5 text-gray-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* KPI Thống kê Tổng quan */}
            <div className="grid grid-cols-3 gap-3 p-4 bg-gray-50 border-b border-gray-100">
              <div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-3">
                <div className="text-[11px] font-bold text-blue-700">TỔNG SỐ CA ĐÃ XẾP</div>
                <div className="text-xl font-extrabold text-blue-950 mt-0.5">{validationModalData.totalAssignments} <span className="text-xs font-normal text-blue-800">ca</span></div>
              </div>

              <div className={`rounded-2xl border p-3 ${validationModalData.hardWarnings.length > 0 ? 'border-red-300 bg-red-50 text-red-900' : 'border-emerald-200 bg-emerald-50/60 text-emerald-900'}`}>
                <div className="text-[11px] font-bold">LỖI CHẶN (CẦN SỬA)</div>
                <div className="text-xl font-extrabold mt-0.5">{validationModalData.hardWarnings.length} <span className="text-xs font-normal">lỗi</span></div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-3 text-amber-950">
                <div className="text-[11px] font-bold text-amber-800">CẢNH BÁO LƯU Ý</div>
                <div className="text-xl font-extrabold mt-0.5">{validationModalData.softWarnings.length} <span className="text-xs font-normal text-amber-800">lưu ý</span></div>
              </div>
            </div>

            {/* Tabs lọc phân loại */}
            <div className="flex items-center gap-1.5 px-6 pt-3 border-b border-gray-100 bg-white">
              <button
                type="button"
                onClick={() => setValidationFilterTab('all')}
                className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
                  validationFilterTab === 'all'
                    ? 'border-[#2F6FA8] text-[#2F6FA8]'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                Tất cả ({validationModalData.hardWarnings.length + validationModalData.softWarnings.length})
              </button>
              <button
                type="button"
                onClick={() => setValidationFilterTab('block')}
                className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
                  validationFilterTab === 'block'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                🔴 Lỗi chặn ({validationModalData.hardWarnings.length})
              </button>
              <button
                type="button"
                onClick={() => setValidationFilterTab('warning')}
                className={`pb-2.5 px-3 text-xs font-bold transition border-b-2 cursor-pointer ${
                  validationFilterTab === 'warning'
                    ? 'border-amber-600 text-amber-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                🟡 Cảnh báo lưu ý ({validationModalData.softWarnings.length})
              </button>
            </div>

            {/* Danh sách Cảnh báo chi tiết */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {(() => {
                const displayList =
                  validationFilterTab === 'block'
                    ? validationModalData.hardWarnings
                    : validationFilterTab === 'warning'
                    ? validationModalData.softWarnings
                    : [...validationModalData.hardWarnings, ...validationModalData.softWarnings]

                if (displayList.length === 0) {
                  return (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
                      <CheckCircle2 size={36} className="mx-auto text-emerald-600 mb-2" />
                      <div className="font-bold text-sm text-emerald-900">
                        {validationFilterTab === 'block'
                          ? 'Tuyệt vời! Không có lỗi chặn nào trong tuần này.'
                          : 'Lịch làm việc hoàn toàn chuẩn xác và sẵn sàng phát hành!'}
                      </div>
                      <p className="text-xs text-emerald-700 mt-1">
                        Bạn có thể yên tâm bấm nút &quot;Xác nhận &amp; Chốt phát hành lịch&quot; bên dưới.
                      </p>
                    </div>
                  )
                }

                return displayList.map((item, idx) => {
                  const isHard = validationModalData.hardWarnings.includes(item)
                  const emp = item.employee_id ? EmployeeService.getEmployeeById(item.employee_id) : null
                  const shift = item.shift_id ? getShiftById(item.shift_id) : null

                  return (
                    <div
                      key={idx}
                      className={`rounded-2xl border p-3.5 flex items-start gap-3 transition ${
                        isHard
                          ? 'border-red-200 bg-red-50/50 hover:bg-red-50'
                          : 'border-amber-200 bg-amber-50/40 hover:bg-amber-50/70'
                      }`}
                    >
                      <div className="mt-0.5 shrink-0">
                        {isHard ? (
                          <ShieldAlert size={18} className="text-red-600" />
                        ) : (
                          <AlertTriangle size={18} className="text-amber-600" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                              isHard
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-amber-100 text-amber-900 border border-amber-200'
                            }`}
                          >
                            {isHard ? 'Lỗi chặn' : 'Cảnh báo lưu ý'}
                          </span>

                          {emp && (
                            <span className="font-bold text-xs text-gray-900">
                              👤 {emp.full_name}
                            </span>
                          )}

                          {item.date && (
                            <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-700">
                              📅 {formatCalendarDate(item.date)}
                            </span>
                          )}

                          {shift && (
                            <span className="rounded-md bg-blue-50 text-[#2F6FA8] px-1.5 py-0.5 text-[11px] font-bold">
                              ⏰ {shift.name}
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-800 font-medium leading-relaxed">
                          {item.message}
                        </div>
                      </div>
                    </div>
                  )
                })
              })()}
            </div>

            {/* Footer Modal Hành động */}
            <div className="border-t border-gray-100 px-6 py-4 bg-gray-50 flex items-center justify-between">
              <div className="text-xs text-gray-500">
                {validationModalData.hardWarnings.length > 0 ? (
                  <span className="text-red-700 font-semibold flex items-center gap-1">
                    <ShieldAlert size={14} /> Vui lòng xử lý các lỗi chặn màu đỏ trước khi chốt lịch.
                  </span>
                ) : (
                  <span className="text-emerald-700 font-semibold flex items-center gap-1">
                    <CheckCircle2 size={14} /> Đủ điều kiện phát hành lịch cho nhân viên.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setValidationModalData(null)}
                  className="rounded-xl bg-gray-200 px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-300 transition cursor-pointer"
                >
                  Đóng
                </button>

                <button
                  type="button"
                  disabled={validationModalData.hardWarnings.length > 0}
                  onClick={handleConfirmPublishFinal}
                  className={`rounded-xl px-5 py-2 text-xs font-bold text-white transition shadow-sm cursor-pointer ${
                    validationModalData.hardWarnings.length > 0
                      ? 'bg-gray-400 opacity-60 cursor-not-allowed'
                      : 'bg-[#001D3D] hover:bg-slate-900'
                  }`}
                >
                  Xác nhận &amp; Chốt phát hành lịch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
