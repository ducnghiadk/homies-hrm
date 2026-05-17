'use client'

import AppShell from '@/components/layout/AppShell'
import { mockAutoScheduleOutput, mockWorkLocations } from '@/lib/mock-data-scheduling'
import { Cpu, MapPin, CheckCircle, RefreshCw, AlertTriangle } from 'lucide-react'

export default function AutoSchedulePage() {
  const totalCoverage = Math.round(mockAutoScheduleOutput.reduce((s, o) => s + o.coverage, 0) / mockAutoScheduleOutput.length)
  const totalWarnings = mockAutoScheduleOutput.reduce((s, o) => s + o.warnings.length, 0)

  return (
    <AppShell title="Xếp ca tự động">
      <div className="space-y-4">
        <div className="card animate-fade-in" style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}>
          <div className="flex items-center gap-2">
            <Cpu size={20} />
            <div>
              <div className="text-xs opacity-80">AI Auto-Schedule</div>
              <div className="text-lg font-bold">Kết quả tối ưu</div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="text-xs opacity-80">Coverage</div>
              <div className="text-sm font-bold">{totalCoverage}%</div>
            </div>
            <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="text-xs opacity-80">Ca</div>
              <div className="text-sm font-bold">{mockAutoScheduleOutput.length}</div>
            </div>
            <div className="rounded-lg p-2 text-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <div className="text-xs opacity-80">Cảnh báo</div>
              <div className="text-sm font-bold">{totalWarnings}</div>
            </div>
          </div>
        </div>

        <div className="card animate-slide-up">
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>📋 Đề xuất lịch</h3>
          {mockAutoScheduleOutput.map((s, i) => (
            <div key={i} className="flex items-center gap-3 p-2 rounded-lg mb-1" style={{ background: 'var(--gray-50)' }}>
              <div className="flex-1">
                <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                  {s.date} — {s.shift_name}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {s.assigned.map(a => a.name.split(' ').slice(-2).join(' ')).join(', ')}
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                background: s.coverage === 100 ? '#10b98120' : '#f59e0b20',
                color: s.coverage === 100 ? '#10b981' : '#f59e0b',
              }}>{s.coverage}%</span>
              {s.warnings.length > 0 && <AlertTriangle size={12} className="text-amber-500" />}
            </div>
          ))}
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>📍 Địa điểm làm việc</h3>
          {mockWorkLocations.map(loc => (
            <div key={loc.id} className="flex items-center gap-3 p-2 rounded-lg mb-1" style={{ background: 'var(--gray-50)' }}>
              <MapPin size={14} style={{ color: 'var(--primary)' }} />
              <div className="flex-1">
                <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{loc.name}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{loc.address}</div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: loc.is_active ? '#10b98120' : '#ef444420', color: loc.is_active ? '#10b981' : '#ef4444' }}>
                {loc.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 animate-fade-in">
          <button className="btn btn-primary flex-1 text-sm gap-1"><CheckCircle size={14} /> Áp dụng</button>
          <button className="btn flex-1 text-sm gap-1" style={{ background: 'var(--gray-100)', color: 'var(--text-primary)' }}><RefreshCw size={14} /> Chạy lại</button>
        </div>
      </div>
    </AppShell>
  )
}
