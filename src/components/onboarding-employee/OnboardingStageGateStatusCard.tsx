'use client'

import type { OnboardingStageGateView } from '@/lib/career-path-types'

type OnboardingStageGateStatusCardProps = {
  stageLabel: string
  gateView: OnboardingStageGateView | null
  retryItems: Array<{ id: string; title: string }>
}

function getStatusLabel(status: OnboardingStageGateView['status']) {
  if (status === 'cho_quan_ly_duyet') return 'Đang chờ quản lý chốt gate'
  if (status === 'da_qua_gate') return 'Đã qua gate'
  if (status === 'chua_qua_gate') return 'Cần kèm lại'
  return 'Chưa đề xuất'
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
      <div className="text-xs font-semibold uppercase tracking-wide text-[#2F6FA8]">Gate chặng</div>
      <h3 className="mt-1 text-lg font-bold text-[#001D3D]">{stageLabel}</h3>
      <div
        className="mt-3 inline-flex rounded-full px-3 py-2 text-sm font-semibold"
        style={{ background: tone.background, color: tone.color }}
      >
        {getStatusLabel(gateView.status)}
      </div>

      {gateView.status === 'cho_quan_ly_duyet' ? (
        <p className="mt-3 text-sm text-[#475569]">Buddy đã đề xuất qua gate. Bạn đang chờ quản lý chốt bước tiếp theo.</p>
      ) : null}

      {gateView.status === 'da_qua_gate' ? (
        <p className="mt-3 text-sm text-[#475569]">Bạn đã qua gate của chặng này và có thể sang bước tiếp theo.</p>
      ) : null}

      {gateView.status === 'chua_qua_gate' ? (
        <div className="mt-3 space-y-3">
          <p className="text-sm text-[#475569]">
            Quản lý chưa chốt qua gate. Buddy sẽ kèm lại đúng các điểm đang bị trả về.
          </p>
          {gateView.manager_note ? (
            <div className="rounded-[18px] border border-[#FECACA] bg-[#FFF7F7] p-3 text-sm text-[#7F1D1D]">
              <span className="font-semibold">Ghi chú quản lý:</span> {gateView.manager_note}
            </div>
          ) : null}
          {retryItems.length > 0 ? (
            <div className="rounded-[18px] border border-[#E5E7EB] bg-[#F8FAFC] p-3">
              <div className="text-sm font-semibold text-[#001D3D]">Các mục cần làm lại</div>
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
