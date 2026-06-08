import React from 'react'
import { getOnboardingAuditEntries } from '@/lib/career-path-service'
import type { OnboardingSettingsAuditEntry } from '@/lib/career-path-types'

export function OnboardingAuditLogSection({
  entries,
}: {
  entries?: OnboardingSettingsAuditEntry[]
}) {
  const rows = entries ?? getOnboardingAuditEntries()

  return (
    <div style={sectionStyle}>
      <div style={titleStyle}>Audit log</div>
      {rows.length > 0 ? (
        <div style={tableWrapperStyle}>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Thời gian</th>
                <th style={thStyle}>Hành động</th>
                <th style={thStyle}>Đối tượng</th>
                <th style={thStyle}>Mô tả</th>
                <th style={thStyle}>Trường đổi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((entry) => (
                <tr key={entry.id}>
                  <td style={tdStyle}>{formatDate(entry.created_at)}</td>
                  <td style={tdStyle}>{entry.event_type}</td>
                  <td style={tdStyle}>{entry.entity_type}</td>
                  <td style={tdStyle}>{entry.summary}</td>
                  <td style={tdStyle}>{entry.changed_fields.join(', ') || 'Không có'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={emptyTextStyle}>Chưa có lịch sử thay đổi onboarding nào.</div>
      )}
    </div>
  )
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

const sectionStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const titleStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#111827' }
const tableWrapperStyle: React.CSSProperties = { overflowX: 'auto', border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }
const tableStyle: React.CSSProperties = { width: '100%', borderCollapse: 'collapse' }
const thStyle: React.CSSProperties = { textAlign: 'left', fontSize: 11, color: '#667085', padding: 12, borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }
const tdStyle: React.CSSProperties = { fontSize: 12, color: '#111827', padding: 12, borderBottom: '1px solid #f2f4f7', verticalAlign: 'top' }
const emptyTextStyle: React.CSSProperties = { fontSize: 12, color: '#667085', padding: 12, border: '1px solid #e5e7eb', borderRadius: 12, background: '#fff' }
