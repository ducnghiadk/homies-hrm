import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, OPERATOR_ROLES, canAccessStore } from '@/lib/server/auth-helper'
import { signQrPayload } from '@/lib/security/token-signer'
import crypto from 'crypto'
import { getServerDb } from '@/lib/server/db'

// Sinh mã QR động cho POS / Kiosk quầy bar với thời hạn 60 giây
export async function GET(req: NextRequest) {
  const gate = await requireAuth(req, OPERATOR_ROLES)
  if (!gate.ok) return gate.response
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('store_id') || gate.user.employee?.store_id || 'store-001'
    if (!canAccessStore(gate.user, storeId)) {
      return NextResponse.json({ success: false, error: 'Bạn không quản lý chi nhánh này.' }, { status: 403 })
    }

    const db = await getServerDb()
    const store = db.stores.find((s) => s.id === storeId)

    if (!store) {
      return NextResponse.json(
        { success: false, error: `Không tìm thấy cơ sở: ${storeId}` },
        { status: 404 }
      )
    }

    const timestamp = Date.now()
    const nonce = crypto.randomBytes(4).toString('hex')
    const rawData = `${storeId}:${timestamp}:${nonce}`
    const signature = signQrPayload(rawData)
    const token = `HOMIES_DYN_${Buffer.from(rawData).toString('base64url')}_${signature}`

    return NextResponse.json({
      success: true,
      store_id: store.id,
      store_name: store.name,
      token,
      generated_at: timestamp,
      expires_in_seconds: 60,
      refresh_interval_seconds: 30,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi tạo mã QR động'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
