// ============================================
// HRM Trà Sữa 🧋 — Trạng thái kỳ lương
// Đồng bộ 100% với PostgreSQL ENUM:
// CREATE TYPE trang_thai_ky_luong AS ENUM ('nhap', 'da_xac_nhan', 'da_thanhtoan');
// ============================================

export const PAYROLL_PERIOD_STATUS = {
  DRAFT: 'nhap',
  CONFIRMED: 'da_xac_nhan',
  PAID: 'da_thanhtoan',
} as const

export type PayrollPeriodStatus = typeof PAYROLL_PERIOD_STATUS[keyof typeof PAYROLL_PERIOD_STATUS]

export function isPayrollPeriodStatus(v: unknown): v is PayrollPeriodStatus {
  return typeof v === 'string' && Object.values(PAYROLL_PERIOD_STATUS).includes(v as PayrollPeriodStatus)
}

export const PERIOD_STATUS_LABEL_VI: Record<PayrollPeriodStatus, string> = {
  [PAYROLL_PERIOD_STATUS.DRAFT]: 'Bản nháp',
  [PAYROLL_PERIOD_STATUS.CONFIRMED]: 'Kỳ đã chốt',
  [PAYROLL_PERIOD_STATUS.PAID]: 'Đã thanh toán',
}

export const PERIOD_STATUS_BADGE: Record<
  PayrollPeriodStatus,
  { bg: string; color: string; className: string }
> = {
  [PAYROLL_PERIOD_STATUS.DRAFT]: {
    bg: 'var(--gray-100)',
    color: 'var(--text-muted)',
    className: 'bg-gray-100 text-gray-600',
  },
  [PAYROLL_PERIOD_STATUS.CONFIRMED]: {
    bg: 'var(--success-light)',
    color: 'var(--success)',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  [PAYROLL_PERIOD_STATUS.PAID]: {
    bg: 'var(--primary-50, #eff6ff)',
    color: 'var(--primary-700, #1d4ed8)',
    className: 'bg-blue-50 text-blue-700 border-blue-200',
  },
}

export function canEditPeriod(status: unknown): boolean {
  return status === PAYROLL_PERIOD_STATUS.DRAFT || !status
}

export function canClosePeriod(status: unknown): boolean {
  return status === PAYROLL_PERIOD_STATUS.DRAFT || !status
}
