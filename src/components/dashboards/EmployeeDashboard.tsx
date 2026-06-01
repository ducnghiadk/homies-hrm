'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import {
  getShiftById,
  getStoreById,
} from '@/lib/mock-data'
import {
  getTodaySchedule,
  getWeekSchedules,
  getTodayAtt,
  getCheckinStatus,
  getEmployeeKPI,
  getStoreTodayCrewList,
  dayLabels,
} from '@/lib/mock-data-home'
import { formatTime } from '@/lib/utils'
import {
  PageHeader, StatCard, SectionGroup,
  QuickActionGrid, SkeletonCard, EmptyState, Avatar, Badge,
} from '@/components/ui'
import {
  MapPin, Clock, CalendarDays, Target, Coffee,
  LogIn, LogOut, CheckCircle2, FileText, DollarSign, Users,
} from 'lucide-react'
import Link from 'next/link'

export default function EmployeeDashboard() {
  const { user } = useAuthStore()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      setIsLoading(true)
      setError(null)
    } catch {
      setError('Không thể tải dữ liệu. Vui lòng thử lại.')
    } finally {
      const timer = setTimeout(() => setIsLoading(false), 400)
      return () => clearTimeout(timer)
    }
  }, [])

  if (!user) return null

  const isShiftLeader = user.role === 'shift_leader'
  const store = getStoreById(user.store_id)
  const todaySchedule = getTodaySchedule(user.id)
  const todayShift = todaySchedule ? getShiftById(todaySchedule.shift_id) : null
  const checkinStatus = getCheckinStatus(user.id)
  const todayAtt = getTodayAtt(user.id)
  const weekSchedules = getWeekSchedules(user.id)
  const kpi = getEmployeeKPI(user.id)
  const crewList = isShiftLeader ? getStoreTodayCrewList(user.store_id) : []

  const firstName = user.full_name.split(' ').slice(-1)[0]

  /* ── Loading skeleton ── */
  if (isLoading) {
    return (
      <div className="p-4 space-y-4 pb-20 animate-fade-in">
        <PageHeader title={`Xin chào, ${firstName}!`} showBack={false} />
        <div className="h-40 bg-gray-200 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard variant="stat" />
          <SkeletonCard variant="stat" />
        </div>
        <SkeletonCard variant="card" />
      </div>
    )
  }

  /* ── Error state ── */
  if (error) {
    return (
      <div className="p-4 pb-20">
        <PageHeader title={`Xin chào, ${firstName}!`} showBack={false} />
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
        title={`Xin chào, ${firstName}!`}
        showBack={false}
        rightActions={
          store && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <MapPin size={12} /> {store.name}
            </span>
          )
        }
      />

      {/* ─── B. Hero Card: Ca hôm nay ─── */}
      {todayShift ? (
        <div
          className="rounded-2xl overflow-hidden shadow-lg transition-all duration-300"
          style={{
            background: `linear-gradient(135deg, ${todayShift.color}dd, ${todayShift.color}99)`,
          }}
        >
          <div className="p-5 text-white">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2 mb-2 opacity-90">
                  <Clock size={16} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Ca hôm nay</span>
                </div>
                <p className="text-3xl font-bold tracking-tight">{todayShift.name}</p>
                <div className="flex items-center gap-1.5 mt-2 opacity-90">
                  <MapPin size={14} />
                  <span className="text-sm">{todayShift.start_time} — {todayShift.end_time}</span>
                </div>
              </div>
              {store && (
                <Badge className="bg-white/20 text-white border-0 text-xs">
                  {store.name}
                </Badge>
              )}
            </div>

            {/* Check-in/out inside hero */}
            {checkinStatus === 'not_checked_in' && (
              <Link href="/checkin">
                <button
                  className="w-full bg-white text-primary-600 font-semibold py-3.5 rounded-xl
                    hover:bg-primary-50 active:scale-[0.98] transition-all
                    flex items-center justify-center gap-2 shadow-sm mt-2"
                >
                  <LogIn size={20} />
                  Check-in ngay
                </button>
              </Link>
            )}
            {checkinStatus === 'checked_in' && (
              <Link href="/checkin">
                <button
                  className="w-full bg-white/20 text-white font-semibold py-3.5 rounded-xl
                    hover:bg-white/30 active:scale-[0.98] transition-all
                    flex items-center justify-center gap-2 border border-white/30 mt-2"
                >
                  <LogOut size={20} />
                  Check-out
                  {todayAtt?.check_in_time && (
                    <span className="text-sm font-normal opacity-80 ml-1">
                      (Vào {formatTime(todayAtt.check_in_time)})
                    </span>
                  )}
                </button>
              </Link>
            )}
            {checkinStatus === 'checked_out' && (
              <div className="w-full bg-white/20 text-white font-medium py-3.5 rounded-xl
                flex items-center justify-center gap-2 border border-white/30 mt-2">
                <CheckCircle2 size={20} />
                Đã hoàn thành ca
              </div>
            )}
          </div>
        </div>
      ) : (
        <EmptyState
          variant="no-data"
          icon={Coffee}
          title="Không có ca hôm nay"
          description="Bạn được nghỉ ngơi! Xem lịch tuần để biết ca tiếp theo."
        />
      )}

      {/* ─── C. Color-coded Stats (2 cols) ─── */}
      {kpi && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Clock}
            label="Điểm KPI"
            value={`${kpi.score}/100`}
            iconColor={kpi.grade === 'A' ? 'text-success-600' : kpi.grade === 'B' ? 'text-primary-600' : 'text-warning-600'}
            iconBg={kpi.grade === 'A' ? 'bg-success-100' : kpi.grade === 'B' ? 'bg-primary-100' : 'bg-warning-100'}
            className={kpi.grade === 'A' ? 'bg-success-50 border-success-200' : kpi.grade === 'B' ? 'bg-primary-50 border-primary-200' : 'bg-warning-50 border-warning-200'}
            valueClassName={kpi.grade === 'A' ? 'text-success-700' : kpi.grade === 'B' ? 'text-primary-700' : 'text-warning-700'}
          />
          <StatCard
            icon={Target}
            label="Hạng tháng này"
            value={`Hạng ${kpi.grade}`}
            iconColor="text-warning-600"
            iconBg="bg-warning-100"
            className="bg-warning-50 border-warning-200"
            valueClassName="text-warning-700"
          />
        </div>
      )}

      {/* ─── C2. KPI Evaluation Widget ─── */}
      <SectionGroup title="Đánh giá KPI tháng này" icon={Target} iconClassName="text-primary-500">
        <div className="p-4 space-y-3">
          <div className="flex gap-2">
            <Link href="/kpi/evaluate" className="flex-1 no-underline">
              <div className="py-3 px-3 rounded-xl text-center text-xs font-bold text-white"
                style={{ background: 'var(--primary)' }}>
                📝 Tự đánh giá
              </div>
            </Link>
            <Link href="/kpi/result" className="flex-1 no-underline">
              <div className="py-3 px-3 rounded-xl text-center text-xs font-bold"
                style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}>
                📊 Xem kết quả
              </div>
            </Link>
          </div>
          <Link href="/kpi/violations" className="block no-underline">
            <div className="py-2 px-3 rounded-xl text-center text-[11px] font-semibold"
              style={{ background: 'var(--color-vanilla-200)', color: 'var(--color-primary-800)' }}>
              ⚠️ Xem lỗi vi phạm
            </div>
          </Link>
        </div>
      </SectionGroup>

      {/* ─── D. Quick Actions (3 cols) ─── */}
      <QuickActionGrid
        actions={[
          {
            icon: LogIn,
            label: 'Check-in',
            bgColor: 'bg-success-100',
            iconColor: 'text-success-600',
            onClick: () => router.push('/checkin'),
            disabled: checkinStatus === 'checked_out',
          },
          {
            icon: CalendarDays,
            label: 'Xin nghỉ',
            bgColor: 'bg-primary-100',
            iconColor: 'text-primary-600',
            onClick: () => router.push('/leave/request'),
          },
          {
            icon: DollarSign,
            label: 'Xem lương',
            bgColor: 'bg-warning-100',
            iconColor: 'text-warning-600',
            onClick: () => router.push('/payroll'),
          },
        ]}
        columns={3}
      />

      {/* ─── E. Week schedule (7-col grid) ─── */}
      <SectionGroup
        title="Tuần này"
        icon={CalendarDays}
        iconClassName="text-primary-500"
      >
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1.5">
            {weekSchedules.map((ws, idx) => {
              const shift = ws.schedule ? getShiftById(ws.schedule.shift_id) : null
              const isToday = ws.date === new Date().toISOString().split('T')[0]
              return (
                <div
                  key={ws.date}
                  className={`text-center py-2 rounded-xl transition-all cursor-pointer
                    ${isToday ? 'bg-primary-50 ring-2 ring-primary-500 ring-offset-1' : 'hover:bg-gray-50'}
                    ${shift ? 'hover:bg-primary-50' : ''}
                  `}
                  onClick={() => shift && router.push(`/schedules?selectedDate=${ws.date}`)}
                >
                  <p className={`text-[10px] font-medium uppercase ${isToday ? 'text-primary-600' : 'text-gray-400'}`}>
                    {dayLabels[idx]}
                  </p>
                  <p className={`text-sm font-bold mt-0.5 ${isToday ? 'text-primary-700' : 'text-gray-900'}`}>
                    {new Date(ws.date).getDate()}
                  </p>
                  {shift ? (
                    <div
                      className="w-1.5 h-1.5 rounded-full mx-auto mt-1"
                      style={{ background: shift.color }}
                      title={shift.name}
                    />
                  ) : (
                    <div className="text-[8px] text-gray-300 font-medium mt-1">Nghỉ</div>
                  )}
                </div>
              )
            })}
          </div>
          {/* Shift legend */}
          <div className="flex gap-4 mt-3 pt-2 border-t border-gray-50">
            {[
              { name: 'Sáng', color: 'var(--color-vanilla-500)' },
              { name: 'Chiều', color: 'var(--color-accent-400)' },
              { name: 'Tối', color: 'var(--color-primary-600)' },
            ].map(s => (
              <div key={s.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                <span className="text-xs text-gray-400">{s.name}</span>
              </div>
            ))}
          </div>
        </div>
      </SectionGroup>

      {/* ─── F. Shift Leader: Crew List with Avatar ─── */}
      {isShiftLeader && crewList.length > 0 && (
        <SectionGroup
          title={`Nhân viên ca hôm nay (${crewList.length})`}
          icon={Users}
          iconClassName="text-primary-500"
        >
          {crewList.map(c => {
            const shortName = c.employee.full_name.split(' ').slice(-2).join(' ')
            const statusVariant =
              c.status === 'checked_out' ? 'success' as const
              : c.status === 'checked_in' ? 'info' as const
              : 'error' as const
            const statusLabel =
              c.status === 'checked_out' ? 'Đã về'
              : c.status === 'checked_in' ? 'Đã check-in'
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
                    {c.shift?.name}
                    <span className="mx-1.5 text-gray-300">·</span>
                    {c.shift?.start_time}–{c.shift?.end_time}
                  </p>
                </div>
                <Badge variant={statusVariant}>{statusLabel}</Badge>
              </div>
            )
          })}

          {/* Shift leader report link */}
          {checkinStatus === 'checked_out' && (
            <button
              onClick={() => router.push('/reports/tasks')}
              className="w-full py-3 text-sm text-primary-600 hover:text-primary-700 font-medium
                hover:bg-gray-50 rounded-lg transition-colors
                flex items-center justify-center gap-2"
            >
              <FileText size={16} /> Báo cáo cuối ca
            </button>
          )}
        </SectionGroup>
      )}
    </div>
  )
}
