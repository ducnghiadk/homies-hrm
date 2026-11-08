import { buildKpiSeed } from '../kpi/seed'
import { createLocalKpiRepository } from '../kpi/local-repository'
import { createSupabaseKpiRepository } from '../kpi/supabase-repository'
import { createKpiSourceService, confirmManualPosSource } from '../kpi/source-service'
import type { KpiIncidentPolicy } from '../kpi/incident-service'
import type { CreateKpiSourceServiceOptions } from '../kpi/source-service'
import type { KpiIncident } from '../kpi/types'
import type { KpiDatabase } from '../kpi/repository'

import { isRealDbMode } from './repository-config'

const seed = buildKpiSeed()
const repository = (process.env.NEXT_PUBLIC_KPI_REPOSITORY === 'supabase' || isRealDbMode())
  ? createSupabaseKpiRepository()
  : createLocalKpiRepository()
const STATIC_SOURCE_OPTIONS: CreateKpiSourceServiceOptions = {
  attendance_hours: {
    emp_pt1: {
      value: 92,
      captured_at: '2026-08-30T21:00:00.000Z',
      evidence_refs: ['attendance_aug_2026_emp_pt1'],
    },
    emp_pt2: {
      value: 96,
      captured_at: '2026-08-30T21:00:00.000Z',
      evidence_refs: ['attendance_aug_2026_emp_pt2'],
    },
    emp_senior: {
      value: 104,
      captured_at: '2026-08-30T21:00:00.000Z',
      evidence_refs: ['attendance_aug_2026_emp_senior'],
    },
    emp_leader: {
      value: 110,
      captured_at: '2026-08-30T21:00:00.000Z',
      evidence_refs: ['attendance_aug_2026_emp_leader'],
    },
  },
  source_records: [
    {
      employee_id: 'emp_pt1',
      key: 'pos.revenue_shift_index',
      status: 'proposed',
      value: 88,
      source_label: 'POS nhap tay',
      captured_at: '2026-08-30T22:00:00.000Z',
      captured_by: 'leader_01',
      evidence_refs: ['pos_sheet_aug_2026_emp_pt1'],
    },
    {
      employee_id: 'emp_pt2',
      key: 'pos.revenue_shift_index',
      status: 'confirmed',
      value: 91,
      source_label: 'POS nhap tay',
      captured_at: '2026-08-30T22:00:00.000Z',
      captured_by: 'leader_01',
      evidence_refs: ['pos_sheet_aug_2026_emp_pt2', 'confirm_note_emp_pt2'],
    },
    {
      employee_id: 'emp_senior',
      key: 'service.customer_experience_index',
      status: 'ready',
      value: 4.6,
      source_label: 'Trai nghiem khach hang',
      captured_at: '2026-08-30T20:00:00.000Z',
      evidence_refs: ['service_summary_aug_2026_emp_senior'],
    },
  ],
}

const INCIDENT_POLICY: KpiIncidentPolicy = {
  criterion_mappings: {
    attendance_late: 'discipline_execution',
    attendance_no_show: 'discipline_execution',
    wrong_topping: 'operations_accuracy',
    hygiene_breach: 'operations_accuracy',
    cash_shortage: 'discipline_execution',
    customer_complaint: 'customer_feedback',
  },
  manager_accountability_allowed_codes: ['cash_shortage', 'attendance_no_show'],
}

async function ensureSeeded() {
  let current: KpiDatabase
  try {
    current = await repository.load()
  } catch (err) {
    console.warn('[kpiAdapter] repository.load() failed, fallback to local repository:', err)
    try {
      const localRepo = createLocalKpiRepository()
      current = await localRepo.load()
    } catch {
      current = seed
    }
  }

  if (!current || (current.sets.length === 0 && current.periods.length === 0 && current.audit_logs.length === 0)) {
    try {
      await repository.reset(seed)
    } catch {
      try {
        const localRepo = createLocalKpiRepository()
        await localRepo.reset(seed)
      } catch {
        // Safe fallback
      }
    }
    return seed
  }

  return current
}

export const kpiAdapter = {
  repository,
  async getDatabase() {
    const current = await ensureSeeded()
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch('/api/kpi/incidents')
        const json = await res.json()
        if (json?.success && Array.isArray(json.data) && json.data.length > 0) {
          const serverIncidents: KpiIncident[] = json.data.map((srv: Record<string, unknown>) => {
            const rawStatus = String(srv.status || srv.approval_status || '')
            const normalizedStatus: KpiIncident['status'] =
              rawStatus === 'pending' || rawStatus === 'proposed_manager' || rawStatus === 'proposed'
                ? 'proposed'
                : rawStatus === 'confirmed' || rawStatus === 'approved' || rawStatus === 'approved_ceo'
                ? 'confirmed'
                : (srv.status as KpiIncident['status']) || 'proposed'

            return {
              id: String(srv.id || ''),
              store_id: String(srv.store_id || 'store-001'),
              employee_id: String(srv.employee_id || ''),
              occurred_at: String(srv.occurred_at || ''),
              source: (srv.source as KpiIncident['source']) || 'attendance',
              status: normalizedStatus,
              violations: [
                {
                  code: String(srv.violation_code || 'attendance_late'),
                  primary: true,
                  independent_behavior: true,
                  reason: String(srv.reason || 'Lỗi kỷ luật chấm công'),
                  evidence_refs: Array.isArray(srv.evidence_refs) ? srv.evidence_refs.map(String) : [],
                },
              ],
              description: String(srv.description || ''),
              evidence_refs: Array.isArray(srv.evidence_refs) ? srv.evidence_refs.map(String) : [],
            }
          })

          const serverMap = new Map<string, KpiIncident>()
          for (const inc of serverIncidents) {
            serverMap.set(inc.id, inc)
          }

          // Cập nhật các bản ghi trong local storage nếu máy chủ có cập nhật mới
          const merged = current.incidents.map((localInc) => {
            const serverMatch = serverMap.get(localInc.id)
            if (serverMatch) {
              serverMap.delete(localInc.id)
              return { ...localInc, ...serverMatch }
            }
            return localInc
          })

          // Đưa các bản ghi mới từ máy chủ lên đầu danh sách
          for (const srvInc of serverMap.values()) {
            merged.unshift(srvInc)
          }

          return { ...current, incidents: merged }
        }
      } catch (err) {
        console.warn('[kpiAdapter] fetch server incidents error:', err)
      }
    }
    return current
  },
  async addIncident(incident: KpiIncident, actorId = 'system'): Promise<KpiIncident> {
    const current = await ensureSeeded()
    const periodId = incident.period_id || current.periods.find((p) => (
      incident.occurred_at.startsWith(p.month) && p.store_id === incident.store_id
    ))?.id

    const nextIncident: KpiIncident = {
      ...incident,
      period_id: periodId,
    }

    const existingIdx = current.incidents.findIndex((i) => i.id === incident.id)
    let nextIncidents: KpiIncident[]
    if (existingIdx >= 0) {
      nextIncidents = [...current.incidents]
      nextIncidents[existingIdx] = nextIncident
    } else {
      nextIncidents = [nextIncident, ...current.incidents]
    }

    const nextDb: KpiDatabase = {
      ...current,
      revision: current.revision + 1,
      incidents: nextIncidents,
      audit_logs: [
        ...current.audit_logs,
        {
          id: `audit_incident_${nextIncident.id}`,
          entity_type: 'kpi_incident',
          entity_id: nextIncident.id,
          action: existingIdx >= 0 ? 'update' : 'create',
          actor_id: actorId,
          new_value: nextIncident,
          created_at: new Date().toISOString(),
        },
      ],
    }

    try {
      await repository.save(nextDb, current.revision)
    } catch (saveError) {
      console.warn('[kpiAdapter] Supabase save failed, fallback to local repository:', saveError)
      try {
        const localRepo = createLocalKpiRepository()
        await localRepo.save(nextDb, current.revision)
      } catch (localErr) {
        console.warn('[kpiAdapter] Local repository save fallback warning:', localErr)
      }
    }
    return nextIncident
  },
  async collectEmployeeSources(periodId: string, employeeId: string) {
    const current = await ensureSeeded()
    const period = current.periods.find((item) => item.id === periodId)

    if (!period) {
      throw new Error(`Khong tim thay ky KPI ${periodId}`)
    }

    const sourceService = createKpiSourceService({
      ...STATIC_SOURCE_OPTIONS,
      incidents: current.incidents,
      incident_policy: INCIDENT_POLICY,
    })

    return sourceService.collectEmployeeSources(employeeId, period, period.snapshot)
  },
  confirmManualPosSource,
}
