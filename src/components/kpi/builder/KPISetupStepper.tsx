'use client'

import { Check, Circle } from 'lucide-react'

import type { KpiSetupStep } from '@/lib/kpi/types'

export type KPISetupStepperProps = {
  current: KpiSetupStep
  completed: KpiSetupStep[]
  onSelect(step: KpiSetupStep): void
}

const STEPS: Array<{ id: KpiSetupStep; label: string; description: string }> = [
  { id: 'template', label: 'Chọn bộ mẫu', description: 'Bắt đầu nhanh với F&B' },
  { id: 'criteria', label: 'Tiêu chí', description: 'Tinh chỉnh trụ và chỉ số' },
  { id: 'targets', label: 'Mục tiêu', description: 'Đặt ngưỡng theo kỳ' },
  { id: 'overrides', label: 'Ngoại lệ', description: 'Điều chỉnh theo cửa hàng' },
  { id: 'publish', label: 'Công bố', description: 'Kiểm tra và kích hoạt' },
]

export function KPISetupStepper({ current, completed, onSelect }: KPISetupStepperProps) {
  return (
    <nav aria-label="Các bước thiết lập KPI" className="rounded-2xl border border-[#eadfc8] bg-white p-3 shadow-sm">
      <ol className="grid gap-2 md:grid-cols-5">
        {STEPS.map((step, index) => {
          const isCurrent = current === step.id
          const isCompleted = completed.includes(step.id)
          return (
            <li key={step.id}>
              <button
                type="button"
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => onSelect(step.id)}
                className={`flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                  isCurrent ? 'bg-[#eaf3fb] text-[#1D3E61] ring-1 ring-[#2F6FA8]/30' : 'hover:bg-[#fff8e8]'
                }`}
              >
                <span className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                  isCompleted ? 'border-emerald-500 bg-emerald-500 text-white' : isCurrent ? 'border-[#2F6FA8] text-[#2F6FA8]' : 'border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? <Check size={14} /> : isCurrent ? index + 1 : <Circle size={12} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold">{step.label}</span>
                  <span className="mt-0.5 block text-[10px] text-gray-500">{step.description}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
