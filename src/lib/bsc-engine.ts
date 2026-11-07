// =============================================
// Homies Milk Tea 🧋 — BSC Calculation Engine
// Tính toán chuẩn theo chính sách Homies Hồ Bá Phấn
// =============================================

import type {
  BSCPeriod,
  BSCCriteriaScore,
  BSCStoreResult,
  BSCIndividualResult,
  BSCTeamBonusSummary,
} from './bsc-types'
import {
  bscCriteriaCatalog,
  mockBSCRevenueTargets,
  mockBSCStoreRawMetrics,
  mockBSCEmployeeData,
  bscBonusTiersCatalog,
  bscCriteriaThresholdsCatalog,
  bscPositionMultipliersCatalog,
  bscDeductionPolicy,
  bscSafetySettings,
} from './mock-data-bsc'

// ═══════════════════════════════════
// 1. QUY ĐỔI ĐIỂM TIÊU CHÍ (1 - 5)
// ═══════════════════════════════════

/**
 * Quy đổi doanh thu sang điểm 1-5 theo bảng spec:
 * Dưới 81% target: 0 điểm
 * 81% - <85%: 1
 * 85% - <95%: 2
 * 95% - <100%: 3
 * 100% - <110%: 4
 * từ 110%: 5
 */
export function scoreRevenueCriteria(
  actualDaily: number,
  targetDaily: number,
  profitThresholdDaily: number = 6500000
): { score: number; label: string } {
  if (targetDaily <= 0) return { score: 0, label: '0% target' }

  // Quy tắc An Toàn: Nếu Doanh thu < Mốc Hòa Vốn ➔ Khóa 0 điểm ngay
  if (bscSafetySettings.lock_bonus_if_below_profit_threshold && profitThresholdDaily > 0 && actualDaily < profitThresholdDaily) {
    return { score: 0, label: `Dưới Mốc Hòa Vốn (${(actualDaily / 1000000).toFixed(1)}tr < ${(profitThresholdDaily / 1000000).toFixed(1)}tr/ngày - Khóa 0đ)` }
  }

  const percent = (actualDaily / targetDaily) * 100
  const label = `Đạt ${percent.toFixed(1)}% target`

  const rule = bscCriteriaThresholdsCatalog.find(r => r.criteria_key === 'revenue')
  if (!rule) {
    if (percent < 81) return { score: 0, label }
    if (percent < 85) return { score: 1, label }
    if (percent < 95) return { score: 2, label }
    if (percent < 100) return { score: 3, label }
    if (percent < 110) return { score: 4, label }
    return { score: 5, label }
  }

  if (percent < rule.score_1) return { score: 0, label }
  if (percent < rule.score_2) return { score: 1, label }
  if (percent < rule.score_3) return { score: 2, label }
  if (percent < rule.score_4) return { score: 3, label }
  if (percent < rule.score_5) return { score: 4, label }
  return { score: 5, label }
}

export function scoreWasteCriteria(wastePct: number): { score: number; label: string } {
  const label = `${wastePct.toFixed(1)}% hao hụt`
  const rule = bscCriteriaThresholdsCatalog.find(r => r.criteria_key === 'waste')
  if (!rule) {
    if (wastePct > 5) return { score: 1, label }
    if (wastePct >= 4) return { score: 2, label }
    if (wastePct >= 3) return { score: 3, label }
    if (wastePct >= 2) return { score: 4, label }
    return { score: 5, label }
  }

  if (wastePct <= rule.score_5) return { score: 5, label }
  if (wastePct <= rule.score_4) return { score: 4, label }
  if (wastePct <= rule.score_3) return { score: 3, label }
  if (wastePct <= rule.score_2) return { score: 2, label }
  return { score: 1, label }
}

export function scoreOperationCriteria(errorPoints: number, hasCriticalError: boolean = false): { score: number; label: string } {
  if (bscSafetySettings.zero_score_on_critical_op_error && hasCriticalError) {
    return { score: 0, label: 'Có 01 Lỗi Đặc Biệt Nghiêm Trọng (Khóa 0đ Vận Hành)' }
  }

  const label = `${errorPoints} điểm lỗi vận hành`
  const rule = bscCriteriaThresholdsCatalog.find(r => r.criteria_key === 'operation')
  if (!rule) {
    if (errorPoints <= 4) return { score: 5, label }
    if (errorPoints <= 8) return { score: 4, label }
    if (errorPoints <= 12) return { score: 3, label }
    if (errorPoints <= 15) return { score: 2, label }
    return { score: 1, label }
  }

  if (errorPoints <= rule.score_5) return { score: 5, label }
  if (errorPoints <= rule.score_4) return { score: 4, label }
  if (errorPoints <= rule.score_3) return { score: 3, label }
  if (errorPoints <= rule.score_2) return { score: 2, label }
  return { score: 1, label }
}

export function scoreCustomerCriteria(qrScore: number = 0, reviewScore: number = 0, hasNoQr: boolean = false): { score: number; label: string } {
  // Lấy tỷ lệ % trọng số cài đặt động (Mặc định 50% QR - 50% Review, CEO có thể chỉnh 60%-40%)
  const qrWeight = (bscSafetySettings.customer_qr_weight_pct || 50) / 100
  const reviewWeight = (bscSafetySettings.customer_review_weight_pct || 50) / 100

  const hasQr = !hasNoQr && qrScore > 0
  const hasReview = reviewScore > 0

  // 1. Quy đổi điểm 1-5 cho Tiêu chí con 1 (QR Feedback) nếu có dữ liệu
  let qrConverted = 5
  if (hasQr) {
    const qrRule = bscCriteriaThresholdsCatalog.find(r => r.criteria_key === 'customer_qr')
    const qr5 = qrRule?.score_5 ?? 90
    const qr4 = qrRule?.score_4 ?? 80
    const qr3 = qrRule?.score_3 ?? 70
    const qr2 = qrRule?.score_2 ?? 60
    if (qrScore >= qr5) qrConverted = 5
    else if (qrScore >= qr4) qrConverted = 4
    else if (qrScore >= qr3) qrConverted = 3
    else if (qrScore >= qr2) qrConverted = 2
    else qrConverted = 1
  }

  // 2. Quy đổi điểm 1-5 cho Tiêu chí con 2 (Đánh giá trực tiếp & CSKH) nếu có dữ liệu
  let revConverted = 5
  if (hasReview) {
    const revRule = bscCriteriaThresholdsCatalog.find(r => r.criteria_key === 'customer_review')
    const rev5 = revRule?.score_5 ?? 90
    const rev4 = revRule?.score_4 ?? 80
    const rev3 = revRule?.score_3 ?? 70
    const rev2 = revRule?.score_2 ?? 60
    if (reviewScore >= rev5) revConverted = 5
    else if (reviewScore >= rev4) revConverted = 4
    else if (reviewScore >= rev3) revConverted = 3
    else if (reviewScore >= rev2) revConverted = 2
    else revConverted = 1
  }

  // TRƯỜNG HỢP 1: Tháng đó quán KHÔNG LÀM KHẢO SÁT QR (hasNoQr || qrScore = 0 hoặc để trống)
  // → Tuyệt đối không tính 1 điểm phạt. Dồn 100% về Đánh giá trực tiếp & CSKH (hoặc đạt chuẩn 5đ nếu không có khiếu nại)
  if (!hasQr) {
    if (hasReview) {
      const finalScore = revConverted
      const label = `${finalScore}/5đ KH (100% Đánh giá CSKH: ${revConverted}đ [Không triển khai QR khảo sát])`
      return { score: finalScore, label }
    } else {
      const finalScore = 5
      const label = `5/5đ KH (Đạt chuẩn - Không triển khai QR & Không có khiếu nại CSKH)`
      return { score: finalScore, label }
    }
  }

  // TRƯỜNG HỢP 2: Có làm QR khảo sát nhưng KHÔNG có bài đánh giá trực tiếp / phản ánh
  // → Tự động lấy 100% điểm QR
  if (hasQr && !hasReview) {
    if (bscSafetySettings.fallback_qr_only_if_no_review !== false) {
      const finalScore = qrConverted
      const label = `${finalScore}/5đ KH (100% QR: ${qrConverted}đ [${qrScore}đ thô])`
      return { score: finalScore, label }
    }
  }

  // TRƯỜNG HỢP 3: Có đầy đủ cả 2 tiêu chí con → Tính theo trọng số cấu hình (50% QR - 50% Review)
  const finalScore = Number((qrConverted * qrWeight + revConverted * reviewWeight).toFixed(2))
  const label = `${finalScore}/5đ KH (QR ${Math.round(qrWeight * 100)}%: ${qrConverted}đ [${qrScore}đ] | Đánh giá ${Math.round(reviewWeight * 100)}%: ${revConverted}đ [${reviewScore}đ])`

  return { score: finalScore, label }
}

// ═══════════════════════════════════
// 2. HỆ SỐ BSC QUYẾT ĐỊNH QUỸ THƯỞNG
// ═══════════════════════════════════

/**
 * Tra hệ số BSC dựa trên bscBonusTiersCatalog động:
 */
export function getBSCCoefficient(totalBscScore: number): { coefficient: number; label: string } {
  const sortedTiers = [...bscBonusTiersCatalog].sort((a, b) => b.min_score - a.min_score)
  const matched = sortedTiers.find(tier => totalBscScore >= tier.min_score)
  if (matched) {
    const coeff = matched.bonus_percent / 100
    return { coefficient: coeff, label: `${matched.bonus_percent}% Quỹ nền (${matched.label})` }
  }
  return { coefficient: 0, label: '0% Quỹ (Dưới mức điểm tối thiểu)' }
}

// ═══════════════════════════════════
// 3. TÍNH KẾT QUẢ BSC CỬA HÀNG (STEP 1 - STEP 3)
// ═══════════════════════════════════

export function calculateStoreBSC(
  storeId: string,
  period: BSCPeriod,
  customTargets?: typeof mockBSCRevenueTargets,
  customRawMetrics?: typeof mockBSCStoreRawMetrics,
  customCriteria?: typeof bscCriteriaCatalog
): BSCStoreResult {
  const targetsSource = customTargets || mockBSCRevenueTargets
  const metricsSource = customRawMetrics || mockBSCStoreRawMetrics
  const criteriaSource = customCriteria || bscCriteriaCatalog

  const revTarget = targetsSource.find(t => t.store_id === storeId && t.period === period) || {
    store_id: storeId,
    store_name: storeId === 'store-002' ? 'Homies Chi Nhánh 429' : 'Homies Hồ Bá Phấn',
    period,
    profit_threshold_daily: 6500000,
    target_daily: 8000000,
    target_monthly: 248000000,
    days_in_month: 31,
    actual_revenue_monthly: 0,
    actual_revenue_daily: 0,
    is_unlocked: false,
  }

  const rawMetrics = metricsSource.find(m => m.store_id === storeId && m.period === period) || {
    store_id: storeId,
    period,
    waste_percentage: 0,
    operation_error_points: 0,
    customer_qr_score: 0,
    customer_review_score: 0,
  }

  // Target daily: Nếu target_mode = 'manual' hoặc có manual_target_daily thì ưu tiên target chỉ định
  const effectiveTargetDaily = revTarget.target_mode === 'manual'
    ? (revTarget.manual_target_daily || revTarget.target_daily || 8000000)
    : (revTarget.avg_3_6_months_daily
        ? Math.max(revTarget.profit_threshold_daily, Math.round(revTarget.avg_3_6_months_daily * 1.15))
        : (revTarget.target_daily || 8000000))

  // Gate Check
  const isUnlocked = revTarget.actual_revenue_daily >= revTarget.profit_threshold_daily && revTarget.actual_revenue_daily > 0

  // Chấm điểm 4 tiêu chí
  const revRes = isUnlocked
    ? scoreRevenueCriteria(revTarget.actual_revenue_daily, effectiveTargetDaily, revTarget.profit_threshold_daily)
    : {
        score: 0,
        label: revTarget.actual_revenue_monthly === 0
          ? 'Chưa có dữ liệu doanh thu'
          : `Dưới Mốc Hòa Vốn (${(revTarget.actual_revenue_daily / 1000000).toFixed(1)}tr < ${(revTarget.profit_threshold_daily / 1000000).toFixed(1)}tr - Khóa 0đ)`,
      }

  // % Hao hụt tự tính từ COGS định mức & COGS thực tế
  const wastePct =
    revTarget.cogs_budget && revTarget.cogs_actual && revTarget.cogs_budget > 0
      ? Number((((revTarget.cogs_actual - revTarget.cogs_budget) / revTarget.cogs_budget) * 100).toFixed(1))
      : (revTarget.waste_percentage ?? rawMetrics?.waste_percentage ?? 2.0)

  const wasteRes = scoreWasteCriteria(Number(wastePct || 0))

  const effectiveOpPoints = revTarget.operation_error_points !== undefined ? revTarget.operation_error_points : rawMetrics.operation_error_points
  const opRes = scoreOperationCriteria(effectiveOpPoints, revTarget.has_critical_op_error)

  // Đánh giá KH: Ép 1 điểm nếu có dị vật / ATTP
  const effectiveQrScore = revTarget.has_no_qr
    ? 0
    : (revTarget.customer_qr_score !== undefined ? revTarget.customer_qr_score : rawMetrics.customer_qr_score)
  const effectiveReviewScore =
    revTarget.customer_review_score !== undefined ? revTarget.customer_review_score : rawMetrics.customer_review_score
  let custRes = scoreCustomerCriteria(effectiveQrScore, effectiveReviewScore, revTarget.has_no_qr)
  if (revTarget.has_attp_foreign_body) {
    custRes = { score: 1, label: 'Ép 1đ (Có dị vật / Vi phạm ATTP)' }
  }

  const scores: Record<string, { score: number; label: string }> = {
    revenue: revRes,
    waste: wasteRes,
    operation: opRes,
    customer: custRes,
  }

  const criteria_scores: BSCCriteriaScore[] = criteriaSource.map(cat => {
    const res = scores[cat.key] || { score: 5, label: 'Đạt mốc tiêu chuẩn' }
    const converted_score = isUnlocked ? res.score : 0
    const weighted_score = Number((converted_score * cat.weight).toFixed(2))

    return {
      key: cat.key,
      name: cat.name,
      weight: cat.weight,
      converted_score,
      raw_value_label: res.label,
      weighted_score,
    }
  })

  // Tổng điểm BSC
  const total_bsc_score = isUnlocked
    ? Number(criteria_scores.reduce((sum, item) => sum + item.weighted_score, 0).toFixed(2))
    : 0

  // Hệ số & Quỹ
  let bsc_coefficient = 0
  let coefficient_label = 'Chưa mở (Dưới mốc lợi nhuận)'
  if (isUnlocked) {
    if (revTarget.bsc_coefficient !== undefined) {
      bsc_coefficient = revTarget.bsc_coefficient
      coefficient_label = `${Math.round(bsc_coefficient * 100)}% Quỹ nền (CEO chỉ định thủ công)`
    } else {
      const tierRes = getBSCCoefficient(total_bsc_score)
      bsc_coefficient = tierRes.coefficient
      coefficient_label = tierRes.label
    }
  }

  const base_bonus_pool = isUnlocked ? Math.round(revTarget.actual_revenue_monthly * 0.01) : 0
  const store_bonus_pool = isUnlocked
    ? Math.round(base_bonus_pool * bsc_coefficient)
    : 0

  return {
    store_id: storeId,
    store_name: revTarget.store_name,
    period,
    revenue_target: {
      ...revTarget,
      target_daily: effectiveTargetDaily,
      is_unlocked: isUnlocked,
    },
    criteria_scores,
    total_bsc_score,
    bsc_coefficient,
    coefficient_label,
    base_bonus_pool,
    store_bonus_pool,
    evaluated_at: new Date().toISOString(),
  }
}

// ═══════════════════════════════════
// 4. CHIA THƯỞNG CÁ NHÂN (STEP 4 - STEP 5)
// ═══════════════════════════════════

/**
 * Tra hệ số cấp bậc từ bscPositionMultipliersCatalog động:
 */
export function getRankCoefficient(role: string): { coefficient: number; label: string } {
  const normRole = (role || '').toLowerCase()
  let matchedKey = 'full_time'

  if (normRole.includes('quản lý') || normRole.includes('manager') || normRole === 'pos-006' || normRole === 'store_manager') {
    matchedKey = 'store_manager'
  } else if (normRole.includes('trưởng ca') || normRole.includes('leader') || normRole === 'pos-004' || normRole === 'shift_leader') {
    matchedKey = 'shift_leader'
  } else if (normRole.includes('part') || normRole.includes('bán thời gian') || normRole.includes('thử việc') || normRole === 'probation' || normRole === 'part_time') {
    matchedKey = 'part_time'
  } else if (normRole === 'full_time' || normRole.includes('chính thức') || normRole.includes('toàn thời gian') || normRole === 'employee') {
    matchedKey = 'full_time'
  } else {
    // Check direct key in catalog
    const direct = bscPositionMultipliersCatalog.find(p => p.role_key === role)
    if (direct) {
      return { coefficient: direct.multiplier, label: `${direct.role_title} (${direct.multiplier})` }
    }
  }

  const found = bscPositionMultipliersCatalog.find(p => p.role_key === matchedKey)
  if (found) {
    return { coefficient: found.multiplier, label: `${found.role_title} (${found.multiplier})` }
  }
  return { coefficient: 1.0, label: 'Nhân Viên Chính Thức (1.0)' }
}

/**
 * Tra hệ số điều kiện cá nhân theo Bậc Hệ Số Cá Nhân Chuẩn Homies:
 * 0 - 1 điểm lỗi = 1.0 (100%)
 * 2 - 3 điểm lỗi = 0.8 (80%)
 * 4 - 5 điểm lỗi = 0.5 (50%)
 * Từ 6 điểm trở lên hoặc Lỗi nghiêm trọng = 0.0 (0%)
 */
export function getPersonalErrorCoefficient(totalErrors: number, hasSerious: boolean): { coefficient: number; note: string } {
  if (hasSerious) return { coefficient: 0, note: 'Khóa thưởng 0% (Có lỗi nghiêm trọng)' }

  if (bscDeductionPolicy.use_tiered_personal_multiplier !== false) {
    if (totalErrors <= 1) return { coefficient: 1.0, note: 'Hệ số 1.0 (0-1đ lỗi - 100% thưởng)' }
    if (totalErrors <= 3) return { coefficient: 0.8, note: 'Hệ số 0.8 (2-3đ lỗi - Trừ 20% thưởng)' }
    if (totalErrors <= 5) return { coefficient: 0.5, note: 'Hệ số 0.5 (4-5đ lỗi - Trừ 50% thưởng)' }
    return { coefficient: 0.0, note: 'Khóa thưởng 0% (Lỗi cá nhân >= 6 điểm)' }
  }

  // Fallback tuyến tính nếu tắt chế độ bậc
  if (totalErrors === 0) return { coefficient: 1.0, note: 'Hệ số 1.0 (Đủ điều kiện 100%)' }
  const penaltyRate = bscDeductionPolicy.penalty_pct_per_error_point / 100
  const totalDeductionPct = totalErrors * penaltyRate
  if (totalDeductionPct >= 1) return { coefficient: 0, note: `Không xét thưởng 0% (Lỗi trừ vượt 100%)` }

  const coeff = Number((1 - totalDeductionPct).toFixed(2))
  return { coefficient: coeff, note: `Hệ số ${coeff} (Trừ ${totalErrors * bscDeductionPolicy.penalty_pct_per_error_point}% theo ${totalErrors}đ lỗi)` }
}

/**
 * Tính toán chia thưởng cá nhân toàn cửa hàng
 */
export function calculateBSCTeamBonus(
  storeId: string,
  period: BSCPeriod,
  customTargets?: typeof mockBSCRevenueTargets,
  customEmpData?: typeof mockBSCEmployeeData,
  customRawMetrics?: typeof mockBSCStoreRawMetrics,
  customCriteria?: typeof bscCriteriaCatalog
): BSCTeamBonusSummary {
  const storeResult = calculateStoreBSC(storeId, period, customTargets, customRawMetrics, customCriteria)
  const empSource = customEmpData || mockBSCEmployeeData
  const empDataList = empSource.filter(e => e.store_id === storeId && e.period === period)

  let total_team_hours = 0
  let total_team_share_points = 0
  let eligible_employee_count = 0

  const min_hours_required = storeResult.revenue_target.min_hours_threshold || 110

  // Pass 1: Tính điểm chia từng người
  const interimResults = empDataList.map(emp => {
    total_team_hours += emp.work_hours

    // Theo Phương án A: Quán nào tính theo quỹ của quán đó. 
    // Nhân sự phải đạt đủ định mức giờ tại chính chi nhánh đó mới được tham gia chia quỹ chi nhánh.
    const is_eligible_hours = emp.work_hours >= min_hours_required
    const rankInfo = getRankCoefficient(emp.role)

    // Chỉ tính điểm các lỗi đã được CEO Duyệt Chốt chính thức (approved_ceo / confirmed)
    const approvedErrors = emp.errors.filter(err => 
      err.approval_status === 'approved_ceo' || (err.approval_status as string) === 'confirmed'
    )
    const totalErrorPoints = approvedErrors.reduce((sum, err) => sum + err.points, 0)
    const hasSerious = approvedErrors.some(err => err.is_serious || err.locks_personal_bonus)

    const errInfo = getPersonalErrorCoefficient(totalErrorPoints, hasSerious)

    let lock_reason: string | undefined
    if (!is_eligible_hours) lock_reason = `Chưa đủ ${min_hours_required}h làm việc tại cơ sở (${emp.work_hours}h)`
    else if (errInfo.coefficient === 0) lock_reason = errInfo.note

    const isEligible = is_eligible_hours && errInfo.coefficient > 0 && storeResult.store_bonus_pool > 0
    if (isEligible) eligible_employee_count++

    const personal_share_points = isEligible
      ? Number((emp.work_hours * rankInfo.coefficient * errInfo.coefficient).toFixed(2))
      : 0

    total_team_share_points += personal_share_points

    return {
      employee_id: emp.employee_id,
      employee_name: emp.employee_name,
      role: emp.role,
      level_label: rankInfo.label.split(' ')[0],
      store_id: storeId,
      period,
      work_hours: emp.work_hours,
      min_hours_required,
      is_eligible_hours,
      rank_coefficient: rankInfo.coefficient,
      personal_error_count: totalErrorPoints,
      has_serious_error: hasSerious,
      personal_coefficient: errInfo.coefficient,
      personal_share_points,
      lock_reason,
    }
  })

  // Pass 2: Tính tỷ lệ % và tiền thưởng thực tế
  const individual_results: BSCIndividualResult[] = interimResults.map(item => {
    const share_percentage = total_team_share_points > 0
      ? Number(((item.personal_share_points / total_team_share_points) * 100).toFixed(2))
      : 0

    const bonus_amount = Math.round((storeResult.store_bonus_pool * share_percentage) / 100)

    return {
      ...item,
      share_percentage,
      bonus_amount,
    }
  })

  const total_distributed_bonus_amount = individual_results.reduce((sum, item) => sum + item.bonus_amount, 0)
  const retained_bonus_amount = Math.max(0, storeResult.store_bonus_pool - total_distributed_bonus_amount)

  return {
    store_id: storeId,
    store_name: storeResult.store_name,
    period,
    store_result: storeResult,
    total_team_hours,
    total_team_share_points: Number(total_team_share_points.toFixed(2)),
    eligible_employee_count,
    total_employee_count: empDataList.length,
    total_distributed_bonus_amount,
    retained_bonus_amount,
    individual_results,
  }
}

/**
 * Lấy kết quả BSC cá nhân cụ thể của 1 nhân viên
 */
export function getEmployeeBSCBonus(
  employeeId: string,
  period: BSCPeriod,
  customTargets?: typeof mockBSCRevenueTargets,
  customEmpData?: typeof mockBSCEmployeeData,
  customRawMetrics?: typeof mockBSCStoreRawMetrics,
  customCriteria?: typeof bscCriteriaCatalog
): {
  teamSummary: BSCTeamBonusSummary
  myResult?: BSCIndividualResult
} {
  const empSource = customEmpData || mockBSCEmployeeData
  const empData = empSource.find(e => e.employee_id === employeeId && e.period === period)
  const storeId = empData?.store_id || 'store-001'
  const summary = calculateBSCTeamBonus(storeId, period, customTargets, empSource, customRawMetrics, customCriteria)
  const myResult = summary.individual_results.find(r => r.employee_id === employeeId)

  return {
    teamSummary: summary,
    myResult,
  }
}

