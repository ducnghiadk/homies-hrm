'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, getRoleLabel, getRoleColor } from '@/store/auth-store'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LogOut, ChevronDown, Menu } from 'lucide-react'
import Link from 'next/link'
import MobileBottomSheet from '@/components/ui/MobileBottomSheet'
import Image from 'next/image'
import NotificationBell from '@/components/notifications/NotificationBell'
import DataSourceStatusBadge from '@/components/ui/DataSourceStatusBadge'
import {
  deleteNotification,
  getNotificationsForUser,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  subscribeNotifications,
  type Notification,
} from '@/lib/notifications/notification-center'

export default function Header() {
  const router = useRouter()
  const { user, logout } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!user) return

    const syncNotifications = () => {
      setNotifications(getNotificationsForUser(user.id))
      setUnreadCount(getUnreadCount(user.id))
    }

    syncNotifications()
    return subscribeNotifications(syncNotifications)
  }, [user])

  if (!user) return null

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const showMobileMenuBtn = user && user.role !== 'employee' && user.role !== 'shift_leader'
  const isLargeLayout = user.role === 'ceo' || user.role === 'hr_admin'
  const headerMaxWidthClass = isLargeLayout ? 'w-full' : 'max-w-[1440px]'

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md shadow-sm">
        <div className={`mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8 xl:px-10 ${headerMaxWidthClass}`}>
          
          <div className="flex items-center gap-1.5">
            {/* Hamburger Mobile Menu Toggle */}
            {showMobileMenuBtn && (
              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))
                  }
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-vanilla-50 text-gray-500 hover:bg-primary-50 hover:text-gray-800 active:scale-95 transition-all lg:hidden mr-1 border border-gray-100"
              >
                <Menu size={20} />
              </button>
            )}

            {/* Logo & Brand */}
            <Link href="/" className="flex items-center gap-2.5 no-underline group">
              <Image
                src="/logo.png"
                alt="Homies Milk Tea Logo"
                width={120}
                height={40}
                className="h-10 w-auto object-contain group-hover:scale-105 transition-transform duration-200"
                priority
              />
              <div className="hidden xs:block border-l border-gray-200 pl-2.5">
                <span className="text-[10px] font-bold bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg border border-primary-100/30 tracking-wider">
                  HRM
                </span>
              </div>
            </Link>
          </div>

          {/* User Profile Navigation Bar & Switcher */}
          <div className="flex items-center gap-3 sm:gap-4">
            <DataSourceStatusBadge />

            <NotificationBell
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={(id) => {
                markAsRead(id)
              }}
              onMarkAllAsRead={() => {
                markAllAsRead(user.id)
              }}
              onDelete={(id) => {
                deleteNotification(id)
              }}
            />
            
            {/* Desktop Account Profile Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-vanilla-50/50 p-1.5 pr-3 hover:bg-vanilla-50 active:bg-primary-50 transition-all text-left outline-none group"
              >
                <Avatar name={user.full_name} size="sm" className="w-8 h-8 text-[12px] bg-primary-600" />
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-dark-700 leading-tight group-hover:text-primary-600 transition-colors">
                    {user.full_name}
                  </p>
                  <span className="text-[10px] text-gray-400 font-semibold capitalize">
                    {getRoleLabel(user.role)}
                  </span>
                </div>
                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Desktop Dropdown Card */}
              {dropdownOpen && (
                <div 
                  className="absolute right-0 mt-2 w-76 rounded-2xl border border-gray-100 bg-white p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150"
                  style={{ boxShadow: '0 10px 30px -5px rgba(0,0,0,0.1), 0 8px 20px -6px rgba(0,0,0,0.05)' }}
                >
                  {/* Current Active Account Header */}
                  <div className="flex items-center gap-3 p-3 border-b border-gray-50 bg-primary-50/20 rounded-xl mb-2">
                    <Avatar name={user.full_name} size="md" className="w-10 h-10 bg-primary-600" />
                    <div>
                      <p className="text-xs font-bold text-dark-700">{user.full_name}</p>
                      <p className="text-[10px] text-gray-400 font-semibold mb-1">{user.email}</p>
                      <Badge className={`text-[9px] px-2 py-0.5 ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                  </div>

                  <div className="px-1 pt-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl text-xs font-bold text-error-600 hover:bg-error-50 active:bg-error-100 transition-all border border-transparent hover:border-error-100"
                    >
                      <LogOut size={14} />
                      Đăng xuất tài khoản
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Account Switcher Trigger (Tap Avatar opens BottomSheet) */}
            <button
              onClick={() => setBottomSheetOpen(true)}
              className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full border border-gray-100 overflow-hidden outline-none hover:scale-105 active:scale-95 transition-transform"
            >
              <Avatar name={user.full_name} size="sm" className="w-8 h-8 bg-primary-600 text-[12px]" />
            </button>
            
          </div>
        </div>
      </header>

      {/* Mobile Account Switcher Bottom Sheet */}
      <MobileBottomSheet
        isOpen={bottomSheetOpen}
        onClose={() => setBottomSheetOpen(false)}
        title="Quản lý tài khoản"
        snapPoints={[0.65, 0.95]}
      >
        <div className="space-y-6 pt-2 font-['Inter']">
          {/* Current user card */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-gradient-to-r from-primary-50 to-primary-100/50 border border-primary-100">
            <Avatar name={user.full_name} size="md" className="w-12 h-12 bg-primary-600 text-sm" />
            <div>
              <p className="text-sm font-bold text-dark-800">{user.full_name}</p>
              <p className="text-xs text-gray-400 font-medium mb-1.5">{user.email}</p>
              <Badge className={`text-[10px] px-2.5 py-0.5 ${getRoleColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </Badge>
            </div>
          </div>

          {/* Sign Out Button */}
          <div className="border-t border-gray-100 pt-5">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-error-600 bg-error-50 hover:bg-error-100/70 border border-error-100 transition-all shadow-sm shadow-red-500/5"
            >
              <LogOut size={16} />
              Đăng xuất khỏi hệ thống
            </button>
          </div>
        </div>
      </MobileBottomSheet>
    </>
  )
}
