'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import AppShell from '@/components/layout/AppShell'
import { TrialTrackingDetailPanel } from '@/components/onboarding-operations/TrialTrackingDetailPanel'
import { TrialTrackingEmployeeTable } from '@/components/onboarding-operations/TrialTrackingEmployeeTable'
import { TrialTrackingEmptyState } from '@/components/onboarding-operations/TrialTrackingEmptyState'
import { TrialTrackingSummaryBar } from '@/components/onboarding-operations/TrialTrackingSummaryBar'
import { initCareerPathStores } from '@/lib/career-path-service'
import {
  OnboardingOperationsService,
  type OnboardingOpsFirstShiftResult,
  type OnboardingOpsFollowUpLevel,
  type OnboardingOpsPriorityFilter,
} from '@/lib/services/onboarding-operations-service'
import { useAuthStore } from '@/store/auth-store'

initCareerPathStores()

const allowedFilters: OnboardingOpsPriorityFilter[] = ['all', 'urgent', 'due_soon', 'on_track', 'blocked_start', 'completed']

function readFilterFromSearchParams(searchParams: URLSearchParams): OnboardingOpsPriorityFilter {
  const raw = searchParams.get('filter')
  return allowedFilters.includes(raw as OnboardingOpsPriorityFilter)
    ? (raw as OnboardingOpsPriorityFilter)
    : 'all'
}

export default function OnboardingPage() {
  const user = useAuthStore((state) => state.user)
  const hasHydrated = useAuthStore((state) => state.hasHydrated)
  const [, setRevision] = useState(0)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<OnboardingOpsPriorityFilter>('all')
  const [, startTransition] = useTransition()

  const overview = user
    ? OnboardingOperationsService.getWorkspaceOverview(user, activeFilter)
    : {
        rows: [],
        allRows: [],
        filters: [],
        stats: [],
        activeFilter: 'all' as OnboardingOpsPriorityFilter,
        systemStatus: { key: 'stable' as const, label: 'Ổn định', reason: '' },
        configSummary: { enabledRoleCount: 0, missingTemplateCount: 0, duplicateMappingCount: 0, unmatchedEmployeeCount: 0 },
        urgentItems: [],
        journeyLength: 10,
        suggestedTodayIndex: 1,
      }

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

  useEffect(() => {
    const applyFilterFromUrl = () => {
      const searchParams = new URLSearchParams(window.location.search)
      setActiveFilter(readFilterFromSearchParams(searchParams))
    }

    const handleRefresh = () => {
      startTransition(() => {
        setRevision((current) => current + 1)
      })
    }

    applyFilterFromUrl()
    window.addEventListener('focus', handleRefresh)
    window.addEventListener('storage', handleRefresh)
    window.addEventListener('popstate', applyFilterFromUrl)
    return () => {
      window.removeEventListener('focus', handleRefresh)
      window.removeEventListener('storage', handleRefresh)
      window.removeEventListener('popstate', applyFilterFromUrl)
    }
  }, [startTransition])

  const handleChangeFilter = (nextFilter: OnboardingOpsPriorityFilter) => {
    setActiveFilter(nextFilter)
    const url = new URL(window.location.href)
    url.searchParams.set('filter', nextFilter)
    window.history.replaceState({}, '', url.toString())
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

  const handleToggleTools = (employeeId: string, field: 'chatGroupJoined' | 'toolAccountReady', value: boolean) => {
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
      <AppShell navMode="full">
        <div className="rounded-[28px] border border-[rgba(0,29,61,0.08)] bg-white p-6 text-sm font-semibold text-[#001D3D] shadow-sm">
          Đang tải dữ liệu thử việc...
        </div>
      </AppShell>
    )
  }

  if (!user) {
    return (
      <AppShell navMode="full">
        <div className="rounded-[28px] border border-[rgba(0,29,61,0.08)] bg-white p-6 text-sm text-[#5F6B7A] shadow-sm">
          Cần đăng nhập để xem theo dõi thử việc.
        </div>
      </AppShell>
    )
  }

  const hasSetupGap = overview.configSummary.missingTemplateCount > 0 || overview.configSummary.duplicateMappingCount > 0

  return (
    <AppShell navMode="full">
      <div style={{ minHeight: '100%', background: '#FFF8E8', borderRadius: 32, padding: '20px 16px 24px' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gap: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Link href="/career-path/onboarding/overview" style={{ color: '#2F6FA8', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>
              Quay lại Tổng quan thử việc
            </Link>
          </div>

          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>Theo dõi thử việc</div>
          <div style={{ fontSize: 13, lineHeight: 1.6, color: '#5F6B7A' }}>Theo dõi từng nhân viên mới đang thử việc, biết họ đang ở giai đoạn nào và còn thiếu việc gì.</div>

          <TrialTrackingSummaryBar overview={overview} />

          {overview.allRows.length === 0 ? (
            <TrialTrackingEmptyState variant={hasSetupGap ? 'missing_setup' : 'no_employees'} />
          ) : rows.length === 0 ? (
            <TrialTrackingEmptyState variant="no_results" />
          ) : (
            <div style={{ display: 'grid', gap: 16, gridTemplateColumns: 'minmax(0, 1.35fr) minmax(360px, 0.95fr)' }}>
              <TrialTrackingEmployeeTable
                rows={rows}
                filters={overview.filters}
                activeFilter={overview.activeFilter}
                onChangeFilter={handleChangeFilter}
                selectedEmployeeId={activeEmployeeId}
                onSelect={setSelectedEmployeeId}
              />

              <TrialTrackingDetailPanel
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
          )}
        </div>
      </div>
    </AppShell>
  )
}
