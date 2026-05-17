'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { getShiftById, getPositionById } from '@/lib/mock-data'
import { mockEmployees } from '@/lib/mock-data'
import {
  getPendingClaimsForStore, approveOrRejectClaim,
  getOpenShiftById,
} from '@/lib/mock-data-open-shifts'
import { format } from 'date-fns'
import {
  ChevronLeft, CheckCircle2, XCircle, Clock, Users,
  Briefcase, Zap,
} from 'lucide-react'

export default function OpenShiftClaimsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  const storeId = user.store_id
  const pendingClaims = getPendingClaimsForStore(storeId)

  const handleAction = (claimId: string, approve: boolean) => {
    approveOrRejectClaim(claimId, approve, user.id)
    setRefreshKey(k => k + 1)
    setToast(approve ? '✅ Đã duyệt — Nhân viên đã được gán ca' : '❌ Đã từ chối')
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <AppShell showNav>
      <div className="space-y-4 animate-fade-in font-['Inter'] pb-6" key={refreshKey}>
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-dark-700">Duyệt nhận ca trống</h1>
            <p className="text-xs text-gray-400">{pendingClaims.length} yêu cầu đang chờ</p>
          </div>
        </div>

        {/* Claims list */}
        {pendingClaims.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-400 font-medium">Không có yêu cầu chờ duyệt</p>
            <p className="text-xs text-gray-300">Tất cả yêu cầu nhận ca trống đã được xử lý</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pendingClaims.map(({ claim, shift: os }) => {
              const emp = mockEmployees.find(e => e.id === claim.user_id)
              const shiftInfo = getShiftById(os.shift_id)
              const position = getPositionById(os.position_id)

              return (
                <div key={claim.id} className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm">
                  {/* Shift info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: shiftInfo?.color || '#6B7280' }}>
                        {format(new Date(os.date), 'dd')}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-dark-700">
                          {shiftInfo?.name} — {format(new Date(os.date), 'dd/MM')}
                        </p>
                        <p className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock size={10} /> {shiftInfo?.start_time} - {shiftInfo?.end_time}
                          <span className="mx-1">•</span>
                          <Briefcase size={10} /> {position?.name}
                        </p>
                      </div>
                    </div>
                    {os.auto_approve && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-bold flex items-center gap-1">
                        <Zap size={10} /> Auto
                      </span>
                    )}
                  </div>

                  {/* Employee info */}
                  <div className="flex items-center gap-3 bg-blue-50 rounded-xl p-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">
                      {emp?.full_name?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-dark-700">{emp?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-400">
                        Gửi lúc {format(new Date(claim.claimed_at), 'HH:mm dd/MM')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Slot</p>
                      <p className="text-xs font-bold text-dark-700">{os.slots_filled}/{os.slots_needed}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={() => handleAction(claim.id, false)}
                      className="flex-1 py-2.5 rounded-xl bg-red-50 text-red-500 text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
                      <XCircle size={14} /> Từ chối
                    </button>
                    <button onClick={() => handleAction(claim.id, true)}
                      className="flex-1 py-2.5 rounded-xl bg-green-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform shadow-sm">
                      <CheckCircle2 size={14} /> Duyệt
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-dark-700 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}
    </AppShell>
  )
}
