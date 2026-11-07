import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, ServerViolationIncident } from '@/lib/server/db'

// GET /api/kpi/incidents: Lấy danh sách vi phạm kỷ luật chấm công và sự cố vận hành
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('store_id')
    const employeeId = searchParams.get('employee_id')
    const month = searchParams.get('month') || searchParams.get('period')
    const violationCode = searchParams.get('violation_code')

    const db = await getServerDb()
    let list: ServerViolationIncident[] = db.incidents || []

    if (storeId && storeId !== 'all') {
      list = list.filter((item) => item.store_id === storeId)
    }

    if (employeeId) {
      list = list.filter((item) => item.employee_id === employeeId)
    }

    if (month) {
      list = list.filter((item) => item.occurred_at && item.occurred_at.startsWith(month))
    }

    if (violationCode) {
      list = list.filter((item) => item.violation_code === violationCode)
    }

    return NextResponse.json({
      success: true,
      count: list.length,
      data: list,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST /api/kpi/incidents: Tạo hoặc ghi nhận sự cố vi phạm kỷ luật mới
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      employee_id,
      store_id,
      violation_code,
      reason,
      description,
      penalty_amount,
      evidence_refs,
      occurred_at,
      status,
    } = body

    if (!employee_id || !violation_code) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc (employee_id, violation_code)' },
        { status: 400 }
      )
    }

    const db = await getServerDb()
    if (!db.incidents) db.incidents = []

    const emp = db.employees.find((e) => e.id === employee_id)
    const now = new Date().toISOString()

    const newIncident: ServerViolationIncident = {
      id: body.id || `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      store_id: store_id || emp?.store_id || 'store-001',
      employee_id,
      employee_name: emp?.full_name || body.employee_name || 'Nhân sự',
      occurred_at: occurred_at || now,
      source: body.source || 'attendance',
      status: status || 'confirmed',
      violation_code,
      reason: reason || 'Lỗi kỷ luật chấm công',
      description: description || `Vi phạm kỷ luật: ${violation_code}`,
      penalty_amount: Number(penalty_amount || 0),
      evidence_refs: Array.isArray(evidence_refs) ? evidence_refs : [],
      created_at: now,
    }

    db.incidents.unshift(newIncident)

    // Nếu có tiền phạt > 0, cập nhật vào bảng lương tháng tương ứng
    if (newIncident.penalty_amount > 0) {
      const period = (newIncident.occurred_at || now).slice(0, 7)
      if (!db.salary_slips) db.salary_slips = []
      const slipIdx = db.salary_slips.findIndex(
        (s) => s.employee_id === employee_id && s.period === period
      )
      if (slipIdx >= 0) {
        const slip = db.salary_slips[slipIdx]
        slip.late_deduction = (slip.late_deduction || 0) + newIncident.penalty_amount
        slip.deductions = (slip.deductions || 0) + newIncident.penalty_amount
        slip.net_salary = Math.max(0, (slip.net_salary || 0) - newIncident.penalty_amount)
      }
    }

    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: 'Ghi nhận hồ sơ vi phạm kỷ luật thành công',
      data: newIncident,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
