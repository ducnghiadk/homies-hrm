'use client'

import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { ArrowLeft, Lock } from 'lucide-react'

export default function PayrollCalculationPage() {
  const router = useRouter()

  return (
    <AppShell title="Tính lương">
      <div className="space-y-4">
        <div className="card">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600">
              <Lock size={20} />
            </div>
            <div className="flex-1">
              <h1 className="text-base font-bold text-gray-900">Trang này đã ngừng sử dụng</h1>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                Trang tính lương cũ dùng dữ liệu thử nghiệm nên đã bị khóa để tránh tính sai lương.
                Vui lòng dùng trang bảng lương hiện tại, nơi giờ công đã đọc từ hệ thống chấm công thật.
              </p>
              <button
                onClick={() => router.push('/payroll')}
                className="btn btn-primary mt-4 gap-2 text-sm"
              >
                <ArrowLeft size={16} />
                Về trang bảng lương
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
