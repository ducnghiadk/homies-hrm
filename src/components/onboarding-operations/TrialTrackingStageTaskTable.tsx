import type { ReactNode } from 'react'
import type { OnboardingOpsStageTaskRow } from '@/lib/services/onboarding-operations-service'

export function TrialTrackingStageTaskTable({ rows }: { rows: OnboardingOpsStageTaskRow[] }) {
  if (rows.length === 0) {
    return (
      <div style={{ borderRadius: 20, border: '1px solid rgba(0, 29, 61, 0.08)', background: '#FFFFFF', padding: 16, color: '#5F6B7A' }}>
        Chưa có đầu việc nào trong chặng này.
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 22, border: '1px solid rgba(0, 29, 61, 0.08)', background: '#FFFFFF' }}>
      <table style={{ width: '100%', minWidth: 760, borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: '#FFF8E8' }}>
            <Head>Việc cần làm</Head>
            <Head>Người phụ trách</Head>
            <Head>Hạn hoàn tất</Head>
            <Head>Kết quả cần có</Head>
            <Head>Trạng thái</Head>
            <Head>Thao tác</Head>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const tone = row.isDone ? '#1E9E57' : row.isBlocked ? '#D9381E' : '#8A5A00'
            return (
              <tr key={row.id} style={{ borderTop: '1px solid rgba(0, 29, 61, 0.08)' }}>
                <Cell strong>{row.title}</Cell>
                <Cell>{row.ownerLabel}</Cell>
                <Cell>{row.dueLabel}</Cell>
                <Cell>{row.expectedResultLabel}</Cell>
                <Cell>
                  <span style={{ color: tone, fontWeight: 700 }}>{row.statusLabel}</span>
                </Cell>
                <Cell>{row.actionLabel}</Cell>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function Head({ children }: { children: string }) {
  return (
    <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7A6B53' }}>
      {children}
    </th>
  )
}

function Cell({ children, strong = false }: { children: ReactNode; strong?: boolean }) {
  return (
    <td style={{ padding: '12px 14px', fontSize: 13, lineHeight: 1.5, color: strong ? '#001D3D' : '#4A5A6A', fontWeight: strong ? 700 : 500, verticalAlign: 'top' }}>
      {children}
    </td>
  )
}