import React from 'react'
import type { OnboardingChecklistTemplate } from '@/lib/career-path-types'
import { OnboardingTemplateLibrarySection } from './OnboardingTemplateLibrarySection'
import type { TrialWorkflowStageRow } from './buildTrialWorkflowSetupViewModel'
import type { TrialWorkflowTabKey } from './TrialWorkflowTabBar'

const stageSummary =
  'Bốn chặng thử việc cần được chốt theo Tên chặng, Mục tiêu chặng, Người phụ trách chính, Mốc thời gian và Trạng thái hoàn tất trước khi soạn việc chi tiết.'

export function TrialWorkflowStagesTab({
  rows,
  templates,
  topicCountByTemplate,
  selectedTemplateId,
  onSelectTemplate,
  onJump,
}: {
  rows: TrialWorkflowStageRow[]
  templates: OnboardingChecklistTemplate[]
  topicCountByTemplate: Record<string, number>
  selectedTemplateId: string | null
  onSelectTemplate: (templateId: string) => void
  onJump: (tab: TrialWorkflowTabKey) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={helperBoxStyle}>{stageSummary}</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type={'button'} onClick={() => onJump('stages')} style={quickActionStyle}>
          Thêm chặng
        </button>
        <button type={'button'} onClick={() => onJump('stages')} style={quickActionStyle}>
          Đổi thứ tự
        </button>
        <button type={'button'} onClick={() => onJump('stages')} style={quickActionStyle}>
          Ẩn chặng
        </button>
        <button type={'button'} onClick={() => onJump('tasks')} style={primaryActionStyle}>
          Xem việc trong chặng
        </button>
      </div>

      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Tên chặng</th>
              <th style={thStyle}>Mục tiêu chặng</th>
              <th style={thStyle}>Người phụ trách chính</th>
              <th style={thStyle}>Mốc thời gian</th>
              <th style={thStyle}>Trạng thái hoàn tất</th>
              <th style={thStyle}>Trạng thái</th>
              <th style={thStyle}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={tdStyle}>{row.stageName}</td>
                <td style={tdStyle}>{row.goalLabel}</td>
                <td style={tdStyle}>{row.ownerLabel}</td>
                <td style={tdStyle}>{row.timelineLabel}</td>
                <td style={tdStyle}>{row.completionLabel}</td>
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

      <OnboardingTemplateLibrarySection
        templates={templates}
        topicCountByTemplate={topicCountByTemplate}
        selectedTemplateId={selectedTemplateId}
        onSelectTemplate={onSelectTemplate}
      />
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
