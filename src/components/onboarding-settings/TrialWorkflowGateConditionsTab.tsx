import React from 'react'
import type { OnboardingPublishValidationReport } from '@/lib/career-path-types'
import { OnboardingPublishValidationPanel } from './OnboardingPublishValidationPanel'
import { TrialWorkflowMissingItemsTable, type TrialWorkflowMissingItem } from './TrialWorkflowMissingItemsTable'
import type { TrialWorkflowGateRow } from './buildTrialWorkflowSetupViewModel'
import type { TrialWorkflowTabKey } from './TrialWorkflowTabBar'

const gateSummary =
  'Điều kiện qua chặng cần được rà theo Điều kiện phải có, Kết quả hiện tại, Mức bắt buộc hay hỗ trợ và Người duyệt qua chặng.'

const missingTableTitle = 'Các chỗ thiếu cần xử lý tiếp theo'

export function TrialWorkflowGateConditionsTab({
  report,
  rows,
  missingRows,
  onSelect,
  onRefresh,
  onPublish,
  publishDisabled,
}: {
  report: OnboardingPublishValidationReport | null
  rows: TrialWorkflowGateRow[]
  missingRows: TrialWorkflowMissingItem[]
  onSelect: (tab: TrialWorkflowTabKey) => void
  onRefresh: () => void
  onPublish: () => void
  publishDisabled: boolean
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={helperBoxStyle}>{gateSummary}</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type={'button'} onClick={() => onSelect('gates')} style={quickActionStyle}>
          Sửa điều kiện
        </button>
        <button type={'button'} onClick={() => onSelect('assignments')} style={quickActionStyle}>
          Chọn người duyệt
        </button>
        <button type={'button'} onClick={() => onSelect('tasks')} style={quickActionStyle}>
          Bỏ điều kiện
        </button>
      </div>

      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Điều kiện phải có</th>
              <th style={thStyle}>Kết quả hiện tại</th>
              <th style={thStyle}>Mức bắt buộc hay hỗ trợ</th>
              <th style={thStyle}>Người duyệt qua chặng</th>
              <th style={thStyle}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={tdStyle}>{row.conditionLabel}</td>
                <td style={tdStyle}>{row.currentResultLabel}</td>
                <td style={tdStyle}>{row.requirementLevelLabel}</td>
                <td style={tdStyle}>{row.approverLabel}</td>
                <td style={tdStyle}>
                  <button type={'button'} onClick={() => onSelect(row.targetTab)} style={actionButtonStyle}>
                    {row.actionLabel}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OnboardingPublishValidationPanel
        report={report}
        onRefresh={onRefresh}
        onPublish={onPublish}
        publishDisabled={publishDisabled}
      />

      <TrialWorkflowMissingItemsTable title={missingTableTitle} rows={missingRows} onSelect={onSelect} />
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
const actionButtonStyle: React.CSSProperties = quickActionStyle
