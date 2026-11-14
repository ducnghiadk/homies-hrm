import { NextRequest, NextResponse } from 'next/server'
import {
  getServerDb,
  saveServerDb,
  ServerAttendanceLog,
  ServerEmployee,
  ServerShiftRegistration,
} from '@/lib/server/db'
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
  const now = new Date()
  const yearMonth = now.toISOString().slice(0, 7)
  const fromDate = `${yearMonth}-01`
  const toDate = `${yearMonth}-31`

  // 1. Tự động đồng bộ Chấm công (Timesheet)
  const res = await fetchIposTimesheet({
    storeId: 'ALL',
    fromDate,
    toDate,
    forceRefresh: true,
  })
  if (res.success && !res.isFallback && res.data.length > 0) {
    await persistIposAttendanceToDb(res.data)
  }

  // 2. Tự động đồng bộ Nhân sự (Employees)
  const empRes = await fetchIposEmployees()
  if (empRes.success && !empRes.isFallback && empRes.data.length > 0) {
    await persistIposEmployeesToDb(empRes.data)
  }

  // 3. Tự động đồng bộ Lịch phân ca (Work Schedules)
  const schedRes = await fetchIposWorkSchedule({
    storeId: 'ALL',
    fromDate,
    toDate,
  })
  if (schedRes.success && !schedRes.isFallback && schedRes.data.length > 0) {
    await persistIposSchedulesToDb(schedRes.data)
  }

  // Phát thông báo đa kênh (Quả chuông In-App + Telegram/Zalo)
  if (res.success && !res.isFallback && res.data.length > 0) {
    await sendIposSyncAlert({
      attendanceCount: res.data.length,
      employeesCount: empRes.success ? empRes.data.length : undefined,
      shiftsCount: schedRes.success ? schedRes.data.length : undefined,
      storeName: 'Tất cả chi nhánh',
      triggerType: 'auto',
    })
  }
})

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('store_id')
    const date = searchParams.get('date')
    const month = searchParams.get('month') || searchParams.get('period')
    const employeeId = searchParams.get('employee_id')
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

    // 1. Thử tải dữ liệu chấm công trực tiếp từ iPOS Cloud
    const iposRes = await fetchIposTimesheet({
      storeId,
      fromDate,
      toDate,
      forceRefresh,
    })

    let list: Array<ServerAttendanceLog | MappedIposAttendance> = []
    let dataSource = 'ipos_cloud'
    let syncedFromIposCount = 0

    if (iposRes.success && !iposRes.isFallback && iposRes.data.length > 0) {
      list = iposRes.data
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
      // 2. Cơ chế Dự phòng An toàn (Fallback): Đọc từ CSDL nội bộ
      const db = await getServerDb()
      list = db.attendance || []
      dataSource = 'internal_db'
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

    return NextResponse.json({
      success: true,
      source: dataSource,
      synced_from_ipos_count: syncedFromIposCount,
      auto_sync: getIposAutoSyncStatus(),
      count: list.length,
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
    if (!db.attendance) db.attendance = []
    const { getShiftTimeRange, calculateLatePenaltyAmount, parseTimeToMinutes } = await import('@/lib/server/db')

    // 1. Xử lý ghi nhận Tan ca / Check-out
    if (body.status === 'check_out' || body.action === 'check_out' || body.type === 'check_out') {
      const empId = body.employee_id
      if (!empId) {
        return NextResponse.json({ success: false, error: 'Thiếu mã nhân sự employee_id' }, { status: 400 })
      }
      const targetDate = body.date || new Date().toISOString().slice(0, 10)
      const outTime = body.check_out_time || new Date().toISOString()
      const outLat = Number(body.check_out_lat || body.check_in_lat || 10.822435)
      const outLng = Number(body.check_out_lng || body.check_in_lng || 106.762649)

      // Tìm bản ghi chấm công trong ngày của nhân sự này
      const existingIdx = db.attendance.findIndex(
        (a) => a.employee_id === empId && a.date === targetDate
      )

      // Xác định ca làm việc để đối soát giờ về sớm
      let targetShiftId = body.shift_id || (existingIdx >= 0 ? db.attendance[existingIdx].shift_id : undefined)
      if (!targetShiftId && db.shifts) {
        const registered = db.shifts.find(
          (s) => s.employee_id === empId && s.date === targetDate && s.status !== 'REJECTED'
        )
        if (registered) targetShiftId = registered.shift_id
      }

      let isEarly = false
      let earlyMinutes = 0
      let effectiveEndTime = body.shift_end_time
      if (!effectiveEndTime && targetShiftId) {
        const range = getShiftTimeRange(targetShiftId, db.shift_templates)
        effectiveEndTime = range.endStr
      }

      if (effectiveEndTime) {
        const outMinutes = parseTimeToMinutes(outTime)
        const endMinutes = parseTimeToMinutes(effectiveEndTime)
        const diff = endMinutes - outMinutes
        if (diff > 0) {
          earlyMinutes = diff
          isEarly = true
        }
      }

      if (existingIdx >= 0) {
        const inTime = new Date(db.attendance[existingIdx].check_in_time).getTime()
        const calculatedHours = Math.round(((new Date(outTime).getTime() - inTime) / (1000 * 60 * 60)) * 100) / 100
        // Nếu về sớm ➔ tính theo giờ công thực tế, không tính tròn cả ca
        const finalHours = isEarly
          ? (calculatedHours > 0 ? calculatedHours : 0)
          : (body.total_hours !== undefined ? Number(body.total_hours) : (calculatedHours > 0 ? calculatedHours : 8))

        db.attendance[existingIdx] = {
          ...db.attendance[existingIdx],
          shift_id: targetShiftId || db.attendance[existingIdx].shift_id,
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
            ? `Ghi nhận tan ca thành công (Về sớm ${earlyMinutes} phút - trừ giờ công thực tế)`
            : 'Ghi nhận tan ca / check-out thành công',
          data: db.attendance[existingIdx],
        })
      }

      // Nếu chưa có check-in trước đó, tạo bản ghi tan ca mới
      const emp = db.employees.find((e) => e.id === empId)
      const calculatedHours = body.total_hours ? Number(body.total_hours) : (isEarly ? 7 : 8)
      const checkOutLog: ServerAttendanceLog = {
        id: body.id || `att-out-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        employee_id: empId,
        employee_name: emp?.full_name || body.employee_name || 'Nhân sự',
        store_id: body.store_id || emp?.store_id || 'store-001',
        store_name: body.store_name || (body.store_id === 'store-002' ? 'Homies Milk Tea - Đường 429' : 'Homies Milk Tea - Hồ Bá Phấn'),
        shift_id: targetShiftId,
        check_in_time: body.check_in_time || outTime,
        check_out_time: outTime,
        check_in_lat: outLat,
        check_in_lng: outLng,
        check_out_lat: outLat,
        check_out_lng: outLng,
        check_in_distance_meters: Number(body.check_in_distance_meters || 15),
        status: 'check_out',
        is_early: isEarly,
        early_minutes: earlyMinutes,
        late_minutes: 0,
        total_hours: calculatedHours,
        qr_code: body.qr_code,
        date: targetDate,
      }

      db.attendance.unshift(checkOutLog)
      await saveServerDb(db)

      return NextResponse.json({
        success: true,
        message: isEarly
          ? `Ghi nhận tan ca thành công (Về sớm ${earlyMinutes} phút - trừ giờ công thực tế)`
          : 'Ghi nhận tan ca / check-out thành công',
        data: checkOutLog,
      })
    }

    // 2. Xử lý ghi nhận Vào ca / Check-in thông thường
    const empId = body.employee_id
    if (!empId) {
      return NextResponse.json({ success: false, error: 'Thiếu mã nhân sự employee_id' }, { status: 400 })
    }

    const checkInTime = body.check_in_time || new Date().toISOString()
    const checkInDate = new Date(checkInTime)
    const targetDate = body.date || checkInTime.slice(0, 10)

    // 2a. CHẶN CHECK-IN ĐÚP (DE-BOUNCE): Trong cùng 1 ngày, nếu đã bấm trong vòng 15 phút thì từ chối
    const recentCheckin = db.attendance.find((a) => {
      if (a.employee_id !== empId || a.date !== targetDate) return false
      const prevTime = new Date(a.check_in_time).getTime()
      const diffMs = Math.abs(checkInDate.getTime() - prevTime)
      return diffMs < 15 * 60 * 1000 // trong vòng 15 phút
    })

    if (recentCheckin) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bạn vừa thực hiện chấm công cách đây ít hơn 15 phút. Vui lòng không bấm liên tiếp để tránh bị tính trùng công.',
          debounced: true,
          data: recentCheckin,
        },
        { status: 400 }
      )
    }

    // 2b. BẮT ĐI TRỄ TỰ ĐỘNG (> 15 PHÚT)
    let targetShiftId = body.shift_id
    if (!targetShiftId && db.shifts) {
      const registered = db.shifts.find(
        (s) => s.employee_id === empId && s.date === targetDate && s.status !== 'REJECTED'
      )
      if (registered) targetShiftId = registered.shift_id
    }

    let effectiveStartTime = body.shift_start_time
    if (!effectiveStartTime && targetShiftId) {
      const range = getShiftTimeRange(targetShiftId, db.shift_templates)
      effectiveStartTime = range.startStr
    }

    let lateMinutes = Number(body.late_minutes || 0)
    let isLate = false
    let status: 'on_time' | 'late' = body.status || 'on_time'

    if (effectiveStartTime) {
      const inMinutes = parseTimeToMinutes(checkInTime)
      const startMinutes = parseTimeToMinutes(effectiveStartTime)
      const diff = inMinutes - startMinutes
      if (diff > 0) {
        lateMinutes = diff
        if (lateMinutes > 15) {
          status = 'late'
          isLate = true
        }
      }
    } else if (lateMinutes > 15) {
      status = 'late'
      isLate = true
    }

    const emp = db.employees.find((e) => e.id === empId)
    const empName = emp?.full_name || body.employee_name || 'Nhân sự'

    const newLog: ServerAttendanceLog = {
      id: body.id || `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      employee_id: empId,
      employee_name: empName,
      store_id: body.store_id || emp?.store_id || 'store-001',
      store_name: body.store_name || (body.store_id === 'store-002' ? 'Homies Milk Tea - Đường 429' : 'Homies Milk Tea - Hồ Bá Phấn'),
      shift_id: targetShiftId,
      check_in_time: checkInTime,
      check_in_lat: Number(body.check_in_lat || 10.822435),
      check_in_lng: Number(body.check_in_lng || 106.762649),
      check_in_distance_meters: Number(body.check_in_distance_meters || 15),
      status,
      is_late: isLate,
      late_minutes: lateMinutes,
      qr_code: body.qr_code,
      date: targetDate,
    }

    db.attendance.unshift(newLog)

    // 2c. KẾT NỐI SỐ PHÚT TRỄ VÀO SỔ LỖI KPI & BẢNG LƯƠNG
    if (isLate) {
      if (!db.incidents) db.incidents = []
      const penaltyAmount = calculateLatePenaltyAmount(lateMinutes)
      const incidentId = `inc-att-${empId}-${Date.now()}`

      // Tự động sinh 1 vi phạm vào Sổ lỗi KPI
      db.incidents.unshift({
        id: incidentId,
        store_id: newLog.store_id,
        employee_id: empId,
        employee_name: empName,
        occurred_at: checkInTime,
        source: 'attendance',
        status: 'confirmed',
        violation_code: 'attendance_late',
        reason: `Đi trễ ${lateMinutes} phút (vượt quá 15 phút quy định)`,
        description: `Lỗi kỷ luật chấm công: Nhân viên ${empName} đi trễ ${lateMinutes} phút trong ca làm việc ngày ${targetDate}`,
        penalty_amount: penaltyAmount,
        evidence_refs: [newLog.id],
        created_at: checkInTime,
      })

      // Đẩy số tiền phạt tương ứng vào cột late_deduction trên bảng lương
      const period = targetDate.slice(0, 7)
      if (!db.salary_slips) db.salary_slips = []
      const slipIdx = db.salary_slips.findIndex(
        (s) => s.employee_id === empId && s.period === period
      )
      if (slipIdx >= 0) {
        const slip = db.salary_slips[slipIdx]
        slip.late_deduction = (slip.late_deduction || 0) + penaltyAmount
        slip.deductions = (slip.deductions || 0) + penaltyAmount
        slip.net_salary = Math.max(0, (slip.net_salary || 0) - penaltyAmount)
      } else {
        db.salary_slips.push({
          id: `slip-${period}-${empId}`,
          employee_id: empId,
          employee_name: empName,
          employee_code: emp?.employee_code || 'NV0000',
          position: emp?.department_name || 'Nhân viên',
          store_id: newLog.store_id,
          period,
          work_days: 1,
          standard_days: 26,
          base_salary: emp?.base_salary || 0,
          allowances: 0,
          bonus: 0,
          deductions: penaltyAmount,
          late_deduction: penaltyAmount,
          net_salary: Math.max(0, (emp?.base_salary || 0) - penaltyAmount),
          status: 'draft',
        })
      }
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: isLate
        ? `Ghi nhận chấm công (Đi trễ ${lateMinutes} phút - đã chuyển vào Sổ lỗi KPI)`
        : 'Ghi nhận chấm công thành công',
      data: newLog,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
