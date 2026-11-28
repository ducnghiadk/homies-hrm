'use client'

import Link from 'next/link'
import { CheckCircle2, Circle, Layers, Send, Zap } from 'lucide-react'

type Props = {
  availabilityCount: number
  totalAssigned: number
  isPublished: boolean
  isSeedingDraft: boolean
  registrationsHref: string
  onSeed: () => void
  onPublish: () => void
}

/** Thanh 3 bước xếp lịch tuần cho quản lý: xem lịch rảnh -> điền nháp & chỉnh -> chốt lịch. */
export default function ScheduleStepsCard({
  availabilityCount,
  totalAssigned,
  isPublished,
  isSeedingDraft,
  registrationsHref,
  onSeed,
  onPublish,
}: Props) {
  const steps = [
    {
      key: 'availability',
      done: availabilityCount > 0,
      title: 'Bước 1: Xem lịch rảnh',
      detail:
        availabilityCount > 0
          ? `Nhân viên đã nộp ${availabilityCount} khung giờ rảnh.`
          : 'Chưa có ai nộp lịch rảnh tuần này.',
      action: (
        <Link
          href={registrationsHref}
          className="inline-flex items-center gap-1.5 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50"
        >
          <Layers size={14} />
          Xem lịch rảnh
        </Link>
      ),
    },
    {
      key: 'draft',
      done: totalAssigned > 0,
      title: 'Bước 2: Điền vào bản nháp rồi chỉnh',
      detail:
        totalAssigned > 0
          ? `Đã xếp ${totalAssigned} ca. Bấm vào ô trên bảng để thêm hoặc bớt người.`
          : 'Bấm "Điền tự động" để lấy người từ lịch rảnh, hoặc bấm vào ô trên bảng để thêm người.',
      action:
        !isPublished && availabilityCount > 0 ? (
          <button
            type="button"
            disabled={isSeedingDraft}
            onClick={onSeed}
            className="inline-flex items-center gap-1.5 rounded-xl border border-sky-300 bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-900 hover:bg-sky-100 disabled:opacity-50"
          >
            <Zap size={14} className="text-amber-500" />
            {isSeedingDraft ? 'Đang điền...' : 'Điền tự động'}
          </button>
        ) : null,
    },
    {
      key: 'publish',
      done: isPublished,
      title: 'Bước 3: Chốt lịch',
      detail: isPublished
        ? 'Đã chốt. Nhân viên đã thấy lịch và được báo khi có thay đổi.'
        : 'Hệ thống kiểm tra trùng ca, vượt giờ rồi gửi lịch cho nhân viên.',
      action: !isPublished ? (
        <button
          type="button"
          onClick={onPublish}
          disabled={totalAssigned === 0}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2F6FA8] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#1D3E61] disabled:opacity-40"
        >
          <Send size={14} />
          Chốt lịch
        </button>
      ) : null,
    },
  ]
  const currentIndex = steps.findIndex((s) => !s.done)

  return (
    <div className="grid gap-2 rounded-2xl border border-gray-200/90 bg-white p-3 shadow-xs md:grid-cols-3">
      {steps.map((step, i) => {
        const isCurrent = i === currentIndex
        return (
          <div
            key={step.key}
            className={`flex flex-col gap-2 rounded-xl border p-3 ${
              isCurrent ? 'border-[#2F6FA8] bg-blue-50/50' : 'border-gray-100 bg-gray-50/50'
            }`}
          >
            <div className="flex items-start gap-2">
              {step.done ? (
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-600" />
              ) : (
                <Circle size={18} className={`mt-0.5 shrink-0 ${isCurrent ? 'text-[#2F6FA8]' : 'text-gray-300'}`} />
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#001D3D]">{step.title}</p>
                <p className="text-xs text-gray-600">{step.detail}</p>
              </div>
            </div>
            {step.action && <div className="pl-6">{step.action}</div>}
          </div>
        )
      })}
    </div>
  )
}
