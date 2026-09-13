'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PreferenceSettingsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/settings/schedule-rules?tab=registration')
  }, [router])

  return null
}
