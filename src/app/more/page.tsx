'use client'

import AppShell from '@/components/layout/AppShell'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Avatar } from '@/components/ui'
import {
  AlertTriangle,
  Award,
  BarChart3,
  Bell,
  CalendarDays,
  Calculator,
  ChevronRight,
  ClipboardCheck,
  CreditCard,
  FileText,
  HelpCircle,
  ListChecks,
  LogOut,
  MessageCircle,
  Settings,
  Shield,
  SlidersHorizontal,
  Store,
  Target,
  Wifi,
  WifiOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockViolationRecords, mockEvaluations, mockPromotionReviews, getCurrentPeriod } from '@/lib/mock-data-kpi'

const managementItems = [
  { icon: BarChart3, label: 'Báo cáo & Phân tích', description: 'Xem báo cáo giờ công, nhân sự, chi phí', href: '/reports', iconBg: 'bg-primary-100', iconColor: 'text-primary-600' },
  { icon: FileText, label: 'Hợp đồng lao động', description: 'Mẫu hợp đồng, ký duyệt trên app', href: '/employees/contracts', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { icon: Target, label: 'Thưởng BSC Cửa hàng', description: 'Bảng quyết toán & chia thưởng BSC', href: '/bsc-bonus', iconBg: 'bg-amber-100', iconColor: 'text-amber-700' },
  { icon: CreditCard, label: 'Bảng lương', description: 'Bảng tính lương, phiếu lương, tạm ứng', href: '/payroll', iconBg: 'bg-success-100', iconColor: 'text-success-600' },
  { icon: ClipboardCheck, label: 'Sổ vận hành ca', description: 'Việc hằng ngày, bàn giao ca, sự cố', href: '/tasks/daily', iconBg: 'bg-teal-100', iconColor: 'text-teal-700' },
  { icon: MessageCircle, label: 'Chat & Trao đổi', description: 'Nhắn tin nội bộ với nhân viên', href: '/chat', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
]

const settingsItems = [
  { icon: Bell, label: 'Thông báo', href: '/notifications', iconBg: 'bg-warning-100', iconColor: 'text-warning-600' },
  { icon: Wifi, label: 'WiFi Check-in', description: 'Cài đặt WiFi chấm công chi nhánh', href: '/settings/wifi', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  { icon: Settings, label: 'Cài đặt hệ thống', description: '5 nhóm cài đặt chuẩn SaaS', href: '/settings', iconBg: 'bg-primary-50', iconColor: 'text-gray-600' },
  { icon: HelpCircle, label: 'Trợ giúp & Hướng dẫn', href: '/policies', iconBg: 'bg-sky-100', iconColor: 'text-sky-600' },
]

type MenuItem = {
  icon: React.ElementType
  label: string
  description?: string
  href: string
  iconBg: string
  iconColor: string
  badge?: number | string
}

function MenuSection({ title, items }: { title: string; items: MenuItem[] }) {
  return (
    <div className="space-y-2">
      <h3 className="px-1 text-xs font-bold uppercase tracking-wider text-gray-400">{title}</h3>
      <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white shadow-[var(--shadow-card)]">
        {items.map(item => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 p-4 transition-colors hover:bg-vanilla-50 active:bg-primary-50"
            >
              <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', item.iconBg)}>
                <Icon size={20} className={item.iconColor} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                {item.description && <p className="mt-0.5 truncate text-xs text-gray-400">{item.description}</p>}
              </div>
              {item.badge != null && (
                <span className="rounded-full bg-error-100 px-2 py-0.5 text-[10px] font-bold text-error-600">{item.badge}</span>
              )}
              <ChevronRight size={16} className="flex-shrink-0 text-gray-300" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default function MorePage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const period = getCurrentPeriod()
  const isManager = user?.role === 'store_manager' || user?.role === 'shift_leader' || user?.role === 'ceo'

  const myViolations = mockViolationRecords.filter(v => v.employee_id === user?.id && v.status === 'pending').length
  const pendingReviews = mockEvaluations.filter(e => e.period === period && e.status === 'self_submitted').length
  const pendingAppeals = mockViolationRecords.filter(v => v.status === 'appealed').length
  const pendingPromos = mockPromotionReviews.filter(p => p.status === 'pending').length

  const kpiEmployeeItems: MenuItem[] = [
    { icon: Target, label: 'KPI của tôi', href: '/kpi', iconBg: 'bg-primary-100', iconColor: 'text-primary-600' },
    { icon: ClipboardCheck, label: 'Tự đánh giá', href: '/kpi/evaluate', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { icon: AlertTriangle, label: 'Sự cố & Vi phạm', href: '/kpi/violations', iconBg: 'bg-error-100', iconColor: 'text-error-600', badge: myViolations > 0 ? `${myViolations} mới` : undefined },
    { icon: Award, label: 'Bảng xếp hạng', href: '/kpi/leaderboard', iconBg: 'bg-warning-100', iconColor: 'text-warning-600' },
  ]

  const kpiManagerItems: MenuItem[] = [
    { icon: Target, label: 'Thưởng BSC Cửa hàng', href: '/bsc-bonus', iconBg: 'bg-amber-100', iconColor: 'text-amber-700' },
    { icon: ClipboardCheck, label: 'Review KPI', href: '/kpi/review', iconBg: 'bg-primary-100', iconColor: 'text-primary-600', badge: pendingReviews > 0 ? `${pendingReviews} chờ` : undefined },
    { icon: AlertTriangle, label: 'Nhật ký ghi lỗi ca', href: '/kpi/violations/log', iconBg: 'bg-error-100', iconColor: 'text-error-600' },
    { icon: AlertTriangle, label: 'Xét khiếu nại vi phạm', href: '/kpi/violations/appeals', iconBg: 'bg-warning-100', iconColor: 'text-warning-600', badge: pendingAppeals > 0 ? `${pendingAppeals} chờ` : undefined },
    { icon: BarChart3, label: 'Báo cáo KPI', href: '/kpi/reports', iconBg: 'bg-primary-100', iconColor: 'text-primary-600' },
    { icon: Settings, label: 'Cài đặt BSC & Khung lỗi', href: '/settings/bsc', iconBg: 'bg-primary-50', iconColor: 'text-gray-600' },
  ]

  const scheduleManagerItems: MenuItem[] = [
    { icon: CalendarDays, label: 'Bảng xếp lịch tuần', description: 'Board tuần, nhu cầu, gán người, publish', href: '/schedule', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { icon: Settings, label: 'Khung ca làm việc', description: 'Tên ca, khung giờ, vị trí được làm ca', href: '/settings/schedule-rules/shifts', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
    { icon: SlidersHorizontal, label: 'Quy tắc xếp ca', description: 'Cảnh báo, chặn xếp trùng, ngưỡng giờ làm', href: '/settings/schedule-rules', iconBg: 'bg-sky-100', iconColor: 'text-sky-600' },
    { icon: Calculator, label: 'Định biên nhân sự', description: 'Số lượng nhân sự tối ưu theo giờ cao điểm', href: '/settings/staffing', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  ]

  return (
    <AppShell title="Thêm">
      <div className="space-y-5 pb-20">
        <Link
          href="/profile"
          className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-[var(--shadow-card)] transition-all hover:shadow-[var(--shadow-hover)]"
        >
          <Avatar name={user?.full_name ?? 'User'} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold tracking-tight text-gray-800">{user?.full_name}</p>
            <p className="text-xs capitalize text-gray-400">{user?.role?.replace('_', ' ')}</p>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </Link>

        <MenuSection title="KPI & Đánh giá" items={kpiEmployeeItems} />
        {isManager && <MenuSection title="Quản lý KPI" items={kpiManagerItems} />}
        {isManager && <MenuSection title="Quản lý Xếp lịch" items={scheduleManagerItems} />}
        <MenuSection title="Quản lý" items={managementItems} />
        <MenuSection title="Cài đặt" items={settingsItems} />

        <button
          onClick={() => { logout(); router.push('/login') }}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-semibold text-error-600 shadow-[var(--shadow-card)] transition-colors hover:bg-error-50 active:bg-error-100"
        >
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </AppShell>
  )
}
