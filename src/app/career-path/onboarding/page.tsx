'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { UpcomingOnboardingList } from '@/components/onboarding-operations/UpcomingOnboardingList'
import { OperationsChecklistDetail } from '@/components/onboarding-operations/OperationsChecklistDetail'
import { initCareerPathStores } from '@/lib/career-path-service'
import {
  OnboardingOperationsService,
  type OnboardingOpsFirstShiftResult,
} from '@/lib/services/onboarding-operations-service'
import { useAuthStore } from '@/store/auth-store'

initCareerPathStores()

export default function OnboardingPage() {
  const user = useAuthStore((state) => state.user)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [, setRevision] = useState(0)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const rows = user ? OnboardingOperationsService.getUpcomingRows(user) : []
  const activeEmployeeId = rows.some((row) => row.employeeId === selectedEmployeeId)
    ? selectedEmployeeId
    : rows[0]?.employeeId ?? null
  const detail = user && activeEmployeeId
    ? OnboardingOperationsService.getEmployeeDetail(activeEmployeeId, user)
    : null

  const refresh = () => {
    startTransition(() => {
      setRevision((current) => current + 1)
    })
  }

  const handleMarkFirstShift = (employeeId: string) => {
    const value = window.prompt('Nhập ca đầu và giờ có mặt. Ví dụ: Ca sáng 07:30 • Có mặt 07:15')
    if (!value?.trim()) return

    OnboardingOperationsService.updateChecklist(employeeId, {
      key: 'first_shift',
      firstShiftLabel: value.trim(),
    })
    refresh()
  }

  const handleAssignBuddy = (employeeId: string) => {
    const value = window.prompt('Nhập tên người kèm')
    if (!value?.trim()) return

    OnboardingOperationsService.updateChecklist(employeeId, {
      key: 'buddy',
      assignedBuddyName: value.trim(),
    })
    refresh()
  }

  const handleConfirmStorePolicy = (employeeId: string) => {
    OnboardingOperationsService.updateChecklist(employeeId, {
      key: 'uniform_attendance_policy',
      storePolicyConfirmed: true,
    })
    refresh()
  }

  const handleConfirmTools = (employeeId: string) => {
    OnboardingOperationsService.updateChecklist(employeeId, {
      key: 'tools_and_group',
      hasChatAccess: true,
    })
    refresh()
  }

  const handleSetFirstShiftResult = (employeeId: string, result: OnboardingOpsFirstShiftResult) => {
    OnboardingOperationsService.updateChecklist(employeeId, {
      key: 'first_shift_result',
      firstShiftResult: result,
    })
    refresh()
  }

  if (!hasHydrated) {
    return (
      <div style={{ padding: '24px 16px 80px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#001D3D' }}>Đang tải dữ liệu onboarding...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={{ padding: '24px 16px 80px', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <Link href="/career-path" style={{ fontSize: 20, textDecoration: 'none' }}>←</Link>
          <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Onboard vận hành</h1>
        </div>
        <div style={{ fontSize: 14, color: '#5F6B7A' }}>Cần đăng nhập để xem danh sách onboard vận hành.</div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFF8E8', padding: '20px 16px 80px' }}>
      <div style={{ maxWidth: 1220, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
          <Link href="/career-path" style={{ fontSize: 20, textDecoration: 'none' }}>←</Link>
          <div>
            <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>
              Homies onboarding
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 0', color: '#001D3D' }}>Onboard vận hành</h1>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'minmax(320px, 380px) minmax(0, 1fr)',
            alignItems: 'start',
          }}
        >
          <UpcomingOnboardingList
            rows={rows}
            selectedEmployeeId={activeEmployeeId}
            onSelect={setSelectedEmployeeId}
          />

          <OperationsChecklistDetail
            detail={detail}
            onMarkFirstShift={handleMarkFirstShift}
            onAssignBuddy={handleAssignBuddy}
            onConfirmStorePolicy={handleConfirmStorePolicy}
            onConfirmTools={handleConfirmTools}
            onSetFirstShiftResult={handleSetFirstShiftResult}
          />
        </div>
      </div>
    </div>
  )
}
