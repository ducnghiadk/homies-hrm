import { ChevronLeft, ChevronRight, History, Save, Send, Settings2 } from 'lucide-react'

type StoreOption = { id: string; name: string }

type ScheduleToolbarProps = {
  stores: StoreOption[]
  activeStoreId: string
  activeWeekLabel: string
  onStoreChange: (storeId: string) => void
  onPreviousWeek: () => void
  onNextWeek: () => void
  onOpenDemandEditor: () => void
  onCopyPreviousWeek: () => void
  onOpenHistory?: () => void
  onSaveDraft?: () => void
  onPublish?: () => void
  canSelectStore?: boolean
  selectedStoreName?: string
  weekStateLabel?: string
  weekStateTone?: string
  weekStateDescription?: string
  publishedAtLabel?: string | null
  scheduledEmployees?: number
  totalDemand?: number
  totalAssigned?: number
  emptySlots?: number
  hardWarningCount?: number
  softWarningCount?: number
}

export function ScheduleToolbar({
  stores,
  activeStoreId,
  activeWeekLabel,
  onStoreChange,
  onPreviousWeek,
  onNextWeek,
  onOpenDemandEditor,
  onCopyPreviousWeek,
  onOpenHistory,
  onSaveDraft,
  onPublish,
  canSelectStore = true,
  selectedStoreName,
  weekStateLabel,
  weekStateTone,
  weekStateDescription,
  publishedAtLabel,
  scheduledEmployees,
  totalDemand,
  totalAssigned,
  emptySlots,
  hardWarningCount,
  softWarningCount,
}: ScheduleToolbarProps) {
  return (
    <div className="rounded-[28px] border border-[#eadbc9] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a57d5a]">Lich van hanh Homies</p>
          <h1 className="mt-2 text-2xl font-semibold text-[#28445f]">Xep lich tuan</h1>
          <p className="mt-2 text-sm text-[#7c6e63]">Board giu vai tro quet nhanh. Bam vao o de mo popup xep nguoi giua man hinh.</p>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          <div className="flex flex-wrap items-center gap-2">
            {canSelectStore && stores.length > 0 && (
              <select
                value={activeStoreId}
                onChange={event => onStoreChange(event.target.value)}
                className="rounded-2xl border border-[#eadbc9] bg-white px-3 py-2 text-sm text-slate-700"
              >
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1 rounded-2xl border border-[#eadbc9] bg-[#fffaf4] px-2 py-1">
              <button type="button" onClick={onPreviousWeek} className="rounded-xl p-2 text-slate-600 hover:bg-white">
                <ChevronLeft size={16} />
              </button>
              <div className="min-w-[156px] text-center text-sm font-semibold text-[#28445f]">{activeWeekLabel}</div>
              <button type="button" onClick={onNextWeek} className="rounded-xl p-2 text-slate-600 hover:bg-white">
                <ChevronRight size={16} />
              </button>
            </div>

            <button type="button" className="rounded-2xl border border-[#eadbc9] bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-[#fffaf4]">
              Loc
            </button>
            <button type="button" onClick={onCopyPreviousWeek} className="rounded-2xl border border-[#eadbc9] bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-[#fffaf4]">
              Sao chep tuan
            </button>
            <button type="button" onClick={onOpenDemandEditor} className="inline-flex items-center gap-2 rounded-2xl border border-[#d8e8df] bg-[#eef8f2] px-3 py-2 text-sm font-semibold text-[#1f6a52] hover:bg-[#e3f3ea]">
              <Settings2 size={14} /> Tong quan ca tuan
            </button>
            {onOpenHistory && (
              <button type="button" onClick={onOpenHistory} className="inline-flex items-center gap-2 rounded-2xl border border-[#eadbc9] bg-[#fffaf4] px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
                <History size={14} /> Lich su doi lich
              </button>
            )}
            {onSaveDraft && (
              <button type="button" onClick={onSaveDraft} className="inline-flex items-center gap-2 rounded-2xl border border-[#eadbc9] bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-[#fffaf4]">
                <Save size={14} /> Luu ban nhap
              </button>
            )}
            {onPublish && (
              <button type="button" onClick={onPublish} className="inline-flex items-center gap-2 rounded-2xl bg-[#23425f] px-3 py-2 text-sm font-semibold text-white hover:bg-[#1d364d]">
                <Send size={14} /> Chot lich
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            {selectedStoreName && <span className="rounded-full bg-stone-100 px-2.5 py-1 font-semibold text-stone-700">{selectedStoreName}</span>}
            {weekStateLabel && <span className={`rounded-full px-2.5 py-1 font-semibold ${weekStateTone || 'bg-stone-100 text-stone-700'}`}>{weekStateLabel}</span>}
            {publishedAtLabel && <span className="rounded-full bg-sky-50 px-2.5 py-1 font-semibold text-sky-700">{publishedAtLabel}</span>}
            {typeof scheduledEmployees === 'number' && <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">Nhan su da xep {scheduledEmployees}</span>}
            {typeof totalDemand === 'number' && <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">Nhu cau {totalDemand}</span>}
            {typeof totalAssigned === 'number' && <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-700">Da gan {totalAssigned}</span>}
            {typeof emptySlots === 'number' && <span className="rounded-full bg-orange-50 px-2.5 py-1 font-semibold text-orange-700">O trong {emptySlots}</span>}
            {typeof hardWarningCount === 'number' && <span className="rounded-full bg-rose-50 px-2.5 py-1 font-semibold text-rose-700">Canh bao chan {hardWarningCount}</span>}
            {typeof softWarningCount === 'number' && <span className="rounded-full bg-yellow-50 px-2.5 py-1 font-semibold text-yellow-700">Can xem lai {softWarningCount}</span>}
          </div>

          {weekStateDescription && <p className="text-xs text-[#7c6e63]">{weekStateDescription}</p>}
        </div>
      </div>
    </div>
  )
}
