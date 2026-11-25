'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import StoreCheckinMethodPanel from '@/components/settings/StoreCheckinMethodPanel'

// Cài đặt chấm công bằng Wi-Fi quán / mã QR theo từng chi nhánh (lưu trên máy chủ).
export default function WifiConfigPage() {
  const router = useRouter()

  return (
    <AppShell>
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-dark-700 transition-colors hover:bg-gray-200"
          aria-label="Quay lại"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-dark-700">Chấm công Wi-Fi</h1>
          <p className="text-xs text-gray-400">Chọn cách chấm công cho từng chi nhánh: Wi-Fi quán, mã QR hoặc cả hai</p>
        </div>
      </div>
      <div className="max-w-2xl">
        <StoreCheckinMethodPanel />
      </div>
    </AppShell>
  )
}
