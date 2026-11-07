'use client'

import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import BSCLogsTab from '@/components/bsc-bonus/BSCLogsTab'
import AuthorizedVerifiersModal from '@/components/kpi/incidents/AuthorizedVerifiersModal'
import { ClipboardList, ArrowLeft, ArrowRight, ShieldCheck, Calendar, Share2, UserCheck } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function ViolationLogPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [period, setPeriod] = useState('2026-09')
  const [isVerifiersModalOpen, setIsVerifiersModalOpen] = useState(false)

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) {
      router.push('/login?redirect=/kpi/violations/log')
    }
  }, [hasHydrated, isAuthenticated, router])

  if (!hasHydrated || !user || user.role === 'employee') return null

  const isManager = ['store_manager', 'shift_leader', 'area_manager', 'hr_admin', 'ceo'].includes(user.role)
  const storeId = user.store_id || 'store-001'

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

          <div className="flex items-center gap-2 flex-wrap">
            {/* Bộ chọn kỳ tháng */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-bold text-gray-800">
              <Calendar size={14} className="text-[#2F6FA8]" />
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                aria-label="Chọn kỳ tháng"
                className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer"
              >
                <option value="2026-09">Tháng 09/2026</option>
                <option value="2026-08">Tháng 08/2026</option>
                <option value="2026-07">Tháng 07/2026</option>
                <option value="2026-06">Tháng 06/2026</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => {
                const url = `${window.location.origin}/kpi/violations/public`
                navigator.clipboard.writeText(url)
                toast.success('Đã sao chép link Form Quản lý nhập: ' + url)
              }}
              className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Sao chép link gửi Quản lý quán nhập trên điện thoại"
            >
              <Share2 size={14} className="text-amber-700" />
              <span>Link Quản Lý Nhập</span>
            </button>

            <button
              type="button"
              onClick={() => setIsVerifiersModalOpen(true)}
              className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold transition shadow-2xs flex items-center gap-1.5 cursor-pointer"
              title="Cài đặt danh sách người được quyền ghi nhận sự cố và mã PIN từng quán"
            >
              <UserCheck size={14} className="text-emerald-700" />
              <span>Phân Quyền Người Nhập</span>
            </button>

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

        <AuthorizedVerifiersModal
          isOpen={isVerifiersModalOpen}
          onClose={() => setIsVerifiersModalOpen(false)}
        />
      </div>
    </AppShell>
  )
}
