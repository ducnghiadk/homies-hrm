// =============================================
// Homies Milk Tea 🧋 — BSC Bonus Mock Data
// Dữ liệu mẫu chuẩn cho chính sách BSC Homies
// =============================================

import type {
  BSCCriteriaInfo,
  BSCRevenueTarget,
  BSCOperationErrorRecord,
  BSCPersonalErrorRecord,
  BSCBonusTier,
  BSCCriteriaThresholdRule,
  BSCPositionMultiplier,
  BSCDeductionPolicy,
  BSCSafetySettings,
  BSCSubErrorItem,
  BSCStoreRawMetrics,
  BSCEmployeePersonalData,
  BSCRoadmapMilestone,
} from './bsc-types'

// ═══════════════════════════════════
// 1. CATALOG 4 TIÊU CHÍ BSC & LỖI CHI TIẾT 2 TẦNG
// ═══════════════════════════════════

export const bscSubErrorCatalog: BSCSubErrorItem[] = [
  // Lỗi Cá Nhân - Giờ làm & Chấm công (gio_lam_cham_cong)
  { id: 'sub-pers-01', group_key: 'gio_lam_cham_cong', code: 'ATT-01', name: 'Đi trễ / về sớm dưới 15 phút', suggested_points: 1, severity: 'minor', description: 'Trừ 1 điểm lỗi cá nhân' },
  { id: 'sub-pers-02', group_key: 'gio_lam_cham_cong', code: 'ATT-02', name: 'Đi trễ / về sớm từ 15 đến 30 phút', suggested_points: 2, severity: 'medium', description: 'Trừ 2 điểm lỗi cá nhân' },
  { id: 'sub-pers-03', group_key: 'gio_lam_cham_cong', code: 'ATT-03', name: 'Đi trễ quá 30 phút', suggested_points: 3, severity: 'major', description: 'Trừ 3 điểm lỗi cá nhân' },
  { id: 'sub-pers-04', group_key: 'gio_lam_cham_cong', code: 'ATT-04', name: 'Bỏ ca không phép / Vắng mặt no-show', suggested_points: 5, severity: 'critical', description: 'Trừ 5 điểm hoặc Khóa thưởng' },

  // Lỗi Cá Nhân - Đồng phục & tác phong (dong_phuc_tac_phong)
  { id: 'sub-pers-05', group_key: 'dong_phuc_tac_phong', code: 'UNI-01', name: 'Quên đeo bảng tên / nón / tạp dề', suggested_points: 1, severity: 'minor', description: 'Trừ 1 điểm lỗi cá nhân' },
  { id: 'sub-pers-06', group_key: 'dong_phuc_tac_phong', code: 'UNI-02', name: 'Đồng phục bẩn, không đúng quy định Homies', suggested_points: 1, severity: 'minor', description: 'Trừ 1 điểm lỗi cá nhân' },
  { id: 'sub-pers-06b', group_key: 'dong_phuc_tac_phong', code: 'UNI-03', name: 'Sơn móng tay / để móng tay dài khi pha chế', suggested_points: 2, severity: 'medium', description: 'Trừ 2 điểm lỗi cá nhân' },

  // Lỗi Cá Nhân - Thái độ & Giao tiếp (thai_do_khach)
  { id: 'sub-pers-07', group_key: 'thai_do_khach', code: 'ATT-05', name: 'Thái độ cộc lốc với khách / tài xế app', suggested_points: 2, severity: 'medium', description: 'Trừ 2 điểm lỗi cá nhân' },
  { id: 'sub-pers-08', group_key: 'thai_do_khach', code: 'ATT-06', name: 'Chửi thề, gây mất trật tự trong ca làm', suggested_points: 3, severity: 'major', description: 'Trừ 3 điểm lỗi cá nhân' },

  // Lỗi Cá Nhân - Tập trung trong ca (tap_trung_trong_ca)
  { id: 'sub-pers-09', group_key: 'tap_trung_trong_ca', code: 'FOC-01', name: 'Sử dụng điện thoại cá nhân trong ca làm', suggested_points: 1, severity: 'minor', description: 'Trừ 1 điểm lỗi cá nhân' },
  { id: 'sub-pers-10', group_key: 'tap_trung_trong_ca', code: 'FOC-02', name: 'Bỏ vị trí trực quầy / Tụ tập nói chuyện riêng', suggested_points: 2, severity: 'medium', description: 'Trừ 2 điểm lỗi cá nhân' },

  // Lỗi Cá Nhân - Thực hiện checklist phân công (thuc_hien_checklist_giao)
  { id: 'sub-pers-11', group_key: 'thuc_hien_checklist_giao', code: 'CHK-01', name: 'Bỏ sót nhiệm vụ được trưởng ca giao', suggested_points: 1, severity: 'minor', description: 'Trừ 1 điểm lỗi cá nhân' },
  { id: 'sub-pers-12', group_key: 'thuc_hien_checklist_giao', code: 'CHK-02', name: 'Làm qua loa công việc vệ sinh khu vực được giao', suggested_points: 2, severity: 'medium', description: 'Trừ 2 điểm lỗi cá nhân' },

  // Lỗi Cá Nhân - Vệ sinh cá nhân (ve_sinh_ca_nhan)
  { id: 'sub-pers-13', group_key: 've_sinh_ca_nhan', code: 'HYG-01', name: 'Không rửa tay trước khi làm topping / pha chế', suggested_points: 1, severity: 'minor', description: 'Trừ 1 điểm lỗi cá nhân' },

  // Lỗi Cá Nhân - Bảo quản tài sản (bao_quan_tai_san)
  { id: 'sub-pers-14', group_key: 'bao_quan_tai_san', code: 'AST-01', name: 'Làm hỏng dụng cụ pha chế do bất cẩn', suggested_points: 2, severity: 'medium', description: 'Trừ 2 điểm lỗi cá nhân' },
  { id: 'sub-pers-15', group_key: 'bao_quan_tai_san', code: 'AST-02', name: 'Sai lệch két tiền thu ngân do bất cẩn', suggested_points: 2, severity: 'medium', description: 'Trừ 2 điểm lỗi cá nhân' },

  // Lỗi Cá Nhân - Trung thực & dữ liệu (trung_thuc_minh_bach)
  { id: 'sub-pers-16', group_key: 'trung_thuc_minh_bach', code: 'HON-01', name: 'Uống nước free không quẹt POS', suggested_points: 2, severity: 'medium', description: 'Trừ 2 điểm lỗi cá nhân' },
  { id: 'sub-pers-17', group_key: 'trung_thuc_minh_bach', code: 'HON-02', name: 'Che giấu lỗi / Báo cáo sai số lượng', suggested_points: 3, severity: 'major', description: 'Trừ 3 điểm lỗi cá nhân' },

  // Lỗi Cá Nhân - Nghiêm trọng (nghiem_trong_ca_nhan)
  { id: 'sub-pers-18', group_key: 'nghiem_trong_ca_nhan', code: 'HON-03', name: 'Xúc phạm khách / Trộm cắp tiền két', suggested_points: 6, severity: 'critical', description: 'Khóa 0đ thưởng cá nhân' },

  // -------------------------------------------------------------
  // Lỗi Vận Hành - Làm đơn & Công thức (lam_don)
  { id: 'sub-op-01', group_key: 'lam_don', code: 'OP-01', name: 'Pha sai đường / đá / sai size', suggested_points: 1, severity: 'minor', description: 'Trừ 1 điểm vận hành ca' },
  { id: 'sub-op-02', group_key: 'lam_don', code: 'OP-02', name: 'Pha sai món đã giao khách (phải làm lại)', suggested_points: 2, severity: 'medium', description: 'Trừ 2 điểm vận hành ca' },
  { id: 'sub-op-02b', group_key: 'lam_don', code: 'OP-02b', name: 'Đun trà bị chát / khét làm hỏng cốt trà', suggested_points: 2, severity: 'medium', description: 'Trừ 2 điểm vận hành ca' },

  // Lỗi Vận Hành - Kiểm đơn & Giao đơn (kiem_giao_don)
  { id: 'sub-op-03', group_key: 'kiem_giao_don', code: 'OP-03', name: 'Thiếu món / thiếu topping đơn app', suggested_points: 2, severity: 'medium', description: 'Trừ 2 điểm vận hành ca' },
  { id: 'sub-op-03b', group_key: 'kiem_giao_don', code: 'OP-03b', name: 'Giao nhầm đơn tài xế Grab / ShopeeFood', suggested_points: 2, severity: 'medium', description: 'Trừ 2 điểm vận hành ca' },

  // Lỗi Vận Hành - Đóng gói (dong_goi_giao_app & dong_goi)
  { id: 'sub-op-04', group_key: 'dong_goi_giao_app', code: 'OP-04', name: 'Bung nắp / rò rỉ ly khi tài xế nhận', suggested_points: 2, severity: 'medium', description: 'Trừ 2 điểm vận hành ca' },
  { id: 'sub-op-04b', group_key: 'dong_goi', code: 'OP-04b', name: 'Không dán băng keo nắp ly rò rỉ / Dán tem sai ly', suggested_points: 1, severity: 'minor', description: 'Trừ 1 điểm vận hành ca' },

  // Lỗi Vận Hành - Thu ngân & POS (thu_ngan_pos)
  { id: 'sub-op-07', group_key: 'thu_ngan_pos', code: 'POS-01', name: 'Gõ sai món / size trên máy POS', suggested_points: 1, severity: 'minor', description: 'Trừ 1 điểm vận hành ca' },
  { id: 'sub-op-08', group_key: 'thu_ngan_pos', code: 'POS-02', name: 'Thối thiếu / nhầm tiền khách', suggested_points: 2, severity: 'medium', description: 'Trừ 2 điểm vận hành ca' },

  // Lỗi Vận Hành - Checklist & Quy trình ca (checklist_quy_trinh)
  { id: 'sub-op-09', group_key: 'checklist_quy_trinh', code: 'SOP-01', name: 'Tick dối / sót checklist mở - đóng cửa', suggested_points: 1, severity: 'minor', description: 'Trừ 1 điểm vận hành ca' },
  { id: 'sub-op-10', group_key: 'checklist_quy_trinh', code: 'SOP-02', name: 'Quên kiểm tra nhiệt độ tủ mát bảo quản', suggested_points: 1, severity: 'minor', description: 'Trừ 1 điểm vận hành ca' },

  // Lỗi Vận Hành - ATTP & Tem Date (attp_tem_date)
  { id: 'sub-op-05', group_key: 'attp_tem_date', code: 'OP-05', name: 'Sử dụng nguyên liệu hết hạn / không dán date', suggested_points: 5, severity: 'critical', description: 'Trạng thái Khóa BSC - CEO duyệt' },
  { id: 'sub-op-05b', group_key: 'attp_tem_date', code: 'OP-05b', name: 'Không dán tem Date khay topping / Vi phạm FIFO', suggested_points: 2, severity: 'medium', description: 'Trừ 2 điểm vận hành ca' },

  // Lỗi Vận Hành - QC Định lượng & Thao tác (qc_pouring)
  { id: 'sub-op-11', group_key: 'qc_pouring', code: 'QC-01', name: 'Đong thiếu / thừa siro đường sai công thức', suggested_points: 1, severity: 'minor', description: 'Trừ 1 điểm vận hành ca' },

  // Lỗi Vận Hành - Vệ sinh 5S (ve_sinh_5s)
  { id: 'sub-op-12', group_key: 've_sinh_5s', code: '5S-01', name: 'Vòi sục sữa dính bẩn / Sàn đọng nước', suggested_points: 1, severity: 'minor', description: 'Trừ 1 điểm vận hành ca' },

  // Lỗi Vận Hành - Cuối ca bàn giao (cuoi_ca_ban_giao)
  { id: 'sub-op-13', group_key: 'cuoi_ca_ban_giao', code: 'HAND-01', name: 'Bàn giao thiếu tiền lẻ két / Quên tắt bếp', suggested_points: 1, severity: 'minor', description: 'Trừ 1 điểm vận hành ca' },

  // Lỗi Vận Hành - QA Audit Cửa hàng (qa_audit_store)
  { id: 'sub-op-14', group_key: 'qa_audit_store', code: 'AUD-01', name: 'Bảng điểm QA Audit cửa hàng dưới 80đ', suggested_points: 3, severity: 'major', description: 'Trừ 3 điểm vận hành ca' },

  // Lỗi Vận Hành - Nghiêm trọng ATTP (critical_attp)
  { id: 'sub-op-06', group_key: 'critical_attp', code: 'OP-06', name: 'Có dị vật trong ly (Tóc, Ruồi, Vật thể lạ)', suggested_points: 5, severity: 'critical', description: 'Trạng thái Khóa BSC - CEO duyệt' },
]

export const bscCriteriaCatalog: BSCCriteriaInfo[] = [
  {
    key: 'revenue',
    name: 'Doanh thu',
    weight: 0.40,
    weight_percent_label: '40%',
    description: 'Doanh thu so với target tháng.',
    how_to_excel: 'Làm đơn đúng, nhanh, hỗ trợ bán hàng, giữ trải nghiệm để khách quay lại.',
    icon: 'TrendingUp',
    color: '#2F6FA8',
    direction: 'higher_better',
    unit_label: '% Target',
    score_5: 110,
    score_4: 100,
    score_3: 95,
    score_2: 85,
    score_1: 81,
  },
  {
    key: 'waste',
    name: 'Hao hụt',
    weight: 0.20,
    weight_percent_label: '20%',
    description: 'Chênh lệch giữa định mức và thực tế sử dụng nguyên liệu.',
    how_to_excel: 'Đong đúng, làm đúng công thức, ghi nhận làm lại/đổ bỏ.',
    icon: 'Package',
    color: '#1E9E57',
    direction: 'lower_better',
    unit_label: '% Hao hụt',
    score_5: 2.0,
    score_4: 3.0,
    score_3: 4.0,
    score_2: 5.0,
    score_1: 6.0,
  },
  {
    key: 'operation',
    name: 'Vận hành',
    weight: 0.25,
    weight_percent_label: '25%',
    description: 'Tổng điểm lỗi sai đơn, thiếu đồ, đóng gói, checklist, bàn giao trong tháng.',
    how_to_excel: 'Kiểm đơn trước khi giao, quầy sạch gọn, báo lỗi rõ.',
    icon: 'Settings',
    color: '#D97706',
    direction: 'lower_better',
    unit_label: 'Điểm lỗi',
    score_5: 4,
    score_4: 8,
    score_3: 12,
    score_2: 15,
    score_1: 20,
  },
  {
    key: 'customer',
    name: 'Khách hàng',
    weight: 0.15,
    weight_percent_label: '15%',
    description: 'Tổng điểm khảo sát QR (50%) + phản ánh nền tảng có nội dung (50%).',
    how_to_excel: 'Thái độ tốt, đóng gói chắc, xử lý phản ánh lịch sự.',
    icon: 'Users',
    color: '#2F6FA8',
    direction: 'higher_better',
    unit_label: 'Điểm KH',
    score_5: 90,
    score_4: 80,
    score_3: 70,
    score_2: 60,
    score_1: 50,
    sub_criteria: [
      {
        key: 'qr_feedback',
        name: '1. Khảo sát QR Feedback bàn',
        weight_pct: 50,
        unit_label: 'Điểm QR',
        direction: 'higher_better',
        input_type: 'number',
        score_5: 90,
        score_4: 80,
        score_3: 70,
        score_2: 60,
        score_1: 50,
        description: 'Quét mã QR tại bàn cho đánh giá',
      },
      {
        key: 'direct_review',
        name: '2. Đánh giá trực tiếp & CSKH',
        weight_pct: 50,
        unit_label: 'Điểm Đánh Giá',
        direction: 'higher_better',
        input_type: 'number',
        score_5: 90,
        score_4: 80,
        score_3: 70,
        score_2: 60,
        score_1: 50,
        description: 'Đánh giá phản ánh trực tiếp từ khách hàng',
      },
    ],
  },
]

export const bscOperationErrorGroups = [
  { key: 'lam_don', name: '1. Pha chế & Công thức Trà sữa', points: 1, examples: ['Pha sai % đường/đá', 'Nhầm topping/thiếu topping', 'Đun trà bị chát khét'] },
  { key: 'dong_goi_giao_app', name: '2. Đóng gói & Giao Shipper (App)', points: 1, examples: ['Không dán băng keo nắp ly gây rò rỉ', 'Dán tem sai ly', 'Giao lộn đơn tài xế'] },
  { key: 'thu_ngan_pos', name: '3. Thu ngân & Nhập POS', points: 1, examples: ['Gõ sai món/size trên POS', 'Thối thiếu/nhầm tiền', 'Không in/xé bill dán ly'] },
  { key: 'checklist_quy_trinh', name: '4. Checklist & Quy trình Ca (SOP)', points: 1, examples: ['Tick dối/sót checklist mở-đóng cửa', 'Bỏ sót kiểm tra nhiệt độ tủ mát', 'Quên bật thiết bị'] },
  { key: 'attp_tem_date', name: '5. ATTP & Dán tem Date (FIFO)', points: 2, examples: ['Không dán tem Date khay topping', 'Sử dụng trần châu quá 4h', 'Vi phạm nguyên tắc FIFO'] },
  { key: 'qc_pouring', name: '6. QC Định lượng & Thao tác pha', points: 1, examples: ['Đong thiếu/thừa siro đường', 'Múc thiếu trần châu so với ca chuẩn', 'Đánh bọt quá tay phải hủy'] },
  { key: 've_sinh_5s', name: '7. Vệ sinh 5S Quầy bar & Sàn nhà', points: 1, examples: ['Vòi sục sữa dính bẩn', 'Sàn nhà quầy bar đọng nước trơn trượt', 'Không đậy nắp khay nguyên liệu'] },
  { key: 'cuoi_ca_ban_giao', name: '8. Cuối ca & Bàn giao két/hàng', points: 1, examples: ['Bàn giao thiếu tiền lẻ két', 'Không ghi chép cốt trà tồn', 'Quên tắt bếp đun trần châu'] },
  { key: 'qa_audit_store', name: '9. QA Audit Cửa hàng (Chấm điểm chuỗi)', points: 3, examples: ['Bảng điểm QA Audit dưới 80đ', 'Vi phạm tiêu chuẩn trưng bày chuỗi'] },
  { key: 'critical_attp', name: '10. Lỗi Đặc Biệt Nghiêm Trọng (Dị vật/ATTP)', points: 5, is_critical: true, examples: ['Có dị vật trong ly (Tóc, Ruồi)', 'Vi phạm ATTP nặng (Khóa 0đ Vận Hành)'] },
]

export const bscPersonalErrorGroups = [
  { key: 'gio_lam_cham_cong', name: '1. Kỷ luật Giờ làm & Chấm công', points: 1, examples: ['Đi trễ/về sớm <15 phút', 'Quên check-in/out', 'Đi trễ quá 30 phút (3đ)'] },
  { key: 'dong_phuc_tac_phong', name: '2. Đồng phục & Diện mạo Quầy bar', points: 1, examples: ['Quên nón/tạp dề', 'Đồng phục không đúng chuẩn', 'Móng tay dài/sơn móng khi pha chế'] },
  { key: 'thai_do_khach', name: '3. Thái độ Phục vụ & Giao tiếp', points: 2, examples: ['Cằn nhằn với khách/tài xế App', 'Nói chuyện cộc lốc', 'Khách phản ánh thái độ'] },
  { key: 'tap_trung_trong_ca', name: '4. Tập trung & Kỷ luật trong ca', points: 1, examples: ['Dùng điện thoại cá nhân trong ca', 'Tụ tập nói chuyện riêng chậm đơn', 'Bỏ vị trí trực'] },
  { key: 'thuc_hien_checklist_giao', name: '5. Thực hiện Checklist phân công', points: 1, examples: ['Bỏ sót vệ sinh khu vực được giao', 'Làm qua loa công việc trưởng ca phân công'] },
  { key: 've_sinh_ca_nhan', name: '6. Vệ sinh cá nhân & An toàn', points: 1, examples: ['Không rửa tay trước khi chế biến', 'Để tóc xõa khi làm topping'] },
  { key: 'bao_quan_tai_san', name: '7. Bảo quản Tài sản & Dụng cụ quầy', points: 2, examples: ['Làm hỏng dụng cụ pha chế', 'Sai lệch két thu ngân do bất cẩn'] },
  { key: 'trung_thuc_minh_bach', name: '8. Trung thực & Minh bạch', points: 3, examples: ['Gian lận ca làm', 'Báo cáo sai số lượng', 'Uống nước free không qua POS'] },
  { key: 'nghiem_trong_ca_nhan', name: '9. Lỗi Đặc biệt nghiêm trọng (Khóa 0đ cá nhân)', points: 6, is_serious: true, examples: ['Xúc phạm khách/đồng nghiệp', 'Trộm cắp/Gian lận két tiền (Hệ số 0)'] },
]

// ═══════════════════════════════════
// 2. TARGET DOANH THU & KẾT QUẢ THỰC TẾ
// ═══════════════════════════════════

export const mockBSCRevenueTargets: BSCRevenueTarget[] = [
  {
    store_id: 'store-001',
    store_name: 'Homies Hồ Bá Phấn',
    period: '2026-07',
    profit_threshold_daily: 6500000,
    avg_3_6_months_daily: 7000000,
    target_daily: 8000000,
    target_monthly: 248000000, // 8tr * 31 ngày
    days_in_month: 31,
    actual_revenue_monthly: 255440000, // 8.24tr/ngày -> đạt 103% target
    actual_revenue_daily: 8240000,
    is_unlocked: true,
    cogs_budget: 85000000,
    cogs_actual: 87125000, // (87.125m - 85m)/85m = 2.5% hao hụt
    has_attp_foreign_body: false,
    min_hours_threshold: 110,
    retain_deducted_bonus: true,
    approval_status: 'approved_published',
    approved_by: 'CEO Nguyễn Văn A',
    approved_at: '2026-08-01 10:00',
  },
  // Hồ Bá Phấn - Tháng 6/2026 (Đạt điều kiện)
  {
    store_id: 'store-001',
    store_name: 'Homies Hồ Bá Phấn',
    period: '2026-06',
    profit_threshold_daily: 6500000,
    avg_3_6_months_daily: 6900000,
    target_daily: 8000000,
    target_monthly: 240000000,
    days_in_month: 30,
    actual_revenue_monthly: 249600000, // 8.32tr/ngày
    actual_revenue_daily: 8320000,
    is_unlocked: true,
    cogs_budget: 80000000,
    cogs_actual: 81600000,
    has_attp_foreign_body: false,
    min_hours_threshold: 110,
    retain_deducted_bonus: true,
    approval_status: 'approved_published',
    approved_by: 'CEO Nguyễn Văn A',
    approved_at: '2026-07-01 09:30',
  },
  // Hồ Bá Phấn - Tháng 5/2026 (Không đạt mốc hòa vốn - ví dụ để test lock)
  {
    store_id: 'store-001',
    store_name: 'Homies Hồ Bá Phấn',
    period: '2026-05',
    profit_threshold_daily: 6500000,
    avg_3_6_months_daily: 6500000,
    target_daily: 7500000,
    target_monthly: 232500000,
    days_in_month: 31,
    actual_revenue_monthly: 186000000, // 6.0tr/ngày -> Dưới mốc 6.5tr
    actual_revenue_daily: 6000000,
    is_unlocked: false,
    cogs_budget: 70000000,
    cogs_actual: 73500000,
    has_attp_foreign_body: false,
    min_hours_threshold: 110,
    retain_deducted_bonus: true,
    approval_status: 'approved_published',
    approved_by: 'CEO Nguyễn Văn A',
    approved_at: '2026-06-01 11:00',
  },
  // Chi nhánh 429 - Tháng 7/2026 (Sẵn sàng nhập liệu mới)
  {
    store_id: 'store-002',
    store_name: 'Homies Chi nhánh 429',
    period: '2026-07',
    profit_threshold_daily: 6500000,
    target_daily: 7500000,
    target_monthly: 232500000,
    days_in_month: 31,
    actual_revenue_monthly: 0,
    actual_revenue_daily: 0,
    is_unlocked: false,
    cogs_budget: 0,
    cogs_actual: 0,
    has_attp_foreign_body: false,
    min_hours_threshold: 110,
    retain_deducted_bonus: true,
    approval_status: 'draft',
  },
]

// ═══════════════════════════════════
// 3. THỐNG KÊ CHI TIẾT TỪNG TIÊU CHÍ THEO STORE & PERIOD
// ═══════════════════════════════════

export const mockBSCStoreRawMetrics: BSCStoreRawMetrics[] = [
  {
    store_id: 'store-001',
    period: '2026-07',
    waste_percentage: 2.5, // 2.5% -> 4 điểm
    operation_error_points: 7, // 7 điểm -> 4 điểm (mức 5-8 lỗi)
    customer_qr_score: 86,
    customer_review_score: 82, // TB = 84 -> 4 điểm
  },
  {
    store_id: 'store-001',
    period: '2026-06',
    waste_percentage: 1.8, // <2% -> 5 điểm
    operation_error_points: 3, // 0-4 lỗi -> 5 điểm
    customer_qr_score: 92,
    customer_review_score: 90, // TB = 91 -> 5 điểm
  },
  {
    store_id: 'store-001',
    period: '2026-05',
    waste_percentage: 4.2, // 4-5% -> 2 điểm
    operation_error_points: 14, // 13-15 -> 2 điểm
    customer_qr_score: 70,
    customer_review_score: 68, // TB = 69 -> 2 điểm
  },
  {
    store_id: 'store-002',
    period: '2026-07',
    waste_percentage: 0,
    operation_error_points: 0,
    customer_qr_score: 0,
    customer_review_score: 0,
  },
]

// ═══════════════════════════════════
// 4. DANH SÁCH LỖI VẬN HÀNH CỬA HÀNG (MOCK LOG)
// ═══════════════════════════════════

export const mockBSCOperationErrors: BSCOperationErrorRecord[] = [
  {
    id: 'op-err-001',
    event_id: 'ERR-HBP-202607-0001',
    store_id: 'store-001',
    period: '2026-07',
    group: 'lam_don',
    group_name: '1. Làm đơn',
    sub_error_id: 'sub-op-01',
    sub_error_name: 'Pha sai đường / đá / sai size',
    example: 'Pha sai đường 50% thành 100% đơn Grab #1204',
    points: 1,
    occurred_at: '2026-07-05 14:20',
    source_type: 'grab',
    order_code: 'GRAB-1204',
    evidence_type: 'order_code',
    evidence_note: 'Đơn hàng Grab #1204 bị khách nhắn đính kèm trên App',
    approval_status: 'approved_ceo',
    affects_op_score: true,
  },
  {
    id: 'op-err-002',
    event_id: 'ERR-HBP-202607-0002',
    store_id: 'store-001',
    period: '2026-07',
    group: 'kiem_giao_don',
    group_name: '2. Kiểm đơn & giao đơn',
    sub_error_id: 'sub-op-03',
    sub_error_name: 'Thiếu món / thiếu topping đơn app',
    example: 'Thiếu trân trùng đen đơn ShopeeFood #8832',
    points: 1,
    occurred_at: '2026-07-09 18:30',
    source_type: 'shopeefood',
    order_code: 'SPF-8832',
    evidence_type: 'order_code',
    evidence_note: 'Khách nhắn đòi bồi thường topping 15.000đ',
    approval_status: 'proposed_manager',
    affects_op_score: true,
  },
  {
    id: 'op-err-003',
    event_id: 'ERR-HBP-202607-0003',
    store_id: 'store-001',
    period: '2026-07',
    group: 'dong_goi',
    group_name: '3. Đóng gói',
    sub_error_id: 'sub-op-04',
    sub_error_name: 'Bung nắp / rò rỉ ly khi tài xế nhận',
    example: 'Bung nắp ly trà sữa nướng khi tài xế nhận',
    points: 1,
    occurred_at: '2026-07-12 11:15',
    source_type: 'internal',
    evidence_type: 'image',
    evidence_note: 'Ảnh chụp ly trà sữa bị đổ bung nắp trên quầy',
    approval_status: 'approved_ceo',
    affects_op_score: true,
  },
  {
    id: 'op-err-004',
    event_id: 'ERR-HBP-202607-0004',
    store_id: 'store-001',
    period: '2026-07',
    group: 'lam_lai_do_bo',
    group_name: '4. Làm lại / đổ bỏ',
    example: 'Làm hỏng 2 ca trà ô long do đun quá thời gian',
    points: 1,
    occurred_at: '2026-07-16 09:40',
    source_type: 'internal',
    evidence_type: 'verifier_confirm',
    verifier_name: 'Trưởng Ca Lê Thị B',
    approval_status: 'approved_ceo',
    affects_op_score: true,
  },
  {
    id: 'op-err-005',
    event_id: 'ERR-HBP-202607-0005',
    store_id: 'store-001',
    period: '2026-07',
    shift_name: 'Ca Sáng (06:00 - 14:00)',
    event_category: 'operation_store',
    group: 'checklist_quy_trinh',
    group_name: '6. Checklist & quy trình ca',
    example: 'Ca sáng tick checklist mở cửa nhưng quên kiểm tra đá tủ',
    points: 1,
    occurred_at: '2026-07-20 07:15',
    source_type: 'internal',
    approval_status: 'proposed_manager',
    affects_op_score: true,
  },
  {
    id: 'op-err-012',
    event_id: 'ERR-HBP-202607-0012',
    store_id: 'store-001',
    period: '2026-07',
    shift_name: 'Ca Chiều (14:00 - 22:00)',
    event_category: 'operation_store',
    group: 'kiem_giao_don',
    group_name: '2. Kiểm đơn & giao đơn',
    sub_error_id: 'sub-op-03',
    sub_error_name: 'Thiếu topping trong đơn đã giao khách',
    example: 'Đơn #1204 thiếu topping trân châu. Khách phản ánh qua Zalo lúc 14:20. Camera xác minh nhân viên A không kiểm bill trước khi bàn giao đơn.',
    points: 2,
    occurred_at: '2026-07-25 14:20',
    source_type: 'grab',
    order_code: 'GRAB-1204',
    evidence_type: 'customer_chat',
    evidence_note: 'Khách nhắn Zalo lúc 14:20 + Video Camera mốc 14:15 ca chiều',
    verifier_name: 'Quản Lý Nguyễn Văn A',
    scope_reason: 'Đơn thiếu topping đã đến tay khách, khách nhắn Zalo và camera xác minh NV A không kiểm bill trước khi bàn giao.',
    approval_status: 'proposed_manager',
    affects_op_score: true,
    affects_customer_score: true,
    affects_personal_multiplier: true,
  },
]

export function findErrorEventByOrderCode(orderCode: string) {
  if (!orderCode || !orderCode.trim()) return null
  const code = orderCode.trim().toLowerCase()
  return mockBSCOperationErrors.find(e => e.order_code && e.order_code.toLowerCase() === code)
}

// ═══════════════════════════════════
// 5. GIỜ LÀM & LỖI CÁ NHÂN NHÂN VIÊN
// ═══════════════════════════════════

export const mockBSCEmployeeData: BSCEmployeePersonalData[] = [
  // ── STORE-001: HOMIES HỒ BÁ PHẤN ──
  {
    employee_id: 'emp-002', // Quản lý cửa hàng
    employee_name: 'Trần Thị Lan',
    role: 'store_manager',
    store_id: 'store-001',
    period: '2026-07',
    work_hours: 190,
    errors: [],
  },
  {
    employee_id: 'emp-004', // Tổ trưởng ca
    employee_name: 'Phạm Thị Hương',
    role: 'shift_leader',
    store_id: 'store-001',
    period: '2026-07',
    work_hours: 180,
    errors: [],
  },
  {
    employee_id: 'emp-005', // Pha chế chính
    employee_name: 'Võ Thanh Bình',
    role: 'senior_staff',
    store_id: 'store-001',
    period: '2026-07',
    work_hours: 160,
    errors: [
      {
        id: 'per-err-001',
        event_id: 'ERR-PERS-202607-0001',
        employee_id: 'emp-005',
        period: '2026-07',
        group: 'dong_phuc_tac_phong',
        group_name: 'Đồng phục & tác phong',
        sub_error_id: 'sub-pers-05',
        sub_error_name: 'Quên đeo bảng tên / nón / tạp dề',
        example: 'Quên đeo bảng tên 2 lần trong ca',
        impact: 'Giảm hệ số nhẹ (80% thưởng)',
        points: 2, // 2 điểm -> hệ số 0.8
        is_serious: false,
        occurred_at: '2026-07-10 08:30',
        source_type: 'camera',
        evidence_type: 'camera',
        evidence_note: 'Camera quầy thu ngân lúc 08:30 ca sáng',
        approval_status: 'approved_ceo',
        affects_personal_multiplier: true,
      },
    ],
  },
  {
    employee_id: 'emp-006', // Thu ngân
    employee_name: 'Nguyễn Thị Mai',
    role: 'employee',
    store_id: 'store-001',
    period: '2026-07',
    work_hours: 120,
    errors: [],
  },
  {
    employee_id: 'emp-007', // Phục vụ
    employee_name: 'Đỗ Thị Thảo',
    role: 'employee',
    store_id: 'store-001',
    period: '2026-07',
    work_hours: 145,
    errors: [
      {
        id: 'per-err-002',
        event_id: 'ERR-PERS-202607-0002',
        employee_id: 'emp-007',
        period: '2026-07',
        group: 'gio_lam_cham_cong',
        group_name: 'Giờ làm & chấm công',
        sub_error_id: 'sub-pers-03',
        sub_error_name: 'Đi trễ quá 30 phút',
        example: 'Trễ ca 3 lần không xin phép',
        impact: 'Giảm 50% thưởng cá nhân (hệ số 0.5)',
        points: 4,
        is_serious: false,
        occurred_at: '2026-07-18 14:00',
        source_type: 'pos',
        evidence_type: 'verifier_confirm',
        verifier_name: 'Quản lý Trần Thị Lan',
        approval_status: 'approved_ceo',
        affects_personal_multiplier: true,
      },
    ],
  },
  {
    employee_id: 'emp-008', // Nhân viên làm không đủ 110h
    employee_name: 'Lê Văn Tuấn',
    role: 'employee',
    store_id: 'store-001',
    period: '2026-07',
    work_hours: 80, // <110h -> Khoá thưởng
    errors: [],
  },

  // ── STORE-002: HOMIES CHI NHÁNH 429 (SẴN SÀNG NHẬP LIỆU MỚI) ──
  {
    employee_id: 'emp-003', // Quản lý cửa hàng
    employee_name: 'Lê Hoàng Nam',
    role: 'store_manager',
    store_id: 'store-002',
    period: '2026-07',
    work_hours: 0,
    errors: [],
  },
  {
    employee_id: 'emp-011', // Tổ trưởng ca
    employee_name: 'Huỳnh Lê Kiều Linh',
    role: 'shift_leader',
    store_id: 'store-002',
    period: '2026-07',
    work_hours: 0,
    errors: [],
  },
  {
    employee_id: 'emp-009', // Pha chế
    employee_name: 'Trần Văn An',
    role: 'senior_staff',
    store_id: 'store-002',
    period: '2026-07',
    work_hours: 0,
    errors: [],
  },
  {
    employee_id: 'emp-010', // Thu ngân
    employee_name: 'Lê Thị Bích',
    role: 'employee',
    store_id: 'store-002',
    period: '2026-07',
    work_hours: 0,
    errors: [],
  },
  {
    employee_id: 'emp-012', // Phục vụ
    employee_name: 'Ngô Văn Cường',
    role: 'employee',
    store_id: 'store-002',
    period: '2026-07',
    work_hours: 0,
    errors: [],
  },
]

// ═══════════════════════════════════
// Dynamic Helpers for Error Logs & Settings
// ═══════════════════════════════════

export function addBSCOperationError(newErr: BSCOperationErrorRecord) {
  mockBSCOperationErrors.unshift(newErr)
}

export function removeBSCOperationError(id: string) {
  const index = mockBSCOperationErrors.findIndex(e => e.id === id)
  if (index !== -1) mockBSCOperationErrors.splice(index, 1)
}

export function addBSCPersonalError(employeeId: string, period: string, newErr: BSCPersonalErrorRecord) {
  const empData = mockBSCEmployeeData.find(e => e.employee_id === employeeId && e.period === period)
  if (empData) {
    empData.errors.unshift(newErr)
  } else {
    mockBSCEmployeeData.push({
      employee_id: employeeId,
      employee_name: newErr.group_name || 'Nhân viên',
      role: 'employee',
      store_id: 'store-001',
      period,
      work_hours: 120,
      errors: [newErr],
    })
  }
}

export function removeBSCPersonalError(employeeId: string, period: string, errorId: string) {
  const empData = mockBSCEmployeeData.find(e => e.employee_id === employeeId && e.period === period)
  if (empData) {
    const idx = empData.errors.findIndex(e => e.id === errorId)
    if (idx !== -1) empData.errors.splice(idx, 1)
  }
}

export function updateBSCRevenueTarget(storeId: string, period: string, updates: Partial<BSCRevenueTarget>) {
  const existing = mockBSCRevenueTargets.find(t => t.store_id === storeId && t.period === period)
  if (existing) {
    Object.assign(existing, updates)
    existing.actual_revenue_monthly = existing.actual_revenue_daily * existing.days_in_month
    existing.target_monthly = existing.target_daily * existing.days_in_month
    existing.is_unlocked = existing.actual_revenue_daily >= existing.profit_threshold_daily
  }
}

export function submitBSCForApproval(storeId: string, period: string) {
  const existing = mockBSCRevenueTargets.find(t => t.store_id === storeId && t.period === period)
  if (existing) {
    existing.approval_status = 'pending_ceo'
  }
}

export function approveAndPublishBSC(storeId: string, period: string, approvedBy: string) {
  const existing = mockBSCRevenueTargets.find(t => t.store_id === storeId && t.period === period)
  if (existing) {
    existing.approval_status = 'approved_published'
    existing.approved_by = approvedBy
    existing.approved_at = new Date().toISOString().replace('T', ' ').slice(0, 16)
  }
}

export function unapproveAndUnlockBSC(storeId: string, period: string) {
  const existing = mockBSCRevenueTargets.find(t => t.store_id === storeId && t.period === period)
  if (existing) {
    existing.approval_status = 'draft'
  }
}

export function updateBSCCriteria(key: string, updates: Partial<BSCCriteriaInfo>) {
  const item = bscCriteriaCatalog.find(c => c.key === key)
  if (item) {
    Object.assign(item, updates)
    if (updates.weight !== undefined) {
      item.weight_percent_label = `${Math.round(updates.weight * 100)}%`
    }
  }
}

export function addBSCCriteria(newCat: BSCCriteriaInfo) {
  bscCriteriaCatalog.push(newCat)
}

export function deleteBSCCriteria(key: string) {
  const idx = bscCriteriaCatalog.findIndex(c => c.key === key)
  if (idx !== -1) bscCriteriaCatalog.splice(idx, 1)
}

export const bscBonusTiersCatalog: BSCBonusTier[] = [
  { id: 'tier-1', min_score: 4.8, max_score: 5.0, bonus_percent: 120, label: 'Vượt Trỗi (Thưởng 120%)', badge_color: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  { id: 'tier-2', min_score: 4.0, max_score: 4.79, bonus_percent: 100, label: 'Đạt Chuẩn (Thưởng 100%)', badge_color: 'bg-blue-100 text-blue-900 border-blue-300' },
  { id: 'tier-3', min_score: 3.0, max_score: 3.99, bonus_percent: 70, label: 'Mức Khá (Thưởng 70%)', badge_color: 'bg-amber-100 text-amber-900 border-amber-300' },
  { id: 'tier-4', min_score: 2.0, max_score: 2.99, bonus_percent: 40, label: 'Mức Trung Bình (Thưởng 40%)', badge_color: 'bg-orange-100 text-orange-900 border-orange-300' },
  { id: 'tier-5', min_score: 0.0, max_score: 1.99, bonus_percent: 0, label: 'Không Đạt (Thưởng 0%)', badge_color: 'bg-rose-100 text-rose-900 border-rose-300' },
]

export function updateBSCBonusTier(id: string, updates: Partial<BSCBonusTier>) {
  const item = bscBonusTiersCatalog.find(t => t.id === id)
  if (item) Object.assign(item, updates)
}

// Bảng Ma Trận Mốc Quy Đổi Điểm 1-5đ Cho Từng Tiêu Chí
export const bscCriteriaThresholdsCatalog: BSCCriteriaThresholdRule[] = [
  {
    criteria_key: 'revenue',
    criteria_name: 'Doanh thu (% Target)',
    unit_label: '% Target',
    score_5: 110,
    score_4: 100,
    score_3: 95,
    score_2: 85,
    score_1: 81,
  },
  {
    criteria_key: 'waste',
    criteria_name: 'Hao hụt COGS (%)',
    unit_label: '% Hao hụt',
    score_5: 2.0,
    score_4: 3.0,
    score_3: 4.0,
    score_2: 5.0,
    score_1: 6.0,
  },
  {
    criteria_key: 'operation',
    criteria_name: 'Lỗi vận hành ca (Điểm)',
    unit_label: 'Điểm lỗi',
    score_5: 4,
    score_4: 8,
    score_3: 12,
    score_2: 15,
    score_1: 20,
  },
  {
    criteria_key: 'customer_qr',
    criteria_name: '1. Khảo sát QR Feedback bàn',
    unit_label: 'Điểm QR',
    score_5: 90,
    score_4: 80,
    score_3: 70,
    score_2: 60,
    score_1: 50,
  },
  {
    criteria_key: 'customer_review',
    criteria_name: '2. Đánh giá trực tiếp & CSKH',
    unit_label: 'Điểm Đánh Giá',
    score_5: 90,
    score_4: 80,
    score_3: 70,
    score_2: 60,
    score_1: 50,
  },
  {
    criteria_key: 'customer',
    criteria_name: 'Khách hàng (Điểm QR/Đánh giá)',
    unit_label: 'Điểm KH',
    score_5: 90,
    score_4: 80,
    score_3: 70,
    score_2: 60,
    score_1: 50,
  },
]

export function updateBSCCriteriaThreshold(key: string, updates: Partial<BSCCriteriaThresholdRule>) {
  const item = bscCriteriaThresholdsCatalog.find(t => t.criteria_key === key)
  if (item) Object.assign(item, updates)
}

// Bảng Ma Trận Hệ Số Nhân Vị Trí & Cấp Bậc
export const bscPositionMultipliersCatalog: BSCPositionMultiplier[] = [
  { role_key: 'store_manager', role_title: 'Cửa Hàng Trưởng / Quản Lý', multiplier: 1.5, description: 'Chịu trách nhiệm toàn diện doanh thu & chi phí cửa hàng' },
  { role_key: 'shift_leader', role_title: 'Trưởng Ca / Giám Sát Ca', multiplier: 1.2, description: 'Điều hành ca làm việc, kiểm tra checklist & đơn hàng' },
  { role_key: 'full_time', role_title: 'Nhân Viên Pha Chế / Thu Ngân Chính Thức', multiplier: 1.0, description: 'Trực tiếp làm đơn, phục vụ khách & đảm bảo quy trình' },
  { role_key: 'part_time', role_title: 'Nhân Viên Part-time / Thử Việc', multiplier: 0.8, description: 'Hỗ trợ ca làm việc theo khung giờ xếp ca' },
]

export function updateBSCPositionMultiplier(key: string, multiplier: number) {
  const item = bscPositionMultipliersCatalog.find(p => p.role_key === key)
  if (item) item.multiplier = multiplier
}

// Cấu Hình Chính Sách Trừ Lỗi & Xử Lý Phần Thưởng Dư
export const bscDeductionPolicy: BSCDeductionPolicy = {
  use_tiered_personal_multiplier: true, // Mặc định dùng Bậc hệ số cá nhân Homies (1.0, 0.8, 0.5, 0.0)
  penalty_pct_per_error_point: 5,
  unallocated_pool_mode: 'retain_company',
  max_penalty_cap_pct: 100, // Mức giảm thưởng tối đa
}

export function updateBSCDeductionPolicy(updates: Partial<BSCDeductionPolicy>) {
  Object.assign(bscDeductionPolicy, updates)
}

// Bảng Cài Đặt Khóa An Toàn & Bảo Vệ Dòng Tiền Công Ty
export const bscSafetySettings: BSCSafetySettings = {
  lock_bonus_if_below_profit_threshold: true,
  zero_score_on_critical_op_error: true,
  fallback_qr_only_if_no_review: true,
  customer_qr_weight_pct: 50,
  customer_review_weight_pct: 50,
  min_qr_feedback_count: 30, // Mẫu số phản hồi QR tối thiểu/tháng
}

export function updateBSCSafetySettings(updates: Partial<BSCSafetySettings>) {
  Object.assign(bscSafetySettings, updates)
}

// Thao Tác Quản Lý Nhóm Lỗi Vận Hành Động
export function addBSCOperationErrorGroup(newGrp: { key: string; name: string; points: number; examples: string[]; is_critical?: boolean }) {
  bscOperationErrorGroups.push(newGrp)
}

export function updateBSCOperationErrorGroup(key: string, updates: Partial<{ name: string; points: number; examples: string[]; is_critical: boolean }>) {
  const item = bscOperationErrorGroups.find(g => g.key === key)
  if (item) Object.assign(item, updates)
}

export function deleteBSCOperationErrorGroup(key: string) {
  const idx = bscOperationErrorGroups.findIndex(g => g.key === key)
  if (idx !== -1) bscOperationErrorGroups.splice(idx, 1)
}

// Thao Tác Quản Lý Nhóm Lỗi Cá Nhân Động
export function addBSCPersonalErrorGroup(newGrp: { key: string; name: string; points: number; examples: string[]; is_serious?: boolean }) {
  bscPersonalErrorGroups.push(newGrp)
}

export function updateBSCPersonalErrorGroup(key: string, updates: Partial<{ name: string; points: number; examples: string[]; is_serious: boolean }>) {
  const item = bscPersonalErrorGroups.find(g => g.key === key)
  if (item) Object.assign(item, updates)
}

export function deleteBSCPersonalErrorGroup(key: string) {
  const idx = bscPersonalErrorGroups.findIndex(g => g.key === key)
  if (idx !== -1) bscPersonalErrorGroups.splice(idx, 1)
}

// ═══════════════════════════════════
// 10. LỘ TRÌNH TRIỂN KHAI BSC THEO TỪNG THÁNG (PROGRESSIVE ROLLOUT ROADMAP)
// ═══════════════════════════════════

export const mockBSCRoadmapMilestones: BSCRoadmapMilestone[] = [
  {
    id: 'mile-01',
    phase_number: 1,
    phase_name: 'Giai đoạn 1: Khởi Động & Làm Quen',
    applied_month: '2026-07',
    month_label: 'Tháng 07/2026',
    target_mode: 'percent',
    target_revenue_rate_pct: 90,
    target_revenue_daily_fixed: 7200000,
    profit_threshold_daily: 6000000,
    penalty_leniency_pct: 50,
    exempt_minor_errors: true,
    bonus_pool_boost_pct: 0,
    title_badge: 'Nới lỏng 50% lỗi (Khởi động)',
    staff_impact_summary: 'Hạ mốc hòa vốn xuống 6.0tr/ngày, giảm 50% điểm phạt và miễn trừ lỗi nhỏ (đi trễ <15p, quên bảng tên) giúp toàn đội dễ dàng nhận thưởng ngay tháng đầu.',
    description: 'Tập trung tạo sự hào hứng, giúp nhân viên làm quen với bảng điểm chấm 4 tiêu chí mà không bị ngợp.',
    status: 'active',
  },
  {
    id: 'mile-02',
    phase_number: 2,
    phase_name: 'Giai đoạn 2: Tăng Tốc & Nâng Chuẩn',
    applied_month: '2026-08',
    month_label: 'Tháng 08/2026',
    target_mode: 'percent',
    target_revenue_rate_pct: 95,
    target_revenue_daily_fixed: 7600000,
    profit_threshold_daily: 6500000,
    penalty_leniency_pct: 20,
    exempt_minor_errors: false,
    bonus_pool_boost_pct: 0,
    title_badge: 'Tăng tốc & Chuẩn hóa',
    staff_impact_summary: 'Mốc hòa vốn chuẩn 6.5tr/ngày, áp dụng 80% quy chuẩn lỗi. Bắt đầu rèn luyện nề nếp vệ sinh 5S quầy kệ và kiểm soát hao hụt kho.',
    description: 'Nâng cao tác phong phục vụ khách hàng, giảm thiểu sai sót đơn hàng và rèn luyện kỹ năng ca trưởng.',
    status: 'upcoming',
  },
  {
    id: 'mile-03',
    phase_number: 3,
    phase_name: 'Giai đoạn 3: Chuẩn Hóa Toàn Diện',
    applied_month: '2026-09',
    month_label: 'Tháng 09/2026+',
    target_mode: 'percent',
    target_revenue_rate_pct: 100,
    target_revenue_daily_fixed: 8000000,
    profit_threshold_daily: 6500000,
    penalty_leniency_pct: 0,
    exempt_minor_errors: false,
    bonus_pool_boost_pct: 0,
    title_badge: 'Chuẩn hóa toàn diện 100%',
    staff_impact_summary: 'Áp dụng 100% đầy đủ 4 trụ cột BSC. Kích hoạt mức thưởng 120% quỹ cho ca trực xuất sắc vượt chỉ tiêu.',
    description: 'Hệ thống vận hành tự động hóa hoàn toàn và tối đa hóa thu nhập cho nhân sự có hiệu suất cao.',
    status: 'upcoming',
  },
]

export function updateBSCRoadmapMilestone(id: string, updates: Partial<BSCRoadmapMilestone>) {
  const item = mockBSCRoadmapMilestones.find(m => m.id === id)
  if (item) Object.assign(item, updates)
}

export function addBSCRoadmapMilestone(newMilestone: BSCRoadmapMilestone) {
  mockBSCRoadmapMilestones.push(newMilestone)
}

export function deleteBSCRoadmapMilestone(id: string) {
  const idx = mockBSCRoadmapMilestones.findIndex(m => m.id === id)
  if (idx !== -1) mockBSCRoadmapMilestones.splice(idx, 1)
}

