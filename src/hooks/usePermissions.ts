'use client'

import { useCallback } from 'react'
import { useAuthStore } from '@/store/auth-store'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  isRoleEqualOrHigher,
  getRoleLevel,
  type Permission,
  type UserRole,
} from '@/lib/rbac'

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HOOK
// ─────────────────────────────────────────────────────────────────────────────

export function usePermissions() {
  const { user } = useAuthStore()
  const role = user?.role || 'employee' as UserRole

  // Check single permission
  const can = useCallback(
    (permission: Permission): boolean => {
      return hasPermission(role, permission)
    },
    [role]
  )

  // Check if has ANY of the permissions
  const canAny = useCallback(
    (permissions: Permission[]): boolean => {
      return hasAnyPermission(role, permissions)
    },
    [role]
  )

  // Check if has ALL of the permissions
  const canAll = useCallback(
    (permissions: Permission[]): boolean => {
      return hasAllPermissions(role, permissions)
    },
    [role]
  )

  // Check role level
  const isRole = useCallback(
    (requiredRole: UserRole): boolean => {
      return isRoleEqualOrHigher(role, requiredRole)
    },
    [role]
  )

  // Get current role level
  const level = getRoleLevel(role)

  // Check if user is HR or higher
  const isHRAdminOrHigher = role === 'hr_admin' || role === 'ceo'

  // Check if user is Manager or higher
  const isManagerOrHigher = ['store_manager', 'area_manager', 'hr_admin', 'ceo'].includes(role)

  // Check if user is CEO
  const isCEO = role === 'ceo'

  return {
    role,
    level,
    can,
    canAny,
    canAll,
    isRole,
    isHRAdminOrHigher,
    isManagerOrHigher,
    isCEO,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SPECIALIZED HOOKS
// ─────────────────────────────────────────────────────────────────────────────

export function useEmployeePermissions() {
  const { can, isHRAdminOrHigher, isManagerOrHigher, role } = usePermissions()

  return {
    canViewEmployees: can('employees.view'),
    canCreateEmployee: can('employees.create'),
    canEditEmployee: can('employees.edit'),
    canDeleteEmployee: can('employees.delete'),
    canExportEmployees: can('employees.export'),
    canImportEmployees: can('employees.import'),
    canOffboardEmployee: can('employees.offboarding'),
    canViewSalary: can('employees.view_salary') || isHRAdminOrHigher,
    canViewKPI: can('employees.view_kpi'),
    isHRAdminOrHigher,
    isManagerOrHigher,
    role,
  }
}

export function useLeavePermissions() {
  const { can, isManagerOrHigher, role } = usePermissions()

  return {
    canRequestLeave: can('leave.request'),
    canApproveLeave: can('leave.approve'),
    canCancelOwnLeave: can('leave.cancel_own'),
    canCancelAnyLeave: can('leave.cancel_any'),
    canViewAllLeave: can('leave.view_all') || isManagerOrHigher,
    canViewCalendar: can('leave.calendar'),
    canViewBalance: can('leave.balance'),
    role,
  }
}

export function useSchedulePermissions() {
  const { can, isManagerOrHigher, role } = usePermissions()

  return {
    canViewSchedule: can('schedule.view'),
    canAssignSchedule: can('schedule.assign') || isManagerOrHigher,
    canSwapShift: can('schedule.swap'),
    canAutoGenerate: can('schedule.auto_generate'),
    canClaimOpenShift: can('schedule.open_shifts.claim'),
    canPostOpenShift: can('schedule.open_shifts.post') || isManagerOrHigher,
    canSetPreferences: can('schedule.preferences'),
    canViewWarnings: can('schedule.warnings'),
    canViewByShift: can('schedule.by_shift'),
    role,
  }
}

export function useKPIPermissions() {
  const { can, isManagerOrHigher, isHRAdminOrHigher, role } = usePermissions()

  return {
    canViewOwnKPI: can('kpi.view_own'),
    canViewTeamKPI: can('kpi.view_team') || isManagerOrHigher,
    canViewAllKPI: can('kpi.view_all') || isHRAdminOrHigher,
    canEvaluate: can('kpi.evaluate') || isManagerOrHigher,
    canManageSettings: can('kpi.settings') || isHRAdminOrHigher,
    canViewReports: can('kpi.reports') || isHRAdminOrHigher,
    canViewPromotion: can('kpi.promotion'),
    canViewViolations: can('kpi.violations.view'),
    canManageViolations: can('kpi.violations.manage') || isHRAdminOrHigher,
    canAppeal: can('kpi.violations.appeal'),
    role,
  }
}

export function usePayrollPermissions() {
  const { can, isHRAdminOrHigher, role } = usePermissions()

  return {
    canViewOwnPayroll: can('payroll.view_own'),
    canViewTeamPayroll: can('payroll.view_team') || isHRAdminOrHigher,
    canCalculatePayroll: can('payroll.calculate') || isHRAdminOrHigher,
    canViewAllPayroll: can('payroll.view_all') || isHRAdminOrHigher,
    canManageBonus: can('payroll.bonus') || isHRAdminOrHigher,
    canManageDeductions: can('payroll.deductions') || isHRAdminOrHigher,
    canManageAdvance: can('payroll.advance') || isHRAdminOrHigher,
    canHoldPayroll: can('payroll.hold') || isHRAdminOrHigher,
    canManageInsurance: can('payroll.insurance') || isHRAdminOrHigher,
    canConfigureCompany: can('payroll.company') || isHRAdminOrHigher,
    isHRAdminOrHigher,
    role,
  }
}

export function useReportPermissions() {
  const { can, isManagerOrHigher, isHRAdminOrHigher, isCEO, role } = usePermissions()

  return {
    canViewAttendanceReport: can('reports.attendance') || isManagerOrHigher,
    canViewSalaryStructure: can('reports.salary_structure') || isHRAdminOrHigher,
    canViewBudget: can('reports.budget') || isCEO,
    canViewHROverview: can('reports.hr_overview') || isHRAdminOrHigher,
    canViewStaffHours: can('reports.staff_hours') || isManagerOrHigher,
    canViewTasksReport: can('reports.tasks') || isHRAdminOrHigher,
    canViewAutoRaise: can('reports.auto_raise') || isHRAdminOrHigher,
    canViewAnalytics: can('analytics.view') || isManagerOrHigher,
    canViewRetrospective: can('analytics.retrospective') || isHRAdminOrHigher,
    isCEO,
    role,
  }
}

export function useSettingPermissions() {
  const { can, isHRAdminOrHigher, isCEO, role } = usePermissions()

  return {
    canViewSettings: can('settings.view'),
    canManageStaffing: can('settings.staffing') || isHRAdminOrHigher,
    canManageLaborCost: can('settings.labor_cost') || isHRAdminOrHigher,
    canManageScheduleRules: can('settings.schedule_rules') || isHRAdminOrHigher,
    canManageWiFi: can('settings.wifi') || isHRAdminOrHigher,
    canManagePayroll: can('settings.payroll') || isHRAdminOrHigher,
    canManageMasterData: can('settings.master_data') || isHRAdminOrHigher,
    canManageSystem: can('settings.system') || isCEO,
    isCEO,
    role,
  }
}

export function useStaffingPermissions() {
  const { can, isHRAdminOrHigher, role } = usePermissions()

  return {
    canViewStaffing: can('staffing.view') || isHRAdminOrHigher,
    canCalculateStaffing: can('staffing.calculate') || isHRAdminOrHigher,
    canOptimizeStaffing: can('staffing.optimize') || isHRAdminOrHigher,
    isHRAdminOrHigher,
    role,
  }
}