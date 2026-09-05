import { createPeriodSnapshot } from './configuration-service.ts'
import type {
  KpiActor,
  KpiPeriod,
  KpiPeriodStatus,
  KpiReopenRequest,
  KpiSetVersion,
} from './types'

export interface CreateKpiPeriodInput {
  org_id: string
  store_id: string
  month: string
  employee_ids: string[]
  opened_by: string
  opened_at: string
}

const PERIOD_TRANSITIONS: Record<KpiPeriodStatus, KpiPeriodStatus[]> = {
  draft: ['collecting'],
  collecting: ['leader_scoring'],
  leader_scoring: ['ceo_preapproval'],
  ceo_preapproval: ['published'],
  published: ['appeal_window'],
  appeal_window: ['locked'],
  locked: [],
}

export function createKpiPeriod(input: CreateKpiPeriodInput, version: KpiSetVersion): KpiPeriod {
  if (version.status !== 'published') {
    throw new Error('Chi duoc mo ky tu phien ban KPI da cong bo')
  }

  return {
    id: `period_${input.store_id}_${input.month}`,
    org_id: input.org_id,
    store_id: input.store_id,
    month: input.month,
    status: 'draft',
    snapshot: createPeriodSnapshot(version),
    employee_ids: [...input.employee_ids],
    opened_by: input.opened_by,
    opened_at: input.opened_at,
    revision: 0,
  }
}

export function transitionPeriod(period: KpiPeriod, next: KpiPeriodStatus, actor: KpiActor, reason?: string): KpiPeriod {
  if (period.status === 'locked') {
    throw new Error('Ky da khoa, khong duoc sua truc tiep')
  }

  const allowed = PERIOD_TRANSITIONS[period.status]
  if (!allowed.includes(next)) {
    throw new Error(`Khong the chuyen trang thai tu ${period.status} sang ${next}`)
  }

  const nextPeriod: KpiPeriod = {
    ...period,
    status: next,
    revision: period.revision + 1,
  }

  if (next === 'published') {
    nextPeriod.published_at = period.opened_at
  }

  if (next === 'locked') {
    nextPeriod.locked_at = period.opened_at
  }

  void actor
  void reason

  return nextPeriod
}

export function requestPeriodReopen(period: KpiPeriod, actor: KpiActor, reason: string): KpiReopenRequest {
  if (period.status !== 'locked') {
    throw new Error('Chi ky da khoa moi duoc gui yeu cau mo lai')
  }

  if (!reason.trim()) {
    throw new Error('Can ly do mo lai ky')
  }

  return {
    id: `reopen_${period.id}_${actor.id}`,
    period_id: period.id,
    requested_by: actor.id,
    reason,
    status: 'pending',
  }
}

export function approvePeriodReopen(period: KpiPeriod, request: KpiReopenRequest, ceo: KpiActor): KpiPeriod {
  if (ceo.role !== 'ceo') {
    throw new Error('Chi CEO moi duoc phe duyet mo lai ky')
  }

  if (period.status !== 'locked') {
    throw new Error('Ky chua khoa nen khong the mo lai')
  }

  if (request.status !== 'pending') {
    throw new Error('Yeu cau mo lai ky khong con hop le')
  }

  return {
    ...period,
    status: 'leader_scoring',
    locked_at: undefined,
    revision: period.revision + 1,
  }
}
