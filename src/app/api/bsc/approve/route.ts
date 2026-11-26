import { NextRequest, NextResponse } from 'next/server'
import { ADMIN_ROLES, MANAGER_ROLES, canAccessStore, hasRequiredRole, requireAuth } from '@/lib/server/auth-helper'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { isRealDbMode } from '@/lib/adapters/repository-config'
import { supabase } from '@/lib/supabase'
import { calculateBSCTeamBonus } from '@/lib/bsc-engine'
import { estimateBonusWithholding } from '@/lib/payroll/pit'
import type { BSCEmployeePersonalData, BSCRevenueTarget, BSCPersonalErrorGroup } from '@/lib/bsc-types'

/**
 * POST /api/bsc/approve
 * Endpoint phê duyệt BSC dành riêng cho CEO:
 * - Khóa sổ và chuyển trạng thái thành approved_published
 * - Tự động tính toán tiền thưởng BSC cho từng nhân sự đủ điều kiện
 * - Đẩy trực tiếp số tiền thưởng vào phiếu lương tháng (/api/payroll)
 */
export async function POST(req: NextRequest) {
  // Quản lý gửi duyệt chi nhánh mình; chỉ CEO/HR được duyệt, từ chối, mở lại
  const gate = await requireAuth(req, MANAGER_ROLES)
  if (!gate.ok) return gate.response
  try {
    const body = await req.json()
    const { store_id, period, action = 'approve' } = body
    // Tên người duyệt lấy từ tài khoản đăng nhập, không tin tên do client gửi
    const approver_name = gate.user.employee?.full_name || gate.user.email || 'Quản lý'
    const isSubmit = action === 'submit' || action === 'submit_ceo'
    if (!isSubmit && !hasRequiredRole(gate.user.role, ADMIN_ROLES)) {
      return NextResponse.json({ success: false, error: 'Chỉ CEO hoặc HR mới được duyệt quyết toán BSC.' }, { status: 403 })
    }
    if (isSubmit && !canAccessStore(gate.user, store_id)) {
      return NextResponse.json({ success: false, error: 'Bạn không quản lý chi nhánh này.' }, { status: 403 })
    }

    if (!store_id || !period) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc (store_id, period)' },
        { status: 400 }
      )
    }

    const db = await getServerDb()
    if (!db.bsc_targets) db.bsc_targets = []

    const targetIdx = db.bsc_targets.findIndex(
      t => t.store_id === store_id && t.period === period
    )

    if (targetIdx === -1) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy bảng quyết toán BSC cho kỳ này' },
        { status: 404 }
      )
    }

    const currentTarget = db.bsc_targets[targetIdx]

    // ── XỬ LÝ HÀNH ĐỘNG TỪ CEO ──
    if (action === 'reject' || action === 'reopen_draft') {
      currentTarget.approval_status = 'draft'
      currentTarget.approved_by = undefined
      currentTarget.approved_at = undefined
      currentTarget.updated_at = new Date().toISOString()

      db.bsc_targets[targetIdx] = currentTarget
      await saveServerDb(db)

      if (isRealDbMode()) {
        try {
          await supabase.from('bsc_muc_tieu_doanh_thu').update({
            trang_thai_duyet: 'draft',
            nguoi_duyet: null,
            ngay_duyet: null,
          }).eq('cua_hang_id', store_id).eq('ky_luong_id', period)
        } catch (err) {
          console.warn('[API /api/bsc/approve] Supabase update warning:', err)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Đã chuyển trạng thái về Bản nháp (draft) để quản lý cửa hàng rà soát lại.',
        approval_status: 'draft',
      })
    }

    // ── XỬ LÝ HÀNH ĐỘNG GỬI DUYỆT TỪ QUẢN LÝ (SUBMIT) ──
    if (action === 'submit' || action === 'submit_ceo') {
      currentTarget.approval_status = 'pending_ceo'
      currentTarget.submitted_by = approver_name || 'Quản lý Huỳnh Lê Kiều Linh'
      currentTarget.submitted_at = new Date().toISOString()
      currentTarget.updated_at = new Date().toISOString()
      db.bsc_targets[targetIdx] = currentTarget
      await saveServerDb(db)

      if (isRealDbMode()) {
        try {
          await supabase.from('bsc_muc_tieu_doanh_thu').update({
            trang_thai_duyet: 'pending_ceo',
          }).eq('cua_hang_id', store_id).eq('ky_luong_id', period)
        } catch (err) {
          console.warn('[API /api/bsc/approve] Supabase update warning:', err)
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Quản lý đã duyệt và gửi bản quyết toán BSC lên CEO phê duyệt thành công!',
        approval_status: 'pending_ceo',
      })
    }

    if (action === 'reopen') {
      currentTarget.approval_status = 'pending_ceo'
      currentTarget.updated_at = new Date().toISOString()
      db.bsc_targets[targetIdx] = currentTarget
      await saveServerDb(db)

      return NextResponse.json({
        success: true,
        message: 'Đã mở lại chế độ chờ CEO duyệt.',
        approval_status: 'pending_ceo',
      })
    }

    // ── HÀNH ĐỘNG PHÊ DUYỆT & BAN HÀNH (APPROVE) ──
    // Kỳ lương đã khóa sổ (toàn chuỗi hoặc đúng chi nhánh) thì không đẩy thưởng vào được nữa.
    const isPayrollLocked = (db.payroll_summaries || []).some(
      (p) =>
        p.period === period &&
        p.status === 'locked' &&
        (!p.store_id || ['all', 'ALL'].includes(p.store_id) || p.store_id === store_id)
    )
    if (isPayrollLocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Bảng lương kỳ ${period} đã khóa sổ. Cần mở khóa kỳ lương trước khi ban hành thưởng BSC, hoặc đưa thưởng sang kỳ sau.`,
        },
        { status: 400 }
      )
    }

    const nowIso = new Date().toISOString()
    currentTarget.approval_status = 'approved_published'
    currentTarget.approved_by = approver_name
    currentTarget.approved_at = nowIso
    currentTarget.updated_at = nowIso
    db.bsc_targets[targetIdx] = currentTarget

    // 1. Chuẩn bị dữ liệu nhân sự để tính thưởng BSC từ bảng lương và nhân viên
    const storeEmployees = db.employees.filter(
      emp => (emp.store_id === store_id || (emp.secondary_store_ids && emp.secondary_store_ids.includes(store_id))) &&
             emp.status !== 'resigned' &&
             emp.role !== 'ceo' && emp.role !== 'hr_admin' &&
             db.salary_slips.some(s => (s.employee_id === emp.id || s.employee_code === emp.employee_code) && s.period === period)
    )

    const empDataList: BSCEmployeePersonalData[] = storeEmployees.map(emp => {
      const existingSlip = db.salary_slips.find(
        s => (s.employee_id === emp.id || s.employee_code === emp.employee_code) && s.period === period
      )
      const workHours = existingSlip?.total_hours && existingSlip.total_hours > 0
        ? existingSlip.total_hours
        : 120 // Mặc định đủ giờ nếu chưa chốt công

      // Lấy lỗi cá nhân từ nhật ký bsc_logs
      const personalLogs = (db.bsc_logs || []).filter(
        l => l.employee_id === emp.id && l.period === period && l.log_type === 'personal'
      )
      const errors = personalLogs.map(l => ({
        id: l.id,
        event_id: l.event_id || l.id,
        employee_id: emp.id,
        period: period as any,
        group: (l.group_key || 'khac') as BSCPersonalErrorGroup,
        group_name: l.group_name,
        sub_error_id: l.sub_error_id || 'ERR-01',
        sub_error_name: l.sub_error_name || l.group_name,
        example: l.sub_error_name || l.group_name,
        impact: '',
        points: l.points,
        occurred_at: l.occurred_at,
        is_serious: Boolean(l.locks_personal_bonus),
        approval_status: 'approved_ceo' as const,
      }))

      return {
        employee_id: emp.id,
        employee_name: emp.full_name,
        role: (emp.role || 'employee') as BSCEmployeePersonalData['role'],
        store_id,
        period,
        work_hours: workHours,
        errors,
      }
    })

    // 2. Chạy BSC Engine để tính toán tiền thưởng từng người
    const targetSource: BSCRevenueTarget[] = [{
      ...currentTarget,
      target_mode: (currentTarget.target_mode as 'auto_3_6_months' | 'manual') || 'auto_3_6_months',
      store_name: currentTarget.store_name || 'Homies Milk Tea',
      is_unlocked: Boolean(currentTarget.is_unlocked ?? true),
      approval_status: 'approved_published',
    }]

    const teamSummary = calculateBSCTeamBonus(
      store_id,
      period,
      targetSource,
      empDataList
    )

    // 3. Đẩy số tiền thưởng BSC vào bảng tính lương (db.salary_slips)
    const distributedBonuses: Array<{ employee_id: string; employee_name: string; bonus_amount: number; bonus_tax_withheld: number; net_salary: number }> = []

    for (const result of teamSummary.individual_results) {
      const bscBonus = result.bonus_amount || 0
      // Chỉ ghép theo mã nhân viên, không ghép theo họ tên (dễ trùng tên)
      const resultEmp = db.employees.find(e => e.id === result.employee_id)
      const slipIdx = db.salary_slips.findIndex(
        s =>
          s.period === period &&
          (s.employee_id === result.employee_id ||
            (!!resultEmp?.employee_code && s.employee_code === resultEmp.employee_code))
      )

      // Không sửa phiếu lương đã khóa sổ
      if (slipIdx >= 0 && db.salary_slips[slipIdx].status !== 'locked') {
        const currentSlip = db.salary_slips[slipIdx]
        // Thưởng BSC lưu riêng ở bsc_bonus để lưu phiếu lương (phiếu cộng tiền tay) không ghi đè mất.
        // Phiếu cũ (trước khi tách) đã ghi thưởng BSC vào `bonus` kèm bonus_tax_withheld.
        const isLegacyBsc = currentSlip.bsc_bonus === undefined && currentSlip.bonus_tax_withheld !== undefined
        const oldBonus = isLegacyBsc ? (currentSlip.bonus || 0) : (currentSlip.bsc_bonus || 0)
        const newBonus = bscBonus

        // Bảo toàn phần thực nhận trước thưởng BSC (hoàn lại thuế đã tạm khấu trừ của lần duyệt trước)
        const oldWithheld = currentSlip.bonus_tax_withheld || 0
        const netBeforeBonus = (currentSlip.net_salary || 0) - oldBonus + oldWithheld

        // Tạm khấu trừ thuế TNCN trên phần thưởng theo Cài đặt lương
        const isPartTime = !resultEmp?.base_salary && (resultEmp?.hourly_rate || 0) > 0
        const incomeBeforeBonus = (currentSlip.base_salary || 0) + (currentSlip.allowances || 0)
        const bonusTax = estimateBonusWithholding({
          incomeBeforeBonus,
          bonus: newBonus,
          isPartTime,
          settings: db.payroll_tax_settings,
        })
        const netSalary = Math.max(0, Math.round(netBeforeBonus + newBonus - bonusTax))

        db.salary_slips[slipIdx] = {
          ...currentSlip,
          ...(isLegacyBsc ? { bonus: 0 } : {}),
          bsc_bonus: newBonus,
          bonus_tax_withheld: bonusTax,
          net_salary: netSalary,
          needs_recalculation: true,
          updated_by: gate.user.userId,
          updated_at: nowIso,
        }

        distributedBonuses.push({
          employee_id: currentSlip.employee_id,
          employee_name: currentSlip.employee_name,
          bonus_amount: newBonus,
          bonus_tax_withheld: bonusTax,
          net_salary: netSalary,
        })
      } else if (slipIdx < 0 && bscBonus > 0 && resultEmp) {
        // Chưa có phiếu lương kỳ này: tạo phiếu nháp chỉ giữ thưởng BSC để không mất thưởng.
        // Lương, thuế, bảo hiểm sẽ được tính đầy đủ khi kế toán bấm Tính lương.
        db.salary_slips.push({
          id: `slip-${period}-${resultEmp.id}`,
          employee_id: resultEmp.id,
          employee_name: resultEmp.full_name,
          employee_code: resultEmp.employee_code || '',
          position: '',
          store_id: resultEmp.store_id || store_id,
          period,
          work_days: 0,
          standard_days: 0,
          base_salary: 0,
          allowances: 0,
          bonus: 0,
          bsc_bonus: bscBonus,
          deductions: 0,
          net_salary: 0,
          status: 'draft',
          needs_recalculation: true,
          updated_by: gate.user.userId,
          updated_at: nowIso,
        })
        distributedBonuses.push({
          employee_id: resultEmp.id,
          employee_name: resultEmp.full_name,
          bonus_amount: bscBonus,
          bonus_tax_withheld: 0,
          net_salary: 0,
        })
      }
    }

    // 4. Cập nhật bảng tổng kết lương payroll_summaries
    if (db.payroll_summaries) {
      const summaryIdx = db.payroll_summaries.findIndex(
        s => s.store_id === store_id && s.period === period
      )
      const storeSlips = db.salary_slips.filter(
        s => s.store_id === store_id && s.period === period
      )
      const totalNet = storeSlips.reduce((sum, s) => sum + s.net_salary, 0)
      const totalBonus = storeSlips.reduce((sum, s) => sum + (s.bonus || 0) + (s.bsc_bonus || 0), 0)

      if (summaryIdx >= 0) {
        db.payroll_summaries[summaryIdx].total_net = totalNet
        db.payroll_summaries[summaryIdx].total_bonus = totalBonus
      }
    }

    // 5. Cập nhật Supabase nếu có
    if (isRealDbMode()) {
      try {
        await supabase.from('bsc_muc_tieu_doanh_thu').update({
          trang_thai_duyet: 'approved_published',
          nguoi_duyet: approver_name,
          ngay_duyet: nowIso,
          updated_at: nowIso,
        }).eq('cua_hang_id', store_id).eq('ky_luong_id', period)
      } catch (err) {
        console.warn('[API /api/bsc/approve] Supabase update warning:', err)
      }
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: `${approver_name} đã phê duyệt & ban hành quyết toán BSC. Tiền thưởng ${new Intl.NumberFormat('vi-VN').format(teamSummary.total_distributed_bonus_amount)} đ đã được đẩy vào phiếu lương nhân viên!`,
      approval_status: 'approved_published',
      approved_by: approver_name,
      approved_at: nowIso,
      store_bonus_pool: teamSummary.store_result.store_bonus_pool,
      total_distributed_bonus: teamSummary.total_distributed_bonus_amount,
      retained_bonus: teamSummary.retained_bonus_amount,
      distributed_bonuses: distributedBonuses,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống khi phê duyệt BSC'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
