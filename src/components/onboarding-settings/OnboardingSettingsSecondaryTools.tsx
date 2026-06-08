import React from 'react'

export const DEFAULT_SECONDARY_TOOLS_TITLE = 'Công cụ hỗ trợ'
export const DEFAULT_SECONDARY_TOOL_ITEMS = [
  {
    label: 'Xem trước quy trình',
    description: 'Mở nhanh preview để kiểm tra trải nghiệm nhân viên và vận hành.',
    href: '#trial-workflow-active-tab',
  },
  {
    label: 'Báo cáo mức sẵn sàng',
    description: 'Theo dõi nhóm thiếu danh sách việc, nhân viên lệch nhóm, và số bản mẫu đang dùng.',
    href: '#trial-workflow-active-tab',
  },
  {
    label: 'Lịch sử thay đổi',
    description: 'Rà lại những lần cập nhật quy trình trước khi đưa bản mới vào sử dụng.',
    href: '#trial-workflow-active-tab',
  },
] as const

export function OnboardingSettingsSecondaryTools({
  title = DEFAULT_SECONDARY_TOOLS_TITLE,
  items = [...DEFAULT_SECONDARY_TOOL_ITEMS],
}: {
  title?: string
  items?: Array<{ label: string; description: string; href: string }>
}) {
  return (
    <div style={panelStyle}>
      <div style={titleStyle}>{title}</div>
      <div style={gridStyle}>
        {items.map((item) => (
          <a key={item.label} href={item.href} style={itemStyle}>
            <div style={itemTitleStyle}>{item.label}</div>
            <div style={itemDescriptionStyle}>{item.description}</div>
          </a>
        ))}
      </div>
    </div>
  )
}

const panelStyle: React.CSSProperties = {
  display: 'grid',
  gap: 10,
  padding: 14,
  borderRadius: 16,
  border: '1px solid #e5e7eb',
  background: '#FFF8E8',
}

const titleStyle: React.CSSProperties = { fontSize: 14, fontWeight: 800, color: '#111827' }
const gridStyle: React.CSSProperties = { display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }
const itemStyle: React.CSSProperties = {
  display: 'grid',
  gap: 6,
  padding: 12,
  borderRadius: 12,
  border: '1px solid rgba(47, 111, 168, 0.16)',
  background: '#FFFFFF',
  textDecoration: 'none',
}
const itemTitleStyle: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: '#2F6FA8' }
const itemDescriptionStyle: React.CSSProperties = { fontSize: 12, lineHeight: 1.6, color: '#5F6B7A' }
