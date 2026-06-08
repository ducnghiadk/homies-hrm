import type { ReactNode } from 'react'
import Link from 'next/link'
import type {
  OnboardingOpsListRow,
  OnboardingOpsPriorityFilter,
  OnboardingOpsQuickFilter,
} from '@/lib/services/onboarding-operations-service'

export function TrialTrackingEmployeeTable({
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
    <section style={{ display: 'grid', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {filters.map((filter) => {
          const active = filter.key === activeFilter
          return (
            <button
              key={filter.key}
              type="button"
              onClick={() => onChangeFilter(filter.key)}
              style={{
                borderRadius: 999,
                border: active ? '1px solid #001D3D' : '1px solid rgba(0, 29, 61, 0.08)',
                background: active ? '#001D3D' : '#FFFFFF',
                color: active ? '#FFFFFF' : '#4A5A6A',
                padding: '10px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              {`${filter.label} (${filter.count})`}
            </button>
          )
        })}
      </div>

      <div style={{ overflowX: 'auto', borderRadius: 24, border: '1px solid rgba(0, 29, 61, 0.08)', background: '#FFFFFF' }}>
        <table style={{ width: '100%', minWidth: 980, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#FFF8E8' }}>
              <Head>Nhân sự</Head>
              <Head>Cửa hàng</Head>
              <Head>Vị trí</Head>
              <Head>Chặng hiện tại</Head>
              <Head>Mốc cần làm tiếp</Head>
              <Head>Tình trạng</Head>
              <Head>Thiếu gì</Head>
              <Head>Thao tác</Head>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const selected = row.employeeId === selectedEmployeeId
              const statusColor = row.statusKey === 'urgent'
                ? '#D9381E'
                : row.statusKey === 'due_soon'
                  ? '#8A5A00'
                  : row.statusKey === 'blocked_start'
                    ? '#7A4B00'
                    : row.statusKey === 'completed'
                      ? '#1E9E57'
                      : '#2F6FA8'

              return (
                <tr
                  key={row.employeeId}
                  onClick={() => onSelect(row.employeeId)}
                  style={{
                    borderTop: '1px solid rgba(0, 29, 61, 0.08)',
                    background: selected ? '#F8FBFF' : '#FFFFFF',
                    cursor: 'pointer',
                  }}
                >
                  <Cell strong>
                    <div>{row.employeeName}</div>
                    <div style={{ marginTop: 4, fontSize: 11, color: '#5F6B7A' }}>{formatDate(row.hireDate)}</div>
                  </Cell>
                  <Cell>{row.storeLabel}</Cell>
                  <Cell>{row.roleLabel}</Cell>
                  <Cell>{row.currentStageLabel}</Cell>
                  <Cell>{row.nextMilestoneLabel}</Cell>
                  <Cell>
                    <span style={{ color: statusColor, fontWeight: 700 }}>{row.statusLabel}</span>
                  </Cell>
                  <Cell>{row.primaryMissingLabel ?? 'Đã đủ nền tảng'}</Cell>
                  <Cell>
                    {row.statusKey === 'blocked_start' ? (
                      <Link
                        href="/career-path/onboarding/setup"
                        onClick={(event) => event.stopPropagation()}
                        style={actionLink}
                      >
                        Đi tới thiết lập
                      </Link>
                    ) : (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          onSelect(row.employeeId)
                        }}
                        style={actionButton}
                      >
                        {row.primaryActionLabel}
                      </button>
                    )}
                  </Cell>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function Head({ children }: { children: string }) {
  return (
    <th
      style={{
        padding: '12px 14px',
        textAlign: 'left',
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: '#7A6B53',
      }}
    >
      {children}
    </th>
  )
}

function Cell({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <td
      style={{
        padding: '12px 14px',
        fontSize: 13,
        lineHeight: 1.5,
        color: strong ? '#001D3D' : '#4A5A6A',
        fontWeight: strong ? 700 : 500,
        verticalAlign: 'top',
      }}
    >
      {children}
    </td>
  )
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('vi-VN')
}

const actionButton = {
  borderRadius: 999,
  border: 'none',
  background: '#2F6FA8',
  color: '#FFFFFF',
  padding: '9px 12px',
  fontSize: 12,
  fontWeight: 700,
  cursor: 'pointer',
} as const

const actionLink = {
  display: 'inline-flex',
  borderRadius: 999,
  background: '#FFF8E8',
  color: '#8A5A00',
  textDecoration: 'none',
  padding: '9px 12px',
  fontSize: 12,
  fontWeight: 700,
} as const