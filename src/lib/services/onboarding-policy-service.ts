export interface EmployeeOnboardingPolicyRecord {
  employee_id: string;
  confirmed_at_store_at?: string | null;
  policy_acknowledged?: boolean;
  full_sent_at?: string | null;
  [key: string]: any;
}

export const OnboardingPolicyService = {
  ensureRecordFromEmployee(employee: { id: string }): EmployeeOnboardingPolicyRecord {
    return {
      employee_id: employee.id,
      confirmed_at_store_at: null,
      policy_acknowledged: false
    };
  }
};
