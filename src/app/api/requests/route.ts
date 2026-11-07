import { NextRequest, NextResponse } from 'next/server'
import { getServerDb, saveServerDb, ServerRequest } from '@/lib/server/db'
import { getAuthenticatedUser } from '@/lib/server/auth-helper'

const ALLOWED_APPROVER_ROLES = ['ceo', 'hr_admin', 'store_manager', 'area_manager', 'shift_leader']

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const storeId = searchParams.get('store_id')
    const employeeId = searchParams.get('employee_id')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

    const db = await getServerDb()
    let list = db.requests || []

    if (storeId) {
      list = list.filter((r) => r.store_id === storeId)
    }

    if (employeeId) {
      list = list.filter((r) => r.employee_id === employeeId)
    }

    if (status) {
      list = list.filter((r) => r.status.toUpperCase() === status.toUpperCase())
    }

    if (type) {
      list = list.filter((r) => r.type === type)
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { id, request_id, action, employee_id, type, title, reason, amount, date, notes, approved_by, approver_name } = body
    const targetId = id || request_id

    const db = await getServerDb()
    if (!db.requests) db.requests = []

    // 1. Phê duyệt hoặc Từ chối đơn có sẵn (nếu có action = 'approve' | 'reject' hoặc có status)
    if (targetId && (action === 'approve' || action === 'reject' || body.status)) {
      const auth = await getAuthenticatedUser(req)
      if (!auth) {
        return NextResponse.json(
          { success: false, error: 'Vui lòng đăng nhập để phê duyệt đơn từ' },
          { status: 401 }
        )
      }

      if (!ALLOWED_APPROVER_ROLES.includes(auth.role)) {
        return NextResponse.json(
          { success: false, error: 'Không đủ thẩm quyền: Bạn không có quyền phê duyệt hoặc từ chối đơn' },
          { status: 403 }
        )
      }

      const idx = db.requests.findIndex((r) => r.id === targetId)
      if (idx < 0) {
        return NextResponse.json({ success: false, error: 'Không tìm thấy đơn yêu cầu' }, { status: 404 })
      }

      const statusFromAction = action === 'approve' ? 'APPROVED' : action === 'reject' ? 'REJECTED' : null
      const statusFromBody = body.status ? (String(body.status).toUpperCase() === 'APPROVED' ? 'APPROVED' : String(body.status).toUpperCase() === 'REJECTED' ? 'REJECTED' : 'PENDING') : 'PENDING'
      const newStatus: 'PENDING' | 'APPROVED' | 'REJECTED' = statusFromAction || statusFromBody
      const approverName = auth.employee?.full_name || auth.userId || 'Quản lý'

      db.requests[idx] = {
        ...db.requests[idx],
        status: newStatus,
        approved_by: approverName,
        approved_at: new Date().toISOString(),
        notes: notes || db.requests[idx].notes,
      }

      await saveServerDb(db)
      return NextResponse.json({
        success: true,
        message: `Đã ${newStatus === 'APPROVED' ? 'duyệt' : 'từ chối'} đơn thành công`,
        data: {
          ...db.requests[idx],
          status: 'approved', // hỗ trợ client kiểm tra lowercase
        },
      })
    }

    // 2. Tạo đơn mới
    if (!employee_id || !type || !reason) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc (employee_id, type, reason)' },
        { status: 400 }
      )
    }

    const emp = db.employees.find((e) => e.id === employee_id)

    const newRequest: ServerRequest = {
      id: id || `req-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      employee_id,
      employee_name: emp?.full_name || body.employee_name || 'Nhân sự',
      store_id: emp?.store_id || body.store_id || 'store-001',
      type,
      title: title || (type === 'leave' ? 'Đơn xin nghỉ phép' : type === 'salary_advance' ? 'Đề nghị tạm ứng lương' : type === 'shift_swap' ? 'Yêu cầu đổi ca' : 'Giải trình chấm công'),
      reason,
      amount: amount ? Number(amount) : undefined,
      date: date || new Date().toISOString().slice(0, 10),
      status: 'PENDING',
      created_at: new Date().toISOString(),
      notes: notes || '',
    }

    db.requests.unshift(newRequest)
    await saveServerDb(db)

    return NextResponse.json({
      success: true,
      message: 'Tạo đơn yêu cầu thành công',
      data: newRequest,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi hệ thống'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
