export type ContractPlaceholderGroup =
  | 'employee'
  | 'company'
  | 'store'
  | 'position'
  | 'job'
  | 'contract'
  | 'salary'
  | 'policy'

export type ContractPlaceholderStatus =
  | 'hop_le'
  | 'thieu_du_lieu'
  | 'field_la'
  | 'trung_lap'

export type ContractPlaceholderItem = {
  key: string
  group: ContractPlaceholderGroup | 'unknown'
  field: string
  occurrences: number
  value: string
  status: ContractPlaceholderStatus
  note?: string
}

export type ContractPreviewChecklist = {
  total: number
  valid: number
  missing: number
  unknown: number
  duplicates: number
  canSend: boolean
  blockingReasons: string[]
}

export const CONTRACT_PLACEHOLDER_CATALOG = {
  employee: ['full_name', 'employee_code', 'phone', 'email', 'address', 'start_date', 'date_of_birth', 'gender', 'cccd', 'cccd_issue_date', 'cccd_issue_place', 'tax_code', 'bank_name', 'bank_account'],
  company: ['name', 'tax_id', 'address', 'signer_name', 'signer_title'],
  store: ['name', 'address', 'phone', 'manager_name'],
  position: ['name', 'level'],
  job: ['main_duties', 'working_schedule'],
  contract: ['id', 'code', 'type', 'type_label', 'start_date', 'end_date', 'signer_name', 'signer_title', 'signing_date', 'version', 'parent_contract_code'],
  salary: ['official', 'probation', 'allowances', 'kpi', 'probation_period', 'payday', 'hourly_or_shift'],
  policy: ['work_rules', 'dress_code', 'cash_handling', 'food_safety', 'attendance', 'overtime', 'discipline', 'contract_note'],
} as const

const PLACEHOLDER_REGEX = /{{\s*([a-z0-9_]+)\.([a-z0-9_]+)\s*}}/g

function isKnownGroup(group: string): group is ContractPlaceholderGroup {
  return group in CONTRACT_PLACEHOLDER_CATALOG
}

function isAllowedField(group: ContractPlaceholderGroup, field: string) {
  return (CONTRACT_PLACEHOLDER_CATALOG[group] as readonly string[]).includes(field)
}

export function extractPlaceholderKeys(sourceText: string) {
  const matches = sourceText.matchAll(PLACEHOLDER_REGEX)
  return Array.from(matches, (match) => `${match[1]}.${match[2]}`)
}

export function scanContractPlaceholders(
  sourceText: string,
  values: Record<string, string>,
): ContractPlaceholderItem[] {
  const counts = new Map<string, number>()

  for (const key of extractPlaceholderKeys(sourceText)) {
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  return Array.from(counts.entries()).map(([key, occurrences]) => {
    const [groupRaw = '', field = ''] = key.split('.')
    const group = isKnownGroup(groupRaw) ? groupRaw : 'unknown'
    const value = String(values[key] || '').trim()

    if (group === 'unknown' || !isAllowedField(group, field)) {
      return {
        key,
        group,
        field,
        occurrences,
        value,
        status: 'field_la',
        note: 'Field khong nam trong bo chuan',
      }
    }

    if (!value) {
      return {
        key,
        group,
        field,
        occurrences,
        value,
        status: 'thieu_du_lieu',
        note: 'Chua co gia tri de do vao hop dong',
      }
    }

    if (occurrences > 1) {
      return {
        key,
        group,
        field,
        occurrences,
        value,
        status: 'trung_lap',
        note: 'Field xuat hien nhieu lan trong mau',
      }
    }

    return {
      key,
      group,
      field,
      occurrences,
      value,
      status: 'hop_le',
    }
  })
}

export function buildContractPreviewChecklist(items: ContractPlaceholderItem[]): ContractPreviewChecklist {
  const missing = items.filter((item) => item.status === 'thieu_du_lieu').length
  const unknown = items.filter((item) => item.status === 'field_la').length
  const duplicates = items.filter((item) => item.status === 'trung_lap').length

  return {
    total: items.length,
    valid: items.filter((item) => item.status === 'hop_le').length,
    missing,
    unknown,
    duplicates,
    canSend: missing === 0 && unknown === 0,
    blockingReasons: [
      ...(unknown > 0 ? ['Mau co field la ngoai bo chuan'] : []),
      ...(missing > 0 ? ['Ho so hien tai con thieu du lieu bat buoc'] : []),
    ],
  }
}
