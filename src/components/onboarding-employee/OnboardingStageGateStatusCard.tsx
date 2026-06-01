'use client'

import type { OnboardingStageGateView } from '@/lib/career-path-types'

type OnboardingStageGateStatusCardProps = {
  stageLabel: string
  gateView: OnboardingStageGateView | null
  retryItems: Array<{ id: string; title: string }>
}

const copy = {
  title: '\u0047\u0061\u0074\u0065 \u0063\u0068\u1eb7\u006e\u0067',
  notSuggested: '\u0043\u0068\u01b0\u0061 \u0111\u1ec1 \u0078\u0075\u1ea5\u0074',
  waitingManager: '\u0110\u0061\u006e\u0067 \u0063\u0068\u1edd \u0071\u0075\u1ea3\u006e \u006c\u00fd \u0063\u0068\u1ed1\u0074 \u0067\u0061\u0074\u0065',
  passed: '\u0110\u00e3 \u0071\u0075\u0061 \u0067\u0061\u0074\u0065',
  retry: '\u0043\u1ea7\u006e \u006b\u00e8\u006d \u006c\u1ea1\u0069',
  preSuggestBody:
    '\u0042\u1ea1\u006e \u0063\u0068\u01b0\u0061 \u0111\u01b0\u1ee3\u0063 \u0111\u1ec1 \u0078\u0075\u1ea5\u0074 \u0071\u0075\u0061 \u0067\u0061\u0074\u0065 \u1edf \u0063\u0068\u1eb7\u006e\u0067 \u006e\u00e0\u0079. \u0048\u006f\u00e0\u006e \u0074\u1ea5\u0074 \u0063\u0068\u0065\u0063\u006b\u006c\u0069\u0073\u0074, \u006d\u0069\u006e\u0069 \u0074\u0065\u0073\u0074 \u0076\u00e0 \u0074\u1ef1 \u0111\u00e1\u006e\u0068 \u0067\u0069\u00e1 \u0074\u0072\u01b0\u1edb\u0063 \u006b\u0068\u0069 \u0062\u0075\u0064\u0064\u0079 \u0067\u1eedi \u0111\u1ec1 \u0078\u0075\u1ea5\u0074.',
  waitingBody:
    '\u0042\u0075\u0064\u0064\u0079 \u0111\u00e3 \u0111\u1ec1 \u0078\u0075\u1ea5\u0074 \u0071\u0075\u0061 \u0067\u0061\u0074\u0065. \u0042\u1ea1\u006e \u0111\u0061\u006e\u0067 \u0063\u0068\u1edd \u0071\u0075\u1ea3\u006e \u006c\u00fd \u0063\u0068\u1ed1\u0074 \u0062\u01b0\u1edb\u0063 \u0074\u0069\u1ebf\u0070 \u0074\u0068\u0065\u006f.',
  passedBody:
    '\u0042\u1ea1\u006e \u0111\u00e3 \u0071\u0075\u0061 \u0067\u0061\u0074\u0065 \u0063\u1ee7\u0061 \u0063\u0068\u1eb7\u006e\u0067 \u006e\u00e0\u0079 \u0076\u00e0 \u0063\u00f3 \u0074\u0068\u1ec3 \u0073\u0061\u006e\u0067 \u0062\u01b0\u1edb\u0063 \u0074\u0069\u1ebf\u0070 \u0074\u0068\u0065\u006f.',
  retryBody:
    '\u0051\u0075\u1ea3\u006e \u006c\u00fd \u0063\u0068\u01b0\u0061 \u0063\u0068\u1ed1\u0074 \u0071\u0075\u0061 \u0067\u0061\u0074\u0065. \u0042\u0075\u0064\u0064\u0079 \u0073\u1ebd \u006b\u00e8\u006d \u006c\u1ea1\u0069 \u0111\u00fa\u006e\u0067 \u0063\u00e1\u0063 \u0111\u0069\u1ec3\u006d \u0111\u0061\u006e\u0067 \u0062\u1ecb \u0074\u0072\u1ea3 \u0076\u1ec1.',
  managerNote: '\u0047\u0068\u0069 \u0063\u0068\u00fa \u0071\u0075\u1ea3\u006e \u006c\u00fd:',
  retryItems: '\u0043\u00e1\u0063 \u006d\u1ee5\u0063 \u0063\u1ea7\u006e \u006c\u00e0\u006d \u006c\u1ea1\u0069',
} as const

function getStatusLabel(status: OnboardingStageGateView['status']) {
  if (status === 'cho_quan_ly_duyet') return copy.waitingManager
  if (status === 'da_qua_gate') return copy.passed
  if (status === 'chua_qua_gate') return copy.retry
  return copy.notSuggested
}

function getStatusTone(status: OnboardingStageGateView['status']) {
  if (status === 'da_qua_gate') return { background: '#ECFDF3', color: '#1E9E57' }
  if (status === 'chua_qua_gate') return { background: '#FEF2F2', color: '#D9381E' }
  if (status === 'cho_quan_ly_duyet') return { background: '#EFF6FF', color: '#2F6FA8' }
  return { background: '#F8FAFC', color: '#64748B' }
}

export function OnboardingStageGateStatusCard({
  stageLabel,
  gateView,
  retryItems,
}: OnboardingStageGateStatusCardProps) {
  if (!gateView) return null

  const tone = getStatusTone(gateView.status)

  return (
    <section className="animate-slide-up rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#2F6FA8]">{copy.title}</div>
      <h3 className="mt-1 text-lg font-bold text-[#001D3D]">{stageLabel}</h3>
      <div
        className="mt-3 inline-flex rounded-full px-3 py-2 text-sm font-semibold"
        style={{ background: tone.background, color: tone.color }}
      >
        {getStatusLabel(gateView.status)}
      </div>

      {gateView.status === 'chua_de_xuat' ? <p className="mt-3 text-sm text-[#475569]">{copy.preSuggestBody}</p> : null}
      {gateView.status === 'cho_quan_ly_duyet' ? <p className="mt-3 text-sm text-[#475569]">{copy.waitingBody}</p> : null}
      {gateView.status === 'da_qua_gate' ? <p className="mt-3 text-sm text-[#475569]">{copy.passedBody}</p> : null}

      {gateView.status === 'chua_qua_gate' ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-[#475569]">{copy.retryBody}</p>

          {gateView.manager_note ? (
            <div className="rounded-[18px] bg-[#FEF2F2] p-3 text-sm text-[#7F1D1D]">
              <span className="font-semibold">{copy.managerNote}</span> {gateView.manager_note}
            </div>
          ) : null}

          {retryItems.length > 0 ? (
            <div className="rounded-[18px] border border-[#FECACA] bg-white p-3">
              <div className="text-sm font-semibold text-[#001D3D]">{copy.retryItems}</div>
              <ul className="mt-2 list-disc pl-5 text-sm text-[#475569]">
                {retryItems.map((item) => (
                  <li key={item.id}>{item.title}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
