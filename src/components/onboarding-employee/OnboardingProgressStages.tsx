'use client'

import type { OnboardingStageItemView } from '@/components/onboarding-employee/OnboardingHeroCard'

type OnboardingProgressStagesProps = {
  progress: number
  doneTasks: number
  totalTasks: number
  stages: OnboardingStageItemView[]
  currentStageCode: string
  selectedStageCode: string
  onStageSelect: (stageCode: string) => void
}

export function OnboardingProgressStages({
  progress,
  doneTasks,
  totalTasks,
  stages,
  currentStageCode,
  selectedStageCode,
  onStageSelect,
}: OnboardingProgressStagesProps) {
  return (
    <section className="animate-slide-up space-y-4 rounded-[28px] bg-white p-5 shadow-[0_10px_30px_rgba(0,29,61,0.08)]">
      <div>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-[#001D3D]">{'\u0054\u0069\u1ebf\u006e \u0111\u1ed9 \u006f\u006e\u0062\u006f\u0061\u0072\u0064\u0069\u006e\u0067'}</h2>
          <span className="text-lg font-bold text-[#2F6FA8]">{progress}%</span>
        </div>
        <p className="mt-1 text-sm text-[#6B7280]">
          {doneTasks}/{totalTasks} {'\u006d\u1ee5\u0063 \u0111\u00e3 \u0111\u1ea1\u0074'}
        </p>
      </div>

      <div
        role="progressbar"
        aria-label={'\u0054\u0069\u1ebf\u006e \u0111\u1ed9 \u006f\u006e\u0062\u006f\u0061\u0072\u0064\u0069\u006e\u0067 \u0074\u1ed5\u006e\u0067'}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-3 overflow-hidden rounded-full bg-[#EEF4FB]"
      >
        <div
          className="h-full rounded-full bg-[#2F6FA8] transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stages.map((stage) => {
          const isCurrent = stage.code === currentStageCode
          const isSelected = stage.code === selectedStageCode
          const toneClass = stage.status === 'completed'
            ? 'bg-[#DDF4EC] text-[#107C41]'
            : isCurrent
              ? 'bg-[#2F6FA8] text-white shadow-[0_10px_24px_rgba(47,111,168,0.24)]'
              : 'border border-[#E8E1D1] bg-[#FFFDF9] text-[#001D3D]'
          const selectionClass = isSelected
            ? 'ring-2 ring-[#F6C85F] ring-offset-2 ring-offset-[#FFF8E8]'
            : ''

          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onStageSelect(stage.code)}
              className={`rounded-[20px] p-3 text-left transition-all ${toneClass} ${selectionClass}`}
              aria-pressed={isSelected}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold">{stage.label}</div>
                <span className="text-xs font-bold">
                  {stage.status === 'completed'
                    ? '\u0110\u1ea1\u0074'
                    : isCurrent
                      ? '\u0110\u0061\u006e\u0067 \u0063\u0068\u1ea1\u0079'
                      : '\u0053\u1eaf\u0070 \u0074\u1edb\u0069'}
                </span>
              </div>
              <div className={`mt-2 text-xs ${isCurrent ? 'text-white/80' : 'text-current/80'}`}>
                {stage.done_items}/{stage.total_items} {'\u006d\u1ee5\u0063'}
              </div>
              {isSelected && !isCurrent ? (
                <div className="mt-2 text-[11px] font-semibold text-[#9A6700]">{'\u0110\u0061\u006e\u0067 \u006d\u1edf \u0111\u1ec3 \u0078\u0065\u006d'}</div>
              ) : null}
            </button>
          )
        })}
      </div>
    </section>
  )
}
