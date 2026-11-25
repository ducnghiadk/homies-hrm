import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { requireAuth } from '@/lib/server/auth-helper'
import { DEFAULT_INITIAL_PASSWORD, hashPassword, verifyPassword } from '@/lib/security/token-signer'

/** Đổi mật khẩu của chính mình. Bắt buộc với tài khoản còn dùng mật khẩu mặc định. */
export async function POST(req: NextRequest) {
  const gate = await requireAuth(req, undefined, { allowPendingPasswordChange: true })
  if (!gate.ok) return gate.response

  const body = await req.json().catch(() => ({}))
  const currentPassword = String(body.current_password || '')
  const newPassword = String(body.new_password || '')

  if (newPassword.length < 8 || !/[a-zA-Z]/.test(newPassword) || !/\d/.test(newPassword)) {
    return NextResponse.json(
      { success: false, error: 'Mật khẩu mới phải có ít nhất 8 ký tự, gồm cả chữ và số.' },
      { status: 400 }
    )
  }
  if (newPassword === DEFAULT_INITIAL_PASSWORD || newPassword === currentPassword) {
    return NextResponse.json(
      { success: false, error: 'Mật khẩu mới phải khác mật khẩu hiện tại.' },
      { status: 400 }
    )
  }

  const db = await getServerDb()
  const employee = db.employees.find((e) => e.id === gate.user.userId)
  if (!employee || !verifyPassword(currentPassword, employee.password)) {
    return NextResponse.json({ success: false, error: 'Mật khẩu hiện tại không đúng.' }, { status: 400 })
  }

  employee.password = hashPassword(newPassword)
  const currentToken = req.cookies.get('homies_session')?.value
  // Hủy các phiên khác của tài khoản này, giữ phiên hiện tại và bỏ cờ bắt đổi mật khẩu
  for (const [key, session] of Object.entries(db.sessions)) {
    if (session.userId !== employee.id) continue
    if (key === currentToken) session.mustChangePassword = false
    else delete db.sessions[key]
  }
  await saveServerDb(db)

  return NextResponse.json({ success: true, message: 'Đã đổi mật khẩu thành công.' })
}
