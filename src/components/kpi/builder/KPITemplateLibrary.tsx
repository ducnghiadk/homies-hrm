'use client'

import { Eye, Layers3, Play, Sparkles, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'

import { FNB_KPI_TEMPLATES } from '@/lib/kpi/fnb-template-catalog'
import type { KpiTemplateId } from '@/lib/kpi/types'

export type KPITemplateLibraryProps = {
  positions: Array<{ id: string; name: string; level?: number }>
  selectedPositionIds: string[]
  onPositionChange(ids: string[]): void
  onPreview(id: KpiTemplateId): void
  onUse(id: KpiTemplateId): void
  onCreateBlank?(): void
}

const ROLE_BADGES: Record<KpiTemplateId, string> = {
  barista: 'Quầy pha chế', cashier: 'Quầy thu ngân', server: 'Khu vực sảnh', kitchen: 'Bếp & chuẩn bị', shift_leader: 'Điều phối ca', store_manager: 'Quản lý cửa hàng',
}

export function KPITemplateLibrary({ positions, selectedPositionIds, onPositionChange, onPreview, onUse, onCreateBlank }: KPITemplateLibraryProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [positionSearch, setPositionSearch] = useState('')
  const [levelFilter, setLevelFilter] = useState('all')
  const visiblePositions = useMemo(() => positions.filter((position) => position.name.toLowerCase().includes(positionSearch.toLowerCase()) && (levelFilter === 'all' || String(position.level ?? '') === levelFilter)), [levelFilter, positionSearch, positions])
  return (
    <section className="space-y-4 rounded-2xl border border-[#eadfc8] bg-white p-5 shadow-sm">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-[#2F6FA8]"><Sparkles size={16} /><span className="text-[11px] font-bold uppercase tracking-[0.16em]">Thư viện F&B SaaS</span></div>
          <h2 className="mt-1 text-xl font-bold text-[#001D3D]">Chọn bộ KPI theo vai trò</h2>
          <p className="mt-1 text-xs text-gray-500">Mỗi bộ mẫu gồm trụ tiêu chí, trọng số và nguồn dữ liệu gợi ý.</p>
        </div>
        <label className="text-xs font-semibold text-gray-600">Vị trí áp dụng <span className="text-rose-600">*</span>
          <span className="mt-1 block text-[10px] font-normal text-gray-500">Giữ Ctrl/Cmd để chọn nhiều vị trí.</span><select multiple aria-label="Chọn nhiều vị trí áp dụng" value={selectedPositionIds} onChange={(event) => onPositionChange(Array.from(event.target.selectedOptions, (option) => option.value))} className="mt-1 block min-w-56 rounded-xl border border-gray-200 bg-[#fffdf7] p-2 text-xs font-medium outline-none focus:border-[#2F6FA8]">
            {visiblePositions.map((position) => <option key={position.id} value={position.id}>{position.name}</option>)}
          </select>
        </label>
      </div>
      <div className="rounded-xl border border-gray-100 bg-[#fffdf7] p-3">
        <button type="button" onClick={() => setAdvancedOpen(!advancedOpen)} className="text-xs font-bold text-[#2F6FA8]">{advancedOpen ? 'Ẩn bộ lọc nâng cao' : 'Bộ lọc nâng cao'}</button>
        {advancedOpen ? <div className="mt-3 grid gap-2 sm:grid-cols-2"><label className="text-xs font-semibold text-gray-600">Tìm vị trí<input value={positionSearch} onChange={(event) => setPositionSearch(event.target.value)} placeholder="Ví dụ: pha chế" className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs" /></label><label className="text-xs font-semibold text-gray-600">Cấp bậc<select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value)} className="mt-1 w-full rounded-lg border border-gray-200 px-2 py-1.5 text-xs"><option value="all">Tất cả cấp bậc</option><option value="1">Cấp 1</option><option value="2">Cấp 2</option><option value="3">Cấp 3</option></select></label><span className="text-[10px] text-gray-500">Bộ lọc phụ, không bắt buộc để dùng bộ mẫu.</span></div> : null}
      </div>
      <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {FNB_KPI_TEMPLATES.map((template) => {
          const criteria = template.groups.flatMap((group) => group.criteria)
          const automatic = criteria.filter((criterion) => criterion.scoring_mode !== 'leader').length
          const highlighted = criteria.filter((criterion) => criterion.core).slice(0, 3)
          return <article key={template.id} className="flex flex-col rounded-2xl border border-gray-100 bg-[#fffdf7] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#b8d2e7]">
            <div className="flex items-start justify-between gap-2"><div><span className="text-[10px] font-bold uppercase tracking-wider text-[#2F6FA8]">{ROLE_BADGES[template.id]}</span><h3 className="mt-1 text-base font-bold text-[#001D3D]">{template.name}</h3></div><span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-800">F&B</span></div>
            <div className="mt-3 flex flex-wrap gap-1.5"><span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-semibold text-gray-600"><Layers3 size={11} className="mr-1 inline" />{template.groups.length} trụ · {criteria.length} tiêu chí</span><span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700"><Zap size={11} className="mr-1 inline" />{Math.round((automatic / Math.max(criteria.length, 1)) * 100)}% tự động</span></div>
            <div className="mt-3 min-h-12 space-y-1">{highlighted.map((criterion) => <div key={criterion.id} className="flex items-center justify-between text-[11px] text-gray-600"><span className="truncate">{criterion.name}</span><span className="ml-2 shrink-0 font-mono font-bold tabular-nums text-[#001D3D]">{criterion.weight}%</span></div>)}</div>
            <div className="mt-4 flex gap-2 border-t border-gray-100 pt-3"><button type="button" onClick={() => onPreview(template.id)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-white"><Eye size={14} />Xem chi tiết</button><button type="button" onClick={() => onUse(template.id)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#2F6FA8] px-3 py-2 text-xs font-bold text-white hover:bg-[#1D3E61]"><Play size={14} />Dùng bộ mẫu này</button></div>
          </article>
        })}
      </div>
      <button type="button" onClick={onCreateBlank} className="text-xs font-semibold text-gray-500 underline decoration-gray-300 underline-offset-4 hover:text-[#2F6FA8]">Tự tạo từ đầu</button>
    </section>
  )
}
