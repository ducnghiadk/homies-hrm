'use client'

import { useState, useMemo } from 'react'
import { OptimizationPlan } from '@/lib/staffing/types'
import MetricCard from '@/components/ui/MetricCard'
import CollapsibleSection from '@/components/ui/CollapsibleSection'
import { Check, Star, Calendar, Sparkles, BarChart3, Briefcase, Shirt, Banknote, Rocket } from 'lucide-react'

interface FeaturedPlanCardProps {
  plans: OptimizationPlan[]
  selectedId?: string
  onSelect: (plan: OptimizationPlan) => void
  onViewDetail: (plan: OptimizationPlan) => void
  showComparison?: boolean
  highlightBestValues?: boolean
}

/** Find the plan marked as recommended, or fallback to the middle plan */
function findFeaturedPlan(plans: OptimizationPlan[]): OptimizationPlan | null {
  if (!plans.length) return null
  const recommended = plans.find(
    p => p.badge?.includes('ĐỀ XUẤT') || p.badge?.includes('KHUYÊN DÙNG')
  )
  return recommended || plans[Math.floor(plans.length / 2)]
}

/** For each numeric criterion, find which plan has the best value */
function getBestValues(plans: OptimizationPlan[]) {
  if (plans.length === 0) return { lowestCost: '', highestStability: '' }
  const lowestCost = plans.reduce((best, p) =>
    p.totalCost < best.totalCost ? p : best
  )
  const highestStability = plans.reduce((best, p) => {
    const score = p.fulltime.length / (p.fulltime.length + p.parttime.length || 1)
    const bestScore = best.fulltime.length / (best.fulltime.length + best.parttime.length || 1)
    return score > bestScore ? p : best
  })
  return {
    lowestCost: lowestCost.id,
    highestStability: highestStability.id,
  }
}

// ─── Small Plan Card (for alternatives) ────────────────────────────
function SmallPlanCard({
  plan,
  isSelected,
  onSelect,
  onViewDetail,
}: {
  plan: OptimizationPlan
  isSelected: boolean
  onSelect: () => void
  onViewDetail: () => void
}) {
  return (
    <div
      className={`
        border rounded-xl p-4 transition-all duration-200
        ${isSelected
          ? 'ring-2 ring-primary ring-offset-2 border-primary/50 bg-primary/5'
          : 'border-gray-200 bg-white hover:border-primary/30 hover:bg-vanilla-50'
        }
      `}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-700 text-sm">{plan.name}</h4>
        {plan.badge && (
          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary-50 text-gray-600">
            {plan.badge}
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <div className="text-sm font-bold text-gray-700">{plan.fulltime.length}</div>
          <div className="text-xs text-gray-500 uppercase font-bold">FT</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-gray-700">{plan.parttime.length}</div>
          <div className="text-xs text-gray-500 uppercase font-bold">PT</div>
        </div>
        <div className="text-center">
          <div className="text-sm font-bold text-gray-700">{(plan.totalCost / 1000000).toFixed(0)}tr</div>
          <div className="text-xs text-gray-500 uppercase font-bold">/tháng</div>
        </div>
      </div>

      <p className="text-xs text-gray-500 mb-3">{plan.description}</p>

      <div className="flex gap-2">
        <button
          onClick={onSelect}
          className="flex-1 py-2 bg-primary-50 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
        >
          {isSelected ? <><Check size={12} className="inline" /> Đã chọn</> : 'Chọn'}
        </button>
        <button
          onClick={onViewDetail}
          className="py-2 px-3 text-primary hover:text-primary/80 text-xs hover:underline transition-colors"
        >
          Chi tiết
        </button>
      </div>
    </div>
  )
}

// ─── Comparison Table ──────────────────────────────────────────────
function ComparisonTable({
  plans,
  selectedId,
  highlightBest = true,
}: {
  plans: OptimizationPlan[]
  selectedId?: string
  highlightBest?: boolean
}) {
  const best = useMemo(() => getBestValues(plans), [plans])

  const rows: {
    label: string
    getValue: (p: OptimizationPlan) => string
    getBest: () => string
  }[] = [
    {
      label: 'Full-time',
      getValue: p => `${p.fulltime.length}`,
      getBest: () => best.highestStability,
    },
    {
      label: 'Part-time',
      getValue: p => `${p.parttime.length}`,
      getBest: () => '', // no "best" for PT count
    },
    {
      label: 'Chi phí/tháng',
      getValue: p => `${(p.totalCost / 1000000).toFixed(1)} tr`,
      getBest: () => best.lowestCost,
    },
    {
      label: 'Độ ổn định',
      getValue: p => {
        const score = Math.round(
          (p.fulltime.length / (p.fulltime.length + p.parttime.length || 1)) * 5
        )
        return '★'.repeat(score) || '★'
      },
      getBest: () => best.highestStability,
    },
  ]

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-vanilla-50">
          <tr>
            <th className="p-3 text-left text-xs font-medium text-gray-500">Tiêu chí</th>
            {plans.map(p => (
              <th
                key={p.id}
                className={`p-3 text-center text-xs font-bold ${
                  selectedId === p.id ? 'text-primary bg-primary/5' : 'text-gray-700'
                }`}
              >
                {p.name}
                {(p.badge?.includes('ĐỀ XUẤT') || p.badge?.includes('KHUYÊN DÙNG')) && (
                  <Star size={12} className="ml-1 inline text-warning-400" fill="currentColor" />
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map(row => (
            <tr key={row.label}>
              <td className="p-3 font-medium text-gray-600 text-xs">{row.label}</td>
              {plans.map(p => {
                const isBest = highlightBest && row.getBest() === p.id
                return (
                  <td
                    key={p.id}
                    className={`p-3 text-center text-xs ${
                      isBest
                        ? 'font-bold text-primary bg-primary/5'
                        : 'text-gray-600'
                    }`}
                  >
                    {row.getValue(p)}
                    {isBest && <Sparkles size={12} className="ml-1 inline text-primary" />}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── Main Component ────────────────────────────────────────────────
export default function FeaturedPlanCard({
  plans,
  selectedId,
  onSelect,
  onViewDetail,
  showComparison = false,
  highlightBestValues = true,
}: FeaturedPlanCardProps) {
  const [localSelectedId, setLocalSelectedId] = useState(selectedId)

  // Empty state
  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 size={48} className="text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Chưa có kết quả</h3>
        <p className="text-sm text-gray-500">Vui lòng hoàn thành các bước trước để xem phương án</p>
      </div>
    )
  }

  const featuredPlan = findFeaturedPlan(plans)
  const alternativePlans = plans.filter(p => p.id !== featuredPlan?.id)

  const handleSelect = (plan: OptimizationPlan) => {
    setLocalSelectedId(plan.id)
    onSelect(plan)
  }

  const currentSelected = localSelectedId || selectedId

  return (
    <div className="space-y-6">
      {/* ═══════════ FEATURED PLAN ═══════════ */}
      {featuredPlan && (
        <div
          className={`
            relative rounded-2xl border-2 overflow-hidden transition-all duration-200
            ${currentSelected === featuredPlan.id
              ? 'border-primary ring-2 ring-primary/20 shadow-xl'
              : 'border-primary/40 bg-gradient-to-br from-primary/5 to-white shadow-lg hover:shadow-xl'
            }
          `}
        >
          {/* Badge ribbon */}
          <div className="absolute top-0 right-0">
            <div className="bg-primary text-white text-xs font-bold px-4 py-1.5 rounded-bl-xl flex items-center gap-1">
              <Star size={12} fill="currentColor" /> ĐỀ XUẤT
            </div>
          </div>

          {/* Selected checkmark */}
          {currentSelected === featuredPlan.id && (
            <div className="absolute top-3 left-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center z-10">
              <Check size={14} className="text-white" />
            </div>
          )}

          <div className="p-6 pt-8">
            {/* Plan name */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">{featuredPlan.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{featuredPlan.description}</p>
            </div>

            {/* Key metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <MetricCard
                icon={<Briefcase size={18} className="text-primary-500" />}
                value={`${featuredPlan.fulltime.length}`}
                label="FULL-TIME"
              />
              <MetricCard
                icon={<Shirt size={18} className="text-primary-500" />}
                value={`${featuredPlan.parttime.length}`}
                label="PART-TIME"
              />
              <MetricCard
                icon={<Banknote size={18} className="text-success-500" />}
                value={`${(featuredPlan.totalCost / 1000000).toFixed(0)}tr`}
                label="/THÁNG"
                trend={
                  featuredPlan.savingsVsA && featuredPlan.savingsVsA > 0
                    ? {
                        direction: 'down' as const,
                        value: `Tiết kiệm ${(featuredPlan.savingsVsA / 1000000).toFixed(0)} tr`,
                      }
                    : undefined
                }
                variant={
                  featuredPlan.savingsVsA && featuredPlan.savingsVsA > 0
                    ? 'success'
                    : 'default'
                }
              />
            </div>

            {/* Pros as highlights */}
            <div className="space-y-2 mb-6">
              {featuredPlan.pros.map((pro, i) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-success-500 mt-0.5 shrink-0" />
                  <span>{pro}</span>
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleSelect(featuredPlan)}
                className={`
                  flex-1 py-3.5 rounded-xl font-bold text-sm
                  flex items-center justify-center gap-2
                  transition-all duration-200 active:scale-[0.98]
                  ${currentSelected === featuredPlan.id
                    ? 'bg-success-600 text-white shadow-md'
                    : 'bg-primary text-white shadow-md hover:bg-primary/90 hover:shadow-lg'
                  }
                `}
              >
                {currentSelected === featuredPlan.id ? <><Check size={14} /> Đã chọn</> : <><Rocket size={14} /> Chọn phương án này</>}
              </button>
              <button
                onClick={() => onViewDetail(featuredPlan)}
                className="
                  flex-1 py-3 rounded-xl font-medium text-sm
                  bg-primary-50 text-gray-700
                  hover:bg-gray-200 transition-colors
                  flex items-center justify-center gap-2
                "
              >
                <Calendar size={16} /> Xem lịch chi tiết
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ ALTERNATIVE PLANS ═══════════ */}
      {alternativePlans.length > 0 && (
        <CollapsibleSection
          title="Xem phương án khác"
          badge={alternativePlans.length}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {alternativePlans.map(plan => (
              <SmallPlanCard
                key={plan.id}
                plan={plan}
                isSelected={currentSelected === plan.id}
                onSelect={() => handleSelect(plan)}
                onViewDetail={() => onViewDetail(plan)}
              />
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* ═══════════ COMPARISON TABLE ═══════════ */}
      <CollapsibleSection
        title="So sánh chi tiết 3 phương án"
        defaultOpen={showComparison}
      >
        <ComparisonTable
          plans={plans}
          selectedId={currentSelected}
          highlightBest={highlightBestValues}
        />
      </CollapsibleSection>
    </div>
  )
}
