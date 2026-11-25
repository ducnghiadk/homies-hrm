import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  decideCheckinPath,
  extractClientIp,
  getStoreCheckinConfig,
  isIpAllowed,
  normalizeIp,
  normalizeIpList,
} from './checkin-method.ts'

describe('checkin-method', () => {
  it('chuẩn hóa IP', () => {
    assert.equal(normalizeIp(' 113.161.1.2 '), '113.161.1.2')
    assert.equal(normalizeIp('::ffff:113.161.1.2'), '113.161.1.2')
    assert.equal(normalizeIp('113.161.1.2:443'), '113.161.1.2')
    assert.equal(normalizeIp('999.1.1.1'), '')
    assert.equal(normalizeIp('abc'), '')
    assert.equal(normalizeIp('2001:DB8::1'), '2001:db8::1')
  })

  it('lấy IP đầu tiên trong x-forwarded-for', () => {
    const h: Record<string, string> = { 'x-forwarded-for': '113.161.1.2, 10.0.0.1' }
    assert.equal(extractClientIp((n) => h[n]), '113.161.1.2')
    assert.equal(extractClientIp((n) => ({ 'x-real-ip': '1.2.3.4' } as Record<string, string>)[n]), '1.2.3.4')
    assert.equal(extractClientIp(() => null), '')
  })

  it('danh sách IP loại trùng, bỏ giá trị sai', () => {
    assert.deepEqual(normalizeIpList(['1.2.3.4', '1.2.3.4', 'x', 5]), ['1.2.3.4'])
    assert.equal(isIpAllowed('1.2.3.4', ['1.2.3.4']), true)
    assert.equal(isIpAllowed('', ['1.2.3.4']), false)
  })

  it('mặc định: Wi-Fi hoặc QR, có GPS', () => {
    const c = getStoreCheckinConfig({})
    assert.equal(c.checkin_method, 'wifi_or_qr')
    assert.equal(c.require_gps, true)
  })

  it('quyết định cách chấm công', () => {
    const both = getStoreCheckinConfig({ checkin_method: 'wifi_or_qr', wifi_public_ips: ['1.2.3.4'] })
    assert.equal(decideCheckinPath(both, '1.2.3.4', false).path, 'wifi')
    assert.equal(decideCheckinPath(both, '5.5.5.5', true).path, 'qr')
    assert.equal(decideCheckinPath(both, '5.5.5.5', false).path, 'error')

    const wifiOnly = getStoreCheckinConfig({ checkin_method: 'wifi', wifi_public_ips: ['1.2.3.4'] })
    assert.equal(decideCheckinPath(wifiOnly, '5.5.5.5', true).path, 'error')

    const qrOnly = getStoreCheckinConfig({ checkin_method: 'qr', wifi_public_ips: ['1.2.3.4'] })
    assert.equal(decideCheckinPath(qrOnly, '1.2.3.4', false).path, 'error')
    assert.equal(decideCheckinPath(qrOnly, '1.2.3.4', true).path, 'qr')
  })
})
