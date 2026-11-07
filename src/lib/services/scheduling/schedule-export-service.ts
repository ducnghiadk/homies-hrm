import writeExcelFile, { type SheetData, type Cell } from 'write-excel-file/browser'

export type ScheduleExportEmployee = {
  id: string
  full_name: string
  employee_code?: string
  position_id?: string
}

export type ScheduleExportAssignment = {
  employee_id: string
  shift_id: string
  date: string
  notes?: string
  assigned_position_id?: string
}

export type ScheduleExportTemplate = {
  id: string
  name: string
  start_time?: string
  end_time?: string
}

export type ScheduleExportPosition = {
  id: string
  name: string
}

export type ExportWeekScheduleParams = {
  storeName: string
  weekStart: string
  weekDates: string[]
  employees: ScheduleExportEmployee[]
  assignments: ScheduleExportAssignment[]
  templates: ScheduleExportTemplate[]
  positions: ScheduleExportPosition[]
}

const DAY_LABELS = [
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
  'Chủ Nhật',
]

function formatDayHeader(dateStr: string, index: number): string {
  if (!dateStr) return DAY_LABELS[index] || `Ngày ${index + 1}`
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${DAY_LABELS[index]} (${parts[2]}/${parts[1]})`
  }
  return DAY_LABELS[index]
}

function formatDisplayDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`
  }
  return dateStr
}

export async function exportWeekScheduleToExcel(params: ExportWeekScheduleParams): Promise<void> {
  const {
    storeName,
    weekDates,
    employees,
    assignments,
    templates,
    positions,
  } = params

  const posMap = new Map<string, string>()
  positions.forEach(p => posMap.set(p.id, p.name))

  const tplMap = new Map<string, ScheduleExportTemplate>()
  templates.forEach(t => tplMap.set(t.id, t))

  // 1. Dòng tiêu đề lớn của bảng
  const fromDateStr = formatDisplayDate(weekDates[0] || '')
  const toDateStr = formatDisplayDate(weekDates[6] || '')
  const titleText = `BẢNG PHÂN CA TUẦN - ${storeName.toUpperCase()} (${fromDateStr} - ${toDateStr})`

  const rows: SheetData = []

  // Row 1: Banner tiêu đề
  const titleRow: Cell[] = [
    {
      value: titleText,
      fontWeight: 'bold',
      align: 'center',
      backgroundColor: '#2F6FA8',
      borderColor: '#1D3E61',
    },
  ]
  rows.push(titleRow)

  // Row 2: Header cột
  const headerRow: Cell[] = [
    { value: 'STT', fontWeight: 'bold', align: 'center', backgroundColor: '#E2E8F0', borderColor: '#CBD5E1' },
    { value: 'Mã NV', fontWeight: 'bold', align: 'center', backgroundColor: '#E2E8F0', borderColor: '#CBD5E1' },
    { value: 'Nhân viên', fontWeight: 'bold', align: 'left', backgroundColor: '#E2E8F0', borderColor: '#CBD5E1' },
    { value: 'Chức vụ', fontWeight: 'bold', align: 'center', backgroundColor: '#E2E8F0', borderColor: '#CBD5E1' },
    ...weekDates.map((d, i) => ({
      value: formatDayHeader(d, i),
      fontWeight: 'bold' as const,
      align: 'center' as const,
      backgroundColor: '#E2E8F0',
      borderColor: '#CBD5E1',
    })),
    { value: 'Tổng ca', fontWeight: 'bold', align: 'center', backgroundColor: '#CBD5E1', borderColor: '#94A3B8' },
  ]
  rows.push(headerRow)

  // Rows nhân viên
  employees.forEach((emp, empIdx) => {
    let empTotalShifts = 0
    const mainPosName = emp.position_id ? posMap.get(emp.position_id) || 'Nhân viên' : 'Nhân viên'

    const dateCells: Cell[] = weekDates.map(date => {
      const dayAsgs = assignments.filter(a => a.employee_id === emp.id && a.date === date)
      if (dayAsgs.length === 0) {
        return {
          value: '-',
          align: 'center',
          borderColor: '#E2E8F0',
        }
      }

      empTotalShifts += dayAsgs.length

      const shiftTexts = dayAsgs.map(asg => {
        const tpl = tplMap.get(asg.shift_id)
        const name = tpl?.name || asg.notes || 'Ca làm'
        const timeRange = tpl?.start_time && tpl?.end_time ? `[${tpl.start_time} - ${tpl.end_time}]` : ''
        const posId = asg.assigned_position_id || emp.position_id
        const posName = posId ? posMap.get(posId) : ''
        const posLabel = posName ? `(${posName})` : ''

        return [name, timeRange, posLabel].filter(Boolean).join(' ')
      })

      return {
        value: shiftTexts.join('\n'),
        align: 'left',
        wrap: true,
        borderColor: '#CBD5E1',
        backgroundColor: '#F8FAFC',
      }
    })

    const empRow: Cell[] = [
      { value: empIdx + 1, align: 'center', borderColor: '#CBD5E1' },
      { value: emp.employee_code || `NV-${empIdx + 1}`, align: 'center', borderColor: '#CBD5E1' },
      { value: emp.full_name, align: 'left', fontWeight: 'bold', borderColor: '#CBD5E1' },
      { value: mainPosName, align: 'center', borderColor: '#CBD5E1' },
      ...dateCells,
      { value: empTotalShifts, align: 'center', fontWeight: 'bold', backgroundColor: '#F1F5F9', borderColor: '#CBD5E1' },
    ]

    rows.push(empRow)
  })

  // Định nghĩa độ rộng cột (Column Widths)
  const columns = [
    { width: 6 },   // STT
    { width: 12 },  // Mã NV
    { width: 24 },  // Nhân viên
    { width: 16 },  // Chức vụ
    { width: 30 },  // Thứ 2
    { width: 30 },  // Thứ 3
    { width: 30 },  // Thứ 4
    { width: 30 },  // Thứ 5
    { width: 30 },  // Thứ 6
    { width: 30 },  // Thứ 7
    { width: 30 },  // Chủ Nhật
    { width: 12 },  // Tổng ca
  ]

  // Đặt tên file xuất
  const cleanStore = storeName
    .replace(/homies\s*milk\s*tea\s*[-–]?\s*/gi, '')
    .trim()
    .replace(/[^a-zA-Z0-9_\u00C0-\u024F\u1EA0-\u1EF9]/g, '_')
  const fileName = `Lich_Phan_Ca_${cleanStore || 'Homies'}_${weekDates[0] || 'Tuan'}.xlsx`

  await writeExcelFile(rows, {
    columns,
    sheet: 'Lịch Phân Ca Tuần',
  }).toFile(fileName)
}
