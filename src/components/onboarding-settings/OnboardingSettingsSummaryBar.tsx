import React from 'react'

export const onboardingSummaryMetricLabels = [
  'Phần đã xong',
  'Chỗ còn thiếu',
  'Sẵn sàng dùng',
] as const

export type OnboardingSettingsSummaryMetric = {
  label: string
  value: number
  href: string
  tone: 'neutral' | 'warning' | 'danger'
}

const toneBorderMap: Record<OnboardingSettingsSummaryMetric['tone'], string> = {
  neutral: '#e5e7eb',
  warning: '#f4d7a1',
  danger: '#f3c0bc',
}

const toneTextMap: Record<OnboardingSettingsSummaryMetric['tone'], string> = {
  neutral: '#111827',
  warning: '#8a5b13',
  danger: '#b42318',
}

export function OnboardingSettingsSummaryBar({ metrics }: { metrics: OnboardingSettingsSummaryMetric[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
      {metrics.map((metric) => (
        <a
          key={metric.label}
          href={metric.href}
          style={{
            padding: '14px 16px',
            borderRadius: 14,
            border: `1px solid ${toneBorderMap[metric.tone]}`,
            background: '#fff',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.04)',
            textDecoration: 'none',
          }}
        >
          <div style={{ fontSize: 11, color: '#667085' }}>{metric.label}</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: toneTextMap[metric.tone], marginTop: 4 }}>{metric.value}</div>
        </a>
      ))}
    </div>
  )
}