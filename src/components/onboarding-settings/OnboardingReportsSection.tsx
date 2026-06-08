import React from 'react'
import {
  getOnboardingChecklistTemplates,
  getOnboardingRoleSettings,
  getUnmatchedOnboardingRoleEmployees,
  validateOnboardingRoleSettings,
} from '@/lib/career-path-service'

export function OnboardingReportsSection() {
  const settings = getOnboardingRoleSettings()
  const templates = getOnboardingChecklistTemplates()
  const issues = validateOnboardingRoleSettings(settings)
  const unmatchedEmployees = getUnmatchedOnboardingRoleEmployees(settings)
  const publishedCount = templates.filter((template) => template.status === 'published').length
  const draftCount = templates.filter((template) => template.status === 'draft').length
  const archivedCount = templates.filter((template) => template.status === 'archived').length
  const roleIssueCount = new Set(
    issues
      .filter((issue) => ['missing_template', 'template_not_found', 'template_role_mismatch'].includes(issue.code))
      .map((issue) => issue.role_code)
      .filter(Boolean),
  ).size

  return (
    <div style={sectionStyle}>
      <div style={titleStyle}>Báo cáo</div>
      <div style={gridStyle}>
        <MetricCard label="Role lỗi checklist" value={String(roleIssueCount)} tone={roleIssueCount > 0 ? 'warning' : 'neutral'} />
        <MetricCard label="Template phát hành" value={String(publishedCount)} tone="neutral" />
        <MetricCard label="Template nháp" value={String(draftCount)} tone="neutral" />
        <MetricCard label="Template lưu trữ" value={String(archivedCount)} tone="neutral" />
        <MetricCard label="Nhân viên chưa khớp role" value={String(unmatchedEmployees.length)} tone={unmatchedEmployees.length > 0 ? 'warning' : 'neutral'} />
      </div>

      <div style={splitGridStyle}>
        <div style={panelStyle}>
          <div style={panelTitleStyle}>Vai trò cần xử lý</div>
          {issues.length > 0 ? issues.slice(0, 6).map((issue, index) => (
            <div key={`${issue.code}-${index}`} style={listItemStyle}>
              <div style={itemTitleStyle}>{issue.role_code ?? 'Cấu hình chung'}</div>
              <div style={itemMetaStyle}>{issue.message}</div>
            </div>
          )) : <div style={emptyTextStyle}>Không có lỗi cấu hình role nào.</div>}
        </div>

        <div style={panelStyle}>
          <div style={panelTitleStyle}>Nhân viên chưa có lộ trình</div>
          {unmatchedEmployees.length > 0 ? unmatchedEmployees.slice(0, 6).map((employee) => (
            <div key={employee.employee_id} style={listItemStyle}>
              <div style={itemTitleStyle}>{employee.employee_name}</div>
              <div style={itemMetaStyle}>{employee.position_name} • {employee.unmatched_reason}</div>
            </div>
          )) : <div style={emptyTextStyle}>Tất cả nhân viên mới đều đã có lộ trình onboarding.</div>}
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, tone }: { label: string; value: string; tone: 'neutral' | 'warning' }) {
  return (
    <div style={{ ...metricCardStyle, borderColor: tone === 'warning' ? '#f3c0bc' : '#e5e7eb' }}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={{ ...metricValueStyle, color: tone === 'warning' ? '#b42318' : '#111827' }}>{value}</div>
    </div>
  )
}

const sectionStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const titleStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#111827' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }
const metricCardStyle: React.CSSProperties = { padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff' }
const metricLabelStyle: React.CSSProperties = { fontSize: 11, color: '#667085' }
const metricValueStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, marginTop: 6 }
const splitGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }
const panelStyle: React.CSSProperties = { padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', display: 'grid', gap: 8 }
const panelTitleStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#111827' }
const listItemStyle: React.CSSProperties = { padding: 10, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }
const itemTitleStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#111827' }
const itemMetaStyle: React.CSSProperties = { fontSize: 11, color: '#667085', marginTop: 4 }
const emptyTextStyle: React.CSSProperties = { fontSize: 12, color: '#667085' }
