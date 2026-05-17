'use client'

import Link from 'next/link'

interface QuickAction {
  icon: string
  label: string
  href: string
  badge?: number
  color: string
}

interface QuickActionsBarProps {
  actions: QuickAction[]
}

export default function QuickActionsBar({ actions }: QuickActionsBarProps) {
  if (!actions.length) return null

  return (
    <div className="animate-fade-in">
      <h3 className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
        ⚡ Hành động nhanh
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
        {actions.map(a => (
          <Link key={a.href} href={a.href} className="no-underline shrink-0">
            <div className="relative flex flex-col items-center gap-1 px-3 py-2.5 rounded-2xl transition-all active:scale-95"
              style={{ background: `${a.color}15`, minWidth: 72 }}>
              <span className="text-xl">{a.icon}</span>
              <span className="text-[10px] font-bold text-center" style={{ color: a.color }}>{a.label}</span>
              {a.badge !== undefined && a.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[8px] font-black text-white flex items-center justify-center"
                  style={{ background: '#ef4444' }}>
                  {a.badge}
                </span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
