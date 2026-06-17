import type {
  OnboardingOpsEmployeeStageDetail,
  OnboardingOpsStageKey,
} from '@/lib/services/onboarding-operations-service'

export function TrialTrackingStageTabs({
  stages,
  activeStageKey,
  onSelect,
}: {
  stages: OnboardingOpsEmployeeStageDetail[]
  activeStageKey: OnboardingOpsStageKey
  onSelect: (stageKey: OnboardingOpsStageKey) => void
}) {
  return (
    <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
      {stages.map((stage, index) => {
        const active = stage.key === activeStageKey
        return (
          <button
            key={stage.key}
            type="button"
            onClick={() => onSelect(stage.key)}
            style={{ textAlign: 'left', borderRadius: 20, border: active ? '1.5px solid #2F6FA8' : '1px solid rgba(0, 29, 61, 0.08)', background: active ? '#F8FBFF' : '#FFFFFF', padding: 14, cursor: 'pointer' }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7A6B53' }}>
              {`Chặng ${index + 1}`}
            </div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 700, lineHeight: 1.5, color: '#001D3D' }}>{stage.label}</div>
            <div style={{ marginTop: 8, fontSize: 12, color: active ? '#2F6FA8' : '#5F6B7A' }}>{stage.statusLabel}</div>
          </button>
        )
      })}
    </div>
  )
}