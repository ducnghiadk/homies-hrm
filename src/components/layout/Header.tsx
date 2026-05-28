'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore, DEMO_ACCOUNTS, getRoleLabel, getRoleColor } from '@/store/auth-store'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { LogOut, ChevronDown, RefreshCw, Check, Sparkles, Menu } from 'lucide-react'
import Link from 'next/link'
import MobileBottomSheet from '@/components/ui/MobileBottomSheet'
import Image from 'next/image'
import NotificationBell from '@/components/notifications/NotificationBell'
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
  const { user, logout, loginAsDemo } = useAuthStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false)
  const [isSwitching, setIsSwitching] = useState(false)
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

  const handleSwitchAccount = async (email: string) => {
    setIsSwitching(true)
    setDropdownOpen(false)
    setBottomSheetOpen(false)

    // Smooth delay for premium user experience feel
    await new Promise((resolve) => setTimeout(resolve, 800))

    loginAsDemo(email)
    setIsSwitching(false)

    // Redirect to home/dashboard and refresh to reload states
    router.push('/')
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const showMobileMenuBtn = user && user.role !== 'employee' && user.role !== 'shift_leader'
  const isLargeLayout = user.role === 'ceo' || user.role === 'hr_admin'
  const headerMaxWidthClass = isLargeLayout ? 'max-w-[1680px]' : 'max-w-[1440px]'

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
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-800 active:scale-95 transition-all lg:hidden mr-1 border border-gray-100"
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
                <span className="text-[10px] font-extrabold bg-primary-50 text-primary-700 px-2 py-0.5 rounded-lg font-['Poppins'] border border-primary-100/30 tracking-wider">
                  HRM
                </span>
              </div>
            </Link>
          </div>

          {/* User Profile Navigation Bar & Switcher */}
          <div className="flex items-center gap-4">
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
                className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-gray-50/50 p-1.5 pr-3 hover:bg-gray-50 active:bg-gray-100 transition-all text-left outline-none group"
              >
                <Avatar name={user.full_name} size="sm" className="w-8 h-8 text-[12px] bg-primary-600" />
                <div className="hidden sm:block">
                  <p className="text-xs font-bold text-dark-700 font-['Poppins'] leading-tight group-hover:text-primary-600 transition-colors">
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
                      <p className="text-xs font-extrabold text-dark-700 font-['Poppins']">{user.full_name}</p>
                      <p className="text-[10px] text-gray-400 font-semibold mb-1">{user.email}</p>
                      <Badge className={`text-[9px] px-2 py-0.5 ${getRoleColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </Badge>
                    </div>
                  </div>

                  {/* Account Switcher Options */}
                  <div className="px-1.5 py-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2.5 mb-1.5 flex items-center gap-1">
                      <Sparkles size={10} className="text-warning-500" /> Chuyển tài khoản nhanh
                    </p>
                    
                    <div className="space-y-1 max-h-56 overflow-y-auto pr-0.5">
                      {DEMO_ACCOUNTS.map((acc) => {
                        const isActive = acc.email === user.email
                        return (
                          <button
                            key={acc.email}
                            disabled={isActive}
                            onClick={() => handleSwitchAccount(acc.email)}
                            className={`w-full text-left flex items-center justify-between p-2 rounded-xl text-xs transition-all ${
                              isActive 
                                ? 'bg-primary-50 text-primary-600 font-bold border border-primary-100/30' 
                                : 'hover:bg-vanilla-50 active:bg-vanilla-100 text-gray-600 font-medium'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{acc.icon}</span>
                              <div>
                                <p className="font-bold font-['Poppins'] leading-tight">{acc.name}</p>
                                <p className="text-[9px] text-gray-400 leading-none">{acc.position}</p>
                              </div>
                            </div>
                            {isActive ? (
                              <Check size={14} className="text-primary-500 stroke-[3]" />
                            ) : (
                              <ChevronDown size={12} className="text-gray-300 -rotate-90 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="border-t border-gray-50 mt-2 pt-2 px-1">
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

      {/* Switching overlay loader */}
      {isSwitching && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md text-white animate-fade-in">
          <div className="bg-white/10 p-6 rounded-[24px] border border-white/20 flex flex-col items-center shadow-2xl">
            <RefreshCw size={36} className="animate-spin text-primary-400 mb-4" />
            <p className="text-sm font-bold tracking-wide font-['Poppins']">Đang chuyển đổi quyền truy cập...</p>
            <p className="text-xs text-white/50 mt-1">Hệ thống đang đồng bộ cơ sở dữ liệu</p>
          </div>
        </div>
      )}

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
              <p className="text-sm font-extrabold text-dark-800 font-['Poppins']">{user.full_name}</p>
              <p className="text-xs text-gray-400 font-medium mb-1.5">{user.email}</p>
              <Badge className={`text-[10px] px-2.5 py-0.5 ${getRoleColor(user.role)}`}>
                {getRoleLabel(user.role)}
              </Badge>
            </div>
          </div>

          {/* Switcher list */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-3 flex items-center gap-1.5">
              <Sparkles size={12} className="text-warning-500" /> Chuyển tài khoản demo nhanh
            </p>
            
            <div className="space-y-2.5">
              {DEMO_ACCOUNTS.map((acc) => {
                const isActive = acc.email === user.email
                return (
                  <button
                    key={acc.email}
                    disabled={isActive}
                    onClick={() => handleSwitchAccount(acc.email)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all ${
                      isActive 
                        ? 'bg-primary-50 border border-primary-100 text-primary-700 font-bold' 
                        : 'bg-gray-50/50 hover:bg-gray-50 border border-gray-100/50 text-gray-600 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl bg-white w-8 h-8 rounded-xl shadow-sm flex items-center justify-center border border-gray-100">
                        {acc.icon}
                      </span>
                      <div>
                        <p className="text-xs font-extrabold text-dark-800 font-['Poppins']">{acc.name}</p>
                        <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{acc.position}</p>
                      </div>
                    </div>
                    {isActive ? (
                      <span className="w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-md shadow-primary-500/20">
                        <Check size={14} className="stroke-[3]" />
                      </span>
                    ) : (
                      <span className="text-[10px] text-primary-500 font-bold bg-white border border-primary-100 px-2.5 py-1 rounded-lg">Chuyển</span>
                    )}
                  </button>
                )
              })}
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
