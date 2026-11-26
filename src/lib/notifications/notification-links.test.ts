import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveMetadataActionUrl } from './notification-links.ts'

test('đọc được đường dẫn "link" của thông báo máy chủ và mở đúng đề xuất', () => {
  assert.equal(resolveMetadataActionUrl('career_path', { link: '/career-path/review', proposal_id: 'p-1' }), '/career-path/review?proposal=p-1')
  assert.equal(resolveMetadataActionUrl('career_path', { link: '/career-path/me', proposal_id: 'p-1' }), '/career-path/me')
  assert.equal(resolveMetadataActionUrl('system', { action_url: '/payroll' }), '/payroll')
})

test('thông báo lộ trình không có đường dẫn mở "Lộ trình của tôi"; chặn link ngoài', () => {
  assert.equal(resolveMetadataActionUrl('career_path', {}), '/career-path/me')
  assert.equal(resolveMetadataActionUrl('system', { link: 'https://evil.example' }), null)
  assert.equal(resolveMetadataActionUrl('system', { link: '//evil.example' }), null)
  assert.equal(resolveMetadataActionUrl('swap_request', undefined), null)
})
