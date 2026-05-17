'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockAttByDate } from '@/lib/mock-data-attendance'
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

const statusConfig = {
  on_time: { label: 'Đúng giờ', color: '#10b981', icon: CheckCircle },
  late: { label: 'Đi muộn', color: '#f59e0b', icon: AlertTriangle },
  early_leave: { label: 'Về sớm', color: '#f59e0b', icon: Clock },
  absent: { label: 'Vắng mặt', color: '#ef4444', icon: XCircle },
  day_off: { label: 'Nghỉ', color: '#9ca3af', icon: Calendar },
  leave: { label: 'Phép', color: '#3b82f6', icon: Calendar },
}

export default function AttendanceByDatePage() {
  const [selectedDate, setSelectedDate] = useState('2026-02-15')
  const [filterShift, setFilterShift] = useState('all')

  const records = mockAttByDate.filter(r =>
    filterShift === 'all' || r.shift_name === filterShift
  )

  const summary = {
    total: records.length,
    on_time: records.filter(r => r.status === 'on_time').length,
    late: records.filter(r => r.status === 'late').length,
    absent: records.filter(r => r.status === 'absent').length,
  }

  return (
    <AppShell title="Chấm công theo ngày">
      <div className="space-y-4">
        {/* Date Picker */}
        <div className="card animate-fade-in">
          <div className="flex items-center gap-3">
            <Calendar size={18} style={{ color: 'var(--primary)' }} />
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="flex-1 text-sm font-medium p-2 rounded-lg"
              style={{ background: 'var(--gray-50)', color: 'var(--text-primary)', border: '1px solid var(--gray-200)' }} />
          </div>
          <div className="flex gap-2 mt-3">
            {['all', 'Ca Sáng', 'Ca Chiều', 'Ca Tối'].map(f => (
              <button key={f} onClick={() => setFilterShift(f)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  background: filterShift === f ? 'var(--primary)' : 'var(--gray-100)',
                  color: filterShift === f ? '#fff' : 'var(--text-secondary)',
                }}>
                {f === 'all' ? 'Tất cả' : f}
              </button>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-4 gap-2 animate-slide-up">
          <div className="card text-center p-3"><div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{summary.total}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Tổng</div></div>
          <div className="card text-center p-3"><div className="text-lg font-bold text-emerald-500">{summary.on_time}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Đúng giờ</div></div>
          <div className="card text-center p-3"><div className="text-lg font-bold text-amber-500">{summary.late}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Muộn</div></div>
          <div className="card text-center p-3"><div className="text-lg font-bold text-red-500">{summary.absent}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Vắng</div></div>
        </div>

        {/* Records */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {records.map(r => {
            const config = statusConfig[r.status]
            const Icon = config.icon
            return (
              <div key={r.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: config.color + '20' }}>
                  <Icon size={18} style={{ color: config.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{r.employee_name}</span>
                    <span className="badge text-xs px-2 py-0.5 rounded-full" style={{ background: config.color + '20', color: config.color }}>
                      {config.label}
                    </span>
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {r.shift_name} • {r.actual_in || '--:--'} → {r.actual_out || '--:--'}
                    {r.late_minutes > 0 && <span className="text-amber-500"> (+{r.late_minutes}p)</span>}
                    {r.total_hours > 0 && <span> • {r.total_hours.toFixed(1)}h</span>}
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
