import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, ServerEmployee } from '@/lib/server/db'
import { verifyRoleSignature, verifyStorePinAccess } from '@/lib/security/token-signer'

export interface AuthenticatedUser {
  userId: string
  role: string
  email: string
  employee?: ServerEmployee
  mustChangePassword?: boolean
}

export const SCHEDULE_MANAGER_ROLES = ['ceo', 'hr_admin', 'store_manager', 'area_manager'] as const
/** Ban giám đốc / HR: toàn quyền dữ liệu nhân sự, lương. */
export const ADMIN_ROLES = ['ceo', 'hr_admin']
/** Quản lý: admin + quản lý vùng + quản lý cửa hàng. */
export const MANAGER_ROLES = ['ceo', 'hr_admin', 'area_manager', 'store_manager']
/** Quản lý + trưởng ca (thao tác vận hành tại quầy). */
export const OPERATOR_ROLES = [...MANAGER_ROLES, 'shift_leader']

/** Thời hạn phiên đăng nhập phía máy chủ. */
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
export const SESSION_TTL_SEC = SESSION_TTL_MS / 1000
export const STORE_PIN_COOKIE = 'homies_store_pin'

export function isSessionExpired(createdAt?: string): boolean {
  const created = createdAt ? new Date(createdAt).getTime() : NaN
  return !Number.isFinite(created) || Date.now() - created > SESSION_TTL_MS
}

/** Bắt đổi mật khẩu mặc định: bật mặc định ở production, có thể ép bật/tắt bằng biến môi trường. */
export function isPasswordChangeEnforced(): boolean {
  const flag = (process.env.REQUIRE_PASSWORD_CHANGE || '').toLowerCase()
  if (flag === 'true' || flag === '1') return true
  if (flag === 'false' || flag === '0') return false
  return process.env.NODE_ENV === 'production'
}

function isUsableEmployee(employee?: ServerEmployee): employee is ServerEmployee {
  return Boolean(employee && employee.account_status !== 'bi_khoa' && employee.status !== 'resigned')
}

/**
 * Xác thực phiên đăng nhập máy chủ:
 * 1) Session token thật (`Authorization: Bearer` hoặc Cookie `homies_session`), có hạn dùng.
 * 2) Cookie vai trò có chữ ký số HMAC (`hrm-role-sig` + `hrm-role` + `hrm-user-id`) — chỉ khi nhân viên còn tồn tại.
 * 3) Fallback dev nội bộ (`NODE_ENV !== 'production'`).
 * Vai trò luôn lấy từ CSDL máy chủ, không bao giờ tin vai trò do client gửi.
 */
export async function getAuthenticatedUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  const db = await getServerDb()

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
    if (isSessionExpired(session.createdAt)) {
      return null
    }
    const employee = db.employees.find((e) => e.id === session.userId)
    if (!isUsableEmployee(employee)) {
      return null
    }

    return {
      userId: employee.id,
      role: (employee.role || 'employee').toLowerCase(),
      email: employee.email || session.email || '',
      employee,
      mustChangePassword: Boolean(session.mustChangePassword),
    }
  }

  const roleCookie = req.cookies.get('hrm-role')?.value
  const userIdCookie = req.cookies.get('hrm-user-id')?.value
  const roleSigCookie = req.cookies.get('hrm-role-sig')?.value

  if (roleCookie && userIdCookie && roleSigCookie && verifyRoleSignature(roleCookie, userIdCookie, roleSigCookie)) {
    const employee = db.employees.find((e) => e.id === userIdCookie)
    if (!isUsableEmployee(employee) || employee.role.toLowerCase() !== roleCookie.toLowerCase()) {
      return null
    }

    return {
      userId: employee.id,
      role: employee.role.toLowerCase(),
      email: employee.email || '',
      employee,
    }
  }

  const demoAuth = req.cookies.get('hrm-auth')?.value
  if (process.env.NODE_ENV !== 'production' && demoAuth === '1' && roleCookie) {
    const matchedEmployee =
      (userIdCookie
        ? db.employees.find(
          (e) => e.id === userIdCookie && e.role.toLowerCase() === roleCookie.toLowerCase()
        )
        : undefined) ||
      db.employees.find((e) => e.role.toLowerCase() === roleCookie.toLowerCase())

    if (isUsableEmployee(matchedEmployee)) {
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

export type AuthGate =
  | { ok: true; user: AuthenticatedUser }
  | { ok: false; response: NextResponse }

/**
 * Cổng kiểm tra dùng chung cho mọi API: bắt buộc đăng nhập, (tùy chọn) đúng vai trò.
 * Trả 401 khi chưa đăng nhập, 403 khi sai vai trò hoặc còn phải đổi mật khẩu mặc định.
 */
export async function requireAuth(
  req: NextRequest,
  allowedRoles?: readonly string[],
  options: { allowPendingPasswordChange?: boolean; headers?: Record<string, string> } = {}
): Promise<AuthGate> {
  const user = await getAuthenticatedUser(req)
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Bạn cần đăng nhập để thực hiện thao tác này.' },
        { status: 401, headers: options.headers }
      ),
    }
  }

  if (user.mustChangePassword && isPasswordChangeEnforced() && !options.allowPendingPasswordChange) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Vui lòng đổi mật khẩu mặc định trước khi tiếp tục.', must_change_password: true },
        { status: 403, headers: options.headers }
      ),
    }
  }

  if (allowedRoles && !hasRequiredRole(user.role, [...allowedRoles])) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: 'Bạn không có quyền thực hiện thao tác này.' },
        { status: 403, headers: options.headers }
      ),
    }
  }

  return { ok: true, user }
}

/** Chi nhánh đã mở khóa bằng mã PIN (cổng ghi nhận sự cố công khai), nếu có. */
export function getStorePinAccess(req: NextRequest): string | null {
  return verifyStorePinAccess(req.cookies.get(STORE_PIN_COOKIE)?.value)
}

/** Các chi nhánh người dùng được quản lý / thuộc về. */
export function getUserStoreIds(user: AuthenticatedUser): string[] {
  const ids = [user.employee?.store_id, ...(user.employee?.secondary_store_ids || [])]
  return ids.filter((id): id is string => Boolean(id))
}

export function isAdminRole(role: string): boolean {
  return hasRequiredRole(role, ADMIN_ROLES)
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

/** Vai trò xem được dữ liệu toàn chuỗi (không giới hạn theo chi nhánh). */
export const CHAIN_WIDE_ROLES = ['ceo', 'hr_admin', 'area_manager']

export function isChainWideRole(role: string): boolean {
  return hasRequiredRole(role, CHAIN_WIDE_ROLES)
}

/** Người dùng có quyền với chi nhánh này không (toàn chuỗi hoặc chi nhánh mình thuộc về). */
export function canAccessStore(user: AuthenticatedUser, storeId?: string | null): boolean {
  if (isChainWideRole(user.role)) return true
  if (!storeId) return false
  return getUserStoreIds(user).includes(storeId)
}
