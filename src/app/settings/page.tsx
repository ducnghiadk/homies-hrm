'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChevronRight, Search } from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import AppShell from '@/components/layout/AppShell'
import { SetupChecklist } from '@/components/settings/SetupChecklist'
import { countAdvanced, getHubGroups } from '@/lib/settings/settings-hub'

/** Một trang Cài đặt duy nhất: việc cần cài đặt ở trên, các nhóm cài đặt bên dưới. */
export default function SettingsPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login?redirect=/settings')
  }, [hasHydrated, isAuthenticated, router])

  if (!hasHydrated) {
    return (
      <AppShell title="Cài đặt">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (!user || !isAuthenticated) return null

  const role = user.role
  const isAdmin = role === 'ceo' || role === 'hr_admin'
  const groups = getHubGroups(role, showAdvanced, query)
  const advancedCount = countAdvanced(role)

  return (
    <AppShell title="Cài đặt">
      <div className="mx-auto max-w-3xl space-y-4 pb-24">
        {isAdmin && <SetupChecklist />}

        <label className="flex items-center gap-2 rounded-2xl border border-gray-200/80 bg-white px-4 py-3 shadow-xs">
          <Search size={18} className="text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm cài đặt, ví dụ: ngày lễ, Wi-Fi, ca làm"
            className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
          />
        </label>

        {groups.map((group) => (
          <section key={group.id} className="rounded-2xl border border-gray-200/80 bg-white shadow-xs">
            <h2 className="px-5 pt-4 text-sm font-semibold text-[#001D3D]">{group.title}</h2>
            <ul className="mt-1 divide-y divide-gray-100">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="flex items-center gap-3 px-5 py-3 hover:bg-[#FFF8E8]/60">
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-gray-800">{item.title}</span>
                      <span className="block text-xs text-gray-500">{item.description}</span>
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-gray-400" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

        {groups.length === 0 && (
          <p className="py-10 text-center text-sm text-gray-500">Không tìm thấy cài đặt phù hợp.</p>
        )}

        {!query && advancedCount > 0 && (
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full rounded-2xl border border-dashed border-gray-300 bg-white/60 py-3 text-sm font-medium text-gray-600 hover:text-[#2F6FA8]"
          >
            {showAdvanced ? 'Ẩn cài đặt nâng cao' : `Hiện cài đặt nâng cao (${advancedCount})`}
          </button>
        )}
      </div>
    </AppShell>
  )
}
