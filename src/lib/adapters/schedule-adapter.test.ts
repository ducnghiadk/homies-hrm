import test from 'node:test'
import assert from 'node:assert/strict'
import { repositoryConfig } from './repository-config.ts'
import { supabase } from '../supabase.ts'
import { mockShiftGrid } from '../mock-data-scheduling.ts'
import { scheduleAdapter } from './schedule-adapter.ts'

type FakeResult = {
  data: unknown
  error: { message: string } | null
}

function installSupabaseResult(result: FakeResult, onFrom?: () => void) {
  const originalFrom = supabase.from
  const chain = {
    select() { return chain },
    eq() { return chain },
    gte() { return chain },
    lte() { return chain },
    upsert() { return chain },
    update() { return chain },
    delete() { return chain },
    single() { return chain },
    then(resolve: (value: FakeResult) => unknown, reject?: (reason: unknown) => unknown) {
      return Promise.resolve(result).then(resolve, reject)
    },
  }

  Object.defineProperty(supabase, 'from', {
    configurable: true,
    value: () => {
      onFrom?.()
      return chain
    },
  })

  return () => {
    Object.defineProperty(supabase, 'from', {
      configurable: true,
      value: originalFrom,
    })
  }
}

test('does not replace an empty real schedule with mock shifts', async () => {
  const previousMode = repositoryConfig.useRealSupabase
  repositoryConfig.useRealSupabase = true
  mockShiftGrid.push({
    date: '2026-02-02',
    shift_id: 'shift-001',
    shift_name: 'Mock shift',
    shift_color: 'blue',
    employees: [{ id: 'employee-001', name: 'Mock employee' }],
  })
  const restore = installSupabaseResult({ data: [], error: null })

  try {
    const result = await scheduleAdapter.getShiftsByStoreAndWeek(
      'c0000000-0000-0000-0000-000000000001',
      '2026-02-02',
      '2026-02-08',
    )
    assert.deepEqual(result, [])
  } finally {
    restore()
    mockShiftGrid.pop()
    repositoryConfig.useRealSupabase = previousMode
  }
})

test('reports a failed real bulk assignment instead of returning a success count', async () => {
  const previousMode = repositoryConfig.useRealSupabase
  repositoryConfig.useRealSupabase = true
  const restore = installSupabaseResult({ data: null, error: { message: 'database unavailable' } })

  try {
    const result = await scheduleAdapter.bulkAssignShifts([{
      employee_id: 'e0000000-0000-0000-0000-000000000001',
      store_id: 'c0000000-0000-0000-0000-000000000001',
      shift_id: 'd0000000-0000-0000-0000-000000000001',
      date: '2026-02-02',
    }])
    assert.equal(result, 0)
  } finally {
    restore()
    repositoryConfig.useRealSupabase = previousMode
  }
})

test('reports a failed real publish instead of masking the database error', async () => {
  const previousMode = repositoryConfig.useRealSupabase
  repositoryConfig.useRealSupabase = true
  const restore = installSupabaseResult({ data: null, error: { message: 'database unavailable' } })

  try {
    const result = await scheduleAdapter.publishWeekSchedules(
      'c0000000-0000-0000-0000-000000000001',
      '2026-02-02',
      '2026-02-08',
    )
    assert.equal(result, false)
  } finally {
    restore()
    repositoryConfig.useRealSupabase = previousMode
  }
})

test('refuses to delete a real shift when the store id cannot be validated', async () => {
  const previousMode = repositoryConfig.useRealSupabase
  repositoryConfig.useRealSupabase = true
  let fromCalls = 0
  const restore = installSupabaseResult({ data: null, error: null }, () => { fromCalls += 1 })

  try {
    const result = await scheduleAdapter.removeShift(
      'e0000000-0000-0000-0000-000000000001',
      'store-not-a-uuid',
      '2026-02-02',
      'd0000000-0000-0000-0000-000000000001',
    )
    assert.equal(result, false)
    assert.equal(fromCalls, 0)
  } finally {
    restore()
    repositoryConfig.useRealSupabase = previousMode
  }
})
