import { readSheet } from 'read-excel-file/browser'
import writeExcelFile from 'write-excel-file/browser'
import { getPositionById, getStoreById, mockPositions, mockStores } from '@/lib/mock-data'
import type { AuthUser } from '@/store/auth-store'
import type { EmploymentType } from '@/lib/mock-data-employee-ext'

export const EMPLOYEE_EXCEL_HEADERS = [
  'STT',
  'Mã nhân viên',
  'Nhân viên',
  'Ngày sinh',
  'Giới tính',
  'Email',
  'Level',
  'Số điện thoại',
  'Ngày gia nhập công ty',
  'Ngày gia nhập chi nhánh',
  'Ngày gia nhập chi nhánh chính thức',
  'Chi nhánh',
  'Chức vụ',
  'Bộ phận',
  'Loại nhân viên',
  'Loại hợp đồng',
  'Mức lương',
  'Ngân hàng',
  'Số tài khoản ngân hàng',
  'Địa chỉ thường trú',
  'Địa chỉ hiện tại',
  'Số điện thoại khẩn cấp',
  'Tình trạng hôn nhân',
  'Dân tộc',
  'Tôn giáo',
  'Căn cước công dân',
  'Ngày cấp CCCD',
  'Mã số thuế',
  'Ngày nghỉ việc',
  'Lý do nghỉ việc',
] as const

export type EmployeeExcelHeader = (typeof EMPLOYEE_EXCEL_HEADERS)[number]
export type EmployeeExcelRow = Record<EmployeeExcelHeader, string>

export type EmployeeImportPreviewRow = {
  row: number
  employeeName: string
  status: 'valid' | 'warning' | 'error'
  errors: string[]
  warnings: string[]
  payload: Partial<AuthUser>
  mappedFields: Array<{ label: string; value: string }>
  raw: Partial<EmployeeExcelRow>
}

export const EMPLOYEE_IMPORT_PRESETS = [
  {
    id: 'hrm_standard',
    label: 'Mau HRM chuan',
    description: 'Dung bo cot Excel day du cua Homies',
  },
  {
    id: 'store_shift',
    label: 'Mau cua hang',
    description: 'Uu tien cot van hanh de import nhanh theo ca',
  },
] as const

const trimValue = (value: unknown) => String(value ?? '').trim()

const normalizeText = (value: unknown) =>
  trimValue(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const normalizePhone = (value: unknown) => trimValue(value).replace(/[^\d]/g, '')

const parseDateToIso = (value: unknown) => {
  const raw = trimValue(value)
  if (!raw || raw === '-') return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw

  const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (slashMatch) {
    const [, day, month, year] = slashMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseGender = (value: unknown): AuthUser['gender'] | undefined => {
  const normalized = normalizeText(value)
  if (!normalized) return undefined
  if (normalized === 'nam' || normalized === 'male') return 'male'
  if (normalized === 'nu' || normalized === 'female') return 'female'
  return 'other'
}

const parseEmploymentType = (value: unknown): EmploymentType | undefined => {
  const normalized = normalizeText(value)
  if (normalized.includes('toan thoi gian') || normalized.includes('full')) return 'full_time'
  if (normalized.includes('thoi vu') || normalized.includes('season')) return 'seasonal'
  if (normalized.includes('thuc tap') || normalized.includes('intern')) return 'intern'
  if (normalized.includes('ban thoi gian') || normalized.includes('part')) return 'part_time'
  return undefined
}

const parseCurrency = (value: unknown) => {
  const digits = trimValue(value).replace(/[^\d.-]/g, '')
  if (!digits) return undefined
  const parsed = Number(digits)
  return Number.isFinite(parsed) ? parsed : undefined
}

const resolveStoreId = (value: unknown) => {
  const normalized = normalizeText(value)
  if (!normalized) return ''

  const store = mockStores.find(item => {
    const itemName = normalizeText(item.name)
    const shortName = normalizeText(item.name.replace('Homies Milk Tea - ', ''))
    return (
      normalizeText(item.id) === normalized ||
      itemName === normalized ||
      shortName === normalized ||
      itemName.includes(normalized) ||
      normalized.includes(shortName)
    )
  })

  return store?.id || ''
}

const resolvePosition = (value: unknown) => {
  const normalized = normalizeText(value)
  if (!normalized) return { positionId: '', role: 'employee' as AuthUser['role'] }

  const position = mockPositions.find(item => {
    const itemName = normalizeText(item.name)
    return itemName === normalized || itemName.includes(normalized) || normalized.includes(itemName)
  })

  const role: AuthUser['role'] =
    normalized.includes('quan ly') ? 'store_manager'
      : normalized.includes('truong ca') ? 'shift_leader'
        : 'employee'

  return { positionId: position?.id || '', role }
}

const readWorkbookRows = async (file: File) => {
  const data = await readSheet(file)
  const [headerRow, ...bodyRows] = data
  const headers = (headerRow || []).map((value) => trimValue(value))

  return bodyRows.map((row) => {
    const record: Partial<EmployeeExcelRow> = {}
    headers.forEach((header, index) => {
      if (!header) return
      record[header as EmployeeExcelHeader] = trimValue(row[index])
    })
    return record
  })
}

export async function parseEmployeeSpreadsheet(file: File) {
  const rows = await readWorkbookRows(file)
  return rows
}

export function buildEmployeeImportPreview(
  rows: Partial<EmployeeExcelRow>[],
  isPhoneDuplicate: (phone: string) => boolean,
  isEmailDuplicate: (email: string) => boolean,
) {
  const seenPhones = new Set<string>()
  const seenEmails = new Set<string>()

  return rows.map((row, index): EmployeeImportPreviewRow => {
    const fullName = trimValue(row['Nhân viên'])
    const phone = normalizePhone(row['Số điện thoại'])
    const email = trimValue(row.Email)
    const dateOfBirth = parseDateToIso(row['Ngày sinh'])
    const hireDate = parseDateToIso(row['Ngày gia nhập công ty'] || row['Ngày gia nhập chi nhánh'])
    const officialStartDate = parseDateToIso(row['Ngày gia nhập chi nhánh chính thức'])
    const storeId = resolveStoreId(row['Chi nhánh'])
    const { positionId, role } = resolvePosition(row['Chức vụ'])
    const status = trimValue(row['Ngày nghỉ việc']) ? 'resigned' : 'active'
    const salary = parseCurrency(row['Mức lương'])
    const errors: string[] = []
    const warnings: string[] = []

    if (!fullName) errors.push('Thiếu họ tên')
    if (!phone) errors.push('Thiếu số điện thoại')
    if (!dateOfBirth) warnings.push('Thiếu hoặc sai ngày sinh')
    if (!hireDate) errors.push('Thiếu ngày gia nhập công ty')
    if (!storeId) errors.push('Không map được chi nhánh')
    if (!positionId) warnings.push('Không map được chức vụ, sẽ dùng vị trí mặc định')

    if (phone && isPhoneDuplicate(phone)) errors.push('Số điện thoại đã tồn tại trong hệ thống')
    if (email && isEmailDuplicate(email)) errors.push('Email đã tồn tại trong hệ thống')
    if (phone && seenPhones.has(phone)) errors.push('Số điện thoại bị trùng trong file import')
    if (email && seenEmails.has(email.toLowerCase())) errors.push('Email bị trùng trong file import')

    const payload: Partial<AuthUser> = {
      employee_code: trimValue(row['Mã nhân viên']) || undefined,
      full_name: fullName,
      email,
      phone,
      date_of_birth: dateOfBirth || undefined,
      gender: parseGender(row['Giới tính']),
      hire_date: hireDate || new Date().toISOString().slice(0, 10),
      store_id: storeId || 'store-001',
      position_id: positionId || 'pos-003',
      role,
      status,
      account_status: status === 'resigned' ? 'bi_khoa' : 'dang_hoat_dong',
      department_name: trimValue(row['Bộ phận']) || undefined,
      employee_type: parseEmploymentType(row['Loại nhân viên']),
      official_salary: salary,
      address: trimValue(row['Địa chỉ hiện tại']) || trimValue(row['Địa chỉ thường trú']) || undefined,
      emergency_contact: normalizePhone(row['Số điện thoại khẩn cấp']) || undefined,
      cccd: trimValue(row['Căn cước công dân']) || undefined,
      candidate_notes: trimValue(row['Lý do nghỉ việc']) || undefined,
      is_probationary: Boolean(officialStartDate && hireDate && officialStartDate !== hireDate),
      probation_end_date: officialStartDate || undefined,
    }

    if (phone) seenPhones.add(phone)
    if (email) seenEmails.add(email.toLowerCase())

    return {
      row: index + 2,
      employeeName: fullName || `Dòng ${index + 2}`,
      status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid',
      errors,
      warnings,
      payload,
      mappedFields: [
        { label: 'Ma NV', value: payload.employee_code || 'Se tu sinh' },
        { label: 'Chi nhanh', value: payload.store_id || 'Chua co' },
        { label: 'Chuc vu', value: payload.position_id || 'Chua co' },
        { label: 'Loai NV', value: payload.employee_type || 'Chua co' },
        { label: 'Luong', value: payload.official_salary ? String(payload.official_salary) : 'Chua co' },
      ],
      raw: row,
    }
  })
}

export function buildEmployeeExportRows(employees: AuthUser[]) {
  return employees.map((employee, index): EmployeeExcelRow => {
    const store = getStoreById(employee.store_id)
    const position = getPositionById(employee.position_id)
    return {
      STT: String(index + 1),
      'Mã nhân viên': employee.employee_code || '',
      'Nhân viên': employee.full_name || '',
      'Ngày sinh': employee.date_of_birth ? formatDisplayDate(employee.date_of_birth) : '',
      'Giới tính': employee.gender === 'male' ? 'Nam' : employee.gender === 'female' ? 'Nữ' : employee.gender === 'other' ? 'Khác' : '',
      Email: employee.email || '',
      Level: employee.job_level || employee.kpi_level || '',
      'Số điện thoại': employee.phone || '',
      'Ngày gia nhập công ty': formatDisplayDate(employee.hire_date),
      'Ngày gia nhập chi nhánh': formatDisplayDate(employee.hire_date),
      'Ngày gia nhập chi nhánh chính thức': employee.probation_end_date ? formatDisplayDate(employee.probation_end_date) : formatDisplayDate(employee.hire_date),
      'Chi nhánh': store?.name || employee.store_id || '',
      'Chức vụ': position?.name || employee.position_id || '',
      'Bộ phận': employee.department_name || 'Nhân sự cửa hàng',
      'Loại nhân viên': mapEmploymentTypeLabel(employee.employee_type),
      'Loại hợp đồng': employee.status === 'probation' ? 'Thử việc' : 'Chính thức',
      'Mức lương': employee.official_salary ? String(employee.official_salary) : '',
      'Ngân hàng': '',
      'Số tài khoản ngân hàng': '',
      'Địa chỉ thường trú': employee.address || '',
      'Địa chỉ hiện tại': employee.address || '',
      'Số điện thoại khẩn cấp': employee.emergency_contact || '',
      'Tình trạng hôn nhân': '',
      'Dân tộc': '',
      'Tôn giáo': '',
      'Căn cước công dân': employee.cccd || '',
      'Ngày cấp CCCD': '',
      'Mã số thuế': '',
      'Ngày nghỉ việc': employee.status === 'resigned' ? formatDisplayDate(new Date().toISOString().slice(0, 10)) : '',
      'Lý do nghỉ việc': employee.candidate_notes || '',
    }
  })
}

export async function downloadEmployeeWorkbook(rows: EmployeeExcelRow[], fileName: string) {
  const sheetData = [
    [...EMPLOYEE_EXCEL_HEADERS],
    ...rows.map((row) => EMPLOYEE_EXCEL_HEADERS.map((header) => row[header] || '')),
  ]

  await writeExcelFile(sheetData).toFile(fileName)
}

function mapEmploymentTypeLabel(value?: EmploymentType) {
  switch (value) {
    case 'full_time':
      return 'Toàn thời gian'
    case 'seasonal':
      return 'Thời vụ'
    case 'intern':
      return 'Thực tập'
    default:
      return 'Bán thời gian'
  }
}

function formatDisplayDate(value?: string) {
  const iso = parseDateToIso(value)
  if (!iso) return ''
  const [year, month, day] = iso.split('-')
  return `${day}/${month}/${year}`
}
