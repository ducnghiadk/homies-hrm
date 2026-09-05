import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

const { getImportWeekStarts, getMappedImportPreviewDates, mergeScheduleImportWorkbooks, consolidateScheduleRows, isSummaryOrHeaderEmployeeCell, cleanEmployeeDisplayName, normalizeEmployeeCanonicalKey, extractDateFromHeader, isNonWorkingScheduleCell } = await import('./schedule-import-batch.ts')

describe('getImportWeekStarts', () => {
  it('returns every unique Monday represented by a multi-week import', () => {
    assert.deepEqual(
      getImportWeekStarts(['2026-06-01', '2026-06-03', '2026-06-10', '2026-06-14']),
      ['2026-06-01', '2026-06-08']
    )
  })
})

describe('isNonWorkingScheduleCell', () => {
  it('recognizes common day-off markers without treating real shifts as off', () => {
    for (const value of ['OFF', 'Nghỉ', 'Nghỉ phép', 'Nghỉ làm', '--', '-']) {
      assert.equal(isNonWorkingScheduleCell(value), true, value)
    }
    assert.equal(isNonWorkingScheduleCell('Ca Sáng [08:30-12:00]'), false)
  })
})

describe('mergeScheduleImportWorkbooks', () => {
  it('merges many files into one preview and marks duplicate employee date shift cells', () => {
    const result = mergeScheduleImportWorkbooks(
      [
        {
          fileName: 'week-a.xlsx',
          rows: [
            ['Nhan vien', 'Thu 2 01/06/2026', 'Thu 3 02/06/2026'],
            ['Nguyen Van A', '08:00-12:00', '12:00-17:00'],
          ],
        },
        {
          fileName: 'week-b.xlsx',
          rows: [
            ['Nhan vien', 'Thu 2 01/06/2026'],
            ['Nguyen Van A', '08:00-12:00\n17:00-22:00'],
            ['Tran Thi B', '08:00-12:00'],
          ],
        },
      ],
      { weekDates: ['2026-06-01', '2026-06-02'] }
    )

    assert.deepEqual(result.headers, ['Nhan vien', '01/06/2026', '02/06/2026'])
    assert.deepEqual(result.columnMapping, { 1: '2026-06-01', 2: '2026-06-02' })
    assert.equal(result.rows.length, 2)
    assert.deepEqual(result.rows[0], ['Nguyen Van A', '08:00-12:00\n17:00-22:00', '12:00-17:00'])
    assert.deepEqual(result.rows[1], ['Tran Thi B', '08:00-12:00', ''])
    assert.equal(result.duplicates.length, 1)
    assert.equal(result.duplicates[0].employeeName, 'Nguyen Van A')
    assert.equal(result.duplicates[0].date, '2026-06-01')
    assert.equal(result.duplicates[0].shiftText, '08:00-12:00')
    assert.equal(result.fileSummaries.length, 2)
  })
})

describe('getMappedImportPreviewDates', () => {
  it('uses every mapped file date for batch preview instead of only one week', () => {
    const result = getMappedImportPreviewDates(
      {
        4: '2026-07-02',
        1: '2026-06-29',
        2: '2026-06-30',
        9: '2026-07-07',
        14: '2026-07-12',
        7: '2026-07-05',
      },
      ['2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30'],
      'file_date'
    )

    assert.deepEqual(result, [
      '2026-06-29',
      '2026-06-30',
      '2026-07-02',
      '2026-07-05',
      '2026-07-07',
      '2026-07-12',
    ])
  })

  it('uses current board week when matching by weekday', () => {
    const weekDates = ['2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29', '2026-08-30']

    assert.deepEqual(
      getMappedImportPreviewDates({ 1: '2026-06-29', 2: '2026-06-30' }, weekDates, 'current_week'),
      weekDates
    )
  })
})

describe('consolidateScheduleRows', () => {
  it('deduplicates employee rows from multiple weeks/blocks within a single file and combines shifts', () => {
    const rawRows = [
      ['Phạm Nguyễn Đông Duy', '', 'Ca Sáng [08:30-12:00]', ''],
      ['Nguyễn Thị Kiều Ý', 'Ca Sáng [08:30-12:00]', '', 'Ca Tối [17:00-22:00]'],
      ['Tổng ca / giờ', '1', '1', '1'],
      ['Phạm Nguyễn Đông Duy', 'Ca Trưa [12:00-17:00]', 'Ca Trưa [12:00-17:00]', 'Ca Tối [17:00-22:00]'],
      ['Nguyễn Thị Kiều Ý', '', 'Ca Trưa [12:00-17:00]', ''],
      ['Huỳnh Lê Kiều Linh', 'Ca Sáng [08:30-12:00]', '', ''],
    ]

    const consolidated = consolidateScheduleRows(rawRows, 4)

    assert.equal(consolidated.length, 3) // Only 3 distinct employees: Đông Duy, Kiều Ý, Kiều Linh
    assert.deepEqual(consolidated[0], [
      'Phạm Nguyễn Đông Duy',
      'Ca Trưa [12:00-17:00]',
      'Ca Sáng [08:30-12:00]\nCa Trưa [12:00-17:00]',
      'Ca Tối [17:00-22:00]',
    ])
    assert.deepEqual(consolidated[1], [
      'Nguyễn Thị Kiều Ý',
      'Ca Sáng [08:30-12:00]',
      'Ca Trưa [12:00-17:00]',
      'Ca Tối [17:00-22:00]',
    ])
    assert.deepEqual(consolidated[2], [
      'Huỳnh Lê Kiều Linh',
      'Ca Sáng [08:30-12:00]',
      '',
      '',
    ])
  })

  it('filters out summary, statistics and header rows correctly', () => {
    assert.equal(isSummaryOrHeaderEmployeeCell('Tổng số ca'), true)
    assert.equal(isSummaryOrHeaderEmployeeCell('Ghi chú'), true)
    assert.equal(isSummaryOrHeaderEmployeeCell('Họ và tên'), true)
    assert.equal(isSummaryOrHeaderEmployeeCell('STT'), true)
    assert.equal(isSummaryOrHeaderEmployeeCell('Nguyễn Thị Kiều Ý'), false)
  })

  it('normalizes employee canonical keys across different role suffixes and formats', () => {
    assert.equal(cleanEmployeeDisplayName('1. Phạm Nguyễn Đông Duy (Pha chế)'), 'Phạm Nguyễn Đông Duy')
    assert.equal(cleanEmployeeDisplayName('Phạm Nguyễn Đông Duy (Thu ngân)'), 'Phạm Nguyễn Đông Duy')
    assert.equal(cleanEmployeeDisplayName('Phạm Nguyễn Đông Duy [8 ca | 33 giờ]'), 'Phạm Nguyễn Đông Duy')
    assert.equal(cleanEmployeeDisplayName('Phạm Nguyễn Đông Duy - Thu ngân'), 'Phạm Nguyễn Đông Duy')
    assert.equal(normalizeEmployeeCanonicalKey('Phạm\u00A0Nguyễn\u00A0Đông\u00A0Duy (Pha chế)'), 'pham nguyen dong duy')
  })

  it('merges multi-block vertical weekly tables from a single sheet into 1 row per employee across all weeks', () => {
    const singleSheetMultiBlock = [
      // Block 1 (Week 1: 29/06 - 05/07)
      ['Họ và tên', '29/06/2026', '30/06/2026'],
      ['1. Phạm Nguyễn Đông Duy (Pha chế)', '', 'Ca Sáng [08:30-12:00]'],
      ['Nguyễn Thị Kiều Ý', 'Ca Sáng [08:30-12:00]', ''],
      // Block 2 (Week 2: 06/07 - 12/07)
      ['Nhân viên', '06/07/2026', '07/07/2026'],
      ['Phạm Nguyễn Đông Duy (Thu ngân)', 'Ca Trưa [12:00-17:00]', ''],
      ['Nguyễn Thị Kiều Ý (Pha chế)', '', 'Ca Tối [17:00-22:00]'],
      ['Huỳnh Lê Kiều Linh', 'Ca Sáng [08:30-12:00]', 'Ca Trưa [12:00-17:00]'],
    ]

    const result = mergeScheduleImportWorkbooks(
      [{ fileName: 'Lich-5-Tuan.xlsx', rows: singleSheetMultiBlock }],
      { weekDates: ['2026-06-29', '2026-06-30'] }
    )

    // Should detect all 4 distinct dates across both blocks: 29/06, 30/06, 06/07, 07/07
    assert.deepEqual(result.headers, ['Nhan vien', '29/06/2026', '30/06/2026', '06/07/2026', '07/07/2026'])
    assert.deepEqual(result.columnMapping, {
      1: '2026-06-29',
      2: '2026-06-30',
      3: '2026-07-06',
      4: '2026-07-07',
    })
    // Exactly 3 unique employees (Đông Duy, Kiều Ý, Kiều Linh)
    assert.equal(result.rows.length, 3)

    // Phạm Nguyễn Đông Duy's shifts from Block 1 (col 2 = 30/06) and Block 2 (col 3 = 06/07) are merged
    assert.deepEqual(result.rows[0], [
      'Phạm Nguyễn Đông Duy',
      '',
      'Ca Sáng [08:30-12:00]',
      'Ca Trưa [12:00-17:00]',
      '',
    ])

    // Nguyễn Thị Kiều Ý's shifts from Block 1 (col 1 = 29/06) and Block 2 (col 4 = 07/07) are merged
    assert.deepEqual(result.rows[1], [
      'Nguyễn Thị Kiều Ý',
      'Ca Sáng [08:30-12:00]',
      '',
      '',
      'Ca Tối [17:00-22:00]',
    ])

    // Huỳnh Lê Kiều Linh from Block 2
    assert.deepEqual(result.rows[2], [
      'Huỳnh Lê Kiều Linh',
      '',
      '',
      'Ca Sáng [08:30-12:00]',
      'Ca Trưa [12:00-17:00]',
    ])
  })

  it('strictly rejects shift time intervals from being extracted as dates', () => {
    assert.equal(extractDateFromHeader('Ca Sáng [08:30-12:00]'), null)
    assert.equal(extractDateFromHeader('Ca Trưa [12:00-17:00]'), null)
    assert.equal(extractDateFromHeader('Ca Tối [17:00-22:00]'), null)
    assert.equal(extractDateFromHeader('Ca Sáng [08:30-10:00]'), null)
    assert.equal(extractDateFromHeader('Pha chế [08:30-12:00]'), null)
    assert.equal(extractDateFromHeader('Thu ngân [12:00-17:00]'), null)
    assert.equal(extractDateFromHeader('Tổng số ca: 8'), null)
    assert.equal(extractDateFromHeader('8 ca | 33 giờ'), null)
    // Valid dates must still extract properly
    assert.equal(extractDateFromHeader('29/06/2026'), '2026-06-29')
    assert.equal(extractDateFromHeader('Thứ 2 (29/06)'), '2026-06-29')
    assert.equal(extractDateFromHeader('T2 - 29/06'), '2026-06-29')
    assert.equal(extractDateFromHeader('02/08/2026'), '2026-08-02')
  })

  it('consolidates 5-week schedule sheet with 6 distinct employees into exactly 6 rows and 35 date columns without creating fake dates', () => {
    const datesWeek1 = ['29/06/2026', '30/06/2026', '01/07/2026', '02/07/2026', '03/07/2026', '04/07/2026', '05/07/2026']
    const datesWeek2 = ['06/07/2026', '07/07/2026', '08/07/2026', '09/07/2026', '10/07/2026', '11/07/2026', '12/07/2026']
    const datesWeek3 = ['13/07/2026', '14/07/2026', '15/07/2026', '16/07/2026', '17/07/2026', '18/07/2026', '19/07/2026']
    const datesWeek4 = ['20/07/2026', '21/07/2026', '22/07/2026', '23/07/2026', '24/07/2026', '25/07/2026', '26/07/2026']
    const datesWeek5 = ['27/07/2026', '28/07/2026', '29/07/2026', '30/07/2026', '31/07/2026', '01/08/2026', '02/08/2026']

    const emps = [
      'Huỳnh Lê Kiều Linh',
      'Nguyễn Thị Kiều Ý',
      'Nguyễn Thanh Thiện',
      'Lê Minh Lộc',
      'Trần Công Huy',
      'Phạm Nguyễn Đông Duy',
    ]

    const full5WeekRows: string[][] = []

    // Build 5 blocks
    const weekDateBlocks = [datesWeek1, datesWeek2, datesWeek3, datesWeek4, datesWeek5]
    weekDateBlocks.forEach((weekDates, wIdx) => {
      full5WeekRows.push(['Nhân viên', ...weekDates])
      emps.forEach(empName => {
        full5WeekRows.push([
          `${empName} (Pha chế)`,
          'Ca Sáng [08:30-12:00]',
          'Ca Trưa [12:00-17:00]',
          'Ca Tối [17:00-22:00]',
          '',
          'Ca Sáng [08:30-12:00]',
          '',
          'Ca Tối [17:00-22:00]',
        ])
      })
      full5WeekRows.push(['Tổng số ca / giờ', '5', '5', '5', '0', '5', '0', '5'])
    })

    const result = mergeScheduleImportWorkbooks(
      [{ fileName: 'Lich-5-Tuan-429.xlsx', rows: full5WeekRows }],
      { weekDates: datesWeek1 }
    )

    // MUST HAVE EXACTLY 35 date columns (29/06 to 02/08)
    assert.equal(result.headers.length, 36) // 1 column for employee name + 35 date columns
    assert.equal(result.headers[1], '29/06/2026')
    assert.equal(result.headers[35], '02/08/2026')

    // MUST HAVE EXACTLY 6 distinct employees!
    assert.equal(result.rows.length, 6)

    // Verify all 6 names
    assert.deepEqual(result.rows.map(r => r[0]), emps)

    // Verify Kiều Linh has shifts mapped across all 35 columns
    assert.equal(result.rows[0][1], 'Ca Sáng [08:30-12:00]') // 29/06
    assert.equal(result.rows[0][8], 'Ca Sáng [08:30-12:00]') // 06/07
    assert.equal(result.rows[0][15], 'Ca Sáng [08:30-12:00]') // 13/07
    assert.equal(result.rows[0][22], 'Ca Sáng [08:30-12:00]') // 20/07
    assert.equal(result.rows[0][29], 'Ca Sáng [08:30-12:00]') // 27/07
  })
})
