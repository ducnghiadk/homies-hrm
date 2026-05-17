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
  position: string
  store: string
  period: string
  work_days: number
  standard_days: number
  // Earnings
  base_salary: number
  allowances: { name: string; amount: number }[]
  overtime_hours: number
  overtime_amount: number
  bonus: number
  total_earnings: number
  // Deductions
  late_deduction: number
  advance_deduction: number
  bhxh: number
  bhyt: number
  bhtn: number
  tax: number
  other_deduction: number
  total_deductions: number
  // Net
  net_salary: number
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
  { store_id: 'store-001', store_name: 'Boba House Q.1', employee_count: 7, total_base: 45500000, total_allowance: 7000000, total_bonus: 1500000, total_deduction: 500000, total_insurance: 5460000, total_tax: 1200000, total_net: 46840000, status: 'approved' },
  { store_id: 'store-002', store_name: 'Boba House Q.3', employee_count: 5, total_base: 30000000, total_allowance: 5000000, total_bonus: 500000, total_deduction: 200000, total_insurance: 3600000, total_tax: 800000, total_net: 30900000, status: 'reviewing' },
  { store_id: 'store-003', store_name: 'Boba House Thủ Đức', employee_count: 5, total_base: 32000000, total_allowance: 5000000, total_bonus: 800000, total_deduction: 0, total_insurance: 3840000, total_tax: 900000, total_net: 33060000, status: 'draft' },
]

// ============ Salary Slips ============
export const mockSalarySlips: SalarySlipData[] = [
  {
    id: 'slip-001', employee_id: 'emp-005', employee_name: 'Trần Thị Mai',
    position: 'Pha chế', store: 'Boba House Q.1', period: '01/2026',
    work_days: 26, standard_days: 26,
    base_salary: 5500000,
    allowances: [{ name: 'Ăn trưa', amount: 700000 }, { name: 'Xăng xe', amount: 300000 }],
    overtime_hours: 6, overtime_amount: 225000, bonus: 500000,
    total_earnings: 7225000,
    late_deduction: 0, advance_deduction: 0,
    bhxh: 440000, bhyt: 82500, bhtn: 55000, tax: 0, other_deduction: 0, total_deductions: 577500,
    net_salary: 6647500,
  },
  {
    id: 'slip-002', employee_id: 'emp-007', employee_name: 'Đặng Minh Khoa',
    position: 'Phục vụ', store: 'Boba House Q.1', period: '01/2026',
    work_days: 24, standard_days: 26,
    base_salary: 5076923,
    allowances: [{ name: 'Ăn trưa', amount: 700000 }],
    overtime_hours: 0, overtime_amount: 0, bonus: 0,
    total_earnings: 5776923,
    late_deduction: 100000, advance_deduction: 500000,
    bhxh: 406154, bhyt: 76154, bhtn: 50769, tax: 0, other_deduction: 0, total_deductions: 1133077,
    net_salary: 4643846,
  },
]

// ============ Hold ============
export const mockSalaryHolds: SalaryHoldRecord[] = [
  { id: 'hold-001', employee_id: 'emp-015', employee_name: 'NV Mới A', hold_percent: 20, hold_amount: 1000000, start_date: '2026-01-15', release_date: '2026-03-15', status: 'holding' },
  { id: 'hold-002', employee_id: 'emp-014', employee_name: 'NV Mới B', hold_percent: 20, hold_amount: 1100000, start_date: '2025-12-01', release_date: '2026-02-01', status: 'released', released_by: 'emp-002' },
]

// ============ Bonus ============
export const mockBonuses: BonusRecord[] = [
  { id: 'bon-001', employee_id: 'emp-005', employee_name: 'Trần Thị Mai', amount: 500000, reason: 'NV xuất sắc tháng 1', month: '01/2026', status: 'approved', created_by: 'emp-002', created_at: '2026-02-01' },
  { id: 'bon-002', employee_id: 'emp-011', employee_name: 'Hoàng Thị Lan', amount: 300000, reason: 'Hoàn thành dự án training', month: '02/2026', status: 'pending', created_by: 'emp-003', created_at: '2026-02-14' },
  { id: 'bon-003', employee_id: 'emp-006', employee_name: 'Vũ Hoàng Đức', amount: 200000, reason: 'Hỗ trợ khai trương', month: '02/2026', status: 'pending', created_by: 'emp-002', created_at: '2026-02-15' },
]

// ============ Deductions ============
export const mockDeductions: DeductionRecord[] = [
  { id: 'ded-001', employee_id: 'emp-007', employee_name: 'Đặng Minh Khoa', type: 'penalty', type_label: 'Phạt', amount: 100000, reason: 'Đi muộn 3 lần trong tháng', month: '01/2026', status: 'approved' },
  { id: 'ded-002', employee_id: 'emp-007', employee_name: 'Đặng Minh Khoa', type: 'repayment', type_label: 'Trả ứng', amount: 500000, reason: 'Trả tạm ứng tháng 12', month: '01/2026', status: 'approved' },
  { id: 'ded-003', employee_id: 'emp-009', employee_name: 'Bùi Văn Tùng', type: 'compensation', type_label: 'Bồi thường', amount: 150000, reason: 'Làm vỡ bình thủy tinh', month: '02/2026', status: 'pending' },
]

// ============ Advance ============
export const mockAdvances: AdvanceRequest[] = [
  { id: 'adv-001', employee_id: 'emp-009', employee_name: 'Bùi Văn Tùng', earned_to_date: 2750000, max_advance: 1375000, requested_amount: 1000000, reason: 'Cần gấp trả tiền nhà', status: 'pending', created_at: '2026-02-12' },
  { id: 'adv-002', employee_id: 'emp-012', employee_name: 'Đinh Văn Phúc', earned_to_date: 3200000, max_advance: 1600000, requested_amount: 1500000, reason: 'Gia đình có việc gấp', status: 'approved', created_at: '2026-02-10' },
]

// ============ Insurance ============
export const mockInsurance: InsuranceRecord[] = [
  { employee_id: 'emp-005', employee_name: 'Trần Thị Mai', salary_base: 5500000, bhxh_employee: 440000, bhxh_company: 935000, bhyt_employee: 82500, bhyt_company: 165000, bhtn_employee: 55000, bhtn_company: 55000, total_employee: 577500, total_company: 1155000 },
  { employee_id: 'emp-006', employee_name: 'Vũ Hoàng Đức', salary_base: 5500000, bhxh_employee: 440000, bhxh_company: 935000, bhyt_employee: 82500, bhyt_company: 165000, bhtn_employee: 55000, bhtn_company: 55000, total_employee: 577500, total_company: 1155000 },
]

// ============ Allowance Types ============
export const mockAllowanceTypes: AllowanceType[] = [
  { id: 'alw-001', name: 'Phụ cấp ăn trưa', amount: 700000, type: 'fixed', is_taxable: false, is_active: true },
  { id: 'alw-002', name: 'Phụ cấp xăng xe', amount: 300000, type: 'fixed', is_taxable: false, is_active: true },
  { id: 'alw-003', name: 'Phụ cấp điện thoại', amount: 200000, type: 'fixed', is_taxable: true, is_active: true },
  { id: 'alw-004', name: 'Phụ cấp nhà ở', amount: 500000, type: 'fixed', is_taxable: true, is_active: false },
  { id: 'alw-005', name: 'Phụ cấp trách nhiệm', amount: 10, type: 'percent', is_taxable: true, is_active: true },
]

// ============ Payroll History ============
export const mockPayrollHistory = [
  { period: '01/2026', status: 'locked' as PayrollStatus, total_net: 110800000, employee_count: 15, locked_at: '2026-02-05', locked_by: 'emp-001' },
  { period: '12/2025', status: 'locked' as PayrollStatus, total_net: 108500000, employee_count: 14, locked_at: '2026-01-05', locked_by: 'emp-001' },
  { period: '11/2025', status: 'locked' as PayrollStatus, total_net: 105200000, employee_count: 14, locked_at: '2025-12-05', locked_by: 'emp-001' },
]

// Helpers
export const getPayrollByStore = (storeId: string) => mockPayrollByStore.find(p => p.store_id === storeId)
export const getSlipByEmployee = (empId: string, period: string) => mockSalarySlips.find(s => s.employee_id === empId && s.period === period)
export const getPendingBonuses = () => mockBonuses.filter(b => b.status === 'pending')
export const getPendingAdvances = () => mockAdvances.filter(a => a.status === 'pending')
