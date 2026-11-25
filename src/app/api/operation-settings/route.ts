import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { ADMIN_ROLES, requireAuth } from '@/lib/server/auth-helper'
import { normalizeOperationSettings } from '@/lib/attendance/operation-settings'

// Cài đặt vận hành chấm công & lịch rảnh: ai đăng nhập cũng xem được (để hiện hạn chót),
// chỉ CEO / HR được sửa.

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  const db = await getServerDb()
  return NextResponse.json({
    success: true,
    is_default: !db.operation_settings,
    data: normalizeOperationSettings(db.operation_settings),
  })
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req, ADMIN_ROLES)
  if (!gate.ok) return gate.response
  const body = await req.json().catch(() => ({}))
  const settings = normalizeOperationSettings(body?.settings || body)
  settings.updated_at = new Date().toISOString()
  settings.updated_by = gate.user.userId
  const db = await getServerDb()
  db.operation_settings = settings
  await saveServerDb(db)
  return NextResponse.json({ success: true, data: settings })
}
