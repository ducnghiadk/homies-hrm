'use client'

import AppShell from '@/components/layout/AppShell'
import { mockStaffHours } from '@/lib/mock-data-reports'
import { Download } from 'lucide-react'

export default function StaffHoursReportPage() {
  const d = mockStaffHours

  return (
    <AppShell title="Báo cáo giờ công">
      <div className="space-y-4">
        {/* Summary */}
        <div className="card animate-fade-in" style={{ background: 'linear-gradient(135deg, #2F6FA8, #6366f1)', color: '#fff' }}>
          <div className="text-xs opacity-80">Tháng {d.period}</div>
          <div className="text-xl font-bold mt-1">{d.total_actual.toLocaleString()}h tổng</div>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <div><div className="text-xs opacity-70">OT</div><div className="text-sm font-bold">{d.total_ot}h</div></div>
            <div><div className="text-xs opacity-70">Kế hoạch</div><div className="text-sm font-bold">{d.total_scheduled}h</div></div>
            <div><div className="text-xs opacity-70">Cửa hàng</div><div className="text-sm font-bold">{d.store}</div></div>
          </div>
        </div>

        {/* Daily Details */}
        <div className="card animate-slide-up">
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>⏰ Chi tiết giờ công theo ngày</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--gray-100)' }}>
                  <th className="text-left py-2 font-bold" style={{ color: 'var(--text-primary)' }}>Ngày</th>
                  <th className="text-center py-2" style={{ color: 'var(--text-muted)' }}>KH</th>
                  <th className="text-center py-2" style={{ color: 'var(--primary)' }}>Thực tế</th>
                  <th className="text-center py-2 text-warning-500">OT</th>
                </tr>
              </thead>
              <tbody>
                {d.data.map((row, idx) => (
                  <tr key={row.date} style={{ background: idx % 2 === 0 ? 'transparent' : 'var(--gray-50)' }}>
                    <td className="py-2 font-medium" style={{ color: 'var(--text-primary)' }}>{row.date.slice(-2)}</td>
                    <td className="text-center py-2" style={{ color: 'var(--text-secondary)' }}>{row.scheduled_hours}h</td>
                    <td className="text-center py-2 font-medium" style={{ color: 'var(--primary)' }}>{row.actual_hours}h</td>
                    <td className="text-center py-2 font-medium" style={{ color: row.ot_hours > 0 ? '#F6C85F' : 'var(--text-muted)' }}>{row.ot_hours}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <button className="btn btn-primary w-full text-sm gap-2 animate-fade-in"><Download size={16} /> Xuất báo cáo</button>
      </div>
    </AppShell>
  )
}
