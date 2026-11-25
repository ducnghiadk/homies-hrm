import { NextRequest, NextResponse } from 'next/server'
import { getServerDb } from '@/lib/server/db'
import { STORE_PIN_COOKIE } from '@/lib/server/auth-helper'
import { safeEqualString, signStorePinAccess } from '@/lib/security/token-signer'
import { clearAttempts, getClientIp, isRateLimited, recordFailedAttempt } from '@/lib/server/rate-limit'

const PIN_ACCESS_TTL_MS = 12 * 60 * 60 * 1000
const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

/**
 * POST /api/stores/verify-pin
 * Cổng ghi nhận sự cố công khai: kiểm tra mã PIN chi nhánh ngay trên máy chủ
 * (mã PIN không còn gửi xuống trình duyệt) rồi cấp cookie httpOnly có chữ ký, hạn 12 giờ.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const storeId = typeof body.store_id === 'string' ? body.store_id.trim() : ''
    const pin = typeof body.pin === 'string' ? body.pin.trim() : ''
    if (!storeId || !pin) {
      return NextResponse.json({ success: false, error: 'Vui lòng chọn cơ sở và nhập mã PIN.' }, { status: 400 })
    }

    const limitKey = `store-pin:${getClientIp(req.headers)}:${storeId}`
    if (isRateLimited(limitKey, MAX_ATTEMPTS, WINDOW_MS)) {
      return NextResponse.json(
        { success: false, error: 'Bạn đã nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.' },
        { status: 429 }
      )
    }

    const db = await getServerDb()
    const store = db.stores.find((s) => s.id === storeId && s.is_active !== false)
    if (!store || !store.pin_code || !safeEqualString(pin, String(store.pin_code))) {
      recordFailedAttempt(limitKey, WINDOW_MS)
      return NextResponse.json(
        { success: false, error: 'Mã PIN không đúng. Vui lòng liên hệ Admin hoặc Quản lý.' },
        { status: 401 }
      )
    }

    clearAttempts(limitKey)
    const expiresAt = Date.now() + PIN_ACCESS_TTL_MS
    const response = NextResponse.json({ success: true, store_id: store.id, expires_at: expiresAt })
    response.cookies.set(STORE_PIN_COOKIE, signStorePinAccess(store.id, expiresAt), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(PIN_ACCESS_TTL_MS / 1000),
    })
    return response
  } catch (error) {
    console.error('[API /api/stores/verify-pin] error:', error)
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống khi kiểm tra mã PIN.' }, { status: 500 })
  }
}

/** DELETE /api/stores/verify-pin: thoát phiên cổng PIN. */
export async function DELETE() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(STORE_PIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 })
  return response
}
