import type {
  KpiAppeal,
  KpiAuditLog,
  KpiDevelopmentCase,
  KpiEvaluation,
  KpiIncident,
  KpiPeriod,
  KpiSetVersion,
  KpiStoreGroup,
} from './types'
import type {
  KpiCareerMapVersion,
  KpiPositionCriteriaProfile,
  KpiCareerEmployeePlacement,
  KpiCareerMapApprovalLog,
} from './career-map-types'
import type {
  CareerGradeDefinition,
  EmployeeCareerPlacement,
  EmployeeSkillCertification,
  OperationalSkillDefinition,
} from './career-grade-types'

export interface KpiDatabase {
  schema_version: 1
  revision: number
  store_groups: KpiStoreGroup[]
  sets: KpiSetVersion[]
  periods: KpiPeriod[]
  evaluations: KpiEvaluation[]
  incidents: KpiIncident[]
  appeals: KpiAppeal[]
  development_cases: KpiDevelopmentCase[]
  audit_logs: KpiAuditLog[]
  career_maps: KpiCareerMapVersion[]
  position_criteria_profiles: KpiPositionCriteriaProfile[]
  career_employee_placements: KpiCareerEmployeePlacement[]
  career_map_approval_logs: KpiCareerMapApprovalLog[]
  career_grades: CareerGradeDefinition[]
  operational_skills: OperationalSkillDefinition[]
  employee_skill_certifications: EmployeeSkillCertification[]
  employee_career_placements: EmployeeCareerPlacement[]
}

export interface KpiRepository {
  load(): Promise<KpiDatabase>
  save(next: KpiDatabase, expectedRevision: number): Promise<KpiDatabase>
  reset(seed: KpiDatabase): Promise<void>
}

export const KPI_REPOSITORY_STORAGE_KEY = 'homies_kpi_saas_v1'

export function createEmptyKpiDatabase(): KpiDatabase {
  return {
    schema_version: 1,
    revision: 0,
    store_groups: [],
    sets: [],
    periods: [],
    evaluations: [],
    incidents: [],
    appeals: [],
    development_cases: [],
    audit_logs: [],
    career_maps: [],
    position_criteria_profiles: [],
    career_employee_placements: [],
    career_map_approval_logs: [],
    career_grades: [],
    operational_skills: [],
    employee_skill_certifications: [],
    employee_career_placements: [],
  }
}
