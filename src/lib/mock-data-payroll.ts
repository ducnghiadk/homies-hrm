// ============================================
// HRM Trà Sữa 🧋 — Mock Data: Payroll
// ByStore, Company, Hold, Bonus, Deduction, Advance,
// Slip, Insurance, Calculate, History, Allowance
// ============================================

export type PayrollStatus = 'draft' | 'reviewing' | 'approved' | 'locked'

export interface PayrollStoreSummary {
  store_id: string
  store_name: string
  employee_count: number
  total_base: number
  total_allowance: number
  total_bonus: number
  total_deduction: number
  total_insurance: number
  total_tax: number
  total_net: number
  status: PayrollStatus
}

export interface SalarySlipData {
  id: string
  employee_id: string
  employee_name: string
  employee_code?: string
  department?: string
  level?: string
  employee_type?: string
  position: string
  store: string
  period: string
  work_days: number
  regular_days?: number
  ot_days?: number
  standard_days: number
  total_shifts?: number
  total_hours?: number
  regular_hours?: number
  // Earnings
  base_salary: number
  base_salary_formatted?: string
  worked_salary?: number
  allowances: { name: string; amount: number }[]
  total_allowance_amount?: number
  overtime_hours: number
  overtime_amount: number
  bonus: number
  bonus_tickets?: number
  kpi_salary?: number
  total_earnings: number
  gross_salary?: number
  // Deductions
  total_penalties?: number
  deduction_tickets?: number
  union_fee?: number
  return_hold_salary?: number
  hold_salary?: number
  late_deduction: number
  advance_deduction: number
  bhxh: number
  bhyt: number
  bhtn: number
  tax: number
  other_deduction: number
  total_deductions: number
  // Net & Status
  net_salary: number
  rounded_net?: number
  status?: string
}

export interface SalaryHoldRecord {
  id: string
  employee_id: string
  employee_name: string
  hold_percent: number
  hold_amount: number
  start_date: string
  release_date: string
  status: 'holding' | 'released'
  released_by?: string
}

export interface BonusRecord {
  id: string
  employee_id: string
  employee_name: string
  amount: number
  reason: string
  month: string
  status: 'pending' | 'approved' | 'rejected'
  created_by: string
  created_at: string
}

export interface DeductionRecord {
  id: string
  employee_id: string
  employee_name: string
  type: 'penalty' | 'repayment' | 'compensation'
  type_label: string
  amount: number
  reason: string
  month: string
  status: 'pending' | 'approved'
}

export interface AdvanceRequest {
  id: string
  employee_id: string
  employee_name: string
  earned_to_date: number
  max_advance: number
  requested_amount: number
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface InsuranceRecord {
  employee_id: string
  employee_name: string
  salary_base: number
  bhxh_employee: number
  bhxh_company: number
  bhyt_employee: number
  bhyt_company: number
  bhtn_employee: number
  bhtn_company: number
  total_employee: number
  total_company: number
}

export interface AllowanceType {
  id: string
  name: string
  amount: number
  type: 'fixed' | 'percent'
  is_taxable: boolean
  is_active: boolean
}

// ============ Store Summary ============
export const mockPayrollByStore: PayrollStoreSummary[] = [
  { store_id: 'store-001', store_name: 'Homies Milk Tea - Hồ Bá Phấn', employee_count: 0, total_base: 0, total_allowance: 0, total_bonus: 0, total_deduction: 0, total_insurance: 0, total_tax: 0, total_net: 0, status: 'draft' },
  { store_id: 'store-002', store_name: 'Homies Milk Tea - Đường 429', employee_count: 0, total_base: 0, total_allowance: 0, total_bonus: 0, total_deduction: 0, total_insurance: 0, total_tax: 0, total_net: 0, status: 'draft' },
  { store_id: 'store-003', store_name: 'Homies Milk Tea - Lê Văn Sỹ', employee_count: 0, total_base: 0, total_allowance: 0, total_bonus: 0, total_deduction: 0, total_insurance: 0, total_tax: 0, total_net: 0, status: 'draft' },
]

// ============ Salary Slips ============
export const mockSalarySlips: SalarySlipData[] = []

// ============ Hold ============
export const mockSalaryHolds: SalaryHoldRecord[] = []

// ============ Bonus ============
export const mockBonuses: BonusRecord[] = []

// ============ Deductions ============
export const mockDeductions: DeductionRecord[] = []

// ============ Advance ============
export const mockAdvances: AdvanceRequest[] = []

// ============ Insurance ============
export const mockInsurance: InsuranceRecord[] = []

// ============ Allowance Types ============
export const mockAllowanceTypes: AllowanceType[] = [
  { id: 'alw-001', name: 'Phụ cấp ăn trưa', amount: 700000, type: 'fixed', is_taxable: false, is_active: true },
  { id: 'alw-002', name: 'Phụ cấp xăng xe', amount: 300000, type: 'fixed', is_taxable: false, is_active: true },
  { id: 'alw-003', name: 'Phụ cấp điện thoại', amount: 200000, type: 'fixed', is_taxable: true, is_active: true },
  { id: 'alw-004', name: 'Phụ cấp nhà ở', amount: 500000, type: 'fixed', is_taxable: true, is_active: false },
  { id: 'alw-005', name: 'Phụ cấp trách nhiệm', amount: 10, type: 'percent', is_taxable: true, is_active: true },
]

// ============ Payroll History ============
export const mockPayrollHistory: Array<{
  period: string
  status: PayrollStatus
  total_net: number
  employee_count: number
  locked_at?: string
  locked_by?: string
}> = []

// Helpers
export const getPayrollByStore = (storeId: string) => mockPayrollByStore.find(p => p.store_id === storeId)
export const getSlipByEmployee = (empId: string, period: string) => mockSalarySlips.find(s => s.employee_id === empId && s.period === period)
export const getPendingBonuses = () => mockBonuses.filter(b => b.status === 'pending')
export const getPendingAdvances = () => mockAdvances.filter(a => a.status === 'pending')

