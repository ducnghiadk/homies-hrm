import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, ServerDepartment, ServerPosition, ServerLeaveType } from '@/lib/server/db'

export async function GET() {
  try {
    const db = await getServerDb()
    return NextResponse.json({
      success: true,
      departments: db.departments || [],
      positions: db.positions || [],
      leave_types: db.leave_types || [],
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

const ALLOWED_MASTER_DATA_ROLES = ['ceo', 'hr_admin', 'store_manager', 'area_manager']

function resolveRole(req: NextRequest, body: Record<string, unknown>, sessions: Record<string, { role: string }>): string | null {
  const directRole = body.approver_role || body.user_role || body.role
  if (typeof directRole === 'string' && directRole) return directRole.toLowerCase()

  const authHeader = req.headers.get('authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim()
    if (sessions[token]?.role) return sessions[token].role.toLowerCase()
  }

  const headerRole = req.headers.get('x-user-role')
  if (headerRole) return headerRole.toLowerCase()

  const sessionCookie = req.cookies.get('homies_session')?.value
  if (sessionCookie && sessions[sessionCookie]?.role) {
    return sessions[sessionCookie].role.toLowerCase()
  }

  const hrmAuth = req.cookies.get('hrm-auth')?.value
  if (hrmAuth) {
    try {
      const parsed = JSON.parse(decodeURIComponent(hrmAuth))
      const r = parsed?.state?.user?.role || parsed?.user?.role
      if (r) return String(r).toLowerCase()
    } catch {}
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = await getServerDb()

    const role = resolveRole(req, body, db.sessions || {})
    if (!role || !ALLOWED_MASTER_DATA_ROLES.includes(role.toLowerCase())) {
      return NextResponse.json(
        {
          success: false,
          error: 'Không đủ thẩm quyền: Chỉ Ban Giám đốc (CEO, HR) hoặc Quản lý mới được cấu hình danh mục bộ phận và chức vụ.',
        },
        { status: 403 }
      )
    }

    if (!Array.isArray(db.departments)) db.departments = []
    if (!Array.isArray(db.positions)) db.positions = []
    if (!Array.isArray(db.leave_types)) db.leave_types = []

    // ─── 1. DEPARTMENTS ───
    if (body.type === 'departments' && Array.isArray(body.data)) {
      db.departments = body.data.map((d: Partial<ServerDepartment>) => ({
        id: String(d.id || `dept-${Date.now()}`),
        code: String(d.code || ''),
        name: String(d.name || ''),
        store_id: String(d.store_id || 'all'),
        manager_id: d.manager_id ? String(d.manager_id) : undefined,
        head_count: Number(d.head_count || 0),
        description: d.description ? String(d.description) : undefined,
      }))
    } else if (body.department && typeof body.department === 'object') {
      const d = body.department
      const idx = db.departments.findIndex((item) => item.id === d.id)
      const updated: ServerDepartment = {
        id: String(d.id || `dept-${Date.now()}`),
        code: String(d.code || (idx >= 0 ? db.departments[idx].code : `DEPT-${Date.now().toString().slice(-4)}`)),
        name: String(d.name || (idx >= 0 ? db.departments[idx].name : '')),
        store_id: String(d.store_id || (idx >= 0 ? db.departments[idx].store_id : 'all')),
        manager_id: d.manager_id !== undefined ? d.manager_id : (idx >= 0 ? db.departments[idx].manager_id : undefined),
        head_count: Number(d.head_count !== undefined ? d.head_count : (idx >= 0 ? db.departments[idx].head_count : 0)),
        description: d.description !== undefined ? d.description : (idx >= 0 ? db.departments[idx].description : undefined),
      }
      if (idx >= 0) db.departments[idx] = updated
      else db.departments.push(updated)
    } else if (body.delete_department_id) {
      db.departments = db.departments.filter((d) => d.id !== body.delete_department_id)
    }

    // ─── 2. POSITIONS ───
    if (body.type === 'positions' && Array.isArray(body.data)) {
      db.positions = body.data.map((p: Partial<ServerPosition>) => ({
        id: String(p.id || `pos-${Date.now()}`),
        code: p.code ? String(p.code) : undefined,
        name: String(p.name || ''),
        department_id: String(p.department_id || 'dept-002'),
        level: Number(p.level || 1),
        base_salary: Number(p.base_salary || 5000000),
        pay_type: (p.pay_type === 'monthly' ? 'monthly' : 'hourly') as 'monthly' | 'hourly',
      }))
    } else if (body.position && typeof body.position === 'object') {
      const p = body.position
      const idx = db.positions.findIndex((item) => item.id === p.id)
      const updated: ServerPosition = {
        id: String(p.id || `pos-${Date.now()}`),
        code: p.code !== undefined ? String(p.code) : (idx >= 0 ? db.positions[idx].code : undefined),
        name: String(p.name || (idx >= 0 ? db.positions[idx].name : '')),
        department_id: String(p.department_id || (idx >= 0 ? db.positions[idx].department_id : 'dept-002')),
        level: Number(p.level !== undefined ? p.level : (idx >= 0 ? db.positions[idx].level : 1)),
        base_salary: Number(p.base_salary !== undefined ? p.base_salary : (idx >= 0 ? db.positions[idx].base_salary : 5000000)),
        pay_type: ((p.pay_type || (idx >= 0 ? db.positions[idx].pay_type : 'hourly')) === 'monthly' ? 'monthly' : 'hourly') as 'monthly' | 'hourly',
      }
      if (idx >= 0) db.positions[idx] = updated
      else db.positions.push(updated)
    } else if (body.delete_position_id) {
      db.positions = db.positions.filter((p) => p.id !== body.delete_position_id)
    }

    // ─── 3. LEAVE TYPES ───
    if (body.type === 'leave_types' && Array.isArray(body.data)) {
      db.leave_types = body.data.map((lt: Partial<ServerLeaveType>) => ({
        id: String(lt.id || `lt-${Date.now()}`),
        name: String(lt.name || ''),
        code: String(lt.code || ''),
        default_days: Number(lt.default_days || 12),
        is_paid: Boolean(lt.is_paid),
        require_doc: Boolean(lt.require_doc),
      }))
    } else if (body.leave_type && typeof body.leave_type === 'object') {
      const lt = body.leave_type
      const idx = db.leave_types.findIndex((item) => item.id === lt.id)
      const updated: ServerLeaveType = {
        id: String(lt.id || `lt-${Date.now()}`),
        name: String(lt.name || (idx >= 0 ? db.leave_types[idx].name : '')),
        code: String(lt.code || (idx >= 0 ? db.leave_types[idx].code : '')),
        default_days: Number(lt.default_days !== undefined ? lt.default_days : (idx >= 0 ? db.leave_types[idx].default_days : 12)),
        is_paid: lt.is_paid !== undefined ? Boolean(lt.is_paid) : (idx >= 0 ? db.leave_types[idx].is_paid : true),
        require_doc: lt.require_doc !== undefined ? Boolean(lt.require_doc) : (idx >= 0 ? db.leave_types[idx].require_doc : false),
      }
      if (idx >= 0) db.leave_types[idx] = updated
      else db.leave_types.push(updated)
    } else if (body.delete_leave_type_id) {
      db.leave_types = db.leave_types.filter((lt) => lt.id !== body.delete_leave_type_id)
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: 'Đã lưu danh mục vào CSDL máy chủ thành công!',
      departments: db.departments,
      positions: db.positions,
      leave_types: db.leave_types,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi cập nhật danh mục'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
