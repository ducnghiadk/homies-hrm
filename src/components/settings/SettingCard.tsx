'use client'

import Link from 'next/link'
import type { SettingItem } from '@/lib/types/settings'

interface SettingCardProps {
  item: SettingItem
}

const statusConfig = {
  not_started: { icon: '⚠️', bg: '#FFF8E8', color: '#D97706', border: '#FCECC6' },
  in_progress: { icon: '🔄', bg: '#E6F0FA', color: '#2F6FA8', border: '#C2DBF2' },
  completed:   { icon: '✅', bg: '#DDF4EC', color: '#107C41', border: '#8EDEA9' },
} as const

export function SettingCard({ item }: SettingCardProps) {
  const st = statusConfig[item.status]

  return (
    <div 
      className={`rounded-2xl border bg-white p-4.5 shadow-sm transition-all hover:shadow-md ${
        item.isRequired ? 'border-l-4 border-l-primary-600 border-gray-100' : 'border-gray-100'
      }`}
    >
      <Link href={item.href} className="flex items-start gap-3.5 group">
        {/* Icon */}
        <div className={`w-11 h-11 ${item.iconBg} rounded-xl flex items-center justify-center text-xl flex-shrink-0 shadow-sm`}>
          {item.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm text-dark-700 group-hover:text-primary-600 transition-colors">
            {item.title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            {item.description}
          </p>

          {/* Status badge */}
          <div className="mt-2.5 flex items-center gap-1.5">
            <span className="text-xs">{st.icon}</span>
            <span
              className="text-[11px] font-bold px-2.5 py-0.5 rounded-full border"
              style={{ background: st.bg, color: st.color, borderColor: st.border }}
            >
              {item.statusText}
            </span>
          </div>
        </div>

        {/* Arrow */}
        <span className="text-sm flex-shrink-0 mt-1 text-gray-300 group-hover:text-primary-600 transition-colors">→</span>
      </Link>

      {/* Sub Items */}
      {item.subItems && item.subItems.length > 0 && (
        <div className="mt-3 pt-3 space-y-1 border-t border-gray-100">
          {item.subItems.map((sub, idx) => (
            <Link
              key={idx}
              href={sub.href}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-gray-600 hover:bg-primary-50 hover:text-primary-600 transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
              <span>{sub.title}</span>
              <span className="ml-auto text-gray-400">→</span>
            </Link>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {item.quickActions && item.quickActions.length > 0 && (
        <div className="mt-3 pt-3 flex items-center gap-2 border-t border-gray-100">
          {item.quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
              className="text-[11px] px-3 py-1 rounded-full font-bold transition-all"
              style={{
                background: action.value ? '#DDF4EC' : '#F3F4F6',
                color: action.value ? '#107C41' : '#6B7280',
              }}
            >
              {action.value ? '✓' : '○'} {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
