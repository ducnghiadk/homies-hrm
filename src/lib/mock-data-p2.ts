// ============================================
// HRM Trà Sữa — Phase 2 Mock Data
// KPI, Rewards, Evaluations, Career
// ============================================

// KPI Templates
export const mockKpiTemplates = [
  {
    id: 'kpi-tpl-001', name: 'KPI Pha chế', position_id: 'pos-barista',
    metrics: [
      { id: 'km-01', name: 'Chuyên cần', type: 'auto', weight: 25, unit: '%', target: 95, category: 'process' },
      { id: 'km-02', name: 'Doanh số (ly)', type: 'manual', weight: 30, unit: 'ly', target: 500, category: 'financial' },
      { id: 'km-03', name: 'Đánh giá KH', type: 'manual', weight: 20, unit: 'điểm', target: 4.5, category: 'customer' },
      { id: 'km-04', name: 'Không khiếu nại', type: 'auto', weight: 15, unit: 'lần', target: 0, category: 'customer' },
      { id: 'km-05', name: 'Hoàn thành training', type: 'manual', weight: 10, unit: '%', target: 100, category: 'learning' },
    ]
  },
  {
    id: 'kpi-tpl-002', name: 'KPI Thu ngân', position_id: 'pos-cashier',
    metrics: [
      { id: 'kc-01', name: 'Chuyên cần', type: 'auto', weight: 20, unit: '%', target: 95, category: 'process' },
      { id: 'kc-02', name: 'Sai sót tiền mặt', type: 'manual', weight: 25, unit: 'lần', target: 0, category: 'process' },
      { id: 'kc-03', name: 'Upsell thành công', type: 'manual', weight: 25, unit: '%', target: 30, category: 'financial' },
      { id: 'kc-04', name: 'Thời gian phục vụ', type: 'manual', weight: 15, unit: 'phút', target: 3, category: 'customer' },
      { id: 'kc-05', name: 'Training score', type: 'manual', weight: 15, unit: '%', target: 100, category: 'learning' },
    ]
  }
]

// KPI Assignments (for current period)
export const mockKpiAssignments = [
  {
    id: 'kpi-a-001', employee_id: 'emp-005', template_id: 'kpi-tpl-001',
    period: '2026-02', period_type: 'monthly',
    results: [
      { metric_id: 'km-01', target: 95, actual: 92, score: 96.8 },
      { metric_id: 'km-02', target: 500, actual: 478, score: 95.6 },
      { metric_id: 'km-03', target: 4.5, actual: 4.7, score: 100 },
      { metric_id: 'km-04', target: 0, actual: 1, score: 70 },
      { metric_id: 'km-05', target: 100, actual: 80, score: 80 },
    ],
    total_score: 91.2,
    status: 'active'
  },
  {
    id: 'kpi-a-002', employee_id: 'emp-006', template_id: 'kpi-tpl-002',
    period: '2026-02', period_type: 'monthly',
    results: [
      { metric_id: 'kc-01', target: 95, actual: 98, score: 100 },
      { metric_id: 'kc-02', target: 0, actual: 0, score: 100 },
      { metric_id: 'kc-03', target: 30, actual: 35, score: 100 },
      { metric_id: 'kc-04', target: 3, actual: 2.5, score: 100 },
      { metric_id: 'kc-05', target: 100, actual: 100, score: 100 },
    ],
    total_score: 100,
    status: 'active'
  },
  {
    id: 'kpi-a-003', employee_id: 'emp-007', template_id: 'kpi-tpl-001',
    period: '2026-02', period_type: 'monthly',
    results: [
      { metric_id: 'km-01', target: 95, actual: 85, score: 89.5 },
      { metric_id: 'km-02', target: 500, actual: 320, score: 64 },
      { metric_id: 'km-03', target: 4.5, actual: 3.8, score: 84.4 },
      { metric_id: 'km-04', target: 0, actual: 2, score: 50 },
      { metric_id: 'km-05', target: 100, actual: 60, score: 60 },
    ],
    total_score: 71.3,
    status: 'active'
  }
]

// Rewards & Penalties
export type RewardType = 'bonus' | 'penalty'
export const mockRewards = [
  { id: 'rw-001', employee_id: 'emp-005', type: 'bonus' as RewardType, amount: 200000, reason: 'Nhân viên xuất sắc tháng 1', date: '2026-01-31', created_by: 'emp-002', category: 'performance' },
  { id: 'rw-002', employee_id: 'emp-006', type: 'bonus' as RewardType, amount: 100000, reason: '0 sai sót 3 tháng liên tiếp', date: '2026-01-31', created_by: 'emp-002', category: 'accuracy' },
  { id: 'rw-003', employee_id: 'emp-007', type: 'penalty' as RewardType, amount: -50000, reason: 'Trễ 4 lần trong tháng 1', date: '2026-01-31', created_by: 'emp-002', category: 'attendance' },
  { id: 'rw-004', employee_id: 'emp-008', type: 'bonus' as RewardType, amount: 300000, reason: 'Top doanh số tuần 2', date: '2026-01-14', created_by: 'emp-002', category: 'sales' },
  { id: 'rw-005', employee_id: 'emp-005', type: 'penalty' as RewardType, amount: -100000, reason: 'Khách hàng khiếu nại', date: '2026-02-05', created_by: 'emp-002', category: 'complaint' },
  { id: 'rw-006', employee_id: 'emp-009', type: 'bonus' as RewardType, amount: 150000, reason: 'Hoàn thành training sớm', date: '2026-02-10', created_by: 'emp-003', category: 'training' },
]

// Reward Rules (auto-applied)
export const mockRewardRules = [
  { id: 'rule-001', name: 'Trễ ≥3 lần/tháng', condition: 'late_count >= 3', action: 'penalty', amount: -50000, is_active: true },
  { id: 'rule-002', name: 'Perfect attendance', condition: 'late_count == 0 && absent_count == 0', action: 'bonus', amount: 200000, is_active: true },
  { id: 'rule-003', name: 'Top 1 doanh số', condition: 'sales_rank == 1', action: 'bonus', amount: 300000, is_active: true },
  { id: 'rule-004', name: 'KPI dưới 60%', condition: 'kpi_score < 60', action: 'penalty', amount: -100000, is_active: false },
]

// 360° Evaluations
export const mockEvalCycles = [
  {
    id: 'eval-001', name: 'Đánh giá Q4/2025', status: 'completed', 
    start_date: '2025-12-01', end_date: '2025-12-31',
    total_evaluations: 12, completed_evaluations: 12
  },
  {
    id: 'eval-002', name: 'Đánh giá Q1/2026', status: 'active',
    start_date: '2026-03-01', end_date: '2026-03-31',
    total_evaluations: 15, completed_evaluations: 3
  }
]

export const mockEvalResults = [
  {
    id: 'er-001', cycle_id: 'eval-001', employee_id: 'emp-005',
    self_scores: { work_quality: 4, teamwork: 4, initiative: 3, communication: 4, reliability: 5 },
    manager_scores: { work_quality: 4, teamwork: 5, initiative: 3, communication: 4, reliability: 5 },
    peer_scores: { work_quality: 4, teamwork: 4, initiative: 4, communication: 3, reliability: 4 },
    final_score: 4.0, comments: 'Nhân viên đáng tin cậy, cần cải thiện sáng kiến'
  },
  {
    id: 'er-002', cycle_id: 'eval-001', employee_id: 'emp-006',
    self_scores: { work_quality: 5, teamwork: 4, initiative: 4, communication: 5, reliability: 5 },
    manager_scores: { work_quality: 5, teamwork: 4, initiative: 5, communication: 4, reliability: 5 },
    peer_scores: { work_quality: 5, teamwork: 5, initiative: 4, communication: 4, reliability: 5 },
    final_score: 4.6, comments: 'Xuất sắc toàn diện, ứng viên phó QL'
  },
  {
    id: 'er-003', cycle_id: 'eval-001', employee_id: 'emp-007',
    self_scores: { work_quality: 3, teamwork: 4, initiative: 3, communication: 3, reliability: 3 },
    manager_scores: { work_quality: 3, teamwork: 3, initiative: 2, communication: 3, reliability: 2 },
    peer_scores: { work_quality: 3, teamwork: 3, initiative: 3, communication: 3, reliability: 3 },
    final_score: 2.9, comments: 'Cần cải thiện nhiều mặt, đặc biệt tính đáng tin cậy'
  }
]

// Career Paths
export const mockCareerLevels = [
  { level: 0, name: 'Thử việc', min_months: 0, min_kpi: 0, min_eval: 0, required_courses: 0, salary_range: '4-5M' },
  { level: 1, name: 'Nhân viên', min_months: 2, min_kpi: 60, min_eval: 3.0, required_courses: 1, salary_range: '5-7M' },
  { level: 2, name: 'Senior', min_months: 12, min_kpi: 75, min_eval: 3.5, required_courses: 3, salary_range: '7-10M' },
  { level: 3, name: 'Phó Quản lý', min_months: 24, min_kpi: 80, min_eval: 4.0, required_courses: 5, salary_range: '10-15M' },
  { level: 4, name: 'Quản lý', min_months: 36, min_kpi: 85, min_eval: 4.5, required_courses: 8, salary_range: '15-25M' },
]

export const mockCareerProgress = [
  {
    employee_id: 'emp-005', current_level: 1, target_level: 2,
    progress: {
      months_worked: 14, months_required: 12, months_met: true,
      avg_kpi: 91.2, kpi_required: 75, kpi_met: true,
      avg_eval: 4.0, eval_required: 3.5, eval_met: true,
      courses_done: 2, courses_required: 3, courses_met: false,
    },
    overall_percent: 75,
    suggestion: 'Hoàn thành thêm 1 khóa học để đủ điều kiện lên Senior'
  },
  {
    employee_id: 'emp-006', current_level: 1, target_level: 2,
    progress: {
      months_worked: 12, months_required: 12, months_met: true,
      avg_kpi: 100, kpi_required: 75, kpi_met: true,
      avg_eval: 4.6, eval_required: 3.5, eval_met: true,
      courses_done: 3, courses_required: 3, courses_met: true,
    },
    overall_percent: 100,
    suggestion: '🎉 Đủ điều kiện thăng tiến lên Senior! Đã gửi đề xuất cho Manager.'
  },
  {
    employee_id: 'emp-007', current_level: 0, target_level: 1,
    progress: {
      months_worked: 5, months_required: 2, months_met: true,
      avg_kpi: 71.3, kpi_required: 60, kpi_met: true,
      avg_eval: 2.9, eval_required: 3.0, eval_met: false,
      courses_done: 0, courses_required: 1, courses_met: false,
    },
    overall_percent: 50,
    suggestion: 'Cần cải thiện đánh giá 360° (hiện 2.9, cần 3.0) và hoàn thành 1 khóa training'
  }
]

// BSC categories
export const bscCategories = [
  { key: 'financial', label: 'Tài chính', icon: '💰', color: '#2F6FA8' },
  { key: 'customer', label: 'Khách hàng', icon: '👥', color: '#1E9E57' },
  { key: 'process', label: 'Quy trình', icon: '⚙️', color: '#F6C85F' },
  { key: 'learning', label: 'Học hỏi', icon: '📚', color: '#001D3D' },
]

// Helper
export const getKpiAssignmentByEmployee = (empId: string) =>
  mockKpiAssignments.find(a => a.employee_id === empId)

export const getRewardsByEmployee = (empId: string) =>
  mockRewards.filter(r => r.employee_id === empId)

export const getEvalResultByEmployee = (empId: string, cycleId: string) =>
  mockEvalResults.find(r => r.employee_id === empId && r.cycle_id === cycleId)

export const getCareerProgressByEmployee = (empId: string) =>
  mockCareerProgress.find(p => p.employee_id === empId)
