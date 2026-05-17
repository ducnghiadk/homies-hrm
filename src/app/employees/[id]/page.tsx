'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter, useParams } from 'next/navigation'
import { useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockEmployees, mockAttendances, getStoreById, getPositionById } from '@/lib/mock-data'
import { getInitials, getStatusLabel, getStatusColor, formatDate, formatTime } from '@/lib/utils'
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, Star } from 'lucide-react'
import Link from 'next/link'

export default function EmployeeDetailPage() {
  const { isAuthenticated } = useAuthStore()
  const router = useRouter()
  const params = useParams()
  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])

  const emp = mockEmployees.find(e => e.id === params.id)
  if (!emp) return <AppShell title="Nhân viên"><div className="text-center py-20">Không tìm thấy</div></AppShell>

  const store = getStoreById(emp.store_id)
  const position = getPositionById(emp.position_id)
  const empAttendances = mockAttendances.filter(a => a.employee_id === emp.id).slice(0, 7)

  return (
    <AppShell>
      <div className="space-y-4">
        <button onClick={()=>router.back()} className="flex items-center gap-1 text-sm font-medium" style={{color:'var(--primary)'}}>
          <ArrowLeft size={16}/> Quay lại
        </button>

        {/* Header */}
        <div className="card-elevated text-center p-6 animate-fade-in">
          <div className="avatar avatar-xl mx-auto mb-3" style={{
            background:'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)', color:'white'
          }}>{getInitials(emp.full_name)}</div>
          <h2 className="text-lg font-bold">{emp.full_name}</h2>
          <p className="text-sm" style={{color:'var(--text-secondary)'}}>{position?.name}</p>
          <div className="flex items-center justify-center gap-4 mt-3">
            <span className={`badge ${getStatusColor(emp.status)}`}>{getStatusLabel(emp.status)}</span>
            <span className="badge badge-primary capitalize">{emp.gamification_level}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 animate-slide-up">
          <div className="stat-card text-center">
            <div className="stat-value" style={{color:'var(--primary)',fontSize:'20px'}}>{emp.total_points.toLocaleString()}</div>
            <div className="stat-label"><Star size={10}/> Điểm</div>
          </div>
          <div className="stat-card text-center">
            <div className="stat-value" style={{color:'var(--success)',fontSize:'20px'}}>
              {empAttendances.filter(a=>a.status==='on_time').length}
            </div>
            <div className="stat-label">Đúng giờ</div>
          </div>
          <div className="stat-card text-center">
            <div className="stat-value" style={{color:'var(--error)',fontSize:'20px'}}>
              {empAttendances.filter(a=>a.status==='late').length}
            </div>
            <div className="stat-label">Đi trễ</div>
          </div>
        </div>

        {/* Info */}
        <div className="card animate-slide-up">
          <h3 className="text-sm font-bold mb-3">Thông tin</h3>
          <div className="space-y-3 text-sm">
            {[
              {icon:Phone, label:emp.phone},
              {icon:Mail, label:emp.email},
              {icon:MapPin, label:store?.name||''},
              {icon:Calendar, label:`Vào làm: ${formatDate(emp.hire_date)}`},
            ].map(({icon:Icon,label},i)=>(
              <div key={i} className="flex items-center gap-3">
                <Icon size={16} style={{color:'var(--text-muted)'}}/> <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Attendance */}
        <div className="card animate-slide-up">
          <h3 className="text-sm font-bold mb-3">Chấm công gần đây</h3>
          {empAttendances.length === 0 ? (
            <p className="text-sm" style={{color:'var(--text-muted)'}}>Chưa có dữ liệu</p>
          ) : (
            <div className="space-y-2">
              {empAttendances.map(att => (
                <div key={att.id} className="flex items-center justify-between py-2 border-t" style={{borderColor:'var(--gray-100)'}}>
                  <div>
                    <div className="text-sm font-medium">{formatDate(att.date)}</div>
                    <div className="text-xs" style={{color:'var(--text-secondary)'}}>
                      {att.check_in_time ? formatTime(att.check_in_time) : '--:--'}
                      {att.check_out_time ? ` → ${formatTime(att.check_out_time)}` : ''}
                    </div>
                  </div>
                  <span className={`badge ${getStatusColor(att.status)} text-xs`}>{getStatusLabel(att.status)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
