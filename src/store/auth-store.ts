'use client'

import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import type { EmploymentType, ProbationPolicy, ProbationSalaryMode } from '@/lib/mock-data-employee-ext'

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type UserRole = 'ceo' | 'hr_admin' | 'store_manager' | 'area_manager' | 'shift_leader' | 'employee'

export type AuthUser = {
  id: string
  full_name: string
  email: string
  role: UserRole
  store_id: string
  secondary_store_ids?: string[]
  position_id: string
  secondary_position_ids?: string[]
  avatar_url?: string
  phone: string
  employee_code: string
  // work_status: trang thai lam viec
  status: 'active' | 'inactive' | 'probation' | 'resigned'
  // account_status: trang thai tai khoan (cho phep dang nhap hay khong)
  account_status: 'chua_kich_hoat' | 'dang_hoat_dong' | 'bi_khoa'
  total_points: number
  gamification_level: string
  hire_date: string
  kpi_level?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  address?: string
  cccd?: string
  emergency_contact?: string
  candidate_notes?: string
  department_name?: string
  employee_type?: EmploymentType
  job_level?: string
  official_salary?: number
  kpi_salary?: number
  is_probationary?: boolean
  probation_policy?: ProbationPolicy
  probation_end_date?: string
  probation_salary_mode?: ProbationSalaryMode
  probation_salary_value?: number
  auto_complete_probation?: boolean
  current_address?: string
  bank_name?: string
  bank_account_no?: string
  bank_account_holder?: string
  cccd_issue_date?: string
  tax_code?: string
  base_salary?: number
  hourly_rate?: number
  has_insurance?: boolean
  dependents_count?: number
  marital_status?: string
  ethnicity?: string
  religion?: string
  cccd_front_url?: string
  cccd_back_url?: string
  required_fields_config?: Record<string, boolean>
  _dbSyncError?: string
}

export type LoginResult = {
  success: boolean
  error?: string
}

import { EmployeeService } from '@/lib/services/employee-service'

const AUTH_STORAGE_KEY = 'hrm-auth-v2'

const authStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === 'undefined') return null

    // Ưu tiên đọc từ localStorage để đồng bộ phiên làm việc trên tất cả các tab
    const localValue = localStorage.getItem(name)
    if (localValue) return localValue

    return sessionStorage.getItem(name)
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return

    // Luôn lưu vào cả localStorage (dùng chung mọi tab) và sessionStorage
    try {
      localStorage.setItem(name, value)
    } catch {}
    try {
      sessionStorage.setItem(name, value)
    } catch {}
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return

    try {
      localStorage.removeItem(name)
    } catch {}
    try {
      sessionStorage.removeItem(name)
    } catch {}
  },
}

export function syncAuthCookie(user: AuthUser | null) {
  if (typeof document === 'undefined') return

  const expires = user ? 'Max-Age=2592000' : 'Max-Age=0'
  document.cookie = `hrm-auth=${user ? '1' : '0'}; Path=/; SameSite=Lax; ${expires}`
  document.cookie = `hrm-role=${user?.role || ''}; Path=/; SameSite=Lax; ${expires}`
  document.cookie = `hrm-user-id=${user?.id || ''}; Path=/; SameSite=Lax; ${expires}`
  if (user) {
    document.cookie = `homies_session=homies_sess_${user.id}; Path=/; SameSite=Lax; ${expires}`
  } else {
    document.cookie = `homies_session=; Path=/; SameSite=Lax; Max-Age=0`
    document.cookie = `hrm-role-sig=; Path=/; SameSite=Lax; Max-Age=0`
  }
}

// ─────────────────────────────────────────────
// AUTH STORE (Zustand)
// ─────────────────────────────────────────────

export const DEMO_ACCOUNTS = [
  {
    role: 'ceo' as UserRole,
    name: 'Nguyễn Minh Tuấn',
    email: 'tuan@bobahouse.vn',
    position: 'CEO',
    color: 'bg-primary-500',
    icon: '👑',
  },
  {
    role: 'hr_admin' as UserRole,
    name: 'Hoàng Thị Yến',
    email: 'yen@bobahouse.vn',
    position: 'HR Admin',
    color: 'bg-primary-500',
    icon: '🛡️',
  },
  {
    role: 'store_manager' as UserRole,
    name: 'Trần Thị Lan',
    email: 'lan@bobahouse.vn',
    position: 'Quản lý cửa hàng',
    color: 'bg-success-500',
    icon: '👔',
  },
  {
    role: 'shift_leader' as UserRole,
    name: 'Phạm Thị Hương',
    email: 'huong@bobahouse.vn',
    position: 'Trưởng ca',
    color: 'bg-warning-500',
    icon: '🎯',
  },
  {
    role: 'employee' as UserRole,
    name: 'Võ Thanh Bình',
    email: 'binh@bobahouse.vn',
    position: 'Nhân viên',
    color: 'bg-gray-500',
    icon: '⭐',
  },
  {
    role: 'employee' as UserRole,
    name: 'Đặng Minh Khoa',
    email: 'khoa@bobahouse.vn',
    position: 'Demo onboarding',
    color: 'bg-warning-500',
    icon: '🧋',
  },
]

type AuthState = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  hasHydrated: boolean
  rememberMe: boolean
  loginError: string | null

  // Actions
  setHasHydrated: (val: boolean) => void
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => void
  setRememberMe: (val: boolean) => void
  clearError: () => void
  loginAsRole: (role: UserRole) => void
  loginAsDemo: (email: string) => void
}

// Validate password (chỉ dùng cho chế độ ngoại tuyến khẩn cấp)
const validatePassword = (password: string): boolean => {
  return password === '123456'
}

function getInitialAuthState(): { user: AuthUser | null; isAuthenticated: boolean; hasHydrated: boolean } {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false, hasHydrated: false }
  }
  try {
    const rawLocal = localStorage.getItem(AUTH_STORAGE_KEY)
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal)
      if (parsed?.state?.user?.id) {
        return { user: parsed.state.user, isAuthenticated: true, hasHydrated: true }
      }
    }
    const rawSession = sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (rawSession) {
      const parsed = JSON.parse(rawSession)
      if (parsed?.state?.user?.id) {
        return { user: parsed.state.user, isAuthenticated: true, hasHydrated: true }
      }
    }
    // Dự phòng kiểm tra cookie hrm-auth hợp lệ
    if (typeof document !== 'undefined' && document.cookie.includes('hrm-auth=1')) {
      return { user: null, isAuthenticated: true, hasHydrated: true }
    }
  } catch (err) {
    console.warn('[AuthStore] Error getting initial auth state:', err)
  }
  return { user: null, isAuthenticated: false, hasHydrated: false }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...getInitialAuthState(),
      isLoading: false,
      rememberMe: true,
      loginError: null,

      setHasHydrated: (val: boolean) => {
        set({ hasHydrated: val })
      },

      login: async (email: string, password: string): Promise<LoginResult> => {
        set({ isLoading: true, loginError: null })

        await new Promise(resolve => setTimeout(resolve, 600))

        const identifier = email.trim()
        if (!identifier) {
          set({ isLoading: false, loginError: 'Vui lòng nhập Email hoặc Số điện thoại' })
          return { success: false, error: 'Vui lòng nhập Email hoặc Số điện thoại' }
        }

        if (!password.trim()) {
          set({ isLoading: false, loginError: 'Vui lòng nhập mật khẩu' })
          return { success: false, error: 'Vui lòng nhập mật khẩu' }
        }

        // 1. Thử xác thực trực tiếp qua API máy chủ Server DB
        try {
          const apiRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: identifier, password }),
          })
          if (apiRes.ok) {
            const json = await apiRes.json()
            const serverUser = json.data?.user || json.user
            if (json.success && serverUser) {
              const mappedUser: AuthUser = {
                id: serverUser.id,
                full_name: serverUser.full_name,
                email: serverUser.email,
                role: serverUser.role,
                store_id: serverUser.store_id || 'store-001',
                secondary_store_ids: serverUser.secondary_store_ids,
                position_id: serverUser.position_id || 'pos-001',
                phone: serverUser.phone || '',
                employee_code: serverUser.employee_code || '',
                status: serverUser.status || 'active',
                account_status: serverUser.account_status || 'dang_hoat_dong',
                department_name: serverUser.department_name || '',
                official_salary: Number(serverUser.base_salary || 0),
                hourly_rate: Number(serverUser.hourly_rate || 0),
                hire_date: serverUser.hire_date || '',
                total_points: Number(serverUser.total_points || 1500),
                gamification_level: serverUser.gamification_level || 'silver',
              }
              set({
                user: mappedUser,
                isAuthenticated: true,
                isLoading: false,
                hasHydrated: true,
                loginError: null,
              })
              syncAuthCookie(mappedUser)
              console.log(`[Auth] User logged in via Server API: ${mappedUser.full_name} (${mappedUser.role})`)
              return { success: true }
            } else if (json.error) {
              set({ isLoading: false, loginError: json.error })
              return { success: false, error: json.error }
            }
          } else {
            // Máy chủ phản hồi từ chối (sai mật khẩu hoặc tài khoản bị khóa)
            const json = await apiRes.json().catch(() => ({}))
            const errorMsg = json.error || 'Tài khoản hoặc mật khẩu không chính xác'
            set({ isLoading: false, loginError: errorMsg })
            return { success: false, error: errorMsg }
          }
        } catch (e) {
          console.warn('[AuthStore] API login failed, attempting local fallback:', e)
        }

        // 2. Fallback ngoại tuyến: tìm bằng EmployeeService
        const user = EmployeeService.getUserByIdentifier(identifier)
        if (!user) {
          set({ isLoading: false, loginError: 'Tài khoản không tồn tại trên hệ thống' })
          return { success: false, error: 'Tài khoản không tồn tại trên hệ thống' }
        }

        if (!validatePassword(password)) {
          set({ isLoading: false, loginError: 'Mật khẩu không đúng' })
          return { success: false, error: 'Mật khẩu không đúng' }
        }

        if (user.status === 'inactive' || user.account_status === 'bi_khoa') {
          set({ isLoading: false, loginError: 'Tài khoản đã bị khóa. Vui lòng liên hệ HR.' })
          return { success: false, error: 'Tài khoản đã bị khóa' }
        }

        set({
          user,
          isAuthenticated: true,
          isLoading: false,
          hasHydrated: true,
          loginError: null,
        })
        syncAuthCookie(user)

        console.log(`[Auth] User logged in: ${user.full_name} (${user.role})`)
        return { success: true }
      },

      logout: () => {
        const userName = useAuthStore.getState().user?.full_name
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          hasHydrated: true,
          loginError: null,
        })
        syncAuthCookie(null)
        console.log(`[Auth] User logged out: ${userName}`)
      },

      setRememberMe: (val: boolean) => {
        set({ rememberMe: val })
      },

      clearError: () => {
        set({ loginError: null })
      },

      loginAsRole: (role: UserRole) => {
        const account = DEMO_ACCOUNTS.find(acc => acc.role === role)
        if (account) {
          const user = EmployeeService.getUserByEmail(account.email)
          if (user) {
            set({
              user,
              isAuthenticated: true,
              isLoading: false,
              hasHydrated: true,
              loginError: null,
            })
            syncAuthCookie(user)
            console.log(`[Auth] loginAsRole: Switched to ${user.full_name} (${user.role})`)
          }
        }
      },

      loginAsDemo: (email: string) => {
        const user = EmployeeService.getUserByEmail(email)
        if (user) {
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            hasHydrated: true,
            loginError: null,
          })
          syncAuthCookie(user)
          // Đồng bộ session server cookie cho tài khoản demo
          fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user.email, password: '123456' }),
          }).catch(() => {})
          console.log(`[Auth] loginAsDemo: Switched to ${user.full_name} (${user.role})`)
        }
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => authStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        rememberMe: state.rememberMe,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          useAuthStore.setState({ hasHydrated: true })
          return
        }
        state.clearError()

        const isServiceReady = typeof EmployeeService !== 'undefined' && typeof EmployeeService.resolveSessionUser === 'function'

        let targetUser = state.user
        let targetAuth = state.isAuthenticated

        if (isServiceReady && state.user) {
          try {
            const refreshedUser = EmployeeService.resolveSessionUser(state.user)
            if (refreshedUser) {
              targetUser = refreshedUser
              targetAuth = true
            }
          } catch (err) {
            console.warn('[AuthStore] Failed to refresh session user, keeping current state:', err)
          }
        }

        // Đảm bảo nếu state đã có user thì luôn xác thực là true
        if (targetUser && targetUser.id) {
          targetAuth = true
        }

        // Cập nhật trực tiếp đồng bộ để các hàm ngoài React đọc được ngay
        state.user = targetUser
        state.isAuthenticated = targetAuth
        state.hasHydrated = true
        state.isLoading = false

        // Đồng bộ cookie
        syncAuthCookie(targetUser)

        // Trì hoãn cập nhật để React re-render an toàn sau hydration
        setTimeout(() => {
          useAuthStore.setState({
            user: targetUser,
            isAuthenticated: targetAuth,
            hasHydrated: true,
            isLoading: false,
          })
        }, 0)
      },
    }
  )
)

// Helper đọc trực tiếp user từ localStorage hoặc sessionStorage cứu hộ tức thì
export function getStoredAuthUser(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const rawLocal = localStorage.getItem(AUTH_STORAGE_KEY)
    if (rawLocal) {
      const parsed = JSON.parse(rawLocal)
      if (parsed?.state?.user?.id) return parsed.state.user
    }
    const rawSession = sessionStorage.getItem(AUTH_STORAGE_KEY)
    if (rawSession) {
      const parsed = JSON.parse(rawSession)
      if (parsed?.state?.user?.id) return parsed.state.user
    }
  } catch (err) {
    console.warn('[AuthStore] Error reading stored auth user:', err)
  }
  return null
}

// Tận dụng hook/listener onFinishHydration chuẩn của Zustand v4/v5 và kích hoạt tức thì
if (typeof window !== 'undefined') {
  if (useAuthStore.persist?.hasHydrated?.()) {
    useAuthStore.setState({ hasHydrated: true })
  }
  useAuthStore.persist?.onFinishHydration?.(() => {
    useAuthStore.setState({ hasHydrated: true })
  })

  // Đồng bộ tức thì ngay khi file được import phía client
  const current = useAuthStore.getState()
  if (!current.hasHydrated || !current.user) {
    const fallbackUser = getStoredAuthUser()
    if (fallbackUser) {
      useAuthStore.setState({
        hasHydrated: true,
        user: fallbackUser,
        isAuthenticated: true,
        isLoading: false,
      })
    } else if (typeof document !== 'undefined' && document.cookie.includes('hrm-auth=1')) {
      useAuthStore.setState({ hasHydrated: true })
    }
  }

  // Cứu hộ bổ sung sau 50ms cho các trường hợp mạng chậm/Turbopack
  setTimeout(() => {
    const state = useAuthStore.getState()
    if (!state.hasHydrated) {
      const fallbackUser = getStoredAuthUser()
      useAuthStore.setState({
        hasHydrated: true,
        user: state.user || fallbackUser,
        isAuthenticated: Boolean(state.user || fallbackUser),
        isLoading: false,
      })
    }
  }, 50)
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

export function getDashboardPath(role: UserRole): string {
  switch (role) {
    case 'ceo':
    case 'hr_admin':
      return '/'
    case 'store_manager':
    case 'area_manager':
      return '/'
    case 'shift_leader':
    case 'employee':
    default:
      return '/'
  }
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    ceo: 'CEO',
    hr_admin: 'HR Admin',
    store_manager: 'Quản lý cửa hàng',
    area_manager: 'Quản lý khu vực',
    shift_leader: 'Trưởng ca',
    employee: 'Nhân viên',
  }
  return labels[role] || role
}

export function getRoleColor(role: UserRole): string {
  const colors: Record<UserRole, string> = {
    ceo: 'text-primary-600 bg-primary-50 border-primary-200',
    hr_admin: 'text-primary-600 bg-primary-50 border-primary-200',
    store_manager: 'text-success-600 bg-success-50 border-success-200',
    area_manager: 'text-teal-600 bg-teal-50 border-teal-200',
    shift_leader: 'text-warning-600 bg-warning-50 border-warning-200',
    employee: 'text-gray-600 bg-gray-50 border-gray-200',
  }
  return colors[role] || 'text-gray-600 bg-gray-50 border-gray-200'
}

export function hasPermission(role: UserRole, requiredRoles: UserRole[]): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    ceo: 6,
    hr_admin: 5,
    area_manager: 4,
    store_manager: 3,
    shift_leader: 2,
    employee: 1,
  }
  const userLevel = roleHierarchy[role] || 0
  const requiredLevel = Math.min(...requiredRoles.map(r => roleHierarchy[r] || 0))
  return userLevel >= requiredLevel
}
