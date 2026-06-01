import React from 'react'

export const onboardingUrgentIssueTitles = [
  'Nhân viên chưa khớp role',
  'Role đang bật nhưng chưa có checklist',
  'Chức danh bị gán trùng',
] as const

export type OnboardingSettingsUrgentRow = {
  title: string
  description: string
  count: number
  href: string
}

export function OnboardingSettingsUrgentPanel({ rows }: { rows: OnboardingSettingsUrgentRow[] }) {
  const totalCount = rows.reduce((sum, row) => sum + row.count, 0)

  return (
    <div style={{ marginBottom: 14, padding: 12, borderRadius: 12, background: '#fffaf0', border: '1px solid #f4d7a1' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700 }}>Cần xử lý ngay</div>
        <div style={{ fontSize: 11, color: '#8a5b13' }}>{totalCount} mục</div>
      </div>
      <div style={{ fontSize: 11, color: '#8a5b13', lineHeight: 1.5, marginBottom: 10 }}>
        Ưu tiên xử lý các lỗi cấu hình có thể làm nhân viên mới không nhận đúng lộ trình onboarding.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
        {rows.map((row) => (
          <div key={row.title} style={{ padding: '12px 14px', borderRadius: 12, background: '#fff', border: '1px solid #f4d7a1' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>{row.title}</div>
                <div style={{ fontSize: 11, color: '#8a5b13', marginTop: 2 }}>{row.description}</div>
              </div>
              <a href={row.href} style={{ color: '#2F6FA8', fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                Xem và sửa
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

