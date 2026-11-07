import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, ServerStore } from '@/lib/server/db'
import { getAuthenticatedUser } from '@/lib/server/auth-helper'

const ALLOWED_STORE_ROLES = ['ceo', 'hr_admin', 'store_manager', 'area_manager']

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('id')

    const db = await getServerDb()
    let stores = db.stores || []

    const auth = await getAuthenticatedUser(req)
    const canSeePin = auth && ALLOWED_STORE_ROLES.includes(auth.role)

    const sanitizeStore = (store: ServerStore) => {
      if (canSeePin) return store
      const { pin_code: _pin, ...safe } = store
      return safe
    }

    if (storeId) {
      const single = stores.find((s) => s.id === storeId)
      if (!single) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy chi nhánh' }, { status: 404 })
      }
      return NextResponse.json({ success: true, data: sanitizeStore(single) })
    }

    return NextResponse.json({
      success: true,
      count: stores.length,
      data: stores.map(sanitizeStore),
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req)
    if (!auth || !ALLOWED_STORE_ROLES.includes(auth.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Không đủ thẩm quyền: Chỉ Ban Giám đốc (CEO, HR) hoặc Quản lý mới được cấu hình chi nhánh, mã PIN và tọa độ GPS.',
        },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const { id, name, address, latitude, longitude, checkin_radius_meters, pin_code, phone, is_active } = body
    const db = await getServerDb()

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ success: false, error: 'Tên chi nhánh là bắt buộc' }, { status: 400 })
    }
    if (!Array.isArray(db.stores)) {
      db.stores = []
    }

    const storeId = id || `store-${String(db.stores.length + 1).padStart(3, '0')}`
    const existingIndex = db.stores.findIndex((s) => s.id === storeId)

    const updatedStore: ServerStore = {
      id: storeId,
      name: name.trim(),
      address: address ? String(address).trim() : (existingIndex >= 0 ? db.stores[existingIndex].address : ''),
      latitude: latitude !== undefined ? Number(latitude) : (existingIndex >= 0 ? db.stores[existingIndex].latitude : 10.8),
      longitude: longitude !== undefined ? Number(longitude) : (existingIndex >= 0 ? db.stores[existingIndex].longitude : 106.7),
      checkin_radius_meters: checkin_radius_meters !== undefined ? Number(checkin_radius_meters) : (existingIndex >= 0 ? db.stores[existingIndex].checkin_radius_meters : 100),
      pin_code: pin_code ? String(pin_code).trim() : (existingIndex >= 0 ? db.stores[existingIndex].pin_code : '3535'),
      phone: phone ? String(phone).trim() : (existingIndex >= 0 ? db.stores[existingIndex].phone : ''),
      is_active: is_active !== undefined ? Boolean(is_active) : (existingIndex >= 0 ? db.stores[existingIndex].is_active : true),
    }

    if (existingIndex >= 0) {
      db.stores[existingIndex] = updatedStore
    } else {
      db.stores.push(updatedStore)
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: 'Đã lưu cấu hình cơ sở thành công!',
      data: updatedStore,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi cập nhật chi nhánh'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
