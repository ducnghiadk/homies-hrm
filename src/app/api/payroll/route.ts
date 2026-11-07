import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb } from '@/lib/server/db'
import { getAuthenticatedUser } from '@/lib/server/auth-helper'

const ALLOWED_PAYROLL_MANAGERS = ['ceo', 'hr_admin']

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '2026-08'
    const storeId = searchParams.get('store_id')

    const auth = await getAuthenticatedUser(req)

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

    // Bảo vệ quyền riêng tư: Nhân viên thường chỉ được xem phiếu lương của chính mình
    if (auth && auth.role === 'employee') {
      slips = slips.filter((s) => s.employee_id === auth.userId)
      summaries = []
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
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedUser(req)
    if (!auth || !ALLOWED_PAYROLL_MANAGERS.includes(auth.role)) {
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
      status,
    } = body

    if (!employee_id || !period) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc (employee_id, period)' },
        { status: 400 }
      )
    }

    const db = await getServerDb()

    // 1. Kiểm tra trạng thái khóa sổ kỳ lương của quán/toàn chuỗi
    const isPeriodLocked = db.payroll_summaries.some(
      (p) => p.period === period && (!store_id || p.store_id === store_id) && p.status === 'locked'
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

      slip = {
        ...current,
        ...body,
        late_deduction: late_deduction !== undefined ? Number(late_deduction) : (current.late_deduction || 0),
        id: current.id,
        period: current.period,
        employee_id: current.employee_id,
      }
      db.salary_slips[existingIndex] = slip
    } else {
      const newId = id || `slip-${period}-${employee_id}`
      slip = {
        id: newId,
        employee_id,
        employee_name: employee_name || 'Nhân sự',
        employee_code: employee_code || 'NV0000',
        position: position || 'Nhân viên',
        store_id: store_id || 'store-001',
        period,
        work_days: Number(work_days || 0),
        standard_days: Number(standard_days || 26),
        base_salary: Number(base_salary || 0),
        allowances: Number(allowances || 0),
        bonus: Number(bonus || 0),
        deductions: Number(deductions || 0),
        late_deduction: Number(late_deduction || 0),
        net_salary: Number(net_salary || 0),
        status: status || 'draft',
      }
      db.salary_slips.push(slip)
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: existingIndex >= 0 ? 'Cập nhật phiếu lương thành công' : 'Tạo mới phiếu lương thành công',
      data: slip,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

