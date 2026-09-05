export type PayrollPaymentMethod = 'Ngân hàng' | 'Tiền mặt' | 'Ví điện tử'
export type PaymentTransactionType = 'thanh_toan' | 'hoan_tac'

export interface PaymentLedgerTransaction {
  id: string
  organizationId: string
  periodId: string
  payslipId: string
  employeeId: string
  transactionType: PaymentTransactionType
  originalTransactionId?: string
  amount: number
  paymentMethod: PayrollPaymentMethod
  bankName?: string
  accountNumber?: string
  accountName?: string
  note?: string
  proofUrl?: string
  executorId?: string
  createdAt: string
}

export interface PaymentRecordInput {
  organizationId: string
  periodId: string
  payslipId: string
  employeeId: string
  payslipStatus: string
  amount: number
  paymentMethod: PayrollPaymentMethod
  bankName?: string
  accountNumber?: string
  accountName?: string
  note?: string
  proofUrl?: string
  executorId?: string
}

export interface PaymentReversalInput {
  organizationId: string
  periodId: string
  payslipId: string
  employeeId: string
  payslipStatus: string
  note?: string
  executorId?: string
}

type LedgerSuccess<T> = {
  ok: true
  state: PaymentLedgerTransaction[]
  transaction: T
}

type LedgerFailure = {
  ok: false
  error: string
}

export type PaymentLedgerResult<T> = LedgerSuccess<T> | LedgerFailure

function isValidAmount(amount: number): boolean {
  return Number.isFinite(amount) && amount > 0
}

function isSupportedPaymentMethod(value: unknown): value is PayrollPaymentMethod {
  return value === 'Ngân hàng' || value === 'Tiền mặt' || value === 'Ví điện tử'
}

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim())
}

function optionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim()
  return normalized || undefined
}

function matchesPayslip(
  transaction: PaymentLedgerTransaction,
  input: PaymentRecordInput | PaymentReversalInput,
): boolean {
  return transaction.organizationId === input.organizationId
    && transaction.periodId === input.periodId
    && transaction.payslipId === input.payslipId
    && transaction.employeeId === input.employeeId
}

function findActivePayment(
  state: readonly PaymentLedgerTransaction[],
  input: PaymentRecordInput | PaymentReversalInput,
): PaymentLedgerTransaction | undefined {
  const reversedIds = new Set(
    state
      .filter(transaction => transaction.transactionType === 'hoan_tac' && transaction.originalTransactionId)
      .map(transaction => transaction.originalTransactionId as string),
  )

  return [...state]
    .reverse()
    .find(transaction => (
      transaction.transactionType === 'thanh_toan'
      && matchesPayslip(transaction, input)
      && !reversedIds.has(transaction.id)
    ))
}

function buildOptionalFields(input: PaymentRecordInput): Pick<
  PaymentLedgerTransaction,
  'bankName' | 'accountNumber' | 'accountName' | 'note' | 'proofUrl' | 'executorId'
> {
  return {
    ...(optionalText(input.bankName) ? { bankName: optionalText(input.bankName) } : {}),
    ...(optionalText(input.accountNumber) ? { accountNumber: optionalText(input.accountNumber) } : {}),
    ...(optionalText(input.accountName) ? { accountName: optionalText(input.accountName) } : {}),
    ...(optionalText(input.note) ? { note: optionalText(input.note) } : {}),
    ...(optionalText(input.proofUrl) ? { proofUrl: optionalText(input.proofUrl) } : {}),
    ...(optionalText(input.executorId) ? { executorId: optionalText(input.executorId) } : {}),
  }
}

export function recordPayment(
  state: readonly PaymentLedgerTransaction[],
  input: PaymentRecordInput,
  createdAt: string,
  id: string,
): PaymentLedgerResult<PaymentLedgerTransaction> {
  if (input.payslipStatus !== 'Đã gửi phiếu lương') {
    return { ok: false, error: 'Phiếu lương chưa ở trạng thái sẵn sàng thanh toán.' }
  }

  if (!isValidAmount(input.amount)) {
    return { ok: false, error: 'Số tiền thanh toán phải lớn hơn 0.' }
  }

  if (!isSupportedPaymentMethod(input.paymentMethod)) {
    return { ok: false, error: 'Phương thức thanh toán không được hỗ trợ.' }
  }

  if (input.paymentMethod === 'Ngân hàng'
    && (!hasText(input.bankName) || !hasText(input.accountNumber) || !hasText(input.accountName))) {
    return { ok: false, error: 'Thanh toán ngân hàng cần đủ thông tin tài khoản.' }
  }

  if (findActivePayment(state, input)) {
    return { ok: false, error: 'Phiếu lương đã có giao dịch thanh toán đang hiệu lực.' }
  }

  const transaction: PaymentLedgerTransaction = {
    id,
    organizationId: input.organizationId,
    periodId: input.periodId,
    payslipId: input.payslipId,
    employeeId: input.employeeId,
    transactionType: 'thanh_toan',
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    ...buildOptionalFields(input),
    createdAt,
  }

  return { ok: true, state: [...state, transaction], transaction }
}

export function reversePayment(
  state: readonly PaymentLedgerTransaction[],
  input: PaymentReversalInput,
  createdAt: string,
  id: string,
): PaymentLedgerResult<PaymentLedgerTransaction> {
  if (input.payslipStatus !== 'Đã thanh toán') {
    return { ok: false, error: 'Phiếu lương chưa ở trạng thái đã thanh toán.' }
  }

  const activePayment = findActivePayment(state, input)
  if (!activePayment) {
    return { ok: false, error: 'Phiếu lương không có giao dịch thanh toán đang hiệu lực để hoàn tác.' }
  }

  const transaction: PaymentLedgerTransaction = {
    id,
    organizationId: activePayment.organizationId,
    periodId: activePayment.periodId,
    payslipId: activePayment.payslipId,
    employeeId: activePayment.employeeId,
    transactionType: 'hoan_tac',
    originalTransactionId: activePayment.id,
    amount: activePayment.amount,
    paymentMethod: activePayment.paymentMethod,
    ...(activePayment.bankName ? { bankName: activePayment.bankName } : {}),
    ...(activePayment.accountNumber ? { accountNumber: activePayment.accountNumber } : {}),
    ...(activePayment.accountName ? { accountName: activePayment.accountName } : {}),
    note: optionalText(input.note) || `Hoan tac giao dich ${activePayment.id}`,
    ...(input.executorId ? { executorId: input.executorId } : {}),
    createdAt,
  }

  return { ok: true, state: [...state, transaction], transaction }
}

export function getActivePayment(
  state: readonly PaymentLedgerTransaction[],
  input: PaymentReversalInput,
): PaymentLedgerTransaction | undefined {
  return findActivePayment(state, input)
}
