'use client'

import React, { useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import BSCLogsTab from '@/components/bsc-bonus/BSCLogsTab'
import { ClipboardList, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function ViolationLogPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  if (!user || user.role === 'employee') return null

  const isManager = ['store_manager', 'shift_leader', 'area_manager', 'hr_admin', 'ceo'].includes(user.role)
  const storeId = user.store_id || 'store-001'
  const period = '2026-07'

  return (
    <AppShell title="Nhật Ký Vi Phạm & Sự Cố Cửa Hàng">
      <div className="space-y-6 w-full pb-16 animate-fade-in text-sm">
        {/* Top Navigation Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push('/kpi/violations')}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 transition cursor-pointer"
              title="Quay lại Trung tâm Vi phạm"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <ClipboardList size={20} className="text-rose-600" />
                <h1 className="text-lg font-bold text-gray-900">Nhật Ký Sự Kiện Vi Phạm &amp; Sự Cố Vận Hành Hằng Ngày</h1>
              </div>
              <p className="text-xs text-gray-600 font-medium">
                Ghi nhận 1-Click vi phạm ca làm việc, đối chiếu camera, theo dõi giải trình &amp; cờ khóa thưởng an toàn dòng tiền.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/bsc-bonus"
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-2xs flex items-center gap-1.5 no-underline"
            >
              <ShieldCheck size={16} /> Xem Tác Động Thưởng BSC <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Embedded Complete BSCLogsTab Module */}
        <BSCLogsTab storeId={storeId} period={period} isManager={isManager} />
      </div>
    </AppShell>
  )
}
