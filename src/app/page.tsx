'use client'

import { useAuthStore, getStoredAuthUser } from '@/store/auth-store'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { Loader2, ShieldAlert, X } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { EmployeeDashboardPremium } from '@/components/dashboard/EmployeeDashboardPremium'
import { ManagerDashboardPremium } from '@/components/dashboard/ManagerDashboardPremium'
import { AdminDashboardPremium } from '@/components/dashboard/AdminDashboardPremium'
import { getStoreById } from '@/lib/mock-data'
import { toast } from 'sonner'

function HomePageContent() {
  const { user, isLoading, hasHydrated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [deniedToast, setDeniedToast] = useState<string | null>(null)

  // Đọc dự phòng user từ bộ nhớ trình duyệt ngay khi component chạy phía client
  const fallbackUser = typeof window !== 'undefined' ? getStoredAuthUser() : null
  const effectiveUser = user || fallbackUser

  // Bắt tham số từ chối quyền truy cập (?denied=1 hoặc ?access_denied=1)
  useEffect(() => {
    if (searchParams.get('denied') === '1' || searchParams.get('access_denied') === '1') {
      const msg = 'Bạn không có quyền truy cập trang này. Vui lòng liên hệ Quản lý nếu cần hỗ trợ!'
      setDeniedToast(msg)
      try {
        toast.error(msg, { duration: 5000 })
      } catch {}
      // Xóa query parameter khỏi thanh địa chỉ mà không reload trang
      if (typeof window !== 'undefined' && window.history?.replaceState) {
        const cleanUrl = window.location.pathname
        window.history.replaceState({}, '', cleanUrl)
      }
    }
  }, [searchParams])

  useEffect(() => {
    setMounted(true)

    // Nếu đã có user trong bộ nhớ mà store chưa sync, sync ngay lập tức
    if (fallbackUser && (!user || !hasHydrated)) {
      useAuthStore.setState({
        user: fallbackUser,
        isAuthenticated: true,
        hasHydrated: true,
        isLoading: false,
      })
    }

    // Timeout cứu hộ (fallback sau 1.5s): Không để màn hình bị treo vô tận
    const rescueTimer = setTimeout(() => {
      const stateUser = useAuthStore.getState().user || getStoredAuthUser()
      if (stateUser) {
        useAuthStore.setState({
          user: stateUser,
          isAuthenticated: true,
          hasHydrated: true,
          isLoading: false,
        })
      } else {
        // Thật sự không có user đăng nhập -> chuyển hướng login
        if (typeof window !== 'undefined') {
          window.location.href = '/login'
        } else {
          router.replace('/login')
        }
      }
    }, 1500)

    return () => clearTimeout(rescueTimer)
  }, [fallbackUser, user, hasHydrated, router])

  // Nếu đã mount và đã có user hợp lệ (kể cả fallbackUser), render ngay Dashboard
  if (mounted && effectiveUser) {
    const renderDashboard = () => {
      switch (effectiveUser.role) {
        case 'employee':
        case 'shift_leader':
          return (
            <EmployeeDashboardPremium
              user={{ id: effectiveUser.id, name: effectiveUser.full_name, level: effectiveUser.role }}
            />
          )
        case 'store_manager':
        case 'area_manager': {
          const storeObj = getStoreById(effectiveUser.store_id)
          const storeDisplayName = storeObj?.name || (effectiveUser.store_id === 'store-001' ? 'Homies - Hồ Bá Phấn' : effectiveUser.store_id === 'store-002' ? 'Homies - Đường 429' : 'Homies Milk Tea')
          return (
            <ManagerDashboardPremium
              user={{
                id: effectiveUser.id,
                name: effectiveUser.full_name,
                storeId: effectiveUser.store_id,
                storeName: storeDisplayName,
              }}
            />
          )
        }
        case 'ceo':
        case 'hr_admin':
        default:
          return (
            <AdminDashboardPremium
              user={{ id: effectiveUser.id, name: effectiveUser.full_name, companyName: 'Homies Milk Tea' }}
            />
          )
      }
    }

    return (
      <AppShell showNav>
        {/* Banner thông báo từ chối quyền nổi bật trên mobile/desktop */}
        {deniedToast && (
          <div className="mx-auto max-w-4xl px-4 pt-3">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2.5">
                <ShieldAlert size={18} className="text-amber-600 shrink-0" />
                <span className="font-semibold">{deniedToast}</span>
              </div>
              <button
                type="button"
                onClick={() => setDeniedToast(null)}
                className="text-amber-600 hover:text-amber-800 p-1 rounded-md"
                aria-label="Đóng"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        {renderDashboard()}
      </AppShell>
    )
  }

  // Màn hình chờ trong tối đa 1.5s
  return (
    <div className="flex min-h-screen items-center justify-center bg-vanilla-50 px-6">
      <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 text-sm font-medium text-gray-600 shadow-sm">
        <Loader2 size={18} className="animate-spin text-primary-500" />
        Đang chuẩn bị bảng điều khiển...
      </div>
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-vanilla-50 px-6">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 text-sm font-medium text-gray-600 shadow-sm">
            <Loader2 size={18} className="animate-spin text-primary-500" />
            Đang chuẩn bị bảng điều khiển...
          </div>
        </div>
      }
    >
      <HomePageContent />
    </Suspense>
  )
}
