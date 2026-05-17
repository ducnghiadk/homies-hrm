'use client'

import { useState } from 'react'
import AppShell from '@/components/layout/AppShell'
import { mockTaskTemplates } from '@/lib/mock-data-tasks'
import { FileText, Check, Camera, Plus, ChevronDown, ChevronUp, Layers } from 'lucide-react'

export default function TaskTemplatesPage() {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <AppShell title="Mẫu tác vụ">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in">
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
              {mockTaskTemplates.length} mẫu tác vụ
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Quản lý checklist cho từng vị trí/ca</div>
          </div>
          <button className="btn btn-primary text-xs gap-1 px-3 py-2">
            <Plus size={14} /> Tạo mẫu
          </button>
        </div>

        {/* Templates */}
        {mockTaskTemplates.map((tpl, idx) => (
          <div key={tpl.id} className="card animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
            <button className="w-full text-left" onClick={() => setExpanded(expanded === tpl.id ? null : tpl.id)}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'var(--primary-50)' }}>
                  <Layers size={18} style={{ color: 'var(--primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{tpl.name}</div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {tpl.position} • {tpl.shift} • {tpl.items.length} mục
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tpl.is_active ? '' : ''}`}
                    style={{
                      background: tpl.is_active ? '#10b98120' : '#ef444420',
                      color: tpl.is_active ? '#10b981' : '#ef4444',
                    }}>
                    {tpl.is_active ? 'Đang dùng' : 'Tạm ngưng'}
                  </span>
                  {expanded === tpl.id ? <ChevronUp size={16} style={{ color: 'var(--text-muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)' }} />}
                </div>
              </div>
            </button>

            {expanded === tpl.id && (
              <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--gray-100)' }}>
                {tpl.items.map((item, i) => (
                  <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg" style={{ background: 'var(--gray-50)' }}>
                    <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold mt-0.5"
                      style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{item.description}</div>
                      <div className="flex gap-2 mt-1">
                        {item.is_required && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: '#ef444420', color: '#ef4444' }}>
                            Bắt buộc
                          </span>
                        )}
                        {item.requires_photo && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5" style={{ background: '#3b82f620', color: '#3b82f6' }}>
                            <Camera size={8} /> Ảnh
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  )
}
