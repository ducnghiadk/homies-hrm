import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, ADMIN_ROLES } from '@/lib/server/auth-helper'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { normalizeCareerPathSettings, validateCareerPathSettings, type CareerPathSettings } from '@/lib/career-path/settings'

/** Cài đặt lộ trình thăng tiến (Playbook V7). Ai đăng nhập cũng đọc được; chỉ CEO/HR được sửa. */
export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  try {
    const db = await getServerDb()
    return NextResponse.json({ success: true, settings: normalizeCareerPathSettings(db.career_settings) })
  } catch (error) {
    console.error('[API /api/career-path/settings GET] Error:', error)
    return NextResponse.json({ success: false, message: 'Không tải được cài đặt lộ trình thăng tiến.' }, { status: 500 })
  }
}

async function save(req: NextRequest) {
  const gate = await requireAuth(req, ADMIN_ROLES)
  if (!gate.ok) return gate.response
  try {
    const body = (await req.json().catch(() => null)) as { settings?: Partial<CareerPathSettings>; version?: number } | null
    if (!body?.settings || typeof body.settings !== 'object') {
      return NextResponse.json({ success: false, message: 'Thiếu dữ liệu cài đặt.' }, { status: 400 })
    }
    const db = await getServerDb()
    const current = normalizeCareerPathSettings(db.career_settings)
    // Chống ghi đè khi hai người cùng sửa: phiên bản gửi lên phải khớp phiên bản đang lưu.
    if (typeof body.version === 'number' && body.version !== current.version) {
      return NextResponse.json(
        { success: false, message: 'Cài đặt vừa được người khác cập nhật. Vui lòng tải lại trang rồi sửa lại.', settings: current },
        { status: 409 }
      )
    }
    const next = normalizeCareerPathSettings({
      ...body.settings,
      version: current.version + 1,
      updated_at: new Date().toISOString(),
      updated_by: gate.user.employee?.full_name || gate.user.email || gate.user.userId,
    })
    const errors = validateCareerPathSettings(next)
    if (errors.length > 0) {
      return NextResponse.json({ success: false, message: errors[0], errors }, { status: 400 })
    }
    db.career_settings = next
    await saveServerDb(db)
    return NextResponse.json({ success: true, settings: next })
  } catch (error) {
    console.error('[API /api/career-path/settings save] Error:', error)
    return NextResponse.json({ success: false, message: 'Không lưu được cài đặt lộ trình thăng tiến.' }, { status: 500 })
  }
}

export const PUT = save
export const POST = save
