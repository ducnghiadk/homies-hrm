'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function RegistrationRedirectInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const weekStart = searchParams.get('weekStart')

  useEffect(() => {
    const target = weekStart
      ? `/shifts/register?weekStart=${encodeURIComponent(weekStart)}`
      : '/shifts/register'
    router.replace(target)
  }, [router, weekStart])

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-gray-500">
      Đang chuyển đến trang Đăng ký ca rảnh tuần...
    </div>
  )
}

export default function RegistrationPage() {
  return (
    <Suspense fallback={null}>
      <RegistrationRedirectInner />
    </Suspense>
  )
}
