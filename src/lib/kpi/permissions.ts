import type { KpiActor } from './types'

export type KpiRole = KpiActor['role']
export type KpiPermission =
  | 'view_self'
  | 'view_store'
  | 'view_scope'
  | 'view_system'
  | 'score_store'
  | 'log_incident'
  | 'submit_appeal_self'
  | 'triage_appeal'
  | 'configure'
  | 'approve_policy'
  | 'propose_promotion'
  | 'prepare_promotion_case'
  | 'decide_promotion'
  | 'view_salary_self'
  | 'view_salary_scope'
  | 'decide_salary'
  | 'request_lock_period'
  | 'lock_period'
  | 'reopen_period'

const permissionMatrix: Record<KpiRole, Set<KpiPermission>> = {
  employee: new Set<KpiPermission>([
    'view_self',
    'submit_appeal_self',
    'propose_promotion',
    'view_salary_self',
  ]),
  shift_leader: new Set<KpiPermission>([
    'view_self',
    'view_store',
    'score_store',
    'log_incident',
    'triage_appeal',
    'propose_promotion',
  ]),
  store_manager: new Set<KpiPermission>([
    'view_self',
    'view_store',
    'score_store',
    'log_incident',
    'triage_appeal',
    'propose_promotion',
    'prepare_promotion_case',
    'view_salary_scope',
    'request_lock_period',
  ]),
  area_manager: new Set<KpiPermission>([
    'view_self',
    'view_scope',
    'score_store',
    'log_incident',
    'triage_appeal',
    'prepare_promotion_case',
    'view_salary_scope',
    'request_lock_period',
  ]),
  hr_admin: new Set<KpiPermission>([
    'view_self',
    'view_scope',
    'log_incident',
    'triage_appeal',
    'configure',
    'prepare_promotion_case',
    'view_salary_scope',
    'request_lock_period',
  ]),
  ceo: new Set<KpiPermission>([
    'view_self',
    'view_system',
    'score_store',
    'log_incident',
    'triage_appeal',
    'approve_policy',
    'prepare_promotion_case',
    'decide_promotion',
    'view_salary_scope',
    'decide_salary',
    'lock_period',
    'reopen_period',
  ]),
}

export function canKpi(role: KpiRole, permission: KpiPermission): boolean {
  return permissionMatrix[role].has(permission)
}
