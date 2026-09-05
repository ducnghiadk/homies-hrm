import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const migrationPath = fileURLToPath(new URL('../../supabase/migrations/20260828_payroll_payment_ledger.sql', import.meta.url))

test('payment ledger migration defines an append-only, scoped transaction model', () => {
  const sql = readFileSync(migrationPath, 'utf8')

  assert.match(sql, /CREATE TABLE IF NOT EXISTS public\.phieu_luong_thanh_toan/i)
  assert.match(sql, /so_tien\s+DECIMAL\(15,\s*2\)[\s\S]*?CHECK\s*\(so_tien\s*>\s*0\)/i)
  assert.match(sql, /ky_luong_id\s+UUID[^\n]*REFERENCES public\.ky_luong\(id\)/i)
  assert.match(sql, /phieu_luong_id\s+UUID[^\n]*REFERENCES public\.phieu_luong\(id\)/i)
  assert.match(sql, /nhan_vien_id\s+UUID[^\n]*REFERENCES public\.nhan_vien\(id\)/i)
  assert.match(sql, /CREATE TRIGGER[^\n]*payment_ledger[^\n]*immutable/i)
  assert.match(sql, /RAISE EXCEPTION[^\n]*(?:cannot|không)[^\n]*(?:update|delete|sửa|xóa)/i)
  assert.match(sql, /CREATE TRIGGER[^\n]*payslip_payment_state_guard/i)
  assert.match(sql, /app\.hrm_payment_recording/i)
  assert.match(sql, /app\.hrm_payment_reversal/i)
})

test('payment ledger migration exposes atomic payment and reversal RPCs', () => {
  const sql = readFileSync(migrationPath, 'utf8')

  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.record_payroll_payment\(/i)
  assert.match(sql, /CREATE OR REPLACE FUNCTION public\.reverse_payroll_payment\(/i)
  assert.match(sql, /FOR UPDATE/i)
  assert.match(sql, /app_hrm_is_payroll_admin\(\)/i)
  assert.match(sql, /trang_thai\s*=\s*'Đã thanh toán'/i)
  assert.match(sql, /trang_thai\s*=\s*'Đã gửi phiếu lương'/i)
})

test('payment ledger migration defines its RLS helper dependencies before use', () => {
  const sql = readFileSync(migrationPath, 'utf8')
  const policyStart = sql.indexOf('CREATE POLICY hrm_payment_ledger_select')

  assert.notEqual(policyStart, -1, 'payment ledger policy must exist')

  for (const helperName of [
    'app_hrm_current_employee_id',
    'app_hrm_current_org_id',
    'app_hrm_current_role',
    'app_hrm_is_payroll_admin',
    'app_hrm_payroll_slip_in_scope',
  ]) {
    const definitionStart = sql.indexOf(`CREATE OR REPLACE FUNCTION public.${helperName}(`)

    assert.notEqual(definitionStart, -1, `${helperName} must be defined in the migration`)
    assert.ok(
      definitionStart < policyStart,
      `${helperName} must be defined before the first policy uses it`,
    )
  }
})

test('payment ledger migration closes anonymous access and grants authenticated RPC execution', () => {
  const sql = readFileSync(migrationPath, 'utf8')

  assert.match(sql, /REVOKE ALL ON TABLE public\.phieu_luong_thanh_toan FROM anon/i)
  assert.match(sql, /GRANT SELECT ON TABLE public\.phieu_luong_thanh_toan TO authenticated/i)
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.record_payroll_payment\(/i)
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.reverse_payroll_payment\(/i)
})
