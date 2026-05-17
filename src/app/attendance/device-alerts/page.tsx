'use client'

import AppShell from '@/components/layout/AppShell'
import { mockDeviceAlerts } from '@/lib/mock-data-attendance'
import { AlertTriangle, Smartphone, CheckCircle, XCircle } from 'lucide-react'

const resolutionMap: Record<string, { l: string; c: string }> = {
  unresolved: { l: '⚠️ Chưa xử lý', c: '#f59e0b' },
  valid: { l: '✅ Hợp lệ', c: '#10b981' },
  fraud: { l: '🔴 Gian lận', c: '#ef4444' },
}

export default function DeviceAlertsPage() {
  const unresolvedCount = mockDeviceAlerts.filter(a => a.resolution === 'unresolved').length

  return (
    <AppShell title="Cảnh báo thiết bị">
      <div className="space-y-4">
        <div className="card animate-fade-in" style={{ background: '#f59e0b10', border: '1px solid #f59e0b30' }}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            <span className="text-sm font-bold text-amber-500">
              {unresolvedCount} cảnh báo chưa xử lý
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Phát hiện nhiều nhân viên dùng chung thiết bị</p>
        </div>

        <div className="space-y-2 animate-slide-up">
          {mockDeviceAlerts.map(alert => {
            const res = resolutionMap[alert.resolution]
            const isUnresolved = alert.resolution === 'unresolved'
            return (
              <div key={alert.id} className="card" style={{ opacity: isUnresolved ? 1 : 0.7, borderLeft: `4px solid ${res.c}` }}>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: res.c + '20' }}>
                    <Smartphone size={18} style={{ color: res.c }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{alert.device_name}</div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: res.c + '20', color: res.c }}>
                        {res.l}
                      </span>
                    </div>
                    <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                      📱 Device ID: {alert.device_id}
                    </div>
                    <div className="mt-2 space-y-1">
                      {alert.employees.map(emp => (
                        <div key={emp.id} className="text-xs flex items-center gap-2 p-1.5 rounded" style={{ background: 'var(--gray-50)' }}>
                          <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{emp.name}</span>
                          <span style={{ color: 'var(--text-muted)' }}>check-in: {emp.check_in_time}</span>
                        </div>
                      ))}
                    </div>
                    <div className="text-[9px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
                      Phát hiện: {new Date(alert.detected_at).toLocaleString('vi', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
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
