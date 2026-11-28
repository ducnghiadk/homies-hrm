'use client'

import React from 'react'
import type { KpiProgramSetupStep } from '@/lib/kpi/types'
import { Check } from 'lucide-react'

export type KPIProgramStepperProps = {
  current: KpiProgramSetupStep
  completed: KpiProgramSetupStep[]
  onSelect(step: KpiProgramSetupStep): void
}

// 4 bước hiển thị. Bước 3 gồm 2 màn liền nhau (cách đánh giá, điều kiện đạt); dữ liệu và tên bước giữ nguyên.
const STEPS: ReadonlyArray<readonly [KpiProgramSetupStep, string, string, KpiProgramSetupStep[]]> = [
  ['purpose', 'Mục tiêu', 'Bạn muốn giải quyết việc gì?', ['purpose']],
  ['scope', 'Lộ trình', 'Áp dụng cho ai?', ['scope']],
  ['sources', 'Cách đánh giá và điều kiện', 'Dùng dữ liệu nào, khi nào đạt?', ['sources', 'readiness']],
  ['review', 'Xem trước', 'Kiểm tra và áp dụng', ['review']],
]

export function KPIProgramStepper({ current, completed, onSelect }: KPIProgramStepperProps) {
  const currentIndex = STEPS.findIndex(([, , , members]) => members.includes(current))

  return (
    <nav aria-label="Tiến trình thiết lập chương trình đánh giá" className="w-full">
      <ol className="grid grid-cols-1 gap-2.5 sm:grid-cols-4">
        {STEPS.map(([stepKey, label, subtitle, members], index) => {
          const isCurrent = members.includes(current)
          const isCompleted = stepKey !== 'review' && members.every((m) => completed.includes(m))
          const isAccessible = isCurrent || isCompleted || index <= currentIndex

          return (
            <li key={stepKey} className="relative flex">
              <button
                type="button"
                disabled={!isAccessible}
                onClick={() => isAccessible && !isCurrent && onSelect(stepKey)}
                aria-current={isCurrent ? 'step' : undefined}
                className={`group flex w-full flex-col justify-between rounded-2xl border p-3.5 text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#2F6FA8] ${
                  isCurrent
                    ? 'border-[#2F6FA8] bg-white shadow-xs ring-1 ring-[#2F6FA8]/20'
                    : isCompleted
                    ? 'border-gray-200 bg-white hover:border-[#2F6FA8]/50 cursor-pointer'
                    : 'border-gray-100 bg-gray-50/70 opacity-60 cursor-not-allowed'
                }`}
              >
                {/* Header bước: Icon số hoặc Check + Tên bước */}
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'bg-[#2F6FA8] text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isCompleted && !isCurrent ? <Check size={13} strokeWidth={3} /> : index + 1}
                  </span>
                  <span
                    className={`text-xs font-bold tracking-tight ${
                      isCurrent ? 'text-[#001D3D]' : isCompleted ? 'text-gray-800' : 'text-gray-500'
                    }`}
                  >
                    {label}
                  </span>
                </div>

                {/* Phụ đề giải thích */}
                <p className="mt-1.5 text-[11px] leading-tight text-gray-500 line-clamp-2">
                  {subtitle}
                  {isCurrent && members.length > 1 ? ` (phần ${members.indexOf(current) + 1}/${members.length})` : ''}
                </p>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
