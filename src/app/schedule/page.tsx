'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import ManagerSchedulingBoard from '@/components/scheduling/ManagerSchedulingBoard'
import ProtectedRoute from '@/components/auth/ProtectedRoute'

function SchedulePageInner() {
  const searchParams = useSearchParams()
  const weekStart = searchParams.get('weekStart')
  const storeId = searchParams.get('storeId')

  return <ManagerSchedulingBoard weekStartQuery={weekStart} storeIdQuery={storeId} />
}

export default function SchedulePage() {
  return (
    <ProtectedRoute requiredPermission="schedule.assign">
      <Suspense fallback={null}>
        <SchedulePageInner />
      </Suspense>
    </ProtectedRoute>
  )
}
