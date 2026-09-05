'use client'

import { CalendarRange, CheckCircle2, Copy, FileStack, Layers, Plus, Store } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import type { KpiSetVersion } from '@/lib/kpi/types'

interface KPISetListProps {
  versions: KpiSetVersion[]
  selectedVersionId: string
  onSelectVersion(id: string): void
  onCreateSet(): void
  onCloneVersion(): void
}

const LEVEL_LABELS: Record<string, string> = {
  pt1_tn: 'PT1 Thu ngân',
  pt1_pc: 'PT1 Pha chế',
  pt2: 'PT2',
  senior: 'Senior',
  shift_leader: 'Shift Leader',
}

export function KPISetList({
  versions,
  selectedVersionId,
  onSelectVersion,
  onCreateSet,
  onCloneVersion,
}: KPISetListProps) {
  return (
    <section className="flex h-full flex-col rounded-2xl border border-gray-100 bg-white shadow-2xs overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 bg-gray-50/50">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Danh sách phiên bản</p>
          <h2 className="mt-0.5 text-base font-bold text-[#001D3D]">Bộ luật đã tạo</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 h-8 px-2.5"
            icon={<Copy size={13} className="text-gray-500" />}
            onClick={onCloneVersion}
          >
            Nhân bản
          </Button>
          <Button
            type="button"
            size="sm"
            className="bg-[#2F6FA8] hover:bg-[#1D3E61] text-white text-xs font-semibold h-8 px-2.5"
            icon={<Plus size={14} />}
            onClick={onCreateSet}
          >
            Tạo mới
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4 max-h-[620px]">
        {versions.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/60 px-4 text-center">
            <FileStack size={24} className="text-gray-400" />
            <p className="mt-3 text-xs font-bold text-[#001D3D]">Chưa có bộ KPI nào</p>
            <p className="mt-1 text-[11px] text-gray-500">Bấm tạo mới để thiết lập bộ luật KPI đầu tiên.</p>
            <div className="mt-3">
              <Button type="button" size="sm" className="bg-[#2F6FA8] text-white text-xs" icon={<Plus size={13} />} onClick={onCreateSet}>
                Tạo bộ KPI
              </Button>
            </div>
          </div>
        ) : (
          versions.map((version) => {
            const isSelected = version.id === selectedVersionId
            const isPublished = version.status === 'published'
            const activeGroupCount = version.groups.length
            const totalWeight = version.groups.reduce((acc, g) => acc + g.weight, 0)

            return (
              <button
                key={version.id}
                type="button"
                onClick={() => onSelectVersion(version.id)}
                className={[
                  'relative rounded-xl border p-3.5 text-left transition-all duration-150',
                  isSelected
                    ? 'border-[#2F6FA8] bg-blue-50/50 shadow-xs ring-1 ring-[#2F6FA8]/20'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50/60',
                ].join(' ')}
              >
                {/* Active left indicator */}
                {isSelected && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#2F6FA8] rounded-r-full" />
                )}

                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-[#001D3D]">{version.name}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-gray-500 font-medium">
                      <span className="font-mono tabular-nums text-gray-600 font-bold">v{version.version}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Layers size={11} className="text-gray-400" />
                        {activeGroupCount} trụ ({totalWeight}%)
                      </span>
                    </div>
                  </div>
                  <span
                    className={[
                      'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                      isPublished
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200',
                    ].join(' ')}
                  >
                    {isPublished ? <CheckCircle2 size={10} /> : null}
                    {isPublished ? 'Áp dụng' : 'Bản nháp'}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-gray-500 font-medium border-t border-gray-100/80 pt-2">
                  <CalendarRange size={12} className="text-gray-400 shrink-0" />
                  <span className="font-mono tabular-nums">
                    {version.effective_from} {version.effective_to ? `→ ${version.effective_to}` : ''}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap gap-1">
                  {version.store_ids === 'all' ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700">
                      <Store size={10} className="text-gray-400" /> Toàn chuỗi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-700">
                      <Store size={10} className="text-gray-400" /> {version.store_ids.length} Cửa hàng
                    </span>
                  )}
                  {version.level_codes.slice(0, 2).map((lvl) => (
                    <span key={lvl} className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#2F6FA8]">
                      {LEVEL_LABELS[lvl] || lvl}
                    </span>
                  ))}
                  {version.level_codes.length > 2 && (
                    <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-500">
                      +{version.level_codes.length - 2}
                    </span>
                  )}
                </div>
              </button>
            )
          })
        )}
      </div>
    </section>
  )
}
