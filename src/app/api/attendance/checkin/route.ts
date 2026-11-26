import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, ServerAttendanceLog } from '@/lib/server/db'
import { verifyStorePresence } from '@/lib/server/attendance-schedule'
import { extractClientIp, getStoreCheckinConfig, isIpAllowed } from '@/lib/attendance/checkin-method'
import { getActiveUser } from '@/lib/server/auth-helper'
import { getVnClock, parseHhmmToMinutes } from '@/lib/time/vn-time'

/**
 * GET ?store_id=...: cho trang chấm công biết chi nhánh dùng cách nào và điện thoại
 * có đang ở Wi-Fi quán không (không trả về danh sách địa chỉ mạng của quán).
 */
export async function GET(req: NextRequest) {
  const auth = await getActiveUser(req)
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Bạn cần đăng nhập để chấm công.' }, { status: 401 })
  }
  const storeId = new URL(req.url).searchParams.get('store_id') || ''
  const db = await getServerDb()
  const store = db.stores.find((s) => s.id === storeId)
  if (!store) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy chi nhánh.' }, { status: 404 })
  }
  const config = getStoreCheckinConfig(store)
  const onShopWifi = config.checkin_method !== 'qr' && isIpAllowed(extractClientIp((n) => req.headers.get(n)), config.wifi_public_ips)
  return NextResponse.json({
    success: true,
    data: {
      checkin_method: config.checkin_method,
      require_gps: config.require_gps,
      wifi_configured: config.wifi_public_ips.length > 0,
      on_shop_wifi: onShopWifi,
    },
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { employee_id, store_id, latitude, longitude, qr_code, shift_id } = body

    if (!employee_id || !store_id) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc (employee_id, store_id)' },
        { status: 400 }
      )
    }

    // 0. Bắt buộc đăng nhập để chống chấm công hộ. Chỉ quản lý mới được ghi nhận thay người khác.
    const auth = await getActiveUser(req)
    if (!auth) {
      return NextResponse.json(
        { success: false, error: 'Bạn cần đăng nhập để chấm công.' },
        { status: 401 }
      )
    }
    const isManager = ['ceo', 'hr_admin', 'store_manager', 'area_manager'].includes(auth.role)
    if (!isManager && auth.userId !== employee_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Bạn không thể chấm công hộ cho nhân viên khác. Vui lòng đăng nhập đúng tài khoản của mình.',
        },
        { status: 403 }
      )
    }
    const effectiveEmployeeId: string = isManager ? (employee_id || auth.userId) : auth.userId

    const db = await getServerDb()

    // 1. Tìm thông tin chi nhánh
    const store = db.stores.find((s) => s.id === store_id)
    if (!store) {
      return NextResponse.json(
        { success: false, error: `Chi nhánh '${store_id}' không tồn tại trên hệ thống` },
        { status: 404 }
      )
    }

    // 2. Tìm thông tin nhân viên
    const employee = db.employees.find((e) => e.id === effectiveEmployeeId)
    const employeeName = employee?.full_name || 'Nhân viên Homies'

    // 3. Có mặt tại quán theo cách chấm công của chi nhánh: Wi-Fi quán hoặc mã QR, kèm GPS nếu bật
    const presence = verifyStorePresence(store, qr_code, latitude, longitude, Date.now(), extractClientIp((n) => req.headers.get(n)))
    if (!presence.ok) {
      return NextResponse.json(
        {
          success: false,
          error: presence.error,
          distance_meters: presence.distance,
          allowed_radius_meters: store.checkin_radius_meters || 100,
          store_name: store.name,
        },
        { status: 400 }
      )
    }
    const distanceMeters = presence.distance ?? 0

    const now = new Date()
    // Máy chủ Vercel chạy giờ UTC: ngày và phút trong ngày phải quy về giờ Việt Nam
    const vnNow = getVnClock(now)
    const todayStr = vnNow.date

    // 4b. CHẶN CHECK-IN ĐÚP: chỉ chặn khi còn một lượt vào ca CHƯA tan ca trong 15 phút gần đây.
    // Ca ngắn đã tan ca rồi thì được vào ca tiếp ngay.
    if (db.attendance && Array.isArray(db.attendance)) {
      const recentCheckin = db.attendance.find((a) => {
        if (a.employee_id !== effectiveEmployeeId || a.date !== todayStr || a.check_out_time) return false
        const prevTime = new Date(a.check_in_time).getTime()
        const diffMs = Math.abs(now.getTime() - prevTime)
        return diffMs < 15 * 60 * 1000 // dưới 15 phút
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
    }

    // 5. BẮT ĐI TRỄ TỰ ĐỘNG theo giờ ca trong LỊCH CHÍNH THỨC ĐÃ CHỐT (không tin giờ ca do điện thoại gửi lên)
    // Ngưỡng 15 phút giữ nguyên như trước; quy định phạt do Cài đặt lương quyết định.
    let status: 'on_time' | 'late' = 'on_time'
    let isLate = false
    let lateMinutes = 0

    const { getShiftTimeRange, calculateLatePenaltyAmount } = await import('@/lib/server/db')

    // Ca của nhân viên hôm nay: ưu tiên lịch chính thức đã chốt, nếu tuần chưa chốt thì dùng ca đã đăng ký
    const publishedToday = (db.official_schedules || []).filter(
      (s) => s.employee_id === effectiveEmployeeId && s.date === todayStr && s.status === 'published'
    )
    const registeredToday = (db.shifts || []).filter(
      (s) => s.employee_id === effectiveEmployeeId && s.date === todayStr && s.status !== 'REJECTED'
    )
    const candidateShiftIds = (publishedToday.length > 0 ? publishedToday : registeredToday).map((s) => s.shift_id)
    const offSchedule = publishedToday.length === 0

    // Nhiều ca trong ngày (ca gãy): chọn ca có giờ bắt đầu gần thời điểm chấm công nhất
    let targetShiftId: string | undefined
    if (shift_id && candidateShiftIds.includes(shift_id)) {
      targetShiftId = shift_id
    } else if (candidateShiftIds.length > 0) {
      targetShiftId = candidateShiftIds
        .map((id) => ({ id, start: parseHhmmToMinutes(getShiftTimeRange(id, db.shift_templates).startStr) }))
        .sort((a, b) => Math.abs((a.start ?? 0) - vnNow.minutesOfDay) - Math.abs((b.start ?? 0) - vnNow.minutesOfDay))[0].id
    }

    if (targetShiftId) {
      const startMinutes = parseHhmmToMinutes(getShiftTimeRange(targetShiftId, db.shift_templates).startStr)
      if (startMinutes !== null) {
        const diff = vnNow.minutesOfDay - startMinutes
        if (diff > 0) {
          lateMinutes = diff
          if (lateMinutes > 15) {
            status = 'late'
            isLate = true
          }
        }
      }
    }

    // 6. Ghi nhận log chấm công
    const newLog: ServerAttendanceLog = {
      id: `att-log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      employee_id: effectiveEmployeeId,
      employee_name: employeeName,
      store_id,
      store_name: store.name,
      shift_id: targetShiftId,
      check_in_time: now.toISOString(),
      check_in_lat: Number(latitude) || 0,
      check_in_lng: Number(longitude) || 0,
      check_in_distance_meters: distanceMeters,
      status,
      is_late: isLate,
      late_minutes: lateMinutes,
      qr_code: presence.method === 'wifi' ? 'WIFI_VALIDATED' : (qr_code || 'QR_VALIDATED'),
      date: todayStr,
      off_schedule: offSchedule,
    }

    db.attendance.push(newLog)

    // 7. GHI NHẬN ĐI TRỄ VÀO SỔ LỖI KPI
    if (isLate) {
      if (!db.incidents) db.incidents = []
      const penaltyAmount = calculateLatePenaltyAmount(lateMinutes)
      const incidentId = `inc-att-${effectiveEmployeeId}-${Date.now()}`

      // a. Tự động sinh vi phạm trong Sổ lỗi KPI
      db.incidents.unshift({
        id: incidentId,
        store_id,
        employee_id: effectiveEmployeeId,
        employee_name: employeeName,
        occurred_at: now.toISOString(),
        source: 'attendance',
        status: 'confirmed',
        violation_code: 'attendance_late',
        reason: `Đi trễ ${lateMinutes} phút (vượt quá 15 phút quy định)`,
        description: `Lỗi kỷ luật chấm công: Nhân viên ${employeeName} đi trễ ${lateMinutes} phút trong ca làm việc ngày ${todayStr}`,
        penalty_amount: penaltyAmount,
        evidence_refs: [newLog.id],
        created_at: now.toISOString(),
      })

      // Không tự tạo/sửa phiếu lương ở đây: phiếu lương chỉ sinh ra khi bấm "Tính lương",
      // tiền trừ đi trễ do bộ tính lương áp theo Cài đặt lương.
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: isLate
        ? `Chấm công ghi nhận đi trễ ${lateMinutes} phút (đã chuyển vào Sổ lỗi KPI)`
        : offSchedule
          ? `Đã chấm công tại ${store.name}, nhưng hôm nay bạn không có ca trong lịch đã chốt. Quản lý sẽ kiểm tra lại.`
          : presence.method === 'wifi'
            ? `Chấm công thành công tại ${store.name} qua Wi-Fi quán`
            : `Chấm công thành công tại ${store.name} (cách ${distanceMeters}m)`,
      data: newLog,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
