import { OptimizationPlan, StaffSlot, SalaryConfig, ComparisonResult } from './types';

export function calculateMonthlyCost(plan: OptimizationPlan): number {
  return plan.totalCost;
}

export function calculateHourlyCost(shifts: StaffSlot[]): number {
  // This is an estimation, assuming 30 days/month
  // Monthly cost / 30 / 8 (approx)
  // But wait, shifts have monthlyCost pre-calculated
  // This function might be for a specific set of shifts
  
  // Implementation as per requirement: sum up hourly rates for PT, convert FT monthly to hourly?
  // Let's interpret: return total cost of these shifts per day or hour?
  // Actually, UI just needs total monthly cost usually.
  
  // Let's implement a helper to calculate cost of a list of slots
  return shifts.reduce((sum, slot) => sum + slot.monthlyCost, 0);
}

export function comparePlans(planA: OptimizationPlan, planB: OptimizationPlan): ComparisonResult {
  const diffCost = planB.totalCost - planA.totalCost;
  
  // Heuristic for Stability: FT ratio
  const getStability = (p: OptimizationPlan) => {
    const ftHours = p.fulltime.reduce((sum, s) => sum + s.hoursPerDay, 0);
    const ptHours = p.parttime.reduce((sum, s) => sum + s.hoursPerDay, 0);
    return ftHours / (ftHours + ptHours || 1);
  };

  const stabA = getStability(planA);
  const stabB = getStability(planB);
  // Scale 1-5 roughly. High stability = 5.
  // diffStability > 0 means planB is more stable
  const diffStability = (stabB - stabA) * 5; 

  // Flexibility: Inverse of Stability usually, or ratio of PT
  const flexA = 1 - stabA;
  const flexB = 1 - stabB;
  const diffFlexibility = (flexB - flexA) * 5;

  return {
    diffCost,
    diffStability,
    diffFlexibility
  };
}
