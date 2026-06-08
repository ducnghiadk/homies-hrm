import React from 'react'
import type { OnboardingChecklistTemplate } from '@/lib/career-path-types'
import { OnboardingTemplatePreviewSection } from './OnboardingTemplatePreviewSection'
import type { TrialWorkflowTaskRow } from './buildTrialWorkflowSetupViewModel'
import type { TrialWorkflowTabKey } from './TrialWorkflowTabBar'

const taskSummary =
  'Việc cần làm trong chặng này phải rõ Người làm chính, Kết quả cần có, Bắt buộc hay không, Hạn hoàn tất và Trạng thái xử lý.'

export function TrialWorkflowTasksTab({
  rows,
  template,
  activeStageLabel,
  onJump,
}: {
  rows: TrialWorkflowTaskRow[]
  template: OnboardingChecklistTemplate | null
  activeStageLabel: string
  onJump: (tab: TrialWorkflowTabKey) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={helperBoxStyle}>{taskSummary}</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type={'button'} onClick={() => onJump('tasks')} style={quickActionStyle}>
          Thêm việc mới
        </button>
        <button type={'button'} onClick={() => onJump('tasks')} style={quickActionStyle}>
          Nhân bản việc
        </button>
        <button type={'button'} onClick={() => onJump('stages')} style={quickActionStyle}>
          Chuyển sang chặng khác
        </button>
        <button type={'button'} onClick={() => onJump('gates')} style={primaryActionStyle}>
          Đánh dấu bắt buộc
        </button>
      </div>

      <div style={stageIndicatorStyle}>Đang chỉnh việc của chặng: {activeStageLabel}</div>

      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Việc cần làm</th>
              <th style={thStyle}>Người làm chính</th>
              <th style={thStyle}>Kết quả cần có</th>
              <th style={thStyle}>Bắt buộc</th>
              <th style={thStyle}>Hạn hoàn tất</th>
              <th style={thStyle}>Trạng thái</th>
              <th style={thStyle}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={tdStyle}>{row.taskLabel}</td>
                <td style={tdStyle}>{row.ownerLabel}</td>
                <td style={tdStyle}>{row.outcomeLabel}</td>
                <td style={tdStyle}>{row.requiredLabel}</td>
                <td style={tdStyle}>{row.dueLabel}</td>
                <td style={tdStyle}>{row.statusLabel}</td>
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

      <OnboardingTemplatePreviewSection template={template} />
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
const stageIndicatorStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#475467' }
const tableWrapStyle: React.CSSProperties = { overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 16, background: '#fff' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const thStyle: React.CSSProperties = { padding: 12, textAlign: 'left', fontSize: 11, color: '#667085', background: '#f8fafc', borderBottom: '1px solid #e5e7eb' }
const tdStyle: React.CSSProperties = { padding: 12, fontSize: 12, color: '#111827', borderBottom: '1px solid #f2f4f7', verticalAlign: 'top' }
const quickActionStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d5dd', background: '#fff', color: '#344054', fontSize: 11, fontWeight: 600, cursor: 'pointer' }
const primaryActionStyle: React.CSSProperties = { ...quickActionStyle, border: '1px solid #1d4ed8', background: '#eff6ff', color: '#1d4ed8' }
const actionButtonStyle: React.CSSProperties = quickActionStyle
