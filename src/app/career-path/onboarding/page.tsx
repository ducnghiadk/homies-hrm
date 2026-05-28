'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { BuddyWorkview } from '@/components/onboarding-operations/BuddyWorkview'
import { ManagerWorkview } from '@/components/onboarding-operations/ManagerWorkview'
import { initCareerPathStores } from '@/lib/career-path-service'
import { listOnboardingThreeViewSnapshots, getBuddyThreeViewQueue, getManagerThreeViewQueue, reviewOnboardingStageItemAsBuddy, reviewOnboardingStageItemAsManager } from '@/lib/services/onboarding-stage-service'
import { useAuthStore } from '@/store/auth-store'

initCareerPathStores()

export default function OnboardingPage() {
  const user = useAuthStore((state) => state.user)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [, setRevision] = useState(0)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const refresh = () => {
    startTransition(() => {
      setRevision((current) => current + 1)
    })
  }

  const snapshots = !user
    ? []
    : user.role === 'store_manager' || user.role === 'hr_admin' || user.role === 'ceo' || user.role === 'area_manager'
      ? (() => {
        const managerRows = getManagerThreeViewQueue(user.id)
        return managerRows.length > 0 ? managerRows : listOnboardingThreeViewSnapshots()
      })()
      : getBuddyThreeViewQueue(user.id)

  const handleBuddyApprove = (employeeId: string, itemId: string, note: string) => {
    if (!user) return
    reviewOnboardingStageItemAsBuddy(employeeId, itemId, user.id, 'passed', note)
    refresh()
  }

  const handleBuddyCoaching = (employeeId: string, itemId: string, note: string) => {
    if (!user) return
    reviewOnboardingStageItemAsBuddy(employeeId, itemId, user.id, 'needs_coaching', note)
    refresh()
  }

  const handleManagerApprove = (employeeId: string, itemId: string, note: string) => {
    if (!user) return
    reviewOnboardingStageItemAsManager(employeeId, itemId, user.id, 'passed', note)
    refresh()
  }

  const handleManagerCoaching = (employeeId: string, itemId: string, note: string) => {
    if (!user) return
    reviewOnboardingStageItemAsManager(employeeId, itemId, user.id, 'needs_coaching', note)
    refresh()
  }

  if (!hasHydrated) {
    return (
      <div style={{ padding: '24px 16px 80px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#001D3D' }}>Dang tai du lieu onboarding...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ padding: '24px 16px 80px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Link href="/career-path" style={{ fontSize: 20, textDecoration: 'none' }}>←</Link>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Onboard van hanh</h1>
        </div>
        <div style={{ fontSize: 14, color: '#5F6B7A' }}>Can dang nhap de xem danh sach onboard van hanh.</div>
      </div>
    )
  }

  const isManagerView = user.role === 'store_manager' || user.role === 'hr_admin' || user.role === 'ceo' || user.role === 'area_manager'

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8E8', padding: '20px 16px 80px' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Link href="/career-path" style={{ fontSize: 20, textDecoration: 'none' }}>←</Link>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>
              Homies onboarding
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 0', color: '#001D3D' }}>
              {isManagerView ? 'Onboarding quan ly' : 'Onboarding buddy'}
            </h1>
          </div>
        </div>

        {isManagerView ? (
          <ManagerWorkview
            snapshots={snapshots}
            selectedEmployeeId={selectedEmployeeId}
            onSelect={setSelectedEmployeeId}
            onApprove={handleManagerApprove}
            onNeedCoaching={handleManagerCoaching}
          />
        ) : (
          <BuddyWorkview
            snapshots={snapshots}
            selectedEmployeeId={selectedEmployeeId}
            onSelect={setSelectedEmployeeId}
            onApprove={handleBuddyApprove}
            onNeedCoaching={handleBuddyCoaching}
          />
        )}
      </div>
    </div>
  )
}
