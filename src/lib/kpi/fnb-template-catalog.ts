import type {
  KpiCriterionDefinition,
  KpiGroupDefinition,
  KpiGroupTag,
  KpiMetricDirection,
  KpiMetricUnit,
  KpiScoreBand,
  KpiSetVersion,
  KpiTemplateId,
} from './types.ts'

type CriterionSeed = {
  id: string
  name: string
  description: string
  weight: number
  unit: KpiMetricUnit
  direction: KpiMetricDirection
  source_key?: string
  core?: boolean
}

type GroupSeed = {
  id: string
  name: string
  tag: KpiGroupTag
  weight: number
  criteria: CriterionSeed[]
}

export type FnbKpiTemplate = {
  id: KpiTemplateId
  name: string
  groups: KpiGroupDefinition[]
}

const RUBRIC_BANDS: KpiScoreBand[] = [
  { min: 1, max: 1, score: 1 },
  { min: 2, max: 2, score: 2 },
  { min: 3, max: 3, score: 3 },
  { min: 4, max: 4, score: 4 },
  { min: 5, max: 5, score: 5 },
]

const PERCENT_BANDS: KpiScoreBand[] = [
  { min: 0, max: 69, score: 1 },
  { min: 70, max: 79, score: 2 },
  { min: 80, max: 89, score: 3 },
  { min: 90, max: 96, score: 4 },
  { min: 97, max: null, score: 5 },
]

const LOWER_BANDS: KpiScoreBand[] = [
  { min: 0, max: 0, score: 5 },
  { min: 1, max: 1, score: 4 },
  { min: 2, max: 2, score: 3 },
  { min: 3, max: 4, score: 2 },
  { min: 5, max: null, score: 1 },
]

function bandsFor(direction: KpiMetricDirection): KpiScoreBand[] {
  if (direction === 'lower') return LOWER_BANDS
  if (direction === 'higher') return PERCENT_BANDS
  return RUBRIC_BANDS
}

function criterion(groupId: string, sortOrder: number, seed: CriterionSeed): KpiCriterionDefinition {
  return {
    id: `${groupId}_${seed.id}`,
    group_id: groupId,
    name: seed.name,
    description: seed.description,
    scoring_mode: seed.direction === 'rubric' ? 'leader' : 'combined',
    weight: seed.weight,
    unit: seed.unit,
    direction: seed.direction,
    core: seed.core,
    recommended_weight_range: { min: Math.max(5, seed.weight - 5), max: seed.weight + 5 },
    source_key: seed.source_key,
    score_bands: structuredClone(bandsFor(seed.direction)),
    evidence_required_below: 3,
    adjustment_reason_required: true,
    sort_order: sortOrder,
    active: true,
  }
}

function group(sortOrder: number, seed: GroupSeed): KpiGroupDefinition {
  return {
    id: seed.id,
    name: seed.name,
    tag: seed.tag,
    weight: seed.weight,
    promotion_core: sortOrder <= 3,
    sort_order: sortOrder,
    criteria: seed.criteria.map((item, index) => criterion(seed.id, index + 1, item)),
  }
}

function template(id: KpiTemplateId, name: string, groups: GroupSeed[]): FnbKpiTemplate {
  return {
    id,
    name,
    groups: groups.map((item, index) => group(index + 1, item)),
  }
}

function metric(
  id: string,
  name: string,
  description: string,
  weight: number,
  unit: KpiMetricUnit,
  direction: KpiMetricDirection,
  source_key?: string,
): CriterionSeed {
  return { id, name, description, weight, unit, direction, source_key, core: weight >= 50 }
}

const quality = (weight: number, a: CriterionSeed, b: CriterionSeed): GroupSeed => ({
  id: 'quality',
  name: 'Chất lượng sản phẩm',
  tag: 'operations',
  weight,
  criteria: [a, b],
})

const service = (weight: number, a: CriterionSeed, b: CriterionSeed): GroupSeed => ({
  id: 'service',
  name: 'Dịch vụ khách hàng',
  tag: 'customer_service',
  weight,
  criteria: [a, b],
})

const speed = (weight: number, a: CriterionSeed, b: CriterionSeed): GroupSeed => ({
  id: 'speed',
  name: 'Tốc độ phục vụ',
  tag: 'operations',
  weight,
  criteria: [a, b],
})

const hygiene = (weight: number): GroupSeed => ({
  id: 'hygiene',
  name: 'Vệ sinh và an toàn',
  tag: 'discipline',
  weight,
  criteria: [
    metric('checklist', 'Tuân thủ checklist vệ sinh', 'Hoàn tất checklist vệ sinh theo ca, khu vực và tiêu chuẩn an toàn thực phẩm.', 60, 'percent', 'higher', 'hygiene_checklist_rate'),
    metric('incidents', 'Sự cố vệ sinh', 'Số sự cố vệ sinh hoặc an toàn thực phẩm được xác nhận trong kỳ.', 40, 'count', 'lower', 'hygiene_incident_count'),
  ],
})

const teamwork = (weight: number): GroupSeed => ({
  id: 'teamwork',
  name: 'Phối hợp đội nhóm',
  tag: 'operations',
  weight,
  criteria: [
    metric('handover', 'Bàn giao ca rõ ràng', 'Bàn giao tồn kho, việc dang dở và rủi ro vận hành trước khi kết ca.', 55, 'score', 'rubric'),
    metric('support', 'Hỗ trợ đồng đội giờ cao điểm', 'Chủ động hỗ trợ vị trí khác khi quầy quá tải hoặc thiếu người.', 45, 'score', 'rubric'),
  ],
})

const discipline = (weight: number): GroupSeed => ({
  id: 'discipline',
  name: 'Kỷ luật vận hành',
  tag: 'discipline',
  weight,
  criteria: [
    metric('attendance', 'Đúng giờ và đủ ca', 'Tỷ lệ ca làm đúng giờ, không tự ý đổi ca hoặc nghỉ không báo trước.', 60, 'percent', 'higher', 'on_time_shift_rate'),
    metric('policy', 'Tuân thủ nội quy', 'Số lỗi nội quy đã xác nhận trong kỳ KPI.', 40, 'count', 'lower', 'policy_incident_count'),
  ],
})

export const FNB_KPI_TEMPLATES: FnbKpiTemplate[] = [
  template('barista', 'Pha chế', [
    quality(30, metric('recipe_accuracy', 'Đúng công thức', 'Tỷ lệ ly pha đúng định lượng, topping, đá đường và tiêu chuẩn trình bày.', 60, 'percent', 'higher', 'recipe_accuracy_rate'), metric('drink_consistency', 'Độ ổn định chất lượng ly', 'Điểm đánh giá độ đồng nhất hương vị và hình thức trong ca.', 40, 'score', 'rubric')),
    speed(20, metric('ticket_time', 'Thời gian ra món', 'Tỷ lệ đơn hoàn thành trong chuẩn thời gian theo từng nhóm sản phẩm.', 60, 'percent', 'higher', 'drink_sla_rate'), metric('rush_recovery', 'Xử lý giờ cao điểm', 'Khả năng giữ nhịp pha chế và ưu tiên đơn khi lượng khách tăng mạnh.', 40, 'score', 'rubric')),
    hygiene(15),
    service(15, metric('handoff_clarity', 'Bàn giao đồ uống rõ ràng', 'Gọi món, xác nhận topping và chuyển ly cho thu ngân/phục vụ không gây nhầm lẫn.', 50, 'score', 'rubric'), metric('complaints', 'Khiếu nại chất lượng', 'Số khiếu nại hợp lệ liên quan trực tiếp đến đồ uống.', 50, 'count', 'lower', 'drink_complaint_count')),
    teamwork(10),
    discipline(10),
  ]),
  template('cashier', 'Thu ngân', [
    service(25, metric('greeting', 'Chào hỏi và tư vấn món', 'Chào khách, tư vấn combo, xác nhận nhu cầu và nhắc ưu đãi phù hợp.', 50, 'score', 'rubric'), metric('rating', 'Đánh giá trải nghiệm tại quầy', 'Tỷ lệ phản hồi tích cực về thái độ phục vụ tại quầy.', 50, 'percent', 'higher', 'counter_positive_rate')),
    quality(25, metric('order_accuracy', 'Nhập đơn chính xác', 'Tỷ lệ đơn không sai size, topping, đá đường, thanh toán hoặc ghi chú.', 65, 'percent', 'higher', 'order_accuracy_rate'), metric('cash_accuracy', 'Chênh lệch tiền ca', 'Số lần lệch tiền, sai khuyến mãi hoặc sai phương thức thanh toán.', 35, 'count', 'lower', 'cash_variance_count')),
    speed(20, metric('queue_sla', 'Tốc độ xử lý hàng chờ', 'Tỷ lệ khách được nhận order trong chuẩn thời gian cao điểm.', 60, 'percent', 'higher', 'queue_sla_rate'), metric('handoff_speed', 'Chuyển đơn sang quầy pha chế', 'Đơn được xác nhận và chuyển quầy nhanh, đủ ghi chú để tránh hỏi lại.', 40, 'score', 'rubric')),
    discipline(15),
    teamwork(10),
    hygiene(5),
  ]),
  template('server', 'Phục vụ', [
    service(30, metric('table_care', 'Chăm sóc khu vực khách', 'Chủ động quan sát bàn, hỗ trợ khách, dọn ly và phản hồi yêu cầu.', 55, 'score', 'rubric'), metric('feedback', 'Phản hồi tích cực từ khách', 'Tỷ lệ đánh giá tốt liên quan đến phục vụ tại sảnh.', 45, 'percent', 'higher', 'service_positive_rate')),
    speed(20, metric('delivery_time', 'Thời gian giao món', 'Tỷ lệ món được giao đúng khách và đúng chuẩn thời gian sau khi hoàn thành.', 60, 'percent', 'higher', 'delivery_sla_rate'), metric('pickup_accuracy', 'Lấy đúng món đúng bàn', 'Số lần giao nhầm bàn, thiếu món hoặc thiếu dụng cụ.', 40, 'count', 'lower', 'delivery_error_count')),
    hygiene(15),
    quality(15, metric('display_standard', 'Trưng bày khu vực sảnh', 'Khu vực bàn ghế, menu, quầy nhận món được giữ đúng tiêu chuẩn hình ảnh.', 50, 'score', 'rubric'), metric('restock', 'Bổ sung vật dụng kịp thời', 'Ống hút, khăn giấy, nắp ly và vật dụng khách dùng được bổ sung đúng lúc.', 50, 'score', 'rubric')),
    teamwork(10),
    discipline(10),
  ]),
  template('kitchen', 'Bếp và chuẩn bị nguyên liệu', [
    quality(30, metric('prep_accuracy', 'Sơ chế đúng chuẩn', 'Nguyên liệu, topping và bán thành phẩm đúng định lượng, hạn dùng và nhãn ca.', 60, 'percent', 'higher', 'prep_accuracy_rate'), metric('waste_control', 'Kiểm soát hao hụt', 'Số lần hao hụt bất thường do sơ chế, bảo quản hoặc dự báo sai.', 40, 'count', 'lower', 'prep_waste_count')),
    hygiene(25),
    speed(20, metric('prep_sla', 'Chuẩn bị kịp giờ bán', 'Tỷ lệ hạng mục chuẩn bị hoàn tất trước mốc giờ vận hành.', 65, 'percent', 'higher', 'prep_sla_rate'), metric('stockout', 'Thiếu nguyên liệu trong ca', 'Số lần thiếu nguyên liệu có thể phòng tránh trong khung bán hàng.', 35, 'count', 'lower', 'avoidable_stockout_count')),
    teamwork(15),
    discipline(10),
  ]),
  template('shift_leader', 'Trưởng ca', [
    quality(25, metric('shift_readiness', 'Sẵn sàng vận hành ca', 'Nhân sự, nguyên liệu, máy móc và khu vực bán hàng sẵn sàng trước giờ cao điểm.', 55, 'score', 'rubric'), metric('issue_resolution', 'Xử lý sự cố trong ca', 'Sự cố khách hàng, thiết bị, đơn hàng được xử lý đúng mức và ghi nhận đủ.', 45, 'score', 'rubric')),
    service(20, metric('team_service', 'Chất lượng phục vụ toàn ca', 'Duy trì nhịp phục vụ, thái độ và tiêu chuẩn giao tiếp của đội trong ca.', 60, 'score', 'rubric'), metric('complaint_recovery', 'Phục hồi khi có khiếu nại', 'Tỷ lệ khiếu nại được xử lý trong ca trước khi leo thang.', 40, 'percent', 'higher', 'complaint_recovery_rate')),
    speed(20, metric('peak_flow', 'Điều phối giờ cao điểm', 'Điều phối vị trí, ưu tiên đơn và mở điểm nghẽn khi quầy quá tải.', 60, 'score', 'rubric'), metric('sla_control', 'Giữ SLA đơn hàng', 'Tỷ lệ đơn toàn ca hoàn thành trong chuẩn thời gian.', 40, 'percent', 'higher', 'shift_sla_rate')),
    discipline(15),
    teamwork(10),
    hygiene(10),
  ]),
  template('store_manager', 'Quản lý cửa hàng', [
    { id: 'business', name: 'Kết quả kinh doanh', tag: 'revenue', weight: 30, criteria: [metric('sales_target', 'Đạt doanh thu mục tiêu', 'Tỷ lệ hoàn thành doanh thu theo mục tiêu tháng của cửa hàng.', 55, 'percent', 'higher', 'sales_target_rate'), metric('cost_control', 'Kiểm soát chi phí vận hành', 'Tuân thủ định mức nguyên vật liệu, nhân công và chi phí phát sinh.', 45, 'percent', 'higher', 'cost_control_rate')] },
    quality(20, metric('store_standard', 'Chuẩn vận hành cửa hàng', 'Điểm audit vận hành tổng thể theo checklist Homies.', 55, 'score', 'rubric'), metric('incident_rate', 'Sự cố vận hành nghiêm trọng', 'Số sự cố nghiêm trọng trong tháng thuộc trách nhiệm quản lý cửa hàng.', 45, 'count', 'lower', 'critical_incident_count')),
    service(15, metric('customer_nps', 'Hài lòng khách hàng', 'Tỷ lệ phản hồi tích cực và điểm đánh giá kênh bán chính.', 55, 'percent', 'higher', 'customer_positive_rate'), metric('complaint_closure', 'Đóng khiếu nại đúng hạn', 'Tỷ lệ khiếu nại được phản hồi và đóng trong thời hạn quy định.', 45, 'percent', 'higher', 'complaint_closure_rate')),
    { id: 'people', name: 'Nhân sự và đào tạo', tag: 'operations', weight: 15, criteria: [metric('staffing', 'Đủ nhân sự theo nhu cầu', 'Ca làm được bố trí đủ người theo dự báo doanh thu và khung giờ.', 50, 'percent', 'higher', 'staffing_coverage_rate'), metric('coaching', 'Huấn luyện và giữ chuẩn đội ngũ', 'Theo dõi năng lực, phản hồi và kèm cặp nhân viên đúng nhịp.', 50, 'score', 'rubric')] },
    discipline(10),
    hygiene(10),
  ]),
]

export function getFnbTemplate(id: KpiTemplateId): FnbKpiTemplate {
  const found = FNB_KPI_TEMPLATES.find((templateItem) => templateItem.id === id)

  if (!found) {
    throw new Error(`Unknown F&B KPI template: ${id}`)
  }

  return structuredClone(found)
}

export function createVersionFromTemplate(
  templateId: KpiTemplateId,
  positionIds: string[],
  actorId: string,
  versionNumber: number,
  at: string,
): KpiSetVersion {
  const selected = getFnbTemplate(templateId)

  return {
    id: `kpi_${templateId}_v${versionNumber}`,
    set_id: `kpi_${templateId}`,
    version: versionNumber,
    name: selected.name,
    status: 'draft',
    template_id: templateId,
    position_ids: [...positionIds],
    setup_step: 'criteria',
    level_codes: ['pt1_tn', 'pt1_pc', 'pt2', 'senior', 'shift_leader'],
    store_ids: 'all',
    effective_from: at,
    score_scale: [1, 2, 3, 4, 5],
    groups: selected.groups,
    created_by: actorId,
    created_at: at,
  }
}
