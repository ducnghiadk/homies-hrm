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
    ? 'border-emerald-300 bg-emerald-50 hover:bg-emerald-100/60'
    : tone === 'warning'
      ? 'border-amber-300 bg-amber-50 hover:bg-amber-100/60'
      : tone === 'critical'
        ? 'border-rose-300 bg-rose-50 hover:bg-rose-100/60'
        : 'border-stone-300 bg-stone-50 hover:bg-stone-100'

  if (!isSetup) {
    return `border border-dashed border-stone-300 bg-stone-50 text-stone-500 ${isSelected ? 'ring-2 ring-[#23425f]/15' : ''}`
  }

  return `border transition ${toneClass} ${isSelected ? 'ring-2 ring-[#23425f]/30 border-[#23425f] shadow-[0_10px_30px_rgba(35,66,95,0.10)]' : ''}`
}

function getToneDotClass(tone: WeekOverviewTone) {
  if (tone === 'full') return 'bg-emerald-500'
  if (tone === 'warning') return 'bg-amber-500'
  if (tone === 'critical') return 'bg-rose-500'
  return 'bg-stone-400'
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
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-[#28445f]">Lich ca trong tuan</h2>
        <p className="mt-1 text-sm text-[#7c6e63]">Xem nhanh tung ca, tung vi tri, va nhan su dang dung ca.</p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[1180px] overflow-hidden rounded-[28px] border border-[#efe2d3] bg-[#fffdfa]">
          <div className="grid grid-cols-[220px_repeat(7,minmax(140px,1fr))] border-b border-[#efe2d3] bg-[#fbf4eb]">
            <div className="sticky left-0 z-10 border-r border-[#efe2d3] bg-[#fbf4eb] px-4 py-3 shadow-[8px_0_18px_rgba(255,248,232,0.92)]">
              <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a57d5a]">Ca</div>
              <div className="mt-1 text-sm font-medium text-[#466079]">Khung gio trong ngay</div>
            </div>
            {headers.map(card => (
              <div key={card.date} className="border-r border-[#efe2d3] px-3 py-3 text-center last:border-r-0">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#b28a65]">{card.dayLabel}</div>
                <div className="mt-1 text-[20px] font-black leading-none tracking-[-0.04em] text-[#28445f]">{formatCalendarDate(card.date)}</div>
              </div>
            ))}
          </div>

          {rows.map(row => (
            <div key={row.templateId} className="grid grid-cols-[220px_repeat(7,minmax(140px,1fr))] border-b border-[#f3e8db] last:border-b-0">
              <div className="sticky left-0 z-10 border-r border-[#efe2d3] bg-white px-4 py-4 shadow-[8px_0_18px_rgba(255,255,255,0.96)]">
                <div className="text-sm font-medium text-[#35506a]">{row.templateName}</div>
                <div className="mt-1 text-xs text-[#8e8072]">{row.timeRange}</div>
              </div>

              {row.cells.map(cell => {
                const cellKey = `${cell.date}__${cell.shiftTemplateId}`
                const isSelected = selectedSlotKey === cellKey || cell.slotIds.includes(selectedSlotKey || '')
                const previewAssignments = cell.previewAssignments.slice(0, 3)
                const hasPrimaryPerson = previewAssignments.length > 0
                const overflowPreviewCount = Math.max(cell.previewAssignments.length - previewAssignments.length, 0)
                const isConfiguredCell = cell.isSetup
                const staffingLabel = cell.staffingLabel || `${cell.filledCount}/${cell.requiredCount} nguoi`
                const shortageBadges = cell.shortageBadges?.length
                  ? cell.shortageBadges
                  : [{ label: cell.shortageCount > 0 ? `Thieu ${cell.shortageCount}` : 'Du nguoi', tone: cell.shortageCount > 0 ? 'shortage' : 'full' as const }]

                return (
                  <div key={`${row.templateId}-${cell.date}`} className="border-r border-[#f3e8db] p-3 last:border-r-0">
                    <button
                      type="button"
                      disabled={!isConfiguredCell}
                      onClick={() => onSelectCell({ date: cell.date, shiftTemplateId: cell.shiftTemplateId, slotId: cell.slotIds[0] })}
                      className={`flex min-h-[132px] w-full flex-col rounded-[22px] px-4 py-3 text-left ${getScheduleCellClass(cell.tone, isSelected, isConfiguredCell)} ${isConfiguredCell ? '' : 'cursor-default'}`}
                    >
                      <div className="flex items-center justify-start gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${isConfiguredCell ? getToneDotClass(cell.tone) : 'bg-stone-300'}`} />
                      </div>

                      <div className="mt-4 flex min-h-[72px] flex-1 flex-col justify-center gap-2">
                        {isConfiguredCell && hasPrimaryPerson ? (
                          <div className="space-y-2">
                            {previewAssignments.map(person => (
                              <div key={person.employeeId} className="flex flex-wrap items-center gap-2">
                                <div className="text-[15px] font-semibold leading-6 text-[#173b63]">{person.employeeName}</div>
                                {person.positionLabel ? <span className="rounded-full bg-[#f6f1ea] px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.06em] text-[#8b7c6f]">{person.positionLabel}</span> : null}
                              </div>
                            ))}
                            {overflowPreviewCount > 0 ? (
                              <div className="text-[11px] font-medium text-[#6a7f90]">+{overflowPreviewCount} nguoi nua</div>
                            ) : null}
                          </div>
                        ) : (
                          <div className="text-sm font-medium text-stone-400">Trong</div>
                        )}

                        {isConfiguredCell ? (
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white/90 px-2 py-1 text-[10px] font-semibold text-[#35506a]">{staffingLabel}</span>
                            {shortageBadges.map(badge => (
                              <span
                                key={badge.label}
                                className={`rounded-full px-2 py-1 text-[10px] font-semibold ${badge.tone === 'full' ? 'bg-emerald-50 text-emerald-700' : badge.tone === 'overflow' ? 'bg-stone-100 text-stone-600' : 'bg-amber-100 text-amber-700'}`}
                              >
                                {badge.label}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
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
