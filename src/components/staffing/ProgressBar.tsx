'use client'

import { Check } from 'lucide-react'
import { PROGRESS_MESSAGES } from '@/lib/staffing/onboarding-templates'

interface ProgressBarProps {
  currentStep: number
  totalSteps?: number
  stepLabels?: string[]
  showPercentage?: boolean
  showMessage?: boolean
}

const DEFAULT_LABELS = ['Thông tin', 'Traffic', 'Lương', 'Kết quả']

export default function ProgressBar({
  currentStep,
  totalSteps = 4,
  stepLabels = DEFAULT_LABELS,
  showPercentage = true,
  showMessage = true,
}: ProgressBarProps) {
  const percent = Math.round((currentStep / totalSteps) * 100)
  const msg = PROGRESS_MESSAGES[currentStep]

  return (
    <div className="max-w-xl mx-auto mb-10 space-y-3 animate-in fade-in duration-300">
      {/* Step dots with labels */}
      <div className="flex justify-between items-start">
        {stepLabels.map((label, i) => {
          const stepNum = i + 1
          const isCompleted = currentStep > stepNum
          const isCurrent = currentStep === stepNum

          return (
            <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
              {/* Dot */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  transition-all duration-500
                  ${isCompleted
                    ? 'bg-success-500 text-white scale-100'
                    : isCurrent
                      ? 'bg-primary text-white ring-4 ring-primary/20 animate-pulse'
                      : 'bg-gray-200 text-gray-400'
                  }
                `}
              >
                {isCompleted ? <Check size={14} strokeWidth={3} /> : stepNum}
              </div>

              {/* Label */}
              <span className={`text-xs font-medium text-center leading-tight ${
                isCompleted ? 'text-success-600'
                : isCurrent ? 'text-primary font-bold'
                : 'text-gray-300'
              }`}>
                {label}
              </span>
            </div>
          )
        })}
      </div>

      {/* Connecting lines between dots */}
      <div className="relative -mt-[52px] mx-4 flex" style={{ top: '16px' }}>
        {Array.from({ length: totalSteps - 1 }, (_, i) => (
          <div key={i} className="flex-1 h-0.5 mx-4">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                currentStep > i + 1 ? 'bg-success-500' : 'bg-gray-200'
              }`}
            />
          </div>
        ))}
      </div>

      {/* Spacer for the lines overlay */}
      <div className="h-2" />

      {/* Progress bar */}
      <div className="h-2 bg-primary-50 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-700 ease-out rounded-full"
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Percentage + Message */}
      <div className="flex items-center justify-between">
        {showMessage && msg && (
          <span className="text-sm text-gray-600">
            {msg.emoji} {msg.text}
          </span>
        )}
        {showPercentage && (
          <span className="text-xs font-bold text-gray-400 ml-auto">{percent}%</span>
        )}
      </div>
    </div>
  )
}
