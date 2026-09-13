import type {
  EmploymentType,
  ProbationPolicy,
  ProbationSalaryMode,
} from '@/lib/mock-data-employee-ext'

export interface InvitationFormData {
  full_name: string
  email: string
  phone: string
  hire_date: string
  store_id: string
  position_id: string
  department_name: string
  employee_type: EmploymentType
  job_level: string
  official_salary: string
  kpi_salary: string
  is_probationary: boolean
  probation_policy: ProbationPolicy
  probation_end_date: string
  probation_salary_mode: ProbationSalaryMode
  probation_salary_value: string
  auto_complete_probation: boolean
  role: string
  notes: string
}

export interface InvitationFormErrors {
  full_name?: string
  email?: string
  phone?: string
  hire_date?: string
  store_id?: string
  position_id?: string
  department_name?: string
  employee_type?: string
  job_level?: string
  official_salary?: string
  kpi_salary?: string
  probation_end_date?: string
  probation_salary_value?: string
  role?: string
}

export interface CreatedInvitationState {
  id: string
  full_name: string
  email: string
  status: 'draft' | 'sent'
  send_status: 'sent_success' | 'sent_failed'
  last_send_error?: string
}

export interface InvitationEmailConfig {
  subject: string
  personalNote: string
  deadline: string
  supportName: string
  supportInfo: string
}
