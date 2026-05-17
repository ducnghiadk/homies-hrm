'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { getShiftById } from '@/lib/mock-data'
import {
  getMySwapRequests, getSwapRequestsForMe, getPendingSwapRequestsForManager,
  respondToSwapRequest, managerApproveSwap, getScheduleById, getEmployeeById,
  type ShiftSwapRequest,
} from '@/lib/mock-data-swap'
import { format } from 'date-fns'
import {
  ChevronLeft, Plus, ArrowRightLeft, UserPlus,
  CheckCircle2, XCircle, Clock, Shield, Send,
} from 'lucide-react'

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: 'Chờ đồng nghiệp', color: '#F59E0B', bg: '#FEF3C7' },
  accepted: { label: 'Chờ Manager', color: '#3B82F6', bg: '#DBEAFE' },
  rejected: { label: 'Bị từ chối', color: '#EF4444', bg: '#FEE2E2' },
  cancelled: { label: 'Đã hủy', color: '#6B7280', bg: '#F3F4F6' },
  approved: { label: 'Đã duyệt', color: '#10B981', bg: '#D1FAE5' },
}

function SwapCard({ req, isIncoming, onRespond, isManager, onManagerAction }: {
  req: ShiftSwapRequest
  isIncoming?: boolean
  onRespond?: (id: string, accept: boolean) => void
  isManager?: boolean
  onManagerAction?: (id: string, approve: boolean) => void
}) {
  const requester = getEmployeeById(req.requester_id)
  const target = getEmployeeById(req.target_user_id)
  const reqSchedule = getScheduleById(req.requester_schedule_id)
  const reqShift = reqSchedule ? getShiftById(reqSchedule.shift_id) : null
  const targetSchedule = req.target_schedule_id ? getScheduleById(req.target_schedule_id) : null
  const targetShift = targetSchedule ? getShiftById(targetSchedule.shift_id) : null
  const status = statusConfig[req.status] || statusConfig.pending

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {req.type === 'swap'
            ? <ArrowRightLeft size={14} className="text-blue-500" />
            : <UserPlus size={14} className="text-purple-500" />}
          <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
            req.type === 'swap' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
          }`}>
            {req.type === 'swap' ? 'Đổi ca' : 'Nhờ thay'}
          </span>
        </div>
        <span className="text-xs font-bold px-2 py-1 rounded-lg"
          style={{ backgroundColor: status.bg, color: status.color }}>
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

      {/* Actions for incoming requests */}
      {isIncoming && req.status === 'pending' && onRespond && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => onRespond(req.id, false)}
            className="flex-1 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-medium flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
            <XCircle size={14} /> Từ chối
          </button>
          <button onClick={() => onRespond(req.id, true)}
            className="flex-1 py-2 rounded-xl bg-green-50 text-green-600 text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform">
            <CheckCircle2 size={14} /> Đồng ý
          </button>
        </div>
      )}

      {/* Manager actions */}
      {isManager && req.status === 'accepted' && onManagerAction && (
        <div className="flex gap-2 pt-1">
          <button onClick={() => onManagerAction(req.id, false)}
            className="flex-1 py-2 rounded-xl bg-red-50 text-red-500 text-xs font-medium flex items-center justify-center gap-1.5">
            <XCircle size={14} /> Từ chối
          </button>
          <button onClick={() => onManagerAction(req.id, true)}
            className="flex-1 py-2 rounded-xl bg-green-600 text-white text-xs font-bold flex items-center justify-center gap-1.5">
            <Shield size={14} /> Duyệt
          </button>
        </div>
      )}

      <p className="text-[9px] text-gray-300 text-right">
        {format(new Date(req.created_at), 'HH:mm dd/MM/yyyy')}
      </p>
    </div>
  )
}

export default function SwapListPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [tab, setTab] = useState<'sent' | 'received' | 'manager'>('sent')
  const [refreshKey, setRefreshKey] = useState(0)
  const [toast, setToast] = useState<string | null>(null)

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const isManager = user.role === 'store_manager' || user.role === 'hr_admin' || user.role === 'ceo'

  const sentRequests = getMySwapRequests(user.id)
  const receivedRequests = getSwapRequestsForMe(user.id)
  const managerRequests = isManager ? getPendingSwapRequestsForManager(user.store_id) : []

  const handleRespond = (id: string, accept: boolean) => {
    respondToSwapRequest(id, accept)
    setRefreshKey(k => k + 1)
    setToast(accept ? 'Đã đồng ý' : 'Đã từ chối')
    setTimeout(() => setToast(null), 2000)
  }

  const handleManagerAction = (id: string, approve: boolean) => {
    managerApproveSwap(id, user.id, approve)
    setRefreshKey(k => k + 1)
    setToast(approve ? 'Đã duyệt — Lịch đã cập nhật' : 'Đã từ chối')
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
    managerRequests

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

        {/* List */}
        <div className="space-y-3">
          {currentRequests.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {tab === 'sent' ? 'Chưa có yêu cầu nào' :
               tab === 'received' ? 'Chưa có yêu cầu đến bạn' :
               'Không có yêu cầu chờ duyệt'}
            </div>
          ) : (
            currentRequests.map(req => (
              <SwapCard key={req.id} req={req}
                isIncoming={tab === 'received'}
                onRespond={handleRespond}
                isManager={tab === 'manager'}
                onManagerAction={handleManagerAction}
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
