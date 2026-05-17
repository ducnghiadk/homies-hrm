'use client';

import { useState } from 'react';
import { searchSettings } from '@/lib/mock-data/settings';
import type { SettingItem } from '@/lib/types/settings';

interface Props {
  onSearch: (results: SettingItem[] | null) => void;
}

export function SettingSearch({ onSearch }: Props) {
  const [query, setQuery] = useState('');

  const handleChange = (value: string) => {
    setQuery(value);
    onSearch(value.trim() ? searchSettings(value) : null);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Tìm cài đặt..."
        className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm"
        style={{
          background: 'var(--gray-50, #f9fafb)',
          border: '1px solid var(--gray-200, #e5e7eb)',
          outline: 'none',
          color: 'var(--text-primary, #111)',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = '#a78bfa'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(167,139,250,0.15)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.boxShadow = 'none'; }}
      />
      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#9ca3af' }}>🔍</span>
      {query && (
        <button
          onClick={() => handleChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-sm"
          style={{ color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
