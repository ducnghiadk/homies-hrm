'use client'

import { CheckCircle, Circle } from 'lucide-react'

export type OnboardingChecklistProgressView = {
  status: 'not_started' | 'learning' | 'pending_review' | 'passed' | 'needs_coaching' | 'not_applicable'
  note?: string
}

type OnboardingChecklistItemCardProps = {
  title: string
  employeeAction: string
  buddyAction: string
  managerCheck: string
  successCriteria: string
  actionOwnerLabel: string
  required: boolean
  progress: OnboardingChecklistProgressView
  onStart?: () => void
  onRequestReview?: () => void
}

function getChecklistItemTone(status: OnboardingChecklistProgressView['status']) {
  if (status === 'passed') {
    return {
      icon: <CheckCircle size={20} style={{ color: 'var(--success)' }} />,
      label: '\u0110\u1ea1t \u0072\u1ed3\u0069',
      badgeClass: 'bg-[#DDF4EC] text-[#107C41]',
    }
  }

  if (status === 'learning') {
    return {
      icon: <Circle size={20} style={{ color: 'var(--warning)' }} />,
      label: '\u0110\u0061\u006e\u0067 \u006c\u00e0\u006d',
      badgeClass: 'bg-[#FFF4D6] text-[#8A5B00]',
    }
  }

  if (status === 'pending_review') {
    return {
      icon: <Circle size={20} style={{ color: '#2F6FA8' }} />,
      label: '\u0043\u0068\u1edd \u0111\u00e1\u006e\u0068 \u0067\u0069\u00e1',
      badgeClass: 'bg-[#EEF4FB] text-[#2F6FA8]',
    }
  }

  if (status === 'needs_coaching') {
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
  employeeAction,
  buddyAction,
  managerCheck,
  successCriteria,
  actionOwnerLabel,
  required,
  progress,
  onStart,
  onRequestReview,
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

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl bg-[#FFFDF9] px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#2F6FA8]">
                {'\u0042\u1ea1\u006e \u0063\u1ea7\u006e \u006c\u00e0\u006d \u0067\u00ec'}
              </div>
              <div className="mt-1 text-sm text-[#001D3D]">{employeeAction}</div>
            </div>
            <div className="rounded-2xl bg-[#FFFDF9] px-3 py-3">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-[#2F6FA8]">
                {'\u0042\u0075\u0064\u0064\u0079 \u0070\u0068\u1ea3\u0069 \u0068\u1ed7 \u0074\u0072\u1ee3 \u0067\u00ec'}
              </div>
              <div className="mt-1 text-sm text-[#001D3D]">{buddyAction}</div>
            </div>
          </div>

          <div className="mt-3 rounded-2xl bg-[#FFFDF9] px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#2F6FA8]">
              {'\u0054\u0069\u00ea\u0075 \u0063\u0068\u0075\u1ea9\u006e \u0111\u1ea1t'}
            </div>
            <div className="mt-1 text-sm text-[#001D3D]">{successCriteria}</div>
          </div>

          <div className="mt-3 rounded-2xl bg-[#F7F9FC] px-3 py-3">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-[#516273]">
              {'\u0051\u0075\u1ea3\u006e \u006c\u00fd \u0063\u1ea7\u006e \u006b\u0069\u1ec3\u006d \u0067\u00ec'}
            </div>
            <div className="mt-1 text-sm text-[#001D3D]">{managerCheck}</div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded-full px-3 py-1 font-bold ${required ? 'bg-[#FFF4D6] text-[#8A5B00]' : 'bg-[#EEF4FB] text-[#2F6FA8]'}`}>
              {required ? 'Bat buoc' : 'Nen hoan thanh'}
            </span>
            <span className="rounded-full bg-[#F5F5F5] px-3 py-1 font-semibold text-[#516273]">
              {actionOwnerLabel}
            </span>
          </div>

          {(onStart || onRequestReview) ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {onStart ? (
                <button
                  type="button"
                  onClick={onStart}
                  className="rounded-xl bg-[#EEF4FB] px-3 py-2 text-sm font-semibold text-[#2F6FA8]"
                >
                  {'\u0042\u1eaft \u0111\u1ea7u \u0068\u1ecdc'}
                </button>
              ) : null}
              {onRequestReview ? (
                <button
                  type="button"
                  onClick={onRequestReview}
                  className="rounded-xl bg-[#2F6FA8] px-3 py-2 text-sm font-semibold text-white"
                >
                  {'\u0059\u00ea\u0075 \u0063\u1ea7\u0075 \u0111\u00e1\u006e\u0068 \u0067\u0069\u00e1'}
                </button>
              ) : null}
            </div>
          ) : null}

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
