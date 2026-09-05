'use client'

import React, { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { FNB_KPI_TEMPLATES } from '@/lib/kpi/fnb-template-catalog'
import type { KpiCriterionDefinition, KpiMetricDirection, KpiMetricUnit, KpiScoreBand, KpiScoringMode, KpiScoreValue } from '@/lib/kpi/types'

export interface KPICriterionDrawerProps {
  criterion: KpiCriterionDefinition
  open: boolean
  onClose(): void
  onSave(next: KpiCriterionDefinition): void
}

interface ScoreBandIssue {
  index: number
  message: string
}

const SCORING_MODE_OPTIONS: Array<{ value: KpiScoringMode; label: string }> = [
  { value: 'automatic', label: 'Tự động (POS / Dữ liệu chấm công)' },
  { value: 'leader', label: 'Quản lý / Leader chấm' },
  { value: 'combined', label: 'Kết hợp cả hai' },
]

const SCORE_OPTIONS: KpiScoreValue[] = [1, 2, 3, 4, 5]

const UNIT_OPTIONS: Array<{ value: KpiMetricUnit; label: string }> = [
  { value: 'percent', label: 'Phần trăm (%)' },
  { value: 'minutes', label: 'Phút' },
  { value: 'vnd', label: 'Việt Nam đồng (VNĐ)' },
  { value: 'count', label: 'Số lần / số lượng' },
  { value: 'score', label: 'Điểm đánh giá' },
]

const DIRECTION_OPTIONS: Array<{ value: KpiMetricDirection; label: string }> = [
  { value: 'higher', label: 'Càng cao càng tốt' },
  { value: 'lower', label: 'Càng thấp càng tốt' },
  { value: 'rubric', label: 'Chấm theo rubric' },
]

const FNB_CRITERION_CATALOG = FNB_KPI_TEMPLATES.flatMap((template) =>
  template.groups.flatMap((group) => group.criteria.map((item) => ({
    ...item,
    catalogId: `${template.id}:${group.id}:${item.id}`,
    catalogLabel: `${template.name} - ${group.name} - ${item.name}`,
  }))),
)

function createDraft(criterion: KpiCriterionDefinition): KpiCriterionDefinition {
  return structuredClone(criterion)
}

function getBandIssues(scoreBands: KpiScoreBand[]): ScoreBandIssue[] {
  const issues: ScoreBandIssue[] = []

  scoreBands.forEach((band, index) => {
    if (band.max !== null && band.max < band.min) {
      issues.push({ index, message: 'Mức trên phải lớn hơn hoặc bằng mức dưới.' })
    }

    if (band.score < 1 || band.score > 5) {
      issues.push({ index, message: 'Điểm quy đổi chỉ được từ 1 đến 5.' })
    }
  })

  const ordered = scoreBands
    .map((band, index) => ({ ...band, index }))
    .sort((left, right) => left.min - right.min)

  ordered.forEach((band, index) => {
    const nextBand = ordered[index + 1]
    if (!nextBand) return

    const currentMax = band.max ?? Number.POSITIVE_INFINITY
    if (currentMax >= nextBand.min) {
      issues.push({ index: band.index, message: 'Khoảng điểm đang chồng với band kế tiếp.' })
    }

    if (band.max !== null) {
      const gap = Number((nextBand.min - band.max).toFixed(4))
      if (gap > 0 && gap > 0.0001) {
        issues.push({ index: band.index, message: 'Khoảng điểm đang bị hở, cần nối tiếp nhau.' })
      }
    }
  })

  return issues
}

export function KPICriterionDrawer({
  criterion,
  open,
  onClose,
  onSave,
}: KPICriterionDrawerProps) {
  const [draft, setDraft] = useState<KpiCriterionDefinition>(() => createDraft(criterion))

  useEffect(() => {
    setDraft(createDraft(criterion))
  }, [criterion])

  const bandIssues = getBandIssues(draft.score_bands)
  const nameMissing = draft.name.trim().length === 0
  const descriptionMissing = draft.description.trim().length === 0
  const sourceMissing = draft.scoring_mode === 'automatic' && !draft.source_key?.trim()
  const hasLocalErrors = nameMissing || descriptionMissing || sourceMissing || bandIssues.length > 0

  if (!open) return null

  const saveDisabled = hasLocalErrors

  const updateFromCatalog = (catalogId: string) => {
    const selected = FNB_CRITERION_CATALOG.find((item) => item.catalogId === catalogId)
    if (!selected) return
    setDraft({
      ...draft,
      name: selected.name,
      description: selected.description,
      scoring_mode: selected.scoring_mode,
      source_key: selected.source_key,
      unit: selected.unit,
      direction: selected.direction,
      core: selected.core,
      recommended_weight_range: selected.recommended_weight_range,
      score_bands: structuredClone(selected.score_bands),
      weight: selected.weight,
    })
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="kpi-criterion-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="flex h-full w-full max-w-3xl flex-col bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 bg-gray-50/50">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Cấu hình chi tiết tiêu chí</p>
            <h3 id="kpi-criterion-drawer-title" className="mt-0.5 text-lg font-bold text-[#001D3D]">{draft.name || 'Tiêu chí mới'}</h3>
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" className="h-8 px-3 border-gray-200 text-xs font-semibold" onClick={onClose}>
              Đóng
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-semibold h-8 px-4"
              onClick={() => onSave(draft)}
              disabled={saveDisabled}
            >
              Lưu tiêu chí
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="grid flex-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="overflow-y-auto p-6 space-y-5">
            <div className="rounded-xl border border-blue-100 bg-blue-50/40 p-4 space-y-3">
              <div>
                <p className="text-xs font-bold text-[#001D3D]">Thông tin nghiệp vụ F&B</p>
                <p className="mt-0.5 text-[11px] text-gray-500">Chọn mẫu để có sẵn hướng đo và cách chấm phù hợp vận hành cửa hàng.</p>
              </div>
              <label className="space-y-1.5 block">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Chọn tiêu chí mẫu từ thư viện F&B</span>
                <select
                  value=""
                  onChange={(event) => updateFromCatalog(event.target.value)}
                  className="w-full rounded-xl border border-blue-100 bg-white px-2.5 py-2 text-xs font-medium text-[#001D3D] outline-none focus:border-[#2F6FA8]"
                >
                  <option value="">Chọn tiêu chí mẫu...</option>
                  {FNB_CRITERION_CATALOG.map((item) => <option key={item.catalogId} value={item.catalogId}>{item.catalogLabel}</option>)}
                </select>
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Đơn vị đo</span>
                  <select value={draft.unit ?? 'score'} onChange={(event) => setDraft({ ...draft, unit: event.target.value as KpiMetricUnit })} className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs text-[#001D3D] outline-none focus:border-[#2F6FA8]">
                    {UNIT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
                <label className="space-y-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Chiều đánh giá</span>
                  <select value={draft.direction ?? 'rubric'} onChange={(event) => setDraft({ ...draft, direction: event.target.value as KpiMetricDirection })} className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs text-[#001D3D] outline-none focus:border-[#2F6FA8]">
                    {DIRECTION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-[#001D3D]">
                <input type="checkbox" checked={Boolean(draft.core)} onChange={(event) => setDraft({ ...draft, core: event.target.checked })} className="h-4 w-4 rounded border-gray-300 text-[#2F6FA8] focus:ring-[#2F6FA8]" />
                <span>Tiêu chí cốt lõi</span>
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Tên tiêu chí *</span>
                <input
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-[#001D3D] outline-none focus:border-[#2F6FA8] focus:ring-1 focus:ring-[#2F6FA8]"
                  placeholder="Ví dụ: Doanh số upsell topping theo ca"
                />
              </label>

              <label className="space-y-1.5 sm:col-span-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Mô tả & Hướng dẫn chấm *</span>
                <textarea
                  value={draft.description}
                  onChange={(event) => setDraft({ ...draft, description: event.target.value })}
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs text-gray-800 outline-none focus:border-[#2F6FA8] focus:ring-1 focus:ring-[#2F6FA8]"
                  placeholder="Mô tả ngắn gọn về tiêu chí và công thức quy đổi điểm."
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Phương thức chấm</span>
                <select
                  value={draft.scoring_mode}
                  onChange={(event) => setDraft({ ...draft, scoring_mode: event.target.value as KpiScoringMode })}
                  className="w-full rounded-xl border border-gray-200 bg-white px-2.5 py-2 text-xs font-medium text-[#001D3D] outline-none focus:border-[#2F6FA8]"
                >
                  {SCORING_MODE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Trọng số tiêu chí (%)</span>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={draft.weight}
                    onChange={(event) => setDraft({ ...draft, weight: Number(event.target.value) })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-mono font-bold tabular-nums text-[#001D3D] outline-none focus:border-[#2F6FA8] pr-7"
                  />
                  <span className="absolute right-2.5 top-2 text-xs font-bold text-gray-400">%</span>
                </div>
              </label>

              {draft.scoring_mode !== 'leader' && (
                <label className="space-y-1.5 sm:col-span-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Mã nguồn dữ liệu (Source Key)</span>
                  <input
                    value={draft.source_key ?? ''}
                    onChange={(event) => setDraft({ ...draft, source_key: event.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-mono text-[#001D3D] outline-none focus:border-[#2F6FA8]"
                    placeholder="Ví dụ: pos.revenue_shift_index hoặc attendance.late_count"
                  />
                </label>
              )}
            </div>

            {/* Score Bands */}
            <div className="rounded-xl border border-gray-100 bg-white shadow-2xs overflow-hidden">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 bg-gray-50/50">
                <div>
                  <p className="text-xs font-bold text-[#001D3D]">Thang quy đổi điểm (Score Bands 1 - 5)</p>
                  <p className="text-[11px] text-gray-500">Khoảng điểm phải liền mạch, quy về điểm 1 đến 5.</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 px-2.5 text-xs font-semibold border-gray-200 text-[#2F6FA8]"
                  icon={<Plus size={13} />}
                  onClick={() => setDraft({
                    ...draft,
                    score_bands: [
                      ...draft.score_bands,
                      { min: 0, max: null, score: 3 },
                    ],
                  })}
                >
                  Thêm mức
                </Button>
              </div>

              <div className="space-y-2.5 p-4">
                {draft.score_bands.map((band, index) => {
                  const issueText = bandIssues
                    .filter((issue) => issue.index === index)
                    .map((issue) => issue.message)
                    .join(' ')

                  return (
                    <div key={`${band.min}-${band.max}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50/50 p-3">
                      <div className="grid gap-2.5 sm:grid-cols-[1fr_1fr_100px_auto] items-end">
                        <label className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Từ (Min)</span>
                          <input
                            type="number"
                            value={band.min}
                            onChange={(event) => {
                              const nextBands = structuredClone(draft.score_bands)
                              nextBands[index].min = Number(event.target.value)
                              setDraft({ ...draft, score_bands: nextBands })
                            }}
                            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-mono font-bold tabular-nums text-[#001D3D] outline-none"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Đến (Max)</span>
                          <input
                            type="number"
                            value={band.max ?? ''}
                            onChange={(event) => {
                              const nextBands = structuredClone(draft.score_bands)
                              nextBands[index].max = event.target.value ? Number(event.target.value) : null
                              setDraft({ ...draft, score_bands: nextBands })
                            }}
                            className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-mono font-bold tabular-nums text-[#001D3D] outline-none"
                            placeholder="Không giới hạn"
                          />
                        </label>

                        <label className="space-y-1">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Điểm</span>
                          <select
                            value={band.score}
                            onChange={(event) => {
                              const nextBands = structuredClone(draft.score_bands)
                              nextBands[index].score = Number(event.target.value) as KpiScoreValue
                              setDraft({ ...draft, score_bands: nextBands })
                            }}
                            className="w-full rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs font-bold text-[#001D3D] outline-none"
                          >
                            {SCORE_OPTIONS.map((score) => (
                              <option key={score} value={score}>
                                {score} điểm
                              </option>
                            ))}
                          </select>
                        </label>

                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          icon={<Trash2 size={13} />}
                          onClick={() => setDraft({
                            ...draft,
                            score_bands: draft.score_bands.filter((_, currentIndex) => currentIndex !== index),
                          })}
                        >
                          Xóa
                        </Button>
                      </div>

                      {issueText ? (
                        <div className="mt-2 flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-200 p-2 text-xs text-rose-700">
                          <AlertTriangle size={13} className="shrink-0" />
                          <p>{issueText}</p>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Right Inspection Panel */}
          <aside className="border-t border-gray-100 bg-gray-50/50 p-5 lg:border-l lg:border-t-0 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#001D3D]">Kiểm tra hợp lệ tiêu chí</h4>
            
            <div className="space-y-2 text-xs">
              <div className={`flex items-center gap-2 rounded-lg p-2.5 border ${nameMissing ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                {nameMissing ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                <span>{nameMissing ? 'Chưa nhập tên tiêu chí' : 'Tên tiêu chí hợp lệ'}</span>
              </div>

              <div className={`flex items-center gap-2 rounded-lg p-2.5 border ${descriptionMissing ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                {descriptionMissing ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                <span>{descriptionMissing ? 'Chưa nhập hướng dẫn chấm' : 'Hướng dẫn chấm đầy đủ'}</span>
              </div>

              {draft.scoring_mode === 'automatic' && (
                <div className={`flex items-center gap-2 rounded-lg p-2.5 border ${sourceMissing ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                  {sourceMissing ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                  <span>{sourceMissing ? 'Thiếu Source Key tự động' : 'Đã có Source Key'}</span>
                </div>
              )}

              <div className={`flex items-center gap-2 rounded-lg p-2.5 border ${bandIssues.length > 0 ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-emerald-50 border-emerald-200 text-emerald-800'}`}>
                {bandIssues.length > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                <span>{bandIssues.length > 0 ? 'Score bands bị chồng/hở' : 'Score bands liền mạch 100%'}</span>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
