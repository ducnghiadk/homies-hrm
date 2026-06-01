import test from 'node:test'
import assert from 'node:assert/strict'

import type {
  EmployeeOnboardingChecklistPlan,
  OnboardingRoleSettings,
} from '../src/lib/career-path-types'
import {
  initCareerPathStores,
  getOnboardingPlanRoleLabel,
  resolveOnboardingRoleForEmployee,
} from '../src/lib/career-path-service'
import { defaultOnboardingRoleSettings } from '../src/lib/mock-data-career-path'

function cloneRoleSettings(
  override?: Partial<OnboardingRoleSettings>,
): OnboardingRoleSettings {
  return {
    ...defaultOnboardingRoleSettings,
    ...override,
    roles: override?.roles ?? defaultOnboardingRoleSettings.roles.map((role) => ({
      ...role,
      position_ids: [...role.position_ids],
    })),
  }
}

test('resolver matches configured cashier role from settings', () => {
  initCareerPathStores()
  const settings = cloneRoleSettings({
    roles: [
      {
        role_code: 'counter_staff',
        label: 'Thu ngân',
        enabled: true,
        template_id: 'onb-template-counter-v1',
        position_ids: ['pos-002'],
        sort_order: 1,
      },
    ],
  })

  const result = resolveOnboardingRoleForEmployee(
    {
      id: 'emp-test-cashier',
      full_name: 'Thu Ngan Test',
      position_id: 'pos-002',
      store_id: 'store-001',
      hire_date: '2026-06-01',
      status: 'probation',
    },
    { settings },
  )

  assert.equal(result.source, 'settings')
  assert.equal(result.role_code, 'counter_staff')
  assert.equal(result.role_label, 'Thu ngân')
  assert.equal(result.template_id, 'onb-template-counter-v1')
})

test('resolver returns unmatched when mapped role is disabled', () => {
  initCareerPathStores()
  const settings = cloneRoleSettings({
    roles: [
      {
        role_code: 'counter_staff',
        label: 'Thu ngân',
        enabled: false,
        template_id: 'onb-template-counter-v1',
        position_ids: ['pos-002'],
        sort_order: 1,
      },
    ],
  })

  const result = resolveOnboardingRoleForEmployee(
    {
      id: 'emp-test-disabled',
      full_name: 'Disabled Mapping',
      position_id: 'pos-002',
      store_id: 'store-001',
      hire_date: '2026-06-01',
      status: 'probation',
    },
    { settings },
  )

  assert.equal(result.source, 'unmatched')
  assert.equal(result.role_code, 'counter_staff')
  assert.match(result.unmatched_reason ?? '', /dang bi tat/i)
})

test('legacy counter_staff plan renders Thu ngân display label', () => {
  initCareerPathStores()
  const legacyPlan: EmployeeOnboardingChecklistPlan = {
    id: 'onb-plan-legacy',
    employee_id: 'emp-legacy',
    template_id: 'onb-template-counter-v1',
    role_code: 'counter_staff',
    role_label_snapshot: null,
    template_label_snapshot: null,
    assigned_store_id: 'store-001',
    assigned_buddy_id: null,
    assigned_buddy_name: null,
    assigned_manager_id: null,
    assigned_manager_name: null,
    start_date: '2026-06-01',
    current_stage_code: 'pre_start',
    status: 'assigned',
    overall_progress: 0,
    overall_note: null,
    assigned_at: '2026-06-01',
    created_at: '2026-06-01',
    updated_at: '2026-06-01',
  }

  assert.equal(getOnboardingPlanRoleLabel(legacyPlan), 'Thu ngân')
})

