import { QuickEstimateState, QuickEstimateResult } from './types';

// Default constants
const DEFAULT_PRODUCTIVITY = 25;const APP_ORDER_BUFFER = 0.3; // 30% more time for app orders

export function calculateQuickEstimate(input: QuickEstimateState): QuickEstimateResult {
  // 1. Calculate effective cups (adjusted for App complexity)
  let effectiveCups = input.dailyCups;
  if (input.businessModel === 'app-delivery' && input.appRatio) {
    // App orders take more time, increase effective cups count
    const appCups = input.dailyCups * (input.appRatio / 100);
    const regularCups = input.dailyCups - appCups;
    effectiveCups = regularCups + (appCups * (1 + APP_ORDER_BUFFER));
  }

  // 2. Cups per hour (Average)
  // Safety check: ensure operatingHours > 0
  const hours = Math.max(1, input.operatingHours);
  const cupsPerHour = effectiveCups / hours;

  // 3. Number of Baristas needed
  // Always need at least 1 barista
  const baristas = Math.max(1, Math.ceil(cupsPerHour / DEFAULT_PRODUCTIVITY));

  // 4. Number of Cashiers
  // For small shops (< 200 cups), cashier can be shared or 1 dedicated
  // Here we simplify: always 1 dedicated cashier recommended for professional setup
  // Maybe 0.5 for very small? Let's stick to user requirement: "Thu ngân mindig = 1"
  const cashiers = 1;

  // 5. Number of Packers (Only for App heavy)
  let packers = 0;
  if (input.businessModel === 'app-delivery' && input.appRatio && input.appRatio > 40) {
    // If very high volume, might need more, but start with 1
    packers = 1;
  }

  // 6. Total headcount per shift
  const totalPerShift = baristas + cashiers + packers;

  // 7. Allocation FT vs PT
  // Strategy: Core team (FT) covers value, PT covers peaks/breaks
  // Simple heuristic from requirements:
  const fulltime = totalPerShift; // 1 FT per role per shift is ideal for stability
  const parttimeMin = 1;
  const parttimeMax = Math.max(2, Math.ceil(totalPerShift * 0.5));

  // 8. Total Hires
  // Assuming 2 shifts per day + backup
  // Min: 2 teams (tight)
  // Max: 2 teams + rotation
  const totalMin = (fulltime * 2) + parttimeMin;
  const totalMax = (fulltime * 2) + parttimeMax;

  // 9. Cost Estimation
  // FT: 6-8M, PT: 20-25k/h
  // Rough estimate per month
  const MONTHLY_COST_FT_MIN = 6000000;
  const MONTHLY_COST_FT_MAX = 8000000;
  
  const estimatedMin = totalMin * MONTHLY_COST_FT_MIN; // Extremely rough
  const estimatedMax = totalMax * MONTHLY_COST_FT_MAX;

  return {
    baristas,
    cashiers,
    packers,
    totalPerShift,
    totalHires: { min: totalMin, max: totalMax },
    fulltime,
    parttime: { min: parttimeMin, max: parttimeMax },
    costRange: { min: estimatedMin, max: estimatedMax }
  };
}
