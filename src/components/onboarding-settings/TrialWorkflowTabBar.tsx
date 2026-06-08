import React from 'react'

export type TrialWorkflowTabKey = 'general' | 'stages' | 'tasks' | 'gates' | 'assignments'

export type TrialWorkflowTabItem = {
  key: TrialWorkflowTabKey
  label: string
  missingCount: number
}

export function TrialWorkflowTabBar({
  items,
  activeTab,
  onSelect,
}: {
  items: TrialWorkflowTabItem[]
  activeTab: TrialWorkflowTabKey
  onSelect: (tab: TrialWorkflowTabKey) => void
}) {
  const activeItem = items.find((item) => item.key === activeTab) ?? items[0]

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#475467' }}>Thẻ đang mở: {activeItem?.label ?? 'Chưa chọn'}</div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {items.map((item) => {
          const active = item.key === activeTab

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onSelect(item.key)}
              style={{
                display: 'grid',
                gap: 4,
                minWidth: 196,
                padding: '12px 14px',
                borderRadius: 16,
                border: active ? '1px solid #1d4ed8' : '1px solid #d0d5dd',
                background: active ? '#eff6ff' : '#fff',
                color: '#111827',
                textAlign: 'left',
                cursor: 'pointer',
                boxShadow: active ? '0 10px 24px rgba(29, 78, 216, 0.12)' : '0 8px 20px rgba(15, 23, 42, 0.04)',
              }}
            >
              <span style={{ fontSize: 13, fontWeight: 700 }}>{item.label}</span>
              <span style={{ fontSize: 11, color: active ? '#1d4ed8' : '#667085' }}>
                {item.missingCount > 0 ? `${item.missingCount} chỗ còn thiếu` : 'Đã đủ thông tin'}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}