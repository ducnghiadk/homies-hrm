import { validateStoreGroupCoverage } from './target-policy-service.ts'
import type { KpiCriterionDefinition, KpiGroupDefinition, KpiSetSnapshot, KpiSetVersion, KpiTargetProfile } from './types'

export type KpiValidationCode =
  | 'GROUP_WEIGHT_TOTAL'
  | 'CRITERION_WEIGHT_TOTAL'
  | 'MISSING_AUTO_SOURCE'
  | 'MISSING_GUIDE'
  | 'MISSING_EVALUATOR'
  | 'EFFECTIVE_RANGE_OVERLAP'
  | 'MISSING_POSITION_SCOPE'
  | 'MISSING_METRIC_METADATA'
  | 'MISSING_STORE_GROUP'
  | 'MISSING_TARGET'
  | 'INVALID_OVERRIDE'

export interface KpiValidationIssue {
  code: KpiValidationCode
  path: string
  message: string
}

export function validateKpiSet(
  version: KpiSetVersion,
  existingVersions: KpiSetVersion[] = [],
  storeIds: string[] = [],
): KpiValidationIssue[] {
  const issues: KpiValidationIssue[] = []
  const activeGroups = version.groups.filter((group) => group.criteria.some((criterion) => criterion.active))
  const totalGroupWeight = sumWeights(activeGroups.map((group) => group.weight))

  if (totalGroupWeight !== 100) {
    issues.push({
      code: 'GROUP_WEIGHT_TOTAL',
      path: 'groups',
      message: `Tong trong so nhom phai bang 100%, hien tai la ${totalGroupWeight}%`,
    })
  }

  version.groups.forEach((group, groupIndex) => {
    issues.push(...validateGroup(group, groupIndex))
  })

  if (version.template_id) {
    issues.push(...validateTemplateConfiguration(version, storeIds))
  }

  if (hasEffectiveRangeOverlap(version, existingVersions)) {
    issues.push({
      code: 'EFFECTIVE_RANGE_OVERLAP',
      path: 'effective_from',
      message: 'Bo KPI bi trung doi tuong hoac thoi gian hieu luc voi phien ban khac',
    })
  }

  return issues
}

export function cloneAsNextDraft(version: KpiSetVersion, actorId: string, at: string): KpiSetVersion {
  const draft = structuredClone(version)

  draft.id = `${version.set_id}-v${version.version + 1}`
  draft.version = version.version + 1
  draft.status = 'draft'
  draft.created_by = actorId
  draft.created_at = at
  draft.published_by = undefined
  draft.published_at = undefined

  return draft
}

export function publishVersion(
  version: KpiSetVersion,
  actorId: string,
  at: string,
  existingVersions: KpiSetVersion[] = [],
  storeIds: string[] = [],
): KpiSetVersion {
  if (version.status === 'published') {
    throw new Error('Published version cannot be edited directly')
  }

  const issues = validateKpiSet(version, existingVersions, storeIds)

  if (issues.length > 0) {
    throw new Error(`Khong the cong bo bo KPI khi con ${issues.length} loi xac thuc`)
  }

  return {
    ...structuredClone(version),
    status: 'published',
    published_by: actorId,
    published_at: at,
  }
}

export function createPeriodSnapshot(version: KpiSetVersion): KpiSetSnapshot {
  const clone = structuredClone(version)

  return {
    ...clone,
    source_status: 'published',
  }
}

function validateGroup(group: KpiGroupDefinition, groupIndex: number): KpiValidationIssue[] {
  const issues: KpiValidationIssue[] = []
  const activeCriteria = group.criteria.filter((criterion) => criterion.active)
  const criteriaWeightTotal = sumWeights(activeCriteria.map((criterion) => criterion.weight))

  if (criteriaWeightTotal !== group.weight) {
    issues.push({
      code: 'CRITERION_WEIGHT_TOTAL',
      path: `groups.${groupIndex}.criteria`,
      message: `Tong trong so tieu chi cua nhom ${group.name} phai bang ${group.weight}%`,
    })
  }

  activeCriteria.forEach((criterion, criterionIndex) => {
    if (criterion.scoring_mode === 'automatic' && !criterion.source_key) {
      issues.push({
        code: 'MISSING_AUTO_SOURCE',
        path: `groups.${groupIndex}.criteria.${criterionIndex}.source_key`,
        message: `Tieu chi ${criterion.name} dang de tu dong nhung chua co nguon du lieu`,
      })
    }

    if (!criterion.description.trim()) {
      issues.push({
        code: 'MISSING_GUIDE',
        path: `groups.${groupIndex}.criteria.${criterionIndex}.description`,
        message: `Tieu chi ${criterion.name} chua co huong dan cham diem`,
      })
    }

    if (criterion.scoring_mode === 'leader' || criterion.scoring_mode === 'combined') {
      if (!criterion.adjustment_reason_required) {
        issues.push({
          code: 'MISSING_EVALUATOR',
          path: `groups.${groupIndex}.criteria.${criterionIndex}.scoring_mode`,
          message: `Tieu chi ${criterion.name} can co nguoi chiu trach nhiem cham va giai trinh`,
        })
      }
    }
  })

  return issues
}

function validateTemplateConfiguration(version: KpiSetVersion, storeIds: string[]): KpiValidationIssue[] {
  const issues: KpiValidationIssue[] = []
  const activeCriteria = getActiveCriteria(version)

  if (!version.position_ids || version.position_ids.length === 0) {
    issues.push({
      code: 'MISSING_POSITION_SCOPE',
      path: 'position_ids',
      message: 'Mau KPI F&B can gan it nhat mot vi tri ap dung',
    })
  }

  activeCriteria.forEach((criterion) => {
    if (!criterion.unit || !criterion.direction) {
      issues.push({
        code: 'MISSING_METRIC_METADATA',
        path: `criteria.${criterion.id}`,
        message: `Tieu chi ${criterion.name} can co don vi do va chieu tinh diem`,
      })
    }

    if (!hasTargetForCriterion(criterion.id, version.target_profiles ?? [], version.store_group_snapshots ?? [], storeIds)) {
      issues.push({
        code: 'MISSING_TARGET',
        path: `target_profiles.${criterion.id}`,
        message: `Tieu chi ${criterion.name} chua co muc tieu cham diem`,
      })
    }
  })

  if (storeIds.length > 0) {
    const missingStoreIds = validateStoreGroupCoverage(version.store_group_snapshots ?? [], storeIds)

    if (missingStoreIds.length > 0) {
      issues.push({
        code: 'MISSING_STORE_GROUP',
        path: 'store_group_snapshots',
        message: `Con ${missingStoreIds.length} cua hang chua nam trong nhom muc tieu`,
      })
    }
  }

  issues.push(...validateTargetOverrides(version, activeCriteria, storeIds))

  return issues
}

function validateTargetOverrides(
  version: KpiSetVersion,
  activeCriteria: KpiCriterionDefinition[],
  storeIds: string[],
): KpiValidationIssue[] {
  const issues: KpiValidationIssue[] = []
  const activeCriterionIds = new Set(activeCriteria.map((criterion) => criterion.id))
  const scopedStoreIds = new Set(storeIds)

  version.target_overrides?.forEach((override, index) => {
    const hasInvalidCriterion = !activeCriterionIds.has(override.criterion_id)
    const hasMissingOwnership = !override.reason.trim() || !override.owner_id.trim()
    const hasInvalidRange = normalizeBusinessDate(override.effective_from) > normalizeBusinessDate(override.effective_to)
    const hasInvalidStore = scopedStoreIds.size > 0 && !scopedStoreIds.has(override.store_id)

    if (hasInvalidCriterion || hasMissingOwnership || hasInvalidRange || hasInvalidStore) {
      issues.push({
        code: 'INVALID_OVERRIDE',
        path: `target_overrides.${index}`,
        message: 'Ngoai le muc tieu cua hang chua hop le',
      })
    }
  })

  return issues
}

function hasTargetForCriterion(
  criterionId: string,
  targetProfiles: KpiTargetProfile[],
  storeGroupSnapshots: NonNullable<KpiSetVersion['store_group_snapshots']>,
  storeIds: string[],
): boolean {
  const chainProfile = targetProfiles.find((profile) => profile.scope === 'chain')

  if (chainProfile?.targets.some((target) => target.criterion_id === criterionId)) {
    return true
  }

  const requiredStoreGroups =
    storeIds.length > 0
      ? storeGroupSnapshots.filter((storeGroup) => storeGroup.store_ids.some((storeId) => storeIds.includes(storeId)))
      : storeGroupSnapshots

  if (requiredStoreGroups.length === 0) {
    return false
  }

  return requiredStoreGroups.every((storeGroup) =>
    targetProfiles.some(
      (profile) =>
        profile.scope === 'store_group' &&
        profile.store_group_id === storeGroup.id &&
        profile.targets.some((target) => target.criterion_id === criterionId),
    ),
  )
}

function normalizeBusinessDate(value: string): string {
  return value.split('T')[0]
}

function getActiveCriteria(version: KpiSetVersion): KpiCriterionDefinition[] {
  return version.groups.flatMap((group) => group.criteria.filter((criterion) => criterion.active))
}

function hasEffectiveRangeOverlap(version: KpiSetVersion, existingVersions: KpiSetVersion[]): boolean {
  return existingVersions.some((current) => {
    if (current.id === version.id) {
      return false
    }

    if (current.set_id !== version.set_id) {
      return false
    }

    if (!hasSharedScope(version, current)) {
      return false
    }

    return dateRangesOverlap(version.effective_from, version.effective_to, current.effective_from, current.effective_to)
  })
}

function hasSharedScope(left: KpiSetVersion, right: KpiSetVersion): boolean {
  const storeOverlap = hasScopeOverlap(left.store_ids, right.store_ids)
  const leftUsesTemplatePositions = Boolean(left.template_id && left.position_ids && left.position_ids.length > 0)
  const rightUsesTemplatePositions = Boolean(right.template_id && right.position_ids && right.position_ids.length > 0)
  const roleOverlap =
    leftUsesTemplatePositions && rightUsesTemplatePositions
      ? left.position_ids!.some((positionId) => right.position_ids!.includes(positionId))
      : left.level_codes.some((level) => right.level_codes.includes(level))

  return storeOverlap && roleOverlap
}

function hasScopeOverlap(left: string[] | 'all', right: string[] | 'all'): boolean {
  if (left === 'all' || right === 'all') {
    return true
  }

  return left.some((item) => right.includes(item))
}

function dateRangesOverlap(leftStart: string, leftEnd?: string, rightStart?: string, rightEnd?: string): boolean {
  const normalizedLeftEnd = leftEnd ?? '9999-12-31'
  const normalizedRightEnd = rightEnd ?? '9999-12-31'

  return leftStart <= normalizedRightEnd && rightStart !== undefined && rightStart <= normalizedLeftEnd
}

function sumWeights(values: number[]): number {
  return Math.round(values.reduce((sum, value) => sum + value, 0) * 100) / 100
}
