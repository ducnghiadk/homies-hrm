'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockHandovers } from '@/lib/mock-data-tasks'
import { ArrowRight, AlertTriangle, DollarSign, Package, User, CheckCircle2, Clock, FileText } from 'lucide-react'

export default function TaskHandoverPage() {
  const [selectedId, setSelectedId] = useState(mockHandovers[0]?.id)
  const handover = mockHandovers.find(h => h.id === selectedId)

  return (
    <AppShell title="Bàn giao ca">
      <div className="space-y-4">
        {/* Selector */}
        <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-in">
          {mockHandovers.map(h => (
            <button key={h.id} onClick={() => setSelectedId(h.id)}
              className="flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all"
              style={{
                background: selectedId === h.id ? 'var(--primary)' : 'var(--gray-100)',
                color: selectedId === h.id ? '#fff' : 'var(--text-secondary)',
              }}>
              {h.shift_out} → {h.shift_in}
            </button>
          ))}
        </div>

        {handover && (
          <>
            {/* Transfer Info */}
            <div className="card animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-lg" style={{ background: 'var(--primary-50)' }}>
                    <User size={20} className="text-primary-500" />
                  </div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {handover.from_employee_name.split(' ').slice(-2).join(' ')}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{handover.shift_out}</div>
                </div>
                <ArrowRight size={24} style={{ color: 'var(--primary)' }} />
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full mx-auto mb-1 flex items-center justify-center text-lg" style={{ background: '#F6C85F20' }}>
                    <User size={20} className="text-warning-500" />
                  </div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {handover.to_employee_name?.split(' ').slice(-2).join(' ') || 'Chưa xác nhận'}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{handover.shift_in}</div>
                </div>
              </div>
              <div className="mt-3 text-center">
                {handover.acknowledged ? (
                  <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: '#1E9E5720', color: '#1E9E57' }}>
                    <CheckCircle2 size={12} className="inline text-emerald-500" /> Đã xác nhận lúc {new Date(handover.acknowledged_at!).toLocaleTimeString('vi', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                ) : (
                  <span className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: '#F6C85F20', color: '#F6C85F' }}>
                    <Clock size={12} className="inline text-warning-500" /> Chờ xác nhận
                  </span>
                )}
              </div>
            </div>

            {/* Details */}
            {[
              { icon: <FileText size={14} />, title: 'Ghi chú chung', content: handover.general_notes },
              { icon: <AlertTriangle size={14} />, title: 'Vấn đề cần lưu ý', content: handover.issues },
              { icon: <Package size={14} />, title: 'Tồn kho', content: handover.inventory_notes },
            ].map(s => (
              <div key={s.title} className="card animate-slide-up">
                <div className="flex items-center gap-2 mb-2">
                  <span>{s.icon}</span>
                  <h4 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{s.title}</h4>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>{s.content}</p>
              </div>
            ))}

            {/* Cash */}
            <div className="card animate-slide-up" style={{ background: '#1E9E5710', border: '1px solid #1E9E5730' }}>
              <div className="flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-500" />
                <span className="text-sm font-bold text-emerald-500">Tiền quỹ</span>
              </div>
              <div className="text-2xl font-bold mt-2 text-emerald-500">
                {handover.cash_amount.toLocaleString('vi-VN')}₫
              </div>
            </div>

            {!handover.acknowledged && (
              <button className="btn btn-primary w-full text-sm animate-fade-in flex items-center justify-center gap-1.5"><CheckCircle2 size={14} /> Xác nhận bàn giao</button>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
