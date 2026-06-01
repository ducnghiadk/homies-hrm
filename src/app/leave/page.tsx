'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'

export default function LeaveLandingPage() {
  const router = useRouter()
  const { user } = useAuthStore()

  useEffect(() => {
    const isManager = ['store_manager', 'area_manager', 'hr_admin', 'ceo'].includes(user?.role || '')

    if (isManager) {
      router.replace('/leave/request?tab=approvals')
    } else {
      router.replace('/leave/request')
    }
  }, [user, router])

  // Loading state while redirecting
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
    </div>
  )
}
