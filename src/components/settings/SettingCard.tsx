'use client';

import Link from 'next/link';
import type { SettingItem } from '@/lib/types/settings';

interface SettingCardProps {
  item: SettingItem;
}

const statusConfig = {
  not_started: { icon: '⚠️', bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
  in_progress: { icon: '🔄', bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  completed:   { icon: '✅', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
} as const;

export function SettingCard({ item }: SettingCardProps) {
  const st = statusConfig[item.status];

  return (
    <Link
      href={item.href}
      className="block rounded-xl border p-4 transition-all group"
      style={{
        background: '#fff',
        borderColor: '#f3f4f6',
        '--hover-border': '#e9d5ff',
      } as React.CSSProperties}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#d8b4fe'; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(147,51,234,0.08)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#f3f4f6'; (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`w-10 h-10 ${item.iconBg} rounded-xl flex items-center justify-center text-xl flex-shrink-0`}>
          {item.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm" style={{ color: 'var(--text-primary, #111)' }}>
            {item.title}
          </h3>
          <p className="text-xs mt-0.5 truncate" style={{ color: '#9ca3af' }}>
            {item.description}
          </p>

          {/* Status badge */}
          <div className="mt-2 flex items-center gap-1.5">
            <span className="text-xs">{st.icon}</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: st.bg, color: st.color }}
            >
              {item.statusText}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <span className="text-sm flex-shrink-0 mt-1 transition-colors" style={{ color: '#d1d5db' }}>→</span>
      </div>

      {/* Quick Actions */}
      {item.quickActions && item.quickActions.length > 0 && (
        <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: '1px solid #f3f4f6' }}>
          {item.quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="text-xs px-2.5 py-1 rounded-full font-medium"
              style={{
                background: action.value ? '#dcfce7' : '#f3f4f6',
                color: action.value ? '#15803d' : '#9ca3af',
              }}
            >
              {action.value ? '✓' : '○'} {action.label}
            </button>
          ))}
        </div>
      )}
    </Link>
  );
}
