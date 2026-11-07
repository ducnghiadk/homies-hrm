// ============================================================================
// HRM Trà Sữa 🧋 — Payroll Calculator Module
// Xử lý tính toán lương theo giờ cho nhân viên bán thời gian & tăng ca
// ============================================================================

export interface EmployeeSalaryProfile {
  id?: string
  hourly_rate?: number | null
  official_salary?: number | null
  contract_type?: string | null
}

export interface PositionSalaryProfile {
  id?: string
  base_salary?: number | null
}

export interface HourlyEarningsInput {
  totalHours: number
  hourlyRate: number
  overtimeHours?: number
  overtimeMultiplier?: number
}

export interface HourlyEarningsResult {
  normalHours: number
  hourlyRate: number
  baseEarned: number
  overtimeHours: number
  overtimeMultiplier: number
  overtimeAmount: number
  totalEarned: number
}

/**
 * Lấy đơn giá giờ thực tế của nhân viên.
 * Ưu tiên 1: `hourly_rate` cấu hình riêng trong hồ sơ nhân viên.
 * Ưu tiên 2: `official_salary` quy đổi (nếu >= 1,000,000 thì chia 26 ngày / 8 giờ).
 * Ưu tiên 3: `base_salary` theo chức vụ (nếu >= 1,000,000 thì chia 26 ngày / 8 giờ).
 * Ưu tiên 4: Mức sàn tối thiểu mặc định (22,000 VNĐ/giờ).
 */
export function getEffectiveHourlyRate(
  employee?: EmployeeSalaryProfile | null,
  position?: PositionSalaryProfile | null,
  fallbackRate: number = 22000,
  standardDays: number = 26,
  standardHoursPerDay: number = 8
): number {
  if (!employee) return fallbackRate

  // 1. Ưu tiên mức lương giờ cá nhân được gán riêng
  if (typeof employee.hourly_rate === 'number' && employee.hourly_rate > 0) {
    return employee.hourly_rate
  }

  // 2. Lương chính thức trong hồ sơ
  if (typeof employee.official_salary === 'number' && employee.official_salary > 0) {
    if (employee.official_salary >= 1000000) {
      return Math.round(employee.official_salary / standardDays / standardHoursPerDay)
    }
    return employee.official_salary
  }

  // 3. Mức lương theo chức vụ
  if (typeof position?.base_salary === 'number' && position.base_salary > 0) {
    if (position.base_salary >= 1000000) {
      return Math.round(position.base_salary / standardDays / standardHoursPerDay)
    }
    return position.base_salary
  }

  // 4. Mức sàn mặc định
  return fallbackRate
}

/**
 * Tính toán thu nhập theo giờ làm việc thực tế cho nhân viên Part-time
 */
export function calculateHourlyEarnings(input: HourlyEarningsInput): HourlyEarningsResult {
  const { totalHours, hourlyRate, overtimeHours = 0, overtimeMultiplier = 1.5 } = input
  const safeHourlyRate = Math.max(0, hourlyRate)
  const safeOtHours = Math.max(0, overtimeHours)
  const normalHours = Math.max(0, totalHours - safeOtHours)

  const baseEarned = Math.round(normalHours * safeHourlyRate)
  const overtimeAmount = Math.round(safeOtHours * safeHourlyRate * overtimeMultiplier)
  const totalEarned = baseEarned + overtimeAmount

  return {
    normalHours,
    hourlyRate: safeHourlyRate,
    baseEarned,
    overtimeHours: safeOtHours,
    overtimeMultiplier,
    overtimeAmount,
    totalEarned,
  }
}
