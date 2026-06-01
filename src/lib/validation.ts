// ═══════════════════════════════════════════════════════════════════════════════
// Zod Schemas - Runtime Validation for Type Safety
// Phase DE-1: Type-safe everywhere with Zod
// ═══════════════════════════════════════════════════════════════════════════════

import { z } from 'zod'

// ─────────────────────────────────────────────────────────────────────────────
// USER & AUTH SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const UserRoleSchema = z.enum([
  'ceo',
  'hr_admin',
  'store_manager',
  'area_manager',
  'shift_leader',
  'employee',
])

export const LoginSchema = z.object({
  email: z.string().email('Email không hợp lệ'),
  password: z.string().min(6, 'Mật khẩu ít nhất 6 ký tự'),
})

export const UserSchema = z.object({
  id: z.string(),
  full_name: z.string().min(2, 'Tên quá ngắn'),
  email: z.string().email(),
  role: UserRoleSchema,
  store_id: z.string(),
  position_id: z.string(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional(),
  employee_code: z.string(),
  status: z.enum(['active', 'inactive', 'on_leave']),
  total_points: z.number().default(0),
  gamification_level: z.string(),
  hire_date: z.string(),
})

// ─────────────────────────────────────────────────────────────────────────────
// EMPLOYEE SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const EmployeeCreateSchema = z.object({
  full_name: z.string().min(2, 'Tên ít nhất 2 ký tự').max(100),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().regex(/^0[0-9]{9}$/, 'Số điện thoại không hợp lệ'),
  role: UserRoleSchema,
  store_id: z.string().min(1, 'Chọn cửa hàng'),
  position_id: z.string().min(1, 'Chọn vị trí'),
  hire_date: z.string(),
  salary: z.number().positive('Lương phải lớn hơn 0').optional(),
})

export const EmployeeUpdateSchema = EmployeeCreateSchema.partial().extend({
  id: z.string(),
})

// ─────────────────────────────────────────────────────────────────────────────
// LEAVE SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const LeaveTypeSchema = z.enum([
  'annual',      // Nghỉ phép năm
  'sick',       // Nghỉ ốm
  'unpaid',     // Nghỉ không lương
  'maternity',  // Thai sản
  'paternity',  // Cha nhận con
  'personal',   // Việc riêng
])

export const LeaveRequestSchema = z.object({
  leave_type: LeaveTypeSchema,
  start_date: z.string().refine((date) => new Date(date) >= new Date(new Date().setHours(0,0,0,0)), {
    message: 'Ngày bắt đầu phải từ hôm nay trở đi',
  }),
  end_date: z.string(),
  reason: z.string().min(10, 'Lý do ít nhất 10 ký tự').max(500),
  is_half_day: z.boolean().default(false),
})

// ─────────────────────────────────────────────────────────────────────────────
// SCHEDULE SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const ShiftSchema = z.object({
  id: z.string(),
  name: z.string(),
  start_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ không hợp lệ'),
  end_time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Giờ không hợp lệ'),
  color: z.string(),
})

export const ScheduleAssignSchema = z.object({
  employee_id: z.string().min(1, 'Chọn nhân viên'),
  shift_id: z.string().min(1, 'Chọn ca làm'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày không hợp lệ'),
  store_id: z.string().min(1, 'Chọn cửa hàng'),
})

// ─────────────────────────────────────────────────────────────────────────────
// CHECK-IN SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const CheckinSchema = z.object({
  user_id: z.string(),
  store_id: z.string(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  distance_meters: z.number().min(0),
  method: z.enum(['gps', 'wifi', 'gps_offline']),
  shift_id: z.string().optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// PAYROLL SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const PayrollCalculateSchema = z.object({
  employee_id: z.string().min(1, 'Chọn nhân viên'),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2030),
  store_id: z.string().optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// KPI SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const KPIFeedbackSchema = z.object({
  employee_id: z.string(),
  kpi_id: z.string(),
  score: z.number().min(1).max(5),
  comment: z.string().max(500).optional(),
  period: z.string(),
})

// ─────────────────────────────────────────────────────────────────────────────
// TASK SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

export const TaskCompleteSchema = z.object({
  task_id: z.string().min(1, 'Chọn công việc'),
  completed_at: z.string(),
  notes: z.string().max(1000).optional(),
  attachments: z.array(z.string().url()).optional(),
})

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Safe parse with error messages
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context = 'Validation'
): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors = result.error.issues.map(
    (err) => `${err.path.join('.')}: ${err.message}`
  )
  
  console.warn(`[${context}] Validation failed:`, errors)
  
  return { success: false, errors }
}

/**
 * Assert valid data, throw if invalid
 */
export function assertValid<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  context = 'Validation'
): T {
  const result = schema.safeParse(data)
  
  if (!result.success) {
    const errors = result.error.issues.map(e => `${e.path}: ${e.message}`)
    throw new Error(`[${context}] Invalid data: ${errors.join(', ')}`)
  }
  
  return result.data
}

/**
 * Form validation helper
 */
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  formData: FormData
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const rawData = Object.fromEntries(formData.entries())
  const result = schema.safeParse(rawData)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  const errors: Record<string, string> = {}
  result.error.issues.forEach((err) => {
    const key = err.path.join('.')
    errors[key] = err.message
  })
  
  return { success: false, errors }
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

const validationExports = {
  UserRoleSchema,
  LoginSchema,
  UserSchema,
  EmployeeCreateSchema,
  EmployeeUpdateSchema,
  LeaveTypeSchema,
  LeaveRequestSchema,
  ShiftSchema,
  ScheduleAssignSchema,
  CheckinSchema,
  PayrollCalculateSchema,
  KPIFeedbackSchema,
  TaskCompleteSchema,
  safeParse,
  assertValid,
  validateForm,
}

export default validationExports
