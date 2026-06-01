import React from 'react'

export type OnboardingSettingsAdminRailLink = {
  label: string
  href: string
}

export type OnboardingSettingsAdminRailStat = {
  label: string
  value: string
  tone?: 'neutral' | 'warning' | 'danger'
}

export function OnboardingSettingsAdminRail({
  saveMessage,
  saveTone,
  stats,
  links,
}: {
  saveMessage: string
  saveTone: 'idle' | 'success' | 'error'
  stats: OnboardingSettingsAdminRailStat[]
  links: OnboardingSettingsAdminRailLink[]
}) {
  return (
    <aside id="admin-rail" style={{ display: 'grid', gap: 12, position: 'sticky', top: 16, alignSelf: 'start' }}>
      <div style={railCardStyle}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', color: '#667085' }}>Bảng điều khiển</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', marginTop: 6 }}>Trạng thái lưu</div>
        <div style={{ fontSize: 12, color: saveTone === 'error' ? '#b42318' : saveTone === 'success' ? '#2f4acb' : '#475467', marginTop: 8, lineHeight: 1.5 }}>
          {saveMessage}
        </div>
      </div>

      <div style={railCardStyle}>
        <div style={railSectionTitleStyle}>Chỉ số nhanh</div>
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: '#475467' }}>{stat.label}</div>
              <div style={{ ...railStatValueStyle, color: getToneColor(stat.tone ?? 'neutral') }}>{stat.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={railCardStyle}>
        <div style={railSectionTitleStyle}>Đi tới nhanh</div>
        <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
          {links.map((link) => (
            <a key={link.label} href={link.href} style={{ fontSize: 12, fontWeight: 700, color: '#2F6FA8', textDecoration: 'none' }}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </aside>
  )
}

function getToneColor(tone: 'neutral' | 'warning' | 'danger'): string {
  if (tone === 'warning') return '#8a5b13'
  if (tone === 'danger') return '#b42318'
  return '#111827'
}

const railCardStyle: React.CSSProperties = {
  padding: '14px 16px',
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  background: '#fff',
  boxShadow: '0 12px 28px rgba(15, 23, 42, 0.04)',
}

const railSectionTitleStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: '#111827',
}

const railStatValueStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
}
