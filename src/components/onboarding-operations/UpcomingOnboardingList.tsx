import type {
  OnboardingOpsListRow,
  OnboardingOpsPriorityFilter,
  OnboardingOpsQuickFilter,
} from '@/lib/services/onboarding-operations-service'

const toneStyles: Record<OnboardingOpsListRow['tone'], { background: string; color: string }> = {
  block: {
    background: 'rgba(217, 56, 30, 0.12)',
    color: '#D9381E',
  },
  attention: {
    background: 'rgba(246, 200, 95, 0.22)',
    color: '#8A5A00',
  },
  ready: {
    background: 'rgba(30, 158, 87, 0.14)',
    color: '#1E9E57',
  },
}

export function UpcomingOnboardingList({
  rows,
  filters,
  activeFilter,
  onChangeFilter,
  selectedEmployeeId,
  onSelect,
}: {
  rows: OnboardingOpsListRow[]
  filters: OnboardingOpsQuickFilter[]
  activeFilter: OnboardingOpsPriorityFilter
  onChangeFilter: (filter: OnboardingOpsPriorityFilter) => void
  selectedEmployeeId: string | null
  onSelect: (employeeId: string) => void
}) {
  return (
    <div
      style={{
        background: '#FFFDF9',
        border: '1px solid rgba(0, 29, 61, 0.08)',
        borderRadius: 28,
        padding: 16,
        boxShadow: '0 10px 30px rgba(0, 29, 61, 0.05)',
      }}
    >
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>
          Onboard vận hành
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, color: '#001D3D', marginTop: 4 }}>Người sắp vào làm</div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {filters.map((filter) => {
          const isActive = filter.key === activeFilter

          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onChangeFilter(filter.key)}
              style={{
                minHeight: 38,
                borderRadius: 999,
                border: isActive ? '1.5px solid #001D3D' : '1px solid rgba(0, 29, 61, 0.08)',
                background: isActive ? '#FFF3D6' : '#FFFFFF',
                color: '#001D3D',
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {filter.label} ({filter.count})
            </button>
          )
        })}
      </div>

      {rows.length === 0 ? (
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid rgba(0, 29, 61, 0.08)',
            borderRadius: 24,
            boxShadow: '0 10px 30px rgba(0, 29, 61, 0.06)',
            padding: 20,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 700, color: '#001D3D' }}>
            {activeFilter === 'all' ? 'Chưa có người sắp vào làm' : 'Không có ai khớp bộ lọc này'}
          </div>
          <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6 }}>
            {activeFilter === 'all'
              ? 'Không có nhân sự mới nào nằm trong khoảng nhìn hiện tại.'
              : 'Thử đổi bộ lọc nhanh để xem nhóm khác.'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {rows.map((row) => {
            const isSelected = row.employeeId === selectedEmployeeId
            const tone = toneStyles[row.tone]

            return (
              <button
                key={row.employeeId}
                type="button"
                onClick={() => onSelect(row.employeeId)}
                style={{
                  width: '100%',
                  minHeight: 116,
                  textAlign: 'left',
                  borderRadius: 22,
                  border: isSelected ? '1.5px solid #2F6FA8' : '1px solid rgba(0, 29, 61, 0.08)',
                  background: '#FFFFFF',
                  boxShadow: isSelected ? '0 12px 28px rgba(47, 111, 168, 0.14)' : '0 8px 24px rgba(0, 29, 61, 0.06)',
                  padding: 14,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 180px' }}>
                    <div style={{ fontSize: 11, color: '#7A8796' }}>Vào làm {row.hireDate}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#001D3D', marginTop: 4 }}>{row.employeeName}</div>
                    <div style={{ fontSize: 12, color: '#4A5A6A', marginTop: 4, lineHeight: 1.5 }}>
                      {row.roleLabel} • {row.storeLabel}
                    </div>
                  </div>
                  <span
                    style={{
                      borderRadius: 999,
                      padding: '6px 10px',
                      fontSize: 11,
                      fontWeight: 700,
                      background: tone.background,
                      color: tone.color,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {row.toneLabel}
                  </span>
                </div>

                <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 10, lineHeight: 1.5 }}>
                  {row.missingLabels.length > 0 ? row.missingLabels.join(' • ') : 'Đủ các bước trước ngày đầu'}
                  {row.hiddenMissingCount > 0 ? ` • +${row.hiddenMissingCount} mục` : ''}
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                  {row.reminderLabel ? (
                    <span
                      style={{
                        borderRadius: 999,
                        padding: '5px 9px',
                        fontSize: 10,
                        fontWeight: 800,
                        background: row.followUpLevel === 'same_day' ? 'rgba(246, 200, 95, 0.22)' : 'rgba(47, 111, 168, 0.10)',
                        color: row.followUpLevel === 'same_day' ? '#8A5A00' : '#2F6FA8',
                      }}
                    >
                      {row.reminderLabel}
                    </span>
                  ) : null}
                  <span style={{ fontSize: 11, color: '#4A5A6A', alignSelf: 'center' }}>{row.shortNote}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
