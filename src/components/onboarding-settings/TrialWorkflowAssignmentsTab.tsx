import React from 'react'
import { OnboardingRoleFilters, type OnboardingRoleFilterKey } from './OnboardingRoleFilters'
import { TrialWorkflowMissingItemsTable, type TrialWorkflowMissingItem } from './TrialWorkflowMissingItemsTable'
import type { TrialWorkflowAssignmentRow } from './buildTrialWorkflowSetupViewModel'
import type { TrialWorkflowTabKey } from './TrialWorkflowTabBar'

const assignmentSummary =
  'Phạm vi áp dụng cần được rà theo Nhóm áp dụng, Cửa hàng, Vị trí, Ngày bắt đầu dùng và Trạng thái trước khi đưa quy trình vào dùng.'

const missingTableTitle = 'Các chỗ áp dụng còn thiếu'

export function TrialWorkflowAssignmentsTab({
  rows,
  roleFilter,
  roleSearch,
  onRoleFilterChange,
  onRoleSearchChange,
  roles,
  missingRows,
  onSelectMissing,
}: {
  rows: TrialWorkflowAssignmentRow[]
  roleFilter: OnboardingRoleFilterKey
  roleSearch: string
  onRoleFilterChange: (next: OnboardingRoleFilterKey) => void
  onRoleSearchChange: (next: string) => void
  roles: React.ReactNode
  missingRows: TrialWorkflowMissingItem[]
  onSelectMissing: (tab: TrialWorkflowTabKey) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={helperBoxStyle}>{assignmentSummary}</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button type={'button'} onClick={() => onSelectMissing('assignments')} style={quickActionStyle}>
          Thêm vị trí
        </button>
        <button type={'button'} onClick={() => onSelectMissing('assignments')} style={quickActionStyle}>
          Sửa phạm vi áp dụng
        </button>
        <button type={'button'} onClick={() => onSelectMissing('assignments')} style={quickActionStyle}>
          Ngừng áp dụng
        </button>
        <button type={'button'} onClick={() => onSelectMissing('assignments')} style={primaryActionStyle}>
          Đi tới chỗ thiếu
        </button>
      </div>

      <div style={tableWrapStyle}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>Nhóm áp dụng</th>
              <th style={thStyle}>Cửa hàng</th>
              <th style={thStyle}>Vị trí</th>
              <th style={thStyle}>Ngày bắt đầu dùng</th>
              <th style={thStyle}>Trạng thái</th>
              <th style={thStyle}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id}>
                  <td style={tdStyle}>{row.groupLabel}</td>
                  <td style={tdStyle}>{row.storeLabel}</td>
                  <td style={tdStyle}>{row.positionLabel}</td>
                  <td style={tdStyle}>{row.startDateLabel}</td>
                  <td style={tdStyle}>{row.statusLabel}</td>
                  <td style={tdStyle}>
                    <button type={'button'} onClick={() => onSelectMissing(row.targetTab)} style={actionButtonStyle}>
                      {row.actionLabel}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={emptyCellStyle} colSpan={6}>
                  Chưa có nhóm áp dụng nào đang bật.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <OnboardingRoleFilters
        activeFilter={roleFilter}
        searchValue={roleSearch}
        onFilterChange={onRoleFilterChange}
        onSearchChange={onRoleSearchChange}
      />

      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>Chi tiết nhóm áp dụng</div>
        {roles}
      </div>

      <TrialWorkflowMissingItemsTable title={missingTableTitle} rows={missingRows} onSelect={onSelectMissing} />
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
const emptyCellStyle: React.CSSProperties = { ...tdStyle, color: '#667085', textAlign: 'center' }
const quickActionStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d5dd', background: '#fff', color: '#344054', fontSize: 11, fontWeight: 600, cursor: 'pointer' }
const primaryActionStyle: React.CSSProperties = { ...quickActionStyle, border: '1px solid #1d4ed8', background: '#eff6ff', color: '#1d4ed8' }
const actionButtonStyle: React.CSSProperties = quickActionStyle
