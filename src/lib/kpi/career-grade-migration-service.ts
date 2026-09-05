import type {
  CareerGradeCode,
  EmployeeSkillCertification,
  OperationalSkillCode,
} from './career-grade-types.ts'

export interface LegacyEmployeeInput {
  id: string
  name: string
  chuc_vu?: string | null
  position_name?: string | null
  chuyen_mon?: 'pha_che' | 'thu_ngan' | 'ca_hai' | 'da_nang' | 'all' | string | null
  level?: number | string | null
  current_level_code?: string | null
  hop_dong?: 'thu_viec' | 'chinh_thuc' | 'part_time' | 'full_time' | string | null
}

export interface CareerGradeMigrationDecision {
  id?: string
  employee_id: string
  grade_code: CareerGradeCode
}

export type CareerGradeMigrationStatus = 'auto_convertible' | 'needs_confirmation' | 'excluded'

export interface LegacyMigrationResult {
  employee_id: string
  grade_code: CareerGradeCode | null
  suggested_grade_code: CareerGradeCode | null
  inferred_skills: OperationalSkillCode[]
  position_id: string
  status: CareerGradeMigrationStatus
  warnings: string[]
}

export interface CareerGradeMigrationPreviewItem extends LegacyMigrationResult {
  employee_name: string
  reason: string
  evidence_refs: string[]
}

export interface CareerGradeMigrationPreview {
  items: CareerGradeMigrationPreviewItem[]
  summary: {
    total: number
    auto_convertible: number
    needs_confirmation: number
    excluded: number
    ready_to_apply: number
  }
  checksum: string
}

export interface BuildCareerGradeMigrationPreviewInput {
  employees: LegacyEmployeeInput[]
  certifications: EmployeeSkillCertification[]
  decisions: CareerGradeMigrationDecision[]
}

function normalizeStr(val?: string | null): string {
  return (val || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

function suggestLegacyGrade(emp: LegacyEmployeeInput): Pick<LegacyMigrationResult, 'suggested_grade_code' | 'position_id'> {
  const title = normalizeStr(emp.position_name || emp.chuc_vu)
  const specialty = normalizeStr(emp.chuyen_mon)
  const levelCode = normalizeStr(emp.current_level_code)
  const levelNum = typeof emp.level === 'number' ? emp.level : Number.parseInt(String(emp.level || ''), 10)

  if (title.includes('quan ly') || title.includes('store manager') || title.includes('cua hang truong')) {
    return { suggested_grade_code: 'c5', position_id: 'pos_store_manager' }
  }
  if (title.includes('truong ca') || title.includes('shift leader') || title.includes('giam sat')) {
    return { suggested_grade_code: 'c4', position_id: 'pos_shift_leader' }
  }
  if (title.includes('senior') || levelNum >= 3 || levelCode === 'senior') {
    return { suggested_grade_code: 'c3', position_id: 'pos_store_employee' }
  }
  if (
    specialty === 'ca_hai' || specialty === 'da_nang' || specialty === 'all' ||
    specialty.includes('ca hai') || specialty.includes('da nang') || levelNum === 2 || levelCode === 'pt2'
  ) {
    return { suggested_grade_code: 'c2', position_id: 'pos_store_employee' }
  }
  if (specialty.includes('thu ngan') || specialty === 'thu_ngan' || title.includes('thu ngan') || levelCode === 'pt1_tn') {
    return { suggested_grade_code: 'c1_tn', position_id: 'pos_store_employee' }
  }
  if (specialty.includes('pha che') || specialty === 'pha_che' || title.includes('pha che') || levelCode === 'pt1_pc') {
    return { suggested_grade_code: 'c1_pc', position_id: 'pos_store_employee' }
  }
  return { suggested_grade_code: null, position_id: 'pos_store_employee' }
}

export function migrateLegacyEmployeeGrade(emp: LegacyEmployeeInput): LegacyMigrationResult {
  const suggestion = suggestLegacyGrade(emp)
  const specialty = normalizeStr(emp.chuyen_mon)
  const explicitSkills: OperationalSkillCode[] = []
  if (specialty.includes('pha che') || specialty === 'pha_che') explicitSkills.push('barista')
  if (specialty.includes('thu ngan') || specialty === 'thu_ngan') explicitSkills.push('cashier')
  if (
    specialty === 'ca_hai' || specialty === 'da_nang' || specialty === 'all' ||
    specialty.includes('ca hai') || specialty.includes('da nang')
  ) {
    explicitSkills.splice(0, explicitSkills.length, 'barista', 'cashier')
  }

  const evidenceGrade: CareerGradeCode | null = explicitSkills.length === 2
    ? 'c2'
    : explicitSkills[0] === 'barista'
      ? 'c1_pc'
      : explicitSkills[0] === 'cashier'
        ? 'c1_tn'
        : null

  if (evidenceGrade && evidenceGrade === suggestion.suggested_grade_code) {
    return {
      employee_id: emp.id,
      grade_code: evidenceGrade,
      suggested_grade_code: evidenceGrade,
      inferred_skills: explicitSkills,
      position_id: suggestion.position_id,
      status: 'auto_convertible',
      warnings: [],
    }
  }

  return {
    employee_id: emp.id,
    grade_code: null,
    suggested_grade_code: suggestion.suggested_grade_code,
    inferred_skills: [],
    position_id: suggestion.position_id,
    status: 'needs_confirmation',
    warnings: [suggestion.suggested_grade_code
      ? 'Dữ liệu cũ chỉ đủ để gợi ý cấp bậc; HR cần xác nhận bằng chứng.'
      : 'Chưa có đủ dữ liệu để xác định cấp bậc; HR cần chọn thủ công.'],
  }
}

export function migrateLegacyEmployeesBatch(
  employees: LegacyEmployeeInput[]
): Record<string, LegacyMigrationResult> {
  return Object.fromEntries(employees.map((employee) => [employee.id, migrateLegacyEmployeeGrade(employee)]))
}

export function buildCareerGradeMigrationPreview(
  input: BuildCareerGradeMigrationPreviewInput
): CareerGradeMigrationPreview {
  const items = input.employees.map((employee): CareerGradeMigrationPreviewItem => {
    const base = migrateLegacyEmployeeGrade(employee)
    const decision = input.decisions.find((item) => item.employee_id === employee.id)
    const certifications = input.certifications.filter(
      (item) => item.employee_id === employee.id && item.status === 'achieved'
    )
    const skills = new Set(certifications.map((item) => item.skill_code))
    const certifiedGrade: CareerGradeCode | null = skills.has('barista') && skills.has('cashier')
      ? 'c2'
      : skills.has('barista')
        ? 'c1_pc'
        : skills.has('cashier')
          ? 'c1_tn'
          : null
    const resolvedGrade = decision?.grade_code || certifiedGrade || base.grade_code
    const evidenceRefs = [
      ...certifications.map((item) => `certification:${item.id}`),
      ...(decision ? [`decision:${decision.id || decision.grade_code}`] : []),
    ]

    return {
      ...base,
      grade_code: resolvedGrade,
      suggested_grade_code: resolvedGrade || base.suggested_grade_code,
      inferred_skills: certifications.length > 0 ? [...skills] : base.inferred_skills,
      status: resolvedGrade ? 'auto_convertible' : base.status,
      employee_name: employee.name,
      reason: resolvedGrade
        ? 'Có chứng nhận kỹ năng hoặc quyết định cấp bậc hợp lệ.'
        : base.warnings[0],
      evidence_refs: evidenceRefs,
    }
  })

  const summary = {
    total: items.length,
    auto_convertible: items.filter((item) => item.status === 'auto_convertible').length,
    needs_confirmation: items.filter((item) => item.status === 'needs_confirmation').length,
    excluded: items.filter((item) => item.status === 'excluded').length,
    ready_to_apply: items.filter((item) => item.status === 'auto_convertible').length,
  }

  return {
    items,
    summary,
    checksum: createChecksum({
      items: items.map((item) => ({
        employee_id: item.employee_id,
        grade_code: item.grade_code,
        suggested_grade_code: item.suggested_grade_code,
        status: item.status,
        evidence_refs: item.evidence_refs,
      })),
      summary,
    }),
  }
}

function createChecksum(input: unknown): string {
  const raw = JSON.stringify(input)
  let hash = 2166136261
  for (let index = 0; index < raw.length; index += 1) {
    hash ^= raw.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0).toString(36).padStart(8, '0')
}
