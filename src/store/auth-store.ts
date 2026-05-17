'use client'

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { mockEmployees } from '@/lib/mock-data'

// User info saved after login (matches DB schema)
export type AuthUser = {
  id: string
  full_name: string
  email: string
  role: 'employee' | 'shift_leader' | 'store_manager' | 'area_manager' | 'hr_admin' | 'ceo'
  store_id: string
  position_id: string
  avatar_url?: string
  phone: string
  employee_code: string
  status: 'active' | 'inactive' | 'probation' | 'resigned'
  total_points: number
  gamification_level: string
  hire_date: string
}

export type LoginResult = {
  success: boolean
  error?: string
}

type AuthState = {
  user: AuthUser | null
  isAuthenticated: boolean
  isLoading: boolean
  rememberMe: boolean

  login: (email: string, password: string) => Promise<LoginResult>
  loginAsRole: (role: string) => void
  logout: () => void
  setRememberMe: (val: boolean) => void
}

// Mock password = '123456' for all users
const MOCK_PASSWORD = '123456'

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      rememberMe: false,

      login: async (email: string, password: string): Promise<LoginResult> => {
        set({ isLoading: true })

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800))

        // Timeout guard: if taking too long, reject (handled at caller level)

        // Step 1: Validate input
        if (!email.trim() || !password.trim()) {
          set({ isLoading: false })
          return { success: false, error: 'Vui lòng nhập đầy đủ thông tin' }
        }

        // Step 2: Find user by email
        const found = mockEmployees.find(
          e => e.email.toLowerCase() === email.toLowerCase().trim()
        )
        if (!found) {
          set({ isLoading: false })
          return { success: false, error: 'Email không tồn tại' }
        }

        // Step 3: Check password
        if (password !== MOCK_PASSWORD) {
          set({ isLoading: false })
          return { success: false, error: 'Mật khẩu không đúng' }
        }

        // Step 4: Check status
        if (found.status === 'inactive') {
          set({ isLoading: false })
          return { success: false, error: 'Tài khoản đã bị khóa' }
        }

        // Step 5: Success — save only needed fields
        const authUser: AuthUser = {
          id: found.id,
          full_name: found.full_name,
          email: found.email,
          role: found.role,
          store_id: found.store_id,
          position_id: found.position_id,
          avatar_url: found.avatar_url,
          phone: found.phone,
          employee_code: found.employee_code,
          status: found.status,
          total_points: found.total_points,
          gamification_level: found.gamification_level,
          hire_date: found.hire_date,
        }

        set({ user: authUser, isAuthenticated: true, isLoading: false })
        return { success: true }
      },

      loginAsRole: (role: string) => {
        const emp = mockEmployees.find(e => e.role === role)
        if (emp) {
          const authUser: AuthUser = {
            id: emp.id,
            full_name: emp.full_name,
            email: emp.email,
            role: emp.role,
            store_id: emp.store_id,
            position_id: emp.position_id,
            avatar_url: emp.avatar_url,
            phone: emp.phone,
            employee_code: emp.employee_code,
            status: emp.status,
            total_points: emp.total_points,
            gamification_level: emp.gamification_level,
            hire_date: emp.hire_date,
          }
          set({ user: authUser, isAuthenticated: true, isLoading: false })
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, isLoading: false })
      },

      setRememberMe: (val: boolean) => {
        set({ rememberMe: val })
      },
    }),
    {
      name: 'homies-auth',
      storage: createJSONStorage(() => {
        // Use localStorage if rememberMe, else sessionStorage
        if (typeof window !== 'undefined') {
          try {
            const stored = localStorage.getItem('homies-auth')
            if (stored) {
              const parsed = JSON.parse(stored)
              if (parsed?.state?.rememberMe) return localStorage
            }
          } catch {}
          return sessionStorage
        }
        return sessionStorage
      }),
    }
  )
)

// Helper: get redirect path based on role
export function getDashboardPath(role: string): string {
  switch (role) {
    case 'ceo':
    case 'hr_admin':
      return '/'              // Dashboard Admin
    case 'store_manager':
    case 'area_manager':
      return '/'              // Dashboard Cửa hàng
    case 'shift_leader':
    case 'employee':
    default:
      return '/'              // Trang chủ Nhân viên
  }
}
