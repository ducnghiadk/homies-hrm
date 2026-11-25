import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, ServerEmployee } from '@/lib/server/db'
import {
  ADMIN_ROLES,
  AuthenticatedUser,
  MANAGER_ROLES,
  canAccessStore,
  getAuthenticatedUser,
  getStorePinAccess,
  hasRequiredRole,
  requireAuth,
} from '@/lib/server/auth-helper'
import { isIposModuleEnabled } from '@/lib/server/data-mode'
import { fetchIposEmployees, type MappedIposEmployee } from '@/lib/services/ipos/ipos-cloud-client'

export async function GET(req: NextRequest) {
  try {
    const viewer = await resolveViewer(req)
    if (!viewer.ok) return viewer.response

    const { searchParams } = new URL(req.url)
    // Cổng PIN chỉ được xem nhân sự của đúng chi nhánh đã mở khóa
    const storeId = viewer.pinStoreId || searchParams.get('store_id')
    const role = searchParams.get('role')
    const status = searchParams.get('status')

    const db = await getServerDb()
    let list: Array<ServerEmployee | MappedIposEmployee> = []
    let dataSource = 'homies_native'

    if (isIposModuleEnabled(db, 'employees')) {
      // 1. Tải dữ liệu trực tiếp từ iPOS Cloud API khi công tắc Nhân sự đang BẬT
      const iposRes = await fetchIposEmployees()
      if (iposRes.success && !iposRes.isFallback && iposRes.data.length > 0) {
        const resignedList = (db.employees || []).filter((e) => e.status === 'resigned')
        const resignedIds = new Set(resignedList.map((e) => e.id))
        const resignedCodes = new Set(
          resignedList
            .map((e) => (e.employee_code || '').trim().toUpperCase())
            .filter((c) => c && c !== '-')
        )
        const resignedNames = new Set(
          resignedList
            .map((e) => (e.full_name || '').trim().toLowerCase())
            .filter(Boolean)
        )

        list = iposRes.data.map((emp) => {
          const codeUpper = (emp.employee_code || '').trim().toUpperCase()
          const nameLower = (emp.full_name || '').trim().toLowerCase()
          const isResigned =
            resignedIds.has(emp.id) ||
            (codeUpper && codeUpper !== '-' && resignedCodes.has(codeUpper)) ||
            (nameLower && resignedNames.has(nameLower))

          if (isResigned) {
            return {
              ...emp,
              status: 'resigned' as const,
              account_status: 'bi_khoa' as const,
            }
          }

          if (
            emp.id === 'emp-bh9852' ||
            codeUpper === 'BH-9852' ||
            nameLower === 'huỳnh lê kiều linh'
          ) {
            return {
              ...emp,
              employee_code: !emp.employee_code || emp.employee_code === '-' ? 'BH-9852' : emp.employee_code,
              store_id: 'store-001',
            }
          }

          return emp
        })
        dataSource = 'ipos_cloud'
      } else {
        // 2. Dự phòng An toàn (Fallback): Đọc từ CSDL nội bộ
        list = db.employees || []
        dataSource = 'internal_db'
      }
    } else {
      // Chế độ Homies Tự Vận Hành: Không gọi iPOS
      list = db.employees || []
      dataSource = 'homies_native'
    }

    if (storeId) {
      list = list.filter(
        (e) =>
          e.store_id === storeId ||
          (e.secondary_store_ids && e.secondary_store_ids.includes(storeId))
      )
    }

    if (role) {
      list = list.filter((e) => e.role === role)
    }

    if (status) {
      list = list.filter((e) => e.status === status)
    }

    // Trả về danh sách đã lọc theo quyền: không bao giờ lộ mật khẩu; lương/ngân hàng/CCCD chỉ cho người có quyền
    const safeList = list.map((u) => sanitizeEmployeeForViewer(u as unknown as Record<string, unknown>, viewer))

    return NextResponse.json({
      success: true,
      source: dataSource,
      count: safeList.length,
      data: safeList,
    })
  } catch (error: unknown) {
    console.error('[api/employees]', error)
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

type Viewer =
  | { ok: true; user: AuthenticatedUser; pinStoreId?: undefined }
  | { ok: true; user?: undefined; pinStoreId: string }
  | { ok: false; response: NextResponse }

/** Người xem danh sách: tài khoản đăng nhập, hoặc cổng ghi nhận sự cố đã mở khóa bằng mã PIN chi nhánh. */
async function resolveViewer(req: NextRequest): Promise<Viewer> {
  const pinStoreId = getStorePinAccess(req)
  if (pinStoreId && !(await getAuthenticatedUser(req))) {
    return { ok: true, pinStoreId }
  }
  const auth = await requireAuth(req)
  if (!auth.ok) return { ok: false, response: auth.response }
  return { ok: true, user: auth.user }
}

const BASIC_FIELDS = [
  'id', 'full_name', 'employee_code', 'role', 'store_id', 'secondary_store_ids', 'position_id',
  'status', 'account_status', 'department_name',
]
const CONTACT_FIELDS = ['email', 'phone', 'hire_date', 'uniform_size', 'health_cert_expiry']
const PAY_FIELDS = ['base_salary', 'hourly_rate']

function pick(source: Record<string, unknown>, fields: string[]) {
  const out: Record<string, unknown> = {}
  for (const f of fields) if (source[f] !== undefined) out[f] = source[f]
  return out
}

/**
 * - Cổng PIN: chỉ thông tin cơ bản để chọn nhân viên.
 * - Admin (CEO/HR) và chính chủ: đầy đủ (trừ mật khẩu).
 * - Quản lý: thêm liên hệ, và đơn giá lương của nhân sự chi nhánh mình.
 * - Nhân viên khác: thông tin cơ bản + liên hệ.
 */
function sanitizeEmployeeForViewer(emp: Record<string, unknown>, viewer: Viewer): Record<string, unknown> {
  if (!viewer.ok) return {}
  if (!viewer.user) return pick(emp, BASIC_FIELDS)
  const user = viewer.user
  if (hasRequiredRole(user.role, ADMIN_ROLES) || emp.id === user.userId) {
    const full = { ...emp }
    delete full.password
    return full
  }
  const base = pick(emp, [...BASIC_FIELDS, ...CONTACT_FIELDS])
  if (hasRequiredRole(user.role, MANAGER_ROLES) && canAccessStore(user, emp.store_id as string)) {
    Object.assign(base, pick(emp, PAY_FIELDS))
  }
  return base
}

/** Các trường được phép ghi. Không bao giờ nhận mật khẩu hay id từ client. */
const MANAGER_WRITABLE_FIELDS = [
  'full_name', 'email', 'phone', 'store_id', 'secondary_store_ids', 'position_id', 'employee_code',
  'status', 'account_status', 'department_name', 'hire_date', 'uniform_size', 'health_cert_expiry', 'role',
]
const ADMIN_ONLY_FIELDS = [
  'base_salary', 'hourly_rate', 'bank_name', 'bank_account_no', 'bank_account_holder',
  'id_card_front_url', 'id_card_back_url',
]
const MANAGER_ASSIGNABLE_ROLES = ['employee', 'shift_leader']
const VALID_ROLES = ['ceo', 'hr_admin', 'store_manager', 'area_manager', 'shift_leader', 'employee']

type WriteOutcome = { ok: true; employee: ServerEmployee; created: boolean } | { ok: false; status: number; error: string }

function findEmployeeIndex(db: { employees: ServerEmployee[] }, item: Record<string, unknown>): number {
  const id = item.id ? String(item.id) : ''
  const code = item.employee_code ? String(item.employee_code) : ''
  const cleanEmail = item.email ? String(item.email).trim().toLowerCase() : ''
  const cleanPhone = item.phone ? String(item.phone).replace(/\D/g, '') : ''
  return db.employees.findIndex((e) => {
    if (id && e.id === id) return true
    if (code && e.employee_code === code) return true
    if (cleanEmail && (e.email || '').toLowerCase() === cleanEmail) return true
    if (cleanPhone.length >= 9) {
      const empPhone = (e.phone || '').replace(/\D/g, '')
      if (empPhone && empPhone === cleanPhone) return true
    }
    return false
  })
}

function applyEmployeeWrite(
  db: { employees: ServerEmployee[] },
  item: Record<string, unknown>,
  user: AuthenticatedUser
): WriteOutcome {
  const isAdmin = hasRequiredRole(user.role, ADMIN_ROLES)
  const isCeo = user.role === 'ceo'
  const allowed = isAdmin ? [...MANAGER_WRITABLE_FIELDS, ...ADMIN_ONLY_FIELDS] : MANAGER_WRITABLE_FIELDS
  const patch = pick(item, allowed)

  if (typeof patch.email === 'string') patch.email = patch.email.trim().toLowerCase()
  if (patch.phone !== undefined) patch.phone = String(patch.phone).trim()

  if (patch.role !== undefined) {
    const role = String(patch.role)
    if (!VALID_ROLES.includes(role)) delete patch.role
    else if (!isAdmin && !MANAGER_ASSIGNABLE_ROLES.includes(role)) delete patch.role
    else if (role === 'ceo' && !isCeo) delete patch.role
  }

  const existingIndex = findEmployeeIndex(db, item)

  if (existingIndex >= 0) {
    const current = db.employees[existingIndex]
    if (current.role === 'ceo' && !isCeo) {
      return { ok: false, status: 403, error: 'Chỉ CEO được sửa hồ sơ CEO.' }
    }
    if (!isAdmin) {
      if (!canAccessStore(user, current.store_id)) {
        return { ok: false, status: 403, error: 'Bạn không quản lý nhân sự này.' }
      }
      // Quản lý không được nâng/hạ vai trò của cấp quản lý trở lên
      if (!MANAGER_ASSIGNABLE_ROLES.includes(current.role)) delete patch.role
      if (patch.store_id !== undefined && !canAccessStore(user, String(patch.store_id))) delete patch.store_id
    }
    const updated: ServerEmployee = { ...current, ...(patch as Partial<ServerEmployee>), id: current.id }
    db.employees[existingIndex] = updated
    return { ok: true, employee: updated, created: false }
  }

  const fullName = typeof patch.full_name === 'string' ? patch.full_name.trim() : ''
  const email = typeof patch.email === 'string' ? patch.email : ''
  const phone = typeof patch.phone === 'string' ? patch.phone : ''
  if (!fullName || (!email && phone.replace(/\D/g, '').length < 9)) {
    return { ok: false, status: 400, error: 'Thiếu thông tin bắt buộc khi thêm nhân viên mới (họ tên, email hoặc SĐT)' }
  }
  const storeId = typeof patch.store_id === 'string' && patch.store_id ? patch.store_id : user.employee?.store_id || 'store-001'
  if (!isAdmin && !canAccessStore(user, storeId)) {
    return { ok: false, status: 403, error: 'Bạn chỉ được thêm nhân sự vào chi nhánh mình quản lý.' }
  }

  const requestedId = typeof item.id === 'string' && /^emp-[\w-]{1,60}$/.test(item.id) ? item.id : ''
  const created: ServerEmployee = {
    id: requestedId || `emp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    full_name: fullName,
    email,
    phone,
    role: (patch.role as ServerEmployee['role']) || 'employee',
    store_id: storeId,
    secondary_store_ids: Array.isArray(patch.secondary_store_ids) ? (patch.secondary_store_ids as string[]) : undefined,
    position_id: (patch.position_id as string) || 'pos-001',
    employee_code: (patch.employee_code as string) || `NV${String(db.employees.length + 1).padStart(4, '0')}`,
    status: (patch.status as ServerEmployee['status']) || 'active',
    account_status: (patch.account_status as ServerEmployee['account_status']) || 'dang_hoat_dong',
    department_name: (patch.department_name as string) || 'Vận hành cửa hàng',
    // Không tự gán lương mặc định: HR phải nhập mức lương thật
    base_salary: typeof patch.base_salary === 'number' ? patch.base_salary : 0,
    hourly_rate: typeof patch.hourly_rate === 'number' ? patch.hourly_rate : 0,
    hire_date: (patch.hire_date as string) || new Date().toISOString().split('T')[0],
    uniform_size: patch.uniform_size as ServerEmployee['uniform_size'],
    health_cert_expiry: patch.health_cert_expiry as string | undefined,
    bank_name: patch.bank_name as string | undefined,
    bank_account_no: patch.bank_account_no as string | undefined,
    bank_account_holder: patch.bank_account_holder as string | undefined,
    id_card_front_url: patch.id_card_front_url as string | undefined,
    id_card_back_url: patch.id_card_back_url as string | undefined,
  }
  db.employees.push(created)
  return { ok: true, employee: created, created: true }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, MANAGER_ROLES)
    if (!auth.ok) return auth.response

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Dữ liệu gửi lên không hợp lệ' }, { status: 400 })
    }
    const db = await getServerDb()

    // Đồng bộ cả danh sách (từ bộ nhớ trình duyệt): bản ghi ngoài quyền được bỏ qua, không làm hỏng cả lô
    if (Array.isArray(body)) {
      let updatedCount = 0
      let skippedCount = 0
      for (const item of body) {
        if (!item || typeof item !== 'object') continue
        const outcome = applyEmployeeWrite(db, item as Record<string, unknown>, auth.user)
        if (outcome.ok) updatedCount++
        else skippedCount++
      }
      await saveServerDb(db)
      return NextResponse.json({
        success: true,
        message: `Đã đồng bộ ${updatedCount} nhân sự lên máy chủ`,
        count: updatedCount,
        skipped: skippedCount,
      })
    }

    const outcome = applyEmployeeWrite(db, body as Record<string, unknown>, auth.user)
    if (!outcome.ok) {
      return NextResponse.json({ success: false, error: outcome.error }, { status: outcome.status })
    }
    await saveServerDb(db)

    const safeResult = { ...outcome.employee } as Record<string, unknown>
    delete safeResult.password

    return NextResponse.json({
      success: true,
      message: outcome.created ? 'Thêm mới nhân sự thành công' : 'Cập nhật hồ sơ nhân sự thành công',
      data: safeResult,
    })
  } catch (error: unknown) {
    console.error('[api/employees]', error)
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  return POST(req)
}
