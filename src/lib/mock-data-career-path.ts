// ============================================================
// CAREER PATH MODULE — Mock Data
// Genesis v3 | T1.1.2
// ============================================================

import type {
  CareerLevel, Skill, SkillLevelConfig, EmployeeTypeConfig,
  PromotionCondition, BuddyRewardConfig, TrialChecklistItem,
  OnboardingStep, EmployeeSkill, BuddyAssignment, TrialEvaluation,
  PromotionRequest, TypeChangeRequest, CareerGoal, SkillEndorsement,
  SkillRefreshRecord, CrossTrainingRecord, CareerNotification,
  SettingsChangeLog, CareerPathTemplate, CareerPathSettings,
  LeaderboardEntry, CareerAnalytics, Achievement,
  OnboardingCompetencyGroup, OnboardingChecklistTemplate,
  OnboardingChecklistStage, OnboardingChecklistItemTemplate,
  EmployeeOnboardingChecklistPlan, EmployeeOnboardingChecklistProgressItem, OnboardingOutputItemDefinition,
} from './career-path-types';

// ─── Default Levels ──────────────────────────────────────────

export const defaultCareerLevels: CareerLevel[] = [
  {
    id: 'level-trial', name: 'Thử việc', icon: '🌱', order: 0,
    description: 'Nhân viên mới, đang trong giai đoạn thử việc',
    color: '#8BC34A', is_active: true, min_skills_required: 0, min_months: 0,
    benefits: ['Được hướng dẫn bởi Buddy', 'Lộ trình onboarding rõ ràng'],
    created_at: '2026-01-01', updated_at: '2026-01-01',
  },
  {
    id: 'level-staff', name: 'Nhân viên', icon: '☕', order: 1,
    description: 'Nhân viên chính thức, có thể làm ca độc lập',
    color: '#2196F3', is_active: true, min_skills_required: 2, min_months: 1,
    benefits: ['Mở khóa kỹ năng nâng cao', 'Tham gia Leaderboard', 'Đặt mục tiêu cá nhân'],
    created_at: '2026-01-01', updated_at: '2026-01-01',
  },
  {
    id: 'level-leader', name: 'Trợ lý Quản lý', icon: '⭐', order: 2,
    description: 'Hỗ trợ quản lý, có thể training nhân viên mới',
    color: '#FF9800', is_active: false, min_skills_required: 5, min_months: 4,
    benefits: ['Được làm Buddy/Mentor', 'Ưu tiên chọn ca', 'Kỹ năng quản lý'],
    created_at: '2026-01-01', updated_at: '2026-01-01',
  },
  {
    id: 'level-manager', name: 'Quản lý', icon: '👔', order: 3,
    description: 'Quản lý chi nhánh, toàn quyền vận hành',
    color: '#9C27B0', is_active: true, min_skills_required: 8, min_months: 6,
    benefits: ['Quản lý chi nhánh', 'Duyệt thăng tiến', 'Truy cập báo cáo'],
    created_at: '2026-01-01', updated_at: '2026-01-01',
  },
];

// ─── Default Skills (18) ─────────────────────────────────────

export const defaultSkills: Skill[] = [
  // === BASIC (4) ===
  { id: 'skill-brewing', name: 'Pha chế cơ bản', icon: '☕', category: 'basic', description: 'Pha chế các loại trà sữa theo menu',
    unlock_conditions: [{ type: 'months_worked', value: 0, label: 'Ngay khi vào' }],
    is_active: true, requires_approval: false, order: 1, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-cashier', name: 'Thu ngân', icon: '💰', category: 'basic', description: 'Sử dụng POS, tính tiền, xử lý thanh toán',
    unlock_conditions: [{ type: 'months_worked', value: 0, label: 'Ngay khi vào' }],
    is_active: true, requires_approval: false, order: 2, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-open', name: 'Mở ca', icon: '🔓', category: 'basic', description: 'Quy trình mở quán: kiểm tra, setup, chuẩn bị',
    unlock_conditions: [{ type: 'months_worked', value: 1, label: '≥ 1 tháng' }, { type: 'kpi_min', value: 70, label: 'KPI ≥ 70%' }],
    is_active: true, requires_approval: false, order: 3, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-close', name: 'Đóng ca', icon: '🔒', category: 'basic', description: 'Quy trình đóng quán: vệ sinh, kiểm kê, nộp tiền',
    unlock_conditions: [{ type: 'months_worked', value: 1, label: '≥ 1 tháng' }, { type: 'kpi_min', value: 70, label: 'KPI ≥ 70%' }],
    is_active: true, requires_approval: false, order: 4, created_at: '2026-01-01', updated_at: '2026-01-01' },
  // === ADVANCED (8) ===
  { id: 'skill-inventory', name: 'Nhập hàng', icon: '📦', category: 'advanced', description: 'Kiểm tra, nhận, phân loại nguyên liệu đầu vào',
    unlock_conditions: [{ type: 'months_worked', value: 3, label: '≥ 3 tháng' }, { type: 'kpi_min', value: 80, label: 'KPI ≥ 80%' }, { type: 'approval', value: 'manager', label: 'Leader phê duyệt' }],
    is_active: true, requires_approval: true, order: 5, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-quality', name: 'Kiểm soát CL', icon: '✅', category: 'advanced', description: 'Kiểm tra chất lượng đồ uống, nguyên liệu',
    unlock_conditions: [{ type: 'months_worked', value: 2, label: '≥ 2 tháng' }, { type: 'skills_required', value: ['skill-brewing'], label: 'Có Pha chế cơ bản' }],
    is_active: true, requires_approval: false, order: 6, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-hygiene', name: 'Vệ sinh ATTP', icon: '🧹', category: 'advanced', description: 'An toàn thực phẩm, vệ sinh chuẩn HACCP',
    unlock_conditions: [{ type: 'months_worked', value: 2, label: '≥ 2 tháng' }],
    is_active: true, requires_approval: false, order: 7, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-customer', name: 'Xử lý khiếu nại', icon: '🤝', category: 'advanced', description: 'Giải quyết phàn nàn, hoàn tiền, xử lý tình huống',
    unlock_conditions: [{ type: 'months_worked', value: 3, label: '≥ 3 tháng' }, { type: 'kpi_min', value: 75, label: 'KPI ≥ 75%' }],
    is_active: true, requires_approval: false, order: 8, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-equipment', name: 'Bảo trì thiết bị', icon: '🔧', category: 'advanced', description: 'Vận hành, vệ sinh, bảo trì máy pha',
    unlock_conditions: [{ type: 'months_worked', value: 3, label: '≥ 3 tháng' }],
    is_active: true, requires_approval: false, order: 9, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-menu-dev', name: 'Phát triển menu', icon: '📝', category: 'advanced', description: 'Đề xuất, thử nghiệm, cải tiến công thức',
    unlock_conditions: [{ type: 'months_worked', value: 4, label: '≥ 4 tháng' }, { type: 'skills_required', value: ['skill-brewing', 'skill-quality'], label: 'Có Pha chế + Kiểm soát CL' }],
    is_active: true, requires_approval: true, order: 10, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-social', name: 'Marketing cửa hàng', icon: '📱', category: 'advanced', description: 'Chụp ảnh, đăng social media, tương tác KH online',
    unlock_conditions: [{ type: 'months_worked', value: 2, label: '≥ 2 tháng' }],
    is_active: true, requires_approval: false, order: 11, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-delivery', name: 'Quản lý đơn online', icon: '🛵', category: 'advanced', description: 'GrabFood, ShopeeFood, BeFood, xử lý đơn',
    unlock_conditions: [{ type: 'months_worked', value: 1, label: '≥ 1 tháng' }, { type: 'skills_required', value: ['skill-cashier'], label: 'Có Thu ngân' }],
    is_active: true, requires_approval: false, order: 12, created_at: '2026-01-01', updated_at: '2026-01-01' },
  // === MANAGEMENT (6) ===
  { id: 'skill-training', name: 'Training cơ bản', icon: '🎓', category: 'management', description: 'Hướng dẫn NV mới các kỹ năng cơ bản',
    unlock_conditions: [{ type: 'months_worked', value: 4, label: '≥ 4 tháng' }, { type: 'skills_required', value: ['skill-open', 'skill-close'], label: 'Có Mở ca + Đóng ca' }, { type: 'kpi_min', value: 85, label: 'KPI ≥ 85%' }],
    is_active: true, requires_approval: true, order: 13, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-scheduling', name: 'Xếp lịch', icon: '📅', category: 'management', description: 'Lên lịch ca, phân công nhân viên',
    unlock_conditions: [{ type: 'level_required', value: 'level-leader', label: 'Cấp Trợ lý QL' }],
    is_active: true, requires_approval: true, order: 14, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-reporting', name: 'Báo cáo', icon: '📊', category: 'management', description: 'Tổng hợp doanh thu, tồn kho, hiệu suất',
    unlock_conditions: [{ type: 'level_required', value: 'level-leader', label: 'Cấp Trợ lý QL' }],
    is_active: true, requires_approval: true, order: 15, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-hr', name: 'Quản lý nhân sự', icon: '👥', category: 'management', description: 'Tuyển dụng, đánh giá, kỷ luật nhân viên',
    unlock_conditions: [{ type: 'level_required', value: 'level-manager', label: 'Cấp Quản lý' }],
    is_active: true, requires_approval: true, order: 16, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-finance', name: 'Quản lý tài chính', icon: '💵', category: 'management', description: 'Chi phí, lợi nhuận, ngân sách chi nhánh',
    unlock_conditions: [{ type: 'level_required', value: 'level-manager', label: 'Cấp Quản lý' }],
    is_active: true, requires_approval: true, order: 17, created_at: '2026-01-01', updated_at: '2026-01-01' },
  { id: 'skill-expansion', name: 'Mở rộng chi nhánh', icon: '🏪', category: 'management', description: 'Khảo sát, setup, vận hành chi nhánh mới',
    unlock_conditions: [{ type: 'level_required', value: 'level-manager', label: 'Cấp Quản lý' }, { type: 'months_worked', value: 12, label: '≥ 12 tháng' }],
    is_active: true, requires_approval: true, order: 18, created_at: '2026-01-01', updated_at: '2026-01-01' },
];

// ─── Skill Level Config ──────────────────────────────────────

export const defaultSkillLevels: SkillLevelConfig[] = [
  { level: 1, label: 'Cơ bản', icon: '⭐', min_advanced_skills: 0, color: '#8BC34A', description: '0-2 kỹ năng nâng cao' },
  { level: 2, label: 'Thành thạo', icon: '⭐⭐', min_advanced_skills: 3, color: '#FF9800', description: '3-5 kỹ năng nâng cao' },
  { level: 3, label: 'Chuyên gia', icon: '⭐⭐⭐', min_advanced_skills: 6, color: '#E91E63', description: '6+ kỹ năng nâng cao' },
];

// ─── Employee Type Config ────────────────────────────────────

export const defaultEmployeeTypes: EmployeeTypeConfig[] = [
  { id: 'etype-ft', type: 'full_time', label: 'Toàn thời gian', max_skill_level: 3, max_career_level_order: 3,
    can_be_buddy: true, description: 'Không giới hạn thăng tiến', restrictions: [] },
  { id: 'etype-pt', type: 'part_time', label: 'Bán thời gian', max_skill_level: 2, max_career_level_order: 1,
    can_be_buddy: false, description: 'Giới hạn Skill Level 2, tối đa Nhân viên', restrictions: ['Không thể làm Buddy', 'Không thể lên Trợ lý QL+', 'Tối đa Skill Level 2'] },
];

// ─── Promotion Conditions ────────────────────────────────────

export const defaultPromotionConditions: PromotionCondition[] = [
  {
    id: 'promo-trial-staff', from_level_id: 'level-trial', to_level_id: 'level-staff', is_active: true, created_at: '2026-01-01',
    conditions: [
      { type: 'months_at_level', operator: '>=', value: 1, label: 'Thử việc ≥ 1 tháng' },
      { type: 'kpi_avg', operator: '>=', value: 70, label: 'KPI trung bình ≥ 70%' },
      { type: 'skills_count', operator: '>=', value: 2, label: 'Mở khóa ≥ 2 kỹ năng cơ bản' },
    ],
  },
  {
    id: 'promo-staff-leader', from_level_id: 'level-staff', to_level_id: 'level-leader', is_active: true, created_at: '2026-01-01',
    conditions: [
      { type: 'months_at_level', operator: '>=', value: 4, label: 'Nhân viên ≥ 4 tháng' },
      { type: 'kpi_avg', operator: '>=', value: 85, label: 'KPI trung bình ≥ 85%' },
      { type: 'skills_count', operator: '>=', value: 5, label: 'Mở khóa ≥ 5 kỹ năng' },
      { type: 'buddy_count', operator: '>=', value: 1, label: 'Đã train ≥ 1 người' },
    ],
  },
  {
    id: 'promo-leader-manager', from_level_id: 'level-leader', to_level_id: 'level-manager', is_active: true, created_at: '2026-01-01',
    conditions: [
      { type: 'months_at_level', operator: '>=', value: 6, label: 'Trợ lý QL ≥ 6 tháng' },
      { type: 'kpi_avg', operator: '>=', value: 90, label: 'KPI trung bình ≥ 90%' },
      { type: 'skills_count', operator: '>=', value: 8, label: 'Mở khóa ≥ 8 kỹ năng' },
      { type: 'buddy_count', operator: '>=', value: 3, label: 'Đã train ≥ 3 người' },
      { type: 'custom', operator: '>=', value: 1, label: 'Có chi nhánh mới cần quản lý', description: 'Phụ thuộc vào kế hoạch mở rộng' },
    ],
  },
];

// ─── Buddy Rewards ───────────────────────────────────────────

export const defaultBuddyRewards: BuddyRewardConfig[] = [
  { id: 'reward-badge', name: 'Huy hiệu Mentor', icon: '🎖️', description: 'Nhận huy hiệu khi mentee pass', is_active: true, trigger: 'mentee_pass', reward_type: 'badge' },
  { id: 'reward-title', name: 'Danh hiệu Mentor xuất sắc', icon: '🏆', description: 'Sau 3 lần mentor thành công', is_active: true, trigger: 'mentor_streak', reward_type: 'title' },
  { id: 'reward-skill', name: 'Điểm kỹ năng +1', icon: '⚡', description: '+1 điểm kỹ năng khi mentee mở 3 skills', is_active: true, trigger: 'mentee_3_skills', reward_type: 'skill_point' },
  { id: 'reward-shift', name: 'Ưu tiên chọn ca', icon: '📅', description: 'Ưu tiên chọn ca 1 tuần sau khi mentee promoted', is_active: true, trigger: 'mentee_promoted', reward_type: 'priority_shift' },
  { id: 'reward-day', name: 'Ngày nghỉ thưởng', icon: '🎉', description: '1 ngày nghỉ phép thưởng khi mentee pass', is_active: false, trigger: 'mentee_pass', reward_type: 'bonus_day' },
];

// ─── Trial Checklist ─────────────────────────────────────────

export const defaultTrialChecklist: TrialChecklistItem[] = [
  { id: 'trial-1', title: 'Đúng giờ', description: 'Đi làm đúng giờ ≥ 90% ca', category: 'Kỷ luật', weight: 20, order: 1, is_active: true },
  { id: 'trial-2', title: 'Pha chế đạt chuẩn', description: 'Đồ uống đúng công thức, đẹp mắt', category: 'Kỹ năng', weight: 25, order: 2, is_active: true },
  { id: 'trial-3', title: 'Thái độ phục vụ', description: 'Thân thiện, nhiệt tình với khách hàng', category: 'Thái độ', weight: 20, order: 3, is_active: true },
  { id: 'trial-4', title: 'Vệ sinh', description: 'Giữ khu vực làm việc sạch sẽ', category: 'Kỷ luật', weight: 15, order: 4, is_active: true },
  { id: 'trial-5', title: 'Teamwork', description: 'Phối hợp tốt với đồng nghiệp', category: 'Thái độ', weight: 20, order: 5, is_active: true },
];

// ─── Onboarding Steps ────────────────────────────────────────

export const defaultOnboardingSteps: OnboardingStep[] = [
  { id: 'onb-1', title: 'Giới thiệu công ty', description: 'Tìm hiểu văn hóa, sứ mệnh, giá trị cốt lõi', type: 'video', estimated_minutes: 5, order: 1, required: true, status: 'active' },
  { id: 'onb-2', title: 'Nội quy làm việc', description: 'Quy định về giờ giấc, đồng phục, kỷ luật', type: 'document', estimated_minutes: 10, order: 2, required: true, status: 'active' },
  { id: 'onb-3', title: 'Hướng dẫn pha chế', description: 'Video hướng dẫn pha chế 5 loại trà sữa phổ biến', type: 'video', estimated_minutes: 15, order: 3, required: true, status: 'active' },
  { id: 'onb-4', title: 'Quiz kiến thức cơ bản', description: '10 câu hỏi về menu, quy trình, vệ sinh', type: 'quiz', estimated_minutes: 5, order: 4, required: true, pass_score: 80, status: 'active' },
  { id: 'onb-5', title: 'Hướng dẫn sử dụng POS', description: 'Thao tác nhận đơn, tính tiền, in hóa đơn', type: 'video', estimated_minutes: 10, order: 5, required: true, status: 'active' },
  { id: 'onb-6', title: 'Thực hành pha chế', description: 'Pha 3 loại đồ uống dưới giám sát Mentor', type: 'task', estimated_minutes: 30, order: 6, required: true, status: 'active' },
  { id: 'onb-7', title: 'Checkin đầu tiên', description: 'Hoàn thành checkin app lần đầu tiên', type: 'checkin', estimated_minutes: 2, order: 7, required: true, status: 'active' },
  { id: 'onb-8', title: 'An toàn thực phẩm', description: 'Quy định ATTP, xử lý sự cố', type: 'document', estimated_minutes: 10, order: 8, required: false, status: 'active' },
];

// ─── Settings ────────────────────────────────────────────────

export const defaultOnboardingCompetencyGroups: OnboardingCompetencyGroup[] = [
  { id: 'ocg-shift-discipline', code: 'shift_discipline', label: 'Kỷ luật ca', description: 'Giờ giấc, đồng phục, tác phong và rule ca.', active: true, sort_order: 1 },
  { id: 'ocg-hygiene-safety', code: 'hygiene_safety', label: 'Vệ sinh và an toàn', description: 'ATTP, vệ sinh tay, quầy và dụng cụ.', active: true, sort_order: 2 },
  { id: 'ocg-customer-service', code: 'customer_service', label: 'Dịch vụ khách hàng', description: 'Chào khách, xác nhận đơn, xử lý tình huống cơ bản.', active: true, sort_order: 3 },
  { id: 'ocg-station-operation', code: 'station_operation', label: 'Thao tác vị trí', description: 'Kỹ năng thao tác đúng theo vị trí nhận việc.', active: true, sort_order: 4 },
  { id: 'ocg-shift-coordination', code: 'shift_coordination', label: 'Phối hợp ca', description: 'Bàn giao, phối hợp quầy-bar và nhịp vận hành.', active: true, sort_order: 5 },
];

export const defaultOnboardingChecklistTemplates: OnboardingChecklistTemplate[] = [
  { id: 'onb-template-counter-v1', role_code: 'counter_staff', role_label: 'Nhân viên quầy', version: 1, status: 'active', effective_from: '2026-05-27', created_by: 'hr_admin', updated_by: 'hr_admin', created_at: '2026-05-27', updated_at: '2026-05-27', notes: 'Template nền cho nhân viên quầy take-away.' },
  { id: 'onb-template-barista-v1', role_code: 'barista', role_label: 'Pha chế', version: 1, status: 'active', effective_from: '2026-05-27', created_by: 'hr_admin', updated_by: 'hr_admin', created_at: '2026-05-27', updated_at: '2026-05-27', notes: 'Template nền cho vị trí pha chế take-away.' },
  { id: 'onb-template-shift-leader-v1', role_code: 'shift_leader', role_label: 'Shift leader', version: 1, status: 'active', effective_from: '2026-05-27', created_by: 'hr_admin', updated_by: 'hr_admin', created_at: '2026-05-27', updated_at: '2026-05-27', notes: 'Template nền cho shift leader mới nhận vai.' },
];

export const defaultOnboardingChecklistStages: OnboardingChecklistStage[] = defaultOnboardingChecklistTemplates.flatMap((template) => [
  { id: `${template.id}-pre-start`, template_id: template.id, code: 'pre_start', label: 'Trước ngày vào làm', sort_order: 1, goal_summary: 'Biết nơi làm, người kèm, giờ có mặt và rule cơ bản.', required_to_pass: true },
  { id: `${template.id}-day-1`, template_id: template.id, code: 'day_1', label: 'Ngày đầu', sort_order: 2, goal_summary: 'Đi đúng nhịp ca đầu và hiểu luồng công việc chính.', required_to_pass: true },
  { id: `${template.id}-day-2-3`, template_id: template.id, code: 'day_2_3', label: '3 ngày đầu', sort_order: 3, goal_summary: 'Làm được việc nền có buddy kèm.', required_to_pass: true },
  { id: `${template.id}-week-1`, template_id: template.id, code: 'week_1', label: 'Tuần 1', sort_order: 4, goal_summary: 'Đứng vị trí ổn trong ca thật ở mức cơ bản.', required_to_pass: true },
  { id: `${template.id}-week-2`, template_id: template.id, code: 'week_2', label: 'Tuần 2', sort_order: 5, goal_summary: 'Chốt đạt hay cần kèm thêm theo vị trí.', required_to_pass: true },
]);

export const defaultOnboardingChecklistItems: OnboardingChecklistItemTemplate[] = [
  { id: 'counter-pre-start-basic', template_id: 'onb-template-counter-v1', stage_id: 'onb-template-counter-v1-pre-start', competency_group_id: 'ocg-shift-discipline', code: 'counter_pre_start_briefing', title: 'Nắm giờ có mặt, đồng phục, buddy và nhóm chat', instruction_text: 'Nhân viên quầy phải biết giờ có mặt, đúng đồng phục, ai kèm ca đầu và đã vào nhóm chat ca.', success_criteria: 'Nhắc lại đúng 4 thông tin cơ bản trước ngày vào làm.', training_method: 'read', evidence_type: 'buddy_check', is_required: true, requires_buddy_confirmation: true, requires_manager_confirmation: false, requires_quiz: false, estimated_minutes: 10, sort_order: 1, active: true },
  { id: 'counter-day-1-order-flow', template_id: 'onb-template-counter-v1', stage_id: 'onb-template-counter-v1-day-1', competency_group_id: 'ocg-customer-service', code: 'counter_day_1_order_flow', title: 'Chào khách và xác nhận đơn đúng luồng', instruction_text: 'Buddy demo cách chào khách, hỏi size, đá, đường, topping rồi cho làm thử tại quầy.', success_criteria: 'Thực hiện đúng 5 lượt liên tiếp, không thiếu thông tin đơn.', training_method: 'hands_on', evidence_type: 'buddy_check', is_required: true, requires_buddy_confirmation: true, requires_manager_confirmation: false, requires_quiz: false, estimated_minutes: 20, sort_order: 2, active: true },
  { id: 'counter-day-2-3-handover', template_id: 'onb-template-counter-v1', stage_id: 'onb-template-counter-v1-day-2-3', competency_group_id: 'ocg-shift-coordination', code: 'counter_day_2_3_handover', title: 'Bàn giao quầy và giao đơn không nhầm', instruction_text: 'Nhân viên quầy thực hành đóng ly, dán tem, giao đơn và bàn giao cho bar đúng thứ tự.', success_criteria: 'Xử lý 10 đơn mẫu không nhầm món hoặc topping.', training_method: 'observation', evidence_type: 'manager_check', is_required: true, requires_buddy_confirmation: true, requires_manager_confirmation: true, requires_quiz: false, estimated_minutes: 30, sort_order: 3, active: true },
  { id: 'barista-day-1-safety-quiz', template_id: 'onb-template-barista-v1', stage_id: 'onb-template-barista-v1-day-1', competency_group_id: 'ocg-hygiene-safety', code: 'barista_day_1_safety_quiz', title: 'Hiểu vệ sinh tay, quầy và bảo quản topping', instruction_text: 'Đọc hướng dẫn ATTP và làm mini quiz ngắn trước khi đứng bar.', success_criteria: 'Qua bài test ngắn tối thiểu 8/10 câu và thao tác rửa tay đúng.', training_method: 'quiz', evidence_type: 'quiz_score', is_required: true, requires_buddy_confirmation: false, requires_manager_confirmation: true, requires_quiz: true, quiz_template_id: 'quiz-barista-safety-core', estimated_minutes: 15, sort_order: 1, active: true },
  { id: 'barista-day-2-3-core-drinks', template_id: 'onb-template-barista-v1', stage_id: 'onb-template-barista-v1-day-2-3', competency_group_id: 'ocg-station-operation', code: 'barista_day_2_3_core_drinks', title: 'Pha đúng món core theo recipe card', instruction_text: 'Buddy demo các món core A/B/C, sau đó cho nhân viên pha lại theo recipe card.', success_criteria: 'Pha đúng 3 ly liên tiếp mỗi món, đúng định lượng và hình thức.', training_method: 'hands_on', evidence_type: 'buddy_check', is_required: true, requires_buddy_confirmation: true, requires_manager_confirmation: false, requires_quiz: false, estimated_minutes: 40, sort_order: 2, active: true },
  { id: 'barista-week-1-rush-readiness', template_id: 'onb-template-barista-v1', stage_id: 'onb-template-barista-v1-week-1', competency_group_id: 'ocg-shift-coordination', code: 'barista_week_1_rush_readiness', title: 'Chạy bar cơ bản ở nhịp thật', instruction_text: 'Cho đứng bar ở giờ bình thường để kiểm tốc độ, phối hợp và giữ chất lượng đồ uống.', success_criteria: 'Hoàn thành lượt pha chế thử theo checklist, không lỗi nghiêm trọng về công thức.', training_method: 'observation', evidence_type: 'manager_check', is_required: true, requires_buddy_confirmation: true, requires_manager_confirmation: true, requires_quiz: false, estimated_minutes: 45, sort_order: 3, active: true },
  { id: 'shift-leader-pre-start-role', template_id: 'onb-template-shift-leader-v1', stage_id: 'onb-template-shift-leader-v1-pre-start', competency_group_id: 'ocg-shift-discipline', code: 'shift_leader_pre_start_role', title: 'Nắm rõ trách nhiệm ca và checklist mở/đóng ca', instruction_text: 'Đọc khung trách nhiệm shift leader, checklist mở ca, cuối ca và rule escalation.', success_criteria: 'Nói lại đúng vai trò, luồng bàn giao và các điểm phải kiểm ca.', training_method: 'read', evidence_type: 'manager_check', is_required: true, requires_buddy_confirmation: false, requires_manager_confirmation: true, requires_quiz: false, estimated_minutes: 20, sort_order: 1, active: true },
  { id: 'shift-leader-day-1-shadow', template_id: 'onb-template-shift-leader-v1', stage_id: 'onb-template-shift-leader-v1-day-1', competency_group_id: 'ocg-shift-coordination', code: 'shift_leader_day_1_shadow', title: 'Theo shadow 1 ca để học phân công và kiểm quầy', instruction_text: 'Đi cùng store manager hoặc shift leader cũ trong 1 ca để quan sát phân ca, kiểm quầy, xử lý phát sinh.', success_criteria: 'Nhắc lại đúng thứ tự đầu ca, giữa ca, cuối ca và ai phụ trách từng khu.', training_method: 'shadow', evidence_type: 'manager_check', is_required: true, requires_buddy_confirmation: false, requires_manager_confirmation: true, requires_quiz: false, estimated_minutes: 60, sort_order: 2, active: true },
  { id: 'shift-leader-week-2-stage-review', template_id: 'onb-template-shift-leader-v1', stage_id: 'onb-template-shift-leader-v1-week-2', competency_group_id: 'ocg-customer-service', code: 'shift_leader_week_2_stage_review', title: 'Chốt ca thử và đánh giá nhân viên mới theo chặng', instruction_text: 'Tự điều phối 1 ca nhẹ, chốt follow-up người mới và báo cáo lại store manager.', success_criteria: 'Store manager đánh giá Đạt hoặc Cần kèm thêm với nhận xét rõ điểm mạnh, điểm hổng.', training_method: 'observation', evidence_type: 'manager_check', is_required: true, requires_buddy_confirmation: false, requires_manager_confirmation: true, requires_quiz: false, estimated_minutes: 60, sort_order: 3, active: true },
];

export const onboardingOutputItemDefinitions: Record<string, OnboardingOutputItemDefinition> = {
  counter_pre_start_briefing: {
    code: 'counter_pre_start_briefing',
    track: 'cashier_service',
    self_check_prompt: 'Em da nho ro gio co mat, dong phuc, buddy va nhom chat chua?',
    pass_standard_supported: 'Nho duoc 4 thong tin co ban khi buddy goi y.',
    pass_standard_independent: 'Chu dong vao ca dung gio, dung kenh va khong can nhac lai thong tin nen.',
    red_flags: [
      { code: 'miss_basic_briefing', label: 'Rot thong tin nen', detail: 'Khong nho gio co mat, buddy hoac kenh thong tin ca.' },
    ],
  },
  counter_day_1_order_flow: {
    code: 'counter_day_1_order_flow',
    track: 'cashier_service',
    self_check_prompt: 'Phan nao trong order em hay nham nhat: size, topping hay nhac lai cho khach?',
    pass_standard_supported: 'Nhan dung order khi buddy dung gan va nhac diem de nham.',
    pass_standard_independent: 'Nhan va xac nhan dung lien tiep cac order co ban ma khong bo sot thong tin.',
    red_flags: [
      { code: 'repeat_wrong_order', label: 'Sai order lap lai', detail: 'Bo sot size, topping hoac ghi sai order gay tra mon.' },
    ],
  },
  counter_day_2_3_handover: {
    code: 'counter_day_2_3_handover',
    track: 'cashier_service',
    self_check_prompt: 'Luc giao order sang quay pha che, em co biet mon nao can nhac ky khong?',
    pass_standard_supported: 'Ban giao order dung thu tu va dung mon khi buddy canh sat.',
    pass_standard_independent: 'Ban giao ngan gon, du thong tin va khong gay nghen giua hai dau quay.',
    red_flags: [
      { code: 'handover_confusion', label: 'Ban giao roi', detail: 'Chuyen order mo ho, thieu thong tin hoac giao nham line.' },
    ],
  },
  barista_day_1_safety_quiz: {
    code: 'barista_day_1_safety_quiz',
    track: 'barista',
    self_check_prompt: 'Quy tac ve sinh tay, quay va bao quan topping nao em van chua tu tin?',
    pass_standard_supported: 'Qua mini test va thao tac dung khi buddy nhac lai buoc chinh.',
    pass_standard_independent: 'Tu nhac lai duoc quy tac va thao tac dung ma khong can nhac lai.',
    red_flags: [
      { code: 'safety_gap', label: 'Hong nen ve sinh', detail: 'Bo qua buoc ve sinh tay, quay hoac bao quan topping quan trong.' },
    ],
  },
  barista_day_2_3_core_drinks: {
    code: 'barista_day_2_3_core_drinks',
    track: 'barista',
    self_check_prompt: 'Nhom mon nao em chua tu tin nhat ve dinh luong hoac thu tu thao tac?',
    pass_standard_supported: 'Pha dung mon nen khi buddy dung kem tung ly.',
    pass_standard_independent: 'Pha dung lien tiep cac mon core da giao, dung dinh luong va dung hinh thuc.',
    red_flags: [
      { code: 'repeat_recipe_error', label: 'Sai cong thuc lap lai', detail: 'Sai dinh luong, sai thu tu thao tac hoac ra ly sai chuan lap lai.' },
    ],
  },
  barista_week_1_rush_readiness: {
    code: 'barista_week_1_rush_readiness',
    track: 'barista',
    self_check_prompt: 'Luc line mon len nhe den vua, em hay rot nhip o dau?',
    pass_standard_supported: 'Giu duoc line mon co ban khi buddy canh sat va nhac nhip.',
    pass_standard_independent: 'Dung duoc station trong nhip that, vua pha vua giu quay sach va khong roi cong thuc.',
    red_flags: [
      { code: 'rush_breakdown', label: 'Vo nhip khi dong', detail: 'Line tang nhe la roi thao tac, sai mon hoac bo qua ve sinh station.' },
    ],
  },
  shift_leader_pre_start_role: {
    code: 'shift_leader_pre_start_role',
    track: 'shift_leader',
    self_check_prompt: 'Em da nam ro role shift leader va luong ban giao ca chua?',
    pass_standard_supported: 'Nhac lai duoc trach nhiem ca khi duoc manager goi mo.',
    pass_standard_independent: 'Tu dien giai duoc role, diem check va rule escalation cua ca.',
    red_flags: [
      { code: 'role_confusion', label: 'Mo ho vai tro', detail: 'Khong nam ro trach nhiem ca va diem kiem soat cua shift leader.' },
    ],
  },
  shift_leader_day_1_shadow: {
    code: 'shift_leader_day_1_shadow',
    track: 'shift_leader',
    self_check_prompt: 'Buoc nao trong dau ca, giua ca, cuoi ca em van chua hinh dung ro?',
    pass_standard_supported: 'Theo duoc 1 ca shadow va nhac lai luong viec khi manager goi mo.',
    pass_standard_independent: 'Tu tom tat duoc luong phan cong, kiem quay va xu ly phat sinh co ban cua ca.',
    red_flags: [
      { code: 'shadow_gap', label: 'Rot luong ca', detail: 'Theo shadow xong nhung van khong nhac lai duoc thu tu van hanh ca.' },
    ],
  },
  shift_leader_week_2_stage_review: {
    code: 'shift_leader_week_2_stage_review',
    track: 'shift_leader',
    self_check_prompt: 'Neu tu dieu phoi 1 ca nhe, em ngai nhat diem nao?',
    pass_standard_supported: 'Chot duoc 1 ca nhe khi manager canh va nhac gate review.',
    pass_standard_independent: 'Tu dieu phoi duoc 1 ca nhe, chot duoc diem manh - diem hong cua nhan vien moi.',
    red_flags: [
      { code: 'weak_gate_review', label: 'Chot gate mo ho', detail: 'Danh gia nhan vien moi khong ro diem dat / diem can kem.' },
    ],
  },
};

export const defaultSettings: CareerPathSettings = {
  buddy_system_enabled: true,
  leaderboard_enabled: true,
  goals_enabled: true,
  endorsements_enabled: true,
  notifications_enabled: true,
  onboarding_enabled: true,
  onboarding_policy_enabled: true,
  onboarding_policy_summary_trigger: 'contract_send',
  onboarding_policy_full_trigger: 'days_before_start',
  onboarding_policy_full_days_before_start: 1,
  onboarding_policy_require_ack: true,
  onboarding_policy_max_reminders: 1,
  onboarding_policy_template_id: 'default-policy-v1',
  onboarding_policy_alert_scope: 'hr_and_store_manager',
  skill_refresh_enabled: false,
  cross_training_enabled: false,
  trial_duration_days: 14,
  max_active_goals: 3,
  leaderboard_reset_period: 'monthly',
};

// ─── Sample Employee Skills ──────────────────────────────────

export const sampleEmployeeSkills: EmployeeSkill[] = [
  // emp-001 (Minh - level-staff, FT, 4 months, 6 skills unlocked)
  { id: 'es-001', employee_id: 'emp-001', skill_id: 'skill-brewing', status: 'unlocked', unlocked_at: '2025-10-15', unlocked_by: 'system', endorsement_count: 3, avg_endorsement_rating: 4.3 },
  { id: 'es-002', employee_id: 'emp-001', skill_id: 'skill-cashier', status: 'unlocked', unlocked_at: '2025-10-15', unlocked_by: 'system', endorsement_count: 2, avg_endorsement_rating: 4.0 },
  { id: 'es-003', employee_id: 'emp-001', skill_id: 'skill-open', status: 'unlocked', unlocked_at: '2025-11-20', unlocked_by: 'system', endorsement_count: 1, avg_endorsement_rating: 4.0 },
  { id: 'es-004', employee_id: 'emp-001', skill_id: 'skill-close', status: 'unlocked', unlocked_at: '2025-11-20', unlocked_by: 'system', endorsement_count: 1, avg_endorsement_rating: 3.0 },
  { id: 'es-005', employee_id: 'emp-001', skill_id: 'skill-quality', status: 'unlocked', unlocked_at: '2025-12-10', unlocked_by: 'system', endorsement_count: 0, avg_endorsement_rating: 0 },
  { id: 'es-006', employee_id: 'emp-001', skill_id: 'skill-hygiene', status: 'unlocked', unlocked_at: '2025-12-10', unlocked_by: 'system', endorsement_count: 0, avg_endorsement_rating: 0 },
  { id: 'es-007', employee_id: 'emp-001', skill_id: 'skill-inventory', status: 'in_progress', unlocked_at: null, unlocked_by: null, endorsement_count: 0, avg_endorsement_rating: 0 },
  { id: 'es-008', employee_id: 'emp-001', skill_id: 'skill-customer', status: 'locked', unlocked_at: null, unlocked_by: null, endorsement_count: 0, avg_endorsement_rating: 0 },
  // emp-003 (Lan - level-trial, PT, 2 weeks, onboarding)
  { id: 'es-020', employee_id: 'emp-003', skill_id: 'skill-brewing', status: 'in_progress', unlocked_at: null, unlocked_by: null, endorsement_count: 0, avg_endorsement_rating: 0 },
  { id: 'es-021', employee_id: 'emp-003', skill_id: 'skill-cashier', status: 'locked', unlocked_at: null, unlocked_by: null, endorsement_count: 0, avg_endorsement_rating: 0 },
  // emp-005 (Linh - level-staff, FT, 8 months, 8 skills, near leader)
  { id: 'es-030', employee_id: 'emp-005', skill_id: 'skill-brewing', status: 'unlocked', unlocked_at: '2025-06-15', unlocked_by: 'system', endorsement_count: 5, avg_endorsement_rating: 4.8 },
  { id: 'es-031', employee_id: 'emp-005', skill_id: 'skill-cashier', status: 'unlocked', unlocked_at: '2025-06-15', unlocked_by: 'system', endorsement_count: 4, avg_endorsement_rating: 4.5 },
  { id: 'es-032', employee_id: 'emp-005', skill_id: 'skill-open', status: 'unlocked', unlocked_at: '2025-07-20', unlocked_by: 'system', endorsement_count: 3, avg_endorsement_rating: 4.7 },
  { id: 'es-033', employee_id: 'emp-005', skill_id: 'skill-close', status: 'unlocked', unlocked_at: '2025-07-20', unlocked_by: 'system', endorsement_count: 3, avg_endorsement_rating: 4.3 },
  { id: 'es-034', employee_id: 'emp-005', skill_id: 'skill-quality', status: 'unlocked', unlocked_at: '2025-08-15', unlocked_by: 'system', endorsement_count: 2, avg_endorsement_rating: 4.0 },
  { id: 'es-035', employee_id: 'emp-005', skill_id: 'skill-hygiene', status: 'unlocked', unlocked_at: '2025-08-20', unlocked_by: 'system', endorsement_count: 2, avg_endorsement_rating: 4.5 },
  { id: 'es-036', employee_id: 'emp-005', skill_id: 'skill-inventory', status: 'unlocked', unlocked_at: '2025-09-10', unlocked_by: 'emp-002', endorsement_count: 1, avg_endorsement_rating: 4.0 },
  { id: 'es-037', employee_id: 'emp-005', skill_id: 'skill-training', status: 'unlocked', unlocked_at: '2025-10-01', unlocked_by: 'emp-002', endorsement_count: 3, avg_endorsement_rating: 4.7 },
  { id: 'es-038', employee_id: 'emp-005', skill_id: 'skill-customer', status: 'in_progress', unlocked_at: null, unlocked_by: null, endorsement_count: 0, avg_endorsement_rating: 0 },
  // emp-004 (Nam - level-staff, FT, 6 months, 7 skills, ready for promotion)
  { id: 'es-040', employee_id: 'emp-004', skill_id: 'skill-brewing', status: 'unlocked', unlocked_at: '2025-08-10', unlocked_by: 'system', endorsement_count: 2, avg_endorsement_rating: 3.5 },
  { id: 'es-041', employee_id: 'emp-004', skill_id: 'skill-cashier', status: 'unlocked', unlocked_at: '2025-08-10', unlocked_by: 'system', endorsement_count: 2, avg_endorsement_rating: 4.0 },
  { id: 'es-042', employee_id: 'emp-004', skill_id: 'skill-open', status: 'unlocked', unlocked_at: '2025-09-15', unlocked_by: 'system', endorsement_count: 1, avg_endorsement_rating: 3.0 },
  { id: 'es-043', employee_id: 'emp-004', skill_id: 'skill-close', status: 'unlocked', unlocked_at: '2025-09-15', unlocked_by: 'system', endorsement_count: 1, avg_endorsement_rating: 4.0 },
  { id: 'es-044', employee_id: 'emp-004', skill_id: 'skill-quality', status: 'unlocked', unlocked_at: '2025-10-10', unlocked_by: 'system', endorsement_count: 0, avg_endorsement_rating: 0 },
  { id: 'es-045', employee_id: 'emp-004', skill_id: 'skill-delivery', status: 'unlocked', unlocked_at: '2025-10-15', unlocked_by: 'system', endorsement_count: 1, avg_endorsement_rating: 4.0 },
  { id: 'es-046', employee_id: 'emp-004', skill_id: 'skill-equipment', status: 'unlocked', unlocked_at: '2025-11-01', unlocked_by: 'system', endorsement_count: 0, avg_endorsement_rating: 0 },
];

// ─── Sample Buddy Assignments ────────────────────────────────

export const sampleBuddyAssignments: BuddyAssignment[] = [
  { id: 'buddy-001', mentor_id: 'emp-005', mentee_id: 'emp-003', store_id: 'store-q1', started_at: '2026-02-07', completed_at: null, status: 'active', mentee_trial_result: null, mentor_rewards_given: [], notes: '' },
  { id: 'buddy-002', mentor_id: 'emp-001', mentee_id: 'emp-007', store_id: 'store-q1', started_at: '2026-01-15', completed_at: '2026-02-01', status: 'completed', mentee_trial_result: 'pass', mentor_rewards_given: ['reward-badge'], notes: 'Mentee đạt yêu cầu' },
  { id: 'buddy-003', mentor_id: 'emp-005', mentee_id: 'emp-008', store_id: 'store-q1', started_at: '2025-12-01', completed_at: '2025-12-20', status: 'completed', mentee_trial_result: 'pass', mentor_rewards_given: ['reward-badge', 'reward-skill'], notes: '' },
];

// ─── Sample Promotion Requests ───────────────────────────────

export const samplePromotionRequests: PromotionRequest[] = [
  {
    id: 'preq-001', employee_id: 'emp-004', from_level_id: 'level-staff', to_level_id: 'level-leader',
    status: 'pending', submitted_at: '2026-02-18', reviewed_at: null, reviewed_by: null, review_note: null,
    conditions_snapshot: [
      { condition: { type: 'months_at_level', operator: '>=', value: 4, label: 'NV ≥ 4 tháng' }, current_value: 6, is_met: true, progress_percent: 100 },
      { condition: { type: 'kpi_avg', operator: '>=', value: 85, label: 'KPI ≥ 85%' }, current_value: 88, is_met: true, progress_percent: 100 },
      { condition: { type: 'skills_count', operator: '>=', value: 5, label: '≥ 5 kỹ năng' }, current_value: 7, is_met: true, progress_percent: 100 },
      { condition: { type: 'buddy_count', operator: '>=', value: 1, label: 'Train ≥ 1 người' }, current_value: 0, is_met: false, progress_percent: 0 },
    ],
  },
];

// ─── Sample Type Change Requests ─────────────────────────────

export const sampleTypeChangeRequests: TypeChangeRequest[] = [
  { id: 'tcreq-001', employee_id: 'emp-006', from_type: 'part_time', to_type: 'full_time', reason: 'Muốn phát triển lên Leader', status: 'pending', submitted_at: '2026-02-15', reviewed_at: null, reviewed_by: null, review_note: null },
];

// ─── Sample Trial Evaluations ────────────────────────────────

export const sampleTrialEvaluations: TrialEvaluation[] = [
  {
    id: 'trial-eval-001', employee_id: 'emp-007', evaluator_id: 'emp-002', buddy_id: 'emp-001',
    started_at: '2026-01-15', evaluated_at: '2026-02-01', result: 'pass', overall_score: 82, notes: 'Đạt yêu cầu, chuyển chính thức',
    checklist_scores: [
      { item_id: 'trial-1', score: 4, note: 'Đúng giờ tốt' },
      { item_id: 'trial-2', score: 4, note: 'Pha chế ổn' },
      { item_id: 'trial-3', score: 5, note: 'Rất thân thiện' },
      { item_id: 'trial-4', score: 3, note: 'Cần cải thiện vệ sinh' },
      { item_id: 'trial-5', score: 4, note: 'Phối hợp tốt' },
    ],
  },
];

// ─── Sample Goals ────────────────────────────────────────────

export const sampleGoals: CareerGoal[] = [
  { id: 'goal-001', employee_id: 'emp-001', type: 'skill', target_skill_id: 'skill-training', title: 'Mở khóa Training cơ bản', target_date: '2026-03-15', status: 'active', progress: 75, created_at: '2026-01-10' },
  { id: 'goal-002', employee_id: 'emp-001', type: 'level', target_level_id: 'level-leader', title: 'Lên Trợ lý Quản lý', target_date: '2026-05-01', status: 'active', progress: 42, created_at: '2026-01-15' },
  { id: 'goal-003', employee_id: 'emp-004', type: 'skill', target_skill_id: 'skill-training', title: 'Mở khóa Training', target_date: '2026-03-01', status: 'active', progress: 60, created_at: '2026-01-20' },
  { id: 'goal-004', employee_id: 'emp-001', type: 'skill', target_skill_id: 'skill-open', title: 'Mở khóa Mở ca', target_date: '2026-02-15', status: 'achieved', progress: 100, created_at: '2025-12-01', achieved_at: '2026-02-01' },
];

// ─── Sample Endorsements ─────────────────────────────────────

export const sampleEndorsements: SkillEndorsement[] = [
  { id: 'end-001', employee_id: 'emp-001', skill_id: 'skill-brewing', endorsed_by: 'emp-005', endorsed_at: '2026-01-20', rating: 4, comment: 'Pha rất ngon' },
  { id: 'end-002', employee_id: 'emp-001', skill_id: 'skill-brewing', endorsed_by: 'emp-002', endorsed_at: '2026-02-01', rating: 5, comment: 'Xuất sắc' },
  { id: 'end-003', employee_id: 'emp-001', skill_id: 'skill-brewing', endorsed_by: 'emp-004', endorsed_at: '2026-02-10', rating: 4 },
  { id: 'end-004', employee_id: 'emp-005', skill_id: 'skill-training', endorsed_by: 'emp-002', endorsed_at: '2026-01-15', rating: 5, comment: 'Mentor rất giỏi' },
  { id: 'end-005', employee_id: 'emp-005', skill_id: 'skill-brewing', endorsed_by: 'emp-002', endorsed_at: '2026-01-10', rating: 5 },
  { id: 'end-006', employee_id: 'emp-004', skill_id: 'skill-cashier', endorsed_by: 'emp-002', endorsed_at: '2026-02-05', rating: 4, comment: 'Tính tiền nhanh' },
];

// ─── Sample Onboarding ──────────────────────────────────────

export const sampleEmployeeOnboarding: import('./career-path-types').EmployeeOnboarding[] = [
  {
    id: 'onb-prog-001', employee_id: 'emp-003', started_at: '2026-02-07', completed_at: null, overall_progress: 62,
    steps_progress: [
      { step_id: 'onb-1', status: 'completed', started_at: '2026-02-07', completed_at: '2026-02-07' },
      { step_id: 'onb-2', status: 'completed', started_at: '2026-02-07', completed_at: '2026-02-07' },
      { step_id: 'onb-3', status: 'completed', started_at: '2026-02-08', completed_at: '2026-02-08' },
      { step_id: 'onb-4', status: 'completed', started_at: '2026-02-08', completed_at: '2026-02-08', score: 90 },
      { step_id: 'onb-5', status: 'completed', started_at: '2026-02-09', completed_at: '2026-02-09' },
      { step_id: 'onb-6', status: 'in_progress', started_at: '2026-02-10', completed_at: null },
      { step_id: 'onb-7', status: 'pending', started_at: null, completed_at: null },
      { step_id: 'onb-8', status: 'pending', started_at: null, completed_at: null },
    ],
  },
];

export const sampleEmployeeOnboardingChecklistPlans: EmployeeOnboardingChecklistPlan[] = [
  {
    id: 'onb-plan-007',
    employee_id: 'emp-007',
    template_id: 'onb-template-counter-v1',
    role_code: 'counter_staff',
    assigned_store_id: 'store-001',
    assigned_buddy_id: 'emp-006',
    assigned_buddy_name: 'Nguyễn Thị Mai',
    assigned_manager_id: 'emp-002',
    assigned_manager_name: 'Trần Thị Lan',
    start_date: '2025-12-01',
    current_stage_code: 'day_2_3',
    status: 'in_progress',
    overall_progress: 67,
    overall_note: 'Đã qua ca đầu, đang cần kèm thêm phần bàn giao quầy.',
    assigned_at: '2025-11-30',
    created_at: '2025-11-30',
    updated_at: '2025-12-03',
  },
  {
    id: 'onb-plan-011',
    employee_id: 'emp-011',
    template_id: 'onb-template-counter-v1',
    role_code: 'counter_staff',
    assigned_store_id: 'store-002',
    assigned_buddy_id: 'emp-009',
    assigned_buddy_name: 'Tran Van Duc',
    assigned_manager_id: 'emp-003',
    assigned_manager_name: 'Le Hoang Nam',
    start_date: '2025-01-10',
    current_stage_code: 'day_2_3',
    status: 'in_progress',
    overall_progress: 67,
    overall_note: 'Da xong huong dan co ban, dang cho quan ly chot item ban giao quay.',
    assigned_at: '2025-01-10',
    created_at: '2025-01-10',
    updated_at: '2025-01-12',
  },
];

export const sampleEmployeeOnboardingChecklistProgressItems: EmployeeOnboardingChecklistProgressItem[] = [
  {
    id: 'onb-plan-007-item-1',
    onboarding_plan_id: 'onb-plan-007',
    checklist_item_id: 'counter-pre-start-basic',
    status: 'passed',
    note: 'Đã xác nhận giờ có mặt và vào nhóm chat.',
    started_at: '2025-11-30',
    completed_at: '2025-11-30',
    buddy_confirmed_by: 'emp-006',
    buddy_confirmed_at: '2025-11-30',
    quiz_score: null,
  },
  {
    id: 'onb-plan-007-item-2',
    onboarding_plan_id: 'onb-plan-007',
    checklist_item_id: 'counter-day-1-order-flow',
    status: 'passed',
    note: 'Đứng quầy ổn ở khung vắng khách.',
    started_at: '2025-12-01',
    completed_at: '2025-12-01',
    buddy_confirmed_by: 'emp-006',
    buddy_confirmed_at: '2025-12-01',
    quiz_score: null,
  },
  {
    id: 'onb-plan-007-item-3',
    onboarding_plan_id: 'onb-plan-007',
    checklist_item_id: 'counter-day-2-3-handover',
    status: 'in_progress',
    note: 'Còn nhầm 1 đơn khi đông khách, cần kèm thêm cuối ca.',
    started_at: '2025-12-02',
    completed_at: null,
    buddy_confirmed_by: null,
    buddy_confirmed_at: null,
    manager_confirmed_by: null,
    manager_confirmed_at: null,
    quiz_score: null,
  },
  {
    id: 'onb-plan-011-item-1',
    onboarding_plan_id: 'onb-plan-011',
    checklist_item_id: 'counter-pre-start-basic',
    status: 'passed',
    note: 'Da biet gio co mat va buddy phu trach.',
    started_at: '2025-01-10',
    completed_at: '2025-01-10',
    buddy_confirmed_by: 'emp-009',
    buddy_confirmed_at: '2025-01-10',
    quiz_score: null,
  },
  {
    id: 'onb-plan-011-item-2',
    onboarding_plan_id: 'onb-plan-011',
    checklist_item_id: 'counter-day-1-order-flow',
    status: 'passed',
    note: 'Da qua duoc order flow trong khung khach vua.',
    started_at: '2025-01-10',
    completed_at: '2025-01-10',
    buddy_confirmed_by: 'emp-009',
    buddy_confirmed_at: '2025-01-10',
    quiz_score: null,
  },
  {
    id: 'onb-plan-011-item-3',
    onboarding_plan_id: 'onb-plan-011',
    checklist_item_id: 'counter-day-2-3-handover',
    status: 'in_progress',
    note: 'Buddy da xac nhan thao tac on, dang cho quan ly xem luc dong khach.',
    started_at: '2025-01-11',
    completed_at: '2025-01-11',
    buddy_confirmed_by: 'emp-009',
    buddy_confirmed_at: '2025-01-11',
    manager_confirmed_by: null,
    manager_confirmed_at: null,
    quiz_score: null,
  },
];

// ─── Sample Notifications ────────────────────────────────────

export const sampleNotifications: CareerNotification[] = [
  { id: 'notif-001', employee_id: 'emp-001', type: 'skill_unlock_available', title: 'Sắp mở được Nhập hàng!', message: 'Bạn đủ 85% điều kiện mở khóa kỹ năng Nhập hàng. Còn thiếu phê duyệt Leader.', link: '/career-path/skills', is_read: false, created_at: '2026-02-20' },
  { id: 'notif-002', employee_id: 'emp-001', type: 'goal_reminder', title: 'Còn 22 ngày mục tiêu', message: 'Mục tiêu "Mở khóa Training cơ bản" còn 22 ngày. Tiến độ: 75%.', link: '/career-path/goals', is_read: false, created_at: '2026-02-21' },
  { id: 'notif-003', employee_id: 'emp-005', type: 'buddy_update', title: 'Lan hoàn thành 62% onboarding', message: 'Mentee Lan đã hoàn thành 5/8 bước onboarding.', link: '/career-path', is_read: true, created_at: '2026-02-10' },
  { id: 'notif-004', employee_id: 'emp-004', type: 'promotion_eligible', title: 'Đủ ĐK lên Trợ lý QL!', message: 'Bạn đã đạt 3/4 điều kiện thăng tiến lên Trợ lý Quản lý.', link: '/career-path/promotion', is_read: false, created_at: '2026-02-18' },
  { id: 'notif-005', employee_id: 'emp-001', type: 'endorsement_received', title: 'Linh đã xác nhận kỹ năng', message: 'Linh đã xác nhận kỹ năng Pha chế cơ bản của bạn (4⭐).', is_read: true, created_at: '2026-01-20' },
];

// ─── Sample Leaderboard ──────────────────────────────────────

export const sampleLeaderboard: LeaderboardEntry[] = [
  // Top Mentor - Feb 2026
  { employee_id: 'emp-005', employee_name: 'Linh', store_id: 'store-q1', category: 'top_mentor', score: 3, rank: 1, period: '2026-02', trend: 'same', highlight: '3 mentees thành công' },
  { employee_id: 'emp-001', employee_name: 'Minh', store_id: 'store-q1', category: 'top_mentor', score: 1, rank: 2, period: '2026-02', trend: 'up' },
  { employee_id: 'emp-004', employee_name: 'Nam', store_id: 'store-q1', category: 'top_mentor', score: 0, rank: 3, period: '2026-02', trend: 'same' },
  // Skill Unlock - Feb 2026
  { employee_id: 'emp-001', employee_name: 'Minh', store_id: 'store-q1', category: 'skill_unlock', score: 6, rank: 1, period: '2026-02', trend: 'up', highlight: '6 kỹ năng đã mở' },
  { employee_id: 'emp-004', employee_name: 'Nam', store_id: 'store-q1', category: 'skill_unlock', score: 7, rank: 1, period: '2026-02', trend: 'up' },
  { employee_id: 'emp-005', employee_name: 'Linh', store_id: 'store-q1', category: 'skill_unlock', score: 8, rank: 1, period: '2026-02', trend: 'same', highlight: '8 kỹ năng - nhiều nhất!' },
  // Streak
  { employee_id: 'emp-001', employee_name: 'Minh', store_id: 'store-q1', category: 'streak', score: 15, rank: 1, period: '2026-02', trend: 'up', highlight: '15 ngày không lỗi' },
  { employee_id: 'emp-005', employee_name: 'Linh', store_id: 'store-q1', category: 'streak', score: 12, rank: 2, period: '2026-02', trend: 'down' },
];

// ─── Sample Achievements ─────────────────────────────────────

export const sampleAchievements: Achievement[] = [
  { id: 'ach-001', type: 'badge', title: 'Mentor đầu tiên', icon: '🎖️', description: 'Hoàn thành mentor mentee đầu tiên', earned_at: '2026-02-01' },
  { id: 'ach-002', type: 'milestone', title: '6 kỹ năng', icon: '⭐', description: 'Mở khóa 6 kỹ năng', earned_at: '2025-12-10' },
  { id: 'ach-003', type: 'streak', title: '7 ngày hoàn hảo', icon: '🔥', description: '7 ngày liên tục không lỗi', earned_at: '2026-02-15' },
];

// ─── Sample Change Logs ──────────────────────────────────────

export const sampleChangeLogs: SettingsChangeLog[] = [
  { id: 'log-001', entity_type: 'skill', entity_id: 'skill-inventory', action: 'update', changed_by: 'emp-002', changed_at: '2026-02-10', before_snapshot: '{"unlock_conditions":[{"type":"months_worked","value":3}]}', after_snapshot: '{"unlock_conditions":[{"type":"months_worked","value":2}]}', description: 'Giảm yêu cầu Nhập hàng từ 3 tháng xuống 2 tháng' },
  { id: 'log-002', entity_type: 'level', entity_id: 'level-leader', action: 'toggle', changed_by: 'emp-002', changed_at: '2026-02-05', before_snapshot: '{"is_active":true}', after_snapshot: '{"is_active":false}', description: 'Tắt cấp Trợ lý QL (chưa đủ nhân sự)' },
  { id: 'log-003', entity_type: 'buddy_reward', entity_id: 'reward-day', action: 'toggle', changed_by: 'emp-002', changed_at: '2026-01-20', before_snapshot: '{"is_active":true}', after_snapshot: '{"is_active":false}', description: 'Tắt phần thưởng ngày nghỉ' },
];

// ─── Sample Template ─────────────────────────────────────────

export const sampleTemplate: CareerPathTemplate = {
  id: 'tmpl-001', name: 'Template Chuẩn Q1', description: 'Template mặc định cho chi nhánh Quận 1',
  created_at: '2026-01-01', created_by: 'emp-002',
  data: {
    levels: defaultCareerLevels,
    skills: defaultSkills,
    conditions: defaultPromotionConditions,
    employee_types: defaultEmployeeTypes,
    buddy_rewards: defaultBuddyRewards,
    trial_checklist: defaultTrialChecklist,
    onboarding_steps: defaultOnboardingSteps,
    onboarding_competency_groups: defaultOnboardingCompetencyGroups,
    onboarding_checklist_templates: defaultOnboardingChecklistTemplates,
    onboarding_checklist_stages: defaultOnboardingChecklistStages,
    onboarding_checklist_items: defaultOnboardingChecklistItems,
    onboarding_employee_plans: sampleEmployeeOnboardingChecklistPlans,
    onboarding_employee_progress_items: sampleEmployeeOnboardingChecklistProgressItems,
  },
};

// ─── Sample Analytics ────────────────────────────────────────

export const sampleAnalytics: CareerAnalytics = {
  store_id: 'store-q1', period: '2026-02',
  avg_time_to_promotion: 45,
  skill_unlock_rate: 2.5,
  buddy_success_rate: 89,
  retention_by_level: [
    { level_id: 'level-trial', retention_rate: 72 },
    { level_id: 'level-staff', retention_rate: 91 },
    { level_id: 'level-leader', retention_rate: 100 },
    { level_id: 'level-manager', retention_rate: 100 },
  ],
  top_skills_unlocked: [
    { skill_id: 'skill-brewing', count: 8 },
    { skill_id: 'skill-cashier', count: 8 },
    { skill_id: 'skill-open', count: 5 },
    { skill_id: 'skill-close', count: 5 },
    { skill_id: 'skill-quality', count: 3 },
  ],
  promotion_funnel: [
    { level_id: 'level-trial', eligible: 2, promoted: 1 },
    { level_id: 'level-staff', eligible: 3, promoted: 0 },
    { level_id: 'level-leader', eligible: 0, promoted: 0 },
  ],
};

// ─── Sample Skill Refresh Records ────────────────────────────

export const sampleRefreshRecords: SkillRefreshRecord[] = [
  { id: 'ref-001', employee_id: 'emp-001', skill_id: 'skill-hygiene', original_unlock_date: '2025-12-10', last_refresh_date: '2025-12-10', next_refresh_due: '2026-06-10', status: 'valid' },
  { id: 'ref-002', employee_id: 'emp-005', skill_id: 'skill-hygiene', original_unlock_date: '2025-08-20', last_refresh_date: '2025-08-20', next_refresh_due: '2026-02-20', status: 'expiring_soon' },
];

// ─── Sample Cross-Training ───────────────────────────────────

export const sampleCrossTraining: CrossTrainingRecord[] = [
  { id: 'ct-001', employee_id: 'emp-001', from_store_id: 'store-q1', to_store_id: 'store-q3', skills_learned: ['skill-delivery'], started_at: '2026-01-10', completed_at: '2026-01-15', trainer_id: 'emp-010', notes: 'Học quản lý đơn online từ CN3', status: 'completed' },
];
