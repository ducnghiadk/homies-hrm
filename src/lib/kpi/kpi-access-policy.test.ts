import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createEmptyKpiDatabase, type KpiDatabase } from './repository.ts'
import {
  filterKpiDatabaseForViewer,
  isKpiDatabaseEmpty,
  KpiWriteForbiddenError,
  mergeKpiDatabaseWrite,
} from './kpi-access-policy.ts'

function evaluation(id: string, employeeId: string, storeId: string) {
  return {
    id,
    period_id: 'p1',
    employee: { id: employeeId, store_id: storeId, level_code: 'pt1', position_id: 'x' },
    snapshot: {},
    scores: [],
    status: 'draft',
    revision: 1,
  } as unknown as KpiDatabase['evaluations'][number]
}

function buildDb(): KpiDatabase {
  const db = createEmptyKpiDatabase()
  db.revision = 3
  db.evaluations = [evaluation('e1', 'emp-a', 'store_001'), evaluation('e2', 'emp-b', 'store-002')]
  db.appeals = [{ id: 'ap1', type: 'monthly_kpi', employee_id: 'emp-b', reference_id: 'e2', reason: 'x', evidence_refs: [], status: 'reviewing', submitted_at: '', deadline_at: '' }]
  db.audit_logs = [{ id: 'log1', entity_type: 'x', entity_id: 'x', action: 'x', actor_id: 'ceo', created_at: '' }]
  db.sets = [{ id: 'set1' } as unknown as KpiDatabase['sets'][number]]
  return db
}

const employeeA = { userId: 'emp-a', role: 'employee', storeIds: ['store-001'] }
const managerStore1 = { userId: 'mgr-1', role: 'store_manager', storeIds: ['store-001'] }
const ceo = { userId: 'ceo', role: 'ceo', storeIds: [] }

test('nhân viên chỉ thấy phiếu KPI của mình và không thấy nhật ký', () => {
  const view = filterKpiDatabaseForViewer(buildDb(), employeeA)
  assert.deepEqual(view.evaluations.map((e) => e.id), ['e1'])
  assert.equal(view.appeals.length, 0)
  assert.equal(view.audit_logs.length, 0)
  assert.equal(view.sets.length, 1)
})

test('quản lý cửa hàng chỉ thấy chi nhánh mình (store_001 = store-001)', () => {
  const view = filterKpiDatabaseForViewer(buildDb(), managerStore1)
  assert.deepEqual(view.evaluations.map((e) => e.id), ['e1'])
})

test('quản lý lưu không làm mất phiếu của chi nhánh khác', () => {
  const server = buildDb()
  const view = filterKpiDatabaseForViewer(server, managerStore1)
  const edited = { ...view, evaluations: view.evaluations.map((e) => ({ ...e, status: 'submitted' as const })) }
  const merged = mergeKpiDatabaseWrite(server, edited, managerStore1)
  assert.equal(merged.evaluations.length, 2)
  assert.equal(merged.evaluations.find((e) => e.id === 'e1')?.status, 'submitted')
  assert.equal(merged.evaluations.find((e) => e.id === 'e2')?.status, 'draft')
  assert.equal(merged.audit_logs.length, 1)
  assert.equal(merged.revision, 4)
})

test('quản lý không được sửa cài đặt KPI', () => {
  const server = buildDb()
  const view = filterKpiDatabaseForViewer(server, managerStore1)
  assert.throws(() => mergeKpiDatabaseWrite(server, { ...view, sets: [] }, managerStore1), KpiWriteForbiddenError)
})

test('nhân viên chỉ thêm được khiếu nại mới của mình, trạng thái luôn là đã gửi', () => {
  const server = buildDb()
  const view = filterKpiDatabaseForViewer(server, employeeA)
  const mine = { id: 'ap2', type: 'monthly_kpi' as const, employee_id: 'emp-a', reference_id: 'e1', reason: 'r', evidence_refs: [], status: 'approved' as const, submitted_at: '', deadline_at: '' }
  const forged = { ...mine, id: 'ap3', employee_id: 'emp-b' }
  const merged = mergeKpiDatabaseWrite(server, {
    ...view,
    appeals: [mine, forged],
    evaluations: view.evaluations.map((e) => ({ ...e, status: 'locked' as const })),
  }, employeeA)
  assert.deepEqual(merged.appeals.map((a) => a.id).sort(), ['ap1', 'ap2'])
  assert.equal(merged.appeals.find((a) => a.id === 'ap2')?.status, 'submitted')
  assert.equal(merged.evaluations.find((e) => e.id === 'e1')?.status, 'draft')
})

test('nhật ký chỉ được ghi thêm, người không phải admin không giả được người ghi', () => {
  const server = buildDb()
  const merged = mergeKpiDatabaseWrite(server, {
    ...filterKpiDatabaseForViewer(server, managerStore1),
    audit_logs: [{ id: 'log2', entity_type: 'x', entity_id: 'x', action: 'x', actor_id: 'ceo', created_at: '' }],
  }, managerStore1)
  assert.deepEqual(merged.audit_logs.map((l) => l.id), ['log1', 'log2'])
  assert.equal(merged.audit_logs[1].actor_id, 'mgr-1')
})

test('CEO ghi toàn bộ', () => {
  const merged = mergeKpiDatabaseWrite(buildDb(), { ...buildDb(), sets: [], evaluations: [] }, ceo)
  assert.equal(merged.sets.length, 0)
  assert.equal(merged.evaluations.length, 0)
})

test('nhận biết kho KPI trống', () => {
  assert.equal(isKpiDatabaseEmpty(createEmptyKpiDatabase()), true)
  assert.equal(isKpiDatabaseEmpty(buildDb()), false)
})
