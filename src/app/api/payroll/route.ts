import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { ADMIN_ROLES, canAccessStore, hasRequiredRole, isChainWideRole, requireAuth } from '@/lib/server/auth-helper'


/**
 * Kiểm tra số tiền trên phiếu: không âm, không rỗng.
 * Phiếu máy chủ chưa lưu tăng ca/thuế/bảo hiểm riêng nên không so trần thực nhận được.
 */
function validateSlipAmounts(slip: {
  base_salary: number
  allowances: number
  bonus: number
  deductions: number
  late_deduction?: number
  net_salary: number
  work_days: number
}): string | null {
  const amounts = [slip.base_salary, slip.allowances, slip.bonus, slip.deductions, slip.late_deduction || 0, slip.net_salary, slip.work_days]
  if (amounts.some((n) => !Number.isFinite(n) || n < 0)) {
    return 'Số tiền trên phiếu lương không được âm hoặc để trống.'
  }
  return null
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '2026-08'
    const storeId = searchParams.get('store_id')

    const gate = await requireAuth(req)
    if (!gate.ok) return gate.response
    const auth = gate.user

    const db = await getServerDb()

    let summaries = db.payroll_summaries.filter((s) => s.period === period)
    let slips = db.salary_slips.filter((s) => s.period === period).map((s) => ({
      ...s,
      late_deduction: s.late_deduction || 0,
    }))

    if (storeId) {
      summaries = summaries.filter((s) => s.store_id === storeId)
      slips = slips.filter((s) => s.store_id === storeId)
    }

    // Phạm vi xem lương: CEO/HR/QL vùng xem toàn chuỗi; QL cửa hàng xem chi nhánh mình;
    // các vai trò khác chỉ xem phiếu lương của chính mình.
    if (!isChainWideRole(auth.role)) {
      if (auth.role === 'store_manager') {
        summaries = summaries.filter((s) => canAccessStore(auth, s.store_id))
        slips = slips.filter((s) => canAccessStore(auth, s.store_id) || s.employee_id === auth.userId)
      } else {
        slips = slips.filter((s) => s.employee_id === auth.userId)
        summaries = []
      }
    }

    return NextResponse.json({
      success: true,
      period,
      store_count: summaries.length,
      employee_count: slips.length,
      summaries,
      salary_slips: slips,
    })
  } catch (error: unknown) {
    console.error('[api/payroll]', error)
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const gate = await requireAuth(req)
    if (!gate.ok) return gate.response
    if (!hasRequiredRole(gate.user.role, ADMIN_ROLES)) {
      return NextResponse.json(
        { success: false, error: 'Chỉ Ban Giám đốc (CEO) hoặc Quản trị HR mới có quyền điều chỉnh bảng lương' },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const {
      id,
      employee_id,
      employee_name,
      employee_code,
      position,
      store_id,
      period,
      work_days,
      standard_days,
      base_salary,
      allowances,
      bonus,
      deductions,
      late_deduction,
      net_salary,
    } = body

    if (!employee_id || !period) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc (employee_id, period)' },
        { status: 400 }
      )
    }

    const db = await getServerDb()

    const existingSlip = db.salary_slips.find(
      (s) => (id && s.id === id) || (s.employee_id === employee_id && s.period === period)
    )
    // Chi nhánh của phiếu lấy từ phiếu đã có / hồ sơ nhân sự, không tin chi nhánh do client gửi
    const slipStoreId =
      existingSlip?.store_id ||
      db.employees.find((e) => e.id === employee_id)?.store_id ||
      store_id ||
      ''

    // 1. Kiểm tra trạng thái khóa sổ kỳ lương: khóa toàn chuỗi hoặc khóa đúng chi nhánh của phiếu đều chặn
    const isPeriodLocked = db.payroll_summaries.some(
      (p) =>
        p.period === period &&
        p.status === 'locked' &&
        (!p.store_id || ['all', 'ALL'].includes(p.store_id) || !slipStoreId || p.store_id === slipStoreId)
    )
    if (isPeriodLocked) {
      return NextResponse.json(
        {
          success: false,
          error: `Bảng lương kỳ ${period} đã bị khóa sổ. Không thể tạo mới hoặc điều chỉnh thêm.`,
        },
        { status: 400 }
      )
    }

    const existingIndex = db.salary_slips.findIndex(
      (s) => (id && s.id === id) || (s.employee_id === employee_id && s.period === period)
    )

    let slip: typeof db.salary_slips[0]

    if (existingIndex >= 0) {
      const current = db.salary_slips[existingIndex]
      // 2. Kiểm tra trạng thái khóa sổ của từng phiếu lương
      if (current.status === 'locked') {
        return NextResponse.json(
          {
            success: false,
            error: `Phiếu lương kỳ ${period} của nhân sự này đã bị khóa sổ. Không thể điều chỉnh thêm.`,
          },
          { status: 400 }
        )
      }

      const numericFields = [
        'work_days', 'standard_days', 'base_salary', 'allowances', 'bonus', 'deductions', 'net_salary',
      ] as const
      const updates: Record<string, unknown> = {}
      for (const f of numericFields) if (body[f] !== undefined) updates[f] = Number(body[f]) || 0
      for (const f of ['employee_name', 'employee_code', 'position'] as const) {
        if (typeof body[f] === 'string') updates[f] = body[f]
      }
      slip = {
        ...current,
        ...updates,
        late_deduction: late_deduction !== undefined ? Number(late_deduction) : (current.late_deduction || 0),
        id: current.id,
        period: current.period,
        employee_id: current.employee_id,
        // Khóa sổ chỉ đi qua /api/payroll/lock, không cho đổi trạng thái ở đây.
        status: current.status,
        needs_recalculation: false,
        updated_by: gate.user.userId,
        updated_at: new Date().toISOString(),
      }
      const invalid = validateSlipAmounts(slip)
      if (invalid) return NextResponse.json({ success: false, error: invalid }, { status: 400 })
      db.salary_slips[existingIndex] = slip
    } else {
      const newId = id || `slip-${period}-${employee_id}`
      slip = {
        id: newId,
        employee_id,
        employee_name: employee_name || 'Nhân sự',
        employee_code: employee_code || 'NV0000',
        position: position || 'Nhân viên',
        store_id: slipStoreId || 'store-001',
        period,
        work_days: Number(work_days || 0),
        standard_days: Number(standard_days || 26),
        base_salary: Number(base_salary || 0),
        allowances: Number(allowances || 0),
        bonus: Number(bonus || 0),
        deductions: Number(deductions || 0),
        late_deduction: Number(late_deduction || 0),
        net_salary: Number(net_salary || 0),
        status: 'draft',
        updated_by: gate.user.userId,
        updated_at: new Date().toISOString(),
      }
      const invalid = validateSlipAmounts(slip)
      if (invalid) return NextResponse.json({ success: false, error: invalid }, { status: 400 })
      db.salary_slips.push(slip)
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: existingIndex >= 0 ? 'Cập nhật phiếu lương thành công' : 'Tạo mới phiếu lương thành công',
      data: slip,
    })
  } catch (error: unknown) {
    console.error('[api/payroll]', error)
    return NextResponse.json({ success: false, error: 'Lỗi hệ thống' }, { status: 500 })
  }
}

