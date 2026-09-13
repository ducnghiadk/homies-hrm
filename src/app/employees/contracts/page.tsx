'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { readSheet } from 'read-excel-file/browser'
import writeExcelFile from 'write-excel-file/browser'
import { BadgeCheck, Clock3, Download, FileSpreadsheet, FileText, Layers3, Plus, RefreshCcw, Send, ShieldCheck, Upload, Users } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { getPositionById, getStoreById } from '@/lib/mock-data'
import {
  ContractService,
  CONTRACT_STATUS_META,
  type ContractImportMapping,
  type ContractImportRow,
  type ContractStatus,
  type EmployeeContract,
} from '@/lib/services/contract-service'
import type { ContractPlaceholderStatus } from '@/lib/services/contract-template-placeholder'
import { EmployeeService } from '@/lib/services/employee-service'
import { useAuthStore } from '@/store/auth-store'
import { ChecklistChip, Field, FieldStatusTag, SectionCard, StatChip, Tag } from './_components'

type BulkMissingRow = {
  employeeId: string
  employeeName: string
  missingFields: string[]
}

type ImportPreviewState = {
  headers: string[]
  rows: ContractImportRow[]
  mapping: ContractImportMapping
}

const DEFAULT_START_DATE = new Date().toISOString().split('T')[0]
const IMPORT_FIELDS: Array<{ key: keyof ContractImportMapping; label: string }> = [
  { key: 'employee_code', label: 'Mã nhân sự' },
  { key: 'employee_email', label: 'Email nhân sự' },
  { key: 'template_id', label: 'Mẫu hợp đồng' },
  { key: 'start_date', label: 'Ngày hiệu lực' },
  { key: 'end_date', label: 'Ngày kết thúc' },
  { key: 'contract_type', label: 'Loại hợp đồng' },
  { key: 'contract_code', label: 'Số hợp đồng' },
  { key: 'signer_name', label: 'Người ký' },
  { key: 'signer_title', label: 'Chức danh người ký' },
  { key: 'bank_name', label: 'Ngân hàng' },
  { key: 'manager_name', label: 'Quản lý trực tiếp' },
  { key: 'salary_allowances', label: 'Phụ cấp' },
  { key: 'working_schedule', label: 'Lịch làm việc' },
  { key: 'main_duties', label: 'Nhiệm vụ chính' },
  { key: 'contract_note', label: 'Ghi chú' },
]

async function downloadWorkbook(rows: Record<string, unknown>[], fileName: string) {
  const headers = rows.length ? Object.keys(rows[0]) : []
  const sheetData: string[][] = []

  if (headers.length) {
    sheetData.push(headers)
    rows.forEach((row) => {
      sheetData.push(headers.map((header) => String(row[header] ?? '')))
    })
  }

  await writeExcelFile(sheetData, { sheet: 'Contracts' }).toFile(fileName)
}

async function readImportRows(file: File) {
  const sheetData = await readSheet(file)
  const [headerRow = [], ...dataRows] = sheetData
  const headers = headerRow.map((value) => String(value ?? '').trim())

  return dataRows.map((row) => {
    const record: Record<string, string> = {}
    headers.forEach((header, index) => {
      if (!header) return
      record[header] = String(row[index] ?? '').trim()
    })
    return record
  })
}

async function readDocxAsText(file: File) {
  const buffer = await file.arrayBuffer()
  const text = new TextDecoder().decode(new Uint8Array(buffer))
  return text.replace(/\0/g, ' ')
}

export default function EmployeeContractsPage() {
  const router = useRouter()
  const { user, isAuthenticated, hasHydrated } = useAuthStore()
  const [refreshKey, setRefreshKey] = useState(0)
  const [message, setMessage] = useState<string | null>(null)
  const [templateId, setTemplateId] = useState('')
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([])
  const [startDate, setStartDate] = useState(DEFAULT_START_DATE)
  const [endDate, setEndDate] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'all' | ContractStatus>('all')
  const [contracts, setContracts] = useState<EmployeeContract[]>([])
  const [stats, setStats] = useState({ total: 0, pendingEmployee: 0, pendingHr: 0, active: 0 })
  const [isLoadingContracts, setIsLoadingContracts] = useState(true)
  const [bulkMissingRows, setBulkMissingRows] = useState<BulkMissingRow[]>([])
  const [companySignerName, setCompanySignerName] = useState('Hoàng Thị Yến')
  const [companySignerTitle, setCompanySignerTitle] = useState('Trưởng phòng Nhân sự')
  const [contractCodePrefix, setContractCodePrefix] = useState('HDLD/HOMIES')
  const [contractType, setContractType] = useState('xac_dinh_thoi_han')
  const [bankName, setBankName] = useState('Vietcombank')
  const [managerName, setManagerName] = useState('')
  const [salaryAllowances, setSalaryAllowances] = useState('Theo chính sách phụ cấp đã duyệt')
  const [workingSchedule, setWorkingSchedule] = useState('Theo lịch phân ca trên app Homies')
  const [mainDuties, setMainDuties] = useState('Thực hiện công việc theo mô tả vị trí, đảm bảo vận hành và bàn giao đúng quy trình.')
  const [contractNote, setContractNote] = useState('Không có ghi chú bổ sung.')
  const [importPreview, setImportPreview] = useState<ImportPreviewState | null>(null)
  const [isImporting, setIsImporting] = useState(false)
  const [uploadedTemplateName, setUploadedTemplateName] = useState('')
  const [uploadedTemplateText, setUploadedTemplateText] = useState('')
  const [fieldFilter, setFieldFilter] = useState<'all' | ContractPlaceholderStatus>('all')

  useEffect(() => {
    if (hasHydrated && !isAuthenticated) router.push('/login?redirect=/employees/contracts')
  }, [hasHydrated, isAuthenticated, router])

  const templates = ContractService.getTemplates()
  const employees = useMemo(
    () => (user ? EmployeeService.getEmployees(user).filter((employee) => employee.status !== 'resigned') : []),
    [user],
  )
  const canManage = user ? ['ceo', 'hr_admin'].includes(user.role) : false
  const preselectedEmployeeId = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('employeeId') || ''
    : ''
  const effectiveSelectedEmployeeIds = selectedEmployeeIds.length
    ? selectedEmployeeIds
    : preselectedEmployeeId && employees.some((employee) => employee.id === preselectedEmployeeId)
      ? [preselectedEmployeeId]
      : []
  const activeTemplateId = templateId || templates[0]?.id || ''
  const currentTemplate = templates.find((template) => template.id === activeTemplateId) || templates[0]
  const activeEmployeeId = effectiveSelectedEmployeeIds[0] || (user?.role === 'employee' ? user.id : employees[0]?.id || '')
  const currentEmployee = employees.find((employee) => employee.id === activeEmployeeId) || EmployeeService.getEmployeeById(activeEmployeeId, user ?? undefined)
  const currentEmployeePosition = currentEmployee ? getPositionById(currentEmployee.position_id)?.name || 'Chưa phân bổ chức danh' : ''
  const currentEmployeeStore = currentEmployee ? getStoreById(currentEmployee.store_id)?.name?.replace('Homies Milk Tea - ', '') || 'Chưa phân bổ chi nhánh' : ''

  const buildCustomFields = (employeeId?: string) => ({
    'company.signer_name': companySignerName,
    'company.signer_title': companySignerTitle,
    'contract.type': contractType,
    'contract.code': `${contractCodePrefix}/${employeeId || 'AUTO'}`,
    'employee.bank_name': bankName,
    'store.manager_name': managerName,
    'salary.allowances': salaryAllowances,
    'job.working_schedule': workingSchedule,
    'job.main_duties': mainDuties,
    'policy.contract_note': contractNote,
  })

  const previewState = currentEmployee && currentTemplate
    ? ContractService.previewDraft({
        employeeId: currentEmployee.id,
        templateId: currentTemplate.id,
        startDate,
        endDate: endDate || undefined,
        customFields: buildCustomFields(currentEmployee.id),
      }, user ?? undefined, {
        detailed: true,
        sourceText: uploadedTemplateText || undefined,
        sourceFileName: uploadedTemplateName || undefined,
      })
    : null

  const previewMissingFields = currentEmployee
    ? ContractService.getRequiredContractFields({
        employeeId: currentEmployee.id,
        templateId: activeTemplateId,
        startDate,
        endDate: endDate || undefined,
        customFields: buildCustomFields(currentEmployee.id),
      }, user ?? undefined)
    : []

  const filteredContracts = contracts.filter((contract) => selectedStatus === 'all' ? true : contract.status === selectedStatus)
  const trackingSummary = useMemo(() => ContractService.getTrackingSummary(contracts), [contracts])
  const primaryBulkDisabled = !effectiveSelectedEmployeeIds.length || !currentTemplate
  const priorityCount = trackingSummary.pendingSignature + trackingSummary.renewalDue
  const currentStatusLabel = selectedStatus === 'all' ? 'Tất cả trạng thái' : CONTRACT_STATUS_META[selectedStatus].label

  const filteredPlaceholderItems = fieldFilter === 'all'
    ? (previewState?.placeholderItems || [])
    : (previewState?.placeholderItems || []).filter((item) => item.status === fieldFilter)
  const sendBlocked = !previewState?.checklist.canSend

  const preview = previewState?.renderedContent || ''

  useEffect(() => {
    let cancelled = false
    if (!user) return

    void (async () => {
      setIsLoadingContracts(true)
      const [nextContracts, nextStats] = await Promise.all([
        ContractService.getContracts(user ?? undefined),
        ContractService.getStats(user ?? undefined),
      ])

      if (cancelled) return
      setContracts(nextContracts)
      setStats(nextStats)
      setIsLoadingContracts(false)
    })()

    return () => {
      cancelled = true
    }
  }, [refreshKey, user])

  const toggleEmployeeSelection = (employeeId: string) => {
    setSelectedEmployeeIds((current) => (
      current.includes(employeeId)
        ? current.filter((id) => id !== employeeId)
        : [...current, employeeId]
    ))
  }

  const handleCreateBulkContracts = async (sendNow: boolean) => {
    if (!user || !effectiveSelectedEmployeeIds.length || !currentTemplate) return
    if (sendNow && sendBlocked) {
      setMessage('Chưa thể gửi ký. Hãy soát lại checklist field vì mẫu hoặc hồ sơ còn lỗi.')
      return
    }

    const result = await ContractService.createContractsBulk({
      employeeIds: effectiveSelectedEmployeeIds,
      templateId: currentTemplate.id,
      startDate,
      endDate: endDate || undefined,
      customFields: buildCustomFields(),
      perEmployeeFields: Object.fromEntries(effectiveSelectedEmployeeIds.map((employeeId) => [
        employeeId,
        buildCustomFields(employeeId),
      ])),
      sendNow,
    }, user)

    setBulkMissingRows(result.blocked)

    if (result.created.length === 0) {
      setMessage('Chưa tạo được hợp đồng nào. Hồ sơ nhân sự đang thiếu trường bắt buộc để ký hợp đồng.')
      return
    }

    setMessage(
      sendNow
        ? `Đã tạo và gửi ${result.created.length} hợp đồng. ${result.blocked.length ? `${result.blocked.length} nhân sự còn thiếu thông tin.` : ''}`
        : `Đã tạo ${result.created.length} hợp đồng nháp. ${result.blocked.length ? `${result.blocked.length} nhân sự còn thiếu thông tin.` : ''}`
    )
    setRefreshKey((current) => current + 1)
  }

  const handleContractAction = async (contractId: string, action: 'send' | 'renew') => {
    if (!user) return

    if (action === 'send') {
      const result = await ContractService.sendContract(contractId, user)
      if (!result) {
        setMessage('Không thực hiện được thao tác này.')
        return
      }
      setMessage('Đã gửi hợp đồng.')
      setRefreshKey((current) => current + 1)
      return
    }

    const contract = contracts.find((item) => item.id === contractId)
    if (!contract) return
    const renewed = await ContractService.renewContract(contractId, {
      startDate: contract.endDate || contract.startDate,
      endDate: contract.endDate ? new Date(new Date(contract.endDate).setMonth(new Date(contract.endDate).getMonth() + 6)).toISOString().slice(0, 10) : '',
      note: 'Tái ký từ màn danh sách hợp đồng',
      sendNow: false,
    }, user)
    if (!renewed) {
      setMessage('Chưa thể tạo hợp đồng tái ký.')
      return
    }
    setMessage('Đã tạo một hợp đồng tái ký mới từ hợp đồng đang chọn.')
    setRefreshKey((current) => current + 1)
  }

  const handleExportContracts = async () => {
    if (!user) return
    const rows = ContractService.exportContracts(filteredContracts, user, { statusLabel: currentStatusLabel })
    await downloadWorkbook(rows, `hop-dong-nhan-su-${new Date().toISOString().slice(0, 10)}.xlsx`)
    setMessage(`Đã xuất ${rows.length} hợp đồng theo bộ lọc ${currentStatusLabel.toLowerCase()}.`)
  }

  const handleImportFile = async (file: File) => {
    const rows = (await readImportRows(file)) as ContractImportRow[]
    const headers = rows.length ? Object.keys(rows[0]) : []
    const mapping = ContractService.guessImportMapping(headers)
    setImportPreview({ headers, rows, mapping })
    setMessage(`Đã đọc ${rows.length} dòng từ file import. Hãy kiểm tra mapping trước khi nhập.`)
  }

  const handleTemplateUpload = async (file: File) => {
    const sourceText = await readDocxAsText(file)
    setUploadedTemplateName(file.name)
    setUploadedTemplateText(sourceText)
    setFieldFilter('all')
    setMessage(`Đã nạp mẫu ${file.name}. Hệ thống đang quét placeholder trước khi gửi ký.`)
  }

  const handleCommitImport = async (sendNow: boolean) => {
    if (!user || !importPreview) return
    setIsImporting(true)
    const result = await ContractService.importContracts(importPreview.rows, importPreview.mapping, user, { sendNow })
    setIsImporting(false)
    setMessage(
      `Đã nhập ${result.created.length} hợp đồng.${result.blocked.length ? ` ${result.blocked.length} dòng bị chặn.` : ''}`
    )
    setRefreshKey((current) => current + 1)
  }

  const handleClearUploadedTemplate = () => {
    setUploadedTemplateName('')
    setUploadedTemplateText('')
    setFieldFilter('all')
    setMessage('Đã quay về preview theo mẫu hợp đồng trong hệ thống.')
  }

  if (!hasHydrated || !user) {
    return (
      <AppShell title="Hợp đồng nhân sự">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent" />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell title="Hợp đồng nhân sự">
      <div className="space-y-5 pb-20">
        <SectionCard
          title="Thư viện hợp đồng lao động"
          description="Tạo, nhập, xuất, tái ký và theo dõi toàn bộ vòng đời hợp đồng trên cùng một màn."
        >
          <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
            <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Nhân sự / hợp đồng</p>
              <h2 className="mt-2 text-xl font-black text-slate-900">Theo người đang phụ trách, chốt việc cần ký trước, rồi mới đi vào công cụ.</h2>
              <p className="mt-2 max-w-3xl text-sm text-slate-500">
                Màn này gom hợp đồng theo đúng nhịp làm việc của HR: nhìn người đang theo dõi, preview nội dung, gửi ký, rồi quay lại hồ sơ khi cần chốt thêm thông tin.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-3xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-700">Ưu tiên hôm nay</p>
                <p className="mt-2 text-3xl font-black text-slate-900">{priorityCount}</p>
                <p className="mt-1 text-sm text-slate-600">hợp đồng đang chờ ký hoặc cần tái ký sớm.</p>
              </div>
              <div className="rounded-3xl border border-slate-100 bg-white p-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Tổng quan</p>
                <div className="mt-3 flex flex-wrap gap-2">
              <StatChip icon={<FileText size={14} />} label="Tổng hợp đồng" value={stats.total} />
              <StatChip icon={<Clock3 size={14} />} label="Chờ nhân sự ký" value={stats.pendingEmployee} tone="amber" />
              <StatChip icon={<ShieldCheck size={14} />} label="Chờ HR ký" value={stats.pendingHr} tone="indigo" />
              <StatChip icon={<BadgeCheck size={14} />} label="Đang hiệu lực" value={stats.active} tone="emerald" />
                </div>
              </div>
            </div>
          </div>
        </SectionCard>

        {message ? (
          <div className="rounded-2xl border border-primary-100 bg-primary-50 px-4 py-3 text-sm font-medium text-primary-700">
            {message}
          </div>
        ) : null}

        <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <SectionCard title="Theo dõi vòng đời" description="Nhìn nhanh nhóm cần chốt trước, rồi lọc thẳng xuống danh sách đang xem.">
            <div className="grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="grid grid-cols-2 gap-3">
                <StatChip icon={<Layers3 size={14} />} label="Nháp" value={trackingSummary.draft} tone="slate" />
                <StatChip icon={<Send size={14} />} label="Chờ ký" value={trackingSummary.pendingSignature} tone="amber" />
                <StatChip icon={<Clock3 size={14} />} label="Sắp hết hạn" value={trackingSummary.expiringSoon} tone="rose" />
                <StatChip icon={<RefreshCcw size={14} />} label="Cần tái ký" value={trackingSummary.renewalDue} tone="indigo" />
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Nhịp đang theo dõi</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{filteredContracts.length}</p>
                <p className="mt-1 text-sm text-slate-600">hợp đồng trong nhóm <span className="font-bold text-slate-900">{currentStatusLabel.toLowerCase()}</span>.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setSelectedStatus('pending_employee_sign')} className="inline-flex rounded-full border border-amber-200 bg-white px-3 py-1.5 text-xs font-bold text-amber-700">
                    Chờ nhân sự ký
                  </button>
                  <button type="button" onClick={() => setSelectedStatus('pending_hr_sign')} className="inline-flex rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-bold text-indigo-700">
                    Chờ HR ký
                  </button>
                  <button type="button" onClick={() => setSelectedStatus('active')} className="inline-flex rounded-full border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700">
                    Đang hiệu lực
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>

          <div className="grid gap-4">
            <SectionCard title="Công cụ nhập / xuất" description="Giữ import, export và file mẫu ở vai trò công cụ phụ để không tranh mất phần việc cần chốt.">
              <div className="grid gap-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">Xuất nhóm đang xem</p>
                  <p className="mt-1 text-sm text-slate-500">Dùng khi cần chia sẻ danh sách, rà soát trạng thái ký, hoặc gửi ngoài hệ thống.</p>
                  <button type="button" onClick={() => { void handleExportContracts() }} className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">
                    <Download size={16} />
                    Xuất danh sách hợp đồng
                  </button>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">Nhập từ file</p>
                  <p className="mt-1 text-sm text-slate-500">Đọc Excel hoặc CSV, đoán cột trước rồi mới cho nhập vào hệ thống.</p>
                  <label className="mt-3 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700">
                    <Upload size={16} />
                    Chọn file import
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void handleImportFile(file)
                      }}
                    />
                  </label>
                  <p className="mt-2 text-xs text-slate-400">Hỗ trợ Excel hoặc CSV. Hệ thống sẽ đoán cột theo tên phổ biến như mã nhân sự, email, ngày hiệu lực.</p>
                </div>

                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-900">Tải file mẫu</p>
                  <p className="mt-1 text-sm text-slate-500">Lấy đúng cấu trúc chuẩn trước khi làm import hàng loạt.</p>
                  <button
                    type="button"
                    onClick={() => {
                      void downloadWorkbook([{
                      employee_code: 'EMP001',
                      employee_email: 'nhansu@homies.vn',
                      template_id: templates[0]?.id || '',
                      start_date: DEFAULT_START_DATE,
                      end_date: '',
                      contract_type: 'xac_dinh_thoi_han',
                      contract_code: 'HDLD/HOMIES/EMP001',
                      signer_name: 'Hoàng Thị Yến',
                      signer_title: 'Trưởng phòng Nhân sự',
                      bank_name: 'Vietcombank',
                      manager_name: 'Nguyễn Văn Quản lý',
                      salary_allowances: 'Theo chính sách phụ cấp đã duyệt',
                      working_schedule: 'Theo lịch phân ca trên app Homies',
                      main_duties: 'Thực hiện công việc theo mô tả vị trí',
                      contract_note: 'Không có ghi chú bổ sung',
                    }], 'mau-import-hop-dong.xlsx')
                    }}
                    className="mt-3 inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700"
                  >
                    <FileSpreadsheet size={16} />
                    Tải file mẫu
                  </button>
                </div>
              </div>
            </SectionCard>
          </div>
        </section>

        {importPreview ? (
          <SectionCard title="Kiểm tra mapping trước khi nhập" description="Nếu cột đoán sai, bạn có thể đổi lại ngay tại đây trước khi bấm nhập.">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {IMPORT_FIELDS.map((field) => (
                  <Field key={field.key} label={field.label}>
                    <select
                      value={importPreview.mapping[field.key] || ''}
                      onChange={(event) => setImportPreview((current) => current ? {
                        ...current,
                        mapping: { ...current.mapping, [field.key]: event.target.value || undefined },
                      } : current)}
                      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none"
                    >
                      <option value="">Không dùng cột này</option>
                      {importPreview.headers.map((header) => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </Field>
                ))}
              </div>
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-900">Xem trước dữ liệu</p>
                <p className="mt-1 text-xs text-slate-500">{importPreview.rows.length} dòng sẽ được xử lý.</p>
                <div className="mt-4 max-h-[320px] overflow-auto rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(importPreview.rows.slice(0, 3), null, 2)}</pre>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCommitImport(false)}
                    disabled={isImporting}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 disabled:opacity-60"
                  >
                    <Plus size={16} />
                    Nhập nháp
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCommitImport(true)}
                    disabled={isImporting}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary-600 px-4 text-sm font-semibold text-white disabled:opacity-60"
                  >
                    <Send size={16} />
                    Nhập và gửi ký
                  </button>
                </div>
              </div>
            </div>
          </SectionCard>
        ) : null}

        {canManage ? (
          <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.2fr_0.8fr]">
            <SectionCard
              title="Tạo hợp đồng và gửi hàng loạt"
              description="Chọn nhiều nhân sự, điền thông tin chung và để hệ thống tạo snapshot riêng cho từng người."
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field label="Mẫu hợp đồng">
                  <select value={activeTemplateId} onChange={(event) => setTemplateId(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
                    {templates.filter((template) => template.status === 'active').map((template) => (
                      <option key={template.id} value={template.id}>{template.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Upload template docx / text" hint="Đọc file để quét placeholder trước khi gửi ký. Không thay mẫu gốc trong hệ thống.">
                  <label className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-sm font-semibold text-slate-700">
                    <Upload size={16} />
                    {uploadedTemplateName || 'Chọn mẫu để quét field'}
                    <input
                      type="file"
                      accept=".docx,.txt"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void handleTemplateUpload(file)
                      }}
                    />
                  </label>
                </Field>
                <Field label="Loại hợp đồng">
                  <select value={contractType} onChange={(event) => setContractType(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none">
                    <option value="xac_dinh_thoi_han">Xác định thời hạn</option>
                    <option value="khong_xac_dinh_thoi_han">Không xác định thời hạn</option>
                    <option value="part_time">Part-time</option>
                    <option value="phu_luc">Phụ lục hợp đồng</option>
                  </select>
                </Field>
                <Field label="Ngày hiệu lực">
                  <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                </Field>
                <Field label="Ngày kết thúc">
                  <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                </Field>
                <Field label="Người đại diện ký">
                  <input value={companySignerName} onChange={(event) => setCompanySignerName(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                </Field>
                <Field label="Chức danh người ký">
                  <input value={companySignerTitle} onChange={(event) => setCompanySignerTitle(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                </Field>
                <Field label="Tiền tố số hợp đồng" hint="Hệ thống sẽ ghép thêm mã nhân sự để tạo mã riêng cho từng người.">
                  <input value={contractCodePrefix} onChange={(event) => setContractCodePrefix(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                </Field>
                <Field label="Ngân hàng nhận lương mặc định">
                  <input value={bankName} onChange={(event) => setBankName(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                </Field>
                <Field label="Quản lý trực tiếp">
                  <input value={managerName} onChange={(event) => setManagerName(event.target.value)} placeholder="Tên quản lý / store lead" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                </Field>
                <Field label="Phụ cấp / trợ cấp">
                  <input value={salaryAllowances} onChange={(event) => setSalaryAllowances(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                </Field>
                <Field label="Lịch làm việc / khung giờ">
                  <input value={workingSchedule} onChange={(event) => setWorkingSchedule(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                </Field>
                <Field label="Ghi chú / phụ lục">
                  <input value={contractNote} onChange={(event) => setContractNote(event.target.value)} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                </Field>
              </div>

              <div className="mt-4">
                <Field label="Mô tả công việc chính">
                  <textarea value={mainDuties} onChange={(event) => setMainDuties(event.target.value)} rows={4} className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none" />
                </Field>
              </div>

              <div className="mt-5 rounded-3xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">Danh sách nhân sự</p>
                    <h3 className="mt-1 text-base font-black text-slate-900">Chọn người để tạo hợp đồng</h3>
                  </div>
                  <Tag tone="primary">{effectiveSelectedEmployeeIds.length} người đã chọn</Tag>
                </div>
                <div className="mt-4 grid max-h-[280px] grid-cols-1 gap-3 overflow-auto md:grid-cols-2">
                  {employees.map((employee) => (
                    <label key={employee.id} className={`rounded-2xl border p-3 text-sm transition ${effectiveSelectedEmployeeIds.includes(employee.id) ? 'border-primary-200 bg-primary-50' : 'border-slate-200 bg-white'}`}>
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={effectiveSelectedEmployeeIds.includes(employee.id)}
                          onChange={() => toggleEmployeeSelection(employee.id)}
                          className="mt-1"
                        />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900">{employee.full_name}</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {getPositionById(employee.position_id)?.name || employee.position_id} · {getStoreById(employee.store_id)?.name?.replace('Homies Milk Tea - ', '') || employee.store_id}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="mt-5 rounded-3xl border border-primary-100 bg-primary-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-600">Thao tác chính</p>
                    <h3 className="mt-1 text-base font-black text-slate-900">Tạo theo lô trước, preview xong rồi gửi ký.</h3>
                    <p className="mt-1 text-sm text-slate-600">CTA chính ưu tiên gửi ký. Tạo nháp giữ vai trò phụ để rà nội dung trước.</p>
                  </div>
                  <Tag tone="primary">{effectiveSelectedEmployeeIds.length} người đã chọn</Tag>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCreateBulkContracts(true)}
                    disabled={primaryBulkDisabled || sendBlocked}
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-primary-600 px-5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={16} /> Tạo và gửi ký
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCreateBulkContracts(false)}
                    disabled={primaryBulkDisabled}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus size={16} /> Tạo nháp hàng loạt
                  </button>
                </div>
              </div>

              <div className="mt-5 hidden flex-wrap gap-2">
                <button type="button" onClick={() => void handleCreateBulkContracts(false)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700">
                  <Plus size={15} /> Tạo nháp hàng loạt
                </button>
                <button type="button" onClick={() => void handleCreateBulkContracts(true)} className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 text-sm font-bold text-white">
                  <Send size={15} /> Tạo và gửi ký
                </button>
              </div>

              {bulkMissingRows.length ? (
                <div className="mt-5 rounded-3xl border border-rose-100 bg-rose-50 p-4">
                  <div className="flex items-center gap-2">
                    <Users size={16} className="text-rose-600" />
                    <p className="text-sm font-bold text-rose-700">Danh sách bị chặn do thiếu thông tin</p>
                  </div>
                  <div className="mt-3 space-y-2">
                    {bulkMissingRows.map((row) => (
                      <div key={row.employeeId} className="rounded-2xl border border-rose-100 bg-white px-3 py-3 text-sm text-slate-700">
                        <p className="font-bold text-slate-900">{row.employeeName}</p>
                        <p className="mt-1 text-xs text-rose-600">Thiếu: {row.missingFields.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </SectionCard>

            <SectionCard
              title="Preview hợp đồng theo người đang chọn"
              description="Giữ preview bám theo người đang chọn để HR biết ngay đã đủ dữ liệu gửi ký hay chưa."
            >
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div>
                  <p className="text-sm font-bold text-slate-900">{currentEmployee?.full_name || 'Chưa chọn nhân sự'}</p>
                  <p className="mt-1 text-xs text-slate-500">{currentTemplate?.name || 'Chưa chọn mẫu hợp đồng'}</p>
                  {currentEmployee ? (
                    <p className="mt-1 text-xs text-slate-500">{currentEmployeePosition} · {currentEmployeeStore}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {currentEmployee ? (
                    <Link href={`/employees/${currentEmployee.id}`} className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50">
                      Mở hồ sơ
                    </Link>
                  ) : null}
                  <Layers3 size={18} className="text-amber-500" />
                </div>
              </div>

              {previewMissingFields.length ? (
                <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-700">
                  Hồ sơ này còn thiếu trường bắt buộc để gửi ký: {previewMissingFields.join(', ')}
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Soát field trước khi gửi</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {uploadedTemplateName ? `Đang quét theo file ${uploadedTemplateName}.` : 'Đang quét theo mẫu hợp đồng trong hệ thống.'}
                    </p>
                  </div>
                  {uploadedTemplateName ? (
                    <button type="button" onClick={handleClearUploadedTemplate} className="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700">
                      Quay về mẫu hệ thống
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  <ChecklistChip label="Hợp lệ" value={previewState?.checklist.valid || 0} tone="emerald" />
                  <ChecklistChip label="Thiếu dữ liệu" value={previewState?.checklist.missing || 0} tone="amber" />
                  <ChecklistChip label="Field lạ" value={previewState?.checklist.unknown || 0} tone="rose" />
                  <ChecklistChip label="Trùng lặp" value={previewState?.checklist.duplicates || 0} tone="slate" />
                </div>

                {previewState?.checklist.blockingReasons.length ? (
                  <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-sm text-rose-700">
                    {previewState.checklist.blockingReasons.join(' | ')}
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700">
                    Checklist field đã sạch. Có thể gửi ký nếu danh sách người chọn hợp lệ.
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {([
                    ['all', 'Tất cả'],
                    ['hop_le', 'Hợp lệ'],
                    ['thieu_du_lieu', 'Thiếu dữ liệu'],
                    ['field_la', 'Field lạ'],
                    ['trung_lap', 'Trùng lặp'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFieldFilter(value)}
                      className={`rounded-full px-3 py-1.5 text-xs font-bold ${fieldFilter === value ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-600'}`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-4 max-h-[280px] space-y-2 overflow-auto">
                  {filteredPlaceholderItems.length ? filteredPlaceholderItems.map((item) => (
                    <div key={`${item.key}-${item.status}`} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-bold text-slate-900">{item.key}</p>
                        <FieldStatusTag status={item.status} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600">{item.value || 'Chưa có dữ liệu'}</p>
                      {item.note ? <p className="mt-1 text-xs text-slate-500">{item.note}</p> : null}
                    </div>
                  )) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
                      Không có field phù hợp với bộ lọc này.
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 max-h-[640px] overflow-auto rounded-2xl border border-slate-100 bg-slate-950 p-4">
                <pre className="whitespace-pre-wrap text-sm leading-6 text-slate-100">{preview || 'Chọn nhân sự và mẫu hợp đồng để xem preview.'}</pre>
              </div>
            </SectionCard>
          </section>
        ) : null}

        <SectionCard
          title="Danh sách hợp đồng"
          description="Theo dõi hợp đồng đã tạo theo trạng thái ký, rồi đi sang chi tiết hợp đồng hoặc hồ sơ nhân sự khi cần."
        >
          <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Nhóm đang xem</p>
                <p className="mt-1 text-sm text-slate-600">
                  Có <span className="font-bold text-slate-900">{filteredContracts.length}</span> hợp đồng trong bộ lọc <span className="font-bold text-slate-900">{currentStatusLabel.toLowerCase()}</span>.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Tag tone="primary">{priorityCount} việc cần chốt</Tag>
                {selectedStatus !== 'all' ? <Tag>{currentStatusLabel}</Tag> : null}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {(['all', 'draft', 'pending_employee_sign', 'pending_hr_sign', 'active'] as const).map((status) => (
                <button key={status} type="button" onClick={() => setSelectedStatus(status)} className={`rounded-full px-3 py-1.5 text-xs font-bold ${selectedStatus === status ? 'bg-primary-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {status === 'all' ? 'Tất cả' : CONTRACT_STATUS_META[status].label}
                </button>
              ))}
            </div>
            <button type="button" onClick={() => { void handleExportContracts() }} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">
              <Download size={15} />
              Xuất nhóm đang xem
            </button>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-100">
            <div className="grid grid-cols-[1.6fr_1fr_1fr_1fr_0.7fr_1.2fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-500">
              <div>Hợp đồng</div>
              <div>Nhân sự</div>
              <div>Chi nhánh</div>
              <div>Trạng thái</div>
              <div>Version</div>
              <div className="text-right">Thao tác</div>
            </div>

            {isLoadingContracts ? (
              <div className="px-4 py-14 text-center text-sm text-slate-400">Đang tải hợp đồng...</div>
            ) : filteredContracts.length === 0 ? (
              <div className="px-4 py-14 text-center text-sm text-slate-400">Chưa có hợp đồng phù hợp.</div>
            ) : (
              filteredContracts.map((contract) => {
                const employee = EmployeeService.getEmployeeById(contract.employeeId, user ?? undefined) || EmployeeService.getEmployeeById(contract.employeeId)
                const store = getStoreById(contract.storeId)
                const statusMeta = CONTRACT_STATUS_META[contract.status]
                const template = templates.find((item) => item.id === contract.templateId)
                const isRenewalDue = contract.status === 'active' && contract.endDate && new Date(contract.endDate) <= new Date(new Date().setDate(new Date().getDate() + 15))

                return (
                  <div key={contract.id} className="grid grid-cols-[1.6fr_1fr_1fr_1fr_0.7fr_1.2fr] gap-3 border-t border-slate-100 px-4 py-4 text-sm text-slate-700">
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900">{template?.name || contract.templateId}</p>
                      <p className="mt-1 text-xs text-slate-500">{contract.customFields['contract.code'] || contract.id}</p>
                      {isRenewalDue ? <p className="mt-1 text-xs font-semibold text-rose-600">Cần tái ký sớm</p> : null}
                    </div>
                    <div className="min-w-0">
                      {employee ? (
                        <Link href={`/employees/${employee.id}`} className="truncate font-semibold text-slate-900 hover:text-primary-600">
                          {employee.full_name}
                        </Link>
                      ) : (
                        <span>{contract.employeeId}</span>
                      )}
                    </div>
                    <div>{store?.name?.replace('Homies Milk Tea - ', '') || contract.storeId}</div>
                    <div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusMeta.tone}`}>{statusMeta.label}</span></div>
                    <div className="text-xs text-slate-500">{contract.version}</div>
                    <div className="flex flex-wrap justify-end gap-2">
                      <Link href={`/employees/contracts/${contract.id}`} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">
                        Chi tiết
                      </Link>
                      {employee ? (
                        <Link href={`/employees/${employee.id}`} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-700">
                          Hồ sơ
                        </Link>
                      ) : null}
                      {canManage && contract.status === 'draft' ? (
                        <button type="button" onClick={() => void handleContractAction(contract.id, 'send')} className="rounded-full bg-primary-600 px-3 py-1.5 text-xs font-bold text-white">
                          Gửi
                        </button>
                      ) : null}
                      {canManage && ['active', 'expired', 'superseded'].includes(contract.status) ? (
                        <button type="button" onClick={() => void handleContractAction(contract.id, 'renew')} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                          Tái ký
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </SectionCard>
      </div>
    </AppShell>
  )
}
