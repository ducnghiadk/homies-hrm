import type { RecommendationSection } from '@/app/schedules/view-model'

function repairPositionLabel(value: string) {
  if (value.startsWith('Thu ng') && value.endsWith('n')) return 'Thu ngan'
  return value
}

type AssignmentModalProps = {
  open: boolean
  slotTitle: string
  slotSubtitle: string
  shortageLabel: string
  search: string
  onSearchChange: (value: string) => void
  sections: RecommendationSection[]
  requiresPublishedReason: boolean
  onAssign: (employeeId: string) => void
  onRemove: (employeeId: string) => void
  onClose: () => void
  filledCountLabel?: string
}

export function AssignmentModal({
  open,
  slotTitle,
  slotSubtitle,
  shortageLabel,
  search,
  onSearchChange,
  sections,
  requiresPublishedReason,
  onAssign,
  onRemove,
  onClose,
  filledCountLabel,
}: AssignmentModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-[rgba(34,24,18,0.34)] p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[32px] border border-[#eadbc9] bg-white shadow-[0_30px_80px_rgba(58,39,24,0.24)]">
        <div className="flex flex-col gap-4 border-b border-[#f0e3d4] bg-[linear-gradient(135deg,rgba(255,248,239,0.98),rgba(238,247,242,0.98))] p-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b08763]">Xep lich cho ca</div>
            <h3 className="mt-2 text-2xl font-semibold text-[#28445f]">{slotTitle}</h3>
            <p className="mt-1 text-sm text-[#6f6258]">{slotSubtitle}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              {filledCountLabel && <span className="rounded-full bg-white/90 px-2.5 py-1 font-semibold text-slate-700">{filledCountLabel}</span>}
              <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">{shortageLabel}</span>
              {requiresPublishedReason && <span className="rounded-full bg-sky-100 px-2.5 py-1 font-semibold text-sky-700">Sua sau khi chot se can ly do thay doi</span>}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl border border-[#e7d7c6] bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white"
          >
            Dong popup
          </button>
        </div>

        <div className="max-h-[calc(90vh-148px)] overflow-y-auto p-5">
          <div className="flex flex-col gap-3">
            <input
              value={search}
              onChange={event => onSearchChange(event.target.value)}
              placeholder="Tim nhan vien..."
              className="w-full rounded-2xl border border-[#eadbc9] bg-[#fffaf4] px-4 py-3 text-sm text-slate-700 outline-none"
            />
            <p className="text-sm text-[#7c6e63]">Uu tien nguoi da dang ky truoc. Nhung truong hop can can nhac se hien thi phia sau.</p>
          </div>

          <div className="mt-5 space-y-5">
            {sections.length > 0 ? sections.map(section => (
              <section key={section.id} className="space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-[#28445f]">{section.title}</h4>
                  <p className="mt-1 text-xs text-[#7c6e63]">{section.description}</p>
                </div>

                <div className="space-y-3">
                  {section.items.map(recommendation => (
                    <div key={recommendation.employee_id} className="rounded-[24px] border border-[#eadbc9] bg-[#fffdf9] p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="min-w-0 truncate text-sm font-semibold text-slate-800">{recommendation.employee_name}</div>
                            <span className="rounded-full bg-[#fff4e3] px-2 py-1 text-[11px] font-semibold text-[#9a6116]">{recommendation.label}</span>
                          </div>
                          <div className="mt-1 text-xs text-[#6f6258]">{repairPositionLabel(recommendation.position_name)} · {recommendation.assigned_count} ca trong tuan</div>
                          <div className="mt-2 text-sm text-slate-700">{recommendation.reason}</div>
                        </div>
                        <div className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">Diem {recommendation.score}</div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        {!recommendation.is_assigned ? (
                          <button
                            type="button"
                            onClick={() => onAssign(recommendation.employee_id)}
                            className="rounded-2xl bg-[#23425f] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1c354d]"
                          >
                            Gan vao ca
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => onRemove(recommendation.employee_id)}
                            className="rounded-2xl border border-[#e6d7c6] bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#faf6f1]"
                          >
                            Go khoi ca
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )) : (
              <div className="rounded-[24px] border border-dashed border-[#e7d7c6] bg-[#fffaf4] px-4 py-8 text-sm text-[#7c6e63]">Chua co goi y phu hop cho vi tri nay.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
