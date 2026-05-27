import type { OnboardingOpsListRow, OnboardingOpsStatusTone } from '@/lib/services/onboarding-operations-service'

const toneClassMap: Record<OnboardingOpsStatusTone, string> = {
  block: 'bg-[color:color-mix(in_srgb,var(--error)_12%,white)] text-[var(--error)]',
  attention: 'bg-[color:color-mix(in_srgb,var(--warning)_18%,white)] text-[var(--warning-strong)]',
  ready: 'bg-[var(--success-soft)] text-[var(--success)]',
}

export function UpcomingOnboardingList(props: {
  rows: OnboardingOpsListRow[]
  selectedEmployeeId: string | null
  onSelect: (employeeId: string) => void
}) {
  return (
    <section className="rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-primary)]">Sắp vào ca đầu</h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            Chọn 1 người để xem checklist chi tiết.
          </p>
        </div>
        <div className="rounded-full bg-[#fff7ef] px-2.5 py-1 text-[11px] font-medium text-[#9a5b22]">
          {props.rows.length} người
        </div>
      </div>

      {props.rows.length === 0 ? (
        <div className="mt-4 rounded-3xl bg-[#fffaf5] px-4 py-8 text-center text-sm text-[var(--text-secondary)] ring-1 ring-black/5">
          Chưa có nhân viên nào trong cửa sổ theo dõi onboarding.
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {props.rows.map((row) => {
            const isSelected = row.employeeId === props.selectedEmployeeId

            return (
              <button
                key={row.employeeId}
                type="button"
                onClick={() => props.onSelect(row.employeeId)}
                className={`w-full rounded-3xl border px-4 py-3 text-left transition ${
                  isSelected
                    ? 'border-primary-200 bg-[#fff9f3] shadow-sm'
                    : 'border-black/5 bg-white hover:bg-[#fffdfa]'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium text-[var(--text-muted)]">{row.hireDate}</p>
                    <h3 className="mt-1 truncate text-sm font-semibold text-[var(--text-primary)]">
                      {row.employeeName}
                    </h3>
                    <p className="mt-1 text-xs text-[var(--text-secondary)]">
                      {row.roleLabel} • {row.storeLabel}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${toneClassMap[row.tone]}`}
                  >
                    {row.toneLabel}
                  </span>
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-5 text-[var(--text-secondary)]">
                  {row.missingLabels.length > 0
                    ? `${row.missingLabels.join(', ')}${row.hiddenMissingCount > 0 ? ` +${row.hiddenMissingCount} mục` : ''}`
                    : 'Đã đủ mục chính trước ngày đầu.'}
                </p>
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}
