import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { signRole, verifyPassword, hashPassword } from '@/lib/security/token-signer'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const rawIdentifier = String(body.email || body.phone || body.username || body.identifier || '').trim()
    const password = String(body.password || '').trim()

    if (!rawIdentifier) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng cung cấp Email hoặc Số điện thoại đăng nhập' },
        { status: 400 }
      )
    }

    const db = await getServerDb()
    const normalizedIdentifier = rawIdentifier.toLowerCase()
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

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Tài khoản không tồn tại trên hệ thống' },
        { status: 401 }
      )
    }

    // Kiểm tra trạng thái tài khoản
    if (user.account_status === 'bi_khoa') {
      return NextResponse.json(
        { success: false, error: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ HR.' },
        { status: 403 }
      )
    }

    // Kiểm tra mật khẩu (hỗ trợ cả chuỗi mã hóa an toàn và mật khẩu dự phòng cho CEO)
    const isCorrect =
      verifyPassword(password, user.password) ||
      (user.role === 'ceo' && (password === 'Ducnghia@1' || password === '123456'))

    if (!isCorrect) {
      return NextResponse.json(
        { success: false, error: 'Mật khẩu không chính xác' },
        { status: 401 }
      )
    }

    // Tự động nâng cấp mật khẩu sang chuẩn mã hóa an toàn PBKDF2 nếu tài khoản vẫn đang lưu dạng cũ
    if (user.password && !user.password.startsWith('pbkdf2:')) {
      user.password = hashPassword(password)
    }

    // Tạo session token an toàn bằng crypto ngẫu nhiên
    const token = `homies_sess_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`
    db.sessions[token] = {
      userId: user.id,
      role: user.role,
      email: user.email,
      createdAt: new Date().toISOString(),
    }
    await saveServerDb(db)

    // Trả về user info (bỏ password nếu có)
    const { password: _p, ...safeUser } = user

    const response = NextResponse.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: safeUser,
      data: {
        token,
        user: safeUser,
      },
    })

    // Thiết lập session cookie an toàn
    response.cookies.set('homies_session', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 ngày
      path: '/',
    })

    // Thiết lập chữ ký số xác thực vai trò chống can thiệp F12
    const roleSig = signRole(user.role, user.id)
    response.cookies.set('hrm-role-sig', roleSig, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    response.cookies.set('hrm-user-id', user.id, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi máy chủ'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
