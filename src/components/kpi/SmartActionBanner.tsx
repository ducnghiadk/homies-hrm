'use client'

import Link from 'next/link'
import type { SmartAction } from '@/lib/kpi-smart-actions'
import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface Props {
  actions: SmartAction[]
}

const COLOR_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  red:   { bg: '#fef2f2', text: '#991b1b', dot: '🔴' },
  amber: { bg: '#fffbeb', text: '#92400e', dot: '🟡' },
  green: { bg: '#f0fdf4', text: '#166534', dot: '🟢' },
  blue:  { bg: '#eff6ff', text: '#1e40af', dot: '🔵' },
}

export default function SmartActionBanner({ actions }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  if (!actions || actions.length === 0) return null

  // Single urgent → full-width banner
  if (actions.length === 1) {
    const a = actions[0]
    const c = COLOR_MAP[a.color] ?? COLOR_MAP.blue
    return (
      <Link href={a.action.href}
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-semibold no-underline transition-all animate-fade-in"
        style={{ background: c.bg, color: c.text }}>
        <span>{a.icon}</span>
        <span className="flex-1">{a.title} • {a.description}</span>
        <span className="font-bold">{a.action.label} →</span>
      </Link>
    )
  }

  // Multiple → collapsible list
  return (
    <div className="card overflow-hidden animate-fade-in">
      <button onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-xs font-bold"
        style={{ color: 'var(--text-primary)' }}>
        <span>🔔</span>
        <span className="flex-1 text-left">{actions.length} việc cần làm</span>
        {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>

      {!collapsed && (
        <div className="divide-y" style={{ borderColor: 'var(--gray-100)' }}>
          {actions.map(a => {
            const c = COLOR_MAP[a.color] ?? COLOR_MAP.blue
            return (
              <Link key={a.id} href={a.action.href}
                className="flex items-center gap-2 px-3 py-2 text-xs no-underline hover:bg-gray-50 transition-colors"
                style={{ color: c.text }}>
                <span>{c.dot}</span>
                <span className="flex-1 font-semibold">{a.title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: c.bg }}>{a.action.label}</span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
