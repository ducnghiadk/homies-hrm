'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Calendar, CalendarOff, Home, MoreHorizontal, Settings, User, Users, Wallet } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
  badge?: number
}

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const role = user?.role ?? 'employee'
  const isDesktopSidebarRole = role === 'store_manager' || role === 'area_manager' || role === 'hr_admin' || role === 'ceo'

  const navItems: NavItem[] = role === 'employee'
    ? [
        { href: '/', icon: Home, label: 'Trang chủ' },
        { href: '/schedules', icon: Calendar, label: 'Lịch làm' },
        { href: '/leave', icon: CalendarOff, label: 'Nghỉ phép' },
        { href: '/payroll', icon: Wallet, label: 'Lương' },
        { href: '/profile', icon: User, label: 'Tôi' },
      ]
    : role === 'shift_leader'
      ? [
          { href: '/', icon: Home, label: 'Trang chủ' },
          { href: '/employees', icon: Users, label: 'Nhân sự' },
          { href: '/schedules', icon: Calendar, label: 'Lịch làm' },
          { href: '/leave', icon: CalendarOff, label: 'Nghỉ phép' },
          { href: '/profile', icon: User, label: 'Tôi' },
        ]
      : role === 'store_manager' || role === 'area_manager'
        ? [
            { href: '/', icon: Home, label: 'Trang chủ' },
            { href: '/employees', icon: Users, label: 'Nhân sự' },
            { href: '/schedules', icon: Calendar, label: 'Xếp lịch' },
            { href: '/leave', icon: CalendarOff, label: 'Nghỉ phép' },
            { href: '/more', icon: MoreHorizontal, label: 'Thêm' },
          ]
        : [
            { href: '/', icon: Home, label: 'Trang chủ' },
            { href: '/employees', icon: Users, label: 'Nhân sự' },
            { href: '/leave', icon: CalendarOff, label: 'Nghỉ phép' },
            { href: '/reports', icon: BarChart3, label: 'Báo cáo' },
            { href: '/settings', icon: Settings, label: 'Cài đặt' },
          ]

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className={`fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.06)] safe-area-bottom ${isDesktopSidebarRole ? 'lg:hidden' : ''}`}>
      <div className="mx-auto max-w-lg px-2">
        <div className="flex h-16 items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'relative flex h-full flex-1 flex-col items-center justify-center px-1',
                  'transition-colors duration-150',
                  active ? 'text-primary-600' : 'text-gray-400 hover:text-gray-600',
                )}
              >
                {active ? <span className="absolute left-1/2 top-0 h-0.5 w-8 -translate-x-1/2 rounded-full bg-primary-500" /> : null}
                <div className="relative">
                  <Icon size={24} strokeWidth={active ? 2.5 : 2} />
                  {item.badge && item.badge > 0 ? (
                    <span className="absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  ) : null}
                </div>
                <span className={cn('mt-1 text-[10px] font-medium', active && 'font-semibold')}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
