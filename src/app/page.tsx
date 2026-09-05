'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { EmployeeDashboardPremium } from '@/components/dashboard/EmployeeDashboardPremium'
import { ManagerDashboardPremium } from '@/components/dashboard/ManagerDashboardPremium'
import { AdminDashboardPremium } from '@/components/dashboard/AdminDashboardPremium'

export default function HomePage() {
  const { user, isLoading, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && hasHydrated && !isLoading) {
      if (!user) {
        router.replace('/login')
      }
    }
  }, [mounted, hasHydrated, isLoading, user, router])

  if (!mounted || !hasHydrated || isLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-vanilla-50 px-6">
        <div className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-5 py-4 text-sm font-medium text-gray-600 shadow-sm">
          <Loader2 size={18} className="animate-spin text-primary-500" />
          Đang chuẩn bị bảng điều khiển...
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
            user={{
              id: user.id,
              name: user.full_name,
              storeId: user.store_id,
              storeName: user.store_id === 'store-001' ? 'Homies - Hồ Bá Phấn' : 'Homies - Đường 429',
            }}
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
