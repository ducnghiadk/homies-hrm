import test from 'node:test'
import assert from 'node:assert/strict'

import type {
  EmployeeOnboardingChecklistPlan,
  OnboardingRoleSettings,
} from '../src/lib/career-path-types'
import {
  buildTrialWorkflowReadinessReport,
  getOnboardingPlanRoleLabel,
  getOnboardingRoleSettings,
  importSettings,
  initCareerPathStores,
  resolveOnboardingRoleForEmployee,
  validateOnboardingRoleSettings,
} from '../src/lib/career-path-service'
import {
  defaultOnboardingRoleSettings,
  sampleEmployeeOnboardingChecklistPlans,
} from '../src/lib/mock-data-career-path'

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
        template_id: 'onb-template-counter-published-v1',
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
  assert.equal(result.template_id, 'onb-template-counter-published-v1')
})

test('resolver returns unmatched when mapped role is disabled', () => {
  initCareerPathStores()
  const settings = cloneRoleSettings({
    roles: [
      {
        role_code: 'counter_staff',
        label: 'Thu ngân',
        enabled: false,
        template_id: 'onb-template-counter-published-v1',
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
  assert.match(result.unmatched_reason ?? '', /\u0111ang b\u1ecb t\u1eaft/i)
})

test('legacy counter_staff plan renders Thu ngân display label', () => {
  initCareerPathStores()
  const legacyPlan: EmployeeOnboardingChecklistPlan = {
    id: 'onb-plan-legacy',
    employee_id: 'emp-legacy',
    template_id: 'onb-template-counter-published-v1',
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

test('validator rejects missing onboarding template', () => {
  initCareerPathStores()
  const issues = validateOnboardingRoleSettings(cloneRoleSettings({
    roles: [
      {
        role_code: 'counter_staff',
        label: 'Thu ngân',
        enabled: true,
        template_id: 'missing-template',
        position_ids: ['pos-002'],
        sort_order: 1,
      },
    ],
  }))

  assert.equal(issues.some((issue) => issue.code === 'template_not_found'), true)
})

test('validator rejects template assigned to different onboarding role', () => {
  initCareerPathStores()
  const issues = validateOnboardingRoleSettings(cloneRoleSettings({
    roles: [
      {
        role_code: 'counter_staff',
        label: 'Thu ngân',
        enabled: true,
        template_id: 'onb-template-barista-published-v1',
        position_ids: ['pos-002'],
        sort_order: 1,
      },
    ],
  }))

  assert.equal(issues.some((issue) => issue.code === 'template_role_mismatch'), true)
})

test('trial workflow readiness flags missing assignment group', () => {
  initCareerPathStores()
  const report = buildTrialWorkflowReadinessReport(cloneRoleSettings({
    roles: [
      {
        role_code: 'counter_staff',
        label: 'Thu ngân',
        enabled: true,
        template_id: 'onb-template-counter-published-v1',
        position_ids: [],
        sort_order: 1,
      },
    ],
  }))

  assert.equal(report.some((issue) => issue.message.includes('Chưa chọn nhóm áp dụng')), true)
})

test('import rejects onboarding settings when template role mismatches', () => {
  initCareerPathStores()
  const before = getOnboardingRoleSettings()
  const success = importSettings(JSON.stringify({
    settings: {
      onboarding_role_settings: {
        ...before,
        roles: [
          {
            role_code: 'counter_staff',
            label: 'Thu ngân',
            enabled: true,
            template_id: 'onb-template-barista-published-v1',
            position_ids: ['pos-002'],
            sort_order: 1,
          },
        ],
      },
    },
  }))

  assert.equal(success, false)
  assert.equal(getOnboardingRoleSettings().roles[0].template_id, before.roles[0].template_id)
})

test('seed onboarding plans use current published template ids', () => {
  const templateIds = sampleEmployeeOnboardingChecklistPlans.map((plan) => plan.template_id)

  assert.equal(templateIds.includes('onb-template-counter-v1'), false)
  assert.equal(templateIds.includes('onb-template-barista-v1'), false)
})