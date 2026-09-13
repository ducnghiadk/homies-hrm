import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { validateKpiSet } from './configuration-service.ts'
import { createVersionFromTemplate } from './fnb-template-catalog.ts'
import {
  applyHomiesStandardProgram,
  buildCareerStageSuggestions,
  createCareerStageDrafts,
  createSingleStageExceptionDraft,
  getAdjacentCareerTargetIds,
  getDefaultPromotionRule,
  getDefaultSourcePolicy,
  isKpiVersionEditable,
  prepareHomiesQuickStart,
  validateProgramVersion,
} from './program-service.ts'

describe('KPI program defaults', () => {
  it('keeps one primary purpose and selected secondary purposes', () => {
    const version = createVersionFromTemplate('barista', ['position_barista'], 'hr_admin_01', 2, '2026-08-23T08:00:00.000Z')
    const result = applyHomiesStandardProgram(version, {
      primary_purpose: 'promotion',
      secondary_purposes: ['monthly_bonus', 'training'],
      from_position_id: 'position_barista',
      to_position_id: 'position_senior_barista',
    })
    assert.equal(result.primary_purpose, 'promotion')
    assert.deepEqual(result.secondary_purposes, ['monthly_bonus', 'training'])
    assert.equal(result.program_setup_step, 'review')
  })

  it('enables the Homies employee review sources', () => {
    const policy = getDefaultSourcePolicy('promotion', 'employee')
    assert.deepEqual(policy.enabled_sources, ['operations', 'shift_leader', 'peer', 'store_manager'])
    assert.equal(policy.peer_reviewer_count, 2)
    assert.equal(policy.peer_weight_cap, 15)
  })

  it('uses three consecutive good months for employee to leader', () => {
    const rule = getDefaultPromotionRule('position_core', 'position_shift_leader', 'employee_to_leader')
    assert.equal(rule.score_mode, 'consecutive')
    assert.equal(rule.required_months, 3)
    assert.equal(rule.min_score, 4)
    assert.equal(rule.test_min_score, 80)
    assert.equal(rule.trial_shift_count, 4)
  })

  it('reports missing purpose, position scope and promotion path', () => {
    const version = createVersionFromTemplate('barista', [], 'hr_admin_01', 1, '2026-08-23T08:00:00.000Z')
    const codes = validateProgramVersion(version).map((issue) => issue.code)
    assert.ok(codes.includes('MISSING_PRIMARY_PURPOSE'))
    assert.ok(codes.includes('MISSING_POSITION_SCOPE'))
    assert.ok(codes.includes('MISSING_PROMOTION_PATH'))
  })

  it('blocks a program that has no saved evaluation source policy', () => {
    const version = createVersionFromTemplate('barista', ['position_core'], 'hr_admin_01', 2, '2026-08-23T08:00:00.000Z')
    version.primary_purpose = 'promotion'
    version.promotion_rule = getDefaultPromotionRule('position_core', 'position_shift_leader', 'employee_to_leader')

    const codes = validateProgramVersion(version).map((issue) => issue.code)

    assert.ok(codes.includes('MISSING_SOURCE_POLICY'))
  })

  it('keeps quick start at scope when required scope and promotion path are missing', () => {
    const version = createVersionFromTemplate('barista', [], 'hr_admin_01', 2, '2026-08-23T08:00:00.000Z')
    version.template_id = undefined

    const result = prepareHomiesQuickStart(version)

    assert.equal(result.program_setup_step, 'scope')
    assert.equal(result.template_id, undefined)
    assert.deepEqual(result.position_ids, [])
    assert.equal(result.promotion_rule, undefined)
    assert.ok(result.source_policy)
  })

  it('uses the confirmed scope and path when quick start can safely reach review', () => {
    const version = createVersionFromTemplate('cashier', ['position_cashier'], 'hr_admin_01', 2, '2026-08-23T08:00:00.000Z')
    version.primary_purpose = 'promotion'
    version.secondary_purposes = ['monthly_bonus']
    version.promotion_rule = getDefaultPromotionRule('position_cashier', 'position_shift_leader', 'employee_to_leader')

    const result = prepareHomiesQuickStart(version)

    assert.equal(result.program_setup_step, 'review')
    assert.equal(result.template_id, 'cashier')
    assert.deepEqual(result.position_ids, ['position_cashier'])
    assert.ok(result.promotion_rule)
    assert.equal(result.promotion_rule.from_position_id, 'position_cashier')
    assert.equal(result.promotion_rule.to_position_id, 'position_shift_leader')
  })

  it('allows edits only on draft versions', () => {
    const draft = createVersionFromTemplate('barista', ['position_barista'], 'hr_admin_01', 2, '2026-08-23T08:00:00.000Z')
    const published = { ...draft, status: 'published' as const }

    assert.equal(isKpiVersionEditable(draft), true)
    assert.equal(isKpiVersionEditable(published), false)
  })

  it('builds every adjacent Homies career stage without skipping levels', () => {
    const stages = buildCareerStageSuggestions([
      { id: 'barista-1', name: 'Pha chế Cấp 1', level: 1 },
      { id: 'cashier-1', name: 'Thu ngân Cấp 1', level: 1 },
      { id: 'leader-2', name: 'Trưởng ca', level: 2 },
      { id: 'manager-3', name: 'Quản lý cửa hàng', level: 3 },
      { id: 'board-10', name: 'Ban giám đốc', level: 10 },
      { id: 'unknown', name: 'Vị trí chưa phân cấp' },
    ])

    assert.deepEqual(
      stages.map((stage) => [stage.from_position_id, stage.to_position_id]),
      [
        ['barista-1', 'leader-2'],
        ['cashier-1', 'leader-2'],
        ['leader-2', 'manager-3'],
      ],
    )
    assert.equal(stages.some((stage) => stage.to_position_id === 'board-10'), false)
  })

  it('assigns the F&B template and promotion preset from the confirmed stage', () => {
    const stages = buildCareerStageSuggestions([
      { id: 'barista-1', name: 'Pha chế Cấp 1', level: 1 },
      { id: 'leader-2', name: 'Trưởng ca', level: 2 },
      { id: 'manager-3', name: 'Quản lý cửa hàng', level: 3 },
    ])

    assert.equal(stages[0].template_id, 'barista')
    assert.equal(stages[0].promotion_preset, 'employee_to_leader')
    assert.equal(stages[1].template_id, 'shift_leader')
    assert.equal(stages[1].promotion_preset, 'supervisor_to_manager')
  })

  it('accepts only targets exactly one level above the selected position', () => {
    const positions = [
      { id: 'barista-1', name: 'Pha chế Cấp 1', level: 1 },
      { id: 'leader-2', name: 'Trưởng ca', level: 2 },
      { id: 'manager-3', name: 'Quản lý cửa hàng', level: 3 },
      { id: 'board-10', name: 'Ban giám đốc', level: 10 },
    ]

    assert.deepEqual(getAdjacentCareerTargetIds(positions, 'barista-1'), ['leader-2'])
    assert.deepEqual(getAdjacentCareerTargetIds(positions, 'manager-3'), [])
  })

  it('creates one independent draft per selected career stage without publishing', () => {
    const positions = [
      { id: 'barista-1', name: 'Pha chế Cấp 1', level: 1 },
      { id: 'leader-2', name: 'Trưởng ca', level: 2 },
      { id: 'manager-3', name: 'Quản lý cửa hàng', level: 3 },
    ]
    const stages = buildCareerStageSuggestions(positions)

    const drafts = createCareerStageDrafts(stages, {
      actor_id: 'hr-admin-01',
      at: '2026-08-23T09:00:00.000Z',
      effective_from: '2026-09-01',
      primary_purpose: 'promotion',
      secondary_purposes: ['monthly_bonus'],
      scoped_store_ids: ['store-001'],
      store_ids: ['store-001'],
      start_version: 4,
    })

    assert.equal(drafts.length, 2)
    assert.deepEqual(drafts.map((draft) => draft.status), ['draft', 'draft'])
    assert.deepEqual(drafts.map((draft) => draft.version), [4, 5])
    assert.notEqual(drafts[0].set_id, drafts[1].set_id)
    assert.equal(drafts[0].promotion_rule?.to_position_id, 'leader-2')
    assert.equal(drafts[1].template_id, 'shift_leader')
    assert.deepEqual(drafts[0].store_ids, ['store-001'])
    const activeCriterionCount = drafts[0].groups.flatMap((group) => group.criteria.filter((criterion) => criterion.active)).length
    assert.equal(drafts[0].target_profiles?.[0]?.scope, 'chain')
    assert.equal(drafts[0].target_profiles?.[0]?.targets.length, activeCriterionCount)
    assert.deepEqual(drafts[0].store_group_snapshots?.[0]?.store_ids, ['store-001'])
    assert.deepEqual(validateProgramVersion(drafts[0]), [])
    assert.deepEqual(validateKpiSet(drafts[0], [], ['store-001']), [])
  })

  it('creates exactly one adjacent single-stage exception as a draft', () => {
    const draft = createSingleStageExceptionDraft({
      positions: [
        { id: 'barista-1', name: 'Pha chế Cấp 1', level: 1, active: true },
        { id: 'leader-2', name: 'Trưởng ca', level: 2, active: true },
        { id: 'manager-3', name: 'Quản lý cửa hàng', level: 3, active: true },
      ],
      source_position_id: 'barista-1',
      target_position_id: 'leader-2',
      promotion_preset: 'employee_to_leader',
      custom_min_score_percent: 84,
      custom_required_months: 4,
      store_ids: ['store-001'],
      valid_store_ids: ['store-001', 'store-002'],
      effective_from: '2099-09-01',
      actor_id: 'hr-admin-01',
      at: '2026-08-24T10:00:00.000Z',
      version: 7,
    })

    assert.equal(draft.status, 'draft')
    assert.equal(draft.version, 7)
    assert.deepEqual(draft.position_ids, ['barista-1'])
    assert.deepEqual(draft.store_ids, ['store-001'])
    assert.equal(draft.effective_from, '2099-09-01')
    assert.equal(draft.promotion_rule?.from_position_id, 'barista-1')
    assert.equal(draft.promotion_rule?.to_position_id, 'leader-2')
    assert.equal(draft.promotion_rule?.min_score, 4.2)
    assert.equal(draft.promotion_rule?.required_months, 4)
  })

  it('rejects a non-adjacent single-stage exception', () => {
    assert.throws(
      () => createSingleStageExceptionDraft({
        positions: [
          { id: 'barista-1', name: 'Pha chế Cấp 1', level: 1, active: true },
          { id: 'manager-3', name: 'Quản lý cửa hàng', level: 3, active: true },
        ],
        source_position_id: 'barista-1',
        target_position_id: 'manager-3',
        promotion_preset: 'employee_to_leader',
        custom_min_score_percent: 80,
        custom_required_months: 3,
        store_ids: 'all',
        valid_store_ids: ['store-001'],
        effective_from: '2099-09-01',
        actor_id: 'hr-admin-01',
        at: '2026-08-24T10:00:00.000Z',
        version: 8,
      }),
      /cấp kế tiếp/
    )
  })

  it('rejects invalid store scope and effective date for a single-stage exception', () => {
    const baseInput = {
      positions: [
        { id: 'barista-1', name: 'Pha chế Cấp 1', level: 1, active: true },
        { id: 'leader-2', name: 'Trưởng ca', level: 2, active: true },
      ],
      source_position_id: 'barista-1',
      target_position_id: 'leader-2',
      promotion_preset: 'employee_to_leader' as const,
      custom_min_score_percent: 80,
      custom_required_months: 3,
      valid_store_ids: ['store-001'],
      actor_id: 'hr-admin-01',
      at: '2026-08-24T10:00:00.000Z',
      version: 9,
    }

    assert.throws(
      () => createSingleStageExceptionDraft({
        ...baseInput,
        store_ids: ['store-unknown'],
        effective_from: '2099-09-01',
      }),
      /cửa hàng không hợp lệ/
    )
    assert.throws(
      () => createSingleStageExceptionDraft({
        ...baseInput,
        store_ids: 'all',
        effective_from: '2020-01-01',
      }),
      /ngày hiệu lực/
    )
  })
})
