import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { ADMIN_ROLES, requireAuth } from '@/lib/server/auth-helper'
import { DEFAULT_PIT_SETTINGS, normalizePitSettings } from '@/lib/payroll/pit'

// Cài đặt thuế TNCN dùng phía máy chủ (ví dụ khấu trừ thuế khi đẩy thưởng BSC vào phiếu lương).
// Màn Cài đặt lương gửi lên mỗi lần lưu chính sách.

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  const db = await getServerDb()
  return NextResponse.json({
    success: true,
    is_default: !db.payroll_tax_settings,
    data: normalizePitSettings(db.payroll_tax_settings || DEFAULT_PIT_SETTINGS),
  })
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req, ADMIN_ROLES)
  if (!gate.ok) return gate.response
  const body = await req.json().catch(() => ({}))
  const settings = normalizePitSettings(body?.settings || body)
  const db = await getServerDb()
  db.payroll_tax_settings = settings
  await saveServerDb(db)
  return NextResponse.json({ success: true, data: settings })
}
