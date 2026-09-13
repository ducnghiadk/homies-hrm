/**
 * Mock data cho Trung tâm Duyệt (Approval Center)
 * 7 loại yêu cầu phù hợp chuỗi trà sữa Homies
 */

export type ApprovalCategory =
  | 'leave'           // Nghỉ phép / Nghỉ ca
  | 'late_early'      // Xin đi muộn / Về sớm
  | 'swap'            // Đổi ca
  | 'attendance_fix'  // Sửa công / Bổ sung chấm công
  | 'salary_advance'  // Tạm ứng lương
  | 'kpi_review'      // Review KPI
  | 'new_employee'    // Hồ sơ nhân sự mới

export type ApprovalPriority = 'high' | 'medium' | 'low'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type ApprovalItem = {
  id: string
  employee_id: string
  store_id: string
  category: ApprovalCategory
  priority: ApprovalPriority
  status: ApprovalStatus
  title: string
  description: string
  /** Ngày liên quan (ngày xin nghỉ, ngày đổi ca, v.v.) */
  target_date?: string
  /** Tên ca bị ảnh hưởng */
  shift_name?: string
  /** Nhân viên đổi ca cùng */
  swap_with_employee_id?: string
  /** Số tiền tạm ứng */
  amount?: number
  reason: string
  created_at: string
  reviewed_by?: string
  reviewed_at?: string
  review_notes?: string
}

// ── Helpers ──
function daysFromNow(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3600000).toISOString()
}

// ── Category metadata ──
export const APPROVAL_CATEGORIES: Record<
  ApprovalCategory,
  { label: string; iconKey: string; color: string }
> = {
  leave:          { label: 'Nghỉ phép',      iconKey: 'Calendar',       color: '#D9381E' },
  late_early:     { label: 'Đi muộn / Về sớm', iconKey: 'Clock',          color: '#F6C85F' },
  swap:           { label: 'Đổi ca',          iconKey: 'ArrowLeftRight', color: '#2F6FA8' },
  attendance_fix: { label: 'Sửa công',        iconKey: 'FileEdit',       color: '#001D3D' },
  salary_advance: { label: 'Tạm ứng',        iconKey: 'Wallet',         color: '#1E9E57' },
  kpi_review:     { label: 'Review KPI',      iconKey: 'Target',         color: '#D97706' },
  new_employee:   { label: 'Nhân sự mới',     iconKey: 'UserPlus',       color: '#2F6FA8' },
}

// ── Mock approval items ──
export const mockApprovalItems: ApprovalItem[] = [
  // ====== LEAVE (nghỉ phép) ======
  {
    id: 'apv-001',
    employee_id: 'emp-006',
    store_id: 'store-001',
    category: 'leave',
    priority: 'high',
    status: 'pending',
    title: 'Xin nghỉ ca sáng mai',
    description: 'Xin nghỉ ca Sáng 08:00-14:00',
    target_date: daysFromNow(1),
    shift_name: 'Ca Sáng',
    reason: 'Em bị ốm cần đi khám bệnh ạ',
    created_at: hoursAgo(2),
  },
  {
    id: 'apv-002',
    employee_id: 'emp-012',
    store_id: 'store-003',
    category: 'leave',
    priority: 'medium',
    status: 'pending',
    title: 'Xin nghỉ phép 2 ngày',
    description: 'Nghỉ phép năm: 2 ngày liên tiếp',
    target_date: daysFromNow(5),
    reason: 'Em có đám cưới người thân ạ',
    created_at: hoursAgo(8),
  },
  {
    id: 'apv-003',
    employee_id: 'emp-014',
    store_id: 'store-003',
    category: 'leave',
    priority: 'low',
    status: 'pending',
    title: 'Xin nghỉ phép 1 ngày',
    description: 'Nghỉ phép cá nhân',
    target_date: daysFromNow(10),
    reason: 'Em có việc cá nhân cần giải quyết',
    created_at: hoursAgo(24),
  },
  // (Đã duyệt — để test tab history)
  {
    id: 'apv-004',
    employee_id: 'emp-005',
    store_id: 'store-001',
    category: 'leave',
    priority: 'low',
    status: 'approved',
    title: 'Xin nghỉ ca chiều',
    description: 'Nghỉ ca Chiều 14:00-21:00',
    target_date: daysFromNow(-2),
    shift_name: 'Ca Chiều',
    reason: 'Em có lịch thi đại học ạ',
    created_at: hoursAgo(72),
    reviewed_by: 'emp-002',
    reviewed_at: hoursAgo(70),
    review_notes: 'Ok em, cố gắng thi tốt nhé!',
  },

  // ====== LATE/EARLY (đi muộn / về sớm) ======
  {
    id: 'apv-005',
    employee_id: 'emp-007',
    store_id: 'store-001',
    category: 'late_early',
    priority: 'high',
    status: 'pending',
    title: 'Xin đi muộn 30 phút',
    description: 'Đi muộn ca Sáng: 08:00 → 08:30',
    target_date: daysFromNow(0),
    shift_name: 'Ca Sáng',
    reason: 'Em bị kẹt xe trên đường Nguyễn Huệ ạ',
    created_at: hoursAgo(1),
  },
  {
    id: 'apv-006',
    employee_id: 'emp-008',
    store_id: 'store-002',
    category: 'late_early',
    priority: 'medium',
    status: 'pending',
    title: 'Xin về sớm 1 tiếng',
    description: 'Về sớm ca Chiều: 21:00 → 20:00',
    target_date: daysFromNow(1),
    shift_name: 'Ca Chiều',
    reason: 'Em có lịch khám bác sĩ buổi tối ạ',
    created_at: hoursAgo(4),
  },

  // ====== SWAP (đổi ca) ======
  {
    id: 'apv-007',
    employee_id: 'emp-009',
    store_id: 'store-002',
    category: 'swap',
    priority: 'medium',
    status: 'pending',
    title: 'Đổi ca T4 ↔ T5',
    description: 'Đổi ca Chiều (T4) ↔ ca Tối (T5) với Ngọc',
    target_date: daysFromNow(2),
    shift_name: 'Ca Chiều → Ca Tối',
    swap_with_employee_id: 'emp-008',
    reason: 'Em bị trùng lịch học ở trường',
    created_at: hoursAgo(5),
  },
  {
    id: 'apv-008',
    employee_id: 'emp-013',
    store_id: 'store-003',
    category: 'swap',
    priority: 'low',
    status: 'pending',
    title: 'Đổi ca T6 ↔ T7',
    description: 'Đổi ca Sáng (T6) ↔ ca Sáng (T7) với Hồng',
    target_date: daysFromNow(4),
    shift_name: 'Ca Sáng',
    swap_with_employee_id: 'emp-012',
    reason: 'Em muốn nghỉ T6 để đi sinh nhật bạn',
    created_at: hoursAgo(12),
  },

  // ====== ATTENDANCE FIX (sửa công) ======
  {
    id: 'apv-009',
    employee_id: 'emp-010',
    store_id: 'store-002',
    category: 'attendance_fix',
    priority: 'high',
    status: 'pending',
    title: 'Bổ sung check-in ngày hôm qua',
    description: `Check-in lúc 07:58 không được ghi nhận (lỗi WiFi)`,
    target_date: daysFromNow(-1),
    shift_name: 'Ca Sáng',
    reason: 'WiFi quán bị mất lúc em check-in, em có ảnh selfie lúc 07:58',
    created_at: hoursAgo(3),
  },
  {
    id: 'apv-010',
    employee_id: 'emp-011',
    store_id: 'store-002',
    category: 'attendance_fix',
    priority: 'medium',
    status: 'pending',
    title: 'Sửa giờ check-out',
    description: 'Check-out thực tế 21:15, hệ thống ghi 20:00',
    target_date: daysFromNow(-2),
    shift_name: 'Ca Chiều',
    reason: 'Em quên bấm check-out khi hết ca, có camera ghi lại',
    created_at: hoursAgo(18),
  },
  // (Đã từ chối — test history)
  {
    id: 'apv-011',
    employee_id: 'emp-015',
    store_id: 'store-003',
    category: 'attendance_fix',
    priority: 'low',
    status: 'rejected',
    title: 'Sửa check-in trễ',
    description: 'Xin sửa check-in từ 08:25 về 08:00',
    target_date: daysFromNow(-5),
    shift_name: 'Ca Sáng',
    reason: 'Em nghĩ là đã vào đúng giờ',
    created_at: hoursAgo(96),
    reviewed_by: 'emp-004',
    reviewed_at: hoursAgo(90),
    review_notes: 'Camera cho thấy em vào lúc 08:25, không thể sửa',
  },

  // ====== SALARY ADVANCE (tạm ứng) ======
  {
    id: 'apv-012',
    employee_id: 'emp-005',
    store_id: 'store-001',
    category: 'salary_advance',
    priority: 'medium',
    status: 'pending',
    title: 'Tạm ứng 2.000.000đ',
    description: 'Tạm ứng 50% lương tháng này',
    amount: 2000000,
    reason: 'Em cần tiền đóng học phí kỳ này ạ',
    created_at: hoursAgo(6),
  },

  // ====== KPI REVIEW ======
  {
    id: 'apv-013',
    employee_id: 'emp-009',
    store_id: 'store-002',
    category: 'kpi_review',
    priority: 'low',
    status: 'pending',
    title: 'Khiếu nại điểm KPI tháng 7',
    description: 'Điểm phục vụ: 3/5 → xin xét lại 4/5',
    reason: 'Em có 2 feedback 5 sao từ khách mà chưa được tính ạ',
    created_at: hoursAgo(48),
  },

  // ====== NEW EMPLOYEE (nhân sự mới) ======
  {
    id: 'apv-014',
    employee_id: 'emp-002',
    store_id: 'store-001',
    category: 'new_employee',
    priority: 'medium',
    status: 'pending',
    title: 'Duyệt hồ sơ ứng viên Trần Minh Đức',
    description: 'Vị trí: Pha chế — Chi nhánh Nguyễn Huệ',
    reason: 'Ứng viên đã qua phỏng vấn vòng 2, đề xuất nhận',
    created_at: hoursAgo(20),
  },
  {
    id: 'apv-015',
    employee_id: 'emp-003',
    store_id: 'store-002',
    category: 'new_employee',
    priority: 'low',
    status: 'pending',
    title: 'Duyệt hồ sơ ứng viên Lê Thu Hà',
    description: 'Vị trí: Phục vụ — Chi nhánh Phạm Văn Đồng',
    reason: 'Ứng viên được giới thiệu nội bộ, đã phỏng vấn OK',
    created_at: hoursAgo(36),
  },
]

// ── Helpers ──

export function getApprovalsByCategory(category: ApprovalCategory): ApprovalItem[] {
  return mockApprovalItems.filter(item => item.category === category)
}

export function getPendingApprovals(): ApprovalItem[] {
  return mockApprovalItems.filter(item => item.status === 'pending')
}

export function getPendingCountByCategory(): Record<ApprovalCategory, number> {
  const counts = {} as Record<ApprovalCategory, number>
  for (const key of Object.keys(APPROVAL_CATEGORIES) as ApprovalCategory[]) {
    counts[key] = mockApprovalItems.filter(
      item => item.category === key && item.status === 'pending'
    ).length
  }
  return counts
}

export function getApprovalPriorityLabel(priority: ApprovalPriority): string {
  switch (priority) {
    case 'high': return 'Gấp'
    case 'medium': return 'Bình thường'
    case 'low': return 'Thấp'
  }
}

export function getApprovalPriorityColor(priority: ApprovalPriority): string {
  switch (priority) {
    case 'high': return '#D9381E'
    case 'medium': return '#D97706'
    case 'low': return '#95a5a6'
  }
}
