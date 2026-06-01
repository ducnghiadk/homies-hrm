'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import AppShell from '@/components/layout/AppShell'
import { OnboardingOpsTimeline, type OnboardingOpsTimelineStep } from '@/components/onboarding-operations/OnboardingOpsTimeline'
import { UpcomingOnboardingList } from '@/components/onboarding-operations/UpcomingOnboardingList'
import { OperationsChecklistDetail } from '@/components/onboarding-operations/OperationsChecklistDetail'
import { initCareerPathStores } from '@/lib/career-path-service'
import {
  OnboardingOperationsService,
  type OnboardingOpsEmployeeDetail,
  type OnboardingOpsFirstShiftResult,
  type OnboardingOpsFollowUpLevel,
  type OnboardingOpsPriorityFilter,
} from '@/lib/services/onboarding-operations-service'
import { useAuthStore } from '@/store/auth-store'

initCareerPathStores()

const allowedFilters: OnboardingOpsPriorityFilter[] = ['all', 'block_day_one', 'need_follow_up', 'ready']

function readFilterFromSearchParams(searchParams: URLSearchParams): OnboardingOpsPriorityFilter {
  const raw = searchParams.get('filter')
  return allowedFilters.includes(raw as OnboardingOpsPriorityFilter)
    ? (raw as OnboardingOpsPriorityFilter)
    : 'all'
}

function resolveActiveStep(detail: OnboardingOpsEmployeeDetail | null): 2 | 3 | 4 {
  if (!detail) return 2
  const hasPendingBeforeShift = detail.checklist.some((item) => item.phase === 'before_first_shift' && !item.done)
  return hasPendingBeforeShift ? 3 : 4
}

function buildTimelineSteps(detail: OnboardingOpsEmployeeDetail | null): OnboardingOpsTimelineStep[] {
  const activeStep = resolveActiveStep(detail)

  return [
    {
      key: 'today',
      title: 'Xem ưu tiên hôm nay',
      description: 'Nhìn nhóm việc cần xử lý trước để khỏi chọn nhầm người.',
      status: activeStep >= 2 ? 'complete' : 'current',
    },
    {
      key: 'select',
      title: 'Chọn nhân sự',
      description: 'Chọn 1 người để hệ thống chỉ ra bước đang chờ.',
      status: activeStep === 2 ? 'current' : 'complete',
    },
    {
      key: 'before_shift',
      title: 'Chuẩn bị trước ngày đầu',
      description: 'Chốt ca đầu, người kèm, nội quy, nhóm chat và công cụ.',
      status: activeStep === 3 ? 'current' : activeStep > 3 ? 'complete' : 'upcoming',
    },
    {
      key: 'after_shift',
      title: 'Theo dõi sau ca đầu',
      description: 'Chốt kết quả ca đầu, lưu ghi chú và follow-up nếu cần.',
      status: activeStep === 4 ? 'current' : 'upcoming',
    },
  ]
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

    const handleRefresh = () => refresh()

    applyFilterFromUrl()
    window.addEventListener('focus', handleRefresh)
    window.addEventListener('storage', handleRefresh)
    window.addEventListener('popstate', applyFilterFromUrl)
    return () => {
      window.removeEventListener('focus', handleRefresh)
      window.removeEventListener('storage', handleRefresh)
      window.removeEventListener('popstate', applyFilterFromUrl)
    }
  }, [])

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

  if (!hasHydrated) {
    return (
      <AppShell navMode="full">
        <div className="rounded-[28px] border border-[rgba(0,29,61,0.08)] bg-white p-6 text-sm font-semibold text-[#001D3D] shadow-sm">
          Đang tải dữ liệu onboarding...
        </div>
      </AppShell>
    )
  }

  if (!user) {
    return (
      <AppShell navMode="full">
        <div className="rounded-[28px] border border-[rgba(0,29,61,0.08)] bg-white p-6 text-sm text-[#5F6B7A] shadow-sm">
          Cần đăng nhập để xem vận hành onboarding.
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell navMode="full">
      <div style={{ minHeight: '100%', background: '#FFF8E8', borderRadius: 32, padding: '20px 16px 24px' }}>
        <div style={{ maxWidth: 1220, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>
                Nhân sự mới
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: '4px 0 0', color: '#001D3D' }}>Vận hành onboarding</h1>
              <div style={{ marginTop: 6, fontSize: 13, color: '#5F6B7A' }}>
                Theo thứ tự từng bước để người mới vào màn hình là biết phải làm gì trước.
              </div>
            </div>
            <Link href="/career-path/onboarding/overview" style={{ fontSize: 12, fontWeight: 700, color: '#2F6FA8', textDecoration: 'none' }}>
              Quay lại Tổng quan onboarding
            </Link>
          </div>

          <OnboardingOpsTimeline
            steps={buildTimelineSteps(detail)}
            summary={{
              immediateCount: overview.allRows.filter((row) => row.priorityKey === 'block_day_one').length,
              followUpCount: overview.allRows.filter((row) => row.priorityKey === 'need_follow_up').length,
              ctaLabel: activeEmployeeId ? 'Đang xem nhân sự được chọn' : 'Chọn người đầu tiên',
            }}
          />

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
              onMarkFirstShift={handleMarkFirstShift}
              onAssignBuddy={handleAssignBuddy}
              onConfirmStorePolicy={handleConfirmStorePolicy}
              onToggleTools={handleToggleTools}
              onSetFirstShiftResult={handleSetFirstShiftResult}
              onSaveFirstShiftNote={handleSaveFirstShiftNote}
              onSetFollowUp={handleSetFollowUp}
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}