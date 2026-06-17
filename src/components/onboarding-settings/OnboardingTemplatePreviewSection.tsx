import React from 'react'
import { getPublishedOnboardingChecklistTemplate } from '@/lib/career-path-service'
import { buildOnboardingRuntimeDays, buildOnboardingRuntimeSummary } from '@/lib/services/onboarding-content-runtime-service'
import { buildOnboardingTemplateDiffSummary } from '@/lib/services/onboarding-template-diff-service'
import type { OnboardingChecklistTemplate } from '@/lib/career-path-types'

export function OnboardingTemplatePreviewSection({
  template,
}: {
  template: OnboardingChecklistTemplate | null
}) {
  if (!template) {
    return (
      <div style={sectionStyle}>
        <div style={titleStyle}>Xem trước trải nghiệm</div>
        <div style={textStyle}>Chọn một mẫu quy trình để xem nhanh hành trình nhân viên và góc nhìn vận hành.</div>
      </div>
    )
  }

  const summary = buildOnboardingRuntimeSummary(template.id)
  const days = buildOnboardingRuntimeDays(template.id)
  const baseline = getPublishedOnboardingChecklistTemplate(template.role_code)
  const diff = buildOnboardingTemplateDiffSummary(
    template.id,
    baseline && baseline.id !== template.id ? baseline.id : null,
  )

  return (
    <div style={sectionStyle}>
      <div style={titleStyle}>Xem trước trải nghiệm</div>
      <div style={cardGridStyle}>
        <MetricCard label="Tổng số ngày" value={String(summary.total_days)} />
        <MetricCard label="Tổng số việc" value={String(summary.total_items)} />
        <MetricCard label="Ngày có phần trọng tâm" value={String(summary.focus_days)} />
        <MetricCard label="Nhóm nội dung thêm/bớt" value={`${diff.topic_added}/${diff.topic_removed}`} />
      </div>

      <div style={splitGridStyle}>
        <div style={panelStyle}>
          <div style={panelTitleStyle}>Góc nhìn nhân viên</div>
          <div style={listStyle}>
            {days.slice(0, 5).map((day) => (
              <div key={day.dayIndex} style={listItemStyle}>
                <div style={itemTitleStyle}>{day.title}</div>
                <div style={itemMetaStyle}>{day.stageLabel} • {day.allItems.length} việc</div>
              </div>
            ))}
          </div>
        </div>

        <div style={panelStyle}>
          <div style={panelTitleStyle}>Góc nhìn vận hành</div>
          <div style={listStyle}>
            {days.filter((day) => day.focusItems.length > 0).slice(0, 5).map((day) => (
              <div key={day.dayIndex} style={listItemStyle}>
                <div style={itemTitleStyle}>{day.title}</div>
                <div style={itemMetaStyle}>{day.focusItems.length} việc trọng tâm</div>
              </div>
            ))}
            {days.every((day) => day.focusItems.length === 0) ? (
              <div style={emptyTextStyle}>Mẫu này chưa có việc trọng tâm cho vận hành.</div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={metricCardStyle}>
      <div style={metricLabelStyle}>{label}</div>
      <div style={metricValueStyle}>{value}</div>
    </div>
  )
}

const sectionStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
}
const titleStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#111827' }
const textStyle: React.CSSProperties = { fontSize: 12, color: '#667085' }
const cardGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }
const metricCardStyle: React.CSSProperties = { padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff' }
const metricLabelStyle: React.CSSProperties = { fontSize: 11, color: '#667085' }
const metricValueStyle: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: '#111827', marginTop: 6 }
const splitGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }
const panelStyle: React.CSSProperties = { padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff', display: 'grid', gap: 8 }
const panelTitleStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#111827' }
const listStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const listItemStyle: React.CSSProperties = { padding: 10, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }
const itemTitleStyle: React.CSSProperties = { fontSize: 12, fontWeight: 600, color: '#111827' }
const itemMetaStyle: React.CSSProperties = { fontSize: 11, color: '#667085', marginTop: 4 }
const emptyTextStyle: React.CSSProperties = { fontSize: 12, color: '#667085' }