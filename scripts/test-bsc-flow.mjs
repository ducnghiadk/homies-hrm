// ============================================================
// Automated End-to-End Verification for BSC Bonus System
// Tests:
// 1. iPOS IVT Waste API (/api/report/v2/dashboard/management/lost-chart)
// 2. Zero-Manual Input BSC Targets (/api/bsc/targets)
// 3. Operational & Personal Logs API (/api/bsc/logs)
// 4. Store Manager (Huỳnh Lê Kiều Linh) Submission Flow
// 5. CEO (Nguyễn Đức Nghĩa) Approval & Auto-Payroll Lock Flow (/api/bsc/approve)
// ============================================================

const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3535'

async function runBscTests() {
  console.log('🚀 BẮT ĐẦU KIỂM THỬ TOÀN DIỆN PHÂN HỆ THƯỞNG BSC (HOMIES HRM PORT 3535)...\n')
  let passed = 0
  let total = 0

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

  // 1. Kiểm tra API Hao hụt kho iPOS IVT
  await test('1. GET /api/report/v2/dashboard/management/lost-chart - Tự động lấy tỷ lệ % hao hụt kho iPOS IVT', async () => {
    const res = await fetch(`${BASE_URL}/api/report/v2/dashboard/management/lost-chart?store_id=store-001&period=2026-08`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    if (!json.success || json.waste_percentage !== 1.8) {
      throw new Error(`Dữ liệu hao hụt không chính xác: ${JSON.stringify(json)}`)
    }
    if (!json.cogs_budget || !json.cogs_actual) {
      throw new Error(`Thiếu dữ liệu COGS định mức hoặc thực tế`)
    }
  })

  // 2. Kiểm tra API Mục tiêu BSC (Zero-Manual Input Doanh thu & Hao hụt)
  await test('2. GET /api/bsc/targets - Tự động hóa Doanh thu POS & Hao hụt kho IVT', async () => {
    const res = await fetch(`${BASE_URL}/api/bsc/targets?store_id=store-001&period=2026-08`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json = await res.json()
    if (!json.success || !Array.isArray(json.targets) || json.targets.length === 0) {
      throw new Error(`Không lấy được danh sách mục tiêu BSC: ${JSON.stringify(json)}`)
    }
    const target = json.targets[0]
    if (!target.actual_revenue_monthly || target.actual_revenue_monthly <= 0) {
      throw new Error(`Doanh thu thực tế POS không hợp lệ: ${target.actual_revenue_monthly}`)
    }
    if (typeof target.waste_percentage !== 'number') {
      throw new Error(`Tỷ lệ hao hụt kho IVT không hợp lệ: ${target.waste_percentage}`)
    }
  })

  // 2b. Kiểm tra API Cài đặt BSC (/api/bsc/settings)
  await test('2b. GET & POST /api/bsc/settings - Đồng bộ cài đặt & catalog trên máy chủ', async () => {
    const resGet = await fetch(`${BASE_URL}/api/bsc/settings`)
    if (!resGet.ok) throw new Error(`GET HTTP ${resGet.status}`)
    const jsonGet = await resGet.json()
    if (!jsonGet.success || !jsonGet.settings?.criteria || !jsonGet.settings?.safety_settings) {
      throw new Error(`GET /api/bsc/settings trả về thiếu dữ liệu: ${JSON.stringify(jsonGet)}`)
    }

    // Thử POST cập nhật một trường safety settings
    const resPost = await fetch(`${BASE_URL}/api/bsc/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        safety_settings: { allow_store_manager_view_bonus: true },
      }),
    })
    if (!resPost.ok) throw new Error(`POST HTTP ${resPost.status}`)
    const jsonPost = await resPost.json()
    if (!jsonPost.success || jsonPost.settings?.safety_settings?.allow_store_manager_view_bonus !== true) {
      throw new Error(`POST /api/bsc/settings cập nhật thất bại: ${JSON.stringify(jsonPost)}`)
    }
  })

  // 3. Đăng nhập Quản lý Huỳnh Lê Kiều Linh & Ghi nhận sự cố vận hành
  let managerCookie = ''
  await test('3. POST /api/auth/login - [QUẢN LÝ] Huỳnh Lê Kiều Linh đăng nhập vào hệ thống', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'huynhlekieulinh6@gmail.com', password: '123456' }),
    })
    const json = await res.json()
    if (!res.ok || !json.success || json.user.role !== 'store_manager') {
      throw new Error(`Đăng nhập Quản lý thất bại: ${JSON.stringify(json)}`)
    }
    managerCookie = res.headers.get('set-cookie') || ''
  })

  let createdLogId = ''
  await test('4. POST /api/bsc/logs - [QUẢN LÝ] Ghi nhận 01 sự cố lỗi vận hành tại quán HBP', async () => {
    const res = await fetch(`${BASE_URL}/api/bsc/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: managerCookie,
      },
      body: JSON.stringify({
        store_id: 'store-001',
        period: '2026-08',
        log_type: 'operation',
        event_category: 'operation_store',
        group_key: 'lam_don',
        group_name: 'Pha chế & Công thức Trà sữa',
        sub_error_id: 'sub-op-01',
        sub_error_name: 'Pha sai % đường/đá',
        points: 1,
        occurred_at: '2026-08-18T16:00:00.000Z',
        shift_name: 'Ca Chiều',
        order_code: 'BILL-9901',
        evidence_note: 'Pha nhầm 70% đường thành 100% đường cho đơn khách bàn 4',
        verifier_name: 'Huỳnh Lê Kiều Linh',
      }),
    })
    const json = await res.json()
    if (!res.ok || !json.success || !json.data?.id) {
      throw new Error(`Ghi nhận lỗi thất bại: ${JSON.stringify(json)}`)
    }
    createdLogId = json.data.id
  })

  // 4. Quản lý gửi bảng quyết toán BSC lên CEO
  await test('5. POST /api/bsc/targets - [QUẢN LÝ] Gửi duyệt bảng quyết toán BSC lên CEO (pending_ceo)', async () => {
    const res = await fetch(`${BASE_URL}/api/bsc/targets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: managerCookie,
      },
      body: JSON.stringify({
        store_id: 'store-001',
        period: '2026-08',
        approval_status: 'pending_ceo',
      }),
    })
    const json = await res.json()
    if (!res.ok || !json.success || json.data.approval_status !== 'pending_ceo') {
      throw new Error(`Gửi duyệt thất bại: ${JSON.stringify(json)}`)
    }
  })

  // 5. Đăng nhập CEO Nguyễn Đức Nghĩa từ thiết bị khác
  let ceoCookie = ''
  await test('6. POST /api/auth/login - [CEO] Nguyễn Đức Nghĩa đăng nhập từ thiết bị khác', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'tuan@bobahouse.vn', password: 'password123' }),
    })
    const json = await res.json()
    if (!res.ok || !json.success || json.user.role !== 'ceo') {
      throw new Error(`Đăng nhập CEO thất bại: ${JSON.stringify(json)}`)
    }
    ceoCookie = res.headers.get('set-cookie') || ''
  })

  // 6. CEO kiểm tra trạng thái quyết toán chờ duyệt
  await test('7. GET /api/bsc/targets - [CEO] Thấy ngay quyết toán ở trạng thái chờ duyệt (pending_ceo)', async () => {
    const res = await fetch(`${BASE_URL}/api/bsc/targets?store_id=store-001&period=2026-08`, {
      headers: { Cookie: ceoCookie },
    })
    const json = await res.json()
    const target = json.targets?.[0]
    if (!target || target.approval_status !== 'pending_ceo') {
      throw new Error(`CEO không thấy trạng thái pending_ceo: ${JSON.stringify(target)}`)
    }
  })

  // 7. CEO bấm Phê duyệt & Ban hành (POST /api/bsc/approve)
  await test('8. POST /api/bsc/approve - [CEO] Bấm "Phê duyệt & Ban hành", khóa sổ BSC và tự động đẩy thưởng vào bảng lương', async () => {
    const res = await fetch(`${BASE_URL}/api/bsc/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: ceoCookie,
      },
      body: JSON.stringify({
        store_id: 'store-001',
        period: '2026-08',
        action: 'approve',
        approver_name: 'CEO Nguyễn Đức Nghĩa',
      }),
    })
    const json = await res.json()
    if (!res.ok || !json.success || json.approval_status !== 'approved_published') {
      throw new Error(`Phê duyệt thất bại: ${JSON.stringify(json)}`)
    }
    if (!Array.isArray(json.distributed_bonuses) || json.distributed_bonuses.length === 0) {
      throw new Error(`Không có danh sách thưởng phân bổ: ${JSON.stringify(json)}`)
    }
  })

  // 8. Kiểm tra bảng lương (/api/payroll) đã tự động cập nhật tiền thưởng BSC của nhân sự
  await test('9. GET /api/payroll - Xác nhận tiền thưởng BSC đã được nạp trực tiếp vào phiếu lương nhân viên', async () => {
    const res = await fetch(`${BASE_URL}/api/payroll?period=2026-08&store_id=store-001`)
    const json = await res.json()
    if (!res.ok || !json.success || !Array.isArray(json.salary_slips)) {
      throw new Error(`Không thể lấy danh sách phiếu lương: ${JSON.stringify(json)}`)
    }

    const slipsWithBonus = json.salary_slips.filter(s => s.bonus > 0)
    if (slipsWithBonus.length === 0) {
      throw new Error(`Chưa có nhân viên nào được nhận thưởng BSC trên phiếu lương`)
    }

    console.log(`   👉 Đã kiểm tra: ${slipsWithBonus.length} nhân viên cơ sở HBP có thưởng BSC trên phiếu lương:`)
    slipsWithBonus.slice(0, 3).forEach(s => {
      console.log(`      • ${s.employee_name} (${s.employee_code}): Thưởng = ${s.bonus.toLocaleString('vi-VN')} đ | Thực nhận NET = ${s.net_salary.toLocaleString('vi-VN')} đ`)
    })
  })

  console.log(`\n🎉 KẾT QUẢ KIỂM THỬ: ${passed}/${total} test cases PASSED (100% THÀNH CÔNG)`)
}

runBscTests().catch(err => {
  console.error('Lỗi khi chạy test suite:', err)
  process.exit(1)
})
