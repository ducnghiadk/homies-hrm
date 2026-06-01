export type OnboardingOpsTimelineStep = {
  key: 'today' | 'select' | 'before_shift' | 'after_shift'
  title: string
  description: string
  status: 'current' | 'upcoming' | 'complete'
}

export type OnboardingOpsTimelineSummary = {
  immediateCount: number
  followUpCount: number
  ctaLabel: string
}

function getStepStyle(status: OnboardingOpsTimelineStep['status']) {
  if (status === 'current') {
    return {
      background: '#FFF3D6',
      border: '1.5px solid #001D3D',
      title: '#001D3D',
      copy: '#5F4A21',
    }
  }

  if (status === 'complete') {
    return {
      background: '#F6FFF9',
      border: '1px solid rgba(30, 158, 87, 0.22)',
      title: '#0E7A41',
      copy: '#4A5A6A',
    }
  }

  return {
    background: '#FFFDF9',
    border: '1px solid rgba(0, 29, 61, 0.08)',
    title: '#001D3D',
    copy: '#5F6B7A',
  }
}

export function OnboardingOpsTimeline({
  steps,
  summary,
}: {
  steps: OnboardingOpsTimelineStep[]
  summary: OnboardingOpsTimelineSummary
}) {
  return (
    <section
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(0, 29, 61, 0.08)',
        borderRadius: 28,
        padding: 18,
        boxShadow: '0 10px 30px rgba(0, 29, 61, 0.05)',
        marginBottom: 16,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#7A6B53' }}>
        Xem ưu tiên hôm nay
      </div>

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          marginTop: 12,
        }}
      >
        {steps.map((step, index) => {
          const stepStyle = getStepStyle(step.status)

          return (
            <div
              key={step.key}
              style={{
                padding: 12,
                borderRadius: 18,
                background: stepStyle.background,
                border: stepStyle.border,
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 800, color: '#7A6B53' }}>Bước {index + 1}</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: stepStyle.title, marginTop: 6 }}>{step.title}</div>
              <div style={{ fontSize: 12, color: stepStyle.copy, marginTop: 6, lineHeight: 1.45 }}>{step.description}</div>
            </div>
          )
        })}
      </div>

      <div
        style={{
          marginTop: 14,
          borderRadius: 20,
          background: '#FFF8E8',
          border: '1px solid rgba(246, 200, 95, 0.35)',
          padding: 14,
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#001D3D' }}>Hôm nay còn gì</div>
          <div style={{ fontSize: 12, color: '#5F6B7A', marginTop: 6, lineHeight: 1.45 }}>
            {summary.immediateCount} người cần xử lý ngay • {summary.followUpCount} người cần follow-up sau ca
          </div>
        </div>
        <div style={{ alignSelf: 'center', fontSize: 12, fontWeight: 700, color: '#2F6FA8' }}>{summary.ctaLabel}</div>
      </div>
    </section>
  )
}