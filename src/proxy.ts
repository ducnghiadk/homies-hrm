import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ─────────────────────────────────────────────────────────────────────────────
// ROUTE PERMISSION CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────────

type RoutePermission = {
  paths: string[]
  requiredRoles?: string[]
  requiredPermission?: string
}

const ROLE_HIERARCHY: Record<string, number> = {
  employee: 1,
  shift_leader: 2,
  store_manager: 3,
  area_manager: 4,
  hr_admin: 5,
  ceo: 6,
}

const ROUTE_PERMISSIONS: RoutePermission[] = [
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
    requiredRoles: ['shift_leader', 'store_manager', 'area_manager', 'hr_admin', 'ceo'],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => {
    // Exact match
    if (pathname === pattern) return true
    // Prefix match (for nested routes)
    if (pathname.startsWith(pattern + '/')) return true
    return false
  })
}

function getRoutePermission(pathname: string): RoutePermission | undefined {
  return ROUTE_PERMISSIONS.find(rp => matchesPath(pathname, rp.paths))
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
  if (publicRoutes.some(route => pathname.startsWith(route))) {
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
  const isProtectedRoute = routePermission && !skipPermissionRoutes.some(r => pathname.startsWith(r))

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
