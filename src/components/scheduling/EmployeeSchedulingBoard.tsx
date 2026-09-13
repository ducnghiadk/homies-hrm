'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import { ScheduleService } from '@/lib/services/schedule-service'
import { ShiftTemplateService } from '@/lib/services/shift-template-service'
import { EmployeeService } from '@/lib/services/employees/employee-service'
import { employeeAdapter, storeAdapter } from '@/lib/adapters'
import { addSchedule, getPositionById, getShiftById, mockPositions, mockStores, getStoresList, removeSchedule, isStoreMatch } from '@/lib/mock-data'
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
import { useAuthStore } from '@/store/auth-store'
import readXlsxFile, { readSheet } from 'read-excel-file/browser'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Clock,
  Building2,
  CheckCircle2,
  AlertCircle,
  Pencil,
  FileSpreadsheet,
  Upload,
  Sparkles,
  UserCheck,
  Tag,
  Calendar,
  Coffee,
  Receipt,
  Check,
  Zap,
  Maximize2,
  Minimize2,
  Users,
  LayoutGrid,
} from 'lucide-react'

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

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

function parseDateKey(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  return new Date(year, month - 1, day, 12, 0, 0, 0)
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
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

function getShiftStyle(shiftText: string) {
  const lower = shiftText.toLowerCase()
  if (lower.includes('sáng') || lower.includes('08:') || lower.includes('09:') || lower.includes('10:')) {
    return {
      bg: 'bg-emerald-50 text-emerald-950 border-emerald-300 hover:border-emerald-500 shadow-2xs',
      icon: '☀️',
      badgeBg: 'bg-emerald-200/70 text-emerald-950',
    }
  }
  if (lower.includes('trưa') || lower.includes('chiều') || lower.includes('12:') || lower.includes('13:') || lower.includes('14:') || lower.includes('15:')) {
    return {
      bg: 'bg-amber-50 text-amber-950 border-amber-300 hover:border-amber-500 shadow-2xs',
      icon: '🌤️',
      badgeBg: 'bg-amber-200/70 text-amber-950',
    }
  }
  if (lower.includes('tối') || lower.includes('đêm') || lower.includes('17:') || lower.includes('18:') || lower.includes('19:') || lower.includes('20:') || lower.includes('21:') || lower.includes('22:')) {
    return {
      bg: 'bg-indigo-50 text-indigo-950 border-indigo-300 hover:border-indigo-500 shadow-2xs',
      icon: '🌙',
      badgeBg: 'bg-indigo-200/70 text-indigo-950',
    }
  }
  return {
    bg: 'bg-purple-50 text-purple-950 border-purple-300 hover:border-purple-500 shadow-2xs',
    icon: '⚡',
    badgeBg: 'bg-purple-200/70 text-purple-950',
  }
}

function calculateShiftHours(startTime: string, endTime: string): number {
  const [sH, sM] = startTime.split(':').map(Number)
  const [eH, eM] = endTime.split(':').map(Number)
  let diff = (eH + eM / 60) - (sH + sM / 60)
  if (diff <= 0) diff += 24
  return Math.round(diff * 10) / 10
}

interface Props {
  weekStartQuery?: string | null
  storeIdQuery?: string | null
}

export default function EmployeeSchedulingBoard({ weekStartQuery, storeIdQuery }: Props) {
  const { user } = useAuthStore()
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedPositionFilter, setSelectedPositionFilter] = useState<string>('ALL')
  const [message, setMessage] = useState<string | null>(null)

  // Modal phân ca cho 1 nhân viên vào 1 ngày
  const [activeSlotModal, setActiveSlotModal] = useState<{
    employeeId: string
    employeeName: string
    date: string
    existingShiftId?: string
    existingScheduleId?: string
  } | null>(null)
  const [modalSelectedPositionId, setModalSelectedPositionId] = useState<string>('pos-001')
  const [flexShiftName, setFlexShiftName] = useState<string>('Ca linh hoạt')
  const [flexStartTime, setFlexStartTime] = useState<string>('18:00')
  const [flexEndTime, setFlexEndTime] = useState<string>('22:00')

  useEffect(() => {
    let isMounted = true
    employeeAdapter.getAllEmployees().then(res => {
      if (isMounted && res && res.length) {
        EmployeeService.syncEmployeesFromAdapter(res)
        setRefreshKey(k => k + 1)
      }
    })
    storeAdapter.getStores().then(res => {
      if (isMounted && res && res.length) {
        setRefreshKey(k => k + 1)
      }
    })
    return () => { isMounted = false }
  }, [])

  const stores = useMemo(() => {
    const list = getStoresList()
    if (!user) return list.filter(store => store.is_active)
    if (['ceo', 'hr_admin'].includes(user.role)) return list.filter(store => store.is_active)
    return list.filter(store => store.id === user.store_id && store.is_active)
  }, [user, refreshKey])

  const anchorWeekStart = useMemo(() => weekStartQuery || plusDays(getWeekStart(), 7), [weekStartQuery])
  const activeWeekStart = useMemo(() => plusDays(anchorWeekStart, weekOffset * 7), [anchorWeekStart, weekOffset])
  const weekDates = useMemo(() => getWeekDates(activeWeekStart), [activeWeekStart])
  const activeStoreId = selectedStoreId || storeIdQuery || stores[0]?.id || user?.store_id || ''

  const board = useMemo(() => {
    void refreshKey
    return user && activeStoreId ? ScheduleService.getAssignmentBoardData(user, activeStoreId, activeWeekStart) : null
  }, [activeStoreId, activeWeekStart, refreshKey, user])

  const templates = useMemo(() => {
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

  const selectedStore = stores.find(s => s.id === activeStoreId)

  // Lọc nhân viên theo bộ phận / vị trí
  const filteredEmployees = useMemo(() => {
    if (!board) return []
    return board.employees.filter(emp => {
      if (selectedPositionFilter === 'ALL') return true
      return emp.employee.position_id === selectedPositionFilter
    })
  }, [board, selectedPositionFilter])

  // Thống kê ca và giờ cho từng nhân viên trong tuần
  const employeeStatsMap = useMemo(() => {
    const stats = new Map<string, { totalShifts: number; totalHours: number }>()
    if (!board) return stats

    board.employees.forEach(empObj => {
      const empId = empObj.employee.id
      const empAssignments = board.assignments.filter(a => a.employee_id === empId && weekDates.includes(a.date))
      
      const shiftsCount = empAssignments.length
      let hoursSum = 0

      empAssignments.forEach(asg => {
        const shift = getShiftById(asg.shift_id)
        if (shift) {
          hoursSum += calculateShiftHours(shift.start_time, shift.end_time)
        } else {
          hoursSum += 4 // Mặc định 4 tiếng cho ca linh hoạt
        }
      })

      stats.set(empId, {
        totalShifts: shiftsCount,
        totalHours: Math.round(hoursSum * 10) / 10,
      })
    })

    return stats
  }, [board, weekDates])

  // State cho Modal Nhập Excel & Sao chép
  const [showImportModal, setShowImportModal] = useState(false)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [clearExistingOnImport, setClearExistingOnImport] = useState(true)

  // Import Excel 3 bước: upload -> preview+match -> confirm
  const [importStep, setImportStep] = useState<1 | 2 | 3>(1)
  const [parsedRows, setParsedRows] = useState<string[][]>([])
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([])
  // columnMapping: index cột trong file -> date string (yyyy-MM-dd) của tuần
  const [columnMapping, setColumnMapping] = useState<Record<number, string>>({})
  const [batchDuplicates, setBatchDuplicates] = useState<ScheduleImportDuplicate[]>([])
  const [batchFileSummaries, setBatchFileSummaries] = useState<ScheduleImportFileSummary[]>([])
  // manualEmpMapping: rowIndex -> employeeId (Ghép thủ công nhân viên nếu chưa khớp)
  const [manualEmpMapping, setManualEmpMapping] = useState<Record<number, string>>({})
  // customShiftMapping: shiftEntry -> { templateId, positionId } (Ghép thủ công mẫu ca & vị trí)
  const [customShiftMapping, setCustomShiftMapping] = useState<Record<string, { templateId: string; positionId?: string }>>({})
  const [ignoredShiftTexts, setIgnoredShiftTexts] = useState<Set<string>>(new Set())
  const [importSelectedStoreId, setImportSelectedStoreId] = useState<string>('')
  const [autoDetectedStoreId, setAutoDetectedStoreId] = useState<string | null>(null)

  useEffect(() => {
    if (activeStoreId && !importSelectedStoreId) {
      setImportSelectedStoreId(activeStoreId)
    }
  }, [activeStoreId, importSelectedStoreId])

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

  // Danh sách các loại ca duy nhất tìm thấy trong file Excel
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

  // Helper làm sạch tên nhân viên (bỏ bớt số ca, số giờ ở đuôi)
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
    let matchedEmp = effectiveStoreEmps.find(e => e.full_name.toLowerCase().trim() === lowerClean)
    let matchType: 'exact' | 'tone_free' | 'substring' | 'initials' = 'exact'

    if (!matchedEmp) {
      matchedEmp = effectiveStoreEmps.find(e => removeVietnameseTones(e.full_name) === toneFreeClean)
      matchType = 'tone_free'
    }

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

  // Giữ lại getEmpForRow tương thích ngược
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
          const shiftId = userMapping?.templateId || smartResolveShiftTemplate(shiftEntry, templates)
          const assignedPosId = userMapping?.positionId !== undefined ? userMapping.positionId : smartResolvePosition(shiftEntry, mockPositions)

          const tpl = templates.find(t => t.id === shiftId)
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
  }, [parsedRows, columnMapping, manualEmpMapping, customShiftMapping, ignoredShiftTexts, importSelectedStoreId, templates])

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
    // 1. Đọc file .xlsx nhị phân bằng readSheet từ read-excel-file
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

        if (rows.length >= 2) {
          return rows
        }
      }
    } catch (err) {
      console.warn('[ExcelImport] readSheet fail or text file, falling back to text parser:', err)
    }

    // 2. Fallback đọc file dạng Text (cho file HTML-table .xls mẫu cũ hoặc file CSV)
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => {
        const text = (e.target?.result as string) || ''

        // Nếu là HTML table (.xls mẫu HTML)
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
              if (cells.some(c => c.length > 0)) {
                rows.push(cells)
              }
            })
            if (rows.length >= 2) {
              return resolve(rows)
            }
          } catch (err) {
            console.warn('[ExcelImport] DOMParser fail:', err)
          }
        }

        // Parse CSV
        const rows = parseCSVText(text)
        resolve(rows)
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
      const defaultTplId = smartResolveShiftTemplate(shiftText, templates, rememberedShiftMap)
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
        templateId: smartResolveShiftTemplate(shiftText, templates, rememberedShiftMap),
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
        const defaultTplId = smartResolveShiftTemplate(shiftText, templates, rememberedShiftMap)

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

  const handleExportExcel = () => {
    if (!board || filteredEmployees.length === 0) {
      setMessage('Không có dữ liệu lịch làm việc để xuất Excel!')
      return
    }

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`
    html += `<head><meta charset="utf-8"><style>
      table { border-collapse: collapse; font-family: Arial, sans-serif; font-size: 12px; }
      th { background-color: #001D3D; color: #FFFFFF; font-weight: bold; padding: 8px; border: 1px solid #CCCCCC; text-align: center; }
      td { border: 1px solid #CCCCCC; padding: 6px; vertical-align: top; }
      .emp-name { font-weight: bold; color: #000000; }
      .emp-stats { font-size: 11px; color: #555555; font-style: italic; }
    </style></head><body>`

    html += `<table>`
    html += `<tr><th>Họ tên nhân viên</th>`
    weekDates.forEach(date => {
      html += `<th>${formatShortDate(date)}</th>`
    })
    html += `</tr>`

    filteredEmployees.forEach(empObj => {
      const emp = empObj.employee
      const stats = employeeStatsMap.get(emp.id) || { totalShifts: 0, totalHours: 0 }

      // Dòng 1: Tên nhân viên + Ca làm từng ngày
      html += `<tr>`
      html += `<td class="emp-name">${emp.full_name}</td>`
      weekDates.forEach(date => {
        const assigned = board.assignments.filter(a => a.employee_id === emp.id && a.date === date)
        if (assigned.length > 0) {
          const textContent = assigned.map(asg => {
            const shift = getShiftById(asg.shift_id)
            return shift ? `${shift.name} [${shift.start_time}-${shift.end_time}]` : (asg.notes || 'Ca làm')
          }).join('<br/>')
          html += `<td>${textContent}</td>`
        } else {
          html += `<td></td>`
        }
      })
      html += `</tr>`

      // Dòng 2: Tổng số ca và tổng giờ
      html += `<tr>`
      html += `<td class="emp-stats">${stats.totalShifts > 0 ? `${stats.totalShifts} ca | ${stats.totalHours} giờ` : '- ca | - giờ'}</td>`
      weekDates.forEach(() => {
        html += `<td></td>`
      })
      html += `</tr>`
    })

    html += `</table></body></html>`

    const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `Lich_Phan_Ca_Homies_${selectedStore?.name || 'Store'}_Tuan_${formatShortDate(weekDates[0])}.xls`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setMessage('Đã xuất file Excel lịch làm việc theo mẫu thành công!')
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

  const handleCopyWeekSchedule = () => {
    if (!activeStoreId || !board) return
    const nextWeekStartStr = plusDays(activeWeekStart, 7)
    const nextWeekDatesStr = getWeekDates(nextWeekStartStr)

    let copyCount = 0
    board.assignments.forEach(asg => {
      const dayIndex = weekDates.indexOf(asg.date)
      if (dayIndex !== -1 && nextWeekDatesStr[dayIndex]) {
        addSchedule(activeStoreId, asg.employee_id, asg.shift_id, nextWeekDatesStr[dayIndex], asg.notes, 'published')
        copyCount++
      }
    })

    setRefreshKey(prev => prev + 1)
    setShowCopyModal(false)
    setMessage(`Đã sao chép thành công ${copyCount} ca làm việc sang tuần tiếp theo!`)
  }

  const handleClearWeekSchedules = () => {
    if (!activeStoreId || !user) return
    const confirmed = confirm(
      `Bạn có chắc chắn muốn xóa toàn bộ ca làm việc trong tuần (${formatShortDate(weekDates[0])} - ${formatShortDate(weekDates[6])}) của ${selectedStore?.name || 'cửa hàng'} không?\n\nHành động này sẽ làm sạch toàn bộ bảng để bạn có thể nhập dữ liệu thật hoặc xếp lại từ đầu.`
    )
    if (!confirmed) return

    ScheduleService.clearWeekSchedules(user, activeStoreId, weekDates)
    setRefreshKey(prev => prev + 1)
    setMessage('Đã xóa sạch toàn bộ ca làm việc trong tuần!')
  }

  const handleConfirmImport = () => {
    if (!activeStoreId || parsedRows.length === 0 || !user) return

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
      ) return // bỏ qua dòng tiêu đề, nhân sự không hoạt động hoặc chưa xác nhận khác chi nhánh

      // Với mỗi cột đã được map sang ngày
      Object.entries(columnMapping).forEach(([colIdxStr, date]) => {
        const colIdx = Number(colIdxStr)
        const cellValue = row[colIdx]?.trim()
        if (!cellValue || !date) return

        // Tách nhiều ca trong cùng 1 ô (phân cách bởi xuống dòng, /, ;, hoặc <br>)
        const shiftEntries = cellValue
          .split(/[\n;/]|<br\s*\/?>/i)
          .map(s => s.trim())
          .filter(Boolean)

        shiftEntries.forEach(shiftEntry => {
          if (isNonWorkingScheduleCell(shiftEntry)) return
          const entryLower = shiftEntry.toLowerCase()
          const timeMatch = shiftEntry.match(/\[(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\]/)
          const startTime = timeMatch ? timeMatch[1] : ''
          const endTime = timeMatch ? timeMatch[2] : ''

          // Ưu tiên dùng cấu hình match ca & vị trí do quản lý tự chỉnh ở bước 2 nếu có
          const userMapping = customShiftMapping[shiftEntry]

          const shiftId = userMapping?.templateId || resolveShiftTemplateForText(shiftEntry, templates)

          // Nhận diện Vị trí công việc (Thu ngân, Pha chế, Phục vụ, Trưởng ca...)
          const textWithoutTime = shiftEntry.replace(/\[.*?\]/, '').trim()
          const matchedPos = mockPositions.find(p => textWithoutTime.toLowerCase().includes(p.name.toLowerCase()))
          const assignedPosId = userMapping?.positionId ? userMapping.positionId : (matchedPos?.id || 'pos-001')

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
        ScheduleService.clearWeekSchedules(user, importSelectedStoreId || activeStoreId, getWeekDates(weekStart))
      })
    }

    const sampleDate = shiftsToImport[0]?.date || Object.values(columnMapping)[0] || detectedWeekStart
    const importedMonStr = sampleDate ? getWeekStart(parseDateKey(sampleDate)) : detectedWeekStart

    const targetWeek = importedMonStr
      ? getWeekDates(importedMonStr)
      : weekDates

    const targetStoreId = importSelectedStoreId || activeStoreId

    const addedCount = ScheduleService.importShifts(user, targetStoreId, shiftsToImport, {
      clearExisting: isBatchImport ? false : clearExistingOnImport,
      weekDates: targetWeek,
      status: 'draft',
    })

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
    setBatchDuplicates([])
    setBatchFileSummaries([])
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

  const handleAssignShift = (
    employeeId: string,
    date: string,
    shiftId: string,
    positionId?: string,
    customName?: string,
    customStart?: string,
    customEnd?: string,
    replaceScheduleId?: string
  ) => {
    if (!activeStoreId) return
    const targetPosId = positionId || modalSelectedPositionId || 'pos-001'
    const pos = mockPositions.find(p => p.id === targetPosId)
    const tpl = ShiftTemplateService.getAll().find(t => t.id === shiftId)

    let notes: string | undefined
    const isFlexible = shiftId === 'shift-004' || tpl?.is_flexible || tpl?.code?.includes('FLEX') || (tpl?.name && isFlexibleShiftText(tpl.name))

    if (isFlexible) {
      const sName = (customName !== undefined ? customName : flexShiftName).trim() || 'Ca linh hoạt'
      const sStart = customStart || flexStartTime || '18:00'
      const sEnd = customEnd || flexEndTime || '22:00'
      const pName = pos ? ` (${pos.name})` : ''
      notes = `${sName}${pName} [${sStart}-${sEnd}]`
    } else {
      notes = pos ? `${tpl?.name || 'Ca làm'} (${pos.name})` : tpl?.name
    }

    addSchedule(activeStoreId, employeeId, shiftId, date, notes, 'published', targetPosId, replaceScheduleId)
    setRefreshKey(prev => prev + 1)
    setActiveSlotModal(null)
    setMessage('Đã xếp ca thành công!')
  }

  const handleRemoveShift = (employeeId: string, date: string, scheduleId?: string) => {
    removeSchedule(employeeId, date, scheduleId)
    setRefreshKey(prev => prev + 1)
    setMessage('Đã gỡ ca làm việc!')
  }

  if (!user) return null

  return (
    <AppShell showNav>
      <div className="animate-fade-in space-y-4 pb-20">
        {/* Header Toolbar */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-2xs">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Title & Navigation */}
            <div className="flex flex-wrap items-center gap-2">
              <div>
                <h1 className="text-lg font-extrabold text-gray-900 tracking-tight mr-1">Lịch làm việc theo nhân viên</h1>
              </div>

              {/* Chế độ xem: Theo ca / Theo nhân viên */}
              <div className="flex items-center rounded-xl bg-gray-100 p-0.5 border border-gray-200 text-xs font-bold mr-1">
                <Link
                  href={`/schedule?weekStart=${activeWeekStart}&storeId=${activeStoreId}`}
                  className="rounded-lg px-2.5 py-1 text-gray-500 hover:text-gray-900 transition"
                >
                  Theo ca
                </Link>
                <span className="rounded-lg bg-white px-2.5 py-1 text-gray-900 shadow-2xs">
                  Theo nhân viên
                </span>
              </div>

              {/* Chi nhánh dropdown */}
              {(user.role === 'ceo' || user.role === 'hr_admin') ? (
                <select
                  value={activeStoreId}
                  onChange={e => setSelectedStoreId(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 shadow-2xs hover:bg-gray-50 transition cursor-pointer"
                >
                  {stores.map(store => (
                    <option key={store.id} value={store.id}>{store.name}</option>
                  ))}
                </select>
              ) : (
                <span className="rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1 text-xs font-bold text-gray-700">
                  {selectedStore?.name}
                </span>
              )}

              {/* Điều hướng tuần */}
              <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50/80 p-1">
                <button
                  onClick={() => setWeekOffset(prev => prev - 1)}
                  className="rounded-lg p-1 text-gray-600 hover:bg-white hover:shadow-2xs transition"
                  title="Tuần trước"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="px-3 text-xs font-bold text-gray-800">
                  {formatShortDate(weekDates[0])} - {formatShortDate(weekDates[6])}
                </span>
                <button
                  onClick={() => setWeekOffset(prev => prev + 1)}
                  className="rounded-lg p-1 text-gray-600 hover:bg-white hover:shadow-2xs transition"
                  title="Tuần sau"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Lọc Bộ phận / Vị trí */}
              <select
                value={selectedPositionFilter}
                onChange={e => setSelectedPositionFilter(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-800 shadow-2xs focus:outline-hidden focus:ring-1 focus:ring-[#2F6FA8] cursor-pointer"
              >
                <option value="ALL">Tất cả bộ phận / vị trí</option>
                {mockPositions.map(pos => (
                  <option key={pos.id} value={pos.id}>
                    {pos.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Các nút hành động chính */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setMessage('Đã áp dụng bộ lọc!')}
                className="inline-flex items-center rounded-xl border border-blue-600 bg-[#2F6FA8] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#1D3E61] transition"
              >
                Lọc
              </button>
              <button
                onClick={() => setShowCopyModal(true)}
                className="inline-flex items-center rounded-xl border border-blue-600 bg-[#2F6FA8] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#1D3E61] transition"
              >
                Sao chép
              </button>
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center rounded-xl border border-blue-600 bg-[#2F6FA8] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#1D3E61] transition"
              >
                Xuất Excel
              </button>
              <button
                onClick={() => setShowImportModal(true)}
                className="inline-flex items-center rounded-xl border border-emerald-600 bg-[#1E9E57] px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-emerald-700 transition"
              >
                Nhập Excel
              </button>
              <button
                onClick={handleClearWeekSchedules}
                className="inline-flex items-center rounded-xl border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 shadow-2xs hover:bg-red-100 transition"
                title="Xóa toàn bộ ca trong tuần này để làm sạch bảng"
              >
                Làm sạch tuần
              </button>
              <button
                onClick={() => window.location.href = `/schedule?weekStart=${activeWeekStart}&storeId=${activeStoreId}`}
                className="inline-flex items-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-bold text-[#2F6FA8] hover:bg-blue-100 transition shadow-2xs cursor-pointer"
              >
                Xem theo ca làm
              </button>
              <button
                onClick={() => setMessage('Đã tính toán lại số ca và số giờ làm việc!')}
                className="inline-flex items-center rounded-xl bg-[#001D3D] px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-slate-900 transition"
              >
                Tính lại ca và giờ làm việc
              </button>
            </div>
          </div>
        </div>

        {/* Thông báo hệ thống */}
        {message && (
          <div className="flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-xs text-blue-900">
            <span>{message}</span>
            <button onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Bảng Ma trận Lịch làm việc theo Nhân viên */}
        <div className="rounded-2xl border border-gray-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[1100px]">
              {/* Header Cột: Cột Nhân viên & 7 Ngày trong tuần */}
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-bold text-gray-700">
                  <th className="w-64 p-3 text-left bg-gray-100/80 border-r border-gray-200">Nhân viên</th>
                  {weekDates.map(date => (
                    <th key={date} className="p-3 text-center border-r border-gray-200 last:border-r-0 min-w-[140px]">
                      <div className="text-xs font-bold text-gray-800 uppercase">{formatShortDate(date)}</div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Body Bảng: Hàng Nhân viên -> 7 Ngày trong tuần */}
              <tbody className="divide-y divide-gray-200 text-xs">
                {filteredEmployees.map(empObj => {
                  const emp = empObj.employee
                  const posName = getPositionById(emp.position_id)?.name || 'Nhân viên'
                  const stats = employeeStatsMap.get(emp.id) || { totalShifts: 0, totalHours: 0 }

                  return (
                    <tr key={emp.id} className="hover:bg-blue-50/10 transition">
                      {/* Cột Nhân viên (Tên + Số ca | Số giờ) */}
                      <td className="p-3 align-top bg-gray-50/40 border-r border-gray-200">
                        <div className="font-bold text-gray-900 text-sm leading-snug">{emp.full_name}</div>
                        <div className="text-xs font-semibold text-gray-500 mt-1">
                          {stats.totalShifts > 0 ? (
                            <span className="text-[#1E9E57] font-bold">{stats.totalShifts} ca</span>
                          ) : (
                            <span>- ca</span>
                          )}
                          {' | '}
                          {stats.totalHours > 0 ? (
                            <span className="text-gray-800 font-bold">{stats.totalHours} giờ</span>
                          ) : (
                            <span>- giờ</span>
                          )}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-0.5">{posName}</div>
                      </td>

                      {/* 7 Ô ngày trong tuần của Nhân viên */}
                      {weekDates.map(date => {
                        // Lọc các ca làm của nhân viên này trong ngày
                        const assignedShifts = board?.assignments.filter(
                          a => a.employee_id === emp.id && a.date === date
                        ) || []

                        return (
                          <td
                            key={`${emp.id}-${date}`}
                            className="p-2 align-top border-r border-gray-200 last:border-r-0 hover:bg-[#2F6FA8]/5 transition"
                          >
                            <div className="space-y-1.5 min-h-[70px]">
                              {/* Danh sách các thẻ ca làm đã xếp cho nhân viên này */}
                              {assignedShifts.map(asg => {
                                const shift = getShiftById(asg.shift_id)
                                let shiftName = shift?.name || 'Ca làm'
                                let timeStr = shift ? `${shift.start_time}-${shift.end_time}` : ''
                                let posName = ''

                                // Ưu tiên trích xuất Tên ca, Vị trí (Pha chế, Thu ngân...) & Khung giờ gốc từ notes
                                if (asg.notes) {
                                  const notesClean = asg.notes.trim()
                                  const timeMatch = notesClean.match(/\[(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\]/)
                                  if (timeMatch) {
                                    timeStr = `${timeMatch[1]}-${timeMatch[2]}`
                                  }

                                  const textWithoutTime = notesClean.replace(/\[.*?\]/, '').trim()

                                  // Nhận diện Vị trí công việc dính trong tên ca (Pha chế, Thu ngân, Phục vụ, Trưởng ca...)
                                  const matchedPos = mockPositions.find(p => textWithoutTime.toLowerCase().includes(p.name.toLowerCase()))
                                  if (matchedPos) {
                                    posName = matchedPos.name
                                    const cleanShiftOnly = textWithoutTime.replace(new RegExp(matchedPos.name, 'gi'), '').trim()
                                    if (cleanShiftOnly) shiftName = cleanShiftOnly
                                  } else if (textWithoutTime) {
                                    shiftName = textWithoutTime
                                  }
                                }

                                return (
                                  <div
                                    key={asg.id}
                                    onClick={() => {
                                      if (asg.assigned_position_id) setModalSelectedPositionId(asg.assigned_position_id)
                                      
                                      if (asg.notes) {
                                        const timeMatch = asg.notes.match(/\[(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\]/) || asg.notes.match(/\((\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\)/)
                                        if (timeMatch) {
                                          setFlexStartTime(timeMatch[1])
                                          setFlexEndTime(timeMatch[2])
                                        } else {
                                          setFlexStartTime('18:00')
                                          setFlexEndTime('22:00')
                                        }
                                        const textWithoutTime = asg.notes.replace(/\[.*?\]/, '').replace(/\(.*?\)/, '').trim()
                                        let cleanShiftOnly = textWithoutTime
                                        mockPositions.forEach(p => {
                                          cleanShiftOnly = cleanShiftOnly.replace(new RegExp(p.name, 'gi'), '').trim()
                                        })
                                        cleanShiftOnly = cleanShiftOnly.replace(/\(\s*\)/g, '').trim()
                                        setFlexShiftName(cleanShiftOnly || 'Ca linh hoạt')
                                      } else {
                                        setFlexShiftName('Ca linh hoạt')
                                        setFlexStartTime('18:00')
                                        setFlexEndTime('22:00')
                                      }

                                      setActiveSlotModal({
                                        employeeId: emp.id,
                                        employeeName: emp.full_name,
                                        date,
                                        existingShiftId: asg.shift_id,
                                        existingScheduleId: asg.id,
                                      })
                                    }}
                                    className="group relative rounded-xl border border-[#1E9E57]/40 bg-[#DDF4EC] hover:bg-[#c9eee1] px-3 py-2 text-center text-xs font-bold text-[#1E9E57] shadow-2xs transition cursor-pointer"
                                  >
                                    <div className="text-xs font-extrabold truncate" title={shiftName}>{shiftName}</div>
                                    {posName && <div className="text-[10px] text-[#2F6FA8] font-extrabold mt-0.5 font-sans">({posName})</div>}
                                    {timeStr && <div className="text-[10px] text-[#064E3B] font-semibold mt-0.5">[{timeStr}]</div>}

                                    {/* Nút gỡ nhanh ca */}
                                    <button
                                      onClick={e => {
                                        e.stopPropagation()
                                        handleRemoveShift(emp.id, date, asg.id)
                                      }}
                                      className="absolute right-1 top-1 hidden group-hover:flex h-4 w-4 items-center justify-center rounded-full bg-[#D9381E] text-white hover:bg-red-700 transition"
                                      title="Gỡ ca này"
                                    >
                                      <X size={10} />
                                    </button>
                                  </div>
                                )
                              })}

                              {/* Nút ô nét đứt (+) mở Modal chọn ca làm cho nhân viên */}
                              <div
                                onClick={() => {
                                  setModalSelectedPositionId(emp.position_id || 'pos-001')
                                  setFlexShiftName('Ca linh hoạt')
                                  setFlexStartTime('18:00')
                                  setFlexEndTime('22:00')
                                  setActiveSlotModal({
                                    employeeId: emp.id,
                                    employeeName: emp.full_name,
                                    date,
                                  })
                                }}
                                className="w-full rounded-xl border-2 border-dashed border-gray-300 bg-white hover:border-[#2F6FA8] hover:bg-[#2F6FA8]/5 py-2 text-center text-gray-400 hover:text-[#2F6FA8] cursor-pointer transition flex items-center justify-center"
                                title="Xếp ca cho nhân viên này"
                              >
                                <Plus size={16} strokeWidth={2.5} />
                              </div>
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

      {/* POPUP MODAL CHỌN CA PHÂN CHO NHÂN VIÊN */}
      {activeSlotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col animate-scale-in border border-gray-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 bg-white">
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-snug">
                  {activeSlotModal.existingShiftId ? 'Đổi ca / Vị trí cho' : 'Xếp ca cho'} {activeSlotModal.employeeName}
                </h2>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">
                  {formatShortDate(activeSlotModal.date)}
                </p>
              </div>
              <button
                onClick={() => setActiveSlotModal(null)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Nội dung chọn Vị trí & Ca làm */}
            <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
              {/* Chọn Vị trí công việc */}
              <div>
                <label className="text-xs font-bold text-gray-800 block mb-2">1. Chọn Vị trí công việc:</label>
                <div className="flex flex-wrap gap-2">
                  {mockPositions.map(pos => {
                    const isSelected = modalSelectedPositionId === pos.id
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setModalSelectedPositionId(pos.id)}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#2F6FA8] text-white border-blue-600 shadow-2xs'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {pos.name}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Chọn Loại ca làm việc */}
              <div>
                <label className="text-xs font-bold text-gray-800 block mb-2">2. Chọn Loại ca làm việc:</label>
                <div className="space-y-3">
                  {templates.map(tpl => {
                    const isCurrentShift = activeSlotModal.existingShiftId === tpl.id
                    const isFlexible = tpl.id === 'shift-004' || tpl.is_flexible || tpl.code?.includes('FLEX') || (tpl.name && isFlexibleShiftText(tpl.name))

                    if (isFlexible) {
                      return (
                        <div
                          key={tpl.id}
                          className={`rounded-2xl border p-3.5 transition space-y-3 ${
                            isCurrentShift
                              ? 'border-[#1E9E57] bg-[#DDF4EC]/40 ring-1 ring-[#1E9E57]'
                              : 'border-amber-300 bg-amber-50/40 hover:border-amber-400'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-white font-bold">
                                <Zap size={16} />
                              </div>
                              <div>
                                <div className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                                  <span>{tpl.name}</span>
                                  {isCurrentShift && (
                                    <span className="text-[10px] bg-[#1E9E57] text-white px-2 py-0.2 rounded-full font-extrabold">Đang xếp</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-amber-800 font-bold mt-0.5">
                                  [{flexStartTime} - {flexEndTime}] • {flexShiftName || 'Ca linh hoạt'}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Bộ chỉnh tên ca & giờ làm cho Ca Linh Hoạt */}
                          <div className="rounded-xl bg-white border border-amber-200 p-3 space-y-2.5">
                            <div>
                              <label className="text-[11px] font-bold text-gray-700 block mb-1">Tên ca / Nhiệm vụ linh hoạt:</label>
                              <input
                                type="text"
                                value={flexShiftName}
                                onChange={e => setFlexShiftName(e.target.value)}
                                placeholder="VD: KIỂM KHO, TĂNG CƯỜNG, CA BỔ SUNG..."
                                className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-1.5 text-xs font-bold text-gray-900 focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[11px] font-bold text-gray-700 block mb-1">Giờ bắt đầu:</label>
                                <input
                                  type="text"
                                  value={flexStartTime}
                                  onChange={e => setFlexStartTime(e.target.value)}
                                  placeholder="18:00"
                                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-xs font-bold text-gray-900 text-center focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                />
                              </div>
                              <div>
                                <label className="text-[11px] font-bold text-gray-700 block mb-1">Giờ kết thúc:</label>
                                <input
                                  type="text"
                                  value={flexEndTime}
                                  onChange={e => setFlexEndTime(e.target.value)}
                                  placeholder="22:00"
                                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-2.5 py-1.5 text-xs font-bold text-gray-900 text-center focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                                />
                              </div>
                            </div>

                            {/* Gợi ý chọn nhanh khung giờ linh hoạt */}
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] font-bold text-gray-500">Gợi ý nhanh:</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setFlexShiftName('KIỂM KHO')
                                  setFlexStartTime('18:00')
                                  setFlexEndTime('22:00')
                                }}
                                className="rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-900 hover:bg-amber-200 transition"
                              >
                                KIỂM KHO (18:00-22:00)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFlexShiftName('CA BỔ SUNG')
                                  setFlexStartTime('11:00')
                                  setFlexEndTime('17:00')
                                }}
                                className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-900 hover:bg-emerald-200 transition"
                              >
                                BỔ SUNG (11:00-17:00)
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setFlexShiftName('CA PHÁT SINH')
                                  setFlexStartTime('18:00')
                                  setFlexEndTime('23:00')
                                }}
                                className="rounded-md bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-900 hover:bg-purple-200 transition"
                              >
                                PHÁT SINH TỐI (18:00-23:00)
                              </button>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAssignShift(
                              activeSlotModal.employeeId,
                              activeSlotModal.date,
                              tpl.id,
                              modalSelectedPositionId,
                              flexShiftName,
                              flexStartTime,
                              flexEndTime,
                              activeSlotModal.existingScheduleId
                            )}
                            className="w-full rounded-xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-2xs transition flex items-center justify-center gap-1.5"
                          >
                            <Zap size={14} />
                            <span>Xác nhận xếp ca {flexShiftName || 'Linh hoạt'} [{flexStartTime} - {flexEndTime}]</span>
                          </button>
                        </div>
                      )
                    }

                    return (
                      <button
                        key={tpl.id}
                        type="button"
                        onClick={() => handleAssignShift(
                          activeSlotModal.employeeId,
                          activeSlotModal.date,
                          tpl.id,
                          modalSelectedPositionId,
                          undefined,
                          undefined,
                          undefined,
                          activeSlotModal.existingScheduleId
                        )}
                        className={`w-full flex items-center justify-between rounded-xl border p-3 transition cursor-pointer text-left group ${
                          isCurrentShift
                            ? 'border-[#1E9E57] bg-[#DDF4EC]/60'
                            : 'border-gray-200 bg-gray-50/50 hover:border-[#2F6FA8] hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                            isCurrentShift ? 'bg-[#1E9E57] text-white' : 'bg-blue-100 text-[#2F6FA8] group-hover:bg-[#2F6FA8] group-hover:text-white'
                          }`}>
                            <Clock size={16} />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                              <span>{tpl.name}</span>
                              {isCurrentShift && (
                                <span className="text-[10px] bg-[#1E9E57] text-white px-2 py-0.2 rounded-full font-extrabold">Đang chọn</span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500 font-medium">{tpl.start_time} - {tpl.end_time}</div>
                          </div>
                        </div>
                        <span className={`rounded-lg px-3 py-1.5 text-xs font-bold shadow-2xs transition ${
                          isCurrentShift
                            ? 'bg-[#1E9E57] text-white'
                            : 'bg-[#2F6FA8] text-white group-hover:bg-[#1D3E61]'
                        }`}>
                          {isCurrentShift ? 'Đã xếp' : 'Chọn ca này'}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3.5 bg-gray-50">
              {activeSlotModal.existingScheduleId || activeSlotModal.existingShiftId ? (
                <button
                  type="button"
                  onClick={() => {
                    handleRemoveShift(activeSlotModal.employeeId, activeSlotModal.date, activeSlotModal.existingScheduleId)
                    setActiveSlotModal(null)
                  }}
                  className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100 transition"
                >
                  Gỡ ca này
                </button>
              ) : <div />}
              <button
                type="button"
                onClick={() => setActiveSlotModal(null)}
                className="rounded-xl bg-slate-500 px-5 py-2 text-xs font-bold text-white hover:bg-slate-600 transition"
              >
                Bỏ qua
              </button>
            </div>
          </div>
        </div>
      )}
      {/* POPUP MODAL NHẬP EXCEL - 3 BƯỚC */}
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
                    setSelectedFiles([])
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

            {/* ===== BƯỚC 1: UPLOAD FILE ===== */}
            {importStep === 1 && (
              <div className="p-6 space-y-4">
                {/* Tải file mẫu */}
                <div className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
                  <div className="flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-600 shrink-0" />
                    <span>Tải file Excel mẫu phân ca chuẩn để xem cấu trúc định dạng chuẩn:</span>
                  </div>
                  <button
                    onClick={handleDownloadSampleExcel}
                    className="shrink-0 rounded-xl bg-amber-600 hover:bg-amber-700 px-3.5 py-1.5 text-xs font-bold text-white transition shadow-2xs cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <FileSpreadsheet size={13} /> Tải file mẫu
                  </button>
                </div>

                {/* Vùng kéo-thả/Upload file */}
                <div
                  className="rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center hover:border-[#2F6FA8] bg-gray-50/50 transition cursor-pointer"
                  onClick={() => document.getElementById('excel-import-input')?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    const files = Array.from(e.dataTransfer.files || [])
                    if (files.length > 0) handleFilesSelected(files)
                  }}
                >
                  <input
                    type="file"
                    accept=".csv, .xls, .xlsx"
                    multiple
                    id="excel-import-input"
                    className="hidden"
                    onChange={e => {
                      const files = Array.from(e.target.files || [])
                      if (files.length > 0) handleFilesSelected(files)
                    }}
                  />
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-[#2F6FA8] shadow-inner mb-2">
                    <Upload size={26} />
                  </div>
                  <div className="text-sm font-bold text-gray-700">
                    {selectedFile ? `Đã chọn: ${selectedFile.name}` : 'Kéo thả hoặc nhấn để chọn file Excel'}
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1.5">Hỗ trợ .csv, .xls, .xlsx — Hệ thống tự nhận diện chi nhánh & khớp tên nhân viên</div>
                </div>
              </div>
            )}

            {/* ===== BƯỚC 2: PREVIEW + MATCH CỘT (TỐI ƯU GỌN GÀNG, DỄ NHÌN) ===== */}
            {importStep === 2 && parsedHeaders.length > 0 && (
              <div className="flex flex-col flex-1 overflow-hidden" style={{ minHeight: '620px', maxHeight: isModalMaximized ? '88vh' : '84vh' }}>
                
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

                        const defaultTplId = smartResolveShiftTemplate(shiftText, templates)
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
                                {templates.map(tpl => (
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
                                {/* Cột 1: Thông tin nhân viên & Badge Trạng thái Khớp */}
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
                        const regularTemplates = templates.filter(
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
              <div className="p-5 space-y-3">
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 text-xs text-emerald-900 space-y-2">
                  <div className="font-bold text-sm text-emerald-900">Tóm tắt nội dung sẽ nhập:</div>
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

                {/* Tùy chọn làm sạch lịch cũ trước khi nhập */}
                <label className="flex items-start gap-2.5 rounded-xl border border-emerald-300 bg-white p-3 cursor-pointer select-none shadow-2xs hover:bg-emerald-50/30 transition">
                  <input
                    type="checkbox"
                    checked={clearExistingOnImport}
                    onChange={e => setClearExistingOnImport(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1E9E57] focus:ring-[#1E9E57]"
                  />
                  <div>
                    <div className="text-xs font-bold text-gray-900">
                      Xóa sạch các ca cũ trong tuần này trước khi nhập dữ liệu mới
                    </div>
                    <div className="text-[11px] text-gray-500 font-medium mt-0.5">
                      (Khuyến nghị: Giúp loại bỏ dữ liệu mẫu hoặc ca cũ, đảm bảo bảng chỉ chứa 100% dữ liệu thực từ file Excel)
                    </div>
                  </div>
                </label>

                <p className="text-xs text-gray-500">
                  Hệ thống sẽ tự động khớp tên ca làm việc trong file với các mẫu ca hiện có của cửa hàng và đồng bộ vào CSDL.
                </p>
              </div>
            )}

            {/* Footer Modal - Hiển thị nút theo bước */}
            <div className="flex items-center justify-between border-t border-gray-200 px-5 py-3.5 bg-gray-50 shrink-0">
              <div>
                {importStep > 1 && (
                  <button
                    onClick={() => setImportStep(prev => (prev > 1 ? (prev - 1) as 1 | 2 | 3 : 1))}
                    className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 transition"
                  >
                    Quay lai
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setShowImportModal(false)
                    setSelectedFile(null)
                    setParsedRows([])
                    setParsedHeaders([])
                    setColumnMapping({})
                    setImportStep(1)
                  }}
                  className="rounded-xl bg-slate-400 px-4 py-2 text-xs font-bold text-white hover:bg-slate-500 transition"
                >
                  Huy bo
                </button>
                {importStep === 1 && (
                  <button
                    onClick={() => (selectedFile || selectedFiles.length > 0) && setImportStep(2)}
                    disabled={!selectedFile && selectedFiles.length === 0}
                    className="rounded-xl bg-[#2F6FA8] px-5 py-2 text-xs font-bold text-white hover:bg-[#1D3E61] transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Xem truoc du lieu
                  </button>
                )}
                {importStep === 2 && (
                  <button
                    onClick={() => setImportStep(3)}
                    disabled={Object.keys(columnMapping).length === 0}
                    className="rounded-xl bg-[#2F6FA8] px-5 py-2 text-xs font-bold text-white hover:bg-[#1D3E61] transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Tiep theo
                  </button>
                )}
                {importStep === 3 && (
                  <button
                    onClick={handleConfirmImport}
                    className="rounded-xl bg-[#1E9E57] px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-2xs cursor-pointer"
                  >
                    {selectedFiles.length > 1 ? `Xac nhan nhap ${selectedFiles.length} file` : 'Xac nhan nhap lich'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* POPUP MODAL SAO CHÉP LỊCH TUẦN */}
      {showCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col animate-scale-in border border-gray-200">
            {/* Header Modal */}
            <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4 bg-white">
              <div>
                <h2 className="text-base font-bold text-gray-900 leading-snug">
                  Sao chép lịch làm việc tuần
                </h2>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">
                  Sao chép phân ca từ tuần hiện tại sang tuần tiếp theo
                </p>
              </div>
              <button
                onClick={() => setShowCopyModal(false)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content Modal */}
            <div className="p-5 space-y-3">
              <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5 text-xs text-gray-700 space-y-1">
                <div><span className="font-bold text-gray-900">Tuần nguồn:</span> {formatShortDate(weekDates[0])} - {formatShortDate(weekDates[6])}</div>
                <div><span className="font-bold text-gray-900">Tuần đích:</span> {formatShortDate(plusDays(activeWeekStart, 7))} - {formatShortDate(plusDays(activeWeekStart, 13))}</div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Hệ thống sẽ tự động sao chép toàn bộ các ca làm đã phân của tuần hiện tại sang tuần sau cho tất cả nhân viên.
              </p>
            </div>

            {/* Footer Modal */}
            <div className="flex items-center justify-end gap-2 border-t border-gray-200 px-5 py-3.5 bg-gray-50">
              <button
                onClick={() => setShowCopyModal(false)}
                className="rounded-xl bg-slate-400 px-4 py-2 text-xs font-bold text-white hover:bg-slate-500 transition"
              >
                Hủy
              </button>
              <button
                onClick={handleCopyWeekSchedule}
                className="rounded-xl bg-[#2F6FA8] px-5 py-2 text-xs font-bold text-white hover:bg-[#1D3E61] transition shadow-2xs cursor-pointer"
              >
                Xác nhận sao chép
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
