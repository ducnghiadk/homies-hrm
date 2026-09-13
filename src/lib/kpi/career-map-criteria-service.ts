import type {
  KpiCareerCriterion,
  KpiCareerEvidenceSource,
  KpiCareerPositionSnapshot,
  KpiCriteriaApplyScope,
  KpiCustomCriterionInput,
  KpiPositionCriteriaProfile,
} from './career-map-types.ts'
import type { CareerGradeCode } from './career-grade-types.ts'
import { inferJobFamily } from './career-map-service.ts'

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

export function suggestCriteriaForPosition(position: {
  id: string
  name: string
  level?: number
  job_family?: string
}): KpiCareerCriterion[] {
  const family = position.job_family || inferJobFamily(position.name, position.id)
  const list: KpiCareerCriterion[] = []

  switch (family) {
    case 'barista':
      list.push(
        {
          id: 'crit_barista_recipe',
          name: 'Đúng công thức & Định lượng',
          description: 'Pha chế chuẩn định lượng và công thức chuẩn Homies',
          source: 'homies_recommended',
          evidence_source: 'checklist',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '≥ 95%',
          suggested_weight: 25,
          weight: 25,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_barista_speed',
          name: 'Tốc độ ra món',
          description: 'Thời gian ra món trung bình không vượt chuẩn',
          source: 'homies_recommended',
          evidence_source: 'pos',
          direction: 'lower_is_better',
          unit: 'phút',
          pass_target: '≤ 3 phút/món',
          suggested_weight: 25,
          weight: 25,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_barista_hygiene',
          name: 'Vệ sinh & ATVSTP quầy bar',
          description: 'Checklist vệ sinh máy pha, quầy pha chế và dụng cụ',
          source: 'homies_recommended',
          evidence_source: 'checklist',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '100% đạt checklist',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'medium',
        },
        {
          id: 'crit_barista_waste',
          name: 'Kiểm soát hao hụt & Bảo quản',
          description: 'Hạn chế thất thoát nguyên liệu sữa, trà, siro',
          source: 'fnb_common',
          evidence_source: 'shift_log',
          direction: 'lower_is_better',
          unit: '%',
          pass_target: '≤ 2%',
          suggested_weight: 15,
          weight: 15,
          locked: false,
          active: true,
          importance: 'medium',
        },
        {
          id: 'crit_barista_attitude',
          name: 'Thái độ phục vụ & Tác phong',
          description: 'Đồng phục, nụ cười và giao tiếp chuẩn mực',
          source: 'fnb_common',
          evidence_source: 'manager_rating',
          direction: 'rubric',
          unit: 'điểm',
          pass_target: '≥ 4.0/5.0',
          suggested_weight: 15,
          weight: 15,
          locked: false,
          active: true,
          importance: 'medium',
        }
      )
      break

    case 'cashier':
      list.push(
        {
          id: 'crit_cashier_accuracy',
          name: 'Chính xác tiền két & Báo cáo ca',
          description: 'Không lệch tiền két ca và bàn giao đầy đủ chứng từ',
          source: 'homies_recommended',
          evidence_source: 'pos',
          direction: 'lower_is_better',
          unit: 'lỗi',
          pass_target: '0 lỗi/tháng',
          suggested_weight: 30,
          weight: 30,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_cashier_order_speed',
          name: 'Tốc độ order & Xử lý hoá đơn',
          description: 'Thời gian hoàn tất thao tác order cho khách',
          source: 'homies_recommended',
          evidence_source: 'pos',
          direction: 'lower_is_better',
          unit: 'giây',
          pass_target: '≤ 45s/bill',
          suggested_weight: 25,
          weight: 25,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_cashier_upsell',
          name: 'Upsell & Gợi ý món mới',
          description: 'Tỷ lệ khách gọi thêm topping/size L theo chương trình',
          source: 'homies_recommended',
          evidence_source: 'pos',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '≥ 20%',
          suggested_weight: 25,
          weight: 25,
          locked: false,
          active: true,
          importance: 'medium',
        },
        {
          id: 'crit_cashier_service',
          name: 'Thái độ phục vụ khách',
          description: 'Chào đón, cảm ơn và giải đáp thắc mắc của khách',
          source: 'fnb_common',
          evidence_source: 'manager_rating',
          direction: 'rubric',
          unit: 'điểm',
          pass_target: '≥ 4.0/5.0',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'medium',
        }
      )
      break

    case 'service':
      list.push(
        {
          id: 'crit_service_delivery',
          name: 'Tốc độ giao món & Dọn bàn',
          description: 'Giao món đúng bàn và dọn bàn sạch ngay khi khách rời đi',
          source: 'homies_recommended',
          evidence_source: 'checklist',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '≥ 95%',
          suggested_weight: 30,
          weight: 30,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_service_hygiene',
          name: 'Vệ sinh khu vực sảnh',
          description: 'Duy trì sàn nhà, bàn ghế, quầy kệ luôn sạch sẽ',
          source: 'homies_recommended',
          evidence_source: 'checklist',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '100% đạt checklist',
          suggested_weight: 25,
          weight: 25,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_service_customer',
          name: 'Thái độ khách hàng',
          description: 'Không để phát sinh khiếu nại về thái độ',
          source: 'fnb_common',
          evidence_source: 'shift_log',
          direction: 'lower_is_better',
          unit: 'khiếu nại',
          pass_target: '0 khiếu nại',
          suggested_weight: 25,
          weight: 25,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_service_teamwork',
          name: 'Hỗ trợ đồng đội trong ca',
          description: 'Sẵn sàng hỗ trợ quầy bar và thu ngân khi đông khách',
          source: 'fnb_common',
          evidence_source: 'peer_review',
          direction: 'rubric',
          unit: 'điểm',
          pass_target: '≥ 4.0/5.0',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'medium',
        }
      )
      break

    case 'kitchen':
      list.push(
        {
          id: 'crit_kitchen_prep',
          name: 'Chất lượng sơ chế & Định lượng',
          description: 'Nấu trân châu, pudding và sơ chế đúng công thức',
          source: 'homies_recommended',
          evidence_source: 'checklist',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '≥ 95%',
          suggested_weight: 30,
          weight: 30,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_kitchen_fifo',
          name: 'Hạn sử dụng & FIFO',
          description: 'Dán nhãn date đầy đủ, tuân thủ nguyên tắc nhập trước xuất trước',
          source: 'homies_recommended',
          evidence_source: 'checklist',
          direction: 'lower_is_better',
          unit: 'lỗi',
          pass_target: '0 lỗi/tháng',
          suggested_weight: 25,
          weight: 25,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_kitchen_speed',
          name: 'Tốc độ nấu & Ra topping',
          description: 'Cung cấp đủ topping cho quầy pha chế trước giờ cao điểm',
          source: 'homies_recommended',
          evidence_source: 'shift_log',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '≥ 95%',
          suggested_weight: 25,
          weight: 25,
          locked: false,
          active: true,
          importance: 'medium',
        },
        {
          id: 'crit_kitchen_hygiene',
          name: 'An toàn vệ sinh bếp',
          description: 'Vệ sinh bếp nấu, tủ lạnh và kho bảo quản',
          source: 'fnb_common',
          evidence_source: 'checklist',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '100% đạt',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'medium',
        }
      )
      break

    case 'management':
    default:
      if (
        removeVietnameseTones(position.name).includes('quan ly') ||
        (position.level && position.level >= 4)
      ) {
        list.push(
          {
            id: 'crit_sm_revenue',
            name: 'Doanh thu & Chi phí vận hành',
            description: 'Đạt chỉ tiêu doanh thu và kiểm soát chi phí cos/labour trong định mức',
            source: 'homies_recommended',
            evidence_source: 'pos',
            direction: 'higher_is_better',
            unit: '%',
            pass_target: '≥ 100% kế hoạch',
            suggested_weight: 35,
            weight: 35,
            locked: false,
            active: true,
            importance: 'high',
          },
          {
            id: 'crit_sm_team',
            name: 'Quản trị nhân sự & Đào tạo',
            description: 'Giữ chân nhân sự, hạn chế nghỉ việc và hoàn thành lộ trình đào tạo',
            source: 'homies_recommended',
            evidence_source: 'manager_rating',
            direction: 'higher_is_better',
            unit: '%',
            pass_target: '≥ 90%',
            suggested_weight: 25,
            weight: 25,
            locked: false,
            active: true,
            importance: 'high',
          },
          {
            id: 'crit_sm_cx',
            name: 'Trải nghiệm khách hàng & Vệ sinh chuỗi',
            description: 'Điểm đánh giá audit chuỗi và mức độ hài lòng khách hàng',
            source: 'fnb_common',
            evidence_source: 'checklist',
            direction: 'higher_is_better',
            unit: 'điểm',
            pass_target: '≥ 90/100',
            suggested_weight: 20,
            weight: 20,
            locked: false,
            active: true,
            importance: 'medium',
          },
          {
            id: 'crit_sm_compliance',
            name: 'Quản trị sự cố & Tuân thủ quy trình',
            description: 'Xử lý sự cố trong SLA, không phát sinh vi phạm nghiêm trọng',
            source: 'fnb_common',
            evidence_source: 'shift_log',
            direction: 'lower_is_better',
            unit: 'vi phạm',
            pass_target: '0 vi phạm nặng',
            suggested_weight: 20,
            weight: 20,
            locked: false,
            active: true,
            importance: 'medium',
          }
        )
      } else {
        // Shift Leader
        list.push(
          {
            id: 'crit_sl_coordination',
            name: 'Điều phối ca & Đúng checklist',
            description: 'Mở/đóng ca đúng giờ, phân công vị trí ca hợp lý và hoàn tất checklist',
            source: 'homies_recommended',
            evidence_source: 'checklist',
            direction: 'higher_is_better',
            unit: '%',
            pass_target: '100% hoàn tất',
            suggested_weight: 30,
            weight: 30,
            locked: false,
            active: true,
            importance: 'high',
          },
          {
            id: 'crit_sl_incident',
            name: 'Xử lý sự cố & Khiếu nại tại ca',
            description: 'Giải quyết thỏa đáng khiếu nại khách hàng và ghi nhật ký sự cố',
            source: 'homies_recommended',
            evidence_source: 'shift_log',
            direction: 'higher_is_better',
            unit: '%',
            pass_target: '≥ 95% xử lý tốt',
            suggested_weight: 25,
            weight: 25,
            locked: false,
            active: true,
            importance: 'high',
          },
          {
            id: 'crit_sl_coaching',
            name: 'Đào tạo & Kèm cặp nhân viên',
            description: 'Hướng dẫn nhân viên mới và củng cố kỹ năng trong ca',
            source: 'homies_recommended',
            evidence_source: 'peer_review',
            direction: 'rubric',
            unit: 'điểm',
            pass_target: '≥ 4.0/5.0',
            suggested_weight: 25,
            weight: 25,
            locked: false,
            active: true,
            importance: 'medium',
          },
          {
            id: 'crit_sl_handover',
            name: 'Báo cáo ca & Bàn giao',
            description: 'Kiểm kê bàn giao tiền két, nguyên vật liệu và ca tiếp theo chuẩn xác',
            source: 'fnb_common',
            evidence_source: 'pos',
            direction: 'higher_is_better',
            unit: '%',
            pass_target: '100%',
            suggested_weight: 20,
            weight: 20,
            locked: false,
            active: true,
            importance: 'medium',
          }
        )
      }
      break
  }

  return list
}

export function createCustomCriterion(input: KpiCustomCriterionInput): KpiCareerCriterion {
  const cleanOutcome = removeVietnameseTones(input.outcome || '')
  const cleanTarget = removeVietnameseTones(input.pass_target || '')

  let direction: 'higher_is_better' | 'lower_is_better' | 'rubric' = 'higher_is_better'
  if (
    cleanOutcome.includes('giam') ||
    cleanOutcome.includes('sai') ||
    cleanOutcome.includes('loi') ||
    cleanOutcome.includes('khieu nai') ||
    cleanOutcome.includes('hao hut') ||
    cleanOutcome.includes('that thoat') ||
    cleanTarget.includes('khong qua') ||
    cleanTarget.includes('toi da') ||
    cleanTarget.includes('<=') ||
    cleanTarget.includes('≤') ||
    cleanTarget.includes('0 ') ||
    cleanTarget === '0'
  ) {
    direction = 'lower_is_better'
  } else if (cleanTarget.includes('/5') || cleanTarget.includes('diem')) {
    direction = 'rubric'
  }

  let suggestedWeight = 20
  if (input.importance === 'high') {
    suggestedWeight = 30
  } else if (input.importance === 'low') {
    suggestedWeight = 10
  }

  let evidenceSource: KpiCareerEvidenceSource = 'checklist'
  if (typeof input.evidence_source === 'string') {
    const ev = input.evidence_source.toLowerCase()
    if (ev.includes('pos')) evidenceSource = 'pos'
    else if (ev.includes('log') || ev.includes('nhat ky')) evidenceSource = 'shift_log'
    else if (ev.includes('quan ly') || ev.includes('manager')) evidenceSource = 'manager_rating'
    else if (ev.includes('dong nghiep') || ev.includes('peer')) evidenceSource = 'peer_review'
    else if (ev.includes('checklist')) evidenceSource = 'checklist'
    else evidenceSource = 'other'
  }

  const name = input.custom_name?.trim() || input.outcome.trim()

  return {
    id: `crit_custom_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    name,
    description: input.outcome,
    source: 'custom',
    evidence_source: evidenceSource,
    direction,
    unit: input.unit || (direction === 'lower_is_better' ? 'lỗi' : '%'),
    pass_target: input.pass_target,
    suggested_weight: suggestedWeight,
    weight: suggestedWeight,
    locked: false,
    active: true,
    importance: input.importance,
  }
}

export function rebalanceCriteriaWeights<T extends { id: string; weight: number; locked?: boolean }>(
  items: T[]
): T[] {
  if (!items || items.length === 0) return []

  const lockedItems = items.filter((i) => i.locked)
  const unlockedItems = items.filter((i) => !i.locked)

  const lockedSum = lockedItems.reduce((sum, i) => sum + i.weight, 0)
  if (lockedSum >= 100) {
    // Cannot rebalance unlocked items if locked sum exceeds 100
    return items.map((i) => (i.locked ? { ...i } : { ...i, weight: 0 }))
  }

  if (unlockedItems.length === 0) {
    return items.map((i) => ({ ...i }))
  }

  const remaining = 100 - lockedSum
  const currentUnlockedTotal = unlockedItems.reduce((sum, i) => sum + (i.weight > 0 ? i.weight : 1), 0)

  // Proportional rebalance
  const scaled = unlockedItems.map((item) => {
    const rawVal = item.weight > 0 ? item.weight : 1
    const newWeight = Math.round((rawVal / currentUnlockedTotal) * remaining)
    return { ...item, weight: Math.max(1, newWeight) }
  })

  // Correct rounding diff
  const scaledSum = scaled.reduce((sum, i) => sum + i.weight, 0)
  const diff = remaining - scaledSum

  if (diff !== 0 && scaled.length > 0) {
    // Add diff to item with largest weight
    let maxIdx = 0
    for (let i = 1; i < scaled.length; i++) {
      if (scaled[i].weight > scaled[maxIdx].weight) {
        maxIdx = i
      }
    }
    scaled[maxIdx].weight += diff
  }

  const resultMap = new Map<string, number>()
  scaled.forEach((s) => resultMap.set(s.id, s.weight))

  return items.map((item) => {
    if (item.locked) return { ...item }
    return { ...item, weight: resultMap.get(item.id) ?? item.weight }
  })
}

export function applyCriterionToScope(
  scope: KpiCriteriaApplyScope,
  criterion: KpiCareerCriterion,
  allPositions: KpiCareerPositionSnapshot[],
  existingProfiles: KpiPositionCriteriaProfile[]
): { affected_position_ids: string[]; updated_profiles: KpiPositionCriteriaProfile[] } {
  let affectedPositionIds: string[] = []

  if (scope.mode === 'current_position') {
    affectedPositionIds = [scope.position_id]
  } else if (scope.mode === 'job_family') {
    const targetFamily = scope.job_family.toLowerCase()
    affectedPositionIds = allPositions
      .filter((p) => {
        const family = (p.job_family || inferJobFamily(p.name, p.id)).toLowerCase()
        return family === targetFamily
      })
      .map((p) => p.id)
  } else if (scope.mode === 'selected_positions') {
    affectedPositionIds = [...scope.position_ids]
  }

  const updatedProfiles = existingProfiles.map((prof) => ({
    ...prof,
    criteria: [...prof.criteria],
  }))

  for (const posId of affectedPositionIds) {
    let profile = updatedProfiles.find((p) => p.position_ids.includes(posId))
    if (!profile) {
      const posObj = allPositions.find((p) => p.id === posId)
      profile = {
        id: `profile_${posId}`,
        position_ids: [posId],
        job_family: posObj?.job_family || (posObj ? inferJobFamily(posObj.name, posObj.id) : null),
        version: 1,
        effective_from: null,
        criteria: [],
      }
      updatedProfiles.push(profile)
    }

    const existingCritIdx = profile.criteria.findIndex((c) => c.id === criterion.id)
    if (existingCritIdx >= 0) {
      profile.criteria[existingCritIdx] = { ...criterion }
    } else {
      profile.criteria.push({ ...criterion })
    }

    profile.criteria = rebalanceCriteriaWeights(profile.criteria)
  }

  return {
    affected_position_ids: affectedPositionIds,
    updated_profiles: updatedProfiles,
  }
}

export function suggestCriteriaForGrade(gradeCode: CareerGradeCode): KpiCareerCriterion[] {
  switch (gradeCode) {
    case 'c1_pc':
      return [
        {
          id: 'crit_c1_pc_recipe',
          name: 'Tuân thủ công thức & Định lượng chuẩn vị',
          description: '100% ly đồ uống chuẩn công thức Homies, không sai lệch đường/đá/topping',
          source: 'homies_recommended',
          evidence_source: 'checklist',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '100% chuẩn vị',
          suggested_weight: 25,
          weight: 25,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c1_pc_speed',
          name: 'Tốc độ pha chế & Năng suất quầy bar',
          description: 'Thời gian ra món trung bình ≤ 90s/ly đơn; ≤ 3 phút/đơn 4 ly',
          source: 'homies_recommended',
          evidence_source: 'pos',
          direction: 'lower_is_better',
          unit: 's',
          pass_target: '≤ 90s/ly',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c1_pc_waste',
          name: 'Kiểm soát hao hụt & Bảo quản NVL',
          description: 'Tỷ lệ hao hụt nguyên vật liệu ≤ 1.5%; dán tem date 100%',
          source: 'fnb_common',
          evidence_source: 'shift_log',
          direction: 'lower_is_better',
          unit: '%',
          pass_target: '≤ 1.5%',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'medium',
        },
        {
          id: 'crit_c1_pc_hygiene',
          name: 'Vệ sinh trạm & Tiêu chuẩn VSATTP',
          description: 'Quầy bar, máy móc, dụng cụ sạch sẽ; 100% tuân thủ 5S và VSATTP',
          source: 'homies_recommended',
          evidence_source: 'checklist',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '100% đạt chuẩn',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'medium',
        },
        {
          id: 'crit_c1_pc_attitude',
          name: 'Tác phong, Chuyên cần & Kỷ luật ca',
          description: 'Đúng giờ, đồng phục chuẩn, tác phong nhanh nhẹn, chấp hành phân công',
          source: 'homies_recommended',
          evidence_source: 'manager_rating',
          direction: 'rubric',
          unit: 'điểm',
          pass_target: '≥ 4.5/5.0',
          suggested_weight: 15,
          weight: 15,
          locked: false,
          active: true,
          importance: 'medium',
        },
      ]

    case 'c1_tn':
      return [
        {
          id: 'crit_c1_tn_cash',
          name: 'Thao tác POS & Độ chính xác dòng tiền',
          description: 'Lệch két = 0 VNĐ; 100% ghi nhận đúng món, đúng ghi chú khách',
          source: 'homies_recommended',
          evidence_source: 'pos',
          direction: 'higher_is_better',
          unit: 'VNĐ',
          pass_target: 'Lệch = 0đ',
          suggested_weight: 30,
          weight: 30,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c1_tn_speed',
          name: 'Tốc độ phục vụ & Xử lý thanh toán',
          description: 'Thời gian order ≤ 45s/khách; thao tác thanh toán tiền mặt/QR chuẩn xác',
          source: 'homies_recommended',
          evidence_source: 'pos',
          direction: 'lower_is_better',
          unit: 's',
          pass_target: '≤ 45s/khách',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c1_tn_upsell',
          name: 'Kỹ năng Upsell & Giới thiệu chương trình',
          description: 'Tỷ lệ mời thành công nâng size/topping/combo ≥ 20% lượt khách',
          source: 'homies_recommended',
          evidence_source: 'pos',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '≥ 20%',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'medium',
        },
        {
          id: 'crit_c1_tn_csat',
          name: 'Giao tiếp & Trải nghiệm khách hàng (CSAT)',
          description: 'Thực hiện đúng quy chuẩn 4 bước đón tiếp Homies',
          source: 'homies_recommended',
          evidence_source: 'manager_rating',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '100% chuẩn Homies',
          suggested_weight: 15,
          weight: 15,
          locked: false,
          active: true,
          importance: 'medium',
        },
        {
          id: 'crit_c1_tn_attitude',
          name: 'Tác phong, Chuyên cần & Kỷ luật ca',
          description: 'Đúng giờ, đồng phục chuẩn, khu vực thu ngân & sảnh luôn sạch sẽ',
          source: 'homies_recommended',
          evidence_source: 'manager_rating',
          direction: 'rubric',
          unit: 'điểm',
          pass_target: '≥ 4.5/5.0',
          suggested_weight: 15,
          weight: 15,
          locked: false,
          active: true,
          importance: 'medium',
        },
      ]

    case 'c2':
      return [
        {
          id: 'crit_c2_barista',
          name: 'Chất lượng & Năng suất Trạm Pha chế',
          description: 'Đạt chuẩn chất lượng đồ uống, tốc độ ra món ổn định theo định mức C1-PC',
          source: 'homies_recommended',
          evidence_source: 'checklist',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '≥ 95%',
          suggested_weight: 25,
          weight: 25,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c2_cashier',
          name: 'Chất lượng & Năng suất Trạm Thu ngân',
          description: 'Thao tác POS chuẩn xác, không lệch tiền, duy trì tỷ lệ Upsell ≥ 20%',
          source: 'homies_recommended',
          evidence_source: 'pos',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '≥ 95%',
          suggested_weight: 25,
          weight: 25,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c2_agility',
          name: 'Linh hoạt đổi trạm & Ứng biến giờ cao điểm',
          description: 'Sẵn sàng hoán đổi vị trí linh hoạt theo điều phối ca khi quán đông khách',
          source: 'homies_recommended',
          evidence_source: 'manager_rating',
          direction: 'higher_is_better',
          unit: 'điểm',
          pass_target: '≥ 4.5/5.0',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c2_waste',
          name: 'Kiểm soát hao hụt & Vệ sinh toàn diện',
          description: 'Duy trì 5S cả quầy bar lẫn thu ngân, giảm thiểu đổ vỡ/hỏng món',
          source: 'fnb_common',
          evidence_source: 'shift_log',
          direction: 'lower_is_better',
          unit: '%',
          pass_target: '≤ 1.5%',
          suggested_weight: 15,
          weight: 15,
          locked: false,
          active: true,
          importance: 'medium',
        },
        {
          id: 'crit_c2_discipline',
          name: 'Tác phong, Tỷ lệ chuyên cần & Kỷ luật',
          description: 'Tỷ lệ đi làm đúng ca 100%, không vi phạm nội quy, thái độ tích cực',
          source: 'homies_recommended',
          evidence_source: 'manager_rating',
          direction: 'rubric',
          unit: '%',
          pass_target: '100% đúng ca',
          suggested_weight: 15,
          weight: 15,
          locked: false,
          active: true,
          importance: 'medium',
        },
      ]

    case 'c3':
      return [
        {
          id: 'crit_c3_operations',
          name: 'Hiệu suất vận hành xuất sắc cả 2 trạm',
          description: 'Năng suất vượt trội, là trụ cột xử lý các đơn hàng lớn/phức tạp trong ca',
          source: 'homies_recommended',
          evidence_source: 'pos',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '≥ 98%',
          suggested_weight: 25,
          weight: 25,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c3_buddy',
          name: 'Kèm cặp, Hướng dẫn nhân viên mới (Buddy)',
          description: 'Trực tiếp hướng dẫn nhân viên mới; ≥ 90% mentee vượt qua thử việc',
          source: 'homies_recommended',
          evidence_source: 'manager_rating',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '≥ 90% đạt chuẩn',
          suggested_weight: 25,
          weight: 25,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c3_problem_solving',
          name: 'Xử lý tình huống & CSAT khách hàng',
          description: 'Khéo léo xử lý phàn nàn/khiếu nại cấp độ 1 tại quầy, giữ hài lòng khách hàng',
          source: 'homies_recommended',
          evidence_source: 'manager_rating',
          direction: 'higher_is_better',
          unit: 'điểm',
          pass_target: '≥ 4.5/5.0',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c3_support',
          name: 'Hỗ trợ quản lý Checklist & Kiểm kê ca',
          description: 'Hỗ trợ Trưởng ca mở/đóng ca, đếm tồn nguyên vật liệu và kiểm tra 5S',
          source: 'homies_recommended',
          evidence_source: 'checklist',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '100% hoàn thành',
          suggested_weight: 15,
          weight: 15,
          locked: false,
          active: true,
          importance: 'medium',
        },
        {
          id: 'crit_c3_culture',
          name: 'Gương mẫu văn hóa & Đóng góp cải tiến',
          description: 'Gương mẫu về tác phong, chủ động đề xuất sáng kiến tối ưu thao tác quầy',
          source: 'homies_recommended',
          evidence_source: 'manager_rating',
          direction: 'rubric',
          unit: 'điểm',
          pass_target: '≥ 4.5/5.0',
          suggested_weight: 15,
          weight: 15,
          locked: false,
          active: true,
          importance: 'medium',
        },
      ]

    case 'c4':
      return [
        {
          id: 'crit_c4_revenue',
          name: 'Chỉ tiêu Doanh thu & Năng suất ca trực',
          description: 'Ca trực đạt kế hoạch doanh thu phân bổ; phân chia ca làm việc tối ưu năng suất',
          source: 'homies_recommended',
          evidence_source: 'pos',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '≥ 100% kế hoạch',
          suggested_weight: 25,
          weight: 25,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c4_coordination',
          name: 'Điều phối nhân sự & Kỷ luật ca',
          description: 'Phân công trạm hợp lý, duy trì nhịp độ làm việc, xử lý kịp thời phát sinh',
          source: 'homies_recommended',
          evidence_source: 'manager_rating',
          direction: 'higher_is_better',
          unit: 'điểm',
          pass_target: '≥ 4.5/5.0',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c4_cost',
          name: 'Kiểm soát thất thoát, NVL & Két tiền ca',
          description: 'Bàn giao tiền két chuẩn 100%; tỷ lệ hao hụt nguyên vật liệu trong ca ≤ 1.2%',
          source: 'homies_recommended',
          evidence_source: 'shift_log',
          direction: 'lower_is_better',
          unit: '%',
          pass_target: '≤ 1.2%',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c4_checklist',
          name: 'Hoàn thành Checklist mở/giao/đóng ca & 5S',
          description: '100% ca hoàn thành checklist số hóa; đạt chuẩn an toàn vệ sinh thực phẩm',
          source: 'homies_recommended',
          evidence_source: 'checklist',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '100% hoàn thành',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c4_coaching',
          name: 'Đào tạo tại chỗ (OJT) & Đánh giá nhân viên',
          description: 'Kèm cặp nhân sự trong ca, ghi nhận và đánh giá KPI thành viên minh bạch',
          source: 'homies_recommended',
          evidence_source: 'manager_rating',
          direction: 'rubric',
          unit: 'điểm',
          pass_target: '≥ 4.5/5.0',
          suggested_weight: 15,
          weight: 15,
          locked: false,
          active: true,
          importance: 'medium',
        },
      ]

    case 'c5':
      return [
        {
          id: 'crit_c5_pnl',
          name: 'Doanh thu, Lợi nhuận P&L & Tăng trưởng',
          description: 'Đạt và vượt chỉ tiêu doanh số tháng; kiểm soát chi phí vận hành trong hạn mức',
          source: 'homies_recommended',
          evidence_source: 'pos',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '≥ 100% P&L',
          suggested_weight: 30,
          weight: 30,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c5_cost',
          name: 'Kiểm soát Cost NVL & Hao hụt toàn cửa hàng',
          description: 'Tỷ lệ Cost NVL thực tế bám sát định mức (Cost Variance ≤ 1.0%); kiểm kê kho chuẩn',
          source: 'homies_recommended',
          evidence_source: 'shift_log',
          direction: 'lower_is_better',
          unit: '%',
          pass_target: 'Variance ≤ 1.0%',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c5_hr',
          name: 'Quản trị nhân sự, Đào tạo & Giữ chân',
          description: 'Đảm bảo định biên nhân sự, tỷ lệ gắn kết cao, đào tạo tối thiểu 1 Trưởng ca mới',
          source: 'homies_recommended',
          evidence_source: 'manager_rating',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '100% định biên',
          suggested_weight: 20,
          weight: 20,
          locked: false,
          active: true,
          importance: 'high',
        },
        {
          id: 'crit_c5_csat',
          name: 'Trải nghiệm khách hàng & Chất lượng dịch vụ',
          description: 'Điểm đánh giá CSAT cửa hàng ≥ 4.8/5.0 sao; 0 khiếu nại nghiêm trọng',
          source: 'homies_recommended',
          evidence_source: 'manager_rating',
          direction: 'higher_is_better',
          unit: 'sao',
          pass_target: '≥ 4.8 sao',
          suggested_weight: 15,
          weight: 15,
          locked: false,
          active: true,
          importance: 'medium',
        },
        {
          id: 'crit_c5_audit',
          name: 'Tuân thủ tiêu chuẩn Audit chuỗi & Pháp lý',
          description: 'Điểm thanh tra định kỳ từ Trụ sở ≥ 95/100; chấp hành đầy đủ quy chuẩn chuỗi',
          source: 'homies_recommended',
          evidence_source: 'checklist',
          direction: 'higher_is_better',
          unit: '%',
          pass_target: '≥ 95/100 điểm',
          suggested_weight: 15,
          weight: 15,
          locked: false,
          active: true,
          importance: 'medium',
        },
      ]

    default:
      return []
  }
}

export function createDefaultProfileForGrade(
  gradeCode: CareerGradeCode,
  positionId: string,
  profileId?: string
): KpiPositionCriteriaProfile {
  const suggestions = suggestCriteriaForGrade(gradeCode)
  const balancedCriteria = rebalanceCriteriaWeights(suggestions)
  const isManagement = ['c4', 'c5'].includes(gradeCode)

  return {
    id: profileId || `profile_${gradeCode}_${positionId}`,
    position_ids: [positionId],
    grade_codes: [gradeCode],
    job_family: isManagement ? 'management' : 'store_operations',
    version: 1,
    effective_from: null,
    criteria: balancedCriteria,
  }
}

export function createDefaultProfileForPosition(
  position: KpiCareerPositionSnapshot
): KpiPositionCriteriaProfile {
  const suggestions = suggestCriteriaForPosition(position)
  const balancedCriteria = rebalanceCriteriaWeights(suggestions)

  return {
    id: `profile_${position.id}`,
    position_ids: [position.id],
    job_family: position.job_family || inferJobFamily(position.name, position.id),
    version: 1,
    effective_from: null,
    criteria: balancedCriteria,
  }
}
