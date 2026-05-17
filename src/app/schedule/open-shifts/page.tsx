'use client'

import { useState } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import {
  getAvailableOpenShiftsForEmployee, getMyOpenShiftClaims,
  claimOpenShift, getShiftById, getStoreById, getPositionById,
  getClaimsForOpenShift,
  type OpenShift, type OpenShiftClaim,
} from '@/lib/mock-data-open-shifts'
import { format } from 'date-fns'
import {
  ChevronLeft, Clock, MapPin, Users, Briefcase,
  CheckCircle2, Zap, AlertCircle, Send,
} from 'lucide-react'

const statusColors: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ duyệt', color: '#F59E0B', bg: '#FEF3C7' },
  approved: { label: 'Đã duyệt', color: '#10B981', bg: '#D1FAE5' },
  rejected: { label: 'Từ chối', color: '#EF4444', bg: '#FEE2E2' },
}

function OpenShiftCard({ os, onClaim }: { os: OpenShift; onClaim: (id: string) => void }) {
  const shift = getShiftById(os.shift_id)
  const store = getStoreById(os.store_id)
  const position = getPositionById(os.position_id)
  const remaining = os.slots_needed - os.slots_filled
  const claims = getClaimsForOpenShift(os.id)
  const approvedCount = claims.filter(c => c.status === 'approved').length

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3 shadow-sm">
      {/* Header: date + shift */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: shift?.color || '#6B7280' }}>
            {format(new Date(os.date), 'dd')}
          </div>
          <div>
            <p className="text-xs font-bold text-dark-700">
              {shift?.name || 'Ca'} — {format(new Date(os.date), 'EEEE, dd/MM', { })}
            </p>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <Clock size={10} /> {shift?.start_time} - {shift?.end_time}
            </p>
          </div>
        </div>
        {os.auto_approve && (
          <span className="text-[9px] px-2 py-0.5 rounded-full bg-green-50 text-green-600 font-bold flex items-center gap-1">
            <Zap size={10} /> Tự duyệt
          </span>
        )}
      </div>

      {/* Info row */}
      <div className="flex gap-2">
        <div className="flex-1 px-3 py-2 rounded-xl bg-gray-50 space-y-0.5">
          <p className="text-[9px] text-gray-400 flex items-center gap-1"><MapPin size={9} /> Cửa hàng</p>
          <p className="text-xs font-bold text-dark-700">{store?.name || ''}</p>
        </div>
        <div className="flex-1 px-3 py-2 rounded-xl bg-gray-50 space-y-0.5">
          <p className="text-[9px] text-gray-400 flex items-center gap-1"><Briefcase size={9} /> Vị trí</p>
          <p className="text-xs font-bold text-dark-700">{position?.name || ''}</p>
        </div>
        <div className="flex-1 px-3 py-2 rounded-xl bg-gray-50 space-y-0.5">
          <p className="text-[9px] text-gray-400 flex items-center gap-1"><Users size={9} /> Cần</p>
          <p className="text-xs font-bold text-dark-700">
            <span className="text-green-600">{approvedCount}</span>/{os.slots_needed}
            {remaining > 0 && <span className="text-gray-400 ml-1">({remaining} trống)</span>}
          </p>
        </div>
      </div>

      {/* Note */}
      {os.note && (
        <p className="text-xs text-gray-500 italic bg-amber-50 px-3 py-1.5 rounded-lg">
          💡 {os.note}
        </p>
      )}

      {/* Claim button */}
      <button onClick={() => onClaim(os.id)}
        className="w-full py-2.5 rounded-xl bg-primary-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary-700 transition-all active:scale-[0.98] shadow-sm">
        <Send size={14} /> Nhận ca này
      </button>
    </div>
  )
}

function ClaimCard({ claim, shift }: { claim: OpenShiftClaim; shift: OpenShift }) {
  const s = getShiftById(shift.shift_id)
  const status = statusColors[claim.status] || statusColors.pending
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold"
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
      <span className="text-xs font-bold px-2 py-1 rounded-lg"
        style={{ backgroundColor: status.bg, color: status.color }}>
        {status.label}
      </span>
    </div>
  )
}

export default function OpenShiftsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<'available' | 'my'>('available')
  const [toast, setToast] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  if (!isAuthenticated || !user) {
    router.push('/login')
    return null
  }

  const available = getAvailableOpenShiftsForEmployee(user.id)
  const myClaims = getMyOpenShiftClaims(user.id)

  const confirmShift = confirmId ? available.find(os => os.id === confirmId) || null : null
  const confirmShiftInfo = confirmShift ? getShiftById(confirmShift.shift_id) : null

  const handleClaim = (osId: string) => {
    setConfirmId(osId)
  }

  const handleConfirmClaim = () => {
    if (!confirmId) return
    const result = claimOpenShift(confirmId, user.id)
    if (result) {
      const msg = result.status === 'approved'
        ? '✅ Đã nhận ca thành công (tự duyệt)!'
        : '📨 Đã gửi yêu cầu — chờ Manager duyệt'
      setToast(msg)
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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <ChevronLeft size={20} className="text-gray-500" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-dark-700">Ca trống</h1>
              <p className="text-xs text-gray-400">Ca cần người — tự đăng ký</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
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

        {/* Content */}
        {tab === 'available' ? (
          <div className="space-y-3">
            {available.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={28} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400 font-medium">Không có ca trống phù hợp</p>
                <p className="text-xs text-gray-300">Các ca trống phù hợp với vị trí và lịch của bạn sẽ hiển thị ở đây</p>
              </div>
            ) : (
              available.map(os => (
                <OpenShiftCard key={os.id} os={os} onClaim={handleClaim} />
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {myClaims.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto">
                  <AlertCircle size={28} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400 font-medium">Chưa đăng ký ca nào</p>
              </div>
            ) : (
              myClaims.map(({ claim, shift }) => (
                <ClaimCard key={claim.id} claim={claim} shift={shift} />
              ))
            )}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      {confirmShift && (
        <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 animate-fade-in"
          onClick={() => setConfirmId(null)}>
          <div className="w-full max-w-md bg-white rounded-t-3xl p-6 space-y-4 animate-slide-up"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto" />
            <h3 className="text-lg font-bold text-dark-700 text-center">Xác nhận nhận ca</h3>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
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
                <div className="flex items-center gap-1.5 text-green-600 text-xs font-medium">
                  <Zap size={12} /> Ca này sẽ được duyệt tự động
                </div>
              )}
              {!confirmShift.auto_approve && (
                <div className="flex items-center gap-1.5 text-amber-600 text-xs font-medium">
                  <Clock size={12} /> Cần chờ quản lý duyệt
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setConfirmId(null)}
                className="flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-medium">
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

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-dark-700 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}
    </AppShell>
  )
}
