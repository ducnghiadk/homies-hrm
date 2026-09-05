// ============================================
// HRM Trà Sữa 🧋 — Mock Data for Phase 1
// ============================================

export type Organization = {
  id: string
  name: string
  logo_url?: string
}

export type Store = {
  id: string
  org_id: string
  name: string
  address: string
  latitude: number
  longitude: number
  checkin_radius_meters: number
  phone?: string
  is_active: boolean
}

export type Position = {
  id: string
  org_id: string
  name: string
  level: number
  base_salary: number
}

export type Employee = {
  id: string
  org_id: string
  store_id: string                    // Chi nhánh làm việc chính
  secondary_store_ids?: string[]      // Chi nhánh phụ / Hỗ trợ tăng ca
  position_id: string                 // Vị trí chuyên môn chính
  secondary_position_ids?: string[]   // Vị trí kiêm nhiệm
  employee_code: string
  full_name: string
  phone: string
  email: string
  avatar_url?: string
  date_of_birth: string
  gender: 'male' | 'female'
  address: string
  role: 'ceo' | 'hr_admin' | 'store_manager' | 'shift_leader' | 'employee'
  status: 'active' | 'inactive' | 'probation'
  hire_date: string
  total_points: number
  gamification_level: 'bronze' | 'silver' | 'gold' | 'platinum'
  kpi_level?: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5'
}

export type Shift = {
  id: string
  org_id: string
  name: string
  start_time: string
  end_time: string
  color: string
  hours?: number
}

export type Schedule = {
  id: string
  org_id: string
  store_id: string
  employee_id: string
  shift_id: string
  assigned_position_id?: string
  date: string
  notes?: string
  status?: 'draft' | 'published'
  modified_after_publish?: boolean
  change_reason?: string
  updated_by?: string
  updated_at?: string
}

export type Attendance = {
  id: string
  org_id: string
  employee_id: string
  store_id: string
  shift_id?: string
  date: string
  check_in_time?: string
  check_out_time?: string
  check_in_lat?: number
  check_in_lng?: number
  check_out_lat?: number
  check_out_lng?: number
  check_in_photo_url?: string
  check_in_distance_meters?: number
  status: 'on_time' | 'late' | 'early' | 'absent' | 'leave'
  leave_request_id?: string   // link to LeaveRequest
  leave_type?: string         // 'annual' | 'sick' | etc.
  late_minutes: number
  total_hours: number
  overtime_hours: number
}

export type ShiftRequest = {
  id: string
  org_id: string
  employee_id: string
  type: 'swap' | 'time_off'
  status: 'pending' | 'approved' | 'rejected'
  from_schedule_id?: string
  to_employee_id?: string
  start_date?: string
  end_date?: string
  reason: string
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
  created_at: string
}

export type Notification = {
  id: string
  employee_id: string
  title: string
  body: string
  type: string
  is_read: boolean
  created_at: string
}

// ============================================
// Organization
// ============================================
export const mockOrg: Organization = {
  id: 'org-001',
  name: 'Homies Milk Tea',
  logo_url: '/logo.png',
}

// ============================================
// Stores (3 cửa hàng TP.HCM theo đúng danh mục Setting)
// ============================================
export const mockStores: Store[] = [
  {
    id: 'store-001',
    org_id: 'org-001',
    name: 'Homies Milk Tea - Hồ Bá Phấn',
    address: '49 Hồ Bá Phấn, Phước Long A, TP. Thủ Đức, TP.HCM',
    latitude: 10.822435,
    longitude: 106.762649,
    checkin_radius_meters: 100,
    phone: '028 3821 1111',
    is_active: true,
  },
  {
    id: 'store-002',
    org_id: 'org-001',
    name: 'Homies Milk Tea - Đường 429',
    address: '429 Đường 429, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM',
    latitude: 10.7845,
    longitude: 106.6679,
    checkin_radius_meters: 100,
    phone: '028 3822 2222',
    is_active: true,
  },
  {
    id: 'store-003',
    org_id: 'org-001',
    name: 'Homies Milk Tea - Lê Văn Sỹ',
    address: 'Lê Văn Sỹ, Phường Phước Long A, TP. Thủ Đức, TP. Hồ Chí Minh',
    latitude: 10.7340,
    longitude: 106.7220,
    checkin_radius_meters: 120,
    phone: '028 3823 3333',
    is_active: false,
  },
]

export function getStoresList(includeInactive = false): Store[] {
  if (includeInactive) return mockStores
  return mockStores.filter(s => s.is_active !== false)
}

// ============================================
// Positions (Danh mục Chức vụ chuẩn)
// ============================================
export const mockPositions: Position[] = [
  { id: 'pos-001', org_id: 'org-001', name: 'Pha chế', level: 1, base_salary: 5500000 },
  { id: 'pos-002', org_id: 'org-001', name: 'Thu ngân', level: 1, base_salary: 5000000 },
  { id: 'pos-003', org_id: 'org-001', name: 'Phục vụ', level: 1, base_salary: 4500000 },
  { id: 'pos-004', org_id: 'org-001', name: 'Trưởng ca', level: 2, base_salary: 7000000 },
  { id: 'pos-005', org_id: 'org-001', name: 'Quản lý', level: 3, base_salary: 12000000 },
  { id: 'pos-006', org_id: 'org-001', name: 'Quản lý điểm bán hàng', level: 3, base_salary: 12000000 },
  { id: 'pos-007', org_id: 'org-001', name: 'Nhân viên', level: 1, base_salary: 5000000 },
  { id: 'pos-008', org_id: 'org-001', name: 'Chủ thương hiệu', level: 5, base_salary: 25000000 },
  { id: 'pos-009', org_id: 'org-001', name: 'Quản lý nhân sự', level: 4, base_salary: 15000000 },
  { id: 'pos-010', org_id: 'org-001', name: 'Quản lý vùng', level: 4, base_salary: 18000000 },
  { id: 'pos-011', org_id: 'org-001', name: 'Quản lý bộ phận', level: 3, base_salary: 12000000 },
]

// ============================================
// Shifts (Ca làm việc chuẩn)
// ============================================
export const mockShifts: Shift[] = [
  { id: 'shift-001', org_id: 'org-001', name: 'Ca Sáng', start_time: '08:00', end_time: '14:00', color: '#2F6FA8' },
  { id: 'shift-002', org_id: 'org-001', name: 'Ca Chiều', start_time: '14:00', end_time: '21:00', color: '#F6C85F' },
  { id: 'shift-003', org_id: 'org-001', name: 'Ca Tối', start_time: '18:00', end_time: '23:00', color: '#001D3D' },
]

export function getShiftById(id?: string) {
  if (!id) return undefined
  return mockShifts.find(s => s.id === id)
}

// ============================================
// Notifications & Requests
// ============================================
export const mockNotifications: Notification[] = [
  {
    id: 'notif-001',
    employee_id: 'emp-002',
    title: 'Yêu cầu nghỉ phép mới',
    body: 'Có yêu cầu nghỉ phép mới cần xem xét',
    type: 'request',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
]

export const mockRequests: ShiftRequest[] = []

// ============================================
// Employees (Nhân sự chính thức Homies)
// ============================================
export const mockEmployees: Employee[] = [
  // CEO & Ban Giám Đốc
  {
    id: 'emp-001', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-005',
    employee_code: 'BH-001', full_name: 'Nguyễn Đức Nghĩa', phone: '0901234567',
    email: 'tuan@bobahouse.vn', date_of_birth: '1990-05-15', gender: 'male',
    address: '100 Nguyễn Du, Q.1, TP.HCM', role: 'ceo', status: 'active',
    hire_date: '2023-01-01', total_points: 5200, gamification_level: 'platinum',
    kpi_level: 'L5',
  },
  // Nhân sự Homies Milk Tea - Đường 429 & Hồ Bá Phấn (Chuẩn mã thực tế)
  {
    id: 'e04b5c70-97e2-4061-8bef-0fae5563a066', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-001',
    employee_code: 'BH-0913', full_name: 'Huỳnh Lê Kiều Linh', phone: '0779554540',
    email: 'huynhlekieulinh6@gmail.com', date_of_birth: '1998-07-12', gender: 'female',
    address: '429 Phước Long A, TP. Thủ Đức, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2024-03-01', total_points: 1500, gamification_level: 'silver',
    kpi_level: 'L2',
  },
  {
    id: 'f747f06f-9e95-406e-a5b5-0f6571dbfaa4', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-001',
    employee_code: 'NV0028', full_name: 'Phạm Nguyễn Đông Duy', phone: '0943749525',
    email: 'phamnguyendongduy2020@gmail.com', date_of_birth: '2005-12-21', gender: 'male',
    address: '160 Cầu Xây, Phường Tăng Nhơn Phú, TP. Thủ Đức, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2026-04-25', total_points: 1800, gamification_level: 'silver',
    kpi_level: 'L2',
  },
  {
    id: '2f3acef5-118f-490b-8530-d86aa164b90a', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-001',
    employee_code: 'NV0020', full_name: 'Lê Minh Lộc', phone: '0945576422',
    email: 'lloclm0203@gmail.com', date_of_birth: '2007-01-02', gender: 'male',
    address: 'Hẻm 441, Đường Lê Văn Việt, Phường Tăng Nhơn Phú, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2025-11-30', total_points: 1650, gamification_level: 'silver',
    kpi_level: 'L2',
  },
  {
    id: 'd8b8ecd5-1e74-415b-a739-2fa6bbd81284', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-002',
    employee_code: 'NV0017', full_name: 'Nguyễn Thanh Thiện', phone: '0775943568',
    email: 'nguyenthanhthien2804@gmail.com', date_of_birth: '1999-11-20', gender: 'male',
    address: '7/52 đường 385, Phường Tăng Nhơn Phú, TP. Thủ Đức, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2025-10-21', total_points: 1700, gamification_level: 'silver',
    kpi_level: 'L2',
  },
  {
    id: '10a4897f-9936-41a7-804f-8a4556eaaf0c', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-005',
    employee_code: 'NV0016', full_name: 'Nguyễn Thị Kiều Ý', phone: '0378410208',
    email: 'kieuy4052007@gmail.com', date_of_birth: '1997-08-14', gender: 'female',
    address: '429 Đường 429, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM', role: 'store_manager', status: 'active',
    hire_date: '2025-10-05', total_points: 2500, gamification_level: 'gold',
    kpi_level: 'L3',
  },
  {
    id: '9392ab72-eacc-4211-a0b3-a183c0db75d5', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-005',
    employee_code: 'NV0027', full_name: 'Trần Công Huy', phone: '0332151527',
    email: 'jinn.wooo.02@gmail.com', date_of_birth: '1999-02-21', gender: 'male',
    address: '21/2A đường 388, Phường Phước Long, TP. Thủ Đức, TP.HCM', role: 'store_manager', status: 'active',
    hire_date: '2026-04-05', total_points: 2200, gamification_level: 'gold',
    kpi_level: 'L3',
  },
]

// ============================================
// Schedules & Attendances mutable storage
// ============================================
export const mockSchedules: Schedule[] = []
export const mockAttendances: Attendance[] = []

export const STORE_UUID_MAP: Record<string, string> = {
  'c0111111-1111-1111-1111-111111111111': 'store-001',
  'c0222222-2222-2222-2222-222222222222': 'store-002',
  'c0333333-3333-3333-3333-333333333333': 'store-003',
}

export const REVERSE_STORE_UUID_MAP: Record<string, string> = {
  'store-001': 'c0111111-1111-1111-1111-111111111111',
  'store-002': 'c0222222-2222-2222-2222-222222222222',
  'store-003': 'c0333333-3333-3333-3333-333333333333',
}

export function isStoreMatch(a?: string, b?: string): boolean {
  if (!a || !b) return false
  if (a === b) return true
  const normA = STORE_UUID_MAP[a] || REVERSE_STORE_UUID_MAP[a] || a
  const normB = STORE_UUID_MAP[b] || REVERSE_STORE_UUID_MAP[b] || b
  if (normA === normB) return true

  const storeA = getStoreById(a)
  const storeB = getStoreById(b)
  if (storeA && storeB && (storeA.id === storeB.id || storeA.name === storeB.name)) return true
  return false
}

const POSITION_UUID_MAP: Record<string, string> = {
  'b0000000-0000-0000-0000-000000000001': 'pos-001',
  'b0000000-0000-0000-0000-000000000002': 'pos-002',
  'b0000000-0000-0000-0000-000000000003': 'pos-003',
  'b0000000-0000-0000-0000-000000000004': 'pos-004',
  'b0000000-0000-0000-0000-000000000005': 'pos-005',
  'b0000000-0000-0000-0000-000000000006': 'pos-006',
  'b0000000-0000-0000-0000-000000000007': 'pos-007',
  'b0000000-0000-0000-0000-000000000008': 'pos-008',
  'b0000000-0000-0000-0000-000000000009': 'pos-009',
  'b0000000-0000-0000-0000-000000000010': 'pos-010',
  'b0000000-0000-0000-0000-000000000011': 'pos-011',
}

export function getEmployeeById(id?: string) {
  if (!id) return undefined
  const direct = mockEmployees.find(e => e.id === id || e.employee_code === id || (e.email && e.email.toLowerCase() === id.toLowerCase()))
  if (direct) return direct

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('hrm_employees_db')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const matched = parsed.find((e: Partial<Employee>) => e.id === id || e.employee_code === id || (e.email && e.email.toLowerCase() === id.toLowerCase()))
          if (matched) return matched as Employee
        }
      }
    } catch {}
  }
  return undefined
}

export function getStoreById(id?: string) {
  if (!id) return undefined
  const resolvedId = STORE_UUID_MAP[id] || id
  return mockStores.find(s => s.id === resolvedId || s.id === id)
}

export function getPositionById(id?: string) {
  if (!id) return undefined
  const resolvedId = POSITION_UUID_MAP[id] || id
  return mockPositions.find(p => p.id === resolvedId || p.id === id)
}

let schedulesInitialized = false

export function initSchedules() {
  if (schedulesInitialized) return
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('homies_schedules')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) {
          const seenIds = new Set<string>()
          const deduplicated: Schedule[] = []

          parsed.forEach((s: Schedule, idx: number) => {
            if (!s) return
            let id = s.id
            if (!id || seenIds.has(id)) {
              id = `sch-unique-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`
              s.id = id
            }
            seenIds.add(id)
            deduplicated.push(s)
          })

          mockSchedules.splice(0, mockSchedules.length, ...deduplicated)
        }
      } catch (e) {
        console.error('Failed to parse saved schedules', e)
      }
    }
    schedulesInitialized = true
  }
}

export function saveSchedulesToStorage() {
  if (typeof window !== 'undefined') {
    localStorage.setItem('homies_schedules', JSON.stringify(mockSchedules))
  }
}

export function getSchedulesByStoreWeek(storeId: string, weekDates: string[]): Schedule[] {
  initSchedules()
  return mockSchedules.filter(s => isStoreMatch(s.store_id, storeId) && weekDates.includes(s.date))
}

export function getScheduleByEmployeeDate(employeeId: string, date: string, storeId?: string): Schedule | undefined {
  initSchedules()
  return mockSchedules.find(schedule =>
    schedule.employee_id === employeeId &&
    schedule.date === date &&
    (!storeId || isStoreMatch(schedule.store_id, storeId))
  )
}

export function publishSmartSchedule(result: {
  weekStart: string
  storeId?: string
  shifts: { startTime: string; endTime: string; employeeId: string; date: string }[]
}) {
  initSchedules()
  const storeId = result.storeId || 'store-001'

  const weekDates: string[] = []
  const monday = new Date(result.weekStart)
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    weekDates.push(d.toISOString().split('T')[0])
  }

  const nextSchedules: Schedule[] = result.shifts.map((sh, idx) => {
    const hour = parseInt(sh.startTime.split(':')[0]) || 7
    let shiftId = 'shift-001'
    if (hour >= 12 && hour < 17) shiftId = 'shift-002'
    else if (hour >= 17) shiftId = 'shift-003'

    return {
      id: `sch-smart-${Date.now()}-${idx}`,
      org_id: 'org-001',
      store_id: storeId,
      employee_id: sh.employeeId,
      shift_id: shiftId,
      date: sh.date,
      notes: `Phân ca tự động Smart Scheduler (${sh.startTime}-${sh.endTime})`,
      status: 'draft',
    }
  })

  replaceSchedulesForStoreWeek(storeId, weekDates, nextSchedules)
}

export function getEmployeesByStore(storeId: string) {
  return mockEmployees.filter(e => isStoreMatch(e.store_id, storeId))
}

export function getSchedulesByEmployee(employeeId: string, weekDates: string[]) {
  initSchedules()
  return mockSchedules.filter(s => s.employee_id === employeeId && weekDates.includes(s.date))
}

export function getAllSchedulesByEmployee(employeeId: string): Schedule[] {
  initSchedules()
  return mockSchedules.filter(schedule => schedule.employee_id === employeeId)
}

export function getTodayAttendance(employeeId: string) {
  const today = new Date().toISOString().split('T')[0]
  return mockAttendances.find(a => a.employee_id === employeeId && a.date === today)
}

export function getStoreAttendanceToday(storeId: string) {
  const today = new Date().toISOString().split('T')[0]
  return mockAttendances.filter(a => isStoreMatch(a.store_id, storeId) && a.date === today)
}

export function addSchedule(
  storeId: string,
  employeeId: string,
  shiftId: string,
  date: string,
  notes?: string,
  status: 'draft' | 'published' = 'published',
  assignedPositionId?: string,
  replaceScheduleId?: string
): Schedule {
  initSchedules()
  
  if (replaceScheduleId) {
    const rIdx = mockSchedules.findIndex(s => s.id === replaceScheduleId)
    if (rIdx !== -1) mockSchedules.splice(rIdx, 1)
  } else {
    // Với ca linh hoạt/phát sinh: thay thế ca nếu cùng loại hoặc trùng khung giờ
    const isFlex = shiftId === 'shift-004' || shiftId.startsWith('shift-flex') || (notes && (notes.toLowerCase().includes('linh hoạt') || notes.toLowerCase().includes('phát sinh') || /\[\d{1,2}:\d{2}/.test(notes)))
    const existingIdx = mockSchedules.findIndex(s => {
      if (s.employee_id !== employeeId || s.date !== date) return false
      if (s.shift_id === shiftId) return true
      if (notes && s.notes === notes) return true

      const sIsFlex = s.shift_id === 'shift-004' || s.shift_id.startsWith('shift-flex') || (s.notes && (s.notes.toLowerCase().includes('linh hoạt') || s.notes.toLowerCase().includes('phát sinh') || /\[\d{1,2}:\d{2}/.test(s.notes)))
      if (isFlex && sIsFlex) {
        const newTimeMatch = notes?.match(/\[(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\]/) || notes?.match(/\((\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\)/)
        const oldTimeMatch = s.notes?.match(/\[(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\]/) || s.notes?.match(/\((\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})\)/)
        if (newTimeMatch && oldTimeMatch && newTimeMatch[1] === oldTimeMatch[1] && newTimeMatch[2] === oldTimeMatch[2]) {
          return true
        }
      }
      return false
    })
    if (existingIdx !== -1) mockSchedules.splice(existingIdx, 1)
  }

  const record: Schedule = {
    id: `sch-mgr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    org_id: 'org-001',
    store_id: storeId,
    employee_id: employeeId,
    shift_id: shiftId,
    assigned_position_id: assignedPositionId,
    date,
    notes,
    status,
    updated_at: new Date().toISOString(),
  }
  mockSchedules.push(record)
  saveSchedulesToStorage()
  return record
}

export function removeSchedule(employeeId: string, date: string, scheduleId?: string): boolean {
  initSchedules()
  const idx = mockSchedules.findIndex(s =>
    scheduleId
      ? s.id === scheduleId
      : (s.employee_id === employeeId && s.date === date)
  )
  if (idx === -1) return false
  mockSchedules.splice(idx, 1)
  saveSchedulesToStorage()
  return true
}

export function replaceSchedulesForStoreWeek(storeId: string, weekDates: string[], schedules: Schedule[]): void {
  initSchedules()
  for (let i = mockSchedules.length - 1; i >= 0; i--) {
    const schedule = mockSchedules[i]
    if (isStoreMatch(schedule.store_id, storeId) && weekDates.includes(schedule.date)) {
      mockSchedules.splice(i, 1)
    }
  }

  schedules.forEach(schedule => {
    mockSchedules.push(schedule)
  })

  saveSchedulesToStorage()
}

export function copyWeekSchedules(storeId: string, fromWeek: string[], toWeek: string[]): number {
  initSchedules()
  const sourceSchedules = mockSchedules.filter(s => isStoreMatch(s.store_id, storeId) && fromWeek.includes(s.date))
  let count = 0
  sourceSchedules.forEach(s => {
    const dayIdx = fromWeek.indexOf(s.date)
    if (dayIdx === -1) return
    const targetDate = toWeek[dayIdx]
    if (!targetDate) return
    // Don't overwrite existing
    const exists = mockSchedules.find(x => x.employee_id === s.employee_id && x.date === targetDate)
    if (exists) return
    addSchedule(storeId, s.employee_id, s.shift_id, targetDate, s.notes, 'draft')
    count++
  })
  saveSchedulesToStorage()
  return count
}
