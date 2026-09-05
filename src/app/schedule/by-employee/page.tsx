'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EmployeeSchedulingBoard from '@/components/scheduling/EmployeeSchedulingBoard'

function ScheduleByEmployeeContent() {
  const searchParams = useSearchParams()
  const weekStart = searchParams.get('weekStart')
  const storeId = searchParams.get('storeId')

  return <EmployeeSchedulingBoard weekStartQuery={weekStart} storeIdQuery={storeId} />
}

export default function ScheduleByEmployeePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-vanilla-50">
          <div className="text-center">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 border-t-2 border-primary"></div>
            <p className="text-sm font-medium text-gray-500">Đang tải lịch theo nhân viên...</p>
          </div>
        </div>
      }
    >
      <ScheduleByEmployeeContent />
    </Suspense>
  )
}
