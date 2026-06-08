import React from 'react'
import type { OnboardingChecklistTemplate } from '@/lib/career-path-types'

export function OnboardingTemplateLibrarySection({
  templates,
  topicCountByTemplate,
  selectedTemplateId,
  onSelectTemplate,
}: {
  templates: OnboardingChecklistTemplate[]
  topicCountByTemplate: Record<string, number>
  selectedTemplateId: string | null
  onSelectTemplate: (templateId: string) => void
}) {
  return (
    <section id="templates" style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 13, fontWeight: 700 }}>Thư viện mẫu quy trình</div>
      <div style={{ fontSize: 12, color: '#667085' }}>
        Chọn mẫu HR đang rà soát để xem số nhóm nội dung, trạng thái phát hành và thời gian thử việc mặc định.
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {templates.map((template) => {
          const isSelected = template.id === selectedTemplateId
          return (
            <article
              key={template.id}
              style={{
                border: isSelected ? '1px solid #667eea' : '1px solid #e5e7eb',
                borderRadius: 12,
                padding: 12,
                background: isSelected ? '#eef2ff' : '#f8fafc',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>
                    {template.role_label} • v{template.version}
                  </div>
                  <div style={{ fontSize: 11, color: '#667085', marginTop: 4 }}>{template.name}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: template.status === 'published' ? '#1E9E57' : template.status === 'draft' ? '#B7791F' : '#667085' }}>
                    {template.status === 'published' ? 'Đang dùng' : template.status === 'draft' ? 'Bản nháp' : 'Lưu trữ'}
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectTemplate(template.id)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      border: '1px solid #d0d5dd',
                      background: '#fff',
                      color: '#344054',
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected ? 'Đang mở' : 'Mở mẫu'}
                  </button>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#475467', marginTop: 8, lineHeight: 1.5 }}>
                {topicCountByTemplate[template.id] ?? 0} nhóm nội dung • thử việc {template.journey_length_days} ngày • {template.id}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}