import {
  DEFAULT_EMAIL_PERSONAL_NOTE,
  DEFAULT_EMAIL_SUBJECT,
  DEFAULT_EMAIL_SUPPORT_INFO,
  DEFAULT_EMAIL_SUPPORT_NAME,
  getDefaultEmailDeadline,
} from './invitation-constants'
import type { InvitationEmailConfig, InvitationFormData } from './invitation-types'

function addDays(dateStr: string, days: number) {
  const date = new Date(`${dateStr}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

const today = new Date().toISOString().split('T')[0]

export const INITIAL_FORM: InvitationFormData = {
  full_name: '',
  email: '',
  phone: '',
  hire_date: today,
  store_id: '',
  position_id: '',
  department_name: '',
  employee_type: 'part_time',
  job_level: 'L1',
  official_salary: '',
  kpi_salary: '0',
  is_probationary: true,
  probation_policy: 'time_based',
  probation_end_date: addDays(today, 60),
  probation_salary_mode: 'percent_of_official',
  probation_salary_value: '',
  auto_complete_probation: false,
  role: 'employee',
  notes: '',
}

export function createInitialEmailConfig(): InvitationEmailConfig {
  return {
    subject: DEFAULT_EMAIL_SUBJECT,
    personalNote: DEFAULT_EMAIL_PERSONAL_NOTE,
    deadline: getDefaultEmailDeadline(),
    supportName: DEFAULT_EMAIL_SUPPORT_NAME,
    supportInfo: DEFAULT_EMAIL_SUPPORT_INFO,
  }
}
