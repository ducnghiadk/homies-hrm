'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/store/auth-store'
import { AttendanceService } from '@/lib/services/attendance-service'
import { EmployeeService } from '@/lib/services/employee-service'
import { getShiftById } from '@/lib/mock-data'
import { formatTime } from '@/lib/utils'
import { Calendar, Clock, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

const statusConfig = {
  on_time: { label: 'Đúng giờ', color: '#1E9E57', icon: CheckCircle },
  late: { label: 'Đi muộn', color: '#F6C85F', icon: AlertTriangle },
  early: { label: 'Về sớm', color: '#F6C85F', icon: Clock },
  absent: { label: 'Vắng mặt', color: '#D9381E', icon: XCircle },
  leave: { label: 'Nghỉ phép', color: '#2F6FA8', icon: Calendar },
} as const

export default function AttendanceByDatePage() {
  const { user } = useAuthStore()
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)
  const [filterShift, setFilterShift] = useState('all')

  const attendances = user && user.store_id
    ? AttendanceService.getStoreAttendancesByDate(user.store_id, selectedDate, user)
    : []

  const records = attendances.filter(record => {
    if (filterShift === 'all') return true
    const shift = record.shift_id ? getShiftById(record.shift_id) : null
    return shift?.name === filterShift
  })

  const summary = AttendanceService.getAttendanceSummary(records)

  return (
    <ProtectedRoute requiredPermission="attendance.view_team">
      <AppShell title="Chấm công theo ngày">
        <div className="space-y-4">
          <div className="card animate-fade-in">
            <div className="flex items-center gap-3">
              <Calendar size={18} style={{ color: 'var(--primary)' }} />
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="flex-1 text-sm font-medium p-2 rounded-lg"
                style={{
                  background: 'var(--gray-50)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--gray-200)',
                }}
              />
            </div>
            <div className="flex gap-2 mt-3 flex-wrap">
              {['all', 'Ca Sáng', 'Ca Chiều', 'Ca Tối'].map(filter => (
                <button
                  key={filter}
                  onClick={() => setFilterShift(filter)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={{
                    background: filterShift === filter ? 'var(--primary)' : 'var(--gray-100)',
                    color: filterShift === filter ? '#fff' : 'var(--text-secondary)',
                  }}
                >
                  {filter === 'all' ? 'Tất cả' : filter}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-4 gap-2 animate-slide-up">
            <div className="card text-center p-3">
              <div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>
                {summary.total}
              </div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Tổng
              </div>
            </div>
            <div className="card text-center p-3">
              <div className="text-lg font-bold text-emerald-500">{summary.on_time}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Đúng giờ
              </div>
            </div>
            <div className="card text-center p-3">
              <div className="text-lg font-bold text-warning-500">{summary.late}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Muộn
              </div>
            </div>
            <div className="card text-center p-3">
              <div className="text-lg font-bold text-error-500">{summary.absent}</div>
              <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Vắng
              </div>
            </div>
          </div>

          <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {records.length === 0 ? (
              <div className="card text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                Không có dữ liệu chấm công cho ngày đã chọn.
              </div>
            ) : (
              records.map(record => {
                const config = statusConfig[record.status]
                const Icon = config.icon
                const employee = EmployeeService.getEmployeeById(record.employee_id)
                const shift = record.shift_id ? getShiftById(record.shift_id) : null

                return (
                  <div key={record.id} className="card flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{ background: `${config.color}20` }}
                    >
                      <Icon size={18} style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {employee?.full_name || 'Nhân sự không xác định'}
                        </span>
                        <span
                          className="badge text-xs px-2 py-0.5 rounded-full"
                          style={{ background: `${config.color}20`, color: config.color }}
                        >
                          {config.label}
                        </span>
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        {shift?.name || 'Chưa gán ca'} • {record.check_in_time ? formatTime(record.check_in_time) : '--:--'} →{' '}
                        {record.check_out_time ? formatTime(record.check_out_time) : '--:--'}
                        {record.late_minutes > 0 && <span className="text-warning-500"> (+{record.late_minutes}p)</span>}
                        {record.total_hours > 0 && <span> • {record.total_hours.toFixed(1)}h</span>}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
