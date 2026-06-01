// ============================================
// HRM Trà Sữa 🧋 — Mock Data: Auth Extensions
// Session, First Login, Role Redirect
// ============================================

export interface SessionConfig {
  id: string
  employee_id: string
  token: string
  refresh_token: string
  device_id: string
  device_name: string
  ip_address: string
  is_active: boolean
  remember_me: boolean
  expires_at: string
  created_at: string
  last_activity: string
}

export interface FirstLoginProfile {
  employee_id: string
  is_first_login: boolean
  required_fields: string[]
  completed_fields: string[]
  profile_photo_url?: string
  emergency_contact?: string
  bank_account?: string
  tax_code?: string
}

export type UserRole = 'ceo' | 'hr_admin' | 'store_manager' | 'shift_leader' | 'employee'

export const roleRedirectMap: Record<UserRole, string> = {
  ceo: '/',
  hr_admin: '/',
  store_manager: '/tasks-menu',
  shift_leader: '/tasks-menu',
  employee: '/',
}

export const roleNavConfig: Record<UserRole, { icon: string; label: string; route: string }[]> = {
  employee: [
    { icon: '🏠', label: 'Trang chủ', route: '/' },
  { icon: '📅', label: 'Lịch làm', route: '/schedules' },
    { icon: '✅', label: 'Chấm công', route: '/checkin' },
    { icon: '💬', label: 'Thông báo', route: '/notifications' },
    { icon: '👤', label: 'Tài khoản', route: '/profile' },
  ],
  shift_leader: [
    { icon: '🏠', label: 'Trang chủ', route: '/' },
    { icon: '📊', label: 'Tác vụ', route: '/tasks-menu' },
    { icon: '🔔', label: 'Thông báo', route: '/notifications' },
    { icon: '👤', label: 'Tài khoản', route: '/profile' },
  ],
  store_manager: [
    { icon: '🏠', label: 'Trang chủ', route: '/' },
    { icon: '📊', label: 'Tác vụ', route: '/tasks-menu' },
    { icon: '🔔', label: 'Thông báo', route: '/notifications' },
    { icon: '👤', label: 'Tài khoản', route: '/profile' },
  ],
  hr_admin: [
    { icon: '🏠', label: 'Trang chủ', route: '/' },
    { icon: '📊', label: 'Tác vụ', route: '/tasks-menu' },
    { icon: '🔔', label: 'Thông báo', route: '/notifications' },
    { icon: '⚙️', label: 'Cài đặt', route: '/settings' },
  ],
  ceo: [
    { icon: '🏠', label: 'Trang chủ', route: '/' },
    { icon: '📊', label: 'Báo cáo', route: '/reports' },
    { icon: '🔔', label: 'Thông báo', route: '/notifications' },
    { icon: '⚙️', label: 'Cài đặt', route: '/settings' },
  ],
}

export const sessionConfig = {
  accessTokenTTL: 15 * 60 * 1000,      // 15 phút
  refreshTokenTTL: 7 * 24 * 60 * 60 * 1000, // 7 ngày
  rememberMeTTL: 30 * 24 * 60 * 60 * 1000,  // 30 ngày
  maxDevices: 3,
  otpLength: 6,
  otpTTL: 5 * 60 * 1000,               // 5 phút
  maxOtpAttempts: 3,
  lockDuration: 5 * 60 * 1000,         // 5 phút lock
}

export const mockSessions: SessionConfig[] = [
  {
    id: 'sess-001', employee_id: 'emp-001', token: 'tok-ceo-001',
    refresh_token: 'ref-ceo-001', device_id: 'dev-iphone-001',
    device_name: 'iPhone 15 Pro', ip_address: '192.168.1.10',
    is_active: true, remember_me: true,
    expires_at: '2026-03-15T00:00:00', created_at: '2026-02-01T08:00:00',
    last_activity: '2026-02-15T14:30:00',
  },
  {
    id: 'sess-002', employee_id: 'emp-002', token: 'tok-mgr-001',
    refresh_token: 'ref-mgr-001', device_id: 'dev-samsung-001',
    device_name: 'Samsung Galaxy S24', ip_address: '192.168.1.20',
    is_active: true, remember_me: false,
    expires_at: '2026-02-22T08:00:00', created_at: '2026-02-15T08:00:00',
    last_activity: '2026-02-15T16:00:00',
  },
]

export const mockFirstLoginProfiles: FirstLoginProfile[] = [
  {
    employee_id: 'emp-015', is_first_login: true,
    required_fields: ['profile_photo', 'emergency_contact', 'bank_account', 'tax_code'],
    completed_fields: [],
  },
  {
    employee_id: 'emp-017', is_first_login: true,
    required_fields: ['profile_photo', 'emergency_contact', 'bank_account', 'tax_code'],
    completed_fields: [],
  },
  {
    employee_id: 'emp-018', is_first_login: false,
    required_fields: ['profile_photo', 'emergency_contact', 'bank_account', 'tax_code'],
    completed_fields: ['profile_photo', 'emergency_contact'],
    profile_photo_url: '/avatars/emp-018.jpg',
    emergency_contact: '0901234888',
  },
  {
    employee_id: 'emp-005', is_first_login: false,
    required_fields: ['profile_photo', 'emergency_contact', 'bank_account', 'tax_code'],
    completed_fields: ['profile_photo', 'emergency_contact', 'bank_account', 'tax_code'],
    profile_photo_url: '/avatars/emp-005.jpg',
    emergency_contact: '0901234000', bank_account: '1234567890', tax_code: '8234567890',
  },
]

// Helpers
export const getSessionByEmployee = (empId: string) =>
  mockSessions.find(s => s.employee_id === empId && s.is_active)

export const getFirstLoginProfile = (empId: string) =>
  mockFirstLoginProfiles.find(p => p.employee_id === empId)

export const isFirstLogin = (empId: string): boolean => {
  const profile = getFirstLoginProfile(empId)
  return profile?.is_first_login ?? true
}
