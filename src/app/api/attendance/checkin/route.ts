import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { getServerDb, saveServerDb, ServerAttendanceLog, calculateDistance } from '@/lib/server/db'
import { QR_SECRET } from '@/app/api/attendance/qr-token/route'
import { getAuthenticatedUser } from '@/lib/server/auth-helper'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { employee_id, store_id, latitude, longitude, qr_code, shift_start_time, shift_id } = body

    if (!employee_id || !store_id || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Thiếu thông tin bắt buộc (employee_id, store_id, latitude, longitude)',
        },
        { status: 400 }
      )
    }

    // 0. Xác thực tài khoản người chấm công (chống chấm công hộ)
    const auth = await getAuthenticatedUser(req)
    let effectiveEmployeeId = employee_id
    if (auth) {
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
      effectiveEmployeeId = isManager ? (employee_id || auth.userId) : auth.userId
    }

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
        const parts = qr_code.split('_')
        if (parts.length >= 4) {
          const payloadBase64 = parts[2]
          const clientSignature = parts[3]
          const decoded = Buffer.from(payloadBase64, 'base64url').toString('utf-8')

          // Đối soát chữ ký số bí mật HMAC-SHA256
          const expectedSignature = crypto
            .createHmac('sha256', QR_SECRET)
            .update(decoded)
            .digest('hex')
            .substring(0, 12)

          if (clientSignature !== expectedSignature) {
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
      // Hỗ trợ mã QR tĩnh của cơ sở hoặc mã PIN cửa hàng
      if (qr_code !== store_id && qr_code !== store.id && qr_code !== store.pin_code) {
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
    const todayStr = now.toISOString().split('T')[0]

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

    // 5. BẮT ĐI TRỄ TỰ ĐỘNG: So sánh thời gian check-in với start_time của ca
    // Nếu trễ > 15 phút ➔ Bắt buộc set is_late: true, status: 'late' và late_minutes: X
    let status: 'on_time' | 'late' = 'on_time'
    let isLate = false
    let lateMinutes = 0

    // Xác định ca làm việc tương ứng
    let targetShiftId = shift_id
    if (!targetShiftId && db.shifts) {
      const registeredShift = db.shifts.find(
        (s) => s.employee_id === effectiveEmployeeId && s.date === todayStr && s.status !== 'REJECTED'
      )
      if (registeredShift) {
        targetShiftId = registeredShift.shift_id
      }
    }

    const { getShiftTimeRange, calculateLatePenaltyAmount, parseTimeToMinutes } = await import('@/lib/server/db')
    let effectiveStartTime = shift_start_time
    if (!effectiveStartTime && targetShiftId) {
      const range = getShiftTimeRange(targetShiftId, db.shift_templates)
      effectiveStartTime = range.startStr
    }

    if (effectiveStartTime) {
      const inMinutes = parseTimeToMinutes(now.toISOString())
      const startMinutes = parseTimeToMinutes(effectiveStartTime)
      const diff = inMinutes - startMinutes
      if (diff > 0) {
        lateMinutes = diff
        if (lateMinutes > 15) {
          status = 'late'
          isLate = true
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
    }

    db.attendance.push(newLog)

    // 7. KẾT NỐI SỐ PHÚT TRỄ VÀO SỔ LỖI KPI & BẢNG LƯƠNG
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

      // b. Đẩy số tiền phạt tương ứng vào cột late_deduction trên bảng lương
      const period = todayStr.slice(0, 7)
      if (!db.salary_slips) db.salary_slips = []
      const slipIdx = db.salary_slips.findIndex(
        (s) => s.employee_id === effectiveEmployeeId && s.period === period
      )
      if (slipIdx >= 0) {
        const slip = db.salary_slips[slipIdx]
        // Nếu kỳ lương đã chốt và khóa sổ: giữ nguyên số liệu kế toán đã chốt, không tự ý sửa
        if (slip.status !== 'locked') {
          slip.late_deduction = (slip.late_deduction || 0) + penaltyAmount
          slip.deductions = (slip.deductions || 0) + penaltyAmount
          slip.net_salary = Math.max(0, (slip.net_salary || 0) - penaltyAmount)
        }
      } else {
        const emp = db.employees.find((e) => e.id === effectiveEmployeeId)
        db.salary_slips.push({
          id: `slip-${period}-${effectiveEmployeeId}`,
          employee_id: effectiveEmployeeId,
          employee_name: employeeName,
          employee_code: emp?.employee_code || 'NV0000',
          position: emp?.department_name || 'Nhân viên',
          store_id,
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
        ? `Chấm công ghi nhận đi trễ ${lateMinutes} phút (đã chuyển vào Sổ lỗi KPI)`
        : `Chấm công thành công tại ${store.name} (cách ${distanceMeters}m)`,
      data: newLog,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
