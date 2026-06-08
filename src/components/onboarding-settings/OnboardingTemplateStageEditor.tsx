'use client'

import React from 'react'
import type { OnboardingChecklistStage } from '@/lib/career-path-types'

export interface OnboardingTemplateStageEditorProps {
  stages: OnboardingChecklistStage[]
  onRenameStage: (stageId: string, label: string) => void
  onToggleStage: (stageId: string) => void
}

export function OnboardingTemplateStageEditor({
  stages,
  onRenameStage,
  onToggleStage,
}: OnboardingTemplateStageEditorProps) {
  const sortedStages = [...stages].sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div style={sectionStyle}>
      <div>
        <div style={titleStyle}>Chặng lộ trình</div>
        <div style={subtitleStyle}>Đặt tên từng chặng và đánh dấu chặng bắt buộc phải qua.</div>
      </div>

      <div style={listStyle}>
        {sortedStages.length > 0 ? (
          sortedStages.map((stage) => (
            <div key={stage.id} style={rowStyle}>
              <div style={orderStyle}>#{stage.sort_order}</div>
              <div style={{ flex: 1 }}>
                <input
                  type="text"
                  value={stage.label}
                  onChange={(event) => onRenameStage(stage.id, event.target.value)}
                  placeholder="Tên chặng"
                  style={inputStyle}
                />
                <div style={metaStyle}>
                  <span>{stage.code}</span>
                  <span>{stage.goal_summary || 'Chưa có mục tiêu tóm tắt'}</span>
                </div>
              </div>
              <button type="button" onClick={() => onToggleStage(stage.id)} style={secondaryButtonStyle}>
                {stage.required_to_pass ? 'Bắt buộc' : 'Tùy chọn'}
              </button>
            </div>
          ))
        ) : (
          <div style={emptyStyle}>Không có chặng nào cho template này.</div>
        )}
      </div>
    </div>
  )
}

const sectionStyle: React.CSSProperties = { display: 'grid', gap: 12, padding: 12, borderRadius: 12, border: '1px solid #e5e7eb', background: '#fff' }
const titleStyle: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: '#111827' }
const subtitleStyle: React.CSSProperties = { fontSize: 12, color: '#667085', marginTop: 4 }
const listStyle: React.CSSProperties = { display: 'grid', gap: 8 }
const rowStyle: React.CSSProperties = { display: 'flex', gap: 10, alignItems: 'center', padding: 10, borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0' }
const orderStyle: React.CSSProperties = { minWidth: 34, height: 34, borderRadius: 999, display: 'grid', placeItems: 'center', background: '#0f766e', color: '#fff', fontSize: 11, fontWeight: 700 }
const inputStyle: React.CSSProperties = { width: '100%', padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d5dd', fontSize: 12, color: '#111827' }
const metaStyle: React.CSSProperties = { display: 'flex', gap: 10, marginTop: 6, fontSize: 11, color: '#667085', flexWrap: 'wrap' }
const emptyStyle: React.CSSProperties = { padding: 12, borderRadius: 10, border: '1px dashed #d0d5dd', fontSize: 12, color: '#667085', background: '#f8fafc' }
const secondaryButtonStyle: React.CSSProperties = { padding: '8px 10px', borderRadius: 8, border: '1px solid #d0d5dd', background: '#fff', color: '#344054', fontSize: 11, fontWeight: 600, cursor: 'pointer' }
