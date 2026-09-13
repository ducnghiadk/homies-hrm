import type { KpiActor, KpiAppeal, KpiDatabase, KpiDevelopmentCase, KpiEvaluation, KpiGroupTag, KpiIncident, KpiLevelCode } from './types.ts'

const VISIBLE_EVALUATION_STATUSES = new Set(['submitted', 'preapproved', 'published', 'locked'])
const OPEN_APPEAL_STATUSES = new Set(['submitted', 'reviewing'])
const RISK_GRADE_CODES = new Set(['warning', 'critical'])
const ACTIVE_PIPELINE_STATUSES = new Set(['detected', 'leader_proposed', 'testing', 'challenge'])

export interface KpiReportRequest {
  actor: KpiActor
  month?: string
  now?: string
}

export interface KpiReportMetricCard {
  id: 'average_score' | 'coverage' | 'risk_watch' | 'promotion_pipeline'
  label: string
  value: string
  helper: string
  tone: 'neutral' | 'good' | 'warning'
}

export interface KpiReportTrendPoint {
  month: string
  average_score: number
  evaluation_count: number
  risk_count: number
}

export interface KpiReportStoreBreakdown {
  store_id: string
  average_score: number
  evaluation_count: number
  risk_count: number
}

export interface KpiReportLevelBreakdown {
  level_code: KpiLevelCode
  average_score: number
  evaluation_count: number
}

export interface KpiReportGroupBreakdown {
  group_id: string
  group_name: string
  tag: KpiGroupTag
  average_score: number
  evaluation_count: number
}

export interface KpiReportRiskItem {
  employee_id: string
  store_id: string
  level_code: KpiLevelCode
  total_score: number
  incident_count: number
  open_appeals: number
  reason_tags: string[]
}

export interface KpiReportAppealSla {
  open_count: number
  near_deadline_count: number
  overdue_count: number
  resolved_count: number
}

export interface KpiReportIncidentRecurrence {
  employee_id: string
  store_id: string
  repeat_count: number
  primary_code: string
  latest_occurred_at: string
}

export interface KpiReportPipelineStatusCount {
  status: KpiDevelopmentCase['status']
  count: number
}

export interface KpiReportPipelineCase {
  id: string
  employee_id: string
  store_id: string
  current_level: KpiLevelCode
  target_level: KpiLevelCode
  status: KpiDevelopmentCase['status']
  latest_score?: number
}

export interface KpiReportPromotionPipeline {
  total_open: number
  status_counts: KpiReportPipelineStatusCount[]
  cases: KpiReportPipelineCase[]
}

export interface KpiReportLeaderboardEntry {
  rank: number
  employee_id: string
  store_id: string
  level_code: KpiLevelCode
  total_score: number
  grade_code?: string
  delta_from_previous: number
}

export interface KpiReportInsight {
  id: string
  tone: 'good' | 'warning' | 'neutral'
  title: string
  body: string
}

export interface KpiReportSnapshot {
  month: string
  scope: {
    actor_role: KpiActor['role']
    store_ids: string[]
    employee_ids: string[]
  }
  macro_cards: KpiReportMetricCard[]
  trend: {
    months: KpiReportTrendPoint[]
    stores: KpiReportStoreBreakdown[]
    levels: KpiReportLevelBreakdown[]
    groups: KpiReportGroupBreakdown[]
  }
  risk_list: KpiReportRiskItem[]
  appeal_sla: KpiReportAppealSla
  incident_recurrence: KpiReportIncidentRecurrence[]
  promotion_pipeline: KpiReportPromotionPipeline
  leaderboard: KpiReportLeaderboardEntry[]
  insights: KpiReportInsight[]
}

export async function getKpiReportSnapshot(input: KpiReportRequest): Promise<KpiReportSnapshot> {
  const { kpiAdapter } = await import('../adapters/kpi-adapter.ts')
  const db = await kpiAdapter.getDatabase()
  return buildKpiReportSnapshot(db, input)
}

export function buildKpiReportSnapshot(db: KpiDatabase, input: KpiReportRequest): KpiReportSnapshot {
  const scoped = scopeDatabase(db, input.actor)
  const months = Array.from(new Set(scoped.periods.map((item) => item.month))).sort()
  const month = input.month ?? months.at(-1) ?? new Date().toISOString().slice(0, 7)
  const now = input.now ?? new Date().toISOString()
  const currentPeriods = scoped.periods.filter((item) => item.month === month)
  const currentPeriodIds = new Set(currentPeriods.map((item) => item.id))
  const currentEvaluations = scoped.evaluations.filter((item) => currentPeriodIds.has(item.period_id))
  const previousMonth = findPreviousMonth(months, month)
  const previousPeriodIds = new Set(scoped.periods.filter((item) => item.month === previousMonth).map((item) => item.id))
  const previousEvaluations = scoped.evaluations.filter((item) => previousPeriodIds.has(item.period_id))
  const currentIncidents = scoped.incidents.filter((item) => (
    item.period_id ? currentPeriodIds.has(item.period_id) : item.occurred_at.startsWith(month)
  ))
  const riskList = buildRiskList(currentEvaluations, currentIncidents, scoped.appeals)
  const appealSla = buildAppealSla(scoped.appeals, now)
  const leaderboard = buildLeaderboard(currentEvaluations, previousEvaluations)
  const promotionPipeline = buildPromotionPipeline(scoped.development_cases, currentEvaluations, scoped.employee_store_map)

  return {
    month,
    scope: {
      actor_role: input.actor.role,
      store_ids: Array.from(scoped.store_ids).sort(),
      employee_ids: Array.from(scoped.employee_ids).sort(),
    },
    macro_cards: buildMacroCards(currentEvaluations, previousEvaluations, riskList, promotionPipeline),
    trend: {
      months: buildMonthTrend(months, scoped.periods, scoped.evaluations, scoped.incidents, scoped.appeals),
      stores: buildStoreBreakdown(currentEvaluations, currentIncidents),
      levels: buildLevelBreakdown(currentEvaluations),
      groups: buildGroupBreakdown(currentEvaluations),
    },
    risk_list: riskList,
    appeal_sla: appealSla,
    incident_recurrence: buildIncidentRecurrence(currentIncidents),
    promotion_pipeline: promotionPipeline,
    leaderboard,
    insights: buildInsights(currentEvaluations, previousEvaluations, riskList, appealSla, promotionPipeline),
  }
}

function scopeDatabase(db: KpiDatabase, actor: KpiActor) {
  const visiblePeriods = db.periods.filter((period) => canViewStore(actor, period.store_id))
  const periodIds = new Set(visiblePeriods.map((item) => item.id))
  const visibleEvaluations = db.evaluations.filter((evaluation) => (
    periodIds.has(evaluation.period_id) &&
    VISIBLE_EVALUATION_STATUSES.has(evaluation.status) &&
    canViewEmployee(actor, evaluation.employee.id, evaluation.employee.store_id)
  ))
  const employeeIds = new Set(visibleEvaluations.map((item) => item.employee.id))
  const storeIds = new Set(visibleEvaluations.map((item) => item.employee.store_id))
  const visibleIncidents = db.incidents.filter((incident) => (
    canViewEmployee(actor, incident.employee_id, incident.store_id) &&
    canViewStore(actor, incident.store_id)
  ))
  const incidentEmployeeIds = new Set(visibleIncidents.map((item) => item.employee_id))

  for (const employeeId of incidentEmployeeIds) {
    employeeIds.add(employeeId)
  }

  const visibleAppeals = db.appeals.filter((appeal) => canViewEmployee(actor, appeal.employee_id, resolveAppealStore(appeal, db, employeeIds)))
  const visibleCases = db.development_cases.filter((item) => employeeIds.has(item.employee_id))
  const employeeStoreMap = buildEmployeeStoreMap(db)

  return {
    periods: visiblePeriods,
    evaluations: visibleEvaluations,
    incidents: visibleIncidents,
    appeals: visibleAppeals,
    development_cases: visibleCases,
    employee_ids: employeeIds,
    store_ids: storeIds,
    employee_store_map: employeeStoreMap,
  }
}

function buildMacroCards(
  currentEvaluations: KpiEvaluation[],
  previousEvaluations: KpiEvaluation[],
  riskList: KpiReportRiskItem[],
  promotionPipeline: KpiReportPromotionPipeline
): KpiReportMetricCard[] {
  const averageScore = average(currentEvaluations.map((item) => item.total_score ?? 0))
  const previousAverage = average(previousEvaluations.map((item) => item.total_score ?? 0))
  const averageDelta = currentEvaluations.length && previousEvaluations.length ? averageScore - previousAverage : 0

  return [
    {
      id: 'average_score',
      label: 'Diem KPI trung binh',
      value: `${formatScore(averageScore)}/5`,
      helper: averageDelta === 0 ? 'Chua co chenhlech voi ky truoc' : `${formatSignedScore(averageDelta)} so voi ky truoc`,
      tone: averageDelta >= 0 ? 'good' : 'warning',
    },
    {
      id: 'coverage',
      label: 'Ho so da vao bao cao',
      value: `${currentEvaluations.length}`,
      helper: `${currentEvaluations.length} nhan su da du dieu kien hien thi`,
      tone: 'neutral',
    },
    {
      id: 'risk_watch',
      label: 'Nhan su can theo sat',
      value: `${riskList.length}`,
      helper: riskList.length === 0 ? 'Khong co truong hop can canh bao' : 'Can uu tien review diem, su co va khieu nai',
      tone: riskList.length === 0 ? 'good' : 'warning',
    },
    {
      id: 'promotion_pipeline',
      label: 'Ho so thang tien dang mo',
      value: `${promotionPipeline.total_open}`,
      helper: `${promotionPipeline.status_counts.length} trang thai dang chay`,
      tone: promotionPipeline.total_open === 0 ? 'neutral' : 'good',
    },
  ]
}

function buildMonthTrend(
  months: string[],
  periods: KpiDatabase['periods'],
  evaluations: KpiEvaluation[],
  incidents: KpiIncident[],
  appeals: KpiAppeal[]
): KpiReportTrendPoint[] {
  return months.map((month) => {
    const periodIds = new Set(periods.filter((item) => item.month === month).map((item) => item.id))
    const monthEvaluations = evaluations.filter((item) => periodIds.has(item.period_id))
    const monthIncidents = incidents.filter((item) => (
      item.period_id ? periodIds.has(item.period_id) : item.occurred_at.startsWith(month)
    ))
    const monthRisks = buildRiskList(monthEvaluations, monthIncidents, appeals)

    return {
      month,
      average_score: round2(average(monthEvaluations.map((item) => item.total_score ?? 0))),
      evaluation_count: monthEvaluations.length,
      risk_count: monthRisks.length,
    }
  })
}

function buildStoreBreakdown(currentEvaluations: KpiEvaluation[], currentIncidents: KpiIncident[]): KpiReportStoreBreakdown[] {
  const byStore = new Map<string, KpiEvaluation[]>()
  for (const evaluation of currentEvaluations) {
    const list = byStore.get(evaluation.employee.store_id) ?? []
    list.push(evaluation)
    byStore.set(evaluation.employee.store_id, list)
  }

  return Array.from(byStore.entries())
    .map(([storeId, evaluations]) => ({
      store_id: storeId,
      average_score: round2(average(evaluations.map((item) => item.total_score ?? 0))),
      evaluation_count: evaluations.length,
      risk_count: buildRiskList(
        evaluations,
        currentIncidents.filter((incident) => incident.store_id === storeId),
        []
      ).length,
    }))
    .sort((left, right) => right.risk_count - left.risk_count || right.average_score - left.average_score)
}

function buildLevelBreakdown(currentEvaluations: KpiEvaluation[]): KpiReportLevelBreakdown[] {
  const byLevel = new Map<KpiLevelCode, KpiEvaluation[]>()
  for (const evaluation of currentEvaluations) {
    const list = byLevel.get(evaluation.employee.level_code) ?? []
    list.push(evaluation)
    byLevel.set(evaluation.employee.level_code, list)
  }

  return Array.from(byLevel.entries())
    .map(([levelCode, evaluations]) => ({
      level_code: levelCode,
      average_score: round2(average(evaluations.map((item) => item.total_score ?? 0))),
      evaluation_count: evaluations.length,
    }))
    .sort((left, right) => right.average_score - left.average_score)
}

function buildGroupBreakdown(currentEvaluations: KpiEvaluation[]): KpiReportGroupBreakdown[] {
  const bucket = new Map<string, { group_id: string; group_name: string; tag: KpiGroupTag; scores: number[] }>()

  for (const evaluation of currentEvaluations) {
    const criterionLookup = new Map(
      evaluation.snapshot.groups.flatMap((group) => group.criteria.map((criterion) => [
        criterion.id,
        { group_id: group.id, group_name: group.name, tag: group.tag },
      ]))
    )

    for (const score of evaluation.scores) {
      const meta = criterionLookup.get(score.criterion_id)
      const value = getScoreValue(score.final_score, score.suggested_score)
      if (!meta || value === undefined) continue

      const entry = bucket.get(meta.group_id) ?? {
        group_id: meta.group_id,
        group_name: meta.group_name,
        tag: meta.tag,
        scores: [],
      }
      entry.scores.push(value)
      bucket.set(meta.group_id, entry)
    }
  }

  return Array.from(bucket.values())
    .map((item) => ({
      group_id: item.group_id,
      group_name: item.group_name,
      tag: item.tag,
      average_score: round2(average(item.scores)),
      evaluation_count: item.scores.length,
    }))
    .sort((left, right) => right.average_score - left.average_score)
}

function buildRiskList(
  evaluations: KpiEvaluation[],
  incidents: KpiIncident[],
  appeals: KpiAppeal[]
): KpiReportRiskItem[] {
  const incidentsByEmployee = groupBy(incidents, (item) => item.employee_id)
  const openAppealsByEmployee = groupBy(
    appeals.filter((item) => OPEN_APPEAL_STATUSES.has(item.status)),
    (item) => item.employee_id
  )

  return evaluations
    .map((evaluation) => {
      const incidentCount = incidentsByEmployee.get(evaluation.employee.id)?.length ?? 0
      const openAppeals = openAppealsByEmployee.get(evaluation.employee.id)?.length ?? 0
      const reasons: string[] = []

      if ((evaluation.total_score ?? 0) < 3) reasons.push('Diem KPI duoi san')
      if (evaluation.grade_code && RISK_GRADE_CODES.has(evaluation.grade_code)) reasons.push('Xep loai can xu ly')
      if (incidentCount >= 2) reasons.push('Lap lai su co trong ky')
      if (openAppeals > 0 && reasons.length > 0) reasons.push('Con ho so khiu nai mo')

      if (reasons.length === 0) return null

      return {
        employee_id: evaluation.employee.id,
        store_id: evaluation.employee.store_id,
        level_code: evaluation.employee.level_code,
        total_score: round2(evaluation.total_score ?? 0),
        incident_count: incidentCount,
        open_appeals: openAppeals,
        reason_tags: reasons,
      }
    })
    .filter((item): item is KpiReportRiskItem => item !== null)
    .sort((left, right) => (
      right.incident_count - left.incident_count ||
      left.total_score - right.total_score ||
      right.open_appeals - left.open_appeals
    ))
}

function buildAppealSla(appeals: KpiAppeal[], now: string): KpiReportAppealSla {
  const nowTime = new Date(now).getTime()
  const openAppeals = appeals.filter((item) => OPEN_APPEAL_STATUSES.has(item.status))

  return {
    open_count: openAppeals.length,
    near_deadline_count: openAppeals.filter((item) => {
      const diff = new Date(item.deadline_at).getTime() - nowTime
      return diff >= 0 && diff <= 24 * 60 * 60 * 1000
    }).length,
    overdue_count: openAppeals.filter((item) => new Date(item.deadline_at).getTime() < nowTime).length,
    resolved_count: appeals.length - openAppeals.length,
  }
}

function buildIncidentRecurrence(currentIncidents: KpiIncident[]): KpiReportIncidentRecurrence[] {
  return Array.from(groupBy(currentIncidents, (item) => item.employee_id).entries())
    .map(([employeeId, incidents]) => {
      if (incidents.length < 2) return null

      const sorted = [...incidents].sort((left, right) => right.occurred_at.localeCompare(left.occurred_at))
      return {
        employee_id: employeeId,
        store_id: sorted[0].store_id,
        repeat_count: incidents.length,
        primary_code: sorted[0].violations.find((item) => item.primary)?.code ?? sorted[0].violations[0]?.code ?? 'other',
        latest_occurred_at: sorted[0].occurred_at,
      }
    })
    .filter((item): item is KpiReportIncidentRecurrence => item !== null)
    .sort((left, right) => right.repeat_count - left.repeat_count)
}

function buildPromotionPipeline(
  cases: KpiDevelopmentCase[],
  currentEvaluations: KpiEvaluation[],
  employeeStoreMap: Map<string, string>
): KpiReportPromotionPipeline {
  const latestScoreMap = new Map(currentEvaluations.map((item) => [item.employee.id, item.total_score]))
  const statusCounts = Array.from(groupBy(cases, (item) => item.status).entries())
    .map(([status, entries]) => ({ status: status as KpiDevelopmentCase['status'], count: entries.length }))
    .sort((left, right) => right.count - left.count || left.status.localeCompare(right.status))

  return {
    total_open: cases.filter((item) => ACTIVE_PIPELINE_STATUSES.has(item.status)).length,
    status_counts: statusCounts,
    cases: cases
      .map((item) => ({
        id: item.id,
        employee_id: item.employee_id,
        store_id: employeeStoreMap.get(item.employee_id) ?? 'unknown',
        current_level: item.current_level,
        target_level: item.target_level,
        status: item.status,
        latest_score: round2(latestScoreMap.get(item.employee_id) ?? 0),
      }))
      .sort((left, right) => (right.latest_score ?? 0) - (left.latest_score ?? 0)),
  }
}

function buildLeaderboard(currentEvaluations: KpiEvaluation[], previousEvaluations: KpiEvaluation[]): KpiReportLeaderboardEntry[] {
  const previousScoreMap = new Map(previousEvaluations.map((item) => [item.employee.id, item.total_score ?? 0]))

  return [...currentEvaluations]
    .sort((left, right) => (right.total_score ?? 0) - (left.total_score ?? 0))
    .map((evaluation, index) => ({
      rank: index + 1,
      employee_id: evaluation.employee.id,
      store_id: evaluation.employee.store_id,
      level_code: evaluation.employee.level_code,
      total_score: round2(evaluation.total_score ?? 0),
      grade_code: evaluation.grade_code,
      delta_from_previous: round2((evaluation.total_score ?? 0) - (previousScoreMap.get(evaluation.employee.id) ?? 0)),
    }))
}

function buildInsights(
  currentEvaluations: KpiEvaluation[],
  previousEvaluations: KpiEvaluation[],
  riskList: KpiReportRiskItem[],
  appealSla: KpiReportAppealSla,
  promotionPipeline: KpiReportPromotionPipeline
): KpiReportInsight[] {
  const currentAverage = average(currentEvaluations.map((item) => item.total_score ?? 0))
  const previousAverage = average(previousEvaluations.map((item) => item.total_score ?? 0))
  const insights: KpiReportInsight[] = []

  if (currentEvaluations.length > 0) {
    insights.push({
      id: 'trend',
      tone: currentAverage >= previousAverage ? 'good' : 'warning',
      title: 'Xu huong diem KPI',
      body: currentAverage >= previousAverage
        ? `Diem trung binh dang di len ${formatScore(currentAverage)} so voi ${formatScore(previousAverage)} ky truoc.`
        : `Diem trung binh dang giam ve ${formatScore(currentAverage)}, can xem lai nhom thap diem.`,
    })
  }

  if (riskList.length > 0) {
    insights.push({
      id: 'risk',
      tone: 'warning',
      title: 'Danh sach can follow-up',
      body: `${riskList.length} nhan su dang co diem thap, su co lap lai hoac khieu nai mo.`,
    })
  }

  if (appealSla.overdue_count > 0 || appealSla.near_deadline_count > 0) {
    insights.push({
      id: 'appeal_sla',
      tone: 'warning',
      title: 'SLA khiu nai can xu ly',
      body: `${appealSla.overdue_count} ho so qua han, ${appealSla.near_deadline_count} ho so sap den han.`,
    })
  }

  if (promotionPipeline.total_open > 0) {
    insights.push({
      id: 'pipeline',
      tone: 'neutral',
      title: 'Pipeline thang tien dang mo',
      body: `${promotionPipeline.total_open} ho so dang chay qua cac buoc de xet nang bac.`,
    })
  }

  return insights
}

function canViewStore(actor: KpiActor, storeId: string | undefined): boolean {
  if (!storeId) return actor.role === 'employee'
  if (actor.role === 'ceo' || actor.role === 'hr_admin' || actor.role === 'area_manager') return true
  return actor.store_id === storeId
}

function canViewEmployee(actor: KpiActor, employeeId: string, storeId: string | undefined): boolean {
  if (actor.role === 'employee') return actor.id === employeeId
  return canViewStore(actor, storeId)
}

function resolveAppealStore(appeal: KpiAppeal, db: KpiDatabase, employeeIds: Set<string>): string | undefined {
  const evaluationStore = db.evaluations.find((item) => item.id === appeal.reference_id)?.employee.store_id
  if (evaluationStore) return evaluationStore
  const incidentStore = db.incidents.find((item) => item.id === appeal.reference_id)?.store_id
  if (incidentStore) return incidentStore
  if (employeeIds.has(appeal.employee_id)) {
    return db.evaluations.find((item) => item.employee.id === appeal.employee_id)?.employee.store_id
  }
  return undefined
}

function buildEmployeeStoreMap(db: KpiDatabase): Map<string, string> {
  const map = new Map<string, string>()
  for (const evaluation of db.evaluations) {
    map.set(evaluation.employee.id, evaluation.employee.store_id)
  }
  for (const incident of db.incidents) {
    if (!map.has(incident.employee_id)) {
      map.set(incident.employee_id, incident.store_id)
    }
  }
  return map
}

function findPreviousMonth(months: string[], month: string): string | undefined {
  const index = months.indexOf(month)
  if (index <= 0) return undefined
  return months[index - 1]
}

function getScoreValue(finalScore?: number, suggestedScore?: number) {
  if (typeof finalScore === 'number') return finalScore
  if (typeof suggestedScore === 'number') return suggestedScore
  return undefined
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function formatScore(value: number): string {
  return round2(value).toFixed(2).replace(/\.00$/, '')
}

function formatSignedScore(value: number): string {
  const rounded = round2(value)
  return `${rounded > 0 ? '+' : ''}${formatScore(rounded)}`
}

function groupBy<T>(items: T[], keySelector: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = keySelector(item)
    const list = map.get(key) ?? []
    list.push(item)
    map.set(key, list)
  }
  return map
}
