'use client'

import { useAuthStore } from '@/store/auth-store'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockRequests, mockEmployees, getEmployeeById } from '@/lib/mock-data'
import { getStatusLabel, getStatusColor, formatDate } from '@/lib/utils'
import { ArrowLeftRight, CalendarOff, Check, X } from 'lucide-react'

export default function RequestsPage() {
  const { user, isAuthenticated } = useAuthStore()
  const router = useRouter()
  useEffect(() => { if (!isAuthenticated) router.push('/login') }, [isAuthenticated, router])
  if (!user) return null

  const requests = mockRequests

  return (
    <AppShell title="Yêu cầu">
      <div className="space-y-3 animate-slide-up">
        {requests.length === 0 ? (
          <div className="text-center py-20" style={{color:'var(--text-muted)'}}>Chưa có yêu cầu nào</div>
        ) : requests.map(req => {
          const emp = getEmployeeById(req.employee_id)
          const isSwap = req.type === 'swap'
          return (
            <div key={req.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{background: isSwap ? 'var(--shift-morning)' + '22' : 'var(--warning-light)'}}>
                  {isSwap ? <ArrowLeftRight size={18} style={{color:'var(--shift-morning)'}}/> : <CalendarOff size={18} style={{color:'var(--warning)'}}/>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold">{emp?.full_name}</span>
                    <span className={`badge ${getStatusColor(req.status)} text-xs`}>{getStatusLabel(req.status)}</span>
                  </div>
                  <div className="text-xs font-medium mb-1" style={{color:'var(--text-secondary)'}}>
                    {isSwap ? 'Đổi ca' : 'Xin nghỉ phép'}
                    {req.start_date && ` • ${formatDate(req.start_date)}`}
                    {req.end_date && req.end_date !== req.start_date && ` → ${formatDate(req.end_date)}`}
                  </div>
                  <p className="text-xs" style={{color:'var(--text-muted)'}}>{req.reason}</p>
                  {req.status === 'pending' && user.role !== 'employee' && (
                    <div className="flex gap-2 mt-3">
                      <button className="btn btn-primary text-xs py-2 px-4" style={{minHeight:'36px'}}>
                        <Check size={14}/> Duyệt
                      </button>
                      <button className="btn btn-secondary text-xs py-2 px-4" style={{minHeight:'36px', color:'var(--error)'}}>
                        <X size={14}/> Từ chối
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AppShell>
  )
}
