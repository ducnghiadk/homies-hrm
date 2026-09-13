import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

describe('attendance schedule source of truth', () => {
  it('defines one canonical query that rejects drafts and checks the week status', () => {
    const serviceSource = readFileSync(new URL('../../lib/services/scheduling/schedule-service.ts', import.meta.url), 'utf8')
    const helperSource = serviceSource.match(
      /  static getPublishedSchedulesForStore\([\s\S]*?\r?\n  }\r?\n\r?\n  static getPeerSchedulesForSwap/
    )?.[0]

    assert.ok(helperSource)
    assert.match(helperSource, /schedule\.status === ['"]published['"]/
    )
    assert.match(helperSource, /this\.isWeekPublished\(storeId, this\.getWeekStartDate\(schedule\.date\)\)/)
  })

  it('keeps both attendance screens on the canonical published-schedule query', () => {
    const pageSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
    const serviceSource = readFileSync(new URL('../../lib/services/attendance/attendance-service.ts', import.meta.url), 'utf8')

    assert.match(pageSource, /ScheduleService\.getPublishedSchedulesForStore/)
    assert.doesNotMatch(pageSource, /const storeSchedules = mockSchedules\.filter/)
    assert.match(serviceSource, /ScheduleService\.getPublishedSchedulesForStore/)
  })

  it('keeps Excel schedule imports in draft until the week is explicitly published', () => {
    const managerSource = readFileSync(new URL('../../components/scheduling/ManagerSchedulingBoard.tsx', import.meta.url), 'utf8')
    const employeeSource = readFileSync(new URL('../../components/scheduling/EmployeeSchedulingBoard.tsx', import.meta.url), 'utf8')

    for (const source of [managerSource, employeeSource]) {
      const importHandler = source.match(/const handleConfirmImport[\s\S]*?setImportStep\(1\)/)?.[0]
      assert.ok(importHandler)
      assert.match(importHandler, /status:\s*['"]draft['"]/
      )
      assert.doesNotMatch(importHandler, /status:\s*['"]published['"]/
      )
    }
  })

  it('does not import inactive or unconfirmed cross-branch employees', () => {
    const managerSource = readFileSync(new URL('../../components/scheduling/ManagerSchedulingBoard.tsx', import.meta.url), 'utf8')
    const employeeSource = readFileSync(new URL('../../components/scheduling/EmployeeSchedulingBoard.tsx', import.meta.url), 'utf8')

    for (const source of [managerSource, employeeSource]) {
      const importHandler = source.match(/const handleConfirmImport[\s\S]*?setImportStep\(1\)/)?.[0]
      assert.ok(importHandler)
      assert.match(importHandler, /matchInfo\.status\s*===\s*['"]other_store['"]/)
      assert.match(importHandler, /emp\.status\s*===\s*['"]inactive['"]/) 
      assert.match(importHandler, /emp\.status\s*===\s*['"]resigned['"]/) 
      assert.doesNotMatch(source, /const effectiveStoreEmps = storeEmployees\.length > 0 \? storeEmployees :/)
    }
  })

  it('does not persist attendance for inactive or unconfirmed cross-branch employees', () => {
    const attendanceSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
    const importHandler = attendanceSource.match(/const handleExecuteSmartImport[\s\S]*?setIsImporting\(false\)/)?.[0]
    assert.ok(importHandler)
    assert.match(importHandler, /isStoreMatch\(/)
    assert.match(importHandler, /status\s*===\s*['"]manual['"]/)
    assert.match(importHandler, /status\s*===\s*['"]inactive['"]/) 
    assert.match(importHandler, /status\s*===\s*['"]resigned['"]|emp\.status\s*===\s*['"]resigned['"]/) 
  })

  it('splits multiple attendance shifts separated by slashes', () => {
    const attendanceSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
    const importHandler = attendanceSource.match(/const handleExecuteSmartImport[\s\S]*?setIsImporting\(false\)/)?.[0]
    assert.ok(importHandler)
    assert.match(importHandler, /splitIposAttendanceEntries\(cellVal\)/)
  })

  it('skips common day-off markers during schedule import', () => {
    const managerSource = readFileSync(new URL('../../components/scheduling/ManagerSchedulingBoard.tsx', import.meta.url), 'utf8')
    const employeeSource = readFileSync(new URL('../../components/scheduling/EmployeeSchedulingBoard.tsx', import.meta.url), 'utf8')

    for (const source of [managerSource, employeeSource]) {
      const importHandler = source.match(/const handleConfirmImport[\s\S]*?setImportStep\(1\)/)?.[0]
      assert.ok(importHandler)
      assert.match(importHandler, /isNonWorkingScheduleCell\(shiftEntry\)/)
    }
  })

  it('uses the selected attendance month as the grid import fallback', () => {
    const attendanceSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
    const fileHandler = attendanceSource.match(/const handleFileSelected[\s\S]*?const handleExecuteSmartImport/)?.[0]
    assert.ok(fileHandler)
    assert.match(fileHandler, /let detectedMonth = importSelectedMonth/)
    assert.match(fileHandler, /let detectedYear = importSelectedYear/)
  })

  it('matches attendance employees across canonical store IDs and Supabase UUIDs', () => {
    const attendanceSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
    const matcher = attendanceSource.match(/const getEmpMatchDetail[\s\S]*?const applyIposImportPreview/)?.[0]
    assert.ok(matcher)
    assert.match(matcher, /isStoreMatch\(mapped\.store_id, importSelectedStoreId\)/)
    assert.match(matcher, /isStoreMatch\(e\.store_id, importSelectedStoreId\)/)
    assert.doesNotMatch(matcher, /e\.store_id !== importSelectedStoreId/)
  })

  it('does not seed demo attendance rows when an uploaded file cannot be parsed', () => {
    const attendanceSource = readFileSync(new URL('./page.tsx', import.meta.url), 'utf8')
    const fileHandler = attendanceSource.match(/const handleFileSelected[\s\S]*?const handleExecuteSmartImport/)?.[0]
    assert.ok(fileHandler)
    assert.doesNotMatch(fileHandler, /build31DayRow\('Huỳnh Lê Kiều Linh'/)
    assert.match(fileHandler, /setImportError\(/)
  })

  it('keeps payroll on the same persisted attendance source as the timesheet', () => {
    const attendanceSource = readFileSync(new URL('../../lib/services/attendance/attendance-service.ts', import.meta.url), 'utf8')
    const payrollSource = readFileSync(new URL('../../lib/payroll-engine.ts', import.meta.url), 'utf8')

    assert.match(attendanceSource, /homies_timesheet_data/)
    assert.match(attendanceSource, /static getAttendanceRecordsForPeriod\(/)
    assert.match(payrollSource, /AttendanceService\.getAttendanceRecordsForPeriod\(/)
    assert.doesNotMatch(payrollSource, /mockAttendances\.filter\(/)
  })

  it('keeps adjacent shifts separate from check-in through checkout', () => {
    const attendanceSource = readFileSync(new URL('../../lib/services/attendance/attendance-service.ts', import.meta.url), 'utf8')
    const checkinSource = readFileSync(new URL('../checkin/page.tsx', import.meta.url), 'utf8')

    assert.match(attendanceSource, /a\.shift_id === liveRecord\.shift_id/)
    assert.match(checkinSource, /getTodayCheckin\(currentUser\.id, todaySchedule\?\.shift_id\)/)
    assert.match(checkinSource, /checkoutToday\(currentUser\.id, userPos\.lat, userPos\.lng, shift\?\.id\)/)
  })
})
