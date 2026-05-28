'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { masterStores, masterDepartments, masterShifts, masterLeaveTypes, masterPositions, masterEmployeeLevels, masterApprovalWorkflows } from '@/lib/mock-data-settings'
import { Database, Plus, Edit2, Trash2 } from 'lucide-react'

const entities = [
  { key: 'stores', label: 'Cửa hàng', data: masterStores.map(s => ({ id: s.id, name: s.name, desc: s.address })) },
  { key: 'positions', label: 'Vị trí', data: masterPositions.map(p => ({ id: p.id, name: p.name, desc: `Level ${p.level} — ${p.base_salary.toLocaleString('vi-VN')}₫` })) },
  { key: 'shifts', label: 'Ca làm', data: masterShifts.map(s => ({ id: s.id, name: s.name, desc: `${s.start_time} - ${s.end_time}` })) },
  { key: 'departments', label: 'Phòng ban', data: masterDepartments.map(d => ({ id: d.id, name: d.name, desc: `${d.head_count} NV` })) },
  { key: 'leaveTypes', label: 'Loại nghỉ', data: masterLeaveTypes.map(l => ({ id: l.id, name: l.name, desc: `${l.default_days} ngày` })) },
  { key: 'levels', label: 'Cấp bậc', data: masterEmployeeLevels.map(l => ({ id: String(l.level), name: l.name, desc: l.salary_range })) },
  { key: 'workflows', label: 'Quy trình duyệt', data: masterApprovalWorkflows.map(w => ({ id: w.id, name: w.name, desc: w.steps.join(' → ') })) },
]

export default function SettingsMasterDataPage() {
  const [activeTab, setActiveTab] = useState(entities[0].key)
  const active = entities.find(e => e.key === activeTab)!

  return (
    <AppShell title="Danh mục hệ thống">
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-1 animate-fade-in">
          {entities.map(e => (
            <button key={e.key} onClick={() => setActiveTab(e.key)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap"
              style={{ background: activeTab === e.key ? 'var(--primary)' : 'var(--gray-100)', color: activeTab === e.key ? '#fff' : 'var(--text-secondary)' }}>
              {e.label} ({e.data.length})
            </button>
          ))}
        </div>

        <div className="animate-slide-up">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{active.label}</h3>
            <button className="btn btn-primary text-xs gap-1 px-3 py-2"><Plus size={14} /> Thêm</button>
          </div>
          <div className="space-y-2">
            {active.data.map(item => (
              <div key={item.id} className="card flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary-50)' }}>
                  <Database size={14} style={{ color: 'var(--primary)' }} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 rounded-lg" style={{ background: 'var(--gray-100)' }}><Edit2 size={12} style={{ color: 'var(--text-muted)' }} /></button>
                  <button className="p-1.5 rounded-lg" style={{ background: '#D9381E20' }}><Trash2 size={12} className="text-error-500" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
