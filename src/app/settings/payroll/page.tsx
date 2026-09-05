'use client'

import { useState, useEffect, useMemo, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { useSettingPermissions } from '@/hooks/usePermissions'
import { settingsPayroll } from '@/lib/mock-data-settings'
import { mockStores } from '@/lib/mock-data'
import { storeAdapter } from '@/lib/adapters'
import {
  laborBudgets,
  updateStoreBudget,
} from '@/lib/mock-data-labor-cost'
import {
  comparePayrollPolicies,
  getActivePayrollPolicy,
  getStoredPayrollPolicy,
  getStoredPayrollPolicyHistory,
  loadPayrollPolicyFromDb,
  fetchRemotePayrollPolicy,
  syncRemotePayrollPolicy,
  MIN_REGION_1_SALARY,
  recordPayrollPolicyChange,
  rollbackPayrollPolicy,
  saveStoredPayrollPolicy,
  savePayrollPolicyToDb,
  type PayrollPolicy,
  type PayrollSalaryGrade,
} from '@/lib/services/payroll-policy-service'
import {
  ShieldCheck,
  Banknote,
  SlidersHorizontal,
  Utensils,
  Landmark,
  FileClock,
  Sparkles,
  ChevronRight,
  Calculator,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Store,
  Coins,
  Clock,
  Briefcase,
  Info,
  X,
  Plus,
  Minus,
  Trash2,
  ChevronDown,
  ArrowRight,
} from 'lucide-react'

// Helper format tiền tệ rõ ràng, dễ nhìn
const formatVnd = (value: number) => `${Math.round(value).toLocaleString('vi-VN')} đ`
const formatPercent = (value: number) => `${Math.round(value * 1000) / 10}%`

type MainTab = 'core_salary' | 'fnb_perks' | 'compliance_budget' | 'history'
type SalaryGrade = PayrollSalaryGrade

// Thư viện danh mục tiêu chí phụ cấp F&B để người dùng chọn qua Dropdown (SaaS Allowance Library)
type AllowanceCatalogItem = {
  key: string
  label: string
  defaultAmount: number
  unit: string
  category: 'fnb_shift' | 'custom'
  field?: keyof PayrollPolicy['fnb']
  note: string
}

const ALLOWANCE_CATALOG: AllowanceCatalogItem[] = [
  {
    key: 'mealAllowancePerShift',
    label: 'Cơm ca làm việc',
    defaultAmount: 30000,
    unit: '/ ca',
    category: 'fnb_shift',
    field: 'mealAllowancePerShift',
    note: 'Cộng tự động cho ca làm việc từ 5 tiếng trở lên',
  },
  {
    key: 'closingShiftAllowance',
    label: 'Phụ cấp ca đóng cửa (Close)',
    defaultAmount: 40000,
    unit: '/ ca',
    category: 'fnb_shift',
    field: 'closingShiftAllowance',
    note: 'Dọn dẹp quầy bar, kiểm kê và chốt két tiền cuối ngày',
  },
  {
    key: 'nightShiftAllowance',
    label: 'Phụ cấp ca đêm muộn',
    defaultAmount: 45000,
    unit: '/ ca',
    category: 'fnb_shift',
    field: 'nightShiftAllowance',
    note: 'Làm việc khung giờ muộn sau 22h00 đêm',
  },
  {
    key: 'openingShiftAllowance',
    label: 'Phụ cấp ca mở cửa sớm (Open)',
    defaultAmount: 25000,
    unit: '/ ca',
    category: 'fnb_shift',
    field: 'openingShiftAllowance',
    note: 'Đến sớm mở quầy, bật máy pha chế và nhận nguyên liệu',
  },
  {
    key: 'splitShiftAllowance',
    label: 'Phụ cấp ca gãy (Split Shift)',
    defaultAmount: 25000,
    unit: '/ ca',
    category: 'fnb_shift',
    field: 'splitShiftAllowance',
    note: 'Hỗ trợ chi phí đi lại cho nhân sự làm 2 ca trưa/tối tách biệt',
  },
  {
    key: 'peakHourBonus',
    label: 'Thưởng giờ cao điểm',
    defaultAmount: 15000,
    unit: '/ ca',
    category: 'fnb_shift',
    field: 'peakHourBonus',
    note: 'Khung giờ khách dồn dập (Trưa 11h-13h hoặc Tối cuối tuần)',
  },
  {
    key: 'transport_fuel',
    label: 'Phụ cấp xăng xe & đi lại',
    defaultAmount: 200000,
    unit: '/ tháng',
    category: 'custom',
    note: 'Hỗ trợ di chuyển cho quản lý hoặc nhân sự điều phối liên chi nhánh',
  },
  {
    key: 'duty_lead',
    label: 'Phụ cấp trách nhiệm / Kiêm nhiệm',
    defaultAmount: 500000,
    unit: '/ tháng',
    category: 'custom',
    note: 'Dành cho trưởng nhóm, người quản lý kho hoặc kiểm ngân ca',
  },
]

// Component nhập tiền tệ có định dạng phân tách hàng ngàn trực quan
function MoneyNumberInput({
  value,
  onChange,
  disabled,
  step = 100000,
  min = 0,
  className = '',
}: {
  value: number
  onChange: (val: number) => void
  disabled?: boolean
  step?: number
  min?: number
  className?: string
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [rawText, setRawText] = useState(String(value))

  useEffect(() => {
    if (!isEditing) {
      setRawText(String(value))
    }
  }, [value, isEditing])

  const handleBlur = () => {
    setIsEditing(false)
    const parsed = parseInt(rawText.replace(/\D/g, ''), 10) || 0
    onChange(Math.max(min, parsed))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur()
    }
  }

  return (
    <div className={`relative inline-flex items-center group ${className}`}>
      {isEditing ? (
        <input
          type="text"
          autoFocus
          value={rawText}
          disabled={disabled}
          onChange={(e) => setRawText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-32 rounded-lg border-2 border-[#2F6FA8] bg-white px-2.5 py-1 text-right font-mono text-sm font-bold text-[#001D3D] outline-none shadow-xs"
        />
      ) : (
        <div
          onClick={() => !disabled && setIsEditing(true)}
          className={`flex items-center justify-end gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 bg-white hover:border-[#2F6FA8] hover:bg-blue-50/30 transition cursor-pointer ${
            disabled ? 'opacity-60 cursor-not-allowed bg-gray-100' : ''
          }`}
          title="Nhấp để sửa số tiền"
        >
          <span className="font-mono text-sm font-bold tabular-nums text-[#001D3D]">
            {formatVnd(value)}
          </span>
        </div>
      )}

      {/* Nút tăng/giảm nhanh khi hover */}
      {!disabled && !isEditing && (
        <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(Math.max(min, value - step))
            }}
            className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition text-[10px]"
            title={`Giảm -${formatVnd(step)}`}
          >
            <Minus size={11} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(value + step)
            }}
            className="p-1 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 transition text-[10px]"
            title={`Tăng +${formatVnd(step)}`}
          >
            <Plus size={11} />
          </button>
        </div>
      )}
    </div>
  )
}

// Đúng 2 Gói Mẫu Cốt Lõi Theo Yêu Cầu: Chuỗi Trà Sữa & Mô Hình Takeaway
const PRESETS = [
  {
    id: 'preset_milktea',
    name: 'Chuỗi Trà Sữa',
    subtitle: 'Đầy đủ quầy Barista, Thu ngân & Phục vụ bàn',
    badge: 'Mô hình Chuỗi',
    grades: [
      { name: 'Pha chế (Barista)', base: 5500000, min: 4800000, max: 6800000, kpi: 600000 },
      { name: 'Thu ngân (Cashier)', base: 5200000, min: 4680000, max: 6200000, kpi: 500000 },
      { name: 'Phục vụ & Tiếp thực', base: 4800000, min: 4680000, max: 5800000, kpi: 400000 },
      { name: 'Trưởng ca (Shift Leader)', base: 8000000, min: 7200000, max: 10000000, kpi: 1500000 },
      { name: 'Cửa hàng trưởng (SM)', base: 12500000, min: 11000000, max: 16000000, kpi: 2500000 },
    ],
    fnb: { meal: 30000, open: 0, close: 40000, split: 0, night: 45000, tipRate: 0.8 },
  },
  {
    id: 'preset_takeaway',
    name: 'Mô Hình Takeaway',
    subtitle: 'Kiosk mang đi tinh gọn, kiêm nhiệm linh hoạt',
    badge: 'Kiosk mang đi',
    grades: [
      { name: 'Pha chế kiêm Thu ngân', base: 5300000, min: 4680000, max: 6500000, kpi: 500000 },
      { name: 'Nhân viên Phụ quầy', base: 4800000, min: 4680000, max: 5800000, kpi: 400000 },
      { name: 'Quản lý điểm bán Kiosk', base: 8500000, min: 7500000, max: 11000000, kpi: 1500000 },
    ],
    fnb: { meal: 25000, open: 20000, close: 35000, split: 0, night: 40000, tipRate: 0.7 },
  },
]

function SettingsPayrollContent() {
  const { canManagePayroll, isCEO, role } = useSettingPermissions()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  const [activeTab, setActiveTab] = useState<MainTab>('core_salary')
  const [displayUnit, setDisplayUnit] = useState<'month' | 'hour'>('month')
  const [selectedGradeDetail, setSelectedGradeDetail] = useState<SalaryGrade | null>(null)

  const [policy, setPolicy] = useState<PayrollPolicy>(() => getStoredPayrollPolicy())
  const [history, setHistory] = useState(() => getStoredPayrollPolicyHistory())
  const [savedNotice, setSavedNotice] = useState<string | null>(null)
  const [stores, setStores] = useState(mockStores)
  const [, setRefreshKey] = useState(0)

  // Danh sách phụ cấp doanh nghiệp đang chọn áp dụng
  const [activeAllowanceKeys, setActiveAllowanceKeys] = useState<string[]>(() => {
    const initialKeys: string[] = []
    const fnb = policy.fnb
    if (fnb.mealAllowancePerShift > 0) initialKeys.push('mealAllowancePerShift')
    if (fnb.closingShiftAllowance > 0) initialKeys.push('closingShiftAllowance')
    if (fnb.nightShiftAllowance > 0) initialKeys.push('nightShiftAllowance')
    if (fnb.openingShiftAllowance > 0) initialKeys.push('openingShiftAllowance')
    if (fnb.splitShiftAllowance > 0) initialKeys.push('splitShiftAllowance')
    if (fnb.peakHourBonus > 0) initialKeys.push('peakHourBonus')
    
    if (initialKeys.length === 0) return ['mealAllowancePerShift', 'closingShiftAllowance']
    return initialKeys
  })
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Simulator State
  const [simRole, setSimRole] = useState<string>('Pha chế')
  const [simType, setSimType] = useState<'part_time' | 'full_time'>('part_time')
  const [simHours, setSimHours] = useState<number>(130)
  const [simDays, setSimDays] = useState<number>(24)
  const [simOtHours, setSimOtHours] = useState<number>(6)
  const [simCloseShifts, setSimCloseShifts] = useState<number>(8)
  const [simKpiPercent, setSimKpiPercent] = useState<number>(100)

  useEffect(() => {
    fetchRemotePayrollPolicy().then(dbPolicy => {
      if (dbPolicy) {
        setPolicy(dbPolicy)
        saveStoredPayrollPolicy(dbPolicy)
      }
    })
  }, [])

  useEffect(() => {
    setStores(mockStores)
  }, [])

  useEffect(() => {
    if (tabParam === 'history') setActiveTab('history')
    else if (tabParam === 'fnb' || tabParam === 'allowances' || tabParam === 'tickets') setActiveTab('fnb_perks')
    else if (tabParam === 'insurance' || tabParam === 'budgets' || tabParam === 'warnings' || tabParam === 'seasons') setActiveTab('compliance_budget')
  }, [tabParam])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const canEdit = canManagePayroll

  const savePolicy = async (nextPolicy: PayrollPolicy, notice: string) => {
    const rawDays = Number(nextPolicy.standardDaysPerMonth)
    const standardDaysPerMonth = (!rawDays || isNaN(rawDays) || rawDays <= 0) ? 26 : Math.min(rawDays, 31)

    const rawHours = Number(nextPolicy.standardHoursPerDay)
    const standardHoursPerDay = (!rawHours || isNaN(rawHours) || rawHours <= 0) ? 8 : Math.min(rawHours, 24)

    const rawThreshold = Number(nextPolicy.partTimeOvertimeThresholdHours)
    const partTimeOvertimeThresholdHours = (!rawThreshold || isNaN(rawThreshold) || rawThreshold <= 0) ? 8 : Math.min(rawThreshold, 24)

    const rawMultiplier = Number(nextPolicy.partTimeOvertimeMultiplier)
    const partTimeOvertimeMultiplier = (!rawMultiplier || isNaN(rawMultiplier) || rawMultiplier <= 0) ? 1.5 : Math.min(rawMultiplier, 5)

    const cleanedPolicy: PayrollPolicy = {
      ...nextPolicy,
      standardDaysPerMonth,
      standardHoursPerDay,
      partTimeOvertimeEnabled: Boolean(nextPolicy.partTimeOvertimeEnabled),
      partTimeOvertimeThresholdHours,
      partTimeOvertimeMultiplier,
    }

    const nextHistory = recordPayrollPolicyChange(cleanedPolicy, notice)
    const success = await syncRemotePayrollPolicy(cleanedPolicy)
    if (success) {
      setPolicy(cleanedPolicy)
      setHistory(nextHistory)
      saveStoredPayrollPolicy(cleanedPolicy)
      setSavedNotice('Đã lưu cấu hình lên hệ thống. Các máy khác sẽ dùng cùng cấu hình này.')
      setTimeout(() => setSavedNotice(null), 5000)
    } else {
      setSavedNotice('Lỗi: Không thể lưu lên hệ thống. Vui lòng thử lại sau.')
      setTimeout(() => setSavedNotice(null), 5000)
    }
  }

  // Áp dụng Preset mẫu 1-click gọn nhẹ
  const handleApplyPreset = (presetId: string) => {
    if (!canEdit) return
    const preset = PRESETS.find(p => p.id === presetId)
    if (!preset) return

    const updatedGrades = policy.grades.map(grade => {
      const match = preset.grades.find(g => grade.name.toLowerCase().includes(g.name.toLowerCase().slice(0, 4)))
      if (match) {
        return {
          ...grade,
          base_salary: match.base,
          minSalary: match.min,
          maxSalary: match.max,
          kpiPool: match.kpi,
          probation: Math.round(match.base * policy.rates.probation),
          status: match.base >= MIN_REGION_1_SALARY ? 'Đạt sàn vùng I' : 'Cần kiểm tra',
        }
      }
      return grade
    })

    const updatedFnb = {
      ...policy.fnb,
      mealAllowancePerShift: preset.fnb.meal,
      openingShiftAllowance: preset.fnb.open,
      closingShiftAllowance: preset.fnb.close,
      splitShiftAllowance: preset.fnb.split,
      nightShiftAllowance: preset.fnb.night,
      tipPoolRate: preset.fnb.tipRate,
    }

    const presetKeys = Object.entries(preset.fnb)
      .filter(([k, v]) => typeof v === 'number' && v > 0 && k !== 'tipRate')
      .map(([k]) => k)
    setActiveAllowanceKeys(presetKeys.length > 0 ? presetKeys : ['mealAllowancePerShift', 'closingShiftAllowance'])

    const nextPolicy: PayrollPolicy = {
      ...policy,
      version: `${policy.version.split('-')[0] || 'VN'}-Mẫu-${preset.name.split(' ')[0]}`,
      grades: updatedGrades,
      fnb: updatedFnb,
      status: 'draft',
      updatedBy: role === 'ceo' ? 'CEO' : 'HR Manager',
      updatedAt: new Date().toLocaleString('vi-VN'),
    }

    savePolicy(nextPolicy, `Đã áp dụng mẫu cấu hình: ${preset.name}`)
  }

  const updateGrade = (gradeId: string, field: keyof Pick<SalaryGrade, 'base_salary' | 'minSalary' | 'maxSalary' | 'kpiPool'>, value: number) => {
    if (!canEdit) return
    setPolicy(current => ({
      ...current,
      status: current.status === 'active' ? 'draft' : current.status,
      grades: current.grades.map(grade => {
        if (grade.id !== gradeId) return grade
        const next = { ...grade, [field]: value }
        return {
          ...next,
          probation: Math.round(next.base_salary * current.rates.probation),
          status: next.base_salary >= MIN_REGION_1_SALARY ? 'Đạt sàn vùng I' : 'Cần kiểm tra',
        }
      }),
    }))
  }

  const updateFnb = (field: keyof PayrollPolicy['fnb'], value: number | boolean) => {
    if (!canEdit) return
    setPolicy(current => ({
      ...current,
      status: current.status === 'active' ? 'draft' : current.status,
      fnb: { ...current.fnb, [field]: value },
    }))
  }

  const handleAddAllowance = (item: AllowanceCatalogItem) => {
    if (!canEdit) return
    if (!activeAllowanceKeys.includes(item.key)) {
      setActiveAllowanceKeys(prev => [...prev, item.key])
      if (item.field) {
        updateFnb(item.field, item.defaultAmount)
      }
    }
    setIsDropdownOpen(false)
  }

  const handleRemoveAllowance = (key: string) => {
    if (!canEdit) return
    setActiveAllowanceKeys(prev => prev.filter(k => k !== key))
    const item = ALLOWANCE_CATALOG.find(i => i.key === key)
    if (item?.field) {
      updateFnb(item.field, 0)
    }
  }

  const updateRate = (field: keyof PayrollPolicy['rates'], value: number) => {
    if (!canEdit) return
    setPolicy(current => ({
      ...current,
      status: current.status === 'active' ? 'draft' : current.status,
      rates: { ...current.rates, [field]: value },
      grades: current.grades.map(grade => ({
        ...grade,
        probation: Math.round(grade.base_salary * (field === 'probation' ? value : current.rates.probation)),
      })),
    }))
  }

  const handleSaveDraft = () => {
    savePolicy({
      ...policy,
      status: 'draft',
      updatedBy: role === 'ceo' ? 'CEO' : 'HR Admin',
      updatedAt: new Date().toLocaleString('vi-VN'),
    }, 'Đã lưu nháp bảng cấu hình lương.')
  }

  const handleSendApproval = () => {
    savePolicy({
      ...policy,
      status: 'pending_ceo',
      updatedBy: 'HR Admin',
      updatedAt: new Date().toLocaleString('vi-VN'),
    }, 'Đã chuyển trạng thái sang Chờ CEO phê duyệt.')
  }

  const handleApprove = () => {
    savePolicy({
      ...policy,
      status: 'active',
      updatedBy: 'CEO',
      updatedAt: new Date().toLocaleString('vi-VN'),
    }, 'CEO đã phê duyệt và chính thức áp dụng bảng lương.')
  }

  const handleRollback = (version: string) => {
    if (!isCEO) return
    const rollback = rollbackPayrollPolicy(version, 'CEO')
    if (rollback) {
      setPolicy(rollback)
      setHistory(getStoredPayrollPolicyHistory())
      setSavedNotice(`Đã khôi phục về phiên bản ${version}.`)
    }
  }

  // Simulator Calculation Logic
  const simResult = useMemo(() => {
    const selectedGrade = policy.grades.find(g => g.name.toLowerCase().includes(simRole.toLowerCase())) || policy.grades[0]
    const baseSal = selectedGrade ? selectedGrade.base_salary : 5000000
    const kpiMax = selectedGrade ? selectedGrade.kpiPool : 600000

    const stdDays = (typeof policy.standardDaysPerMonth === 'number' && policy.standardDaysPerMonth > 0) ? policy.standardDaysPerMonth : 26
    const stdHours = (typeof policy.standardHoursPerDay === 'number' && policy.standardHoursPerDay > 0) ? policy.standardHoursPerDay : 8
    const stdTotalHours = stdDays * stdHours

    if (simType === 'part_time') {
      const hourlyRate = Math.round(baseSal / stdTotalHours)
      const basePay = hourlyRate * simHours
      const otPay = Math.round(hourlyRate * simOtHours * policy.rates.otWeekday)
      const mealPay = policy.fnb.mealAllowancePerShift * Math.round(simHours / 6)
      const closePay = policy.fnb.closingShiftAllowance * simCloseShifts
      const kpiPay = Math.round((kpiMax * (simKpiPercent / 100)) * (simHours / 160))
      const total = basePay + otPay + mealPay + closePay + kpiPay

      return {
        hourlyRate,
        basePay,
        otPay,
        mealPay,
        closePay,
        kpiPay,
        insurance: 0,
        pit: 0,
        netTotal: total,
      }
    } else {
      const dailyRate = Math.round(baseSal / stdDays)
      const hourlyRate = Math.round(dailyRate / stdHours)
      const basePay = Math.round((baseSal / stdDays) * simDays)
      const otPay = Math.round(hourlyRate * simOtHours * policy.rates.otWeekday)
      const mealPay = policy.fnb.mealAllowancePerShift * simDays
      const closePay = policy.fnb.closingShiftAllowance * simCloseShifts
      const kpiPay = Math.round(kpiMax * (simKpiPercent / 100))
      const gross = basePay + otPay + mealPay + closePay + kpiPay

      const insBase = Math.min(baseSal, 29800000)
      const insRate = policy.rates.bhxhEmployee + policy.rates.bhytEmployee + policy.rates.bhtnEmployee
      const insurance = Math.round(insBase * insRate)
      const taxable = Math.max(0, gross - insurance - 11000000)
      const pit = taxable > 0 ? Math.round(taxable * policy.rates.taxBracket1) : 0
      const netTotal = gross - insurance - pit

      return {
        hourlyRate,
        basePay,
        otPay,
        mealPay,
        closePay,
        kpiPay,
        insurance,
        pit,
        netTotal,
      }
    }
  }, [policy, simRole, simType, simHours, simDays, simOtHours, simCloseShifts, simKpiPercent])

  // Danh sách vị trí
  const displayGrades = policy.grades

  // Lọc danh sách tiêu chí chưa thêm vào (Dropdown)
  const availableAllowancesToAdd = useMemo(() => {
    return ALLOWANCE_CATALOG.filter(item => !activeAllowanceKeys.includes(item.key))
  }, [activeAllowanceKeys])

  const activePolicy = getActivePayrollPolicy()
  const policyDiffs = comparePayrollPolicies(activePolicy, policy)

  const standardDays = (typeof policy.standardDaysPerMonth === 'number' && policy.standardDaysPerMonth > 0)
    ? policy.standardDaysPerMonth
    : 26
  const standardHours = (typeof policy.standardHoursPerDay === 'number' && policy.standardHoursPerDay > 0)
    ? policy.standardHoursPerDay
    : 8
  const standardTotalHours = standardDays * standardHours

  return (
    <AppShell title="Cấu hình lương & Chế độ">
      <div className="w-full min-h-screen bg-[#FFF8E8] pb-12 font-sans">
        
        {/* ========================================================================= */}
        {/* TẦNG 1: EXECUTIVE COMMAND HEADER (Sticky Top, Tích Hợp Chọn Mẫu Tiết Kiệm Không Gian) */}
        {/* ========================================================================= */}
        <div className="sticky top-0 z-30 w-full border-b border-gray-100 bg-white px-4 py-3 shadow-2xs sm:px-6 lg:px-8">
          <div className="flex w-full flex-col justify-between gap-3 lg:flex-row lg:items-center">
            {/* Trái: Breadcrumb + Tiêu đề + Trạng thái */}
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <span>HRM Homies</span>
                <ChevronRight size={12} className="text-gray-400" />
                <span>Cài Đặt Hệ Thống</span>
                <ChevronRight size={12} className="text-gray-400" />
                <span className="font-bold text-[#2F6FA8]">Cấu Hình Lương F&amp;B</span>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-lg font-bold tracking-tight text-[#001D3D] sm:text-xl">
                  Bảng Cấu Hình Lương &amp; Chế Độ Chuỗi
                </h1>
                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                  policy.status === 'active'
                    ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                    : policy.status === 'pending_ceo'
                    ? 'border border-amber-200 bg-amber-50 text-amber-800'
                    : 'border border-gray-200 bg-gray-50 text-gray-700'
                }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                  {policy.status === 'active' ? 'Đang Áp Dụng' : policy.status === 'pending_ceo' ? 'Chờ CEO Phê Duyệt' : 'Bản Nháp'}
                </span>
                <span className="text-xs font-medium text-gray-400">
                  Phiên bản: <strong className="font-mono text-gray-700">{policy.version}</strong>
                </span>
              </div>
            </div>

            {/* Phải: Cụm Chọn Mẫu Chuẩn Gọn Nhẹ + Phím Thao Tác CEO */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Nút Chọn Mẫu Chuẩn Gọn Gàng (Tiết kiệm không gian) */}
              <div className="flex items-center gap-1 bg-gray-100/90 p-1 rounded-xl text-xs border border-gray-200/60">
                <span className="text-[11px] font-bold text-gray-500 px-1.5 flex items-center gap-1">
                  <Sparkles size={13} className="text-[#2F6FA8]" /> Mẫu chuẩn:
                </span>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleApplyPreset('preset_milktea')}
                  className="px-2.5 py-1 rounded-lg bg-white font-bold text-gray-800 shadow-2xs hover:text-[#2F6FA8] hover:bg-blue-50/50 transition cursor-pointer text-xs disabled:opacity-50"
                  title="Mô hình chuỗi trà sữa đầy đủ Barista, Thu ngân, Tiếp thực, Quản lý"
                >
                  Chuỗi Trà Sữa
                </button>
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={() => handleApplyPreset('preset_takeaway')}
                  className="px-2.5 py-1 rounded-lg bg-white font-bold text-gray-800 shadow-2xs hover:text-[#2F6FA8] hover:bg-blue-50/50 transition cursor-pointer text-xs disabled:opacity-50"
                  title="Mô hình Kiosk / Điểm bán Takeaway mang đi tinh gọn"
                >
                  Mô Hình Takeaway
                </button>
              </div>

              <button
                type="button"
                disabled={!canEdit}
                onClick={handleSaveDraft}
                className="flex min-h-[34px] items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 shadow-xs transition hover:bg-gray-50 disabled:opacity-50"
              >
                Lưu Nháp
              </button>

              {policy.status !== 'pending_ceo' && (
                <button
                  type="button"
                  disabled={!canEdit}
                  onClick={handleSendApproval}
                  className="flex min-h-[34px] items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-xs transition hover:bg-amber-100 disabled:opacity-50"
                >
                  <Sparkles size={13} className="text-amber-600" />
                  <span>Gửi CEO Duyệt</span>
                </button>
              )}

              <button
                type="button"
                disabled={!isCEO || policy.status !== 'pending_ceo'}
                onClick={handleApprove}
                className="flex min-h-[34px] items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCircle2 size={13} />
                <span>CEO Phê Duyệt</span>
              </button>
            </div>
          </div>

          {savedNotice && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 animate-in fade-in">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <span>{savedNotice}</span>
            </div>
          )}
        </div>

        <div className="w-full px-4 sm:px-6 lg:px-8 mt-4 space-y-4">

          {/* ========================================================================= */}
          {/* TẦNG 2: DẢI 4 THẺ CHỈ SỐ VĨ MÔ (Macro KPI Cards - Đưa Lên Đầu Rất Thoáng) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Ngân Sách Tháng */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Hạn Mức Quỹ Lương Chuỗi</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#2F6FA8]">
                  <Banknote size={18} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-[#001D3D]">
                  {formatVnd(settingsPayroll.payroll_budget.monthly_budget)}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                Khóa chốt số liệu sau <strong className="text-gray-800">Ngày {settingsPayroll.payroll_budget.auto_lock_day}</strong> hàng tháng
              </p>
            </div>

            {/* Card 2: Cơ Cấu Nhân Sự F&B */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Cơ Cấu Lương Mục Tiêu</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <Coffee size={18} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-[#001D3D]">
                  75% <span className="text-xs font-normal text-gray-500">Part-time</span>
                </span>
                <span className="text-xs font-semibold text-gray-400">/ 25% FT</span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-emerald-700">
                Tối ưu chi phí theo giờ mở ca linh hoạt
              </p>
            </div>

            {/* Card 3: Tuân Thủ Luật Lương */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Sàn Lương Vùng I (2026)</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <ShieldCheck size={18} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-emerald-700">
                  {formatVnd(MIN_REGION_1_SALARY)}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 size={12} /> 100% vị trí đạt chuẩn tối thiểu
              </p>
            </div>

            {/* Card 4: Gói Phúc Lợi Tuyến Đầu */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Tiêu Chí Phụ Cấp Đang Bật</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                  <Utensils size={18} />
                </div>
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="font-mono text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-[#001D3D]">
                  {activeAllowanceKeys.length} <span className="text-xs font-normal text-gray-500">khoản phụ cấp</span>
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium text-gray-500">
                Chia <strong className="text-amber-800">{formatPercent(policy.fnb.tipPoolRate)}</strong> Tip trực tiếp cho nhân viên ca
              </p>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* TẦNG 3: THANH TAB CHÍNH & TỶ LỆ VÀNG (2/3 NỘI DUNG + 1/3 LIVE SIMULATOR) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            
            {/* CỘT CHÍNH (8/12 - Chiếm ~2/3 Màn Hình) */}
            <div className="space-y-4 lg:col-span-8">
              
              {/* Thanh Điều Hướng 4 Tab Tinh Gọn */}
              <div className="flex items-center justify-between rounded-2xl border border-gray-100 bg-white p-1.5 shadow-xs overflow-x-auto">
                <div className="flex items-center gap-1.5 min-w-max">
                  <button
                    type="button"
                    onClick={() => setActiveTab('core_salary')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                      activeTab === 'core_salary'
                        ? 'bg-[#2F6FA8] text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <SlidersHorizontal size={15} />
                    <span>1. Khung Lương Theo Vị Trí</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('fnb_perks')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                      activeTab === 'fnb_perks'
                        ? 'bg-[#2F6FA8] text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Utensils size={15} />
                    <span>2. Chế Độ &amp; Phụ Cấp F&amp;B</span>
                    {activeAllowanceKeys.length > 0 && (
                      <span className="rounded-full bg-blue-100 text-[#2F6FA8] px-2 py-0.5 text-[10px] font-bold">
                        {activeAllowanceKeys.length}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('compliance_budget')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                      activeTab === 'compliance_budget'
                        ? 'bg-[#2F6FA8] text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Landmark size={15} />
                    <span>3. Ngân Sách &amp; Bảo Hiểm</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition ${
                      activeTab === 'history'
                        ? 'bg-[#2F6FA8] text-white shadow-xs'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <FileClock size={15} />
                    <span>Lịch Sử &amp; So Sánh</span>
                    {policyDiffs.length > 0 && (
                      <span className="rounded-full bg-amber-400 px-1.5 py-0.2 text-[10px] font-black text-slate-900">
                        {policyDiffs.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* ------------------------------------------------------------------- */}
              {/* TAB 1: KHUNG LƯƠNG THEO VỊ TRÍ (CORE SALARY) */}
              {/* ------------------------------------------------------------------- */}
              {activeTab === 'core_salary' && (
                <div className="space-y-4">
                  {/* Cảnh báo ghi nhớ nghiệp vụ */}
                  <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                    <Info size={16} className="text-amber-700 shrink-0 mt-0.5" />
                    <div>
                      <strong>Lưu ý nghiệp vụ:</strong> Bảng mức lương cơ bản ở tab này là khung chuẩn của chuỗi dùng để tham chiếu, tuyển dụng và chạy mô phỏng. Khi tính lương thực tế hàng tháng, hệ thống sẽ đọc mức lương thỏa thuận trong hồ sơ nhân sự (<code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono text-[11px]">nhan_vien.muc_luong_co_ban</code>).
                    </div>
                  </div>

                  {/* Bảng Dữ Liệu Khung Lương Chuẩn F&B */}
                  <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
                    {/* Header Bảng + Đổi Đơn Vị Hiển Thị */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-100 bg-gray-50/50">
                      <div>
                        <h2 className="text-sm font-bold text-[#001D3D] flex items-center gap-2">
                          <span>Bảng Mức Lương Cơ Bản Theo Chức Danh</span>
                          <span className="text-xs font-normal text-gray-500">({policy.grades.length} vị trí)</span>
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">Nhấp vào ô số tiền để chỉnh sửa trực tiếp hoặc nhấp dòng để xem chi tiết</p>
                      </div>

                      {/* Nút Đổi Đơn Vị Hiển Thị: Theo tháng / Theo giờ */}
                      <div className="flex items-center gap-1 rounded-xl bg-gray-200/60 p-1 text-xs">
                        <button
                          type="button"
                          onClick={() => setDisplayUnit('month')}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition ${
                            displayUnit === 'month' ? 'bg-white text-[#2F6FA8] shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Briefcase size={13} />
                          <span>Theo tháng</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDisplayUnit('hour')}
                          className={`flex items-center gap-1 px-3 py-1 rounded-lg font-bold transition ${
                            displayUnit === 'hour' ? 'bg-white text-[#2F6FA8] shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                          }`}
                        >
                          <Clock size={13} />
                          <span>Theo giờ</span>
                        </button>
                      </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-gray-50/80 text-gray-600 font-bold border-b border-gray-100">
                            <th className="py-3.5 px-4 text-[#001D3D]">Vị Trí</th>
                            <th className="py-3.5 px-3 text-center">Bậc</th>
                            <th className="py-3.5 px-4 text-right">
                              {displayUnit === 'month'
                                ? 'Lương Cơ Bản (Tháng)'
                                : `Đơn Giá Giờ (~${standardDays}×${standardHours}h)`}
                            </th>
                            <th className="py-3.5 px-4 text-right">Quỹ Thưởng KPI</th>
                            {displayUnit === 'month' && (
                              <th className="py-3.5 px-3 text-center">Sàn Vùng I</th>
                            )}
                            <th className="py-3.5 px-3 text-center">Thao Tác</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {displayGrades.map((grade) => {
                            const estHourly = Math.round(grade.base_salary / standardTotalHours)
                            const isAboveMin = grade.base_salary >= MIN_REGION_1_SALARY

                            return (
                              <tr
                                key={grade.id}
                                onClick={() => setSelectedGradeDetail(grade)}
                                className="hover:bg-primary-50/30 transition-all cursor-pointer group"
                              >
                                <td className="py-4 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2F6FA8]/10 text-[#2F6FA8] font-bold text-xs">
                                      {grade.name.slice(0, 1)}
                                    </div>
                                    <div>
                                      <span className="font-bold text-gray-900 block group-hover:text-[#2F6FA8] transition text-sm">
                                        {grade.name}
                                      </span>
                                      <span className="text-[11px] text-gray-400 font-medium">{grade.band}</span>
                                    </div>
                                  </div>
                                </td>

                                <td className="py-4 px-3 text-center">
                                  <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-gray-100 text-gray-700 border border-gray-200">
                                    Bậc {grade.level}
                                  </span>
                                </td>

                                <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  {displayUnit === 'month' ? (
                                    <div className="flex flex-col items-end">
                                      <MoneyNumberInput
                                        value={grade.base_salary}
                                        step={100000}
                                        disabled={!canEdit}
                                        onChange={(val) => updateGrade(grade.id, 'base_salary', val)}
                                      />
                                      <span
                                        className="text-[11px] text-gray-400 font-mono mt-0.5 cursor-help select-none"
                                        title={`Công thức quy đổi: ${formatVnd(grade.base_salary)} ÷ ${standardDays} ngày ÷ ${standardHours} h = ${formatVnd(estHourly)}/h`}
                                      >
                                        ≈ {formatVnd(estHourly)}/h
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-end">
                                      <MoneyNumberInput
                                        value={estHourly}
                                        step={1000}
                                        disabled={!canEdit}
                                        onChange={(val) => {
                                          if (Math.round(grade.base_salary / standardTotalHours) === val) return
                                          updateGrade(grade.id, 'base_salary', Math.round(val * standardTotalHours))
                                        }}
                                      />
                                      <span
                                        className="text-[11px] text-gray-400 font-mono mt-0.5 cursor-help select-none"
                                        title={`Công thức quy đổi: ${formatVnd(estHourly)}/h × ${standardDays} ngày × ${standardHours} h = ${formatVnd(grade.base_salary)}/tháng`}
                                      >
                                        ≈ {formatVnd(grade.base_salary)}/tháng
                                      </span>
                                    </div>
                                  )}
                                </td>

                                <td className="py-4 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                                  <MoneyNumberInput
                                    value={grade.kpiPool}
                                    step={50000}
                                    disabled={!canEdit}
                                    onChange={(val) => updateGrade(grade.id, 'kpiPool', val)}
                                  />
                                </td>

                                {displayUnit === 'month' && (
                                  <td className="py-4 px-3 text-center">
                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                      isAboveMin ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                                    }`}>
                                      {isAboveMin ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                                      {isAboveMin ? 'Đạt sàn' : 'Dưới sàn'}
                                    </span>
                                  </td>
                                )}

                                <td className="py-4 px-3 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedGradeDetail(grade)}
                                    className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-bold text-xs hover:bg-[#2F6FA8] hover:text-white transition"
                                  >
                                    Chi tiết
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Footer tóm tắt bảng */}
                    <div className="flex flex-wrap items-center justify-between p-4 bg-gray-50/80 border-t border-gray-100 text-xs text-gray-500 font-medium">
                      <span>
                        Đội ngũ: <strong className="text-gray-800">{policy.grades.length} chức danh</strong>
                        {displayUnit === 'month' && (
                          <> • Mức sàn tối thiểu luật 2026 (Vùng I): <strong className="font-mono text-emerald-700">{formatVnd(MIN_REGION_1_SALARY)}/tháng</strong></>
                        )}
                      </span>
                      <span className="text-[#2F6FA8] font-bold flex items-center gap-1">
                        <Info size={14} /> Nhấp vào ô số tiền để chỉnh sửa hoặc nhấp dòng để xem bóc tách
                      </span>
                    </div>
                  </div>

                  {/* Khối: Thông số tính lương chung */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-[#001D3D] flex items-center gap-2">
                        <SlidersHorizontal size={16} className="text-[#2F6FA8]" />
                        <span>Thông số tính lương chung</span>
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">Cấu hình chuẩn ngày công, giờ làm việc và quy tắc tăng ca</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2">
                        <label className="text-xs font-bold text-gray-700 block">
                          Số ngày làm chuẩn trong tháng
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={31}
                          step={1}
                          disabled={!canEdit}
                          value={policy.standardDaysPerMonth ?? 26}
                          onChange={(e) => {
                            if (!canEdit) return
                            const val = parseFloat(e.target.value) || 0
                            setPolicy(current => ({
                              ...current,
                              status: current.status === 'active' ? 'draft' : current.status,
                              standardDaysPerMonth: val,
                            }))
                          }}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-mono font-bold text-[#001D3D] outline-hidden focus:border-[#2F6FA8] focus:ring-1 focus:ring-[#2F6FA8] disabled:bg-gray-100 disabled:text-gray-400"
                        />
                        <p className="text-[11px] text-gray-400">Mặc định: 26 ngày/tháng</p>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2">
                        <label className="text-xs font-bold text-gray-700 block">
                          Số giờ làm chuẩn mỗi ngày
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={24}
                          step={0.5}
                          disabled={!canEdit}
                          value={policy.standardHoursPerDay ?? 8}
                          onChange={(e) => {
                            if (!canEdit) return
                            const val = parseFloat(e.target.value) || 0
                            setPolicy(current => ({
                              ...current,
                              status: current.status === 'active' ? 'draft' : current.status,
                              standardHoursPerDay: val,
                            }))
                          }}
                          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-mono font-bold text-[#001D3D] outline-hidden focus:border-[#2F6FA8] focus:ring-1 focus:ring-[#2F6FA8] disabled:bg-gray-100 disabled:text-gray-400"
                        />
                        <p className="text-[11px] text-gray-400">Mặc định: 8 giờ/ngày</p>
                      </div>
                    </div>

                    <p className="text-xs text-gray-500 italic flex items-center gap-1.5">
                      <Info size={14} className="text-[#2F6FA8] shrink-0" />
                      <span>Dùng để quy đổi lương tháng thành đơn giá giờ.</span>
                    </p>

                    {/* Khối con: Tăng ca cho nhân viên bán thời gian */}
                    <div className={`rounded-xl border p-4 space-y-3 transition-colors ${
                      (policy.partTimeOvertimeEnabled ?? false)
                        ? 'border-blue-200 bg-blue-50/30'
                        : 'border-gray-200 bg-gray-50/50'
                    }`}>
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <span className="text-xs font-bold text-gray-900 block">
                            Tính tăng ca cho nhân viên bán thời gian
                          </span>
                          <span className="text-[11px] text-gray-500 block">
                            Áp dụng chế độ tính thêm phụ trội giờ làm cho nhân viên part-time
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => {
                            if (!canEdit) return
                            setPolicy(current => ({
                              ...current,
                              status: current.status === 'active' ? 'draft' : current.status,
                              partTimeOvertimeEnabled: !(current.partTimeOvertimeEnabled ?? false),
                            }))
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-hidden ${
                            (policy.partTimeOvertimeEnabled ?? false) ? 'bg-[#2F6FA8]' : 'bg-gray-300'
                          } ${!canEdit ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              (policy.partTimeOvertimeEnabled ?? false) ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </div>

                      <div className={`grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-gray-100 ${
                        !(policy.partTimeOvertimeEnabled ?? false) ? 'opacity-50 pointer-events-none' : ''
                      }`}>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700 block">
                            Số giờ mỗi ngày vượt quá thì tính tăng ca
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={24}
                            step={0.5}
                            disabled={!canEdit || !(policy.partTimeOvertimeEnabled ?? false)}
                            value={policy.partTimeOvertimeThresholdHours ?? 8}
                            onChange={(e) => {
                              if (!canEdit) return
                              const val = parseFloat(e.target.value) || 0
                              setPolicy(current => ({
                                ...current,
                                status: current.status === 'active' ? 'draft' : current.status,
                                partTimeOvertimeThresholdHours: val,
                              }))
                            }}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-mono font-bold text-[#001D3D] outline-hidden focus:border-[#2F6FA8] focus:ring-1 focus:ring-[#2F6FA8] disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-gray-700 block">
                            Nhân hệ số bao nhiêu lần
                          </label>
                          <input
                            type="number"
                            min={1}
                            max={5}
                            step={0.1}
                            disabled={!canEdit || !(policy.partTimeOvertimeEnabled ?? false)}
                            value={policy.partTimeOvertimeMultiplier ?? 1.5}
                            onChange={(e) => {
                              if (!canEdit) return
                              const val = parseFloat(e.target.value) || 0
                              setPolicy(current => ({
                                ...current,
                                status: current.status === 'active' ? 'draft' : current.status,
                                partTimeOvertimeMultiplier: val,
                              }))
                            }}
                            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-mono font-bold text-[#001D3D] outline-hidden focus:border-[#2F6FA8] focus:ring-1 focus:ring-[#2F6FA8] disabled:bg-gray-100 disabled:text-gray-400"
                          />
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-500 leading-relaxed bg-white/70 p-2.5 rounded-lg border border-gray-100">
                        Ví dụ: ngưỡng 8 giờ, hệ số 1,5 nghĩa là giờ thứ 9 trở đi được trả gấp 1,5 lần đơn giá giờ.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------------- */}
              {/* TAB 2: CHẾ ĐỘ & PHỤ CẤP F&B (CHUẨN SAAS DYNAMIC DROPDOWN SELECTION) */}
              {/* ------------------------------------------------------------------- */}
              {activeTab === 'fnb_perks' && (
                <div className="space-y-4">
                  {/* Card Phụ Cấp Đang Áp Dụng (Doanh nghiệp có cái gì thì add cái đó) */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                      <div>
                        <h3 className="text-sm font-bold text-[#001D3D] flex items-center gap-2">
                          <Coffee size={16} className="text-[#2F6FA8]" />
                          <span>Danh Sách Phụ Cấp Đang Áp Dụng ({activeAllowanceKeys.length})</span>
                        </h3>
                        <p className="text-xs text-gray-500">Chỉ hiển thị các tiêu chí doanh nghiệp của bạn thực tế sử dụng</p>
                      </div>

                      {/* Nút Dropdown Thêm Phụ Cấp Chuẩn SaaS */}
                      <div className="relative" ref={dropdownRef}>
                        <button
                          type="button"
                          disabled={!canEdit || availableAllowancesToAdd.length === 0}
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="flex items-center gap-2 rounded-xl bg-[#2F6FA8] px-3.5 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#1D3E61] disabled:opacity-50 cursor-pointer"
                        >
                          <Plus size={14} />
                          <span>Thêm Tiêu Chí Phụ Cấp</span>
                          <ChevronDown size={14} className={`transition ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Menu Dropdown Chọn Tiêu Chí */}
                        {isDropdownOpen && (
                          <div className="absolute right-0 mt-1.5 w-72 sm:w-80 rounded-2xl border border-gray-100 bg-white p-2 shadow-xl z-20 animate-in fade-in">
                            <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100 mb-1">
                              Chọn phụ cấp từ thư viện F&amp;B:
                            </div>
                            <div className="max-h-64 overflow-y-auto space-y-1">
                              {availableAllowancesToAdd.map(item => (
                                <button
                                  key={item.key}
                                  type="button"
                                  onClick={() => handleAddAllowance(item)}
                                  className="w-full flex items-start justify-between p-2.5 rounded-xl text-left hover:bg-blue-50/50 transition group cursor-pointer"
                                >
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-bold text-gray-900 group-hover:text-[#2F6FA8] block">
                                      {item.label}
                                    </span>
                                    <span className="text-[11px] text-gray-500 line-clamp-1 block">
                                      {item.note}
                                    </span>
                                  </div>
                                  <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md shrink-0 ml-2">
                                    +{formatVnd(item.defaultAmount)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Danh Sách Các Tiêu Chí Đang Hoạt Động (Nếu không có thì hiện empty state) */}
                    {activeAllowanceKeys.length === 0 ? (
                      <div className="py-8 text-center space-y-2">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
                          <Utensils size={24} />
                        </div>
                        <p className="text-xs font-bold text-gray-700">Chưa kích hoạt tiêu chí phụ cấp nào</p>
                        <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                          Bấm nút &quot;Thêm Tiêu Chí Phụ Cấp&quot; ở trên để chọn Cơm ca, Ca mở/đóng cửa hoặc Thưởng cao điểm.
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        {activeAllowanceKeys.map((key) => {
                          const item = ALLOWANCE_CATALOG.find(i => i.key === key)
                          if (!item) return null

                          const currentAmount = item.field
                            ? (policy.fnb[item.field] as number) || item.defaultAmount
                            : item.defaultAmount

                          return (
                            <div key={item.key} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 space-y-2.5 relative group hover:border-[#2F6FA8]/40 hover:bg-white transition">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-xs font-bold text-gray-900 block">{item.label}</span>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveAllowance(item.key)}
                                    className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                    title="Gỡ bỏ tiêu chí này"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1">
                                <MoneyNumberInput
                                  value={currentAmount}
                                  step={5000}
                                  disabled={!canEdit}
                                  onChange={(val) => {
                                    if (item.field) updateFnb(item.field, val)
                                  }}
                                />
                                <span className="text-xs font-medium text-gray-500">{item.unit}</span>
                              </div>

                              <p className="text-[11px] text-gray-500 leading-4">{item.note}</p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Quỹ Tip & Service Charge */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                    <h3 className="text-sm font-bold text-[#001D3D] mb-1 flex items-center gap-2">
                      <Coins size={16} className="text-amber-600" />
                      <span>Cơ Chế Phân Bổ Tiền Tip &amp; Phí Dịch Vụ</span>
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">Quy tắc chia quỹ minh bạch cho nhân viên phục vụ và pha chế</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-800">Tỷ lệ chia Tip cho Nhân viên tuyến đầu</span>
                          <span className="font-mono text-base font-bold text-amber-800">{formatPercent(policy.fnb.tipPoolRate)}</span>
                        </div>
                        <input
                          type="range"
                          min={0.1}
                          max={1}
                          step={0.05}
                          disabled={!canEdit}
                          value={policy.fnb.tipPoolRate}
                          onChange={(e) => updateFnb('tipPoolRate', parseFloat(e.target.value))}
                          className="w-full accent-amber-600 cursor-pointer"
                        />
                        <p className="text-[11px] text-gray-500">Khuyên dùng: 70% - 80% cho khối cửa hàng trực tiếp.</p>
                      </div>

                      <div className="rounded-xl border border-blue-200/80 bg-blue-50/40 p-4 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-800">Thưởng Lễ Tết &amp; Mùa vụ</span>
                          <span className="font-mono text-base font-bold text-[#2F6FA8]">+{formatPercent(policy.fnb.holidayPeakBonusRate)} Lương</span>
                        </div>
                        <input
                          type="range"
                          min={0.2}
                          max={2}
                          step={0.1}
                          disabled={!canEdit}
                          value={policy.fnb.holidayPeakBonusRate}
                          onChange={(e) => updateFnb('holidayPeakBonusRate', parseFloat(e.target.value))}
                          className="w-full accent-[#2F6FA8] cursor-pointer"
                        />
                        <p className="text-[11px] text-gray-500">Cộng thêm vào lương giờ khi làm việc các ngày lễ quốc gia.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------------- */}
              {/* TAB 3: NGÂN SÁCH & BẢO HIỂM (BUDGET & COMPLIANCE) */}
              {/* ------------------------------------------------------------------- */}
              {activeTab === 'compliance_budget' && (
                <div className="space-y-4">
                  {/* Ngân Sách Theo Chi Nhánh */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                    <h3 className="text-sm font-bold text-[#001D3D] mb-1 flex items-center gap-2">
                      <Store size={16} className="text-[#2F6FA8]" />
                      <span>Hạn Mức Ngân Sách Lương Tuần Theo Chi Nhánh</span>
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">Hệ thống sẽ phát cảnh báo vàng/đỏ cho Quản lý khi xếp ca vượt quá hạn mức này</p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {stores.filter(s => s.is_active).map(store => {
                        const budget = laborBudgets.find(b => b.store_id === store.id)
                        return (
                          <div key={store.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-gray-900">{store.name}</span>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                Hoạt động
                              </span>
                            </div>
                            <div>
                              <label className="text-[11px] font-medium text-gray-500 block mb-1.5">Ngân sách tuần</label>
                              <MoneyNumberInput
                                value={budget?.weekly_budget || 20000000}
                                step={1000000}
                                disabled={!canEdit}
                                onChange={val => {
                                  updateStoreBudget(store.id, val)
                                  setRefreshKey(k => k + 1)
                                }}
                              />
                            </div>
                            <div className="text-xs text-gray-500 flex justify-between pt-1.5 border-t border-gray-200">
                              <span>Ước tính tháng:</span>
                              <strong className="font-mono text-sm text-gray-800">{formatVnd((budget?.weekly_budget || 20000000) * 4)}</strong>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Tỷ Lệ BHXH & Thuế */}
                  <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                    <h3 className="text-sm font-bold text-[#001D3D] mb-1 flex items-center gap-2">
                      <Landmark size={16} className="text-emerald-700" />
                      <span>Tỷ Lệ Đóng Bảo Hiểm &amp; Thuế Theo Luật 2026</span>
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">Áp dụng cho nhân viên ký hợp đồng chính thức Full-time</p>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-700">BHXH Nhân Viên</span>
                          <span className="font-mono text-sm font-bold text-[#001D3D]">{formatPercent(policy.rates.bhxhEmployee)}</span>
                        </div>
                        <input
                          type="number"
                          step={0.005}
                          disabled={!canEdit}
                          value={policy.rates.bhxhEmployee}
                          onChange={(e) => updateRate('bhxhEmployee', parseFloat(e.target.value) || 0.08)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-mono font-bold text-[#001D3D] outline-none"
                        />
                        <span className="text-[11px] text-gray-400 block">Khấu trừ lương đóng BH</span>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-700">BHYT Nhân Viên</span>
                          <span className="font-mono text-sm font-bold text-[#001D3D]">{formatPercent(policy.rates.bhytEmployee)}</span>
                        </div>
                        <input
                          type="number"
                          step={0.005}
                          disabled={!canEdit}
                          value={policy.rates.bhytEmployee}
                          onChange={(e) => updateRate('bhytEmployee', parseFloat(e.target.value) || 0.015)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-mono font-bold text-[#001D3D] outline-none"
                        />
                        <span className="text-[11px] text-gray-400 block">Khấu trừ lương đóng BH</span>
                      </div>

                      <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gray-700">BHTN Nhân Viên</span>
                          <span className="font-mono text-sm font-bold text-[#001D3D]">{formatPercent(policy.rates.bhtnEmployee)}</span>
                        </div>
                        <input
                          type="number"
                          step={0.005}
                          disabled={!canEdit}
                          value={policy.rates.bhtnEmployee}
                          onChange={(e) => updateRate('bhtnEmployee', parseFloat(e.target.value) || 0.01)}
                          className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-mono font-bold text-[#001D3D] outline-none"
                        />
                        <span className="text-[11px] text-gray-400 block">Khấu trừ lương đóng BH</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ------------------------------------------------------------------- */}
              {/* TAB 4: LỊCH SỬ & SO SÁNH PHIÊN BẢN */}
              {/* ------------------------------------------------------------------- */}
              {activeTab === 'history' && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#001D3D]">Lịch Sử Phiên Bản &amp; Đối Soát Thay Đổi</h3>
                      <p className="text-xs text-gray-500">Truy vết ai đã chỉnh sửa và khôi phục khi cần thiết</p>
                    </div>
                  </div>

                  {policyDiffs.length > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
                      <span className="text-xs font-bold text-amber-900 block">
                        Có {policyDiffs.length} điểm thay đổi so với phiên bản đang chạy:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {policyDiffs.map(d => (
                          <div key={`${d.group}-${d.label}`} className="rounded-lg bg-white p-2.5 text-xs border border-amber-200/60">
                            <span className="font-bold text-gray-800">{d.group}: {d.label}</span>
                            <div className="text-gray-500 text-[11px] mt-0.5 font-mono">
                              <span className="line-through text-rose-500">{d.before}</span> <ArrowRight size={11} className="inline mx-1 text-gray-400" /> <span className="text-emerald-700 font-bold">{d.after}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="divide-y divide-gray-100">
                    {history.map((log) => (
                      <div key={log.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs text-[#001D3D]">{log.version}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                              {log.status === 'active' ? 'Đã áp dụng' : log.status === 'pending_ceo' ? 'Chờ duyệt' : 'Bản nháp'}
                            </span>
                          </div>
                          <p className="text-xs font-medium text-gray-700 mt-1">{log.note}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">{log.updatedBy} • {log.updatedAt}</p>
                        </div>
                        {isCEO && (
                          <button
                            type="button"
                            onClick={() => handleRollback(log.version)}
                            className="self-start sm:self-center px-3 py-1 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition"
                          >
                            Khôi phục bản này
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* ========================================================================= */}
            {/* CỘT PHỤ (4/12 - Chiếm ~1/3 Màn Hình): BỘ MÔ PHỎNG TÍNH LƯƠNG TRỰC TIẾP */}
            {/* ========================================================================= */}
            <div className="space-y-4 lg:col-span-4">
              <div className="sticky top-20 rounded-2xl border border-gray-100 bg-white p-5 shadow-xs space-y-4">
                
                {/* Header Simulator */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                      <Calculator size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#001D3D]">Mô Phỏng Lương Tức Thì</h3>
                      <span className="text-[11px] text-gray-400 font-medium">Live Salary Simulator</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Real-time
                  </span>
                </div>

                {/* Chọn Vị Trí & Hình Thức */}
                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1">
                      Chọn Vị Trí Thử Nghiệm
                    </label>
                    <select
                      value={simRole}
                      onChange={(e) => setSimRole(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2 text-xs font-bold text-gray-800 outline-none focus:border-[#2F6FA8] focus:bg-white"
                    >
                      {policy.grades.map((g) => (
                        <option key={g.id} value={g.name}>
                          {g.name} (Bậc {g.level})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Toggle Part-time / Full-time */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl text-xs font-bold">
                    <button
                      type="button"
                      onClick={() => setSimType('part_time')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${simType === 'part_time' ? 'bg-white text-[#2F6FA8] shadow-xs' : 'text-gray-500'}`}
                    >
                      <Clock size={13} />
                      <span>Part-time (Giờ)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimType('full_time')}
                      className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg transition ${simType === 'full_time' ? 'bg-white text-[#2F6FA8] shadow-xs' : 'text-gray-500'}`}
                    >
                      <Briefcase size={13} />
                      <span>Full-time (Tháng)</span>
                    </button>
                  </div>
                </div>

                {/* Thanh Trượt Tương Tác */}
                <div className="space-y-3.5 pt-2">
                  {simType === 'part_time' ? (
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1.5">
                        <span className="text-gray-600">Tổng giờ làm trong tháng:</span>
                        <span className="font-mono text-sm font-bold text-[#001D3D]">{simHours} giờ</span>
                      </div>
                      <input
                        type="range"
                        min={40}
                        max={200}
                        step={5}
                        value={simHours}
                        onChange={(e) => setSimHours(Number(e.target.value))}
                        className="w-full accent-[#2F6FA8] cursor-pointer"
                      />
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1.5">
                        <span className="text-gray-600">Ngày công làm việc:</span>
                        <span className="font-mono text-sm font-bold text-[#001D3D]">{simDays} / 26 công</span>
                      </div>
                      <input
                        type="range"
                        min={15}
                        max={26}
                        step={1}
                        value={simDays}
                        onChange={(e) => setSimDays(Number(e.target.value))}
                        className="w-full accent-[#2F6FA8] cursor-pointer"
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-gray-600">Số ca đóng cửa trễ:</span>
                      <span className="font-mono text-sm font-bold text-[#001D3D]">{simCloseShifts} ca</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={15}
                      step={1}
                      value={simCloseShifts}
                      onChange={(e) => setSimCloseShifts(Number(e.target.value))}
                      className="w-full accent-amber-600 cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-medium mb-1.5">
                      <span className="text-gray-600">Hiệu suất đánh giá KPI:</span>
                      <span className="font-mono text-emerald-700 font-bold text-sm">{simKpiPercent}%</span>
                    </div>
                    <input
                      type="range"
                      min={50}
                      max={120}
                      step={5}
                      value={simKpiPercent}
                      onChange={(e) => setSimKpiPercent(Number(e.target.value))}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Kết Quả Bóc Tách Chi Tiết */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Lương cơ bản theo công:</span>
                    <span className="font-mono text-xs font-bold text-gray-900">{formatVnd(simResult.basePay)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Cơm ca ({simType === 'part_time' ? Math.round(simHours / 6) : simDays} ca):</span>
                    <span className="font-mono text-xs font-bold text-emerald-700">+{formatVnd(simResult.mealPay)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Phụ cấp đóng ca ({simCloseShifts} ca):</span>
                    <span className="font-mono text-xs font-bold text-emerald-700">+{formatVnd(simResult.closePay)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Thưởng KPI ({simKpiPercent}%):</span>
                    <span className="font-mono text-xs font-bold text-emerald-700">+{formatVnd(simResult.kpiPay)}</span>
                  </div>
                  {simType === 'full_time' && (
                    <>
                      <div className="flex justify-between text-gray-500 text-[11px] pt-1.5 border-t border-gray-200">
                        <span>BHXH &amp; BHYT (10.5%):</span>
                        <span className="font-mono text-rose-600">-{formatVnd(simResult.insurance)}</span>
                      </div>
                      {simResult.pit > 0 && (
                        <div className="flex justify-between text-gray-500 text-[11px]">
                          <span>Thuế TNCN tạm tính:</span>
                          <span className="font-mono text-rose-600">-{formatVnd(simResult.pit)}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Tổng Lương Thực Nhận (NET TAKE-HOME) */}
                <div className="rounded-2xl bg-[#001D3D] p-4 text-white space-y-1.5 shadow-md">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 block">
                    Thực Nhận Ước Tính (NET TAKE-HOME)
                  </span>
                  <div className="font-mono text-3xl font-bold tabular-nums tracking-tight text-amber-400">
                    {formatVnd(simResult.netTotal)}
                  </div>
                  <p className="text-xs text-gray-300">
                    Tương đương ~<strong className="text-white font-mono text-sm">{formatVnd(simResult.hourlyRate)}/giờ</strong> làm việc thực tế
                  </p>
                </div>

              </div>
            </div>

          </div>

        </div>

        {/* ========================================================================= */}
        {/* MODAL BÓC TÁCH CHI TIẾT VỊ TRÍ LƯƠNG (Chuẩn Mục 5.3 Design Rule Homies) */}
        {/* ========================================================================= */}
        {selectedGradeDetail && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl border border-gray-100 overflow-hidden space-y-4">
              
              {/* Header Modal */}
              <div className="bg-[#001D3D] text-white p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-300">Bóc Tách Chức Danh</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 text-white">Bậc {selectedGradeDetail.level}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{selectedGradeDetail.name}</h3>
                  <p className="text-xs text-gray-300">{selectedGradeDetail.band} • Nhóm Vận Hành Cửa Hàng</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedGradeDetail(null)}
                  className="rounded-xl bg-white/10 p-2 text-white hover:bg-white/20 transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 4 Bước Công Thức Toán Học */}
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="rounded-xl bg-gray-50 p-3.5 border border-gray-100">
                    <span className="text-gray-500 font-medium block">Lương chuẩn Full-time ({standardDays} công)</span>
                    <strong className="font-mono text-base font-bold text-[#001D3D] mt-1 block">
                      {formatVnd(selectedGradeDetail.base_salary)}
                    </strong>
                  </div>
                  <div className="rounded-xl bg-emerald-50 p-3.5 border border-emerald-100">
                    <span className="text-emerald-700 font-medium block">Ước tính lương giờ Part-time</span>
                    <strong className="font-mono text-base font-bold text-emerald-700 mt-1 block">
                      ~{formatVnd(Math.round(selectedGradeDetail.base_salary / standardTotalHours))}/h
                    </strong>
                  </div>
                  <div className="rounded-xl bg-amber-50 p-3.5 border border-amber-100">
                    <span className="text-amber-800 font-medium block">Quỹ thưởng KPI tối đa</span>
                    <strong className="font-mono text-base font-bold text-amber-800 mt-1 block">
                      {formatVnd(selectedGradeDetail.kpiPool)}
                    </strong>
                  </div>
                  <div className="rounded-xl bg-blue-50 p-3.5 border border-blue-100">
                    <span className="text-blue-800 font-medium block">Lương giai đoạn thử việc (85%)</span>
                    <strong className="font-mono text-base font-bold text-blue-800 mt-1 block">
                      {formatVnd(selectedGradeDetail.probation)}
                    </strong>
                  </div>
                </div>

                {/* Giải Thích Vận Hành Tuyến Đầu */}
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 space-y-1.5 text-xs">
                  <span className="font-bold text-gray-900 block flex items-center gap-1.5">
                    <Info size={14} className="text-[#2F6FA8]" />
                    <span>Quy Tắc Tính Lương Khi Chạy Thực Tế:</span>
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-gray-600 text-[11px]">
                    <li>Nhân viên Part-time: Nhận lương = <code>Giờ làm thực tế × Đơn giá giờ</code> + <code>Cơm ca ({formatVnd(policy.fnb.mealAllowancePerShift)})</code> + <code>Tip</code>.</li>
                    <li>Nhân viên Full-time: Nhận lương = <code>Lương cơ bản / {standardDays} × Ngày công</code> + <code>KPI</code> + <code>Phụ cấp</code> - <code>BHXH (10.5%)</code>.</li>
                    <li>Vị trí này {selectedGradeDetail.base_salary >= MIN_REGION_1_SALARY ? 'đã đảm bảo cao hơn sàn lương vùng I' : 'cần xem xét tăng để đạt mức sàn pháp lý'}.</li>
                  </ul>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedGradeDetail(null)}
                    className="px-4 py-2 rounded-xl bg-[#2F6FA8] text-white font-bold text-xs hover:bg-[#1D3E61] transition"
                  >
                    Đã Hiểu &amp; Đóng
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </AppShell>
  )
}

export default function SettingsPayrollPage() {
  return (
    <Suspense fallback={null}>
      <SettingsPayrollContent />
    </Suspense>
  )
}
