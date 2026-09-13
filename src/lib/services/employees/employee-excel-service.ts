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
export type EmployeeSpreadsheetRow = Partial<Record<EmployeeExcelHeader, unknown>>

export type EmployeeSpreadsheetParseMeta = {
  headerRowNumber: number
  unknownColumns: string[]
  missingImportantColumns: EmployeeExcelHeader[]
  firstRowColumns: string[]
}

export type EmployeeSpreadsheetParseResult = EmployeeSpreadsheetRow[] & {
  meta: EmployeeSpreadsheetParseMeta
}

export type EmployeeImportPreviewRow = {
  row: number
  employeeName: string
  status: 'valid' | 'warning' | 'error'
  errors: string[]
  warnings: string[]
  payload: Partial<AuthUser>
  mappedFields: Array<{ label: string; value: string }>
  raw: EmployeeSpreadsheetRow
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

const formatDateParts = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const parseDateToIso = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateParts(value)
  }

  if (typeof value === 'number' && Number.isFinite(value) && value >= 20000 && value <= 60000) {
    const date = new Date(Date.UTC(1899, 11, 30) + value * 86400000)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const day = String(date.getUTCDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const raw = trimValue(value)
  if (!raw || raw === '-') return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw

  if (/^\d+$/.test(raw)) {
    const serial = Number(raw)
    if (serial >= 20000 && serial <= 60000) {
      const date = new Date(Date.UTC(1899, 11, 30) + serial * 86400000)
      const year = date.getUTCFullYear()
      const month = String(date.getUTCMonth() + 1).padStart(2, '0')
      const day = String(date.getUTCDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }

  const dayFirstMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  if (dayFirstMatch) {
    const [, day, month, year] = dayFirstMatch
    const date = new Date(Number(year), Number(month) - 1, Number(day))
    if (
      date.getFullYear() === Number(year) &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
    ) {
      return formatDateParts(date)
    }
    return ''
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return ''

  return formatDateParts(parsed)
}

const parseDateField = (value: unknown, fieldLabel: string) => {
  const raw = trimValue(value)
  const iso = parseDateToIso(value)
  return {
    iso,
    warning: raw && raw !== '-' && !iso ? `Không đọc được ${fieldLabel}, giá trị trong file là "${raw}"` : undefined,
  }
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
  if (
    normalized === 'ft' ||
    normalized.includes('toan thoi gian') ||
    normalized.includes('full time') ||
    normalized.includes('full-time') ||
    normalized.includes('fulltime') ||
    normalized.includes('chinh thuc') ||
    normalized.includes('co huu')
  ) return 'full_time'
  if (normalized.includes('thoi vu') || normalized.includes('season')) return 'seasonal'
  if (normalized.includes('thu viec') || normalized.includes('probation')) return 'probation' as EmploymentType
  if (normalized.includes('thuc tap') || normalized.includes('intern')) return 'intern'
  if (
    normalized === 'pt' ||
    normalized.includes('ban thoi gian') ||
    normalized.includes('part time') ||
    normalized.includes('part-time') ||
    normalized.includes('parttime')
  ) return 'part_time'
  return undefined
}

const HEADER_SYNONYMS: Record<string, EmployeeExcelHeader> = {
  'stt': 'STT',
  'ma nhan vien': 'Mã nhân viên',
  'ma nv': 'Mã nhân viên',
  'manv': 'Mã nhân viên',
  'nhan vien': 'Nhân viên',
  'ho ten': 'Nhân viên',
  'ho va ten': 'Nhân viên',
  'ten nhan vien': 'Nhân viên',
  'ngay sinh': 'Ngày sinh',
  'gioi tinh': 'Giới tính',
  'email': 'Email',
  'level': 'Level',
  'cap bac': 'Level',
  'so dien thoai': 'Số điện thoại',
  'sdt': 'Số điện thoại',
  'dien thoai': 'Số điện thoại',
  'ngay gia nhap cong ty': 'Ngày gia nhập công ty',
  'ngay vao lam': 'Ngày gia nhập công ty',
  'ngay vao cong ty': 'Ngày gia nhập công ty',
  'ngay bat dau': 'Ngày gia nhập công ty',
  'ngay gia nhap chi nhanh': 'Ngày gia nhập chi nhánh',
  'ngay gia nhap chi nhanh chinh thuc': 'Ngày gia nhập chi nhánh chính thức',
  'ngay chinh thuc': 'Ngày gia nhập chi nhánh chính thức',
  'chi nhanh': 'Chi nhánh',
  'cua hang': 'Chi nhánh',
  'store': 'Chi nhánh',
  'ma cua hang': 'Chi nhánh',
  'ten cua hang': 'Chi nhánh',
  'chuc vu': 'Chức vụ',
  'vi tri': 'Chức vụ',
  'chuc danh': 'Chức vụ',
  'role': 'Chức vụ',
  'bo phan': 'Bộ phận',
  'phong ban': 'Bộ phận',
  'loai nhan vien': 'Loại nhân viên',
  'hinh thuc lam viec': 'Loại nhân viên',
  'loai hop dong': 'Loại hợp đồng',
  'muc luong': 'Mức lương',
  'luong': 'Mức lương',
  'luong co ban': 'Mức lương',
  'ngan hang': 'Ngân hàng',
  'so tai khoan ngan hang': 'Số tài khoản ngân hàng',
  'stk': 'Số tài khoản ngân hàng',
  'so tai khoan': 'Số tài khoản ngân hàng',
  'dia chi thuong tru': 'Địa chỉ thường trú',
  'dia chi hien tai': 'Địa chỉ hiện tại',
  'dia chi': 'Địa chỉ hiện tại',
  'so dien thoai khan cap': 'Số điện thoại khẩn cấp',
  'sdt khan cap': 'Số điện thoại khẩn cấp',
  'tinh trang hon nhan': 'Tình trạng hôn nhân',
  'dan toc': 'Dân tộc',
  'ton giao': 'Tôn giáo',
  'can cuoc cong dan': 'Căn cước công dân',
  'cccd': 'Căn cước công dân',
  'cmnd': 'Căn cước công dân',
  'ngay cap cccd': 'Ngày cấp CCCD',
  'ngay cap': 'Ngày cấp CCCD',
  'ma so thue': 'Mã số thuế',
  'mst': 'Mã số thuế',
  'ngay nghi viec': 'Ngày nghỉ việc',
  'ly do nghi viec': 'Lý do nghỉ việc',
}

const matchCanonicalHeader = (headerName: string): EmployeeExcelHeader | undefined => {
  const clean = trimValue(headerName)
  if (!clean) return undefined

  if (EMPLOYEE_EXCEL_HEADERS.includes(clean as EmployeeExcelHeader)) {
    return clean as EmployeeExcelHeader
  }

  const normalized = normalizeText(clean)
  if (HEADER_SYNONYMS[normalized]) {
    return HEADER_SYNONYMS[normalized]
  }

  for (const [key, canonical] of Object.entries(HEADER_SYNONYMS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return canonical
    }
  }

  return undefined
}

const parseCurrency = (value: unknown) => {
  const digits = trimValue(value).replace(/[^\d.-]/g, '')
  if (!digits) return undefined
  const parsed = Number(digits)
  return Number.isFinite(parsed) ? parsed : undefined
}

type StoreResolution = {
  storeId: string
  usedDefault: boolean
  rawValue: string
  fallbackName?: string
  missingInDb?: boolean
  errorMessage?: string
  blankDefault?: boolean
}

type PositionResolution = {
  positionId: string
  role: AuthUser['role']
  usedDefault: boolean
  rawValue: string
  fallbackName?: string
  missingInDb?: boolean
  errorMessage?: string
  blankDefault?: boolean
}

const resolveStoreId = (value: unknown) => {
  const raw = trimValue(value)
  const normalized = normalizeText(value)
  if (!normalized) {
    return {
      storeId: 'store-001',
      usedDefault: true,
      rawValue: raw,
      fallbackName: 'Hồ Bá Phấn',
      blankDefault: true,
    } satisfies StoreResolution
  }

  // 1. Direct ID match
  if (mockStores.some(s => s.id.toLowerCase() === raw.toLowerCase())) {
    return { storeId: raw.toLowerCase(), usedDefault: false, rawValue: raw } satisfies StoreResolution
  }

  // 2. Specific Homies Branch keywords & abbreviations
  if (
    normalized.includes('hbp') ||
    normalized.includes('ho ba phan') ||
    normalized.includes('hồ bá phấn') ||
    normalized.includes('quan 1') ||
    normalized.includes('q1') ||
    normalized.includes('q.1') ||
    normalized.includes('st-001') ||
    normalized.includes('bh-q1')
  ) {
    return { storeId: 'store-001', usedDefault: false, rawValue: raw } satisfies StoreResolution
  }

  if (
    normalized.includes('429') ||
    normalized.includes('duong 429') ||
    normalized.includes('đường 429') ||
    normalized.includes('quan 3') ||
    normalized.includes('q3') ||
    normalized.includes('q.3') ||
    normalized.includes('st-002') ||
    normalized.includes('bh-q3')
  ) {
    return { storeId: 'store-002', usedDefault: false, rawValue: raw } satisfies StoreResolution
  }

  if (
    normalized.includes('lvs') ||
    normalized.includes('le van sy') ||
    normalized.includes('lê văn sỹ') ||
    normalized.includes('thu duc') ||
    normalized.includes('thủ đức') ||
    normalized.includes('quan 7') ||
    normalized.includes('q7') ||
    normalized.includes('q.7') ||
    normalized.includes('st-003') ||
    normalized.includes('bh-td')
  ) {
    return {
      storeId: '',
      usedDefault: false,
      rawValue: raw,
      missingInDb: true,
      errorMessage: `Chi nhánh "${raw}" chưa có trong hệ thống. Hãy tạo chi nhánh này ở Cài đặt > Dữ liệu gốc trước khi nhập.`,
    } satisfies StoreResolution
  }

  // 3. Match against mockStores names
  const store = mockStores.find(item => {
    const itemName = normalizeText(item.name)
    const shortName = normalizeText(item.name.replace('Homies Milk Tea - ', ''))
    return (
      normalizeText(item.id) === normalized ||
      itemName === normalized ||
      shortName === normalized ||
      itemName.includes(normalized) ||
      normalized.includes(shortName) ||
      normalized.includes(itemName)
    )
  })

  if (store?.id === 'store-003') {
    return {
      storeId: '',
      usedDefault: false,
      rawValue: raw,
      missingInDb: true,
      errorMessage: `Chi nhánh "${raw}" chưa có trong hệ thống. Hãy tạo chi nhánh này ở Cài đặt > Dữ liệu gốc trước khi nhập.`,
    } satisfies StoreResolution
  }

  if (store?.id) return { storeId: store.id, usedDefault: false, rawValue: raw } satisfies StoreResolution

  return {
    storeId: 'store-001',
    usedDefault: true,
    rawValue: raw,
    fallbackName: 'Hồ Bá Phấn',
  } satisfies StoreResolution
}

const resolvePosition = (value: unknown) => {
  const raw = trimValue(value)
  const normalized = normalizeText(value)
  if (!normalized) {
    return {
      positionId: 'pos-007',
      role: 'employee' as AuthUser['role'],
      usedDefault: true,
      rawValue: raw,
      fallbackName: 'Nhân viên',
      blankDefault: true,
    } satisfies PositionResolution
  }

  // 1. Role & Title specific mapping
  if (normalized.includes('ban giam doc') || normalized.includes('giam doc')) {
    return { positionId: 'pos-005', role: 'ceo' as AuthUser['role'], usedDefault: false, rawValue: raw } satisfies PositionResolution
  }
  if (normalized.includes('chu thuong hieu') || normalized === 'ceo') {
    return { positionId: 'pos-008', role: 'ceo' as AuthUser['role'], usedDefault: false, rawValue: raw } satisfies PositionResolution
  }
  if (normalized.includes('quan ly nhan su') || normalized.includes('hr admin') || normalized.includes('hr')) {
    return { positionId: 'pos-009', role: 'hr_admin' as AuthUser['role'], usedDefault: false, rawValue: raw } satisfies PositionResolution
  }
  if (normalized.includes('quan ly vung') || normalized.includes('area manager')) {
    return { positionId: 'pos-010', role: 'area_manager' as AuthUser['role'], usedDefault: false, rawValue: raw } satisfies PositionResolution
  }
  if (
    normalized.includes('quan ly diem ban hang') ||
    normalized.includes('quan ly cua hang') ||
    normalized.includes('store manager') ||
    normalized.includes('cua hang truong') ||
    normalized === 'quan ly'
  ) {
    return { positionId: 'pos-006', role: 'store_manager' as AuthUser['role'], usedDefault: false, rawValue: raw } satisfies PositionResolution
  }
  if (normalized.includes('quan ly bo phan')) {
    return {
      positionId: '',
      role: 'store_manager' as AuthUser['role'],
      usedDefault: false,
      rawValue: raw,
      missingInDb: true,
      errorMessage: `Chức vụ "${raw}" chưa có trong hệ thống. Hãy tạo chức vụ này ở Cài đặt > Dữ liệu gốc trước khi nhập.`,
    } satisfies PositionResolution
  }
  if (normalized.includes('pho quan ly') || normalized.includes('assistant manager')) {
    return { positionId: 'pos-004', role: 'shift_leader' as AuthUser['role'], usedDefault: false, rawValue: raw } satisfies PositionResolution
  }
  if (normalized.includes('truong ca') || normalized.includes('shift leader')) {
    return { positionId: 'pos-004', role: 'shift_leader' as AuthUser['role'], usedDefault: false, rawValue: raw } satisfies PositionResolution
  }
  if (normalized.includes('pha che') || normalized.includes('barista')) {
    return { positionId: 'pos-001', role: 'employee' as AuthUser['role'], usedDefault: false, rawValue: raw } satisfies PositionResolution
  }
  if (normalized.includes('thu ngan') || normalized.includes('cashier')) {
    return { positionId: 'pos-002', role: 'employee' as AuthUser['role'], usedDefault: false, rawValue: raw } satisfies PositionResolution
  }
  if (normalized.includes('phuc vu') || normalized.includes('server')) {
    return {
      positionId: '',
      role: 'employee' as AuthUser['role'],
      usedDefault: false,
      rawValue: raw,
      missingInDb: true,
      errorMessage: `Chức vụ "${raw}" chưa có trong hệ thống. Hãy tạo chức vụ này ở Cài đặt > Dữ liệu gốc trước khi nhập.`,
    } satisfies PositionResolution
  }
  if (normalized.includes('nhan vien') || normalized.includes('staff') || normalized.includes('employee')) {
    return { positionId: 'pos-007', role: 'employee' as AuthUser['role'], usedDefault: false, rawValue: raw } satisfies PositionResolution
  }

  // 2. Generic position match from mockPositions
  const position = mockPositions.find(item => {
    const itemName = normalizeText(item.name)
    return itemName === normalized || itemName.includes(normalized) || normalized.includes(itemName)
  })

  if (position) {
    const role: AuthUser['role'] =
      normalized.includes('quan ly') ? 'store_manager'
        : normalized.includes('truong ca') ? 'shift_leader'
          : 'employee'
    return { positionId: position.id, role, usedDefault: false, rawValue: raw } satisfies PositionResolution
  }

  return {
    positionId: 'pos-007',
    role: 'employee' as AuthUser['role'],
    usedDefault: true,
    rawValue: raw,
    fallbackName: 'Nhân viên',
  } satisfies PositionResolution
}

const IMPORTANT_IMPORT_HEADERS: EmployeeExcelHeader[] = [
  'Mã nhân viên',
  'Chi nhánh',
  'Chức vụ',
  'Loại nhân viên',
  'Mức lương',
]

const readWorkbookRows = async (file: File): Promise<EmployeeSpreadsheetParseResult> => {
  const data = await readSheet(file)
  const scanRows = data.slice(0, 10)
  let headerRowIndex = -1
  let bestMatchCount = 0

  scanRows.forEach((row, index) => {
    const matchedHeaders = new Set<EmployeeExcelHeader>()
    row.forEach((value) => {
      const canonicalHeader = matchCanonicalHeader(trimValue(value))
      if (canonicalHeader) matchedHeaders.add(canonicalHeader)
    })
    if (matchedHeaders.size > bestMatchCount) {
      bestMatchCount = matchedHeaders.size
      headerRowIndex = index
    }
  })

  if (headerRowIndex < 0 || bestMatchCount < 3) {
    const firstRowColumns = (data[0] || []).map((value) => trimValue(value)).filter(Boolean)
    throw new Error(`Không tìm thấy dòng tiêu đề. Hãy kiểm tra file có đúng là danh sách nhân viên không. Dòng đầu đang có: ${firstRowColumns.join(', ') || 'không có tên cột'}.`)
  }

  const headerRow = data[headerRowIndex] || []
  const bodyRows = data.slice(headerRowIndex + 1)
  const headers = (headerRow || []).map((value) => trimValue(value))
  const canonicalHeaders = headers.map((header) => matchCanonicalHeader(header))
  const presentHeaders = new Set(canonicalHeaders.filter(Boolean) as EmployeeExcelHeader[])
  const meta: EmployeeSpreadsheetParseMeta = {
    headerRowNumber: headerRowIndex + 1,
    unknownColumns: headers.filter((header, index) => header && !canonicalHeaders[index]),
    missingImportantColumns: IMPORTANT_IMPORT_HEADERS.filter((header) => !presentHeaders.has(header)),
    firstRowColumns: (data[0] || []).map((value) => trimValue(value)).filter(Boolean),
  }

  const rows = bodyRows.map((row) => {
    const record: EmployeeSpreadsheetRow = {}
    headers.forEach((header, index) => {
      if (!header) return
      const canonicalHeader = canonicalHeaders[index]
      if (canonicalHeader) {
        record[canonicalHeader] = row[index]
      } else {
        record[header as EmployeeExcelHeader] = row[index]
      }
    })
    return record
  })

  return Object.assign(rows, { meta })
}

export async function parseEmployeeSpreadsheet(file: File) {
  const rows = await readWorkbookRows(file)
  return rows
}

export function buildEmployeeImportPreview(
  rows: EmployeeSpreadsheetRow[],
  isPhoneDuplicate: (phone: string) => boolean,
  isEmailDuplicate: (email: string) => boolean,
) {
  const seenPhones = new Set<string>()
  const seenEmails = new Set<string>()

  return rows.map((row, index): EmployeeImportPreviewRow => {
    const fullName = trimValue(row['Nhân viên'])
    const rawEmpCode = trimValue(row['Mã nhân viên'])
    const employeeCode = rawEmpCode === '-' || rawEmpCode === '--' ? undefined : rawEmpCode || undefined
    const phone = normalizePhone(row['Số điện thoại'])
    const email = trimValue(row.Email)
    const dateOfBirthResult = parseDateField(row['Ngày sinh'], 'ngày sinh')
    const companyHireDateResult = parseDateField(row['Ngày gia nhập công ty'], 'ngày gia nhập công ty')
    const branchHireDateResult = parseDateField(row['Ngày gia nhập chi nhánh'], 'ngày gia nhập chi nhánh')
    const officialStartDateResult = parseDateField(row['Ngày gia nhập chi nhánh chính thức'], 'ngày gia nhập chi nhánh chính thức')
    const cccdIssueDateResult = parseDateField(row['Ngày cấp CCCD'], 'ngày cấp CCCD')
    const resignationDateResult = parseDateField(row['Ngày nghỉ việc'], 'ngày nghỉ việc')
    const dateOfBirth = dateOfBirthResult.iso
    const hireDate = companyHireDateResult.iso || branchHireDateResult.iso
    const officialStartDate = officialStartDateResult.iso
    const storeResolution = resolveStoreId(row['Chi nhánh'])
    const storeId = storeResolution.storeId
    const positionResolution = resolvePosition(row['Chức vụ'])
    const { positionId, role } = positionResolution
    const resignationDateRaw = trimValue(row['Ngày nghỉ việc'])
    const status = resignationDateRaw && resignationDateRaw !== '-' ? 'resigned' : 'active'
    const salary = parseCurrency(row['Mức lương'])
    const rawSalary = trimValue(row['Mức lương'])
    const rawEmploymentType = trimValue(row['Loại nhân viên'])
    const employmentType = parseEmploymentType(row['Loại nhân viên'])
    const errors: string[] = []
    const warnings: string[] = []

    if (!fullName) errors.push('Thiếu họ tên')
    if (!phone) errors.push('Thiếu số điện thoại')
    if (dateOfBirthResult.warning) warnings.push(dateOfBirthResult.warning)
    else if (!dateOfBirth) warnings.push('Thiếu hoặc sai ngày sinh')
    if (companyHireDateResult.warning) warnings.push(companyHireDateResult.warning)
    if (branchHireDateResult.warning) warnings.push(branchHireDateResult.warning)
    if (officialStartDateResult.warning) warnings.push(officialStartDateResult.warning)
    if (cccdIssueDateResult.warning) warnings.push(cccdIssueDateResult.warning)
    if (resignationDateResult.warning) warnings.push(resignationDateResult.warning)
    if (!hireDate) errors.push('Thiếu ngày gia nhập công ty')
    if (storeResolution.missingInDb) errors.push(storeResolution.errorMessage || `Chi nhánh "${storeResolution.rawValue}" chưa có trong hệ thống.`)
    else if (!storeId) errors.push('Không map được chi nhánh')
    if (positionResolution.missingInDb) errors.push(positionResolution.errorMessage || `Chức vụ "${positionResolution.rawValue}" chưa có trong hệ thống.`)
    else if (!positionId) warnings.push('Không map được chức vụ, sẽ dùng vị trí mặc định')
    if (storeResolution.blankDefault) warnings.push('Chưa có chi nhánh, tạm gán Hồ Bá Phấn')
    else if (storeResolution.usedDefault) warnings.push(`Chi nhánh "${storeResolution.rawValue}" không nhận ra, đã gán tạm "${storeResolution.fallbackName || 'Hồ Bá Phấn'}" — cần kiểm tra`)
    if (positionResolution.blankDefault) warnings.push('Chưa có chức vụ, tạm gán Nhân viên (lương 5.000.000)')
    else if (positionResolution.usedDefault) warnings.push(`Chức vụ "${positionResolution.rawValue}" không nhận ra, đã gán tạm "${positionResolution.fallbackName || 'Nhân viên'}" — cần kiểm tra`)
    if (!rawSalary) warnings.push('Chưa có mức lương, sẽ lưu 0 đồng và bảng lương sẽ ra 0')
    if (!rawEmploymentType) warnings.push('Chưa khai loại nhân viên, hệ thống tự chọn mặc định — ảnh hưởng cách tính lương')
    else if (!employmentType) warnings.push(`Loại nhân viên "${rawEmploymentType}" không nhận ra, hệ thống tự chọn mặc định — ảnh hưởng cách tính lương`)

    if (phone && seenPhones.has(phone)) errors.push('Số điện thoại bị trùng lặp trong cùng file Excel')
    if (email && seenEmails.has(email.toLowerCase())) errors.push('Email bị trùng lặp trong cùng file Excel')

    if (phone && isPhoneDuplicate(phone)) warnings.push('Số điện thoại đã có trong hệ thống (sẽ cập nhật thông tin)')
    if (email && isEmailDuplicate(email)) warnings.push('Email đã có trong hệ thống (sẽ cập nhật thông tin)')

    const payload: Partial<AuthUser> = {
      employee_code: employeeCode,
      full_name: fullName,
      email,
      phone,
      date_of_birth: dateOfBirth || undefined,
      gender: parseGender(row['Giới tính']),
      hire_date: hireDate || new Date().toISOString().slice(0, 10),
      store_id: storeId || undefined,
      position_id: positionId || undefined,
      role,
      status,
      account_status: status === 'resigned' ? 'bi_khoa' : 'dang_hoat_dong',
      department_name: trimValue(row['Bộ phận']) || undefined,
      employee_type: employmentType || (rawEmploymentType ? ('unknown' as EmploymentType) : undefined),
      official_salary: rawSalary ? salary : undefined,
      address: trimValue(row['Địa chỉ hiện tại']) || trimValue(row['Địa chỉ thường trú']) || undefined,
      emergency_contact: normalizePhone(row['Số điện thoại khẩn cấp']) || undefined,
      cccd: trimValue(row['Căn cước công dân']) || undefined,
      candidate_notes: trimValue(row['Lý do nghỉ việc']) || undefined,
      is_probationary: Boolean(officialStartDate && hireDate && officialStartDate !== hireDate),
      probation_end_date: officialStartDate || undefined,
    }

    if (phone) seenPhones.add(phone)
    if (email) seenEmails.add(email.toLowerCase())

    const storeObj = getStoreById(payload.store_id || 'store-001')
    const positionObj = getPositionById(payload.position_id || 'pos-007')
    const storeName = storeResolution.missingInDb ? storeResolution.rawValue : storeObj ? storeObj.name.replace('Homies Milk Tea - ', '') : payload.store_id
    const positionName = positionResolution.missingInDb ? positionResolution.rawValue : positionObj?.name || payload.position_id

    return {
      row: index + 2,
      employeeName: fullName || `Dòng ${index + 2}`,
      status: errors.length > 0 ? 'error' : warnings.length > 0 ? 'warning' : 'valid',
      errors,
      warnings,
      payload,
      mappedFields: [
        { label: 'Mã NV', value: payload.employee_code || 'Tự sinh (không phải mã từ iPOS)' },
        { label: 'Chi nhánh', value: storeName || 'Chưa có' },
        { label: 'Chức vụ', value: positionName || 'Chưa có' },
        { label: 'Loại NV', value: employmentType ? mapEmploymentTypeLabel(employmentType) : rawEmploymentType ? `Không nhận ra (${rawEmploymentType})` : 'Chưa có' },
        { label: 'Lương', value: payload.official_salary ? `${payload.official_salary.toLocaleString('vi-VN')}₫` : 'Chưa có' },
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

export async function exportEmployeeTemplateSpreadsheet() {
  const sampleRow: EmployeeExcelRow = {
    STT: '1',
    'Mã nhân viên': 'BH-020',
    'Nhân viên': 'Nguyễn Văn Mẫu',
    'Ngày sinh': '15/05/2000',
    'Giới tính': 'Nam',
    Email: 'nguyenvanmau@gmail.com',
    Level: 'Nhân viên',
    'Số điện thoại': '0901234888',
    'Ngày gia nhập công ty': '01/01/2026',
    'Ngày gia nhập chi nhánh': '01/01/2026',
    'Ngày gia nhập chi nhánh chính thức': '01/01/2026',
    'Chi nhánh': 'Hồ Bá Phấn',
    'Chức vụ': 'Nhân viên',
    'Bộ phận': 'Vận hành cửa hàng',
    'Loại nhân viên': 'Toàn thời gian',
    'Loại hợp đồng': 'Chính thức',
    'Mức lương': '6000000',
    'Ngân hàng': 'Vietcombank',
    'Số tài khoản ngân hàng': '1234567890',
    'Địa chỉ thường trú': 'TP.HCM',
    'Địa chỉ hiện tại': 'TP.HCM',
    'Số điện thoại khẩn cấp': '0909999888',
    'Tình trạng hôn nhân': 'Độc thân',
    'Dân tộc': 'Kinh',
    'Tôn giáo': 'Không',
    'Căn cước công dân': '079123456789',
    'Ngày cấp CCCD': '01/01/2020',
    'Mã số thuế': '',
    'Ngày nghỉ việc': '',
    'Lý do nghỉ việc': '',
  }
  await downloadEmployeeWorkbook([sampleRow], 'Mau_nhap_nhan_su_Homies.xlsx')
}

function mapEmploymentTypeLabel(value?: EmploymentType) {
  switch (value) {
    case 'full_time':
      return 'Toàn thời gian'
    case 'seasonal':
      return 'Thời vụ'
    case 'probation' as EmploymentType:
      return 'Thử việc'
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
