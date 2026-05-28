'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { EmployeeDashboardPremium } from '@/components/dashboard/EmployeeDashboardPremium'
import { ManagerDashboardPremium } from '@/components/dashboard/ManagerDashboardPremium'
import { AdminDashboardPremium } from '@/components/dashboard/AdminDashboardPremium'

export default function HomePage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (hasHydrated && (!isAuthenticated || !user)) {
      router.replace('/login')
    }
  }, [hasHydrated, isAuthenticated, user, router])

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 text-sm font-medium text-gray-600 shadow-sm">
          <Loader2 size={18} className="animate-spin text-primary-500" />
          Dang tai phien dang nhap...
        </div>
      </div>
    )
  }

  if (!user || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 text-sm font-medium text-gray-600 shadow-sm">
          <Loader2 size={18} className="animate-spin text-primary-500" />
          Dang chuyen den trang dang nhap...
        </div>
      </div>
    )
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'employee':
      case 'shift_leader':
        return (
          <EmployeeDashboardPremium
            user={{ id: user.id, name: user.full_name, level: user.role }}
          />
        )
      case 'store_manager':
      case 'area_manager':
        return (
          <ManagerDashboardPremium
            user={{ id: user.id, name: user.full_name, storeId: user.store_id, storeName: 'Chi nhánh Quận 1' }}
          />
        )
      case 'ceo':
      case 'hr_admin':
      default:
        return (
          <AdminDashboardPremium
            user={{ id: user.id, name: user.full_name, companyName: 'Homies Milk Tea' }}
          />
        )
    }
  }

  return (
    <AppShell showNav>
      {renderDashboard()}
    </AppShell>
  )
}
