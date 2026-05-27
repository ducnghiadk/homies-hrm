'use client'

import { useState } from 'react'
import { OperationsChecklistDetail } from '@/components/onboarding-operations/OperationsChecklistDetail'
import { UpcomingOnboardingList } from '@/components/onboarding-operations/UpcomingOnboardingList'
import { OnboardingOperationsService } from '@/lib/services/onboarding-operations-service'
import { useAuthStore } from '@/store/auth-store'

type QuickCompletePayload = {
  employeeId: string
  key: string
  value?: string
}

export default function CareerPathOnboardingPage() {
  const user = useAuthStore((state) => state.user)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [, setRefreshKey] = useState(0)

  const rows = user ? OnboardingOperationsService.getUpcomingRows(user) : []
  const activeEmployeeId = rows.some((row) => row.employeeId === selectedEmployeeId)
    ? selectedEmployeeId
    : rows[0]?.employeeId ?? null
  const detail = user && activeEmployeeId
    ? OnboardingOperationsService.getEmployeeDetail(activeEmployeeId, user)
    : null

  const handleQuickComplete = ({ employeeId, key, value }: QuickCompletePayload) => {
    if (key === 'first_shift') {
      const firstShiftLabel = value?.trim() || window.prompt('Nhập ca đầu và giờ có mặt')
      if (!firstShiftLabel) return
      OnboardingOperationsService.updateChecklist(employeeId, {
        key: 'first_shift',
        firstShiftLabel,
      })
    } else if (key === 'buddy') {
      const assignedBuddyName = value?.trim() || window.prompt('Nhập tên người kèm')
      if (!assignedBuddyName) return
      OnboardingOperationsService.updateChecklist(employeeId, {
        key: 'buddy',
        assignedBuddyName,
      })
    } else if (key === 'uniform_attendance_policy') {
      OnboardingOperationsService.updateChecklist(employeeId, {
        key: 'uniform_attendance_policy',
        storePolicyConfirmed: true,
      })
    } else if (key === 'tools_and_group') {
      OnboardingOperationsService.updateChecklist(employeeId, {
        key: 'tools_and_group',
        hasChatAccess: true,
      })
    } else if (
      key === 'first_shift_result'
      && (value === 'pass' || value === 'follow_up' || value === 'issue')
    ) {
      OnboardingOperationsService.updateChecklist(employeeId, {
        key: 'first_shift_result',
        firstShiftResult: value,
      })
    }

    setRefreshKey((current) => current + 1)
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fff7ef_0%,#fffdf9_100%)] px-4 py-4 md:px-6 md:py-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <div className="rounded-[28px] bg-white/80 px-4 py-4 shadow-sm ring-1 ring-black/5 backdrop-blur md:px-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-primary-600">
            Onboarding Operations
          </p>
          <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">
                Danh sách vào ca mới
              </h1>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Quản lý xem nhanh ai sắp vào ca đầu và còn thiếu mục nào trước khi nhận việc.
              </p>
            </div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff4e8] px-3 py-1.5 text-xs font-medium text-[#9a5b22]">
              <span className="h-2 w-2 rounded-full bg-[#f1a561]" />
              {rows.length} người trong danh sách gần nhất
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <UpcomingOnboardingList
            rows={rows}
            selectedEmployeeId={activeEmployeeId}
            onSelect={setSelectedEmployeeId}
          />
          <OperationsChecklistDetail
            detail={detail}
            onQuickComplete={handleQuickComplete}
          />
        </div>
      </div>
    </div>
  )
}
