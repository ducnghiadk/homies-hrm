import { NextRequest, NextResponse } from 'next/server'
import { getServerDb } from '@/lib/server/db'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || '2026-08'
    const storeId = searchParams.get('store_id')

    const db = await getServerDb()

    // 1. Lọc phiếu lương trong kỳ
    let slips = db.salary_slips.filter((s) => s.period === period)
    let shifts = db.shifts.filter((s) => s.date.startsWith(period) && s.status === 'APPROVED')

    if (storeId) {
      slips = slips.filter((s) => s.store_id === storeId)
      shifts = shifts.filter((s) => s.store_id === storeId)
    }

    const totalNetPayroll = slips.reduce((sum, s) => sum + s.net_salary, 0)
    const totalBaseSalary = slips.reduce((sum, s) => sum + (s.base_salary || 0), 0)
    const totalBonus = slips.reduce((sum, s) => sum + (s.bonus || 0), 0)
    const totalDeductions = slips.reduce((sum, s) => sum + (s.deductions || 0), 0)
    const totalWorkDays = slips.reduce((sum, s) => sum + (s.work_days || 0), 0)
    const totalHours = slips.reduce((sum, s) => sum + (s.total_hours || 0), 0)

    // 2. Báo cáo phân bổ theo chi nhánh (các chi nhánh hoạt động thực tế trong kỳ)
    const activeStores = db.stores.filter(
      (s) => s.is_active !== false && (slips.some((sl) => sl.store_id === s.id) || shifts.some((sh) => sh.store_id === s.id))
    )
    const byStore = activeStores.map((store) => {
      const storeSlips = slips.filter((s) => s.store_id === store.id)
      const storeShifts = shifts.filter((s) => s.store_id === store.id)
      const storePayroll = storeSlips.reduce((sum, s) => sum + s.net_salary, 0)
      const storeHours = storeSlips.reduce((sum, s) => sum + (s.total_hours || 0), 0)

      return {
        store_id: store.id,
        store_name: store.name,
        headcount: storeSlips.length,
        total_shifts: storeShifts.length,
        total_hours: Math.round(storeHours * 10) / 10,
        total_net_payroll: storePayroll,
        average_hourly_cost: storeHours > 0 ? Math.round(storePayroll / storeHours) : 0,
      }
    })

    // 3. Phân bổ theo loại hình nhân viên (Full-time vs Part-time)
    const fullTimeSlips = slips.filter((s) => s.base_salary > 0)
    const partTimeSlips = slips.filter((s) => !s.base_salary || s.base_salary === 0)

    const byEmploymentType = {
      full_time: {
        count: fullTimeSlips.length,
        total_payroll: fullTimeSlips.reduce((sum, s) => sum + s.net_salary, 0),
        average_salary: fullTimeSlips.length > 0 ? Math.round(fullTimeSlips.reduce((sum, s) => sum + s.net_salary, 0) / fullTimeSlips.length) : 0,
      },
      part_time: {
        count: partTimeSlips.length,
        total_payroll: partTimeSlips.reduce((sum, s) => sum + s.net_salary, 0),
        total_hours: Math.round(partTimeSlips.reduce((sum, s) => sum + (s.total_hours || 0), 0) * 10) / 10,
        average_hourly_rate: partTimeSlips.length > 0 ? Math.round(partTimeSlips.reduce((sum, s) => sum + (s.net_salary / (s.total_hours || 1)), 0) / partTimeSlips.length) : 0,
      },
    }

    const reportData = {
      summary: {
        total_headcount: slips.length,
        total_shifts: shifts.length,
        total_hours: Math.round(totalHours * 10) / 10,
        total_work_days: totalWorkDays,
        total_net_payroll: totalNetPayroll,
        total_base_salary: totalBaseSalary,
        total_tip_bonus: totalBonus,
        total_deductions: totalDeductions,
        average_labor_cost_per_shift: shifts.length > 0 ? Math.round(totalNetPayroll / shifts.length) : 0,
      },
      by_store: byStore,
      by_employment_type: byEmploymentType,
      by_employment: byEmploymentType,
    }

    return NextResponse.json({
      success: true,
      period,
      ...reportData,
      data: reportData,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
