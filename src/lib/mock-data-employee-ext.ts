// ============================================
// HRM Trà Sữa 🧋 — Mock Data: Employee Extensions
// Import, Export, Offboarding
// ============================================

export interface ImportTemplate {
  columns: { key: string; label: string; required: boolean; type: string; example: string }[]
}

export interface ImportValidationResult {
  row: number
  employee_name: string
  status: 'valid' | 'error' | 'warning'
  errors: string[]
  warnings: string[]
  data: Record<string, string>
}

export interface ExportColumn {
  key: string
  label: string
  selected: boolean
}

export interface OffboardingChecklist {
  id: string
  employee_id: string
  employee_name: string
  position: string
  last_day: string
  initiated_by: string
  status: 'in_progress' | 'completed'
  steps: OffboardingStep[]
}

export interface OffboardingStep {
  id: string
  label: string
  description: string
  is_done: boolean
  done_by?: string
  done_at?: string
}

// ============ Import Template ============
export const importTemplate: ImportTemplate = {
  columns: [
    { key: 'full_name', label: 'Họ tên', required: true, type: 'text', example: 'Nguyễn Văn A' },
    { key: 'phone', label: 'Số điện thoại', required: true, type: 'phone', example: '0901234567' },
    { key: 'email', label: 'Email', required: false, type: 'email', example: 'a@company.vn' },
    { key: 'date_of_birth', label: 'Ngày sinh', required: true, type: 'date', example: '1998-05-15' },
    { key: 'gender', label: 'Giới tính', required: true, type: 'enum:male,female', example: 'male' },
    { key: 'address', label: 'Địa chỉ', required: false, type: 'text', example: '123 ABC, Q.1' },
    { key: 'position', label: 'Vị trí', required: true, type: 'enum:pos-001,...', example: 'Pha chế' },
    { key: 'store', label: 'Cửa hàng', required: true, type: 'enum:store-001,...', example: 'Boba House Q.1' },
    { key: 'hire_date', label: 'Ngày vào', required: true, type: 'date', example: '2026-02-15' },
    { key: 'base_salary', label: 'Lương cơ bản', required: false, type: 'number', example: '5500000' },
  ],
}

// ============ Import Validation Results ============
export const mockImportResults: ImportValidationResult[] = [
  { row: 1, employee_name: 'Trần Văn Hùng', status: 'valid', errors: [], warnings: [], data: { full_name: 'Trần Văn Hùng', phone: '0911111111', position: 'Pha chế', store: 'Boba House Q.1', hire_date: '2026-03-01' } },
  { row: 2, employee_name: 'Lê Thị Nga', status: 'valid', errors: [], warnings: ['Email trống'], data: { full_name: 'Lê Thị Nga', phone: '0922222222', position: 'Thu ngân', store: 'Boba House Q.3', hire_date: '2026-03-01' } },
  { row: 3, employee_name: '', status: 'error', errors: ['Thiếu họ tên', 'Thiếu SĐT'], warnings: [], data: { full_name: '', phone: '', position: 'Phục vụ', store: 'Boba House Q.1', hire_date: '2026-03-01' } },
  { row: 4, employee_name: 'Phạm Minh Đức', status: 'valid', errors: [], warnings: [], data: { full_name: 'Phạm Minh Đức', phone: '0944444444', position: 'Phục vụ', store: 'Boba House Thủ Đức', hire_date: '2026-03-01' } },
  { row: 5, employee_name: 'Ngô Thị Hoa', status: 'error', errors: ['SĐT đã tồn tại (emp-008)'], warnings: [], data: { full_name: 'Ngô Thị Hoa', phone: '0945678901', position: 'Pha chế', store: 'Boba House Q.1', hire_date: '2026-03-01' } },
  { row: 6, employee_name: 'Võ Văn Bình', status: 'valid', errors: [], warnings: [], data: { full_name: 'Võ Văn Bình', phone: '0966666666', position: 'Pha chế', store: 'Boba House Q.3', hire_date: '2026-03-15' } },
]

// ============ Export Columns ============
export const exportColumns: ExportColumn[] = [
  { key: 'employee_code', label: 'Mã NV', selected: true },
  { key: 'full_name', label: 'Họ tên', selected: true },
  { key: 'phone', label: 'SĐT', selected: true },
  { key: 'email', label: 'Email', selected: true },
  { key: 'position', label: 'Vị trí', selected: true },
  { key: 'store', label: 'Cửa hàng', selected: true },
  { key: 'status', label: 'Trạng thái', selected: true },
  { key: 'hire_date', label: 'Ngày vào', selected: true },
  { key: 'date_of_birth', label: 'Ngày sinh', selected: false },
  { key: 'gender', label: 'Giới tính', selected: false },
  { key: 'address', label: 'Địa chỉ', selected: false },
  { key: 'base_salary', label: 'Lương CB', selected: false },
  { key: 'total_points', label: 'Điểm tích lũy', selected: false },
]

// ============ Offboarding ============
export const mockOffboardingChecklists: OffboardingChecklist[] = [
  {
    id: 'off-001', employee_id: 'emp-013', employee_name: 'NV Nghỉ Việc',
    position: 'Phục vụ', last_day: '2026-02-28', initiated_by: 'emp-002',
    status: 'in_progress',
    steps: [
      { id: 'os-001', label: 'Thu hồi đồng phục', description: '2 áo, 1 tạp dề, 1 nón', is_done: true, done_by: 'emp-002', done_at: '2026-02-20' },
      { id: 'os-002', label: 'Thu hồi thẻ nhân viên', description: 'Thẻ ID + thẻ từ cửa', is_done: true, done_by: 'emp-002', done_at: '2026-02-20' },
      { id: 'os-003', label: 'Tính lương còn lại', description: 'Lương tháng 2 (pro-rata) + phép chưa dùng', is_done: false },
      { id: 'os-004', label: 'Trả lương giữ', description: 'Release salary hold (nếu có)', is_done: false },
      { id: 'os-005', label: 'Exit interview', description: 'Phỏng vấn nghỉ việc (optional)', is_done: false },
      { id: 'os-006', label: 'Deactivate tài khoản', description: 'Vô hiệu hóa account + thu hồi devices', is_done: false },
    ],
  },
]

// Helpers
export const getValidImportRows = () => mockImportResults.filter(r => r.status === 'valid')
export const getErrorImportRows = () => mockImportResults.filter(r => r.status === 'error')
export const getActiveOffboarding = () => mockOffboardingChecklists.filter(o => o.status === 'in_progress')
