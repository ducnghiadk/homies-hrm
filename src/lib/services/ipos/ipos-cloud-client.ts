/**
 * iPOS HRM Cloud API Client Service (Direct Cloud Integration - https://hrm.ipos.vn/api/v2)
 * ------------------------------------------------------------------------------------------
 * Tích hợp trực tiếp hệ thống iPOS HRM Cloud từ máy chủ Homies HRM.
 * 
 * Hỗ trợ:
 * 1. Ca làm việc (Schedule): GET /work-schedule/list
 * 2. Chấm công (Attendance): GET /timesheet/list
 * 3. Nhân viên (Employee): GET /employee/list
 * 
 * Cơ chế Fallback an toàn (Safe Fallback):
 * - Nếu chưa cấu hình IPOS_HRM_TOKEN hoặc gọi API bị lỗi/timeout (8s),
 *   tự động kích hoạt cờ `isFallback: true` để chuyển về đọc CSDL nội bộ `data/server-db.json`.
 */

export interface IposCloudConfig {
  baseUrl: string
  token: string
  storeId429: string
  storeIdHbp: string
}

export function getIposCloudConfig(): IposCloudConfig {
  return {
    baseUrl: (process.env.IPOS_HRM_BASE_URL || 'https://hrm.ipos.vn/api/v2').replace(/\/+$/, ''),
    token: (process.env.IPOS_HRM_TOKEN || '').trim(),
    storeId429: process.env.STORE_ID_429 || '42313004-3253-4216-bda0-dcce62a6091b',
    storeIdHbp: process.env.STORE_ID_HBP || '077c43a6-eb3d-4dd1-aab9-a9b390b331a5',
  }
}

/**
 * Kiểm tra xem token iPOS đã được thiết lập hay chưa
 */
export function isIposCloudConfigured(): boolean {
  const config = getIposCloudConfig()
  return Boolean(config.token && config.token.length > 5)
}

/**
 * Ánh xạ mã chi nhánh giữa Homies HRM và iPOS Cloud UUID
 */
export function mapHomiesStoreToIpos(storeId?: string | null): string {
  const config = getIposCloudConfig()
  if (!storeId) return config.storeIdHbp

  const clean = storeId.trim().toLowerCase()
  if (clean === 'store-002' || clean.includes('429')) {
    return config.storeId429
  }
  if (clean === 'store-001' || clean.includes('hbp') || clean.includes('ba phan')) {
    return config.storeIdHbp
  }

  // Nếu đã là UUID
  if (clean === config.storeId429.toLowerCase()) return config.storeId429
  if (clean === config.storeIdHbp.toLowerCase()) return config.storeIdHbp

  return config.storeIdHbp
}

export function mapIposStoreToHomies(iposStoreId?: string | null): string {
  const config = getIposCloudConfig()
  if (!iposStoreId) return 'store-001'

  const clean = iposStoreId.trim().toLowerCase()
  if (clean === config.storeId429.toLowerCase()) {
    return 'store-002'
  }
  if (clean === config.storeIdHbp.toLowerCase()) {
    return 'store-001'
  }

  return 'store-001'
}

/**
 * Header xác thực kép cho iPOS HRM: Bearer Token + Cookie Token
 */
function buildIposHeaders(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`,
    'Cookie': `token=${token}`,
    'Accept': 'application/json, text/plain, */*',
    'User-Agent': 'Homies-HRM-Cloud-Worker/1.0.0 (Windows NT 10.0; Win64; x64)',
    'client-os': 'WEB',
  }
}

export interface IposApiResponse<T> {
  success: boolean
  isFallback: boolean
  data: T[]
  message?: string
  error?: string
}

// ─────────────────────────────────────────────────────────────
// 1. NHÂN VIÊN (EMPLOYEES)
// Endpoint: GET /employee/list
// Mapping:
//  code -> employee_code
//  full_name -> full_name
//  contract_type: FULLTIME -> toan_thoi_gian, PARTTIME -> ban_thoi_gian
// ─────────────────────────────────────────────────────────────
export interface MappedIposEmployee {
  id: string
  employee_code: string
  full_name: string
  contract_type: 'toan_thoi_gian' | 'ban_thoi_gian'
  phone: string
  email: string
  role: 'ceo' | 'hr_admin' | 'store_manager' | 'shift_leader' | 'employee'
  store_id: string
  secondary_store_ids?: string[]
  position_id: string
  department_name?: string
  status: 'active' | 'inactive' | 'probation' | 'resigned'
  account_status: 'chua_kich_hoat' | 'dang_hoat_dong' | 'bi_khoa'
  base_salary?: number
  hourly_rate?: number
  hire_date?: string
  raw_ipos?: Record<string, unknown>
}

export async function fetchIposEmployees(): Promise<IposApiResponse<MappedIposEmployee>> {
  const config = getIposCloudConfig()

  if (!isIposCloudConfigured()) {
    return {
      success: false,
      isFallback: true,
      data: [],
      message: 'Chưa cấu hình IPOS_HRM_TOKEN. Kích hoạt dự phòng dữ liệu CSDL nội bộ.',
    }
  }

  try {
    const url = `${config.baseUrl}/employee/list`
    const res = await fetch(url, {
      method: 'GET',
      headers: buildIposHeaders(config.token),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      throw new Error(`iPOS Cloud HTTP ${res.status}: ${res.statusText}`)
    }

    const json = await res.json()
    const rawList: Record<string, unknown>[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.items)
      ? json.items
      : []

    const mapped: MappedIposEmployee[] = rawList.map((item, idx) => {
      const code = String(item.code || item.employee_code || item.employeeCode || '-').trim()
      const fullName = String(
        item.full_name ||
        (item.first_name && item.last_name ? `${item.first_name} ${item.last_name}` : '') ||
        item.fullName ||
        item.name ||
        'Nhân viên iPOS'
      ).trim()

      const rawContract = String(item.type_id || item.contract_type || item.contractType || item.type || '').toUpperCase()
      const contractType: 'toan_thoi_gian' | 'ban_thoi_gian' =
        rawContract.includes('PART') || rawContract.includes('BAN_THOI_GIAN')
          ? 'ban_thoi_gian'
          : 'toan_thoi_gian'

      const storeId = mapIposStoreToHomies(String(item.store_id || item.storeId || item.store_uuid || ''))

      // Ánh xạ vai trò
      const rawRoleId = String(item.role_id || item.role || '').toUpperCase()
      let role: MappedIposEmployee['role'] = 'employee'
      if (rawRoleId === 'OWNER' || rawRoleId === 'CEO') {
        role = 'ceo'
      } else if (rawRoleId === 'STORE_MANAGER') {
        role = 'store_manager'
      } else if (rawRoleId === 'SHIFT_LEADER') {
        role = 'shift_leader'
      } else if (rawRoleId === 'HR_ADMIN') {
        role = 'hr_admin'
      }

      // Ánh xạ danh sách chi nhánh xoay ca
      const rawWorkingStores = Array.isArray(item.store_working_id) ? item.store_working_id : []
      const mappedStores = rawWorkingStores.map((id) => mapIposStoreToHomies(String(id)))
      const secondaryStoreIds = Array.from(new Set(mappedStores.filter((id) => id !== storeId)))

      // Ánh xạ lương thực tế
      const rawSalary = Number(item.salary) || 0
      const baseSalary = contractType === 'toan_thoi_gian' ? (rawSalary > 1000000 ? rawSalary : 6600000) : 0
      const hourlyRate = contractType === 'ban_thoi_gian' ? (rawSalary > 0 && rawSalary < 1000000 ? rawSalary : 20000) : 0

      // Chuẩn hóa ID
      const empId = code && code !== '-' ? `emp-${code.toLowerCase()}` : `emp-${String(item.id || idx).slice(0, 8)}`

      return {
        id: String(item.id || empId),
        employee_code: code,
        full_name: fullName,
        contract_type: contractType,
        phone: String(item.phone || item.mobile || ''),
        email: String(item.email || `${code.toLowerCase()}@homies.vn`),
        role,
        store_id: storeId,
        secondary_store_ids: secondaryStoreIds,
        position_id: String(item.position_id || item.position || (role === 'store_manager' ? 'pos-002' : 'pos-001')),
        department_name: String(item.department_name || item.department || item.position_name || 'Vận hành cửa hàng'),
        status: item.status === 'WORKING' ? 'active' : 'resigned',
        account_status: 'dang_hoat_dong',
        base_salary: baseSalary,
        hourly_rate: hourlyRate,
        hire_date: String(item.join_date || item.hire_date || item.start_date || new Date().toISOString().slice(0, 10)),
        raw_ipos: item,
      }
    })

    return {
      success: true,
      isFallback: false,
      data: mapped,
      message: `Đã tải thành công ${mapped.length} nhân viên từ iPOS Cloud.`,
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.warn('[iPOS Cloud API] Lỗi khi gọi /employee/list, tự động fallback:', errorMsg)
    return {
      success: false,
      isFallback: true,
      data: [],
      error: errorMsg,
      message: 'Lỗi kết nối iPOS Cloud, tự động sử dụng CSDL nội bộ.',
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 2. CA LÀM VIỆC (WORK SCHEDULE)
// Endpoint: GET /work-schedule/list?store_id={store_id}&from_date={date}&to_date={date}
// Mapping:
//  id -> work_schedule_id
//  employee_name -> employee.full_name
//  start_time, end_time giữ nguyên
//  store_id map 'store-001' (HBP) hoặc 'store-002' (429)
// ─────────────────────────────────────────────────────────────
export interface MappedIposSchedule {
  id: string
  work_schedule_id: string
  employee_id: string
  employee_name: string
  employee: {
    full_name: string
  }
  start_time: string
  end_time: string
  store_id: string
  date: string
  week_start_date: string
  shift_id: string
  shift_name?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
  raw_ipos?: Record<string, unknown>
}

export async function fetchIposWorkSchedule(params: {
  storeId?: string | null
  fromDate?: string | null
  toDate?: string | null
}): Promise<IposApiResponse<MappedIposSchedule>> {
  const config = getIposCloudConfig()

  if (!isIposCloudConfigured()) {
    return {
      success: false,
      isFallback: true,
      data: [],
      message: 'Chưa cấu hình IPOS_HRM_TOKEN. Kích hoạt dự phòng dữ liệu CSDL nội bộ.',
    }
  }

  try {
    const iposStoreId = mapHomiesStoreToIpos(params.storeId)
    const now = new Date()
    const fromDate = params.fromDate || now.toISOString().slice(0, 10)
    const toDate = params.toDate || fromDate

    const query = new URLSearchParams({
      store_id: iposStoreId,
      from_date: fromDate,
      to_date: toDate,
    })

    const url = `${config.baseUrl}/work-schedule/list?${query.toString()}`
    const res = await fetch(url, {
      method: 'GET',
      headers: buildIposHeaders(config.token),
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      throw new Error(`iPOS Cloud HTTP ${res.status}: ${res.statusText}`)
    }

    const json = await res.json()
    const rawList: Record<string, unknown>[] = Array.isArray(json)
      ? json
      : Array.isArray(json?.data)
      ? json.data
      : Array.isArray(json?.items)
      ? json.items
      : []

    const homiesStoreId = mapIposStoreToHomies(iposStoreId)

    const mapped: MappedIposSchedule[] = rawList.map((item, idx) => {
      const scheduleId = String(item.id || item.schedule_id || `ipos-sched-${idx}`)
      const rawShift = (item.shift_data && typeof item.shift_data === 'object' ? item.shift_data : {}) as Record<string, unknown>
      const rawEmp = (
        (item.employee_data && typeof item.employee_data === 'object' ? item.employee_data : null) ||
        (Array.isArray(item.arr_employee_data) && typeof item.arr_employee_data[0] === 'object' ? item.arr_employee_data[0] : null) ||
        (item.employee && typeof item.employee === 'object' ? item.employee : {})
      ) as Record<string, unknown>

      const empName = String(
        rawEmp.full_name ||
        (rawEmp.first_name && rawEmp.last_name ? `${rawEmp.first_name} ${rawEmp.last_name}` : '') ||
        rawEmp.name ||
        item.employee_name ||
        item.employeeName ||
        'Nhân viên'
      ).trim()

      const startTime = String(rawShift.time_start || item.start_time || item.startTime || '08:30')
      const endTime = String(rawShift.time_end || item.end_time || item.endTime || '12:00')
      const shiftName = String(rawShift.name || item.shift_name || `Ca ${startTime}-${endTime}`)
      const schedDate = String(item.date || item.work_date || fromDate)
      const empCode = String(rawEmp.code || item.employee_code || '').trim()
      const empId = empCode && empCode !== '-' ? `emp-${empCode.toLowerCase()}` : String(rawEmp.id || item.employee_id || `emp-${idx}`)

      return {
        id: scheduleId,
        work_schedule_id: scheduleId,
        employee_id: empId,
        employee_name: empName,
        employee: {
          full_name: empName,
        },
        start_time: startTime,
        end_time: endTime,
        store_id: homiesStoreId,
        date: schedDate,
        week_start_date: schedDate,
        shift_id: String(item.shift_id || rawShift.id || 'shift-001'),
        shift_name: shiftName,
        status: (String(item.status || 'APPROVED').toUpperCase() as MappedIposSchedule['status']),
        created_at: String(item.created_at || new Date().toISOString()),
        raw_ipos: item,
      }
    })

    return {
      success: true,
      isFallback: false,
      data: mapped,
      message: `Đã tải thành công ${mapped.length} ca làm việc từ iPOS Cloud.`,
    }
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.warn('[iPOS Cloud API] Lỗi khi gọi /work-schedule/list, tự động fallback:', errorMsg)
    return {
      success: false,
      isFallback: true,
      data: [],
      error: errorMsg,
      message: 'Lỗi kết nối iPOS Cloud, tự động sử dụng CSDL nội bộ.',
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 3. CHẤM CÔNG (TIMESHEET / ATTENDANCE)
// Endpoint: GET /timesheet/list?store_id={store_id}&from_date={date}&to_date={date}&per_page=100
// Mapping:
//  check_in_time -> time_in (đồng thời giữ check_in_time)
//  check_out_time -> time_out (đồng thời giữ check_out_time)
//  status, late_minutes
// ─────────────────────────────────────────────────────────────
export interface MappedIposAttendance {
  id: string
  employee_id: string
  employee_code?: string
  employee_name: string
  store_id: string
  store_name?: string
  shift_id?: string
  shift_name?: string
  time_in?: string
  time_out?: string
  check_in_time: string
  check_out_time?: string
  status: 'on_time' | 'late' | 'early' | 'absent' | 'leave' | 'check_out' | 'checked_out' | 'working' | 'missing_checkout'
  is_late?: boolean
  late_minutes: number
  early_minutes?: number
  total_hours?: number
  date: string
  check_in_lat: number
  check_in_lng: number
  check_in_distance_meters: number
  raw_ipos?: Record<string, unknown>
}

interface TimesheetCacheEntry {
  timestamp: number
  data: IposApiResponse<MappedIposAttendance>
}
const timesheetCache = new Map<string, TimesheetCacheEntry>()
const TIMESHEET_CACHE_TTL_MS = 60 * 1000 // 60 giây

export async function fetchIposTimesheet(params: {
  storeId?: string | null
  fromDate?: string | null
  toDate?: string | null
  forceRefresh?: boolean
}): Promise<IposApiResponse<MappedIposAttendance>> {
  const config = getIposCloudConfig()

  if (!isIposCloudConfigured()) {
    return {
      success: false,
      isFallback: true,
      data: [],
      message: 'Chưa cấu hình IPOS_HRM_TOKEN. Kích hoạt dự phòng dữ liệu CSDL nội bộ.',
    }
  }

  try {
    const now = new Date()
    const fromDate = params.fromDate || now.toISOString().slice(0, 10)
    const toDate = params.toDate || fromDate
    const cacheKey = `${params.storeId || 'ALL'}_${fromDate}_${toDate}`

    // 1. Kiểm tra bộ nhớ đệm tạm thời (Cache 60s)
    if (!params.forceRefresh) {
      const cached = timesheetCache.get(cacheKey)
      if (cached && Date.now() - cached.timestamp < TIMESHEET_CACHE_TTL_MS) {
        return cached.data
      }
    }

    // Xác định danh sách store cần gọi
    const storeIdsToFetch: string[] = []
    if (params.storeId && params.storeId !== 'ALL') {
      storeIdsToFetch.push(mapHomiesStoreToIpos(params.storeId))
    } else {
      storeIdsToFetch.push(config.storeIdHbp, config.storeId429)
    }

    const todayStr = now.toISOString().slice(0, 10)

    // Tải song song tất cả các chi nhánh cùng lúc (Promise.all)
    const results = await Promise.all(
      storeIdsToFetch.map(async (iposStoreId) => {
        try {
          const query = new URLSearchParams({
            store_id: iposStoreId,
            from_date: fromDate,
            to_date: toDate,
          })

          const url = `${config.baseUrl}/timekeeping/list?${query.toString()}`
          const res = await fetch(url, {
            method: 'GET',
            headers: buildIposHeaders(config.token),
            signal: AbortSignal.timeout(25000),
          })

          if (!res.ok) {
            console.warn(`[iPOS Timekeeping] Store ${iposStoreId} HTTP ${res.status}: ${res.statusText}`)
            return []
          }

          const json = await res.json()
          const rawList: Record<string, any>[] = Array.isArray(json)
            ? json
            : Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json?.items)
            ? json.items
            : []

          const homiesStoreId = mapIposStoreToHomies(iposStoreId)
          const storeName = homiesStoreId === 'store-002' ? 'Homies Milk Tea - Đường 429' : 'Homies Milk Tea - Hồ Bá Phấn'
          const storeMapped: MappedIposAttendance[] = []

          for (let idx = 0; idx < rawList.length; idx++) {
            const item = rawList[idx]
            const dateStr = String(item.date || '').slice(0, 10)
            if (!dateStr) continue

            if (fromDate && dateStr < fromDate) continue
            if (toDate && dateStr > toDate) continue

            const empLog = item.employee_info_log || {}
            const empName = [empLog.first_name, empLog.last_name].filter(Boolean).join(' ').trim() || String(item.employee_name || 'Nhân viên')
            const empCode = (empLog.code && empLog.code !== '-') ? String(empLog.code) : undefined
            const empId = String(empLog.id || item.employee_id || `emp-${idx}`)

            const shiftData = item.shift_data || {}
            const shiftName = String(shiftData.name || item.shift_name || 'Ca làm')
            const shiftId = String(shiftData.id || item.shift_id || 'shift-001')

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

            let normalizedStatus: MappedIposAttendance['status'] = 'on_time'
            if (!timeOut && timeIn) {
              normalizedStatus = dateStr < todayStr ? 'missing_checkout' : 'working'
            } else if (isLate) {
              normalizedStatus = 'late'
            } else if (item.status_check_out === 'LEAVE_EARLY') {
              normalizedStatus = 'early'
            }

            let totalHours = 4.0
            if (timeIn && timeOut) {
              const [inH, inM] = timeIn.split(':').map(Number)
              const [outH, outM] = timeOut.split(':').map(Number)
              let durationMin = (outH * 60 + outM) - (inH * 60 + inM)
              if (durationMin < 0) durationMin += 24 * 60
              totalHours = Math.round((durationMin / 60) * 10) / 10
            } else if (shiftData.time_start && shiftData.time_end) {
              const [sh, sm] = shiftData.time_start.split(':').map(Number)
              const [eh, em] = shiftData.time_end.split(':').map(Number)
              let dur = (eh * 60 + em) - (sh * 60 + sm)
              if (dur < 0) dur += 24 * 60
              totalHours = Math.round((dur / 60) * 10) / 10
            }

            const checkInInfo = item.check_in_info || {}

            storeMapped.push({
              id: String(item.id || `ipos-att-${idx}`),
              employee_id: empId,
              employee_code: empCode,
              employee_name: empName,
              store_id: homiesStoreId,
              store_name: storeName,
              shift_id: shiftId,
              shift_name: shiftName,
              time_in: timeIn,
              time_out: timeOut,
              check_in_time: checkInIso,
              check_out_time: checkOutIso,
              status: normalizedStatus,
              is_late: isLate,
              late_minutes: lateMin,
              total_hours: totalHours,
              date: dateStr,
              check_in_lat: Number(checkInInfo.lat || 10.822435),
              check_in_lng: Number(checkInInfo.long || checkInInfo.lng || 106.762649),
              check_in_distance_meters: Number(checkInInfo.distance || 10),
              raw_ipos: item,
            })
          }
          return storeMapped
        } catch (e) {
          console.warn(`[iPOS Timekeeping] Store ${iposStoreId} fetch error:`, e)
          return []
        }
      })
    )

    const allMapped = results.flat()

    const finalResponse: IposApiResponse<MappedIposAttendance> = {
      success: true,
      isFallback: false,
      data: allMapped,
      message: `Đã tải thành công ${allMapped.length} bản ghi chấm công từ iPOS Cloud.`,
    }

    // Lưu vào bộ nhớ đệm
    timesheetCache.set(cacheKey, {
      timestamp: Date.now(),
      data: finalResponse,
    })

    return finalResponse
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.warn('[iPOS Cloud API] Lỗi khi gọi /timekeeping/list, tự động fallback:', errorMsg)
    return {
      success: false,
      isFallback: true,
      data: [],
      error: errorMsg,
      message: 'Lỗi kết nối iPOS Cloud, tự động sử dụng CSDL nội bộ.',
    }
  }
}
