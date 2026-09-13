import type {
  KpiActor,
  KpiCareerStageSuggestion,
  KpiEvaluationSourcePolicy,
  KpiGroupDefinition,
  KpiProgramPurpose,
  KpiProgramSetupStep,
  KpiProgramValidationIssue,
  KpiPromotionPresetKey,
  KpiPromotionRule,
  KpiReviewSource,
  KpiSetVersion,
} from './types.ts'
import { createVersionFromTemplate, getFnbTemplate } from './fnb-template-catalog.ts'
import {
  getDefaultPeerReviewPolicy,
  validatePeerReviewPolicy,
} from './peer-review-policy-service.ts'

export const EMPLOYEE_SOURCES: KpiReviewSource[] = ['operations', 'shift_leader', 'peer', 'store_manager']
export const MANAGER_SOURCES: KpiReviewSource[] = ['operations', 'area_manager', 'store_360', 'skill_test', 'trial_role']

export const BLOCKING_INCIDENT_CODES = [
  'fraud',
  'cash',
  'food_safety',
  'cover_up',
  'customer_abuse',
  'retaliation',
  'serious_discipline',
]

export type PromotionPresetKey = KpiPromotionPresetKey

export const PROMOTION_PRESETS = {
  probation: {
    score_mode: 'consecutive' as const,
    required_months: 1,
    min_score: 3.5,
    min_shifts: 12,
    min_hours: 60,
    requires_store_360: false,
    skills: ['core_role'],
    proposer_roles: ['store_manager' as KpiActor['role']],
    approver_roles: ['hr_admin' as KpiActor['role']],
  },
  employee_to_core: {
    score_mode: 'consecutive' as const,
    required_months: 3,
    min_score: 4,
    min_shifts: 12,
    min_hours: 60,
    requires_store_360: false,
    skills: ['core_role', 'independent_work'],
    proposer_roles: ['store_manager' as KpiActor['role']],
    approver_roles: ['area_manager' as KpiActor['role'], 'hr_admin' as KpiActor['role']],
  },
  employee_to_leader: {
    score_mode: 'consecutive' as const,
    required_months: 3,
    min_score: 4,
    min_shifts: 12,
    min_hours: 60,
    test_min_score: 80,
    trial_shift_count: 4,
    requires_store_360: false,
    skills: ['core_role', 'independent_work', 'lead_shift'],
    proposer_roles: ['store_manager' as KpiActor['role']],
    approver_roles: ['area_manager' as KpiActor['role'], 'hr_admin' as KpiActor['role']],
  },
  leader_to_supervisor: {
    score_mode: 'rolling' as const,
    required_months: 5,
    rolling_window_months: 6,
    min_score: 4.2,
    min_shifts: 12,
    min_hours: 60,
    trial_week_count: 4,
    requires_store_360: true,
    skills: ['core_role', 'independent_work', 'lead_shift', 'coach_team'],
    proposer_roles: ['area_manager' as KpiActor['role']],
    approver_roles: ['hr_admin' as KpiActor['role'], 'ceo' as KpiActor['role']],
  },
  supervisor_to_manager: {
    score_mode: 'rolling' as const,
    required_months: 6,
    rolling_window_months: 8,
    min_score: 4.2,
    min_shifts: 12,
    min_hours: 60,
    trial_week_count: 6,
    requires_store_360: true,
    skills: ['core_role', 'independent_work', 'lead_shift', 'coach_team', 'manage_store'],
    proposer_roles: ['area_manager' as KpiActor['role'], 'hr_admin' as KpiActor['role']],
    approver_roles: ['ceo' as KpiActor['role']],
  },
  manager_to_area: {
    score_mode: 'rolling' as const,
    required_months: 9,
    rolling_window_months: 12,
    min_score: 4.2,
    min_shifts: 12,
    min_hours: 60,
    trial_week_count: 8,
    requires_store_360: true,
    skills: ['core_role', 'independent_work', 'lead_shift', 'coach_team', 'manage_store', 'multi_store_standard'],
    proposer_roles: ['area_manager' as KpiActor['role'], 'hr_admin' as KpiActor['role']],
    approver_roles: ['ceo' as KpiActor['role']],
  },
} as const

type CareerPosition = { id: string; name: string; level?: number; active?: boolean }

export interface CreateSingleStageExceptionDraftInput {
  positions: CareerPosition[]
  source_position_id: string
  target_position_id: string
  promotion_preset: PromotionPresetKey
  custom_min_score_percent: number
  custom_required_months: number
  store_ids: string[] | 'all'
  valid_store_ids: string[]
  effective_from: string
  actor_id: string
  at: string
  version: number
}

export function createSingleStageExceptionDraft(
  input: CreateSingleStageExceptionDraftInput,
): KpiSetVersion {
  const source = input.positions.find(
    (position) => position.id === input.source_position_id && position.active !== false,
  )
  const target = input.positions.find(
    (position) => position.id === input.target_position_id && position.active !== false,
  )
  if (!source || !target) {
    throw new Error('Chức danh nguồn hoặc chức danh mục tiêu không còn hoạt động.')
  }
  if (
    typeof source.level !== 'number' ||
    typeof target.level !== 'number' ||
    target.level !== source.level + 1
  ) {
    throw new Error('Ngoại lệ một chặng chỉ được chọn chức danh ở cấp kế tiếp.')
  }
  if (
    !Number.isFinite(input.custom_min_score_percent) ||
    input.custom_min_score_percent < 50 ||
    input.custom_min_score_percent > 100
  ) {
    throw new Error('Điểm KPI yêu cầu phải nằm trong khoảng 50 đến 100.')
  }
  if (
    !Number.isInteger(input.custom_required_months) ||
    input.custom_required_months < 1 ||
    input.custom_required_months > 24
  ) {
    throw new Error('Số tháng đạt chuẩn phải nằm trong khoảng 1 đến 24 tháng.')
  }

  const validStoreIds = new Set(input.valid_store_ids)
  const scopedStoreIds = input.store_ids === 'all' ? [...validStoreIds] : [...input.store_ids]
  if (scopedStoreIds.length === 0 || scopedStoreIds.some((storeId) => !validStoreIds.has(storeId))) {
    throw new Error('Phạm vi cửa hàng không hợp lệ hoặc chưa chọn cửa hàng áp dụng.')
  }

  const today = new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.effective_from) || input.effective_from < today) {
    throw new Error('Vui lòng chọn ngày hiệu lực hợp lệ, không nằm trong quá khứ.')
  }

  const stage: KpiCareerStageSuggestion = {
    id: `single-stage:${source.id}:${target.id}`,
    label: `${source.name} → ${target.name}`,
    from_position_id: source.id,
    from_position_name: source.name,
    to_position_id: target.id,
    to_position_name: target.name,
    template_id: guessKpiTemplateForPosition(source.name)!,
    promotion_preset: input.promotion_preset,
  }
  const [draft] = createCareerStageDrafts([stage], {
    actor_id: input.actor_id,
    at: input.at,
    effective_from: input.effective_from,
    primary_purpose: 'promotion',
    secondary_purposes: [],
    scoped_store_ids: scopedStoreIds,
    store_ids: input.store_ids,
    start_version: input.version,
  })

  return {
    ...draft,
    name: `Ngoại lệ một chặng · ${stage.label}`,
    status: 'draft',
    promotion_rule: {
      ...draft.promotion_rule!,
      min_score: Number((input.custom_min_score_percent / 20).toFixed(2)),
      required_months: input.custom_required_months,
    },
  }
}

export function guessKpiTemplateForPosition(name: string): KpiSetVersion['template_id'] {
  const normalizedName = name.toLowerCase()
  if (normalizedName.includes('trưởng ca') || normalizedName.includes('shift leader')) return 'shift_leader'
  if (normalizedName.includes('quản lý') || normalizedName.includes('manager')) return 'store_manager'
  if (normalizedName.includes('thu ngân') || normalizedName.includes('cashier')) return 'cashier'
  if (normalizedName.includes('phục vụ') || normalizedName.includes('tiếp thực') || normalizedName.includes('server')) return 'server'
  if (normalizedName.includes('bếp') || normalizedName.includes('sơ chế') || normalizedName.includes('kitchen')) return 'kitchen'
  return 'barista'
}

export function buildCareerStageSuggestions(positions: CareerPosition[]): KpiCareerStageSuggestion[] {
  const classifiedPositions = positions.filter(
    (position): position is CareerPosition & { level: number } => Number.isFinite(position.level),
  )
  const suggestions: KpiCareerStageSuggestion[] = []

  for (const fromPosition of classifiedPositions) {
    const nextLevel = fromPosition.level + 1
    const nextLevelPositions = classifiedPositions.filter((position) => position.level === nextLevel)
    if (nextLevelPositions.length === 0) continue

    const preferredTargets = selectCareerTargets(fromPosition, nextLevelPositions)
    for (const toPosition of preferredTargets) {
      suggestions.push({
        id: `career-stage:${fromPosition.id}:${toPosition.id}`,
        label: `${fromPosition.name} → ${toPosition.name}`,
        from_position_id: fromPosition.id,
        from_position_name: fromPosition.name,
        to_position_id: toPosition.id,
        to_position_name: toPosition.name,
        template_id: guessKpiTemplateForPosition(fromPosition.name)!,
        promotion_preset: resolvePromotionPreset(fromPosition.name, toPosition.name),
      })
    }
  }

  return suggestions
}

export function getAdjacentCareerTargetIds(positions: CareerPosition[], fromPositionId: string): string[] {
  const fromPosition = positions.find((position) => position.id === fromPositionId)
  const fromLevel = fromPosition?.level
  if (typeof fromLevel !== 'number' || !Number.isFinite(fromLevel)) return []

  return positions
    .filter((position) => position.id !== fromPositionId && position.level === fromLevel + 1)
    .map((position) => position.id)
}

export function createCareerStageDrafts(
  stages: KpiCareerStageSuggestion[],
  input: {
    actor_id: string
    at: string
    effective_from: string
    primary_purpose: KpiProgramPurpose
    secondary_purposes: KpiProgramPurpose[]
    scoped_store_ids: string[]
    store_ids: string[] | 'all'
    start_version: number
  },
): KpiSetVersion[] {
  return stages.map((stage, index) => {
    const versionNumber = input.start_version + index
    const draft = createVersionFromTemplate(
      stage.template_id,
      [stage.from_position_id],
      input.actor_id,
      versionNumber,
      input.at,
    )
    const normalizedGroups = normalizeCareerDraftCriterionWeights(draft.groups)
    const stageKey = `${stage.from_position_id}-${stage.to_position_id}`.replace(/[^a-zA-Z0-9_-]/g, '-')

    return {
      ...draft,
      id: `kpi_career_${stageKey}_v${versionNumber}`,
      set_id: `kpi_career_${stageKey}`,
      name: `Lộ trình Homies · ${stage.label}`,
      primary_purpose: input.primary_purpose,
      secondary_purposes: input.secondary_purposes.filter((purpose) => purpose !== input.primary_purpose),
      program_setup_step: 'review',
      source_policy: getDefaultSourcePolicy(
        input.primary_purpose,
        stage.template_id === 'shift_leader' || stage.template_id === 'store_manager' ? 'manager' : 'employee',
      ),
      promotion_rule: getDefaultPromotionRule(
        stage.from_position_id,
        stage.to_position_id,
        stage.promotion_preset,
      ),
      peer_review_policy:
        stage.template_id === 'shift_leader' || stage.template_id === 'store_manager'
          ? { ...getDefaultPeerReviewPolicy(), enabled: false, weight_percent: 0 }
          : getDefaultPeerReviewPolicy(),
      groups: normalizedGroups,
      target_profiles: [
        {
          scope: 'chain',
          targets: normalizedGroups.flatMap((group) =>
            group.criteria
              .filter((criterion) => criterion.active)
              .map((criterion) => ({
                criterion_id: criterion.id,
                target: criterion.direction === 'lower' ? 0 : criterion.direction === 'rubric' ? 3 : 80,
                score_bands: criterion.score_bands.map((band) => ({ ...band })),
              })),
          ),
        },
      ],
      store_group_snapshots:
        input.scoped_store_ids.length > 0
          ? [{ id: 'career-scope', name: 'Phạm vi chương trình', store_ids: [...input.scoped_store_ids] }]
          : [],
      store_ids: input.store_ids === 'all' ? 'all' : [...input.store_ids],
      effective_from: input.effective_from,
    }
  })
}

function normalizeCareerDraftCriterionWeights(groups: KpiGroupDefinition[]): KpiGroupDefinition[] {
  return groups.map((group) => {
    const activeCriteria = group.criteria.filter((criterion) => criterion.active)
    const currentTotal = activeCriteria.reduce((sum, criterion) => sum + criterion.weight, 0)
    if (currentTotal === 0 || currentTotal === group.weight) return group

    let allocatedWeight = 0
    let activeIndex = 0
    return {
      ...group,
      criteria: group.criteria.map((criterion) => {
        if (!criterion.active) return criterion
        activeIndex += 1
        const weight =
          activeIndex === activeCriteria.length
            ? group.weight - allocatedWeight
            : Number(((criterion.weight / currentTotal) * group.weight).toFixed(2))
        allocatedWeight += weight
        return { ...criterion, weight }
      }),
    }
  })
}

function selectCareerTargets(
  fromPosition: CareerPosition,
  candidates: Array<CareerPosition & { level: number }>,
): Array<CareerPosition & { level: number }> {
  const fromTemplate = guessKpiTemplateForPosition(fromPosition.name)
  if (fromTemplate === 'shift_leader' || fromTemplate === 'store_manager') {
    const leadershipTargets = candidates.filter((candidate) => {
      const template = guessKpiTemplateForPosition(candidate.name)
      return template === 'shift_leader' || template === 'store_manager'
    })
    return leadershipTargets.length > 0 ? leadershipTargets : candidates
  }

  const shiftLeaderTargets = candidates.filter(
    (candidate) => guessKpiTemplateForPosition(candidate.name) === 'shift_leader',
  )
  return shiftLeaderTargets.length > 0 ? shiftLeaderTargets : candidates
}

function resolvePromotionPreset(fromName: string, toName: string): KpiPromotionPresetKey {
  const fromTemplate = guessKpiTemplateForPosition(fromName)
  const toTemplate = guessKpiTemplateForPosition(toName)
  if (toTemplate === 'shift_leader') return 'employee_to_leader'
  if (fromTemplate === 'shift_leader' && toTemplate === 'store_manager') return 'supervisor_to_manager'
  if (fromTemplate === 'store_manager') return 'manager_to_area'
  return 'employee_to_core'
}

export function getDefaultSourcePolicy(
  purpose: KpiProgramPurpose,
  audience: 'employee' | 'manager',
): KpiEvaluationSourcePolicy {
  if (audience === 'manager') {
    return {
      enabled_sources: [...MANAGER_SOURCES],
      peer_reviewer_count: 0,
      peer_weight_cap: 0,
      store_360_frequency: 'quarterly',
    }
  }

  return {
    enabled_sources: [...EMPLOYEE_SOURCES],
    peer_reviewer_count: 2,
    peer_weight_cap: 15,
  }
}

export function getDefaultPromotionRule(
  fromPositionId: string,
  toPositionId: string,
  preset: PromotionPresetKey,
): KpiPromotionRule {
  const config = PROMOTION_PRESETS[preset] || PROMOTION_PRESETS.employee_to_leader

  return {
    from_position_id: fromPositionId,
    to_position_id: toPositionId,
    score_mode: config.score_mode,
    required_months: config.required_months,
    rolling_window_months: 'rolling_window_months' in config ? config.rolling_window_months : undefined,
    min_score: config.min_score,
    min_shifts: config.min_shifts,
    min_hours: config.min_hours,
    required_skill_ids: [...config.skills],
    test_min_score: 'test_min_score' in config ? config.test_min_score : undefined,
    trial_shift_count: 'trial_shift_count' in config ? config.trial_shift_count : undefined,
    trial_week_count: 'trial_week_count' in config ? config.trial_week_count : undefined,
    requires_store_360: config.requires_store_360,
    blocking_incident_codes: [...BLOCKING_INCIDENT_CODES],
    proposer_roles: [...config.proposer_roles],
    approver_roles: [...config.approver_roles],
  }
}

export function applyHomiesStandardProgram(
  version: KpiSetVersion,
  input: {
    primary_purpose: KpiProgramPurpose
    secondary_purposes: KpiProgramPurpose[]
    from_position_id?: string
    to_position_id?: string
  },
): KpiSetVersion {
  const filteredSecondary = input.secondary_purposes.filter((p) => p !== input.primary_purpose)
  const isManagerTemplate = version.template_id === 'shift_leader' || version.template_id === 'store_manager'
  const sourcePolicy = getDefaultSourcePolicy(input.primary_purpose, isManagerTemplate ? 'manager' : 'employee')

  let promotionRule: KpiPromotionRule | undefined = undefined
  let programSetupStep: KpiProgramSetupStep = 'scope'

  if (input.from_position_id && input.to_position_id) {
    let preset: PromotionPresetKey = 'employee_to_leader'
    if (input.primary_purpose === 'probation') preset = 'probation'
    else if (isManagerTemplate) preset = 'supervisor_to_manager'

    promotionRule = getDefaultPromotionRule(input.from_position_id, input.to_position_id, preset)
    programSetupStep = 'review'
  }

  return {
    ...version,
    primary_purpose: input.primary_purpose,
    secondary_purposes: filteredSecondary,
    program_setup_step: programSetupStep,
    source_policy: sourcePolicy,
    promotion_rule: promotionRule,
    peer_review_policy:
      version.peer_review_policy ??
      (isManagerTemplate
        ? { ...getDefaultPeerReviewPolicy(), enabled: false, weight_percent: 0 }
        : getDefaultPeerReviewPolicy()),
  }
}

export function prepareHomiesQuickStart(version: KpiSetVersion): KpiSetVersion {
  const primaryPurpose = version.primary_purpose ?? 'promotion'
  const secondaryPurposes = version.secondary_purposes ?? ['monthly_bonus', 'training']
  const hasConfirmedScope = Boolean(version.template_id && version.position_ids?.length)
  const hasConfirmedPath = Boolean(
    version.promotion_rule?.from_position_id &&
      version.promotion_rule?.to_position_id &&
      version.promotion_rule.from_position_id !== version.promotion_rule.to_position_id,
  )

  if (!hasConfirmedScope || !hasConfirmedPath) {
    const audience =
      version.template_id === 'shift_leader' || version.template_id === 'store_manager' ? 'manager' : 'employee'

    return {
      ...version,
      primary_purpose: primaryPurpose,
      secondary_purposes: secondaryPurposes.filter((purpose) => purpose !== primaryPurpose),
      source_policy: getDefaultSourcePolicy(primaryPurpose, audience),
      program_setup_step: 'scope',
    }
  }

  const preparedVersion = {
    ...version,
    groups: structuredClone(getFnbTemplate(version.template_id!).groups),
  }

  return applyHomiesStandardProgram(preparedVersion, {
    primary_purpose: primaryPurpose,
    secondary_purposes: secondaryPurposes,
    from_position_id: version.promotion_rule!.from_position_id,
    to_position_id: version.promotion_rule!.to_position_id,
  })
}

export function isKpiVersionEditable(version: KpiSetVersion): boolean {
  return version.status === 'draft'
}

export function validateProgramVersion(version: KpiSetVersion): KpiProgramValidationIssue[] {
  const issues: KpiProgramValidationIssue[] = []

  // 1. Kiểm tra Mục tiêu chính
  if (!version.primary_purpose) {
    issues.push({
      code: 'MISSING_PRIMARY_PURPOSE',
      path: 'primary_purpose',
      message: 'Chương trình cần có một mục tiêu chính.',
    })
  }

  // 2. Kiểm tra trùng lặp mục tiêu
  if (version.primary_purpose && version.secondary_purposes?.includes(version.primary_purpose)) {
    issues.push({
      code: 'DUPLICATE_PURPOSE',
      path: 'secondary_purposes',
      message: 'Mục tiêu đi kèm không được trùng với mục tiêu chính.',
    })
  }

  // 3. Kiểm tra phạm vi chức danh
  if (!version.position_ids || version.position_ids.length === 0) {
    issues.push({
      code: 'MISSING_POSITION_SCOPE',
      path: 'position_ids',
      message: 'Chương trình cần được gán cho ít nhất một chức danh.',
    })
  }

  // 4. Kiểm tra lộ trình thăng tiến
  if (
    !version.promotion_rule ||
    !version.promotion_rule.from_position_id ||
    !version.promotion_rule.to_position_id ||
    version.promotion_rule.from_position_id === version.promotion_rule.to_position_id
  ) {
    issues.push({
      code: 'MISSING_PROMOTION_PATH',
      path: 'promotion_rule',
      message: 'Chương trình xét tăng bậc cần có vị trí hiện tại và vị trí hướng tới khác nhau.',
    })
  }

  // 5. Kiểm tra chính sách nguồn đánh giá
  if (!version.source_policy) {
    issues.push({
      code: 'MISSING_SOURCE_POLICY',
      path: 'source_policy',
      message: 'Chương trình cần lưu ít nhất một nguồn đánh giá.',
    })
  } else {
    const sp = version.source_policy
    if (!sp.enabled_sources || sp.enabled_sources.length === 0) {
      issues.push({
        code: 'INVALID_SOURCE_POLICY',
        path: 'source_policy.enabled_sources',
        message: 'Cần chọn ít nhất một nguồn đánh giá.',
      })
    }
    if (sp.enabled_sources?.includes('peer') && sp.peer_reviewer_count !== 2) {
      issues.push({
        code: 'INVALID_SOURCE_POLICY',
        path: 'source_policy.peer_reviewer_count',
        message: 'Đánh giá đồng nghiệp cần đúng 2 người đánh giá.',
      })
    }
    if (sp.peer_weight_cap < 0 || sp.peer_weight_cap > 15) {
      issues.push({
        code: 'INVALID_SOURCE_POLICY',
        path: 'source_policy.peer_weight_cap',
        message: 'Trọng số đánh giá đồng nghiệp tối đa là 15%.',
      })
    }
  }

  // 6. Kiểm tra chính sách đánh giá đồng nghiệp
  if (version.peer_review_policy) {
    const peerIssues = validatePeerReviewPolicy(version.peer_review_policy)
    for (const issue of peerIssues) {
      issues.push({
        code: issue.code,
        path: 'peer_review_policy',
        message: issue.message,
      })
    }
  }

  // 7. Kiểm tra điều kiện tăng bậc chi tiết
  if (version.promotion_rule) {
    const pr = version.promotion_rule
    if (pr.required_months < 0 || pr.min_score < 0 || pr.min_score > 5 || pr.min_shifts < 0 || pr.min_hours < 0) {
      issues.push({
        code: 'INVALID_PROMOTION_RULE',
        path: 'promotion_rule',
        message: 'Các chỉ số điều kiện không được là số âm và điểm nằm trong thang 1-5.',
      })
    }
    if (pr.score_mode === 'rolling' && (!pr.rolling_window_months || pr.rolling_window_months < pr.required_months)) {
      issues.push({
        code: 'INVALID_PROMOTION_RULE',
        path: 'promotion_rule.rolling_window_months',
        message: 'Khoảng thời gian xét rolling window phải lớn hơn hoặc bằng số tháng đạt chuẩn.',
      })
    }
  }

  return issues
}
