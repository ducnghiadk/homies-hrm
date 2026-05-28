'use client'

import { Calendar, Flag, User } from 'lucide-react'

export type OnboardingStageViewStatus = 'passed' | 'current' | 'locked'

export type OnboardingStageItemView = {
  id: string
  code: string
  label: string
  passed_items: number
  total_items: number
  status: OnboardingStageViewStatus
}

type OnboardingHeroCardProps = {
  employeeName: string
  positionLabel: string
  storeLabel: string
  headline: string
  startDateLabel: string
  buddyName: string
  currentStageLabel: string
  nextStageLabel: string
  stageStatusLabel: string
}

export function OnboardingHeroCard({
  employeeName,
  positionLabel,
  storeLabel,
  headline,
  startDateLabel,
  buddyName,
  currentStageLabel,
  nextStageLabel,
  stageStatusLabel,
}: OnboardingHeroCardProps) {
  const employeeInitial = employeeName.trim().charAt(0).toUpperCase() || 'N'

  return (
    <section className="animate-fade-in rounded-[28px] border border-white/70 bg-white p-5 shadow-[0_10px_30px_rgba(0,29,61,0.08)] md:p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] bg-[#E8F1FA] text-lg font-bold text-[#001D3D]">
          {employeeInitial}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-semibold text-[#2F6FA8]">{'\u004f\u006e\u0062\u006f\u0061\u0072\u0064\u0069\u006e\u0067 \u006e\u0068\u00e2\u006e \u0076\u0069\u00ea\u006e \u006d\u1edb\u0069'}</p>
          <div>
            <h1 className="text-2xl font-bold leading-tight text-[#001D3D] md:text-3xl">{employeeName}</h1>
            <p className="text-sm text-[#4B5563]">
              {positionLabel} {'\u2022'} {storeLabel}
            </p>
          </div>
          <div className="rounded-2xl bg-[#F4F8FC] px-4 py-3 text-sm font-semibold text-[#001D3D] md:text-base">
            {headline}
          </div>
          <div className="text-sm text-[#516273]">{stageStatusLabel}</div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#FFFDF9] p-3">
          <Calendar size={16} className="mb-2 text-[#2F6FA8]" />
          <div className="text-xs text-[#6B7280]">{'\u0042\u1eaft \u0111\u1ea7u'}</div>
          <div className="mt-1 text-sm font-semibold text-[#001D3D]">{startDateLabel}</div>
        </div>

        <div className="rounded-2xl bg-[#FFFDF9] p-3">
          <User size={16} className="mb-2 text-[#1E9E57]" />
          <div className="text-xs text-[#6B7280]">{'\u0042\u0075\u0064\u0064\u0079'}</div>
          <div className="mt-1 text-sm font-semibold text-[#001D3D]">{buddyName}</div>
        </div>

        <div className="rounded-2xl bg-[#FFFDF9] p-3">
          <Flag size={16} className="mb-2 text-[#F6C85F]" />
          <div className="text-xs text-[#6B7280]">{'\u0043\u0068\u1eb7\u006e\u0067 \u0068\u0069\u1ec7\u006e \u0074\u1ea1\u0069'}</div>
          <div className="mt-1 text-sm font-semibold text-[#001D3D]">{currentStageLabel}</div>
          <div className="mt-1 text-xs text-[#6B7280]">{nextStageLabel}</div>
        </div>
      </div>
    </section>
  )
}
