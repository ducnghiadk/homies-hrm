'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LeaveBalancePage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/leave/request')
  }, [router])
  return null
}
