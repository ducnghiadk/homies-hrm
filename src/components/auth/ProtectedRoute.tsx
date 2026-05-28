'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { usePermissions } from '@/hooks/usePermissions'
import { type Permission, ROLE_LABELS } from '@/lib/rbac'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ShieldX, Lock, ArrowLeft, Home } from 'lucide-react'

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────

type ProtectedRouteProps = {
  children: React.ReactNode
  requiredPermission?: Permission
  requiredPermissions?: Permission[] // AND logic
  requiredAnyPermission?: Permission[] // OR logic
  requiredRole?: 'ceo' | 'hr_admin' | 'area_manager' | 'store_manager' | 'shift_leader' | 'employee'
  fallback?: React.ReactNode
  showAccessDenied?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// ACCESS DENIED COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

function AccessDenied({
  requiredPermission,
  requiredPermissions,
  requiredAnyPermission,
  requiredRole,
}: {
  requiredPermission?: Permission
  requiredPermissions?: Permission[]
  requiredAnyPermission?: Permission[]
  requiredRole?: string
}) {
  const router = useRouter()
  const { user } = useAuthStore()
  const { role } = usePermissions()

  const getDeniedReason = () => {
    if (requiredRole) {
      return {
        title: '🔐 Yêu cầu quyền truy cập cao hơn',
        message: `Bạn cần có vai trò "${ROLE_LABELS[requiredRole as keyof typeof ROLE_LABELS] || requiredRole}" hoặc cao hơn để truy cập trang này.`,
        icon: Lock,
      }
    }
    if (requiredPermissions?.length) {
      return {
        title: '🚫 Không có quyền truy cập',
        message: `Bạn cần có tất cả các quyền sau: ${requiredPermissions.join(', ')}`,
        icon: ShieldX,
      }
    }
    if (requiredAnyPermission?.length) {
      return {
        title: '🚫 Không có quyền truy cập',
        message: `Bạn cần có ít nhất một trong các quyền sau: ${requiredAnyPermission.join(', ')}`,
        icon: ShieldX,
      }
    }
    if (requiredPermission) {
      return {
        title: '🚫 Không có quyền truy cập',
        message: `Bạn cần có quyền "${requiredPermission}" để truy cập trang này.`,
        icon: ShieldX,
      }
    }
    return {
      title: '🚫 Truy cập bị từ chối',
      message: 'Bạn không có quyền truy cập trang này.',
      icon: ShieldX,
    }
  }

  const { title, message, icon: Icon } = getDeniedReason()

  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-8">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-error-50 flex items-center justify-center mx-auto mb-6">
          <Icon className="w-10 h-10 text-error-500" />
        </div>

        {/* Title */}
        <h1 className="text-xl font-bold text-gray-900 mb-2">{title}</h1>

        {/* Message */}
        <p className="text-gray-600 mb-4">{message}</p>

        {/* User Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-6">
          <p className="text-sm text-gray-500">Tài khoản hiện tại:</p>
          <p className="font-semibold text-gray-900">
            {user?.full_name || 'Người dùng'}
          </p>
          <p className="text-sm text-gray-600">
            Vai trò: {ROLE_LABELS[role as keyof typeof ROLE_LABELS] || user?.role}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Button onClick={() => router.push('/')} className="flex items-center justify-center gap-2">
            <Home size={18} />
            Về trang chủ
          </Button>
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2"
          >
            <ArrowLeft size={18} />
            Quay lại
          </Button>
        </div>
      </Card>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// LOADING COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function RouteLoading() {
  return (
    <div className="min-h-screen bg-bg-page flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Đang kiểm tra quyền truy cập...</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PROTECTED ROUTE COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export function ProtectedRoute({
  children,
  requiredPermission,
  requiredPermissions,
  requiredAnyPermission,
  requiredRole,
  fallback,
  showAccessDenied = true,
}: ProtectedRouteProps) {
  const router = useRouter()
  const { user, isAuthenticated, isLoading, hasHydrated } = useAuthStore()
  const { role, can, canAll, canAny, isRole } = usePermissions()

  useEffect(() => {
    if (hasHydrated && !isLoading && (!isAuthenticated || !user)) {
      router.push('/login')
    }
  }, [hasHydrated, isAuthenticated, isLoading, router, user])

  // Show loading while checking auth
  if (!hasHydrated || isLoading) {
    return <RouteLoading />
  }

  // Not authenticated - redirect to login
  if (!isAuthenticated || !user) {
    return <RouteLoading />
  }

  // Check permissions
  let hasAccess = true
  let deniedReason = ''

  // 1. Check required role
  if (requiredRole && !isRole(requiredRole)) {
    hasAccess = false
    deniedReason = `Yêu cầu vai trò: ${requiredRole}`
  }

  // 2. Check single permission
  if (hasAccess && requiredPermission && !can(requiredPermission)) {
    hasAccess = false
    deniedReason = `Yêu cầu quyền: ${requiredPermission}`
  }

  // 3. Check AND permissions (all must be present)
  if (hasAccess && requiredPermissions && requiredPermissions.length > 0) {
    if (!canAll(requiredPermissions)) {
      hasAccess = false
      deniedReason = `Yêu cầu quyền: ${requiredPermissions.join(', ')}`
    }
  }

  // 4. Check OR permissions (at least one must be present)
  if (hasAccess && requiredAnyPermission && requiredAnyPermission.length > 0) {
    if (!canAny(requiredAnyPermission)) {
      hasAccess = false
      deniedReason = `Yêu cầu một trong: ${requiredAnyPermission.join(', ')}`
    }
  }

  // Log access attempt
  console.log(`[RBAC] Route access: ${hasAccess ? '✅' : '❌'} ${deniedReason || '(OK)'} | User: ${user.full_name} (${role})`)

  // Show fallback if provided
  if (!hasAccess && fallback) {
    return <>{fallback}</>
  }

  // Show access denied page
  if (!hasAccess && showAccessDenied) {
    return (
      <AccessDenied
        requiredPermission={requiredPermission}
        requiredPermissions={requiredPermissions}
        requiredAnyPermission={requiredAnyPermission}
        requiredRole={requiredRole}
      />
    )
  }

  // Allow access
  return <>{children}</>
}

// ─────────────────────────────────────────────────────────────────────────────
// WITH PERMISSION HOC (Higher Order Component)
// ─────────────────────────────────────────────────────────────────────────────

type WithPermissionOptions = {
  requiredPermission?: Permission
  requiredPermissions?: Permission[]
  requiredAnyPermission?: Permission[]
  requiredRole?: 'ceo' | 'hr_admin' | 'area_manager' | 'store_manager' | 'shift_leader' | 'employee'
}

export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  options: WithPermissionOptions
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSION GATE COMPONENT (Render children only if has permission)
// ─────────────────────────────────────────────────────────────────────────────

type PermissionGateProps = {
  children: React.ReactNode
  permission?: Permission
  permissions?: Permission[]
  anyPermission?: Permission[]
  role?: ProtectedRouteProps['requiredRole']
  fallback?: React.ReactNode
}

export function PermissionGate({
  children,
  permission,
  permissions,
  anyPermission,
  role,
  fallback = null,
}: PermissionGateProps) {
  const { can, canAll, canAny, isRole } = usePermissions()

  let hasAccess = true

  if (role && !isRole(role)) {
    hasAccess = false
  }

  if (permission && !can(permission)) {
    hasAccess = false
  }

  if (permissions && permissions.length > 0 && !canAll(permissions)) {
    hasAccess = false
  }

  if (anyPermission && anyPermission.length > 0 && !canAny(anyPermission)) {
    hasAccess = false
  }

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// ─────────────────────────────────────────────────────────────────────────────
// ROLE GATE COMPONENT (Render children only if role matches)
// ─────────────────────────────────────────────────────────────────────────────

type RoleGateProps = {
  children: React.ReactNode
  roles: string[]
  fallback?: React.ReactNode
  includeHigher?: boolean // If true, higher roles can also see
}

export function RoleGate({
  children,
  roles,
  fallback = null,
  includeHigher = true,
}: RoleGateProps) {
  const { role } = usePermissions()

  // If includeHigher, check if current role is equal or higher than any allowed role
  if (includeHigher) {
    const roleHierarchy = { employee: 1, shift_leader: 2, store_manager: 3, area_manager: 4, hr_admin: 5, ceo: 6 }
    const minAllowedLevel = Math.min(...roles.map(r => roleHierarchy[r as keyof typeof roleHierarchy] || 0))
    const userLevel = roleHierarchy[role as keyof typeof roleHierarchy] || 0

    if (userLevel >= minAllowedLevel) {
      return <>{children}</>
    }
  } else {
    // Exact match only
    if (roles.includes(role)) {
      return <>{children}</>
    }
  }

  return <>{fallback}</>
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT ALL
// ─────────────────────────────────────────────────────────────────────────────

export default ProtectedRoute
