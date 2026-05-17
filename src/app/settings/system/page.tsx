'use client'

import AppShell from '@/components/layout/AppShell'
import { settingsSystem } from '@/lib/mock-data-settings'
import { Settings } from 'lucide-react'

type SettingItem = { key: string; label: string; description?: string; type: string; value: string | number | boolean }

function objectToSections(obj: Record<string, Record<string, unknown>>): { section: string; items: SettingItem[] }[] {
  const sectionLabels: Record<string, string> = {
    company_info: '🏢 Thông tin công ty',
    employee_settings: '👤 Nhân viên',
    attendance_settings: '📍 Chấm công',
    schedule_settings: '📅 Lịch làm việc',
    payroll_general: '💰 Lương',
    notification_settings: '🔔 Thông báo',
    data_backup: '💾 Sao lưu',
    audit_log: '📋 Nhật ký',
    integration_settings: '🔗 Tích hợp',
  }
  return Object.entries(obj).map(([key, vals]) => ({
    section: sectionLabels[key] || key,
    items: Object.entries(vals as Record<string, unknown>).map(([k, v]) => ({
      key: k,
      label: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      type: typeof v === 'boolean' ? 'toggle' : typeof v === 'number' ? 'input' : 'select',
      value: v as string | number | boolean,
    })),
  }))
}

export default function SettingsSystemPage() {
  const sections = objectToSections(settingsSystem as unknown as Record<string, Record<string, unknown>>)

  return (
    <AppShell title="Cài đặt hệ thống">
      <div className="space-y-4">
        {sections.map((section, idx) => (
          <div key={section.section} className="card animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
            <div className="flex items-center gap-2 mb-3">
              <Settings size={16} style={{ color: 'var(--primary)' }} />
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{section.section}</h3>
            </div>
            <div className="space-y-2">
              {section.items.map(item => (
                <div key={item.key} className="flex items-center justify-between p-2.5 rounded-lg" style={{ background: 'var(--gray-50)' }}>
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{item.label}</div>
                  </div>
                  {item.type === 'toggle' ? (
                    <div className="w-10 h-6 rounded-full relative cursor-pointer transition-all"
                      style={{ background: item.value ? '#10b981' : 'var(--gray-300)' }}>
                      <div className="w-4 h-4 rounded-full bg-white absolute top-1 transition-all"
                        style={{ left: item.value ? '22px' : '4px' }} />
                    </div>
                  ) : (
                    <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>{String(item.value)}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
