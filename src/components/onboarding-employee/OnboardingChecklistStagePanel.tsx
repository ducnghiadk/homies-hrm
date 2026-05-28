'use client'

import type { ReactNode } from 'react'

type ChecklistStagePanelProps = {
  stageLabel: string
  stageGoalSummary: string
  stageHint?: string
  items: ReactNode
}

export function OnboardingChecklistStagePanel({
  stageLabel,
  stageGoalSummary,
  stageHint,
  items,
}: ChecklistStagePanelProps) {
  return (
    <section className="animate-slide-up space-y-4">
      <div className="rounded-[24px] bg-white p-5 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
        <div className="text-xs font-semibold uppercase tracking-wide text-[#2F6FA8]">
          {'\u0043\u0068\u1eb7\u006e\u0067 \u0068\u0069\u1ec7\u006e \u0074\u1ea1\u0069'}
        </div>
        <h2 className="mt-1 text-xl font-bold text-[#001D3D]">{stageLabel}</h2>
        <p className="mt-2 text-sm text-[#4B5563]">{stageGoalSummary}</p>
        {stageHint ? <p className="mt-2 text-sm font-medium text-[#8A5B00]">{stageHint}</p> : null}
      </div>

      <div className="space-y-3">{items}</div>
    </section>
  )
}
