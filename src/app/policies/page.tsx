'use client'

import AppShell from '@/components/layout/AppShell'
import { mockPolicies } from '@/lib/mock-data-communication'
import { BookOpen, CheckCircle, XCircle, Eye, Download, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const catColors: Record<string, string> = { hr: '#2F6FA8', operations: '#1E9E57', safety: '#D9381E', benefits: '#001D3D' }

export default function PoliciesPage() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <AppShell title="Quy chế & Nội quy">
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-in">
          {['Tất cả', 'HR', 'Vận hành', 'An toàn', 'Phúc lợi'].map(c => (
            <button key={c} className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}>{c}</button>
          ))}
        </div>

        {mockPolicies.map(p => {
          const color = catColors[p.category] || '#6b7280'
          return (
            <div key={p.id} className="card animate-slide-up">
              <button className="w-full text-left" onClick={() => setExpanded(expanded === p.id ? null : p.id)}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + '20' }}>
                    <BookOpen size={18} style={{ color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{p.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: color + '20', color }}>{p.category}</span>
                      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>v{p.version} • {p.effective_date}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {p.is_read ? (
                        <span className="text-[9px] flex items-center gap-0.5 text-emerald-500"><CheckCircle size={8} /> Đã đọc</span>
                      ) : (
                        <span className="text-[9px] flex items-center gap-0.5 text-warning-500"><XCircle size={8} /> Chưa đọc</span>
                      )}
                      <span className="text-[9px] flex items-center gap-0.5" style={{ color: 'var(--text-muted)' }}>
                        <Eye size={8} /> {p.read_count}/{p.total_employees}
                      </span>
                    </div>
                  </div>
                  {expanded === p.id ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                </div>
              </button>
              {expanded === p.id && (
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--gray-100)' }}>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{p.summary}</p>
                  <div className="flex gap-2 mt-3">
                    <button className="btn flex-1 text-xs gap-1" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
                      <Eye size={12} /> Đọc chi tiết
                    </button>
                    <button className="btn flex-1 text-xs gap-1" style={{ background: 'var(--gray-100)', color: 'var(--text-primary)' }}>
                      <Download size={12} /> Tải PDF
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
