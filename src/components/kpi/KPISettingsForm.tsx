'use client'

import { useState } from 'react'
import type { KPISettings } from '@/lib/kpi-types'
import { toast } from 'sonner'

interface Props {
  settings: KPISettings
  onSave: (data: Partial<KPISettings>) => void
}

export default function KPISettingsForm({ settings, onSave }: Props) {
  const [form, setForm] = useState<KPISettings>({ ...settings })

  const handleSave = () => {
    onSave(form)
    toast.success('✅ Đã lưu cài đặt KPI')
  }

  return (
    <div className="space-y-4">
      {/* Evaluation Cycle */}
      <div>
        <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-secondary)' }}>Chu kỳ đánh giá</label>
        <div className="flex gap-2">
          {(['monthly', 'quarterly'] as const).map(cycle => (
            <button
              key={cycle}
              onClick={() => setForm(f => ({ ...f, evaluation_cycle: cycle }))}
              className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: form.evaluation_cycle === cycle ? 'var(--primary)' : 'var(--gray-100)',
                color: form.evaluation_cycle === cycle ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {cycle === 'monthly' ? 'Hàng tháng' : 'Hàng quý'}
            </button>
          ))}
        </div>
      </div>

      {/* Promotion Review Months */}
      <div>
        <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-secondary)' }}>
          Số tháng review thăng tiến
        </label>
        <input
          type="number" min={1} max={24}
          value={form.promotion_review_months}
          onChange={e => setForm(f => ({ ...f, promotion_review_months: parseInt(e.target.value) || 6 }))}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ border: '1px solid var(--gray-200)' }}
        />
      </div>

      {/* Appeal Window */}
      <div>
        <label className="text-xs font-bold mb-1 block" style={{ color: 'var(--text-secondary)' }}>
          Thời gian khiếu nại (giờ)
        </label>
        <input
          type="number" min={12} max={168}
          value={form.appeal_window_hours}
          onChange={e => setForm(f => ({ ...f, appeal_window_hours: parseInt(e.target.value) || 48 }))}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{ border: '1px solid var(--gray-200)' }}
        />
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        {[
          { key: 'allow_late_error_logging' as const, label: 'Cho phép log lỗi cuối tháng' },
          { key: 'require_evidence_for_major' as const, label: 'Yêu cầu bằng chứng cho lỗi nặng' },
          { key: 'notify_employee_on_error' as const, label: 'Thông báo NV khi bị log lỗi' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between py-2">
            <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
            <button
              onClick={() => setForm(f => ({ ...f, [key]: !f[key] }))}
              className="w-11 h-6 rounded-full transition-colors relative flex-shrink-0"
              style={{ background: form[key] ? 'var(--success)' : 'var(--gray-300)' }}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                form[key] ? 'translate-x-5' : 'translate-x-0.5'
              }`} />
            </button>
          </div>
        ))}
      </div>

      {/* Save */}
      <button
        onClick={handleSave}
        className="w-full py-3 rounded-xl text-white font-bold text-sm active:scale-[0.98] transition-all shadow-md"
        style={{ background: 'var(--primary)' }}
      >
        💾 Lưu cài đặt
      </button>

      <div className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
        Cập nhật lần cuối: {new Date(form.updated_at).toLocaleDateString('vi-VN')}
      </div>
    </div>
  )
}
