import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { EmployeeService } from '@/lib/services/employee-service'
import { OnboardingPolicyService } from '@/lib/services/onboarding-policy-service'
import type { AuthUser } from '@/store/auth-store'
import {
  defaultTemplates,
  makeId,
  now,
  renderContractPreview,
  seedContracts,
  today,
} from './contract-service-data'
import {
  buildContractPreviewChecklist,
  scanContractPlaceholders,
  type ContractPreviewChecklist,
  type ContractPlaceholderItem,
  type ContractPlaceholderStatus,
} from './contract-template-placeholder'
import { getPositionById, getStoreById } from '@/lib/mock-data'
import { settingsPayroll, settingsSystem } from '@/lib/mock-data-settings'

export type ContractTemplateStatus = 'draft' | 'active' | 'archived'
export type ContractStatus =
  | 'draft'
  | 'pending_employee_sign'
  | 'signed_by_employee'
  | 'pending_hr_sign'
  | 'active'
  | 'rejected'
  | 'expired'
  | 'void'
  | 'superseded'

export type ContractBlock = {
  id: string
  title: string
  content: string
  locked: boolean
  category: 'employee' | 'salary' | 'store_rules' | 'fnb_rules' | 'signing'
}

export type ContractTemplatePlaceholderMeta = {
  sourceFileName?: string
  sourceKind: 'blocks' | 'docx_upload'
  sourceText: string
  scannedAt?: string
  placeholders: ContractPlaceholderItem[]
  blockingIssues: string[]
  warningIssues: string[]
}

export type ContractTemplate = {
  id: string
  name: string
  description: string
  employmentType: 'full_time' | 'part_time' | 'seasonal' | 'intern'
  positionIds: string[]
  storeScope: 'all' | 'standard_store' | 'flagship' | 'kiosk'
  status: ContractTemplateStatus
  version: string
  updatedAt: string
  blocks: ContractBlock[]
  placeholderMeta: ContractTemplatePlaceholderMeta
}

export type ContractSignature = {
  id: string
  actorId: string
  actorName: string
  role: 'employee' | 'hr'
  signedAt: string
  method: 'app_confirm' | 'otp_mock'
  evidence: string
}

export type ContractAuditLog = {
  id: string
  action: string
  actorId: string
  actorName: string
  at: string
  note: string
}

export type EmployeeContract = {
  id: string
  templateId: string
  employeeId: string
  storeId: string
  positionId: string
  status: ContractStatus
  version: string
  startDate: string
  endDate?: string
  sentAt?: string
  activatedAt?: string
  customFields: Record<string, string>
  renderedContent: string
  signatures: ContractSignature[]
  auditLogs: ContractAuditLog[]
  snapshotHistory: Array<{
    id: string
    version: string
    createdAt: string
    note: string
    content: string
  }>
}

export type ContractDraftInput = {
  employeeId: string
  templateId: string
  startDate: string
  endDate?: string
  customFields?: Record<string, string>
}

export type ContractDraftPreview = {
  renderedContent: string
  renderedContentSource: string
  placeholderValues: Record<string, string>
  placeholderItems: ContractPlaceholderItem[]
  checklist: ContractPreviewChecklist
  sourceFileName?: string
  segments: ContractPreviewSegment[]
}

export type ContractPreviewSegment =
  | { type: 'text'; value: string }
  | { type: 'field'; key: string; value: string; status: ContractPlaceholderStatus }

export type ContractBulkInput = {
  employeeIds: string[]
  templateId: string
  startDate: string
  endDate?: string
  customFields?: Record<string, string>
  perEmployeeFields?: Record<string, Record<string, string>>
  sendNow?: boolean
}

export type ContractTrackingSummary = {
  total: number
  draft: number
  pendingSignature: number
  active: number
  expiringSoon: number
  renewalDue: number
}

export type ContractRenewalTracking = {
  rootContractCode: string
  currentContractCode: string
  daysToEnd: number | null
  summary: {
    expiringSoon: boolean
    needsRenewalDraft: boolean
    waitingEmployeeSign: number
    waitingHrSign: number
    overdueProcessing: number
    newerVersionCount: number
  }
  nextAction: {
    label: string
    detail: string
    tone: string
  }
  linkedContracts: Array<{
    id: string
    code: string
    version: string
    status: ContractStatus
    startDate: string
    endDate?: string
  }>
}

export type ContractImportMapping = {
  employee_code?: string
  employee_email?: string
  employee_name?: string
  template_id?: string
  start_date?: string
  end_date?: string
  contract_type?: string
  contract_code?: string
  signer_name?: string
  signer_title?: string
  bank_name?: string
  manager_name?: string
  salary_allowances?: string
  working_schedule?: string
  main_duties?: string
  contract_note?: string
}

export type ContractImportRow = Record<string, string | number | boolean | null | undefined>

export type ContractExportOptions = {
  statusLabel?: string
}

export const CONTRACT_STATUS_META: Record<ContractStatus, { label: string; tone: string }> = {
  draft: { label: 'Nháp', tone: 'bg-slate-100 text-slate-700' },
  pending_employee_sign: { label: 'Chờ nhân sự ký', tone: 'bg-amber-100 text-amber-700' },
  signed_by_employee: { label: 'Nhân sự đã ký', tone: 'bg-sky-100 text-sky-700' },
  pending_hr_sign: { label: 'Chờ HR ký', tone: 'bg-indigo-100 text-indigo-700' },
  active: { label: 'Đang hiệu lực', tone: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Từ chối', tone: 'bg-red-100 text-red-700' },
  expired: { label: 'Hết hạn', tone: 'bg-zinc-100 text-zinc-700' },
  void: { label: 'Hủy', tone: 'bg-rose-100 text-rose-700' },
  superseded: { label: 'Đã thay thế', tone: 'bg-violet-100 text-violet-700' },
}

const TEMPLATE_KEY = 'homies-contract-templates-v1'
const CONTRACT_KEY = 'homies-employee-contracts-v1'
const HR_ROLES = new Set(['ceo', 'hr_admin'])

type ContractTemplateRow = {
  id: string
  name: string
  description: string
  employment_type: ContractTemplate['employmentType']
  position_ids: string[]
  store_scope: ContractTemplate['storeScope']
  status: ContractTemplateStatus
  version: string
  updated_at: string
  blocks: ContractBlock[]
  placeholder_meta?: ContractTemplatePlaceholderMeta
  created_at?: string
}

type ContractRow = {
  id: string
  template_id: string
  employee_id: string
  store_id: string
  position_id: string
  status: ContractStatus
  version: string
  start_date: string
  end_date: string | null
  sent_at: string | null
  activated_at: string | null
  custom_fields: Record<string, string>
  rendered_content: string
  created_at?: string
  updated_at?: string
}

type ContractSignatureRow = {
  id: string
  contract_id: string
  actor_id: string
  actor_name: string
  role: ContractSignature['role']
  signed_at: string
  method: ContractSignature['method']
  evidence: string
  created_at?: string
}

type ContractAuditLogRow = {
  id: string
  contract_id: string
  action: string
  actor_id: string
  actor_name: string
  at: string
  note: string
  created_at?: string
}

type ContractSnapshotRow = {
  id: string
  contract_id: string
  version: string
  created_at: string
  note: string
  content: string
}

function getEmployee(employeeId: string, currentUser?: AuthUser) {
  return EmployeeService.getEmployeeById(employeeId, currentUser) || EmployeeService.getEmployeeById(employeeId)
}

function normalizeText(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function readMappedValue(row: ContractImportRow, header?: string) {
  return String((header && row[header]) || '').trim()
}

function canAccessContract(contract: EmployeeContract, currentUser?: AuthUser) {
  if (!currentUser) return true
  if (HR_ROLES.has(currentUser.role)) return true
  if (['store_manager', 'shift_leader'].includes(currentUser.role)) return contract.storeId === currentUser.store_id
  return contract.employeeId === currentUser.id
}

function toTemplateRow(template: ContractTemplate): ContractTemplateRow {
  return {
    id: template.id,
    name: template.name,
    description: template.description,
    employment_type: template.employmentType,
    position_ids: template.positionIds,
    store_scope: template.storeScope,
    status: template.status,
    version: template.version,
    updated_at: template.updatedAt,
    blocks: template.blocks,
    placeholder_meta: template.placeholderMeta,
  }
}

function buildTemplatePlaceholderMeta(template: Pick<ContractTemplate, 'blocks'>, sourceFileName?: string): ContractTemplatePlaceholderMeta {
  const sourceText = template.blocks.map(block => `${block.title}\n${block.content}`).join('\n\n')
  return {
    sourceFileName,
    sourceKind: 'blocks',
    sourceText,
    scannedAt: '2026-05-26T00:00:00.000Z',
    placeholders: scanContractPlaceholders(sourceText, {}),
    blockingIssues: [],
    warningIssues: [],
  }
}

function hydrateTemplate(template: Omit<ContractTemplate, 'placeholderMeta'> & { placeholderMeta?: ContractTemplatePlaceholderMeta }) {
  return {
    ...template,
    placeholderMeta: template.placeholderMeta || buildTemplatePlaceholderMeta(template),
  }
}

function toContractRow(contract: EmployeeContract): ContractRow {
  return {
    id: contract.id,
    template_id: contract.templateId,
    employee_id: contract.employeeId,
    store_id: contract.storeId,
    position_id: contract.positionId,
    status: contract.status,
    version: contract.version,
    start_date: contract.startDate,
    end_date: contract.endDate || null,
    sent_at: contract.sentAt || null,
    activated_at: contract.activatedAt || null,
    custom_fields: contract.customFields,
    rendered_content: contract.renderedContent,
  }
}

function toSignatureRows(contract: EmployeeContract): ContractSignatureRow[] {
  return contract.signatures.map(signature => ({
    id: signature.id,
    contract_id: contract.id,
    actor_id: signature.actorId,
    actor_name: signature.actorName,
    role: signature.role,
    signed_at: signature.signedAt,
    method: signature.method,
    evidence: signature.evidence,
  }))
}

function toAuditLogRows(contract: EmployeeContract): ContractAuditLogRow[] {
  return contract.auditLogs.map(log => ({
    id: log.id,
    contract_id: contract.id,
    action: log.action,
    actor_id: log.actorId,
    actor_name: log.actorName,
    at: log.at,
    note: log.note,
  }))
}

function toSnapshotRows(contract: EmployeeContract): ContractSnapshotRow[] {
  return contract.snapshotHistory.map(snapshot => ({
    id: snapshot.id,
    contract_id: contract.id,
    version: snapshot.version,
    created_at: snapshot.createdAt,
    note: snapshot.note,
    content: snapshot.content,
  }))
}

function toEmployeeContract(
  row: ContractRow,
  signatures: ContractSignatureRow[],
  auditLogs: ContractAuditLogRow[],
  snapshots: ContractSnapshotRow[],
): EmployeeContract {
  return {
    id: row.id,
    templateId: row.template_id,
    employeeId: row.employee_id,
    storeId: row.store_id,
    positionId: row.position_id,
    status: row.status,
    version: row.version,
    startDate: row.start_date,
    endDate: row.end_date || undefined,
    sentAt: row.sent_at || undefined,
    activatedAt: row.activated_at || undefined,
    customFields: row.custom_fields || {},
    renderedContent: row.rendered_content || '',
    signatures: signatures
      .filter(item => item.contract_id === row.id)
      .sort((a, b) => a.signed_at.localeCompare(b.signed_at))
      .map(signature => ({
        id: signature.id,
        actorId: signature.actor_id,
        actorName: signature.actor_name,
        role: signature.role,
        signedAt: signature.signed_at,
        method: signature.method,
        evidence: signature.evidence,
      })),
    auditLogs: auditLogs
      .filter(item => item.contract_id === row.id)
      .sort((a, b) => b.at.localeCompare(a.at))
      .map(log => ({
        id: log.id,
        action: log.action,
        actorId: log.actor_id,
        actorName: log.actor_name,
        at: log.at,
        note: log.note,
      })),
    snapshotHistory: snapshots
      .filter(item => item.contract_id === row.id)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map(snapshot => ({
        id: snapshot.id,
        version: snapshot.version,
        createdAt: snapshot.created_at,
        note: snapshot.note,
        content: snapshot.content,
      })),
  }
}

function sortContractsNewestFirst(contracts: EmployeeContract[]) {
  return contracts.sort((a, b) => {
    const left = a.activatedAt || a.sentAt || a.startDate
    const right = b.activatedAt || b.sentAt || b.startDate
    return right.localeCompare(left)
  })
}

function daysBetween(dateText: string) {
  const target = new Date(`${dateText}T00:00:00`)
  const todayDate = new Date()
  const current = new Date(todayDate.getFullYear(), todayDate.getMonth(), todayDate.getDate())
  return Math.ceil((target.getTime() - current.getTime()) / 86400000)
}

function getContractCode(contract: EmployeeContract) {
  return contract.customFields['contract.code'] || contract.id
}

function getRootContractCode(contract: EmployeeContract) {
  return contract.customFields['contract.parent_contract_code'] || getContractCode(contract)
}

function isSameRenewalChain(contract: EmployeeContract, rootContractCode: string) {
  return getContractCode(contract) === rootContractCode || contract.customFields['contract.parent_contract_code'] === rootContractCode
}

function normalizeHeader(header: string) {
  return header
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function buildDraftPlaceholderValues(
  employee: AuthUser,
  contract: Pick<EmployeeContract, 'id' | 'startDate' | 'endDate' | 'customFields' | 'version'>,
) {
  const store = getStoreById(employee.store_id)
  const position = getPositionById(employee.position_id)
  const baseSalary = employee.official_salary || position?.base_salary || 0
  const probation = employee.probation_salary_value || Math.round(baseSalary * settingsPayroll.salary_coefficients.probation_rate)
  const genderMap = {
    male: 'Nam',
    female: 'Nu',
    other: 'Khac',
  } as const
  const contractType = contract.customFields['contract.type'] || (contract.endDate ? 'xac_dinh_thoi_han' : 'khong_xac_dinh_thoi_han')
  const contractTypeLabelMap: Record<string, string> = {
    xac_dinh_thoi_han: 'Hop dong lao dong xac dinh thoi han',
    khong_xac_dinh_thoi_han: 'Hop dong lao dong khong xac dinh thoi han',
    part_time: 'Hop dong lao dong part-time',
    phu_luc: 'Phu luc hop dong lao dong',
  }

  return {
    'company.name': settingsSystem.company_info.name,
    'company.tax_id': settingsSystem.company_info.tax_id,
    'company.address': settingsSystem.company_info.address,
    'company.signer_name': contract.customFields['company.signer_name'] || 'Hoang Thi Yen',
    'company.signer_title': contract.customFields['company.signer_title'] || 'Truong phong Nhan su',
    'employee.full_name': employee.full_name || '',
    'employee.employee_code': employee.employee_code || '',
    'employee.date_of_birth': employee.date_of_birth || contract.customFields['employee.date_of_birth'] || '',
    'employee.gender': genderMap[employee.gender || 'other'] || '',
    'employee.cccd': employee.cccd || contract.customFields['employee.cccd'] || '',
    'employee.cccd_issue_date': contract.customFields['employee.cccd_issue_date'] || '',
    'employee.cccd_issue_place': contract.customFields['employee.cccd_issue_place'] || '',
    'employee.address': employee.address || contract.customFields['employee.address'] || '',
    'employee.phone': employee.phone || '',
    'employee.email': employee.email || '',
    'employee.tax_code': contract.customFields['employee.tax_code'] || '',
    'employee.bank_name': contract.customFields['employee.bank_name'] || '',
    'employee.bank_account': contract.customFields['employee.bank_account'] || '',
    'employee.start_date': employee.hire_date || contract.startDate || '',
    'store.name': store?.name || '',
    'store.address': store?.address || '',
    'store.phone': store?.phone || '',
    'store.manager_name': contract.customFields['store.manager_name'] || '',
    'position.name': position?.name || '',
    'position.level': String(position?.level || employee.job_level || ''),
    'contract.id': contract.id,
    'contract.code': contract.customFields['contract.code'] || contract.id.toUpperCase(),
    'contract.version': contract.version,
    'contract.parent_contract_code': contract.customFields['contract.parent_contract_code'] || '',
    'contract.type': contractType,
    'contract.type_label': contractTypeLabelMap[contractType] || contractTypeLabelMap.xac_dinh_thoi_han,
    'contract.start_date': contract.startDate,
    'contract.end_date': contract.endDate || '',
    'contract.signing_date': today(),
    'contract.signer_name': contract.customFields['company.signer_name'] || '',
    'contract.signer_title': contract.customFields['company.signer_title'] || '',
    'salary.official': baseSalary ? `${Math.round(baseSalary).toLocaleString('vi-VN')} d` : '',
    'salary.probation': probation ? `${Math.round(probation).toLocaleString('vi-VN')} d` : '',
    'salary.kpi': employee.kpi_salary ? `${Math.round(employee.kpi_salary).toLocaleString('vi-VN')} d` : '',
    'salary.allowances': contract.customFields['salary.allowances'] || '',
    'salary.probation_period': contract.customFields['salary.probation_period'] || '',
    'salary.payday': contract.customFields['salary.payday'] || '',
    'salary.hourly_or_shift': contract.customFields['salary.hourly_or_shift'] || '',
    'job.main_duties': contract.customFields['job.main_duties'] || '',
    'job.working_schedule': contract.customFields['job.working_schedule'] || '',
    'policy.work_rules': contract.customFields['policy.work_rules'] || '',
    'policy.dress_code': contract.customFields['policy.dress_code'] || '',
    'policy.cash_handling': contract.customFields['policy.cash_handling'] || '',
    'policy.food_safety': contract.customFields['policy.food_safety'] || '',
    'policy.attendance': contract.customFields['policy.attendance'] || '',
    'policy.overtime': contract.customFields['policy.overtime'] || '',
    'policy.discipline': contract.customFields['policy.discipline'] || '',
    'policy.contract_note': contract.customFields['policy.contract_note'] || '',
    ...contract.customFields,
  }
}

function renderSourceTextPreview(sourceText: string, values: Record<string, string>) {
  return sourceText.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, rawKey: string) => {
    const key = rawKey.trim()
    return values[key] || `{{${key}}}`
  })
}

export function buildPreviewSegments(
  sourceText: string,
  values: Record<string, string>,
  items: ContractPlaceholderItem[],
): ContractPreviewSegment[] {
  const statusMap = new Map(items.map((item) => [item.key, item.status]))
  const segments: ContractPreviewSegment[] = []
  const regex = /\{\{\s*([^}]+?)\s*\}\}/g
  let cursor = 0

  for (const match of sourceText.matchAll(regex)) {
    const raw = match[0]
    const key = String(match[1] || '').trim()
    const index = match.index ?? 0

    if (index > cursor) {
      segments.push({ type: 'text', value: sourceText.slice(cursor, index) })
    }

    segments.push({
      type: 'field',
      key,
      value: values[key] || '',
      status: statusMap.get(key) || 'field_la',
    })

    cursor = index + raw.length
  }

  if (cursor < sourceText.length) {
    segments.push({ type: 'text', value: sourceText.slice(cursor) })
  }

  return segments
}

function createDraftPreviewState(
  input: ContractDraftInput,
  currentUser?: AuthUser,
  options?: { sourceText?: string; sourceFileName?: string },
): ContractDraftPreview | null {
  const templates = ContractService.getTemplates()
  const template = templates.find(item => item.id === input.templateId) || templates[0]
  const employee = getEmployee(input.employeeId, currentUser)
  if (!template || !employee) return null

  const draftContract = {
    id: 'draft-preview',
    version: 'preview',
    startDate: input.startDate,
    endDate: input.endDate,
    customFields: input.customFields || {},
  }
  const renderedContentSource = options?.sourceText || template.placeholderMeta.sourceText || template.blocks.map((block) => `${block.title}\n${block.content}`).join('\n\n')
  const placeholderValues = buildDraftPlaceholderValues(employee, draftContract)
  const renderedContent = options?.sourceText
    ? renderSourceTextPreview(renderedContentSource, placeholderValues)
    : renderContractPreview(template, draftContract, employee)
  const placeholderItems = scanContractPlaceholders(renderedContentSource, placeholderValues)
  const checklist = buildContractPreviewChecklist(placeholderItems)
  const segments = buildPreviewSegments(renderedContentSource, placeholderValues, placeholderItems)

  return {
    renderedContent,
    renderedContentSource,
    placeholderValues,
    placeholderItems,
    checklist,
    sourceFileName: options?.sourceFileName,
    segments,
  }
}

export class ContractService {
  static getTemplates(): ContractTemplate[] {
    if (typeof window === 'undefined') return defaultTemplates().map(hydrateTemplate)
    const stored = window.localStorage.getItem(TEMPLATE_KEY)
    if (!stored) {
      const seed = defaultTemplates().map(hydrateTemplate)
      window.localStorage.setItem(TEMPLATE_KEY, JSON.stringify(seed))
      return seed
    }
    try {
      const templates = (JSON.parse(stored) as Array<Omit<ContractTemplate, 'placeholderMeta'> & { placeholderMeta?: ContractTemplatePlaceholderMeta }>).map(hydrateTemplate)
      window.localStorage.setItem(TEMPLATE_KEY, JSON.stringify(templates))
      return templates
    } catch (error) {
      console.warn(`[ContractService] Failed to parse ${TEMPLATE_KEY}. Re-seeding contract templates from defaults.`, error)
      window.localStorage.removeItem(TEMPLATE_KEY)
      return defaultTemplates().map(hydrateTemplate)
    }
  }

  static async getContracts(currentUser?: AuthUser): Promise<EmployeeContract[]> {
    const contracts = await this.getContractsDb()
    return sortContractsNewestFirst(contracts.filter(contract => canAccessContract(contract, currentUser)))
  }

  static async getContractById(id: string, currentUser?: AuthUser): Promise<EmployeeContract | undefined> {
    const contract = (await this.getContractsDb()).find(item => item.id === id)
    if (!contract || !canAccessContract(contract, currentUser)) return undefined
    return contract
  }

  static async getContractsForEmployee(employeeId: string, currentUser?: AuthUser): Promise<EmployeeContract[]> {
    return (await this.getContracts(currentUser)).filter(contract => contract.employeeId === employeeId)
  }

  static previewDraft(input: ContractDraftInput, currentUser?: AuthUser): string
  static previewDraft(input: ContractDraftInput, currentUser: AuthUser | undefined, options: { detailed: true; sourceText?: string; sourceFileName?: string }): ContractDraftPreview | null
  static previewDraft(input: ContractDraftInput, currentUser?: AuthUser, options?: { detailed?: boolean; sourceText?: string; sourceFileName?: string }) {
    const previewState = createDraftPreviewState(input, currentUser, options)
    if (options?.detailed) return previewState
    return previewState?.renderedContent || ''
  }

  static getRequiredContractFields(input: ContractDraftInput, currentUser?: AuthUser) {
    const employee = getEmployee(input.employeeId, currentUser)
    if (!employee) return ['Nhan su']

    const fields = {
      full_name: employee.full_name,
      phone: employee.phone,
      email: employee.email,
      address: employee.address || input.customFields?.['employee.address'],
      cccd: employee.cccd || input.customFields?.['employee.cccd'],
      date_of_birth: employee.date_of_birth || input.customFields?.['employee.date_of_birth'],
      bank_name: input.customFields?.['employee.bank_name'],
      bank_account: input.customFields?.['employee.bank_account'],
      signer_name: input.customFields?.['company.signer_name'],
      signer_title: input.customFields?.['company.signer_title'],
      contract_code: input.customFields?.['contract.code'],
    }

    return Object.entries(fields)
      .filter(([, value]) => !value || !String(value).trim())
      .map(([key]) => key)
  }

  static async createContract(input: { employeeId: string; templateId: string; startDate: string; endDate?: string; customFields?: Record<string, string> }, currentUser: AuthUser): Promise<EmployeeContract | null> {
    if (!HR_ROLES.has(currentUser.role)) return null
    const template = this.getTemplates().find(item => item.id === input.templateId)
    const employee = getEmployee(input.employeeId, currentUser)
    if (!template || !employee) return null
    const contract: EmployeeContract = {
      id: makeId('ctr'),
      templateId: template.id,
      employeeId: employee.id,
      storeId: employee.store_id,
      positionId: employee.position_id,
      status: 'draft',
      version: `${template.version}.${Date.now()}`,
      startDate: input.startDate,
      endDate: input.endDate,
      customFields: input.customFields || {},
      renderedContent: '',
      signatures: [],
      auditLogs: [],
      snapshotHistory: [],
    }
    contract.renderedContent = renderContractPreview(template, contract, employee)
    contract.auditLogs = [this.makeLog('create', currentUser, 'Tao hop dong nhap theo mau hop dong lao dong')]
    contract.snapshotHistory = [{ id: makeId('snap'), version: contract.version, createdAt: now(), note: 'Tao hop dong nhap theo mau chuan VN', content: contract.renderedContent }]
    await this.persistContract(contract)
    return contract
  }

  static async createContractsBulk(input: ContractBulkInput, currentUser: AuthUser) {
    if (!HR_ROLES.has(currentUser.role)) return { created: [], blocked: [] as Array<{ employeeId: string; employeeName: string; missingFields: string[] }> }

    const created: EmployeeContract[] = []
    const blocked: Array<{ employeeId: string; employeeName: string; missingFields: string[] }> = []

    for (const employeeId of input.employeeIds) {
      const employee = getEmployee(employeeId, currentUser)
      if (!employee) continue

      const mergedFields = {
        ...(input.customFields || {}),
        ...(input.perEmployeeFields?.[employeeId] || {}),
      }

      const missingFields = this.getRequiredContractFields({
        employeeId,
        templateId: input.templateId,
        startDate: input.startDate,
        endDate: input.endDate,
        customFields: mergedFields,
      }, currentUser)

      if (missingFields.length > 0) {
        blocked.push({
          employeeId,
          employeeName: employee.full_name,
          missingFields,
        })
        continue
      }

      const contract = await this.createContract({
        employeeId,
        templateId: input.templateId,
        startDate: input.startDate,
        endDate: input.endDate,
        customFields: mergedFields,
      }, currentUser)

      if (!contract) continue

      if (input.sendNow) {
        const sent = await this.sendContract(contract.id, currentUser)
        if (sent) created.push(sent)
        else created.push(contract)
      } else {
        created.push(contract)
      }
    }

    return { created, blocked }
  }

  static async sendContract(id: string, currentUser: AuthUser): Promise<EmployeeContract | null> {
    if (!HR_ROLES.has(currentUser.role)) return null
    const updated = await this.updateContract(id, currentUser, contract => ({
      ...contract,
      status: 'pending_employee_sign',
      sentAt: now(),
      auditLogs: [this.makeLog('send', currentUser, 'Gui hop dong cho nhan su ky tren app'), ...contract.auditLogs],
    }))

    if (updated) {
      const employee = EmployeeService.getEmployeeById(updated.employeeId, currentUser)
      if (employee) {
        OnboardingPolicyService.handleContractSent({
          employee,
          contractId: updated.id,
          actor: currentUser,
        })
      }
    }

    return updated
  }

  static async signAsEmployee(id: string, currentUser: AuthUser): Promise<EmployeeContract | null> {
    return this.updateContract(id, currentUser, contract => {
      if (contract.employeeId !== currentUser.id || contract.status !== 'pending_employee_sign') return contract
      const signature = this.makeSignature(currentUser, 'employee', 'Signed in Homies app mock flow')
      return {
        ...contract,
        status: 'pending_hr_sign',
        signatures: [...contract.signatures.filter(item => item.role !== 'employee'), signature],
        auditLogs: [this.makeLog('employee_sign', currentUser, 'Nhan su da ky tren app'), ...contract.auditLogs],
      }
    })
  }

  static async countersign(id: string, currentUser: AuthUser): Promise<EmployeeContract | null> {
    if (!HR_ROLES.has(currentUser.role)) return null
    const updated = await this.updateContract(id, currentUser, contract => {
      if (!['pending_hr_sign', 'signed_by_employee'].includes(contract.status)) return contract
      const signature = this.makeSignature(currentUser, 'hr', 'HR countersign in Homies app mock flow')
      return {
        ...contract,
        status: 'active',
        activatedAt: now(),
        signatures: [...contract.signatures.filter(item => item.role !== 'hr'), signature],
        auditLogs: [this.makeLog('hr_countersign', currentUser, 'HR countersign va kich hoat hop dong'), ...contract.auditLogs],
      }
    })

    if (updated) {
      const employee = EmployeeService.getEmployeeById(updated.employeeId, currentUser)
      if (employee) {
        OnboardingPolicyService.handleContractActivated({
          employee,
          contractId: updated.id,
          actor: currentUser,
        })
      }
    }

    return updated
  }

  static async getStats(currentUser?: AuthUser) {
    const contracts = await this.getContracts(currentUser)
    return {
      total: contracts.length,
      pendingEmployee: contracts.filter(item => item.status === 'pending_employee_sign').length,
      pendingHr: contracts.filter(item => item.status === 'pending_hr_sign').length,
      active: contracts.filter(item => item.status === 'active').length,
    }
  }

  static getTrackingSummary(contracts: EmployeeContract[]): ContractTrackingSummary {
    return {
      total: contracts.length,
      draft: contracts.filter(item => item.status === 'draft').length,
      pendingSignature: contracts.filter(item => ['pending_employee_sign', 'signed_by_employee', 'pending_hr_sign'].includes(item.status)).length,
      active: contracts.filter(item => item.status === 'active').length,
      expiringSoon: contracts.filter(item => item.status === 'active' && item.endDate && daysBetween(item.endDate) >= 0 && daysBetween(item.endDate) <= 30).length,
      renewalDue: contracts.filter(item => item.status === 'active' && item.endDate && daysBetween(item.endDate) >= 0 && daysBetween(item.endDate) <= 15).length,
    }
  }

  static async getRenewalTracking(id: string, currentUser?: AuthUser): Promise<ContractRenewalTracking | null> {
    const current = await this.getContractById(id, currentUser)
    if (!current) return null

    const rootContractCode = getRootContractCode(current)
    const relatedContracts = (await this.getContractsForEmployee(current.employeeId, currentUser))
      .filter(item => isSameRenewalChain(item, rootContractCode))
      .sort((a, b) => {
        const left = a.activatedAt || a.sentAt || a.startDate
        const right = b.activatedAt || b.sentAt || b.startDate
        return right.localeCompare(left)
      })

    const daysToEnd = current.endDate ? daysBetween(current.endDate) : null
    const newerLinkedContracts = relatedContracts.filter(item => item.id !== current.id && getContractCode(item) !== rootContractCode)
    const waitingEmployeeSign = relatedContracts.filter(item => item.status === 'pending_employee_sign').length
    const waitingHrSign = relatedContracts.filter(item => item.status === 'pending_hr_sign').length
    const overdueProcessing = relatedContracts.filter(item => {
      if (!['pending_employee_sign', 'signed_by_employee', 'pending_hr_sign'].includes(item.status)) return false
      const anchorDate = item.sentAt || item.startDate
      return daysBetween(anchorDate) < -3
    }).length
    const expiringSoon = current.status === 'active' && daysToEnd !== null && daysToEnd >= 0 && daysToEnd <= 30
    const needsRenewalDraft =
      current.status === 'active'
      && daysToEnd !== null
      && daysToEnd <= 15
      && newerLinkedContracts.every(item => ['void', 'rejected'].includes(item.status))

    let nextAction: ContractRenewalTracking['nextAction']
    if (overdueProcessing > 0) {
      nextAction = {
        label: 'Đang trễ xử lý',
        detail: `${overdueProcessing} hợp đồng trong chuỗi đang chờ ký hoặc chờ HR xử lý quá 3 ngày.`,
        tone: 'bg-rose-50 text-rose-700 border-rose-200',
      }
    } else if (waitingHrSign > 0) {
      nextAction = {
        label: 'Chờ HR ký',
        detail: `${waitingHrSign} hợp đồng đã có xác nhận của nhân sự và đang chờ HR kích hoạt.`,
        tone: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      }
    } else if (waitingEmployeeSign > 0) {
      nextAction = {
        label: 'Chờ nhân sự ký',
        detail: `${waitingEmployeeSign} hợp đồng đã gửi và đang chờ nhân sự xác nhận trên app.`,
        tone: 'bg-amber-50 text-amber-700 border-amber-200',
      }
    } else if (needsRenewalDraft) {
      nextAction = {
        label: 'Cần tạo bản mới',
        detail: `Hợp đồng còn ${daysToEnd} ngày là hết hạn và chưa có bản tái ký mới trong chuỗi.`,
        tone: 'bg-orange-50 text-orange-700 border-orange-200',
      }
    } else if (expiringSoon) {
      nextAction = {
        label: 'Sắp hết hạn',
        detail: `Hợp đồng còn ${daysToEnd} ngày là hết hạn. Đã có bản mới hoặc cần theo dõi sát để không đứt chuỗi.`,
        tone: 'bg-sky-50 text-sky-700 border-sky-200',
      }
    } else {
      nextAction = {
        label: 'Đang ổn',
        detail: 'Chuỗi hợp đồng này hiện chưa có điểm nghẽn cần xử lý ngay.',
        tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      }
    }

    return {
      rootContractCode,
      currentContractCode: getContractCode(current),
      daysToEnd,
      summary: {
        expiringSoon,
        needsRenewalDraft,
        waitingEmployeeSign,
        waitingHrSign,
        overdueProcessing,
        newerVersionCount: newerLinkedContracts.length,
      },
      nextAction,
      linkedContracts: relatedContracts.map(item => ({
        id: item.id,
        code: getContractCode(item),
        version: item.version,
        status: item.status,
        startDate: item.startDate,
        endDate: item.endDate,
      })),
    }
  }

  static async updateDraftContract(
    id: string,
    input: Partial<Pick<EmployeeContract, 'startDate' | 'endDate'>> & { customFields?: Record<string, string> },
    currentUser: AuthUser,
  ): Promise<EmployeeContract | null> {
    if (!HR_ROLES.has(currentUser.role)) return null
    return this.updateContract(id, currentUser, (contract) => {
      if (!['draft', 'pending_employee_sign'].includes(contract.status)) return contract
      const template = this.getTemplates().find(item => item.id === contract.templateId)
      const employee = getEmployee(contract.employeeId, currentUser)
      if (!template || !employee) return contract

      const next: EmployeeContract = {
        ...contract,
        startDate: input.startDate || contract.startDate,
        endDate: input.endDate !== undefined ? input.endDate : contract.endDate,
        customFields: {
          ...contract.customFields,
          ...(input.customFields || {}),
        },
      }

      next.renderedContent = renderContractPreview(template, next, employee)
      next.version = `${template.version}.${Date.now()}`
      next.snapshotHistory = [
        ...contract.snapshotHistory,
        {
          id: makeId('snap'),
          version: next.version,
          createdAt: now(),
          note: 'Cap nhat hop dong va tao snapshot moi',
          content: next.renderedContent,
        },
      ]
      next.auditLogs = [this.makeLog('edit', currentUser, 'Cap nhat noi dung hop dong'), ...contract.auditLogs]
      return next
    })
  }

  static async renewContract(
    id: string,
    input: { startDate: string; endDate?: string; note?: string; sendNow?: boolean },
    currentUser: AuthUser,
  ): Promise<EmployeeContract | null> {
    if (!HR_ROLES.has(currentUser.role)) return null
    const base = await this.getContractById(id, currentUser)
    if (!base) return null

    const template = this.getTemplates().find(item => item.id === base.templateId)
    if (!template) return null

    const renewed = await this.createContract({
      employeeId: base.employeeId,
      templateId: base.templateId,
      startDate: input.startDate,
      endDate: input.endDate,
      customFields: {
        ...base.customFields,
        'contract.parent_contract_code': base.customFields['contract.code'] || base.id,
        'policy.contract_note': input.note || `Tai ky tu hop dong ${base.customFields['contract.code'] || base.id}`,
      },
    }, currentUser)

    if (!renewed) return null

    await this.updateContract(base.id, currentUser, contract => ({
      ...contract,
      status: contract.status === 'active' ? 'superseded' : contract.status,
      auditLogs: [this.makeLog('renew_linked', currentUser, `Lien ket hop dong tai ky ${renewed.id}`), ...contract.auditLogs],
    }))

    const linked = await this.updateContract(renewed.id, currentUser, contract => ({
      ...contract,
      auditLogs: [this.makeLog('renew', currentUser, `Tai ky tu hop dong goc ${base.customFields['contract.code'] || base.id}`), ...contract.auditLogs],
    }))

    if (!linked) return renewed
    if (input.sendNow) {
      return (await this.sendContract(linked.id, currentUser)) || linked
    }
    return linked
  }

  static exportContracts(contracts: EmployeeContract[], currentUser?: AuthUser, options?: ContractExportOptions) {
    const visibleContracts = contracts.filter(contract => canAccessContract(contract, currentUser))

    return visibleContracts
      .map(contract => {
        const employee = getEmployee(contract.employeeId, currentUser)
        return {
          contract_id: contract.id,
          contract_code: contract.customFields['contract.code'] || contract.id,
          employee_code: employee?.employee_code || '',
          employee_name: employee?.full_name || contract.employeeId,
          employee_email: employee?.email || '',
          template_id: contract.templateId,
          contract_type: contract.customFields['contract.type'] || '',
          status: contract.status,
          status_label: CONTRACT_STATUS_META[contract.status].label,
          start_date: contract.startDate,
          end_date: contract.endDate || '',
          store_id: contract.storeId,
          position_id: contract.positionId,
          signer_name: contract.customFields['company.signer_name'] || '',
          signer_title: contract.customFields['company.signer_title'] || '',
          bank_name: contract.customFields['employee.bank_name'] || '',
          manager_name: contract.customFields['store.manager_name'] || '',
          salary_allowances: contract.customFields['salary.allowances'] || '',
          working_schedule: contract.customFields['job.working_schedule'] || '',
          main_duties: contract.customFields['job.main_duties'] || '',
          contract_note: contract.customFields['policy.contract_note'] || '',
          version: contract.version,
          export_scope: options?.statusLabel || 'Tất cả trạng thái',
          exported_at: new Date().toISOString(),
        }
      })
  }

  static guessImportMapping(headers: string[]): ContractImportMapping {
    const normalized = headers.reduce<Record<string, string>>((acc, header) => {
      acc[normalizeHeader(header)] = header
      return acc
    }, {})

    const find = (...keys: string[]) => keys.map(key => normalized[key]).find(Boolean)

    return {
      employee_code: find('employee_code', 'ma_nhan_su', 'ma_nv'),
      employee_email: find('employee_email', 'email', 'nhan_su_email'),
      employee_name: find('employee_name', 'ten_nhan_su', 'ho_ten', 'ten_nv'),
      template_id: find('template_id', 'mau_hop_dong', 'template', 'ten_mau_hop_dong', 'loai_mau'),
      start_date: find('start_date', 'ngay_hieu_luc', 'ngay_bat_dau'),
      end_date: find('end_date', 'ngay_ket_thuc'),
      contract_type: find('contract_type', 'loai_hop_dong'),
      contract_code: find('contract_code', 'so_hop_dong', 'ma_hop_dong'),
      signer_name: find('signer_name', 'nguoi_ky', 'company_signer_name'),
      signer_title: find('signer_title', 'chuc_danh_nguoi_ky', 'company_signer_title'),
      bank_name: find('bank_name', 'ngan_hang', 'employee_bank_name'),
      manager_name: find('manager_name', 'quan_ly_truc_tiep'),
      salary_allowances: find('salary_allowances', 'phu_cap', 'tro_cap'),
      working_schedule: find('working_schedule', 'lich_lam_viec', 'khung_gio'),
      main_duties: find('main_duties', 'mo_ta_cong_viec', 'nhiem_vu_chinh'),
      contract_note: find('contract_note', 'ghi_chu', 'phu_luc'),
    }
  }

  static async importContracts(
    rows: ContractImportRow[],
    mapping: ContractImportMapping,
    currentUser: AuthUser,
    options?: { sendNow?: boolean },
  ) {
    if (!HR_ROLES.has(currentUser.role)) return { created: [], blocked: [] as Array<{ row: number; reason: string }> }

    const employees = EmployeeService.getEmployees(currentUser)
    const templates = this.getTemplates()
    const created: EmployeeContract[] = []
    const blocked: Array<{ row: number; reason: string }> = []

    for (const [index, row] of rows.entries()) {
      const employeeCode = readMappedValue(row, mapping.employee_code)
      const employeeEmail = readMappedValue(row, mapping.employee_email)
      const employeeName = readMappedValue(row, mapping.employee_name)
      const employee = employees.find(item => (
        (employeeCode && item.employee_code === employeeCode)
        || (employeeEmail && item.email === employeeEmail)
        || (employeeName && normalizeText(item.full_name) === normalizeText(employeeName))
      ))
      if (!employee) {
        blocked.push({ row: index + 2, reason: 'Không tìm thấy nhân sự theo mã, email hoặc họ tên' })
        continue
      }

      const templateRaw = readMappedValue(row, mapping.template_id)
      const template = templates.find(item => (
        item.id === templateRaw
        || normalizeText(item.name) === normalizeText(templateRaw)
      )) || templates[0]
      if (!template) {
        blocked.push({ row: index + 2, reason: `Mẫu hợp đồng không hợp lệ: ${templateRaw || 'trống'}` })
        continue
      }

      const startDate = readMappedValue(row, mapping.start_date) || new Date().toISOString().slice(0, 10)
      const endDate = readMappedValue(row, mapping.end_date) || undefined
      const contract = await this.createContract({
        employeeId: employee.id,
        templateId: template.id,
        startDate,
        endDate,
        customFields: {
          'contract.type': readMappedValue(row, mapping.contract_type),
          'contract.code': readMappedValue(row, mapping.contract_code) || `IMPORTED/${employee.employee_code || employee.id}`,
          'company.signer_name': readMappedValue(row, mapping.signer_name),
          'company.signer_title': readMappedValue(row, mapping.signer_title),
          'employee.bank_name': readMappedValue(row, mapping.bank_name),
          'store.manager_name': readMappedValue(row, mapping.manager_name),
          'salary.allowances': readMappedValue(row, mapping.salary_allowances),
          'job.working_schedule': readMappedValue(row, mapping.working_schedule),
          'job.main_duties': readMappedValue(row, mapping.main_duties),
          'policy.contract_note': readMappedValue(row, mapping.contract_note) || 'Hợp đồng được import từ file',
        },
      }, currentUser)

      if (!contract) {
        blocked.push({ row: index + 2, reason: 'Không tạo được hợp đồng tự động' })
        continue
      }

      created.push(options?.sendNow ? ((await this.sendContract(contract.id, currentUser)) || contract) : contract)
    }

    return { created, blocked }
  }

  private static async getContractsDb(): Promise<EmployeeContract[]> {
    if (this.shouldUseBackend()) {
      try {
        return await this.getContractsBackend()
      } catch (error) {
        console.warn('[ContractService] Supabase fallback to localStorage', error)
      }
    }
    return this.getContractsLocal()
  }

  private static shouldUseBackend() {
    return typeof window !== 'undefined' && isSupabaseConfigured
  }

  private static getContractsLocal(): EmployeeContract[] {
    if (typeof window === 'undefined') return seedContracts()
    const stored = window.localStorage.getItem(CONTRACT_KEY)
    if (!stored) {
      const seed = seedContracts()
      window.localStorage.setItem(CONTRACT_KEY, JSON.stringify(seed))
      return seed
    }
    try {
      return JSON.parse(stored) as EmployeeContract[]
    } catch (error) {
      console.warn(`[ContractService] Failed to parse ${CONTRACT_KEY}. Re-seeding contracts from defaults.`, error)
      window.localStorage.removeItem(CONTRACT_KEY)
      return seedContracts()
    }
  }

  private static saveContractsLocal(data: EmployeeContract[]) {
    if (typeof window !== 'undefined') window.localStorage.setItem(CONTRACT_KEY, JSON.stringify(data))
  }

  private static async getContractsBackend(): Promise<EmployeeContract[]> {
    await this.ensureTemplateSeed()

    const { data: contractRows, error: contractError } = await supabase
      .from('employee_contracts')
      .select('*')
      .order('created_at', { ascending: false })

    if (contractError) throw contractError

    if (!contractRows || contractRows.length === 0) {
      const seeds = seedContracts()
      for (const contract of seeds) {
        await this.persistContractBackend(contract)
      }
      return seeds
    }

    const contractIds = contractRows.map(row => row.id)
    const [signatureResult, auditResult, snapshotResult] = await Promise.all([
      supabase.from('contract_signatures').select('*').in('contract_id', contractIds).order('signed_at', { ascending: true }),
      supabase.from('contract_audit_logs').select('*').in('contract_id', contractIds).order('at', { ascending: false }),
      supabase.from('contract_snapshots').select('*').in('contract_id', contractIds).order('created_at', { ascending: true }),
    ])

    if (signatureResult.error) throw signatureResult.error
    if (auditResult.error) throw auditResult.error
    if (snapshotResult.error) throw snapshotResult.error

    return contractRows.map(row => toEmployeeContract(
      row as ContractRow,
      (signatureResult.data || []) as ContractSignatureRow[],
      (auditResult.data || []) as ContractAuditLogRow[],
      (snapshotResult.data || []) as ContractSnapshotRow[],
    ))
  }

  private static async ensureTemplateSeed() {
    const templates = defaultTemplates()
    const { error } = await supabase.from('contract_templates').upsert(templates.map(toTemplateRow), { onConflict: 'id' })
    if (error) throw error
  }

  private static async persistContract(contract: EmployeeContract) {
    if (this.shouldUseBackend()) {
      try {
        await this.persistContractBackend(contract)
        return
      } catch (error) {
        console.warn('[ContractService] Could not persist contract to Supabase, using localStorage fallback', error)
      }
    }

    const db = this.getContractsLocal()
    const index = db.findIndex(item => item.id === contract.id)
    if (index === -1) db.unshift(contract)
    else db[index] = contract
    this.saveContractsLocal(db)
  }

  private static async persistContractBackend(contract: EmployeeContract) {
    await this.ensureTemplateSeed()

    const { error: contractError } = await supabase
      .from('employee_contracts')
      .upsert([toContractRow(contract)], { onConflict: 'id' })
    if (contractError) throw contractError

    const [signatureDelete, auditDelete, snapshotDelete] = await Promise.all([
      supabase.from('contract_signatures').delete().eq('contract_id', contract.id),
      supabase.from('contract_audit_logs').delete().eq('contract_id', contract.id),
      supabase.from('contract_snapshots').delete().eq('contract_id', contract.id),
    ])
    if (signatureDelete.error) throw signatureDelete.error
    if (auditDelete.error) throw auditDelete.error
    if (snapshotDelete.error) throw snapshotDelete.error

    if (contract.signatures.length > 0) {
      const { error } = await supabase.from('contract_signatures').insert(toSignatureRows(contract))
      if (error) throw error
    }
    if (contract.auditLogs.length > 0) {
      const { error } = await supabase.from('contract_audit_logs').insert(toAuditLogRows(contract))
      if (error) throw error
    }
    if (contract.snapshotHistory.length > 0) {
      const { error } = await supabase.from('contract_snapshots').insert(toSnapshotRows(contract))
      if (error) throw error
    }
  }

  private static async updateContract(id: string, currentUser: AuthUser, updater: (contract: EmployeeContract) => EmployeeContract): Promise<EmployeeContract | null> {
    const db = await this.getContractsDb()
    const index = db.findIndex(item => item.id === id)
    if (index === -1 || !canAccessContract(db[index], currentUser)) return null
    const next = updater(db[index])
    db[index] = next
    await this.persistContract(next)
    return next
  }

  private static makeLog(action: string, actor: AuthUser, note: string): ContractAuditLog {
    return { id: makeId('log'), action, actorId: actor.id, actorName: actor.full_name, at: now(), note }
  }

  private static makeSignature(actor: AuthUser, role: ContractSignature['role'], evidence: string): ContractSignature {
    return {
      id: makeId('sig'),
      actorId: actor.id,
      actorName: actor.full_name,
      role,
      signedAt: now(),
      method: 'app_confirm',
      evidence,
    }
  }
}
