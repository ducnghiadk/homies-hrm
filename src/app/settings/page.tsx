'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { SetupWizardBanner } from '@/components/settings/SetupWizardBanner'
import { SettingCategoryTabs } from '@/components/settings/SettingCategoryTabs'
import { SettingSearch } from '@/components/settings/SettingSearch'
import { SettingCard } from '@/components/settings/SettingCard'
import {
  settingItems,
  settingCategories,
  getSettingsByCategory,
} from '@/lib/mock-data/settings'
import type { SettingItem, SettingCategoryId } from '@/lib/types/settings'

export default function SettingsPage() {
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const router = useRouter()
  const [selectedCategory, setSelectedCategory] = useState<SettingCategoryId | 'all'>('all')
  const [searchResults, setSearchResults] = useState<SettingItem[] | null>(null)

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login?redirect=/settings')
  }, [hasHydrated, isAuthenticated, router])

  if (!hasHydrated) {
    return (
      <AppShell title="Cài đặt">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  if (!user || !isAuthenticated) return null

  const displayItems = searchResults
    ? searchResults
    : selectedCategory === 'all'
      ? settingItems
      : getSettingsByCategory(selectedCategory)

  const groupedItems = selectedCategory === 'all' && !searchResults
    ? settingCategories.map(cat => ({
        ...cat,
        items: getSettingsByCategory(cat.id),
      }))
    : null

  return (
    <AppShell title="Tổng quan Cài đặt">
      <div className="space-y-5 pb-24">
        {/* Setup Wizard */}
        <SetupWizardBanner />

        {/* Search */}
        <SettingSearch onSearch={setSearchResults} />

        {/* Category Tabs */}
        {!searchResults && (
          <SettingCategoryTabs
            selected={selectedCategory}
            onSelect={setSelectedCategory}
          />
        )}

        {/* Search Results */}
        {searchResults && (
          <div className="animate-fade-in">
            <p className="text-xs mb-3" style={{ color: 'var(--text-muted, #9ca3af)' }}>
              🔍 Tìm thấy <strong style={{ color: 'var(--text-secondary, #6b7280)' }}>{searchResults.length}</strong> kết quả
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {searchResults.map(item => (
                <SettingCard key={item.id} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Grouped View (All categories) */}
        {groupedItems && !searchResults && (
          <div className="space-y-6 animate-slide-up">
            {groupedItems.map(category => (
              <div key={category.id}>
                <h2 className="text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-2 px-1"
                  style={{ color: 'var(--text-muted, #9ca3af)' }}>
                  <span>{category.icon}</span>
                  <span>{category.label}</span>
                  <span className="font-normal">— {category.description}</span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {category.items.map(item => (
                    <SettingCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filtered View (Single category) */}
        {!groupedItems && !searchResults && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-slide-up">
            {displayItems.map(item => (
              <SettingCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {displayItems.length === 0 && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm" style={{ color: 'var(--text-muted, #9ca3af)' }}>Không tìm thấy cài đặt phù hợp</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
