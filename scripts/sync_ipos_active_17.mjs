import fs from 'node:fs'
import path from 'node:path'

// 1. Đọc cấu hình từ .env.local
const envPath = path.resolve(process.cwd(), '.env.local')
if (!fs.existsSync(envPath)) {
  console.error('❌ Không tìm thấy file .env.local')
  process.exit(1)
}

const envContent = fs.readFileSync(envPath, 'utf8')
const env = {}
for (const line of envContent.split('\n')) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/)
  if (match) {
    let value = (match[2] || '').trim()
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1)
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1)
    env[match[1]] = value
  }
}

const token = env.IPOS_HRM_TOKEN
const storeId429 = env.STORE_ID_429 || '42313004-3253-4216-bda0-dcce62a6091b'
const storeIdHbp = env.STORE_ID_HBP || '077c43a6-eb3d-4dd1-aab9-a9b390b331a5'

if (!token) {
  console.error('❌ Không có IPOS_HRM_TOKEN')
  process.exit(1)
}

const headers = {
  'Authorization': `Bearer ${token}`,
  'Cookie': `token=${token}`,
  'Accept': 'application/json, text/plain, */*',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  'client-os': 'WEB',
  'Accept-Language': 'vi',
}

function mapStoreId(iposUuid) {
  if (!iposUuid) return 'store-001'
  const clean = String(iposUuid).toLowerCase()
  if (clean === storeId429.toLowerCase() || clean.includes('429')) return 'store-002'
  if (clean === storeIdHbp.toLowerCase() || clean.includes('hbp') || clean.includes('ba phan')) return 'store-001'
  return 'store-001'
}

async function runSync() {
  console.log('================================================================')
  console.log('🚀 BẮT ĐẦU ĐỒNG BỘ 17 NHÂN SỰ & LỊCH CA TỪ IPOS HRM VÀO HOMIES')
  console.log('================================================================')

  // BƯỚC 1: KÉO TOÀN BỘ NHÂN VIÊN TỪ IPOS HRM
  console.log('📡 Đang kéo danh sách nhân viên từ iPOS Cloud...')
  const resEmp = await fetch('https://hrm.ipos.vn/api/v2/employee/list', { headers })
  if (!resEmp.ok) {
    throw new Error(`Lỗi tải nhân viên từ iPOS: HTTP ${resEmp.status}`)
  }
  const jsonEmp = await resEmp.json()
  const allEmployees = jsonEmp.data || []
  const activeEmployees = allEmployees.filter((e) => e.status === 'WORKING')

  console.log(`✅ Đã tải ${allEmployees.length} hồ sơ, lọc được đúng ${activeEmployees.length} nhân sự đang làm việc.`)

  // Tạo map id mapping (để gắn vào ca làm việc)
  const iposUuidToHomiesId = new Map()
  const codeToHomiesId = new Map()
  const nameToHomiesId = new Map()

  const mappedActiveEmployees = activeEmployees.map((e, idx) => {
    const rawCode = String(e.code || '-').trim()
    const isOwner = e.role_id === 'OWNER' || e.role === 'ceo' || e.email === 'nghianguyen.dk@gmail.com'
    const code = rawCode && rawCode !== '-' ? rawCode : (isOwner ? 'NV-ADMIN' : `NV00${String(idx + 1).padStart(2, '0')}`)
    const empId = code && code !== '-' ? `emp-${code.toLowerCase().replace(/[^a-z0-9]/g, '')}` : `emp-${e.id.slice(0, 8)}`

    iposUuidToHomiesId.set(e.id, empId)
    if (rawCode && rawCode !== '-') codeToHomiesId.set(rawCode, empId)
    nameToHomiesId.set(e.full_name, empId)

    const rawContract = String(e.type_id || '').toUpperCase()
    const isFulltime = rawContract === 'FULLTIME'
    const contractType = isFulltime ? 'toan_thoi_gian' : 'ban_thoi_gian'
    const employeeType = isFulltime ? 'full_time' : 'part_time'

    const storeId = mapStoreId(e.store_id)
    const workingStores = Array.isArray(e.store_working_id) ? e.store_working_id : []
    const mappedStores = workingStores.map(mapStoreId)
    const secondaryStoreIds = Array.from(new Set(mappedStores.filter((id) => id !== storeId)))

    let role = 'employee'
    if (isOwner) role = 'ceo'
    else if (e.role_id === 'STORE_MANAGER') role = 'store_manager'
    else if (e.role_id === 'SHIFT_LEADER') role = 'shift_leader'

    const rawSalary = Number(e.salary) || 0
    const baseSalary = isFulltime ? (rawSalary > 1000000 ? rawSalary : 6600000) : 0
    const hourlyRate = !isFulltime ? (rawSalary > 0 && rawSalary < 1000000 ? rawSalary : 20000) : 0

    return {
      id: empId,
      full_name: e.full_name,
      email: e.email || `${code.toLowerCase()}@homies.vn`,
      password: '123456', // Mật khẩu mặc định hệ thống
      role,
      store_id: storeId,
      secondary_store_ids: secondaryStoreIds,
      position_id: role === 'store_manager' ? 'pos-002' : 'pos-001',
      phone: e.phone || '',
      employee_code: code,
      status: 'active',
      account_status: 'dang_hoat_dong',
      department_name: 'Vận hành cửa hàng',
      base_salary: baseSalary,
      hourly_rate: hourlyRate,
      official_salary: isFulltime ? baseSalary : hourlyRate,
      employee_type: employeeType,
      hire_date: e.join_date || '2026-10-01',
      kpi_level: isFulltime ? 'L4' : 'L2',
      job_level: isFulltime ? 'L4' : 'L2',
      total_points: 3000,
      gamification_level: 'silver',
      is_probationary: false,
    }
  })

  // BƯỚC 2: KÉO LỊCH PHÂN CA THÁNG 10/2026 TỪ CẢ 2 CƠ SỞ
  console.log('\n📡 Đang kéo lịch ca làm việc tháng 10/2026 (HBP & 429)...')
  const fromDate = '2026-10-01'
  const toDate = '2026-10-31'

  const [resSchedHbp, resSched429] = await Promise.all([
    fetch(`https://hrm.ipos.vn/api/v2/work-schedule/list?store_id=${storeIdHbp}&from_date=${fromDate}&to_date=${toDate}`, { headers }),
    fetch(`https://hrm.ipos.vn/api/v2/work-schedule/list?store_id=${storeId429}&from_date=${fromDate}&to_date=${toDate}`, { headers }),
  ])

  const [jsonSchedHbp, jsonSched429] = await Promise.all([
    resSchedHbp.json().catch(() => ({ data: [] })),
    resSched429.json().catch(() => ({ data: [] })),
  ])

  const rawSchedules = [...(jsonSchedHbp.data || []), ...(jsonSched429.data || [])]
  console.log(`✅ Đã tải ${rawSchedules.length} lượt phân ca làm việc từ iPOS Cloud.`)

  const mappedShifts = rawSchedules.map((item, idx) => {
    const rawShift = item.shift_data || {}
    const rawEmp = item.employee_data || (Array.isArray(item.arr_employee_data) && item.arr_employee_data[0]) || item.employee || {}

    const empName = String(
      rawEmp.full_name ||
      (rawEmp.first_name && rawEmp.last_name ? `${rawEmp.first_name} ${rawEmp.last_name}` : '') ||
      rawEmp.name ||
      item.employee_name ||
      'Nhân viên'
    ).trim()

    const rawEmpCode = String(rawEmp.code || '').trim()
    const empId =
      iposUuidToHomiesId.get(item.employee_id) ||
      iposUuidToHomiesId.get(rawEmp.id) ||
      codeToHomiesId.get(rawEmpCode) ||
      nameToHomiesId.get(empName) ||
      (rawEmpCode && rawEmpCode !== '-' ? `emp-${rawEmpCode.toLowerCase()}` : `emp-${String(item.employee_id || idx).slice(0, 8)}`)

    const startTime = String(rawShift.time_start || '08:30')
    const endTime = String(rawShift.time_end || '12:00')
    const shiftName = String(rawShift.name || `Ca ${startTime} - ${endTime}`)
    const schedDate = String(item.date || fromDate)
    const storeId = mapStoreId(item.store_id)

    // Tính week_start_date (Thứ 2 đầu tuần)
    const d = new Date(schedDate)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const monday = new Date(d.setDate(diff))
    const weekStartDate = monday.toISOString().slice(0, 10)

    return {
      id: `shift-ipos-${item.id || idx}`,
      employee_id: empId,
      employee_name: empName,
      store_id: storeId,
      week_start_date: weekStartDate,
      date: schedDate,
      shift_id: String(item.shift_id || rawShift.id || `shift-${idx}`),
      shift_name: shiftName,
      position_id: 'pos-001',
      status: 'APPROVED',
      created_at: new Date().toISOString(),
      start_time: startTime,
      end_time: endTime,
    }
  })

  // BƯỚC 3: KÉO DỮ LIỆU CHẤM CÔNG THỰC TẾ (TIMEKEEPING) TỪ IPOS HRM
  console.log('📡 Đang kéo dữ liệu chấm công từ iPOS Cloud (HBP & 429)...')
  const [attResHbp, attRes429] = await Promise.all([
    fetch(`https://hrm.ipos.vn/api/v2/timekeeping/list?store_id=${storeIdHbp}`, { headers }),
    fetch(`https://hrm.ipos.vn/api/v2/timekeeping/list?store_id=${storeId429}`, { headers }),
  ])
  const attJsonHbp = attResHbp.ok ? await attResHbp.json() : { data: [] }
  const attJson429 = attRes429.ok ? await attRes429.json() : { data: [] }
  const rawAttHbp = attJsonHbp.data || []
  const rawAtt429 = attJson429.data || []

  const rawAllAtt = [
    ...rawAttHbp.map(a => ({ ...a, __store_id: 'store-001' })),
    ...rawAtt429.map(a => ({ ...a, __store_id: 'store-002' })),
  ]

  const mappedAttendance = rawAllAtt.map((item, idx) => {
    const empLog = item.employee_info_log || {}
    const empName = [empLog.first_name, empLog.last_name].filter(Boolean).join(' ').trim() || String(item.employee_name || 'Nhân viên')
    const empCode = (empLog.code && empLog.code !== '-') ? String(empLog.code) : undefined
    const cleanName = empName.toLowerCase().replace(/\s+/g, ' ').trim()
    const foundEmp = mappedActiveEmployees.find(e => 
      (empCode && e.employee_code.toLowerCase() === empCode.toLowerCase()) ||
      (empLog.email && e.email && e.email.toLowerCase() === empLog.email.toLowerCase()) ||
      e.full_name.toLowerCase().replace(/\s+/g, ' ').trim() === cleanName
    )
    const empId = foundEmp ? foundEmp.id : (empLog.id || item.employee_id || `emp-${idx}`)
    const dateStr = String(item.date || '').slice(0, 10)
    const shiftData = item.shift_data || {}
    const timeIn = item.time_check_in ? String(item.time_check_in).slice(0, 5) : ''
    const timeOut = item.time_check_out ? String(item.time_check_out).slice(0, 5) : undefined
    const checkInIso = timeIn ? `${dateStr}T${timeIn}:00` : `${dateStr}T08:30:00`
    const checkOutIso = timeOut ? `${dateStr}T${timeOut}:00` : undefined

    let lateMin = 0
    const statusCheckIn = String(item.status_check_in || '')
    const isLate = statusCheckIn === 'GO_LATE' || String(item.status || '').includes('GO_LATE')
    if (isLate && shiftData.time_start && timeIn) {
      const [sh, sm] = shiftData.time_start.split(':').map(Number)
      const [ih, im] = timeIn.split(':').map(Number)
      const diff = (ih * 60 + im) - (sh * 60 + sm)
      lateMin = diff > 0 ? diff : 5
    }

    let status = 'on_time'
    if (isLate) status = 'late'
    else if (item.status_check_out === 'LEAVE_EARLY') status = 'early'
    else if (!timeOut && timeIn) status = 'working'

    let totalHours = 4.0
    if (timeIn && timeOut) {
      const [inH, inM] = timeIn.split(':').map(Number)
      const [outH, outM] = timeOut.split(':').map(Number)
      let durationMin = (outH * 60 + outM) - (inH * 60 + inM)
      if (durationMin < 0) durationMin += 24 * 60
      totalHours = Math.round((durationMin / 60) * 10) / 10
    }

    return {
      id: String(item.id || `att-${idx}`),
      employee_id: empId,
      employee_code: empCode || foundEmp?.employee_code,
      employee_name: empName,
      store_id: item.__store_id,
      shift_id: String(shiftData.id || item.shift_id || 'shift-001'),
      shift_name: String(shiftData.name || item.shift_name || 'Ca làm'),
      date: dateStr,
      check_in_time: checkInIso,
      check_out_time: checkOutIso,
      time_in: timeIn,
      time_out: timeOut,
      status,
      is_late: isLate,
      late_minutes: lateMin,
      total_hours: totalHours,
      created_at: new Date().toISOString(),
    }
  })

  // BƯỚC 4: CẬP NHẬT VÀO SERVER DATABASE (server-db.json)
  const dbPath = path.resolve(process.cwd(), 'data/server-db.json')
  const backupPath = path.resolve(process.cwd(), 'data/server-db.backup.json')

  let db = {}
  if (fs.existsSync(dbPath)) {
    const raw = fs.readFileSync(dbPath, 'utf8')
    db = JSON.parse(raw)
    // Tạo backup an toàn
    fs.writeFileSync(backupPath, raw, 'utf8')
    console.log(`💾 Đã sao lưu dự phòng: data/server-db.backup.json`)
  }

  // Cập nhật danh sách nhân viên:
  const activeIds = new Set(mappedActiveEmployees.map((e) => e.id))
  const activeCodes = new Set(mappedActiveEmployees.map((e) => e.employee_code.toLowerCase()))

  const existingEmployees = Array.isArray(db.employees) ? db.employees : []
  const updatedExisting = existingEmployees.map((e) => {
    const matchesActive = activeIds.has(e.id) || activeCodes.has((e.employee_code || '').toLowerCase())
    if (!matchesActive) {
      return { ...e, status: 'resigned' }
    }
    return null
  }).filter(Boolean)

  db.employees = [...mappedActiveEmployees, ...updatedExisting]

  // Cập nhật ca làm việc (shifts): Giữ các ca khác tháng 10 và hợp nhất ca tháng 10 từ iPOS
  const existingShifts = Array.isArray(db.shifts) ? db.shifts : []
  const nonOctShifts = existingShifts.filter((s) => !s.date.startsWith('2026-10'))
  db.shifts = [...nonOctShifts, ...mappedShifts]

  // Cập nhật chấm công (attendance):
  db.attendance = mappedAttendance

  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf8')
  console.log(`💾 ĐÃ LƯU THÀNH CÔNG VÀO data/server-db.json!`)

  console.log('\n================================================================')
  console.log('🎉 TỔNG KẾT ĐỒNG BỘ THÀNH CÔNG:')
  console.log('================================================================')
  console.log(`🟢 Nhân viên đang hoạt động (active): ${mappedActiveEmployees.length} người`)
  console.log(`⚪ Nhân viên cũ lưu trữ (resigned):   ${updatedExisting.length} người`)
  console.log(`📅 Tổng số ca làm việc tháng 10/2026:  ${mappedShifts.length} ca`)
  console.log(`⏰ Tổng số lượt chấm công iPOS:       ${mappedAttendance.length} lượt`)
  console.log('================================================================\n')
}

runSync().catch((err) => {
  console.error('❌ Lỗi đồng bộ:', err)
  process.exit(1)
})
