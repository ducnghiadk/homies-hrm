import React from 'react'
import type { TrialWorkflowGeneralInfoRow } from './buildTrialWorkflowSetupViewModel'
import type { TrialWorkflowTabKey } from './TrialWorkflowTabBar'

const foundationSummary =
  'HR cần chốt lần lượt: Thời gian thử việc, Mốc bắt đầu tính thử việc, Người theo dõi chính, Người phối hợp, Nguyên tắc chốt cuối kỳ, Nơi lưu ghi nhận cuối kỳ.'

export function TrialWorkflowGeneralInfoTab({
  rows,
  onJump,
}: {
  rows: TrialWorkflowGeneralInfoRow[]
  onJump: (tab: TrialWorkflowTabKey) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={helperBoxStyle}>{foundationSummary}</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type={'button'} onClick={() => onJump('general')} style={quickActionStyle}>
          Sửa nhanh thời gian
        </button>
        <button type={'button'} onClick={() => onJump('general')} style={quickActionStyle}>
          Sửa người theo dõi
        </button>
        <button type={'button'} onClick={() => onJump('gates')} style={primaryActionStyle}>
          Thiết lập nguyên tắc chốt
        </button>
      </div>

      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Mục cần thiết lập</th>
              <th style={thStyle}>Giá trị hiện tại</th>
              <th style={thStyle}>Trạng thái</th>
              <th style={thStyle}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={tdStyle}>{row.label}</td>
                <td style={tdStyle}>{row.value}</td>
                <td style={tdStyle}>{row.status}</td>
                <td style={tdStyle}>
                  <button type={'button'} onClick={() => onJump(row.targetTab)} style={actionButtonStyle}>
                    {row.actionLabel}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const helperBoxStyle: React.CSSProperties = {
  padding: 12,
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#f8fafc',
  fontSize: 12,
  lineHeight: 1.6,
  color: '#475467',
}
const tableWrapStyle: React.CSSProperties = { overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 16, background: '#fff' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const thStyle: React.CSSProperties = { padding: 12, textAlign: 'left', fontSize: 11, color: '#667085', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }
const tdStyle: React.CSSProperties = { padding: 12, fontSize: 12, color: '#111827', borderBottom: '1px solid #f2f4f7', verticalAlign: 'top' }
const quickActionStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d5dd', background: '#fff', color: '#344054', fontSize: 11, fontWeight: 600, cursor: 'pointer' }
const primaryActionStyle: React.CSSProperties = { ...quickActionStyle, border: '1px solid #1d4ed8', background: '#eff6ff', color: '#1d4ed8' }
const actionButtonStyle: React.CSSProperties = quickActionStyle
