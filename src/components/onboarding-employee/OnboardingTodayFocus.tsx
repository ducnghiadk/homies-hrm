'use client'

import { Clock3, HandHelping, ListTodo } from 'lucide-react'

type OnboardingTodayFocusProps = {
  primaryTask: string
  waitingLabel: string
  supportLabel: string
}

export function OnboardingTodayFocus({
  primaryTask,
  waitingLabel,
  supportLabel,
}: OnboardingTodayFocusProps) {
  const cards = [
    {
      label: '\u0056\u0069\u1ec7\u0063 \u0063\u1ea7\u006e \u006c\u00e0\u006d \u006e\u0067\u0061\u0079',
      value: primaryTask,
      icon: ListTodo,
      tone: 'primary',
    },
    {
      label: '\u0110\u0061\u006e\u0067 \u0063\u0068\u1edd \u0061\u0069',
      value: waitingLabel,
      icon: Clock3,
      tone: 'warning',
    },
    {
      label: '\u004e\u0067\u01b0\u1eddi \u0068\u1ed7 \u0074\u0072\u1ee3 \u0062\u1ea1\u006e',
      value: supportLabel,
      icon: HandHelping,
      tone: 'neutral',
    },
  ] as const

  const toneMap = {
    primary: {
      shell: 'bg-[#F4F8FC]',
      icon: 'bg-[#D7E8F8] text-[#2F6FA8]',
      label: 'text-[#2F6FA8]',
    },
    warning: {
      shell: 'bg-[#FFF8E8]',
      icon: 'bg-[#FCE9B4] text-[#9A6700]',
      label: 'text-[#9A6700]',
    },
    neutral: {
      shell: 'bg-[#FFFDF9]',
      icon: 'bg-[#E9EEF5] text-[#516273]',
      label: 'text-[#516273]',
    },
  } as const

  return (
    <section className="animate-slide-up space-y-3">
      <div>
        <h2 className="text-lg font-bold text-[#001D3D]">{'\u01afu \u0074\u0069\u00ea\u006e \u0068\u00f4\u006d \u006e\u0061\u0079'}</h2>
        <p className="mt-1 text-sm text-[#6B7280]">{'\u004d\u1edf \u0076\u00e0\u006f \u006c\u00e0 \u0062\u0069\u1ebf\u0074 \u006e\u0067\u0061\u0079 \u0076\u0069\u1ec7\u0063 \u0111\u0061\u006e\u0067 \u0063\u1ea7\u006e \u0078\u1eed \u006c\u00fd\u002e'}</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon
          const tone = toneMap[card.tone]

          return (
            <div
              key={card.label}
              className="rounded-[24px] bg-white p-4 shadow-[0_8px_24px_rgba(0,29,61,0.06)]"
            >
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-2xl ${tone.icon}`}>
                <Icon size={18} />
              </div>
              <div className={`mt-3 text-xs font-semibold uppercase tracking-[0.12em] ${tone.label}`}>
                {card.label}
              </div>
              <div className={`mt-3 rounded-2xl p-3 text-sm font-semibold text-[#001D3D] ${tone.shell}`}>
                {card.value}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
