'use client'

import AppShell from '@/components/layout/AppShell'
import { settingsPayroll } from '@/lib/mock-data-settings'
import { DollarSign } from 'lucide-react'

const sectionLabels: Record<string, string> = {
  standard_work_days: '📅 Ngày công chuẩn',
  salary_coefficients: '📊 Hệ số lương',
  payroll_budget: '💰 Ngân sách',
  salary_hold: '🔒 Giữ lương',
  auto_raise: '📈 Tăng lương tự động',
}

const keyLabels: Record<string, string> = {
  days_per_month: 'Ngày/tháng', hours_per_day: 'Giờ/ngày',
  ot_coefficient: 'Hệ số OT', night_coefficient: 'Hệ số đêm', holiday_coefficient: 'Hệ số lễ',
  probation_rate: 'Tỷ lệ thử việc', bhxh_employee: 'BHXH (NV)', bhxh_company: 'BHXH (CT)',
  bhyt_employee: 'BHYT (NV)', bhyt_company: 'BHYT (CT)', bhtn_employee: 'BHTN (NV)', bhtn_company: 'BHTN (CT)',
  tax_bracket_1: 'Thuế bậc 1', monthly_budget: 'Ngân sách/tháng', warning_threshold: 'Ngưỡng cảnh báo',
  auto_lock_day: 'Ngày khóa', default_hold_percent: 'Tỷ lệ giữ %', hold_duration_months: 'Thời gian (tháng)',
  auto_release: 'Tự động trả', min_tenure_months: 'Thâm niên tối thiểu', min_kpi_score: 'KPI tối thiểu',
  raise_step: 'Bước tăng', max_raise_percent: 'Tăng tối đa %', review_frequency: 'Chu kỳ review',
}

export default function SettingsPayrollPage() {
  const sections = Object.entries(settingsPayroll)

  return (
    <AppShell title="Cài đặt lương">
      <div className="space-y-4">
        <div className="card animate-fade-in" style={{ background: 'var(--primary-50)' }}>
          <div className="flex items-center gap-2">
            <DollarSign size={18} style={{ color: 'var(--primary)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--primary)' }}>Cấu hình tính lương</span>
          </div>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Thay đổi sẽ áp dụng cho kỳ lương tiếp theo</p>
        </div>

        {sections.map(([key, values], idx) => (
          <div key={key} className="card animate-slide-up" style={{ animationDelay: `${idx * 0.05}s` }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
              {sectionLabels[key] || key}
            </h3>
            <div className="space-y-2">
              {Object.entries(values as Record<string, unknown>).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between p-2 rounded-lg" style={{ background: 'var(--gray-50)' }}>
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{keyLabels[k] || k}</span>
                  <span className="text-xs font-bold" style={{ color: 'var(--primary)' }}>
                    {typeof v === 'number' && v >= 1000 ? v.toLocaleString('vi-VN') + '₫' : String(v)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  )
}
