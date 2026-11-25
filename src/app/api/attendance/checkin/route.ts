import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, ServerAttendanceLog, calculateDistance } from '@/lib/server/db'
import { verifyQrPayload } from '@/lib/security/token-signer'
import { getActiveUser } from '@/lib/server/auth-helper'
import { getVnClock, parseHhmmToMinutes } from '@/lib/time/vn-time'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { employee_id, store_id, latitude, longitude, qr_code, shift_id } = body

    if (!employee_id || !store_id || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thiếu thông tin bắt buộc (employee_id, store_id, latitude, longitude)',
        },
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

    // 3. Tính khoảng cách GPS thực tế từ tọa độ gửi lên tới tọa độ gốc của cửa hàng
    const userLat = Number(latitude)
    const userLng = Number(longitude)
    const distanceMeters = Math.round(
      calculateDistance(userLat, userLng, store.latitude, store.longitude)
    )

    // 3b. Kiểm tra tính hợp lệ của mã QR động chống gian lận
    if (!qr_code || typeof qr_code !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: 'Vui lòng quét mã QR tại quầy bar của quán để hoàn tất chấm công.',
        },
        { status: 400 }
      )
    }

    if (qr_code.startsWith('HOMIES_DYN_')) {
      try {
        // base64url có thể chứa dấu "_" nên tách chữ ký ở dấu "_" cuối cùng
        const match = /^HOMIES_DYN_(.+)_([0-9a-f]{64})$/.exec(qr_code)
        if (match) {
          const payloadBase64 = match[1]
          const clientSignature = match[2]
          const decoded = Buffer.from(payloadBase64, 'base64url').toString('utf-8')

          if (!verifyQrPayload(decoded, clientSignature)) {
            return NextResponse.json(
              {
                success: false,
                error: 'Mã QR không hợp lệ hoặc đã bị can thiệp chữ ký bảo mật.',
              },
              { status: 400 }
            )
          }

          const [tokenStoreId, tokenTimestampStr] = decoded.split(':')
          const tokenTimestamp = Number(tokenTimestampStr)

          if (tokenStoreId && tokenStoreId !== store_id) {
            return NextResponse.json(
              {
                success: false,
                error: 'Mã QR không thuộc cơ sở bạn đang chấm công. Vui lòng quét đúng mã của quán.',
              },
              { status: 400 }
            )
          }

          if (Date.now() - tokenTimestamp > 60000) {
            return NextResponse.json(
              {
                success: false,
                error: 'Mã QR đã hết hạn (chỉ có hiệu lực trong 60 giây). Vui lòng quét mã mới hiển thị tại quầy bar.',
              },
              { status: 400 }
            )
          }
        } else {
          return NextResponse.json(
            { success: false, error: 'Mã QR không đúng định dạng an toàn của hệ thống' },
            { status: 400 }
          )
        }
      } catch {
        return NextResponse.json(
          { success: false, error: 'Mã QR không đúng định dạng an toàn của hệ thống' },
          { status: 400 }
        )
      }
    } else {
      // Mã tĩnh chỉ chấp nhận mã PIN của cửa hàng (mã chi nhánh như "store-001" dễ đoán nên không còn được chấp nhận)
      if (!store.pin_code || qr_code !== store.pin_code) {
        return NextResponse.json(
          {
            success: false,
            error: 'Mã QR không khớp với cơ sở bạn đang chấm công.',
          },
          { status: 400 }
        )
      }
    }

    const allowedRadius = store.checkin_radius_meters || 100

    // 4. Đối soát khoảng cách GPS (Bắt buộc Dual-Verification: Bán kính cho phép <= 100m)
    if (distanceMeters > allowedRadius) {
      return NextResponse.json(
        {
          success: false,
          error: `Vị trí chấm công không hợp lệ: Bạn đang cách ${store.name} ${distanceMeters}m (bán kính cho phép tối đa là ${allowedRadius}m).`,
          distance_meters: distanceMeters,
          allowed_radius_meters: allowedRadius,
          store_name: store.name,
        },
        { status: 400 }
      )
    }

    const now = new Date()
    // Máy chủ Vercel chạy giờ UTC: ngày và phút trong ngày phải quy về giờ Việt Nam
    const vnNow = getVnClock(now)
    const todayStr = vnNow.date

    // 4b. CHẶN CHECK-IN ĐÚP (DE-BOUNCE): Trong vòng 15 phút từ chối bấm liên tiếp
    if (db.attendance && Array.isArray(db.attendance)) {
      const recentCheckin = db.attendance.find((a) => {
        if (a.employee_id !== effectiveEmployeeId || a.date !== todayStr) return false
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
      check_in_lat: userLat,
      check_in_lng: userLng,
      check_in_distance_meters: distanceMeters,
      status,
      is_late: isLate,
      late_minutes: lateMinutes,
      qr_code: qr_code || 'QR_VALIDATED',
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
          : `Chấm công thành công tại ${store.name} (cách ${distanceMeters}m)`,
      data: newLog,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
