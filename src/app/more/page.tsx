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
  { icon: BarChart3, label: 'Báo cáo', description: 'Xem báo cáo doanh thu, nhân sự', href: '/reports', iconBg: 'bg-primary-100', iconColor: 'text-primary-600' },
  { icon: FileText, label: 'Hợp đồng nhân sự', description: 'Xem và ký hợp đồng trên app', href: '/employees/contracts', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { icon: Calculator, label: 'Định biên & Xếp ca', description: 'Tính toán nhân sự, tạo lịch tự động', href: '/settings/staffing', iconBg: 'bg-primary-100', iconColor: 'text-primary-600' },
  { icon: CreditCard, label: 'Bảng lương', description: 'Quản lý lương, thưởng, khấu trừ', href: '/payroll', iconBg: 'bg-success-100', iconColor: 'text-success-600' },
  { icon: MessageCircle, label: 'Chat', description: 'Nhắn tin với nhân viên', href: '/chat', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { icon: Store, label: 'Cửa hàng', description: 'Quản lý danh sách cửa hàng', href: '/stores', iconBg: 'bg-warning-100', iconColor: 'text-warning-600' },
]

const settingsItems = [
  { icon: Bell, label: 'Thông báo', href: '/notifications', iconBg: 'bg-warning-100', iconColor: 'text-warning-600' },
  { icon: Wifi, label: 'WiFi Check-in', description: 'Cài đặt WiFi chấm công', href: '/settings/wifi', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  { icon: Settings, label: 'Cài đặt chung', description: 'Cửa hàng, quy tắc, phân quyền', href: '/settings', iconBg: 'bg-gray-100', iconColor: 'text-gray-600' },
  { icon: Shield, label: 'Demo Phân Quyền (RBAC)', description: 'Mới • Giả lập và so sánh quyền các vai trò', href: '/rbac', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { icon: WifiOff, label: 'Demo Chế Độ Ngoại Tuyến', description: 'Mới • Trải nghiệm offline-first và sync dữ liệu', href: '/offline-demo', iconBg: 'bg-warning-100', iconColor: 'text-warning-600' },
  { icon: HelpCircle, label: 'Trợ giúp', href: '/help', iconBg: 'bg-sky-100', iconColor: 'text-sky-600' },
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
              className="flex items-center gap-3 p-4 transition-colors hover:bg-gray-50 active:bg-gray-100"
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
    { icon: AlertTriangle, label: 'Lỗi vận hành', href: '/kpi/violations', iconBg: 'bg-error-100', iconColor: 'text-error-600', badge: myViolations > 0 ? `${myViolations} mới` : undefined },
    { icon: Award, label: 'Bảng xếp hạng', href: '/kpi/leaderboard', iconBg: 'bg-warning-100', iconColor: 'text-warning-600' },
  ]

  const kpiManagerItems: MenuItem[] = [
    { icon: ClipboardCheck, label: 'Review KPI', href: '/kpi/review', iconBg: 'bg-primary-100', iconColor: 'text-primary-600', badge: pendingReviews > 0 ? `${pendingReviews} chờ` : undefined },
    { icon: AlertTriangle, label: 'Log lỗi nhân viên', href: '/kpi/violations/log', iconBg: 'bg-error-100', iconColor: 'text-error-600' },
    { icon: AlertTriangle, label: 'Log lỗi cuối ca', description: 'Mới', href: '/kpi/violations/batch', iconBg: 'bg-warning-100', iconColor: 'text-warning-600' },
    { icon: BarChart3, label: 'Xét khiếu nại', href: '/kpi/violations/appeals', iconBg: 'bg-warning-100', iconColor: 'text-warning-600', badge: pendingAppeals > 0 ? `${pendingAppeals} chờ` : undefined },
    { icon: BarChart3, label: 'Báo cáo KPI', href: '/kpi/reports', iconBg: 'bg-primary-100', iconColor: 'text-primary-600' },
    { icon: Target, label: 'Xét thăng tiến', href: '/kpi/promotion', iconBg: 'bg-success-100', iconColor: 'text-success-600', badge: pendingPromos > 0 ? `${pendingPromos} chờ` : undefined },
    { icon: Settings, label: 'Cài đặt KPI', href: '/kpi/settings', iconBg: 'bg-gray-100', iconColor: 'text-gray-600' },
  ]

  const scheduleManagerItems: MenuItem[] = [
    { icon: CalendarDays, label: 'Bảng xếp lịch', description: 'Board tuần, nhu cầu, gán người, publish', href: '/schedules', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
    { icon: Settings, label: 'Setting Ca', description: 'Tên ca, khung giờ, vị trí được làm ca', href: '/settings/schedule-rules/shifts', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
    { icon: SlidersHorizontal, label: 'Quy tắc xếp ca', description: 'Cảnh báo, chặn xếp trùng, ngưỡng giờ làm', href: '/settings/schedule-rules', iconBg: 'bg-sky-100', iconColor: 'text-sky-600' },
    { icon: ListChecks, label: 'Đăng ký ca mong muốn', description: 'Preference của nhân viên trước khi xếp', href: '/settings/schedule-rules/preferences', iconBg: 'bg-amber-100', iconColor: 'text-amber-700' },
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
