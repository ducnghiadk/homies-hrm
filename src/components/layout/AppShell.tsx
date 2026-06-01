'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import { getDesktopSidebarEntries } from '@/lib/navigation/sidebar-config'
import { OnboardingPolicyService } from '@/lib/services/onboarding-policy-service'
import { useAuthStore } from '@/store/auth-store'
import BottomNav from './BottomNav'
import Header from './Header'

type AppShellProps = {
  children: React.ReactNode
  title?: string
  showNav?: boolean
  className?: string
  backHref?: string
  navMode?: 'full' | 'compact' | 'none'
}

export default function AppShell({
  children,
  showNav = true,
  className = '',
  backHref,
  navMode,
}: AppShellProps) {
  const { isAuthenticated, user } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 0)
    return () => window.clearTimeout(timer)
  }, [])

  const pathname = usePathname()
  const sidebarEntries = useMemo(() => getDesktopSidebarEntries(user?.role), [user?.role])
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({})
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  const showManagerSidebar = Boolean(
    isAuthenticated &&
    user &&
    sidebarEntries.length > 0
  )
  const resolvedNavMode = navMode ?? (showManagerSidebar ? 'full' : 'none')
  const showDesktopSidebar = resolvedNavMode === 'full' && showManagerSidebar
  const showMobileManagerSidebar = resolvedNavMode === 'full' && showManagerSidebar

  const activeHref = useMemo(() => {
    const matches = sidebarEntries.flatMap(entry => {
      const hrefs = entry.items?.map(item => item.href) || (entry.href ? [entry.href] : [])
      return hrefs.filter(href => {
        if (href === '/') return pathname === '/'
        return pathname === href || pathname.startsWith(`${href}/`)
      })
    })

    return matches.sort((left, right) => right.length - left.length)[0] || null
  }, [pathname, sidebarEntries])

  const defaultOpenGroups = useMemo(
    () => Object.fromEntries(
      sidebarEntries
        .filter(entry => entry.items?.length)
        .map(entry => [entry.id, entry.items?.some(item => item.href === activeHref) ?? false])
    ),
    [activeHref, sidebarEntries]
  )

  // Listen to mobile menu button toggle event
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handleToggle = () => setIsMobileSidebarOpen(prev => !prev)
    window.addEventListener('toggle-mobile-sidebar', handleToggle)
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(min-width: 1024px)')
    const syncSidebarState = (event: MediaQueryList | MediaQueryListEvent) => {
      if (event.matches) {
        setIsMobileSidebarOpen(false)
      }
    }

    syncSidebarState(mediaQuery)
    mediaQuery.addEventListener('change', syncSidebarState)
    return () => mediaQuery.removeEventListener('change', syncSidebarState)
  }, [])

  useEffect(() => {
    if (!mounted || !user) return
    if (!['ceo', 'hr_admin', 'store_manager'].includes(user.role)) return
    OnboardingPolicyService.syncDueAutomation(user)
  }, [mounted, user])

  if (!mounted) return null

  const isLargeLayout = user?.role === 'ceo' || user?.role === 'hr_admin'
  const maxWidthClass = isLargeLayout ? 'max-w-[1680px]' : 'max-w-[1200px]'
  const shellPaddingClass = showNav
    ? isLargeLayout
      ? 'pb-[calc(80px+env(safe-area-inset-bottom))] lg:pb-0'
      : showDesktopSidebar
        ? 'pb-[calc(80px+env(safe-area-inset-bottom))] lg:pb-8'
        : 'pb-[calc(80px+env(safe-area-inset-bottom))]'
    : 'pb-0'
  const sidebarWidthClass = isLargeLayout ? 'lg:w-[304px]' : 'lg:w-[280px]'
  const layoutGapClass = isLargeLayout ? 'lg:gap-8' : 'lg:gap-6'

  const renderNav = () => (
    <nav className="space-y-1.5">
      {sidebarEntries.map(entry => {
        const Icon = entry.icon

        if (!entry.items?.length && entry.href) {
          const isActive = entry.href === activeHref

          return (
            <Link
              key={entry.id}
              href={entry.href}
              onClick={() => setIsMobileSidebarOpen(false)}
              className={`flex items-start gap-3 rounded-2xl px-3 py-3 no-underline transition-colors ${
                isActive ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className={`mt-0.5 rounded-xl p-2 ${isActive ? 'bg-white text-primary-600' : 'bg-gray-100 text-gray-500'}`}>
                <Icon size={16} />
              </span>
              <span className="block text-sm font-bold">{entry.label}</span>
            </Link>
          )
        }

        const isOpen = openGroups[entry.id] ?? defaultOpenGroups[entry.id] ?? false
        const hasActiveChild = entry.items?.some(item => item.href === activeHref) ?? false

        return (
          <div key={entry.id} className="rounded-2xl border border-gray-100 bg-gray-50/60 p-1.5">
            <button
              type="button"
              onClick={() => setOpenGroups(prev => ({ ...prev, [entry.id]: !isOpen }))}
              className={`flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${
                hasActiveChild ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-700 hover:bg-white'
              }`}
            >
              <span className={`mt-0.5 rounded-xl p-2 ${hasActiveChild ? 'bg-primary-50 text-primary-600' : 'bg-white text-gray-500'}`}>
                <Icon size={16} />
              </span>
              <span className="min-w-0 flex-1 text-sm font-bold">{entry.label}</span>
              <ChevronDown size={16} className={`mt-1 shrink-0 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
              <div className="space-y-1 px-3 pb-2 pl-12">
                {entry.items?.map(item => {
                  const isActive = item.href === activeHref

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`block rounded-xl px-3 py-2 text-sm no-underline transition-colors ${
                        isActive ? 'bg-primary-50 font-semibold text-primary-700' : 'text-gray-600 hover:bg-white hover:text-gray-800'
                      }`}
                    >
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </nav>
  )

  return (
    <div className={`min-h-screen bg-bg-page font-['Inter'] text-dark-700 ${shellPaddingClass}`}>
      <div className="z-50 h-[env(safe-area-inset-top,0px)] w-full bg-bg-subtle" />

      {isAuthenticated && <Header />}

      {/* Mobile Drawer Left Sidebar */}
      {showMobileManagerSidebar && isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Background Overlay */}
          <div 
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200" 
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          {/* Sidebar Drawer */}
          <aside className="fixed bottom-0 top-0 left-0 z-50 w-[280px] bg-white p-4 shadow-2xl overflow-y-auto animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600 font-['Poppins']">Điều Hướng Quản Lý</span>
              <button 
                onClick={() => setIsMobileSidebarOpen(false)}
                className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>
            {renderNav()}
          </aside>
        </div>
      )}

      <main className={`mx-auto px-4 pt-6 md:px-6 md:pt-8 lg:px-8 xl:px-10 ${maxWidthClass} ${className}`}>
        <div className={showDesktopSidebar ? `app-shell-desktop-frame lg:items-start ${layoutGapClass}` : ''}>
          {showDesktopSidebar && (
            <aside className={`app-shell-desktop-sidebar hidden lg:block ${sidebarWidthClass}`}>
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto rounded-3xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="mb-4">
                  <div className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Điều hướng</div>
                  <p className="mt-1 text-sm text-gray-500">Gom theo nhóm chính và trang con để quản lý toàn bộ web dễ hơn.</p>
                </div>
                {renderNav()}
              </div>
            </aside>
          )}

          <div className="app-shell-desktop-content min-w-0">
            {backHref && (
              <Link
                href={backHref}
                className="mb-3 inline-flex items-center gap-1 text-sm no-underline"
                style={{ color: 'var(--primary)' }}
              >
                <ChevronLeft size={16} /> Quay lại
              </Link>
            )}
            {children}
          </div>
        </div>
      </main>

      {showNav && (
        <div className={showDesktopSidebar || isLargeLayout ? 'lg:hidden' : ''}>
          <BottomNav />
        </div>
      )}
    </div>
  )
}
