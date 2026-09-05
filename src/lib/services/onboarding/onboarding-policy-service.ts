import { getSettings } from '@/lib/career-path-service'
import { createNotificationDeduped } from '@/lib/notifications/notification-center'
import type { EmployeeInvitation } from '@/lib/mock-data-employee-ext'
import type { AuthUser } from '@/store/auth-store'

export type OnboardingPolicyStatus =
  | 'chua_gui'
  | 'da_gui_tom_tat'
  | 'da_gui_day_du'
  | 'da_doc'
  | 'da_xac_nhan'
  | 'can_nhac'
  | 'can_giai_thich'

export interface OnboardingPolicyHistoryItem {
  id: string
  at: string
  action:
    | 'summary_sent'
    | 'full_sent'
    | 'employee_read'
    | 'employee_acknowledged'
    | 'clarification_requested'
    | 'reminder_sent'
    | 'store_confirmed'
  actor_name: string
  note: string
}

export interface EmployeeOnboardingPolicyRecord {
  employee_id: string
  employee_name: string
  store_id: string
  hire_date: string
  template_id: 'default-policy-v1'
  status: OnboardingPolicyStatus
  summary_sent_at?: string
  full_sent_at?: string
  read_at?: string
  acknowledged_at?: string
  clarification_requested_at?: string
  last_reminded_at?: string
  reminder_count: number
  confirmed_at_store_at?: string
  latest_contract_id?: string
  summary_due_anchor_at?: string
  full_due_anchor_at?: string
  history: OnboardingPolicyHistoryItem[]
}

export interface OnboardingDayOneChecklistItem {
  id: 'summary' | 'full' | 'responded' | 'clarification' | 'store_confirmed'
  label: string
  done: boolean
  tone: 'done' | 'pending' | 'warning'
  hint: string
  dueAt?: string
  actualAt?: string
  scheduleLabel?: string
  statusLabel: string
}

export interface OnboardingDayOneChecklistSnapshot {
  status: OnboardingPolicyStatus
  needsManagerAttention: boolean
  needsEmployeeAction: boolean
  canConfirmAtStore: boolean
  summarySent: boolean
  fullSent: boolean
  employeeResponded: boolean
  clarificationRequested: boolean
  acknowledged: boolean
  storeConfirmed: boolean
  waitingLabel: string
  nextActionLabel: string
  items: OnboardingDayOneChecklistItem[]
}

type PolicyTemplate = {
  id: 'default-policy-v1'
  summary_points: string[]
  full_sections: Array<{ title: string; body: string }>
}

type PolicyEmployeeInput = Pick<AuthUser, 'id' | 'full_name' | 'store_id' | 'hire_date'>

const STORAGE_KEY = 'homies_onboarding_policy_records_v1'
const POLICY_NOTIFICATION_WINDOW_MS = 5 * 60 * 1000

const POLICY_TEMPLATES: Record<'default-policy-v1', PolicyTemplate> = {
  'default-policy-v1': {
    id: 'default-policy-v1',
    summary_points: ['Dong phuc', 'Gio giac', 'Bao nghi', 'Doi ca', 'Ve sinh', 'Tac phong'],
    full_sections: [
      { title: 'Dong phuc', body: 'Mac dong phuc sach se, deo bang ten, dung chuan F&B.' },
      { title: 'Cham cong', body: 'Check-in, di muon, ve som, OT va doi ca deu phai ghi nhan tren app.' },
      { title: 'Van hanh', body: 'Tuan thu quy trinh ve sinh, ban giao, tien mat va ATTP.' },
    ],
  },
}

function nowIso() {
  return new Date().toISOString()
}

function getIsoDateOnly(value?: string) {
  if (!value) return undefined
  return value.slice(0, 10)
}

function addDaysToIsoDate(value: string, days: number) {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return undefined

  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function compareIsoDateOnly(left: string, right: string) {
  if (left === right) return 0
  return left < right ? -1 : 1
}

function loadRecords(): EmployeeOnboardingPolicyRecord[] {
  if (typeof window === 'undefined') return []

  const stored = localStorage.getItem(STORAGE_KEY)
  if (!stored) return []

  try {
    const parsed = JSON.parse(stored) as EmployeeOnboardingPolicyRecord[]
    return Array.isArray(parsed) ? parsed : []
  } catch (error) {
    console.warn(`[OnboardingPolicyService] Failed to parse ${STORAGE_KEY}. Falling back to empty records.`, error)
    return []
  }
}

function saveRecords(records: EmployeeOnboardingPolicyRecord[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}

function pushHistory(
  record: EmployeeOnboardingPolicyRecord,
  action: OnboardingPolicyHistoryItem['action'],
  actorName: string,
  note: string,
) {
  record.history.unshift({
    id: `${record.employee_id}-${action}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    at: nowIso(),
    action,
    actor_name: actorName,
    note,
  })
}

function isManagerRole(role: AuthUser['role']) {
  return ['ceo', 'hr_admin', 'store_manager'].includes(role)
}

function canManagePolicyRecord(actor: AuthUser, record: EmployeeOnboardingPolicyRecord) {
  if (actor.role === 'store_manager') {
    return actor.store_id === record.store_id
  }

  return isManagerRole(actor.role)
}

function daysUntil(dateValue: string) {
  const [year, month, day] = dateValue.split('-').map(Number)
  if (!year || !month || !day) return Number.POSITIVE_INFINITY

  const targetUtc = Date.UTC(year, month - 1, day)
  const today = new Date()
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  return Math.round((targetUtc - todayUtc) / 86400000)
}

function resolvePolicyMilestoneDueDates(record: EmployeeOnboardingPolicyRecord | null) {
  const settings = getSettings()
  const hireDate = getIsoDateOnly(record?.hire_date)
  const summaryAnchorAt = getIsoDateOnly(record?.summary_due_anchor_at || record?.summary_sent_at)
  const fullAnchorAt = getIsoDateOnly(record?.full_due_anchor_at || record?.full_sent_at)

  return {
    summary:
      settings.onboarding_policy_summary_trigger === 'approval_confirm'
        ? summaryAnchorAt || hireDate
        : summaryAnchorAt,
    full:
      settings.onboarding_policy_full_trigger === 'contract_countersign'
        ? fullAnchorAt
        : settings.onboarding_policy_full_trigger === 'days_before_start' && hireDate
        ? addDaysToIsoDate(hireDate, -settings.onboarding_policy_full_days_before_start)
        : hireDate,
    responded: settings.onboarding_policy_require_ack ? hireDate : undefined,
    clarification: hireDate,
    store_confirmed: hireDate,
  }
}

function resolveMilestoneScheduleLabel(
  itemId: OnboardingDayOneChecklistItem['id'],
  dueAt: string | undefined,
) {
  const settings = getSettings()

  if (itemId === 'summary') {
    return settings.onboarding_policy_summary_trigger === 'approval_confirm'
      ? 'Gửi ngay khi duyệt hồ sơ'
      : 'Gửi khi gửi hợp đồng'
  }

  if (itemId === 'full') {
    return settings.onboarding_policy_full_trigger === 'contract_countersign'
      ? 'Gửi sau khi HR countersign hợp đồng'
      : dueAt
        ? `Gửi trước ngày vào làm ${settings.onboarding_policy_full_days_before_start} ngày`
        : 'Gửi trước ngày vào làm theo cấu hình'
  }

  if (itemId === 'responded') {
    return 'Nhân viên phản hồi trước ngày vào làm'
  }

  if (itemId === 'clarification') {
    return 'Xử lý trước khi chốt onboarding tại cửa hàng'
  }

  return 'Chốt trong ngày đầu nhận việc'
}

function resolveMilestoneStatus(input: {
  dueAt?: string
  actualAt?: string
  needsClarification?: boolean
}) {
  if (input.needsClarification) {
    return { statusLabel: 'Cần giải thích' as const, tone: 'warning' as const }
  }

  if (input.actualAt) {
    return { statusLabel: 'Đã xong' as const, tone: 'done' as const }
  }

  if (!input.dueAt) {
    return { statusLabel: 'Đang chờ' as const, tone: 'pending' as const }
  }

  const today = getIsoDateOnly(nowIso())
  if (!today) {
    return { statusLabel: 'Đang chờ' as const, tone: 'pending' as const }
  }

  const compareWithToday = compareIsoDateOnly(input.dueAt, today)
  if (compareWithToday < 0) {
    return { statusLabel: 'Trễ mốc' as const, tone: 'warning' as const }
  }

  if (compareWithToday > 0) {
    return { statusLabel: 'Chưa tới lịch' as const, tone: 'pending' as const }
  }

  return { statusLabel: 'Đang chờ' as const, tone: 'pending' as const }
}

function notifyEmployeePolicy(employeeId: string, title: string, message: string, policyStage: 'summary' | 'full' | 'reminder') {
  createNotificationDeduped(
    employeeId,
    'system',
    title,
    message,
    { action_url: '/onboarding', employee_id: employeeId, policy_stage: policyStage },
    POLICY_NOTIFICATION_WINDOW_MS,
  )
}

function notifyManagersPolicy(
  employeeId: string,
  employeeName: string,
  recipients: string[],
  status: string,
) {
  recipients.forEach((recipientId) => {
    createNotificationDeduped(
      recipientId,
      'system',
      'Nhân viên chưa xác nhận nội quy',
      `${employeeName} vẫn chưa xác nhận nội quy trước ngày vào làm.`,
      { action_url: `/employees/${employeeId}`, employee_id: employeeId, policy_status: status },
      POLICY_NOTIFICATION_WINDOW_MS,
    )
  })
}

function buildRecord(employee: PolicyEmployeeInput): EmployeeOnboardingPolicyRecord {
  const settings = getSettings()
  return {
    employee_id: employee.id,
    employee_name: employee.full_name,
    store_id: employee.store_id,
    hire_date: employee.hire_date,
    template_id: settings.onboarding_policy_template_id,
    status: 'chua_gui',
    reminder_count: 0,
    history: [],
  }
}

function buildDayOneChecklistSnapshot(
  record: EmployeeOnboardingPolicyRecord | null,
): OnboardingDayOneChecklistSnapshot {
  const status = record?.status || 'chua_gui'
  const summarySent = Boolean(record?.summary_sent_at)
  const fullSent = Boolean(record?.full_sent_at)
  const clarificationRequested = Boolean(record?.clarification_requested_at) || status === 'can_giai_thich'
  const acknowledged = Boolean(record?.acknowledged_at)
  const storeConfirmed = Boolean(record?.confirmed_at_store_at)
  const employeeResponded = acknowledged || clarificationRequested
  const needsEmployeeAction = fullSent && !employeeResponded
  const canConfirmAtStore = fullSent && !storeConfirmed
  const needsManagerAttention = clarificationRequested || (fullSent && !storeConfirmed && !acknowledged)

  let waitingLabel = 'Dang cho HR kich hoat noi quy day du'
  let nextActionLabel = 'HR can gui noi quy day du dung moc onboarding'

  if (clarificationRequested) {
    waitingLabel = 'Dang cho HR giai thich them truoc ngay dau'
    nextActionLabel = 'HR/quan ly can giai thich roi moi chot onboarding tai cua hang'
  } else if (storeConfirmed) {
    waitingLabel = 'Da hoan tat buoc noi quy ngay dau'
    nextActionLabel = 'Khong con thao tac nao o muc noi quy'
  } else if (acknowledged) {
    waitingLabel = 'Nhan vien da xac nhan noi quy'
    nextActionLabel = 'Ngay dau quan ly co the chot tai cua hang'
  } else if (needsEmployeeAction) {
    waitingLabel = 'Dang cho nhan vien doc va phan hoi'
    nextActionLabel = 'Nhan vien can xac nhan hoac gui yeu cau giai thich them'
  } else if (summarySent && !fullSent) {
    waitingLabel = 'Da gui ban tom tat, chua gui ban day du'
    nextActionLabel = 'HR can kich hoat ban noi quy day du theo dung moc'
  }

  const dueDates = resolvePolicyMilestoneDueDates(record)
  const summaryActualAt = getIsoDateOnly(record?.summary_sent_at)
  const fullActualAt = getIsoDateOnly(record?.full_sent_at)
  const respondedActualAt = getIsoDateOnly(record?.acknowledged_at || record?.clarification_requested_at)
  const clarificationActualAt = getIsoDateOnly(record?.clarification_requested_at)
  const storeConfirmedActualAt = getIsoDateOnly(record?.confirmed_at_store_at)

  const summaryStatus = resolveMilestoneStatus({
    dueAt: dueDates.summary,
    actualAt: summaryActualAt,
  })
  const fullStatus = resolveMilestoneStatus({
    dueAt: dueDates.full,
    actualAt: fullActualAt,
  })
  const respondedStatus = resolveMilestoneStatus({
    dueAt: dueDates.responded,
    actualAt: acknowledged ? respondedActualAt : undefined,
    needsClarification: clarificationRequested,
  })
  const clarificationStatus = clarificationRequested
    ? { statusLabel: 'Cần giải thích' as const, tone: 'warning' as const }
    : { statusLabel: 'Đã xong' as const, tone: 'done' as const }
  const storeConfirmedStatus = resolveMilestoneStatus({
    dueAt: dueDates.store_confirmed,
    actualAt: storeConfirmedActualAt,
  })

  return {
    status,
    needsManagerAttention,
    needsEmployeeAction,
    canConfirmAtStore,
    summarySent,
    fullSent,
    employeeResponded,
    clarificationRequested,
    acknowledged,
    storeConfirmed,
    waitingLabel,
    nextActionLabel,
    items: [
      {
        id: 'summary',
        label: 'Da gui noi quy tom tat',
        done: summarySent,
        tone: summaryStatus.tone,
        hint: summarySent ? 'Nhan vien da nhan cac diem can biet som.' : 'Nen gui som de nhan vien biet truoc quy dinh chinh.',
        dueAt: dueDates.summary,
        actualAt: summaryActualAt,
        scheduleLabel: resolveMilestoneScheduleLabel('summary', dueDates.summary),
        statusLabel: summaryStatus.statusLabel,
      },
      {
        id: 'full',
        label: 'Da gui noi quy day du',
        done: fullSent,
        tone: fullStatus.tone,
        hint: fullSent ? 'Nhan vien da co ban day du de doc va phan hoi.' : 'Can gui ban day du truoc khi yeu cau nhan vien xac nhan.',
        dueAt: dueDates.full,
        actualAt: fullActualAt,
        scheduleLabel: resolveMilestoneScheduleLabel('full', dueDates.full),
        statusLabel: fullStatus.statusLabel,
      },
      {
        id: 'responded',
        label: 'Nhan vien da phan hoi',
        done: employeeResponded,
        tone: respondedStatus.tone,
        hint: employeeResponded ? 'Nhan vien da xac nhan hoac da gui yeu cau can HR giai thich.' : 'Dang cho nhan vien xac nhan hoac yeu cau giai thich.',
        dueAt: dueDates.responded,
        actualAt: respondedActualAt,
        scheduleLabel: resolveMilestoneScheduleLabel('responded', dueDates.responded),
        statusLabel: respondedStatus.statusLabel,
      },
      {
        id: 'clarification',
        label: 'Can HR giai thich them',
        done: !clarificationRequested,
        tone: clarificationStatus.tone,
        hint: clarificationRequested ? 'Can xu ly truoc khi chot onboarding ngay dau.' : 'Khong co yeu cau giai thich dang mo.',
        dueAt: clarificationRequested ? dueDates.clarification : undefined,
        actualAt: clarificationActualAt,
        scheduleLabel: resolveMilestoneScheduleLabel('clarification', dueDates.clarification),
        statusLabel: clarificationStatus.statusLabel,
      },
      {
        id: 'store_confirmed',
        label: 'Da chot tai cua hang',
        done: storeConfirmed,
        tone: storeConfirmedStatus.tone,
        hint: storeConfirmed ? 'Quan ly/HR da chot buoc noi quy ngay dau.' : 'Ngay dau quan ly can check lai va chot tai cua hang neu can.',
        dueAt: dueDates.store_confirmed,
        actualAt: storeConfirmedActualAt,
        scheduleLabel: resolveMilestoneScheduleLabel('store_confirmed', dueDates.store_confirmed),
        statusLabel: storeConfirmedStatus.statusLabel,
      },
    ],
  }
}

function buildPresentationDayOneChecklistSnapshot(
  record: EmployeeOnboardingPolicyRecord | null,
): OnboardingDayOneChecklistSnapshot {
  const settings = getSettings()
  const base = buildDayOneChecklistSnapshot(record)
  const hireDate = getIsoDateOnly(record?.hire_date)
  const summaryDueAt =
    settings.onboarding_policy_summary_trigger === 'approval_confirm'
      ? getIsoDateOnly(record?.summary_due_anchor_at || record?.summary_sent_at) || hireDate
      : getIsoDateOnly(record?.summary_due_anchor_at || record?.summary_sent_at)
  const fullDueAt =
    settings.onboarding_policy_full_trigger === 'contract_countersign'
      ? getIsoDateOnly(record?.full_due_anchor_at || record?.full_sent_at)
      : settings.onboarding_policy_full_trigger === 'days_before_start' && hireDate
        ? addDaysToIsoDate(hireDate, -settings.onboarding_policy_full_days_before_start)
        : hireDate

  return {
    ...base,
    waitingLabel: record?.clarification_requested_at
      ? 'Đang chờ HR giải thích thêm trước ngày đầu'
      : record?.confirmed_at_store_at
        ? 'Đã hoàn tất bước nội quy ngày đầu'
        : record?.acknowledged_at
          ? 'Nhân viên đã xác nhận nội quy'
          : base.fullSent && settings.onboarding_policy_require_ack && !base.employeeResponded
            ? 'Đang chờ nhân viên đọc và phản hồi'
            : base.summarySent && !base.fullSent
              ? 'Đã gửi bản tóm tắt, chưa gửi bản đầy đủ'
              : 'Đang chờ HR kích hoạt nội quy đầy đủ',
    nextActionLabel: record?.clarification_requested_at
      ? 'HR/quản lý cần giải thích rồi mới chốt onboarding tại cửa hàng'
      : record?.confirmed_at_store_at
        ? 'Không còn thao tác nào ở mục nội quy'
        : record?.acknowledged_at
          ? 'Ngày đầu quản lý có thể chốt tại cửa hàng'
          : base.fullSent && settings.onboarding_policy_require_ack && !base.employeeResponded
            ? 'Nhân viên cần xác nhận hoặc gửi yêu cầu giải thích thêm'
            : base.fullSent && !settings.onboarding_policy_require_ack
              ? 'Không bắt buộc xác nhận, chỉ cần theo dõi trước ngày vào làm'
              : base.summarySent && !base.fullSent
                ? 'HR cần kích hoạt bản nội quy đầy đủ theo đúng mốc'
                : 'HR cần gửi nội quy đầy đủ đúng mốc onboarding',
    items: base.items.map((item) => {
      if (item.id === 'summary') {
        return {
          ...item,
          label: 'Đã gửi nội quy tóm tắt',
          hint: item.done ? 'Nhân viên đã nhận các điểm cần biết sớm.' : 'Nên gửi sớm để nhân viên biết trước quy định chính.',
          dueAt: summaryDueAt,
          scheduleLabel: settings.onboarding_policy_summary_trigger === 'approval_confirm'
            ? 'Theo cài đặt: gửi ngay sau khi duyệt hồ sơ'
            : 'Theo cài đặt: gửi khi gửi hợp đồng',
        }
      }

      if (item.id === 'full') {
        return {
          ...item,
          label: 'Đã gửi nội quy đầy đủ',
          hint: item.done ? 'Nhân viên đã có bản đầy đủ để đọc và phản hồi.' : 'Cần gửi bản đầy đủ trước khi yêu cầu nhân viên xác nhận.',
          dueAt: fullDueAt,
          scheduleLabel: settings.onboarding_policy_full_trigger === 'contract_countersign'
            ? 'Theo cài đặt: gửi sau khi HR countersign hợp đồng'
            : `Theo cài đặt: gửi trước ngày vào làm ${settings.onboarding_policy_full_days_before_start} ngày`,
        }
      }

      if (item.id === 'responded') {
        const actualAt = getIsoDateOnly(record?.acknowledged_at || record?.clarification_requested_at)
        return {
          ...item,
          label: settings.onboarding_policy_require_ack ? 'Nhân viên đã phản hồi' : 'Phản hồi nhân viên',
          done: settings.onboarding_policy_require_ack ? item.done : base.fullSent,
          tone: settings.onboarding_policy_require_ack ? item.tone : 'done',
          hint: settings.onboarding_policy_require_ack
            ? (base.employeeResponded ? 'Nhân viên đã xác nhận hoặc đã gửi yêu cầu cần HR giải thích.' : 'Đang chờ nhân viên xác nhận hoặc yêu cầu giải thích.')
            : 'Không bắt buộc xác nhận theo cài đặt hiện tại.',
          dueAt: settings.onboarding_policy_require_ack ? hireDate : undefined,
          actualAt,
          scheduleLabel: settings.onboarding_policy_require_ack
            ? 'Theo cài đặt: bắt xác nhận trước ngày vào làm'
            : 'Theo cài đặt: không bắt xác nhận',
          statusLabel: settings.onboarding_policy_require_ack ? item.statusLabel : 'Đã xong',
        }
      }

      if (item.id === 'clarification') {
        return {
          ...item,
          label: 'Cần HR giải thích thêm',
          hint: item.done ? 'Không có yêu cầu giải thích đang mở.' : 'Cần xử lý trước khi chốt onboarding ngày đầu.',
          scheduleLabel: 'Theo rule mặc định: xử lý trước khi chốt onboarding tại cửa hàng',
        }
      }

      if (item.id === 'store_confirmed') {
        return {
          ...item,
          label: 'Đã chốt tại cửa hàng',
          hint: item.done ? 'Quản lý/HR đã chốt bước nội quy ngày đầu.' : 'Ngày đầu quản lý cần kiểm tra lại và chốt tại cửa hàng nếu cần.',
          dueAt: hireDate,
          scheduleLabel: 'Theo rule mặc định: chốt trong ngày đầu nhận việc',
        }
      }

      return item
    }),
  }
}

export const OnboardingPolicyService = {
  getTemplate(templateId: 'default-policy-v1') {
    return POLICY_TEMPLATES[templateId]
  },

  listRecords() {
    return loadRecords().sort((a, b) => a.employee_name.localeCompare(b.employee_name))
  },

  getRecord(employeeId: string) {
    return loadRecords().find((item) => item.employee_id === employeeId) || null
  },

  getDayOneChecklistSnapshot(record: EmployeeOnboardingPolicyRecord | null) {
    return buildPresentationDayOneChecklistSnapshot(record)
  },

  ensureRecordFromEmployee(employee: PolicyEmployeeInput) {
    const records = loadRecords()
    const existing = records.find((item) => item.employee_id === employee.id)
    if (existing) {
      existing.employee_name = employee.full_name
      existing.store_id = employee.store_id
      existing.hire_date = employee.hire_date
      saveRecords(records)
      return existing
    }

    const record = buildRecord(employee)
    records.unshift(record)
    saveRecords(records)
    return record
  },

  markSummarySent(record: EmployeeOnboardingPolicyRecord, actorName: string, note: string) {
    record.summary_due_anchor_at = record.summary_due_anchor_at || nowIso()
    if (!record.summary_sent_at) {
      record.summary_sent_at = nowIso()
    }
    if (record.status === 'chua_gui') {
      record.status = 'da_gui_tom_tat'
    }
    pushHistory(record, 'summary_sent', actorName, note)
    notifyEmployeePolicy(
      record.employee_id,
      'Nội quy nhận việc đã sẵn sàng',
      'Bạn vui lòng xem nhanh các điểm nội quy quan trọng trước ngày vào làm.',
      'summary',
    )
  },

  markFullSent(record: EmployeeOnboardingPolicyRecord, actorName: string, note: string) {
    record.full_due_anchor_at = record.full_due_anchor_at || nowIso()
    record.full_sent_at = nowIso()
    record.read_at = undefined
    record.acknowledged_at = undefined
    record.clarification_requested_at = undefined
    record.confirmed_at_store_at = undefined
    record.status = 'da_gui_day_du'
    pushHistory(record, 'full_sent', actorName, note)
    notifyEmployeePolicy(
      record.employee_id,
      'Nội quy đầy đủ đã sẵn sàng',
      'Bạn vui lòng đọc và xác nhận nội quy trước ngày vào làm.',
      'full',
    )
  },

  markReminderSent(
    record: EmployeeOnboardingPolicyRecord,
    actorName: string,
    note: string,
    recipients: string[],
  ) {
    record.status = 'can_nhac'
    record.reminder_count += 1
    record.last_reminded_at = nowIso()
    pushHistory(record, 'reminder_sent', actorName, note)
    notifyEmployeePolicy(
      record.employee_id,
      'Nhắc lại xác nhận nội quy',
      'Bạn vẫn chưa xác nhận nội quy. Vui lòng hoàn tất trước ngày vào làm.',
      'reminder',
    )
    notifyManagersPolicy(record.employee_id, record.employee_name, recipients, 'can_nhac')
  },

  handleInvitationApproved(input: {
    employee: PolicyEmployeeInput
    invitation: EmployeeInvitation
    actor?: AuthUser
  }) {
    const settings = getSettings()
    if (!settings.onboarding_policy_enabled) return null

    const records = loadRecords()
    const record = records.find((item) => item.employee_id === input.employee.id) || buildRecord(input.employee)

    record.employee_name = input.employee.full_name
    record.store_id = input.employee.store_id
    record.hire_date = input.employee.hire_date
    record.template_id = settings.onboarding_policy_template_id

    if (!records.some((item) => item.employee_id === input.employee.id)) {
      records.unshift(record)
    }

    if (settings.onboarding_policy_summary_trigger === 'approval_confirm') {
      this.markSummarySent(record, input.actor?.full_name || 'Hệ thống', 'Gửi bản tóm tắt sau khi HR duyệt hồ sơ')
    }

    saveRecords(records)
    return record
  },

  handleContractSent(input: {
    employee: PolicyEmployeeInput
    contractId: string
    actor: AuthUser
  }) {
    const settings = getSettings()
    if (!settings.onboarding_policy_enabled || settings.onboarding_policy_summary_trigger !== 'contract_send') return null

    const records = loadRecords()
    const record = records.find((item) => item.employee_id === input.employee.id) || buildRecord(input.employee)

    record.employee_name = input.employee.full_name
    record.store_id = input.employee.store_id
    record.hire_date = input.employee.hire_date
    record.template_id = settings.onboarding_policy_template_id
    record.latest_contract_id = input.contractId

    if (!records.some((item) => item.employee_id === input.employee.id)) {
      records.unshift(record)
    }

    this.markSummarySent(record, input.actor.full_name, 'Gửi bản tóm tắt lúc gửi hợp đồng')
    saveRecords(records)
    return record
  },

  handleContractActivated(input: {
    employee: PolicyEmployeeInput
    contractId: string
    actor: AuthUser
  }) {
    const settings = getSettings()
    if (!settings.onboarding_policy_enabled || settings.onboarding_policy_full_trigger !== 'contract_countersign') return null

    const records = loadRecords()
    const record = records.find((item) => item.employee_id === input.employee.id) || buildRecord(input.employee)

    record.employee_name = input.employee.full_name
    record.store_id = input.employee.store_id
    record.hire_date = input.employee.hire_date
    record.template_id = settings.onboarding_policy_template_id
    record.latest_contract_id = input.contractId

    if (!records.some((item) => item.employee_id === input.employee.id)) {
      records.unshift(record)
    }

    this.markFullSent(record, input.actor.full_name, 'Gửi nội quy đầy đủ sau khi HR countersign')
    saveRecords(records)
    return record
  },

  acknowledge(employeeId: string, actor: AuthUser) {
    if (actor.id !== employeeId) return null

    const records = loadRecords()
    const record = records.find((item) => item.employee_id === employeeId)
    if (!record || !record.full_sent_at) return null

    record.read_at = record.read_at || nowIso()
    record.acknowledged_at = nowIso()
    record.clarification_requested_at = undefined
    record.status = 'da_xac_nhan'
    pushHistory(record, 'employee_read', actor.full_name, 'Nhân viên đã mở và đọc nội quy')
    pushHistory(record, 'employee_acknowledged', actor.full_name, 'Nhân viên đã xác nhận nội quy')
    saveRecords(records)
    return record
  },

  requestClarification(employeeId: string, actor: AuthUser) {
    if (actor.id !== employeeId) return null

    const records = loadRecords()
    const record = records.find((item) => item.employee_id === employeeId)
    if (!record || !record.full_sent_at) return null

    record.read_at = record.read_at || nowIso()
    record.acknowledged_at = undefined
    record.clarification_requested_at = nowIso()
    record.confirmed_at_store_at = undefined
    record.status = 'can_giai_thich'
    pushHistory(record, 'employee_read', actor.full_name, 'Nhân viên đã đọc nội quy')
    pushHistory(record, 'clarification_requested', actor.full_name, 'Nhân viên cần HR giải thích thêm')
    saveRecords(records)
    return record
  },

  confirmAtStore(employeeId: string, actor: AuthUser) {
    if (!isManagerRole(actor.role)) return null

    const records = loadRecords()
    const record = records.find((item) => item.employee_id === employeeId)
    if (!record) return null
    if (!canManagePolicyRecord(actor, record)) return null
    if (!record.full_sent_at) return null
    if (record.status === 'can_giai_thich' || record.clarification_requested_at) return null

    record.read_at = record.read_at || nowIso()
    record.clarification_requested_at = undefined
    record.confirmed_at_store_at = nowIso()
    record.status = 'da_xac_nhan'
    pushHistory(record, 'store_confirmed', actor.full_name, 'Quản lý/HR đã chốt nội quy tại cửa hàng')
    saveRecords(records)
    return record
  },

  resendSummary(employeeId: string, actor: AuthUser) {
    if (!isManagerRole(actor.role)) return null

    const records = loadRecords()
    const record = records.find((item) => item.employee_id === employeeId)
    if (!record) return null
    if (!canManagePolicyRecord(actor, record)) return null

    this.markSummarySent(record, actor.full_name, 'HR/Quản lý gửi lại bản tóm tắt nội quy')
    saveRecords(records)
    return record
  },

  resendFull(employeeId: string, actor: AuthUser) {
    if (!isManagerRole(actor.role)) return null

    const records = loadRecords()
    const record = records.find((item) => item.employee_id === employeeId)
    if (!record) return null
    if (!canManagePolicyRecord(actor, record)) return null

    this.markFullSent(record, actor.full_name, 'HR/Quản lý gửi lại nội quy đầy đủ')
    saveRecords(records)
    return record
  },

  syncDueAutomation(currentUser: AuthUser) {
    const settings = getSettings()
    if (!settings.onboarding_policy_enabled || !isManagerRole(currentUser.role)) {
      return { fullSent: 0, reminders: 0 }
    }

    const records = loadRecords()
    if (records.length === 0) return { fullSent: 0, reminders: 0 }

    let fullSent = 0
    let reminders = 0

    records.forEach((record) => {
      if (!canManagePolicyRecord(currentUser, record)) {
        return
      }

      const daysToStart = daysUntil(record.hire_date)

      if (
        settings.onboarding_policy_full_trigger === 'days_before_start' &&
        !record.full_sent_at &&
        Number.isFinite(daysToStart) &&
        daysToStart <= settings.onboarding_policy_full_days_before_start
      ) {
        this.markFullSent(record, currentUser.full_name, 'Gửi nội quy đầy đủ theo mốc trước ngày vào làm')
        fullSent += 1
      }

      const shouldRemind =
        settings.onboarding_policy_require_ack &&
        Boolean(record.full_sent_at) &&
        !record.acknowledged_at &&
        record.reminder_count < settings.onboarding_policy_max_reminders

      if (shouldRemind) {
        this.markReminderSent(record, currentUser.full_name, 'Nhắc lại nhân viên đọc/xác nhận nội quy', [currentUser.id])
        reminders += 1
      }
    })

    saveRecords(records)
    return { fullSent, reminders }
  },
}
