'use client'

import React, { useState, useTransition } from 'react'
import Link from 'next/link'
import { UpcomingOnboardingList } from '@/components/onboarding-operations/UpcomingOnboardingList'
import { OperationsChecklistDetail } from '@/components/onboarding-operations/OperationsChecklistDetail'
import { initCareerPathStores } from '@/lib/career-path-service'
import {
  OnboardingOperationsService,
  type OnboardingOpsFollowUpLevel,
  type OnboardingOpsFirstShiftResult,
  type OnboardingOpsPriorityFilter,
} from '@/lib/services/onboarding-operations-service'
import { useAuthStore } from '@/store/auth-store'

initCareerPathStores()

export default function OnboardingPage() {
  const user = useAuthStore((state) => state.user)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [, setRevision] = useState(0)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<OnboardingOpsPriorityFilter>('all')
  const [, startTransition] = useTransition()

  const overview = user
    ? OnboardingOperationsService.getWorkspaceOverview(user, activeFilter)
    : { rows: [], allRows: [], filters: [], stats: [], activeFilter }
  const rows = overview.rows
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

  const handleMarkFirstShift = (employeeId: string, shiftId: string) => {
    if (!user) return

    const employeeDetail = OnboardingOperationsService.getEmployeeDetail(employeeId, user)
    const shift = employeeDetail?.firstShiftOptions.find((item) => item.id === shiftId)
    if (!shift) return

    OnboardingOperationsService.updateChecklist(employeeId, {
      key: 'first_shift',
      firstShiftKey: shift.id,
      firstShiftLabel: shift.label,
    })
    refresh()
  }

  const handleAssignBuddy = (employeeId: string, buddyId: string) => {
    if (!user) return

    OnboardingOperationsService.assignBuddy(employeeId, buddyId, user)
    refresh()
  }

  const handleConfirmStorePolicy = (employeeId: string) => {
    OnboardingOperationsService.updateChecklist(employeeId, {
      key: 'uniform_attendance_policy',
      storePolicyConfirmed: true,
    })
    refresh()
  }

  const handleToggleTools = (
    employeeId: string,
    field: 'chatGroupJoined' | 'toolAccountReady',
    value: boolean,
  ) => {
    OnboardingOperationsService.updateChecklist(employeeId, {
      key: 'tools_and_group',
      [field]: value,
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

  const handleSaveFirstShiftNote = (employeeId: string, firstShiftNote: string) => {
    OnboardingOperationsService.updateChecklist(employeeId, {
      key: 'first_shift_note',
      firstShiftNote,
    })
    refresh()
  }

  const handleSetFollowUp = (employeeId: string, followUpLevel: OnboardingOpsFollowUpLevel) => {
    OnboardingOperationsService.updateChecklist(employeeId, {
      key: 'follow_up',
      followUpLevel,
    })
    refresh()
  }

  const handleProposeGate = (employeeId: string, note: string) => {
    OnboardingOperationsService.proposeStageGate(employeeId, note)
    refresh()
  }

  const handleApproveGate = (employeeId: string, managerNote: string) => {
    OnboardingOperationsService.approveStageGate(employeeId, managerNote)
    refresh()
  }

  const handleRejectGate = (employeeId: string, managerNote: string, retryItemIds: string[]) => {
    OnboardingOperationsService.rejectStageGate(employeeId, managerNote, retryItemIds)
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
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            marginBottom: 16,
          }}
        >
          {overview.stats.map((stat) => (
            <div
              key={stat.key}
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(0, 29, 61, 0.08)',
                borderRadius: 22,
                padding: 14,
                boxShadow: '0 10px 24px rgba(0, 29, 61, 0.05)',
              }}
            >
              <div style={{ fontSize: 11, color: '#7A6B53', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {stat.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#001D3D', marginTop: 6 }}>{stat.value}</div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: 'grid',
            gap: 16,
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            alignItems: 'start',
          }}
        >
          <UpcomingOnboardingList
            rows={rows}
            filters={overview.filters}
            activeFilter={overview.activeFilter}
            onChangeFilter={setActiveFilter}
            selectedEmployeeId={activeEmployeeId}
            onSelect={setSelectedEmployeeId}
          />

          <OperationsChecklistDetail
            detail={detail}
            viewerRole={user.role}
            onMarkFirstShift={handleMarkFirstShift}
            onAssignBuddy={handleAssignBuddy}
            onConfirmStorePolicy={handleConfirmStorePolicy}
            onToggleTools={handleToggleTools}
            onSetFirstShiftResult={handleSetFirstShiftResult}
            onSaveFirstShiftNote={handleSaveFirstShiftNote}
            onSetFollowUp={handleSetFollowUp}
            onProposeGate={handleProposeGate}
            onApproveGate={handleApproveGate}
            onRejectGate={handleRejectGate}
          />
        </div>
      </div>
    </div>
  )
}
