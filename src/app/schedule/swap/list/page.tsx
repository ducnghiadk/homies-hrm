'use client'

import { useEffect, useState, Suspense } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { getShiftById } from '@/lib/mock-data'
import {
  getAllSwapRequests, getMySwapRequests, getSwapRequestsForMe, getPendingSwapRequestsForManager,
  respondToSwapRequest, managerApproveSwap, cancelSwapRequest, getScheduleById, getEmployeeById,
  getSwapRequestStateMeta,
  type ShiftSwapRequest,
} from '@/lib/mock-data-swap'
import {
  notifySwapResponded,
  notifySwapManagerAction,
  notifySwapCancelled,
} from '@/lib/notifications/swap-notifications'
import { ScheduleEmailService } from '@/lib/services/schedule-email-service'
import { format } from 'date-fns'
import {
  ChevronLeft, Plus, ArrowRightLeft, UserPlus,
  CheckCircle2, XCircle, Clock, Shield, Send,
} from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ đồng nghiệp', color: '#F6C85F', bg: '#FFF8E8' },
  accepted: { label: 'Chờ Manager', color: '#2F6FA8', bg: '#DBEAFE' },
  rejected: { label: 'Bị từ chối', color: '#D9381E', bg: '#FEE2E2' },
  cancelled: { label: 'Đã hủy', color: '#6B7280', bg: '#F3F4F6' },
  approved: { label: 'Đã duyệt', color: '#1E9E57', bg: '#D1FAE5' },
}

function SwapCard({ req, isIncoming, onRespond, isManager, onManagerAction, onCancel, highlighted }: {
  req: ShiftSwapRequest
  isIncoming?: boolean
  onRespond?: (id: string, accept: boolean) => void
  isManager?: boolean
  onManagerAction?: (id: string, approve: boolean) => void
  onCancel?: (id: string) => void
  highlighted?: boolean
}) {
  const [showTimeline, setShowTimeline] = useState(false)
  const requester = getEmployeeById(req.requester_id)
  const target = getEmployeeById(req.target_user_id)
  const reqSchedule = getScheduleById(req.requester_schedule_id)
  const reqShift = reqSchedule ? getShiftById(reqSchedule.shift_id) : null
  const targetSchedule = req.target_schedule_id ? getScheduleById(req.target_schedule_id) : null
  const targetShift = targetSchedule ? getShiftById(targetSchedule.shift_id) : null
  const status = {
    ...getSwapRequestStateMeta(req),
    legacy: statusConfig[req.status] || statusConfig.pending,
  }
  const statusDetail =
    req.status === 'pending'
      ? 'Đang chờ đồng nghiệp phản hồi'
      : req.status === 'accepted'
        ? 'Đồng nghiệp đã đồng ý, đang chờ quản lý duyệt'
        : req.status === 'approved'
          ? `Đã được duyệt lúc ${req.manager_approved_at ? format(new Date(req.manager_approved_at), 'HH:mm dd/MM') : ''}`.trim()
          : req.status === 'cancelled'
            ? `Đã hủy lúc ${req.cancelled_at ? format(new Date(req.cancelled_at), 'HH:mm dd/MM') : ''}`.trim()
            : req.manager_id
              ? `Bị từ chối bởi quản lý lúc ${req.manager_approved_at ? format(new Date(req.manager_approved_at), 'HH:mm dd/MM') : ''}`.trim()
              : `Đồng nghiệp đã từ chối lúc ${req.target_response_at ? format(new Date(req.target_response_at), 'HH:mm dd/MM') : ''}`.trim()

  return (
    <div
      id={`swap-request-${req.id}`}
      className={`bg-white rounded-2xl border p-4 space-y-3 transition-all ${
        highlighted ? 'border-primary-300 ring-2 ring-primary-100 shadow-md' : 'border-gray-100'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {req.type === 'swap'
            ? <ArrowRightLeft size={14} className="text-primary-500" />
            : <UserPlus size={14} className="text-primary-500" />}
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
            req.type === 'swap' ? 'bg-primary-100 text-primary-600' : 'bg-primary-100 text-primary-600'
          }`}>
            {req.type === 'swap' ? 'Đổi ca' : 'Nhờ thay'}
          </span>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-lg ${status.tone}`}>
          {status.label}
        </span>
      </div>

      {/* Details */}
      <div className="flex items-center gap-2">
        <div className="flex-1 p-2.5 rounded-xl bg-gray-50 text-center">
          <p className="text-[9px] text-gray-400">Người yêu cầu</p>
          <p className="text-xs font-bold text-dark-700">{requester?.full_name.split(' ').slice(-2).join(' ')}</p>
          {reqShift && reqSchedule && (
            <p className="text-xs mt-0.5" style={{ color: reqShift.color }}>
              {reqShift.name} • {format(new Date(reqSchedule.date), 'dd/MM')}
            </p>
          )}
        </div>
        <ArrowRightLeft size={14} className="text-gray-300 shrink-0" />
        <div className="flex-1 p-2.5 rounded-xl bg-gray-50 text-center">
          <p className="text-[9px] text-gray-400">{req.type === 'swap' ? 'Đổi với' : 'Người thay'}</p>
          <p className="text-xs font-bold text-dark-700">{target?.full_name.split(' ').slice(-2).join(' ')}</p>
          {req.type === 'swap' && targetShift && targetSchedule ? (
            <p className="text-xs mt-0.5" style={{ color: targetShift.color }}>
              {targetShift.name} • {format(new Date(targetSchedule.date), 'dd/MM')}
            </p>
          ) : (
            <p className="text-xs mt-0.5 text-gray-400">Thay ca</p>
          )}
        </div>
      </div>

      {/* Reason */}
      <p className="text-xs text-gray-500">
        <span className="text-gray-400">Lý do:</span> {req.reason}
      </p>
      <div className={`rounded-xl px-3 py-2 text-[11px] ${status.tone}`}>
        <p>{status.detail}</p>
        <p className="mt-1 opacity-80">{statusDetail}</p>
      </div>

      {/* Actions for incoming requests */}
      {isIncoming && req.status === 'pending' && onRespond && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => onRespond(req.id, false)}
            className="flex-1 py-2 rounded-xl bg-error-50 text-error-500 text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
            <XCircle size={14} /> Từ chối
          </button>
          <button onClick={() => onRespond(req.id, true)}
            className="flex-1 py-2 rounded-xl bg-success-50 text-success-600 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
            <CheckCircle2 size={14} /> Đồng ý
          </button>
        </div>
      )}

      {/* Manager actions */}
      {isManager && req.status === 'accepted' && onManagerAction && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => onManagerAction(req.id, false)}
            className="flex-1 py-2 rounded-xl bg-error-50 text-error-500 text-xs font-medium flex items-center justify-center gap-1.5">
            <XCircle size={14} /> Từ chối
          </button>
          <button onClick={() => onManagerAction(req.id, true)}
            className="flex-1 py-2 rounded-xl bg-success-600 text-white text-xs font-bold flex items-center justify-center gap-1.5">
            <Shield size={14} /> Duyệt
          </button>
        </div>
      )}

      {!isIncoming && !isManager && (req.status === 'pending' || req.status === 'accepted') && onCancel && (
        <button
          onClick={() => onCancel(req.id)}
          className="w-full py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200 transition-colors"
        >
          Hủy yêu cầu
        </button>
      )}

      {/* Event Timeline / Audit Trail */}
      {req.events && req.events.length > 0 && (
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            type="button"
            className="w-full text-left text-[10px] text-primary-600 font-bold hover:underline flex items-center justify-between">
            <span>{showTimeline ? 'Ẩn lịch sử xử lý' : 'Xem lịch sử xử lý'}</span>
            <span className="text-[9px] text-gray-400 font-medium">({req.events.length} bước)</span>
          </button>
          
          {showTimeline && (
            <div className="space-y-3 pl-2.5 pt-1 border-l-2 border-primary-100 ml-1.5 transition-all">
              {req.events.map((ev, index) => {
                let badgeColor = 'bg-gray-400'
                if (ev.event === 'created') badgeColor = 'bg-primary-500'
                else if (ev.event === 'target_accepted') badgeColor = 'bg-warning-500'
                else if (ev.event === 'target_rejected' || ev.event === 'manager_rejected') badgeColor = 'bg-error-500'
                else if (ev.event === 'manager_approved') badgeColor = 'bg-success-500'
                else if (ev.event === 'requester_cancelled') badgeColor = 'bg-gray-500'

                return (
                  <div key={index} className="relative flex flex-col space-y-0.5">
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

      <p className="text-[9px] text-gray-300 text-right">
        {format(new Date(req.created_at), 'HH:mm dd/MM/yyyy')}
      </p>
    </div>
  )
}

function SwapListPageContent() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<'sent' | 'received' | 'manager'>(() => {
    const requestedTab = searchParams.get('tab')
    if (requestedTab === 'received' || requestedTab === 'manager') return requestedTab
    return 'sent'
  })
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | ShiftSwapRequest['status']>('all')
  const [sortBy, setSortBy] = useState<'latest' | 'oldest' | 'activity'>('activity')
  const isManager = user?.role === 'store_manager' || user?.role === 'hr_admin' || user?.role === 'ceo'
  const highlightedRequestId = searchParams.get('requestId')

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])

  const sentRequests = user ? getMySwapRequests(user.id) : []
  const receivedRequests = user ? getSwapRequestsForMe(user.id) : []
  const managerRequests = user && isManager ? getPendingSwapRequestsForManager(user.store_id) : []
  const managerScopeRequests = isManager
    ? getAllSwapRequests().filter(request => {
        const requester = getEmployeeById(request.requester_id)
        const target = getEmployeeById(request.target_user_id)
        return requester?.store_id === user?.store_id || target?.store_id === user?.store_id
      })
    : []

  const handleRespond = (id: string, accept: boolean) => {
    const updated = respondToSwapRequest(id, accept)
    if (!updated) {
      setToast('Không thể xử lý yêu cầu này')
      setTimeout(() => setToast(null), 2000)
      return
    }

    const requester = getEmployeeById(updated.requester_id)
    const target = getEmployeeById(updated.target_user_id)
    const schedule = getScheduleById(updated.requester_schedule_id)
    const shift = schedule ? getShiftById(schedule.shift_id) : null

    notifySwapResponded({
      requestId: updated.id,
      requesterId: updated.requester_id,
      requesterName: requester?.full_name || 'Đồng nghiệp',
      targetName: target?.full_name || 'Đồng nghiệp',
      type: updated.type,
      accepted: accept,
      shiftName: shift?.name || 'Ca làm',
      date: schedule ? format(new Date(schedule.date), 'dd/MM/yyyy') : '',
    })

    setRefreshKey(k => k + 1)
    setToast(accept ? 'Đã đồng ý' : 'Đã từ chối')
    setTimeout(() => setToast(null), 2000)
  }

  const handleManagerAction = (id: string, approve: boolean) => {
    if (!user) return

    const updated = managerApproveSwap(id, user.id, approve)
    if (!updated) {
      setToast('Không thể duyệt yêu cầu này')
      setTimeout(() => setToast(null), 2000)
      return
    }

    const requester = getEmployeeById(updated.requester_id)
    const target = getEmployeeById(updated.target_user_id)
    const schedule = getScheduleById(updated.requester_schedule_id)
    const shift = schedule ? getShiftById(schedule.shift_id) : null

    notifySwapManagerAction({
      requestId: updated.id,
      requesterId: updated.requester_id,
      requesterName: requester?.full_name || 'Đồng nghiệp',
      targetUserId: updated.target_user_id,
      targetName: target?.full_name,
      type: updated.type,
      approved: approve,
      managerName: user.full_name,
      shiftName: shift?.name || 'Ca làm',
      date: schedule ? format(new Date(schedule.date), 'dd/MM/yyyy') : '',
    })

    if (requester?.email) {
      ScheduleEmailService.sendEmail({
        type: 'swap_status_changed',
        to: requester.email,
        subject: approve ? 'Yêu cầu đổi ca đã được duyệt' : 'Yêu cầu đổi ca bị từ chối',
        body_preview: approve
          ? `${user.full_name} đã duyệt yêu cầu ${updated.type === 'swap' ? 'đổi ca' : 'nhờ thay ca'} của bạn.`
          : `${user.full_name} đã từ chối yêu cầu ${updated.type === 'swap' ? 'đổi ca' : 'nhờ thay ca'} của bạn.`,
        related_schedule_id: updated.requester_schedule_id,
      })
    }

    if (approve && target?.email) {
      ScheduleEmailService.sendEmail({
        type: 'swap_status_changed',
        to: target.email,
        subject: 'Lịch làm của bạn vừa được cập nhật do đổi ca',
        body_preview: `${user.full_name} đã duyệt yêu cầu ${updated.type === 'swap' ? 'đổi ca' : 'nhờ thay ca'}. Vui lòng kiểm tra lại lịch làm mới của bạn.`,
        related_schedule_id: updated.target_schedule_id,
      })
    }

    setRefreshKey(k => k + 1)
    setToast(approve ? 'Đã duyệt — Lịch đã cập nhật' : 'Đã từ chối')
    setTimeout(() => setToast(null), 2000)
  }

  const handleCancel = (id: string) => {
    if (!user) return

    const request = sentRequests.find(item => item.id === id)
    if (!request) {
      setToast('Không tìm thấy yêu cầu để hủy')
      setTimeout(() => setToast(null), 2000)
      return
    }

    const updated = cancelSwapRequest(id, user.id)
    if (!updated) {
      setToast('Yêu cầu này không còn hủy được nữa')
      setTimeout(() => setToast(null), 2000)
      return
    }

    const schedule = getScheduleById(updated.requester_schedule_id)
    const shift = schedule ? getShiftById(schedule.shift_id) : null
    notifySwapCancelled({
      requestId: updated.id,
      requesterName: user.full_name,
      targetUserId: updated.target_user_id,
      type: updated.type,
      shiftName: shift?.name || 'Ca làm',
      date: schedule ? format(new Date(schedule.date), 'dd/MM/yyyy') : '',
    })

    setRefreshKey(k => k + 1)
    setToast('Đã hủy yêu cầu đổi ca')
    setTimeout(() => setToast(null), 2000)
  }

  const tabs = [
    { key: 'sent' as const, label: 'Đã gửi', icon: Send, count: sentRequests.length },
    { key: 'received' as const, label: 'Đến tôi', icon: Clock, count: receivedRequests.filter(r => r.status === 'pending').length },
    ...(isManager ? [{ key: 'manager' as const, label: 'Chờ duyệt', icon: Shield, count: managerRequests.length }] : []),
  ]

  const currentRequests: ShiftSwapRequest[] =
    tab === 'sent' ? sentRequests :
    tab === 'received' ? receivedRequests :
    managerScopeRequests

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredRequests = currentRequests
    .filter(request => {
      if (tab === 'manager' && statusFilter !== 'all' && request.status !== statusFilter) {
        return false
      }

      if (!normalizedQuery) return true

      const requester = getEmployeeById(request.requester_id)?.full_name.toLowerCase() || ''
      const target = getEmployeeById(request.target_user_id)?.full_name.toLowerCase() || ''
      const reason = request.reason.toLowerCase()
      const typeLabel = request.type === 'swap' ? 'doi ca' : 'nho thay'

      return requester.includes(normalizedQuery) ||
        target.includes(normalizedQuery) ||
        reason.includes(normalizedQuery) ||
        typeLabel.includes(normalizedQuery)
    })
    .sort((left, right) => {
      const leftActivity = left.cancelled_at || left.manager_approved_at || left.target_response_at || left.created_at
      const rightActivity = right.cancelled_at || right.manager_approved_at || right.target_response_at || right.created_at

      if (sortBy === 'oldest') {
        return left.created_at.localeCompare(right.created_at)
      }

      if (sortBy === 'latest') {
        return right.created_at.localeCompare(left.created_at)
      }

      return rightActivity.localeCompare(leftActivity)
    })

  useEffect(() => {
    if (!highlightedRequestId) return
    const timer = window.setTimeout(() => {
      document.getElementById(`swap-request-${highlightedRequestId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    }, 150)
    return () => window.clearTimeout(timer)
  }, [highlightedRequestId, filteredRequests.length, tab])

  if (!user) return null

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
            <h1 className="text-xl font-bold text-dark-700">Yêu cầu đổi ca</h1>
          </div>
          <button onClick={() => router.push('/schedule/swap')}
            className="h-9 px-3 rounded-xl bg-primary-600 text-white text-xs font-bold flex items-center gap-1.5">
            <Plus size={14} /> Tạo mới
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-all ${
                tab === t.key ? 'bg-white shadow-sm text-dark-700' : 'text-gray-400'
              }`}>
              <t.icon size={13} />
              {t.label}
              {t.count > 0 && (
                <span className={`ml-0.5 w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold ${
                  tab === t.key ? 'bg-primary-500 text-white' : 'bg-gray-300 text-white'
                }`}>{t.count}</span>
              )}
            </button>
          ))}
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Chờ đồng nghiệp</p>
            <p className="mt-2 text-2xl font-black text-dark-700">{sentRequests.filter(r => r.status === 'pending').length}</p>
            <p className="mt-1 text-xs text-gray-500">Yêu cầu đã gửi và đang chờ phản hồi.</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Chờ quản lý</p>
            <p className="mt-2 text-2xl font-black text-dark-700">{managerRequests.length}</p>
            <p className="mt-1 text-xs text-gray-500">Đồng nghiệp đã đồng ý và chờ duyệt cuối.</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400">Flow state</p>
            <p className="mt-2 text-sm font-bold text-dark-700">Pending / Accepted / Approved / Rejected / Cancelled</p>
            <p className="mt-1 text-xs text-gray-500">Màn inbox đang hiển thị đúng state theo từng bước.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={tab === 'manager' ? 'Tìm theo người yêu cầu, người nhận, lý do...' : 'Tìm theo tên hoặc lý do...'}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <select
              value={tab === 'manager' ? statusFilter : 'all'}
              onChange={e => setStatusFilter(e.target.value as 'all' | ShiftSwapRequest['status'])}
              disabled={tab !== 'manager'}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-dark-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="pending">Chờ đồng nghiệp</option>
              <option value="accepted">Chờ quản lý duyệt</option>
              <option value="approved">Đã duyệt</option>
              <option value="rejected">Bị từ chối</option>
              <option value="cancelled">Đã hủy</option>
            </select>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as 'latest' | 'oldest' | 'activity')}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-dark-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="activity">Sắp xếp theo hoạt động mới nhất</option>
              <option value="latest">Mới tạo gần đây</option>
              <option value="oldest">Cũ nhất trước</option>
            </select>
          </div>
          <p className="text-xs text-gray-400">
            {filteredRequests.length} / {currentRequests.length} yêu cầu đang hiển thị
          </p>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {currentRequests.length === 0
                ? (tab === 'sent' ? 'Chưa có yêu cầu nào' :
                  tab === 'received' ? 'Chưa có yêu cầu đến bạn' :
                  'Không có yêu cầu nào thuộc cửa hàng này')
                : 'Không có yêu cầu nào khớp bộ lọc hiện tại'}
            </div>
          ) : (
            filteredRequests.map(req => (
              <SwapCard key={req.id} req={req}
                isIncoming={tab === 'received'}
                onRespond={handleRespond}
                isManager={tab === 'manager'}
                onManagerAction={handleManagerAction}
                onCancel={tab === 'sent' ? handleCancel : undefined}
                highlighted={req.id === highlightedRequestId}
              />
            ))
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] bg-dark-700 text-white px-6 py-3 rounded-2xl shadow-2xl text-sm font-medium animate-fade-in">
          {toast}
        </div>
      )}
    </AppShell>
  )
}

export default function SwapListPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm font-medium">Đang tải danh sách đổi ca...</p>
        </div>
      </div>
    }>
      <SwapListPageContent />
    </Suspense>
  )
}
