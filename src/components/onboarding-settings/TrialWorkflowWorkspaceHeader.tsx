import React from 'react'

export const TRIAL_WORKFLOW_HEADER_TITLE = 'Thiết lập quy trình thử việc'
export const TRIAL_WORKFLOW_HEADER_SUBTITLE = 'Tạo quy trình thử việc chuẩn để nhân viên mới được giao đúng việc theo từng giai đoạn.'

export function TrialWorkflowWorkspaceHeader({
  title = TRIAL_WORKFLOW_HEADER_TITLE,
  subtitle = TRIAL_WORKFLOW_HEADER_SUBTITLE,
}: {
  title?: string
  subtitle?: string
}) {
  return (
    <section style={{ display: 'grid', gap: 8 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#7A6B53' }}>
        Thiết lập cho HR
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, color: '#001D3D' }}>{title}</h1>
      <p style={{ margin: 0, maxWidth: 760, fontSize: 14, lineHeight: 1.7, color: '#5F6B7A' }}>{subtitle}</p>
    </section>
  )
}