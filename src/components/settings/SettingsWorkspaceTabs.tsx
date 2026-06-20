'use client'

import { settingsWorkspaceTabs } from '@/lib/mock-data/settings'
import type { SettingsWorkspaceTabId } from '@/lib/types/settings'

export function SettingsWorkspaceTabs({
  selected,
  onSelect,
}: {
  selected: SettingsWorkspaceTabId
  onSelect: (id: SettingsWorkspaceTabId) => void
}) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      {settingsWorkspaceTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
          className="rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all"
          style={{
            background: selected === tab.id ? '#111827' : 'var(--gray-100, #f3f4f6)',
            color: selected === tab.id ? '#fff' : 'var(--text-secondary, #6b7280)',
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}