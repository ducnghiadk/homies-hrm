import type { KpiActor } from './types.ts'

export interface PromotionSalaryInput {
  current_hourly_rate: number
  target_band_min: number
  target_band_max: number
  promotion_increase_min: number
  promotion_increase_max: number
}

export interface InLevelRaiseInput {
  current_hourly_rate: number
  band_max: number
  increase_min: number
  increase_max: number
}

export interface SalarySuggestion {
  min: number
  max: number
  recommended: number
  capped: boolean
  explanation: string
}

export interface SalaryDecisionInput {
  employee_id: string
  development_case_id: string
  decided_rate: number
  effective_from: string
  reason: string
  exception?: { type: string; evidence_refs: string[]; expires_at: string }
}

export interface SalaryDecision extends SalaryDecisionInput {
  decided_by: string
  decided_at: string
}

export function suggestPromotionSalary(input: PromotionSalaryInput): SalarySuggestion {
  const floor = Math.max(input.target_band_min, input.current_hourly_rate + input.promotion_increase_min)
  const ceiling = Math.min(input.target_band_max, input.current_hourly_rate + input.promotion_increase_max)
  const min = Math.min(floor, input.target_band_max)
  const max = Math.max(min, ceiling)
  const capped = max >= input.target_band_max && floor >= input.target_band_max

  if (capped) {
    return {
      min: input.target_band_max,
      max: input.target_band_max,
      recommended: input.target_band_max,
      capped: true,
      explanation: 'Da cham tran band moi nen de xuat bi khoa o muc toi da.',
    }
  }

  return {
    min,
    max,
    recommended: roundToNearest500((min + max) / 2),
    capped: false,
    explanation: 'De xuat tu muc san cap moi va bien do tang luong promotion.',
  }
}

export function suggestInLevelRaise(input: InLevelRaiseInput): SalarySuggestion {
  const min = Math.min(input.current_hourly_rate + input.increase_min, input.band_max)
  const max = Math.min(input.current_hourly_rate + input.increase_max, input.band_max)
  const capped = max >= input.band_max

  if (capped && min === input.band_max) {
    return {
      min: input.band_max,
      max: input.band_max,
      recommended: input.band_max,
      capped: true,
      explanation: 'Tang trong cap nhung khong duoc vuot tran band hien tai.',
    }
  }

  return {
    min,
    max,
    recommended: roundToNearest500((min + max) / 2),
    capped,
    explanation: 'Tang trong cap nhung khong duoc vuot tran band hien tai.',
  }
}

export function approveSalaryDecision(input: SalaryDecisionInput, ceo: KpiActor): SalaryDecision {
  if (ceo.role !== 'ceo') {
    throw new Error('Chi CEO moi duoc phe duyet luong')
  }
  if (!input.reason.trim()) {
    throw new Error('Quyet dinh luong bat buoc co ly do')
  }

  if (input.exception) {
    if (!input.exception.evidence_refs.length) {
      throw new Error('Ngoai le luong bat buoc co evidence')
    }
    if (!input.exception.expires_at.trim()) {
      throw new Error('Ngoai le luong bat buoc co han het hieu luc')
    }
  }

  return {
    ...input,
    decided_by: ceo.id,
    decided_at: '2026-08-22T12:00:00.000Z',
  }
}

function roundToNearest500(value: number): number {
  return Math.round(value / 500) * 500
}
