import React from 'react'

export type OnboardingRoleFilterKey = 'all' | 'enabled' | 'issues' | 'missing_template'

const filterOptions: Array<{ key: OnboardingRoleFilterKey; label: string }> = [
  { key: 'all', label: 'Tất cả' },
  { key: 'enabled', label: 'Đang bật' },
  { key: 'issues', label: 'Có lỗi' },
  { key: 'missing_template', label: 'Chưa có checklist' },
]

export function OnboardingRoleFilters({
  activeFilter,
  searchValue,
  onFilterChange,
  onSearchChange,
}: {
  activeFilter: OnboardingRoleFilterKey
  searchValue: string
  onFilterChange: (next: OnboardingRoleFilterKey) => void
  onSearchChange: (next: string) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {filterOptions.map((filter) => {
          const active = filter.key === activeFilter
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onFilterChange(filter.key)}
              style={{
                padding: '7px 12px',
                borderRadius: 999,
                border: active ? '1px solid #667eea' : '1px solid #d0d5dd',
                background: active ? '#eef2ff' : '#fff',
                color: active ? '#3646c5' : '#344054',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {filter.label}
            </button>
          )
        })}
      </div>
      <input
        type="text"
        value={searchValue}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Tìm role hoặc chức danh"
        style={{
          width: '100%',
          padding: '8px 10px',
          borderRadius: 8,
          border: '1px solid #d0d5dd',
          background: '#fff',
          fontSize: 12,
        }}
      />
    </div>
  )
}
