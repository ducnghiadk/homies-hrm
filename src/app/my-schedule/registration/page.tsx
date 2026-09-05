'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import EmployeeScheduleRegistration from '@/components/scheduling/EmployeeScheduleRegistration'

function RegistrationInner() {
  const searchParams = useSearchParams()
  const weekStart = searchParams.get('weekStart')

  return <EmployeeScheduleRegistration weekStartQuery={weekStart} />
}

export default function RegistrationPage() {
  return (
    <Suspense fallback={null}>
      <RegistrationInner />
    </Suspense>
  )
}
