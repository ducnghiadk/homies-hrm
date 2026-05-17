export type BusinessModel = 'dine-in' | 'takeaway' | 'app-delivery';

export interface QuickEstimateState {
  businessModel: BusinessModel;
  appRatio?: number;        // 0-100, only if model = 'app-delivery'
  avgCupsPerOrder?: number; // default 2.5
  dailyCups: number;
  operatingHours: number;
}

export interface QuickEstimateResult {
  baristas: number;
  cashiers: number;
  packers: number;          // only if appRatio > 40
  totalPerShift: number;
  totalHires: { min: number; max: number };
  fulltime: number;
  parttime: { min: number; max: number };
  costRange: { min: number; max: number };
}

export interface OptimizationState {
  currentStep: 1 | 2 | 3 | 4;
  
  // Step 1
  basicInfo: {
    businessModel: BusinessModel;
    appRatio?: number;
    avgCupsPerOrder?: number;
    dailyCups: number;
    openTime: string;  // "07:00"
    closeTime: string; // "23:00"
    operatingDays: number[]; // [1,2,3,4,5,6,0] = Mon-Sun
  };
  
  // Step 2
  trafficPattern: TrafficSlot[];
  
  // Step 3
  salaryConfig: SalaryConfig[];
  includeBHXH: boolean;
  
  // Step 4
  selectedPlan?: 'A' | 'B' | 'C';
}

export interface TrafficSlot {
  label: string;      // "7h - 9h"
  startHour: number;  // 7
  endHour: number;    // 9 (exclusive)
  percentage: number; // 0-100
  level: 'low' | 'medium' | 'high'; // Derived for UI colors
}

export interface SalaryConfig {
  positionId: string;
  positionName: string;
  type: 'fullTime' | 'partTime';
  amount: number; // Monthly for FT, Hourly for PT
}

export interface OptimizationPlan {
  id: 'A' | 'B' | 'C';
  name: string;
  badge?: string; // "ĐỀ XUẤT", "TIẾT KIỆM"
  description: string;
  fulltime: StaffSlot[];
  parttime: StaffSlot[];
  totalCost: number;
  savingsVsA?: number;
  pros: string[];
  cons: string[];
  hourlyDemand: number[]; // Array of 24 numbers representing staff need per hour
}

export interface StaffSlot {
  role: string;       // "Pha chế", "Thu ngân"
  shiftName: string;  // "Sáng", "Chiều", "Gãy"
  startTime: string;  // "07:00"
  endTime: string;    // "15:00"
  hoursPerDay: number;
  monthlyCost: number;
}

export interface AdminSettings {
  productivity: number; // Cups per hour per barista (default 25)
  appOrderTimeBuffer: number; // % extra time for app orders (default 30%)
  defaultSalaryFT: number;
  defaultSalaryPT: number;
  bhxhRatio: number; // % (default 30%)
  costWarningThreshold: number; // % of revenue
}

export interface ComparisonResult {
  diffCost: number;
  diffStability: number; // 1-5 scale diff
  diffFlexibility: number; // 1-5 scale diff
}
