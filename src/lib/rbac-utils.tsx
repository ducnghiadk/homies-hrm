// ═══════════════════════════════════════════════════════════════════════════════
// RBAC Utilities - Helper functions for permission checking
// ═══════════════════════════════════════════════════════════════════════════════

import { useAuthStore } from '@/store/auth-store'
import { hasPermission, hasAnyPermission, hasAllPermissions, isRoleEqualOrHigher, type Permission, type UserRole } from '@/lib/rbac'

// ─────────────────────────────────────────────────────────────────────────────
// STANDALONE PERMISSION CHECKER (No React Hook)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a user has a specific permission
 * Can be used outside React components
 */
export function checkPermission(userRole: UserRole | undefined, permission: Permission): boolean {
  if (!userRole) return false
  return hasPermission(userRole, permission)
}

/**
 * Check if user has any of the specified permissions
 */
export function checkAnyPermission(userRole: UserRole | undefined, permissions: Permission[]): boolean {
  if (!userRole) return false
  return hasAnyPermission(userRole, permissions)
}

/**
 * Check if user has all of the specified permissions
 */
export function checkAllPermissions(userRole: UserRole | undefined, permissions: Permission[]): boolean {
  if (!userRole) return false
  return hasAllPermissions(userRole, permissions)
}

/**
 * Check if user's role is equal or higher than required role
 */
export function checkRoleLevel(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false
  return isRoleEqualOrHigher(userRole, requiredRole)
}

// ─────────────────────────────────────────────────────────────────────────────
// HOOK-BASED PERMISSION CHECKER
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple hook to check multiple permissions at once
 * Returns an object with can() function and other helpers
 */
export function usePermissionCheck() {
  const { user } = useAuthStore()
  const role = user?.role || 'employee'

  return {
    /**
     * Check if user has a specific permission
     */
    can: (permission: Permission): boolean => {
      return hasPermission(role, permission)
    },

    /**
     * Check if user has ANY of the specified permissions
     */
    canAny: (permissions: Permission[]): boolean => {
      return hasAnyPermission(role, permissions)
    },

    /**
     * Check if user has ALL of the specified permissions
     */
    canAll: (permissions: Permission[]): boolean => {
      return hasAllPermissions(role, permissions)
    },

    /**
     * Check if user's role is equal or higher than required role
     */
    isAtLeast: (requiredRole: UserRole): boolean => {
      return isRoleEqualOrHigher(role, requiredRole)
    },

    /**
     * Check if user is a specific role
     */
    isRole: (targetRole: UserRole): boolean => {
      return role === targetRole
    },

    /**
     * Get current role
     */
    role,

    /**
     * Check if user is HR Admin or CEO
     */
    isHRAdminOrHigher: role === 'hr_admin' || role === 'ceo',

    /**
     * Check if user is Manager or higher
     */
    isManagerOrHigher: ['store_manager', 'area_manager', 'hr_admin', 'ceo'].includes(role),

    /**
     * Check if user is CEO
     */
    isCEO: role === 'ceo',

    /**
     * Check if user is Area Manager or higher
     */
    isAreaManagerOrHigher: ['area_manager', 'hr_admin', 'ceo'].includes(role),
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION GUARD COMPONENT (Render Prop Pattern)
// ─────────────────────────────────────────────────────────────────────────────

import { ReactNode } from 'react'

type RequirePermissionProps = {
  permission: Permission
  children: ReactNode
  fallback?: ReactNode
}

export function RequirePermission({ permission, children, fallback = null }: RequirePermissionProps) {
  const { can } = usePermissionCheck()

  if (!can(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

type RequireRoleProps = {
  role: UserRole
  children: ReactNode
  fallback?: ReactNode
  includeHigher?: boolean
}

export function RequireRole({ role, children, fallback = null, includeHigher = true }: RequireRoleProps) {
  const { isAtLeast, isRole: checkRole } = usePermissionCheck()

  const hasAccess = includeHigher ? isAtLeast(role) : checkRole(role)

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// ─────────────────────────────────────────────────────────────────────────────
// PRE-BUILT PERMISSION CONDITIONS
// ─────────────────────────────────────────────────────────────────────────────

export const Permissions = {
  // Employee
  VIEW_EMPLOYEES: 'employees.view' as Permission,
  CREATE_EMPLOYEE: 'employees.create' as Permission,
  EDIT_EMPLOYEE: 'employees.edit' as Permission,
  DELETE_EMPLOYEE: 'employees.delete' as Permission,
  EXPORT_EMPLOYEES: 'employees.export' as Permission,
  VIEW_EMPLOYEE_SALARY: 'employees.view_salary' as Permission,

  // Leave
  REQUEST_LEAVE: 'leave.request' as Permission,
  APPROVE_LEAVE: 'leave.approve' as Permission,
  VIEW_ALL_LEAVE: 'leave.view_all' as Permission,

  // Schedule
  VIEW_SCHEDULE: 'schedule.view' as Permission,
  ASSIGN_SCHEDULE: 'schedule.assign' as Permission,
  SWAP_SHIFT: 'schedule.swap' as Permission,

  // KPI
  VIEW_OWN_KPI: 'kpi.view_own' as Permission,
  VIEW_TEAM_KPI: 'kpi.view_team' as Permission,
  EVALUATE_KPI: 'kpi.evaluate' as Permission,
  MANAGE_KPI_SETTINGS: 'kpi.settings' as Permission,

  // Payroll
  VIEW_OWN_PAYROLL: 'payroll.view_own' as Permission,
  VIEW_TEAM_PAYROLL: 'payroll.view_team' as Permission,
  CALCULATE_PAYROLL: 'payroll.calculate' as Permission,

  // Reports
  VIEW_ATTENDANCE_REPORT: 'reports.attendance' as Permission,
  VIEW_BUDGET_REPORT: 'reports.budget' as Permission,
  VIEW_HR_OVERVIEW: 'reports.hr_overview' as Permission,

  // Settings
  MANAGE_WIFI: 'settings.wifi' as Permission,
  MANAGE_PAYROLL_SETTINGS: 'settings.payroll' as Permission,
  MANAGE_SYSTEM: 'settings.system' as Permission,
}

// ─────────────────────────────────────────────────────────────────────────────
// QUICK ACCESS HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the appropriate access level for payroll viewing
 * - Employee: only own payroll
 * - Manager+: can view team payroll
 * - HR Admin+: can view all payroll
 */
export function getPayrollAccessLevel(role: UserRole): 'none' | 'own' | 'team' | 'all' {
  if (!hasPermission(role, 'payroll.view_own')) return 'none'
  if (hasPermission(role, 'payroll.view_all')) return 'all'
  if (hasPermission(role, 'payroll.view_team')) return 'team'
  return 'own'
}

/**
 * Get the appropriate access level for KPI viewing
 */
export function getKPIAccessLevel(role: UserRole): 'none' | 'own' | 'team' | 'all' {
  if (!hasPermission(role, 'kpi.view_own')) return 'none'
  if (hasPermission(role, 'kpi.view_all')) return 'all'
  if (hasPermission(role, 'kpi.view_team')) return 'team'
  return 'own'
}

/**
 * Get the appropriate access level for employee viewing
 */
export function getEmployeeAccessLevel(role: UserRole): 'none' | 'list' | 'salary' | 'all' {
  if (!hasPermission(role, 'employees.view')) return 'none'
  if (hasPermission(role, 'employees.view_salary')) return 'salary'
  return 'list'
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

const rbacUtilsExports = {
  checkPermission,
  checkAnyPermission,
  checkAllPermissions,
  checkRoleLevel,
  usePermissionCheck,
  RequirePermission,
  RequireRole,
  Permissions,
  getPayrollAccessLevel,
  getKPIAccessLevel,
  getEmployeeAccessLevel,
}

export default rbacUtilsExports
