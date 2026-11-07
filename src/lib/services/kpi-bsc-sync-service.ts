/**
 * Dịch vụ đồng bộ dữ liệu Vi phạm & Sự cố giữa KPI và BSC
 * Giúp Quản lý hoặc Admin nhập 1 lần:
 * 1) Lưu vào KpiIncident (kpiAdapter) -> Trừ điểm tiêu chí KPI & chặn xét thăng bậc
 * 2) Lưu vào BSCPersonalErrorRecord / BSCOperationErrorRecord (bscAdapter) -> Trừ hệ số chia thưởng BSC
 * 3) Lưu vào mockViolationRecords (violation-service) -> Tương thích ngược với các trang cũ
 */

import { kpiAdapter } from '@/lib/adapters/kpi-adapter'
import { bscAdapter } from '@/lib/adapters/bsc-adapter'
import { logViolation } from '@/lib/violation-service'
import type { KpiIncident, KpiIncidentViolation } from '@/lib/kpi/types'
import type { BSCPersonalErrorRecord, BSCOperationErrorRecord, BSCPersonalErrorGroup, BSCOperationGroup } from '@/lib/bsc-types'

export interface UnifiedIncidentInput {
  id?: string
  employee_id?: string
  employee_name?: string
  store_id: string
  period?: string // '2026-08'
  occurred_at: string
  shift_name?: string
  violation_code: string // mã lỗi hoặc định danh lỗi
  description: string
  penalty_points?: number
  severity?: 'minor' | 'medium' | 'major' | 'critical'
  evidence_url?: string
  logged_by: string
  logged_by_role?: string
  is_operation_error?: boolean
  is_lock_bonus?: boolean
  impact_rating_1star?: boolean // Tác động kép: Gây ảnh hưởng 1 sao / khiếu nại khách hàng cho Quán
  store_points?: number // Số điểm trừ vào bảng vận hành/CSAT của quán nếu là tác động kép
}

export function mapToKpiViolationCode(code: string, description = ''): string {
  const normalized = (code + ' ' + description).toLowerCase()
  if (
    normalized.includes('late') ||
    normalized.includes('l01') ||
    normalized.includes('m01') ||
    normalized.includes('trễ') ||
    normalized.includes('cham_cong')
  ) {
    return 'attendance_late'
  }
  if (
    normalized.includes('absent') ||
    normalized.includes('no_show') ||
    normalized.includes('h01') ||
    normalized.includes('bỏ ca') ||
    normalized.includes('vắng')
  ) {
    return 'attendance_no_show'
  }
  if (
    normalized.includes('topping') ||
    normalized.includes('lam_don') ||
    normalized.includes('sop') ||
    normalized.includes('thành phẩm') ||
    normalized.includes('m02')
  ) {
    return 'wrong_topping'
  }
  if (
    normalized.includes('hygiene') ||
    normalized.includes('vsattp') ||
    normalized.includes('vệ sinh') ||
    normalized.includes('an toàn') ||
    normalized.includes('m03')
  ) {
    return 'hygiene_breach'
  }
  if (
    normalized.includes('cash') ||
    normalized.includes('shortage') ||
    normalized.includes('tiền') ||
    normalized.includes('két') ||
    normalized.includes('s01') ||
    normalized.includes('thu_ngan')
  ) {
    return 'cash_shortage'
  }
  if (
    normalized.includes('complaint') ||
    normalized.includes('customer') ||
    normalized.includes('khách') ||
    normalized.includes('thái độ') ||
    normalized.includes('h02')
  ) {
    return 'customer_complaint'
  }
  return 'wrong_topping'
}

export function mapToBscPersonalGroup(kpiCode: string): { group: BSCPersonalErrorGroup; groupName: string } {
  switch (kpiCode) {
    case 'attendance_late':
    case 'attendance_no_show':
      return { group: 'gio_lam_cham_cong', groupName: 'Giờ làm & Chấm công' }
    case 'hygiene_breach':
      return { group: 'vsattp_quy_trinh', groupName: 'VSATTP & Quy trình' }
    case 'customer_complaint':
      return { group: 'thai_do_ung_xu', groupName: 'Thái độ & Phục vụ' }
    case 'cash_shortage':
    case 'wrong_topping':
    default:
      return { group: 'sai_sot_nghiep_vu', groupName: 'Sai sót nghiệp vụ' }
  }
}

export const kpiBscSyncService = {
  async logIncident(input: UnifiedIncidentInput): Promise<{
    kpiIncident: KpiIncident
    bscErrorId: string
  }> {
    const kpiCode = mapToKpiViolationCode(input.violation_code, input.description)
    const points =
      input.penalty_points ??
      (input.severity === 'critical' ? 50 : input.severity === 'major' ? 20 : input.severity === 'medium' ? 10 : 5)
    const period = input.period || input.occurred_at.slice(0, 7) || '2026-08'
    const empId = input.employee_id || 'system-emp'
    const nowIso = new Date().toISOString()
    const incidentId = input.id || `inc_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`

    // 1. Tạo KpiIncident cho KPI Engine
    const violations: KpiIncidentViolation[] = [
      {
        code: kpiCode,
        primary: true,
        independent_behavior: true,
        reason: input.description,
        evidence_refs: input.evidence_url ? [input.evidence_url] : [],
      },
    ]

    const kpiIncident: KpiIncident = {
      id: incidentId,
      store_id: input.store_id,
      employee_id: empId,
      occurred_at: input.occurred_at || nowIso,
      source: kpiCode.startsWith('attendance') ? 'attendance' : 'operation',
      status: 'confirmed',
      violations,
      description: input.description,
      evidence_refs: input.evidence_url ? [input.evidence_url] : [],
    }

    await kpiAdapter.addIncident(kpiIncident, input.logged_by)

    // 2. Tạo lỗi cho BSC Adapter
    let bscErrorId = ''
    if (input.is_operation_error || !input.employee_id) {
      const opRecord: BSCOperationErrorRecord = {
        id: input.id || `op-err-${Date.now()}`,
        event_id: `evt-${Date.now()}`,
        store_id: input.store_id,
        period,
        shift_name: input.shift_name || 'Ca làm việc',
        event_category: 'operation_store',
        group: 'lam_don' as BSCOperationGroup,
        group_name: 'Lỗi vận hành quán',
        sub_error_id: input.violation_code,
        sub_error_name: input.description,
        example: input.description,
        points,
        occurred_at: input.occurred_at || nowIso,
        source_type: 'internal',
        evidence_type: input.evidence_url ? 'image' : undefined,
        evidence_url: input.evidence_url,
        verifier_name: input.logged_by,
        scope_reason: input.store_id,
        affects_op_score: true,
        affects_personal_multiplier: false,
        affects_customer_score: kpiCode === 'customer_complaint' || Boolean(input.impact_rating_1star),
        locks_personal_bonus: false,
        approval_status: 'proposed_manager',
      }
      await bscAdapter.addOperationError(opRecord)
      bscErrorId = opRecord.id
    } else {
      const { group, groupName } = mapToBscPersonalGroup(kpiCode)
      const personalRecord: BSCPersonalErrorRecord = {
        id: input.id || `bsc-err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        event_id: `evt-${Date.now()}`,
        employee_id: empId,
        period,
        shift_name: input.shift_name || 'Ca làm việc',
        event_category: 'personal',
        group,
        group_name: groupName,
        sub_error_id: input.violation_code,
        sub_error_name: input.description,
        example: input.description,
        impact: input.is_lock_bonus
          ? 'Lỗi đặc biệt nghiêm trọng (Khóa thưởng BSC 0đ)'
          : `Phạt trừ ${points} điểm vào hệ số chia thưởng BSC`,
        points,
        is_serious: Boolean(input.is_lock_bonus || points >= 20),
        occurred_at: input.occurred_at || nowIso,
        source_type: 'internal',
        evidence_type: input.evidence_url ? 'image' : undefined,
        evidence_url: input.evidence_url,
        verifier_name: input.logged_by,
        scope_reason: input.store_id,
        affects_personal_multiplier: true,
        affects_op_score: false,
        affects_customer_score: false,
        locks_personal_bonus: Boolean(input.is_lock_bonus || points >= 30),
        approval_status: 'proposed_manager',
      }
      await bscAdapter.addPersonalError(empId, period, personalRecord)
      bscErrorId = personalRecord.id

      // ── TÁC ĐỘNG KÉP: Ghi nhận thêm 1 sự cố ảnh hưởng Uy Tín & Đánh Giá 1 Sao của Quán trên BSC ──
      if (input.impact_rating_1star) {
        const dualOpRecord: BSCOperationErrorRecord = {
          id: `op-dual-${input.id ? input.id.replace('bsc-err-', '') : Date.now()}`,
          event_id: `evt-dual-${Date.now()}`,
          store_id: input.store_id,
          period,
          shift_name: input.shift_name || 'Ca làm việc',
          event_category: 'operation_store',
          group: 'dich_vu_khach_hang' as BSCOperationGroup,
          group_name: 'Đánh giá khách hàng & Dịch vụ (CSAT)',
          sub_error_id: 'CSAT-1STAR',
          sub_error_name: `[Tác động 1 sao] ${input.description}`,
          example: `Hậu quả dính 1 sao phát sinh từ nhân sự ${input.employee_name || ''}: ${input.description}`,
          points: input.store_points ?? 10,
          occurred_at: input.occurred_at || nowIso,
          source_type: 'customer',
          evidence_type: input.evidence_url ? 'image' : undefined,
          evidence_url: input.evidence_url,
          verifier_name: input.logged_by,
          scope_reason: input.store_id,
          affects_op_score: false,
          affects_personal_multiplier: false,
          affects_customer_score: true, // Trừ trực tiếp vào tiêu chí Đánh Giá Khách Hàng (CSAT) của quán
          locks_personal_bonus: false,
          approval_status: 'proposed_manager',
        }
        await bscAdapter.addOperationError(dualOpRecord)
      }
    }

    // 3. Ghi vào mockViolationRecords để tương thích ngược với trang cũ nếu cần
    if (input.employee_id) {
      try {
        logViolation({
          employee_id: input.employee_id,
          store_id: input.store_id,
          violation_type_id: input.violation_code,
          logged_by: input.logged_by,
          logged_by_role: (input.logged_by_role as any) || 'manager',
          log_mode: 'realtime',
          occurred_at: input.occurred_at || nowIso,
          description: input.description,
          evidence_url: input.evidence_url,
        })
      } catch {
        // Safe catch for mock in-memory
      }
    }

    return { kpiIncident, bscErrorId }
  },
}
