// =============================================
// HRM Trà Sữa 🧋 — KPI Mock Data
// Phase 3F: Seed data for KPI system
// =============================================

import type {
  KPICategory, KPICriteria, ViolationType, KPIGrade,
  LevelConfig, EvaluationTimeline, KPISettings,
  KPIOptionType, EmployeeLevel, ViolationRecord, ViolationSummary,
  KPIEvaluation, PromotionReview, EvaluationScore, CategoryScore,
} from './kpi-types'

// ══════════════════════════════════════
// 1. CATEGORIES — 13 total
// ══════════════════════════════════════

export const mockKPICategories: KPICategory[] = [
  // ── Option A (L0-L1): 4 categories ──
  { id: 'cat-a1', name: 'Chuyên cần', name_en: 'Attendance', type: 'auto', weight: 25, option_type: 'A', evaluators: ['self', 'manager'], icon: '📅', color: '#2F6FA8', sort_order: 1, is_active: true },
  { id: 'cat-a2', name: 'Thái độ', name_en: 'Attitude', type: 'manual', weight: 25, option_type: 'A', evaluators: ['self', 'mentor', 'manager'], icon: '😊', color: '#1E9E57', sort_order: 2, is_active: true },
  { id: 'cat-a3', name: 'Năng lực', name_en: 'Competence', type: 'manual', weight: 25, option_type: 'A', evaluators: ['self', 'mentor', 'manager'], icon: '💪', color: '#F6C85F', sort_order: 3, is_active: true },
  { id: 'cat-a4', name: 'Lỗi vi phạm', name_en: 'Violations', type: 'deduction', weight: 25, option_type: 'A', evaluators: ['manager'], icon: '⚠️', color: '#D9381E', sort_order: 4, is_active: true },

  // ── Option B (L2-L3): 5 categories ──
  { id: 'cat-b1', name: 'Chuyên cần', name_en: 'Attendance', type: 'auto', weight: 20, option_type: 'B', evaluators: ['self', 'manager'], icon: '📅', color: '#2F6FA8', sort_order: 1, is_active: true },
  { id: 'cat-b2', name: 'Thái độ', name_en: 'Attitude', type: 'manual', weight: 20, option_type: 'B', evaluators: ['self', 'leader', 'manager'], icon: '😊', color: '#1E9E57', sort_order: 2, is_active: true },
  { id: 'cat-b3', name: 'Năng lực', name_en: 'Competence', type: 'manual', weight: 25, option_type: 'B', evaluators: ['self', 'senior', 'manager'], icon: '💪', color: '#F6C85F', sort_order: 3, is_active: true },
  { id: 'cat-b4', name: 'Hỗ trợ & Đào tạo', name_en: 'Support & Training', type: 'manual', weight: 15, option_type: 'B', evaluators: ['self', 'peer', 'manager'], icon: '🤝', color: '#001D3D', sort_order: 4, is_active: true },
  { id: 'cat-b5', name: 'Lỗi vi phạm', name_en: 'Violations', type: 'deduction', weight: 20, option_type: 'B', evaluators: ['manager'], icon: '⚠️', color: '#D9381E', sort_order: 5, is_active: true },

  // ── Option C (L4-L5): 4 categories ──
  { id: 'cat-c1', name: 'Chuyên cần', name_en: 'Attendance', type: 'auto', weight: 10, option_type: 'C', evaluators: ['self', 'ceo'], icon: '📅', color: '#2F6FA8', sort_order: 1, is_active: true },
  { id: 'cat-c2', name: 'Quản lý', name_en: 'Management', type: 'manual', weight: 35, option_type: 'C', evaluators: ['self', 'ceo', 'peer'], icon: '👔', color: '#0ea5e9', sort_order: 2, is_active: true },
  { id: 'cat-c3', name: 'Kết quả team', name_en: 'Team Results', type: 'manual', weight: 35, option_type: 'C', evaluators: ['self', 'ceo'], icon: '📊', color: '#1E9E57', sort_order: 3, is_active: true },
  { id: 'cat-c4', name: 'Lỗi vi phạm', name_en: 'Violations', type: 'deduction', weight: 20, option_type: 'C', evaluators: ['ceo'], icon: '⚠️', color: '#D9381E', sort_order: 4, is_active: true },
]

// ══════════════════════════════════════
// 2. CRITERIA — 28 total
// ══════════════════════════════════════

export const mockKPICriteria: KPICriteria[] = [
  // ── A1: Chuyên cần (Option A) ──
  { id: 'cri-a1-1', category_id: 'cat-a1', name: 'Tỷ lệ đi làm', name_en: 'Attendance rate', description: 'Số ngày đi làm / tổng ngày làm việc', input_type: 'percent', max_value: 100, target_value: 95, target_operator: '>=', auto_source: 'attendance.rate', sort_order: 1, is_active: true },
  { id: 'cri-a1-2', category_id: 'cat-a1', name: 'Đúng giờ', name_en: 'Punctuality', description: 'Số ca đúng giờ / tổng ca', input_type: 'percent', max_value: 100, target_value: 90, target_operator: '>=', auto_source: 'attendance.on_time', sort_order: 2, is_active: true },

  // ── A2: Thái độ (Option A) ──
  { id: 'cri-a2-1', category_id: 'cat-a2', name: 'Nhiệt tình', name_en: 'Enthusiasm', description: 'Sẵn sàng hỗ trợ, phục vụ khách hàng', input_type: 'star', max_value: 5, target_value: 4, target_operator: '>=', rating_guide: '1⭐ Thờ ơ ↔ 5⭐ Rất nhiệt tình', sort_order: 1, is_active: true },
  { id: 'cri-a2-2', category_id: 'cat-a2', name: 'Tác phong', name_en: 'Professionalism', description: 'Đồng phục, vệ sinh cá nhân, giao tiếp', input_type: 'star', max_value: 5, target_value: 4, target_operator: '>=', rating_guide: '1⭐ Không chỉnh tề ↔ 5⭐ Luôn chuyên nghiệp', sort_order: 2, is_active: true },
  { id: 'cri-a2-3', category_id: 'cat-a2', name: 'Teamwork', name_en: 'Teamwork', description: 'Hợp tác, hỗ trợ đồng đội trong ca', input_type: 'star', max_value: 5, target_value: 3, target_operator: '>=', rating_guide: '1⭐ Không hợp tác ↔ 5⭐ Hỗ trợ tuyệt vời', sort_order: 3, is_active: true },

  // ── A3: Năng lực (Option A) ──
  { id: 'cri-a3-1', category_id: 'cat-a3', name: 'Kỹ năng pha chế', name_en: 'Brewing skill', description: 'Tốc độ & chất lượng pha chế', input_type: 'star', max_value: 5, target_value: 3, target_operator: '>=', rating_guide: '1⭐ Cần hướng dẫn ↔ 5⭐ Thành thạo', sort_order: 1, is_active: true },
  { id: 'cri-a3-2', category_id: 'cat-a3', name: 'Xử lý tình huống', name_en: 'Problem solving', description: 'Khả năng xử lý khi thiếu nguyên liệu, khách khiếu nại', input_type: 'star', max_value: 5, target_value: 3, target_operator: '>=', sort_order: 2, is_active: true },

  // ── A4: Lỗi (Option A) — no criteria, uses violation logs ──

  // ── B1: Chuyên cần (Option B) ──
  { id: 'cri-b1-1', category_id: 'cat-b1', name: 'Tỷ lệ đi làm', name_en: 'Attendance rate', description: 'Số ngày đi làm / tổng ngày làm việc', input_type: 'percent', max_value: 100, target_value: 95, target_operator: '>=', auto_source: 'attendance.rate', sort_order: 1, is_active: true },
  { id: 'cri-b1-2', category_id: 'cat-b1', name: 'Đúng giờ', name_en: 'Punctuality', description: 'Số ca đúng giờ / tổng ca', input_type: 'percent', max_value: 100, target_value: 95, target_operator: '>=', auto_source: 'attendance.on_time', sort_order: 2, is_active: true },

  // ── B2: Thái độ (Option B) ──
  { id: 'cri-b2-1', category_id: 'cat-b2', name: 'Nhiệt tình', name_en: 'Enthusiasm', description: 'Chủ động, nhiệt tình trong công việc', input_type: 'star', max_value: 5, target_value: 4, target_operator: '>=', sort_order: 1, is_active: true },
  { id: 'cri-b2-2', category_id: 'cat-b2', name: 'Trách nhiệm', name_en: 'Responsibility', description: 'Hoàn thành tốt nhiệm vụ được giao', input_type: 'star', max_value: 5, target_value: 4, target_operator: '>=', sort_order: 2, is_active: true },

  // ── B3: Năng lực (Option B) ──
  { id: 'cri-b3-1', category_id: 'cat-b3', name: 'Kỹ năng chuyên môn', name_en: 'Professional skill', description: 'Tay nghề pha chế hoặc thu ngân', input_type: 'star', max_value: 5, target_value: 4, target_operator: '>=', sort_order: 1, is_active: true },
  { id: 'cri-b3-2', category_id: 'cat-b3', name: 'Sáng tạo', name_en: 'Creativity', description: 'Đề xuất cải tiến quy trình, menu', input_type: 'star', max_value: 5, target_value: 3, target_operator: '>=', sort_order: 2, is_active: true },
  { id: 'cri-b3-3', category_id: 'cat-b3', name: 'Năng suất', name_en: 'Productivity', description: 'Số ly / ca hoặc đơn xử lý', input_type: 'number', max_value: 200, target_value: 120, target_operator: '>=', sort_order: 3, is_active: true },

  // ── B4: Hỗ trợ (Option B) ──
  { id: 'cri-b4-1', category_id: 'cat-b4', name: 'Đào tạo NV mới', name_en: 'Training new staff', description: 'Hướng dẫn nhân viên thử việc', input_type: 'star', max_value: 5, target_value: 3, target_operator: '>=', sort_order: 1, is_active: true },
  { id: 'cri-b4-2', category_id: 'cat-b4', name: 'Hỗ trợ đồng đội', name_en: 'Peer support', description: 'Giúp đỡ đồng nghiệp trong ca', input_type: 'star', max_value: 5, target_value: 4, target_operator: '>=', sort_order: 2, is_active: true },

  // ── B5: Lỗi (Option B) — no criteria, uses violation logs ──

  // ── C1: Chuyên cần (Option C) ──
  { id: 'cri-c1-1', category_id: 'cat-c1', name: 'Tỷ lệ đi làm', name_en: 'Attendance rate', description: 'Có mặt đúng giờ tại cửa hàng', input_type: 'percent', max_value: 100, target_value: 98, target_operator: '>=', auto_source: 'attendance.rate', sort_order: 1, is_active: true },

  // ── C2: Quản lý (Option C) ──
  { id: 'cri-c2-1', category_id: 'cat-c2', name: 'Phân ca hợp lý', name_en: 'Scheduling', description: 'Đảm bảo đủ nhân sự, không thiếu ca', input_type: 'star', max_value: 5, target_value: 4, target_operator: '>=', sort_order: 1, is_active: true },
  { id: 'cri-c2-2', category_id: 'cat-c2', name: 'Đào tạo & phát triển', name_en: 'Staff development', description: 'Coaching, feedback cho team', input_type: 'star', max_value: 5, target_value: 4, target_operator: '>=', sort_order: 2, is_active: true },
  { id: 'cri-c2-3', category_id: 'cat-c2', name: 'Xử lý sự cố', name_en: 'Incident handling', description: 'Phản hồi nhanh, giải quyết vấn đề', input_type: 'star', max_value: 5, target_value: 4, target_operator: '>=', sort_order: 3, is_active: true },

  // ── C3: Kết quả team (Option C) ──
  { id: 'cri-c3-1', category_id: 'cat-c3', name: 'Doanh số cửa hàng', name_en: 'Store revenue', description: 'Đạt target doanh số tháng', input_type: 'percent', max_value: 150, target_value: 100, target_operator: '>=', sort_order: 1, is_active: true },
  { id: 'cri-c3-2', category_id: 'cat-c3', name: 'KPI trung bình team', name_en: 'Team avg KPI', description: 'Điểm KPI trung bình của nhân viên', input_type: 'percent', max_value: 100, target_value: 80, target_operator: '>=', sort_order: 2, is_active: true },
  { id: 'cri-c3-3', category_id: 'cat-c3', name: 'Tỷ lệ nghỉ việc', name_en: 'Turnover rate', description: 'Tỷ lệ NV nghỉ / tổng NV', input_type: 'percent', max_value: 100, target_value: 5, target_operator: '<=', sort_order: 3, is_active: true },

  // ── C4: Lỗi (Option C) — no criteria, uses violation logs ──
]

// ══════════════════════════════════════
// 3. VIOLATION TYPES — 18 total
// ══════════════════════════════════════

const allStaffLevels: EmployeeLevel[] = ['L0', 'L1', 'L2', 'L3', 'L4', 'L5']
const staffOnly: EmployeeLevel[] = ['L0', 'L1', 'L2', 'L3']
const mgrOnly: EmployeeLevel[] = ['L4', 'L5']

export const mockViolationTypes: ViolationType[] = [
  // ── General (13) ──
  { id: 'vio-L01', code: 'L01', name: 'Đi trễ dưới 15 phút', name_en: 'Late < 15min', description: 'Chấm công trễ so với giờ ca dưới 15 phút', severity: 'minor', penalty_points: 5, applicable_levels: allStaffLevels, requires_evidence: false, requires_acknowledgment: false, notify_admin: false, sort_order: 1, is_active: true },
  { id: 'vio-L02', code: 'L02', name: 'Quên đồng phục', name_en: 'Missing uniform', description: 'Không mặc đồng phục đúng quy định', severity: 'minor', penalty_points: 5, applicable_levels: allStaffLevels, requires_evidence: false, requires_acknowledgment: false, notify_admin: false, sort_order: 2, is_active: true },
  { id: 'vio-L03', code: 'L03', name: 'Dùng điện thoại trong ca', name_en: 'Phone usage', description: 'Sử dụng điện thoại cá nhân khi đang phục vụ', severity: 'minor', penalty_points: 5, applicable_levels: staffOnly, requires_evidence: false, requires_acknowledgment: false, notify_admin: false, sort_order: 3, is_active: true },
  { id: 'vio-M01', code: 'M01', name: 'Đi trễ 15-30 phút', name_en: 'Late 15-30min', description: 'Chấm công trễ 15-30 phút', severity: 'medium', penalty_points: 10, applicable_levels: allStaffLevels, requires_evidence: false, requires_acknowledgment: true, notify_admin: false, sort_order: 4, is_active: true },
  { id: 'vio-M02', code: 'M02', name: 'Không tuân thủ SOP', name_en: 'SOP non-compliance', description: 'Không làm theo quy trình chuẩn đã training', severity: 'medium', penalty_points: 10, applicable_levels: allStaffLevels, requires_evidence: true, requires_acknowledgment: true, notify_admin: false, sort_order: 5, is_active: true },
  { id: 'vio-M03', code: 'M03', name: 'Thiếu vệ sinh', name_en: 'Hygiene issue', description: 'Không tuân thủ quy định vệ sinh an toàn thực phẩm', severity: 'medium', penalty_points: 10, applicable_levels: allStaffLevels, requires_evidence: true, requires_acknowledgment: true, notify_admin: false, sort_order: 6, is_active: true },
  { id: 'vio-H01', code: 'H01', name: 'Vắng không phép', name_en: 'Unauthorized absence', description: 'Vắng mặt không báo trước và không có lý do chính đáng', severity: 'major', penalty_points: 20, applicable_levels: allStaffLevels, requires_evidence: false, requires_acknowledgment: true, notify_admin: true, sort_order: 7, is_active: true },
  { id: 'vio-H02', code: 'H02', name: 'Thái độ với khách hàng', name_en: 'Customer complaint', description: 'Bị khách hàng phản ánh thái độ phục vụ', severity: 'major', penalty_points: 20, applicable_levels: allStaffLevels, requires_evidence: true, requires_acknowledgment: true, notify_admin: true, sort_order: 8, is_active: true },
  { id: 'vio-H03', code: 'H03', name: 'Gây hỏng thiết bị', name_en: 'Equipment damage', description: 'Làm hỏng thiết bị do bất cẩn', severity: 'major', penalty_points: 20, applicable_levels: allStaffLevels, requires_evidence: true, requires_acknowledgment: true, notify_admin: true, sort_order: 9, is_active: true },
  { id: 'vio-S01', code: 'S01', name: 'Trộm cắp', name_en: 'Theft', description: 'Lấy tài sản công ty hoặc đồng nghiệp', severity: 'critical', penalty_points: 50, applicable_levels: allStaffLevels, requires_evidence: true, requires_acknowledgment: true, notify_admin: true, sort_order: 10, is_active: true },
  { id: 'vio-S02', code: 'S02', name: 'Gian lận chấm công', name_en: 'Attendance fraud', description: 'Chấm công hộ hoặc gian lận thời gian làm việc', severity: 'critical', penalty_points: 50, applicable_levels: allStaffLevels, requires_evidence: true, requires_acknowledgment: true, notify_admin: true, sort_order: 11, is_active: true },
  { id: 'vio-S03', code: 'S03', name: 'Xung đột với đồng nghiệp', name_en: 'Workplace conflict', description: 'Gây xung đột nghiêm trọng hoặc bạo lực', severity: 'critical', penalty_points: 30, applicable_levels: allStaffLevels, requires_evidence: true, requires_acknowledgment: true, notify_admin: true, sort_order: 12, is_active: true },
  { id: 'vio-S04', code: 'S04', name: 'Tiết lộ bí mật kinh doanh', name_en: 'Confidentiality breach', description: 'Chia sẻ công thức, dữ liệu kinh doanh ra ngoài', severity: 'critical', penalty_points: 50, applicable_levels: allStaffLevels, requires_evidence: true, requires_acknowledgment: true, notify_admin: true, sort_order: 13, is_active: true },

  // ── Manager-only (5) ──
  { id: 'vio-MG01', code: 'MG01', name: 'Thiếu giám sát ca', name_en: 'Shift supervision failure', description: 'Không có mặt hoặc không giám sát nhân viên trong ca', severity: 'medium', penalty_points: 15, applicable_levels: mgrOnly, requires_evidence: false, requires_acknowledgment: true, notify_admin: true, sort_order: 14, is_active: true },
  { id: 'vio-MG02', code: 'MG02', name: 'Không report sự cố', name_en: 'Incident non-report', description: 'Không báo cáo sự cố cho cấp trên trong 24h', severity: 'major', penalty_points: 20, applicable_levels: mgrOnly, requires_evidence: false, requires_acknowledgment: true, notify_admin: true, sort_order: 15, is_active: true },
  { id: 'vio-MG03', code: 'MG03', name: 'Phân ca không hợp lý', name_en: 'Poor scheduling', description: 'Thiếu hoặc thừa nhân sự gây ảnh hưởng doanh thu', severity: 'medium', penalty_points: 10, applicable_levels: mgrOnly, requires_evidence: true, requires_acknowledgment: true, notify_admin: false, sort_order: 16, is_active: true },
  { id: 'vio-MG04', code: 'MG04', name: 'Không đào tạo NV mới', name_en: 'Training neglect', description: 'Nhân viên mới không được hướng dẫn đầy đủ', severity: 'medium', penalty_points: 10, applicable_levels: mgrOnly, requires_evidence: false, requires_acknowledgment: true, notify_admin: false, sort_order: 17, is_active: true },
  { id: 'vio-MG05', code: 'MG05', name: 'Lạm quyền', name_en: 'Authority abuse', description: 'Sử dụng quyền hạn sai mục đích', severity: 'critical', penalty_points: 50, applicable_levels: mgrOnly, requires_evidence: true, requires_acknowledgment: true, notify_admin: true, sort_order: 18, is_active: true },
]

// ══════════════════════════════════════
// 4. GRADES — 5
// ══════════════════════════════════════

export const mockKPIGrades: KPIGrade[] = [
  { id: 'grade-1', code: 'excellent', name: 'Xuất sắc', name_en: 'Excellent', min_score: 95, max_score: 100, color: '#1E9E57', icon: '🏆', promotion_eligible: true, sort_order: 1 },
  { id: 'grade-2', code: 'good', name: 'Tốt', name_en: 'Good', min_score: 85, max_score: 94, color: '#2F6FA8', icon: '⭐', promotion_eligible: true, sort_order: 2 },
  { id: 'grade-3', code: 'fair', name: 'Khá', name_en: 'Fair', min_score: 75, max_score: 84, color: '#F6C85F', icon: '👍', promotion_eligible: false, sort_order: 3 },
  { id: 'grade-4', code: 'average', name: 'Trung bình', name_en: 'Average', min_score: 60, max_score: 74, color: '#f97316', icon: '📋', promotion_eligible: false, sort_order: 4 },
  { id: 'grade-5', code: 'poor', name: 'Yếu', name_en: 'Poor', min_score: 0, max_score: 59, color: '#D9381E', icon: '⚡', promotion_eligible: false, sort_order: 5 },
]

// ══════════════════════════════════════
// 5. LEVEL CONFIGS — 6
// ══════════════════════════════════════

export const mockLevelConfigs: LevelConfig[] = [
  { id: 'lv-0', level: 'L0', name: 'Thử việc', option_type: 'A', min_months_to_promote: 2, required_kpi_average: 60, allow_self_evaluation: false, evaluators: ['mentor', 'manager'], promotion_requires_ceo_approval: false },
  { id: 'lv-1', level: 'L1', name: 'Nhân viên chính thức', option_type: 'A', min_months_to_promote: 6, required_kpi_average: 75, allow_self_evaluation: true, evaluators: ['self', 'mentor', 'manager'], promotion_requires_ceo_approval: false },
  { id: 'lv-2', level: 'L2', name: 'Nhân viên kinh nghiệm', option_type: 'B', min_months_to_promote: 12, required_kpi_average: 80, allow_self_evaluation: true, evaluators: ['self', 'senior', 'manager'], promotion_requires_ceo_approval: false },
  { id: 'lv-3', level: 'L3', name: 'Senior / Trưởng ca', option_type: 'B', min_months_to_promote: 18, required_kpi_average: 85, allow_self_evaluation: true, evaluators: ['self', 'leader', 'manager', 'ceo'], promotion_requires_ceo_approval: true },
  { id: 'lv-4', level: 'L4', name: 'Phó Quản lý', option_type: 'C', min_months_to_promote: 24, required_kpi_average: 85, allow_self_evaluation: true, evaluators: ['self', 'ceo', 'peer'], promotion_requires_ceo_approval: true },
  { id: 'lv-5', level: 'L5', name: 'Quản lý cửa hàng', option_type: 'C', min_months_to_promote: 36, required_kpi_average: 90, allow_self_evaluation: true, evaluators: ['self', 'ceo'], promotion_requires_ceo_approval: true },
]

// ══════════════════════════════════════
// 6. EVALUATION TIMELINE — 5 phases
// ══════════════════════════════════════

export const mockEvaluationTimeline: EvaluationTimeline[] = [
  { id: 'et-1', phase: 'data_collection', name: 'Thu thập dữ liệu', start_day: 1, end_day: 25, responsible_role: ['manager'] },
  { id: 'et-2', phase: 'self_evaluation', name: 'Tự đánh giá', start_day: 26, end_day: 28, responsible_role: ['self'] },
  { id: 'et-3', phase: 'review', name: 'Cấp trên đánh giá', start_day: 28, end_day: 30, responsible_role: ['manager', 'ceo'] },
  { id: 'et-4', phase: 'publish', name: 'Công bố kết quả', start_day: 1, end_day: 3, responsible_role: ['manager'] },
  { id: 'et-5', phase: 'appeal', name: 'Khiếu nại', start_day: 3, end_day: 5, responsible_role: ['self'] },
]

// ══════════════════════════════════════
// 7. KPI SETTINGS — 1 record
// ══════════════════════════════════════

export const mockKPISettings: KPISettings = {
  id: 'kpi-settings-001',
  org_id: 'org-001',
  evaluation_cycle: 'monthly',
  promotion_review_months: 6,
  appeal_window_hours: 48,
  allow_late_error_logging: false,
  require_evidence_for_major: true,
  notify_employee_on_error: true,
  updated_at: '2026-02-01T00:00:00Z',
  updated_by: 'emp-001',
}

// ══════════════════════════════════════
// HELPER FUNCTIONS
// ══════════════════════════════════════

export function getKPICategoriesByOption(option: KPIOptionType): KPICategory[] {
  return mockKPICategories
    .filter(c => c.option_type === option && c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function getKPICriteriaByCategory(categoryId: string): KPICriteria[] {
  return mockKPICriteria
    .filter(c => c.category_id === categoryId && c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function getViolationTypes(level?: EmployeeLevel): ViolationType[] {
  return mockViolationTypes
    .filter(v => v.is_active && (!level || v.applicable_levels.includes(level)))
    .sort((a, b) => a.sort_order - b.sort_order)
}

export function getKPIGrades(): KPIGrade[] {
  return [...mockKPIGrades].sort((a, b) => a.sort_order - b.sort_order)
}

export function getLevelConfig(level: EmployeeLevel): LevelConfig | undefined {
  return mockLevelConfigs.find(c => c.level === level)
}

export function getEvaluationTimeline(): EvaluationTimeline[] {
  return [...mockEvaluationTimeline].sort((a, b) => a.start_day - b.start_day)
}

export function getKPISettings(): KPISettings {
  return { ...mockKPISettings }
}

// ══════════════════════════════════════
// 8. VIOLATION RECORDS — 12 for Feb 2026
// ══════════════════════════════════════

export const mockViolationRecords: ViolationRecord[] = [
  // emp-005 (store-001): 3 violations
  {
    id: 'vr-001', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-005',
    violation_type_id: 'vio-L01', logged_by: 'emp-002', logged_by_role: 'manager',
    log_mode: 'realtime', occurred_at: '2026-02-03T08:12:00Z', logged_at: '2026-02-03T08:15:00Z',
    description: 'Đi trễ 12 phút ca sáng', penalty_points: 5,
    status: 'finalized', acknowledged_at: '2026-02-03T12:00:00Z', finalized_at: '2026-02-03T12:00:00Z', period: '2026-02',
  },
  {
    id: 'vr-002', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-005',
    violation_type_id: 'vio-L03', logged_by: 'emp-002', logged_by_role: 'manager',
    log_mode: 'realtime', occurred_at: '2026-02-10T14:30:00Z', logged_at: '2026-02-10T14:32:00Z',
    description: 'Sử dụng điện thoại cá nhân trong lúc phục vụ khách', penalty_points: 5,
    status: 'acknowledged', employee_response: 'Em xin lỗi, em sẽ không tái phạm', acknowledged_at: '2026-02-10T18:00:00Z', period: '2026-02',
  },
  {
    id: 'vr-003', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-005',
    violation_type_id: 'vio-M02', logged_by: 'emp-002', logged_by_role: 'manager',
    log_mode: 'end_of_month', occurred_at: '2026-02-15T10:00:00Z', logged_at: '2026-02-25T09:00:00Z',
    description: 'Không tuân thủ SOP pha chế: bỏ qua bước đo lường nguyên liệu', evidence_url: '/evidence/vr-003.jpg',
    penalty_points: 10, status: 'appealed', appeal_reason: 'Em đã đo bằng mắt thường do cân bị hỏng lúc đó, đã báo quản lý',
    appeal_at: '2026-02-25T14:00:00Z', period: '2026-02',
  },

  // emp-006 (store-001): 3 violations
  {
    id: 'vr-004', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-006',
    violation_type_id: 'vio-L02', logged_by: 'emp-002', logged_by_role: 'manager',
    log_mode: 'realtime', occurred_at: '2026-02-05T08:00:00Z', logged_at: '2026-02-05T08:05:00Z',
    description: 'Không mặc đồng phục đúng quy định (thiếu tạp dề)', penalty_points: 5,
    status: 'finalized', acknowledged_at: '2026-02-05T10:00:00Z', finalized_at: '2026-02-05T10:00:00Z', period: '2026-02',
  },
  {
    id: 'vr-005', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-006',
    violation_type_id: 'vio-M01', logged_by: 'emp-002', logged_by_role: 'manager',
    log_mode: 'realtime', occurred_at: '2026-02-12T08:22:00Z', logged_at: '2026-02-12T08:25:00Z',
    description: 'Đi trễ 22 phút, không báo trước', penalty_points: 10,
    status: 'appeal_rejected', appeal_reason: 'Do kẹt xe bất ngờ trên đường đi làm',
    appeal_at: '2026-02-12T12:00:00Z', appeal_reviewed_by: 'emp-001', appeal_reviewed_at: '2026-02-13T09:00:00Z',
    appeal_decision: 'Kẹt xe không phải trường hợp bất khả kháng. Cần khởi hành sớm hơn.',
    finalized_at: '2026-02-13T09:00:00Z', period: '2026-02',
  },
  {
    id: 'vr-006', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-006',
    violation_type_id: 'vio-M03', logged_by: 'emp-002', logged_by_role: 'manager',
    log_mode: 'end_of_month', occurred_at: '2026-02-18T16:00:00Z', logged_at: '2026-02-25T09:30:00Z',
    description: 'Không rửa tay đúng quy trình sau khi nghỉ giải lao', evidence_url: '/evidence/vr-006.jpg',
    penalty_points: 10, status: 'pending', period: '2026-02',
  },

  // emp-007 (store-001): 3 violations
  {
    id: 'vr-007', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-007',
    violation_type_id: 'vio-H01', logged_by: 'emp-002', logged_by_role: 'manager',
    log_mode: 'realtime', occurred_at: '2026-02-16T00:00:00Z', logged_at: '2026-02-16T09:00:00Z',
    description: 'Vắng mặt cả ngày không thông báo, điện thoại không liên lạc được', penalty_points: 20,
    status: 'appeal_approved', appeal_reason: 'Em bị sốt cao phải nhập viện cấp cứu, không kịp báo. Có giấy nhập viện.',
    appeal_at: '2026-02-17T10:00:00Z', appeal_reviewed_by: 'emp-001', appeal_reviewed_at: '2026-02-17T15:00:00Z',
    appeal_decision: 'Chấp nhận. Có bằng chứng nhập viện. Hoàn điểm.', finalized_at: '2026-02-17T15:00:00Z', period: '2026-02',
  },
  {
    id: 'vr-008', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-007',
    violation_type_id: 'vio-L01', logged_by: 'emp-002', logged_by_role: 'manager',
    log_mode: 'realtime', occurred_at: '2026-02-18T08:10:00Z', logged_at: '2026-02-18T08:12:00Z',
    description: 'Đi trễ 10 phút', penalty_points: 5,
    status: 'acknowledged', acknowledged_at: '2026-02-18T12:00:00Z', period: '2026-02',
  },
  {
    id: 'vr-009', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-007',
    violation_type_id: 'vio-H02', logged_by: 'emp-002', logged_by_role: 'manager',
    log_mode: 'realtime', occurred_at: '2026-02-19T15:30:00Z', logged_at: '2026-02-19T15:45:00Z',
    description: 'Khách hàng phản ánh thái độ cáu gắt khi khách hỏi nhiều về menu', evidence_url: '/evidence/vr-009.jpg',
    penalty_points: 20, status: 'pending', period: '2026-02',
  },

  // emp-008 (store-002): 3 violations
  {
    id: 'vr-010', org_id: 'org-001', store_id: 'store-002', employee_id: 'emp-008',
    violation_type_id: 'vio-L01', logged_by: 'emp-004', logged_by_role: 'manager',
    log_mode: 'realtime', occurred_at: '2026-02-07T08:08:00Z', logged_at: '2026-02-07T08:10:00Z',
    description: 'Đi trễ 8 phút ca sáng', penalty_points: 5,
    status: 'finalized', acknowledged_at: '2026-02-07T10:00:00Z', finalized_at: '2026-02-07T10:00:00Z', period: '2026-02',
  },
  {
    id: 'vr-011', org_id: 'org-001', store_id: 'store-002', employee_id: 'emp-008',
    violation_type_id: 'vio-S02', logged_by: 'emp-004', logged_by_role: 'manager',
    log_mode: 'realtime', occurred_at: '2026-02-14T17:00:00Z', logged_at: '2026-02-14T17:30:00Z',
    description: 'Phát hiện nhờ đồng nghiệp chấm công hộ khi chưa đến ca', evidence_url: '/evidence/vr-011.jpg',
    penalty_points: 50, status: 'appealed', appeal_reason: 'Em nhờ bạn chấm công vì em đang trên đường đến, chỉ trễ 5 phút',
    appeal_at: '2026-02-15T08:00:00Z', period: '2026-02',
  },
  {
    id: 'vr-012', org_id: 'org-001', store_id: 'store-002', employee_id: 'emp-008',
    violation_type_id: 'vio-L02', logged_by: 'emp-004', logged_by_role: 'manager',
    log_mode: 'end_of_month', occurred_at: '2026-02-20T08:00:00Z', logged_at: '2026-02-25T10:00:00Z',
    description: 'Quên mang tạp dề', penalty_points: 5,
    status: 'pending', period: '2026-02',
  },
]

// ══════════════════════════════════════
// VIOLATION HELPER FUNCTIONS
// ══════════════════════════════════════

export function getViolationsByEmployee(employeeId: string, period?: string): ViolationRecord[] {
  return mockViolationRecords.filter(
    v => v.employee_id === employeeId && (!period || v.period === period),
  )
}

export function getViolationsByStore(storeId: string, period?: string): ViolationRecord[] {
  return mockViolationRecords.filter(
    v => v.store_id === storeId && (!period || v.period === period),
  )
}

export function getPendingViolations(employeeId: string): ViolationRecord[] {
  return mockViolationRecords.filter(
    v => v.employee_id === employeeId && v.status === 'pending',
  )
}

export function getAllPendingAppeals(storeId?: string): ViolationRecord[] {
  return mockViolationRecords.filter(
    v => v.status === 'appealed' && (!storeId || v.store_id === storeId),
  )
}

export function getViolationSummary(employeeId: string, period: string): ViolationSummary {
  const recs = getViolationsByEmployee(employeeId, period)
  // Only count finalized, acknowledged, appeal_rejected records for penalty
  const countable = recs.filter(r =>
    ['finalized', 'acknowledged', 'appeal_rejected', 'pending', 'appealed'].includes(r.status)
    && r.status !== 'appeal_approved',
  )
  const bySev = { minor: 0, medium: 0, major: 0, critical: 0 }
  let totalPenalty = 0
  countable.forEach(r => {
    const vType = mockViolationTypes.find(vt => vt.id === r.violation_type_id)
    if (vType) bySev[vType.severity]++
    // Don't count penalty for approved appeals
    if (r.status !== 'appeal_approved') totalPenalty += r.penalty_points
  })
  return {
    employee_id: employeeId,
    period,
    total_violations: countable.length,
    total_penalty_points: totalPenalty,
    by_severity: bySev,
    pending_appeals: recs.filter(r => r.status === 'appealed').length,
    violation_score: Math.max(0, 100 - totalPenalty),
  }
}

// ══════════════════════════════════════
// 9. KPI EVALUATIONS — 10 for Jan+Feb 2026
// ══════════════════════════════════════

function mkScore(criteriaId: string, self?: number, mgr?: number, final?: number, src: EvaluationScore['source'] = 'self'): EvaluationScore {
  return { criteria_id: criteriaId, self_score: self, manager_score: mgr, final_score: final ?? mgr ?? self ?? 0, source: src }
}

function mkCat(catId: string, name: string, weight: number, raw: number, scores: EvaluationScore[]): CategoryScore {
  return { category_id: catId, category_name: name, weight, raw_score: raw, weighted_score: Math.round(raw * weight / 100), scores }
}

export const mockEvaluations: KPIEvaluation[] = [
  // ── emp-005 (L1, Option A) — Jan 2026: published ──
  {
    id: 'eval-005-01', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-005',
    employee_level: 'L1', option_type: 'A', period: '2026-01',
    category_scores: [
      mkCat('cat-a1', 'Chuyên cần', 25, 92, [
        mkScore('cri-a1-1', undefined, undefined, 92, 'auto'),
        mkScore('cri-a1-2', undefined, undefined, 88, 'auto'),
      ]),
      mkCat('cat-a2', 'Thái độ', 25, 80, [
        mkScore('cri-a2-1', 4, 4, 4, 'manager'),
        mkScore('cri-a2-2', 4, 3, 3, 'manager'),
        mkScore('cri-a2-3', 3, 4, 4, 'manager'),
      ]),
      mkCat('cat-a3', 'Năng lực', 25, 72, [
        mkScore('cri-a3-1', 4, 3, 3, 'manager'),
        mkScore('cri-a3-2', 3, 4, 4, 'manager'),
      ]),
      mkCat('cat-a4', 'Lỗi vi phạm', 25, 90, []),
    ],
    violation_score: 90, total_score: 84, grade_code: 'fair',
    status: 'published', self_submitted_at: '2026-01-26T10:00:00Z', self_comment: 'Tháng này em cố gắng cải thiện chuyên cần.',
    reviewed_by: 'emp-002', reviewed_at: '2026-01-28T14:00:00Z',
    manager_comment: 'Bình cần cải thiện kỹ năng pha chế, thái độ tốt.',
    published_at: '2026-02-01T09:00:00Z', published_by: 'emp-002',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-02-01T09:00:00Z',
  },

  // ── emp-005 (L1) — Feb 2026: self_submitted (waiting review) ──
  {
    id: 'eval-005-02', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-005',
    employee_level: 'L1', option_type: 'A', period: '2026-02',
    category_scores: [
      mkCat('cat-a1', 'Chuyên cần', 25, 88, [
        mkScore('cri-a1-1', undefined, undefined, 88, 'auto'),
        mkScore('cri-a1-2', undefined, undefined, 85, 'auto'),
      ]),
      mkCat('cat-a2', 'Thái độ', 25, 80, [
        mkScore('cri-a2-1', 4), mkScore('cri-a2-2', 4), mkScore('cri-a2-3', 4),
      ]),
      mkCat('cat-a3', 'Năng lực', 25, 70, [
        mkScore('cri-a3-1', 4), mkScore('cri-a3-2', 3),
      ]),
      mkCat('cat-a4', 'Lỗi vi phạm', 25, 80, []),
    ],
    violation_score: 80, total_score: 80, grade_code: 'fair',
    status: 'self_submitted', self_submitted_at: '2026-02-26T10:00:00Z',
    self_comment: 'Em đã cố gắng cải thiện kỹ năng tháng này.',
    created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-26T10:00:00Z',
  },

  // ── emp-006 (L0, Option A) — Jan 2026: published ──
  {
    id: 'eval-006-01', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-006',
    employee_level: 'L0', option_type: 'A', period: '2026-01',
    category_scores: [
      mkCat('cat-a1', 'Chuyên cần', 25, 95, [
        mkScore('cri-a1-1', undefined, undefined, 96, 'auto'),
        mkScore('cri-a1-2', undefined, undefined, 94, 'auto'),
      ]),
      mkCat('cat-a2', 'Thái độ', 25, 84, [
        mkScore('cri-a2-1', undefined, 5, 5, 'mentor'),
        mkScore('cri-a2-2', undefined, 4, 4, 'manager'),
        mkScore('cri-a2-3', undefined, 3, 3, 'mentor'),
      ]),
      mkCat('cat-a3', 'Năng lực', 25, 68, [
        mkScore('cri-a3-1', undefined, 3, 3, 'mentor'),
        mkScore('cri-a3-2', undefined, 4, 4, 'manager'),
      ]),
      mkCat('cat-a4', 'Lỗi vi phạm', 25, 100, []),
    ],
    violation_score: 100, total_score: 87, grade_code: 'good',
    status: 'published', reviewed_by: 'emp-002', reviewed_at: '2026-01-29T10:00:00Z',
    manager_comment: 'Mai rất chăm chỉ, cần cải thiện kỹ năng pha chế.',
    evaluator_scores: [
      { evaluator_id: 'emp-007', evaluator_role: 'mentor', scores: [
        mkScore('cri-a2-1', undefined, undefined, 5, 'mentor'),
        mkScore('cri-a2-3', undefined, undefined, 3, 'mentor'),
        mkScore('cri-a3-1', undefined, undefined, 3, 'mentor'),
      ], comment: 'Cần luyện tập thêm', submitted_at: '2026-01-28T09:00:00Z' },
    ],
    published_at: '2026-02-01T09:00:00Z', published_by: 'emp-002',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-02-01T09:00:00Z',
  },

  // ── emp-006 (L0) — Feb 2026: draft ──
  {
    id: 'eval-006-02', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-006',
    employee_level: 'L0', option_type: 'A', period: '2026-02',
    category_scores: [
      mkCat('cat-a1', 'Chuyên cần', 25, 90, [
        mkScore('cri-a1-1', undefined, undefined, 91, 'auto'),
        mkScore('cri-a1-2', undefined, undefined, 89, 'auto'),
      ]),
      mkCat('cat-a2', 'Thái độ', 25, 0, []),
      mkCat('cat-a3', 'Năng lực', 25, 0, []),
      mkCat('cat-a4', 'Lỗi vi phạm', 25, 75, []),
    ],
    violation_score: 75, total_score: 0, grade_code: 'poor',
    status: 'draft',
    created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z',
  },

  // ── emp-007 (L1, Option A) — Jan 2026: finalized (was appealed) ──
  {
    id: 'eval-007-01', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-007',
    employee_level: 'L1', option_type: 'A', period: '2026-01',
    category_scores: [
      mkCat('cat-a1', 'Chuyên cần', 25, 82, [
        mkScore('cri-a1-1', undefined, undefined, 85, 'auto'),
        mkScore('cri-a1-2', undefined, undefined, 78, 'auto'),
      ]),
      mkCat('cat-a2', 'Thái độ', 25, 60, [
        mkScore('cri-a2-1', 4, 3, 3, 'manager'),
        mkScore('cri-a2-2', 3, 2, 2, 'manager'),
        mkScore('cri-a2-3', 3, 3, 3, 'manager'),
      ]),
      mkCat('cat-a3', 'Năng lực', 25, 64, [
        mkScore('cri-a3-1', 4, 3, 3, 'manager'),
        mkScore('cri-a3-2', 3, 3, 3, 'manager'),
      ]),
      mkCat('cat-a4', 'Lỗi vi phạm', 25, 70, []),
    ],
    violation_score: 70, total_score: 69, grade_code: 'average',
    status: 'finalized', self_submitted_at: '2026-01-26T14:00:00Z', self_comment: 'Em gặp khó khăn tháng này.',
    reviewed_by: 'emp-002', reviewed_at: '2026-01-29T14:00:00Z',
    manager_comment: 'Khoa cần cải thiện thái độ và đi làm đúng giờ hơn.',
    published_at: '2026-02-01T09:00:00Z', published_by: 'emp-002',
    appeal_reason: 'Em nghĩ điểm thái độ không công bằng, em luôn cố gắng.',
    appeal_at: '2026-02-02T10:00:00Z', appeal_result: 'rejected',
    appeal_reviewed_by: 'emp-001', appeal_reviewed_at: '2026-02-03T09:00:00Z',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-02-03T09:00:00Z',
  },

  // ── emp-007 (L1) — Feb 2026: under_review ──
  {
    id: 'eval-007-02', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-007',
    employee_level: 'L1', option_type: 'A', period: '2026-02',
    category_scores: [
      mkCat('cat-a1', 'Chuyên cần', 25, 80, [
        mkScore('cri-a1-1', undefined, undefined, 82, 'auto'),
        mkScore('cri-a1-2', undefined, undefined, 78, 'auto'),
      ]),
      mkCat('cat-a2', 'Thái độ', 25, 72, [
        mkScore('cri-a2-1', 4, 4, 4, 'manager'),
        mkScore('cri-a2-2', 4, 3, 3, 'manager'),
        mkScore('cri-a2-3', 3, 3, 3, 'manager'),
      ]),
      mkCat('cat-a3', 'Năng lực', 25, 60, [
        mkScore('cri-a3-1', 3, 3, 3, 'manager'),
        mkScore('cri-a3-2', 3, 3, 3, 'manager'),
      ]),
      mkCat('cat-a4', 'Lỗi vi phạm', 25, 75, []),
    ],
    violation_score: 75, total_score: 72, grade_code: 'average',
    status: 'under_review', self_submitted_at: '2026-02-26T14:00:00Z', self_comment: 'Em sẽ cố gắng hơn.',
    reviewed_by: 'emp-002', reviewed_at: '2026-02-28T10:00:00Z',
    manager_comment: 'Có cải thiện so với tháng trước.',
    created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-28T10:00:00Z',
  },

  // ── emp-008 (L1, Option A) — Jan 2026: published ──
  {
    id: 'eval-008-01', org_id: 'org-001', store_id: 'store-002', employee_id: 'emp-008',
    employee_level: 'L1', option_type: 'A', period: '2026-01',
    category_scores: [
      mkCat('cat-a1', 'Chuyên cần', 25, 96, [
        mkScore('cri-a1-1', undefined, undefined, 98, 'auto'),
        mkScore('cri-a1-2', undefined, undefined, 94, 'auto'),
      ]),
      mkCat('cat-a2', 'Thái độ', 25, 88, [
        mkScore('cri-a2-1', 5, 4, 4, 'manager'),
        mkScore('cri-a2-2', 5, 5, 5, 'manager'),
        mkScore('cri-a2-3', 4, 4, 4, 'manager'),
      ]),
      mkCat('cat-a3', 'Năng lực', 25, 84, [
        mkScore('cri-a3-1', 4, 4, 4, 'manager'),
        mkScore('cri-a3-2', 4, 4, 4, 'manager'),
      ]),
      mkCat('cat-a4', 'Lỗi vi phạm', 25, 100, []),
    ],
    violation_score: 100, total_score: 92, grade_code: 'good',
    status: 'published', self_submitted_at: '2026-01-26T10:00:00Z', self_comment: 'Em rất tự tin về tháng này.',
    reviewed_by: 'emp-004', reviewed_at: '2026-01-29T10:00:00Z',
    manager_comment: 'Ngọc làm việc rất tốt, nhiệt tình.',
    published_at: '2026-02-01T09:00:00Z', published_by: 'emp-004',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-02-01T09:00:00Z',
  },

  // ── emp-008 (L1) — Feb 2026: self_submitted ──
  {
    id: 'eval-008-02', org_id: 'org-001', store_id: 'store-002', employee_id: 'emp-008',
    employee_level: 'L1', option_type: 'A', period: '2026-02',
    category_scores: [
      mkCat('cat-a1', 'Chuyên cần', 25, 94, [
        mkScore('cri-a1-1', undefined, undefined, 95, 'auto'),
        mkScore('cri-a1-2', undefined, undefined, 93, 'auto'),
      ]),
      mkCat('cat-a2', 'Thái độ', 25, 84, [
        mkScore('cri-a2-1', 5), mkScore('cri-a2-2', 4), mkScore('cri-a2-3', 4),
      ]),
      mkCat('cat-a3', 'Năng lực', 25, 80, [
        mkScore('cri-a3-1', 4), mkScore('cri-a3-2', 4),
      ]),
      mkCat('cat-a4', 'Lỗi vi phạm', 25, 40, []),
    ],
    violation_score: 40, total_score: 75, grade_code: 'fair',
    status: 'self_submitted', self_submitted_at: '2026-02-26T09:00:00Z',
    self_comment: 'Tháng này em bị trừ nhiều điểm lỗi.',
    created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-26T09:00:00Z',
  },

  // ── emp-009 (L1) — Jan 2026: published (Store 2, high performer) ──
  {
    id: 'eval-009-01', org_id: 'org-001', store_id: 'store-002', employee_id: 'emp-009',
    employee_level: 'L1', option_type: 'A', period: '2026-01',
    category_scores: [
      mkCat('cat-a1', 'Chuyên cần', 25, 98, [
        mkScore('cri-a1-1', undefined, undefined, 100, 'auto'),
        mkScore('cri-a1-2', undefined, undefined, 96, 'auto'),
      ]),
      mkCat('cat-a2', 'Thái độ', 25, 92, [
        mkScore('cri-a2-1', 5, 5, 5, 'manager'),
        mkScore('cri-a2-2', 5, 5, 5, 'manager'),
        mkScore('cri-a2-3', 4, 4, 4, 'manager'),
      ]),
      mkCat('cat-a3', 'Năng lực', 25, 88, [
        mkScore('cri-a3-1', 5, 4, 4, 'manager'),
        mkScore('cri-a3-2', 4, 5, 5, 'manager'),
      ]),
      mkCat('cat-a4', 'Lỗi vi phạm', 25, 100, []),
    ],
    violation_score: 100, total_score: 95, grade_code: 'excellent',
    status: 'published', self_submitted_at: '2026-01-26T09:00:00Z',
    reviewed_by: 'emp-004', reviewed_at: '2026-01-29T09:00:00Z',
    manager_comment: 'Đức là nhân viên xuất sắc nhất cửa hàng.',
    published_at: '2026-02-01T09:00:00Z', published_by: 'emp-004',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-02-01T09:00:00Z',
  },

  // ── emp-009 (L1) — Feb 2026: draft ──
  {
    id: 'eval-009-02', org_id: 'org-001', store_id: 'store-002', employee_id: 'emp-009',
    employee_level: 'L1', option_type: 'A', period: '2026-02',
    category_scores: [
      mkCat('cat-a1', 'Chuyên cần', 25, 97, [
        mkScore('cri-a1-1', undefined, undefined, 98, 'auto'),
        mkScore('cri-a1-2', undefined, undefined, 96, 'auto'),
      ]),
      mkCat('cat-a2', 'Thái độ', 25, 0, []),
      mkCat('cat-a3', 'Năng lực', 25, 0, []),
      mkCat('cat-a4', 'Lỗi vi phạm', 25, 100, []),
    ],
    violation_score: 100, total_score: 0, grade_code: 'poor',
    status: 'draft',
    created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-01T00:00:00Z',
  },
  // ── emp-004 (L3, Option B) — Jan 2026: published ──
  {
    id: 'eval-004-01', org_id: 'org-001', store_id: 'store-003', employee_id: 'emp-004',
    employee_level: 'L3', option_type: 'B', period: '2026-01',
    category_scores: [
      mkCat('cat-b1', 'Chuyên cần', 20, 95, [
        mkScore('cri-b1-1', undefined, undefined, 95, 'auto'),
        mkScore('cri-b1-2', undefined, undefined, 92, 'auto'),
      ]),
      mkCat('cat-b2', 'Thái độ', 20, 88, [
        mkScore('cri-b2-1', 4, 5, 5, 'manager'),
        mkScore('cri-b2-2', 4, 4, 4, 'manager'),
      ]),
      mkCat('cat-b3', 'Năng lực', 25, 82, [
        mkScore('cri-b3-1', 4, 4, 4, 'manager'),
        mkScore('cri-b3-2', 3, 4, 4, 'manager'),
        mkScore('cri-b3-3', undefined, undefined, 130, 'auto'),
      ]),
      mkCat('cat-b4', 'Hỗ trợ & Đào tạo', 15, 90, [
        mkScore('cri-b4-1', 5, 5, 5, 'manager'),
        mkScore('cri-b4-2', 4, 4, 4, 'manager'),
      ]),
      mkCat('cat-b5', 'Lỗi vi phạm', 20, 85, []),
    ],
    violation_score: 85, total_score: 88, grade_code: 'good',
    status: 'published',
    self_submitted_at: '2026-01-16T10:00:00Z',
    reviewed_by: 'emp-001', reviewed_at: '2026-01-22T14:00:00Z',
    published_at: '2026-01-26T09:00:00Z', published_by: 'emp-001',
    manager_comment: 'Trưởng ca làm tốt, hỗ trợ đào tạo nhân viên mới hiệu quả.',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-26T09:00:00Z',
  },
  // ── emp-004 (L3, Option B) — Feb 2026: self_submitted ──
  {
    id: 'eval-004-02', org_id: 'org-001', store_id: 'store-003', employee_id: 'emp-004',
    employee_level: 'L3', option_type: 'B', period: '2026-02',
    category_scores: [
      mkCat('cat-b1', 'Chuyên cần', 20, 90, [
        mkScore('cri-b1-1', undefined, undefined, 90, 'auto'),
        mkScore('cri-b1-2', undefined, undefined, 88, 'auto'),
      ]),
      mkCat('cat-b2', 'Thái độ', 20, 80, [
        mkScore('cri-b2-1', 4, undefined, 4, 'self'),
        mkScore('cri-b2-2', 4, undefined, 4, 'self'),
      ]),
      mkCat('cat-b3', 'Năng lực', 25, 76, [
        mkScore('cri-b3-1', 4, undefined, 4, 'self'),
        mkScore('cri-b3-2', 3, undefined, 3, 'self'),
        mkScore('cri-b3-3', undefined, undefined, 125, 'auto'),
      ]),
      mkCat('cat-b4', 'Hỗ trợ & Đào tạo', 15, 80, [
        mkScore('cri-b4-1', 4, undefined, 4, 'self'),
        mkScore('cri-b4-2', 4, undefined, 4, 'self'),
      ]),
      mkCat('cat-b5', 'Lỗi vi phạm', 20, 100, []),
    ],
    violation_score: 100, total_score: 84, grade_code: 'good',
    status: 'self_submitted',
    self_submitted_at: '2026-02-16T09:00:00Z', self_comment: 'Tháng này team ổn định, tập trung đào tạo NV mới.',
    created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-16T09:00:00Z',
  },
  // ── emp-002 (L4, Option C) — Jan 2026: published ──
  {
    id: 'eval-002-01', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-002',
    employee_level: 'L4', option_type: 'C', period: '2026-01',
    category_scores: [
      mkCat('cat-c1', 'Chuyên cần', 10, 98, [
        mkScore('cri-c1-1', undefined, undefined, 98, 'auto'),
      ]),
      mkCat('cat-c2', 'Quản lý', 35, 85, [
        mkScore('cri-c2-1', 4, 4, 4, 'manager'),
        mkScore('cri-c2-2', 4, 5, 5, 'manager'),
        mkScore('cri-c2-3', 4, 4, 4, 'manager'),
      ]),
      mkCat('cat-c3', 'Kết quả team', 35, 90, [
        mkScore('cri-c3-1', undefined, undefined, 110, 'auto'),
        mkScore('cri-c3-2', undefined, undefined, 82, 'auto'),
        mkScore('cri-c3-3', undefined, undefined, 3, 'auto'),
      ]),
      mkCat('cat-c4', 'Lỗi vi phạm', 20, 90, []),
    ],
    violation_score: 90, total_score: 89, grade_code: 'good',
    status: 'published',
    self_submitted_at: '2026-01-15T08:00:00Z',
    reviewed_by: 'emp-001', reviewed_at: '2026-01-21T15:00:00Z',
    published_at: '2026-01-25T10:00:00Z', published_by: 'emp-001',
    manager_comment: 'Quản lý store tốt, team đạt target doanh số. Cần cải thiện tỷ lệ nghỉ việc.',
    created_at: '2026-01-01T00:00:00Z', updated_at: '2026-01-25T10:00:00Z',
  },
  // ── emp-002 (L4, Option C) — Feb 2026: self_submitted ──
  {
    id: 'eval-002-02', org_id: 'org-001', store_id: 'store-001', employee_id: 'emp-002',
    employee_level: 'L4', option_type: 'C', period: '2026-02',
    category_scores: [
      mkCat('cat-c1', 'Chuyên cần', 10, 96, [
        mkScore('cri-c1-1', undefined, undefined, 96, 'auto'),
      ]),
      mkCat('cat-c2', 'Quản lý', 35, 80, [
        mkScore('cri-c2-1', 4, undefined, 4, 'self'),
        mkScore('cri-c2-2', 4, undefined, 4, 'self'),
        mkScore('cri-c2-3', 3, undefined, 3, 'self'),
      ]),
      mkCat('cat-c3', 'Kết quả team', 35, 85, [
        mkScore('cri-c3-1', undefined, undefined, 105, 'auto'),
        mkScore('cri-c3-2', undefined, undefined, 80, 'auto'),
        mkScore('cri-c3-3', undefined, undefined, 4, 'auto'),
      ]),
      mkCat('cat-c4', 'Lỗi vi phạm', 20, 95, []),
    ],
    violation_score: 95, total_score: 86, grade_code: 'good',
    status: 'self_submitted',
    self_submitted_at: '2026-02-15T08:30:00Z', self_comment: 'Doanh số store vẫn ổn, cần tuyển thêm 1 NV thay cho NV nghỉ.',
    created_at: '2026-02-01T00:00:00Z', updated_at: '2026-02-15T08:30:00Z',
  },
]

// ══════════════════════════════════════
// 10. PROMOTION REVIEWS — 2
// ══════════════════════════════════════

export const mockPromotionReviews: PromotionReview[] = [
  {
    id: 'promo-001', employee_id: 'emp-009', current_level: 'L1', target_level: 'L2',
    review_period: '2025-09 to 2026-02',
    evaluations: ['eval-009-01'],
    average_score: 95, lowest_score: 95, violation_count: 0, critical_violations: 0,
    eligible: true, eligibility_reasons: ['KPI trung bình 95 ≥ 75', 'Không có lỗi nghiêm trọng', 'Đủ thời gian'],
    status: 'pending',
  },
  {
    id: 'promo-002', employee_id: 'emp-005', current_level: 'L1', target_level: 'L2',
    review_period: '2025-09 to 2026-02',
    evaluations: ['eval-005-01'],
    average_score: 84, lowest_score: 84, violation_count: 3, critical_violations: 0,
    eligible: true, eligibility_reasons: ['KPI trung bình 84 ≥ 75', 'Không có lỗi nghiêm trọng'],
    status: 'pending',
  },
]

// ══════════════════════════════════════
// EVALUATION HELPER FUNCTIONS
// ══════════════════════════════════════

export function getEvaluationsByEmployeeMock(employeeId: string): KPIEvaluation[] {
  return mockEvaluations.filter(e => e.employee_id === employeeId)
}

export function getPublishedEvaluation(employeeId: string, period: string): KPIEvaluation | undefined {
  return mockEvaluations.find(
    e => e.employee_id === employeeId && e.period === period &&
    ['published', 'finalized'].includes(e.status),
  )
}

export function getCurrentPeriod(): string {
  return '2026-02'
}

export function getPreviousPeriodsHelper(count: number): string[] {
  const base = [2026, 2]
  const periods: string[] = []
  for (let i = 0; i < count; i++) {
    let y = base[0], m = base[1] - i
    while (m <= 0) { m += 12; y-- }
    periods.push(`${y}-${String(m).padStart(2, '0')}`)
  }
  return periods
}

