// ============================================
// HRM Trà Sữa 🧋 — Mock Data: Tasks
// Templates, Daily Tasks, Handover, Incident
// ============================================

export interface TaskTemplate {
  id: string
  name: string
  position: string
  shift: string
  items: TaskItem[]
  created_by: string
  is_active: boolean
}

export interface TaskItem {
  id: string
  description: string
  is_required: boolean
  requires_photo: boolean
  order: number
}

export interface DailyTask {
  id: string
  template_id: string
  employee_id: string
  employee_name: string
  date: string
  shift: string
  items: DailyTaskItem[]
  progress: number // 0-100
  status: 'in_progress' | 'completed' | 'overdue'
}

export interface DailyTaskItem {
  task_item_id: string
  description: string
  is_done: boolean
  is_required: boolean
  requires_photo: boolean
  photo_url?: string
  completed_at?: string
}

export interface HandoverForm {
  id: string
  from_employee_id: string
  from_employee_name: string
  to_employee_id?: string
  to_employee_name?: string
  date: string
  shift_out: string
  shift_in: string
  general_notes: string
  issues: string
  inventory_notes: string
  cash_amount: number
  acknowledged: boolean
  acknowledged_at?: string
  created_at: string
}

export type IncidentSeverity = 'low' | 'medium' | 'high' | 'critical'
export type IncidentStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface IncidentReport {
  id: string
  reporter_id: string
  reporter_name: string
  store_id: string
  category: string
  severity: IncidentSeverity
  title: string
  description: string
  photo_urls: string[]
  status: IncidentStatus
  assigned_to?: string
  resolution?: string
  created_at: string
  resolved_at?: string
}

// ============ Templates ============
export const mockTaskTemplates: TaskTemplate[] = [
  {
    id: 'tpl-001', name: 'Checklist Mở Cửa', position: 'Pha chế', shift: 'Ca Sáng',
    created_by: 'emp-002', is_active: true,
    items: [
      { id: 'ti-001', description: 'Bật đèn, điều hòa, nhạc nền', is_required: true, requires_photo: false, order: 1 },
      { id: 'ti-002', description: 'Kiểm tra nguyên liệu (trà, sữa, topping)', is_required: true, requires_photo: true, order: 2 },
      { id: 'ti-003', description: 'Vệ sinh máy pha, blender', is_required: true, requires_photo: true, order: 3 },
      { id: 'ti-004', description: 'Kiểm tra tồn kho ly, ống hút', is_required: true, requires_photo: false, order: 4 },
      { id: 'ti-005', description: 'Cập nhật bảng giá/menu nếu thay đổi', is_required: false, requires_photo: false, order: 5 },
    ],
  },
  {
    id: 'tpl-002', name: 'Checklist Đóng Cửa', position: 'Pha chế', shift: 'Ca Tối',
    created_by: 'emp-002', is_active: true,
    items: [
      { id: 'ti-006', description: 'Dọn dẹp quầy bar, rửa dụng cụ', is_required: true, requires_photo: true, order: 1 },
      { id: 'ti-007', description: 'Tắt máy, bình nóng lạnh', is_required: true, requires_photo: false, order: 2 },
      { id: 'ti-008', description: 'Kiểm đếm tiền quỹ, ghi sổ', is_required: true, requires_photo: true, order: 3 },
      { id: 'ti-009', description: 'Khóa cửa, bật báo động', is_required: true, requires_photo: false, order: 4 },
    ],
  },
  {
    id: 'tpl-003', name: 'Checklist Thu Ngân', position: 'Thu ngân', shift: 'Tất cả',
    created_by: 'emp-003', is_active: true,
    items: [
      { id: 'ti-010', description: 'Kiểm tra tiền đầu ca', is_required: true, requires_photo: true, order: 1 },
      { id: 'ti-011', description: 'Đối soát máy POS', is_required: true, requires_photo: false, order: 2 },
      { id: 'ti-012', description: 'Ghi nhận khuyến mãi hôm nay', is_required: false, requires_photo: false, order: 3 },
    ],
  },
]

// ============ Daily Tasks ============
export const mockDailyTasks: DailyTask[] = [
  {
    id: 'dt-001', template_id: 'tpl-001', employee_id: 'emp-005', employee_name: 'Trần Thị Mai',
    date: '2026-02-15', shift: 'Ca Sáng', progress: 60, status: 'in_progress',
    items: [
      { task_item_id: 'ti-001', description: 'Bật đèn, điều hòa, nhạc nền', is_done: true, is_required: true, requires_photo: false, completed_at: '2026-02-15T06:55:00' },
      { task_item_id: 'ti-002', description: 'Kiểm tra nguyên liệu', is_done: true, is_required: true, requires_photo: true, photo_url: '/tasks/dt-001-ti-002.jpg', completed_at: '2026-02-15T07:05:00' },
      { task_item_id: 'ti-003', description: 'Vệ sinh máy pha, blender', is_done: true, is_required: true, requires_photo: true, photo_url: '/tasks/dt-001-ti-003.jpg', completed_at: '2026-02-15T07:15:00' },
      { task_item_id: 'ti-004', description: 'Kiểm tra tồn kho ly, ống hút', is_done: false, is_required: true, requires_photo: false },
      { task_item_id: 'ti-005', description: 'Cập nhật bảng giá/menu', is_done: false, is_required: false, requires_photo: false },
    ],
  },
  {
    id: 'dt-002', template_id: 'tpl-003', employee_id: 'emp-010', employee_name: 'Lý Thị Thanh',
    date: '2026-02-15', shift: 'Ca Chiều', progress: 100, status: 'completed',
    items: [
      { task_item_id: 'ti-010', description: 'Kiểm tra tiền đầu ca', is_done: true, is_required: true, requires_photo: true, photo_url: '/tasks/dt-002-ti-010.jpg', completed_at: '2026-02-15T14:02:00' },
      { task_item_id: 'ti-011', description: 'Đối soát máy POS', is_done: true, is_required: true, requires_photo: false, completed_at: '2026-02-15T14:10:00' },
      { task_item_id: 'ti-012', description: 'Ghi nhận khuyến mãi', is_done: true, is_required: false, requires_photo: false, completed_at: '2026-02-15T14:15:00' },
    ],
  },
]

// ============ Handover ============
export const mockHandovers: HandoverForm[] = [
  {
    id: 'ho-001', from_employee_id: 'emp-005', from_employee_name: 'Trần Thị Mai',
    to_employee_id: 'emp-006', to_employee_name: 'Vũ Hoàng Đức',
    date: '2026-02-15', shift_out: 'Ca Sáng', shift_in: 'Ca Chiều',
    general_notes: 'Hôm nay khách đông hơn bình thường, đã dùng hết trà oolong premium',
    issues: 'Máy blender số 2 kêu to, cần kiểm tra',
    inventory_notes: 'Trà oolong premium: HẾT. Sữa tươi: còn 5L. Topping trân châu: còn 2kg',
    cash_amount: 2500000, acknowledged: true, acknowledged_at: '2026-02-15T14:05:00',
    created_at: '2026-02-15T13:55:00',
  },
  {
    id: 'ho-002', from_employee_id: 'emp-006', from_employee_name: 'Vũ Hoàng Đức',
    to_employee_id: 'emp-011', to_employee_name: 'Hoàng Thị Lan',
    date: '2026-02-15', shift_out: 'Ca Chiều', shift_in: 'Ca Tối',
    general_notes: 'Đã đặt thêm trà oolong, sẽ giao sáng mai',
    issues: 'Máy blender #2 vẫn chưa sửa, dùng máy #1',
    inventory_notes: 'Sữa tươi: 3L. Trân châu: 1.5kg. Đường: đủ',
    cash_amount: 4200000, acknowledged: false,
    created_at: '2026-02-15T20:50:00',
  },
]

// ============ Incidents ============
export const mockIncidents: IncidentReport[] = [
  {
    id: 'inc-001', reporter_id: 'emp-005', reporter_name: 'Trần Thị Mai',
    store_id: 'store-001', category: 'Thiết bị', severity: 'medium',
    title: 'Máy blender #2 kêu to bất thường',
    description: 'Máy blender số 2 kêu rất to khi xay đá, có mùi khét nhẹ. Đã ngừng sử dụng.',
    photo_urls: ['/incidents/inc-001-1.jpg', '/incidents/inc-001-2.jpg'],
    status: 'in_progress', assigned_to: 'emp-002',
    created_at: '2026-02-15T10:30:00',
  },
  {
    id: 'inc-002', reporter_id: 'emp-008', reporter_name: 'Ngô Thị Hồng',
    store_id: 'store-002', category: 'Khách hàng', severity: 'high',
    title: 'Khách phàn nàn về chất lượng sản phẩm',
    description: 'Khách phản ánh trà sữa có vị lạ, đã đổi ly mới và xin lỗi. Nghi ngờ lô sữa tươi mới nhập.',
    photo_urls: ['/incidents/inc-002-1.jpg'],
    status: 'open',
    created_at: '2026-02-14T16:45:00',
  },
  {
    id: 'inc-003', reporter_id: 'emp-011', reporter_name: 'Hoàng Thị Lan',
    store_id: 'store-001', category: 'An ninh', severity: 'low',
    title: 'Camera #3 bị mờ',
    description: 'Camera khu vực bếp bị mờ, nghi bụi bám lens. Cần vệ sinh.',
    photo_urls: [],
    status: 'resolved', resolution: 'Đã vệ sinh camera, hoạt động bình thường',
    created_at: '2026-02-13T22:00:00', resolved_at: '2026-02-14T09:00:00',
  },
]

export const incidentCategories = ['Thiết bị', 'Khách hàng', 'An ninh', 'Vệ sinh', 'Nhân sự', 'Khác']

// Helpers
export const getTemplatesByPosition = (position: string) => mockTaskTemplates.filter(t => t.position === position && t.is_active)
export const getDailyTasksByEmployee = (empId: string, date: string) => mockDailyTasks.filter(t => t.employee_id === empId && t.date === date)
export const getHandoversByDate = (date: string) => mockHandovers.filter(h => h.date === date)
export const getIncidentsByStore = (storeId: string) => mockIncidents.filter(i => i.store_id === storeId)
export const getOpenIncidents = () => mockIncidents.filter(i => i.status === 'open' || i.status === 'in_progress')
