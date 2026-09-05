'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function SchedulesRedirectInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const query = searchParams.toString()
    const target = query ? `/schedule?${query}` : '/schedule'
    router.replace(target)
  }, [router, searchParams])

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <p className="animate-pulse text-sm text-gray-500">Đang chuyển hướng sang Bảng Xếp Lịch...</p>
    </div>
  )
}

export default function SchedulesRedirectPage() {
  return (
    <Suspense fallback={null}>
      <SchedulesRedirectInner />
    </Suspense>
  )
}
