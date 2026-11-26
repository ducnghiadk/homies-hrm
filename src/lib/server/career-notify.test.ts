import test from 'node:test'
import assert from 'node:assert/strict'
import { careerApproverIds, isNotificationForUser, isNotificationReadBy, markNotificationReadBy, pushCareerNotices } from './career-notify.ts'

const db = {
  employees: [
    { id: 'ceo', role: 'ceo', store_id: 'store-001', status: 'active' },
    { id: 'sm1', role: 'store_manager', store_id: 'store-001', status: 'active' },
    { id: 'sm2', role: 'store_manager', store_id: 'store-002', status: 'active' },
    { id: 'hr-old', role: 'hr_admin', store_id: 'store-001', status: 'resigned' },
  ],
  notifications: [],
} as never

test('gửi thông báo cho đúng người duyệt, quản lý chỉ nhận của chi nhánh mình', () => {
  const ids = careerApproverIds(db, (role) => ['ceo', 'hr_admin', 'store_manager'].includes(role), 'store-001', 'sm1')
  assert.deepEqual(ids, ['ceo'])
  const ids2 = careerApproverIds(db, (role) => ['ceo', 'store_manager'].includes(role), 'store-002', 'x')
  assert.deepEqual(ids2.sort(), ['ceo', 'sm2'])
})

test('thông báo có người nhận chỉ hiện cho người đó; thông báo chung hiện cho tất cả', () => {
  pushCareerNotices(db, [{ title: 'a', message: 'b', target_user_id: 'sm1' }])
  const [n] = (db as { notifications: Parameters<typeof isNotificationForUser>[0][] }).notifications
  assert.ok(isNotificationForUser(n, 'sm1', 'store_manager'))
  assert.ok(!isNotificationForUser(n, 'sm2', 'store_manager'))
  assert.ok(isNotificationForUser({ ...n, target_user_id: undefined }, 'sm2', 'employee'))
  assert.ok(isNotificationForUser({ ...n, target_user_id: undefined, target_role: 'ceo' }, 'x', 'ceo'))
})

test('thông báo theo vai trò: mỗi người đọc riêng, không làm mất thông báo của người khác', () => {
  const n = { id: 'n1', title: 't', message: 'm', type: 'career_path', created_at: '', is_read: false, target_role: 'store_manager' }
  markNotificationReadBy(n, 'sm1')
  assert.ok(isNotificationReadBy(n, 'sm1'))
  assert.ok(!isNotificationReadBy(n, 'sm2'))
  assert.equal(n.is_read, false)
  const personal = { ...n, id: 'n2', target_role: undefined, target_user_id: 'sm1' }
  markNotificationReadBy(personal, 'sm1')
  assert.ok(personal.is_read)
})
