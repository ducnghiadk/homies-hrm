'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import AppShell from '@/components/layout/AppShell'
import {
  Clock,
  CalendarOff,
  ArrowLeftRight,
  DollarSign,
  GraduationCap,
  Check,
  X,
  Plus,
  Filter,
  CheckCheck,
  Sparkles,
  AlertCircle,
  Building2,
  Calendar,
} from 'lucide-react'
import CreateRequestModal from '@/components/requests/CreateRequestModal'

export interface RequestItem {
  id: string
  employee_id: string
  employee_name: string
  store_id: string
  type: string
  title: string
  reason: string
  amount?: number
  requested_hours?: number
  date?: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at?: string
  approved_by?: string
  approved_at?: string
  notes?: string
}

export default function RequestsPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()

  const [requests, setRequests] = useState<RequestItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING')
  const [selectedType, setSelectedType] = useState<string>('ALL')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [actionMessage, setActionMessage] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login?redirect=/requests')
  }, [hasHydrated, isAuthenticated, router])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/requests')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setRequests(data.data)
      }
    } catch {
      console.error('Failed to fetch requests')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      fetchRequests()
    }
  }, [isAuthenticated])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    startTransition(async () => {
      // Optimistic update
      setRequests((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status: action === 'approve' ? 'APPROVED' : 'REJECTED',
                approved_by: user?.full_name || 'Quản lý',
                approved_at: new Date().toISOString(),
              }
            : r
        )
      )

      try {
        const res = await fetch('/api/requests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id,
            action,
            approved_by: user?.id,
            approver_name: user?.full_name,
          }),
        })
        const data = await res.json()
        if (data.success) {
          setActionMessage(action === 'approve' ? '✅ Đã duyệt đơn thành công!' : '❌ Đã từ chối đơn.')
          setTimeout(() => setActionMessage(null), 3000)
        }
      } catch {
        fetchRequests()
      }
    })
  }

  const handleBulkApprove = async () => {
    const pendingList = filteredRequests.filter((r) => r.status === 'PENDING')
    if (pendingList.length === 0) return

    for (const r of pendingList) {
      await handleAction(r.id, 'approve')
    }
  }

  if (!hasHydrated) {
    return (
      <AppShell title="Quản lý Đơn từ & Giải trình">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (!user || !isAuthenticated) return null

  const isManagerOrCeo = user.role === 'ceo' || user.role === 'store_manager' || user.role === 'shift_leader'

  const filteredRequests = requests.filter((req) => {
    // If regular employee, only show their own requests unless admin
    if (!isManagerOrCeo && req.employee_id !== user.id) return false

    if (activeTab !== 'ALL' && req.status !== activeTab) return false
    if (selectedType !== 'ALL' && req.type !== selectedType) return false
    return true
  })

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length
  const approvedCount = requests.filter((r) => r.status === 'APPROVED').length
  const rejectedCount = requests.filter((r) => r.status === 'REJECTED').length

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'missed_checkin':
        return <Clock size={16} className="text-amber-500" />
      case 'learning_shift':
        return <GraduationCap size={16} className="text-blue-500" />
      case 'leave':
        return <CalendarOff size={16} className="text-rose-500" />
      case 'shift_swap':
        return <ArrowLeftRight size={16} className="text-purple-500" />
      case 'salary_advance':
        return <DollarSign size={16} className="text-emerald-500" />
      default:
        return <Sparkles size={16} className="text-amber-500" />
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'missed_checkin':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">Bổ sung chấm công</span>
      case 'learning_shift':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">Ca học việc</span>
      case 'leave':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">Xin nghỉ phép</span>
      case 'shift_swap':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900">Đổi ca</span>
      case 'salary_advance':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">Tạm ứng</span>
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">Yêu cầu</span>
    }
  }

  return (
    <AppShell title="Quản lý Đơn từ & Giải trình">
      <div className="space-y-4 animate-fade-in max-w-5xl mx-auto pb-12">
        {/* Banner Top */}
        <div className="bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent p-4 rounded-2xl border border-amber-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">📋</span>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Duyệt Đơn & Giải Trình Chấm Công
              </h2>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Tự động đồng bộ giờ công vào Bảng Chấm Công và Bảng Lương sau khi duyệt.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isManagerOrCeo && pendingCount > 0 && (
              <button
                onClick={handleBulkApprove}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/50 hover:bg-emerald-200 transition flex items-center gap-1.5 border border-emerald-300 dark:border-emerald-800"
              >
                <CheckCheck size={14} />
                <span>Duyệt Tất Cả ({pendingCount})</span>
              </button>
            )}
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition flex items-center gap-1.5 shadow-md shadow-amber-500/20"
            >
              <Plus size={15} />
              <span>Gửi Đơn Mới</span>
            </button>
          </div>
        </div>

        {/* Thông báo thao tác */}
        {actionMessage && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl text-xs font-semibold flex items-center gap-2 border border-emerald-200 dark:border-emerald-800 animate-slide-up">
            <Check size={16} />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Tabs Trạng Thái */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-gray-800 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'PENDING', label: 'Chờ duyệt', count: pendingCount, color: 'bg-red-500 text-white' },
              { id: 'APPROVED', label: 'Đã duyệt', count: approvedCount, color: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
              { id: 'REJECTED', label: 'Từ chối', count: rejectedCount, color: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
              { id: 'ALL', label: 'Tất cả', count: requests.length, color: 'bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-sm'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-800/70 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      tab.id === 'PENDING' ? 'bg-red-500 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Lọc theo Loại đơn */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter size={14} className="text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 focus:outline-hidden"
            >
              <option value="ALL">Toàn bộ loại đơn</option>
              <option value="missed_checkin">⏱️ Bổ sung chấm công</option>
              <option value="learning_shift">🎓 Ca học việc</option>
              <option value="leave">🏖️ Nghỉ phép</option>
              <option value="shift_swap">🔄 Đổi ca</option>
              <option value="salary_advance">💵 Tạm ứng lương</option>
            </select>
          </div>
        </div>

        {/* Danh sách yêu cầu */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-amber-500 border-t-transparent" />
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-20 bg-gray-50/50 dark:bg-gray-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
            <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-2 text-gray-400">
              <Check size={20} />
            </div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Không có đơn yêu cầu nào trong mục này</p>
            <p className="text-xs text-gray-400 mt-1">Toàn bộ yêu cầu đã được xử lý hoặc chưa có đơn mới.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredRequests.map((req) => {
              const isPending = req.status === 'PENDING'
              const isApproved = req.status === 'APPROVED'

              return (
                <div
                  key={req.id}
                  className={`p-4 rounded-2xl border transition shadow-xs flex flex-col justify-between gap-3 ${
                    isPending
                      ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-200/80 dark:border-amber-900/40'
                      : isApproved
                      ? 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800'
                      : 'bg-gray-50/80 dark:bg-gray-900/50 border-gray-200 dark:border-gray-800 opacity-75'
                  }`}
                >
                  <div className="space-y-2">
                    {/* Header đơn */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                          {getTypeIcon(req.type)}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                            {req.employee_name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
                            <Building2 size={11} />
                            <span>{req.store_id === 'store-001' ? 'Hồ Bá Phấn' : 'Đường 429'}</span>
                            <span>•</span>
                            <Calendar size={11} />
                            <span>{req.date || 'Hôm nay'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {getTypeBadge(req.type)}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isPending
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                              : isApproved
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                          }`}
                        >
                          {isPending ? 'Chờ duyệt' : isApproved ? 'Đã duyệt' : 'Từ chối'}
                        </span>
                      </div>
                    </div>

                    {/* Chi tiết nội dung */}
                    <div className="bg-white dark:bg-gray-800/60 p-2.5 rounded-xl border border-gray-100 dark:border-gray-800 text-xs space-y-1">
                      <p className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1">
                        <span>📌 {req.title}</span>
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 italic">
                        "{req.reason}"
                      </p>
                      {req.requested_hours && (
                        <p className="text-amber-600 dark:text-amber-400 font-bold text-[11px]">
                          ⏱️ Đề xuất cộng: {req.requested_hours} giờ công
                        </p>
                      )}
                      {req.amount && (
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                          💵 Số tiền: {req.amount.toLocaleString('vi-VN')} đ
                        </p>
                      )}
                      {req.notes && (
                        <p className="text-gray-500 dark:text-gray-400 text-[10px] border-t border-gray-100 dark:border-gray-700/50 pt-1 mt-1">
                          💬 Ghi chú: {req.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Nút hành động cho Quản lý / CEO */}
                  {isPending && isManagerOrCeo && (
                    <div className="flex gap-2 pt-1 border-t border-amber-200/50 dark:border-amber-900/30">
                      <button
                        onClick={() => handleAction(req.id, 'reject')}
                        className="flex-1 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 rounded-xl transition flex items-center justify-center gap-1"
                      >
                        <X size={13} />
                        <span>Từ chối</span>
                      </button>
                      <button
                        onClick={() => handleAction(req.id, 'approve')}
                        className="flex-1 py-1.5 text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl transition flex items-center justify-center gap-1 shadow-sm shadow-emerald-500/20"
                      >
                        <Check size={13} />
                        <span>Duyệt Ngay</span>
                      </button>
                    </div>
                  )}

                  {!isPending && req.approved_by && (
                    <div className="text-[10px] text-gray-400 flex items-center justify-between">
                      <span>Người duyệt: {req.approved_by}</span>
                      {req.approved_at && <span>{new Date(req.approved_at).toLocaleDateString('vi-VN')}</span>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Modal Tạo Yêu Cầu */}
        <CreateRequestModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            fetchRequests()
            setActionMessage('✅ Đã gửi đơn thành công đến Quản lý!')
            setTimeout(() => setActionMessage(null), 3000)
          }}
        />
      </div>
    </AppShell>
  )
}
