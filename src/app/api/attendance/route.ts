import { NextRequest, NextResponse } from 'next/server'
import { OPERATOR_ROLES, canAccessStore, hasRequiredRole, requireAuth } from '@/lib/server/auth-helper'
import {
  getServerDb,
  saveServerDb,
  getInitialAttendanceSeed,
  ServerAttendanceLog,
  ServerEmployee,
  ServerShiftRegistration,
} from '@/lib/server/db'
import { isIposMasterEnabled, isIposModuleEnabled } from '@/lib/server/data-mode'
import {
  fetchIposTimesheet,
  fetchIposEmployees,
  fetchIposWorkSchedule,
  ensureIposBackgroundSyncDaemon,
  getIposAutoSyncStatus,
  type MappedIposAttendance,
  type MappedIposEmployee,
  type MappedIposSchedule,
} from '@/lib/services/ipos/ipos-cloud-client'
import { sendIposSyncAlert } from '@/lib/services/ipos/ipos-notifier'
import { getShiftTimeRange } from '@/lib/server/db'
import { getVnClock } from '@/lib/time/vn-time'
import {
  computeLateMinutes,
  computePaidMinutes,
  isLateBeyondGrace,
  minutesToHours,
  normalizeOperationSettings,
} from '@/lib/attendance/operation-settings'
import { resolveShiftForCheckin, verifyStorePresence } from '@/lib/server/attendance-schedule'

/**
 * Lưu các bản ghi chấm công từ iPOS Cloud vào CSDL nội bộ (server-db.json)
 */
async function persistIposAttendanceToDb(items: MappedIposAttendance[]): Promise<number> {
  if (!items || items.length === 0) return 0
  try {
    const db = await getServerDb()
    if (!db.attendance) db.attendance = []
    let updatedCount = 0

    items.forEach((item) => {
      const idx = db.attendance.findIndex(
        (a) => a.id === item.id || (a.employee_id === item.employee_id && a.date === item.date && a.shift_id === item.shift_id)
      )
      const serverLog: ServerAttendanceLog = {
        id: item.id,
        employee_id: item.employee_id,
        employee_name: item.employee_name,
        store_id: item.store_id,
        store_name: item.store_name || '',
        shift_id: item.shift_id,
        check_in_time: item.check_in_time,
        check_out_time: item.check_out_time,
        check_in_lat: item.check_in_lat,
        check_in_lng: item.check_in_lng,
        check_in_distance_meters: item.check_in_distance_meters,
        status: item.status as ServerAttendanceLog['status'],
        is_late: item.is_late,
        late_minutes: item.late_minutes,
        total_hours: item.total_hours,
        date: item.date,
      }
      if (idx >= 0) {
        db.attendance[idx] = { ...db.attendance[idx], ...serverLog }
        updatedCount++
      } else {
        db.attendance.push(serverLog)
        updatedCount++
      }
    })

    if (updatedCount > 0) {
      await saveServerDb(db)
    }
    return updatedCount
  } catch (e) {
    console.warn('Save attendance internal DB error:', e)
    return 0
  }
}

/**
 * Tự động đồng bộ danh sách Nhân viên từ iPOS Cloud vào CSDL nội bộ
 */
async function persistIposEmployeesToDb(items: MappedIposEmployee[]): Promise<number> {
  if (!items || items.length === 0) return 0
  try {
    const db = await getServerDb()
    if (!db.employees) db.employees = []
    let updatedCount = 0

    items.forEach((item) => {
      const idx = db.employees.findIndex(
        (e) => e.id === item.id || (e.employee_code && e.employee_code === item.employee_code)
      )
      const serverEmp: ServerEmployee = {
        id: item.id,
        employee_code: item.employee_code,
        full_name: item.full_name,
        role: item.role,
        store_id: item.store_id,
        secondary_store_ids: item.secondary_store_ids || [],
        position_id: item.position_id,
        department_name: item.department_name,
        status: item.status,
        account_status: item.account_status,
        email: item.email,
        phone: item.phone,
        base_salary: item.base_salary,
        hourly_rate: item.hourly_rate,
        hire_date: item.hire_date,
      }
      if (idx >= 0) {
        db.employees[idx] = { ...db.employees[idx], ...serverEmp }
        updatedCount++
      } else {
        db.employees.push(serverEmp)
        updatedCount++
      }
    })

    if (updatedCount > 0) {
      await saveServerDb(db)
    }
    return updatedCount
  } catch (e) {
    console.warn('Save employees internal DB error:', e)
    return 0
  }
}

/**
 * Tự động đồng bộ Lịch phân ca từ iPOS Cloud vào CSDL nội bộ
 */
async function persistIposSchedulesToDb(items: MappedIposSchedule[]): Promise<number> {
  if (!items || items.length === 0) return 0
  try {
    const db = await getServerDb()
    if (!db.shifts) db.shifts = []
    let updatedCount = 0

    items.forEach((item) => {
      const idx = db.shifts.findIndex(
        (s) => s.id === item.id || (s.employee_id === item.employee_id && s.date === item.date && s.shift_id === item.shift_id)
      )
      const serverShift: ServerShiftRegistration = {
        id: item.id,
        employee_id: item.employee_id,
        employee_name: item.employee_name,
        store_id: item.store_id,
        week_start_date: item.week_start_date || item.date,
        date: item.date,
        shift_id: item.shift_id,
        shift_name: item.shift_name,
        status: item.status,
        created_at: item.created_at || new Date().toISOString(),
      }
      if (idx >= 0) {
        db.shifts[idx] = { ...db.shifts[idx], ...serverShift }
        updatedCount++
      } else {
        db.shifts.push(serverShift)
        updatedCount++
      }
    })

    if (updatedCount > 0) {
      await saveServerDb(db)
    }
    return updatedCount
  } catch (e) {
    console.warn('Save schedules internal DB error:', e)
    return 0
  }
}

// Khởi chạy bộ đồng bộ ngầm toàn diện tự động mỗi 10 phút trên máy chủ
ensureIposBackgroundSyncDaemon(async () => {
  const db = await getServerDb()
  if (!isIposMasterEnabled(db)) {
    return
  }

  const now = new Date()
  const yearMonth = now.toISOString().slice(0, 7)
  const fromDate = `${yearMonth}-01`
  const toDate = `${yearMonth}-31`

  let attendanceSyncedCount = 0
  let employeesSyncedCount: number | undefined
  let shiftsSyncedCount: number | undefined

  // 1. Tự động đồng bộ Chấm công (Timesheet) nếu công tắc Chấm công đang BẬT
  if (isIposModuleEnabled(db, 'attendance')) {
    const res = await fetchIposTimesheet({
      storeId: 'ALL',
      fromDate,
      toDate,
      forceRefresh: true,
    })
    if (res.success && !res.isFallback && res.data.length > 0) {
      await persistIposAttendanceToDb(res.data)
      attendanceSyncedCount = res.data.length
    }
  }

  // 2. Tự động đồng bộ Nhân sự (Employees) nếu công tắc Nhân sự đang BẬT
  if (isIposModuleEnabled(db, 'employees')) {
    const empRes = await fetchIposEmployees()
    if (empRes.success && !empRes.isFallback && empRes.data.length > 0) {
      await persistIposEmployeesToDb(empRes.data)
      employeesSyncedCount = empRes.data.length
    }
  }

  // 3. Tự động đồng bộ Lịch phân ca (Work Schedules) nếu công tắc Lịch ca đang BẬT
  if (isIposModuleEnabled(db, 'shifts')) {
    const schedRes = await fetchIposWorkSchedule({
      storeId: 'ALL',
      fromDate,
      toDate,
    })
    if (schedRes.success && !schedRes.isFallback && schedRes.data.length > 0) {
      await persistIposSchedulesToDb(schedRes.data)
      shiftsSyncedCount = schedRes.data.length
    }
  }

  // Phát thông báo đa kênh (Quả chuông In-App + Telegram/Zalo) khi có đồng bộ thực tế
  if (attendanceSyncedCount > 0) {
    await sendIposSyncAlert({
      attendanceCount: attendanceSyncedCount,
      employeesCount: employeesSyncedCount,
      shiftsCount: shiftsSyncedCount,
      storeName: 'Tất cả chi nhánh',
      triggerType: 'auto',
    })
  }
})

export async function GET(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('store_id')
    const date = searchParams.get('date')
    const month = searchParams.get('month') || searchParams.get('period')
    // Nhân viên thường chỉ xem chấm công của chính mình
    const employeeId = hasRequiredRole(gate.user.role, OPERATOR_ROLES)
      ? searchParams.get('employee_id')
      : gate.user.userId
    const fromDateParam = searchParams.get('from_date')
    const toDateParam = searchParams.get('to_date')
    const forceRefresh = searchParams.get('force') === '1' || searchParams.get('forceRefresh') === 'true'

    // Xác định khoảng thời gian truy vấn cho iPOS Cloud
    let fromDate = fromDateParam || date
    let toDate = toDateParam || date

    if (!fromDate && month) {
      fromDate = `${month}-01`
      toDate = `${month}-31`
    }

    const db = await getServerDb()
    const useIposAttendance = isIposModuleEnabled(db, 'attendance')

    let list: Array<ServerAttendanceLog | MappedIposAttendance> = []
    let dataSource = 'homies_native'
    let syncedFromIposCount = 0

    if (useIposAttendance) {
      // 1. Thử tải dữ liệu chấm công trực tiếp từ iPOS Cloud khi công tắc Chấm công đang BẬT
      const iposRes = await fetchIposTimesheet({
        storeId,
        fromDate,
        toDate,
        forceRefresh,
      })

      if (iposRes.success && !iposRes.isFallback && iposRes.data.length > 0) {
        list = iposRes.data
        dataSource = 'ipos_cloud'
        syncedFromIposCount = iposRes.data.length

        if (forceRefresh) {
          await persistIposAttendanceToDb(iposRes.data)
          sendIposSyncAlert({
            attendanceCount: iposRes.data.length,
            period: `${fromDate} đến ${toDate}`,
            storeName: storeId || 'ALL',
            triggerType: 'manual',
          }).catch(() => {})
        } else {
          persistIposAttendanceToDb(iposRes.data).catch(() => {})
        }
      } else {
        // 2. Cơ chế Dự phòng An toàn (Fallback): Đọc từ CSDL nội bộ đã đồng bộ từ iPOS
        list = db.attendance || []
        dataSource = 'internal_db'
      }
    } else {
      // Chế độ Homies Tự Vận Hành: Không gọi iPOS
      list = db.attendance || []
      dataSource = 'homies_native'
    }

    if (storeId && storeId !== 'ALL') {
      list = list.filter((a) => a.store_id === storeId)
    }

    if (fromDate) {
      list = list.filter((a) => a.date >= fromDate)
    }

    if (toDate) {
      list = list.filter((a) => a.date <= toDate)
    }

    if (date) {
      list = list.filter((a) => a.date === date)
    }

    if (month) {
      list = list.filter((a) => a.date.startsWith(month))
    }

    if (employeeId) {
      list = list.filter((a) => a.employee_id === employeeId)
    }

    const effectiveSyncedCount = useIposAttendance
      ? (syncedFromIposCount > 0 ? syncedFromIposCount : list.length)
      : 0

    return NextResponse.json({
      success: true,
      source: dataSource,
      synced_from_ipos_count: effectiveSyncedCount,
      auto_sync: getIposAutoSyncStatus(),
      count: list.length,
      data: list,
    })
  } catch (error: unknown) {
    console.error('[api/attendance]', error)
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAuth(req)
  if (!gate.ok) return gate.response
  try {
    const rawBody = await req.json()
    const db = await getServerDb()
    if (!db.attendance) db.attendance = []

    // Quản lý/trưởng ca được ghi công thủ công cho nhân sự chi nhánh mình.
    // Nhân viên chỉ chấm công cho chính mình, giờ lấy theo máy chủ, không tự khai giờ/số giờ công/trạng thái.
    const isOperator = hasRequiredRole(gate.user.role, OPERATOR_ROLES)
    let body = rawBody
    if (isOperator) {
      const targetEmp = db.employees.find((e) => e.id === rawBody?.employee_id)
      if (targetEmp && !canAccessStore(gate.user, targetEmp.store_id) && targetEmp.id !== gate.user.userId) {
        return NextResponse.json({ success: false, error: 'Bạn không quản lý nhân sự này.' }, { status: 403 })
      }
    } else {
      if (rawBody?.employee_id && rawBody.employee_id !== gate.user.userId) {
        return NextResponse.json({ success: false, error: 'Bạn chỉ được chấm công cho chính mình.' }, { status: 403 })
      }
      body = { ...rawBody, employee_id: gate.user.userId }
      for (const k of ['check_in_time', 'check_out_time', 'total_hours', 'late_minutes', 'status', 'date', 'id', 'shift_start_time', 'shift_end_time']) {
        delete (body as Record<string, unknown>)[k]
      }
      if (rawBody?.status === 'check_out') body.status = 'check_out'
    }
    const settings = normalizeOperationSettings(db.operation_settings).attendance
    const clock = getVnClock()
    const storeNameOf = (storeId?: string) =>
      db.stores.find((s) => s.id === storeId)?.name ||
      (storeId === 'store-002' ? 'Homies Milk Tea - Đường 429' : 'Homies Milk Tea - Hồ Bá Phấn')
    // Nhân viên tự chấm (kể cả quản lý tự chấm cho mình) phải có mặt tại quán: mã QR + bán kính GPS.
    // Quản lý ghi công hộ người khác (sửa công thủ công) thì không cần.
    const isSelfAction = !isOperator || body.employee_id === gate.user.userId
    if (isOperator && isSelfAction) {
      // Quản lý tự chấm công cho mình cũng lấy giờ máy chủ như mọi người.
      body = { ...body }
      for (const k of ['check_in_time', 'check_out_time', 'total_hours', 'late_minutes', 'date', 'shift_id']) {
        delete (body as Record<string, unknown>)[k]
      }
    }
    const canOverride = isOperator && !isSelfAction
    const requirePresence = (storeId: string | undefined) => {
      if (!isSelfAction) return null
      const store = db.stores.find((s) => s.id === storeId)
      if (!store) return NextResponse.json({ success: false, error: 'Không xác định được cơ sở để chấm công.' }, { status: 400 })
      const check = verifyStorePresence(store, body.qr_code, body.latitude ?? body.check_out_lat ?? body.check_in_lat, body.longitude ?? body.check_out_lng ?? body.check_in_lng)
      if (!check.ok) return NextResponse.json({ success: false, error: check.error }, { status: 400 })
      return null
    }

    // 1. Xử lý ghi nhận Tan ca / Check-out
    if (body.status === 'check_out' || body.action === 'check_out' || body.type === 'check_out') {
      const empId = body.employee_id
      if (!empId) {
        return NextResponse.json({ success: false, error: 'Thiếu mã nhân sự employee_id' }, { status: 400 })
      }
      const emp = db.employees.find((e) => e.id === empId)
      const targetDate = body.date || clock.date
      const outTime = body.check_out_time || clock.iso
      const outMs = new Date(outTime).getTime()
      const outLat = Number(body.check_out_lat ?? body.latitude ?? 0)
      const outLng = Number(body.check_out_lng ?? body.longitude ?? 0)

      // Tìm lượt VÀO CA ĐANG MỞ (chưa tan ca) gần nhất — không lấy bừa bản ghi đầu tiên trong ngày,
      // để ca gãy (2 ca/ngày) không bị ca sau ghi đè ca trước. Cho phép ca qua đêm (bản ghi hôm trước).
      const prevDate = new Date(Date.parse(`${targetDate}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10)
      let existingIdx = -1
      if (body.attendance_id) {
        existingIdx = db.attendance.findIndex((a) => a.id === body.attendance_id && a.employee_id === empId)
      }
      if (existingIdx < 0) {
        let bestMs = -Infinity
        db.attendance.forEach((a, idx) => {
          if (a.employee_id !== empId || a.check_out_time) return
          if (a.date !== targetDate && a.date !== prevDate) return
          const inMs = new Date(a.check_in_time).getTime()
          if (Number.isFinite(inMs) && inMs <= outMs && inMs > bestMs) {
            bestMs = inMs
            existingIdx = idx
          }
        })
      }

      const presenceError = requirePresence(existingIdx >= 0 ? db.attendance[existingIdx].store_id : body.store_id || emp?.store_id)
      if (presenceError) return presenceError

      if (existingIdx >= 0) {
        const record = db.attendance[existingIdx]
        const targetShiftId = (canOverride && body.shift_id) || record.shift_id
        const range = targetShiftId ? getShiftTimeRange(targetShiftId, db.shift_templates) : null
        const inMs = new Date(record.check_in_time).getTime()
        const checkInMin = getVnClock(new Date(inMs)).minutesOfDay
        const checkOutMin = checkInMin + Math.max(0, Math.round((outMs - inMs) / 60_000))
        const shiftEndMin = range ? (range.endMin <= range.startMin ? range.endMin + 1440 : range.endMin) : null
        const earlyMinutes = shiftEndMin !== null ? Math.max(0, shiftEndMin - checkOutMin) : 0
        const isEarly = earlyMinutes > 0
        const paidMinutes = computePaidMinutes(
          { checkInMin, checkOutMin, shiftStartMin: range?.startMin ?? null, shiftEndMin },
          settings
        )
        // Quản lý sửa công thủ công được nhập thẳng số giờ; còn lại tính theo Cài đặt giờ công.
        const finalHours =
          canOverride && body.total_hours !== undefined ? Number(body.total_hours) : minutesToHours(paidMinutes)

        db.attendance[existingIdx] = {
          ...record,
          shift_id: targetShiftId,
          check_out_time: outTime,
          check_out_lat: outLat,
          check_out_lng: outLng,
          status: 'check_out',
          is_early: isEarly,
          early_minutes: earlyMinutes,
          total_hours: finalHours,
        }
        await saveServerDb(db)

        return NextResponse.json({
          success: true,
          message: isEarly
            ? `Ghi nhận tan ca thành công (Về sớm ${earlyMinutes} phút - tính giờ công thực tế)`
            : 'Ghi nhận tan ca / check-out thành công',
          data: db.attendance[existingIdx],
        })
      }

      // Không có lượt vào ca đang mở: tạo bản ghi tan ca, không tự cộng công
      // (chỉ quản lý được nhập số giờ thủ công).
      const calculatedHours = canOverride && body.total_hours ? Number(body.total_hours) : 0
      const storeId = body.store_id || emp?.store_id || 'store-001'
      const checkOutLog: ServerAttendanceLog = {
        id: body.id || `att-out-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        employee_id: empId,
        employee_name: emp?.full_name || body.employee_name || 'Nhân sự',
        store_id: storeId,
        store_name: body.store_name || storeNameOf(storeId),
        shift_id: canOverride ? body.shift_id : undefined,
        check_in_time: (canOverride && body.check_in_time) || outTime,
        check_out_time: outTime,
        check_in_lat: outLat,
        check_in_lng: outLng,
        check_out_lat: outLat,
        check_out_lng: outLng,
        check_in_distance_meters: Number(body.check_in_distance_meters || 0),
        status: 'check_out',
        is_early: false,
        early_minutes: 0,
        late_minutes: 0,
        total_hours: calculatedHours,
        qr_code: body.qr_code,
        date: targetDate,
      }

      db.attendance.unshift(checkOutLog)
      await saveServerDb(db)

      return NextResponse.json({
        success: true,
        message: 'Ghi nhận tan ca (không tìm thấy lượt vào ca đang mở — cần quản lý bổ sung giờ vào)',
        data: checkOutLog,
      })
    }

    // 2. Xử lý ghi nhận Vào ca / Check-in thông thường
    const empId = body.employee_id
    if (!empId) {
      return NextResponse.json({ success: false, error: 'Thiếu mã nhân sự employee_id' }, { status: 400 })
    }
    const emp = db.employees.find((e) => e.id === empId)
    const storeId = body.store_id || emp?.store_id || 'store-001'
    const presenceError = requirePresence(storeId)
    if (presenceError) return presenceError

    const checkInTime = body.check_in_time || clock.iso
    const checkInDate = new Date(checkInTime)
    const inClock = getVnClock(checkInDate)
    const targetDate = body.date || inClock.date

    // 2a. CHỐNG BẤM ĐÚP: chỉ chặn khi còn một lượt vào ca CHƯA tan ca trong 15 phút gần đây.
    // Đã tan ca rồi (đổi ca, sai ca) thì được vào ca lại ngay.
    const recentCheckin = db.attendance.find((a) => {
      if (a.employee_id !== empId || a.date !== targetDate || a.check_out_time) return false
      const prevTime = new Date(a.check_in_time).getTime()
      return Math.abs(checkInDate.getTime() - prevTime) < 15 * 60 * 1000
    })
    if (recentCheckin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bạn vừa vào ca cách đây ít hơn 15 phút. Vui lòng không bấm liên tiếp để tránh bị tính trùng công.',
          debounced: true,
          data: recentCheckin,
        },
        { status: 400 }
      )
    }

    // 2b. Tìm ca theo LỊCH ĐÃ CHỐT (lịch rảnh chỉ là dự phòng) và giờ Việt Nam
    let targetShiftId: string | undefined = canOverride ? body.shift_id : undefined
    let scheduleSource: 'official' | 'availability' | 'none' = 'none'
    if (targetShiftId) {
      const isOfficial = (db.official_schedules || []).some(
        (s) => s.employee_id === empId && s.date === targetDate && s.shift_id === targetShiftId && s.status === 'published'
      )
      scheduleSource = isOfficial ? 'official' : 'availability'
    } else {
      const picked = resolveShiftForCheckin(db, empId, targetDate, inClock.minutesOfDay)
      if (picked) {
        targetShiftId = picked.shift_id
        scheduleSource = picked.source
      }
    }
    const offSchedule = scheduleSource !== 'official'
    if (offSchedule && isSelfAction && !settings.allow_off_schedule_checkin) {
      return NextResponse.json(
        { success: false, error: 'Bạn không có ca trong lịch đã chốt hôm nay. Vui lòng liên hệ quản lý.' },
        { status: 400 }
      )
    }

    let lateMinutes = 0
    if (targetShiftId) {
      const range = getShiftTimeRange(targetShiftId, db.shift_templates)
      lateMinutes = computeLateMinutes(inClock.minutesOfDay, range.startMin)
    } else if (canOverride) {
      lateMinutes = Number(body.late_minutes || 0)
    }
    const isLate = isLateBeyondGrace(lateMinutes, settings)
    const status: 'on_time' | 'late' = isLate ? 'late' : 'on_time'
    const empName = emp?.full_name || body.employee_name || 'Nhân sự'

    const newLog: ServerAttendanceLog = {
      id: body.id || `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      employee_id: empId,
      employee_name: empName,
      store_id: storeId,
      store_name: body.store_name || storeNameOf(storeId),
      shift_id: targetShiftId,
      check_in_time: checkInTime,
      check_in_lat: Number(body.check_in_lat ?? body.latitude ?? 0),
      check_in_lng: Number(body.check_in_lng ?? body.longitude ?? 0),
      check_in_distance_meters: Number(body.check_in_distance_meters || 0),
      status,
      is_late: isLate,
      late_minutes: lateMinutes,
      qr_code: body.qr_code,
      date: targetDate,
      schedule_source: scheduleSource,
      off_schedule: offSchedule,
    }

    db.attendance.unshift(newLog)

    // 2c. Ghi vi phạm vào Sổ lỗi KPI. KHÔNG tự sửa/tạo phiếu lương ở đây:
    // tiền trừ đi trễ (nếu có) do Cài đặt lương quyết định khi bấm "Tính lương",
    // tránh phạt 2 lần và tránh phiếu lương nháp làm sai trang Bảng lương.
    if (isLate) {
      if (!db.incidents) db.incidents = []
      db.incidents.unshift({
        id: `inc-att-${empId}-${Date.now()}`,
        store_id: newLog.store_id,
        employee_id: empId,
        employee_name: empName,
        occurred_at: checkInTime,
        source: 'attendance',
        status: 'confirmed',
        violation_code: 'attendance_late',
        reason: `Đi trễ ${lateMinutes} phút (vượt ngưỡng ${settings.late_grace_minutes} phút)`,
        description: `Nhân viên ${empName} đi trễ ${lateMinutes} phút ngày ${targetDate}. Tiền trừ (nếu có) tính theo Cài đặt lương khi tính lương.`,
        penalty_amount: 0,
        evidence_refs: [newLog.id],
        created_at: checkInTime,
      })
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: isLate
        ? `Ghi nhận chấm công (Đi trễ ${lateMinutes} phút - đã ghi vào Sổ lỗi KPI)`
        : offSchedule
          ? 'Ghi nhận chấm công (ngoài lịch đã chốt - chờ quản lý xác nhận)'
          : 'Ghi nhận chấm công thành công',
      data: newLog,
    })
  } catch (error: unknown) {
    console.error('[api/attendance]', error)
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 })
  }
}
