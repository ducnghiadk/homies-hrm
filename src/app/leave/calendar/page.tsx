'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LeaveCalendarPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/leave/request?tab=calendar')
  }, [router])
  return null
}
