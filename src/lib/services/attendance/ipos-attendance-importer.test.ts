import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

type IposAttendanceEmployee = {
  id: string
  full_name: string
  employee_code?: string
  store_id?: string
}

type IposAttendanceStore = {
  id: string
  name: string
}

const {
  buildIposAttendanceImportRecord,
  buildIposAttendanceImportSlotId,
  parseIposAttendanceCell,
  parseIposAttendanceWorkbook,
  splitIposAttendanceEntries,
  upsertIposAttendanceImportSlot,
} = await import('./ipos-attendance-importer.ts')

const stores: IposAttendanceStore[] = [
  { id: 'store-001', name: 'Homies Milk Tea - Ho Ba Phan' },
  { id: 'store-002', name: 'Homies Milk Tea - Duong 429' },
]

const employees: IposAttendanceEmployee[] = [
  {
    id: 'emp-016',
    full_name: 'Nguyen Van A',
    employee_code: 'NV0016',
    store_id: 'store-002',
  },
  {
    id: 'emp-linh',
    full_name: 'Huỳnh Lê Kiều Linh',
    employee_code: '',
    store_id: 'store-002',
  },
]

describe('parseIposAttendanceWorkbook', () => {
  it('prefers schedule-list sheet, matches branch 429, and pivots actual punches by employee/day', () => {
    const result = parseIposAttendanceWorkbook(
      [
        {
          sheet: 'Bảng Chấm Công',
          data: [
            ['Bảng Chấm Công Tháng 07/2026'],
            ['Nhân viên', 'Ngày 27'],
            ['Nguyen Van A', ''],
          ],
        },
        {
          sheet: 'Danh sách theo lịch làm việc',
          data: [
            ['Ngày', 'Nhân viên', 'Mã nhân viên', 'Chi nhánh', 'Thời gian ca làm việc', 'Giờ check-in', 'Giờ check-out'],
            ['27/07/2026', 'Nguyen Van A', 'NV0016', 'Chi nhánh 429 - Trà Sữa Phô Mai Tươi Homies', '08:30-12:00', '08:31', ''],
            ['27/07/2026', 'Nguyen Van A', 'NV0016', 'Chi nhánh 429 - Trà Sữa Phô Mai Tươi Homies', '12:00-17:00', '', '17:09'],
            ['27/07/2026', 'Huynh Le Kieu Linh', '-', 'Chi nhánh 429 - Trà Sữa Phô Mai Tươi Homies', '17:00-22:00', '17:02', '22:01'],
          ],
        },
      ],
      { employees, stores }
    )

    assert.equal(result.source, 'schedule-list')
    assert.equal(result.sourceSheet, 'Danh sách theo lịch làm việc')
    assert.equal(result.detectedStoreId, 'store-002')
    assert.equal(result.detectedMonth, 7)
    assert.equal(result.detectedYear, 2026)
    assert.deepEqual(result.headers, ['Nhân viên', 'Ngày 27'])
    assert.deepEqual(result.columnMapping, { 1: '2026-07-27' })
    assert.equal(result.rows.length, 2)
    assert.deepEqual(result.rows[0], [
      'Nguyen Van A',
      '08:31 - QCO [Ca 08:30-12:00]\nQCI - 17:09 [Ca 12:00-17:00]',
    ])
    assert.deepEqual(result.rows[1], ['Huỳnh Lê Kiều Linh', '17:02 - 22:01 [Ca 17:00-22:00]'])
    assert.equal(result.matchNotes[0].matchedBy, 'code')
    assert.equal(result.matchNotes[1].matchedBy, 'name')
  })

  it('does not turn scheduled shift times into actual attendance when both punches are missing', () => {
    const result = parseIposAttendanceWorkbook(
      [
        {
          sheet: 'Danh sách theo lịch làm việc',
          data: [
            ['Ngày', 'Nhân viên', 'Mã nhân viên', 'Chi nhánh', 'Thời gian ca làm việc', 'Giờ check-in', 'Giờ check-out'],
            ['28/07/2026', 'Nguyen Van A', 'NV0016', 'Chi nhánh 429', '08:30-12:00', '', ''],
          ],
        },
      ],
      { employees, stores }
    )

    assert.deepEqual(result.rows, [['Nguyen Van A', 'KCD [Ca 08:30-12:00]']])
  })

  it('parses a monthly attendance grid when no schedule-list sheet exists', () => {
    const result = parseIposAttendanceWorkbook(
      [
        {
          sheet: 'Bảng Chấm Công',
          data: [
            ['Bảng Chấm Công Tháng 07/2026'],
            ['Nhân viên', 'Ngày 01', 'Ngày 02'],
            ['Nguyen Van A', '08:30 - 12:00', 'OFF'],
          ],
        },
      ],
      { employees, stores, preferredStoreId: 'store-002' }
    )

    assert.equal(result.source, 'grid')
    assert.deepEqual(result.headers, ['Nhân viên', 'Ngày 01', 'Ngày 02'])
    assert.deepEqual(result.columnMapping, { 1: '2026-07-01', 2: '2026-07-02' })
    assert.deepEqual(result.rows, [['Nguyen Van A', '08:30 - 12:00', 'OFF']])
    assert.equal(result.detectedMonth, 7)
    assert.equal(result.detectedYear, 2026)
  })

  it('skips schedule rows with impossible calendar dates', () => {
    const result = parseIposAttendanceWorkbook(
      [
        {
          sheet: 'Danh sách theo lịch làm việc',
          data: [
            ['Ngày', 'Nhân viên', 'Mã nhân viên', 'Chi nhánh', 'Thời gian ca làm việc', 'Giờ check-in', 'Giờ check-out'],
            ['31/02/2026', 'Nguyen Van A', 'NV0016', 'Chi nhánh 429', '08:30-12:00', '08:30', '12:00'],
          ],
        },
      ],
      { employees, stores }
    )

    assert.deepEqual(result.rows, [])
  })

  it('skips schedule rows with malformed check-in or check-out values', () => {
    const result = parseIposAttendanceWorkbook(
      [
        {
          sheet: 'Danh sách theo lịch làm việc',
          data: [
            ['Ngày', 'Nhân viên', 'Mã nhân viên', 'Chi nhánh', 'Thời gian ca làm việc', 'Giờ check-in', 'Giờ check-out'],
            ['01/07/2026', 'Nguyen Van A', 'NV0016', 'Chi nhánh 429', '08:30-12:00', '25:99', '12:00'],
          ],
        },
      ],
      { employees, stores }
    )

    assert.deepEqual(result.rows, [])
  })
})

describe('parseIposAttendanceCell', () => {
  it('keeps scheduled times separate from complete actual punches', () => {
    assert.deepEqual(
      parseIposAttendanceCell('08:31 - 12:02 [Ca 08:30-12:00]'),
      {
        kind: 'complete',
        actualIn: '08:31',
        actualOut: '12:02',
        scheduledIn: '08:30',
        scheduledOut: '12:00',
      }
    )
  })

  it('preserves missing checkout and missing checkin without fabricating a punch', () => {
    assert.deepEqual(
      parseIposAttendanceCell('08:31 - QCO [Ca 08:30-12:00]'),
      {
        kind: 'missing_checkout',
        actualIn: '08:31',
        scheduledIn: '08:30',
        scheduledOut: '12:00',
      }
    )
    assert.deepEqual(
      parseIposAttendanceCell('QCI - 12:05 [Ca 08:30-12:00]'),
      {
        kind: 'missing_checkin',
        actualOut: '12:05',
        scheduledIn: '08:30',
        scheduledOut: '12:00',
      }
    )
  })

  it('marks a scheduled row with no punches as no attendance', () => {
    assert.deepEqual(
      parseIposAttendanceCell('KCD [Ca 08:30-12:00]'),
      {
        kind: 'no_attendance',
        scheduledIn: '08:30',
        scheduledOut: '12:00',
      }
    )
  })

  it('rejects impossible clock values instead of creating a partial attendance record', () => {
    assert.equal(parseIposAttendanceCell('25:99 - 12:00'), null)
    assert.equal(parseIposAttendanceCell('08:30 - 12:00 [Ca 25:99-13:00]'), null)
  })
})

describe('splitIposAttendanceEntries', () => {
  it('splits multiple punches separated by slashes as separate entries', () => {
    assert.deepEqual(
      splitIposAttendanceEntries('08:30 - 12:00 / 13:00 - 17:00'),
      ['08:30 - 12:00', '13:00 - 17:00']
    )
  })
})

describe('buildIposAttendanceImportRecord', () => {
  it('creates payable hours only when both actual punches exist', () => {
    assert.deepEqual(
      buildIposAttendanceImportRecord('08:31 - 12:02 [Ca 08:30-12:00]'),
      {
        kind: 'complete',
        status: 'on_time',
        actualIn: '08:31',
        actualOut: '12:02',
        scheduledIn: '08:30',
        scheduledOut: '12:00',
        totalHours: 3.5,
      }
    )
    assert.equal(buildIposAttendanceImportRecord('08:31 - QCO [Ca 08:30-12:00]')?.totalHours, 0)
    assert.equal(buildIposAttendanceImportRecord('QCI - 12:05 [Ca 08:30-12:00]')?.totalHours, 0)
  })

  it('does not create an attendance record when the file only contains scheduled times', () => {
    assert.equal(buildIposAttendanceImportRecord('KCD [Ca 08:30-12:00]'), null)
  })
})

describe('upsertIposAttendanceImportSlot', () => {
  it('replaces the same imported employee/date/shift instead of appending payroll hours again', () => {
    const previousImport = {
      id: 'att-imp-old-random-id',
      scheduledIn: '08:30',
      scheduledOut: '12:00',
      actualIn: '08:31',
      actualOut: '12:02',
      totalHours: 3.5,
      editReason: 'Nhập thông minh từ file Excel iPOS',
    }
    const correctedImport = {
      ...previousImport,
      id: buildIposAttendanceImportSlotId('emp-016', '2026-07-27', previousImport),
      actualOut: '12:05',
      totalHours: 3.6,
    }

    const result = upsertIposAttendanceImportSlot([previousImport], correctedImport)

    assert.equal(result.length, 1)
    assert.deepEqual(result[0], correctedImport)
    assert.equal(
      correctedImport.id,
      buildIposAttendanceImportSlotId('emp-016', '2026-07-27', correctedImport)
    )
  })

  it('removes legacy duplicate imported slots before inserting the corrected slot', () => {
    const previousImport = {
      id: 'att-imp-old-random-id',
      scheduledIn: '08:30',
      scheduledOut: '12:00',
      actualIn: '08:31',
      actualOut: '12:02',
      totalHours: 3.5,
      editReason: 'Nhập thông minh từ file Excel iPOS',
    }
    const correctedImport = {
      ...previousImport,
      id: buildIposAttendanceImportSlotId('emp-016', '2026-07-27', previousImport),
      actualOut: '12:05',
      totalHours: 3.6,
    }

    const result = upsertIposAttendanceImportSlot([previousImport, { ...previousImport, id: 'att-imp-second-random-id' }], correctedImport)

    assert.deepEqual(result, [correctedImport])
  })
})
