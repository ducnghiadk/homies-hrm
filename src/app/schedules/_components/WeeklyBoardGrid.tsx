import type { ScheduleRowViewModel, WeekOverviewCard, WeekOverviewTone } from '@/app/schedules/view-model'

type WeeklyBoardGridProps = {
  dates: string[]
  rows: ScheduleRowViewModel[]
  selectedSlotKey: string | null
  onSelectCell: (payload: { date: string; shiftTemplateId: string; slotId?: string }) => void
  daySummaries?: WeekOverviewCard[]
}

function formatCalendarDate(value: string) {
  const [year, month, day] = value.split('-')
  void year
  return `${day}/${month}`
}

function getScheduleCellClass(tone: WeekOverviewTone, isSelected: boolean, isSetup: boolean) {
  const toneClass = tone === 'full'
    ? 'border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50'
    : tone === 'warning'
      ? 'border-amber-200 bg-amber-50/80 hover:bg-amber-50'
      : tone === 'critical'
        ? 'border-rose-200 bg-rose-50/85 hover:bg-rose-50'
        : 'border-stone-200 bg-stone-50 hover:bg-stone-100'

  if (!isSetup) {
    return `border border-dashed border-stone-200 bg-stone-50/80 text-stone-500 ${isSelected ? 'ring-2 ring-[#23425f]/15' : ''}`
  }

  return `border shadow-sm transition ${toneClass} ${isSelected ? 'ring-2 ring-[#23425f]/20 shadow-[0_10px_30px_rgba(35,66,95,0.12)]' : ''}`
}

function getScheduleCellBadgeClass(tone: WeekOverviewTone) {
  if (tone === 'full') return 'bg-emerald-100 text-emerald-700'
  if (tone === 'warning') return 'bg-amber-100 text-amber-700'
  if (tone === 'critical') return 'bg-rose-100 text-rose-700'
  return 'bg-stone-100 text-stone-600'
}

function getScheduleSourceLabel(source: 'assigned' | 'registered' | 'empty') {
  if (source === 'assigned') return 'Da xep'
  if (source === 'registered') return 'Da dang ky'
  return 'Chua co'
}

function getScheduleSourceClass(source: 'assigned' | 'registered' | 'empty') {
  if (source === 'assigned') return 'bg-[#23425f] text-white'
  if (source === 'registered') return 'bg-[#d8f0e4] text-[#1f6a52]'
  return 'bg-stone-200 text-stone-600'
}

export function WeeklyBoardGrid({ dates, rows, selectedSlotKey, onSelectCell, daySummaries }: WeeklyBoardGridProps) {
  const headers = daySummaries ?? dates.map(date => ({
    date,
    dayLabel: date,
    registeredCount: 0,
    requiredCount: 0,
    shortageCount: 0,
    tone: 'empty' as const,
    statusLabel: '',
    summaryLabel: '',
  }))

  return (
    <div className="rounded-[28px] border border-[#efe2d3] bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#28445f]">Board tuan theo ca</h2>
          <p className="mt-1 text-sm text-[#7c6e63]">Moi o giu thong tin gon: ten chinh, trang thai, va diem vao popup xep nguoi.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-[#23425f] px-2.5 py-1 font-semibold text-white">Da xep</span>
          <span className="rounded-full bg-[#d8f0e4] px-2.5 py-1 font-semibold text-[#1f6a52]">Da dang ky</span>
          <span className="rounded-full bg-stone-100 px-2.5 py-1 font-semibold text-stone-600">Chua co</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1180px] overflow-hidden rounded-[28px] border border-[#efe2d3] bg-[#fffdfa]">
          <div className="grid grid-cols-[220px_repeat(7,minmax(140px,1fr))] border-b border-[#efe2d3] bg-[#fbf4eb]">
            <div className="border-r border-[#efe2d3] px-4 py-4">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a57d5a]">Ca</div>
              <div className="mt-1 text-sm font-semibold text-[#28445f]">Khung gio trong ngay</div>
            </div>
            {headers.map(card => (
              <div key={card.date} className="border-r border-[#efe2d3] px-3 py-4 text-center last:border-r-0">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a57d5a]">{card.dayLabel}</div>
                <div className="mt-1 text-base font-semibold text-[#28445f]">{formatCalendarDate(card.date)}</div>
                <div className="mt-2 text-xs text-[#7c6e63]">{card.summaryLabel || `${card.registeredCount} nguoi dang ky`}</div>
              </div>
            ))}
          </div>

          {rows.map(row => (
            <div key={row.templateId} className="grid grid-cols-[220px_repeat(7,minmax(140px,1fr))] border-b border-[#f3e8db] last:border-b-0">
              <div className="border-r border-[#efe2d3] bg-white px-4 py-4">
                <div className="text-sm font-semibold text-[#28445f]">{row.templateName}</div>
                <div className="mt-1 text-xs text-[#7c6e63]">{row.timeRange}</div>
              </div>

              {row.cells.map(cell => {
                const cellKey = `${cell.date}__${cell.shiftTemplateId}`
                const isSelected = selectedSlotKey === cellKey || cell.slotIds.includes(selectedSlotKey || '')

                return (
                  <div key={`${row.templateId}-${cell.date}`} className="border-r border-[#f3e8db] p-3 last:border-r-0">
                    <button
                      type="button"
                      disabled={!cell.isSetup}
                      onClick={() => onSelectCell({ date: cell.date, shiftTemplateId: cell.shiftTemplateId, slotId: cell.slotIds[0] })}
                      className={`flex min-h-[152px] w-full flex-col rounded-[22px] p-3 text-left ${getScheduleCellClass(cell.tone, isSelected, cell.isSetup)} ${cell.isSetup ? '' : 'cursor-default'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getScheduleCellBadgeClass(cell.tone)}`}>{cell.statusLabel}</span>
                        <span className="text-xs font-semibold text-[#6f6258]">{cell.filledCount}/{cell.requiredCount}</span>
                      </div>

                      {cell.isSetup ? (
                        <>
                          <div className="mt-3 text-sm font-semibold leading-5 text-slate-800">{cell.headline}</div>
                          <div className="mt-1 text-xs text-[#7c6e63]">{cell.actionLabel}</div>
                          <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getScheduleSourceClass(cell.source)}`}>{getScheduleSourceLabel(cell.source)}</span>
                            <span className="text-[11px] font-medium text-[#7c6e63]">{cell.shortageCount > 0 ? `Thieu ${cell.shortageCount}` : 'Da du'}</span>
                          </div>
                        </>
                      ) : (
                        <div className="my-auto text-center text-sm font-medium leading-6">Chua setup nhu cau cho ca nay.</div>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
