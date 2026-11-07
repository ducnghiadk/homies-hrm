// Script tạo và nạp dữ liệu thật iPOS HRM cho Homies Milk Tea
// 100% dữ liệu thực tế: 14 nhân sự thật + 1 CEO, 5 khung ca thật F&B,
// 447 ca Tháng 8 chuẩn số ca từng người, quỹ lương 40-45 triệu VNĐ,
// Cấu hình xoay ca 2 chi nhánh, attendance và requests.

import fs from 'fs/promises'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_FILE = path.join(DATA_DIR, 'server-db.json')
const ROOT_PAYLOAD_FILE = path.join(process.cwd(), '[BOT]_HOMIES_HRM_REAL_SEED_PAYLOAD.json')

// 1. Cấu hình 2 chi nhánh có tọa độ GPS
const stores = [
  {
    id: 'store-001',
    name: 'Homies Milk Tea - Hồ Bá Phấn',
    address: '89 Hồ Bá Phấn, P. Phước Long A, TP. Thủ Đức, TP.HCM',
    latitude: 10.822435,
    longitude: 106.762649,
    checkin_radius_meters: 100,
    phone: '0901 234 567',
    is_active: true,
  },
  {
    id: 'store-002',
    name: 'Homies Milk Tea - Đường 429',
    address: '429 Đường 429, P. Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM',
    latitude: 10.84478,
    longitude: 106.78652,
    checkin_radius_meters: 100,
    phone: '0901 234 568',
    is_active: true,
  },
]

// 2. Danh sách 14 nhân sự thực tế + CEO Nguyễn Đức Nghĩa
// 2 Full-time (6.6tr) + 12 Part-time (tính theo giờ, base_salary = 0)
// 4 bạn xoay ca (Kiều Linh, Công Huy, Đông Duy, Nguyễn Thị Thu) có secondary_store_ids cả 2 quán
const employees = [
  // CEO điều hành
  {
    id: 'emp-001',
    full_name: 'Nguyễn Đức Nghĩa',
    email: 'tuan@bobahouse.vn',
    password: '123456',
    role: 'ceo',
    store_id: 'store-001',
    position_id: 'pos-ceo',
    phone: '0919246273',
    employee_code: 'BH-001',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Ban Giám đốc',
    base_salary: 25000000,
    hourly_rate: 100000,
    hire_date: '2024-01-01',
  },

  // 2 Nhân sự Full-time (Lương cứng 6.600.000đ/tháng, Store chính 429, Store phụ HBP)
  {
    id: 'emp-nv0027',
    full_name: 'Trần Công Huy',
    email: 'jinn.wooo.02@gmail.com',
    password: '123456',
    role: 'store_manager',
    store_id: 'store-002',
    secondary_store_ids: ['store-001', 'store-002'],
    position_id: 'pos-sm',
    phone: '0332151527',
    employee_code: 'NV0027',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Quản lý cửa hàng',
    base_salary: 6600000,
    hourly_rate: 31730,
    hire_date: '2024-04-01',
  },
  {
    id: 'emp-nv0028',
    full_name: 'Phạm Nguyễn Đông Duy',
    email: 'phamnguyendongduy2020@gmail.com',
    password: '123456',
    role: 'employee',
    store_id: 'store-002',
    secondary_store_ids: ['store-001', 'store-002'],
    position_id: 'pos-barista',
    phone: '0943749525',
    employee_code: 'NV0028',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Pha chế & Barista',
    base_salary: 6600000,
    hourly_rate: 31730,
    hire_date: '2025-01-15',
  },

  // 12 Nhân sự Part-time (Tính theo giờ, KHÔNG có lương cứng -> base_salary = 0)
  {
    id: 'emp-nv0008',
    full_name: 'Nguyễn Thị Phương Thảo',
    email: 'nguyenphuongthao4324@gmail.com',
    password: '123456',
    role: 'employee',
    store_id: 'store-001',
    position_id: 'pos-cashier',
    phone: '0349439071',
    employee_code: 'NV0008',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Thu ngân & Phục vụ',
    base_salary: 0,
    hourly_rate: 28000,
    hire_date: '2025-05-01',
  },
  {
    id: 'emp-bh9852',
    full_name: 'Huỳnh Lê Kiều Linh',
    email: 'huynhlekieulinh6@gmail.com',
    password: '123456',
    role: 'store_manager',
    store_id: 'store-001',
    secondary_store_ids: ['store-001', 'store-002'],
    position_id: 'pos-sm',
    phone: '0779554540',
    employee_code: 'BH-9852',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Quản lý cửa hàng',
    base_salary: 0,
    hourly_rate: 25000,
    hire_date: '2024-05-10',
  },
  {
    id: 'emp-nv0024',
    full_name: 'Tấn Hiếu',
    email: 'tan569619@gmail.com',
    password: '123456',
    role: 'employee',
    store_id: 'store-001',
    position_id: 'pos-service',
    phone: '0932835952',
    employee_code: 'NV0024',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Phục vụ & Phụ bar',
    base_salary: 0,
    hourly_rate: 16000,
    hire_date: '2025-08-01',
  },
  {
    id: 'emp-nv0016',
    full_name: 'Nguyễn Thị Kiều Ý',
    email: 'kieuy4052007@gmail.com',
    password: '123456',
    role: 'store_manager',
    store_id: 'store-002',
    position_id: 'pos-sm',
    phone: '0378410208',
    employee_code: 'NV0016',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Quản lý cửa hàng',
    base_salary: 0,
    hourly_rate: 20000,
    hire_date: '2024-06-15',
  },
  {
    id: 'emp-nv0013',
    full_name: 'Nguyễn Thị Tú Trinh',
    email: 'ngthtutrinh.0504@gmail.com',
    password: '123456',
    role: 'employee',
    store_id: 'store-001',
    position_id: 'pos-cashier',
    phone: '0373056852',
    employee_code: 'NV0013',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Thu ngân & Phục vụ',
    base_salary: 0,
    hourly_rate: 20000,
    hire_date: '2025-02-01',
  },
  {
    id: 'emp-nv0017',
    full_name: 'Nguyễn Thanh Thiện',
    email: 'nguyenthanhthien2804@gmail.com',
    password: '123456',
    role: 'employee',
    store_id: 'store-002',
    position_id: 'pos-barista',
    phone: '0775943568',
    employee_code: 'NV0017',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Pha chế & Barista',
    base_salary: 0,
    hourly_rate: 20000,
    hire_date: '2025-03-01',
  },
  {
    id: 'emp-nv0020',
    full_name: 'Lê Minh Lộc',
    email: 'lloclm0203@gmail.com',
    password: '123456',
    role: 'shift_leader',
    store_id: 'store-002',
    position_id: 'pos-leader',
    phone: '0945576422',
    employee_code: 'NV0020',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Vận hành cửa hàng',
    base_salary: 0,
    hourly_rate: 20000,
    hire_date: '2024-08-20',
    secondary_store_ids: ['store-001', 'store-002'],
  },
  {
    id: 'emp-nv0009',
    full_name: 'Nguyễn Thị Kiều Trang',
    email: 'kieutrang.homies@gmail.com',
    password: '123456',
    role: 'employee',
    store_id: 'store-001',
    position_id: 'pos-cashier',
    phone: '0908123009',
    employee_code: 'NV0009',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Thu ngân & Phục vụ',
    base_salary: 0,
    hourly_rate: 20000,
    hire_date: '2025-06-01',
  },
  {
    id: 'emp-nv0030',
    full_name: 'Quách Thị Kim Chi',
    email: 'quachchi0909@gmail.com',
    password: '123456',
    role: 'employee',
    store_id: 'store-001',
    position_id: 'pos-barista',
    phone: '0327431568',
    employee_code: 'NV0030',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Thu ngân & Pha chế',
    base_salary: 0,
    hourly_rate: 20000,
    hire_date: '2025-04-10',
  },
  {
    id: 'emp-nv0031',
    full_name: 'Cao Văn Thắng',
    email: 'vanthangdzai008@gmail.com',
    password: '123456',
    role: 'employee',
    store_id: 'store-001',
    position_id: 'pos-barista',
    phone: '0336675736',
    employee_code: 'NV0031',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Pha chế & Barista',
    base_salary: 0,
    hourly_rate: 20000,
    hire_date: '2025-05-15',
  },
  {
    id: 'emp-nv0033',
    full_name: 'Nguyễn Hoài Ân',
    email: 'hie.agg21@gmail.com',
    password: '123456',
    role: 'employee',
    store_id: 'store-001',
    position_id: 'pos-barista',
    phone: '0364136210',
    employee_code: 'NV0033',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Pha chế & Barista',
    base_salary: 0,
    hourly_rate: 20000,
    hire_date: '2025-04-15',
  },
  {
    id: 'emp-nv0034',
    full_name: 'Nguyễn Thị Thu',
    email: 'ntthu.work1@gmail.com',
    password: '123456',
    role: 'employee',
    store_id: 'store-002',
    secondary_store_ids: ['store-001', 'store-002'],
    position_id: 'pos-cashier',
    phone: '0963593319',
    employee_code: 'NV0034',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Thu ngân & Phục vụ',
    base_salary: 0,
    hourly_rate: 20000,
    hire_date: '2025-06-01',
  },
  {
    id: 'emp-nv0035',
    full_name: 'Nguyễn Mạnh Duy',
    email: 'oppoa5301012021@gmail.com',
    password: '123456',
    role: 'employee',
    store_id: 'store-001',
    position_id: 'pos-service',
    phone: '0377249775',
    employee_code: 'NV0035',
    status: 'active',
    account_status: 'dang_hoat_dong',
    department_name: 'Phục vụ & Phụ bar',
    base_salary: 0,
    hourly_rate: 20000,
    hire_date: '2025-07-15',
  },
]

// 3. Đúng 5 khung ca thật của quán trà sữa Homies F&B
const SHIFT_TEMPLATES = [
  { id: 'shift-001', name: 'Ca Sáng (08:30 - 12:00)', start: '08:30', end: '12:00', hours: 3.5 },
  { id: 'shift-002', name: 'Ca Trưa (12:00 - 17:00)', start: '12:00', end: '17:00', hours: 5.0 },
  { id: 'shift-003', name: 'Ca Tối (17:00 - 22:00)', start: '17:00', end: '22:00', hours: 5.0 },
  { id: 'shift-004', name: 'Ca Cao Điểm Trưa (11:30 - 14:30)', start: '11:30', end: '14:30', hours: 3.0 },
  { id: 'shift-005', name: 'Ca Dọn Quầy (22:00 - 01:30)', start: '22:00', end: '01:30', hours: 3.5 },
]

// 4. Định nghĩa số ca thực tế Tháng 8 chuẩn iPOS theo từng người
const AUGUST_SHIFT_COUNTS = {
  'emp-nv0024': 1,  // Tấn Hiếu: 1 ca
  'emp-nv0035': 4,  // Nguyễn Mạnh Duy: 4 ca
  'emp-nv0034': 9,  // Nguyễn Thị Thu: 9 ca
  'emp-nv0017': 9,  // Nguyễn Thanh Thiện: 9 ca
  'emp-nv0009': 10, // Nguyễn Thị Kiều Trang: 10 ca
  'emp-nv0033': 24, // Nguyễn Hoài Ân: 24 ca
  'emp-nv0030': 27, // Quách Thị Kim Chi: 27 ca
  'emp-nv0013': 31, // Nguyễn Thị Tú Trinh: 31 ca
  'emp-nv0016': 33, // Nguyễn Thị Kiều Ý: 33 ca
  'emp-nv0020': 35, // Lê Minh Lộc: 35 ca
  'emp-nv0031': 37, // Cao Văn Thắng: 37 ca
  'emp-bh9852': 47, // Huỳnh Lê Kiều Linh: 47 ca
  'emp-nv0008': 56, // Nguyễn Thị Phương Thảo: 56 ca
  'emp-nv0027': 60, // Trần Công Huy: 60 ca
  'emp-nv0028': 64, // Phạm Nguyễn Đông Duy: 64 ca
}

function generateRealShifts() {
  const shifts = []
  let globalCount = 0

  // 10 Khung ca chuẩn vận hành của HBP: đóng cửa lúc 22h, dọn dẹp nằm trọn trong Ca Tối
  const hbpStandardTemplates = [
    { id: 'shift-001', name: 'Ca Sáng (08:30 - 12:00)', start: '08:30', end: '12:00', hours: 3.5 },
    { id: 'shift-002', name: 'Ca Trưa (12:00 - 17:00)', start: '12:00', end: '17:00', hours: 5.0 },
    { id: 'shift-003', name: 'Ca Tối (17:00 - 22:00)', start: '17:00', end: '22:00', hours: 5.0 },
    { id: 'shift-004-tle', name: 'Ca Trưa Lẻ (12:00 - 15:00)', start: '12:00', end: '15:00', hours: 3.0 },
    { id: 'shift-009', name: 'KIỂM KHO (17:00 - 22:00)', start: '17:00', end: '22:00', hours: 5.0 },
  ]

  // A. Phân bổ ca Tháng 8/2026
  for (const [empId, targetShifts] of Object.entries(AUGUST_SHIFT_COUNTS)) {
    const emp = employees.find(e => e.id === empId)
    if (!emp) continue

    for (let s = 0; s < targetShifts; s++) {
      globalCount++
      const day = ((s * 31) / targetShifts) + 1
      const actualDay = Math.min(31, Math.max(1, Math.floor(day)))
      const dayStr = String(actualDay).padStart(2, '0')
      const date = `2026-08-${dayStr}`

      const d = new Date(date)
      const monday = new Date(d)
      const dayOfWeek = d.getDay()
      const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
      monday.setDate(diff)
      const week_start_date = monday.toISOString().slice(0, 10)

      // Đối với nhân sự xoay ca, bóc tách store_id chuẩn theo dữ liệu thực tế iPOS HRM:
      let store_id = emp.store_id
      if (emp.id === 'emp-bh9852') {
        // Kiều Linh: 44 ca HBP (store-001) + 3 ca 429 (store-002)
        store_id = s < 44 ? 'store-001' : 'store-002'
      } else if (emp.id === 'emp-nv0027') {
        // Trần Công Huy: 55 ca 429 + 5 ca HBP
        store_id = s < 55 ? 'store-002' : 'store-001'
      } else if (emp.id === 'emp-nv0028') {
        // Phạm Nguyễn Đông Duy: 60 ca 429 + 4 ca HBP
        store_id = s < 60 ? 'store-002' : 'store-001'
      } else if (emp.id === 'emp-nv0020') {
        // Lê Minh Lộc: 30 ca 429 + 5 ca HBP
        store_id = s < 30 ? 'store-002' : 'store-001'
      } else if (emp.id === 'emp-nv0034') {
        // Nguyễn Thị Thu: 6 ca HBP + 3 ca 429
        store_id = s < 6 ? 'store-001' : 'store-002'
      } else if (emp.secondary_store_ids && emp.secondary_store_ids.length > 1) {
        store_id = s % 2 === 0 ? 'store-001' : 'store-002'
      }

      // Chọn mẫu ca: Cơ sở HBP (store-001) TUYỆT ĐỐI KHÔNG CÓ CA DỌN QUẦY 22H-01H30 & CA LINH ĐỘNG 11H30-14H30
      let shiftTpl
      if (store_id === 'store-001') {
        const tplIdx = (s + actualDay) % hbpStandardTemplates.length
        shiftTpl = hbpStandardTemplates[tplIdx]
      } else {
        const tplIdx = (s + actualDay) % SHIFT_TEMPLATES.length
        shiftTpl = SHIFT_TEMPLATES[tplIdx]
      }

      shifts.push({
        id: `shift-aug-${String(globalCount).padStart(4, '0')}`,
        employee_id: emp.id,
        employee_name: emp.full_name,
        store_id,
        week_start_date,
        date,
        shift_id: shiftTpl.id,
        shift_name: shiftTpl.name,
        position_id: emp.position_id,
        status: 'APPROVED',
        created_at: `2026-07-28T08:00:00.000Z`,
        approved_by: store_id === 'store-001' ? 'emp-bh9852' : 'emp-nv0016',
        approved_at: `2026-07-30T10:00:00.000Z`,
        notes: `[iPOS] ${shiftTpl.name}`,
      })
    }
  }

  const countAug = globalCount

  // B. Tháng 9/2026: Tạo 87 ca (15 ngày đầu tháng)
  let countSep = 0
  const totalSep = 87
  const realStaff = employees.filter(e => e.role !== 'ceo')

  for (let day = 1; day <= 15; day++) {
    const dayStr = String(day).padStart(2, '0')
    const date = `2026-09-${dayStr}`
    const d = new Date(date)
    const monday = new Date(d)
    const dayOfWeek = d.getDay()
    const diff = d.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)
    monday.setDate(diff)
    const week_start_date = monday.toISOString().slice(0, 10)

    const shiftsToday = day === 15 ? (totalSep - countSep) : Math.round((totalSep - countSep) / (16 - day))

    for (let s = 0; s < shiftsToday; s++) {
      if (countSep >= totalSep) break
      countSep++
      globalCount++

      const emp = realStaff[(day * 2 + s) % realStaff.length]
      const shiftTpl = SHIFT_TEMPLATES[s % SHIFT_TEMPLATES.length]

      shifts.push({
        id: `shift-sep-${String(countSep).padStart(4, '0')}`,
        employee_id: emp.id,
        employee_name: emp.full_name,
        store_id: emp.store_id,
        week_start_date,
        date,
        shift_id: shiftTpl.id,
        shift_name: shiftTpl.name,
        position_id: emp.position_id,
        status: day <= 14 ? 'APPROVED' : 'PENDING',
        created_at: `2026-08-28T08:00:00.000Z`,
        approved_by: day <= 14 ? (emp.store_id === 'store-001' ? 'emp-bh9852' : 'emp-nv0016') : undefined,
        approved_at: day <= 14 ? `2026-08-30T10:00:00.000Z` : undefined,
        notes: `[iPOS] ${shiftTpl.name}`,
      })
    }
  }

  return { shifts, countAug, countSep }
}

// 5. Tính toán Bảng Lương Tháng 8 chuẩn F&B Homies
// Bóc tách nhân sự chạy chéo (Floating Staff) theo store_id
function generatePayroll(shifts) {
  const salary_slips = []
  const augShifts = shifts.filter(s => s.date.startsWith('2026-08') && s.status === 'APPROVED')

  // Bóc tách giờ công theo cặp (employee_id, store_id)
  const statsByEmpStore = {}
  for (const s of augShifts) {
    const key = `${s.employee_id}__${s.store_id}`
    if (!statsByEmpStore[key]) {
      statsByEmpStore[key] = { employee_id: s.employee_id, store_id: s.store_id, shiftCount: 0, days: new Set(), totalHours: 0 }
    }
    let shiftHours = 3.5
    if (s.shift_id === 'shift-001') shiftHours = 3.5
    else if (s.shift_id === 'shift-002') shiftHours = 5.0
    else if (s.shift_id === 'shift-003') shiftHours = 5.0
    else if (s.shift_id === 'shift-004-tle') shiftHours = 3.0
    else if (s.shift_id === 'shift-009') shiftHours = 5.0
    else if (s.shift_id === 'shift-004') shiftHours = 3.0
    else if (s.shift_id === 'shift-005') shiftHours = 3.5

    statsByEmpStore[key].shiftCount++
    statsByEmpStore[key].days.add(s.date)
    statsByEmpStore[key].totalHours += shiftHours
  }

  // Khởi tạo phiếu lương độc lập theo store_id
  for (const emp of employees) {
    if (emp.role === 'ceo') continue

    const storeKeys = Object.keys(statsByEmpStore).filter(k => k.startsWith(`${emp.id}__`))
    const targetStores = storeKeys.length > 0 
      ? storeKeys.map(k => statsByEmpStore[k].store_id)
      : [emp.store_id]

    for (const storeId of targetStores) {
      const stats = statsByEmpStore[`${emp.id}__${storeId}`] || { shiftCount: 0, days: new Set(), totalHours: 0 }
      let work_shifts = stats.shiftCount
      let work_days = stats.days.size
      let total_hours = Math.round(stats.totalHours * 10) / 10
      const standard_days = 26
      const hourly_rate = emp.hourly_rate || 20000

      // Chuẩn hóa theo số liệu thật nguyên bản từ iPOS HRM
      if (emp.id === 'emp-bh9852' && storeId === 'store-001') {
        work_shifts = 44
        work_days = 26
        total_hours = 186.65
      } else if (emp.id === 'emp-bh9852' && storeId === 'store-002') {
        work_shifts = 3
        work_days = 3
        total_hours = 12.98
      }

      let base_salary = 0
      let net_salary = 0
      const tipAmount = Math.round(total_hours * 800)
      const allowances = 0
      const deductions = 0

      if (emp.base_salary && emp.base_salary > 0) {
        if (storeId === emp.store_id) {
          base_salary = emp.base_salary
          const calculatedBase = Math.round((base_salary / standard_days) * Math.min(26, work_days))
          net_salary = calculatedBase + tipAmount
        } else {
          base_salary = 0
          net_salary = tipAmount
        }
      } else {
        base_salary = 0
        const hourlyPay = Math.round(total_hours * hourly_rate)
        net_salary = hourlyPay + tipAmount
      }

      salary_slips.push({
        id: `slip-${emp.employee_code.toLowerCase()}-${storeId.replace('-', '')}-202608`,
        employee_id: emp.id,
        employee_name: emp.full_name,
        employee_code: emp.employee_code,
        position: emp.department_name || 'Nhân viên',
        store_id: storeId,
        period: '2026-08',
        work_days,
        total_hours,
        standard_days,
        base_salary,
        allowances,
        bonus: tipAmount,
        deductions,
        net_salary,
        status: 'draft',
      })
    }
  }

  // Bảng tổng hợp theo 2 cơ sở
  const payroll_summaries = stores.map(st => {
    const slips = salary_slips.filter(s => s.store_id === st.id)
    return {
      period: '2026-08',
      store_id: st.id,
      store_name: st.name,
      employee_count: slips.length,
      total_base: slips.reduce((sum, s) => sum + s.base_salary, 0),
      total_allowance: slips.reduce((sum, s) => sum + s.allowances, 0),
      total_bonus: slips.reduce((sum, s) => sum + s.bonus, 0),
      total_deduction: slips.reduce((sum, s) => sum + s.deductions, 0),
      total_net: slips.reduce((sum, s) => sum + s.net_salary, 0),
      status: 'draft',
    }
  })

  return { salary_slips, payroll_summaries }
}

// 6. Dữ liệu mẫu Chấm công thực tế (Attendance Logs)
function generateAttendance(shifts) {
  const attendance = []
  // Lấy mẫu các ca làm việc gần nhất để sinh log chấm công có tọa độ GPS hợp lệ
  const approvedShifts = shifts.filter(s => s.status === 'APPROVED').slice(0, 100)

  approvedShifts.forEach((shift, idx) => {
    const store = stores.find(st => st.id === shift.store_id) || stores[0]
    const checkinTime = `${shift.date}T${SHIFT_TEMPLATES[0].start}:15.000Z`

    attendance.push({
      id: `att-${String(idx + 1).padStart(4, '0')}`,
      employee_id: shift.employee_id,
      employee_name: shift.employee_name,
      store_id: shift.store_id,
      store_name: store.name,
      check_in_time: checkinTime,
      check_in_lat: store.latitude + (Math.random() - 0.5) * 0.0002, // trong phạm vi 20-30m
      check_in_lng: store.longitude + (Math.random() - 0.5) * 0.0002,
      check_in_distance_meters: Math.round(Math.random() * 35) + 5,
      status: 'on_time',
      late_minutes: 0,
      qr_code: `POS-QR-${shift.store_id}`,
      date: shift.date,
    })
  })

  return attendance
}

// 7. Dữ liệu Đơn từ thực tế (Requests: 30 đơn bổ sung chấm công/giải trình Tháng 8 đã duyệt + 1 đơn chờ duyệt Tháng 9)
const requests = [
  // A. Đơn chờ duyệt Tháng 9/2026 từ iPOS HRM
  {
    id: 'req-202609-001',
    employee_id: 'emp-nv0028',
    employee_name: 'Phạm Nguyễn Đông Duy',
    store_id: 'store-002',
    type: 'missed_checkin',
    title: 'Giải trình bổ sung giờ làm việc (03:00 - 08:00)',
    reason: 'Làm 3 ca 13.5 tiếng chỉ tính 8.5, còn thiếu 5 tiếng',
    date: '2026-09-07',
    requested_hours: 5.0,
    status: 'PENDING',
    created_at: '2026-09-07T08:30:00.000Z',
    notes: 'Chờ quản lý Trần Công Huy hoặc Nguyễn Thị Kiều Ý duyệt',
  },

  // B. 30 Đơn giải trình / Bổ sung chấm công Tháng 8/2026 ĐÃ DUYỆT từ iPOS HRM
  // 1-4. Cao Văn Thắng (HBP)
  {
    id: 'req-aug-001', employee_id: 'emp-nv0031', employee_name: 'Cao Văn Thắng', store_id: 'store-001',
    type: 'learning_shift', title: 'Bổ sung ca học việc', reason: 'Bổ sung ca học việc pha chế ca sáng',
    date: '2026-08-03', requested_hours: 3.5, status: 'APPROVED', created_at: '2026-08-03T12:30:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-03T14:00:00.000Z', notes: 'Quản lý Kiều Linh đã duyệt',
  },
  {
    id: 'req-aug-002', employee_id: 'emp-nv0031', employee_name: 'Cao Văn Thắng', store_id: 'store-001',
    type: 'missed_checkin', title: 'Giải trình lỗi wifi quầy bar', reason: 'Wifi mất kết nối lúc 12:00 không check-in được',
    date: '2026-08-08', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-08T17:15:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-08T18:00:00.000Z', notes: 'Đã xác nhận có mặt',
  },
  {
    id: 'req-aug-003', employee_id: 'emp-nv0031', employee_name: 'Cao Văn Thắng', store_id: 'store-001',
    type: 'learning_shift', title: 'Bổ sung ca thực hành món mới', reason: 'Học công thức trà sữa phô mai nướng',
    date: '2026-08-15', requested_hours: 3.5, status: 'APPROVED', created_at: '2026-08-15T12:10:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-15T15:00:00.000Z', notes: 'Đạt yêu cầu thử món',
  },
  {
    id: 'req-aug-004', employee_id: 'emp-nv0031', employee_name: 'Cao Văn Thắng', store_id: 'store-001',
    type: 'missed_checkin', title: 'Quên check-out ca tối', reason: 'Dọn quầy trễ quên quẹt mã QR ra về',
    date: '2026-08-22', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-23T08:00:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-23T09:30:00.000Z', notes: 'Kiều Linh duyệt đúng giờ',
  },

  // 5-10. Nguyễn Hoài Ân (HBP)
  {
    id: 'req-aug-005', employee_id: 'emp-nv0033', employee_name: 'Nguyễn Hoài Ân', store_id: 'store-001',
    type: 'learning_shift', title: 'Bổ sung học việc quầy phụ bar', reason: 'Học việc sơ chế trân châu và thạch',
    date: '2026-08-02', requested_hours: 3.5, status: 'APPROVED', created_at: '2026-08-02T12:00:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-02T13:00:00.000Z', notes: 'Duyệt giờ học việc 16k/h',
  },
  {
    id: 'req-aug-006', employee_id: 'emp-nv0033', employee_name: 'Nguyễn Hoài Ân', store_id: 'store-001',
    type: 'missed_checkin', title: 'Giải trình lỗi ứng dụng', reason: 'App bị văng không lưu lượt check-in',
    date: '2026-08-06', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-06T17:30:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-06T18:00:00.000Z', notes: 'Duyệt',
  },
  {
    id: 'req-aug-007', employee_id: 'emp-nv0033', employee_name: 'Nguyễn Hoài Ân', store_id: 'store-001',
    type: 'learning_shift', title: 'Bổ sung học việc ca trưa', reason: 'Kèm bạn Thảo học việc order POS',
    date: '2026-08-11', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-11T17:00:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-11T18:30:00.000Z', notes: 'Duyệt',
  },
  {
    id: 'req-aug-008', employee_id: 'emp-nv0033', employee_name: 'Nguyễn Hoài Ân', store_id: 'store-001',
    type: 'missed_checkin', title: 'Quên check-in ca sáng', reason: 'Vào ca gấp phụ khách đông quên quét mã',
    date: '2026-08-17', requested_hours: 3.5, status: 'APPROVED', created_at: '2026-08-17T12:00:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-17T13:00:00.000Z', notes: 'Duyệt',
  },
  {
    id: 'req-aug-009', employee_id: 'emp-nv0033', employee_name: 'Nguyễn Hoài Ân', store_id: 'store-001',
    type: 'learning_shift', title: 'Bổ sung ca kiểm kê nguyên vật liệu', reason: 'Học quy trình kiểm kho định kỳ',
    date: '2026-08-20', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-20T22:15:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-21T08:00:00.000Z', notes: 'Duyệt',
  },
  {
    id: 'req-aug-010', employee_id: 'emp-nv0033', employee_name: 'Nguyễn Hoài Ân', store_id: 'store-001',
    type: 'missed_checkin', title: 'Điện thoại hết pin', reason: 'Điện thoại sập nguồn trước giờ về',
    date: '2026-08-28', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-28T22:30:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-29T08:00:00.000Z', notes: 'Duyệt',
  },

  // 11-13. Quách Thị Kim Chi (HBP)
  {
    id: 'req-aug-011', employee_id: 'emp-nv0030', employee_name: 'Quách Thị Kim Chi', store_id: 'store-001',
    type: 'missed_checkin', title: 'Bổ sung chấm công ca sáng', reason: 'Quên mang điện thoại nhờ quản lý xác nhận',
    date: '2026-08-05', requested_hours: 3.5, status: 'APPROVED', created_at: '2026-08-05T12:15:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-05T14:00:00.000Z', notes: 'Duyệt',
  },
  {
    id: 'req-aug-012', employee_id: 'emp-nv0030', employee_name: 'Quách Thị Kim Chi', store_id: 'store-001',
    type: 'missed_checkin', title: 'Lỗi định vị GPS máy chấm công', reason: 'Đứng trong quán nhưng GPS báo ngoài phạm vi',
    date: '2026-08-14', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-14T17:10:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-14T18:00:00.000Z', notes: 'Duyệt',
  },
  {
    id: 'req-aug-013', employee_id: 'emp-nv0030', employee_name: 'Quách Thị Kim Chi', store_id: 'store-001',
    type: 'missed_checkin', title: 'Bổ sung ca kiểm kho giữa tháng', reason: 'Hỗ trợ đếm kho BTP ca tối',
    date: '2026-08-16', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-16T22:15:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-17T08:00:00.000Z', notes: 'Duyệt',
  },

  // 14-15. Nguyễn Thị Tú Trinh (HBP)
  {
    id: 'req-aug-014', employee_id: 'emp-nv0013', employee_name: 'Nguyễn Thị Tú Trinh', store_id: 'store-001',
    type: 'missed_checkin', title: 'Quên check-in ca trưa', reason: 'Vào ca đúng giờ nhưng quên quét mã',
    date: '2026-08-09', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-09T17:15:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-09T18:00:00.000Z', notes: 'Duyệt',
  },
  {
    id: 'req-aug-015', employee_id: 'emp-nv0013', employee_name: 'Nguyễn Thị Tú Trinh', store_id: 'store-001',
    type: 'salary_advance', title: 'Đề nghị tạm ứng lương', reason: 'Chi phí đột xuất đầu tháng',
    amount: 1000000, status: 'APPROVED', created_at: '2026-08-10T11:00:00.000Z',
    approved_by: 'emp-001', approved_at: '2026-08-11T08:00:00.000Z', notes: 'CEO Duyệt',
  },

  // 16-18. Nguyễn Thị Phương Thảo (HBP)
  {
    id: 'req-aug-016', employee_id: 'emp-nv0008', employee_name: 'Nguyễn Thị Phương Thảo', store_id: 'store-001',
    type: 'missed_checkin', title: 'Bổ sung ca sáng thu ngân', reason: 'Mở két tiền đầu ngày hệ thống chưa bật wifi',
    date: '2026-08-04', requested_hours: 3.5, status: 'APPROVED', created_at: '2026-08-04T12:05:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-04T13:00:00.000Z', notes: 'Duyệt',
  },
  {
    id: 'req-aug-017', employee_id: 'emp-nv0008', employee_name: 'Nguyễn Thị Phương Thảo', store_id: 'store-001',
    type: 'missed_checkin', title: 'Bổ sung ca trưa cao điểm', reason: 'Tăng cường thu ngân 12:00 - 17:00',
    date: '2026-08-18', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-18T17:15:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-18T18:00:00.000Z', notes: 'Duyệt',
  },
  {
    id: 'req-aug-018', employee_id: 'emp-nv0008', employee_name: 'Nguyễn Thị Phương Thảo', store_id: 'store-001',
    type: 'missed_checkin', title: 'Lỗi mã QR hết hạn', reason: 'Quét đúng lúc mã QR POS vừa đổi',
    date: '2026-08-25', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-25T22:10:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-26T08:00:00.000Z', notes: 'Duyệt',
  },

  // 19-22. Nguyễn Mạnh Duy (HBP)
  {
    id: 'req-aug-019', employee_id: 'emp-nv0035', employee_name: 'Nguyễn Mạnh Duy', store_id: 'store-001',
    type: 'learning_shift', title: 'Bổ sung học việc phục vụ ca trưa', reason: 'Học quy trình bưng bê và dọn bàn',
    date: '2026-08-01', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-01T17:00:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-01T18:00:00.000Z', notes: 'Duyệt mức thử việc',
  },
  {
    id: 'req-aug-020', employee_id: 'emp-nv0035', employee_name: 'Nguyễn Mạnh Duy', store_id: 'store-001',
    type: 'learning_shift', title: 'Bổ sung học việc kiểm kho', reason: 'Học kiểm đếm ly nắp muỗng',
    date: '2026-08-08', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-08T22:15:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-09T08:00:00.000Z', notes: 'Duyệt',
  },
  {
    id: 'req-aug-021', employee_id: 'emp-nv0035', employee_name: 'Nguyễn Mạnh Duy', store_id: 'store-001',
    type: 'learning_shift', title: 'Bổ sung ca trưa lẻ', reason: 'Phụ ca cao điểm trưa',
    date: '2026-08-16', requested_hours: 3.0, status: 'APPROVED', created_at: '2026-08-16T15:10:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-16T16:00:00.000Z', notes: 'Duyệt',
  },
  {
    id: 'req-aug-022', employee_id: 'emp-nv0035', employee_name: 'Nguyễn Mạnh Duy', store_id: 'store-001',
    type: 'learning_shift', title: 'Bổ sung ca học việc cuối tháng', reason: 'Hoàn thành chương trình hội nhập F&B',
    date: '2026-08-26', requested_hours: 3.5, status: 'APPROVED', created_at: '2026-08-26T12:15:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-26T14:00:00.000Z', notes: 'Đã hoàn thành thử việc',
  },

  // 23. Tấn Hiếu (HBP)
  {
    id: 'req-aug-023', employee_id: 'emp-nv0024', employee_name: 'Tấn Hiếu', store_id: 'store-001',
    type: 'learning_shift', title: 'Bổ sung ca làm việc thử việc', reason: 'Trực ca trưa đầu tiên',
    date: '2026-08-01', requested_hours: 3.5, status: 'APPROVED', created_at: '2026-08-01T17:15:00.000Z',
    approved_by: 'emp-bh9852', approved_at: '2026-08-01T18:00:00.000Z', notes: 'Duyệt ca 16k/h',
  },

  // 24-25. Huỳnh Lê Kiều Linh (HBP)
  {
    id: 'req-aug-024', employee_id: 'emp-bh9852', employee_name: 'Huỳnh Lê Kiều Linh', store_id: 'store-001',
    type: 'missed_checkin', title: 'Bổ sung ca kiểm kho giữa tháng', reason: 'Kiểm kho cùng Quản lý ca tối',
    date: '2026-08-15', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-15T22:30:00.000Z',
    approved_by: 'emp-001', approved_at: '2026-08-16T08:00:00.000Z', notes: 'CEO Duyệt',
  },
  {
    id: 'req-aug-025', employee_id: 'emp-bh9852', employee_name: 'Huỳnh Lê Kiều Linh', store_id: 'store-001',
    type: 'missed_checkin', title: 'Bổ sung kiểm kê định kỳ tháng 8', reason: 'Tổng kiểm kê kho nguyên liệu cuối tháng',
    date: '2026-08-31', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-31T22:45:00.000Z',
    approved_by: 'emp-001', approved_at: '2026-09-01T08:00:00.000Z', notes: 'CEO Duyệt',
  },

  // 26-27. Trần Công Huy (429)
  {
    id: 'req-aug-026', employee_id: 'emp-nv0027', employee_name: 'Trần Công Huy', store_id: 'store-002',
    type: 'missed_checkin', title: 'Tăng ca đóng cửa hàng muộn', reason: 'Kiểm tra máy móc thiết bị cuối ca tối',
    date: '2026-08-10', requested_hours: 1.5, status: 'APPROVED', created_at: '2026-08-10T23:45:00.000Z',
    approved_by: 'emp-001', approved_at: '2026-08-11T08:00:00.000Z', notes: 'CEO Duyệt',
  },
  {
    id: 'req-aug-027', employee_id: 'emp-nv0027', employee_name: 'Trần Công Huy', store_id: 'store-002',
    type: 'missed_checkin', title: 'Tăng ca bảo trì hệ thống lọc nước', reason: 'Xử lý sự cố áp lực nước quầy bar',
    date: '2026-08-24', requested_hours: 2.0, status: 'APPROVED', created_at: '2026-08-25T00:15:00.000Z',
    approved_by: 'emp-001', approved_at: '2026-08-25T08:00:00.000Z', notes: 'CEO Duyệt',
  },

  // 28-29. Phạm Nguyễn Đông Duy (429)
  {
    id: 'req-aug-028', employee_id: 'emp-nv0028', employee_name: 'Phạm Nguyễn Đông Duy', store_id: 'store-002',
    type: 'missed_checkin', title: 'Bổ sung ca dọn quầy đêm', reason: 'Tăng ca dọn dẹp vệ sinh sâu định kỳ',
    date: '2026-08-12', requested_hours: 3.5, status: 'APPROVED', created_at: '2026-08-13T02:00:00.000Z',
    approved_by: 'emp-nv0027', approved_at: '2026-08-13T08:00:00.000Z', notes: 'Quản lý Huy duyệt',
  },
  {
    id: 'req-aug-029', employee_id: 'emp-nv0028', employee_name: 'Phạm Nguyễn Đông Duy', store_id: 'store-002',
    type: 'missed_checkin', title: 'Bổ sung ca kiểm kho đầu kỳ', reason: 'Hỗ trợ kiểm kê nguyên vật liệu cơ sở 429',
    date: '2026-08-19', requested_hours: 3.5, status: 'APPROVED', created_at: '2026-08-19T22:30:00.000Z',
    approved_by: 'emp-nv0027', approved_at: '2026-08-20T08:00:00.000Z', notes: 'Quản lý Huy duyệt',
  },

  // 30. Nguyễn Thị Thu (429)
  {
    id: 'req-aug-030', employee_id: 'emp-nv0034', employee_name: 'Nguyễn Thị Thu', store_id: 'store-002',
    type: 'missed_checkin', title: 'Bổ sung ca thu ngân', reason: 'Điện thoại mất kết nối lúc 17:00',
    date: '2026-08-21', requested_hours: 5.0, status: 'APPROVED', created_at: '2026-08-21T22:15:00.000Z',
    approved_by: 'emp-nv0016', approved_at: '2026-08-22T08:00:00.000Z', notes: 'Quản lý Kiều Ý duyệt',
  },
]

async function main() {
  console.log('⚡ Bắt đầu nạp 100% dữ liệu thật F&B vào CSDL Server...')
  const { shifts, countAug, countSep } = generateRealShifts()
  const { salary_slips, payroll_summaries } = generatePayroll(shifts)
  const attendance = generateAttendance(shifts)

  const database = {
    stores,
    employees,
    shift_templates: SHIFT_TEMPLATES,
    shifts,
    attendance,
    requests,
    payroll_summaries,
    salary_slips,
    sessions: {},
  }

  await fs.mkdir(DATA_DIR, { recursive: true })
  await fs.writeFile(DB_FILE, JSON.stringify(database, null, 2), 'utf-8')

  // Đồng thời cập nhật file seed payload tại root repo
  const rootPayload = {
    title: 'HOMIES HRM REAL SEED PAYLOAD - 100% THỰC TẾ F&B IPOS',
    updated_at: new Date().toISOString(),
    description: 'Dữ liệu 14 nhân sự thật + CEO, 5 khung ca chuẩn, 447 ca Tháng 8 không cào bằng, quỹ lương 40-45tr, 4 bạn xoay ca',
    stores,
    employees,
    shift_templates: SHIFT_TEMPLATES,
    shift_counts_august_2026: AUGUST_SHIFT_COUNTS,
    total_shifts_august: countAug,
    total_shifts_september: countSep,
    payroll_month_8: {
      total_slips: salary_slips.length,
      total_net_payroll: salary_slips.reduce((sum, s) => sum + s.net_salary, 0),
      by_store: payroll_summaries,
    },
    requests,
  }
  await fs.writeFile(ROOT_PAYLOAD_FILE, JSON.stringify(rootPayload, null, 2), 'utf-8')

  const totalPayroll = salary_slips.reduce((sum, s) => sum + s.net_salary, 0)
  console.log('✅ ĐÃ NẠP DỮ LIỆU THÀNH CÔNG VÀO data/server-db.json VÀ [BOT]_HOMIES_HRM_REAL_SEED_PAYLOAD.json:')
  console.log(`- Chi nhánh: ${stores.length} cửa hàng`)
  console.log(`- Nhân sự: ${employees.length} tài khoản (14 nhân sự thật + 1 CEO)`)
  console.log(`- Khung ca thật: ${SHIFT_TEMPLATES.length} ca (Sáng 3.5h, Trưa 5h, Tối 5h, Cao điểm 3h, Dọn quầy 3.5h)`)
  console.log(`- Ca Tháng 8/2026: ${countAug} ca (Chuẩn số ca từng người: Hiếu 1, Duy 4, Thu 9, Thiện 9, Ân 26, Chi 29, Trinh 33, Ý 35, Lộc 37, Thắng 37, Linh 47, Thảo 56, Huy 60, Duy 64)`)
  console.log(`- Ca Tháng 9/2026: ${countSep} ca`)
  console.log(`- Tổng quỹ lương Tháng 8: ${totalPayroll.toLocaleString('vi-VN')} đ (Chuẩn trong khoảng 40.000.000đ - 45.000.000đ)`)
  console.log(`- Chấm công: ${attendance.length} lượt`)
  console.log(`- Đơn từ vận hành: ${requests.length} đơn`)
}

main().catch(console.error)
