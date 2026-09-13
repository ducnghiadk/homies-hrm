'use client'

import AppShell from '@/components/layout/AppShell'
import { mockDevices } from '@/lib/mock-data-attendance'
import { ShieldCheck, ShieldX } from 'lucide-react'

export default function DeviceManagementPage() {
  const activeCount = mockDevices.filter(d => !d.is_blocked).length
  const blockedCount = mockDevices.filter(d => d.is_blocked).length

  return (
    <AppShell title="Quản lý thiết bị">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 animate-fade-in">
          <div className="card text-center p-3">
            <div className="text-lg font-bold text-emerald-500">{activeCount}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Hoạt động</div>
          </div>
          <div className="card text-center p-3">
            <div className="text-lg font-bold text-error-500">{blockedCount}</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Bị chặn</div>
          </div>
        </div>

        <div className="space-y-2 animate-slide-up">
          {mockDevices.map(d => {
            const isActive = !d.is_blocked
            return (
              <div key={d.id} className="card flex items-center gap-3" style={{ opacity: isActive ? 1 : 0.6 }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: isActive ? '#1E9E5720' : '#D9381E20' }}>
                  {isActive ? <ShieldCheck size={18} className="text-emerald-500" /> : <ShieldX size={18} className="text-error-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{d.device_name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    👤 {d.employee_name} • 📱 {d.os}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    ID: {d.device_id} • Đăng ký: {new Date(d.registered_at).toLocaleDateString('vi')}
                  </div>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{ background: isActive ? '#1E9E5720' : '#D9381E20', color: isActive ? '#1E9E57' : '#D9381E' }}>
                  {isActive ? '✓ Active' : '✕ Blocked'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </AppShell>
  )
}
