'use client'

import { useAuthStore } from '@/store/auth-store'
import BottomNav from './BottomNav'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

type AppShellProps = {
  children: React.ReactNode
  title?: string
  showNav?: boolean
  className?: string
  backHref?: string
}

export default function AppShell({ children, title, showNav = true, className = '', backHref }: AppShellProps) {
  const { user } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-bg-page text-dark-700 pb-[calc(80px+env(safe-area-inset-bottom))] font-['Inter']">
      {/* Status Bar Spacer (Mobile) */}
      <div className="h-[env(safe-area-inset-top,0px)] bg-bg-subtle w-full fixed top-0 z-50"></div>

      {/* Main Content Area */}
      {/* So Matcha: Padding top 48px, horizontal 16px (mobile) -> 32px (desktop) */}
      <main className={`mx-auto max-w-[1200px] px-4 md:px-6 lg:px-8 pt-12 ${className}`}>
        {backHref && (
          <Link href={backHref} className="inline-flex items-center gap-1 text-sm no-underline mb-3"
            style={{ color: 'var(--primary)' }}>
            <ChevronLeft size={16} /> Quay lại
          </Link>
        )}
        {children}
      </main>

      {/* Bottom Navigation */}
      {showNav && <BottomNav />}
    </div>
  )
}
