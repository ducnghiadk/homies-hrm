'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { exportColumns } from '@/lib/mock-data-employee-ext'
import { Download, Check } from 'lucide-react'

export default function EmployeeExportPage() {
  const [selected, setSelected] = useState<string[]>(exportColumns.filter(c => c.selected).map(c => c.key))

  const toggle = (key: string) => {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key])
  }

  return (
    <AppShell title="Xuất nhân viên">
      <div className="space-y-4">
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>📋 Chọn cột xuất ({selected.length}/{exportColumns.length})</h3>
            <button onClick={() => setSelected(selected.length === exportColumns.length ? [] : exportColumns.map(c => c.key))}
              className="text-xs font-medium" style={{ color: 'var(--primary)' }}>
              {selected.length === exportColumns.length ? 'Bỏ hết' : 'Chọn tất'}
            </button>
          </div>
          <div className="space-y-1">
            {exportColumns.map(c => {
              const isChecked = selected.includes(c.key)
              return (
                <button key={c.key} onClick={() => toggle(c.key)}
                  className="w-full flex items-center gap-2 text-left p-2 rounded-lg transition-all"
                  style={{ background: isChecked ? 'var(--primary-50)' : 'var(--gray-50)' }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center"
                    style={{ background: isChecked ? 'var(--primary)' : 'var(--gray-200)' }}>
                    {isChecked && <Check size={12} color="#fff" />}
                  </div>
                  <span className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{c.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="card animate-slide-up">
          <h3 className="text-sm font-bold mb-2" style={{ color: 'var(--text-primary)' }}>📁 Định dạng</h3>
          <div className="flex gap-2">
            {['Excel (.xlsx)', 'CSV (.csv)'].map(f => (
              <button key={f} className="flex-1 py-2.5 rounded-xl text-xs font-medium text-center"
                style={{ background: f.includes('xlsx') ? 'var(--primary)' : 'var(--gray-100)', color: f.includes('xlsx') ? '#fff' : 'var(--text-secondary)' }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary w-full text-sm gap-2 animate-fade-in">
          <Download size={16} /> Xuất {selected.length} cột
        </button>
      </div>
    </AppShell>
  )
}
