import test from 'node:test'
import assert from 'node:assert/strict'
import {
  recordPayment,
  reversePayment,
  type PaymentLedgerTransaction,
} from './payroll-payment-ledger.ts'

const baseInput = {
  organizationId: 'org-001',
  periodId: 'period-2026-02',
  payslipId: 'slip-001',
  employeeId: 'employee-001',
  payslipStatus: 'Đã gửi phiếu lương',
  amount: 2500000,
  paymentMethod: 'Ngân hàng' as const,
  bankName: 'Vietcombank',
  accountNumber: '0123456789',
  accountName: 'NGUYEN VAN A',
  note: 'Luong thang 02/2026',
}

test('records one valid payment transaction', () => {
  const result = recordPayment([], baseInput, '2026-02-28T10:00:00.000Z', 'tx-001')

  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.state.length, 1)
  assert.deepEqual(result.transaction, {
    id: 'tx-001',
    organizationId: 'org-001',
    periodId: 'period-2026-02',
    payslipId: 'slip-001',
    employeeId: 'employee-001',
    transactionType: 'thanh_toan',
    amount: 2500000,
    paymentMethod: 'Ngân hàng',
    bankName: 'Vietcombank',
    accountNumber: '0123456789',
    accountName: 'NGUYEN VAN A',
    note: 'Luong thang 02/2026',
    createdAt: '2026-02-28T10:00:00.000Z',
  })
})

test('rejects a second active payment for the same payslip', () => {
  const first = recordPayment([], baseInput, '2026-02-28T10:00:00.000Z', 'tx-001')
  assert.equal(first.ok, true)
  if (!first.ok) return

  const second = recordPayment(first.state, { ...baseInput, amount: 2600000 }, '2026-02-28T10:01:00.000Z', 'tx-002')

  assert.equal(second.ok, false)
  if (second.ok) return
  assert.equal(second.error, 'Phiếu lương đã có giao dịch thanh toán đang hiệu lực.')
  assert.equal(first.state.length, 1)
})

test('reverses the active payment without removing the original transaction', () => {
  const first = recordPayment([], baseInput, '2026-02-28T10:00:00.000Z', 'tx-001')
  assert.equal(first.ok, true)
  if (!first.ok) return

  const result = reversePayment(
    first.state,
    { organizationId: 'org-001', periodId: 'period-2026-02', payslipId: 'slip-001', employeeId: 'employee-001', payslipStatus: 'Đã thanh toán' },
    '2026-03-01T09:00:00.000Z',
    'tx-002',
  )

  assert.equal(result.ok, true)
  if (!result.ok) return
  assert.equal(result.state.length, 2)
  assert.equal(result.state[0].transactionType, 'thanh_toan')
  assert.deepEqual(result.transaction, {
    id: 'tx-002',
    organizationId: 'org-001',
    periodId: 'period-2026-02',
    payslipId: 'slip-001',
    employeeId: 'employee-001',
    transactionType: 'hoan_tac',
    originalTransactionId: 'tx-001',
    amount: 2500000,
    paymentMethod: 'Ngân hàng',
    bankName: 'Vietcombank',
    accountNumber: '0123456789',
    accountName: 'NGUYEN VAN A',
    note: 'Hoan tac giao dich tx-001',
    createdAt: '2026-03-01T09:00:00.000Z',
  })
})

test('rejects a second reversal for the same active payment', () => {
  const first = recordPayment([], baseInput, '2026-02-28T10:00:00.000Z', 'tx-001')
  assert.equal(first.ok, true)
  if (!first.ok) return

  const reversalInput = { organizationId: 'org-001', periodId: 'period-2026-02', payslipId: 'slip-001', employeeId: 'employee-001', payslipStatus: 'Đã thanh toán' }
  const firstReversal = reversePayment(first.state, reversalInput, '2026-03-01T09:00:00.000Z', 'tx-002')
  assert.equal(firstReversal.ok, true)
  if (!firstReversal.ok) return

  const secondReversal = reversePayment(firstReversal.state, reversalInput, '2026-03-01T09:01:00.000Z', 'tx-003')

  assert.equal(secondReversal.ok, false)
  if (secondReversal.ok) return
  assert.equal(secondReversal.error, 'Phiếu lương không có giao dịch thanh toán đang hiệu lực để hoàn tác.')
})

test('rejects invalid payment amounts', () => {
  const invalidAmounts = [0, -1, Number.NaN, Number.POSITIVE_INFINITY]

  for (const amount of invalidAmounts) {
    const result = recordPayment([], { ...baseInput, amount }, '2026-02-28T10:00:00.000Z', `tx-${String(amount)}`)
    assert.equal(result.ok, false)
    if (!result.ok) assert.equal(result.error, 'Số tiền thanh toán phải lớn hơn 0.')
  }
})

test('rejects payment before the payslip is sent', () => {
  const result = recordPayment(
    [],
    { ...baseInput, payslipStatus: 'Chưa gửi phiếu lương' },
    '2026-02-28T10:00:00.000Z',
    'tx-before-send',
  )

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.error, 'Phiếu lương chưa ở trạng thái sẵn sàng thanh toán.')
})

test('requires bank details for bank payments', () => {
  const result = recordPayment(
    [],
    { ...baseInput, bankName: '', accountNumber: '', accountName: '' },
    '2026-02-28T10:00:00.000Z',
    'tx-missing-bank-details',
  )

  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.error, 'Thanh toán ngân hàng cần đủ thông tin tài khoản.')
})

test('keeps a custom reversal note in the mock ledger', () => {
  const first = recordPayment([], baseInput, '2026-02-28T10:00:00.000Z', 'tx-001')
  assert.equal(first.ok, true)
  if (!first.ok) return

  const result = reversePayment(
    first.state,
    {
      organizationId: 'org-001',
      periodId: 'period-2026-02',
      payslipId: 'slip-001',
      employeeId: 'employee-001',
      payslipStatus: 'Đã thanh toán',
      note: 'Đối soát giao dịch ngân hàng',
    },
    '2026-03-01T09:00:00.000Z',
    'tx-002',
  )

  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.transaction.note, 'Đối soát giao dịch ngân hàng')
})

const _typeCheck: PaymentLedgerTransaction | undefined = undefined
void _typeCheck
