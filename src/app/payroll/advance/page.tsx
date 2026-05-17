'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockAdvances } from '@/lib/mock-data-payroll'
import { DollarSign, CheckCircle, Clock, Plus } from 'lucide-react'

const fmt = (n: number) => n.toLocaleString('vi-VN') + '₫'
const statusMap = { pending: { l: 'Chờ duyệt', c: '#f59e0b' }, approved: { l: 'Đã duyệt', c: '#10b981' }, disbursed: { l: 'Đã chi', c: '#3b82f6' }, rejected: { l: 'Từ chối', c: '#ef4444' } }

export default function SalaryAdvancePage() {
  return (
    <AppShell title="Tạm ứng lương">
      <div className="space-y-4">
        <div className="card animate-fade-in" style={{ background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', color: '#fff' }}>
          <div className="text-xs opacity-80">Tổng tạm ứng tháng này</div>
          <div className="text-2xl font-bold mt-1">{fmt(mockAdvances.filter(a => a.status !== 'rejected').reduce((s, a) => s + a.requested_amount, 0))}</div>
          <div className="text-xs opacity-80 mt-1">{mockAdvances.length} yêu cầu</div>
        </div>

        <button className="btn btn-primary w-full text-sm gap-2 animate-fade-in"><Plus size={16} /> Tạm ứng mới</button>

        <div className="space-y-2 animate-slide-up">
          {mockAdvances.map(a => {
            const s = statusMap[a.status]
            return (
              <div key={a.id} className="card flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#3b82f620' }}>
                  <DollarSign size={18} className="text-blue-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{a.employee_name}</span>
                    <span className="text-sm font-bold text-blue-500">{fmt(a.requested_amount)}</span>
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{a.reason}</div>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: s.c + '20', color: s.c }}>{s.l}</span>
                    <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{a.created_at}</span>
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
