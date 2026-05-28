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
  position_id: string
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

    const localValue = localStorage.getItem(name)
    if (localValue) {
      try {
        const parsed = JSON.parse(localValue)
        if (parsed?.state?.rememberMe) {
          return localValue
        }
      } catch {}
    }

    return sessionStorage.getItem(name) ?? localValue
  },
  setItem: (name, value) => {
    if (typeof window === 'undefined') return

    let shouldRemember = false
    try {
      const parsed = JSON.parse(value)
      shouldRemember = Boolean(parsed?.state?.rememberMe)
    } catch {}

    const primaryStorage = shouldRemember ? localStorage : sessionStorage
    const secondaryStorage = shouldRemember ? sessionStorage : localStorage

    primaryStorage.setItem(name, value)
    secondaryStorage.removeItem(name)
  },
  removeItem: (name) => {
    if (typeof window === 'undefined') return

    localStorage.removeItem(name)
    sessionStorage.removeItem(name)
  },
}

function syncAuthCookie(user: AuthUser | null) {
  if (typeof document === 'undefined') return

  const expires = user ? 'Max-Age=2592000' : 'Max-Age=0'
  document.cookie = `hrm-auth=${user ? '1' : '0'}; Path=/; SameSite=Lax; ${expires}`
  document.cookie = `hrm-role=${user?.role || ''}; Path=/; SameSite=Lax; ${expires}`
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
  login: (email: string, password: string) => Promise<LoginResult>
  logout: () => void
  setRememberMe: (val: boolean) => void
  clearError: () => void
  loginAsRole: (role: UserRole) => void
  loginAsDemo: (email: string) => void
}

// Validate password (mock - in production use Supabase Auth)
const validatePassword = (password: string): boolean => {
  if (password === '123456') return true
  if (password.length >= 4) return true
  return false
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: false,
      rememberMe: false,
      loginError: null,

      login: async (email: string, password: string): Promise<LoginResult> => {
        set({ isLoading: true, loginError: null })

        await new Promise(resolve => setTimeout(resolve, 600))

        if (!email.trim()) {
          set({ isLoading: false, loginError: 'Vui lòng nhập email' })
          return { success: false, error: 'Vui lòng nhập email' }
        }

        if (!password.trim()) {
          set({ isLoading: false, loginError: 'Vui lòng nhập mật khẩu' })
          return { success: false, error: 'Vui lòng nhập mật khẩu' }
        }

        const user = EmployeeService.getUserByEmail(email)
        if (!user) {
          set({ isLoading: false, loginError: 'Email không tồn tại trong hệ thống' })
          return { success: false, error: 'Email không tồn tại trong hệ thống' }
        }

        if (!validatePassword(password)) {
          set({ isLoading: false, loginError: 'Mật khẩu không đúng' })
          return { success: false, error: 'Mật khẩu không đúng' }
        }

        if (user.status === 'inactive') {
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
        if (!state) return
        state.clearError()

        const isServiceReady = typeof EmployeeService !== 'undefined' && typeof EmployeeService.resolveSessionUser === 'function'

        let targetUser = state.user
        let targetAuth = state.isAuthenticated

        if (isServiceReady) {
          const refreshedUser = EmployeeService.resolveSessionUser(state.user)

          if (state.user && !refreshedUser) {
            targetUser = null
            targetAuth = false
          } else if (refreshedUser) {
            targetUser = refreshedUser
            targetAuth = true
          }
        }

        // Cập nhật trực tiếp đồng bộ để các hàm ngoài React đọc được ngay
        state.user = targetUser
        state.isAuthenticated = targetAuth
        state.hasHydrated = true

        // Đồng bộ cookie
        syncAuthCookie(targetUser)

        // Trì hoãn cập nhật để React re-render an toàn sau hydration
        setTimeout(() => {
          useAuthStore.setState({
            user: targetUser,
            isAuthenticated: targetAuth,
            hasHydrated: true,
          })
        }, 0)
      },
    }
  )
)

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
