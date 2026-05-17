'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { getStoreById, mockShifts } from '@/lib/mock-data'
import {
  getStoreAttendanceSummary,
  getStoreTodayCrewList,
  getStorePendingLeaveCount,
} from '@/lib/mock-data-home'
import { checkWeekUnderstaffing, type StaffingStatus } from '@/lib/understaffing-alert'
import { formatTime } from '@/lib/utils'
import {
  PageHeader, StatCard, UrgentBanner, SectionGroup,
  QuickActionGrid, SkeletonCard, EmptyState, Avatar, Badge,
} from '@/components/ui'
import {
  Users, UserCheck, UserX, FileText, Coffee,
  FileCheck, CalendarDays, BarChart3, ClipboardList, AlertTriangle,
} from 'lucide-react'

export default function ManagerDashboard() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [filterShift, setFilterShift] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [staffingStatus, setStaffingStatus] = useState<StaffingStatus | null>(null)

  useEffect(() => {
    try {
      setIsLoading(true)
      setError(null)
      if (user) {
        setStaffingStatus(checkWeekUnderstaffing(user.store_id))
      }
    } catch {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.')
    } finally {
      const timer = setTimeout(() => setIsLoading(false), 400)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!user) return null

  const store = getStoreById(user.store_id)
  const summary = getStoreAttendanceSummary(user.store_id)
  const crewList = getStoreTodayCrewList(user.store_id)
  const pendingLeaves = getStorePendingLeaveCount(user.store_id)

  // Filter crew by shift
  const filteredCrew = filterShift === 'all'
    ? crewList
    : crewList.filter(c => c.shift?.id === filterShift)

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="p-4 space-y-4 pb-20 animate-fade-in">
        <PageHeader title="Quản lý cửa hàng" showBack={false} />
        <SkeletonCard variant="banner" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <SkeletonCard variant="stat" />
          <SkeletonCard variant="stat" />
          <SkeletonCard variant="stat" />
          <SkeletonCard variant="stat" />
        </div>
        <SkeletonCard variant="card" />
        {/* Crew list skeleton */}
        <div className="space-y-0.5">
          {[1,2,3].map(i => (
            <div key={i} className="px-4 py-3.5 flex items-center gap-3 animate-pulse">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-28 bg-gray-200 rounded" />
                <div className="h-3 w-40 bg-gray-100 rounded" />
              </div>
              <div className="h-5 w-16 bg-gray-200 rounded-full" />
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
        <PageHeader title="Quản lý cửa hàng" showBack={false} />
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
      <PageHeader
        title={store ? `Quản lý – ${store.name}` : 'Quản lý cửa hàng'}
        showBack={false}
      />

      {/* ─── B. Urgent Banner ─── */}
      {pendingLeaves > 0 && (
        <UrgentBanner
          icon={ClipboardList}
          variant="warning"
          count={pendingLeaves}
          message="đơn nghỉ phép cần duyệt"
          actionLabel="Duyệt ngay"
          onClick={() => router.push('/leave/approval')}
        />
      )}

      {/* ─── B2. Staffing Alert ─── */}
      {staffingStatus && staffingStatus.hasAlerts && (
        <div
          className={`rounded-2xl p-3.5 border animate-slide-up ${
            staffingStatus.criticalCount > 0
              ? 'bg-red-50/60 border-red-200'
              : 'bg-amber-50/60 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
              staffingStatus.criticalCount > 0 ? 'bg-red-100' : 'bg-amber-100'
            }`}>
              <AlertTriangle size={20} className={staffingStatus.criticalCount > 0 ? 'text-red-600' : 'text-amber-600'} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${
                staffingStatus.criticalCount > 0 ? 'text-red-800' : 'text-amber-800'
              }`}>
                {staffingStatus.criticalCount > 0
                  ? `${staffingStatus.criticalCount} ca thiếu người nghiêm trọng`
                  : `${staffingStatus.warningCount} ca cảnh báo thiếu người`
                }
              </p>
              {staffingStatus.alerts[0] && (
                <p className={`text-xs truncate ${staffingStatus.criticalCount > 0 ? 'text-red-600' : 'text-amber-600'}`}>
                  {staffingStatus.alerts[0].message}
                </p>
              )}
            </div>
            <button
              onClick={() => router.push('/schedule/warnings')}
              className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors ${
                staffingStatus.criticalCount > 0
                  ? 'border-red-300 text-red-700 hover:bg-red-100'
                  : 'border-amber-300 text-amber-700 hover:bg-amber-100'
              }`}
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
          label="NV hôm nay"
          value={summary.total}
          iconColor="text-blue-600"
          iconBg="bg-blue-100"
        />
        <StatCard
          icon={UserCheck}
          label="Đã check-in"
          value={summary.checkedIn}
          iconColor="text-green-600"
          iconBg="bg-green-100"
          className="bg-green-50 border-green-200"
          valueClassName="text-green-700"
        />
        <StatCard
          icon={UserX}
          label="Chưa check-in"
          value={summary.notArrived}
          iconColor="text-red-600"
          iconBg="bg-red-100"
          className="bg-red-50 border-red-200"
          valueClassName="text-red-700"
        />
        <StatCard
          icon={FileText}
          label="Đơn chờ"
          value={pendingLeaves}
          iconColor="text-amber-600"
          iconBg="bg-amber-100"
          className="bg-amber-50 border-amber-200"
          valueClassName="text-amber-700"
          onClick={() => router.push('/leave/approval')}
        />
      </div>

      {/* ─── D. Quick Actions (moved up for reachability) ─── */}
      <QuickActionGrid
        actions={[
          {
            icon: FileCheck,
            label: 'Duyệt nghỉ',
            bgColor: 'bg-blue-100',
            iconColor: 'text-blue-600',
            onClick: () => router.push('/leave/approval'),
          },
          {
            icon: CalendarDays,
            label: 'Xếp ca',
            bgColor: 'bg-green-100',
            iconColor: 'text-green-600',
            onClick: () => router.push('/schedule'),
          },
          {
            icon: UserCheck,
            label: 'Chấm công',
            bgColor: 'bg-amber-100',
            iconColor: 'text-amber-600',
            onClick: () => router.push('/checkin'),
          },
          {
            icon: BarChart3,
            label: 'Báo cáo',
            bgColor: 'bg-purple-100',
            iconColor: 'text-purple-600',
            onClick: () => router.push('/reports'),
          },
        ]}
        columns={4}
      />

      {/* ─── KPI Quick Summary ─── */}
      <SectionGroup title="KPI Store" icon={BarChart3} iconClassName="text-indigo-500">
        <div className="grid grid-cols-2 gap-2 p-3">
          {[
            { icon: '📊', label: 'Dashboard KPI', href: '/kpi', color: '#3b82f6' },
            { icon: '📈', label: 'Báo cáo', href: '/kpi/reports', color: '#10b981' },
            { icon: '✅', label: 'Review KPI', href: '/kpi/review', color: '#8b5cf6' },
            { icon: '❌', label: 'Log lỗi', href: '/kpi/violations/log', color: '#ef4444' },
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

      {/* ─── E. Shift Filter Tabs ─── */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        <button
          onClick={() => setFilterShift('all')}
          className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
            filterShift === 'all'
              ? 'bg-primary-600 text-white shadow-sm'
              : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
          }`}
        >
          Tất cả
        </button>
        {mockShifts.map(s => (
          <button
            key={s.id}
            onClick={() => setFilterShift(s.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              filterShift === s.id
                ? 'text-white shadow-sm'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
            style={filterShift === s.id ? { background: s.color } : undefined}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* ─── F. Crew List with Avatar hashed colors ─── */}
      <SectionGroup
        title={`Nhân viên hôm nay (${filteredCrew.length})`}
        icon={Users}
        iconClassName="text-blue-500"
        rightAction={
          <span className="text-xs text-gray-500">{filteredCrew.length} người</span>
        }
      >
        {filteredCrew.length === 0 ? (
          <EmptyState
            variant="no-results"
            icon={Coffee}
            title="Không có nhân viên"
            description="Thay đổi bộ lọc ca để xem nhân viên khác"
          />
        ) : (
          <div className="max-h-[340px] overflow-y-auto">
            {filteredCrew.map(c => {
              const shortName = c.employee.full_name.split(' ').slice(-2).join(' ')
              const statusVariant =
                c.status === 'checked_out' ? 'success' as const
                : c.status === 'checked_in' ? 'info' as const
                : 'error' as const
              const statusLabel =
                c.status === 'checked_out' ? 'Đã về'
                : c.status === 'checked_in' ? 'Đang làm'
                : 'Chưa đến'

              return (
                <div
                  key={c.employee.id}
                  className="px-4 py-3 flex items-center gap-3
                    hover:bg-gray-50 active:bg-gray-100
                    transition-colors duration-150
                    cursor-pointer rounded-xl mx-2"
                  onClick={() => router.push(`/employees/${c.employee.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => e.key === 'Enter' && router.push(`/employees/${c.employee.id}`)}
                >
                  <Avatar name={shortName} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{shortName}</p>
                    <p className="text-xs text-gray-500 truncate">
                      {c.shift?.name ?? ''}
                      {c.checkinTime && (
                        <>
                          <span className="mx-1.5 text-gray-300">·</span>
                          {formatTime(c.checkinTime)}
                        </>
                      )}
                    </p>
                  </div>
                  <Badge variant={statusVariant}>{statusLabel}</Badge>
                </div>
              )
            })}
          </div>
        )}
      </SectionGroup>
    </div>
  )
}
