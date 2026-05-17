'use client';

import type { SettingCategoryId } from '@/lib/types/settings';
import { settingCategories } from '@/lib/mock-data/settings';

interface Props {
  selected: SettingCategoryId | 'all';
  onSelect: (category: SettingCategoryId | 'all') => void;
}

export function SettingCategoryTabs({ selected, onSelect }: Props) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
      <button
        onClick={() => onSelect('all')}
        className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
        style={{
          background: selected === 'all' ? '#7c3aed' : 'var(--gray-100, #f3f4f6)',
          color: selected === 'all' ? '#fff' : 'var(--text-secondary, #6b7280)',
        }}
      >
        Tất cả
      </button>

      {settingCategories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelect(cat.id)}
          className="px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5"
          style={{
            background: selected === cat.id ? '#7c3aed' : 'var(--gray-100, #f3f4f6)',
            color: selected === cat.id ? '#fff' : 'var(--text-secondary, #6b7280)',
          }}
        >
          <span>{cat.icon}</span>
          <span>{cat.label}</span>
        </button>
      ))}
    </div>
  );
}
