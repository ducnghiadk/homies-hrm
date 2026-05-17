import { OptimizationState, OptimizationPlan, StaffSlot, TrafficSlot, SalaryConfig } from './types';
import { calculateHourlyCost } from './cost-calculator';

// Constants
const PRODUCTIVITY = 25; // Cups/hr/staff
const APP_BUFFER = 0.3;

export function generateOptimizationPlans(state: OptimizationState): OptimizationPlan[] {
  const { basicInfo, trafficPattern, salaryConfig } = state;
  if (!trafficPattern || trafficPattern.length === 0) return [];
  if (!salaryConfig || salaryConfig.length === 0) return [];

  // 1. Calculate Hourly Demand (Staff count needed per hour)
  const hourlyDemand = calculateHourlyDemand(
    basicInfo.dailyCups,
    basicInfo.businessModel,
    basicInfo.appRatio || 0,
    basicInfo.openTime,
    basicInfo.closeTime,
    trafficPattern
  );

  // 2. Determine Open/Close hours for shift generation
  const openHour = parseInt(basicInfo.openTime.split(':')[0]);
  const closeHour = parseInt(basicInfo.closeTime.split(':')[0]);

  // 3. Generate Plans
  const planA = generatePlanA(hourlyDemand, salaryConfig, openHour, closeHour);
  const planB = generatePlanB(hourlyDemand, salaryConfig, openHour, closeHour);
  const planC = generatePlanC(hourlyDemand, salaryConfig, openHour, closeHour); // Suggestion

  // Calculate comparisons
  planB.savingsVsA = planA.totalCost - planB.totalCost;
  planC.savingsVsA = planA.totalCost - planC.totalCost;

  return [planA, planB, planC];
}

function calculateHourlyDemand(
  dailyCups: number,
  model: string,
  appRatio: number,
  openTime: string,
  closeTime: string,
  traffic: TrafficSlot[]
): number[] {
  const demand = new Array(24).fill(0);
  const open = parseInt(openTime.split(':')[0]);
  const close = parseInt(closeTime.split(':')[0]);

  // Effective cups load
  let effectiveLoad = dailyCups;
  if (model === 'app-delivery') {
    effectiveLoad = dailyCups * (1 + (appRatio / 100) * APP_BUFFER);
  }

  traffic.forEach(slot => {
    // Cups in this slot
    const slotCups = effectiveLoad * (slot.percentage / 100);
    const duration = slot.endHour - slot.startHour;
    const cupsPerHour = slotCups / duration;
    
    // Staff needed
    const staffNeeded = Math.ceil(cupsPerHour / PRODUCTIVITY); // Barista only for now
    // Always adding 1 cashier/support if load > 25 (1 person can't do all)
    // Actually simplicity: 1 staff can handle 25 cups.
    // +1 fixed cashier?
    // Let's stick to requirement "Barista + 1 Cashier" roughly
    // We will calculate TOTAL staff needed.
    // If < 20 cups/hr, 2 staff min (1 make, 1 cashier/serve) usually
    // Let's use max(2, staffNeeded + 1) for safety, or just staffNeeded if small
    
    const totalNeeded = Math.max(2, staffNeeded + 1); // 1 Service/Cashier + Baristas

    for (let h = slot.startHour; h < slot.endHour; h++) {
      if (h >= open && h < close) {
        demand[h] = totalNeeded;
      }
    }
  });

  return demand;
}

function getSalary(role: 'Barista' | 'Cashier' | 'Helper' | 'Manager', type: 'FT' | 'PT', config: SalaryConfig[]): number {
  // Map simplified roles to Config IDs
  // In real app, we would map IDs dynamically. Here we use name matching or type matching
  // Config usually has: Barista, Cashier, Helper, Manager
  // Let's try to find by name includes
  const mapName = {
    'Barista': 'Pha chế',
    'Cashier': 'Thu ngân',
    'Helper': 'Phụ',
    'Manager': 'Quản lý'
  };
  
  const c = config.find(c => c.type === (type === 'FT' ? 'fullTime' : 'partTime') && c.positionName.includes(mapName[role]));
  return c ? c.amount : (type === 'FT' ? 6000000 : 25000);
}

function createSlot(
  role: string,
  type: 'FT' | 'PT',
  start: number,
  end: number,
  config: SalaryConfig[]
): StaffSlot {
  const hours = end - start;
  // Calculate cost
  // PT: hourly * hours * 30 days
  // FT: monthly
  const salary = getSalary(role as any, type, config);
  let monthlyCost = 0;
  if (type === 'FT') monthlyCost = salary;
  else monthlyCost = salary * hours * 30; // approx

  return {
    role: role,
    shiftName: `${start}h-${end}h`,
    startTime: `${start}:00`,
    endTime: `${end}:00`,
    hoursPerDay: hours,
    monthlyCost
  };
}

// PLAN A: STABLE (Maximize FT)
function generatePlanA(demand: number[], config: SalaryConfig[], open: number, close: number): OptimizationPlan {
  // Strategy: 2 FT shifts covering the whole day.
  // Shift 1: Open -> Open+8
  // Shift 2: Close-8 -> Close
  // Overlap in middle
  
  const ft: StaffSlot[] = [];
  const pt: StaffSlot[] = [];

  // Core Team: 1 Cashier Open-Close (2 FT), 1 Barista Open-Close (2 FT)
  // Total 4 FT Base
  ft.push(createSlot('Cashier', 'FT', open, open + 8, config));
  ft.push(createSlot('Cashier', 'FT', close - 8, close, config));
  ft.push(createSlot('Barista', 'FT', open, open + 8, config));
  ft.push(createSlot('Barista', 'FT', close - 8, close, config));

  // Check demand coverage
  // If demand > 2 anywhere, add PT
  // Simple check for peak
  const maxDemand = Math.max(...demand);
  if (maxDemand > 2) {
    // Add PT Helper for peak
    // Find peak hours
    // Simplified: 11-14, 18-21 usually
    // Let's add 1 PT for peak
    pt.push(createSlot('Helper', 'PT', 17, 21, config)); // Evening peak
  }

  const totalCost = calculateHourlyCost([...ft, ...pt]); // helper sums monthlyCost

  return {
    id: 'A',
    name: 'Ưu tiên ổn định',
    description: 'Tối đa nhân viên Full-time, ít biến động nhân sự.',
    fulltime: ft,
    parttime: pt,
    totalCost,
    pros: ['Nhân sự ổn định', 'Chất lượng phục vụ tốt', 'Ít phải training lại'],
    cons: ['Chi phí cao', 'Kém linh hoạt khi vắng khách'],
    hourlyDemand: demand
  };
}

// PLAN B: SAVING (Maximize PT)
function generatePlanB(demand: number[], config: SalaryConfig[], open: number, close: number): OptimizationPlan {
  // Strategy: 1 FT Manager/Key holder. Rest PT.
  const ft: StaffSlot[] = [];
  const pt: StaffSlot[] = [];

  // 1-2 FT Key
  ft.push(createSlot('Manager', 'FT', open, open + 8, config));
  
  // Fill rest with PT based on demand
  // Morning PT: Open -> 12
  // Noon PT: 11 -> 15
  // Afternoon PT: 14 -> 18
  // Evening PT: 17 -> Close
  pt.push(createSlot('Cashier', 'PT', open, open + 5, config)); // 7-12
  pt.push(createSlot('Barista', 'PT', open, open + 5, config));
  
  pt.push(createSlot('Helper', 'PT', 11, 15, config)); // Peak
  
  pt.push(createSlot('Cashier', 'PT', 17, close, config));
  pt.push(createSlot('Barista', 'PT', 17, close, config));

  const totalCost = calculateHourlyCost([...ft, ...pt]);

  return {
    id: 'B',
    name: 'Ưu tiên tiết kiệm',
    badge: '💰 TIẾT KIỆM NHẤT',
    description: 'Tối đa Part-time để cắt giảm chi phí.',
    fulltime: ft,
    parttime: pt,
    totalCost,
    pros: ['Chi phí thấp nhất', 'Linh hoạt theo traffic'],
    cons: ['Nhân sự không ổn định', 'Chất lượng không đồng đều', 'Tốn công xếp lịch'],
    hourlyDemand: demand
  };
}

// PLAN C: BALANCED (Proposed)
function generatePlanC(demand: number[], config: SalaryConfig[], open: number, close: number): OptimizationPlan {
  // Strategy: 3 FT (Cover Open/Close/Mid), PT for Peaks
  // Typical: 1 FT Open, 1 FT Close, 1 FT Mid (Swing)
  const ft: StaffSlot[] = [];
  const pt: StaffSlot[] = [];

  ft.push(createSlot('Barista', 'FT', open, open + 8, config));
  ft.push(createSlot('Cashier', 'FT', close - 8, close, config));
  // Swing shift FT (11-19)
  ft.push(createSlot('Barista', 'FT', 11, 19, config));

  // PT support
  pt.push(createSlot('Helper', 'PT', 18, 22, config)); // Late peak
  pt.push(createSlot('Cashier', 'PT', 11, 14, config)); // Noon peak

  const totalCost = calculateHourlyCost([...ft, ...pt]);

  return {
    id: 'C',
    name: 'Cân bằng (Đề xuất)',
    badge: '⭐ KHUYÊN DÙNG',
    description: 'Kết hợp FT nòng cốt và PT linh hoạt.',
    fulltime: ft,
    parttime: pt,
    totalCost,
    pros: ['Cân bằng chi phí/chất lượng', 'Đủ nhân sự cứng', 'Linh hoạt giờ cao điểm'],
    cons: ['Cần quản lý 2 loại HĐ', 'Xếp lịch phức tạp hơn Plan A'],
    hourlyDemand: demand
  };
}
