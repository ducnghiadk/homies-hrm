// ============================================
// HRM Trà Sữa 🧋 — Payroll Data Adapter
// Unified 29-Column Payroll Repository
// Swapping seamlessly between Supabase Real DB & Mock Data
// ============================================

import { isRealDbMode } from './repository-config'
import { supabase } from '../supabase'
import { type SalarySlipData, mockSalarySlips } from '../mock-data-payroll'
import {
  getActivePayment,
  recordPayment as recordLedgerPayment,
  reversePayment as reverseLedgerPayment,
  type PaymentLedgerTransaction,
  type PayrollPaymentMethod,
} from '../payroll-payment-ledger'

export interface CustomTicketType {
  id: string
  branch: string
  type: string
  title: string
  amount: number
  note: string
}

export const mockCustomTicketTypes: CustomTicketType[] = [
  { id: '1', branch: 'Tất cả chi nhánh', type: 'Cộng tiền tự định nghĩa', title: 'Thưởng doanh thu', amount: 0, note: '-' },
  { id: '2', branch: 'Tất cả chi nhánh', type: 'Trừ tiền tự định nghĩa', title: 'Phạt Lỗi Vận Hành', amount: 5000, note: '-' },
  { id: '3', branch: 'Tất cả chi nhánh', type: 'Trừ tiền tự định nghĩa', title: 'Lỗi Vận Hành', amount: 10000, note: '-' },
  { id: '4', branch: 'Tất cả chi nhánh', type: 'Cộng tiền tự định nghĩa', title: 'Thưởng chuyên cần', amount: 100000, note: '-' },
  { id: '5', branch: 'Tất cả chi nhánh', type: 'Cộng tiền tự định nghĩa', title: 'Thưởng gương mẫu', amount: 100000, note: '-' },
  { id: '6', branch: 'Tất cả chi nhánh', type: 'Cộng tiền tự định nghĩa', title: 'Team truyền thông', amount: 1200000, note: '1tr + 200k KPI' },
  { id: '7', branch: 'Tất cả chi nhánh', type: 'Cộng tiền tự định nghĩa', title: 'Phụ cấp chức vụ senior', amount: 200000, note: '-' },
  { id: '8', branch: 'Tất cả chi nhánh', type: 'Cộng tiền tự định nghĩa', title: 'Phụ Cấp Hỗ Trợ Vận Hành Quán', amount: 0, note: '-' },
]

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MONTH_PERIOD_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/
const DEFAULT_MOCK_ORGANIZATION_ID = 'org-001'
const PAYMENT_LEDGER_STORAGE_PREFIX = 'homies_payroll_payment_ledger_v1'

export interface PayrollPaymentInput {
  organizationId?: string
  periodId: string
  employeeId: string
  payslipStatus: string
  amount: number
  paymentMethod: PayrollPaymentMethod
  bankName?: string
  accountNumber?: string
  accountName?: string
  note?: string
  proofUrl?: string
}

let inMemoryMockPaymentLedger: PaymentLedgerTransaction[] = []

function getPaymentLedgerStorageKey(organizationId: string): string {
  return `${PAYMENT_LEDGER_STORAGE_PREFIX}:${organizationId}`
}

function readMockPaymentLedger(organizationId: string): PaymentLedgerTransaction[] {
  if (typeof window === 'undefined') return inMemoryMockPaymentLedger

  try {
    const raw = window.localStorage.getItem(getPaymentLedgerStorageKey(organizationId))
    if (!raw) return inMemoryMockPaymentLedger
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      inMemoryMockPaymentLedger = parsed as PaymentLedgerTransaction[]
      return inMemoryMockPaymentLedger
    }
  } catch (error) {
    console.error('[PayrollAdapter] Error reading mock payment ledger:', error)
  }

  return inMemoryMockPaymentLedger
}

function writeMockPaymentLedger(organizationId: string, state: PaymentLedgerTransaction[]): void {
  inMemoryMockPaymentLedger = state
  if (typeof window === 'undefined') return

  try {
    window.localStorage.setItem(getPaymentLedgerStorageKey(organizationId), JSON.stringify(state))
  } catch (error) {
    console.error('[PayrollAdapter] Error writing mock payment ledger:', error)
  }
}

function createMockTransactionId(prefix: string): string {
  return globalThis.crypto?.randomUUID?.() || `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function getMockPayslipId(periodId: string, employeeId: string): string {
  return `${periodId}:${employeeId}`
}

async function resolvePayrollPeriodId(periodId: string): Promise<string | null> {
  const value = periodId.trim()
  if (UUID_PATTERN.test(value)) return value

  const match = value.match(MONTH_PERIOD_PATTERN)
  if (!match) return null

  const { data, error } = await supabase
    .from('ky_luong')
    .select('id')
    .eq('nam', Number(match[1]))
    .eq('thang', Number(match[2]))
    .maybeSingle()

  if (error || !data?.id) {
    if (error) console.error('[PayrollAdapter] Error resolving payroll period:', error)
    return null
  }

  return String(data.id)
}

async function updatePayslipFields(
  employeeId: string,
  periodId: string,
  fields: Record<string, unknown>,
  action: string,
): Promise<boolean> {
  const resolvedPeriodId = await resolvePayrollPeriodId(periodId)
  if (!resolvedPeriodId || !UUID_PATTERN.test(employeeId)) return false

  try {
    const { data, error } = await supabase
      .from('phieu_luong')
      .update(fields)
      .eq('nhan_vien_id', employeeId)
      .eq('ky_luong_id', resolvedPeriodId)
      .select('id')

    if (error || !data || data.length === 0) {
      if (error) console.error(`[PayrollAdapter] Error ${action} in DB:`, error)
      return false
    }
    return true
  } catch (err) {
    console.error(`[PayrollAdapter] ${action} exception:`, err)
    return false
  }
}

export const payrollAdapter = {
  async getPayslipsByPeriod(periodId: string, storeId?: string): Promise<SalarySlipData[]> {
    if (isRealDbMode()) {
      const resolvedPeriodId = await resolvePayrollPeriodId(periodId)
      if (!resolvedPeriodId) return []

      let query = supabase
        .from('phieu_luong')
        .select('*, nhan_vien(ho_ten, ma_nhan_vien, cua_hang_id, cua_hang(ten))')
        .eq('ky_luong_id', resolvedPeriodId)

      if (storeId && storeId !== 'all') {
        const { data: employees, error: employeeError } = await supabase
          .from('nhan_vien')
          .select('id')
          .eq('cua_hang_id', storeId)

        if (employeeError) {
          console.error('[PayrollAdapter] Error filtering employees by store:', employeeError)
          return []
        }

        const employeeIds = (employees || [])
          .map((row: Record<string, unknown>) => String(row.id || ''))
          .filter(Boolean)
        if (employeeIds.length === 0) return []
        query = query.in('nhan_vien_id', employeeIds)
      }

      const { data, error } = await query

      if (error) {
        console.error('[PayrollAdapter] Error fetching payslips from DB:', error)
        return mockSalarySlips
      }

      if (data && data.length > 0) {
        return data.map((row: Record<string, unknown>) => {
          const employee = row.nhan_vien && typeof row.nhan_vien === 'object'
            ? row.nhan_vien as Record<string, unknown>
            : {}
          const store = employee.cua_hang && typeof employee.cua_hang === 'object'
            ? employee.cua_hang as Record<string, unknown>
            : {}

          return {
            id: String(row.id || ''),
            employee_id: String(row.nhan_vien_id || ''),
            employee_name: String(row.ho_ten || employee.ho_ten || ''),
            employee_code: String(row.ma_nhan_vien || employee.ma_nhan_vien || ''),
            department: String(row.bo_phan || 'Nhân viên'),
            level: String(row.level || 'Senior Employee'),
            employee_type: String(row.loai_nhan_vien || 'Chính thức'),
            position: String(row.bo_phan || 'Nhân viên'),
            store: String(row.ten_cua_hang || store.ten || 'Chi nhánh'),
            period: periodId,
          work_days: Number(row.tong_so_cong || 0),
          regular_days: Number(row.so_cong_thuong || 0),
          ot_days: Number(row.so_cong_tang_ca || 0),
          standard_days: 26,
          total_shifts: Number(row.so_ca || 0),
          total_hours: Number(row.tong_so_gio || 0),
          regular_hours: Number(row.so_gio_thuong || 0),

          // Earnings
          base_salary: Number(row.luong_co_ban || 0),
          worked_salary: Number(row.luong_theo_gio || 0),
          allowances: [],
          overtime_hours: Number(row.so_gio_tang_ca || 0),
          overtime_amount: Number(row.tien_tang_ca || 0),
          bonus: Number(row.tong_phieu_cong || 0),
          bonus_tickets: Number(row.tong_phieu_cong || 0),
          kpi_salary: Number(row.luong_kpi || 0),
          total_earnings: Number(row.tong_luong || 0),
          gross_salary: Number(row.tong_luong || 0),

          // Deductions
          total_penalties: Number(row.tong_phat || 0),
          deduction_tickets: Number(row.tong_phieu_tru || 0),
          union_fee: Number(row.tien_cong_doan || 0),
          return_hold_salary: Number(row.hoan_giu_luong || 0),
          hold_salary: Number(row.giu_luong || 0),
          late_deduction: Number(row.tong_phat || 0),
          advance_deduction: Number(row.ung_luong || 0),
          bhxh: 0,
          bhyt: 0,
          bhtn: 0,
          tax: 0,
          other_deduction: Number(row.tong_phieu_tru || 0),
          total_deductions: Number(row.tong_phat || 0) + Number(row.tong_phieu_tru || 0) + Number(row.ung_luong || 0),

          // Net & Status
          net_salary: Number(row.luong_thuc_nhan || 0),
          rounded_net: Number(row.lam_tron || 0),
            status: String(row.trang_thai || 'Chưa gửi phiếu lương'),
          }
        })
      }
    }

    return mockSalarySlips
  },

  async getPaymentStatuses(periodId: string, organizationId = DEFAULT_MOCK_ORGANIZATION_ID): Promise<Record<string, string>> {
    if (isRealDbMode()) {
      const resolvedPeriodId = await resolvePayrollPeriodId(periodId)
      if (!resolvedPeriodId) return {}

      try {
        const { data, error } = await supabase
          .from('phieu_luong')
          .select('nhan_vien_id, trang_thai')
          .eq('ky_luong_id', resolvedPeriodId)

        if (error || !data) {
          if (error) console.error('[PayrollAdapter] Error fetching saved payroll statuses:', error)
          return {}
        }

        return Object.fromEntries(
          data
            .map((row: Record<string, unknown>) => [String(row.nhan_vien_id || ''), String(row.trang_thai || '')] as const)
            .filter(([employeeId, status]) => Boolean(employeeId && status)),
        )
      } catch (error) {
        console.error('[PayrollAdapter] Saved payroll statuses exception:', error)
        return {}
      }
    }

    const state = readMockPaymentLedger(organizationId)
    const employeeIds = new Set(
      state
        .filter(transaction => transaction.organizationId === organizationId && transaction.periodId === periodId)
        .map(transaction => transaction.employeeId),
    )
    const statuses: Record<string, string> = {}

    for (const employeeId of employeeIds) {
      const activePayment = getActivePayment(state, {
        organizationId,
        periodId,
        payslipId: getMockPayslipId(periodId, employeeId),
        employeeId,
        payslipStatus: 'Đã thanh toán',
      })
      if (activePayment) statuses[employeeId] = 'Đã thanh toán'
    }

    return statuses
  },

  async recordPayment(input: PayrollPaymentInput): Promise<boolean> {
    const organizationId = input.organizationId || DEFAULT_MOCK_ORGANIZATION_ID

    if (isRealDbMode()) {
      const resolvedPeriodId = await resolvePayrollPeriodId(input.periodId)
      if (!resolvedPeriodId || !UUID_PATTERN.test(input.employeeId)) return false

      try {
        const { data, error } = await supabase.rpc('record_payroll_payment', {
          p_period_id: resolvedPeriodId,
          p_employee_id: input.employeeId,
          p_amount: input.amount,
          p_payment_method: input.paymentMethod,
          p_bank_name: input.bankName || null,
          p_account_number: input.accountNumber || null,
          p_account_name: input.accountName || null,
          p_note: input.note || null,
          p_proof_url: input.proofUrl || null,
        })
        if (error || !data) {
          if (error) console.error('[PayrollAdapter] Error recording payroll payment:', error)
          return false
        }
        return true
      } catch (error) {
        console.error('[PayrollAdapter] Record payroll payment exception:', error)
        return false
      }
    }

    const state = readMockPaymentLedger(organizationId)
    const result = recordLedgerPayment(
      state,
      {
        organizationId,
        periodId: input.periodId,
        payslipId: getMockPayslipId(input.periodId, input.employeeId),
        employeeId: input.employeeId,
        payslipStatus: input.payslipStatus,
        amount: input.amount,
        paymentMethod: input.paymentMethod,
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        accountName: input.accountName,
        note: input.note,
        proofUrl: input.proofUrl,
      },
      new Date().toISOString(),
      createMockTransactionId('payment'),
    )
    if (!result.ok) {
      console.warn(`[PayrollAdapter] ${result.error}`)
      return false
    }

    writeMockPaymentLedger(organizationId, result.state)
    return true
  },

  async reversePayment(input: {
    organizationId?: string
    periodId: string
    employeeId: string
    payslipStatus: string
    note?: string
  }): Promise<boolean> {
    const organizationId = input.organizationId || DEFAULT_MOCK_ORGANIZATION_ID

    if (isRealDbMode()) {
      const resolvedPeriodId = await resolvePayrollPeriodId(input.periodId)
      if (!resolvedPeriodId || !UUID_PATTERN.test(input.employeeId)) return false

      try {
        const { data, error } = await supabase.rpc('reverse_payroll_payment', {
          p_period_id: resolvedPeriodId,
          p_employee_id: input.employeeId,
          p_note: input.note || null,
        })
        if (error || !data) {
          if (error) console.error('[PayrollAdapter] Error reversing payroll payment:', error)
          return false
        }
        return true
      } catch (error) {
        console.error('[PayrollAdapter] Reverse payroll payment exception:', error)
        return false
      }
    }

    const state = readMockPaymentLedger(organizationId)
    const result = reverseLedgerPayment(
      state,
      {
        organizationId,
        periodId: input.periodId,
        payslipId: getMockPayslipId(input.periodId, input.employeeId),
        employeeId: input.employeeId,
        payslipStatus: input.payslipStatus,
        note: input.note,
      },
      new Date().toISOString(),
      createMockTransactionId('reversal'),
    )
    if (!result.ok) {
      console.warn(`[PayrollAdapter] ${result.error}`)
      return false
    }

    writeMockPaymentLedger(organizationId, result.state)
    return true
  },

  // Update Payslip Status in Supabase Real DB
  async updatePayslipStatus(employeeId: string, periodId: string, status: string): Promise<boolean> {
    if (!isRealDbMode()) return true
    return updatePayslipFields(employeeId, periodId, { trang_thai: status }, 'updating status')
  },

  // Update Bonus Ticket in Supabase Real DB
  async updatePayslipBonus(employeeId: string, periodId: string, bonusAmount: number): Promise<boolean> {
    if (!isRealDbMode()) return true
    return updatePayslipFields(employeeId, periodId, { tong_phieu_cong: bonusAmount }, 'updating bonus')
  },

  // Update Deduction Ticket in Supabase Real DB
  async updatePayslipDeduction(employeeId: string, periodId: string, deductionAmount: number): Promise<boolean> {
    if (!isRealDbMode()) return true
    return updatePayslipFields(employeeId, periodId, { tong_phieu_tru: deductionAmount }, 'updating deduction')
  },

  // Save Full 29-Column Payslip to Supabase Real DB
  async savePayslip(slip: Record<string, unknown>): Promise<boolean> {
    if (!isRealDbMode()) return true
    try {
      const employeeId = String(slip.id || slip.employee_id || slip.nhan_vien_id || '')
      const resolvedPeriodId = await resolvePayrollPeriodId(String(slip.period || slip.ky_luong_id || ''))
      if (!resolvedPeriodId || !UUID_PATTERN.test(employeeId)) return false

      const payload = {
        ky_luong_id: resolvedPeriodId,
        nhan_vien_id: employeeId,
        bo_phan: String(slip.department || ''),
        level: String(slip.level || ''),
        loai_nhan_vien: String(slip.empTypeLabel || slip.employee_type || slip.loai_nhan_vien || ''),
        luong_co_ban: Number(slip.baseSalary ?? slip.base_salary ?? 0) || 0,
        so_ca: Number(slip.totalShifts) || 0,
        tong_so_gio: Number(slip.totalHours) || 0,
        so_gio_thuong: Number(slip.regularHours) || 0,
        so_gio_tang_ca: Number(slip.otHours) || 0,
        tong_so_cong: Number(slip.totalDays) || 0,
        so_cong_thuong: Number(slip.regularDays) || 0,
        so_cong_tang_ca: Number(slip.otDays) || 0,
        tien_tang_ca: Number(slip.otSalary) || 0,
        luong_theo_gio: Number(slip.workedSalary) || 0,
        tong_phu_cap: Number(slip.allowances) || 0,
        tong_phieu_cong: Number(slip.bonusTickets) || 0,
        tong_phat: Number(slip.totalPenalties) || 0,
        tong_phieu_tru: Number(slip.deductionTickets) || 0,
        luong_kpi: Number(slip.kpiSalary) || 0,
        tien_cong_doan: Number(slip.unionFee) || 0,
        tong_luong: Number(slip.grossSalary) || 0,
        hoan_giu_luong: Number(slip.returnHoldSalary) || 0,
        giu_luong: Number(slip.holdSalary) || 0,
        ung_luong: Number(slip.advanceSalary) || 0,
        luong_thuc_nhan: Number(slip.netSalary) || 0,
        lam_tron: Number(slip.roundedNet) || 0,
        trang_thai: String(slip.status || 'Chưa gửi phiếu lương'),
        ghi_chu: String(slip.note || slip.payNote || slip.ghi_chu || ''),
      }

      const { error } = await supabase
        .from('phieu_luong')
        .upsert([payload], { onConflict: 'ky_luong_id,nhan_vien_id' })
      if (error) {
        console.error('[PayrollAdapter] Error saving payslip to DB:', error)
        return false
      }
      return true
    } catch (err) {
      console.error('[PayrollAdapter] Save payslip exception:', err)
      return false
    }
  },

  // Fetch Custom Ticket Types from Supabase
  async getCustomTicketTypes(): Promise<CustomTicketType[]> {
    if (!isRealDbMode()) return mockCustomTicketTypes
    try {
      const { data, error } = await supabase.from('loai_phieu_tu_dinh_nghia').select('*')
      if (error || !data || data.length === 0) return mockCustomTicketTypes
      return data.map((row: Record<string, unknown>) => ({
        id: String(row.id || ''),
        branch: String(row.chi_nhanh || 'Tất cả chi nhánh'),
        type: String(row.loai_phieu || 'Cộng tiền tự định nghĩa'),
        title: String(row.tieu_de || ''),
        amount: Number(row.so_tien || 0),
        note: String(row.ghi_chu || '-'),
      }))
    } catch {
      return mockCustomTicketTypes
    }
  },

  // Save New Custom Ticket Type to Supabase
  async saveCustomTicketType(ticket: Partial<CustomTicketType>): Promise<boolean> {
    if (!isRealDbMode()) return true
    try {
      const { error } = await supabase.from('loai_phieu_tu_dinh_nghia').insert([{
        loai_phieu: ticket.type,
        tieu_de: ticket.title,
        so_tien: ticket.amount,
        ghi_chu: ticket.note,
      }])
      return !error
    } catch {
      return false
    }
  },

  // Save Detailed Ticket Transaction to Supabase
  async saveTicketTransaction(tx: Record<string, unknown>): Promise<boolean> {
    if (!isRealDbMode()) return true
    try {
      const { error } = await supabase.from('phieu_cong_tru_chi_tiet').insert([{
        nhan_vien_id: tx.employee_id,
        ky_luong_id: tx.period_id,
        loai_phieu: tx.type,
        pham_vi: tx.scope,
        ngay_ap_dung: tx.date,
        hinh_thuc: tx.calc_type,
        gia_tri: tx.amount,
        so_tien_quy_doi: tx.converted_amount,
        ghi_chu: tx.note,
        anh_chung_tu: tx.image,
        trang_thai: 'approved',
      }])
      return !error
    } catch {
      return false
    }
  },

  // Fetch Real Ticket Transactions from Supabase DB
  async getTicketTransactions(isBonus: boolean): Promise<Array<Record<string, unknown>>> {
    if (!isRealDbMode()) return []
    try {
      const { data, error } = await supabase
        .from('phieu_cong_tru_chi_tiet')
        .select(`
          *,
          nhan_vien (
            ho_ten,
            ma_nhan_vien
          )
        `)
        .order('ngay_tao', { ascending: false })

      if (error || !data) return []

      const filtered = data.filter((row: Record<string, unknown>) => {
        const typeStr = String(row.loai_phieu || '')
        return isBonus ? typeStr.includes('Cộng') || typeStr.includes('thưởng') : typeStr.includes('Trừ') || typeStr.includes('phạt')
      })

      return filtered.map((row: Record<string, unknown>) => {
        const nv = (row.nhan_vien as Record<string, unknown>) || {}
        return {
          id: String(row.id || ''),
          date_scope: String(row.ngay_ap_dung || '15/08/2026'),
          branch: 'HBP - Trà sữa phô mai tươi HOMIES',
          ticket_type: String(row.loai_phieu || ''),
          employee_id: String(nv.ma_nhan_vien || row.nhan_vien_id || ''),
          employee_name: String(nv.ho_ten || 'Nhân viên'),
          calc_type: String(row.hinh_thuc === 'percent' ? `Phần trăm (${row.gia_tri}%)` : 'Số tiền cố định'),
          amount: Number(row.so_tien_quy_doi || row.gia_tri || 0),
          note: String(row.ghi_chu || '-'),
          image: row.anh_chung_tu ? String(row.anh_chung_tu) : null,
          status: String(row.trang_thai || 'approved'),
        }
      })
    } catch {
      return []
    }
  },

  // Approve Ticket Transaction in Supabase
  async approveTicketTransaction(id: string): Promise<boolean> {
    if (!isRealDbMode()) return true
    try {
      const { error } = await supabase.from('phieu_cong_tru_chi_tiet').update({ trang_thai: 'approved' }).eq('id', id)
      return !error
    } catch {
      return false
    }
  },

  // Delete Ticket Transaction in Supabase
  async deleteTicketTransaction(id: string): Promise<boolean> {
    if (!isRealDbMode()) return true
    try {
      const { error } = await supabase.from('phieu_cong_tru_chi_tiet').delete().eq('id', id)
      return !error
    } catch {
      return false
    }
  },
}
