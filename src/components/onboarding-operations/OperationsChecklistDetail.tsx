import type {
  OnboardingOpsChecklistItem,
  OnboardingOpsEmployeeDetail,
  OnboardingOpsStatusTone,
} from '@/lib/services/onboarding-operations-service'

const toneClassMap: Record<OnboardingOpsStatusTone, string> = {
  block: 'bg-[color:color-mix(in_srgb,var(--error)_12%,white)] text-[var(--error)]',
  attention: 'bg-[color:color-mix(in_srgb,var(--warning)_18%,white)] text-[var(--warning-strong)]',
  ready: 'bg-[var(--success-soft)] text-[var(--success)]',
}

const phaseMeta = {
  before_first_shift: {
    title: 'Trước ca đầu',
    description: '5 mục quản lý cần chốt trước khi nhân viên vào nhận việc.',
  },
  after_first_shift: {
    title: 'Sau ca đầu',
    description: 'Chốt kết quả sau ca đầu để biết người mới đang ổn tới đâu.',
  },
} as const

function ActionButton(props: {
  children: string
  onClick: () => void
  subtle?: boolean
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
        props.subtle
          ? 'bg-[#fff5ea] text-[#9a5b22] hover:bg-[#ffeedb]'
          : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
      }`}
    >
      {props.children}
    </button>
  )
}

function ChecklistCard(props: {
  employeeId: string
  item: OnboardingOpsChecklistItem
  onQuickComplete: (payload: { employeeId: string; key: string; value?: string }) => void
}) {
  const { employeeId, item, onQuickComplete } = props

  return (
    <div className="rounded-3xl border border-black/5 bg-[#fffdfa] p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.label}</h3>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                item.done
                  ? 'bg-[var(--success-soft)] text-[var(--success)]'
                  : item.severity === 'block'
                    ? 'bg-[color:color-mix(in_srgb,var(--error)_12%,white)] text-[var(--error)]'
                    : 'bg-[color:color-mix(in_srgb,var(--warning)_18%,white)] text-[var(--warning-strong)]'
              }`}
            >
              {item.done ? 'Đã chốt' : item.severity === 'block' ? 'Block' : 'Cần làm'}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">{item.summary}</p>
        </div>
      </div>

      {!item.done ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {item.key === 'first_shift' ? (
            <ActionButton onClick={() => onQuickComplete({ employeeId, key: item.key })}>
              Nhập ca đầu
            </ActionButton>
          ) : null}
          {item.key === 'buddy' ? (
            <ActionButton onClick={() => onQuickComplete({ employeeId, key: item.key })}>
              Gán người kèm
            </ActionButton>
          ) : null}
          {item.key === 'uniform_attendance_policy' ? (
            <ActionButton onClick={() => onQuickComplete({ employeeId, key: item.key })}>
              Đã nhắc nội quy
            </ActionButton>
          ) : null}
          {item.key === 'tools_and_group' ? (
            <ActionButton onClick={() => onQuickComplete({ employeeId, key: item.key })}>
              Đã vào nhóm
            </ActionButton>
          ) : null}
          {item.key === 'first_shift_result' ? (
            <>
              <ActionButton onClick={() => onQuickComplete({ employeeId, key: item.key, value: 'pass' })}>
                Ổn
              </ActionButton>
              <ActionButton
                subtle
                onClick={() => onQuickComplete({ employeeId, key: item.key, value: 'follow_up' })}
              >
                Theo sát thêm
              </ActionButton>
              <ActionButton
                subtle
                onClick={() => onQuickComplete({ employeeId, key: item.key, value: 'issue' })}
              >
                Có vấn đề
              </ActionButton>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export function OperationsChecklistDetail(props: {
  detail: OnboardingOpsEmployeeDetail | null
  onQuickComplete: (payload: { employeeId: string; key: string; value?: string }) => void
}) {
  if (!props.detail) {
    return (
      <section className="rounded-[28px] bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">Checklist onboarding</h2>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Chọn 1 người ở cột trái để xem các mục cần chốt.
        </p>
      </section>
    )
  }

  const beforeShiftItems = props.detail.checklist.filter((item) => item.phase === 'before_first_shift')
  const afterShiftItems = props.detail.checklist.filter((item) => item.phase === 'after_first_shift')

  return (
    <section className="rounded-[28px] bg-white p-4 shadow-sm ring-1 ring-black/5 md:p-5">
      <div className="flex flex-col gap-3 border-b border-black/5 pb-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[11px] font-medium text-[var(--text-muted)]">{props.detail.hireDate}</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--text-primary)]">
              {props.detail.employeeName}
            </h2>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              {props.detail.roleLabel} • {props.detail.storeLabel}
            </p>
          </div>
          <span
            className={`w-fit rounded-full px-2.5 py-1 text-[10px] font-semibold ${toneClassMap[props.detail.tone]}`}
          >
            {props.detail.toneLabel}
          </span>
        </div>
        <div className="rounded-3xl bg-[#fff8f2] px-4 py-3 text-sm text-[var(--text-secondary)]">
          {props.detail.summaryLabel}
        </div>
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {phaseMeta.before_first_shift.title}
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {phaseMeta.before_first_shift.description}
            </p>
          </div>
          <div className="space-y-3">
            {beforeShiftItems.map((item) => (
              <ChecklistCard
                key={item.key}
                employeeId={props.detail.employeeId}
                item={item}
                onQuickComplete={props.onQuickComplete}
              />
            ))}
          </div>
        </div>

        <div>
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              {phaseMeta.after_first_shift.title}
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {phaseMeta.after_first_shift.description}
            </p>
          </div>
          <div className="space-y-3">
            {afterShiftItems.map((item) => (
              <ChecklistCard
                key={item.key}
                employeeId={props.detail.employeeId}
                item={item}
                onQuickComplete={props.onQuickComplete}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
