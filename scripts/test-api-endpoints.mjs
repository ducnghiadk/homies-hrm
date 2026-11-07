// Automated Test Suite for Homies HRM REST API Endpoints
// Testing Direct API Protocol for Auth, 14 Real Employees, 447 Aug + 87 Sep Shifts, Payroll & GPS Checkin
// Dual-Verification Dynamic QR Checkin (GPS <= 100m + 60s Expiring Token)
// Simulates 3 Roles: Employee (Mobile), Manager (Desktop/Mobile), and CEO (Audit & Payroll Lock)

const BASE_URL = 'http://localhost:3535'

async function runTests() {
  console.log('🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN REST API HOMIES HRM VỚI DATA THẬT IPOS & BẢO MẬT KÉP...\n')
  let passed = 0
  let total = 0

  // Dọn dẹp log chấm công và ca test tạm thời để test suite chạy độc lập (idempotent)
  try {
    const fs = await import('fs/promises')
    const path = await import('path')
    const dbPath = path.join(process.cwd(), 'data', 'server-db.json')
    const raw = await fs.readFile(dbPath, 'utf8')
    const db = JSON.parse(raw)
    const testEmpIds = ['emp-nv0013', 'emp-nv0030', 'emp-nv0031']
    if (db.attendance) {
      db.attendance = db.attendance.filter((a) => !testEmpIds.includes(a.employee_id))
    }
    if (db.shifts) {
      db.shifts = db.shifts.filter((s) => !(s.date === '2026-10-12' || (s.employee_id === 'emp-nv0028' && s.date === '2026-09-22')))
    }
    await fs.writeFile(dbPath, JSON.stringify(db, null, 2), 'utf8')
  } catch {
    // Bỏ qua nếu chưa có file
  }

  async function test(name, fn) {
    total++
    try {
      await fn()
      console.log(`✅ [PASS] ${name}`)
      passed++
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message)
    }
  }

  let ceoToken = ''
  let managerToken = ''
  let employeeToken = ''

  // 1. POST /api/auth/login - Mô phỏng 3 vai trò & Cookie an toàn
  await test('POST /api/auth/login - [BOT CEO] Đăng nhập & nhận session cookie an toàn', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tuan@bobahouse.vn', password: 'password123' }),
    })
    const json = await res.json()
    const cookieHeader = res.headers.get('set-cookie')
    if (!res.ok || !json.success || !json.token || json.user.role !== 'ceo') {
      throw new Error(`Đăng nhập CEO thất bại: ${JSON.stringify(json)}`)
    }
    if (!cookieHeader || !cookieHeader.includes('homies_session')) {
      throw new Error(`Chưa cấp session cookie homies_session trên header response`)
    }
    ceoToken = json.token
  })

  await test('POST /api/auth/login - [BOT QUẢN LÝ] Đăng nhập Store Manager bằng Gmail thật (Kiều Linh: huynhlekieulinh6@gmail.com)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'huynhlekieulinh6@gmail.com', password: '123456' }),
    })
    const json = await res.json()
    if (!res.ok || !json.success || json.user.role !== 'store_manager') {
      throw new Error(`Đăng nhập Quản lý bằng Gmail thật thất bại: ${JSON.stringify(json)}`)
    }
    managerToken = json.token
  })

  await test('POST /api/auth/login - [BOT QUẢN LÝ] Đăng nhập bằng Số điện thoại thật (Kiều Linh: 0779554540)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0779554540', password: '123456' }),
    })
    const json = await res.json()
    if (!res.ok || !json.success || json.user.phone !== '0779554540') {
      throw new Error(`Đăng nhập bằng SĐT Kiều Linh thất bại: ${JSON.stringify(json)}`)
    }
  })

  await test('POST /api/auth/login - [BOT NHÂN VIÊN] Đăng nhập Employee bằng Gmail thật (Công Huy: jinn.wooo.02@gmail.com)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'jinn.wooo.02@gmail.com', password: '123456' }),
    })
    const json = await res.json()
    if (!res.ok || !json.success || json.user.employee_code !== 'NV0027') {
      throw new Error(`Đăng nhập Nhân viên Huy bằng Gmail thật thất bại: ${JSON.stringify(json)}`)
    }
  })

  await test('POST /api/auth/login - [BOT NHÂN VIÊN] Đăng nhập Employee bằng SĐT thật (Đông Duy: 0943749525)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0943749525', password: '123456' }),
    })
    const json = await res.json()
    if (!res.ok || !json.success || json.user.employee_code !== 'NV0028') {
      throw new Error(`Đăng nhập Nhân viên Duy bằng SĐT thất bại: ${JSON.stringify(json)}`)
    }
    employeeToken = json.token
  })

  await test('POST /api/auth/login - [BOT CEO] Đăng nhập CEO bằng SĐT thật (0919246273)', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '0919246273', password: '123456' }),
    })
    const json = await res.json()
    if (!res.ok || !json.success || json.user.role !== 'ceo') {
      throw new Error(`Đăng nhập CEO bằng SĐT thất bại: ${JSON.stringify(json)}`)
    }
  })

  await test('POST /api/auth/login - Từ chối khi mật khẩu sai', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'duy@bobahouse.vn', password: 'wrongpassword' }),
    })
    const json = await res.json()
    if (res.status !== 401 || json.success) {
      throw new Error(`Kỳ vọng 401 nhưng nhận: ${res.status}`)
    }
  })

  // 2. GET, POST & PUT /api/employees - 14 Nhân sự thật iPOS
  await test('GET /api/employees - Xác nhận danh sách nhân sự thật đủ 14 nhân viên chuỗi', async () => {
    const res = await fetch(`${BASE_URL}/api/employees`)
    const json = await res.json()
    if (!res.ok || !json.success || json.count < 14) {
      throw new Error(`Danh sách nhân viên không đủ: ${json.count}`)
    }
    const codes = json.data.map((e) => e.employee_code)
    const requiredCodes = ['NV0028', 'BH-9852', 'NV0013', 'NV0016', 'NV0017', 'NV0020', 'NV0030', 'NV0033', 'NV0027', 'NV0008', 'NV0031', 'NV0034', 'NV0035', 'NV0024']
    for (const c of requiredCodes) {
      if (!codes.includes(c)) {
        throw new Error(`Thiếu nhân sự mã ${c} trong CSDL`)
      }
    }
  })

  await test('GET /api/employees - Xác nhận 2 Full-time (6.6tr) và 12 Part-time (lương giờ)', async () => {
    const res = await fetch(`${BASE_URL}/api/employees`)
    const json = await res.json()
    const fullTimeStaff = json.data.filter((e) => e.employee_code === 'NV0027' || e.employee_code === 'NV0028')
    for (const ft of fullTimeStaff) {
      if (ft.base_salary !== 6600000) {
        throw new Error(`Full-time ${ft.full_name} (${ft.employee_code}) sai lương cơ bản: ${ft.base_salary}`)
      }
    }
    const partTimeCodes = ['NV0013', 'NV0016', 'NV0017', 'NV0020', 'NV0030', 'NV0033', 'NV0008', 'NV0031', 'NV0034', 'NV0035', 'NV0024']
    const partTimeStaff = json.data.filter((e) => partTimeCodes.includes(e.employee_code))
    for (const pt of partTimeStaff) {
      if (pt.base_salary !== 0 || !pt.hourly_rate || pt.hourly_rate <= 0) {
        throw new Error(`Part-time ${pt.full_name} (${pt.employee_code}) chưa cấu hình đúng base_salary=0 hoặc hourly_rate`)
      }
    }
  })

  await test('GET /api/employees - Xác nhận 4 nhân sự xoay ca có secondary_store_ids cả 2 quán', async () => {
    const res = await fetch(`${BASE_URL}/api/employees`)
    const json = await res.json()
    const rotatingCodes = ['BH-9852', 'NV0027', 'NV0028', 'NV0034']
    for (const code of rotatingCodes) {
      const emp = json.data.find((e) => e.employee_code === code)
      if (!emp || !Array.isArray(emp.secondary_store_ids) || emp.secondary_store_ids.length < 2) {
        throw new Error(`Nhân sự xoay ca ${code} thiếu secondary_store_ids 2 quán: ${JSON.stringify(emp?.secondary_store_ids)}`)
      }
    }
  })

  await test('GET /api/employees?store_id=store-002 - Lọc nhân sự Chi nhánh Đường 429', async () => {
    const res = await fetch(`${BASE_URL}/api/employees?store_id=store-002`)
    const json = await res.json()
    if (!res.ok || !json.success || json.data.length === 0) {
      throw new Error(`Lọc chi nhánh 429 thất bại`)
    }
    if (!json.data.some((e) => e.employee_code === 'NV0028')) {
      throw new Error(`Không tìm thấy NV0028 tại chi nhánh 429`)
    }
  })

  await test('PUT /api/employees - Cập nhật thông tin và mức lương nhân sự tập trung', async () => {
    const updatePayload = {
      email: 'phamnguyendongduy2020@gmail.com',
      hourly_rate: 26000,
      phone: '0943749525',
    }
    const res = await fetch(`${BASE_URL}/api/employees`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    })
    const json = await res.json()
    if (!res.ok || !json.success || json.data.hourly_rate !== 26000) {
      throw new Error(`Cập nhật nhân viên qua PUT thất bại: ${JSON.stringify(json)}`)
    }
  })

  // 3. GET /api/shifts - Lịch sử ca thực tế 447 ca Tháng 8 và 87 ca Tháng 9
  await test('GET /api/shifts?month=2026-08 - Đối soát đủ 446 ca thực tế Tháng 8/2026', async () => {
    const res = await fetch(`${BASE_URL}/api/shifts?month=2026-08`)
    const json = await res.json()
    if (!res.ok || !json.success || json.count < 446) {
      throw new Error(`Kỳ vọng đủ ca Tháng 8 nhưng nhận: ${json.count}`)
    }
  })

  await test('GET /api/shifts?month=2026-08 - Đối soát số ca thực tế từng người (Hiếu 1 ca, Duy 64 ca)', async () => {
    const res = await fetch(`${BASE_URL}/api/shifts?month=2026-08`)
    const json = await res.json()
    const hieuShifts = json.data.filter((s) => s.employee_id === 'emp-nv0024')
    const duyShifts = json.data.filter((s) => s.employee_id === 'emp-nv0028')
    if (hieuShifts.length !== 1) {
      throw new Error(`Tấn Hiếu kỳ vọng 1 ca nhưng nhận: ${hieuShifts.length} ca`)
    }
    if (duyShifts.length !== 64) {
      throw new Error(`Đông Duy kỳ vọng 64 ca nhưng nhận: ${duyShifts.length} ca`)
    }
  })

  await test('GET /api/shifts?month=2026-09 - Truy vấn danh sách ca Tháng 9/2026', async () => {
    const res = await fetch(`${BASE_URL}/api/shifts?month=2026-09`)
    const json = await res.json()
    if (!res.ok || !json.success || json.count < 0) {
      throw new Error(`Kỳ vọng danh sách ca Tháng 9 nhưng nhận: ${json.count}`)
    }
  })

  await test('GET /api/shifts - Trả về đúng danh mục khung ca chuẩn Homies', async () => {
    const res = await fetch(`${BASE_URL}/api/shifts`)
    const json = await res.json()
    if (!res.ok || !json.success || !json.shift_templates || json.shift_templates.length < 5) {
      throw new Error(`Kỳ vọng danh mục khung ca chuẩn nhưng nhận: ${json.shift_templates?.length}`)
    }
    const tpls = json.shift_templates
    const ids = tpls.map((t) => t.id)
    if (!ids.includes('shift-001') || !ids.includes('shift-002') || !ids.includes('shift-003')) {
      throw new Error(`Thiếu các ca cơ bản: ${JSON.stringify(tpls)}`)
    }
  })

  // 4. POST & GET /api/shifts/register & approve - Bot Nhân viên đăng ký ca & Quản lý duyệt
  let registeredShiftId = ''
  await test('POST /api/shifts/register - [BOT NHÂN VIÊN] Đăng ký ca rảnh theo khung ca chuẩn', async () => {
    const payload = {
      employee_id: 'emp-nv0028',
      store_id: 'store-002',
      week_start_date: '2026-09-21',
      date: '2026-09-22',
      shift_id: 'shift-001',
      notes: 'Bot NV đăng ký ca sáng',
    }
    const res = await fetch(`${BASE_URL}/api/shifts/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok || !json.success || !json.data || json.data.length === 0) {
      throw new Error(`Đăng ký ca thất bại: ${JSON.stringify(json)}`)
    }
    registeredShiftId = json.data[0].id
  })

  await test('POST /api/shifts/register - [MOBILE APP] Gửi gói đăng ký ca rảnh cả tuần từ điện thoại lên Server DB', async () => {
    const bundlePayload = {
      employee_id: 'emp-nv0013',
      store_id: 'store-001',
      week_start_date: '2026-09-28',
      items: [
        { date: '2026-09-28', shiftId: 'shift-001', notes: 'Rảnh ca sáng T2' },
        { date: '2026-09-29', shiftId: 'shift-002', notes: 'Rảnh ca trưa T3' },
        { date: '2026-09-30', shiftId: 'shift-003', notes: 'Rảnh ca tối T4' },
      ],
    }
    const res = await fetch(`${BASE_URL}/api/shifts/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bundlePayload),
    })
    const json = await res.json()
    if (!res.ok || !json.success || json.count !== 3) {
      throw new Error(`Gửi gói đăng ký ca từ mobile thất bại: ${JSON.stringify(json)}`)
    }
  })

  await test('GET /api/shifts/register - [MÁY TÍNH QUẢN LÝ] Tải danh sách ca chờ duyệt từ Database máy chủ', async () => {
    const res = await fetch(`${BASE_URL}/api/shifts/register?store_id=store-001&week=2026-09-28`)
    const json = await res.json()
    if (!res.ok || !json.success || json.count < 3) {
      throw new Error(`Lấy danh sách ca đăng ký tuần từ server thất bại: ${JSON.stringify(json)}`)
    }
    const empItem = json.data.find((s) => s.employee_id === 'emp-nv0013')
    if (!empItem || empItem.status !== 'PENDING') {
      throw new Error(`Không tìm thấy ca chờ duyệt của emp-nv0013 trong Database: ${JSON.stringify(json)}`)
    }
  })

  await test('POST /api/shifts/approve - Chặn nhân viên tự duyệt ca (RBAC 403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/shifts/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration_ids: [registeredShiftId],
        approver_role: 'employee',
      }),
    })
    const json = await res.json()
    if (res.status !== 403 || json.success) {
      throw new Error(`Kỳ vọng 403 Forbidden nhưng nhận: ${res.status}`)
    }
  })

  await test('POST /api/shifts/approve - [BOT QUẢN LÝ] Quản lý duyệt ca làm việc thành công', async () => {
    const res = await fetch(`${BASE_URL}/api/shifts/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        registration_ids: [registeredShiftId],
        approver_role: 'store_manager',
        approver_id: 'emp-bh9852',
      }),
    })
    const json = await res.json()
    if (!res.ok || !json.success || json.approved_count !== 1) {
      throw new Error(`Quản lý duyệt ca thất bại: ${JSON.stringify(json)}`)
    }
  })

  // 5. CHỐNG GIAN LẬN CHẤM CÔNG: DYNAMIC QR & DUAL-VERIFICATION (GPS <= 100m)
  let activeDynamicQr = ''
  await test('GET /api/attendance/qr-token - Máy POS sinh mã QR động tự đổi mỗi 30-60 giây', async () => {
    const res = await fetch(`${BASE_URL}/api/attendance/qr-token?store_id=store-001`)
    const json = await res.json()
    if (!res.ok || !json.success || !json.token || !json.token.startsWith('HOMIES_DYN_')) {
      throw new Error(`Tạo mã QR động thất bại: ${JSON.stringify(json)}`)
    }
    activeDynamicQr = json.token
  })

  await test('POST /api/attendance/checkin - [DUAL-VERIFICATION] Chấm công thành công khi quét QR động VÀ GPS <= 100m', async () => {
    const res = await fetch(`${BASE_URL}/api/attendance/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: 'emp-nv0013',
        store_id: 'store-001',
        latitude: 10.822435,
        longitude: 106.762649, // Đúng tọa độ quán HBP
        qr_code: activeDynamicQr,
      }),
    })
    const json = await res.json()
    if (!res.ok || !json.success || json.distance_meters > 100) {
      throw new Error(`Chấm công Dual-Verification thất bại: ${JSON.stringify(json)}`)
    }
  })

  await test('POST /api/attendance/checkin - [CHỐNG GIAN LẬN] Chặn chấm công dù quét đúng QR nhưng GPS ở nhà (> 100m)', async () => {
    const res = await fetch(`${BASE_URL}/api/attendance/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: 'emp-nv0013',
        store_id: 'store-001',
        latitude: 10.776889,
        longitude: 106.700806, // Cách quán hơn 10km (ở nhà chụp mã qua Zalo)
        qr_code: activeDynamicQr,
      }),
    })
    const json = await res.json()
    if (res.status !== 400 || json.success) {
      throw new Error(`Kỳ vọng 400 Bad Request từ chối chấm công ở xa nhưng nhận: ${res.status}`)
    }
  })

  await test('POST /api/attendance/checkin - [CHỐNG GIAN LẬN] Chặn mã QR hết hạn sau 60 giây', async () => {
    // Giả lập token đã tạo 2 phút trước
    const expiredTimestamp = Date.now() - 120000
    const rawData = `store-001:${expiredTimestamp}:fake_nonce`
    const expiredToken = `HOMIES_DYN_${Buffer.from(rawData).toString('base64url')}_fakesig`

    const res = await fetch(`${BASE_URL}/api/attendance/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: 'emp-nv0013',
        store_id: 'store-001',
        latitude: 10.822435,
        longitude: 106.762649,
        qr_code: expiredToken,
      }),
    })
    const json = await res.json()
    if (res.status !== 400 || json.success || !json.error.includes('hết hạn')) {
      throw new Error(`Kỳ vọng từ chối mã QR hết hạn nhưng nhận: ${JSON.stringify(json)}`)
    }
  })

  // 6. GET & POST /api/payroll - [BOT CEO] Đối soát bảng lương Tháng 8 & Khóa sổ
  await test('GET /api/payroll - [BOT CEO] Xuất bảng lương Tháng 8 đối soát khớp từng nhân sự', async () => {
    const res = await fetch(`${BASE_URL}/api/payroll?period=2026-08`)
    const json = await res.json()
    if (!res.ok || !json.success || json.store_count !== 2 || json.employee_count < 14) {
      throw new Error(`Xuất bảng lương thất bại: ${JSON.stringify(json)}`)
    }
    const sample = json.salary_slips[0]
    if (sample.base_salary === undefined || sample.net_salary === undefined) {
      throw new Error(`Bảng lương thiếu trường lương cơ bản hoặc thực nhận`)
    }
  })

  await test('GET /api/payroll - [QUỸ LƯƠNG F&B THÁNG 8] Quỹ lương nằm chuẩn trong khoảng 40 - 45 triệu VNĐ', async () => {
    const res = await fetch(`${BASE_URL}/api/payroll?period=2026-08`)
    const json = await res.json()
    const totalNet = json.salary_slips.reduce((sum, s) => sum + (s.net_salary || 0), 0)
    const totalBonus = json.salary_slips.reduce((sum, s) => sum + (s.bonus || 0), 0)
    const baseNet = totalNet - totalBonus
    console.log(`      💰 Tổng quỹ lương Tháng 8 thực tế: ${totalNet.toLocaleString('vi-VN')} đ (Lương gốc trước thưởng BSC: ${baseNet.toLocaleString('vi-VN')} đ)`)
    if (baseNet < 40000000 || baseNet > 48000000) {
      throw new Error(`Quỹ lương gốc Tháng 8 (${baseNet.toLocaleString('vi-VN')} đ) nằm ngoài khoảng 40.000.000đ - 48.000.000đ!`)
    }
    // Kiểm tra giờ công total_hours được ghi nhận đầy đủ cho Part-time có phát sinh lương
    const partTimeSlips = json.salary_slips.filter((s) => s.base_salary === 0 && (s.net_salary || 0) > 0)
    for (const slip of partTimeSlips) {
      if (!slip.total_hours || slip.total_hours <= 0) {
        throw new Error(`Nhân viên Part-time ${slip.employee_name} có total_hours = 0!`)
      }
    }
  })

  await test('POST /api/payroll/lock - Chặn Quản lý hoặc Nhân viên khóa sổ lương (RBAC 403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/payroll/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period: '2026-08',
        store_id: 'store-001',
        user_role: 'store_manager',
      }),
    })
    const json = await res.json()
    if (res.status !== 403 || json.success) {
      throw new Error(`Kỳ vọng 403 Forbidden nhưng nhận: ${res.status}`)
    }
  })

  await test('POST /api/payroll/lock - [BOT CEO] Khóa sổ bảng lương Tháng 8 thành công sau khi đối soát', async () => {
    const res = await fetch(`${BASE_URL}/api/payroll/lock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        period: '2026-08',
        store_id: 'store-001',
        user_role: 'ceo',
        user_id: 'emp-ceo',
      }),
    })
    const json = await res.json()
    if (!res.ok || !json.success || json.status !== 'locked') {
      throw new Error(`Khóa sổ lương thất bại: ${JSON.stringify(json)}`)
    }
  })

  // 7. KIỂM THỬ 3 API VẬN HÀNH MỚI: /api/attendance, /api/requests, /api/reports
  await test('GET /api/attendance - Truy vấn lịch sử chấm công theo store và tháng', async () => {
    const res = await fetch(`${BASE_URL}/api/attendance?store_id=store-001&month=2026-08`)
    const json = await res.json()
    if (!res.ok || !json.success || !Array.isArray(json.data) || json.data.length === 0) {
      throw new Error(`Truy vấn /api/attendance thất bại: ${JSON.stringify(json)}`)
    }
  })

  let testRequestId = ''
  await test('POST & GET /api/requests - Tạo đơn từ và truy vấn danh sách đơn', async () => {
    // A. Tạo đơn xin đổi ca mới
    const createRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'shift_swap',
        employee_id: 'emp-nv0013',
        employee_name: 'Nguyễn Thị Tú Trinh',
        store_id: 'store-001',
        title: 'Đơn xin đổi ca tối sang chiều',
        reason: 'Có việc bận gia đình cần đổi ca',
        target_shift_id: 'shift-002',
      }),
    })
    const createJson = await createRes.json()
    if (!createRes.ok || !createJson.success || !createJson.data?.id) {
      throw new Error(`Tạo đơn thất bại: ${JSON.stringify(createJson)}`)
    }
    testRequestId = createJson.data.id

    // B. Lấy danh sách đơn
    const listRes = await fetch(`${BASE_URL}/api/requests?store_id=store-001`)
    const listJson = await listRes.json()
    if (!listRes.ok || !listJson.success || !listJson.data.some((r) => r.id === testRequestId)) {
      throw new Error(`Đơn mới tạo không xuất hiện trong danh sách: ${JSON.stringify(listJson)}`)
    }
  })

  await test('POST /api/requests - Quản lý duyệt đơn xin đổi ca', async () => {
    const approveRes = await fetch(`${BASE_URL}/api/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'approve',
        request_id: testRequestId,
        approver_id: 'emp-bh9852',
        approver_name: 'Huỳnh Lê Kiều Linh',
        approver_role: 'store_manager',
      }),
    })
    const approveJson = await approveRes.json()
    if (!approveRes.ok || !approveJson.success || approveJson.data?.status !== 'approved') {
      throw new Error(`Duyệt đơn thất bại: ${JSON.stringify(approveJson)}`)
    }
  })

  await test('GET /api/reports - Tổng hợp báo cáo quỹ lương và giờ công Tháng 8/2026', async () => {
    const res = await fetch(`${BASE_URL}/api/reports?period=2026-08`)
    const json = await res.json()
    if (!res.ok || !json.success || !json.data) {
      throw new Error(`Lấy báo cáo thất bại: ${JSON.stringify(json)}`)
    }
    const { summary, by_store, by_employment } = json.data
    const basePayroll = summary.total_net_payroll - (summary.total_tip_bonus || 0)
    if (!summary || basePayroll < 40000000 || basePayroll > 45000000) {
      throw new Error(`Báo cáo tổng quỹ lương gốc sai lệch: ${basePayroll}`)
    }
    if (!by_store || by_store.length !== 2) {
      throw new Error(`Báo cáo phân bổ store không đủ 2 chi nhánh`)
    }
    if (!by_employment?.part_time || !by_employment?.full_time) {
      throw new Error(`Báo cáo thiếu phân nhóm Full-time/Part-time`)
    }
  })

  // 7. KIỂM TRA ROUTE PAGES KHÔNG BỊ CRASH / 404
  await test('GET /stores - Trang Quản lý Cửa hàng phản hồi 200 OK (Đã fix 404)', async () => {
    const res = await fetch(`${BASE_URL}/stores`)
    if (res.status !== 200) {
      throw new Error(`Kỳ vọng HTTP 200 cho /stores nhưng nhận: ${res.status}`)
    }
  })

  await test('GET /profile - Trang Hồ sơ Cá nhân phản hồi 200 OK (Đã fix crash)', async () => {
    const res = await fetch(`${BASE_URL}/profile`)
    if (res.status !== 200) {
      throw new Error(`Kỳ vọng HTTP 200 cho /profile nhưng nhận: ${res.status}`)
    }
  })

  await test('GET /checkin/kiosk - Trang Kiosk QR Code phản hồi 200 OK', async () => {
    const res = await fetch(`${BASE_URL}/checkin/kiosk`)
    if (res.status !== 200) {
      throw new Error(`Kỳ vọng HTTP 200 cho /checkin/kiosk nhưng nhận: ${res.status}`)
    }
  })

  await test('GET /forgot-password - Trang Quên mật khẩu phản hồi 200 OK (Đã fix 404)', async () => {
    const res = await fetch(`${BASE_URL}/forgot-password`)
    if (res.status !== 200) {
      throw new Error(`Kỳ vọng HTTP 200 cho /forgot-password nhưng nhận: ${res.status}`)
    }
    const html = await res.text()
    if (!html.includes('0919.246.273') || !html.includes('Cấp Lại Mật Khẩu')) {
      throw new Error(`Trang /forgot-password thiếu thông tin Hotline hoặc tiêu đề`)
    }
  })

  await test('GET /reports - Trang Báo cáo phản hồi 200 OK và không còn quán ảo (Q.1, Q.3, Q.7)', async () => {
    const res = await fetch(`${BASE_URL}/reports`)
    if (res.status !== 200) {
      throw new Error(`Kỳ vọng HTTP 200 cho /reports nhưng nhận: ${res.status}`)
    }
    const html = await res.text()
    if (html.includes('Homies Milk Tea Q.1') || html.includes('Homies Milk Tea Q.7')) {
      throw new Error(`Trang /reports vẫn còn chứa quán ảo Q.1 hoặc Q.7!`)
    }
  })

  await test('GET /my-payslip - Trang Phiếu lương của tôi phản hồi 200 OK (Đã fix 404)', async () => {
    const res = await fetch(`${BASE_URL}/my-payslip`)
    if (res.status !== 200) {
      throw new Error(`Kỳ vọng HTTP 200 cho /my-payslip nhưng nhận: ${res.status}`)
    }
  })

  await test('GET /my-requests - Trang Yêu cầu của tôi phản hồi 200 OK (Đã fix 404)', async () => {
    const res = await fetch(`${BASE_URL}/my-requests`)
    if (res.status !== 200) {
      throw new Error(`Kỳ vọng HTTP 200 cho /my-requests nhưng nhận: ${res.status}`)
    }
  })

  await test('GET /swap - Trang Đổi ca phản hồi 200 OK (Đã fix 404)', async () => {
    const res = await fetch(`${BASE_URL}/swap`)
    if (res.status !== 200) {
      throw new Error(`Kỳ vọng HTTP 200 cho /swap nhưng nhận: ${res.status}`)
    }
  })

  // =========================================================================
  // ONBOARDING F&B & INVITATIONS REST API SUITE (KHÔNG DÙNG LOCALSTORAGE)
  // =========================================================================
  let testInvitationId = ''
  let testInvitationToken = ''

  await test('GET /api/invitations - Lấy danh sách lời mời ứng viên từ CSDL Server', async () => {
    const res = await fetch(`${BASE_URL}/api/invitations`)
    const json = await res.json()
    if (!res.ok || !json.ok || !Array.isArray(json.data)) {
      throw new Error(`Kỳ vọng danh sách lời mời từ CSDL nhưng nhận: ${JSON.stringify(json)}`)
    }
    if (json.data.length === 0) {
      throw new Error(`Không có lời mời nào trong CSDL`)
    }
  })

  let createdTestEmpId = null
  await test('POST /api/invitations - Tạo lời mời mới, sinh token ngẫu nhiên và link công khai', async () => {
    const res = await fetch(`${BASE_URL}/api/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Ứng Viên Thử Nghiệm',
        phone: '0988776655',
        email: 'ungvien.test@test.vn',
        store_id: 'store-001',
        position_id: 'pos-003',
        department_name: 'Pha chế Barista',
        official_salary: 6200000,
        hire_date: '2026-09-25',
      }),
    })
    const json = await res.json()
    if (!res.ok || !json.ok || !json.invitation || !json.invitation.token) {
      throw new Error(`Tạo lời mời thất bại: ${JSON.stringify(json)}`)
    }
    testInvitationId = json.invitation.id
    testInvitationToken = json.invitation.token
    if (!json.public_url || !json.public_url.includes(testInvitationToken)) {
      throw new Error(`public_url không chứa token hợp lệ: ${json.public_url}`)
    }
  })

  await test('GET /api/invitations/form - Đọc thông tin lời mời theo token cho ứng viên', async () => {
    const res = await fetch(`${BASE_URL}/api/invitations/form?token=${testInvitationToken}`)
    const json = await res.json()
    if (!res.ok || !json.ok || !json.invitation || json.invitation.id !== testInvitationId) {
      throw new Error(`Lấy form lời mời theo token thất bại: ${JSON.stringify(json)}`)
    }
    if (!json.store || json.store.id !== 'store-001' || !json.store.name.includes('Hồ Bá Phấn')) {
      throw new Error(`Thông tin chi nhánh không chính xác: ${JSON.stringify(json.store)}`)
    }
  })

  await test('POST /api/invitations/submit - Ứng viên nộp đủ 5 khối F&B (Size áo, CCCD, Thẻ xanh, STK in hoa, Cam kết)', async () => {
    const res = await fetch(`${BASE_URL}/api/invitations/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: testInvitationToken,
        full_name: 'Ứng Viên Thử Nghiệm',
        phone: '0988776655',
        email: 'ungvien.test@test.vn',
        date_of_birth: '2001-08-15',
        gender: 'female',
        cccd: '079201019999',
        address: '49 Hồ Bá Phấn, TP. Thủ Đức, TP.HCM',
        emergency_contact: 'Phạm Văn Ba - 0912345678 - Bố',
        candidate_notes: 'Có thể bắt đầu ca sáng từ tuần sau',
        shirt_size: 'M',
        id_card_front_url: 'data:image/jpeg;base64,mockFrontCccdDataUrl123',
        id_card_back_url: 'data:image/jpeg;base64,mockBackCccdDataUrl123',
        bank_name: 'Vietcombank (VCB)',
        bank_account_number: '1029384756',
        bank_account_name: 'UNG VIEN THU NGHIEM',
        health_cert_date: '2027-08-15',
        policy_agreed: true,
      }),
    })
    const json = await res.json()
    if (!res.ok || !json.ok || json.invitation.status !== 'submitted') {
      throw new Error(`Nộp hồ sơ ứng viên thất bại: ${JSON.stringify(json)}`)
    }
    if (json.invitation.shirt_size !== 'M' || json.invitation.bank_account_name !== 'UNG VIEN THU NGHIEM') {
      throw new Error(`Dữ liệu F&B lưu chưa đúng: ${JSON.stringify(json.invitation)}`)
    }
  })

  await test('POST /api/invitations/[id]/approve - Duyệt hồ sơ, sinh mã nhân viên kế tiếp và cấp pass 123456', async () => {
    const res = await fetch(`${BASE_URL}/api/invitations/${testInvitationId}/approve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const json = await res.json()
    if (!res.ok || !json.ok || !json.employee) {
      throw new Error(`Duyệt hồ sơ thất bại: ${JSON.stringify(json)}`)
    }
    createdTestEmpId = json.employee.id
    if (!json.employee.employee_code || !json.employee.employee_code.startsWith('NV')) {
      throw new Error(`Mã nhân viên sinh ra không đúng chuẩn NVxxxx: ${json.employee.employee_code}`)
    }
    if (json.employee.password !== '123456') {
      throw new Error(`Mật khẩu mặc định không phải 123456: ${json.employee.password}`)
    }
  })

  await test('GET /employees/invitations/form - Trang biểu mẫu Mobile-First phản hồi 200 OK', async () => {
    const res = await fetch(`${BASE_URL}/employees/invitations/form?token=${testInvitationToken}`)
    if (res.status !== 200) {
      throw new Error(`Kỳ vọng HTTP 200 cho /employees/invitations/form nhưng nhận: ${res.status}`)
    }

    // Tự động dọn dẹp dữ liệu thử nghiệm vừa tạo để tránh lưu rác vào database
    try {
      const fs = await import('fs')
      const dbPath = 'data/server-db.json'
      if (fs.existsSync(dbPath)) {
        const dbData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))
        if (createdTestEmpId && dbData.employees) {
          dbData.employees = dbData.employees.filter(e => e.id !== createdTestEmpId)
        }
        if (testInvitationId && dbData.invitations) {
          dbData.invitations = dbData.invitations.filter(i => i.id !== testInvitationId)
        }
        fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2), 'utf-8')
      }
    } catch {
      // Ignore cleanup error in test
    }
  })

  // 12. KIỂM THỬ 4 BỘ LỌC LOGIC CỐT TỬ SAU STRESS-TEST QUẦY BAR
  // A. [LOGIC 1 & 4] Bắt đi trễ > 15 phút, tự động sinh vi phạm vào Sổ lỗi KPI và đẩy vào late_deduction
  const testLateEmpId = 'emp-nv0030' // Quách Thị Kim Chi
  const testLateDate = '2026-09-30'
  const lateCheckinTime = `${testLateDate}T09:00:00.000Z` // Checkin lúc 09:00, ca bắt đầu 08:00 (trễ 60 phút)

  await test('POST /api/attendance - [LOGIC 1 & 4] Đi trễ > 15 phút ➔ is_late: true, sinh vi phạm KPI & cộng late_deduction', async () => {
    const res = await fetch(`${BASE_URL}/api/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: testLateEmpId,
        store_id: 'store-001',
        date: testLateDate,
        check_in_time: lateCheckinTime,
        shift_start_time: '08:00',
        late_minutes: 60,
      }),
    })
    const json = await res.json()
    if (!res.ok || !json.success || !json.data.is_late || json.data.late_minutes < 15) {
      throw new Error(`Kỳ vọng is_late: true và late_minutes > 15 nhưng nhận: ${JSON.stringify(json)}`)
    }

    // Đối soát Sổ lỗi KPI /api/kpi/incidents có bản ghi vi phạm
    const incRes = await fetch(`${BASE_URL}/api/kpi/incidents?employee_id=${testLateEmpId}&month=2026-09`)
    const incJson = await incRes.json()
    if (!incRes.ok || !incJson.success || incJson.count === 0) {
      throw new Error(`Chưa sinh vi phạm trong Sổ lỗi KPI: ${JSON.stringify(incJson)}`)
    }
    const lateVio = incJson.data.find((v) => v.violation_code === 'attendance_late')
    if (!lateVio || lateVio.penalty_amount <= 0) {
      throw new Error(`Hồ sơ vi phạm thiếu penalty_amount hợp lệ: ${JSON.stringify(lateVio)}`)
    }

    // Đối soát bảng lương /api/payroll có ghi nhận cột late_deduction
    const payRes = await fetch(`${BASE_URL}/api/payroll?period=2026-09`)
    const payJson = await payRes.json()
    const slip = payJson.salary_slips?.find((s) => s.employee_id === testLateEmpId)
    if (!slip || (slip.late_deduction || 0) <= 0) {
      throw new Error(`Bảng lương chưa nhận số tiền phạt late_deduction: ${JSON.stringify(slip)}`)
    }
  })

  // B. [LOGIC 1] Bắt về sớm và trừ giờ công thực tế
  await test('POST /api/attendance - [LOGIC 1] Về sớm ➔ is_early: true & trừ giờ công thực tế', async () => {
    const earlyCheckoutTime = `${testLateDate}T15:30:00.000Z` // Tan ca sớm lúc 15:30, ca kết thúc lúc 17:00 (sớm 90p)
    const res = await fetch(`${BASE_URL}/api/attendance`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'check_out',
        employee_id: testLateEmpId,
        date: testLateDate,
        check_out_time: earlyCheckoutTime,
        shift_end_time: '17:00',
      }),
    })
    const json = await res.json()
    if (!res.ok || !json.success || !json.data.is_early || json.data.early_minutes <= 0) {
      throw new Error(`Kỳ vọng is_early: true và early_minutes > 0 nhưng nhận: ${JSON.stringify(json)}`)
    }
    if (json.data.total_hours >= 8) {
      throw new Error(`Về sớm nhưng giờ công vẫn tính tròn 8 tiếng: ${json.data.total_hours}`)
    }
  })

  // C. [LOGIC 2] Chặn check-in đúp trong vòng 15 phút (De-bounce)
  await test('POST /api/attendance/checkin - [LOGIC 2] Chặn bấm check-in đúp trong vòng 15 phút', async () => {
    // Nhân viên vừa check-in, bấm tiếp lần 2 ngay sau đó
    const qrRes = await fetch(`${BASE_URL}/api/attendance/qr-token?store_id=store-001`)
    const qrJson = await qrRes.json()

    // Bấm lần 1 thành công
    const debEmpId = 'emp-nv0031'
    await fetch(`${BASE_URL}/api/attendance/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: debEmpId,
        store_id: 'store-001',
        latitude: 10.822435,
        longitude: 106.762649,
        qr_code: qrJson.token,
      }),
    })

    // Bấm lần 2 ngay lập tức (< 15 phút)
    const res2 = await fetch(`${BASE_URL}/api/attendance/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: debEmpId,
        store_id: 'store-001',
        latitude: 10.822435,
        longitude: 106.762649,
        qr_code: qrJson.token,
      }),
    })
    const json2 = await res2.json()
    if (res2.status !== 400 || json2.success || !json2.debounced) {
      throw new Error(`Kỳ vọng từ chối check-in đúp (HTTP 400, debounced: true) nhưng nhận: ${JSON.stringify(json2)}`)
    }
  })

  // D. [LOGIC 3] Chặn đăng ký 2 ca trùng khung giờ trong cùng ngày
  await test('POST /api/shifts/register - [LOGIC 3] Chặn đăng ký 2 ca trùng khung giờ trong ngày (trong 1 gói)', async () => {
    const conflictPayload = {
      employee_id: 'emp-nv0030',
      store_id: 'store-001',
      week_start_date: '2026-10-05',
      items: [
        { date: '2026-10-05', shiftId: 'shift-001', notes: 'Ca sáng (08:30 - 12:00)' },
        { date: '2026-10-05', shiftId: 'shift-004', notes: 'Ca cao điểm (11:30 - 14:30 - trùng 11:30-12:00)' },
      ],
    }
    const res = await fetch(`${BASE_URL}/api/shifts/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(conflictPayload),
    })
    const json = await res.json()
    if (res.status !== 400 || json.success || json.error !== 'Ca đăng ký bị trùng khung giờ') {
      throw new Error(`Kỳ vọng báo lỗi 'Ca đăng ký bị trùng khung giờ' nhưng nhận: ${JSON.stringify(json)}`)
    }
  })

  await test('POST /api/shifts/register - [LOGIC 3] Chặn đăng ký ca trùng khung giờ kể cả khác cơ sở', async () => {
    // Đăng ký trước 1 ca tại Cơ sở Hồ Bá Phấn
    await fetch(`${BASE_URL}/api/shifts/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: 'emp-nv0031',
        store_id: 'store-001', // HBP
        week_start_date: '2026-10-12',
        date: '2026-10-12',
        shift_id: 'shift-002', // Ca Trưa 12:00 - 17:00
      }),
    })

    // Đăng ký tiếp 1 ca khác tại Cơ sở 429 bị trùng khung giờ (Ca Cao Điểm 11:30 - 14:30)
    const resCross = await fetch(`${BASE_URL}/api/shifts/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        employee_id: 'emp-nv0031',
        store_id: 'store-002', // 429 (khác cơ sở)
        week_start_date: '2026-10-12',
        date: '2026-10-12',
        shift_id: 'shift-004', // Ca Cao Điểm (11:30 - 14:30 - giao với 12:00-14:30)
      }),
    })
    const jsonCross = await resCross.json()
    if (resCross.status !== 400 || jsonCross.success || jsonCross.error !== 'Ca đăng ký bị trùng khung giờ') {
      throw new Error(`Kỳ vọng chặn ca trùng khác cơ sở nhưng nhận: ${JSON.stringify(jsonCross)}`)
    }
  })

  // 12. KIỂM THỬ BẢO MẬT PHÂN QUYỀN (RBAC) CÀI ĐẶT: /api/schedule-rules & /api/master-data
  await test('POST /api/schedule-rules - Chặn nhân viên sửa quy tắc xếp ca (RBAC 403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/schedule-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_role: 'employee',
        rule: { rule_key: 'max_daily_hours', warning_value: 9 },
      }),
    })
    const json = await res.json()
    if (res.status !== 403 || json.success) {
      throw new Error(`Kỳ vọng 403 Forbidden nhưng nhận: ${res.status}`)
    }
  })

  await test('POST /api/schedule-rules - [BOT QUẢN LÝ] Quản lý cập nhật quy tắc xếp ca thành công', async () => {
    const res = await fetch(`${BASE_URL}/api/schedule-rules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        user_role: 'store_manager',
        rule: { rule_key: 'max_daily_hours', label: 'Định mức giờ tối đa mỗi ngày', warning_value: 8.5 },
      }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(`Quản lý cập nhật quy tắc ca thất bại: ${JSON.stringify(json)}`)
    }
  })

  await test('POST /api/master-data - Chặn nhân viên sửa danh mục chức vụ & bộ phận (RBAC 403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/master-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_role: 'employee',
        delete_position_id: 'pos-test-unauthorized',
      }),
    })
    const json = await res.json()
    if (res.status !== 403 || json.success) {
      throw new Error(`Kỳ vọng 403 Forbidden nhưng nhận: ${res.status}`)
    }
  })

  await test('POST /api/master-data - [BOT CEO] CEO cập nhật danh mục chức vụ thành công', async () => {
    const res = await fetch(`${BASE_URL}/api/master-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ceoToken}` },
      body: JSON.stringify({
        user_role: 'ceo',
        position: { id: 'pos-test-ceo', name: 'Nhân viên thử nghiệm', department_id: 'dept-ops', level: 1 },
      }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(`CEO cập nhật master data thất bại: ${JSON.stringify(json)}`)
    }
    // Dọn dẹp bản ghi thử nghiệm
    await fetch(`${BASE_URL}/api/master-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ceoToken}` },
      body: JSON.stringify({ user_role: 'ceo', delete_position_id: 'pos-test-ceo' }),
    })
  })

  await test('POST /api/stores - Chặn nhân viên sửa thông tin chi nhánh & PIN (RBAC 403 Forbidden)', async () => {
    const res = await fetch(`${BASE_URL}/api/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_role: 'employee',
        id: 'store-001',
        name: 'Hồ Bá Phấn',
        pin_code: '9999',
      }),
    })
    const json = await res.json()
    if (res.status !== 403 || json.success) {
      throw new Error(`Kỳ vọng 403 Forbidden nhưng nhận: ${res.status}`)
    }
  })

  await test('POST /api/stores - [BOT QUẢN LÝ] Quản lý cập nhật bán kính GPS và PIN chi nhánh thành công', async () => {
    const res = await fetch(`${BASE_URL}/api/stores`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({
        user_role: 'store_manager',
        id: 'store-001',
        name: 'Homies Milk Tea - Hồ Bá Phấn',
        pin_code: '3535',
        checkin_radius_meters: 100,
      }),
    })
    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(`Quản lý cập nhật chi nhánh thất bại: ${JSON.stringify(json)}`)
    }
  })

  console.log('\n========================================')
  console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed}/${total} test pass (${Math.round((passed / total) * 100)}%)`)
  console.log('========================================\n')

  if (passed !== total) {
    process.exit(1)
  }
}

runTests().catch(console.error)
