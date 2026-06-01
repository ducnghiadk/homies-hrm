'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockAttRequests } from '@/lib/mock-data-attendance'
import { Clock, Edit2 } from 'lucide-react'

const typeMap: Record<string, { label: string; color: string; icon: typeof Edit2 }> = {
  check_in: { label: 'Sửa giờ vào', color: '#2F6FA8', icon: Edit2 },
  check_out: { label: 'Sửa giờ ra', color: '#001D3D', icon: Clock },
  both: { label: 'Sửa cả hai', color: '#F6C85F', icon: Edit2 },
}
const statusMap = {
  pending: { l: 'Chờ duyệt', c: '#F6C85F' },
  approved: { l: 'Đã duyệt', c: '#1E9E57' },
  rejected: { l: 'Từ chối', c: '#D9381E' },
}

export default function AttendanceRequestsPage() {
  const [filter, setFilter] = useState('all')
  const filtered = filter === 'all' ? mockAttRequests : mockAttRequests.filter(r => r.status === filter)

  return (
    <AppShell title="Yêu cầu chấm công">
      <div className="space-y-4">
        <div className="flex gap-2 animate-fade-in">
          {['all', 'pending', 'approved', 'rejected'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-full text-xs font-medium"
              style={{ background: filter === f ? 'var(--primary)' : 'var(--gray-100)', color: filter === f ? '#fff' : 'var(--text-secondary)' }}>
              {f === 'all' ? 'Tất cả' : statusMap[f as keyof typeof statusMap].l}
            </button>
          ))}
        </div>

        <div className="space-y-2 animate-slide-up">
          {filtered.map(r => {
            const type = typeMap[r.type] || typeMap.edit
            const stat = statusMap[r.status]
            const Icon = type.icon
            return (
              <div key={r.id} className="card flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: type.color + '20' }}>
                  <Icon size={18} style={{ color: type.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r.employee_name}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: stat.c + '20', color: stat.c }}>{stat.l}</span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>{type.label} • {r.date}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>💬 {r.reason}</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
