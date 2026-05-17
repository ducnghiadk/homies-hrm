'use client'

import AppShell from '@/components/layout/AppShell'
import { mockTaskReport } from '@/lib/mock-data-reports'
import { CheckCircle, Clock, AlertTriangle, Download } from 'lucide-react'

export default function TaskReportPage() {
  const d = mockTaskReport
  const inProgress = d.total_tasks - d.completed
  const overdue = d.incidents.open

  return (
    <AppShell title="Báo cáo tác vụ">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2 animate-fade-in">
          {[
            { label: 'Tổng tác vụ', value: d.total_tasks, color: 'var(--primary)', icon: Clock },
            { label: 'Hoàn thành', value: d.completed, color: '#10b981', icon: CheckCircle },
            { label: 'Đang làm', value: inProgress, color: '#f59e0b', icon: Clock },
            { label: 'Sự cố mở', value: overdue, color: '#ef4444', icon: AlertTriangle },
          ].map(s => {
            const Icon = s.icon
            return (
              <div key={s.label} className="card flex items-center gap-3 p-3">
                <Icon size={20} style={{ color: s.color as string }} />
                <div><div className="text-lg font-bold" style={{ color: s.color as string }}>{s.value}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>{s.label}</div></div>
              </div>
            )
          })}
        </div>

        <div className="card animate-slide-up">
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>📊 Hoàn thành theo checklist</h3>
          {d.by_template.map(tpl => {
            const color = tpl.completion >= 90 ? '#10b981' : tpl.completion >= 70 ? '#f59e0b' : '#ef4444'
            return (
              <div key={tpl.template} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span style={{ color: 'var(--text-primary)' }}>{tpl.template}</span>
                  <span className="font-bold" style={{ color }}>{tpl.completion}%</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: 'var(--gray-100)' }}>
                  <div className="h-2 rounded-full" style={{ width: `${tpl.completion}%`, background: color }} />
                </div>
              </div>
            )
          })}
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>🔥 Sự cố</h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div><div className="text-lg font-bold" style={{ color: 'var(--primary)' }}>{d.incidents.total}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Tổng</div></div>
            <div><div className="text-lg font-bold text-emerald-500">{d.incidents.resolved}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Xử lý</div></div>
            <div><div className="text-lg font-bold text-red-500">{d.incidents.open}</div><div className="text-xs" style={{ color: 'var(--text-muted)' }}>Đang mở</div></div>
          </div>
        </div>

        <button className="btn btn-primary w-full text-sm gap-2 animate-fade-in"><Download size={16} /> Xuất báo cáo</button>
      </div>
    </AppShell>
  )
}
