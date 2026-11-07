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
  pin_code?: string
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
  allowed_store_ids?: string[]       // Danh sách các quán nhân viên này được phép nhận ca (chạy chéo)
  secondary_store_ids?: string[]      // Chi nhánh phụ / Hỗ trợ tăng ca (alias)
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
  contract_type?: 'toan_thoi_gian' | 'ban_thoi_gian'  // loại hợp đồng (optional, chỉ cần khi khác default)
  hourly_rate?: number                // Đơn giá giờ cho nhân viên bán thời gian (VNĐ/giờ)
  base_salary?: number                // Lương cơ bản tháng
  official_salary?: number            // Mức lương cơ bản riêng
  resign_date?: string                // Ngày nghỉ việc
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
  employee_name?: string
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
  qr_code?: string
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
    pin_code: '3535',
    phone: '028 3821 1111',
    is_active: true,
  },
  {
    id: 'store-002',
    org_id: 'org-001',
    name: 'Homies Milk Tea - Đường 429',
    address: '429 Đường 429, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM',
    latitude: 10.84478,
    longitude: 106.78652,
    checkin_radius_meters: 100,
    pin_code: '4290',
    phone: '028 3822 2222',
    is_active: true,
  },
  {
    id: 'store-003',
    org_id: 'org-001',
    name: 'Homies Milk Tea - Lê Văn Sỹ (Dự kiến)',
    address: 'Lê Văn Sỹ, Phường Phước Long A, TP. Thủ Đức, TP. Hồ Chí Minh',
    latitude: 10.7340,
    longitude: 106.7220,
    checkin_radius_meters: 120,
    pin_code: '8888',
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
  { id: 'pos-bep', org_id: 'org-001', name: 'Bếp / Chế biến', level: 1, base_salary: 5200000 },
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
  { id: 'shift-001', org_id: 'org-001', name: 'Ca Sáng', start_time: '08:30', end_time: '12:00', color: '#2F6FA8' },
  { id: 'shift-002', org_id: 'org-001', name: 'Ca Trưa', start_time: '12:00', end_time: '17:00', color: '#F6C85F' },
  { id: 'shift-003', org_id: 'org-001', name: 'Ca Tối', start_time: '17:00', end_time: '22:00', color: '#001D3D' },
  { id: 'shift-004', org_id: 'org-001', name: 'Ca Linh động (Phát sinh)', start_time: '11:30', end_time: '14:30', color: '#7C3AED' },
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
    employee_code: 'BH-001', full_name: 'Nguyễn Đức Nghĩa', phone: '0919246273',
    email: 'tuan@bobahouse.vn', date_of_birth: '1990-05-15', gender: 'male',
    address: '100 Nguyễn Du, Q.1, TP.HCM', role: 'ceo', status: 'active',
    hire_date: '2023-01-01', total_points: 5200, gamification_level: 'platinum',
    kpi_level: 'L5', contract_type: 'toan_thoi_gian',
  },
  // 14 Nhân sự thực tế Homies F&B
  {
    id: 'emp-bh9852', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-sm',
    employee_code: 'BH-9852', full_name: 'Huỳnh Lê Kiều Linh', phone: '0779554540',
    email: 'huynhlekieulinh6@gmail.com', date_of_birth: '1998-07-12', gender: 'female',
    address: '429 Phước Long A, TP. Thủ Đức, TP.HCM', role: 'store_manager', status: 'active',
    hire_date: '2024-05-10', total_points: 4200, gamification_level: 'platinum',
    kpi_level: 'L4', contract_type: 'toan_thoi_gian', hourly_rate: 25000,
    allowed_store_ids: ['store-001', 'store-002'],
    secondary_store_ids: ['store-001', 'store-002'],
  },
  {
    id: 'emp-nv0027', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-sm',
    employee_code: 'NV0027', full_name: 'Trần Công Huy', phone: '0332151527',
    email: 'jinn.wooo.02@gmail.com', date_of_birth: '1999-02-21', gender: 'male',
    address: '21/2A đường 388, Phường Phước Long, TP. Thủ Đức, TP.HCM', role: 'store_manager', status: 'active',
    hire_date: '2024-04-01', total_points: 3900, gamification_level: 'gold',
    kpi_level: 'L4', contract_type: 'toan_thoi_gian', base_salary: 6600000, hourly_rate: 31730,
    allowed_store_ids: ['store-001', 'store-002'],
    secondary_store_ids: ['store-001', 'store-002'],
  },
  {
    id: 'emp-nv0028', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-001',
    employee_code: 'NV0028', full_name: 'Phạm Nguyễn Đông Duy', phone: '0943749525',
    email: 'phamnguyendongduy2020@gmail.com', date_of_birth: '2005-12-21', gender: 'male',
    address: '160 Cầu Xây, Phường Tăng Nhơn Phú, TP. Thủ Đức, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2025-01-15', total_points: 1800, gamification_level: 'silver',
    kpi_level: 'L2', contract_type: 'toan_thoi_gian', base_salary: 6600000, hourly_rate: 31730,
    allowed_store_ids: ['store-001', 'store-002'],
    secondary_store_ids: ['store-001', 'store-002'],
  },
  {
    id: 'emp-nv0008', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-004',
    employee_code: 'NV0008', full_name: 'Nguyễn Thị Phương Thảo', phone: '0349439071',
    email: 'nguyenphuongthao4324@gmail.com', date_of_birth: '2004-03-24', gender: 'female',
    address: '89 Hồ Bá Phấn, Phước Long A, TP. Thủ Đức', role: 'shift_leader', status: 'active',
    hire_date: '2025-05-01', total_points: 2100, gamification_level: 'silver',
    kpi_level: 'L3', contract_type: 'toan_thoi_gian', hourly_rate: 28000,
  },
  {
    id: 'emp-nv0024', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-001',
    employee_code: 'NV0024', full_name: 'Tấn Hiếu', phone: '0932835952',
    email: 'tan569619@gmail.com', date_of_birth: '2005-08-10', gender: 'male',
    address: 'TP. Thủ Đức, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2025-08-01', total_points: 1100, gamification_level: 'bronze',
    kpi_level: 'L1', contract_type: 'ban_thoi_gian', hourly_rate: 16000,
  },
  {
    id: 'emp-nv0016', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-sm',
    employee_code: 'NV0016', full_name: 'Nguyễn Thị Kiều Ý', phone: '0378410208',
    email: 'kieuy4052007@gmail.com', date_of_birth: '1997-08-14', gender: 'female',
    address: '429 Đường 429, Tăng Nhơn Phú A, TP. Thủ Đức, TP.HCM', role: 'store_manager', status: 'active',
    hire_date: '2024-06-15', total_points: 2500, gamification_level: 'gold',
    kpi_level: 'L3', contract_type: 'ban_thoi_gian', hourly_rate: 20000,
  },
  {
    id: 'emp-nv0013', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-002',
    employee_code: 'NV0013', full_name: 'Nguyễn Thị Tú Trinh', phone: '0373056852',
    email: 'ngthtutrinh.0504@gmail.com', date_of_birth: '2004-05-04', gender: 'female',
    address: 'TP. Thủ Đức, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2025-02-01', total_points: 1900, gamification_level: 'silver',
    kpi_level: 'L2', contract_type: 'ban_thoi_gian', hourly_rate: 20000,
  },
  {
    id: 'emp-nv0017', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-001',
    employee_code: 'NV0017', full_name: 'Nguyễn Thanh Thiện', phone: '0775943568',
    email: 'nguyenthanhthien2804@gmail.com', date_of_birth: '1999-11-20', gender: 'male',
    address: '7/52 đường 385, Phường Tăng Nhơn Phú, TP. Thủ Đức, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2025-03-01', total_points: 1700, gamification_level: 'silver',
    kpi_level: 'L2', contract_type: 'ban_thoi_gian', hourly_rate: 20000,
  },
  {
    id: 'emp-nv0020', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-003',
    employee_code: 'NV0020', full_name: 'Lê Minh Lộc', phone: '0945576422',
    email: 'lloclm0203@gmail.com', date_of_birth: '2007-01-02', gender: 'male',
    address: 'Hẻm 441, Đường Lê Văn Việt, Phường Tăng Nhơn Phú, TP.HCM', role: 'shift_leader', status: 'active',
    hire_date: '2024-08-20', total_points: 2100, gamification_level: 'gold',
    kpi_level: 'L3', contract_type: 'ban_thoi_gian', hourly_rate: 20000,
    secondary_store_ids: ['store-001', 'store-002'],
  },
  {
    id: 'emp-nv0009', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-002',
    employee_code: 'NV0009', full_name: 'Nguyễn Thị Kiều Trang', phone: '0908123009',
    email: 'kieutrang.homies@gmail.com', date_of_birth: '2003-09-12', gender: 'female',
    address: 'TP. Thủ Đức, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2025-06-01', total_points: 1500, gamification_level: 'silver',
    kpi_level: 'L2', contract_type: 'ban_thoi_gian', hourly_rate: 20000,
  },
  {
    id: 'emp-nv0030', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-001',
    employee_code: 'NV0030', full_name: 'Quách Thị Kim Chi', phone: '0327431568',
    email: 'quachchi0909@gmail.com', date_of_birth: '2005-09-09', gender: 'female',
    address: 'TP. Thủ Đức, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2025-04-10', total_points: 1600, gamification_level: 'silver',
    kpi_level: 'L2', contract_type: 'ban_thoi_gian', hourly_rate: 20000,
  },
  {
    id: 'emp-nv0031', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-001',
    employee_code: 'NV0031', full_name: 'Cao Văn Thắng', phone: '0336675736',
    email: 'vanthangdzai008@gmail.com', date_of_birth: '2004-11-08', gender: 'male',
    address: 'TP. Thủ Đức, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2025-05-15', total_points: 1800, gamification_level: 'silver',
    kpi_level: 'L2', contract_type: 'ban_thoi_gian', hourly_rate: 20000,
  },
  {
    id: 'emp-nv0033', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-001',
    employee_code: 'NV0033', full_name: 'Nguyễn Hoài Ân', phone: '0364136210',
    email: 'hie.agg21@gmail.com', date_of_birth: '2006-03-21', gender: 'male',
    address: 'TP. Thủ Đức, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2025-04-15', total_points: 1400, gamification_level: 'bronze',
    kpi_level: 'L1', contract_type: 'ban_thoi_gian', hourly_rate: 20000,
  },
  {
    id: 'emp-nv0034', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-002',
    employee_code: 'NV0034', full_name: 'Nguyễn Thị Thu', phone: '0963593319',
    email: 'ntthu.work1@gmail.com', date_of_birth: '2004-07-15', gender: 'female',
    address: 'TP. Thủ Đức, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2025-06-01', total_points: 1500, gamification_level: 'silver',
    kpi_level: 'L2', contract_type: 'ban_thoi_gian', hourly_rate: 20000,
    secondary_store_ids: ['store-001', 'store-002'],
  },
  {
    id: 'emp-nv0035', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-001',
    employee_code: 'NV0035', full_name: 'Nguyễn Mạnh Duy', phone: '0377249775',
    email: 'oppoa5301012021@gmail.com', date_of_birth: '2005-01-01', gender: 'male',
    address: 'TP. Thủ Đức, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2025-07-15', total_points: 1300, gamification_level: 'bronze',
    kpi_level: 'L1', contract_type: 'ban_thoi_gian', hourly_rate: 20000,
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
  const cleanId = id.toLowerCase().replace('emp-', '')
  const direct = mockEmployees.find(e => 
    e.id === id || 
    e.employee_code?.toLowerCase() === id.toLowerCase() ||
    e.employee_code?.toLowerCase() === cleanId ||
    e.id.toLowerCase() === cleanId ||
    (e.email && e.email.toLowerCase() === id.toLowerCase())
  )
  if (direct) return direct

  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('hrm_employees_db')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          const matched = parsed.find((e: Partial<Employee>) => 
            e.id === id || 
            e.employee_code === id || 
            e.employee_code?.toLowerCase() === cleanId ||
            (e.email && e.email.toLowerCase() === id.toLowerCase())
          )
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
let isSyncingShifts = false

export function initSchedules() {
  if (schedulesInitialized) return
  schedulesInitialized = true

  if (typeof window !== 'undefined' && !isSyncingShifts) {
    isSyncingShifts = true
    fetch('/api/shifts')
      .then(res => res.ok ? res.json() : null)
      .then(json => {
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          const serverSchedules: Schedule[] = json.data.map((s: Record<string, unknown>) => ({
            id: String(s.id || `sch-${Date.now()}`),
            org_id: 'org-001',
            store_id: String(s.store_id || 'store-001'),
            employee_id: String(s.employee_id || ''),
            shift_id: String(s.shift_id || 'shift-001'),
            assigned_position_id: s.position_id ? String(s.position_id) : undefined,
            date: String(s.date || ''),
            notes: s.notes
              ? String(s.notes)
              : s.shift_name
              ? String(s.shift_name)
              : (s.start_time && s.end_time)
              ? `${s.start_time} - ${s.end_time}`
              : undefined,
            status: String(s.status || '').toLowerCase() === 'approved' ? 'published' : 'draft',
          }))

          if (serverSchedules.length > 0) {
            const seenIds = new Set<string>()
            const deduplicated: Schedule[] = []
            serverSchedules.forEach((s, idx) => {
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
        }
      })
      .catch(err => {
        console.warn('[mock-data] Không thể tải lịch ca từ /api/shifts:', err)
      })
      .finally(() => {
        isSyncingShifts = false
      })
  }
}

export function saveSchedulesToStorage() {
  if (typeof window !== 'undefined') {
    fetch('/api/shifts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockSchedules),
    }).catch(err => {
      console.warn('[mock-data] Lỗi đồng bộ lịch phân ca lên máy chủ (/api/shifts):', err)
    })
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

export function isNightShift(shiftIdOrNotes?: string): boolean {
  const str = (shiftIdOrNotes || '').toLowerCase()
  return str.includes('shift-003') || str.includes('tối') || str.includes('toi') || str.includes('23:00') || str.includes('ca 3') || str.includes('ca-toi')
}

export function isMorningShift(shiftIdOrNotes?: string): boolean {
  const str = (shiftIdOrNotes || '').toLowerCase()
  return str.includes('shift-001') || str.includes('sáng') || str.includes('sang') || str.includes('08:30') || str.includes('08:00') || str.includes('06:30') || str.includes('ca 1') || str.includes('ca-sang')
}

function getShiftDateOffset(dateStr: string, days: number): string {
  try {
    const parts = dateStr.split('-').map(Number)
    if (parts.length === 3) {
      const d = new Date(parts[0], parts[1] - 1, parts[2] + days)
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  } catch {}
  return dateStr
}

export function checkRestPeriodViolation(
  employeeId: string,
  targetDate?: string,
  shiftIdOrNotes?: string
): { hasViolation: boolean; warning?: string } {
  initSchedules()
  if (!targetDate || !employeeId) return { hasViolation: false }

  const nextDate = getShiftDateOffset(targetDate, 1)
  const prevDate = getShiftDateOffset(targetDate, -1)

  const isNight = isNightShift(shiftIdOrNotes)
  const isMorning = isMorningShift(shiftIdOrNotes)

  // 1. Nhận ca tối (kết thúc 23:00) -> kiểm tra sáng hôm sau (06:30) có ca sáng không (< 8 tiếng)
  if (isNight) {
    const nextMorning = mockSchedules.find(
      s => s.employee_id === employeeId && s.date === nextDate && isMorningShift(s.shift_id || s.notes)
    )
    if (nextMorning) {
      return {
        hasViolation: true,
        warning: 'Nhân viên chưa đủ 8 tiếng nghỉ ngơi giữa 2 ca (ca tối nay kết thúc 23:00, sáng mai 06:30 mở quán - chỉ nghỉ 7.5 tiếng)',
      }
    }
  }

  // 2. Nhận ca sáng (bắt đầu 06:30) -> kiểm tra tối hôm trước (kết thúc 23:00) có ca tối không (< 8 tiếng)
  if (isMorning) {
    const prevNight = mockSchedules.find(
      s => s.employee_id === employeeId && s.date === prevDate && isNightShift(s.shift_id || s.notes)
    )
    if (prevNight) {
      return {
        hasViolation: true,
        warning: 'Nhân viên chưa đủ 8 tiếng nghỉ ngơi giữa 2 ca (tối hôm trước làm ca tối đến 23:00, sáng nay 06:30 đã vào ca - chỉ nghỉ 7.5 tiếng)',
      }
    }
  }

  return { hasViolation: false }
}

export function swapSchedulesBetweenEmployees(
  empAId: string,
  empBId: string,
  targetDate?: string,
  shiftNameOrId?: string
): { success: boolean; swappedCount: number; message: string; restWarning?: string } {
  initSchedules()

  // Tìm các ca làm việc của empA và empB trong ngày targetDate
  const schedulesA = mockSchedules.filter(s => s.employee_id === empAId && (!targetDate || s.date === targetDate))
  const schedulesB = mockSchedules.filter(s => s.employee_id === empBId && (!targetDate || s.date === targetDate))

  let schA = schedulesA[0]
  let schB = schedulesB[0]

  if (shiftNameOrId) {
    const matchedA = schedulesA.find(s => s.shift_id === shiftNameOrId || s.notes?.includes(shiftNameOrId))
    if (matchedA) schA = matchedA
    const matchedB = schedulesB.find(s => s.shift_id === shiftNameOrId || s.notes?.includes(shiftNameOrId))
    if (matchedB) schB = matchedB
  }

  let restWarning: string | undefined

  // Kiểm tra vi phạm thời gian nghỉ ngơi cho nhân sự nhận ca
  if (schA && targetDate) {
    const checkB = checkRestPeriodViolation(empBId, targetDate, schA.shift_id || schA.notes || shiftNameOrId)
    if (checkB.hasViolation) {
      restWarning = checkB.warning
    }
  }
  if (schB && targetDate && !restWarning) {
    const checkA = checkRestPeriodViolation(empAId, targetDate, schB.shift_id || schB.notes || shiftNameOrId)
    if (checkA.hasViolation) {
      restWarning = checkA.warning
    }
  }

  const now = new Date().toISOString()

  // Trường hợp cả hai người đều có ca -> Hoán đổi qua lại
  if (schA && schB) {
    schA.employee_id = empBId
    schA.modified_after_publish = true
    schA.change_reason = 'Duyệt đổi ca trực tiếp'
    schA.updated_at = now

    schB.employee_id = empAId
    schB.modified_after_publish = true
    schB.change_reason = 'Duyệt đổi ca trực tiếp'
    schB.updated_at = now

    saveSchedulesToStorage()
    return {
      success: true,
      swappedCount: 2,
      message: 'Đã tự động hoán đổi lịch ca 2 bên trên bảng phân ca tuần!',
      restWarning,
    }
  }

  // Trường hợp A có ca và B làm thay
  if (schA && !schB) {
    schA.employee_id = empBId
    schA.modified_after_publish = true
    schA.change_reason = 'Duyệt chuyển ca làm thay'
    schA.updated_at = now

    saveSchedulesToStorage()
    return {
      success: true,
      swappedCount: 1,
      message: 'Đã tự động chuyển ca làm sang nhân sự nhận thay!',
      restWarning,
    }
  }

  // Trường hợp B có ca và A làm thay
  if (!schA && schB) {
    schB.employee_id = empAId
    schB.modified_after_publish = true
    schB.change_reason = 'Duyệt chuyển ca làm thay'
    schB.updated_at = now

    saveSchedulesToStorage()
    return {
      success: true,
      swappedCount: 1,
      message: 'Đã tự động chuyển ca làm sang nhân sự nhận thay!',
      restWarning,
    }
  }

  return {
    success: false,
    swappedCount: 0,
    message: 'Không tìm thấy ca làm việc cụ thể trên bảng tuần để hoán đổi.',
  }
}
