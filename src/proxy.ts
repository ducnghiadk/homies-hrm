import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE PERMISSION CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

type RoutePermission = {
  paths: string[]
  requiredRoles?: string[]
  exact?: boolean
  requiredPermission?: string
}

const ROLE_HIERARCHY: Record<string, number> = {
  employee: 1,
  nhan_vien: 1,
  shift_leader: 2,
  truong_ca: 2,
  store_manager: 3,
  quan_ly_cua_hang: 3,
  area_manager: 4,
  quan_ly_khu_vuc: 4,
  hr_admin: 5,
  quan_tri_hr: 5,
  ceo: 6,
  ban_giam_doc: 6,
}

const ROUTE_PERMISSIONS: RoutePermission[] = [
  // Employee-safe personal pages. The page still scopes the returned records.
  {
    paths: ['/payroll/salary-slip'],
    requiredRoles: ['employee', 'shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo'],
  },

  // Management roots must not inherit employee-level navigation access.
  {
    paths: ['/attendance'],
    exact: true,
    requiredRoles: ['shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo'],
  },
  {
    paths: ['/schedule'],
    exact: true,
    requiredRoles: ['store_manager', 'area_manager', 'hr_admin', 'ceo'],
  },
  {
    paths: ['/payroll'],
    exact: true,
    requiredRoles: ['hr_admin', 'ceo'],
  },

  // Admin routes - CEO only
  {
    paths: ['/settings/system', '/admin'],
    requiredRoles: ['ceo'],
  },

  // HR Admin routes
  {
    paths: [
      '/payroll/calculate',
      '/payroll/bonus',
      '/payroll/deductions',
      '/payroll/insurance',
      '/payroll/company',
      '/employees/new',
      '/employees/import',
      '/employees/export',
      '/employees/offboarding',
      '/reports/salary-structure',
      '/reports/hr-overview',
      '/reports/auto-raise',
      '/settings/staffing',
      '/settings/labor-cost',
      '/settings/payroll',
      '/settings/master-data',
      '/settings/organization',
      '/settings/branches',
    ],
    requiredRoles: ['hr_admin', 'ceo'],
  },

  // Store Manager routes
  {
    paths: [
      '/leave/approval',
      '/schedules',
      '/schedule/assign',
      '/schedule/manage',
      '/schedule/admin/review',
      '/schedule/history',
      '/schedule/auto',
      '/schedule/templates',
      '/schedule/warnings',
      '/payroll/by-store',
      '/kpi/evaluate',
      '/kpi/settings',
      '/kpi/reports',
      '/kpi/violations/manage',
      '/reports/attendance-report',
      '/reports/staff-hours',
      '/settings/schedule-rules',
      '/settings/schedule-rules/shifts',
      '/settings/schedule-rules/preferences',
      '/tasks/templates',
      '/settings/wifi',
    ],
    requiredRoles: ['store_manager', 'area_manager', 'hr_admin', 'ceo'],
  },

  // Shift Leader routes
  {
    paths: [
      '/schedule/open-shifts',
      '/schedule/swap',
      '/attendance/overtime',
      '/kpi/leaderboard',
    ],
    requiredRoles: ['employee', 'shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo'],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function matchesRoute(pathname: string, route: string): boolean {
  if (route === '/') return pathname === '/'
  return pathname === route || pathname.startsWith(route + '/')
}

function matchesPath(pathname: string, patterns: string[], exact = false): boolean {
  return patterns.some(pattern => {
    if (exact) return pathname === pattern
    return matchesRoute(pathname, pattern)
  })
}

function getRoutePermission(pathname: string): RoutePermission | undefined {
  return ROUTE_PERMISSIONS.find(rp => matchesPath(pathname, rp.paths, rp.exact))
}

function hasRequiredRole(userRole: string | undefined, requiredRoles: string[] | undefined): boolean {
  if (!requiredRoles || requiredRoles.length === 0) return true
  if (!userRole) return false

  const userLevel = ROLE_HIERARCHY[userRole] || 0
  const minimumLevel = Math.min(...requiredRoles.map(role => ROLE_HIERARCHY[role] || 0))
  return userLevel >= minimumLevel
}


// ─────────────────────────────────────────────────────────────────────────────
// MIDDLEWARE
// ─────────────────────────────────────────────────────────────────────────────

// Routes that don't require authentication
const publicRoutes = ['/login', '/verify', '/rbac']

// Routes that don't require permission check
const skipPermissionRoutes = ['/login', '/verify', '/', '/rbac']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const authCookie = request.cookies.get('hrm-auth')?.value
  const roleCookie = request.cookies.get('hrm-role')?.value
  const redirectPath = `${pathname}${request.nextUrl.search}`

  // Allow public routes
  if (publicRoutes.some(route => matchesRoute(pathname, route))) {
    return NextResponse.next()
  }

  // Allow static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  const routePermission = getRoutePermission(pathname)
  const isProtectedRoute = routePermission && !skipPermissionRoutes.some(route => matchesRoute(pathname, route))

  if (isProtectedRoute && (authCookie !== '1' || !roleCookie || roleCookie.trim() === '')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', redirectPath)
    return NextResponse.redirect(loginUrl)
  }

  if (isProtectedRoute && !hasRequiredRole(roleCookie, routePermission.requiredRoles)) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
