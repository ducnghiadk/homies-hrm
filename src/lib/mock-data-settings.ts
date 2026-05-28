// ============================================
// HRM Trà Sữa 🧋 — Mock Data: Settings
// Payroll (5), Master Data (7), System (9)
// ============================================

// ===== Payroll Settings (5) =====
export const settingsPayroll = {
  standard_work_days: { days_per_month: 26, hours_per_day: 8, ot_coefficient: 1.5, night_coefficient: 1.3, holiday_coefficient: 3.0 },
  salary_coefficients: { probation_rate: 0.85, bhxh_employee: 0.08, bhxh_company: 0.17, bhyt_employee: 0.015, bhyt_company: 0.03, bhtn_employee: 0.01, bhtn_company: 0.01, tax_bracket_1: 0.05 },
  payroll_budget: { monthly_budget: 125000000, warning_threshold: 0.9, auto_lock_day: 5 },
  salary_hold: { default_hold_percent: 20, hold_duration_months: 2, auto_release: true },
  auto_raise: { min_tenure_months: 12, min_kpi_score: 75, raise_step: 500000, max_raise_percent: 15, review_frequency: 'quarterly' },
}

// ===== Master Data (7) =====
export const masterStores = [
  { id: 'store-001', name: 'Homies Milk Tea Q.1', code: 'BH-Q1', address: '123 Nguyễn Huệ, Q.1', phone: '028 1234 5670', is_active: true },
  { id: 'store-002', name: 'Homies Milk Tea Q.3', code: 'BH-Q3', address: '456 Võ Văn Tần, Q.3', phone: '028 1234 5671', is_active: true },
  { id: 'store-003', name: 'Homies Milk Tea Thủ Đức', code: 'BH-TD', address: '789 Phạm Văn Đồng, Thủ Đức', phone: '028 1234 5672', is_active: true },
]

export const masterDepartments = [
  { id: 'dept-001', store_id: 'store-001', name: 'Pha chế', head_count: 3 },
  { id: 'dept-002', store_id: 'store-001', name: 'Thu ngân', head_count: 2 },
  { id: 'dept-003', store_id: 'store-001', name: 'Phục vụ', head_count: 2 },
]

export const masterShifts = [
  { id: 'shift-am', name: 'Ca Sáng', start_time: '07:00', end_time: '14:00', break_minutes: 30, color: '#2F6FA8', is_active: true },
  { id: 'shift-pm', name: 'Ca Chiều', start_time: '14:00', end_time: '21:00', break_minutes: 30, color: '#F6C85F', is_active: true },
  { id: 'shift-ev', name: 'Ca Tối', start_time: '17:00', end_time: '23:00', break_minutes: 15, color: '#001D3D', is_active: true },
]

export const masterLeaveTypes = [
  { id: 'lt-001', name: 'Phép năm', code: 'annual', default_days: 12, is_paid: true, require_doc: false },
  { id: 'lt-002', name: 'Nghỉ ốm', code: 'sick', default_days: 5, is_paid: true, require_doc: true },
  { id: 'lt-003', name: 'Việc riêng', code: 'personal', default_days: 3, is_paid: true, require_doc: false },
  { id: 'lt-004', name: 'Thai sản', code: 'maternity', default_days: 180, is_paid: true, require_doc: true },
  { id: 'lt-005', name: 'Không lương', code: 'unpaid', default_days: 0, is_paid: false, require_doc: false },
]

export const masterPositions = [
  { id: 'pos-001', name: 'Pha chế', level: 1, base_salary: 5500000 },
  { id: 'pos-002', name: 'Thu ngân', level: 1, base_salary: 5000000 },
  { id: 'pos-003', name: 'Phục vụ', level: 1, base_salary: 4800000 },
  { id: 'pos-004', name: 'Trưởng ca', level: 2, base_salary: 8000000 },
  { id: 'pos-005', name: 'Quản lý', level: 3, base_salary: 12000000 },
]

export const masterEmployeeLevels = [
  { level: 0, name: 'Thử việc', min_months: 0, salary_range: '4-5M' },
  { level: 1, name: 'Nhân viên', min_months: 2, salary_range: '5-7M' },
  { level: 2, name: 'Nhân viên Cao cấp', min_months: 12, salary_range: '7-10M' },
  { level: 3, name: 'Trưởng ca', min_months: 18, salary_range: '8-12M' },
  { level: 4, name: 'Quản lý', min_months: 36, salary_range: '12-20M' },
]

export const masterApprovalWorkflows = [
  { id: 'wf-001', name: 'Duyệt nghỉ phép', steps: ['Store Manager', 'HR Admin'], auto_approve_days: 1, max_days_auto: 2 },
  { id: 'wf-002', name: 'Duyệt OT', steps: ['Store Manager'], auto_approve_days: 0, max_days_auto: 0 },
  { id: 'wf-003', name: 'Duyệt tạm ứng', steps: ['Store Manager', 'HR Admin'], auto_approve_days: 0, max_days_auto: 0 },
  { id: 'wf-004', name: 'Duyệt lương', steps: ['HR Admin', 'CEO'], auto_approve_days: 0, max_days_auto: 0 },
]

// ===== System Settings (9) =====
export const settingsSystem = {
  company_info: { name: 'Homies Milk Tea', tax_id: '0123456789', address: '123 Nguyễn Huệ, Q.1, TP.HCM', phone: '028 1234 5670', email: 'hr@homiesmilktea.vn', logo_url: '/logo.png', founded: '2023-01-01' },
  employee_settings: { max_devices: 3, require_photo: true, require_gps: true, probation_months: 2, auto_birthday_wish: true },
  attendance_settings: { check_in_radius_meters: 100, require_selfie: true, allow_manual_edit: true, late_threshold_minutes: 15, auto_alert_manager: true, duplicate_device_check: true },
  schedule_settings: { min_staff_per_shift: 2, max_ot_hours_per_week: 12, allow_shift_swap: true, auto_schedule_enabled: false, publish_ahead_days: 7 },
  payroll_general: { pay_day: 5, currency: 'VND', rounding: 'nearest_1000', lock_after_approve: true, slip_template: 'default' },
  notification_settings: { push_enabled: true, in_app_enabled: true, email_enabled: false, quiet_hours_start: '22:00', quiet_hours_end: '07:00', schedule_reminder_minutes: 30 },
  data_backup: { auto_backup: true, backup_frequency: 'daily', retention_days: 90, last_backup: '2026-02-15T02:00:00', backup_size_mb: 245 },
  audit_log: { enabled: true, retention_months: 36, log_level: 'all', include_read: false },
  integration_settings: { sms_provider: 'mock', sms_enabled: false, email_provider: 'smtp', webhook_url: '', api_key: '' },
}

// Helper to get all settings as flat list for rendering
export const getSettingsSections = () => [
  { key: 'payroll', label: '💰 Cấu hình Lương', items: Object.keys(settingsPayroll).length },
  { key: 'master', label: '📋 Dữ liệu Danh mục', items: 7 },
  { key: 'system', label: '⚙️ Hệ thống', items: Object.keys(settingsSystem).length },
]
