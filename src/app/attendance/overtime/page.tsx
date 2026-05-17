'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockOTRequests } from '@/lib/mock-data-attendance'
import type { OTRequest } from '@/lib/mock-data-attendance'
import { Clock, CheckCircle, XCircle, AlertCircle, Plus } from 'lucide-react'

const statusMap = {
  pending: { label: 'Chờ duyệt', color: '#f59e0b', icon: AlertCircle },
  approved: { label: 'Đã duyệt', color: '#10b981', icon: CheckCircle },
  rejected: { label: 'Từ chối', color: '#ef4444', icon: XCircle },
}

export default function OvertimeRequestPage() {
  const [tab, setTab] = useState<'list' | 'form'>('list')
  const [requests, setRequests] = useState<OTRequest[]>(mockOTRequests)
  const [formData, setFormData] = useState({ date: '', start_time: '', end_time: '', reason: '' })

  const handleSubmit = () => {
    if (!formData.date || !formData.start_time || !formData.end_time || !formData.reason) return
    const hours = (parseInt(formData.end_time.split(':')[0]) - parseInt(formData.start_time.split(':')[0]))
    const newReq: OTRequest = {
      id: `ot-new-${Date.now()}`, employee_id: 'emp-005', employee_name: 'Trần Thị Mai',
      ...formData, hours: Math.abs(hours), status: 'pending',
    }
    setRequests(prev => [newReq, ...prev])
    setTab('list')
    setFormData({ date: '', start_time: '', end_time: '', reason: '' })
  }

  return (
    <AppShell title="Đăng ký OT">
      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 animate-fade-in">
          {(['list', 'form'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: tab === t ? 'var(--primary)' : 'var(--gray-100)',
                color: tab === t ? '#fff' : 'var(--text-secondary)',
              }}>
              {t === 'list' ? '📋 Danh sách' : '➕ Đăng ký mới'}
            </button>
          ))}
        </div>

        {tab === 'form' ? (
          <div className="card space-y-4 animate-slide-up">
            <h3 className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>Đăng ký làm thêm giờ</h3>
            {[
              { key: 'date', label: 'Ngày', type: 'date' },
              { key: 'start_time', label: 'Giờ bắt đầu', type: 'time' },
              { key: 'end_time', label: 'Giờ kết thúc', type: 'time' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>{f.label}</label>
                <input type={f.type} value={formData[f.key as keyof typeof formData]}
                  onChange={e => setFormData(prev => ({ ...prev, [f.key]: e.target.value }))}
                  className="w-full p-3 rounded-xl text-sm"
                  style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', color: 'var(--text-primary)' }} />
              </div>
            ))}
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: 'var(--text-secondary)' }}>Lý do</label>
              <textarea value={formData.reason} onChange={e => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                rows={3} className="w-full p-3 rounded-xl text-sm resize-none"
                style={{ background: 'var(--gray-50)', border: '1px solid var(--gray-200)', color: 'var(--text-primary)' }}
                placeholder="Nhập lý do làm thêm..." />
            </div>
            <button onClick={handleSubmit} className="btn btn-primary w-full text-sm">Gửi yêu cầu</button>
          </div>
        ) : (
          <div className="space-y-2 animate-slide-up">
            {requests.length === 0 ? (
              <div className="card text-center py-8">
                <Clock size={40} style={{ color: 'var(--text-muted)', margin: '0 auto' }} />
                <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>Chưa có yêu cầu OT</p>
              </div>
            ) : (
              requests.map(r => {
                const config = statusMap[r.status]
                const Icon = config.icon
                return (
                  <div key={r.id} className="card">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: config.color + '20' }}>
                        <Icon size={18} style={{ color: config.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{r.employee_name}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: config.color + '20', color: config.color }}>
                            {config.label}
                          </span>
                        </div>
                        <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                          📅 {r.date} • ⏰ {r.start_time} → {r.end_time} ({r.hours}h)
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>💬 {r.reason}</div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}
