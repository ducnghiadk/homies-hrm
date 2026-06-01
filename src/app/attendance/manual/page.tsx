'use client'

import AppShell from '@/components/layout/AppShell'
import { mockManualEdits } from '@/lib/mock-data-attendance'
import { Edit2, Plus } from 'lucide-react'

export default function ManualAttendancePage() {
  return (
    <AppShell title="Chỉnh sửa chấm công">
      <div className="space-y-4">
        <button className="btn btn-primary w-full text-sm gap-2 animate-fade-in"><Plus size={16} /> Thêm bản ghi thủ công</button>
        <div className="space-y-2 animate-slide-up">
          {mockManualEdits.map(e => (
            <div key={e.id} className="card flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#2F6FA820' }}>
                <Edit2 size={18} className="text-primary-500" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{e.employee_name}</span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{e.date}</span>
                </div>
                <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-medium">{e.field}:</span> <span style={{ color: '#D9381E', textDecoration: 'line-through' }}>{e.old_value}</span> → <span className="text-emerald-500">{e.new_value}</span>
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>💬 {e.reason}</div>
                <div className="text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  👤 {e.edited_by} • {new Date(e.edited_at).toLocaleString('vi', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
