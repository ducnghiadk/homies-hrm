'use client'

import React from 'react'
import type { OnboardingContentTopic } from '@/lib/career-path-types'

export interface OnboardingTemplateTopicEditorProps {
  topics: OnboardingContentTopic[]
  onAddTopic: () => void
  onRenameTopic: (topicId: string, label: string) => void
  onToggleTopic: (topicId: string) => void
}

export function OnboardingTemplateTopicEditor({
  topics,
  onAddTopic,
  onRenameTopic,
  onToggleTopic,
}: OnboardingTemplateTopicEditorProps) {
  const sortedTopics = [...topics].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <div style={titleStyle}>Chủ đề onboarding</div>
          <div style={subtitleStyle}>Nhóm nội dung lớn dùng để gom checklist theo chủ đề.</div>
        </div>
        <button type="button" onClick={onAddTopic} style={primaryButtonStyle}>
          Thêm chủ đề
        </button>
      </div>

      <div style={listStyle}>
        {sortedTopics.length > 0 ? (
          sortedTopics.map((topic) => (
            <div key={topic.id} style={rowStyle}>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={topic.label}
                  onChange={(event) => onRenameTopic(topic.id, event.target.value)}
                  placeholder="Tên chủ đề"
                  style={inputStyle}
                />
                <div style={metaStyle}>
                  <span>{topic.code}</span>
                  <span>{topic.active ? 'Đang dùng' : 'Tạm dừng'}</span>
                </div>
              </div>
              <button type="button" onClick={() => onToggleTopic(topic.id)} style={secondaryButtonStyle}>
                {topic.active ? 'Tạm dừng' : 'Kích hoạt'}
              </button>
            </div>
          ))
        ) : (
          <div style={emptyStyle}>Chưa có chủ đề nào cho template này.</div>
        )}
      </div>
    </div>
  )
}

const sectionStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff' }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }
const titleStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#111827' }
const subtitleStyle: React.CSSProperties = { fontSize: 12, color: '#667085', marginTop: 4 }
const listStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const rowStyle: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', padding: 10, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d5dd', fontSize: 12, color: '#111827' }
const metaStyle: React.CSSProperties = { display: 'flex', gap: 10, marginTop: 6, fontSize: 11, color: '#667085', flexWrap: 'wrap' }
const emptyStyle: React.CSSProperties = { padding: 12, borderRadius: 10, border: '1px dashed #d0d5dd', fontSize: 12, color: '#667085', background: '#f8fafc' }
const primaryButtonStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }
const secondaryButtonStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d5dd', background: '#fff', color: '#344054', fontSize: 11, fontWeight: 600, cursor: 'pointer' }
