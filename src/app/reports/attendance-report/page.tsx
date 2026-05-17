'use client'

import AppShell from '@/components/layout/AppShell'
import { mockAttendanceReport } from '@/lib/mock-data-reports'
import { Clock, CheckCircle, AlertTriangle, XCircle, Download } from 'lucide-react'

export default function AttendanceReportPage() {
  const d = mockAttendanceReport

  return (
    <AppShell title="Báo cáo chấm công">
      <div className="space-y-4">
        {/* Period */}
        <div className="card animate-fade-in" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff' }}>
          <div className="text-xs opacity-80">Kỳ báo cáo</div>
          <div className="text-lg font-bold">Tháng {d.period} • {d.store}</div>
          <div className="text-xs opacity-80 mt-1">{d.summary.total_days} ngày làm việc</div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 animate-slide-up">
          {[
            { label: 'Đúng giờ', value: `${d.summary.on_time_rate}%`, color: '#10b981', icon: CheckCircle },
            { label: 'Đi muộn', value: `${d.summary.late_rate}%`, color: '#f59e0b', icon: AlertTriangle },
            { label: 'Vắng', value: `${d.summary.absent_rate}%`, color: '#ef4444', icon: XCircle },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="card text-center p-3">
                <Icon size={20} style={{ color: s.color, margin: '0 auto' }} />
                <div className="text-lg font-bold mt-1" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
              </div>
            )
          })}
        </div>

        {/* Employee Table */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>👥 Chi tiết theo nhân viên</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr style={{ borderBottom: '2px solid var(--gray-100)' }}>
                  <th className="text-left py-2 font-bold" style={{ color: 'var(--text-primary)' }}>Nhân viên</th>
                  <th className="text-center py-2 font-bold text-emerald-500">✓</th>
                  <th className="text-center py-2 font-bold text-amber-500">Muộn</th>
                  <th className="text-center py-2 font-bold text-red-500">Vắng</th>
                  <th className="text-center py-2 font-bold" style={{ color: 'var(--primary)' }}>%</th>
                </tr>
              </thead>
              <tbody>
                {d.by_employee.map((emp, idx) => {
                  const rate = Math.round(emp.on_time / emp.total * 100)
                  const rateColor = rate >= 90 ? '#10b981' : rate >= 80 ? '#f59e0b' : '#ef4444'
                  return (
                    <tr key={emp.name} style={{ borderBottom: '1px solid var(--gray-50)', background: idx % 2 === 0 ? 'transparent' : 'var(--gray-50)' }}>
                      <td className="py-2.5 font-medium" style={{ color: 'var(--text-primary)' }}>
                        {emp.name.split(' ').slice(-2).join(' ')}
                      </td>
                      <td className="text-center py-2.5 font-medium text-emerald-500">{emp.on_time}</td>
                      <td className="text-center py-2.5 font-medium" style={{ color: emp.late > 0 ? '#f59e0b' : 'var(--text-muted)' }}>{emp.late}</td>
                      <td className="text-center py-2.5 font-medium" style={{ color: emp.absent > 0 ? '#ef4444' : 'var(--text-muted)' }}>{emp.absent}</td>
                      <td className="text-center py-2.5">
                        <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: rateColor + '20', color: rateColor }}>
                          {rate}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        <button className="btn btn-primary w-full text-sm gap-2 animate-fade-in">
          <Download size={16} /> Xuất báo cáo
        </button>
      </div>
    </AppShell>
  )
}
