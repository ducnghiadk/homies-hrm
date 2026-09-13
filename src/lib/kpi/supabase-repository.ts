import { supabase } from '../supabase.ts'
import type { KpiDatabase, KpiRepository } from './repository.ts'
import { createEmptyKpiDatabase } from './repository.ts'
import type {
  KpiAppeal,
  KpiAuditLog,
  KpiCriterionScore,
  KpiDevelopmentCase,
  KpiEmployeeRef,
  KpiEvaluation,
  KpiIncident,
  KpiIncidentViolation,
  KpiLevelCode,
  KpiPeriod,
  KpiPeriodStatus,
  KpiSetSnapshot,
  KpiSetStatus,
  KpiSetVersion,
} from './types.ts'
import type {
  CareerGradeCode,
  CareerGradeDefinition,
  EmployeeCareerPlacement,
  EmployeeSkillCertification,
  OperationalSkillCode,
  OperationalSkillDefinition,
} from './career-grade-types.ts'

type JsonRow = Record<string, unknown>

export interface SupabaseKpiGatewayRows {
  sets?: JsonRow[]
  set_versions: JsonRow[]
  periods: JsonRow[]
  period_employees: JsonRow[]
  evaluations: JsonRow[]
  criterion_scores: JsonRow[]
  incidents: JsonRow[]
  incident_violations: JsonRow[]
  appeals: JsonRow[]
  development_cases: JsonRow[]
  audit_logs: JsonRow[]
  career_maps?: JsonRow[]
  career_map_nodes?: JsonRow[]
  career_map_edges?: JsonRow[]
  position_criteria_profiles?: JsonRow[]
  position_criteria_items?: JsonRow[]
  career_employee_placements?: JsonRow[]
  career_map_approval_logs?: JsonRow[]
  career_grades?: JsonRow[]
  operational_skills?: JsonRow[]
  employee_skill_certifications?: JsonRow[]
  employee_career_placements?: JsonRow[]
}

export interface SupabaseKpiGateway {
  loadAll(): Promise<SupabaseKpiGatewayRows>
  replaceAll(rows: SupabaseKpiGatewayRows): Promise<void>
}

export interface CreateSupabaseKpiRepositoryOptions {
  gateway?: SupabaseKpiGateway
}

const REVISION_ENTITY_TYPE = 'kpi_database'
const REVISION_ENTITY_ID = 'global'
const REVISION_ACTION = 'revision'

export function createSupabaseKpiRepository(
  options: CreateSupabaseKpiRepositoryOptions = {}
): KpiRepository {
  const gateway = options.gateway ?? createDefaultSupabaseKpiGateway()

  return {
    async load() {
      const rows = await gateway.loadAll()
      return mapRowsToDatabase(rows)
    },

    async save(next, expectedRevision) {
      const current = await this.load()

      if (current.revision !== expectedRevision) {
        throw new Error('Du lieu da duoc nguoi khac cap nhat. Vui long tai lai va thu lai.')
      }

      try {
        await gateway.replaceAll(mapDatabaseToRows(next, current))
      } catch {
        throw new Error('Khong the dong bo KPI len Supabase luc nay. Du lieu nhap cua ban van giu o man hinh hien tai.')
      }

      return mapRowsToDatabase(mapDatabaseToRows(next, current))
    },

    async reset(seed) {
      try {
        await gateway.replaceAll(mapDatabaseToRows(seed))
      } catch {
        throw new Error('Khong the dong bo KPI len Supabase luc nay. Du lieu nhap cua ban van giu o man hinh hien tai.')
      }
    },
  }
}

export function mapRowsToDatabase(rows: SupabaseKpiGatewayRows): KpiDatabase {
  const db = createEmptyKpiDatabase()
  const setCodeById = new Map<string, string>()

  for (const row of rows.sets ?? []) {
    if (typeof row.id === 'string' && typeof row.code === 'string') {
      setCodeById.set(row.id, row.code)
    }
  }

  db.sets = rows.set_versions.map((row) => mapSetVersionRow(row, setCodeById))

  const periodEmployeesByPeriod = new Map<string, JsonRow[]>()
  for (const row of rows.period_employees) {
    const periodId = String(row.period_id ?? '')
    const bucket = periodEmployeesByPeriod.get(periodId) ?? []
    bucket.push(row)
    periodEmployeesByPeriod.set(periodId, bucket)
  }

  db.periods = rows.periods.map((row) => mapPeriodRow(row, periodEmployeesByPeriod.get(String(row.id ?? '')) ?? []))

  const periodEmployeeById = new Map<string, JsonRow>()
  for (const row of rows.period_employees) {
    periodEmployeeById.set(String(row.id ?? ''), row)
  }

  const criterionScoresByEvaluation = new Map<string, JsonRow[]>()
  for (const row of rows.criterion_scores) {
    const evaluationId = String(row.evaluation_id ?? '')
    const bucket = criterionScoresByEvaluation.get(evaluationId) ?? []
    bucket.push(row)
    criterionScoresByEvaluation.set(evaluationId, bucket)
  }

  db.evaluations = rows.evaluations.map((row) => mapEvaluationRow(
    row,
    periodEmployeeById.get(String(row.period_employee_id ?? '')),
    criterionScoresByEvaluation.get(String(row.id ?? '')) ?? []
  ))

  const violationsByIncident = new Map<string, JsonRow[]>()
  for (const row of rows.incident_violations) {
    const incidentId = String(row.incident_id ?? '')
    const bucket = violationsByIncident.get(incidentId) ?? []
    bucket.push(row)
    violationsByIncident.set(incidentId, bucket)
  }

  db.incidents = rows.incidents.map((row) => mapIncidentRow(row, violationsByIncident.get(String(row.id ?? '')) ?? []))
  db.appeals = rows.appeals.map(mapAppealRow)
  db.development_cases = rows.development_cases.map(mapDevelopmentCaseRow)
  db.audit_logs = rows.audit_logs.map(mapAuditLogRow)
  db.revision = getLatestRevision(db.audit_logs)

  if (rows.career_maps && rows.career_maps.length > 0) {
    db.career_maps = rows.career_maps.map((row) =>
      mapCareerMapRow(row, rows.career_map_nodes || [], rows.career_map_edges || [])
    )
  }
  if (rows.position_criteria_profiles && rows.position_criteria_profiles.length > 0) {
    db.position_criteria_profiles = rows.position_criteria_profiles.map((row) =>
      mapPositionCriteriaProfileRow(row, rows.position_criteria_items || [])
    )
  }
  if (rows.career_employee_placements && rows.career_employee_placements.length > 0) {
    db.career_employee_placements = rows.career_employee_placements.map(mapCareerPlacementRow)
  }
  if (rows.career_map_approval_logs && rows.career_map_approval_logs.length > 0) {
    db.career_map_approval_logs = rows.career_map_approval_logs.map(mapCareerApprovalLogRow)
  }
  if (rows.career_grades && rows.career_grades.length > 0) {
    db.career_grades = rows.career_grades.map(mapCareerGradeRow)
  }
  if (rows.operational_skills && rows.operational_skills.length > 0) {
    db.operational_skills = rows.operational_skills.map(mapOperationalSkillRow)
  }
  if (rows.employee_skill_certifications && rows.employee_skill_certifications.length > 0) {
    db.employee_skill_certifications = rows.employee_skill_certifications.map(mapEmployeeSkillCertificationRow)
  }
  if (rows.employee_career_placements && rows.employee_career_placements.length > 0) {
    db.employee_career_placements = rows.employee_career_placements.map(mapEmployeeCareerPlacementRow)
  }

  return db
}

export function mapDatabaseToRows(next: KpiDatabase, current?: KpiDatabase): SupabaseKpiGatewayRows {
  const currentRows = current ? mapDatabaseToRowsWithoutRecursion(current) : undefined
  const setMetadata = buildSetMetadata(next, currentRows?.sets ?? [])
  const revisionAudit = buildRevisionAudit(next.revision, next.audit_logs)

  return {
    sets: setMetadata,
    set_versions: next.sets.map((item) => toSetVersionRow(item, setMetadata)),
    periods: next.periods.map((item) => toPeriodRow(item)),
    period_employees: next.evaluations.map((item) => toPeriodEmployeeRow(item)).filter(uniqueById),
    evaluations: next.evaluations.map((item) => toEvaluationRow(item)),
    criterion_scores: next.evaluations.flatMap((item) => item.scores.map((score) => toCriterionScoreRow(item.id, score))),
    incidents: next.incidents.map((item) => toIncidentRow(item, currentRows?.incidents ?? [])),
    incident_violations: next.incidents.flatMap((item) => item.violations.map((violation, index) => toIncidentViolationRow(item.id, violation, index))),
    appeals: next.appeals.map((item) => toAppealRow(item, currentRows?.appeals ?? [], next)),
    development_cases: next.development_cases.map((item) => toDevelopmentCaseRow(item, currentRows?.development_cases ?? [])),
    audit_logs: mergeAuditLogs(next.audit_logs, revisionAudit),
    career_maps: (next.career_maps || []).map(toCareerMapRow),
    career_map_nodes: (next.career_maps || []).flatMap((m) => m.nodes.map((n) => toCareerMapNodeRow(m.id, n))),
    career_map_edges: (next.career_maps || []).flatMap((m) => m.edges.map((e) => toCareerMapEdgeRow(m.id, e))),
    position_criteria_profiles: (next.position_criteria_profiles || []).map(toPositionCriteriaProfileRow),
    position_criteria_items: (next.position_criteria_profiles || []).flatMap((p) =>
      p.criteria.map((c) => toPositionCriteriaItemRow(p.id, c))
    ),
    career_employee_placements: (next.career_employee_placements || []).map(toCareerPlacementRow),
    career_map_approval_logs: (next.career_map_approval_logs || []).map(toCareerApprovalLogRow),
    career_grades: (next.career_grades || []).map(toCareerGradeRow),
    operational_skills: (next.operational_skills || []).map(toOperationalSkillRow),
    employee_skill_certifications: (next.employee_skill_certifications || []).map(toEmployeeSkillCertificationRow),
    employee_career_placements: (next.employee_career_placements || []).map(toEmployeeCareerPlacementRow),
  }
}

function mapDatabaseToRowsWithoutRecursion(next: KpiDatabase): SupabaseKpiGatewayRows {
  return {
    sets: buildSetMetadata(next),
    set_versions: next.sets.map((item) => toSetVersionRow(item, buildSetMetadata(next))),
    periods: next.periods.map((item) => toPeriodRow(item)),
    period_employees: next.evaluations.map((item) => toPeriodEmployeeRow(item)).filter(uniqueById),
    evaluations: next.evaluations.map((item) => toEvaluationRow(item)),
    criterion_scores: next.evaluations.flatMap((item) => item.scores.map((score) => toCriterionScoreRow(item.id, score))),
    incidents: next.incidents.map((item) => toIncidentRow(item)),
    incident_violations: next.incidents.flatMap((item) => item.violations.map((violation, index) => toIncidentViolationRow(item.id, violation, index))),
    appeals: next.appeals.map((item) => toAppealRow(item, [], next)),
    development_cases: next.development_cases.map((item) => toDevelopmentCaseRow(item)),
    audit_logs: next.audit_logs.map(toAuditLogRow),
    career_maps: (next.career_maps || []).map(toCareerMapRow),
    career_map_nodes: (next.career_maps || []).flatMap((m) => m.nodes.map((n) => toCareerMapNodeRow(m.id, n))),
    career_map_edges: (next.career_maps || []).flatMap((m) => m.edges.map((e) => toCareerMapEdgeRow(m.id, e))),
    position_criteria_profiles: (next.position_criteria_profiles || []).map(toPositionCriteriaProfileRow),
    position_criteria_items: (next.position_criteria_profiles || []).flatMap((p) =>
      p.criteria.map((c) => toPositionCriteriaItemRow(p.id, c))
    ),
    career_employee_placements: (next.career_employee_placements || []).map(toCareerPlacementRow),
    career_map_approval_logs: (next.career_map_approval_logs || []).map(toCareerApprovalLogRow),
    career_grades: (next.career_grades || []).map(toCareerGradeRow),
    operational_skills: (next.operational_skills || []).map(toOperationalSkillRow),
    employee_skill_certifications: (next.employee_skill_certifications || []).map(toEmployeeSkillCertificationRow),
    employee_career_placements: (next.employee_career_placements || []).map(toEmployeeCareerPlacementRow),
  }
}

function mapSetVersionRow(row: JsonRow, setCodeById: Map<string, string>): KpiSetVersion {
  return {
    id: String(row.id ?? ''),
    set_id: setCodeById.get(String(row.set_id ?? '')) ?? String(row.set_id ?? ''),
    version: Number(row.version_no ?? row.version ?? 1),
    name: String(row.name ?? ''),
    status: row.status as KpiSetStatus,
    level_codes: Array.isArray(row.level_codes) ? row.level_codes : [],
    store_ids: row.store_scope_all ? 'all' : (Array.isArray(row.store_ids) ? row.store_ids : []),
    effective_from: normalizeDate(row.effective_from),
    effective_to: row.effective_to ? normalizeDate(row.effective_to) : undefined,
    score_scale: Array.isArray(row.score_scale) ? row.score_scale : [1, 2, 3, 4, 5],
    groups: Array.isArray(row.groups) ? row.groups : [],
    created_by: String(row.created_by ?? ''),
    created_at: normalizeIso(row.created_at),
    published_by: row.published_by ? String(row.published_by) : undefined,
    published_at: row.published_at ? normalizeIso(row.published_at) : undefined,
  }
}

function mapPeriodRow(row: JsonRow, employees: JsonRow[]): KpiPeriod {
  return {
    id: String(row.id ?? ''),
    org_id: String(row.org_id ?? ''),
    store_id: String(row.store_id ?? ''),
    month: String(row.month_key ?? row.month ?? ''),
    status: row.status as KpiPeriodStatus,
    snapshot: row.snapshot as KpiSetSnapshot,
    employee_ids: employees.map((item) => String(item.employee_id ?? '')),
    opened_by: String(row.opened_by ?? ''),
    opened_at: normalizeIso(row.opened_at),
    published_at: row.published_at ? normalizeIso(row.published_at) : undefined,
    locked_at: row.locked_at ? normalizeIso(row.locked_at) : undefined,
    revision: Number(row.revision ?? 0),
  }
}

function mapEvaluationRow(row: JsonRow, employeeRow: JsonRow | undefined, scores: JsonRow[]): KpiEvaluation {
  return {
    id: String(row.id ?? ''),
    period_id: String(row.period_id ?? ''),
    employee: mapEmployeeRef(employeeRow),
    snapshot: row.snapshot as KpiSetSnapshot,
    scores: scores.map(mapCriterionScoreRow),
    total_score: row.total_score == null ? undefined : Number(row.total_score),
    grade_code: row.grade_code ? String(row.grade_code) : undefined,
    status: row.status as KpiEvaluation['status'],
    published_at: row.published_at ? normalizeIso(row.published_at) : undefined,
    revision: Number(row.revision ?? 0),
  }
}

function mapEmployeeRef(row: JsonRow | undefined): KpiEmployeeRef {
  return {
    id: String(row?.employee_id ?? ''),
    store_id: String(row?.store_id ?? ''),
    level_code: row?.level_code as KpiLevelCode,
    position_id: String(row?.position_id ?? ''),
    employment_status: row?.employment_status as KpiEmployeeRef['employment_status'],
  }
}

function mapCriterionScoreRow(row: JsonRow): KpiCriterionScore {
  return {
    criterion_id: String(row.criterion_id ?? ''),
    suggested_score: row.suggested_score == null ? undefined : Number(row.suggested_score),
    final_score: row.final_score == null ? undefined : Number(row.final_score),
    source_refs: toStringArray(row.source_refs),
    adjustment_reason: row.adjustment_reason ? String(row.adjustment_reason) : undefined,
    evidence_refs: toStringArray(row.evidence_refs),
  }
}

function mapIncidentRow(row: JsonRow, violations: JsonRow[]): KpiIncident {
  return {
    id: String(row.id ?? ''),
    store_id: String(row.store_id ?? ''),
    employee_id: String(row.employee_id ?? ''),
    period_id: row.period_id ? String(row.period_id) : undefined,
    occurred_at: normalizeIso(row.occurred_at),
    source: row.source as KpiIncident['source'],
    status: row.status as KpiIncident['status'],
    violations: violations.map(mapViolationRow),
    description: String(row.description ?? ''),
    evidence_refs: toStringArray(row.evidence_refs),
  }
}

function mapViolationRow(row: JsonRow): KpiIncidentViolation {
  return {
    code: String(row.code ?? ''),
    primary: Boolean(row.primary_violation ?? row.primary),
    independent_behavior: Boolean(row.independent_behavior),
    reason: String(row.reason ?? ''),
    evidence_refs: toStringArray(row.evidence_refs),
  }
}

function mapAppealRow(row: JsonRow): KpiAppeal {
  return {
    id: String(row.id ?? ''),
    type: row.type as KpiAppeal['type'],
    employee_id: String(row.employee_id ?? ''),
    reference_id: String(row.reference_id ?? ''),
    reason: String(row.reason ?? ''),
    evidence_refs: toStringArray(row.evidence_refs),
    status: row.status as KpiAppeal['status'],
    submitted_at: normalizeIso(row.submitted_at),
    deadline_at: normalizeIso(row.deadline_at),
  }
}

function mapDevelopmentCaseRow(row: JsonRow): KpiDevelopmentCase {
  return {
    id: String(row.id ?? ''),
    employee_id: String(row.employee_id ?? ''),
    current_level: row.current_level as KpiLevelCode,
    target_level: row.target_level as KpiLevelCode,
    status: row.status as KpiDevelopmentCase['status'],
  }
}

function mapAuditLogRow(row: JsonRow): KpiAuditLog {
  return {
    id: String(row.id ?? ''),
    entity_type: String(row.entity_type ?? ''),
    entity_id: String(row.entity_id ?? ''),
    action: String(row.action ?? ''),
    actor_id: String(row.actor_id ?? ''),
    old_value: row.old_value,
    new_value: row.new_value,
    reason: row.reason ? String(row.reason) : undefined,
    created_at: normalizeIso(row.created_at),
  }
}

function toSetVersionRow(item: KpiSetVersion, sets: JsonRow[]): JsonRow {
  const matchingSet = sets.find((row) => row.code === item.set_id)
  return {
    id: item.id,
    set_id: matchingSet?.id ?? item.set_id,
    org_id: matchingSet?.org_id ?? inferOrgIdFromVersion(item),
    version_no: item.version,
    name: item.name,
    status: item.status,
    level_codes: item.level_codes,
    store_scope_all: item.store_ids === 'all',
    store_ids: item.store_ids === 'all' ? [] : item.store_ids,
    effective_from: item.effective_from,
    effective_to: item.effective_to ?? null,
    score_scale: item.score_scale,
    groups: item.groups,
    grades: [],
    promotion_paths: [],
    source_status: item.status === 'published' ? 'published' : null,
    created_by: item.created_by,
    created_at: item.created_at,
    published_by: item.published_by ?? null,
    published_at: item.published_at ?? null,
  }
}

function toPeriodRow(item: KpiPeriod): JsonRow {
  return {
    id: item.id,
    org_id: item.org_id,
    store_id: item.store_id,
    set_version_id: item.snapshot.id,
    month_key: item.month,
    status: item.status,
    snapshot: item.snapshot,
    opened_by: item.opened_by,
    opened_at: item.opened_at,
    published_at: item.published_at ?? null,
    locked_at: item.locked_at ?? null,
    revision: item.revision,
  }
}

function toPeriodEmployeeRow(item: KpiEvaluation): JsonRow {
  return {
    id: buildPeriodEmployeeId(item),
    period_id: item.period_id,
    employee_id: item.employee.id,
    store_id: item.employee.store_id,
    level_code: item.employee.level_code,
    position_id: item.employee.position_id,
    employment_status: item.employee.employment_status,
  }
}

function toEvaluationRow(item: KpiEvaluation): JsonRow {
  return {
    id: item.id,
    period_id: item.period_id,
    period_employee_id: buildPeriodEmployeeId(item),
    snapshot: item.snapshot,
    total_score: item.total_score ?? null,
    grade_code: item.grade_code ?? null,
    status: item.status,
    published_at: item.published_at ?? null,
    revision: item.revision,
  }
}

function toCriterionScoreRow(evaluationId: string, item: KpiCriterionScore): JsonRow {
  return {
    id: `${evaluationId}:${item.criterion_id}`,
    evaluation_id: evaluationId,
    criterion_id: item.criterion_id,
    group_id: findGroupIdInSnapshot(item),
    suggested_score: item.suggested_score ?? null,
    final_score: item.final_score ?? null,
    source_refs: item.source_refs,
    adjustment_reason: item.adjustment_reason ?? null,
    evidence_refs: item.evidence_refs,
  }
}

function toIncidentRow(item: KpiIncident, currentRows: JsonRow[] = []): JsonRow {
  const current = currentRows.find((row) => String(row.id ?? '') === item.id)
  return {
    id: item.id,
    org_id: current?.org_id ?? null,
    store_id: item.store_id,
    employee_id: item.employee_id,
    period_id: item.period_id ?? null,
    occurred_at: item.occurred_at,
    source: item.source,
    status: item.status,
    description: item.description,
    evidence_refs: item.evidence_refs,
    created_by: current?.created_by ?? null,
  }
}

function toIncidentViolationRow(incidentId: string, item: KpiIncidentViolation, index: number): JsonRow {
  return {
    id: `${incidentId}:${index + 1}`,
    incident_id: incidentId,
    code: item.code,
    primary_violation: item.primary,
    independent_behavior: item.independent_behavior,
    reason: item.reason,
    evidence_refs: item.evidence_refs,
  }
}

function toAppealRow(item: KpiAppeal, currentRows: JsonRow[] = [], database?: KpiDatabase): JsonRow {
  const current = currentRows.find((row) => String(row.id ?? '') === item.id)
  const evaluationPeriodId = database?.evaluations.find((evaluation) => evaluation.id === item.reference_id)?.period_id
  const incidentPeriodId = database?.incidents.find((incident) => incident.id === item.reference_id)?.period_id
  const periodId = evaluationPeriodId ?? incidentPeriodId
  const inferredOrgId = database?.periods.find((period) => period.id === periodId)?.org_id
  return {
    id: item.id,
    org_id: current?.org_id ?? inferredOrgId ?? null,
    employee_id: item.employee_id,
    type: item.type,
    reference_id: item.reference_id,
    reason: item.reason,
    evidence_refs: item.evidence_refs,
    status: item.status,
    submitted_at: item.submitted_at,
    deadline_at: item.deadline_at,
  }
}

function toDevelopmentCaseRow(item: KpiDevelopmentCase, currentRows: JsonRow[] = []): JsonRow {
  const current = currentRows.find((row) => String(row.id ?? '') === item.id)
  return {
    id: item.id,
    org_id: current?.org_id ?? null,
    employee_id: item.employee_id,
    store_id: current?.store_id ?? null,
    current_level: item.current_level,
    target_level: item.target_level,
    status: item.status,
  }
}

function buildSetMetadata(next: KpiDatabase, currentSets: JsonRow[] = []): JsonRow[] {
  const rowsByCode = new Map<string, JsonRow>()

  for (const row of currentSets) {
    if (typeof row.code === 'string') {
      rowsByCode.set(row.code, { ...row })
    }
  }

  for (const version of next.sets) {
    if (!rowsByCode.has(version.set_id)) {
      rowsByCode.set(version.set_id, {
        id: version.set_id,
        org_id: inferOrgIdFromVersion(version),
        code: version.set_id,
        name: version.name,
        description: `KPI set auto-synced from web: ${version.set_id}`,
      })
      continue
    }

    const current = rowsByCode.get(version.set_id)!
    current.name = current.name || version.name
    current.org_id = current.org_id || inferOrgIdFromVersion(version)
  }

  return [...rowsByCode.values()]
}

function mergeAuditLogs(logs: KpiAuditLog[], revisionAudit: KpiAuditLog): JsonRow[] {
  const filtered = logs.filter((item) => !(item.entity_type === REVISION_ENTITY_TYPE && item.entity_id === REVISION_ENTITY_ID && item.action === REVISION_ACTION))
  return [...filtered.map(toAuditLogRow), toAuditLogRow(revisionAudit)]
}

function buildRevisionAudit(revision: number, logs: KpiAuditLog[]): KpiAuditLog {
  const current = [...logs]
    .filter((item) => item.entity_type === REVISION_ENTITY_TYPE && item.entity_id === REVISION_ENTITY_ID && item.action === REVISION_ACTION)
    .sort((left, right) => right.created_at.localeCompare(left.created_at))[0]

  return {
    id: current?.id ?? `audit_revision_${revision}`,
    entity_type: REVISION_ENTITY_TYPE,
    entity_id: REVISION_ENTITY_ID,
    action: REVISION_ACTION,
    actor_id: current?.actor_id ?? 'system',
    new_value: { revision },
    created_at: current?.created_at ?? new Date().toISOString(),
  }
}

function getLatestRevision(logs: KpiAuditLog[]): number {
  const revisionLog = [...logs]
    .filter((item) => item.entity_type === REVISION_ENTITY_TYPE && item.entity_id === REVISION_ENTITY_ID && item.action === REVISION_ACTION)
    .sort((left, right) => right.created_at.localeCompare(left.created_at))[0]

  const value = revisionLog?.new_value as { revision?: unknown } | undefined
  return typeof value?.revision === 'number' ? value.revision : 0
}

function buildPeriodEmployeeId(item: KpiEvaluation): string {
  return `${item.period_id}:${item.employee.id}`
}

function findGroupIdInSnapshot(item: KpiCriterionScore): string | null {
  void item
  return null
}

function uniqueById(value: JsonRow, index: number, items: JsonRow[]): boolean {
  return items.findIndex((item) => String(item.id ?? '') === String(value.id ?? '')) === index
}

function inferOrgIdFromVersion(item: KpiSetVersion): string {
  return item.created_by || 'homies'
}

function normalizeIso(value: unknown): string {
  return value == null ? '' : new Date(String(value)).toISOString()
}

function normalizeDate(value: unknown): string {
  if (typeof value === 'string' && value.length >= 10) {
    return value.slice(0, 10)
  }
  return String(value ?? '')
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item)) : []
}

function toAuditLogRow(item: KpiAuditLog): JsonRow {
  return {
    id: item.id,
    entity_type: item.entity_type,
    entity_id: item.entity_id,
    action: item.action,
    actor_id: item.actor_id,
    old_value: item.old_value ?? null,
    new_value: item.new_value ?? null,
    reason: item.reason ?? null,
    created_at: item.created_at,
  }
}

function mapCareerMapRow(
  row: JsonRow,
  nodesRows: JsonRow[],
  edgesRows: JsonRow[]
): import('./career-map-types.ts').KpiCareerMapVersion {
  const mapId = String(row.id ?? '')
  const nodes = nodesRows
    .filter((n) => String(n.career_map_version_id ?? '') === mapId)
    .map(mapCareerMapNodeRow)
  const edges = edgesRows
    .filter((e) => String(e.career_map_version_id ?? '') === mapId)
    .map(mapCareerMapEdgeRow)

  return {
    id: mapId,
    version: Number(row.version ?? 1),
    status: (row.status as import('./career-map-types.ts').KpiCareerMapStatus) || 'draft',
    scope: 'chain',
    effective_from: row.effective_from ? normalizeDate(row.effective_from) : null,
    created_by: String(row.created_by ?? ''),
    approved_by: row.approved_by ? String(row.approved_by) : null,
    returned_reason: row.returned_reason ? String(row.returned_reason) : null,
    created_at: normalizeIso(row.created_at),
    updated_at: normalizeIso(row.updated_at),
    based_on_version_id: row.based_on_version_id ? String(row.based_on_version_id) : null,
    master_position_snapshot: Array.isArray(row.master_position_snapshot)
      ? (row.master_position_snapshot as import('./career-map-types.ts').KpiCareerPositionSnapshot[])
      : [],
    nodes,
    edges,
    transition_presets: row.transition_presets
      ? (row.transition_presets as Record<string, import('./career-map-types.ts').KpiCareerTransitionPreset>)
      : undefined,
  }
}

function mapCareerMapNodeRow(row: JsonRow): import('./career-map-types.ts').KpiCareerMapNode {
  return {
    id: String(row.id ?? ''),
    position_id: String(row.position_id ?? ''),
    position_name_snapshot: String(row.position_name_snapshot ?? ''),
    position_level_snapshot: Number(row.position_level_snapshot ?? 1),
    job_family: String(row.job_family ?? ''),
    grade_code: row.grade_code ? (String(row.grade_code) as CareerGradeCode) : null,
    grade_name_snapshot: row.grade_name_snapshot ? String(row.grade_name_snapshot) : undefined,
    x: Number(row.x ?? 0),
    y: Number(row.y ?? 0),
    criteria_profile_id: row.criteria_profile_id ? String(row.criteria_profile_id) : null,
    active: row.active !== false,
  }
}

function mapCareerMapEdgeRow(row: JsonRow): import('./career-map-types.ts').KpiCareerMapEdge {
  return {
    id: String(row.id ?? ''),
    source_node_id: String(row.source_node_id ?? ''),
    target_node_id: String(row.target_node_id ?? ''),
    preset_key: (row.preset_key as import('./career-map-types.ts').KpiCareerTransitionPresetKey) || 'same_profession_level_up',
    preset_version: Number(row.preset_version ?? 1),
    active: row.active !== false,
  }
}

function mapPositionCriteriaProfileRow(
  row: JsonRow,
  itemRows: JsonRow[]
): import('./career-map-types.ts').KpiPositionCriteriaProfile {
  const profileId = String(row.id ?? '')
  const criteria = itemRows
    .filter((it) => String(it.profile_id ?? '') === profileId)
    .map(mapPositionCriteriaItemRow)

  return {
    id: profileId,
    position_ids: Array.isArray(row.position_ids) ? row.position_ids.map(String) : [],
    grade_codes: Array.isArray(row.grade_codes) ? (row.grade_codes.map(String) as CareerGradeCode[]) : [],
    job_family: row.job_family ? String(row.job_family) : null,
    version: Number(row.version ?? 1),
    effective_from: row.effective_from ? normalizeDate(row.effective_from) : null,
    criteria,
  }
}

function mapPositionCriteriaItemRow(row: JsonRow): import('./career-map-types.ts').KpiCareerCriterion {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    description: row.description ? String(row.description) : undefined,
    source: (row.source as import('./career-map-types.ts').KpiCareerCriterionSource) || 'homies_recommended',
    evidence_source: (row.evidence_source as import('./career-map-types.ts').KpiCareerEvidenceSource) || 'pos',
    direction: (row.direction as import('./career-map-types.ts').KpiCareerCriterionDirection) || 'higher_is_better',
    unit: row.unit ? String(row.unit) : undefined,
    pass_target: (row.pass_target as string | number) || undefined,
    suggested_weight: Number(row.suggested_weight ?? 20),
    weight: Number(row.weight ?? 20),
    locked: Boolean(row.locked),
    active: row.active !== false,
    importance: (row.importance as 'low' | 'medium' | 'high') || 'medium',
  }
}

function toCareerMapRow(item: import('./career-map-types.ts').KpiCareerMapVersion): JsonRow {
  return {
    id: item.id,
    version: item.version,
    status: item.status,
    scope: item.scope,
    effective_from: item.effective_from,
    created_by: item.created_by,
    approved_by: item.approved_by,
    returned_reason: item.returned_reason,
    based_on_version_id: item.based_on_version_id,
    master_position_snapshot: item.master_position_snapshot,
    transition_presets: item.transition_presets ?? null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  }
}

function toCareerMapNodeRow(mapId: string, item: import('./career-map-types.ts').KpiCareerMapNode): JsonRow {
  return {
    id: item.id,
    career_map_version_id: mapId,
    position_id: item.position_id,
    position_name_snapshot: item.position_name_snapshot,
    position_level_snapshot: item.position_level_snapshot,
    job_family: item.job_family,
    grade_code: item.grade_code ?? null,
    grade_name_snapshot: item.grade_name_snapshot ?? null,
    x: item.x,
    y: item.y,
    criteria_profile_id: item.criteria_profile_id,
    active: item.active,
  }
}

function toCareerMapEdgeRow(mapId: string, item: import('./career-map-types.ts').KpiCareerMapEdge): JsonRow {
  return {
    id: item.id,
    career_map_version_id: mapId,
    source_node_id: item.source_node_id,
    target_node_id: item.target_node_id,
    preset_key: item.preset_key,
    preset_version: item.preset_version,
    active: item.active,
  }
}

function toPositionCriteriaProfileRow(item: import('./career-map-types.ts').KpiPositionCriteriaProfile): JsonRow {
  return {
    id: item.id,
    position_ids: item.position_ids,
    grade_codes: item.grade_codes ?? [],
    job_family: item.job_family,
    version: item.version,
    effective_from: item.effective_from,
  }
}

function toPositionCriteriaItemRow(profileId: string, item: import('./career-map-types.ts').KpiCareerCriterion): JsonRow {
  return {
    id: item.id,
    profile_id: profileId,
    name: item.name,
    description: item.description ?? null,
    source: item.source,
    evidence_source: item.evidence_source,
    direction: item.direction,
    unit: item.unit ?? null,
    pass_target: item.pass_target ?? null,
    suggested_weight: item.suggested_weight,
    weight: item.weight,
    locked: item.locked,
    active: item.active,
    importance: item.importance ?? 'medium',
  }
}

function mapCareerPlacementRow(row: JsonRow): import('./career-map-types.ts').KpiCareerEmployeePlacement {
  return {
    id: String(row.id ?? ''),
    career_map_version_id: String(row.career_map_version_id ?? ''),
    employee_id: String(row.employee_id ?? ''),
    store_id: String(row.store_id ?? ''),
    position_id: String(row.position_id ?? ''),
    node_id: row.node_id ? String(row.node_id) : null,
    grade_code: row.grade_code ? (String(row.grade_code) as CareerGradeCode) : null,
    status: (row.status as 'placed' | 'unresolved') || 'placed',
    unresolved_reason: row.unresolved_reason ? String(row.unresolved_reason) : null,
    created_at: normalizeIso(row.created_at),
  }
}

function toCareerPlacementRow(item: import('./career-map-types.ts').KpiCareerEmployeePlacement): JsonRow {
  return {
    id: item.id,
    career_map_version_id: item.career_map_version_id,
    employee_id: item.employee_id,
    store_id: item.store_id,
    position_id: item.position_id,
    node_id: item.node_id,
    grade_code: item.grade_code ?? null,
    status: item.status,
    unresolved_reason: item.unresolved_reason ?? null,
    created_at: item.created_at,
  }
}

function mapCareerApprovalLogRow(row: JsonRow): import('./career-map-types.ts').KpiCareerMapApprovalLog {
  return {
    id: String(row.id ?? ''),
    career_map_version_id: String(row.career_map_version_id ?? row.career_map_id ?? ''),
    career_map_id: String(row.career_map_version_id ?? row.career_map_id ?? ''),
    action: (row.action as 'submit' | 'return' | 'publish') || 'submit',
    actor_id: String(row.actor_id ?? ''),
    actor_role: row.actor_role ? String(row.actor_role) : undefined,
    notes: row.notes ? String(row.notes) : null,
    created_at: normalizeIso(row.created_at),
  }
}

function toCareerApprovalLogRow(item: import('./career-map-types.ts').KpiCareerMapApprovalLog): JsonRow {
  return {
    id: item.id,
    career_map_version_id: item.career_map_version_id || item.career_map_id,
    action: item.action,
    actor_id: item.actor_id,
    notes: item.notes ?? null,
    created_at: item.created_at,
  }
}

function mapCareerGradeRow(row: JsonRow): CareerGradeDefinition {
  return {
    code: String(row.code ?? '') as CareerGradeCode,
    rank: Number(row.rank ?? 1) as 1 | 2 | 3 | 4 | 5,
    label: String(row.label ?? ''),
    position_key: (row.position_key as 'store_employee' | 'shift_leader' | 'store_manager') || 'store_employee',
    required_skill_codes: toStringArray(row.required_skill_codes) as OperationalSkillCode[],
    management: Boolean(row.management),
  }
}

function toCareerGradeRow(item: CareerGradeDefinition): JsonRow {
  return {
    code: item.code,
    rank: item.rank,
    label: item.label,
    position_key: item.position_key,
    required_skill_codes: item.required_skill_codes,
    management: item.management,
  }
}

function mapOperationalSkillRow(row: JsonRow): OperationalSkillDefinition {
  return {
    code: String(row.code ?? '') as OperationalSkillCode,
    label: String(row.label ?? ''),
    active: row.active !== false,
  }
}

function toOperationalSkillRow(item: OperationalSkillDefinition): JsonRow {
  return {
    code: item.code,
    label: item.label,
    active: item.active,
  }
}

function mapEmployeeSkillCertificationRow(row: JsonRow): EmployeeSkillCertification {
  return {
    id: String(row.id ?? ''),
    employee_id: String(row.employee_id ?? ''),
    skill_code: String(row.skill_code ?? '') as OperationalSkillCode,
    status: (row.status as EmployeeSkillCertification['status']) || 'not_started',
    assessed_at: row.assessed_at ? normalizeDate(row.assessed_at) : null,
    assessed_by: row.assessed_by ? String(row.assessed_by) : null,
    score: row.score != null ? Number(row.score) : null,
    evidence_refs: toStringArray(row.evidence_refs),
    standard_version: Number(row.standard_version ?? 1),
  }
}

function toEmployeeSkillCertificationRow(item: EmployeeSkillCertification): JsonRow {
  return {
    id: item.id,
    employee_id: item.employee_id,
    skill_code: item.skill_code,
    status: item.status,
    assessed_at: item.assessed_at,
    assessed_by: item.assessed_by,
    score: item.score,
    evidence_refs: item.evidence_refs ?? [],
    standard_version: item.standard_version,
  }
}

function mapEmployeeCareerPlacementRow(row: JsonRow): EmployeeCareerPlacement {
  return {
    id: String(row.id ?? ''),
    employee_id: String(row.employee_id ?? ''),
    career_map_version_id: String(row.career_map_version_id ?? ''),
    position_id: String(row.position_id ?? ''),
    grade_code: row.grade_code ? (String(row.grade_code) as CareerGradeCode) : null,
    node_id: row.node_id ? String(row.node_id) : null,
    status: (row.status as EmployeeCareerPlacement['status']) || 'placed',
    unresolved_reason: row.unresolved_reason ? String(row.unresolved_reason) : null,
    effective_from: row.effective_from ? normalizeDate(row.effective_from) : new Date().toISOString().slice(0, 10),
    effective_to: row.effective_to ? normalizeDate(row.effective_to) : null,
    decision_id: row.decision_id ? String(row.decision_id) : null,
  }
}

function toEmployeeCareerPlacementRow(item: EmployeeCareerPlacement): JsonRow {
  return {
    id: item.id,
    employee_id: item.employee_id,
    career_map_version_id: item.career_map_version_id,
    position_id: item.position_id,
    grade_code: item.grade_code,
    node_id: item.node_id,
    status: item.status,
    unresolved_reason: item.unresolved_reason,
    effective_from: item.effective_from,
    effective_to: item.effective_to,
    decision_id: item.decision_id,
  }
}

export function createDefaultSupabaseKpiGateway(client = supabase): SupabaseKpiGateway {
  async function selectFrom(table: string): Promise<JsonRow[]> {
    const { data, error } = await client.from(table).select('*')
    if (error) {
      throw error
    }
    return Array.isArray(data) ? data : []
  }

  async function upsertInto(table: string, rows: JsonRow[], onConflict = 'id'): Promise<void> {
    if (rows.length === 0) {
      return
    }
    const { error } = await client.from(table).upsert(rows, { onConflict })
    if (error) {
      throw error
    }
  }

  return {
    async loadAll() {
      const [
        sets,
        setVersions,
        periods,
        periodEmployees,
        evaluations,
        criterionScores,
        incidents,
        incidentViolations,
        appeals,
        developmentCases,
        auditLogs,
        careerMaps,
        careerMapNodes,
        careerMapEdges,
        positionCriteriaProfiles,
        positionCriteriaItems,
        careerEmployeePlacements,
        careerMapApprovalLogs,
        careerGrades,
        operationalSkills,
        employeeSkillCertifications,
      ] = await Promise.all([
        selectFrom('kpi_sets'),
        selectFrom('kpi_set_versions'),
        selectFrom('kpi_periods'),
        selectFrom('kpi_period_employees'),
        selectFrom('kpi_evaluations'),
        selectFrom('kpi_criterion_scores'),
        selectFrom('kpi_incidents'),
        selectFrom('kpi_incident_violations'),
        selectFrom('kpi_appeals'),
        selectFrom('kpi_development_cases'),
        selectFrom('kpi_audit_logs'),
        selectFrom('kpi_career_map_versions'),
        selectFrom('kpi_career_map_nodes'),
        selectFrom('kpi_career_map_edges'),
        selectFrom('kpi_position_criteria_profiles'),
        selectFrom('kpi_position_criteria_items'),
        selectFrom('kpi_career_employee_placements'),
        selectFrom('kpi_career_map_approval_logs'),
        selectFrom('kpi_career_grades').catch(() => []),
        selectFrom('kpi_operational_skills').catch(() => []),
        selectFrom('kpi_employee_skill_certifications').catch(() => []),
      ])

      return {
        sets,
        set_versions: setVersions,
        periods,
        period_employees: periodEmployees,
        evaluations,
        criterion_scores: criterionScores,
        incidents,
        incident_violations: incidentViolations,
        appeals,
        development_cases: developmentCases,
        audit_logs: auditLogs,
        career_maps: careerMaps,
        career_map_nodes: careerMapNodes,
        career_map_edges: careerMapEdges,
        position_criteria_profiles: positionCriteriaProfiles,
        position_criteria_items: positionCriteriaItems,
        career_employee_placements: careerEmployeePlacements,
        career_map_approval_logs: careerMapApprovalLogs,
        career_grades: careerGrades,
        operational_skills: operationalSkills,
        employee_skill_certifications: employeeSkillCertifications,
      }
    },

    async replaceAll(rows) {
      await upsertInto('kpi_sets', rows.sets ?? [])
      await upsertInto('kpi_set_versions', rows.set_versions)
      await upsertInto('kpi_periods', rows.periods)
      await upsertInto('kpi_period_employees', rows.period_employees)
      await upsertInto('kpi_evaluations', rows.evaluations)
      await upsertInto('kpi_criterion_scores', rows.criterion_scores)
      await upsertInto('kpi_incidents', rows.incidents)
      await upsertInto('kpi_incident_violations', rows.incident_violations)
      await upsertInto('kpi_appeals', rows.appeals)
      await upsertInto('kpi_development_cases', rows.development_cases)
      await upsertInto('kpi_audit_logs', rows.audit_logs)

      // Delete reconciliation for career map child tables
      const targetMapIds = (rows.career_maps || []).map((m) => String(m.id))
      if (targetMapIds.length > 0) {
        // Reconcile nodes
        const { data: existingNodes, error: nodeErr } = await client
          .from('kpi_career_map_nodes')
          .select('id, career_map_version_id')
          .in('career_map_version_id', targetMapIds)
        if (nodeErr) throw nodeErr
        if (existingNodes) {
          const incomingNodeIds = new Set((rows.career_map_nodes || []).map((n) => String(n.id)))
          const nodesToDelete = existingNodes
            .map((n: JsonRow) => String(n.id))
            .filter((id: string) => !incomingNodeIds.has(id))
          if (nodesToDelete.length > 0) {
            const { error: delNodesErr } = await client
              .from('kpi_career_map_nodes')
              .delete()
              .in('id', nodesToDelete)
              .in('career_map_version_id', targetMapIds)
            if (delNodesErr) throw delNodesErr
          }
        }

        // Reconcile edges
        const { data: existingEdges, error: edgeErr } = await client
          .from('kpi_career_map_edges')
          .select('id, career_map_version_id')
          .in('career_map_version_id', targetMapIds)
        if (edgeErr) throw edgeErr
        if (existingEdges) {
          const incomingEdgeIds = new Set((rows.career_map_edges || []).map((e) => String(e.id)))
          const edgesToDelete = existingEdges
            .map((e: JsonRow) => String(e.id))
            .filter((id: string) => !incomingEdgeIds.has(id))
          if (edgesToDelete.length > 0) {
            const { error: delEdgesErr } = await client
              .from('kpi_career_map_edges')
              .delete()
              .in('id', edgesToDelete)
              .in('career_map_version_id', targetMapIds)
            if (delEdgesErr) throw delEdgesErr
          }
        }

        // Reconcile placements
        const { data: existingPlacements, error: placeErr } = await client
          .from('kpi_career_employee_placements')
          .select('id, career_map_version_id')
          .in('career_map_version_id', targetMapIds)
        if (placeErr) throw placeErr
        if (existingPlacements) {
          const incomingPlacementIds = new Set((rows.career_employee_placements || []).map((p) => String(p.id)))
          const placementsToDelete = existingPlacements
            .map((p: JsonRow) => String(p.id))
            .filter((id: string) => !incomingPlacementIds.has(id))
          if (placementsToDelete.length > 0) {
            const { error: delPlacementsErr } = await client
              .from('kpi_career_employee_placements')
              .delete()
              .in('id', placementsToDelete)
              .in('career_map_version_id', targetMapIds)
            if (delPlacementsErr) throw delPlacementsErr
          }
        }
      }

      // Reconcile criteria items
      const targetProfileIds = (rows.position_criteria_profiles || []).map((p) => String(p.id))
      if (targetProfileIds.length > 0) {
        const { data: existingItems, error: itemErr } = await client
          .from('kpi_position_criteria_items')
          .select('id, profile_id')
          .in('profile_id', targetProfileIds)
        if (itemErr) throw itemErr
        if (existingItems) {
          const incomingItemIds = new Set((rows.position_criteria_items || []).map((it) => String(it.id)))
          const itemsToDelete = existingItems
            .map((it: JsonRow) => String(it.id))
            .filter((id: string) => !incomingItemIds.has(id))
          if (itemsToDelete.length > 0) {
            const { error: delItemsErr } = await client
              .from('kpi_position_criteria_items')
              .delete()
              .in('id', itemsToDelete)
              .in('profile_id', targetProfileIds)
            if (delItemsErr) throw delItemsErr
          }
        }
      }

      if (rows.career_maps) await upsertInto('kpi_career_map_versions', rows.career_maps)
      if (rows.career_map_nodes) await upsertInto('kpi_career_map_nodes', rows.career_map_nodes)
      if (rows.career_map_edges) await upsertInto('kpi_career_map_edges', rows.career_map_edges)
      if (rows.position_criteria_profiles) await upsertInto('kpi_position_criteria_profiles', rows.position_criteria_profiles)
      if (rows.position_criteria_items) await upsertInto('kpi_position_criteria_items', rows.position_criteria_items)
      if (rows.career_employee_placements) await upsertInto('kpi_career_employee_placements', rows.career_employee_placements)
      if (rows.career_map_approval_logs) await upsertInto('kpi_career_map_approval_logs', rows.career_map_approval_logs)
      if (rows.operational_skills) await upsertInto('kpi_operational_skills', rows.operational_skills, 'code')
      if (rows.career_grades) await upsertInto('kpi_career_grades', rows.career_grades, 'code')
      if (rows.employee_skill_certifications) await upsertInto('kpi_employee_skill_certifications', rows.employee_skill_certifications)
    },
  }
}
