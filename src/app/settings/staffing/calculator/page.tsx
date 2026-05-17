'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import StaffingCalculator from '@/components/staffing/StaffingCalculator'

export default function StaffingCalculatorPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  return (
    <AppShell title="Tính định biên tự động">
      <StaffingCalculator onComplete={() => router.push('/settings/staffing')} />
    </AppShell>
  )
}
