import type { RecommendationSection } from '@/app/schedules/view-model'

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
  positionLabel?: string
  filledCountLabel?: string
  registeredCountLabel?: string
  tipText?: string
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
  positionLabel,
  filledCountLabel,
  registeredCountLabel,
  tipText,
}: AssignmentModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-[rgba(34,24,18,0.34)] p-4 backdrop-blur-[2px]">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[32px] border border-[#eadbc9] bg-white shadow-[0_30px_80px_rgba(58,39,24,0.24)]">
        <div className="flex flex-col gap-4 border-b border-[#f0e3d4] bg-[linear-gradient(135deg,rgba(255,248,239,0.98),rgba(238,247,242,0.98))] p-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#b08763]">Xep lich cho ca</div>
            <h3 className="mt-2 text-2xl font-semibold text-[#28445f]">{slotTitle}</h3>
            <p className="mt-1 text-sm text-[#6f6258]">{slotSubtitle}</p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full bg-white/85 px-2.5 py-1 font-semibold text-slate-700">{filledCountLabel || slotSubtitle}</span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 font-semibold text-amber-700">{shortageLabel}</span>
              {requiresPublishedReason && <span className="rounded-full bg-sky-100 px-2.5 py-1 font-semibold text-sky-700">Sua sau khi chot se can ly do thay doi</span>}
            </div>
          </div>

          <button type="button" onClick={onClose} className="rounded-2xl border border-[#e7d7c6] bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white">
            Dong popup
          </button>
        </div>

        <div className="grid max-h-[calc(90vh-148px)] gap-0 overflow-y-auto lg:grid-cols-[1.55fr_0.9fr]">
          <div className="border-b border-[#f0e3d4] p-5 lg:border-b-0 lg:border-r">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h4 className="text-base font-semibold text-[#28445f]">Goi y nhan su phu hop</h4>
                <p className="text-sm text-[#7c6e63]">Uu tien nguoi da dang ky truoc, sau do moi toi nhom can xem lai va bo sung.</p>
              </div>
              <input
                value={search}
                onChange={event => onSearchChange(event.target.value)}
                placeholder="Tim nhan vien..."
                className="w-full rounded-2xl border border-[#eadbc9] bg-[#fffaf4] px-4 py-2.5 text-sm text-slate-700 outline-none sm:max-w-[260px]"
              />
            </div>

            <div className="mt-4 space-y-4">
              {sections.length > 0 ? sections.map(section => (
                <div key={section.id} className="space-y-3">
                  <div>
                    <div className="text-sm font-semibold text-[#28445f]">{section.title}</div>
                    <div className="text-xs text-[#7c6e63]">{section.description}</div>
                  </div>

                  <div className="space-y-3">
                    {section.items.map(recommendation => (
                      <div key={recommendation.employee_id} className="rounded-[24px] border border-[#eadbc9] p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="min-w-0 truncate text-sm font-semibold text-slate-800">{recommendation.employee_name}</div>
                              <span className="rounded-full bg-[#fffaf4] px-2 py-1 text-[11px] font-semibold text-slate-600">{recommendation.label}</span>
                            </div>
                            <div className="mt-1 text-xs text-[#6f6258]">{recommendation.position_name} · {recommendation.assigned_count} ca trong tuan</div>
                            <div className="mt-2 text-sm text-slate-700">{recommendation.reason}</div>
                          </div>
                          <div className="shrink-0 rounded-full bg-white/85 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Diem {recommendation.score}</div>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-2">
                          {!recommendation.is_assigned ? (
                            <button type="button" onClick={() => onAssign(recommendation.employee_id)} className="rounded-2xl bg-[#23425f] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#1c354d]">
                              Gan vao ca
                            </button>
                          ) : (
                            <button type="button" onClick={() => onRemove(recommendation.employee_id)} className="rounded-2xl border border-[#e6d7c6] bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-[#faf6f1]">
                              Go khoi ca
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )) : (
                <div className="rounded-[24px] border border-dashed border-[#e7d7c6] bg-[#fffaf4] px-4 py-8 text-sm text-[#7c6e63]">Chua co goi y phu hop cho o nay.</div>
              )}
            </div>
          </div>

          <div className="p-5">
            <div className="rounded-[24px] border border-[#efe2d3] bg-[#fffaf4] p-4">
              <h4 className="text-sm font-semibold text-[#28445f]">Tinh trang o dang xem</h4>
              <div className="mt-3 space-y-3 text-sm text-[#6f6258]">
                {positionLabel && (
                  <div className="rounded-2xl bg-white/85 px-3 py-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b08763]">Vi tri</div>
                    <div className="mt-1 font-semibold text-slate-800">{positionLabel}</div>
                  </div>
                )}
                {filledCountLabel && (
                  <div className="rounded-2xl bg-white/85 px-3 py-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b08763]">So luong</div>
                    <div className="mt-1 font-semibold text-slate-800">{filledCountLabel}</div>
                  </div>
                )}
                {registeredCountLabel && (
                  <div className="rounded-2xl bg-white/85 px-3 py-3">
                    <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#b08763]">Dang ky san co</div>
                    <div className="mt-1 font-semibold text-slate-800">{registeredCountLabel}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-[24px] border border-[#d9ece2] bg-[#eef8f2] p-4 text-sm text-[#1f6a52]">
              <div className="font-semibold">Meo thao tac</div>
              <p className="mt-1 leading-6">{tipText || 'Bat dau tu nhom da dang ky phu hop. Neu van thieu nguoi, moi chuyen sang nhom can xem lai va bo sung.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
