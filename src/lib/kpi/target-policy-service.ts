import type {
  KpiCriterionTarget,
  KpiScoreBand,
  KpiSetSnapshot,
  KpiSetVersion,
  KpiStoreGroupSnapshot,
  KpiStoreTargetOverride,
} from './types'

export interface ResolvedKpiTarget {
  target: number
  score_bands: KpiScoreBand[]
  source: 'override' | 'store_group' | 'chain'
}

export function resolveCriterionTarget(
  version: KpiSetVersion | KpiSetSnapshot,
  criterionId: string,
  storeId: string,
  at: string
): ResolvedKpiTarget | undefined {
  const storeGroupTarget = findStoreGroupTarget(version, criterionId, storeId)
  const chainTarget = findChainTarget(version, criterionId)
  const override = version.target_overrides?.find(
    (item) =>
      item.store_id === storeId &&
      item.criterion_id === criterionId &&
      isDateInRange(at, item.effective_from, item.effective_to)
  )

  if (override) {
    return {
      target: override.target,
      score_bands: cloneScoreBands(
        storeGroupTarget?.score_bands ?? chainTarget?.score_bands ?? suggestScoreBands(override.target, 'higher')
      ),
      source: 'override',
    }
  }

  if (storeGroupTarget) {
    return {
      target: storeGroupTarget.target,
      score_bands: cloneScoreBands(storeGroupTarget.score_bands),
      source: 'store_group',
    }
  }

  if (chainTarget) {
    return {
      target: chainTarget.target,
      score_bands: cloneScoreBands(chainTarget.score_bands),
      source: 'chain',
    }
  }

  return undefined
}

export function suggestScoreBands(target: number, direction: 'higher' | 'lower'): KpiScoreBand[] {
  const normalizedTarget = Math.max(0, target)

  if (direction === 'higher') {
    if (normalizedTarget === 0) {
      return buildContiguousBands([0, 0, 0, 0.03, 0.2], [1, 2, 3, 4, 5])
    }

    if (normalizedTarget < 0.01) {
      return [
        { min: 0, max: 0, score: 1 },
        { min: 0, max: 0, score: 2 },
        { min: 0, max: 0.01, score: 3 },
        { min: 0.02, max: 0.02, score: 4 },
        { min: 0.03, max: null, score: 5 },
      ]
    }

    const score3Min = round2(normalizedTarget)
    const score2Min = findLowerBandTwoMin(score3Min, round2(normalizedTarget * 0.8))
    const score4Min = Math.max(round2(normalizedTarget * 1.1), nextCent(score3Min))
    const score5Min = Math.max(round2(normalizedTarget * 1.2), nextCent(score4Min))

    return [
      { min: 0, max: previousMax(score2Min), score: 1 },
      { min: score2Min, max: previousMax(score3Min), score: 2 },
      { min: score3Min, max: previousCent(score4Min), score: 3 },
      { min: score4Min, max: previousCent(score5Min), score: 4 },
      { min: score5Min, max: null, score: 5 },
    ]
  }

  if (normalizedTarget === 0) {
    return buildContiguousBands([0, 0.01, 0.11, 0.21, 0.31], [5, 4, 3, 2, 1])
  }

  const score4Min = nextCent(normalizedTarget)
  const score3Min = round2(normalizedTarget * 1.1)
  const score2Min = round2(normalizedTarget * 1.4)
  const score1Min = round2(normalizedTarget * 1.6)

  return buildContiguousBands([0, score4Min, score3Min, score2Min, score1Min], [5, 4, 3, 2, 1])
}

export function validateStoreGroupCoverage(groups: KpiStoreGroupSnapshot[], storeIds: string[]): string[] {
  const coveredStoreIds = new Set(groups.flatMap((group) => group.store_ids))
  const missingStoreIds: string[] = []
  const seenMissing = new Set<string>()

  for (const storeId of storeIds) {
    if (!coveredStoreIds.has(storeId) && !seenMissing.has(storeId)) {
      missingStoreIds.push(storeId)
      seenMissing.add(storeId)
    }
  }

  return missingStoreIds
}

export function isValidStoreTargetOverride(
  override: KpiStoreTargetOverride,
  allowedStoreIds: string[],
  allowedCriterionIds: string[],
): boolean {
  return Boolean(
    allowedStoreIds.includes(override.store_id) &&
      allowedCriterionIds.includes(override.criterion_id) &&
      Number.isFinite(override.target) &&
      override.reason.trim() &&
      override.owner_id.trim() &&
      override.effective_from &&
      override.effective_to &&
      override.effective_from.slice(0, 10) <= override.effective_to.slice(0, 10),
  )
}

function findStoreGroupTarget(
  version: KpiSetVersion | KpiSetSnapshot,
  criterionId: string,
  storeId: string
): KpiCriterionTarget | undefined {
  const group = version.store_group_snapshots?.find((item) => item.store_ids.includes(storeId))
  if (!group) {
    return undefined
  }

  return version.target_profiles
    ?.find((profile) => profile.scope === 'store_group' && profile.store_group_id === group.id)
    ?.targets.find((target) => target.criterion_id === criterionId)
}

function findChainTarget(version: KpiSetVersion | KpiSetSnapshot, criterionId: string): KpiCriterionTarget | undefined {
  return version.target_profiles
    ?.find((profile) => profile.scope === 'chain')
    ?.targets.find((target) => target.criterion_id === criterionId)
}

function isDateInRange(at: string, from: string, to: string): boolean {
  const currentDate = at.slice(0, 10)
  return currentDate >= from.slice(0, 10) && currentDate <= to.slice(0, 10)
}

function cloneScoreBands(scoreBands: KpiScoreBand[]): KpiScoreBand[] {
  return scoreBands.map((band) => ({ ...band }))
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function previousCent(value: number): number {
  return round2(value - 0.01)
}

function previousMax(value: number): number {
  return Math.max(0, previousCent(value))
}

function nextCent(value: number): number {
  return round2(round2(value) + 0.01)
}

function findLowerBandTwoMin(score3Min: number, preferredMin: number): number {
  if (score3Min <= 0.01) {
    return 0
  }

  return Math.min(Math.max(0.01, preferredMin), previousCent(score3Min))
}

function buildContiguousBands(rawMins: number[], scores: KpiScoreBand['score'][]): KpiScoreBand[] {
  const mins: number[] = []

  for (const [index, value] of rawMins.entries()) {
    const roundedValue = Math.max(0, round2(value))
    if (index === 0) {
      mins.push(roundedValue)
      continue
    }

    mins.push(Math.max(roundedValue, nextCent(mins[index - 1])))
  }

  return mins.map((min, index) => ({
    min,
    max: index === mins.length - 1 ? null : previousCent(mins[index + 1]),
    score: scores[index],
  }))
}
