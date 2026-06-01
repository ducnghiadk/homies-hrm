'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LeaveApprovalPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/leave/request?tab=approval')
  }, [router])
  return null
}
