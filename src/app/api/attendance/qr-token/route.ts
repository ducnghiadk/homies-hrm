import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getServerDb } from '@/lib/server/db'

export const QR_SECRET = process.env.QR_SECRET || 'homies_secret_dynamic_qr_2026'

// Sinh mã QR động cho POS / Kiosk quầy bar với thời hạn 60 giây
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('store_id') || 'store-001'

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
    const signature = crypto.createHmac('sha256', QR_SECRET).update(rawData).digest('hex').substring(0, 12)
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
