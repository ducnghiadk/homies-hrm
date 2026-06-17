import React from 'react'
import type { TrialWorkflowTabKey } from './TrialWorkflowTabBar'

export type TrialWorkflowMissingItem = {
  id: string
  label: string
  tabKey: TrialWorkflowTabKey
  tabLabel: string
  actionLabel: string
}

export function TrialWorkflowMissingItemsTable({
  title,
  rows,
  onSelect,
}: {
  title: string
  rows: TrialWorkflowMissingItem[]
  onSelect?: (tab: TrialWorkflowTabKey) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{title}</div>
      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Mục còn thiếu</th>
              <th style={thStyle}>Nằm ở thẻ</th>
              <th style={thStyle}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? rows.map((row) => (
              <tr key={row.id}>
                <td style={tdStyle}>{row.label}</td>
                <td style={tdStyle}>{row.tabLabel}</td>
                <td style={tdStyle}>
                  {onSelect ? (
                    <button type="button" onClick={() => onSelect(row.tabKey)} style={actionButtonStyle}>
                      {row.actionLabel}
                    </button>
                  ) : row.actionLabel}
                </td>
              </tr>
            )) : (
              <tr>
                <td style={emptyCellStyle} colSpan={3}>Chưa có chỗ thiếu nào ở thẻ này.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const tableWrapStyle: React.CSSProperties = { overflowX: 'auto', borderRadius: 16, border: '1px solid #e5e7eb', background: '#fff' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const thStyle: React.CSSProperties = { padding: 12, textAlign: 'left', fontSize: 11, color: '#667085', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }
const tdStyle: React.CSSProperties = { padding: 12, fontSize: 12, color: '#111827', borderBottom: '1px solid #f2f4f7', verticalAlign: 'top' }
const emptyCellStyle: React.CSSProperties = { ...tdStyle, color: '#667085', textAlign: 'center' }
const actionButtonStyle: React.CSSProperties = {
  padding: '7px 10px',
  borderRadius: 8,
  border: '1px solid #d0d5dd',
  background: '#fff',
  color: '#344054',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
}