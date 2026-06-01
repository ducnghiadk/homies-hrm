'use client'

import AppShell from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useAuthStore } from '@/store/auth-store'
import { AttendanceService } from '@/lib/services/attendance-service'
import { EmployeeService } from '@/lib/services/employee-service'
import { getShiftById } from '@/lib/mock-data'
import { formatTime, getInitials, getStatusColor, getStatusLabel } from '@/lib/utils'
import { AlertTriangle, CheckCircle } from 'lucide-react'

export default function TodayAttendancePage() {
  const { user } = useAuthStore()

  const attendances = user && user.store_id
    ? AttendanceService.getStoreAttendancesToday(user.store_id, user)
    : []
  const summary = AttendanceService.getAttendanceSummary(attendances)

  return (
    <ProtectedRoute requiredPermission="attendance.view_team">
      <AppShell title="Chấm công hôm nay">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3 animate-fade-in">
            <div className="stat-card text-center">
              <div className="stat-value" style={{ color: 'var(--success)', fontSize: '22px' }}>
                {summary.on_time}
              </div>
              <div className="stat-label flex items-center justify-center gap-1">
                <CheckCircle size={10} /> Đúng giờ
              </div>
            </div>
            <div className="stat-card text-center">
              <div className="stat-value" style={{ color: 'var(--error)', fontSize: '22px' }}>
                {summary.late}
              </div>
              <div className="stat-label flex items-center justify-center gap-1">
                <AlertTriangle size={10} /> Trễ
              </div>
            </div>
            <div className="stat-card text-center">
              <div className="stat-value" style={{ color: 'var(--text-muted)', fontSize: '22px' }}>
                {summary.absent}
              </div>
              <div className="stat-label">Vắng</div>
            </div>
          </div>

          <div className="card animate-slide-up">
            <h3 className="text-sm font-bold mb-3">Chi tiết</h3>
            <div className="space-y-2">
              {attendances.length === 0 ? (
                <div className="text-center py-6 text-xs text-gray-400">
                  Không có dữ liệu chấm công hôm nay.
                </div>
              ) : (
                attendances.map(att => {
                  const employee = EmployeeService.getEmployeeById(att.employee_id)
                  const shift = att.shift_id ? getShiftById(att.shift_id) : null

                  return (
                    <div
                      key={att.id}
                      className="flex items-center gap-3 py-2 border-t"
                      style={{ borderColor: 'var(--gray-100)' }}
                    >
                      <div className="avatar" style={{ width: 36, height: 36, fontSize: 12 }}>
                        {employee ? getInitials(employee.full_name) : '?'}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{employee?.full_name || 'Nhân sự không xác định'}</div>
                        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                          {shift?.name || 'Chưa gán ca'} •{' '}
                          {att.check_in_time ? formatTime(att.check_in_time) : 'Chưa check-in'}
                        </div>
                      </div>
                      <span className={`badge ${getStatusColor(att.status)} text-xs`}>
                        {getStatusLabel(att.status)}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </AppShell>
    </ProtectedRoute>
  )
}
