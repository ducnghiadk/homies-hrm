import { NextResponse } from 'next/server'
import { SESSION_TTL_SEC, STORE_PIN_COOKIE } from '@/lib/server/auth-helper'
import { signRole } from '@/lib/security/token-signer'

const isProd = () => process.env.NODE_ENV === 'production'

/** Gắn cookie phiên đăng nhập. Token phiên và chữ ký vai trò là httpOnly (JS trên trình duyệt không đọc được). */
export function setAuthCookies(response: NextResponse, token: string, user: { id: string; role: string }) {
  const base = { secure: isProd(), sameSite: 'lax' as const, maxAge: SESSION_TTL_SEC, path: '/' }
  response.cookies.set('homies_session', token, { ...base, httpOnly: true })
  response.cookies.set('hrm-role-sig', signRole(user.role, user.id), { ...base, httpOnly: true })
  // Các cookie dưới đây chỉ dùng cho giao diện (proxy vẫn đối soát chữ ký ở trên).
  response.cookies.set('hrm-auth', '1', { ...base, httpOnly: false })
  response.cookies.set('hrm-role', user.role, { ...base, httpOnly: false })
  response.cookies.set('hrm-user-id', user.id, { ...base, httpOnly: false })
}

export function clearAuthCookies(response: NextResponse) {
  for (const name of ['homies_session', 'hrm-role-sig', 'hrm-auth', 'hrm-role', 'hrm-user-id', STORE_PIN_COOKIE]) {
    response.cookies.set(name, '', { path: '/', maxAge: 0 })
  }
}
