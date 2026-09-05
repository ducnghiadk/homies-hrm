// ═══════════════════════════════════════════════════════════════════════════════
// RBAC - Role-Based Access Control System
// Phase 2: Bảo vệ từng phòng - Kiểm soát truy cập theo vai trò
// ═══════════════════════════════════════════════════════════════════════════════

import type { UserRole } from '@/store/auth-store'
export type { UserRole }

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION DEFINITIONS
// ─────────────────────────────────────────────────────────────────────────────

export type Permission =
  // Employee Management
  | 'employees.view'
  | 'employees.create'
  | 'employees.edit'
  | 'employees.delete'
  | 'employees.export'
  | 'employees.import'
  | 'employees.offboarding'
  | 'employees.view_salary'
  | 'employees.view_kpi'

  // Leave Management
  | 'leave.request'
  | 'leave.approve'
  | 'leave.cancel_own'
  | 'leave.cancel_any'
  | 'leave.view_all'
  | 'leave.calendar'
  | 'leave.balance'
  // Schedule Management
  | 'schedule.view'
  | 'schedule.assign'
  | 'schedule.swap'
  | 'schedule.auto_generate'
  | 'schedule.open_shifts.claim'
  | 'schedule.open_shifts.post'
  | 'schedule.preferences'
  | 'schedule.warnings'
  | 'schedule.by_shift'
  // Attendance & Check-in
  | 'attendance.view_own'
  | 'attendance.view_team'
  | 'attendance.view_all'
  | 'attendance.overtime'
  | 'attendance.devices'
  | 'checkin.view_logs'
  // KPI & Evaluation
  | 'kpi.view_own'
  | 'kpi.view_team'
  | 'kpi.view_all'
  | 'kpi.evaluate'
  | 'kpi.settings'
  | 'kpi.reports'
  | 'kpi.promotion'
  | 'kpi.violations.view'
  | 'kpi.violations.manage'
  | 'kpi.violations.appeal'
  // Payroll
  | 'payroll.view_own'
  | 'payroll.view_team'
  | 'payroll.calculate'
  | 'payroll.view_all'
  | 'payroll.bonus'
  | 'payroll.deductions'
  | 'payroll.advance'
  | 'payroll.hold'
  | 'payroll.insurance'
  | 'payroll.company'
  // Reports & Analytics
  | 'reports.attendance'
  | 'reports.salary_structure'
  | 'reports.budget'
  | 'reports.hr_overview'
  | 'reports.staff_hours'
  | 'reports.tasks'
  | 'reports.auto_raise'
  | 'analytics.view'
  | 'analytics.retrospective'
  // Settings
  | 'settings.view'
  | 'settings.staffing'
  | 'settings.labor_cost'
  | 'settings.schedule_rules'
  | 'settings.wifi'
  | 'settings.payroll'
  | 'settings.master_data'
  | 'settings.system'
  // Staffing Calculator
  | 'staffing.view'
  | 'staffing.calculate'
  | 'staffing.optimize'
  // Other
  | 'tasks.view'
  | 'tasks.incidents'
  | 'tasks.handover'
  | 'tasks.templates'
  | 'recognition.send'
  | 'recognition.view'
  | 'career.view'
  | 'career.goals'
  | 'career.leaderboard'
  | 'career.skills'
  | 'learning.view'
  | 'gamification.view'
  | 'news.view'
  | 'chat.view'
  | 'chat.team'
  | 'inventory.view'
  | 'wellness.view'

// ─────────────────────────────────────────────────────────────────────────────
// ROLE HIERARCHY
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  employee: 1,
  shift_leader: 2,
  store_manager: 3,
  area_manager: 4,
  hr_admin: 5,
  ceo: 6,
}

// ─────────────────────────────────────────────────────────────────────────────
// BASE PERMISSION SETS (Avoid circular reference)
// ─────────────────────────────────────────────────────────────────────────────


const EMPLOYEE_PERMISSIONS: Permission[] = [
  'employees.view',
  'employees.view_kpi',
  'attendance.view_own',
  'checkin.view_logs',
  'leave.request',
  'leave.cancel_own',
  'leave.balance',
  'payroll.view_own',
  'kpi.view_own',
  'kpi.violations.view',
  'schedule.view',
  'schedule.swap',
  'schedule.open_shifts.claim',
  'schedule.preferences',
  'tasks.view',
  'recognition.send',
  'recognition.view',
  'career.view',
  'career.goals',
  'career.leaderboard',
  'career.skills',
  'learning.view',
  'gamification.view',
  'news.view',
  'chat.view',
  'wellness.view',
  'settings.view',
]

const SHIFT_LEADER_PERMISSIONS: Permission[] = [
  ...EMPLOYEE_PERMISSIONS,
  'employees.view',
  'employees.view_kpi',
  'attendance.view_team',
  'kpi.view_team',
  'leave.calendar',
  'schedule.warnings',
  'tasks.incidents',
  'tasks.handover',
  'chat.team',
]


const STORE_MANAGER_PERMISSIONS: Permission[] = [
  ...SHIFT_LEADER_PERMISSIONS,
  'employees.create',
  'employees.edit',
  'leave.approve',
  'leave.view_all',
  'schedule.assign',
  'schedule.open_shifts.post',
  'attendance.overtime',
  'tasks.templates',
  'settings.schedule_rules',
  'settings.wifi',
]

const AREA_MANAGER_PERMISSIONS: Permission[] = [
  ...STORE_MANAGER_PERMISSIONS,
  'attendance.view_all',
  'kpi.view_all',
  'reports.attendance',
  'reports.staff_hours',
  'analytics.view',
  'staffing.view',
]

const HR_ADMIN_PERMISSIONS: Permission[] = [
  ...AREA_MANAGER_PERMISSIONS,
  'employees.edit',
  'employees.export',
  'employees.import',
  'employees.view_salary',
  'payroll.view_team',
  'payroll.calculate',
  'payroll.view_all',
  'payroll.bonus',
  'payroll.deductions',
  'payroll.advance',
  'payroll.hold',
  'payroll.insurance',
  'payroll.company',
  'reports.salary_structure',
  'reports.tasks',
  'reports.auto_raise',
  'settings.staffing',
  'settings.labor_cost',
  'settings.payroll',
  'settings.master_data',
  'staffing.calculate',
  'staffing.optimize',
  'inventory.view',
  'leave.cancel_any',
  'kpi.evaluate',
  'kpi.settings',
  'kpi.violations.manage',
]

const CEO_PERMISSIONS: Permission[] = [
  ...HR_ADMIN_PERMISSIONS,
  'employees.delete',
  'employees.offboarding',
  'reports.budget',
  'reports.hr_overview',
  'analytics.retrospective',
  'settings.system',
]

// ─────────────────────────────────────────────────────────────────────────────
// ROLE PERMISSIONS MAPPING
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  employee: EMPLOYEE_PERMISSIONS,
  shift_leader: SHIFT_LEADER_PERMISSIONS,
  store_manager: STORE_MANAGER_PERMISSIONS,
  area_manager: AREA_MANAGER_PERMISSIONS,
  hr_admin: HR_ADMIN_PERMISSIONS,
  ceo: CEO_PERMISSIONS,
}


// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || []
  return permissions.includes(permission)
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(perm => hasPermission(role, perm))
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(perm => hasPermission(role, perm))
}

export function isRoleEqualOrHigher(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole]
}

export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] || 0
}

export function canAccessResource(
  userRole: UserRole,
  userId: string,
  resourceOwnerId: string,
  requiredPermission: Permission
): boolean {
  if (!hasPermission(userRole, requiredPermission)) return false

  const selfScopedPermissions: Permission[] = [
    'attendance.view_own',
    'payroll.view_own',
    'kpi.view_own',
  ]

  if (selfScopedPermissions.includes(requiredPermission)) {
    return userId === resourceOwnerId
  }

  return true
}

export function canModifyResource(
  userRole: UserRole,
  userId: string,
  resourceOwnerId: string
): boolean {
  if (userId === resourceOwnerId) return true
  return hasPermission(userRole, 'employees.edit') ||
         hasPermission(userRole, 'schedule.assign') ||
         hasPermission(userRole, 'kpi.evaluate')
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION LABELS
// ─────────────────────────────────────────────────────────────────────────────

export const PERMISSION_LABELS: Record<Permission, string> = {
  'employees.view': 'Xem danh sách nhân viên',
  'employees.create': 'Tạo nhân viên mới',
  'employees.edit': 'Chỉnh sửa thông tin nhân viên',
  'employees.delete': 'Xóa nhân viên',
  'employees.export': 'Xuất danh sách nhân viên',
  'employees.import': 'Nhập danh sách nhân viên',
  'employees.offboarding': 'Offboarding nhân viên',
  'employees.view_salary': 'Xem lương nhân viên',
  'employees.view_kpi': 'Xem KPI nhân viên',
  'leave.request': 'Tạo đơn nghỉ phép',
  'leave.approve': 'Phê duyệt đơn nghỉ phép',
  'leave.cancel_own': 'Hủy đơn nghỉ phép của mình',
  'leave.cancel_any': 'Hủy đơn nghỉ phép bất kỳ',
  'leave.view_all': 'Xem tất cả đơn nghỉ phép',
  'leave.calendar': 'Xem lịch nghỉ phép',
  'leave.balance': 'Xem số ngày phép',
  'schedule.view': 'Xem lịch làm việc',
  'schedule.assign': 'Phân công ca làm',
  'schedule.swap': 'Đổi ca với người khác',
  'schedule.auto_generate': 'Tự động tạo lịch',
  'schedule.open_shifts.claim': 'Nhận ca mở',
  'schedule.open_shifts.post': 'Đăng ca mở',
  'schedule.preferences': 'Cài đặt sở thích lịch',
  'schedule.warnings': 'Xem cảnh báo lịch',
  'schedule.by_shift': 'Xem lịch theo ca',
  'attendance.view_own': 'Xem chấm công của mình',
  'attendance.view_team': 'Xem chấm công nhóm',
  'attendance.view_all': 'Xem chấm công tất cả',
  'attendance.overtime': 'Quản lý tăng ca',
  'attendance.devices': 'Quản lý thiết bị chấm công',
  'checkin.view_logs': 'Xem lịch sử check-in',
  'kpi.view_own': 'Xem KPI của mình',
  'kpi.view_team': 'Xem KPI nhóm',
  'kpi.view_all': 'Xem KPI tất cả',
  'kpi.evaluate': 'Đánh giá KPI',
  'kpi.settings': 'Cài đặt KPI',
  'kpi.reports': 'Báo cáo KPI',
  'kpi.promotion': 'Xem khuyến khích thăng tiến',
  'kpi.violations.view': 'Xem vi phạm KPI',
  'kpi.violations.manage': 'Quản lý vi phạm KPI',
  'kpi.violations.appeal': 'Khiếu nại vi phạm KPI',
  'payroll.view_own': 'Xem lương của mình',
  'payroll.view_team': 'Xem lương nhóm',
  'payroll.calculate': 'Tính lương',
  'payroll.view_all': 'Xem tất cả lương',
  'payroll.bonus': 'Quản lý thưởng',
  'payroll.deductions': 'Quản lý khấu trừ',
  'payroll.advance': 'Tạm ứng lương',
  'payroll.hold': 'Tạm giữ lương',
  'payroll.insurance': 'Quản lý bảo hiểm',
  'payroll.company': 'Cấu hình lương công ty',
  'reports.attendance': 'Báo cáo chấm công',
  'reports.salary_structure': 'Báo cáo cấu trúc lương',
  'reports.budget': 'Báo cáo ngân sách',
  'reports.hr_overview': 'Tổng quan nhân sự',
  'reports.staff_hours': 'Báo cáo giờ làm',
  'reports.tasks': 'Báo cáo công việc',
  'reports.auto_raise': 'Báo cáo tự động tăng lương',
  'analytics.view': 'Xem phân tích',
  'analytics.retrospective': 'Phân tích retrospective',
  'settings.view': 'Xem cài đặt',
  'settings.staffing': 'Cài đặt nhân sự',
  'settings.labor_cost': 'Cài đặt chi phí lao động',
  'settings.schedule_rules': 'Cài đặt quy tắc lịch',
  'settings.wifi': 'Cài đặt WiFi',
  'settings.payroll': 'Cài đặt lương',
  'settings.master_data': 'Quản lý dữ liệu chính',
  'settings.system': 'Cài đặt hệ thống',
  'staffing.view': 'Xem tính toán nhân sự',
  'staffing.calculate': 'Tính toán nhân sự',
  'staffing.optimize': 'Tối ưu nhân sự',
  'tasks.view': 'Xem công việc',
  'tasks.incidents': 'Báo cáo sự cố',
  'tasks.handover': 'Bàn giao công việc',
  'tasks.templates': 'Quản lý mẫu công việc',
  'recognition.send': 'Gửi khen thưởng',
  'recognition.view': 'Xem khen thưởng',
  'career.view': 'Xem lộ trình thăng tiến',
  'career.goals': 'Quản lý mục tiêu',
  'career.leaderboard': 'Xem bảng xếp hạng',
  'career.skills': 'Quản lý kỹ năng',
  'learning.view': 'Xem học tập',
  'gamification.view': 'Xem gamification',
  'news.view': 'Xem tin tức',
  'chat.view': 'Chat',
  'chat.team': 'Chat nhóm',
  'inventory.view': 'Xem tồn kho',
  'wellness.view': 'Xem sức khỏe',
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE LABELS
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  ceo: 'CEO',
  hr_admin: 'HR Admin',
  store_manager: 'Quản lý cửa hàng',
  area_manager: 'Quản lý khu vực',
  shift_leader: 'Trưởng ca',
  employee: 'Nhân viên',
}

// ─────────────────────────────────────────────────────────────────────────────
// DEBUG
// ─────────────────────────────────────────────────────────────────────────────
export function getPermissionsByRole(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] || []
}

export function debugPermissions(role: UserRole): void {
  console.log(`🔐 Permissions for ${ROLE_LABELS[role]}:`)
  const perms = getPermissionsByRole(role)
  perms.forEach(p => console.log(`  - ${p}`))
  console.log(`Total: ${perms.length} permissions`)
}
