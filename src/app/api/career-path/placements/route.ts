import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, ADMIN_ROLES, canAccessStore, isChainWideRole, hasRequiredRole, MANAGER_ROLES } from '@/lib/server/auth-helper'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { applyPlacement, type PlacementInput } from '@/lib/career-path/placement'

/**
 * Bậc hiện tại + vị trí chính của nhân viên.
 * GET: CEO/HR/quản lý vùng xem toàn chuỗi; quản lý cửa hàng xem chi nhánh mình; người khác chỉ xem của mình.
 *      ?employee_id=... trả kèm lịch sử đổi bậc của người đó.
 * POST: chỉ CEO/HR xếp hoặc sửa bậc (bắt buộc lý do khi đổi).
 */
export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  const user = gate.user
  try {
    const db = await getServerDb()
    const employeeById = new Map(db.employees.map((e) => [e.id, e]))
    const canSee = (employeeId: string) => {
      if (employeeId === user.userId) return true
      if (isChainWideRole(user.role)) return true
      if (hasRequiredRole(user.role, MANAGER_ROLES)) {
        const emp = employeeById.get(employeeId)
        return Boolean(emp && canAccessStore(user, emp.store_id))
      }
      return false
    }
    const employeeId = req.nextUrl.searchParams.get('employee_id')
    if (employeeId) {
      if (!canSee(employeeId)) {
        return NextResponse.json({ success: false, message: 'Bạn không có quyền xem lộ trình của nhân viên này.' }, { status: 403 })
      }
      return NextResponse.json({
        success: true,
        placement: (db.career_placements || []).find((p) => p.employee_id === employeeId) || null,
        history: (db.career_grade_history || [])
          .filter((h) => h.employee_id === employeeId)
          .sort((a, b) => b.created_at.localeCompare(a.created_at)),
      })
    }
    return NextResponse.json({
      success: true,
      placements: (db.career_placements || []).filter((p) => canSee(p.employee_id)),
    })
  } catch (error) {
    console.error('[API /api/career-path/placements GET] Error:', error)
    return NextResponse.json({ success: false, message: 'Không tải được bậc của nhân viên.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req, ADMIN_ROLES)
  if (!gate.ok) return gate.response
  try {
    const body = (await req.json().catch(() => null)) as PlacementInput | null
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, message: 'Thiếu dữ liệu xếp bậc.' }, { status: 400 })
    }
    const db = await getServerDb()
    const employee = db.employees.find((e) => e.id === body.employee_id)
    if (!employee) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy nhân viên.' }, { status: 404 })
    }
    const result = applyPlacement(
      db.career_placements || [],
      db.career_grade_history || [],
      body,
      { id: gate.user.userId, name: gate.user.employee?.full_name || gate.user.email }
    )
    if (!result.ok) {
      return NextResponse.json({ success: false, message: result.errors[0], errors: result.errors }, { status: 400 })
    }
    db.career_placements = result.placements
    db.career_grade_history = result.history
    await saveServerDb(db)
    return NextResponse.json({ success: true, placement: result.placement, entry: result.entry })
  } catch (error) {
    console.error('[API /api/career-path/placements POST] Error:', error)
    return NextResponse.json({ success: false, message: 'Không lưu được bậc của nhân viên.' }, { status: 500 })
  }
}
