/**
 * Registry mô tả mọi trường cấu hình chính sách lương (Payroll Policy Registry).
 * Cho phép trang cài đặt và engine sinh tự động từ định nghĩa trường thay vì hardcode.
 */

import type { PayrollPolicy } from '@/lib/services/payroll/payroll-policy-service'

export type PayrollPolicyMeta = {
  schemaVersion: number
  policyVersion: number
  effectiveFrom: string
  updatedAt: string
  updatedBy: string | null
  note: string | null
}

export interface PolicyFieldDef {
  path: string              // 'work.standardDaysPerMonth'
  labelVi: string           // 'Số ngày công chuẩn / tháng'
  helpVi: string            // câu giải thích cho chủ shop
  type: 'number' | 'money' | 'percent' | 'boolean' | 'enum' | 'string'
  unit?: 'vnd' | 'day' | 'hour' | 'percent'
  options?: { value: string; labelVi: string }[]
  min?: number
  max?: number
  step?: number
  affectsMoney: boolean     // true = đổi là đổi tiền, UI phải bắt xem trước tác động
  requiresApproval: boolean // true = cần CEO duyệt
  legalRefVi?: string       // 'Nghị định 293/2025/NĐ-CP'
  defaultValue: unknown     // = hành vi hiện tại
}

export const POLICY_REGISTRY: PolicyFieldDef[] = [
  {
    path: 'work.standardDaysPerMonth',
    labelVi: 'Số ngày công chuẩn / tháng',
    helpVi: 'Số ngày công định mức trong tháng để chia lương ngày cho nhân sự full-time',
    type: 'number',
    unit: 'day',
    min: 20,
    max: 31,
    step: 1,
    affectsMoney: true,
    requiresApproval: true,
    defaultValue: 26,
  },
  {
    path: 'work.standardHoursPerDay',
    labelVi: 'Số giờ làm việc chuẩn / ngày',
    helpVi: 'Số giờ làm việc tiêu chuẩn trong một ca thông thường (thường là 8 giờ)',
    type: 'number',
    unit: 'hour',
    min: 4,
    max: 12,
    step: 0.5,
    affectsMoney: true,
    requiresApproval: true,
    defaultValue: 8,
  },
  {
    path: 'legal.personalDeduction',
    labelVi: 'Giảm trừ gia cảnh bản thân',
    helpVi: 'Mức giảm trừ thuế TNCN hàng tháng cho bản thân người lao động',
    type: 'money',
    unit: 'vnd',
    min: 0,
    max: 50000000,
    step: 100000,
    affectsMoney: true,
    requiresApproval: true,
    legalRefVi: 'Nghị quyết 954/2020/UBTVQH14',
    defaultValue: 11000000,
  },
  {
    path: 'legal.dependentDeduction',
    labelVi: 'Giảm trừ người phụ thuộc',
    helpVi: 'Mức giảm trừ thuế TNCN hàng tháng cho mỗi người phụ thuộc đăng ký hợp lệ',
    type: 'money',
    unit: 'vnd',
    min: 0,
    max: 20000000,
    step: 100000,
    affectsMoney: true,
    requiresApproval: true,
    legalRefVi: 'Nghị quyết 954/2020/UBTVQH14',
    defaultValue: 4400000,
  },
  {
    path: 'legal.minRegionSalary',
    labelVi: 'Lương tối thiểu vùng I',
    helpVi: 'Mức lương sàn tối thiểu theo vùng theo quy định pháp luật lao động hiện hành',
    type: 'money',
    unit: 'vnd',
    min: 0,
    max: 20000000,
    step: 1000,
    affectsMoney: true,
    requiresApproval: true,
    legalRefVi: 'Nghị định 293/2025/NĐ-CP',
    defaultValue: 20000,
  },
  {
    path: 'legal.maxInsuranceSalary',
    labelVi: 'Mức trần đóng BHXH/BHYT',
    helpVi: 'Mức lương tối đa làm căn cứ trích nộp BHXH và BHYT (20 lần lương cơ sở)',
    type: 'money',
    unit: 'vnd',
    min: 0,
    max: 100000000,
    step: 100000,
    affectsMoney: true,
    requiresApproval: true,
    defaultValue: 29800000,
  },
  {
    path: 'rates.bhxhEmployee',
    labelVi: 'Tỷ lệ đóng BHXH nhân viên',
    helpVi: 'Tỷ lệ trích nộp Bảo hiểm xã hội trừ vào thu nhập nhân viên (8%)',
    type: 'percent',
    unit: 'percent',
    min: 0,
    max: 1,
    step: 0.005,
    affectsMoney: true,
    requiresApproval: true,
    legalRefVi: 'Luật BHXH',
    defaultValue: 0.08,
  },
  {
    path: 'rates.bhytEmployee',
    labelVi: 'Tỷ lệ đóng BHYT nhân viên',
    helpVi: 'Tỷ lệ trích nộp Bảo hiểm y tế trừ vào thu nhập nhân viên (1.5%)',
    type: 'percent',
    unit: 'percent',
    min: 0,
    max: 1,
    step: 0.005,
    affectsMoney: true,
    requiresApproval: true,
    legalRefVi: 'Luật BHYT',
    defaultValue: 0.015,
  },
  {
    path: 'rates.bhtnEmployee',
    labelVi: 'Tỷ lệ đóng BHTN nhân viên',
    helpVi: 'Tỷ lệ trích nộp Bảo hiểm thất nghiệp trừ vào thu nhập nhân viên (1%)',
    type: 'percent',
    unit: 'percent',
    min: 0,
    max: 1,
    step: 0.005,
    affectsMoney: true,
    requiresApproval: true,
    legalRefVi: 'Luật Việc làm',
    defaultValue: 0.01,
  },
  {
    path: 'rates.probation',
    labelVi: 'Tỷ lệ lương thử việc',
    helpVi: 'Tỷ lệ phần trăm hưởng lương trong thời gian thử việc (tối thiểu 85%)',
    type: 'percent',
    unit: 'percent',
    min: 0.5,
    max: 1,
    step: 0.05,
    affectsMoney: true,
    requiresApproval: true,
    legalRefVi: 'Điều 26 Bộ luật Lao động',
    defaultValue: 0.85,
  },
  {
    path: 'rates.otWeekday',
    labelVi: 'Hệ số tăng ca ngày thường',
    helpVi: 'Hệ số tính tiền tăng ca đối với giờ làm thêm vào ngày làm việc bình thường (150%)',
    type: 'number',
    min: 1,
    max: 5,
    step: 0.1,
    affectsMoney: true,
    requiresApproval: true,
    legalRefVi: 'Điều 98 Bộ luật Lao động',
    defaultValue: 1.5,
  },
  {
    path: 'rates.otNight',
    labelVi: 'Hệ số ca đêm / tăng ca đêm',
    helpVi: 'Hệ số trả thêm khi làm việc ca đêm hoặc làm thêm giờ vào ban đêm (130%)',
    type: 'number',
    min: 1,
    max: 5,
    step: 0.1,
    affectsMoney: true,
    requiresApproval: true,
    legalRefVi: 'Điều 98 Bộ luật Lao động',
    defaultValue: 1.3,
  },
  {
    path: 'rates.otHoliday',
    labelVi: 'Hệ số tăng ca ngày lễ/Tết',
    helpVi: 'Hệ số tính tiền tăng ca vào ngày nghỉ lễ, Tết có hưởng lương (300%)',
    type: 'number',
    min: 1,
    max: 5,
    step: 0.1,
    affectsMoney: true,
    requiresApproval: true,
    legalRefVi: 'Điều 98 Bộ luật Lao động',
    defaultValue: 3.0,
  },
  {
    path: 'rates.latePenaltyPerOccurrence',
    labelVi: 'Mức phạt đi muộn / lần',
    helpVi: 'Số tiền phạt trừ vào lương cho mỗi lần nhân viên đi muộn đã được duyệt',
    type: 'money',
    unit: 'vnd',
    min: 0,
    max: 500000,
    step: 5000,
    affectsMoney: true,
    requiresApproval: false,
    defaultValue: 50000,
  },
  {
    path: 'netRoundingMethod',
    labelVi: 'Quy tắc làm tròn lương thực nhận',
    helpVi: 'Phương thức làm tròn tiền lương Net chi trả (không làm tròn, 1.000đ, 5.000đ, 10.000đ)',
    type: 'enum',
    options: [
      { value: 'none', labelVi: 'Không làm tròn (từng đồng)' },
      { value: 'round_1000', labelVi: 'Làm tròn đến 1.000đ (mặc định)' },
      { value: 'round_5000', labelVi: 'Làm tròn đến 5.000đ' },
      { value: 'round_10000', labelVi: 'Làm tròn đến 10.000đ' },
    ],
    affectsMoney: true,
    requiresApproval: false,
    defaultValue: 'round_1000',
  },
  {
    path: 'shiftRules.partTimeShiftHours',
    labelVi: 'Số giờ ca ngắn tiêu chuẩn (Part-time)',
    helpVi: 'Số giờ tiêu chuẩn của một ca làm việc bán thời gian F&B (mặc định 4 giờ)',
    type: 'number',
    unit: 'hour',
    min: 1,
    max: 8,
    step: 0.5,
    affectsMoney: false,
    requiresApproval: false,
    defaultValue: 4,
  },
  {
    path: 'shiftRules.fullTimeShiftHours',
    labelVi: 'Số giờ ca dài tiêu chuẩn (Full-time)',
    helpVi: 'Số giờ tiêu chuẩn của một ca làm việc toàn thời gian F&B (mặc định 8 giờ)',
    type: 'number',
    unit: 'hour',
    min: 4,
    max: 12,
    step: 0.5,
    affectsMoney: false,
    requiresApproval: false,
    defaultValue: 8,
  },
  {
    path: 'shiftRules.minShiftHours',
    labelVi: 'Số giờ tối thiểu để tính 1 ca',
    helpVi: 'Lượt chấm công phải đạt tối thiểu số giờ này mới được tính là 1 ca hoàn chỉnh (mặc định 2 giờ)',
    type: 'number',
    unit: 'hour',
    min: 0.5,
    max: 6,
    step: 0.5,
    affectsMoney: false,
    requiresApproval: false,
    defaultValue: 2,
  },
  {
    path: 'latePenaltyPolicy.mode',
    labelVi: 'Chế độ tính phạt đi muộn',
    helpVi: 'Lựa chọn phương thức phạt: Cố định mỗi lần hoặc Phạt theo bậc thang số phút',
    type: 'enum',
    options: [
      { value: 'fixed', labelVi: 'Phạt cố định mỗi lần' },
      { value: 'tiered', labelVi: 'Phạt theo bậc thang số phút' },
    ],
    affectsMoney: true,
    requiresApproval: false,
    defaultValue: 'fixed',
  },
  {
    path: 'latePenaltyPolicy.graceOccurrences',
    labelVi: 'Số lần miễn phạt trong tháng',
    helpVi: 'Số lần đi muộn đầu tiên trong tháng được miễn trừ phạt tiền (mặc định 2 lần)',
    type: 'number',
    min: 0,
    max: 10,
    step: 1,
    affectsMoney: true,
    requiresApproval: false,
    defaultValue: 2,
  },
  {
    path: 'latePenaltyPolicy.fixedAmount',
    labelVi: 'Mức phạt cố định / lần',
    helpVi: 'Số tiền phạt mỗi lần áp dụng cho chế độ phạt cố định',
    type: 'money',
    unit: 'vnd',
    min: 0,
    max: 500000,
    step: 5000,
    affectsMoney: true,
    requiresApproval: false,
    defaultValue: 50000,
  },
  {
    path: 'latePenaltyPolicy.tier1MaxMinutes',
    labelVi: 'Giới hạn phút bậc 1 (Nhẹ)',
    helpVi: 'Số phút đi muộn tối đa của bậc 1 (mặc định 15 phút)',
    type: 'number',
    min: 5,
    max: 30,
    step: 1,
    affectsMoney: true,
    requiresApproval: false,
    defaultValue: 15,
  },
  {
    path: 'latePenaltyPolicy.tier1Amount',
    labelVi: 'Mức phạt bậc 1',
    helpVi: 'Số tiền phạt khi đi muộn ở bậc 1',
    type: 'money',
    unit: 'vnd',
    min: 0,
    max: 200000,
    step: 5000,
    affectsMoney: true,
    requiresApproval: false,
    defaultValue: 20000,
  },
  {
    path: 'latePenaltyPolicy.tier2MaxMinutes',
    labelVi: 'Giới hạn phút bậc 2 (Vừa)',
    helpVi: 'Số phút đi muộn tối đa của bậc 2 (mặc định 30 phút)',
    type: 'number',
    min: 15,
    max: 60,
    step: 5,
    affectsMoney: true,
    requiresApproval: false,
    defaultValue: 30,
  },
  {
    path: 'latePenaltyPolicy.tier2Amount',
    labelVi: 'Mức phạt bậc 2',
    helpVi: 'Số tiền phạt khi đi muộn ở bậc 2',
    type: 'money',
    unit: 'vnd',
    min: 0,
    max: 500000,
    step: 10000,
    affectsMoney: true,
    requiresApproval: false,
    defaultValue: 50000,
  },
  {
    path: 'latePenaltyPolicy.tier3Amount',
    labelVi: 'Mức phạt bậc 3 (Nặng)',
    helpVi: 'Số tiền phạt khi đi muộn vượt quá giới hạn bậc 2 (> 30 phút)',
    type: 'money',
    unit: 'vnd',
    min: 0,
    max: 1000000,
    step: 10000,
    affectsMoney: true,
    requiresApproval: false,
    defaultValue: 100000,
  },
  {
    path: 'fnb.splitShiftMinBreakHours',
    labelVi: 'Khoảng cách tối thiểu giữa 2 ca để tính ca gãy',
    helpVi: 'Số giờ nghỉ giữa 2 ca trong cùng 1 ngày để được hưởng phụ cấp ca gãy (mặc định 2 giờ)',
    type: 'number',
    unit: 'hour',
    min: 1,
    max: 6,
    step: 0.5,
    affectsMoney: true,
    requiresApproval: false,
    defaultValue: 2,
  },
  {
    path: 'fnb.nightShiftStartHour',
    labelVi: 'Khung giờ bắt đầu tính ca đêm',
    helpVi: 'Mốc giờ bắt đầu tính phụ cấp ca đêm hoặc ca chốt muộn (mặc định 22 giờ)',
    type: 'number',
    unit: 'hour',
    min: 20,
    max: 24,
    step: 1,
    affectsMoney: true,
    requiresApproval: false,
    defaultValue: 22,
  },
]

/**
 * Đọc giá trị cấu hình từ policy theo đường dẫn path phân cấp (vd: 'work.standardDaysPerMonth')
 */
export function getPolicyValueByPath(policy: unknown, path: string): unknown {
  if (!policy || typeof policy !== 'object' || !path) return undefined
  const obj = policy as Record<string, any>

  if (path === 'work.standardDaysPerMonth') {
    return obj.work?.standardDaysPerMonth ?? obj.standardDaysPerMonth
  }
  if (path === 'work.standardHoursPerDay') {
    return obj.work?.standardHoursPerDay ?? obj.standardHoursPerDay
  }

  const parts = path.split('.')
  let current: any = obj
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined
    current = current[part]
  }
  return current
}

/**
 * Ghi giá trị vào policy theo đường dẫn path phân cấp (vd: 'work.standardDaysPerMonth')
 */
export function setPolicyValueByPath(policy: Record<string, any>, path: string, value: unknown): void {
  if (!policy || !path) return

  if (path === 'work.standardDaysPerMonth') {
    policy.standardDaysPerMonth = value
    if (!policy.work) policy.work = {}
    policy.work.standardDaysPerMonth = value
    return
  }
  if (path === 'work.standardHoursPerDay') {
    policy.standardHoursPerDay = value
    if (!policy.work) policy.work = {}
    policy.work.standardHoursPerDay = value
    return
  }

  const parts = path.split('.')
  let current: any = policy
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i]
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {}
    }
    current = current[part]
  }
  current[parts[parts.length - 1]] = value
}

export interface PolicyValidationError {
  path: string
  labelVi: string
  message: string
}

export interface PolicyValidationResult {
  isValid: boolean
  errors: PolicyValidationError[]
}

/**
 * Kiểm tra tính hợp lệ của chính sách lương theo registry (hàm thuần, không side-effect)
 */
export function validatePolicy(policy: unknown): PolicyValidationResult {
  const errors: PolicyValidationError[] = []

  if (!policy || typeof policy !== 'object') {
    return {
      isValid: false,
      errors: [{ path: '', labelVi: 'Cấu hình', message: 'Dữ liệu chính sách không hợp lệ' }],
    }
  }

  for (const field of POLICY_REGISTRY) {
    const val = getPolicyValueByPath(policy, field.path)

    if (val === undefined || val === null) {
      errors.push({
        path: field.path,
        labelVi: field.labelVi,
        message: `Trường "${field.labelVi}" không được để trống`,
      })
      continue
    }

    if (field.type === 'number' || field.type === 'money' || field.type === 'percent') {
      if (typeof val !== 'number' || isNaN(val)) {
        errors.push({
          path: field.path,
          labelVi: field.labelVi,
          message: `Trường "${field.labelVi}" phải là số hợp lệ`,
        })
        continue
      }
      if (typeof field.min === 'number' && val < field.min) {
        errors.push({
          path: field.path,
          labelVi: field.labelVi,
          message: `Trường "${field.labelVi}" không được nhỏ hơn ${field.min}`,
        })
      }
      if (typeof field.max === 'number' && val > field.max) {
        errors.push({
          path: field.path,
          labelVi: field.labelVi,
          message: `Trường "${field.labelVi}" không được vượt quá ${field.max}`,
        })
      }
    } else if (field.type === 'boolean') {
      if (typeof val !== 'boolean') {
        errors.push({
          path: field.path,
          labelVi: field.labelVi,
          message: `Trường "${field.labelVi}" phải là kiểu đúng/sai (boolean)`,
        })
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Chuyển đổi dữ liệu chính sách thô/cũ thành PayrollPolicy chuẩn có đầy đủ khối meta (hàm thuần)
 * Đảm bảo JSON cũ vào -> có meta đầy đủ, không thay đổi bất kỳ con số tiền nào
 */
export function migratePolicy(raw: unknown): PayrollPolicy {
  const source = (raw && typeof raw === 'object') ? (raw as Record<string, any>) : {}
  // Xử lý trường hợp bọc trong payload: { meta, payload }
  const actual = ('payload' in source && source.payload && typeof source.payload === 'object')
    ? (source.payload as Record<string, any>)
    : source

  // Trích xuất hoặc sinh khối meta mặc định
  const existingMeta = (actual.meta || source.meta || {}) as Partial<PayrollPolicyMeta>
  const meta: PayrollPolicyMeta = {
    schemaVersion: typeof existingMeta.schemaVersion === 'number' ? existingMeta.schemaVersion : 1,
    policyVersion: typeof existingMeta.policyVersion === 'number' ? existingMeta.policyVersion : 1,
    effectiveFrom: typeof existingMeta.effectiveFrom === 'string' ? existingMeta.effectiveFrom : '2026-01-01',
    updatedAt: typeof existingMeta.updatedAt === 'string' ? existingMeta.updatedAt : (actual.updatedAt || new Date().toISOString()),
    updatedBy: existingMeta.updatedBy ?? (actual.updatedBy || null),
    note: existingMeta.note ?? null,
  }

  // Khởi tạo đối tượng kết quả kế thừa toàn bộ thuộc tính hiện có
  const result: any = {
    ...actual,
    meta,
    version: actual.version || 'VN-2026.01',
    status: actual.status || 'active',
    updatedBy: meta.updatedBy || 'System preset',
    updatedAt: meta.updatedAt,
    grades: Array.isArray(actual.grades) ? actual.grades : [],
    allowances: Array.isArray(actual.allowances) ? actual.allowances : [],
    fnb: (actual.fnb && typeof actual.fnb === 'object') ? { ...actual.fnb } : {},
    rates: (actual.rates && typeof actual.rates === 'object') ? { ...actual.rates } : {},
    legal: (actual.legal && typeof actual.legal === 'object') ? { ...actual.legal } : {},
  }

  // Bổ sung các giá trị mặc định từ registry nếu trường cũ bị thiếu
  for (const field of POLICY_REGISTRY) {
    const currentVal = getPolicyValueByPath(result, field.path)
    if (currentVal === undefined || currentVal === null || (typeof currentVal === 'number' && isNaN(currentVal))) {
      setPolicyValueByPath(result, field.path, field.defaultValue)
    }
  }

  // Đảm bảo đồng bộ 2 chiều giữa root standardDaysPerMonth và work.standardDaysPerMonth
  const stdDays = (typeof result.standardDaysPerMonth === 'number' && result.standardDaysPerMonth > 0)
    ? result.standardDaysPerMonth
    : (result.work?.standardDaysPerMonth ?? 26)
  result.standardDaysPerMonth = stdDays
  if (!result.work) result.work = {}
  result.work.standardDaysPerMonth = stdDays

  const stdHours = (typeof result.standardHoursPerDay === 'number' && result.standardHoursPerDay > 0)
    ? result.standardHoursPerDay
    : (result.work?.standardHoursPerDay ?? 8)
  result.standardHoursPerDay = stdHours
  result.work.standardHoursPerDay = stdHours

  return result as PayrollPolicy
}
