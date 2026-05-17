'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  Home, Calendar, Users, User,
  BarChart3, Settings, MoreHorizontal,
  CalendarOff, Wallet,
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  icon: React.ElementType
  label: string
  badge?: number
}

function getNavItems(role: string, badges?: { pendingLeaves?: number }): NavItem[] {
  // Employee & Shift Leader
  if (['employee', 'shift_leader'].includes(role)) {
    return [
      { href: '/', icon: Home, label: 'Trang chủ' },
      { href: '/schedule', icon: Calendar, label: 'Lịch làm' },
      { href: '/leave', icon: CalendarOff, label: 'Nghỉ phép' },
      { href: '/payroll', icon: Wallet, label: 'Lương' },
      { href: '/profile', icon: User, label: 'Tôi' },
    ]
  }

  // Store Manager & Area Manager
  if (['store_manager', 'area_manager'].includes(role)) {
    return [
      { href: '/', icon: Home, label: 'Trang chủ' },
      { href: '/employees', icon: Users, label: 'Nhân viên' },
      { href: '/schedule', icon: Calendar, label: 'Lịch' },
      { href: '/leave', icon: CalendarOff, label: 'Nghỉ phép', badge: badges?.pendingLeaves },
      { href: '/more', icon: MoreHorizontal, label: 'Thêm' },
    ]
  }

  // HR Admin & CEO
  return [
    { href: '/', icon: Home, label: 'Trang chủ' },
    { href: '/employees', icon: Users, label: 'Nhân viên' },
    { href: '/leave', icon: CalendarOff, label: 'Nghỉ phép', badge: badges?.pendingLeaves },
    { href: '/reports', icon: BarChart3, label: 'Báo cáo' },
    { href: '/settings', icon: Settings, label: 'Cài đặt' },
  ]
}

export default function BottomNav() {
  const pathname = usePathname()
  const { user } = useAuthStore()

  // TODO: Get real pending count from API/context
  const pendingLeaves = 4 // Mock

  const navItems = getNavItems(user?.role ?? 'employee', { pendingLeaves })

  // Check if current path matches nav item (including sub-paths)
  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="max-w-lg mx-auto px-2">
        <div className="flex items-center justify-around h-16">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full px-1 relative',
                  'transition-colors duration-150',
                  active
                    ? 'text-primary-600'
                    : 'text-gray-400 hover:text-gray-600',
                )}
              >
                {/* Active indicator — top line */}
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary-500 rounded-full" />
                )}

                <div className="relative">
                  <Icon
                    size={24}
                    strokeWidth={active ? 2.5 : 2}
                    className={cn(
                      'transition-transform duration-200',
                      active ? 'scale-110' : 'group-hover:scale-105',
                    )}
                  />

                  {/* Badge */}
                  {item.badge != null && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 animate-pulse">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>

                <span className={cn(
                  'text-[10px] mt-1 font-medium',
                  active && 'font-semibold',
                )}>
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
