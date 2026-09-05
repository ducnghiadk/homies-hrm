'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { mockStores, mockEmployees, mockPositions, type Employee } from '@/lib/mock-data'
import { mockPayrollPeriods, formatVND } from '@/lib/mock-data-p4'
import { calculatePayrollBatchAsync, getPayrollPeriodBounds } from '@/lib/payroll-engine'
import { AttendanceService, type PayrollAttendanceRecord } from '@/lib/services/attendance/attendance-service'
import { getInitials } from '@/lib/utils'
import { payrollAdapter, storeAdapter, employeeAdapter, MasterDataAdapter } from '@/lib/adapters'
import { payrollPeriodAdapter } from '@/lib/adapters/payroll-period-adapter'
import { PayrollPaymentModal, type PayrollPaymentBankAccount } from '@/components/payroll/PayrollPaymentModal'
import type { PayrollPaymentMethod } from '@/lib/payroll-payment-ledger'
import { fetchRemotePayrollPolicy, saveStoredPayrollPolicy, getStoredPayrollPolicy } from '@/lib/services/payroll-policy-service'
import {
  DollarSign, TrendingUp, ChevronDown, ChevronUp, FileText,
  Search, RefreshCw, Download, Building2, Store, PlusCircle, MinusCircle,
  Eye, Send, Plus, MoreHorizontal, X, Calendar, Image as ImageIcon,
  SlidersHorizontal, CheckSquare, Square, RotateCcw, CreditCard, Lock, Info
} from 'lucide-react'

// Column configuration definition for Step 3: Column Visibility Settings
const DEFAULT_COLUMN_VISIBILITY: Record<string, { label: string; visible: boolean; category: string }> = {
  stt: { label: '# (STT)', visible: true, category: 'Cơ bản' },
  employee: { label: 'Nhân viên (Tên + Mã)', visible: true, category: 'Cơ bản' },
  department: { label: 'Bộ phận', visible: true, category: 'Cơ bản' },
  level: { label: 'Level', visible: true, category: 'Cơ bản' },
  empType: { label: 'Loại nhân viên', visible: true, category: 'Cơ bản' },
  baseSalary: { label: 'Lương cơ bản', visible: true, category: 'Cơ bản' },
  totalShifts: { label: 'Số ca', visible: true, category: 'Công & Giờ' },
  totalHours: { label: 'Tổng số giờ', visible: true, category: 'Công & Giờ' },
  regularHours: { label: 'Số giờ thường', visible: true, category: 'Công & Giờ' },
  otHours: { label: 'Số giờ tăng ca', visible: true, category: 'Công & Giờ' },
  totalDays: { label: 'Tổng số công', visible: true, category: 'Công & Giờ' },
  regularDays: { label: 'Số công thường', visible: true, category: 'Công & Giờ' },
  otDays: { label: 'Số công tăng ca', visible: true, category: 'Công & Giờ' },
  otSalary: { label: 'Lương tăng ca', visible: true, category: 'Lương & Phụ cấp' },
  workedSalary: { label: 'Lương theo giờ làm việc', visible: true, category: 'Lương & Phụ cấp' },
  allowances: { label: 'Tổng phụ cấp', visible: true, category: 'Lương & Phụ cấp' },
  bonusTickets: { label: 'Tổng phiếu cộng tiền', visible: true, category: 'Thưởng & Phạt' },
  totalPenalties: { label: 'Tổng phạt', visible: true, category: 'Thưởng & Phạt' },
  deductionTickets: { label: 'Tổng phiếu trừ tiền', visible: true, category: 'Thưởng & Phạt' },
  kpiSalary: { label: 'Lương KPI', visible: true, category: 'Thưởng & Phạt' },
  unionFee: { label: 'Tiền công đoàn', visible: true, category: 'Khấu trừ khác' },
  grossSalary: { label: 'Tổng lương (GROSS)', visible: true, category: 'Thực nhận' },
  returnHoldSalary: { label: 'Hoàn giữ lương', visible: true, category: 'Khấu trừ khác' },
  holdSalary: { label: 'Giữ lương', visible: true, category: 'Khấu trừ khác' },
  advanceSalary: { label: 'Ứng lương', visible: true, category: 'Khấu trừ khác' },
  netSalary: { label: 'Thực nhận (NET)', visible: true, category: 'Thực nhận' },
  roundedNet: { label: 'Làm tròn', visible: true, category: 'Thực nhận' },
  status: { label: 'Trạng thái', visible: true, category: 'Quản lý' },
  actions: { label: 'Thao tác', visible: true, category: 'Quản lý' },
}

const BANK_BIN_BY_NAME: Record<string, string> = {
  techcombank: '970407',
  vietcombank: '970436',
  vietinbank: '970415',
  bidv: '970418',
  agribank: '970405',
  mb: '970422',
  'mb bank': '970422',
  acb: '970416',
  vpbank: '970432',
  tpbank: '970423',
  sacombank: '970403',
  hdbank: '970437',
  vib: '970441',
  shb: '970443',
  ocb: '970448',
  msb: '970426',
}

function resolveBankBin(bankName: string): string | undefined {
  if (/^\d{6}$/.test(bankName)) return bankName
  const normalizedName = bankName.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  const matchedAlias = Object.keys(BANK_BIN_BY_NAME).find(alias => normalizedName.includes(alias))
  return matchedAlias ? BANK_BIN_BY_NAME[matchedAlias] : undefined
}

type PayrollTableRow = {
  stt: number
  id: string
  code: string
  name: string
  email: string
  department: string
  level: string
  empTypeLabel: string
  isHourly: boolean
  hourlyRate: number
  baseSalary: number
  baseSalaryFormatted: string
  storeId: string
  storeName: string
  totalShifts: number
  totalHours: number
  regularHours: number
  otHours: number
  totalDays: number
  regularDays: number
  otDays: number
  otSalary: number
  workedSalary: number
  allowances: number
  bonusTickets: number
  totalPenalties: number
  deductionTickets: number
  kpiSalary: number
  unionFee: number
  grossSalary: number
  returnHoldSalary: number
  holdSalary: number
  advanceSalary: number
  insurance: number
  tax: number
  netSalary: number
  roundedNet: number
  status: string
  bankAccount: PayrollRowBankAccount | null
  isResigned: boolean
  pendingShifts: number
}

type PayrollRowBankAccount = Omit<PayrollPaymentBankAccount, 'bankCode'> & {
  bankCode: string | undefined
}

type PayrollEmployee = Employee & {
  bank_name?: string
  bank_account_no?: string
  bank_account_holder?: string
}

export default function PayrollPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState('2026-02')
  const [expandedSlip, setExpandedSlip] = useState<string|null>(null)
  const [tab, setTab] = useState<'table'|'overview'|'payslips'|'my'>('table')

  // Table filters
  const [selectedStore, setSelectedStore] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [employeeTypeFilter, setEmployeeTypeFilter] = useState<string>('all')

  // UI Interactive States (Modals & Actions)
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<'add_bonus' | 'add_deduction' | 'view_slip' | 'view_daily_salary' | 'column_settings' | 'pay_salary' | null>(null)
  const [modalTargetEmp, setModalTargetEmp] = useState<Record<string, unknown> | null>(null)
  const [rowActionMenuEmpId, setRowActionMenuEmpId] = useState<string | null>(null)

  // File Upload Reference for Modal
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [ticketAttachedImage, setTicketAttachedImage] = useState<string | null>(null)

  // Step 3: Column Visibility State
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {}
    Object.keys(DEFAULT_COLUMN_VISIBILITY).forEach(key => {
      initial[key] = DEFAULT_COLUMN_VISIBILITY[key].visible
    })
    return initial
  })

  // Live overrides for bonuses, deductions, and statuses
  const [bonusOverrides, setBonusOverrides] = useState<Record<string, number>>({})
  const [deductionOverrides, setDeductionOverrides] = useState<Record<string, number>>({})
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>({})
  const [statusPeriod, setStatusPeriod] = useState<string | null>(null)

  // Ticket Form States
  const [ticketType, setTicketType] = useState('Phiếu thưởng')
  const [ticketScope, setTicketScope] = useState('date') // 'date' | 'period'
  const [ticketDate, setTicketDate] = useState('15/08/2026')
  const [ticketCalcType, setTicketCalcType] = useState('amount') // 'amount' | 'percent'
  const [ticketAmount, setTicketAmount] = useState<number>(0)
  const [ticketNote, setTicketNote] = useState('')

  // Step 4: Salary Payment Modal Form States
  const [payAmount, setPayAmount] = useState<number>(0)
  const [payMethod, setPayMethod] = useState('Ngân hàng')
  const [payNote, setPayNote] = useState('tra sua homies tt luong thang 8 nam 2026 lnv')
  const [payProofUrl, setPayProofUrl] = useState<string | null>(null)

  const [stores, setStores] = useState(mockStores)
  const [employees, setEmployees] = useState<PayrollEmployee[]>(mockEmployees)
  const [positions, setPositions] = useState(mockPositions)
  const [payrollResults, setPayrollResults] = useState<Awaited<ReturnType<typeof calculatePayrollBatchAsync>>>([])
  const [isPayrollLoading, setIsPayrollLoading] = useState(true)
  const [payrollError, setPayrollError] = useState<string | null>(null)
  const [dailyAttendanceRecords, setDailyAttendanceRecords] = useState<PayrollAttendanceRecord[]>([])
  const [payrollReloadKey, setPayrollReloadKey] = useState(0)
  const [policySource, setPolicySource] = useState<'system' | 'cache' | null>(null)
  const [policyInfo, setPolicyInfo] = useState<{days: number, hours: number} | null>(null)
  const [payrollPeriodStatus, setPayrollPeriodStatus] = useState<'chua_chot' | 'da_chot'>('chua_chot')
  const [hideResigned, setHideResigned] = useState(false)

  useEffect(() => {
    let isMounted = true
    if (hasHydrated && !isAuthenticated) router.push('/login')
    storeAdapter.getStores().then(res => { if (isMounted && res && res.length) setStores(res) })

    employeeAdapter.getAllEmployees().then(res => {
      if (isMounted && res && res.length) {
        setEmployees(res.map((e, idx) => ({
          id: e.id,
          org_id: 'org-001',
          store_id: e.store_id || 'store-001',
          secondary_store_ids: e.secondary_store_ids || [],
          position_id: e.position_id || 'pos-001',
          secondary_position_ids: e.secondary_position_ids || [],
          employee_code: `NV${String(idx + 1).padStart(4, '0')}`,
          full_name: e.full_name,
          phone: e.phone || '',
          email: e.email,
          avatar_url: e.avatar_url,
          date_of_birth: '1998-01-01',
          gender: 'female' as const,
          address: 'Hồ Chí Minh',
          bank_name: e.bank_name,
          bank_account_no: e.bank_account_no,
          bank_account_holder: e.bank_account_holder,
          role: (e.role === 'area_manager' ? 'store_manager' : e.role) as Employee['role'],
          status: e.status === 'inactive' ? ('inactive' as const) : ('active' as const),
          hire_date: '2024-01-01',
          total_points: 100,
          gamification_level: 'silver' as const,
        })))
      }
    })

    MasterDataAdapter.getPositions().then(res => {
      if (isMounted && res && res.length) {
        setPositions(res.map(p => ({
          id: p.id,
          org_id: 'org-001',
          name: p.name,
          code: p.id,
          base_salary: p.base_salary,
          level: p.level || 1,
          role: 'employee' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })))
      }
    })
    return () => { isMounted = false }
  }, [hasHydrated, isAuthenticated, router])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return
    let isMounted = true

    payrollAdapter.getPaymentStatuses(selectedPeriod).then(statuses => {
      if (isMounted) {
        setStatusOverrides(statuses)
        setStatusPeriod(selectedPeriod)
      }
    })

    return () => { isMounted = false }
  }, [hasHydrated, isAuthenticated, selectedPeriod])

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return
    let isMounted = true
    const { start: periodStart, end: periodEnd } = getPayrollPeriodBounds(selectedPeriod)
    const [yearStr, monthStr] = selectedPeriod.split('-')
    const thang = parseInt(monthStr, 10)
    const nam = parseInt(yearStr, 10)

    setIsPayrollLoading(true)
    setPayrollError(null)
    setPayrollResults([])

    payrollPeriodAdapter.fetchPayrollPeriod(thang, nam).then(period => {
      if (!isMounted) return

      if (period && period.trang_thai === 'da_chot') {
        setPayrollPeriodStatus('da_chot')
        setPolicySource('system')
        setPolicyInfo({ days: 26, hours: 8 })
        
        payrollPeriodAdapter.fetchPayrollSlips(period.id).then(slips => {
          if (!isMounted) return
          const mappedResults = slips.map((s: any) => ({
            employee_id: s.nhan_vien_id,
            employee_code: '',
            employee_name: '',
            is_resigned_employee: false,
            position: '',
            store: '',
            period: selectedPeriod,
            standard_days: 26,
            work_days: s.so_ca || 0,
            leave_days_paid: 0,
            leave_days_unpaid: 0,
            absent_days: 0,
            late_count: 0,
            soCaChoDuyet: 0,
            soCaChuaCheckOut: 0,
            total_hours: s.tong_so_gio || 0,
            base_salary: s.luong_co_ban || 0,
            base_earned: s.luong_theo_gio || 0,
            overtime_hours: s.so_gio_tang_ca || 0,
            overtime_amount: s.tien_tang_ca || 0,
            allowances: [],
            total_allowances: s.tong_phu_cap || 0,
            bonuses: [],
            total_bonuses: s.tong_phieu_cong || 0,
            fnb_service_charge_pool: 0,
            fnb_tip_pool: 0,
            fnb_fnb_share: 0,
            fnb_allocation_points: 0,
            fnb_allocation_breakdown: [],
            total_earnings: s.tong_luong || 0,
            late_deduction: s.tong_phat || 0,
            absent_deduction: 0,
            advance_deduction: s.ung_luong || 0,
            other_deductions: [],
            total_other_deductions: s.tong_phieu_tru || 0,
            total_deductions: (s.tong_phat || 0) + (s.tong_phieu_tru || 0),
            bhxh: 0,
            bhyt: 0,
            bhtn: 0,
            total_insurance: 0,
            taxable_income: 0,
            tax: 0,
            gross_salary: s.tong_luong || 0,
            net_salary: s.luong_thuc_nhan || 0,
            kpi_salary: s.luong_kpi || 0,
            union_fee: s.tien_cong_doan || 0,
            hold_salary: s.giu_luong || 0,
            return_hold_salary: s.hoan_giu_luong || 0,
          }))
          setPayrollResults(mappedResults as any)
          setIsPayrollLoading(false)
        })
      } else {
        setPayrollPeriodStatus('chua_chot')
        fetchRemotePayrollPolicy().then(dbPolicy => {
          if (dbPolicy) {
            saveStoredPayrollPolicy(dbPolicy)
            if (isMounted) {
              setPolicySource('system')
              setPolicyInfo({ days: dbPolicy.standardDaysPerMonth || 26, hours: dbPolicy.standardHoursPerDay || 8 })
            }
          } else {
            const cachedPolicy = getStoredPayrollPolicy()
            if (isMounted) {
              setPolicySource('cache')
              setPolicyInfo({ days: cachedPolicy.standardDaysPerMonth || 26, hours: cachedPolicy.standardHoursPerDay || 8 })
            }
          }
          return calculatePayrollBatchAsync(periodStart, periodEnd)
        })
          .then(results => {
            if (isMounted) setPayrollResults(results)
          })
          .catch(error => {
            if (isMounted) {
              setPayrollError(error instanceof Error ? error.message : 'Không tính được bảng lương.')
              setPayrollResults([])
            }
          })
          .finally(() => {
            if (isMounted) setIsPayrollLoading(false)
          })
      }
    }).catch(err => {
      console.error(err)
      if (isMounted) setIsPayrollLoading(false)
    })

    return () => { isMounted = false }
  }, [hasHydrated, isAuthenticated, selectedPeriod, payrollReloadKey])

  // Calculate every displayed payroll value from the same engine result.
  const tableData = useMemo<PayrollTableRow[]>(() => {
    const results = payrollResults

    const sourceEmployees: PayrollEmployee[] = employees.length > 0 ? employees : (mockEmployees as PayrollEmployee[])
    const sourcePositions = positions.length > 0 ? positions : mockPositions
    const sourceStores = stores.length > 0 ? stores : mockStores

    return results.map((res, index) => {
      const emp = sourceEmployees.find(e => e.id === res.employee_id) || (mockEmployees.find(e => e.id === res.employee_id) as PayrollEmployee | undefined)
      if (!emp) return null

      const pos = sourcePositions.find(p => p.id === emp.position_id)
      const store = sourceStores.find(s => s.id === emp.store_id)

      const isHourly = res.base_salary > 0 && res.base_salary < 100000
      const hourlyRate = isHourly ? res.base_salary : Math.round(res.base_salary / 26 / 8)
      const baseSalaryFormatted = isHourly
        ? `${res.base_salary.toLocaleString('vi-VN')}đ/giờ`
        : `${res.base_salary.toLocaleString('vi-VN')}đ/tháng`

      const totalShifts = res.work_days
      const totalHours = Math.round(res.total_hours * 100) / 100
      const otHours = Math.round(res.overtime_hours * 100) / 100
      const regularHours = Math.max(0, Math.round((totalHours - otHours) * 100) / 100)

      const regularDays = res.work_days + res.leave_days_paid
      const otDays = Math.round((otHours / 8) * 100) / 100
      const totalDays = Math.round((regularDays + otDays) * 100) / 100

      const otSalary = res.overtime_amount
      const workedSalary = res.base_earned
      const allowances = res.total_allowances

      const bonusTickets = bonusOverrides[emp.id] !== undefined ? bonusOverrides[emp.id] : res.total_bonuses

      const totalPenalties = res.late_deduction + res.absent_deduction
      const deductionTickets = deductionOverrides[emp.id] !== undefined ? deductionOverrides[emp.id] : res.total_other_deductions

      // KPI and union fees have no connected source in the payroll engine yet.
      const kpiSalary = 0
      const unionFee = 0
      const grossSalary = res.gross_salary + (bonusTickets - res.total_bonuses) - (deductionTickets - res.total_other_deductions)
      const returnHoldSalary = 0
      const holdSalary = 0
      const advanceSalary = res.advance_deduction

      const netSalary = res.net_salary + (bonusTickets - res.total_bonuses) - (deductionTickets - res.total_other_deductions)
      const roundedNet = Math.round(netSalary / 1000) * 1000

      const empType = isHourly ? 'Bán thời gian' : 'Toàn thời gian'
      const statusType = emp.status === 'probation' ? 'Thử việc' : 'Chính thức'

      const status = statusPeriod === selectedPeriod
        ? statusOverrides[emp.id] || 'Chưa gửi phiếu lương'
        : 'Chưa gửi phiếu lương'

      const email = emp.email || `${emp.full_name.toLowerCase().replace(/\s+/g, '')}@gmail.com`
      const bankName = emp.bank_name?.trim()
      const bankAccountNumber = emp.bank_account_no?.trim()
      const bankAccountHolder = emp.bank_account_holder?.trim()
      const bankAccount = bankName && bankAccountNumber && bankAccountHolder
        ? {
            bankName,
            accountNumber: bankAccountNumber,
            accountName: bankAccountHolder,
            bankCode: resolveBankBin(bankName),
          }
        : null

      return {
        stt: index + 1,
        id: emp.id,
        code: emp.employee_code || `NV${emp.id.replace(/\D/g, '').padStart(4, '0')}`,
        name: emp.full_name,
        email,
        department: res.position || pos?.name || 'Nhân viên',
        level: emp.role === 'store_manager' ? 'Store Manager' : emp.role === 'shift_leader' ? 'Shift Leader' : 'Senior Employee',
        empTypeLabel: `${empType} ${statusType}`,
         isHourly,
         hourlyRate,
         baseSalary: res.base_salary,
         baseSalaryFormatted,
        storeId: emp.store_id,
        storeName: store?.name || 'Chi nhánh',
        totalShifts: Math.round(totalShifts),
        totalHours,
        regularHours,
        otHours,
        totalDays,
        regularDays,
        otDays,
        otSalary,
        workedSalary,
        allowances,
        bonusTickets,
        totalPenalties,
        deductionTickets,
        kpiSalary,
        unionFee,
        grossSalary,
        returnHoldSalary,
        holdSalary,
        advanceSalary,
        insurance: res.total_insurance,
        tax: res.tax,
         netSalary,
         roundedNet,
         status,
         bankAccount,
         isResigned: res.is_resigned_employee,
         pendingShifts: res.soCaChoDuyet,
       }
    }).filter((row): row is PayrollTableRow => row !== null)
  }, [selectedPeriod, payrollResults, employees, positions, stores, bonusOverrides, deductionOverrides, statusOverrides, statusPeriod])

  const pendingSummary = useMemo(() => {
    const pendingRows = tableData.filter(r => r.pendingShifts > 0)
    return {
      totalShifts: pendingRows.reduce((sum, r) => sum + r.pendingShifts, 0),
      employees: pendingRows.map(r => r.name),
    }
  }, [tableData])

  useEffect(() => {
    if (!modalTargetEmp) {
      setDailyAttendanceRecords([])
      return
    }

    let isMounted = true
    const employeeId = String(modalTargetEmp.id || '')
    const { start: periodStart, end: periodEnd } = getPayrollPeriodBounds(selectedPeriod)

    AttendanceService.getAttendanceRecordsForPeriod(periodStart, periodEnd, employeeId)
      .then(records => {
        if (isMounted) setDailyAttendanceRecords(records)
      })
      .catch(() => {
        if (isMounted) setDailyAttendanceRecords([])
      })

    return () => { isMounted = false }
  }, [modalTargetEmp, selectedPeriod])

  // Filtered rows for the Data Table
  const filteredTableRows = useMemo(() => {
    let res = tableData

    if (hideResigned) {
      res = res.filter(r => !r.isResigned)
    }

    if (selectedStore !== 'all') {
      res = res.filter(r => r.storeId === selectedStore)
    }

    return res.filter(row => {
      const matchQuery = !searchQuery.trim() ||
        row.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        row.department.toLowerCase().includes(searchQuery.toLowerCase())
      const matchType = employeeTypeFilter === 'all' ||
        (employeeTypeFilter === 'hourly' && row.isHourly) ||
        (employeeTypeFilter === 'fulltime' && !row.isHourly)
      return matchQuery && matchType
    })
  }, [tableData, selectedStore, searchQuery, employeeTypeFilter, hideResigned])

  // Show only attendance-backed daily rows; period-level payroll values stay in the payslip.
  const dailySalaryRows = useMemo(() => {
    if (!modalTargetEmp) return []
    const employeeId = String(modalTargetEmp.id || '')
    const sourceRow = tableData.find(row => row.id === employeeId)
    if (!sourceRow) return []

    const workRecords = dailyAttendanceRecords
      .filter(record => ['on_time', 'late', 'early'].includes(record.status))
    const groupedByDate = new Map<string, typeof workRecords>()

    workRecords.forEach(record => {
      const dayRecords = groupedByDate.get(record.date) || []
      dayRecords.push(record)
      groupedByDate.set(record.date, dayRecords)
    })

    const totalOtHours = workRecords.reduce((sum, record) => sum + (record.overtime_hours || 0), 0)
    const basePerWorkedShift = workRecords.length > 0 ? sourceRow.workedSalary / workRecords.length : 0

    return Array.from(groupedByDate.entries()).sort(([dateA], [dateB]) => dateA.localeCompare(dateB)).map(([date, records], index) => {
      const actualHours = records.reduce((sum, record) => sum + (record.total_hours || 0), 0)
      const otHours = records.reduce((sum, record) => sum + (record.overtime_hours || 0), 0)
      const regularHours = Math.max(0, actualHours - otHours)
      const overtimeSalary = totalOtHours > 0 ? sourceRow.otSalary * (otHours / totalOtHours) : 0
      const dailySalary = Math.round(basePerWorkedShift * records.length + overtimeSalary)
      const [year, month, day] = date.split('-')

      return {
        stt: index + 1,
        date: `${day}/${month}/${year}`,
        shifts: records.length,
        actualHours: Math.round(actualHours * 100) / 100,
        regularHours: Math.round(regularHours * 100) / 100,
        otHours: Math.round(otHours * 100) / 100,
        calcHours: Math.round(actualHours * 100) / 100,
        coeffSalary: sourceRow.hourlyRate,
        dailySalary,
        allowance: 0,
        bonus: 0,
        penalty: 0,
        deduction: 0,
        netDaily: dailySalary,
      }
    })
  }, [modalTargetEmp, dailyAttendanceRecords, tableData])

  // Open Modal for adding Bonus or Deduction
  const openAddTicketModal = (emp: Record<string, unknown>, type: 'add_bonus' | 'add_deduction') => {
    setModalTargetEmp(emp)
    setActiveModal(type)
    setTicketType(type === 'add_bonus' ? 'Phiếu thưởng' : 'Phiếu phạt')
    setTicketScope('date')
    const [year, month] = selectedPeriod.split('-')
    setTicketDate(`15/${month}/${year}`)
    setTicketCalcType('amount')
    setTicketAmount(0)
    setTicketNote('')
    setTicketAttachedImage(null)
  }

  // Handle Image Upload for Modal
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setTicketAttachedImage(String(event.target?.result || ''))
      }
      reader.readAsDataURL(file)
    }
  }

  // Open Salary Payment Modal
  const openPaySalaryModal = (emp?: Record<string, unknown>) => {
    const target = emp || filteredTableRows[0] || tableData[0]
    if (target) {
      setModalTargetEmp(target)
      setPayAmount(Number(target.netSalary) || 0)
      setPayMethod('Ngân hàng')
      setPayNote(`tra sua homies tt luong thang ${selectedPeriod.split('-')[1]} nam ${selectedPeriod.split('-')[0]} ${String(target.code || '').toLowerCase()}`)
      setPayProofUrl(null)
      setActiveModal('pay_salary')
    }
  }

  // Handle Saving Bonus/Deduction Ticket from Modal
  const handleSaveTicket = async () => {
    if (!modalTargetEmp) return
    const empId = String(modalTargetEmp.id || '')
    const rawVal = Number(ticketAmount) || 0

    if (rawVal <= 0 || (ticketCalcType === 'percent' && rawVal > 100)) {
      alert(ticketCalcType === 'percent'
        ? 'Giá trị phần trăm phải lớn hơn 0 và không vượt quá 100%.'
        : 'Giá trị phiếu phải lớn hơn 0.')
      return
    }

    let addedVal = rawVal
    if (ticketCalcType === 'percent') {
      const baseSalaryVal = Number(modalTargetEmp.baseSalary) || 0
      if (baseSalaryVal <= 0) {
        alert('Nhân viên chưa có lương cơ bản để tính theo phần trăm.')
        return
      }
      addedVal = Math.round((rawVal / 100) * baseSalaryVal)
    }

    if (activeModal === 'add_bonus') {
      const current = bonusOverrides[empId] !== undefined ? bonusOverrides[empId] : (Number(modalTargetEmp.bonusTickets) || 0)
      const newTotal = current + addedVal
      const saved = await payrollAdapter.savePayslip({
        ...modalTargetEmp,
        period: selectedPeriod,
        bonusTickets: newTotal,
      })
      if (!saved) {
        alert('Không thể lưu phiếu thưởng. Vui lòng kiểm tra kỳ lương và thử lại.')
        return
      }
      setBonusOverrides(prev => ({ ...prev, [empId]: newTotal }))
    } else if (activeModal === 'add_deduction') {
      const current = deductionOverrides[empId] !== undefined ? deductionOverrides[empId] : (Number(modalTargetEmp.deductionTickets) || 0)
      const newTotal = current + addedVal
      const saved = await payrollAdapter.savePayslip({
        ...modalTargetEmp,
        period: selectedPeriod,
        deductionTickets: newTotal,
      })
      if (!saved) {
        alert('Không thể lưu phiếu trừ. Vui lòng kiểm tra kỳ lương và thử lại.')
        return
      }
      setDeductionOverrides(prev => ({ ...prev, [empId]: newTotal }))
    }

    setActiveModal(null)
    setModalTargetEmp(null)
  }

  // REAL EXCEL / CSV DOWNLOAD FUNCTION
  const handleExportExcel = () => {
    const headers = [
      'STT', 'Mã NV', 'Họ và tên', 'Bộ phận', 'Level', 'Loại nhân viên',
      'Lương cơ bản', 'Số ca', 'Tổng số giờ', 'Số giờ thường', 'Số giờ tăng ca',
      'Tổng số công', 'Số công thường', 'Số công tăng ca', 'Lương tăng ca',
      'Lương theo giờ làm việc', 'Tổng phụ cấp', 'Tổng phiếu cộng tiền',
      'Tổng phạt', 'Tổng phiếu trừ tiền', 'Lương KPI', 'Tiền công đoàn',
      'Tổng lương', 'Hoàn giữ lương', 'Giữ lương', 'Ứng lương', 'Thực nhận (NET)',
      'Làm tròn', 'Trạng thái'
    ]

    const csvRows = [headers.join(',')]

    filteredTableRows.forEach(r => {
      const rowData = [
        r.stt,
        `"${r.code}"`,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.department}"`,
        `"${r.level}"`,
        `"${r.empTypeLabel}"`,
        `"${r.baseSalaryFormatted}"`,
        r.totalShifts,
        r.totalHours,
        r.regularHours,
        r.otHours,
        r.totalDays,
        r.regularDays,
        r.otDays,
        r.otSalary,
        r.workedSalary,
        r.allowances,
        r.bonusTickets,
        r.totalPenalties,
        r.deductionTickets,
        r.kpiSalary,
        r.unionFee,
        r.grossSalary,
        r.returnHoldSalary,
        r.holdSalary,
        r.advanceSalary,
        r.netSalary,
        r.roundedNet,
        `"${r.status}"`
      ]
      csvRows.push(rowData.join(','))
    })

    const csvContent = '\uFEFF' + csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Bang_Luong_Homies_${selectedPeriod}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  // Action Menu Handlers
  const updateSinglePayslipStatus = async (row: PayrollTableRow, status: string, successMessage: string) => {
    if (row.status === 'Đã thanh toán' && status !== 'Đã thanh toán') {
      alert('Phiếu lương đã thanh toán. Hãy dùng chức năng hoàn tác thanh toán để đổi trạng thái.')
      return
    }

    const saved = await payrollAdapter.savePayslip({ ...row, period: selectedPeriod, status })
    if (!saved) {
      alert(`Không thể cập nhật trạng thái phiếu lương của ${row.name}.`)
      return
    }
    setStatusOverrides(prev => ({ ...prev, [row.id]: status }))
    alert(successMessage)
  }

  const updateVisiblePayslipStatuses = async (status: string, successMessage: string) => {
    const mutableRows = filteredTableRows.filter(row => row.status !== 'Đã thanh toán' || status === 'Đã thanh toán')
    if (mutableRows.length === 0) {
      alert('Không thể đổi trạng thái trực tiếp cho các phiếu đã thanh toán. Hãy dùng chức năng hoàn tác thanh toán.')
      return
    }

    const results = await Promise.all(
      mutableRows.map(async row => ({
        id: row.id,
        success: await payrollAdapter.savePayslip({ ...row, period: selectedPeriod, status }),
      })),
    )
    const succeeded = results.filter(result => result.success)
    if (succeeded.length > 0) {
      setStatusOverrides(prev => ({
        ...prev,
        ...Object.fromEntries(succeeded.map(result => [result.id, status])),
      }))
    }

    if (succeeded.length === mutableRows.length) {
      const skippedCount = filteredTableRows.length - mutableRows.length
      alert(skippedCount > 0 ? `${successMessage} Đã bỏ qua ${skippedCount} phiếu đã thanh toán.` : successMessage)
    } else {
      alert(`Đã cập nhật ${succeeded.length}/${mutableRows.length} phiếu lương. Các phiếu còn lại chưa lưu được.`)
    }
  }

  const handleSendAllPayslips = async () => {
    await updateVisiblePayslipStatuses('Đã gửi phiếu lương', `Đã gửi phiếu lương thành công cho ${filteredTableRows.length} nhân viên!`)
  }

  const handleUnsendAllPayslips = async () => {
    await updateVisiblePayslipStatuses('Chưa gửi phiếu lương', `Đã hủy gửi phiếu lương của ${filteredTableRows.length} nhân viên!`)
  }

  const handleUnpayAllSalaries = async () => {
    const paidRows = filteredTableRows.filter(row => row.status === 'Đã thanh toán')
    if (paidRows.length === 0) {
      alert('Không có phiếu lương đã thanh toán trong danh sách đang lọc.')
      return
    }

    const results = await Promise.all(
      paidRows.map(async row => ({
        id: row.id,
        success: await payrollAdapter.reversePayment({ periodId: selectedPeriod, employeeId: row.id, payslipStatus: row.status }),
      })),
    )
    const succeeded = results.filter(result => result.success)
    if (succeeded.length > 0) {
      setStatusOverrides(prev => ({
        ...prev,
        ...Object.fromEntries(succeeded.map(result => [result.id, 'Đã gửi phiếu lương'])),
      }))
    }

    if (succeeded.length === paidRows.length) {
      alert('Đã hoàn tác thanh toán lương; các phiếu đã quay về trạng thái chờ thanh toán.')
    } else {
      alert(`Đã hoàn tác ${succeeded.length}/${paidRows.length} phiếu lương. Các phiếu còn lại chưa hoàn tác được.`)
    }
  }

  // Helper count visible columns
  const visibleColumnCount = useMemo(() => {
    return Object.values(columnVisibility).filter(Boolean).length
  }, [columnVisibility])

  if (!hasHydrated) {
    return (
      <AppShell title="Bảng lương 💰">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (!user || !isAuthenticated) return null

  const isManager = user.role !== 'employee'
  const period = mockPayrollPeriods.find(p => p.period === selectedPeriod)
  const [periodYear, periodMonth] = selectedPeriod.split('-')
  const periodLabel = `${periodYear}/${periodMonth} (01/${periodMonth}/${periodYear} - ${getPayrollPeriodBounds(selectedPeriod).endDay}/${periodMonth}/${periodYear})`
  const slips = tableData
  const mySlip = tableData.find(s => s.id === user.id)
  const periodTotals = tableData.reduce((totals, row) => ({
    gross: totals.gross + row.grossSalary,
    net: totals.net + row.netSalary,
  }), { gross: 0, net: 0 })

  return (
    <AppShell title="Bảng tính lương chuỗi">
      {/* Hidden File Input for Image Upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleImageFileChange}
        className="hidden"
      />

      <div className="space-y-4">
        {/* Period Selector Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select className="input text-sm font-semibold bg-white border-gray-200 shadow-xs" value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
              {mockPayrollPeriods.map(p => (
                <option key={p.id} value={p.period}>Tháng {p.period.split('-')[1]}/{p.period.split('-')[0]}</option>
              ))}
            </select>
            {period && (
              <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{
                background: period.status === 'paid' ? 'var(--success-light)' : period.status === 'confirmed' ? 'var(--warning-light)' : 'var(--gray-100)',
                color: period.status === 'paid' ? 'var(--success)' : period.status === 'confirmed' ? 'var(--warning)' : 'var(--text-muted)',
              }}>
                {period.status === 'paid' ? 'Đã chi trả' : period.status === 'confirmed' ? 'Đã duyệt' : 'Bản nháp'}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push('/settings/payroll')}
              className="btn bg-slate-900 hover:bg-slate-800 text-white text-xs py-2 px-3 gap-1.5 shadow-sm cursor-pointer font-bold border border-slate-700"
              title="Mở cài đặt công thức & quy tắc lương chi tiết"
            >
              <SlidersHorizontal size={13} className="text-amber-400" /> Cấu hình quy tắc lương
            </button>
            <button
              onClick={() => setPayrollReloadKey(key => key + 1)}
              disabled={isPayrollLoading}
              className="btn btn-primary text-xs py-2 px-3 gap-1.5 shadow-sm cursor-pointer font-bold"
            >
              <RefreshCw size={13} /> {isPayrollLoading ? 'Đang tính lương...' : 'Tính lại lương'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        {isManager && (
          <div className="flex gap-1.5 animate-fade-in bg-primary-50 p-1 rounded-xl">
            {[
              { k: 'table' as const, l: 'Bảng lương chi tiết (Full)' },
              { k: 'overview' as const, l: 'Tổng quan chi phí' },
              { k: 'payslips' as const, l: 'Phiếu lương NV' },
              { k: 'my' as const, l: 'Lương của tôi' },
            ].map(({ k, l }) => (
              <button key={k} className="flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer"
                style={{
                  background: tab === k ? 'white' : 'transparent',
                  color: tab === k ? 'var(--primary)' : 'var(--text-secondary)',
                  boxShadow: tab === k ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                }} onClick={() => setTab(k)}>{l}</button>
            ))}
          </div>
        )}

        {/* Quick Menu Shortcuts */}
        {isManager && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 animate-fade-in">
            <button
              onClick={() => { setTab('table'); setSelectedStore('all') }}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                tab === 'table' && selectedStore === 'all'
                  ? 'bg-primary-50 border-primary-500 font-bold text-primary shadow-xs'
                  : 'bg-white border-gray-200 hover:bg-vanilla-50'
              }`}
            >
              <div className="text-xs font-semibold flex items-center gap-1.5">
                <Building2 size={15} className="text-primary" /> Bảng lương công ty
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">Toàn bộ nhân viên hệ thống</div>
            </button>

            <div
              className={`p-2.5 rounded-xl border text-left transition-all ${
                tab === 'table' && selectedStore !== 'all'
                  ? 'bg-emerald-50 border-emerald-500 font-bold text-emerald-800 shadow-sm'
                  : 'bg-white border-gray-200 hover:bg-vanilla-50'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  setTab('table')
                  if (selectedStore === 'all') {
                    setSelectedStore(mockStores[0]?.id || 'store-001')
                  }
                }}
                className="w-full text-left font-semibold text-xs flex items-center gap-1.5 text-emerald-800 cursor-pointer"
              >
                <Store size={15} className="text-emerald-600 flex-shrink-0" /> Bảng lương chi nhánh
              </button>

              <select
                value={selectedStore}
                onChange={e => {
                  setTab('table')
                  setSelectedStore(e.target.value)
                }}
                className="mt-1.5 w-full text-xs bg-emerald-50/70 border border-emerald-200 text-emerald-900 rounded-lg px-2 py-1 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">-- Chọn cửa hàng / chi nhánh --</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>📍 {s.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => router.push('/payroll/bonus')}
              className="p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/40 text-emerald-800 text-left hover:bg-emerald-50 cursor-pointer"
            >
              <div className="text-xs font-semibold flex items-center gap-1.5">
                <PlusCircle size={15} className="text-emerald-600" /> Phiếu cộng (Thưởng)
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">Quản lý thưởng & Tip doanh thu</div>
            </button>

            <button
              onClick={() => router.push('/payroll/deductions')}
              className="p-2.5 rounded-xl border border-rose-200 bg-rose-50/40 text-rose-800 text-left hover:bg-rose-50 cursor-pointer"
            >
              <div className="text-xs font-semibold flex items-center gap-1.5">
                <MinusCircle size={15} className="text-rose-600" /> Phiếu trừ & Tạm ứng
              </div>
              <div className="text-[10px] text-rose-600 mt-0.5">Đi trễ, vi phạm & tạm ứng</div>
            </button>
          </div>
        )}

        {/* COMPLETE FULL 29-COLUMN DATA TABLE WITH DYNAMIC COLUMN VISIBILITY */}
        {(tab === 'table' && isManager) && (
          <div className="card p-0 overflow-hidden shadow-sm border border-gray-200 animate-slide-up">

            {/* Table Control Header Bar */}
            <div className="p-3 bg-slate-900 text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {/* Store Select */}
                <select
                  value={selectedStore}
                  onChange={e => setSelectedStore(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none focus:border-primary-500 cursor-pointer"
                >
                  <option value="all">HBP - Trà sữa phô mai tươi HOMIES (Tất cả)</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                {/* Filter By Employee Type */}
                <select
                  value={employeeTypeFilter}
                  onChange={e => setEmployeeTypeFilter(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2.5 py-1.5 font-medium focus:outline-none cursor-pointer"
                >
                  <option value="all">Tất cả loại NV</option>
                  <option value="hourly">Bán thời gian (Theo giờ)</option>
                  <option value="fulltime">Toàn thời gian (Cố định)</option>
                </select>

                {/* Search Input */}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm nhân viên..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="bg-slate-800 border border-slate-700 text-white text-xs pl-8 pr-3 py-1.5 rounded-lg focus:outline-none w-40 sm:w-48 placeholder-slate-400"
                  />
                </div>
                <label className="flex items-center gap-1.5 text-xs text-white bg-slate-800 border border-slate-700 px-2.5 py-1.5 rounded-lg cursor-pointer hover:bg-slate-700 transition-colors">
                  <input type="checkbox" checked={hideResigned} onChange={e => setHideResigned(e.target.checked)} className="rounded border-slate-600 bg-slate-900 cursor-pointer text-primary-500" />
                  Ẩn NV đã nghỉ
                </label>
              </div>

              {/* Action Buttons & Thao Tác Dropdown */}
              <div className="flex items-center gap-2 relative">
                <button
                  onClick={async () => {
                    if (pendingSummary.totalShifts > 0) {
                      alert('Không thể chốt lương khi còn ca chưa duyệt!')
                      return
                    }
                    if (!window.confirm('Bạn có chắc chắn muốn chốt bảng lương này? Sau khi chốt sẽ không thể tính lại!')) return
                    
                    const [yearStr, monthStr] = selectedPeriod.split('-')
                    const res = await payrollPeriodAdapter.savePayrollPeriod(parseInt(monthStr, 10), parseInt(yearStr, 10), payrollResults, policyInfo)
                    if (res.success) {
                      alert('Đã chốt kỳ lương thành công!')
                      setPayrollReloadKey(k => k + 1)
                    } else {
                      alert(`Chốt thất bại: ${res.error}`)
                    }
                  }}
                  disabled={payrollPeriodStatus === 'da_chot' || pendingSummary.totalShifts > 0 || isPayrollLoading}
                  className={`btn text-xs py-1.5 px-3 border-0 gap-1 font-semibold flex items-center shadow-xs cursor-pointer ${
                    payrollPeriodStatus === 'da_chot' ? 'bg-slate-600 text-slate-300' : 'bg-rose-600 hover:bg-rose-500 text-white'
                  }`}
                >
                  <Lock size={13} /> {payrollPeriodStatus === 'da_chot' ? 'ĐÃ CHỐT' : 'Chốt kỳ lương'}
                </button>

                <button
                  onClick={() => setPayrollReloadKey(key => key + 1)}
                  disabled={isPayrollLoading || payrollPeriodStatus === 'da_chot'}
                  className="btn bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-1.5 px-3 border-0 gap-1 font-semibold flex items-center shadow-xs cursor-pointer"
                >
                  <RefreshCw size={13} /> {isPayrollLoading ? 'Đang tính lương...' : 'Tính lại lương'}
                </button>

                {/* Real Excel Export Button */}
                <button
                  onClick={handleExportExcel}
                  className="btn bg-slate-800 hover:bg-slate-700 text-white text-xs py-1.5 px-3 border border-slate-700 gap-1 flex items-center cursor-pointer"
                  title="Xuất file Excel CSV"
                >
                  <Download size={13} /> Xuất Excel
                </button>

                {/* Thao Tác Menu Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setIsActionMenuOpen(prev => !prev)}
                    className="btn bg-sky-700 hover:bg-sky-600 text-white text-xs py-1.5 px-3 border-0 gap-1.5 font-semibold flex items-center shadow-xs cursor-pointer"
                  >
                    <span>Thao tác</span>
                    <ChevronDown size={13} />
                  </button>

                  {isActionMenuOpen && (
                    <div className="absolute right-0 mt-1 w-52 bg-[#0F4C81] text-white rounded-xl shadow-2xl border border-sky-800 z-50 py-1.5 text-xs animate-fade-in">
                      <button
                        onClick={handleSendAllPayslips}
                        className="w-full px-3.5 py-2 text-left hover:bg-sky-800/80 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Send size={14} className="text-sky-300" />
                        <span>Gửi phiếu lương</span>
                      </button>

                      <button
                        onClick={() => { openPaySalaryModal(); setIsActionMenuOpen(false) }}
                        className="w-full px-3.5 py-2 text-left hover:bg-sky-800/80 flex items-center gap-2.5 border-t border-sky-800/60 transition-colors cursor-pointer"
                      >
                        <DollarSign size={14} className="text-emerald-300" />
                        <span>Thanh toán lương (VietQR)</span>
                      </button>

                      <button
                        onClick={handleUnsendAllPayslips}
                        className="w-full px-3.5 py-2 text-left hover:bg-sky-800/80 flex items-center gap-2.5 border-t border-sky-800/60 text-sky-200 transition-colors cursor-pointer"
                      >
                        <FileText size={14} className="text-sky-300" />
                        <span>Hủy gửi phiếu lương</span>
                      </button>

                      <button
                        onClick={handleUnpayAllSalaries}
                        className="w-full px-3.5 py-2 text-left hover:bg-sky-800/80 flex items-center gap-2.5 border-t border-sky-800/60 text-sky-200 transition-colors cursor-pointer"
                      >
                        <FileText size={14} className="text-amber-300" />
                        <span>Hủy thanh toán lương</span>
                      </button>

                      <button
                        onClick={() => { handleExportExcel(); setIsActionMenuOpen(false) }}
                        className="w-full px-3.5 py-2 text-left hover:bg-sky-800/80 flex items-center gap-2.5 border-t border-sky-800/60 transition-colors cursor-pointer"
                      >
                        <Download size={14} className="text-emerald-400" />
                        <span>Xuất Excel</span>
                      </button>

                      <button
                        onClick={() => { setActiveModal('column_settings'); setIsActionMenuOpen(false) }}
                        className="w-full px-3.5 py-2 text-left hover:bg-sky-800/80 flex items-center gap-2.5 border-t border-sky-800/60 transition-colors cursor-pointer"
                      >
                        <SlidersHorizontal size={14} className="text-amber-300" />
                        <span>Cài đặt hiển thị ({visibleColumnCount}/29)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable Spreadsheet Grid Table with Dynamic Columns */}
            {pendingSummary.totalShifts > 0 && payrollPeriodStatus === 'chua_chot' && (
              <div className="text-xs mt-2 mx-3 px-3 py-2 bg-rose-50 text-rose-700 rounded-md border border-rose-200">
                <strong>Còn {pendingSummary.totalShifts} ca chưa duyệt</strong> của {pendingSummary.employees.length} nhân viên ({pendingSummary.employees.join(', ')}) — số giờ này đang được tính là 0. Duyệt hết trước khi chốt lương.
              </div>
            )}
            {policySource && policyInfo && (
              <div className="text-xs mt-2 mb-3 mx-3 px-3 py-2 bg-[#F3F6F8] text-slate-600 rounded-md flex items-center gap-2 border border-slate-200">
                <Info size={14} className="text-[#2F6FA8]" />
                <span>
                  Đang tính lương theo cấu hình: <strong>{policyInfo.days} ngày × {policyInfo.hours} giờ</strong>.
                  Nguồn cấu hình: <strong>{policySource === 'system' ? 'Hệ thống (Mới nhất)' : 'Bộ nhớ đệm (Máy hiện tại)'}</strong>.
                </span>
              </div>
            )}
            <div className="overflow-x-auto max-w-full">
              <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
                    {columnVisibility.stt && <th className="p-2.5 text-center w-10 border-r border-slate-200">#</th>}
                    {columnVisibility.employee && <th className="p-2.5 border-r border-slate-200 min-w-[160px]">Nhân viên</th>}
                    {columnVisibility.department && <th className="p-2.5 border-r border-slate-200 min-w-[90px]">Bộ phận</th>}
                    {columnVisibility.level && <th className="p-2.5 border-r border-slate-200 min-w-[100px]">Level</th>}
                    {columnVisibility.empType && <th className="p-2.5 border-r border-slate-200 min-w-[130px]">Loại nhân viên</th>}
                    {columnVisibility.baseSalary && <th className="p-2.5 border-r border-slate-200 text-right min-w-[110px]">Lương cơ bản</th>}
                    {columnVisibility.totalShifts && <th className="p-2.5 border-r border-slate-200 text-center min-w-[55px]">Số ca</th>}
                    {columnVisibility.totalHours && <th className="p-2.5 border-r border-slate-200 text-right min-w-[80px]">Tổng số giờ</th>}
                    {columnVisibility.regularHours && <th className="p-2.5 border-r border-slate-200 text-right min-w-[85px]">Số giờ thường</th>}
                    {columnVisibility.otHours && <th className="p-2.5 border-r border-slate-200 text-right min-w-[85px]">Số giờ tăng ca</th>}
                    {columnVisibility.totalDays && <th className="p-2.5 border-r border-slate-200 text-right min-w-[85px]">Tổng số công</th>}
                    {columnVisibility.regularDays && <th className="p-2.5 border-r border-slate-200 text-right min-w-[85px]">Số công thường</th>}
                    {columnVisibility.otDays && <th className="p-2.5 border-r border-slate-200 text-right min-w-[90px]">Số công tăng ca</th>}
                    {columnVisibility.otSalary && <th className="p-2.5 border-r border-slate-200 text-right min-w-[90px]">Lương tăng ca</th>}
                    {columnVisibility.workedSalary && <th className="p-2.5 border-r border-slate-200 text-right min-w-[120px]">Lương theo giờ làm việc</th>}
                    {columnVisibility.allowances && <th className="p-2.5 border-r border-slate-200 text-right min-w-[90px]">Tổng phụ cấp</th>}

                    {columnVisibility.bonusTickets && <th className="p-2.5 border-r border-slate-200 text-right min-w-[140px] bg-emerald-50/50">Tổng phiếu cộng tiền</th>}
                    {columnVisibility.totalPenalties && <th className="p-2.5 border-r border-slate-200 text-right min-w-[80px] text-rose-600">Tổng phạt</th>}
                    {columnVisibility.deductionTickets && <th className="p-2.5 border-r border-slate-200 text-right min-w-[140px] bg-rose-50/50">Tổng phiếu trừ tiền</th>}
                    {columnVisibility.kpiSalary && <th className="p-2.5 border-r border-slate-200 text-right min-w-[85px]">Lương KPI</th>}
                    {columnVisibility.unionFee && <th className="p-2.5 border-r border-slate-200 text-right min-w-[90px]">Tiền công đoàn</th>}
                    {columnVisibility.grossSalary && <th className="p-2.5 border-r border-slate-200 text-right min-w-[100px] font-extrabold">Tổng lương</th>}
                    {columnVisibility.returnHoldSalary && <th className="p-2.5 border-r border-slate-200 text-right min-w-[85px]">Hoàn giữ lương</th>}
                    {columnVisibility.holdSalary && <th className="p-2.5 border-r border-slate-200 text-right min-w-[75px]">Giữ lương</th>}
                    {columnVisibility.advanceSalary && <th className="p-2.5 border-r border-slate-200 text-right min-w-[75px]">Ứng lương</th>}
                    {columnVisibility.netSalary && <th className="p-2.5 border-r border-slate-200 text-right min-w-[110px] text-emerald-700 font-extrabold">Thực nhận</th>}
                    {columnVisibility.roundedNet && <th className="p-2.5 border-r border-slate-200 text-right min-w-[100px]">Làm tròn</th>}
                    {columnVisibility.status && <th className="p-2.5 border-r border-slate-200 text-center min-w-[130px]">Trạng thái</th>}
                    {columnVisibility.actions && <th className="p-2.5 text-center min-w-[120px]">Thao tác</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {isPayrollLoading ? (
                    <tr>
                      <td colSpan={visibleColumnCount} className="p-8 text-center text-slate-400">
                        Đang tải dữ liệu lương từ chấm công thật...
                      </td>
                    </tr>
                  ) : payrollError ? (
                    <tr>
                      <td colSpan={visibleColumnCount} className="p-8 text-center text-rose-500">
                        Không tính được bảng lương: {payrollError}
                      </td>
                    </tr>
                  ) : filteredTableRows.length === 0 ? (
                    <tr>
                      <td colSpan={visibleColumnCount} className="p-8 text-center text-slate-400">
                        Không có dữ liệu nhân viên cho bộ lọc này
                      </td>
                    </tr>
                  ) : (
                    filteredTableRows.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                        {columnVisibility.stt && <td className="p-2.5 text-center text-slate-400 font-mono border-r border-slate-100">{row.stt}</td>}

                        {columnVisibility.employee && (
                          <td className="p-2.5 border-r border-slate-100">
                            <div
                              onClick={() => { setModalTargetEmp(row); setActiveModal('view_daily_salary') }}
                              title="Bấm để xem Lương từng ngày"
                              className="font-bold text-sky-600 hover:text-sky-800 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              <span>{row.name}</span>
                              {row.isResigned && (
                                <span className="ml-1 inline-block px-1 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] uppercase tracking-wider whitespace-nowrap">Đã nghỉ việc</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">{row.code}</div>
                          </td>
                        )}

                        {columnVisibility.department && <td className="p-2.5 border-r border-slate-100 text-slate-700">{row.department}</td>}
                        {columnVisibility.level && <td className="p-2.5 border-r border-slate-100 text-slate-600 text-[11px]">{row.level}</td>}
                        {columnVisibility.empType && (
                          <td className="p-2.5 border-r border-slate-100">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px]">
                              {row.empTypeLabel}
                            </span>
                          </td>
                        )}
                        {columnVisibility.baseSalary && <td className="p-2.5 border-r border-slate-100 text-right font-medium text-slate-800">{row.baseSalaryFormatted}</td>}
                        {columnVisibility.totalShifts && <td className="p-2.5 border-r border-slate-100 text-center font-semibold text-slate-700">{row.totalShifts}</td>}
                        {columnVisibility.totalHours && <td className="p-2.5 border-r border-slate-100 text-right text-slate-700 font-mono">{row.totalHours}</td>}
                        {columnVisibility.regularHours && <td className="p-2.5 border-r border-slate-100 text-right text-slate-600 font-mono">{row.regularHours}</td>}
                        {columnVisibility.otHours && <td className="p-2.5 border-r border-slate-100 text-right text-amber-600 font-mono font-medium">{row.otHours > 0 ? row.otHours : 0}</td>}
                        {columnVisibility.totalDays && <td className="p-2.5 border-r border-slate-100 text-right text-slate-800 font-semibold">{row.totalDays}</td>}
                        {columnVisibility.regularDays && <td className="p-2.5 border-r border-slate-100 text-right text-slate-600 font-mono">{row.regularDays}</td>}
                        {columnVisibility.otDays && <td className="p-2.5 border-r border-slate-100 text-right text-amber-600 font-mono">{row.otDays > 0 ? row.otDays : 0}</td>}
                        {columnVisibility.otSalary && <td className="p-2.5 border-r border-slate-100 text-right text-amber-600 font-mono">{row.otSalary > 0 ? formatVND(row.otSalary) : '0'}</td>}
                        {columnVisibility.workedSalary && <td className="p-2.5 border-r border-slate-100 text-right text-slate-800 font-mono font-medium">{formatVND(row.workedSalary)}</td>}
                        {columnVisibility.allowances && <td className="p-2.5 border-r border-slate-100 text-right text-slate-600 font-mono">{row.allowances > 0 ? formatVND(row.allowances) : '0'}</td>}

                        {columnVisibility.bonusTickets && (
                          <td className="p-2.5 border-r border-slate-100 text-right font-mono bg-emerald-50/30">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-semibold text-emerald-700">{row.bonusTickets > 0 ? formatVND(row.bonusTickets) : '0'}</span>
                              <button
                                onClick={() => openAddTicketModal(row, 'add_bonus')}
                                title="Thêm phiếu cộng tiền"
                                className="w-6 h-5 rounded border border-dashed border-emerald-500 hover:bg-emerald-100 hover:border-emerald-600 flex items-center justify-center text-emerald-600 text-xs transition-all cursor-pointer shadow-2xs"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                        )}

                        {columnVisibility.totalPenalties && (
                          <td className="p-2.5 border-r border-slate-100 text-right font-mono text-rose-600 font-medium">
                            {row.totalPenalties > 0 ? formatVND(row.totalPenalties) : '0'}
                          </td>
                        )}

                        {columnVisibility.deductionTickets && (
                          <td className="p-2.5 border-r border-slate-100 text-right font-mono bg-rose-50/30">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-rose-700 font-semibold">{row.deductionTickets > 0 ? formatVND(row.deductionTickets) : '0'}</span>
                              <button
                                onClick={() => openAddTicketModal(row, 'add_deduction')}
                                title="Thêm phiếu trừ tiền"
                                className="w-6 h-5 rounded border border-dashed border-rose-500 hover:bg-rose-100 hover:border-rose-600 flex items-center justify-center text-rose-600 text-xs transition-all cursor-pointer shadow-2xs"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                        )}

                        {columnVisibility.kpiSalary && <td className="p-2.5 border-r border-slate-100 text-right font-mono text-slate-700">{row.kpiSalary > 0 ? formatVND(row.kpiSalary) : '0'}</td>}
                        {columnVisibility.unionFee && <td className="p-2.5 border-r border-slate-100 text-right font-mono text-slate-500">{row.unionFee > 0 ? formatVND(row.unionFee) : '0'}</td>}
                        {columnVisibility.grossSalary && <td className="p-2.5 border-r border-slate-100 text-right font-mono font-bold text-slate-900">{formatVND(row.grossSalary)}</td>}
                        {columnVisibility.returnHoldSalary && <td className="p-2.5 border-r border-slate-100 text-right font-mono text-slate-500">{row.returnHoldSalary > 0 ? formatVND(row.returnHoldSalary) : '0'}</td>}
                        {columnVisibility.holdSalary && <td className="p-2.5 border-r border-slate-100 text-right font-mono text-slate-500">{row.holdSalary > 0 ? formatVND(row.holdSalary) : '0'}</td>}
                        {columnVisibility.advanceSalary && <td className="p-2.5 border-r border-slate-100 text-right font-mono text-slate-500">{row.advanceSalary > 0 ? formatVND(row.advanceSalary) : '0'}</td>}

                        {columnVisibility.netSalary && (
                          <td className="p-2.5 border-r border-slate-100 text-right font-extrabold text-emerald-600 font-mono text-sm bg-emerald-50/30">
                            {formatVND(row.netSalary)}
                          </td>
                        )}

                        {columnVisibility.roundedNet && (
                          <td className="p-2.5 border-r border-slate-100 text-right font-mono font-semibold text-slate-800">
                            {formatVND(row.roundedNet)}
                          </td>
                        )}

                        {columnVisibility.status && (
                          <td className="p-2.5 border-r border-slate-100 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${
                              row.status === 'Đã gửi phiếu lương' ? 'bg-emerald-100 text-emerald-700' :
                              row.status === 'Đã thanh toán' ? 'bg-sky-100 text-sky-700 font-bold' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                        )}

                        {columnVisibility.actions && (
                          <td className="p-2.5 text-center relative">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => openPaySalaryModal(row)}
                                title="Thanh toán lương VietQR"
                                className="p-1 rounded border border-emerald-200 text-emerald-600 hover:bg-emerald-50 transition-all cursor-pointer"
                              >
                                <CreditCard size={11} />
                              </button>
                              <button
                                onClick={() => { setModalTargetEmp(row); setActiveModal('view_slip') }}
                                title="Xem phiếu lương"
                                className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-primary transition-all cursor-pointer"
                              >
                                <Eye size={11} />
                              </button>
                              <button
                                onClick={() => updateSinglePayslipStatus(row, 'Đã gửi phiếu lương', `Đã gửi phiếu lương thành công cho ${row.name}`)}
                                title="Gửi phiếu lương"
                                className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-emerald-600 transition-all cursor-pointer"
                              >
                                <Send size={11} />
                              </button>

                              {/* Row Action ⚙️ Contextual Dropdown */}
                              <div className="relative">
                                <button
                                  onClick={() => setRowActionMenuEmpId(prev => prev === row.id ? null : row.id)}
                                  title="Tùy chọn khác"
                                  className="p-1 rounded border border-slate-200 text-slate-600 hover:bg-slate-100 transition-all cursor-pointer"
                                >
                                  <MoreHorizontal size={11} />
                                </button>

                                {rowActionMenuEmpId === row.id && (
                                  <div className="absolute right-0 mt-1 w-48 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 z-50 py-1.5 text-[11px] animate-fade-in text-left">
                                    <button
                                      onClick={() => { setModalTargetEmp(row); setActiveModal('view_daily_salary'); setRowActionMenuEmpId(null) }}
                                      className="w-full px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2"
                                    >
                                      <Calendar size={13} className="text-sky-400" />
                                      <span>Xem lương từng ngày</span>
                                    </button>
                                    <button
                                      onClick={() => { openPaySalaryModal(row); setRowActionMenuEmpId(null) }}
                                      className="w-full px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800"
                                    >
                                      <CreditCard size={13} className="text-emerald-400" />
                                      <span>Thanh toán VietQR</span>
                                    </button>
                                    <button
                                      onClick={() => { openAddTicketModal(row, 'add_bonus'); setRowActionMenuEmpId(null) }}
                                      className="w-full px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800"
                                    >
                                      <PlusCircle size={13} className="text-emerald-400" />
                                      <span>Thêm phiếu thưởng</span>
                                    </button>
                                    <button
                                      onClick={() => { openAddTicketModal(row, 'add_deduction'); setRowActionMenuEmpId(null) }}
                                      className="w-full px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800 text-rose-300"
                                    >
                                      <MinusCircle size={13} className="text-rose-400" />
                                      <span>Thêm phiếu trừ</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        void updateSinglePayslipStatus(row, 'Đã khóa lương', `Đã khóa phiếu lương của ${row.name}`)
                                        setRowActionMenuEmpId(null)
                                      }}
                                      className="w-full px-3 py-1.5 hover:bg-slate-800 flex items-center gap-2 border-t border-slate-800 text-amber-300"
                                    >
                                      <Lock size={13} className="text-amber-400" />
                                      <span>Khóa phiếu lương</span>
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Summary */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600 font-medium">
              <div>Hiển thị <strong>{filteredTableRows.length}</strong> / {tableData.length} nhân viên ({visibleColumnCount}/29 cột)</div>
              <div className="flex items-center gap-4">
                <span>Tổng thực nhận: <strong className="text-emerald-700 text-sm">{formatVND(filteredTableRows.reduce((s, r) => s + r.netSalary, 0))}</strong></span>
              </div>
            </div>

          </div>
        )}

        {/* OVERVIEW (Manager) */}
        {(tab === 'overview' && isManager) && period && (
          <div className="space-y-3 animate-slide-up">
            <div className="grid grid-cols-2 gap-3">
              <div className="card-elevated p-4 text-center">
                <DollarSign size={20} className="mx-auto mb-1" style={{ color: 'var(--success)' }} />
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Tổng chi</div>
                <div className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>{formatVND(periodTotals.gross)}</div>
              </div>
              <div className="card-elevated p-4 text-center">
                <TrendingUp size={20} className="mx-auto mb-1" style={{ color: 'var(--primary)' }} />
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Thực nhận</div>
                <div className="text-lg font-black" style={{ color: 'var(--primary)' }}>{formatVND(periodTotals.net)}</div>
              </div>
            </div>
            <div className="text-xs text-slate-500 text-center">
              {tableData.length} nhân viên đang có kết quả tính lương trong kỳ
            </div>
          </div>
        )}

        {/* PAYSLIPS LIST (Manager) */}
        {(tab === 'payslips' && isManager) && (
          <div className="space-y-2 animate-slide-up">
            {slips.map(slip => {
              const expanded = expandedSlip === slip.id
              return (
                <div key={slip.id} className="card overflow-hidden">
                  <button className="w-full p-3 flex items-center gap-3 text-left" onClick={() => setExpandedSlip(expanded ? null : slip.id)}>
                    <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{getInitials(slip.name)}</div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{slip.name}</div>
                      <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{slip.department}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold" style={{ color: 'var(--success)' }}>{formatVND(slip.netSalary)}</div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>thực nhận</div>
                    </div>
                    {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  {expanded && <PayslipDetail slip={slip} />}
                </div>
              )
            })}
          </div>
        )}

        {/* MY PAYSLIP */}
        {(tab === 'my' || !isManager) && mySlip && (
          <div className="animate-slide-up">
            <div className="card-elevated p-5 text-center mb-4" style={{ background: 'linear-gradient(135deg, #48C07910, #2F6FA810)' }}>
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Thực nhận tháng {selectedPeriod.split('-')[1]}</div>
              <div className="text-3xl font-black mt-1" style={{ color: 'var(--success)' }}>{formatVND(mySlip.netSalary)}</div>
            </div>
            <div className="card"><PayslipDetail slip={mySlip} /></div>
          </div>
        )}
      </div>

      {/* INTERACTIVE MODAL: THÊM PHIẾU CỘNG TIỀN / TRỪ TIỀN */}
      {(activeModal === 'add_bonus' || activeModal === 'add_deduction') && modalTargetEmp && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100 transition-all">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-gray-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <h3 className="text-lg font-bold text-gray-900">
                {activeModal === 'add_bonus' ? 'Thêm phiếu cộng tiền' : 'Thêm phiếu trừ tiền'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-600 rounded-lg p-1.5 hover:bg-primary-50 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="p-6 space-y-4.5 max-h-[82vh] overflow-y-auto text-xs">
              {/* Employee info badge */}
              <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-sky-600 uppercase font-bold tracking-wider">NHÂN VIÊN THỤ HƯỞNG</span>
                  <div className="font-extrabold text-gray-900 text-base mt-0.5">{String(modalTargetEmp.name || '')}</div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-sky-600 uppercase font-bold tracking-wider">MÃ NV</span>
                  <div className="font-mono font-black text-sky-700 text-sm mt-0.5">{String(modalTargetEmp.code || '')}</div>
                </div>
              </div>

              {/* Chi nhánh */}
              <div>
                <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                  Chi nhánh <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedStore}
                  onChange={e => setSelectedStore(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold focus:border-sky-500 focus:outline-none cursor-pointer text-xs shadow-2xs"
                >
                  <option value="all">HBP - Trà sữa phô mai tươi HOMIES</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Loại phiếu */}
              <div>
                <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                  Loại phiếu <span className="text-rose-500">*</span>
                </label>
                <select
                  value={ticketType}
                  onChange={e => setTicketType(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold focus:border-sky-500 focus:outline-none cursor-pointer text-xs shadow-2xs"
                >
                  {activeModal === 'add_bonus' ? (
                    <>
                      <option value="Phiếu thưởng">Phiếu thưởng</option>
                      <option value="Phiếu cộng tiền khác">Phiếu cộng tiền khác</option>
                      <option value="Phiếu cộng tiền tự định nghĩa">Phiếu cộng tiền tự định nghĩa</option>
                    </>
                  ) : (
                    <>
                      <option value="Phiếu phạt">Phiếu phạt</option>
                      <option value="Phiếu phạt trang phục">Phiếu phạt trang phục</option>
                      <option value="Phiếu trừ tiền khác">Phiếu trừ tiền khác</option>
                      <option value="Phiếu trừ tiền tự định nghĩa">Phiếu trừ tiền tự định nghĩa</option>
                    </>
                  )}
                </select>
              </div>

              {/* Chọn loại phiếu tự định nghĩa (Kèm link Tạo phiếu tự định nghĩa - Chuẩn Photo 2 & 3) */}
              {(ticketType.includes('tự định nghĩa')) && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-gray-800 font-bold text-xs">
                      {activeModal === 'add_bonus' ? 'Chọn loại phiếu cộng tiền tự định nghĩa' : 'Chọn loại phiếu trừ tiền tự định nghĩa'} <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => router.push('/settings/payroll?tab=tickets')}
                      className="text-xs text-sky-600 font-bold hover:underline cursor-pointer"
                    >
                      Tạo phiếu tự định nghĩa
                    </button>
                  </div>
                  <select
                    onChange={e => {
                      const val = e.target.value
                      if (val === 'Thưởng chuyên cần') setTicketAmount(100000)
                      else if (val === 'Thưởng gương mẫu') setTicketAmount(100000)
                      else if (val === 'Team truyền thông') setTicketAmount(1200000)
                      else if (val === 'Phụ cấp chức vụ senior') setTicketAmount(200000)
                      else if (val === 'Phạt Lỗi Vận Hành') setTicketAmount(5000)
                      else if (val === 'Lỗi Vận Hành') setTicketAmount(10000)
                      else setTicketAmount(0)
                    }}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold focus:border-sky-500 focus:outline-none cursor-pointer text-xs shadow-2xs"
                  >
                    {activeModal === 'add_bonus' ? (
                      <>
                        <option value="Thưởng doanh thu">Thưởng doanh thu (0đ)</option>
                        <option value="Thưởng chuyên cần">Thưởng chuyên cần (100.000đ)</option>
                        <option value="Thưởng gương mẫu">Thưởng gương mẫu (100.000đ)</option>
                        <option value="Team truyền thông">Team truyền thông (1.200.000đ)</option>
                        <option value="Phụ cấp chức vụ senior">Phụ cấp chức vụ senior (200.000đ)</option>
                        <option value="Phụ Cấp Hỗ Trợ Vận Hành Quán">Phụ Cấp Hỗ Trợ Vận Hành Quán (0đ)</option>
                      </>
                    ) : (
                      <>
                        <option value="Phạt Lỗi Vận Hành">Phạt Lỗi Vận Hành (5.000đ)</option>
                        <option value="Lỗi Vận Hành">Lỗi Vận Hành (10.000đ)</option>
                        <option value="Phiếu trừ tiền tự định nghĩa khác">Phiếu trừ tiền tự định nghĩa khác</option>
                      </>
                    )}
                  </select>
                </div>
              )}

              {/* Nhân viên được cộng / Nhân viên bị trừ (Chuẩn Photo 3 & 4) */}
              <div>
                <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                  {activeModal === 'add_bonus' ? 'Nhân viên được cộng' : 'Nhân viên bị trừ'} <span className="text-rose-500">*</span>
                </label>
                <select
                  value={String(modalTargetEmp.id || '')}
                  onChange={e => {
                    const emp = filteredTableRows.find(r => r.id === e.target.value) || tableData.find(r => r.id === e.target.value)
                    if (emp) setModalTargetEmp(emp)
                  }}
                  className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold focus:border-sky-500 focus:outline-none cursor-pointer text-xs shadow-2xs"
                >
                  {tableData.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                  ))}
                </select>
              </div>

              {/* Cộng/trừ tiền cho & Ngày được cộng / Ngày bị trừ */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                    {activeModal === 'add_bonus' ? 'Cộng tiền cho' : 'Trừ tiền cho'} <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={ticketScope}
                    onChange={e => setTicketScope(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold focus:border-sky-500 focus:outline-none cursor-pointer text-xs shadow-2xs"
                  >
                    <option value="date">Ngày cụ thể</option>
                    <option value="period">Chu kỳ lương</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                    {ticketScope === 'period'
                      ? 'Chu kỳ áp dụng *'
                      : (activeModal === 'add_bonus' ? 'Ngày được cộng *' : 'Ngày bị trừ *')}
                  </label>
                  {ticketScope === 'period' ? (
                    <select
                      value={selectedPeriod}
                      onChange={e => setSelectedPeriod(e.target.value)}
                      className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold focus:border-sky-500 focus:outline-none cursor-pointer text-xs shadow-2xs"
                    >
                      {mockPayrollPeriods.map(p => (
                        <option key={p.id} value={p.period}>
                          Kỳ tháng {p.period.split('-')[1]}/{p.period.split('-')[0]} (01/{p.period.split('-')[1]} - {getPayrollPeriodBounds(p.period).endDay}/{p.period.split('-')[1]})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="relative">
                      <input
                        type="text"
                        value={ticketDate}
                        onChange={e => setTicketDate(e.target.value)}
                        className="w-full p-3 rounded-xl border border-gray-200 text-gray-800 font-semibold focus:border-sky-500 focus:outline-none text-xs shadow-2xs"
                      />
                      <Calendar size={16} className="absolute right-3.5 top-3.5 text-gray-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Hình thức & Giá trị */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                    {activeModal === 'add_bonus' ? 'Hình thức cộng *' : 'Hình thức trừ *'}
                  </label>
                  <select
                    value={ticketCalcType}
                    onChange={e => setTicketCalcType(e.target.value)}
                    className="w-full p-3 rounded-xl border border-gray-200 bg-white text-gray-800 font-semibold focus:border-sky-500 focus:outline-none cursor-pointer text-xs shadow-2xs"
                  >
                    <option value="amount">{activeModal === 'add_bonus' ? 'Cộng tiền' : 'Trừ tiền'}</option>
                    <option value="percent">{activeModal === 'add_bonus' ? 'Cộng phần trăm lương' : 'Trừ phần trăm lương'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-800 font-bold mb-1.5 text-xs">
                    {activeModal === 'add_bonus' ? 'Giá trị cộng thêm *' : 'Giá trị trừ đi *'}
                  </label>
                  <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-sky-500 shadow-2xs">
                    <input
                      type="number"
                      placeholder="0"
                      value={ticketAmount || ''}
                      onChange={e => setTicketAmount(Number(e.target.value))}
                      className="flex-1 p-3 text-gray-900 font-black text-sm focus:outline-none"
                    />
                    <span className="bg-slate-50 text-slate-600 px-3.5 py-3 border-l border-gray-200 font-bold text-xs flex items-center">
                      {ticketCalcType === 'percent' ? '%' : 'VNĐ'}
                    </span>
                  </div>
                    {/* Dynamic Calculation Indicator */}
                    {ticketCalcType === 'percent' && (
                      <div className="text-[11px] text-emerald-600 font-bold mt-1">
                      💡 {ticketAmount || 0}% lương cơ bản tương đương: {activeModal === 'add_bonus' ? '+' : '-'}{formatVND(Math.round(((ticketAmount || 0) / 100) * (Number(modalTargetEmp.baseSalary) || 0)))}
                      </div>
                    )}
                </div>
              </div>

              {/* Info Notification Banner matching reference screenshots 2, 3 & 4 */}
              <div className="p-3.5 rounded-xl bg-sky-50/90 border border-sky-100 text-sky-900 leading-relaxed text-xs font-medium space-y-1">
                {activeModal === 'add_deduction' && ticketCalcType === 'percent' ? (
                  <div>
                    <strong>Trừ phần trăm lương:</strong> Dựa vào chu kỳ áp dụng bạn chọn ở trên là ngày cụ thể hay chu kỳ lương thì vào ngày đó hay chu kỳ lương đó, nhân viên sẽ bị trừ đi <strong>{ticketAmount || 0}%</strong> tiền lương (không bao gồm phụ cấp, thưởng, phạt vv theo ngày/ theo chu kỳ được chọn)
                  </div>
                ) : activeModal === 'add_deduction' ? (
                  <div>
                    Giá trị tiền mà bạn khai báo tại đây sẽ được trừ vào lương của nhân viên theo ngày hoặc chu kỳ lương mà bạn khai báo ở trên.
                  </div>
                ) : (
                  <div>
                    Giá trị tiền mà bạn khai báo tại đây sẽ được cộng vào lương của nhân viên theo ngày hoặc chu kỳ lương mà bạn khai báo ở trên.
                  </div>
                )}
                <div className="text-[11px] text-sky-700 font-semibold">
                  Nếu chi nhánh là Công ty ➔ Phiếu {activeModal === 'add_bonus' ? 'cộng' : 'trừ'} tiền sẽ cộng/trừ vào Lương theo công ty của nhân viên
                </div>
              </div>

              {/* Ghi chú */}
              <div>
                <label className="block text-gray-800 font-bold mb-1.5 text-xs">Ghi chú lý do</label>
                <textarea
                  rows={3}
                  placeholder="Nhập ghi chú lý do..."
                  value={ticketNote}
                  onChange={e => setTicketNote(e.target.value)}
                  className="w-full p-3 rounded-xl border border-gray-200 text-gray-800 focus:border-sky-500 focus:outline-none resize-none text-xs shadow-2xs"
                />
              </div>

              {/* AUDIT GAP FIX: Real Image File Upload & Preview */}
              <div>
                <label className="block text-gray-800 font-bold mb-1.5 text-xs">Ảnh đính kèm / Chứng từ</label>
                {ticketAttachedImage ? (
                  <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 group">
                    <Image src={ticketAttachedImage} alt="Chứng từ" fill className="object-cover" />
                    <button
                      onClick={() => setTicketAttachedImage(null)}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 transition-all"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-slate-200 hover:border-sky-500 flex flex-col items-center justify-center text-slate-400 hover:text-sky-600 transition-all cursor-pointer bg-slate-50/60"
                  >
                    <ImageIcon size={26} />
                    <span className="text-[10px] mt-1.5 text-slate-500 font-semibold">Tải ảnh lên</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="px-6 py-4 bg-slate-50 border-t border-gray-100 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setActiveModal(null)}
                className="btn bg-slate-500 hover:bg-slate-600 text-white text-xs py-2.5 px-5 rounded-xl border-0 font-semibold cursor-pointer"
              >
                Bỏ qua
              </button>
              <button
                onClick={handleSaveTicket}
                className="btn bg-sky-600 hover:bg-sky-500 text-white text-xs py-2.5 px-6 rounded-xl border-0 font-bold cursor-pointer shadow-sm"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4 MODAL: THANH TOÁN LƯƠNG & VIETQR */}
      {activeModal === 'pay_salary' && modalTargetEmp && (
        <PayrollPaymentModal
          modalTargetEmp={modalTargetEmp}
          periodLabel={periodLabel}
          bankAccount={modalTargetEmp.bankAccount as PayrollPaymentBankAccount | null | undefined}
          payAmount={payAmount}
          setPayAmount={setPayAmount}
          payMethod={payMethod}
          setPayMethod={setPayMethod}
          payNote={payNote}
          setPayNote={setPayNote}
          paymentProofUrl={payProofUrl}
          setPaymentProofUrl={setPayProofUrl}
          onClose={() => setActiveModal(null)}
          onConfirmPay={async () => {
            const empId = String(modalTargetEmp.id || '')
            const amount = Number(payAmount)
            if (!Number.isFinite(amount) || amount <= 0) {
              alert('Số tiền thanh toán phải lớn hơn 0.')
              return
            }

            const bankAccount = modalTargetEmp.bankAccount as PayrollPaymentBankAccount | null | undefined
            const saved = await payrollAdapter.recordPayment({
              periodId: selectedPeriod,
              employeeId: empId,
              payslipStatus: String(modalTargetEmp.status || ''),
              amount,
              paymentMethod: payMethod as PayrollPaymentMethod,
              bankName: bankAccount?.bankName,
              accountNumber: bankAccount?.accountNumber,
              accountName: bankAccount?.accountName,
              note: payNote,
              proofUrl: payProofUrl || undefined,
            })
            if (!saved) {
              alert('Không thể lưu xác nhận thanh toán. Vui lòng kiểm tra kỳ lương và thử lại.')
              return
            }

            setStatusOverrides(prev => ({ ...prev, [empId]: 'Đã thanh toán' }))
            alert(`Đã xác nhận thanh toán lương thành công cho ${modalTargetEmp.name}!`)
            setActiveModal(null)
            setModalTargetEmp(null)
          }}
        />
      )}

      {/* STEP 3 MODAL: CÀI ĐẶT HIỂN THỊ CỘT BẢNG LƯƠNG */}
      {activeModal === 'column_settings' && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-amber-400" />
                <h3 className="text-base font-bold">Cài đặt hiển thị cột bảng lương</h3>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-white rounded-lg p-1 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="text-slate-600 font-semibold">
                  Đã chọn: <span className="text-sky-600 font-extrabold">{visibleColumnCount}</span> / 29 cột
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const next: Record<string, boolean> = {}
                      Object.keys(DEFAULT_COLUMN_VISIBILITY).forEach(k => { next[k] = true })
                      setColumnVisibility(next)
                    }}
                    className="btn bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 py-1 px-2.5 text-[11px] gap-1 cursor-pointer"
                  >
                    <CheckSquare size={12} /> Chọn tất cả
                  </button>
                  <button
                    onClick={() => {
                      const next: Record<string, boolean> = {}
                      Object.keys(DEFAULT_COLUMN_VISIBILITY).forEach(k => { next[k] = false })
                      next.employee = true
                      next.netSalary = true
                      next.actions = true
                      setColumnVisibility(next)
                    }}
                    className="btn bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 py-1 px-2.5 text-[11px] gap-1 cursor-pointer"
                  >
                    <Square size={12} /> Bỏ chọn tất cả
                  </button>
                  <button
                    onClick={() => {
                      const next: Record<string, boolean> = {}
                      Object.keys(DEFAULT_COLUMN_VISIBILITY).forEach(k => {
                        next[k] = DEFAULT_COLUMN_VISIBILITY[k].visible
                      })
                      setColumnVisibility(next)
                    }}
                    className="btn bg-slate-200 hover:bg-slate-300 text-slate-800 py-1 px-2.5 text-[11px] gap-1 cursor-pointer"
                  >
                    <RotateCcw size={12} /> Mặc định
                  </button>
                </div>
              </div>

              {['Cơ bản', 'Công & Giờ', 'Lương & Phụ cấp', 'Thưởng & Phạt', 'Khấu trừ khác', 'Thực nhận', 'Quản lý'].map(cat => {
                const catKeys = Object.keys(DEFAULT_COLUMN_VISIBILITY).filter(
                  k => DEFAULT_COLUMN_VISIBILITY[k].category === cat
                )
                if (catKeys.length === 0) return null

                return (
                  <div key={cat} className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider bg-slate-100 px-2.5 py-1 rounded-md">
                      {cat}
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {catKeys.map(key => {
                        const col = DEFAULT_COLUMN_VISIBILITY[key]
                        const isChecked = !!columnVisibility[key]

                        return (
                          <label
                            key={key}
                            className={`flex items-center gap-2 p-2 rounded-xl border transition-all cursor-pointer text-xs ${
                              isChecked
                                ? 'bg-sky-50/80 border-sky-300 text-sky-900 font-semibold shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={e => setColumnVisibility(prev => ({ ...prev, [key]: e.target.checked }))}
                              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500 w-4 h-4 cursor-pointer"
                            />
                            <span className="truncate">{col.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="px-5 py-3.5 bg-vanilla-50 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">Các cột bị ẩn sẽ tự động hiển thị lại khi chọn</span>
              <button
                onClick={() => setActiveModal(null)}
                className="btn bg-sky-600 hover:bg-sky-500 text-white text-xs py-2 px-5 rounded-xl font-semibold cursor-pointer shadow-xs"
              >
                Hoàn tất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN MODAL: LƯƠNG TỪNG NGÀY CỦA NHÂN VIÊN */}
      {activeModal === 'view_daily_salary' && modalTargetEmp && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Lương từng ngày của {String(modalTargetEmp.name || '')}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  {String(modalTargetEmp.email || '')}
                </p>
              </div>
              <button
                onClick={() => setActiveModal(null)}
                className="text-slate-400 hover:text-slate-700 rounded-lg p-1.5 hover:bg-slate-100 transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 overflow-auto flex-1">
              <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 border-b border-slate-200 font-bold text-[11px]">
                    <th className="p-2.5 text-center w-10 border-r border-slate-200">#</th>
                    <th className="p-2.5 border-r border-slate-200 min-w-[100px]">Ngày</th>
                    <th className="p-2.5 border-r border-slate-200 text-center min-w-[60px]">Số ca</th>
                    <th className="p-2.5 border-r border-slate-200 text-right min-w-[80px]">Giờ thực tế</th>
                    <th className="p-2.5 border-r border-slate-200 text-right min-w-[85px]">Giờ thường</th>
                    <th className="p-2.5 border-r border-slate-200 text-right min-w-[85px]">Giờ tăng ca</th>
                    <th className="p-2.5 border-r border-slate-200 text-right min-w-[95px]">Giờ tính lương</th>
                    <th className="p-2.5 border-r border-slate-200 text-right min-w-[100px]">Lương hệ số</th>
                    <th className="p-2.5 border-r border-slate-200 text-right min-w-[105px]">Lương ngày</th>
                    <th className="p-2.5 border-r border-slate-200 text-right min-w-[80px]">Phụ cấp</th>
                    <th className="p-2.5 border-r border-slate-200 text-right min-w-[110px]">Phiếu cộng tiền</th>
                    <th className="p-2.5 border-r border-slate-200 text-right min-w-[70px]">Phạt</th>
                    <th className="p-2.5 border-r border-slate-200 text-right min-w-[110px]">Phiếu trừ tiền</th>
                    <th className="p-2.5 text-right font-extrabold text-slate-900 bg-sky-50/50 min-w-[120px]">Lương thực nhận</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {dailySalaryRows.map((d) => (
                    <tr key={d.stt} className="hover:bg-sky-50/30 transition-colors">
                      <td className="p-2.5 text-center text-slate-400 font-mono border-r border-slate-100">{d.stt}</td>
                      <td className="p-2.5 border-r border-slate-100 font-medium text-sky-600 hover:underline cursor-pointer">{d.date}</td>
                      <td className="p-2.5 border-r border-slate-100 text-center font-medium text-slate-700">{d.shifts}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-mono text-slate-700">{d.actualHours}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-mono text-slate-600">{d.regularHours}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-mono text-amber-600">{d.otHours}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-mono text-slate-800 font-semibold">{d.calcHours}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-mono text-sky-600 font-medium">{formatVND(d.coeffSalary)}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-mono text-slate-800">{formatVND(d.dailySalary)}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-mono text-slate-500">{d.allowance}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-mono text-emerald-600">{d.bonus}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-mono text-rose-600">{d.penalty > 0 ? formatVND(d.penalty) : '0'}</td>
                      <td className="p-2.5 border-r border-slate-100 text-right font-mono text-rose-600">{d.deduction}</td>
                      <td className="p-2.5 text-right font-bold text-slate-900 font-mono bg-sky-50/40">{formatVND(d.netDaily)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-700 font-medium">
              <div>Tổng cộng <strong>{dailySalaryRows.length}</strong> ngày có dữ liệu chấm công trong kỳ</div>
              <div className="flex items-center gap-2">
                <span>Tổng thực nhận tháng:</span>
                <strong className="text-emerald-700 text-base font-extrabold">
                  {formatVND(Number(modalTargetEmp.netSalary) || 0)}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL VIEW PAYSLIP DETAIL */}
      {activeModal === 'view_slip' && modalTargetEmp && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-primary-900 text-white">
              <div>
                <div className="text-xs opacity-80">Phiếu lương chi tiết</div>
                <h3 className="text-base font-bold">{String(modalTargetEmp.name || '')}</h3>
              </div>
              <button onClick={() => setActiveModal(null)} className="text-white/80 hover:text-white rounded-lg p-1">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Mã NV / Vị trí</span>
                <span className="font-semibold text-gray-800">{String(modalTargetEmp.code || '')} • {String(modalTargetEmp.department || '')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Lương cơ bản</span>
                <span className="font-semibold text-gray-800">{String(modalTargetEmp.baseSalaryFormatted || '')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Lương ngày công</span>
                <span className="font-semibold text-gray-800">{formatVND(Number(modalTargetEmp.workedSalary) || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Thưởng / Phiếu cộng</span>
                <span className="font-semibold text-emerald-600">+{formatVND(Number(modalTargetEmp.bonusTickets) || 0)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-500">Phạt / Khấu trừ</span>
                <span className="font-semibold text-rose-600">-{formatVND((Number(modalTargetEmp.totalPenalties) || 0) + (Number(modalTargetEmp.deductionTickets) || 0))}</span>
              </div>
              <div className="flex justify-between py-2 border-t border-gray-200 text-sm font-bold bg-emerald-50 px-3 rounded-xl mt-3">
                <span className="text-gray-900">Thực nhận (NET)</span>
                <span className="text-emerald-700">{formatVND(Number(modalTargetEmp.netSalary) || 0)}</span>
              </div>
            </div>
            <div className="px-5 py-3.5 bg-vanilla-50 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                onClick={() => window.print()}
                className="btn bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs py-1.5 px-3 rounded-xl border-0 font-medium cursor-pointer"
              >
                🖨️ In phiếu
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const emp = modalTargetEmp
                    setActiveModal(null)
                    openPaySalaryModal(emp)
                  }}
                  className="btn bg-emerald-600 hover:bg-emerald-500 text-white text-xs py-1.5 px-3 rounded-xl border-0 font-semibold cursor-pointer shadow-2xs"
                >
                  💳 Thanh toán VietQR
                </button>
                <button onClick={() => setActiveModal(null)} className="btn bg-slate-500 hover:bg-slate-600 text-white text-xs py-1.5 px-3 rounded-xl border-0 cursor-pointer">
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}

function PayslipDetail({ slip }: { slip: PayrollTableRow }) {
  return (
    <div className="px-3 pb-3 space-y-1.5 border-t" style={{ borderColor: 'var(--gray-100)' }}>
      <div className="pt-2" />
      {[
        { label: 'Lương theo công', val: slip.workedSalary, color: '' },
        { label: `Tăng ca (${slip.otHours}h)`, val: slip.otSalary, color: 'var(--primary)' },
        { label: 'Thưởng / phiếu cộng', val: slip.bonusTickets + slip.kpiSalary, color: 'var(--success)' },
        { label: 'Phụ cấp', val: slip.allowances, color: '' },
        { label: 'Phạt', val: -slip.totalPenalties, color: 'var(--error)' },
        { label: 'Phiếu trừ tiền', val: -slip.deductionTickets, color: 'var(--error)' },
        { label: 'Bảo hiểm', val: -slip.insurance, color: '' },
        { label: 'Thuế TNCN', val: -slip.tax, color: '' },
        { label: 'Tạm ứng', val: -slip.advanceSalary, color: '' },
      ].filter(r => r.val !== 0).map((row, i) => (
        <div key={i} className="flex justify-between text-xs py-1">
          <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
          <span className="font-medium" style={{ color: row.val < 0 ? 'var(--error)' : row.color || 'var(--text-primary)' }}>
            {row.val > 0 ? '+' : ''}{formatVND(row.val)}
          </span>
        </div>
      ))}
      <div className="flex justify-between text-sm font-bold pt-2 border-t" style={{ borderColor: 'var(--gray-200)' }}>
        <span>Thực nhận</span>
        <span style={{ color: 'var(--success)' }}>{formatVND(slip.netSalary)}</span>
      </div>
    </div>
  )
}
