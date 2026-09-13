import { HOMIES_CAREER_GRADES } from './career-grade-catalog.ts'
import type {
  CareerGradeCode,
  EmployeeCareerPlacement,
  EmployeeSkillCertification,
  OperationalSkillCode,
} from './career-grade-types.ts'
import type { KpiCareerMapVersion } from './career-map-types.ts'

export interface PlaceEmployeeToGradeInput {
  employee_id: string
  position_id: string
  grade_code: CareerGradeCode
  map: KpiCareerMapVersion
  effective_from?: string
  certifications?: EmployeeSkillCertification[]
  decision_id?: string
}

export function placeEmployeeToGrade(input: PlaceEmployeeToGradeInput): EmployeeCareerPlacement {
  const targetNode = input.map.nodes.find(
    (n) => n.active && n.position_id === input.position_id && n.grade_code === input.grade_code
  )

  const effectiveFrom = input.effective_from || new Date().toISOString().slice(0, 10)

  const unresolved = (reason: string): EmployeeCareerPlacement => ({
    id: `place_${input.employee_id}_${input.grade_code}_${Date.now()}`,
    employee_id: input.employee_id,
    career_map_version_id: input.map.id,
    position_id: input.position_id,
    grade_code: input.grade_code,
    node_id: null,
    status: 'unresolved',
    unresolved_reason: reason,
    effective_from: effectiveFrom,
    effective_to: null,
    decision_id: input.decision_id || null,
  })

  if (!targetNode) {
    return unresolved('grade_not_in_map')
  }

  const readiness = evaluateSkillReadiness({
    grade_code: input.grade_code,
    certifications: (input.certifications || []).filter((item) => item.employee_id === input.employee_id),
  })
  if (!readiness.ready) {
    return unresolved('missing_skill_certification')
  }

  if (input.grade_code !== 'c1_pc' && input.grade_code !== 'c1_tn' && !input.decision_id) {
    return unresolved('missing_grade_decision')
  }

  return {
    id: `place_${input.employee_id}_${input.grade_code}_${Date.now()}`,
    employee_id: input.employee_id,
    career_map_version_id: input.map.id,
    position_id: input.position_id,
    grade_code: input.grade_code,
    node_id: targetNode.id,
    status: 'placed',
    unresolved_reason: null,
    effective_from: effectiveFrom,
    effective_to: null,
    decision_id: input.decision_id || null,
  }
}

export interface EmployeePlacementInputRef {
  id: string
  position_id: string
  explicit_grade_code?: CareerGradeCode | null
  store_id?: string
  certifications?: EmployeeSkillCertification[]
  decision_id?: string | null
}

export interface BuildEmployeeCareerPlacementsFromMapInput {
  map: KpiCareerMapVersion
  employees: EmployeePlacementInputRef[]
  effective_from?: string
}

export function buildEmployeeCareerPlacementsFromMap(
  input: BuildEmployeeCareerPlacementsFromMapInput
): EmployeeCareerPlacement[] {
  const effectiveFrom = input.effective_from || input.map.effective_from || new Date().toISOString().slice(0, 10)
  const activeNodes = input.map.nodes.filter((n) => n.active)

  return input.employees.map((emp) => {
    // 1. Employee has explicit grade
    if (emp.explicit_grade_code) {
      return placeEmployeeToGrade({
        employee_id: emp.id,
        position_id: emp.position_id,
        grade_code: emp.explicit_grade_code,
        map: input.map,
        effective_from: effectiveFrom,
        certifications: emp.certifications,
        decision_id: emp.decision_id || undefined,
      })
    }

    // A job title never determines a career grade; HR must provide explicit evidence.
    const matchingNodes = activeNodes.filter((n) => n.position_id === emp.position_id)
    return {
      id: `place_${emp.id}_unresolved_${Date.now()}`,
      employee_id: emp.id,
      career_map_version_id: input.map.id,
      position_id: emp.position_id,
      grade_code: null,
      node_id: null,
      status: 'unresolved',
      unresolved_reason:
        matchingNodes.length > 0 ? 'missing_grade_code' : 'position_not_in_map',
      effective_from: effectiveFrom,
      effective_to: null,
      decision_id: null,
    }
  })
}

export interface EvaluateSkillReadinessInput {
  grade_code: CareerGradeCode
  certifications: EmployeeSkillCertification[]
}

export interface EvaluateSkillReadinessResult {
  ready: boolean
  required_skill_codes: OperationalSkillCode[]
  achieved_skill_codes: OperationalSkillCode[]
  missing_skill_codes: OperationalSkillCode[]
}

export function evaluateSkillReadiness(input: EvaluateSkillReadinessInput): EvaluateSkillReadinessResult {
  const gradeDef = HOMIES_CAREER_GRADES.find((g) => g.code === input.grade_code)
  const required = gradeDef?.required_skill_codes || []

  const achievedCodes = new Set(
    input.certifications
      .filter((c) => c.status === 'achieved')
      .map((c) => c.skill_code)
  )

  const achieved_skill_codes = required.filter((code) => achievedCodes.has(code))
  const missing_skill_codes = required.filter((code) => !achievedCodes.has(code))

  return {
    ready: missing_skill_codes.length === 0,
    required_skill_codes: required,
    achieved_skill_codes,
    missing_skill_codes,
  }
}
