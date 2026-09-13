export type CareerGradeCode = 'c1_pc' | 'c1_tn' | 'c2' | 'c3' | 'c4' | 'c5'
export type OperationalSkillCode = 'barista' | 'cashier'

export interface CareerGradeDefinition {
  code: CareerGradeCode
  rank: 1 | 2 | 3 | 4 | 5
  label: string
  position_key: 'store_employee' | 'shift_leader' | 'store_manager'
  required_skill_codes: OperationalSkillCode[]
  management: boolean
}

export interface CareerGradeTransitionDefinition {
  id: string
  from_grade_code: CareerGradeCode
  to_grade_code: CareerGradeCode
  preset_key: 'to_multiskill' | 'to_senior' | 'to_shift_leader' | 'to_store_manager'
}

export interface CareerTransitionDefinition {
  id: string
  from: CareerGradeCode
  to: CareerGradeCode
  required_tenure_months: number
  required_hours_part_time: number
  required_kpi_consecutive_months: number
  required_kpi_min_score: number
  required_skills: OperationalSkillCode[]
  approval_authority: 'store_manager' | 'ceo' | 'hr_admin'
  allow_demotion?: boolean
}

export interface OperationalSkillDefinition {
  code: OperationalSkillCode
  label: string
  active: boolean
}

export interface EmployeeSkillCertification {
  id: string
  employee_id: string
  skill_code: OperationalSkillCode
  status: 'not_started' | 'learning' | 'achieved' | 'expired'
  assessed_at: string | null
  assessed_by: string | null
  score: number | null
  evidence_refs?: string[]
  standard_version: number
}

export interface EmployeeCareerPlacement {
  id: string
  employee_id: string
  career_map_version_id: string
  position_id: string
  grade_code: CareerGradeCode | null
  node_id: string | null
  status: 'placed' | 'unresolved'
  unresolved_reason: string | null
  effective_from: string
  effective_to: string | null
  decision_id: string | null
}
