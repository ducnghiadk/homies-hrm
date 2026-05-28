'use client'

type OnboardingSupportPanelProps = {
  buddyName: string
  managerName: string
  actionOwnerLabel: string
  blockerSummary: string
  overallNote?: string
}

export function OnboardingSupportPanel({
  buddyName,
  managerName,
  actionOwnerLabel,
  blockerSummary,
  overallNote,
}: OnboardingSupportPanelProps) {
  const buddyInitial = buddyName.trim().charAt(0).toUpperCase() || 'B'

  return (
    <section className="rounded-[28px] bg-white p-5 shadow-[0_8px_24px_rgba(0,29,61,0.06)]">
      <div className="text-xs font-semibold uppercase tracking-wide text-[#2F6FA8]">
        {'\u004e\u0067\u01b0\u1eddi \u0068\u1ed7 \u0074\u0072\u1ee3'}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#E8F1FA] text-sm font-bold text-[#001D3D]">
          {buddyInitial}
        </div>
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-[#001D3D]">{buddyName}</h3>
          <p className="mt-1 text-sm text-[#6B7280]">
            {'\u0051\u0075\u1ea3\u006e \u006c\u00fd \u0074\u0068\u0065\u006f \u0064\u00f5\u0069'}: {managerName}
          </p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-[#FFFDF9] p-3 text-sm text-[#4B5563]">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#2F6FA8]">
            {'\u0110\u0061\u006e\u0067 \u0063\u0068\u1edd \u0061\u0069'}
          </div>
          <div className="mt-1 font-semibold text-[#001D3D]">{actionOwnerLabel}</div>
        </div>
        <div className="rounded-2xl bg-[#FFFDF9] p-3 text-sm text-[#4B5563]">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-[#2F6FA8]">
            {'\u0042\u006c\u006f\u0063\u006b \u0068\u0069\u1ec7\u006e \u0074\u1ea1\u0069'}
          </div>
          <div className="mt-1 font-semibold text-[#001D3D]">{blockerSummary}</div>
        </div>
      </div>

      {overallNote ? (
        <div className="mt-4 rounded-2xl bg-[#FFFDF9] p-3 text-sm text-[#4B5563]">
          {'\u0047\u0068\u0069 \u0063\u0068\u00fa \u0071\u0075\u1ea3\u006e \u006c\u00fd'}: {overallNote}
        </div>
      ) : null}
    </section>
  )
}
