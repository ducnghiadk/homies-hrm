export type ScheduleImportWorkbook = {
  fileName: string
  rows: string[][]
}

export type ScheduleImportDuplicate = {
  employeeName: string
  date: string
  shiftText: string
  sourceFiles: string[]
}

export type ScheduleImportFileSummary = {
  fileName: string
  rowCount: number
  dateCount: number
  error?: string
}

export type ScheduleImportBatchResult = {
  headers: string[]
  rows: string[][]
  columnMapping: Record<number, string>
  duplicates: ScheduleImportDuplicate[]
  fileSummaries: ScheduleImportFileSummary[]
}

export type ImportDateMappingMode = 'file_date' | 'current_week'

type MergeOptions = {
  weekDates: string[]
  extractDateFromHeader?: (header: string) => string | null
}

export function defaultExtractDateFromHeader(header: string, defaultYear = new Date().getFullYear()): string | null {
  if (!header) return null
  const text = String(header || '').trim()
  if (!text) return null

  // 1. MUST NOT be a time interval or shift notes
  if (/\d{1,2}:\d{2}/.test(text)) return null
  if (/ca\s*(sáng|trưa|chiều|tối|đêm|gãy|lẻ|full|part)/i.test(text)) return null
  if (/(pha chế|thu ngân|phục vụ|bếp|kiểm kho|quản lý|trưởng ca)/i.test(text)) return null
  if (/^(\d+\s*ca|\d+(\.\d+)?\s*giờ)/i.test(text)) return null

  // 2. Format yyyy-MM-dd (e.g. 2026-06-29)
  const isoMatch = text.match(/\b(\d{4})[/-](\d{1,2})[/-](\d{1,2})\b/)
  if (isoMatch) {
    const y = Number(isoMatch[1])
    const m = Number(isoMatch[2])
    const d = Number(isoMatch[3])
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 2020 && y <= 2035) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
  }

  // 3. Format dd/MM/yyyy or dd-MM-yyyy (e.g. 29/06/2026)
  const dmyMatch = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/)
  if (dmyMatch) {
    const d = Number(dmyMatch[1])
    const m = Number(dmyMatch[2])
    const y = Number(dmyMatch[3])
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12 && y >= 2020 && y <= 2035) {
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
  }

  // 4. Format dd/MM (e.g. "29/06", "Thứ 2 (29/06)", "T2 - 29/06", "29-06")
  const dmMatch = text.match(/(?:^|[^\d:])(\d{1,2})[/-](\d{1,2})(?:$|[^\d:/-])/)
  if (dmMatch) {
    const d = Number(dmMatch[1])
    const m = Number(dmMatch[2])
    if (d >= 1 && d <= 31 && m >= 1 && m <= 12) {
      return `${defaultYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    }
  }

  return null
}

export function extractDateFromHeader(header: string, defaultYear = new Date().getFullYear()): string | null {
  return defaultExtractDateFromHeader(header, defaultYear)
}

export function removeVietnameseTones(str: string): string {
  return (str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
}

export function cleanEmployeeDisplayName(rawName: string): string {
  if (!rawName) return ''
  return String(rawName)
    .replace(/[\u00A0\u1680\u180e\u2000-\u200b\u202f\u205f\u3000\ufeff]/g, ' ')
    .replace(/^\s*(\d+[\.\-\)]\s*)+/g, '') // remove leading "1. ", "02 - ", "3) "
    .replace(/\s*\([^)]*\)/g, '') // remove trailing "(Pha chế)", "(Thu ngân)", "(NV)"
    .replace(/\s*\[[^\]]*\]/g, '') // remove trailing "[Pha chế]"
    .replace(/\s*[-–]\s*(pha chế|thu ngân|phục vụ|bếp|part-time|full-time|nv|quản lý|trưởng ca|tổ trưởng|học việc|thử việc|kho|429|hbp|lvs).*/gi, '')
    .replace(/\d+\s*ca.*/gi, '')
    .replace(/\d+(\.\d+)?\s*giờ.*/gi, '')
    .replace(/\|\s*/g, '')
    .replace(/[\r\n]+/g, ' ')
    .trim()
}

export function normalizeEmployeeCanonicalKey(rawName: string): string {
  const cleaned = cleanEmployeeDisplayName(rawName)
  return removeVietnameseTones(cleaned).toLowerCase().replace(/\s+/g, ' ').trim()
}

export function isSummaryOrHeaderEmployeeCell(name: string): boolean {
  const clean = cleanEmployeeDisplayName(name)
  const normalized = normalizeEmployeeCanonicalKey(clean)
  if (!normalized) return true
  const keywords = [
    'tong', 'tong ca', 'tong gio', 'tong so ca', 'ghi chu', 'thong ke', 'stt',
    'ho va ten', 'ho ten', 'nhan vien', 'chuc vu', 'vi tri', 'bo phan', 'co so',
    'ca lam', 'lich lam', 'ngay', 'thu'
  ]
  return keywords.some(k => normalized === k || normalized.startsWith(k + ':') || normalized.startsWith(k + ' '))
}

export function isDateHeaderRow(
  row: string[],
  extractDateFn: (h: string) => string | null
): boolean {
  if (!row || row.length < 2) return false

  // 1. Cột đầu tiên phải là ô tiêu đề/STT/tổng kết, KHÔNG ĐƯỢC là tên nhân viên thật
  const rawFirstCell = String(row[0] || '').trim()
  if (rawFirstCell && !isSummaryOrHeaderEmployeeCell(rawFirstCell)) {
    return false
  }

  // 2. Toàn bộ dòng KHÔNG ĐƯỢC chứa khung giờ ca làm (vd 08:30-12:00)
  for (let i = 1; i < row.length; i++) {
    const val = String(row[i] || '')
    if (/\d{1,2}:\d{2}/.test(val)) return false
  }

  // 3. Phải có ít nhất 2 cột chứa ngày hoặc Thứ
  let dateCount = 0
  for (let i = 1; i < row.length; i++) {
    const val = String(row[i] || '').trim()
    if (!val) continue
    if (extractDateFn(val)) {
      dateCount++
    } else {
      const lower = removeVietnameseTones(val.toLowerCase())
      if (['thu 2', 'thu 3', 'thu 4', 'thu 5', 'thu 6', 'thu 7', 'chu nhat', 't2', 't3', 't4', 't5', 't6', 't7', 'cn'].some(day => lower === day || lower.startsWith(day + ' ') || lower.endsWith(' ' + day) || lower.includes(`(${day})`))) {
        dateCount++
      }
    }
  }
  return dateCount >= 2
}

export function splitShiftCell(value: string): string[] {
  return String(value || '')
    .split(/[\n;/]|<br\s*\/?>/i)
    .map(item => item.trim())
    .filter(Boolean)
}

export function isNonWorkingScheduleCell(value: string): boolean {
  const normalized = removeVietnameseTones(String(value || '').trim()).toLowerCase()
  return normalized === '' || ['-', '--', 'off', 'nghi', 'nghi phep', 'nghi lam'].includes(normalized)
}

export function getMappedImportPreviewDates(
  columnMapping: Record<number, string>,
  weekDates: string[],
  dateMappingMode: ImportDateMappingMode
): string[] {
  if (dateMappingMode === 'current_week') return weekDates

  return Array.from(new Set(Object.values(columnMapping).filter(Boolean))).sort()
}

export function getImportWeekStarts(importDates: string[], fallbackWeekDates: string[] = []): string[] {
  const candidateDates = importDates.length > 0 ? importDates : fallbackWeekDates
  const weekStarts = new Set<string>()

  candidateDates.forEach(date => {
    const match = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!match) return

    const year = Number(match[1])
    const month = Number(match[2])
    const day = Number(match[3])
    const parsed = new Date(`${date}T12:00:00`)
    if (
      Number.isNaN(parsed.getTime())
      || parsed.getFullYear() !== year
      || parsed.getMonth() + 1 !== month
      || parsed.getDate() !== day
    ) return

    const dayOfWeek = parsed.getDay()
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    parsed.setDate(parsed.getDate() - daysFromMonday)
    weekStarts.add([
      parsed.getFullYear(),
      String(parsed.getMonth() + 1).padStart(2, '0'),
      String(parsed.getDate()).padStart(2, '0'),
    ].join('-'))
  })

  return Array.from(weekStarts).sort()
}

export function mergeScheduleImportWorkbooks(
  workbooks: ScheduleImportWorkbook[],
  options: MergeOptions
): ScheduleImportBatchResult {
  const extractDateFromHeader = options.extractDateFromHeader || defaultExtractDateFromHeader
  const dateOrder: string[] = []
  const employeeOrder: string[] = []
  const employeeDisplayNames = new Map<string, string>()
  const cellShifts = new Map<string, Map<string, Map<string, Set<string>>>>()
  const duplicates: ScheduleImportDuplicate[] = []
  const fileSummaries: ScheduleImportFileSummary[] = []

  workbooks.forEach(workbook => {
    const rows = workbook.rows || []
    if (rows.length < 2) {
      fileSummaries.push({
        fileName: workbook.fileName,
        rowCount: 0,
        dateCount: 0,
        error: 'File khong co du lieu lich',
      })
      return
    }

    let activeDateMap: Record<number, string> = {}
    let importedRowsInFile = 0
    let detectedDatesInFileCount = 0

    // Xử lý từng dòng: hỗ trợ cả bảng ma trận đơn lẫn nhiều khối bảng xếp chồng dọc (multi-block)
    rows.forEach((row, rowIdx) => {
      if (row.length < 2) return

      // Kiểm tra xem dòng này có phải là dòng tiêu đề ngày (Header Row) hay không
      if (rowIdx === 0 || isDateHeaderRow(row, extractDateFromHeader)) {
        activeDateMap = {}
        row.forEach((cellHeader, colIdx) => {
          if (colIdx === 0) return
          const detectedDate = extractDateFromHeader(cellHeader)
          const finalDate = detectedDate || (rowIdx === 0 ? options.weekDates[colIdx - 1] || '' : '')
          if (finalDate) {
            activeDateMap[colIdx] = finalDate
            if (!dateOrder.includes(finalDate)) {
              dateOrder.push(finalDate)
            }
            detectedDatesInFileCount++
          }
        })
        return
      }

      // Nếu chưa có dateMap thì bỏ qua dòng rác trước header
      if (Object.keys(activeDateMap).length === 0) return

      const rawEmployeeName = String(row[0] || '').trim()
      if (!rawEmployeeName) return
      if (isSummaryOrHeaderEmployeeCell(rawEmployeeName)) return

      const cleanDisplayName = cleanEmployeeDisplayName(rawEmployeeName) || rawEmployeeName
      const employeeKey = normalizeEmployeeCanonicalKey(rawEmployeeName)
      if (!employeeKey) return

      importedRowsInFile += 1

      if (!employeeDisplayNames.has(employeeKey)) {
        employeeDisplayNames.set(employeeKey, cleanDisplayName)
        employeeOrder.push(employeeKey)
      }

      if (!cellShifts.has(employeeKey)) {
        cellShifts.set(employeeKey, new Map())
      }
      const employeeCells = cellShifts.get(employeeKey)!

      Object.entries(activeDateMap).forEach(([colIdxText, date]) => {
        if (!date) return
        const shifts = splitShiftCell(row[Number(colIdxText)] || '')
        if (shifts.length === 0) return

        if (!employeeCells.has(date)) {
          employeeCells.set(date, new Map())
        }
        const shiftSources = employeeCells.get(date)!

        shifts.forEach(shiftText => {
          if (!shiftSources.has(shiftText)) {
            shiftSources.set(shiftText, new Set())
          }
          const sources = shiftSources.get(shiftText)!
          if (sources.size > 0 && !sources.has(workbook.fileName)) {
            duplicates.push({
              employeeName: cleanDisplayName,
              date,
              shiftText,
              sourceFiles: [...sources, workbook.fileName],
            })
          }
          sources.add(workbook.fileName)
        })
      })
    })

    fileSummaries.push({
      fileName: workbook.fileName,
      rowCount: importedRowsInFile,
      dateCount: detectedDatesInFileCount,
    })
  })

  dateOrder.sort()

  const headers = ['Nhan vien', ...dateOrder.map(date => {
    const [year, month, day] = date.split('-')
    return `${day}/${month}/${year}`
  })]

  const columnMapping: Record<number, string> = {}
  dateOrder.forEach((date, idx) => {
    columnMapping[idx + 1] = date
  })

  const rows = employeeOrder.map(employeeKey => {
    const employeeCells = cellShifts.get(employeeKey)
    return [
      employeeDisplayNames.get(employeeKey) || employeeKey,
      ...dateOrder.map(date => {
        const shiftSources = employeeCells?.get(date)
        if (!shiftSources) return ''
        return [...shiftSources.keys()].join('\n')
      }),
    ]
  })

  return {
    headers,
    rows,
    columnMapping,
    duplicates,
    fileSummaries,
  }
}

export function consolidateScheduleRows(
  rows: string[][],
  columnCount?: number
): string[][] {
  if (!rows || rows.length === 0) return []

  const employeeOrder: string[] = []
  const employeeDisplayNames = new Map<string, string>()
  const cellShifts = new Map<string, Map<number, Set<string>>>()

  rows.forEach(row => {
    const rawName = String(row[0] || '').trim()
    if (!rawName) return
    if (isSummaryOrHeaderEmployeeCell(rawName)) return

    const key = normalizeEmployeeCanonicalKey(rawName)
    if (!key) return
    const cleanDisplay = cleanEmployeeDisplayName(rawName) || rawName

    if (!employeeDisplayNames.has(key)) {
      employeeDisplayNames.set(key, cleanDisplay)
      employeeOrder.push(key)
    }

    if (!cellShifts.has(key)) {
      cellShifts.set(key, new Map())
    }
    const empCells = cellShifts.get(key)!

    const maxCols = columnCount !== undefined ? columnCount : row.length
    for (let c = 1; c < maxCols; c++) {
      const cellVal = row[c]
      if (!cellVal) continue
      const shifts = splitShiftCell(cellVal)
      if (shifts.length === 0) continue

      if (!empCells.has(c)) {
        empCells.set(c, new Set())
      }
      const set = empCells.get(c)!
      shifts.forEach(s => {
        if (s && s !== '--') set.add(s)
      })
    }
  })

  const targetColCount = columnCount !== undefined ? columnCount : Math.max(...rows.map(r => r.length), 1)

  return employeeOrder.map(key => {
    const displayName = employeeDisplayNames.get(key) || key
    const empCells = cellShifts.get(key)
    const resultRow = [displayName]

    for (let c = 1; c < targetColCount; c++) {
      const shiftSet = empCells?.get(c)
      if (!shiftSet || shiftSet.size === 0) {
        resultRow.push('')
      } else {
        resultRow.push(Array.from(shiftSet).join('\n'))
      }
    }
    return resultRow
  })
}
