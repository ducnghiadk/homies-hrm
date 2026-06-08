'use client'

import React, { useState } from 'react'
import {
  createOnboardingChecklistItem,
  createOnboardingContentTopic,
  duplicateOnboardingChecklistTemplate,
  getOnboardingChecklistItems,
  getOnboardingChecklistStages,
  getOnboardingChecklistTemplateById,
  getOnboardingContentTopics,
  publishOnboardingChecklistTemplate,
  updateOnboardingChecklistItem,
  updateOnboardingChecklistStage,
  updateOnboardingChecklistTemplate,
  updateOnboardingContentTopic,
  validateOnboardingTemplateForPublishReport,
} from '@/lib/career-path-service'
import type { OnboardingChecklistItemTemplate } from '@/lib/career-path-types'
import { OnboardingPublishValidationPanel } from './OnboardingPublishValidationPanel'
import { OnboardingTemplateItemEditor } from './OnboardingTemplateItemEditor'
import { OnboardingTemplateStageEditor } from './OnboardingTemplateStageEditor'
import { OnboardingTemplateTopicEditor } from './OnboardingTemplateTopicEditor'

export function OnboardingTemplateEditorSection({
  selectedTemplateId,
  onSelectTemplate,
  onTemplateMutated,
}: {
  selectedTemplateId: string | null
  onSelectTemplate: (templateId: string | null) => void
  onTemplateMutated?: (nextTemplateId?: string | null) => void
}) {
  const [, setRevision] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [messageTone, setMessageTone] = useState<'success' | 'error' | 'idle'>('idle')

  const template = selectedTemplateId ? getOnboardingChecklistTemplateById(selectedTemplateId) : null
  const topics = selectedTemplateId ? getOnboardingContentTopics(selectedTemplateId) : []
  const stages = selectedTemplateId ? getOnboardingChecklistStages(selectedTemplateId) : []
  const items = selectedTemplateId ? getOnboardingChecklistItems(selectedTemplateId) : []
  const report = selectedTemplateId ? validateOnboardingTemplateForPublishReport(selectedTemplateId) : null

  const refresh = (nextMessage?: { tone: 'success' | 'error' | 'idle'; text: string | null }) => {
    setRevision((current) => current + 1)
    if (nextMessage) {
      setMessageTone(nextMessage.tone)
      setMessage(nextMessage.text)
    }
    onTemplateMutated?.(selectedTemplateId)
  }

  if (!template) {
    return (
      <div style={sectionStyle}>
        <div style={titleStyle}>Trình sửa template</div>
        <div style={subtitleStyle}>Chọn một template từ thư viện để mở vùng chỉnh sửa.</div>
      </div>
    )
  }

  const isDraft = template.status === 'draft'

  const handleDuplicateDraft = () => {
    const duplicated = duplicateOnboardingChecklistTemplate(template.id)
    onSelectTemplate(duplicated.id)
    onTemplateMutated?.(duplicated.id)
    setRevision((current) => current + 1)
    setMessageTone('success')
    setMessage('Đã tạo bản nháp mới từ template đang chọn.')
  }

  const handlePublish = () => {
    try {
      const published = publishOnboardingChecklistTemplate(template.id)
      onSelectTemplate(published.id)
      onTemplateMutated?.(published.id)
      setRevision((current) => current + 1)
      setMessageTone('success')
      setMessage('Đã phát hành template onboarding.')
    } catch (error) {
      setMessageTone('error')
      setMessage(error instanceof Error ? error.message : 'Không thể phát hành template.')
    }
  }

  const handleTemplateFieldUpdate = (patch: Parameters<typeof updateOnboardingChecklistTemplate>[1]) => {
    updateOnboardingChecklistTemplate(template.id, patch)
    refresh({ tone: 'success', text: 'Đã lưu thay đổi metadata template.' })
  }

  const handleItemUpdate = (itemId: string, patch: Partial<OnboardingChecklistItemTemplate>) => {
    updateOnboardingChecklistItem(itemId, patch)
    refresh({ tone: 'success', text: 'Đã lưu thay đổi mục checklist.' })
  }

  return (
    <div style={sectionStyle}>
      <div style={headerStyle}>
        <div>
          <div style={titleStyle}>Trình sửa template</div>
          <div style={subtitleStyle}>
            {template.role_label} • v{template.version} • {template.status === 'published' ? 'Đang phát hành' : template.status === 'draft' ? 'Nháp' : 'Lưu trữ'}
          </div>
        </div>
        <div style={headerActionStyle}>
          {!isDraft ? (
            <button type="button" onClick={handleDuplicateDraft} style={primaryButtonStyle}>
              Tạo bản nháp
            </button>
          ) : null}
          <button type="button" onClick={() => onSelectTemplate(null)} style={secondaryButtonStyle}>
            Đóng editor
          </button>
        </div>
      </div>

      {message ? (
        <div style={{ ...messageStyle, color: messageTone === 'error' ? '#b42318' : '#067647', borderColor: messageTone === 'error' ? '#f3c0bc' : '#b7e0c2', background: messageTone === 'error' ? '#fff3f2' : '#ecfdf3' }}>
          {message}
        </div>
      ) : null}

      {!isDraft ? (
        <div style={readOnlyStyle}>
          Template đang phát hành hoặc đã lưu trữ. Hãy tạo bản nháp trước khi chỉnh sửa nội dung.
        </div>
      ) : null}

      <div style={metaCardStyle}>
        <div style={metaGridStyle}>
          <label style={fieldStyle}>
            <span style={fieldLabelStyle}>Tên template</span>
            <input
              type="text"
              value={template.name}
              onChange={(event) => handleTemplateFieldUpdate({ name: event.target.value })}
              disabled={!isDraft}
              style={inputStyle}
            />
          </label>
          <label style={fieldStyle}>
            <span style={fieldLabelStyle}>Số ngày onboarding</span>
            <input
              type="number"
              min={1}
              value={template.journey_length_days}
              onChange={(event) => handleTemplateFieldUpdate({ journey_length_days: Math.max(1, Number(event.target.value)) })}
              disabled={!isDraft}
              style={inputStyle}
            />
          </label>
        </div>
        <label style={fieldStyle}>
          <span style={fieldLabelStyle}>Mô tả</span>
          <textarea
            value={template.description}
            onChange={(event) => handleTemplateFieldUpdate({ description: event.target.value })}
            disabled={!isDraft}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </label>
        <div style={templateMetaStyle}>Template ID: {template.id}</div>
      </div>

      <OnboardingPublishValidationPanel
        report={report}
        onRefresh={() => refresh({ tone: 'idle', text: 'Đã làm mới báo cáo kiểm tra phát hành.' })}
        onPublish={handlePublish}
        publishDisabled={!isDraft}
      />

      <div style={gridStyle}>
        <OnboardingTemplateTopicEditor
          topics={topics}
          onAddTopic={() => {
            createOnboardingContentTopic(template.id)
            refresh({ tone: 'success', text: 'Đã thêm chủ đề onboarding.' })
          }}
          onRenameTopic={(topicId, label) => {
            updateOnboardingContentTopic(topicId, { label })
            refresh({ tone: 'success', text: 'Đã lưu tên chủ đề.' })
          }}
          onToggleTopic={(topicId) => {
            const current = topics.find((topic) => topic.id === topicId)
            if (!current) return
            updateOnboardingContentTopic(topicId, { active: !current.active })
            refresh({ tone: 'success', text: 'Đã cập nhật trạng thái chủ đề.' })
          }}
        />

        <OnboardingTemplateStageEditor
          stages={stages}
          onRenameStage={(stageId, label) => {
            updateOnboardingChecklistStage(stageId, { label })
            refresh({ tone: 'success', text: 'Đã lưu tên chặng.' })
          }}
          onToggleStage={(stageId) => {
            const current = stages.find((stage) => stage.id === stageId)
            if (!current) return
            updateOnboardingChecklistStage(stageId, { required_to_pass: !current.required_to_pass })
            refresh({ tone: 'success', text: 'Đã cập nhật trạng thái chặng.' })
          }}
        />
      </div>

      <OnboardingTemplateItemEditor
        items={items}
        topics={topics}
        stages={stages}
        onAddItem={() => {
          createOnboardingChecklistItem(template.id)
          refresh({ tone: 'success', text: 'Đã thêm mục checklist mới.' })
        }}
        onUpdateItem={handleItemUpdate}
      />
    </div>
  )
}

const sectionStyle: React.CSSProperties = { display: 'grid', gap: 12 }
const headerStyle: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }
const headerActionStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap' }
const titleStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#111827' }
const subtitleStyle: React.CSSProperties = { fontSize: 12, color: '#667085', marginTop: 4 }
const metaCardStyle: React.CSSProperties = { display: 'grid', gap: 10, padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff' }
const metaGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 }
const fieldStyle: React.CSSProperties = { display: 'grid', gap: 6 }
const fieldLabelStyle: React.CSSProperties = { fontSize: 11, fontWeight: 700, color: '#475467' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d5dd', fontSize: 12, color: '#111827', background: '#fff' }
const templateMetaStyle: React.CSSProperties = { fontSize: 11, color: '#667085' }
const gridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12, alignItems: 'start' }
const messageStyle: React.CSSProperties = { padding: 10, borderRadius: 10, border: '1px solid #b7e0c2', fontSize: 12 }
const readOnlyStyle: React.CSSProperties = { padding: 10, borderRadius: 10, border: '1px solid #f3c0bc', background: '#fff3f2', fontSize: 12, color: '#b42318' }
const primaryButtonStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: 'none', background: '#667eea', color: '#fff', fontSize: 11, fontWeight: 600, cursor: 'pointer' }
const secondaryButtonStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d5dd', background: '#fff', color: '#344054', fontSize: 11, fontWeight: 600, cursor: 'pointer' }


