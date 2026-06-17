'use client'

import React from 'react'
import type {
  OnboardingChecklistItemTemplate,
  OnboardingChecklistStage,
  OnboardingContentTopic,
} from '@/lib/career-path-types'

export interface OnboardingTemplateItemEditorProps {
  items: OnboardingChecklistItemTemplate[]
  topics: OnboardingContentTopic[]
  stages: OnboardingChecklistStage[]
  onAddItem: () => void
  onUpdateItem: (itemId: string, patch: Partial<OnboardingChecklistItemTemplate>) => void
}

export function OnboardingTemplateItemEditor({
  items,
  topics,
  stages,
  onAddItem,
  onUpdateItem,
}: OnboardingTemplateItemEditorProps) {
  const sortedItems = [...items].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <div style={titleStyle}>Mục checklist</div>
          <div style={subtitleStyle}>Sửa nội dung, chặng, chủ đề và mức hiển thị của từng mục.</div>
        </div>
        <button type="button" onClick={onAddItem} style={primaryButtonStyle}>
          Thêm mục
        </button>
      </div>

      <div style={listStyle}>
        {sortedItems.length > 0 ? (
          sortedItems.map((item) => (
            <div key={item.id} style={rowStyle}>
              <input
                type="text"
                value={item.title}
                onChange={(event) => onUpdateItem(item.id, { title: event.target.value })}
                placeholder="Tiêu đề công việc"
                style={inputStyle}
              />

              <div style={gridStyle}>
                <select value={item.topic_id} onChange={(event) => onUpdateItem(item.id, { topic_id: event.target.value })} style={inputStyle}>
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>{topic.label}</option>
                  ))}
                </select>

                <select value={item.stage_id} onChange={(event) => onUpdateItem(item.id, { stage_id: event.target.value })} style={inputStyle}>
                  {stages.map((stage) => (
                    <option key={stage.id} value={stage.id}>{stage.label}</option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  value={item.estimated_minutes}
                  onChange={(event) => onUpdateItem(item.id, { estimated_minutes: Number(event.target.value) })}
                  style={inputStyle}
                />

                <select
                  value={item.ops_visibility}
                  onChange={(event) => onUpdateItem(item.id, { ops_visibility: event.target.value as OnboardingChecklistItemTemplate['ops_visibility'] })}
                  style={inputStyle}
                >
                  <option value="employee_visible">Nhân viên nhìn thấy</option>
                  <option value="ops_only">Chỉ vận hành</option>
                </select>
              </div>

              <div style={toggleRowStyle}>
                <label style={checkboxLabelStyle}>
                  <input type="checkbox" checked={item.is_required} onChange={(event) => onUpdateItem(item.id, { is_required: event.target.checked })} />
                  <span>Bắt buộc</span>
                </label>
                <label style={checkboxLabelStyle}>
                  <input type="checkbox" checked={item.is_focus_block_eligible} onChange={(event) => onUpdateItem(item.id, { is_focus_block_eligible: event.target.checked })} />
                  <span>Focus block</span>
                </label>
                <div style={metaStyle}>{item.code}</div>
              </div>
            </div>
          ))
        ) : (
          <div style={emptyStyle}>Chưa có mục checklist nào cho template này.</div>
        )}
      </div>
    </div>
  )
}

const sectionStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }
const titleStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#111827' }
const subtitleStyle: React.CSSProperties = { fontSize: 12, color: '#667085', marginTop: 4 }
const listStyle: React.CSSProperties = { display: 'grid', gap: 10 }
const rowStyle: React.CSSProperties = { display: 'grid', gap: 10, padding: 12, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 8 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d5dd', fontSize: 12, color: '#111827', background: '#fff' }
const toggleRowStyle: React.CSSProperties = { display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }
const checkboxLabelStyle: React.CSSProperties = { display: 'inline-flex', gap: 6, alignItems: 'center', fontSize: 12, color: '#344054' }
const metaStyle: React.CSSProperties = { marginLeft: 'auto', fontSize: 11, color: '#667085' }
const emptyStyle: React.CSSProperties = { padding: 12, borderRadius: 10, border: '1px dashed #d0d5dd', fontSize: 12, color: '#667085', background: '#f8fafc' }
const primaryButtonStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }
