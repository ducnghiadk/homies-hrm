'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockIncidents, incidentCategories } from '@/lib/mock-data-tasks'
import type { IncidentSeverity, IncidentStatus } from '@/lib/mock-data-tasks'
import { AlertTriangle, Plus, Filter, FileText, User, CheckCircle2 } from 'lucide-react'

const severityConfig: Record<IncidentSeverity, { label: string; color: string }> = {
  low: { label: 'Thấp', color: '#10b981' },
  medium: { label: 'Trung bình', color: '#f59e0b' },
  high: { label: 'Cao', color: '#f97316' },
  critical: { label: 'Nghiêm trọng', color: '#ef4444' },
}

const statusConfig: Record<IncidentStatus, { label: string; color: string }> = {
  open: { label: 'Mở', color: '#ef4444' },
  in_progress: { label: 'Đang xử lý', color: '#f59e0b' },
  resolved: { label: 'Đã xử lý', color: '#10b981' },
  closed: { label: 'Đã đóng', color: '#9ca3af' },
}

export default function IncidentReportPage() {
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [showForm, setShowForm] = useState(false)

  const filtered = filterStatus === 'all'
    ? mockIncidents
    : mockIncidents.filter(i => i.status === filterStatus)

  return (
    <AppShell title="Báo cáo sự cố">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {mockIncidents.filter(i => i.status === 'open' || i.status === 'in_progress').length} sự cố đang mở
            </span>
          </div>
          <button onClick={() => setShowForm(!showForm)} className="btn btn-primary text-xs gap-1 px-3 py-2">
            <Plus size={14} /> Báo mới
          </button>
        </div>

        {/* Quick Form */}
        {showForm && (
          <div className="card space-y-3 animate-slide-up" style={{ border: '2px solid var(--primary-100)' }}>
            <h3 className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}><FileText size={14} /> Báo cáo sự cố mới</h3>
            <input placeholder="Tiêu đề sự cố..." className="w-full p-3 rounded-xl text-sm"
              style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', color: 'var(--text-primary)' }} />
            <div className="flex gap-2">
              <select className="flex-1 p-3 rounded-xl text-sm" style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', color: 'var(--text-primary)' }}>
                {incidentCategories.map(c => <option key={c}>{c}</option>)}
              </select>
              <select className="flex-1 p-3 rounded-xl text-sm" style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', color: 'var(--text-primary)' }}>
                {Object.entries(severityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <textarea rows={3} placeholder="Mô tả chi tiết..." className="w-full p-3 rounded-xl text-sm resize-none"
              style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', color: 'var(--text-primary)' }} />
            <button className="btn btn-primary w-full text-sm">Gửi báo cáo</button>
          </div>
        )}

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-in">
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                background: filterStatus === s ? 'var(--primary)' : 'var(--gray-100)',
                color: filterStatus === s ? '#fff' : 'var(--text-secondary)',
              }}>
              {s === 'all' ? 'Tất cả' : statusConfig[s as IncidentStatus].label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="space-y-2 animate-slide-up">
          {filtered.map(inc => {
            const sev = severityConfig[inc.severity]
            const stat = statusConfig[inc.status]
            return (
              <div key={inc.id} className="card">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: sev.color + '20' }}>
                    <AlertTriangle size={18} style={{ color: sev.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{inc.title}</span>
                    </div>
                    <div className="flex gap-1.5 mt-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: sev.color + '20', color: sev.color }}>
                        {sev.label}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: stat.color + '20', color: stat.color }}>
                        {stat.label}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: 'var(--gray-100)', color: 'var(--text-muted)' }}>
                        {inc.category}
                      </span>
                    </div>
                    <p className="text-xs mt-1.5 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>{inc.description}</p>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                      <User size={10} className="inline" /> {inc.reporter_name} • {new Date(inc.created_at).toLocaleDateString('vi')}
                      {inc.resolution && <span className="text-emerald-500"> • <CheckCircle2 size={10} className="inline" /> {inc.resolution}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
