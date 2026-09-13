# Payroll Payment Ledger Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ghi nhận thanh toán lương bằng ledger bất biến, hoàn tác bằng bản ghi mới và giữ trạng thái payroll đồng bộ sau khi tải lại.

**Architecture:** Một module domain thuần quản lý trạng thái giao dịch mock/local; payroll adapter dùng module này ở mock và gọi hai RPC giao dịch ở Supabase theo cặp kỳ lương + nhân viên. Trang payroll tải trạng thái đã lưu theo kỳ, sau đó gọi adapter để xác nhận hoặc hoàn tác mà không còn ghi thông tin thanh toán vào `phieu_luong.ghi_chu`.

**Tech Stack:** TypeScript, Node native test runner, Supabase SQL/RPC, React/Next.js.

---

### Task 1: Ledger domain rules

**Files:**
- Create: `src/lib/payroll-payment-ledger.ts`
- Test: `src/lib/payroll-payment-ledger.test.ts`

- [x] **Step 1: Write the failing test**

Cover these behaviors with real domain functions: valid payment appends one `thanh_toan` transaction; a second active payment is rejected; reversal appends `hoan_tac` and keeps the original; a second reversal is rejected; zero, negative, and non-finite amounts are rejected.

- [x] **Step 2: Run the test to verify it fails**

Run: `node --test src/lib/payroll-payment-ledger.test.ts`
Expected: FAIL because `src/lib/payroll-payment-ledger.ts` does not exist yet.

- [x] **Step 3: Write minimal implementation**

Export the payment method and transaction types plus two pure functions:

```ts
recordPayment(state, input, now, id)
reversePayment(state, input, now, id)
```

Both return `{ ok: true, state, transaction }` or `{ ok: false, error }`. Use `transactionType: 'thanh_toan' | 'hoan_tac'`, link reversals with `originalTransactionId`, and determine an active payment by finding a payment with no matching reversal.

- [x] **Step 4: Run the test to verify it passes**

Run: `node --test src/lib/payroll-payment-ledger.test.ts`
Expected: all ledger rule tests PASS.

### Task 2: Supabase schema and transaction functions

**Files:**
- Create: `supabase/migrations/20260828_payroll_payment_ledger.sql`
- Test: `src/lib/payroll-payment-ledger-sql-contract.test.ts`

- [x] **Step 1: Write the failing SQL contract test**

Read the migration text and assert it contains the new table, positive amount check, foreign keys to `ky_luong`, `phieu_luong`, and `nhan_vien`, append-only protection against update/delete, both RPC names, `FOR UPDATE`, and payroll-admin checks.

- [x] **Step 2: Run the test to verify it fails**

Run: `node --test src/lib/payroll-payment-ledger-sql-contract.test.ts`
Expected: FAIL because the migration file does not exist yet.

- [x] **Step 3: Write the migration**

Create `phieu_luong_thanh_toan` with organization and payroll links, transaction type, original transaction link, amount, method, bank snapshot, note, proof, executor, and server timestamp. Add RLS for payroll admins, revoke anon access, grant authenticated access, and add `record_payroll_payment` plus `reverse_payroll_payment` functions. Each function validates scope and status, locks the payslip, writes the ledger row, and updates the payslip in one transaction.

- [x] **Step 4: Run the SQL contract test**

Run: `node --test src/lib/payroll-payment-ledger-sql-contract.test.ts`
Expected: all SQL contract assertions PASS.

### Task 3: Adapter and payroll page wiring

**Files:**
- Modify: `src/lib/adapters/payroll-adapter.ts`
- Modify: `src/app/payroll/page.tsx`
- Modify: `docs/KNOWN_ISSUES.md`

- [x] **Step 1: Add adapter contract types and methods**

Add typed methods for `getPaymentStatuses(periodId)`, `recordPayment(input)`, and `reversePayment(input)`. In real mode call the two RPCs with `p_period_id` and `p_employee_id`, and map their errors to `false`/an empty status map. In mock mode use the pure ledger functions and persist state through a browser-safe localStorage key.

- [x] **Step 2: Load persisted statuses in payroll**

After authentication and the selected period are ready, call `payrollAdapter.getPaymentStatuses(selectedPeriod)` and merge the returned employee status map into `statusOverrides`. Keep the payroll engine as the source for amounts and attendance totals.

- [x] **Step 3: Replace payment writes**

Change the payment modal callback to call `recordPayment` with the payslip id, employee id, period, amount, method, note, bank snapshot, and proof field. Change the bulk unpay handler to call `reversePayment` per paid row. Only update `statusOverrides` when the adapter succeeds.

- [x] **Step 4: Record the known issue update**

Add the ledger limitation and migration requirement to `docs/KNOWN_ISSUES.md`, including the two RPC names and the fact that old paid slips without a ledger entry cannot be safely reversed until reconciled.

### Task 4: Verification

**Files:**
- Verify: `src/lib/payroll-payment-ledger.test.ts`
- Verify: `src/lib/payroll-payment-ledger-sql-contract.test.ts`
- Verify: `src/lib/adapters/payroll-adapter.ts`
- Verify: `src/app/payroll/page.tsx`

- [x] **Step 1: Run domain and SQL tests**

Run: `node --test src/lib/payroll-payment-ledger.test.ts src/lib/payroll-payment-ledger-sql-contract.test.ts`
Expected: all tests PASS.

- [x] **Step 2: Run targeted lint and TypeScript**

Run: `.\\node_modules\\.bin\\eslint.cmd src/lib/payroll-payment-ledger.ts src/lib/payroll-payment-ledger.test.ts src/lib/payroll-payment-ledger-sql-contract.test.ts src/lib/adapters/payroll-adapter.ts src/app/payroll/page.tsx`
Then run: `.\\node_modules\\.bin\\tsc.cmd --noEmit`
Expected: no errors; only pre-existing warnings may remain.

- [x] **Step 3: Run diff and production build checks**

Run: `git diff --check -- src/lib/payroll-payment-ledger.ts src/lib/payroll-payment-ledger.test.ts src/lib/payroll-payment-ledger-sql-contract.test.ts src/lib/adapters/payroll-adapter.ts src/app/payroll/page.tsx docs/KNOWN_ISSUES.md supabase/migrations/20260828_payroll_payment_ledger.sql`
Then run: `cmd /c npm run build`
Expected: no diff errors and build completes with all routes generated.
