// ============================================
// HRM TrÃ  Sá»¯a ðŸ§‹ â€” Mock Data for Phase 1
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
  store_id: string
  position_id: string
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

export const mockShifts: Shift[] = [
  { id: 'shift-001', org_id: 'org-001', name: 'Ca sang', start_time: '06:00', end_time: '14:00', color: '#4CAF50' },
  { id: 'shift-002', org_id: 'org-001', name: 'Ca chieu', start_time: '14:00', end_time: '22:00', color: '#2196F3' },
  { id: 'shift-003', org_id: 'org-001', name: 'Ca dem', start_time: '22:00', end_time: '06:00', color: '#9C27B0' },
];

export type Schedule = {
  id: string
  org_id: string
  store_id: string
  employee_id: string
  shift_id: string
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
  leave_request_id?: string
  leave_type?: string
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
// Stores (3 cá»­a hÃ ng TP.HCM)
// ============================================
export const mockStores: Store[] = [
  {
    id: 'store-001',
    org_id: 'org-001',
    name: 'Homies Milk Tea - Nguy?n Hu?',
    address: '123 Nguy?n Hu?, Q.1, TP.HCM',
    latitude: 10.7736,
    longitude: 106.7024,
    checkin_radius_meters: 100,
    phone: '028 1234 5670',
    is_active: true,
  },
  {
    id: 'store-002',
    org_id: 'org-001',
    name: 'Homies Milk Tea - Ph?m V?n ??ng',
    address: '456 Ph?m V?n ??ng, Th? ??c, TP.HCM',
    latitude: 10.8381,
    longitude: 106.6810,
    checkin_radius_meters: 100,
    phone: '028 1234 5671',
    is_active: true,
  },
  {
    id: 'store-003',
    org_id: 'org-001',
    name: 'Homies Milk Tea - L? V?n S?',
    address: '789 L? V?n S?, Q.3, TP.HCM',
    latitude: 10.7845,
    longitude: 106.6679,
    checkin_radius_meters: 100,
    phone: '028 1234 5672',
    is_active: true,
  },
]

// ============================================
// Positions (5 vá»‹ trÃ­)
// ============================================
export const mockPositions: Position[] = [
  { id: 'pos-001', org_id: 'org-001', name: 'Pha ch?', level: 1, base_salary: 5500000 },
  { id: 'pos-002', org_id: 'org-001', name: 'Thu ng?n', level: 1, base_salary: 5000000 },
  { id: 'pos-003', org_id: 'org-001', name: 'Ph?c v?', level: 1, base_salary: 4500000 },
  { id: 'pos-004', org_id: 'org-001', name: 'Ph? qu?n l?', level: 3, base_salary: 8000000 },
  { id: 'pos-005', org_id: 'org-001', name: 'Qu?n l?', level: 4, base_salary: 12000000 },
]

// ============================================
// Employees (15 people)
// ============================================
export const mockEmployees: Employee[] = [
  // CEO
  {
    id: 'emp-001', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-005',
    employee_code: 'BH-001', full_name: 'Nguy?n Minh Tu?n', phone: '0901234567',
    email: 'tuan@bobahouse.vn', date_of_birth: '1990-05-15', gender: 'male',
    address: '100 Nguy?n Du, Q.1, TP.HCM', role: 'ceo', status: 'active',
    hire_date: '2023-01-01', total_points: 5200, gamification_level: 'platinum',
    kpi_level: 'L5',
  },
  // Managers (3)
  {
    id: 'emp-002', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-005',
    employee_code: 'BH-002', full_name: 'Tr?n Th? Lan', phone: '0912345678',
    email: 'lan@bobahouse.vn', date_of_birth: '1995-08-20', gender: 'female',
    address: '200 Tr?n H?ng ??o, Q.1, TP.HCM', role: 'store_manager', status: 'active',
    hire_date: '2023-03-15', total_points: 3800, gamification_level: 'gold',
    kpi_level: 'L4',
  },
  {
    id: 'emp-003', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-005',
    employee_code: 'BH-003', full_name: 'L? Ho?ng Nam', phone: '0923456789',
    email: 'nam@bobahouse.vn', date_of_birth: '1993-11-10', gender: 'male',
    address: '300 Ph?m V?n ??ng, Th? ??c, TP.HCM', role: 'store_manager', status: 'active',
    hire_date: '2023-06-01', total_points: 2900, gamification_level: 'gold',
    kpi_level: 'L4',
  },
  {
    id: 'emp-004', org_id: 'org-001', store_id: 'store-003', position_id: 'pos-004',
    employee_code: 'BH-004', full_name: 'Ph?m Th? H??ng', phone: '0934567890',
    email: 'huong@bobahouse.vn', date_of_birth: '1996-03-25', gender: 'female',
    address: '400 L? V?n S?, Q.3, TP.HCM', role: 'shift_leader', status: 'active',
    hire_date: '2024-01-10', total_points: 2100, gamification_level: 'silver',
    kpi_level: 'L3',
  },
  // Employees (11)
  {
    id: 'emp-005', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-001',
    employee_code: 'BH-005', full_name: 'V? Thanh B?nh', phone: '0945678901',
    email: 'binh@bobahouse.vn', date_of_birth: '2001-07-12', gender: 'male',
    address: '50 B?i Vi?n, Q.1, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2024-06-01', total_points: 1500, gamification_level: 'silver',
    kpi_level: 'L1',
  },
  {
    id: 'emp-006', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-002',
    employee_code: 'BH-006', full_name: 'Nguy?n Th? Mai', phone: '0956789012',
    email: 'mai@bobahouse.vn', date_of_birth: '2002-09-30', gender: 'female',
    address: '60 ?? Th?m, Q.1, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2024-07-15', total_points: 980, gamification_level: 'bronze',
    kpi_level: 'L0',
  },
  {
    id: 'emp-007', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-003',
    employee_code: 'BH-007', full_name: '??ng Minh Khoa', phone: '0967890123',
    email: 'khoa@bobahouse.vn', date_of_birth: '2003-01-05', gender: 'male',
    address: '70 Ph?m Ng? L?o, Q.1, TP.HCM', role: 'employee', status: 'probation',
    hire_date: '2025-12-01', total_points: 320, gamification_level: 'bronze',
    kpi_level: 'L0',
  },
  {
    id: 'emp-008', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-001',
    employee_code: 'BH-008', full_name: 'Hu?nh Th? Ng?c', phone: '0978901234',
    email: 'ngoc@bobahouse.vn', date_of_birth: '2000-04-18', gender: 'female',
    address: '80 Kha V?n C?n, Th? ??c, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2024-04-01', total_points: 2200, gamification_level: 'silver',
    kpi_level: 'L2',
  },
  {
    id: 'emp-009', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-001',
    employee_code: 'BH-009', full_name: 'Tr?n V?n ??c', phone: '0989012345',
    email: 'duc@bobahouse.vn', date_of_birth: '2001-12-22', gender: 'male',
    address: '90 V? V?n Ng?n, Th? ??c, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2024-08-01', total_points: 870, gamification_level: 'bronze',
    kpi_level: 'L2',
  },
  {
    id: 'emp-010', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-002',
    employee_code: 'BH-010', full_name: 'L? Th? Thanh', phone: '0990123456',
    email: 'thanh@bobahouse.vn', date_of_birth: '2002-06-08', gender: 'female',
    address: '100 L? V?n Vi?t, Q.9, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2024-09-15', total_points: 650, gamification_level: 'bronze',
    kpi_level: 'L1',
  },
  {
    id: 'emp-011', org_id: 'org-001', store_id: 'store-002', position_id: 'pos-003',
    employee_code: 'BH-011', full_name: 'Ng? Quang H?i', phone: '0901122334',
    email: 'hai@bobahouse.vn', date_of_birth: '2003-03-14', gender: 'male',
    address: '110 T?ng Nh?n Ph?, Q.9, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2025-01-10', total_points: 410, gamification_level: 'bronze',
    kpi_level: 'L1',
  },
  {
    id: 'emp-012', org_id: 'org-001', store_id: 'store-003', position_id: 'pos-001',
    employee_code: 'BH-012', full_name: 'Mai Th? H?ng', phone: '0912233445',
    email: 'hong@bobahouse.vn', date_of_birth: '2001-10-02', gender: 'female',
    address: '120 C?ch M?ng Th?ng 8, Q.3, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2024-05-20', total_points: 1800, gamification_level: 'silver',
    kpi_level: 'L1',
  },
  {
    id: 'emp-013', org_id: 'org-001', store_id: 'store-003', position_id: 'pos-002',
    employee_code: 'BH-013', full_name: 'B?i V?n Phong', phone: '0923344556',
    email: 'phong@bobahouse.vn', date_of_birth: '2002-02-28', gender: 'male',
    address: '130 L? V?n S?, Q.3, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2024-10-01', total_points: 520, gamification_level: 'bronze',
    kpi_level: 'L1',
  },
  {
    id: 'emp-014', org_id: 'org-001', store_id: 'store-003', position_id: 'pos-003',
    employee_code: 'BH-014', full_name: 'D??ng Th? Linh', phone: '0934455667',
    email: 'linh@bobahouse.vn', date_of_birth: '2003-08-19', gender: 'female',
    address: '140 Tr??ng Sa, Q.3, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2025-02-01', total_points: 180, gamification_level: 'bronze',
    kpi_level: 'L1',
  },
  {
    id: 'emp-015', org_id: 'org-001', store_id: 'store-003', position_id: 'pos-001',
    employee_code: 'BH-015', full_name: 'Phan Qu?c Anh', phone: '0945566778',
    email: 'anh@bobahouse.vn', date_of_birth: '2000-11-25', gender: 'male',
    address: '150 Ho?ng Sa, Q.3, TP.HCM', role: 'employee', status: 'active',
    hire_date: '2024-03-10', total_points: 2600, gamification_level: 'gold',
    kpi_level: 'L1',
  },
  // === Demo onboarding employees ===
  {
    id: 'emp-017', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-002',
    employee_code: 'BH-017', full_name: 'Tran Minh Thuy', phone: '0967788990',
    email: 'thuy@bobahouse.vn', date_of_birth: '2003-07-15', gender: 'female',
    address: '170 Dinh Cong, Q.3, TP.HCM', role: 'employee', status: 'probation',
    hire_date: '2026-06-03', total_points: 0, gamification_level: 'bronze',
    kpi_level: 'L0',
  },
  {
    id: 'emp-018', org_id: 'org-001', store_id: 'store-001', position_id: 'pos-001',
    employee_code: 'BH-018', full_name: 'Le Phuong Nam', phone: '0978899001',
    email: 'nam.p@bobahouse.vn', date_of_birth: '2002-11-08', gender: 'male',
    address: '180 Nguyen Trai, Q.5, TP.HCM', role: 'employee', status: 'probation',
    hire_date: '2026-05-27', total_points: 50, gamification_level: 'bronze',
    kpi_level: 'L0',
  },

]

// ============================================
// Helper: Generate dates for current week
// ============================================
function getWeekDates(weekOffset = 0): string[] {
  const now = new Date()
  const monday = new Date(now)
  monday.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7)
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d.toISOString().split('T')[0]
  })
}

// ============================================
// Schedules (2 weeks)
// ============================================
const thisWeek = getWeekDates(0)
const lastWeek = getWeekDates(-1)

export const mockSchedules: Schedule[] = [
  // Store 1 - This week (simplified: each employee works 5 days)
  ...thisWeek.slice(0, 5).flatMap(date => [
    { id: `sch-${date}-001`, org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-005', shift_id: 'shift-001', date },
    { id: `sch-${date}-002`, org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-006', shift_id: 'shift-001', date },
    { id: `sch-${date}-003`, org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-007', shift_id: 'shift-002', date },
  ]),
  // Store 2 - This week
  ...thisWeek.slice(0, 5).flatMap(date => [
    { id: `sch-${date}-004`, org_id: 'org-001', store_id: 'store-002', employee_id: 'emp-008', shift_id: 'shift-001', date },
    { id: `sch-${date}-005`, org_id: 'org-001', store_id: 'store-002', employee_id: 'emp-009', shift_id: 'shift-002', date },
    { id: `sch-${date}-006`, org_id: 'org-001', store_id: 'store-002', employee_id: 'emp-010', shift_id: 'shift-001', date },
    { id: `sch-${date}-007`, org_id: 'org-001', store_id: 'store-002', employee_id: 'emp-011', shift_id: 'shift-002', date },
  ]),
  // Store 3 - This week
  ...thisWeek.slice(0, 5).flatMap(date => [
    { id: `sch-${date}-008`, org_id: 'org-001', store_id: 'store-003', employee_id: 'emp-012', shift_id: 'shift-001', date },
    { id: `sch-${date}-009`, org_id: 'org-001', store_id: 'store-003', employee_id: 'emp-013', shift_id: 'shift-002', date },
    { id: `sch-${date}-010`, org_id: 'org-001', store_id: 'store-003', employee_id: 'emp-014', shift_id: 'shift-003', date },
    { id: `sch-${date}-011`, org_id: 'org-001', store_id: 'store-003', employee_id: 'emp-015', shift_id: 'shift-001', date },
  ]),
]

// ============================================
// Today's Attendances
// ============================================
const today = new Date().toISOString().split('T')[0]
const todayBase = new Date().toISOString().split('T')[0]

export const mockAttendances: Attendance[] = [
  // Today - Store 1
  {
    id: 'att-001', org_id: 'org-001', employee_id: 'emp-005', store_id: 'store-001', shift_id: 'shift-001',
    date: today, check_in_time: `${todayBase}T07:55:00+07:00`, check_out_time: `${todayBase}T14:05:00+07:00`,
    check_in_lat: 10.7738, check_in_lng: 106.7022, check_in_distance_meters: 25,
    status: 'on_time', late_minutes: 0, total_hours: 6.17, overtime_hours: 0.17,
  },
  {
    id: 'att-002', org_id: 'org-001', employee_id: 'emp-006', store_id: 'store-001', shift_id: 'shift-001',
    date: today, check_in_time: `${todayBase}T08:12:00+07:00`,
    check_in_lat: 10.7735, check_in_lng: 106.7025, check_in_distance_meters: 15,
    status: 'late', late_minutes: 7, total_hours: 0, overtime_hours: 0,
  },
  {
    id: 'att-003', org_id: 'org-001', employee_id: 'emp-007', store_id: 'store-001', shift_id: 'shift-002',
    date: today, status: 'absent', late_minutes: 0, total_hours: 0, overtime_hours: 0,
  },
  // Today - Store 2
  {
    id: 'att-004', org_id: 'org-001', employee_id: 'emp-008', store_id: 'store-002', shift_id: 'shift-001',
    date: today, check_in_time: `${todayBase}T07:50:00+07:00`, check_out_time: `${todayBase}T14:00:00+07:00`,
    check_in_lat: 10.8383, check_in_lng: 106.6808, check_in_distance_meters: 30,
    status: 'on_time', late_minutes: 0, total_hours: 6.17, overtime_hours: 0.17,
  },
  {
    id: 'att-005', org_id: 'org-001', employee_id: 'emp-009', store_id: 'store-002', shift_id: 'shift-002',
    date: today, check_in_time: `${todayBase}T14:03:00+07:00`,
    check_in_lat: 10.8380, check_in_lng: 106.6812, check_in_distance_meters: 20,
    status: 'on_time', late_minutes: 0, total_hours: 0, overtime_hours: 0,
  },
  // Historical - yesterday
  ...(() => {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yd = yesterday.toISOString().split('T')[0]
    return [
      {
        id: 'att-h01', org_id: 'org-001', employee_id: 'emp-005', store_id: 'store-001', shift_id: 'shift-001',
        date: yd, check_in_time: `${yd}T07:58:00+07:00`, check_out_time: `${yd}T14:02:00+07:00`,
        status: 'on_time' as const, late_minutes: 0, total_hours: 6.07, overtime_hours: 0.07,
      },
      {
        id: 'att-h02', org_id: 'org-001', employee_id: 'emp-006', store_id: 'store-001', shift_id: 'shift-001',
        date: yd, check_in_time: `${yd}T07:45:00+07:00`, check_out_time: `${yd}T14:00:00+07:00`,
        status: 'on_time' as const, late_minutes: 0, total_hours: 6.25, overtime_hours: 0.25,
      },
    ]
  })(),
  // â”€â”€ Seed: leave attendance records â”€â”€
  {
    id: 'att-leave-001', org_id: 'org-001', employee_id: 'emp-005', store_id: 'store-001',
    date: '2026-02-12', status: 'leave' as const,
    leave_request_id: 'lr-001', leave_type: 'annual',
    late_minutes: 0, total_hours: 8, overtime_hours: 0,
  },
  {
    id: 'att-leave-002', org_id: 'org-001', employee_id: 'emp-009', store_id: 'store-002',
    date: '2026-02-17', status: 'leave' as const,
    leave_request_id: 'lr-004', leave_type: 'sick',
    late_minutes: 0, total_hours: 8, overtime_hours: 0,
  },
  {
    id: 'att-leave-003', org_id: 'org-001', employee_id: 'emp-012', store_id: 'store-003',
    date: '2026-02-14', status: 'leave' as const,
    leave_request_id: 'lr-007', leave_type: 'personal',
    late_minutes: 0, total_hours: 8, overtime_hours: 0,
  },

  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  // Seed: Feb 2026 attendance for payroll engine
  // Workdays: 2,3,4,5,6 | 9,10,11,12,13 | 16,17,18,19,20 | 23,24,25,26,27
  // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
  ...(() => {
    const O = 'org-001'
    type S = 'on_time' | 'late' | 'early' | 'absent' | 'leave'
    const a = (
      id: string, emp: string, store: string, date: string,
      st: S, late: number, hrs: number, ot: number,
      leaveReq?: string, leaveType?: string,
    ): Attendance => ({
      id, org_id: O, employee_id: emp, store_id: store, date,
      status: st, late_minutes: late, total_hours: hrs, overtime_hours: ot,
      ...(st === 'on_time' || st === 'late' || st === 'early' ? {
        check_in_time: st === 'late' ? '08:' + (15 + late).toString().padStart(2, '0') : '07:55',
        check_out_time: ot > 0 ? `${17 + Math.floor(ot)}:00` : '17:00',
      } : {}),
      ...(leaveReq ? { leave_request_id: leaveReq, leave_type: leaveType } : {}),
    })

    const days = ['02','03','04','05','06','09','10','11','13','16','17','18','19','20','23','24','25','26','27']
    let n = 200

    // emp-005: Pha ch?, store-001 - 20 work, 2 leave(annual), 3 late, 10hrs OT
    const e5 = days.map(d => {
      const dt = `2026-02-${d}`
      if (d === '12' || d === '13') return null // leave already seeded for 12; skip 13 too
      if (d === '11') return a(`att-p-${n++}`, 'emp-005', 'store-001', dt, 'leave', 0, 8, 0, 'lr-010', 'annual')
      if (d === '04' || d === '17' || d === '24') return a(`att-p-${n++}`, 'emp-005', 'store-001', dt, 'late', 20, 7.7, 0)
      if (d === '06' || d === '20') return a(`att-p-${n++}`, 'emp-005', 'store-001', dt, 'on_time', 0, 10, 2)
      return a(`att-p-${n++}`, 'emp-005', 'store-001', dt, 'on_time', 0, 8, 0)
    }).filter(Boolean) as Attendance[]

    // emp-006: Pha ch?, store-001 - 22 work, 0 leave, 1 late, 8hrs OT
    const e6 = days.map(d => {
      const dt = `2026-02-${d}`
      if (d === '10') return a(`att-p-${n++}`, 'emp-006', 'store-001', dt, 'late', 15, 7.75, 0)
      if (d === '05' || d === '19' || d === '26') return a(`att-p-${n++}`, 'emp-006', 'store-001', dt, 'on_time', 0, 10, 2)
      if (d === '27') return a(`att-p-${n++}`, 'emp-006', 'store-001', dt, 'on_time', 0, 10, 2)
      return a(`att-p-${n++}`, 'emp-006', 'store-001', dt, 'on_time', 0, 8, 0)
    }).filter(Boolean) as Attendance[]

    // emp-007: Ph?c v?, store-001 - 18 work, 1 absent, 4 late, 0 OT
    const e7 = days.map(d => {
      const dt = `2026-02-${d}`
      if (d === '16') return a(`att-p-${n++}`, 'emp-007', 'store-001', dt, 'absent', 0, 0, 0)
      if (['03','11','18','25'].includes(d)) return a(`att-p-${n++}`, 'emp-007', 'store-001', dt, 'late', 25, 7.6, 0)
      return a(`att-p-${n++}`, 'emp-007', 'store-001', dt, 'on_time', 0, 8, 0)
    }).filter(Boolean) as Attendance[]

    // emp-008: Pha ch?, store-002 - 21 work, 1 leave(sick), 1 late, 6hrs OT
    const e8 = days.map(d => {
      const dt = `2026-02-${d}`
      if (d === '19') return a(`att-p-${n++}`, 'emp-008', 'store-002', dt, 'leave', 0, 8, 0, 'lr-011', 'sick')
      if (d === '09') return a(`att-p-${n++}`, 'emp-008', 'store-002', dt, 'late', 10, 7.8, 0)
      if (d === '06' || d === '20' || d === '27') return a(`att-p-${n++}`, 'emp-008', 'store-002', dt, 'on_time', 0, 10, 2)
      return a(`att-p-${n++}`, 'emp-008', 'store-002', dt, 'on_time', 0, 8, 0)
    }).filter(Boolean) as Attendance[]

    // emp-009: Pha ch?, store-002 - 19 work, 2 leave(sick), 2 late, 4hrs OT
    const e9 = days.map(d => {
      const dt = `2026-02-${d}`
      if (d === '17') return null // already seeded leave for 17
      if (d === '18') return a(`att-p-${n++}`, 'emp-009', 'store-002', dt, 'leave', 0, 8, 0, 'lr-004', 'sick')
      if (d === '05' || d === '23') return a(`att-p-${n++}`, 'emp-009', 'store-002', dt, 'late', 30, 7.5, 0)
      if (d === '13' || d === '27') return a(`att-p-${n++}`, 'emp-009', 'store-002', dt, 'on_time', 0, 10, 2)
      return a(`att-p-${n++}`, 'emp-009', 'store-002', dt, 'on_time', 0, 8, 0)
    }).filter(Boolean) as Attendance[]

    // emp-010: Thu ng?n, store-002 - 22 work, 0 late, 2hrs OT
    const e10 = days.map(d => {
      const dt = `2026-02-${d}`
      if (d === '20') return a(`att-p-${n++}`, 'emp-010', 'store-002', dt, 'on_time', 0, 10, 2)
      return a(`att-p-${n++}`, 'emp-010', 'store-002', dt, 'on_time', 0, 8, 0)
    }).filter(Boolean) as Attendance[]

    // emp-011: Ph?c v?, store-002 - 20 work, 1 absent, 2 late, 0 OT
    const e11 = days.map(d => {
      const dt = `2026-02-${d}`
      if (d === '11') return a(`att-p-${n++}`, 'emp-011', 'store-002', dt, 'absent', 0, 0, 0)
      if (d === '04' || d === '24') return a(`att-p-${n++}`, 'emp-011', 'store-002', dt, 'late', 20, 7.7, 0)
      return a(`att-p-${n++}`, 'emp-011', 'store-002', dt, 'on_time', 0, 8, 0)
    }).filter(Boolean) as Attendance[]

    // emp-012: Pha ch?, store-003 - 19 work, 2 leave (1 personal already seeded), 1 late, 6hrs OT
    const e12 = days.map(d => {
      const dt = `2026-02-${d}`
      if (d === '13') return null // adjacent to 14 leave
      if (d === '09') return a(`att-p-${n++}`, 'emp-012', 'store-003', dt, 'leave', 0, 8, 0, 'lr-012', 'annual')
      if (d === '17') return a(`att-p-${n++}`, 'emp-012', 'store-003', dt, 'late', 15, 7.75, 0)
      if (d === '06' || d === '20' || d === '27') return a(`att-p-${n++}`, 'emp-012', 'store-003', dt, 'on_time', 0, 10, 2)
      return a(`att-p-${n++}`, 'emp-012', 'store-003', dt, 'on_time', 0, 8, 0)
    }).filter(Boolean) as Attendance[]

    // emp-013: Thu ng?n, store-003 - 22 work, 0 leave, 0 late, 4hrs OT
    const e13 = days.map(d => {
      const dt = `2026-02-${d}`
      if (d === '13' || d === '27') return a(`att-p-${n++}`, 'emp-013', 'store-003', dt, 'on_time', 0, 10, 2)
      return a(`att-p-${n++}`, 'emp-013', 'store-003', dt, 'on_time', 0, 8, 0)
    }).filter(Boolean) as Attendance[]

    // emp-014: Ph?c v?, store-003 - 20 work, 1 leave(wedding), 2 late, 0 OT
    const e14 = days.map(d => {
      const dt = `2026-02-${d}`
      if (d === '23') return a(`att-p-${n++}`, 'emp-014', 'store-003', dt, 'leave', 0, 8, 0, 'lr-013', 'wedding')
      if (d === '06' || d === '18') return a(`att-p-${n++}`, 'emp-014', 'store-003', dt, 'late', 20, 7.7, 0)
      return a(`att-p-${n++}`, 'emp-014', 'store-003', dt, 'on_time', 0, 8, 0)
    }).filter(Boolean) as Attendance[]

    return [...e5, ...e6, ...e7, ...e8, ...e9, ...e10, ...e11, ...e12, ...e13, ...e14]
  })(),
]

// ============================================
// Shift Requests
// ============================================
export const mockRequests: ShiftRequest[] = [
  {
    id: 'req-001', org_id: 'org-001', employee_id: 'emp-006',
    type: 'time_off', status: 'pending',
    start_date: thisWeek[4], end_date: thisWeek[4],
    reason: 'Em cÃ³ viá»‡c gia Ä‘Ã¬nh cáº§n giáº£i quyáº¿t áº¡',
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'req-002', org_id: 'org-001', employee_id: 'emp-009',
    type: 'swap', status: 'pending',
    from_schedule_id: `sch-${thisWeek[3]}-005`,
    to_employee_id: 'emp-008',
    reason: 'Em muá»‘n Ä‘á»•i ca vá»›i báº¡n Ngá»c vÃ¬ bá»‹ trÃ¹ng lá»‹ch há»c',
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
  {
    id: 'req-003', org_id: 'org-001', employee_id: 'emp-012',
    type: 'time_off', status: 'approved',
    start_date: lastWeek[2], end_date: lastWeek[2],
    reason: 'Äi khÃ¡m bá»‡nh',
    reviewed_by: 'emp-004', reviewed_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    review_notes: 'Ok em',
    created_at: new Date(Date.now() - 96 * 3600000).toISOString(),
  },
]

// ============================================
// Notifications
// ============================================
export const mockNotifications: Notification[] = [
  {
    id: 'notif-001', employee_id: 'emp-002',
    title: 'YÃªu cáº§u nghá»‰ phÃ©p má»›i',
    body: 'Nguyá»…n Thá»‹ Mai xin nghá»‰ phÃ©p ngÃ y ' + thisWeek[4],
    type: 'request', is_read: false,
    created_at: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'notif-002', employee_id: 'emp-002',
    title: 'NhÃ¢n viÃªn Ä‘i trá»…',
    body: 'Nguyá»…n Thá»‹ Mai check-in trá»… 7 phÃºt',
    type: 'checkin', is_read: false,
    created_at: new Date(Date.now() - 4 * 3600000).toISOString(),
  },
  {
    id: 'notif-003', employee_id: 'emp-005',
    title: 'ðŸŽ‰ Check-in thÃ nh cÃ´ng!',
    body: 'Báº¡n Ä‘Ã£ check-in Ä‘Ãºng giá». +10 Ä‘iá»ƒm!',
    type: 'checkin', is_read: true,
    created_at: new Date(Date.now() - 5 * 3600000).toISOString(),
  },
]

// ============================================
// Helpers
// ============================================
export function getEmployeeById(id: string) {
  return mockEmployees.find(e => e.id === id)
}

export function getStoreById(id: string) {
  return mockStores.find(s => s.id === id)
}

export function getPositionById(id: string) {
  return mockPositions.find(p => p.id === id)
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
          mockSchedules.splice(0, mockSchedules.length, ...parsed)
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

export function publishSmartSchedule(result: {
  weekStart: string
  storeId?: string
  shifts: { startTime: string; endTime: string; employeeId: string; date: string }[]
}) {
  initSchedules()
  const storeId = result.storeId || 'store-001'

  // Calculate the 7 week dates
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
      notes: `Ph?n ca t? ??ng Smart Scheduler (${sh.startTime}-${sh.endTime})`,
      status: 'draft',
    }
  })

  replaceSchedulesForStoreWeek(storeId, weekDates, nextSchedules)
}

export function getShiftById(id: string) {
  return mockShifts.find(s => s.id === id)
}

export function getEmployeesByStore(storeId: string) {
  return mockEmployees.filter(e => e.store_id === storeId)
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
  return mockAttendances.filter(a => a.store_id === storeId && a.date === today)
}

// ============================================
// Schedule CRUD (mutable â€” for manager assignment)
// ============================================
let scheduleCounter = 500

export function getSchedulesByStoreWeek(storeId: string, weekDates: string[]): Schedule[] {
  initSchedules()
  return mockSchedules.filter(s => s.store_id === storeId && weekDates.includes(s.date))
}

export function getScheduleByEmployeeDate(employeeId: string, date: string, storeId?: string): Schedule | undefined {
  initSchedules()
  return mockSchedules.find(schedule =>
    schedule.employee_id === employeeId &&
    schedule.date === date &&
    (!storeId || schedule.store_id === storeId)
  )
}

export function addSchedule(
  storeId: string,
  employeeId: string,
  shiftId: string,
  date: string,
  notes?: string,
  status: 'draft' | 'published' = 'published'
): Schedule {
  initSchedules()
  // Remove existing schedule for this employee+date if any
  const existingIdx = mockSchedules.findIndex(s => s.employee_id === employeeId && s.date === date)
  if (existingIdx !== -1) mockSchedules.splice(existingIdx, 1)

  const record: Schedule = {
    id: `sch-mgr-${scheduleCounter++}`,
    org_id: 'org-001',
    store_id: storeId,
    employee_id: employeeId,
    shift_id: shiftId,
    date,
    notes,
    status,
  }
  mockSchedules.push(record)
  saveSchedulesToStorage()
  return record
}

export function removeSchedule(employeeId: string, date: string): boolean {
  initSchedules()
  const idx = mockSchedules.findIndex(s => s.employee_id === employeeId && s.date === date)
  if (idx === -1) return false
  mockSchedules.splice(idx, 1)
  saveSchedulesToStorage()
  return true
}

export function replaceSchedulesForStoreWeek(storeId: string, weekDates: string[], schedules: Schedule[]): void {
  initSchedules()
  for (let i = mockSchedules.length - 1; i >= 0; i--) {
    const schedule = mockSchedules[i]
    if (schedule.store_id === storeId && weekDates.includes(schedule.date)) {
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
  const sourceSchedules = mockSchedules.filter(s => s.store_id === storeId && fromWeek.includes(s.date))
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

