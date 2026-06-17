import React from 'react'

export function TrialWorkflowWorkspacePanel({
  id,
  title,
  helper,
  children,
}: {
  id: string
  title: string
  helper: string
  children: React.ReactNode
}) {
  return (
    <section id={id} style={panelStyle}>
      <div style={{ display: 'grid', gap: 4 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Vùng làm việc
        </div>
        <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#111827' }}>{title}</h2>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7, color: '#475467' }}>{helper}</p>
      </div>
      {children}
    </section>
  )
}

const panelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 18,
  padding: 20,
  borderRadius: 24,
  border: '1px solid #dbe4ff',
  background: '#ffffff',
  boxShadow: '0 18px 36px rgba(15, 23, 42, 0.06)',
}
