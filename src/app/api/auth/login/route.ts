import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { verifyPassword, hashPassword, DEFAULT_INITIAL_PASSWORD } from '@/lib/security/token-signer'
import { isSessionExpired } from '@/lib/server/auth-helper'
import { setAuthCookies } from '@/lib/server/auth-cookies'
import { clearAttempts, getClientIp, isRateLimited, recordFailedAttempt } from '@/lib/server/rate-limit'

const LOGIN_WINDOW_MS = 15 * 60 * 1000
const MAX_FAILS_PER_ACCOUNT = 5
const MAX_FAILS_PER_IP = 30
const GENERIC_LOGIN_ERROR = 'Tài khoản hoặc mật khẩu không chính xác'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawIdentifier = String(body.email || body.phone || body.username || body.identifier || '').trim()
    const password = String(body.password || '').trim()

    if (!rawIdentifier || !password) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng nhập Email/Số điện thoại và mật khẩu' },
        { status: 400 }
      )
    }

    const normalizedIdentifier = rawIdentifier.toLowerCase()
    const accountKey = `login:acct:${normalizedIdentifier}`
    const ipKey = `login:ip:${getClientIp(req.headers)}`
    if (
      isRateLimited(accountKey, MAX_FAILS_PER_ACCOUNT, LOGIN_WINDOW_MS) ||
      isRateLimited(ipKey, MAX_FAILS_PER_IP, LOGIN_WINDOW_MS)
    ) {
      return NextResponse.json(
        { success: false, error: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
        { status: 429 }
      )
    }

    const db = await getServerDb()
    const cleanPhone = rawIdentifier.replace(/[^\d]/g, '')

    // Tìm nhân viên trong CSDL server theo Email, Số điện thoại hoặc Mã NV chính xác
    const user = db.employees.find((e) => {
      const empEmail = (e.email || '').toLowerCase()
      const empPhone = (e.phone || '').replace(/[^\d]/g, '')
      const empCode = (e.employee_code || '').toLowerCase()

      const matchEmail = Boolean(empEmail && empEmail === normalizedIdentifier)
      const matchPhone = Boolean(cleanPhone.length >= 9 && empPhone && empPhone === cleanPhone)
      const matchCode = Boolean(empCode && empCode === normalizedIdentifier)

      return matchEmail || matchPhone || matchCode
    })

    // Cùng một thông báo cho "không có tài khoản" và "sai mật khẩu" để không dò được tài khoản
    if (!user || !verifyPassword(password, user.password)) {
      recordFailedAttempt(accountKey, LOGIN_WINDOW_MS)
      recordFailedAttempt(ipKey, LOGIN_WINDOW_MS)
      return NextResponse.json({ success: false, error: GENERIC_LOGIN_ERROR }, { status: 401 })
    }

    if (user.account_status === 'bi_khoa' || user.status === 'resigned') {
      return NextResponse.json(
        { success: false, error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ HR.' },
        { status: 403 }
      )
    }

    clearAttempts(accountKey)

    // Tự động nâng cấp mật khẩu sang chuẩn mã hóa an toàn PBKDF2 nếu tài khoản vẫn đang lưu dạng cũ
    if (user.password && !user.password.startsWith('pbkdf2:')) {
      user.password = hashPassword(password)
    }

    const mustChangePassword = password === DEFAULT_INITIAL_PASSWORD

    // Dọn các phiên đã hết hạn để CSDL không phình
    for (const [key, session] of Object.entries(db.sessions)) {
      if (isSessionExpired(session.createdAt)) delete db.sessions[key]
    }

    const token = `homies_sess_${crypto.randomBytes(32).toString('hex')}`
    db.sessions[token] = {
      userId: user.id,
      role: user.role,
      email: user.email,
      createdAt: new Date().toISOString(),
      mustChangePassword,
    }
    await saveServerDb(db)

    // Không trả mật khẩu và thông tin ngân hàng/CCCD trong phản hồi đăng nhập
    const { password: _p, id_card_front_url: _f, id_card_back_url: _b, ...safeUser } = user

    const response = NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      must_change_password: mustChangePassword,
      user: safeUser,
      data: {
        token,
        user: safeUser,
        must_change_password: mustChangePassword,
      },
    })

    setAuthCookies(response, token, user)
    return response
  } catch (error: unknown) {
    console.error('[auth/login]', error)
    return NextResponse.json({ success: false, error: 'Lỗi máy chủ khi đăng nhập' }, { status: 500 })
  }
}
