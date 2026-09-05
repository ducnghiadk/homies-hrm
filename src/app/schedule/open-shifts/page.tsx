'use client'

import { useEffect, useState, Suspense } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  getAvailableOpenShiftsForEmployee, getMyOpenShiftClaims,
  claimOpenShift, getShiftById, getStoreById, getPositionById,
  getClaimsForOpenShift, getOpenShiftById, getPendingClaimsForStore,
  getOpenShiftClaimStateMeta, getOpenShiftStateMeta,
  type OpenShift, type OpenShiftClaim,
} from '@/lib/mock-data-open-shifts'
import { mockEmployees } from '@/lib/mock-data'
import {
  notifyOpenShiftClaimResult,
  notifyOpenShiftClaimSubmitted,
} from '@/lib/notifications/open-shift-notifications'
import { ScheduleEmailService } from '@/lib/services/schedule-email-service'
import { format } from 'date-fns'
import {
  ChevronLeft, Clock, MapPin, Users, Briefcase,
  CheckCircle2, Zap, AlertCircle, Send,
} from 'lucide-react'

const statusColors: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ duyệt', color: '#F6C85F', bg: '#FFF8E8' },
  approved: { label: 'Đã duyệt', color: '#1E9E57', bg: '#D1FAE5' },
  rejected: { label: 'Từ chối', color: '#D9381E', bg: '#FEE2E2' },
}

function OpenShiftCard({ os, onClaim, highlighted }: { os: OpenShift; onClaim: (id: string) => void; highlighted?: boolean }) {
  const shift = getShiftById(os.shift_id)
  const store = getStoreById(os.store_id)
  const position = getPositionById(os.position_id)
  const remaining = os.slots_needed - os.slots_filled
  const claims = getClaimsForOpenShift(os.id)
  const approvedCount = claims.filter(c => c.status === 'approved').length
  const stateMeta = getOpenShiftStateMeta(os)

  return (
    <div
      id={`open-shift-${os.id}`}
      className={`bg-white rounded-2xl border p-4 space-y-3 shadow-sm transition-all ${
        highlighted ? 'border-primary-300 ring-2 ring-primary-100' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: shift?.color || '#6B7280' }}>
            {format(new Date(os.date), 'dd')}
          </div>
          <div>
            <p className="text-xs font-bold text-dark-700">
              {shift?.name || 'Ca'} — {format(new Date(os.date), 'EEEE, dd/MM')}
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={10} /> {shift?.start_time} - {shift?.end_time}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${stateMeta.tone}`}>
            {stateMeta.label}
          </span>
          {os.auto_approve && (
            <span className="text-[9px] px-2 py-0.5 rounded-full bg-success-50 text-success-600 font-bold flex items-center gap-1">
              <Zap size={10} /> Tự duyệt
            </span>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <div className="flex-1 px-3 py-2 rounded-xl bg-vanilla-50 space-y-0.5">
          <p className="text-[9px] text-gray-400 flex items-center gap-1"><MapPin size={9} /> Cửa hàng</p>
          <p className="text-xs font-bold text-dark-700">{store?.name || ''}</p>
        </div>
        <div className="flex-1 px-3 py-2 rounded-xl bg-vanilla-50 space-y-0.5">
          <p className="text-[9px] text-gray-400 flex items-center gap-1"><Briefcase size={9} /> Vị trí</p>
          <p className="text-xs font-bold text-dark-700">{position?.name || ''}</p>
        </div>
        <div className="flex-1 px-3 py-2 rounded-xl bg-vanilla-50 space-y-0.5">
          <p className="text-[9px] text-gray-400 flex items-center gap-1"><Users size={9} /> Cần</p>
          <p className="text-xs font-bold text-dark-700">
            <span className="text-success-600">{approvedCount}</span>/{os.slots_needed}
            {remaining > 0 && <span className="text-gray-400 ml-1">({remaining} trống)</span>}
          </p>
        </div>
      </div>

      {os.note && (
        <p className="text-xs text-gray-500 italic bg-warning-50 px-3 py-1.5 rounded-lg">
          💡 {os.note}
        </p>
      )}

      <div className={`rounded-xl px-3 py-2 text-[11px] ${stateMeta.tone}`}>
        {stateMeta.detail}
      </div>

      <button onClick={() => onClaim(os.id)}
        className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary-700 transition-all active:scale-[0.98] shadow-sm">
        <Send size={14} /> Nhận ca này
      </button>
    </div>
  )
}

function ClaimCard({ claim, shift, highlighted }: { claim: OpenShiftClaim; shift: OpenShift; highlighted?: boolean }) {
  const [showTimeline, setShowTimeline] = useState(false)
  const s = getShiftById(shift.shift_id)
  const status = statusColors[claim.status] || statusColors.pending
  const stateMeta = getOpenShiftClaimStateMeta(claim)
  return (
    <div
      id={`open-shift-claim-${claim.id}`}
      className={`bg-white rounded-2xl border p-4 flex flex-col space-y-3 shadow-sm transition-all ${
        highlighted ? 'border-primary-300 ring-2 ring-primary-100' : 'border-gray-100'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
          style={{ backgroundColor: s?.color || '#6B7280' }}>
          {format(new Date(shift.date), 'dd')}
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-dark-700">
            {s?.name} — {format(new Date(shift.date), 'dd/MM')}
          </p>
          <p className="text-xs text-gray-400">
            {format(new Date(claim.claimed_at), 'HH:mm dd/MM')}
          </p>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-lg shrink-0"
          style={{ backgroundColor: status.bg, color: status.color }}>
          {status.label}
        </span>
      </div>
      <div className={`rounded-xl px-3 py-2 text-[11px] ${stateMeta.tone}`}>
        {stateMeta.detail}
      </div>

      {/* Event Timeline / Audit Trail */}
      {shift.events && shift.events.length > 0 && (
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            type="button"
            className="w-full text-left text-[10px] text-primary-600 font-bold hover:underline flex items-center justify-between">
            <span>{showTimeline ? 'Ẩn lịch sử xử lý' : 'Xem lịch sử xử lý'}</span>
            <span className="text-[9px] text-gray-400 font-medium">({shift.events.length} bước)</span>
          </button>
          
          {showTimeline && (
            <div className="space-y-3 pl-2.5 pt-1 border-l-2 border-primary-100 ml-1.5 transition-all">
              {shift.events.map((ev, index) => {
                let badgeColor = 'bg-gray-400'
                if (ev.event === 'created') badgeColor = 'bg-primary-500'
                else if (ev.event === 'claim_submitted') badgeColor = 'bg-warning-500'
                else if (ev.event === 'claim_approved' || ev.event === 'auto_approved') badgeColor = 'bg-success-500'
                else if (ev.event === 'claim_rejected') badgeColor = 'bg-error-500'
                else if (ev.event === 'cancelled') badgeColor = 'bg-gray-500'
                else if (ev.event === 'filled') badgeColor = 'bg-teal-500'

                return (
                  <div key={index} className="relative flex flex-col space-y-0.5 animate-fade-in">
                    {/* Timeline dot */}
                    <div className={`absolute -left-[14px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${badgeColor}`} />
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold text-dark-700">{ev.by_name}</span>
                      <span className="text-gray-400">{format(new Date(ev.timestamp), 'dd/MM HH:mm')}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-medium">{ev.note}</p>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function OpenShiftsPageContent() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'available' | 'my'>(() => {
    const requestedTab = searchParams.get('tab')
    return requestedTab === 'my' ? 'my' : 'available'
  })
  const [toast, setToast] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const highlightedOpenShiftId = searchParams.get('openShiftId')
  const highlightedClaimId = searchParams.get('claimId')

  const available = user ? getAvailableOpenShiftsForEmployee(user.id) : []
  const myClaims = user ? getMyOpenShiftClaims(user.id) : []
  const canReviewClaims = user ? (user.role === 'store_manager' || user.role === 'hr_admin' || user.role === 'ceo') : false
  const pendingClaimCount = user && canReviewClaims ? getPendingClaimsForStore(user.store_id).length : 0

  useEffect(() => {
    const targetId = tab === 'available' ? highlightedOpenShiftId : highlightedClaimId
    const prefix = tab === 'available' ? 'open-shift' : 'open-shift-claim'
    if (!targetId) return
    const timer = window.setTimeout(() => {
      document.getElementById(`${prefix}-${targetId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 150)
    return () => window.clearTimeout(timer)
  }, [highlightedClaimId, highlightedOpenShiftId, tab, available.length, myClaims.length])

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  const confirmShift = confirmId ? available.find(os => os.id === confirmId) || null : null
  const confirmShiftInfo = confirmShift ? getShiftById(confirmShift.shift_id) : null

  const handleClaim = (osId: string) => {
    setConfirmId(osId)
  }

  const handleConfirmClaim = () => {
    if (!confirmId) return
    const result = claimOpenShift(confirmId, user.id)
    if (result) {
      const os = getOpenShiftById(confirmId)
      const shiftInfo = os ? getShiftById(os.shift_id) : null
      const store = os ? getStoreById(os.store_id) : null

      if (result.status === 'pending') {
        const storeManagers = mockEmployees.filter(e =>
          e.store_id === user.store_id &&
          (e.role === 'store_manager' || e.role === 'hr_admin' || e.role === 'ceo')
        ).map(e => e.id)

        notifyOpenShiftClaimSubmitted({
          openShiftId: confirmId,
          claimId: result.id,
          userId: user.id,
          userName: user.full_name,
          shiftName: shiftInfo?.name || 'Ca',
          date: os ? format(new Date(os.date), 'dd/MM/yyyy') : '',
          startTime: shiftInfo?.start_time || '',
          endTime: shiftInfo?.end_time || '',
          storeName: store?.name || '',
          managerIds: storeManagers,
          autoApprove: false,
        })

        setToast('📨 Đã gửi yêu cầu — chờ Manager duyệt')
      } else {
        notifyOpenShiftClaimResult({
          openShiftId: confirmId,
          claimId: result.id,
          userId: user.id,
          userName: user.full_name,
          approved: true,
          managerName: 'Hệ thống',
          shiftName: shiftInfo?.name || 'Ca làm',
          date: os ? format(new Date(os.date), 'dd/MM/yyyy') : '',
          storeName: store?.name || '',
        })

        if (user.email) {
          ScheduleEmailService.sendEmail({
            type: 'open_shift_assigned',
            to: user.email,
            subject: 'Bạn đã nhận ca trống thành công',
            body_preview: `Ca ${shiftInfo?.name || 'Ca làm'} ngày ${os ? format(new Date(os.date), 'dd/MM/yyyy') : ''} tại ${store?.name || 'cửa hàng'} đã được gán cho bạn.`,
            related_schedule_id: os?.source_schedule_id,
            related_week: os?.date,
          })
        }

        setToast('✅ Đã nhận ca thành công (tự duyệt)!')
      }
    } else {
      setToast('❌ Không thể nhận ca')
    }
    setConfirmId(null)
    setRefreshKey(k => k + 1)
    setTimeout(() => setToast(null), 3000)
  }

  const tabs = [
    { key: 'available' as const, label: 'Ca trống', count: available.length },
    { key: 'my' as const, label: 'Đã đăng ký', count: myClaims.length },
  ]

  return (
    <AppShell showNav>
      <div className="space-y-4 animate-fade-in font-['Inter'] pb-6" key={refreshKey}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-dark-700">Ca trống</h1>
              <p className="text-xs text-gray-400">Ca cần người — tự đăng ký</p>
            </div>
          </div>
          {canReviewClaims && (
            <button
              onClick={() => router.push('/schedule/open-shifts/claims')}
              className="px-3 py-2 rounded-xl bg-warning-50 text-warning-700 border border-warning-200 text-xs font-bold flex items-center gap-2 hover:bg-warning-100 transition-colors"
            >
              Duyệt đơn
              {pendingClaimCount > 0 && (
                <span className="min-w-5 h-5 px-1 rounded-full bg-warning-600 text-white text-[10px] flex items-center justify-center">
                  {pendingClaimCount}
                </span>
              )}
            </button>
          )}
        </div>

        {canReviewClaims && (
          <div className="bg-warning-50 border border-warning-200 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-warning-800">Manager inbox cho ca trống</p>
              <p className="text-xs text-warning-700">
                {pendingClaimCount > 0
                  ? `Hiện có ${pendingClaimCount} yêu cầu nhận ca đang chờ duyệt.`
                  : 'Hiện chưa có yêu cầu nào chờ duyệt.'}
              </p>
              <p className="mt-1 text-xs text-warning-600">
                Tao hoac huy ca trong o board phan ca, trang nay dung de xem va duyet claim.
              </p>
            </div>
            <button
              onClick={() => router.push('/schedule/open-shifts/claims')}
              className="shrink-0 px-3 py-2 rounded-xl bg-white text-warning-800 border border-warning-300 text-xs font-bold hover:bg-warning-100 transition-colors"
            >
              Mở trang duyệt
            </button>
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Ca đang mở</p>
            <p className="mt-2 text-2xl font-black text-dark-700">{available.length}</p>
            <p className="mt-1 text-xs text-gray-500">Các ca bạn còn có thể gửi claim.</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Claim của tôi</p>
            <p className="mt-2 text-2xl font-black text-dark-700">{myClaims.length}</p>
            <p className="mt-1 text-xs text-gray-500">Theo dõi các claim đang chờ, đã duyệt hoặc bị từ chối.</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Flow state</p>
            <p className="mt-2 text-sm font-bold text-dark-700">Đang mở / Chờ duyệt hoặc Tự duyệt / Đã đủ người</p>
            <p className="mt-1 text-xs text-gray-500">Nếu bị từ chối hoặc hủy thì claim sẽ dừng ở bước đó.</p>
          </div>
        </div>

        <div className="flex gap-1 bg-primary-50 rounded-xl p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                tab === t.key ? 'bg-white shadow-sm text-dark-700' : 'text-gray-400'
              }`}>
              {t.label}
              {t.count > 0 && (
                <span className={`ml-0.5 w-5 h-5 rounded-full text-[9px] flex items-center justify-center font-bold ${
                  tab === t.key ? 'bg-primary-500 text-white' : 'bg-gray-300 text-white'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'available' ? (
          <div className="space-y-3">
            {available.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400 font-medium">Không có ca trống phù hợp</p>
                <p className="text-xs text-gray-300">Các ca trống phù hợp với vị trí và lịch của bạn sẽ hiển thị ở đây</p>
              </div>
            ) : (
              available.map(os => (
                <OpenShiftCard
                  key={os.id}
                  os={os}
                  onClaim={handleClaim}
                  highlighted={os.id === highlightedOpenShiftId}
                />
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {myClaims.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto">
                  <AlertCircle size={28} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400 font-medium">Chưa đăng ký ca nào</p>
              </div>
            ) : (
              myClaims.map(({ claim, shift }) => (
                <ClaimCard
                  key={claim.id}
                  claim={claim}
                  shift={shift}
                  highlighted={claim.id === highlightedClaimId}
                />
              ))
            )}
          </div>
        )}
      </div>

      {confirmShift && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 animate-fade-in"
          onClick={() => setConfirmId(null)}>
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-4 animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
            <h3 className="text-lg font-bold text-dark-700 text-center">Xác nhận nhận ca</h3>

            <div className="bg-vanilla-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold"
                  style={{ backgroundColor: confirmShiftInfo?.color || '#6B7280' }}>
                  {format(new Date(confirmShift.date), 'dd')}
                </div>
                <div>
                  <p className="text-sm font-bold text-dark-700">{confirmShiftInfo?.name}</p>
                  <p className="text-xs text-gray-400">{format(new Date(confirmShift.date), 'EEEE, dd/MM/yyyy')}</p>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                <Clock size={12} className="inline mr-1" />
                {confirmShiftInfo?.start_time} - {confirmShiftInfo?.end_time}
              </p>
              {confirmShift.auto_approve && (
                <div className="flex items-center gap-1.5 text-success-600 text-xs font-medium">
                  <Zap size={12} /> Ca này sẽ được duyệt tự động
                </div>
              )}
              {!confirmShift.auto_approve && (
                <div className="flex items-center gap-1.5 text-warning-600 text-xs font-medium">
                  <Clock size={12} /> Cần chờ quản lý duyệt
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)}
                className="flex-1 py-3 rounded-xl bg-primary-50 text-gray-600 text-sm font-medium">
                Hủy
              </button>
              <button onClick={handleConfirmClaim}
                className="flex-1 py-3 rounded-xl bg-primary-600 text-white text-sm font-bold shadow-sm active:scale-[0.98] transition-transform">
                Nhận ca
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-dark-700 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}
    </AppShell>
  )
}

export default function OpenShiftsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-vanilla-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm font-medium">Đang tải danh sách ca trống...</p>
        </div>
      </div>
    }>
      <OpenShiftsPageContent />
    </Suspense>
  )
}
