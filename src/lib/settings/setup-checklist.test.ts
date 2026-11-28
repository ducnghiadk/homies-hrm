import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildSetupChecklist, type SetupChecklistInput } from './setup-checklist.ts'

const base: SetupChecklistInput = {
  stores: [{ name: 'Quán A', latitude: 10.8, longitude: 106.7, pin_code: '1234', checkin_method: 'qr' }],
  shiftTemplateCount: 3,
  operationSettingsSaved: true,
  payrollPolicy: { holidays: [{ date: '2026-09-02' }] },
  taxSettingsSaved: true,
  employees: [{ full_name: 'An', role: 'employee', status: 'active', hourly_rate: 25000 }],
  careerPathConfigured: false,
}

test('đủ dữ liệu thì mọi mục bắt buộc đã xong, lộ trình là tùy chọn', () => {
  const r = buildSetupChecklist(base)
  assert.equal(r.requiredDone, r.requiredCount)
  assert.equal(r.steps.find((s) => s.id === 'career_path')?.done, false)
})

test('máy chủ trống thì các mục bắt buộc đều chưa xong', () => {
  const r = buildSetupChecklist({
    stores: [], shiftTemplateCount: 0, operationSettingsSaved: false, payrollPolicy: null,
    taxSettingsSaved: false, employees: [], careerPathConfigured: false,
  })
  assert.equal(r.requiredDone, 0)
})

test('chi nhánh dùng Wi-Fi mà chưa lưu mạng quán thì báo thiếu', () => {
  const r = buildSetupChecklist({ ...base, stores: [{ ...base.stores[0], checkin_method: 'wifi_or_qr', wifi_public_ips: [] }] })
  const step = r.steps.find((s) => s.id === 'checkin')!
  assert.equal(step.done, false)
  assert.match(step.detail, /Quán A/)
})

test('nhân viên thiếu lương được liệt kê, CEO/HR và người đã nghỉ không tính', () => {
  const r = buildSetupChecklist({
    ...base,
    employees: [
      { full_name: 'An', role: 'employee', status: 'active' },
      { full_name: 'Giám đốc', role: 'ceo', status: 'active' },
      { full_name: 'Cũ', role: 'employee', status: 'resigned' },
    ],
  })
  const step = r.steps.find((s) => s.id === 'employee_pay')!
  assert.equal(step.done, false)
  assert.match(step.detail, /1 người/)
  assert.doesNotMatch(step.detail, /Giám đốc|Cũ/)
})

test('chưa nhập ngày lễ thì mục ngày lễ chưa xong', () => {
  const r = buildSetupChecklist({ ...base, payrollPolicy: {} })
  assert.equal(r.steps.find((s) => s.id === 'holidays')?.done, false)
  assert.equal(r.steps.find((s) => s.id === 'payroll_policy')?.done, true)
})
