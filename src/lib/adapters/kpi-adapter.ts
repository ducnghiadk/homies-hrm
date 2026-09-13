import { buildKpiSeed } from '../kpi/seed'
import { createLocalKpiRepository } from '../kpi/local-repository'
import { createSupabaseKpiRepository } from '../kpi/supabase-repository'
import { createKpiSourceService, confirmManualPosSource } from '../kpi/source-service'
import type { KpiIncidentPolicy } from '../kpi/incident-service'
import type { CreateKpiSourceServiceOptions } from '../kpi/source-service'

const seed = buildKpiSeed()
const repository = process.env.NEXT_PUBLIC_KPI_REPOSITORY === 'supabase'
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
  const current = await repository.load()

  if (current.sets.length === 0 && current.periods.length === 0 && current.audit_logs.length === 0) {
    if (process.env.NEXT_PUBLIC_KPI_REPOSITORY === 'supabase') {
      return current
    }
    await repository.reset(seed)
    return seed
  }

  return current
}

export const kpiAdapter = {
  repository,
  async getDatabase() {
    return ensureSeeded()
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
