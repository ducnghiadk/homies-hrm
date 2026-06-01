'use client'

import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { CONFIG_CATEGORIES, mockAuditLogs } from '@/lib/mock-data-p5'
import { ChevronRight, Clock, FileText, Download, Upload, Search } from 'lucide-react'

export default function AdminPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  const [view, setView] = useState<'categories'|'audit'>('categories')
  const [search, setSearch] = useState('')

  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const filtered = CONFIG_CATEGORIES.filter(c =>
    c.label.toLowerCase().includes(search.toLowerCase()) ||
    c.desc.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppShell title="Cấu hình hệ thống ⚙️">
      <div className="space-y-4">
        {/* Header Actions */}
        <div className="flex gap-2 animate-fade-in">
          <button className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: view === 'categories' ? 'var(--primary)' : 'var(--gray-100)', color: view === 'categories' ? 'white' : 'var(--text-secondary)' }}
            onClick={() => setView('categories')}>⚙️ Cấu hình</button>
          <button className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
            style={{ background: view === 'audit' ? 'var(--primary)' : 'var(--gray-100)', color: view === 'audit' ? 'white' : 'var(--text-secondary)' }}
            onClick={() => setView('audit')}>📋 Audit Log</button>
        </div>

        {view === 'categories' && (
          <div className="space-y-3 animate-slide-up">
            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
              <input className="input pl-9 text-sm" placeholder="Tìm cấu hình..."
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* Import/Export */}
            <div className="flex gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}>
                <Download size={14} /> Export JSON
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold"
                style={{ background: 'var(--gray-100)', color: 'var(--text-secondary)' }}>
                <Upload size={14} /> Import JSON
              </button>
            </div>

            {/* Category Grid */}
            <div className="space-y-2">
              {filtered.map(cat => (
                <div key={cat.key} className="card p-3 flex items-center gap-3" style={{ cursor: 'pointer' }}
                  onClick={() => alert(`Mở cấu hình: ${cat.label}`)}>
                  <div className="text-xl flex-shrink-0">{cat.label.split(' ')[0]}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold">{cat.label.slice(cat.label.indexOf(' ') + 1)}</div>
                    <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{cat.desc}</div>
                  </div>
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              ))}
            </div>

            {filtered.length === 0 && (
              <div className="card p-8 text-center">
                <Search size={24} className="mx-auto mb-2" style={{ color: 'var(--gray-300)' }} />
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Không tìm thấy</p>
              </div>
            )}
          </div>
        )}

        {view === 'audit' && (
          <div className="space-y-2 animate-slide-up">
            <div className="card p-3 text-center" style={{ background: 'var(--gray-50)' }}>
              <FileText size={16} className="mx-auto mb-1" style={{ color: 'var(--primary)' }} />
              <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>Tổng thay đổi</div>
              <div className="text-lg font-bold">{mockAuditLogs.length}</div>
            </div>
            {mockAuditLogs.map(log => {
              const actionColor = log.action === 'Xóa' ? 'var(--error)' : log.action === 'Thêm mới' ? 'var(--success)' : 'var(--primary)'
              return (
                <div key={log.id} className="card p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: `${actionColor}15`, color: actionColor }}>
                        {log.action}
                      </span>
                      <span className="text-xs font-semibold">{log.table}</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                      <Clock size={10} /> {log.time}
                    </div>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{log.detail}</div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>bởi {log.user}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
