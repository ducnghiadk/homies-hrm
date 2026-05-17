'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { EmployeeDashboardPremium } from '@/components/dashboard/EmployeeDashboardPremium'
import { ManagerDashboardPremium } from '@/components/dashboard/ManagerDashboardPremium'
import { AdminDashboardPremium } from '@/components/dashboard/AdminDashboardPremium'

export default function HomePage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  if (!user) return null

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
            user={{ id: user.id, name: user.full_name, companyName: 'Boba House' }}
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

