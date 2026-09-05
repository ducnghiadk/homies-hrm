export interface IposAttendanceEmployee {
  id: string
  full_name: string
  employee_code?: string | null
  store_id?: string | null
}

export interface IposAttendanceStore {
  id: string
  name: string
}

export interface IposWorkbookSheet {
  sheet: string
  data: unknown[][]
}

export interface IposImportMatchNote {
  employeeId?: string
  employeeName: string
  matchedBy: 'code' | 'name' | 'unmatched'
  importedName: string
  importedCode: string
}

export interface IposAttendanceImportPreview {
  source: 'schedule-list' | 'grid'
  sourceSheet: string
  headers: string[]
  rows: string[][]
  columnMapping: Record<number, string>
  detectedStoreId?: string
  detectedMonth?: number
  detectedYear?: number
  matchNotes: IposImportMatchNote[]
}

export interface IposAttendanceParseOptions {
  employees: IposAttendanceEmployee[]
  stores: IposAttendanceStore[]
  preferredStoreId?: string
}

export type IposAttendanceCellKind = 'complete' | 'missing_checkout' | 'missing_checkin' | 'no_attendance'

export interface IposAttendanceCell {
  kind: IposAttendanceCellKind
  actualIn?: string
  actualOut?: string
  scheduledIn?: string
  scheduledOut?: string
}

export interface IposAttendanceImportRecord extends IposAttendanceCell {
  kind: Exclude<IposAttendanceCellKind, 'no_attendance'>
  status: 'on_time' | 'missing_checkout' | 'pending'
  totalHours: number
}

export interface IposAttendanceImportSlotIdentity {
  id: string
  scheduledIn: string
  scheduledOut: string
  isOvertime?: boolean
  editReason?: string
}

export const IPOS_ATTENDANCE_IMPORT_REASON = 'Nhập thông minh từ file Excel iPOS'

export function buildIposAttendanceImportSlotId(
  employeeId: string,
  date: string,
  slot: Pick<IposAttendanceImportSlotIdentity, 'scheduledIn' | 'scheduledOut' | 'isOvertime'>
): string {
  const shiftType = slot.isOvertime ? 'ot' : 'regular'
  return `att-imp:${employeeId}:${date}:${slot.scheduledIn}:${slot.scheduledOut}:${shiftType}`
}

export function upsertIposAttendanceImportSlot<T extends IposAttendanceImportSlotIdentity>(
  currentSlots: T[],
  incomingSlot: T
): T[] {
  const isMatchingImport = (slot: T) => slot.editReason === IPOS_ATTENDANCE_IMPORT_REASON
    && (
      slot.id === incomingSlot.id
      || (
        slot.scheduledIn === incomingSlot.scheduledIn
        && slot.scheduledOut === incomingSlot.scheduledOut
        && Boolean(slot.isOvertime) === Boolean(incomingSlot.isOvertime)
      )
    )
  const matchingIndex = currentSlots.findIndex(isMatchingImport)

  if (matchingIndex < 0) return [...currentSlots, incomingSlot]

  const nextSlots: T[] = []
  currentSlots.forEach((slot, index) => {
    if (!isMatchingImport(slot)) {
      nextSlots.push(slot)
    } else if (index === matchingIndex) {
      nextSlots.push(incomingSlot)
    }
  })
  return nextSlots
}

type HeaderMap = {
  date?: number
  employeeName?: number
  employeeCode?: number
  store?: number
  shiftTime?: number
  checkIn?: number
  checkOut?: number
}

type ParsedShift = {
  employee: IposAttendanceEmployee | null
  employeeName: string
  employeeCode: string
  matchedBy: IposImportMatchNote['matchedBy']
  date: string
  shiftText: string
}

const SCHEDULE_LIST_SHEET_KEYWORDS = ['danh sach', 'lich lam viec']

export function parseIposAttendanceCell(value: string): IposAttendanceCell | null {
  const text = readCell(value)
  if (!text) return null

  const scheduledMatch = text.match(/\[Ca\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})\]/i)
  const scheduledIn = scheduledMatch ? normalizeTime(scheduledMatch[1]) : undefined
  const scheduledOut = scheduledMatch ? normalizeTime(scheduledMatch[2]) : undefined
  if (scheduledMatch && (!scheduledIn || !scheduledOut)) return null
  const body = scheduledMatch ? text.replace(scheduledMatch[0], '').trim() : text
  const scheduled = { scheduledIn, scheduledOut }

  if (/^KCD\b/i.test(body)) {
    return { kind: 'no_attendance', ...scheduled }
  }

  const missingCheckout = body.match(/(\d{1,2}:\d{2})\s*[-–]?\s*QCO\b/i)
  if (missingCheckout) {
    const actualIn = normalizeTime(missingCheckout[1])
    if (!actualIn) return null
    return {
      kind: 'missing_checkout',
      actualIn,
      ...scheduled,
    }
  }

  const missingCheckin = body.match(/\bQCI\s*[-–]?\s*(\d{1,2}:\d{2})/i)
  if (missingCheckin) {
    const actualOut = normalizeTime(missingCheckin[1])
    if (!actualOut) return null
    return {
      kind: 'missing_checkin',
      actualOut,
      ...scheduled,
    }
  }

  const complete = body.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/)
  if (!complete) return null
  const actualIn = normalizeTime(complete[1])
  const actualOut = normalizeTime(complete[2])
  if (!actualIn || !actualOut) return null

  return {
    kind: 'complete',
    actualIn,
    actualOut,
    ...scheduled,
  }
}

export function buildIposAttendanceImportRecord(value: string): IposAttendanceImportRecord | null {
  const cell = parseIposAttendanceCell(value)
  if (!cell || cell.kind === 'no_attendance') return null

  const status = cell.kind === 'complete'
    ? 'on_time'
    : cell.kind === 'missing_checkout'
      ? 'missing_checkout'
      : 'pending'

  let totalHours = 0
  if (cell.kind === 'complete' && cell.actualIn && cell.actualOut) {
    const [startHour, startMinute] = cell.actualIn.split(':').map(Number)
    const [endHour, endMinute] = cell.actualOut.split(':').map(Number)
    let duration = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
    if (duration <= 0) duration += 24 * 60
    totalHours = Math.round((duration / 60) * 10) / 10
  }

  return {
    ...cell,
    kind: cell.kind,
    status,
    totalHours,
  }
}

export function splitIposAttendanceEntries(value: string): string[] {
  return value
    .split(/[\r\n;/]+/)
    .map(entry => entry.trim())
    .filter(Boolean)
}

export function parseIposAttendanceWorkbook(
  sheets: IposWorkbookSheet[],
  options: IposAttendanceParseOptions
): IposAttendanceImportPreview {
  const scheduleSheet = findScheduleListSheet(sheets)
  if (scheduleSheet) {
    const parsed = parseScheduleListSheet(scheduleSheet, options)
    if (parsed.rows.length > 0) return parsed
  }

  const fallbackSheet = sheets.find(sheet => Array.isArray(sheet.data) && sheet.data.length > 0)
  if (fallbackSheet) {
    return parseFallbackGridSheet(fallbackSheet, options)
  }

  return {
    source: 'grid',
    sourceSheet: '',
    headers: ['Nhân viên'],
    rows: [],
    columnMapping: {},
    matchNotes: [],
  }
}

function findScheduleListSheet(sheets: IposWorkbookSheet[]): IposWorkbookSheet | null {
  return sheets.find(sheet => {
    const sheetName = normalizeText(sheet.sheet)
    return SCHEDULE_LIST_SHEET_KEYWORDS.every(keyword => sheetName.includes(keyword))
  }) || sheets.find(sheet => findScheduleHeader(sheet.data).rowIndex >= 0) || null
}

function parseScheduleListSheet(
  sheet: IposWorkbookSheet,
  options: IposAttendanceParseOptions
): IposAttendanceImportPreview {
  const { rowIndex: headerRowIndex, headerMap } = findScheduleHeader(sheet.data)
  if (headerRowIndex < 0) {
    return emptyScheduleListResult(sheet.sheet)
  }

  const shifts: ParsedShift[] = []
  const detectedStoreIds: string[] = []

  for (const row of sheet.data.slice(headerRowIndex + 1)) {
    const date = parseDateCell(row[headerMap.date ?? -1])
    if (!date) continue

    const branchText = readCell(row[headerMap.store ?? -1])
    const rowStore = resolveStore(branchText, options.stores, options.preferredStoreId)
    if (rowStore) detectedStoreIds.push(rowStore.id)

    const employeeCode = readCell(row[headerMap.employeeCode ?? -1])
    const importedName = readCell(row[headerMap.employeeName ?? -1])
    const employeeMatch = matchEmployee(employeeCode, importedName, options.employees)
    const shiftText = buildShiftText(
      readCell(row[headerMap.shiftTime ?? -1]),
      readCell(row[headerMap.checkIn ?? -1]),
      readCell(row[headerMap.checkOut ?? -1])
    )

    if (!shiftText) continue

    shifts.push({
      employee: employeeMatch.employee,
      employeeName: employeeMatch.employee?.full_name || importedName || employeeCode,
      employeeCode,
      matchedBy: employeeMatch.matchedBy,
      date,
      shiftText,
    })
  }

  if (shifts.length === 0) {
    return emptyScheduleListResult(sheet.sheet)
  }

  const uniqueDates = Array.from(new Set(shifts.map(item => item.date))).sort()
  const headers = ['Nhân viên', ...uniqueDates.map(date => `Ngày ${Number(date.slice(8, 10))}`)]
  const columnMapping: Record<number, string> = {}
  uniqueDates.forEach((date, index) => {
    columnMapping[index + 1] = date
  })

  const rowMap = new Map<string, string[]>()
  const matchNotes: IposImportMatchNote[] = []

  for (const shift of shifts) {
    const key = shift.employee?.id || normalizeText(shift.employeeName)
    if (!rowMap.has(key)) {
      const row = [shift.employeeName, ...uniqueDates.map(() => '')]
      rowMap.set(key, row)
      matchNotes.push({
        employeeId: shift.employee?.id,
        employeeName: shift.employeeName,
        matchedBy: shift.matchedBy,
        importedName: shift.employeeName,
        importedCode: shift.employeeCode,
      })
    }

    const previewRow = rowMap.get(key)!
    const colIdx = uniqueDates.indexOf(shift.date) + 1
    previewRow[colIdx] = previewRow[colIdx]
      ? `${previewRow[colIdx]}\n${shift.shiftText}`
      : shift.shiftText
  }

  const firstDate = uniqueDates[0]
  const detectedStoreId = getMostCommon(detectedStoreIds) || options.preferredStoreId

  return {
    source: 'schedule-list',
    sourceSheet: sheet.sheet,
    headers,
    rows: Array.from(rowMap.values()),
    columnMapping,
    detectedStoreId,
    detectedMonth: firstDate ? Number(firstDate.slice(5, 7)) : undefined,
    detectedYear: firstDate ? Number(firstDate.slice(0, 4)) : undefined,
    matchNotes,
  }
}

function parseFallbackGridSheet(
  sheet: IposWorkbookSheet,
  options: IposAttendanceParseOptions
): IposAttendanceImportPreview {
  const rows = sheet.data.filter(row => Array.isArray(row))
  const period = detectGridPeriod(rows)
  const headerRowIndex = findGridHeaderRow(rows)
  if (headerRowIndex < 0) return emptyGridResult(sheet.sheet)

  const headerRow = rows[headerRowIndex]
  const nameColumn = headerRow.findIndex(cell => isEmployeeNameHeader(normalizeText(readCell(cell))))
  const nameColumnIndex = nameColumn >= 0 ? nameColumn : 0
  const dayColumns = headerRow.flatMap((cell, columnIndex) => {
    const raw = readCell(cell)
    const fullDate = parseDateCell(raw)
    if (fullDate) return [{ columnIndex, date: fullDate }]

    const dayMatch = normalizeText(raw).match(/^\s*(?:ngay\s*)?(\d{1,2})(?:\s|$)/)
    if (!dayMatch || !period) return []
    const day = Number(dayMatch[1])
    if (day < 1 || day > new Date(period.year, period.month, 0).getDate()) return []
    return [{ columnIndex, date: formatDateParts(period.year, period.month, day) }]
  })

  if (dayColumns.length === 0) return emptyGridResult(sheet.sheet)

  const headers = ['Nhân viên', ...dayColumns.map(item => `Ngày ${item.date.slice(8, 10)}`)]
  const columnMapping: Record<number, string> = {}
  dayColumns.forEach((item, index) => {
    columnMapping[index + 1] = item.date
  })

  const rowMap = new Map<string, string[]>()
  const matchNotes: IposImportMatchNote[] = []

  for (const row of rows.slice(headerRowIndex + 1)) {
    const importedName = readCell(row[nameColumnIndex])
    if (!importedName || isGridSummaryRow(importedName)) continue

    const importedCode = nameColumnIndex > 0 ? readCell(row[nameColumnIndex - 1]) : ''
    const employeeMatch = matchEmployee(importedCode, importedName, options.employees)
    const key = employeeMatch.employee?.id || normalizeText(importedName)
    const values = dayColumns.map(item => readCell(row[item.columnIndex]))
    if (!values.some(Boolean)) continue

    const existing = rowMap.get(key)
    if (!existing) {
      rowMap.set(key, [employeeMatch.employee?.full_name || importedName, ...values])
      matchNotes.push({
        employeeId: employeeMatch.employee?.id,
        employeeName: employeeMatch.employee?.full_name || importedName,
        matchedBy: employeeMatch.matchedBy,
        importedName,
        importedCode,
      })
      continue
    }

    values.forEach((value, index) => {
      if (!value) return
      const targetIndex = index + 1
      existing[targetIndex] = existing[targetIndex]
        ? `${existing[targetIndex]}\n${value}`
        : value
    })
  }

  return {
    source: 'grid',
    sourceSheet: sheet.sheet,
    headers,
    rows: Array.from(rowMap.values()),
    columnMapping,
    detectedMonth: period?.month,
    detectedYear: period?.year,
    matchNotes,
  }
}

function emptyGridResult(sourceSheet: string): IposAttendanceImportPreview {
  return {
    source: 'grid',
    sourceSheet,
    headers: ['Nhân viên'],
    rows: [],
    columnMapping: {},
    matchNotes: [],
  }
}

function detectGridPeriod(rows: unknown[][]): { month: number; year: number } | null {
  for (const row of rows.slice(0, 12)) {
    const text = row.map(cell => readCell(cell)).join(' ')
    const match = text.match(/(?:tháng|thang)\s*(\d{1,2})\s*[/-]\s*(\d{4})/i)
    if (match) return { month: Number(match[1]), year: Number(match[2]) }
  }
  return null
}

function findGridHeaderRow(rows: unknown[][]): number {
  for (let index = 0; index < Math.min(rows.length, 20); index++) {
    const row = rows[index]
    const normalized = row.map(cell => normalizeText(readCell(cell)))
    if (normalized.some(isEmployeeNameHeader)) return index
    const numericHeaders = normalized.filter(value => /^\d{1,2}$/.test(value) && Number(value) >= 1 && Number(value) <= 31)
    if (numericHeaders.length >= 2) return index
  }
  return -1
}

function isGridSummaryRow(value: string): boolean {
  const normalized = normalizeText(value)
  return normalized === 'stt' || normalized.includes('tong') || normalized.includes('thong ke') || normalized.includes('generated')
}

function emptyScheduleListResult(sourceSheet: string): IposAttendanceImportPreview {
  return {
    source: 'schedule-list',
    sourceSheet,
    headers: ['Nhân viên'],
    rows: [],
    columnMapping: {},
    matchNotes: [],
  }
}

function findScheduleHeader(rows: unknown[][]): { rowIndex: number; headerMap: HeaderMap } {
  for (let rowIndex = 0; rowIndex < Math.min(rows.length, 30); rowIndex++) {
    const headerMap: HeaderMap = {}
    rows[rowIndex].forEach((cell, index) => {
      const normalized = normalizeText(readCell(cell))
      if (isDateHeader(normalized)) headerMap.date = index
      if (isEmployeeNameHeader(normalized)) headerMap.employeeName = index
      if (isEmployeeCodeHeader(normalized)) headerMap.employeeCode = index
      if (isStoreHeader(normalized)) headerMap.store = index
      if (isShiftTimeHeader(normalized)) headerMap.shiftTime = index
      if (isCheckInHeader(normalized)) headerMap.checkIn = index
      if (isCheckOutHeader(normalized)) headerMap.checkOut = index
    })

    if (
      headerMap.date !== undefined &&
      headerMap.employeeName !== undefined &&
      headerMap.store !== undefined &&
      headerMap.shiftTime !== undefined
    ) {
      return { rowIndex, headerMap }
    }
  }

  return { rowIndex: -1, headerMap: {} }
}

function isDateHeader(value: string): boolean {
  return value === 'ngay' || value.includes('ngay lam')
}

function isEmployeeNameHeader(value: string): boolean {
  return value === 'nhan vien' || value.includes('ten nhan vien') || value.includes('ho va ten')
}

function isEmployeeCodeHeader(value: string): boolean {
  return value.includes('ma nhan vien') || value === 'ma nv'
}

function isStoreHeader(value: string): boolean {
  return value === 'chi nhanh' || value === 'cn' || value.includes('cua hang')
}

function isShiftTimeHeader(value: string): boolean {
  return value.includes('thoi gian ca lam viec') || value.includes('gio ca')
}

function isCheckInHeader(value: string): boolean {
  return value.includes('check in') || value.includes('check-in') || value.includes('gio vao')
}

function isCheckOutHeader(value: string): boolean {
  return value.includes('check out') || value.includes('check-out') || value.includes('gio ra')
}

function buildShiftText(shiftTime: string, checkIn: string, checkOut: string): string {
  const scheduled = parseTimeRange(shiftTime)
  const actualIn = normalizeTime(checkIn)
  const actualOut = normalizeTime(checkOut)
  if ((/\d/.test(checkIn) && !actualIn) || (/\d/.test(checkOut) && !actualOut)) return ''
  const scheduledSuffix = scheduled ? ` [Ca ${scheduled.start}-${scheduled.end}]` : ''

  if (actualIn && actualOut) return `${actualIn} - ${actualOut}${scheduledSuffix}`
  if (actualIn) return `${actualIn} - QCO${scheduledSuffix}`
  if (actualOut) return `QCI - ${actualOut}${scheduledSuffix}`
  if (scheduled) return `KCD${scheduledSuffix}`
  return ''
}

function parseTimeRange(value: string): { start: string; end: string } | null {
  const match = value.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/)
  if (!match) return null
  return {
    start: normalizeTime(match[1]),
    end: normalizeTime(match[2]),
  }
}

function normalizeTime(value: string): string {
  const match = value.match(/(\d{1,2}):(\d{2})/)
  if (!match) return ''
  const hour = Number(match[1])
  const minute = Number(match[2])
  if (hour > 23 || minute > 59) return ''
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

function matchEmployee(
  employeeCode: string,
  importedName: string,
  employees: IposAttendanceEmployee[]
): { employee: IposAttendanceEmployee | null; matchedBy: IposImportMatchNote['matchedBy'] } {
  const code = normalizeEmployeeCode(employeeCode)
  if (code) {
    const byCode = employees.find(employee => employeeCodesMatch(employee.employee_code, employeeCode))
    if (byCode) return { employee: byCode, matchedBy: 'code' }
  }

  const importedNameKey = normalizeText(importedName)
  if (!importedNameKey) return { employee: null, matchedBy: 'unmatched' }

  const exactName = employees.find(employee => normalizeText(employee.full_name) === importedNameKey)
  if (exactName) return { employee: exactName, matchedBy: 'name' }

  const fuzzyName = employees.find(employee => namesLookAlike(normalizeText(employee.full_name), importedNameKey))
  if (fuzzyName) return { employee: fuzzyName, matchedBy: 'name' }

  return { employee: null, matchedBy: 'unmatched' }
}

function employeeCodesMatch(existingCode: string | null | undefined, importedCode: string): boolean {
  const existing = normalizeEmployeeCode(existingCode || '')
  const imported = normalizeEmployeeCode(importedCode)
  if (!existing || !imported) return false
  if (existing === imported) return true

  const existingDigits = existing.replace(/\D/g, '')
  const importedDigits = imported.replace(/\D/g, '')
  return existingDigits !== '' && existingDigits === importedDigits
}

function namesLookAlike(employeeName: string, importedName: string): boolean {
  if (employeeName.includes(importedName) || importedName.includes(employeeName)) return true

  const importedTokens = importedName.split(' ').filter(Boolean)
  if (importedTokens.length < 2) return false

  const employeeTokens = new Set(employeeName.split(' ').filter(Boolean))
  const matchedTokens = importedTokens.filter(token => employeeTokens.has(token)).length
  return matchedTokens / importedTokens.length >= 0.75
}

function resolveStore(
  text: string,
  stores: IposAttendanceStore[],
  preferredStoreId?: string
): IposAttendanceStore | null {
  const branchCode = extractBranchCode(text)
  if (branchCode) {
    const byCode = stores.find(store => normalizeText(store.name).includes(branchCode))
    if (byCode) return byCode
  }

  const normalized = normalizeText(text)
  const byName = stores.find(store => {
    const storeName = normalizeText(store.name)
    return storeName.includes(normalized) || normalized.includes(storeName)
  })
  if (byName) return byName

  return stores.find(store => store.id === preferredStoreId) || null
}

function extractBranchCode(text: string): string {
  const normalized = normalizeText(text)
  const branchMatch = normalized.match(/(?:chi nhanh|cn)\s*(\d{3,})/)
  if (branchMatch) return branchMatch[1]

  const anyCode = normalized.match(/\b\d{3,}\b/)
  return anyCode?.[0] || ''
}

function parseDateCell(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return formatDateParts(value.getFullYear(), value.getMonth() + 1, value.getDate())
  }

  const raw = readCell(value)
  const iso = raw.match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/)
  if (iso) return formatDateParts(Number(iso[1]), Number(iso[2]), Number(iso[3]))

  const dmy = raw.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{4})/)
  if (dmy) return formatDateParts(Number(dmy[3]), Number(dmy[2]), Number(dmy[1]))

  return ''
}

function formatDateParts(year: number, month: number, day: number): string {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) return ''
  if (month < 1 || month > 12 || day < 1 || day > 31) return ''
  const date = new Date(Date.UTC(year, month - 1, day))
  if (
    date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) return ''
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function getMostCommon(values: string[]): string | undefined {
  const counts = new Map<string, number>()
  values.forEach(value => counts.set(value, (counts.get(value) || 0) + 1))
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0]
}

function readCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).replace(/\s+/g, ' ').trim()
}

function normalizeEmployeeCode(value: string): string {
  const normalized = normalizeText(value).toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (normalized === '' || normalized === '-') return ''
  return normalized
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}
