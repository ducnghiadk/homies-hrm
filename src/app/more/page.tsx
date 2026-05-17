'use client'

import AppShell from '@/components/layout/AppShell'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/store/auth-store'
import { Avatar } from '@/components/ui'
import {
  BarChart3, Calculator, MessageCircle, Settings,
  ChevronRight, Store, Wifi, CreditCard, Bell,
  HelpCircle, LogOut, Target, ClipboardCheck, Award, AlertTriangle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { mockViolationRecords, mockEvaluations, mockPromotionReviews, getCurrentPeriod } from '@/lib/mock-data-kpi'

const managementItems = [
  { icon: BarChart3, label: 'Báo cáo', description: 'Xem báo cáo doanh thu, nhân sự', href: '/reports', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  { icon: Calculator, label: 'Định biên & Xếp ca', description: 'Tính toán nhân sự, tạo lịch tự động', href: '/settings/staffing', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
  { icon: CreditCard, label: 'Bảng lương', description: 'Quản lý lương, thưởng, khấu trừ', href: '/payroll', iconBg: 'bg-green-100', iconColor: 'text-green-600' },
  { icon: MessageCircle, label: 'Chat', description: 'Nhắn tin với nhân viên', href: '/chat', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { icon: Store, label: 'Cửa hàng', description: 'Quản lý danh sách cửa hàng', href: '/stores', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
]

const settingsItems = [
  { icon: Bell, label: 'Thông báo', href: '/notifications', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { icon: Wifi, label: 'WiFi Check-in', description: 'Cài đặt WiFi chấm công', href: '/settings/wifi', iconBg: 'bg-cyan-100', iconColor: 'text-cyan-600' },
  { icon: Settings, label: 'Cài đặt chung', description: 'Cửa hàng, quy tắc, phân quyền', href: '/settings', iconBg: 'bg-gray-100', iconColor: 'text-gray-600' },
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
      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">{title}</h3>
      <div className="bg-white rounded-2xl shadow-[var(--shadow-card)] overflow-hidden divide-y divide-gray-100">
        {items.map(item => {
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-3 p-4 hover:bg-gray-50 active:bg-gray-100 transition-colors">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', item.iconBg)}>
                <Icon size={20} className={item.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{item.label}</p>
                {item.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{item.description}</p>}
              </div>
              {item.badge != null && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-red-100 text-red-600">{item.badge}</span>
              )}
              <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
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
    { icon: Target, label: 'KPI của tôi', href: '/kpi', iconBg: 'bg-blue-100', iconColor: 'text-blue-600' },
    { icon: ClipboardCheck, label: 'Tự đánh giá', href: '/kpi/evaluate', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-600' },
    { icon: AlertTriangle, label: 'Lỗi vận hành', href: '/kpi/violations', iconBg: 'bg-red-100', iconColor: 'text-red-600', badge: myViolations > 0 ? `${myViolations} mới` : undefined },
    { icon: Award, label: 'Bảng xếp hạng', href: '/kpi/leaderboard', iconBg: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  ]

  const kpiManagerItems: MenuItem[] = [
    { icon: ClipboardCheck, label: 'Review KPI', href: '/kpi/review', iconBg: 'bg-blue-100', iconColor: 'text-blue-600', badge: pendingReviews > 0 ? `${pendingReviews} chờ` : undefined },
    { icon: AlertTriangle, label: 'Log lỗi nhân viên', href: '/kpi/violations/log', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
    { icon: AlertTriangle, label: 'Log lỗi cuối ca', description: '⭐ Mới', href: '/kpi/violations/batch', iconBg: 'bg-orange-100', iconColor: 'text-orange-600' },
    { icon: BarChart3, label: 'Xét khiếu nại', href: '/kpi/violations/appeals', iconBg: 'bg-amber-100', iconColor: 'text-amber-600', badge: pendingAppeals > 0 ? `${pendingAppeals} chờ` : undefined },
    { icon: BarChart3, label: 'Báo cáo KPI', href: '/kpi/reports', iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
    { icon: Target, label: 'Xét thăng tiến', href: '/kpi/promotion', iconBg: 'bg-green-100', iconColor: 'text-green-600', badge: pendingPromos > 0 ? `${pendingPromos} chờ` : undefined },
    { icon: Settings, label: 'Cài đặt KPI', href: '/kpi/settings', iconBg: 'bg-gray-100', iconColor: 'text-gray-600' },
  ]

  return (
    <AppShell title="Thêm">
      <div className="space-y-5 pb-20">
        <Link href="/profile"
          className="flex items-center gap-3 p-4 bg-white rounded-2xl shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-hover)] transition-all">
          <Avatar name={user?.full_name ?? 'User'} size="lg" />
          <div className="flex-1 min-w-0">
            <p className="text-base font-semibold text-gray-800 tracking-tight truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </Link>

        <MenuSection title="📊 KPI & Đánh giá" items={kpiEmployeeItems} />
        {isManager && <MenuSection title="👔 Quản lý KPI" items={kpiManagerItems} />}
        <MenuSection title="Quản lý" items={managementItems} />
        <MenuSection title="Cài đặt" items={settingsItems} />

        <button
          onClick={() => { logout(); router.push('/login') }}
          className="w-full py-3 text-red-600 font-semibold text-sm bg-white rounded-2xl shadow-[var(--shadow-card)] hover:bg-red-50 active:bg-red-100 transition-colors flex items-center justify-center gap-2">
          <LogOut size={18} />
          Đăng xuất
        </button>
      </div>
    </AppShell>
  )
}
