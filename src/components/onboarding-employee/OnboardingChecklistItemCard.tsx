'use client'

import { CheckCircle, Circle } from 'lucide-react'

export type OnboardingChecklistProgressView = {
  status: 'not_started' | 'in_progress' | 'passed' | 'need_more_coaching'
  note?: string
}

type OnboardingChecklistItemCardProps = {
  title: string
  instructionText: string
  successCriteria: string
  progress: OnboardingChecklistProgressView
}

function getChecklistItemTone(status: OnboardingChecklistProgressView['status']) {
  if (status === 'passed') {
    return {
      icon: <CheckCircle size={20} style={{ color: 'var(--success)' }} />,
      label: '\u0110\u1ea1t \u0072\u1ed3\u0069',
      badgeClass: 'bg-[#DDF4EC] text-[#107C41]',
    }
  }

  if (status === 'in_progress') {
    return {
      icon: <Circle size={20} style={{ color: 'var(--warning)' }} />,
      label: '\u0110\u0061\u006e\u0067 \u006c\u00e0\u006d',
      badgeClass: 'bg-[#FFF4D6] text-[#8A5B00]',
    }
  }

  if (status === 'need_more_coaching') {
    return {
      icon: <Circle size={20} style={{ color: 'var(--accent)' }} />,
      label: '\u0043\u1ea7\u006e \u006b\u00e8\u006d \u0074\u0068\u00ea\u006d',
      badgeClass: 'bg-[#EEF4FB] text-[#2F6FA8]',
    }
  }

  return {
    icon: <Circle size={20} style={{ color: 'var(--gray-300)' }} />,
    label: '\u0043\u0068\u01b0\u0061 \u006c\u00e0\u006d',
    badgeClass: 'bg-[#F5F5F5] text-[#6B7280]',
  }
}

export function OnboardingChecklistItemCard({
  title,
  instructionText,
  successCriteria,
  progress,
}: OnboardingChecklistItemCardProps) {
  const tone = getChecklistItemTone(progress.status)

  return (
    <article className="rounded-[24px] border border-[#F3E7C8] bg-white p-4 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
      <div className="flex items-start gap-3">
        {tone.icon}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold text-[#001D3D] md:text-base">{title}</span>
            <span className={`rounded-full px-3 py-1 text-[10px] font-bold whitespace-nowrap ${tone.badgeClass}`}>
              {tone.label}
            </span>
          </div>

          <div className="mt-1 text-sm text-[#4B5563]">{instructionText}</div>

          <div className="mt-3 rounded-2xl bg-[#FFFDF9] px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#2F6FA8]">
              {'\u0054\u0069\u00ea\u0075 \u0063\u0068\u0075\u1ea9\u006e \u0111\u1ea1t'}
            </div>
            <div className="mt-1 text-sm text-[#001D3D]">{successCriteria}</div>
          </div>

          {progress.note ? (
            <div className="mt-3 text-sm text-[#6B7280]">
              {'\u0047\u0068\u0069 \u0063\u0068\u00fa'}: {progress.note}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
