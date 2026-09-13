'use client'

import type { TrafficTemplate, SalaryTemplate, TrafficTimeSlot } from '@/lib/staffing/onboarding-templates'

// --- Types ---

interface TemplateSelectorProps<T> {
  templates: T[]
  selectedKey: string | null
  onSelect: (key: string) => void
  defaultKey?: string
  renderCard: (template: T, isSelected: boolean, isDefault: boolean) => React.ReactNode
  columns?: 2 | 3 | 4
}

// --- Generic Selector ---

export default function TemplateSelector<T extends { key: string }>({
  templates, selectedKey, onSelect, defaultKey, renderCard, columns = 4
}: TemplateSelectorProps<T>) {
  const gridClass = columns === 2
    ? 'grid-cols-2'
    : columns === 3
      ? 'grid-cols-3'
      : 'grid-cols-2 md:grid-cols-4'

  return (
    <div className={`grid ${gridClass} gap-3`}>
      {templates.map((t, i) => {
        const isSelected = selectedKey === t.key
        const isDefault = defaultKey === t.key

        return (
          <button
            key={t.key}
            onClick={() => onSelect(t.key)}
            className={`
              relative text-left p-4 rounded-xl border-2 transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-1
              hover:scale-[1.02] active:scale-[0.98]
              animate-in fade-in slide-in-from-bottom-2
              ${isSelected
                ? 'border-primary bg-primary/5 ring-2 ring-primary/20 shadow-md'
                : 'border-gray-100 bg-white hover:border-primary-200 hover:bg-primary-50/30 hover:shadow-sm'
              }
            `}
            style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'both' }}
            tabIndex={0}
            role="option"
            aria-selected={isSelected}
          >
            {/* Default badge */}
            {isDefault && !isSelected && (
              <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-warning-500 text-white text-[9px] font-bold rounded-full shadow-sm">
                MẶC ĐỊNH
              </div>
            )}
            {isSelected && (
              <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-primary text-white text-[9px] font-bold rounded-full shadow-sm">
                ĐÃ CHỌN ✓
              </div>
            )}

            {renderCard(t, isSelected, isDefault)}
          </button>
        )
      })}
    </div>
  )
}

// --- Traffic Card Renderer ---

function MiniSparkline({ pattern }: { pattern: TrafficTimeSlot[] }) {
  const max = Math.max(...pattern.map(p => p.percent))
  return (
    <div className="flex items-end gap-[2px] h-6 my-2">
      {pattern.map((slot, i) => (
        <div
          key={i}
          className={`flex-1 rounded-t-sm transition-all ${
            slot.level === 'high' ? 'bg-warning-400'
            : slot.level === 'medium' ? 'bg-primary-400'
            : 'bg-gray-200'
          }`}
          style={{ height: `${Math.max(15, (slot.percent / max) * 100)}%` }}
          title={`${slot.hours}: ${slot.percent}%`}
        />
      ))}
    </div>
  )
}

export function TrafficCardRenderer(template: TrafficTemplate, isSelected: boolean) {
  return (
    <div>
      <div className="text-2xl mb-1">{template.icon}</div>
      {template.pattern && <MiniSparkline pattern={template.pattern} />}
      {!template.pattern && <div className="h-6 my-2" />}
      <div className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
        {template.name}
      </div>
      <div className="text-xs text-gray-400 mt-0.5">{template.description}</div>
    </div>
  )
}

// --- Salary Card Renderer ---

export function SalaryCardRenderer(template: SalaryTemplate, isSelected: boolean) {
  return (
    <div>
      <div className="text-2xl mb-2">{template.icon}</div>
      <div className={`text-sm font-bold ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
        {template.name}
      </div>
      {template.ftRange && (
        <div className="mt-2 space-y-0.5">
          <div className="text-xs text-gray-500">
            FT: <span className="font-semibold text-gray-700">{template.ftRange}</span>
          </div>
          <div className="text-xs text-gray-500">
            PT: <span className="font-semibold text-gray-700">{template.ptRange}/h</span>
          </div>
        </div>
      )}
      {!template.ftRange && (
        <div className="text-xs text-gray-400 mt-2">Nhập giá trị tùy chỉnh</div>
      )}
    </div>
  )
}
