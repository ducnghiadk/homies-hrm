'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LaborCostSettingsPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/settings/payroll?tab=budgets')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-sm text-gray-500 animate-pulse">Đang chuyển hướng sang Cấu hình Lương & Ngân sách...</p>
    </div>
  )
}

