'use client'

import { AlertCircle, CheckCircle2, Copy, Plus, Trash2, Zap, Sliders } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import type { KpiGroupDefinition } from '@/lib/kpi/types'

export interface KPIGroupEditorProps {
  groups: KpiGroupDefinition[]
  selectedGroupId: string
  onSelectGroup(id: string): void
  onAddGroup(): void
  onDuplicateGroup(id: string): void
  onDeleteGroup?(id: string): void
  onApplyPreset?(presetType: 'standard_5' | 'revenue_heavy' | 'discipline_heavy'): void
  onUpdateGroup(id: string, patch: Partial<KpiGroupDefinition>): void
}

const TAG_LABELS: Record<KpiGroupDefinition['tag'], string> = {
  revenue: 'Doanh thu & Upsell',
  customer_service: 'Dịch vụ khách hàng',
  operations: 'Vận hành ca',
  discipline: 'Kỷ luật & Chuyên cần',
  custom: 'Tinh thần phối hợp / Khác',
}

const TAG_COLORS: Record<KpiGroupDefinition['tag'], { bg: string; text: string; bar: string }> = {
  revenue: { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'text-emerald-700', bar: 'bg-emerald-500' },
  operations: { bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', text: 'text-indigo-700', bar: 'bg-indigo-500' },
  discipline: { bg: 'bg-amber-50 text-amber-800 border-amber-200', text: 'text-amber-700', bar: 'bg-amber-500' },
  customer_service: { bg: 'bg-blue-50 text-[#2F6FA8] border-blue-200', text: 'text-[#2F6FA8]', bar: 'bg-[#2F6FA8]' },
  custom: { bg: 'bg-purple-50 text-purple-800 border-purple-200', text: 'text-purple-700', bar: 'bg-purple-500' },
}

export function KPIGroupEditor({
  groups,
  selectedGroupId,
  onSelectGroup,
  onAddGroup,
  onDuplicateGroup,
  onDeleteGroup,
  onApplyPreset,
  onUpdateGroup,
}: KPIGroupEditorProps) {
  const totalWeight = groups.reduce((sum, g) => sum + (Number(g.weight) || 0), 0)
  const isExact100 = totalWeight === 100

  return (
    <section className="rounded-2xl border border-gray-100 bg-white shadow-2xs overflow-hidden">
      {/* Header with Quick Presets */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 px-6 py-4 bg-gray-50/50">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Bước 2: Phân bổ trọng số</span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-[#2F6FA8]">
              {groups.length} Trụ tiêu chí
            </span>
          </div>
          <h3 className="mt-0.5 text-base font-bold text-[#001D3D]">Thiết lập Trọng số các Trụ đánh giá</h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onApplyPreset && (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="bg-amber-50/70 border-amber-200 text-xs font-bold text-amber-900 hover:bg-amber-100 h-8.5 px-3 shadow-2xs"
                icon={<Zap size={13} className="text-amber-600 fill-amber-500" />}
                onClick={() => onApplyPreset('standard_5')}
                title="Áp dụng mẫu chuẩn: Doanh thu 30%, Vận hành 25%, Kỷ luật 20%, Dịch vụ KH 15%, Phối hợp 10%"
              >
                1-Chạm: Mẫu Chuẩn F&B (100%)
              </Button>
            </div>
          )}
          <Button
            type="button"
            size="sm"
            className="bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-semibold h-8.5 px-3"
            icon={<Plus size={14} />}
            onClick={onAddGroup}
          >
            Thêm trụ mới
          </Button>
        </div>
      </div>

      {/* Visual Weight Distribution Segmented Bar */}
      <div className="border-b border-gray-100 bg-white px-6 py-4">
        <div className="flex items-center justify-between text-xs mb-2.5">
          <span className="text-gray-700 font-semibold flex items-center gap-1.5">
            <Sliders size={14} className="text-[#2F6FA8]" />
            Thước đo cân đối tổng trọng số:
          </span>
          <div className="flex items-center gap-2">
            <span className={`font-mono tabular-nums font-bold text-base ${isExact100 ? 'text-emerald-700' : 'text-rose-600'}`}>
              {totalWeight}% / 100%
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                isExact100
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}
            >
              {isExact100 ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
              {isExact100 ? 'Hợp lệ 100%' : totalWeight > 100 ? `Vượt quá +${totalWeight - 100}%` : `Còn thiếu ${100 - totalWeight}%`}
            </span>
          </div>
        </div>

        {/* Multi-segmented Progress Bar */}
        <div className="h-3.5 w-full rounded-full bg-gray-100 overflow-hidden flex shadow-inner border border-gray-200/60">
          {groups.map((group) => {
            const style = TAG_COLORS[group.tag] || TAG_COLORS.custom
            const weightWidth = Math.max(0, Math.min(100, group.weight))
            if (weightWidth === 0) return null

            return (
              <div
                key={group.id}
                style={{ width: `${weightWidth}%` }}
                className={`${style.bar} transition-all duration-300 relative group cursor-pointer hover:opacity-90 border-r border-white/40 last:border-r-0`}
                title={`${group.name}: ${group.weight}%`}
              />
            )
          })}
        </div>
      </div>

      {/* Interactive Pillar Cards with Sliders */}
      <div className="space-y-3 p-6">
        {groups.map((group, index) => {
          const isSelected = group.id === selectedGroupId
          const style = TAG_COLORS[group.tag] || TAG_COLORS.custom
          const criteriaCount = group.criteria?.length || 0
          const measurableCount = group.criteria?.filter((criterion) => criterion.scoring_mode !== 'leader' || Boolean(criterion.source_key?.trim())).length || 0
          const automaticRatio = criteriaCount > 0 ? Math.round((measurableCount / criteriaCount) * 100) : 0
          const recommendedRanges = (group.criteria ?? []).map((criterion) => criterion.recommended_weight_range).filter((range): range is { min: number; max: number } => Boolean(range))
          const recommendedMin = recommendedRanges.length > 0 ? Math.min(...recommendedRanges.map((range) => range.min)) : null
          const recommendedMax = recommendedRanges.length > 0 ? Math.max(...recommendedRanges.map((range) => range.max)) : null
          const outsideRecommendedRange = (group.criteria ?? []).some((criterion) => criterion.recommended_weight_range && (criterion.weight < criterion.recommended_weight_range.min || criterion.weight > criterion.recommended_weight_range.max))

          return (
            <article
              key={group.id}
              role="button"
              tabIndex={0}
              aria-pressed={isSelected}
              onClick={() => onSelectGroup(group.id)}
              onKeyDown={(event) => {
                if (event.key !== 'Enter' && event.key !== ' ') return
                event.preventDefault()
                onSelectGroup(group.id)
              }}
              className={[
                'rounded-xl border p-4.5 transition-all duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#2F6FA8]/30',
                isSelected
                  ? 'border-[#2F6FA8] bg-blue-50/30 shadow-xs ring-1 ring-[#2F6FA8]/25'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/40',
              ].join(' ')}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Left: Pillar Identity & Tag */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-gray-100 font-mono text-[11px] font-bold text-gray-700 shrink-0">
                      {index + 1}
                    </span>
                    <input
                      aria-label={`Tên trụ tiêu chí ${index + 1}`}
                      value={group.name}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(e) => onUpdateGroup(group.id, { name: e.target.value })}
                      className="font-bold text-sm text-[#001D3D] bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#2F6FA8] focus:bg-white px-1 py-0.5 rounded outline-none transition"
                      placeholder="Tên trụ tiêu chí"
                    />
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold border ${style.bg}`}>
                      {TAG_LABELS[group.tag] || group.tag}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-gray-500">
                    <span>{criteriaCount} tiêu chí thành phần</span>
                    <span>•</span>
                    <span>Tự động {automaticRatio}%</span>
                    {recommendedMin !== null && recommendedMax !== null ? <><span>•</span><span>Khuyến nghị {recommendedMin}-{recommendedMax}%</span></> : null}
                    <label className="inline-flex items-center gap-1.5 cursor-pointer text-gray-600 hover:text-gray-900">
                      <input
                        type="checkbox"
                        onClick={(event) => event.stopPropagation()}
                        checked={group.promotion_core}
                        onChange={(e) => onUpdateGroup(group.id, { promotion_core: e.target.checked })}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-[#2F6FA8] focus:ring-[#2F6FA8]"
                      />
                      <span>Bắt buộc đạt điểm khi xét thăng tiến</span>
                    </label>
                  </div>
                  {outsideRecommendedRange ? <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] font-semibold text-amber-800"><AlertCircle size={13} /> Có tiêu chí ngoài khoảng trọng số khuyến nghị.</div> : null}
                </div>

                {/* Right: Interactive Slider & Numeric Input */}
                <div className="flex items-center gap-4 shrink-0">
                  {/* Slider Control */}
                  <div className="w-36 sm:w-48 flex items-center gap-2">
                    <input
                      aria-label={`Điều chỉnh trọng số trụ ${group.name}`}
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={group.weight}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(e) => onUpdateGroup(group.id, { weight: Number(e.target.value) })}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#2F6FA8]"
                    />
                  </div>

                  {/* Weight Box */}
                  <div className="relative flex items-center">
                    <input
                      aria-label={`Nhập trọng số trụ ${group.name}`}
                      type="number"
                      min={0}
                      max={100}
                      value={group.weight}
                      onClick={(event) => event.stopPropagation()}
                      onChange={(e) => onUpdateGroup(group.id, { weight: Number(e.target.value) })}
                      className="w-18 rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 text-center text-sm font-mono font-bold tabular-nums text-[#001D3D] outline-none focus:border-[#2F6FA8] focus:ring-1 focus:ring-[#2F6FA8]"
                    />
                    <span className="ml-1 text-xs font-bold text-gray-400">%</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-gray-400 hover:text-[#2F6FA8] hover:bg-blue-50 h-8 w-8 p-0"
                      onClick={(event) => {
                        event.stopPropagation()
                        onDuplicateGroup(group.id)
                      }}
                      title="Nhân bản trụ này"
                    >
                      <Copy size={13} />
                    </Button>
                    {onDeleteGroup && groups.length > 1 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 h-8 w-8 p-0"
                        onClick={(event) => {
                          event.stopPropagation()
                          onDeleteGroup(group.id)
                        }}
                        title="Xóa trụ này"
                      >
                        <Trash2 size={13} />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
