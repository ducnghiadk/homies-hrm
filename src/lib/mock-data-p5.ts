// ============================================
// HRM Trà Sữa — Phase 4i (Intelligence) + Phase 5 Mock Data
// Learning, Onboarding, Staffing, Analytics, Admin Config
// ============================================

export function formatVND(n: number) {
  if (n >= 1000000) return `${(n/1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n/1000).toFixed(0)}K`
  return n.toLocaleString()
}

// ========== LEARNING & DEVELOPMENT ==========

export type CourseCategory = 'operations' | 'service' | 'safety' | 'management' | 'product'

export const COURSE_CATEGORIES = [
  { key: 'operations' as CourseCategory, label: '⚙️ Vận hành', color: '#3b82f6' },
  { key: 'service' as CourseCategory, label: '🤝 Dịch vụ KH', color: '#22c55e' },
  { key: 'safety' as CourseCategory, label: '🛡️ An toàn', color: '#ef4444' },
  { key: 'management' as CourseCategory, label: '📊 Quản lý', color: '#8b5cf6' },
  { key: 'product' as CourseCategory, label: '🧋 Sản phẩm', color: '#f59e0b' },
]

export const mockCourses = [
  { id: 'course-001', title: 'Quy trình pha chế cơ bản', category: 'product' as CourseCategory, modules: 8, duration: 120, required: true, positions: ['pos-001'], thumbnail: '🧋', enrolled: 12, completed_rate: 85, quiz_pass_rate: 92 },
  { id: 'course-002', title: 'Vệ sinh an toàn thực phẩm', category: 'safety' as CourseCategory, modules: 5, duration: 60, required: true, positions: ['all'], thumbnail: '🧤', enrolled: 15, completed_rate: 100, quiz_pass_rate: 88 },
  { id: 'course-003', title: 'Kỹ năng phục vụ khách hàng', category: 'service' as CourseCategory, modules: 6, duration: 90, required: true, positions: ['pos-002', 'pos-003'], thumbnail: '😊', enrolled: 8, completed_rate: 62, quiz_pass_rate: 78 },
  { id: 'course-004', title: 'Quản lý ca làm việc', category: 'management' as CourseCategory, modules: 4, duration: 45, required: false, positions: ['pos-004', 'pos-005'], thumbnail: '📋', enrolled: 4, completed_rate: 75, quiz_pass_rate: 100 },
  { id: 'course-005', title: 'Công thức đồ uống mới T2/2026', category: 'product' as CourseCategory, modules: 3, duration: 30, required: false, positions: ['pos-001'], thumbnail: '🆕', enrolled: 6, completed_rate: 33, quiz_pass_rate: 50 },
  { id: 'course-006', title: 'Phòng cháy chữa cháy', category: 'safety' as CourseCategory, modules: 4, duration: 40, required: true, positions: ['all'], thumbnail: '🧯', enrolled: 14, completed_rate: 70, quiz_pass_rate: 95 },
]

export const mockMyEnrollments = [
  { course_id: 'course-001', progress: 100, status: 'completed' as const, quiz_score: 95, completed_at: '2025-08-15', certificate_id: 'cert-001' },
  { course_id: 'course-002', progress: 100, status: 'completed' as const, quiz_score: 88, completed_at: '2025-07-10', certificate_id: 'cert-002' },
  { course_id: 'course-003', progress: 67, status: 'in_progress' as const, quiz_score: null, completed_at: null, certificate_id: null },
  { course_id: 'course-005', progress: 33, status: 'in_progress' as const, quiz_score: null, completed_at: null, certificate_id: null },
  { course_id: 'course-006', progress: 0, status: 'enrolled' as const, quiz_score: null, completed_at: null, certificate_id: null },
]

export const mockCertificates = [
  { id: 'cert-001', course_title: 'Quy trình pha chế cơ bản', number: 'CERT-BH-2025-001', issued_at: '2025-08-15', emoji: '🧋' },
  { id: 'cert-002', course_title: 'Vệ sinh an toàn thực phẩm', number: 'CERT-BH-2025-002', issued_at: '2025-07-10', emoji: '🧤' },
]

export const mockSkillMatrix = [
  { skill: 'Pha chế', level: 4, max: 5 },
  { skill: 'Dịch vụ KH', level: 3, max: 5 },
  { skill: 'Vệ sinh ATTP', level: 5, max: 5 },
  { skill: 'Quản lý kho', level: 2, max: 5 },
  { skill: 'Teamwork', level: 4, max: 5 },
  { skill: 'Sáng tạo', level: 3, max: 5 },
]

// ========== ONBOARDING ==========

export type OnboardingPhase = 'day1' | 'week1' | 'month1' | 'month2'

export const ONBOARDING_PHASES = [
  { key: 'day1' as OnboardingPhase, label: '📅 Ngày 1', color: '#3b82f6', target: 'Ngày đầu' },
  { key: 'week1' as OnboardingPhase, label: '📆 Tuần 1', color: '#22c55e', target: '7 ngày' },
  { key: 'month1' as OnboardingPhase, label: '📋 Tháng 1', color: '#f59e0b', target: '30 ngày' },
  { key: 'month2' as OnboardingPhase, label: '✅ Tháng 2', color: '#8b5cf6', target: '60 ngày' },
]

export const mockOnboardingTasks = [
  // Day 1
  { id: 'ob-001', phase: 'day1' as OnboardingPhase, title: 'Nhận đồng phục & thẻ nhân viên', done: true },
  { id: 'ob-002', phase: 'day1' as OnboardingPhase, title: 'Tour cửa hàng & giới thiệu đội nhóm', done: true },
  { id: 'ob-003', phase: 'day1' as OnboardingPhase, title: 'Cài đặt app HRM & check-in thử', done: true },
  { id: 'ob-004', phase: 'day1' as OnboardingPhase, title: 'Đọc nội quy công ty', done: true },
  // Week 1
  { id: 'ob-005', phase: 'week1' as OnboardingPhase, title: 'Hoàn thành khóa "Vệ sinh ATTP"', done: true },
  { id: 'ob-006', phase: 'week1' as OnboardingPhase, title: 'Thực hành pha chế 5 món cơ bản', done: true },
  { id: 'ob-007', phase: 'week1' as OnboardingPhase, title: 'Quan sát thu ngân 2 ca', done: false },
  { id: 'ob-008', phase: 'week1' as OnboardingPhase, title: 'Nộp CMND/CCCD bản photo', done: true },
  // Month 1
  { id: 'ob-009', phase: 'month1' as OnboardingPhase, title: 'Hoàn thành khóa "Pha chế cơ bản"', done: false },
  { id: 'ob-010', phase: 'month1' as OnboardingPhase, title: 'Tự pha chế 15 món không cần hướng dẫn', done: false },
  { id: 'ob-011', phase: 'month1' as OnboardingPhase, title: 'Đánh giá giữa kỳ thử việc', done: false },
  { id: 'ob-012', phase: 'month1' as OnboardingPhase, title: 'Feedback 360° từ mentor + QL', done: false },
  // Month 2
  { id: 'ob-013', phase: 'month2' as OnboardingPhase, title: 'Đạt quiz pha chế nâng cao ≥80%', done: false },
  { id: 'ob-014', phase: 'month2' as OnboardingPhase, title: 'KPI tháng đầu ≥70%', done: false },
  { id: 'ob-015', phase: 'month2' as OnboardingPhase, title: 'Đánh giá cuối thử việc', done: false },
  { id: 'ob-016', phase: 'month2' as OnboardingPhase, title: 'Ký HĐLĐ chính thức (nếu đạt)', done: false },
]

export const mockOnboardingInfo = {
  employee_name: 'Đặng Minh Khoa',
  position: 'Phục vụ',
  store: 'Boba House - Nguyễn Huệ',
  start_date: '2025-12-01',
  mentor: { name: 'Võ Thanh Bình', role: 'Pha chế Senior', avatar: 'VB' },
  probation_end: '2026-02-01',
}

// ========== SMART STAFFING ==========

export const mockStaffingForecast = [
  { date: '2026-02-17', day: 'Thứ 2', demand: 4, scheduled: 3, gap: -1, reason: 'Thiếu 1 ca chiều' },
  { date: '2026-02-18', day: 'Thứ 3', demand: 4, scheduled: 4, gap: 0, reason: null },
  { date: '2026-02-19', day: 'Thứ 4', demand: 5, scheduled: 4, gap: -1, reason: 'Ngày sale → tăng demand' },
  { date: '2026-02-20', day: 'Thứ 5', demand: 4, scheduled: 5, gap: 1, reason: 'Dư 1 người → cắt OT' },
  { date: '2026-02-21', day: 'Thứ 6', demand: 6, scheduled: 4, gap: -2, reason: 'Peak cuối tuần' },
  { date: '2026-02-22', day: 'Thứ 7', demand: 7, scheduled: 5, gap: -2, reason: 'Peak cuối tuần' },
  { date: '2026-02-23', day: 'CN', demand: 6, scheduled: 4, gap: -2, reason: 'Peak cuối tuần' },
]

export const mockStaffingAlerts = [
  { id: 'alert-001', type: 'under' as const, severity: 'high' as const, message: 'Thứ 7 thiếu 2 người tại Nguyễn Huệ', store: 'Boba House - Nguyễn Huệ', date: '2026-02-22' },
  { id: 'alert-002', type: 'under' as const, severity: 'high' as const, message: 'CN thiếu 2 người tại Phạm Văn Đồng', store: 'Boba House - Phạm Văn Đồng', date: '2026-02-23' },
  { id: 'alert-003', type: 'over' as const, severity: 'low' as const, message: 'Thứ 5 dư 1 người tại Lê Văn Sỹ', store: 'Boba House - Lê Văn Sỹ', date: '2026-02-20' },
  { id: 'alert-004', type: 'event' as const, severity: 'medium' as const, message: 'Valentine trùng Thứ 6 → dự báo khách tăng 40%', store: 'Tất cả', date: '2026-02-14' },
]

export const mockLaborOptimization = {
  current_cost: 95000000,
  optimized_cost: 88000000,
  savings: 7000000,
  suggestions: [
    { action: 'Giảm 1 NV ca chiều Thứ 5 tại Q.7', save: 2500000, risk: 'low' },
    { action: 'Chuyển Khoa từ Q.1 sang Q.3 cuối tuần', save: 0, risk: 'none' },
    { action: 'Thuê thêm 1 part-time cuối tuần Q.1', save: -1500000, risk: 'Giải quyết thiếu người' },
    { action: 'Cắt OT Thứ 5 tại Lê Văn Sỹ', save: 3000000, risk: 'low' },
  ]
}

export const mockTurnoverData = [
  { month: '2025-09', hired: 2, resigned: 1, total: 13, rate: 7.7 },
  { month: '2025-10', hired: 1, resigned: 0, total: 14, rate: 0 },
  { month: '2025-11', hired: 0, resigned: 1, total: 13, rate: 7.7 },
  { month: '2025-12', hired: 2, resigned: 0, total: 15, rate: 0 },
  { month: '2026-01', hired: 0, resigned: 1, total: 14, rate: 7.1 },
  { month: '2026-02', hired: 1, resigned: 0, total: 15, rate: 0 },
]

// ========== ANALYTICS ===========

export const mockEngagementScores = [
  { month: '2025-09', score: 72 },
  { month: '2025-10', score: 75 },
  { month: '2025-11', score: 71 },
  { month: '2025-12', score: 80 },
  { month: '2026-01', score: 78 },
  { month: '2026-02', score: 82 },
]

export const mockHRMetrics = {
  total_employees: 14,
  active: 13,
  probation: 1,
  avg_tenure_months: 10.5,
  avg_age: 23.2,
  gender_ratio: { male: 8, female: 6 },
  avg_kpi: 78.5,
  avg_360: 3.8,
  training_completion: 76,
  avg_mood: 3.6,
  turnover_rate_ytd: 14.3,
}

// ========== ADMIN CONFIG ===========

export type ConfigCategory = 'org' | 'employees' | 'attendance' | 'scheduling' | 'kpi' | 'rewards' | 'evaluation' | 'career' | 'gamification' | 'communication' | 'learning' | 'notifications' | 'security' | 'system'

export const CONFIG_CATEGORIES = [
  { key: 'org' as ConfigCategory, label: '🏢 Tổ chức', desc: 'Thông tin công ty, cửa hàng, GPS' },
  { key: 'employees' as ConfigCategory, label: '👥 Nhân viên', desc: 'Chức vụ, bậc lương, trường tùy chỉnh' },
  { key: 'attendance' as ConfigCategory, label: '⏰ Chấm công', desc: 'Ca làm, quy tắc check-in, OT' },
  { key: 'scheduling' as ConfigCategory, label: '📅 Lịch làm', desc: 'Template ca, đổi ca, staffing tối thiểu' },
  { key: 'kpi' as ConfigCategory, label: '📊 KPI/BSC', desc: 'Template KPI, chỉ số, trọng số' },
  { key: 'rewards' as ConfigCategory, label: '💰 Thưởng/Phạt', desc: 'Quy tắc, điểm, quy trình duyệt' },
  { key: 'evaluation' as ConfigCategory, label: '📋 360° Eval', desc: 'Chu kỳ, bảng hỏi, ẩn danh' },
  { key: 'career' as ConfigCategory, label: '🚀 Career Path', desc: 'Lộ trình, tiêu chí thăng tiến' },
  { key: 'gamification' as ConfigCategory, label: '🎮 Gamification', desc: 'Điểm, huy hiệu, rewards shop' },
  { key: 'communication' as ConfigCategory, label: '💬 Giao tiếp', desc: 'Chat, thông báo, template' },
  { key: 'learning' as ConfigCategory, label: '📚 Học tập', desc: 'Danh mục, khóa bắt buộc, quiz' },
  { key: 'notifications' as ConfigCategory, label: '🔔 Thông báo', desc: 'Push/Email/Zalo, lịch gửi' },
  { key: 'security' as ConfigCategory, label: '🔒 Bảo mật', desc: 'Roles, permissions, password' },
  { key: 'system' as ConfigCategory, label: '⚙️ Hệ thống', desc: 'Ngôn ngữ, timezone, branding' },
]

export const mockAuditLogs = [
  { id: 'log-001', user: 'Nguyễn Minh Tuấn', action: 'Cập nhật', table: 'Cài đặt chấm công', detail: 'late_threshold: 15 → 10 phút', time: '2026-02-15 10:30' },
  { id: 'log-002', user: 'Nguyễn Minh Tuấn', action: 'Thêm mới', table: 'Quy tắc thưởng', detail: 'KPI A → +500K', time: '2026-02-14 14:20' },
  { id: 'log-003', user: 'Trần Thị Lan', action: 'Sửa', table: 'Ca làm việc', detail: 'Ca Sáng: 08:00→07:30', time: '2026-02-14 09:15' },
  { id: 'log-004', user: 'Nguyễn Minh Tuấn', action: 'Xóa', table: 'Badge', detail: 'Badge "Người hùng Q4"', time: '2026-02-13 16:45' },
  { id: 'log-005', user: 'Lê Hoàng Nam', action: 'Cập nhật', table: 'Nhân viên', detail: 'emp-007 status: probation → active', time: '2026-02-12 11:00' },
  { id: 'log-006', user: 'Nguyễn Minh Tuấn', action: 'Import', table: 'Cài đặt', detail: 'Import config từ file JSON', time: '2026-02-10 08:30' },
]
