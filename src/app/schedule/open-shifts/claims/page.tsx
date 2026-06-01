'use client'

import { useEffect, useMemo, useState, Suspense } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  approveOrRejectClaim,
  getPendingClaimsForStore,
  getOpenShiftClaimStateMeta,
  getOpenShiftStateMeta,
  getPositionById,
  getShiftById,
  getStoreById,
  type OpenShift,
  type OpenShiftClaim,
} from '@/lib/mock-data-open-shifts'
import { getEmployeeById, mockStores } from '@/lib/mock-data'
import { notifyOpenShiftClaimResult } from '@/lib/notifications/open-shift-notifications'
import { ScheduleEmailService } from '@/lib/services/schedule-email-service'
import { format } from 'date-fns'
import {
  Briefcase,
  CheckCircle2,
  ChevronLeft,
  Clock,
  MapPin,
  ShieldAlert,
  Users,
  XCircle,
} from 'lucide-react'

function ClaimReviewCard({
  claim,
  shift,
  onAction,
  acting,
  highlighted,
}: {
  claim: OpenShiftClaim
  shift: OpenShift
  onAction: (claimId: string, approve: boolean) => void
  acting: boolean
  highlighted?: boolean
}) {
  const [showClaimTimeline, setShowClaimTimeline] = useState(false)
  const [showShiftTimeline, setShowShiftTimeline] = useState(false)
  const employee = getEmployeeById(claim.user_id)
  const shiftInfo = getShiftById(shift.shift_id)
  const store = getStoreById(shift.store_id)
  const position = getPositionById(shift.position_id)
  const claimEvents = claim.events || []
  const shiftEvents = shift.events || []
  const claimStateMeta = getOpenShiftClaimStateMeta(claim)
  const shiftStateMeta = getOpenShiftStateMeta(shift)

  return (
    <div
      id={`open-shift-claim-${claim.id}`}
      className={`bg-white rounded-2xl border p-4 space-y-4 shadow-sm transition-all ${
        highlighted ? 'border-primary-300 ring-2 ring-primary-100' : 'border-gray-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: shiftInfo?.color || '#6B7280' }}
          >
            {format(new Date(shift.date), 'dd')}
          </div>
          <div>
            <p className="text-sm font-bold text-dark-700">{employee?.full_name || claim.user_id}</p>
            <p className="text-xs text-gray-400">
              Đăng ký lúc {format(new Date(claim.claimed_at), 'HH:mm dd/MM/yyyy')}
            </p>
          </div>
        </div>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${claimStateMeta.tone}`}>
          {claimStateMeta.label}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="rounded-xl bg-gray-50 px-3 py-2">
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <Clock size={10} /> Ca làm
          </p>
          <p className="text-xs font-bold text-dark-700">
            {shiftInfo?.name || 'Ca'} • {shiftInfo?.start_time} - {shiftInfo?.end_time}
          </p>
        </div>
        <div className="rounded-xl bg-gray-50 px-3 py-2">
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <MapPin size={10} /> Cửa hàng
          </p>
          <p className="text-xs font-bold text-dark-700">{store?.name || shift.store_id}</p>
        </div>
        <div className="rounded-xl bg-gray-50 px-3 py-2">
          <p className="text-[10px] text-gray-400 flex items-center gap-1">
            <Briefcase size={10} /> Vị trí
          </p>
          <p className="text-xs font-bold text-dark-700">{position?.name || shift.position_id}</p>
        </div>
      </div>

      {shift.note && (
        <div className="rounded-xl bg-primary-50 border border-primary-100 px-3 py-2 text-xs text-primary-700">
          Ghi chú ca trống: {shift.note}
        </div>
      )}

      <div className={`rounded-xl px-3 py-2 text-[11px] ${claimStateMeta.tone}`}>
        {claimStateMeta.detail}
      </div>
      <div className={`rounded-xl px-3 py-2 text-[11px] ${shiftStateMeta.tone}`}>
        {shiftStateMeta.label}: {shiftStateMeta.detail}
      </div>

      {/* Claim Event Timeline */}
      {claimEvents.length > 0 && (
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <button
            onClick={() => setShowClaimTimeline(!showClaimTimeline)}
            type="button"
            className="w-full text-left text-[10px] text-primary-600 font-bold hover:underline flex items-center justify-between">
            <span>{showClaimTimeline ? 'Ẩn lịch sử đăng ký' : 'Xem lịch sử đăng ký'}</span>
            <span className="text-[9px] text-gray-400 font-medium">({claimEvents.length} bước)</span>
          </button>

          {showClaimTimeline && (
            <div className="space-y-3 pl-2.5 pt-1 border-l-2 border-primary-100 ml-1.5 transition-all">
              {claimEvents.map((ev, index) => {
                let badgeColor = 'bg-gray-400'
                if (ev.event === 'claim_submitted') badgeColor = 'bg-warning-500'
                else if (ev.event === 'claim_approved' || ev.event === 'auto_approved') badgeColor = 'bg-success-500'
                else if (ev.event === 'claim_rejected') badgeColor = 'bg-error-500'
                else if (ev.event === 'cancelled') badgeColor = 'bg-gray-500'

                return (
                  <div key={`claim-${index}`} className="relative flex flex-col space-y-0.5 animate-fade-in">
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

      {/* Open Shift Event Timeline */}
      {shiftEvents.length > 0 && (
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
            Nhật ký ca trống
          </div>
          <button
            onClick={() => setShowShiftTimeline(!showShiftTimeline)}
            type="button"
            className="w-full text-left text-[10px] text-primary-600 font-bold hover:underline flex items-center justify-between">
            <span>{showShiftTimeline ? 'Ẩn lịch sử ca trống' : 'Xem lịch sử ca trống'}</span>
            <span className="text-[9px] text-gray-400 font-medium">({shiftEvents.length} bước)</span>
          </button>
          
          {showShiftTimeline && (
            <div className="space-y-3 pl-2.5 pt-1 border-l-2 border-primary-100 ml-1.5 transition-all">
              {shiftEvents.map((ev, index) => {
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

      <div className="flex gap-2">
        <button
          onClick={() => onAction(claim.id, false)}
          disabled={acting}
          className="flex-1 py-2.5 rounded-xl bg-error-50 text-error-600 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          <XCircle size={14} /> Từ chối
        </button>
        <button
          onClick={() => onAction(claim.id, true)}
          disabled={acting}
          className="flex-1 py-2.5 rounded-xl bg-success-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          <CheckCircle2 size={14} /> Duyệt nhận ca
        </button>
      </div>
    </div>
  )
}

function OpenShiftClaimsPageContent() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [toast, setToast] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [actingId, setActingId] = useState<string | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState(() => searchParams.get('storeId') || '')
  const [searchQuery, setSearchQuery] = useState('')
  const [positionFilter, setPositionFilter] = useState<'all' | string>('all')
  const [dateFrom, setDateFrom] = useState(() => searchParams.get('dateFrom') || '')
  const [dateTo, setDateTo] = useState(() => searchParams.get('dateTo') || '')
  const [sortBy, setSortBy] = useState<'oldest' | 'newest'>('oldest')

  useEffect(() => {
    if (!isAuthenticated) router.push('/login')
  }, [isAuthenticated, router])

  const activeStoreId = selectedStoreId || user?.store_id || ''
  const highlightedClaimId = searchParams.get('claimId')
  const isManager = user?.role === 'store_manager' || user?.role === 'hr_admin' || user?.role === 'ceo'
  const storeOptions = user?.role === 'store_manager'
    ? mockStores.filter(store => store.id === user.store_id)
    : mockStores
  const pendingClaims = useMemo(() => {
    return activeStoreId ? getPendingClaimsForStore(activeStoreId) : []
  }, [activeStoreId])
  const availablePositions = useMemo(() => {
    const ids = Array.from(new Set(pendingClaims.map(item => item.shift.position_id)))
    return ids
      .map(id => ({ id, name: getPositionById(id)?.name || id }))
      .sort((left, right) => left.name.localeCompare(right.name))
  }, [pendingClaims])
  const filteredClaims = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return pendingClaims
      .filter(({ claim, shift }) => {
        if (positionFilter !== 'all' && shift.position_id !== positionFilter) {
          return false
        }

        if (dateFrom && shift.date < dateFrom) {
          return false
        }

        if (dateTo && shift.date > dateTo) {
          return false
        }

        if (!normalizedQuery) return true

        const employeeName = getEmployeeById(claim.user_id)?.full_name.toLowerCase() || ''
        const positionName = getPositionById(shift.position_id)?.name.toLowerCase() || ''
        const shiftName = getShiftById(shift.shift_id)?.name.toLowerCase() || ''
        const storeName = getStoreById(shift.store_id)?.name.toLowerCase() || ''

        return employeeName.includes(normalizedQuery) ||
          positionName.includes(normalizedQuery) ||
          shiftName.includes(normalizedQuery) ||
          storeName.includes(normalizedQuery)
      })
      .sort((left, right) => {
        if (sortBy === 'newest') {
          return right.claim.claimed_at.localeCompare(left.claim.claimed_at)
        }
        return left.claim.claimed_at.localeCompare(right.claim.claimed_at)
      })
  }, [dateFrom, dateTo, pendingClaims, positionFilter, searchQuery, sortBy])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (highlightedClaimId) {
        document.getElementById(`open-shift-claim-${highlightedClaimId}`)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }, 150)
    return () => window.clearTimeout(timer)
  }, [filteredClaims, highlightedClaimId])

  if (!user) return null

  if (!isManager) {
    return (
      <AppShell title="Duyệt nhận ca trống">
        <div className="py-20 text-center text-gray-500">
          <ShieldAlert size={40} className="mx-auto mb-3 text-error-500" />
          <p className="text-lg font-bold">Không có quyền truy cập</p>
          <p className="text-sm">Trang này dành cho quản lý và HR.</p>
        </div>
      </AppShell>
    )
  }

  const handleAction = (claimId: string, approve: boolean) => {
    setActingId(claimId)
    const updated = approveOrRejectClaim(claimId, approve, user.id)

    if (!updated) {
      setToast('Không thể xử lý yêu cầu này')
      setActingId(null)
      setTimeout(() => setToast(null), 2500)
      return
    }

    const handled = pendingClaims.find(item => item.claim.id === claimId)
    const shift = handled?.shift
    const shiftInfo = shift ? getShiftById(shift.shift_id) : null
    const store = shift ? getStoreById(shift.store_id) : null
    const employee = getEmployeeById(updated.user_id)

    if (shift) {
      notifyOpenShiftClaimResult({
        openShiftId: shift.id,
        claimId: updated.id,
        userId: updated.user_id,
        userName: employee?.full_name || updated.user_id,
        approved: approve,
        managerName: user.full_name,
        shiftName: shiftInfo?.name || 'Ca làm',
        date: format(new Date(shift.date), 'dd/MM/yyyy'),
        storeName: store?.name || shift.store_id,
      })

      if (employee?.email) {
        ScheduleEmailService.sendEmail({
          type: 'open_shift_assigned',
          to: employee.email,
          subject: approve ? 'Yêu cầu nhận ca đã được duyệt' : 'Yêu cầu nhận ca bị từ chối',
          body_preview: approve
            ? `${user.full_name} đã duyệt yêu cầu nhận ca ${shiftInfo?.name || 'Ca làm'} ngày ${format(new Date(shift.date), 'dd/MM/yyyy')}. Vui lòng kiểm tra lại lịch làm của bạn.`
            : `${user.full_name} đã từ chối yêu cầu nhận ca ${shiftInfo?.name || 'Ca làm'} ngày ${format(new Date(shift.date), 'dd/MM/yyyy')}.`,
          related_schedule_id: shift.source_schedule_id,
          related_week: shift.date,
        })
      }
    }

    setRefreshKey(key => key + 1)
    setActingId(null)
    setToast(approve ? 'Đã duyệt nhận ca và cập nhật lịch' : 'Đã từ chối yêu cầu nhận ca')
    setTimeout(() => setToast(null), 2500)
  }

  return (
    <AppShell showNav>
      <div className="space-y-4 animate-fade-in pb-6" key={refreshKey}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft size={20} className="text-gray-500" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-dark-700">Duyệt nhận ca trống</h1>
            <p className="text-xs text-gray-400">Manager xử lý các yêu cầu nhận ca đang chờ</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Chờ duyệt</p>
            <p className="mt-2 text-2xl font-black text-dark-700">{pendingClaims.length}</p>
            <p className="mt-1 text-xs text-gray-500">Tất cả claim đang chờ xử lý trong cửa hàng này.</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Lọc vị trí</p>
            <p className="mt-2 text-2xl font-black text-dark-700">{availablePositions.length}</p>
            <p className="mt-1 text-xs text-gray-500">Các vị trí đang có claim chờ duyệt.</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Flow state</p>
            <p className="mt-2 text-sm font-bold text-dark-700">Đang mở / Chờ duyệt / Đã duyệt / Bị từ chối / Đã đủ người</p>
            <p className="mt-1 text-xs text-gray-500">Màn duyệt hiển thị đầy đủ state cho claim và ca trống.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-dark-700">Yêu cầu chờ duyệt</p>
            <p className="text-xs text-gray-400">{pendingClaims.length} yêu cầu đang cần xử lý</p>
          </div>
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <select
              value={activeStoreId}
              onChange={e => setSelectedStoreId(e.target.value)}
              disabled={storeOptions.length <= 1}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-dark-700 focus:outline-none"
            >
              {storeOptions.map(store => (
                <option key={store.id} value={store.id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Tìm theo nhân viên, ca, cửa hàng..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={positionFilter}
              onChange={e => setPositionFilter(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tất cả vị trí</option>
              {availablePositions.map(position => (
                <option key={position.id} value={position.id}>
                  {position.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'oldest' | 'newest')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="oldest">Cũ nhất trước</option>
              <option value="newest">Mới nhất trước</option>
            </select>
          </div>
          <p className="text-xs text-gray-400">
            {filteredClaims.length} / {pendingClaims.length} yêu cầu đang hiển thị
          </p>
        </div>

        {filteredClaims.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
              <CheckCircle2 size={28} className="text-gray-300" />
            </div>
            <p className="text-sm text-gray-400 font-medium">
              {pendingClaims.length === 0 ? 'Không có yêu cầu nào chờ duyệt' : 'Không có yêu cầu nào khớp bộ lọc'}
            </p>
            <p className="text-xs text-gray-300">
              {pendingClaims.length === 0
                ? 'Khi nhân viên đăng ký nhận ca trống, yêu cầu sẽ hiện ở đây.'
                : 'Hãy thử nới bộ lọc ngày, vị trí hoặc từ khóa tìm kiếm.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClaims.map(({ claim, shift }) => (
              <ClaimReviewCard
                key={claim.id}
                claim={claim}
                shift={shift}
                acting={actingId === claim.id}
                onAction={handleAction}
                highlighted={claim.id === highlightedClaimId}
              />
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-dark-700 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}
    </AppShell>
  )
}

export default function OpenShiftClaimsPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm font-medium">Đang tải dữ liệu duyệt nhận ca...</p>
        </div>
      </div>
    }>
      <OpenShiftClaimsPageContent />
    </Suspense>
  )
}
