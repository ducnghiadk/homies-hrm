import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { join } from 'node:path'

import { canAccessResource, hasPermission } from './lib/rbac.ts'

describe('resource access policy', () => {
  it('does not let an employee use an own-resource permission for another employee', () => {
    assert.equal(hasPermission('employee', 'payroll.view_own'), true)
    assert.equal(canAccessResource('employee', 'employee-001', 'employee-002', 'payroll.view_own'), false)
    assert.equal(canAccessResource('employee', 'employee-001', 'employee-001', 'payroll.view_own'), true)
  })

  it('does not let an employee use an own-resource permission for another attendance record', () => {
    assert.equal(canAccessResource('employee', 'employee-001', 'employee-002', 'attendance.view_own'), false)
    assert.equal(canAccessResource('employee', 'employee-001', 'employee-001', 'attendance.view_own'), true)
  })

  it('does not treat the root route as a public prefix', () => {
    const proxySource = readFileSync(join(process.cwd(), 'src', 'proxy.ts'), 'utf8')

    assert.doesNotMatch(proxySource, /publicRoutes\.some\(route => pathname\.startsWith\(route\)\)/)
    assert.match(proxySource, /pathname === route \|\| pathname\.startsWith\(route \+ '\/'\)/)
  })

  it('does not ship a public wildcard RLS policy for schedule and payroll data', () => {
    const policy = readFileSync(join(process.cwd(), 'supabase', 'rls_v3_policies.sql'), 'utf8')
    const migrationPath = join(process.cwd(), 'supabase', 'migrations', '20260828_schedule_payroll_rls_lockdown.sql')
    const scheduleRulesPath = join(process.cwd(), 'supabase', 'schema_v4_schedule_rules.sql')

    assert.doesNotMatch(policy, /FOR ALL TO public USING \(true\)/i)
    assert.match(policy, /TO authenticated/i)
    assert.match(policy, /app_hrm_current_employee_id/i)
    assert.equal(existsSync(migrationPath), true)
    if (existsSync(migrationPath)) {
      const migration = readFileSync(migrationPath, 'utf8')
      assert.match(migration, /DROP POLICY/i)
      assert.match(migration, /app_hrm_can_manage_store/i)
      assert.match(migration, /app_hrm_employee_matches_store/i)
      assert.match(migration, /app_hrm_payroll_slip_in_scope/i)
      assert.match(migration, /lich_phan_ca/i)
      assert.match(migration, /phieu_luong/i)
      assert.match(migration, /quy_tac_xep_ca/i)
      assert.match(migration, /ngoai_le_quy_tac/i)
    }
    assert.equal(existsSync(scheduleRulesPath), true)
    if (existsSync(scheduleRulesPath)) {
      const scheduleRules = readFileSync(scheduleRulesPath, 'utf8')
      assert.doesNotMatch(scheduleRules, /FOR ALL(?: TO public)?\s+USING\s*\(\s*true\s*\)/i)
      assert.doesNotMatch(scheduleRules, /TO public/i)
      assert.match(scheduleRules, /FOR SELECT TO authenticated/i)
      assert.match(scheduleRules, /FROM public\.nhan_vien/i)
    }
  })
})
