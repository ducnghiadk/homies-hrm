import type { WeekOverviewCard, WeekOverviewTone } from '@/app/schedules/view-model'

type WeeklyRhythmRailProps = {
  days: WeekOverviewCard[]
  selectedDate: string | null
  onSelectDate: (date: string) => void
}

function getOverviewCardClass(tone: WeekOverviewTone, selected: boolean) {
  const toneClass = tone === 'full'
    ? 'border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.96),rgba(255,255,255,0.98))]'
    : tone === 'warning'
      ? 'border-amber-200 bg-[linear-gradient(180deg,rgba(255,247,237,0.96),rgba(255,255,255,0.98))]'
      : tone === 'critical'
        ? 'border-rose-200 bg-[linear-gradient(180deg,rgba(255,241,242,0.96),rgba(255,255,255,0.98))]'
        : 'border-stone-200 bg-[linear-gradient(180deg,rgba(250,250,249,0.96),rgba(255,255,255,0.98))]'

  return `${toneClass} ${selected ? 'ring-2 ring-[#23425f]/15' : ''}`
}

function getOverviewBadgeClass(tone: WeekOverviewTone) {
  if (tone === 'full') return 'bg-emerald-100 text-emerald-700'
  if (tone === 'warning') return 'bg-amber-100 text-amber-700'
  if (tone === 'critical') return 'bg-rose-100 text-rose-700'
  return 'bg-stone-100 text-stone-600'
}

function formatCalendarDate(value: string) {
  const [year, month, day] = value.split('-')
  void year
  return `${day}/${month}`
}

export function WeeklyRhythmRail({ days, selectedDate, onSelectDate }: WeeklyRhythmRailProps) {
  return (
    <div className="rounded-[28px] border border-[#efe2d3] bg-[linear-gradient(180deg,rgba(255,250,244,0.98),rgba(255,255,255,0.98))] p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#28445f]">Nhip tuan</h2>
          <p className="mt-1 text-sm text-[#7c6e63]">Nhin nhanh ngay nao on, ngay nao thieu va can uu tien xu ly.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-rose-100 px-2.5 py-1 font-semibold text-rose-700">Thieu nhieu</span>
          <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">Thieu it</span>
          <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-semibold text-emerald-700">Du nguoi</span>
          <span className="rounded-full bg-stone-100 px-2.5 py-1 font-semibold text-stone-600">Chua setup</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-7">
        {days.map(day => (
          <button key={day.date} type="button" onClick={() => onSelectDate(day.date)} className={`rounded-[24px] border p-4 text-left shadow-sm ${getOverviewCardClass(day.tone, selectedDate === day.date)}`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#a57d5a]">{day.dayLabel}</div>
                <div className="mt-1 text-lg font-semibold text-[#28445f]">{formatCalendarDate(day.date)}</div>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${getOverviewBadgeClass(day.tone)}`}>{day.statusLabel}</span>
            </div>
            <div className="mt-4 text-sm font-semibold text-[#28445f]">{day.summaryLabel}</div>
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-[#6f6258]">
              <div className="rounded-2xl bg-white/75 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-[#ab8767]">Dang ky</div>
                <div className="mt-1 text-base font-semibold text-slate-800">{day.registeredCount}</div>
              </div>
              <div className="rounded-2xl bg-white/75 px-3 py-2">
                <div className="text-[11px] uppercase tracking-wide text-[#ab8767]">Nhu cau</div>
                <div className="mt-1 text-base font-semibold text-slate-800">{day.requiredCount}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
