'use client'

import React from 'react'
import type { OnboardingPublishValidationReport } from '@/lib/career-path-types'

export function OnboardingPublishValidationPanel({
  report,
  onRefresh,
  onPublish,
  publishDisabled,
}: {
  report: OnboardingPublishValidationReport | null
  onRefresh: () => void
  onPublish: () => void
  publishDisabled?: boolean
}) {
  const blockingCount = report?.blocking_issues.length ?? 0
  const canPublish = blockingCount === 0 && !publishDisabled

  return (
    <div style={panelStyle}>
      <div style={headerStyle}>
        <div>
          <div style={titleStyle}>Kiểm tra trước khi dùng</div>
          <div style={subtitleStyle}>
            {report ? `Đã kiểm tra lúc ${formatDate(report.checked_at)}.` : 'Chưa chạy kiểm tra trước khi dùng.'}
          </div>
        </div>
        <div style={actionRowStyle}>
          <button type="button" onClick={onRefresh} style={secondaryButtonStyle}>
            Làm mới kiểm tra
          </button>
          <button type="button" onClick={onPublish} disabled={!canPublish} style={{ ...primaryButtonStyle, opacity: canPublish ? 1 : 0.6, cursor: canPublish ? 'pointer' : 'not-allowed' }}>
            Đưa vào sử dụng
          </button>
        </div>
      </div>

      <div style={summaryRowStyle}>
        <div style={{ ...metricCardStyle, borderColor: blockingCount > 0 ? '#f3c0bc' : '#b7e0c2' }}>
          <div style={metricLabelStyle}>Lỗi chặn đưa vào sử dụng</div>
          <div style={{ ...metricValueStyle, color: blockingCount > 0 ? '#b42318' : '#067647' }}>{blockingCount}</div>
        </div>
      </div>

      {blockingCount > 0 ? (
        <div style={issueListStyle}>
          {report?.blocking_issues.map((issue) => (
            <div key={`${issue.code}-${issue.template_id}`} style={issueRowStyle}>
              <div style={issueCodeStyle}>{issue.code}</div>
              <div style={issueMessageStyle}>{issue.message}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={passStyle}>Quy trình đủ điều kiện đưa vào sử dụng.</div>
      )}
    </div>
  )
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const panelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 12,
  padding: 12,
  borderRadius: 12,
  border: '1px solid #e5e7eb',
  background: '#fff',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  gap: 12,
  alignItems: 'flex-start',
  flexWrap: 'wrap',
}

const titleStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#111827' }
const subtitleStyle: React.CSSProperties = { fontSize: 12, color: '#667085', marginTop: 4 }
const actionRowStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const summaryRowStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }
const metricCardStyle: React.CSSProperties = { padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: '#f8fafc' }
const metricLabelStyle: React.CSSProperties = { fontSize: 11, color: '#667085' }
const metricValueStyle: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginTop: 6 }
const issueListStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const issueRowStyle: React.CSSProperties = { padding: 10, borderRadius: 10, background: '#fff3f2', border: '1px solid #f3c0bc' }
const issueCodeStyle: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: '#b42318', textTransform: 'uppercase' }
const issueMessageStyle: React.CSSProperties = { fontSize: 12, color: '#7a271a', marginTop: 4, lineHeight: 1.5 }
const passStyle: React.CSSProperties = { padding: 10, borderRadius: 10, background: '#ecfdf3', border: '1px solid #b7e0c2', fontSize: 12, color: '#067647' }
const primaryButtonStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontSize: 11, fontWeight: 600 }
const secondaryButtonStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d5dd', background: '#fff', color: '#344054', fontSize: 11, fontWeight: 600, cursor: 'pointer' }