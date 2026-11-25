import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { canAccessStore, MANAGER_ROLES, requireAuth } from '@/lib/server/auth-helper'
import {
  extractClientIp,
  getStoreCheckinConfig,
  MAX_WIFI_IPS,
  normalizeCheckinMethod,
  normalizeIp,
  normalizeIpList,
} from '@/lib/attendance/checkin-method'

/**
 * Cài đặt cách chấm công theo chi nhánh (Wi-Fi quán / mã QR / cả hai).
 * GET: danh sách chi nhánh người dùng được quản lý + IP mạng hiện tại của người gọi.
 * POST: lưu cài đặt, hoặc action "add_current_ip" để lưu mạng đang dùng làm Wi-Fi quán.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAuth(req, MANAGER_ROLES)
  if (!gate.ok) return gate.response
  const db = await getServerDb()
  const stores = (db.stores || [])
    .filter((s) => s.is_active !== false && canAccessStore(gate.user, s.id))
    .map((s) => ({ id: s.id, name: s.name, ...getStoreCheckinConfig(s) }))
  return NextResponse.json({
    success: true,
    data: { stores, current_ip: extractClientIp((n) => req.headers.get(n)), max_ips: MAX_WIFI_IPS },
  })
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req, MANAGER_ROLES)
  if (!gate.ok) return gate.response
  const body = await req.json().catch(() => ({}))
  const storeId = typeof body.store_id === 'string' ? body.store_id : ''
  if (!storeId || !canAccessStore(gate.user, storeId)) {
    return NextResponse.json({ success: false, error: 'Bạn không có quyền cài đặt chấm công cho chi nhánh này.' }, { status: 403 })
  }
  const db = await getServerDb()
  const idx = (db.stores || []).findIndex((s) => s.id === storeId)
  if (idx < 0) return NextResponse.json({ success: false, error: 'Không tìm thấy chi nhánh.' }, { status: 404 })
  const store = db.stores[idx]
  const current = getStoreCheckinConfig(store)

  let ips = current.wifi_public_ips
  let method = current.checkin_method
  let requireGps = current.require_gps
  let message = 'Đã lưu cách chấm công của chi nhánh.'

  if (body.action === 'add_current_ip') {
    const ip = extractClientIp((n) => req.headers.get(n))
    if (!ip) {
      return NextResponse.json({ success: false, error: 'Không xác định được mạng hiện tại. Vui lòng thử lại khi đang dùng Wi-Fi quán.' }, { status: 400 })
    }
    if (!ips.includes(ip)) {
      if (ips.length >= MAX_WIFI_IPS) {
        return NextResponse.json({ success: false, error: `Mỗi chi nhánh lưu tối đa ${MAX_WIFI_IPS} mạng. Vui lòng xóa bớt mạng cũ.` }, { status: 400 })
      }
      ips = [...ips, ip]
    }
    message = `Đã lưu mạng hiện tại (${ip}) làm Wi-Fi chấm công của ${store.name}.`
  } else {
    if (body.checkin_method !== undefined) method = normalizeCheckinMethod(body.checkin_method)
    if (body.require_gps !== undefined) requireGps = body.require_gps !== false
    if (body.wifi_public_ips !== undefined) {
      if (!Array.isArray(body.wifi_public_ips)) {
        return NextResponse.json({ success: false, error: 'Danh sách mạng không hợp lệ.' }, { status: 400 })
      }
      const invalid = body.wifi_public_ips.filter((v: unknown) => !normalizeIp(v))
      if (invalid.length) {
        return NextResponse.json({ success: false, error: `Địa chỉ mạng không hợp lệ: ${invalid.join(', ')}` }, { status: 400 })
      }
      ips = normalizeIpList(body.wifi_public_ips)
    }
  }

  if (method === 'wifi' && ips.length === 0) {
    return NextResponse.json({ success: false, error: 'Chọn "Chỉ Wi-Fi quán" thì cần lưu ít nhất 1 mạng của quán trước.' }, { status: 400 })
  }

  db.stores[idx] = { ...store, checkin_method: method, wifi_public_ips: ips, require_gps: requireGps }
  await saveServerDb(db)
  return NextResponse.json({
    success: true,
    message,
    data: { id: store.id, name: store.name, ...getStoreCheckinConfig(db.stores[idx]) },
  })
}
