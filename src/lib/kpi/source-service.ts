import { calculateIncidentImpact, type KpiIncidentPolicy } from './incident-service.ts'
import type { KpiIncident, KpiPeriod, KpiSetSnapshot } from './types'

export interface KpiSourceDatum {
  key: string
  status: 'ready' | 'missing' | 'proposed' | 'confirmed'
  value?: number
  source_label: string
  captured_at: string
  captured_by?: string
  evidence_refs: string[]
}

export interface KpiSourceAttendanceDatum {
  value: number
  captured_at: string
  evidence_refs: string[]
}

export interface KpiSourceRecord extends KpiSourceDatum {
  employee_id: string
}

export interface CreateKpiSourceServiceOptions {
  attendance_hours?: Record<string, KpiSourceAttendanceDatum>
  source_records?: KpiSourceRecord[]
  incidents?: KpiIncident[]
  incident_policy?: KpiIncidentPolicy
}

export interface ConfirmManualPosSourceInput {
  actor_id: string
  confirmed_at: string
  evidence_refs: string[]
}

const SOURCE_LABELS: Record<string, string> = {
  'attendance.worked_hours': 'Cham cong',
  'pos.revenue_shift_index': 'POS nhap tay',
  'service.customer_experience_index': 'Trai nghiem khach hang',
  'operations.compliance_index': 'Van hanh va SOP',
  'discipline.execution_index': 'Ky luat va vi pham',
}

export function createKpiSourceService(options: CreateKpiSourceServiceOptions = {}) {
  const attendanceHours = options.attendance_hours ?? {}
  const sourceRecords = options.source_records ?? []
  const incidents = options.incidents ?? []
  const incidentPolicy = options.incident_policy

  return {
    collectEmployeeSources(employeeId: string, period: KpiPeriod, snapshot: KpiSetSnapshot): KpiSourceDatum[] {
      const requiredKeys = collectRequiredSourceKeys(snapshot)
      const incidentSourceMap = buildIncidentSourceMap(employeeId, period, snapshot, incidents, incidentPolicy)

      return requiredKeys.map((key) => {
        const incidentSource = incidentSourceMap.get(key)
        if (incidentSource) {
          return incidentSource
        }

        if (key === 'attendance.worked_hours') {
          const attendance = attendanceHours[employeeId]
          if (!attendance) {
            return createMissingSource(key, period.opened_at)
          }

          return {
            key,
            status: 'ready',
            value: attendance.value,
            source_label: SOURCE_LABELS[key],
            captured_at: attendance.captured_at,
            evidence_refs: [...attendance.evidence_refs],
          }
        }

        const record = sourceRecords.find((item) => item.employee_id === employeeId && item.key === key)
        if (!record) {
          return createMissingSource(key, period.opened_at)
        }

        return {
          key: record.key,
          status: record.status,
          value: record.value,
          source_label: record.source_label,
          captured_at: record.captured_at,
          captured_by: record.captured_by,
          evidence_refs: [...record.evidence_refs],
        }
      })
    },
  }
}

export function confirmManualPosSource(
  source: KpiSourceDatum,
  input: ConfirmManualPosSourceInput
): KpiSourceDatum {
  if (source.status !== 'proposed') {
    throw new Error('Chi duoc xac nhan nguon dang cho xac nhan')
  }

  return {
    ...source,
    status: 'confirmed',
    evidence_refs: Array.from(new Set([...source.evidence_refs, ...input.evidence_refs])),
  }
}

function collectRequiredSourceKeys(snapshot: KpiSetSnapshot): string[] {
  const keys = new Set<string>()

  snapshot.groups.forEach((group) => {
    group.criteria
      .filter((criterion) => criterion.active)
      .forEach((criterion) => {
        if (criterion.source_key) {
          keys.add(criterion.source_key)
        }

        if (criterion.applies_when?.min_hours) {
          keys.add('attendance.worked_hours')
        }
      })
  })

  return Array.from(keys)
}

function createMissingSource(key: string, capturedAt: string): KpiSourceDatum {
  return {
    key,
    status: 'missing',
    source_label: SOURCE_LABELS[key] ?? key,
    captured_at: capturedAt,
    evidence_refs: [],
  }
}

function buildIncidentSourceMap(
  employeeId: string,
  period: KpiPeriod,
  snapshot: KpiSetSnapshot,
  incidents: KpiIncident[],
  incidentPolicy?: KpiIncidentPolicy
) {
  const map = new Map<string, KpiSourceDatum>()

  if (!incidentPolicy) {
    return map
  }

  const criteriaById = new Map(
    snapshot.groups.flatMap((group) => group.criteria).map((criterion) => [criterion.id, criterion])
  )

  incidents
    .filter((incident) => incident.employee_id === employeeId)
    .filter((incident) => incident.occurred_at.startsWith(period.month))
    .filter((incident) => ['confirmed', 'acknowledged', 'finalized'].includes(incident.status))
    .forEach((incident) => {
      const impact = calculateIncidentImpact(incident, incidentPolicy)
      if (!impact.criterion_id || impact.suggested_score === undefined) {
        return
      }

      const criterion = criteriaById.get(impact.criterion_id)
      if (!criterion?.source_key) {
        return
      }

      const sourceValue = pickMetricForSuggestedScore(criterion.score_bands, impact.suggested_score)
      const existing = map.get(criterion.source_key)

      if (!existing || (existing.value ?? Number.POSITIVE_INFINITY) > sourceValue) {
        map.set(criterion.source_key, {
          key: criterion.source_key,
          status: 'ready',
          value: sourceValue,
          source_label: `${SOURCE_LABELS[criterion.source_key] ?? criterion.source_key} • Incident`,
          captured_at: incident.occurred_at,
          evidence_refs: Array.from(new Set([
            ...incident.evidence_refs,
            ...incident.violations.flatMap((violation) => violation.evidence_refs),
            `incident:${incident.id}`,
          ])),
        })
      }
    })

  return map
}

function pickMetricForSuggestedScore(
  scoreBands: Array<{ min: number; max: number | null; score: number }>,
  suggestedScore: number
) {
  const band = scoreBands.find((item) => item.score === suggestedScore)
  if (!band) {
    throw new Error(`Khong tim thay score band cho muc ${suggestedScore}`)
  }

  if (band.max === null) {
    return band.min
  }

  return Number(((band.min + band.max) / 2).toFixed(2))
}
