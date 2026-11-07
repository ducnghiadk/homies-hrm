import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, STANDARD_FNB_SHIFTS, type ServerShiftRegistration } from '@/lib/server/db'
import { fetchIposWorkSchedule, type MappedIposSchedule } from '@/lib/services/ipos/ipos-cloud-client'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('store_id')
    const weekStart = searchParams.get('week_start') || searchParams.get('week_start_date')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const employeeId = searchParams.get('employee_id')
    const month = searchParams.get('month') || searchParams.get('period')
    const fromDateParam = searchParams.get('from_date')
    const toDateParam = searchParams.get('to_date')

    // Xác định khoảng thời gian truy vấn cho iPOS Cloud
    let fromDate = fromDateParam || date
    let toDate = toDateParam || date

    if (!fromDate && month) {
      fromDate = `${month}-01`
      toDate = `${month}-31`
    } else if (!fromDate && weekStart) {
      fromDate = weekStart
      const startDate = new Date(weekStart)
      startDate.setDate(startDate.getDate() + 6)
      toDate = startDate.toISOString().slice(0, 10)
    } else if (!fromDate && !toDate) {
      // Mặc định lấy trọn vẹn tháng hiện tại theo thời gian thực
      const currMonth = new Date().toISOString().slice(0, 7)
      fromDate = `${currMonth}-01`
      toDate = `${currMonth}-31`
    }

    const db = await getServerDb()

    // 1. Thử tải dữ liệu ca làm việc trực tiếp từ iPOS Cloud
    const iposRes = await fetchIposWorkSchedule({
      storeId,
      fromDate,
      toDate,
    })

    let list: Array<ServerShiftRegistration | MappedIposSchedule> = []
    let dataSource = 'ipos_cloud'

    if (iposRes.success && !iposRes.isFallback && iposRes.data.length > 0) {
      list = iposRes.data
    } else {
      // 2. Cơ chế Dự phòng An toàn (Fallback): Đọc từ CSDL nội bộ
      list = db.shifts || []
      dataSource = 'internal_db'
    }

    if (storeId) {
      list = list.filter((s) => s.store_id === storeId)
    }

    if (month) {
      list = list.filter((s) => s.date.startsWith(month))
    }

    if (weekStart) {
      list = list.filter((s) => s.week_start_date === weekStart)
    }

    if (fromDateParam) {
      list = list.filter((s) => s.date >= fromDateParam)
    }

    if (toDateParam) {
      list = list.filter((s) => s.date <= toDateParam)
    }

    if (date) {
      list = list.filter((s) => s.date === date)
    }

    if (status) {
      list = list.filter((s) => s.status?.toLowerCase() === status.toLowerCase())
    }

    if (employeeId) {
      list = list.filter((s) => s.employee_id === employeeId)
    }

    const shiftTemplates = (db.shift_templates && db.shift_templates.length > 0)
      ? db.shift_templates
      : Object.values(STANDARD_FNB_SHIFTS).map(s => ({
          id: s.id,
          name: s.name,
          start: s.start,
          end: s.end,
          hours: s.hours,
          is_active: true,
        }))

    return NextResponse.json({
      success: true,
      source: dataSource,
      count: list.length,
      shift_templates: shiftTemplates,
      data: list,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const db = await getServerDb()
    // 0. Xóa mẫu ca (delete_template_id)
    if (body.delete_template_id) {
      if (Array.isArray(db.shift_templates)) {
        db.shift_templates = db.shift_templates.filter(t => t.id !== body.delete_template_id && t.code !== body.delete_template_id)
        await saveServerDb(db)
      }
      return NextResponse.json({ success: true, message: 'Đã xóa mẫu ca khỏi máy chủ' })
    }

    // 1. Cập nhật hoặc thêm mới mẫu ca (shift_template)
    if (body.type === 'template' || body.shift_template) {
      const template = body.shift_template || body
      if (!db.shift_templates) db.shift_templates = []
      const idx = db.shift_templates.findIndex((t) => t.id === template.id || t.name === template.name)
      const normalizedTemplate = {
        id: template.id || `shift-${Date.now()}`,
        name: template.name || 'Ca làm mới',
        code: template.code || (template.name?.toLowerCase().includes('sáng') ? 'MORNING' : template.name?.toLowerCase().includes('chiều') || template.name?.toLowerCase().includes('trưa') ? 'NOON' : template.name?.toLowerCase().includes('tối') ? 'EVENING' : 'FLEX'),
        start: template.start || template.start_time || '08:30',
        end: template.end || template.end_time || '12:00',
        hours: Number(template.hours || 3.5),
        color: template.color || '#2F6FA8',
        store_scope: template.store_scope || 'global',
        store_id: template.store_id,
        is_active: template.is_active !== false,
        is_flexible: Boolean(template.is_flexible),
        allowed_position_ids: Array.isArray(template.allowed_position_ids) ? template.allowed_position_ids : ['pos-001', 'pos-002', 'pos-003', 'pos-bep'],
        min_headcount: template.min_headcount !== undefined ? Number(template.min_headcount) : 1,
        max_headcount: template.max_headcount !== undefined ? Number(template.max_headcount) : 3,
      }

      if (idx >= 0) {
        db.shift_templates[idx] = { ...db.shift_templates[idx], ...normalizedTemplate }
      } else {
        db.shift_templates.push(normalizedTemplate)
      }
      await saveServerDb(db)
      return NextResponse.json({ success: true, message: 'Đã lưu mẫu ca thành công', data: db.shift_templates[idx >= 0 ? idx : db.shift_templates.length - 1] })
    }

    // 2. Thêm hoặc cập nhật mảng phân ca làm việc (nếu gửi mảng Schedule[])
    if (Array.isArray(body)) {
      if (!db.shifts) db.shifts = []
      let count = 0
      for (const item of body) {
        if (!item || typeof item !== 'object') continue
        const empId = item.employee_id || item.employeeId
        const sDate = item.date
        const sShiftId = item.shift_id || item.shiftId
        if (!empId || !sDate || !sShiftId) continue

        const sId = item.id
        const existingIdx = db.shifts.findIndex(
          (s) => (sId && s.id === sId) || (s.employee_id === empId && s.date === sDate && s.shift_id === sShiftId)
        )

        const emp = db.employees.find((e) => e.id === empId)
        const defaultShiftName = sShiftId === 'shift-001' ? 'Ca Sáng' : sShiftId === 'shift-002' ? 'Ca Trưa' : sShiftId === 'shift-003' ? 'Ca Tối' : sShiftId

        if (existingIdx >= 0) {
          db.shifts[existingIdx] = {
            ...db.shifts[existingIdx],
            ...item,
            employee_id: empId,
            date: sDate,
            shift_id: sShiftId,
            position_id: item.position_id || item.assigned_position_id || db.shifts[existingIdx].position_id,
            status: item.status ? (item.status === 'published' ? 'APPROVED' : item.status.toUpperCase()) : db.shifts[existingIdx].status,
          }
          count++
        } else {
          db.shifts.push({
            id: sId || `shift-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            employee_id: empId,
            employee_name: item.employee_name || emp?.full_name || 'Nhân viên',
            store_id: item.store_id || emp?.store_id || 'store-001',
            week_start_date: item.week_start_date || sDate,
            date: sDate,
            shift_id: sShiftId,
            shift_name: item.shift_name || defaultShiftName,
            position_id: item.position_id || item.assigned_position_id || emp?.position_id || 'pos-001',
            status: item.status === 'published' ? 'APPROVED' : (item.status?.toUpperCase() || 'APPROVED'),
            created_at: new Date().toISOString(),
            notes: item.notes || '',
          })
          count++
        }
      }

      await saveServerDb(db)
      return NextResponse.json({
        success: true,
        message: `Đã đồng bộ ${count} ca phân lịch lên máy chủ`,
        count,
      })
    }

    // 3. Thêm hoặc cập nhật một ca làm việc đơn lẻ (single shift)
    const {
      id,
      employee_id,
      employee_name,
      store_id,
      week_start_date,
      date,
      shift_id,
      shift_name,
      position_id,
      status,
      notes,
    } = body

    if (!employee_id || !date || !shift_id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc (employee_id, date, shift_id)' },
        { status: 400 }
      )
    }

    const existingIndex = db.shifts.findIndex(
      (s) => (id && s.id === id) || (s.employee_id === employee_id && s.date === date && s.shift_id === shift_id)
    )

    let shiftRecord: typeof db.shifts[0]

    if (existingIndex >= 0) {
      shiftRecord = {
        ...db.shifts[existingIndex],
        ...body,
      }
      db.shifts[existingIndex] = shiftRecord
    } else {
      shiftRecord = {
        id: id || `shift-reg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        employee_id,
        employee_name: employee_name || '',
        store_id: store_id || 'store-001',
        week_start_date: week_start_date || date,
        date,
        shift_id,
        shift_name: shift_name || (shift_id === 'shift-001' ? 'Ca Sáng' : shift_id === 'shift-002' ? 'Ca Trưa' : 'Ca Tối'),
        position_id: position_id || 'pos-001',
        status: status || 'APPROVED',
        created_at: new Date().toISOString(),
        notes: notes || '',
      }
      db.shifts.push(shiftRecord)
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: existingIndex >= 0 ? 'Cập nhật ca làm thành công' : 'Thêm ca làm thành công',
      data: shiftRecord,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

