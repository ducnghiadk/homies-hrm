'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { getEmployeeById } from '@/lib/mock-data'
import {
  getAdminStats,
  getAllStoresAttendanceSummary,
  getRecentPendingLeaves,
} from '@/lib/mock-data-home'
import { checkAllStoresUnderstaffing, type AllStoresStaffingStatus } from '@/lib/understaffing-alert'
import { formatDate } from '@/lib/utils'
import {
  PageHeader, StatCard, UrgentBanner, SectionGroup,
  ListItem, QuickActionGrid, SkeletonCard, EmptyState, Avatar,
  ConfirmDialog,
} from '@/components/ui'
import {
  Users, UserCheck, CalendarOff, Clock, MapPin, Check, X,
  FileCheck, CalendarDays, BarChart3, Settings, ClipboardList,
  FileText, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pendingLeavesState, setPendingLeaves] = useState(getRecentPendingLeaves)
  const [approveDialog, setApproveDialog] = useState<{ isOpen: boolean; leaveId: string | null }>({
    isOpen: false, leaveId: null,
  })
  const [rejectDialog, setRejectDialog] = useState<{ isOpen: boolean; leaveId: string | null }>({
    isOpen: false, leaveId: null,
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [staffingStatus, setStaffingStatus] = useState<AllStoresStaffingStatus | null>(null)

  useEffect(() => {
    try {
      setIsLoading(true)
      setError(null)
      setStaffingStatus(checkAllStoresUnderstaffing())
    } catch {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.')
    } finally {
      const timer = setTimeout(() => setIsLoading(false), 400)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!user) return null

  const stats = getAdminStats()
  const storesSummary = getAllStoresAttendanceSummary()
  const pendingLeaves = pendingLeavesState


  /* ── Quick action handlers ── */
  const handleQuickApprove = (leaveId: string) => {
    setApproveDialog({ isOpen: true, leaveId })
  }

  const handleQuickReject = (leaveId: string) => {
    setRejectDialog({ isOpen: true, leaveId })
  }

  const confirmApprove = async () => {
    if (!approveDialog.leaveId) return
    setIsProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      setPendingLeaves(prev => prev.filter(l => l.id !== approveDialog.leaveId))
      toast.success('✅ Đã duyệt đơn nghỉ phép', {
        description: 'Nhân viên sẽ nhận được thông báo.',
      })
      setApproveDialog({ isOpen: false, leaveId: null })
    } catch {
      toast.error('Không thể duyệt đơn', { description: 'Vui lòng thử lại sau.' })
    } finally {
      setIsProcessing(false)
    }
  }

  const confirmReject = async (data?: { reason?: string }) => {
    if (!rejectDialog.leaveId) return
    setIsProcessing(true)
    try {
      await new Promise(resolve => setTimeout(resolve, 800))
      setPendingLeaves(prev => prev.filter(l => l.id !== rejectDialog.leaveId))
      toast.success('❌ Đã từ chối đơn nghỉ phép', {
        description: data?.reason ? `Lý do: ${data.reason}` : undefined,
      })
      setRejectDialog({ isOpen: false, leaveId: null })
    } catch {
      toast.error('Không thể từ chối đơn', { description: 'Vui lòng thử lại sau.' })
    } finally {
      setIsProcessing(false)
    }
  }

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="p-4 space-y-4 pb-20 animate-fade-in">
        <PageHeader title="Tổng quan" showBack={false} />
        <SkeletonCard variant="banner" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SkeletonCard variant="stat" />
          <SkeletonCard variant="stat" />
          <SkeletonCard variant="stat" />
          <SkeletonCard variant="stat" />
        </div>
        <SkeletonCard variant="card" />
        {/* Pending leaves skeleton */}
        <div className="space-y-0.5">
          {[1,2,3].map(i => (
            <div key={i} className="px-4 py-3.5 flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-gray-200 rounded" />
                <div className="h-3 w-48 bg-gray-100 rounded" />
              </div>
              <div className="flex gap-2">
                <div className="h-9 w-16 bg-gray-200 rounded-full" />
                <div className="h-9 w-16 bg-gray-100 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="p-4 pb-20">
        <PageHeader title="Tổng quan" showBack={false} />
        <EmptyState
          variant="error"
          title="Đã xảy ra lỗi"
          description={error}
          action={{ label: 'Thử lại', onClick: () => window.location.reload() }}
        />
      </div>
    )
  }

  return (
    <div className="p-4 space-y-5 pb-20 animate-fade-in">
      {/* ─── A. Header ─── */}
      <PageHeader title="Tổng quan" showBack={false} />

      {/* ─── B. Urgent Banner ─── */}
      {stats.pendingLeaves > 0 && (
        <UrgentBanner
          icon={ClipboardList}
          variant="warning"
          count={stats.pendingLeaves}
          message="đơn nghỉ phép chờ duyệt"
          actionLabel="Duyệt ngay"
          onClick={() => router.push('/leave/approval')}
        />
      )}

      {/* ─── B2. Staffing Alert ─── */}
      {staffingStatus && staffingStatus.criticalCount > 0 && (
        <div
          className="rounded-2xl p-3.5 border animate-slide-up"
          style={{ background: '#fef2f210', borderColor: '#fca5a540' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-error-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} className="text-error-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-error-800">
                {staffingStatus.criticalCount} ca thiếu người nghiêm trọng
              </p>
              {staffingStatus.topAlerts[0] && (
                <p className="text-xs text-error-600 truncate">
                  {staffingStatus.topAlerts[0].message}
                </p>
              )}
            </div>
            <button
              onClick={() => router.push('/schedule/warnings')}
              className="shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg border border-error-300 text-error-700 hover:bg-error-50 transition-colors"
            >
              Xem
            </button>
          </div>
        </div>
      )}

      {/* ─── C. Color-coded StatCards ─── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Users}
          label="Tổng nhân viên"
          value={stats.activeEmployees}
          iconColor="text-primary-600"
          iconBg="bg-primary-100"
          onClick={() => router.push('/employees')}
        />
        <StatCard
          icon={UserCheck}
          label="Đang làm"
          value={stats.currentlyWorking}
          iconColor="text-success-600"
          iconBg="bg-success-100"
          className="bg-success-50 border-success-200"
          valueClassName="text-success-700"
        />
        <StatCard
          icon={CalendarOff}
          label="Nghỉ phép"
          value={stats.pendingLeaves > 0 ? stats.pendingLeaves : 0}
          iconColor="text-primary-600"
          iconBg="bg-primary-100"
          className="bg-primary-50 border-primary-200"
          valueClassName="text-primary-700"
        />
        <StatCard
          icon={Clock}
          label="Chờ duyệt"
          value={stats.pendingLeaves}
          iconColor="text-warning-600"
          iconBg="bg-warning-100"
          className="bg-warning-50 border-warning-200"
          valueClassName="text-warning-700"
          onClick={() => router.push('/leave/approval')}
        />
      </div>

      {/* ─── D. Quick Actions (high for thumb reach) ─── */}
      <QuickActionGrid
        actions={[
          {
            icon: FileCheck,
            label: 'Duyệt đơn',
            bgColor: 'bg-primary-100',
            iconColor: 'text-primary-600',
            onClick: () => router.push('/leave/approval'),
          },
          {
            icon: CalendarDays,
            label: 'Xếp lịch',
            bgColor: 'bg-success-100',
            iconColor: 'text-success-600',
            onClick: () => router.push('/settings/staffing'),
          },
          {
            icon: BarChart3,
            label: 'Báo cáo',
            bgColor: 'bg-primary-100',
            iconColor: 'text-primary-600',
            onClick: () => router.push('/reports'),
          },
          {
            icon: Settings,
            label: 'Cài đặt',
            bgColor: 'bg-gray-100',
            iconColor: 'text-gray-600',
            onClick: () => router.push('/settings'),
          },
        ]}
        columns={4}
      />

      {/* ─── KPI Quick Summary ─── */}
      <SectionGroup title="KPI & Hiệu suất" icon={BarChart3} iconClassName="text-indigo-500">
        <div className="grid grid-cols-2 gap-2 p-3">
          {[
            { icon: '📊', label: 'Dashboard KPI', href: '/kpi', color: '#2F6FA8' },
            { icon: '📈', label: 'Báo cáo', href: '/kpi/reports', color: '#1E9E57' },
            { icon: '✅', label: 'Review KPI', href: '/kpi/review', color: '#001D3D' },
            { icon: '🎯', label: 'Thăng tiến', href: '/kpi/promotion', color: '#eab308' },
          ].map(item => (
            <button key={item.href}
              onClick={() => router.push(item.href)}
              className="flex items-center gap-2 p-2.5 rounded-xl text-left transition-all hover:opacity-80"
              style={{ background: `${item.color}10` }}>
              <span className="text-lg">{item.icon}</span>
              <span className="text-xs font-semibold" style={{ color: item.color }}>{item.label}</span>
            </button>
          ))}
        </div>
      </SectionGroup>

      {/* ─── E. Store list with progress bars ─── */}
      <SectionGroup
        title="Chấm công hôm nay"
        icon={MapPin}
        iconClassName="text-primary-500"
      >
        {storesSummary.length === 0 ? (
          <EmptyState
            variant="no-data"
            title="Chưa có cửa hàng"
            description="Thêm cửa hàng trong Cài đặt"
          />
        ) : (
          storesSummary.map(s => {
            const pct = s.total > 0 ? Math.round((s.checkedIn / s.total) * 100) : 0
            const isLow = pct < 50
            const isMedium = pct >= 50 && pct < 80
            return (
              <ListItem
                key={s.store.id}
                icon={MapPin}
                iconBgColor={isLow ? 'bg-error-100' : isMedium ? 'bg-warning-100' : 'bg-success-100'}
                iconColor={isLow ? 'text-error-500' : isMedium ? 'text-warning-500' : 'text-success-500'}
                title={s.store.name}
                subtitle={`${s.checkedIn}/${s.total} đã check-in`}
                rightContent={
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isLow ? 'bg-error-500' : isMedium ? 'bg-warning-500' : 'bg-success-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={`text-sm font-semibold min-w-[3ch] ${
                      isLow ? 'text-error-600' : isMedium ? 'text-warning-600' : 'text-success-600'
                    }`}>
                      {pct}%
                    </span>
                  </div>
                }
                onClick={() => router.push(`/attendance/by-store?id=${s.store.id}`)}
                showChevron
              />
            )
          })
        )}
      </SectionGroup>

      {/* ─── F. Pending leaves with inline approve/reject ─── */}
      <section aria-labelledby="pending-leaves-title" role="region">
        <h2 id="pending-leaves-title" className="sr-only">Đơn nghỉ phép chờ duyệt</h2>

        <SectionGroup
          title={`Đơn chờ duyệt (${pendingLeaves.length})`}
          icon={FileText}
          iconClassName="text-warning-500"
          rightAction={
            pendingLeaves.length > 0 ? (
              <button
                onClick={() => router.push('/leave/approval')}
                className="text-xs text-primary-600 font-medium hover:underline"
              >
                Xem tất cả →
              </button>
            ) : undefined
          }
        >
          {/* Empty state */}
          {pendingLeaves.length === 0 && (
            <div className="py-8 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">Không có đơn nào chờ duyệt</p>
            </div>
          )}

          {/* Leave items */}
          {pendingLeaves.slice(0, 3).map(req => {
            const emp = getEmployeeById(req.employee_id)
            const shortName = emp?.full_name.split(' ').slice(-2).join(' ') ?? 'N/A'
            return (
              <div
                key={req.id}
                className="px-4 py-3.5 flex items-center gap-3
                  hover:bg-gray-50 active:bg-gray-100
                  transition-colors duration-150
                  cursor-pointer rounded-xl mx-2"
              >
                {/* Avatar — hashed color per user */}
                <Avatar name={shortName} size="md" />

                {/* Info */}
                <div
                  className="flex-1 min-w-0"
                  onClick={() => router.push('/leave/approval')}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && router.push('/leave/approval')}
                >
                  <p className="text-sm font-semibold text-gray-900 truncate">{shortName}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {req.leave_type_label}
                    <span className="mx-1.5 text-gray-300">·</span>
                    {formatDate(req.start_date)} – {formatDate(req.end_date)}
                  </p>
                </div>

                {/* Pill action buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleQuickApprove(req.id)
                    }}
                    className="h-9 px-3 rounded-full bg-emerald-500 text-white text-xs font-semibold
                      flex items-center gap-1.5
                      hover:bg-emerald-600 active:scale-95 transition-all
                      shadow-sm hover:shadow-md"
                    aria-label={`Duyệt đơn của ${shortName}`}
                  >
                    <Check size={14} />
                    <span className="hidden sm:inline">Duyệt</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleQuickReject(req.id)
                    }}
                    className="h-9 px-3 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold
                      flex items-center gap-1.5
                      hover:bg-error-50 hover:text-error-600 active:scale-95 transition-all"
                    aria-label={`Từ chối đơn của ${shortName}`}
                  >
                    <X size={14} />
                    <span className="hidden sm:inline">Từ chối</span>
                  </button>
                </div>
              </div>
            )
          })}

          {/* See all link */}
          {pendingLeaves.length > 3 && (
            <button
              onClick={() => router.push('/leave/approval')}
              className="w-full py-3 text-sm text-primary-600 hover:text-primary-700 font-medium hover:bg-gray-50 rounded-lg transition-colors"
            >
              Xem tất cả {pendingLeaves.length} đơn →
            </button>
          )}
        </SectionGroup>
      </section>

      {/* Approve Confirmation Dialog */}
      <ConfirmDialog
        isOpen={approveDialog.isOpen}
        onClose={() => setApproveDialog({ isOpen: false, leaveId: null })}
        onConfirm={confirmApprove}
        title="Duyệt đơn nghỉ phép?"
        description="Xác nhận duyệt đơn nghỉ phép này. Nhân viên sẽ nhận được thông báo."
        confirmLabel="Duyệt"
        variant="success"
        isLoading={isProcessing}
      />

      {/* Reject Confirmation Dialog */}
      <ConfirmDialog
        isOpen={rejectDialog.isOpen}
        onClose={() => setRejectDialog({ isOpen: false, leaveId: null })}
        onConfirm={confirmReject}
        title="Từ chối đơn nghỉ phép?"
        description="Vui lòng nhập lý do từ chối để nhân viên hiểu rõ."
        confirmLabel="Từ chối"
        variant="danger"
        showReasonInput
        reasonLabel="Lý do từ chối"
        reasonPlaceholder="Ví dụ: Thiếu nhân sự trong ngày đó..."
        reasonRequired
        isLoading={isProcessing}
      />
    </div>
  )
}
