import { NextRequest } from 'next/server'
import { getServerDb, ServerEmployee } from '@/lib/server/db'

export interface AuthenticatedUser {
  userId: string
  role: string
  email: string
  employee?: ServerEmployee
}

/**
 * Xác thực phiên đăng nhập máy chủ từ cookie `homies_session` hoặc Header `Authorization: Bearer <token>`.
 * Chấm dứt hoàn toàn việc tin vào các trường tự khai trong body (`approver_role`, `role`) hoặc header `x-user-role`.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  const db = await getServerDb()

  // 1. Kiểm tra Bearer token trong Header Authorization
  let token: string | undefined
  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '').trim()
  }

  // 2. Kiểm tra session token trong Cookie homies_session
  if (!token) {
    token = req.cookies.get('homies_session')?.value
  }

  if (token && db.sessions[token]) {
    const session = db.sessions[token]
    const employee = db.employees.find((e) => e.id === session.userId)

    return {
      userId: session.userId,
      role: (session.role || employee?.role || 'employee').toLowerCase(),
      email: session.email || employee?.email || '',
      employee,
    }
  }

  // 3. Fallback cho chế độ demo nội bộ nếu chưa có session cookie
  const demoRole = req.cookies.get('hrm-role')?.value
  const demoAuth = req.cookies.get('hrm-auth')?.value
  if (process.env.NODE_ENV !== 'production' && demoAuth === '1' && demoRole) {
    const matchedEmployee = db.employees.find((e) => e.role === demoRole)
    if (matchedEmployee) {
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

