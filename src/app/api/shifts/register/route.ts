import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, ServerShiftRegistration } from '@/lib/server/db'

// 1. GET: Quản lý lấy danh sách ca đăng ký chờ duyệt từ Database máy chủ
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('store_id')
    const week = searchParams.get('week') || searchParams.get('week_start_date')
    const employeeId = searchParams.get('employee_id')
    const status = searchParams.get('status') || 'PENDING'

    const db = await getServerDb()
    let list = db.shifts || []

    if (status && status !== 'all') {
      list = list.filter((s) => s.status.toUpperCase() === status.toUpperCase())
    }

    if (storeId) {
      list = list.filter((s) => s.store_id === storeId)
    }

    if (week) {
      list = list.filter((s) => s.week_start_date === week)
    }

    if (employeeId) {
      list = list.filter((s) => s.employee_id === employeeId)
    }

    return NextResponse.json({
      success: true,
      count: list.length,
      data: list,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// 2. POST: Nhân viên gửi ca rảnh từ điện thoại lên Database máy chủ
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Hỗ trợ cả 2 định dạng:
    // Format A: { employee_id, store_id, week_start_date, items: [{ date, shift_id, notes }] }
    // Format B: Mảng các ca [{ employee_id, store_id, date, shift_id }] hoặc 1 ca đơn lẻ
    let rawItems: Record<string, unknown>[] = []

    if (body && Array.isArray(body.items)) {
      rawItems = body.items.map((it: Record<string, unknown>) => ({
        employee_id: body.employee_id,
        store_id: body.store_id,
        week_start_date: body.week_start_date,
        date: it.date,
        shift_id: it.shiftId || it.shift_id,
        position_id: it.positionId || it.position_id,
        notes: it.notes,
      }))
    } else if (Array.isArray(body)) {
      rawItems = body
    } else if (body && typeof body === 'object') {
      rawItems = [body]
    }

    if (rawItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không có dữ liệu ca đăng ký' },
        { status: 400 }
      )
    }

    const db = await getServerDb()
    if (!db.shifts) db.shifts = []
    const { checkShiftOverlap } = await import('@/lib/server/db')

    // Nếu gửi gói tuần từ Mobile (body.items), chỉ xóa các ca PENDING của chính store_id đó trong tuần đó để cập nhật mới
    const isWeeklyBundle = body && Array.isArray(body.items) && body.items.length > 0
    if (isWeeklyBundle) {
      const firstEmpId = rawItems[0]?.employee_id as string
      const firstWeek = rawItems[0]?.week_start_date as string
      const firstStoreId = rawItems[0]?.store_id as string
      if (firstEmpId && firstWeek && firstStoreId) {
        db.shifts = db.shifts.filter(
          (s) => !(s.employee_id === firstEmpId && s.store_id === firstStoreId && s.week_start_date === firstWeek && s.status === 'PENDING')
        )
      }
    }

    // 3. CHẶN ĐĂNG KÝ TRÙNG CA:
    // 1 nhân viên không được phép đăng ký 2 ca trùng ngày và trùng khung giờ (kể cả khác cơ sở).
    // a. Kiểm tra xung đột giữa các ca trong chính danh sách gửi lên
    for (let i = 0; i < rawItems.length; i++) {
      const itemA = rawItems[i]
      const empIdA = String(itemA.employee_id || body.employee_id || '')
      const dateA = String(itemA.date || '')
      const shiftIdA = String(itemA.shift_id || itemA.shiftId || '')

      for (let j = i + 1; j < rawItems.length; j++) {
        const itemB = rawItems[j]
        const empIdB = String(itemB.employee_id || body.employee_id || '')
        const dateB = String(itemB.date || '')
        const shiftIdB = String(itemB.shift_id || itemB.shiftId || '')

        if (empIdA === empIdB && dateA === dateB && shiftIdA && shiftIdB) {
          if (checkShiftOverlap(shiftIdA, shiftIdB, db.shift_templates)) {
            return NextResponse.json(
              { success: false, error: 'Ca đăng ký bị trùng khung giờ' },
              { status: 400 }
            )
          }
        }
      }
    }

    // b. Kiểm tra xung đột với các ca đã được ghi nhận trước đó trên máy chủ (kể cả khác cơ sở)
    for (const item of rawItems) {
      const empId = String(item.employee_id || body.employee_id || '')
      const date = String(item.date || '')
      const shiftId = String(item.shift_id || item.shiftId || '')

      if (!empId || !date || !shiftId) continue

      const conflictingShift = db.shifts.find(
        (s) =>
          s.employee_id === empId &&
          s.date === date &&
          s.status !== 'REJECTED' &&
          checkShiftOverlap(shiftId, s.shift_id, db.shift_templates)
      )

      if (conflictingShift) {
        return NextResponse.json(
          { success: false, error: 'Ca đăng ký bị trùng khung giờ' },
          { status: 400 }
        )
      }
    }

    const insertedItems: ServerShiftRegistration[] = []

    const shiftNames: Record<string, string> = {
      'shift-001': 'Ca Sáng (08:30 - 12:00)',
      'shift-002': 'Ca Trưa (12:00 - 17:00)',
      'shift-003': 'Ca Tối (17:00 - 22:00)',
      'shift-004': 'Ca Cao Điểm Trưa (11:30 - 14:30)',
      'shift-005': 'Ca Dọn Quầy (22:00 - 01:30)',
    }

    for (const item of rawItems) {
      const employee_id = String(item.employee_id || '')
      const store_id = String(item.store_id || '')
      const date = String(item.date || '')
      const shift_id = String(item.shift_id || item.shiftId || '')
      const week_start_date = String(item.week_start_date || date)

      if (!employee_id || !store_id || !date || !shift_id) {
        return NextResponse.json(
          { success: false, error: 'Mỗi ca đăng ký cần có: employee_id, store_id, date, shift_id' },
          { status: 400 }
        )
      }

      const emp = db.employees.find((e) => e.id === employee_id)
      const empName = emp?.full_name || String(item.employee_name || 'Nhân viên')

      const newRegistration: ServerShiftRegistration = {
        id: `shift-reg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        employee_id,
        employee_name: empName,
        store_id,
        week_start_date,
        date,
        shift_id,
        shift_name: String(item.shift_name || shiftNames[shift_id] || shift_id),
        position_id: String(item.position_id || emp?.position_id || 'pos-001'),
        status: 'PENDING',
        created_at: new Date().toISOString(),
        notes: String(item.notes || ''),
      }

      db.shifts.push(newRegistration)
      insertedItems.push(newRegistration)
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: `Đã tiếp nhận ${insertedItems.length} ca rảnh của nhân viên vào Database máy chủ`,
      count: insertedItems.length,
      data: insertedItems,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
