import Link from 'next/link'
import type { OnboardingOpsWorkspaceOverview } from '@/lib/services/onboarding-operations-service'

export function TrialTrackingSummaryBar({ overview }: { overview: OnboardingOpsWorkspaceOverview }) {
  const urgent = overview.allRows.filter((row) => row.statusKey === 'urgent').length
  const onTrack = overview.allRows.filter((row) => row.statusKey === 'on_track').length
  const setup = overview.configSummary.missingTemplateCount
    + overview.configSummary.duplicateMappingCount
    + overview.configSummary.unmatchedEmployeeCount

  return (
    <section
      style={{
        borderRadius: 28,
        border: '1px solid rgba(0, 29, 61, 0.08)',
        background: 'linear-gradient(135deg, #FFF8E8 0%, #FFFFFF 100%)',
        padding: 18,
        boxShadow: '0 10px 24px rgba(0, 29, 61, 0.05)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 320px' }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>
            Theo dõi thử việc
          </div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 800, color: '#001D3D' }}>
            Bảng nhân sự thử việc
          </div>
          <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: '#5F6B7A' }}>
            Bộ phận nhân sự quét nhanh ai cần xử lý ngay, ai sắp tới hạn, và mở đúng hồ sơ để xử lý tiếp.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Link href="/career-path/onboarding/overview" style={ghostLink}>
            Về tổng quan thử việc
          </Link>
          <Link href="/career-path/onboarding/setup" style={primaryLink}>
            Mở thiết lập quy trình thử việc
          </Link>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 12, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginTop: 16 }}>
        <Cell label="Nhân sự mới" value={overview.allRows.length} detail="Toàn bộ hồ sơ đang nằm trong vùng theo dõi." />
        <Cell label="Cần xử lý ngay" value={urgent} detail="Thiếu bước nền tảng hoặc đang nghẽn mốc quan trọng." tone="urgent" />
        <Cell label="Đang đúng tiến độ" value={onTrack} detail="Có thể tiếp tục theo chặng hiện tại." tone="ready" />
        <Cell label="Cần rà lại thiết lập" value={setup} detail={overview.systemStatus.reason} tone="attention" />
      </div>
    </section>
  )
}

function Cell({ label, value, detail, tone = 'plain' }: { label: string; value: number; detail: string; tone?: 'plain' | 'urgent' | 'attention' | 'ready' }) {
  const palette = tone === 'urgent'
    ? ['#FFF7F5', '#D9381E']
    : tone === 'attention'
      ? ['#FFFBEF', '#8A5A00']
      : tone === 'ready'
        ? ['#F6FFF9', '#1E9E57']
        : ['#FFFFFF', '#001D3D']

  return (
    <div style={{ borderRadius: 22, border: '1px solid rgba(0, 29, 61, 0.08)', background: palette[0], padding: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7A6B53' }}>{label}</div>
      <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: palette[1] }}>{value}</div>
      <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.5, color: '#5F6B7A' }}>{detail}</div>
    </div>
  )
}

const primaryLink = { borderRadius: 999, background: '#2F6FA8', color: '#FFFFFF', textDecoration: 'none', padding: '10px 14px', fontSize: 12, fontWeight: 700 } as const
const ghostLink = { borderRadius: 999, border: '1px solid rgba(47, 111, 168, 0.18)', background: '#FFFFFF', color: '#2F6FA8', textDecoration: 'none', padding: '10px 14px', fontSize: 12, fontWeight: 700 } as const