import React, { useState } from 'react'
import type { OnboardingChecklistTemplate, OnboardingRoleSetting, OnboardingRoleSettingsValidationIssue } from '@/lib/career-path-types'

export const onboardingRoleCardActionLabels = ['Đổi checklist', 'Mở chi tiết', 'Tìm chức danh', 'Chưa có checklist'] as const

type PositionOption = {
  id: string
  name: string
}

type PositionFilterKey = 'all' | 'assigned' | 'unassigned' | 'duplicate'

const positionFilterOptions: Array<{ key: PositionFilterKey; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'assigned', label: 'Đã gán' },
  { key: 'unassigned', label: 'Chưa gán' },
  { key: 'duplicate', label: 'Đang trùng' },
]

export function OnboardingRoleCard({
  role,
  templates,
  positions,
  issues,
  duplicatePositionIds,
  onToggleEnabled,
  onLabelChange,
  onTemplateChange,
  onTogglePosition,
}: {
  role: OnboardingRoleSetting
  templates: OnboardingChecklistTemplate[]
  positions: PositionOption[]
  issues: OnboardingRoleSettingsValidationIssue[]
  duplicatePositionIds: string[]
  onToggleEnabled: () => void
  onLabelChange: (next: string) => void
  onTemplateChange: (next: string) => void
  onTogglePosition: (positionId: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [positionFilter, setPositionFilter] = useState<PositionFilterKey>('all')

  const selectedTemplate = templates.find((template) => template.id === role.template_id) ?? null
  const filteredPositions = positions.filter((position) => {
    const normalizedSearch = searchValue.trim().toLowerCase()
    const matchesSearch = normalizedSearch.length === 0 || `${position.name} ${position.id}`.toLowerCase().includes(normalizedSearch)
    const assigned = role.position_ids.includes(position.id)
    const duplicate = duplicatePositionIds.includes(position.id)

    if (!matchesSearch) return false
    if (positionFilter === 'assigned') return assigned
    if (positionFilter === 'unassigned') return !assigned
    if (positionFilter === 'duplicate') return duplicate
    return true
  })

  return (
    <article style={{ padding: 16, borderRadius: 16, background: '#fff', border: '1px solid #e5e7eb', boxShadow: '0 12px 28px rgba(15, 23, 42, 0.04)' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) auto', gap: 16, alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{role.label || role.role_code}</div>
          <div style={{ fontSize: 11, color: '#667085', marginTop: 2 }}>{role.role_code} • Thứ tự {role.sort_order}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            <div style={statusBadgeStyle(role.enabled)}>{role.enabled ? 'Đang bật' : 'Đang tắt'}</div>
            <div style={metaPillStyle}>{role.position_ids.length} chức danh</div>
            <div style={metaPillStyle}>{selectedTemplate ? `${selectedTemplate.role_label} • v${selectedTemplate.version}` : 'Chưa có checklist'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignContent: 'flex-start' }}>
          <button type="button" onClick={onToggleEnabled} style={actionButtonStyle(role.enabled ? '#f2f4f7' : '#ebfdf3', role.enabled ? '#344054' : '#027a48')}>
            {role.enabled ? 'Tắt' : 'Bật'}
          </button>
          <button type="button" onClick={() => setExpanded(true)} style={actionButtonStyle('#eef2ff', '#3646c5')}>
            Đổi checklist
          </button>
          <button type="button" onClick={() => setExpanded((current) => !current)} style={actionButtonStyle('#fff', '#344054')}>
            {expanded ? 'Thu gọn' : 'Mở chi tiết'}
          </button>
        </div>
      </div>

      {issues.length > 0 ? (
        <div style={{ display: 'grid', gap: 6, marginTop: 12 }}>
          {issues.map((issue, index) => (
            <div key={`${issue.code}-${index}`} style={{ fontSize: 11, color: '#b42318', lineHeight: 1.5 }}>
              {issue.message}
            </div>
          ))}
        </div>
      ) : null}

      {expanded ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 340px) minmax(0, 1fr)', gap: 16, marginTop: 16, paddingTop: 16, borderTop: '1px solid #f2f4f7' }}>
          <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
            <label style={{ display: 'grid', gap: 6 }}>
              <div style={fieldLabelStyle}>Tên hiển thị</div>
              <input
                type="text"
                value={role.label}
                onChange={(event) => onLabelChange(event.target.value)}
                style={fieldControlStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: 6 }}>
              <div style={fieldLabelStyle}>Checklist áp dụng</div>
              <select
                value={role.template_id ?? ''}
                onChange={(event) => onTemplateChange(event.target.value)}
                style={fieldControlStyle}
              >
                <option value="">Chưa có checklist</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.role_label} • v{template.version} • {template.id}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={fieldLabelStyle}>Chức danh áp dụng</div>
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                placeholder="Tìm chức danh"
                style={{ ...fieldControlStyle, maxWidth: 260 }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {positionFilterOptions.map((filterOption) => {
                const active = filterOption.key === positionFilter
                return (
                  <button
                    key={filterOption.key}
                    type="button"
                    onClick={() => setPositionFilter(filterOption.key)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 999,
                      border: active ? '1px solid #667eea' : '1px solid #d0d5dd',
                      background: active ? '#eef2ff' : '#fff',
                      color: active ? '#3646c5' : '#344054',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {filterOption.label}
                  </button>
                )
              })}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 10 }}>
              {filteredPositions.length > 0 ? (
                filteredPositions.map((position) => {
                  const checked = role.position_ids.includes(position.id)
                  const duplicate = duplicatePositionIds.includes(position.id)
                  return (
                    <label
                      key={`${role.role_code}-${position.id}`}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: `1px solid ${duplicate ? '#f3c0bc' : checked ? '#a5b4fc' : '#e5e7eb'}`,
                        background: checked ? '#f8faff' : '#fff',
                        cursor: 'pointer',
                      }}
                    >
                      <input type="checkbox" checked={checked} onChange={() => onTogglePosition(position.id)} style={{ marginTop: 2 }} />
                      <div style={{ display: 'grid', gap: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#111827' }}>{position.name}</span>
                        <span style={{ fontSize: 10, color: '#667085' }}>{position.id}</span>
                        {duplicate ? <span style={{ fontSize: 10, color: '#b42318' }}>Đang trùng ở nhiều role</span> : null}
                      </div>
                    </label>
                  )
                })
              ) : (
                <div style={{ fontSize: 11, color: '#667085', gridColumn: '1 / -1' }}>Không tìm thấy chức danh phù hợp.</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  )
}

function actionButtonStyle(background: string, color: string): React.CSSProperties {
  return {
    padding: '7px 10px',
    borderRadius: 8,
    border: '1px solid #d0d5dd',
    background,
    color,
    fontSize: 11,
    fontWeight: 600,
    cursor: 'pointer',
  }
}

function statusBadgeStyle(enabled: boolean): React.CSSProperties {
  return {
    padding: '4px 8px',
    borderRadius: 999,
    background: enabled ? '#ebfdf3' : '#f2f4f7',
    color: enabled ? '#027a48' : '#344054',
    fontSize: 10,
    fontWeight: 700,
  }
}

const metaPillStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: 999,
  background: '#f8fafc',
  color: '#475467',
  fontSize: 10,
  fontWeight: 600,
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: '#344054',
}

const fieldControlStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid #d0d5dd',
  background: '#fff',
  fontSize: 12,
}
