// =============================================
// Homies Milk Tea 🧋 — BSC Bonus System Types
// Chính sách BSC chuẩn Homies Hồ Bá Phấn
// =============================================

export type BSCPeriod = string // dạng '2026-06', '2026-07'

// ═══════════════════════════════════
// 1. GATE CHECK & TARGET DOANH THU
// ═══════════════════════════════════

export interface BSCRevenueTarget {
  store_id: string
  store_name: string
  period: BSCPeriod
  valid_from?: string            // Kỳ bắt đầu hiệu lực mục tiêu (VD: '2026-07')
  valid_to?: string              // Kỳ kết thúc hiệu lực mục tiêu (VD: '2026-12')
  target_period_scope?: 'single_month' | 'range_months' // Áp dụng riêng 1 tháng hoặc theo khoảng thời gian
  profit_threshold_daily: number // Mốc lợi nhuận tối thiểu (mặc định 6.500.000đ/ngày)
  target_mode?: 'auto_3_6_months' | 'manual' // Chế độ xác định Target (Theo 3-6 tháng gần nhất x115% hoặc Tự đặt thủ công)
  avg_3_6_months_daily?: number  // Doanh thu trung bình 3-6 tháng (Dùng khi target_mode = 'auto_3_6_months')
  manual_target_daily?: number   // Target doanh thu ngày tự đặt thủ công (Dùng khi target_mode = 'manual')
  target_daily: number           // Target doanh thu trung bình ngày (VD: 8.000.000đ/ngày)
  target_monthly: number         // Target doanh thu tháng (Target daily * số ngày)
  days_in_month: number          // Số ngày trong tháng (30, 31)
  actual_revenue_monthly: number // Doanh thu thực tế trong tháng
  actual_revenue_daily: number   // Doanh thu thực tế trung bình ngày
  is_unlocked: boolean           // Mở thưởng hay không (actual_daily >= profit_threshold_daily)
  cogs_budget?: number           // COGS định mức (đ)
  cogs_actual?: number           // COGS thực tế (đ)
  has_attp_foreign_body?: boolean// Cảnh báo dị vật / ATTP khách hàng (Nếu có → ép điểm KH = 1)
  min_hours_threshold?: number   // Mốc giờ tối thiểu nhận BSC (Mặc định 110h)
  retain_deducted_bonus?: boolean// Chế độ giữ lại phần giảm (không chia lại)
  approval_status?: 'draft' | 'pending_ceo' | 'approved_published' // Trạng thái duyệt của CEO
  approved_by?: string
  approved_at?: string
}

// ═══════════════════════════════════
// 2. 4 TIÊU CHÍ BSC CỬA HÀNG
// ═══════════════════════════════════

export type BSCCriteriaKey = 'revenue' | 'waste' | 'operation' | 'customer' | (string & {})

export interface BSCSubCriteriaInfo {
  key: string
  name: string
  weight_pct: number // 60 (tức 60% trọng số nội bộ của tiêu chí mẹ)
  unit_label: string // 'Điểm', '%', 'đ', 'Lần'
  direction: 'higher_better' | 'lower_better'
  input_type: 'number' | 'currency' | 'percentage' | 'boolean'
  score_5: number
  score_4: number
  score_3: number
  score_2: number
  score_1: number
  description?: string
}

export interface BSCCriteriaInfo {
  key: BSCCriteriaKey
  name: string
  weight: number // 0.40, 0.20, 0.25, 0.15
  weight_percent_label: string // '40%', '20%', ...
  description: string
  how_to_excel: string
  icon: string
  color: string
  unit_label?: string
  direction?: 'higher_better' | 'lower_better'
  input_type?: 'number' | 'currency' | 'percentage' | 'boolean'
  perspective_key?: 'financial' | 'customer' | 'internal' | 'learning'
  score_5?: number
  score_4?: number
  score_3?: number
  score_2?: number
  score_1?: number
  sub_criteria?: BSCSubCriteriaInfo[]
}

export interface BSCCriteriaScore {
  key: BSCCriteriaKey
  name: string
  weight: number
  converted_score: number // Điểm quy đổi từ 1 đến 5 (0 nếu không đạt mốc lợi nhuận đối với doanh thu)
  raw_value_label: string // Hiển thị giá trị gốc (VD: "Đạt 103% target", "2.5% hao hụt", "7 điểm lỗi", "84 điểm KH")
  weighted_score: number  // converted_score * weight
  note?: string
}

export interface BSCBonusTier {
  id: string
  min_score: number       // VD: 4.8
  max_score: number       // VD: 5.0
  bonus_percent: number   // VD: 120 (% thưởng của Quỹ Nền)
  label: string           // VD: 'Xuất Sắc (Thưởng 120%)'
  badge_color: string     // CSS styling color
}

export interface BSCCriteriaThresholdRule {
  criteria_key: BSCCriteriaKey
  criteria_name: string
  unit_label: string
  score_5: number // mốc đạt 5 điểm
  score_4: number // mốc đạt 4 điểm
  score_3: number // mốc đạt 3 điểm
  score_2: number // mốc đạt 2 điểm
  score_1: number // mốc đạt 1 điểm
}

export interface BSCPositionMultiplier {
  role_key: string
  role_title: string
  multiplier: number // VD: 1.5 cho Quản Lý, 1.2 cho Trưởng Ca
  description: string
}

export interface BSCDeductionPolicy {
  use_tiered_personal_multiplier: boolean // Mặc định true: 0-1đ = 1.0, 2-3đ = 0.8, 4-5đ = 0.5, >=6đ = 0.0
  penalty_pct_per_error_point: number // VD: 5 (% giảm nếu dùng chế độ tuyến tính)
  unallocated_pool_mode: 'retain_company' | 'redistribute_top_performers'
  max_penalty_cap_pct: number // Mức giảm thưởng tối đa (VD: 100%)
}

export interface BSCSafetySettings {
  lock_bonus_if_below_profit_threshold: boolean // Khóa thưởng 0đ nếu doanh thu < mốc hòa vốn
  zero_score_on_critical_op_error: boolean // Vận hành = 0đ nếu có lỗi đặc biệt nghiêm trọng
  fallback_qr_only_if_no_review: boolean // Tự lấy 100% QR nếu không có bài review phản ánh
  customer_qr_weight_pct: number // VD: 50 (% trọng số cho QR Feedback)
  customer_review_weight_pct: number // VD: 50 (% trọng số cho Đánh giá phản ánh)
  min_qr_feedback_count: number // Mốc số lượng QR tối thiểu/tháng (Mặc định 30)
}

export interface BSCStoreResult {
  store_id: string
  store_name: string
  period: BSCPeriod
  revenue_target: BSCRevenueTarget
  criteria_scores: BSCCriteriaScore[]
  total_bsc_score: number // Tổng điểm BSC (thang 5.0)
  bsc_coefficient: number // Hệ số BSC (0, 0.4, 0.7, 1.0, 1.2)
  coefficient_label: string // '0%', '40%', '70%', '100%', '120%'
  base_bonus_pool: number   // 1% * actual_revenue_monthly
  store_bonus_pool: number  // base_bonus_pool * bsc_coefficient
  evaluated_at: string
  is_bsc_locked?: boolean   // Trạng thái khóa BSC toàn cửa hàng
  bsc_lock_reason?: string
}

// ═══════════════════════════════════
// 3. LỖI VẬN HÀNH & LỖI CÁ NHÂN (ENTERPRISE PRECISION)
// ═══════════════════════════════════

export type BSCApprovalStatus =
  | 'draft'            // Nháp (Quản lý mới tạo, chưa gửi)
  | 'pending_proof'    // Chờ xác minh (Thiếu bằng chứng)
  | 'pending_appeal'   // Chờ NV giải trình (Đang trong 48h)
  | 'proposed_manager' // Quản lý đề xuất (Đã xác nhận)
  | 'approved_ceo'     // CEO duyệt (Tính chính thức vào BSC)
  | 'rejected_ceo'     // CEO từ chối (Không tính)
  | 'cancelled'        // Đã hủy lỗi (Ghi nhầm / không đủ căn cứ)

export type BSCSourceType =
  | 'internal'         // Kiểm tra nội bộ ca làm
  | 'customer'         // Khách hàng phản ánh trực tiếp
  | 'grab'             // Đơn hàng GrabFood
  | 'shopeefood'       // Đơn hàng ShopeeFood
  | 'google_review'    // Đánh giá Google Maps
  | 'camera'           // Trích xuất camera cửa hàng
  | 'pos'              // Hệ thống máy bán hàng POS

export interface BSCSubErrorItem {
  id: string
  group_key: string
  code: string
  name: string
  suggested_points: number
  severity: 'minor' | 'medium' | 'major' | 'critical'
  description?: string
}

export type BSCOperationGroup =
  | 'lam_don'
  | 'kiem_giao_don'
  | 'dong_goi'
  | 'lam_lai_do_bo'
  | 'chuan_bi_ca'
  | 'checklist_quy_trinh'
  | 'quay_pha_che'
  | 'cuoi_ca_ban_giao'
  | 'trung_thuc_du_lieu'
  | 'attp'
  | (string & {})

export interface BSCOperationErrorRecord {
  id: string
  event_id: string // Mã sự kiện duy nhất (VD: ERR-HBP-202607-0001)
  store_id: string
  period: BSCPeriod
  shift_name?: 'Ca Sáng (06:00 - 14:00)' | 'Ca Chiều (14:00 - 22:00)' | 'Ca Tối (22:00 - 06:00)' | string
  event_category?: 'operation_store' | 'personal' | 'customer_feedback' | 'critical'
  group: BSCOperationGroup
  group_name: string
  sub_error_id?: string
  sub_error_name?: string
  example: string
  points: number // Số điểm lỗi
  occurred_at: string
  note?: string
  source_type?: BSCSourceType
  order_code?: string
  evidence_type?: 'order_code' | 'image' | 'camera' | 'customer_chat' | 'verifier_confirm'
  evidence_url?: string
  evidence_note?: string
  verifier_name?: string
  scope_reason?: string
  // Cờ chống tính trùng lỗi 5 lớp (Double Penalty Protection)
  affects_op_score?: boolean
  affects_customer_score?: boolean
  affects_personal_multiplier?: boolean
  locks_personal_bonus?: boolean
  approval_status?: BSCApprovalStatus
}

export type BSCPersonalErrorGroup =
  | 'gio_lam_cham_cong'
  | 'dong_phuc_tac_phong'
  | 'phoi_hop_ca'
  | 'khong_lam_phan_cong'
  | 'thai_do_khach'
  | 'trung_thuc_du_lieu'
  | 've_sinh_ca_nhan'
  | 'tai_san_tien'
  | 'ngon_tu_on'
  | (string & {})

export interface BSCPersonalErrorRecord {
  id: string
  event_id: string // Mã sự kiện duy nhất (VD: ERR-PERS-202607-0002)
  employee_id: string
  period: BSCPeriod
  shift_name?: 'Ca Sáng (06:00 - 14:00)' | 'Ca Chiều (14:00 - 22:00)' | 'Ca Tối (22:00 - 06:00)' | string
  event_category?: 'operation_store' | 'personal' | 'customer_feedback' | 'critical'
  group: BSCPersonalErrorGroup
  group_name: string
  sub_error_id?: string
  sub_error_name?: string
  example: string
  impact: string
  points: number // Số điểm lỗi
  is_serious: boolean // Lỗi nghiêm trọng (khóa thưởng)
  occurred_at: string
  note?: string
  source_type?: BSCSourceType
  order_code?: string
  evidence_type?: 'order_code' | 'image' | 'camera' | 'customer_chat' | 'verifier_confirm'
  evidence_url?: string
  evidence_note?: string
  verifier_name?: string
  scope_reason?: string
  // Cờ chống tính trùng lỗi 5 lớp (Double Penalty Protection)
  affects_op_score?: boolean
  affects_customer_score?: boolean
  affects_personal_multiplier?: boolean
  locks_personal_bonus?: boolean
  approval_status?: BSCApprovalStatus
}

// ═══════════════════════════════════
// 4. CHIA THƯỞNG CÁ NHÂN
// ═══════════════════════════════════

export interface BSCIndividualResult {
  employee_id: string
  employee_name: string
  role: string
  level_label: string
  store_id: string
  period: BSCPeriod
  work_hours: number              // Số giờ làm thực tế trong tháng
  min_hours_required: number      // Mặc định 110h theo Excel
  is_eligible_hours: boolean      // work_hours >= min_hours_required
  rank_coefficient: number        // 1.0 (Staff), 1.2 (Senior), 1.5 (Shift Leader), 2.0 (Store Manager)
  personal_error_count: number    // Tổng điểm lỗi cá nhân
  has_serious_error: boolean      // Lỗi nghiêm trọng
  personal_coefficient: number    // 1.0 (0-1 lỗi), 0.8 (2-3 lỗi), 0.5 (4-5 lỗi), 0 (>=6 lỗi hoặc lỗi nặng)
  personal_share_points: number   // work_hours * rank_coefficient * personal_coefficient
  share_percentage: number        // (personal_share_points / total_team_share_points) * 100
  bonus_amount: number            // store_bonus_pool * share_percentage / 100
  lock_reason?: string            // Lý do không được thưởng (VD: <110h, lỗi >=6...)
}

// ═══════════════════════════════════
// 5. TỔNG HỢP DUYỆT / XEM
// ═══════════════════════════════════

export interface BSCTeamBonusSummary {
  store_id: string
  store_name: string
  period: BSCPeriod
  store_result: BSCStoreResult
  total_team_hours: number
  total_team_share_points: number
  eligible_employee_count: number
  total_employee_count: number
  total_distributed_bonus_amount: number // Tổng thưởng thực chi
  retained_bonus_amount: number          // Phần thưởng giữ lại (không chi)
  individual_results: BSCIndividualResult[]
}

// ═══════════════════════════════════
// 6. THỐNG KÊ THÔ & DỮ LIỆU CÁ NHÂN
// ═══════════════════════════════════

export interface BSCStoreRawMetrics {
  store_id: string
  period: BSCPeriod
  waste_percentage: number // Tỷ lệ % hao hụt (VD: 2.5)
  operation_error_points: number // Tổng điểm lỗi vận hành (VD: 7)
  customer_qr_score: number // 0-100 (VD: 86)
  customer_review_score: number // 0-100 (VD: 82)
}

export interface BSCEmployeePersonalData {
  employee_id: string
  employee_name: string
  role: string
  store_id: string
  period: BSCPeriod
  work_hours: number
  errors: BSCPersonalErrorRecord[]
}

// ═══════════════════════════════════
// 7. LỘ TRÌNH TRIỂN KHAI THEO TỪNG THÁNG (PROGRESSIVE ROLLOUT ROADMAP)
// ═══════════════════════════════════

export interface BSCRoadmapMilestone {
  id: string
  phase_number: number
  phase_name: string
  applied_month: string // e.g. "2026-07"
  month_label: string // e.g. "Tháng 07/2026"
  target_mode?: 'percent' | 'fixed_daily' // 'percent' = % so với target chuẩn, 'fixed_daily' = Số tiền cố định cụ thể VNĐ/ngày
  target_revenue_rate_pct?: number // e.g. 90 (90% target)
  target_revenue_daily_fixed?: number // e.g. 7200000 (7.2tr VNĐ/ngày)
  profit_threshold_daily: number // e.g. 6000000 (nới lỏng mốc hòa vốn)
  penalty_leniency_pct: number // e.g. 50 (giảm 50% điểm phạt)
  exempt_minor_errors: boolean // Miễn trừ lỗi nhỏ (đi trễ <15p, quên thẻ)
  bonus_pool_boost_pct: number // Thưởng trợ lực thêm (e.g. 0% hoặc 10%)
  title_badge: string // e.g. "Khởi động & Làm quen"
  staff_impact_summary: string
  description: string
  status: 'active' | 'upcoming' | 'completed'
}

