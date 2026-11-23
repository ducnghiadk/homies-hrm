import { NextRequest } from 'next/server'
import { getServerDb, ServerEmployee } from '@/lib/server/db'
import { verifyRoleSignature } from '@/lib/security/token-signer'

export interface AuthenticatedUser {
  userId: string
  role: string
  email: string
  employee?: ServerEmployee
}

export const SCHEDULE_MANAGER_ROLES = ['ceo', 'hr_admin', 'store_manager', 'area_manager'] as const

/**
 * Xác thực phiên đăng nhập máy chủ theo 3 lớp ưu tiên:
 * 1) Session token thật (`Authorization: Bearer` hoặc Cookie `homies_session`)
 * 2) Cookie vai trò có chữ ký số HMAC (`hrm-role-sig` + `hrm-role` + `hrm-user-id`)
 * 3) Fallback nội bộ dev (`NODE_ENV !== 'production'`) khi chuyển tài khoản nhanh
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  const db = await getServerDb()

  // 1. Kiểm tra Bearer token hoặc session cookie homies_session
  let token: string | undefined
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '').trim()
  }

  if (!token) {
    token = req.cookies.get('homies_session')?.value
  }

  if (token && db.sessions[token]) {
    const session = db.sessions[token]
    const employee = db.employees.find((e) => e.id === session.userId)
    if (employee?.account_status === 'bi_khoa') {
      return null
    }

    return {
      userId: session.userId,
      role: (employee?.role || session.role || 'employee').toLowerCase(),
      email: session.email || employee?.email || '',
      employee,
    }
  }

  // 2. Xác thực qua cặp cookie vai trò được ký số bởi /api/auth/login (an toàn trên serverless)
  const roleCookie = req.cookies.get('hrm-role')?.value
  const userIdCookie = req.cookies.get('hrm-user-id')?.value
  const roleSigCookie = req.cookies.get('hrm-role-sig')?.value

  if (roleCookie && userIdCookie && roleSigCookie && verifyRoleSignature(roleCookie, userIdCookie, roleSigCookie)) {
    const employee = db.employees.find((e) => e.id === userIdCookie)
    if (employee?.account_status === 'bi_khoa') {
      return null
    }

    return {
      userId: employee?.id || userIdCookie,
      role: (employee?.role || roleCookie).toLowerCase(),
      email: employee?.email || '',
      employee,
    }
  }

  // 3. Fallback cho môi trường dev nội bộ khi chưa có session cookie thật
  const demoAuth = req.cookies.get('hrm-auth')?.value
  if (process.env.NODE_ENV !== 'production' && demoAuth === '1' && roleCookie) {
    const matchedEmployee =
      (userIdCookie
        ? db.employees.find(
          (e) => e.id === userIdCookie && e.role.toLowerCase() === roleCookie.toLowerCase()
        )
        : undefined) ||
      db.employees.find((e) => e.role.toLowerCase() === roleCookie.toLowerCase())

    if (matchedEmployee && matchedEmployee.account_status !== 'bi_khoa') {
      return {
        userId: matchedEmployee.id,
        role: matchedEmployee.role.toLowerCase(),
        email: matchedEmployee.email,
        employee: matchedEmployee,
      }
    }
  }

  return null
}

/**
 * Kiểm tra vai trò của người dùng có thuộc danh sách được phép hay không
 */
export function hasRequiredRole(userRole: string, allowedRoles: string[]): boolean {
  return allowedRoles.map((r) => r.toLowerCase()).includes(userRole.toLowerCase())
}

export function isScheduleManagerRole(userRole: string): boolean {
  return hasRequiredRole(userRole, [...SCHEDULE_MANAGER_ROLES])
}

