import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, isScheduleManagerRole } from '@/lib/server/auth-helper'
import {
  getServerDb,
  saveServerDb,
  STANDARD_FNB_SHIFTS,
  isFakeSeedShift,
  getShiftSlotDedupeKey,
  mergeShiftRecords,
  normalizeStoreId,
  getCalendarWeekStart,
  getCalendarWeekEnd,
  isWeekPublishedInDb,
  type ServerShiftRegistration,
} from '@/lib/server/db'
import { isIposModuleEnabled } from '@/lib/server/data-mode'
import { fetchIposWorkSchedule, type MappedIposSchedule } from '@/lib/services/ipos/ipos-cloud-client'

type CompatibilityShiftItem = (ServerShiftRegistration | MappedIposSchedule) & {
  assigned_position_id?: string
  modified_after_publish?: boolean
  change_reason?: string
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để xem lịch ca làm việc.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('store_id')
    const weekStart = searchParams.get('week_start') || searchParams.get('week_start_date')
    const date = searchParams.get('date')
    const status = searchParams.get('status')
    const employeeId = searchParams.get('employee_id')
    const month = searchParams.get('month') || searchParams.get('period')
    const fromDateParam = searchParams.get('from_date')
    const toDateParam = searchParams.get('to_date')
    const publishedOnly =
      searchParams.get('published_only') === '1' || searchParams.get('published_only') === 'true'
    const peerSwap =
      searchParams.get('peer_swap') === '1' || searchParams.get('peer_swap') === 'true'

    // Xác định khoảng thời gian truy vấn theo lịch dương thuần Việt Nam (UTC+7)
    let fromDate = fromDateParam || date
    let toDate = toDateParam || date

    if (!fromDate && month) {
      fromDate = `${month}-01`
      toDate = `${month}-31`
    } else if (!fromDate && weekStart) {
      const monday = getCalendarWeekStart(weekStart)
      fromDate = monday
      toDate = getCalendarWeekEnd(monday)
    } else if (!fromDate && !toDate) {
      const vnNow = new Date(Date.now() + 7 * 3600_000)
      const currMonth = vnNow.toISOString().slice(0, 7)
      fromDate = `${currMonth}-01`
      toDate = `${currMonth}-31`
    }

    const db = await getServerDb()

    // 1. Luôn ưu tiên Lịch Đã Chốt Chính Thức trên Homies (Kho 2: official_schedules + schedule_weeks)
    const publishedOfficial: CompatibilityShiftItem[] = (db.official_schedules || [])
      .filter((s) => s.status === 'published' && isWeekPublishedInDb(db, s.store_id, s.week_start_date))
      .map((s) => ({
        id: s.id,
        employee_id: s.employee_id,
        employee_name: s.employee_name,
        store_id: normalizeStoreId(s.store_id),
        week_start_date: getCalendarWeekStart(s.week_start_date || s.date),
        date: s.date,
        shift_id: s.shift_id,
        shift_name: s.shift_name,
        position_id: s.assigned_position_id || 'pos-001',
        assigned_position_id: s.assigned_position_id || 'pos-001',
        status: 'APPROVED' as const,
        created_at: s.created_at,
        notes: s.notes,
        modified_after_publish: s.modified_after_publish,
        change_reason: s.change_reason,
      }))

    const publishedWeekKeys = new Set(
      (db.schedule_weeks || [])
        .filter((w) => w.status === 'published')
        .map((w) => `${normalizeStoreId(w.store_id)}|${getCalendarWeekStart(w.week_start)}`)
    )

    let list: CompatibilityShiftItem[] = publishedOfficial
    let dataSource = 'homies_official'

    // 2. Nếu không yêu cầu published_only và công tắc iPOS đang BẬT:
    // chỉ bổ sung dữ liệu iPOS cho các tuần CHƯA chốt chính thức trên Homies (tuyệt đối không ghi đè tuần đã chốt)
    if (!publishedOnly && isIposModuleEnabled(db, 'shifts')) {
      const iposRes = await fetchIposWorkSchedule({
        storeId,
        fromDate,
        toDate,
      })

      if (iposRes.success && !iposRes.isFallback && iposRes.data.length > 0) {
        const iposFallback = iposRes.data.filter((item) => {
          const itemWeekKey = `${normalizeStoreId(item.store_id)}|${getCalendarWeekStart(item.date)}`
          return !publishedWeekKeys.has(itemWeekKey)
        })
        list = [...publishedOfficial, ...iposFallback]
        dataSource =
          publishedOfficial.length > 0
            ? iposFallback.length > 0
              ? 'homies_official+ipos_cloud'
              : 'homies_official'
            : 'ipos_cloud'
      }
    }

    if (storeId && storeId !== 'ALL') {
      const targetStore = normalizeStoreId(storeId)
      list = list.filter((s) => normalizeStoreId(s.store_id) === targetStore)
    }

    if (month) {
      list = list.filter((s) => s.date.startsWith(month))
    }

    if (weekStart) {
      const targetWeek = getCalendarWeekStart(weekStart)
      list = list.filter((s) => getCalendarWeekStart(s.week_start_date || s.date) === targetWeek)
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

    if (!isScheduleManagerRole(auth.role)) {
      if (peerSwap) {
        const authStoreIds = new Set<string>(
          [
            auth.employee?.store_id,
            ...(Array.isArray(auth.employee?.secondary_store_ids) ? auth.employee.secondary_store_ids : []),
          ]
            .filter((id): id is string => Boolean(id))
            .map((id) => normalizeStoreId(id))
        )

        if (authStoreIds.size > 0) {
          list = list.filter(
            (s) =>
              s.status?.toUpperCase() === 'APPROVED' &&
              authStoreIds.has(normalizeStoreId(s.store_id))
          )
        } else {
          list = list.filter((s) => s.employee_id === auth.userId)
        }
      } else {
        list = list.filter((s) => s.employee_id === auth.userId)
      }
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
    const auth = await getAuthenticatedUser(req)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Vui lòng đăng nhập để quản lý ca làm việc.' },
        { status: 401 }
      )
    }
    if (!isScheduleManagerRole(auth.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Không đủ thẩm quyền: Chỉ Quản lý cửa hàng, Quản lý khu vực, HR hoặc CEO mới được chỉnh sửa khung ca hoặc lịch ca.',
        },
        { status: 403 }
      )
    }

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
        if (isFakeSeedShift({ id: String(sId || ''), notes: String(item.notes || '') })) {
          continue
        }

        const emp = db.employees.find((e) => e.id === empId)
        const defaultShiftName =
          sShiftId === 'shift-001'
            ? 'Ca Sáng'
            : sShiftId === 'shift-002'
            ? 'Ca Trưa'
            : sShiftId === 'shift-003'
            ? 'Ca Tối'
            : sShiftId

        const candidate: ServerShiftRegistration = {
          id: sId || `shift-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          employee_id: empId,
          employee_name: item.employee_name || emp?.full_name || 'Nhân viên',
          store_id: item.store_id || emp?.store_id || 'store-001',
          week_start_date: item.week_start_date || sDate,
          date: sDate,
          shift_id: sShiftId,
          shift_name: item.shift_name || defaultShiftName,
          position_id: item.position_id || item.assigned_position_id || emp?.position_id || 'pos-001',
          status: item.status === 'published' ? 'APPROVED' : item.status?.toUpperCase() || 'APPROVED',
          created_at: new Date().toISOString(),
          notes: item.notes || '',
        }

        const candidateSlotKey = getShiftSlotDedupeKey(candidate)
        const existingIdx = db.shifts.findIndex(
          (s) =>
            (sId && s.id === sId) ||
            ((s.status || '').toUpperCase() !== 'REJECTED' &&
              getShiftSlotDedupeKey(s) === candidateSlotKey)
        )

        if (existingIdx >= 0) {
          db.shifts[existingIdx] = mergeShiftRecords(db.shifts[existingIdx], {
            ...candidate,
            id: db.shifts[existingIdx].id,
          })
          count++
        } else {
          db.shifts.push(candidate)
          count++
        }
      }

      if (count > 0) {
        await saveServerDb(db)
      }
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

    if (isFakeSeedShift({ id: String(id || ''), notes: String(notes || '') })) {
      return NextResponse.json(
        { success: false, error: 'Không cho phép lưu ca giả lập (sch-seed)' },
        { status: 400 }
      )
    }

    if (!employee_id || !date || !shift_id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc (employee_id, date, shift_id)' },
        { status: 400 }
      )
    }

    const candidateKey = getShiftSlotDedupeKey({
      store_id: store_id || 'store-001',
      date,
      shift_id,
      shift_name,
      notes,
      employee_id,
      employee_name,
    })

    const existingIndex = db.shifts.findIndex(
      (s) =>
        (id && s.id === id) ||
        ((s.status || '').toUpperCase() !== 'REJECTED' && getShiftSlotDedupeKey(s) === candidateKey)
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

