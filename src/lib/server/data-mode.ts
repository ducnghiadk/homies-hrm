import type { ServerDatabaseSchema, ServerIposIntegrationConfig } from '@/lib/server/db'

export type DataSyncModule = 'employees' | 'shifts' | 'attendance' | 'payroll'

export interface EffectiveDataMode {
  mode: 'ipos' | 'homies_native'
  ipos_master_enabled: boolean
  ipos_authenticated: boolean
  modules: {
    employees: boolean
    shifts: boolean
    attendance: boolean
    payroll: boolean
  }
}

export function isIposMasterEnabled(db: ServerDatabaseSchema): boolean {
  return db.ipos_integration?.is_enabled !== false
}

export function isIposModuleEnabled(
  db: ServerDatabaseSchema,
  moduleName: DataSyncModule
): boolean {
  if (!isIposMasterEnabled(db)) return false
  const cfg: Partial<ServerIposIntegrationConfig> = db.ipos_integration || {}
  switch (moduleName) {
    case 'employees':
      return cfg.sync_employees !== false
    case 'shifts':
      return cfg.sync_shifts !== false
    case 'attendance':
      return cfg.sync_attendance !== false
    case 'payroll':
      return cfg.sync_payroll !== false
    default:
      return false
  }
}

export function getEffectiveDataMode(db: ServerDatabaseSchema): EffectiveDataMode {
  const master = isIposMasterEnabled(db)
  const employees = isIposModuleEnabled(db, 'employees')
  const shifts = isIposModuleEnabled(db, 'shifts')
  const attendance = isIposModuleEnabled(db, 'attendance')
  const payroll = isIposModuleEnabled(db, 'payroll')
  const anyModuleOn = master && (employees || shifts || attendance || payroll)

  return {
    mode: anyModuleOn ? 'ipos' : 'homies_native',
    ipos_master_enabled: master,
    ipos_authenticated: Boolean(db.ipos_integration?.is_authenticated),
    modules: {
      employees,
      shifts,
      attendance,
      payroll,
    },
  }
}

