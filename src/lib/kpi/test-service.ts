import type { KpiLevelCode } from './types.ts'

export type TestSessionOutcome = 'passed' | 'failed_section_floor' | 'failed_total'

export interface TestSessionSection {
  section_id: string
  score?: number
  scored_by?: string
  scored_at?: string
  evidence_refs: string[]
}

export interface TestSession {
  id: string
  development_case_id: string
  employee_id: string
  current_level: KpiLevelCode
  target_level: KpiLevelCode
  passing_total: number
  section_floor: number
  sections: TestSessionSection[]
  total_score?: number
  outcome?: TestSessionOutcome
  finalized_by?: string
  finalized_at?: string
  created_by: string
  created_at: string
  retest_attempts: number
  retest_scheduled_for?: string
}

export function createTestSession(input: {
  development_case_id: string
  employee_id: string
  current_level: KpiLevelCode
  target_level: KpiLevelCode
  created_by: string
  created_at: string
}): TestSession {
  const template = getTemplate(input.current_level, input.target_level)

  return {
    id: `test_${input.development_case_id}`,
    development_case_id: input.development_case_id,
    employee_id: input.employee_id,
    current_level: input.current_level,
    target_level: input.target_level,
    passing_total: template.passing_total,
    section_floor: template.section_floor,
    sections: template.section_ids.map((section_id) => ({
      section_id,
      evidence_refs: [],
    })),
    created_by: input.created_by,
    created_at: input.created_at,
    retest_attempts: 0,
  }
}

export function scoreTestSection(
  session: TestSession,
  input: {
    section_id: string
    score: number
    actor_id: string
    evidence_refs: string[]
  }
): TestSession {
  return {
    ...session,
    sections: session.sections.map((section) => (
      section.section_id === input.section_id
        ? {
            ...section,
            score: input.score,
            scored_by: input.actor_id,
            scored_at: section.scored_at ?? session.created_at,
            evidence_refs: input.evidence_refs,
          }
        : section
    )),
  }
}

export function finalizeTest(
  session: TestSession,
  input: {
    actor_id: string
    finalized_at: string
  }
): TestSession {
  if (session.sections.some((section) => typeof section.score !== 'number')) {
    throw new Error('Phai cham du tat ca phan truoc khi chot bai test')
  }

  const scores = session.sections.map((section) => section.score as number)
  const total = roundToTwo(scores.reduce((sum, value) => sum + value, 0) / scores.length)
  const hasSectionBelowFloor = scores.some((score) => score < session.section_floor)

  let outcome: TestSessionOutcome = 'passed'
  if (hasSectionBelowFloor) {
    outcome = 'failed_section_floor'
  } else if (total < session.passing_total) {
    outcome = 'failed_total'
  }

  return {
    ...session,
    total_score: total,
    outcome,
    finalized_by: input.actor_id,
    finalized_at: input.finalized_at,
  }
}

export function scheduleRetest(
  session: TestSession,
  input: {
    actor_id: string
    scheduled_at: string
  }
): TestSession {
  if (session.retest_attempts >= 1) {
    throw new Error('Chi duoc test lai toi da mot lan')
  }
  if (!session.outcome || !session.finalized_at || typeof session.total_score !== 'number') {
    throw new Error('Chi duoc len lich test lai sau khi da co ket qua')
  }
  if (session.outcome === 'passed') {
    throw new Error('Bai test da dat, khong can test lai')
  }

  const gap = session.passing_total - session.total_score
  const weeksToAdd = gap <= 5 ? 2 : 4

  return {
    ...session,
    retest_attempts: session.retest_attempts + 1,
    retest_scheduled_for: addWeeks(input.scheduled_at, weeksToAdd),
  }
}

function getTemplate(currentLevel: KpiLevelCode, targetLevel: KpiLevelCode) {
  if (currentLevel === 'senior' && targetLevel === 'shift_leader') {
    return {
      passing_total: 85,
      section_floor: 75,
      section_ids: ['leadership_judgement', 'operations_control', 'coaching_readiness'],
    }
  }

  return {
    passing_total: 80,
    section_floor: 70,
    section_ids: ['product_knowledge', 'operations_execution', 'service_attitude'],
  }
}

function addWeeks(isoDate: string, weeks: number): string {
  const date = new Date(isoDate)
  const shifted = new Date(date.getTime() + weeks * 7 * 24 * 60 * 60 * 1000)
  return shifted.toISOString()
}

function roundToTwo(value: number): number {
  return Number(value.toFixed(2))
}
