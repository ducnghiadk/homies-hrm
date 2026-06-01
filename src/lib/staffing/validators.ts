import { TrafficSlot, SalaryConfig } from './types';

export function validateTrafficTotal(pattern: TrafficSlot[]): boolean {
  const total = pattern.reduce((sum, slot) => sum + slot.percentage, 0);
  return total === 100;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateSalaryConfig(config: SalaryConfig[]): ValidationResult {
  const errors: string[] = [];
  
  if (config.length === 0) {
    errors.push('Vui lòng nhập cấu hình lương');
  }

  // Check for 0 or negative values
  config.forEach(c => {
    if (c.amount <= 0) {
      errors.push(`Lương cho vị trí ${c.positionName} (${c.type}) phải lớn hơn 0`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
