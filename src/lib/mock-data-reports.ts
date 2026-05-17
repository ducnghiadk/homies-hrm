// ============================================
// HRM Trà Sữa 🧋 — Mock Data: Reports
// HR, StaffHour, Attendance, Salary, Budget, AutoRaise, Tasks
// ============================================

export interface HROverviewData {
  total_employees: number
  active: number
  probation: number
  inactive: number
  new_this_month: number
  resigned_this_month: number
  avg_tenure_months: number
  gender_ratio: { male: number; female: number }
  by_store: { store: string; count: number }[]
  by_position: { position: string; count: number }[]
  monthly_trend: { month: string; headcount: number }[]
}

export interface StaffHourData {
  period: string
  store: string
  data: { date: string; scheduled_hours: number; actual_hours: number; ot_hours: number }[]
  total_scheduled: number
  total_actual: number
  total_ot: number
  total_hours?: number
  total_overtime?: number
  employee_count?: number
  avg_hours_per_employee?: number
  employees?: { name: string; hours: number; overtime: number }[]
}

export interface AttendanceReportData {
  period: string
  store: string
  summary: { total_days: number; on_time_rate: number; late_rate: number; absent_rate: number }
  by_employee: { name: string; on_time: number; late: number; absent: number; total: number }[]
}

export interface SalaryStructureData {
  period: string
  by_component: { component: string; amount: number; percent: number }[]
  by_position: { position: string; avg_salary: number; count: number }[]
  total_cost?: number
  employee_count?: number
  breakdown?: { label: string; amount: number; color: string; percentage: number }[]
}

export interface BudgetReportData {
  period: string
  budget: number
  actual: number
  variance: number
  variance_percent: number
  monthly: { month: string; budget: number; actual: number }[]
  breakdown?: { label: string; amount: number; color: string; percentage: number }[]
}

export interface AutoRaiseCandidate {
  employee_id: string
  employee_name: string
  position: string
  tenure_months: number
  avg_kpi: number
  current_salary: number
  suggested_raise: number
  suggested_salary: number
  eligible: boolean
  reason: string
}

export interface TaskReportData {
  period: string
  store: string
  completion_rate: number
  total_tasks: number
  completed: number
  by_template: { template: string; completion: number }[]
  incidents: { total: number; resolved: number; open: number }
  in_progress?: number
  overdue?: number
  by_employee?: { name: string; completed: number; pending: number }[]
}

// ============ Data ============
export const mockHROverview: HROverviewData = {
  total_employees: 15, active: 13, probation: 1, inactive: 1,
  new_this_month: 1, resigned_this_month: 0, avg_tenure_months: 14,
  gender_ratio: { male: 7, female: 8 },
  by_store: [
    { store: 'Boba House Q.1', count: 7 },
    { store: 'Boba House Q.3', count: 5 },
    { store: 'Boba House Thủ Đức', count: 3 },
  ],
  by_position: [
    { position: 'Pha chế', count: 5 }, { position: 'Thu ngân', count: 3 },
    { position: 'Phục vụ', count: 4 }, { position: 'Trưởng ca', count: 1 },
    { position: 'Quản lý', count: 2 },
  ],
  monthly_trend: [
    { month: '09/2025', headcount: 11 }, { month: '10/2025', headcount: 12 },
    { month: '11/2025', headcount: 13 }, { month: '12/2025', headcount: 14 },
    { month: '01/2026', headcount: 15 }, { month: '02/2026', headcount: 15 },
  ],
}

export const mockStaffHours: StaffHourData = {
  period: '02/2026', store: 'Tất cả',
  data: Array.from({ length: 15 }, (_, i) => ({
    date: `2026-02-${String(i + 1).padStart(2, '0')}`,
    scheduled_hours: 56, actual_hours: 52 + Math.floor(Math.random() * 8),
    ot_hours: Math.floor(Math.random() * 6),
  })),
  total_scheduled: 840, total_actual: 812, total_ot: 34,
}

export const mockAttendanceReport: AttendanceReportData = {
  period: '01/2026', store: 'Tất cả',
  summary: { total_days: 26, on_time_rate: 87.5, late_rate: 8.3, absent_rate: 4.2 },
  by_employee: [
    { name: 'Trần Thị Mai', on_time: 26, late: 0, absent: 0, total: 26 },
    { name: 'Vũ Hoàng Đức', on_time: 24, late: 1, absent: 1, total: 26 },
    { name: 'Đặng Minh Khoa', on_time: 20, late: 4, absent: 2, total: 26 },
    { name: 'Ngô Thị Hồng', on_time: 23, late: 2, absent: 1, total: 26 },
    { name: 'Bùi Văn Tùng', on_time: 22, late: 3, absent: 1, total: 26 },
  ],
}

export const mockSalaryStructure: SalaryStructureData = {
  period: '01/2026',
  by_component: [
    { component: 'Lương cơ bản', amount: 107500000, percent: 68 },
    { component: 'Phụ cấp', amount: 17000000, percent: 11 },
    { component: 'Thưởng', amount: 2800000, percent: 2 },
    { component: 'OT', amount: 3200000, percent: 2 },
    { component: 'BHXH (NV)', amount: -8600000, percent: -5 },
    { component: 'Thuế TNCN', amount: -2900000, percent: -2 },
    { component: 'Khấu trừ khác', amount: -1200000, percent: -1 },
  ],
  by_position: [
    { position: 'Quản lý', avg_salary: 14500000, count: 2 },
    { position: 'Trưởng ca', avg_salary: 9800000, count: 1 },
    { position: 'Pha chế', avg_salary: 6500000, count: 5 },
    { position: 'Thu ngân', avg_salary: 6000000, count: 3 },
    { position: 'Phục vụ', avg_salary: 5200000, count: 4 },
  ],
}

export const mockBudgetReport: BudgetReportData = {
  period: '2026', budget: 1500000000, actual: 128000000,
  variance: -12000000, variance_percent: -0.8,
  monthly: [
    { month: '01/2026', budget: 125000000, actual: 128000000 },
    { month: '02/2026', budget: 125000000, actual: 0 },
  ],
}

export const mockAutoRaiseCandidates: AutoRaiseCandidate[] = [
  { employee_id: 'emp-005', employee_name: 'Trần Thị Mai', position: 'Pha chế', tenure_months: 14, avg_kpi: 91.2, current_salary: 5500000, suggested_raise: 500000, suggested_salary: 6000000, eligible: true, reason: 'KPI > 85, thâm niên > 12 tháng' },
  { employee_id: 'emp-008', employee_name: 'Ngô Thị Hồng', position: 'Pha chế', tenure_months: 12, avg_kpi: 78.5, current_salary: 5500000, suggested_raise: 300000, suggested_salary: 5800000, eligible: true, reason: 'Thâm niên = 12 tháng, KPI > 75' },
  { employee_id: 'emp-007', employee_name: 'Đặng Minh Khoa', position: 'Phục vụ', tenure_months: 8, avg_kpi: 71.3, current_salary: 4800000, suggested_raise: 0, suggested_salary: 4800000, eligible: false, reason: 'Chưa đủ 12 tháng thâm niên' },
]

export const mockTaskReport: TaskReportData = {
  period: '02/2026', store: 'Tất cả', completion_rate: 85.3,
  total_tasks: 420, completed: 358,
  by_template: [
    { template: 'Checklist Mở Cửa', completion: 92 },
    { template: 'Checklist Đóng Cửa', completion: 88 },
    { template: 'Checklist Thu Ngân', completion: 78 },
  ],
  incidents: { total: 8, resolved: 5, open: 3 },
}
