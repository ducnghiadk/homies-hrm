import { DEFAULT_KPI_POLICY } from './default-policy.ts'
import type { KpiLevelCode } from './types.ts'
import type { EmployeeLevel, KPIEvaluation } from '../kpi-types.ts'

export type LegacyMigrationStatus = 'auto_convertible' | 'needs_mapping' | 'rejected'

export interface LegacyLevelClassification {
  status: LegacyMigrationStatus
  suggested_level?: KpiLevelCode
  allowed_levels: KpiLevelCode[]
  reason: string
}

export type LegacyLevelMapping = Partial<Record<EmployeeLevel, KpiLevelCode>>

export interface LegacyMigrationItem {
  evaluation_id: string
  employee_id: string
  store_id: string
  period: string
  legacy_level: EmployeeLevel
  status: LegacyMigrationStatus
  reason: string
  allowed_levels: KpiLevelCode[]
  new_level?: KpiLevelCode
  new_score: number
  new_grade_code: string
  legacy_score: number
}

export interface LegacyMigrationSummary {
  total_rows: number
  auto_convertible: number
  needs_mapping: number
  rejected: number
  ready_to_import: number
}

export interface LegacyMigrationPreview {
  summary: LegacyMigrationSummary
  items: LegacyMigrationItem[]
  checksum: string
}

export interface BuildLegacyMigrationPreviewInput {
  evaluations: KPIEvaluation[]
  level_mapping?: LegacyLevelMapping
}

const SCORE_BANDS = [
  { min: 95, max: 100, score: 5 },
  { min: 85, max: 94.99, score: 4 },
  { min: 75, max: 84.99, score: 3 },
  { min: 60, max: 74.99, score: 2 },
  { min: 0, max: 59.99, score: 1 },
] as const

export function classifyLegacyLevel(level: EmployeeLevel): LegacyLevelClassification {
  if (level === 'L2') {
    return {
      status: 'auto_convertible',
      suggested_level: 'pt2',
      allowed_levels: ['pt2'],
      reason: 'L2 trong bo cu map thang sang PT2 trong bo KPI moi.',
    }
  }

  if (level === 'L3') {
    return {
      status: 'needs_mapping',
      suggested_level: undefined,
      allowed_levels: ['senior', 'shift_leader'],
      reason: 'L3 trong bo cu gom ca Senior va Truong ca, can Admin chon dich danh dung.',
    }
  }

  if (level === 'L0' || level === 'L1') {
    return {
      status: 'needs_mapping',
      suggested_level: undefined,
      allowed_levels: ['pt1_tn', 'pt1_pc'],
      reason: 'L0-L1 trong bo cu chua tach ro Thu ngan va Pha che, can Admin chon lai.',
    }
  }

  return {
    status: 'rejected',
    suggested_level: undefined,
    allowed_levels: [],
    reason: 'Pilot KPI SaaS hien tai chua nhap du lieu L4-L5.',
  }
}

export function convertLegacyScoreToKpiScore(score: number): number {
  const safeScore = clamp(score, 0, 100)
  return SCORE_BANDS.find((band) => safeScore >= band.min && safeScore <= band.max)?.score ?? 1
}

export function buildLegacyMigrationPreview(input: BuildLegacyMigrationPreviewInput): LegacyMigrationPreview {
  const items = input.evaluations.map((evaluation) => {
    const base = classifyLegacyLevel(evaluation.employee_level)
    const overrideLevel = input.level_mapping?.[evaluation.employee_level]
    const nextLevel = overrideLevel ?? base.suggested_level
    const nextStatus = base.status === 'needs_mapping' && overrideLevel
      ? 'auto_convertible'
      : base.status
    const nextScore = convertLegacyScoreToKpiScore(evaluation.total_score)

    return {
      evaluation_id: evaluation.id,
      employee_id: evaluation.employee_id,
      store_id: evaluation.store_id,
      period: evaluation.period,
      legacy_level: evaluation.employee_level,
      status: nextStatus,
      reason: base.reason,
      allowed_levels: base.allowed_levels,
      new_level: nextLevel,
      new_score: nextScore,
      new_grade_code: mapScoreToGradeCode(nextScore),
      legacy_score: evaluation.total_score,
    } satisfies LegacyMigrationItem
  })

  const summary: LegacyMigrationSummary = {
    total_rows: items.length,
    auto_convertible: items.filter((item) => item.status === 'auto_convertible').length,
    needs_mapping: items.filter((item) => item.status === 'needs_mapping').length,
    rejected: items.filter((item) => item.status === 'rejected').length,
    ready_to_import: items.filter((item) => item.status !== 'rejected' && item.new_level).length,
  }

  return {
    summary,
    items,
    checksum: createChecksum({
      summary,
      mappings: input.level_mapping ?? {},
      rows: items.map((item) => ({
        evaluation_id: item.evaluation_id,
        legacy_level: item.legacy_level,
        new_level: item.new_level ?? null,
        new_score: item.new_score,
        status: item.status,
      })),
    }),
  }
}

function mapScoreToGradeCode(score: number): string {
  return DEFAULT_KPI_POLICY.grades.find((grade) => score >= grade.min_score && score <= grade.max_score)?.code ?? 'critical'
}

function createChecksum(input: unknown): string {
  const raw = JSON.stringify(input)
  let hash = 2166136261

  for (let index = 0; index < raw.length; index += 1) {
    hash ^= raw.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return Math.abs(hash >>> 0).toString(36).padStart(8, '0')
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}
