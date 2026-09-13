'use client'

import type { SettingCategoryId } from '@/lib/types/settings'
import { settingCategories } from '@/lib/mock-data/settings'

interface Props {
  selected: SettingCategoryId | 'all'
  onSelect: (category: SettingCategoryId | 'all') => void
}

export function SettingCategoryTabs({ selected, onSelect }: Props) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onSelect('all')}
        className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
          selected === 'all'
            ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
            : 'bg-white text-dark-700 border border-gray-100 hover:bg-primary-50 hover:text-primary-600'
        }`}
      >
        Tất cả
      </button>

      {settingCategories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
            selected === cat.id
              ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
              : 'bg-white text-dark-700 border border-gray-100 hover:bg-primary-50 hover:text-primary-600'
          }`}
        >
          <span>{cat.icon}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  )
}
