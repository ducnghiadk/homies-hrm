import test from 'node:test'
import assert from 'node:assert/strict'

import { initCareerPathStores } from '../src/lib/career-path-service'
import { OnboardingOperationsService } from '../src/lib/services/onboarding-operations-service'

test('workspace overview exposes config-first system status', () => {
  initCareerPathStores()
  const user = {
    id: 'emp-004',
    full_name: 'CEO Test',
    role: 'ceo',
    store_id: 'store-001',
    position_id: 'pos-001',
    phone: '0900000000',
    email: 'ceo@example.com',
    employee_code: 'E004',
    status: 'active',
    account_status: 'dang_hoat_dong',
    total_points: 0,
    gamification_level: 'L1',
    hire_date: '2026-06-01',
  } as const
  const overview = OnboardingOperationsService.getWorkspaceOverview(user, 'all')

  assert.ok(overview.systemStatus)
  assert.ok(['stable', 'review', 'config_error'].includes(overview.systemStatus.key))
  assert.ok(Array.isArray(overview.urgentItems))
  assert.ok(overview.configSummary)
})
