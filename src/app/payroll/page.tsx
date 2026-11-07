'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Image from 'next/image'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { mockStores, mockEmployees, mockPositions, type Employee } from '@/lib/mock-data'
import { mockPayrollPeriods, formatVND } from '@/lib/mock-data-p4'
import { calculatePayrollBatchAsync, getPayrollPeriodBounds, parseTimeToHours, type LateIncident } from '@/lib/payroll-engine'
import { AttendanceService, type PayrollAttendanceRecord } from '@/lib/services/attendance/attendance-service'
import { getInitials } from '@/lib/utils'
import { payrollAdapter, storeAdapter, employeeAdapter, MasterDataAdapter } from '@/lib/adapters'
import { payrollPeriodAdapter } from '@/lib/adapters/payroll-period-adapter'
import {
  PAYROLL_PERIOD_STATUS,
  type PayrollPeriodStatus,
  PERIOD_STATUS_LABEL_VI,
  PERIOD_STATUS_BADGE,
  canEditPeriod,
  canClosePeriod,
} from '@/lib/payroll/payroll-status'
import { PayrollPaymentModal, type PayrollPaymentBankAccount } from '@/components/payroll/PayrollPaymentModal'
import type { PayrollPaymentMethod } from '@/lib/payroll-payment-ledger'
import { fetchRemotePayrollPolicy, saveStoredPayrollPolicy, getStoredPayrollPolicy, getActivePayrollPolicy } from '@/lib/services/payroll-policy-service'
import PayrollHourlyRateDrawer, { type HourlyRateDrawerTarget } from '@/components/payroll/PayrollHourlyRateDrawer'
import {
  DollarSign, TrendingUp, ChevronDown, FileText,
  Search, RefreshCw, Download, Building2, Store, PlusCircle, MinusCircle,
  Eye, Send, Plus, MoreHorizontal, X, Calendar, Image as ImageIcon,
  SlidersHorizontal, CheckSquare, Square, RotateCcw, CreditCard, Lock, Unlock, ShieldCheck, Info, AlertTriangle, Clock, Sparkles, ArrowRight, Coins,
  Printer, ExternalLink, Edit3
} from 'lucide-react'

function applyNetRounding(net: number, method?: string): number {
  switch (method) {
    case 'none':
      return net
    case 'round_5000':
      return Math.round(net / 5000) * 5000
    case 'round_10000':
      return Math.round(net / 10000) * 10000
    case 'round_1000':
    default:
      return Math.round(net / 1000) * 1000
  }
}

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
  workedSalary: { label: 'Lương chính (Công/Giờ)', visible: true, category: 'Lương & Phụ cấp' },
  allowances: { label: 'Tổng phụ cấp', visible: true, category: 'Lương & Phụ cấp' },
  bonusTickets: { label: 'Tổng phiếu cộng tiền', visible: true, category: 'Thưởng & Phạt' },
  totalPenalties: { label: 'Tổng phạt', visible: true, category: 'Thưởng & Phạt' },
  deductionTickets: { label: 'Tổng phiếu trừ tiền', visible: true, category: 'Thưởng & Phạt' },
  kpiSalary: { label: 'Lương KPI', visible: true, category: 'Thưởng & Phạt' },
  grossSalary: { label: 'Tổng lương (GROSS)', visible: true, category: 'Thực nhận' },
  insurance: { label: 'Bảo hiểm (BHXH, BHYT, BHTN)', visible: true, category: 'Khấu trừ khác' },
  tax: { label: 'Thuế TNCN', visible: true, category: 'Khấu trừ khác' },
  unionFee: { label: 'Tiền công đoàn', visible: true, category: 'Khấu trừ khác' },
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
  secondaryStoreIds: string[]
  secondaryStoreNames: string[]
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
  anomalies: { type: string; date?: string; message: string }[]
  lateCount: number
  lateIncidents: LateIncident[]
}

type PayrollRowBankAccount = Omit<PayrollPaymentBankAccount, 'bankCode'> & {
  bankCode: string | undefined
}

type PayrollEmployee = Employee & {
  bank_name?: string
  bank_account_no?: string
  bank_account_holder?: string
  hourly_rate?: number
}

type ApiSalarySlip = {
  id: string
  employee_id: string
  employee_name?: string
  employee_code?: string
  position?: string
  store_id?: string
  period: string
  work_days?: number
  standard_days?: number
  base_salary?: number
  allowances?: number
  bonus?: number
  deductions?: number
  late_deduction?: number
  net_salary?: number
  total_hours?: number
  status?: string
}

type LegacyPayrollSlip = {
  nhan_vien_id: string
  ma_nhan_vien?: string
  ho_ten?: string
  loai_nhan_vien?: string
  bo_phan?: string
  so_ngay_cong_chuan?: number
  so_ngay_cong_thuc_te?: number
  gio_cong_thuc_te?: number
  so_ca?: number
  tong_so_gio?: number
  luong_theo_gio?: number
  so_gio_tang_ca?: number
  tien_tang_ca?: number
  tong_phu_cap?: number
  tong_phieu_cong?: number
  tong_phat?: number
  ung_luong?: number
  tong_phieu_tru?: number
  luong_co_ban?: number
  phu_cap?: number
  thuong?: number
  phat?: number
  khau_tru_di_muon?: number
  bao_hiem?: number
  tong_luong?: number
  luong_thuc_nhan?: number
  luong_kpi?: number
  tien_cong_doan?: number
  giu_luong?: number
  hoan_giu_luong?: number
}

// ISSUE-06: Cấu hình hiển thị anomaly theo loại (module-level, không render lại)
const ANOMALY_CONFIG: Record<string, { label: string; severity: 'error' | 'warning' | 'info' }> = {
  thieu_don_gia_gio:   { label: 'Thiếu đơn giá giờ (bán thời gian)',   severity: 'error' },
  thieu_luong_co_ban:  { label: 'Thiếu lương cơ bản',                    severity: 'error' },
  thieu_loai_hop_dong: { label: 'Thiếu loại hợp đồng',                   severity: 'warning' },
  ca_chua_duyet:       { label: 'Ca chưa được duyệt',                   severity: 'warning' },
  quen_checkout:       { label: 'Quên check-out',                        severity: 'warning' },
}

export default function PayrollPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const isCeo = Boolean(user && (user.id === 'emp-001' || user.role === 'ceo'))
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState('2026-08')
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
  const [rateDrawerTarget, setRateDrawerTarget] = useState<HourlyRateDrawerTarget | null>(null)

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
  const [policyUnavailable, setPolicyUnavailable] = useState(false)
  const [dailyAttendanceRecords, setDailyAttendanceRecords] = useState<PayrollAttendanceRecord[]>([])
  const [payrollReloadKey, setPayrollReloadKey] = useState(0)
  const [policySource, setPolicySource] = useState<'system' | 'cache' | null>(null)
  const [policyInfo, setPolicyInfo] = useState<{days: number, hours: number} | null>(null)
  const [payrollPeriodStatus, setPayrollPeriodStatus] = useState<PayrollPeriodStatus>(PAYROLL_PERIOD_STATUS.DRAFT)
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

    const saved = payrollAdapter.getSavedPeriodOverrides(selectedPeriod)
    setBonusOverrides(saved.bonusOverrides)
    setDeductionOverrides(saved.deductionOverrides)

    payrollAdapter.getPaymentStatuses(selectedPeriod).then(statuses => {
      if (isMounted) {
        setStatusOverrides({ ...saved.statusOverrides, ...statuses })
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

    const loadPayrollData = async () => {
      try {
        // 1. Ưu tiên đọc trực tiếp phiếu lương đã chốt/tính từ Database máy chủ (/api/payroll)
        const apiRes = await fetch(`/api/payroll?period=${selectedPeriod}`)
        if (apiRes.ok) {
          const apiData = await apiRes.json()
          if (apiData?.success && Array.isArray(apiData.salary_slips) && apiData.salary_slips.length > 0) {
            if (!isMounted) return
            const sourceEmployees: PayrollEmployee[] = employees.length > 0 ? employees : (mockEmployees as PayrollEmployee[])
            const sourcePositions = positions.length > 0 ? positions : mockPositions
            const sourceStores = stores.length > 0 ? stores : mockStores

            const mappedResults = apiData.salary_slips.map((s: ApiSalarySlip) => {
              const emp = sourceEmployees.find(e => e.id === s.employee_id) || (mockEmployees.find(e => e.id === s.employee_id) as PayrollEmployee | undefined)
              const pos = sourcePositions.find(p => p.id === emp?.position_id)
              const slipStoreId = s.store_id || emp?.store_id || 'store-001'
              const store = sourceStores.find(st => st.id === slipStoreId)
              const isPartTime = (s.base_salary === 0 && ((s.total_hours || 0) > 0 || (s.net_salary || 0) > 0)) || emp?.contract_type === 'ban_thoi_gian' || s.position?.includes('pha chế') || s.position?.includes('phục vụ') || false
              const hourlyRate = (emp as PayrollEmployee)?.hourly_rate || (isPartTime && (s.total_hours || 0) > 0 ? Math.round(((s.net_salary || 0) - (s.bonus || 0)) / (s.total_hours || 1)) : (isPartTime ? 20000 : 0))

              return {
                employee_id: s.employee_id,
                employee_code: emp?.employee_code || s.employee_code || '',
                employee_name: emp?.full_name || s.employee_name || 'Nhân viên',
                is_resigned_employee: emp?.status === 'inactive',
                is_part_time: isPartTime,
                position: s.position || pos?.name || '',
                store_id: slipStoreId,
                store: store?.name || '',
                period: selectedPeriod,
                standard_days: s.standard_days || 26,
                work_days: s.work_days || 0,
                leave_days_paid: 0,
                leave_days_unpaid: 0,
                absent_days: 0,
                late_count: 0,
                soCaChoDuyet: 0,
                soCaChuaCheckOut: 0,
                total_hours: s.total_hours || 0,
                base_salary: isPartTime ? hourlyRate : (s.base_salary || 0),
                base_earned: isPartTime ? Math.round((s.total_hours || 0) * hourlyRate) : (s.base_salary || 0),
                overtime_hours: 0,
                overtime_amount: 0,
                allowances: [],
                total_allowances: s.allowances || 0,
                bonuses: [],
                total_bonuses: s.bonus || 0,
                fnb_service_charge_pool: 0,
                fnb_tip_pool: 0,
                fnb_fnb_share: 0,
                fnb_allocation_points: 0,
                fnb_allocation_breakdown: [],
                total_earnings: s.net_salary || 0,
                late_deduction: 0,
                absent_deduction: 0,
                advance_deduction: 0,
                other_deductions: [],
                total_other_deductions: s.deductions || 0,
                total_deductions: s.deductions || 0,
                bhxh: 0,
                bhyt: 0,
                bhtn: 0,
                total_insurance: 0,
                taxable_income: 0,
                tax: 0,
                gross_salary: s.net_salary || 0,
                net_salary: s.net_salary || 0,
                kpi_salary: 0,
                union_fee: 0,
                hold_salary: 0,
                return_hold_salary: 0,
              }
            })

            setPayrollPeriodStatus(PAYROLL_PERIOD_STATUS.CONFIRMED)
            setPolicySource('system')
            setPolicyInfo({ days: 26, hours: 8 })
            setPayrollResults(mappedResults as unknown as Awaited<ReturnType<typeof calculatePayrollBatchAsync>>)
            setIsPayrollLoading(false)
            return
          }
        }
      } catch (apiErr) {
        console.warn('[Payroll] /api/payroll fetch error, falling back to adapter:', apiErr)
      }

      payrollPeriodAdapter.fetchPayrollPeriod(thang, nam).then(period => {
        if (!isMounted) return

        if (period && !canEditPeriod(period.trang_thai)) {
          setPayrollPeriodStatus(period.trang_thai as PayrollPeriodStatus)
          setPolicySource('system')
          setPolicyInfo({ days: 26, hours: 8 })
          
          payrollPeriodAdapter.fetchPayrollSlips(period.id).then(slips => {
            const sourceEmployees: PayrollEmployee[] = employees.length > 0 ? employees : (mockEmployees as PayrollEmployee[])
            const sourcePositions = positions.length > 0 ? positions : mockPositions
            const sourceStores = stores.length > 0 ? stores : mockStores

            const mappedResults = slips.map((s: LegacyPayrollSlip) => {
              const emp = sourceEmployees.find(e => e.id === s.nhan_vien_id) || (mockEmployees.find(e => e.id === s.nhan_vien_id) as PayrollEmployee | undefined)
              const pos = sourcePositions.find(p => p.id === emp?.position_id)
              const store = sourceStores.find(st => st.id === emp?.store_id)
              const isPartTime = s.loai_nhan_vien?.includes('Bán thời gian') || emp?.contract_type === 'ban_thoi_gian' || false

              return {
                employee_id: s.nhan_vien_id,
                employee_code: emp?.employee_code || s.ma_nhan_vien || '',
                employee_name: emp?.full_name || s.ho_ten || 'Nhân viên',
                is_resigned_employee: emp?.status === 'inactive',
                is_part_time: isPartTime,
                position: s.bo_phan || pos?.name || '',
                store: store?.name || '',
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
              }
            })
            setPayrollResults(mappedResults as unknown as Awaited<ReturnType<typeof calculatePayrollBatchAsync>>)
            setIsPayrollLoading(false)
          })
        } else {
          setPayrollPeriodStatus(PAYROLL_PERIOD_STATUS.DRAFT)
          fetchRemotePayrollPolicy().then(dbPolicy => {
            if (dbPolicy) {
              saveStoredPayrollPolicy(dbPolicy)
              if (isMounted) {
                setPolicyUnavailable(false)
                setPolicySource('system')
                setPolicyInfo({ days: dbPolicy.standardDaysPerMonth || 26, hours: dbPolicy.standardHoursPerDay || 8 })
              }
              return calculatePayrollBatchAsync(periodStart, periodEnd)
            } else {
              if (isMounted) {
                setPolicyUnavailable(true)
                setPayrollError('Chưa tải được cấu hình lương, vui lòng thử lại.')
                setPayrollResults([])
                setIsPayrollLoading(false)
              }
              return null
            }
          })
            .then(results => {
              if (isMounted && results) setPayrollResults(results)
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
    }

    loadPayrollData()

    return () => { isMounted = false }
  }, [hasHydrated, isAuthenticated, selectedPeriod, payrollReloadKey])

  // Calculate every displayed payroll value from the same engine result with strict role scoping.
  const tableData = useMemo<PayrollTableRow[]>(() => {
    const isGlobalAdmin = Boolean(user && (user.role === 'ceo' || user.role === 'hr_admin'))
    const isStoreScoped = Boolean(user && (user.role === 'store_manager' || user.role === 'shift_leader'))

    const sourceEmployees: PayrollEmployee[] = employees.length > 0 ? employees : (mockEmployees as PayrollEmployee[])
    const sourcePositions = positions.length > 0 ? positions : mockPositions
    const sourceStores = stores.length > 0 ? stores : mockStores

    let results = payrollResults
    if (isStoreScoped) {
      // Store managers and shift leaders are strictly scoped to their assigned store(s)
      // and cannot view executive/CEO or HR Admin payroll data
      const myStoreId = user?.store_id
      const allowedStores = new Set([myStoreId, ...(user?.secondary_store_ids || [])].filter(Boolean))
      results = results.filter(r => {
        const emp = sourceEmployees.find(e => e.id === r.employee_id) || (mockEmployees.find(e => e.id === r.employee_id) as PayrollEmployee | undefined)
        if (!emp) return false
        if (emp.role === 'ceo' || emp.role === 'hr_admin') return false
        return allowedStores.has(emp.store_id)
      })
    } else if (!isGlobalAdmin) {
      // Regular employee can only view their own payroll entry
      results = results.filter(r => r.employee_id === user?.id)
    }

    return results.map((res, index) => {
      const emp = sourceEmployees.find(e => e.id === res.employee_id) || (mockEmployees.find(e => e.id === res.employee_id) as PayrollEmployee | undefined)
      if (!emp) return null

      const pos = sourcePositions.find(p => p.id === emp.position_id)
      const rowStoreId = (res as { store_id?: string }).store_id || emp.store_id || 'store-001'
      const store = sourceStores.find(s => s.id === rowStoreId)

      const isHourly = res.is_part_time   // BUG-02 fix: dùng flag từ engine, không dùng magic < 100k
      // Guardrail: nếu đơn giá giờ >= 100k (do nhập nhầm lương tháng) thì tự động quy đổi / 26 / 8
      const hourlyRate = isHourly
        ? (res.base_salary >= 100000 ? Math.round(res.base_salary / 26 / 8) : res.base_salary)
        : Math.round(res.base_salary / 26 / 8)
      const baseSalaryFormatted = isHourly
        ? `${hourlyRate.toLocaleString('vi-VN')}đ/giờ`
        : `${res.base_salary.toLocaleString('vi-VN')}đ/tháng`

      const totalShifts = res.total_shifts ?? res.work_days
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

      // BUG FIX: Only penalize late check-ins. Absent days are already unpaid in workedSalary (prevents double penalty).
      const totalPenalties = res.late_deduction
      const deductionTickets = deductionOverrides[emp.id] !== undefined ? deductionOverrides[emp.id] : res.total_other_deductions

      const kpiSalary = res.kpi_salary || 0
      const unionFee = res.union_fee || 0
      const fnbShare = res.fnb_fnb_share || 0
      // Standard Gross Salary = Total earnings before statutory & disciplinary deductions
      const grossSalary = workedSalary + otSalary + allowances + bonusTickets + fnbShare + kpiSalary
      const returnHoldSalary = res.return_hold_salary || 0
      const holdSalary = res.hold_salary || 0
      const advanceSalary = res.advance_deduction

      // Net Salary = Gross - Insurance - Tax - Penalties - Deduction Tickets - Advance - Hold + ReturnHold - UnionFee
      const netSalary = grossSalary - res.total_insurance - res.tax - totalPenalties - deductionTickets - advanceSalary - holdSalary + returnHoldSalary - unionFee
      const netRoundingRule = getActivePayrollPolicy().netRoundingMethod ?? 'round_1000'
      const roundedNet = applyNetRounding(netSalary, netRoundingRule)

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

      const secondaryStoreIds = emp.secondary_store_ids || []
      const secondaryStoreNames = secondaryStoreIds
        .map(id => stores.find(s => s.id === id)?.name)
        .filter(Boolean) as string[]

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
        storeId: rowStoreId,
        storeName: store?.name || 'Chi nhánh',
        secondaryStoreIds,
        secondaryStoreNames,
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
         anomalies: res.anomalies || [],
         lateCount: res.late_count,
         lateIncidents: res.late_incidents || [],
       }
    }).filter((row): row is PayrollTableRow => row !== null)
  }, [selectedPeriod, payrollResults, employees, positions, stores, bonusOverrides, deductionOverrides, statusOverrides, statusPeriod, user])

  const pendingSummary = useMemo(() => {
    const pendingRows = tableData.filter(r => r.pendingShifts > 0)
    return {
      totalShifts: pendingRows.reduce((sum, r) => sum + r.pendingShifts, 0),
      employees: pendingRows.map(r => r.name),
    }
  }, [tableData])

  // ISSUE-06 fix: ANOMALY_CONFIG đã chuyển ra module-level (bên trên component)

  const anomalySummary = useMemo(() => {
    const grouped: Record<string, { count: number, type: string, message: string, examples: string[], severity: 'error' | 'warning' | 'info' }> = {}
    tableData.forEach(row => {
      row.anomalies?.forEach(a => {
        if (!grouped[a.type]) {
          grouped[a.type] = {
            count: 0,
            type: a.type,
            message: ANOMALY_CONFIG[a.type]?.label ?? a.message,
            examples: [],
            severity: ANOMALY_CONFIG[a.type]?.severity ?? 'info',
          }
        }
        grouped[a.type].count++
        if (grouped[a.type].examples.length < 3) {
          grouped[a.type].examples.push(`${row.name} (${row.code})${a.date ? ` - ${a.date}` : ''}`)
        }
      })
    })
    // Sắp xếp: error trước, sau đó warning, info
    return Object.values(grouped).sort((a, b) => {
      const order = { error: 0, warning: 1, info: 2 }
      return (order[a.severity] ?? 2) - (order[b.severity] ?? 2)
    })
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
    const stdDays = policyInfo?.days || 26

    const currentPolicy = getActivePayrollPolicy()
    const splitAllowance = currentPolicy.fnb?.splitShiftAllowance || 0
    const minBreakHours = currentPolicy.fnb?.splitShiftMinBreakHours || 2
    const nightAllowance = currentPolicy.fnb?.nightShiftAllowance || 0
    const nightStartHour = currentPolicy.fnb?.nightShiftStartHour || 22

    return Array.from(groupedByDate.entries()).sort(([dateA], [dateB]) => dateA.localeCompare(dateB)).map(([date, records], index) => {
      const actualHours = records.reduce((sum, record) => sum + (record.total_hours || 0), 0)
      const otHours = records.reduce((sum, record) => sum + (record.overtime_hours || 0), 0)
      const regularHours = Math.max(0, actualHours - otHours)
      const overtimeSalary = totalOtHours > 0 ? Math.round(sourceRow.otSalary * (otHours / totalOtHours)) : 0
      
      let dailySalary = 0
      let coeffSalary = sourceRow.hourlyRate
      if (sourceRow.isHourly) {
        dailySalary = Math.round(regularHours * sourceRow.hourlyRate + overtimeSalary)
        coeffSalary = sourceRow.hourlyRate
      } else {
        const dailyRate = Math.round(sourceRow.baseSalary / stdDays)
        dailySalary = Math.round(dailyRate + overtimeSalary)
        coeffSalary = dailyRate
      }

      // ── Tính phụ cấp Ca gãy trong ngày
      let isSplitShiftDay = false
      if (records.length >= 2 && splitAllowance > 0) {
        const sortedShifts = [...records].sort((a, b) => {
          const timeA = parseTimeToHours(a.check_in_time) ?? 0
          const timeB = parseTimeToHours(b.check_in_time) ?? 0
          return timeA - timeB
        })
        for (let i = 0; i < sortedShifts.length - 1; i++) {
          const outPrev = parseTimeToHours(sortedShifts[i].check_out_time)
          const inNext = parseTimeToHours(sortedShifts[i + 1].check_in_time)
          if (outPrev !== null && inNext !== null) {
            if ((inNext - outPrev) >= minBreakHours) {
              isSplitShiftDay = true
              break
            }
          } else {
            isSplitShiftDay = true
            break
          }
        }
      }
      const daySplitShiftAmount = isSplitShiftDay ? splitAllowance : 0

      // ── Tính phụ cấp Ca đêm trong ngày
      let dayNightShiftCount = 0
      if (nightAllowance > 0) {
        records.forEach(r => {
          const outH = parseTimeToHours(r.check_out_time)
          const inH = parseTimeToHours(r.check_in_time)
          if (outH !== null) {
            if (outH >= nightStartHour || outH < 6) dayNightShiftCount++
          } else if (inH !== null && inH >= nightStartHour) {
            dayNightShiftCount++
          }
        })
      }
      const dayNightShiftAmount = dayNightShiftCount * nightAllowance
      const dayAllowance = daySplitShiftAmount + dayNightShiftAmount

      const allowanceLabels: string[] = []
      if (daySplitShiftAmount > 0) allowanceLabels.push(`Ca gãy (+${Math.round(daySplitShiftAmount / 1000)}k)`)
      if (dayNightShiftAmount > 0) allowanceLabels.push(`Ca đêm (+${Math.round(dayNightShiftAmount / 1000)}k)`)
      const allowanceLabel = allowanceLabels.join(', ')

      const dayLateIncident = sourceRow.lateIncidents?.find(inc => inc.date === date)
      const dayPenalty = dayLateIncident ? dayLateIncident.penalty : 0
      const isLateExempt = dayLateIncident ? dayLateIncident.isExempt : false
      const lateMinutes = dayLateIncident?.minutes || records.find(r => r.status === 'late')?.late_minutes || 0
      const lateLabel = dayLateIncident?.tierLabel || ''
      const [year, month, day] = date.split('-')

      return {
        stt: index + 1,
        date: `${day}/${month}/${year}`,
        shifts: records.length,
        actualHours: Math.round(actualHours * 100) / 100,
        regularHours: Math.round(regularHours * 100) / 100,
        otHours: Math.round(otHours * 100) / 100,
        calcHours: Math.round(actualHours * 100) / 100,
        coeffSalary,
        dailySalary,
        allowance: dayAllowance,
        allowanceLabel,
        bonus: 0,
        penalty: dayPenalty,
        isLateExempt,
        lateMinutes,
        lateLabel,
        deduction: 0,
        netDaily: Math.max(0, dailySalary + dayAllowance - dayPenalty),
      }
    })
  }, [modalTargetEmp, dailyAttendanceRecords, tableData, policyInfo])

  // Open Modal for adding Bonus or Deduction
  const openAddTicketModal = (emp: Record<string, unknown>, type: 'add_bonus' | 'add_deduction') => {
    if (!canEditPeriod(payrollPeriodStatus)) {
      alert('Kỳ lương đã chốt hoặc đã thanh toán, không thể thêm phiếu thưởng/phạt.')
      return
    }
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
    if (!canEditPeriod(payrollPeriodStatus)) {
      alert('Kỳ lương đã chốt hoặc đã thanh toán, không thể chỉnh sửa dữ liệu.')
      return
    }
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
      'Lương chính (Công/Giờ)', 'Tổng phụ cấp', 'Tổng phiếu cộng tiền',
      'Tổng phạt', 'Tổng phiếu trừ tiền', 'Lương KPI',
      'Tổng lương (GROSS)', 'Bảo hiểm', 'Thuế TNCN', 'Tiền công đoàn',
      'Hoàn giữ lương', 'Giữ lương', 'Ứng lương', 'Thực nhận (NET)',
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
        r.isHourly ? r.hourlyRate : r.baseSalary,
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
        r.grossSalary,
        r.insurance,
        r.tax,
        r.unionFee,
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

  // XUẤT BẢNG ĐỐI SOÁT CƠ SỞ HBP (HỒ BÁ PHẤN) THÁNG 8/2026 - 7 CỘT CHUẨN F&B
  const handleExportHbpAuditCsv = () => {
    const headers = [
      'STT',
      'Họ và Tên',
      'Mã NV',
      'Chức Vụ',
      'Số Ca Chuẩn',
      'Tổng Giờ Công Thực',
      'Đơn Giá (VNĐ/h)',
      'Thành Tiền (VNĐ)',
    ]

    const csvRows = [headers.join(',')]

    // Lọc các bản ghi thuộc cơ sở Hồ Bá Phấn (store-001)
    const hbpRows = tableData.filter(r => r.storeId === 'store-001' || r.storeName.includes('Hồ Bá Phấn') || r.storeName.includes('HBP'))

    hbpRows.forEach((r, idx) => {
      const rate = r.isHourly ? r.hourlyRate : (r.baseSalary >= 100000 ? Math.round(r.baseSalary / 26 / 8) : r.baseSalary)
      const earned = Math.round(r.totalHours * rate)
      const rowData = [
        idx + 1,
        `"${r.name.replace(/"/g, '""')}"`,
        `"${r.code}"`,
        `"${r.department}"`,
        r.totalShifts,
        r.totalHours,
        rate,
        earned,
      ]
      csvRows.push(rowData.join(','))
    })

    const csvContent = '\uFEFF' + csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Bang_Doi_Soat_HBP_T8_Homies_HRM.csv`)
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

  const overviewMetrics = useMemo(() => {
    let totalGross = 0
    let totalNet = 0
    let totalWorked = 0
    let totalOtSalary = 0
    let totalOtHours = 0
    let totalAllowances = 0
    let totalBonuses = 0
    let totalDeductions = 0
    let totalInsurance = 0
    let totalTax = 0

    const storeMap = new Map<string, {
      storeId: string
      storeName: string
      employeeCount: number
      totalHours: number
      gross: number
      otSalary: number
      net: number
    }>()

    tableData.forEach(row => {
      totalGross += row.grossSalary
      totalNet += row.netSalary
      totalWorked += row.workedSalary
      totalOtSalary += row.otSalary
      totalOtHours += row.otHours
      totalAllowances += row.allowances
      totalBonuses += row.bonusTickets + row.kpiSalary
      totalDeductions += row.totalPenalties + row.deductionTickets
      totalInsurance += row.insurance
      totalTax += row.tax

      const sId = row.storeId || 'other'
      const existing = storeMap.get(sId) || {
        storeId: sId,
        storeName: row.storeName || 'Chi nhánh',
        employeeCount: 0,
        totalHours: 0,
        gross: 0,
        otSalary: 0,
        net: 0,
      }
      existing.employeeCount += 1
      existing.totalHours += row.totalHours
      existing.gross += row.grossSalary
      existing.otSalary += row.otSalary
      existing.net += row.netSalary
      storeMap.set(sId, existing)
    })

    const storeList = Array.from(storeMap.values()).sort((a, b) => b.gross - a.gross)

    return {
      totalGross,
      totalNet,
      totalWorked,
      totalOtSalary,
      totalOtHours: Math.round(totalOtHours * 10) / 10,
      totalAllowances,
      totalBonuses,
      totalDeductions,
      totalInsurance,
      totalTax,
      storeList,
    }
  }, [tableData])

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
  const slips = filteredTableRows
  const mySlip = tableData.find(s => s.id === user.id)
  const periodTotals = tableData.reduce((totals, row) => ({
    gross: totals.gross + row.grossSalary,
    net: totals.net + row.netSalary,
  }), { gross: 0, net: 0 })

  return (
    <AppShell title={isManager ? "Bảng tính lương chuỗi" : "Phiếu lương cá nhân"}>
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
                background: PERIOD_STATUS_BADGE[payrollPeriodStatus]?.bg || 'var(--gray-100)',
                color: PERIOD_STATUS_BADGE[payrollPeriodStatus]?.color || 'var(--text-muted)',
              }}>
                {PERIOD_STATUS_LABEL_VI[payrollPeriodStatus] || 'Bản nháp'}
              </span>
            )}
            {!canEditPeriod(payrollPeriodStatus) && (
              <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300">
                <Lock size={12} className="text-amber-700" />
                <span>Đã khóa kỳ lương</span>
              </span>
            )}
          </div>

          {isManager && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push('/settings/payroll')}
                className="btn bg-slate-900 hover:bg-slate-800 text-white text-xs py-2 px-3 gap-1.5 shadow-sm cursor-pointer font-bold border border-slate-700"
                title="Mở cài đặt chính sách & tham số bảng lương chi tiết"
              >
                <span>⚙️</span> Cài đặt chính sách
              </button>
              <button
                onClick={() => setPayrollReloadKey(key => key + 1)}
                disabled={isPayrollLoading}
                className="btn btn-primary text-xs py-2 px-3 gap-1.5 shadow-sm cursor-pointer font-bold"
              >
                <RefreshCw size={13} /> {isPayrollLoading ? 'Đang tính lương...' : 'Tính lại lương'}
              </button>
            </div>
          )}
        </div>

        {/* Alert khi chưa có dữ liệu chấm công cho kỳ lương */}
        {tableData.length > 0 && tableData.every(r => r.workedSalary === 0 && r.netSalary === 0) && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 animate-fade-in shadow-2xs">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
              <div>
                <div className="text-xs font-bold">Kỳ {selectedPeriod.split('-')[1]}/{selectedPeriod.split('-')[0]} chưa có dữ liệu chấm công hoặc số công = 0</div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  Tất cả nhân viên đang ghi nhận 0 ngày công, nên lương thực nhận hiển thị 0đ. Vui lòng kiểm tra Bảng chấm công trước khi chốt bảng lương.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => router.push('/attendance')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
              >
                <Clock size={13} /> Xem chấm công
              </button>
              <button
                onClick={() => setPayrollReloadKey(k => k + 1)}
                className="px-2.5 py-1.5 bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
                title="Tính lại lương"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </div>
        )}

        {/* TẦNG 2: 4 THẺ CHỈ SỐ VĨ MÔ (Macro KPI Cards) - Hiển thị cố định cho Cấp Quản Lý */}
        {isManager && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in">
            {/* 1. Tổng quỹ lương Gross */}
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-xs">
              <div className="flex items-center justify-between text-xs text-gray-500 font-medium mb-1.5">
                <span>Tổng quỹ lương (Gross)</span>
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-[#001D3D]">
                  <DollarSign size={16} />
                </div>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#001D3D]">{formatVND(overviewMetrics.totalGross)}</div>
              <div className="text-[11px] text-gray-500 mt-1 font-medium">
                {tableData.length} nhân sự toàn chuỗi
              </div>
            </div>

            {/* 2. Thực nhận Net */}
            <div className="p-4 bg-white rounded-2xl border border-emerald-100 shadow-xs">
              <div className="flex items-center justify-between text-xs text-emerald-800 font-medium mb-1.5">
                <span>Thực nhận chi trả (Net)</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-emerald-700">{formatVND(overviewMetrics.totalNet)}</div>
              <div className="text-[11px] text-emerald-600 mt-1 font-medium">
                Tỷ lệ chi trả ròng: {overviewMetrics.totalGross > 0 ? Math.round((overviewMetrics.totalNet / overviewMetrics.totalGross) * 100) : 100}%
              </div>
            </div>

            {/* 3. Tăng ca & Phụ cấp */}
            <div className="p-4 bg-white rounded-2xl border border-amber-100 shadow-xs">
              <div className="flex items-center justify-between text-xs text-amber-800 font-medium mb-1.5">
                <span>Tăng ca &amp; Phụ cấp</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <Clock size={16} />
                </div>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-amber-800">{formatVND(overviewMetrics.totalOtSalary + overviewMetrics.totalAllowances)}</div>
              <div className="text-[11px] text-amber-700 mt-1 font-medium">
                {overviewMetrics.totalOtHours}h tăng ca • {formatVND(overviewMetrics.totalAllowances)} phụ cấp
              </div>
            </div>

            {/* 4. Quỹ thưởng & Tip */}
            <div className="p-4 bg-white rounded-2xl border border-sky-100 shadow-xs">
              <div className="flex items-center justify-between text-xs text-sky-800 font-medium mb-1.5">
                <span>Quỹ thưởng &amp; Tip F&B</span>
                <div className="w-8 h-8 rounded-xl bg-sky-50 flex items-center justify-center text-[#2F6FA8]">
                  <Sparkles size={16} />
                </div>
              </div>
              <div className="text-xl font-bold font-mono tabular-nums text-[#2F6FA8]">{formatVND(overviewMetrics.totalBonuses)}</div>
              <div className="text-[11px] text-[#2F6FA8] mt-1 font-medium">
                Thưởng doanh thu, tip &amp; KPI
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {isManager && (
          <div className="flex gap-1.5 animate-fade-in bg-primary-50 p-1 rounded-xl">
            {[
              { k: 'table' as const, l: 'Bảng lương chi tiết (Full)' },
              { k: 'payslips' as const, l: 'Phiếu lương NV' },
              { k: 'overview' as const, l: 'Phân bổ chi nhánh' },
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 animate-fade-in">
            <button
              onClick={() => setSelectedStore('all')}
              className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                selectedStore === 'all'
                  ? 'bg-primary-50/80 border-[#2F6FA8] font-bold text-[#2F6FA8] shadow-xs'
                  : 'bg-white border-gray-200/80 hover:bg-gray-50/80 hover:border-gray-300'
              }`}
            >
              <div className="text-xs font-bold flex items-center gap-1.5 text-[#001D3D]">
                <Building2 size={15} className="text-[#2F6FA8]" /> Bảng lương công ty
              </div>
              <div className="text-[11px] text-gray-500 mt-0.5">Toàn bộ nhân viên hệ thống</div>
            </button>

            <div
              className={`p-3 rounded-2xl border text-left transition-all ${
                selectedStore !== 'all'
                  ? 'bg-emerald-50/80 border-emerald-500 font-bold text-emerald-800 shadow-xs'
                  : 'bg-white border-gray-200/80 hover:bg-gray-50/80 hover:border-gray-300'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (selectedStore === 'all') {
                    setSelectedStore(stores[0]?.id || 'store-001')
                  }
                }}
                className="w-full text-left font-bold text-xs flex items-center gap-1.5 text-emerald-800 cursor-pointer"
              >
                <Store size={15} className="text-emerald-600 flex-shrink-0" /> Bảng lương chi nhánh
              </button>

              <select
                value={selectedStore}
                onChange={e => setSelectedStore(e.target.value)}
                className="mt-1.5 w-full text-xs bg-emerald-50/70 border border-emerald-200 text-emerald-900 rounded-xl px-2.5 py-1 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="all">-- Chọn cửa hàng / chi nhánh --</option>
                {stores.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => router.push(`/payroll/bonus?period=${selectedPeriod}`)}
              className="p-3 rounded-2xl border border-emerald-200/80 bg-white hover:bg-emerald-50/40 text-left transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
            >
              <div className="text-xs font-bold flex items-center gap-1.5 text-emerald-800 group-hover:text-emerald-900">
                <PlusCircle size={15} className="text-emerald-600" /> Phiếu cộng (Thưởng)
              </div>
              <div className="text-[11px] text-emerald-600 mt-0.5">Quản lý thưởng &amp; Tip doanh thu</div>
            </button>

            <button
              onClick={() => router.push(`/payroll/deductions?period=${selectedPeriod}`)}
              className="p-3 rounded-2xl border border-rose-200/80 bg-white hover:bg-rose-50/40 text-left transition-all cursor-pointer group shadow-2xs hover:shadow-xs"
            >
              <div className="text-xs font-bold flex items-center gap-1.5 text-rose-800 group-hover:text-rose-900">
                <MinusCircle size={15} className="text-rose-600" /> Phiếu trừ &amp; Tạm ứng
              </div>
              <div className="text-[11px] text-rose-600 mt-0.5">Đi trễ, vi phạm &amp; tạm ứng</div>
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
                {isCeo ? (
                  !canEditPeriod(payrollPeriodStatus) ? (
                    <button
                      onClick={async () => {
                        if (!window.confirm('CẢNH BÁO (CEO): Mở khóa kỳ lương sẽ cho phép tính toán lại và chỉnh sửa số liệu. Bạn có chắc chắn muốn mở khóa?')) return
                        const [yearStr, monthStr] = selectedPeriod.split('-')
                        const res = await payrollPeriodAdapter.unlockPayrollPeriod(parseInt(monthStr, 10), parseInt(yearStr, 10))
                        if (res.success) {
                          alert('Đã mở khóa kỳ lương thành công. Bây giờ bạn có thể tính toán lại hoặc điều chỉnh phiếu thưởng/phạt.')
                          setPayrollReloadKey(k => k + 1)
                        } else {
                          alert(`Mở khóa thất bại: ${res.error}`)
                        }
                      }}
                      className="btn text-xs py-1.5 px-3 border-0 gap-1.5 font-semibold flex items-center shadow-xs cursor-pointer bg-amber-600 hover:bg-amber-500 text-white"
                      title="Quyền CEO: Mở khóa kỳ lương để chỉnh sửa"
                    >
                      <Unlock size={13} /> Mở khóa kỳ lương
                    </button>
                  ) : (
                    <button
                      onClick={async () => {
                        if (pendingSummary.totalShifts > 0 || anomalySummary.length > 0) {
                          alert('Không thể khóa sổ lương khi còn ca chưa duyệt hoặc có cảnh báo dữ liệu. Vui lòng xử lý dứt điểm các lỗi trước.')
                          return
                        }
                        if (!window.confirm('XÁC NHẬN CEO: Bạn có chắc chắn muốn khóa sổ lương tháng này? Sau khi khóa sổ sẽ đóng băng toàn bộ số liệu tính lương!')) return
                        
                        const [yearStr, monthStr] = selectedPeriod.split('-')
                        const res = await payrollPeriodAdapter.savePayrollPeriod(parseInt(monthStr, 10), parseInt(yearStr, 10), payrollResults, policyInfo)
                        if (res.success) {
                          alert('Đã khóa sổ lương tháng thành công!')
                          setPayrollReloadKey(k => k + 1)
                        } else {
                          alert(`Khóa sổ thất bại: ${res.error}`)
                        }
                      }}
                      disabled={!canClosePeriod(payrollPeriodStatus) || pendingSummary.totalShifts > 0 || anomalySummary.length > 0 || isPayrollLoading || policyUnavailable}
                      className={`btn text-xs py-1.5 px-3 border-0 gap-1.5 font-semibold flex items-center shadow-xs cursor-pointer ${
                        !canClosePeriod(payrollPeriodStatus) ? 'bg-slate-600 text-slate-300' : 'bg-rose-600 hover:bg-rose-500 text-white'
                      }`}
                      title="Quyền CEO (emp-001): Khóa sổ lương tháng và đóng băng số liệu"
                    >
                      <Lock size={13} /> Khóa Sổ Lương Tháng
                    </button>
                  )
                ) : (
                  // Dành cho Quản lý / Admin khác: Chỉ xem trạng thái Read-Only
                  !canEditPeriod(payrollPeriodStatus) ? (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-lg font-bold bg-rose-950/80 border border-rose-800 text-rose-300 shadow-xs"
                      title="Sổ lương tháng đã được CEO khóa số liệu (Chế độ chỉ đọc)"
                    >
                      <Lock size={13} /> Đã khóa sổ (Chỉ đọc)
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 text-xs py-1.5 px-2.5 rounded-lg font-medium bg-slate-800 border border-slate-700 text-slate-400 shadow-xs"
                      title="Chỉ tài khoản CEO (anh Nguyễn Đức Nghĩa - emp-001) mới có quyền Khóa Sổ Lương Tháng. Các tài khoản khác chỉ xem ở chế độ Read-Only."
                    >
                      <ShieldCheck size={13} className="text-amber-400" /> Khóa sổ lương: Chỉ CEO
                    </span>
                  )
                )}

                <button
                  onClick={() => setPayrollReloadKey(key => key + 1)}
                  disabled={isPayrollLoading || !canEditPeriod(payrollPeriodStatus) || policyUnavailable}
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

                {/* Nút Xuất Bảng Đối Soát HBP T8 */}
                <button
                  onClick={handleExportHbpAuditCsv}
                  className="btn bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-1.5 px-3 border-0 gap-1.5 font-bold flex items-center shadow-xs cursor-pointer"
                  title="Xuất bảng đối soát dữ liệu công và lương chuẩn cơ sở Hồ Bá Phấn Tháng 8/2026"
                >
                  <FileText size={13} /> Đối Soát HBP T8
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
                        <span>Cài đặt hiển thị ({visibleColumnCount}/{Object.keys(DEFAULT_COLUMN_VISIBILITY).length})</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable Spreadsheet Grid Table with Dynamic Columns */}
            {anomalySummary.length > 0 && canEditPeriod(payrollPeriodStatus) && (
              <div className="text-xs mt-2 mx-3 px-3 py-2 bg-amber-50 text-amber-800 rounded-md border border-amber-200">
                <div className="font-bold flex items-center gap-1.5 mb-1.5">
                  <AlertTriangle size={14} className="text-amber-600" /> Có một số bất thường dữ liệu, vui lòng xử lý trước khi chốt lương:
                </div>
                <ul className="list-none pl-0 space-y-1">
                  {anomalySummary.map(a => (
                    <li key={a.type} className={`flex items-start gap-1.5 px-2 py-1 rounded ${
                      a.severity === 'error'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : a.severity === 'warning'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-sky-50 text-sky-700 border border-sky-200'
                    }`}>
                      <span className="mt-0.5 shrink-0">
                        {a.severity === 'error' ? '🔴' : a.severity === 'warning' ? '🟡' : 'ℹ️'}
                      </span>
                      <span>
                        <strong>{a.count} trường hợp</strong> bị <em>{a.message}</em>.{' '}
                        (Ví dụ: {a.examples.join(', ')}{a.count > 3 ? ', ...' : ''})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {pendingSummary.totalShifts > 0 && canEditPeriod(payrollPeriodStatus) && (
              <div className="text-xs mt-2 mx-3 px-3 py-2 bg-rose-50 text-rose-700 rounded-md border border-rose-200">
                <strong>Còn {pendingSummary.totalShifts} ca chưa duyệt</strong> của {pendingSummary.employees.length} nhân viên ({pendingSummary.employees.join(', ')}) — số giờ này đang được tính là 0. Duyệt hết trước khi chốt lương.
              </div>
            )}
            {policyUnavailable && (
              <div className="text-xs mt-2 mb-3 mx-3 px-3 py-2 bg-rose-50 text-rose-700 rounded-md flex items-center gap-2 border border-rose-200">
                <AlertTriangle size={15} className="text-rose-600 shrink-0" />
                <span>
                  <strong>Chưa tải được cấu hình lương, vui lòng thử lại.</strong> Để đảm bảo tính chính xác, tính năng tính lại và chốt kỳ lương tạm thời bị khóa.
                </span>
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
                    {columnVisibility.workedSalary && <th className="p-2.5 border-r border-slate-200 text-right min-w-[130px]">Lương chính (Công/Giờ)</th>}
                    {columnVisibility.allowances && <th className="p-2.5 border-r border-slate-200 text-right min-w-[90px]">Tổng phụ cấp</th>}

                    {columnVisibility.bonusTickets && <th className="p-2.5 border-r border-slate-200 text-right min-w-[140px] bg-emerald-50/50">Tổng phiếu cộng tiền</th>}
                    {columnVisibility.totalPenalties && <th className="p-2.5 border-r border-slate-200 text-right min-w-[80px] text-rose-600">Tổng phạt</th>}
                    {columnVisibility.deductionTickets && <th className="p-2.5 border-r border-slate-200 text-right min-w-[140px] bg-rose-50/50">Tổng phiếu trừ tiền</th>}
                    {columnVisibility.kpiSalary && <th className="p-2.5 border-r border-slate-200 text-right min-w-[85px]">Lương KPI</th>}
                    {columnVisibility.grossSalary && <th className="p-2.5 border-r border-slate-200 text-right min-w-[100px] font-extrabold">Tổng lương</th>}
                    {columnVisibility.insurance && <th className="p-2.5 border-r border-slate-200 text-right min-w-[105px] text-amber-700 font-bold">Bảo hiểm</th>}
                    {columnVisibility.tax && <th className="p-2.5 border-r border-slate-200 text-right min-w-[95px] text-amber-700 font-bold">Thuế TNCN</th>}
                    {columnVisibility.unionFee && <th className="p-2.5 border-r border-slate-200 text-right min-w-[90px]">Tiền công đoàn</th>}
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
                        {columnVisibility.baseSalary && (
                          <td
                            onClick={() => {
                              setRateDrawerTarget({
                                employeeId: row.id,
                                employeeCode: row.code,
                                employeeName: row.name,
                                position: row.department,
                                storeName: row.storeName,
                                period: selectedPeriod,
                                currentHourlyRate: row.hourlyRate || (row.isHourly ? (row.baseSalary || 20000) : Math.round(row.baseSalary / 26 / 8)),
                                totalHours: row.totalHours,
                                isPartTime: row.isHourly,
                              })
                            }}
                            className="p-2.5 border-r border-slate-100 text-right font-medium text-slate-800 hover:bg-blue-50/60 hover:text-[#2F6FA8] cursor-pointer group transition"
                            title="Bấm để điều chỉnh nhanh đơn giá lương theo giờ"
                          >
                            <div className="flex items-center justify-end gap-1.5">
                              <span>{row.baseSalaryFormatted}</span>
                              <Edit3 size={11} className="opacity-0 group-hover:opacity-100 text-[#2F6FA8] transition shrink-0" />
                            </div>
                          </td>
                        )}
                        {columnVisibility.totalShifts && (
                          <td className="p-2.5 border-r border-slate-100 text-center font-semibold text-slate-700">
                            <span>{row.totalShifts}</span>
                            <span className="text-[10px] text-slate-400 block font-normal">ca</span>
                          </td>
                        )}
                        {columnVisibility.totalHours && <td className="p-2.5 border-r border-slate-100 text-right text-slate-700 font-mono">{row.totalHours}</td>}
                        {columnVisibility.regularHours && <td className="p-2.5 border-r border-slate-100 text-right text-slate-600 font-mono">{row.regularHours}</td>}
                        {columnVisibility.otHours && <td className="p-2.5 border-r border-slate-100 text-right text-amber-600 font-mono font-medium">{row.otHours > 0 ? row.otHours : 0}</td>}
                        {columnVisibility.totalDays && (
                          <td className="p-2.5 border-r border-slate-100 text-right text-slate-800 font-semibold">
                            <span>{row.totalDays}</span>
                            <span className="text-[10px] text-slate-400 block font-normal">công</span>
                          </td>
                        )}
                        {columnVisibility.regularDays && <td className="p-2.5 border-r border-slate-100 text-right text-slate-600 font-mono">{row.regularDays}</td>}
                        {columnVisibility.otDays && <td className="p-2.5 border-r border-slate-100 text-right text-amber-600 font-mono">{row.otDays > 0 ? row.otDays : 0}</td>}
                        {columnVisibility.otSalary && <td className="p-2.5 border-r border-slate-100 text-right text-amber-600 font-mono">{row.otSalary > 0 ? formatVND(row.otSalary) : '0'}</td>}
                        {columnVisibility.workedSalary && (
                          <td className="p-2.5 border-r border-slate-100 text-right font-mono">
                            <div className="font-semibold text-slate-800">{formatVND(row.workedSalary)}</div>
                            <div className="text-[10px] text-slate-400 font-sans">
                              {row.isHourly
                                ? `${row.regularHours}h × ${row.hourlyRate.toLocaleString('vi-VN')}đ`
                                : `${row.regularDays} công`}
                            </div>
                          </td>
                        )}
                        {columnVisibility.allowances && <td className="p-2.5 border-r border-slate-100 text-right text-slate-600 font-mono">{row.allowances > 0 ? formatVND(row.allowances) : '0'}</td>}

                        {columnVisibility.bonusTickets && (
                          <td className="p-2.5 border-r border-slate-100 text-right font-mono bg-emerald-50/30">
                            <div className="flex items-center justify-end gap-2">
                              <span className="font-semibold text-emerald-700">{row.bonusTickets > 0 ? formatVND(row.bonusTickets) : '0'}</span>
                              <button
                                onClick={() => openAddTicketModal(row, 'add_bonus')}
                                disabled={!canEditPeriod(payrollPeriodStatus)}
                                title={!canEditPeriod(payrollPeriodStatus) ? 'Kỳ lương đã chốt, không thể thêm phiếu' : 'Thêm phiếu cộng tiền'}
                                className={`w-6 h-5 rounded border border-dashed flex items-center justify-center text-xs transition-all ${
                                  !canEditPeriod(payrollPeriodStatus)
                                    ? 'border-gray-200 text-gray-300 cursor-not-allowed opacity-50'
                                    : 'border-emerald-500 hover:bg-emerald-100 hover:border-emerald-600 text-emerald-600 cursor-pointer shadow-2xs'
                                }`}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                        )}

                        {columnVisibility.totalPenalties && (
                          <td className="p-2.5 border-r border-slate-100 text-right font-mono">
                            {row.totalPenalties > 0 ? (
                              <div>
                                <span className="text-rose-600 font-bold">-{formatVND(row.totalPenalties)}</span>
                                {row.lateCount && row.lateCount > 0 ? (
                                  <span className="text-[10px] text-slate-400 block font-sans">
                                    {row.lateCount} lần muộn
                                  </span>
                                ) : null}
                              </div>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                        )}

                        {columnVisibility.deductionTickets && (
                          <td className="p-2.5 border-r border-slate-100 text-right font-mono bg-rose-50/30">
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-rose-700 font-semibold">{row.deductionTickets > 0 ? formatVND(row.deductionTickets) : '0'}</span>
                              <button
                                onClick={() => openAddTicketModal(row, 'add_deduction')}
                                disabled={!canEditPeriod(payrollPeriodStatus)}
                                title={!canEditPeriod(payrollPeriodStatus) ? 'Kỳ lương đã chốt, không thể thêm phiếu' : 'Thêm phiếu trừ tiền'}
                                className={`w-6 h-5 rounded border border-dashed flex items-center justify-center text-xs transition-all ${
                                  !canEditPeriod(payrollPeriodStatus)
                                    ? 'border-gray-200 text-gray-300 cursor-not-allowed opacity-50'
                                    : 'border-rose-500 hover:bg-rose-100 hover:border-rose-600 text-rose-600 cursor-pointer shadow-2xs'
                                }`}
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </td>
                        )}

                        {columnVisibility.kpiSalary && <td className="p-2.5 border-r border-slate-100 text-right font-mono text-slate-700">{row.kpiSalary > 0 ? formatVND(row.kpiSalary) : '0'}</td>}
                        {columnVisibility.grossSalary && <td className="p-2.5 border-r border-slate-100 text-right font-mono font-bold text-slate-900">{formatVND(row.grossSalary)}</td>}
                        {columnVisibility.insurance && (
                          <td className="p-2.5 border-r border-slate-100 text-right font-mono text-slate-700">
                            {row.insurance > 0 ? (
                              <span className="text-amber-800 font-medium">-{formatVND(row.insurance)}</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                        )}
                        {columnVisibility.tax && (
                          <td className="p-2.5 border-r border-slate-100 text-right font-mono text-slate-700">
                            {row.tax > 0 ? (
                              <span className="text-amber-800 font-medium">-{formatVND(row.tax)}</span>
                            ) : (
                              <span className="text-slate-400">0</span>
                            )}
                          </td>
                        )}
                        {columnVisibility.unionFee && <td className="p-2.5 border-r border-slate-100 text-right font-mono text-slate-500">{row.unionFee > 0 ? formatVND(row.unionFee) : '0'}</td>}
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

                                    {!canEditPeriod(payrollPeriodStatus) ? (
                                      <div className="px-3 py-2 border-t border-slate-800 text-[10px] text-amber-400/90 flex items-center gap-1.5 italic bg-slate-800/40">
                                        <Lock size={12} className="text-amber-400 shrink-0" />
                                        <span>Kỳ lương đã khóa - không thể thêm thưởng/phạt</span>
                                      </div>
                                    ) : (
                                      <>
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
                                      </>
                                    )}
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
              <div>Hiển thị <strong>{filteredTableRows.length}</strong> / {tableData.length} nhân viên ({visibleColumnCount}/{Object.keys(DEFAULT_COLUMN_VISIBILITY).length} cột)</div>
              <div className="flex items-center gap-4">
                <span>Tổng thực nhận: <strong className="text-emerald-700 text-sm">{formatVND(filteredTableRows.reduce((s, r) => s + r.netSalary, 0))}</strong></span>
              </div>
            </div>

          </div>
        )}

        {/* OVERVIEW (Manager) - EXECUTIVE F&B COST BREAKDOWN & STORE DISTRIBUTION */}
        {(tab === 'overview' && isManager) && (
          <div className="space-y-4 animate-slide-up">
            {/* Chi tiết cơ cấu chi phí */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Cột trái: Cơ cấu thu nhập */}
              <div className="card p-4 bg-white border border-slate-200 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Coins size={15} className="text-primary" /> Cơ cấu Quỹ Lương F&B
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Lương công nhật thực tế</span>
                    <span className="font-bold text-slate-900">{formatVND(overviewMetrics.totalWorked)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Tiền làm thêm / Tăng ca (OT)</span>
                    <span className="font-bold text-amber-700">+{formatVND(overviewMetrics.totalOtSalary)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Phụ cấp ca làm (Cơm ca, đóng/mở quán)</span>
                    <span className="font-bold text-slate-900">+{formatVND(overviewMetrics.totalAllowances)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Thưởng doanh thu & KPI chi nhánh</span>
                    <span className="font-bold text-emerald-700">+{formatVND(overviewMetrics.totalBonuses)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 font-black text-sm">
                    <span className="text-slate-900">Tổng thu nhập (Gross)</span>
                    <span className="text-slate-900">{formatVND(overviewMetrics.totalGross)}</span>
                  </div>
                </div>
              </div>

              {/* Cột phải: Khấu trừ & Nghĩa vụ pháp lý */}
              <div className="card p-4 bg-white border border-slate-200 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <MinusCircle size={15} className="text-rose-500" /> Các khoản khấu trừ & Nghĩa vụ
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Bảo hiểm bắt buộc (BHXH, BHYT, BHTN)</span>
                    <span className="font-bold text-rose-600">-{formatVND(overviewMetrics.totalInsurance)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Thuế thu nhập cá nhân (TNCN)</span>
                    <span className="font-bold text-rose-600">-{formatVND(overviewMetrics.totalTax)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Phạt vi phạm, đi trễ & phiếu trừ tiền</span>
                    <span className="font-bold text-rose-600">-{formatVND(overviewMetrics.totalDeductions)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-600">Tỷ lệ chi trả ròng (Net/Gross)</span>
                    <span className="font-bold text-primary">
                      {overviewMetrics.totalGross > 0 ? Math.round((overviewMetrics.totalNet / overviewMetrics.totalGross) * 100) : 100}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 font-black text-sm">
                    <span className="text-primary">Thực nhận cuối cùng (Net)</span>
                    <span className="text-primary">{formatVND(overviewMetrics.totalNet)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bảng phân bổ chi phí theo chi nhánh */}
            <div className="card p-0 overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-xs">
              <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold flex items-center gap-2">
                    <Store size={16} className="text-emerald-400" /> Phân bổ Chi phí Lương theo Chi nhánh
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">So sánh quy mô nhân sự và chi phí thực nhận giữa các cửa hàng</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="p-3">Chi nhánh</th>
                      <th className="p-3 text-center">Số NV</th>
                      <th className="p-3 text-right">Tổng giờ công</th>
                      <th className="p-3 text-right">Quỹ lương (Gross)</th>
                      <th className="p-3 text-right">Tiền tăng ca (OT)</th>
                      <th className="p-3 text-right">Thực nhận (Net)</th>
                      <th className="p-3 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {overviewMetrics.storeList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-400">
                          Chưa có dữ liệu chi nhánh trong kỳ lương này
                        </td>
                      </tr>
                    ) : (
                      overviewMetrics.storeList.map(item => (
                        <tr key={item.storeId} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-semibold text-slate-900 flex items-center gap-1.5">
                            <Store size={14} className="text-emerald-600 shrink-0" /> {item.storeName}
                          </td>
                          <td className="p-3 text-center">
                            <span className="px-2 py-0.5 bg-slate-100 rounded-full font-bold text-slate-700">
                              {item.employeeCount} NV
                            </span>
                          </td>
                          <td className="p-3 text-right font-medium text-slate-700">{Math.round(item.totalHours)}h</td>
                          <td className="p-3 text-right font-bold text-slate-900">{formatVND(item.gross)}</td>
                          <td className="p-3 text-right font-medium text-amber-700">{formatVND(item.otSalary)}</td>
                          <td className="p-3 text-right font-black text-emerald-700">{formatVND(item.net)}</td>
                          <td className="p-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedStore(item.storeId)
                                setTab('table')
                              }}
                              className="text-xs text-primary hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                            >
                              Xem bảng lương <ArrowRight size={12} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* PAYSLIPS DATA TABLE (Manager) - Quy Chuẩn Section 5.2 */}
        {(tab === 'payslips' && isManager) && (
          <div className="space-y-3 animate-slide-up">
            {/* Thanh công cụ lọc & tìm kiếm */}
            <div className="bg-white p-3.5 rounded-2xl border border-gray-100 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên, mã NV, bộ phận..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2F6FA8] focus:border-[#2F6FA8] transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>

                {/* Filter Store */}
                <select
                  value={selectedStore}
                  onChange={e => setSelectedStore(e.target.value)}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2F6FA8] cursor-pointer"
                >
                  <option value="all">Toàn bộ chi nhánh ({stores.length})</option>
                  {stores.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                {/* Filter Employee Type */}
                <select
                  value={employeeTypeFilter}
                  onChange={e => setEmployeeTypeFilter(e.target.value)}
                  className="text-xs bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-[#2F6FA8] cursor-pointer"
                >
                  <option value="all">Tất cả loại hình</option>
                  <option value="hourly">Bán thời gian (Theo giờ)</option>
                  <option value="fulltime">Toàn thời gian (Cố định)</option>
                </select>

                {/* Toggle Hide Resigned */}
                <label className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={hideResigned}
                    onChange={e => setHideResigned(e.target.checked)}
                    className="rounded border-gray-300 text-[#2F6FA8] focus:ring-[#2F6FA8] cursor-pointer"
                  />
                  <span>Ẩn NV đã nghỉ</span>
                </label>
              </div>

              {/* Counter badge */}
              <div className="text-xs text-gray-500 font-medium">
                Hiển thị <span className="font-bold text-[#001D3D]">{slips.length}</span> phiếu lương
              </div>
            </div>

            {/* Interactive Data Table */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50/90 text-gray-600 font-bold border-b border-gray-100 select-none">
                      <th className="py-3 px-3.5 text-center text-gray-400 w-12">#</th>
                      <th className="py-3 px-4 text-[#001D3D]">Nhân Viên</th>
                      <th className="py-3 px-3">Vị Trí / Cơ Sở</th>
                      <th className="py-3 px-3 text-center">Công &amp; Giờ</th>
                      <th className="py-3 px-3 text-right">Lương Cơ Bản</th>
                      <th className="py-3 px-3 text-right">Lương Công</th>
                      <th className="py-3 px-3 text-right text-emerald-700">Thưởng &amp; Phụ Cấp</th>
                      <th className="py-3 px-3 text-right text-rose-600">Giảm Trừ</th>
                      <th className="py-3 px-4 text-right text-[#001D3D]">Thực Nhận (NET)</th>
                      <th className="py-3 px-3 text-center">Trạng Thái</th>
                      <th className="py-3 px-3 text-center">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {slips.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-gray-400">
                          <FileText size={36} className="mx-auto mb-2 text-gray-300" />
                          <p className="font-medium text-gray-500">Không tìm thấy phiếu lương phù hợp bộ lọc</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">Thử đổi từ khóa tìm kiếm hoặc chọn chi nhánh khác</p>
                        </td>
                      </tr>
                    ) : (
                      slips.map((slip, idx) => {
                        const totalBonusAndAllowance = (slip.bonusTickets || 0) + (slip.kpiSalary || 0) + (slip.allowances || 0)
                        const totalDeductions = (slip.totalPenalties || 0) + (slip.deductionTickets || 0) + (slip.insurance || 0) + (slip.tax || 0) + (slip.advanceSalary || 0) + (slip.holdSalary || 0) - (slip.returnHoldSalary || 0)

                        const statusStyle = slip.status === 'Đã thanh toán'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : slip.status === 'Đã gửi phiếu lương'
                          ? 'bg-sky-50 text-sky-700 border-sky-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'

                        return (
                          <tr
                            key={slip.id}
                            onClick={() => {
                              setModalTargetEmp(slip)
                              setActiveModal('view_slip')
                            }}
                            className="hover:bg-primary-50/40 transition-all cursor-pointer group"
                          >
                            <td className="py-3.5 px-3.5 text-center font-mono text-gray-400 text-[11px]">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-primary-100 text-[#2F6FA8] flex items-center justify-center font-bold text-xs flex-shrink-0">
                                  {getInitials(slip.name)}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-gray-900 group-hover:text-[#2F6FA8] transition-colors truncate">
                                    {slip.name}
                                  </div>
                                  <div className="text-[11px] font-mono text-gray-400">
                                    {slip.code}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-3">
                              <div className="font-bold text-gray-800">{slip.department}</div>
                              <div className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                <Store size={11} className="text-gray-400 shrink-0" />
                                <span className="truncate max-w-[130px]" title={slip.storeName}>{slip.storeName}</span>
                              </div>
                              {slip.secondaryStoreNames && slip.secondaryStoreNames.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {slip.secondaryStoreNames.map((secName, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200"
                                      title={`Hỗ trợ ca tại: ${secName}`}
                                    >
                                      +{secName.replace('Homies Milk Tea - ', '').trim()}
                                    </span>
                                  ))}
                                  {selectedStore !== 'all' && slip.storeId !== selectedStore && (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                      Hỗ trợ ca
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <div className="font-mono font-bold text-gray-800 tabular-nums">
                                {slip.totalDays} công
                              </div>
                              <div className="text-[11px] font-mono text-gray-500 tabular-nums">
                                {slip.totalHours}h {slip.otHours > 0 && <span className="text-amber-600">(+{slip.otHours}h OT)</span>}
                              </div>
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono tabular-nums text-gray-600">
                              {slip.baseSalaryFormatted}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-medium tabular-nums text-gray-800">
                              {formatVND(slip.workedSalary)}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums text-emerald-700">
                              {totalBonusAndAllowance > 0 ? `+${formatVND(totalBonusAndAllowance)}` : '0 đ'}
                            </td>
                            <td className="py-3.5 px-3 text-right font-mono font-bold tabular-nums text-rose-600">
                              {totalDeductions > 0 ? `-${formatVND(totalDeductions)}` : '0 đ'}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <span className="font-mono font-bold tabular-nums text-sm text-emerald-700">
                                {formatVND(slip.netSalary)}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${statusStyle}`}>
                                {slip.status || 'Chờ duyệt'}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-center" onClick={e => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModalTargetEmp(slip)
                                    setActiveModal('view_slip')
                                  }}
                                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-[#2F6FA8] text-gray-700 hover:text-white font-bold text-[11px] transition-all flex items-center gap-1 cursor-pointer"
                                  title="Mở bóc tách chi tiết phiếu lương"
                                >
                                  <FileText size={12} />
                                  <span>Chi tiết</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => router.push(`/payroll/salary-slip?period=${selectedPeriod}&employee=${slip.id}`)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-[#2F6FA8] hover:bg-primary-50 transition cursor-pointer"
                                  title="Mở liên kết phiếu lương riêng"
                                >
                                  <ExternalLink size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Chân bảng Footer tóm tắt chuẩn Section 5.2 */}
              <div className="p-3.5 bg-gray-50/90 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-600 gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium">
                    Đội ngũ: <strong className="text-[#001D3D]">{slips.length}</strong> nhân sự
                  </span>
                  <span>•</span>
                  <span className="font-medium">
                    Tổng giờ: <strong className="font-mono tabular-nums text-gray-800">{slips.reduce((acc, s) => acc + s.totalHours, 0).toFixed(1)}h</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-600">Tổng thực nhận (NET):</span>
                  <span className="text-sm font-bold font-mono tabular-nums text-emerald-700">
                    {formatVND(slips.reduce((acc, s) => acc + s.netSalary, 0))}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MY PAYSLIP */}
        {(tab === 'my' || !isManager) && (
          mySlip ? (
            <div className="animate-slide-up">
              <div className="card-elevated p-5 text-center mb-4" style={{ background: 'linear-gradient(135deg, #48C07910, #2F6FA810)' }}>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Thực nhận tháng {selectedPeriod.split('-')[1]}</div>
                <div className="text-3xl font-black mt-1" style={{ color: 'var(--success)' }}>{formatVND(mySlip.netSalary)}</div>
              </div>
              <div className="card"><PayslipDetail slip={mySlip} /></div>
            </div>
          ) : user?.role === 'ceo' ? (
            <div className="card p-8 text-center bg-white border border-amber-200 rounded-2xl animate-slide-up shadow-2xs">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                👑
              </div>
              <h4 className="text-base font-bold text-slate-800">Tài khoản Ban giám đốc (CEO)</h4>
              <p className="text-xs text-slate-600 mt-1.5 max-w-md mx-auto leading-relaxed">
                Theo quy chế nội bộ chuỗi Homies, thành viên Ban giám đốc nhận thu nhập quản trị điều hành riêng, không tính theo bảng chấm công nhật tại cửa hàng.
              </p>
              <div className="mt-4 flex justify-center gap-2">
                <button
                  onClick={() => setTab('overview')}
                  className="btn btn-primary text-xs py-2 px-4 font-bold cursor-pointer"
                >
                  Xem tổng quan chi phí chuỗi
                </button>
              </div>
            </div>
          ) : (
            <div className="card p-8 text-center bg-white border border-gray-100 rounded-2xl animate-slide-up">
              <FileText className="mx-auto text-slate-300 mb-2" size={40} />
              <h4 className="text-sm font-bold text-slate-800">Chưa có dữ liệu phiếu lương kỳ này</h4>
              <p className="text-xs text-slate-500 mt-1">Phiếu lương của bạn cho tháng {selectedPeriod.split('-')[1]}/{selectedPeriod.split('-')[0]} chưa được tạo hoặc đang trong quá trình tính toán.</p>
            </div>
          )
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
                  Đã chọn: <span className="text-sky-600 font-extrabold">{visibleColumnCount}</span> / {Object.keys(DEFAULT_COLUMN_VISIBILITY).length} cột
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
                      {/* Cột 10: Phụ cấp (Ca gãy, ca đêm...) */}
                      <td className="p-2.5 border-r border-slate-100 text-right font-mono">
                        {d.allowance > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-emerald-700 font-bold">+{formatVND(d.allowance)}</span>
                            {d.allowanceLabel && (
                              <span className="text-[10px] text-emerald-600 font-sans font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                {d.allowanceLabel}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      {/* Cột 11: Phiếu cộng tiền */}
                      <td className="p-2.5 border-r border-slate-100 text-right font-mono text-emerald-600">
                        {d.bonus > 0 ? `+${formatVND(d.bonus)}` : <span className="text-slate-400">0</span>}
                      </td>
                      {/* Cột 12: Phạt đi muộn */}
                      <td className="p-2.5 border-r border-slate-100 text-right font-mono">
                        {d.penalty > 0 ? (
                          <div className="flex flex-col items-end">
                            <span className="text-rose-600 font-bold">-{formatVND(d.penalty)}</span>
                            <span className="text-[10px] text-rose-500 font-sans font-normal">
                              {d.lateMinutes > 0 ? `Muộn ${d.lateMinutes}p` : ''} {d.lateLabel ? `(${d.lateLabel})` : ''}
                            </span>
                          </div>
                        ) : d.isLateExempt ? (
                          <div className="flex flex-col items-end">
                            <span className="text-emerald-600 font-bold">0</span>
                            <span className="text-[10px] text-emerald-600 font-sans font-medium bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              {d.lateLabel || 'Được miễn'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>
                      {/* Cột 13: Phiếu trừ tiền */}
                      <td className="p-2.5 border-r border-slate-100 text-right font-mono text-rose-600">
                        {d.deduction > 0 ? `-${formatVND(d.deduction)}` : <span className="text-slate-400">0</span>}
                      </td>
                      {/* Cột 14: Lương thực nhận ngày */}
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

      {/* MODAL VIEW PAYSLIP DETAIL - Bóc tách chi tiết cá nhân chuẩn Section 5.3 */}
      {activeModal === 'view_slip' && modalTargetEmp && (() => {
        const emp = modalTargetEmp as unknown as (PayrollTableRow & Record<string, unknown>)
        const totalBonus = (emp.bonusTickets || 0) + (emp.kpiSalary || 0)
        const totalDeductionsCalc = (emp.totalPenalties || 0) + (emp.deductionTickets || 0) + (emp.insurance || 0) + (emp.tax || 0) + (emp.advanceSalary || 0) + (emp.holdSalary || 0) - (emp.returnHoldSalary || 0)

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
              {/* Header: Executive Gradient */}
              <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-[#001D3D] via-[#1D3E61] to-[#2F6FA8] text-white">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs text-sky-200 font-medium">
                      <span>HRM Homies</span>
                      <span>•</span>
                      <span>Kỳ lương {selectedPeriod.split('-')[1]}/{selectedPeriod.split('-')[0]}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-0.5">{String(emp.name || '')}</h3>
                    <div className="text-xs text-white/80 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{String(emp.code || '')}</span>
                      <span>•</span>
                      <span>{String(emp.department || '')}</span>
                      <span>•</span>
                      <span>{String(emp.storeName || '')}</span>
                      {emp.secondaryStoreNames && emp.secondaryStoreNames.length > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-400/20 text-amber-200 border border-amber-300/30">
                          Hỗ trợ: {emp.secondaryStoreNames.map(s => s.replace('Homies Milk Tea - ', '').trim()).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="text-white/70 hover:text-white rounded-xl p-1.5 hover:bg-white/10 transition cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Hero Net Amount Box */}
                <div className="mt-3.5 p-3 rounded-xl bg-white/10 backdrop-blur-xs border border-white/15 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white/90">Lương thực nhận (NET):</span>
                  <span className="text-xl font-mono font-bold text-emerald-300 tabular-nums">
                    {formatVND(Number(emp.netSalary) || 0)}
                  </span>
                </div>
              </div>

              {/* Scrollable Body */}
              <div className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
                {/* Khối 1: Ngày công & Giờ làm */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-[11px] text-gray-500">Số công chuẩn</div>
                    <div className="text-xs font-bold text-gray-800 font-mono mt-0.5">26 công</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Công thực làm</div>
                    <div className="text-xs font-bold text-[#2F6FA8] font-mono mt-0.5">{emp.totalDays || 0} công</div>
                  </div>
                  <div>
                    <div className="text-[11px] text-gray-500">Tổng giờ làm</div>
                    <div className="text-xs font-bold text-[#001D3D] font-mono mt-0.5">{emp.totalHours || 0}h</div>
                  </div>
                </div>

                {/* Khối 2: Các khoản thu nhập */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">1. Thu nhập &amp; Phụ cấp</div>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl px-3.5 bg-white">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Mức lương cơ bản</span>
                      <span className="font-semibold text-gray-800 font-mono">{String(emp.baseSalaryFormatted || '')}</span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Lương tính theo công/giờ</span>
                      <span className="font-bold text-gray-900 font-mono">{formatVND(Number(emp.workedSalary) || 0)}</span>
                    </div>
                    {Number(emp.otSalary) > 0 && (
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Lương tăng ca ({emp.otHours}h)</span>
                        <span className="font-semibold text-amber-700 font-mono">+{formatVND(Number(emp.otSalary))}</span>
                      </div>
                    )}
                    {Number(emp.allowances) > 0 && (
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Tổng phụ cấp (ca/ăn/khác)</span>
                        <span className="font-semibold text-gray-800 font-mono">+{formatVND(Number(emp.allowances))}</span>
                      </div>
                    )}
                    {totalBonus > 0 && (
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Thưởng, KPI &amp; Phiếu cộng</span>
                        <span className="font-bold text-emerald-700 font-mono">+{formatVND(totalBonus)}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 bg-emerald-50/40 -mx-3.5 px-3.5 rounded-b-xl">
                      <span className="font-bold text-[#001D3D]">Tổng thu nhập (GROSS)</span>
                      <span className="font-bold text-[#001D3D] font-mono">{formatVND(Number(emp.grossSalary) || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Khối 3: Các khoản giảm trừ */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">2. Các khoản giảm trừ</div>
                  <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl px-3.5 bg-white">
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Phạt vi phạm &amp; Đi trễ</span>
                      <span className="font-semibold text-rose-600 font-mono">
                        {Number(emp.totalPenalties) > 0 ? `-${formatVND(Number(emp.totalPenalties))}` : '0 đ'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Phiếu trừ tiền khác</span>
                      <span className="font-semibold text-rose-600 font-mono">
                        {Number(emp.deductionTickets) > 0 ? `-${formatVND(Number(emp.deductionTickets))}` : '0 đ'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Bảo hiểm (BHXH, BHYT, BHTN)</span>
                      <span className="font-semibold text-gray-700 font-mono">
                        {Number(emp.insurance) > 0 ? `-${formatVND(Number(emp.insurance))}` : '0 đ'}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-gray-600">Thuế TNCN</span>
                      <span className="font-semibold text-gray-700 font-mono">
                        {Number(emp.tax) > 0 ? `-${formatVND(Number(emp.tax))}` : '0 đ'}
                      </span>
                    </div>
                    {Number(emp.advanceSalary) > 0 && (
                      <div className="flex justify-between py-2">
                        <span className="text-gray-600">Tạm ứng lương đã nhận</span>
                        <span className="font-semibold text-rose-600 font-mono">-{formatVND(Number(emp.advanceSalary))}</span>
                      </div>
                    )}
                    <div className="flex justify-between py-2 bg-rose-50/40 -mx-3.5 px-3.5 rounded-b-xl">
                      <span className="font-bold text-rose-800">Tổng giảm trừ</span>
                      <span className="font-bold text-rose-700 font-mono">
                        {totalDeductionsCalc > 0 ? `-${formatVND(totalDeductionsCalc)}` : '0 đ'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar Footer */}
              <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Printer size={13} className="text-[#2F6FA8]" />
                    <span>In phiếu</span>
                  </button>
                  <button
                    onClick={() => {
                      setActiveModal(null)
                      router.push(`/payroll/salary-slip?period=${selectedPeriod}&employee=${emp.id}`)
                    }}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <ExternalLink size={13} className="text-[#2F6FA8]" />
                    <span>Trang riêng</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveModal(null)
                      openPaySalaryModal(emp)
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition cursor-pointer"
                  >
                    <CreditCard size={13} />
                    <span>Thanh toán VietQR</span>
                  </button>
                  <button
                    onClick={() => setActiveModal(null)}
                    className="px-3 py-1.5 rounded-xl bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-bold transition cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* DRAWER ĐIỀU CHỈNH ĐƠN GIÁ LƯƠNG 1-CHẠM */}
      <PayrollHourlyRateDrawer
        isOpen={!!rateDrawerTarget}
        onClose={() => setRateDrawerTarget(null)}
        target={rateDrawerTarget}
        onSuccess={() => {
          setPayrollReloadKey(k => k + 1)
        }}
      />
    </AppShell>
  )
}

function PayslipDetail({ slip }: { slip: PayrollTableRow }) {
  const isZeroSalary = slip.netSalary === 0 && slip.workedSalary === 0

  return (
    <div className="px-3 pb-3 space-y-1.5 border-t" style={{ borderColor: 'var(--gray-100)' }}>
      <div className="pt-2" />
      
      {/* Thông tin ngày công tóm tắt */}
      <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 rounded-lg text-[11px] mb-2 text-slate-600 font-medium">
        <div>Công chuẩn: <span className="font-bold text-slate-800">26 ngày</span></div>
        <div>Ngày đi làm: <span className="font-bold text-slate-800">{slip.regularDays} ngày</span></div>
        <div>Tổng giờ làm: <span className="font-bold text-slate-800">{slip.totalHours}h</span></div>
      </div>

      <div className="flex justify-between text-xs py-1 border-b border-gray-100">
        <span className="text-slate-500">Mức lương cơ bản</span>
        <span className="font-semibold text-slate-800">{slip.baseSalaryFormatted}</span>
      </div>

      {isZeroSalary && (
        <div className="py-2 text-[11px] text-amber-700 bg-amber-50/70 px-2.5 rounded-lg border border-amber-200/60 my-1">
          ⚠️ Nhân viên chưa có dữ liệu ca làm việc/chấm công trong kỳ này.
        </div>
      )}

      {[
        { label: 'Lương theo công thực tế', val: slip.workedSalary, color: '' },
        { label: `Tăng ca (${slip.otHours}h)`, val: slip.otSalary, color: 'var(--primary)' },
        { label: 'Thưởng / phiếu cộng', val: slip.bonusTickets + slip.kpiSalary, color: 'var(--success)' },
        { label: 'Phụ cấp', val: slip.allowances, color: '' },
        { label: 'Phạt vi phạm & đi trễ', val: -slip.totalPenalties, color: 'var(--error)' },
        { label: 'Phiếu trừ tiền', val: -slip.deductionTickets, color: 'var(--error)' },
        { label: 'Bảo hiểm (BHXH/BHYT/BHTN)', val: -slip.insurance, color: '' },
        { label: 'Thuế TNCN', val: -slip.tax, color: '' },
        { label: 'Tạm ứng', val: -slip.advanceSalary, color: '' },
      ]
        .filter(r => !isZeroSalary ? r.val !== 0 : true)
        .map((row, i) => (
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
